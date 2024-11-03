---
sidebar_position: 11
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
inline SceneTree get_tree();

/// @brief Check if the given Node is a part of the current scene tree. Not an instance of another scene.
/// @param node The Node to check.
/// @return True if the Node is a part of the current scene tree, false otherwise.
inline bool is_part_of_tree(Node node);

/// @brief Get a node by its path. By default, this returns the current node.
/// @param path The path to the node.
/// @return The node at the given path.
template <typename T = Node>
inline T get_node(std::string_view path = ".");

/// @brief Get the parent of the current node.
/// @return The parent node.
template <typename T>
inline T get_parent();

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
	Variant(const Callable&);
	Variant(const ::RID&);
	Variant(const Object&);
	Variant(const Node&);
	Variant(const Node2D&);
	Variant(const Node3D&);
	Variant(const Basis&);
	Variant(const Transform2D&);
	Variant(const Transform3D&);
	Variant(const Quaternion&);
	Variant(const PackedArray<uint8_t>&);
	Variant(const PackedArray<float>&);
	Variant(const PackedArray<double>&);
	Variant(const PackedArray<int32_t>&);
	Variant(const PackedArray<int64_t>&);
	Variant(const PackedArray<Vector2>&);
	Variant(const PackedArray<Vector3>&);
	Variant(const PackedArray<Color>&);
	Variant(const PackedArray<std::string>&);

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
	operator Basis() const;
	operator Transform2D() const;
	operator Transform3D() const;
	operator Quaternion() const;
	operator std::string() const; // String for STRING and PACKED_BYTE_ARRAY
	operator std::u32string() const; // u32string for STRING, STRING_NAME
	operator String() const;
	operator Array() const;
	operator Dictionary() const;
	operator Callable() const;

	Basis as_basis() const;
	Transform2D as_transform2d() const;
	Transform3D as_transform3d() const;
	Quaternion as_quaternion() const;
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
	const Plane &plane() const;
	Plane &plane();

	operator Vector2() const;
	operator Vector2i() const;
	operator Vector3() const;
	operator Vector3i() const;
	operator Vector4() const;
	operator Vector4i() const;
	operator Rect2() const;
	operator Rect2i() const;
	operator Color() const;
	operator Plane() const;

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

	Variant &operator=(const Variant &other);
	Variant &operator=(Variant &&other);
	bool operator==(const Variant &other) const;
	bool operator!=(const Variant &other) const;
	bool operator<(const Variant &other) const;

	/// @brief Check if the Variant is nil.
	/// @return true if the Variant is nil, false otherwise.
	bool is_nil() const noexcept { return m_type == NIL; }

	static void evaluate(const Operator &op, const Variant &a, const Variant &b, Variant &r_ret, bool &r_valid);

	Variant duplicate() const;

	/// @brief Make the Variant permanent, by moving it to permanent storage.
	/// @return Updates the Variant to the new permanent Variant and returns it.
	Variant &make_permanent();
	bool is_permanent() const noexcept;

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
	Variant &operator[](int idx) const;
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

	Variant &operator[](const Variant &key);
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
	Variant get(std::string_view name) const;

	// Set a property of the node.
	// @param name The name of the property.
	// @param value The value to set the property to.
	void set(std::string_view name, const Variant &value);

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

	// Other member functions
	String get_class() const;
	bool is_class(const String &name) const;
	String to_string() const;

	METHOD(Variant, _get);
	METHOD(Variant, _get_property_list);
	METHOD(void, _init);
	METHOD(void, _notification);
	METHOD(bool, _property_can_revert);
	METHOD(Variant, _property_get_revert);
	METHOD(bool, _set);
	METHOD(String, _to_string);
	METHOD(void, _validate_property);
	METHOD(void, add_user_signal);
	METHOD(bool, can_translate_messages);
	METHOD(void, cancel_free);
	METHOD(Variant, emit_signal);
	METHOD(void, free);
	METHOD(Variant, get_incoming_connections);
	METHOD(Variant, get_indexed);
	METHOD(int, get_instance_id);
	METHOD(Variant, get_meta);
	METHOD(Variant, get_meta_list);
	METHOD(int, get_method_argument_count);
	METHOD(Variant, get_script);
	METHOD(Variant, get_signal_connection_list);
	METHOD(bool, has_meta);
	METHOD(bool, has_method);
	METHOD(bool, has_signal);
	METHOD(bool, has_user_signal);
	METHOD(bool, is_blocking_signals);
	METHOD(bool, is_connected);
	METHOD(bool, is_queued_for_deletion);
	METHOD(void, notification);
	METHOD(void, notify_property_list_changed);
	METHOD(bool, property_can_revert);
	METHOD(Variant, property_get_revert);
	METHOD(void, remove_meta);
	METHOD(void, remove_user_signal);
	METHOD(void, set_block_signals);
	METHOD(void, set_indexed);
	METHOD(void, set_message_translation);
	METHOD(void, set_meta);
	METHOD(void, set_script);
	METHOD(String, tr);
	METHOD(String, tr_n);

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
	Node(std::string_view path);

	/// @brief Get the name of the node.
	/// @return The name of the node.
	Variant get_name() const;

	/// @brief Set the name of the node.
	/// @param name The new name of the node.
	void set_name(Variant name);

	/// @brief Get the path of the node, relative to the root node.
	/// @return The path of the node.
	Variant get_path() const;

	/// @brief Get the parent of the node.
	/// @return The parent node.
	Node get_parent() const;

	/// @brief Get the Node object at the given path, relative to this node.
	/// @param path The path to the Node object.
	/// @return The Node object.
	Node get_node(const std::string &path) const;

	template <typename T>
	T get_node(std::string_view path) const;

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

	/// @brief Add the node to a group.
	/// @param group The group to add the node to.
	void add_to_group(std::string_view group);

	/// @brief Remove the node from a group.
	/// @param group The group to remove the node from.
	void remove_from_group(std::string_view group);

	/// @brief Check if the node is in a group.
	/// @param group The group to check.
	/// @return True if the node is in the group, false otherwise.
	bool is_in_group(std::string_view group) const;

	/// @brief Check if the node is inside the scene tree.
	/// @return True if the node is inside the scene tree, false otherwise.
	bool is_inside_tree() const;

	/// @brief Replace the node with another node.
	/// @param node The node to replace this node with.
	void replace_by(const Node &node, bool keep_groups = false);

	/// @brief Changes the parent of this Node to the new_parent.
	/// The node needs to already have a parent.
	/// The node's owner is preserved if its owner is still reachable
	/// from the new location (i.e., the node is still a descendant
	/// of the new parent after the operation).
	/// @param new_parent The new parent node.
	/// @param keep_global_transform If true, the node's global transform is preserved.
	void reparent(const Node &new_parent, bool keep_global_transform = true);

	/// @brief Remove this node from its parent, freeing it.
	/// @note This is a potentially deferred operation.
	void queue_free();

	/// @brief  Duplicate the node.
	/// @return A new Node object with the same properties and children.
	Node duplicate(int flags = 15) const;

	/// @brief Create a new Node object.
	/// @param path The path to the Node object.
	/// @return The Node object.
	static Node Create(std::string_view path);

	//- Properties -//
	PROPERTY(name, String);
	PROPERTY(owner, Node);
	PROPERTY(unique_name_in_owner, bool);
	PROPERTY(editor_description, String);
	PROPERTY(physics_interpolation_mode, int64_t);
	PROPERTY(process_mode, int64_t);
	PROPERTY(process_priority, int64_t);

	//- Methods -//
	METHOD(bool, can_process);
	METHOD(Object, create_tween);
	METHOD(Node, find_child);
	METHOD(Variant, find_children);
	METHOD(Node, find_parent);
	METHOD(Node, get_viewport);
	METHOD(Node, get_window);
	METHOD(bool, has_node);
	METHOD(bool, has_node_and_resource);
	METHOD(bool, is_ancestor_of);
	METHOD(void, set_physics_process);
	METHOD(bool, is_physics_processing);
	METHOD(void, set_physics_process_internal);
	METHOD(bool, is_physics_processing_internal);
	METHOD(void, set_process);
	METHOD(bool, is_processing);
	METHOD(void, set_process_input);
	METHOD(bool, is_processing_input);
	METHOD(void, set_process_internal);
	METHOD(bool, is_processing_internal);
	METHOD(void, set_process_unhandled_input);
	METHOD(bool, is_processing_unhandled_input);
	METHOD(void, set_process_unhandled_key_input);
	METHOD(bool, is_processing_unhandled_key_input);
	METHOD(void, set_process_shortcut_input);
	METHOD(bool, is_processing_shortcut_input);
	METHOD(bool, is_node_ready);
	METHOD(void, set_thread_safe);
	METHOD(void, set_owner);
	METHOD(Node, get_owner);
	METHOD(void, set_scene_file_path);
	METHOD(String, get_scene_file_path);
	METHOD(void, print_tree);
	METHOD(void, print_tree_pretty);
	METHOD(void, print_orphan_nodes);
	METHOD(void, propagate_call);
};
```

## Node2D

```cpp
struct Node2D : public Node {
	/// @brief Construct a Node2D object from an existing in-scope Node object.
	/// @param addr The address of the Node2D object.
	constexpr Node2D(uint64_t addr) : Node(addr) {}
	Node2D(Object obj) : Node(obj) {}
	Node2D(Node node) : Node(node) {}

