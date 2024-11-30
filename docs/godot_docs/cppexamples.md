---
sidebar_position: 4
---

# C++ Examples

Currently, the Godot Sandbox has access to all of Godot through calls, properties, objects, nodes and so on. This might not be apparent from looking at the APIs, especially if one is unfamiliar with how Godot works under the hood.

## Node paths

All node paths are relative to the node that has the script program attached.

The current node can be accessed using `.` and `get_node()`:

```cpp
Node current_node(".");

get_node()
```

`get_node()` also takes an optional node path:

```cpp
AnimatedSprite2D n = get_node("MyAnimatedSprite2D");
```

which is equivalent to:

```cpp
AnimatedSprite2D n("MyAnimatedSprite2D");

AnimatedSprite2D n = get_node<AnimatedSprite2D>("MyAnimatedSprite2D");
```

As written before, paths are relative to the owner of the sandbox. If the sandbox is attached as a script to a node, then the owner is that node.

You can also retrieve a node relative to a node:

```cpp
Node2D n("MyAnimatedSprite2D");
Label n2 = n.get_node<Label>("../Texts/CoinLabel");
```

:::note

Getting the parent of the current node (`".."`) can be used to access the tree of the current scene, even when the current node is in its own tree. Eg. `../Texts/CoinLabel` could access a coin label in another scene.

:::

The current scene tree is also accessible through a global helper:

```cpp
get_tree()
```

So, to reload the current scene after the frame ends:

```cpp
get_tree().call_deferred("reload_current_scene");
```


## VM function calls

The Sandbox is by default in unboxed arguments mode, which means that it will prefer to pass primitive or performant arguments to the VM. As a result, incoming arguments are usually not a Variant. However, the return value is always a Variant.

The simplest function is one that returns only a Variant.

```cpp
Variant my_function() {
	return Nil;
}
```
Every function that is to be called from Godot must return a Variant. The C++ API has a shortcut for returning nothing: `Nil`. It's a default-constructed Variant.

### Example function

Example:

```cpp
Variant function_that_takes_string_node_input(String str, Node node, Object input) {
	Dictionary d = Dictionary::Create();
	d["123"] = "456";
	d[str] = node;
	return d;
}
```

The unboxed arguments mode can be disabled per sandbox as a property: "Use Unboxed Arguments". The default can be changed in the project settings, in the Script section. Unticking "Unboxed Types for Sandbox Arguments" will make all Sandboxes stop using unboxed arguments by default. When disabled, all arguments are Variants. In that case the function looks like this:

```cpp
Variant function_that_takes_string_node_input(Variant str, Variant node, Variant input) {
	Dictionary d = Dictionary::Create();
	d["123"] = "456";
	d[str] = node;
	return d;
}
```

Again, the above example function is for when "Use Unboxed Arguments" are disabled in the Sandbox with the function.


### Primitive types

When primitive types and small structs are passed to the Sandbox, they get passed by value directly in registers, which is beneficial for performance.

Godot integers become `int64_t` or `long`, floats become `double` and booleans become `bool`. 2-vectors become `Vector2` and `Vector2i`.

```cpp
Variant function_with_int_float_and_bool(int x, double y, bool z) {
	return Nil;
}
```

We always need to return a variant. We are not required to read a 64-bit integer. We can choose to read it as any integer, eg. `uint8_t`, `int64_t`, `int`, `long` etc.

Floating-point values are `double` as arguments. Make sure you don't try to read a `float` as it will be read as garbage. Booleans are just `bool` (or an integer, technically).

### Complex types

Complex types are those that benefit greatly from being accessed by reference. Examples of complex types are String, Array, Dictionary, Object, Callables and all nodes.

The C++ API has wrappers for most types:

```cpp
Variant function_that_takes_wrapped_types(String str, Array a, Dictionary d, Variant callable) {
	return Nil;
}
```
As shown, `Callable` does not yet have a wrapper, but can still be used. Simply use `callable(x, y, z)`.


## Nodes, methods and properties

Let's take an example: Playing animations using an AnimatedSprite2D. First we will use generic calls and properties, and at the end we will use the actual class.

```cpp
AnimatedSprite2D mysprite = get_node<AnimatedSprite2D>("MyAnimatedSprite2D");
```

or through the path constructor:

```cpp
AnimatedSprite2D mysprite("MyAnimatedSprite2D");
```

