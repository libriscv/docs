---
sidebar_position: 3
---

# CMake Projects

It's possible to build complex programs with dependencies using CMake.

This method requires a local RISC-V compiler installed on your system. If you don't have that, you won't be able to use CMake locally.

CMake is completely optional. Normally, you can use Docker which compiles for you in the Godot editor.

## CMake setup

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
	GIT_SHALLOW    TRUE
	GIT_SUBMODULES ""
	SOURCE_SUBDIR  "program/cpp/cmake"
)
FetchContent_MakeAvailable(godot-sandbox)

add_sandbox_program(example
    example1.cpp
    example2.cpp
)
```

Here `example` becomes a program that you can load in the sandbox. You can add as many programs as you want.

In order to build this project, you should put the `CMakeLists.txt` file in a folder called `cmake` in your Godot project. The CMake build script should now be located at `./cmake/CMakeLists.txt` relative to your project. If you save a C++ file in Godot, it will try to configure CMake for you automatically.

Note that you will need all the build dependencies installed in order to be able to do this:
- zig
- cmake
- git
- ninja (Windows)

### Windows Powershell
```sh
choco install zig cmake git ninja
```

After having installed the dependencies, restart Godot and go to the Configuring CMake section.

### Linux and macOS
1. Download and place `zig` in PATH:
```sh
wget https://ziglang.org/download/0.14.0/zig-linux-x86_64-0.14.0.tar.xz
```
2. Install build dependencies for your OS/Distro
```sh
sudo apt install cmake git
```
Example is for Ubuntu.

After having installed the dependencies, restart Godot and go to the Configuring CMake section.

### Configuring CMake

After all dependencies are installed, make sure that there is a `cmake` folder in your project, and a `cmake/CMakeLists.txt` that has the programs you want to build.

Now you should save any C++ file inside the Godot editor. It will configure CMake for you.


### Toolchain details

If you want to inspect how the toolchain is set up, have a look at one of the scripts from the godot-sandbox-programs repository:

1. [Linux 64-bit RISC-V cross compiler script](https://github.com/libriscv/godot-sandbox-programs/blob/main/build.sh)

2. [Linux/macOS Zig cross-compiler script](https://github.com/libriscv/godot-sandbox-programs/blob/main/zig.sh)

3. [Windows Zig cross-compiler script](https://github.com/libriscv/godot-sandbox-programs/blob/main/zig.sh)

The godot-sandbox-programs project builds programs for all 3 major desktop platforms: Windows, Linux and macOS.

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
