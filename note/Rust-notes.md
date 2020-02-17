Notes for Rust
----

## Key Features

### 1. Variables are immutable by default
* Rust encourages you to favor immutability.  
	> Trade-off: mutating an instance in place may be faster tan copying and returning newly allocated instances.  
* Once a value is bound to a name, you cannot change that value. (Compiler supporting the check.) This feature prevent modifying read-only variables.  
* If a variable is used in entire time of a program runs, it can be declared as constants with `const`.

##### Questions
* <font color="red">How to prevent other programs to modify mutable variables?</font>  
* <font color="red">Can it prevent side channel attacks?</font>

### 2. Shadowing
* A variable can be shadowed by using the same variable's name and repeating the use of `let`.  
* The type of variable `let mut` cannot mute the type.  
* With shadowing, `let old_var = ---` can assign new type.  

### 3. Ownership
* There are three methods to manage memory:
	1. Some languages have garbage collection that constantly looks for no longer used memory.  
	2. Some languages must explicitly allocate and free the memory.  
	3. **Rust uses a third approach: memory is managed through a system of ownership with a set of rules that the compiler checks at compile time.**  
* In most languages, we don't have to think about the stack and the heap very often. But in a systems programming language like Rust, **whether a value is on the stack or the heap has more of an effect on how the language behaves.**  
> Pushing to the stack is faster than allocating on the heap because the OS never has to search for a place to store new data.   
> Accessing data is the heap is slower than on the stack.    
* <font color="red">Ownership Rules</font>  
	1. Each value in Rust has a variable that is called its owner.
	2. There can only be one owner at a time.
	3. When the owner goes out of scope, the value will be dropped.  
* String
	* In the case of a string literal, we know the contents at compile time, so the text is hardcoded directly into the final executable.  
	* With the String type, in order to support a mutable, growable piece of text, we need to allocate an amount of memory on the heap, unknown at compile time, to hold the contents.
		1. The memory must be requested from the operating system at runtime.  
		2. We need a way of returning this memory to the operating system when we’re done with our String.
		> Garbage Collection (GC): keeps track and cleans up memory that is not being used anymore.  
		> As for Rust, the memory is automatically returned once the variable that owns it goes out of scope.

* As for general type as following. Both `x` and `y` have fixed size, and these two values are pushed onto the stack.
```rust
let x = 5;
let y = x
```
* As for `String`, it is made up of three parts: a pointer to the memory that holds the contents of the string, a length and a capacity. This group of data is stored on the stack. While the contents are hold on the heap. When we assign `s1` to `s2`, the `String` data on stack is copied, but the data on the heap is not copied for its expensive overhead.  
```rust
let s1 = String::from("hello");
let s2 = s1; // move operation
```
> <font color="red">It should be noted that Rust automatically calls the `drop` function and cleans up the heap memory when either of them goes out of scope. When both of them go out of scope, there will be *double free error*.</font> To ensure memory safety, Rust considers `s1` to no longer be valid and does not need to free anything when `s1` goes out of scope. <font color="red">If we try to use `s1` after `s2` is created, it won't work.</font> It is not `shadow copy` or `deep copy`, it actually is `move`.

* If we do want to deeply copy the `String`, we can use the method called `clone`.
```rust
let s1 = String::from("hello");
let s2 = s1.clone();

println!("s1 = {}, s2 = {}", s1, s2);
```
* Ownership and Functions
```rust
fn main() {
    let s = String::from("hello");  // s comes into scope

    takes_ownership(s);             // s's value moves into the function...
                                    // ... and so is no longer valid here

    let x = 5;                      // x comes into scope

    makes_copy(x);                  // x would move into the function,
                                    // but i32 is Copy, so it’s okay to still
                                    // use x afterward

} // Here, x goes out of scope, then s. But because s's value was moved, nothing
  // special happens.

fn takes_ownership(some_string: String) { // some_string comes into scope
    println!("{}", some_string);
} // Here, some_string goes out of scope and `drop` is called. The backing
  // memory is freed.

fn makes_copy(some_integer: i32) { // some_integer comes into scope
    println!("{}", some_integer);
} // Here, some_integer goes out of scope. Nothing special happens.
```

* References and borrowing
```rust
fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);
    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {	// &String, rather than String. It is a reference, but not own s1.
    s.len()
}
```
	* We call having references as function parameters borrowing.   
	* Just as variables are immutable by default, so are references. We’re not allowed to modify something we have a reference to.  
