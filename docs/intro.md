---
sidebar_position: 1
---

# About this library

*libriscv* is a simple, slim and complete **sandbox** that is highly embeddable and configurable. It is a specialty emulator that specializes in low-latency, low-footprint emulation.

- It's **fast**. Where other solutions routinely require ~50-150ns to call a VM function and return, *libriscv* requires 2ns.
- It has specialized APIs that make **passing data in and out** of the sandbox safe and low-latency.
- It runs on **all platforms** without requiring the sandbox code to be recompiled.
- It has bindings for the **Godot Game Engine**


## Real-world Usage example

![alt text](/img/realworld_example.png)

Image of 60 000 conveyor belt blocks, each using custom logic and ticking through _libriscv_. The server sits at 4-6% single CPU usage when processing these 60k fully scripted conveyors.
