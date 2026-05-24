# 🧱 OOP Deep Dive — Interface, Abstract & Design Principles
>
> Interface types, Abstract Classes, Polymorphism, SOLID, Design Patterns

---

## 📚 Table of Contents

1. [OOP Core Concepts Review](#1-oop-core-concepts-review)
2. [Interface — Complete Deep Dive](#2-interface--complete-deep-dive)
3. [Abstract Class — Complete Deep Dive](#3-abstract-class--complete-deep-dive)
4. [Interface vs Abstract Class — Decision Guide](#4-interface-vs-abstract-class--decision-guide)
5. [Types of Interfaces by Purpose](#5-types-of-interfaces-by-purpose)
6. [Inheritance Deep Dive](#6-inheritance-deep-dive)
7. [Polymorphism — All Forms](#7-polymorphism--all-forms)
8. [SOLID Principles](#8-solid-principles)
9. [Design Patterns — Creational](#9-design-patterns--creational)
10. [Design Patterns — Structural](#10-design-patterns--structural)
11. [Design Patterns — Behavioral](#11-design-patterns--behavioral)
12. [Composition over Inheritance](#12-composition-over-inheritance)

---

# 1. OOP Core Concepts Review

## 1.1 The Four Pillars

```
┌──────────────────────────────────────────────────────────────────┐
│  ENCAPSULATION                                                   │
│  Bundle data + behavior, hide internal details                   │
│  "What you need to know, not how it works"                       │
│                                                                  │
│  class BankAccount {                                             │
│    private double balance;  ← hidden                            │
│    public void deposit(double amount) { ... }  ← exposed API    │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  ABSTRACTION                                                     │
│  Hide complexity, expose only what's necessary                   │
│  "What it does, not how it does it"                              │
│                                                                  │
│  interface PaymentGateway {                                      │
│    boolean charge(String customerId, double amount);  ← contract│
│    // user doesn't know if it's Stripe, PayPal, or VNPay        │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  INHERITANCE                                                     │
│  Child class inherits parent's properties and behavior           │
│  "Is-a" relationship                                             │
│                                                                  │
│  class SavingsAccount extends BankAccount {                      │
│    private double interestRate;  ← adds new field               │
│    // inherits deposit(), withdraw(), getBalance()               │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  POLYMORPHISM                                                    │
│  One interface, many implementations                             │
│  "Many forms"                                                    │
│                                                                  │
│  Animal[] animals = { new Dog(), new Cat(), new Bird() };        │
│  for (Animal a : animals) {                                      │
│    a.speak();  // Dog: "Woof!", Cat: "Meow!", Bird: "Tweet!"     │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
```

## 1.2 Why OOP Matters

```
Procedural (no OOP):
  - Functions operating on data structures
  - Data and behavior are separate
  - Adding new type = modify all existing functions
  - "What operations do I need?"

OOP:
  - Objects bundle data + behavior
  - Adding new type = add new class, existing code unchanged
  - "What objects exist in my domain?"

Open/Closed in practice:
  // PROCEDURAL — must change existing code to add new shape
  double area(Shape shape) {
      if (shape.type == CIRCLE)    return Math.PI * r * r;
      if (shape.type == RECTANGLE) return w * h;
      if (shape.type == TRIANGLE)  return b * h / 2;  // ← add here every time
  }

  // OOP — add new shape WITHOUT changing existing code
  interface Shape { double area(); }
  class Circle    implements Shape { double area() { return PI * r * r; } }
  class Rectangle implements Shape { double area() { return w * h; } }
  class Triangle  implements Shape { double area() { return b * h / 2; } }
  // Add Pentagon? Just add new class, nothing else changes!
```

---

# 2. Interface — Complete Deep Dive

> 📖 <https://docs.oracle.com/javase/tutorial/java/concepts/interface.html>

## 2.1 What is an Interface?

```
Interface = pure CONTRACT
  Defines WHAT a class can do (not HOW)
  A promise: "any class implementing this interface CAN do these things"
  No state (no instance fields)
  No constructors

Think of interfaces as:
  Capabilities / Roles: Flyable, Serializable, Comparable, Runnable
  Contracts:            PaymentGateway, Repository, EventHandler
  Types:               Collection, List, Map, Queue

Real-world analogy:
  Power outlet = interface
    Contract: 220V, 2-3 holes
    Any device plugged in must follow this contract
    The device (implementation) decides HOW to use the power
    You don't care if it's a lamp or a computer (polymorphism!)
```

## 2.2 Interface Evolution — Java 7 → Java 21

```java
// ── JAVA 7 AND BEFORE — only abstract methods + constants ──
public interface Shape {
    // implicitly: public static final
    double PI = 3.14159265358979;

    // implicitly: public abstract
    double area();
    double perimeter();
    String describe();
}

// ── JAVA 8 — default methods + static methods ──
public interface Shape {
    double area();
    double perimeter();

    // DEFAULT METHOD — has body, can be overridden
    // Allows adding methods to interface without breaking all implementations!
    default String describe() {
        return String.format("Shape: area=%.2f, perimeter=%.2f", area(), perimeter());
    }

    default boolean isLargerThan(Shape other) {
        return this.area() > other.area();
    }

    // STATIC METHOD — called on interface itself, NOT overridable
    static Shape largest(List<? extends Shape> shapes) {
        return shapes.stream()
            .max(Comparator.comparingDouble(Shape::area))
            .orElseThrow();
    }

    static double sumAreas(List<? extends Shape> shapes) {
        return shapes.stream().mapToDouble(Shape::area).sum();
    }
}

// Usage:
Shape.largest(shapes);   // call static on interface
Shape.sumAreas(shapes);

Circle c = new Circle(5);
c.describe();            // call default method on instance

// ── JAVA 9 — private methods ──
public interface Logger {
    void log(String message);
    void logError(String message);

    // PRIVATE METHOD — helper for default methods, not exposed
    private String formatTimestamp() {
        return "[" + LocalDateTime.now() + "] ";
    }

    // PRIVATE STATIC — for static methods
    private static String getCallerClass() {
        return Thread.currentThread().getStackTrace()[3].getClassName();
    }

    default void logInfo(String message) {
        log(formatTimestamp() + "[INFO] " + message);   // reuse private
    }

    default void logWarn(String message) {
        log(formatTimestamp() + "[WARN] " + message);   // reuse private
    }
}

// ── COMPLETE INTERFACE MEMBER SUMMARY ──
public interface CompleteExample {
    // 1. Constants (public static final — implicit)
    int MAX_SIZE = 100;
    String DEFAULT_NAME = "Unknown";

    // 2. Abstract methods (public abstract — implicit)
    void doWork();
    String getName();

    // 3. Default methods (Java 8+) — can override
    default void printInfo() {
        System.out.println("Name: " + getName());
    }

    // 4. Static methods (Java 8+) — cannot override
    static CompleteExample createDefault() {
        return () -> System.out.println("default work");
    }

    // 5. Private methods (Java 9+) — for code reuse within interface
    private String format(String s) {
        return "[" + s + "]";
    }

    // 6. Private static methods (Java 9+)
    private static void validate(String s) {
        if (s == null || s.isEmpty()) throw new IllegalArgumentException();
    }
}
```

## 2.3 Implementing Interfaces

```java
// Single interface
class Circle implements Shape {
    private final double radius;

    public Circle(double radius) {
        if (radius <= 0) throw new IllegalArgumentException("Radius must be positive");
        this.radius = radius;
    }

    @Override  // ALWAYS use @Override — compiler catches typos!
    public double area() {
        return Math.PI * radius * radius;
    }

    @Override
    public double perimeter() {
        return 2 * Math.PI * radius;
    }
    // describe() is inherited from default implementation
}

// Multiple interfaces — Java's answer to multiple inheritance
interface Flyable {
    int MAX_ALTITUDE = 10_000;  // meters
    void fly();
    default void land() { System.out.println("Landing..."); }
}

interface Swimmable {
    void swim();
    default void dive() { System.out.println("Diving..."); }
}

interface Runnable {
    void run();
}

// Duck can fly, swim, AND run!
class Duck extends Animal implements Flyable, Swimmable, Runnable {
    @Override
    public void fly()  { System.out.println("Duck flying!"); }
    @Override
    public void swim() { System.out.println("Duck swimming!"); }
    @Override
    public void run()  { System.out.println("Duck running!"); }
}

// ── DEFAULT METHOD CONFLICT RESOLUTION ──
interface A {
    default void hello() { System.out.println("Hello from A"); }
}

interface B {
    default void hello() { System.out.println("Hello from B"); }
}

// ❌ Compile error: inherits two default hello() methods
class C implements A, B { }

// ✅ Must explicitly resolve conflict
class C implements A, B {
    @Override
    public void hello() {
        A.super.hello();   // explicitly call A's version
        // OR: B.super.hello();
        // OR: completely override with own implementation
    }
}

// What if parent class AND interface have same method?
class Parent {
    public void hello() { System.out.println("Hello from Parent"); }
}
interface D {
    default void hello() { System.out.println("Hello from D"); }
}

class Child extends Parent implements D {
    // NO conflict! Class always wins over interface default
    // → calls Parent.hello() automatically
}
```

## 2.4 Interface as Type (Polymorphism)

```java
// Program to interface, not implementation!

// ❌ Tightly coupled to specific implementation
ArrayList<String> list = new ArrayList<>();   // locks you to ArrayList
LinkedList<String> newList = list;            // can't reassign!

// ✅ Loosely coupled via interface
List<String> list = new ArrayList<>();        // type is List (interface)
list = new LinkedList<>();                    // can switch implementation!
list = Collections.unmodifiableList(list);   // can wrap!

// Return interface from factory methods
public List<String> getNames() {
    return new ArrayList<>(names);   // returns List, not ArrayList
    // caller doesn't need to know it's an ArrayList
}

// Accept interface in method parameters
public void process(List<String> items) { ... }        // accepts any List
public void notify(Collection<String> items) { ... }   // even more general
public void log(Iterable<String> items) { ... }        // most general

// Dependency injection via interface
class OrderService {
    private final PaymentGateway gateway;
    private final NotificationService notifier;

    // Constructor accepts interfaces → easily swap implementations
    public OrderService(PaymentGateway gateway, NotificationService notifier) {
        this.gateway = gateway;
        this.notifier = notifier;
    }

    public Order createOrder(Cart cart) {
        boolean paid = gateway.charge(cart.getUserId(), cart.getTotal());
        if (paid) {
            notifier.notify("Order confirmed!");
            return saveOrder(cart);
        }
        throw new PaymentFailedException();
    }
}

// Can inject any implementation:
new OrderService(new StripeGateway(), new EmailNotifier());
new OrderService(new PayPalGateway(), new SmsNotifier());
new OrderService(new MockGateway(), new NoOpNotifier());  // for testing!
```

## 2.5 Functional Interfaces

```java
// FUNCTIONAL INTERFACE = interface with EXACTLY ONE abstract method
// Used for lambda expressions and method references

@FunctionalInterface  // optional but enforced by compiler
public interface Transformer<T, R> {
    R transform(T input);   // single abstract method (SAM)
    
    // Default and static methods OK:
    default <V> Transformer<T, V> andThen(Transformer<R, V> after) {
        return input -> after.transform(this.transform(input));
    }
}

// Lambda replaces anonymous class:
// Old way:
Transformer<String, Integer> old = new Transformer<String, Integer>() {
    @Override
    public Integer transform(String input) {
        return input.length();
    }
};

// Lambda:
Transformer<String, Integer> lambda = input -> input.length();
Transformer<String, Integer> ref    = String::length;  // method reference

// ── BUILT-IN FUNCTIONAL INTERFACES ──
// java.util.function package

// Predicate<T>: T → boolean — test/filter
Predicate<String> isEmail    = s -> s.contains("@");
Predicate<Integer> isPositive = n -> n > 0;
Predicate<String> isLongEmail = isEmail.and(s -> s.length() > 10);
Predicate<Integer> isNotZero  = isPositive.or(n -> n < 0);
Predicate<Integer> isNeg      = isPositive.negate();

// Function<T, R>: T → R — transform
Function<String, Integer>  strLen   = String::length;
Function<Integer, String>  intToStr = Object::toString;
Function<String, String>   pipeline = strLen.andThen(intToStr);  // compose!
Function<String, String>   reversed = intToStr.compose(strLen);  // same, different order

// Consumer<T>: T → void — consume/use
Consumer<String> print  = System.out::println;
Consumer<String> log    = s -> logger.info(s);
Consumer<String> both   = print.andThen(log);  // chaining consumers

// Supplier<T>: () → T — produce/create
Supplier<List<String>> listFactory  = ArrayList::new;
Supplier<UUID>         uuidFactory  = UUID::randomUUID;
Supplier<LocalDate>    today        = LocalDate::now;

// BiFunction<T, U, R>: (T, U) → R
BiFunction<String, String, String> concat = (a, b) -> a + " " + b;

// UnaryOperator<T>: T → T (same type)
UnaryOperator<String> trim  = String::trim;
UnaryOperator<String> upper = String::toUpperCase;
UnaryOperator<String> clean = trim.andThen(upper);

// BinaryOperator<T>: (T, T) → T
BinaryOperator<Integer> add = Integer::sum;
BinaryOperator<String>  join = (a, b) -> a + ", " + b;

// Primitive specializations (avoid boxing overhead!):
IntPredicate    isEven    = n -> n % 2 == 0;
IntFunction<String> fmt   = Integer::toString;
IntUnaryOperator double_it = n -> n * 2;
IntBinaryOperator multiply = (a, b) -> a * b;
ToIntFunction<String> len  = String::length;
IntSupplier randomInt      = () -> ThreadLocalRandom.current().nextInt();
IntConsumer printInt       = System.out::println;

// Comparator is a functional interface!
Comparator<String> byLength = (a, b) -> a.length() - b.length();
Comparator<String> byLength2 = Comparator.comparingInt(String::length);
Comparator<User> complex = Comparator
    .comparing(User::getDepartment)
    .thenComparingInt(User::getSalary)
    .reversed();
```

---

# 3. Abstract Class — Complete Deep Dive

> 📖 <https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html>

## 3.1 What is an Abstract Class?

```
Abstract Class = INCOMPLETE class — cannot be instantiated
  Mix of: concrete implementation + abstract requirements
  "I know SOME things but not everything"
  Forces subclasses to complete the missing parts

When to use:
  When subclasses SHARE code (avoid duplication)
  When subclasses MUST override certain methods
  When you want to provide a "template" for behavior
  When you need constructors (interfaces can't have these)
  When you need non-public fields/methods

Real-world analogy:
  "Employee" class = abstract
    All employees: have name, ID, can work() — concrete
    But how much they earn depends on type — abstract
    SalariedEmployee: fixed monthly salary
    HourlyEmployee:   hours × rate
    FreelanceEmployee: per-project basis
```

## 3.2 Abstract Class — Full Anatomy

```java
public abstract class Animal {

    // ── FIELDS (can be any visibility) ──
    private final String name;        // private — protected by encapsulation
    protected int age;                // protected — subclasses can access
    private static int totalAnimals;  // class-level counter

    // ── CONSTRUCTORS (abstract class CAN have constructors) ──
    // But you can't call: new Animal() directly!
    // Subclasses MUST call super()
    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
        totalAnimals++;
    }

    protected Animal(String name) {
        this(name, 0);  // constructor chaining
    }

    // ── CONCRETE METHODS — implemented, can be used or overridden ──
    public String getName() { return name; }
    public int    getAge()  { return age; }
    public static int getTotalAnimals() { return totalAnimals; }

    public void sleep() {
        System.out.println(name + " is sleeping...");  // all animals sleep!
    }

    public final void breathe() {   // final — cannot override!
        System.out.println(name + " is breathing (all animals must breathe)");
    }

    // ── ABSTRACT METHODS — no body, MUST be overridden ──
    public abstract void speak();          // every animal speaks differently
    public abstract String getSound();     // every animal has a sound
    public abstract boolean canFly();      // varies by animal

    // ── TEMPLATE METHOD PATTERN — uses abstract methods ──
    // The algorithm is defined here; specifics provided by subclasses
    public final void dailyRoutine() {     // final — template can't be changed!
        System.out.println("--- " + name + "'s day ---");
        wake();           // concrete step (shared)
        eat();            // concrete step (shared)
        speak();          // abstract — subclass provides
        play();           // hook — subclass can override (optional)
        sleep();          // concrete step (shared)
    }

    private void wake() { System.out.println(name + " wakes up"); }
    private void eat()  { System.out.println(name + " eats food"); }

    // HOOK METHOD — has default behavior, optionally overridden
    protected void play() {
        System.out.println(name + " plays (default)");
    }

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{name='" + name + "', age=" + age + "}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Animal a)) return false;
        return Objects.equals(name, a.name) && age == a.age;
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }
}

// ── CONCRETE SUBCLASS — must implement ALL abstract methods ──
public class Dog extends Animal {

    private final String breed;

    public Dog(String name, int age, String breed) {
        super(name, age);   // MUST call super constructor first!
        this.breed = breed;
    }

    // MUST implement all abstract methods:
    @Override
    public void speak() {
        System.out.println(getName() + " says: Woof! Woof!");
    }

    @Override
    public String getSound() { return "Woof"; }

    @Override
    public boolean canFly() { return false; }

    // OPTIONAL: override hook method
    @Override
    protected void play() {
        System.out.println(getName() + " fetches the ball! 🎾");
    }

    // Add new methods specific to Dog:
    public void fetch() { System.out.println(getName() + " fetches!"); }
    public String getBreed() { return breed; }
}

// ── ANOTHER ABSTRACT SUBCLASS ──
// Can extend and still be abstract (doesn't implement all methods)
public abstract class Bird extends Animal {

    protected int wingSpan;

    public Bird(String name, int age, int wingSpan) {
        super(name, age);
        this.wingSpan = wingSpan;
    }

    @Override
    public boolean canFly() { return true; }  // implements one abstract method

    // Still abstract: speak(), getSound()
    // Adds new abstract method:
    public abstract int getFlightCeiling();    // max altitude
}

// ── CONCRETE BIRD ──
public class Eagle extends Bird {
    public Eagle(String name) { super(name, 5, 220); }

    @Override
    public void speak() { System.out.println(getName() + ": screech!"); }

    @Override
    public String getSound() { return "Screech"; }

    @Override
    public int getFlightCeiling() { return 3000; }  // 3000 meters
}
```

## 3.3 Template Method Pattern in Depth

```java
// Template Method = most important use of abstract classes!
// Define SKELETON of algorithm, defer some steps to subclasses

public abstract class DataMigrator {

    // TEMPLATE METHOD — defines the algorithm skeleton (FINAL!)
    public final void migrate() {
        System.out.println("Starting migration: " + getClass().getSimpleName());

        List<Object> data = extractData();           // step 1 — abstract
        List<Object> transformed = transformData(data); // step 2 — may override
        validateData(transformed);                   // step 3 — may override
        loadData(transformed);                       // step 4 — abstract
        cleanup();                                   // step 5 — hook (optional)

        System.out.println("Migration complete!");
    }

    // ABSTRACT steps — subclass MUST implement
    protected abstract List<Object> extractData();
    protected abstract void loadData(List<Object> data);

    // HOOK methods — have default behavior, CAN be overridden
    protected List<Object> transformData(List<Object> data) {
        return data;  // default: no transformation
    }

    protected void validateData(List<Object> data) {
        if (data == null || data.isEmpty()) {
            throw new IllegalStateException("No data to load!");
        }
        System.out.println("Basic validation passed. Records: " + data.size());
    }

    protected void cleanup() {
        System.out.println("Default cleanup done");
    }
}

// Concrete migrator: CSV to PostgreSQL
public class CsvToPostgresMigrator extends DataMigrator {

    private final String csvPath;
    private final JdbcTemplate jdbc;

    public CsvToPostgresMigrator(String csvPath, JdbcTemplate jdbc) {
        this.csvPath = csvPath;
        this.jdbc = jdbc;
    }

    @Override
    protected List<Object> extractData() {
        return CsvReader.readAll(csvPath);  // read from CSV
    }

    @Override
    protected List<Object> transformData(List<Object> data) {
        return data.stream()
            .map(row -> transform((CsvRow) row))  // convert CSV → domain
            .collect(toList());
    }

    @Override
    protected void loadData(List<Object> data) {
        jdbc.batchUpdate(INSERT_SQL, data);  // batch insert to Postgres
    }

    @Override
    protected void cleanup() {
        Files.deleteIfExists(Path.of(csvPath + ".processed"));
        System.out.println("CSV backup cleaned up");
    }
}

// MySQL to PostgreSQL migrator — reuses the same template!
public class MySqlToPostgresMigrator extends DataMigrator {
    @Override
    protected List<Object> extractData() {
        return mysqlJdbc.query("SELECT * FROM old_table", rowMapper);
    }
    @Override
    protected void loadData(List<Object> data) {
        postgresJdbc.batchUpdate(INSERT_SQL, data);
    }
    // Uses default validateData and cleanup — no override needed
}
```

---

# 4. Interface vs Abstract Class — Decision Guide

## 4.1 The Fundamental Difference

```
┌─────────────────────────────────────────────────────────────────┐
│             INTERFACE                                           │
│                                                                 │
│  Answers: "WHAT can this object do?"                            │
│  Models: CAPABILITY / ROLE / CONTRACT                           │
│  Relationship: "CAN-DO" or "BEHAVES-AS"                         │
│                                                                 │
│  A Dog CAN-DO: Flyable? No. Swimmable? Yes. Runnable? Yes.      │
│  A Plane CAN-DO: Flyable? Yes. Swimmable? No.                   │
│                                                                 │
│  Key: unrelated classes can share an interface                  │
│  Dog and Plane are very different, but both can be Runnable     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│             ABSTRACT CLASS                                      │
│                                                                 │
│  Answers: "WHAT IS this object?"                                │
│  Models: IDENTITY / TAXONOMY / PARTIAL IMPLEMENTATION           │
│  Relationship: "IS-A"                                           │
│                                                                 │
│  A Dog IS-A Animal (shares common Animal behavior/state)        │
│  A SavingsAccount IS-A BankAccount                              │
│                                                                 │
│  Key: related classes sharing a common base                     │
│  All Animals have name, age, sleep() — shared in abstract class │
└─────────────────────────────────────────────────────────────────┘
```

## 4.2 Feature Comparison

```
Feature                    Interface          Abstract Class
───────────────────────────────────────────────────────────────
Multiple inheritance       ✅ Yes             ❌ No (single only)
Instantiate directly       ❌ No              ❌ No
Constructors               ❌ No              ✅ Yes
Instance fields            ❌ No              ✅ Yes (any visibility)
Static fields              ✅ Only constants  ✅ Any (mutable OK)
Method visibility          Public only        Any (private too!)
Abstract methods           ✅ Yes             ✅ Yes
Concrete methods           ✅ (default)       ✅ Yes
Private methods            ✅ (Java 9+)       ✅ Yes
Static methods             ✅ (Java 8+)       ✅ Yes
Can extend                 Extend interface   Extend one class
Implementation sharing     Via default        Via concrete methods
State sharing              ❌ No              ✅ Yes
Access modifiers on methods Public only        All (public/protected/private)
```

## 4.3 Decision Flowchart

```
Do you need to define a contract that
UNRELATED classes might implement?
        │
        ├─ YES → Use INTERFACE
        │         Examples: Serializable, Comparable, Runnable
        │         Cloneable, AutoCloseable, Iterable
        │
        └─ NO → Do these classes share a "IS-A" relationship?
                       │
                       ├─ YES → Do they share common implementation?
                       │              │
                       │              ├─ YES → Use ABSTRACT CLASS
                       │              │         Examples: Animal → Dog/Cat
                       │              │         Shape → Circle/Rectangle
                       │              │         Account → SavingsAccount
                       │              │
                       │              └─ NO → Could go either way
                       │                      Interface if capabilities differ much
                       │
                       └─ NO → Just use a concrete class
                                (no abstraction needed)

REAL ANSWER: Use BOTH!
  Abstract class: common state + shared behavior
  Interface: additional capabilities + testability contract

  abstract class Vehicle {
      protected String brand, model;
      protected int year;
      // shared behavior: start(), stop(), fuelUp()
  }
  interface Electric    { void charge(); int getBatteryLevel(); }
  interface Connected   { void syncData(); void updateFirmware(); }
  interface Autonomous  { void enableSelfDrive(); }

  class Tesla extends Vehicle implements Electric, Connected, Autonomous {
      // Tesla IS-A Vehicle (abstract class)
      // Tesla CAN-DO: Electric, Connected, Autonomous (interfaces)
  }

  class ToyotaCamry extends Vehicle {
      // Simple: just a Vehicle
  }
```

## 4.4 Migration Pattern

```java
// PROBLEM: Start with abstract class, need multiple inheritance later
abstract class Logger {
    abstract void log(String message);
    void logInfo(String msg)  { log("[INFO] " + msg); }
    void logError(String msg) { log("[ERROR] " + msg); }
}

// Works until: class needs to extend BOTH Logger AND something else
// class AuditService extends Logger, BaseService { }  // ❌ impossible!

// SOLUTION: Extract interface + keep abstract class for reuse
interface Loggable {
    void log(String message);    // contract

    default void logInfo(String msg)  { log("[INFO] " + msg); }   // default
    default void logError(String msg) { log("[ERROR] " + msg); }  // default
}

abstract class AbstractLogger implements Loggable {
    // concrete implementation choices (Slf4j, JUL, etc.)
}

// NOW works:
class AuditService extends BaseService implements Loggable {
    // implements Loggable WITHOUT extending AbstractLogger
    @Override
    public void log(String message) {
        logger.info(message);  // uses Slf4j
    }
}

class ConsoleLogger extends AbstractLogger {
    @Override
    public void log(String message) { System.out.println(message); }
}
```

---

# 5. Types of Interfaces by Purpose

## 5.1 Marker Interface (Tag Interface)

```java
// MARKER INTERFACE: empty interface — no methods, no fields
// Just MARKS a class as having some property
// The presence of the interface itself is the information

// JDK examples:
java.io.Serializable    // marks class as serializable to bytes
java.lang.Cloneable     // marks class as safe to clone
java.util.RandomAccess  // marks List as having O(1) random access
java.rmi.Remote         // marks object as remotely accessible

// Custom marker interfaces:
public interface Cacheable { }         // mark entity as cacheable
public interface Auditable { }         // mark entity for audit logging
public interface SoftDeletable { }     // mark entity for soft delete
public interface Exportable { }        // mark entity as exportable to CSV

// Usage with reflection:
class AuditAspect {
    @Around("@annotation(org.aspectj.lang.annotation.Around)")
    public Object audit(ProceedingJoinPoint pjp) throws Throwable {
        Object target = pjp.getTarget();
        if (target instanceof Auditable) {   // marker check!
            logAudit(target, pjp.getSignature().getName());
        }
        return pjp.proceed();
    }
}

// ⚠️ Modern alternative: Annotations (more flexible)
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Cacheable {
    int ttlSeconds() default 300;   // can carry metadata!
}
// Annotations can carry parameters, marker interfaces cannot
```

## 5.2 Functional Interface

```java
// FUNCTIONAL INTERFACE: exactly one abstract method (SAM — Single Abstract Method)
// Enables lambdas, method references

@FunctionalInterface   // enforces SAM rule at compile time
public interface Validator<T> {
    ValidationResult validate(T value);

    // Can have multiple default/static methods — still functional!
    default Validator<T> and(Validator<T> other) {
        return value -> {
            ValidationResult result = this.validate(value);
            if (!result.isValid()) return result;
            return other.validate(value);
        };
    }

    default Validator<T> or(Validator<T> other) {
        return value -> {
            ValidationResult result = this.validate(value);
            if (result.isValid()) return result;
            return other.validate(value);
        };
    }

    static <T> Validator<T> of(Predicate<T> predicate, String message) {
        return value -> predicate.test(value)
            ? ValidationResult.ok()
            : ValidationResult.error(message);
    }
}

// Usage — clean and composable:
Validator<String> notBlank   = Validator.of(s -> !s.isBlank(), "Cannot be blank");
Validator<String> validEmail = Validator.of(s -> s.contains("@"), "Invalid email");
Validator<String> notTooLong = Validator.of(s -> s.length() <= 255, "Too long");

Validator<String> emailValidator = notBlank.and(validEmail).and(notTooLong);

emailValidator.validate("khang@test.com");  // ValidationResult.ok()
emailValidator.validate("notanemail");       // ValidationResult.error("Invalid email")
```

## 5.3 Sealed Interface (Java 17+)

```java
// SEALED INTERFACE: restricts which classes can implement it
// "Closed hierarchy" — you know ALL implementations at compile time
// Enables exhaustive pattern matching!

public sealed interface Shape
    permits Circle, Rectangle, Triangle, Pentagon {
    // Only these 4 classes can implement Shape!
    // Any other class trying to implement Shape → compile error

    double area();
    double perimeter();
}

// Must be: final, sealed, or non-sealed
public final class Circle implements Shape {   // final: no more subclasses
    private final double radius;
    Circle(double r) { this.radius = r; }
    public double area()      { return Math.PI * radius * radius; }
    public double perimeter() { return 2 * Math.PI * radius; }
}

public sealed class Rectangle implements Shape
    permits Square {               // Rectangle allows only Square as subtype
    protected final double width, height;
    public double area()      { return width * height; }
    public double perimeter() { return 2 * (width + height); }
}

public final class Square extends Rectangle {
    Square(double side) { super(side, side); }
}

public non-sealed class Triangle implements Shape { // non-sealed: open for extension
    // Anyone can extend Triangle
    public double area()      { return 0.5 * base * height; }
    public double perimeter() { return a + b + c; }
}

// BENEFIT: exhaustive switch (compiler verifies ALL cases covered!)
double describeArea(Shape shape) {
    return switch (shape) {
        case Circle c         -> Math.PI * c.radius() * c.radius();
        case Rectangle r      -> r.width() * r.height();
        case Triangle t       -> 0.5 * t.base() * t.height();
        case Pentagon p       -> calculatePentagonArea(p);
        // No default needed! Compiler knows these are ALL possibilities
        // If you add new permit class → compiler forces you to handle it!
    };
}
```

## 5.4 Callback Interface

```java
// CALLBACK INTERFACE: passed to another method, called when event occurs
// "Don't call us, we'll call you" — Hollywood Principle

public interface OnClickListener {
    void onClick(View view);
}

public interface Callback<T> {
    void onSuccess(T result);
    void onError(Exception e);
    default void onFinally() { }   // optional hook
}

// Usage:
button.setOnClickListener(view -> handleButtonClick(view));

apiClient.fetchUser(userId, new Callback<User>() {
    @Override
    public void onSuccess(User user) { renderUser(user); }

    @Override
    public void onError(Exception e) { showError(e.getMessage()); }

    @Override
    public void onFinally() { hideLoadingSpinner(); }
});

// Modern Java — async with CompletableFuture (callbacks via thenApply etc.)
apiClient.fetchUserAsync(userId)
    .thenApply(this::renderUser)
    .exceptionally(e -> { showError(e.getMessage()); return null; })
    .whenComplete((result, ex) -> hideLoadingSpinner());
```

## 5.5 Repository / DAO Interface

```java
// REPOSITORY INTERFACE: data access contract
// Separates business logic from data storage details
// Makes testing easy (swap real DB with in-memory fake)

public interface UserRepository {
    Optional<User> findById(Long id);
    Optional<User> findByEmail(String email);
    List<User> findAll();
    Page<User> findAll(Pageable pageable);
    List<User> findByStatus(UserStatus status);
    List<User> findByDepartmentAndStatus(String dept, UserStatus status);
    User save(User user);
    void delete(Long id);
    boolean existsByEmail(String email);
    long countByStatus(UserStatus status);
}

// Production implementation:
@Repository
public class JpaUserRepository implements UserRepository {
    @Autowired JpaRepository<User, Long> jpaRepo;
    // ... delegates to JPA ...
}

// Test implementation (fake!):
public class InMemoryUserRepository implements UserRepository {
    private final Map<Long, User> store = new HashMap<>();
    private long nextId = 1;

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public User save(User user) {
        if (user.getId() == null) user.setId(nextId++);
        store.put(user.getId(), user);
        return user;
    }
    // ... etc
}

// Service uses interface — doesn't care about implementation!
@Service
public class UserService {
    private final UserRepository users;  // ← depends on interface

    public UserService(UserRepository users) { this.users = users; }

    // Works with JPA in production, InMemory in tests
}
```

## 5.6 Strategy Interface

```java
// STRATEGY INTERFACE: encapsulates interchangeable algorithms
// Switch behavior at runtime without if/else chains

public interface SortingStrategy<T> {
    void sort(List<T> list);
    String name();
}

public class BubbleSortStrategy<T extends Comparable<T>> implements SortingStrategy<T> {
    @Override
    public void sort(List<T> list) { /* bubble sort impl */ }
    @Override
    public String name() { return "Bubble Sort O(n²)"; }
}

public class QuickSortStrategy<T extends Comparable<T>> implements SortingStrategy<T> {
    @Override
    public void sort(List<T> list) { /* quick sort impl */ }
    @Override
    public String name() { return "Quick Sort O(n log n)"; }
}

public class MergeSortStrategy<T extends Comparable<T>> implements SortingStrategy<T> {
    @Override
    public void sort(List<T> list) { /* merge sort impl */ }
    @Override
    public String name() { return "Merge Sort O(n log n) stable"; }
}

// Context uses strategy:
public class DataProcessor<T extends Comparable<T>> {
    private SortingStrategy<T> strategy;

    public DataProcessor(SortingStrategy<T> strategy) {
        this.strategy = strategy;
    }

    // Switch strategy at runtime!
    public void setStrategy(SortingStrategy<T> strategy) {
        this.strategy = strategy;
    }

    public void process(List<T> data) {
        System.out.println("Using: " + strategy.name());
        strategy.sort(data);
        // do more processing...
    }
}

// Usage:
DataProcessor<Integer> processor = new DataProcessor<>(new QuickSortStrategy<>());
processor.process(largeList);                           // fast sort

processor.setStrategy(new BubbleSortStrategy<>());     // runtime switch!
processor.process(smallList);                           // simpler for small

// Lambda as strategy (since it's a functional interface):
SortingStrategy<Integer> customSort = list -> Collections.sort(list, Comparator.reverseOrder());
```

## 5.7 Observer Interface (Event Listener)

```java
// OBSERVER: defines contract for receiving event notifications
public interface OrderEventListener {
    void onOrderCreated(Order order);
    void onOrderShipped(Order order);
    void onOrderDelivered(Order order);
    void onOrderCancelled(Order order, String reason);
}

// Multiple observers — each reacts differently to same event
public class EmailNotificationListener implements OrderEventListener {
    @Override
    public void onOrderCreated(Order order) {
        emailService.sendOrderConfirmation(order.getUserEmail(), order);
    }
    @Override
    public void onOrderShipped(Order order) {
        emailService.sendShippingNotification(order.getUserEmail(), order.getTrackingNumber());
    }
    // ...
}

public class InventoryListener implements OrderEventListener {
    @Override
    public void onOrderCreated(Order order) {
        inventoryService.reserveItems(order.getItems());
    }
    @Override
    public void onOrderCancelled(Order order, String reason) {
        inventoryService.releaseItems(order.getItems());
    }
    // ...
}

public class AnalyticsListener implements OrderEventListener {
    @Override
    public void onOrderCreated(Order order) {
        analytics.track("order_created", Map.of("value", order.getTotal()));
    }
    // ...
}

// Subject (notifies observers):
public class OrderService {
    private final List<OrderEventListener> listeners = new ArrayList<>();

    public void addListener(OrderEventListener l) { listeners.add(l); }

    public Order createOrder(CreateOrderRequest req) {
        Order order = buildOrder(req);
        orderRepo.save(order);

        // Notify ALL listeners
        listeners.forEach(l -> l.onOrderCreated(order));
        return order;
    }
}
```

## 5.8 Comparable vs Comparator Interface

```java
// COMPARABLE<T>: Natural ordering — implemented BY the class itself
// "This class knows how to compare itself to other instances"
// Used by: Collections.sort(), TreeSet, TreeMap automatically

public class Product implements Comparable<Product> {
    private String name;
    private double price;

    @Override
    public int compareTo(Product other) {
        // Natural order: by price ascending
        return Double.compare(this.price, other.price);
        // Contract: negative if this < other, 0 if equal, positive if this > other
    }
}

List<Product> products = new ArrayList<>(productList);
Collections.sort(products);  // uses Comparable → sorts by price!
TreeSet<Product> sorted = new TreeSet<>(products);  // auto-sorted

// COMPARATOR<T>: External ordering — defined OUTSIDE the class
// "Someone else defines how to compare these objects"
// Doesn't require modifying the class
// Can have MULTIPLE comparators for same class!

Comparator<Product> byName      = Comparator.comparing(Product::getName);
Comparator<Product> byPriceDesc = Comparator.comparingDouble(Product::getPrice).reversed();
Comparator<Product> byCategory  = Comparator.comparing(Product::getCategory);

// Chain comparators:
Comparator<Product> byCategoryThenPrice = byCategory.thenComparing(byPriceDesc);

products.sort(byName);           // sort by name
products.sort(byPriceDesc);      // sort by price descending
products.sort(byCategoryThenPrice); // sort by category, then price

// Null-safe:
Comparator<Product> nullSafe = Comparator.nullsFirst(byName);
Comparator<Product> nullLast = Comparator.nullsLast(byPriceDesc);

// TreeMap with custom comparator:
TreeMap<Product, Integer> stockByProduct = new TreeMap<>(byPriceDesc);
```

---

# 6. Inheritance Deep Dive

## 6.1 Constructor Chaining Rules

```java
// RULE: Every constructor MUST call another constructor as its FIRST statement
// If you don't → compiler inserts implicit super() (no-arg parent constructor)
// If parent has no no-arg constructor → compile error!

class Vehicle {
    String brand;
    int year;

    // No no-arg constructor!
    Vehicle(String brand, int year) {
        this.brand = brand;
        this.year = year;
    }
}

class Car extends Vehicle {
    int doors;

    Car(String brand, int year, int doors) {
        super(brand, year);  // MUST be first — calls Vehicle constructor
        this.doors = doors;
    }

    Car(String brand) {
        this(brand, 2024, 4);  // this() chains to other Car constructor
        // super() will be called by that constructor
    }
    // RULE: super() and this() cannot BOTH appear in same constructor
}

// EXECUTION ORDER when: new Car("Toyota", 2024, 4)
// 1. Car("Toyota", 2024, 4) called
// 2. super("Toyota", 2024) executes Vehicle("Toyota", 2024)
//    a. Object() constructor runs (root of all classes)
//    b. Vehicle static initializer runs (if any)
//    c. Vehicle instance initializer runs
//    d. Vehicle constructor body runs: brand="Toyota", year=2024
// 3. Back in Car: Car static initializer (if first time)
// 4. Car instance initializer runs
// 5. Car constructor body: doors=4
```

## 6.2 Method Overriding Rules

```java
class Parent {
    public Object method(Number n) {     // covariant return type base
        return n.intValue();
    }
}

class Child extends Parent {
    // ✅ Valid override:
    @Override
    public Integer method(Number n) {    // Integer IS-A Object (covariant return)
        return n.intValue();
    }

    // Rules for valid override:
    // 1. Same method name
    // 2. Same parameter types (EXACT — no covariance for params!)
    // 3. Return type: same OR subtype (covariant return)
    // 4. Access modifier: SAME or WIDER
    //    parent=protected → child can be: protected or public
    //    parent=public    → child must be: public
    // 5. Checked exceptions: SAME or FEWER/NARROWER (not new ones!)

    // ❌ Invalid override — WIDER exception
    // @Override
    // public Integer method(Number n) throws Exception { }  // parent throws nothing!

    // @Override
    // private Integer method(Number n) { }  // narrower access (public → private)
}

// super keyword — access overridden parent method
class Employee {
    public String getDetails() {
        return "Employee: " + name;
    }
}

class Manager extends Employee {
    @Override
    public String getDetails() {
        return super.getDetails() + ", Manager of: " + teamSize + " people";
        // super.getDetails() calls Employee's version explicitly
    }
}
```

## 6.3 Hiding vs Overriding

```java
// INSTANCE methods: OVERRIDING (runtime polymorphism)
// STATIC methods:   HIDING (compile-time, based on reference type)

class Parent {
    public void instanceMethod() { System.out.println("Parent instance"); }
    public static void staticMethod() { System.out.println("Parent static"); }
}

class Child extends Parent {
    @Override
    public void instanceMethod() { System.out.println("Child instance"); }
    // This HIDES (not overrides) the parent static:
    public static void staticMethod() { System.out.println("Child static"); }
}

Parent ref = new Child();

ref.instanceMethod();   // "Child instance" — runtime dispatch (polymorphism)
ref.staticMethod();     // "Parent static" — compile-time, based on ref type!

// FIELD hiding (avoid this!):
class Parent { int x = 10; }
class Child  extends Parent { int x = 20; }  // hides parent x, doesn't override

Parent ref = new Child();
System.out.println(ref.x);  // 10! Field access uses reference type, not object type
// This is why fields should be PRIVATE — prevents accidental hiding
```

---

# 7. Polymorphism — All Forms

## 7.1 Compile-Time vs Runtime Polymorphism

```java
// ── COMPILE-TIME (Static) Polymorphism ──
// Resolved by compiler based on method signature
// Method OVERLOADING

class Printer {
    // Same name, different parameters
    void print(int n)             { System.out.println("int: " + n); }
    void print(double d)          { System.out.println("double: " + d); }
    void print(String s)          { System.out.println("String: " + s); }
    void print(int a, int b)      { System.out.println("two ints: " + a + "," + b); }
    void print(String s, int n)   { System.out.println("String+int"); }
    <T> void print(List<T> list)  { list.forEach(System.out::println); }
}

printer.print(42);          // → print(int)
printer.print(3.14);        // → print(double)
printer.print("hello");     // → print(String)
printer.print(1, 2);        // → print(int, int)

// Widening: print(byte) → no print(byte) → widens to print(int)
// Boxing: print(Integer) → tries exact → then unboxes → print(int)
// Varargs: print(Object...) → lowest priority

// ── RUNTIME (Dynamic) Polymorphism ──
// Resolved by JVM at runtime based on ACTUAL object type
// Method OVERRIDING

abstract class Shape {
    abstract double area();
    void display() {
        System.out.println(getClass().getSimpleName() + " area: " + area());
    }
}

class Circle    extends Shape { double area() { return Math.PI * r * r; } }
class Rectangle extends Shape { double area() { return w * h; } }
class Triangle  extends Shape { double area() { return 0.5 * b * h; } }

// Reference type = Shape, but actual objects are different!
Shape[] shapes = { new Circle(5), new Rectangle(4,6), new Triangle(3,8) };
for (Shape s : shapes) {
    s.area();     // JVM dispatches to correct implementation at runtime!
    s.display();  // also runtime dispatch
}

// HOW: vtable (virtual dispatch table)
// Each class has vtable mapping method → implementation
// Object's first pointer = pointer to its class's vtable
// Virtual dispatch: look up method in vtable → call implementation
```

## 7.2 Covariant Return Types

```java
// Child method can return a SUBTYPE of parent's return type
// Makes code more type-safe without casting

abstract class AnimalFactory {
    public abstract Animal create(String name);  // returns Animal
}

class DogFactory extends AnimalFactory {
    @Override
    public Dog create(String name) {   // returns Dog (subtype of Animal) ✅
        return new Dog(name);
    }
}

// Without covariant return:
AnimalFactory factory = new DogFactory();
Dog dog = (Dog) factory.create("Rex");   // needs cast

// With covariant return AND specific reference:
DogFactory dogFactory = new DogFactory();
Dog dog = dogFactory.create("Rex");      // no cast needed!

// Builder pattern uses this extensively:
class Builder {
    public Builder setName(String name) { this.name = name; return this; }
}
class AdvancedBuilder extends Builder {
    @Override
    public AdvancedBuilder setName(String name) {  // covariant!
        super.setName(name);
        return this;  // returns AdvancedBuilder, not just Builder
    }
    public AdvancedBuilder setAdvancedOption(String opt) { ... return this; }
}

// Without covariant return type, chaining breaks:
AdvancedBuilder b = new AdvancedBuilder()
    .setName("test")         // returns Builder type — can't chain setAdvancedOption!
    .setAdvancedOption("x"); // compile error!

// WITH covariant return type:
AdvancedBuilder b = new AdvancedBuilder()
    .setName("test")          // returns AdvancedBuilder ✅
    .setAdvancedOption("x");  // works! ✅
```

---

# 8. SOLID Principles

> 📖 Robert C. Martin ("Uncle Bob") — 5 principles for maintainable OO design

## 8.1 S — Single Responsibility Principle

```java
// "A class should have only ONE reason to change"
// One responsibility = one department owns it

// ❌ Violates SRP — User class does TOO MUCH
class User {
    private String name, email;

    // Business logic:
    public boolean isAdmin() { ... }
    public void grantPermission(Permission p) { ... }

    // Persistence (different responsibility!):
    public void saveToDatabase() { ... }
    public User loadFromDatabase(Long id) { ... }

    // Email (yet another responsibility!):
    public void sendWelcomeEmail() { ... }
    public void sendPasswordReset() { ... }

    // Serialization (another one!):
    public String toJson() { ... }
    public String toCsv() { ... }
}
// Changing email template requires modifying User class
// Changing DB schema requires modifying User class
// Changing JSON format requires modifying User class
// Changes from 3 different teams collide on User.java!

// ✅ Follows SRP — each class has one reason to change
class User {
    private String name, email;
    boolean isAdmin() { ... }
    void grantPermission(Permission p) { ... }
}

class UserRepository {       // persistence responsibility
    User findById(Long id) { ... }
    User save(User user) { ... }
}

class UserEmailService {     // email responsibility
    void sendWelcomeEmail(User user) { ... }
    void sendPasswordReset(User user) { ... }
}

class UserSerializer {       // serialization responsibility
    String toJson(User user) { ... }
    User fromJson(String json) { ... }
}
```

## 8.2 O — Open/Closed Principle

```java
// "Open for EXTENSION, closed for MODIFICATION"
// Add new behavior by ADDING code, not changing existing code

// ❌ Violates OCP — must modify class to add new shape
class AreaCalculator {
    double calculateArea(Object shape) {
        if (shape instanceof Circle c)    return Math.PI * c.radius * c.radius;
        if (shape instanceof Rectangle r) return r.width * r.height;
        if (shape instanceof Triangle t)  return 0.5 * t.base * t.height;
        // ADD PENTAGON? Must modify this class → violates OCP!
        throw new UnsupportedOperationException();
    }
}

// ✅ Follows OCP — extend via new class, don't modify AreaCalculator
interface Shape { double area(); }
class Circle    implements Shape { public double area() { return PI * r * r; } }
class Rectangle implements Shape { public double area() { return w * h; } }
class Triangle  implements Shape { public double area() { return 0.5 * b * h; } }
class Pentagon  implements Shape { public double area() { return calculatePentagonArea(); } }

class AreaCalculator {
    double calculateArea(Shape shape) { return shape.area(); }
    // Never needs to change! New shapes just add new classes.
}

// Real example: Discount system
// ❌ OCP violation:
class OrderCalculator {
    double applyDiscount(Order order, String discountType) {
        return switch (discountType) {
            case "PERCENTAGE" -> order.getTotal() * 0.9;
            case "FIXED"      -> order.getTotal() - 50;
            case "BOGO"       -> order.getTotal() * 0.5;
            // New discount type? Must modify this class!
            default -> order.getTotal();
        };
    }
}

// ✅ OCP compliant:
interface DiscountStrategy {
    double apply(double total);
    String name();
}

record PercentageDiscount(double percent) implements DiscountStrategy {
    public double apply(double total) { return total * (1 - percent / 100); }
    public String name() { return percent + "% off"; }
}
record FixedDiscount(double amount) implements DiscountStrategy {
    public double apply(double total) { return Math.max(0, total - amount); }
    public String name() { return amount + " off"; }
}
record BogoDiscount() implements DiscountStrategy {
    public double apply(double total) { return total / 2; }
    public String name() { return "Buy one get one"; }
}

class OrderCalculator {
    double applyDiscount(Order order, DiscountStrategy discount) {
        return discount.apply(order.getTotal());
    }
    // Add new discount type? Just add new class. Never touch OrderCalculator.
}
```

## 8.3 L — Liskov Substitution Principle

```java
// "If S is a subtype of T, objects of T may be replaced with objects of S
//  without altering the correctness of the program"
//
// Simply: you should be able to use a subclass wherever you use the parent
// Subclass must STRENGTHEN or MAINTAIN (not weaken) parent's contract

// ❌ Classic LSP violation — Square extends Rectangle
class Rectangle {
    protected double width, height;
    public void setWidth(double w)  { this.width = w; }
    public void setHeight(double h) { this.height = h; }
    public double area() { return width * height; }
}

class Square extends Rectangle {
    @Override
    public void setWidth(double side) {
        this.width  = side;
        this.height = side;  // forces both to be equal
    }
    @Override
    public void setHeight(double side) {
        this.width  = side;
        this.height = side;
    }
}

// Code that works with Rectangle:
void resizeRectangle(Rectangle rect) {
    rect.setWidth(5);
    rect.setHeight(10);
    assert rect.area() == 50;  // ✅ for Rectangle, ❌ for Square! (area = 100!)
}
// Square IS-A Rectangle mathematically, but NOT behaviorally in this model!

// ✅ Fix: Don't make Square extend Rectangle
// They don't have the same behavioral interface
interface Shape { double area(); }
class Rectangle implements Shape { ... }
class Square    implements Shape { ... }

// ── PROPER LSP CHECKLIST ──
// Subclass must:
// 1. NOT strengthen preconditions (accept SAME or MORE inputs)
//    Parent: setAge(n) where n >= 0
//    Child:  setAge(n) where n >= 18  ← VIOLATION: stricter input!
//
// 2. NOT weaken postconditions (guarantee SAME or MORE)
//    Parent: findUser() returns non-null or throws
//    Child:  findUser() can return null  ← VIOLATION: weaker guarantee!
//
// 3. Maintain invariants (things that are always true)
//    Parent: balance is always >= 0
//    Child:  balance can go negative  ← VIOLATION!
//
// 4. NOT throw new exception types

// ✅ Proper LSP example:
abstract class Account {
    protected double balance;

    // Precondition: amount > 0
    // Postcondition: balance increases by amount
    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Must be positive");
        balance += amount;
    }

    // Abstract: subclasses define how, but contract must be maintained
    public abstract void withdraw(double amount);
}

class SavingsAccount extends Account {
    @Override
    public void withdraw(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Must be positive"); // same precondition
        if (balance - amount < 0) throw new InsufficientFundsException();
        balance -= amount;
        // postcondition: balance decreased — maintained ✅
    }
}

class CheckingAccount extends Account {
    private double overdraftLimit;

    @Override
    public void withdraw(double amount) {
        if (amount <= 0) throw new IllegalArgumentException();  // same precondition
        if (balance - amount < -overdraftLimit) throw new InsufficientFundsException();
        balance -= amount;
        // balance CAN go negative (overdraft) — but contract maintained ✅
    }
}
```

## 8.4 I — Interface Segregation Principle

```java
// "Clients should not be forced to depend on interfaces they don't use"
// Many small, specific interfaces > one large, general interface

// ❌ FAT interface — forces implementations to implement irrelevant methods
interface Animal {
    void eat();
    void sleep();
    void fly();     // not all animals fly!
    void swim();    // not all animals swim!
    void run();     // not all animals run!
    void breatheUnderwater(); // only fish!
}

class Dog implements Animal {
    public void eat()   { System.out.println("Dog eats"); }
    public void sleep() { System.out.println("Dog sleeps"); }
    public void fly()   { throw new UnsupportedOperationException(); }  // 🤢
    public void swim()  { System.out.println("Dog paddles"); }
    public void run()   { System.out.println("Dog runs"); }
    public void breatheUnderwater() { throw new UnsupportedOperationException(); } // 🤢
}
// Dog must implement fly() and breatheUnderwater() just to compile!

// ✅ Segregated interfaces — implement only what you need
interface Eatable    { void eat(); }
interface Sleepable  { void sleep(); }
interface Flyable    { void fly(); }
interface Swimmable  { void swim(); }
interface Runnable   { void run(); }
interface Aquatic    { void breatheUnderwater(); }

class Dog implements Eatable, Sleepable, Swimmable, Runnable {
    public void eat()   { ... }
    public void sleep() { ... }
    public void swim()  { ... }
    public void run()   { ... }
    // No fly(), no breatheUnderwater() — doesn't even compile them in!
}

class Eagle implements Eatable, Sleepable, Flyable, Runnable {
    public void eat()   { ... }
    public void sleep() { ... }
    public void fly()   { ... }
    public void run()   { ... }
}

class Fish implements Eatable, Sleepable, Swimmable, Aquatic {
    public void eat()              { ... }
    public void sleep()            { ... }
    public void swim()             { ... }
    public void breatheUnderwater(){ ... }
}

// Duck: can do EVERYTHING
class Duck implements Eatable, Sleepable, Flyable, Swimmable, Runnable {
    // implements all 5 interfaces
}

// Real example: Worker interface
// ❌ Fat interface
interface Worker {
    void work();
    void eat();    // robots don't eat!
    void sleep();  // robots don't sleep!
}

// ✅ Segregated
interface Workable  { void work(); }
interface Feedable  { void eat(); }
interface Restable  { void sleep(); }

class Human  implements Workable, Feedable, Restable { ... }
class Robot  implements Workable { ... }  // only needs Workable!
```

## 8.5 D — Dependency Inversion Principle

```java
// "High-level modules should not depend on low-level modules.
//  Both should depend on ABSTRACTIONS."
// "Abstractions should not depend on details.
//  Details should depend on abstractions."

// ❌ High level (OrderService) depends on low level (MySQLDatabase)
class MySQLDatabase {
    public void save(Order order) { /* MySQL-specific code */ }
    public Order findById(Long id) { /* MySQL-specific */ }
}

class OrderService {         // HIGH LEVEL
    private MySQLDatabase db = new MySQLDatabase();  // ← depends on LOW LEVEL!

    public Order createOrder(Cart cart) {
        Order order = buildOrder(cart);
        db.save(order);      // coupled to MySQL!
        return order;
    }
}
// Switching from MySQL → PostgreSQL requires changing OrderService!
// Can't test OrderService without MySQL running!

// ✅ Both depend on abstraction (interface)
interface OrderRepository {   // ABSTRACTION — in between
    void save(Order order);
    Optional<Order> findById(Long id);
}

// LOW LEVEL depends on abstraction:
class MySQLOrderRepository implements OrderRepository {
    @Override
    public void save(Order order) { /* MySQL impl */ }
    @Override
    public Optional<Order> findById(Long id) { /* MySQL impl */ }
}

class PostgresOrderRepository implements OrderRepository {
    @Override
    public void save(Order order) { /* Postgres impl */ }
    @Override
    public Optional<Order> findById(Long id) { /* Postgres impl */ }
}

class InMemoryOrderRepository implements OrderRepository {
    // For testing — no DB needed!
    private Map<Long, Order> store = new HashMap<>();
    // ...
}

// HIGH LEVEL depends on abstraction:
class OrderService {
    private final OrderRepository repository;  // ← depends on INTERFACE!

    // Dependency INJECTED from outside (not created internally)
    public OrderService(OrderRepository repository) {
        this.repository = repository;
    }

    public Order createOrder(Cart cart) {
        Order order = buildOrder(cart);
        repository.save(order);  // works with ANY implementation!
        return order;
    }
}

// Wiring (done in composition root / DI container):
// Production:
OrderService prodService = new OrderService(new MySQLOrderRepository());

// Testing:
OrderService testService = new OrderService(new InMemoryOrderRepository());

// Spring handles this automatically via @Autowired + @Repository
```

---

# 9. Design Patterns — Creational

## 9.1 Factory Method

```java
// Creates objects but lets subclasses decide which class to instantiate
// "Virtual constructor"

// Product interface
interface Button {
    void render();
    void onClick();
}

// Concrete products
class WindowsButton implements Button {
    public void render()  { System.out.println("Render Windows button"); }
    public void onClick() { System.out.println("Windows click event"); }
}

class MacButton implements Button {
    public void render()  { System.out.println("Render Mac button"); }
    public void onClick() { System.out.println("Mac click event"); }
}

// Creator (abstract factory method)
abstract class Dialog {
    // FACTORY METHOD — subclasses override to change what's created
    protected abstract Button createButton();

    // Template method uses factory method
    public void render() {
        Button button = createButton();  // calls factory method
        button.render();
        System.out.println("Dialog rendered");
    }
}

// Concrete creators
class WindowsDialog extends Dialog {
    @Override
    protected Button createButton() {
        return new WindowsButton();  // Windows-specific
    }
}

class MacDialog extends Dialog {
    @Override
    protected Button createButton() {
        return new MacButton();  // Mac-specific
    }
}

// Client:
Dialog dialog = getDialogForOS();  // returns WindowsDialog or MacDialog
dialog.render();  // correct button type created automatically!
```

## 9.2 Abstract Factory

```java
// Creates FAMILIES of related objects
// "Kit" or "Toolkit" pattern

// Abstract products
interface Button    { void render(); }
interface Checkbox  { void render(); }
interface TextInput { void render(); }

// Concrete products (Windows family)
class WinButton    implements Button    { public void render() { System.out.println("Win Button"); } }
class WinCheckbox  implements Checkbox  { public void render() { System.out.println("Win Checkbox"); } }
class WinTextInput implements TextInput { public void render() { System.out.println("Win TextInput"); } }

// Concrete products (Mac family)
class MacButton    implements Button    { public void render() { System.out.println("Mac Button"); } }
class MacCheckbox  implements Checkbox  { public void render() { System.out.println("Mac Checkbox"); } }
class MacTextInput implements TextInput { public void render() { System.out.println("Mac TextInput"); } }

// ABSTRACT FACTORY — creates a whole UI family
interface UIFactory {
    Button    createButton();
    Checkbox  createCheckbox();
    TextInput createTextInput();
}

// Concrete factories — each creates a consistent family
class WindowsUIFactory implements UIFactory {
    public Button    createButton()    { return new WinButton(); }
    public Checkbox  createCheckbox()  { return new WinCheckbox(); }
    public TextInput createTextInput() { return new WinTextInput(); }
}

class MacUIFactory implements UIFactory {
    public Button    createButton()    { return new MacButton(); }
    public Checkbox  createCheckbox()  { return new MacCheckbox(); }
    public TextInput createTextInput() { return new MacTextInput(); }
}

// Client — works with ANY factory, always gets consistent UI!
class Application {
    private Button btn;
    private Checkbox chk;
    private TextInput input;

    Application(UIFactory factory) {
        this.btn   = factory.createButton();
        this.chk   = factory.createCheckbox();
        this.input = factory.createTextInput();
    }

    void renderUI() {
        btn.render();
        chk.render();
        input.render();
        // All three match (Windows or Mac) — guaranteed consistency!
    }
}
```

## 9.3 Builder Pattern

```java
// Construct complex objects step by step
// Separate construction from representation

public class HttpRequest {
    // Many optional fields — constructor explosion without builder!
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final int timeoutMs;
    private final boolean followRedirects;
    private final String contentType;

    // Private constructor — only builder can create this
    private HttpRequest(Builder builder) {
        this.url             = builder.url;
        this.method          = builder.method;
        this.headers         = Map.copyOf(builder.headers);
        this.body            = builder.body;
        this.timeoutMs       = builder.timeoutMs;
        this.followRedirects = builder.followRedirects;
        this.contentType     = builder.contentType;
    }

    // Getters...
    public String getUrl() { return url; }

    // ── BUILDER — static nested class ──
    public static class Builder {
        private final String url;           // required
        private String method = "GET";      // optional with default
        private Map<String, String> headers = new HashMap<>();
        private String body;
        private int timeoutMs = 30_000;
        private boolean followRedirects = true;
        private String contentType = "application/json";

        public Builder(String url) {        // required param in constructor
            this.url = Objects.requireNonNull(url, "URL required");
        }

        public Builder method(String method) {
            this.method = method.toUpperCase();
            return this;  // fluent — enables chaining!
        }

        public Builder header(String name, String value) {
            this.headers.put(name, value);
            return this;
        }

        public Builder body(String body) {
            this.body = body;
            if ("GET".equals(this.method)) this.method = "POST";
            return this;
        }

        public Builder timeoutMs(int ms) {
            if (ms <= 0) throw new IllegalArgumentException("Timeout must be positive");
            this.timeoutMs = ms;
            return this;
        }

        public Builder noRedirects() { this.followRedirects = false; return this; }

        // Build — validate and create
        public HttpRequest build() {
            if (body != null && "GET".equals(method)) {
                throw new IllegalStateException("GET requests cannot have a body");
            }
            return new HttpRequest(this);
        }
    }
}

// Usage — readable and flexible!
HttpRequest request = new HttpRequest.Builder("https://api.example.com/users")
    .method("POST")
    .header("Authorization", "Bearer " + token)
    .header("X-Request-Id", UUID.randomUUID().toString())
    .body("{\"name\": \"Khang\"}")
    .timeoutMs(5000)
    .build();

// Lombok makes this trivial:
@Builder
@Getter
@AllArgsConstructor
public class HttpRequest {
    private final String url;
    @Builder.Default private final String method = "GET";
    @Singular private final Map<String, String> headers;
    private final String body;
    @Builder.Default private final int timeoutMs = 30_000;
}
```

## 9.4 Singleton Pattern

```java
// Ensure only ONE instance exists, provide global access point
// Use sparingly — often a design smell!

// ── BEST IMPLEMENTATION: Enum Singleton ──
public enum AppConfig {
    INSTANCE;

    private final Properties props;

    AppConfig() {
        props = new Properties();
        // load config...
    }

    public String get(String key) { return props.getProperty(key); }
}

// Usage:
AppConfig.INSTANCE.get("db.url")

// ── Thread-safe lazy initialization ──
public class DatabasePool {
    private static volatile DatabasePool instance;  // volatile REQUIRED

    private final List<Connection> pool;

    private DatabasePool() {
        pool = createConnectionPool(20);
    }

    public static DatabasePool getInstance() {
        if (instance == null) {                         // first check (fast path)
            synchronized (DatabasePool.class) {
                if (instance == null) {                 // second check (safe)
                    instance = new DatabasePool();      // volatile ensures visibility
                }
            }
        }
        return instance;
    }
}

// ── When to AVOID singleton ──
// - Hard to test (global state, can't inject mock)
// - Hidden dependencies (callers don't know they use singleton)
// - Multithreading issues if mutable
// PREFER: Dependency Injection (Spring @Singleton scope is better!)
```

---

# 10. Design Patterns — Structural

## 10.1 Adapter Pattern

```java
// Convert interface of a class into another interface clients expect
// "Translator" — makes incompatible interfaces work together

// EXISTING code you can't change:
class LegacyPrinter {
    public void printText(String text) {
        System.out.println("LEGACY: " + text);
    }
}

// TARGET interface that new code expects:
interface ModernPrinter {
    void print(Document doc);
    void print(String text, int fontSize, String color);
}

// ADAPTER — wraps old code to match new interface
class LegacyPrinterAdapter implements ModernPrinter {
    private final LegacyPrinter legacy;

    public LegacyPrinterAdapter(LegacyPrinter legacy) {
        this.legacy = legacy;
    }

    @Override
    public void print(Document doc) {
        // Convert Document to String for legacy printer
        legacy.printText(doc.getContent());
    }

    @Override
    public void print(String text, int fontSize, String color) {
        // Legacy doesn't support styling — adapt as best we can
        legacy.printText("[" + fontSize + "pt] " + text);
    }
}

// Client uses ModernPrinter interface — doesn't know about legacy
ModernPrinter printer = new LegacyPrinterAdapter(new LegacyPrinter());
printer.print(new Document("Hello World"));

// Real-world Java examples:
// Arrays.asList()    — array → List interface
// InputStreamReader  — InputStream (byte) → Reader (char)
// Collections.list() — Enumeration → ArrayList
```

## 10.2 Decorator Pattern

```java
// Attach additional responsibilities to an object dynamically
// Alternative to subclassing for extending functionality

// COMPONENT interface
interface TextProcessor {
    String process(String text);
}

// CONCRETE COMPONENT
class PlainTextProcessor implements TextProcessor {
    @Override
    public String process(String text) { return text; }
}

// BASE DECORATOR
abstract class TextProcessorDecorator implements TextProcessor {
    protected final TextProcessor wrapped;

    public TextProcessorDecorator(TextProcessor wrapped) {
        this.wrapped = wrapped;
    }

    @Override
    public String process(String text) {
        return wrapped.process(text);  // delegate to wrapped
    }
}

// CONCRETE DECORATORS — each adds one responsibility
class UpperCaseDecorator extends TextProcessorDecorator {
    public UpperCaseDecorator(TextProcessor wrapped) { super(wrapped); }

    @Override
    public String process(String text) {
        return super.process(text).toUpperCase();
    }
}

class TrimDecorator extends TextProcessorDecorator {
    public TrimDecorator(TextProcessor wrapped) { super(wrapped); }

    @Override
    public String process(String text) {
        return super.process(text.trim());
    }
}

class HtmlEscapeDecorator extends TextProcessorDecorator {
    public HtmlEscapeDecorator(TextProcessor wrapped) { super(wrapped); }

    @Override
    public String process(String text) {
        return super.process(text)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;");
    }
}

class LoggingDecorator extends TextProcessorDecorator {
    public LoggingDecorator(TextProcessor wrapped) { super(wrapped); }

    @Override
    public String process(String text) {
        System.out.println("Processing: " + text);
        String result = super.process(text);
        System.out.println("Result: " + result);
        return result;
    }
}

// POWER: combine decorators in any order!
TextProcessor processor = new LoggingDecorator(
    new UpperCaseDecorator(
        new TrimDecorator(
            new HtmlEscapeDecorator(
                new PlainTextProcessor()
            ))));

processor.process("  <Hello> World  ");
// → trim → escape HTML → uppercase → log
// Result: "&LT;HELLO&GT; WORLD"

// Java I/O uses Decorator extensively:
InputStream in = new BufferedInputStream(      // adds buffering
    new GZIPInputStream(                        // adds decompression
        new FileInputStream("data.gz")          // reads file
    ));
```

## 10.3 Proxy Pattern

```java
// Provide a surrogate/placeholder for another object
// Control access to the original object

interface UserService {
    User getUser(Long id);
    void updateUser(User user);
}

class RealUserService implements UserService {
    @Override
    public User getUser(Long id) {
        return database.findById(id);  // slow DB call
    }
    @Override
    public void updateUser(User user) {
        database.save(user);
    }
}

// CACHING PROXY — add caching without changing UserService
class CachingUserServiceProxy implements UserService {
    private final UserService real;
    private final Map<Long, User> cache = new ConcurrentHashMap<>();

    public CachingUserServiceProxy(UserService real) { this.real = real; }

    @Override
    public User getUser(Long id) {
        return cache.computeIfAbsent(id, real::getUser);  // cache it!
    }

    @Override
    public void updateUser(User user) {
        real.updateUser(user);
        cache.remove(user.getId());  // invalidate cache
    }
}

// LOGGING PROXY — add logging
class LoggingProxy implements UserService {
    private final UserService real;

    public LoggingProxy(UserService real) { this.real = real; }

    @Override
    public User getUser(Long id) {
        log.info("Getting user: {}", id);
        User user = real.getUser(id);
        log.info("Got user: {}", user.getName());
        return user;
    }

    @Override
    public void updateUser(User user) {
        log.info("Updating user: {}", user.getId());
        real.updateUser(user);
    }
}

// Stack proxies transparently:
UserService service = new LoggingProxy(
    new CachingUserServiceProxy(
        new RealUserService()
    ));
// Client uses UserService interface — doesn't know about caching/logging!

// Spring AOP uses Dynamic Proxy:
// @Transactional, @Cacheable, @Async, @Secured
// → Spring creates a proxy at runtime that intercepts calls!
```

---

# 11. Design Patterns — Behavioral

## 11.1 Strategy Pattern (with Interface)

```java
// Define a family of algorithms, encapsulate each, make them interchangeable
// Key difference from Template Method: uses COMPOSITION not INHERITANCE

// STRATEGY interface
interface PricingStrategy {
    double calculatePrice(double basePrice, User user);
    String description();
}

// Concrete strategies
class RegularPricing implements PricingStrategy {
    public double calculatePrice(double base, User user) { return base; }
    public String description() { return "Regular price"; }
}

class VipPricing implements PricingStrategy {
    private final double discount;
    public VipPricing(double discount) { this.discount = discount; }
    public double calculatePrice(double base, User user) {
        return base * (1 - discount);
    }
    public String description() { return discount * 100 + "% VIP discount"; }
}

class DynamicPricing implements PricingStrategy {
    public double calculatePrice(double base, User user) {
        double multiplier = getDemandMultiplier();
        return base * multiplier;
    }
    public String description() { return "Dynamic demand-based pricing"; }
}

class StudentPricing implements PricingStrategy {
    public double calculatePrice(double base, User user) {
        if (!user.isStudent()) return base;
        return base * 0.7;  // 30% off for students
    }
    public String description() { return "30% student discount"; }
}

// CONTEXT uses strategy via composition
class PriceCalculator {
    private PricingStrategy strategy;

    public PriceCalculator(PricingStrategy strategy) {
        this.strategy = strategy;
    }

    public void setStrategy(PricingStrategy strategy) {  // swap at runtime!
        this.strategy = strategy;
    }

    public double calculate(double basePrice, User user) {
        double price = strategy.calculatePrice(basePrice, user);
        System.out.println("Price: " + price + " (" + strategy.description() + ")");
        return price;
    }
}

// Runtime strategy selection:
PricingStrategy getStrategy(User user) {
    if (user.isVip())     return new VipPricing(0.20);
    if (user.isStudent()) return new StudentPricing();
    if (isDemandHigh())   return new DynamicPricing();
    return new RegularPricing();
}

// Lambda as strategy (since it's a functional interface!):
PricingStrategy halfOff = (base, user) -> base * 0.5;
calculator.setStrategy(halfOff);
```

## 11.2 Command Pattern

```java
// Encapsulate a request as an object
// Supports: undo/redo, queuing, logging, macro recording

interface Command {
    void execute();
    void undo();
    String description();
}

// Concrete commands
class DepositCommand implements Command {
    private final BankAccount account;
    private final double amount;

    public DepositCommand(BankAccount account, double amount) {
        this.account = account;
        this.amount = amount;
    }

    @Override public void execute() { account.deposit(amount); }
    @Override public void undo()    { account.withdraw(amount); }
    @Override public String description() { return "Deposit " + amount; }
}

class WithdrawCommand implements Command {
    private final BankAccount account;
    private final double amount;
    private boolean executed = false;

    @Override
    public void execute() {
        account.withdraw(amount);
        executed = true;
    }

    @Override
    public void undo() {
        if (executed) account.deposit(amount);
    }

    @Override
    public String description() { return "Withdraw " + amount; }
}

// INVOKER — manages command history
class TransactionManager {
    private final Deque<Command> history = new ArrayDeque<>();
    private final Deque<Command> undone  = new ArrayDeque<>();

    public void execute(Command command) {
        command.execute();
        history.push(command);
        undone.clear();  // new command clears redo stack
        System.out.println("Executed: " + command.description());
    }

    public void undo() {
        if (history.isEmpty()) { System.out.println("Nothing to undo"); return; }
        Command command = history.pop();
        command.undo();
        undone.push(command);
        System.out.println("Undone: " + command.description());
    }

    public void redo() {
        if (undone.isEmpty()) { System.out.println("Nothing to redo"); return; }
        Command command = undone.pop();
        command.execute();
        history.push(command);
        System.out.println("Redone: " + command.description());
    }

    // Macro: execute a sequence as one command
    public void executeBatch(List<Command> commands) {
        commands.forEach(this::execute);
    }
}
```

## 11.3 Chain of Responsibility

```java
// Pass request along chain of handlers — each decides to handle or pass
// HTTP middleware, request filters, validation chains

abstract class RequestHandler {
    protected RequestHandler next;

    public RequestHandler setNext(RequestHandler next) {
        this.next = next;
        return next;  // returns next for fluent chaining!
    }

    public abstract boolean handle(HttpRequest request);

    protected boolean passToNext(HttpRequest request) {
        if (next != null) return next.handle(request);
        return false;  // end of chain, not handled
    }
}

class AuthHandler extends RequestHandler {
    @Override
    public boolean handle(HttpRequest request) {
        if (!request.hasValidToken()) {
            System.out.println("Auth FAILED — returning 401");
            return false;  // stop chain
        }
        System.out.println("Auth passed");
        return passToNext(request);  // continue chain
    }
}

class RateLimitHandler extends RequestHandler {
    @Override
    public boolean handle(HttpRequest request) {
        if (isRateLimitExceeded(request.getClientIp())) {
            System.out.println("Rate limit exceeded — returning 429");
            return false;
        }
        System.out.println("Rate limit OK");
        return passToNext(request);
    }
}

class ValidationHandler extends RequestHandler {
    @Override
    public boolean handle(HttpRequest request) {
        if (!request.isValid()) {
            System.out.println("Validation failed — returning 400");
            return false;
        }
        System.out.println("Validation passed");
        return passToNext(request);
    }
}

class LoggingHandler extends RequestHandler {
    @Override
    public boolean handle(HttpRequest request) {
        System.out.println("Logging request: " + request.getPath());
        boolean result = passToNext(request);
        System.out.println("Request " + (result ? "succeeded" : "failed"));
        return result;
    }
}

// Build chain — order matters!
RequestHandler chain = new LoggingHandler();
chain.setNext(new AuthHandler())
     .setNext(new RateLimitHandler())
     .setNext(new ValidationHandler());

chain.handle(request);
// LoggingHandler → AuthHandler → RateLimitHandler → ValidationHandler

// Spring Security FilterChain uses this exact pattern!
// javax.servlet.Filter also uses chain of responsibility
```

---

# 12. Composition over Inheritance

## 12.1 The Problem with Deep Inheritance

```java
// ── INHERITANCE HIERARCHY PROBLEM ──
// The deeper it goes, the more fragile it becomes

class Animal           { void breathe() { ... } }
class Mammal extends Animal { void feedMilk() { ... } }
class Pet extends Mammal { void beFriendly() { ... } }
class Dog extends Pet { void fetch() { ... } }
class GuardDog extends Dog { void guard() { ... } }
class TrainedGuardDog extends GuardDog { void obeyCommands() { ... } }

// Problem 1: The Fragile Base Class Problem
// A change in Animal can break TrainedGuardDog!
// Deep coupling: 6 levels deep

// Problem 2: The Gorilla/Banana Problem
// "You wanted a banana but you got a gorilla holding the banana
//  and the entire jungle" — Joe Armstrong
// Want: fetch() from Dog
// Get: breathe + feedMilk + beFriendly + fetch + guard + obeyCommands

// Problem 3: Diamond Problem (no multiple inheritance)
// AquaticAnimal → Dog?  Can't extend both Pet AND AquaticAnimal!

// ── COMPOSITION SOLUTION ──
// "Has-a" instead of "Is-a"
// Build behavior by composing small, focused components

// BEHAVIORS as interfaces or classes:
interface Swimmer  { void swim(); }
interface Flyer    { void fly(); }
interface Hunter   { void hunt(); }
interface GuardDog { void guard(); }
interface Trainer  { void train(Animal a); }

// Or as composable components:
record SwimmingAbility(int speed)  implements Swimmer  { ... }
record FlyingAbility(int altitude) implements Flyer    { ... }
record HuntingAbility(String prey) implements Hunter   { ... }

// FLEXIBLE class composed of behaviors:
class Dog {
    private final String name;
    private final SwimmingAbility swimming;   // optional
    private final HuntingAbility  hunting;    // optional

    public Dog(String name, SwimmingAbility swimming, HuntingAbility hunting) {
        this.name = name;
        this.swimming = swimming;
        this.hunting = hunting;
    }

    public Optional<SwimmingAbility> getSwimmingAbility() {
        return Optional.ofNullable(swimming);
    }
}

// Labrador: can swim AND hunt
Dog labrador = new Dog("Lab",
    new SwimmingAbility(8),
    new HuntingAbility("birds"));

// Chihuahua: neither
Dog chihuahua = new Dog("Chi", null, null);
```

## 12.2 Practical Composition Example

```java
// Building an Employee system with composition

// Behaviors as interfaces:
interface Billable   { Money calculateBillingAmount(); }
interface Manageable { List<Employee> getDirectReports(); void addReport(Employee e); }
interface Commissionable { Money calculateCommission(List<Sale> sales); }

// Capabilities as classes:
class BillingProfile {
    private final double hourlyRate;
    private int hoursWorked;
    Money calculate() { return Money.of(hourlyRate * hoursWorked); }
}

class ManagementProfile {
    private final List<Employee> reports = new ArrayList<>();
    void addReport(Employee e) { reports.add(e); }
    List<Employee> getReports() { return List.copyOf(reports); }
}

class CommissionProfile {
    private final double rate;
    Money calculate(List<Sale> sales) {
        return sales.stream()
            .map(Sale::getAmount)
            .reduce(Money.ZERO, Money::add)
            .multiply(rate);
    }
}

// Employee composed of capabilities:
class Employee {
    private final String name;
    private final BillingProfile billing;          // may be null
    private final ManagementProfile management;    // may be null
    private final CommissionProfile commission;    // may be null

    // Expose capabilities conditionally:
    public boolean canBeBilled()     { return billing    != null; }
    public boolean isManager()       { return management != null; }
    public boolean earnCommission()  { return commission != null; }

    // Use capabilities when present:
    public Money getBillingAmount() {
        return Optional.ofNullable(billing)
            .map(BillingProfile::calculate)
            .orElse(Money.ZERO);
    }
}

// Build different types of employees via composition:
Employee juniorDev = new Employee("Alice",
    new BillingProfile(100),   // billable
    null,                       // not a manager
    null);                      // no commission

Employee seniorMgr = new Employee("Bob",
    new BillingProfile(200),           // still billable
    new ManagementProfile(),           // is a manager
    new CommissionProfile(0.05));      // earns commission

Employee contractor = new Employee("Charlie",
    new BillingProfile(150),
    null,
    null);

// Adding new type = no class hierarchy change needed!
// Just compose the right capabilities!
```

---

## 📎 Quick Reference — When to Use What

```
┌──────────────────────────────────────────────────────────────────────┐
│  CHOOSE                    WHEN                                      │
├──────────────────────────────────────────────────────────────────────┤
│  Interface                 Defining contract/capability              │
│                            Unrelated classes share same behavior     │
│                            Multiple "inheritance" needed             │
│                            Mocking/testing boundary                  │
│                            Functional interface (lambda)             │
├──────────────────────────────────────────────────────────────────────┤
│  Abstract Class            Sharing implementation between relatives  │
│                            Template Method pattern                   │
│                            Need constructors / instance state        │
│                            Partial implementation                    │
├──────────────────────────────────────────────────────────────────────┤
│  Marker Interface          Tag class for capability                  │
│                            (prefer Annotation with metadata)         │
├──────────────────────────────────────────────────────────────────────┤
│  Functional Interface      Lambda expressions                        │
│                            Strategy pattern                          │
│                            Callback functions                        │
├──────────────────────────────────────────────────────────────────────┤
│  Sealed Interface          Closed type hierarchy                     │
│                            Exhaustive pattern matching               │
│                            ADT (Algebraic Data Types)                │
├──────────────────────────────────────────────────────────────────────┤
│  Composition               Complex behavior from simple parts        │
│                            Avoid deep inheritance                    │
│                            Mix-and-match capabilities                │
└──────────────────────────────────────────────────────────────────────┘
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Java Interfaces | <https://docs.oracle.com/javase/tutorial/java/concepts/interface.html> |
| Abstract Classes | <https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html> |
| Inheritance | <https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html> |
| Sealed Classes | <https://docs.oracle.com/en/java/se/17/language/sealed-classes-and-interfaces.html> |
| Functional Interfaces | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/function/package-summary.html> |
| java.util.function | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/function/package-summary.html> |
| Design Patterns (GoF) | <https://refactoring.guru/design-patterns> |
| SOLID Principles | <https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design> |
| Effective Java (Bloch) | <https://www.oreilly.com/library/view/effective-java/9780134686097/> |
| Composition over Inheritance | <https://www.thoughtworks.com/insights/blog/composition-vs-inheritance-how-choose> |

---

*Học theo thứ tự: Interface basics → Abstract class → Interface vs Abstract → Interface types → SOLID → Design Patterns*
