---
sidebar_position: 1
---

# Unboxed Arguments

Unboxed arguments is a default-enabled property on a Sandbox node. It makes function calls into the Sandbox unwrap Variant arguments into primitive types or class wrappers when available. These class wrappers aim to provide the functionality of both GDScript and godot-cpp when it makes sense to do so.

## Conversion table

When making a function call into a Sandbox program, `sandbox.vmcall("my_function", ...)` or `sandbox.my_function(...)`, the arguments will translate into the column on the right:

|  Variant   |      GDScript func argument      |  Unboxed type  |
|------------|:--------------------------:|:--------------:|
| NIL        |  null                      | *ignored*      |
| BOOL       |  true / false              | bool           |
| INT        |  1234                      | int, long      |
| FLOAT      |  5678.0                    | double         |
| STRING     |  "Hello World!"            | String         |
| VECTOR2    |  Vector2(1, 2)             | Vector2        |
| VECTOR2i   |  Vector2i(1, 2)            | Vector2i       |
| VECTOR3    |  Vector3(1, 2, 3)          | Vector3        |
| VECTOR3i   |  Vector3i(1, 2, 3)         | Vector3i       |
| TRANSFORM2D |  Transform2D(...)         | Transform2D    |
| VECTOR4    |  Vector4(1, 2, 3, 4)       | Vector4        |
| VECTOR4i   |  Vector4i(1, 2, 3, 4)      | Vector4i       |
| PLANE      |  Plane(...)                | Variant        |
| QUATERNION |  Quaternion(...)           | Quaternion     |
| AABB       |  AABB(...)                 | Variant        |
| BASIS      |  Basis(...)                | Basis          |
| TRANSFORM3D | Transform3D(...)          | Transform3D    |
| PROJECTION |  Projection(...)           | Variant        |
| COLOR      |  Color(...)                | Color          |
| STRING_NAME |  StringName(...)          | String         |
| NODE_PATH  |  NodePath(...)             | String         |
| RID        |                            | Variant        |
| OBJECT     |                            | Object         |
| CALLABLE   |                            | Callable       |
| SIGNAL     |                            | Variant        |
| DICTIONARY | Dictionary(...)            | Dictionary     |
| ARRAY      | Array(...)                 | Array          |


|  Packed Array         |  GDScript func argument  |  Unboxed type           |
|-----------------------|:------------------------:|:-----------------------:|
| PACKED_BYTE_ARRAY     | PackedByteArray(...)     | PackedArray\<uint8_t\>  |
| PACKED_INT32_ARRAY    | PackedInt32Array(...)    | PackedArray\<int32_t\>  |
| PACKED_INT64_ARRAY    | PackedInt64Array(...)    | PackedArray\<int64_t\>  |
| PACKED_FLOAT32_ARRAY  | PackedFloat32Array(...)  | PackedArray\<float\>    |
| PACKED_FLOAT64_ARRAY  | PackedFloat64Array(...)  | PackedArray\<double\>   |
| PACKED_STRING_ARRAY   | PackedStringArray(...)   | PackedArray\<std::string\> |
| PACKED_VECTOR2_ARRAY  | PackedVector2Array(...)  | PackedArray\<Vector2\>  |
| PACKED_VECTOR3_ARRAY  | PackedVector3Array(...)  | PackedArray\<Vector3\>  |
| PACKED_COLOR_ARRAY    | PackedColorArray(...)    | PackedArray\<Color\>    |

An astute reader will notice that whenever a wrapper class is not yet implemented, the Variant type is passed unchanged, as a Variant. Variants can use calls, and so even though (for example) Plane is not yet implemented as a wrapper class, it can still be used:

```cpp
Variant plane;
float distance = plane("distance_to", Vector3(1, 2, 3));
```

And when there is a wrapper, it's designed to be passed by value as a function argument:

```cpp
Variant my_function(Quaternion q) {
	return q.inverse();
}
```


:::note

Sandboxed properties does *NOT* use unboxed arguments. All arguments and the return type are Variants.

:::


## Conversion table (Objects)

|  Class     |      Godot Sandbox API     |
|------------|:--------------------------:|
| Object     |  Object                    |
| Node       |  Node                      |
| Node2D     |  Node2D                    |
| Node3D     |  Node3D                    |

Nodes inherit from Object.

See the [API sugaring](sugar.md) documentation to see how to add your own wrapper classes.


## Example function calls


### A player node

```py
func gdscript():
	sandbox.vmcall("handle_player", get_node("Player"))
```

Which we can choose to receive as a Node2D (or Node or Object) in the Sandbox program:

```cpp
extern "C" Variant handle_player(Node2D player, double delta) {

	Object input = Input::get_singleton();

	// Handle jump.
	Vector2 velocity = player.get("velocity");
	if (input("is_action_just_pressed", "jump") && player("is_on_floor"))
		velocity.y = jump_velocity;

	// Get the input direction and handle the movement/deceleration.
	float direction = input("get_axis", "move_left", "move_right");
	if (direction != 0)
		velocity.x = direction * player_speed;
	else
		velocity.x = fmin(velocity.x, player_speed);
	player.set("velocity", velocity);

	return player("move_and_slide");
}
```

Since the `Player` node is a [CharacterBody2D](https://docs.godotengine.org/en/stable/tutorials/physics/using_character_body_2d.html), we can use functions from it.

### Inputs

We can handle inputs with `_input` directly, which passes an Object of some kind of Input-derivative as the first argument:

```cpp
extern "C" Variant _input(Object input) {
	if (event("is_action_pressed", "jump")) {
		get_node().set("modulate", 0xFF6060FF);
	} else if (event("is_action_released", "jump")) {
		get_node().set("modulate", 0xFFFFFFFF);
	}
	return Nil;
}
```

The above example modulates the current node based on the `jump` action. We know the functions provided by Input from reading the [Godot documentation on Input](https://docs.godotengine.org/en/stable/classes/class_input.html).


:::note

All Sandbox functions must return a Variant.

:::
