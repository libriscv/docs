---
sidebar_position: 4
---

# Sandbox

In order to run your code in isolation, you need to create a **Sandbox** node first. 

## Creating a Sandbox

Create a new **Scene**. The Root Node can be anything, even a **Node**. Next click **Add Child Node** and add a node of type **Sandbox_SrcSrc** (the name is based on the ELF script that was created and the folder it's in):

![node](/img/sandbox/node.png)

:::note

Even though you are not calling any function on the **Sandbox**, the **main** function is always called. This cannot be disabled, as it is part of the C++ language. You may override the `int main()` function with your own.

:::

## Calling functions

Next, create a new **Node** of type **Node** and add a **GDScript**. Inside the script add the following:

```js
extends Node

@export var sandbox: Sandbox_SrcSrc

func _ready() -> void:
	print(sandbox.public_function("Hello World!"))
```

This will export to the editor a **Sandbox** which you have to now put on the node you created:

![export sandbox](/img/sandbox/export-sandbox.png)

After setting it and running, you should now see:

```
Arguments: 
 Hello World!
Hello from the other side
```


## Using programs directly as scripts

There is a second mode of operation for sandboxes: Attached directly to a node as a script, similar to GDScript. When this happens, the sandbox is shared among all instances of that program. This means that even when deleting all instances that uses the sandbox, the sandbox will remain as one instance.

![use scripts directly](/img/sandbox/embed_direct.png)

This mode is super useful when it's attached to objects that are numerous or have very dynamic lifetimes. It is thus possible to use sandboxing on eg. 10'000 monsters, as the memory usage remains the same. All monsters will share the same instance, but can still modify different state inside it.

:::note

Care must be taken to reset state manually as scene reloads do not affect these instances. They are never freed.

:::

Advantages:
- Entities with high instance counts.
- Entities with high churn.
- Call functions on the object directly
- Attach signals directly
- Expose sandboxed properties
- Shared state between all instances.

Disadvantages:
- Shared state between all instances requires per-object structures internally to manage individual object state
- No control over lifetime of Sandbox
- All limits and restrictions are shared

![attach signal](/img/sandbox/attach_signal.png)

It's possible to attach signals directly to a Node like you usually would do with GDScript when the script is directly embedded.

## Dedicated Sandbox nodes

When a dedicated Sandbox node is created, the program inside has the same lifetime as the node. Like the first paragraph we create a new Sandbox using the listed Sandbox nodes that show up as ELF programs are scanned. So, a typical node name can be `Sandbox_TestTest` if the ELF is stored in `test/test.elf`.

It's not a shared instance. If you create 100 dedicated Sandbox nodes, they will all have separate memory, state and lifetime.

Internally, many things that cannot be seen are shared (that is safe to share, like read-only memory), in order to reduce memory pressure. But that is an implementation detail.

Even though each Sandbox has allocated a lot of memory, if it's not written to it will not consume memory. So it may be possible to have many nodes and end up using less memory than expected.

Signals can be attached to Sandbox nodes by using `sandbox.vmcallable("my_function")` to get a Callable that will make a VM function call.

Advantages:
- Separate memory and state for each Sandbox
- Lifetime managed by you (same as node)
- Individual restrictions and limits for each Sandbox
- No shared memory between objects in the VM (less state-keeping)

Disadvantages:
- Uses more memory than shared instances
- Requires creating and managing a node
- Cannot manage sandboxed properties, unlike a script

## Creating a Sandbox from memory

It's possible to create a Sandbox using a PackedByteArray:

```cpp
    var buffer : PackedByteArray = ...

    var s : Sandbox = Sandbox.new()
    s.load_buffer(buffer)
```

You can now add the Sandbox as a child to another node. This way avoids using ELF resources, and can be used to load programs downloaded remotely or compressed on disk.

```cpp
    var elf : ELFScript = load("res://scenes/mod/mod.elf")

    var s : Sandbox = Sandbox.new()
    s.load_buffer(elf.get_content())
```

You can also load an ELF resource and use its content as a program. And, finally:

```cpp
    var elf : ELFScript = load("res://scenes/mod/mod.elf")

    var s : Sandbox = Sandbox.new()
    s.set_script(elf)
```

If you want to create a program shared with many nodes, use `set_script(elf_resource)` which sets the ELF resource directly and references it. This method enables sandboxed properties.


## Sandbox API reference

The public API of the Sandbox node, which [originates from here](https://github.com/libriscv/godot-sandbox/blob/main/src/sandbox.h).

```cpp
class Sandbox : public Node {

	// -= VM function calls =-

	/// @brief Make a function call to a function in the guest by its name.
	/// @param args The arguments to pass to the function, where the first argument is the name of the function.
	/// @param arg_count The number of arguments.
	/// @param error The error code, if any.
	/// @return The return value of the function call.
	Variant vmcall(const Variant **args, GDExtensionInt arg_count, GDExtensionCallError &error);

	/// @brief Make a function call to a function in the guest by its name. Always use Variant values for arguments, regardless of the Unboxed Arguments property value.
	/// @param args The arguments to pass to the function, where the first argument is the name of the function.
	/// @param arg_count The number of arguments.
	/// @param error The error code, if any.
	/// @return The return value of the function call.
	/// @note Every function argument is treated as a Variant in the Sandbox programs,
	/// even when it's a simple type like an integer or float.
	Variant vmcallv(const Variant **args, GDExtensionInt arg_count, GDExtensionCallError &error);

	/// @brief Make a function call to a function in the guest by its name.
	/// @param function The name of the function to call.
	/// @param args The arguments to pass to the function.
	/// @return The return value of the function call.
	/// @note The extra arguments are saved in the callable object, and will be passed to the function when it is called
	/// in front of the arguments passed to the call() method. So, as an example, if you have a function that takes 3 arguments,
	/// and you call it with 2 arguments, you can later call the callable object with one argument, which turns into the 3rd argument.
	Variant vmcallable(String function, Array args);
	Variant vmcallable_address(uint64_t address, Array args);

	/// @brief Set whether to prefer register values for VM function calls.
	/// @param use_unboxed_arguments True to prefer register values, false to prefer Variant values.
	void set_use_unboxed_arguments(bool use_unboxed_arguments);

	/// @brief Get whether to prefer register values for VM function calls.
	/// @return True if register values are preferred, false if Variant values are preferred.
	bool get_use_unboxed_arguments() const;

	/// @brief Set whether to use precise simulation for VM execution.
	/// @param use_precise_simulation True to use precise simulation, false to use fast simulation.
	void set_use_precise_simulation(bool use_precise_simulation);

	/// @brief Get whether to use precise simulation for VM execution.
	/// @return True if precise simulation is used, false otherwise.
	bool get_use_precise_simulation() const { return m_precise_simulation; }

	// -= Sandbox Properties =-

	uint32_t get_max_refs() const { return m_max_refs; }
	void set_max_refs(uint32_t max);
	void set_memory_max(uint32_t max) { m_memory_max = max; }
	uint32_t get_memory_max() const { return m_memory_max; }
	void set_instructions_max(int64_t max) { m_insn_max = max; }
	int64_t get_instructions_max() const { return m_insn_max; }
	void set_heap_usage(int64_t) {} // Do nothing (it's a read-only property)
	int64_t get_heap_usage() const;
	void set_exceptions(unsigned exceptions) {} // Do nothing (it's a read-only property)
	unsigned get_exceptions() const { return m_exceptions; }
	void set_timeouts(unsigned budget) {} // Do nothing (it's a read-only property)
	unsigned get_timeouts() const { return m_timeouts; }
	void set_calls_made(unsigned calls) {} // Do nothing (it's a read-only property)
	unsigned get_calls_made() const { return m_calls_made; }

	static uint64_t get_global_timeouts() { return m_global_timeouts; }
	static uint64_t get_global_exceptions() { return m_global_exceptions; }
	static uint64_t get_global_calls_made() { return m_global_calls_made; }

	/// @brief Get the global instance count of all sandbox instances.
	/// @return The global instance count.
	static uint64_t get_global_instance_count() { return m_global_instance_count; }

	/// @brief Get the globally accumulated startup time of all sandbox instantiations.
	/// @return The accumulated startup time.
	static double get_accumulated_startup_time() { return m_accumulated_startup_time; }

	/// @brief Check if a function exists in the guest program.
	/// @param p_function The name of the function to check.
	/// @return True if the function exists, false otherwise.
	bool has_function(const StringName &p_function) const;

	// -= Sandbox Restrictions =-

	/// @brief Enable *all* restrictions on the sandbox, restricting access to
	/// external classes, objects, object methods, object properties, and resources.
	/// In effect, all external access is disabled.
	void set_restrictions(bool enabled);

	/// @brief Check if restrictions are enabled on the sandbox.
	/// @return True if *all* restrictions are enabled, false otherwise.
	bool get_restrictions() const;

	/// @brief Add an object to the list of allowed objects.
	/// @param obj The object to add.
	void add_allowed_object(godot::Object *obj);

	/// @brief Remove an object from the list of allowed objects.
	/// @param obj The object to remove.
	/// @note If the list becomes empty, all objects are allowed.
	void remove_allowed_object(godot::Object *obj);

	/// @brief Clear the list of allowed objects.
	void clear_allowed_objects();

	/// @brief Check if an object is allowed in the sandbox.
	bool is_allowed_object(godot::Object *obj) const;

	/// @brief Set a callback to check if an object is allowed in the sandbox.
	/// @param callback The callable to check if an object is allowed.
	void set_object_allowed_callback(const Callable &callback);

	/// @brief Check if a class name is allowed in the sandbox.
	bool is_allowed_class(const String &name) const;

	/// @brief Set a callback to check if a class is allowed in the sandbox.
	/// @param callback The callable to check if a class is allowed.
	void set_class_allowed_callback(const Callable &callback);

	/// @brief Check if a resource is allowed in the sandbox.
	bool is_allowed_resource(const String &path) const;

	/// @brief Set a callback to check if a resource is allowed in the sandbox.
	/// @param callback The callable to check if a resource is allowed.
	void set_resource_allowed_callback(const Callable &callback);

	/// @brief Check if accessing a method on an object is allowed in the sandbox.
	/// @param method The name of the method to check.
	/// @return True if the method is allowed, false otherwise.
	bool is_allowed_method(godot::Object *obj, const Variant &method) const;

	/// @brief Set a callback to check if a method is allowed in the sandbox.
	/// @param callback The callable to check if a method is allowed.
	void set_method_allowed_callback(const Callable &callback);

	/// @brief Check if accessing a property on an object is allowed in the sandbox.
	/// @param obj The object to check.
	/// @param property The name of the property to check.
	/// @return True if the property is allowed, false otherwise.
	bool is_allowed_property(godot::Object *obj, const Variant &property) const;

	/// @brief Set a callback to check if a property is allowed in the sandbox.
	/// @param callback The callable to check if a property is allowed.
	void set_property_allowed_callback(const Callable &callback);

	/// @brief A falsy function used when restrictions are enabled.
	/// @return Always returns false.
	static bool restrictive_callback_function(Variant) { return false; }

	// -= Sandboxed Properties =-
	// These are properties that are exposed to the Godot editor, provided by the guest program.

	/// @brief Get a property from the sandbox.
	/// @param name The name of the property.
	/// @return The current value of the property.
	Variant get(const StringName &name);

	/// @brief Set a property in the sandbox.
	/// @param name The name of the property.
	/// @param value The new value to set.
	void set(const StringName &name, const Variant &value);

	/// @brief Get a list of properties.
	/// @return The list of properties.
	Array get_property_list() const;

	// -= Program management & public functions =-

	/// @brief Check if a program has been loaded into the sandbox.
	/// @return True if a program has been loaded, false otherwise.
	bool has_program_loaded() const;

	/// @brief Set the program to run in the sandbox.
	/// @param program The program to load and run.
	void set_program(Ref<ELFScript> program);

	/// @brief Get the program loaded into the sandbox.
	/// @return The program loaded into the sandbox.
	Ref<ELFScript> get_program();

	/// @brief Load a program from a buffer into the sandbox.
	/// @param buffer The buffer containing the program.
	void load_buffer(const PackedByteArray &buffer);

	/// @brief Get the public functions available to call in the guest program.
	/// @return Array of public callable functions.
	PackedStringArray get_functions() const;

	// -= Self-testing, inspection and internal functions =-

	/// @brief Get the current Callable set for redirecting stdout.
	/// @return The current Callable set for redirecting stdout.
	const Callable &get_redirect_stdout() const;

	/// @brief Set a Callable to redirect stdout from the guest program to.
	/// @param callback The callable to redirect stdout.
	void set_redirect_stdout(const Callable &callback);

	/// @brief Get the 32 integer registers of the RISC-V machine.
	/// @return An array of 32 registers.
	Array get_general_registers() const;

	/// @brief Get the 32 floating-point registers of the RISC-V machine.
	/// @return An array of 32 registers.
	Array get_floating_point_registers() const;

	/// @brief Set the 8 argument registers of the RISC-V machine, A0-A7.
	/// @param args The arguments to set.
	void set_argument_registers(Array args);

	/// @brief Get the current instruction being executed, as a string.
	/// @return The current instruction.
	String get_current_instruction() const;

	/// @brief Enable resuming the program execution after a timeout.
	/// @note Must be called before the program is run. Not available for VM calls.
	void make_resumable();

	/// @brief Resume execution of the program. Loses the current call state.
	bool resume(uint64_t max_instructions);

	/// @brief Binary translate the program and produce embeddable code
	/// @param ignore_instruction_limit If true, ignore the instruction limit. Infinite loops are possible.
	/// @param automatic_nbit_as If true, use and-masking on all memory accesses based on the rounded-down Po2 arena size.
	/// @return The binary translation code.
	/// @note This is only available if the RISCV_BINARY_TRANSLATION flag is set.
	/// @warning Do *NOT* enable automatic_nbit_as unless you are sure the program is compatible with it.
	String emit_binary_translation(bool ignore_instruction_limit = true, bool automatic_nbit_as = false) const;

	/// @brief  Check if the program has found and loaded binary translation.
	/// @return True if binary translation is loaded, false otherwise.
	bool is_binary_translated() const;

	/// @brief  Generate the C++ API to a String, based on current Godot version and loaded extensions.
	/// @return The generated C++ API.
	static String generate_api(String language = "cpp", String header_extra = "");
};
```
