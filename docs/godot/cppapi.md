---
sidebar_position: 5
---

# C++ API

The current C++ API is likely to change over time. Feel free to contribute improvements to the API.


## Globals

```cpp
/// @brief Print a message to the console.
/// @param ...vars A list of Variant objects to print.
template <typename... Args>
void print(Args &&...vars);

/// @brief Get the current scene tree.
/// @return The root node of the scene tree.
Object get_tree();

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

/// @brief Check if the program is running in the Godot editor.
/// @return True if running in the editor, false otherwise.
inline bool is_editor();

struct Engine {
	/// @brief Check if the program is running in the Godot editor.
	/// @return True if running in the editor, false otherwise.
	static bool is_editor_hint();
};

/// @brief Check if the given Node is a part of the current scene tree. Not an instance of another scene.
/// @param node The Node to check.
/// @return True if the Node is a part of the current scene tree, false otherwise.
inline bool is_part_of_tree(Node node);
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
	Variant(const Object&);
	Variant(const Node&);
	Variant(const Node2D&);
	Variant(const Node3D&);

	// Constructor specifically the STRING_NAME type
	static Variant string_name(const std::string &name);

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
	operator const std::string&() const; // String for STRING and PACKED_BYTE_ARRAY
	operator std::string&();
	operator std::string_view() const; // View for STRING and PACKED_BYTE_ARRAY
	operator std::span<uint8_t>() const; // Modifiable span for PACKED_BYTE_ARRAY

	Node as_node() const;
	Node2D as_node2d() const;
	Node3D as_node3d() const;

	const Vector2& v2() const;
	Vector2& v2();
	const Vector2i& v2i() const;
	Vector2i& v2i();
	const Vector3& v3() const;
	Vector3& v3();
	const Vector3i& v3i() const;
	Vector3i& v3i();
	const Vector4& v4() const;
	Vector4& v4();
	const Vector4i& v4i() const;
	Vector4i& v4i();
	const Rect2& r2() const;
	Rect2& r2();
	const Rect2i& r2i() const;
	Rect2i& r2i();

	std::vector<float>& f32array() const; // Modifiable vector for PACKED_FLOAT32_ARRAY
	std::vector<double>& f64array() const; // Modifiable vector for PACKED_FLOAT64_ARRAY

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

	Type get_type() const noexcept { return m_type; }
};
```

## Array

```cpp
struct Array {
	Array(unsigned size = 0);
	Array(const std::vector<Variant> &values);
	Array(const Array &other);
	Array(Array &&other);
	~Array();

	Array &operator=(const Array &other);
	Array &operator=(Array &&other);

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
	Dictionary();
	Dictionary(const Dictionary &other);
	Dictionary(Dictionary &&other);
	~Dictionary();

	Dictionary &operator=(const Dictionary &other);
	Dictionary &operator=(Dictionary &&other);

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

## Object

```cpp
struct Object {
	/// @brief Construct an Object object from an allowed global object.
	Object(const std::string &name);

	/// @brief Construct an Object object from an existing in-scope Object object.
	/// @param addr The address of the Object object.
	Object(uint64_t addr) : m_address{addr} {}

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
	static Vector2 from_angle(float angle) noexcept;

	auto& operator += (const Vector2& other);
	auto& operator -= (const Vector2& other);
	auto& operator *= (const Vector2& other);
	auto& operator /= (const Vector2& other);
};
```

## Vector3

```cpp
struct Vector3 {
	float x;
	float y;
	float z;

	// TODO: More to come here

	auto& operator += (const Vector3& other);
	auto& operator -= (const Vector3& other);
	auto& operator *= (const Vector3& other);
	auto& operator /= (const Vector3& other);
};
```