```rust
fn main() {
    let s = String::from("hello");

    change(&s);
}

fn change(some_string: &String) {
    some_string.push_str(", world"); // Error.. cannot borrow as mutable
}
```

* Mutable References
```rust
fn main() {
    let mut s = String::from("hello");

    change(&mut s);
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}
```
	* Mutable references have one big restriction (not applied to immutable references): you can have only one mutable reference to a particular piece of data in a particular scope. Furthermore, we also cannot have a mutable reference while we have an immutable one.  
	* **The benefit of having this restriction is that Rust can prevent data races at compile time. A data race is similar to race condition and happens when these three behaviors occur:**
		* Two or more pointers access the same data at the same time.
		* At least one of the pointers is being used to write to the data.
		* There's no mechanism being used to synchronize access to the data.
		> <font color="red">What are the benefits?</font>  
		> Data races cause undefined behavior and can be difficult to diagnose and fix when you are trying to track them down at runtime; Rust prevents this problem from happening because it won't even compile code with data races!
```rust
let mut s = String::from("hello");

let r1 = &mut s;
let r2 = &mut s; 	// Error.. second mutable borrow.

println!("{}, {}", r1, r2);
```

* **We can use curly brackets to create a new scope, allowing for multiple mutable references, just not simultaneous ones:**
```rust
fn main() {
let mut s = String::from("hello");
{
    let r1 = &mut s;
} // r1 goes out of scope here, so we can make a new reference with no problems.
let r2 = &mut s;
}
```
> <font color="red">What is the function of scope?</font>

* **Not that a reference's scope starts from where it is introduced and continues through the last time that reference is used. For instance, this code will compile because the last usage of the immutable references occurs before the mutable reference is introduced.**  
```rust
let mut s = String::from("hello");

let r1 = &s; // no problem
let r2 = &s; // no problem
println!("{} and {}", r1, r2);
// r1 and r2 are no longer used after this point

let r3 = &mut s; // no problem
println!("{}", r3);
```

* Dangling References
	* In languages with pointers. It is easy to erroneously create a dangling pointer, a pointer that references a location in memory that may have been given to someone else, be freeing some memory with preserving a pointer to that memory. In Rust, by contrast, the compiler guarantees that references will never be dangling references: if you have a reference to some data, the compiler will ensure that the data will not go out of scope before the reference to the data does.
```rust
fn main() {
    let reference_to_nothing = dangle();
    // Error in compile time because the life od `s` is finished.
}

fn dangle() -> &String { // dangle returns a reference to a String

    let s = String::from("hello"); // s is a new String

    &s // we return a reference to the String, s
} // Here, s goes out of scope, and is dropped. Its memory goes away.
  // Danger!
```

	* The solution here is to return the String directly.
```rust
fn no_dangle() -> String {
    let s = String::from("hello");
    s // Ownership is moved out, and nothing is deallocated.
}
```

### Lifetimes
* Every reference has a lifetime, which is a scope for which that reference is valid. **Most of the time, lifetimes are implicit and inferred.**

#### Preventing Dangling References with Lifetimes
##### The Borrow Checker
* The Rust compiler has a borrow checker that compares scopes to determine whether all borrows are valid.
* Annotate the lifetime of `r` with `'a` and `x` with `'b`. The program is reject because `'b` is shorter than `'a`: the subject of the reference does not live as long as the reference.
```rust
{
    let r; // no init val // ---------+-- 'a
    {                     //          |
        let x = 5;        // -+-- 'b  |
        r = &x;           //  |       |
    } // 'x' is dropped   // -+       |
    println!("r: {}", r); //          |
} // It uses a borrow checker to make sure 'r' wouldn't reference the deallocated 'x'.
```

##### Generic Lifetimes in Functions
* For example, we want to get the longer string from two strings.
* Note that we want the function to take string slices, which are references, because we don't want the `longest` function to take the ownership.
```rust
fn longest(x: &str, y: &str) -> &str { // return the longer string
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";

    let result = longest(string1.as_str(), string2);
    println!("The longest string is {}", result);
}
```
* The piece of code will result in an error. Because we don't know which string will be returned, either 'x' or 'y'. The borrow checker cannot determine this either.
* To fix this error, we will **add generic lifetime parameters** that define the relationship between the references so the borrow checker can perform its analysis.