And now, what if we want to play an animation? If we look at the [documentation for AnimatedSprite2D](https://docs.godotengine.org/en/stable/classes/class_animatedsprite2d.html) it has a [play method](https://docs.godotengine.org/en/stable/classes/class_animatedsprite2d.html#class-animatedsprite2d-method-play) used to start playing animations.

In Godot, methods are callable functions on objects, including nodes. So, we can just call `play` as a function on our node object:

```cpp
mysprite.call("play", "idle");
```

We don't actually need to "have" an AnimatedSprite2D to call any function that it has. Further, the call is such an important function that there is a dedicated `operator (...)` for it:

```cpp
mysprite("play", "idle");
```

That means we have access to all methods of all objects via calls. What about properties? Well, the API has support for `get()` and `set()`, which lets us get and set properties. The [current animation](https://docs.godotengine.org/en/stable/classes/class_animatedsprite2d.html#class-animatedsprite2d-property-animation) is a property that we can use `get()` on:

```cpp
Variant current_animation = mysprite.get("animation");
```

With access to methods, properties, objects, nodes and node-operations, globals and Variants, we can say that the Godot Sandbox has the entire Godot engine available to it.

## The run-time API

All classes are available, generated at run-time:

```cpp
AnimatedSprite2D mysprite("MyAnimatedSprite2D");
mysprite.play("idle");
String animation = mysprite.animation();

CharacterBody2D player("%Player");
const bool f = player.is_on_floor();
```

The API is generated from the static function [Sandbox.generate_api](../godot_intro/sandbox.md#sandbox-api-reference):
```py
	var api = Sandbox.generate_api("cpp")
	var fa = FileAccess.open("generated_api.hpp", FileAccess.WRITE)
	fa.store_string(api)
	fa.close()
```

The C++ API will look for `generated_api.hpp`, and if found, will automatically include it.

:::note

In practice you can write code just like GDScript. Even classes loaded at run-time should be accessible with auto-complete.

:::


## Variant Lifetimes

The sandbox has to maintain integrity, and so any Variant created during a call without outside backing will be lost. You can think of the sandbox as becoming forgetful after initialization is complete. You can think of initialization as anything happening during `int main()` or in global constructors.

```cpp
static std::vector<int> vec;
Variant myfunction() {
	Dictionary d = Dictionary::Create();
	d["123"] = "456";
	vec.push_back(123);
	return Nil;
}
```
The above dictionary will disappear unless returned by the call. The vector is modified as expected.

```cpp
static std::vector<int> vec;
Variant myfunction(Dictionary d) {
	d["123"] = "456";
	vec.push_back(123);
	return Nil;
}
```
All modifications to the Dictionary and vector above will be permanent.

```cpp
Variant myfunction() {
	Dictionary d = Dictionary::Create();
	d["123"] = "456";
	return d;
}
```
The returned Dictionary can be used by the caller.

The sandbox has storage too, of course. You can use the sandbox any way you like, with exception to non-trivial Variants that lack backing.

However, during initialization we can create Variants with backing:

```cpp
static Dictionary d = Dictionary::Create();
Variant myfunction() {
	d["123"] = "456";
	return Nil;
}
```
Since the Dictionary was created during initialization, it can be used by future calls into the VM. Since we know that modifications to dictionaries are also permanent, it becomes a fully usable Dictionary.


## Coin pickup example

The sandbox is a node, and so the usual functions like `_process`, `_ready` and `_input` will get called in the Sandbox. If the program running inside the sandbox implements any of these functions, the sandbox will forward the call to the program inside the sandbox.

As an example, this C++ example program implements `_ready`, and so when the ready callbacks are triggered on the scene tree, this C++ function will also get called as part of that.

```cpp
#include "api.hpp"
static int coins = 0;

extern "C" Variant reset_game() {
	coins = 0;
	return Nil;
}

static void add_coin(const Node& player) {
	coins ++;
	// In our demo project we can access the coin label from the player
	// using a node path: Player -> get_parent() -> Texts -> CoinLabel
	Label coinlabel = player.get_node("../Texts/CoinLabel");
	coinlabel.set_text("You have collected "
		+ std::to_string(coins) + ((coins == 1) ? " coinerino" : " coinerinos"));
}

extern "C" Variant _on_body_entered(CharacterBody2D body) {
	// This function is called when a body enters the coin
	// Most likely it's the player, but we still check!
	if (body.get_name() != "Player")
		return Nil;

	Node coin = get_node();
	coin.queue_free(); // Remove the current coin!
	add_coin(body);
	return Nil;
}

extern "C" Variant _ready() {
	if (is_editor_hint()) {
		get_node().set_process_input(false);
	}
	return Nil; //
}

extern "C" Variant _process(double delta) {
	if (is_editor_hint()) {
		AnimatedSprite2D("AnimatedSprite2D").play("idle");
	}
	return Nil;
}

extern "C" Variant _input(InputEvent event) {
	if (event.is_action_pressed("jump")) {
		get_node<Node2D>().set_modulate(0xFF6060FF);
	} else if (event.is_action_released("jump")) {
		get_node<Node2D>().set_modulate(0xFFFFFFFF);
	}
	return Nil;
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
	.setter = [](Variant value) -> Variant { return Nil; },
	.default_value = Variant{"Slight Knight"},
});

// More code ...
```

Properties in the Sandbox are supported. They are stored in the global scope, and each one has a custom getter and setter function.

![alt text](/img/cppexamples/properties.png)

Properties can be edited in the Godot inspector and is a powerful and simple way to expose data from the script. The values of these properties are saved in the Godot project and restored on reopening the project.


:::note

In this example, the players name cannot be changed in the editor, as the property will just keep returning the same value, _effectively making it read-only_. That is, the getter for the `player_name` property only returns `"Slide Knight"`.

:::

### Per-instance Sandboxed Properties

Sometimes we want properties per instance, even if we have several. In that case, we can access the property based on the value of `get_node()`. A `std::unordered_map` on the `get_node().address()` can be used to achieve this:

```cpp
// If we need per-node properties in shared sandboxes, we will
// need to use the PER_OBJECT macro to distinguish between them.
struct PlayerState {
	float jump_velocity = -300.0f;
	float player_speed = 150.0f;
	std::string player_name = "Slide Knight";
};
PER_OBJECT(PlayerState);
static PlayerState &get_player_state() {
	return GetPlayerState(get_node());
}

SANDBOXED_PROPERTIES(3, {
	.name = "player_speed",
	.type = Variant::FLOAT,
	.getter = []() -> Variant { return get_player_state().player_speed; },
	.setter = [](Variant value) -> Variant { return get_player_state().player_speed = value; },
	.default_value = Variant{get_player_state().player_speed},
}, {
	.name = "player_jump_vel",
	.type = Variant::FLOAT,
	.getter = []() -> Variant { return get_player_state().jump_velocity; },
	.setter = [](Variant value) -> Variant { return get_player_state().jump_velocity = value; },
	.default_value = Variant{get_player_state().jump_velocity},
}, {
	.name = "player_name",
	.type = Variant::STRING,
	.getter = []() -> Variant { return get_player_state().player_name; },
	.setter = [](Variant value) -> Variant { return get_player_state().player_name = value.as_std_string(); },
	.default_value = Variant{"Slide Knight"},
});
```

In this program, each instance will have their own separate properties.

### Adding properties dynamically

It's possible to add properties during `main()` using `add_property`:

```cpp
add_property("player_speed", Variant::FLOAT,
	[]() -> Variant { return player_speed; },
	[](Variant value) -> Variant { return player_speed = value; },
	player_speed);
```

This feature is intended to make it easier to support languages with limited capability of instantiating an array of structs on the global scope.


## Timers

```cpp
#include "api.hpp"

extern "C" Variant _on_body_entered(CharacterBody2D body) {
	Engine::get_singleton().set_time_scale(0.5f);

	body.set_velocity(Vector2(0.0f, -120.0f));
	body.get_node("CollisionShape2D").queue_free();
	body.get_node("AnimatedSprite2D")("play", "died");

	CallbackTimer::native_oneshot(1.0f, [] (Timer timer) -> Variant {
		timer.queue_free();
		Engine::get_singleton().set_time_scale(1.0f);

		get_tree().call_deferred("reload_current_scene");
		return Nil;
	});
	return Nil;
}
```

This is the code from a killzone. Once the player touches it, we slow down the game and make the player appear dead. After a second, we reload the scene.

The Sandbox API supports timers with lambda capture storage. Timers are implemented by creating a Timer node, which means we _must remember to remove it after we're done with it_. In this case we are reloading the scene, but we still do it properly:

```cpp
timer.queue_free();
```

### Capture storage

Capture storage allows us to bring some data with us into the callback:

```cpp
	struct SomeData {
		int some_int = 1;
		float some_float = 2.0f;
	} somedata;
	// Capture 'somedata' by value
	Timer::oneshot(1.0f, [somedata] (Node timer) -> Variant {
		timer.queue_free();

		print("Float: ", somedata.some_float);
		return Nil;
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
extern "C" Variant sum_function(int a1, int a2, int a3, int a4, int a5, int a6)
{
	return a1 + a2 + a3 + a4 + a5 + a6;
}
```

We should see the console print 21:

```
Sum: 21
```
