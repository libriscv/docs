---
sidebar_position: 3
---

# Sandbox

In order to run your code in isolation, you need to create a **Sandbox** node first. 

## Create a Sandbox

Create a new **Scene**. The Root Node can be anything, even a **Node**. Next click **Add Child Node** and add a node of type **Sandbox_SrcSrc** (the name is based on the ELF script that was created and the folder it's in):

![node](/img/sandbox/node.png)

Now, when running the scene, you should see printed on the console:

```js
Hello World!
```

:::note

Even though you are not calling any function on the **Sandbox**, notice that the **main** function is still called. This cannot be disabled.

:::

## Calling functions

Next, create a new **Node** of type **Node** and add a **GDScript**. Inside the script add the following:

```js
extends Node

@export var sandbox: Sandbox_SrcSrc

func _ready() -> void:
	sandbox.public_function(1)
```

This will export to the editor a **Sandbox** which you have to now put on the node you created:

![export sandbox](/img/sandbox/export-sandbox.png)

After setting it and running, you should now see:

```js
Hello world!
Arguments: 
1
Hello from the other side
```
