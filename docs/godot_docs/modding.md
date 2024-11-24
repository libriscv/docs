---
sidebar_position: 8
---

# Modding and APIs

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

Using these methods we can create arbitrary Sandboxes from downloaded programs without going through resources or even files in Godot. While example uses a zip-file, that is just for demonstration.


## A simple modding API

A modding API is there to make it easier for modders to interact with your game. Modding APIs should direct modders towards useful features and mechanisms in your game. While sandboxes have access to the entire Godot engine, the API is not just there for guidance. It's also there to allow you to make changes to your game without breaking mods.

```py
	var api : Dictionary
	api["get_player"] = func(): get_node("Player")
	...

	sandbox.vmcall("set_api", api)
```

Passing the modding API as a dictionary to a Sandbox function is quite OK as a modding API. It should be documented somewhere else.
