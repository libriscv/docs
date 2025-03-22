---
sidebar_position: 3
---

# Guest VM

## Setup riscv64 toolchain

We need tooling to compile riscv64 binaries for our sandbox.

For the purposes of this tutorial, we can use the Zig toolchain to compile C source code.

Installation instructions for your host platform can be found at https://github.com/ziglang/zig/wiki/Install-Zig-from-a-Package-Manager.

## Create guest binary

Add the source code of our guest

`guest.c`
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

This will print "Hello world!" when run and make the `say_hello` function available to the sandbox.

Compile this to a riscv64 binary file, `./guest.bin`:

```shell
zig cc -target riscv64-linux guest.c -o guest.bin
```

### Note

Guest programs may also be written in other [languages](/docs/category/guest-languages).
