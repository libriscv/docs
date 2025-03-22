---
sidebar_position: 2
---

# VM calls

Calling guest VM functions is very easy in _libriscv_. It's done through the `machine.vmcall(...)` function:

```cpp
struct {
	int value = 5;
	glm::vec3 pos;
	glm::vec3 rot;
} five;
machine.vmcall("my_function", 1, 2, 3, "four", five);
```

In this example the address of `my_function` is found from the symbol table. Values 1, 2 and 3 are written to registers, "four" and five is pushed on the stack. We can write our guest function like so:

```cpp
struct Five {
	int value;
};
extern "C" void my_function(int one, long two, unsigned three, const char *four, Five *five) {
	printf("Arguments: 1=%d, 2=%ld, 3=%u, 4=%s, 5=%d\n",
		one, two, three, four, five->value);
	fflush(stdout); // Returning from main() usually flushes buffers, but we can do it manually
}
```

## VM call details

VM calls should match the C ABI such that when using `machine.vmcall("myfunc", arg1, arg2)`, it is as if you were calling a C function. Example:

```cpp
static const std::string hello = "Hello Sandboxed World!";
machine.vmcall("my_function", hello, hello.size());
```

This function will look up `my_function` in the programs symbol table (expensive), push the string on the stack, put its address in A0, and finally its length in A1. After that, it will run the function:

```cpp
extern "C"
void my_function(const char* str, size_t len) {
	printf("%.*s\n", (int)len, str);
}
```
Will write `Hello Sandboxed World!\n` to the stdout handler of the emulator (usually forwarded to your terminal). Passing known lengths can make many operations in the script faster and safer.

In C++ we use `extern "C"` to make C-ABI functions. In Rust I know there is a `#[no_mangle]`, as well as `extern "C"`, although please consult the Rust documentation.

Take care to distinguish between float and double values properly. There are (in practice) different handling for these. For example:

```cpp
machine.vmcall("my_function", 1.0, 2.0, 3.0);
```

Will put 3 double values (64-bit floating point) into registers FA0, FA1 and FA2. The only way to read them is through `double` in C:

```cpp
void my_function(double d1, double d2, double d3) {
	printf("%f, %f, %f\n", d1, d2, d3);
}
```

Instead, 1.0f will make them 32-bit floats:
```cpp
machine.vmcall("my_function", 1.0f, 2.0f, 3.0f);
```

They are now float arguments, although in C they will get promoted to double for the va_list:
```cpp
void my_function(float d1, float d2, float d3) {
	printf("%f, %f, %f\n", d1, d2, d3);
}
```

Currently these argument types are fully supported: Integers, floats, doubles, strings, simple structs.

On 32-bit RISC-V, 64-bit integer arguments will use two integer registers. Further, a 64-bit return value will use two integer registers (A0, A1).

There is room for 8 integer arguments and 8 floating-point arguments separately. This means you can efficiently call a function with up to 16 arguments, if need be.

## Return values

Most functions return an integer, so that is the default return value from `machine.vmcall(...)`, however there are other return types. For this we have `machine.return_value<T>`. It's a helper that allows you to return basically anything legal, except 16-byte structs by registers (not yet implemented).

`machine.return_value<T>` supports integers, floats, doubles, C-strings, structs and pointer to structs.

With the following guest program:
```C
	extern const char* hello() {
		return "Hello World!";
	}

	static struct Data {
		int val1;
		int val2;
		float f1;
	} data = {.val1 = 1, .val2 = 2, .f1 = 3.0f};
	extern struct Data* structs() {
		return &data;
	}
```
We can get the results like so:
```cpp
	machine.vmcall("hello");
	printf("%s\n", machine.return_value<std::string>().c_str());

	machine.vmcall("structs");
	const auto* data_ptr = machine.return_value<Data*>();
	assert(data_ptr->val1 == 1);
	assert(data_ptr->val2 == 2);
	assert(data_ptr->f1 == 3.0f);
```
Retrieving a struct by pointer is a zero-copy operation that internally uses the fixed-size span API. The system call documentation goes into more detail here.

## Function references

Another common method is to register functions directly using a helper system call. After registering all the callback functions, we then call a function that stops the machine directly. At that point you also have access to the original main stack and arguments, but you also don't need to retain functions. You can even use local functions that are not exported. And you don't need to always use the C calling convention, although you should take care to match the calling convention you are selecting instead. It is probably easiest and safest to keep using the C calling convention. Example:

```C
static void handle_http_get(const char *url) {
	// ...
}
static void handle_http_post(const char *url, const uint8_t *data, size_t len) {
	// ...
}

int main()
{
	// do stuff ...

	register_get_handler(handle_http_get);
	register_post_handler(handle_http_post);
	wait_for_requests();
}
```

The register functions can be very simple assembly:

```C
inline long register_get_handler(void (*handler) (const char *))
{
	register long a0 asm("a0") = (uintptr_t)handler;
	register long syscall_id asm("a7") = SYSNO_REGISTER_GET;

	asm volatile ("ecall" : "+r"(a0) : "r"(syscall_id) : "memory");

	return a0;
}
inline void wait_for_requests()
{
	register long a0 asm("a0");
	register long syscall_id asm("a7") = SYSNO_WAIT_REQUESTS;

	asm volatile ("ecall" : "=r"(a0) : "r"(syscall_id));
}
```

The idea is to get the address of the `register_get_handler` function to reference it, which will make sure it is not pruned from the executable. Even better, we get the address directly and don't have to look it up in the symbol table. We can then remember it outside of the Machine, so that we can call this function when we are receiving a HTTP GET request.

