---
sidebar_position: 2
---

# Performance Benchmarks

_libriscv_ is no slouch when it comes to performance.

## Interpreter performance

_libriscv_ regularly out-performs other interpreters.

![alt text](/img/performance/CoreMark_1.0_Interpreted_wasm3_vs_interpreted_libriscv.png)

![alt text](/img/performance/STREAM_memory_wasm3_vs_libriscv_(no_SIMD).png)

I benchmarked _libriscv_ vs wasm3 on two of my machines.

[Others have also benchmarked](https://github.com/sysprog21/rv32emu/issues/288) _libriscv_, and found it to be fast:

![alt text](/img/performance/361665288-a9fb19cf-b8a2-493a-9259-ec22822ea26a.png)

Although likely with C-extension enabled, which is not the fastest interpreter mode in _libriscv_.


## Binary translation performance

The binary translator can be 20-100x faster than the interpreter mode.
