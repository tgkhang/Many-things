# λ Java Lambda — Complete Deep Dive
>
> Lambda Expressions, Functional Interfaces, Method References, Closure, Best Practices

---

## 📚 Table of Contents

1. [Lambda Fundamentals](#1-lambda-fundamentals)
2. [Functional Interfaces — Built-in](#2-functional-interfaces--built-in)
3. [Lambda Syntax — Mọi Dạng](#3-lambda-syntax--mọi-dạng)
4. [Method References — 4 Loại](#4-method-references--4-loại)
5. [Variable Capture & Closure](#5-variable-capture--closure)
6. [Composing Functions](#6-composing-functions)
7. [Custom Functional Interfaces](#7-custom-functional-interfaces)
8. [Lambda Internals — JVM Level](#8-lambda-internals--jvm-level)
9. [Lambda với Collections & Comparator](#9-lambda-với-collections--comparator)
10. [Exception Handling trong Lambda](#10-exception-handling-trong-lambda)
11. [Lambda Patterns & Recipes](#11-lambda-patterns--recipes)
12. [Common Mistakes & Best Practices](#12-common-mistakes--best-practices)

---

# 1. Lambda Fundamentals

## 1.1 Lambda là gì?

```
LAMBDA = anonymous function (hàm không có tên)
  Cú pháp ngắn gọn để implement Functional Interface
  "Behavior as a value" — truyền hàm như là data

TRƯỚC LAMBDA (Java 7 và trước):
  // Phải dùng Anonymous Class
  button.addActionListener(new ActionListener() {
      @Override
      public void actionPerformed(ActionEvent e) {
          System.out.println("Button clicked!");
      }
  });

  Comparator<String> comp = new Comparator<String>() {
      @Override
      public int compare(String a, String b) {
        return a.compareTo(b);
      }
  };

VỚI LAMBDA (Java 8+):
  button.addActionListener(e -> System.out.println("Button clicked!"));

  Comparator<String> comp = (a, b) -> a.compareTo(b);

  Ngắn hơn, rõ ràng hơn, tập trung vào LOGIC không phải boilerplate!

TẠI SAO LAMBDA:
  Readability:    code ngắn, ý định rõ
  Functional:     pass behavior as data
  Lazy:           behavior executed when needed
  Composition:    combine functions
  Stream API:     cần lambda để work (filter, map, reduce)

FUNCTIONAL INTERFACE = interface có ĐÚNG 1 abstract method
  Lambda implement functional interface
  Compiler biết lambda implement method nào (chỉ có 1!)

  @FunctionalInterface   ← annotation optional nhưng nên có
  interface Greeter {
      String greet(String name);  // only abstract method
      default String shout(String name) { return greet(name).toUpperCase(); }
      static Greeter formal() { return name -> "Dear " + name; }
  }

  Greeter hi = name -> "Hello, " + name + "!";
  hi.greet("Khang");       // "Hello, Khang!"
  hi.shout("Khang");       // "HELLO, KHANG!"  (default method!)
```

---

# 2. Functional Interfaces — Built-in

## 2.1 Package java.util.function

```java
// Java cung cấp sẵn các @FunctionalInterface phổ biến
// java.util.function package

// ──────────────────────────────────────────────────────
//  INTERFACE          SIGNATURE          USE CASE
// ──────────────────────────────────────────────────────
//  Function<T,R>      T → R              transform
//  Predicate<T>       T → boolean        filter/test
//  Consumer<T>        T → void           side effects
//  Supplier<T>        () → T             provide value
//  UnaryOperator<T>   T → T              transform same type
//  BinaryOperator<T>  (T,T) → T          combine same type
//  BiFunction<T,U,R>  (T,U) → R          two inputs
//  BiPredicate<T,U>   (T,U) → boolean    two inputs test
//  BiConsumer<T,U>    (T,U) → void       two inputs side effect
//  Runnable           () → void          run (no in, no out)
//  Callable<V>        () → V throws      provide or throw
//  Comparator<T>      (T,T) → int        compare
// ──────────────────────────────────────────────────────
```

## 2.2 Function\<T, R\>

```java
import java.util.function.*;

// FUNCTION: T → R (transform input to output)
Function<String, Integer> strLen = s -> s.length();
Function<String, String>  upper  = String::toUpperCase;
Function<Integer, String> intToStr = i -> "Number: " + i;
Function<Order, String>   getStatus = o -> o.getStatus().name();

int len = strLen.apply("hello");  // 5
// .apply(T) → R: the core method

// COMPOSE (before → this):
Function<String, String> trim  = String::trim;
Function<String, Integer> len2 = String::length;

Function<String, Integer> trimThenLength = trim.andThen(len2);
// trim THEN length: "  hello  " → "hello" → 5

// ANDTHEN (this → after):
Function<String, String> trimmedUpper = trim.andThen(upper);
// "  hello  " → "hello" → "HELLO"

// COMPOSE:
Function<Integer, Integer> times2 = n -> n * 2;
Function<Integer, Integer> plus3  = n -> n + 3;

Function<Integer, Integer> times2ThenPlus3 = times2.andThen(plus3); // (n*2)+3
Function<Integer, Integer> plus3ThenTimes2 = times2.compose(plus3); // (n+3)*2
times2ThenPlus3.apply(5); // 13: 5*2=10, 10+3=13
plus3ThenTimes2.apply(5); // 16: 5+3=8,  8*2=16

// IDENTITY: returns input unchanged
Function<String, String> identity = Function.identity();
// Useful as no-op in chains

// BI FUNCTION (two inputs):
BiFunction<String, Integer, String> repeat = (s, n) -> s.repeat(n);
repeat.apply("ha", 3); // "hahaha"

BiFunction<Order, Discount, BigDecimal> applyDiscount =
    (order, discount) -> order.getTotal().multiply(discount.getFactor());
```

## 2.3 Predicate\<T\>

```java
// PREDICATE: T → boolean (test/filter condition)
Predicate<String>  isBlank    = String::isBlank;
Predicate<Integer> isPositive = n -> n > 0;
Predicate<Order>   isPending  = o -> o.getStatus() == OrderStatus.PENDING;
Predicate<String>  isEmail    = s -> s.contains("@");

boolean result = isPending.test(order);  // core method: .test(T) → boolean

// COMBINING PREDICATES:
Predicate<Order> isConfirmed    = o -> o.getStatus() == OrderStatus.CONFIRMED;
Predicate<Order> isHighValue    = o -> o.getTotal().compareTo(BigDecimal.valueOf(1000)) > 0;
Predicate<Order> isVietnam      = o -> "VN".equals(o.getCountry());

// AND (&&):
Predicate<Order> vipOrder = isConfirmed.and(isHighValue);
vipOrder.test(order);  // true only if confirmed AND high value

// OR (||):
Predicate<Order> needsAttention = isPending.or(o -> o.isExpired());
needsAttention.test(order);  // true if pending OR expired

// NEGATE (!):
Predicate<Order> isNotPending  = isPending.negate();
Predicate<Order> notExpired    = Predicate.not(Order::isExpired);  // Java 11+

// COMPLEX COMPOSITION:
Predicate<Order> filter = isConfirmed
    .and(isHighValue)
    .and(isVietnam)
    .and(o -> o.getCreatedAt().isAfter(lastMonth));

orders.stream().filter(filter).collect(toList());

// PREDICATE.NOT (Java 11+):
List<String> nonEmpty = strings.stream()
    .filter(Predicate.not(String::isEmpty))
    .collect(toList());

// BI PREDICATE:
BiPredicate<String, Integer> longerThan = (s, n) -> s.length() > n;
longerThan.test("hello", 3);  // true
```

## 2.4 Consumer\<T\>

```java
// CONSUMER: T → void (side effect, no return)
Consumer<String>     print    = System.out::println;
Consumer<Order>      process  = o -> orderProcessor.process(o);
Consumer<User>       sendMail = u -> emailService.send(u.getEmail());
Consumer<List<String>> clear  = List::clear;

print.accept("Hello!");  // core method: .accept(T) → void

// ANDTHEN (chain consumers):
Consumer<Order> log   = o -> log.info("Processing: {}", o.getId());
Consumer<Order> save  = o -> orderRepository.save(o);
Consumer<Order> notify = o -> notificationService.notify(o);

Consumer<Order> fullProcess = log.andThen(save).andThen(notify);
orders.forEach(fullProcess);  // log → save → notify for each order

// BI CONSUMER:
BiConsumer<String, Integer> printRepeat = (s, n) -> System.out.println(s.repeat(n));
printRepeat.accept("Ha", 3);  // "HaHaHa"

Map<String, Integer> map = new HashMap<>();
BiConsumer<String, Integer> addToMap = map::put;
```

## 2.5 Supplier\<T\>

```java
// SUPPLIER: () → T (provide value, no input)
Supplier<String>     greeting    = () -> "Hello!";
Supplier<Order>      emptyOrder  = Order::new;          // constructor ref!
Supplier<List<String>> newList   = ArrayList::new;
Supplier<UUID>       newId       = UUID::randomUUID;
Supplier<LocalDate>  today       = LocalDate::now;

String value = greeting.get();  // core method: .get() → T

// LAZY INITIALIZATION:
// Value computed only when .get() is called!
Supplier<ExpensiveObject> lazy = () -> {
    log.info("Creating expensive object...");
    return new ExpensiveObject();  // only runs when .get() called
};

// Common use: orElseGet (lazy default)
Optional<User> user = cache.get(id);
User result = user.orElseGet(() -> database.findById(id));
// () -> database.findById(id) only called if cache miss!
// vs: user.orElse(database.findById(id))  ← DB call ALWAYS made (eager)!

// MEMOIZATION (cache Supplier result):
public static <T> Supplier<T> memoize(Supplier<T> delegate) {
    AtomicReference<T> cached = new AtomicReference<>();
    return () -> {
        T value2 = cached.get();
        if (value2 == null) {
            value2 = delegate.get();
            cached.set(value2);
        }
        return value2;
    };
}
Supplier<Config> config = memoize(() -> loadConfig());
config.get();  // loads once, cached forever
```

## 2.6 UnaryOperator & BinaryOperator

```java
// UNARYOPERATOR<T>: T → T (same type in and out, extends Function<T,T>)
UnaryOperator<String>  trim   = String::trim;
UnaryOperator<Integer> double_ = n -> n * 2;
UnaryOperator<List<String>> sort = list -> { Collections.sort(list); return list; };

String trimmed = trim.apply("  hello  ");  // "hello"

// Identity (no-op):
UnaryOperator<String> identity = UnaryOperator.identity();

// Composing:
UnaryOperator<String> process = ((UnaryOperator<String>) String::trim)
    .andThen(String::toLowerCase)
    .andThen(s -> s.replace(" ", "_"));
process.apply("  Hello World  ");  // "hello_world"

// BINARYOPERATOR<T>: (T, T) → T (two same-type inputs, same-type output)
BinaryOperator<Integer> add   = Integer::sum;
BinaryOperator<String>  concat = String::concat;
BinaryOperator<BigDecimal> sumBD = BigDecimal::add;
BinaryOperator<Order> keepNewer =
    (o1, o2) -> o1.getCreatedAt().isAfter(o2.getCreatedAt()) ? o1 : o2;

add.apply(3, 4);  // 7

// Used in Stream.reduce:
BigDecimal total = orders.stream()
    .map(Order::getTotal)
    .reduce(BigDecimal.ZERO, BigDecimal::add);  // BinaryOperator!

// maxBy / minBy:
BinaryOperator<Order> max = BinaryOperator.maxBy(Comparator.comparing(Order::getTotal));
BinaryOperator<Order> min = BinaryOperator.minBy(Comparator.comparing(Order::getTotal));
```

---

# 3. Lambda Syntax — Mọi Dạng

## 3.1 All Lambda Syntax Forms

```java
// FORM 1: No params
Runnable r = () -> System.out.println("Hello");
Supplier<String> s = () -> "Hello";

// FORM 2: One param — parentheses optional!
Consumer<String> c1 = s2 -> System.out.println(s2);  // no parens
Consumer<String> c2 = (s2) -> System.out.println(s2); // with parens
Predicate<Integer> p = n -> n > 0;

// FORM 3: Multiple params — parentheses REQUIRED
Comparator<String> comp = (a, b) -> a.compareTo(b);
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// FORM 4: With type annotations (usually not needed, inferred)
Comparator<String> comp2 = (String a, String b) -> a.compareTo(b);
BiFunction<Integer, Integer, Integer> add2 = (Integer a, Integer b) -> a + b;

// FORM 5: Expression body (single expression, no braces, implicit return)
Function<Integer, Integer> square = n -> n * n;
Predicate<String> isEmpty = String::isEmpty;

// FORM 6: Block body (braces, explicit return required!)
Function<Integer, String> classify = n -> {
    if (n < 0) return "negative";
    if (n == 0) return "zero";
    if (n < 10) return "small";
    return "large";
};

// FORM 7: Throws exception
// Can only throw unchecked in lambda (without declaring throws)!
// For checked: wrap or use custom functional interface (see section 10)
Function<String, Integer> parse = s3 -> {
    try {
        return Integer.parseInt(s3);
    } catch (NumberFormatException e) {
        throw new IllegalArgumentException("Not a number: " + s3, e);
    }
};

// ── TYPE INFERENCE ──
// Compiler infers lambda types from context (target type):
Comparator<String> c = (a, b) -> a.compareTo(b);
// Compiler knows: a and b are String (from Comparator<String>)
// So: (a, b) not (String a, String b)

// If inference fails: add explicit types
Function<?, ?> ambiguous = x -> x;  // works
// Sometimes need: (String x) -> x.toLowerCase()

// ── RETURN IN LAMBDA ──
// Expression body: implicit return
Function<Integer, Boolean> even = n -> n % 2 == 0;  // implicit return!

// Block body: explicit return REQUIRED
Function<Integer, Boolean> evenBlock = n -> {
    return n % 2 == 0;  // explicit!
};

// Void returning: no return needed
Consumer<String> print = s4 -> System.out.println(s4);  // void return
Consumer<String> block = s4 -> {
    System.out.println(s4);
    // no return statement needed (or just: return;)
};
```

---

# 4. Method References — 4 Loại

## 4.1 Method Reference Types

```java
// METHOD REFERENCE: shorthand for lambda that just calls a method
// Syntax: ClassName::methodName  OR  instance::methodName
// 4 types!

// ── TYPE 1: Static Method Reference ──
// ClassName::staticMethod
// Equivalent lambda: args -> ClassName.staticMethod(args)

Function<String, Integer> parseInt  = Integer::parseInt;   // Integer.parseInt(s)
Function<Double, Double>  abs       = Math::abs;
Predicate<String>         isNull    = Objects::isNull;
Function<Object, String>  toString2 = String::valueOf;
BinaryOperator<Integer>   max       = Integer::max;        // Math.max(a,b)
Consumer<String>          print     = System.out::println; // System.out is a field, not class!
// Note: System.out::println is actually Type 2 (instance method ref on specific instance)

// ── TYPE 2: Instance Method Reference on Specific Instance ──
// instance::instanceMethod
// Equivalent lambda: args -> instance.instanceMethod(args)

String prefix = "Hello, ";
Function<String, String> greet = prefix::concat;  // "Hello, ".concat(name)
greet.apply("Khang");  // "Hello, Khang"

PrintStream out = System.out;
Consumer<String> printer = out::println;   // System.out.println(s)
printer.accept("test");

List<String> list = new ArrayList<>();
Consumer<String> adder = list::add;        // list.add(item)
Supplier<Integer> sizer = list::size;      // list.size()

// ── TYPE 3: Instance Method Reference on Arbitrary Instance of Type ──
// ClassName::instanceMethod
// Equivalent lambda: (instance, args) -> instance.instanceMethod(args)
// FIRST argument becomes the "this" object!

Function<String, String>   upper    = String::toUpperCase;  // s -> s.toUpperCase()
Function<String, Integer>  length   = String::length;       // s -> s.length()
Function<String, String>   trimRef  = String::trim;         // s -> s.trim()
Predicate<String>          isEmpty  = String::isEmpty;      // s -> s.isEmpty()
BiPredicate<String, String> startsWith = String::startsWith;// (s,prefix)->s.startsWith(prefix)
Function<Order, String>    getStatus  = Order::getStatusName; // order -> order.getStatusName()

// The difference from Type 2:
// Type 2: specific instance fixed at lambda creation: "hello"::toUpperCase → always "hello"
// Type 3: instance comes from stream/argument: String::toUpperCase → applies to each element

List<String> names = List.of("alice", "bob", "charlie");
names.stream().map(String::toUpperCase).collect(toList());  // Type 3!
// Each name gets .toUpperCase() called on it

// ── TYPE 4: Constructor Reference ──
// ClassName::new
// Equivalent lambda: args -> new ClassName(args)

Supplier<ArrayList<String>>   newList   = ArrayList::new;    // () -> new ArrayList<>()
Function<Integer, ArrayList<?>> sized   = ArrayList::new;    // n -> new ArrayList<>(n)
Function<String, User>         newUser  = User::new;         // name -> new User(name)
BiFunction<String, String, User> fullUser = User::new;       // (first, last) -> new User(first, last)
Function<int[], IntStream>     arrayStream = Arrays::stream; // array -> Arrays.stream(array)

// Used with Stream.collect:
List<String> copy = names.stream()
    .collect(Collectors.toCollection(ArrayList::new));  // Constructor ref!

// Used with Stream.toArray:
String[] arr = names.stream().toArray(String[]::new);  // n -> new String[n]
Order[]  orders2 = orders.stream().toArray(Order[]::new);
```

## 4.2 Method Reference vs Lambda

```java
// WHEN TO USE METHOD REFERENCE vs LAMBDA:

// ✅ Method reference: cleaner when lambda JUST calls a method
names.stream().map(s -> s.toUpperCase()).collect(toList()); // verbose lambda
names.stream().map(String::toUpperCase).collect(toList()); // cleaner!

// ✅ Lambda: better when there's logic beyond just a method call
names.stream()
    .map(s -> s.toUpperCase() + "!")    // adds "!" → needs lambda
    .collect(toList());

names.stream()
    .filter(s -> s.startsWith("A") && s.length() > 3)  // logic → lambda
    .collect(toList());

// ✅ Method reference: parameter order must match!
// Comparator.comparing expects: Function<Order, Comparable>
orders.stream().sorted(Comparator.comparing(Order::getTotal));
// Order::getTotal is: order -> order.getTotal() — fits Function<Order, BigDecimal>

// ✅ Method reference with default constructor:
Stream.generate(Random::new)   // generates new Random objects
     .limit(5)
     .forEach(r -> System.out.println(r.nextInt(100)));
```

---

# 5. Variable Capture & Closure

## 5.1 What Lambda Can Capture

```java
// LAMBDA CAN CAPTURE:
//   1. Local variables: must be effectively final (not reassigned)
//   2. Instance variables: captured via "this" reference
//   3. Static variables: always accessible

// ── EFFECTIVELY FINAL (local variables) ──
String prefix = "Hello";          // effectively final (never reassigned)
Function<String, String> greet = name -> prefix + ", " + name + "!";
// OK! prefix never changes after assignment

// COMPILE ERROR: variable is not effectively final
String greeting = "Hi";
greeting = "Hello";               // reassigned!
Function<String, String> fn = n -> greeting + n;  // ERROR!

// WORK AROUND (if you need to "modify" in lambda):
// Use array (container is final, content can change):
int[] counter = {0};
Runnable increment = () -> counter[0]++;  // OK! array reference is final
// But: avoid this pattern! Use AtomicInteger for thread safety

// Use AtomicReference:
AtomicInteger atomicCount = new AtomicInteger(0);
Runnable atomicIncrement = () -> atomicCount.incrementAndGet();  // OK!

// ── INSTANCE VARIABLES ──
class OrderProcessor {
    private final OrderRepository repository;  // instance var
    private String region;                     // instance var (mutable)

    public Predicate<Order> regionFilter() {
        // Captures "this" implicitly:
        return order -> this.region.equals(order.getRegion());
        // region can change (instance var), lambda sees current value each call!
    }

    public Consumer<Order> saveOrder() {
        // Captures repository (via "this"):
        return order -> repository.save(order);
        // Equivalent: return repository::save;
    }
}

// ── CLOSURE ── (lambda + captured environment)
// Lambda "closes over" its surrounding scope:
public List<Predicate<Integer>> buildFilters(List<Integer> thresholds) {
    return thresholds.stream()
        .map(threshold -> (Predicate<Integer>) n -> n > threshold)
        // Each lambda captures DIFFERENT threshold value!
        .collect(Collectors.toList());
}

List<Predicate<Integer>> filters = buildFilters(List.of(10, 20, 30));
filters.get(0).test(15);  // true  (15 > 10)
filters.get(1).test(15);  // false (15 > 20 = false)
filters.get(2).test(15);  // false (15 > 30 = false)
// Each lambda has its own captured "threshold"!

// ── COMMON CLOSURE GOTCHA ──
// In a loop: variable changes before lambda executes!
List<Runnable> tasks = new ArrayList<>();
for (int i = 0; i < 5; i++) {
    final int captured = i;   // capture current value!
    tasks.add(() -> System.out.println(captured));
}
tasks.forEach(Runnable::run);  // 0, 1, 2, 3, 4 ✓

// Without final copy: would capture the VARIABLE i, not its value
// (but in Java, loop variable changes → compile error in lambda! Java saves you here)

// In streams, naturally safe:
IntStream.range(0, 5)
    .forEach(i -> System.out.println(i));  // captures each value of i correctly
```

---

# 6. Composing Functions

## 6.1 Function Composition Patterns

```java
// ── FUNCTION COMPOSITION ──
// andThen: this THEN that
// compose: that THEN this (reverse order!)

Function<String, String>  trim   = String::trim;
Function<String, String>  lower  = String::toLowerCase;
Function<String, String>  clean  = s -> s.replaceAll("[^a-z0-9]", "");
Function<String, Integer> length = String::length;

// Pipeline: trim → lowercase → clean → length
Function<String, Integer> processString = trim
    .andThen(lower)
    .andThen(clean)
    .andThen(length);

processString.apply("  Hello World! 123  ");  // 12 (helloworld123)

// COMPOSE (opposite order):
Function<Integer, Integer> times2 = n -> n * 2;
Function<Integer, Integer> plus10 = n -> n + 10;

Function<Integer, Integer> a = times2.andThen(plus10);  // (n*2)+10
Function<Integer, Integer> b = times2.compose(plus10);  // (n+10)*2
a.apply(5);  // 20: 5*2=10, 10+10=20
b.apply(5);  // 30: 5+10=15, 15*2=30

// ── PREDICATE COMPOSITION ──
Predicate<String> notNull   = Objects::nonNull;
Predicate<String> notEmpty  = s -> !s.isEmpty();
Predicate<String> notBlank  = s -> !s.isBlank();
Predicate<String> maxLength = s -> s.length() <= 100;
Predicate<String> hasAt     = s -> s.contains("@");

Predicate<String> validEmail = notNull
    .and(notEmpty)
    .and(maxLength)
    .and(hasAt);

// Build dynamic predicate from list:
List<Predicate<Order>> filters = buildDynamicFilters(criteria);
Predicate<Order> combined = filters.stream()
    .reduce(o -> true, Predicate::and);  // all must match (AND)
// or:
Predicate<Order> anyMatch = filters.stream()
    .reduce(o -> false, Predicate::or);  // any must match (OR)

orders.stream().filter(combined).collect(toList());

// ── CONSUMER CHAINING ──
Consumer<Order> validate  = o -> validator.validate(o);
Consumer<Order> save      = orderRepository::save;
Consumer<Order> index     = searchIndexer::index;
Consumer<Order> publish   = eventPublisher::publishCreated;
Consumer<Order> notify    = notificationService::sendConfirmation;

Consumer<Order> processOrder = validate
    .andThen(save)
    .andThen(index)
    .andThen(publish)
    .andThen(notify);

orders.forEach(processOrder);  // all 5 consumers run for each order

// ── FUNCTION PIPELINE BUILDER ──
@SafeVarargs
public static <T> Function<T, T> pipeline(UnaryOperator<T>... stages) {
    return Arrays.stream(stages)
        .map(stage -> (Function<T, T>) stage)
        .reduce(Function.identity(), Function::andThen);
}

Function<String, String> cleanString = pipeline(
    String::trim,
    String::toLowerCase,
    s -> s.replaceAll("\\s+", "_"),
    s -> s.replaceAll("[^a-z0-9_]", "")
);
cleanString.apply("  Hello World! 2025  ");  // "hello_world_2025"
```

---

# 7. Custom Functional Interfaces

## 7.1 Defining Your Own

```java
// DEFINE custom functional interface when built-in don't fit:
// - Different number of params (>2)
// - Checked exceptions
// - Domain-specific naming (clarity)
// - Specific primitive types not in java.util.function

// ── BASIC CUSTOM ──
@FunctionalInterface
public interface Transformer<T, R> {
    R transform(T input);
    // Same as Function<T,R> but clearer domain name

    // Default + static methods are OK in functional interface!
    default <V> Transformer<T, V> andThen(Transformer<R, V> after) {
        return input -> after.transform(this.transform(input));
    }
}

Transformer<String, Integer> strLen = s -> s.length();

// ── THREE-ARG FUNCTION ──
@FunctionalInterface
public interface TriFunction<A, B, C, R> {
    R apply(A a, B b, C c);
}

TriFunction<String, Integer, Boolean, String> format =
    (str, n, upper) -> {
        String result = str.repeat(n);
        return upper ? result.toUpperCase() : result;
    };
format.apply("ha", 3, true);  // "HAHAHA"

// ── CHECKED EXCEPTION FUNCTIONAL INTERFACE ──
// java.util.function doesn't allow checked exceptions!
// Solution: define your own that throws:

@FunctionalInterface
public interface CheckedFunction<T, R> {
    R apply(T t) throws Exception;

    // Wrap to standard Function (catching checked):
    static <T, R> Function<T, R> wrap(CheckedFunction<T, R> fn) {
        return t -> {
            try {
                return fn.apply(t);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
    }
}

@FunctionalInterface
public interface CheckedSupplier<T> {
    T get() throws Exception;

    static <T> Supplier<T> wrap(CheckedSupplier<T> s) {
        return () -> {
            try { return s.get(); }
            catch (Exception e) { throw new RuntimeException(e); }
        };
    }
}

// Usage:
Function<String, String> readFile = CheckedFunction.wrap(
    path -> Files.readString(Path.of(path))  // throws IOException
);

List<String> contents = paths.stream()
    .map(CheckedFunction.wrap(path -> Files.readString(Path.of(path))))
    .collect(toList());

// ── PREDICATE WITH CONTEXT ──
@FunctionalInterface
public interface OrderFilter {
    boolean matches(Order order, User requestingUser, LocalDate asOf);

    default OrderFilter and(OrderFilter other) {
        return (order, user, date) ->
            this.matches(order, user, date) && other.matches(order, user, date);
    }

    default OrderFilter negate() {
        return (order, user, date) -> !this.matches(order, user, date);
    }
}

OrderFilter visibleToUser = (order, user, date) ->
    order.getUserId().equals(user.getId()) || user.isAdmin();

OrderFilter notExpired = (order, user, date) ->
    order.getExpiresAt().isAfter(date);

OrderFilter accessFilter = visibleToUser.and(notExpired);
```

---

# 8. Lambda Internals — JVM Level

## 8.1 How Lambda Works Under the Hood

```
ANONYMOUS CLASS (old way):
  Comparator<String> c = new Comparator<String>() {
      @Override
      public int compare(String a, String b) { return a.compareTo(b); }
  };

  JVM behavior:
    - Compiles to separate .class file (MyClass$1.class)
    - Creates new object every call
    - HEAVY: classloading, object allocation, GC pressure

LAMBDA (new way):
  Comparator<String> c = (a, b) -> a.compareTo(b);

  JVM behavior:
    - Compiled to private static method in containing class
    - Uses invokedynamic bytecode instruction (JVM magic!)
    - First call: JVM generates lambda class via LambdaMetafactory
    - Subsequent calls: may reuse same instance (if no captured vars)
    - LIGHTER: no separate .class file, JVM can optimize

INVOKEDYNAMIC MAGIC:
  Java 7 added invokedynamic (for dynamic languages on JVM)
  Java 8 uses it for lambdas!
  
  First time lambda is called:
    JVM calls LambdaMetafactory.metafactory()
    Factory creates a class implementing the functional interface
    Class delegates to the private static method in your class
    
  Non-capturing lambda (no variables captured):
    JVM can return SAME instance every time! (optimization)
    (a, b) -> a.compareTo(b)  →  singleton instance reused
    
  Capturing lambda (captures variables):
    New instance per call (must store captured variables)
    s -> s.startsWith(prefix)  →  new instance wrapping 'prefix'

PRACTICAL IMPLICATIONS:
  Non-capturing lambdas: effectively free objects (reused)
  Capturing lambdas: small object allocation (tiny, GC-friendly)
  vs Anonymous classes: much cheaper than anonymous classes

BYTECODE DIFFERENCE:
  // Anonymous class → aconst_null, new, dup, invokespecial
  // Lambda → invokedynamic (deferred to runtime)
  
  Lambda is ALWAYS at least as fast as anonymous class,
  often faster (JVM can optimize better with invokedynamic)
```

## 8.2 Lambda Performance Tips

```java
// ── NON-CAPTURING vs CAPTURING ──
// Non-capturing (no external variables): stateless, often singleton
Predicate<String> nonCapture = s -> s.length() > 5;        // no capture
// → JVM MAY reuse same instance

// Capturing (external variables in scope): new instance
int min = 5;
Predicate<String> capturing = s -> s.length() > min;       // captures 'min'
// → new instance with stored 'min' value

// In loops: avoid creating capturing lambdas repeatedly!
for (Order order : orders) {
    String prefix = order.getCustomerId();
    names.stream()
        .filter(n -> n.startsWith(prefix))  // new lambda EACH iteration!
        .collect(toList());
}

// Better: move lambda creation outside loop when possible
// Or: accept the allocation (modern JVMs handle this well)

// ── METHOD REFERENCES ARE OFTEN EQUIVALENT ──
// String::toUpperCase vs s -> s.toUpperCase()
// Both compile to lambda — no performance difference!
// Prefer method reference for readability

// ── DON'T USE LAMBDA WHERE NOT NEEDED ──
// Unnecessary wrapping:
list.stream().forEach(s -> System.out.println(s));   // lambda wraps method
list.stream().forEach(System.out::println);          // method ref: slightly cleaner
list.forEach(System.out::println);                   // no stream needed for forEach!
```

---

# 9. Lambda với Collections & Comparator

## 9.1 Comparator — Lambda's Best Friend

```java
// COMPARATOR is most common place to use lambda!

List<Person> people = getPeople();

// ── BASIC COMPARATOR LAMBDA ──
people.sort((p1, p2) -> p1.getName().compareTo(p2.getName()));

// ── COMPARATOR.COMPARING — cleaner! ──
people.sort(Comparator.comparing(Person::getName));              // by name
people.sort(Comparator.comparing(Person::getAge));               // by age
people.sort(Comparator.comparingInt(Person::getAge));            // primitive (faster!)
people.sort(Comparator.comparingLong(Person::getId));

// REVERSED:
people.sort(Comparator.comparing(Person::getName).reversed());   // Z→A

// MULTI-LEVEL SORTING:
people.sort(
    Comparator.comparing(Person::getLastName)
              .thenComparing(Person::getFirstName)
              .thenComparingInt(Person::getAge)
);

// NULL HANDLING:
people.sort(Comparator.comparing(Person::getName,
    Comparator.nullsFirst(Comparator.naturalOrder())));  // nulls first
people.sort(Comparator.comparing(Person::getName,
    Comparator.nullsLast(Comparator.naturalOrder())));   // nulls last

// CUSTOM KEY EXTRACTOR:
people.sort(Comparator.comparing(p -> p.getName().toLowerCase()));

// WITH STREAMS:
List<Person> sorted = people.stream()
    .sorted(Comparator.comparing(Person::getAge).reversed()
        .thenComparing(Person::getName))
    .collect(toList());

// MIN / MAX with Comparator:
Optional<Person> oldest  = people.stream().max(Comparator.comparingInt(Person::getAge));
Optional<Person> youngest = people.stream().min(Comparator.comparingInt(Person::getAge));

// ── COLLECTIONS METHODS WITH LAMBDA ──
// removeIf:
orders.removeIf(o -> o.getStatus() == CANCELLED && o.isOlderThan(30));

// replaceAll:
List<String> names = new ArrayList<>(List.of("alice", "bob", "charlie"));
names.replaceAll(String::toUpperCase);
// ["ALICE", "BOB", "CHARLIE"]

// forEach on Map:
Map<String, Integer> scores = Map.of("Alice", 95, "Bob", 87);
scores.forEach((name, score) ->
    System.out.printf("%s scored %d%n", name, score));

// compute, merge, replaceAll on Map:
Map<String, Integer> wordCount = new HashMap<>();
words.forEach(word ->
    wordCount.merge(word, 1, Integer::sum));  // count occurrences

wordCount.replaceAll((word, count) -> count * 2);  // double all counts

wordCount.computeIfAbsent("newword", k -> 0);      // add if missing
wordCount.computeIfPresent("alice", (k, v) -> v + 10); // update if present
```

---

# 10. Exception Handling dalam Lambda

## 10.1 Checked Exceptions Problem

```java
// PROBLEM: lambda body can't throw checked exceptions
// (unless the functional interface declares them)

// ❌ COMPILE ERROR: Files.readString throws IOException (checked!)
List<String> contents = paths.stream()
    .map(path -> Files.readString(path))  // ERROR: Unhandled IOException
    .collect(toList());

// ── SOLUTION 1: Wrap in try-catch (verbose) ──
List<String> contents1 = paths.stream()
    .map(path -> {
        try {
            return Files.readString(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read: " + path, e);
        }
    })
    .collect(toList());

// ── SOLUTION 2: Wrapper utility method ──
@FunctionalInterface
public interface CheckedFunction<T, R> {
    R apply(T t) throws Exception;

    static <T, R> Function<T, R> wrap(CheckedFunction<T, R> fn) {
        return t -> {
            try {
                return fn.apply(t);
            } catch (RuntimeException e) {
                throw e;  // don't wrap already-unchecked
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
    }
}

// Clean usage:
List<String> contents2 = paths.stream()
    .map(CheckedFunction.wrap(path -> Files.readString(path)))
    .collect(toList());
// Or even cleaner with method reference:
List<String> contents3 = paths.stream()
    .map(CheckedFunction.wrap(Files::readString))  // wait, needs Path not String
    .collect(toList());

// ── SOLUTION 3: Custom functional interface that declares throws ──
@FunctionalInterface
public interface IOFunction<T, R> {
    R apply(T t) throws IOException;
}
// Works for IOExceptions specifically, but can't use in standard Stream.map()

// ── SOLUTION 4: Return Optional on error ──
public static <T, R> Function<T, Optional<R>> tryOrEmpty(CheckedFunction<T, R> fn) {
    return t -> {
        try {
            return Optional.ofNullable(fn.apply(t));
        } catch (Exception e) {
            log.warn("Error processing element", e);
            return Optional.empty();
        }
    };
}

List<String> contents4 = paths.stream()
    .map(tryOrEmpty(path -> Files.readString(path)))
    .filter(Optional::isPresent)
    .map(Optional::get)
    .collect(toList());

// ── SOLUTION 5: Either type ──
public sealed interface Either<L, R> {
    record Left<L, R>(L value) implements Either<L, R> {}
    record Right<L, R>(R value) implements Either<L, R> {}

    static <L, R> Either<L, R> left(L value)  { return new Left<>(value); }
    static <L, R> Either<L, R> right(R value) { return new Right<>(value); }
}

List<Either<Exception, String>> results = paths.stream()
    .map(path -> {
        try {
            return Either.<Exception, String>right(Files.readString(path));
        } catch (IOException e) {
            return Either.<Exception, String>left(e);
        }
    })
    .collect(toList());

// Separate successes from failures:
List<String> successes = results.stream()
    .filter(e -> e instanceof Either.Right<?,?>)
    .map(e -> ((Either.Right<Exception, String>) e).value())
    .collect(toList());

List<Exception> failures = results.stream()
    .filter(e -> e instanceof Either.Left<?,?>)
    .map(e -> ((Either.Left<Exception, String>) e).value())
    .collect(toList());
```

---

# 11. Lambda Patterns & Recipes

## 11.1 Useful Patterns

```java
// ── STRATEGY PATTERN ──
// Replace if-else chains with Map<condition, strategy>
Map<OrderStatus, Consumer<Order>> handlers = Map.of(
    OrderStatus.PENDING,   order -> processPendingOrder(order),
    OrderStatus.CONFIRMED, order -> processConfirmedOrder(order),
    OrderStatus.CANCELLED, order -> processCancelledOrder(order)
);

Consumer<Order> handler = handlers.getOrDefault(
    order.getStatus(),
    o -> log.warn("Unknown status: {}", o.getStatus())
);
handler.accept(order);

// ── COMMAND PATTERN ──
// Encapsulate actions as lambdas
List<Runnable> commands = new ArrayList<>();
commands.add(() -> createOrder(request));
commands.add(() -> notifyCustomer(customer));
commands.add(() -> updateInventory(items));

// Execute all:
commands.forEach(Runnable::run);
// Execute with undo (if Runnable has undo partner):
Deque<Runnable> undoStack = new ArrayDeque<>();

// ── DECORATOR PATTERN ──
// Wrap functions with additional behavior
static <T, R> Function<T, R> logged(String name, Function<T, R> fn) {
    return input -> {
        log.debug("Calling {} with: {}", name, input);
        long start = System.currentTimeMillis();
        R result = fn.apply(input);
        log.debug("{} returned: {} ({}ms)", name, result, System.currentTimeMillis()-start);
        return result;
    };
}

static <T, R> Function<T, R> timed(String metricName, Function<T, R> fn, Timer timer) {
    return input -> timer.record(() -> fn.apply(input));
}

static <T, R> Function<T, R> retried(int maxAttempts, Function<T, R> fn) {
    return input -> {
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return fn.apply(input);
            } catch (RuntimeException e) {
                if (attempt == maxAttempts) throw e;
                log.warn("Attempt {} failed, retrying...", attempt);
                Thread.sleep(attempt * 100L);
            }
        }
        throw new RuntimeException("Should not reach here");
    };
}

Function<String, User> fetchUser = userId -> userApi.getUser(userId);
Function<String, User> robustFetch = logged("fetchUser",
    timed("user.fetch.ms",
        retried(3, fetchUser), timer));

// ── MEMOIZATION ──
static <T, R> Function<T, R> memoize(Function<T, R> fn) {
    ConcurrentHashMap<T, R> cache = new ConcurrentHashMap<>();
    return input -> cache.computeIfAbsent(input, fn);
}

Function<Long, User> loadUser = id -> userRepository.findById(id);
Function<Long, User> cachedUser = memoize(loadUser);
cachedUser.apply(1L);  // loads from DB
cachedUser.apply(1L);  // returns cached result!

// ── LAZY EVALUATION ──
static <T> Supplier<T> lazy(Supplier<T> delegate) {
    final Object[] cache = {null};
    final boolean[] computed = {false};
    return () -> {
        if (!computed[0]) {
            cache[0] = delegate.get();
            computed[0] = true;
        }
        return (T) cache[0];
    };
}

Supplier<Config> lazyConfig = lazy(() -> {
    log.info("Loading config (expensive)...");
    return configLoader.load();
});
// Not loaded yet
Config config = lazyConfig.get();  // loads once
Config same   = lazyConfig.get();  // returns cached

// ── CONDITIONAL EXECUTION ──
static <T> Consumer<T> doIf(Predicate<T> condition, Consumer<T> action) {
    return item -> { if (condition.test(item)) action.accept(item); };
}

Consumer<Order> conditionalNotify = doIf(
    o -> o.getTotal().compareTo(valueOf(10000)) > 0,
    o -> premiumNotificationService.notify(o)
);
orders.forEach(conditionalNotify);

// ── NULLSAFE FUNCTION ──
static <T, R> Function<T, R> nullSafe(Function<T, R> fn) {
    return t -> t == null ? null : fn.apply(t);
}

Function<User, String> getEmail = nullSafe(User::getEmail);
// Works even if user is null (returns null instead of NPE)

// ── SWITCH EXPRESSION WITH LAMBDA (Java 14+) ──
Function<OrderStatus, String> statusLabel = status -> switch (status) {
    case PENDING   -> "Awaiting Processing";
    case CONFIRMED -> "Order Confirmed";
    case SHIPPED   -> "On the Way!";
    case DELIVERED -> "Delivered";
    case CANCELLED -> "Cancelled";
};
```

---

# 12. Common Mistakes & Best Practices

## 12.1 Lambda Mistakes

```java
// ❌ MISTAKE 1: RETURNING FROM LAMBDA THINKING IT RETURNS FROM METHOD
public List<String> findNames(List<User> users, String prefix) {
    users.forEach(u -> {
        if (u.getName().startsWith(prefix)) {
            return u.getName();  // returns from LAMBDA, not method!
        }
    });
    return Collections.emptyList();  // always returns empty!
}

// ✅ CORRECT: use stream filter+map+collect
public List<String> findNames(List<User> users, String prefix) {
    return users.stream()
        .filter(u -> u.getName().startsWith(prefix))
        .map(User::getName)
        .collect(toList());
}


// ❌ MISTAKE 2: MODIFYING CAPTURED VARIABLE (compile error!)
int count = 0;
orders.forEach(o -> {
    if (o.isExpired()) count++;  // ERROR: local variable must be final!
});

// ✅ CORRECT: use AtomicInteger or stream.filter.count()
AtomicInteger count2 = new AtomicInteger(0);
orders.forEach(o -> { if (o.isExpired()) count2.incrementAndGet(); });

// Or better: use stream
long expiredCount = orders.stream().filter(Order::isExpired).count();


// ❌ MISTAKE 3: OVERLY COMPLEX LAMBDA (should be a method)
orders.stream()
    .filter(o -> {
        if (o.getStatus() != CONFIRMED) return false;
        if (o.getTotal().compareTo(BigDecimal.valueOf(1000)) <= 0) return false;
        LocalDate cutoff = LocalDate.now().minusDays(30);
        return o.getCreatedAt().toLocalDate().isAfter(cutoff);
    })
    .collect(toList());

// ✅ CORRECT: extract to named method
orders.stream()
    .filter(this::isVipOrder)  // clear intent, testable, readable
    .collect(toList());

private boolean isVipOrder(Order order) {
    return order.getStatus() == CONFIRMED
        && order.getTotal().compareTo(BigDecimal.valueOf(1000)) > 0
        && order.getCreatedAt().toLocalDate().isAfter(LocalDate.now().minusDays(30));
}


// ❌ MISTAKE 4: SIDE EFFECTS IN FILTER/MAP (non-functional, confusing)
orders.stream()
    .filter(o -> {
        boolean result = o.isValid();
        if (!result) log.warn("Invalid order: " + o.getId()); // side effect in filter!
        return result;
    })
    .collect(toList());

// ✅ CORRECT: use peek for side effects, or handle after collect
orders.stream()
    .filter(Order::isValid)
    .peek(o -> log.debug("Processing valid order: {}", o.getId()))  // OK in peek
    .collect(toList());

// Or separate concerns:
List<Order> invalid = orders.stream().filter(o -> !o.isValid()).collect(toList());
invalid.forEach(o -> log.warn("Invalid order: {}", o.getId()));


// ❌ MISTAKE 5: LAMBDA WHEN METHOD REFERENCE IS CLEANER
list.stream().map(s -> s.toUpperCase()).collect(toList());  // lambda
list.stream().map(String::toUpperCase).collect(toList());  // method ref: cleaner

list.stream().filter(s -> !s.isEmpty()).collect(toList());  // lambda
list.stream().filter(Predicate.not(String::isEmpty)).collect(toList());  // cleaner!

list.forEach(item -> System.out.println(item));  // lambda
list.forEach(System.out::println);               // method ref: cleaner


// ❌ MISTAKE 6: CHECKED EXCEPTION IGNORED OR SWALLOWED
paths.stream()
    .map(p -> {
        try {
            return Files.readString(p);
        } catch (IOException e) {
            return "";  // silently ignoring error! Empty string looks like valid result
        }
    })
    .collect(toList());

// ✅ CORRECT: fail fast or use Either/Optional
paths.stream()
    .map(CheckedFunction.wrap(p -> Files.readString(p)))  // throws RuntimeException
    .collect(toList());


// ❌ MISTAKE 7: BOXING OVERHEAD IN TIGHT LOOP
long sum = longList.stream()
    .map(n -> n * 2L)                  // Stream<Long> — boxing!
    .reduce(0L, Long::sum);

// ✅ CORRECT: use primitive stream
long sum2 = longList.stream()
    .mapToLong(Long::longValue)        // LongStream — no boxing!
    .map(n -> n * 2L)
    .sum();
```

## 12.2 Best Practices Summary

```java
// ── KEEP LAMBDAS SHORT (1-3 lines max) ──
// If longer: extract to named method → testable, readable, reusable

// SHORT: OK in lambda
orders.stream()
    .filter(o -> o.getStatus() == PENDING)
    .map(o -> o.getId().toString())
    .collect(toList());

// LONG: extract to method!
// BAD:
orders.stream()
    .filter(o -> {
        // 10 lines of complex logic
    })
    .collect(toList());

// GOOD:
orders.stream()
    .filter(this::shouldProcess)  // name explains intent
    .collect(toList());


// ── PREFER METHOD REFERENCES FOR SINGLE METHOD CALLS ──
.map(String::toUpperCase)       over  .map(s -> s.toUpperCase())
.filter(Objects::nonNull)       over  .filter(s -> s != null)
.sorted(Comparator.naturalOrder()) over .sorted((a,b) -> a.compareTo(b))
.forEach(System.out::println)   over  .forEach(s -> System.out.println(s))


// ── AVOID MUTABLE STATE IN LAMBDAS ──
// Use streams to PRODUCE results, not mutate external state
// Bad: forEach + mutable collection
// Good: collect to new collection

// ── USE DESCRIPTIVE NAMES FOR COMPLEX LAMBDAS ──
Predicate<Order> isEligibleForDiscount = order ->
    order.getTotal().compareTo(BigDecimal.valueOf(5000)) >= 0
    && order.getCustomer().isPremium()
    && !order.hasExistingDiscount();

orders.stream()
    .filter(isEligibleForDiscount)  // clear intent!
    .forEach(discountService::apply);


// ── UNDERSTAND TARGET TYPE ──
// Lambda type is inferred from context (target type)
// Same lambda body can implement different interfaces:
Runnable r          = () -> System.out.println("hi");  // Runnable
Callable<Void> c    = () -> { System.out.println("hi"); return null; };  // Callable
Supplier<Void> s    = () -> { System.out.println("hi"); return null; };  // Supplier


// ── FUNCTIONAL STYLE: NO SIDE EFFECTS IN PIPELINE ──
// map/filter/flatMap: should be pure (no side effects)
// forEach/peek: designed for side effects
// Keep: data transformation in stream, side effects at the end


// ── TEST LAMBDAS INDIRECTLY ──
// Extract lambda to variable/method → test the method!
Predicate<Order> isHighValue = o -> o.getTotal().compareTo(valueOf(1000)) > 0;

@Test
void isHighValue_returnsTrue_forHighValueOrders() {
    Order high = OrderBuilder.withTotal(2000);
    Order low  = OrderBuilder.withTotal(500);
    assertThat(isHighValue.test(high)).isTrue();
    assertThat(isHighValue.test(low)).isFalse();
}
```

---

## 📎 Lambda Quick Reference

```
SYNTAX:
  () -> expression                   no params, expression body
  () -> { statements; }              no params, block body
  param -> expression                one param (parens optional)
  (p1, p2) -> expression             multiple params
  (Type p1, Type p2) -> expression   with explicit types

METHOD REFERENCE (4 types):
  ClassName::staticMethod            Integer::parseInt
  instance::instanceMethod           System.out::println
  ClassName::instanceMethod          String::toUpperCase (first arg = this)
  ClassName::new                     ArrayList::new

FUNCTIONAL INTERFACES (java.util.function):
  Function<T,R>       T → R          .apply(t)
  Predicate<T>        T → boolean    .test(t)
  Consumer<T>         T → void       .accept(t)
  Supplier<T>         () → T         .get()
  UnaryOperator<T>    T → T          .apply(t)
  BinaryOperator<T>   (T,T) → T      .apply(t1, t2)
  BiFunction<T,U,R>   (T,U) → R      .apply(t, u)
  Runnable            () → void      .run()

COMPOSITION:
  Function:   f.andThen(g) = g(f(x)),  f.compose(g) = f(g(x))
  Predicate:  p.and(q),  p.or(q),  p.negate()
  Consumer:   c1.andThen(c2)

VARIABLE CAPTURE:
  Local vars: must be effectively final (never reassigned)
  Instance vars: captured via implicit "this" reference
  Static vars: always accessible

CHECKED EXCEPTIONS:
  Standard interfaces don't allow checked exceptions
  Fix: wrap in try-catch inside lambda
  Or: use CheckedFunction.wrap() utility
  Or: define custom interface that throws

BEST PRACTICES:
  Keep short (1-3 lines) — extract long lambdas to named methods
  Prefer method references for single-method calls
  No mutable shared state in lambdas
  No side effects in map/filter (use forEach/peek for side effects)
  @FunctionalInterface on custom functional interfaces
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Lambda Expressions (Java Tutorial) | <https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html> |
| java.util.function | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/function/package-summary.html> |
| Function | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/function/Function.html> |
| Predicate | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/function/Predicate.html> |
| Comparator | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Comparator.html> |
| Method References | <https://docs.oracle.com/javase/tutorial/java/javaOO/methodreferences.html> |
| JEP 126: Lambda Expressions | <https://openjdk.org/jeps/126> |
