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


## Godot Sandbox performance

The Godot Sandbox is an extension to the [Godot Engine](https://godotengine.org/). Godot uses GDScript for scripting inside the Godot Editor. GDScript is a dynamic, interpreted language. While the Godot Sandbox extension aims to allow modding in Godot, it also has good performance.

![alt text](/img/performance/100k-floats.png)

We can see that the Godot Sandbox using libriscv is 4x faster than GDScript at processing floats in this benchmark. However, when a Godot engine helper function is used (`fill(1.0)` in this instance), GDScript can have native performance.

I took that as a challenge, and wrote a `memset32` function that initializes the array with and then copies increasingly larger parts until done.
```cpp
static inline void memset_i32(int *ptr, int value, size_t num) {
	if (num == 0) return;
	*ptr = value;
	size_t start = 1, step = 1;
	for ( ; start + step <= num; start += step, step *= 2)
		memcpy(ptr + start, ptr, sizeof(int) * step);

	if (start < num)
		memcpy(ptr + start, ptr, sizeof(int) * (num - start));
}
```
Using that helper, we could match the Godot native-performance `Array.fill()` helper function. The reason this works is that functions like `memcpy` and `memset` are native performance in Godot Sandbox.

In any case, one should prefer to use the Godot native-performance helper functions when they are available. And if not, one can always outsource it to the Godot Sandbox.
