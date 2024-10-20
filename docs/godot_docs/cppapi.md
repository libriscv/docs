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
	Variant(const Basis&);
	Variant(const Transform2D&);
	Variant(const Transform3D&);
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

	Basis as_basis() const;
	Transform2D as_transform2d() const;
	Transform3D as_transform3d() const;
	Object as_object() const;
	Node as_node() const;
	Node2D as_node2d() const;
	Node3D as_node3d() const;
	Array as_array() const;
	Dictionary as_dictionary() const;
	String as_string() const;
	Callable as_callable() const;
	std::string as_std_string() const;
	std::u32string as_std_u32string() const;
	PackedArray<uint8_t> as_byte_array() const;
	PackedArray<float> as_float32_array() const;
	PackedArray<double> as_float64_array() const;
	PackedArray<int32_t> as_int32_array() const;
	PackedArray<int64_t> as_int64_array() const;
	PackedArray<Vector2> as_vector2_array() const;
	PackedArray<Vector3> as_vector3_array() const;
	PackedArray<Color> as_color_array() const;
	PackedArray<std::string> as_string_array() const;

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

	void callp(std::string_view method, const Variant *args, int argcount, Variant &r_ret);
	void voidcallp(std::string_view method, const Variant *args, int argcount);

	template <typename... Args>
	Variant method_call(std::string_view method, Args&&... args);

	template <typename... Args>
	void void_method(std::string_view method, Args&&... args);

	template <typename... Args>
	Variant call(Args... args);

	template <typename... Args>
	Variant operator ()(std::string_view method, Args... args);

	/// @brief Check if the Variant is nil.
	/// @return true if the Variant is nil, false otherwise.
	bool is_nil() const noexcept { return m_type == NIL; }

	static void evaluate(const Operator &op, const Variant &a, const Variant &b, Variant &r_ret, bool &r_valid);

	Variant &operator=(const Variant &other);
	Variant &operator=(Variant &&other);
	bool operator==(const Variant &other) const;
	bool operator!=(const Variant &other) const;
	bool operator<(const Variant &other) const;

	Variant duplicate() const;

	/// @brief Make the Variant permanent, by moving it to permanent storage.
	/// @return Updates the Variant to the new permanent Variant and returns it.
	Variant &make_permanent();

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
	void erase(const Variant &value);
	void resize(int size);
	void clear();
	void sort();

	// Array access
	Variant operator[](int idx) const;
	Variant at(int idx) const { return (*this)[idx]; }
	Variant front() const { return (*this)[0]; }
	Variant back() const { return (*this)[size() - 1]; }
	bool has(const Variant &value) const;

	std::vector<Variant> to_vector() const;

	// Array size
	int size() const;
	bool is_empty() const { return size() == 0; }

	// Vararg methods
	METHOD(all);
	METHOD(any);
	METHOD(append_array);
	METHOD(assign);
	METHOD(bsearch_custom);
	METHOD(bsearch);
	METHOD(count);
	METHOD(duplicate);
	METHOD(fill);
	METHOD(filter);
	METHOD(find);
	METHOD(hash);
	METHOD(is_read_only);
	METHOD(is_same_typed);
	METHOD(is_typed);
	METHOD(make_read_only);
	METHOD(map);
	METHOD(max);
	METHOD(min);
	METHOD(pick_random);
	METHOD(reduce);
	METHOD(remove_at);
	METHOD(reverse);
	METHOD(rfind);
	METHOD(shuffle);
	METHOD(slice_array);
	METHOD(slice);
	METHOD(sort_custom);

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

	DictAccessor operator[](const Variant &key);
	Variant get(const Variant &key) const;
	void set(const Variant &key, const Variant &value);
	Variant get_or_add(const Variant &key, const Variant &default_value = Variant());

	int size() const;
	bool is_empty() const { return size() == 0; }

	void clear();
	void erase(const Variant &key);
	bool has(const Variant &key) const;
	void merge(const Dictionary &other);
	Dictionary duplicate(bool deep = false) const;
	Variant find_key(const Variant &key) const;
	bool has_all(const Array &keys) const;
	int hash() const;
	bool is_read_only() const;
	Variant keys() const;
	void make_read_only();
	void merge(const Dictionary &dictionary, bool overwrite = false);
	Dictionary merged(const Dictionary &dictionary, bool overwrite = false) const;
	bool recursive_equal(const Dictionary &dictionary, int recursion_count) const;
	Variant values() const;
};
```

## String

```cpp
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
	bool is_empty() const { return size() == 0; }

	// Vararg methods
	METHOD(begins_with);
	METHOD(bigrams);
	METHOD(bin_to_int);
	METHOD(c_escape);
	METHOD(c_unescape);
	METHOD(capitalize);
	METHOD(casecmp_to);
	METHOD(chr);
	METHOD(containsn);
	METHOD(count);
	METHOD(countn);
	METHOD(dedent);
	METHOD(ends_with);
	METHOD(filecasecmp_to);
	METHOD(filenocasecmp_to);
	METHOD(findn);
	METHOD(format);
	METHOD(get_base_dir);
	METHOD(get_basename);
	METHOD(get_extension);
	METHOD(get_file);
	METHOD(get_slice);
	METHOD(get_slice_count);
	METHOD(get_slicec);
	METHOD(hash);
	METHOD(hex_decode);
	METHOD(hex_to_int);
	METHOD(humanize_size);
	METHOD(indent);
	METHOD(is_absolute_path);
	METHOD(is_relative_path);
	METHOD(is_subsequence_of);
	METHOD(is_subsequence_ofn);
	METHOD(is_valid_filename);
	METHOD(is_valid_float);
	METHOD(is_valid_hex_number);
	METHOD(is_valid_html_color);
	METHOD(is_valid_identifier);
	METHOD(is_valid_int);
	METHOD(is_valid_ip_address);
	METHOD(join);
	METHOD(json_escape);
	METHOD(left);
	METHOD(length);
	METHOD(lpad);
	METHOD(lstrip);
	METHOD(match);
	METHOD(matchn);
	METHOD(md5_buffer);
	METHOD(md5_text);
	METHOD(naturalcasecmp_to);
	METHOD(naturalnocasecmp_to);
	METHOD(nocasecmp_to);
	METHOD(num);
	METHOD(num_int64);
	METHOD(num_scientific);
	METHOD(num_uint64);
	METHOD(pad_decimals);
	METHOD(pad_zeros);
	METHOD(path_join);
	METHOD(repeat);
	METHOD(replace);
	METHOD(replacen);
	METHOD(reverse);
	METHOD(rfind);
	METHOD(rfindn);
	METHOD(right);
	METHOD(rpad);
	METHOD(rsplit);
	METHOD(rstrip);
	METHOD(sha1_buffer);
	METHOD(sha1_text);
	METHOD(sha256_buffer);
	METHOD(sha256_text);
	METHOD(similarity);
	METHOD(simplify_path);
	METHOD(split);
	METHOD(split_floats);
	METHOD(strip_edges);
	METHOD(strip_escapes);
	METHOD(substr);
	METHOD(to_ascii_buffer);
	METHOD(to_camel_case);
	METHOD(to_float);
	METHOD(to_int);
	METHOD(to_lower);
	METHOD(to_pascal_case);
	METHOD(to_snake_case);
	METHOD(to_upper);
	METHOD(to_utf8_buffer);
	METHOD(to_utf16_buffer);
	METHOD(to_utf32_buffer);
	METHOD(to_wchar_buffer);
	METHOD(trim_prefix);
	METHOD(trim_suffix);
	METHOD(unicode_at);
	METHOD(uri_decode);
	METHOD(uri_encode);
	METHOD(validate_filename);
	METHOD(validate_node_name);
	METHOD(xml_escape);
	METHOD(xml_unescape);
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