##### Lifetime Annotation Syntax
* Lifetime annotations do not change the actual lifetime. Functions can accept references with any lifetime by specifying a generic lifetime parameter.
* Lifetime parameters starts with an apostrophe(`'`) and is placed after the `&` of a reference, using a space to separate the annotation from the reference's type. For example,..
```rust
&i32        // a reference
&'a i32     // a reference with an explicit lifetime
&'a mut i32 // a mutable reference with an explicit lifetime
```
* **The annotations are meant to tell Rust how generic lifetime parameters of multiple references relate to each other.**

##### Lifetime Annotation in Function Signatures
* The constraint we want to express is that all the references in the parameters and the return value must have the same lifetime.
```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```
* In practice, it means that the lifetime of the reference returned by the `longest` function is the same as the smaller of the lifetimes of the references passed in.
* <font color="red"> Why must inform the lifetime?</font>
    * The lifetime annotation is to specify the borrow checker should reject any values that don't adhere to these constants.
    * When a function has references to or from code outside that function, it becomes almost impossible for Rust to figure out the lifetimes of the parameters or return values on its own. The lifetimes might be different each time the function is called. This is why we need to annotate the lifetime manually.

* Let's look at how the lifetime annotations restrict the `longest` function by passing in references that have different concrete lifetimes.
```rust
fn main() {
    let string1 = String::from("long string is long");
    {
        let string2 = String::from("xyz");
        let result = longest(string1.as_str(), string2.as_str());
        println!("The longest string is {}", result);
    }
}
```

* **Error Example:** Let's try an example that shows that the lifetime of the reference in `result` must be the smaller lifetime of the two arguments.
```rust
fn main() {
    let string1 = String::from("long string is long");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
    }
    println!("The longest string is {}", result);
    // Error... string2 is shorter than string1. string2 is not long enough.
}
```

##### Thinking in Terms of Lifetimes
* If one function always returns the first parameter rather than the longest string slice, we wouldn't need to specify a lifetime on the second parameter.
```rust
fn longest<'a>(x: &'a str, y: &str) -> &'a str {
    x
}
```

* The lifetime parameter for the return type needs to match the lifetime of one of the parameters.
* There is no way we can specify lifetime parameters that would change the dangling reference, and Rust won't let us create a dangling reference.
```rust
fn longest<'a>(x: &str, y: &str) -> &'a str {
    let result = String::from("really long string");
    result.as_str()
} // 'result' goes out of scope and gets cleaned up.  Error.
```

* Ultimately, lifetime syntax is about connecting the lifetimes of various parameters and return values of functions.
> <font color="red">Prevent dangling reference from function.</font>  
> <font color="red">How to prevent use after free?</font> If there is no initial value, cannot use.

##### Lifetime Annotation in Struct Definitions
* If a struct hos references, we should add a lifetime annotation on every reference in the struct's definition.
```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.')
        .next()
        .expect("Could not find a '.'");
    let i = ImportantExcerpt { part: first_sentence };
}
```
* An instance of `ImportantExcerpt` can't outlive the reference it holds in its `part` field.

##### Lifetime Elision
```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```
* In early version (pre-1.0) of Rust, this code wouldn't have compiled because every reference needed an explicit lifetime. At that time, the function signature have been written like this:
```rust
fn first_word<'a>(s: &'a str) -> &'a str {
```
* Rust team found that Rust programmers were entering the same lifetime annotation over and over in particular situations. These situations were predictable and followed a few deterministic patterns. **The developers programmed these patterns into the compiler’s code so the borrow checker could infer the lifetimes in these situations and wouldn’t need explicit annotations.**
* The patterns programmed into Rust's analysis of references are called the `lifetime elision rules`.

* Lifetimes on function or method parameters are called `input lifetimes`, and lifetimes on return values are called `output lifetimes`.

* There are three rules when there are no explicit annotations.
    1. Each parameter that is a reference gets its own lifetime parameter. In other words, a parameter gets one lifetime parameter.
    2. If there is only one input lifetime parameter, the lifetime is assigned to output lifetime.
    3. If there are multiple input lifetime parameters, but one of them is `&self` or `&mut self` because this is a method, the lifetime of `self` is assigned to all output lifetime parameters.  
    > If the compiler gets to the end of the three rules and there are still references for which it cannot figure out lifetimes, the compiler will stop with an error.
