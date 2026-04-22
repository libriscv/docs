---
slug: expert-example
title: "State-of-the-art C++ scripting with libriscv"
authors: [gonzo]
tags: [libriscv, examples, advanced]
---

Hey. I've pushed a new `expert` example [to the libriscv repository](https://github.com/libriscv/libriscv/tree/master/examples/expert) that represents where I've landed after years of using libriscv as a scripting API in my projects. It's the approach I use in my own game I'm working on, and it covers everything from generated function stubs to inter-VM RPC. If you've been looking at libriscv and wondering what a production setup looks like, this is how I'm personally using it.

<!--truncate-->

## The expert example

Existing examples in the libriscv repo are meant to show how to use it from zero up to a certain point, but it quickly gets complicated when you're building something real. The expert example is a self-contained project that demonstrates all the pieces together: JSON defines the host-guest API, a Python code generator produces reliable function wrappers, and two-phase function resolution guarantees that *initialization-only* functions only work during initialization, preventing real footguns. There are also type-safe event wrappers, helpers for in-guest C++ classes and working RPC between VM instances, all of which I use extensively.

I used to have things like shared memory between instances, ways to call into other instances by merging them, etc. Fancy shit that I don't actually use, and I've cut that away. I will say though that adding shared memory is trivial: Just insert the same pages in all your instances outside of the flat arena, and make them non-owning.

## Host functions JSON

```json
{
  "typedef": [
    "typedef void (*rpc_callback_t)(void*)"
  ],
  "initialization": ["Game::init_example"],

  "Math::add": "int sys_math_add (int, int)",
  "Math::multiply": "int sys_math_multiply (int, int)",
  "IO::print": "void sys_io_print (const char*)",
  "Game::get_time": "double sys_game_get_time ()",
  "Game::init_example": "void sys_game_init_example (const char*)",
  "RPC::callback": "void sys_rpc_callback (rpc_callback_t, void*, size_t)",
  "RPC::invoke": "long sys_rpc_invoke (rpc_callback_t, void*, size_t)"
}
```

A Python script (`generate.py`) reads this and produces a C header with extern declarations and a C source file with tiny assembly stubs. Each stub is just a custom RISC-V instruction (`0b1011011`) with an index into a dispatch table, followed by `ret`. The host intercepts these unimplemented instructions and dispatches to the right handler. CRC32 hashes of the function signatures are used for validation, so if you change a signature on one side and forget the other, _it won't silently do the wrong thing_.

On the guest side, calling a host function looks like calling any other C function:

```cpp
int sum = sys_math_add(17, 25);
sys_io_print("Hello from the guest!");
double t = sys_game_get_time();
```

And you *are* supposed to wrap it in your own shit:

```cpp
int sum = Math::add(17, 25);
print("Hello from {}!", std::string("the guest"));
const double t = GameTime::now();
```

Print uses fmtlib for formatting. Don't be lazy.

## Two-phase resolution

Some functions should only be available during initialization. In my game, things like world setup and asset loading happen in an init phase, and I don't want scripts calling those at runtime. The expert example supports this by marking functions as initialization-only. During resolution, the host builds an array of function handlers, and init-only functions get replaced with a handler that throws if called after boot:

```cpp
script.resolve_host_functions(/*initialization=*/true);
// Call on_init — init-only functions are available here
on_init();

script.resolve_host_functions(/*initialization=*/false);
// Now init-only functions will throw if called
```

The same mechanism supports client-side-only and server-side-only functions, which matters when you have the same guest binary running in different contexts. You can expand on this any way you want, like functions that don't work at init-time, such as RPC.

## Inline assembly is a footgun

The generated stubs you see in the example today use plain assembly (`.insn` directives in a `.c` file), but for a long time I also generated `isys_host_func` variants: static inline functions that used GCC's `register asm` to pin arguments into the right RISC-V registers (A0 through A7) before executing the custom instruction. These wrappers avoided the overhead of a function call for trivial host functions, and they worked great most of the time. The instruction savings and optimization potential was and still is extremely evident in the objdump output.

