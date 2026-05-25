# 🔒 Deadlock — Complete Deep Dive
>
> Cơ chế, Phát hiện, Phòng tránh, Giải quyết trong Java Concurrent Programming

---

## 📚 Table of Contents

1. [Deadlock Fundamentals — Tận Gốc](#1-deadlock-fundamentals--tận-gốc)
2. [4 Coffman Conditions — Điều Kiện Cần Đủ](#2-4-coffman-conditions--điều-kiện-cần--đủ)
3. [Deadlock trong Java — Mọi Dạng](#3-deadlock-trong-java--mọi-dạng)
4. [Phát Hiện Deadlock](#4-phát-hiện-deadlock)
5. [Deadlock Prevention — Phòng Tránh](#5-deadlock-prevention--phòng-tránh)
6. [Deadlock Avoidance & Recovery](#6-deadlock-avoidance--recovery)
7. [Lock-Free Alternatives](#7-lock-free-alternatives)
8. [Deadlock trong Database](#8-deadlock-trong-database)
9. [Deadlock trong Distributed Systems](#9-deadlock-trong-distributed-systems)
10. [Real-World Case Studies](#10-real-world-case-studies)
11. [Testing & Tools](#11-testing--tools)

---

# 1. Deadlock Fundamentals — Tận Gốc

## 1.1 Deadlock là gì?

```
DEADLOCK: trạng thái mà một tập hợp threads bị blocked mãi mãi,
          mỗi thread đang chờ tài nguyên mà thread khác đang giữ.

GIẢI THÍCH ĐƠN GIẢN:
  Thread A giữ Lock1, đang chờ Lock2
  Thread B giữ Lock2, đang chờ Lock1
  Cả hai NGỦ MÃI MÃI — không ai chịu nhả!

SO SÁNH CÁC VẤN ĐỀ CONCURRENCY:
  Deadlock:   STUCK hoàn toàn, không ai chạy
  Livelock:   đang chạy nhưng không tiến (như hai người nhường đường nhau mãi)
  Starvation: một bên tiến, bên kia KHÔNG BAO GIỜ được chạy
  Race Cond.: kết quả sai do timing, KHÔNG bị stuck

RESOURCE ALLOCATION GRAPH (RAG):
  Node tròn  = Thread (T1, T2)
  Node vuông = Resource (R1, R2)

  T → R:  Thread REQUEST resource (chờ)
  R → T:  Resource ASSIGNED to thread (đang giữ)

  DEADLOCK = cycle tồn tại trong RAG:
  T1 → R1 → T2 → R2 → T1  (cycle! deadlock)

ANALOGY THỰC TẾ:
  Giao thông 4 chiều, mỗi xe giữ 1 lane, chờ lane của xe khác:
      ↑ Car A →
  ←Car D     Car B ↓
      ← Car C ↑
  Car A→B→C→D→A: CIRCULAR WAIT → GRIDLOCK!
```

## 1.2 Tại Sao Deadlock Nguy Hiểm?

```
IMPACT:
  System hang:      toàn bộ feature/service bị đóng băng
  Silent failure:   không crash, không log error rõ ràng → khó detect
  Cascading:        service khác timeout khi chờ → cascade failure
  Unrecoverable:    thường phải restart service để recover

REAL EXAMPLES:
  2003: Java Swing deadlock → nhiều GUI app freeze
  2008: JDK 6 HashMap deadlock → vô vàn production issues
  MySQL: deadlock trong InnoDB → transaction rollback liên tục
  Financial systems: order matching engine deadlock → trading halted

KHÓ DEBUG VÌ:
  Non-deterministic: xảy ra tùy theo CPU scheduling và timing
  Heisenbug: thêm log/debug → thay đổi timing → bug biến mất!
  Intermittent: chỉ xảy ra dưới heavy load hoặc production
  Silent: thread không crash, chỉ không làm gì → khó phát hiện
```

---

# 2. 4 Coffman Conditions — Điều Kiện Cần & Đủ

## 2.1 Phân Tích Từng Condition

```
E.G. Coffman Jr. (1971): Deadlock xảy ra KHI VÀ CHỈ KHI cả 4 điều kiện đồng thời
Phá vỡ BẤT KỲ 1 điều kiện → KHÔNG có deadlock!

CONDITION 1: MUTUAL EXCLUSION
  Tài nguyên KHÔNG thể share — phải hold exclusive
  Thread A giữ lock → Thread B PHẢI chờ
  Phá vỡ: làm tài nguyên có thể share (read locks)
  Thực tế: khó phá — mutual exclusion cần thiết cho correctness

CONDITION 2: HOLD AND WAIT
  Thread giữ ÍT NHẤT 1 tài nguyên VÀ đang chờ thêm
  Thread A: holds Lock1, WAITING for Lock2
  Phá vỡ:
    a) Acquire ALL resources trước khi bắt đầu (all-or-nothing)
    b) Release ALL resources trước khi request cái mới

CONDITION 3: NO PREEMPTION
  Tài nguyên KHÔNG THỂ bị lấy mạnh — chỉ release tự nguyện
  OS không thể "steal" lock từ thread đang giữ nó
  Phá vỡ:
    Timeout: tự nguyện release sau timeout (tryLock)
    Rollback: roll back thread, release tất cả resources

CONDITION 4: CIRCULAR WAIT
  Có chu trình: T1→R1→T2→R2→...→T1
  Phá vỡ: LOCK ORDERING — enforce global order on resources
  DỄ NHẤT và HIỆU QUẢ NHẤT trong thực tế!

CHIẾN LƯỢC THỰC TẾ:
  Condition 1: Khó phá — cần thiết
  Condition 2: Được — all-or-nothing lock acquisition
  Condition 3: Được — tryLock với timeout
  Condition 4: DỄ NHẤT — lock ordering (RECOMMENDED!)
```

---

# 3. Deadlock trong Java — Mọi Dạng

## 3.1 Object Lock Deadlock (synchronized)

```java
public class BasicDeadlock {
    private final Object lockA = new Object();
    private final Object lockB = new Object();

    // Thread 1 chạy method này:
    public void methodA() throws InterruptedException {
        synchronized (lockA) {
            System.out.println(Thread.currentThread().getName() + ": holds lockA, waiting lockB");
            Thread.sleep(100);  // yield CPU cho Thread 2 giữ lockB trước
            synchronized (lockB) {   // ← BLOCKED nếu Thread 2 đang giữ lockB!
                System.out.println("holds both");
            }
        }
    }

    // Thread 2 chạy method này — NGƯỢC THỨ TỰ!
    public void methodB() throws InterruptedException {
        synchronized (lockB) {
            System.out.println(Thread.currentThread().getName() + ": holds lockB, waiting lockA");
            Thread.sleep(100);
            synchronized (lockA) {   // ← BLOCKED nếu Thread 1 đang giữ lockA!
                System.out.println("holds both");
            }
        }
    }
    // DEADLOCK: Thread-A holds lockA, waits lockB
    //           Thread-B holds lockB, waits lockA
    // Circular wait → cả 2 block mãi mãi!
}
```

## 3.2 ReentrantLock Deadlock

```java
import java.util.concurrent.locks.*;

public class ReentrantDeadlock {

    private final Lock lock1 = new ReentrantLock();
    private final Lock lock2 = new ReentrantLock();

    public void task1() {
        lock1.lock();
        try {
            Thread.sleep(50);
            lock2.lock();    // ← BLOCKED nếu Thread 2 giữ lock2!
            try {
                doWork();
            } finally { lock2.unlock(); }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally { lock1.unlock(); }
    }

    public void task2() {
        lock2.lock();           // ← NGƯỢC THỨ TỰ!
        try {
            Thread.sleep(50);
            lock1.lock();       // ← BLOCKED nếu Thread 1 giữ lock1!
            try {
                doWork();
            } finally { lock1.unlock(); }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally { lock2.unlock(); }
    }
}
```

## 3.3 Thread Pool Deadlock (Rất Phổ Biến!)

```java
import java.util.concurrent.*;

public class ThreadPoolDeadlock {

    // CHỈ 2 THREADS TRONG POOL!
    private final ExecutorService pool = Executors.newFixedThreadPool(2);

    // Outer task: chiếm 1 thread, submit inner task và WAIT
    public Future<String> outer() {
        return pool.submit(() -> {
            // Outer task đang chạy trên 1 trong 2 threads...
            Future<String> innerFuture = pool.submit(() -> {
                return "inner result";   // Inner task cần 1 thread để chạy
            });
            return innerFuture.get();   // ← BLOCK! Chờ inner hoàn thành
            // Nhưng cả 2 threads đều bị outer tasks chiếm!
            // Inner task không có thread để chạy → chờ mãi!
        });
    }

    public void demonstrate() throws Exception {
        Future<String> f1 = outer();  // chiếm thread 1
        Future<String> f2 = outer();  // chiếm thread 2 → pool exhausted!

        // f1 và f2 đều chờ inner tasks
        // Inner tasks không có thread → DEADLOCK!
        f1.get();  // hangs forever!
        f2.get();
    }

    // ── SPRING @ASYNC DEADLOCK (tương tự) ──
    // @Async createOrder() gọi @Async processPayment().get()
    // Pool size = 1: createOrder giữ thread, chờ processPayment
    // processPayment không có thread → DEADLOCK!

    // ── FIX 1: Separate pools ──
    private final ExecutorService outerPool = Executors.newFixedThreadPool(4);
    private final ExecutorService innerPool = Executors.newFixedThreadPool(4);

    // ── FIX 2: Non-blocking (best) ──
    public CompletableFuture<String> nonBlocking() {
        return CompletableFuture
            .supplyAsync(() -> "step1", pool)
            .thenCompose(step1 ->
                CompletableFuture.supplyAsync(() -> "final: " + step1, pool));
        // Không bao giờ block! Chain completion callbacks
    }
}
```

## 3.4 Wait/Notify Deadlock

```java
public class WaitNotifyDeadlock {

    private Object lockX = new Object();
    private Object lockY = new Object();

    // Thread P: holds lockX + lockY, waits on lockY
    public void threadP() throws InterruptedException {
        synchronized (lockX) {
            synchronized (lockY) {
                lockY.wait();   // wait() releases lockY, nhưng KHÔNG release lockX!
                // Thread Q cần lockX → BLOCKED!
            }
        }
    }

    // Thread Q: cần lockX (để notify)
    public void threadQ() throws InterruptedException {
        synchronized (lockX) {  // ← BLOCKED! Thread P holds lockX during wait!
            synchronized (lockY) {
                lockY.notifyAll();  // Không bao giờ được gọi!
            }
        }
    }
    // DEADLOCK:
    // P waits on lockY (releases lockY but KEEPS lockX)
    // Q can't acquire lockX (P still holds it even during wait!)
    // Q can't notify → P waits forever!

    // FIX: P không nên giữ lockX khi wait:
    public void fixedP() throws InterruptedException {
        synchronized (lockX) {
            // work...
        }  // Release lockX trước!

        synchronized (lockY) {
            lockY.wait();  // Only holds lockY, releases during wait → Q can proceed
        }
    }
}
```

## 3.5 Static Lock Deadlock

```java
class ClassA {
    public static synchronized void methodA() throws InterruptedException {
        // Holds lock on ClassA.class
        Thread.sleep(100);
        ClassB.methodB();  // tries to acquire ClassB.class lock!
    }
}

class ClassB {
    public static synchronized void methodB() throws InterruptedException {
        // Holds lock on ClassB.class
        Thread.sleep(100);
        ClassA.methodA();  // tries to acquire ClassA.class lock!
    }
}
// Thread 1: ClassA.class → ClassB.class
// Thread 2: ClassB.class → ClassA.class
// DEADLOCK: circular wait trên class-level locks!
```

## 3.6 Deadlock qua Event Listener (Spring phổ biến!)

```java
// ── COMMON SPRING DEADLOCK ──
@Service
public class OrderService {

    @Transactional
    public Order createOrder(CreateOrderRequest req) {
        Order order = orderRepository.save(new Order(req));
        // Row lock held by this transaction!

        // Publish event INSIDE transaction:
        eventPublisher.publishEvent(new OrderCreatedEvent(order.getId()));
        // Event listener SYNCHRONOUSLY runs here!

        return order;
        // Transaction commits AFTER this method returns
    }
}

@Component
public class OrderEmailListener {

    @EventListener  // Synchronous! Same thread!
    @Transactional  // New transaction tries to read order
    public void onOrderCreated(OrderCreatedEvent event) {
        Order order = orderRepository.findById(event.getOrderId()).get();
        // ← BLOCKED! Original transaction holds row lock!
        // Original transaction is WAITING for THIS method to return!
        // DEADLOCK!

        emailService.sendConfirmation(order);
    }
}

// ✅ FIX: @TransactionalEventListener — chạy SAU khi commit
@Component
public class FixedOrderEmailListener {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async  // Run in different thread to avoid blocking
    public void onOrderCreated(OrderCreatedEvent event) {
        // Chỉ chạy SAU KHI transaction commits → row lock đã release!
        Order order = orderRepository.findById(event.getOrderId()).get();  // OK!
        emailService.sendConfirmation(order);
    }
}
```

## 3.7 Connection Pool Deadlock

```java
@Service
public class ReportService {

    // pool size = 10 connections

    @Transactional
    public Report generateReport(Long reportId) throws Exception {
        // Lấy 1 connection từ pool (còn 9)
        Report report = reportRepository.findById(reportId).get();

        List<Future<Data>> futures = new ArrayList<>();
        for (Section section : report.getSections()) {
            futures.add(executor.submit(() -> {
                // Mỗi subtask cần THÊM 1 connection!
                return dataRepository.findBySectionId(section.getId());
            }));
        }

        // Wait for all:
        for (Future<Data> f : futures) {
            f.get();  // BLOCKED nếu pool exhausted!
        }
        // Nếu có 10 sections:
        // 1 connection giữ bởi outer @Transactional
        // 9 subtasks lấy 9 connections còn lại
        // 10th subtask: NO CONNECTION AVAILABLE → WAIT
        // Outer: waiting for 10th subtask
        // 10th subtask: waiting for connection (held by outer and 9 others)
        // DEADLOCK!

        return buildReport(report, /* data */);
    }

    // ✅ FIX: Release outer connection trước khi subtasks chạy
    @Transactional(readOnly = true)
    public List<Section> getSections(Long reportId) {
        return reportRepository.findSections(reportId);
    }  // connection released here!

    public Report fixedGenerateReport(Long reportId) throws Exception {
        List<Section> sections = getSections(reportId);  // connection released

        // Now all 10 pool connections available for subtasks:
        List<Future<Data>> futures = sections.stream()
            .map(s -> executor.submit(() -> dataRepository.findBySectionId(s.getId())))
            .collect(Collectors.toList());

        List<Data> data = futures.stream()
            .map(this::getQuietly)
            .collect(Collectors.toList());

        return buildReport(sections, data);
    }
}
```

---

# 4. Phát Hiện Deadlock

## 4.1 ThreadMXBean — Runtime Detection

```java
import java.lang.management.*;

public class DeadlockDetector {

    private final ThreadMXBean tmx = ManagementFactory.getThreadMXBean();

    // ── BASIC DETECTION ──
    public boolean hasDeadlock() {
        return tmx.findDeadlockedThreads() != null;
    }

    // ── FULL REPORT ──
    public void reportDeadlock() {
        long[] ids = tmx.findDeadlockedThreads();
        // findDeadlockedThreads(): detect cả synchronized AND ReentrantLock
        // findMonitorDeadlockedThreads(): chỉ synchronized

        if (ids == null) { System.out.println("No deadlock."); return; }

        System.out.println("DEADLOCK DETECTED! " + ids.length + " threads:");
        ThreadInfo[] infos = tmx.getThreadInfo(ids, true, true);

        for (ThreadInfo info : infos) {
            System.out.println("\n=== " + info.getThreadName() + " ===");
            System.out.println("State:       " + info.getThreadState());
            System.out.println("Waiting for: " + info.getLockName());
            System.out.println("Held by:     " + info.getLockOwnerName());

            System.out.println("Locked Monitors:");
            for (MonitorInfo mi : info.getLockedMonitors()) {
                System.out.println("  " + mi.getClassName() + " at " + mi.getLockedStackFrame());
            }

            System.out.println("Locked Synchronizers (ReentrantLock):");
            for (LockInfo li : info.getLockedSynchronizers()) {
                System.out.println("  " + li.getClassName());
            }

            System.out.println("Stack Trace:");
            for (StackTraceElement ste : info.getStackTrace()) {
                System.out.println("  at " + ste);
            }
        }
    }

    // ── SCHEDULED MONITOR (production) ──
    public void startMonitoring(AlertService alertService) {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1,
            r -> { Thread t = new Thread(r, "deadlock-monitor"); t.setDaemon(true); return t; });

        scheduler.scheduleAtFixedRate(() -> {
            long[] ids = tmx.findDeadlockedThreads();
            if (ids != null) {
                log.error("CRITICAL: DEADLOCK DETECTED! {} threads involved", ids.length);
                reportDeadlock();
                alertService.sendCriticalAlert("Application deadlock detected!");
                // Options:
                // 1. Alert + manual investigation
                // 2. Interrupt deadlocked threads
                // 3. Graceful restart
            }
        }, 5, 5, TimeUnit.SECONDS);
    }

    // ── THREAD CONTENTION STATS ──
    public void printContentionStats() {
        tmx.setThreadContentionMonitoringEnabled(true);
        for (long id : tmx.getAllThreadIds()) {
            ThreadInfo info = tmx.getThreadInfo(id);
            if (info != null && info.getBlockedTime() > 100) {  // blocked > 100ms
                System.out.printf("Thread: %-30s Blocked: %dms Waited: %dms%n",
                    info.getThreadName(),
                    info.getBlockedTime(),
                    info.getWaitedTime());
            }
        }
    }
}
```

## 4.2 Thread States — Đọc Thread Dump

```bash
# ── LẤY THREAD DUMP ──
jstack <pid>              # standard
jstack -l <pid>           # với lock info (recommended)
jcmd <pid> Thread.print   # modern alternative
kill -3 <pid>             # Unix: SIGQUIT dumps to stdout

# ── THREAD DUMP FORMAT ──
# "Thread-A" #12 prio=5 tid=0x... nid=0x1234 waiting for monitor entry [0x...]
#    java.lang.Thread.State: BLOCKED (on object monitor)
#         at com.example.Foo.methodA(Foo.java:25)
#         - waiting to lock <0xABC> (a java.lang.Object)   ← chờ lock này
#         - locked <0xDEF> (a java.lang.Object)            ← đang giữ lock này
#
# "Thread-B" #13 prio=5 tid=0x... nid=0x1235 waiting for monitor entry [0x...]
#    java.lang.Thread.State: BLOCKED (on object monitor)
#         at com.example.Foo.methodB(Foo.java:35)
#         - waiting to lock <0xDEF> (held by Thread-A)     ← Thread-B chờ cái A đang giữ!
#         - locked <0xABC>                                  ← Thread-B giữ cái A đang chờ!
#
# Found one Java-level deadlock:
# =============================
# "Thread-A" waiting for Thread-B
# "Thread-B" waiting for Thread-A
# Found 1 deadlock.   ← JVM confirms!

# ── TRẠNG THÁI THREAD ──
# BLOCKED:       chờ synchronized lock → POSSIBLE DEADLOCK (cần check circular)
# WAITING:       Object.wait() hoặc LockSupport.park() → indefinite wait
# TIMED_WAITING: sleep/wait(timeout) → sẽ tự thức dậy
# RUNNABLE:      đang chạy hoặc sẵn sàng chạy

# Deadlock pattern:
# Thread A: BLOCKED, waiting for lock held by Thread B
# Thread B: BLOCKED, waiting for lock held by Thread A
# → Circular BLOCKED chain!
```

---

# 5. Deadlock Prevention — Phòng Tránh

## 5.1 Lock Ordering — GIẢI PHÁP TỐT NHẤT

```java
// NGUYÊN TẮC: Luôn acquire locks theo THỨ TỰ NHẤT QUÁN
// Phá vỡ Condition 4 (Circular Wait)!

// ── SIMPLE CASE: locks cố định ──
public class LockOrdering {
    private static final Object LOCK_A = new Object();  // "lower"
    private static final Object LOCK_B = new Object();  // "higher"

    // ✅ CẢ HAI methods lock A trước B — không bao giờ deadlock!
    public void method1() {
        synchronized (LOCK_A) {     // ALWAYS A first
            synchronized (LOCK_B) {
                doWork1();
            }
        }
    }

    public void method2() {
        synchronized (LOCK_A) {     // SAME ORDER — no cycle possible!
            synchronized (LOCK_B) {
                doWork2();
            }
        }
    }

    // ── DYNAMIC ORDERING: BankAccount transfer ──

    class BankAccount {
        final int id;              // unique, stable ID cho ordering
        private double balance;

        BankAccount(int id, double balance) {
            this.id = id;
            this.balance = balance;
        }
    }

    // ❌ SAI — không có ordering → DEADLOCK!
    public void transferWrong(BankAccount from, BankAccount to, double amount) {
        synchronized (from) {     // Thread 1: from=A→B; Thread 2: from=B→A → DEADLOCK!
            synchronized (to) {
                from.balance -= amount;
                to.balance   += amount;
            }
        }
    }

    // ✅ ĐÚNG — ordering by account ID
    public void transfer(BankAccount from, BankAccount to, double amount) {
        // Xác định thứ tự TRƯỚC KHI lock:
        BankAccount first  = from.id < to.id ? from : to;   // lower ID first
        BankAccount second = from.id < to.id ? to   : from;

        synchronized (first) {
            synchronized (second) {
                from.balance -= amount;
                to.balance   += amount;
            }
        }
        // Thread 1: transfer(A,B) → lock A(id=1) then B(id=2)
        // Thread 2: transfer(B,A) → lock A(id=1) then B(id=2) (SAME ORDER!)
        // Không bao giờ deadlock!
    }

    // ── NHIỀU HƠN 2 LOCKS ──
    public void multiLock(List<BankAccount> accounts, Runnable work) {
        // Sort by ID trước khi lock:
        List<BankAccount> sorted = accounts.stream()
            .sorted(Comparator.comparingInt(a -> a.id))
            .distinct()
            .collect(Collectors.toList());
        acquireInOrder(sorted, 0, work);
    }

    private void acquireInOrder(List<BankAccount> sorted, int idx, Runnable work) {
        if (idx == sorted.size()) { work.run(); return; }
        synchronized (sorted.get(idx)) {
            acquireInOrder(sorted, idx + 1, work);
        }
    }
}
```

## 5.2 TryLock với Timeout — Phá Condition 3

```java
import java.util.concurrent.locks.*;
import java.util.concurrent.*;

public class TryLockDeadlockPrevention {

    private final Lock lockA = new ReentrantLock();
    private final Lock lockB = new ReentrantLock();

    // ── BASIC TRYLOCK — KHÔNG BAO GIỜ deadlock! ──
    public boolean tryTransfer(double amount) throws InterruptedException {
        boolean acquiredA = false;
        boolean acquiredB = false;

        try {
            acquiredA = lockA.tryLock(100, TimeUnit.MILLISECONDS);
            if (!acquiredA) { log.warn("Could not acquire lockA"); return false; }

            acquiredB = lockB.tryLock(100, TimeUnit.MILLISECONDS);
            if (!acquiredB) { log.warn("Could not acquire lockB"); return false; }

            doTransfer(amount);
            return true;

        } finally {
            // ALWAYS release in reverse order:
            if (acquiredB) lockB.unlock();
            if (acquiredA) lockA.unlock();
        }
    }

    // ── RETRY với EXPONENTIAL BACKOFF (tránh livelock) ──
    public void transferWithRetry(double amount) throws InterruptedException {
        int maxAttempts = 10;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            if (tryTransfer(amount)) return;  // success!

            // Exponential backoff + RANDOM JITTER (prevents all threads retrying simultaneously):
            long delay = 50L * (1L << Math.min(attempt, 5))               // 50, 100, 200, 400...ms
                         + ThreadLocalRandom.current().nextLong(50);       // +random 0-50ms
            log.info("Attempt {} failed, retrying in {}ms", attempt, delay);
            Thread.sleep(delay);
        }
        throw new TransferException("Failed after " + maxAttempts + " attempts");
    }

    // ── INTERRUPTIBLE LOCK — allow external cancellation ──
    public void interruptibleOperation() throws InterruptedException {
        lockA.lockInterruptibly();  // throws InterruptedException nếu thread bị interrupt
        try {
            lockB.lockInterruptibly();
            try {
                doWork();
            } finally { lockB.unlock(); }
        } finally { lockA.unlock(); }
        // Caller có thể thread.interrupt() để cancel nếu chờ quá lâu
    }
}
```

## 5.3 Open Calls — Không Gọi Alien Methods Khi Giữ Lock

```java
// "ALIEN METHOD": gọi method từ class khác mà bạn không kiểm soát
// Alien method có thể acquire lock khác → potential deadlock!

// ── VẤN ĐỀ ──
class ProblemClass {
    private final List<EventListener> listeners = new ArrayList<>();
    private final Object lock = new Object();

    // BAD: gọi listener (alien method) KHI ĐANG GIỮ LOCK
    public void fireEventBAD(Event event) {
        synchronized (lock) {
            for (EventListener listener : listeners) {
                listener.onEvent(event);  // ALIEN METHOD!
                // listener có thể acquire lock khác → deadlock!
                // listener có thể gọi lại vào class này → potential deadlock!
            }
        }
    }

    // GOOD: copy, release lock, THEN call alien methods
    public void fireEventGOOD(Event event) {
        List<EventListener> snapshot;
        synchronized (lock) {
            snapshot = new ArrayList<>(listeners);  // copy
        }  // ← LOCK RELEASED HERE!

        // Gọi alien methods WITHOUT holding any lock:
        for (EventListener listener : snapshot) {
            listener.onEvent(event);  // OPEN CALL — safe!
        }
    }
}
```

---

# 6. Deadlock Avoidance & Recovery

## 6.1 Banker's Algorithm (Lý Thuyết)

```
BANKER'S ALGORITHM (Dijkstra, 1965):
  Trước khi cấp resource, check xem system có ở SAFE STATE không
  Safe state: tồn tại sequence P1..Pn mà từng Pi có thể complete

  THỰC TẾ:
  ❌ Cần biết maximum resource demand trước (khó!)
  ❌ Số processes/resources phải cố định
  ❌ Overhead: check safety mỗi request
  ✅ Quan trọng cho lý thuyết, gợi cảm hứng cho tryLock approach
  ✅ Dùng trong OS-level resource management

  Ứng dụng thực tế gần nhất: tryLock với timeout
  "Nếu không thể acquire trong timeout → release và retry"
```

## 6.2 Recovery — Phục Hồi Sau Deadlock

```java
public class DeadlockRecovery {

    // ── OPTION 1: Interrupt deadlocked threads ──
    public void recoverByInterrupting(long[] deadlockedIds) {
        for (long id : deadlockedIds) {
            Thread thread = findThread(id);
            if (thread != null) {
                log.warn("Interrupting deadlocked thread: {}", thread.getName());
                thread.interrupt();
                // Thread PHẢI xử lý InterruptedException properly!
            }
        }
    }

    // ── OPTION 2: Graceful process restart (most common) ──
    public void gracefulRestart() {
        log.error("DEADLOCK DETECTED — initiating graceful restart");

        // 1. Signal health check → UNHEALTHY
        healthIndicator.setStatus(Status.DOWN);

        // 2. Stop accepting new requests
        server.stopAcceptingConnections();

        // 3. Wait for in-flight requests (with timeout)
        try { Thread.sleep(10_000); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }

        // 4. Exit — container/orchestrator will restart
        // Kubernetes: liveness probe fails → pod killed → new pod started automatically!
        System.exit(1);
    }

    // ── DESIGNING THREADS TO BE RECOVERABLE ──
    public class RecoverableWorker implements Runnable {

        @Override
        public void run() {
            while (!Thread.currentThread().isInterrupted()) {
                boolean l1 = false, l2 = false;
                try {
                    l1 = lock1.tryLock(5, TimeUnit.SECONDS);
                    if (!l1) { log.warn("Timeout lock1, retrying"); continue; }

                    l2 = lock2.tryLock(5, TimeUnit.SECONDS);
                    if (!l2) { log.warn("Timeout lock2, retrying"); continue; }

                    doWork();

                } catch (InterruptedException e) {
                    log.info("Thread interrupted, stopping");
                    Thread.currentThread().interrupt();  // restore interrupt flag
                    break;
                } finally {
                    // ALWAYS release in reverse order:
                    if (l2) lock2.unlock();
                    if (l1) lock1.unlock();
                }

                // Backoff between iterations to reduce contention:
                try { Thread.sleep(ThreadLocalRandom.current().nextLong(10, 50)); }
                catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
            }
        }
    }
}
```

---

# 7. Lock-Free Alternatives

## 7.1 Atomic Operations — Không Cần Locks

```java
// LOCK-FREE: loại bỏ locks → loại bỏ deadlock hoàn toàn!
// Sử dụng hardware CAS (Compare-And-Swap) instructions

// ── ATOMIC VARIABLES ──
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();              // thread-safe, NO lock, NO deadlock!
counter.compareAndSet(10, 20);          // CAS: if==10, set to 20

// ── ATOMIC ACCOUNT DEBIT ──
AtomicLong balance = new AtomicLong(1000);
long current, newBalance;
do {
    current = balance.get();
    newBalance = current - debitAmount;
    if (newBalance < 0) throw new InsufficientFundsException();
} while (!balance.compareAndSet(current, newBalance));
// Retry nếu CAS fail (another thread changed balance concurrently)
// NO LOCK → NO DEADLOCK!

// ── ConcurrentHashMap (lock-free reads) ──
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
map.computeIfAbsent("key", k -> expensiveLoad(k));  // atomic, no deadlock
map.merge("count", 1, Integer::sum);                 // atomic increment

// ── LongAdder — for high-contention counters ──
LongAdder requests = new LongAdder();
requests.increment();       // faster than AtomicLong under high contention
long total = requests.sum(); // aggregate when needed

// ── IMMUTABLE STATE — no locks for reads ──
@Value  // Lombok: all fields final
class Config {
    String host;
    int port;
}
AtomicReference<Config> configRef = new AtomicReference<>(initialConfig);
// Read: always safe, no lock:
Config current = configRef.get();
// Atomic update:
configRef.updateAndGet(c -> new Config(newHost, c.getPort()));

// ── LOCK-FREE STACK ──
class LockFreeStack<T> {
    private final AtomicReference<Node<T>> head = new AtomicReference<>();

    public void push(T value) {
        Node<T> node = new Node<>(value);
        do { node.next = head.get(); }
        while (!head.compareAndSet(node.next, node));
    }

    public T pop() {
        Node<T> cur;
        do {
            cur = head.get();
            if (cur == null) return null;
        } while (!head.compareAndSet(cur, cur.next));
        return cur.value;
    }
    // No locks → No deadlock!
}
```

---

# 8. Deadlock trong Database

## 8.1 DB Deadlock Types và Solutions

```sql
-- ── BASIC DB DEADLOCK ──
-- Transaction 1:
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- lock row 1
-- (paused)
UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- waits row 2

-- Transaction 2 (concurrent):
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 2;   -- lock row 2
-- (paused)
UPDATE accounts SET balance = balance + 50 WHERE id = 1;   -- waits row 1!

-- T1 holds row 1, waits row 2
-- T2 holds row 2, waits row 1
-- DATABASE detects deadlock, kills victim transaction (usually T2)
-- T2 gets: ERROR 1213: Deadlock found when trying to get lock; try restarting transaction
```

```java
// ── JAVA: Handle DB Deadlock với @Retryable ──
@Service
public class OrderService {

    @Retryable(
        value = {
            DeadlockLoserDataAccessException.class,   // MySQL InnoDB
            CannotAcquireLockException.class          // PostgreSQL, SQL Server
        },
        maxAttempts = 3,
        backoff = @Backoff(delay = 100, multiplier = 2, random = true)
    )
    @Transactional
    public Order createOrder(CreateOrderRequest req) {
        // Automatically retried on deadlock!
        Order order = buildOrder(req);
        orderRepository.save(order);
        inventoryService.decrementStock(req.getItems());
        return order;
    }

    @Recover
    public Order handleDeadlockExhausted(DeadlockLoserDataAccessException ex,
                                          CreateOrderRequest req) {
        log.error("Order creation failed after retries: {}", ex.getMessage());
        throw new ServiceUnavailableException("System busy, please try again");
    }
}

// ── OPTIMISTIC LOCKING: tránh row locks → tránh DB deadlock ──
@Entity
class Product {
    @Id Long id;
    int stock;

    @Version           // JPA version field!
    int version;       // auto-incremented mỗi UPDATE
}

// Không cần FOR UPDATE → không row locks → không deadlock!
// Nếu concurrent update: OptimisticLockException → retry
@Transactional
@Retryable(value = OptimisticLockingFailureException.class)
public void decrementStock(Long productId, int qty) {
    Product p = productRepository.findById(productId).orElseThrow();
    if (p.getStock() < qty) throw new InsufficientStockException();
    p.setStock(p.getStock() - qty);
    productRepository.save(p);  // throws OptimisticLockingFailureException if version changed
}

// ── ATOMIC SQL: best approach cho stock check ──
@Modifying
@Transactional
@Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty")
int decrementStockAtomic(@Param("id") Long id, @Param("qty") int qty);
// Returns: 1=success, 0=out of stock
// Atomic! No check-then-update race condition!

// ── CONSISTENT ACCESS ORDER trong transactions ──
@Transactional
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    // ALWAYS fetch lower ID first — same as lock ordering!
    Long lowId  = Math.min(fromId, toId);
    Long highId = Math.max(fromId, toId);

    // FOR UPDATE = acquire row lock immediately
    Account low  = repo.findByIdWithLock(lowId);   // @Lock(PESSIMISTIC_WRITE)
    Account high = repo.findByIdWithLock(highId);  // same order every time!

    Account from = fromId.equals(lowId) ? low : high;
    Account to   = toId.equals(lowId)   ? low : high;

    from.setBalance(from.getBalance().subtract(amount));
    to.setBalance(to.getBalance().add(amount));
}
```

---

# 9. Deadlock trong Distributed Systems

## 9.1 Distributed Deadlock Scenarios

```
DISTRIBUTED DEADLOCK: circular dependency across services

VÍ DỤ:
  Service A holds DB Lock on Table1, calls Service B
  Service B holds DB Lock on Table2, calls Service A
  A waits for B, B waits for A → DISTRIBUTED DEADLOCK

2-PHASE COMMIT DEADLOCK:
  Coordinator: sends Prepare to all participants
  All participants: hold locks, reply "Ready"
  Coordinator CRASHES before sending Commit!
  Participants: stuck holding locks FOREVER!
  Solution: Saga pattern (no 2PC), eventually consistent operations
```

```java
// ── TIMEOUT mọi external call ──
@Configuration
public class HttpClientConfig {
    @Bean
    public RestTemplate restTemplate() {
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(3_000);           // 3s to connect
        factory.setConnectionRequestTimeout(1_000); // 1s from pool
        factory.setReadTimeout(10_000);             // 10s to read
        return new RestTemplate(factory);
    }
}

// ── CIRCUIT BREAKER ──
@Service
public class InventoryService {

    @CircuitBreaker(name = "inventory", fallbackMethod = "fallbackReserve")
    @TimeLimiter(name = "inventory")  // timeout
    public CompletableFuture<Boolean> reserve(ReservationRequest req) {
        return CompletableFuture.supplyAsync(() -> inventoryClient.reserve(req));
    }

    public CompletableFuture<Boolean> fallbackReserve(ReservationRequest req, Throwable ex) {
        log.warn("Inventory unavailable, queuing for retry", ex);
        retryQueue.offer(req);
        return CompletableFuture.completedFuture(false);
    }
}

// ── SAGA PATTERN thay 2PC ──
@Service
public class CreateOrderSaga {

    public void execute(CreateOrderRequest req) {
        Order order = null;
        boolean inventoryReserved = false;

        try {
            // Step 1:
            order = orderService.createOrder(req);

            // Step 2:
            inventoryReserved = inventoryService.reserve(order.getItems());
            if (!inventoryReserved) {
                orderService.cancelOrder(order.getId());  // compensate
                throw new InsufficientInventoryException();
            }

            // Step 3:
            Payment payment = paymentService.charge(order.getTotal());
            if (!payment.isSuccess()) {
                inventoryService.release(order.getItems());  // compensate
                orderService.cancelOrder(order.getId());     // compensate
                throw new PaymentFailedException();
            }

            orderService.confirmOrder(order.getId());

        } catch (Exception e) {
            // Compensating transactions called above
            log.error("Saga failed", e);
            throw e;
        }
    }
}
```

---

# 10. Real-World Case Studies

## 10.1 Case: Logger Deadlock

```java
// Log4j 1.x nổi tiếng có deadlock issue:

// Scenario: custom Appender gọi logger từ trong append():
class CustomAppender extends AppenderSkeleton {
    @Override
    protected void append(LoggingEvent event) {
        // Log4j holds internal lock while calling append()
        logger.debug("Appending: " + event.getMessage());
        // logger.debug tries to acquire SAME internal lock → DEADLOCK!
    }
}

// Shutdown hook deadlock:
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    logger.info("Shutting down...");
    // JVM shutdown holds ClassLoader lock
    // logger.info may need to load class → needs ClassLoader lock
    // DEADLOCK!
}));

// FIX: Log4j 2 (rewritten, no such issues)
// FIX: Không log trong log appenders
// FIX: Không load classes trong shutdown hooks
```

## 10.2 Case: HashMap Infinite Loop (Java 7)

```java
// Java 7 HashMap KHÔNG thread-safe!
// Concurrent access trong resize() → circular linked list
// get() loops FOREVER → CPU 100%!

class BadSessionMap {
    private final Map<String, Session> sessions = new HashMap<>();  // ← NOT thread-safe!

    public void put(String token, Session session) {
        sessions.put(token, session);  // RACE during resize → circular list!
    }

    public Session get(String token) {
        return sessions.get(token);  // MAY LOOP FOREVER!
        // while (e.hash != hash || !key.equals(e.key)) e = e.next;
        // e.next points back to e → infinite loop!
    }
}

// ✅ FIX: ConcurrentHashMap
private final Map<String, Session> sessions = new ConcurrentHashMap<>();
```

## 10.3 Case: @Transactional Self-Call Deadlock

```java
@Service
public class OrderService {

    // Calls itself indirectly → proxy bypass → transaction issue
    @Transactional
    public void processOrders(List<Long> orderIds) {
        for (Long id : orderIds) {
            // this.processSingleOrder() → calls real object, bypasses proxy!
            // If processSingleOrder needs REQUIRES_NEW → doesn't get new transaction
            // Both run in same transaction → same connection → potential deadlock
            this.processSingleOrder(id);  // ← self-call bypasses @Transactional!
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processSingleOrder(Long id) {
        // Intended to run in NEW transaction (separate connection)
        // But called via this → no proxy → runs in SAME transaction!
        // If processSingleOrder acquires row lock A and processOrders holds lock B
        // → potential deadlock within same transaction!
    }
}

// ✅ FIX: inject self
@Service
public class FixedOrderService {

    @Autowired
    private FixedOrderService self;  // inject proxy

    @Transactional
    public void processOrders(List<Long> orderIds) {
        for (Long id : orderIds) {
            self.processSingleOrder(id);  // calls PROXY → @Transactional works!
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processSingleOrder(Long id) {
        // Actually runs in new transaction now!
    }
}
```

---

# 11. Testing & Tools

## 11.1 Writing Deadlock Tests

```java
@Test
class DeadlockTest {

    // ── TEST KHÔNG DEADLOCK TRONG GIỚI HẠN THỜI GIAN ──
    @Test
    @Timeout(value = 5, unit = TimeUnit.SECONDS)  // fail nếu chạy > 5s
    void transfer_shouldNotDeadlock() throws Exception {
        BankAccount a1 = new BankAccount(1, 1000);
        BankAccount a2 = new BankAccount(2, 1000);

        int THREADS = 50;
        ExecutorService executor = Executors.newFixedThreadPool(THREADS);
        CountDownLatch latch = new CountDownLatch(THREADS);
        AtomicInteger errors = new AtomicInteger(0);

        for (int i = 0; i < THREADS; i++) {
            final int threadId = i;
            executor.submit(() -> {
                try {
                    for (int j = 0; j < 100; j++) {
                        // Alternate directions để maximize deadlock probability:
                        if (threadId % 2 == 0)
                            BankAccount.transfer(a1, a2, 1);
                        else
                            BankAccount.transfer(a2, a1, 1);
                    }
                } catch (Exception e) {
                    errors.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean completed = latch.await(4, TimeUnit.SECONDS);
        executor.shutdownNow();

        assertThat(completed).as("Transfers should complete without deadlock").isTrue();
        assertThat(errors.get()).isZero();
        assertThat(a1.getBalance() + a2.getBalance()).isEqualTo(2000);
    }

    // ── STRESS TEST nhiều lần ──
    @RepeatedTest(100)  // chạy 100 lần để catch intermittent deadlocks
    @Timeout(2)
    void concurrentAccess_shouldComplete() throws Exception {
        SharedResource resource = new SharedResource();
        var executor = Executors.newFixedThreadPool(10);
        var latch = new CountDownLatch(100);

        for (int i = 0; i < 100; i++) {
            executor.submit(() -> {
                resource.operation();
                latch.countDown();
            });
        }

        assertThat(latch.await(1, TimeUnit.SECONDS))
            .as("All operations should complete").isTrue();
        executor.shutdown();
    }

    // ── VERIFY DEADLOCK DETECTION WORKS ──
    @Test
    @Timeout(10)
    void deadlockDetector_shouldFindDeadlock() throws InterruptedException {
        Object lock1 = new Object(), lock2 = new Object();
        CountDownLatch ready = new CountDownLatch(2);

        new Thread(() -> {
            synchronized (lock1) {
                ready.countDown();
                try { Thread.sleep(200); } catch (InterruptedException e) {}
                synchronized (lock2) {}
            }
        }).start();

        new Thread(() -> {
            synchronized (lock2) {
                ready.countDown();
                try { Thread.sleep(200); } catch (InterruptedException e) {}
                synchronized (lock1) {}
            }
        }).start();

        ready.await();
        Thread.sleep(500);  // let deadlock establish

        ThreadMXBean tmx = ManagementFactory.getThreadMXBean();
        assertThat(tmx.findDeadlockedThreads()).isNotNull().hasSize(2);
    }
}
```

## 11.2 Production Tools

```bash
# ── RUNTIME TOOLS ──

# Arthas (Alibaba — best for production debugging):
java -jar arthas-boot.jar <pid>
> thread -b             # find threads blocked on locks
> thread -b -i 3        # monitor every 3 seconds
> thread -n 3           # top 3 CPU-intensive threads
> monitor -c 5 com.example.OrderService createOrder  # method monitoring

# Async-profiler (low overhead, production-safe):
./profiler.sh -d 60 -e lock -f /tmp/lock-profile.html <pid>
# Shows: lock contention, wait times, which methods block most

# JFR (Java Flight Recorder, built-in JDK):
jcmd <pid> JFR.start name=deadlock duration=60s filename=/tmp/rec.jfr
# Analyze với JDK Mission Control

# ── STATIC ANALYSIS ──

# SpotBugs (compile-time detection):
# Detects:
#   - Field accessed with and without synchronization (inconsistent sync)
#   - Wrong lazy initialization (DCL without volatile)
#   - Lock not released in finally block
#   - Wait() not in while loop (spurious wakeup not handled)

mvn spotbugs:check  # or IntelliJ SpotBugs plugin

# ── PROMETHEUS METRICS (alerting) ──
# Custom metric via ThreadMXBean:
@Component
public class DeadlockMetrics {
    private final ThreadMXBean tmx = ManagementFactory.getThreadMXBean();

    @Scheduled(fixedDelay = 5000)
    public void recordMetrics() {
        long[] ids = tmx.findDeadlockedThreads();
        int deadlockCount = ids != null ? ids.length : 0;
        meterRegistry.gauge("jvm.threads.deadlocked", deadlockCount);

        if (deadlockCount > 0) {
            log.error("DEADLOCK: {} threads deadlocked!", deadlockCount);
            // Alert: PagerDuty, Slack, etc.
        }
    }
}

# Grafana alert:
# jvm_threads_deadlocked > 0 → CRITICAL ALERT!
# jvm_threads_states{state="blocked"} > 20 → WARNING

# ── JCSTRESS (concurrency stress testing) ──
# @JCStressTest annotation
# Finds memory visibility, atomicity violations
# Run: java -jar jcstress.jar -t YourTest
```

---

## 📎 Deadlock Quick Reference

```
ĐỊNH NGHĨA:     Circular wait — mỗi thread chờ tài nguyên thread khác đang giữ

4 CONDITIONS (cần ĐỦ CẢ 4):
  1. Mutual Exclusion   — tài nguyên không thể share
  2. Hold and Wait      — giữ resource A, chờ resource B
  3. No Preemption      — không thể lấy lock mạnh
  4. Circular Wait      — T1→T2→...→T1

PHÒNG TRÁNH (phá 1 trong 4 conditions):
  Lock Ordering:    always acquire theo thứ tự nhất quán (phá Condition 4)
  TryLock+Timeout:  tryLock(100ms) → fail → retry với backoff (phá Condition 3)
  Open Calls:       không gọi alien methods khi giữ lock (phá Condition 2)
  Lock-Free:        AtomicXxx, CAS → không cần locks (phá Condition 1)

PHÁT HIỆN:
  Runtime:          ThreadMXBean.findDeadlockedThreads()
  Thread dump:      jstack <pid> | look for "Found 1 deadlock"
  Thread state:     BLOCKED trên lock held by another BLOCKED thread
  Monitoring:       scheduled check mỗi 5s, alert nếu > 0

PHỤC HỒI:
  Interrupt:        thread.interrupt() (thread phải handle properly!)
  Restart:          graceful restart → K8s auto-restarts pod
  TryLock timeout:  tự động fail-fast và retry

COMMON JAVA MISTAKES:
  Nested sync diff order:  synchronized(A) { synchronized(B) } vs ngược lại
  Alien in lock:           gọi external method khi giữ lock
  Thread pool exhaustion:  task giữ thread, submit task khác, không có thread còn
  @Async + .get():         block thread pool trong @Async method
  Spring event + TX:       @EventListener reads data locked by publishing TX

DB DEADLOCK:
  @Version (optimistic):   no row locks → no deadlock, sử dụng WHEN có thể
  @Retryable:              auto retry on DeadlockLoserDataAccessException
  Atomic SQL:              UPDATE WHERE condition → avoid check-then-update
  Access order:            always access rows theo cùng thứ tự (lower ID first)

TOOLS:
  Arthas: thread -b          # blocked threads at runtime
  jstack <pid>               # thread dump
  SpotBugs:                  # static analysis for sync issues
  @Timeout (JUnit 5):        # test sẽ fail nếu deadlock
  @RepeatedTest(100):        # stress test để catch intermittent deadlocks
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Java Concurrency in Practice | <https://jcip.net/> |
| ThreadMXBean | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/lang/management/ThreadMXBean.html> |
| ReentrantLock | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html> |
| java.util.concurrent.locks | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/util/concurrent/locks/package-summary.html> |
| JCStress | <https://openjdk.org/projects/code-tools/jcstress/> |
| SpotBugs | <https://spotbugs.readthedocs.io/> |
| Arthas | <https://arthas.aliyun.com/doc/en/> |
| Coffman 1971 Paper | <https://dl.acm.org/doi/10.1145/356586.356588> |
| Virtual Threads | <https://openjdk.org/jeps/444> |
| Jenkov Deadlock | <https://jenkov.com/tutorials/java-concurrency/deadlock.html> |

---

*Học theo thứ tự: 4 Coffman Conditions → Object Lock Deadlock → Thread Pool Deadlock → Detection (ThreadMXBean + jstack) → Prevention (Lock Ordering) → TryLock Timeout → Spring Event TX Pattern → DB Deadlock → Case Studies*