	/// @brief Construct a Node2D object from a path.
	/// @param path The path to the Node2D object.
	Node2D(std::string_view path) : Node(path) {}

	/// @brief Get the position of the node.
	/// @return The position of the node.
	Vector2 get_position() const;
	/// @brief Set the position of the node.
	/// @param value The new position of the node.
	void set_position(const Vector2 &value);

	/// @brief Get the rotation of the node.
	/// @return The rotation of the node.
	real_t get_rotation() const;
	/// @brief Set the rotation of the node.
	/// @param value The new rotation of the node.
	void set_rotation(real_t value);

	/// @brief Get the scale of the node.
	/// @return The scale of the node.
	Vector2 get_scale() const;
	/// @brief Set the scale of the node.
	/// @param value The new scale of the node.
	void set_scale(const Vector2 &value);

	/// @brief Get the skew of the node.
	/// @return The skew of the node.
	float get_skew() const;
	/// @brief Set the skew of the node.
	/// @param value The new skew of the node.
	void set_skew(const Variant &value);

	/// @brief Set the 2D transform of the node.
	/// @param value The new 2D transform of the node.
	void set_transform(const Transform2D &value);

	/// @brief Get the 2D transform of the node.
	/// @return The 2D transform of the node.
	Transform2D get_transform() const;

