---
sidebar_position: 7
---

# Binary Translation

![alt text](/img/bintr/luajit.png)

*Binary translated LuaJit in the browser*


## High performance

Binary translations are high-performance versions of the programs running inside Sandbox instances. It is a form of AOT-compilation.

Binary translations are freestanding C code. The C code is produced by the Sandbox instance at run-time, so that the run-time environment and settings are reproducible.

In order to make use of _full binary translations_ the freestanding C code must be embedded into a binary or DLL that is shipped as part of your game. We recommend [forking the godot-sandbox project](https://github.com/libriscv/godot-sandbox) repository itself, as it _automatically produces artifacts for all platforms_. That said, anyone can compile C99 to a shared library/DLL and loading it before setting the Sandbox program. On platforms where one can open a shared library at run-time, it should be fairly straight-forward to do this without Godot Sandbox needing to hold anyones hand.


## JIT-compiler

For some platforms there is also support for automatic JIT-compilation of programs. Specifically on Windows, Linux and Android (with macOS coming soon). This is not currently available in the Godot Asset store. The addon DLLs with JIT-compiler enabled can be downloaded from [the GitHub releases page](https://github.com/libriscv/godot-sandbox/releases). Download `godot-sandbox-jit.zip` and replace the files in your Godot project with the ones from the zip file.

In order to verify that Godot Sandbox has JIT enabled:
```py
	if Sandbox.has_feature_jit():
		print("Godot Sandbox supports JIT compilation")
	else:
		print("Godot Sandbox does not have a JIT compiler")
```

In order to verify that a program was accelerated by a JIT compiler, use:
```py
	if (my_program.is_binary_translated() and !my_program.is_jit()):
		print("test.cpp was fully binary translated")
	elif my_program.is_jit():
		print("test.cpp was JIT compiled")
```

JIT-compilation happens in a separate thread in the background and gets live-patched into the program over time. This means that it's possible to see that `my_program.is_binary_translated()` returns false for some time until suddenly it returns true.

## Binary translations at run-time

Some (mostly desktop) platforms support loading shared libraries at run-time. Windows, Linux, Android and macOS all support this. If you want to quickly test binary translations or even ship them to players on those platforms at login time in a server-client architecture, you can do so.

The shared libraries are compiled from a call to `myprogram.emit_binary_translation()` at run-time. The result is a string that is freestanding C99 and can be compiled without any dependencies.

### Compiling from Editor

The Sandbox class has a function called `try_compile_binary_translation()` that will try to invoke the currently globally chosen (`$CC`) C-compiler. This method will work mostly on macOS and Linux systems. Also, remember that in order to load the binary translation DLL the game/editor has to be restarted.

Linux Example:
```py
my_program.try_compile_binary_translation("res://my_program", "gcc", "", true, true)
```

Windows Example:
```py
my_program.try_compile_binary_translation("res://my_program", "zig", "", true, true)
```

This will try to produce a binary translation for `my_program` to `my_program` using `gcc` or `zig` as the C-compiler frontend. The final shared object will have the appropriate platform-specific extension appended:
```sh
$ ls -lah my_program.so
-rwxrwxr-x 1 user user 2,3M nov.  29 18:36 my_program.so
```

Please note that if you want Godot Sandbox to automatically load this binary translation when needed, it must be placed with the ELF file, using the same basename:

```
myfolder/myprogram.elf
myfolder/myprogram.dll
```
So, for this example, the Windows incantation would be:
```py
my_program.try_compile_binary_translation("res://myfolder/myprogram", "zig", "", true, true)
```
The correct extension is automatically added based on the platform.


### Manually compiling binary translations

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

### Compiling on Windows

```sh
zig cc -shared -O2 -DCALLBACK_INIT my_program.c -o my_program.so
```

### Compiling on MinGW/MSYS2

```sh
x86_64-w64-mingw32-gcc-win32 -shared -O2 -DCALLBACK_INIT my_program.c -o my_program.dll
```

The define `-DCALLBACK_INIT` allows Godot Sandbox to look for and use a callback init function which works even if the Godot Sandbox extension is release-stripped.


### Loading the binary translation DLL

Now we can load it during `_init` from GDScript like so:
```py
func _init() -> void:
	Sandbox.load_binary_translation("res://my_program.so")
```
After this, your program will now be binary translated. You can verify it:

```py
	print("The program is binary translated: ", my_program.is_binary_translated())
```

The program should be running quite a bit faster now.

:::note

Shared libraries are only allowed to be loaded at the beginning, before any Sandboxes are created. This is a security feature.

:::

### Automatically loading binary translations

If you want Godot Sandbox to automatically load a binary translation, it must be placed with the ELF file, using the same basename:

```
myfolder/myprogram.elf
myfolder/myprogram.dll
```
As soon as the ELF is needed, it will first load the binary translation which ensures it gets registered before the program is loaded into a Sandbox.


## Production/final release example

When you are ready to ship your game, you will want to accelerate the sandbox programs to the greatest degree possible. All platforms are supported. This is achieved by embedding the binary translation into the Godot Sandbox addon itself through automatic pickup by the build system.

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

## Performance options

The full-binary-translation produced at run-time can be set to ignore execution timeouts, and it's the first argument to `emit_binary_translation()`. When you are happy with a program and how it behaves, that's usually the point at which you will generate binary translation for it. It already behaves correctly, and it's likely written by you. Ignoring execution timeouts provides a nice 5-15% performance boost: `mysandbox.emit_binary_translation(true)`.

This is a run-time setting which could be toggled before producing the C code, and so it's not a limitation of the sandbox.

A process that is stuck looping forever does not really pose a danger to users. However, limiting this to "blessed" programs is considered a good tradeoff. We can benefit from the timeouts while developing the program, and when we are happy and it works, we can turn up the heat to max.

The highest performance setting is when automatic N-bit address space mode is enabled. The Sandbox should have a max memory that is a power-of-two, such as 8MB, 16MB, 32MB etc. It's the second argument to `emit_binary_translation(ignore_timeouts, enable_automatic_nbit_as)`. Enabling it will completely disable page protections, making the entire address space writable (inside the Sandbox). This should not be enabled unless the program is somewhat trusted, and only if the program appears to work correctly with this mode. Enabling this setting can give a large boost to performance, especially on weaker CPUs: `mysandbox.emit_binary_translation(true, true)`.

Is is ultimately an experimental option that doesn't work reliably for all programs. However, it may be worth trying it just to see if the program is compatible.

You may also look into enabling LTO for the program build. Configure cmake with `FLTO=ON` or add `set(FLTO TRUE)` to your CMakeLists.txt.
