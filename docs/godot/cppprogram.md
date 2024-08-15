---
sidebar_position: 2
---

# C++ Code

The Sandbox can run C++ code inside it in isolation, but first you need to build the C++ code.

## What you'll need

- [Docker](https://docs.docker.com/compose/) installed and running.

## C++ Source Files

In Godot create a new folder called `src`. Inside it create a new cpp script, by clicking on the folder and selecting `Create New` -> `Script` -> `CPPScript`.

![new script](/img/cppprogram/new-script.png)

Inside it write the following (it's the default that gets written once the file is created):

```cpp
#include "api.hpp"

extern "C" Variant public_function(Variant arg) {
    print("Arguments: ", arg);
    return "Hello from the other side";
}
```

Now, simply save the file and the binary, `src.elf` should be automatically created. This file is created by compiling the source file to a binary using docker. The image used is [libriscv/compiler](https://github.com/orgs/libriscv/packages).

The name of the program is based on the folder name, hence `src.elf`. This allows you to have multiple source files, which will all be automatically compiled together into one final program.

:::note

If it is not working, you need to set the docker path manually by going to **Project** -> **Project Settings** -> `editor/script/docker` and modifying to the path where you have installed docker. If left blank it will use what it finds in the **PATH** variable.

:::

## ELF Script

Once you compiled the source code to a binary, you can investigate it. To do this simply click the `.elf` file and you should see all the functions that are exported and available to call from Godot. These functions are exported normally and can even be used as targets for signals.

![elf file](/img/cppprogram/elf-file.png)
