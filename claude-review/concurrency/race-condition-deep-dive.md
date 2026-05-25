# ⚡ Race Condition — Complete Deep Dive
>
> Threads, OS Scheduling, Memory Model, Synchronization, Deadlock, Java Concurrency

---

## 📚 Table of Contents

1. [Race Condition Fundamentals](#1-race-condition-fundamentals)
2. [OS & CPU — Hardware Level](#2-os--cpu--hardware-level)
3. [Memory Model & Visibility Problems](#3-memory-model--visibility-problems)
4. [Classic Race Condition Scenarios](#4-classic-race-condition-scenarios)
5. [Synchronization Primitives](#5-synchronization-primitives)
6. [Java Concurrency — Deep Dive](#6-java-concurrency--deep-dive)
7. [Lock-Free & Atomic Operations](#7-lock-free--atomic-operations)
8. [Deadlock, Livelock, Starvation](#8-deadlock-livelock-starvation)
9. [Concurrent Data Structures](#9-concurrent-data-structures)
10. [Thread Pool & Executor Framework](#10-thread-pool--executor-framework)
11. [Race Conditions in Distributed Systems](#11-race-conditions-in-distributed-systems)
12. [Detection & Testing](#12-detection--testing)

---

# 1. Race Condition Fundamentals

## 1.1 Định Nghĩa

```
RACE CONDITION:
  Kết quả của một chương trình phụ thuộc vào thứ tự/timing
  của các thread/process thực thi — kết quả khác nhau mỗi lần chạy
  
  "Who gets there first?" — whoever 'wins the race' determines outcome

FORMAL DEFINITION:
  Two or more threads access SHARED MUTABLE STATE
  AND at least one of them WRITES
  AND they execute CONCURRENTLY without proper synchronization
  → Undefined / incorrect behavior

VÍ DỤ CỰC ĐƠN GIẢN:
  counter = 0
  
  Thread 1: counter++    Thread 2: counter++
  
  Mong đợi: counter = 2
  Thực tế:  counter = 1 (nếu race!) hoặc 2 (may mắn)

TẠI SAO counter++ KHÔNG AN TOÀN:
  counter++ KHÔNG phải 1 instruction — nó là 3 steps:
  1. READ:   temp = counter (đọc từ memory vào register)
  2. ADD:    temp = temp + 1
  3. WRITE:  counter = temp (ghi từ register ra memory)
  
  Thread 1:           Thread 2:
  READ  temp1=0       
                      READ  temp2=0
  ADD   temp1=1
                      ADD   temp2=1
  WRITE counter=1
                      WRITE counter=1   ← ghi đè kết quả của Thread 1!
  
  Final: counter = 1 (not 2!) ← DATA RACE!

TERMINOLOGY:
  Critical Section:   đoạn code truy cập shared state
  Mutual Exclusion:   chỉ 1 thread trong critical section tại một thời điểm
  Atomic Operation:   operation không thể bị interrupt — xảy ra hoàn toàn hoặc không
  Data Race:          concurrent access to same data, at least one write, no sync
  Race Condition:     broader — any timing-dependent incorrect behavior
  
  Data Race ⊂ Race Condition (every data race is a race condition,
  but race conditions can exist without data races)
```

## 1.2 Tại Sao Race Conditions Khó Debug

```
1. NON-DETERMINISTIC:
   Có thể chạy đúng 999 lần, sai 1 lần
   Phụ thuộc vào: CPU scheduling, load, timing, hardware
   "Works on my machine" — khó reproduce!

2. HEISENBUG:
   Thêm logging/debugging → thay đổi timing → bug biến mất!
   Thread.sleep() để debug → bug không reproduce
   Observer effect: quan sát thay đổi behavior

3. INTERMITTENT:
   Tần suất rất thấp (1 lần trong 1 triệu requests)
   Chỉ xảy ra dưới heavy load
   Chỉ xảy ra trên production (khác dev environment)

4. SILENT CORRUPTION:
   Không crash — dữ liệu chỉ sai một chút
   account.balance = 99 thay vì 100
   Khó detect, hậu quả nghiêm trọng (financial, medical)

5. COMPILER & CPU REORDERING:
   CPU và compiler được phép reorder instructions
   What you write ≠ what actually executes
   Memory visibility: changes on CPU1 not visible to CPU2 immediately
```

---

# 2. OS & CPU — Hardware Level

## 2.1 Process vs Thread

```
PROCESS:
  - Isolated memory space (virtual address space)
  - Own file descriptors, heap, stack, code segment
  - Communication via IPC (pipes, sockets, shared memory)
  - Context switch: HEAVY (save/restore entire memory map)
  - Crash: doesn't affect other processes
  - Fork: copy-on-write memory

  Process Memory Layout:
  ┌──────────────────────────────────┐
  │  Code (text) segment  [READ ONLY]│
  ├──────────────────────────────────┤
  │  Initialized data segment        │ ← global vars
  ├──────────────────────────────────┤
  │  BSS (uninitialized data)        │ ← static vars = 0
  ├──────────────────────────────────┤
  │  Heap       ↓ grows down         │ ← malloc, new
  ├──────────────────────────────────┤
  │  (free space)                    │
  ├──────────────────────────────────┤
  │  Stack      ↑ grows up           │ ← local vars, call frames
  ├──────────────────────────────────┤
  │  Kernel space                    │
  └──────────────────────────────────┘

THREAD (lightweight process):
  - Shares memory space with other threads in same process
  - Own stack, program counter, registers
  - SHARED: heap, global variables, file descriptors, code
  - Communication: shared memory (fast, but dangerous!)
  - Context switch: LIGHT (save/restore registers + stack pointer)
  - Crash: can bring down entire process (unhandled exception)

THREAD MEMORY:
  Process memory: [Code][Heap      ][Thread1 Stack][Thread2 Stack][Thread3 Stack]
                              ↑ SHARED ↑                ↑ per-thread ↑

  Shared (dangerous zone):
    - Heap objects (created with new/malloc)
    - Static/class variables
    - Instance variables of shared objects
  
  Thread-local (safe):
    - Local variables (on stack)
    - Method parameters (on stack)
    - ThreadLocal<T> variables
```

## 2.2 CPU Scheduling

```
OS SCHEDULER: quyết định thread nào chạy trên CPU lúc nào

PREEMPTIVE SCHEDULING:
  OS CÓ THỂ dừng một thread BẤT KỲ LÚC NÀO và chạy thread khác
  Thread không cần "nhường" CPU
  Xảy ra: timer interrupt (every ~1ms = "quantum" or "time slice")
  
  Thread trạng thái:
  NEW → RUNNABLE → RUNNING → BLOCKED/WAITING → RUNNABLE → RUNNING → TERMINATED

CONTEXT SWITCH:
  OS dừng Thread A:
    1. Save CPU registers (PC, SP, general registers, flags) vào PCB
    2. Save memory state
    3. Load Thread B's PCB
    4. Restore Thread B's registers
  Thread B tiếp tục từ chỗ dừng
  
  VẤN ĐỀ: thread A có thể bị dừng BẤT KỲ INSTRUCTION NÀO!
  Ngay sau READ nhưng TRƯỚC WRITE → Data Race!

CỤ THỂ:
  Thread A đang thực hiện counter++:
  
  Instruction 1: MOV EAX, [counter]    ← READ (EAX = 0)
  
  *** CONTEXT SWITCH HERE! *** ← OS timer interrupt
  Thread B: counter++ completes fully (0 → 1)
  *** CONTEXT SWITCH BACK TO A ***
  
  Instruction 2: INC EAX               ← EAX = 1 (stale value!)
  Instruction 3: MOV [counter], EAX    ← WRITE counter = 1 (should be 2!)
  
  Lost update! Thread B's work was overwritten.

MULTI-CORE PARALLEL EXECUTION:
  Core 1: Thread A  ← running simultaneously
  Core 2: Thread B  ← running simultaneously
  
  BOTH literally execute AT THE SAME TIME
  Both read counter=0 simultaneously
  Both write counter=1 simultaneously
  → Race condition even without context switch!
  → Memory bus arbitration, cache coherence protocols
```

## 2.3 CPU Caches & Memory Hierarchy

```
MEMORY HIERARCHY (latency):
  Registers:    0.3 ns        ← fastest
  L1 Cache:     1 ns          (per-core, private)
  L2 Cache:     4 ns          (per-core or shared)
  L3 Cache:     30-40 ns      (shared across cores)
  RAM (DRAM):   100 ns
  SSD:          100,000 ns
  HDD:          10,000,000 ns ← slowest

PER-CORE CACHE PROBLEM:
  
  Core 1                Core 2
  L1 cache              L1 cache
  [counter = 0]         [counter = 0]  ← EACH CORE HAS ITS OWN COPY!
       │                      │
       └──────────────────────┘
                  RAM
             [counter = 0]

  Core 1 increments: L1[counter] = 1  (RAM not updated immediately!)
  Core 2 reads:      L1[counter] = 0  (stale! doesn't see Core 1's change!)
  
  CACHE COHERENCE PROTOCOLS (MESI):
  M = Modified  (this cache has the only valid copy, dirty)
  E = Exclusive (this cache has the only copy, clean)
  S = Shared    (multiple caches have this line, clean)
  I = Invalid   (this cache line is stale)
  
  When Core 1 writes: Core 2's cache line → I (Invalid)
  When Core 2 reads: cache miss → fetch from Core 1's cache or RAM
  This ensures COHERENCE but adds latency and doesn't prevent race conditions!

FALSE SHARING:
  Two variables on the SAME cache line but used by different threads
  Core 1 writes var1 → invalidates Core 2's cache line (contains var2)
  Core 2 writes var2 → invalidates Core 1's cache line (contains var1)
  Cache lines bounce between cores! Performance killer.
  
  Cache line = 64 bytes
  long[] arr = new long[2];  // arr[0] and arr[1] on SAME cache line!
  Thread1: arr[0]++  constantly
  Thread2: arr[1]++  constantly
  → False sharing! Both threads invalidate each other's cache
  
  Fix: padding!
  @Contended  // Java 8+ annotation
  long counter1;
  // or:
  long counter1, p1, p2, p3, p4, p5, p6, p7;  // 7 padding longs
  long counter2;  // on different cache line
```

## 2.4 CPU Instruction Reordering

```
CPUs và compilers được phép REORDER instructions để optimize
Miễn là kết quả trong SINGLE THREAD không thay đổi
Nhưng reordering có thể phá vỡ multi-thread correctness!

COMPILER REORDERING:
  // Written:
  x = 1;
  ready = true;
  
  // Compiler may reorder:
  ready = true;    ← đảo thứ tự! (compiler thinks: no dependency between x and ready)
  x = 1;

CPU REORDERING (Out-of-Order Execution):
  // Thread 1:          // Thread 2:
  x = 1;                while (!ready);
  ready = true;         assert(x == 1);  ← may FAIL!
  
  CPU 1 may execute:
  ready = true;  (store to cache)
  x = 1;         (executed later)
  
  Thread 2 sees ready=true but x=0!

STORE BUFFERS:
  CPU has write (store) buffer: writes go to buffer first, flushed to cache later
  Other CPUs can't see writes in store buffer!
  
  CPU1: x=1 → store buffer → cache → RAM (delayed!)
  CPU2: read x → 0 (reads from cache, not CPU1's store buffer)

MEMORY BARRIERS (Fences):
  Hardware instruction that flushes/orders memory operations
  mfence (x86): full memory barrier
  sfence: store fence
  lfence: load fence
  
  Java volatile → compiler emits memory barriers around read/write
  Java synchronized → memory barriers on lock acquire/release
  Java AtomicInteger → uses CAS with barriers

HAPPENS-BEFORE RELATIONSHIP:
  If operation A happens-before B:
    A's effects are visible to B
    A appears to execute before B
  
  Java Memory Model (JMM) defines happens-before:
  1. Program order: in same thread, A before B in code → A hb B
  2. Monitor lock: unlock(m) hb → lock(m)
  3. volatile write: write(v) hb → read(v) of same variable
  4. Thread start: Thread.start() hb → every action in that thread
  5. Thread join: every action in thread hb → Thread.join() returns
  6. Transitivity: A hb B, B hb C → A hb C
```

---

# 3. Memory Model & Visibility Problems

## 3.1 Java Memory Model (JMM)

```java
// VISIBILITY PROBLEM không có synchronization:
class BrokenStopFlag {
    private boolean stop = false;  // NOT volatile!
    
    public void runWorker() {
        new Thread(() -> {
            while (!stop) {   // Thread 1 may cache 'stop' in register!
                doWork();     // Never sees stop=true → infinite loop!
            }
        }).start();
    }
    
    public void stop() {
        stop = true;  // Thread 2 writes, Thread 1 never sees it!
    }
}

// WHY:
// Thread 1's CPU caches 'stop=false' in its L1 cache / register
// Thread 2 writes 'stop=true' to its own L1 cache
// Without volatile: NO guarantee Thread 1 ever sees the new value!
// JVM/JIT may even hoist the read OUT of the loop entirely:
// if (!stop) { while(true) { doWork(); } }  ← JIT optimization!

// FIX: volatile
class CorrectStopFlag {
    private volatile boolean stop = false;  // volatile!
    // volatile guarantees:
    // 1. Every write is immediately visible to all threads
    // 2. No reordering of volatile reads/writes
    // 3. Reading a volatile variable always reads from main memory
}

// ── VOLATILE GUARANTEES ──
// Write to volatile: 
//   1. Flush all pending writes to main memory
//   2. Other threads immediately see the write
//
// Read from volatile:
//   1. Invalidate local cache for this variable
//   2. Read fresh value from main memory

// DOUBLE-CHECKED LOCKING BUG (classic):
class BrokenSingleton {
    private static BrokenSingleton instance;  // NOT volatile!
    
    public static BrokenSingleton getInstance() {
        if (instance == null) {                    // check 1 (no lock)
            synchronized (BrokenSingleton.class) {
                if (instance == null) {             // check 2 (with lock)
                    instance = new BrokenSingleton();
                }
            }
        }
        return instance;
    }
    // BUG: "instance = new BrokenSingleton()" is NOT atomic!
    // It's 3 steps:
    //   1. allocate memory
    //   2. construct object (init fields)
    //   3. assign reference to instance
    // CPU can reorder steps 2 and 3:
    //   1. allocate memory
    //   3. assign reference (now instance != null, but object not initialized!)
    //   2. construct object
    // Another thread reads instance != null → gets PARTIALLY CONSTRUCTED object!
}

// CORRECT double-checked locking:
class CorrectSingleton {
    private static volatile CorrectSingleton instance;  // volatile!
    // volatile prevents reordering: object fully constructed BEFORE reference published
    
    public static CorrectSingleton getInstance() {
        if (instance == null) {
            synchronized (CorrectSingleton.class) {
                if (instance == null) {
                    instance = new CorrectSingleton();  // safe with volatile
                }
            }
        }
        return instance;
    }
}

// BEST: Initialization-on-demand (no sync, no volatile, guaranteed lazy):
class IdealSingleton {
    private static class Holder {
        static final IdealSingleton INSTANCE = new IdealSingleton();
    }
    public static IdealSingleton getInstance() { return Holder.INSTANCE; }
    // JVM guarantees class initialization is atomic and thread-safe!
}
```

## 3.2 Visibility, Atomicity, Ordering

```java
// 3 PROPERTIES cần đảm bảo cho thread safety:

// 1. VISIBILITY — changes by one thread visible to other threads
//    Problem: caching in CPU registers, L1/L2 cache
//    Fix: volatile, synchronized, Atomic classes

// 2. ATOMICITY — operation completes fully or not at all
//    Problem: check-then-act, read-modify-write
//    Fix: synchronized, Atomic classes, locks

// 3. ORDERING — operations appear to execute in expected order
//    Problem: compiler/CPU reordering
//    Fix: volatile (prevents reordering), synchronized, happens-before

// Cần tất cả 3:
class Counter {
    private volatile int count = 0;  // visibility ✅, ordering ✅
    
    public void increment() {
        count++;  // STILL NOT THREAD-SAFE!
        // count++ = read + modify + write = NOT ATOMIC!
        // volatile only ensures visibility, NOT atomicity!
    }
}

// Thread 1: read(0), volatile read ← Thread 2 also reads 0 concurrently
// Thread 1: add 1 → 1
// Thread 2: add 1 → 1  
// Thread 1: write 1 (visible to all immediately)
// Thread 2: write 1 (overwrites! should be 2)
// volatile doesn't prevent this race!

// FIX: AtomicInteger (all 3 guarantees):
class AtomicCounter {
    private final AtomicInteger count = new AtomicInteger(0);
    public void increment() { count.incrementAndGet(); }  // atomic!
    public int get() { return count.get(); }
}
```

---

# 4. Classic Race Condition Scenarios

## 4.1 Check-Then-Act

```java
// CHECK-THEN-ACT: check condition, then act based on it
// RACE: condition may change between check and act!

// ── SINGLETON CHECK ──
// (shown above — double-checked locking)

// ── FILE CREATE ──
// BAD: check then create (two operations, not atomic)
if (!file.exists()) {         // check
    file.createNewFile();     // act — another process may have created file already!
}

// ── NULL CHECK ──
if (map.containsKey(key)) {   // check
    map.get(key).process();   // act — key may have been removed!
}

// ── BANK ACCOUNT ──
class BrokenBankAccount {
    private double balance;
    
    public boolean withdraw(double amount) {
        if (balance >= amount) {       // CHECK (Thread A: balance=100, amount=80 → OK)
                                       // *** CONTEXT SWITCH → Thread B: withdraw 80 succeeds, balance=20 ***
            balance -= amount;         // ACT  (Thread A: 20 - 80 = -60! OVERDRAFT!)
            return true;
        }
        return false;
    }
}

// FIX: make check-and-act atomic with synchronization:
class CorrectBankAccount {
    private double balance;
    private final Object lock = new Object();
    
    public boolean withdraw(double amount) {
        synchronized (lock) {
            if (balance >= amount) {   // check + act ATOMIC
                balance -= amount;
                return true;
            }
            return false;
        }
    }
}

// ── CACHE GET-OR-LOAD ──
class BrokenCache {
    private final Map<String, Value> cache = new HashMap<>();
    
    public Value get(String key) {
        if (!cache.containsKey(key)) {         // check
            Value value = expensiveLoad(key);  // load (may be called multiple times!)
            cache.put(key, value);             // act
        }
        return cache.get(key);
    }
    // Multiple threads: all see cache miss → all call expensiveLoad → all put → race!
}

// FIX: use ConcurrentHashMap.computeIfAbsent (atomic):
class CorrectCache {
    private final ConcurrentHashMap<String, Value> cache = new ConcurrentHashMap<>();
    
    public Value get(String key) {
        return cache.computeIfAbsent(key, this::expensiveLoad);
        // computeIfAbsent is atomic per key!
        // expensiveLoad called AT MOST ONCE per key (for same key, only 1 call proceeds)
    }
}
```

## 4.2 Read-Modify-Write

```java
// READ-MODIFY-WRITE: read value, compute new value, write back
// Race: another thread modifies value between read and write

// ── COUNTER (classic) ──
class BrokenCounter {
    int count = 0;
    void increment() { count++; }  // read + add + write = NOT ATOMIC
}

// ── LAZY INITIALIZATION ──
class BrokenLazy {
    private ExpensiveObject obj;
    
    public ExpensiveObject get() {
        if (obj == null) {                    // read
            obj = new ExpensiveObject();      // create + write
        }
        return obj;  // multiple threads may create multiple objects!
    }
}

// ── LIST APPEND ──
class BrokenList {
    private List<Item> items = new ArrayList<>();
    
    public void add(Item item) {
        List<Item> newList = new ArrayList<>(items);  // read
        newList.add(item);                             // modify
        items = newList;                               // write
        // Race: two threads both read same list, both create copy + add, one's add is lost!
    }
}

// FIX: use AtomicReference + CAS loop:
class CorrectList {
    private final AtomicReference<List<Item>> items =
        new AtomicReference<>(new ArrayList<>());
    
    public void add(Item item) {
        List<Item> current, updated;
        do {
            current = items.get();
            updated = new ArrayList<>(current);
            updated.add(item);
        } while (!items.compareAndSet(current, updated));
        // CAS: only update if still equals current (optimistic locking)
    }
}

// ── STATISTICS UPDATE ──
class BrokenStats {
    private long count = 0;
    private double sum = 0;
    
    public void record(double value) {
        count++;    // race!
        sum += value;  // race!
        // count and sum may be inconsistent with each other!
    }
    
    public double average() {
        return sum / count;  // race! sum and count from different points in time!
    }
}
```

## 4.3 Time-of-Check to Time-of-Use (TOCTOU)

```java
// TOCTOU: security vulnerability class
// Check security/condition at time T1, use at time T2
// State may change between T1 and T2

// FILESYSTEM TOCTOU:
// Bad: check if file is safe, then open it
boolean isSafe = checkFile(path);     // TOCTOU check
if (isSafe) {
    FileInputStream fis = new FileInputStream(path);  // TOCTOU use
    // RACE: attacker replaces file between check and open!
    // Symlink attack: file was safe at check time, now points to /etc/passwd
}

// Database TOCTOU:
// BAD:
int stock = db.getStock(productId);   // check
if (stock > 0) {                       // verify
    db.placeOrder(productId);          // use — stock may have gone to 0!
}

// FIX: atomic operation or pessimistic locking:
// SQL atomic:
// UPDATE products SET stock = stock - 1 
// WHERE id = ? AND stock > 0
// → returns affected rows: 0 = out of stock, 1 = success

// ── AUTHENTICATION TOCTOU ──
// Permission check at request time, use later:
if (hasPermission(user, "ADMIN")) {  // check
    // user's permission REVOKED here by another admin
    adminOperation();                 // use — user no longer has permission!
}
// Fix: re-check permission at point of sensitive operation
// Or: token contains all permissions at issuance time (JWT)
```

## 4.4 ABA Problem

```java
// ABA PROBLEM — specific to lock-free CAS operations
// Value: A → B → A (back to A)
// CAS sees A == A, thinks "nothing changed", proceeds
// But something DID change in between!

// EXAMPLE: lock-free stack
class LockFreeStack<T> {
    AtomicReference<Node<T>> top = new AtomicReference<>();
    
    public void push(T value) {
        Node<T> node = new Node<>(value);
        do {
            node.next = top.get();
        } while (!top.compareAndSet(node.next, node));
    }
    
    public T pop() {
        Node<T> node, next;
        do {
            node = top.get();
            if (node == null) return null;
            next = node.next;
        } while (!top.compareAndSet(node, next));
        // ABA PROBLEM HERE:
        // Thread 1: reads top=A(10), next=B
        // PAUSE...
        // Thread 2: pop A(10) → top=B
        // Thread 2: pop B    → top=null
        // Thread 2: push A(20) → top=A (new A object, same address in some allocators!)
        // Thread 1 resumes: CAS(A, B) succeeds! (A == A in reference)
        // But top is now B, which was already popped and may be garbage!
        return node.value;
    }
}

// FIX: use version stamp (stamped reference)
AtomicStampedReference<Node<T>> top = new AtomicStampedReference<>(null, 0);

// CAS with version:
int[] stampHolder = new int[1];
Node<T> node = top.get(stampHolder);
int stamp = stampHolder[0];
top.compareAndSet(node, next, stamp, stamp + 1);
// Even if value is A again, stamp is different → CAS fails!

// Java: AtomicStampedReference<V>
// Java: AtomicMarkableReference<V> (single boolean mark)
```

---

# 5. Synchronization Primitives

## 5.1 Mutex (Mutual Exclusion Lock)

```java
// MUTEX: binary lock — locked or unlocked
// Only ONE thread can hold the lock at a time
// Other threads BLOCK until lock is released

// ── SYNCHRONIZED KEYWORD (Java built-in) ──

// Method lock (this object as monitor):
public synchronized void increment() {
    count++;
}
// Equivalent to:
public void increment() {
    synchronized (this) {
        count++;
    }
}

// Class-level lock (for static methods):
public static synchronized void staticIncrement() {
    staticCount++;
}
// Equivalent to:
public static void staticIncrement() {
    synchronized (SomeClass.class) {
        staticCount++;
    }
}

// Object as lock (preferred — more control):
class BankAccount {
    private final Object lock = new Object();
    private double balance;
    
    public void deposit(double amount) {
        synchronized (lock) {
            balance += amount;
        }
    }
    
    public void withdraw(double amount) {
        synchronized (lock) {
            if (balance >= amount) balance -= amount;
        }
    }
    
    // TRANSFER: needs BOTH accounts' locks
    // BAD: potential deadlock!
    public void transferBad(BankAccount other, double amount) {
        synchronized (this.lock) {
            synchronized (other.lock) {  // potential deadlock if other does same in reverse!
                this.balance -= amount;
                other.balance += amount;
            }
        }
    }
    
    // GOOD: consistent lock ordering
    public static void transfer(BankAccount from, BankAccount to, double amount) {
        BankAccount first  = from.id < to.id ? from : to;
        BankAccount second = from.id < to.id ? to   : from;
        synchronized (first.lock) {
            synchronized (second.lock) {
                from.balance -= amount;
                to.balance   += amount;
            }
        }
    }
}

// SYNCHRONIZED INTERNALS:
// Java synchronized uses MONITOR (intrinsic lock / object monitor)
// Every Java object has a hidden monitor
// Monitor has: owner thread, entry count, wait set
// 
// Entering synchronized block:
//   1. Check if monitor is free → lock it, enter
//   2. Monitor already owned by SAME thread → reentrant, increment entry count
//   3. Monitor owned by OTHER thread → BLOCK in entry set
//
// Exiting synchronized block:
//   1. Decrement entry count
//   2. If count = 0 → release monitor, notify waiting threads
//
// JVM opcodes: monitorenter / monitorexit
```

## 5.2 ReentrantLock

```java
import java.util.concurrent.locks.*;

// ReentrantLock: more control than synchronized
class BankAccount {
    private final ReentrantLock lock = new ReentrantLock(true); // fair=true: FIFO order
    private double balance;
    
    // ── BASIC LOCK ──
    public void deposit(double amount) {
        lock.lock();          // blocks until acquired
        try {
            balance += amount;
        } finally {
            lock.unlock();    // ALWAYS in finally!
        }
    }
    
    // ── TRY LOCK (non-blocking) ──
    public boolean tryDeposit(double amount) {
        if (lock.tryLock()) {  // returns false immediately if locked
            try {
                balance += amount;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false;  // didn't acquire lock
    }
    
    // ── TRY LOCK WITH TIMEOUT ──
    public boolean tryDepositWithTimeout(double amount, long timeout, TimeUnit unit) 
            throws InterruptedException {
        if (lock.tryLock(timeout, unit)) {  // wait up to timeout
            try {
                balance += amount;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false;
    }
    
    // ── INTERRUPTIBLE LOCK ──
    public void interruptibleDeposit(double amount) throws InterruptedException {
        lock.lockInterruptibly();  // can be interrupted while waiting!
        try {
            balance += amount;
        } finally {
            lock.unlock();
        }
    }
    
    // ── LOCK DIAGNOSTICS ──
    public int getWaitingThreadCount() { return lock.getQueueLength(); }
    public boolean isLocked()          { return lock.isLocked(); }
    public boolean isHeldByCurrentThread() { return lock.isHeldByCurrentThread(); }
    public int getHoldCount()          { return lock.getHoldCount(); }  // reentrant count
}

// REENTRANT EXAMPLE:
class Node {
    private final ReentrantLock lock = new ReentrantLock();
    
    public void method1() {
        lock.lock();
        try {
            method2();   // SAME thread calls method2 which also locks → REENTRANT, OK!
        } finally {
            lock.unlock();
        }
    }
    
    public void method2() {
        lock.lock();      // same thread → entry count 2, doesn't block!
        try {
            // do work
        } finally {
            lock.unlock(); // entry count back to 1
        }
    }
}
```

## 5.3 ReadWriteLock

```java
// READ-WRITE LOCK: multiple readers OR one writer (not both)
// Readers don't block each other!
// Writer blocks all readers and other writers
// Use: read-heavy workloads

class UserCache {
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock  = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    private final Map<Long, User> cache = new HashMap<>();
    
    // MULTIPLE threads can read simultaneously:
    public User get(Long id) {
        readLock.lock();      // acquire read lock (multiple threads OK)
        try {
            return cache.get(id);
        } finally {
            readLock.unlock();
        }
    }
    
    // EXCLUSIVE write:
    public void put(Long id, User user) {
        writeLock.lock();     // acquire write lock (exclusive)
        try {
            cache.put(id, user);
        } finally {
            writeLock.unlock();
        }
    }
    
    // LOCK UPGRADE (read → write): NOT directly supported in Java!
    // Must release read lock, acquire write lock (gap exists!)
    // Use StampedLock for upgrade capability
}

// STAMPEDLOCK (Java 8+) — faster, supports optimistic reads:
class OptimisticCache {
    private final StampedLock sl = new StampedLock();
    private double x, y;
    
    // OPTIMISTIC READ (no lock acquisition!)
    public double distanceFromOrigin() {
        long stamp = sl.tryOptimisticRead();  // NO lock acquired!
        double currentX = x, currentY = y;   // read (may be stale)
        if (!sl.validate(stamp)) {            // check if a write happened
            // Write happened! Fall back to read lock:
            stamp = sl.readLock();
            try {
                currentX = x;
                currentY = y;
            } finally {
                sl.unlockRead(stamp);
            }
        }
        return Math.sqrt(currentX * currentX + currentY * currentY);
    }
    
    // WRITE:
    public void move(double deltaX, double deltaY) {
        long stamp = sl.writeLock();
        try {
            x += deltaX;
            y += deltaY;
        } finally {
            sl.unlockWrite(stamp);
        }
    }
    
    // UPGRADE: read → write (atomic if no other writer)
    public void conditionalWrite() {
        long stamp = sl.readLock();
        try {
            while (x < 0) {
                long ws = sl.tryConvertToWriteLock(stamp);  // try upgrade
                if (ws != 0L) {
                    stamp = ws;   // upgraded!
                    x = -x;
                    break;
                } else {
                    sl.unlockRead(stamp);      // release read
                    stamp = sl.writeLock();    // acquire write
                }
            }
        } finally {
            sl.unlock(stamp);
        }
    }
}
```

## 5.4 Semaphore

```java
// SEMAPHORE: generalized mutex — allows N concurrent accesses
// Binary semaphore (N=1) = mutex
// Use: limit concurrent access to resource

// ── RESOURCE POOL ──
class ConnectionPool {
    private final Semaphore semaphore;
    private final Queue<Connection> pool;
    
    ConnectionPool(int poolSize) {
        semaphore = new Semaphore(poolSize, true);  // fair=true
        pool = new ArrayDeque<>();
        for (int i = 0; i < poolSize; i++) {
            pool.offer(createConnection());
        }
    }
    
    public Connection acquire() throws InterruptedException {
        semaphore.acquire();      // blocks if count=0 (all connections busy)
        return pool.poll();       // get connection from pool
        // semaphore permits = available connections
    }
    
    public Connection acquire(long timeout, TimeUnit unit) throws InterruptedException {
        if (!semaphore.tryAcquire(timeout, unit)) {
            throw new TimeoutException("Connection pool exhausted");
        }
        return pool.poll();
    }
    
    public void release(Connection conn) {
        pool.offer(conn);
        semaphore.release();      // increment count, wake waiting thread
    }
}

// ── RATE LIMITING ──
class RateLimiter {
    private final Semaphore semaphore;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    RateLimiter(int requestsPerSecond) {
        semaphore = new Semaphore(requestsPerSecond);
        
        // Refill semaphore every second:
        scheduler.scheduleAtFixedRate(() -> {
            int toRelease = requestsPerSecond - semaphore.availablePermits();
            if (toRelease > 0) semaphore.release(toRelease);
        }, 1, 1, TimeUnit.SECONDS);
    }
    
    public boolean tryAcquire() { return semaphore.tryAcquire(); }
}
```

## 5.5 Condition Variables

```java
// CONDITION VARIABLE: wait for a specific condition
// Must hold lock while waiting, lock released during wait
// Notified when condition may have changed

class BoundedBuffer<T> {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull  = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();
    private final Object[] items;
    private int putPtr, takePtr, count;
    
    BoundedBuffer(int capacity) { items = new Object[capacity]; }
    
    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (count == items.length) {
                notFull.await();      // WAIT: release lock, wait for notFull signal
                                      // When signaled: re-acquire lock, re-check condition
            }
            items[putPtr] = item;
            if (++putPtr == items.length) putPtr = 0;
            count++;
            notEmpty.signal();         // NOTIFY one waiter that item is available
        } finally {
            lock.unlock();
        }
    }
    
    @SuppressWarnings("unchecked")
    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (count == 0) {
                notEmpty.await();      // WAIT: release lock, wait for item
            }
            T item = (T) items[takePtr];
            items[takePtr] = null;
            if (++takePtr == items.length) takePtr = 0;
            count--;
            notFull.signal();          // NOTIFY producer: space available
            return item;
        } finally {
            lock.unlock();
        }
    }
}

// WAIT PATTERN — always use WHILE (not if!):
// while (condition not met) { condition.await(); }
// WHY while: spurious wakeups! Thread can wake without signal.
// Also: multiple threads waiting, multiple notify → re-check after waking.

// Object.wait() / notify() (older, lower-level):
class Monitor {
    private boolean ready = false;
    
    public synchronized void waitForReady() throws InterruptedException {
        while (!ready) {    // WHILE, not if!
            wait();         // releases lock, waits for notify
        }
    }
    
    public synchronized void setReady() {
        ready = true;
        notifyAll();        // notifyAll safer than notify (wake ALL waiters)
        // notify: wakes ONE random waiter (may wake wrong one!)
        // notifyAll: wakes ALL waiters, they re-check condition
    }
}
```

---

# 6. Java Concurrency — Deep Dive

## 6.1 volatile — Chi Tiết

```java
// VOLATILE GUARANTEES:
// 1. Visibility: write to volatile immediately visible to all threads
// 2. No caching: always read from / write to main memory
// 3. Ordering: prevents reordering of volatile reads/writes with adjacent non-volatile ops
// 4. Happens-before: write to volatile HB → subsequent read of same volatile

// USE CASES cho volatile:
// 1. Simple flags (one thread writes, others read):
volatile boolean running = true;
volatile boolean initialized = false;

// 2. "effectively immutable" lazy init (single write, many reads):
volatile Config config;  // set once, read many times

// 3. Status update (last write wins):
volatile String status = "STARTING";

// NOT SUFFICIENT when:
// - Multiple threads write (need atomic operations)
// - Check-then-act (need synchronization)
// - Multiple variables must be consistent with each other

// VOLATILE WRITE MEMORY BARRIER:
// Before write: all previous writes flushed to main memory
// After write: subsequent reads get fresh values
// SFENCE (store fence) on x86

// VOLATILE READ MEMORY BARRIER:
// After read: all subsequent reads get fresh values
// LFENCE (load fence) on x86

// EXAMPLE: publication of immutable object (safe without synchronization):
class ImmutableHolder {
    private volatile Object shared;  // volatile reference
    
    public void publish(Object obj) {
        // obj is fully constructed before this line (visibility guarantee)
        this.shared = obj;  // volatile write: all fields of obj visible after this
    }
    
    public Object read() {
        return shared;  // volatile read: sees fully constructed obj
    }
}
```

## 6.2 java.util.concurrent — Tổng Quan

```java
// JAVA CONCURRENCY TOOLKIT:

// ── SYNCHRONIZERS ──
CountDownLatch latch = new CountDownLatch(3);  // wait for N events
CyclicBarrier  barrier = new CyclicBarrier(5); // all parties must arrive
Phaser         phaser = new Phaser(5);         // flexible multi-phase barrier
Exchanger<String> exchanger = new Exchanger<>(); // two threads exchange objects
Semaphore      semaphore = new Semaphore(10);   // N concurrent accesses

// CountDownLatch — wait for services to start:
CountDownLatch ready = new CountDownLatch(3);  // 3 services to start
// Service 1, 2, 3: ready.countDown() when started
// Main thread: ready.await() — waits until count reaches 0

// CyclicBarrier — parallel computation, wait at checkpoint:
CyclicBarrier barrier = new CyclicBarrier(4, () -> {
    System.out.println("All 4 threads reached barrier, merging results...");
});
// Each of 4 threads: compute partial result, then barrier.await()
// All 4 must arrive before any continues
// Cyclic: can be reused after all parties arrive

// ── BLOCKING QUEUES ──
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(1000);
// put(): blocks if full
// take(): blocks if empty
// offer(e, timeout, unit): timed put
// poll(timeout, unit): timed take

// Producer-Consumer pattern:
// Producer:
queue.put(task);  // blocks until space available
// Consumer:
Task task = queue.take();  // blocks until item available

// Types:
LinkedBlockingQueue<T>      // optionally bounded, linked nodes
ArrayBlockingQueue<T>       // bounded, array-backed, fair option
PriorityBlockingQueue<T>    // unbounded priority queue
DelayQueue<T>               // elements only available after delay
SynchronousQueue<T>         // no capacity! rendezvous between threads
LinkedTransferQueue<T>      // unbounded, can transfer directly

// ── FUTURE & COMPLETABLE FUTURE ──
ExecutorService executor = Executors.newFixedThreadPool(4);

// Future: submit task, get result later
Future<String> future = executor.submit(() -> {
    Thread.sleep(1000);
    return "result";
});
// ... do other work ...
String result = future.get(5, TimeUnit.SECONDS);  // blocks until done or timeout
future.cancel(true);  // cancel (may interrupt)
boolean done = future.isDone();

// CompletableFuture: async pipelines
CompletableFuture<User> userFuture = CompletableFuture
    .supplyAsync(() -> userService.findById(userId))  // run async
    .thenApply(user -> enrichUser(user))               // transform result
    .thenCompose(user ->                               // chain another async
        CompletableFuture.supplyAsync(() -> addPermissions(user)))
    .thenCombine(                                      // combine two futures
        CompletableFuture.supplyAsync(() -> fetchPreferences(userId)),
        (user, prefs) -> mergeUserWithPrefs(user, prefs))
    .exceptionally(ex -> User.defaultUser())           // handle error
    .whenComplete((result, error) -> cleanup());        // always runs

// Parallel execution:
CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> fetchFromDB());
CompletableFuture<String> f2 = CompletableFuture.supplyAsync(() -> fetchFromCache());
CompletableFuture<String> f3 = CompletableFuture.supplyAsync(() -> fetchFromAPI());

CompletableFuture.allOf(f1, f2, f3).join();  // wait for ALL
String fastest = CompletableFuture.anyOf(f1, f2, f3).get().toString(); // first to finish
```

## 6.3 ThreadLocal

```java
// THREADLOCAL: each thread has its own copy of the variable
// Perfect for thread-unsafe objects used independently per thread

// ── REQUEST CONTEXT ──
public class RequestContextHolder {
    
    private static final ThreadLocal<RequestContext> contextHolder =
        new ThreadLocal<>();  // each thread → own RequestContext
    
    // Or with initial value:
    private static final ThreadLocal<SimpleDateFormat> dateFormat =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
    // SimpleDateFormat is NOT thread-safe! ThreadLocal makes it safe.
    
    public static void setContext(RequestContext ctx) {
        contextHolder.set(ctx);
    }
    
    public static RequestContext getContext() {
        return contextHolder.get();
    }
    
    public static void clear() {
        contextHolder.remove();  // CRITICAL! Prevent memory leaks in thread pools!
    }
}

// HTTP FILTER: set/clear per request:
@Component
public class RequestContextFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        try {
            RequestContextHolder.setContext(new RequestContext(
                ((HttpServletRequest)req).getHeader("X-Request-Id")));
            chain.doFilter(req, res);
        } finally {
            RequestContextHolder.clear();  // ALWAYS clear! Thread returned to pool.
        }
    }
}

// ── DATABASE CONNECTIONS ──
// Hibernate/Spring uses ThreadLocal for database sessions!
// @Transactional: binds Connection to current thread via ThreadLocal

// ── RANDOM NUMBER GENERATOR ──
// Random is thread-safe but contended
// ThreadLocalRandom: per-thread, no contention
int random = ThreadLocalRandom.current().nextInt(100);

// ── MEMORY LEAK WARNING ──
// Thread pools reuse threads!
// ThreadLocal not cleared → OLD REQUEST's data leaks into NEW REQUEST!
// ALWAYS clear ThreadLocal in finally block after use!

// InheritableThreadLocal: child threads inherit parent's values
InheritableThreadLocal<String> inherit = new InheritableThreadLocal<>();
inherit.set("parent-value");
new Thread(() -> {
    System.out.println(inherit.get());  // "parent-value" (inherited!)
}).start();
```

---

# 7. Lock-Free & Atomic Operations

## 7.1 Compare-And-Swap (CAS)

```java
// CAS: atomic instruction supported by hardware
// compareAndSwap(address, expected, new):
//   if (*address == expected): *address = new, return true
//   else: return false (someone changed it)
// Atomic — cannot be interrupted!

// x86: CMPXCHG instruction
// ARM: LDREX/STREX
// Java: Unsafe.compareAndSwapInt() → JVM intrinsic → hardware instruction

// ── ATOMIC INTEGER ──
AtomicInteger counter = new AtomicInteger(0);

counter.incrementAndGet();          // ++counter, atomic
counter.getAndIncrement();          // counter++, atomic  
counter.addAndGet(5);               // counter += 5, atomic
counter.compareAndSet(10, 20);      // if counter==10, set to 20

// IMPLEMENT CUSTOM ATOMIC OPERATION:
public static int getAndUpdate(AtomicInteger ai, IntUnaryOperator updateFn) {
    int current, next;
    do {
        current = ai.get();
        next = updateFn.applyAsInt(current);
    } while (!ai.compareAndSet(current, next));  // retry if CAS fails
    return current;
}
// This is essentially what AtomicInteger.updateAndGet() does internally

// CAS LOOP (optimistic locking):
// Read current value
// Compute new value
// CAS: if still current, update; else retry
// No blocking! Threads don't wait — they retry.
// Good for LOW CONTENTION (retry rarely needed)
// Bad for HIGH CONTENTION (many retries → CPU waste = "spinning")

// AtomicReference:
AtomicReference<Config> configRef = new AtomicReference<>(initialConfig);

public void updateConfig(Config newConfig) {
    Config current;
    do {
        current = configRef.get();
        // maybe validate: newConfig is compatible with current
    } while (!configRef.compareAndSet(current, newConfig));
}

// AtomicLong, AtomicBoolean, AtomicIntegerArray, AtomicReferenceArray...
```

## 7.2 LongAdder — High Contention Counter

```java
// AtomicLong: single memory location → contention under many threads
// LongAdder: multiple counters, sum when needed → less contention!

// AtomicLong — HIGH CONTENTION:
AtomicLong counter = new AtomicLong();
// 100 threads all doing counter.incrementAndGet()
// → all CAS on same memory location → many retries → slow!

// LongAdder — DESIGNED for high contention:
LongAdder counter = new LongAdder();
// Internal: array of cells, each thread has "own" cell
// Each thread increments its cell (low contention!)
// sum() = adds all cells
counter.increment();
counter.add(5);
long total = counter.sum();  // final aggregation
counter.reset();             // reset to 0

// LongAdder vs AtomicLong:
// Single thread:         AtomicLong similar to LongAdder
// Low contention:        AtomicLong similar to LongAdder
// High contention:       LongAdder MUCH faster
// Need current value constantly: AtomicLong better (sum() has overhead)

// LongAccumulator: generalization of LongAdder
LongAccumulator max = new LongAccumulator(Long::max, Long.MIN_VALUE);
max.accumulate(42);
max.accumulate(17);
max.accumulate(99);
max.get();  // 99 (running maximum)

// DoubleAdder, DoubleAccumulator: same for doubles
```

---

# 8. Deadlock, Livelock, Starvation

## 8.1 Deadlock — Chi Tiết

```
DEADLOCK: 4 COFFMAN CONDITIONS (tất cả phải thỏa đồng thời):
  1. MUTUAL EXCLUSION: tài nguyên không thể share (must be held exclusively)
  2. HOLD AND WAIT: thread giữ 1 lock và đợi lock thứ 2
  3. NO PREEMPTION: lock không thể bị lấy mạnh, chỉ release tự nguyện
  4. CIRCULAR WAIT: T1 → Lock1 → T2 → Lock2 → T1 (circular dependency)

CLASSIC DEADLOCK:
  Thread 1:                Thread 2:
  lock(A)                  lock(B)
  lock(B)  ← waiting       lock(A)  ← waiting
                           
  Thread 1 holds A, waits for B
  Thread 2 holds B, waits for A
  NEITHER can proceed → DEADLOCK!
```

```java
// DEADLOCK EXAMPLE:
class DeadlockExample {
    private final Object lockA = new Object();
    private final Object lockB = new Object();
    
    void method1() {
        synchronized (lockA) {
            System.out.println("Thread 1: holding lockA, waiting for lockB");
            try { Thread.sleep(100); } catch (InterruptedException e) {}
            synchronized (lockB) {  // WAITS FOREVER!
                System.out.println("Thread 1: holding both locks");
            }
        }
    }
    
    void method2() {
        synchronized (lockB) {
            System.out.println("Thread 2: holding lockB, waiting for lockA");
            synchronized (lockA) {  // WAITS FOREVER!
                System.out.println("Thread 2: holding both locks");
            }
        }
    }
    
    public static void main(String[] args) {
        DeadlockExample de = new DeadlockExample();
        new Thread(de::method1).start();
        new Thread(de::method2).start();
        // DEADLOCK!
    }
}

// ── DEADLOCK PREVENTION ──

// 1. LOCK ORDERING (break circular wait):
// Always acquire locks in the SAME ORDER
class NoDeadlock {
    private final Object lockA = new Object();
    private final Object lockB = new Object();
    // RULE: always lock A before B
    
    void method1() {
        synchronized (lockA) {
            synchronized (lockB) { /* work */ }
        }
    }
    
    void method2() {
        synchronized (lockA) {  // SAME ORDER: A then B
            synchronized (lockB) { /* work */ }
        }
    }
}

// For dynamic ordering (e.g., bank accounts with unknown order):
static void transfer(Account a, Account b, BigDecimal amount) {
    Account first  = a.id < b.id ? a : b;  // always lower ID first
    Account second = a.id < b.id ? b : a;
    synchronized (first) {
        synchronized (second) {
            first.debit(amount);
            second.credit(amount);
        }
    }
}

// 2. TRYLOCK WITH TIMEOUT (break hold and wait):
boolean transferred = false;
while (!transferred) {
    if (lockA.tryLock(100, TimeUnit.MILLISECONDS)) {
        try {
            if (lockB.tryLock(100, TimeUnit.MILLISECONDS)) {
                try {
                    performTransfer();
                    transferred = true;
                } finally {
                    lockB.unlock();
                }
            }
        } finally {
            lockA.unlock();
        }
    }
    if (!transferred) Thread.sleep(ThreadLocalRandom.current().nextInt(50));
}

// 3. LOCK-FREE ALGORITHMS (eliminate need for multiple locks):
AtomicReference<AccountState> state = ...;
// CAS-based: no multiple lock acquisitions

// ── DEADLOCK DETECTION ──
// ThreadMXBean: detect deadlocked threads at runtime!
ThreadMXBean tmx = ManagementFactory.getThreadMXBean();
long[] deadlockedIds = tmx.findDeadlockedThreads();
if (deadlockedIds != null) {
    ThreadInfo[] infos = tmx.getThreadInfo(deadlockedIds, true, true);
    for (ThreadInfo info : infos) {
        System.out.println("DEADLOCK DETECTED: " + info.getThreadName());
        System.out.println("  Waiting for: " + info.getLockName());
        System.out.println("  Held by: " + info.getLockOwnerName());
        // Print stack trace
        for (StackTraceElement ste : info.getStackTrace()) {
            System.out.println("    " + ste);
        }
    }
}

// JVM thread dump: jstack <pid>
// Or: kill -3 <pid> on Unix
// Or: jcmd <pid> Thread.print
```

## 8.2 Livelock & Starvation

```java
// LIVELOCK: threads keep changing state in response to each other
// but NO PROGRESS is made — like two people in a corridor

class LivelockExample {
    // Two threads keep "being polite" to each other:
    void thread1(Resource r1, Resource r2) {
        while (true) {
            if (r1.tryLock()) {
                if (r2.tryLock()) {
                    doWork();
                    r2.unlock();
                    r1.unlock();
                    break;
                } else {
                    r1.unlock();  // "politely" release to let other proceed
                    Thread.sleep(50);  // wait
                    // Thread 2 does the same at the same time!
                    // Both release → both retry → both fail → infinite loop!
                }
            }
        }
    }
    // Fix: random backoff
    Thread.sleep(ThreadLocalRandom.current().nextLong(10, 100));
}

// STARVATION: thread never gets CPU time or access to resource
// Low-priority thread starved by high-priority threads
// Unfair lock: some threads always get the lock, others never do

// PREVENTION:
// 1. Fair locks: ReentrantLock(true) — FIFO ordering
// 2. Priority adjustment: make important threads slightly higher priority
// 3. Thread scheduler awareness: don't mix very different priorities
// 4. Timeout: if waiting too long, do something else

// PRIORITY INVERSION (OS-level starvation):
// Low-priority thread L holds lock
// High-priority thread H waits for lock
// Medium-priority thread M runs (preempts L because M > L)
// H waits for L which is starved by M!
// Mars Pathfinder bug (1997) — real example!
// Fix: Priority Inheritance (OS feature)
```

---

# 9. Concurrent Data Structures

## 9.1 java.util.concurrent Collections

```java
// ── ConcurrentHashMap (must know!) ──
// Thread-safe, high performance
// Java 7: 16 segments (each a separate ReentrantLock)
// Java 8+: CAS + synchronized on individual nodes (much better!)

ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// SAFE atomic operations:
map.put("key", 1);
map.putIfAbsent("key", 2);         // atomic: put only if not exists
map.computeIfAbsent("key", k -> expensiveLoad(k));  // atomic load
map.computeIfPresent("key", (k, v) -> v + 1);       // atomic update
map.compute("key", (k, v) -> v == null ? 1 : v + 1); // atomic upsert
map.merge("key", 1, Integer::sum); // atomic add (great for counting!)
map.replace("key", 1, 2);          // CAS: only replace if value == 1

// BULK OPERATIONS (parallel!):
map.forEach(2, (k, v) -> process(k, v));  // 2 = parallelism threshold
map.reduce(2, (k, v) -> v, Integer::sum); // parallel sum of values
map.search(2, (k, v) -> v > 100 ? k : null); // parallel search

// SIZE: not exactly accurate (approximate for performance)
map.size();     // may not reflect latest changes
map.mappingCount();  // long, more accurate for large maps

// !! NOT safe:
// if (!map.containsKey(k)) { map.put(k, v); }  → use putIfAbsent!
// v = map.get(k); v++; map.put(k, v);           → use compute!

// ── CopyOnWriteArrayList ──
// Read-heavy: no locking on reads!
// Write: creates COPY of array → writes to copy → replaces reference
CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
list.add("item");   // O(n): creates full copy!
list.get(0);        // O(1): no locking!
for (String item : list) {  // iterates SNAPSHOT (safe, no ConcurrentModificationException)
    // underlying list can be modified → iterator still sees old version
}
// Use when: reads >> writes, iteration-heavy

// ── CopyOnWriteArraySet ──
// Same as COWAL but Set semantics
CopyOnWriteArraySet<String> set = new CopyOnWriteArraySet<>();

// ── ConcurrentSkipListMap / ConcurrentSkipListSet ──
// Thread-safe sorted map/set
// O(log n) operations, no single lock bottleneck
ConcurrentSkipListMap<String, Integer> sortedMap = new ConcurrentSkipListMap<>();
sortedMap.firstKey();           // O(log n)
sortedMap.ceilingKey("foo");    // O(log n)
sortedMap.headMap("foo");       // O(log n) + view

// ── LinkedBlockingDeque ──
// Thread-safe double-ended blocking queue
LinkedBlockingDeque<String> deque = new LinkedBlockingDeque<>(1000);
deque.putFirst("high-priority");
deque.putLast("normal");
String item = deque.takeFirst();  // blocks if empty

// ── WHAT NOT TO USE FOR CONCURRENT ACCESS ──
HashMap<>        // NOT thread-safe — race, corrupt internal state, infinite loops!
ArrayList<>      // NOT thread-safe — ConcurrentModificationException
HashSet<>        // NOT thread-safe
LinkedList<>     // NOT thread-safe

// Collections.synchronized* (avoid — poor performance):
List<String> synced = Collections.synchronizedList(new ArrayList<>());
// All operations synchronized on the list
// But ITERATION still not safe!:
synchronized(synced) {  // must manually sync iteration!
    for (String s : synced) { ... }
}
```

---

# 10. Thread Pool & Executor Framework

## 10.1 ExecutorService

```java
// THREAD POOL: reuse threads instead of creating per task
// Creating thread: expensive (~1ms, ~1MB stack)
// Task duration << Thread creation: thread pool pays off

// ── THREAD POOL TYPES ──

// Fixed thread pool: N threads, N concurrent tasks max
ExecutorService fixed = Executors.newFixedThreadPool(4);  // 4 threads

// Cached thread pool: creates threads as needed, reuses idle ones
ExecutorService cached = Executors.newCachedThreadPool();
// Max: Integer.MAX_VALUE threads! Risk: too many threads under burst

// Single-thread executor: 1 thread, sequential execution
ExecutorService single = Executors.newSingleThreadExecutor();
// Guarantee: tasks execute in submission order

// Scheduled: run tasks on schedule
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
scheduler.schedule(() -> doWork(), 5, TimeUnit.SECONDS);           // once after 5s
scheduler.scheduleAtFixedRate(() -> heartbeat(), 0, 10, SECONDS);  // every 10s
scheduler.scheduleWithFixedDelay(() -> doWork(), 0, 5, SECONDS);   // 5s after each finish

// Work-stealing pool (Java 8+): ForkJoinPool, good for divide-and-conquer
ExecutorService workStealing = Executors.newWorkStealingPool(4);

// ── CUSTOM ThreadPoolExecutor (production recommended) ──
ExecutorService executor = new ThreadPoolExecutor(
    4,                                  // corePoolSize: min threads always alive
    16,                                 // maximumPoolSize: max threads under load
    60L, TimeUnit.SECONDS,              // keepAliveTime: idle thread TTL
    new LinkedBlockingQueue<>(1000),    // workQueue: bounded! (prevents OOM)
    new ThreadFactory() {               // custom thread names
        private final AtomicInteger count = new AtomicInteger(0);
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, "order-processor-" + count.incrementAndGet());
            t.setDaemon(false);
            return t;
        }
    },
    new ThreadPoolExecutor.CallerRunsPolicy()  // rejection policy
    // AbortPolicy: throw RejectedExecutionException (default)
    // CallerRunsPolicy: caller thread runs the task (backpressure!)
    // DiscardPolicy: silently discard
    // DiscardOldestPolicy: discard oldest queued task
);

// MONITOR thread pool:
ThreadPoolExecutor tpe = (ThreadPoolExecutor) executor;
tpe.getPoolSize();        // current thread count
tpe.getActiveCount();     // currently executing tasks
tpe.getQueue().size();    // tasks waiting in queue
tpe.getCompletedTaskCount();
tpe.getLargestPoolSize(); // peak thread count

// ── GRACEFUL SHUTDOWN ──
executor.shutdown();          // no new tasks, wait for running tasks to complete
if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
    executor.shutdownNow();   // interrupt running tasks
    if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
        log.error("Thread pool did not terminate!");
    }
}
```

## 10.2 ForkJoinPool & Parallel Streams

```java
// FORK-JOIN: divide-and-conquer parallel computation
// Work-stealing: idle threads steal tasks from busy threads' queues

ForkJoinPool pool = new ForkJoinPool(4);  // 4 threads

// RecursiveTask: returns value
class SumTask extends RecursiveTask<Long> {
    private final int[] arr;
    private final int lo, hi;
    private static final int THRESHOLD = 1000;
    
    @Override
    protected Long compute() {
        if (hi - lo < THRESHOLD) {
            // BASE CASE: compute directly
            long sum = 0;
            for (int i = lo; i < hi; i++) sum += arr[i];
            return sum;
        }
        // DIVIDE: split into subtasks
        int mid = lo + (hi - lo) / 2;
        SumTask left  = new SumTask(arr, lo,  mid);
        SumTask right = new SumTask(arr, mid, hi);
        
        left.fork();                // async: submit left subtask
        long rightResult = right.compute();  // compute right in current thread
        long leftResult  = left.join();      // wait for left
        
        return leftResult + rightResult;
    }
}
Long total = pool.invoke(new SumTask(arr, 0, arr.length));

// PARALLEL STREAMS use ForkJoinPool.commonPool():
List<Integer> numbers = IntStream.range(0, 1_000_000)
    .boxed()
    .collect(Collectors.toList());

long sum = numbers.parallelStream()
    .filter(n -> n % 2 == 0)
    .mapToLong(Integer::longValue)
    .sum();
// !! parallelStream() not always faster:
// - Overhead: fork/join, thread coordination
// - Splitting cost: some sources split badly
// - Context: don't use in web server threads (starves request threads!)
// Use when: CPU-bound, large data, operations are independent, no side effects

// CUSTOM ForkJoinPool for parallelStream:
ForkJoinPool customPool = new ForkJoinPool(8);
long result = customPool.submit(() ->
    numbers.parallelStream().mapToLong(n -> n).sum()
).get();
```

---

# 11. Race Conditions in Distributed Systems

## 11.1 Distributed Race Conditions

```
SINGLE SERVER: mutex, synchronized, atomic — works perfectly
DISTRIBUTED SYSTEM: 2+ servers → can't use JVM locks!

SCENARIO: E-commerce flash sale
  User A (Server 1): check stock=1, buy → OK
  User B (Server 2): check stock=1 (same time), buy → ALSO OK!
  Result: oversold! stock went to -1!

DISTRIBUTED RACE CONDITIONS:
  1. OVERSELLING: multiple servers sell same last item
  2. DOUBLE PAYMENT: payment processed twice due to retry
  3. DUPLICATE EMAIL: two instances send same email
  4. SPLIT-BRAIN: two nodes think they're primary
  5. CONCURRENT UPDATE: two users edit same record
```

```java
// ── DATABASE OPTIMISTIC LOCKING ──
@Entity
class Product {
    @Id Long id;
    int stock;
    
    @Version           // JPA version field!
    int version;       // auto-incremented on each update
}

// SELECT: stock=10, version=5
// Thread 1: UPDATE products SET stock=9, version=6 WHERE id=? AND version=5
// Thread 2: UPDATE products SET stock=9, version=6 WHERE id=? AND version=5
// → only ONE succeeds (version already 6 by the time Thread 2 runs)
// → Thread 2 gets 0 rows updated → OptimisticLockException → retry!

// ── DATABASE PESSIMISTIC LOCKING ──
// Spring Data:
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Product p WHERE p.id = :id")
Product findByIdForUpdate(@Param("id") Long id);

// SQL:
// SELECT * FROM products WHERE id = ? FOR UPDATE;
// → Row locked until transaction ends

// ── ATOMIC SQL (best for simple cases) ──
// Instead of: check stock, then decrement
// Use: atomic UPDATE with condition check
@Modifying
@Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty")
int decrementStock(@Param("id") Long id, @Param("qty") int qty);
// Returns: 1 = success, 0 = out of stock (atomically!)

// ── DISTRIBUTED LOCK (Redis) ──
// When DB-level locking not enough (cross-service operations):
class RedisDistributedLock {
    private final StringRedisTemplate redis;
    private final String lockValue = UUID.randomUUID().toString();
    
    public boolean tryLock(String key, long ttlSeconds) {
        Boolean result = redis.opsForValue()
            .setIfAbsent(key, lockValue, Duration.ofSeconds(ttlSeconds));
        return Boolean.TRUE.equals(result);
    }
    
    // ATOMIC RELEASE (Lua script — check + delete atomically):
    private static final String RELEASE_SCRIPT = """
        if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
        else
            return 0
        end
    """;
    
    public void unlock(String key) {
        redis.execute(
            new DefaultRedisScript<>(RELEASE_SCRIPT, Long.class),
            List.of(key),
            lockValue
        );
    }
}

// Usage:
String lockKey = "product:" + productId + ":purchase-lock";
if (distributedLock.tryLock(lockKey, 10)) {
    try {
        // CRITICAL SECTION: only 1 instance executes this at a time
        Product product = productRepo.findById(productId);
        if (product.getStock() > 0) {
            product.setStock(product.getStock() - 1);
            productRepo.save(product);
            createOrder(userId, productId);
        }
    } finally {
        distributedLock.unlock(lockKey);
    }
}

// ── IDEMPOTENCY (prevent duplicate processing) ──
// Distributed retry can cause same operation twice!
@Entity
class IdempotencyRecord {
    @Id String idempotencyKey;  // client-provided unique key
    String result;
    LocalDateTime processedAt;
}

public OrderResponse createOrder(String idempotencyKey, CreateOrderRequest req) {
    // Check if already processed:
    Optional<IdempotencyRecord> existing = idempotencyRepo.findById(idempotencyKey);
    if (existing.isPresent()) {
        return deserialize(existing.get().getResult());  // return cached result
    }
    
    // Process:
    Order order = orderService.create(req);
    
    // Save idempotency record atomically with order:
    IdempotencyRecord record = new IdempotencyRecord(idempotencyKey, serialize(order));
    idempotencyRepo.save(record);
    
    return OrderResponse.from(order);
    // Even if client retries: second call returns same result, no duplicate!
}
```

---

# 12. Detection & Testing

## 12.1 Race Condition Detection Tools

```java
// ── JAVA THREAD SANITIZER (ThreadSanitizer / TSan) ──
// Instrument bytecode to detect data races at RUNTIME
// Not built into JDK — use external tools

// ── JAVA FLIGHT RECORDER + CONCURRENT ANALYSIS ──
// JDK 14+: jcmd <pid> JFR.start settings=profile
// Analyze with JDK Mission Control
// Shows: lock contention, thread waits, deadlocks

// ── FINDBUGS / SPOTBUGS CONCURRENT DETECTORS ──
// Static analysis — finds common concurrency bugs at compile time:
// - Inconsistent synchronization
// - Non-atomic check-then-act
// - Lock held too long
// - Mutable field not synchronized

// ── FINDBUGS ANNOTATIONS for documentation: ──
@ThreadSafe        // claim: this class is thread-safe
@NotThreadSafe     // claim: this class is NOT thread-safe
@GuardedBy("lock") // field must be accessed with this lock held
@Immutable         // claim: this class is immutable

// ── STRESS TESTING ──
// Race conditions need specific timing → need many iterations!
class RaceConditionTest {
    
    @RepeatedTest(10000)  // run 10,000 times
    void testConcurrentIncrement() throws InterruptedException {
        Counter counter = new Counter();
        int THREADS = 100;
        int ITERATIONS = 1000;
        
        ExecutorService executor = Executors.newFixedThreadPool(THREADS);
        CountDownLatch latch = new CountDownLatch(THREADS);
        
        for (int i = 0; i < THREADS; i++) {
            executor.submit(() -> {
                for (int j = 0; j < ITERATIONS; j++) {
                    counter.increment();
                }
                latch.countDown();
            });
        }
        
        latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();
        
        // Expected: THREADS * ITERATIONS = 100,000
        assertThat(counter.get()).isEqualTo(THREADS * ITERATIONS);
        // This WILL FAIL for broken counter! Detects race condition.
    }
}

// ── JCSTRESS (Java Concurrency Stress tests) ──
// Tool specifically for testing concurrent code:
// @JCStressTest
// @Outcome(id = "0, 0", expect = Expect.FORBIDDEN, desc = "Both threads must see each other's writes")
// @Outcome(id = "1, 1", expect = Expect.ACCEPTABLE_INTERESTING, desc = "Both threads observed each other")
// @State
// public class VisibilityTest {
//     int x, y;
//     @Actor public void actor1(II_Result r) { x = 1; r.r1 = y; }
//     @Actor public void actor2(II_Result r) { y = 1; r.r2 = x; }
// }
```

## 12.2 Rules & Best Practices

```
RULES TO PREVENT RACE CONDITIONS:

1. IMMUTABILITY (best defense!):
   Immutable objects can be shared freely — no synchronization needed
   final fields, no setters, defensive copies in constructor
   String, Integer, BigDecimal — all immutable, all thread-safe

2. THREAD CONFINEMENT:
   Keep mutable state in one thread only
   Don't share! Pass between threads via thread-safe queues
   
3. SYNCHRONIZED CRITICAL SECTIONS:
   Identify all accesses to shared mutable state
   Synchronize ALL access points (not just writes!)
   
4. ATOMIC OPERATIONS:
   Use AtomicInteger, AtomicLong, AtomicReference
   Use ConcurrentHashMap.compute() for compound operations
   
5. CONSISTENT LOCK ORDERING:
   Always acquire locks in same order → prevent deadlock
   
6. MINIMIZE LOCK SCOPE:
   Hold lock for as short as possible
   Never do I/O, slow operations while holding lock
   
7. PREFER HIGHER-LEVEL ABSTRACTIONS:
   BlockingQueue over manual wait/notify
   ConcurrentHashMap over synchronized HashMap
   CompletableFuture over manual thread management
   Akka/virtual threads over traditional locking
   
8. DOCUMENTATION:
   @ThreadSafe, @NotThreadSafe, @GuardedBy
   Document which threads may call each method
   Document which lock protects each field

9. TESTING:
   Stress test with many threads, many iterations
   Use @RepeatedTest for statistical detection
   Consider jcstress for thorough concurrency testing
   
10. VIRTUAL THREADS (Java 21+):
    Project Loom: lightweight virtual threads
    Can have millions of virtual threads
    Still need synchronization for shared state!
    Structured concurrency: scoped, auto-cleanup

QUICK CHECKLIST:
  □ Is this field accessed by multiple threads?
  □ Is it mutable?
  □ Is all access synchronized consistently?
  □ Are compound operations (check-then-act, read-modify-write) atomic?
  □ Is lock ordering consistent?
  □ Are ThreadLocals cleaned up properly?
  □ Is volatile sufficient, or do I need atomic/synchronized?
  □ Could this deadlock? (multiple lock acquisitions?)
```

---

## 📎 Quick Reference

```
DATA RACE:       concurrent access, at least one write, no sync
RACE CONDITION:  timing-dependent incorrect behavior
ATOMIC:          operation completes fully or not at all (not interruptible)
VISIBILITY:      changes by thread A immediately seen by thread B
HAPPENS-BEFORE:  JMM guarantee: A's effects visible to B

HARDWARE:        Cache lines = 64 bytes, false sharing, MESI protocol
REORDERING:      compiler + CPU may reorder for optimization
volatile:        visibility + ordering, NOT atomicity
synchronized:    visibility + atomicity + mutual exclusion
AtomicInteger:   visibility + atomicity via CAS hardware instruction

CHECK-THEN-ACT:  must be atomic (synchronized block)
READ-MODIFY-WRITE: must be atomic (synchronized or Atomic classes)
LOCK ORDERING:   always acquire in same order → prevent deadlock
DEADLOCK COND:   mutual exclusion + hold & wait + no preemption + circular wait

CAS:             compareAndSwap — atomic hardware instruction
LongAdder:       for high-contention counters (vs AtomicLong)
ThreadLocal:     per-thread state — ALWAYS clear in thread pool!

DISTRIBUTED:     DB optimistic lock (@Version), pessimistic (FOR UPDATE)
                 atomic SQL (UPDATE WHERE stock >= qty), Redis distributed lock
                 idempotency key for duplicate prevention
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Java Concurrency in Practice | <https://jcip.net/> |
| Java Memory Model | <https://docs.oracle.com/javase/specs/jls/se17/html/jls-17.html> |
| java.util.concurrent | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/concurrent/package-summary.html> |
| AtomicInteger | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/concurrent/atomic/package-summary.html> |
| StampedLock | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/concurrent/locks/StampedLock.html> |
| CompletableFuture | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/concurrent/CompletableFuture.html> |
| Virtual Threads (Loom) | <https://openjdk.org/projects/loom/> |
| JCStress | <https://openjdk.org/projects/code-tools/jcstress/> |
| SpotBugs Concurrent | <https://spotbugs.readthedocs.io/en/stable/> |
| Jenkov Concurrency | <https://jenkov.com/tutorials/java-concurrency/index.html> |
