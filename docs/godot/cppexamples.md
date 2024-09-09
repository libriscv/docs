---
sidebar_position: 6
---

# C++ Examples

## Coin example

When a C++ program is attached as a script to a node, the usual functions like `_process`, `_ready` will get called in the Sandbox. It's also possible to attach signals to VM functions, like `_on_body_entered`.

```cpp
#include "api.hpp"
// We can store data in the script
static int coins = 0;

extern "C" void reset_game() {
	coins = 0;
}

static void add_coin(const Node& player) {
	coins ++;
	// In our demo project we can access the coin label from the player
	// using a node path: Player -> get_parent() -> Texts -> CoinLabel
	auto coinlabel = player.get_node("../Texts/CoinLabel");
	coinlabel.set("text", "You have collected "
		+ std::to_string(coins) + ((coins == 1) ? " coin" : " coins"));
}

extern "C" Variant _on_body_entered(Variant arg) {
	// This function is called when a body enters the coin
	// Most likely it's the player, but we still check!
	Node player_node = arg.as_node();
	if (player_node.get_name() != "Player")
		return {};

	Node(".").queue_free(); // Remove the current coin!
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
	// Event is the Input object
	if (event("is_action_pressed", "jump")) {
		Node2D(".").set("modulate", 0xFF6060FF);
	} else if (event("is_action_released", "jump")) {
		Node2D(".").set("modulate", 0xFFFFFFFF);
	}
	return {};
}
```

Many functions check if we are in the editor using `is_editor()` and do different things based on that. For example, the coin idle animation is playing in the editor.

Finally, one of the most common needs is to get the current node, which is the node that the script is attached to. It can be accessed from `.`, which is a node path:

```cpp
Node current_node(".");
```

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

![alt text](/img/cppexamples/properties.png)

Properties can be edited in the Godot inspector and is a powerful and simple way to expose data from the script.

In this example, the players name cannot be changed in the editor, as the property will just keep returning the same value, effectively making it read-only.

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
