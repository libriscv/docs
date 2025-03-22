---
sidebar_position: 3
---

# Host Executable

## Create CMake project

Start by creating a typical CMake project:

`main.cpp`
```cpp
#include <iostream>

int main() {
    std::cout << "Hello from host!" << std::endl;
    return 0;
}
```

`CMakeLists.txt`
```
cmake_minimum_required(VERSION 3.10)

project(libriscv-host)

add_executable(main main.cpp)
```

## Download libriscv

If the current directory is not a git project, initialize it as one:
```shell
git init
```

Download libriscv as a git submodule:

```shell
git submodule add git@github.com:fwsGonzo/libriscv.git
```

## Link dependency

Configure CMake to build and link libriscv to the program:

`CMakeLists.txt`
```
cmake_minimum_required(VERSION 3.10)

project(libriscv-host)

add_subdirectory(libriscv/lib)

add_executable(main main.cpp)

target_link_libraries(main riscv)
target_include_directories(main PRIVATE libriscv/lib)
```

Setup your build directory:

```shell
mkdir build
cd build
cmake ..
cd ..
```

## Setup sandbox

We should have a riscv64 binary at `./guest.bin` from the [Guest VM](/docs/getting_started/guest) section.

`main.cpp`
```cpp
#include <iostream>
#include <vector>
#include <libriscv/machine.hpp>
#include <libriscv/util/load_binary_file.hpp>

using RiscvMachine = riscv::Machine<riscv::RISCV64>;

int main() {
    std::cout << "Hello from host!" << std::endl;
    
    std::vector<unsigned char> guest_data = load_binary_file("./guest.bin");

    RiscvMachine machine(guest_data);
    machine.setup_linux_syscalls(false, false);

    machine.simulate();

    machine.vmcall("say_hello", "from riscv64 guest");

    return 0;
}

```

## Run program

Compile and run the host program:
```shell
make -C build
./build/main
```

It works!
```
Hello from host!
Hello world!
Hello from riscv64 guest!
```

### Note

Host programs may also be written in other [languages](/docs/category/host-languages).

