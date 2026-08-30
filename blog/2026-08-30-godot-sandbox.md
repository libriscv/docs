---
slug: introducing-godot-sandbox
title: "Godot Sandbox: Faster than GDScript"
authors: [gonzo]
tags: [godot, gdscript, sandbox, libriscv]
---

An introduction to Godot Sandbox for 2026.

<!-- truncate -->

## Godot Sandbox runs real projects

Godot Sandbox is an extension that provides sandboxing for Godot engine. It currently provides a C++ API, as well as an experimental compiler for a SafeGDScript-dialect that is compatible with GDScript.

Godot Sandbox allows restricting scripts so that they cannot do anything weird like opening notepad or really access anything outside of the script itself without explicit permission. However, it has an unrestricted mode that targets the full Godot API, which would make scripts interchangeable with real GDScript. Godot Sandbox has support for all of Godot's platforms.

SafeGDScript is experimental and has not reached full parity, and will have bugs, however: SafeGDScript can now run in place of GDScript in all 42 projects of the official Godot demo repository.

![alt text](<Sandboxed SafeGDScript-dialect is 2-7x faster.png>)

It runs in my libriscv emulator, which gives access to a JIT compiler and binary translation, increasing performance. The regular interpreter mode is also no slouch, but is hampered by the compiler not having much optimization yet.

## Performance

Godot Sandbox provides performance over GDScript.

```
| benchmark                   | unit           | GDScript | Full |  JIT | Intrp | Full vs .gd | JIT vs .gd | Intrp vs .gd |
|-----------------------------|----------------|---------:|-----:|-----:|------:|------------:|-----------:|-------------:|
| array append + index        | element        |     69.1 | 50.7 | 60.2 |   116 |       1.36x |      1.15x |        0.60x |
| call overhead               | call           |      102 | 67.0 | 63.9 |   139 |       1.52x |      1.55x |        0.70x |
| container size              | size call pair |     43.3 | 19.7 | 26.7 |  66.7 |       2.20x |      1.54x |        0.63x |
| dictionary set + get        | op             |     37.5 | 32.8 | 38.9 |  56.8 |       1.14x |      0.91x |        0.65x |
| float loop                  | iteration      |     32.7 | 9.18 | 5.51 |  53.6 |       3.56x |      5.88x |        0.61x |
| int loop                    | iteration      |     34.5 | 6.85 | 5.17 |  46.3 |       5.04x |      6.49x |        0.71x |
| logic CPU dispatch          | emulated instr |      645 | 97.5 |  121 |   249 |       6.62x |      5.34x |        2.54x |
| recursion                   | call           |     76.7 | 5.73 | 10.9 |  29.0 |      13.39x |      7.11x |        2.62x |
| single-instruction step     | emulated instr |      716 |  169 |  187 |   433 |       4.24x |      3.78x |        1.61x |
| string build                | string         |      103 |  112 |  128 |   187 |       0.92x |      0.80x |        0.56x |
| string iterate              | character      |     32.2 | 58.9 | 64.1 |   104 |       0.55x |      0.51x |        0.31x |
| struct construction         | instance       |      171 | 5.88 | 4.76 |  25.2 |      29.05x |     36.32x |        6.64x |
| struct field read           | iteration      |     83.6 | 6.42 | 4.94 |  29.2 |      13.03x |     16.81x |        2.76x |
| struct field read (escaped) | iteration      |     83.7 | 66.8 | 75.9 |   124 |       1.25x |      1.12x |        0.67x |
| untyped float compare       | comparison     |     35.2 | 11.8 | 14.9 |  72.5 |       2.98x |      2.39x |        0.49x |
| untyped float math          | operation      |     28.4 | 8.99 | 13.7 |  64.1 |       3.16x |      1.96x |        0.43x |
```

It's mostly faster than GDScript with the JIT, but it's still lacking in some areas. This "lack" is mostly compiler-side and some of it is in the sandbox boundary (system call layer) where I'm doing silly things with Variants that end up costing. The JIT is not available in JIT-prohibited envs like iOS, or Web export where there is no concept of mprotect (or modifiable execute segments).

For those who export to iOS, Web export (WASM), Switch 1/2 etc., embedding a full binary translation is available. The performance characteristics will be as shown in the column: Generally better than the JIT-compiler.

## Try the extension

You can find the latest release here: https://github.com/libriscv/godot-sandbox/releases/latest

Try it and let me know if you find any differences against GDScript, because there is sure to be some at this stage. Create an issue with a small repro, and I will take a look.

## The future

The SafeGDScript compiler has only recently started to gain compatibility with GDScript, and is not optimized well. There is still low-hanging fruit (see eg. the string ops) that will improve things. The plateu is fairly practically found by comparing GDScript against C++ compiled and run in the interpreter. It is generally 2.5x faster than GDScript, and you can see some benchmarks are already hinting towards it. But, lots of work remains on the performance side, so expect the interpreter column to improve over time. The JIT and full bintr columns show that the heavy optimizers on top are already doing their jobs when they can, but will definitely improve with compiler optimizations too. The plateu is between 20-50x, as measured with equivalent C++. Since the compiler has to support fully dynamic code, it is not possible to reach the plateu, but it's nice to think about it, I guess.

In the future the extension will support auto-baking full binary translations (in the background). The reason this is possible is that SafeGDScript programs are very very small, and contain zero extraneous fluff. A small Rust binary with a few lines of code will easily be 1MB+, while a SafeGDScript binary will be a kilobyte. I'm a low-level programmer so that is technically false, of course, you can strip down Rust/C/C++ to whatever size you like, but the regular programming Joe will not be doing no-std. A full binary translation requires a system compiler, which is almost always available on Linux and other unixes, but not always on Windows and macOS. With some effort, the full binary translation auto-baking could replace the JIT entirely, reducing the size of the extension (on that platform) and reducing the surface of the sandbox. The system compilers optimizer is also generally better than the JIT, so the plateu is much higher. Long term it's the strongest option for performance. But we will have to see before any promises are made. Big projects may have hundreds of scripts, and then we have to weigh JIT against auto-baking with the system compiler. It may be that the system compiler, which produces better code, also makes your machine sound like a jet engine when opening up the project.


Thanks for reading. Bye.

-gonzo
