# 🧠 Heap & Stack — Memory Deep Dive in Java
> What actually happens in memory when you write `new`, declare a variable, or load a class

---

## 📚 Table of Contents

1. [Memory Areas Overview](#1-memory-areas-overview)
2. [The Stack — How It Works](#2-the-stack--how-it-works)
3. [The Heap — How It Works](#3-the-heap--how-it-works)
4. [What Happens Step by Step](#4-what-happens-step-by-step)
5. [Class Loading & Metaspace](#5-class-loading--metaspace)
6. [Garbage Collection](#6-garbage-collection)
7. [Common Memory Problems](#7-common-memory-problems)
8. [Summary Cheatsheet](#8-summary-cheatsheet)

---

# 1. Memory Areas Overview

Khi JVM chạy, nó xin OS một vùng RAM rồi chia thành nhiều khu vực:

```
┌─────────────────────────────────────────────────────────────────┐
│                         JVM Memory                              │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │   METASPACE  │  │     HEAP     │  │  STACK (per thread)   │ │
│  │              │  │              │  │                       │ │
│  │ Class bytecode│  │  All Objects │  │ Thread 1: [frame][..] │ │
│  │ Method info  │  │  All Arrays  │  │ Thread 2: [frame][..] │ │
│  │ Static fields│  │              │  │ Thread 3: [frame][..] │ │
│  │ Constants    │  │  Managed by  │  │                       │ │
│  │              │  │     GC       │  │  Fast, auto cleanup   │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  PC REGISTER │  │ NATIVE STACK │                            │
│  │ (per thread) │  │  (JNI code)  │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

| Khu vực | Lưu gì | Thread-safe? | Quản lý bởi |
|---------|--------|-------------|------------|
| **Stack** | Local variables, method frames, primitive values | Có (mỗi thread 1 stack riêng) | JVM tự động |
| **Heap** | Tất cả Objects, Arrays | Không (shared) | Garbage Collector |
| **Metaspace** | Class metadata, static fields, bytecode | Có | JVM / GC |
| **PC Register** | Địa chỉ instruction đang chạy | Có (per thread) | JVM |

---

# 2. The Stack — How It Works

## 2.1 Stack là gì?

Stack là vùng nhớ **LIFO** (Last In First Out) — như một chồng đĩa.  
Mỗi thread có **1 stack riêng** — không share với thread khác.

Mỗi lần gọi một method, JVM **push** một **Stack Frame** lên stack.  
Khi method return, frame đó bị **pop** → bộ nhớ giải phóng ngay lập tức.

```
Gọi main() → push frame
  Gọi methodA() → push frame
    Gọi methodB() → push frame
    methodB() return → pop frame  ← bộ nhớ giải phóng ngay
  methodA() return → pop frame    ← bộ nhớ giải phóng ngay
main() return → pop frame         ← bộ nhớ giải phóng ngay
```

## 2.2 Stack Frame chứa gì?

```
┌──────────────────────────────────────────┐
│           Stack Frame: calculate()        │
│                                          │
│  Local Variable Table                    │
│  ┌────────────────────────────────────┐  │
│  │ slot 0: this (nếu instance method) │  │
│  │ slot 1: int a = 10                 │  │
│  │ slot 2: int b = 5                  │  │
│  │ slot 3: int result = 15            │  │
│  │ slot 4: String name = 0xA100 ──────┼──┼──▶ "Khang" trên Heap
│  └────────────────────────────────────┘  │
│                                          │
│  Operand Stack (tính toán trung gian)    │
│  ┌──────────────────────────────────┐    │
│  │  [10] [5] ... (bytecode operands)│    │
│  └──────────────────────────────────┘    │
│                                          │
│  Return Address (quay lại đâu sau return)│
└──────────────────────────────────────────┘
```

**Quan trọng:**
- Primitive value (`int`, `double`, `boolean`...) → lưu **thẳng giá trị** trong slot
- Reference variable (`String`, `Object`, array...) → lưu **địa chỉ** (pointer) trỏ tới Heap

## 2.3 Ví dụ trực quan

```java
public class Demo {
    public static void main(String[] args) {    // Frame 1 pushed
        int x = 10;                             // x=10 trong frame 1
        String s = "Hello";                     // s=0xA100 trong frame 1
        methodA(x);                             // push Frame 2
    }

    static void methodA(int val) {              // Frame 2 pushed
        int y = val * 2;                        // y=20 trong frame 2
        methodB();                              // push Frame 3
    }   // Frame 2 popped → y, val biến mất

    static void methodB() {                     // Frame 3 pushed
        double pi = 3.14;                       // pi=3.14 trong frame 3
    }   // Frame 3 popped → pi biến mất
}       // Frame 1 popped → x, s biến mất
```

```
Thời điểm methodB() đang chạy — Stack trông như này:

TOP ┌──────────────────┐
    │  Frame 3: methodB│  ← đang chạy
    │  pi = 3.14       │
    ├──────────────────┤
    │  Frame 2: methodA│
    │  val = 10        │
    │  y   = 20        │
    ├──────────────────┤
    │  Frame 1: main   │
    │  x = 10          │
    │  s = 0xA100      │
BOT └──────────────────┘
```

---

# 3. The Heap — How It Works

## 3.1 Heap là gì?

Heap là vùng nhớ **dùng chung** cho tất cả threads.  
**Mọi Object và Array đều sống trên Heap** — không có ngoại lệ.  
Heap được quản lý bởi **Garbage Collector** — tự động dọn dẹp khi object không còn ai dùng.

## 3.2 Cấu trúc bên trong Heap (Generational GC)

JVM chia Heap thành các vùng dựa trên "tuổi" của object:

```
┌──────────────────────────────────────────────────────────────┐
│                         HEAP                                 │
│                                                              │
│  ┌──────────────────────────────┐  ┌─────────────────────┐  │
│  │         YOUNG GENERATION     │  │   OLD GENERATION    │  │
│  │                              │  │   (Tenured Space)   │  │
│  │  ┌──────────┐  ┌──────────┐  │  │                     │  │
│  │  │  EDEN    │  │SURVIVOR  │  │  │  Objects sống lâu   │  │
│  │  │          │  │  S0 | S1 │  │  │  (đã qua nhiều GC)  │  │
│  │  │ new obj  │  │          │  │  │                     │  │
│  │  │ born here│  │          │  │  │                     │  │
│  │  └──────────┘  └──────────┘  │  │                     │  │
│  └──────────────────────────────┘  └─────────────────────┘  │
│                                                              │
│  Minor GC: dọn Young Generation (fast, frequent)            │
│  Major GC: dọn Old Generation (slow, rare)                  │
└──────────────────────────────────────────────────────────────┘
```

**Lifecycle của một Object trên Heap:**

```
new Object()
    │
    ▼
EDEN SPACE ──── [Minor GC] ──▶ dead? → xóa
    │
    │ sống sót
    ▼
SURVIVOR S0 ──── [Minor GC] ──▶ dead? → xóa
    │
    │ sống sót N lần (threshold thường = 15)
    ▼
OLD GENERATION ──── [Major GC] ──▶ dead? → xóa
```

## 3.3 Object trên Heap trông như thế nào?

Mỗi object trên heap có cấu trúc:

```
┌──────────────────────────────────────────┐
│              Object Header               │
│  ┌──────────────────────────────────┐   │
│  │ Mark Word (8 bytes)              │   │
│  │  - hashCode                      │   │
│  │  - GC age (4 bits)               │   │
│  │  - lock state (synchronized)     │   │
│  ├──────────────────────────────────┤   │
│  │ Klass Pointer (4-8 bytes)        │   │
│  │  - trỏ đến class metadata        │   │  ──▶ Metaspace
│  └──────────────────────────────────┘   │
│                                          │
│              Instance Data               │
│  ┌──────────────────────────────────┐   │
│  │ field: name  = 0xB300 (ref)      │   │  ──▶ String object khác trên heap
│  │ field: age   = 21     (int)      │   │
│  │ field: score = 9.5    (double)   │   │
│  └──────────────────────────────────┘   │
│                                          │
│              Padding                     │
│  (align to 8 bytes — performance)        │
└──────────────────────────────────────────┘
```

---

# 4. What Happens Step by Step

## 4.1 Khai báo Primitive

```java
int x = 42;
```

```
Stack Frame:
┌──────────────┐
│ x │  42      │  ← giá trị thẳng, không có heap involvement
└──────────────┘

Heap: không có gì thêm
```

---

## 4.2 Khai báo Object (`new`)

```java
Person p = new Person("Khang", 21);
```

**Bước 1:** JVM check xem class `Person` đã load chưa. Nếu chưa → load lên Metaspace.

**Bước 2:** JVM tính toán bao nhiêu bytes cần cho object này.

**Bước 3:** JVM **allocate** vùng nhớ đó trên **Eden Space** (Heap).

**Bước 4:** JVM **zero-initialize** tất cả fields:
```
name  → null
age   → 0
```

**Bước 5:** Gọi constructor, assign giá trị thực:
```
name  → 0xC100 (trỏ tới String "Khang" trên heap)
age   → 21
```

**Bước 6:** Trả về địa chỉ object, lưu vào biến `p` trên Stack.

```
STACK                        HEAP (Eden)
┌──────────────┐             ┌───────────────────────┐
│ p = 0xA200   │────────────▶│ Person @ 0xA200       │
└──────────────┘             │   name = 0xC100 ──────┼──▶ "Khang" @ 0xC100
                             │   age  = 21            │
                             └───────────────────────┘
```

---

## 4.3 Gán Object cho biến khác

```java
Person p1 = new Person("Khang", 21);
Person p2 = p1;
```

```
STACK                        HEAP
┌──────────────┐             ┌───────────────────────┐
│ p1 = 0xA200  │────────────▶│ Person @ 0xA200       │
│ p2 = 0xA200  │────────────▶│   name = "Khang"      │
└──────────────┘             │   age  = 21            │
                             └───────────────────────┘

p1 và p2 trỏ cùng 1 object!
→ p2.setName("Nam") sẽ thay đổi cả p1.getName() luôn
```

---

## 4.4 Khai báo Array

```java
int[] arr = new int[5];
```

```
STACK                        HEAP (Eden)
┌──────────────┐             ┌───────────────────────────────┐
│ arr = 0xD300 │────────────▶│ int[] @ 0xD300                │
└──────────────┘             │  [header: length=5]           │
                             │  [0] = 0                      │
                             │  [1] = 0                      │
                             │  [2] = 0                      │
                             │  [3] = 0                      │
                             │  [4] = 0                      │
                             └───────────────────────────────┘

Array cũng là object trên Heap!
```

```java
String[] names = new String[3];
names[0] = "Alice";
```

```
STACK                        HEAP
┌──────────────┐             ┌───────────────────────────────┐
│ names=0xE400 │────────────▶│ String[] @ 0xE400             │
└──────────────┘             │  [0] = 0xF100 ────────────────┼──▶ "Alice"
                             │  [1] = null                   │
                             │  [2] = null                   │
                             └───────────────────────────────┘

Array of objects lưu references, không lưu objects thẳng!
```

---

## 4.5 Khi Method được gọi

```java
public class Calculator {
    public static void main(String[] args) {
        int a = 5;
        int b = 3;
        int result = add(a, b);
        System.out.println(result);
    }

    static int add(int x, int y) {
        int sum = x + y;
        return sum;
    }
}
```

```
Khi add(a, b) được gọi — Stack trông như này:

┌────────────────────────────────┐
│    Frame: add()                │  ← TOP (đang chạy)
│    x   = 5  (copy của a)       │  ← Java pass by value!
│    y   = 3  (copy của b)       │
│    sum = 8                     │
│    return address → main frame │
├────────────────────────────────┤
│    Frame: main()               │
│    a      = 5                  │
│    b      = 3                  │
│    result = ? (chưa assign)    │
│    args   = 0xXXXX (ref)       │
└────────────────────────────────┘

add() return 8:
→ Frame của add() bị POP — x, y, sum biến mất hoàn toàn
→ 8 được gán vào result trong frame main()

┌────────────────────────────────┐
│    Frame: main()               │  ← TOP
│    a      = 5                  │
│    b      = 3                  │
│    result = 8                  │  ← đã được gán
│    args   = 0xXXXX             │
└────────────────────────────────┘
```

---

## 4.6 Khi Object được pass vào Method

```java
void rename(Person p) {
    p.name = "New Name";   // ← thay đổi object trên Heap
}

Person person = new Person("Khang");
rename(person);
// person.name bây giờ là "New Name"
```

```
Trước khi gọi rename():
STACK                        HEAP
┌──────────────┐             ┌─────────────────┐
│person=0xA200 │────────────▶│ Person @ 0xA200 │
└──────────────┘             │  name = "Khang" │
                             └─────────────────┘

Trong rename() — stack có 2 frames:
┌─────────────────────────────┐
│  Frame: rename()            │
│  p = 0xA200 ────────────────┼──────────────────▶ ┌─────────────────┐
├─────────────────────────────┤                     │ Person @ 0xA200 │
│  Frame: main()              │                     │  name = "Khang" │
│  person = 0xA200 ───────────┼──────────────────▶  └─────────────────┘
└─────────────────────────────┘

Cả 2 biến trỏ cùng 1 object trên Heap!
p.name = "New Name" → thay đổi trực tiếp object đó

Sau rename() return — Frame rename() bị POP:
┌──────────────┐             ┌─────────────────────┐
│person=0xA200 │────────────▶│ Person @ 0xA200     │
└──────────────┘             │  name = "New Name"  │  ← đã thay đổi!
                             └─────────────────────┘
```

---

# 5. Class Loading & Metaspace

## 5.1 Metaspace lưu gì?

```
METASPACE
┌──────────────────────────────────────────────────────┐
│                   Class: Person                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Class Metadata                              │   │
│  │  - tên class, superclass, interfaces         │   │
│  │  - access modifiers                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Method bytecode (compiled instructions)     │   │
│  │  - getName()                                 │   │
│  │  - setAge()                                  │   │
│  │  - toString()                                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Static Fields (class-level, shared)         │   │
│  │  - static int count = 0                      │   │
│  │  - static final String TYPE = "PERSON"       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Constant Pool                               │   │
│  │  - string literals ("Hello", "Error"...)     │   │
│  │  - numeric constants                         │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  vtable (Virtual Method Table)               │   │
│  │  - map method → implementation               │   │
│  │  - dùng cho dynamic dispatch (polymorphism)  │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

## 5.2 Class Loading xảy ra khi nào?

```java
// Class chưa được load cho đến khi lần đầu tiên:
// 1. Tạo instance: new Person()
// 2. Gọi static method: Person.getCount()
// 3. Access static field: Person.MAX_AGE
// 4. Subclass được load → parent class load trước
// 5. Class được dùng trong reflection

public class LazyLoading {
    public static void main(String[] args) {
        // Tại đây, class Person CHƯA được load
        System.out.println("Before creating Person");

        Person p = new Person("Khang"); // ← Class Person được load TẠI ĐÂY
        // Thứ tự:
        // 1. ClassLoader tìm Person.class
        // 2. Đọc bytecode lên Metaspace
        // 3. Chạy static initializer block
        // 4. Allocate object trên Heap
        // 5. Chạy constructor
    }
}
```

## 5.3 Static fields sống ở đâu?

```java
public class Counter {
    static int count = 0;     // sống trên METASPACE — không phải Heap!
    String name;               // sống trên HEAP (bên trong mỗi object)
}

Counter c1 = new Counter();
Counter c2 = new Counter();

METASPACE                    HEAP
┌──────────────────┐         ┌─────────────────┐  ┌─────────────────┐
│ Class: Counter   │         │ Counter @ 0xA1  │  │ Counter @ 0xB2  │
│  count = 0 ←─────┼─────┐   │   name = null   │  │   name = null   │
│  [bytecode]      │     │   └─────────────────┘  └─────────────────┘
└──────────────────┘     │
                         │   c1 và c2 đều "dùng chung" count này
                         │   c1.count++ → count trong Metaspace thành 1
                         │   c2 nhìn vào cũng thấy count = 1
                         └── (1 bản duy nhất cho cả class)
```

---

# 6. Garbage Collection

## 6.1 Khi nào object bị xóa?

Object bị xóa khi **không còn reference nào trỏ đến nó** (unreachable).

```java
void method() {
    Person p = new Person("Khang");  // object tạo trên Heap
    // ... dùng p ...
}
// method() return → frame bị pop → p biến mất khỏi stack
// Object Person trên Heap không còn ai trỏ tới
// → trở thành "garbage" → GC sẽ dọn

// Explicit null cũng làm object unreachable:
Person p = new Person("Khang");
p = null;   // object cũ không còn ai trỏ → garbage

// Object bị cô lập (circular reference) cũng bị dọn:
class Node { Node next; }
Node a = new Node();
Node b = new Node();
a.next = b;
b.next = a;
a = null;
b = null;
// a và b reference nhau nhưng không ai bên ngoài trỏ vào
// → cả 2 đều là garbage → GC dọn được (modern GC handles này)
```

## 6.2 GC Roots — điểm xuất phát để tìm live objects

GC bắt đầu từ **GC Roots** và trace tất cả objects có thể reach được:

```
GC Roots:
├── Local variables trong tất cả Stack Frames
├── Static fields trong Metaspace
├── Active threads
└── JNI references

GC đánh dấu tất cả objects có thể reach từ roots → LIVE
Còn lại → GARBAGE → xóa
```

```
         GC Root (stack)
              │
              ▼
          Person p ────────────▶ Person Object (LIVE)
                                      │
                                      │.address
                                      ▼
                                  Address Object (LIVE)
                                      │
                                      │.city
                                      ▼
                                  City Object (LIVE)

         Person q ─ (q = null) ─ ▶  ??? ← không còn trỏ → GARBAGE
```

## 6.3 Minor GC vs Major GC

```
Minor GC (Young Generation):
- Chạy thường xuyên, nhanh (milli-seconds)
- Chỉ scan Eden + Survivor spaces
- Objects sống sót → chuyển sang Survivor / Old Gen
- Stop-the-world rất ngắn

Major GC / Full GC (Old Generation):
- Chạy không thường xuyên, chậm hơn
- Scan toàn bộ Heap
- Stop-the-world dài hơn → có thể gây lag trong app

Stop-the-world: JVM dừng TẤT CẢ application threads trong khi GC chạy
→ Đây là lý do tại sao GC tuning quan trọng trong production
```

---

# 7. Common Memory Problems

## 7.1 StackOverflowError

```java
// Đệ quy không có base case → stack frames tăng mãi → hết stack
void infinite() {
    infinite();   // gọi chính mình mãi mãi
}
// java.lang.StackOverflowError

// Stack size mặc định: 512KB - 1MB per thread
// Có thể set: java -Xss2m MyApp (2MB stack per thread)

// Cách fix: thêm base case cho đệ quy hoặc dùng iteration thay recursion
void fibonacci(int n) {
    if (n <= 1) return n;  // ← base case
    return fibonacci(n-1) + fibonacci(n-2);
}
```

## 7.2 OutOfMemoryError: Java Heap Space

```java
// Heap đầy — tạo quá nhiều objects, GC không kịp dọn
List<byte[]> leak = new ArrayList<>();
while (true) {
    leak.add(new byte[1024 * 1024]);  // 1MB mỗi vòng lặp
}
// java.lang.OutOfMemoryError: Java heap space

// Heap size:
// -Xms512m  → initial heap size (512MB)
// -Xmx2g    → max heap size (2GB)
// java -Xms512m -Xmx2g MyApp
```

## 7.3 Memory Leak (Java vẫn có thể bị!)

Java có GC nhưng **vẫn bị memory leak** nếu mày giữ references không cần thiết:

```java
// Leak 1: Static collection giữ objects mãi mãi
public class Cache {
    private static final List<Object> cache = new ArrayList<>();

    public void add(Object obj) {
        cache.add(obj);   // thêm mãi, không bao giờ remove
        // cache là static → sống suốt app lifecycle
        // → tất cả objects trong đó không bao giờ bị GC
    }
}

// Leak 2: Listener không được unregister
button.addActionListener(expensiveListener);
// nếu không gọi button.removeActionListener(expensiveListener)
// button giữ reference đến listener mãi → listener không bị GC

// Leak 3: Inner class giữ reference đến Outer class
public class Outer {
    private byte[] bigData = new byte[1024 * 1024]; // 1MB

    class Inner {
        // Inner class tự động giữ reference đến Outer instance!
        // Nếu Inner sống lâu hơn Outer → Outer và bigData không bị GC
    }
}
// Fix: dùng static nested class thay inner class nếu không cần Outer reference
```

## 7.4 Escaping References

```java
// Object thoát ra ngoài → caller có thể modify state bên trong
public class PersonRepository {
    private List<Person> persons = new ArrayList<>();

    // ❌ BAD: return reference thẳng đến internal list
    public List<Person> getAll() {
        return persons;   // caller có thể persons.clear() hoặc persons.add(...)
    }

    // ✅ GOOD: return defensive copy
    public List<Person> getAll() {
        return new ArrayList<>(persons);          // copy
        // hoặc:
        return Collections.unmodifiableList(persons); // read-only view
    }
}
```

---

# 8. Summary Cheatsheet

## Cái gì đi đâu?

```
┌──────────────────────────────────────────────────────────────────┐
│  Khai báo này          │  Sống ở đâu?                           │
├──────────────────────────────────────────────────────────────────┤
│  int x = 5;            │  STACK (giá trị thẳng)                 │
│  double d = 3.14;      │  STACK (giá trị thẳng)                 │
│  boolean b = true;     │  STACK (giá trị thẳng)                 │
├──────────────────────────────────────────────────────────────────┤
│  String s = "Hello";   │  s (ref) → STACK                       │
│                        │  "Hello" object → HEAP (String Pool)   │
├──────────────────────────────────────────────────────────────────┤
│  Person p = new Person │  p (ref) → STACK                       │
│                        │  Person object → HEAP (Eden)           │
│                        │  fields bên trong → HEAP (trong object)│
├──────────────────────────────────────────────────────────────────┤
│  int[] arr = new int[5]│  arr (ref) → STACK                     │
│                        │  array object → HEAP                   │
├──────────────────────────────────────────────────────────────────┤
│  static int count = 0; │  METASPACE (class level)               │
│  static final String X │  METASPACE (Constant Pool)             │
├──────────────────────────────────────────────────────────────────┤
│  class Person { }      │  Bytecode, metadata → METASPACE        │
│  method bytecode       │  METASPACE                             │
└──────────────────────────────────────────────────────────────────┘
```

## Stack vs Heap — So sánh nhanh

| | Stack | Heap |
|---|---|---|
| **Lưu gì** | Local vars, method frames, primitives, references | Objects, Arrays |
| **Size** | Nhỏ (~512KB-1MB per thread) | Lớn (cả GB) |
| **Tốc độ** | Cực nhanh (LIFO pointer) | Chậm hơn (allocation + GC) |
| **Thread** | Riêng mỗi thread | Shared toàn JVM |
| **Quản lý** | Tự động (push/pop) | Garbage Collector |
| **Lỗi** | StackOverflowError | OutOfMemoryError |
| **Lifetime** | Method scope | Đến khi GC dọn |

## Toàn bộ flow khi `new Person("Khang", 21)`

```
1. ClassLoader check Person.class → load lên Metaspace nếu chưa có
       ↓
2. JVM tính kích thước object (header + fields)
       ↓
3. Allocate bytes trên Eden Space (Heap)
       ↓
4. Zero-initialize: name=null, age=0
       ↓
5. Gọi constructor Person("Khang", 21)
       → push Stack Frame cho constructor
       → assign: name = (ref đến "Khang" string), age = 21
       → pop Stack Frame
       ↓
6. Return địa chỉ object (ví dụ: 0xA200)
       ↓
7. Lưu 0xA200 vào biến p trên Stack Frame hiện tại
```

---

> 📖 JVM Spec: https://docs.oracle.com/javase/specs/jvms/se21/html/index.html
> 📖 GC Tuning: https://docs.oracle.com/en/java/se/21/gctuning/index.html
> 📖 Memory Management: https://www.oracle.com/technetwork/java/javase/memorymanagement-whitepaper-150215.pdf
