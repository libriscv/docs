---
sidebar_position: 2
---

# SafeGDScript

SafeGDScript lets you write GDScript that runs inside a sandbox. The source file uses the `.sgd` extension and standard GDScript syntax. On load the engine compiles it to RISC-V and executes it in a fully isolated virtual machine.

No Docker, no toolchain, no build step. Write `.sgd`, attach it to a node, and it runs sandboxed.

## When to use SafeGDScript

- Modding: let players add gameplay scripts without any access to the host
- User-generated content: run uploaded code safely on a server or shared session
- Hot-reloading logic: swap scripts at run-time without restarting the project
- Cross-platform scripting: the compiled program runs everywhere Godot does, on all 20+ platforms

## Quick start

Create a file with the `.sgd` extension (e.g. `hello.sgd`):

```gdscript
func hello(who : String) -> String:
    return "Hello, " + who + "!"

func _ready():
    print(hello("world"))
```

Attach it to a node using `SafeGDScript`:

```gdscript
var script := SafeGDScript.new()
script.set_source_code(FileAccess.get_file_as_string("res://hello.sgd"))

var node := Node.new()
node.set_script(script)
add_child(node)
```

When `add_child` is called the node enters the tree, `_ready` fires inside the sandbox, and the console prints `Hello, world!`.

## Standard callbacks

SafeGDScript supports the same lifecycle callbacks as regular GDScript:

| Callback              | When it runs                        |
| --------------------- | ----------------------------------- |
| `_ready()`            | Node enters the scene tree          |
| `_process(delta)`     | Every frame                         |
| `_physics_process(delta)` | Every physics tick              |

## Restrictions

A SafeGDScript node is a regular `Node` with a sandboxed script. You control what the script can reach through the same restriction system used by all Godot Sandbox programs.

Enable full restrictions with a single property:

```gdscript
node.set("restrictions", true)
```

Once enabled, the sandbox denies all external access. The script can now only use what you pass to it, in function call arguments. See [Restrictions & Isolation](../godot_docs/restrictions.md) for fine-grained control.

## Resource limits

Every sandbox instance exposes properties that cap its resource usage:

| Property              | Default | Unit                                |
| --------------------- | ------- | ----------------------------------- |
| `execution_timeout`   | 200     | Millions of instructions per call   |
| `memory_max`          | 32      | MB                                  |
| `allocations_max`     | 8000    | Outstanding allocations             |
| `references_max`      | 100     | Tracked object references           |

```gdscript
node.set("execution_timeout", 100)
node.set("memory_max", 16)
```

A script that exceeds its execution budget is stopped. The node stays loaded and subsequent calls still work.

## Compared to C++ / Rust programs

SafeGDScript and compiled C++/Rust ELF programs share the same sandbox runtime. The trade-off is convenience vs. raw performance:

|                        | SafeGDScript          | C++ / Rust ELF       |
| ---------------------- | --------------------- | -------------------- |
| Build step             | On-the-fly            | Docker / host toolchain |
| Language               | GDScript syntax       | C++ or Rust          |
| Performance            | Good                  | Best (+ binary translation) |
| Modding friendliness   | High (familiar syntax) | Lower (requires compiler) |
| Run-time loading       | From text string      | From ELF binary      |

For modding and UGC, SafeGDScript is the recommended path. For compute-heavy inner loops or when you need the full C++ ecosystem, use an ELF program.

## Next steps

- [SafeGDScript Modding Example](../godot_docs/modding.md): an example mod loader with a pre-defined API
- [Restrictions & Isolation](../godot_docs/restrictions.md): fine-grained access control