* There are two good [examples](https://doc.rust-lang.org/stable/book/ch10-03-lifetime-syntax.html#lifetime-elision).

##### Lifetime Annotation in Method Definitions
* [Not Read](https://doc.rust-lang.org/stable/book/ch10-03-lifetime-syntax.html#lifetime-annotations-in-method-definitions)

##### The Static Lifetime
* One special lifetime we need to discuss is `'static`, which means that this reference can live for the entire duration of the program.

##### Generic Type Parameters, Trait Bounds, and Lifetimes Together
* [Not Read](https://doc.rust-lang.org/stable/book/ch10-03-lifetime-syntax.html#generic-type-parameters-trait-bounds-and-lifetimes-together)


### Fearless Concurrency
* By leveraging ownership and type checking,many concurrency errors are compile-time errors in Rust rather than runtime errors. 
* Here are the topics we will cover in this chapter:
    * How to create threads to run multiple pieces of code at the same time
    * *Message-passing concurrency*, where channels send messages between threads
    * *Shared-state concurrency*, where multiple threads have access to some piece of data.
    * The `Sync` and `Send` traits, which extend Rust's concurrency guarantees to user-defined types as well as types provided by the standard library.

### [Packages and Crates](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html)
* To be updated.

### [Unsafe Rust](https://doc.rust-lang.org/book/ch19-01-unsafe-rust.html)
* All the code we've discussed so far had Rust's memory safety guarantees enforced at compile time. However, Rust has a second language hidden inside it that does not enforce these memory safety guarantees: it's called *unsafe Rust* and works just like regular Rust, but gives us **extra superpowers**.
* `Unsafe Rust exists because, by nature, static analysis is conservative.` When the compiler tries to determine whether or not code upholds the guarantees, it is better for it to reject some valid programs rather than accept some invalid programs. As far as Rust is able to tell, it's not.
* Another reason Rust has an unsafe alter ego is that the underlying computer hardware is inherently unsafe.

* **Unsafe Superpowers**
    * Use the `unsafe` keyword and then start a new block that holds the unsafe code.
    * You can take four actions in unsafe Rust, called *unsafe superpowers*, that you can't in safe Rust. Those superpowers include the ability to:
        * Dereference a raw pointer
            * You can give up guaranteed safety in exchanging for greater performance or the ability to interface with another language or hardware where Rust's guarantees don't apply.
        * Call an unsafe functions or method
        * Access or modify a mutable static variable
        * Implement an unsafe trait
        * Access fields of `union`S
        > Details are described in [Umsafe Rust](https://doc.rust-lang.org/book/ch19-01-unsafe-rust.html)
    * `unsafe` doesn't turn off the borrow checker. You still get some degree of safety inside of an unsafe block.
    * `unsafe` doesn't mean the code inside the block will definitely have memory safety problems: the intent is that as a programmer, you will ensure the code inside an `unsafe` block will access memory in a valid way.
    * **Because mistakes will happen, but by requiring these four unsafe operations to be inside blocks annotated with `unsafe` you will know that any errors related to memory safety must be within an `unsafe` block.** Keep `unsafe` blocks small; you will be thankful later when you investigate memory bugs.
    * To isolate unsafe code as much as possible, it's best to enclose unsafe code within a safe abstraction and provide a safe API. **Wrapping unsafe code in a safe abstraction prevents uses of `unsafe` from leaking out into all the places that you or your users might want to use the functionality implemented with `unsafe` code**, because using a safe abstraction is safe.
* When you have a reason to use `unsafe` code, you can do so, and having the explicit `unsafe` annotation makes it easier to track down the resource of problems if they occur.

### The Slice Type
* Another data type that does not have ownership is the slice. **Slice let you reference a contiguous sequence of elements in a collection rather than the whole collection.**  
```rust
let s = String::from("hello world");

let hello = &s[0..5];		// A reference. The slice data structure stores the starting position and the length of the slice.
let world = &s[6..11];
```
* Example:
```rust
fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&s);
    s.clear(); // error!

    println!("the first word is: {}", word);
}

fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```
	* Recall from the borrowing rules that if we have an immutable reference to something, we cannot also take a mutable reference. Because `clear` needs to truncate the `String`, it needs to get a mutable reference. Rust disallows this, and compilation fails.



### Others
* Tuple type.  
```rust
fn main() {
    let x: (i32, f64, u8) = (500, 6.4, 1);

    let five_hundred = x.0;
    let six_point_four = x.1;
    let one = x.2;
}
```

* Rust doesn’t care where you define your functions, only that they’re defined somewhere.  
