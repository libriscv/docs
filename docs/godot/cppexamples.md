---
sidebar_position: 6
---

# C++ Examples

Currently, the Godot Sandbox has access to all of Godot through calls, properties, objects, nodes and so on. This might not be apparent from looking at the APIs, especially if one is unfamiliar with how Godot works under the hood.

## The current node

```cpp
get_node()
```

`get_node()` retrieves the current node. It also takes an optional node path:

```cpp
Node2D n = get_node("MyAnimatedSprite2D");
```

which is equivalent to:

```cpp
Node2D n("MyAnimatedSprite2D");
```

Paths are relative the owner of the sandbox. If the sandbox is attached as a script to a node, then the owner is that node.


## Nodes, methods and properties

Let's take an example: Playing animations using an AnimatedSprite2D.

```cpp
Node node("MyAnimatedSprite2D");
```

Above: Accessing a node through its path relative to the script. However, what we get in return is a Node, not an AnimatedSprite2D and not even a Node2D. The API does have a wrapper for Node2D, so let's just make use of that now:

```cpp
Node2D node("MyAnimatedSprite2D");
```

Still, what if we want to play an animation? If we look at the [documentation for AnimatedSprite2D](https://docs.godotengine.org/en/stable/classes/class_animatedsprite2d.html) it has a [play method](https://docs.godotengine.org/en/stable/classes/class_animatedsprite2d.html#class-animatedsprite2d-method-play) used to start playing animations.

In Godot, methods are callable functions on objects, including nodes. So, we can just call `play` as a function on our node object:

```cpp
Node2D node("MyAnimatedSprite2D");
node.call("play", "idle");
```

We don't actually need to "have" an AnimatedSprite2D to call any function that it has. Further, the call is such an important function that there is a dedicated `operator (...)` for it:

```cpp
Node2D mysprite("MyAnimatedSprite2D");
mysprite("play", "idle");
```

That means we have access to all methods of all objects via calls. What about properties? Well, the API has support for `get()` and `set()`, which lets us get and set properties. The [current animation](https://docs.godotengine.org/en/stable/classes/class_animatedsprite2d.html#class-animatedsprite2d-property-animation) is a property that we can use `get()` on:

```cpp
Variant current_animation = mysprite.get("animation");
```

With access to methods, properties, objects, nodes and node-operations, globals and Variants, we can say that the Godot Sandbox has the entire Godot engine available to it.


## Coin pickup example

The sandbox is a node, and so the usual functions like `_process`, `_ready` and `_input` will get called in the Sandbox. If the program running inside the sandbox implements any of these functions, the sandbox will forward the call to the program inside the sandbox.

As an example, this C++ example program implements `_ready`, and so when the ready callbacks are triggered on the scene tree, this C++ function will also get called as part of that.

```cpp
#include "api.hpp"
// We can store data in the script, just like a regular C++ program
static int coins = 0;

extern "C" void reset_game() {
	coins = 0;
}

static void add_coin(const Node& player) {
	coins ++;
	// In our demo project we can access the coin label from the player
	// using a node path: Player -> get_parent() -> Texts -> CoinLabel
	Node coinlabel = player.get_node("../Texts/CoinLabel");
	coinlabel.set("text", "You have collected "
		+ std::to_string(coins) + ((coins == 1) ? " coin" : " coins"));
}

extern "C" Variant _on_body_entered(Variant arg) {
	// This function is called when a body enters the coin
	// Most likely it's the player, but we still check!
	Node player_node = arg.as_node();
	if (player_node.get_name() != "Player")
		return {};

	get_node().queue_free(); // Remove the current coin!
	add_coin(player_node);
	return {};
}

extern "C" Variant _ready() {
	if (is_editor()) {
		// Ignore inputs when in the Editor
		Node(".")("set_process_input", false);
	}
	return {};
}

extern "C" Variant _process(Variant delta) {
	if (is_editor()) {
		// When in the Editor, play an animation
		Node("AnimatedSprite2D")("play", "idle");
	}
	return {};
}

extern "C" Variant _input(Variant event) {
	// Event is the Input singleton
	// Make the coins red whenever the player presses the jump key
	if (event("is_action_pressed", "jump")) {
		get_node().set("modulate", 0xFF6060FF);
	} else if (event("is_action_released", "jump")) {
		get_node().set("modulate", 0xFFFFFFFF);
	}
	return {};
}
```

We can check if we are in the editor using `is_editor()` and do different things based on that. For example, the coin idle animation is automatically playing in the editor.

### Signals

It's also possible to attach signals to VM functions, like `_on_body_entered`.

<img src="/img/cppexamples/connect.png" width="60%" />

:::note

You won't be able to see the sandbox program functions on the image above, but they can still be connected.

:::

Once connected, the Godot engine will directly call the function `_on_body_entered` in our sandboxed program.

### Node paths

All node paths are relative to the node that has the script program attached.

The current node can be accessed using `.`:

```cpp
Node current_node(".");
```

:::note

Getting the parent of the current node can be used to access the tree of the current scene, even when the current node is in its own tree. Eg. `../Texts/CoinLabel` accesses a coin label in another scene.

:::


## Sandboxed Properties

```cpp
#include "api.hpp"

static float jump_velocity = -300.0f;
static float player_speed = 150.0f;

SANDBOXED_PROPERTIES(3, {
	.name = "player_speed",
	.type = Variant::FLOAT,
	.getter = []() -> Variant { return player_speed; },
	.setter = [](Variant value) -> Variant { return player_speed = value; },
	.default_value = Variant{player_speed},
}, {
	.name = "player_jump_vel",
	.type = Variant::FLOAT,
	.getter = []() -> Variant { return jump_velocity; },
	.setter = [](Variant value) -> Variant { return jump_velocity = value; },
	.default_value = Variant{jump_velocity},
}, {
	.name = "player_name",
	.type = Variant::STRING,
	.getter = []() -> Variant { return "Slide Knight"; },
	.setter = [](Variant value) -> Variant { return {}; },
	.default_value = Variant{"Slight Knight"},
});

// More code ...
```

Properties in the Sandbox are supported. They are stored in the global scope, and each one has a custom getter and setter function.

:::note

Reloading the editor is required to make the changes visible after changing embedded properties in the programs. Go to the Editor menu and select Reload Current Project.

:::

![alt text](/img/cppexamples/properties.png)

Properties can be edited in the Godot inspector and is a powerful and simple way to expose data from the script. The values of these properties are saved in the Godot project and restored on reopening the project.


:::note

In this example, the players name cannot be changed in the editor, as the property will just keep returning the same value, _effectively making it read-only_. That is, the getter for the `player_name` property only returns `"Slide Knight"`.

:::

## Timers

```cpp
#include "api.hpp"

extern "C" Variant _on_body_entered(Variant bodyVar) {
	Object engine("Engine");
	engine.set("time_scale", 0.5f);

	Node2D body = cast_to<Node2D> (bodyVar);
	body.set("velocity", Vector2(0.0f, -120.0f));
	body.get_node("CollisionShape2D").queue_free();
	body.get_node("AnimatedSprite2D")("play", "died");

	Timer::oneshot(1.0f, [] (Variant timer) -> Variant {
		timer.as_node().queue_free();
		Object engine("Engine");
		engine.set("time_scale", 1.0f);

		get_tree().call_deferred("reload_current_scene");
		return {};
	});
	return {};
}
```

This is the code from a killzone. Once the player touches it, we slow down the game and make the player appear dead. After a second, we reload the scene.

The Sandbox API supports timers with lambda capture storage. Timers are implemented by creating a Timer node, which means we _must remember to remove it after we're done with it_. In this case we are reloading the scene, but we still do it properly:

```cpp
timer.as_node().queue_free();
```

### Capture storage

Capture storage allows us to bring some data with us into the callback:

```cpp
	struct SomeData {
		int some_int = 1;
		float some_float = 2.0f;
	} somedata;
	// Capture 'somedata' by value
	Timer::oneshot(1.0f, [somedata] (Variant timer) -> Variant {
		timer.as_node().queue_free();

		print("Float: ", somedata.some_float);
		return {};
	});
```

:::note

We should not try to capture complex variants in the capture storage, as they have special sandboxing restrictions. Complex variants are Array, String, Dictionary, Callable, packed arrays etc.

:::

## Callables

We can create a way to make function calls into the sandbox at a later time. In C++ this would be like creating a lambda callback that we can call later.

```py
var func = my_program.vmcallable("my_function")

# Now call it later
func.call(1, 2, 3)
```

Callables can also take pre-passed arguments in an array. Arguments passed to `call()` later will get appended.

```py
var func = my_program.vmcallable("my_function", [1, 2, 3])

# Now call it later
func.call(4, 5, 6)
```

The above call will call the C++ function `my_function` in the sandbox with the arguments `(1, 2, 3, 4, 5, 6)`.

### A complete callable example

Let's make a complete working example. In GDScript:

```py
extends Node

@export var my_program : Sandbox

func _ready() -> void:
	var func = my_program.vmcallable("sum_function", [1, 2, 3])

	# Now call it and print the result
	print("Sum: ", func.call(4, 5, 6))
```

Remember to assign a Sandbox instance to the GDScript export variable:

![alt text](/img/cppexamples/assign_program.png)

You can create a new Sandbox node and hang it under the node with the GDScript attached. Now we implement the `sum_function` in the C++ program that was assigned to the variable:

```cpp
extern "C" Variant sum_function(
	Variant a1, Variant a2, Variant a3, Variant a4, Variant a5, Variant a6)
{
	return int(a1) + int(a2) + int(a3) + int(a4) + int(a5) + int(a6);
}
```

We should see the console print 21:

```
Sum: 21
```
