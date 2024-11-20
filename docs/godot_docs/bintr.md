---
sidebar_position: 7
---

# Binary Translation

![alt text](/img/bintr/luajit.png)

*Binary translated LuaJit in the browser*


## High performance

Binary translations are high-performance versions of the programs running inside Sandbox instances. It is a form of AOT-compilation.

Binary translations are freestanding C code. The C code is produced by the Sandbox instance at run-time, so that the run-time environment and settings are reproducible.

In order to make use of binary translations the freestanding C code must be embedded into a binary or DLL that is shipped as part of your game. We recommend [forking the godot-sandbox project](https://github.com/libriscv/godot-sandbox) repository itself, as it _automatically produces artifacts for all platforms_. That said, anyone can compile C99 to a shared library/DLL and loading it before setting the Sandbox program. On platforms where one can open a shared library at run-time, it should be fairly straight-forward to do this without Godot Sandbox needing to hold anyones hand.

## Complete example

First, we need to generate the C code for a program that we are happy with. Since there's a bit of work involved, we could say that we leave binary translations for when we are about to ship or publish the game in some way.

In GDScript we can use the Sandbox `emit_binary_translation()` function:
```py
var t : String = my_sandbox.emit_binary_translation()
var file = FileAccess.open("res://mytranslation.cpp", FileAccess.WRITE)
file.store_string(content)
```

Sandbox lifetimes can be very dynamic, and they can be instantiated from remote data, so generating the binary translation at run-time covers all use-cases.

Now that we have the translation, we can embed it somewhere. Since we are already using Godot Sandbox, why not add it as part of the source code of the extension, and make use of its Github Actions CI to get the release artifacts without much work?

Fork the [Godot Sandbox project](https://github.com/libriscv/godot-sandbox) and download it on your computer. Now go into the forks folder and copy the generated .cpp file into the `src` folder. Now make a git commit from the repository root in your terminal:

```sh
git add src/
git commit -m "Added a binary translation code file"
git push
```

The name of the .cpp file is not important as long as it's not overwriting other sources.

Now that the file is pushed, your fork will automatically run Github Actions on the main branch, and after completion it will produce release artifacts in a draft release. Go look at your forked repository on GitHub, on the releases page. You should see a new release marked as a draft. The draft release will have a complete functioning release-ready `godot-sandbox.zip` attached to it under assets.

With the new `godot-sandbox.zip` you can now add that to your project again, overwriting the old Godot Sandbox extension files similar to when you added the extension in the beginning. The sandbox should now **automatically pick up the translation without any interaction on all platforms**, and you should see a drastic performance increase on the program running in that Sandbox, until you modify the program again.

That's it.

### Reliable performance

This method of accelerating the performance of sandboxed programs is particularly attractive if you are targeting several (if not all) platforms that Godot can publish to. Every single platform will benefit from this feature in the same way, leaving no platform behind as a laggy mess.

JIT-compilers are very popular because they give instant performance increases without much user interaction, but can only leave you with a laggy mess when you're publishing for platforms that don't allow JIT. Most mobile- and console-platforms don't allow JIT at all.

## Loading binary translations at run-time

A minority of platforms support loading shared libraries at run-time. Windows, Linux and macOS. If you want to quickly test binary translations or even ship them to players on those platforms at login time in a server-client architecture, you can do so.

### Creating the translation source file from a program

First create the binary translation source file:
```py
var bintr = my_program.emit_binary_translation(true)
var f = FileAccess.open("res://my_program.c", FileAccess.WRITE)
f.store_string(bintr)
f.close()
```

### Compiling on Linux

```sh
gcc -shared -O2 -DCALLBACK_INIT my_program.c -o my_program.so
```

### Compiling on MinGW/MSYS2

```sh
x86_64-w64-mingw32-gcc-win32 -shared -O2 -DCALLBACK_INIT my_program.c -o my_program.dll
```

The define `-DCALLBACK_INIT` allows Godot Sandbox to look for and use a callback init function which works even if the Godot Sandbox extension is stripped.


### Loading the binary translation DLL

Now we can load it from GDScript like so:
```py
func _init() -> void:
	Sandbox.load_binary_translation("/path/to/my_program.so")
```
After this, your program will now be binary translated. You can verify it:

```py
	print("The program is binary translated: ", my_program.is_binary_translated())
```

:::note

Shared libraries are only allowed to be loaded at the beginning, before any Sandboxes are created. This is a security feature.

:::


## Differences from interpreted

By default there is no difference from interpreted.

The full-binary-translation produced at run-time can be set to ignore execution timeouts, and it's the first argument to `emit_binary_translation(ignore_timeouts)`. When you are happy with a program and how it behaves, that's usually the point at which you will generate binary translation for it. It already behaves correctly, and it's likely written by you. Ignoring execution timeouts provides a nice 5-15% performance boost: `mysandbox.emit_binary_translation(true)`.

This is a run-time setting which could be toggled before producing the C code, and so it's not a limitation of the sandbox.

A process that is stuck looping forever does not really pose a danger to users. However, limiting this to "blessed" programs is considered a good tradeoff. We can benefit from the timeouts while developing the program, and when we are happy and it works, we can turn up the heat to max.

## Even more performance

The highest performance setting is when automatic N-bit address space mode is enabled. The Sandbox should have a max memory that is a power-of-two, such as 8MB, 16MB, 32MB etc. It's the second argument to `emit_binary_translation(ignore_timeouts, enable_automatic_nbit_as)`. Enabling it will completely disable page protections, making the entire address space writable (inside the Sandbox). This should not be enabled unless the program is somewhat trusted, and only if the program appears to work correctly with this mode. Enabling this setting can give a large boost to performance, especially on weaker CPUs: `mysandbox.emit_binary_translation(true, true)`.

Is is ultimately an experimental option that doesn't work reliably for all programs. However, it may be worth trying it just to see if the program is compatible.