	/// @brief  Duplicate the node.
	/// @return A new Node2D object with the same properties and children.
	Node2D duplicate(int flags = 15) const;

	/// @brief Create a new Node2D object.
	/// @param path The path to the Node2D object.
	/// @return The Node2D object.
	static Node2D Create(std::string_view path);
};
```

## Node3D

```cpp
struct Node3D : public Node {
	/// @brief Construct a Node3D object from an existing in-scope Node object.
	/// @param addr The address of the Node3D object.
	constexpr Node3D(uint64_t addr) : Node(addr) {}
	Node3D(Object obj) : Node(obj) {}
	Node3D(Node node) : Node(node) {}

	/// @brief Construct a Node3D object from a path.
	/// @param path The path to the Node3D object.
	Node3D(std::string_view path) : Node(path) {}

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

	/// @brief Set the 3D transform of the node.
	/// @param value The new 3D transform of the node.
	void set_transform(const Transform3D &value);

	/// @brief Get the 3D transform of the node.
	/// @return The 3D transform of the node.
	Transform3D get_transform() const;

	// TODO:
	// void set_quaternion(const Quaternion &value);
	// Quaternion get_quaternion() const;

	/// @brief  Duplicate the node.
	/// @return A new Node3D object with the same properties and children.
	Node3D duplicate() const;

