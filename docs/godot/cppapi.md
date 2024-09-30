---
sidebar_position: 9
---

# C++ API Reference

The current C++ API is likely to change over time. Feel free to contribute improvements to the API.

You can find the [source of the API here](https://github.com/libriscv/godot-sandbox/blob/main/program/cpp/api/api.hpp).


## General

```cpp
/// @brief Print a message to the console.
/// @param ...vars A list of Variants to print.
template <typename... Args>
inline void print(Args &&...vars);

/// @brief Get the current scene tree.
/// @return The root node of the scene tree.
inline Object get_tree();

/// @brief Check if the given Node is a part of the current scene tree. Not an instance of another scene.
/// @param node The Node to check.
/// @return True if the Node is a part of the current scene tree, false otherwise.
inline bool is_part_of_tree(Node node);

/// @brief Get a node by its path. By default, this returns the current node.
/// @param path The path to the node.
/// @return The node at the given path.
inline Node get_node(std::string_view path = ".");

/// @brief A macro to define a static function that returns a custom state object
/// tied to a Node object. For shared sandbox instances, this is the simplest way
/// to store per-node-instance state.
/// @param State The type of the state object.
/// @note There is currently no way to clear the state objects, so be careful
/// with memory usage.
/// @example
/// struct SlimeState {
/// 	int direction = 1;
/// };
/// PER_OBJECT(SlimeState);
/// // Then use it like this:
/// auto& state = GetSlimeState(slime);
#define PER_OBJECT(State) \
	static State &Get ## State(const Node &node) { \
		static std::unordered_map<uint64_t, State> state; \
		return state[node.address()]; \
	}

/// @brief A property struct that must be instantiated in the global scope.
/// @note This is used to define custom properties for the Sandbox class.
/// On program load, the properties are automatically exposed on the script instance.
/// @example
/// SANDBOXED_PROPERTIES(1, {
/// 	.name = "my_property",
/// 	.type = Variant::Type::INT,
/// 	.getter = []() -> Variant { return 42; },
/// 	.setter = [](Variant value) { print("Set to: ", value); },
/// 	.default_value = Variant{42},
/// });
struct Property {
	using getter_t = Variant (*)();
	using setter_t = Variant (*)(Variant);

	const char * const name = 0;
	const unsigned size = sizeof(Property);
	const Variant::Type type;
	const getter_t getter;
	const setter_t setter;
	const Variant default_value;
};
#define SANDBOXED_PROPERTIES(num, ...) \
	extern "C" const Property properties[num+1] { __VA_ARGS__, {0} };

/// @brief Stop execution of the program.
/// @note This function may return if the program is resumed. However, no such
/// functionality is currently implemented.
inline void halt();

/// @brief Check if the program is running in the Godot editor.
/// @return True if running in the editor, false otherwise.
inline bool is_editor();
```


## Variant

```cpp
struct Variant {
	Variant() = default;
	Variant(const Variant &other);
	Variant(Variant &&other);
	~Variant();

	// Constructor for common types
	template <typename T>
	Variant(T value);

	Variant(const Array&);
	Variant(const Dictionary&);
	Variant(const String&);
	Variant(const Object&);
	Variant(const Node&);
	Variant(const Node2D&);
	Variant(const Node3D&);
	Variant(const PackedArray<uint8_t>&);
	Variant(const PackedArray<float>&);
	Variant(const PackedArray<double>&);
	Variant(const PackedArray<int32_t>&);
	Variant(const PackedArray<int64_t>&);
	Variant(const PackedArray<Vector2>&);
	Variant(const PackedArray<Vector3>&);
	Variant(const PackedArray<Color>&);

	// Constructor specifically the STRING_NAME type
	static Variant string_name(const std::string &name);

	// Create a new empty Array
	static Variant new_array();
	// Create a new Array from a vector of Variants
	static Variant from_array(const std::vector<Variant> &array);

	// Empty Dictionary constructor
	static Variant new_dictionary();

	operator bool() const;
	operator int64_t() const;
	operator int32_t() const;
	operator int16_t() const;
	operator int8_t() const;
	operator uint64_t() const;
	operator uint32_t() const;
	operator uint16_t() const;
	operator uint8_t() const;
	operator double() const;
	operator float() const;
	operator std::string() const; // String for STRING and PACKED_BYTE_ARRAY
	operator std::u32string() const; // u32string for STRING, STRING_NAME
	operator String() const;
	operator Array() const;
	operator Dictionary() const;

	Object as_object() const;
	Node as_node() const;
	Node2D as_node2d() const;
	Node3D as_node3d() const;
	Array as_array() const;
	Dictionary as_dictionary() const;
	String as_string() const;
	std::string as_std_string() const;
	std::u32string as_std_u32string() const;
	std::vector<uint8_t> as_byte_array() const;
	std::vector<float> as_float32_array() const;
	std::vector<double> as_float64_array() const;
	std::vector<int32_t> as_int32_array() const;
	std::vector<int64_t> as_int64_array() const;
	std::vector<Vector2> as_vector2_array() const;
	std::vector<Vector3> as_vector3_array() const;

	const Vector2 &v2() const;
	Vector2 &v2();
	const Vector2i &v2i() const;
	Vector2i &v2i();
	const Vector3 &v3() const;
	Vector3 &v3();
	const Vector3i &v3i() const;
	Vector3i &v3i();
	const Vector4 &v4() const;
	Vector4 &v4();
	const Vector4i &v4i() const;
	Vector4i &v4i();
	const Rect2 &r2() const;
	Rect2 &r2();
	const Rect2i &r2i() const;
	Rect2i &r2i();
	const Color &color() const;
	Color &color();

	operator Vector2() const;
	operator Vector2i() const;
	operator Vector3() const;
	operator Vector3i() const;
	operator Vector4() const;
	operator Vector4i() const;
	operator Rect2() const;
	operator Rect2i() const;
	operator Color() const;

	void callp(const std::string &method, const Variant *args, int argcount, Variant &r_ret, int &r_error);

	template <typename... Args>
	Variant method_call(const std::string &method, Args... args);

	template <typename... Args>
	Variant call(Args... args);

	static void evaluate(const Operator &op, const Variant &a, const Variant &b, Variant &r_ret, bool &r_valid);

	Variant &operator=(const Variant &other);
	Variant &operator=(Variant &&other);
	bool operator==(const Variant &other) const;
	bool operator!=(const Variant &other) const;
	bool operator<(const Variant &other) const;

	Variant duplicate() const;

	Type get_type() const noexcept { return m_type; }
};
```

## Array

```cpp
struct Array {
	constexpr Array();
	Array(unsigned size);
	Array(const std::vector<Variant> &values);
	static Array Create(unsigned size = 0);

	operator Variant() const;

	// Array operations
	void push_back(const Variant &value);
	void push_front(const Variant &value);
	void pop_at(int idx);
	void pop_back();
	void pop_front();
	void insert(int idx, const Variant &value);
	void erase(int idx);
	void resize(int size);
	void clear();
	void sort();

	// Array access
	Variant operator[](int idx) const;
	Variant at(int idx) const;

	// Array size
	int size() const;

	auto begin();
	auto end();
	auto rbegin();
	auto rend();
};
```

## Dictionary

```cpp
struct Dictionary {
	constexpr Dictionary();
	static Dictionary Create();

	operator Variant() const;

	void clear();
	void erase(const Variant &key);
	bool has(const Variant &key) const;
	void merge(const Dictionary &other);
	bool is_empty() const;
	int size() const;

	Variant get(const Variant &key) const;
	void set(const Variant &key, const Variant &value);

	DictAccessor operator[](const Variant &key);
};
```

## String

```cpp
/**
 * @brief String wrapper for Godot String.
 * Implemented by referencing and mutating a host-side String Variant.
 */
struct String {
	constexpr String();
	String(std::string_view value);
	template <size_t N>
	String(const char (&value)[N]);

	String &operator =(std::string_view value);

	// String operations
	void append(const String &value);
	void append(std::string_view value);
	void erase(int idx, int count = 1);
	void insert(int idx, const String &value);
	int find(const String &value) const;
	bool contains(std::string_view value);
	bool empty() const;

	String &operator +=(const String &value);
	String &operator +=(std::string_view value);

	// String access
	String operator[](int idx) const;
	String at(int idx) const;

	operator std::string() const;
	operator std::u32string() const;
	std::string utf8() const;
	std::u32string utf32() const;

	// String size
	int size() const;
};
```

## Object

```cpp
struct Object {
	/// @brief Construct an Object object from an allowed global object.
	Object(const std::string &name);

	/// @brief Construct an Object object from an existing in-scope Object object.
	/// @param addr The address of the Object object.
	Object(uint64_t addr);

	// Call a method on the node.
	// @param method The method to call.
	// @param deferred If true, the method will be called next frame.
	// @param args The arguments to pass to the method.
	// @return The return value of the method.
	Variant callv(const std::string &method, bool deferred, const Variant *argv, unsigned argc);

	template <typename... Args>
	Variant call(const std::string &method, Args... args);

	template <typename... Args>
	Variant operator () (const std::string &method, Args... args);

	template <typename... Args>
	Variant call_deferred(const std::string &method, Args... args);

	/// @brief Get a list of methods available on the object.
	/// @return A list of method names.
	std::vector<std::string> get_method_list() const;

	// Get a property of the node.
	// @param name The name of the property.
	// @return The value of the property.
	Variant get(const std::string &name) const;

	// Set a property of the node.
	// @param name The name of the property.
	// @param value The value to set the property to.
	void set(const std::string &name, const Variant &value);

	// Get a list of properties available on the object.
	// @return A list of property names.
	std::vector<std::string> get_property_list() const;

	// Connect a signal to a method on another object.
	// @param signal The signal to connect.
	// @param target The object to connect to.
	// @param method The method to call when the signal is emitted.
	void connect(Object target, const std::string &signal, const std::string &method);
	void connect(const std::string &signal, const std::string &method);

	// Disconnect a signal from a method on another object.
	// @param signal The signal to disconnect.
	// @param target The object to disconnect from.
	// @param method The method to disconnect.
	void disconnect(Object target, const std::string &signal, const std::string &method);
	void disconnect(const std::string &signal, const std::string &method);

	// Get a list of signals available on the object.
	// @return A list of signal names.
	std::vector<std::string> get_signal_list() const;

	// Get the object identifier.
	uint64_t address() const { return m_address; }

	// Check if the node is valid.
	bool is_valid() const { return m_address != 0; }
};
```

## Node

```cpp
struct Node : public Object {
	/// @brief Construct a Node object from an existing in-scope Node object.
	/// @param addr The address of the Node object.
	Node(uint64_t addr) : Object{addr} {}

	/// @brief Construct a Node object from a path.
	/// @param path The path to the Node object.
	Node(const std::string& path);

	/// @brief Get the name of the node.
	/// @return The name of the node.
	std::string get_name() const;

	/// @brief Get the path of the node, relative to the root node.
	/// @return The path of the node.
	std::string get_path() const;

	/// @brief Get the parent of the node.
	/// @return The parent node.
	Node get_parent() const;

	/// @brief Get the Node object at the given path, relative to this node.
	/// @param path The path to the Node object.
	/// @return The Node object.
	Node get_node(const std::string &path) const;

	/// @brief Get the number of children of the node.
	/// @return The number of children.
	unsigned get_child_count() const;

	/// @brief Get the child of the node at the given index.
	/// @param index The index of the child.
	/// @return The child node.
	Node get_child(unsigned index) const;

	/// @brief Add a child to the node.
	/// @param child The child node to add.
	/// @param deferred If true, the child will be added next frame.
	void add_child(const Node &child, bool deferred = false);

	/// @brief Add a sibling to the node.
	/// @param sibling The sibling node to add.
	/// @param deferred If true, the sibling will be added next frame.
	void add_sibling(const Node &sibling, bool deferred = false);

	/// @brief Move a child of the node to a new index.
	/// @param child The child node to move.
	/// @param index The new index of the child.
	void move_child(const Node &child, unsigned index);

	/// @brief Remove a child from the node. The child is *not* freed.
	/// @param child The child node to remove.
	/// @param deferred If true, the child will be removed next frame.
	void remove_child(const Node &child, bool deferred = false);

	/// @brief Get a list of children of the node.
	/// @return A list of children nodes.
	std::vector<Node> get_children() const;

	/// @brief Remove this node from its parent, freeing it.
	/// @note This is a potentially deferred operation.
	void queue_free();

	/// @brief  Duplicate the node.
	/// @return A new Node object with the same properties and children.
	Node duplicate() const;
};
```

## Node2D

```cpp
struct Node2D : public Node {
	/// @brief Construct a Node2D object from an existing in-scope Node object.
	/// @param addr The address of the Node2D object.
	Node2D(uint64_t addr) : Node(addr) {}

	/// @brief Construct a Node2D object from a path.
	/// @param path The path to the Node2D object.
	Node2D(const std::string& path) : Node(path) {}

	/// @brief Get the position of the node.
	/// @return The position of the node.
	Vector2 get_position() const;
	/// @brief Set the position of the node.
	/// @param value The new position of the node.
	void set_position(const Variant &value);

	/// @brief Get the rotation of the node.
	/// @return The rotation of the node.
	float get_rotation() const;
	/// @brief Set the rotation of the node.
	/// @param value The new rotation of the node.
	void set_rotation(const Variant &value);

	/// @brief Get the scale of the node.
	/// @return The scale of the node.
	Vector2 get_scale() const;
	/// @brief Set the scale of the node.
	/// @param value The new scale of the node.
	void set_scale(const Variant &value);

	/// @brief Get the skew of the node.
	/// @return The skew of the node.
	float get_skew() const;
	/// @brief Set the skew of the node.
	/// @param value The new skew of the node.
	void set_skew(const Variant &value);

	/// @brief  Duplicate the node.
	/// @return A new Node2D object with the same properties and children.
	Node2D duplicate() const;
};
```

## Node3D

```cpp
struct Node3D : public Node {
	/// @brief Construct a Node3D object from an existing in-scope Node object.
	/// @param addr The address of the Node3D object.
	Node3D(uint64_t addr) : Node(addr) {}

	/// @brief Construct a Node3D object from a path.
	/// @param path The path to the Node3D object.
	Node3D(const std::string& path) : Node(path) {}

	/// @brief Get the position of the node.
	/// @return The position of the node.
	Vector3 get_position() const;
	/// @brief Set the position of the node.
	/// @param value The new position of the node.
	void set_position(const Variant &value);

	/// @brief Get the rotation of the node.
	/// @return The rotation of the node.
	Vector3 get_rotation() const;
	/// @brief Set the rotation of the node.
	/// @param value The new rotation of the node.
	void set_rotation(const Variant &value);

	/// @brief Get the scale of the node.
	/// @return The scale of the node.
	Vector3 get_scale() const;
	/// @brief Set the scale of the node.
	/// @param value The new scale of the node.
	void set_scale(const Variant &value);

	/// @brief  Duplicate the node.
	/// @return A new Node3D object with the same properties and children.
	Node3D duplicate() const;
};
```

## Vector2

```cpp
struct Vector2 {
	float x;
	float y;

	float length() const noexcept;
	Vector2 normalized() const noexcept;
	Vector2 rotated(float angle) const noexcept;
	float distance_to(const Vector2& other) const noexcept;
	Vector2 direction_to(const Vector2& other) const noexcept;
	float dot(const Vector2& other) const noexcept;
	static Vector2 sincos(float angle) noexcept;
	static Vector2 from_angle(float angle) noexcept;

	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);

	Vector2& operator += (const Vector2& other);
	Vector2& operator -= (const Vector2& other);
	Vector2& operator *= (const Vector2& other);
	Vector2& operator /= (const Vector2& other);
};
```

## Vector3

```cpp
struct Vector3 {
	float x;
	float y;
	float z;

	float length() const noexcept;
	Vector3 normalized() const noexcept;
	float dot(const Vector3& other) const noexcept;
	Vector3 cross(const Vector3& other) const noexcept;
	float distance_to(const Vector3& other) const noexcept;
	float distance_squared_to(const Vector3& other) const noexcept;
	Vector3 direction_to(const Vector3& other) const noexcept;

	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);

	Vector3& operator += (const Vector3& other);
	Vector3& operator -= (const Vector3& other);
	Vector3& operator *= (const Vector3& other);
	Vector3& operator /= (const Vector3& other);
};
```

## Color

```cpp
struct Color {
	float r;
	float g;
	float b;
	float a;

	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);

	Color& operator += (const Color& other);
	Color& operator -= (const Color& other);
	Color& operator *= (const Color& other);
	Color& operator /= (const Color& other);

	Color& operator += (float other);
	Color& operator -= (float other);
	Color& operator *= (float other);
	Color& operator /= (float other);
};
```

## Packed Arrays

```cpp
/**
 * @brief A reference to a host-side Packed Array.
 * Supported:
 * - PackedByteArray
 * - PackedInt32Array
 * - PackedInt64Array
 * - PackedFloat32Array
 * - PackedFloat64Array
 * - PackedVector2Array
 * - PackedVector3Array
 * - PackedColorArray
 * 
 * @tparam T uint8_t, int32_t, int64_t, float, double, Vector2, Vector3 or Color.
 **/
template <typename T>
struct PackedArray {
	constexpr PackedArray() {}

	/// @brief Create a PackedArray from a vector of data.
	/// @param data The initial data.
	PackedArray(const std::vector<T> &data);

	/// @brief Retrieve the host-side array data.
	/// @return std::vector<T> The host-side array data.
	std::vector<T> fetch() const;

	/// @brief Store a vector of data into the host-side array.
	/// @param data The data to store.
	void store(const std::vector<T> &data);

	/// @brief Store an array of data into the host-side array.
	/// @param data The data to store.
	void store(const T *data, size_t size);

	/// @brief Call a method on the packed array.
	/// @tparam Args The method arguments.
	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);
};
```

## ClassDB

```cpp
/// @brief The class database for instantiating Godot objects.
struct ClassDB {
	/// @brief Instantiate a new object of the given class.
	/// @param class_name The name of the class to instantiate.
	/// @param name The name of the object, if it's a Node. Otherwise, this is ignored.
	/// @return The new object.
	static Object instantiate(std::string_view class_name, std::string_view name = "");
};
```

## Engine

```cpp
struct Engine {
	/// @brief Check if the program is running in the Godot editor.
	/// @return True if running in the editor, false otherwise.
	static bool is_editor_hint();

	/// @brief Get the current time scale.
	/// @return The current time scale.
	static double get_time_scale();

	/// @brief Set a new time scale.
	/// @param scale The new time scale.
	static void set_time_scale(double scale);

	/// @brief Get the singleton instance of the Engine.
	/// @return The Engine singleton.
	static Object get_singleton();
};
```

## Input

```cpp
struct Input {
	/// @brief Check if an action is currently pressed.
	/// @param action The name of the action.
	/// @return True if the action is pressed, false otherwise.
	static bool is_action_pressed(const std::string &action);

	/// @brief Check if an action is released.
	/// @param action The name of the action.
	/// @return True if the action is released, false otherwise.
	static bool is_action_released(const std::string &action);

	/// @brief Check if an action is just pressed.
	/// @param action The name of the action.
	/// @return True if the action is just pressed, false otherwise.
	static bool is_action_just_pressed(const std::string &action);

	/// @brief Check if an action is just released.
	/// @param action The name of the action.
	/// @return True if the action is just released, false otherwise.
	static bool is_action_just_released(const std::string &action);

	/// @brief Get the singleton instance of the Input class.
	/// @return The Input singleton.
	static Object get_singleton();
};
```

## Time

```cpp
struct Time {
	/// @brief Get the current time in milliseconds.
	/// @return The current time in milliseconds.
	static int64_t get_ticks_msec();

	/// @brief Get the current time in microseconds.
	/// @return The current time in microseconds.
	static int64_t get_ticks_usec();

	/// @brief Get the singleton instance of the Time class.
	/// @return The Time singleton.
	static Object get_singleton();
};
```

## Timer

```cpp
struct Timer {
	using period_t = double;
	using TimerCallback = Function<Variant(Variant)>;
	using TimerNativeCallback = Function<Variant(Object)>;

	// For when all arguments are Variants
	static Variant oneshot(period_t secs, TimerCallback callback);

	static Variant periodic(period_t period, TimerCallback callback);

	// For when unboxed argument types are enabled
	static Variant native_oneshot(period_t secs, TimerNativeCallback callback);

	static Variant native_periodic(period_t period, TimerNativeCallback callback);
};
```

## Math functions

```cpp
/// @brief Math and interpolation operations.
struct Math {
	/// @brief The available 64-bit FP math operations.
	static double sin(double x);
	static double cos(double x);
	static double tan(double x);
	static double asin(double x);
	static double acos(double x);
	static double atan(double x);
	static double atan2(double y, double x);
	static double pow(double x, double y);

	/// @brief The available 32-bit FP math operations.
	static float sinf(float x);
	static float cosf(float x);
	static float tanf(float x);
	static float asinf(float x);
	static float acosf(float x);
	static float atanf(float x);
	static float atan2f(float y, float x);
	static float powf(float x, float y);

	/// @brief Linearly interpolate between two values.
	/// @param a The start value.
	/// @param b The end value.
	/// @param t The interpolation factor (between 0 and 1).
	static double lerp(double a, double b, double t);
	static float lerpf(float a, float b, float t);

	/// @brief Smoothly interpolate between two values.
	/// @param from The start value.
	/// @param to The end value.
	/// @param t The interpolation factor (between 0 and 1).
	static double smoothstep(double from, double to, double t);
	static float smoothstepf(float from, float to, float t);

	/// @brief Clamp a value between two bounds.
	/// @param x The value to clamp.
	/// @param min The minimum value.
	/// @param max The maximum value.
	static double clamp(double x, double min, double max);
	static float clampf(float x, float min, float max);

	/// @brief Spherical linear interpolation between two values.
	/// @param a The start value in radians.
	/// @param b The end value in radians.
	/// @param t The interpolation factor (between 0 and 1).
	static double slerp(double a, double b, double t);
	static float slerpf(float a, float b, float t);
};
```
