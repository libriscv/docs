---
sidebar_position: 6
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

:::note

Note that this class already exists in the auto-generated API, so there is no need to create wrappers for existing classes.

:::

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


## Adding methods

Types that you can put into a Variant has many methods, hopefully all of which are currently exposed in the APIs. If not, the methods and properties are accessible through method calls.

:::note

This method works on all Variant types, objects, nodes and other classes - as long as the method is also exposed to GDScript. If you can see the method in the public GDScript documentation for the class, then it can also be called using this method.

:::

As an example: If we wanted to use the `append_array()` method of Array, and the function was missing, we could still access it through its name:

```cpp
inline void append_array(Array& a, Array& b) {
	a("append_array", b);
}
```

And we could also add it as a member function in Array:

```cpp
	void append_array(const Array &array) {
		this->operator() ("append_array", array);
	}
```

Either way, both will accomplish the same thing.

There is also a helper macro to add a method without needing to specify arguments:

```cpp
	METHOD(void, append_array);
	METHOD(int64_t, find);
```

Adding these into any wrapper class will make do the right thing. They're variadic, but they will work just fine.


## Adding properties

Similar to methods, there is a `PROPERTY(name)` macro that can be used on Objects:

```cpp
struct AnimatedSprite2D : public Node2D {
	...
    PROPERTY(animation, String);
};
```

Now this class can access the property `animation`:

```cpp
AnimatedSprite2D mysprite("MyAnimatedSprite2D");

mysprite.animation() = "died";
```

The auto-generated API is more comprehensive:

```cpp
struct AnimatedSprite2D : public Node2D {
	...
    PROPERTY(animation, String);
    PROPERTY(flip_h, bool);
    PROPERTY(flip_v, bool);
    METHOD(void, set_animation);
    METHOD(String, get_animation);
    METHOD(void, set_flip_h);
    METHOD(bool, is_flipped_h);
    METHOD(void, set_flip_v);
    METHOD(bool, is_flipped_v);
	...
};
```

Using the macro we can define the type as well as the name of the getter and setter methods.