The `wait_for_requests()` function is intended to simply stop the Machine. It is a system call that calls `machine.stop()`, and it is also recommended to set some boolean `initialized` to true, so that you can verify that the guest program actually called `wait_for_requests()`.

For this to work you will need custom system call handlers, one for each function above, which does the above work. The system calls also need to not collide with any Linux system call numbers if you are using that ABI. This method is the one most likely supported by every single language that compiles down to RISC-V and should be preferred. One improvement one could make in this example is to convert `wait_for_requests()` into a proper function call, so that we are guaranteed that the stack is properly kept and no lifetime issues appear.

Here is a system call wrapper you could use instead using global assembly:
```asm
asm(".global wait_for_requests\n"
"wait_for_requests:\n"
" li a7, " STRINGIFY(SYSNO_WAIT_REQUESTS) "\n"
" ecall\n"
" ret\n");
```
The stringify macro is a common method to turn a `#define` into a string number, baking the system call number into the global assembly. You could, for example, insert a hard-coded number instead.


## Faster calls with Prepared Calls

Prepared calls can improve latency when binary translation is enabled. It also helps enforce function types, as the function has to be specified up-front.

```cpp
#include <libriscv/prepared_call.hpp>
...
riscv::Machine<riscv::RISCV64> machine(...);

// Create a prepared call
riscv::PreparedCall<riscv::RISCV64, void(int, float)> my_function(machine, "my_function");
// Make the VM function call
my_function(1, 2.0f);
// Make the VM function call again
my_function(3, 4.0f);
```

## Manual VM call

Here is an example of a manual vmcall that also exits the simulation every ~10 000 instructions. Maybe you want to do some things in between? This method is used in the [D00M example](https://github.com/libriscv/libriscv/blob/master/examples/doom/src/main.cpp).

```cpp
auto test_addr = machine.address_of("test");

// Reset the stack pointer from any previous call to its initial value
machine.cpu.reset_stack_pointer();
// Reset the instruction counter, as the resume() function will only increment it
machine.reset_instruction_counter();
// Function call setup for the guest VM, but don't start execution
machine.setup_call(555, 666);
machine.cpu.jump(test_addr);
// Run the program for X amount of instructions, then print something, then
// resume execution again. Do this until stopped.
do {
	// Execute 10'000 instructions at a time without resetting the counter
	machine.resume<false>(10'000);
	// Do some work in between simulation
	printf("Working ...\n");
} while (machine.instruction_limit_reached());
```

The helper function `machine.instruction_limit_reached()` will tell you if the instruction limit was reached during simulation, and will return `false` when the machine stops normally (in this case).

## Interrupting a running machine

It is possible to interrupt a running machine to perform another task. This can be done using the `machine.preempt()` function. A machine can also interrupt itself without any issues. Preemption stores and restores all registers, making it slightly expensive, but guarantees the ability to preempt from any location.

### Alternative 1:

```cpp
template <typename... Args>
inline std::optional<int64_t> Script::call(gaddr_t address, Args&&... args)
{
	try
	{
		return {machine().preempt(MAX_CALL_INSTR, address, std::forward<Args>(args)...)};
	}
	catch (const std::exception& e)
	{
		this->handle_exception(address);
	}
	return std::nullopt;
}
```
This example uses optional to determine if a call failed. Otherwise, it returns an (optional) integer which is the return value from the called function. `MAX_CALL_INSTR` is the number of instruction to execute before it's considered a timeout. `address` is the address of the function we want to call, which you can get with `machine.address_of("my_function")`.

We make `handle_exception()` opaque so that it hides the implementation, and inside we re-throw the exception to handle it properly.

### Alternative 2:

High-quality scripting solutions will use pre-emption only when re-entrancy is detected:

```cpp
template <typename... Args>
inline std::optional<Script::sgaddr_t> Script::call(gaddr_t address, Args&&... args)
{
	ScriptDepthMeter meter(this->m_call_depth);
	try
	{
		if (LIKELY(meter.is_one()))
			return {machine().vmcall<MAX_CALL_INSTR>(
				address, std::forward<Args>(args)...)};
		else if (LIKELY(meter.get() < MAX_CALL_DEPTH))
			return {machine().preempt(MAX_CALL_INSTR,
				address, std::forward<Args>(args)...)};
		else
			this->max_depth_exceeded(address);
	}
	catch (const std::exception& e)
	{
		this->handle_exception(address);
	}
	return std::nullopt;
}
```
From `script.call(...)` as implemented in the [gamedev example](https://github.com/libriscv/libriscv/blob/master/examples/gamedev/script.hpp). `ScriptDepthMeter` measures the current call depth in order to avoid too many recursive calls back into the script, while also using the faster `vmcall()` on the first call.

## VM Calls with the C API

In the C API each argument register has to be populated manually, and the return value(s) have to be read as well.

A general rule for passing data to a function is that:
1. Each integer goes into the next free integer register
2. Each pointer goes into the next free integer register
3. Each float goes into the next free float register of that type

### Example

Function:
```c
long my_function(const char* arg1, const bool arg2, const struct my_struct* arg3, size_t arg4, float arg5);
```

Input values:
```c
const char* mystring = "";
const bool  mybool = true;
const struct mystruct s;
const size_t mysize = 4;
const float  myfloat = 5.0f;
```

C++ API:
```cpp
long result =
  machine.vmcall(mystring, mybool, mystruct, mysize, myfloat);
```

C API:
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
