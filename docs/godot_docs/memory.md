---
sidebar_position: 5
---

# Memory

Memory in the Sandbox works just as you would expect. If you store something in memory, it will be there when you come back. All language-native code will work like normal, until the Sandbox is freed.

An exception to this rule is temporary Variants and object references, which are not stored in the Sandbox. The reason behind this is that they represent data with unclear lifetimes that may be changed outside of the Sandbox. In order to avoid architectural blunders, the Sandbox has been designed to account for lifetimes in a brutal way from the start:

It does so by keeping track of and terminating all Variants that are created during a function call. This also makes it possible to place a limit, if desirable. In order to use Variants not just during calls they have to be:

- Created during initialization, or
- Stored into another Variant (eg. Array, Dictionary, Callable), or
- Returned from the function

Let's go through this example by example.

## Variants with storage

```cpp
struct MyStuff {
    int a;
    std::string b;
    std::unordered_map<std::string, int> c;
};
static std::vector<MyStuff> mystuff;
```

As shown above: Any interaction with mystuff works exactly like normal. All language-native code works normally.

```cpp
struct MyStuff {
    Variant a;
    std::vector<Variant> b;
};
static std::vector<MyStuff> mystuff;
```

Any interaction with mystuff is destined to fail. Variants created after initialization can only be remembered after the call if they are attached to something outside of the Sandbox, created during initialization or explicitly made permanent.

```cpp
static Array array = Array::Create();
```

As shown above: This Variant of type ARRAY is created during initialization. It's storage is *not temporary*. We can freely add Variants to it later. These Variants are copied and stored into the Array:

```cpp
static Array array = Array::Create();

Variant function_call_after_init() {
    array.push_back(Variant(1));
    array.push_back(String(""));
    array.push_back(Dictionary::Create());
    return Nil;
}
```

As shown above: Because the Array has permanent storage, we can assign temporary Variants to it and they will become copied into it, receiving storage too and will be accessible later.

The same rule applies to Dictionary and String:

```cpp
static String str = "123";

Variant function_call_after_init() {
    str = "456"; // Overwriting a permanent is OK
    return Nil;
}
```

As shown above, the destination String is permanent, and overwriting it with a new string works.


## Variants without storage

Often you will end up using Variants during a function call. In that case, everything works like expected. Return values also always work like expected.

```cpp
Variant function_call_after_init() {
    String str1 = "123";
    String str2 = "456";

    return str1 + str2;
}
```

This function returns `"123456"` back to the caller.

The temporary strings `str1` and `str2` evaporate after the call ends.

```cpp
Variant function_call_after_init() {
    Dictionary d = Dictionary::Create();
    d[123] = 456;
    d["123"] = "456";

    return d;
}
```

As shown above: The function returns a Dictionary with 2 elements back to the caller.


## Making permanent Variants

You can store a Variant permanently during a call by making it permanent:

```cpp
static Variant pv;

Variant function_call_after_init() {
    Dictionary d = Dictionary::Create();
    d[123] = 456;
    d["123"] = "456";

    // First turn into Variant
    Variant v(d);
    pv = v.make_permanent();

    return pv;
}
```

Making it permanent will allocate a slot in the permanent Variant group used by initialization. The Variant will be moved into that slot, and `v` will be updated to reflect the new underlying id. It returns a reference to its (updated) self. After that we can safely assign it to a global.

```py
var s = Sandbox.new()
s.references_max = 100
```

There are a finite amount of permanent slots, controlled by you. Keep in mind that sometimes you don't know what a program does, as you didn't write it. Making storage explicit is intentional.

## Disabling permanent slots

You can disable permanent slots by setting `max_references` to 0 before initialization. After initialization you can set it back again, as it is now used for maximum temporary Variants.

## Memory safety and use-after-free

Nodes are heavily manipulated to create interesting games in Godot. A sandbox is responsible for avoiding access to freed nodes, or worse, objects that were once freed and are now pointing to other objects.

In order to guarantee safety, heavy-handed approaches have to be taken. The current approach where most Variants are release after a call ensures that modders have re-grab access to nodes in future calls, which goes a long way towards ensuring safety.

Whether or not it holds up only time can tell.
