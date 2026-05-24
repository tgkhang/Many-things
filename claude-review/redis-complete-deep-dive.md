# ⚡ Redis — Complete Deep Dive
>
> Internals, Memory, Persistence, Clustering, Failure Cases, Patterns, Production

---

## 📚 Table of Contents

1. [Redis Fundamentals & Philosophy](#1-redis-fundamentals--philosophy)
2. [Redis Internals — How It Works](#2-redis-internals--how-it-works)
3. [Memory Architecture & Management](#3-memory-architecture--management)
4. [Data Structures — Deep Dive](#4-data-structures--deep-dive)
5. [Persistence — RDB & AOF](#5-persistence--rdb--aof)
6. [Replication](#6-replication)
7. [Redis Sentinel — High Availability](#7-redis-sentinel--high-availability)
8. [Redis Cluster — Horizontal Scaling](#8-redis-cluster--horizontal-scaling)
9. [Caching Patterns](#9-caching-patterns)
10. [Failure Cases — The Dangerous Scenarios](#10-failure-cases--the-dangerous-scenarios)
11. [Redis Under Load — Bottlenecks & Solutions](#11-redis-under-load--bottlenecks--solutions)
12. [Lua Scripts & Transactions](#12-lua-scripts--transactions)
13. [Redis Pub/Sub & Streams](#13-redis-pubsub--streams)
14. [Advanced Patterns](#14-advanced-patterns)
15. [Monitoring & Troubleshooting](#15-monitoring--troubleshooting)
16. [Production Checklist & Anti-Patterns](#16-production-checklist--anti-patterns)

---

# 1. Redis Fundamentals & Philosophy

## 1.1 What is Redis?

```
Redis = REmote DIctionary Server
  In-memory data structure store
  Used as: cache, database, message broker, streaming engine

CREATOR: Salvatore Sanfilippo (@antirez), 2009
  Created for LLOOGG (real-time log analyzer for websites)
  Problem: MySQL too slow for real-time list operations
  Solution: in-memory data structure server

DESIGN PHILOSOPHY:
  "Fast by default, rich by design"
  Single-threaded command processing → no lock contention
  Rich data structures → solve problems at data layer
  Data types have specific encoding → memory efficient
  Everything in RAM → microsecond latency

REDIS SPEED:
  100,000 - 1,000,000 ops/sec on single instance
  Sub-millisecond latency (P99 < 1ms)
  
  WHY so fast?
  1. Memory-first: no disk I/O on critical path
  2. Single-threaded: no lock overhead, no context switches
  3. I/O multiplexing: handles many connections with one thread
  4. Efficient data structures: C implementations, minimal allocations
  5. Simple protocol (RESP): easy to parse, binary-safe
```

## 1.2 Redis vs Memcached

```
                    Redis                   Memcached
─────────────────────────────────────────────────────────────
Data types          Rich (string,list,...)   String only
Persistence         RDB + AOF                ❌ None
Replication         ✅ Master-Replica        ❌ None
Clustering          ✅ Redis Cluster         Limited (external)
Transactions        ✅ MULTI/EXEC            ❌ None
Lua scripting       ✅ Yes                   ❌ None
Pub/Sub             ✅ Yes                   ❌ None
Streams             ✅ Yes                   ❌ None
Memory efficiency   Good                     Better (simpler)
Multi-threading     IO threads (6+)          Multi-threaded
Max value size      512MB                    1MB
Use cases           Cache + more             Pure cache only
```

---

# 2. Redis Internals — How It Works

## 2.1 Event Loop Architecture

```
Redis single-threaded model (pre-6.0):

                    ┌──────────────────────────────────────────┐
  Client 1 ──────▶ │                                          │
  Client 2 ──────▶ │          EVENT LOOP (aeEventLoop)        │
  Client 3 ──────▶ │                                          │
  Client N ──────▶ │  epoll/kqueue/select multiplexing        │
                   │                                          │
                   │  For each event:                         │
                   │   1. Accept new connection               │
                   │   2. Read command from socket            │
                   │   3. Parse command (RESP protocol)       │
                   │   4. Execute command (dictionary lookup) │
                   │   5. Write response to socket            │
                   └──────────────────────────────────────────┘
                          Single Thread — no locks needed!

RESP Protocol (Redis Serialization Protocol):
  Simple, fast to parse
  
  Simple string:  +OK\r\n
  Error:          -ERR message\r\n
  Integer:        :1000\r\n
  Bulk string:    $6\r\nfoobar\r\n
  Array:          *2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n
  
  Command "SET key value":
  *3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n

REDIS 6.0+ MULTI-THREADING:
  Main thread: still single-threaded for command execution
  I/O threads: read from sockets, write to sockets (parallel)
  Background threads: persistence, key expiry, lazy-free
  
  io-threads 4       # 4 I/O threads (besides main)
  io-threads-do-reads yes
  
  Result: 2-3x throughput improvement for I/O-bound workloads
  
REDIS 7.0+ (some versions):
  Function-level multi-threading being explored
  But core execution still mostly single-threaded
```

## 2.2 Internal Data Structures

```c
// REDIS OBJECT (robj) — every value is a redisObject
typedef struct redisObject {
    unsigned type:4;      // STRING, LIST, SET, ZSET, HASH (RDB_TYPE_*)
    unsigned encoding:4;  // how data is stored internally (OBJ_ENCODING_*)
    unsigned lru:24;      // LRU clock for eviction
    int refcount;         // reference counting (shared objects)
    void *ptr;            // pointer to actual data
} robj;

// 8 bytes header + pointer = 16 bytes per object (64-bit)

// KEY ENCODING (Redis chooses most memory-efficient):
// STRING:
//   INT:    integer fits in long → store number directly in ptr
//   EMBSTR: string ≤ 44 bytes  → single allocation (object + string together)
//   RAW:    string > 44 bytes  → separate allocation (sds string)

// LIST:
//   LISTPACK: small list (≤ 128 elements, each ≤ 64 bytes) → compact array
//   QUICKLIST: larger → linked list of listpacks

// HASH:
//   LISTPACK: small (≤ 128 fields, each ≤ 64 bytes) → compact array
//   HASHTABLE: larger → actual hash table

// SET:
//   INTSET:    integers only, ≤ 512 → sorted integer array
//   LISTPACK:  ≤ 128 elements, each ≤ 64 bytes
//   HASHTABLE: larger

// SORTED SET (ZSET):
//   LISTPACK:  small (≤ 128 members, each ≤ 64 bytes)
//   SKIPLIST + HASHTABLE: larger (skiplist for O(log n) by score, hashtable for O(1) by member)

// WHY THIS MATTERS:
// 128 HSET fields with short values → LISTPACK (compact, 10x less memory than hashtable)
// 129 fields → HASHTABLE (more memory, but faster for large sets)
// Tune with: hash-max-listpack-entries 128
```

## 2.3 Dictionary Implementation

```
Redis main database = two hash tables (for rehashing)

dict {
    dictht ht[2];      // two hash tables
    long rehashidx;    // -1 if not rehashing, otherwise index
    ...
}

dictht {
    dictEntry **table; // array of buckets
    unsigned long size;
    unsigned long used;
    unsigned long sizemask; // size-1 for hash masking
}

INCREMENTAL REHASHING:
  When load factor > 1 (or > 5 with persistence): double size
  Not all-at-once (would block!): rehash 100 buckets per operation
  During rehashing:
    Reads: check ht[0] first, then ht[1]
    Writes: always to ht[1]
  Complete when ht[0] empty → ht[1] becomes ht[0]
  
  Result: rehashing is transparent, no blocking pause!

HASH FUNCTION: SipHash (since Redis 4.0)
  Resistant to hash collision attacks (HaShDoS)
  Random seed per Redis instance

COLLISION RESOLUTION: chaining (linked list per bucket)
```

## 2.4 Key Expiry Mechanism

```
TWO EXPIRY STRATEGIES (Redis uses BOTH):

1. PASSIVE EXPIRY (Lazy Deletion):
   Check expiry only when KEY IS ACCESSED
   If expired → delete → return nil to client
   Pro: no background CPU overhead
   Con: expired keys stay in memory until accessed!

2. ACTIVE EXPIRY (Periodic Scan):
   Every 100ms, Redis runs expiry cycle:
   - Randomly sample 20 keys from expired key set
   - Delete expired keys
   - If >25% expired → repeat cycle
   - Stop after 25ms (don't block too long)
   
   Effect: some memory delay in reclamation (eventual consistency)
   Worst case: expired keys linger up to a few seconds

   # redis.conf:
   hz 10                    # run expiry cycle 10x/sec (default)
   dynamic-hz yes           # scale hz with number of connected clients

EXPIRY PROPAGATION (Replication):
   Master expires key → sends DEL command to replicas
   Replica: doesn't expire actively for most reads (avoids split-brain)
   WAIT: replicas may serve expired keys briefly (until DEL arrives)
   
   For strong consistency: read from master only (not replicas)!

EXPIRY PRECISION:
   Millisecond precision: PEXPIRE, PEXPIREAT, PTTL
   Second precision: EXPIRE, EXPIREAT, TTL
   Redis stores expiry as absolute Unix timestamp (milliseconds)
   
   # Bug alert: set expiry then change system clock → wrong behavior
```

---

# 3. Memory Architecture & Management

## 3.1 How Redis Uses Memory

```
REDIS MEMORY BREAKDOWN for a running instance:

Total Memory Used = 
  User Data                    (your keys and values)
+ Key overhead                 (redisObject per key + dict entry)
+ Data structure overhead      (listpack, hashtable, skiplist nodes)
+ Allocator overhead           (jemalloc fragmentation ~10-30%)
+ Replication buffer           (if master, backlog buffer)
+ AOF buffer                   (if AOF enabled)
+ Lua scripting                (if using scripts)
+ Clients                      (input/output buffers per connection)
+ Server overhead              (event loop, config, etc.)

REAL MEMORY COST per key:
  Small string "hello":
    key + value: ~16 bytes each (robj header)
    embstr value (≤44 bytes): 16 + 44 = 60 bytes
    dict entry: ~40 bytes
    Total: ~100-150 bytes minimum!
  
  "SET k v" where k=1 byte, v=1 byte → still ~100+ bytes!
  → Lots of tiny keys = massive memory waste
  → Use hash instead: HSET user:1 name "Khang" age 21
    One dict entry for "user:1" → multiple fields in listpack

MEMORY CHECKING:
  127.0.0.1:6379> INFO memory
  used_memory:          1073741824  # 1GB total allocated
  used_memory_human:    1.00G
  used_memory_rss:      1200000000  # RSS from OS (includes fragmentation)
  used_memory_rss_human:1.12G
  used_memory_peak:     1100000000  # peak usage
  used_memory_overhead: 872415      # overhead (non-data)
  used_memory_dataset:  200326409   # actual data
  mem_fragmentation_ratio: 1.12     # rss/used — ideal: 1.0-1.5
  mem_allocator:        jemalloc-5.3.0

  mem_fragmentation_ratio:
    < 1.0: Redis using swap (VERY BAD — check maxmemory!)
    1.0-1.5: healthy
    > 1.5: high fragmentation — consider MEMORY PURGE or restart
    > 2.0: severe fragmentation
```

## 3.2 Memory Limits & Eviction

```bash
# MAXMEMORY — hard limit
maxmemory 2gb                    # 2GB limit
maxmemory 0                      # no limit (dangerous for cache!)

# EVICTION POLICY — what to do when maxmemory reached
maxmemory-policy allkeys-lru     # recommended for cache

# POLICIES:
# noeviction:      error on write when full (default, bad for cache)
# allkeys-lru:     evict least recently used from ALL keys ← cache
# allkeys-lfu:     evict least frequently used from ALL keys ← cache
# allkeys-random:  evict random key from ALL keys
# volatile-lru:    evict LRU from keys WITH expiry set
# volatile-lfu:    evict LFU from keys WITH expiry set
# volatile-ttl:    evict key with shortest TTL from keys WITH expiry
# volatile-random: evict random key from keys WITH expiry

# CHOOSING POLICY:
# Cache (all keys are cache): allkeys-lru or allkeys-lfu
# Mixed (some permanent keys): volatile-lru
# Session storage: volatile-ttl (short sessions evicted first)
# Leaderboards (must keep all): noeviction + careful sizing

# LRU vs LFU:
# LRU: removes key not accessed recently
#   Problem: "one-hit wonders" — accessed once, stays in memory
# LFU (Redis 4.0+): removes key accessed least frequently
#   Better for: repeated access patterns, time series
#   More CPU overhead (maintains counter per key)

# LRU APPROXIMATION (Redis doesn't use true LRU!):
# True LRU: O(n) memory for doubly-linked list
# Redis LRU: sample maxmemory-samples keys, evict oldest among sample
maxmemory-samples 5              # check 5 random keys (default)
maxmemory-samples 10             # more accurate but more CPU

# MEMORY FRAGMENTATION ACTIVE DEFRAGMENTATION (Redis 4.0+):
activedefrag yes                 # enable active defrag
active-defrag-ignore-bytes 100mb # min fragmentation to start defrag
active-defrag-threshold-lower 10 # start if frag% > 10%
active-defrag-threshold-upper 100 # use max CPU if frag% > 100%
active-defrag-cycle-min 1        # min CPU for defrag
active-defrag-cycle-max 25       # max CPU for defrag (don't starve app)
```

## 3.3 Memory Optimization Techniques

```bash
# ── ENCODING THRESHOLDS ──
# Tune to keep small structures in compact encoding (listpack)
# More memory-efficient BUT slower for large datasets

hash-max-listpack-entries 128    # HASH uses listpack if ≤ 128 fields
hash-max-listpack-value 64       # HASH uses listpack if field ≤ 64 bytes

list-max-listpack-size -2        # max 8KB per listpack node
list-compress-depth 0            # compress middle nodes (0=none)

set-max-intset-entries 512       # SET of integers uses intset if ≤ 512
set-max-listpack-entries 128     # SET uses listpack if ≤ 128 members
set-max-listpack-value 64

zset-max-listpack-entries 128    # ZSET uses listpack if ≤ 128 members
zset-max-listpack-value 64       # ZSET uses listpack if member ≤ 64 bytes

# Example: 1000 hash fields vs 1000 small hashes:
# 1 hash with 1000 fields → hashtable encoding → normal memory
# vs 1000 hashes with 1 field each → 1000 dict entries overhead!
# SOLUTION: shard into groups
# user:1:profile → HSET with age, name, email (all fields together)

# ── KEY DESIGN FOR MEMORY EFFICIENCY ──

# BAD: long keys waste memory
SET user:session:abcdef123456:data "..."
# 28 bytes for key + robj overhead + dict entry = 100+ bytes just for key!

# BETTER: short keys
SET u:s:abcdef123456 "..."

# BEST for many similar keys: hash sharding
HSET u:s ab "cdef123456:data:..."
# Multiple sessions stored in one hash → listpack encoding → very efficient!

# ── OBJECT SHARING ──
# Integers 0-9999: pre-allocated, shared across all keys (refcount++)
# "1" always refers to same object in memory
# SET key1 100 → key1 points to shared integer 100
# SET key2 100 → key2 ALSO points to same shared integer 100
# Memory saved!
# Note: shared integers disabled when maxmemory-policy is LRU/LFU
# (LRU needs access time, shared objects can't have per-reference access time)

# CHECK OBJECT ENCODING:
127.0.0.1:6379> OBJECT ENCODING mykey
"embstr"        # or ziplist, listpack, skiplist, hashtable, intset...

# CHECK REFERENCE COUNT:
127.0.0.1:6379> OBJECT REFCOUNT mykey
1

# MEMORY USAGE per key:
127.0.0.1:6379> MEMORY USAGE mykey
(integer) 72     # 72 bytes for this key+value

# CHECK ALL KEYS FOR MEMORY (expensive! NEVER on production):
redis-cli --bigkeys             # find top 10 biggest keys per type
redis-cli --memkeys             # memory usage per key
redis-cli --hotkeys             # LFU-based hot keys (needs maxmemory-policy lfu)

# MEMORY DOCTOR:
127.0.0.1:6379> MEMORY DOCTOR
"Sam, I detected a few issues with this Redis instance memory implants:
 1. I detected little memory fragmentation, use MEMORY PURGE to defragment"
```

---

# 4. Data Structures — Deep Dive

## 4.1 String Internals

```bash
# 3 ENCODINGS for strings:
# INT: value is integer AND fits in long (64-bit signed)
SET counter 12345
OBJECT ENCODING counter      # "int"
# Stored as: redisObject.ptr = (void*)12345 (no separate allocation!)

# EMBSTR: string ≤ 44 bytes
SET name "Khang"
OBJECT ENCODING name         # "embstr"
# Stored as: robj + sds in ONE allocation (cache-friendly!)
# robj: 16 bytes, sds header: 4 bytes, string: N bytes

# RAW: string > 44 bytes
SET bio "A software engineer from Vietnam who loves backend development"
OBJECT ENCODING bio           # "raw"
# Two separate allocations: robj + sds

# WHY 44 bytes for embstr limit?
# jemalloc allocates in powers of 2: 8, 16, 32, 64...
# embstr total = 16 (robj) + 3 (sds header) + 1 (\0) = 20 bytes overhead
# 64 - 20 = 44 bytes for string content → fits in 64-byte jemalloc block
# One allocation = cache line friendly!

# IMPORTANT: EMBSTR IS IMMUTABLE
# Any modification (APPEND, SETRANGE) → converted to RAW
SET k "hello"
APPEND k " world"
OBJECT ENCODING k            # "raw" (converted!)

# BITMAP OPERATIONS (strings are byte arrays):
SETBIT user:123:login:2025-05-19 1 1  # user 123 logged in today (bit 1 = timezone adjusted)
GETBIT user:123:login:2025-05-19 1
BITCOUNT user:123:login:2025-05-19   # count days logged in this month
BITOP AND active:streak user:login:day1 user:login:day2  # both days active

# Use case: track 100M user daily activity
# 100M users × 1 bit = 12.5 MB per day!  (vs 100M × 8 bytes/long = 800MB)
```

## 4.2 List, Hash, Set, ZSet Internals

```bash
# ── SORTED SET (ZSET) — most complex data structure ──
# Internal: SKIPLIST + HASHTABLE (dual structure!)
# Skiplist: ordered by score → O(log n) range queries
# Hashtable: member → score → O(1) score lookup

# SKIPLIST STRUCTURE:
# Each node appears in multiple "levels" (probabilistic)
# Average 1.33 pointer per element
# O(log n) insert/delete/search

# Node 0:    [0:elem1:1.0] → [1:elem3:2.5] → [2:elem5:4.0] → NULL  (highest level)
# Node 1:    [0:elem1:1.0] → [1:elem2:1.5] → [2:elem3:2.5] → NULL
# Node 2:    [0:elem1:1.0] → [1:elem2:1.5] → [2:elem3:2.5] → [3:elem4:3.0]...

# DUAL STRUCTURE enables:
# ZADD:    O(log n) — skiplist insert + hashtable insert
# ZSCORE:  O(1) — hashtable lookup
# ZRANK:   O(log n) — skiplist traversal
# ZRANGE:  O(log n + k) — skiplist seek + scan

ZADD leaderboard 9500 "player1" 8800 "player2" 9900 "player3"
ZSCORE leaderboard "player1"          # O(1) → 9500
ZRANK leaderboard "player1"           # O(log n) → 1 (0-indexed)
ZREVRANK leaderboard "player1"        # O(log n) → 1 (from top)
ZRANGE leaderboard 0 -1 WITHSCORES REV  # O(log n + n) top scores
ZRANGEBYSCORE leaderboard 9000 +inf WITHSCORES  # score range query
ZINCRBY leaderboard 100 "player1"     # atomic increment O(log n)
ZPOPMAX leaderboard 3                 # remove top 3 O(log n × 3)

# ── GEOSPATIAL (stored as ZSET!) ──
# Geohash encoded as score (52-bit integer)
GEOADD locations 106.6297 10.8231 "Ho Chi Minh City"
GEOADD locations 105.8412 21.0245 "Hanoi"
GEODIST locations "Ho Chi Minh City" "Hanoi" km      # 1137.22 km
GEOSEARCH locations FROMMEMBER "Ho Chi Minh City" BYRADIUS 200 km ASC COUNT 10

# ── HYPERLOGLOG (probabilistic cardinality) ──
# Uses only 12KB regardless of cardinality!
# Counts unique elements with ~0.81% standard error
PFADD uv:2025-05-19 "user1" "user2" "user3" "user1"  # user1 counted once
PFCOUNT uv:2025-05-19                                  # ≈ 3
PFMERGE uv:week uv:2025-05-19 uv:2025-05-18           # merge multiple

# ── BLOOM FILTER (RedisBloom module) ──
BF.RESERVE mybloom 0.01 1000000   # 1% error, 1M items
BF.ADD mybloom "user:123"
BF.EXISTS mybloom "user:123"      # 1 (definitely added)
BF.EXISTS mybloom "user:999"      # 0 (definitely NOT added)
# Use: check if email exists without DB query, cache stampede prevention
```

---

# 5. Persistence — RDB & AOF

## 5.1 RDB (Redis Database) Snapshots

```bash
# RDB = point-in-time snapshot of entire dataset
# Binary format, compact, fast to restore

# TRIGGERED:
# 1. Manual: BGSAVE (background), SAVE (blocking!)
# 2. Automatic: save directive in config
#    save 900 1     # if ≥ 1 change in 900s → save
#    save 300 10    # if ≥ 10 changes in 300s → save
#    save 60 10000  # if ≥ 10000 changes in 60s → save
# 3. Shutdown: automatic BGSAVE on SHUTDOWN
# 4. Replication: master sends RDB to new replica

# HOW BGSAVE WORKS:
# Main process: fork() → child process
# Child: iterate ALL keys → write to dump.rdb.tmp
# Main: continues handling requests (copy-on-write!)
# Child finishes → rename dump.rdb.tmp to dump.rdb
# Main: resume (brief rename only)

# FORK + COPY-ON-WRITE:
# After fork: parent + child SHARE same memory pages
# Pages marked read-only
# When parent WRITES a key: OS copies that page for parent (COW)
# Child still reads original page
# Memory overhead during save = size of modified pages
# Worst case: modifying ALL keys during save = 2x memory!

# RDB FILE SIZE:
# Compressed (LZF), typically 50-70% of in-memory size
# 10GB Redis → 5-7GB RDB file

# PROS:
# ✅ Compact single file
# ✅ Fast restart (binary load, no command replay)
# ✅ Great for backups, DR, replicas
# ✅ Low performance impact when not saving

# CONS:
# ❌ Data loss between snapshots (up to save interval)
# ❌ Fork can be slow for large datasets (GB+)
#    fork() itself: ~100ms for 10GB dataset
# ❌ Not suitable if data loss = 0 tolerance

# CONFIG:
dbfilename dump.rdb
dir /var/lib/redis/
rdbcompression yes
rdbchecksum yes
save 900 1
save 300 10
save 60 10000
```

## 5.2 AOF (Append-Only File)

```bash
# AOF = log of every write command
# Replay commands on restart → reconstruct state

# FSYNC POLICIES:
appendonly yes
appendfsync always      # fsync after EVERY command — safest, slowest (1000s ops/sec)
appendfsync everysec    # fsync every 1 second — recommended (100K+ ops/sec, 1s data loss)
appendfsync no          # let OS decide (fastest, but >1s data loss possible)

# HOW AOF WORKS:
# Redis receives write command
# Execute command (modify in-memory data)
# Write command text to AOF buffer
# Fsync AOF buffer to disk (per appendfsync policy)

# AOF FILE GROWTH:
# Problem: AOF grows forever!
# SET k 1 → INCR k → INCR k → INCR k → AOF has 4 lines
# But only final state matters: SET k 4 → 1 line
# SOLUTION: AOF Rewrite (compaction)

# AOF REWRITE:
# BGREWRITEAOF triggers rewrite
# Child process: iterate in-memory state → write minimal commands
# auto-aof-rewrite-percentage 100  # rewrite when AOF doubles in size
# auto-aof-rewrite-min-size 64mb   # minimum AOF size to trigger rewrite

# HOW REWRITE WORKS (safe):
# Main process: fork() → child starts rewriting
# Main: continues handling requests, writes to BOTH old AOF AND rewrite buffer
# Child: finishes rewriting in-memory state
# Main: appends rewrite buffer to new AOF file
# Main: atomically rename new AOF over old AOF
# Result: no data loss even during rewrite!

# MIXED PERSISTENCE (Redis 4.0+) — RECOMMENDED:
aof-use-rdb-preamble yes
# AOF file format: RDB snapshot at start + AOF commands after last RDB
# Faster restart (RDB loading + fewer AOF commands to replay)
# Smaller AOF file (RDB compressed preamble)

# PROS:
# ✅ Minimal data loss (1 second with everysec)
# ✅ Human readable commands (can manually edit!)
# ✅ Rewrite keeps it compact
# ✅ Durable: fsync every second

# CONS:
# ❌ Larger file than RDB
# ❌ Slower restart (command replay vs binary load)
# ❌ Slightly higher write overhead (disk write per second)
```

## 5.3 Persistence Strategy Decision

```
PERSISTENCE STRATEGY GUIDE:

SCENARIO                    STRATEGY
──────────────────────────────────────────────────────────────────
Pure cache (data in DB)      No persistence (save "")
                             → fastest, no overhead
                             → On restart: warm cache from DB

Cache + audit/analytics      AOF only (everysec)
                             → 1 second data loss acceptable
                             → Reasonable performance

Primary database usage       RDB + AOF together (RECOMMENDED)
                             → Near-zero data loss
                             → Fast restart (RDB loads, AOF catches up)

Financial/critical data      AOF + appendfsync always
                             → Zero data loss per command
                             → 10-30x write overhead vs everysec

Replicated setup             Master: AOF everysec
                             Replica: RDB for fast resync
                             → Balance of safety + performance

# redis.conf for RDB + AOF (recommended):
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

RESTART BEHAVIOR:
  AOF exists → load from AOF (more recent)
  Only RDB → load from RDB
  Neither → start empty
```

---

# 6. Replication

## 6.1 Master-Replica Replication

```
Redis replication: asynchronous by default
  Master processes writes, sends to replicas
  Replicas are read-only copies (by default)
  
REPLICA SYNC PROCESS:
  1. Replica connects to master
  2. Replica sends PSYNC (tries partial sync if reconnecting)
  3. Master: if replica in replication backlog → send diff (partial sync!)
     Master: if not → BGSAVE + send RDB (full sync)
  4. Master sends RDB to replica
  5. Replica: flush existing data, load RDB
  6. Master: send buffered commands during RDB transfer
  7. Replica: apply buffered commands
  8. Ongoing: master sends commands to replica in real-time

REPLICATION BACKLOG:
  Ring buffer on master (default 1MB)
  Stores recent commands for partial resync
  If replica disconnects briefly → reconnects → gets diff from backlog
  If disconnected too long → backlog overwritten → full resync needed!
  
  repl-backlog-size 10mb    # increase for large datasets + slow networks
  repl-backlog-ttl 3600     # keep backlog 1 hour after all replicas disconnect

CONFIG:
  # On replica:
  replicaof 192.168.1.10 6379
  # Or:
  REPLICAOF 192.168.1.10 6379  # at runtime
  
  # Replica reads: allowed (default) or forbidden
  replica-read-only yes    # replicas are read-only

REPLICATION LAG:
  Check lag on master:
  INFO replication
  # connected_slaves:1
  # slave0:ip=127.0.0.1,port=6380,state=online,offset=12345,lag=0
  
  lag=0: replica in sync
  lag>0: replica behind by N seconds

REPLICA PRIORITY for failover (Sentinel):
  replica-priority 100    # higher = less preferred as master
  replica-priority 0      # never promote as master (e.g., backup node)

WAIT COMMAND — synchronous replication when needed:
  WAIT 1 1000   # wait for 1 replica to ack, timeout 1000ms
  # Returns number of replicas that confirmed (0 if timeout)
  # Use for: critical writes that MUST be on at least 1 replica
```

---

# 7. Redis Sentinel — High Availability

## 7.1 Sentinel Architecture

```
SENTINEL MONITORS master and replicas
  Automatic failover: promotes replica to master if master dies
  Configuration provider: clients ask Sentinel for master address
  
SETUP (minimum 3 sentinels for quorum!):
  ┌──────────────────────────────────────────────────────────┐
  │  Sentinel 1   Sentinel 2   Sentinel 3   ← separate hosts!│
  │      │             │             │                       │
  │      └─────────────┼─────────────┘                       │
  │                    │ monitor                              │
  │              ┌─────▼──────┐                              │
  │              │   Master   │────replication────▶ Replica 1│
  │              └────────────┘                   Replica 2  │
  └──────────────────────────────────────────────────────────┘

sentinel.conf:
  sentinel monitor mymaster 192.168.1.10 6379 2
  # name: mymaster
  # master host: 192.168.1.10:6379
  # quorum: 2 (need 2 sentinels to agree master is down)
  
  sentinel down-after-milliseconds mymaster 5000   # 5s no response = subjective down
  sentinel failover-timeout mymaster 60000         # failover timeout 60s
  sentinel parallel-syncs mymaster 1               # 1 replica syncs at a time

FAILOVER PROCESS:
  1. Sentinel can't ping master for down-after-milliseconds
  2. Sentinel marks master as "Subjectively Down" (SDOWN)
  3. Sentinel gossips with other sentinels about SDOWN
  4. When quorum agrees: "Objectively Down" (ODOWN)
  5. Sentinels elect a LEADER sentinel (Raft-like)
  6. Leader sentinel chooses best replica to promote:
     - Replica with lowest replica-priority
     - Replica with highest replication offset (most up-to-date!)
     - Replica with lowest Run ID (tiebreaker)
  7. Leader sentinel sends SLAVEOF NO ONE to chosen replica
  8. Other replicas: REPLICAOF new-master
  9. Sentinels update configuration
  10. Clients notified (Sentinel pushes +switch-master event)

CLIENT INTEGRATION:
  Clients MUST support Sentinel (not just connect to fixed host!)
  
  # Spring Boot:
  spring.redis.sentinel.master: mymaster
  spring.redis.sentinel.nodes: sentinel1:26379,sentinel2:26379,sentinel3:26379
  
  # Jedis:
  Set<String> sentinels = Set.of("s1:26379", "s2:26379", "s3:26379");
  JedisSentinelPool pool = new JedisSentinelPool("mymaster", sentinels);
  try (Jedis jedis = pool.getResource()) {
      jedis.set("key", "value");
  }
  
  # Lettuce (Spring Boot default):
  # Automatically handles failover via Sentinel subscription!
  # Reconnects to new master after failover

FAILOVER DURATION:
  Typical: 5-30 seconds
  = down-after-milliseconds + election time + sync time
  Clients: "connection refused" or "timeout" during failover
  → Design for this: retry logic, circuit breaker!
```

---

# 8. Redis Cluster — Horizontal Scaling

## 8.1 Cluster Architecture

```
REDIS CLUSTER = automatic sharding + replication + failover
  Data split across multiple master nodes
  Each master has replicas for HA
  16384 hash slots distributed across masters

HASH SLOT ASSIGNMENT:
  key → CRC16(key) % 16384 → slot number → which node
  
  3 masters, equal split:
  Master 1: slots 0-5460     (5461 slots)
  Master 2: slots 5461-10922 (5462 slots)
  Master 3: slots 10923-16383(5461 slots)

┌─────────────────────────────────────────────────────────────────┐
│  Redis Cluster (3 masters, 3 replicas)                          │
│                                                                 │
│  M1 (0-5460)    M2 (5461-10922)    M3 (10923-16383)            │
│  R1             R2                 R3                           │
│                                                                 │
│  Clients connect to ANY node → get MOVED redirect if wrong!    │
└─────────────────────────────────────────────────────────────────┘

CLUSTER REDIRECT:
  Client sends GET user:123 to M1
  M1 checks: slot(user:123) = CRC16("user:123") % 16384 = 5474 → M2!
  M1 responds: -MOVED 5474 192.168.1.12:6379
  Client reconnects to M2 and retries
  
  Smart client: caches slot→node mapping → routes directly next time!
  Dumb client: follows MOVED every time → slow

HASH TAGS — force keys to same slot:
  {user:123}:profile  → hash of "user:123" → always same slot
  {user:123}:orders   → hash of "user:123" → same slot!
  
  Use for: multi-key operations, MGET, transactions, Lua scripts
  Without hash tags: MGET across different slots = CROSSSLOT ERROR!
  
  WRONG:
  MGET user:123:profile user:123:orders   # might be on different nodes!
  
  CORRECT:
  MGET {user:123}:profile {user:123}:orders  # same slot guaranteed

GOSSIP PROTOCOL:
  Nodes gossip with each other every second
  Share: node list, slot assignments, health status
  Failure detection: node marked PFAIL after cluster-node-timeout
  Cluster-wide failure: quorum agreement → FAIL

CLUSTER CONFIG:
  cluster-enabled yes
  cluster-config-file nodes.conf
  cluster-node-timeout 5000      # 5s to mark node as possibly failed
  cluster-require-full-coverage no  # continue if some slots uncovered
  # yes (default): if ANY slot has no master → cluster refuses all commands!
  # no: serve requests for available slots, error for unavailable
```

## 8.2 Cluster Operations

```bash
# CREATE CLUSTER:
redis-cli --cluster create \
  127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 \
  127.0.0.1:7004 127.0.0.1:7005 127.0.0.1:7006 \
  --cluster-replicas 1  # 1 replica per master → 3 masters, 3 replicas

# CHECK CLUSTER STATUS:
redis-cli -c -p 7001 CLUSTER INFO
redis-cli -c -p 7001 CLUSTER NODES

# ADD NEW NODE:
redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7001

# REBALANCE (move slots to new node):
redis-cli --cluster rebalance 127.0.0.1:7001

# REMOVE NODE:
redis-cli --cluster del-node 127.0.0.1:7001 <node-id>

# MANUAL SLOT MIGRATION:
redis-cli --cluster reshard 127.0.0.1:7001
# Interactive: specify slots to move, source, destination

# -c flag: cluster mode (follows MOVED redirects)
redis-cli -c -p 7001 SET mykey "value"   # automatically redirected!
redis-cli -c -p 7001 GET mykey

# CLUSTER LIMITATIONS:
# ❌ No transactions (MULTI/EXEC) across different slots
# ❌ No Lua scripts accessing keys in different slots
# ❌ No SCAN across all keys (need to scan each node separately)
# ❌ SELECT (database) not supported — only DB 0
# ❌ KEYS pattern — returns only keys on that node
```

---

# 10. Failure Cases — The Dangerous Scenarios

## 10.1 Cache Avalanche (Tuyết Lở) 🌊

```
DEFINITION: Many cache keys expire SIMULTANEOUSLY
            → Massive simultaneous requests hit the database
            → Database overloaded → cascade failure

SCENARIO:
  E-commerce flash sale starts at 12:00:00
  All product cache loaded at 11:59:55 with TTL=300s
  → ALL expire at 12:04:55 simultaneously!
  
  12:04:55: 50,000 requests/sec, ALL cache miss
  → 50,000 DB queries simultaneously
  → DB: max_connections=200, queue full
  → 50,000 - 200 = 49,800 requests: timeout/error
  → App servers: thread pool exhausted
  → MORE retries: double the requests!
  → TOTAL SYSTEM FAILURE

DIAGRAM:
  Normal:     [cache: ████████████] DB: ▄▄▄▄▄ (5% load)
  Avalanche:  [cache: expiry!     ] DB: █████████████ (500% → CRASH)

CAUSES:
  1. Keys set with same TTL (batch loading)
  2. Server restart (all cache lost)
  3. Memory limit reached + aggressive eviction
  4. Cache clear operation (FLUSHALL on production — NEVER!)
```

```java
// ── SOLUTIONS ──

// SOLUTION 1: Jitter (randomize TTL)
// Don't use fixed TTL — add random component
public void cacheProduct(Product product) {
    int baseTTL = 3600;   // 1 hour base
    int jitter  = ThreadLocalRandom.current().nextInt(0, 600); // 0-10 min random
    int finalTTL = baseTTL + jitter;
    
    redis.setex("product:" + product.getId(), finalTTL, serialize(product));
}
// Result: products expire at different times → no simultaneous flood

// SOLUTION 2: Layered Cache TTL
// Some keys: 5 min TTL (frequently refreshed)
// Some keys: 1 hour TTL (stable data)
// Some keys: 24 hour TTL (rarely changing)
// Natural staggering, no single expiry wave

// SOLUTION 3: Soft TTL + Async Refresh
// Keep "logical TTL" < "physical TTL"
// Check logical TTL: if expired → async refresh, serve stale data
// Physical TTL: safety net (data eventually removed)

public record CachedValue<T>(T value, long softExpiry) {}

public Product getProduct(String id) {
    CachedValue<Product> cached = (CachedValue<Product>) redis.get("product:" + id);
    
    if (cached == null) {
        // Full cache miss: load from DB (under lock to prevent stampede)
        return loadAndCacheProduct(id);
    }
    
    if (System.currentTimeMillis() > cached.softExpiry()) {
        // Soft expired: serve stale data + async refresh
        asyncRefreshExecutor.submit(() -> refreshProduct(id));
        return cached.value();  // return stale immediately!
    }
    
    return cached.value();
}
// Physical TTL = softTTL + 30s buffer (ensures stale served while refreshing)

// SOLUTION 4: Never-expire Cache + Event-based Invalidation
// Keys have NO TTL (stay forever)
// Invalidated when data changes in DB (via CDC/Debezium or application events)
redis.set("product:" + id, serialize(product));  // no TTL!
// On product update: redis.del("product:" + id)

// SOLUTION 5: Circuit Breaker for DB
@CircuitBreaker(name = "database", fallbackMethod = "getCachedProduct")
public Product loadFromDB(String id) {
    return productRepository.findById(id);
}
public Product getCachedProduct(String id, Exception e) {
    // Circuit open: serve whatever we have (stale) or default response
    Product stale = (Product) redis.get("stale:product:" + id);
    return stale != null ? stale : Product.unavailable(id);
}

// SOLUTION 6: Pre-warming Cache (before TTL expiry)
@Scheduled(fixedDelay = 300000)  // every 5 minutes
public void prewarmPopularProducts() {
    List<String> popularIds = analyticsService.getTopProductIds(100);
    popularIds.forEach(id -> {
        Product product = productRepository.findById(id);
        int ttl = 3600 + ThreadLocalRandom.current().nextInt(600);
        redis.setex("product:" + id, ttl, serialize(product));
    });
}
```

## 10.2 Cache Stampede / Cache Dog-Piling 🐕

```
DEFINITION: Single cache key expires
            Multiple concurrent requests notice the miss simultaneously
            All rush to compute/fetch the value → duplicate work → DB overload

SCENARIO:
  GET popular_product_123 → MISS (expired)
  100 concurrent requests → ALL see miss → ALL query DB → 100 DB queries!
  Only need 1 query! 99 are wasted.
  
  Popular key: 10,000 requests/sec
  Key expires → 10,000 simultaneous cache misses
  10,000 expensive DB queries → DB crash
  Even with fast DB: duplicate computation waste

DIAGRAM:
  t=0: [cache miss!]
       Thread 1 →DB query starts...
       Thread 2 →DB query starts...
       Thread 3 →DB query starts...
       ...
       Thread 100 →DB query starts...
  t=50ms: all 100 queries return, all 100 write to cache
  Result: 100 DB queries where 1 would suffice!
```

```java
// ── SOLUTIONS ──

// SOLUTION 1: Redis Lock (Mutex/Semaphore on cache miss)
public Product getProductWithLock(String id) {
    String cacheKey = "product:" + id;
    String lockKey  = "lock:product:" + id;
    
    // 1. Try cache
    String cached = redis.get(cacheKey);
    if (cached != null) return deserialize(cached);
    
    // 2. Cache miss → try to acquire lock
    boolean acquired = redis.setnx(lockKey, "1");  // atomic set if not exists
    if (acquired) {
        redis.expire(lockKey, 10);  // 10s TTL (safety, prevent deadlock)
        try {
            // 3. Got lock → check cache again (double-check!)
            cached = redis.get(cacheKey);
            if (cached != null) return deserialize(cached);
            
            // 4. Still miss → load from DB
            Product product = productRepository.findById(id);
            redis.setex(cacheKey, 3600, serialize(product));
            return product;
        } finally {
            redis.del(lockKey);  // release lock
        }
    } else {
        // 5. Didn't get lock → wait and retry
        Thread.sleep(50);   // wait 50ms
        return getProductWithLock(id);  // retry
    }
}

// PROBLEM with above: thread waiting is wasteful
// Better: non-blocking with Lua for atomicity

// SOLUTION 2: Probabilistic Early Expiration (XFetch)
// Stochastic approach: some requests refresh BEFORE expiry
public Product getProductXFetch(String id) {
    CacheEntry<Product> entry = redis.get("product:" + id);
    if (entry == null) return fetchFromDB(id);
    
    double ttlRemaining = redis.pttl("product:" + id) / 1000.0;  // seconds
    double beta = 1.0;  // tuning parameter
    
    // Probability increases as TTL decreases
    // XFetch formula: if current_time - beta × delta × ln(uniform(0,1)) > expiry_time
    double delta = entry.getComputeTime();  // how long to compute this value
    
    if (-beta * delta * Math.log(Math.random()) > ttlRemaining) {
        // Proactively refresh (some requests do this before expiry)
        Product fresh = fetchFromDB(id);
        redis.setex("product:" + id, 3600, serialize(fresh));
        return fresh;
    }
    return entry.getValue();
}

// SOLUTION 3: Background Refresh Thread
// Detect TTL < threshold → trigger async refresh
public Product getProductWithBgRefresh(String id) {
    String cacheKey = "product:" + id;
    String cached = redis.get(cacheKey);
    
    if (cached == null) {
        return fetchAndCache(id);  // full miss, synchronous
    }
    
    Long ttl = redis.ttl(cacheKey);
    if (ttl != null && ttl < 60) {  // expires in < 60 seconds
        String refreshLock = "refresh:" + id;
        if (redis.setnx(refreshLock, "1")) {  // only one refresher
            redis.expire(refreshLock, 30);
            CompletableFuture.runAsync(() -> {
                try {
                    fetchAndCache(id);  // background refresh
                } finally {
                    redis.del(refreshLock);
                }
            });
        }
    }
    return deserialize(cached);  // return current (stale-while-revalidating)
}

// SOLUTION 4: Bloom Filter (prevent stampede for non-existent keys)
// Don't even query DB if key definitely doesn't exist
BF.RESERVE product_existence 0.001 10000000  # 0.1% error, 10M products

// On product creation:
BF.ADD product_existence "product:123456"

// On cache miss:
public Product getProduct(String id) {
    String cached = redis.get("product:" + id);
    if (cached != null) return deserialize(cached);
    
    // Check bloom filter before hitting DB
    if (!redis.bfExists("product_existence", "product:" + id)) {
        return null;  // definitely doesn't exist, skip DB!
    }
    
    // Exists (probably) → fetch from DB
    return fetchAndCache(id);
}
```

## 10.3 Cache Penetration (Tấn Công Xuyên Cache) 🎯

```
DEFINITION: Requests for keys that DON'T EXIST in cache OR database
            Every request bypasses cache → hits DB
            Malicious: attacker floods with random non-existent IDs

SCENARIO:
  Normal: GET user:123 → cache hit → fast
  Attack: GET user:9999999999 (doesn't exist)
          → cache miss
          → DB query: "SELECT * FROM users WHERE id=9999999999"
          → DB: not found
          → cache: nothing to cache (no value!)
          → Next request: same key → same behavior
          
  10,000 req/sec with random non-existent IDs → 10,000 DB queries/sec!
  Cache provides ZERO protection!
```

```java
// SOLUTIONS:

// SOLUTION 1: Cache Null Values
public User getUser(String id) {
    String cacheKey = "user:" + id;
    String cached = redis.get(cacheKey);
    
    if (cached != null) {
        if (cached.equals("__NULL__")) return null;  // cached null
        return deserialize(cached);
    }
    
    User user = userRepository.findById(id).orElse(null);
    
    if (user == null) {
        redis.setex(cacheKey, 60, "__NULL__");  // cache null for 60s
        return null;
    }
    
    redis.setex(cacheKey, 3600, serialize(user));
    return user;
}
// Problem: attacker with different random IDs still gets through
// Millions of cached nulls waste memory

// SOLUTION 2: Bloom Filter (best solution for penetration)
// Bloom filter: "Is this user ID in our system?"
// False positive: possible (0.1%) → extra DB query (acceptable)
// False negative: IMPOSSIBLE → if not in filter, definitely doesn't exist

// Init on startup:
void initBloomFilter() {
    BF.RESERVE users_bf 0.001 50_000_000  # 0.1% FP, 50M users
    // Batch populate:
    userRepository.findAllIds().forEach(id -> 
        redis.bfAdd("users_bf", id.toString()));
}

// On new user creation:
void createUser(User user) {
    userRepository.save(user);
    redis.bfAdd("users_bf", user.getId().toString());
}

// On request:
public User getUser(String id) {
    // Quick bloom filter check BEFORE cache
    if (!redis.bfExists("users_bf", id)) {
        return null;  // Impossible to exist → skip DB completely!
    }
    
    String cached = redis.get("user:" + id);
    if (cached != null) return deserialize(cached);
    
    return fetchAndCache(id);  // bloom says might exist → check DB
}

// SOLUTION 3: Rate Limiting + IP Blocking
// If same IP sends 100+ requests for non-existent IDs → block

// SOLUTION 4: Cryptographic Token for valid IDs
// Encode ID as: base64(id + HMAC(id, secret))
// Validate HMAC before any cache/DB lookup
// Invalid HMAC → reject immediately (no cache or DB hit!)
```

## 10.4 Hot Key Problem (Điểm Nóng) 🔥

```
DEFINITION: One or few keys receive disproportionate traffic
            Single Redis instance/partition overwhelmed
            
SCENARIO:
  Flash sale: "iphone16pro_stock" key
  10M users check stock simultaneously → ALL hit same Redis key
  Redis single-threaded: 1M reads/sec on ONE key
  Other keys on same server: starved for CPU!
  Redis CPU: 100% on that one key
  Response time: spikes for ALL keys on that server
  
  In Redis Cluster: hot key always maps to same node → that node overloaded!
  Other nodes: idle while hot node burns

DETECT HOT KEYS:
  # Method 1: redis-cli hotkeys (requires LFU policy)
  redis-cli --hotkeys -p 6379
  
  # Method 2: monitor (WARNING: very high overhead!)
  redis-cli monitor | awk '{print $4}' | sort | uniq -c | sort -rn | head
  # Only use briefly in production!
  
  # Method 3: Proxy-level monitoring (Twemproxy, Redis Cluster proxy)
  
  # Method 4: Application-level tracking
  @Aspect
  public class CacheAccessAspect {
      private final AtomicLongMap<String> accessCounts = AtomicLongMap.create();
      
      @Around("@annotation(Cacheable)")
      public Object trackAccess(ProceedingJoinPoint pjp, String key) {
          accessCounts.incrementAndGet(key);
          if (accessCounts.get(key) % 10000 == 0) {
              log.warn("HOT KEY detected: {} accessed {} times", key, accessCounts.get(key));
          }
          return pjp.proceed();
      }
  }
```

```java
// SOLUTIONS:

// SOLUTION 1: Local Cache (L1 in-process)
// Hot keys cached in application memory → no Redis request at all!
LoadingCache<String, Product> localCache = Caffeine.newBuilder()
    .maximumSize(1000)
    .expireAfterWrite(Duration.ofSeconds(5))    // short TTL (stale risk)
    .recordStats()
    .build(key -> redis.get(key));              // load from Redis on miss

public Product getHotProduct(String id) {
    return localCache.get("product:" + id);  // hits JVM cache first!
}
// Result: 10M requests/sec hit L1 cache → 0 Redis requests per server!
// (Until 5s TTL expires → only 1 Redis request per app server instance)

// SOLUTION 2: Key Splitting / Read Replicas for specific key
// Instead of 1 key "iphone16pro_stock", create N copies:
// "iphone16pro_stock:shard:0" through "iphone16pro_stock:shard:9"
// Each read randomly picks one shard

int HOT_KEY_SHARDS = 10;

public String getHotKeyValue(String key) {
    int shard = ThreadLocalRandom.current().nextInt(HOT_KEY_SHARDS);
    String shardKey = key + ":shard:" + shard;
    
    String value = redis.get(shardKey);
    if (value != null) return value;
    
    // On cache miss: only ONE shard updates (prevent stampede)
    value = db.get(key);
    // Populate ALL shards:
    for (int i = 0; i < HOT_KEY_SHARDS; i++) {
        redis.setex(key + ":shard:" + i, 10, value);  // 10s TTL
    }
    return value;
}

// SOLUTION 3: Read from Replicas for read-heavy hot keys
// Set replica for read-only traffic on specific nodes
// Lettuce/Jedis: configure to read from replicas
LettuceClientConfiguration config = LettuceClientConfiguration.builder()
    .readFrom(ReadFrom.REPLICA_PREFERRED)  // prefer replicas for reads
    .build();

// SOLUTION 4: Rate Limiting with local counter
// Cap requests per key at application level
RateLimiter hotKeyLimiter = RateLimiter.create(100_000);  // 100K/s limit

public Product getProduct(String id) {
    if (isHotKey(id) && !hotKeyLimiter.tryAcquire()) {
        return getFromLocalCache(id);   // serve stale from local cache
    }
    return getFromRedis(id);
}
```

## 10.5 Redis Cannot Handle Load 🚨

```
SYMPTOMS:
  - Latency spikes (P99 > 10ms)
  - "NOAUTH", "OOM" errors
  - Connection refused
  - CPU 100% on Redis
  - Memory usage approaching maxmemory
  - Consumer lag growing
  - Application threads blocking on Redis

ROOT CAUSES:

1. SLOW COMMANDS (most common cause of Redis "freezing"):
   KEYS * (scans ALL keys in DB — O(n) blocking!)
   SMEMBERS on huge sets (returns all members)
   LRANGE on huge lists
   SORT on huge collections
   HGETALL on huge hashes
   FLUSHALL, FLUSHDB (clears everything, blocking)
   
   Rule: O(n) commands on large collections = DANGEROUS!
   NEVER use KEYS * in production!

2. BIG KEY operations:
   GET/SET on 10MB string → 10ms to serialize/deserialize
   SADD to set with 10M members
   Blocks ALL other clients during that time!
   
   Check for big keys:
   redis-cli --bigkeys
   MEMORY USAGE bigkey

3. AOF rewrite + RDB save simultaneously:
   Two fork() operations + disk I/O + copy-on-write
   Can use 2x memory + max disk write throughput

4. Network bandwidth saturation:
   MGET 10000 large values → gigabytes of data per second
   Monitor: redis_net_output_bytes_total

5. Connection exhaustion:
   maxclients 10000 (default)
   More connections than maxclients → "ERR max number of clients reached"
   Each idle connection: ~1KB memory overhead
```

```java
// SOLUTIONS FOR OVERLOADED REDIS:

// SOLUTION 1: Replace KEYS with SCAN (non-blocking)
// ❌ NEVER in production:
Set<String> allKeys = jedis.keys("user:*");  // blocks ALL clients!

// ✅ ALWAYS use SCAN:
ScanParams params = new ScanParams().match("user:*").count(100);
String cursor = "0";
List<String> allKeys = new ArrayList<>();
do {
    ScanResult<String> result = jedis.scan(cursor, params);
    allKeys.addAll(result.getResult());
    cursor = result.getCursor();
} while (!cursor.equals("0"));
// SCAN is O(1) per call, iterative, non-blocking!

// SOLUTION 2: Pipeline (batch commands, reduce round trips)
// ❌ Multiple separate commands (N round trips):
for (String id : userIds) {
    User user = redis.get("user:" + id);  // N × (send + wait + receive)
}

// ✅ Pipeline (1 round trip for N commands):
Pipeline pipeline = jedis.pipelined();
List<Response<String>> responses = new ArrayList<>();
for (String id : userIds) {
    responses.add(pipeline.get("user:" + id));
}
pipeline.sync();  // send all at once!
List<User> users = responses.stream()
    .map(r -> deserialize(r.get()))
    .collect(toList());
// Result: 1 network round trip instead of N!

// SOLUTION 3: Lettuce AsyncCommands + Reactive
// Non-blocking Redis calls — don't waste threads!
RedisAsyncCommands<String, String> async = connection.async();
CompletableFuture<String> future = (CompletableFuture<String>) async.get("key");
future.thenAccept(value -> process(value));
// Thread released while waiting for Redis!

// SOLUTION 4: Connection Pool tuning
GenericObjectPoolConfig<Connection> poolConfig = new GenericObjectPoolConfig<>();
poolConfig.setMaxTotal(50);     // max connections in pool
poolConfig.setMaxIdle(20);      // max idle connections
poolConfig.setMinIdle(5);       // min idle connections
poolConfig.setMaxWaitMillis(1000); // max wait for available connection

// SOLUTION 5: Compress large values
// Before storing 1MB JSON:
byte[] compressed = compress(serializedValue);
redis.set(key, compressed);
// 1MB → 100KB (10x reduction!) → faster network + less memory

// SOLUTION 6: Lua scripts for atomic read-modify-write
// Eliminates round trips for complex operations
String luaScript = """
    local current = redis.call('GET', KEYS[1])
    if current == nil then
        redis.call('SET', KEYS[1], ARGV[1])
        return ARGV[1]
    end
    local newVal = tonumber(current) + tonumber(ARGV[1])
    redis.call('SET', KEYS[1], newVal)
    return newVal
""";
// 1 round trip instead of GET + logic + SET = 2 round trips!
```

## 10.6 Memory Fragmentation Crisis

```
PROBLEM:
  Redis reports used_memory=4GB but used_memory_rss=8GB
  mem_fragmentation_ratio=2.0 (extremely high!)
  
  WHY: Redis allocates and frees many small objects
  jemalloc leaves gaps (fragmented blocks)
  Result: allocated 4GB but OS sees 8GB resident!

SYMPTOMS:
  - Server OOM killer kills Redis
  - "MISCONF Redis is configured to save RDB snapshots, but is currently not able"
  - Memory errors even though usage seems OK

SOLUTIONS:
  # Solution 1: Active defrag (Redis 4.0+)
  activedefrag yes
  active-defrag-ignore-bytes 100mb
  active-defrag-threshold-lower 10  # start at 10% fragmentation
  active-defrag-threshold-upper 100
  active-defrag-cycle-min 25        # use 25% CPU min for defrag
  active-defrag-cycle-max 75        # use max 75% CPU for defrag
  
  # Solution 2: MEMORY PURGE command (Redis 4.0+)
  # Force allocator to release unused memory to OS
  127.0.0.1:6379> MEMORY PURGE
  
  # Solution 3: Restart (extreme, data loss if not persistent)
  # Redis restart clears fragmentation
  # Use with persistence (AOF) to restore data after restart
  
  # Solution 4: jemalloc background thread
  # jemalloc has built-in background thread for purging
  # Enabled by default in Redis 6.0+
```

---

# 11. Redis Under Load — Bottlenecks & Solutions

## 11.1 Slow Log Analysis

```bash
# SLOWLOG: records commands taking longer than threshold
slowlog-log-slower-than 10000   # 10ms threshold (microseconds!)
slowlog-max-len 128             # keep last 128 slow commands

# View slow commands:
SLOWLOG GET 25           # get last 25 slow commands
# Output: [id, timestamp, microseconds, [command args]]
# 1) 1) (integer) 14             # ID
#    2) (integer) 1368448221     # Unix timestamp
#    3) (integer) 15             # microseconds
#    4) 1) "ping"
#    5) "127.0.0.1:51635"        # client IP
#    6) ""                       # client name

SLOWLOG LEN              # how many slow commands recorded
SLOWLOG RESET            # clear slowlog

# Typical slow commands found:
# KEYS * → replace with SCAN
# SMEMBERS huge_set → replace with SSCAN + paginate
# SORT large_list → use ZSET instead
# LRANGE 0 -1 on huge list → paginate with LRANGE 0 99, etc.
# HGETALL huge_hash → use HSCAN
```

## 11.2 Latency Monitoring

```bash
# LATENCY MONITORING (Redis 2.8.13+):
latency-monitor-threshold 100  # monitor operations > 100ms

# Commands:
LATENCY LATEST               # latest latency events per command type
LATENCY HISTORY event        # history of a specific event
LATENCY RESET                # clear latency data

# LATENCY DOCTOR — automated diagnosis!
LATENCY DOCTOR
# Output examples:
# "I detected latency issues due to AOF rewrite - consider turning off AOF"
# "I noticed fork() latency of 200ms - ensure transparent huge pages disabled"

# INTRINSIC LATENCY TEST:
redis-cli --intrinsic-latency 100
# Measures worst-case OS/hardware latency for 100 seconds
# Expected: <100 microseconds
# If >500ms: OS problem (swapping, THP, CPU throttling)

# MEASURE FROM CLIENT:
redis-cli --latency -h localhost -p 6379
redis-cli --latency-history -h localhost -p 6379  # history per second
redis-cli --latency-dist -h localhost -p 6379      # distribution

# KERNEL TUNING for low latency:
# Disable Transparent Huge Pages (THP):
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
# THP causes: fork() latency, copy-on-write overhead
# Redis docs: ALWAYS disable THP for Redis!

# Disable NUMA:
numactl --interleave=all redis-server redis.conf

# Increase somaxconn:
sysctl -w net.core.somaxconn=65535

# Increase tcp_backlog:
sysctl -w net.ipv4.tcp_max_syn_backlog=65535
# Also set in redis.conf:
tcp-backlog 65535
```

---

# 12. Lua Scripts & Transactions

## 12.1 Lua Scripts — Atomic Operations

```java
// WHY Lua: atomic read-modify-write without WATCH/MULTI/EXEC overhead
// Lua scripts run atomically — no other commands interleaved!

// ── RATE LIMITER (sliding window) ──
String rateLimitScript = """
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local expire_at = now - window
    
    -- Remove old requests outside window
    redis.call('ZREMRANGEBYSCORE', key, '-inf', expire_at)
    
    -- Count requests in window
    local count = redis.call('ZCARD', key)
    
    if count < limit then
        -- Add current request
        redis.call('ZADD', key, now, now .. math.random())
        redis.call('EXPIRE', key, window / 1000)
        return 1  -- allowed
    end
    return 0  -- rate limited
""";

boolean isAllowed(String userId, int limitPerMinute) {
    String key = "ratelimit:" + userId;
    long now = System.currentTimeMillis();
    Long result = (Long) jedis.eval(rateLimitScript,
        List.of(key),
        List.of(String.valueOf(limitPerMinute), "60000", String.valueOf(now)));
    return result == 1L;
}

// ── DISTRIBUTED LOCK ──
// SET NX PX is atomic, but release must also be atomic!
String releaseLockScript = """
    if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
    else
        return 0  -- not our lock (expired + someone else acquired)
    end
""";

class RedisDistributedLock {
    private final String lockValue = UUID.randomUUID().toString();
    
    public boolean acquire(String lockKey, int ttlSeconds) {
        String result = jedis.set(lockKey, lockValue, SetParams.setParams().nx().ex(ttlSeconds));
        return "OK".equals(result);
    }
    
    public boolean release(String lockKey) {
        Long result = (Long) jedis.eval(releaseLockScript, 
            List.of(lockKey), List.of(lockValue));
        return result == 1L;
    }
}

// ── INVENTORY DEDUCTION (prevents overselling) ──
String deductInventoryScript = """
    local stock = tonumber(redis.call('GET', KEYS[1]))
    if stock == nil then
        return -1  -- key doesn't exist
    end
    if stock <= 0 then
        return 0   -- out of stock
    end
    local qty = tonumber(ARGV[1])
    if stock < qty then
        return -2  -- insufficient stock
    end
    redis.call('DECRBY', KEYS[1], qty)
    return stock - qty  -- remaining stock
""";

// ── LOAD SCRIPT (cache by SHA for performance) ──
// Instead of sending entire script every time:
String sha = jedis.scriptLoad(deductInventoryScript);
// Store SHA in config/constant
// Execute by SHA (faster, less bandwidth):
Object result = jedis.evalsha(sha, List.of("product:123:stock"), List.of("5"));
```

## 12.2 MULTI/EXEC Transactions

```java
// MULTI/EXEC: queue commands, execute atomically
// NOT like DB transactions: no rollback! Commands may fail individually.
// WATCHES for optimistic locking

// Basic transaction:
Transaction tx = jedis.multi();
try {
    tx.set("key1", "value1");
    tx.set("key2", "value2");
    tx.incr("counter");
    List<Object> results = tx.exec();  // execute all atomically
    // results: ["OK", "OK", 1]
} catch (Exception e) {
    tx.discard();  // cancel transaction
}

// WATCH + MULTI/EXEC (optimistic locking):
// Watch keys → if they change before EXEC → EXEC returns nil (retry needed!)
public boolean transferBalance(String from, String to, int amount) {
    while (true) {  // retry loop
        jedis.watch(from, to);  // watch both keys
        
        int fromBalance = Integer.parseInt(jedis.get(from));
        int toBalance   = Integer.parseInt(jedis.get(to));
        
        if (fromBalance < amount) {
            jedis.unwatch();
            return false;  // insufficient funds
        }
        
        Transaction tx = jedis.multi();
        tx.set(from, String.valueOf(fromBalance - amount));
        tx.set(to,   String.valueOf(toBalance   + amount));
        List<Object> result = tx.exec();
        
        if (result != null) {
            return true;   // success! no one modified watched keys
        }
        // result == null: watched keys modified, retry
        // (busy-wait can be CPU-intensive — consider backoff)
    }
}

// ⚠️ MULTI/EXEC LIMITATIONS:
// - No isolation between WATCH and EXEC for reads (reads in MULTI queued, not executed)
// - Cannot use results of queued commands inside the transaction
// - Rollback doesn't happen on runtime errors (EXEC still runs all commands)
// - For complex conditional logic: USE LUA SCRIPTS instead!
```

---

# 13. Redis Pub/Sub & Streams

## 13.1 Pub/Sub

```java
// PUB/SUB: fire-and-forget messaging
// NO persistence: if subscriber offline → message LOST!
// NO history: can't replay past messages
// Use for: real-time notifications, chat, live updates (when loss OK)

// SUBSCRIBE:
JedisPubSub subscriber = new JedisPubSub() {
    @Override
    public void onMessage(String channel, String message) {
        System.out.println("Received on " + channel + ": " + message);
        handleNotification(message);
    }
    
    @Override
    public void onPSubscribe(String pattern, int subscribedChannels) {
        System.out.println("Subscribed to pattern: " + pattern);
    }
};

// Subscribe in separate thread (subscribe() blocks!)
Thread subscriberThread = new Thread(() -> {
    jedis.subscribe(subscriber, "notifications:user:123", "announcements");
    // or pattern:
    jedis.psubscribe(subscriber, "notifications:user:*", "broadcast:*");
});
subscriberThread.start();

// PUBLISH (from any other connection):
jedis.publish("notifications:user:123", """
    {"type": "order_shipped", "orderId": "456", "trackingNumber": "VN123456"}
""");

// CHANNEL NAMING CONVENTIONS:
// event:entity:action: "order:123:status_changed"
// broadcast:region: "broadcast:vietnam"
// user:userId:notifications: "user:123:notifications"

// LIMITATIONS of Pub/Sub:
// ❌ No message persistence (fire-and-forget)
// ❌ No acknowledgment
// ❌ No consumer groups
// ❌ No replay
// → For reliable messaging: use Redis Streams or Kafka!
```

## 13.2 Redis Streams

```java
// STREAMS: durable message log with consumer groups
// Kafka-lite built into Redis!
// Persistent, replayable, consumer groups, acknowledgments

// PRODUCE:
Map<String, String> fields = Map.of(
    "userId", "user:123",
    "action", "purchase",
    "amount", "50000",
    "productId", "prod:456"
);
String messageId = jedis.xadd("user-events", StreamEntryID.NEW_ENTRY, fields);
// Returns: "1715938412345-0" (millisecond-seqnum format)

// CONSUMER GROUP:
jedis.xgroupCreate("user-events", "analytics", StreamEntryID.LAST_ENTRY, true);
// Last arg: mkstream=true (create stream if doesn't exist)

// CONSUME (blocking read with consumer group):
while (true) {
    Map.Entry<String, List<StreamEntry>> messages = jedis.xreadGroup(
        "analytics",    // group name
        "worker-1",     // consumer name (unique per worker!)
        XReadGroupParams.xReadGroupParams()
            .count(10)             // max 10 messages
            .block(1000),          // block 1 second if no messages
        Map.of("user-events", new StreamEntryID(">")));  // ">" = new messages only
    
    if (messages == null) continue;
    
    for (Map.Entry<String, List<StreamEntry>> entry : messages.entrySet()) {
        for (StreamEntry msg : entry.getValue()) {
            try {
                processEvent(msg.getFields());
                jedis.xack("user-events", "analytics", msg.getID());  // ACK!
                // Without ACK: message stays in PEL (Pending Entry List)
            } catch (Exception e) {
                // Don't ack → message will be re-delivered
                log.error("Failed to process {}: {}", msg.getID(), e.getMessage());
            }
        }
    }
}

// INSPECT PENDING MESSAGES (not yet ACKed):
jedis.xpending("user-events", "analytics",
    new XPendingParams().count(10));
// Shows: [messageId, consumer, idle time, delivery count]

// CLAIM stuck messages (idle > 5 min → reassign to self):
List<StreamEntry> stuck = jedis.xautoclaim("user-events", "analytics", 
    "worker-2", 300_000, new StreamEntryID("0-0"), 
    XAutoClaimParams.xAutoClaimParams().count(10));

// TRIM STREAM (keep only last 10000 entries):
jedis.xtrim("user-events", 10000, false);  // approximate trimming (faster)
jedis.xtrim("user-events", 10000, true);   // exact trimming
// Or: XADD with MAXLEN option
jedis.xadd("user-events", XAddParams.xAddParams().maxLen(10000), fields);
```

---

# 14. Advanced Patterns

## 14.1 Distributed Lock (Redlock)

```java
// SIMPLE REDIS LOCK: works for single Redis instance
// SET key value NX PX ttl_ms
boolean acquired = "OK".equals(
    jedis.set(lockKey, lockValue, SetParams.setParams().nx().ex(30)));

// REDLOCK (for distributed Redis without replication):
// Martin Kleppmann vs Antirez famous debate!
// Use ONLY with multiple INDEPENDENT Redis instances (no replication!)

// Algorithm (N=5 independent instances):
// 1. Get current time T1
// 2. Try to acquire lock on ALL N instances (with small timeout)
// 3. Get current time T2
// 4. Lock acquired if: got lock on majority (>= N/2+1) AND T2-T1 < TTL
// 5. Effective TTL = original TTL - (T2-T1) - drift
// 6. If failed: release lock on ALL instances

// Libraries: Redisson (Java), node-redlock (Node.js)
RLock lock = redissonClient.getLock("myLock");
boolean acquired = lock.tryLock(0, 30, TimeUnit.SECONDS);
try {
    if (acquired) {
        // critical section
    }
} finally {
    if (acquired) lock.unlock();
}

// REDLOCK CONTROVERSY:
// Pro (antirez): works correctly under normal conditions
// Con (Kleppmann): unsafe with GC pauses, clock drift, network delays
// "The lock can be held by two processes simultaneously!"
// 
// Recommendation:
// For correctness-critical: use ZooKeeper or etcd (stronger consensus)
// For performance-critical: single Redis SET NX (accept minor risk)
// Redlock: middle ground, more complex, somewhat stronger than single-node
```

## 14.2 Session Management

```java
// DISTRIBUTED SESSION with Redis:
// Store session in Redis → any app server can serve any user request!

@Configuration
public class RedisSessionConfig {
    
    @Bean
    public RedisIndexedSessionRepository sessionRepository(
            RedisConnectionFactory factory) {
        RedisIndexedSessionRepository repo = new RedisIndexedSessionRepository(
            new RedisTemplate<>());
        repo.setFlushMode(FlushMode.IMMEDIATE);
        repo.setDefaultMaxInactiveInterval(Duration.ofMinutes(30));
        return repo;
    }
}

// Spring Session automatically stores in Redis:
@RestController
public class LoginController {
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, 
                                    HttpSession session) {
        User user = authService.authenticate(req.getEmail(), req.getPassword());
        
        // Stored in Redis automatically!
        session.setAttribute("userId",   user.getId());
        session.setAttribute("email",    user.getEmail());
        session.setAttribute("role",     user.getRole());
        session.setAttribute("loginAt",  Instant.now().toString());
        
        return ResponseEntity.ok(Map.of("sessionId", session.getId()));
    }
    
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpSession session) {
        // Loaded from Redis automatically!
        String userId = (String) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userService.getProfile(userId));
    }
}

// REDIS SESSION STRUCTURE:
// spring:session:sessions:{sessionId} → HASH
//   creationTime: timestamp
//   lastAccessedTime: timestamp
//   maxInactiveInterval: seconds
//   sessionAttr:userId: "user:123"
//   sessionAttr:role: "ADMIN"
//
// spring:session:sessions:expires:{sessionId} → STRING (TTL = session timeout)
// spring:session:expirations:{minuteRounded} → SET of sessionIds expiring that minute
// spring:session:index:org.springframework.session.FindByIndexNameSessionRepository.PRINCIPAL_NAME_INDEX_NAME:{userId} → SET of sessionIds for user
```

## 14.3 Leader Election

```java
// LEADER ELECTION: only one instance should run a task

@Scheduled(fixedDelay = 5000)
public void scheduledTask() {
    String lockKey = "leader:scheduled-task";
    String instanceId = getInstanceId();  // unique per JVM instance
    
    // Try to become leader (10s TTL)
    boolean isLeader = "OK".equals(
        jedis.set(lockKey, instanceId, SetParams.setParams().nx().ex(10)));
    
    if (isLeader) {
        try {
            // This runs only on the leader!
            performScheduledTask();
            
            // Renew leadership
            jedis.expire(lockKey, 10);
        } catch (Exception e) {
            log.error("Task failed", e);
            // Let TTL expire → another instance becomes leader
        }
    }
    // Non-leaders: do nothing this cycle
}

// SAFER: use GETSET or Lua for atomic check-and-set with value check
```

## 14.4 Leaderboard Pattern

```java
// REAL-TIME LEADERBOARD with Redis Sorted Set:

// Increment score:
jedis.zincrby("game:leaderboard:2025-05", 150.0, "player:user123");

// Get rank (0-indexed from top):
Long rank = jedis.zrevrank("game:leaderboard:2025-05", "player:user123");

// Get top 10:
List<Tuple> top10 = jedis.zrevrangeWithScores("game:leaderboard:2025-05", 0, 9);
top10.forEach(t -> System.out.printf("%s: %.0f%n", t.getElement(), t.getScore()));

// Get score:
Double score = jedis.zscore("game:leaderboard:2025-05", "player:user123");

// Get rank around a player (±5 neighbors):
Long myRank = jedis.zrevrank("game:leaderboard:2025-05", "player:user123");
long start = Math.max(0, myRank - 5);
long end   = myRank + 5;
List<Tuple> neighbors = jedis.zrevrangeWithScores("game:leaderboard:2025-05", start, end);

// Total players:
Long totalPlayers = jedis.zcard("game:leaderboard:2025-05");

// Players above certain score:
Long countAbove = jedis.zcount("game:leaderboard:2025-05", 1000.0, Double.MAX_VALUE);

// MONTHLY LEADERBOARD ROTATION:
// Use different key per month: "game:leaderboard:2025-05"
// Set TTL: jedis.expire("game:leaderboard:2025-05", 90 * 24 * 3600);

// MULTI-METRIC LEADERBOARD:
// Combine metrics: score = kills * 10 + wins * 100 + time_played * 0.1
double combinedScore = kills * 10 + wins * 100 + timePlayed * 0.1;
jedis.zadd("game:leaderboard", combinedScore, playerId);
```

---

# 15. Monitoring & Troubleshooting

## 15.1 INFO Command — Complete Reference

```bash
# Full INFO output sections:
INFO all          # everything
INFO server       # Redis version, config, uptime
INFO clients      # connected clients, blocked clients
INFO memory       # memory usage breakdown
INFO persistence  # RDB/AOF status
INFO stats        # general statistics
INFO replication  # master/replica info
INFO cpu          # CPU usage
INFO commandstats # per-command statistics
INFO errorstats   # per-error statistics
INFO latencystats # per-command latency percentiles
INFO keyspace     # key count per database

# CRITICAL METRICS TO MONITOR:

# Memory:
127.0.0.1:6379> INFO memory | grep -E "used_memory_human|mem_fragmentation_ratio|maxmemory_human"
used_memory_human:3.82G
maxmemory_human:4.00G          # alert at 80%!
mem_fragmentation_ratio:1.23   # alert > 1.5

# Evictions (losing data!):
127.0.0.1:6379> INFO stats | grep evicted_keys
evicted_keys:5432              # non-zero = losing data due to memory pressure!

# Connections:
127.0.0.1:6379> INFO clients | grep -E "connected_clients|blocked_clients"
connected_clients:127
blocked_clients:5              # clients blocked on BLPOP/BRPOP/etc.

# Keyspace hits/misses (cache hit rate):
127.0.0.1:6379> INFO stats | grep -E "keyspace_hits|keyspace_misses"
keyspace_hits:98765432
keyspace_misses:1234567
# Hit rate = 98765432 / (98765432 + 1234567) = 98.77%
# Alert if hit rate < 90%

# Ops per second:
127.0.0.1:6379> INFO stats | grep instantaneous_ops_per_sec
instantaneous_ops_per_sec:125000

# Replication lag:
127.0.0.1:6379> INFO replication
master_replid:abc123
master_repl_offset:12345678
slave0:ip=127.0.0.1,port=6380,state=online,offset=12345670,lag=0
# lag=0: good, lag>0: replica behind

# Persistence:
127.0.0.1:6379> INFO persistence
rdb_last_bgsave_status:ok
aof_last_write_status:ok
aof_current_size:1073741824   # 1GB AOF
aof_base_size:536870912       # 512MB last rewrite
# aof_current_size / aof_base_size > 2.0 → rewrite needed!
```

## 15.2 Key Monitoring Commands

```bash
# MONITOR (real-time command stream — USE BRIEFLY ONLY!)
redis-cli monitor
# Shows ALL commands being executed
# WARNING: reduces throughput by ~50%!
# Use for: debugging unexpected commands, finding slow patterns

# DEBUG SLEEP (simulate slow command — test timeout handling):
DEBUG SLEEP 2  # blocks Redis for 2 seconds (testing only!)

# DEBUG OBJECT (internal info about key):
DEBUG OBJECT mykey
# Output: Value at:0x... refcount:1 encoding:embstr serializedlength:5 lru:... type:string

# CLIENT LIST (all connected clients):
CLIENT LIST
# id=3 addr=127.0.0.1:52398 name= age=5 idle=0 flags=N db=0 sub=0 psub=0 
# multi=-1 watch=0 qbuf=0 qbuf-free=32768 argv-mem=10 obl=0 oll=0 omem=0 
# events=r cmd=client|list user=default library-name= library-ver= resp=2

# CLIENT KILL (disconnect specific client):
CLIENT KILL ID 42
CLIENT KILL ADDR 192.168.1.100:52398

# OBJECT FREQ (LFU frequency counter):
OBJECT FREQ mykey    # frequency counter (requires maxmemory-policy=*lfu)

# OBJECT IDLETIME (seconds since last access):
OBJECT IDLETIME mykey  # how long since last access (not available with LFU)

# DATABASE SIZE:
DBSIZE              # count keys in current database
INFO keyspace       # keys per database + expiring keys count
```

---

# 16. Production Checklist & Anti-Patterns

## 16.1 Production Configuration

```bash
# ══ MUST DO FOR PRODUCTION ══

# 1. DISABLE DANGEROUS COMMANDS (rename or disable):
rename-command FLUSHALL ""        # DISABLE completely (or rename to secret)
rename-command FLUSHDB ""
rename-command DEBUG ""
rename-command CONFIG "HIDDEN_CONFIG_COMMAND"
rename-command KEYS ""            # prevent KEYS * in production
rename-command MONITOR ""

# 2. REQUIRE PASSWORD:
requirepass "your-very-long-and-secure-password-min-64-chars"
# Or better: ACL SETUSER + Redis ACL (Redis 6.0+)
ACL SETUSER appuser on >password ~* &* +@all -FLUSHALL -FLUSHDB -DEBUG -KEYS

# 3. BIND TO SPECIFIC IP (not 0.0.0.0!):
bind 127.0.0.1 10.0.0.5   # only accept from localhost + internal IP
protected-mode yes          # extra protection

# 4. MEMORY LIMITS:
maxmemory 3gb
maxmemory-policy allkeys-lru
maxmemory-samples 10

# 5. PERSISTENCE:
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000
aof-use-rdb-preamble yes

# 6. DISABLE THP:
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
# Add to /etc/rc.local or systemd unit

# 7. CONNECTION LIMITS:
maxclients 10000
tcp-backlog 65535
timeout 300                 # close idle connections after 5 min
tcp-keepalive 60            # TCP keepalive every 60s

# 8. LOG LEVEL:
loglevel notice             # notice or warning for production (not verbose!)
logfile /var/log/redis/redis.log
slowlog-log-slower-than 10000
slowlog-max-len 256

# 9. LATENCY MONITORING:
latency-monitor-threshold 100
latency-tracking yes

# 10. KERNEL PARAMETERS:
# /etc/sysctl.conf:
vm.overcommit_memory = 1    # allow memory overcommit for fork()
net.core.somaxconn = 65535  # large connection queue
net.ipv4.tcp_max_syn_backlog = 65535
```

## 16.2 Anti-Patterns

```java
// ❌ ANTI-PATTERN 1: KEYS * in production
jedis.keys("user:*");  // O(n) — blocks ALL clients!
// ✅ Use SCAN iteratively

// ❌ ANTI-PATTERN 2: No TTL on cache keys
jedis.set("user:123", serialize(user));  // stays FOREVER!
// If service dies, stale data lives forever + memory never freed
// ✅ Always set TTL: jedis.setex("user:123", 3600, serialize(user));

// ❌ ANTI-PATTERN 3: Creating Redis connection per request
@GetMapping("/data")
public String getData() {
    Jedis jedis = new Jedis("localhost");  // NEW CONNECTION EVERY TIME!
    String result = jedis.get("key");
    jedis.close();
    return result;
}
// TCP connection overhead: 3-way handshake ~1ms
// 10K req/sec = 10K connections/sec → Redis connection queue overwhelmed!
// ✅ Use connection pool or Lettuce (connection sharing)

// ❌ ANTI-PATTERN 4: Storing large objects
jedis.set("report:2025", serialize(largeReportObject));  // 50MB!
// Large values: slow serialize/deserialize, network congestion, memory fragmentation
// ✅ Store large objects in S3/MinIO, store reference in Redis

// ❌ ANTI-PATTERN 5: Using Redis as primary database for relational data
// "Let me store all my user relationships in Redis sets!"
// Redis is great for cache + specific data structures
// Complex queries, JOINs, ACID transactions → use PostgreSQL
// ✅ Use right tool: Redis for cache/real-time, PostgreSQL for source of truth

// ❌ ANTI-PATTERN 6: SELECT database abuse
jedis.select(5);  // switch to DB 5
// Redis has 16 DBs (0-15) — shared memory, separate keyspace
// SELECT doesn't provide isolation (shared memory, shared CONFIG)
// NOT equivalent to different Redis instances!
// Problems: FLUSHDB affects one DB, but memory is shared
// ✅ Use different Redis instances or key namespacing: "prod:user:123"

// ❌ ANTI-PATTERN 7: MULTI/EXEC for read-modify-write
Transaction tx = jedis.multi();
tx.get("counter");      // QUEUED — doesn't execute yet!
// Can't use result here — it's queued!
// int current = tx.get("counter"); ← this is a Response<String>, not the value!
tx.set("counter", String.valueOf(current + 1));  // current is wrong!
tx.exec();
// ✅ Use Lua script for atomic read-modify-write

// ❌ ANTI-PATTERN 8: Ignore evictions
// maxmemory-policy allkeys-lru is set
// evicted_keys growing silently
// ✅ ALERT on non-zero evicted_keys for critical data
// ✅ Monitor memory_usage / maxmemory ratio (alert at 80%)

// ❌ ANTI-PATTERN 9: Not handling connection errors
String value = jedis.get("key");  // what if Redis is down?
// NullPointerException, JedisConnectionException not handled!
// ✅ Implement circuit breaker + fallback
@CircuitBreaker(name = "redis", fallbackMethod = "getFromDB")
public String getCachedValue(String key) {
    return jedis.get(key);
}
public String getFromDB(String key, Exception e) {
    log.warn("Redis unavailable, falling back to DB for key: {}", key, e);
    return database.get(key);
}

// ❌ ANTI-PATTERN 10: Not monitoring consumer groups for Redis Streams
// Stream backlog grows silently
// ✅ Monitor XPENDING count, alert if growing
```

## 16.3 Redis Quick Troubleshooting Guide

```
SYMPTOM: High memory usage
  → Check: INFO memory, redis-cli --bigkeys
  → Action: Check maxmemory-policy, look for big keys, check TTL on keys
  → Fix: Adjust TTL, compress values, increase maxmemory, add more nodes

SYMPTOM: High latency
  → Check: SLOWLOG GET 25, redis-cli --latency
  → Action: Find slow commands (O(n)), check SLOWLOG
  → Fix: Replace KEYS with SCAN, paginate large collections, pipeline batches

SYMPTOM: Memory fragmentation > 1.5
  → Check: INFO memory | grep mem_fragmentation_ratio
  → Action: Run MEMORY PURGE
  → Fix: Enable activedefrag, consider restart (with persistence)

SYMPTOM: Evictions happening (cache hits degraded)
  → Check: INFO stats | grep evicted_keys
  → Action: Check maxmemory, check key count and sizes
  → Fix: Increase maxmemory, reduce key sizes, add more nodes

SYMPTOM: Replication lag growing
  → Check: INFO replication | grep lag
  → Action: Check replica server load, network bandwidth
  → Fix: Increase repl-backlog-size, check if replica doing heavy work

SYMPTOM: Connections refused
  → Check: INFO clients | grep connected_clients, check maxclients
  → Action: Check for connection leaks (clients not closing connections)
  → Fix: Implement connection pool, increase maxclients, add timeout

SYMPTOM: CPU 100%
  → Check: SLOWLOG GET, CLIENT LIST for blocked clients
  → Action: Look for O(n) commands, Lua script with loops
  → Fix: Optimize commands, split work across multiple keys

SYMPTOM: AOF file growing rapidly
  → Check: INFO persistence
  → Action: Check auto-aof-rewrite-percentage, trigger manual BGREWRITEAOF
  → Fix: Lower auto-aof-rewrite-percentage, check for write storms
```

---

## 📎 Redis Quick Reference

```
SPEED:             100K-1M ops/sec, <1ms latency
SINGLE THREAD:     command execution (I/O multi-threaded in 6.0+)
KEY EXPIRY:        passive (on access) + active (100ms scan cycle)
ENCODING:          INT/EMBSTR/RAW (string), LISTPACK/HT (hash/set/zset)
LISTPACK LIMIT:    hash/set/zset: 128 entries, 64 bytes each
EVICTION POLICIES: allkeys-lru (cache), volatile-ttl (mixed)
PERSISTENCE:       RDB (snapshot) + AOF (log) + mixed (recommended)
REPLICATION:       async, repl-backlog for partial resync
CLUSTER:           16384 slots, hash tags {key} for co-location
SENTINEL:          min 3 instances, quorum for failover
CACHE AVALANCHE:   jitter TTL, soft expiry, pre-warming
CACHE STAMPEDE:    mutex lock, XFetch, background refresh
CACHE PENETRATION: bloom filter, cache null values
HOT KEY:           local L1 cache, key splitting, read replicas
NEVER DO:          KEYS *, FLUSHALL on prod, no TTL, no connection pool
ALWAYS DO:         monitor evictions, set maxmemory, disable THP
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Redis Documentation | <https://redis.io/docs/> |
| Redis Commands | <https://redis.io/commands/> |
| Redis Data Types | <https://redis.io/docs/data-types/> |
| Redis Persistence | <https://redis.io/docs/management/persistence/> |
| Redis Replication | <https://redis.io/docs/management/replication/> |
| Redis Sentinel | <https://redis.io/docs/management/sentinel/> |
| Redis Cluster | <https://redis.io/docs/management/scaling/> |
| Redis Streams | <https://redis.io/docs/data-types/streams/> |
| Redis Memory | <https://redis.io/docs/management/optimization/memory-optimization/> |
| Redis Security | <https://redis.io/docs/management/security/> |
| Redis Latency | <https://redis.io/docs/management/optimization/latency/> |
| Redis Patterns | <https://redis.io/docs/manual/patterns/> |
| Lettuce (Java) | <https://lettuce.io/docs/> |
| Redisson (Java) | <https://redisson.org/docs/> |
| Spring Data Redis | <https://docs.spring.io/spring-data/redis/docs/current/reference/html/> |
