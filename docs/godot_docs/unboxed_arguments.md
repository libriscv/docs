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
