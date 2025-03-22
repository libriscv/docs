---
sidebar_position: 10
---

# Restrictions & Isolation

## Enabling restrictions

There is a property called `restrictions`, that will enable all restrictions on the Sandbox:

```py
var s : Sandbox
s.restrictions = true
```

Once enabled, the Sandbox will no longer allow any external access. In order to make the program work again, we must allow some things.

:::note

When passing objects as arguments to function calls into the Sandbox, those objects will be accessible regardless of restrictions.

:::

The act of setting the `restrictions` property to true will set each Callable (mentioned below) to a function that always returns false, resulting in every interaction with anything external failing. However, it only sets the callables that haven't been set before. In other words, if you have set a custom callable, it will not get overwritten. Setting the property to false will set all callables to an empty (invalid) callable, disabling restrictions. This currently includes your own set callables.

## Fine-tuning restrictions

Each sandbox instance has a Callable set for each type of external access. Right after restrictions are enabled these callables all deny access, resulting it no external access.

### Class access

We can intercept attempts to instantiate using `set_class_allowed_callback`:

```py
sandbox.set_class_allowed_callback(func(sandbox, name): return name == "Node")
assert(sandbox.is_allowed_class("Node"))
```

The above example will only allow `Node` to be instantiated.

### Object access

We can modify the list of objects accessible in the Sandbox instance:

```py
sandbox.add_allowed_object(player)
sandbox.remove_allowed_object(player)
sandbox.clear_allowed_objects()
```

If a large change has been made in the game, like removing a whole tree, clearing the allowed objects may be a good idea.


We can intercept attempts to access objects using `set_object_allowed_callback`:

```py
sandbox.set_object_allowed_callback(func(sandbox, obj): return obj.get_name() == "Player")
```

The above example will only allow access to an object named `Player`. The callback is only used if the list of allowed objects does not already have the object in it.

:::note

If performance is a concern for accessing a particular object, add it to the list of allowed objects during the callable. If the player is never destroyed and it should be accessible, add it early.

:::

### Method access

We can intercept attempts to use a method on an object using `set_method_allowed_callback`:

```py
sandbox.set_method_allowed_callback(func(sandbox, obj, method): return method != "free")
```

The above example will disallow access to a method called `free` on every object.

### Property access

We can intercept attempts to get or set a property on an object using `set_property_allowed_callback`:

```py
sandbox.set_property_allowed_callback(func(sandbox, obj, prop): return prop != "name")
```

The above example will disallow access to any property called `name` on every object.

### Resource access

We can intercept attempts to load resources using `set_resource_allowed_callback`:

```py
sandbox.set_resource_allowed_callback(func(sandbox, path): return path == "res://my.res")
assert(sandbox.is_allowed_resource("res://my.res"))
```

The above example will only allow loading a resource from the path `res://my.res`.


## Generating access lists

All callbacks can be a function in GDScript and one can print that a Sandbox instance tried to access an object or a resource. If you choose to also return true to allow the access, you can generate a trace that you can use to make a list:

```py
var resource_list : Array

func my_resource_allowed_callback(sandbox, path):
	if path == "res://my.res":
		return true

	print("[TRACE] Resource ", path)
	resource_list.push_back(path)
	return true
```

Then, when you are happy with the lists of each type, you can start returning false and deny access:

```py
var resource_list : Array

func my_resource_allowed_callback(sandbox, path):
	return resource_list.has(path)
```
