---
sidebar_position: 8
---

# Modding & APIs

## Loading programs at run-time

The most basic way to add modding support to a game using Godot Sandbox is to add a Sandbox somewhere, and load a program into it.

```py
func activate():
    var reader = ZIPReader.new()
    reader.open("res://lua.zip")
    var buffer = reader.read_file("lua.elf")

    var sandbox : Sandbox = get_node("MyVM")
    sandbox.load_buffer(buffer)
```

The function `load_buffer()` takes a PackedByteArray as argument, and will try to initialize the Sandbox with the data as a program.

```py
func activate():
    var elf = load("res://lua.elf")

    var sandbox : Sandbox = get_node("MyVM")
    sandbox.set_program(elf)
```

We can use `set_program()` if we load ELF files from resource paths.

With the program loaded, the program in the Sandbox will go through an initialization phase, and could possibly perform every action that it needs to then and there. What's happening is that it is running through `int main()`, and it will have access to Godot when it does that (barring any restrictions).

In theory, no modding API is needed and instead just a general map of the scene trees in the game is enough.

Using these methods we can create arbitrary Sandboxes from downloaded programs without going through resources or even files in Godot. While the example uses a zip-file, that is just for demonstration.


## Crafting a public API

It's possible to create a custom public API for a sandbox program. The public API is meant to show how to use a program, providing a list of functions, their arguments and return value, and a description of how or why to use them. Here's a C++ example:

```cpp
int main() {
	ADD_API_FUNCTION(my_function, "Dictionary", "Dictionary text");
	ADD_API_FUNCTION(function3, "int", "long x, long y, Array text");
	ADD_API_FUNCTION(adding_function, "int", "int a1, int a2, int a3, int a4, int a5, int a6");
	ADD_API_FUNCTION(pba_operation, "void", "PackedFloat32Array farr", "Sets each float in a PackedArray to 1.0f");
	...
}
```

This API will expose exactly two functions to the Godot engine, and if you open the ELF resource (double-click the program) in the editor, you will see something like this:

```json
[
  {
	"address": 68976,
	"args": [
	  {
		"class_name": "Variant",
		"name": "farr",
		"type": 32,
		"usage": 131072
	  }
	],
	"description": "Sets each float in a PackedArray to 1.0f",
	"flags": 1,
	"name": "pba_operation",
	"return": {
	  "type": 0
	}
  },
  {
	"address": 70936,
	"args": [
	  {
		"class_name": "Variant",
		"name": "x",
		"type": 2,
		"usage": 131072
	  },
	  {
		"class_name": "Variant",
		"name": "y",
		"type": 2,
		"usage": 131072
	  },
	  {
		"class_name": "Variant",
		"name": "text",
		"type": 4,
		"usage": 131072
	  }
	],
	"description": "Prints the arguments",
	"flags": 1,
	"name": "function3",
	"return": {
	  "type": 2
	}
  }
]
```

It is method information about the public API. C++ types will be translated to Godot variant types. Eg. `long x` will be translated to `x: int` (type 2) in GDScript.


Another example is a RISC-V assembler program:

![Image of the public API from above](/img/modding/public_api.png)

It exposes a single function `assemble`, which is done like this in the C++ code:

```cpp
int main() {
	// Add public API
	ADD_API_FUNCTION(assemble, "Callable", "String assembly_code",
		"Assemble RISC-V assembly code and return a callable function");
	...
}
```

When we go into the Godot editor and try to use the auto-generated Sandbox class from this program, called `Sandbox_TestAsmjit` in the test project, we can see that it auto-completes `assemble`:


![Image of auto-completion in editor](/img/modding/auto_complete.png)


Examples of C++ API types and their corresponding Godot variant types:

|    C++ type    |  Variant   |
|:---------------|:----------:|
| void           | NIL        |
| bool           | BOOL       |
| int, long      | INT        |
| float          | FLOAT      |
| double         | FLOAT      |
| String         | STRING     |
| Callable       | CALLABLE   |
| Signal         | SIGNAL     |
| Vector4        | VECTOR4    |
| PackedVector4Array | PACKED_VECTOR4_ARRAY    |

Otherwise, every type in the API will convert to its Variant type cleanly. If you write a class name instead like `Mesh`, that also works.

## A simple modding API

A modding API is there to make it easier for modders to interact with your game. Modding APIs should direct modders towards useful features and mechanisms in your game. While sandboxes have access to the entire Godot engine, the API is not just there for guidance. It's also there to allow you to make changes to your game without breaking mods.

```py
	var api : Dictionary
	api["get_player"] = func(): get_node("Player")
	...

	sandbox.vmcall("set_api", api)
```

Passing the modding API as a dictionary to a Sandbox function is quite OK as a modding API. It should be documented somewhere else.
