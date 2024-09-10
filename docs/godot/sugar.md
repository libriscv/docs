---
sidebar_position: 7
---

# Adding sugar

## Sugaring

Sugaring is the way we create nicer looking, easier-to-use APIs using a foundation that is more verbose.

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
