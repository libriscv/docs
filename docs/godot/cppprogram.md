---
sidebar_position: 2
---

# C++ Code

The Sandbox can run C++ code inside it in isolation, but first you need to build the C++ code.

## What you'll need

- [Docker](https://docs.docker.com/compose/) installed and running.

## C++ Source Files

In Godot create a new folder called to put your C++ program inside. Inside it create a new CPPScript, by clicking on the folder and selecting `Create New` -> `Script` -> `CPPScript`.

![new script](/img/cppprogram/new-script.png)

The default C++ template should look something like this:

```cpp
#include "api.hpp"

extern "C" Variant public_function(String arg) {
    print("Arguments: ", arg);
    return "Hello from the other side";
}
```

Now, each time you save this file a C++ compiler will be invoked to produce an .elf executable in the same directory. This file is created by compiling all source files in that directory to a single binary using docker. The image used is [libriscv/cpp_compiler](https://github.com/orgs/libriscv/packages).

The name of the program is based on the folder name, hence if the folder is called `src` the program will be called `src.elf`. This allows you to have multiple source files, which will all be automatically compiled together into one final program, while also supporting multiple programs separated by folders.

:::note

If it is not working, you need to set the docker path manually by going to **Project** -> **Project Settings** -> `editor/script/docker` and modifying to the path where you have installed docker. If left blank it will use what it finds in the **PATH** variable.

Also, after each update you will need to `docker pull` the container in order to keep it updated to the latest API.

:::

## ELF Script

Once you compiled the source code to a binary, you can investigate it. To do this, click on the `.elf` file and you should see all the functions that are exported and available to call from Godot. These functions are exported normally and can even be used as targets for signals.

![elf file](/img/cppprogram/elf-file.png)

# Demonstration

We maintain a [Godot project that demonstrates using C++](https://github.com/libriscv/godot-sandbox-demo) for scripting. So, have a look at that to understand how you can use sandboxed C++ in your own Godot projects.