	/// @brief Create a new Node3D node.
	/// @param path The path to the Node3D node.
	/// @return The Node3D node.
	static Node3D Create(std::string_view path);
};
```

## Vector2

```cpp
struct Vector2 {
	real_t x;
	real_t y;

	float length() const noexcept;
	float length_squared() const noexcept { return x * x + y * y; }
	Vector2 limit_length(double length) const noexcept;

	void normalize() { *this = normalized(); }
	Vector2 normalized() const noexcept;
	float distance_to(const Vector2& other) const noexcept;
	Vector2 direction_to(const Vector2& other) const noexcept;
	float dot(const Vector2& other) const noexcept;
	static Vector2 sincos(float angle) noexcept;
	static Vector2 from_angle(float angle) noexcept;

	Vector2 lerp(const Vector2& to, double weight) const noexcept;
	Vector2 cubic_interpolate(const Vector2& b, const Vector2& pre_a, const Vector2& post_b, double weight) const noexcept;
	Vector2 slerp(const Vector2& to, double weight) const noexcept;

	Vector2 slide(const Vector2& normal) const noexcept;
	Vector2 bounce(const Vector2& normal) const noexcept;
	Vector2 reflect(const Vector2& normal) const noexcept;

	void rotate(real_t angle) noexcept { *this = rotated(angle); }
	Vector2 rotated(real_t angle) const noexcept;

	Vector2 project(const Vector2& vec) const noexcept;
	Vector2 orthogonal() const noexcept { return {y, -x}; }
	float aspect() const noexcept { return x / y; }

	real_t operator [] (int index) const;
	real_t& operator [] (int index);

	METHOD(Vector2, abs);
	METHOD(Vector2, bezier_derivative);
	METHOD(Vector2, bezier_interpolate);
	METHOD(Vector2, ceil);
	METHOD(Vector2, clamp);
	METHOD(Vector2, clampf);
	METHOD(real_t,  cross);
	METHOD(Vector2, cubic_interpolate_in_time);
	METHOD(Vector2, floor);
	METHOD(bool,    is_equal_approx);
	METHOD(bool,    is_finite);
	METHOD(bool,    is_normalized);
	METHOD(bool,    is_zero_approx);
	METHOD(Vector2, max);
	METHOD(Vector2, maxf);
	METHOD(int,     max_axis_index);
	METHOD(Vector2, min);
	METHOD(Vector2, minf);
	METHOD(int,     min_axis_index);
	METHOD(Vector2, move_toward);
	METHOD(Vector2, posmod);
	METHOD(Vector2, posmodv);
	METHOD(Vector2, round);
	METHOD(Vector2, sign);
	METHOD(Vector2, snapped);
	METHOD(Vector2, snappedf);

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
	real_t x;
	real_t y;
	real_t z;

