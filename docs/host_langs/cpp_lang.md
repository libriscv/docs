---
sidebar_position: 2
---

# C++

C++ is a general-purpose programming language with a bias towards systems programming. Learn more at https://isocpp.org/

## Toolchains

### Clang

Clang is a C language family frontend for LLVM. Learn more at https://clang.llvm.org/

### GCC

The GNU C++ Compiler is a widely used C++ compiler. Learn more at https://gcc.gnu.org/

### Visual Studio

Visual Studio is a proprietary C & C++ compiler for Windows. Learn more at https://visualstudio.microsoft.com/vs/features/cplusplus/

## API

C++ headers for libriscv can be found at https://github.com/libriscv/libriscv/tree/master/lib/libriscv

## Examples

### VM call example

Guest Function:
```c
long my_function(
    const char* arg1, 
    const bool arg2, 
    const struct my_struct* arg3, 
    size_t arg4, 
    float arg5
    );
```

Input values:
```c
const char* mystring = "";
const bool  mybool = true;
const struct mystruct s;
const size_t mysize = 4;
const float  myfloat = 5.0f;
```

C++ Host:
```cpp
long result = machine.vmcall(guest_function_address,
	mystring, mybool, mystruct, mysize, myfloat);
```

### Misc Examples

Most examples located here are written for a C++ host: https://github.com/libriscv/libriscv/tree/master/examples