## Basis

```cpp
struct Basis {
	constexpr Basis() {} // DON'T TOUCH

	/// @brief Create a new identity basis.
	/// @return The identity basis.
	static Basis identity();

	/// @brief Create a new basis from three axes.
	/// @param x  The x-axis of the basis.
	/// @param y  The y-axis of the basis.
	/// @param z  The z-axis of the basis.
	Basis(const Vector3 &x, const Vector3 &y, const Vector3 &z);

	Basis &operator =(const Basis &basis);
	void assign(const Basis &basis);

	// Basis operations
	void invert();
	void transpose();
	Basis inverse() const;
	Basis transposed() const;
	double determinant() const;

	Basis rotated(const Vector3 &axis, double angle) const;
	Basis lerp(const Basis &to, double t) const;
	Basis slerp(const Basis &to, double t) const;

	// Basis access
	Vector3 operator[](int idx) const { return get_row(idx); }

	void set_row(int idx, const Vector3 &axis);
	Vector3 get_row(int idx) const;
	void set_column(int idx, const Vector3 &axis);
	Vector3 get_column(int idx) const;

	// Basis size
	static constexpr int size() { return 3; }

	// Call operator
	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);
};
```

## Transform2D

```cpp
struct Transform2D {
	constexpr Transform2D() {} // DON'T TOUCH

	/// @brief Create a new identity transform.
	/// @return The identity transform.
	static Transform2D identity();

	/// @brief Create a new transform from two axes and an origin.
	/// @param x  The x-axis of the transform.
	/// @param y  The y-axis of the transform.
	/// @param origin The origin of the transform.
	Transform2D(const Vector2 &x, const Vector2 &y, const Vector2 &origin);

	Transform2D &operator =(const Transform2D &transform);
	void assign(const Transform2D &transform);

	// Transform2D operations
	void invert();
	void affine_invert();
	void rotate(const double angle);
	void scale(const Vector2 &scale);
	void translate(const Vector2 &offset);
	void interpolate_with(const Transform2D &transform, double weight);

	Transform2D inverse() const;
	Transform2D orthonormalized() const;
	Transform2D rotated(double angle) const;
	Transform2D scaled(const Vector2 &scale) const;
	Transform2D translated(const Vector2 &offset) const;
	Transform2D interpolate_with(const Transform2D &p_transform, double weight) const;

	// Transform2D access
	Vector2 get_column(int idx) const;
	void set_column(int idx, const Vector2 &axis);
	Vector2 operator[](int idx) const { return get_column(idx); }

	// Call operator
	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);
};
```

