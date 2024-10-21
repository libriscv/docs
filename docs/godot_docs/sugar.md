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


## Using methods on other types

Arrays, dictionaries, strings and other types have many methods, not all of which are currently exposed in the APIs. The methods are, however, available for use.

As an example, if we wanted to append an array to an array, and the function was missing, we can still access it through its name:

```c++
inline void append_array(Array& a, Array& b) {
	a("append_array", b);
}
```

And we could also add it as a member function in Array:

```c++
	void append_array(const Array &array) {
		this->operator() ("append_array", array);
	}
```

Either way, both will accomplish the same thing. This works for vectors, dictionaries and so on.

Finally, there is a helper macro to add a method without needing to specify arguments.

```c++
	METHOD(append_array);
	METHOD(find);
```

Adding them in the Array class will make do the right thing. They're variadic, but they will work just fine.
