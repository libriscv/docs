---
sidebar_position: 2
---

# Performance Benchmarks

_libriscv_ is no slouch when it comes to performance, even in interpreter mode.

## Interpreter performance

_libriscv_ regularly out-performs other interpreters.

![CoreMark 1.0](/img/performance/coremark.png)

![STREAM benchmark](/img/performance/stream1.png)

![STREAM benchmark](/img/performance/stream2.png)

I benchmarked interpreted [libriscv](https://github.com/libriscv/libriscv) vs [wasm3](https://github.com/wasm3/wasm3) on two of my machines.

[Others have also benchmarked](https://github.com/sysprog21/rv32emu/issues/288) _libriscv_, and found it to be fast. Although likely with C-extension enabled, which is not the fastest interpreter mode in _libriscv_.

In order to reach good performance with the interpreter mode, [follow these guidelines](https://github.com/libriscv/libriscv?tab=readme-ov-file#interpreter-performance-settings).


## Binary translation performance

The binary translator can be up to 30x faster than the interpreter mode.


## Godot Sandbox performance

The Godot Sandbox is an extension to the [Godot Engine](https://godotengine.org/). Godot uses GDScript for scripting inside the Godot Editor. GDScript is a dynamic, interpreted language. While the Godot Sandbox extension aims to allow modding in Godot, it also has good performance.

![alt text](/img/performance/100k-floats.png)

We can see that the Godot Sandbox using libriscv is 7.5x faster than GDScript at processing floats in this benchmark. A C jit-compiler called Mir was 4x faster than GDScript after being embedded into the Sandbox. TinyCC, a fast C compiler, can also be embedded into the Sandbox, and was 2.7x faster than GDScript. However, when a Godot engine helper function is used (`fill(1.0)` in this instance), GDScript can have native performance.

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