As an example, imagine normalizing a vec3 in an interpreter: Load 3 floats, compute `x*x + y*y + z*z` (the dot product), compute inverse square root. In an interpreter with an embedded libm, it's an expensive process to do even parts of this as every instruction is ~10 real instructions. With an inline wrapper the rule is that the compiler needs to shuffle x into fa0, y into fa1 and z into fa1 and then execute a custom instruction with a given immediate. In some cases this whole thing is a single RISC-V instruction to only invoke the system call, because the compiler will make sure x, y and z are in those registers the whole time just to satisfy the normalize syscall register pinnings. That just leaves the host-side `glm::normalize(x, y, z)` which translates to `v * inversesqrt(dot(v, v))` in GLM, and likely uses SIMD. The end result is that while you are writing `vec3 v = v.normalized()` in your script, it's nearly native performance despite running in an interpreter. See one of my previous blog posts for the proof.

In any case, I disabled inline assembly altogether. The problem I experienced during working on a private hobby project was very likely related to when the input and output pinnings were different. Say the input was a pointer and the output was an integer, I suspect the register constraints for two different A0 pinnings didn't always do the right thing. To be honest I'm not quite sure what to do when A0 in and A0 out are two completely different types. But, it was the kind of bug that works in 99% of cases and then silently corrupts things, and the emulator didn't do anything wrong.

I found this out the hard way. A host function that passed coordinates started passing garbage coordinates in one specific call pattern. By the time I noticed, it had corrupted part of a world I was actively building. I had to stop what I was doing, figure out what went wrong, and then spend hours repairing it. That's the kind of thing that destroys progress and morale when you're working on a creative project. If you can't trust your tools, you risk paranoia and burnout.

I ended up just disabling it entirely and switched to the plain C function wrappers. The performance difference simply can't be measured because script execution doesn't even show on the callgraph.

You might be reading this and thinking that I will never bring them back because the downside is too big. Unfortunately, I'm too dumb to learn from this. My plan is to create a large test suite for inline assembly and then re-enable it all at once, as in *every single wrapper* is now inline assembly. One  problem I have to solve before I can even make the testsuite is how to reliably detect constraint violations or undefined behavior in something as obscure as inline assembly. If you've ever asked an LLM about inline assembly before, you'll know that they regularly (all of them) present things that are completely wrong and will create ghosts in your machine.


## RPC between VMs

One of the more interesting features in the new example project is RPC between VM instances. It shows that you can set up two script instances as "peers" and have one invoke a lambda on the other:

```cpp
vec3 v(1.0f, 2.0f, 3.0f);
invoke_elsewhere([v]() {
	print("On the server: v = {}", v);
});
```

The lambda's captures are copied out of the calling VM's memory and into the target VM, where the callback is executed. This is how I handle a lot of simple network communication in my game. With this it's trivial to invoke logic on the server's VM instance from a client, and vice versa.

The capture size is limited to 24 bytes (checked at compile time with `static_assert`), and captures must be trivially copyable. These constraints keep the mechanism simple and predictable. Note that on a real project you will add extra arguments for passing more data and even serializable documents along with RPC function calls. Here is a real RPC call:

```cpp
Game::server_rpc_attrs(attrs,
[entUID = ent.getUID()] (Player, const Attributes& attrs)
{
	Entity ent{entUID};
	if (!ent.isValid()) {
		print("Entity with UID {} is no longer valid\n", entUID);
		return;
	}

	print("Applying attributes:\n{}\n", attrs.toString());
	...
});
```

