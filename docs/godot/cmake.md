---
sidebar_position: 12
---

# CMake Projects

It's possible to use complex projects with dependencies while scripting with C++ in Godot.

This method requires a local RISC-V compiler installed on your system. If you don't have that, you won't be able to use CMake locally.

## Installation

On Linux and Windows WSL2 we can install a C++ RISC-V compiler, ccache and mold like so:

```sh
sudo apt install g++-14-riscv64-linux-gnu ccache mold
```

On some system you may only have access to version 12 or 13. Modify the `build.sh` below accordingly.

On macOS there are RISC-V toolchains in brew. Let us know which ones worked for you.


:::note

Both ccache and mold are optional.

:::

## Usage

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
# ccache is optional, but recommended
export CXX="ccache riscv64-linux-gnu-g++-14"

# Create build directory
mkdir -p .build
pushd .build
cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=../toolchain.cmake
make -j4
popd
```

Remember to make the script executable:

```sh
chmod +x build.sh
```

## Auto-completion in editor

Auto-completion should automatically work if you symlink the `cmake` folder from Godot Sandbox to your project. If not, you can always add this path to your editor:

https://github.com/libriscv/godot-sandbox/tree/main/program/cpp/api

Adding the API path to your workspace should give you access to the C++ API.

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
