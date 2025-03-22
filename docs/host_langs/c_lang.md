---
sidebar_position: 3
---

# C

C is a uniquely portable system programming language. Learn more at https://www.c-language.org/

## Toolchains

### Clang

Clang is a C language family frontend for LLVM. Learn more at https://clang.llvm.org/

### GCC

The GNU C Compiler is one of the most widely used C compilers. Learn more at https://gcc.gnu.org/

### Visual Studio

Visual Studio is a proprietary C & C++ compiler for Windows. Learn more at https://visualstudio.microsoft.com/vs/features/cplusplus/

## API

The C header for the libriscv C API can be found at https://github.com/libriscv/libriscv/blob/master/c/libriscv.h

### VM Calls

In the C API each argument register has to be populated manually, and the return value(s) have to be read as well.

A general rule for passing data to a function is that:
1. Each integer goes into the next free integer register
2. Each pointer goes into the next free integer register

```c
LIBRISCV_ARG_REGISTER(regs, 0) = 1;
LIBRISCV_ARG_REGISTER(regs, 1) = true;
LIBRISCV_ARG_REGISTER(regs, 2) = libriscv_stack_push(machine, regs, mystruct, sizeof(mystruct));
LIBRISCV_ARG_REGISTER(regs, 3) = libriscv_address_of(machine, "my_function");
```
A function address is also a pointer, which goes into the integer register file.


3. Each float goes into the next free float register of that type

```c
LIBRISCV_FP32_ARG_REG(regs, 0) = 1.0f;
LIBRISCV_FP32_ARG_REG(regs, 1) = 2.0f;
LIBRISCV_FP64_ARG_REG(regs, 2) = 3.0;
LIBRISCV_FP64_ARG_REG(regs, 3) = 4.0;
```
32- and 64-bit floating point values use the same register file.

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

C Host:
```c
/* We start by setting up the call, providing the address of the function */
libriscv_setup_vmcall(machine, guest_function_address);

/**
 * We push structs on the stack, and get a guest pointer in return.
 * Guest pointers go into integer registers along with other integers
**/
LIBRISCV_ARG_REGISTER(regs, 0) = libriscv_stack_push(machine, regs, ...);
LIBRISCV_ARG_REGISTER(regs, 1) = true;
LIBRISCV_ARG_REGISTER(regs, 2) = libriscv_stack_push(machine, regs, ...);
LIBRISCV_ARG_REGISTER(regs, 3) = 4;
/* Floating point values go into their own registers */
LIBRISCV_FP32_ARG_REG(regs, 0) = 5.0f;

/* Running the VM will now execute the function with the above arguments as input */
if (libriscv_run(machine, ~0)) {
	fprintf(stderr, "Ooops! Function call failed!\n");
	exit(1);
}

/* Integer return values are in A0. */
long result = LIBRISCV_ARG_REGISTER(regs, 0);
printf("The function returned: %ld\n", result);
```

### Advanced example

https://github.com/libriscv/libriscv/blob/master/examples/advanced/src/example.c
