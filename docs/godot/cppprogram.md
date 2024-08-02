---
sidebar_position: 2
---

# C++ Code

The Sandbox can run C++ code inside it in isolation, but first you need to build the C++ code.

## What you'll need

- [Docker](https://docs.docker.com/compose/) installed and running.

## C++ Source Files

In Godot create a new folder called `src`. Inside it create a new file called `main.cpp`, by clicking on the folder and selecting `Create New` -> `Script` -> `CPPScript`.

![new script](/img/cppprogram/new-script.png)

Inside it write the following:

```cpp
int main() {
	UtilityFunctions::print("Hello World");
}

void test_function() {
	UtilityFunctions::print("test_function");
}
```

Now, simply save the file and the binary, `src.elf` should be automatically created. This file is created by compiling the source file to a binary using docker. The image used is [libriscv/compiler](https://github.com/orgs/libriscv/packages).

:::note

If it is not working, you need to set the docker path manually by going to **Project** -> **Project Settings** -> `editor/script/docker` and modifying to the path where you have installed docker. If left blank it will use what it finds in the **PATH** variable.

:::

## ELF Script

Once you compiled the source code to a binary, you can investigate it. To do this simply click the `.elf` file and you should see all the functions that are exported and available to call from the host.

![elf file](/img/cppprogram/elf-file.png)