	float length() const noexcept;
	float length_squared() const noexcept { return this->dot(*this); }
	void normalize() { *this = normalized(); }
	Vector3 normalized() const noexcept;
	float dot(const Vector3& other) const noexcept;
	Vector3 cross(const Vector3& other) const noexcept;
	float distance_to(const Vector3& other) const noexcept;
	float distance_squared_to(const Vector3& other) const noexcept;
	float angle_to(const Vector3& other) const noexcept;
	Vector3 direction_to(const Vector3& other) const noexcept;
	Vector3 floor() const noexcept;

	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);

	METHOD(Vector3, abs);
	METHOD(Vector3, bezier_derivative);
	METHOD(Vector3, bezier_interpolate);
	METHOD(Vector3, bounce);
	METHOD(Vector3, ceil);
	METHOD(Vector3, clamp);
	METHOD(Vector3, clampf);
	METHOD(Vector3, cubic_interpolate);
	METHOD(Vector3, cubic_interpolate_in_time);
	METHOD(Vector3, inverse);
	METHOD(bool,    is_equal_approx);
	METHOD(bool,    is_finite);
	METHOD(bool,    is_normalized);
	METHOD(bool,    is_zero_approx);
	METHOD(Vector3, lerp);
	METHOD(Vector3, limit_length);
	METHOD(Vector3, max);
	METHOD(int,     max_axis_index);
	METHOD(Vector3, maxf);
	METHOD(Vector3, min);
	METHOD(int,     min_axis_index);
	METHOD(Vector3, minf);
	METHOD(Vector3, move_toward);
	METHOD(Vector3, octahedron_decode);
	//METHOD(Vector2, octahedron_encode);
	//METHOD(Basis,   outer);
	METHOD(Vector3, posmod);
	METHOD(Vector3, posmodv);
	METHOD(Vector3, project);
	METHOD(Vector3, reflect);
	METHOD(Vector3, rotated);
	METHOD(Vector3, round);
	METHOD(Vector3, sign);
	METHOD(real_t,  signed_angle_to);
	METHOD(Vector3, slerp);
	METHOD(Vector3, slide);
	METHOD(Vector3, snapped);
	METHOD(Vector3, snappedf);

	Vector3& operator += (const Vector3& other);
	Vector3& operator -= (const Vector3& other);
	Vector3& operator *= (const Vector3& other);
	Vector3& operator /= (const Vector3& other);

	bool operator == (const Vector3& other) const;
	bool operator != (const Vector3& other) const;

	constexpr Vector3() : x(0), y(0), z(0) {}
	constexpr Vector3(real_t val) : x(val), y(val), z(val) {}
	constexpr Vector3(real_t x, real_t y, real_t z) : x(x), y(y), z(z) {}

	static Vector3 const ZERO;
	static Vector3 const ONE;
	static Vector3 const LEFT;
	static Vector3 const RIGHT;
	static Vector3 const UP;
	static Vector3 const DOWN;
	static Vector3 const FORWARD;
	static Vector3 const BACK;
};
```

## Vector4

```cpp
struct Vector4 {
	real_t x;
	real_t y;
	real_t z;
	real_t w;

	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);

	METHOD(Vector4, abs);
	METHOD(Vector4, ceil);
	METHOD(Vector4, clamp);
	METHOD(Vector4, clampf);
	METHOD(Vector4, cubic_interpolate);
	METHOD(Vector4, cubic_interpolate_in_time);
	METHOD(Vector4, direction_to);
	METHOD(real_t,  distance_squared_to);
	METHOD(real_t,  distance_to);
	METHOD(real_t,  dot);
	METHOD(Vector4, floor);
	METHOD(Vector4, inverse);
	METHOD(bool,    is_equal_approx);
	METHOD(bool,    is_finite);
	METHOD(bool,    is_normalized);
	METHOD(bool,    is_zero_approx);
	METHOD(real_t,  length);
	METHOD(real_t,  length_squared);
	METHOD(Vector4, lerp);
	METHOD(Vector4, max);
	METHOD(int,     max_axis_index);
	METHOD(Vector4, maxf);
	METHOD(Vector4, min);
	METHOD(int,     min_axis_index);
	METHOD(Vector4, minf);
	METHOD(Vector4, normalized);
	METHOD(Vector4, posmod);
	METHOD(Vector4, posmodv);
	METHOD(Vector4, round);
	METHOD(Vector4, sign);
	METHOD(Vector4, snapped);
	METHOD(Vector4, snappedf);

	Vector4& operator += (const Vector4& other);
	Vector4& operator -= (const Vector4& other);
	Vector4& operator *= (const Vector4& other);
	Vector4& operator /= (const Vector4& other);

	bool operator == (const Vector4& other) const;
	bool operator != (const Vector4& other) const;

	constexpr Vector4() : x(0), y(0), z(0), w(0) {}
	constexpr Vector4(real_t val) : x(val), y(val), z(val), w(val) {}
	constexpr Vector4(real_t x, real_t y, real_t z, real_t w) : x(x), y(y), z(z), w(w) {}
	constexpr Vector4(Vector3 v, real_t w) : x(v.x), y(v.y), z(v.z), w(w) {}
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

	METHOD(Color, blend);
	METHOD(Color, clamp);
	METHOD(Color, darkened);
	METHOD(Color, from_hsv);
	METHOD(Color, from_ok_hsl);
	METHOD(Color, from_rgbe9995);
	METHOD(Color, from_string);
	METHOD(float, get_luminance);
	METHOD(Color, hex);
	METHOD(Color, hex64);
	METHOD(Color, html);
	METHOD(bool, html_is_valid);
	METHOD(Color, inverted);
	METHOD(bool, is_equal_approx);
	METHOD(Color, lerp);
	METHOD(Color, lightened);
	METHOD(Color, linear_to_srgb);
	METHOD(Color, srgb_to_linear);
	METHOD(int, to_abgr32);
	METHOD(int, to_abgr64);
	METHOD(int, to_argb32);
	METHOD(int, to_argb64);
	//METHOD(String, to_html);
	METHOD(int, to_rgba32);
	METHOD(int, to_rgba64);

	Color& operator += (const Color& other);
	Color& operator -= (const Color& other);
	Color& operator *= (const Color& other);
	Color& operator /= (const Color& other);

	Color& operator += (float other);
	Color& operator -= (float other);
	Color& operator *= (float other);
	Color& operator /= (float other);

	bool operator == (const Color& other) const;
	bool operator != (const Color& other) const;

	constexpr Color() : r(0), g(0), b(0), a(0) {}
	constexpr Color(float val) : r(val), g(val), b(val), a(val) {}
	constexpr Color(float r, float g, float b) : r(r), g(g), b(b), a(1) {}
	constexpr Color(float r, float g, float b, float a) : r(r), g(g), b(b), a(a) {}
	Color(std::string_view code);
	Color(std::string_view code, float a);

	static const Color ALICE_BLUE;
	static const Color ANTIQUE_WHITE;
	static const Color AQUA;
	static const Color AQUAMARINE;
	static const Color AZURE;
	static const Color BEIGE;
	static const Color BISQUE;
	static const Color BLACK;
	static const Color BLANCHED_ALMOND;
	static const Color BLUE;
	static const Color BLUE_VIOLET;
	static const Color BROWN;
	static const Color BURLYWOOD;
	static const Color CADET_BLUE;
	static const Color CHARTREUSE;
	static const Color CHOCOLATE;
	static const Color CORAL;
	static const Color CORNFLOWER_BLUE;
	static const Color CORNSILK;
	static const Color CRIMSON;
	static const Color CYAN;
	static const Color DARK_BLUE;
	static const Color DARK_CYAN;
	static const Color DARK_GOLDENROD;
	static const Color DARK_GRAY;
	static const Color DARK_GREEN;
	static const Color DARK_KHAKI;
	static const Color DARK_MAGENTA;
	static const Color DARK_OLIVE_GREEN;
	static const Color DARK_ORANGE;
	static const Color DARK_ORCHID;
	static const Color DARK_RED;
	static const Color DARK_SALMON;
	static const Color DARK_SEA_GREEN;
	static const Color DARK_SLATE_BLUE;
	static const Color DARK_SLATE_GRAY;
	static const Color DARK_TURQUOISE;
	static const Color DARK_VIOLET;
	static const Color DEEP_PINK;
	static const Color DEEP_SKY_BLUE;
	static const Color DIM_GRAY;
	static const Color DODGER_BLUE;
	static const Color FIREBRICK;
	static const Color FLORAL_WHITE;
	static const Color FOREST_GREEN;
	static const Color FUCHSIA;
	static const Color GAINSBORO;
	static const Color GHOST_WHITE;
	static const Color GOLD;
	static const Color GOLDENROD;
	static const Color GRAY;
	static const Color GREEN;
	static const Color GREEN_YELLOW;
	static const Color HONEYDEW;
	static const Color HOT_PINK;
	static const Color INDIAN_RED;
	static const Color INDIGO;
	static const Color IVORY;
	static const Color KHAKI;
	static const Color LAVENDER;
	static const Color LAVENDER_BLUSH;
	static const Color LAWN_GREEN;
	static const Color LEMON_CHIFFON;
	static const Color LIGHT_BLUE;
	static const Color LIGHT_CORAL;
	static const Color LIGHT_CYAN;
	static const Color LIGHT_GOLDENROD;
	static const Color LIGHT_GRAY;
	static const Color LIGHT_GREEN;
	static const Color LIGHT_PINK;
	static const Color LIGHT_SALMON;
	static const Color LIGHT_SEA_GREEN;
	static const Color LIGHT_SKY_BLUE;
	static const Color LIGHT_SLATE_GRAY;
	static const Color LIGHT_STEEL_BLUE;
	static const Color LIGHT_YELLOW;
	static const Color LIME;
	static const Color LIME_GREEN;
	static const Color LINEN;
	static const Color MAGENTA;
	static const Color MAROON;
	static const Color MEDIUM_AQUAMARINE;
	static const Color MEDIUM_BLUE;
	static const Color MEDIUM_ORCHID;
	static const Color MEDIUM_PURPLE;
	static const Color MEDIUM_SEA_GREEN;
	static const Color MEDIUM_SLATE_BLUE;
	static const Color MEDIUM_SPRING_GREEN;
	static const Color MEDIUM_TURQUOISE;
	static const Color MEDIUM_VIOLET_RED;
	static const Color MIDNIGHT_BLUE;
	static const Color MINT_CREAM;
	static const Color MISTY_ROSE;
	static const Color MOCCASIN;
	static const Color NAVAJO_WHITE;
	static const Color NAVY_BLUE;
	static const Color OLD_LACE;
	static const Color OLIVE;
	static const Color OLIVE_DRAB;
	static const Color ORANGE;
	static const Color ORANGE_RED;
	static const Color ORCHID;
	static const Color PALE_GOLDENROD;
	static const Color PALE_GREEN;
	static const Color PALE_TURQUOISE;
	static const Color PALE_VIOLET_RED;
	static const Color PAPAYA_WHIP;
	static const Color PEACH_PUFF;
	static const Color PERU;
	static const Color PINK;
	static const Color PLUM;
	static const Color POWDER_BLUE;
	static const Color PURPLE;
	static const Color REBECCA_PURPLE;
	static const Color RED;
	static const Color ROSY_BROWN;
	static const Color ROYAL_BLUE;
	static const Color SADDLE_BROWN;
	static const Color SALMON;
	static const Color SANDY_BROWN;
	static const Color SEA_GREEN;
	static const Color SEASHELL;
	static const Color SIENNA;
	static const Color SILVER;
	static const Color SKY_BLUE;
	static const Color SLATE_BLUE;
	static const Color SLATE_GRAY;
	static const Color SNOW;
	static const Color SPRING_GREEN;
	static const Color STEEL_BLUE;
	static const Color TAN;
	static const Color TEAL;
	static const Color THISTLE;
	static const Color TOMATO;
	static const Color TRANSPARENT;
	static const Color TURQUOISE;
	static const Color VIOLET;
	static const Color WEB_GRAY;
	static const Color WEB_GREEN;
	static const Color WEB_MAROON;
	static const Color WEB_PURPLE;
	static const Color WHEAT;
	static const Color WHITE;
	static const Color WHITE_SMOKE;
	static const Color YELLOW;
	static const Color YELLOW_GREEN;
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

	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);

	METHOD(Basis,  from_euler);
	METHOD(Basis,  from_scale);
	METHOD(Vector3, get_euler);
	VMETHOD(get_rotation_quaternion);
	METHOD(Vector3, get_scale);
	METHOD(bool,   is_conformal);
	METHOD(bool,   is_equal_approx);
	METHOD(bool,   is_finite);
	METHOD(Basis,  looking_at);
	METHOD(Basis,  orthonormalized);
	METHOD(Basis,  scaled);
	METHOD(real_t, tdotx);
	METHOD(real_t, tdoty);
	METHOD(real_t, tdotz);
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

	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);

	METHOD(Transform2D, affine_inverse);
	METHOD(Vector2, basis_xform);
	METHOD(Vector2, basis_xform_inv);
	METHOD(real_t,  determinant);
	METHOD(Vector2, get_origin);
	METHOD(real_t,  get_rotation);
	METHOD(Vector2, get_scale);
	METHOD(real_t,  get_skew);
	METHOD(bool,    is_conformal);
	METHOD(bool,    is_equal_approx);
	METHOD(bool,    is_finite);
	METHOD(Transform2D, looking_at);
	METHOD(Transform2D, rotated_local);
	METHOD(Transform2D, scaled_local);
	METHOD(Transform2D, translated_local);
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

	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);

	METHOD(Transform3D, affine_inverse);
	METHOD(bool, is_equal_approx);
	METHOD(bool, is_finite);
};
```

## Plane

```cpp
struct Plane {
	Vector3 normal = Vector3(0, 1, 0);
	real_t d = 0.0f;

