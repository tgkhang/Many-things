# ☕ Java Backend Interview — 200 Câu Hỏi & Trả Lời
>
> Fresher → Junior | Giải thích lý do, không chỉ định nghĩa

---

## 📚 Mục Lục

- [A. Java Core & OOP](#a-java-core--oop) — 35 câu
- [B. Collections & Data Structures](#b-collections--data-structures) — 25 câu
- [C. Spring Framework & Spring Boot](#c-spring-framework--spring-boot) — 30 câu
- [D. JPA, Hibernate & Transactional](#d-jpa-hibernate--transactional) — 35 câu
- [E. SQL & Database](#e-sql--database) — 25 câu
- [F. REST API & HTTP](#f-rest-api--http) — 20 câu
- [G. Concurrency](#g-concurrency) — 15 câu
- [H. Testing & Design Patterns](#h-testing--design-patterns) — 15 câu

> 🟢 Fresher   🟡 Junior   🔴 Junior+

---

# A. Java Core & OOP

**A1** 🟢 **4 tính chất OOP là gì? Cho ví dụ thực tế.**
>
> - **Encapsulation**: ẩn data trong class, expose qua methods. VD: `private double balance` trong `BankAccount` — không ai sửa trực tiếp, phải qua `deposit()`/`withdraw()` để validate.
> - **Inheritance**: class con nhận fields/methods của class cha. VD: `SavingsAccount extends BankAccount`.
> - **Polymorphism**: cùng method but xử li khác nhau tùy object. Compile-time (overloading), Runtime (overriding).
> - **Abstraction**: ẩn implementation, expose "what to do". VD: `List` interface — gọi `add()` không cần biết ArrayList hay LinkedList.

**A2** 🟢 **Interface vs Abstract Class — khi nào dùng cái nào?**
>
> | | Interface | Abstract Class |
> |---|---|---|
> | Mục đích | Contract | Share implementation |
> | Multiple | Có | Không |
> | Constructor | Không | Có |
> | Fields | `public static final` | Mọi loại |
>
> **Interface**: nhiều classes không liên quan cùng behavior. VD: `Serializable` — Dog và Car đều implement được.
> **Abstract Class**: "is-a" relationship + share code. VD: `Animal` với `eat()` concrete, `makeSound()` abstract.

**A3** 🟢 **`==` vs `equals()` — thực sự khác nhau thế nào?**
> `==` so sánh **địa chỉ bộ nhớ**. `equals()` so sánh **nội dung**.
>
> ```java
> String a = new String("hello");
> String b = new String("hello");
> a == b        // FALSE — khác vùng nhớ
> a.equals(b)   // TRUE  — cùng nội dung
>
> String c = "hello"; String d = "hello";
> c == d  // TRUE — String pool! cùng literal → cùng reference
> ```
>
> Với JPA entity: không dùng `==` vì load cùng entity 2 lần có thể tạo 2 objects. Override `equals()`.

**A4** 🟢 **`String` immutable — tại sao? Hậu quả?**
> `String` trong java được thiết kế là immutable (ko thể thay đổi sau khi tạo)
>
> khi tạo 1 String ('hello') nó lưu vào String Pool 1 vùng nhớ đặc biệt trong Heap
>
> nếu 1 literal khác giống hết ('hello') được tạo nó sẽ tái sử dụng tham chiếu cũ trong pool để tiết kiệm bộ nhớ
>
> vì cùng trỏ như vậy nên phải để ko thay đổi để tránh các biến ảnh hưởng lẫn nhau
>
> Hậu quả: `s + " world"` tạo object MỚI. Concat trong loop → N objects tạm → GC pressure.
>
> Fix: `StringBuilder` (mutable, NOT thread-safe, fast) hoặc `StringBuffer` (thread-safe, slower).

**A5** 🟢 **`final` vs `finally` vs `finalize()`?**
>
> - `final variable`: assign 1 lần. `final method`: không override. `final class`: không extend (VD: String).
> - `finally block`: luôn chạy dù có exception (resource cleanup).
> - `finalize()`: GC gọi trước khi thu hồi. **Deprecated Java 9** — không đoán trước khi nào chạy. Dùng try-with-resources thay.

**A6** 🟢 **Checked vs Unchecked Exception — nguyên tắc?**
>
> - **Checked** (`extends Exception`): compiler bắt buộc. Ý nghĩa: caller CÓ THỂ recover. VD: `IOException`, `SQLException`.
> - **Unchecked** (`extends RuntimeException`): không bắt buộc. Ý nghĩa: lỗi lập trình, không recover được. VD: `NullPointerException`.
>
> **Modern practice**: dùng unchecked để tránh boilerplate. Spring `@Transactional` chỉ rollback unchecked by default!

**A7** 🟡 **`static` keyword — use cases và cạm bẫy?**
>
> - Static variable: 1 variable cho cả class. Cạm bẫy: `static List` → memory leak.
> - Static method: không cần object, không có `this`, không override được (chỉ hide).
> - Static block: chạy 1 lần khi class load.
> - Cạm bẫy thread safety: static mutable state cần synchronization.

**A8** 🟡 **Overloading vs Overriding — compiler hay JVM quyết định?**
>
> | | Overloading | Overriding |
> |---|---|---|
> | Xảy ra ở | Cùng class | Class con |
> | Parameters | Khác signature | Giống hệt |
> | Quyết định ở | **Compile time** | **Runtime** |
>
> Tại sao overriding là runtime: compiler chỉ biết reference type (Animal), không biết object thực là Dog hay Cat. JVM check vtable tại runtime.

**A9** 🟡 **Java pass-by-value hay pass-by-reference? Giải thích rõ.**
> **Luôn là pass-by-value.** Với objects, value đó là **reference** (địa chỉ).
>
> ```java
> void modify(StringBuilder sb) {
>     sb.append(" world");         // modify object tại địa chỉ → có effect!
>     sb = new StringBuilder();   // reassign local copy → KHÔNG có effect
> }
> StringBuilder s = new StringBuilder("hello");
> modify(s);
> System.out.println(s);  // "hello world"
> ```

**A10** 🟡 **Immutable class — 5 điều kiện?**
> Tại sao cần: thread-safe tự nhiên, safe sharing, dùng làm HashMap key an toàn (hashCode ổn định).
> 5 điều kiện:
>
> (1) `final class`
> (2) tất cả fields `private final`,
> (3) no setter,
> (4) deep copy trong constructor cho mutable fields,
> (5) deep copy trong getter khi return mutable.

**A11** 🟡 **`hashCode()` contract — vi phạm gây ra gì?**

- hashcode is a method of Object class, helps data need hash (hashmap, hashset)
- hàm hashcode phải nhất quán giữa các lần gọi, nếu equals() thì hashcode phải bằng nhau
- Contract: `a.equals(b)` → `a.hashCode() == b.hashCode()
- HashMap: dùng hashCode để tìm bucket, dùng equals để tìm key trong bucket. Nếu equals true nhưng hashCode khác → tìm sai bucket → không tìm thấy nhau → duplicate keys!
- Không override `hashCode()` khi đã override `equals()` → HashMap/HashSet broken.

**A12** 🟡 **`Optional` — khi nào dùng, khi nào không?**

- dùng khi kiểu trả về return thype của method có thể ko có giá trị thay thế cho null tránh NullPointerException
- Dùng cho: return type khi có thể không có result (repository `findById()`).
- Ko dùng cho field của class, parameter của method, hoặc kẹp `Optinal<List<String>> gettList() => vô nghĩa`

**A13** 🟡 **Lambda — Tại sao trong Java, lambda chỉ được phép dùng biến cục bộ mà biến đó không được thay đổi giá trị sau khi lambda được tạo??**

```java
String message = "Xin chào";
Runnable r = () -> System.out.println(message);
```

- java chỉ cho nhìn thấy biến cục bộ nếu biến đó không bao giờ thay đổi sau khối lamda (sau khi lamda được tạo, ko được gán lại biến đó)

**A14** 🟡 **Stream lazy evaluation — ý nghĩa thực tế?**
> Intermediate operations (filter, map) không chạy ngay. Chỉ chạy khi terminal operation.
>
> ```java
> list.stream()
>     .filter(n -> n.length() > 3)  // không chạy ngay
>     .map(String::toUpperCase)      // không chạy ngay
>     .findFirst();                  // TRIGGER! short-circuit — stops at first match
> // Không process tất cả elements nếu findFirst() tìm được sớm
> ```

**A15** 🟡 **`map()` vs `flatMap()`?** ❌

- `map()`: 1 input → 1 output. `flatMap()`: 1 input → 0..N outputs (flatten nested streams).

 ```java
 List<List<String>> nested = List.of(List.of("a","b"), List.of("c","d"));
 nested.stream().map(l -> l).collect(toList());      // [["a","b"],["c","d"]] — still nested
 nested.stream().flatMap(Collection::stream).collect(toList());  // ["a","b","c","d"] — flat

 // Practical: find all order items from all orders
 orders.stream().flatMap(o -> o.getItems().stream()).collect(toList());
```

**A16** 🟡 **Heap vs Stack?**

- Stack: local variables, method frames. LIFO. Fast. Auto-cleanup khi method return. `StackOverflowError` khi tràn.
- Heap: tất cả objects (`new`). GC quản lý. Shared giữa threads.
- GC chỉ ảnh hưởng Heap. `OutOfMemoryError` = Heap full.

**A17** 🟡 **`try-with-resources` — suppressed exception là gì?** ❌
> Auto-close `AutoCloseable` khi ra khỏi block.
> **Suppressed exceptions**: nếu cả body lẫn `close()` đều throw → body exception được throw, close() exception bị **suppress** (access qua `e.getSuppressed()`). Khác `finally` cũ — finally exception replace body exception!

**A18** 🟡 **`Comparable` vs `Comparator`?**

- Cả 2 đều dùng so sánh object
- `Comparable`: tự thân so sánh, class implement cho chính nó — chỉ có 1 cách so sánh duy nhất gọi là natural ordering. override `compareTo()`.
- `Comparator`:so sánh từ bên ngoài, nhiều cách so sánh. Không cần modify class.

```java
 products.sort(Comparator.comparing(Product::getName).thenComparing(Product::getPrice).reversed());
```

**A19** 🟡 **`var` (Java 10) — khi nào tránh?**

- Compiler suy ra type từ right-hand side. Dùng khi type rõ ràng từ RHS.
- Tránh khi: type không rõ (`var x = getResult()`), method parameter/return type.

**A20** 🔴 **`volatile` — đảm bảo gì và KHÔNG đảm bảo gì?**

- volatile là một từ khóa dùng cho biến, đảm bảo tính nhìn thấy (visibility) giữa các `thread`, nhưng không đảm bảo tính nguyên tử (atomicity).
- Đảm bảo: visibility (thread đọc từ main memory, không từ CPU cache), ordering (no reordering).
- KHÔNG đảm bảo: atomicity. `i++` = read+increment+write = 3 steps, không atomic dù volatile.
- Dùng cho: boolean flags, simple reference swap. Không thay thế `synchronized` cho compound operations.

**A21** 🔴 **`synchronized` — intrinsic lock hoạt động thế nào?**

- Mỗi object có monitor lock. `synchronized` acquire lock — chỉ 1 thread giữ cùng lúc. Others block.
- `synchronized method` = lock trên `this`. `synchronized static` = lock trên `.class` object.

**A22** 🔴 **Deadlock — 4 điều kiện Coffman?**

1. Mutual exclusion (tài nguyên ko thể chia sẻ, 1 thời điểm chỉ 1 thread dc dùng)
2. Hold and wait (đang giữ tài nguyên và đang đợi tài nguyên khác)
3. No preemption (tài nguyên ko thể lấy đi từ thread đang giữ, chỉ có nó tự giải phóng đc)
4. Circular wait. (tồn tài vòng tròn chờ)

> Tất cả 4 phải đúng mới có deadlock.
> Fix: **lock ordering** (luôn acquire theo cùng thứ tự) hoặc `tryLock` với timeout.

**A23** 🟡 **`record` (Java 16)?**

- là 1 loại class đặc biệt, sinh ra để chứa dữ liệu, ko có logic
- tự động tạo: constructor, getters (không phải `getX()` mà `x()`!), `equals`, `hashCode`, `toString`.
- record là immutable (ko thể thay đổi sau khi tạo)
- Không dùng cho JPA entity (cần no-arg constructor + mutable).

**A24** 🔴 **`sealed class` (Java 17)?**

- chỉ rõ class nào được kế thừa, các class khác ko dc kế thừa
- Giới hạn subclasses. Compiler biết tất cả subtypes → exhaustive switch, no default needed.

```java
sealed interface Shape permits Circle, Rectangle {
    // Chỉ có Circle và Rectangle được phép implement
}

record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}

// ❌ LỖI - Triangle không được phép
record Triangle(double base, double height) implements Shape {}
```

**A25** 🟡 **4 loại Method Reference?**
>
> 1. Static: `Integer::parseInt`
> 2. Instance (specific object): `prefix::concat`
> 3. Instance (arbitrary): `String::toUpperCase` → `s -> s.toUpperCase()`
> 4. Constructor: `ArrayList::new`
j
**A26** 🟡 **Exception chaining — tại sao quan trọng?**
>
> ```java
> throw new ServiceException("Failed", e);  // GOOD: giữ root cause
> throw new ServiceException("Failed");     // BAD: mất original exception + stack trace
> ```
>
> `caused by` chain cho thấy exact root cause khi debug production.

**A27** 🟡 **`enum` — capabilities ít biết?**
> Enum có thể có fields, constructors, methods, implement interfaces.
>
> ```java
> enum Status { ACTIVE("Hoạt động"), INACTIVE("Tạm ngưng");
>     private final String display;
>     Status(String d) { this.display = d; }
>     public String getDisplay() { return display; }
> }
> ```

**A28** 🟡 **`@FunctionalInterface` — `default` methods vi phạm không?**
> Không. Quy tắc: chỉ 1 **abstract** method. `default` và `static` không tính.

**A29** 🔴 **`CompletableFuture` vs `Thread` trực tiếp?**
> Thread trực tiếp: low-level, không compose được.
> `CompletableFuture`: high-level, non-blocking, composable, dùng thread pool.
>
> ```java
> // Parallel execution:
> CompletableFuture<User> user  = supplyAsync(() -> fetchUser(id));
> CompletableFuture<Order> order = supplyAsync(() -> fetchOrder(id));
> user.thenCombine(order, DashboardDto::new).get();
> ```

**A30** 🟡 **Text blocks (Java 15)?**
>
> ```java
> String sql = """
>     SELECT * FROM users
>     WHERE status = 'ACTIVE'
>     ORDER BY created_at DESC
>     """;  // indentation stripped based on closing """ position
> ```

**A31** 🟡 **`instanceof` pattern matching (Java 16)?**
>
> ```java
> if (obj instanceof String s) {  // bind + cast in one step
>     System.out.println(s.length());
> }
> ```

**A32** 🔴 **GC — Stop-the-World và khi nào ảnh hưởng performance?**
> GC tạm dừng TẤT CẢ threads → latency spike. Khi ảnh hưởng: memory leak → Old Gen đầy → Full GC → pause hàng giây. Tuning: đủ heap size, G1GC/ZGC cho low-latency.

**A33** 🔴 **`WeakReference` vs `SoftReference`?**
> `WeakReference`: GC thu hồi ngay khi không còn strong ref. Dùng cho: canonical maps.
> `SoftReference`: GC thu hồi khi memory pressure cao. Dùng cho: image cache.

**A34** 🔴 **`@SafeVarargs`?**
> Suppress "unchecked" warning cho varargs với generic type khi bạn chắc chắn không gây heap pollution.

**A35** 🔴 **Multi-catch (Java 7)?**
>
> ```java
> catch (IOException | SQLException e) {  // xử lý nhiều exceptions cùng logic
>     throw new ServiceException("Failed", e);
> }
> ```
>
---

# B. Collections & Data Structures

**B1** 🟢 **Hierarchy của Collections — Map có phải Collection không?**
>
> ```
> Iterable → Collection → List (ArrayList, LinkedList)
>                      → Set  (HashSet, LinkedHashSet, TreeSet)
>                      → Queue (ArrayDeque, PriorityQueue)
> Map (NOT Collection!): HashMap, TreeMap, LinkedHashMap
> ```
>
> Map không extends Collection vì Map là key-value pairs, không phải collection of elements.

**B2** 🟢 **ArrayList vs LinkedList — thực tế hiệu năng?**
>
> | Op | ArrayList | LinkedList | Tại sao |
> |---|---|---|---|
> | get(i) | O(1) | O(n) | array index vs traverse |
> | add(end) | O(1)* | O(1) | amortized vs update tail |
> | add(middle) | O(n) | O(n) | shift vs find+update ptr |
>
> **Thực tế**: ArrayList thường **nhanh hơn** LinkedList ngay cả add/remove nhờ CPU cache locality (array liền kề → cache hit). LinkedList nodes rải rác → cache miss mỗi bước.
> LinkedList tốt hơn chỉ khi dùng như Deque. Nhưng `ArrayDeque` vẫn tốt hơn!

**B3** 🟢 **HashMap — từ hashCode đến get()?**
>
> 1. `hash = key.hashCode() ^ (hash >>> 16)` — spread bits
> 2. `index = hash & (capacity - 1)` — capacity phải power of 2 để bit AND nhanh hơn %
> 3. Đặt Node vào bucket. Collision → linked list
> 4. Bucket size > 8 (TREEIFY_THRESHOLD) → Red-Black Tree → O(log n) worst case
> 5. `size > capacity * 0.75` → resize (double) → O(n) rehash

**B4** 🟢 **HashMap vs Hashtable vs ConcurrentHashMap?**
>
> - HashMap: không thread-safe, 1 null key, fast
> - Hashtable: synchronized toàn bộ, không null, **legacy** — tránh
> - ConcurrentHashMap: CAS + per-bin locking (Java 8), no null, high concurrency. `get()` không lock!

**B5** 🟢 **HashSet không duplicate — mechanism?**
> `HashSet = HashMap<E, PRESENT>`. `add(e)` = `map.put(e, PRESENT)`. 1 key/entry → no duplicate.
> Điều kiện: phải override cả `hashCode()` VÀ `equals()`. Thiếu `hashCode()` → duplicate entries!

**B6** 🟡 **LinkedHashMap — LRU Cache?**
> HashMap + doubly-linked list through entries. Maintain insertion order (hoặc access order).
>
> ```java
> new LinkedHashMap<>(16, 0.75f, true) {  // true = access order (LRU!)
>     protected boolean removeEldestEntry(Map.Entry eldest) {
>         return size() > MAX_CAPACITY;  // auto-evict LRU when full
>     }
> };
> ```

**B7** 🟡 **TreeMap/TreeSet — khi nào dùng?**
> Red-Black Tree → sorted order. `get/put/remove` O(log n). Range queries: `subMap(from, to)`, `headMap(to)`, `firstKey()`, `lastKey()`. Dùng khi cần sorted keys + range queries.

**B8** 🟡 **PriorityQueue — cơ chế heap?**
> Min-heap: `poll()` luôn trả phần tử nhỏ nhất. `peek()` O(1), `offer/poll` O(log n), `contains` O(n) (no sorted structure).
> Max-heap: `new PriorityQueue<>(Comparator.reverseOrder())`.

**B9** 🟡 **ArrayDeque vs LinkedList cho Queue/Stack?**
> ArrayDeque: circular array, tất cả operations O(1) amortized, cache-friendly, không allow null.
> Prefer `ArrayDeque` over `Stack` (legacy, synchronized) và `LinkedList` (cache miss).

**B10** 🟡 **`CopyOnWriteArrayList` — khi nào?**
> Mọi write tạo bản sao array mới. Reads không lock. Phù hợp: reads **rất nhiều**, writes **hiếm**. Iterator snapshot → không reflect modifications sau đó.

**B11** 🟡 **EnumSet/EnumMap — tại sao nhanh?**
> EnumSet: bit vector (1 long = 64 enum constants). add/contains = 1 bit operation = O(1).
> EnumMap: array indexed bởi ordinal. O(1) lookup, no hashing.

**B12** 🟡 **`computeIfAbsent()` vs `getOrDefault()`?**
> `getOrDefault()`: trả default, KHÔNG insert vào map.
> `computeIfAbsent()`: tính và INSERT nếu absent (atomic!). Pattern cho grouping:
>
> ```java
> map.computeIfAbsent("key", k -> new ArrayList<>()).add("value");
> ```

**B13** 🔴 **`Collections.unmodifiableList()` vs `List.of()`?**
> `unmodifiableList()`: wrapper — underlying list vẫn mutable qua original reference.
> `List.of()` (Java 9): truly immutable, null không được, O(1) random access.
> `List.copyOf()`: copy + immutable, isolation đảm bảo.

**B14** 🔴 **Fail-fast vs Fail-safe Iterator?**
> Fail-fast (ArrayList, HashMap): `ConcurrentModificationException` nếu modify trong khi iterate (dùng modCount). Best-effort, không đảm bảo.
> Fail-safe (CopyOnWriteArrayList, ConcurrentHashMap): iterate trên snapshot — no throw, không reflect modifications.

**B15** 🟡 **`Map.getOrDefault()` vs `Map.merge()`?**
>
> ```java
> // getOrDefault: read only
> int count = map.getOrDefault(key, 0);
>
> // merge: update in one step (atomic):
> map.merge(key, 1, Integer::sum);  // increment counter atomically
> // equivalent: map.put(key, map.getOrDefault(key, 0) + 1) but atomic!
> ```

**B16** 🟡 **`HashMap` NULL key — thực tế?**
> Đúng 1 null key → bucket 0 (special case). `ConcurrentHashMap` KHÔNG cho phép (không phân biệt được "absent" và "null value" trong concurrent context).

**B17** 🔴 **`contains()` complexity trong các collections?**
> ArrayList/LinkedList: O(n). HashSet: O(1) avg. TreeSet: O(log n). EnumSet: O(1). PriorityQueue: O(n) — heap không sorted, phải scan all.

**B18** 🔴 **`Stream.collect(Collectors.groupingBy())`?**
>
> ```java
> Map<String, List<User>> byDept = users.stream()
>     .collect(Collectors.groupingBy(User::getDepartment));
>
> Map<String, Long> countByDept = users.stream()
>     .collect(Collectors.groupingBy(User::getDept, Collectors.counting()));
>
> // toMap với duplicate key handling:
> Map<String, User> latest = users.stream()
>     .collect(Collectors.toMap(User::getEmail, u -> u, (a, b) -> b));
> ```

**B19** 🔴 **`parallelStream()` — khi nào thực sự nhanh hơn?**
> Nhanh hơn khi: data lớn (>10k), CPU-bound, no shared mutable state.
> Chậm hơn hoặc sai khi: small data, IO-bound (thêm thread không giúp), shared state → race condition.
> Dùng ForkJoinPool.commonPool() → long tasks block common pool cho cả app!

**B20** 🔴 **`IdentityHashMap`?**
> Dùng `==` (reference equality) thay `equals()`. Dùng cho: framework-level object tracking, serialization, detect cycles.

**B21** 🟡 **Tại sao `for (int i=0; i<list.size(); i++)` chậm với LinkedList?**
> `list.get(i)` trên LinkedList = O(n) mỗi lần (traverse từ head). Loop = O(n²)!
> Dùng Iterator (for-each) → O(1) per step → O(n) total.

**B22** 🔴 **`Collectors.teeing()` (Java 12)?**
> Collect vào 2 downstream collectors, merge results. Dùng khi cần 2 stats từ 1 stream pass.
>
> ```java
> record MinMax(int min, int max) {}
> MinMax result = numbers.stream().collect(
>     Collectors.teeing(Collectors.minBy(Integer::compare), Collectors.maxBy(Integer::compare),
>         (min, max) -> new MinMax(min.orElse(0), max.orElse(0))));
> ```

**B23** 🟡 **`WeakHashMap` — GC behavior?**
> Keys là `WeakReference`. Khi key không còn strong reference → GC thu hồi → entry tự xóa. Dùng cho: metadata cache, ClassLoader cache.

**B24** 🔴 **`Iterator` vs `ListIterator`?**
> Iterator: forward only, `hasNext()`, `next()`, `remove()`.
> ListIterator (chỉ List): bidirectional, `add()`, `set()`, `nextIndex()`.
> Safe modification trong iteration: dùng `iterator.remove()` thay `list.remove()`.

**B25** 🟡 **Tại sao `TreeSet` không allow null?**
> Insert → compare với existing elements (BST property). `null.compareTo(...)` → `NullPointerException`. HashSet allow null vì chỉ cần hashCode(null)=0.

---

# C. Spring Framework & Spring Boot

**C1** 🟢 **IoC Container và DI — tại sao cần?**
> Không có IoC: `new UserRepository(new DataSource(...))` trong service → tightly coupled, khó test.
> Với IoC: Spring tạo và inject dependencies. Test: inject mocks dễ. Swap: đổi bean config, không đổi code.

**C2** 🟢 **`@Component` vs `@Service` vs `@Repository` vs `@Controller`?**
> Tất cả là `@Component`. Khác nhau về semantic + AOP:
>
> - `@Repository`: auto-translate SQLException → `DataAccessException`
> - `@Service`: semantic marker, no extra behavior
> - `@Controller`/`@RestController`: DispatcherServlet handling

**C3** 🟢 **Bean Scopes?**
>
> - **Singleton** (default): 1 instance, shared. Thread-safety là trách nhiệm bạn.
> - **Prototype**: new instance mỗi lần request. Spring không quản lý lifecycle sau khi tạo.
> - **Request/Session/Application**: per HTTP request/session/application (web).
>
> Cạm bẫy: inject prototype vào singleton → singleton giữ 1 prototype mãi → behaves like singleton!

**C4** 🟢 **Spring MVC request lifecycle?**
> HTTP → DispatcherServlet → HandlerMapping (tìm method) → HandlerAdapter (gọi method) → Controller method → MessageConverter (JSON) → HTTP Response.

**C5** 🟡 **Constructor vs Field vs Setter Injection?**
> **Constructor** (recommended): fields có thể `final`, fail fast on missing dep, easy unit test, prevent circular dep.
> **Field** (`@Autowired private`): khó test (Reflection cần), phải non-final, tránh.
> **Setter**: khi dependency optional.

**C6** 🟡 **`@Configuration` CGLIB proxy — ý nghĩa?**
> `@Configuration` classes được CGLIB proxy. `@Bean` method gọi method khác trong cùng class → CGLIB intercepts → trả SAME bean từ container (singleton), không tạo mới.
> `@Component` không có proxy → gọi method → tạo instance mới mỗi lần!

**C7** 🟡 **Spring AOP — limitations quan trọng nhất?**
> Self-invocation: `this.method()` bypass proxy → `@Transactional`, `@Cacheable`, `@Async` đều bị ignore!
> Fix: separate class hoặc self-inject.

**C8** 🟡 **`@Value` vs `@ConfigurationProperties`?**
> `@Value`: inject từng property riêng lẻ.
> `@ConfigurationProperties(prefix = "payment")`: map toàn bộ prefix vào class. Type-safe, validatable, IDE autocomplete.

**C9** 🟡 **`@EventListener` và `@TransactionalEventListener`?**
>
> ```java
> @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
> void sendEmail(UserRegisteredEvent e) { emailService.send(e.user()); }
> // Chỉ chạy sau khi transaction commit thành công → tránh send email khi rollback!
> ```

**C10** 🟡 **`@Async` — cạm bẫy?**
> Cạm bẫy: self-invocation (`this.asyncMethod()`) → chạy synchronously (bypass proxy). Cần `@EnableAsync` + custom `Executor`.

**C11** 🔴 **Spring Boot Auto-configuration — mechanism?**
> Scan `META-INF/spring/...AutoConfiguration.imports`. Mỗi `@AutoConfiguration` có `@ConditionalOn*`: chỉ apply nếu conditions match. Override bằng define bean cùng type → `@ConditionalOnMissingBean` → skipped.

**C12** 🟡 **`@Cacheable`?**
>
> ```java
> @Cacheable(value = "products", key = "#id")
> Product getProduct(Long id) { ... }  // first call: run + cache; subsequent: return cached, skip method!
>
> @CacheEvict(value = "products", key = "#id")
> void deleteProduct(Long id) { ... }
> ```

**C13** 🟡 **`@RestControllerAdvice` — global exception handling?**
>
> ```java
> @RestControllerAdvice
> class GlobalExceptionHandler {
>     @ExceptionHandler(ResourceNotFoundException.class)
>     @ResponseStatus(HttpStatus.NOT_FOUND)
>     ErrorDto handleNotFound(ResourceNotFoundException e) {
>         return new ErrorDto("NOT_FOUND", e.getMessage());
>     }
> }
> ```

**C14** 🟡 **`@Valid` vs `@Validated`?**
> `@Valid` (javax): kích hoạt bean validation trên request body.
> `@Validated` (Spring): thêm group validation, cần cho method-level validation trên service class.

**C15** 🔴 **Filters vs Interceptors vs AOP?**
> Filter: Servlet level, trước Spring MVC. Auth, logging, CORS.
> Interceptor: biết HandlerMethod. Pre/post handler logic.
> AOP: any Spring bean. Transaction, audit. Không biết về HTTP.

**C16** 🟡 **Actuator — production endpoints quan trọng?**
> `/actuator/health`: UP/DOWN + components. `/actuator/metrics`: JVM, HTTP stats. `/actuator/loggers`: đổi log level runtime (no restart!). Luôn restrict với security.

**C17** 🟡 **`@Profile`?**
> Chỉ register bean khi active profile match. `--spring.profiles.active=dev` hoặc `SPRING_PROFILES_ACTIVE=prod`.

**C18** 🔴 **Graceful shutdown?**
> `server.shutdown=graceful` → nhận SIGTERM → từ chối request mới → chờ active requests (max timeout) → destroy beans.

**C19** 🟡 **`ResponseEntity` vs `@ResponseStatus`?**
> `@ResponseStatus`: static, on method. `ResponseEntity`: dynamic status + headers.
>
> ```java
> return ResponseEntity.created(URI.create("/api/users/" + id)).body(dto);
> // 201 Created + Location header + body
> ```

**C20** 🔴 **Spring Security — Authentication vs Authorization flow?**
> Authentication: "Bạn là ai?" — verify identity qua filter chain → UserDetailsService → SecurityContextHolder.
> Authorization: "Bạn được phép gì?" — `@PreAuthorize`, `hasRole()`, method security.

**C21** 🟡 **`@SpringBootTest` vs `@WebMvcTest` vs `@DataJpaTest`?**
> `@SpringBootTest`: full context (~30s). `@WebMvcTest`: chỉ web layer. `@DataJpaTest`: chỉ JPA layer (H2 by default). Prefer slices for speed.

**C22** 🟡 **`@Retryable`?**
>
> ```java
> @Retryable(value = RestClientException.class, maxAttempts = 3,
>            backoff = @Backoff(delay = 1000, multiplier = 2, random = true))
> PaymentResult charge(ChargeRequest req) { ... }
>
> @Recover
> PaymentResult handleFailure(RestClientException e, ChargeRequest req) { /* fallback */ }
> ```
>
> Cần `@EnableRetry` trên config.

**C23** 🔴 **Spring Boot CORS config (Security)?**
> Phải config qua `SecurityFilterChain`. `@CrossOrigin` trên controller KHÔNG hoạt động khi có Spring Security mà không có global CORS config.

**C24** 🟡 **`@Scheduled` — fixed delay vs fixed rate?**
> `fixedDelay`: 5s sau khi lần trước **XONG**. `fixedRate`: mỗi 5s bất kể lần trước xong chưa. `cron = "0 0 2 * * *"` = 2:00 AM mỗi ngày.

**C25** 🔴 **Spring WebFlux — khi nào nên dùng?**
> Dùng khi: high concurrency I/O-bound (nhiều concurrent connections, external API calls). Stick với MVC khi: CRUD, blocking dependencies (JDBC), team quen MVC. WebFlux không tự nhiên nhanh hơn cho CPU-bound.

**C26** 🟡 **`ApplicationContext` vs `BeanFactory`?**
> `BeanFactory`: basic DI, lazy init. `ApplicationContext` thêm: eager singleton init, events, i18n, Environment, AOP. Luôn dùng `ApplicationContext` trong Spring Boot.

**C27** 🟡 **`@MockBean` vs `@SpyBean`?**
> `@MockBean`: replace bean với mock. ALL methods return default unless stubbed.
> `@SpyBean`: wrap real bean. Real methods run by default.

**C28** 🟡 **`@SpringBootApplication` = gì?**
> `@Configuration + @EnableAutoConfiguration + @ComponentScan`

**C29** 🔴 **Custom Health Indicator?**
>
> ```java
> @Component
> class ExternalApiHealthIndicator implements HealthIndicator {
>     public Health health() {
>         try {
>             client.ping();
>             return Health.up().withDetail("url", client.getUrl()).build();
>         } catch (Exception e) {
>             return Health.down(e).build();
>         }
>     }
> }
> ```

**C30** 🟡 **Khi nào dùng `@Transactional` ở Service vs Repository?**
> Repository (Spring Data JPA): tự có `@Transactional` per operation.
> Service: cần `@Transactional` khi: gọi nhiều repo operations phải trong cùng transaction, cần rollback toàn bộ khi lỗi, propagation control.
---

# D. JPA, Hibernate & Transactional

**D1** 🟢 **JDBC vs JPA vs Hibernate vs Spring Data JPA — quan hệ?**

```
 Spring Data JPA  → bạn viết: interface extends JpaRepository
       ↓ uses
     JPA (spec)   → chỉ là API/annotations (EntityManager, @Entity...)
       ↓ implemented by
   Hibernate      → chạy code thực, quản lý SQL, session, cache
       ↓ uses
     JDBC         → Connection, PreparedStatement, ResultSet
       ↓
   Database
```

**D2** 🟢 **Persistence Context — 1st Level Cache?**
> PC = `Map<EntityKey, Entity>` gắn với 1 transaction.
> Load entity → vào PC. Load lại cùng entity (cùng tx) → trả từ PC, **không chạy SQL**.
>
> ```java
> @Transactional void test() {
>     User u1 = userRepo.findById(1L).orElseThrow();  // SQL
>     User u2 = userRepo.findById(1L).orElseThrow();  // NO SQL!
>     u1 == u2;  // TRUE — cùng object reference!
> }
> ```

**D3** 🟢 **Dirty Checking — tại sao không cần `save()` khi update managed entity?**
> Load entity → Hibernate tạo **snapshot**. Khi flush (commit/before query): compare entity với snapshot → generate UPDATE chỉ cho fields thay đổi.
> Điều kiện: entity phải là MANAGED (trong PC) và trong active transaction.

**D4** 🟢 **4 Entity States?**
>
> - **TRANSIENT**: `new User()` — Hibernate không biết, không tracked
> - **MANAGED**: trong PC, dirty checking active
> - **DETACHED**: từng MANAGED nhưng tx ended. Thay đổi không tự save. Lazy access → exception!
> - **REMOVED**: `delete()` gọi → DELETE pending khi flush

**D5** 🟢 **Lazy loading — default fetch types?**
> `@ManyToOne` → **EAGER** (nguy hiểm!). `@OneToOne` → **EAGER** (nguy hiểm!).
> `@OneToMany`, `@ManyToMany` → LAZY (OK).
> **Luôn override**: `@ManyToOne(fetch = FetchType.LAZY)`. Không override → vô tình load cả object graph!

**D6** 🟡 **`LazyInitializationException` — root cause và tất cả nguyên nhân?**
> **Root cause**: proxy cần session để initialize. Session đóng khi transaction kết thúc. Proxy không còn session → exception.
>
> Nguyên nhân: (1) không có `@Transactional` → JpaRepo tự có tx riêng → đóng ngay; (2) Jackson serialize entity ngoài tx; (3) `entityManager.detach()` thủ công; (4) async thread khác.
>
> Fixes:
>
> ```java
> // Fix 1: JOIN FETCH
> @Query("SELECT o FROM Order o JOIN FETCH o.user WHERE o.id = :id")
> Optional<Order> findByIdWithUser(@Param("id") Long id);
>
> // Fix 2: @EntityGraph
> @EntityGraph(attributePaths = {"user", "items"})
> Optional<Order> findById(Long id);
>
> // Fix 3: @Transactional + map to DTO inside (BEST PRACTICE)
> @Transactional(readOnly = true)
> public OrderDto getOrder(Long id) {
>     Order order = orderRepo.findById(id).orElseThrow();
>     return toDto(order);  // lazy loaded HERE while session open
> }
>
> // Fix 4: @BatchSize — batch lazy loading into IN-clause
> @BatchSize(size = 100)
> @OneToMany(mappedBy = "order")
> private List<OrderItem> items;
> ```

**D7** 🟡 **N+1 Problem — tại sao Hibernate không tự fix? Math?**
> Lazy hoạt động per-proxy-access. Hibernate không biết bạn sẽ access N proxies tiếp theo.
>
> ```
> 100 users, mỗi user có department:
> Query 1: SELECT * FROM users         → 100 user objects
> Query 2..101: SELECT * FROM departments WHERE id=?  → 100 queries!
> (dù chỉ có 5 distinct departments!)
> Total: 101 queries × 1ms = 101ms overhead
>
> Fix: JOIN FETCH → 1 query total
> Fix: @BatchSize → SELECT WHERE id IN (1..100) → 2 queries total!
> ```

**D8** 🟡 **`@Transactional` — proxy mechanism chi tiết?**
> Spring tạo CGLIB proxy. Khi gọi `@Transactional` method qua proxy:
>
> 1. `getConnection()` từ HikariCP
> 2. `setAutoCommit(false)`
> 3. Bind connection vào **ThreadLocal**
> 4. Gọi method thật. Tất cả repo cùng thread lấy connection từ ThreadLocal → **cùng transaction**!
> 5. Success → `commit()`. Error → `rollback()`. Return connection to pool.

**D9** 🟡 **`@Transactional` rollback — checked exception KHÔNG rollback?**
> Default rollback: chỉ `RuntimeException` và `Error`. **Checked Exception → NO ROLLBACK!**
>
> ```java
> @Transactional
> void save(User user) throws IOException {
>     userRepo.save(user);
>     fileService.write(user);  // throws IOException → NO ROLLBACK! user vẫn saved!
> }
> // Fix:
> @Transactional(rollbackFor = Exception.class)
> ```

**D10** 🟡 **REQUIRED vs REQUIRES_NEW propagation?**
> **REQUIRED** (default): join existing tx nếu có, tạo mới nếu không. B rollback → A cũng rollback!
> **REQUIRES_NEW**: luôn tạo tx mới, suspend outer. B commit độc lập → A rollback không ảnh hưởng B.
>
> ```java
> // Audit log phải ghi dù main tx rollback:
> @Transactional(propagation = Propagation.REQUIRES_NEW)
> public void logAudit(String action) { auditRepo.save(new AuditLog(action)); }
> ```

**D11** 🟡 **4 Isolation Levels — anomalies?**
>
> | Level | Dirty Read | Non-Repeatable | Phantom |
> |---|---|---|---|
> | READ_UNCOMMITTED | Possible | Possible | Possible |
> | READ_COMMITTED | ✅ | Possible | Possible |
> | REPEATABLE_READ | ✅ | ✅ | Possible |
> | SERIALIZABLE | ✅ | ✅ | ✅ |
>
> PostgreSQL default: `READ_COMMITTED`. Dùng `SERIALIZABLE` cho financial transactions.

**D12** 🟡 **`readOnly = true` — 3 lợi ích?**
>
> 1. Hibernate skip dirty checking → tiết kiệm CPU (không tạo snapshot, không compare)
> 2. DB tối ưu read-only tx (no row locking)
> 3. Route đến read replica qua `AbstractRoutingDataSource`
>
> Dùng cho TẤT CẢ read methods!

**D13** 🟡 **Owner side trong relationship — tại sao quan trọng?**
> Hibernate chỉ nhìn **owner side** (có `@JoinColumn`) để write FK xuống DB. `mappedBy` side bị **IGNORE**.
>
> ```java
> // Bug — silent!
> user.getOrders().add(order);  // chỉ set inverse side
> orderRepo.save(order);        // order.user = null → user_id = NULL trong DB!
>
> // Correct:
> order.setUser(user);          // owner side → Hibernate writes this to DB
> user.getOrders().add(order);  // sync inverse side — in-memory consistency
> ```

**D14** 🟡 **Cascade — ALL vs từng loại?**
> PERSIST: save parent → save children. MERGE: merge parent → merge children. REMOVE: delete parent → delete children.
> `CascadeType.ALL` cho owned collections (OrderItems owned by Order). **KHÔNG dùng REMOVE trên @ManyToMany!** (delete User → delete shared Roles → broken cho users khác!)

**D15** 🟡 **`@BatchSize` — mechanism?**
> Group uninitialized proxies trong PC → batch query:
>
> ```sql
> -- Không có BatchSize: 100 queries
> SELECT * FROM departments WHERE id = 5
> SELECT * FROM departments WHERE id = 8 ...
>
> -- @BatchSize(50): 1 query
> SELECT * FROM departments WHERE id IN (5, 8, 3, 7, 2, ...)
> ```
>
> Global config: `spring.jpa.properties.hibernate.default_batch_fetch_size=100`

**D16** 🟡 **DTO Projection vs Entity loading?**
> Entity: loads ALL columns + snapshot + proxy setup. Dùng khi cần modify.
> Projection: chỉ selected columns, no overhead. Dùng khi chỉ cần read.
> Rule: "Only load entities when you need to change them."

**D17** 🟡 **Optimistic vs Pessimistic Locking?**
> **Optimistic** (`@Version`): check version at UPDATE. 0 rows updated → `OptimisticLockException` → retry. Phù hợp: conflicts hiếm, high throughput.
>
> ```java
> // UPDATE products SET stock=?, version=6 WHERE id=1 AND version=5
> // 0 rows → OptimisticLockException!
> ```
>
> **Pessimistic** (`FOR UPDATE`): exclusive lock khi SELECT. Block others. Phù hợp: conflicts thường xuyên, financial.

**D18** 🟡 **JPQL vs Native Query?**
> JPQL: database-agnostic, validated at startup, type-safe (entity/field names).
> Native: full SQL power, DB-specific features (JSONB, window functions, CTEs, RECURSIVE).
> Dùng native khi JPQL không express được (complex analytics, DB-specific).

**D19** 🟡 **Flyway — tại sao không dùng `ddl-auto=update`?**
> Hibernate không bao giờ DROP column → ghost columns. Không rename → data mất. Không có audit trail. Concurrent deployment → conflict. Luôn: `ddl-auto=validate` + Flyway/Liquibase.

**D20** 🔴 **`MultipleBagFetchException` — tại sao và fix?**
> Bag = `List` trong `@OneToMany`. JOIN FETCH 2 Bags → cartesian product: User(5 orders × 3 roles) = 15 rows!
> Hibernate: "cannot simultaneously fetch multiple bags".
> Fix: đổi sang `Set<>`, hoặc 2 queries riêng, hoặc `@BatchSize` thay JOIN FETCH.

**D21** 🔴 **L1 vs L2 Cache?**
> L1: per-transaction, always active, cannot disable. Load 2 lần same tx → same object.
> L2: shared across transactions, optional (Ehcache, Redis). Read-heavy, rarely-changed data (product catalog, config).

**D22** 🔴 **`MultipleBagFetchException` khi có `LIMIT`?**
> JOIN FETCH + `LIMIT` → Hibernate warning: load ALL rows vào memory, THEN paginate. Memory bomb với large data!
> Fix: `@BatchSize` cho pagination, hoặc fetch IDs first then load với JOIN FETCH.

**D23** 🔴 **Thêm NOT NULL column an toàn vào bảng có data?**
>
> ```sql
> -- Bước 1: thêm nullable
> ALTER TABLE users ADD COLUMN phone VARCHAR(20);
> -- Bước 2: fill data
> UPDATE users SET phone = 'N/A' WHERE phone IS NULL;
> -- Bước 3: add constraint
> ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
> ```

**D24** 🔴 **`@DynamicUpdate` — khi nào dùng?**
> Mặc định Hibernate UPDATE tất cả columns (prepared statement caching). `@DynamicUpdate`: chỉ UPDATE columns thực sự thay đổi. Tốt khi entity nhiều columns, mỗi lần chỉ đổi vài cột. Trade-off: không cache prepared statement.

**D25** 🔴 **Detect N+1 trong development?**
>
> ```yaml
> spring.jpa.show-sql: true
> spring.jpa.properties.hibernate.generate_statistics: true
> logging.level.org.hibernate.stat: DEBUG
> ```
>
> Tools: p6spy (log SQL + timing), Hypersistence Optimizer (static analysis).

**D26** 🟡 **`@Where` vs `@SQLDelete` cho soft delete?**
>
> ```java
> @SQLDelete(sql = "UPDATE users SET deleted_at = NOW() WHERE id = ? AND version = ?")
> @Where(clause = "deleted_at IS NULL")  // auto-filter all queries
> public class User { @Version Long version; }
>
> userRepo.delete(user);   // → UPDATE (not DELETE!)
> userRepo.findAll();      // → WHERE deleted_at IS NULL (auto!)
> ```

**D27** 🔴 **JPA Lifecycle Callbacks — thứ tự?**
> `@PrePersist` → save → `@PostPersist` (id available!).
> `@PreUpdate` → update → `@PostUpdate`.
> `@PreRemove` → delete → `@PostRemove`.
> `@PostLoad`: sau khi load từ DB (compute derived fields, decrypt).

**D28** 🔴 **`IDENTITY` vs `SEQUENCE` generation — tại sao SEQUENCE tốt hơn?**
> `IDENTITY` (auto_increment): Hibernate không biết ID trước INSERT → không batch! Flush từng record.
> `SEQUENCE` + `allocationSize=50`: Hibernate gọi `nextval()` trước, lấy 50 IDs, batch INSERTs. Hiệu quả hơn nhiều với bulk operations.

**D29** 🟡 **`@Embeddable` — value objects?**
> Không có own table, own ID. Embedded vào entity table.
>
> ```java
> @Embeddable class Address { String street; String city; }
>
> @Entity class User {
>     @Embedded Address homeAddress;  // columns: street, city
>     @Embedded @AttributeOverrides({
>         @AttributeOverride(name = "street", column = @Column(name = "work_street"))
>     }) Address workAddress;  // work_street, work_city
> }
> ```

**D30** 🔴 **Entity `equals/hashCode` — tại sao `@Data` nguy hiểm?**
> `@Data` compare ALL fields. Gây:
>
> 1. Lazy collection triggered → `LazyInitializationException`
> 2. Circular reference (User ↔ Order) → StackOverflowError
> 3. hashCode thay đổi khi field thay đổi → mất khỏi HashSet!
> Dùng business key hoặc UUID cho equals/hashCode.

**D31** 🟡 **JPA Specification Pattern?**
>
> ```java
> Page<User> users = userRepo.findAll(
>     Specification.where(UserSpec.hasStatus(req.getStatus()))
>                  .and(UserSpec.nameContains(req.getName())),
>     pageable);
> // Repository extends JpaSpecificationExecutor<User>
> ```

**D32** 🔴 **Streaming large results?**
>
> ```java
> @Transactional(readOnly = true)
> void processAll() {
>     try (Stream<User> stream = userRepo.streamByStatus(ACTIVE)) {
>         stream.forEach(user -> { processUser(user); entityManager.detach(user); });
>     }  // Memory: O(batch_size), not O(total_rows)
> }
> ```

**D33** 🔴 **HikariCP — pool exhaustion nguyên nhân và fix?**
> Pool exhaustion: tất cả connections bị giữ → requests timeout.
> Nguyên nhân: transaction quá dài (gọi external API trong `@Transactional`!).
> Fix: tách external calls ra ngoài transaction, tăng pool size (công thức: cores*2 + spindles).

**D34** 🟡 **`orphanRemoval` vs `CascadeType.REMOVE`?**
> `CascadeType.REMOVE`: delete **parent** → delete children.
> `orphanRemoval`: remove **child khỏi collection** → delete từ DB.
>
> ```java
> order.getItems().remove(item);  // orphanRemoval=true → item bị DELETE!
> ```

**D35** 🔴 **`@Transactional` self-invocation bug — explain và fix?**
> `@Transactional` dùng proxy. `this.method()` bypass proxy → annotation ignored!
>
> ```java
> // Bug:
> public void processAll(List<Long> ids) {
>     ids.forEach(id -> processOne(id));  // this.processOne() — bypass proxy!
> }
> @Transactional(propagation = REQUIRES_NEW)
> public void processOne(Long id) { }  // @Transactional IGNORED!
>
> // Fix: separate class — processOne qua injected proxy
> ```
>
---

# E. SQL & Database

**E1** 🟢 **INNER JOIN vs LEFT JOIN vs FULL OUTER JOIN?**
> INNER: chỉ rows khớp cả hai bảng. LEFT: tất cả từ LEFT + matching từ RIGHT (NULL nếu không khớp). FULL OUTER: tất cả từ cả hai.
> LEFT JOIN phổ biến nhất: không muốn mất records khi joined table có thể rỗng.

**E2** 🟢 **Index — B-Tree hoạt động thế nào?**
> Sorted copy của column với pointers đến rows. Binary search → O(log n) thay vì full scan O(n).
> Trade-off: tăng tốc READ, chậm hơn INSERT/UPDATE/DELETE (phải maintain index).

**E3** 🟢 **ACID — explain với bank transfer?**
>
> - **Atomicity**: cả hai UPDATEs hoặc không ai — crash giữa chừng → rollback cả hai.
> - **Consistency**: constraints luôn đúng (balance không âm, FK valid).
> - **Isolation**: concurrent transfers không thấy nhau's half-done state.
> - **Durability**: sau khi thấy "success" — dù server crash — data persist (WAL log).

**E4** 🟢 **`WHERE` vs `HAVING`?**
> `WHERE`: filter rows **trước** GROUP BY. `HAVING`: filter groups **sau** GROUP BY (có thể dùng aggregates).
>
> ```sql
> SELECT dept, COUNT(*) FROM employees WHERE status='ACTIVE'
> GROUP BY dept HAVING COUNT(*) > 5;
> ```

**E5** 🟡 **Composite Index — column order?**
> Index chỉ dùng từ **leftmost column**. `INDEX(user_id, status, created_at)`:
>
> - `WHERE user_id=1` ✅ | `WHERE status='X'` ❌ (skip leftmost!)
> - **Rule**: equality columns FIRST, range columns LAST.

**E6** 🟡 **`EXPLAIN ANALYZE` — đọc output?**
> `Seq Scan`: full table scan (no index). `Index Scan`: good. `Index Only Scan`: best (table not touched).
> `cost=0.00..85000.00` (first=startup, second=total). `Execution Time` = actual.

**E7** 🟡 **Pagination: OFFSET vs Cursor-based?**
> OFFSET: `LIMIT 20 OFFSET 10000` → DB scan 10,000 rows, discard 9,980. Chậm với large offset!
> Cursor: `WHERE id < last_id LIMIT 20` → index scan O(log n). Recommended cho large data.

**E8** 🟡 **`NOT IN` vs `NOT EXISTS` — NULL gotcha?**
> `NOT IN (1, 2, NULL)` → **ALWAYS FALSE** nếu subquery có NULL! Silent bug.
>
> ```sql
> WHERE id NOT IN (SELECT user_id FROM orders)
> -- Nếu bất kỳ order.user_id nào là NULL → returns 0 rows!
>
> -- Safe:
> WHERE NOT EXISTS (SELECT 1 FROM orders WHERE user_id = users.id)
> ```

**E9** 🟡 **Soft Delete — ưu nhược?**
> Ưu: recovery dễ, audit trail, FK không bị broken.
> Nhược: queries phải luôn filter `deleted_at IS NULL`, UNIQUE constraints phức tạp, DB phình.
>
> ```sql
> CREATE UNIQUE INDEX uq_email_active ON users(email) WHERE deleted_at IS NULL;
> ```

**E10** 🟡 **Window Functions — khác GROUP BY thế nào?**
> GROUP BY collapse rows thành 1. Window functions compute across rows **mà không collapse**.
>
> ```sql
> SELECT user_id, order_id, total,
>     SUM(total) OVER (PARTITION BY user_id) AS user_total,
>     RANK() OVER (PARTITION BY user_id ORDER BY total DESC) AS rank
> FROM orders;  -- mỗi row vẫn hiện, thêm computed columns!
> ```

**E11** 🟡 **CTE (`WITH` clause) — benefits?**
> Named temporary result, readable complex queries. Recursive CTE cho hierarchical data.
>
> ```sql
> WITH RECURSIVE tree AS (
>     SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL
>     UNION ALL
>     SELECT c.id, c.name, c.parent_id FROM categories c
>     JOIN tree t ON c.parent_id = t.id
> ) SELECT * FROM tree;
> ```

**E12** 🟡 **`EXISTS` vs `COUNT(*) > 0`?**
> `EXISTS`: short-circuit tại first match → O(1) cho check. `COUNT > 0`: count ALL matching rows.
> Luôn prefer `EXISTS` khi chỉ cần biết có tồn tại hay không.

**E13** 🟡 **Foreign Key — khi nào KHÔNG dùng?**
> KHÔNG dùng khi: high write throughput (FK check = extra read/write), cross-database relations, microservices (integrity qua application logic), data warehouse.

**E14** 🔴 **`VACUUM` trong PostgreSQL?**
> MVCC: UPDATE tạo new version, không xóa old. `VACUUM` reclaim space từ dead tuples. `AUTOVACUUM` chạy tự động. `VACUUM FULL`: compact table nhưng **LOCK TABLE** — tránh production!

**E15** 🔴 **Deadlock trong DB — detect + prevent?**
> Circular lock wait. PostgreSQL tự detect, rollback 1 tx sau ~1s.
> **Fix**: luôn lock rows theo **cùng thứ tự**:
>
> ```java
> Long first = Math.min(id1, id2); Long second = Math.max(id1, id2);
> lockRow(first); lockRow(second);  // no circular wait possible!
> ```

**E16** 🟡 **Partial Index?**
> Index chỉ cho subset rows. Nhỏ hơn → cache hiệu quả → faster lookup.
>
> ```sql
> CREATE INDEX idx_pending ON orders(created_at) WHERE status = 'PENDING';
> CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;
> ```

**E17** 🔴 **`JSONB` vs `JSON` trong PostgreSQL?**
> `JSON`: stored as text, parse mỗi lần access. `JSONB`: binary, parse once on insert, faster query, indexable (GIN index).
>
> ```sql
> CREATE INDEX ON products USING GIN(attributes);
> SELECT * FROM products WHERE attributes @> '{"color": "red"}';  -- uses GIN!
> ```

**E18** 🔴 **Replication vs Sharding?**
> **Replication**: copy toàn bộ data → high availability, read scaling (read replicas). Write vẫn chỉ đến primary.
> **Sharding**: chia data ra nhiều servers → horizontal write scaling. Phức tạp hơn nhiều.
> Thực tế: bắt đầu với read replicas + caching. Sharding là last resort.

**E19** 🟡 **`TRUNCATE` vs `DELETE`?**
> TRUNCATE: very fast (deallocate pages), no WHERE, no triggers (by default). DELETE: row by row, WHERE OK, triggers chạy.
> TRUNCATE cho clear test data. DELETE cho conditional removal.

**E20** 🔴 **NULL trong SQL — các gotchas?**
> `NULL = NULL` → NULL (NOT TRUE!). Dùng `IS NULL / IS NOT NULL`.
> `1 + NULL → NULL`. `COUNT(*)` counts NULLs, `COUNT(col)` không.
> `NOT IN` với NULL subquery → always empty result set!
> `COALESCE(value, default)` để handle NULL.

**E21** 🟡 **Index không được dùng — các trường hợp?**
>
> ```sql
> WHERE UPPER(email) = 'A@B.COM'   -- function on indexed column → no index
> WHERE email LIKE '%@gmail.com'   -- leading wildcard → no index
> WHERE email != 'a@b.com'         -- inequality often → full scan
> WHERE status IN ('A','B','C','D','E')  -- too many values → optimizer may skip
> ```
>
> Fix function case: `CREATE INDEX ON users(UPPER(email))` — functional index.

**E22** 🟡 **Connection Pooling — vì sao critical?**
> Tạo DB connection = 50-100ms (TCP + auth). 1000 req/s → 50-100s overhead!
> Pool: duy trì N connections sẵn, reuse. Pool exhaustion → timeout. Nguyên nhân hay gặp: transaction quá dài.

**E23** 🔴 **Normalization vs Denormalization?**
> Normalize: no redundancy, update anomaly-free, storage efficient. Query cần nhiều JOINs.
> Denormalize: duplicate data intentionally for performance (e.g., `order.user_name` avoid JOIN). Risk: stale data.
> Rule: normalize by default, denormalize với evidence (measured bottleneck).

**E24** 🔴 **Covering Index — Index Only Scan?**
> Tất cả columns cần trong query có trong index → DB không cần access table rows!
>
> ```sql
> CREATE INDEX idx_covering ON orders(user_id, status) INCLUDE (created_at, total);
> SELECT status, created_at, total FROM orders WHERE user_id = 1;
> -- → Index Only Scan! No table access. 50-100x faster cho read-heavy.
> ```

**E25** 🔴 **`EXPLAIN` vs `EXPLAIN ANALYZE`?**
> `EXPLAIN`: show plan, estimated cost, **KHÔNG chạy**. `EXPLAIN ANALYZE`: chạy thực sự + actual timing.
> CẢNH BÁO: `EXPLAIN ANALYZE UPDATE/DELETE` thực sự modify data! Wrap: `BEGIN; EXPLAIN ANALYZE ...; ROLLBACK;`

---

# F. REST API & HTTP

**F1** 🟢 **HTTP Methods — safe và idempotent?**
> GET: safe + idempotent. POST: neither. PUT: idempotent (replace). PATCH: depends. DELETE: idempotent (delete twice → still "not exists").
> Idempotent = same result no matter how many times called.

**F2** 🟢 **HTTP Status Codes quan trọng?**
> 200 OK, 201 Created (+ Location header), 204 No Content (DELETE).
> 400 Bad Request, 401 Unauthorized (not authenticated), 403 Forbidden (no permission), 404 Not Found, 409 Conflict, 422 Unprocessable, 429 Too Many Requests.
> 500 Internal Error, 502 Bad Gateway, 503 Unavailable, 504 Timeout.

**F3** 🟡 **401 vs 403?**
> 401: "Tôi không biết bạn là ai" → authenticate (send credentials).
> 403: "Tôi biết bạn nhưng bạn không có quyền" → authorization denied.
> Bug thường gặp: user đã login nhưng không có quyền → trả 401 (sai!), phải là 403.

**F4** 🟡 **JWT structure?**
> `Header.Payload.Signature` — base64url encoded.
> Verify: re-compute signature from header+payload → compare với provided. Nếu match + not expired → valid.
> **Payload KHÔNG encrypt** (chỉ base64) → đừng put sensitive data!

**F5** 🟡 **CORS — tại sao browser enforce mà curl không?**
> CORS là browser security, không phải HTTP. Browser check `Access-Control-Allow-Origin`. curl không phải browser → không check.
> Preflight: browser gửi OPTIONS trước để check permission.

**F6** 🟡 **Idempotency Key?**
> POST retry gây duplicate. Fix: `Idempotency-Key: uuid-per-operation` header.
> Server: first time → process + store (key, response). Retry → trả stored response, skip processing.
> Quan trọng cho: payment, order creation.

**F7** 🟡 **Pagination — OFFSET vs Cursor?**
> Cursor: `WHERE id < last_id LIMIT 20` → O(log n) index scan. Phù hợp infinite scroll, large data.
> OFFSET: `LIMIT 20 OFFSET 10000` → O(offset) full scan. OK cho small data + page jump needed.

**F8** 🟡 **Rate Limiting strategies?**
> Fixed Window: 100 req/min, burst issue tại boundary. Sliding Window: smooth, no burst. Token Bucket: burst allowed up to bucket size. Leaky Bucket: strict rate.
> Response: `429 Too Many Requests` + `Retry-After`, `X-RateLimit-*` headers.

**F9** 🟡 **REST vs GraphQL?**
> REST: multiple endpoints, fixed shape, simple, HTTP-cacheable.
> GraphQL: 1 endpoint, client specifies exact shape, no over/under-fetching.
> Dùng GraphQL: multiple clients với different data needs, rapid frontend dev.
> Stick REST: simple CRUD, caching quan trọng (POST không cache), small team.

**F10** 🟡 **`Cache-Control` headers quan trọng?**
> `public, max-age=3600`: CDN + browser cache 1h. `private, max-age=300`: browser only.
> `no-store`: never cache (sensitive). `immutable, max-age=31536000`: static assets với hash.
> ETag + `If-None-Match` → 304 Not Modified nếu unchanged (save bandwidth).

**F11** 🔴 **API Versioning strategies?**
>
> 1. URL path: `/api/v1/users` — most common, explicit, bookmarkable.
> 2. Header: `Accept: application/vnd.api.v2+json` — cleaner URLs.
> 3. Query param: `/api/users?version=2` — easy test.
> Recommend URL path cho public APIs. Include `Sunset` header khi deprecate.

**F12** 🔴 **Circuit Breaker?**
> CLOSED → OPEN (fail fast) → HALF_OPEN (test) → CLOSED nếu recover.
> Tránh hammer failing service. Spring Boot + Resilience4j:
>
> ```java
> @CircuitBreaker(name = "paymentGw", fallbackMethod = "paymentFallback")
> PaymentResult charge(ChargeRequest req) { return externalGw.charge(req); }
> ```

**F13** 🟡 **HTTPS — TLS handshake?**
> ClientHello → ServerHello + Certificate → Client verify cert (CA? domain? expired?) → KeyExchange → Encrypted communication. TLS 1.3: 1 RTT (faster).

**F14** 🔴 **Webhook vs Polling?**
> Polling: client gọi định kỳ → inefficient (nhiều empty responses).
> Webhook: server push khi có event → real-time, efficient.
> Webhook security: verify HMAC signature (`X-Hub-Signature-256`).

**F15** 🟡 **HTTP/1.1 vs HTTP/2?**
> HTTP/1.1: 1 request per connection. Head-of-line blocking.
> HTTP/2: multiplexing (multiple requests, 1 connection), header compression. 80 resources → 1 connection instead of 80.

**F16** 🟡 **`@RequestParam` vs `@PathVariable` vs `@RequestBody`?**
> PathVariable: `/users/{id}` — required, clean URL. RequestParam: `/users?status=ACTIVE` — optional OK, filters. RequestBody: JSON body cho POST/PUT/PATCH.

**F17** 🔴 **WebSocket vs SSE?**
> WebSocket: full-duplex, bidirectional. Chat, real-time gaming, collaborative.
> SSE: server → client only, uses regular HTTP. Live feeds, notifications.
> SSE simpler khi chỉ cần server push.

**F18** 🟡 **Best practices cho error response?**
>
> ```json
> { "status": 422, "error": "VALIDATION_FAILED",
>   "message": "Rating must be between 1 and 5",
>   "timestamp": "2025-05-01T10:00:00Z", "traceId": "abc123" }
> ```
>
> Consistent structure, machine-readable error code, human-readable message, traceId cho debugging.

**F19** 🔴 **API Security layers?**
> Authentication (JWT valid) → Authorization (has permission) → Input validation (injection prevention) → Rate limiting → HTTPS only → CORS whitelist → No sensitive data in logs → OWASP Top 10.

**F20** 🟡 **REST naming conventions?**
> Nouns cho resources, plural: `/orders` not `/getOrders`. Verbs cho actions: `/orders/{id}/cancel`.
> Response: 201 + Location header cho POST. 204 No Content cho DELETE. Versioning: `/api/v1/`.

---

# G. Concurrency

**G1** 🟢 **Thread vs Process?**

- Process: independent, own memory, expensive (~1s create). Thread: trong process, share heap, cheap.
- GC hoạt động trên shared heap. Stack là riêng mỗi thread.

**G2** 🟢 **Thread lifecycle?**

- NEW → RUNNABLE (start()) → BLOCKED(synchronized)/WAITING(wait,join)/TIMED_WAITING(sleep) → TERMINATED.

**G3** 🟡 **`ExecutorService` — tại sao không dùng `new Thread()` trực tiếp?** ❌

- new Thread(): ~1MB stack, không reuse, không control số lượng.
- ExecutorService: reuse, queue, bounded, exception handling. Prefer `ThreadPoolExecutor` explicit over `Executors.newFixedThreadPool` (hidden unbounded queue → OOM risk).

**G4** 🟡 **`synchronized` vs `ReentrantLock`?** ❌

- `synchronized`: simple, auto-release.
- `ReentrantLock`: tryLock với timeout (no deadlock!), fair ordering, multiple conditions, interruptible.
- LUÔN unlock trong `finally`!

**G5** 🟡 **`AtomicInteger` vs `synchronized counter`?** ❌
> AtomicInteger: CPU-level CAS (Compare-And-Swap) — no lock, no blocking, faster. `LongAdder` even faster for counters (multiple cells, less contention).

**G6** 🟡 **`ConcurrentHashMap` thread safety?** ❌
> `synchronizedMap()`: lock TOÀN BỘ map → 1 thread at a time.
> `ConcurrentHashMap` Java 8: `get()` NO lock. `put()` chỉ lock specific bin. Much higher concurrency.

**G7** 🔴 **`volatile` vs `AtomicReference`?** ❌
> `volatile reference`: ensures visibility. Operations on the object NOT atomic.
> `AtomicReference.compareAndSet()`: CAS on the reference itself — atomic.

**G8** 🟡 **`CountDownLatch` vs `CyclicBarrier`?** ❌
> CountDownLatch: one-time, N workers signal done, 1 waiter proceeds.
> CyclicBarrier: reusable, N threads wait for each other at barrier, all proceed together.

**G9** 🔴 **ThreadLocal — memory leak?** ❌
> Per-thread variable. Với thread pool: threads không chết → values persist → leak!
> LUÔN `remove()` trong finally:
>
> ```java
> threadLocal.set(value);
> try { doWork(); } finally { threadLocal.remove(); }  // critical!
> ```

**G10** 🔴 **Race Condition — classic example?**
`count++` = read + increment + write = 3 steps, không atomic.
Thread A và B đọc cùng value → cùng write → lost update!
Fix: `AtomicInteger.incrementAndGet()` hoặc `synchronized`.

**G11** 🟡 **`BlockingQueue` — Producer/Consumer?** ❌
> `put()`: block nếu full (backpressure!). `take()`: block nếu empty.
> Natural backpressure: slow consumers → queue fills → producers slow down.

**G12** 🔴 **`CompletableFuture` — exception handling?** ❌
>
> ```java
> CompletableFuture.supplyAsync(() -> fetchUser(id))
>     .thenApply(user -> enrichUser(user))
>     .exceptionally(ex -> User.anonymous())   // fallback on error
>     .whenComplete((result, ex) -> metrics.record(result, ex));  // always runs
> ```

**G13** 🔴 **Virtual Threads (Java 21)?**

- Platform threads: 1-1 với OS thread, ~1MB stack, max ~10k.
- Virtual threads: JVM-managed, ~few KB, millions possible. Block → JVM unmount từ carrier, mount khác.
- Ideal for I/O-bound. CPU-bound: không giúp.

**G14** 🔴 **`ForkJoinPool` và `parallelStream()` cạm bẫy?** ❌
> `parallelStream()` dùng `ForkJoinPool.commonPool()`. Long-running tasks → block common pool → cả app stall!
> Fix: custom pool:
>
> ```java
> new ForkJoinPool(4).submit(() -> list.parallelStream().map(this::process).collect(toList())).get();
> ```

**G15** 🔴 **`Semaphore` — giới hạn concurrency?** ❌
>
> ```java
> Semaphore sem = new Semaphore(10);  // max 10 concurrent
> sem.acquire();
> try { externalApi.call(); } finally { sem.release(); }  // always release!
> ```
>
> Dùng: limit concurrent external API calls, throttle DB queries, rate limit uploads.

---

# H. Testing & Design Patterns ❌

**H1** 🟢 **Unit vs Integration vs E2E test?**
> Unit: 1 class, full mock, fast (ms). Integration: multiple layers, partial mock, seconds. E2E: full system, no mock, slow (min).
> 70/20/10 rule. Fast tests → run often → quick feedback.

**H2** 🟢 **Mockito — `when/thenReturn` vs `verify`?**
> `when(repo.findById(1L)).thenReturn(Optional.of(user))` — stub return value.
> `verify(repo).findById(1L)` — assert method WAS called.
> `verify(service, never()).send(any())` — assert NEVER called.

**H3** 🟡 **`@SpringBootTest` vs slices?**
> `@SpringBootTest`: full context (~30s). `@WebMvcTest`: controller layer + MockMvc. `@DataJpaTest`: JPA layer + H2.
> Prefer slices cho speed. `@MockBean` thay thế beans không load trong slice.

**H4** 🟡 **Testcontainers — khi nào tốt hơn H2?**
> H2 SQL dialect ≠ PostgreSQL. PostgreSQL features (JSONB, window functions, partial index) → fail trên H2.
> Testcontainers: real PostgreSQL in Docker → accurate tests.

**H5** 🟡 **AssertJ vs JUnit assertions?**
> AssertJ: fluent, readable, better error messages.
>
> ```java
> assertThat(user).extracting(User::getName, User::getAge).containsExactly("Khang", 25);
> assertThatThrownBy(() -> service.create(invalid)).isInstanceOf(ValidationException.class)
>     .hasMessageContaining("email");
> ```

**H6** 🟡 **SOLID — ví dụ vi phạm thực tế?**
> S: UserService handle auth + email + billing → split.
> O: if/else switch trên type → strategy pattern.
> L: Square extends Rectangle, setWidth() → ảnh hưởng behavior.
> I: fat interface Animal với fly() → Dog phải implement.
> D: depend on interface, not concrete class.

**H7** 🔴 **Strategy Pattern — Spring application?**
>
> ```java
> interface PaymentProcessor { boolean supports(Method m); PaymentResult process(Req r); }
>
> @Service class PaymentService {
>     private final List<PaymentProcessor> processors;  // Spring injects all!
>     public PaymentResult pay(Req req) {
>         return processors.stream().filter(p -> p.supports(req.getMethod()))
>                          .findFirst().orElseThrow().process(req);
>     }
> }
> ```
>
> Open for extension (add processor), closed for modification.

**H8** 🟡 **Observer Pattern — `@TransactionalEventListener`?**
>
> ```java
> @TransactionalEventListener(phase = AFTER_COMMIT)
> void sendEmail(UserRegisteredEvent e) { emailService.send(e.user()); }
> // Chỉ chạy sau khi TX commit thành công → tránh email khi rollback!
> ```

**H9** 🟡 **Builder Pattern — khi nào cần?**
> Khi object có nhiều optional parameters. Thay thế "telescope constructor anti-pattern".
> Lombok `@Builder` hoặc tự viết. `build()` validate required fields.

**H10** 🔴 **Repository Pattern — tại sao tách khỏi Service?**

- Service = business logic. Repository = data access. Tách để: test service với mock, swap storage (PG → MongoDB), reuse queries.

**H11** 🔴 **Factory Pattern?**

- Factory Method: subclass quyết định tạo object nào.
- Abstract Factory: tạo family of related objects (MaterialUI: Button + TextField cùng theme).
- Spring application: `@Bean` methods trong `@Configuration` là factory methods.

**H12** 🟡 **Parameterized Tests — JUnit 5?**
>
> ```java
> @ParameterizedTest
> @CsvSource({"1, 1", "5, 120", "10, 3628800"})
> void testFactorial(int input, long expected) {
>     assertThat(MathUtils.factorial(input)).isEqualTo(expected);
> }
> ```

**H13** 🔴 **Test Pyramid — tại sao không all E2E?**
> E2E: slow, brittle (UI changes break), hard to debug, expensive CI time.
> Unit: fast, precise failure localization, cheap. Each layer catches different bugs.

**H14** 🔴 **Clean Code — code review checklist?**

- Meaningful names, small functions (1 thing), no magic numbers, fail fast, DRY, comments explain WHY, no dead code, consistent naming, proper exception handling, security (injection, auth).

**H15** 🔴 **Design API endpoint — ví dụ tổng hợp?**

```
 POST   /api/v1/products/{id}/reviews   → 201 + Location header
 GET    /api/v1/products/{id}/reviews?status=APPROVED&page=0&size=20
 DELETE /api/v1/reviews/{reviewId}      → 204 No Content

 Error: { "status": 422, "error": "DUPLICATE_REVIEW",
          "message": "You have already reviewed this product",
          "traceId": "abc123" }
```

Versioning, proper status codes, consistent error format, input validation, authorization check.

---

## 📎 Level Guide

| Level | Focus |
|---|---|
| 🟢 Fresher | A1-A8, B1-B5, C1-C4, D1-D7, E1-E4, F1-F3, G1-G2, H1-H2 |
| 🟡 Junior | Tất cả 🟡 + nắm chắc 🟢. Đặc biệt: D6, D7, D9, D13 |
| 🔴 Junior+ | Toàn bộ. Focus: D17-D35, E7-E25, G9-G15 |

## 💡 Tips Phỏng Vấn

1. **Giải thích TẠI SAO** — "lazy loading dùng proxy VÌ session lifecycle..." tốt hơn chỉ định nghĩa
2. **Thừa nhận không biết** — interviewer đánh giá cao sự thành thật hơn bịa đặt
3. **Nêu trade-off** — "JOIN FETCH tốt cho single association nhưng gây cartesian product với collections"
4. **Đặt câu hỏi ngược** — "Team dùng Spring Boot version mấy? Có nhiều legacy code không?"
5. **STAR method** cho behavioral — Situation, Task, Action, Result
