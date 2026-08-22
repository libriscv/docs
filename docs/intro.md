---
sidebar_position: 1
---

# About this library

*libriscv* is a simple, slim and complete **sandbox** that is highly embeddable and configurable. It is a specialty emulator that specializes in low-latency, low-footprint emulation.

- It's **fast**. Where other solutions routinely require ~50-150ns to call a VM function and return, *libriscv* requires 2ns.
- It has specialized APIs that make **passing data in and out** of the sandbox safe and low-latency.
- It runs on **all platforms** without requiring the sandbox code to be recompiled.
- It has bindings for the **Godot Game Engine**

## SafeGDScript

The fastest way to start using sandboxing in Godot is **SafeGDScript**. Write standard GDScript in a `.sgd` file, and it runs inside a sandbox with no toolchain or build step required.

SafeGDScript is ideal for **modding** and **user-generated content**: mods are plain text scripts that get compiled to RISC-V at load time and execute in full isolation. The game controls exactly what each mod can access through a Dictionary-based API contract. See the [SafeGDScript documentation](/docs/host_langs/godot_integration/godot_intro/safegdscript) and the [modding example](/docs/host_langs/godot_integration/godot_docs/modding) to get started.

For compute-heavy work, C++ and Rust programs compile to RISC-V ELF binaries and run in the same sandbox with optional binary translation for near-native performance.

## Real-world Usage example

![alt text](/img/realworld_example.png)

Image of 60 000 conveyor belt blocks, each using custom logic and ticking through _libriscv_. The server sits at 4-6% single CPU usage when processing these 60k fully scripted conveyors.
