---
sidebar_position: 4
---

# Design

## Restrictive

Godot Sandbox is a tools-not-policies approach to sandboxing. It gives you everything you need to successfully sandbox anything, with potentially access to everything that GDScript also has access to.

:::note

The Sandbox is by default completely open, allowing you access to everything. This is intentional for development.

:::

After enabling restrictions, the Sandbox fully closes, and will only allow access to exactly what you specify through Callables.


:::warning

Changing restrictions is disabled if the Sandbox is in the middle of a call. This is a security feature, so that changing restrictions even indirectly is impossible.

:::

If you need to change restrictions during a Sandbox call, wait until the call is finished and then change them. Or the next frame.


## Low-latency

A major design goal is having the lowest latency between the Sandbox and the Godot engine. As a result, calling functions, and in general communicating things back and forth with the Godot engine, is fairly fast. Often an order of magnitude faster than other solutions.

As an example, to check if we are currently in the editor, we have to have ask Godot for `Engine::is_editor_hint()`. If the cost to leave the VM to ask for this is ~90ns then we have to ask ourselves if we shouldn't cache that value inside the VM instead, to avoid the overhead of having to ask. However, with _libriscv_ the system call overhead is ~2ns, and so asking Godot directly always makes sense. Check out the [latency benchmarks page](/performance/latency.md).

## Maximum portability

The Sandbox has implemented support for the C++ and Rust system languages currently. The extension supports all of Godots platforms, including future platforms like RISC-V.

Anyone can implement support for other languages, as long as those languages transpile to C or C++, or can emit RISC-V directly.

## Full API access

The Sandbox has access to the entire public Godot API using a run-time generated API. The run-time generated API is written into the project root, or wherever CMakeLists.txt is if you are using CMake. Then, when building a program, the API will be discovered by the build system, and your external editor if you are using that, and provide the entire API.

This run-time generated API also includes loaded extensions your project is using.

## Temporary Arguments

The Sandbox is designed to be safe and is therefore sometimes forgetful.

When you pass arguments to the Sandbox, complex arguments will only be remembered until the function call ends. After the function completes, these temporary Variants that need storage are forgotten. This design avoids all kinds of scary lifetime issues.

Data can be remembered by passing arrays or dictionaries to and from the VMs. The VMs can also store their own data in their native language formats. What the VM forgets is only related to complex Variant arguments. For example, you can remember a Variant `Vector2` but not a Variant `String`. You can convert the `String` to a `std::string` and store that instead.

Further, any Variant created during initialization is permanent:

```cpp
// This works: it's being created during initialization
static Dictionary d = Dictionary::Create();

extern "C" Variant test_static_storage(Variant key, Variant val) {
	d[key] = val;
	return d;
}
extern "C" Variant test_failing_static_storage(Variant key, Variant val) {
	// This won't work twice: it's being created after initialization
	static Dictionary fd = Dictionary::Create();
	fd[key] = val;
	return fd;
}
```

## Runs only when needed

The Sandbox only runs when there is a function call to execute. If you are not calling a function in the Sandbox, then *it is not running*.

## Thread unsafe

Parallelism is possible, but make sure you are only calling into an instance from one thread at a time. The easiest way to avoid trouble is to have one instance per thread. Instances are tiny and share executable memory, which is sometimes the largest part of the programs.

## Passing is permitting

If you pass an object to the VM, the VM will allow the sandboxed program to use it. Ordinarily, an object or node has to be retrieved using regular operations like `get_node()`. Many objects are also forbidden or out of reach. Passing an object as an argument to a function, will allow it to be used.

Example: Passing a dictionary containing the OS singleton *DOES NOT* auto-permit access to OS. Every item in the dictionary has to go through the restrictions filter. Only the dictionary itself is auto-permitted, as it was a *direct argument* to the function.