	void set_normal(const Vector3 &p_normal) { normal = p_normal; }
	const Vector3 &get_normal() const { return normal; }

	Vector3 center() const { return normal * d; }
	Vector3 get_any_perpendicular_normal() const;

	bool is_point_over(const Vector3 &p_point) const { return normal.dot(p_point) > d; }
	real_t distance_to(const Vector3 &p_point) const { return normal.dot(p_point) - d; }
	bool has_point(const Vector3 &p_point, real_t p_tolerance = 0.00001f) const;

	Vector3 project(const Vector3 &p_point) const;

	bool operator==(const Plane &p_plane) const;
	bool operator!=(const Plane &p_plane) const;

	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);

	constexpr Plane() {}
	constexpr Plane(real_t p_a, real_t p_b, real_t p_c, real_t p_d);
	constexpr Plane(const Vector3 &p_normal, real_t p_d = 0.0);
	Plane(const Vector3 &p_normal, const Vector3 &p_point);
	Plane(const Vector3 &p_point1, const Vector3 &p_point2, const Vector3 &p_point3, ClockDirection p_dir = CLOCKWISE);
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

	template <typename... Args>
	Variant operator () (std::string_view method, Args&&... args);

	METHOD(Quaternion, from_euler);
	METHOD(Vector3,    get_euler);
	METHOD(bool,       is_equal_approx);
	METHOD(bool,       is_finite);
	METHOD(Quaternion, spherical_cubic_interpolate);
	METHOD(Quaternion, spherical_cubic_interpolate_in_time);
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

## Resources

```cpp
/// @brief Load a resource (at run-time) from the given path. Can be denied.
/// @param path The path to the resource.
/// @return The loaded resource.
template <typename T = Resource>
T load(std::string_view path);
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

	template <typename T>
	static T instantiate(std::string_view class_name, std::string_view name = "");
};
```

## Timer

```cpp
struct CallbackTimer {
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

## Godot classes

Every Godot class not shown in this reference is auto-generated at run-time and will have every property, method and constant generated. Even classes from loaded extensions.

The API is generated on first save, and if you open it you will see that it matches the official documentation, hence there is no need to document anything further here.

The only thing worth mentioning is that all classes in the sandbox are references on host, but proxies in the guest. Pass them by value, `get_singleton()` returns a class directly etc:

```cpp
Time time = Time::get_singleton();

static void my_function(CanvasItem item) {
}
```
