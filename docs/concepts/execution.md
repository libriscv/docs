---
sidebar_position: 1
---

# Execution

_libriscv_ can be loaded with any RISC-V ELF programs. Statically built programs require no effort to load, while dynamic executables will require a dynamic loader (also known as interpreter).

Once loaded, a program can be executed in a variety of ways, but we usually just run the program from start to exit.

## Example

```cpp
#include <fstream>
#include <iostream>
#include <libriscv/machine.hpp>
using namespace riscv;

int main(int argc, char** argv)
{
  if (argc < 2) {
    std::cout << argv[0] << ": [program file] [arguments ...]" << std::endl;
    return -1;
  }

  // Read the RISC-V program into a std::vector:
  std::ifstream stream(argv[1], std::ios::in | std::ios::binary);
  if (!stream) {
    std::cout << argv[1] << ": File not found?" << std::endl;
    return -1;
  }
  const std::vector<uint8_t> binary(
     (std::istreambuf_iterator<char>(stream)),
     std::istreambuf_iterator<char>());

  // Create a new 64-bit RISC-V machine with a 64MB memory limit
  Machine<RISCV64> machine{binary, {.memory_max = 64UL << 20}};

  // The first string vector is the program arguments.
  // The first argument is the programs name, sometimes the full path.
  // This will passed as the argc/argv arguments to the main() function
  // The second string vector is a list of environment variables.
  // These can be found with getenv().
  machine.setup_linux(
    {"micro", "Hello World!"},
    {"LC_TYPE=C", "LC_ALL=C", "USER=groot"});
  machine.setup_linux_syscalls(false, false);

  try {
    // Run through main(), but timeout after 32mn instructions
    machine.simulate(32'000'000ull);
  } catch (const std::exception& e) {
    std::cout << "Program error: " << e.what() << std::endl;
    return -1;
  }

  std::cout << "Program exited with status: " << machine.return_value<int>() << std::endl;
  return 0;
}
```

Once a program has been loaded, the program can be run, which usually takes us through the `main()` (or equivalent function) for that language. The language run-time of the specific language loaded into the sandbox determines what actually happens, but if it's a regular programming language and a standard Linux executable, you can expect normalty.

In the example above we are loading and running the program.


## Pause and resume

Pausing and resuming has first-class support in _libriscv_. This is verified in unit tests by running several programs in random steps, constantly pausing. For example, [this unit test](https://github.com/libriscv/libriscv/blob/master/tests/unit/brutal.cpp#L94-L125) runs the multi-threading test suite in tiny increments in order to verify that even multi-threading works with pause-and-resume.

Pausing and resuming can be very simply done like this:

```cpp
	do {
		// Execute 1000 instructions and then pause
		machine.simulate<false>(1000);
	} while (machine.instruction_limit_reached());
```

The `<false>` template argument to `machine.simulate()` makes an instruction timeout no longer throw an exception. Instead, the emulator pauses. The function `machine.instruction_limit_reached()` lets us know whether or not the machine stopped because execution ended, or because we hit the instruction limit.

## Forking

It's possible to make a fast fork of a machine in order to execute something that is pre-initialized. 

Have a look at the [Drogon Sandbox](https://github.com/libriscv/drogon-sandbox) project in order to see how it's accomplished. In that project we can create, execute and destroy a sandbox in less than 1 microsecond in a production-like setting. Some kind of record, no? :) 
