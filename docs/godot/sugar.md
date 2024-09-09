---
sidebar_position: 7
---

# Adding sugar

Currently, the Godot Sandbox has access to all of Godot through calls, properties, objects, nodes and so on. This might not be apparent from looking at the APIs, especially if one is unfamiliar with how Godot works under the hood.

## Using arbitrary nodes

Let's take an example: Playing animations using an AnimatedSprite2D.

```cpp
Node node("MyAnimatedSprite2D");
```

Above: Accessing a node through its path relative to the script. However, what we get in return is a Node, not an AnimatedSprite2D and not even a Node2D. The API currently does have support for Node2D, so let's just make use of that now:

```cpp
Node2D node("MyAnimatedSprite2D");
```

Still, what if we want to play an animation? If we look at the [documentation for AnimatedSprite2D](https://docs.godotengine.org/en/stable/classes/class_animatedsprite2d.html) it has a [play method](https://docs.godotengine.org/en/stable/classes/class_animatedsprite2d.html#class-animatedsprite2d-method-play) used to start playing animations.

In Godot, methods are callable functions on objects, including nodes. So, it turns out we can actually just call `play` as a function on our node object:

```cpp
Node2D node("MyAnimatedSprite2D");
node.call("play", "idle");
```

We don't actually need to "have" an AnimatedSprite2D to call any function that it has. Further, the call is such an important function that there is a dedicated `operator (...)` for it:

```cpp
Node2D mysprite("MyAnimatedSprite2D");
mysprite("play", "idle");
```

That means we have access to all methods of all objects via calls. What about properties? Well, the API has support for `get()` and `set()`, which lets us get and set properties. The [current animation](https://docs.godotengine.org/en/stable/classes/class_animatedsprite2d.html#class-animatedsprite2d-property-animation) is a property that we can use `get()` on:

```cpp
Variant current_animation = mysprite.get("animation");
```

With access to methods, properties, objects, nodes and node-operations, globals and Variants, we can say that the Godot Sandbox has the entire Godot engine available to it.


## Sugaring

Now, let's talk about sugaring. Sugaring is the way we create nicer looking, easier-to-use APIs using a foundation that is more verbose.

Let's make an AnimatedSprite2D class that inherits from Node2D:

```cpp
struct AnimatedSprite2D : public Node2D {
	AnimatedSprite2D(std::string_view path) : Node2D(path) {}

	// Play an animation using play method
	void play(Variant animation) { this->call("play", animation); }
	// Get the animation property
	Variant animation() { return this->get("animation"); }
};
```

Using this tiny abstraction, we can now write this instead in our code:

```cpp
AnimatedSprite2D mysprite("MyAnimatedSprite2D");
mysprite.play("idle");

if (mysprite.animation() == "died")
	do_something();
```

And with that we have now added sugaring for AnimatedSprite2D without having to make any changes in the Godot Sandbox extension. Because the latency of _libriscv_ is very low, this method of extending the API is very likely to be efficient enough for most purposes.


## Optimization tips

For functions that don't return any value, there is the concept of a voidcall, and it's a call that expects no return value:

```cpp
struct AnimatedSprite2D : public Node2D {
	AnimatedSprite2D(std::string_view path) : Node2D(path) {}

	// Play an animation using play method
	void play(Variant animation) { this->voidcall("play", animation); }
	// Get the animation property
	Variant animation() { return this->get("animation"); }
};
```

We changed the `play()` function to use `voidcall` instead, making it slightly faster.


## Native performance operations

In the case where we do need extra oomph, we can make dedicated classes with system calls so that those operations have native performance. We can also make dedicated system calls for ultra-specific and narrow tasks. The reason we can do that is because _libriscv_ has footgun-free APIs and low-latency with practically no limit on the number of system calls supported.
