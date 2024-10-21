---
sidebar_position: 7
---

# Binary Translation

![alt text](/img/bintr/luajit.png)

*Binary translated LuaJit in the browser*


## High performance

Binary translations are high-performance versions of the programs running inside Sandbox instances.

They are compiled from freestanding C code. The C code is produced by the Sandbox instance at run-time, so that the run-time environment and settings are reproducible.

In order to make use of binary translations the freestanding C code must be embedded into a binary or DLL that is shipped as part of your game. We recommend [forking the godot-sandbox project](https://github.com/libriscv/godot-sandbox) repository itself, as it _automatically produces artifacts for all platforms_.

## Complete example

First, we need to generate the C code for a program that we are happy with. Since there's a bit of work involved, we could say that we leave binary translations for when we are about to ship or publish the game in some way.

In GDScript we can call use the Sandbox `emit_binary_translation()` function:
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

With the new `godot-sandbox.zip` you can now add that to your project again, overwriting the old Godot Sandbox extension files similar to when you added the extension in the beginning. The sandbox should now **automatically pick up the translation without any interaction on all platforms, present and future**, and you should see a drastic performance increase on the program running in that Sandbox, until you modify the program again.

That's it.

## Reliable performance

This method of accelerating the performance of sandboxed programs is particularly attractive if you are targeting several (if not all) platforms that Godot can publish to. Every single platform will benefit from this feature in the same way, leaving no platform behind as a laggy mess.

JIT-compilers are very popular because they give instant performance increases without much user interaction, but can only leave you with a laggy mess when you're publishing for platforms that don't allow JIT. Most mobiles and console don't allow JIT at all.

## Differences from interpreted

The full-binary-translation produced at run-time is currently set to ignore execution timeouts. The reason behind this is that when you are happy with a program and how it behaves, it's usually because it already behaves correctly, and it's likely written by you. Ignoring execution timeouts provides a nice 5-15% performance boost.

This is a run-time setting which could be toggled before producing the C code, and so it's not a limitation of the sandbox.

A process that is stuck looping forever does not really pose a danger to users. However, limiting this to "blessed" programs is considered a good tradeoff. We can benefit from the timeouts while developing the program, and when we are happy and it works, we can turn up the heat to max.
