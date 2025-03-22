---
sidebar_position: 3
---

# CMake Projects

It's possible to build complex programs with dependencies using CMake.

This method requires a local RISC-V compiler installed on your system. If you don't have that, you won't be able to use CMake locally.

CMake is completely optional. Normally, you can use Docker which compiles for you in the Godot editor.

## Build using Zig

In order to build programs you will need to install: CMake, git, Zig

[Download Zig](https://ziglang.org/download/) and add the extracted folder to PATH so that it becomes globally accessible. This means that typing `zig` from anywhere should work.

The easiest way to use CMake is to have a look at what [Godot Sandbox Programs](https://github.com/libriscv/godot-sandbox-programs) is doing. It has build scripts for Linux, macOS and Windows, and builds several projects for you.

Either fork the godot-sandbox-programs repository or copy it into a new one that you just created. Then go into the programs folder and remove everything except hello-world. Also edit `programs/CMakeLists.txt` to remove the other projects that you just deleted. You can rename hello-world, if you want.

Now you have two options:
1. If you commit changes and push them, Github Actions will build programs for you and upload them to a draft release. These are ready-to-use and will be very small.
2. You can build programs yourself using any of the root-level scripts. Linux/macOS: `./build.sh` Windows: `./build.cmd`


## Manual CMake setup

There is a [CMake project in the Godot Sandbox](https://github.com/libriscv/godot-sandbox/tree/main/program/cpp/cmake) repository that can be used to create ELFs with the API pre-included. This CMake script supports both RISC-V cross-compilers and Zig cross-compilation.

```cmake
cmake_minimum_required(VERSION 3.10)
project(example LANGUAGES CXX)

# Fetch godot-sandbox repository (add_subdirectory is implicitly called)
include(FetchContent)
FetchContent_Declare(
	godot-sandbox
	GIT_REPOSITORY https://github.com/libriscv/godot-sandbox.git
	GIT_TAG        main
	SOURCE_SUBDIR  "program/cpp/cmake"
)
FetchContent_MakeAvailable(godot-sandbox)

add_sandbox_program(example
    example.cpp
)
```

Here `example` becomes a program that you can load in the sandbox. You can add as many programs as you want.

In order to build this project, we can use one of the scripts from the godot-sandbox-programs repository:

1. [Linux 64-bit RISC-V cross compiler script](https://github.com/libriscv/godot-sandbox-programs/blob/main/build.sh)

2. [Linux/macOS Zig cross-compiler script](https://github.com/libriscv/godot-sandbox-programs/blob/main/zig.sh)

3. [Windows Zig cross-compiler script](https://github.com/libriscv/godot-sandbox-programs/blob/main/zig.sh)


### macOS

You can use Zig as a cross-compiler. Have a look at the first chapter.

The [macOS github action](https://github.com/libriscv/godot-sandbox-programs/blob/main/.github/workflows/zig-macos.yml) shows you what dependencies to install and how to build on macOS.

The [Linux/macOS Zig cross-compiler script](https://github.com/libriscv/godot-sandbox-programs/blob/main/zig.sh) will also come in handy.


### Windows

You can use Zig as a cross-compiler. Have a look at the first chapter.

The [Windows github action](https://github.com/libriscv/godot-sandbox-programs/blob/main/.github/workflows/zig-windows.yml) shows you how to build on Windows.


### Ubuntu and Windows WSL2

On Linux and Windows WSL2 we can install a RISC-V compiler like so:

```sh
sudo apt install g++-14-riscv64-linux-gnu cmake git
```

This compiler can be referred to by setting CC and CXX:
```sh
export CC="riscv64-linux-gnu-gcc-14"
export CXX="riscv64-linux-gnu-g++-14"
```

On some systems you may only have access to compiler version 12 or 13. Modify your `build.sh` script accordingly.


### Windows MSYS2

MSYS2 has a RISC-V compiler that is not capable of compiling all kinds of programs. But it's enough to compile most C++.

```sh
pacman -Sy mingw-w64-x86_64-riscv64-unknown-elf-gcc ninja cmake git
mkdir -p build
cd build
AR="riscv64-unknown-elf-ar" CXX="riscv64-unknown-elf-g++" CC="riscv64-unknown-elf-gcc" cmake .. -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=../cmake/toolchain.cmake
cmake --build .
```

You can find a working [MSYS2 build example here](https://github.com/libriscv/godot-sandbox-demo/tree/master/json_diff_sample/json_diff). For `unknown-elf`-type toolchains a toolchain file is needed.


### Arch Linux

```sh
pacman -S riscv64-linux-gnu-gcc cmake git ninja
mkdir -p .build
cd .build
CXX=riscv64-linux-gnu-g++ CC=riscv64-linux-gnu-gcc cmake .. -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=../cmake/toolchain.cmake
ninja
```

## Build with CMake from Godot editor

If there is a `CMakeLists.txt` in the project root or in a `cmake` folder, when saving C++ code in the editor, `cmake --build` will be executed instead as if the CMake build folder was `.build`. Docker is ignored.

If the CMake script is in project root, the build folder is also in project root: `./.build`, and if the CMake script is in `./cmake`, the build folder is in `./cmake/.build`. The CMake invocation is verbose, so pay attention to it in the Godot console.

This feature allows you to use your own CMake project and RISC-V toolchain to build all the programs with, all from within the Godot editor.

:::note

The presence of CMakeLists.txt disables all Docker usage, and any C++ source in the project is assumed to be built with CMake. Saving in a CPPScript window in the Godot editor will *only* invoke cmake.

:::


## Disable Docker

Docker can be disabled per project.

Go to Project -> Project Settings and enable Advanced settings on the right. Scroll to Editor -> Script and disable Docker Enabled. You should no longer see any attempts at using Docker in this project.


## Auto-completion in external editor

Auto-completion should automatically work when using the pre-made CMake script from Godot Sandbox. The CMake script gives your editor access to the C++ API and the run-time generated API. Combined this covers 100% of the Godot API.

### Manually accessing the C++ APIs

If it doesn't work, you can add this folder to your workspace: https://github.com/libriscv/godot-sandbox/tree/main/program/cpp/docker/api

The API has a run-time generated portion that is auto-created when saving in the editor. It can also be created manually from GDScript:

```py
@tool
extends EditorScript

func _run():
	var sandbox_scene = Sandbox.new()
	var api: String = sandbox_scene.generate_api("cpp")
	var file: FileAccess = FileAccess.open("res://path/to/cmake/generated_api.hpp", FileAccess.WRITE)
	file.store_string(api)
	file.close()
```

Once the `generated_api.hpp` is generated, add it to git ignore. VSCode should pick it up automatically and start completing your code, including for classes that aren't part of Godot, such as Sandbox.

If `generated_api.hpp` is in the include path of the CMake build target, for example, project root or the cmake folder, then it will be made available to sandbox programs automatically. The include is conditionally included:

```cpp
#if __has_include(<generated_api.hpp>)
#include <generated_api.hpp>
#endif
```
You only need to re-generate it if a new Godot version is released, or if you are building your own GDExtension and the outwards-facing APIs are changing.

## Automatic building (Linux)

Similar to hot-reloading, automatic builds will rebuild programs as-needed when they are changed by eg. saving in VSCode.

If we want to automatically build every time we change a file:

```sh
#!/bin/sh
set -e -u

FPATH="$PWD"
PATTERN="\.cpp$"
COMMAND="./build.sh"

inotifywait -q --format '%f' -m -r -e close_write $FPATH \
    | grep --line-buffered $PATTERN \
    | xargs -I{} -r sh -c "echo [\$(date -Is)] $COMMAND && $COMMAND"
```

If we now run `autobuild.sh` in a terminal window, it will automatically build our programs every time we change a file.

:::note

Let us know if you have made an autobuild script for another platform!

:::
