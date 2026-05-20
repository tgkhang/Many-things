# ☕ Java Core — Complete Concept Overview
> Based on [roadmap.sh/java](https://roadmap.sh/java) | Deep-dive reference for all core Java topics

---

## 📚 Table of Contents

1. [Learn the Basics](#1-learn-the-basics)
2. [Object-Oriented Programming (OOP)](#2-object-oriented-programming-oop)
3. [More About OOP](#3-more-about-oop)
4. [Exception Handling](#4-exception-handling)
5. [Lambda Expressions](#5-lambda-expressions)
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

## 1. Learn the Basics

> 📖 Docs: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/index.html

### 1.1 Basic Syntax

Java is a **statically typed**, **compiled**, **object-oriented** language running on the JVM.

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

**Key rules:**
- Every Java program must have at least one `class`
- The entry point is always `public static void main(String[] args)`
- Statements end with `;`
- Case-sensitive language
- File name must match the `public class` name

---

### 1.2 Lifecycle of a Program

```
Source Code (.java)
      ↓  [javac compiler]
Bytecode (.class)
      ↓  [JVM - Java Virtual Machine]
Machine Execution
```

| Component | Role |
|-----------|------|
| **JDK** (Java Development Kit) | Full dev toolkit: compiler + JRE |
| **JRE** (Java Runtime Environment) | Runtime: JVM + core libraries |
| **JVM** (Java Virtual Machine) | Executes bytecode on any OS |

> "Write Once, Run Anywhere" — Java's core promise via the JVM.

---

### 1.3 Data Types

**Primitive types (8 total):**

| Type | Size | Default | Example |
|------|------|---------|---------|
| `byte` | 8-bit | 0 | `-128` to `127` |
| `short` | 16-bit | 0 | `-32,768` to `32,767` |
| `int` | 32-bit | 0 | Most common integer |
| `long` | 64-bit | 0L | Big integers, suffix `L` |
| `float` | 32-bit | 0.0f | Decimal, suffix `f` |
| `double` | 64-bit | 0.0d | Precise decimal |
| `char` | 16-bit | `\u0000` | Single character `'A'` |
| `boolean` | 1-bit | `false` | `true` / `false` |

**Reference types:** Objects, Arrays, Strings — stored as memory references (heap).

---

### 1.4 Variables and Scopes

```java
int globalLike = 10;          // field (class level)

public void method() {
    int localVar = 5;         // local variable
    {
        int blockVar = 1;     // block scope — only lives here
    }
    // blockVar not accessible here
}
```

- **Local scope**: inside a method/block
- **Instance scope**: class fields, one per object
- **Class/Static scope**: `static` fields, shared across all instances

---

### 1.5 Type Casting

```java
// Widening (automatic — safe, no data loss)
int i = 100;
long l = i;       // int → long
double d = l;     // long → double

// Narrowing (manual — may lose data)
double pi = 3.14;
int truncated = (int) pi;   // → 3 (decimal lost)
```

> ⚠️ Narrowing requires explicit cast `(type)` and may truncate data.

---

### 1.6 Strings and Methods

> 📖 Docs: https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/lang/String.html

```java
String name = "Khang";

// Common methods
name.length();             // 5
name.toUpperCase();        // "KHANG"
name.toLowerCase();        // "khang"
name.substring(0, 3);      // "Kha"
name.contains("ang");      // true
name.replace("ang", "");   // "Kh"
name.trim();               // removes whitespace
name.split(",");           // String[]
name.charAt(0);            // 'K'
name.equals("Khang");      // true
name.equalsIgnoreCase("khang"); // true
String.format("Hi %s", name);  // "Hi Khang"
```

> ⚠️ `String` is **immutable** — every modification creates a new object. Use `StringBuilder` for heavy string manipulation.

```java
StringBuilder sb = new StringBuilder();
sb.append("Hello").append(" ").append("World");
String result = sb.toString(); // "Hello World"
```

---

### 1.7 Math Operations

> 📖 Docs: https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/lang/Math.html

```java
Math.abs(-5);       // 5
Math.max(3, 7);     // 7
Math.min(3, 7);     // 3
Math.pow(2, 10);    // 1024.0
Math.sqrt(16);      // 4.0
Math.ceil(3.2);     // 4.0
Math.floor(3.9);    // 3.0
Math.round(3.5);    // 4
Math.random();      // 0.0 to 1.0
Math.PI;            // 3.141592...
```

---

### 1.8 Arrays

> 📖 Docs: https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Arrays.html

```java
// Declaration and initialization
int[] nums = new int[5];           // [0, 0, 0, 0, 0]
int[] scores = {90, 85, 78, 95};   // literal initialization

// Access and modify
scores[0] = 100;
int len = scores.length;           // 4

// 2D Arrays
int[][] matrix = new int[3][3];
int[][] grid = {{1,2},{3,4},{5,6}};

// Utility methods (java.util.Arrays)
Arrays.sort(scores);               // sorts in-place
Arrays.fill(nums, -1);             // fills all with -1
int[] copy = Arrays.copyOf(scores, scores.length);
System.out.println(Arrays.toString(scores));
```

---

### 1.9 Conditionals

```java
// if-else
if (age >= 18) {
    System.out.println("Adult");
} else if (age >= 13) {
    System.out.println("Teen");
} else {
    System.out.println("Child");
}

// switch statement
switch (day) {
    case "MON": System.out.println("Monday"); break;
    case "TUE": System.out.println("Tuesday"); break;
    default: System.out.println("Other");
}

// switch expression (Java 14+)
String result = switch (day) {
    case "MON" -> "Monday";
    case "TUE" -> "Tuesday";
    default    -> "Other";
};

// Ternary
String label = age >= 18 ? "Adult" : "Minor";
```

---

### 1.10 Loops

```java
// for loop
for (int i = 0; i < 5; i++) { }

// enhanced for (for-each)
for (int n : nums) { }

// while loop
int i = 0;
while (i < 10) { i++; }

// do-while (runs at least once)
do {
    i++;
} while (i < 10);

// break and continue
for (int j = 0; j < 10; j++) {
    if (j == 5) break;     // exit loop
    if (j % 2 == 0) continue; // skip even
}
```

---

## 2. Object-Oriented Programming (OOP)

> 📖 Docs: https://docs.oracle.com/javase/tutorial/java/concepts/index.html

### 2.1 Classes and Objects

```java
// Class = blueprint
public class Car {
    // Fields (attributes)
    String brand;
    int year;

    // Constructor
    public Car(String brand, int year) {
        this.brand = brand;
        this.year = year;
    }

    // Method
    public void drive() {
        System.out.println(brand + " is driving!");
    }
}

// Object = instance of a class
Car myCar = new Car("Toyota", 2022);
myCar.drive();  // Toyota is driving!
```

---

### 2.2 Attributes and Methods

- **Instance fields**: belong to each object
- **Instance methods**: operate on object state
- **Constructor**: special method called on `new`, no return type, same name as class
- **`this`**: refers to the current object instance

```java
public class BankAccount {
    private double balance;  // instance field

    public BankAccount(double initialBalance) {
        this.balance = initialBalance;
    }

    public void deposit(double amount) {
        this.balance += amount;
    }

    public double getBalance() {
        return this.balance;
    }
}
```

---

### 2.3 Access Specifiers

| Modifier | Same Class | Same Package | Subclass | Everywhere |
|----------|-----------|--------------|----------|------------|
| `public` | ✅ | ✅ | ✅ | ✅ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| *(default)* | ✅ | ✅ | ❌ | ❌ |
| `private` | ✅ | ❌ | ❌ | ❌ |

> Best practice: fields `private`, expose via `public` getters/setters (Encapsulation).

---

### 2.4 Static Keyword

```java
public class Counter {
    private static int count = 0;  // shared across ALL instances

    public Counter() {
        count++;
    }

    public static int getCount() {  // called on class, not object
        return count;
    }

    // Static block — runs once when class is loaded
    static {
        System.out.println("Counter class loaded");
    }
}

Counter.getCount();  // called without an object
```

- `static` fields: one copy per class
- `static` methods: no access to `this` or instance fields
- `static` blocks: class initialization logic

---

### 2.5 Final Keyword

```java
final int MAX = 100;         // constant variable — cannot reassign

final class ImmutableClass { }  // cannot be subclassed

class Parent {
    final void show() { }    // cannot be overridden in subclass
}
```

---

### 2.6 Nested Classes

```java
// Static nested class
class Outer {
    static class StaticNested { }  // can exist without Outer instance
}

// Inner (non-static) class
class Outer {
    class Inner { }  // needs Outer instance to instantiate
}

// Anonymous class
Runnable r = new Runnable() {
    @Override
    public void run() {
        System.out.println("Running!");
    }
};

// Local class (inside a method)
void method() {
    class Local {
        void greet() { System.out.println("Hi!"); }
    }
}
```

---

### 2.7 Packages

```java
// Declare package (must be first line)
package com.company.project;

// Import specific class
import java.util.ArrayList;

// Import all classes in package
import java.util.*;

// Fully qualified name (no import needed)
java.util.ArrayList<String> list = new java.util.ArrayList<>();
```

> Packages organize code, avoid name conflicts, and control access.

---

## 3. More About OOP

> 📖 Docs: https://docs.oracle.com/javase/tutorial/java/IandI/index.html

### 3.1 Object Lifecycle

```
new → Allocation → Initialization → Usage → Unreachable → GC
```

- Objects are created via `new` on the **heap**
- JVM's **Garbage Collector (GC)** automatically reclaims unreachable objects
- `finalize()` is deprecated — use `try-with-resources` instead

---

### 3.2 Inheritance

```java
public class Animal {
    String name;
    public void eat() { System.out.println("Eating"); }
}

public class Dog extends Animal {    // single inheritance
    public void bark() { System.out.println("Woof!"); }
}

Dog d = new Dog();
d.eat();    // inherited from Animal
d.bark();   // Dog's own method
```

- Java supports **single inheritance** for classes (no multiple class inheritance)
- `super` keyword: access parent class members
- All classes implicitly extend `Object`

```java
public class Dog extends Animal {
    public Dog(String name) {
        super(name);   // call parent constructor
    }

    @Override
    public void eat() {
        super.eat();   // call parent method
        System.out.println("Dog eats specifically");
    }
}
```

---

### 3.3 Abstraction

```java
// Abstract class — cannot be instantiated
public abstract class Shape {
    abstract double area();     // abstract method — no body

    public void describe() {    // concrete method
        System.out.println("I am a shape with area: " + area());
    }
}

public class Circle extends Shape {
    double radius;
    Circle(double r) { this.radius = r; }

    @Override
    double area() { return Math.PI * radius * radius; }
}
```

> Abstract class = partial implementation. Use when subclasses share common logic but differ in specifics.

---

### 3.4 Method Chaining

```java
public class Builder {
    private String name;
    private int age;

    public Builder setName(String name) {
        this.name = name;
        return this;   // return 'this' enables chaining
    }

    public Builder setAge(int age) {
        this.age = age;
        return this;
    }
}

Builder b = new Builder()
    .setName("Khang")
    .setAge(21);   // fluent interface
```

---

### 3.5 Encapsulation

```java
public class Person {
    private String name;    // private field
    private int age;

    // Getter
    public String getName() { return name; }

    // Setter with validation
    public void setAge(int age) {
        if (age >= 0 && age <= 150) {
            this.age = age;
        }
    }
}
```

> Hides internal state. Only expose what's necessary. Prevents invalid state.

---

### 3.6 Interfaces

```java
public interface Flyable {
    int MAX_ALTITUDE = 10000;    // implicitly public static final

    void fly();                  // implicitly public abstract

    default void land() {        // default method (Java 8+)
        System.out.println("Landing...");
    }

    static void info() {         // static method (Java 8+)
        System.out.println("Flyable interface");
    }
}

// A class can implement MULTIPLE interfaces
public class Bird extends Animal implements Flyable, Swimmable {
    @Override
    public void fly() { System.out.println("Bird flying"); }
}
```

> Interface = pure contract. Enables multiple "inheritance of type".

| | Abstract Class | Interface |
|---|---|---|
| Instantiate | ❌ | ❌ |
| Multiple | ❌ | ✅ |
| State (fields) | ✅ | ❌ (constants only) |
| Constructor | ✅ | ❌ |
| Default methods | ✅ | ✅ (Java 8+) |

---

### 3.7 Enums

> 📖 Docs: https://docs.oracle.com/javase/tutorial/java/javaOO/enum.html

```java
public enum Day {
    MON, TUE, WED, THU, FRI, SAT, SUN;
}

// Enum with fields and methods
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS  (4.869e+24, 6.0518e6);

    private final double mass;
    private final double radius;

    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    double surfaceGravity() {
        final double G = 6.67300E-11;
        return G * mass / (radius * radius);
    }
}

// Usage
Day today = Day.MON;
switch (today) {
    case MON -> System.out.println("Monday");
    default  -> System.out.println("Other day");
}
```

---

### 3.8 Record (Java 16+)

> 📖 Docs: https://docs.oracle.com/en/java/se/16/language/records.html

```java
// Concise immutable data class
public record Point(int x, int y) { }

// Compiler auto-generates: constructor, getters, equals, hashCode, toString
Point p = new Point(3, 4);
p.x();  // 3
p.y();  // 4
System.out.println(p);  // Point[x=3, y=4]
```

> Records replace verbose POJOs/DTOs. Immutable by default.

---

### 3.9 Method Overloading / Overriding

```java
// Overloading — same name, different parameters (compile-time polymorphism)
public class Calculator {
    int add(int a, int b)          { return a + b; }
    double add(double a, double b) { return a + b; }  // different param types
    int add(int a, int b, int c)   { return a + b + c; } // different count
}

// Overriding — subclass redefines parent method (runtime polymorphism)
class Animal { void speak() { System.out.println("..."); } }
class Cat extends Animal {
    @Override
    void speak() { System.out.println("Meow!"); }  // same signature
}
```

---

### 3.10 Initializer Block

```java
public class Demo {
    int value;

    // Instance initializer block — runs before every constructor
    {
        value = 10;
        System.out.println("Instance block ran");
    }

    // Static initializer block — runs once when class loads
    static {
        System.out.println("Static block ran");
    }

    Demo() { System.out.println("Constructor ran"); }
}
// Output order: Static block → Instance block → Constructor
```

---

### 3.11 Static vs Dynamic Binding

```java
// Static Binding (compile-time) — resolved by compiler
// Applies to: static, private, final methods
Animal a = new Animal();
a.staticMethod();   // resolved at compile time

// Dynamic Binding (runtime) — resolved by JVM
// Applies to: overridden instance methods
Animal ref = new Dog();   // reference type = Animal, object type = Dog
ref.speak();              // calls Dog's speak() at RUNTIME → polymorphism
```

---

### 3.12 Pass by Value / Pass by Reference

> ⚠️ Java is **ALWAYS pass by value**

```java
// Primitive — copy of value is passed
void double(int x) { x = x * 2; }  // original unchanged
int n = 5;
double(n);
System.out.println(n); // still 5

// Object — copy of REFERENCE is passed (not the object itself)
void rename(Person p) { p.name = "New Name"; }  // modifies the same object
Person person = new Person("Khang");
rename(person);
System.out.println(person.name); // "New Name"
// BUT reassigning p inside method doesn't affect original reference
```

---

## 4. Exception Handling

> 📖 Docs: https://docs.oracle.com/javase/tutorial/essential/exceptions/index.html

```java
// Exception hierarchy
Throwable
├── Error (JVM errors — don't catch these)
│   └── OutOfMemoryError, StackOverflowError
└── Exception
    ├── Checked (must handle at compile time)
    │   └── IOException, SQLException
    └── RuntimeException (unchecked)
        └── NullPointerException, ArrayIndexOutOfBoundsException
```

```java
// try-catch-finally
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("Math error: " + e.getMessage());
} catch (Exception e) {
    System.out.println("General error");
} finally {
    System.out.println("Always runs — cleanup here");
}

// try-with-resources (auto-closes resources implementing AutoCloseable)
try (FileReader fr = new FileReader("file.txt")) {
    // file auto-closed after block
} catch (IOException e) {
    e.printStackTrace();
}

// Custom exception
public class InsufficientFundsException extends Exception {
    public InsufficientFundsException(String message) {
        super(message);
    }
}

// throw vs throws
public void withdraw(double amount) throws InsufficientFundsException {
    if (amount > balance) {
        throw new InsufficientFundsException("Not enough funds");
    }
}
```

---

## 5. Lambda Expressions

> 📖 Docs: https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html

```java
// Syntax: (parameters) -> expression  OR  (parameters) -> { body }

// Before Java 8 — anonymous class
Comparator<String> comp = new Comparator<String>() {
    @Override
    public int compare(String a, String b) { return a.compareTo(b); }
};

// With lambda (Java 8+)
Comparator<String> comp = (a, b) -> a.compareTo(b);

// Functional interfaces (one abstract method)
Runnable r = () -> System.out.println("Running!");
Predicate<Integer> isEven = n -> n % 2 == 0;
Function<String, Integer> len = s -> s.length();
Consumer<String> printer = s -> System.out.println(s);
Supplier<String> hello = () -> "Hello!";

// Stream API with lambdas
List<String> names = List.of("Alice", "Bob", "Charlie");
names.stream()
     .filter(n -> n.length() > 3)
     .map(String::toUpperCase)       // method reference
     .sorted()
     .forEach(System.out::println);

// Method references
names.forEach(System.out::println);       // instance method
List.of(1,2,3).stream().map(Math::sqrt); // static method
```

> 📖 Stream API: https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/stream/Stream.html

---

## 6. Annotations

> 📖 Docs: https://docs.oracle.com/javase/tutorial/java/annotations/index.html

```java
// Built-in annotations
@Override          // tells compiler this overrides a parent method
@Deprecated        // marks as outdated
@SuppressWarnings("unchecked")  // suppresses compiler warnings
@FunctionalInterface   // ensures interface has exactly one abstract method

// Custom annotation
@interface MyAnnotation {
    String value() default "default";
    int count() default 1;
}

// Annotation with retention/target
@Retention(RetentionPolicy.RUNTIME)   // available at runtime via reflection
@Target(ElementType.METHOD)           // only applicable to methods
public @interface Log { }

// Common annotations in frameworks
@Override
@Deprecated
@SuppressWarnings
// Spring: @Component, @Service, @Autowired, @RestController
// JPA: @Entity, @Table, @Column, @Id
// Lombok: @Data, @Builder, @NoArgsConstructor
```

---

## 7. Modules (Java 9+)

> 📖 Docs: https://docs.oracle.com/javase/9/docs/api/java/lang/module/package-summary.html

```java
// module-info.java — placed at root of module source
module com.myapp {
    requires java.sql;          // depends on java.sql module
    requires transitive java.logging;  // re-exports dependency

    exports com.myapp.api;          // makes package public
    exports com.myapp.internal to com.myapp.test;  // qualified export

    opens com.myapp.model;          // allows reflection (for frameworks)
    uses com.myapp.spi.Service;     // service consumer
    provides com.myapp.spi.Service  // service provider
        with com.myapp.impl.ServiceImpl;
}
```

> Modules enforce strong encapsulation beyond `private` — packages not `exports`ed are invisible to other modules.

---

## 8. Optionals

> 📖 Docs: https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Optional.html

```java
// Avoid NullPointerException with Optional<T>
Optional<String> name = Optional.of("Khang");
Optional<String> empty = Optional.empty();
Optional<String> nullable = Optional.ofNullable(null);  // safe with null

// Accessing values
name.get();                          // "Khang" (throws if empty)
name.isPresent();                    // true
name.isEmpty();                      // false
name.orElse("default");              // "Khang"
name.orElseGet(() -> "computed");    // lazy default
name.orElseThrow(RuntimeException::new); // throw if empty

// Transforming
name.map(String::toUpperCase);       // Optional["KHANG"]
name.filter(n -> n.length() > 3);   // Optional["Khang"]
name.flatMap(n -> findUser(n));      // chain Optionals

// Consuming
name.ifPresent(n -> System.out.println(n));
name.ifPresentOrElse(
    n -> System.out.println("Found: " + n),
    () -> System.out.println("Not found")
);
```

---

## 9. Collections Framework

> 📖 Docs: https://docs.oracle.com/javase/tutorial/collections/index.html

### 9.1 Array vs ArrayList

```java
// Array — fixed size, fast, primitive support
int[] arr = new int[5];
arr[0] = 10;

// ArrayList — dynamic size, only objects (autoboxing for primitives)
ArrayList<Integer> list = new ArrayList<>();
list.add(10);
list.add(20);
list.get(0);      // 10
list.size();      // 2
list.remove(0);   // removes index 0
list.contains(20); // true
```

---

### 9.2 Set

```java
// Set — no duplicates, unordered (HashSet) or ordered
Set<String> hashSet = new HashSet<>();   // O(1) ops, no order
Set<String> linkedSet = new LinkedHashSet<>();  // insertion order
Set<String> treeSet = new TreeSet<>();   // sorted (natural order)

hashSet.add("apple");
hashSet.add("apple");  // duplicate ignored
hashSet.size();        // 1
```

---

### 9.3 Map

```java
// Map — key-value pairs, unique keys
Map<String, Integer> hashMap = new HashMap<>();     // O(1), no order
Map<String, Integer> linkedMap = new LinkedHashMap<>(); // insertion order
Map<String, Integer> treeMap = new TreeMap<>();     // sorted by key

hashMap.put("age", 21);
hashMap.get("age");          // 21
hashMap.getOrDefault("x", 0); // 0
hashMap.containsKey("age");   // true
hashMap.remove("age");
hashMap.forEach((k, v) -> System.out.println(k + "=" + v));

// Iterating
for (Map.Entry<String, Integer> entry : hashMap.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}
```

---

### 9.4 Queue and Dequeue

```java
// Queue — FIFO (First In, First Out)
Queue<String> queue = new LinkedList<>();
queue.offer("first");   // add to tail
queue.offer("second");
queue.peek();           // "first" (look at head, don't remove)
queue.poll();           // "first" (remove head)

// PriorityQueue — ordered by natural order or Comparator
PriorityQueue<Integer> pq = new PriorityQueue<>();  // min-heap
pq.offer(5); pq.offer(1); pq.offer(3);
pq.poll();  // 1 (smallest)

// Deque — double-ended queue (stack + queue)
Deque<String> deque = new ArrayDeque<>();
deque.offerFirst("front");  // add to front
deque.offerLast("back");    // add to back
deque.pollFirst();           // remove from front
deque.pollLast();            // remove from back
```

---

### 9.5 Stack

```java
// Stack — LIFO (Last In, First Out)
// Legacy way (thread-safe but slow):
Stack<Integer> stack = new Stack<>();
stack.push(1);
stack.push(2);
stack.pop();     // 2
stack.peek();    // 1

// Modern way — use Deque as stack:
Deque<Integer> stack2 = new ArrayDeque<>();
stack2.push(1);
stack2.push(2);
stack2.pop();    // 2
stack2.peek();   // 1
```

---

### 9.6 Iterator

```java
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
Iterator<String> it = list.iterator();

while (it.hasNext()) {
    String item = it.next();
    if (item.equals("b")) {
        it.remove();  // safe removal during iteration
    }
}

// ListIterator — bidirectional for Lists
ListIterator<String> lit = list.listIterator();
while (lit.hasNext()) { lit.next(); }
while (lit.hasPrevious()) { lit.previous(); }
```

---

### 9.7 Generic Collections

```java
// Generics — type-safe containers
public class Box<T> {
    private T content;
    public void set(T item) { this.content = item; }
    public T get() { return content; }
}

Box<String> stringBox = new Box<>();
stringBox.set("Hello");

// Bounded type parameters
public <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}

// Wildcards
List<?> unknown = new ArrayList<String>();    // any type
List<? extends Number> numbers;               // Number or subtype
List<? super Integer> integers;              // Integer or supertype
```

---

## 10. Concurrency

> 📖 Docs: https://docs.oracle.com/javase/tutorial/essential/concurrency/index.html

### 10.1 Threads

```java
// Way 1 — extend Thread
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread: " + Thread.currentThread().getName());
    }
}
new MyThread().start();

// Way 2 — implement Runnable (preferred)
Runnable task = () -> System.out.println("Running!");
Thread t = new Thread(task);
t.start();

// Way 3 — ExecutorService (best practice)
ExecutorService executor = Executors.newFixedThreadPool(4);
executor.submit(() -> System.out.println("Task executed"));
executor.shutdown();
```

---

### 10.2 Java Memory Model (JMM)

The JMM defines how threads interact through memory:
- Each thread has its own **local cache** (CPU register/L1 cache)
- Main memory is shared between threads
- **Visibility problem**: one thread's write may not be visible to another

```
Thread 1: write x=1 → local cache → (eventually) main memory
Thread 2: read x    → local cache → (may see stale value!)
```

Key concepts: **visibility**, **atomicity**, **ordering (happens-before)**

---

### 10.3 Volatile Keyword

```java
public class Flag {
    private volatile boolean running = true;   // always read from main memory

    public void stop() {
        running = false;   // write immediately to main memory
    }

    public void run() {
        while (running) {  // always see latest value
            // work...
        }
    }
}
```

> `volatile` ensures **visibility** but NOT **atomicity**. For atomic ops use `AtomicInteger`, `synchronized`, or `Lock`.

```java
// synchronized — mutual exclusion
synchronized void increment() { count++; }

// Atomic classes
AtomicInteger atomicCount = new AtomicInteger(0);
atomicCount.incrementAndGet();  // thread-safe
```

---

### 10.4 Virtual Threads (Java 21+)

> 📖 Docs: https://docs.oracle.com/en/java/se/21/core/virtual-threads.html

```java
// Traditional platform thread — expensive, maps 1:1 to OS thread
Thread t = new Thread(() -> doWork());

// Virtual thread — lightweight, managed by JVM (Project Loom)
Thread vt = Thread.ofVirtual().start(() -> doWork());

// Via ExecutorService — ideal for high-throughput I/O
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        executor.submit(() -> handleRequest());  // 100k virtual threads!
    }
}
```

| | Platform Thread | Virtual Thread |
|---|---|---|
| OS thread | 1:1 | Many:1 (multiplexed) |
| Memory | ~1MB | ~few KB |
| Count limit | ~thousands | ~millions |
| Best for | CPU-bound | I/O-bound |

---

## 11. Cryptography

> 📖 Docs: https://docs.oracle.com/en/java/se/17/security/java-cryptography-architecture-jca-reference-guide.html

```java
import java.security.*;
import javax.crypto.*;

// Hashing — one-way (no key)
MessageDigest md = MessageDigest.getInstance("SHA-256");
byte[] hash = md.digest("password".getBytes());

// Symmetric encryption (AES)
KeyGenerator kg = KeyGenerator.getInstance("AES");
kg.init(256);
SecretKey key = kg.generateKey();

Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
cipher.init(Cipher.ENCRYPT_MODE, key);
byte[] encrypted = cipher.doFinal("secret".getBytes());

// Asymmetric (RSA)
KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
kpg.initialize(2048);
KeyPair pair = kpg.generateKeyPair();
PublicKey pub = pair.getPublic();
PrivateKey priv = pair.getPrivate();

// Message Authentication Code (HMAC)
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(key);
byte[] hmac = mac.doFinal("message".getBytes());
```

---

## 12. Date and Time

> 📖 Docs: https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/time/package-summary.html

```java
import java.time.*;
import java.time.format.*;

// Modern API (Java 8+) — java.time (immutable, thread-safe)
LocalDate today = LocalDate.now();          // 2025-05-19
LocalTime now = LocalTime.now();            // 10:35:00
LocalDateTime dt = LocalDateTime.now();     // 2025-05-19T10:35:00
ZonedDateTime zdt = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));

// Creating specific dates
LocalDate birthday = LocalDate.of(2003, 5, 19);
LocalTime midnight = LocalTime.of(0, 0, 0);

// Date arithmetic
LocalDate nextWeek = today.plusDays(7);
LocalDate lastYear = today.minusYears(1);
Period age = Period.between(birthday, today);
System.out.println("Age: " + age.getYears());

// Formatting
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
String formatted = today.format(fmt);         // "19/05/2025"
LocalDate parsed = LocalDate.parse("19/05/2025", fmt);

// Duration (time-based) vs Period (date-based)
Duration duration = Duration.ofHours(2).plusMinutes(30);
```

---

## 13. Networking

> 📖 Docs: https://docs.oracle.com/javase/tutorial/networking/index.html

```java
import java.net.*;
import java.io.*;

// TCP Socket (Client)
try (Socket socket = new Socket("localhost", 8080);
     PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
     BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {
    out.println("Hello Server");
    String response = in.readLine();
}

// TCP Server
try (ServerSocket server = new ServerSocket(8080)) {
    while (true) {
        Socket client = server.accept();   // blocks until connection
        new Thread(() -> handleClient(client)).start();
    }
}

// HTTP with HttpClient (Java 11+)
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/data"))
    .header("Content-Type", "application/json")
    .GET()
    .build();
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());

// URL utility
URL url = new URL("https://example.com/path?q=java");
System.out.println(url.getHost());     // example.com
System.out.println(url.getPath());     // /path
System.out.println(url.getQuery());    // q=java
```

---

## 14. Regular Expressions

> 📖 Docs: https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/regex/Pattern.html

```java
import java.util.regex.*;

String text = "Contact: khang@email.com or dev@test.org";

// Test if matches
boolean valid = text.matches(".*@.*\\..*");  // true

// Pattern and Matcher — more powerful
Pattern emailPattern = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
Matcher matcher = emailPattern.matcher(text);

while (matcher.find()) {
    System.out.println("Found: " + matcher.group());  // finds all emails
}

// Replace
String result = text.replaceAll("\\d+", "NUM");  // replace all numbers

// Split
String[] parts = "a,b,,c".split(",");  // ["a", "b", "", "c"]
String[] noBlanks = "a,b,,c".split(",+");  // ["a", "b", "c"]

// Capture groups
Pattern datePattern = Pattern.compile("(\\d{4})-(\\d{2})-(\\d{2})");
Matcher m = datePattern.matcher("Today is 2025-05-19");
if (m.find()) {
    System.out.println("Year: " + m.group(1));   // 2025
    System.out.println("Month: " + m.group(2));  // 05
}
```

---

## 15. Dependency Injection

> 📖 Docs: https://docs.oracle.com/javaee/6/tutorial/doc/giwhl.html

DI is a design pattern where dependencies are **provided from outside** rather than created internally.

```java
// WITHOUT DI — tightly coupled
public class OrderService {
    private EmailService emailService = new EmailService();  // hard dependency
}

// WITH DI — loosely coupled
public class OrderService {
    private final EmailService emailService;

    // Constructor injection (preferred)
    public OrderService(EmailService emailService) {
        this.emailService = emailService;
    }
}

// Usage
EmailService email = new EmailService();
OrderService order = new OrderService(email);  // inject from outside
```

```java
// DI with interfaces — maximum flexibility
public interface NotificationService {
    void notify(String message);
}

public class EmailNotification implements NotificationService { ... }
public class SmsNotification implements NotificationService { ... }

public class OrderService {
    private final NotificationService notifier;  // depends on abstraction

    public OrderService(NotificationService notifier) {
        this.notifier = notifier;
    }
}

// Swap implementations without changing OrderService
OrderService withEmail = new OrderService(new EmailNotification());
OrderService withSms = new OrderService(new SmsNotification());
```

> In Spring Framework, `@Autowired`, `@Component`, `@Service` automate DI via IoC container.

---

## 16. I/O Operations

> 📖 Docs: https://docs.oracle.com/javase/tutorial/essential/io/index.html

```java
// Byte streams (binary data)
try (InputStream in = new FileInputStream("file.bin");
     OutputStream out = new FileOutputStream("copy.bin")) {
    byte[] buffer = new byte[1024];
    int bytesRead;
    while ((bytesRead = in.read(buffer)) != -1) {
        out.write(buffer, 0, bytesRead);
    }
}

// Character streams (text data)
try (BufferedReader reader = new BufferedReader(new FileReader("file.txt"));
     BufferedWriter writer = new BufferedWriter(new FileWriter("out.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) {
        writer.write(line);
        writer.newLine();
    }
}

// Scanner — easy reading
Scanner scanner = new Scanner(System.in);
String name = scanner.nextLine();
int age = scanner.nextInt();

// PrintWriter — formatted output
PrintWriter pw = new PrintWriter(new FileWriter("log.txt"));
pw.printf("User: %s, Age: %d%n", name, age);
pw.close();
```

---

## 17. File Operations

> 📖 Docs: https://docs.oracle.com/javase/tutorial/essential/io/fileio.html

```java
import java.nio.file.*;
import java.io.IOException;

// Modern NIO.2 API (Java 7+)
Path path = Path.of("data", "file.txt");    // cross-platform paths
Path absolute = path.toAbsolutePath();

// Check existence
Files.exists(path);
Files.isDirectory(path);
Files.isReadable(path);

// Create
Files.createFile(path);
Files.createDirectories(Path.of("a/b/c"));  // creates all parents

// Read
String content = Files.readString(path);    // entire file as String (Java 11+)
List<String> lines = Files.readAllLines(path);
byte[] bytes = Files.readAllBytes(path);

// Write
Files.writeString(path, "Hello World\n");
Files.write(path, List.of("line1", "line2"));

// Copy, Move, Delete
Files.copy(src, dst, StandardCopyOption.REPLACE_EXISTING);
Files.move(src, dst, StandardCopyOption.ATOMIC_MOVE);
Files.delete(path);           // throws if not found
Files.deleteIfExists(path);   // safe

// Walk directory tree
Files.walk(Path.of("."))
     .filter(Files::isRegularFile)
     .filter(p -> p.toString().endsWith(".java"))
     .forEach(System.out::println);

// Watch for changes
WatchService watcher = FileSystems.getDefault().newWatchService();
path.register(watcher, StandardWatchEventKinds.ENTRY_CREATE,
              StandardWatchEventKinds.ENTRY_MODIFY,
              StandardWatchEventKinds.ENTRY_DELETE);
```

---

## 🗺️ Learning Path Recommendation

```
Week 1-2:   Basics (Syntax, Types, OOP fundamentals)
Week 3-4:   OOP Deep Dive (Inheritance, Interfaces, Polymorphism)
Week 5:     Collections + Generics
Week 6:     Exceptions + Lambdas + Streams
Week 7:     Concurrency (Threads, Sync, Virtual Threads)
Week 8:     I/O, Files, Networking, Regex
Week 9+:    Build projects → Spring Boot, Microservices
```

---

## 📎 Quick Reference — Official Documentation Links

| Topic | Link |
|-------|------|
| Java SE 21 Docs | https://docs.oracle.com/en/java/se/21/docs/api/ |
| Java Tutorial (Oracle) | https://docs.oracle.com/javase/tutorial/ |
| Language Basics | https://docs.oracle.com/javase/tutorial/java/nutsandbolts/ |
| OOP Concepts | https://docs.oracle.com/javase/tutorial/java/concepts/ |
| Collections | https://docs.oracle.com/javase/tutorial/collections/ |
| Concurrency | https://docs.oracle.com/javase/tutorial/essential/concurrency/ |
| I/O & NIO.2 | https://docs.oracle.com/javase/tutorial/essential/io/ |
| Networking | https://docs.oracle.com/javase/tutorial/networking/ |
| Regex | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/regex/Pattern.html |
| Date & Time | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/time/package-summary.html |
| Lambda Expressions | https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html |
| Stream API | https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/stream/Stream.html |
| Virtual Threads | https://docs.oracle.com/en/java/se/21/core/virtual-threads.html |
| Security/Crypto | https://docs.oracle.com/en/java/se/17/security/java-cryptography-architecture-jca-reference-guide.html |
| Records | https://docs.oracle.com/en/java/se/16/language/records.html |
| Modules | https://dev.java/learn/modules/ |

---

*Generated based on [roadmap.sh/java](https://roadmap.sh/java) — each section is a jumping-off point for deeper study.*