A snippet from my own project. I'm passing a whole "document" type along with the RPC call. My `Attributes` type is a JSON-like structure that I can pass to and from my script instances, and to and from network RPC calls. In this case, the client is in a dialogue which is activating an event with attributes attached to it, eg. a condition needs to be checked to know where to branch. Conditions have to be checked on the server so we enter a libriscv script instance, with the dialogue condition specified in `attrs`, for example "if the held items shop price is >= 200 branch to the true dialogue, otherwise the false dialogue". This makes it possible for a shop keeper to say something different for an expensive item you are about to buy. While the condition is executed on the server, the client keeps the dialogue open, and after the next dialogue is known the server will activate that dialogue through RPC back on the client:

```cpp
Game::player_rpc(Player::Current().getUID(), nextDialogue,
[entUID] (Player, std::string_view dialogueName)
{
	Entity ent{entUID};
	if (dialogueName.empty()) {
		ent.EndDialogue();
	} else {
		ent.startDialogue(dialogueName);
	}
});
```

I've used this method for years, and I trust it fully. Now you can use it too!

## Type-safe event wrappers

The `Event<F>` template wraps a guest function address with compile-time type checking:

```cpp
Event<int(int, int)> compute(script, "compute");
if (auto ret = compute(17, 25))
    printf("Result: %d\n", *ret);
```

It uses `std::is_invocable_v` to verify at compile time that you're passing the right argument types, and returns `std::optional` so you can handle the case where the call fails (timeout, exception, function not found). It's a small thing but it eliminates an entire class of mistakes.

## Passing complex data structures

The host can allocate a `std::string` or a `std::vector<std::string>` directly on the guest's heap, and the guest sees a real, C++ standard-library object.

This is possible because of two things: the guest's heap is taken over by the host (redirecting malloc/calloc/realloc/free to arena syscalls), and libriscv provides `GuestStdString` and `GuestStdVector` types that mirror the exact libstdc++ memory layout, including Small String Optimization. The host constructs these objects in guest memory, and because they live on a shared arena, the guest can read, modify, and even take ownership of them.

For the record you can also override the global allocator in Rust for the same effect, and yes, I have implemented Rust types for guest programs. You only need to know the ABI, and then don't switch into some version that breaks it. In the case of the C++ types, I have a test-suite for them that will tell me if something changes. It won't.

Here's the host passing a `std::string` to the guest:

```cpp
using CppString = GuestStdString<Script::MARCH>;
template <typename T>
using ScopedArenaObject = riscv::ScopedArenaObject<Script::MARCH, T>;

ScopedArenaObject<CppString> str(script.machine(), "Arena World");
Event<void(ScopedArenaObject<CppString>&)> greet_string(script, "greet_string");
greet_string(str);
```

And the guest receives a normal `const std::string&`:

```cpp
PUBLIC(void greet_string(const std::string& name))
{
    std::string result = "Hello, " + name + "! (via std::string&)";
    printf("%s\n", result.c_str());
}
```

The really interesting part is ownership transfer. The host can allocate a string, hand it to the guest, and the guest can `std::move` it into its own storage:

```cpp
// Guest side:
static std::string stored_string;

PUBLIC(void take_string(std::string& s))
{
    stored_string = std::move(s);  // Guest takes ownership
}
PUBLIC(void print_stored())
{
	print("The stored string was: {}", stored_string);
}
```

After the move, the host-side `ScopedArenaObject<CppString>` sees an empty string. Its destructor frees the now-empty struct, but the string lives on in the guest's static variable. A later call to `print_stored()` shows that the guest still owns it. This works because `GuestStdString::free()` works the same way as a regular C++ string, in that nothing happens if it's already been moved on.

The same pattern works for vectors and vectors of strings:

```cpp
template <typename T>
using CppVector = riscv::GuestStdVector<Script::MARCH, T>;

// Create a vector of strings on the guest heap
CppVector<CppString> strvec(machine, {"hello", "world"});
```

The guest receives a real `std::vector<std::string>` by reference that it can iterate, index, push_back into, and move around.

