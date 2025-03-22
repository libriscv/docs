---
sidebar_position: 2
---

# C

C is a uniquely portable system programming language. Learn more at https://www.c-language.org/

## Toolchains

### Zig

Zig is a general-purpose programming language and compiler that also supports C. Learn more under *Zig is also a C compiler*, at https://ziglang.org/learn/overview/

#### Example

```shell
zig cc -target riscv64-linux guest.c -o guest.bin
```

<!-- ### GCC

The GNU C Compiler is one of the most widely used C compilers. Learn more at https://gcc.gnu.org/

Compilation to riscv64 may require a special distribution of GCC.

#### Example

In an Ubuntu environment (WSL2, Docker):

```shell
apt update
apt install -y g++-14-riscv64-linux-gnu
riscv64-linux-gnu-gcc-14 guest.c -o guest.bin 
``` -->

## Examples

### Hello world

```c
#include <stdio.h>

void say_hello(const char* message) {
	printf("Hello %s!\n", message);
	fflush(stdout);
}

int main(void) {
	say_hello("world");
	return 0;
}
```

### Advanced API example

https://github.com/libriscv/libriscv/tree/master/examples/advanced
