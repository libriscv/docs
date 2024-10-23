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


## Adding methods

Arrays, dictionaries, strings and other types have many methods, not all of which are currently exposed in the APIs. The methods are, however, accessible through method calls.

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

Either way, both will accomplish the same thing. This works for vectors, dictionaries and so on.

Finally, there is a helper macro to add a method without needing to specify arguments.

```cpp
	METHOD(append_array);
	METHOD(find);
```

Adding them in the Array class will make do the right thing. They're variadic, but they will work just fine.

## Adding properties

Similar to methods, there is a `PROPERTY(name)` macro that can be used on Objects:

```cpp
struct AnimatedSprite2D : public Node2D {
	...
	PROPERTY(animation);
};
```

Now this class can access the property `animation` in 3 ways:

```cpp
AnimatedSprite2D mysprite("MyAnimatedSprite2D");

mysprite.animation() = "died";
mysprite.set_animation("died");
String animation = mysprite.get_animation();
```

If you don't want the `set_` and `get_` methods, the `PROPERTY1(name)` macro will only add the single method.