## Transform3D

```cpp
struct Transform3D {
	constexpr Transform3D() {}

	/// @brief Create a new identity transform.
	/// @return The identity transform.
	static Transform3D identity();

	/// @brief Create a new transform from a basis and origin.
	/// @param origin The origin of the transform.
	/// @param basis The basis of the transform.
	Transform3D(const Vector3 &origin, const Basis &basis);

	Transform3D &operator =(const Transform3D &transform);
	void assign(const Transform3D &transform);

	// Transform3D operations
	void invert();
	void affine_invert();
	void translate(const Vector3 &offset);
	void rotate(const Vector3 &axis, double angle);
	void scale(const Vector3 &scale);

	Transform3D inverse() const;
	Transform3D orthonormalized() const;
	Transform3D rotated(const Vector3 &axis, double angle) const;
	Transform3D rotated_local(const Vector3 &axis, double angle) const;
	Transform3D scaled(const Vector3 &scale) const;
	Transform3D scaled_local(const Vector3 &scale) const;
	Transform3D translated(const Vector3 &offset) const;
	Transform3D translated_local(const Vector3 &offset) const;
	Transform3D looking_at(const Vector3 &target, const Vector3 &up) const;
	Transform3D interpolate_with(const Transform3D &to, double weight) const;

	// Transform3D access
	Vector3 get_origin() const;
	void set_origin(const Vector3 &origin);
	Basis get_basis() const;
	void set_basis(const Basis &basis);

	// Call operator
	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);
};
```

## Quaternion

```cpp
struct Quaternion {
	constexpr Quaternion() {}

	static Quaternion identity();
	Quaternion(double p_x, double p_y, double p_z, double p_w);
	Quaternion(const Vector3 &axis, double angle);
	Quaternion(const Vector3 &euler);

	Quaternion &operator =(const Quaternion &quat);
	void assign(const Quaternion &quat);

	// Quaternion operations
	double dot(const Quaternion &q) const;
	double length_squared() const;
	double length() const;
	void normalize();
	Quaternion normalized() const;
	bool is_normalized() const;
	Quaternion inverse() const;
	Quaternion log() const;
	Quaternion exp() const;
	double angle_to(const Quaternion &to) const;

	Quaternion slerp(const Quaternion &to, double t) const;
	Quaternion slerpni(const Quaternion &to, double t) const;
	Quaternion cubic_interpolate(const Quaternion &b, const Quaternion &pre_a, const Quaternion &post_b, double t) const;
	Quaternion cubic_interpolate_in_time(const Quaternion &b, const Quaternion &pre_a, const Quaternion &post_b, double t, double b_t, double pre_a_t, double post_b_t) const;

	Vector3 get_axis() const;
	double get_angle() const;

	void operator*=(const Quaternion &q);
	Quaternion operator*(const Quaternion &q) const;

	// Quaternion access
	static constexpr int size() { return 4; }
	double operator[](int idx) const;

	// Call operator
	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);
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
 * - PackedStringArray
 * 
 * @tparam T uint8_t, int32_t, int64_t, float, double, Vector2, Vector3, Color or std::string.
**/
template <typename T>
struct PackedArray {
	constexpr PackedArray() {}

	/// @brief Create a PackedArray from a vector of data.
	/// @param data The initial data.
	PackedArray(const std::vector<T> &data);

	/// @brief Create a PackedArray from an array of data.
	/// @param data The initial data.
	/// @param size The size of the data in elements.
	PackedArray(const T *data, size_t size);

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
