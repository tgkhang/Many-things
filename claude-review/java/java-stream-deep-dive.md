# 🌊 Java Stream API — Complete Deep Dive
>
> Stream Pipeline, Intermediate & Terminal Operations, Collectors, Parallel Streams

---

## 📚 Table of Contents

- [🌊 Java Stream API — Complete Deep Dive](#-java-stream-api--complete-deep-dive)
  - [📚 Table of Contents](#-table-of-contents)
- [1. Stream Fundamentals](#1-stream-fundamentals)
  - [1.1 Stream là gì?](#11-stream-là-gì)
  - [1.2 Stream Pipeline Diagram](#12-stream-pipeline-diagram)
- [2. Creating Streams](#2-creating-streams)
- [3. Intermediate Operations](#3-intermediate-operations)
  - [3.1 Filtering \& Transforming](#31-filtering--transforming)
  - [3.2 Stateless vs Stateful Operations](#32-stateless-vs-stateful-operations)
- [4. Terminal Operations](#4-terminal-operations)
  - [4.1 Finding \& Matching](#41-finding--matching)
- [5. Collectors — Toàn Bộ](#5-collectors--toàn-bộ)
  - [5.1 Collection Collectors](#51-collection-collectors)
  - [5.2 Aggregation Collectors](#52-aggregation-collectors)
  - [5.3 Custom Collector](#53-custom-collector)
- [6. Optional — Stream's Partner](#6-optional--streams-partner)
- [7. Primitive Streams](#7-primitive-streams)
- [8. FlatMap — Rất Quan Trọng](#8-flatmap--rất-quan-trọng)
  - [8.1 FlatMap vs Map](#81-flatmap-vs-map)
- [9. Parallel Streams](#9-parallel-streams)
  - [9.1 How Parallel Streams Work](#91-how-parallel-streams-work)
- [10. Stream Internals \& Performance](#10-stream-internals--performance)
  - [10.1 How Stream Pipeline Is Executed](#101-how-stream-pipeline-is-executed)
- [11. Real-World Patterns](#11-real-world-patterns)
  - [11.1 Common Business Patterns](#111-common-business-patterns)
- [12. Common Mistakes \& Gotchas](#12-common-mistakes--gotchas)
  - [12.1 Stream Gotchas](#121-stream-gotchas)
  - [📎 Stream Quick Reference](#-stream-quick-reference)
  - [📎 Official Documentation Links](#-official-documentation-links)

---

# 1. Stream Fundamentals

## 1.1 Stream là gì?

```
STREAM = sequence of elements + pipeline of operations

KHÔNG PHẢI Collection:
  Collection: stores data  (mutable, reusable, can iterate multiple times)
  Stream:     processes data (lazy, single-use, doesn't store)

STREAM ≠ LOOP:
  Loop:   HOW to iterate (imperative)
  Stream: WHAT to compute (declarative)

  Imperative:
    List<String> result = new ArrayList<>();
    for (Order order : orders) {
        if (order.getStatus() == CONFIRMED) {
            result.add(order.getId().toString());
        }
    }

  Declarative (Stream):
    List<String> result = orders.stream()
        .filter(o -> o.getStatus() == CONFIRMED)
        .map(o -> o.getId().toString())
        .collect(Collectors.toList());

3 PARTS of Stream Pipeline:
  SOURCE     → INTERMEDIATE OPERATIONS → TERMINAL OPERATION
  collection   filter, map, sorted, ...   collect, count, forEach, ...
  array        (lazy, chained)            (triggers execution!)
  I/O

KEY PROPERTIES:
  Lazy:         Intermediate ops not run until terminal op called
  Single-use:   Stream consumed after terminal op → can't reuse!
  Non-mutating: Stream ops don't change the source collection
  Optional parallelism: .parallel() or .parallelStream()

LAZINESS DEMO:
  Stream.of(1, 2, 3, 4, 5)
      .filter(n -> { System.out.println("filter: " + n); return n > 2; })
      .map(n -> { System.out.println("map: " + n); return n * 10; })
      .findFirst();
  
  Output:
    filter: 1   (evaluates 1, false)
    filter: 2   (evaluates 2, false)
    filter: 3   (evaluates 3, true → enters map)
    map: 3      (maps 3 → 30)
    (STOPS! findFirst found result, no more evaluation!)
  
  Never evaluates 4 or 5! Laziness = efficiency.
```

## 1.2 Stream Pipeline Diagram

```
SOURCE         INTERMEDIATE                     TERMINAL
   │           (lazy, return Stream)            (eager, triggers all)
   │                                                │
   ▼                                                ▼
[1,2,3,4,5] → filter(>2) → map(×10) → sorted() → collect()
                 [3,4,5]    [30,40,50]  [30,40,50]  [30,40,50]

BUT ACTUALLY (lazy evaluation):
  Elements processed ONE AT A TIME through the pipeline:
  
  element 1: filter(1>2)=false → STOP, next element
  element 2: filter(2>2)=false → STOP, next element
  element 3: filter(3>2)=true → map(3×10)=30 → sorted buffer
  element 4: filter(4>2)=true → map(4×10)=40 → sorted buffer
  element 5: filter(5>2)=true → map(5×10)=50 → sorted buffer
  sorted: [30, 40, 50]
  collect: [30, 40, 50]
  
  (sorted() is "stateful" — must see all elements before outputting)
```

---

# 2. Creating Streams

```java
import java.util.stream.*;

// ── FROM COLLECTIONS ──
List<String> list = List.of("a", "b", "c");
Stream<String> s1 = list.stream();              // sequential
Stream<String> s2 = list.parallelStream();      // parallel

Set<Integer> set = Set.of(1, 2, 3);
Stream<Integer> s3 = set.stream();

Map<String, Integer> map = Map.of("a", 1, "b", 2);
Stream<Map.Entry<String, Integer>> s4 = map.entrySet().stream();
Stream<String> keys    = map.keySet().stream();
Stream<Integer> values = map.values().stream();

// ── FROM ARRAYS ──
String[] arr = {"x", "y", "z"};
Stream<String> s5 = Arrays.stream(arr);
Stream<String> s6 = Arrays.stream(arr, 1, 3);  // subarray [y, z]
Stream<String> s7 = Stream.of("a", "b", "c");  // varargs

// ── EMPTY STREAM ──
Stream<String> empty = Stream.empty();

// ── INFINITE STREAMS ──
// iterate: generates sequence
Stream<Integer> naturals = Stream.iterate(0, n -> n + 1);   // 0, 1, 2, 3, ...
Stream<Integer> evens    = Stream.iterate(0, n -> n + 2);   // 0, 2, 4, 6, ...
Stream<Long>    powers   = Stream.iterate(1L, n -> n * 2);  // 1, 2, 4, 8, 16, ...

// iterate with predicate (Java 9):
Stream<Integer> under100 = Stream.iterate(0, n -> n < 100, n -> n + 1);
// 0, 1, 2, ..., 99 (stops when predicate false)

// generate: generates by Supplier
Stream<Double> randoms = Stream.generate(Math::random);     // endless random doubles
Stream<UUID>   ids     = Stream.generate(UUID::randomUUID); // endless UUIDs
Stream<String> zeros   = Stream.generate(() -> "0");        // endless "0"

// ALWAYS limit infinite streams!
Stream.iterate(1, n -> n + 1)
    .limit(10)   // ← without this: infinite loop!
    .forEach(System.out::println);

// ── FROM BUILDER ──
Stream.Builder<String> builder = Stream.builder();
builder.add("first");
builder.add("second");
if (condition) builder.add("third");
Stream<String> built = builder.build();

// ── FROM RANGE ──
IntStream range = IntStream.range(0, 10);         // [0, 10): 0,1,...,9
IntStream rangeClosed = IntStream.rangeClosed(1, 10); // [1, 10]: 1,2,...,10
LongStream lRange = LongStream.range(0L, 1_000_000L);

// ── FROM STRING ──
IntStream chars = "hello".chars();  // IntStream of char values
Stream<String> lines = "line1\nline2\nline3".lines();  // Java 11

// ── FROM FILES ──
Stream<String> fileLines = Files.lines(Path.of("data.txt"));  // lazy, line by line
Stream<Path>   files     = Files.list(Path.of("/tmp"));       // directory entries
Stream<Path>   allFiles  = Files.walk(Path.of("/project"));   // recursive

// IMPORTANT: close file streams!
try (Stream<String> lines2 = Files.lines(Path.of("data.txt"))) {
    lines2.forEach(System.out::println);
}  // auto-closed!

// ── CONCAT STREAMS ──
Stream<String> a = Stream.of("A", "B");
Stream<String> b = Stream.of("C", "D");
Stream<String> combined = Stream.concat(a, b);  // A, B, C, D
// Can only concat two streams! For more: reduce with concat

// ── FLATMAP FROM MULTIPLE COLLECTIONS ──
List<List<Integer>> nested = List.of(List.of(1,2), List.of(3,4), List.of(5));
Stream<Integer> flat = nested.stream().flatMap(Collection::stream); // 1,2,3,4,5
```

---

# 3. Intermediate Operations

## 3.1 Filtering & Transforming

```java
List<Order> orders = orderRepository.findAll();

// ── FILTER (predicate) ──
orders.stream()
    .filter(o -> o.getStatus() == OrderStatus.CONFIRMED)
    .filter(o -> o.getTotal().compareTo(BigDecimal.valueOf(1000)) > 0)
    // Multiple filters: AND logic (chained)
    .collect(toList());

// ── MAP (transform each element) ──
orders.stream()
    .map(Order::getId)              // Order → Long (method reference)
    .map(Object::toString)          // Long → String
    .collect(toList());

orders.stream()
    .map(o -> new OrderDTO(         // Order → OrderDTO
        o.getId(),
        o.getStatus(),
        o.getTotal()))
    .collect(toList());

// ── DISTINCT (remove duplicates) ──
// Uses equals() + hashCode()!
List<String> statuses = orders.stream()
    .map(Order::getStatus)
    .map(OrderStatus::name)
    .distinct()                     // unique statuses only
    .collect(toList());

// ── SORTED ──
orders.stream()
    .sorted()                                          // natural order (Comparable)
    .sorted(Comparator.comparing(Order::getTotal))     // by total ascending
    .sorted(Comparator.comparing(Order::getTotal).reversed())  // descending
    .sorted(Comparator.comparing(Order::getStatus)
        .thenComparing(Order::getCreatedAt))           // multi-level
    .sorted(Comparator.comparingLong(Order::getId))    // primitive comparator (faster!)
    .collect(toList());

// ── PEEK (debug/side effects, keep stream) ──
orders.stream()
    .filter(o -> o.getStatus() == PENDING)
    .peek(o -> log.debug("Processing order: {}", o.getId()))  // side effect
    .map(this::process)
    .peek(o -> log.debug("Processed: {}", o.getId()))
    .collect(toList());
// Use for debugging — avoid side effects in production code!

// ── LIMIT & SKIP ──
orders.stream()
    .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
    .limit(10)          // first 10 (newest)
    .collect(toList());

orders.stream()
    .sorted(Comparator.comparing(Order::getCreatedAt))
    .skip(20)           // skip first 20 (pagination)
    .limit(10)          // take next 10
    .collect(toList());

// Pagination: page 3, size 10:
int page = 3, size = 10;
orders.stream()
    .skip((long) page * size)
    .limit(size)
    .collect(toList());

// ── TAKEWHILE & DROPWHILE (Java 9) ──
// takeWhile: take elements while predicate is true, stop at first false
Stream.of(1, 2, 3, 4, 5, 1, 2)
    .takeWhile(n -> n < 4)
    .collect(toList());   // [1, 2, 3] — stops at 4, doesn't check 5,1,2

// dropWhile: drop elements while predicate true, keep rest
Stream.of(1, 2, 3, 4, 5, 1, 2)
    .dropWhile(n -> n < 4)
    .collect(toList());   // [4, 5, 1, 2] — starts from first false
// Note: only useful for ordered/sorted streams!
```

## 3.2 Stateless vs Stateful Operations

```java
// STATELESS (process each element independently — fast, parallel-friendly):
//   filter, map, peek, mapToInt/Long/Double, flatMap

// STATEFUL (need to see multiple/all elements — slower, parallel issues):
//   sorted:   must see ALL elements before outputting first
//   distinct: must remember all seen elements
//   limit:    easy to short-circuit but affects ordering
//   skip:     must count elements seen

// PERFORMANCE IMPACT:
// Stateless ops in pipeline = efficient (lazy, one-pass)
// Stateful ops = potential bottleneck

// Avoid sorting when not necessary:
orders.stream()
    .sorted()     // ← sorts entire stream (O(n log n)) just to...
    .findFirst()  // ...get first element! Wasteful!

// Better:
orders.stream()
    .min(Comparator.comparing(Order::getCreatedAt));  // O(n), single pass!
```

---

# 4. Terminal Operations

## 4.1 Finding & Matching

```java
List<Order> orders = getOrders();

// ── FIND ──
Optional<Order> first  = orders.stream().filter(o -> o.getTotal().compareTo(valueOf(100)) > 0).findFirst();
Optional<Order> any    = orders.stream().filter(o -> o.getStatus() == PENDING).findAny();
// findAny: no guarantee of which element (better for parallel!)
// findFirst: always returns first in encounter order

// ── MATCH (short-circuit!) ──
boolean anyPending   = orders.stream().anyMatch(o -> o.getStatus() == PENDING);
boolean allConfirmed = orders.stream().allMatch(o -> o.getStatus() == CONFIRMED);
boolean noneExpired  = orders.stream().noneMatch(o -> o.isExpired());
// These stop as soon as result known! Very efficient.

// anyMatch([])  = false (vacuously false)
// allMatch([])  = true  (vacuously true — empty: all elements satisfy condition)
// noneMatch([]) = true  (vacuously true)

// ── COUNT ──
long pendingCount = orders.stream()
    .filter(o -> o.getStatus() == PENDING)
    .count();
// Note: count() still iterates all elements! Not O(1).

// ── MIN & MAX ──
Optional<Order> cheapest   = orders.stream().min(Comparator.comparing(Order::getTotal));
Optional<Order> mostRecent = orders.stream().max(Comparator.comparing(Order::getCreatedAt));

// ── FOREACH ──
orders.stream()
    .filter(o -> o.getStatus() == CONFIRMED)
    .forEach(o -> emailService.sendConfirmation(o));
// Side effects OK in terminal forEach
// But: order not guaranteed in parallel streams! Use forEachOrdered() if needed.

orders.parallelStream()
    .forEach(o -> processOrder(o));        // order not guaranteed
orders.parallelStream()
    .forEachOrdered(o -> processOrder(o)); // ordered, but loses parallel benefit

// ── REDUCE ──
// Identity + BinaryOperator:
int sum = Stream.of(1, 2, 3, 4, 5).reduce(0, Integer::sum);  // 15
int product = Stream.of(1, 2, 3, 4).reduce(1, (a, b) -> a * b);  // 24

// Without identity (returns Optional):
Optional<Integer> max = Stream.of(1, 2, 3).reduce(Integer::max);

// For complex reductions:
BigDecimal totalRevenue = orders.stream()
    .filter(o -> o.getStatus() == DELIVERED)
    .map(Order::getTotal)
    .reduce(BigDecimal.ZERO, BigDecimal::add);

// ── TOINTARRAY, TOARRAY ──
Order[] orderArray = orders.stream()
    .filter(o -> o.getStatus() == PENDING)
    .toArray(Order[]::new);   // pass array constructor reference!

Object[] generic = orders.stream().toArray();  // Object[] (less useful)

// ── JOINING (special for strings) ──
String csv = orders.stream()
    .map(Order::getId)
    .map(String::valueOf)
    .collect(Collectors.joining(", "));  // "1, 2, 3, 4"

String withBrackets = orders.stream()
    .map(o -> o.getId().toString())
    .collect(Collectors.joining(", ", "[", "]"));  // "[1, 2, 3, 4]"
```

---

# 5. Collectors — Toàn Bộ

## 5.1 Collection Collectors

```java
import static java.util.stream.Collectors.*;

List<Order> orders = getOrders();

// ── COLLECT TO COLLECTIONS ──
List<Order>     list       = orders.stream().filter(...).collect(toList());
Set<String>     set        = orders.stream().map(Order::getCustomerId).collect(toSet());
LinkedList<Order> linkedList = orders.stream().collect(toCollection(LinkedList::new));
TreeSet<String> sortedSet   = orders.stream().map(Order::getStatus).map(Enum::name).collect(toCollection(TreeSet::new));

// Java 16+: toUnmodifiableList(), toUnmodifiableSet(), toUnmodifiableMap()
List<Order>  unmodifiable = orders.stream().collect(toUnmodifiableList());

// ── COLLECT TO MAP ──
// keyMapper, valueMapper:
Map<Long, Order> byId = orders.stream()
    .collect(toMap(Order::getId, Function.identity()));
// Function.identity() = o -> o

Map<String, BigDecimal> totalByCustomer = orders.stream()
    .collect(toMap(
        Order::getCustomerId,
        Order::getTotal,
        BigDecimal::add     // ← mergeFunction: what to do on duplicate key!
        // WITHOUT mergeFunction: duplicate key → IllegalStateException!
    ));

// LinkedHashMap (preserve insertion order):
Map<Long, String> linkedMap = orders.stream()
    .collect(toMap(
        Order::getId,
        Order::getStatus,
        (e1, e2) -> e1,           // keep first on duplicate
        LinkedHashMap::new         // map factory
    ));

// ── GROUPING BY ──
Map<OrderStatus, List<Order>> byStatus =
    orders.stream().collect(groupingBy(Order::getStatus));
// {PENDING: [...], CONFIRMED: [...], SHIPPED: [...]}

// Grouping + downstream collector:
Map<OrderStatus, Long> countByStatus =
    orders.stream().collect(groupingBy(Order::getStatus, counting()));

Map<OrderStatus, BigDecimal> totalByStatus =
    orders.stream().collect(groupingBy(
        Order::getStatus,
        summingDouble(o -> o.getTotal().doubleValue())  // downstream
    ));

Map<OrderStatus, Optional<Order>> maxByStatus =
    orders.stream().collect(groupingBy(
        Order::getStatus,
        maxBy(Comparator.comparing(Order::getTotal))
    ));

// Multi-level grouping:
Map<String, Map<OrderStatus, List<Order>>> byCustomerThenStatus =
    orders.stream().collect(
        groupingBy(Order::getCustomerId,
            groupingBy(Order::getStatus)));

// ── PARTITIONING BY ──
// Like groupingBy but key is always boolean:
Map<Boolean, List<Order>> pendingAndNot =
    orders.stream().collect(partitioningBy(o -> o.getStatus() == PENDING));
List<Order> pending    = pendingAndNot.get(true);
List<Order> nonPending = pendingAndNot.get(false);

// With downstream:
Map<Boolean, Long> pendingCount =
    orders.stream().collect(partitioningBy(o -> o.getTotal().compareTo(valueOf(1000)) > 0, counting()));
```

## 5.2 Aggregation Collectors

```java
// ── COUNTING ──
long count = orders.stream().collect(counting());
// Same as: orders.stream().count()

// ── SUMMARIZING ──
IntSummaryStatistics stats = orders.stream()
    .collect(summarizingInt(o -> o.getItems().size()));
System.out.println("count: "   + stats.getCount());
System.out.println("sum: "     + stats.getSum());
System.out.println("min: "     + stats.getMin());
System.out.println("max: "     + stats.getMax());
System.out.println("average: " + stats.getAverage());

DoubleSummaryStatistics totalStats = orders.stream()
    .collect(summarizingDouble(o -> o.getTotal().doubleValue()));

// ── SUMMING ──
long totalItems = orders.stream().collect(summingLong(o -> o.getItems().size()));
double totalRevenue = orders.stream().collect(summingDouble(o -> o.getTotal().doubleValue()));

// ── AVERAGING ──
OptionalDouble avgTotal = orders.stream().collect(averagingDouble(o -> o.getTotal().doubleValue()));

// ── JOINING ──
String ids = orders.stream()
    .map(o -> o.getId().toString())
    .collect(joining(", ", "[", "]"));

// ── MAPPING (transform then collect) ──
Set<String> customerIds = orders.stream()
    .collect(mapping(Order::getCustomerId, toSet()));
// Same as: .map(Order::getCustomerId).collect(toSet())
// Useful inside groupingBy:
Map<OrderStatus, Set<String>> customersByStatus =
    orders.stream().collect(
        groupingBy(Order::getStatus,
            mapping(Order::getCustomerId, toSet())));

// ── TEEING (Java 12) — two collectors, combine results ──
record MinMax(Order min, Order max) {}

MinMax minMax = orders.stream().collect(
    teeing(
        minBy(Comparator.comparing(Order::getTotal)),
        maxBy(Comparator.comparing(Order::getTotal)),
        (min, max) -> new MinMax(min.orElseThrow(), max.orElseThrow())
    ));
```

## 5.3 Custom Collector

```java
// COLLECTOR<T, A, R>:
//   T = type of stream elements
//   A = accumulator type (mutable container)
//   R = result type

// ── COLLECTOR.OF ──
Collector<Order, ?, Map<String, BigDecimal>> revenueByCustomer = Collector.of(
    HashMap::new,                                          // supplier: create container
    (map, order) -> map.merge(                             // accumulator: add element
        order.getCustomerId(),
        order.getTotal(),
        BigDecimal::add),
    (map1, map2) -> {                                      // combiner: for parallel
        map2.forEach((k, v) -> map1.merge(k, v, BigDecimal::add));
        return map1;
    },
    Collector.Characteristics.UNORDERED                   // characteristics
);

Map<String, BigDecimal> result = orders.stream().collect(revenueByCustomer);

// ── TOIMMUTABLELIST CUSTOM COLLECTOR ──
public static <T> Collector<T, ?, List<T>> toImmutableList() {
    return Collector.of(
        ArrayList::new,
        List::add,
        (left, right) -> { left.addAll(right); return left; },
        Collections::unmodifiableList,              // finisher: post-process
        Collector.Characteristics.IDENTITY_FINISH   // no finisher needed if identity
    );
}

// ── COLLECTOR CHARACTERISTICS ──
// CONCURRENT: accumulator can be called concurrently (thread-safe container)
// UNORDERED:  result doesn't depend on encounter order
// IDENTITY_FINISH: finisher is identity function (result = accumulator as-is)
```

---

# 6. Optional — Stream's Partner

```java
// Optional: container for a value that may or may not be present
// Forces you to handle the "absent" case!

// ── CREATING ──
Optional<String> present = Optional.of("value");        // throws NPE if null!
Optional<String> nullable = Optional.ofNullable(null);  // empty if null
Optional<String> empty    = Optional.empty();

// ── CHECKING ──
boolean has = optional.isPresent();   // true if value present
boolean none = optional.isEmpty();    // Java 11+, true if empty

// ── GETTING VALUE ──
String val1 = optional.get();                           // throws NoSuchElementException if empty!
String val2 = optional.orElse("default");               // default if empty
String val3 = optional.orElseGet(() -> computeDefault()); // lazy default (Supplier)
String val4 = optional.orElseThrow();                   // Java 10+, throws NoSuchElementException
String val5 = optional.orElseThrow(() -> new UserNotFoundException(id));

// ── TRANSFORMING ──
Optional<Integer> length = optional.map(String::length);   // transform if present
Optional<String>  upper  = optional.map(String::toUpperCase);
Optional<String>  flat   = optional.flatMap(s -> Optional.of(s.trim()));  // avoid Optional<Optional<T>>

// ── FILTERING ──
Optional<String> longStr = optional.filter(s -> s.length() > 5);  // empty if predicate false

// ── SIDE EFFECTS ──
optional.ifPresent(s -> System.out.println("Value: " + s));
optional.ifPresentOrElse(                              // Java 9+
    s -> System.out.println("Present: " + s),
    () -> System.out.println("Empty"));

// ── STREAM INTEGRATION ──
// Optional → Stream (Java 9):
Optional<String> opt = Optional.of("hello");
Stream<String> stream = opt.stream();    // stream of 0 or 1 element

// Common pattern: flatMap optional to stream:
List<Optional<User>> optUsers = List.of(Optional.of(user1), Optional.empty(), Optional.of(user2));
List<User> users = optUsers.stream()
    .flatMap(Optional::stream)   // empty optionals become empty streams → removed!
    .collect(toList());

// ── OR (Java 9): provide alternative Optional ──
Optional<User> user = findFromCache(id)
    .or(() -> findFromDatabase(id))    // if cache miss, try database
    .or(() -> findFromBackup(id));     // if db miss, try backup

// ── ANTI-PATTERNS ──
// BAD: use Optional like null check
if (optional.isPresent()) {
    String s = optional.get();  // same as null check! Defeats purpose.
    process(s);
}
// GOOD: use map/ifPresent
optional.ifPresent(this::process);
optional.map(this::process);

// BAD: Optional as field / method parameter
class User { Optional<String> middleName; }  // use nullable field instead!
void process(Optional<String> name) {}        // caller confusion!
// GOOD: Optional only as RETURN TYPE of methods that may not return a value!
Optional<User> findByEmail(String email);
```

---

# 7. Primitive Streams

```java
// PROBLEM: Stream<Integer> boxes/unboxes every element → GC pressure
// SOLUTION: IntStream, LongStream, DoubleStream — work with primitives directly!

// ── INT STREAM ──
IntStream.range(1, 6)           // 1, 2, 3, 4, 5
    .filter(n -> n % 2 == 0)
    .map(n -> n * n)
    .forEach(System.out::println);  // 4, 16

IntStream.rangeClosed(1, 100)   // 1 to 100 inclusive
    .sum();                     // 5050

// ── CONVERSION ──
// Object Stream → Primitive Stream:
Stream<String> words = Stream.of("hello", "world", "java");
IntStream lengths = words.mapToInt(String::length);   // IntStream
int totalLength   = lengths.sum();

LongStream ids = orders.stream().mapToLong(Order::getId);
long idSum     = ids.sum();

DoubleStream totals = orders.stream().mapToDouble(o -> o.getTotal().doubleValue());
double average     = totals.average().orElse(0.0);

// Primitive Stream → Object Stream:
IntStream ints = IntStream.of(1, 2, 3);
Stream<Integer> boxed   = ints.boxed();          // IntStream → Stream<Integer>
Stream<String>  mapped  = ints.mapToObj(Integer::toString); // IntStream → Stream<String>

// ── PRIMITIVE STREAM SPECIFIC METHODS ──
IntSummaryStatistics stats = IntStream.of(1, 2, 3, 4, 5).summaryStatistics();
// count: 5, sum: 15, min: 1, max: 5, average: 3.0

int[] arr = IntStream.range(0, 5).toArray();  // int[] (not Integer[]!)

OptionalInt   maybeInt    = IntStream.of(1, 2, 3).max();
OptionalLong  maybeLong   = LongStream.of(1L, 2L).min();
OptionalDouble maybeDouble = DoubleStream.of(1.0, 2.0).average();

// ── WHEN TO USE PRIMITIVE STREAMS ──
// Large number of numeric elements → use IntStream/LongStream/DoubleStream
// Performance matters (avoids boxing overhead)
// Math operations: sum, average, min, max, statistics

// Example: sum of ints (performance comparison)
// BAD:  Stream<Integer>  → Integer boxing/unboxing overhead
int sum1 = orders.stream()
    .map(o -> o.getItems().size())  // Stream<Integer> — boxes!
    .reduce(0, Integer::sum);       // unboxes for sum, re-boxes result!

// GOOD: IntStream → no boxing
int sum2 = orders.stream()
    .mapToInt(o -> o.getItems().size())  // IntStream — primitives!
    .sum();                              // native int sum!
```

---

# 8. FlatMap — Rất Quan Trọng

## 8.1 FlatMap vs Map

```java
// MAP: one element → one element (1:1 transformation)
//   Stream<A> → map(A→B) → Stream<B>

// FLATMAP: one element → multiple elements (1:N transformation)
//   Stream<A> → flatMap(A→Stream<B>) → Stream<B>  (flattens one level!)

// ── PROBLEM WITHOUT FLATMAP ──
List<Order> orders = getOrders();

// Want: all OrderItems from all Orders

// map gives nested structure:
Stream<List<OrderItem>> nested = orders.stream()
    .map(Order::getItems);  // Stream<List<OrderItem>>
// Can't easily work with this!

// ── FLATMAP TO THE RESCUE ──
Stream<OrderItem> allItems = orders.stream()
    .flatMap(o -> o.getItems().stream());  // Order → Stream<OrderItem> → FLATTENED
// All items from all orders in one flat stream!

// Then continue pipeline:
BigDecimal totalRevenue = orders.stream()
    .flatMap(o -> o.getItems().stream())
    .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
    .reduce(BigDecimal.ZERO, BigDecimal::add);

// ── FLATMAP WITH COLLECTIONS ──
// Users with their roles:
List<String> allRoles = users.stream()
    .flatMap(u -> u.getRoles().stream())  // each User → stream of roles
    .distinct()
    .sorted()
    .collect(toList());

// Lines from multiple files:
List<Path> files = List.of(path1, path2, path3);
Stream<String> allLines = files.stream()
    .flatMap(path -> {
        try {
            return Files.lines(path);
        } catch (IOException e) {
            return Stream.empty();  // skip files that can't be read
        }
    });

// ── FLATMAP WITH OPTIONAL ──
// List of Optionals → list of present values
List<Optional<User>> optionals = List.of(Optional.of(user1), Optional.empty(), Optional.of(user2));
List<User> present = optionals.stream()
    .flatMap(Optional::stream)  // Optional.stream() = 0 or 1 element stream
    .collect(toList());

// ── FLATMAP WITH ARRAYS ──
String[][] matrix = {{"a","b","c"}, {"d","e","f"}, {"g","h","i"}};
Stream<String> flatMatrix = Arrays.stream(matrix)
    .flatMap(Arrays::stream);  // String[] → Stream<String>

// ── FLATMAPTOINT, FLATMAPTOLONG, FLATMAPTODOUBLE ──
int[] allQuantities = orders.stream()
    .flatMapToInt(o -> o.getItems().stream().mapToInt(OrderItem::getQuantity))
    .toArray();

long totalQuantity = orders.stream()
    .flatMapToLong(o -> o.getItems().stream().mapToLong(OrderItem::getQuantity))
    .sum();
```

---

# 9. Parallel Streams

## 9.1 How Parallel Streams Work

```java
// PARALLEL STREAM: splits data, processes in parallel, combines results
// Uses ForkJoinPool.commonPool() by default
// JVM picks thread count based on: Runtime.getRuntime().availableProcessors()

// ── CREATING PARALLEL STREAM ──
list.parallelStream()                    // from collection
stream.parallel()                        // convert sequential to parallel
stream.sequential()                      // convert parallel back to sequential

// ── SIMPLE PARALLEL EXAMPLE ──
// Sequential (one thread):
orders.stream()
    .filter(o -> o.isExpensive())
    .forEach(o -> processOrder(o));

// Parallel (multiple threads):
orders.parallelStream()
    .filter(o -> o.isExpensive())
    .forEach(o -> processOrder(o));  // order of processing NOT guaranteed!

// ── WHEN PARALLEL HELPS ──
// CPU-intensive operations:
long count = IntStream.range(0, 1_000_000)
    .parallel()
    .filter(n -> isPrime(n))  // expensive isPrime check
    .count();

// Large data + cheap operations:
double average = largeList.parallelStream()
    .mapToDouble(Double::doubleValue)
    .average()
    .orElse(0.0);

// ── WHEN PARALLEL HURTS ──
// Small data (overhead > benefit):
List.of(1, 2, 3, 4).parallelStream()  // too small, threading overhead
    .map(n -> n * 2)
    .collect(toList());

// I/O bound (threads block, not CPU-intensive):
urls.parallelStream()
    .map(url -> fetchFromDatabase(url))  // DB calls — threads blocked!
    .collect(toList());
// Use async/CompletableFuture for I/O instead!

// Stateful operations:
list.parallelStream()
    .filter(...)
    .sorted()    // stateful — must collect all elements, then sort — parallel benefit lost!
    .collect(toList());

// ── THREAD SAFETY IN PARALLEL STREAMS ──
// DON'T mutate shared state:
List<String> results = new ArrayList<>();          // NOT thread-safe!
orders.parallelStream()
    .map(Order::getId)
    .forEach(id -> results.add(id.toString()));    // RACE CONDITION!

// CORRECT: use collectors (thread-safe aggregation):
List<String> results2 = orders.parallelStream()
    .map(o -> o.getId().toString())
    .collect(toList());   // Collectors.toList() is thread-safe in parallel!

// CORRECT: thread-safe collections:
List<String> results3 = Collections.synchronizedList(new ArrayList<>());
orders.parallelStream()
    .map(o -> o.getId().toString())
    .forEach(results3::add);  // synchronized, but slower than collect

// ── CUSTOM THREAD POOL ──
// Don't want to use commonPool (shared with other tasks):
ForkJoinPool customPool = new ForkJoinPool(4);  // 4 threads
try {
    List<Order> processed = customPool.submit(() ->
        orders.parallelStream()
            .filter(o -> o.getStatus() == PENDING)
            .map(this::process)
            .collect(toList())
    ).get();
} finally {
    customPool.shutdown();
}

// ── ORDERED vs UNORDERED ──
// Parallel streams maintain encounter order for ordered sources (List)
// For performance, mark as unordered if order doesn't matter:
orders.parallelStream()
    .filter(o -> o.isExpensive())
    .unordered()           // ← hint: order doesn't matter
    .limit(10)             // limit in unordered = faster parallel
    .collect(toList());
```

---

# 10. Stream Internals & Performance

## 10.1 How Stream Pipeline Is Executed

```java
// ── LAZY EVALUATION DETAILS ──
// Each element travels through entire pipeline before next element

// Stream pipeline internally creates linked "Sink" objects:
// FilterSink → MapSink → CollectSink

// Element processing:
//   filterSink.accept(elem):
//     if predicate(elem): mapSink.accept(elem)
//   mapSink.accept(elem):
//     collectSink.accept(mapper(elem))
//   collectSink.accept(result):
//     add to output list

// This is WHY:
// 1. Memory efficient: one element in memory at a time (not entire stream)
// 2. Short-circuit works: findFirst stops after first match
// 3. No intermediate collections created (unless sorted/distinct)

// ── SPLITERATOR (splitting + iterating) ──
// Streams use Spliterators internally
// Characteristics affect how operations behave:
//   ORDERED:    elements have defined order (List, arrays)
//   DISTINCT:   elements are unique (Set)
//   SORTED:     elements are sorted (TreeSet, sorted arrays)
//   SIZED:      size known upfront
//   SUBSIZED:   subSpliterators have known sizes (for parallel splits)
//   NONNULL:    no null elements
//   IMMUTABLE:  source can't be modified
//   CONCURRENT: source can be concurrently modified safely

// ── PERFORMANCE TIPS ──

// 1. Filter EARLY (reduce elements as soon as possible):
orders.stream()
    .map(this::enrichOrder)    // expensive enrichment
    .filter(o -> o.isValid())  // filter AFTER expensive op — BAD!
    .collect(toList());

orders.stream()
    .filter(o -> o.isValid())  // filter FIRST, reduce elements
    .map(this::enrichOrder)    // now enriches fewer elements
    .collect(toList());

// 2. Use primitive streams for numbers:
// Integer boxing overhead is significant for large collections
long sumBoxed   = list.stream().mapToLong(Integer::longValue).sum();   // better
long sumUnboxed = list.stream().map(Integer::longValue)...;             // worse

// 3. Short-circuit operations when possible:
// anyMatch/findFirst/limit stop as soon as result is known
boolean found = largeList.stream().anyMatch(expensive::test);
// Stops at first match, not processing all elements!

// 4. Avoid sorted() on large streams if not needed:
// sorted() O(n log n), must buffer all elements

// 5. Avoid distinct() on large streams if possible:
// distinct() maintains a HashSet of all seen elements

// ── STREAM vs FOR-LOOP PERFORMANCE ──
// For-loop: slightly faster for simple operations (JIT optimizes loops well)
// Stream: negligible overhead for complex pipelines
// Parallel stream: faster for CPU-intensive work on large data
// Recommendation: use streams for readability, profile before optimizing
```

---

# 11. Real-World Patterns

## 11.1 Common Business Patterns

```java
// ── GROUPING AND AGGREGATING ──
// Monthly revenue report:
Map<YearMonth, BigDecimal> monthlyRevenue = orders.stream()
    .filter(o -> o.getStatus() == DELIVERED)
    .collect(groupingBy(
        o -> YearMonth.from(o.getCreatedAt()),
        TreeMap::new,    // sorted by YearMonth
        mapping(
            Order::getTotal,
            reducing(BigDecimal.ZERO, BigDecimal::add)
        )
    ));

// Top N customers by revenue:
List<String> topCustomers = orders.stream()
    .collect(groupingBy(
        Order::getCustomerId,
        summingDouble(o -> o.getTotal().doubleValue())
    ))
    .entrySet().stream()
    .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
    .limit(10)
    .map(Map.Entry::getKey)
    .collect(toList());

// ── BATCH PROCESSING ──
// Process in batches of N:
List<Order> orders = getOrders();
int batchSize = 100;

IntStream.range(0, (orders.size() + batchSize - 1) / batchSize)
    .mapToObj(i -> orders.subList(
        i * batchSize,
        Math.min((i + 1) * batchSize, orders.size())))
    .forEach(batch -> processBatch(batch));

// ── BUILDING MAPS FROM LISTS ──
Map<Long, User> usersById = users.stream()
    .collect(toMap(User::getId, Function.identity()));

Map<String, String> emailToName = users.stream()
    .collect(toMap(User::getEmail, User::getName));

// Index a list for fast lookup:
Map<String, Product> productBySku = products.stream()
    .collect(toMap(Product::getSku, Function.identity()));

// ── FLATTENING NESTED DATA ──
// All tags used in any article:
Set<String> allTags = articles.stream()
    .flatMap(a -> a.getTags().stream())
    .collect(toSet());

// All unique product IDs across all orders:
Set<Long> orderedProductIds = orders.stream()
    .flatMap(o -> o.getItems().stream())
    .map(OrderItem::getProductId)
    .collect(toSet());

// ── CONDITIONAL BUILDING ──
// Build list with conditional elements:
Stream.Builder<String> menuItems = Stream.builder();
menuItems.add("Home");
menuItems.add("Products");
if (user.isAdmin()) menuItems.add("Admin");
if (user.hasOrders()) menuItems.add("Orders");
List<String> menu = menuItems.build().collect(toList());

// ── MULTI-FIELD GROUPING ──
// Group by multiple fields using record as key:
record Key(String region, String category) {}

Map<Key, Long> ordersByRegionCategory = orders.stream()
    .collect(groupingBy(
        o -> new Key(o.getCustomer().getRegion(), o.getCategory()),
        counting()
    ));

// ── COMPARING AND FINDING DIFFERENCES ──
// Items in list1 but not in list2:
Set<Long> existingIds = existingOrders.stream()
    .map(Order::getId)
    .collect(toSet());

List<Order> newOrders = allOrders.stream()
    .filter(o -> !existingIds.contains(o.getId()))  // NOT in existing
    .collect(toList());

// ── TRANSFORMING MAPS ──
// Update all values in map:
Map<String, BigDecimal> discounted = priceMap.entrySet().stream()
    .collect(toMap(
        Map.Entry::getKey,
        e -> e.getValue().multiply(BigDecimal.valueOf(0.9))  // 10% discount
    ));

// Filter map entries:
Map<String, Integer> highValueItems = inventory.entrySet().stream()
    .filter(e -> e.getValue() > 100)
    .collect(toMap(Map.Entry::getKey, Map.Entry::getValue));

// ── CHAINING OPTIONALS ──
Optional<String> result = findUser(userId)
    .map(User::getAddress)
    .map(Address::getCity)
    .filter(city -> city.startsWith("Ho Chi Minh"));
```

---

# 12. Common Mistakes & Gotchas

## 12.1 Stream Gotchas

```java
// ❌ MISTAKE 1: REUSING STREAM (IllegalStateException!)
Stream<String> stream = list.stream();
stream.forEach(System.out::println);
stream.count();  // IllegalStateException: stream has already been operated upon!

// ✅ CORRECT: create new stream each time
list.stream().forEach(System.out::println);
list.stream().count();

// ❌ MISTAKE 2: STREAM NOT CONSUMED (no terminal operation!)
orders.stream()
    .filter(o -> o.getStatus() == PENDING)
    .map(o -> {
        processOrder(o);  // NEVER CALLED! No terminal operation!
        return o;
    });
// The stream is created but nothing triggers it!

// ✅ CORRECT: add terminal operation
orders.stream()
    .filter(o -> o.getStatus() == PENDING)
    .forEach(o -> processOrder(o));

// ❌ MISTAKE 3: MODIFYING SOURCE DURING STREAM
List<Order> orders = new ArrayList<>(allOrders);
orders.stream()
    .filter(o -> o.isExpired())
    .forEach(o -> orders.remove(o));  // ConcurrentModificationException!

// ✅ CORRECT: collect then modify
List<Order> expired = orders.stream()
    .filter(Order::isExpired)
    .collect(toList());
orders.removeAll(expired);
// Or: orders.removeIf(Order::isExpired);  ← simplest!

// ❌ MISTAKE 4: NULL IN STREAM (NullPointerException!)
List<String> names = List.of("Alice", null, "Bob");
names.stream()
    .filter(s -> s.startsWith("A"))  // NullPointerException on null!
    .collect(toList());

// ✅ CORRECT: filter nulls first or use filter Objects::nonNull
names.stream()
    .filter(Objects::nonNull)
    .filter(s -> s.startsWith("A"))
    .collect(toList());

// ❌ MISTAKE 5: COLLECT THEN STREAM (unnecessary intermediate collection)
orders.stream()
    .filter(o -> o.getStatus() == PENDING)
    .collect(toList())   // creates intermediate List (unnecessary!)
    .stream()
    .map(Order::getId)
    .collect(toList());

// ✅ CORRECT: continuous pipeline
orders.stream()
    .filter(o -> o.getStatus() == PENDING)
    .map(Order::getId)
    .collect(toList());

// ❌ MISTAKE 6: SORTED THEN FIND FIRST (wasteful!)
orders.stream()
    .sorted(Comparator.comparing(Order::getTotal))
    .findFirst()   // sorts ENTIRE stream to find minimum!
    .orElseThrow();

// ✅ CORRECT: use min()
orders.stream()
    .min(Comparator.comparing(Order::getTotal))
    .orElseThrow();

// ❌ MISTAKE 7: TOMAP WITH DUPLICATE KEYS
Map<String, Order> byCustomer = orders.stream()
    .collect(toMap(Order::getCustomerId, Function.identity()));
// IllegalStateException if customer has multiple orders!

// ✅ CORRECT: provide merge function
Map<String, Order> latestByCustomer = orders.stream()
    .collect(toMap(
        Order::getCustomerId,
        Function.identity(),
        (o1, o2) -> o1.getCreatedAt().isAfter(o2.getCreatedAt()) ? o1 : o2  // keep latest
    ));

// ❌ MISTAKE 8: FLATMAP RETURNS NULL (NullPointerException!)
List<Order> result = orders.stream()
    .flatMap(o -> o.getRelatedOrders() == null ? null : o.getRelatedOrders().stream())
    // flatMap requires non-null Stream! null throws NPE
    .collect(toList());

// ✅ CORRECT: use Stream.empty() for null case
List<Order> result2 = orders.stream()
    .flatMap(o -> o.getRelatedOrders() == null
        ? Stream.empty()
        : o.getRelatedOrders().stream())
    .collect(toList());

// ❌ MISTAKE 9: PARALLEL + STATEFUL LAMBDA
List<String> result3 = new ArrayList<>();
orders.parallelStream()
    .filter(o -> o.isValid())
    .forEach(o -> result3.add(o.getId().toString()));  // NOT thread-safe!

// ✅ CORRECT: use collect()
List<String> result4 = orders.parallelStream()
    .filter(o -> o.isValid())
    .map(o -> o.getId().toString())
    .collect(toList());  // thread-safe aggregation

// ❌ MISTAKE 10: OPTIONAL.GET() WITHOUT CHECK
Optional<Order> opt = orders.stream().filter(...).findFirst();
Order order = opt.get();  // NoSuchElementException if empty!

// ✅ CORRECT: safe access
Order order2 = opt.orElseThrow(() -> new OrderNotFoundException("no matching order"));
Order order3 = opt.orElse(Order.empty());
opt.ifPresent(o -> process(o));
```

---

## 📎 Stream Quick Reference

```
CREATING:
  collection.stream()            list, set, map.entrySet()
  Arrays.stream(arr)             array to stream
  Stream.of(a, b, c)             varargs
  Stream.iterate(seed, f)        infinite: 0,1,2,3...
  Stream.generate(supplier)      infinite: random, UUIDs
  IntStream.range(0, 10)         [0,10) without boxing
  Files.lines(path)              lazy file reading

INTERMEDIATE (lazy, return Stream):
  filter(predicate)              keep matching
  map(function)                  transform each
  flatMap(a → stream)            1:N, flatten
  distinct()                     remove duplicates (uses equals/hashCode)
  sorted(comparator)             sort (stateful!)
  peek(consumer)                 debug side-effects
  limit(n)                       first n elements
  skip(n)                        skip first n
  takeWhile(predicate)           Java 9, take until false
  dropWhile(predicate)           Java 9, drop until false

TERMINAL (eager, triggers execution):
  collect(collector)             to collection or custom result
  forEach(consumer)              side effect per element
  count()                        number of elements
  findFirst() / findAny()        Optional<T>
  anyMatch / allMatch / noneMatch  boolean, short-circuit!
  min / max (comparator)         Optional<T>
  reduce(identity, BinaryOp)     fold to single value
  toArray()                      T[]

COLLECTORS:
  toList() / toSet()             standard collections
  toMap(key, value, merge?)      map (always provide merge fn!)
  groupingBy(classifier)         Map<K, List<T>>
  groupingBy(classifier, downstream)  with aggregation
  partitioningBy(predicate)      Map<Boolean, List<T>>
  joining(sep, prefix, suffix)   string concatenation
  counting()                     Long
  summarizingInt/Long/Double     statistics object
  mapping(fn, downstream)        transform then collect
  teeing(c1, c2, merger)         Java 12, two collectors

PRIMITIVE STREAMS:
  mapToInt/Long/Double           Object → primitive stream
  boxed()                        primitive → Object stream
  sum() / average() / min() / max() / summaryStatistics()

PARALLEL:
  .parallel() or .parallelStream()
  Good: CPU-intensive, large data, stateless ops
  Bad: I/O bound, small data, stateful ops
  Always use collect() not mutable forEach in parallel!
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Stream (Java 17) | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/stream/Stream.html> |
| Collectors | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/stream/Collectors.html> |
| IntStream | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/stream/IntStream.html> |
| Optional | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/Optional.html> |
| Package java.util.stream | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/stream/package-summary.html> |
