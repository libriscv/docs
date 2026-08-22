---
sidebar_position: 8
---

# Modding with SafeGDScript

SafeGDScript is the recommended way to add modding to a Godot game. Mods are SafeGDScript files (`.sgd`) that get compiled automatically behind the scenes and runs in a sandbox with all host access denied. The mod can only reach what the game explicitly passes in, when restrictions are enabled (so make sure to enable it).

This page walks through a complete, working mod loader, a well-behaved mod, and a hostile mod that shows the sandbox denies access to the wider Godot project. The full source is in the [Godot Sandbox repository](https://github.com/libriscv/godot-sandbox) under `examples/modding/`.

## Mod structure

A mod is a folder with a `mod.cfg` manifest and a `.sgd` entry file:

```
mods/cpu/mod.cfg          # shipped with the game
mods/cpu/cpu.sgd
user://mods/<id>/...      # installed by a player
```

Both paths load identically. Neither is trusted.

### mod.cfg

```ini
[mod]

id="cpu"
name="Register CPU"
version="1.0.0"
author="Godot Sandbox"
description="A small register machine."
entry="cpu.sgd"

[limits]

execution_timeout=200
memory_max=20
allocations_max=4000
references_max=100
```

The `[limits]` section lets a manifest request resource caps. The loader clamps each value to a ceiling, so a manifest can only ask for *less*.

## The mod loader

The game ships a `ModLoader` node that scans `res://mods` and `user://mods`, compiles each `.sgd` entry, and runs it inside a fully restricted sandbox.

```gdscript
class_name ModLoader
extends Node

signal mod_loaded(id: String)
signal mod_failed(id: String, reason: String)

const MOD_DIRS := ["res://mods", "user://mods"]

# Ceilings. A manifest can lower these, never raise them.
const MAX_EXECUTION_TIMEOUT := 200
const MAX_MEMORY := 32
const MAX_ALLOCATIONS := 8000
const MAX_REFERENCES := 100
const MAX_SOURCE_BYTES := 256 * 1024

var api_provider := Callable()
var _mods := {}

func scan() -> int:
    var count := 0
    for root in MOD_DIRS:
        if not DirAccess.dir_exists_absolute(root):
            continue
        for dir_name in DirAccess.get_directories_at(root):
            if load_mod(root.path_join(dir_name)) != null:
                count += 1
    return count

func load_mod(dir: String) -> Node:
    var cfg := ConfigFile.new()
    if cfg.load(dir.path_join("mod.cfg")) != OK:
        mod_failed.emit(dir.get_file(), "no readable mod.cfg in " + dir)
        return null

    var id: String = str(cfg.get_value("mod", "id", dir.get_file()))
    if _mods.has(id):
        mod_failed.emit(id, "a mod with this id is already loaded")
        return null

    var entry: String = str(cfg.get_value("mod", "entry", ""))
    if entry.is_empty() or entry.get_extension() != "sgd" or entry.contains(".."):
        mod_failed.emit(id, "mod.cfg needs an 'entry' naming a .sgd file")
        return null

    var entry_path := dir.path_join(entry)
    if not FileAccess.file_exists(entry_path):
        mod_failed.emit(id, "entry script not found: " + entry_path)
        return null

    var source := FileAccess.get_file_as_string(entry_path)
    if source.length() > MAX_SOURCE_BYTES:
        mod_failed.emit(id, "entry script too large")
        return null

    var script := SafeGDScript.new()
    script.set_source_code(source)

    var node := Node.new()
    node.name = id
    node.set_script(script)
    _restrict(node, cfg)

    if not node.has_method("mod_init"):
        node.free()
        mod_failed.emit(id, "no mod_init(api) function")
        return null

    add_child(node)

    var manifest := {
        "id": id,
        "name": str(cfg.get_value("mod", "name", id)),
        "version": str(cfg.get_value("mod", "version", "0")),
        "author": str(cfg.get_value("mod", "author", "unknown")),
        "description": str(cfg.get_value("mod", "description", "")),
        "path": dir,
    }
    var api := {}
    if api_provider.is_valid():
        api = api_provider.call(id, manifest)
    node.call("mod_init", api)

    _mods[id] = node
    mod_loaded.emit(id)
    return node

func _restrict(node: Node, cfg: ConfigFile) -> void:
    node.set("restrictions", true)
    node.set("execution_timeout",
        _limit(cfg, "execution_timeout", MAX_EXECUTION_TIMEOUT))
    node.set("memory_max",
        _limit(cfg, "memory_max", MAX_MEMORY))
    node.set("allocations_max",
        _limit(cfg, "allocations_max", MAX_ALLOCATIONS))
    node.set("references_max",
        _limit(cfg, "references_max", MAX_REFERENCES))

func _limit(cfg: ConfigFile, key: String, ceiling: int) -> int:
    return clampi(
        int(cfg.get_value("limits", key, ceiling)), 1, ceiling)
```

Key points:

- **`restrictions = true`** is set *before* the node enters the tree. The mod starts with zero access.
- The entry must be `.sgd`. A `.gd` file would run on the host &mdash; the loader rejects it.
- `mod_init(api)` is required. A mod without it is treated the same as a compile failure.
- The loader clamps every limit to a ceiling. A hostile manifest that asks for 100 GB of memory gets 32 MB.

## The API contract

The game defines the entire surface a mod can reach via a Dictionary:

```gdscript
func _build_api(id: String, manifest: Dictionary) -> Dictionary:
    return {
        "id": id,
        "name": manifest["name"],
        "cycles_per_frame": CYCLES_PER_FRAME,
        "log": _mod_log.bind(id),
        "report": _mod_report.bind(id),
    }
```

| Key                | Type       | Purpose                       |
| ------------------ | ---------- | ----------------------------- |
| `id`, `name`       | String     | From the manifest             |
| `cycles_per_frame` | int        | Budget hint for the mod       |
| `log`              | Callable   | Tagged output line            |
| `report`           | Callable   | Publish a stat the game shows |

No game nodes are exposed. Callables can be called, but not unwrapped as `api["log"].get_object()` will be denied.

### Writing a mod against the API

```gdscript
# cpu.sgd — a register machine, as a mod

var api : Dictionary = {}
var cycles_per_frame : int = 1000

func mod_init(granted : Dictionary) -> void:
    api = granted
    cycles_per_frame = api["cycles_per_frame"]
    api["log"].call("register machine ready")

func _physics_process(_delta):
    # do work ...
    api["report"].call("cycles", cycles)
```

Use a Dictionary: A Dictionary global persists between calls. Write `api["log"].call(x)`, not `var log = api["log"]` at file scope.

Standard callbacks (`_ready`, `_process`, `_physics_process`) work normally inside the sandbox (but can be disabled from the outside).

## A hostile mod

The example ships a second mod (`mods/breakout/breakout.sgd`) that tries a few forbidden operations:

```gdscript
# breakout.sgd — hostile mod

var api : Dictionary = {}

func mod_init(a : Dictionary) -> void:
    api = a

func try_unwrap_callable() -> String:
    var host = api["log"].get_object()
    host.call("get_class")
    return "reached the object behind a granted Callable"

func try_rename_own_node() -> String:
    set_name("pwned")
    return "renamed its own node"

func try_reach_parent() -> String:
    var p = get_parent()
    p.call("get_class")
    return "called a method on its parent"

func try_reach_scene_root() -> String:
    var root = get_node("/root")
    root.call("get_class")
    return "called a method on the scene root"

func try_read_root_property() -> String:
    var root = get_node("/root")
    return "read property: " + str(root.name)

func try_write_root_property() -> String:
    var root = get_node("/root")
    root.name = "pwned"
    return "wrote a property on the scene root"
```

All six attempts are refused:

| Attempt                            | Blocked by              |
| ---------------------------------- | ----------------------- |
| `api["log"].get_object()`          | Object never crosses    |
| `set_name()` on own node           | Method denied           |
| `get_parent().call(...)`           | Method denied           |
| `get_node("/root").call(...)`      | Method denied           |
| Read `get_node("/root").name`      | Property denied         |
| Write `get_node("/root").name`     | Property denied         |
| `load("res://...")`                | Resource denied         |

`get_node()` returns a handle, but every method and property on it is denied (by default). `load("res://...")` can be relaxed to specific resources that the mod provides, however everything is denied by default, as it should.

A refused call raises an exception inside the guest and unwinds that call. The mod stays loaded.

## Resource limits

`mod.cfg` may request limits under `[limits]`. The loader clamps each to a ceiling defined in the loader. A manifest can only ask for less.

`execution_timeout` is millions of instructions per call. Syscalls are charged against it (one Array operation costs ~50k instructions).

## Installing a mod

Drop the mod folder into `user://mods/`. On Linux that is typically:

```
~/.local/share/godot/app_userdata/<ProjectName>/mods/
```

For exports, add `mods/*` to **Export > Resources > Filters to export non-resource files**.

## Loading ELF programs (C++ / Rust)

For mods written in C++ or Rust, the same `load_buffer()` and `set_program()` APIs from the Sandbox node still apply:

```gdscript
var elf = load("res://lua.elf")
var sandbox : Sandbox = Sandbox.new()
sandbox.set_program(elf)
```

Or from raw bytes:

```gdscript
var reader = ZIPReader.new()
reader.open("res://lua.zip")
var buffer = reader.read_file("lua.elf")

var sandbox : Sandbox = Sandbox.new()
sandbox.load_buffer(buffer)
```

### Crafting a public API (C++)

C++ programs can declare a typed public API visible in the Godot editor:

```cpp
int main() {
    ADD_API_FUNCTION(assemble, "Callable", "String assembly_code",
        "Assemble RISC-V assembly code and return a callable function");
}
```

See the [C++ API reference](cppapi.md) for details.
