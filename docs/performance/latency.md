---
sidebar_position: 1
---

# Latency Benchmarks

[_libriscv_](https://github.com/libriscv/libriscv) is a unique emulator that focuses heavily on low-latency emulation. Most game scripts don't do any heavy computation, and when they do, it is often outsourced to the host. As an example, LLM computations don't happen in WASM sandboxes, rather it happens outside of the sandbox in order to benefit from CPU- and hardware-specific features, GPU support and such.


## Function call latency

When the game engine wants to enter our script, a fixed cost has to be paid to enter and then leave the sandbox again. Sandboxes provide safety, and requires some setup in order to activate itself, and then afterwards some work to wind down. By call, we mean a function call into the VM, so a VM function call. It's just like a regular function call, but it happens inside our safe sandbox.

![alt text](/img/performance/Function_call_overhead_(lowest_seen).png)

The graph shows the cost attached to having 0 to 8 integral function arguments.


## System call latency

Every time you need to ask the host game engine to do something, the system call latency must be paid. The lower it is, the more often it can make sense to make a call out to perform some task. This task is always native performance.

![alt text](/img/performance/Single_system_call_overhead_(lowest_seen).png)

The graph shows the cost of calling out to the engine with the given 0 to 7 number of function arguments. It's beneficial to have a low treshold for performing system calls.


## Real-world example

One real-world example script function is one that computes a rainbow vertex color. The game engine doesn't know that, but the point is that we are scripting a new entity in our game, one that should be a rainbow using vertex coloring. For that we needed to use `std::sin()` 3 times for the 2D signal.

![alt text](/img/performance/Script_function_Rainbow_block_vertex_color_(3x_sinf).png)

![alt text](/img/performance/Compare_rainbow_color_calculation_(3x_sinf).png)

The substantially lower system call latency made it a no-brainer to make `sin` a system call, and as a result, the overall time needed is at least 5x to 7x lower than other emulators.

Finally, we are comparing WebAssembly without game engine integration (so just calling into emulator directly) against a fully integrated libriscv inside another game engine, with extra sandboxing measures (like maximum call depth). So, we can safely assume that WebAssembly needs additional nanoseconds in a real game engine integration. It's better to sabotage ourselves a little, than the opposite!


## A made-up example

Nobody has the energy to fully implement a solution of all these solutions into a real game engine just for a benchmark, but if we just take them as-is, and measure overheads. Then we imagine that we're calling an argument-less function that again makes 3x system calls with 4 arguments each:

![alt text](/img/performance/Made-up_example.png)

In this made-up example we can't see the real measurements, but we can still see the tendencies of each solution. Interpreted libriscv is an order of magnitude faster than other solutions in this particular instance.


## Godot engine integration

When integrated into the [Godot engine](https://godotengine.org/), the fixed overheads outside of our control are 40ns for each call and we also use the Godot Variant as function arguments as a quality-of-life feature.

![alt text](/img/performance/GDScript_vs_Sandbox_function_calls_in_Godot.png)

As a result, the call overheads are fairly large, but we're doing alright. As a sandbox we have to translate and verify everything, which is costly when Variants have so many rules. Matching GDScript in latency, which is not a sandbox, is quite OK!

Since libriscv is way faster than GDScript at processing, we can say that it *always makes sense* to call into the sandbox, compared to staying in GDScript. At least when performance is a factor.
