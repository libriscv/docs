---
sidebar_position: 2
---

# Performance Benchmarks

_libriscv_ is no slouch when it comes to performance, even in interpreter mode.

## Interpreter performance

_libriscv_ regularly out-performs other interpreters.

![alt text](/img/performance/CoreMark_1.0_Interpreted_wasm3_vs_interpreted_libriscv.png)

![alt text](/img/performance/STREAM_memory_wasm3_vs_libriscv_(no_SIMD).png)

I benchmarked _libriscv_ vs wasm3 on two of my machines.

[Others have also benchmarked](https://github.com/sysprog21/rv32emu/issues/288) _libriscv_, and found it to be fast. Although likely with C-extension enabled, which is not the fastest interpreter mode in _libriscv_.

In order to reach good performance with the interpreter mode, [follow these guidelines](https://github.com/libriscv/libriscv?tab=readme-ov-file#interpreter-performance-settings).


## Binary translation performance

The binary translator can be up to 20x faster than the interpreter mode.
