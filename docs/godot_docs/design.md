---
sidebar_position: 3
---

# Design

## Low-latency

A major design goal is having the lowest latency between the Sandbox and the Godot engine. As a result, calling functions, and in general communicating things back and forth with the Godot engine, is fairly fast. Often an order of magnitude faster than other solutions. This changes design and thinking.

As an example, to check if we are currently in the editor, we have to have ask Godot for `Engine::is_editor_hint()`. If the cost to leave the VM to ask for this is ~90ns then we have to ask ourselves if we shouldn't cache that value inside the VM instead, to avoid the overhead of having to ask. However, with _libriscv_ the system call overhead is ~2ns, and so asking Godot directly always makes sense. Check out the [latency benchmarks page](/performance/latency.md).

## Maximum portability

The Sandbox has implemented support for the C++ and Rust system languages currently. The extension supports all of Godots platforms, including future platforms like RISC-V.

Anyone can implement support for other languages, as long as those languages transpile to C or C++, or can emit RISC-V directly.

## Temporary Arguments

The Sandbox is designed to be safe and is therefore very forgetful.

When you pass arguments to the Sandbox, complex arguments will only be remembered until the function call ends. After the function completes, temporarily created Variants that need storage are forgotten. This design avoids all kinds of scary lifetime issues.

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
	// This won't work: it's being created after initialization
	static Dictionary fd = Dictionary::Create();
	fd[key] = val;
	return fd;
}
```

## Runs only when needed

The Sandbox only runs when there is a function call to execute. If you are not calling a function in the Sandbox, then *it is not running*.

## Thread unsafe

Parallelism is possible, but make sure you are only calling into an instance from one thread at a time. The easiest way to avoid trouble is to have one instance per thread. Instances are tiny and share executable memory, which is usually the largest part of the programs.

## Passing is permitting

If you pass an object to the VM, the VM will allow the sandboxed program to use it. Ordinarily, an object or node has to be retrieved using regular operations like `get_node()`. Many objects are also forbidden or out of reach. Passing an object, or passing something that contains the object, as an argument to a function, will allow it to be used.

Example: Passing a dictionary containing the OS singleton gives access to OS.
