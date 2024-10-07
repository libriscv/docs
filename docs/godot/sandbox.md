---
sidebar_position: 5
---

# Sandbox

In order to run your code in isolation, you need to create a **Sandbox** node first. 

## Create a Sandbox

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

## Creating a Sandbox from memory

It's possible to create a Sandbox using a PackedByteArray:

```cpp
	var buffer : PackedByteArray = ...

    var s : Sandbox = Sandbox.new()
    s.load_buffer(buffer)
```

You can now add the Sandbox as a child to another node. This way avoids using ELF resources, and can be used to load programs downloaded remotely or compressed on disk.
