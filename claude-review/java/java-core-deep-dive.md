# ☕ Java Core — Deep Dive Study Guide
>
> Based on [roadmap.sh/java](https://roadmap.sh/java) | Every concept explained in depth with examples, pitfalls, and internals

---

## 📚 Table of Contents

1. [Learn the Basics](#1-learn-the-basics)
2. [Object-Oriented Programming](#2-object-oriented-programming)
3. [More About OOP](#3-more-about-oop)
4. [Exception Handling](#4-exception-handling)
5. [Lambda Expressions & Functional Programming](#5-lambda-expressions--functional-programming)
6. [Annotations](#6-annotations)
7. [Modules](#7-modules)
8. [Optionals](#8-optionals)
9. [Collections Framework](#9-collections-framework)
10. [Concurrency](#10-concurrency)
11. [Cryptography](#11-cryptography)
12. [Date and Time](#12-date-and-time)
13. [Networking](#13-networking)
14. [Regular Expressions](#14-regular-expressions)
15. [Dependency Injection](#15-dependency-injection)
16. [I/O Operations](#16-io-operations)
17. [File Operations](#17-file-operations)

---

# 1. Learn the Basics

> 📖 <https://docs.oracle.com/javase/tutorial/java/nutsandbolts/index.html>

---

## 1.1 Basic Syntax

### How Java Actually Works Under the Hood

```
YourCode.java  →[javac]→  YourCode.class (bytecode)  →[JVM]→  Native Machine Code
```

The JVM does **two things** to run bytecode:

- **Interpreter**: reads bytecode line by line (slow startup, starts immediately)
- **JIT Compiler** (Just-In-Time): detects "hot" frequently-run code and compiles it to native machine code at runtime (fast after warmup)

This is why Java is fast despite being "interpreted" — the JIT makes long-running servers extremely performant.

### Anatomy of a Java Program

```java
package com.myapp;                  // 1. Package declaration (optional, must be first)

import java.util.List;              // 2. Imports
import java.util.ArrayList;

public class MyClass {              // 3. Class (filename must be MyClass.java)

    // 4. Fields (class-level variables)
    private String name;
    private static int instanceCount = 0;

    // 5. Constructor
    public MyClass(String name) {
        this.name = name;
        instanceCount++;
    }

    // 6. Methods
    public String getName() {
        return name;
    }

    // 7. Entry point — JVM looks for exactly this signature
    public static void main(String[] args) {
        MyClass obj = new MyClass("Hello");
        System.out.println(obj.getName());
    }
}
```

### Naming Conventions (MUST follow — Java culture)

| Element | Convention | Example |
|---------|-----------|---------|
| Class | PascalCase | `BankAccount`, `OrderService` |
| Interface | PascalCase | `Comparable`, `Runnable` |
| Method | camelCase | `getUserName()`, `calculateTotal()` |
| Variable | camelCase | `firstName`, `totalAmount` |
| Constant | UPPER_SNAKE_CASE | `MAX_SIZE`, `DEFAULT_TIMEOUT` |
| Package | lowercase | `com.company.project` |

---

## 1.2 Lifecycle of a Program

### JVM Architecture (Important for Interviews!)

```
┌────────────────────────────────────────────────────┐
│                    JVM                             │
│  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Class Loader│  │       Runtime Data Areas   │ │
│  │  - Bootstrap │  │  ┌──────────┐ ┌─────────┐  │ │
│  │  - Extension │  │  │  Heap    │ │  Stack  │  │ │
│  │  - App       │  │  │(Objects) │ │(Frames) │  │ │
│  └──────────────┘  │  └──────────┘ └─────────┘  │ │
│                    │  ┌──────────┐ ┌─────────┐  │ │
│  ┌──────────────┐  │  │ Metaspace│ │   PC    │  │ │
│  │  Execution   │  │  │(Classes) │ │Register │  │ │
│  │  Engine      │  │  └──────────┘ └─────────┘  │ │
│  │  - JIT       │  └────────────────────────────┘ │
│  │  - GC        │                                  │
│  └──────────────┘                                  │
└────────────────────────────────────────────────────┘
```

**Memory Areas:**

- **Heap**: where ALL objects and arrays live. Shared across threads. GC manages this.
- **Stack**: one per thread. Stores method call frames (local variables, return address).
- **Metaspace** (Java 8+): stores class metadata, method bytecode, static variables.
- **PC Register**: tracks current instruction being executed per thread.

### Class Loading Process

```java
// When you write: MyClass obj = new MyClass();
// The JVM does:
// 1. Loading    — reads MyClass.class bytecode from disk/network
// 2. Linking
//    a. Verification — checks bytecode is valid and safe
//    b. Preparation  — allocates memory for static fields, sets defaults
//    c. Resolution   — resolves symbolic references to actual memory addresses
// 3. Initialization — runs static initializer blocks and static field assignments
// 4. Instantiation  — allocates object on heap, calls constructor
```

---

## 1.3 Data Types

### Primitive Types — Memory and Range Details

```java
byte   b = 127;           // 8-bit  signed: -128 to 127
short  s = 32767;         // 16-bit signed: -32,768 to 32,767
int    i = 2147483647;    // 32-bit signed: -2^31 to 2^31-1 (≈ 2.1 billion)
long   l = 9999999999L;   // 64-bit signed: -2^63 to 2^63-1  ← note the L suffix
float  f = 3.14f;         // 32-bit IEEE 754 floating point   ← note the f suffix
double d = 3.14159265358; // 64-bit IEEE 754 (default decimal type)
char   c = 'A';           // 16-bit Unicode: '\u0000' to '\uFFFF'
boolean flag = true;      // true or false (size is JVM-dependent)
```

### The Floating Point Trap ⚠️

```java
// WRONG assumption:
System.out.println(0.1 + 0.2);      // prints 0.30000000000000004 !!!
System.out.println(0.1 + 0.2 == 0.3); // prints false !!!

// WHY: float/double use binary fractions — 0.1 has no exact binary representation
// SOLUTION for money/precision: use BigDecimal
import java.math.BigDecimal;
BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));           // 0.3 ✅
System.out.println(a.add(b).compareTo(new BigDecimal("0.3")) == 0); // true ✅

// Never use new BigDecimal(0.1) — use String constructor!
new BigDecimal(0.1);    // 0.1000000000000000055511... ← wrong!
new BigDecimal("0.1");  // 0.1 ← correct!
```

### Autoboxing and Unboxing

```java
// Primitives have Wrapper classes for use in Collections/Generics
int     → Integer
long    → Long
double  → Double
boolean → Boolean
char    → Character
// etc.

// Autoboxing: primitive → wrapper (done automatically)
Integer x = 42;        // compiler: Integer x = Integer.valueOf(42)

// Unboxing: wrapper → primitive (done automatically)
int y = x;             // compiler: int y = x.intValue()

// ⚠️ Pitfall: NullPointerException with unboxing
Integer nullInt = null;
int val = nullInt;     // NullPointerException! Can't unbox null

// ⚠️ Pitfall: Integer cache (-128 to 127)
Integer a = 127;
Integer b = 127;
System.out.println(a == b);    // true! (same cached object)

Integer c = 128;
Integer d = 128;
System.out.println(c == d);    // false! (different objects)
System.out.println(c.equals(d)); // true ✅ always use equals() for objects
```

---

## 1.4 Variables and Scopes

### All Variable Types in Java

```java
public class ScopeDemo {

    // 1. Class/Static variable — one copy, shared across all instances
    static int instanceCount = 0;

    // 2. Instance variable — one copy per object, lives on heap
    String name;
    int age;

    public void method(String param) {  // 3. Parameter — scoped to method
        int local = 10;                 // 4. Local variable — scoped to method block

        for (int i = 0; i < 5; i++) {  // 5. Loop variable — scoped to loop
            int inner = i * 2;         // 6. Block variable — scoped to {}
        }
        // inner and i are NOT accessible here
    }
}
```

### var — Local Variable Type Inference (Java 10+)

```java
// var lets the compiler infer the type — only for local variables
var name = "Khang";              // inferred as String
var list = new ArrayList<String>(); // inferred as ArrayList<String>
var map = new HashMap<String, Integer>(); // inferred as HashMap<String, Integer>

// ❌ Cannot use var for:
var field;                       // class fields — not allowed
public var method() { }          // return types — not allowed
var nothing = null;              // null — type can't be inferred

// ✅ Great for reducing verbosity
// Before:
Map<String, List<Integer>> scores = new HashMap<String, List<Integer>>();
// After:
var scores = new HashMap<String, List<Integer>>();
```

---

## 1.5 Type Casting

### Widening vs Narrowing

```java
// Widening Conversion (implicit, safe — no data loss)
// byte → short → int → long → float → double
byte  b = 42;
short s = b;    // byte → short (auto)
int   i = s;    // short → int (auto)
long  l = i;    // int → long (auto)
float f = l;    // long → float (auto) ← NOTE: may lose precision for large longs!
double d = f;   // float → double (auto)

// Narrowing Conversion (explicit, may lose data)
double pi = 3.99999;
int truncated = (int) pi;      // 3 (decimal part dropped, not rounded!)
long big = 1234567890123L;
int small = (int) big;         // data loss / wrap-around result

// char ↔ int casting
char ch = 'A';
int ascii = ch;                // 65 (widening)
char back = (char) 66;        // 'B' (narrowing)
```

### Casting Objects (Reference Types)

```java
Animal animal = new Dog();    // upcasting — always safe (implicit)

// Downcasting — need explicit cast, may fail at runtime
Dog dog = (Dog) animal;       // fine if the object IS actually a Dog

// ⚠️ ClassCastException if wrong type
Animal cat = new Cat();
Dog dog2 = (Dog) cat;         // ClassCastException at runtime!

// Safe way: check with instanceof BEFORE casting
if (animal instanceof Dog d) {      // Java 16+ pattern matching
    d.bark();                        // d is already cast!
} else if (animal instanceof Cat c) {
    c.meow();
}

// Old way (pre Java 16)
if (animal instanceof Dog) {
    Dog d = (Dog) animal;
    d.bark();
}
```

---

## 1.6 Strings and Methods

### String Internals — The String Pool

```java
// String literals go to the String Pool (inside Heap since Java 7)
String a = "hello";
String b = "hello";
System.out.println(a == b);       // true! Same object in pool

// new String() bypasses the pool
String c = new String("hello");
String d = new String("hello");
System.out.println(c == d);       // false! Different objects on heap
System.out.println(c.equals(d));  // true! Same content

// intern() — adds to pool or returns existing pool reference
String e = c.intern();
System.out.println(a == e);       // true!
```

### String Immutability

```java
String s = "Hello";
s.toUpperCase();           // returns NEW string, original unchanged
System.out.println(s);     // still "Hello"

String upper = s.toUpperCase();  // must capture the result!
System.out.println(upper); // "HELLO"

// WHY immutability?
// 1. Thread-safe — can share across threads without synchronization
// 2. String pool works — multiple refs can safely point to same object
// 3. Security — passwords, file paths can't be modified
// 4. Good hash key — hashCode never changes
```

### StringBuilder vs StringBuffer vs String

```java
// String — immutable, creates new object on every concat
String result = "";
for (int i = 0; i < 1000; i++) {
    result += i;  // creates 1000 intermediate String objects! ⚠️ SLOW
}

// StringBuilder — mutable, NOT thread-safe, FAST
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);    // modifies same buffer
}
String fast = sb.toString();

// StringBuffer — mutable, thread-safe (synchronized), slightly SLOWER
StringBuffer sbuf = new StringBuffer();
sbuf.append("thread-safe");

// StringBuilder methods:
sb.append("text");         // add to end
sb.insert(0, "start");     // insert at index
sb.delete(0, 5);           // remove range
sb.reverse();              // reverse content
sb.replace(0, 3, "new");   // replace range
sb.toString();             // convert to String
sb.length();               // current length
sb.charAt(0);              // char at index
sb.indexOf("text");        // find substring
```

### All Important String Methods

```java
String s = "  Hello, World!  ";

// Length and access
s.length();              // 17
s.charAt(2);             // 'H'
s.indexOf("World");      // 9 (first occurrence, -1 if not found)
s.lastIndexOf("l");      // 14

// Trimming and cleaning
s.trim();                // "Hello, World!" (removes leading/trailing whitespace)
s.strip();               // Java 11+, also handles Unicode whitespace
s.stripLeading();        // "Hello, World!  "
s.stripTrailing();       // "  Hello, World!"

// Case
s.toUpperCase();         // "  HELLO, WORLD!  "
s.toLowerCase();         // "  hello, world!  "

// Testing
s.contains("World");     // true
s.startsWith("  He");    // true
s.endsWith("!  ");       // true
s.isEmpty();             // false (length > 0)
s.isBlank();             // false (Java 11+, checks if all whitespace)
"   ".isBlank();         // true

// Extraction
s.substring(7);          // "World!  " (from index to end)
s.substring(7, 12);      // "World" (from 7 to 12 exclusive)

// Modification (returns new String!)
s.replace(',', ';');                 // replaces all char occurrences
s.replace("Hello", "Hi");           // replaces literal string
s.replaceAll("\\s+", " ");          // replaces with regex
s.replaceFirst("l", "L");           // replaces first match

// Splitting
"a,b,c".split(",");                 // ["a", "b", "c"]
"a,b,c".split(",", 2);             // ["a", "b,c"] (limit splits)

// Joining
String.join("-", "a", "b", "c");    // "a-b-c"
String.join(", ", List.of("x","y")); // "x, y"

// Formatting
String.format("Name: %s, Age: %d, Score: %.2f", "Khang", 21, 9.8);
"Name: %s".formatted("Khang");     // Java 15+ method on String

// Comparison
"abc".equals("abc");               // true
"abc".equalsIgnoreCase("ABC");     // true
"abc".compareTo("abd");            // negative (b < d)

// Conversion
String.valueOf(42);                // "42"
String.valueOf(true);              // "true"
Integer.parseInt("42");            // 42 (String → int)
Double.parseDouble("3.14");        // 3.14

// char array
char[] chars = "hello".toCharArray();
new String(chars);                 // back to String

// repeat (Java 11+)
"ab".repeat(3);                    // "ababab"

// lines (Java 11+)
"line1\nline2\nline3".lines()      // Stream<String>
    .forEach(System.out::println);
```

---

## 1.7 Math Operations

### Integer Arithmetic Traps

```java
// Integer overflow — wraps around silently ⚠️
int max = Integer.MAX_VALUE;      // 2147483647
System.out.println(max + 1);      // -2147483648 (overflow!)

// Use long for large calculations
long safeResult = (long) max + 1;  // 2147483648 ✅

// Math.addExact() throws ArithmeticException on overflow
Math.addExact(max, 1);             // throws ArithmeticException

// Integer division truncates toward zero
System.out.println(7 / 2);        // 3 (not 3.5!)
System.out.println(-7 / 2);       // -3 (not -4)
System.out.println(7.0 / 2);      // 3.5 (one double → double division)

// Modulo with negatives (can be surprising)
System.out.println(-7 % 3);       // -1 (sign follows dividend in Java)
System.out.println(7 % -3);       // 1
```

### BigDecimal for Precision

```java
import java.math.BigDecimal;
import java.math.RoundingMode;

BigDecimal price = new BigDecimal("19.99");
BigDecimal tax = new BigDecimal("0.08");

BigDecimal total = price.multiply(BigDecimal.ONE.add(tax));
// 21.5892 — but we want 2 decimal places

BigDecimal rounded = total.setScale(2, RoundingMode.HALF_UP);  // 21.59

// Rounding modes matter!
// HALF_UP:    2.5 → 3 (common "school" rounding)
// HALF_DOWN:  2.5 → 2
// HALF_EVEN:  2.5 → 2, 3.5 → 4 (banker's rounding — statistically unbiased)
// CEILING:    2.1 → 3
// FLOOR:      2.9 → 2
// UP:         2.1 → 3, -2.1 → -3
// DOWN:       2.9 → 2, -2.9 → -2
```

---

## 1.8 Arrays

### Memory Layout

```java
// Arrays are OBJECTS on the heap
int[] arr = new int[5];
// arr is a reference variable on stack pointing to:
// [0][0][0][0][0] — contiguous memory on heap

// Array of objects stores REFERENCES, not objects
String[] names = new String[3];
// [null][null][null] — 3 null references
names[0] = "Alice";
// [ref→"Alice"][null][null]
```

### Common Array Patterns

```java
// Array initialization
int[] a = new int[5];              // all zeros
int[] b = {1, 2, 3, 4, 5};        // literal
int[] c = new int[]{1, 2, 3};     // alternative literal

// 2D arrays — array of arrays (can be jagged!)
int[][] matrix = new int[3][4];    // 3 rows, 4 cols
int[][] jagged = new int[3][];     // 3 rows, unspecified cols
jagged[0] = new int[2];
jagged[1] = new int[5];            // rows can have different lengths!

// Copy patterns
int[] original = {1, 2, 3, 4, 5};
int[] copy1 = original.clone();                     // shallow copy
int[] copy2 = Arrays.copyOf(original, original.length);
int[] copy3 = Arrays.copyOfRange(original, 1, 4);  // {2,3,4}
System.arraycopy(original, 0, copy1, 0, 3);         // fast native copy

// Sorting
int[] nums = {5, 3, 1, 4, 2};
Arrays.sort(nums);                          // {1,2,3,4,5} natural order
Arrays.sort(nums, 1, 4);                    // sort only index 1..3

String[] words = {"banana", "apple", "cherry"};
Arrays.sort(words);                         // alphabetical
Arrays.sort(words, Comparator.reverseOrder()); // reverse alphabetical
Arrays.sort(words, (x, y) -> x.length() - y.length()); // by length

// Searching (array MUST be sorted first!)
int idx = Arrays.binarySearch(nums, 3);     // returns index

// Fill
Arrays.fill(nums, -1);                      // {-1,-1,-1,-1,-1}

// Compare
int[] x = {1,2,3}, y = {1,2,3};
Arrays.equals(x, y);                        // true
x == y;                                     // false (different references)
```

---

## 1.9 Conditionals

### Switch Expression (Modern Java)

```java
// Traditional switch (statement) — fall-through behavior
int day = 3;
switch (day) {
    case 1:
    case 2:
        System.out.println("Weekend");
        break;
    case 3:
        System.out.println("Monday");
        break;
    // Missing break = FALLS THROUGH to next case! Common bug
    default:
        System.out.println("Other");
}

// Switch expression (Java 14+) — no fall-through, returns value
String result = switch (day) {
    case 1, 2 -> "Weekend";        // multiple labels
    case 3    -> "Monday";
    default   -> "Weekday";
};

// Switch expression with blocks
int numLetters = switch (day) {
    case 1, 2 -> 7;
    case 3 -> {
        System.out.println("Computing...");
        yield 6;        // 'yield' returns value from a block
    }
    default -> 0;
};

// Pattern matching in switch (Java 21+)
Object obj = "hello";
String desc = switch (obj) {
    case Integer i -> "int: " + i;
    case String s when s.length() > 5 -> "long string: " + s;
    case String s -> "short string: " + s;
    case null -> "null value";
    default -> "other: " + obj;
};
```

---

## 1.10 Loops

### Iterator Protocol and For-Each

```java
// For-each works on anything implementing Iterable<T>
int[] arr = {1, 2, 3};
for (int n : arr) { }        // arrays work too (special case)

List<String> list = List.of("a", "b", "c");
for (String s : list) { }    // List implements Iterable

// You can make your own class iterable:
public class Range implements Iterable<Integer> {
    private final int start, end;
    Range(int start, int end) { this.start = start; this.end = end; }

    @Override
    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            int current = start;
            public boolean hasNext() { return current < end; }
            public Integer next() { return current++; }
        };
    }
}

for (int n : new Range(1, 5)) {  // 1, 2, 3, 4
    System.out.println(n);
}
```

### Labeled Breaks (Break Out of Nested Loops)

```java
outer:                           // label
for (int i = 0; i < 5; i++) {
    for (int j = 0; j < 5; j++) {
        if (i == 2 && j == 3) {
            break outer;         // breaks out of OUTER loop entirely
        }
        if (j == 2) {
            continue outer;      // skips to next iteration of outer loop
        }
    }
}
```

---

# 2. Object-Oriented Programming

> 📖 <https://docs.oracle.com/javase/tutorial/java/concepts/index.html>

---

## 2.1 Classes and Objects

### What Happens When You Call `new`

```java
Person p = new Person("Khang", 21);

// JVM does:
// 1. Checks if Person class is loaded. If not, loads it.
// 2. Allocates memory on the HEAP for a Person object
//    (all instance fields initialized to defaults: 0, false, null)
// 3. Calls the constructor — sets name="Khang", age=21
// 4. Returns a reference (memory address) stored in variable 'p' on the STACK
```

### Full Class Anatomy

```java
public class Person {

    // === FIELDS ===
    private String name;       // instance field
    private int age;
    private static int count = 0;  // class field

    // === STATIC INITIALIZER ===
    static {
        System.out.println("Person class loaded");
        count = 0;
    }

    // === INSTANCE INITIALIZER ===
    {
        System.out.println("Object being created");
        // runs before every constructor
    }

    // === CONSTRUCTORS ===
    public Person() {
        this("Unknown", 0);    // constructor chaining with this()
    }

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
        count++;
    }

    // === INSTANCE METHODS ===
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    // === STATIC METHODS ===
    public static int getCount() { return count; }

    // === Object methods typically overridden ===
    @Override
    public String toString() {
        return "Person{name='" + name + "', age=" + age + "}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;          // same reference
        if (!(o instanceof Person p)) return false;
        return age == p.age && Objects.equals(name, p.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);
        // RULE: if equals() returns true, hashCode() MUST return same value
        // Used by HashMap, HashSet for bucket placement
    }
}
```

---

## 2.2 Access Specifiers

### Real-World Design Guidance

```java
public class BankAccount {
    // private: only this class can access — protect internal state
    private double balance;
    private String pin;

    // protected: this class + subclasses + same package
    protected String accountId;

    // package-private (no modifier): only within same package
    String branchCode;

    // public: accessible from anywhere
    public String ownerName;

    // ✅ Best practice: ALL fields private, expose via methods
    public double getBalance() { return balance; }

    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        balance += amount;
    }

    // package-private method — helper used within package only
    void internalAudit() { }

    // protected method — subclass can override behavior
    protected double calculateInterest() { return balance * 0.02; }
}
```

---

## 2.3 Static Keyword — Deep Dive

```java
public class MathUtils {

    // Static field — one shared copy for ALL instances
    public static final double PI = 3.14159265358979;

    // Static method — no instance needed, cannot use 'this'
    public static int square(int n) { return n * n; }

    // ❌ These would be compile errors in a static method:
    // private int instanceField = 5;
    // public static void bad() { return instanceField; } // error!

    // Static nested class — can be instantiated without outer instance
    public static class Helper {
        public void doSomething() { }
    }
}

// Usage — called on class, not object
MathUtils.square(5);
new MathUtils.Helper().doSomething();

// ⚠️ Pitfall: static methods can be called on a reference (confusing, avoid)
MathUtils obj = null;
obj.square(5);   // Works! (compiles and runs — static dispatch ignores the reference)
// But this looks like it might NPE — very misleading! Always use class name.
```

### Static vs Instance — Decision Guide

| Use `static` when... | Use instance when... |
|---------------------|---------------------|
| Logic doesn't depend on object state | Logic depends on fields |
| Utility/helper methods | Business logic per object |
| Constants (`static final`) | Per-object constants |
| Factory methods | Regular constructors |
| Counters/shared state | Per-object state |

---

## 2.4 Final Keyword — All Uses

```java
// 1. final VARIABLE — cannot be reassigned
final int MAX = 100;
MAX = 200;    // ❌ compile error

// For objects — the REFERENCE is final, not the object itself!
final List<String> list = new ArrayList<>();
list = new ArrayList<>();  // ❌ can't reassign reference
list.add("hello");         // ✅ can still modify the object!

// Blank final — must be assigned in constructor
class Circle {
    final double radius;      // blank final
    Circle(double r) {
        this.radius = r;      // MUST assign here
    }
}

// 2. final METHOD — cannot be overridden
class Parent {
    final void show() { System.out.println("Parent"); }
}
class Child extends Parent {
    // void show() { } ← compile error: cannot override final method
}

// 3. final CLASS — cannot be extended
final class Immutable { }
// class Mutable extends Immutable { } ← compile error

// Well-known final classes: String, Integer, Long, Double, Math
```

---

## 2.5 Nested Classes — All Four Types

```java
public class Outer {
    private int x = 10;

    // TYPE 1: Static Nested Class
    // - Can access Outer's STATIC members only
    // - Instantiate without Outer instance
    static class StaticNested {
        void show() { System.out.println("Static nested"); }
        // void bad() { return x; }  // ❌ cannot access instance field x
    }

    // TYPE 2: Inner Class (Non-static)
    // - Can access ALL Outer members (including private!)
    // - Requires Outer instance to instantiate
    class Inner {
        void show() { System.out.println("x = " + x); }  // ✅ accesses Outer's x
    }

    void method() {
        int localVar = 5;

        // TYPE 3: Local Class (inside a method)
        class Local {
            void show() {
                System.out.println(x);         // ✅ outer field
                System.out.println(localVar);  // ✅ effectively final local var
            }
        }
        new Local().show();

        // TYPE 4: Anonymous Class
        Runnable r = new Runnable() {
            @Override
            public void run() {
                System.out.println("Anonymous: " + x);  // ✅
            }
        };
        r.run();
    }
}

// Instantiation:
new Outer.StaticNested();              // no Outer needed
Outer outer = new Outer();
Outer.Inner inner = outer.new Inner(); // need Outer instance
```

---

# 3. More About OOP

> 📖 <https://docs.oracle.com/javase/tutorial/java/IandI/index.html>

---

## 3.1 Inheritance — Deep Dive

```java
// Constructor chaining rules:
// 1. Every constructor MUST call another constructor as first statement
// 2. If you don't, compiler inserts implicit super() call
// 3. If parent has no no-arg constructor, you MUST explicitly call super(args)

class Vehicle {
    String brand;
    int year;

    Vehicle(String brand, int year) {
        this.brand = brand;
        this.year = year;
        System.out.println("Vehicle constructor");
    }
}

class Car extends Vehicle {
    int doors;

    Car(String brand, int year, int doors) {
        super(brand, year);    // MUST be first statement, calls Vehicle constructor
        this.doors = doors;
        System.out.println("Car constructor");
    }
}

class ElectricCar extends Car {
    int range;

    ElectricCar(String brand, int year, int doors, int range) {
        super(brand, year, doors);    // calls Car constructor
        this.range = range;
    }
}

// Order of execution when: new ElectricCar("Tesla", 2023, 4, 500)
// 1. Vehicle constructor runs first
// 2. Car constructor runs second
// 3. ElectricCar constructor runs last
```

### What IS and IS NOT Inherited

```java
class Parent {
    public int publicField;
    protected int protectedField;
    int packageField;               // package-private
    private int privateField;       // NOT inherited

    public Parent() { }             // constructors NOT inherited
    public void publicMethod() { }  // inherited
    protected void protectedMethod() { } // inherited
    private void privateMethod() { }    // NOT inherited
}

class Child extends Parent {
    void test() {
        publicField = 1;            // ✅
        protectedField = 2;         // ✅
        packageField = 3;           // ✅ (if same package)
        // privateField = 4;        // ❌ compile error
    }
}
```

---

## 3.2 Abstraction — Abstract Class vs Interface

```java
// ABSTRACT CLASS: "is-a" relationship with partial implementation
abstract class Shape {
    String color;                        // state allowed

    Shape(String color) {               // constructor allowed
        this.color = color;
    }

    abstract double area();              // MUST be overridden
    abstract double perimeter();         // MUST be overridden

    // Concrete method with common logic
    void printInfo() {
        System.out.printf("Shape: %s, Color: %s, Area: %.2f%n",
            getClass().getSimpleName(), color, area());
    }
}

class Circle extends Shape {
    double radius;
    Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }
    double area() { return Math.PI * radius * radius; }
    double perimeter() { return 2 * Math.PI * radius; }
}

// INTERFACE: "can-do" capability contract
interface Serializable { }                    // marker interface

interface Drawable {
    void draw();                              // abstract (implicit)
    default void clear() {                    // Java 8+: default implementation
        System.out.println("Clearing...");
    }
    static Drawable createEmpty() {           // Java 8+: static factory
        return () -> System.out.println("Drawing nothing");
    }
    private void helper() { }                // Java 9+: private helper
}

// Multiple interface implementation
class Canvas extends Shape implements Drawable, Serializable {
    Canvas() { super("white"); }
    double area() { return 0; }
    double perimeter() { return 0; }
    public void draw() { System.out.println("Drawing on canvas"); }
}
```

### Interface Default Method Conflict Resolution

```java
interface A {
    default void hello() { System.out.println("A"); }
}
interface B {
    default void hello() { System.out.println("B"); }
}

// ❌ Compile error: must override ambiguous default
class C implements A, B {
    @Override
    public void hello() {
        A.super.hello();    // explicitly choose A's implementation
        // or B.super.hello();
        // or completely override with own logic
    }
}
```

---

## 3.3 Encapsulation — Beyond Getters/Setters

```java
// Defensive copying — protect mutable fields from external modification
import java.util.Date;

public class Event {
    private final String name;
    private final Date date;           // Date is mutable ⚠️
    private final List<String> tags;   // List is mutable ⚠️

    public Event(String name, Date date, List<String> tags) {
        this.name = name;
        this.date = new Date(date.getTime());        // defensive copy!
        this.tags = new ArrayList<>(tags);           // defensive copy!
    }

    public Date getDate() {
        return new Date(date.getTime());             // return copy, not original!
    }

    public List<String> getTags() {
        return Collections.unmodifiableList(tags);  // or return copy
    }
}

// Without defensive copying:
Date d = new Date();
Event e = new Event("Party", d, new ArrayList<>());
d.setTime(0);                    // would change e's date too!
e.getDate().setTime(0);         // would change e's date too!
```

---

## 3.4 Polymorphism — Runtime vs Compile-Time

```java
// Compile-time polymorphism = Method Overloading
// Resolved by compiler based on parameter types/count
public class Printer {
    void print(int n) { System.out.println("int: " + n); }
    void print(String s) { System.out.println("String: " + s); }
    void print(int a, int b) { System.out.println("two ints: " + a + ", " + b); }
}

// Runtime polymorphism = Method Overriding + Inheritance
// Resolved by JVM at runtime based on actual object type
Shape[] shapes = {new Circle("red", 5), new Rectangle("blue", 4, 6)};
for (Shape s : shapes) {
    s.area();   // JVM dynamically dispatches to correct implementation
}

// Virtual dispatch table (vtable) — how JVM implements this:
// Each class has a vtable mapping method signatures → implementations
// At runtime, JVM looks up the object's actual class vtable
```

---

## 3.5 Method Overloading Rules (Tricky!)

```java
// The compiler resolves overloading at compile time — can be tricky
void method(int i)    { System.out.println("int"); }
void method(long l)   { System.out.println("long"); }
void method(Object o) { System.out.println("Object"); }

method(5);        // int (exact match wins)
method(5L);       // long (exact match wins)
method(5.0);      // Object (double promoted, no double overload, widening to Object)
method("hello");  // Object (String is-a Object)

// Varargs — must be last parameter, matches "any number" of args
void log(String format, Object... args) { }
log("hello");            // 0 varargs
log("hello %s", "world"); // 1 vararg
log("%d + %d", 1, 2);   // 2 varargs
// ⚠️ Varargs overloads have lowest priority in resolution
```

---

## 3.6 Interfaces — All Features

```java
public interface Repository<T, ID> {

    // === Abstract methods (implicit public abstract) ===
    T findById(ID id);
    List<T> findAll();
    T save(T entity);
    void delete(ID id);

    // === Default methods (Java 8+) ===
    // Provides implementation — subclasses can override
    default boolean existsById(ID id) {
        return findById(id) != null;
    }

    // === Static methods (Java 8+) ===
    // Called on interface itself, not overridable
    static <T, ID> Repository<T, ID> empty() {
        return new Repository<>() {
            public T findById(ID id) { return null; }
            public List<T> findAll() { return List.of(); }
            public T save(T entity) { return entity; }
            public void delete(ID id) { }
        };
    }

    // === Constants (implicit public static final) ===
    int MAX_RESULTS = 1000;

    // === Private methods (Java 9+) ===
    // Helpers for default methods — not accessible outside
    private void validate(T entity) {
        if (entity == null) throw new IllegalArgumentException("Entity cannot be null");
    }
}
```

---

## 3.7 Enums — Full Power

```java
public enum OrderStatus {
    PENDING("Awaiting payment"),
    CONFIRMED("Payment received"),
    PROCESSING("Being prepared"),
    SHIPPED("In transit"),
    DELIVERED("Successfully delivered"),
    CANCELLED("Order cancelled");

    private final String description;

    // Enum constructors are always private (implicit)
    OrderStatus(String description) {
        this.description = description;
    }

    public String getDescription() { return description; }

    // Enums can have abstract methods — each value must implement
    public abstract boolean isFinal();

    // Or provide default behavior
    public boolean canBeCancelled() {
        return this == PENDING || this == CONFIRMED;
    }
}

// Override per value using anonymous class body
public enum OrderStatus {
    DELIVERED {
        @Override
        public boolean isFinal() { return true; }
    },
    CANCELLED {
        @Override
        public boolean isFinal() { return true; }
    },
    PENDING {
        @Override
        public boolean isFinal() { return false; }
    };
    public abstract boolean isFinal();
}

// Built-in Enum methods:
OrderStatus.valueOf("PENDING");     // get by name
OrderStatus.values();               // all values as array
OrderStatus.PENDING.name();         // "PENDING"
OrderStatus.PENDING.ordinal();      // 0 (position, fragile — avoid depending on it)

// Enum in Collections
EnumSet<OrderStatus> finalStates = EnumSet.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED);
EnumMap<OrderStatus, Integer> countByStatus = new EnumMap<>(OrderStatus.class);
```

---

## 3.8 Records — Immutable Data Carriers

```java
// Compact syntax — compiler generates: constructor, getters, equals, hashCode, toString
public record Point(double x, double y) {

    // Compact canonical constructor — for validation
    Point {   // no parameters — uses record components implicitly
        if (Double.isNaN(x) || Double.isNaN(y)) {
            throw new IllegalArgumentException("Coordinates cannot be NaN");
        }
        // Can modify parameters before assignment: x = Math.abs(x);
    }

    // Additional methods allowed
    public double distanceTo(Point other) {
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Can add static factory methods
    public static Point origin() { return new Point(0, 0); }
}

// Records are final — cannot be extended
// Records cannot extend other classes (implicitly extend java.lang.Record)
// Records CAN implement interfaces

// Perfect for DTOs, Value Objects
record UserDTO(long id, String name, String email) implements Serializable { }
record Money(BigDecimal amount, String currency) { }
record Pair<A, B>(A first, B second) { }  // can be generic
```

---

## 3.9 Pass by Value — The Definitive Explanation

```java
// Java passes COPIES of values. Always. No exceptions.

// For PRIMITIVES: copy of the actual value
void increment(int x) {
    x++;    // modifies local copy only
}
int n = 5;
increment(n);
System.out.println(n);  // 5 — unchanged

// For OBJECTS: copy of the REFERENCE (memory address)
void addItem(List<String> list) {
    list.add("new item");    // modifies the OBJECT the reference points to
}
void replaceList(List<String> list) {
    list = new ArrayList<>();  // reassigns LOCAL copy of reference only!
    list.add("new item");
}

List<String> myList = new ArrayList<>();
myList.add("original");

addItem(myList);
System.out.println(myList);  // [original, new item] — modified via reference copy

replaceList(myList);
System.out.println(myList);  // [original, new item] — NOT changed!
// The local 'list' in replaceList was reassigned, not the original reference

// Mental model: 
// Think of it like giving someone your house ADDRESS written on paper.
// They can use the address to go to your house and rearrange furniture (modify object) ✅
// But they can't change what address is written on YOUR paper (reassign reference) ❌
```

---

# 4. Exception Handling

> 📖 <https://docs.oracle.com/javase/tutorial/essential/exceptions/index.html>

---

## 4.1 Exception Hierarchy and Types

```
Throwable
├── Error (JVM-level, unrecoverable — DON'T catch these!)
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   └── AssertionError
└── Exception
    ├── Checked Exceptions (MUST handle at compile time)
    │   ├── IOException
    │   │   ├── FileNotFoundException
    │   │   └── SocketException
    │   ├── SQLException
    │   ├── ClassNotFoundException
    │   └── ParseException
    └── RuntimeException (Unchecked — optional to handle)
        ├── NullPointerException
        ├── ArrayIndexOutOfBoundsException
        ├── ClassCastException
        ├── NumberFormatException
        ├── IllegalArgumentException
        ├── IllegalStateException
        ├── UnsupportedOperationException
        └── ConcurrentModificationException
```

### Checked vs Unchecked — When to Use Which

```java
// CHECKED exceptions: represent recoverable situations that CALLERS should handle
// "I might fail due to external conditions — caller must plan for this"
public byte[] readFile(String path) throws IOException {
    return Files.readAllBytes(Path.of(path));
    // Caller MUST handle: file might not exist, permissions, disk error
}

// UNCHECKED exceptions: represent programming errors
// "You passed me invalid data — this is a bug, fix your code"
public int divide(int a, int b) {
    if (b == 0) throw new IllegalArgumentException("Divisor cannot be zero");
    return a / b;
}

// Rule of thumb:
// - IOException, SQLException → checked (external resources)
// - NullPointerException, IndexOutOfBoundsException → unchecked (bugs)
// - Custom business exceptions → usually unchecked (RuntimeException subclass)
```

---

## 4.2 Try-Catch — All Patterns

```java
// Multi-catch (Java 7+)
try {
    riskyOperation();
} catch (IOException | SQLException e) {   // same handler for multiple types
    log("Data access error: " + e.getMessage());
}

// Catch ordering — most specific FIRST
try {
    riskyOperation();
} catch (FileNotFoundException e) {    // more specific — check this first
    handle("File not found");
} catch (IOException e) {             // less specific — catches remaining IOExceptions
    handle("IO error");
} catch (Exception e) {               // catches everything else
    handle("Unexpected error");
}

// ⚠️ Unreachable catch blocks = compile error
try { }
catch (IOException e) { }
catch (FileNotFoundException e) { }  // ❌ FileNotFoundException IS-A IOException,
                                      // already caught above

// Finally — ALWAYS runs (even if catch throws, even if return in try)
Connection conn = null;
try {
    conn = getConnection();
    doWork(conn);
} catch (SQLException e) {
    rollback(conn);
    throw e;     // re-throw after cleanup
} finally {
    if (conn != null) conn.close();  // always closes, even if re-throw above
}

// Try-with-resources — automatic close (Java 7+)
// Works with any class implementing AutoCloseable
try (Connection conn = getConnection();         // multiple resources OK
     PreparedStatement stmt = conn.prepareStatement("SELECT 1")) {
    ResultSet rs = stmt.executeQuery();
    // conn and stmt are auto-closed in REVERSE ORDER when block exits
    // even if exception is thrown
}
```

---

## 4.3 Creating Custom Exceptions

```java
// Custom checked exception
public class InsufficientFundsException extends Exception {
    private final double amount;
    private final double balance;

    public InsufficientFundsException(double amount, double balance) {
        super(String.format("Cannot withdraw %.2f: balance is %.2f", amount, balance));
        this.amount = amount;
        this.balance = balance;
    }

    // Constructor for wrapping a cause
    public InsufficientFundsException(String message, Throwable cause) {
        super(message, cause);
        this.amount = 0;
        this.balance = 0;
    }

    public double getAmount() { return amount; }
    public double getBalance() { return balance; }
}

// Custom unchecked exception (recommended for most custom exceptions)
public class UserNotFoundException extends RuntimeException {
    private final String userId;

    public UserNotFoundException(String userId) {
        super("User not found: " + userId);
        this.userId = userId;
    }

    public String getUserId() { return userId; }
}

// Exception chaining — preserve original cause
try {
    doSomething();
} catch (SQLException e) {
    throw new DataAccessException("Failed to load user", e);  // e is the cause
}

// Retrieve chain
try {
    load();
} catch (DataAccessException e) {
    Throwable cause = e.getCause();          // original SQLException
    e.printStackTrace();                     // prints entire chain
}
```

---

# 5. Lambda Expressions & Functional Programming

> 📖 <https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html>
> 📖 Stream API: <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/stream/Stream.html>

---

## 5.1 Functional Interfaces

```java
// A functional interface has EXACTLY ONE abstract method
@FunctionalInterface     // optional but enforced by compiler
public interface Transformer<T, R> {
    R transform(T input);    // the single abstract method
    // default methods allowed
    // static methods allowed
    // Object methods (equals, toString) don't count
}

// Java's built-in functional interfaces (java.util.function)
Predicate<T>          // T → boolean     — test conditions
Function<T, R>        // T → R           — transform values
Consumer<T>           // T → void        — consume/use values
Supplier<T>           // () → T          — produce values
BiFunction<T, U, R>   // (T, U) → R      — two inputs
BiPredicate<T, U>     // (T, U) → boolean
BiConsumer<T, U>      // (T, U) → void
UnaryOperator<T>      // T → T           — same type in/out
BinaryOperator<T>     // (T, T) → T
Runnable              // () → void       — from java.lang
Callable<T>           // () → T (throws checked exceptions)

// Primitive specializations (avoid boxing overhead):
IntPredicate, LongPredicate, DoublePredicate
IntFunction<R>, LongFunction<R>, DoubleFunction<R>
IntUnaryOperator, IntBinaryOperator
IntConsumer, IntSupplier
ToIntFunction<T>, ToLongFunction<T>, ToDoubleFunction<T>
```

### Lambda Syntax Forms

```java
// 1. No parameters
Runnable r = () -> System.out.println("Hello");

// 2. Single parameter (parens optional)
Predicate<String> isEmpty = s -> s.isEmpty();
Predicate<String> isEmpty2 = (s) -> s.isEmpty();   // same
Predicate<String> isEmpty3 = (String s) -> s.isEmpty();  // explicit type

// 3. Multiple parameters
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// 4. Block body (multiple statements)
Function<String, String> process = (s) -> {
    String trimmed = s.trim();
    String upper = trimmed.toUpperCase();
    return upper;   // explicit return needed in block body
};

// 5. Method references (4 types)
// Static method:
Function<String, Integer> parse = Integer::parseInt;
// Instance method on instance:
Consumer<String> printer = System.out::println;
// Instance method on arbitrary instance of type:
Predicate<String> blank = String::isBlank;
Function<String, String> upper = String::toUpperCase;
// Constructor:
Supplier<ArrayList<String>> listFactory = ArrayList::new;
Function<Integer, int[]> arrayFactory = int[]::new;
```

---

## 5.2 Composing Functions

```java
// Predicate composition
Predicate<String> notEmpty = s -> !s.isEmpty();
Predicate<String> longEnough = s -> s.length() >= 5;
Predicate<String> isEmail = s -> s.contains("@");

Predicate<String> validEmail = notEmpty
    .and(longEnough)
    .and(isEmail);

Predicate<String> shortOrEmpty = notEmpty.negate().or(longEnough.negate());

// Function composition
Function<String, String> trim = String::trim;
Function<String, String> upper = String::toUpperCase;
Function<String, Integer> length = String::length;

// andThen: f.andThen(g) = g(f(x))
Function<String, String> trimThenUpper = trim.andThen(upper);

// compose: f.compose(g) = f(g(x))
Function<String, String> upperThenTrim = trim.compose(upper);

// chain further
Function<String, Integer> pipeline = trim.andThen(upper).andThen(length);
pipeline.apply("  hello  ");  // 5
```

---

## 5.3 Stream API — Complete Guide

```java
List<Employee> employees = List.of(
    new Employee("Alice", "Engineering", 90000),
    new Employee("Bob", "Marketing", 65000),
    new Employee("Charlie", "Engineering", 85000),
    new Employee("Diana", "HR", 55000),
    new Employee("Eve", "Engineering", 95000)
);

// ── INTERMEDIATE OPERATIONS (lazy — not executed until terminal) ──

// filter — keep elements matching predicate
employees.stream()
    .filter(e -> e.getSalary() > 80000)

// map — transform each element
.map(Employee::getName)

// flatMap — flatten nested structures
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4));
nested.stream().flatMap(Collection::stream)  // [1, 2, 3, 4]

// sorted — natural order or custom comparator
.sorted(Comparator.comparing(Employee::getSalary).reversed())

// distinct — removes duplicates (uses equals/hashCode)
// limit — take first N elements
// skip — skip first N elements
// peek — debug without consuming (returns stream, runs action)
.peek(e -> System.out.println("Processing: " + e))

// ── TERMINAL OPERATIONS (trigger execution) ──

// collect — gather into collection
List<String> highPaidNames = employees.stream()
    .filter(e -> e.getSalary() > 80000)
    .map(Employee::getName)
    .collect(Collectors.toList());                    // mutable list
    // .toList()                                       // Java 16+: immutable list

// Collectors
Collectors.toList()
Collectors.toSet()
Collectors.toUnmodifiableList()
Collectors.joining(", ", "[", "]")                   // string concatenation
Collectors.groupingBy(Employee::getDepartment)        // Map<String, List<Employee>>
Collectors.groupingBy(Employee::getDepartment,
    Collectors.counting())                            // Map<String, Long>
Collectors.partitioningBy(e -> e.getSalary() > 75000) // Map<Boolean, List<Employee>>
Collectors.toMap(Employee::getName, Employee::getSalary)
Collectors.averagingDouble(Employee::getSalary)
Collectors.summarizingDouble(Employee::getSalary)     // count, sum, min, max, avg

// forEach
employees.stream().forEach(System.out::println);

// count, sum, min, max
long count = employees.stream().filter(e -> e.getSalary() > 80000).count();
OptionalDouble avgSalary = employees.stream()
    .mapToDouble(Employee::getSalary).average();
OptionalInt maxSalary = employees.stream()
    .mapToInt(Employee::getSalary).max();

// reduce — fold/aggregate
int sum = IntStream.rangeClosed(1, 100).reduce(0, Integer::sum);  // 5050

// findFirst, findAny
Optional<Employee> first = employees.stream()
    .filter(e -> e.getDepartment().equals("Engineering"))
    .findFirst();

// anyMatch, allMatch, noneMatch
boolean anyHighPaid = employees.stream().anyMatch(e -> e.getSalary() > 100000);
boolean allPaid = employees.stream().allMatch(e -> e.getSalary() > 0);

// ── CREATING STREAMS ──
Stream.of("a", "b", "c")
Stream.empty()
Stream.generate(Math::random).limit(10)    // infinite stream
Stream.iterate(0, n -> n + 2).limit(10)   // 0, 2, 4, 6, ...
Stream.iterate(0, n -> n < 100, n -> n + 2) // Java 9+: with predicate
IntStream.range(0, 10)                    // 0..9
IntStream.rangeClosed(1, 10)             // 1..10
Arrays.stream(intArray)
collection.stream()
collection.parallelStream()              // parallel processing
```

---

# 6. Annotations

> 📖 <https://docs.oracle.com/javase/tutorial/java/annotations/index.html>

---

## 6.1 Built-in Annotations

```java
// @Override — detect override errors at compile time (ALWAYS use this!)
@Override
public String toString() { return "..."; }
// Without @Override, a typo tostring() would compile fine as a NEW method

// @Deprecated — mark as obsolete
@Deprecated(since = "1.5", forRemoval = true)  // Java 9+ attributes
public void oldMethod() { }

// @SuppressWarnings — suppress specific warnings
@SuppressWarnings("unchecked")
List rawList = new ArrayList();
@SuppressWarnings({"unchecked", "deprecated"})

// @FunctionalInterface — compile-time check
@FunctionalInterface
interface Transformer<T, R> { R apply(T t); }

// @SafeVarargs — suppress heap pollution warning
@SafeVarargs
public static <T> List<T> of(T... elements) { return Arrays.asList(elements); }
```

---

## 6.2 Creating Custom Annotations

```java
import java.lang.annotation.*;

// Meta-annotations — annotations for annotations
@Retention(RetentionPolicy.RUNTIME)   // when is annotation available?
// SOURCE: only in source code (discarded by compiler)
// CLASS: in bytecode (default, not available at runtime via reflection)
// RUNTIME: available at runtime via reflection

@Target({ElementType.METHOD, ElementType.TYPE})  // where can it be placed?
// TYPE, FIELD, METHOD, PARAMETER, CONSTRUCTOR,
// LOCAL_VARIABLE, ANNOTATION_TYPE, PACKAGE, TYPE_PARAMETER, TYPE_USE

@Documented       // included in Javadoc
@Inherited        // subclasses inherit annotation from parent class

public @interface Timed {
    String value() default "";             // 'value' can be set without name
    TimeUnit unit() default TimeUnit.MILLISECONDS;
    String[] tags() default {};
}

// Usage:
@Timed("processOrder")
@Timed(value = "sendEmail", unit = TimeUnit.SECONDS, tags = {"email", "async"})

// Reading annotations at runtime via Reflection
Method method = MyClass.class.getMethod("processOrder");
Timed timed = method.getAnnotation(Timed.class);
if (timed != null) {
    System.out.println("Timing: " + timed.value() + " in " + timed.unit());
}

// Repeatable annotations (Java 8+)
@Repeatable(Schedules.class)
@interface Schedule { String day(); }
@interface Schedules { Schedule[] value(); }

@Schedule(day = "MON")
@Schedule(day = "WED")
@Schedule(day = "FRI")
class WeeklyTask { }
```

---

# 7. Modules (Java 9+)

> 📖 <https://dev.java/learn/modules/>

---

## 7.1 Module System Overview

```
Before modules (classpath era):
- All JAR files on classpath visible to each other
- No enforcement of internal packages
- "JAR hell" — version conflicts, split packages
- Large apps ship everything even if unused

After modules (JPMS — Java Platform Module System):
- Each module declares what it needs (requires)
- Each module declares what it exposes (exports)
- Unexported packages are truly inaccessible (strong encapsulation)
- JVM can verify dependency graph at startup
```

### module-info.java — Complete Syntax

```java
// Located at: src/com.myapp/module-info.java
module com.myapp {

    // Dependencies
    requires java.base;           // implicit — always required
    requires java.sql;            // requires this module
    requires transitive java.logging;  // re-exports: anyone requiring com.myapp
                                       // also gets java.logging implicitly
    requires static jsr305;       // optional at runtime (compile-time only)

    // Public API
    exports com.myapp.api;              // public to everyone
    exports com.myapp.internal
        to com.myapp.tests;             // only this specific module can use it

    // Reflection access (for frameworks like Spring, Jackson, Hibernate)
    opens com.myapp.model;              // deep reflection allowed by everyone
    opens com.myapp.config to spring.core; // only spring.core can reflect

    // Service mechanism (like plugin system)
    uses com.myapp.spi.PaymentGateway;  // this module uses this service
    provides com.myapp.spi.PaymentGateway
        with com.myapp.impl.StripeGateway,
             com.myapp.impl.PaypalGateway; // register implementations
}
```

---

# 8. Optionals

> 📖 <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Optional.html>

---

## 8.1 Optional — When and How to Use

```java
// ✅ GOOD uses of Optional:
// - Return type of methods that MIGHT not return a value
public Optional<User> findUserById(long id) {
    return userRepository.findById(id);  // Optional<User>
}

// ❌ BAD uses:
// - As a field type (just use null for fields)
// - As a parameter type (use overloads instead)
// - For Collections (return empty collection instead)

// Anti-pattern:
if (optional.isPresent()) {
    User user = optional.get();
    processUser(user);
}

// Better:
optional.ifPresent(this::processUser);

// Anti-pattern:
User user = optional.isPresent() ? optional.get() : new User("default");

// Better:
User user = optional.orElse(new User("default"));
// Or lazy (only create if needed):
User user = optional.orElseGet(() -> new User("default"));
```

### Optional Chaining

```java
// Find user's city from nested objects
// Without Optional (multiple null checks):
String city = "Unknown";
User user = findUser(id);
if (user != null) {
    Address addr = user.getAddress();
    if (addr != null) {
        City c = addr.getCity();
        if (c != null) {
            city = c.getName();
        }
    }
}

// With Optional (elegant chaining):
String city = findUserOptional(id)
    .map(User::getAddress)         // Optional<Address>
    .map(Address::getCity)         // Optional<City>
    .map(City::getName)            // Optional<String>
    .orElse("Unknown");

// Stream from Optional (Java 9+)
Optional<String> opt = Optional.of("hello");
opt.stream()                       // Stream with 0 or 1 element
   .map(String::toUpperCase)
   .findFirst();

// or() — supply fallback Optional (Java 9+)
Optional<User> result = findInCache(id)
    .or(() -> findInDatabase(id))  // try DB if cache miss
    .or(() -> findInArchive(id));  // try archive if DB miss
```

---

# 9. Collections Framework

> 📖 <https://docs.oracle.com/javase/tutorial/collections/index.html>

---

## 9.1 Collections Hierarchy

```
Collection<E>
├── List<E>           — ordered, indexed, duplicates allowed
│   ├── ArrayList     — dynamic array, O(1) get, O(n) insert/delete middle
│   ├── LinkedList    — doubly-linked, O(1) insert/delete ends, O(n) get
│   └── CopyOnWriteArrayList  — thread-safe
├── Set<E>            — no duplicates
│   ├── HashSet       — O(1) ops, no order
│   ├── LinkedHashSet — insertion order preserved
│   ├── TreeSet       — sorted (natural or Comparator), O(log n)
│   └── EnumSet       — extremely fast for enums (bit vector)
└── Queue<E>
    ├── LinkedList    — FIFO queue
    ├── PriorityQueue — heap-based priority queue
    ├── ArrayDeque    — resizable array deque (faster than LinkedList)
    └── BlockingQueue (concurrent)
        ├── ArrayBlockingQueue
        └── LinkedBlockingQueue

Map<K, V>             — key-value, NOT extends Collection
├── HashMap           — O(1) ops, no order
├── LinkedHashMap     — insertion order
├── TreeMap           — sorted by key, O(log n)
├── EnumMap           — keys are enum values
├── WeakHashMap       — GC can collect keys
├── IdentityHashMap   — uses == for key comparison (not equals)
└── ConcurrentHashMap — thread-safe, high performance
```

---

## 9.2 ArrayList vs LinkedList

```java
// ArrayList — backed by Object[]
// O(1) get by index
// O(1) amortized add to end (resizes by 50% when full)
// O(n) insert/delete in middle (shifts elements)
ArrayList<String> al = new ArrayList<>(16);  // initial capacity

// LinkedList — doubly linked nodes
// O(n) get by index (must traverse)
// O(1) add/remove at KNOWN position (with iterator)
// More memory: each node stores prev, next, data
LinkedList<String> ll = new LinkedList<>();
ll.addFirst("head");    // O(1)
ll.addLast("tail");     // O(1)
ll.getFirst();          // O(1)
ll.getLast();           // O(1)

// When to use which:
// ArrayList: random access, more reads than writes, most use cases
// LinkedList: frequent insertions/deletions at beginning/end, implementing Stack/Queue
```

---

## 9.3 HashMap Internals

```java
// HashMap internal structure:
// - Array of "buckets" (initially 16 buckets)
// - Each bucket: linked list (or tree for 8+ nodes, Java 8+)
// - Key's hashCode() determines bucket index
// - equals() used for collision resolution

// Steps for put(key, value):
// 1. hash = key.hashCode()
// 2. index = hash & (capacity - 1)     // faster than modulo
// 3. If bucket empty: create new node
// 4. If bucket has nodes: check equals() for each
//    - equals() true: update value
//    - equals() false: add to chain
// 5. If load factor exceeded (default 0.75): resize (double + rehash)

HashMap<String, Integer> map = new HashMap<>(32, 0.75f);
// initial capacity, load factor

// ⚠️ Critical: if you use objects as keys, MUST override both equals AND hashCode!
// Contract: a.equals(b) → a.hashCode() == b.hashCode()
// (reverse not required — collisions are OK, just bad for performance)

class BadKey {
    int value;
    // Only equals() overridden — BAD!
    @Override
    public boolean equals(Object o) { ... }
    // No hashCode — uses Object.hashCode() (memory address-based)
    // Two "equal" keys would hash to different buckets → can't find entries!
}

// ⚠️ Never modify keys after insertion!
// Modifying a key changes its hashCode, so you can no longer find the entry

// Null handling
HashMap<String, Integer> m = new HashMap<>();
m.put(null, 42);          // ✅ HashMap allows null key (one only!)
m.put("key", null);       // ✅ null value OK
m.get(null);              // 42

// Hashtable — old, synchronized, doesn't allow null — don't use
// Use ConcurrentHashMap for thread-safe scenarios
```

---

## 9.4 Comparator and Comparable

```java
// Comparable<T> — natural ordering defined ON the class itself
public class Student implements Comparable<Student> {
    String name;
    double gpa;

    @Override
    public int compareTo(Student other) {
        return Double.compare(this.gpa, other.gpa);  // ascending GPA
        // return -Double.compare(...) for descending
        // return other.gpa.compareTo(this.gpa) also descending
    }
}

// Comparator<T> — external ordering, more flexible, chainable
Comparator<Student> byName = Comparator.comparing(Student::getName);
Comparator<Student> byGpaDesc = Comparator.comparingDouble(Student::getGpa).reversed();
Comparator<Student> byGpaDescThenName = byGpaDesc.thenComparing(Student::getName);

// For null-safe:
Comparator<Student> nullSafe = Comparator.nullsFirst(byName);
Comparator<Student> nullLast = Comparator.nullsLast(byName);

// Sorting
List<Student> students = new ArrayList<>(studentList);
Collections.sort(students);                // uses Comparable (natural order)
students.sort(byGpaDescThenName);          // uses Comparator
Collections.sort(students, byName);        // also works

// TreeMap with custom order
TreeMap<Student, Integer> map = new TreeMap<>(byGpaDescThenName);
```

---

## 9.5 Generics Deep Dive

```java
// Generic class
public class Pair<A, B> {
    private final A first;
    private final B second;
    public Pair(A first, B second) { this.first = first; this.second = second; }
    public A getFirst() { return first; }
    public B getSecond() { return second; }
    public static <X, Y> Pair<X, Y> of(X x, Y y) { return new Pair<>(x, y); }
}

Pair<String, Integer> nameAge = Pair.of("Khang", 21);

// Bounded type parameters
// <T extends Comparable<T>> — T must be comparable to itself
public static <T extends Comparable<T>> T max(List<T> list) {
    return list.stream().max(Comparator.naturalOrder()).orElseThrow();
}

// Multiple bounds: <T extends Serializable & Comparable<T>>

// Wildcards
void printAll(List<?> list) {  // read-only — unknown type
    list.forEach(System.out::println);
    // list.add("x");  ← ❌ can't add to wildcard list
}

// Upper bounded wildcard — can read as Number, can't write
void sumList(List<? extends Number> list) {
    double sum = 0;
    for (Number n : list) sum += n.doubleValue();
    // list.add(1); ← ❌
}

// Lower bounded wildcard — can write Integers, read as Object only
void addNumbers(List<? super Integer> list) {
    list.add(1);    // ✅
    list.add(2);    // ✅
    // Integer n = list.get(0); ← ❌ type is Object
}

// PECS — Producer Extends, Consumer Super
// Use <? extends T> when you READ (get) from a collection
// Use <? super T> when you WRITE (add) to a collection
public <T> void copy(List<? extends T> source, List<? super T> dest) {
    for (T item : source) dest.add(item);
}

// Type erasure — generics only exist at compile time
// At runtime: List<String> == List<Integer> == List<Object>
List<String> strings = new ArrayList<>();
List<Integer> ints = new ArrayList<>();
System.out.println(strings.getClass() == ints.getClass()); // true!
// This means: no new T[], no instanceof List<String>
```

---

# 10. Concurrency

> 📖 <https://docs.oracle.com/javase/tutorial/essential/concurrency/index.html>

---

## 10.1 Thread Lifecycle

```
NEW → RUNNABLE → [RUNNING] → TERMINATED
         ↕
      BLOCKED (waiting for lock)
      WAITING (waiting indefinitely)
      TIMED_WAITING (waiting with timeout)
```

```java
Thread t = new Thread(() -> { });
t.getState();   // NEW

t.start();      // → RUNNABLE (ready to run, scheduler decides when)
// JVM schedules: RUNNING (actually executing on CPU)
// Thread blocks on synchronized: BLOCKED
// Thread calls wait()/join(): WAITING
// Thread calls sleep()/wait(timeout): TIMED_WAITING
// run() returns: TERMINATED
```

---

## 10.2 Synchronization

```java
public class Counter {
    private int count = 0;

    // synchronized method — acquires lock on 'this' object
    public synchronized void increment() {
        count++;
    }

    // synchronized static method — acquires lock on CLASS object
    public static synchronized void staticMethod() { }

    // synchronized block — more granular, lock on any object
    private final Object lock = new Object();
    public void increment2() {
        synchronized (lock) {
            count++;           // only this section is locked
        }
    }

    public int getCount() { return count; }  // ⚠️ should also be synchronized!
}

// Atomic classes — lock-free thread safety for single variables
AtomicInteger atomicCount = new AtomicInteger(0);
atomicCount.incrementAndGet();        // ++count
atomicCount.getAndIncrement();        // count++
atomicCount.addAndGet(5);             // count += 5
atomicCount.compareAndSet(5, 10);     // if count==5, set to 10 (CAS operation)

AtomicLong, AtomicBoolean, AtomicReference<T>
AtomicIntegerArray, LongAdder, LongAccumulator

// Locks — more control than synchronized
import java.util.concurrent.locks.*;

ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // critical section
} finally {
    lock.unlock();   // MUST release in finally!
}

// ReadWriteLock — multiple readers OR one writer
ReadWriteLock rwLock = new ReentrantReadWriteLock();
rwLock.readLock().lock();
try {
    // multiple threads can read simultaneously
} finally {
    rwLock.readLock().unlock();
}
rwLock.writeLock().lock();
try {
    // exclusive write access
} finally {
    rwLock.writeLock().unlock();
}
```

---

## 10.3 ExecutorService

```java
import java.util.concurrent.*;

// Thread Pool types
ExecutorService fixed = Executors.newFixedThreadPool(4);      // 4 threads
ExecutorService cached = Executors.newCachedThreadPool();      // dynamic, 60s TTL
ExecutorService single = Executors.newSingleThreadExecutor();  // 1 thread, queued
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);

// Submitting work
Future<Integer> future = fixed.submit(() -> {
    Thread.sleep(1000);
    return 42;
});

// Getting result (blocks until done)
Integer result = future.get();              // blocks forever
Integer result2 = future.get(5, TimeUnit.SECONDS);  // timeout

// Scheduled execution
scheduled.schedule(() -> System.out.println("once"), 2, TimeUnit.SECONDS);
scheduled.scheduleAtFixedRate(() -> System.out.println("periodic"), 0, 1, TimeUnit.SECONDS);
scheduled.scheduleWithFixedDelay(() -> System.out.println("delayed"), 0, 1, TimeUnit.SECONDS);

// CompletableFuture (Java 8+) — async composition
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> fetchUser(id))           // async
    .thenApply(user -> user.getName())           // transform result
    .thenApply(String::toUpperCase)
    .exceptionally(ex -> "Error: " + ex.getMessage())  // handle exception
    .thenCompose(name -> fetchProfile(name))     // chain async calls
    .whenComplete((result, ex) -> log(result, ex));  // callback

// Combine multiple
CompletableFuture<String> user = fetchUserAsync(id);
CompletableFuture<String> profile = fetchProfileAsync(id);
CompletableFuture<String> combined = user.thenCombine(profile,
    (u, p) -> u + " - " + p);

// Shutdown properly
fixed.shutdown();                                      // stop accepting, finish queued
boolean done = fixed.awaitTermination(10, TimeUnit.SECONDS);
if (!done) fixed.shutdownNow();                        // interrupt running tasks
```

---

## 10.4 Java Memory Model and Volatile

```java
// The happens-before relationship:
// If action A happens-before action B, A's effects are visible to B

// Guarantees:
// 1. Within thread: each action happens-before next action
// 2. volatile write happens-before subsequent volatile read
// 3. Unlock happens-before subsequent lock
// 4. Thread.start() happens-before any action in the started thread
// 5. All actions happen-before Thread.join() completes

// volatile guarantees:
// 1. VISIBILITY: writes immediately visible to all threads
// 2. ORDERING: prevents instruction reordering around volatile access
// volatile does NOT guarantee ATOMICITY of compound operations!

volatile int count = 0;
count++;  // ⚠️ NOT atomic! Read-modify-write is 3 operations
// Use AtomicInteger for atomic increment

// Double-checked locking with volatile (correct singleton)
public class Singleton {
    private static volatile Singleton instance;  // volatile is REQUIRED here

    private Singleton() { }

    public static Singleton getInstance() {
        if (instance == null) {                   // first check (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {            // second check (with lock)
                    instance = new Singleton();    // volatile prevents partial init
                }
            }
        }
        return instance;
    }
}
```

---

## 10.5 Virtual Threads (Java 21) — Detailed

```java
// Platform threads:
// - Mapped 1:1 to OS threads
// - ~1MB stack by default
// - Expensive to create/context-switch
// - Limited to ~thousands

// Virtual threads:
// - Many virtual threads multiplexed onto few platform threads (carrier threads)
// - ~few KB heap allocation
// - Managed by JVM scheduler
// - Support ~millions

// When virtual thread blocks on I/O:
// → JVM "mounts" it off the carrier thread
// → carrier thread picks up another virtual thread
// → when I/O completes, virtual thread is re-mounted on any available carrier
// → completely transparent to your code!

// Creating virtual threads
Thread.ofVirtual().start(() -> doWork());

// Named virtual thread
Thread vt = Thread.ofVirtual()
    .name("my-virtual-thread")
    .start(() -> doWork());

// Factory
ThreadFactory factory = Thread.ofVirtual().factory();
Thread t = factory.newThread(() -> doWork());

// Best pattern: virtual thread per task executor
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> futures = IntStream.range(0, 10_000)
        .mapToObj(i -> executor.submit(() -> handleRequest(i)))
        .toList();
    for (Future<String> f : futures) {
        System.out.println(f.get());
    }
}   // executor is AutoCloseable — waits for all tasks

// ⚠️ Pinning — virtual thread gets STUCK on carrier thread when:
// 1. Inside synchronized block
// 2. Running native code (JNI)
// Solution: replace synchronized with ReentrantLock for I/O-heavy virtual thread code
```

---

# 11. Cryptography

> 📖 <https://docs.oracle.com/en/java/se/17/security/java-cryptography-architecture-jca-reference-guide.html>

---

## 11.1 Hashing

```java
import java.security.MessageDigest;
import java.util.HexFormat;

// SHA-256 hash
MessageDigest md = MessageDigest.getInstance("SHA-256");
byte[] hash = md.digest("password123".getBytes(StandardCharsets.UTF_8));
String hexHash = HexFormat.of().formatHex(hash);

// Common algorithms: MD5 (broken!), SHA-1 (weak!), SHA-256, SHA-512, SHA-3

// Password hashing — NEVER use plain SHA for passwords!
// Use bcrypt, scrypt, Argon2, or PBKDF2
// These are intentionally slow + use salts to prevent rainbow tables

// PBKDF2 with HMAC-SHA256 (built into JDK)
import javax.crypto.spec.*;
SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
byte[] salt = new byte[16];
new SecureRandom().nextBytes(salt);
PBEKeySpec spec = new PBEKeySpec(
    "password".toCharArray(),
    salt,
    310000,    // iterations (OWASP 2023 recommendation)
    256        // key length in bits
);
byte[] encodedHash = factory.generateSecret(spec).getEncoded();
// Store: salt + encodedHash (needed for verification)
```

---

# 12. Date and Time

> 📖 <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/time/package-summary.html>

---

## 12.1 java.time API (Java 8+) — Full Guide

```java
// The old API (java.util.Date, Calendar) is:
// - Mutable (not thread-safe)
// - Poor API design (0-indexed months!)
// - Always use java.time instead

// Core types:
LocalDate       — date only (2025-05-19) — no time, no timezone
LocalTime       — time only (10:35:00.123) — no date, no timezone
LocalDateTime   — date + time — no timezone
ZonedDateTime   — date + time + timezone (complete)
Instant         — machine timestamp (nanoseconds since epoch) — UTC
OffsetDateTime  — date + time + UTC offset (no DST handling)
Duration        — time-based amount (hours, minutes, seconds, nanos)
Period          — date-based amount (years, months, days)
ZoneId          — timezone identifier ("Asia/Ho_Chi_Minh", "UTC", "Europe/Berlin")

// Creating
LocalDate today = LocalDate.now();
LocalDate specific = LocalDate.of(2003, Month.MARCH, 15);  // use Month enum!
LocalDate parsed = LocalDate.parse("2025-05-19");          // ISO-8601 default
LocalDate fromEpoch = LocalDate.ofEpochDay(19867);

LocalTime now = LocalTime.now();
LocalTime specific = LocalTime.of(14, 30, 0);              // 14:30:00
LocalTime parsed = LocalTime.parse("14:30:00");

ZonedDateTime vietnamNow = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
Instant instant = Instant.now();  // current UTC timestamp

// Operations (all return NEW objects — immutable!)
LocalDate nextMonth = today.plusMonths(1);
LocalDate lastYear = today.minusYears(1);
LocalDate nextMonday = today.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
LocalDate lastDayOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());
LocalDate firstDayOfYear = today.with(TemporalAdjusters.firstDayOfYear());

// Comparison
today.isBefore(nextMonth);   // true
today.isAfter(lastYear);     // true
today.isEqual(LocalDate.now()); // true

// Extracting fields
today.getYear();             // 2025
today.getMonth();            // MAY (enum)
today.getMonthValue();       // 5
today.getDayOfMonth();       // 19
today.getDayOfWeek();        // MONDAY (enum)
today.getDayOfYear();        // 139

// Amounts
Period age = Period.between(LocalDate.of(2003, 3, 15), today);
System.out.println(age.getYears() + " years old");

Duration workDay = Duration.ofHours(8);
Duration between = Duration.between(LocalTime.of(9, 0), LocalTime.of(17, 30));
between.toHours();    // 8
between.toMinutes();  // 510

// Formatting
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
String formatted = vietnamNow.format(fmt);
ZonedDateTime parsed2 = ZonedDateTime.parse("19/05/2025 14:30", 
    fmt.withZone(ZoneId.of("Asia/Ho_Chi_Minh")));

// Database interaction
// LocalDate ↔ java.sql.Date
java.sql.Date sqlDate = java.sql.Date.valueOf(today);
LocalDate back = sqlDate.toLocalDate();

// Instant ↔ java.util.Date (for legacy code)
Date legacyDate = Date.from(instant);
Instant back2 = legacyDate.toInstant();
```

---

# 13. Networking

> 📖 <https://docs.oracle.com/javase/tutorial/networking/index.html>

---

## 13.1 HttpClient (Java 11+)

```java
import java.net.http.*;
import java.net.URI;

// Create client (reusable, thread-safe)
HttpClient client = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_2)
    .followRedirects(HttpClient.Redirect.NORMAL)
    .connectTimeout(Duration.ofSeconds(10))
    .build();

// GET request
HttpRequest getRequest = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users"))
    .header("Authorization", "Bearer " + token)
    .header("Accept", "application/json")
    .timeout(Duration.ofSeconds(30))
    .GET()
    .build();

HttpResponse<String> response = client.send(getRequest,
    HttpResponse.BodyHandlers.ofString());

System.out.println(response.statusCode());  // 200
System.out.println(response.body());        // JSON string
System.out.println(response.headers().firstValue("Content-Type"));

// POST request with JSON body
String json = """
    {
        "name": "Khang",
        "email": "khang@example.com"
    }
    """;
HttpRequest postRequest = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

// Async request
CompletableFuture<HttpResponse<String>> asyncResponse =
    client.sendAsync(getRequest, HttpResponse.BodyHandlers.ofString());

asyncResponse
    .thenApply(HttpResponse::body)
    .thenAccept(System.out::println)
    .exceptionally(ex -> { ex.printStackTrace(); return null; });
```

---

# 14. Regular Expressions

> 📖 <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/regex/Pattern.html>

---

## 14.1 Regex Reference

```java
// METACHARACTERS
// .   — any character except newline
// \d  — digit [0-9]
// \D  — non-digit
// \w  — word character [a-zA-Z0-9_]
// \W  — non-word character
// \s  — whitespace [ \t\n\r\f]
// \S  — non-whitespace
// ^   — start of string (or line in MULTILINE mode)
// $   — end of string (or line in MULTILINE mode)
// \b  — word boundary
// \B  — non-word boundary

// QUANTIFIERS
// *     — 0 or more (greedy)
// +     — 1 or more (greedy)
// ?     — 0 or 1 (greedy)
// {n}   — exactly n
// {n,}  — n or more
// {n,m} — between n and m
// *?    — 0 or more (lazy/non-greedy)
// +?    — 1 or more (lazy)
// ??    — 0 or 1 (lazy)

// CHARACTER CLASSES
// [abc]   — a or b or c
// [^abc]  — NOT a, b, or c
// [a-z]   — a through z
// [a-zA-Z0-9] — alphanumeric

// GROUPS
// (abc)     — capturing group
// (?:abc)   — non-capturing group
// (?<name>abc) — named capturing group
// (?=abc)   — positive lookahead
// (?!abc)   — negative lookahead
// (?<=abc)  — positive lookbehind
// (?<!abc)  — negative lookbehind

// PRACTICAL PATTERNS
String email = "^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$";
String phone = "^(\\+84|0)(3[2-9]|5[6-9]|7[06-9]|8[1-9]|9[0-9])\\d{7}$"; // Vietnam
String url = "^https?://[\\w\\-]+(\\.[\\w\\-]+)+(/[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]*)?$";
String ipv4 = "^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$";
String date = "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$";  // YYYY-MM-DD

// USAGE
// Compile once, reuse many times (expensive to compile)
Pattern p = Pattern.compile(email, Pattern.CASE_INSENSITIVE);

// Check if whole string matches
boolean valid = p.matcher("user@example.com").matches();

// Find occurrences within string
Pattern link = Pattern.compile("<a href=\"([^\"]+)\"[^>]*>([^<]+)</a>");
Matcher m = link.matcher(htmlContent);
while (m.find()) {
    System.out.println("URL: " + m.group(1));   // capture group 1
    System.out.println("Text: " + m.group(2));   // capture group 2
    System.out.println("Full: " + m.group(0));   // entire match
}

// Named groups
Pattern date = Pattern.compile("(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})");
Matcher dm = date.matcher("2025-05-19");
if (dm.matches()) {
    System.out.println(dm.group("year"));   // 2025
}

// Replace with back-references
"hello world".replaceAll("(\\w+)", "[$1]");  // "[hello] [world]"
"2025-05-19".replaceAll("(\\d{4})-(\\d{2})-(\\d{2})", "$3/$2/$1");  // "19/05/2025"
```

---

# 15. Dependency Injection

> 📖 <https://docs.oracle.com/javaee/6/tutorial/doc/giwhl.html>

---

## 15.1 DI Patterns

```java
// THREE TYPES OF INJECTION

// 1. Constructor Injection (PREFERRED)
// - All dependencies explicit and required
// - Object is fully initialized after construction
// - Easy to unit test (just pass mocks)
// - Works with final fields
@Service
public class OrderService {
    private final OrderRepository repository;
    private final EmailService emailService;
    private final PaymentService paymentService;

    // Spring auto-injects (single constructor, no @Autowired needed)
    public OrderService(OrderRepository repository,
                        EmailService emailService,
                        PaymentService paymentService) {
        this.repository = repository;
        this.emailService = emailService;
        this.paymentService = paymentService;
    }
}

// 2. Setter Injection (for optional dependencies)
public class OrderService {
    private NotificationService notificationService;

    public void setNotificationService(NotificationService ns) {
        this.notificationService = ns;
    }
}

// 3. Field Injection (convenient but problematic)
// - Can't use final
// - Hard to unit test without Spring
// - Hides dependencies
@Service
public class OrderService {
    @Autowired  // Spring injects via reflection
    private OrderRepository repository;  // ⚠️ not recommended for production
}

// Manual DI (without framework) — shows the principle
public class Application {
    public static void main(String[] args) {
        // Compose the object graph manually
        DataSource dataSource = new PostgreSQLDataSource("jdbc:...");
        OrderRepository repo = new OrderRepositoryImpl(dataSource);
        EmailService email = new SmtpEmailService("smtp.gmail.com");
        PaymentService payment = new StripePaymentService("sk_live_...");
        OrderService service = new OrderService(repo, email, payment);

        // Everything wired manually — frameworks automate this
    }
}

// Testing with DI (mockability is the key benefit)
@Test
void testCreateOrder() {
    OrderRepository mockRepo = mock(OrderRepository.class);
    EmailService mockEmail = mock(EmailService.class);
    PaymentService mockPayment = mock(PaymentService.class);

    when(mockPayment.charge(any(), anyDouble())).thenReturn(true);

    OrderService service = new OrderService(mockRepo, mockEmail, mockPayment);
    service.createOrder(new Order(...));

    verify(mockRepo).save(any(Order.class));
    verify(mockEmail).send(anyString(), anyString());
}
```

---

# 16. I/O Operations

> 📖 <https://docs.oracle.com/javase/tutorial/essential/io/index.html>

---

## 16.1 Streams — Byte and Character

```java
// Java I/O uses the DECORATOR pattern
// Wrap streams to add functionality

// BYTE STREAMS — for binary data
InputStream  in  = new FileInputStream("input.bin");
OutputStream out = new FileOutputStream("output.bin");

// Wrap with buffer for performance (avoids system call per byte)
BufferedInputStream  bin  = new BufferedInputStream(in, 8192);   // 8KB buffer
BufferedOutputStream bout = new BufferedOutputStream(out, 8192);

// Reading bytes
int b;
while ((b = bin.read()) != -1) {      // reads 1 byte, returns 0-255 or -1 for EOF
    bout.write(b);
}

// Reading chunks (faster!)
byte[] buffer = new byte[8192];
int bytesRead;
while ((bytesRead = bin.read(buffer)) != -1) {
    bout.write(buffer, 0, bytesRead);
}
bout.flush();  // force remaining buffered bytes to output

// CHARACTER STREAMS — for text data (handles encoding)
Reader reader = new InputStreamReader(in, StandardCharsets.UTF_8);
Writer writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);

// Wrap with buffer
BufferedReader br = new BufferedReader(reader);
BufferedWriter bw = new BufferedWriter(writer);

String line;
while ((line = br.readLine()) != null) {   // reads full line, strips newline
    bw.write(line);
    bw.newLine();   // platform-independent newline
}
bw.flush();

// Reading all lines (Java 8+)
try (BufferedReader r = new BufferedReader(new FileReader("file.txt"))) {
    r.lines()                           // Stream<String>
     .filter(l -> !l.isBlank())
     .forEach(System.out::println);
}

// ⚠️ ALWAYS use try-with-resources to guarantee close()
// Not closing = file descriptor leak → eventually "too many open files" error
```

---

## 16.2 Serialization

```java
// Serialization — convert object to byte stream (for storage or network)
import java.io.*;

// Mark class as serializable
public class User implements Serializable {
    private static final long serialVersionUID = 1L;  // version control
    private String name;
    private int age;
    private transient String password;   // transient = excluded from serialization
    private static int count;           // static = excluded from serialization
}

// Serialize (write to file)
try (ObjectOutputStream oos = new ObjectOutputStream(
        new FileOutputStream("user.dat"))) {
    oos.writeObject(user);
}

// Deserialize (read from file)
try (ObjectInputStream ois = new ObjectInputStream(
        new FileInputStream("user.dat"))) {
    User loaded = (User) ois.readObject();
}

// ⚠️ serialVersionUID:
// If you add/remove fields without updating serialVersionUID,
// deserialization of old data throws InvalidClassException
// Best practice: always declare it explicitly!

// ⚠️ Security warning:
// Never deserialize data from untrusted sources!
// Deserialization gadget chains can execute arbitrary code
// Use JSON (Jackson/Gson) or protobuf instead of Java serialization for network
```

---

# 17. File Operations

> 📖 <https://docs.oracle.com/javase/tutorial/essential/io/fileio.html>

---

## 17.1 NIO.2 Path and Files

```java
import java.nio.file.*;
import java.nio.charset.StandardCharsets;

// Path — represents a file or directory path (immutable)
Path absolute = Path.of("/home/khang/projects/myapp");
Path relative = Path.of("src", "main", "java");           // cross-platform!
Path home = Path.of(System.getProperty("user.home"));

// Path operations
path.getFileName();          // just the filename: "java"
path.getParent();            // parent path
path.getRoot();              // "/" on Linux, "C:\" on Windows
path.toAbsolutePath();       // resolve relative to current working dir
path.normalize();            // resolve ".." and "." components
path.resolve("subdir");      // append: path/subdir
path.relativize(other);      // relative path from this to other
path.startsWith(other);      // true if this starts with other
path.toFile();               // convert to java.io.File (legacy interop)

// Files utility class — all file operations
// Check
Files.exists(path)
Files.notExists(path)
Files.isDirectory(path)
Files.isRegularFile(path)
Files.isReadable(path)
Files.isWritable(path)
Files.isExecutable(path)
Files.isHidden(path)
Files.size(path)                      // bytes
Files.getLastModifiedTime(path)

// Read (whole file, small files only!)
String text = Files.readString(path, StandardCharsets.UTF_8);  // Java 11+
List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
byte[] bytes = Files.readAllBytes(path);

// Write (overwrites by default)
Files.writeString(path, content, StandardCharsets.UTF_8);
Files.write(path, lines, StandardCharsets.UTF_8,
    StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

// Append
Files.writeString(path, newContent, StandardCharsets.UTF_8,
    StandardOpenOption.CREATE, StandardOpenOption.APPEND);

// Create
Files.createFile(path);                        // fails if exists
Files.createDirectories(path);                 // creates all missing parents
Files.createTempFile("prefix", ".tmp");        // in system temp dir
Files.createTempDirectory("myapp-");

// Copy and Move
Files.copy(src, dst);                          // fails if dst exists
Files.copy(src, dst, StandardCopyOption.REPLACE_EXISTING);
Files.copy(src, dst, StandardCopyOption.COPY_ATTRIBUTES);  // preserve metadata
Files.move(src, dst, StandardCopyOption.ATOMIC_MOVE);      // atomic rename

// Delete
Files.delete(path);                            // throws NoSuchFileException
Files.deleteIfExists(path);                    // returns boolean

// Directory listing
try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
    for (Path entry : stream) {
        System.out.println(entry.getFileName());
    }
}

// Glob patterns
try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir, "*.java")) {
    stream.forEach(System.out::println);
}

// Recursive walk
Files.walk(startPath)                          // depth-first
     .filter(p -> p.toString().endsWith(".java"))
     .forEach(System.out::println);

Files.walkFileTree(startPath, new SimpleFileVisitor<Path>() {
    @Override
    public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
        System.out.println(file);
        return FileVisitResult.CONTINUE;
    }
    @Override
    public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) {
        System.out.println("Dir: " + dir);
        return FileVisitResult.CONTINUE;
    }
});

// Large file reading (line by line, memory efficient)
try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
    String line;
    while ((line = reader.readLine()) != null) {
        process(line);
    }
}

// Or as Stream<String> (auto-closes reader on close/error)
try (Stream<String> lines = Files.lines(path, StandardCharsets.UTF_8)) {
    lines.filter(l -> l.contains("ERROR"))
         .forEach(System.out::println);
}

// Watch Service — monitor directory for changes
WatchService watchService = FileSystems.getDefault().newWatchService();
Path dir = Path.of("/tmp/watched");

dir.register(watchService,
    StandardWatchEventKinds.ENTRY_CREATE,
    StandardWatchEventKinds.ENTRY_MODIFY,
    StandardWatchEventKinds.ENTRY_DELETE);

while (true) {
    WatchKey key = watchService.take();   // blocks until event
    for (WatchEvent<?> event : key.pollEvents()) {
        WatchEvent.Kind<?> kind = event.kind();
        Path changed = (Path) event.context();
        System.out.println(kind.name() + ": " + changed);
    }
    boolean valid = key.reset();
    if (!valid) break;   // directory no longer accessible
}
```

---

## ⚙️ Java Version Quick Reference

| Java | Key Features |
|------|-------------|
| 8 | Lambda, Stream, Optional, default interface methods, java.time |
| 9 | Modules, jshell, private interface methods |
| 10 | `var` local variables |
| 11 | HttpClient stable, String.isBlank/lines/strip, Files.readString |
| 14 | Records (preview), switch expressions stable, NullPointerException messages |
| 15 | Text blocks (multiline strings) |
| 16 | Records stable, instanceof pattern matching |
| 17 | LTS release, sealed classes stable |
| 19-20 | Virtual Threads (preview), structured concurrency (preview) |
| 21 | LTS, Virtual Threads stable, pattern matching in switch, sequenced collections |

---

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Java SE 21 API Docs | <https://docs.oracle.com/en/java/se/21/docs/api/> |
| The Java™ Tutorials | <https://docs.oracle.com/javase/tutorial/> |
| Language Basics | <https://docs.oracle.com/javase/tutorial/java/nutsandbolts/> |
| OOP Concepts | <https://docs.oracle.com/javase/tutorial/java/concepts/> |
| Interfaces & Inheritance | <https://docs.oracle.com/javase/tutorial/java/IandI/> |
| Generics | <https://docs.oracle.com/javase/tutorial/java/generics/> |
| Collections | <https://docs.oracle.com/javase/tutorial/collections/> |
| Lambda Expressions | <https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html> |
| Stream API | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/stream/Stream.html> |
| Exception Handling | <https://docs.oracle.com/javase/tutorial/essential/exceptions/> |
| Concurrency | <https://docs.oracle.com/javase/tutorial/essential/concurrency/> |
| Virtual Threads | <https://docs.oracle.com/en/java/se/21/core/virtual-threads.html> |
| I/O and NIO.2 | <https://docs.oracle.com/javase/tutorial/essential/io/> |
| Networking | <https://docs.oracle.com/javase/tutorial/networking/> |
| Regex Pattern | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/regex/Pattern.html> |
| Date & Time | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/time/package-summary.html> |
| Security/Crypto | <https://docs.oracle.com/en/java/se/17/security/java-cryptography-architecture-jca-reference-guide.html> |
| Annotations | <https://docs.oracle.com/javase/tutorial/java/annotations/> |
| Records | <https://docs.oracle.com/en/java/se/16/language/records.html> |
| Modules | <https://dev.java/learn/modules/> |
| String API | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/lang/String.html> |
| Collections Framework | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Collection.html> |
| CompletableFuture | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/concurrent/CompletableFuture.html> |
| Optional | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Optional.html> |

---

*Study tip: For each section, read the summary → try the code → break things intentionally → read the docs link. Understanding WHY beats memorizing WHAT.*
