---
sidebar_position: 3
---

# CMake Projects

It's possible to build complex programs with dependencies using CMake.

This method requires a local RISC-V compiler installed on your system. If you don't have that, you won't be able to use CMake locally.

CMake is completely optional. Normally, you can use Docker which compiles for you in the Godot editor.

## Setup & Installation

There is a [CMake project in the Godot Sandbox](https://github.com/libriscv/godot-sandbox/tree/main/program/cpp/cmake) repository that can be used to create ELFs with the API pre-included.

The easiest way to access it is to create a symlink to the cmake folder above in your project so that you can directly reference it in CMake:

```cmake
cmake_minimum_required(VERSION 3.10)
project(example LANGUAGES CXX)

# Add the Godot Sandbox build functions
add_subdirectory(cmake)

add_sandbox_program(example
    example.cpp
)
```

Here `example` is a regular CMake target that you can use like normal. You can have as many programs as you want.

In order to build this project, we will use a simple build script:

```sh
#!/bin/bash

# Change this to reflect your RISC-V toolchain
export CC="riscv64-linux-gnu-gcc-14"
export CXX="riscv64-linux-gnu-g++-14"

# Create build directory, configure and compile
mkdir -p .build
pushd .build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j4
popd
```

Remember to make the script executable:

```sh
chmod +x build.sh
```

### Ubuntu and Windows WSL2

On Linux and Windows WSL2 we can install a RISC-V compiler like so:

```sh
sudo apt install g++-14-riscv64-linux-gnu cmake ninja-build git
```

On some systems you may only have access to g++ version 12 or 13. Modify the `build.sh` below accordingly.

### Windows MSYS2

```sh
pacman -Sy mingw-w64-x86_64-riscv64-unknown-elf-gcc ninja cmake git
mkdir -p build
cd build
AR="riscv64-unknown-elf-ar" CXX="riscv64-unknown-elf-g++" CC="riscv64-unknown-elf-gcc" cmake .. -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=../cmake/toolchain.cmake
cmake --build .
```

You can find a working [MSYS2 build example here](https://github.com/libriscv/godot-sandbox-demo/tree/master/json_diff_sample/json_diff). For `unknown-elf`-type toolchains a toolchain file is needed.


### macOS

On macOS there are RISC-V toolchains in brew. Let us know which ones worked for you.

### Arch Linux

```sh
pacman -S riscv64-linux-gnu-gcc cmake git ninja
mkdir -p .build
cd .build
CXX=riscv64-linux-gnu-g++ CC=riscv64-linux-gnu-gcc cmake .. -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=../cmake/toolchain.cmake
ninja
```

## CMake from Godot editor

If there is a `CMakeLists.txt` in the project root or in a `cmake` folder, when saving C++ code in the editor, `cmake --build` will be executed instead as if the CMake build folder was `.build`. Docker is ignored.

If the CMake script is in project root, the build folder is also in project root: `./.build`, and if the CMake script is in `./cmake`, the build folder is in `./cmake/.build`. The CMake invocation is verbose, so pay attention to it in the Godot console.

This feature allows you to use your own CMake project and RISC-V toolchain to build all the programs with.

:::note

The presence of CMakeLists.txt disables all Docker usage, and any C++ source in the project is assumed to be built with CMake. Saving in a CPPScript window in the Godot editor will *only* invoke cmake.

:::


## Disable Docker

Docker can be disabled per project.

Go to Project -> Project Settings and enable Advanced settings on the right. Scroll to Editor -> Script and disable Docker Enabled. You should no longer see any attempts at using Docker in this project.

## Auto-completion in editor

Auto-completion should automatically work if you symlink the `cmake` folder from Godot Sandbox to your project. If not, you can always add this path to your editor workspace:

https://github.com/libriscv/godot-sandbox/tree/main/program/cpp/api

Adding the API path to your workspace should give you access to the C++ API.

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

Let us know if you have an autobuilder script for another platform!

:::
