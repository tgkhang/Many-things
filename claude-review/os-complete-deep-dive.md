# 💻 Operating Systems — Complete Deep Dive
>
> Kernel, Scheduling, Memory, Processes, Threads, File Systems, Security

---

## 📚 Table of Contents

1. [OS Overview & Architecture](#1-os-overview--architecture)
2. [Kernel](#2-kernel)
3. [Process Management](#3-process-management)
4. [CPU Scheduling](#4-cpu-scheduling)
5. [Threads & Concurrency](#5-threads--concurrency)
6. [Memory Management](#6-memory-management)
7. [Virtual Memory & Paging](#7-virtual-memory--paging)
8. [Interprocess Communication (IPC)](#8-interprocess-communication-ipc)
9. [File System](#9-file-system)
10. [I/O Management](#10-io-management)
11. [Permissions & Security](#11-permissions--security)
12. [System Calls — Code Interacts with OS](#12-system-calls--code-interacts-with-os)
13. [Linux Internals](#13-linux-internals)

---

# 1. OS Overview & Architecture

## 1.1 What is an Operating System?

```
OS = software layer between hardware and user applications

Without OS:
  Your program phải tự quản lý RAM, tự nói chuyện với disk,
  tự xử lý keyboard, tự chia sẻ CPU với programs khác...
  → Impossible để build complex applications

With OS:
  OS abstracts hardware → uniform API cho applications
  OS manages resources → fair sharing between programs
  OS enforces security → isolates programs from each other

OS cung cấp:
  Process management  → create, schedule, kill processes
  Memory management   → allocate, protect, virtual memory
  File system         → organize, read/write files
  Device drivers      → abstract hardware differences
  Networking stack    → TCP/IP, sockets
  Security            → users, permissions, isolation
  System calls        → API cho user programs
```

## 1.2 OS Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  USER SPACE                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  App 1   │  │  App 2   │  │  App 3   │               │
│  │ (Chrome) │  │ (Java)   │  │ (vim)    │               │
│  └──────────┘  └──────────┘  └──────────┘               │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Standard Libraries (glibc, JVM...)       │ │
│  └────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                System Call Interface                    │  ← boundary
├─────────────────────────────────────────────────────────┤
│                  KERNEL SPACE                           │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐    │
│  │ Process │ │  Memory  │ │   File   │ │  Network  │    │
│  │ Sched.  │ │  Mgmt    │ │  System  │ │  Stack    │    │
│  └─────────┘ └──────────┘ └──────────┘ └───────────┘    │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Device Drivers                        │ │
│  └────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    HARDWARE                             │
│     CPU       RAM       Disk      Network       GPU     │
└─────────────────────────────────────────────────────────┘
```

## 1.3 Kernel Architecture Types

```
── MONOLITHIC KERNEL ──
  Toàn bộ OS services chạy trong kernel space (1 large program)
  File system, device drivers, networking = tất cả trong kernel
  ✅ Fast: no context switching between kernel components
  ✅ Efficient: direct function calls
  ❌ Bug anywhere = kernel crash (BSOD, kernel panic)
  ❌ Large codebase, hard to maintain
  Examples: Linux, macOS XNU (hybrid), older Unix

── MICROKERNEL ──
  Kernel chỉ có: IPC, basic scheduling, basic memory management
  Everything else runs as user-space servers:
    File server, device driver server, network server...
  ✅ More stable: driver crash doesn't crash kernel
  ✅ Easier to extend, port, verify formally
  ❌ Performance: message passing overhead between services
  Examples: Minix, QNX, seL4, Mach

── HYBRID KERNEL ──
  Combination: microkernel base + some services in kernel space
  Examples: Windows NT, macOS XNU

── EXOKERNEL ──
  Research OS: kernel does almost nothing, exposes raw hardware
  Applications implement their own OS abstractions
  Maximum performance, rarely used in practice

── UNIKERNEL ──
  Application + OS compiled together as single image
  No user/kernel separation
  Runs directly on hypervisor
  Tiny, fast, very secure (minimal attack surface)
  Examples: MirageOS, Unikraft
  Used for: embedded, serverless
```

---

# 2. Kernel

## 2.1 Privilege Levels (CPU Rings)

```
CPU Hardware enforces privilege levels:

Ring 0 — Kernel Mode (most privileged)
  Unrestricted access to ALL hardware
  Can execute any CPU instruction
  Can access all memory
  Can configure CPU, interrupts, memory protection

Ring 3 — User Mode (least privileged)
  Restricted: cannot directly access hardware
  Cannot execute privileged instructions (CLI, HLT, IN/OUT...)
  Cannot access other processes' memory
  Cannot modify kernel memory

(Ring 1, 2 — rarely used, hypervisors sometimes use Ring 1)

                Ring 0 (Kernel)
              ┌─────────────────┐
              │  OS Kernel      │ ← full hardware access
              └────────┬────────┘
              Ring 3 (User)
           ┌──┴──────────────┴──┐
           │  User Applications  │ ← restricted access
           └─────────────────────┘

HOW: CPU has a register (CPL — Current Privilege Level)
  0 = kernel mode
  3 = user mode
  Checked on EVERY memory access and instruction execution
```

## 2.2 Kernel Mode vs User Mode

```
USER MODE:
  Process chạy code của mình
  Cố access kernel memory → Segmentation Fault (access violation)
  Cố execute privileged instruction → General Protection Fault
  → Kernel kills the process

KERNEL MODE:
  Entered via: System calls, interrupts, exceptions
  Unlimited power — kernel phải cẩn thận!

CONTEXT SWITCH User → Kernel (System Call):
1. User code executes syscall instruction (x86: SYSCALL, older: INT 0x80)
2. CPU saves user state (registers, instruction pointer, stack pointer)
3. CPU switches to kernel stack
4. CPU sets privilege level = Ring 0
5. Kernel dispatches to appropriate syscall handler
6. Handler executes (with full hardware access)
7. Handler returns
8. CPU restores user state
9. CPU sets privilege level = Ring 3
10. User code continues

Cost: ~100ns per syscall (cheap but adds up if called millions/sec)
Optimization: vDSO (Virtual Dynamic Shared Object) — some syscalls
  implemented in user space mapped by kernel (gettimeofday, clock_gettime)
  → No actual kernel transition needed!
```

## 2.3 Interrupts

```
Interrupt = signal to CPU: "stop what you're doing, handle this event"

── HARDWARE INTERRUPTS ──
  External devices signal CPU via IRQ (Interrupt Request) lines
  Examples:
    Keyboard pressed    → IRQ1  → keyboard ISR
    Network packet arrived → IRQ → network ISR
    Timer tick          → IRQ0  → scheduler ISR
    Disk I/O complete   → IRQ   → disk ISR

  Interrupt Descriptor Table (IDT):
    CPU reads IDT to find ISR (Interrupt Service Routine) address
    Jumps to ISR, runs in kernel mode
    ISR handles interrupt, sends EOI (End Of Interrupt), returns

── SOFTWARE INTERRUPTS (Exceptions) ──
  Generated by CPU for exceptional conditions:
    Division by zero    → exception → kill process or handle
    Page fault          → exception → kernel loads page from disk
    Invalid opcode      → exception → kill process
    Breakpoint (INT3)   → exception → debugger

── SYSTEM CALL INTERRUPT ──
  x86: INT 0x80 (old), SYSCALL instruction (modern, faster)
  ARM: SVC (Supervisor Call) instruction

Interrupt Priority:
  Higher priority interrupts can preempt lower priority
  NMI (Non-Maskable Interrupt) cannot be disabled
  CLI instruction disables maskable interrupts (kernel only!)

Interrupt Latency:
  Time from interrupt → ISR executing
  Realtime OS: guaranteed max latency (e.g., <100μs)
  Linux: NOT realtime by default, PREEMPT_RT patch for realtime
```

---

# 3. Process Management

## 3.1 What is a Process?

```
Process = running instance of a program

Program = passive: executable file on disk (ELF, .exe)
Process = active: program loaded into memory, executing

A process has:
  PID          Process ID (unique number)
  Address space Memory: code, stack, heap, data segments
  CPU state    Registers, program counter, stack pointer
  Open files   File descriptor table
  Resources    Sockets, pipes, signals...
  Privileges   User ID, Group ID, capabilities
  Parent PID   Who created this process

Process Address Space Layout:
┌─────────────────────────────┐ High address
│    Kernel Space             │ (inaccessible from user mode)
├─────────────────────────────┤ 0xC0000000 (32-bit Linux)
│    Stack                    │ ← grows downward
│    (local variables,        │
│     function call frames)   │
│         ↓                   │
│    [unmapped — guard page]  │
│         ↑                   │
│    Heap                     │ ← grows upward
│    (malloc/new allocations) │
├─────────────────────────────┤
│    BSS Segment              │ (uninitialized global vars)
├─────────────────────────────┤
│    Data Segment             │ (initialized global/static vars)
├─────────────────────────────┤
│    Text Segment (Code)      │ (read-only, executable)
└─────────────────────────────┘ Low address (0x0)
```

## 3.2 Process States

```
                  ┌──────────┐
     fork()       │          │
   ─────────────▶ │  NEW     │
                  │          │
                  └────┬─────┘
                       │ admitted (memory allocated)
                       ▼
                  ┌──────────┐
    I/O complete  │          │   scheduler dispatch
    event occurs  │  READY   │ ──────────────────────▶ ┌─────────┐
   ◀────────────  │          │                         │ RUNNING │
                  └──────────┘ ◀────────────────────── └────┬────┘
                                    interrupt / preempt      │
                                    (time slice expired)     │
                                                             │ wait for I/O
                                                             │ sleep()
                                                             │ wait()
                                                             ▼
                                                        ┌──────────┐
                                                        │ WAITING  │
                                                        │ (BLOCKED)│
                                                        └──────────┘
                                                             │
                                                   exit() / kill()
                                                             ▼
                                                        ┌──────────┐
                                                        │ TERMINATED│
                                                        │ (ZOMBIE) │
                                                        └──────────┘
                                                             │ parent calls wait()
                                                             ▼
                                                          cleaned up

ZOMBIE Process: process finished but parent hasn't read exit status
  → Entry stays in process table
  → Fix: parent must call wait()/waitpid()
  → If parent dies: init/systemd adopts zombie, reaps it

ORPHAN Process: parent dies before child
  → init (PID 1) or subreaper adopts it
```

## 3.3 Process Creation — fork() and exec()

```c
// UNIX process creation model

// fork() — creates exact copy of current process
pid_t pid = fork();

if (pid < 0) {
    // Error
    perror("fork failed");
} else if (pid == 0) {
    // CHILD process
    // pid == 0 in child
    printf("I am child, my PID: %d\n", getpid());
    printf("My parent's PID: %d\n", getppid());

    // exec() — replace process image with new program
    // Child becomes a completely different program
    execl("/bin/ls", "ls", "-la", NULL);
    // Code after exec() never runs if exec succeeds!
    perror("exec failed");
    exit(1);
} else {
    // PARENT process
    // pid = child's PID
    printf("I am parent, child PID: %d\n", pid);

    // Wait for child to finish
    int status;
    waitpid(pid, &status, 0);
    printf("Child exited with: %d\n", WEXITSTATUS(status));
}

// Copy-on-Write (COW) optimization in fork():
// After fork(), parent + child share SAME physical memory pages
// Pages marked read-only
// Only when either process WRITES → OS copies that page
// → fork() is very fast even for large processes
// → Only modified pages are duplicated
```

## 3.4 Process Control Block (PCB)

```
PCB = data structure OS uses to track each process

struct process_control_block {
    // Identity
    pid_t   pid;           // process ID
    pid_t   ppid;          // parent process ID
    uid_t   uid, euid;     // user ID, effective user ID
    gid_t   gid, egid;     // group ID, effective group ID

    // CPU state (saved when process is NOT running)
    struct cpu_context {
        uint64_t rip;      // instruction pointer
        uint64_t rsp;      // stack pointer
        uint64_t rbp;      // base pointer
        uint64_t rax, rbx, rcx, rdx;  // general registers
        uint64_t rflags;   // CPU flags
        // ... all other registers
    } context;

    // State
    enum process_state state;  // RUNNING, READY, BLOCKED...
    int exit_code;

    // Memory
    struct mm_struct *mm;  // virtual memory descriptor
    // page tables, memory maps...

    // Scheduling
    int priority;
    int nice;              // -20 (highest) to +19 (lowest)
    uint64_t time_slice;   // remaining time quantum
    uint64_t total_cpu_time;
    struct timespec last_run;

    // File system
    struct file *open_files[MAX_FD];  // file descriptor table
    struct fs_struct *fs;  // root dir, working dir

    // Signals
    sigset_t blocked_signals;
    struct sigaction signal_handlers[NSIG];
    sigset_t pending_signals;

    // Linked list pointers
    struct pcb *next;      // next in run queue
};
```

---

# 4. CPU Scheduling

> 📖 Process Scheduling is how OS decides WHICH process runs WHEN

## 4.1 Scheduling Goals

```
Throughput     : maximize processes completed per unit time
Turnaround time: minimize time from submission to completion
Response time  : minimize time from request to first response (interactive)
Waiting time   : minimize time spent in ready queue
CPU utilization: keep CPU busy
Fairness       : each process gets fair share of CPU

Trade-offs:
  Optimize throughput → batch/long jobs favored → bad interactivity
  Optimize response time → frequent context switches → overhead
  Preemptive vs Non-preemptive:
    Non-preemptive: process runs until blocks or yields (cooperative)
    Preemptive: OS can interrupt running process (timer interrupt)
```

## 4.2 Scheduling Algorithms

```
── FCFS (First Come First Served) ──
  Queue: non-preemptive
  Processes run in order of arrival

  Arrival: P1(0, 24ms), P2(1, 3ms), P3(2, 3ms)
  0────────────────────24──27──30
  P1(24ms)             P2  P3

  Waiting: P1=0, P2=23, P3=25, Avg=16ms
  ❌ Convoy effect: short jobs wait behind long jobs

── SJF (Shortest Job First) ──
  Run job with shortest burst time next
  Optimal average waiting time (provably)
  Non-preemptive: run to completion once started
  Preemptive version: SRTF (Shortest Remaining Time First)

  Arrival: P1(0, 6ms), P2(1, 8ms), P3(2, 7ms), P4(3, 3ms)
  0──3──6─────9──────────16────────24
  P4  P1      P3          P2

  ❌ Starvation: long jobs may never run if short jobs keep arriving
  ❌ Need to know burst time in advance (use prediction/history)

── Priority Scheduling ──
  Each process has priority number
  Higher priority → runs first
  Can be preemptive or non-preemptive

  Static priority: fixed at creation
  Dynamic priority: changes based on behavior/age

  ❌ Starvation: low-priority processes may starve
  ✅ Aging fix: gradually increase priority of waiting processes

── Round Robin (RR) ──
  Time quantum q (typically 10-100ms)
  Each process gets q time, then preempted, goes to back of queue
  Designed for time-sharing systems

  q=4: P1(24), P2(3), P3(3)
  0────4────7────10───14───18───22──24──26──28
  P1   P2   P3   P1   P1   P1  P2  P3  P1
       (done)(done)                (done)(done)(done)

  ✅ Fair, responsive, good for interactive
  ❌ Context switch overhead if q too small
  ❌ High average turnaround time if q too large

  Trade-off: q → 0 = pseudo-parallel, q → ∞ = FCFS

── Multilevel Queue Scheduling ──
  Separate queues for different process categories:
    Queue 1: Interactive (foreground, terminal)  → RR, high priority
    Queue 2: Background (batch)                  → FCFS, low priority
    Queue 3: System processes                    → highest priority

  Processes cannot move between queues

── Multilevel Feedback Queue (MLFQ) ──
  Multiple queues with different priorities
  Processes can MOVE between queues based on behavior
  Most sophisticated, used in modern OS

  Rules:
    1. Higher queue = higher priority
    2. New process starts at highest priority queue
    3. If process uses full time quantum → demote to lower queue
       (assumed CPU-bound, give it lower priority)
    4. If process yields before quantum → stays in same queue
       (assumed I/O-bound, keep high priority)
    5. Periodically boost all processes to top queue (prevent starvation)

  Result:
    Short/interactive jobs stay at top (responsive)
    Long CPU-bound jobs sink to bottom (throughput)
    Fair: periodic boost prevents starvation
    Adapts: I/O-bound treated differently than CPU-bound

  Used by: Windows, Linux (CFS approximates this)
```

## 4.3 Linux CFS — Completely Fair Scheduler

```
CFS goal: each process gets exactly 1/n of CPU time
(n = number of runnable processes)

Key concept: Virtual Runtime (vruntime)
  vruntime = actual runtime × (default_weight / process_weight)
  Processes with LOWER vruntime run next (most unfair = needs to catch up)

Red-Black Tree (self-balancing BST):
  All runnable processes stored in RB-tree
  Ordered by vruntime
  Leftmost node = process with lowest vruntime = next to run
  O(log n) insert/delete, O(1) find minimum

Nice values:
  -20 (highest priority) to +19 (lowest priority)
  Default = 0
  Weight = 1024 / (1.25 ^ nice) approximately
  nice=-20: weight=88761, gets more CPU time per cycle
  nice=+19: weight=15,    gets less CPU time per cycle

Time accounting:
  Every scheduler tick (typically 1ms or 4ms):
    Update current process's vruntime
    If leftmost node vruntime < current vruntime → preempt, switch

Latency target: target_latency (typically 6ms)
  If 6 processes: each gets 1ms per 6ms cycle
  If 1 process: runs for full latency period

Min granularity: minimum time slice (typically 0.75ms)
  Prevent excessive context switching

$ nice -n -5 ./myprogram   # run with higher priority
$ renice -n 10 -p 1234     # change priority of running process
$ chrt -f 99 ./realtime    # set realtime priority (FIFO scheduling)
```

## 4.4 Real-Time Scheduling

```
Real-Time OS requirements:
  Hard RT: MUST meet deadline (medical devices, aircraft, ABS brakes)
  Soft RT: SHOULD meet deadline (video playback, games)

RT Scheduling policies (Linux):
  SCHED_FIFO:  RT, no time slice, runs until blocks or higher RT preempts
  SCHED_RR:    RT, with time slice
  SCHED_DEADLINE: sporadic tasks with explicit deadline/period/runtime

Priority range:
  RT tasks: 1-99 (higher = more important)
  Normal tasks: mapped to -20..+19 nice values
  RT tasks ALWAYS preempt normal tasks!

$ chrt -f 50 ./critical-task    # FIFO, priority 50
$ chrt -r 30 ./periodic-task    # Round-robin, priority 30

Linux PREEMPT_RT patch:
  Makes Linux fully preemptible (even within kernel!)
  Converts spinlocks to mutexes
  Used in: industrial control, audio production, robotics
```

## 4.5 Multiprocessor Scheduling

```
SMP (Symmetric Multiprocessing):
  Multiple CPUs, each can access all memory
  OS schedules processes on any CPU
  Single shared run queue (simple but lock contention)
  Or per-CPU run queues (complex but scalable)

Load Balancing:
  Periodically migrate processes between CPUs
  Goal: all CPUs equally busy
  Cost: cache invalidation when migrating (cache is warm on original CPU)

CPU Affinity:
  Pin process to specific CPU(s)
  Better cache performance
  $ taskset -c 0,1 ./myprogram    # run only on CPU 0 and 1
  $ taskset -c 2 -p 1234          # pin process 1234 to CPU 2

NUMA (Non-Uniform Memory Access):
  Multi-socket servers: each CPU has local RAM (fast) + remote RAM (slow)
  NUMA-aware scheduler: prefer processes run on CPU near their memory
  $ numactl --cpunodebind=0 --membind=0 ./myprogram

Cache Hierarchy consideration:
  L1 cache: 32-64KB, 1-4 cycles, per-core
  L2 cache: 256KB-1MB, 4-12 cycles, per-core
  L3 cache: 4-64MB, 30-60 cycles, shared (per socket)
  RAM: 60-100 cycles for L3 miss
  Context switch = cache pollution → cold start on next run
```

---

# 5. Threads & Concurrency

## 5.1 Process vs Thread

```
PROCESS:
  Separate address space
  Separate heap, stack, code, data segments
  Expensive to create (copy address space)
  Expensive context switch (flush TLB, reload page tables)
  Communication via IPC (pipes, sockets, shared memory)
  One process crash doesn't affect others

THREAD (within a process):
  Shared address space (same heap, code, data)
  SEPARATE stack per thread (own local variables)
  Lightweight to create (~10x faster than process)
  Fast context switch (same address space, no TLB flush)
  Communication via shared memory (but need synchronization!)
  One thread crash → entire process crashes
  
  Thread has its own:
    Stack + stack pointer
    Registers (including instruction pointer)
    Thread ID
    errno variable
    Signal mask
    Thread-local storage (TLS)
```

## 5.2 User-Level vs Kernel-Level Threads

```
USER-LEVEL THREADS (Green Threads):
  Managed by user-space library (not OS)
  OS sees only 1 kernel thread (the process)
  Thread library multiplexes onto single kernel thread

  ✅ Very fast create/switch (no syscall needed)
  ✅ Custom scheduling possible
  ❌ If one thread blocks (I/O) → ALL threads block
  ❌ Can't run truly parallel on multiple CPUs
  Examples: old Java green threads, early Go goroutines

KERNEL-LEVEL THREADS:
  OS knows about and manages each thread
  Each thread can run on different CPU core
  OS schedules threads directly

  ✅ True parallelism on multicore
  ✅ One thread blocks → others continue running
  ❌ Thread create/switch requires syscall (slower than user threads)
  Examples: pthreads, Java threads (modern), Windows threads

HYBRID (M:N model):
  M user threads mapped to N kernel threads
  Thread library manages mapping
  ✅ Best of both worlds
  ❌ Complex to implement correctly
  Examples: Go goroutines (M goroutines on N OS threads)

── Go Goroutines (M:N) ──
  Goroutine: user-space, ~2KB initial stack (grows dynamically)
  OS Thread: 1MB+ stack, expensive
  Go runtime: schedules goroutines onto OS threads (GOMAXPROCS threads)
  When goroutine blocks on I/O: thread takes another goroutine
  → Can run millions of goroutines!
```

## 5.3 Synchronization Primitives

```c
// ── MUTEX (Mutual Exclusion) ──
// Only 1 thread in critical section at a time

pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

void withdraw(double amount) {
    pthread_mutex_lock(&lock);
    // CRITICAL SECTION — only 1 thread here
    if (balance >= amount) {
        balance -= amount;
    }
    pthread_mutex_unlock(&lock);
    // outside critical section
}

// Mutex types:
// NORMAL:    deadlock if same thread locks twice
// RECURSIVE: same thread can lock multiple times (must unlock same # times)
// ERRORCHECK: returns error instead of deadlock

// ── SPINLOCK ──
// Busy-wait instead of sleeping
// Better when lock held very briefly (< ~1000 cycles)
// Wastes CPU while spinning — bad if lock held for long time
pthread_spinlock_t spinlock;
pthread_spin_lock(&spinlock);
// critical section (should be VERY short!)
pthread_spin_unlock(&spinlock);

// ── SEMAPHORE ──
// Counting: allows N concurrent access (N > 1 unlike mutex)
// Binary semaphore ≈ mutex
sem_t semaphore;
sem_init(&semaphore, 0, 3);  // allows 3 concurrent threads

sem_wait(&semaphore);        // P operation: decrement, block if 0
// use resource
sem_post(&semaphore);        // V operation: increment, wake waiter

// Use case: connection pool with max 10 connections
sem_t pool_sem;
sem_init(&pool_sem, 0, 10);

Connection* get_connection() {
    sem_wait(&pool_sem);     // blocks if all 10 in use
    return pool.take();
}
void return_connection(Connection* c) {
    pool.put(c);
    sem_post(&pool_sem);
}

// ── CONDITION VARIABLE ──
// Wait for condition, atomically release mutex
// Used with mutex
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
int ready = 0;

// Thread 1 (waiter)
pthread_mutex_lock(&mutex);
while (!ready) {                          // ALWAYS use while, not if!
    pthread_cond_wait(&cond, &mutex);     // atomically: unlock mutex + sleep
    // When woken: mutex is re-acquired
}
// condition is now true, do work
pthread_mutex_unlock(&mutex);

// Thread 2 (signaler)
pthread_mutex_lock(&mutex);
ready = 1;
pthread_cond_signal(&cond);    // wake one waiter
// pthread_cond_broadcast(&cond); // wake ALL waiters
pthread_mutex_unlock(&mutex);

// ── READ-WRITE LOCK ──
// Multiple readers OR one writer
pthread_rwlock_t rwlock = PTHREAD_RWLOCK_INITIALIZER;

void read_data() {
    pthread_rwlock_rdlock(&rwlock);    // shared read lock
    // multiple threads can be here simultaneously
    pthread_rwlock_unlock(&rwlock);
}

void write_data() {
    pthread_rwlock_wrlock(&rwlock);    // exclusive write lock
    // only 1 thread can be here
    pthread_rwlock_unlock(&rwlock);
}
```

## 5.4 Deadlock

```
Deadlock conditions (ALL 4 must hold simultaneously):
  1. Mutual Exclusion : resources cannot be shared
  2. Hold and Wait    : process holds resource while waiting for another
  3. No Preemption    : resources cannot be forcibly taken
  4. Circular Wait    : P1 waits for P2, P2 waits for P1 (cycle)

Example:
  Thread A: lock(mutex1) → try lock(mutex2) → waiting...
  Thread B: lock(mutex2) → try lock(mutex1) → waiting...
  Both waiting forever!

Resource Allocation Graph:
  Cycle in graph → deadlock possible (definitely if one instance per resource)

Prevention (break one condition):
  No mutual exclusion: use lock-free data structures
  No hold and wait:    acquire ALL locks at once, or release before acquiring more
  Allow preemption:    if can't get all, release what you have
  No circular wait:    always acquire locks in SAME global order!

Detection + Recovery:
  Let deadlock happen, detect cycle in resource graph
  Recovery: kill a process, rollback transaction, preempt resource

Banker's Algorithm (Avoidance):
  Before granting resource, check if "safe state" still reachable
  Safe state: some ordering exists where all processes can finish
  Rarely used in practice (too conservative, overhead)

Practical prevention (Java example):
  // Always lock in same order: accountA.id < accountB.id first
  void transfer(Account from, Account to, double amount) {
      Account first  = from.id < to.id ? from : to;
      Account second = from.id < to.id ? to : from;
      synchronized(first) {
          synchronized(second) {
              from.withdraw(amount);
              to.deposit(amount);
          }
      }
  }
```

---

# 6. Memory Management

## 6.1 Memory Hierarchy

```
                Speed      Size       Cost/GB
L1 Cache    < 1ns        32-64 KB    Extreme
L2 Cache    1-4ns        256KB-1MB   Very High
L3 Cache    10-40ns      4-64 MB     High
RAM (DRAM)  60-100ns     4GB-TB      ~$5
NVMe SSD    100-500μs    500GB-8TB   ~$0.10
SATA SSD    500μs-1ms    500GB-8TB   ~$0.05
HDD         5-10ms       1-20TB      ~$0.02
Tape        minutes      PB+         ~$0.001

Memory latency differences:
  L1 hit : 4 cycles
  L2 hit : 12 cycles
  L3 hit : 40 cycles
  RAM    : 200 cycles (L3 miss → DRAM)
  SSD    : 100,000 cycles
  HDD    : 50,000,000 cycles

IMPLICATION: cache-friendly code can be 10-100x faster!
```

## 6.2 Memory Allocation

```
── STATIC ALLOCATION ──
  Size known at compile time
  Global variables, static variables
  Allocated at program start, lives until exit
  Example: static int counter = 0;

── STACK ALLOCATION ──
  Local variables in functions
  Allocated on function entry, freed on function exit
  Very fast: just move stack pointer
  Limited size (default 1-8 MB per thread on Linux)
  $ ulimit -s         # check stack size
  $ ulimit -s 16384   # set to 16MB

  Stack overflow: exceed stack limit
    Infinite recursion
    Very large local arrays
    → Segmentation fault

── HEAP ALLOCATION ──
  Dynamic: allocated at runtime with malloc/new
  Lives until explicitly freed (C/C++) or GC collected
  Much larger than stack (limited by RAM + swap)

  malloc() internals:
    First request: asks OS for large chunk (brk/mmap syscall)
    Subsequent: manages chunk internally (free list, buddy system)
    Free: returns to free list (NOT necessarily to OS immediately)

  Common allocators:
    dlmalloc  : glibc default
    jemalloc  : Facebook, used in Firefox, Rust
    tcmalloc  : Google, used in Chrome, high-performance
    mimalloc  : Microsoft, very fast

  // C
  void* p = malloc(1024);
  if (!p) { /* allocation failed */ }
  // use p...
  free(p);  // MUST free or memory leak!
  p = NULL; // prevent use-after-free

  // C++
  int* arr = new int[100];
  delete[] arr;

  // Java, Go, Python: garbage collected — no manual free
```

## 6.3 Memory Fragmentation

```
EXTERNAL FRAGMENTATION:
  Free memory scattered in small pieces
  Can't allocate large contiguous block even if total free > requested

  Example:
  [USED 100B][FREE 50B][USED 200B][FREE 50B][USED 100B][FREE 50B]
  Total free = 150B, but can't allocate 100B contiguous!

  Solutions:
    Compaction: move processes to consolidate free space
                Expensive, requires relocating addresses
    Paging: allocate in fixed-size pages, no need for contiguous

INTERNAL FRAGMENTATION:
  Allocated block larger than requested
  Wasted space within allocated block

  Example: malloc(65) → allocates 96 bytes (alignment)
           31 bytes wasted internally

  Solutions:
    Smaller allocation units
    Slab allocator: pre-allocate pools of specific sizes

── MEMORY ALLOCATOR STRATEGIES ──

First Fit:  scan free list, take first block that fits
  Fast, tends to fragment beginning of memory

Best Fit:   find smallest block that fits
  Less waste, but slower, creates tiny unusable fragments

Worst Fit:  take largest block
  Leaves larger remaining blocks, but wastes space

Next Fit:   like first fit but start from where last allocation left off
  More uniform distribution

Buddy System:
  Memory divided in powers of 2
  Request 100B → allocate 128B block
  If 128B block not available → split 256B block into two 128B buddies
  When freeing: check if buddy also free → merge back
  Fast: merge/split O(log n), good for internal use
  Used in Linux kernel page allocator
```

---

# 7. Virtual Memory & Paging

## 7.1 Why Virtual Memory?

```
Problems without virtual memory:
  1. Programs must fit entirely in RAM
  2. Programs must know actual physical addresses (fragile)
  3. Any program can access any memory (no isolation!)

Virtual Memory provides:
  1. Illusion: each process has its own large address space
                (32-bit: 4GB, 64-bit: 128TB per process)
  2. More processes than RAM: inactive pages stored on disk (swap)
  3. Isolation: each process's virtual addresses → different physical
  4. Sharing: multiple processes can map same physical page
               (shared libraries, copy-on-write after fork)
  5. Security: page protection bits (R/W/X per page)

Virtual Address → Physical Address translation:
  Every memory access → hardware MMU translates
  MMU uses page tables set up by OS
  Translation: TLB cache + page table walk
```

## 7.2 Paging

```
Memory divided into fixed-size PAGES:
  Virtual page  = fixed-size chunk of virtual address space
  Physical frame = fixed-size chunk of physical RAM
  Typical page size: 4KB (x86), 2MB or 1GB (huge pages)

Virtual Address: [Virtual Page Number (VPN) | Page Offset]
  For 4KB pages: offset = 12 bits (2^12 = 4096)
  32-bit address: VPN = top 20 bits, offset = bottom 12 bits

Page Table: maps VPN → PFN (Physical Frame Number)
  One page table per process (stored in kernel memory)
  x86-64: 4-level page table (PML4 → PDPT → PD → PT → Frame)

Address Translation Example:
  Virtual address: 0x00403ABC
  Page size: 4KB = 0x1000

  VPN    = 0x00403ABC >> 12 = 0x403
  Offset = 0x00403ABC & 0xFFF = 0xABC

  Page table[0x403] = frame 0x7F2  (if present)
  Physical address = (0x7F2 << 12) | 0xABC = 0x7F2ABC

Page Table Entry (PTE) contains:
  Physical Frame Number
  Present bit    : 0 = not in RAM (trigger page fault if accessed)
  Dirty bit      : page has been written (needs writeback)
  Accessed bit   : recently used (for page replacement)
  Protection bits: R (read), W (write), X (execute)
  User/Supervisor: accessible from user mode or kernel only?
  Cache disabled : for MMIO regions
```

## 7.3 TLB — Translation Lookaside Buffer

```
Page table walk is expensive: 4 memory accesses for 4-level PT
TLB = hardware cache of recent VPN → PFN translations
     part of MMU (inside CPU)

TLB Hit  (~1 cycle):
  VPN in TLB → get PFN directly → access physical memory

TLB Miss (~20-200 cycles):
  VPN not in TLB → page table walk → update TLB → retry

TLB size: typically 32-2048 entries (very small!)
TLB eviction: LRU or random

Context switch: flush TLB! (different process → different page tables)
  OR: use ASID (Address Space ID) tags — TLB entries tagged with process ID
  AMD64: PCID (Process Context IDentifier) for tagged TLB

HUGE PAGES (Large Pages):
  Default page: 4KB → TLB covers only 4KB × 2048 = 8MB with 2048-entry TLB
  Huge page: 2MB  → TLB covers 2MB × 2048 = 4GB!
  → Much better TLB coverage → fewer TLB misses
  → For large datasets (databases, in-memory caches)
  Linux: Transparent Huge Pages (THP) auto-promotes 4KB → 2MB
  $ echo always > /sys/kernel/mm/transparent_hugepage/enabled
```

## 7.4 Page Fault & Swap

```
Page Fault: process accesses virtual address whose PTE has Present=0
→ CPU triggers page fault exception
→ OS page fault handler runs

Types of page faults:

1. Minor (Soft) Page Fault:
   Page in memory but not mapped in this process's page table
   (e.g., shared library first access, copy-on-write)
   OS just updates page table → very fast

2. Major (Hard) Page Fault:
   Page NOT in memory (on disk in swap space)
   OS must: find free frame (evict if needed) → read page from disk
   Very slow: ~10ms disk access!

3. Invalid Page Fault:
   Access to unmapped virtual address
   → Segmentation Fault (SIGSEGV) → process killed

Page Replacement Algorithms:
  OPT (Optimal):
    Evict page that won't be used for longest time
    Impossible to implement (requires future knowledge)
    Theoretical benchmark

  LRU (Least Recently Used):
    Evict page not used for longest time
    Excellent in practice (temporal locality)
    Expensive to implement exactly (need to track access time per page)

  CLOCK (Second Chance):
    Approximate LRU: circular list of pages
    Each page has "accessed" bit
    If accessed=1: clear bit, give second chance, advance clock hand
    If accessed=0: evict this page
    Used in Linux (with modifications)

  LFU (Least Frequently Used):
    Evict page with lowest access count
    Bad: old frequently-used pages never evicted

Thrashing:
  Process working set > available RAM
  → Constantly page fault → spend more time swapping than executing
  → Performance collapses
  Fix: add RAM, reduce multiprogramming, working set model

Swap Space:
  Area on disk for evicted pages
  Linux: swap partition or swap file
  $ swapon --show           # show current swap
  $ free -h                 # show RAM + swap usage
  
  Swappiness (Linux): 0-100, how aggressively to use swap
  $ cat /proc/sys/vm/swappiness  # usually 60
  $ sysctl vm.swappiness=10      # reduce for servers with lots of RAM
```

---

# 8. Interprocess Communication (IPC)

> 📖 Processes need to communicate. OS provides several mechanisms.

## 8.1 Pipes

```c
// ANONYMOUS PIPE: unidirectional, parent-child only

int pipefd[2];
pipe(pipefd);   // pipefd[0] = read end, pipefd[1] = write end

pid_t pid = fork();
if (pid == 0) {
    // CHILD: write to pipe
    close(pipefd[0]);                  // close unused read end
    write(pipefd[1], "hello", 5);
    close(pipefd[1]);
    exit(0);
} else {
    // PARENT: read from pipe
    close(pipefd[1]);                  // close unused write end
    char buf[100];
    int n = read(pipefd[0], buf, sizeof(buf));
    printf("Got: %.*s\n", n, buf);     // "Got: hello"
    close(pipefd[0]);
    wait(NULL);
}

// Shell pipes: ls -la | grep .txt | wc -l
// Each | creates anonymous pipe between processes

// NAMED PIPE (FIFO): persistent file, unrelated processes
mkfifo("/tmp/mypipe", 0666);  // create

// Process 1
int fd = open("/tmp/mypipe", O_WRONLY);
write(fd, "data", 4);

// Process 2
int fd = open("/tmp/mypipe", O_RDONLY);  // blocks until writer opens
char buf[10];
read(fd, buf, 4);
```

## 8.2 Signals

```c
// Signal = async notification sent to process
// Like software interrupt

Common signals:
  SIGTERM (15): polite kill request, process can handle/ignore
  SIGKILL  (9): force kill, CANNOT be caught/ignored!
  SIGINT   (2): Ctrl+C from terminal
  SIGSTOP (19): pause process (like Ctrl+Z), CANNOT be caught
  SIGCONT (18): resume stopped process
  SIGSEGV (11): invalid memory access → segfault
  SIGALRM (14): alarm timer expired
  SIGUSR1/2:    user-defined signals
  SIGCHLD (17): child process died (sent to parent)
  SIGHUP  (1):  terminal closed, daemon reload config

// Sending signals
kill(pid, SIGTERM);       // send SIGTERM to process
kill(pid, SIGUSR1);       // send custom signal
raise(SIGALRM);           // send signal to self
killpg(pgid, SIGTERM);    // send to process group

// Handling signals
void signal_handler(int signum) {
    if (signum == SIGTERM) {
        printf("Shutting down gracefully...\n");
        cleanup();
        exit(0);
    }
    if (signum == SIGUSR1) {
        printf("Received SIGUSR1, reloading config\n");
        reload_config();
    }
}

struct sigaction sa;
sa.sa_handler = signal_handler;
sigemptyset(&sa.sa_mask);
sa.sa_flags = SA_RESTART;   // restart interrupted syscalls
sigaction(SIGTERM, &sa, NULL);
sigaction(SIGUSR1, &sa, NULL);

// Ignore signal
signal(SIGPIPE, SIG_IGN);   // ignore broken pipe (common for servers)

// Shell: kill -9 1234    → send SIGKILL to PID 1234
//        kill -l         → list all signals
```

## 8.3 Shared Memory & Message Queues

```c
// ── SHARED MEMORY (fastest IPC) ──
// Multiple processes map same physical pages into their address space

#include <sys/shm.h>

// Create/get shared memory segment
key_t key = ftok("/tmp/shmfile", 'R');
int shmid = shmget(key, 4096, IPC_CREAT | 0666);

// Attach to address space
char *data = (char*) shmat(shmid, NULL, 0);

// Use like regular memory
strcpy(data, "hello from process 1");

// Detach
shmdt(data);

// Process 2: shmget same key, shmat → sees "hello from process 1"

// IMPORTANT: shared memory has NO synchronization!
// Must use semaphore or mutex alongside!

// Modern: mmap with MAP_SHARED on a file
int fd = open("/tmp/shared", O_CREAT|O_RDWR, 0666);
ftruncate(fd, 4096);
void *map = mmap(NULL, 4096, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);
strcpy((char*)map, "shared data");
munmap(map, 4096);

// ── MESSAGE QUEUE ──
// Structured messages, preserves message boundaries, kernel-buffered
#include <sys/msg.h>

struct msgbuf {
    long mtype;    // message type (must be > 0)
    char mtext[256];
};

// Send
int msqid = msgget(key, IPC_CREAT | 0666);
struct msgbuf msg = {.mtype = 1, .mtext = "hello"};
msgsnd(msqid, &msg, strlen(msg.mtext)+1, 0);

// Receive (type=1 → only get type-1 messages)
struct msgbuf received;
msgrcv(msqid, &received, sizeof(received.mtext), 1, 0);
printf("%s\n", received.mtext);

// Modern alternative: POSIX message queues (mq_open, mq_send, mq_receive)
```

## 8.4 Sockets

```c
// Sockets: IPC across machines (or same machine)

// TCP Server
int server_fd = socket(AF_INET, SOCK_STREAM, 0);

struct sockaddr_in addr = {
    .sin_family = AF_INET,
    .sin_port = htons(8080),
    .sin_addr.s_addr = INADDR_ANY
};
bind(server_fd, (struct sockaddr*)&addr, sizeof(addr));
listen(server_fd, 10);   // 10 = backlog queue size

while (1) {
    int client_fd = accept(server_fd, NULL, NULL);  // blocks
    char buf[1024];
    int n = read(client_fd, buf, sizeof(buf));
    write(client_fd, buf, n);   // echo back
    close(client_fd);
}

// Unix Domain Sockets: IPC on same machine, faster than TCP
// No network stack overhead, uses filesystem path
int sock = socket(AF_UNIX, SOCK_STREAM, 0);
struct sockaddr_un addr = {
    .sun_family = AF_UNIX,
    .sun_path = "/tmp/myapp.sock"
};
// Used by: Docker daemon, PostgreSQL local connections,
//          systemd socket activation
```

---

# 9. File System

## 9.1 File System Concepts

```
File System = way of organizing data on storage

VFS (Virtual File System): abstraction layer in kernel
  Same read()/write()/open() API works on:
    ext4, btrfs, xfs, ntfs, fat32, tmpfs, procfs, sysfs...
  Application doesn't know which FS it's using!

Inode:
  Metadata about a file (NOT the name!)
  Contains: size, owner, permissions, timestamps, block pointers
  Does NOT contain: filename (filename in directory entry)

Directory:
  Special file: list of (filename → inode number) mappings
  "Files have names because directories have names for them"

Hard Link:
  Multiple directory entries → same inode
  $ ln file1 file2   → file1 and file2 point to same inode
  Delete file1 → file2 still works (inode lives until link count = 0)
  Cannot cross filesystems!

Symbolic (Soft) Link:
  Special file containing a path string
  $ ln -s /path/to/target linkname
  Can cross filesystems, can point to directories
  If target deleted → dangling symlink (broken)

File Descriptor:
  Integer → process's open file table entry → kernel file object → inode
  stdin=0, stdout=1, stderr=2

  open("/etc/passwd", O_RDONLY)  → returns fd=3
  read(3, buf, 100)              → reads from /etc/passwd
  close(3)                       → releases fd
```

## 9.2 ext4 Internals

```
ext4 layout on disk:
  Superblock: FS metadata (block size, total blocks, free blocks, inode count...)
  Block Group Descriptor Table
  [Block Group 0][Block Group 1]...[Block Group N]

Each Block Group:
  Block Bitmap:  which blocks are free/used
  Inode Bitmap:  which inodes are free/used
  Inode Table:   array of inodes
  Data Blocks:   actual file data

Inode Structure (ext4):
  Mode:    permissions + file type
  UID/GID: owner
  Size:    file size in bytes
  Timestamps: atime, mtime, ctime, crtime
  Link count: number of hard links
  Block pointers:
    12 direct blocks         (12 × 4KB = 48KB)
    1 indirect block          (1024 pointers × 4KB = 4MB)
    1 double indirect         (1024² × 4KB = 4GB)
    1 triple indirect         (1024³ × 4KB = 4TB)
    → Max file size: ~4TB (ext4 actually supports more with extent trees)

  ext4 uses EXTENT TREE instead of indirect blocks (more efficient)
  Extent = {start_block, start_logical, num_blocks} contiguous range

Journaling (prevents corruption on crash):
  Before writing: log "I'm about to do X" to journal
  Do X
  Log "X complete"
  If crash during X: on restart, replay/undo journal → consistent state
  ext4 journal modes:
    writeback: only metadata journaled (fast, less safe)
    ordered:   data written before metadata journaled (default, good balance)
    journal:   both data + metadata journaled (slow, safest)
```

## 9.3 File System Commands

```bash
# Disk usage
df -h                    # disk space per filesystem
du -sh /var/log/*        # directory sizes
du -sh * | sort -rh | head -20  # find large directories

# Inodes
df -i                    # inode usage (can run out of inodes!)
ls -i filename           # show inode number
stat filename            # detailed file metadata

# Find
find / -name "*.log" -mtime +30 -delete    # delete logs older than 30 days
find / -size +100M                          # files larger than 100MB
find / -user nobody                         # files owned by nobody
find / -perm -4000                          # SUID files (security audit!)

# File permissions
chmod 755 script.sh      # rwxr-xr-x
chmod +x script.sh       # add execute for all
chown user:group file    # change owner
chattr +i file           # make immutable (not even root can delete!)
lsattr file              # show attributes

# Links
ln source hardlink               # create hard link
ln -s /path/to/target symlink    # create symbolic link
readlink -f symlink              # resolve symlink to real path

# Filesystem operations
mount /dev/sdb1 /mnt/data        # mount filesystem
umount /mnt/data                 # unmount
fsck /dev/sdb1                   # check + repair filesystem
tune2fs -l /dev/sda1             # show FS info
e2fsck -f /dev/sda1              # force check

# /proc and /sys (virtual filesystems)
cat /proc/cpuinfo                # CPU info
cat /proc/meminfo                # memory info
cat /proc/1234/maps              # virtual memory map of PID 1234
cat /proc/1234/fd/               # open file descriptors
cat /proc/net/tcp                # TCP connections
ls /sys/block/sda/queue/         # block device settings
echo deadline > /sys/block/sda/queue/scheduler  # change I/O scheduler
```

---

# 10. I/O Management

## 10.1 I/O Models

```
── BLOCKING I/O ──
  Thread blocks until I/O complete
  Simple to code, but thread can't do anything else while waiting

  read(fd, buf, n);   // thread sleeps here until data arrives
  // continues here only when data is ready

── NON-BLOCKING I/O ──
  Syscall returns immediately, EWOULDBLOCK if not ready
  Thread must poll repeatedly

  fcntl(fd, F_SETFL, O_NONBLOCK);
  while (1) {
      n = read(fd, buf, size);
      if (n == -1 && errno == EWOULDBLOCK) {
          // no data yet, do something else, try again later
          continue;
      }
      // process data
  }
  Problem: busy-waiting wastes CPU

── I/O MULTIPLEXING (select/poll/epoll) ──
  Monitor multiple fds, block until any one is ready
  Single thread can handle many connections!

  // epoll (Linux, most efficient)
  int epfd = epoll_create1(0);

  struct epoll_event ev = {.events = EPOLLIN, .data.fd = client_fd};
  epoll_ctl(epfd, EPOLL_CTL_ADD, client_fd, &ev);

  struct epoll_event events[100];
  while (1) {
      int n = epoll_wait(epfd, events, 100, -1);  // block until any fd ready
      for (int i = 0; i < n; i++) {
          if (events[i].data.fd == server_fd) {
              // new connection
              int client = accept(server_fd, NULL, NULL);
              ev.data.fd = client;
              epoll_ctl(epfd, EPOLL_CTL_ADD, client, &ev);
          } else {
              // data available
              read(events[i].data.fd, buf, size);
          }
      }
  }

  select: O(n) scan of all fds, max 1024 fds
  poll:   O(n) scan, no fd limit, better API
  epoll:  O(1) per event, O(n) only for ready fds, scales to millions
          → Used by nginx, Node.js, Redis event loops

── ASYNC I/O (io_uring) ──
  Linux 5.1+ (2019): revolutionary new I/O interface
  Submission Queue (SQ): app writes I/O requests
  Completion Queue (CQ): kernel writes completions
  Both in shared memory → zero syscall overhead for fast I/O!
  Can batch 1000s of operations per syscall
  Supports: read, write, accept, connect, send, recv, fsync, splice...
  Used by: RocksDB, Rust tokio, liburing
```

## 10.2 Buffer Cache & Page Cache

```
Page Cache:
  Kernel caches disk data in RAM
  read() → kernel checks page cache first (cache hit: no disk access!)
  write() → kernel writes to page cache first (write-back)
            background: dirty pages flushed to disk periodically

  $ cat /proc/meminfo | grep -E "Cached|Buffers"
  Buffers: 512 MB      ← block device buffers
  Cached: 8192 MB      ← page cache

  $ free -h
  total: 16G, used: 4G, free: 2G, buff/cache: 10G, available: 11G
  → "available" includes reclaimable cache!
  → Cache being "used" is GOOD — OS is using spare RAM productively

  echo 3 > /proc/sys/vm/drop_caches   # drop page cache (don't do in prod!)

Direct I/O (O_DIRECT flag):
  Bypass page cache, go straight to disk
  Used by databases (they manage their own cache: PostgreSQL buffer pool, etc.)
  App is responsible for buffer alignment, size

Memory-mapped I/O (mmap):
  Map file directly into process address space
  Access file like array in memory
  OS handles reading/writing transparently
  Great for: large files, shared memory, executable loading

  void* data = mmap(NULL, file_size, PROT_READ, MAP_PRIVATE, fd, 0);
  // access data[offset] directly — OS loads pages on demand
  munmap(data, file_size);
```

---

# 11. Permissions & Security

## 11.1 Unix Permission Model

```
File permissions: rwxrwxrwx
                  ↑↑↑↑↑↑↑↑↑
                  |||└──┴──┴── Others (everyone else)
                  ||└──┴──┴─── Group
                  |└──┴──┴──── Owner
                  └─────────── File type (-, d, l, c, b, s, p)

r = read    (4)
w = write   (2)
x = execute (1)

$ ls -la
-rwxr-xr-x  1  khang  developers  4096  May 19  server
drwxr-x---  2  root   root        4096  May 19  /etc/ssh
lrwxrwxrwx  1  khang  khang        9    May 19  link -> /tmp/file

File type chars:
  -  regular file
  d  directory
  l  symbolic link
  c  character device
  b  block device
  s  socket
  p  named pipe (FIFO)

Numeric: rwx = 7, rw- = 6, r-x = 5, r-- = 4, --- = 0
  chmod 755: rwxr-xr-x (owner=7, group=5, others=5)
  chmod 644: rw-r--r-- (common for files)
  chmod 600: rw------- (private key!)
  chmod 777: rwxrwxrwx (dangerous!)

Directory permissions:
  r: can list directory contents (ls)
  w: can create/delete files IN directory (need x too)
  x: can access/traverse directory (cd into it)
  → chmod 750 dir: owner full access, group can read+traverse, others nothing
```

## 11.2 Special Permission Bits

```
SUID (Set User ID) — bit 4000:
  When SUID set on executable:
    Runs with OWNER's privileges, not caller's
  Example: /usr/bin/passwd has SUID root
    Regular user runs passwd → process runs as ROOT
    → Can modify /etc/shadow (root-only file)
  $ ls -la /usr/bin/passwd
  -rwsr-xr-x  root  root  /usr/bin/passwd
       ↑ s = SUID set

  $ chmod 4755 program   # set SUID
  $ find / -perm -4000   # find all SUID files (security audit!)

SGID (Set Group ID) — bit 2000:
  On executable: runs with group's privileges
  On directory:  new files inherit directory's group (not creator's)
  $ chmod 2755 shared_dir  # SGID directory
  $ chmod g+s shared_dir   # same

Sticky Bit — bit 1000:
  On directory: only file OWNER (or root) can delete files
  Even if others have write permission to directory!
  Example: /tmp has sticky bit
  $ ls -la / | grep tmp
  drwxrwxrwt  root  root  /tmp
            ↑ t = sticky bit
  → Anyone can write to /tmp, but only delete OWN files
  $ chmod 1777 /tmp   # typical /tmp permissions

umask: default permission mask for new files/dirs
  $ umask           # shows current umask (e.g., 0022)
  new file: 0666 & ~umask = 0666 & ~0022 = 0644 (rw-r--r--)
  new dir:  0777 & ~umask = 0777 & ~0022 = 0755 (rwxr-xr-x)
  $ umask 0077  # more restrictive: new files = 0600 (rw-------)
```

## 11.3 Users, Groups, and sudo

```
User accounts:
  /etc/passwd:  username:x:UID:GID:comment:home:shell
  /etc/shadow:  username:hashed_password:last_change:...
  /etc/group:   groupname:x:GID:member1,member2,...

  UID 0: root (superuser) — no permission checks!
  UID 1-999: system users (daemon, nobody, www-data...)
  UID 1000+: regular users

  $ id                     # show current user/groups
  uid=1000(khang) gid=1000(khang) groups=1000(khang),27(sudo),1001(docker)

  $ cat /etc/passwd | grep khang
  khang:x:1000:1000:Khang:/home/khang:/bin/bash

  $ useradd -m -s /bin/bash khang    # create user
  $ passwd khang                     # set password
  $ usermod -aG sudo khang           # add to sudo group
  $ userdel -r khang                 # delete user + home

sudo:
  "substitute user do" — run command as another user (default: root)
  /etc/sudoers controls who can use sudo and what they can run
  $ visudo                           # edit sudoers safely

  # /etc/sudoers entries:
  khang    ALL=(ALL:ALL) ALL         # full sudo access
  khang    ALL=(ALL) NOPASSWD: ALL   # no password required (dangerous!)
  deploy   ALL=(ALL) NOPASSWD: /usr/bin/docker  # only docker, no password
  %sudo    ALL=(ALL:ALL) ALL         # all members of 'sudo' group

  $ sudo -l                          # what can I sudo?
  $ sudo -u postgres psql            # run as postgres user
  $ sudo -i                          # interactive root shell
  $ su - khang                       # switch to user khang
```

## 11.4 Linux Capabilities

```
Traditional model: root has ALL power or none
Capabilities: split root's power into discrete units

Process can have SOME root powers without being root:

CAP_NET_BIND_SERVICE: bind to port < 1024 (normally root only)
CAP_NET_RAW:          create raw sockets (ping uses this)
CAP_SYS_PTRACE:       trace processes (debuggers)
CAP_KILL:             send signals to any process
CAP_SYS_ADMIN:        mount filesystems, ioctl, many other ops
CAP_CHOWN:            change file ownership
CAP_DAC_OVERRIDE:     bypass file permission checks
CAP_SETUID:           change UID (become other users)
CAP_SYS_TIME:         set system time

$ getcap /usr/bin/ping
/usr/bin/ping = cap_net_raw+ep

$ setcap cap_net_bind_service=+ep ./myserver  # allow bind to port 80 without root
$ capsh --print                                # show current capabilities

Docker security:
  Containers run with reduced capabilities by default
  --cap-add NET_ADMIN    # add specific capability
  --cap-drop ALL         # drop all, add only what's needed
  --privileged           # give ALL capabilities (avoid!)
```

## 11.5 SELinux / AppArmor — Mandatory Access Control

```
DAC (Discretionary Access Control):
  Traditional Unix permissions
  Owner controls access to their files
  Root can override everything

MAC (Mandatory Access Control):
  System-wide policy enforced by OS
  Even root is restricted!
  User CANNOT change MAC policy (only sysadmin)

SELinux (Red Hat, CentOS, Fedora):
  Labels on every file, process, socket
  Policy: which labels can access which
  "Apache process (httpd_t) can read (httpd_sys_content_t) files"
  "Apache process CANNOT access shadow file (shadow_t)"
  Even if Apache runs as root and shadow is world-readable!

  $ getenforce           # Enforcing / Permissive / Disabled
  $ sestatus             # detailed SELinux status
  $ ls -Z /etc/passwd    # show SELinux context
  $ ps -eZ | grep httpd  # show process context
  $ audit2allow          # generate policy from audit log

AppArmor (Ubuntu, Debian, SUSE):
  Profiles per application (simpler than SELinux)
  /etc/apparmor.d/usr.bin.firefox
  
  $ aa-status            # show profiles
  $ aa-enforce /etc/apparmor.d/usr.bin.firefox  # enforce profile
  $ aa-complain          # log violations but don't enforce

seccomp (Secure Computing):
  Whitelist allowed system calls per process
  Any non-whitelisted syscall → process killed
  Docker uses seccomp profile by default
  Used by: Chrome, Firefox sandboxes, systemd
```

---

# 12. System Calls — Code Interacts with OS

> 📖 How your Java/Python/C code actually talks to the OS

## 12.1 Syscall Journey

```
Your Java code:          FileInputStream fis = new FileInputStream("data.txt");
                                              ↓
Java Library:            FileInputStream.open() → native method
                                              ↓
JNI (native code):       open("data.txt", O_RDONLY, 0)
                                              ↓
C Library (glibc):       open() → syscall wrapper
                                              ↓
CPU: SYSCALL instruction (saves user state, switches to kernel mode)
                                              ↓
Linux Kernel:            sys_open() handler
                         → lookup path, check permissions
                         → allocate file descriptor
                         → return fd number
                                              ↓
CPU: SYSRET (restore user state, switch to user mode)
                                              ↓
Back to Java:            fd = 3 → FileInputStream wraps fd
```

## 12.2 Key System Calls

```c
// ── PROCESS ──
pid_t fork();                         // create child process
int   execve(path, argv[], envp[]);   // replace process image
void  exit(int status);               // terminate process
pid_t wait(int *status);              // wait for any child
pid_t waitpid(pid, *status, options); // wait for specific child
pid_t getpid();                       // get my PID
pid_t getppid();                      // get parent's PID
int   kill(pid_t pid, int sig);       // send signal
int   nice(int inc);                  // change priority
int   sched_setscheduler(pid, policy, param); // set scheduling

// ── MEMORY ──
void* mmap(addr, len, prot, flags, fd, offset);  // map memory/file
int   munmap(addr, len);              // unmap
void* brk(void* addr);               // change data segment end
int   mprotect(addr, len, prot);      // change memory protection
int   madvise(addr, len, advice);     // hint to kernel about usage
                                      // MADV_SEQUENTIAL, MADV_RANDOM...
int   mlock(addr, len);               // lock pages in RAM (prevent swap)

// ── FILE I/O ──
int   open(path, flags, mode);        // open file → fd
int   close(int fd);                  // close fd
ssize_t read(fd, buf, count);         // read bytes
ssize_t write(fd, buf, count);        // write bytes
off_t   lseek(fd, offset, whence);    // move file position
int     stat(path, struct stat*);     // get file metadata
int     fstat(fd, struct stat*);      // same but with fd
int     mkdir(path, mode);            // create directory
int     rmdir(path);                  // remove directory
int     unlink(path);                 // remove file (delete if last link)
int     rename(oldpath, newpath);     // rename/move
int     chmod(path, mode);            // change permissions
int     chown(path, uid, gid);        // change owner

// ── NETWORK ──
int socket(domain, type, protocol);   // create socket
int bind(sockfd, addr, addrlen);      // assign address
int listen(sockfd, backlog);          // mark as passive socket
int accept(sockfd, addr, addrlen);    // accept connection → new fd
int connect(sockfd, addr, addrlen);   // connect to server
ssize_t send(sockfd, buf, len, flags);
ssize_t recv(sockfd, buf, len, flags);

// ── MISC ──
int   pipe(int pipefd[2]);            // create pipe
int   dup2(oldfd, newfd);             // duplicate fd (used in shell redirect)
unsigned sleep(unsigned seconds);     // sleep
int   nanosleep(timespec*, timespec*); // precise sleep
int   clock_gettime(clockid, timespec*); // get current time
int   gettimeofday(timeval*, timezone*); // get time (older, faster via vDSO)
int   getrlimit(resource, rlimit*);   // get resource limits
int   setrlimit(resource, rlimit*);   // set resource limits
int   prctl(option, arg2, ...);       // process control
long  ptrace(request, pid, addr, data); // trace process (gdb uses this)
```

## 12.3 Tracing Syscalls

```bash
# strace — trace system calls made by a process
strace ls -la
strace -p 1234            # attach to running process
strace -e trace=network ./program   # only network syscalls
strace -e trace=file ./program      # only file syscalls
strace -c ./program       # count syscalls (summary)
strace -T ./program       # show time spent in each syscall

# Example output:
# openat(AT_FDCWD, "/etc/passwd", O_RDONLY) = 3
# read(3, "root:x:0:0:root:/root:/bin/bash\n", 4096) = 2048
# write(1, "root:x:0:0:root:/root:/bin/bash\n", 31) = 31
# close(3) = 0

# ltrace — trace library calls
ltrace ./program          # trace libc calls

# perf — profiling
perf stat ./program       # hardware counters
perf top                  # real-time CPU profiling
perf record ./program     # record samples
perf report               # analyze recording

# /proc filesystem — live process info
cat /proc/1234/status     # process status
cat /proc/1234/maps       # memory map (virtual address layout)
cat /proc/1234/smaps      # detailed memory usage per region
cat /proc/1234/fd/        # open file descriptors
ls -la /proc/1234/fd/     # what files process has open
cat /proc/1234/cmdline    # command line arguments
cat /proc/1234/environ    # environment variables
cat /proc/1234/stack      # kernel stack (if readable)
cat /proc/1234/syscall    # current syscall being executed
```

---

# 13. Linux Internals

## 13.1 Boot Process

```
Power On → BIOS/UEFI
             ↓
         POST (Power-On Self Test): test hardware
             ↓
         BIOS: find bootable device (disk, USB, network)
         UEFI: read EFI System Partition, find bootloader
             ↓
         Bootloader (GRUB2):
           - Load kernel image from disk
           - Load initramfs (initial RAM filesystem)
           - Pass kernel parameters
             ↓
         Linux Kernel starts:
           - Decompress itself
           - Initialize CPU, MMU
           - Initialize device drivers
           - Mount initramfs as temporary root
           - Run /init in initramfs
             ↓
         initramfs /init:
           - Load modules for real root filesystem
           - Mount real root filesystem
           - Switch root
             ↓
         PID 1: systemd (or SysV init, runit, OpenRC...)
           - Reads unit files (/etc/systemd/system/)
           - Brings up services in dependency order
           - Mounts filesystems, network, logging...
             ↓
         System ready: getty → login prompt or display manager
```

## 13.2 systemd

```bash
# Unit types:
#   .service  : daemon/process
#   .socket   : socket activation
#   .timer    : scheduled tasks (like cron)
#   .mount    : mount points
#   .target   : group of units (like runlevel)

# Service management
systemctl start nginx         # start service
systemctl stop nginx          # stop
systemctl restart nginx       # stop + start
systemctl reload nginx        # reload config without restart
systemctl enable nginx        # start on boot
systemctl disable nginx       # don't start on boot
systemctl status nginx        # show status + recent logs
systemctl is-active nginx     # check if running
systemctl list-units --type=service  # list all services

# Logs
journalctl -u nginx           # logs for nginx service
journalctl -u nginx -f        # follow (tail -f)
journalctl -u nginx --since "1 hour ago"
journalctl -p err             # only errors
journalctl --disk-usage       # how much space logs use
journalctl --vacuum-time=7d   # delete logs older than 7 days

# Custom service file
# /etc/systemd/system/myapp.service
[Unit]
Description=My Java Application
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=myapp
Group=myapp
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/java -Xmx2g -jar /opt/myapp/app.jar
ExecStop=/bin/kill -TERM $MAINPID
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=SPRING_PROFILES_ACTIVE=prod
Environment=DB_URL=jdbc:postgresql://localhost:5432/mydb
LimitNOFILE=65536            # max open files

[Install]
WantedBy=multi-user.target

# Apply new service
systemctl daemon-reload       # reload unit files
systemctl enable --now myapp  # enable + start immediately
```

## 13.3 Performance Monitoring

```bash
# CPU
top                           # real-time process list
htop                          # better top (colored, interactive)
vmstat 1                      # CPU, memory, I/O stats every 1s
mpstat -P ALL 1               # per-CPU stats
sar -u 1 10                   # CPU usage history

# Memory
free -h                       # memory overview
cat /proc/meminfo             # detailed memory stats
vmstat -s                     # memory summary
smem -r                       # actual memory per process (PSS)

# Disk I/O
iostat -x 1                   # disk I/O stats
iotop                         # I/O usage per process
dstat                         # combined stats
lsblk                         # block device list
blkid                         # show partition UUIDs

# Network
ss -tuln                      # listening ports (replaces netstat)
ss -tp                        # TCP connections with process
netstat -tulnp                # same (older command)
iftop                         # bandwidth per connection
nethogs                       # bandwidth per process
ip addr show                  # IP addresses
ip route show                 # routing table
tcpdump -i eth0 port 80       # capture HTTP packets
nmap localhost                # port scan

# System
lscpu                         # CPU info
lsmem                         # memory info
uname -a                      # kernel version
uptime                        # load averages
dmesg | tail                  # kernel messages
/var/log/syslog               # system log
/var/log/auth.log             # authentication log

# Load Average (1min, 5min, 15min):
# On 4-core system: load of 4.0 = 100% utilization
# load > num_cores = overloaded (processes queuing for CPU)
```

## 13.4 Limits & Tuning

```bash
# Resource limits per process
ulimit -a                     # show all limits
ulimit -n 65536               # max open file descriptors
ulimit -u 1024                # max processes/threads
ulimit -s unlimited           # unlimited stack size
ulimit -v unlimited           # unlimited virtual memory

# Permanent limits: /etc/security/limits.conf
# myapp soft nofile 65536
# myapp hard nofile 65536
# * soft nproc 65536

# System-wide limits
sysctl -a                     # all kernel parameters
sysctl net.core.somaxconn     # max connection backlog
sysctl fs.file-max            # system-wide max open files

# Common tuning for high-traffic servers:
sysctl -w net.core.somaxconn=65535
sysctl -w net.ipv4.tcp_max_syn_backlog=65535
sysctl -w net.ipv4.ip_local_port_range="1024 65535"
sysctl -w net.ipv4.tcp_fin_timeout=30
sysctl -w net.core.rmem_max=16777216
sysctl -w net.core.wmem_max=16777216
sysctl -w vm.swappiness=10
sysctl -w vm.dirty_ratio=15

# Persist across reboots: /etc/sysctl.conf or /etc/sysctl.d/99-custom.conf
```

---

## 📎 Key Concepts Summary

```
┌──────────────────────────────────────────────────────────────────┐
│  CONCEPT              │  KEY IDEA                               │
├──────────────────────────────────────────────────────────────────┤
│  Kernel               │  Core OS, runs in Ring 0 (full access)  │
│  Process              │  Isolated program: own memory + state   │
│  Thread               │  Shared memory, own stack + registers   │
│  Syscall              │  User code → kernel via SYSCALL instr   │
│  Context Switch       │  Save/restore CPU state when switching  │
│  Virtual Memory       │  Illusion: each process has its own RAM │
│  Page Fault           │  Access to page not in RAM → load it    │
│  TLB                  │  Cache for virtual → physical translation│
│  fork() + exec()      │  UNIX way to create new processes       │
│  CFS Scheduler        │  Linux: fair CPU sharing via vruntime   │
│  Deadlock             │  Circular wait for resources            │
│  inode                │  File metadata (not the name!)          │
│  File Descriptor      │  Integer → open file (0=stdin,1=stdout) │
│  mmap                 │  Map file/device into process memory    │
│  epoll                │  Monitor N fds, O(1) per event          │
│  SUID                 │  Run executable as file owner           │
│  Capabilities         │  Granular root powers                   │
│  SELinux/AppArmor     │  Mandatory access control               │
└──────────────────────────────────────────────────────────────────┘
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Linux Kernel Docs | <https://www.kernel.org/doc/html/latest/> |
| Linux Man Pages | <https://man7.org/linux/man-pages/> |
| The Linux Programming Interface (book) | <https://man7.org/tlpi/> |
| Linux Syscalls Table | <https://syscalls.mebeim.net/?table=x86/64/x64/latest> |
| POSIX Standard | <https://pubs.opengroup.org/onlinepubs/9699919799/> |
| Linux Scheduler | <https://www.kernel.org/doc/html/latest/scheduler/sched-design-CFS.html> |
| Memory Management | <https://www.kernel.org/doc/html/latest/mm/index.html> |
| eBPF | <https://ebpf.io/what-is-ebpf/> |
| systemd | <https://systemd.io/> |
| Linux Performance | <https://www.brendangregg.com/linuxperf.html> |
| OSDev Wiki | <https://wiki.osdev.org/Main_Page> |
| OS: Three Easy Pieces (free book) | <https://pages.cs.wisc.edu/~remzi/OSTEP/> |

---

# 14. Plain-English Guide — Basics for Every Developer

## 14.1 What Does an OS Actually Do? (Simple Terms)

```
Think of the OS as the "manager" of a computer.
Your app is like an employee who needs desk space, tools, and shared equipment.
The OS manager:

  1. PROCESS MANAGEMENT — giving each program its own workspace
     "I'll give your program a PID (employee ID), some CPU time to work,
      and I'll make sure it doesn't mess with another program's work."

  2. MEMORY MANAGEMENT — managing the RAM (desk space)
     "You get 512MB of virtual desk space. I'll map it to real physical RAM
      as you need it. When you're done, I take it back and give it to someone else."

  3. FILE SYSTEM — organizing the hard drive (filing cabinet)
     "I keep an index (inode) for every file: who owns it, how big it is,
      where the actual bytes live on disk. You just say 'open("data.txt")' and I handle the rest."

  4. DEVICE MANAGEMENT — translating for hardware
     "Your app doesn't know if you have an SSD or HDD. I speak the hardware
      language so you don't have to."

  5. SECURITY — walls between programs
     "Each program is isolated. Program A cannot read Program B's memory.
      Users have permissions: can they read this file? execute that program?"
```

## 14.2 Process vs Thread — Dead Simple

```
PROCESS = a running program with its OWN isolated world
  Imagine: a separate room for each program
  - Own memory (a room's worth of space) — other programs can't enter
  - Own files open, own variables
  - Slow to create (building a new room takes time)
  - If it crashes: only that room is damaged, others are fine
  - Communication: pass notes under the door (IPC)
  Examples: Chrome has 1 process per tab, your Java app = 1 process

THREAD = a worker inside that process's room
  Imagine: multiple workers in the same room
  - SHARED memory (same room, everyone sees the same whiteboard)
  - Each worker has their own to-do list (stack) and pen position (registers)
  - Fast to create (just hire another worker for the same room)
  - If one worker crashes badly: can take down the whole room
  - Communication: shout across the room (shared variables — but be careful!)
  Examples: Java server handles each HTTP request in a thread,
            your Spring app's thread pool = workers in the process room

ANALOGY TABLE:
  ┌──────────────────────┬─────────────────────┬─────────────────────┐
  │                      │ PROCESS             │ THREAD              │
  ├──────────────────────┼─────────────────────┼─────────────────────┤
  │ Memory               │ Separate (isolated) │ Shared (same heap)  │
  │ Speed to create      │ Slow (~1ms)         │ Fast (~0.1ms)       │
  │ Crash isolation      │ Yes (only itself)   │ No (kills process)  │
  │ Communication        │ IPC (pipes,sockets) │ Shared memory       │
  │ Context switch cost  │ High (TLB flush)    │ Low (same page table│
  │ Java example         │ java -jar app.jar   │ Thread pool workers │
  └──────────────────────┴─────────────────────┴─────────────────────┘

WHEN TO USE WHAT:
  Need total isolation (security, stability):   → Separate processes
  Need to share data efficiently, speed:        → Threads
  In practice (Java/Spring):                    → Threads (1 JVM process, many threads)
```

## 14.3 What RAM Does — Plain English

```
RAM = Random Access Memory = your computer's "working desk"
  (Hard disk = filing cabinet you pull files from, slow)
  (RAM = desk where you put things you're actively working on, fast)

WHAT HAPPENS WHEN YOU RUN A PROGRAM:
  1. OS reads executable from disk → copies to RAM
  2. OS allocates RAM for the program's variables (heap, stack)
  3. CPU reads instructions and data FROM RAM (not disk — too slow!)
  4. Program runs; creates/modifies data in RAM
  5. When program exits: OS reclaims that RAM

WHY RAM SIZE MATTERS:
  More RAM = more programs can run at the same time (more desk space)
  Not enough RAM → OS uses SWAP (part of hard disk used as fake RAM)
  SWAP is ~100x slower than RAM → performance degrades massively
  "Out of memory" = truly no RAM left, OS kills processes (OOM Killer)

HOW YOUR JAVA APP USES RAM:
  JVM Heap:     where your objects live (ArrayList, HashMap, etc.)
                controlled by -Xmx (max) and -Xms (start)
  JVM Stack:    each thread has a stack for method call frames
                controlled by -Xss (per thread, usually 256KB-1MB)
  Metaspace:    class definitions, JIT compiled code
  Off-heap:     NIO ByteBuffers, Netty direct memory, JVM internal

VIRTUAL vs PHYSICAL RAM:
  Virtual = what your program thinks it has (can be bigger than physical RAM)
  Physical = actual RAM chips
  OS maps virtual → physical on demand
  Java -Xmx4g: your JVM can USE UP TO 4GB virtual, but may use less physical
```

## 14.4 How Files Are Organized — Plain English

```
FILESYSTEM = a database for your files

THREE LAYERS:
  1. FILE NAME (what you see):
     /home/khang/project/app.jar
     This is just a label in a directory

  2. INODE (the file's ID card, hidden):
     inode #48291: owner=khang, size=15MB, permissions=rwxr-xr-x,
                   modified=2025-05-19, blocks=[4521,4522,4523...]
     Inode does NOT contain the filename!

  3. DATA BLOCKS (actual content on disk):
     The bytes of your file, scattered across disk

DIRECTORY = a lookup table:
  /home/khang/project/
     "app.jar"   → inode #48291
     "config.yml"→ inode #48299
     "logs/"     → inode #48305 (directory inode!)

WHEN YOU OPEN A FILE:
  open("/home/khang/app.jar")
  1. OS looks up /home  → inode → finds home directory data
  2. Looks up khang      → inode → finds khang directory data
  3. Looks up app.jar    → inode #48291
  4. Reads inode #48291 → finds data blocks on disk
  5. Returns file descriptor (fd=3) — integer for your code to use
  6. All subsequent read(3,...) use this fd

PERMISSIONS:
  Every file has: owner, group, others
  Each has: r (read=4), w (write=2), x (execute=1)

  -rwxr-xr-x  1  khang  devs  15360  app.jar
   └───────┘       └──┘  └──┘
   permissions     user  group

  r w x  |  r - x  |  r - x
  user   |  group  |  others
  7      |  5      |  5      → chmod 755

  0 = --- no permissions
  1 = --x execute only
  2 = -w- write only
  3 = -wx write + execute
  4 = r-- read only
  5 = r-x read + execute
  6 = rw- read + write
  7 = rwx full access
```

---

# 15. Practical Developer — Inspecting the OS

## 15.1 Viewing Running Processes

```bash
# ── PS: SNAPSHOT of processes ──
ps aux                    # all processes, BSD style (a=all, u=user format, x=no tty)
ps aux | grep java        # find java processes
ps aux | grep -v grep | grep myapp  # find app (exclude grep itself)
ps -ef                    # all processes, full format (shows PPID)
ps -p 1234                # specific PID
ps -u khang               # processes by user
ps --sort=-%mem           # sort by memory descending
ps --sort=-%cpu           # sort by CPU descending

# READING ps aux OUTPUT:
# USER     PID  %CPU  %MEM    VSZ    RSS  TTY  STAT  START  TIME  COMMAND
# khang   1234   5.2   8.1  3621948 665744 ?   Sl   10:00  2:30  java -jar app.jar
#
# VSZ  = Virtual memory size (total virtual address space — includes shared libs, mmap)
# RSS  = Resident Set Size (actual RAM used RIGHT NOW — this is what you care about!)
# %MEM = RSS / total RAM × 100
# STAT = process state:
#   S = sleeping (waiting for I/O)   ← most processes
#   R = running (on CPU)
#   D = uninterruptible sleep (I/O)  ← can't be killed! disk I/O in progress
#   Z = zombie (finished, parent hasn't called wait())
#   T = stopped (by SIGSTOP or job control)
#   s = session leader
#   l = multi-threaded
#   < = high priority (negative nice)
#   N = low priority (positive nice)

# ── TOP: LIVE view ──
top                       # live updating process list
top -b -n 1               # batch mode (good for scripts)
top -p 1234               # watch specific PID
top -u khang              # watch user's processes

# INSIDE top — keyboard shortcuts:
# P = sort by CPU (default)
# M = sort by memory
# k = kill a process (enter PID, then signal)
# r = renice (change priority)
# 1 = show per-CPU stats
# H = show threads (not just processes)
# q = quit

# ── HTOP: BETTER top (install separately) ──
htop                      # interactive, colors, mouse support
# F6 = sort, F4 = filter, F3 = search, F2 = setup, F9 = kill

# ── READING TOP OUTPUT ──
# top - 14:30:01 up 5 days, 3:22,  2 users,  load average: 0.52, 0.58, 0.65
#   ↑time    ↑uptime             ↑users    ↑1min  ↑5min  ↑15min
#
# Tasks: 195 total,   1 running, 194 sleeping,   0 stopped,   0 zombie
#
# %Cpu(s):  5.3 us,  1.2 sy,  0.0 ni, 92.8 id,  0.4 wa,  0.0 hi,  0.3 si
#   us = user space processes
#   sy = kernel/system
#   id = idle (100-id = total usage)
#   wa = I/O wait (HIGH = disk bottleneck!)
#   hi = hardware interrupts
#   si = software interrupts
#
# MiB Mem:  16384.0 total,   2048.0 free,  10240.0 used,   4096.0 buff/cache
# MiB Swap:  8192.0 total,   7800.0 free,    392.0 used.   5632.0 avail Mem
#              ↑                                ↑
#         free physical RAM            recommended: use this number for "available"

# ── FINDING PROCESS BY NAME/PORT ──
pgrep -l java             # PIDs + names matching "java"
pgrep -a java             # PIDs + full command line
pidof java                # just the PID(s)
lsof -i :8080             # which process is using port 8080?
ss -tlnp | grep 8080      # same, more modern
fuser 8080/tcp            # PID using port 8080

# ── PROCESS TREE ──
pstree                    # tree of all processes
pstree -p 1234            # tree starting from PID 1234
pstree -u khang           # tree for user
```

## 15.2 CPU & Memory Usage Monitoring

```bash
# ── MEMORY DEEP DIVE ──
free -h                   # human-readable memory overview
#               total    used    free  shared  buff/cache  available
# Mem:           15Gi   9.8Gi   1.2Gi  1.1Gi       4.0Gi      4.5Gi
#                       └──── programs use    ──────┘        └── for new programs
# Swap:          7.8Gi   0.3Gi   7.5Gi
# NOTE: "available" is more useful than "free"
#   free      = truly unused RAM
#   available = free + buff/cache (OS can reclaim buff/cache when needed)

watch -n 1 free -h        # refresh every 1 second

cat /proc/meminfo         # detailed breakdown
# MemTotal       : total physical RAM
# MemFree        : completely free (not available = free+reclaimable)
# MemAvailable   : estimated available for new allocations
# Cached         : disk page cache (good! OS uses idle RAM as cache)
# SwapUsed       : ALERT if this is high → system is swapping!

# SPECIFIC PROCESS MEMORY:
cat /proc/1234/status     # memory, threads, signals for PID 1234
# VmRSS: current physical RAM used by process
# VmPeak: peak virtual memory
# Threads: number of threads

cat /proc/1234/smaps      # detailed memory map (every region!)
pmap -x 1234              # memory map summary per region
pmap -x 1234 | tail -1    # total line (RSS = actual RAM used)

# ── CPU MONITORING ──
mpstat 1                  # per-second CPU stats
mpstat -P ALL 1           # per-CPU-core stats

# Load average interpretation:
uptime
# 14:30:01 up 5 days,  load average: 2.50, 1.80, 1.20
#                              ↑1min  ↑5min  ↑15min
#
# On a 4-core machine:
# load = 1.0  →  25% utilized (1 of 4 cores busy)
# load = 4.0  → 100% utilized (all 4 cores fully busy)
# load = 8.0  → 200%! processes queuing, degraded performance
# Rule: load average > num_cores → system is OVERLOADED

nproc                     # number of CPU cores
cat /proc/cpuinfo | grep "processor" | wc -l  # same

# ── DISK I/O ──
iostat -x 1               # extended I/O stats (per device)
# Device  r/s   w/s  rMB/s  wMB/s  await  %util
# sda     5.2  12.1   0.20   0.45    1.2   22.3
# ↑       ↑                           ↑     ↑
# device  reads/sec              avg wait  utilization
# %util > 80% → disk is bottleneck!
# await > 10ms → slow disk response

iotop                     # live I/O usage per process (like top for disk)
iotop -o                  # only show processes doing I/O

# ── COMBINED VIEW ──
vmstat 1                  # compact CPU + memory + I/O + swap
# procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
# r  b   swpd   free  buff  cache   si   so    bi    bo   in   cs us sy id wa st
# 2  0    392  1024  128  4096     0    0    12    45  280  510 12  3 83  2  0
#
# r  = processes waiting for CPU (runnable queue) — HIGH = CPU bottleneck
# b  = processes in uninterruptible sleep (I/O wait) — HIGH = I/O bottleneck
# si/so = swap in/out (bytes/sec) — NON-ZERO = MEMORY PRESSURE!
# wa = I/O wait % — HIGH = disk bottleneck
# cs = context switches per second

# ── NETWORK ──
ss -tuln                  # listening TCP/UDP sockets
ss -tp                    # TCP connections with process names
ss -s                     # summary statistics
# State  Recv-Q  Send-Q  Local Address  Peer Address  Process
# LISTEN 0       128     0.0.0.0:8080   0.0.0.0:*     users:(("java",pid=1234))
# Recv-Q > 0 on LISTEN = connection backlog filling up (overloaded server!)
# Recv-Q > 0 on ESTABLISHED = app not reading data fast enough
```

## 15.3 File Permissions — Read, Set, Diagnose

```bash
# ── READING PERMISSIONS ──
ls -la /var/log/
# -rw-r--r-- 1 root   adm    12345 May 19 10:00 syslog
# drwxr-xr-x 2 root   root    4096 May 19 10:00 nginx/
# lrwxrwxrwx 1 root   root       4 Jan 01 00:00 wtmp -> /dev/null
# ↑           ↑ ↑      ↑
# type+perms  links owner group
#
# First char: - = regular file, d = directory, l = symlink, c = char device
# Permissions:  rwx rwx rwx
#               │   │   └── others (everyone else)
#               │   └────── group
#               └────────── owner (user)

stat filename             # full details: permissions, timestamps, inode, size

# ── CHANGING PERMISSIONS ──
chmod 755 script.sh       # rwxr-xr-x (owner: full, group: r+x, others: r+x)
chmod 644 config.yml      # rw-r--r-- (owner: r+w, group: r, others: r)
chmod 600 secret.key      # rw------- (owner: r+w only — good for SSH keys!)
chmod 777 public.txt      # EVERYONE can read/write/execute — AVOID!

# Symbolic mode (clearer intent):
chmod u+x script.sh       # add execute for user (owner)
chmod g-w file.txt        # remove write for group
chmod o= file.txt         # remove ALL permissions for others
chmod a+r file.txt        # add read for ALL (a = all)
chmod u=rwx,g=rx,o=r file # set explicitly

# Recursive:
chmod -R 755 /var/www/html    # entire directory tree

# ── CHANGING OWNERSHIP ──
chown khang file.txt          # change owner
chown khang:devs file.txt     # change owner AND group
chown -R khang:devs /project  # recursive

# ── CHECKING EFFECTIVE PERMISSIONS ──
id                            # your UID, GID, and group memberships
# uid=1000(khang) gid=1000(khang) groups=1000(khang),4(adm),27(sudo),1001(devs)

whoami                        # just your username
sudo -l                       # what can you sudo?

# Can user X access file Y?
namei -l /path/to/file        # show permissions for every component of path!
# f: /var/log/nginx/access.log
# d  / (root)         drwxr-xr-x root root
# d  var              drwxr-xr-x root root
# d  log              drwxr-xr-x root root
# d  nginx            drwx------ root adm   ← group adm can enter, others cannot!
# -  access.log       -rw-r----- root adm   ← only root+adm can read

# ── SPECIAL PERMISSIONS ──
# SUID (Set User ID): run file as owner, not executor
# -rwsr-xr-x root root /usr/bin/passwd   ← 's' instead of 'x' in owner
# When you run passwd, it runs as root (to write /etc/shadow)
chmod u+s program             # set SUID

# SGID (Set Group ID): run as file's group
chmod g+s dir/                # new files inherit directory's group

# Sticky bit: only owner can delete files in directory
# drwxrwxrwt root root /tmp   ← 't' at end
# Anyone can write to /tmp, but only YOU can delete YOUR files
chmod +t /shared-dir          # set sticky bit

# UMASK: default permissions for new files
umask                         # show current (e.g., 0022)
# file default: 0666 - umask = 0644 (no execute for new files)
# dir default:  0777 - umask = 0755

# ── FILE PERMISSION TROUBLESHOOTING ──
# "Permission denied" — systematic debugging:
ls -la path/to/file           # check file permissions
ls -la path/to/               # check directory permissions
ls -la path/                  # check parent directory
namei -l path/to/file         # check ENTIRE path at once!
id                            # am I in the right group?
sudo -l                       # can I sudo?
```

---

# 16. Performance Diagnosis — OS-Level Issues

## 16.1 Too Many Processes / Threads

```bash
# SYMPTOM: system slow, load average high, many processes

# ── DIAGNOSE ──
ps aux --sort=-%cpu | head -20    # top CPU consumers
ps aux --sort=-%mem | head -20    # top memory consumers

# Count processes/threads:
ps aux | wc -l                    # total process count (minus header)
ps -eLf | wc -l                   # total THREAD count (all threads of all processes)
cat /proc/sys/kernel/threads-max  # system maximum threads
cat /proc/sys/kernel/pid_max      # system maximum PIDs

# Java thread count:
ps -p 1234 -L | wc -l             # threads of Java process 1234
jstack 1234 | grep "java.lang.Thread.State" | wc -l  # Java threads by stack dump
# Or: jcmd 1234 Thread.print | grep tid= | wc -l

# Find zombie processes:
ps aux | awk '$8 == "Z"'          # state Z = zombie
# Zombie processes don't use CPU/memory but waste PID table slots
# Fix: parent must call wait(); or restart the parent process

# ── SYMPTOMS & CAUSES ──
# Load average >> nproc (cores):
#   Too many CPU-bound threads competing for CPU time
#   → each thread gets tiny time slice → frequent context switches
#   → context switch overhead > actual work!
#   Fix: reduce thread pool size to match # of CPU cores
#        for CPU-bound: threads ≈ nproc
#        for I/O-bound: threads can be more (most time waiting)

# High %sys CPU:
#   Many syscalls per second (too many threads doing I/O)
#   Many context switches (cs column in vmstat)
#   Fix: reduce threads, use async I/O, batch operations

vmstat 1 | awk '{print $12, "cs/s"}'  # watch context switches per second
# < 1000/s   = normal
# 10000/s    = moderate (OK for busy server)
# 100000+/s  = very high, investigate!

# ── THREAD POOL TUNING (Java) ──
# CPU-bound work:
int threads = Runtime.getRuntime().availableProcessors();
// → use exactly nproc threads, no more!

# I/O-bound work:
// Little's Law: threads = (avg_latency_ms / 1000) × target_throughput_rps
// Example: 100ms latency, want 500 req/sec:
// threads = 0.1 × 500 = 50 threads

# Spring Boot threadpool (Tomcat):
server.tomcat.threads.max=200     # default 200 (usually too many for CPU-bound!)
server.tomcat.threads.min-spare=10
```

## 16.2 Insufficient Memory — OOM and Swap

```bash
# ── DETECTING MEMORY PRESSURE ──
free -h                           # check available memory
cat /proc/meminfo | grep -E "MemAvailable|SwapUsed|Dirty"
vmstat 1 | awk '{print $7, $8}'  # si/so = swap in/out (should be 0!)

# OOM Killer triggered:
dmesg | grep -i "oom\|out of memory\|killed process"
grep -i "oom\|kill" /var/log/syslog | tail -20
journalctl -k | grep -i oom

# OOM Killer output looks like:
# [1234.567] Out of memory: Kill process 5678 (java) score 892 or sacrifice child
# [1234.568] Killed process 5678 (java) total-vm:4194304kB, anon-rss:3145728kB

# OOM score (0-1000, higher = more likely to be killed):
cat /proc/1234/oom_score          # current score (computed by kernel)
cat /proc/1234/oom_score_adj      # adjustment (-1000 to 1000)
# Protect critical process from OOM killer:
echo -1000 > /proc/1234/oom_score_adj  # very protected (only root can do this)
echo 500 > /proc/1234/oom_score_adj    # more likely to be killed (good for bg tasks)

# ── JAVA HEAP ANALYSIS ──
# JVM out of memory:
# java.lang.OutOfMemoryError: Java heap space
# → app using more heap than -Xmx allows
# java.lang.OutOfMemoryError: GC overhead limit exceeded
# → JVM spending > 98% time in GC with < 2% progress
# java.lang.OutOfMemoryError: Metaspace
# → too many classes loaded (class loader leak?)

# Check Java process memory:
jmap -heap 1234               # heap summary (Eden, Survivor, Old gen sizes)
jstat -gcutil 1234 1000       # GC stats every 1 second
# S0  S1   E   O    M    CCS  YGC YGCT FGC FGCT   GCT
# 0.0 98.5 82.0 56.3 96.7 88.5  89  0.532   3  0.289   0.821
# E=Eden, O=Old, YGC=young GC count, FGC=full GC count
# High FGC (full GC) → memory pressure!
# Old gen consistently high → increase -Xmx or fix memory leak

# Memory leak detection:
jmap -histo:live 1234 | head -30    # object histogram (find leak candidates)
jcmd 1234 GC.heap_dump /tmp/heap.hprof  # full heap dump for analysis
# Analyze with: Eclipse MAT, IntelliJ memory profiler, jhat

# Common Java memory settings:
java -Xms512m -Xmx2g \              # heap: start 512MB, max 2GB
     -XX:MetaspaceSize=256m \        # initial metaspace
     -XX:MaxMetaspaceSize=512m \     # max metaspace
     -XX:+UseG1GC \                  # G1 garbage collector (Java 9+ default)
     -XX:MaxGCPauseMillis=200 \      # target GC pause < 200ms
     -Xlog:gc*:gc.log                # GC logging to file
     -jar app.jar

# ── SWAP ISSUES ──
# Swap usage means system is OUT of RAM
swapon --show                       # show swap devices
cat /proc/swaps

# Find which processes are using swap:
for pid in /proc/[0-9]*; do
    proc_name=$(cat $pid/comm 2>/dev/null)
    swap=$(grep VmSwap $pid/status 2>/dev/null | awk '{print $2}')
    if [ ! -z "$swap" ] && [ "$swap" -gt 0 ]; then
        echo "$swap kB - $proc_name ($(basename $pid))"
    fi
done | sort -rn | head -20

# Reduce swap usage:
sysctl vm.swappiness=10     # 0=avoid swap, 100=aggressive swap
# Default=60, for servers set to 1-10
# vm.swappiness=0 doesn't mean NO swap, means "swap only when truly necessary"
```

## 16.3 CPU Bottlenecks

```bash
# ── IDENTIFY CPU BOTTLENECK ──
# High %us (user CPU): your application code is CPU-intensive
# High %sy (system CPU): too many syscalls or context switches
# High %wa (I/O wait): blocked waiting for disk/network
# High %si (software interrupt): network packet processing

# Profile which code is CPU-intensive:
# Linux perf (most powerful):
perf top                          # live CPU hotspot (like top but for functions)
perf record -g -p 1234 sleep 30  # sample for 30 seconds
perf report                       # show call graph

# Java CPU profiling:
jstack 1234                       # thread dump (find threads consuming CPU)
# Look for threads in RUNNABLE state with CPU-intensive stack traces

async-profiler -d 30 -f /tmp/profile.html 1234  # flamegraph for Java
# https://github.com/async-profiler/async-profiler

# CPU frequency / throttling:
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq   # current frequency
cat /proc/cpuinfo | grep "MHz"    # per-core frequency
# If CPU is throttling below rated speed → thermal throttling?

# Check CPU temperature:
sensors                           # if lm-sensors installed
cat /sys/class/thermal/thermal_zone*/temp  # raw values (divide by 1000)

# ── CONTEXT SWITCH ANALYSIS ──
# High context switches = many threads competing, short time slices
pidstat -w 1                      # context switches per process per second
# Voluntary: thread willingly gives up CPU (waiting for I/O, sleep)
# Involuntary: scheduler preempted thread (time slice expired, higher priority ran)
# High involuntary = too many runnable threads (reduce threads!)

# ── CACHE MISS ANALYSIS ──
perf stat -e cache-misses,cache-references ./program
# cache-miss ratio = cache-misses / cache-references
# > 10% = significant, > 50% = serious cache miss problem
# Causes: large data structures, random memory access patterns
```

## 16.4 I/O and Disk Bottlenecks

```bash
# ── DISK I/O DIAGNOSIS ──
iostat -x 1
# key columns:
# %util  → utilization (close to 100% = saturated!)
# await  → average I/O wait time in milliseconds
#          < 1ms   = excellent (NVMe SSD)
#          < 10ms  = good (SATA SSD)
#          < 50ms  = acceptable (HDD)
#          > 100ms = PROBLEM!
# r/s, w/s → reads/writes per second
# rMB/s, wMB/s → throughput

iotop -oa                         # cumulative I/O per process since start
lsof +D /path/to/dir              # which processes have files open in directory

# Check if a process is I/O bound:
ps aux | awk '$8 == "D"'          # state D = uninterruptible I/O sleep

# File system cache statistics:
vmstat -d                         # disk statistics
cat /proc/sys/vm/dirty_ratio      # max % of RAM for dirty page cache
cat /proc/sys/vm/dirty_background_ratio  # when to start writing dirty pages

# ── NETWORK I/O ──
# Socket buffer queues full?
ss -tn | awk '{print $2}' | sort -rn | head    # Recv-Q values
# Recv-Q > 0 on ESTABLISHED connections: app not consuming data fast enough!

nethogs                           # bandwidth per process in real-time
iftop -i eth0                     # bandwidth per connection

# Check for connection errors:
ss -s
# Retrans: retransmitted packets → packet loss?
# estab: established connections
# closed: recently closed
```

---

# 17. How OS Behavior Affects Application Performance

## 17.1 OS Impact on Java/Spring Applications

```
SCENARIO 1: Spring Boot app with 200 Tomcat threads, 4-core server

OS view:
  200 threads created in JVM process
  OS kernel thread per each Java thread (1:1 mapping, modern JVM)
  200 LWP (Light Weight Processes) registered with scheduler
  Scheduler runs each for ~4ms time slice

What happens under heavy load:
  All 200 threads RUNNABLE (all handling requests simultaneously)
  CPU has only 4 cores
  200/4 = 50 threads per core must take turns
  Each gets ~4ms, then context switch
  Context switch: ~5-10µs overhead
  200 threads × 5µs = 1ms of overhead per 4ms slice = 25% overhead!
  Plus: cache pollution, TLB flushes

Observation:
  vmstat cs column jumps to 50,000+ per second
  %sys CPU climbs (kernel doing context switch work)
  Throughput plateaus or degrades despite more load

Fix:
  Reduce thread count to 4×(target_concurrency_factor)
  Use async/reactive (Spring WebFlux + Netty):
    1 thread per CPU core
    Non-blocking I/O: thread never sleeps waiting for I/O
    → 4 threads serving thousands of concurrent requests!

SCENARIO 2: JVM Garbage Collection and OS

Major GC (Stop-The-World):
  All JVM application threads STOPPED
  GC thread runs alone
  OS view: all application threads go from RUNNABLE → WAITING
  Request latency spikes for duration of GC pause (50ms to 10+ seconds!)

OS-level GC impact:
  GC may generate enormous number of page faults if heap is swapped out
  Large heap + compaction = massive memory bandwidth usage
  Other processes on same machine get extra CPU during GC (then lose it)

Diagnosis:
  jstat -gcutil 1234 1000       # watch GC events in real time
  Prometheus: jvm_gc_pause_seconds_max > 500ms → alert!
  journalctl -u myapp | grep "GC"

Fix:
  Increase heap (-Xmx) to avoid frequent GCs
  Use G1GC or ZGC (concurrent GC — much shorter pauses):
    -XX:+UseZGC               # ZGC: pauses < 1ms! (Java 15+ production ready)
    -XX:+UseG1GC              # G1: good balance
  Set GC pause target: -XX:MaxGCPauseMillis=200

SCENARIO 3: File Descriptor Exhaustion

Linux default max open files per process: 1024
Web server with 10,000 connections:
  Each socket = 1 file descriptor
  10,000 connections → need 10,000+ file descriptors
  Beyond limit → accept() fails: "Too many open files"
  nginx/app crashes accepting new connections!

Check:
  lsof -p 1234 | wc -l          # count open FDs for process
  cat /proc/1234/limits         # per-process limits
  cat /proc/sys/fs/file-max     # system-wide max

Fix:
  # Increase for current session:
  ulimit -n 65536
  # Permanent: /etc/security/limits.conf
  myapp soft nofile 65536
  myapp hard nofile 65536
  # System-wide: /etc/sysctl.conf
  fs.file-max = 1000000
```

## 17.2 OS Impact on Node.js / Python / Go

```
NODE.JS (single-threaded event loop):
  OS view: Node.js = 1 main thread + libuv thread pool (default 4 threads)
  Main thread: runs JS code, event loop, non-blocking I/O callbacks
  Thread pool: for blocking I/O (fs.readFile with no async, DNS, crypto)

  Performance impact:
    CPU-bound JS code blocks the event loop → ALL requests stall!
    File system calls go through thread pool → max 4 concurrent
    Network I/O: async via OS epoll → no thread needed!

  Diagnosis:
    event loop lag > 100ms → CPU-bound code blocking event loop
    node --prof app.js → CPU profile
    UV_THREADPOOL_SIZE=8 node app.js → increase thread pool for heavy fs work

PYTHON (GIL — Global Interpreter Lock):
  OS view: Python process creates OS threads, but GIL prevents true parallel execution
  Only 1 Python thread executes at a time (even on multi-core!)
  GIL released during I/O → I/O threads run in parallel
  GIL NOT released during CPU work → no parallel CPU computation!

  Fix for CPU-bound:
    multiprocessing module → separate processes (each with own GIL)
    C extensions (numpy, pandas) → release GIL for their work

GO (goroutines with M:N scheduling):
  OS view: Go creates N OS threads (GOMAXPROCS, default = num_cores)
  Millions of goroutines → scheduled onto N OS threads by Go runtime
  When goroutine blocks on syscall → runtime parks it, runs another goroutine

  OS thread usage:
    GOMAXPROCS=4 → 4 OS threads (4 CPU cores utilized in parallel)
    Network I/O: Go uses non-blocking + runtime netpoller (epoll-based)
    File I/O: uses thread pool (blocks OS thread, runtime uses another)
```

## 17.3 Containers & OS Interaction

```
CONTAINER = process with extra isolation (not a VM!)
  A Docker container is just:
  - A process (or group of processes) with:
    namespaces: isolated PID, network, mount, hostname
    cgroups:    limited CPU, memory, I/O

Docker "run ubuntu bash" is actually:
  OS: fork() → new process
  OS: clone() with CLONE_NEWPID, CLONE_NEWNET, CLONE_NEWNS flags → new namespaces
  OS: cgroup apply limits (e.g., max 0.5 CPU, max 512MB RAM)
  OS: pivot_root() → container sees different filesystem root
  Result: process thinks it's alone in a fresh Linux system!

KEY INSIGHT: Container shares the HOST OS KERNEL
  Host kernel: Linux 6.1
  Container "ubuntu 20.04": just ubuntu userspace files
  Kernel = same Linux 6.1
  → No kernel isolation! (unlike VMs)
  → Kernel exploits affect ALL containers on host!
  → Container processes appear in host's `ps aux` (with different PID mapping)

RESOURCE LIMITS (cgroups):
  docker run --cpus=0.5 → container gets max 50% of 1 CPU
  docker run --memory=512m → container max 512MB RAM
  
  OS enforcement:
    CPU: cgroup CFS quota/period (e.g., 50000µs quota per 100000µs period = 50%)
    Memory: cgroup memory.limit_in_bytes (exceed → OOM killer within container!)

JVM IN CONTAINER:
  Problem: JVM reads host /proc/cpuinfo and total RAM → allocates huge heap!
  Container has 512MB limit, JVM sees 32GB host RAM → allocates 24GB heap → OOM!

  Fix (Java 8u131+ / Java 10+):
    -XX:+UseContainerSupport       # JVM respects container limits (DEFAULT in Java 11+)
    -XX:MaxRAMPercentage=75.0      # use max 75% of container memory for heap
  
  Verify:
    docker run --memory=512m my-java-image java -XX:+PrintFlagsFinal -version | grep MaxHeapSize
    # Should show ~384MB (75% of 512MB), not 24GB!

VIEWING CONTAINER RESOURCE USAGE:
  # From host:
  docker stats                    # live resource usage per container
  cat /sys/fs/cgroup/memory/docker/<id>/memory.usage_in_bytes  # current memory
  cat /sys/fs/cgroup/cpu/docker/<id>/cpuacct.usage             # CPU time used
  
  # From inside container:
  cat /sys/fs/cgroup/memory/memory.limit_in_bytes  # my memory limit
  nproc                           # number of CPUs available to me
  cat /proc/cpuinfo | grep processor | wc -l       # same

CONTAINER NETWORKING:
  Container has virtual network interface (veth pair)
  One end in container namespace (eth0), other end in host namespace
  Docker bridge (docker0): software switch connecting all containers
  Port mapping (-p 8080:8080): iptables rule on host redirects traffic

  Network performance impact:
    Container-to-container (same host): ~10Gbps via virtual bridge (fast!)
    Container-to-host: virtual ethernet, ~10Gbps
    External traffic: iptables NAT overhead (~5-10% latency cost)
```

---

# 18. Memory Debugging — Practical for Developers

## 18.1 Identifying Memory Leaks

```bash
# ── TOOLS ──

# Valgrind (C/C++ programs):
valgrind --leak-check=full --show-leak-kinds=all ./myprogram
# Detects: heap leaks, use-after-free, buffer overflows, uninitialized memory

# AddressSanitizer (compile-time):
gcc -fsanitize=address -g ./myprogram.c -o myprogram
./myprogram
# Much faster than valgrind! Detects same issues + more

# Java Memory Leak Detection:
# 1. Watch heap over time:
jstat -gcutil 1234 5000 | awk '{print $5}'   # Old gen % every 5s
# If Old gen grows steadily → memory leak!

# 2. Heap dump analysis:
jcmd 1234 GC.heap_dump /tmp/heap.hprof
# Analyze with Eclipse Memory Analyzer (MAT):
#   Dominator tree → biggest memory consumers
#   "Leak suspects" report → likely leak candidates

# 3. Common Java memory leaks:
#   Static collections growing forever:
#     static List<Request> audit = new ArrayList<>();  ← never cleared!
#   Unclosed resources (before Java 7 try-with-resources):
#     InputStream is = new FileInputStream("file");
#     // forgot to close! → stays open, leak
#   Event listeners not removed:
#     button.addActionListener(handler);  // handler held in listener list forever
#   ThreadLocal not removed after thread pool reuse:
#     ThreadLocal<Context> ctx = new ThreadLocal<>();
#     ctx.set(value);  // forgot ctx.remove() → value lives as long as thread!
#   Inner class holding outer class reference:
#     class Outer { class Inner { } }  // Inner holds implicit ref to Outer!

# ── MEMORY GROWTH PATTERNS ──
# Linear growth over time → Classic leak (collection or event listener growing)
# Sawtooth pattern → Normal (GC collecting, then growing again)
# Plateau at high level → Large object kept alive but not leaking
# Sudden spike → One-time large allocation (bulk data load)

# Watch heap in real time:
watch -n 1 "jcmd 1234 GC.heap_info 2>/dev/null | grep -E 'used|capacity'"
```

## 18.2 Thread Safety Issues in Practice

```java
// ── OS-LEVEL PERSPECTIVE ON THREAD SAFETY ──

// WHAT THE OS GUARANTEES:
// - Atomic reads/writes of ALIGNED native types ≤ machine word size (x86: 8 bytes)
//   long/double on 64-bit: single instruction → atomic at machine level
//   But: Java memory model requires 'volatile' for visibility across cores!
// - Context switch can happen between ANY two instructions

// WHAT THE OS DOES NOT GUARANTEE:
// - Ordering of memory writes seen by other CPUs (CPU reordering, store buffers)
// - Cache coherency timing (your write may not be visible for nanoseconds)
// - Atomicity of compound operations (check-then-act, read-modify-write)

// JAVA THREADING MODEL on top of OS:
// Java Thread → OS Thread (1:1 on modern JVM)
// java.util.concurrent → built on OS primitives (futex on Linux)
// synchronized → maps to OS mutex (futex_wait / futex_wake syscalls)
// volatile → memory barrier instructions (mfence, lfence, sfence on x86)

// ── COMMON OS-VISIBLE THREAD ISSUES ──

// 1. CPU SPIN in Java (burns CPU cycles, visible as high %us):
while (!flag) { }  // busy-wait: thread spinning at 100% core!
// OS: thread never yields CPU (RUNNABLE continuously)
// Fix: use wait/notify or LockSupport.park()

// 2. LOCK CONTENTION (high context switch rate):
// Too many threads competing for same synchronized block
// OS: threads block, wake, context switch repeatedly
// Visible: high context switches in vmstat 'cs' column
// pidstat -w 1 -p <pid>  → high nvcsw (involuntary context switches)

// 3. PRIORITY INVERSION:
// Low-priority thread holds lock that high-priority thread needs
// Medium-priority thread preempts low-priority thread indefinitely
// High-priority thread starved waiting for lock!
// OS behavior: scheduler runs medium > low, but high waits for low
// Fix: priority inheritance (OS mutex feature), or avoid priority mixing

// 4. THREAD STARVATION (OS scheduling issue):
// ThreadPoolExecutor with work queue: unbounded queue fills up
// Threads all busy, tasks queuing indefinitely
// OS view: thread count stable (pool saturated), queue growing in heap
// Diagnosis: queue size via ThreadPoolExecutor.getQueue().size()
// Fix: bounded queue + rejection policy (CallerRunsPolicy = backpressure!)

// PRACTICAL THREAD SAFETY RULES FOR JAVA DEVELOPERS:
// ✅ Use java.util.concurrent collections (ConcurrentHashMap, BlockingQueue)
// ✅ Use AtomicInteger/Long for counters instead of synchronized int
// ✅ volatile for single-variable flags (stop flags, initialized flag)
// ✅ synchronized for compound operations (check-then-act)
// ✅ ThreadLocal for per-thread state (DB connections, request context)
// ✅ Minimize lock scope (hold locks as briefly as possible)
// ❌ Never call blocking I/O inside synchronized block
// ❌ Never lock on this (exposes internal lock to callers)
// ❌ Never use double-checked locking without volatile
```

---

## 📎 Updated Quick Reference — Developer Focus

```
SIMPLE TERMS:
  Process:    isolated running program (own memory, resources)
  Thread:     worker inside a process (shared memory, own stack)
  RAM:        fast working memory (programs live here while running)
  Swap:       slow fake-RAM on disk (bad for performance!)
  File:       name → inode (metadata) → data blocks on disk
  inode:      file's ID card (permissions, size, timestamps, block pointers)

INSPECT PROCESSES:
  ps aux              snapshot of all processes
  top / htop          live view of processes + CPU/memory
  pgrep -a java       find Java PIDs
  lsof -i :8080       what's using port 8080?

INSPECT MEMORY:
  free -h             RAM overview ("available" column = what you can use)
  cat /proc/PID/status  process memory details (VmRSS = actual RAM)
  vmstat 1            memory + swap movement (si/so ≠ 0 = PROBLEM!)
  dmesg | grep oom    check if OOM killer fired

INSPECT CPU:
  vmstat 1            load, runnable (r column), context switches (cs)
  uptime              load average (compare to nproc)
  iostat -x 1         disk I/O bottleneck detection (%util, await)

PERMISSIONS:
  ls -la              see rwx for owner/group/others
  chmod 755           rwxr-xr-x (common for scripts)
  chmod 644           rw-r--r-- (common for files)
  chmod 600           rw------- (private files like SSH keys)
  namei -l path       debug permission denied for full path
  id                  your current groups

PERFORMANCE DIAGNOSIS:
  load > nproc:       CPU overloaded — too many runnable threads
  %wa high:           disk I/O bottleneck — slow storage or too much I/O
  si/so nonzero:      system swapping — need more RAM!
  cs high in vmstat:  too many context switches — too many threads!
  FD exhaustion:      ulimit -n 65536 to fix

JAVA-SPECIFIC:
  -XX:+UseContainerSupport    MUST have in containers (correct heap size)
  -XX:MaxRAMPercentage=75     heap = 75% of container memory
  jstat -gcutil PID 1000      watch GC live (FGC = full GC count)
  jstack PID                  thread dump (find CPU-burning threads)
  jmap -histo:live PID        object histogram (find memory leaks)

CONTAINERS:
  Container = process + namespaces + cgroups (NOT a VM!)
  Shares HOST kernel
  docker stats               live resource per container
  OOM inside container:      dmesg or docker logs for killed process
```

---

*Học theo thứ tự: Basic Terms (14) → Process/Thread (3,5) → Memory (6,7) → File System (9) → Inspect Practically (15) → Performance Diagnosis (16) → OS Impact on App (17) → Deep Internals (2,4,8,10,11,12,13)*