Being able to hand C++-looking familiar structured data to the guest and let it own that data, using normal C++ semantics, removes a lot of the pain and footgunnery that usually comes with sandboxed scripting.

### Example Structure

The guest defines a `Dialogue` struct using normal C++ types (`std::string`, `std::vector`):

```cpp
// Guest code
struct Dialogue {
    std::string name;
    std::string portrait;
    std::string voice;
    std::vector<DialogueText> texts;
    bool cancellable;
    std::vector<DialogueChoice> choices;
    // ...
};

// Guest passes it to host
sys_npc_do_dialogue(entity_uid, &dialogue, sizeof(dialogue));
```

The host defines a sandbox-safe mirror:

```cpp
// Host code - mirrors the guest struct layout exactly
struct GuestDialogue {
    CppString name;
    CppString portrait;
    CppString voice;
    CppVector<GuestText> texts;
    bool cancellable;
    CppVector<GuestChoice> choices;
    // ... more fields
};
```

In the host function handler:

```cpp
auto [uid, g_view, g_size] = script.machine().sysargs<uint32_t, const GuestDialogue*, gaddr_t>();

// Validating that the size matches has no real purpose other than to give useful
// info when the guest and host has deviated. It has nothing to do with sandbox safety:
if (g_size != sizeof(GuestDialogue)) { /* error */ }

// Safe, direct access:
const GuestDialogue& guestDialogue = *g_view;

// View strings zero-copy
std::string_view name = guestDialogue.name.to_view(machine);

// Iterate over guest vector zero-copy
std::span<const GuestText> texts = guestDialogue.texts.to_span(machine);
for (auto& text : texts) {
    std::string content = text.text.to_string(machine);
    // Process text...
}

// Access nested vectors
for (auto& choice : guestDialogue.choices.to_span(machine)) {
    std::string choiceText = choice.text.to_string(machine);
    // Process choice...
}
```

The `GuestDialogue*` returned by `sysargs` is a verified pointer into guest memory (flat arena). The `CppString` and `CppVector` fields are read in-place. String data is accessed through `to_string()` (copy) or `to_view()` (zero-copy view). Vector elements are accessed through `to_span()` (zero-copy span). Asking for a const pointer will enable the guest to pass structures from rodata, eg. a `static const Dialogue dlg`.


## Nested calls and depth metering

Guest functions can call host functions, and host functions can call back into the guest. This happens regularly in real projects, and it's extremely important to handle recursion correctly. The expert example includes a `ScriptDepthMeter` that tracks call depth and caps it at 8 levels. The first call uses `vmcall`, and nested calls use `preempt` which saves and restores the VM state properly. 

## Pause/resume-based VMs

You can use pause/resume in libriscv, but it's not my kind of jam, so I don't write much about it. I have used pause/resume when I wanted to do something like statistical sampling (run for a little bit, grab a PC sample, continue) for profiling in Godot Sandbox. It works well enough but since the script is never a bottleneck (or hasn't been so far), I just don't think it's worth spending time on it.

You can make an event loop with a work queue, of course, if you have a custom language you want to embed that doesn't like getting randomly called into, and you'd rather pause in a while-loop. The prime example being JavaScript, but... something like QuickJS is quite capable of getting called into. In any case, just pop into my Discord if you really want to do something like this, and I'll give you some pointers.

## Try it

The example is self-contained. Clone libriscv, run `build.sh` in `examples/expert/`, and you'll get a host binary that exercises every feature: generated host functions, two-phase resolution, string and array passing, lambda callbacks, inter-VM RPC, and a latency benchmark.

I also distilled the example project into an AGENTS.md in the repository root, which explains some additional decision-making and architectural details. More and more people have been using libriscv lately, and I suspect it's because of LLMs making it easier to start using complex projects like libriscv where there's a knowledge barrier to entry. The goal is to make people able to integrate libriscv in their shit that matches how I am currently using it.

Thanks for reading!
