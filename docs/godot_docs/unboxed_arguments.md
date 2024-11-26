---
sidebar_position: 2
---

# Unboxed Arguments

Unboxed arguments is a default-enabled property on a Sandbox node. It makes function calls into the Sandbox unwrap Variant arguments into primitive types or class wrappers when available. These class wrappers aim to provide the functionality of both GDScript and godot-cpp when it makes sense to do so.

## Conversion table

When making a function call into a Sandbox program, `sandbox.vmcall("my_function", ...)` or `sandbox.my_function(...)`, the arguments will translate into the column on the right:

|  Variant   |      GDScript func argument      |  Unboxed type  |
|------------|:--------------------------:|:--------------:|
| NIL        |  null                      | N/A            |
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
| PLANE      |  Plane(...)                | Plane          |
| QUATERNION |  Quaternion(...)           | Quaternion     |
| AABB       |  AABB(...)                 | Variant        |
| BASIS      |  Basis(...)                | Basis          |
| TRANSFORM3D | Transform3D(...)          | Transform3D    |
| PROJECTION |  Projection(...)           | Variant        |
| COLOR      |  Color(...)                | Color          |
| STRING_NAME |  StringName(...)          | String         |
| NODE_PATH  |  NodePath(...)             | String         |
| RID        |  RID()                     | RID            |
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
| PACKED_VECTOR4_ARRAY  | PackedVector4Array(...)  | PackedArray\<Vector4\>  |

An astute reader will notice that whenever a wrapper class is not yet implemented, the Variant type is passed unchanged, as a Variant. Variants can use calls, and so even though many are already implemented as wrapper classes, here is an example of how to use *any class* through a Variant:

```cpp
Variant plane = ...;
float distance = plane("distance_to", Vector3(1, 2, 3));

Variant quaternion = ...;
quaternion = quaternion("inverse");
```

And when there is a wrapper, it's designed to be passed by value as a function argument:

```cpp
Variant my_plane(Plane p) {
	return p.distance_to(Vector3(1, 2, 3));
}

Variant my_quaternion(Quaternion q) {
	return q.inverse();
}
```


:::note

Sandboxed properties does *NOT* use unboxed arguments. All arguments and the return type are Variants. Function return values are always Variant.

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
	sandbox.vmcall("handle_player_physics", get_node("Player"), 1.0)
```

Which we can choose to receive as a CharacterBody2D, Node2D, Node or even Object in the Sandbox program:

```cpp
extern "C" Variant handle_player_physics(CharacterBody2D player, double delta) {

	Input input = Input::get_singleton();

	// Handle jump.
	Vector2 velocity = player.velocity();
	if (input.is_action_just_pressed("jump") && player.is_on_floor())
		velocity.y = jump_velocity;

	// Get the input direction and handle the movement/deceleration.
	float direction = input.get_axis("move_left", "move_right");
	if (direction != 0)
		velocity.x = direction * player_speed;
	else
		velocity.x = fmin(velocity.x, player_speed);
	player.set_velocity(velocity);

	return player.move_and_slide();
}
```

Since the `Player` node is a [CharacterBody2D](https://docs.godotengine.org/en/stable/tutorials/physics/using_character_body_2d.html), we should prefer using that, since it gives us access to the most functionality.

### Godot can call Sandbox functions

We can for example handle inputs with `_input` directly, which passes an Object of some kind of Input-derivative as the first argument:

```cpp
extern "C" Variant _input(InputEvent event) {
	if (event.is_action_pressed("jump")) {
		get_node().set("modulate", 0xFF6060FF);
	} else if (event.is_action_released("jump")) {
		get_node().set("modulate", 0xFFFFFFFF);
	}
	return Nil;
}
```

If we attach a Sandbox as a script to a Node that can receive inputs, Godot will directly call this function for us with an InputEvent as argument.

The above example modulates the current node based on the `jump` action. We know the functions provided by InputEvent from reading the [Godot documentation on InputEvent](https://docs.godotengine.org/en/stable/classes/class_inputevent.html). The current Node is our Node2D coin, and it can be modulated. We could cast it to a Node2D and do a `Node2D(get_node()).set_modulate(0xFF6060FF);`, but it was just easier to set the property using `.set()`.


:::note

All Sandbox functions must return a Variant.

:::
