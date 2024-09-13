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

This mode is super useful when it's attached to objects that are numerous and have very dynamic lifetimes. It is thus possible to use sandboxing on eg. 10'000 monsters, as the memory usage remains the same. All monsters will share the same instance, but can still modify different state inside it.

Care must be taken to reset state manually as scene reloads do not affect these instances.

Advantages:
- Entities with high instance counts.
- Entities with high churn.
- Global statistics, save state.
- Call functions on the object directly
- Attach signals directly

![attach signal](/img/sandbox/attach_signal.png)

It's possible to attach signals directly to a Node like you usually would do with GDScript when the script is directly embedded.

## Guarantees

A sandbox currently gives these guarantees:

- Execution will eventually time out
	- This prevents infinite loops
- Memory and resource usage is restricted
	- A sandbox instance is limited from creating too many resources during a function call
- Memory safety
	- The host game client or server is protected from misbehaving programs

These limits can be configured in the Editors inspector.
