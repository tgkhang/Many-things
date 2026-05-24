# 🏗️ System Design — Complete Deep Dive
>
> Scalability, Databases, Kafka, Redis, Caching, N+1, Load Balancing và hơn nữa

---

## 📚 Table of Contents

1. [System Design Framework](#1-system-design-framework)
2. [Scalability Fundamentals](#2-scalability-fundamentals)
3. [Database Scaling](#3-database-scaling)
4. [Caching Strategies](#4-caching-strategies)
5. [Message Queues & Kafka](#5-message-queues--kafka)
6. [Redis — Advanced Patterns](#6-redis--advanced-patterns)
7. [N+1 Problem & Solutions](#7-n1-problem--solutions)
8. [API Design & Gateway](#8-api-design--gateway)
9. [Microservices Architecture](#9-microservices-architecture)
10. [Consistency Patterns](#10-consistency-patterns)
11. [Real-World System Designs](#11-real-world-system-designs)
12. [Numbers Every Engineer Should Know](#12-numbers-every-engineer-should-know)

---

# 1. System Design Framework

## 1.1 Approach to System Design

```
Khi thiết kế một hệ thống, luôn đi theo thứ tự:

STEP 1 — Clarify Requirements (5 phút)
  Functional:
    - Người dùng làm gì được với hệ thống?
    - Core features là gì? (write/read, upload/download...)

  Non-Functional:
    - Scale: bao nhiêu users? requests/sec?
    - Availability: 99.9% hay 99.99%?
    - Latency: P99 < 100ms?
    - Consistency: strong hay eventual?
    - Durability: data có được phép mất không?

STEP 2 — Capacity Estimation (5 phút)
  DAU (Daily Active Users): 10M users
  Read/Write ratio: 100:1
  QPS (Queries Per Second):
    Write QPS = 10M × 1 write/day / 86400 = ~116 writes/sec
    Read  QPS = 116 × 100 = 11600 reads/sec
  Storage:
    Each record = 1KB → 116 × 86400 × 365 × 1KB = ~3.6TB/year
  Bandwidth:
    Read: 11600 × 1KB = 11.6 MB/s

STEP 3 — High-Level Design
  Draw major components: Client, LB, API Servers, Cache, DB, MQ, CDN
  Data flow: request đi qua những đâu?

STEP 4 — Deep Dive
  Deep dive vào component phức tạp nhất
  DB schema, API contracts, caching strategy, sharding key...

STEP 5 — Identify Bottlenecks & Trade-offs
  Single points of failure?
  Hotspots?
  Trade-offs: consistency vs availability, cost vs performance
```

## 1.2 Back-of-Envelope Estimation

```
Conversion helpers:
  1 day    = 86,400 seconds ≈ 10^5 seconds
  1 month  = 2.5M seconds
  1 year   = 31.5M seconds ≈ 10^7 seconds

  1 KB = 10^3 bytes
  1 MB = 10^6 bytes
  1 GB = 10^9 bytes
  1 TB = 10^12 bytes
  1 PB = 10^15 bytes

Request estimation:
  1M users × 1 req/day   = ~12 req/sec
  1M users × 10 req/day  = ~116 req/sec
  10M users × 10 req/day = ~1,160 req/sec
  100M users × 10 req/day = ~11,600 req/sec

Storage estimation (Twitter-like):
  500M tweets/day
  Each tweet: 300 bytes text + 500 bytes metadata = 800 bytes
  Daily storage: 500M × 800B = 400GB/day
  5-year storage: 400GB × 365 × 5 = 730TB

Bandwidth estimation:
  Read QPS × average response size
  11,600 req/sec × 1KB = 11.6 MB/s upload, need ~100 Mbps

Server capacity:
  1 server handles ~1,000-10,000 req/sec (depends on complexity)
  For 11,600 req/sec → need ~2-12 servers (+ headroom)
```

---

# 2. Scalability Fundamentals

## 2.1 Vertical vs Horizontal Scaling

```
VERTICAL SCALING (Scale Up):
  Add more resources to existing machine
  CPU: 4 cores → 32 cores
  RAM: 16GB → 512GB
  Disk: SSD → NVMe RAID

  ✅ Simple: no code changes needed
  ✅ No distributed system complexity
  ✅ Strong consistency (single machine)
  ❌ Hardware limits (can't scale infinitely)
  ❌ Single Point of Failure
  ❌ Expensive at high end
  ❌ Downtime to upgrade hardware

HORIZONTAL SCALING (Scale Out):
  Add more machines
  1 server → 10 servers → 1000 servers

  ✅ Theoretically unlimited scale
  ✅ Fault tolerant (redundancy)
  ✅ Commodity hardware (cheaper)
  ❌ Distributed system complexity
  ❌ Consistency challenges
  ❌ Code must be stateless

Rule of thumb:
  Start vertical (simpler)
  Switch to horizontal when hitting vertical limits
  Most companies: vertical first, then horizontal for DB + stateless app tier
```

## 2.2 Stateless vs Stateful

```
STATELESS Services:
  No session data stored on server
  Any request can go to any server
  Horizontal scaling is trivial!

  ✅ Easy to scale: just add servers
  ✅ Easy failover: request rerouted to another server
  ✅ Easy deployment: stop/start without data loss

  Examples:
    REST API server (session in JWT or Redis)
    Image processing service
    Payment processor

STATEFUL Services:
  State stored on specific server (session, connection...)
  Client MUST go to same server (sticky sessions)

  ❌ Hard to scale: new server doesn't have client's state
  ❌ Hard failover: if server dies, client state lost
  ❌ Load balancer needs session affinity

  Examples:
    WebSocket connections
    Gaming servers
    Stateful protocols

Strategy: move state OUT of app servers into dedicated stores
  HTTP Session → Redis (shared session store)
  Files/uploads → S3/object storage
  User data → database
  Result: app servers become stateless → easy to scale!

┌──────────┐     ┌──────────────────────────┐
│ Client   │────▶│  Load Balancer           │
└──────────┘     └────────┬─────────────────┘
                          │ (any server)
               ┌──────────┼──────────┐
               ▼          ▼          ▼
          ┌────────┐ ┌────────┐ ┌────────┐
          │ App 1  │ │ App 2  │ │ App 3  │  (stateless)
          └────┬───┘ └────┬───┘ └────┬───┘
               └──────────┼──────────┘
                          ▼
              ┌───────────────────────┐
              │   Shared State        │
              │   Redis (sessions)    │
              │   PostgreSQL (data)   │
              │   S3 (files)          │
              └───────────────────────┘
```

## 2.3 The Scalability Bottlenecks

```
Common bottlenecks in order of typical occurrence:

1. DATABASE (most common)
   - Single DB server → too many connections
   - Slow queries → high latency
   - Lock contention → serialized writes
   Fix: caching, read replicas, sharding, query optimization

2. APPLICATION SERVER
   - Synchronous/blocking code → threads exhausted
   - Memory leaks → GC pressure
   - CPU-bound work → saturated
   Fix: async I/O, connection pooling, horizontal scaling

3. NETWORK
   - Bandwidth saturation
   - High latency to users far away
   Fix: CDN, compression, protocol optimization (HTTP/2, HTTP/3)

4. CACHE
   - Cache miss rate too high → DB overloaded
   - Cache eviction policy wrong
   - Hot keys → single cache node overloaded
   Fix: better eviction policy, local caches, key spreading

5. MESSAGE QUEUE
   - Consumer too slow → queue backlog grows
   - Producer too fast → memory pressure
   Fix: more consumers, consumer optimization, backpressure

Amdahl's Law:
  Speedup = 1 / (S + (1-S)/N)
  S = serial fraction, N = number of processors
  Example: 10% serial code + 90% parallel, 100 machines:
  Max speedup = 1 / (0.1 + 0.9/100) = ~9.2x (not 100x!)
  → Even small serial sections limit scalability
  → Minimize serial/synchronous parts of your system
```

---

# 3. Database Scaling

## 3.1 Read Replicas

```
Problem: single DB → too many read requests → overloaded
Solution: read replicas

                    ┌──────────────┐
   All WRITES ────▶ │   Primary    │ ──WAL──▶ ┌───────────┐
                    │  (R/W)       │          │ Replica 1 │ ──▶ Reads
                    └──────────────┘   ┌─────▶│  (R only) │
                                       │      └───────────┘
                                       │      ┌───────────┐
                                       └─────▶│ Replica 2 │ ──▶ Reads
                                              │  (R only) │
                                              └───────────┘

Rules:
  - All writes → Primary only
  - Reads distributed across replicas
  - Replication lag: replicas slightly behind (usually ms, rarely seconds)

Read-your-writes consistency problem:
  User writes data → goes to Primary
  User immediately reads → goes to Replica (not synced yet!)
  User sees old data! 

Solutions:
  1. Read from Primary for 1 second after writing
  2. Read from Primary if user recently wrote
  3. Route user's reads to same replica as their writes (session-based)
  4. Synchronous replication (high latency penalty)
  5. Use sticky routing: always read from Primary after write for that user

Spring implementation:
  @Transactional(readOnly = true)   // routes to replica
  @Transactional                     // routes to primary
  
  Configure AbstractRoutingDataSource:
    ReadOnlyContext.isReadOnly() ? replicaDataSource : primaryDataSource
```

## 3.2 Connection Pooling

```
Problem: DB connections are expensive
  Each connection: TCP handshake + auth + memory (~5-10MB on PostgreSQL)
  Naive: 100 app servers × 10 threads = 1000 connections → DB dies

Solution: Connection Pool

App Server:
  HikariCP (Java): maintains pool of pre-opened connections
  Reuse connections for requests
  max-pool-size = 10 per server

┌──────────────────────────────────────────────────────┐
│  App Server                                          │
│  ┌─────────────────────────────────────────────┐     │
│  │  HikariCP Pool (max=10)                     │     │
│  │  [conn1][conn2]...[conn10]  ← reused        │────▶│ DB
│  └─────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
                 × 100 app servers = 1000 connections to DB!

PgBouncer (connection pooler between app and DB):
  App servers connect to PgBouncer (many connections OK)
  PgBouncer maintains small pool to actual DB

  ┌────────────┐     ┌──────────────┐     ┌──────────┐
  │100 servers │────▶│  PgBouncer   │────▶│PostgreSQL│
  │×100 conns  │     │  (pool=20)   │     │ (20 conns│
  │=10000 conns│     │              │     │ actual)  │
  └────────────┘     └──────────────┘     └──────────┘

PgBouncer modes:
  Session: 1 server connection per client session (least efficient)
  Transaction: connection returned to pool after each transaction (most common)
  Statement: returned after each statement (rarely used)

Rule: DB connections < (RAM / 5-10MB per connection)
  PostgreSQL with 32GB RAM: max ~3200 connections (but 200-300 is practical)
  
Optimal pool size per server:
  = (core_count × 2) + effective_spindle_count
  For 8-core server, SSD: (8 × 2) + 1 = 17
```

## 3.3 Database Sharding

```
Problem: single DB server → disk/CPU/memory limit even with replicas
Solution: shard (horizontally partition) across multiple servers

CHOOSING A SHARD KEY:
  Critical decision — very hard to change later!

  Good shard key:
    High cardinality (many distinct values)
    Even distribution (no hotspots)
    Aligns with access patterns (most queries use shard key)

  Bad shard key:
    Low cardinality: status (ACTIVE/INACTIVE) → only 2 shards
    Monotonic: timestamp, auto-increment ID → all new data on 1 shard (hotspot!)
    Random: UUID without consistent hashing → scatter-gather queries

  Common patterns:
    user_id: user data, user's orders, user's posts
    geo_region: location-based data
    tenant_id: multi-tenant SaaS
    hash(user_id): if user_id is auto-increment

DIRECTORY-BASED SHARDING:
  Lookup table: user_id 1-1M → shard1, 1M-2M → shard2...
  Most flexible but lookup table is bottleneck + SPOF

RANGE-BASED SHARDING:
  user_id 0-10M → shard1, 10M-20M → shard2...
  ❌ Hotspot: all new users on last shard

HASH-BASED SHARDING:
  shard = hash(user_id) % N
  Even distribution ✅
  Range queries hit all shards ❌
  Adding shards → all data moves ❌ (use consistent hashing!)

CONSISTENT HASHING:
  Nodes placed on hash ring (0 to 2^32-1)
  Data → closest node clockwise
  Add node: only ~1/N data migrates
  Remove node: only that node's data migrates to next
  Virtual nodes: each server placed N times on ring → even distribution

Cross-shard operations (the pain):
  JOIN across shards → not possible natively
  Aggregate across shards → scatter-gather (query all, merge in app)
  Transactions across shards → distributed transaction (2PC) or Saga
  
  Solutions:
    Denormalize: store redundant data to avoid cross-shard queries
    Co-location: user + user's orders on same shard (same user_id)
    Reference data: small tables replicated to all shards (categories, countries)
```

## 3.4 CQRS — Command Query Responsibility Segregation

```
Traditional: same model/DB for reads and writes
Problem: write model (normalized, ACID) ≠ optimal read model (denormalized, fast)

CQRS: separate models for reads and writes

                         WRITE SIDE
Client ──COMMAND──▶  ┌───────────────┐  ──event──▶ ┌─────────┐
(mutate state)       │  Command      │              │  Event  │
                     │  Handler      │              │  Store  │
                     └───────────────┘              └────┬────┘
                                                         │ project
                         READ SIDE                       ▼
Client ──QUERY───▶   ┌───────────────┐  ◀──────── ┌─────────┐
(read data)          │  Query        │             │  Read   │
                     │  Handler      │             │  Model  │
                     └───────────────┘             │ (denorm)│
                                                   └─────────┘

Benefits:
  Write side: optimized for consistency (normalized, ACID)
  Read side: optimized for speed (denormalized, pre-aggregated, maybe NoSQL)
  Scale independently: reads 100x more than writes → scale read side
  Complex read models: materialized views, search indexes

Trade-offs:
  Eventual consistency: read model lags behind write model
  Complexity: 2 codepaths, 2 models to maintain
  More infrastructure: separate DBs, event stream

Event Sourcing (often paired with CQRS):
  Store events instead of current state
  State = replay all events
  "account.balance" = sum of all deposit/withdrawal events

  Benefits: full audit trail, time travel, rebuild any projection
  Costs: event schema evolution, replay time for large histories
```

## 3.5 Database Selection Guide

```
Use PostgreSQL when:
  Complex relationships, JOIN queries
  ACID transactions critical
  Data schema is well-defined
  Full SQL power needed
  Examples: banking, e-commerce, ERP

Use MongoDB when:
  Flexible/evolving schema
  Document-centric data (no complex JOINs)
  Fast prototyping
  Examples: catalogs, CMS, user profiles, event logs

Use Cassandra when:
  Write-heavy workloads (millions writes/sec)
  Time-series data
  Geo-distributed data
  High availability > consistency
  Examples: IoT sensor data, activity logs, messaging (Discord uses Cassandra)
  Read: partition key only, no JOINs, no aggregations

Use Redis when:
  Caching
  Sessions
  Real-time leaderboards
  Rate limiting
  Pub/Sub
  Examples: every company uses Redis!

Use Elasticsearch when:
  Full-text search
  Log analytics (ELK stack)
  Faceted search
  Examples: product search, log analysis, monitoring

Use ClickHouse / TimescaleDB when:
  OLAP (analytics, aggregations over large datasets)
  Time-series metrics
  Examples: analytics dashboards, monitoring, BI

Use Neo4j when:
  Graph traversals
  Social networks, recommendations, fraud detection
  Data is naturally graph-shaped
```

---

# 4. Caching Strategies

## 4.1 Cache Placement

```
WHERE to cache:

1. CLIENT-SIDE CACHE (Browser, Mobile)
   HTTP Cache-Control, Service Worker
   ✅ Fastest: no network request
   ❌ Stale data, hard to invalidate
   Use for: static assets, public content

2. CDN (Content Delivery Network)
   Cloudflare, AWS CloudFront, Fastly
   ✅ Geographically close to user
   ✅ Reduces origin server load
   ❌ Eventual consistency, cost
   Use for: static files, images, videos, API responses (public)

3. REVERSE PROXY CACHE (Nginx, Varnish)
   Cache responses before they reach app server
   ✅ Reduces app server load
   ❌ App-level cache logic harder
   Use for: full HTTP response caching

4. APPLICATION CACHE (In-process)
   HashMap / Caffeine / Guava Cache inside app
   ✅ Fastest (no network hop)
   ✅ Zero latency
   ❌ Not shared across servers
   ❌ Lost on restart
   ❌ Memory per instance
   Use for: rarely-changing reference data (config, country list)

5. DISTRIBUTED CACHE (Redis, Memcached)
   Shared cache across all app servers
   ✅ Shared state
   ✅ Survives single server restart
   ❌ Network hop (~1ms)
   ❌ Operational complexity
   Use for: sessions, computed data, DB query results

Recommendation: use MULTIPLE layers!
  Static assets → CDN
  Session → Redis
  DB query results → Redis
  Config data → In-process (Caffeine)
```

## 4.2 Cache Strategies

```
── CACHE-ASIDE (Lazy Loading) ──
  App manages cache explicitly

  READ:
  1. Check cache: hit? → return
  2. Miss → query DB
  3. Store in cache with TTL
  4. Return

  WRITE:
  1. Write to DB
  2. Invalidate/update cache

  Code:
  String key = "user:" + id;
  User user = redis.get(key);
  if (user == null) {
      user = db.findById(id);
      redis.setex(key, 3600, user);
  }
  return user;

  ✅ Only caches what's actually used
  ✅ Cache failure doesn't break writes
  ❌ Cache miss penalty (3 operations)
  ❌ Race condition: 2 threads miss → 2 DB queries
  ❌ Cache can be stale between writes

── WRITE-THROUGH ──
  Write to cache AND DB synchronously

  WRITE: update cache → update DB (both must succeed)
  READ: always from cache

  ✅ Cache always up-to-date
  ✅ Fast reads (always cached)
  ❌ Write latency (2 writes)
  ❌ Cache fills with data never read (write-heavy, rarely read)
  ❌ Cold start: empty cache on restart

── WRITE-BEHIND (Write-Back) ──
  Write to cache only, async write to DB later

  WRITE: update cache → return → (async) flush to DB
  READ: from cache

  ✅ Fastest writes
  ✅ Absorbs write bursts
  ❌ DATA LOSS RISK if cache fails before DB flush!
  ❌ Complexity: crash recovery
  Use for: non-critical data, metrics, view counts
  Redis RDB/AOF + write-behind can work for some use cases

── READ-THROUGH ──
  Cache sits in front of DB, app talks to cache only
  On miss: cache loads from DB, returns to app

  ✅ Simple app code (just query cache)
  ❌ Cache must know DB schema
  Used by: Hibernate 2nd level cache, Redis with caching modules
```

## 4.3 Cache Invalidation — The Hardest Problem

```
"There are only two hard things in Computer Science:
 cache invalidation and naming things." — Phil Karlton

INVALIDATION STRATEGIES:

1. TTL (Time-To-Live) — simplest
   Set expiry on every cached item
   Stale data until TTL expires
   Tradeoff: short TTL → more DB hits, long TTL → more stale

2. Event-based Invalidation
   On data change → delete/update cache entry
   Requires knowing WHICH cache keys to invalidate

   DB Write → Publish event → Cache Invalidation Consumer
   user 123 updated → delete "user:123", "user:123:orders"...

3. Version/Tag-based
   Cache key includes version: "user:123:v5"
   On update: increment version → old cache never hit → GC by TTL
   
4. Cache Stampede (Thundering Herd) Problem:
   Popular cache key expires
   1000 concurrent requests → cache miss
   → 1000 requests hit DB simultaneously!
   DB overloaded, response slow

   Solutions:
   a. Staggered TTL: TTL = base + random(0, jitter)
      Different keys expire at different times
   
   b. Probabilistic Early Expiry (XFetch):
      Before TTL expires, some requests refresh early
      P(refresh) = -ttl_remaining / beta × log(random())
   
   c. Mutex/Lock on miss:
      First miss → acquire lock → fetch DB → populate cache
      Other misses → wait for lock → read from cache
   
   d. Background refresh:
      Async job refreshes cache before TTL
      Stale-while-revalidate pattern

5. Cache Penetration:
   Query for non-existent key → always miss → always hits DB
   Attack: query random non-existent IDs → DoS DB

   Solutions:
   a. Cache null: store "NOT_FOUND" sentinel with short TTL
   b. Bloom Filter: probabilistic set membership
      "Is user 99999 in DB?" → probably not → don't even query DB
      False positives possible, false negatives impossible

6. Cache Avalanche:
   Many cache keys expire simultaneously → flood of DB requests
   
   Solutions:
   a. Staggered TTL (same as stampede solution)
   b. Persistent cache: don't set TTL on critical keys
   c. Circuit breaker: if DB overloaded, serve stale rather than fail
```

## 4.4 Multi-Level Caching

```
L1 (In-process Caffeine):  ~1μs, 1000 items per server
L2 (Redis):                ~1ms, millions of items, shared
L3 (DB read replica):      ~10ms, authoritative

READ PATH:
1. Check L1 (Caffeine): hit? → done
2. L1 miss → check L2 (Redis): hit? → populate L1, done
3. L2 miss → query L3 (DB): populate L2 + L1, done

WRITE PATH (Write-Around to avoid cache pollution):
1. Write to DB (L3)
2. Invalidate L2 entry (Redis DEL)
3. L1 expires via TTL (or explicit invalidate)

Caffeine (Java):
  LoadingCache<String, User> cache = Caffeine.newBuilder()
      .maximumSize(10_000)
      .expireAfterWrite(Duration.ofSeconds(30))
      .expireAfterAccess(Duration.ofSeconds(10))
      .recordStats()   // enable metrics
      .build(userId -> userRepository.findById(userId).orElse(null));

  User user = cache.get(userId);  // auto-loads if missing
  cache.stats().hitRate();        // monitor hit rate
```

---

# 5. Message Queues & Kafka

> 📖 <https://kafka.apache.org/documentation/>

## 5.1 Why Message Queues?

```
Problems without MQ:

Tight coupling:
  OrderService ──calls──▶ EmailService
                     └──▶ InventoryService
                     └──▶ LoyaltyService
  If any service is slow → OrderService waits
  If any service is down → OrderService fails!

No buffering:
  Traffic spike: 10,000 orders/sec
  EmailService handles: 1,000/sec
  → 9,000 emails lost or OrderService times out

With Message Queue:
  OrderService → [Queue] → EmailService (at its own pace)
  OrderService → [Queue] → InventoryService
  OrderService → [Queue] → LoyaltyService

Benefits:
  Decoupling: producers don't know about consumers
  Buffering: absorbs traffic spikes
  Async: producers don't wait for consumers
  Retry: failed messages reprocessed
  Multiple consumers: fan-out pattern
  Persistence: messages survive crashes
```

## 5.2 Kafka Architecture

```
KAFKA COMPONENTS:

Broker:
  Server that stores and serves messages
  Multiple brokers form a cluster
  Each broker handles partitions

Topic:
  Logical channel for messages (like a table in DB)
  Messages published to a topic
  Consumers subscribe to topics

Partition:
  A topic divided into N partitions
  Each partition = ordered, immutable log
  Each message gets offset (sequential ID within partition)
  Stored on disk (persistent by default!)
  Distributed across brokers

Replication:
  Each partition replicated to replication_factor brokers
  Leader partition: handles reads + writes
  Follower partition: replicated copy, failover
  ISR (In-Sync Replicas): followers caught up with leader

Producer:
  Publishes messages to topics
  Chooses partition (round-robin, key hash, custom)

Consumer:
  Reads messages from partitions
  Tracks its own offset (where it left off)
  Consumer Group: multiple consumers share work
    Each partition consumed by exactly 1 consumer in a group
    num_consumers <= num_partitions for parallelism

ZooKeeper (older) / KRaft (newer):
  Cluster metadata: which broker is leader for each partition
  KRaft mode (Kafka 3.3+): eliminates ZooKeeper dependency

┌─────────────────────────────────────────────────────────────┐
│  Kafka Cluster                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Topic: "orders"   (3 partitions, RF=2)             │   │
│  │  Partition 0: [msg0][msg1][msg2][msg3]  → Broker 1  │   │
│  │  Partition 1: [msg0][msg1][msg2]        → Broker 2  │   │
│  │  Partition 2: [msg0][msg1][msg2][msg3]  → Broker 3  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Consumer Group "order-processors":
  Consumer A → reads Partition 0
  Consumer B → reads Partition 1
  Consumer C → reads Partition 2
  (3 consumers = 3 partitions = max parallelism)

Adding 4th consumer: 1 consumer idle (nothing to consume)!
  → Max parallelism = num_partitions
  → Set partitions thoughtfully at topic creation

Consumer Group "analytics":
  Consumer X → reads ALL partitions
  Different consumer group = independent offset tracking
  Same messages read by both groups!
```

## 5.3 Kafka Deep Dive

```
MESSAGE STRUCTURE:
  Key: optional, determines partition (null → round-robin)
  Value: actual payload (bytes, usually JSON or Avro)
  Headers: metadata key-value pairs
  Timestamp: event time or ingestion time
  Offset: sequential ID within partition

PRODUCER DELIVERY GUARANTEES (acks setting):
  acks=0: fire-and-forget, fastest, no guarantee (lose on broker crash)
  acks=1: leader confirms, fast, lose if leader crashes before replication
  acks=all: all ISR confirm, slowest, strongest guarantee
  
  min.insync.replicas=2 (with acks=all): at least 2 replicas must confirm
  → "At-least-once" delivery: may duplicate on retry

PRODUCER IDEMPOTENCY:
  enable.idempotence=true: exactly-once per producer session
  Even with retries: no duplicates (sequence numbers + producer ID)

CONSUMER OFFSET MANAGEMENT:
  enable.auto.commit=true: auto-commit every 5s (default)
    Risk: commit before processing → lose messages on crash
  enable.auto.commit=false: manual commit
    commitSync(): after processing → at-least-once
    commitAsync(): non-blocking → at-least-once

  At-least-once: process then commit → possible duplicate on crash/retry
  At-most-once:  commit then process → possible message loss
  Exactly-once:  use Kafka transactions or idempotent consumers

ORDERING GUARANTEES:
  Within a partition: strictly ordered
  Across partitions: NO ordering guarantee
  
  To ensure all events for user 123 are ordered:
    Use user_id as message KEY → all go to same partition

RETENTION:
  Messages kept for log.retention.hours (default: 168h = 7 days)
  Or by size: log.retention.bytes
  Consumer can re-read old messages by resetting offset!
  Use case: replay events, build new projections, debug

LOG COMPACTION:
  For topic as "database table":
    Keep only LATEST message per key
    Old messages with same key deleted
  Use case: user profile updates, config changes
  log.cleanup.policy=compact
```

## 5.4 Kafka Patterns

```java
// PRODUCER
Properties props = new Properties();
props.put("bootstrap.servers", "kafka1:9092,kafka2:9092,kafka3:9092");
props.put("key.serializer", StringSerializer.class);
props.put("value.serializer", JsonSerializer.class);
props.put("acks", "all");
props.put("enable.idempotence", "true");
props.put("retries", Integer.MAX_VALUE);
props.put("max.in.flight.requests.per.connection", 5);

// Compression (reduces network + storage by 50-80%):
props.put("compression.type", "lz4");  // lz4, snappy, gzip, zstd

// Batching (send multiple messages per request):
props.put("linger.ms", 5);        // wait up to 5ms to fill batch
props.put("batch.size", 32768);   // 32KB batch size

KafkaProducer<String, OrderEvent> producer = new KafkaProducer<>(props);

// Async send with callback
OrderEvent event = new OrderEvent(orderId, userId, total, "CREATED");
producer.send(
    new ProducerRecord<>("orders", userId.toString(), event),
    (metadata, exception) -> {
        if (exception != null) {
            log.error("Failed to send to partition {}", metadata.partition(), exception);
        } else {
            log.debug("Sent to partition={} offset={}", metadata.partition(), metadata.offset());
        }
    }
);

// CONSUMER
Properties consumerProps = new Properties();
consumerProps.put("bootstrap.servers", "kafka1:9092,kafka2:9092");
consumerProps.put("group.id", "order-service");
consumerProps.put("key.deserializer", StringDeserializer.class);
consumerProps.put("value.deserializer", JsonDeserializer.class);
consumerProps.put("enable.auto.commit", "false");
consumerProps.put("auto.offset.reset", "earliest"); // or "latest"

// At-least-once processing:
KafkaConsumer<String, OrderEvent> consumer = new KafkaConsumer<>(consumerProps);
consumer.subscribe(List.of("orders"));

while (true) {
    ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, OrderEvent> record : records) {
        try {
            processOrder(record.value());
        } catch (Exception e) {
            log.error("Error processing offset {}", record.offset(), e);
            // Send to dead letter topic for manual inspection
            deadLetterProducer.send(new ProducerRecord<>("orders-dlq", record.key(), record.value()));
        }
    }
    consumer.commitSync();  // only after processing all in batch
}

// Spring Kafka (simpler):
@KafkaListener(topics = "orders", groupId = "order-service",
               concurrency = "3")  // 3 consumer threads
public void handleOrder(OrderEvent event,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        @Header(KafkaHeaders.OFFSET) long offset) {
    log.info("Processing from partition={} offset={}", partition, offset);
    orderProcessor.process(event);
}
```

## 5.5 Dead Letter Queue (DLQ) Pattern

```
Normal flow:
  Producer → Topic → Consumer → Process ✅

Failure flow:
  Consumer fails to process (bug, bad data, downstream down)
  Retry N times → still fails
  → Send to Dead Letter Topic (DLQ)
  
DLQ benefits:
  Main topic not blocked by unprocessable messages
  Failed messages inspectable and replayable
  Alert on DLQ size → production issue indicator

Implementation:
  @RetryableTopic(
    attempts = "3",
    backoff = @Backoff(delay = 1000, multiplier = 2),
    dltTopicSuffix = "-dlt"
  )
  @KafkaListener(topics = "orders")
  public void handleOrder(OrderEvent event) {
      processOrder(event);  // retried 3x, then → orders-dlt
  }

  @DltHandler
  public void handleDlt(OrderEvent event, Exception e) {
      log.error("Message sent to DLT: {}", event, e);
      alertService.notify("DLT has new message");
  }
```

## 5.6 Kafka vs Other Message Queues

```
                Kafka           RabbitMQ        AWS SQS
Type            Distributed log Message broker  Managed queue
Ordering        Per partition   Per queue        Best-effort
Persistence     Days/forever    Until consumed   4d (default)
Replay          Yes (offset)    No               No
Throughput      Very high       High             High (managed)
Consumer model  Pull            Push + Pull      Pull
Routing         Topic/partition Exchange+routing Queue name
Use cases       Stream proc.,   Task queues,     AWS ecosystem,
                event sourcing  RPC patterns     simple decoupling
Complexity      High            Medium           Low

Kafka strengths:
  Event streaming, analytics pipelines
  High throughput (millions msgs/sec)
  Replay and reprocessing
  Multiple independent consumers

RabbitMQ strengths:
  Complex routing (topic, fanout, direct, headers exchanges)
  Request-reply (RPC) patterns
  Message priority
  Dead letter exchanges built-in

SQS strengths:
  Zero ops (fully managed)
  AWS integration
  FIFO queues for ordering
  Simple use cases
```

---

# 6. Redis — Advanced Patterns

> 📖 <https://redis.io/docs/manual/patterns/>

## 6.1 Redis as Primary Database

```
Redis Stack extends Redis with:
  RedisSearch: full-text search
  RedisJSON: native JSON documents
  RedisTimeSeries: time series data
  RedisBloom: probabilistic structures

When to use Redis as primary DB:
  Real-time leaderboards
  Session management
  Rate limiting
  Real-time analytics
  Gaming state
  NOT for: relational data, complex transactions, large objects

Persistence for durability:
  RDB + AOF together:
    RDB: snapshot every 5 minutes (fast restart)
    AOF: log every write (no data loss)
  
  redis.conf:
    appendonly yes
    appendfsync everysec
    save 300 10   # RDB every 5min if 10+ changes
```

## 6.2 Redis Cluster & High Availability

```
Redis Sentinel (High Availability):
  Monitors Redis master + replicas
  Automatic failover: promotes replica if master dies
  Config: sentinel monitor mymaster 127.0.0.1 6379 2
  Client: connect to Sentinel → get current master address

  ┌──────────────┐     ┌──────────────┐
  │  Sentinel 1  │     │  Sentinel 2  │
  └──────┬───────┘     └──────┬───────┘
         │                    │  (quorum = 2)
         └──────────┬─────────┘
                    ▼
              ┌──────────┐
              │  Master  │──replication──▶ ┌──────────┐
              └──────────┘                 │ Replica 1│
                                           └──────────┘

Redis Cluster (Sharding + HA):
  16384 hash slots distributed across master nodes
  Each master has replicas
  Clients route directly to correct node (CLUSTER REDIRECT)
  
  hashSlot = CRC16(key) % 16384
  
  hash tags for multi-key operations:
    {user:1}:profile → hash("user:1") → slot 4093
    {user:1}:orders  → hash("user:1") → slot 4093 (same!)
    → MGET, transactions work on keys in same slot
```

## 6.3 Redis Advanced Data Structures

```bash
# ── HYPERLOGLOG — approximate unique count ──
# Uses only 12KB regardless of cardinality!
PFADD page:views:2025-05-19 "user:1" "user:2" "user:1" "user:3"
PFCOUNT page:views:2025-05-19   # 3 (approx, ±0.81% error)

# Merge multiple:
PFMERGE page:views:week page:views:2025-05-18 page:views:2025-05-19
PFCOUNT page:views:week   # unique visitors this week

# Use cases: unique visitors, unique queries, cardinality estimation
# 1 billion unique IDs: 12KB with HLL vs 4GB with Set!

# ── BLOOM FILTER (RedisBloom) ──
BF.RESERVE mybloom 0.01 1000000  # 1% error rate, 1M items
BF.ADD mybloom "user:12345"
BF.EXISTS mybloom "user:12345"   # 1 (definitely added — might be false positive)
BF.EXISTS mybloom "user:99999"   # 0 (definitely NOT added)

# Use: "Has user X visited this page?" — don't show duplicate notifications
# Cache penetration prevention: check bloom before querying DB

# ── GEOSPATIAL ──
GEOADD locations 106.6297 10.8231 "Ho Chi Minh City"
GEOADD locations 105.8412 21.0245 "Hanoi"
GEOADD locations 108.2022 16.0544 "Da Nang"

GEODIST locations "Ho Chi Minh City" "Hanoi" km   # 1137.22
GEOPOS locations "Ho Chi Minh City"               # longitude, latitude
GEOSEARCH locations FROMMEMBER "Ho Chi Minh City" BYRADIUS 500 km ASC
# → returns cities within 500km sorted by distance

# Use: find nearest restaurant/driver/store

# ── STREAMS (Kafka-lite) ──
XADD user-events * user_id 1 action login ip 1.2.3.4
XADD user-events * user_id 2 action purchase amount 50000
XLEN user-events                # stream length
XRANGE user-events - +          # read all
XREAD COUNT 10 STREAMS user-events 0  # read from beginning
XREAD BLOCK 0 STREAMS user-events $   # block, wait for new events

# Consumer groups (like Kafka consumer groups):
XGROUP CREATE user-events analytics $ MKSTREAM
XREADGROUP GROUP analytics worker1 COUNT 10 STREAMS user-events >
XACK user-events analytics <message-id>  # acknowledge processed

# ── BITFIELD ──
BITFIELD user:1:flags SET u1 0 1    # bit 0 = email verified
BITFIELD user:1:flags SET u1 1 1    # bit 1 = phone verified
BITFIELD user:1:flags GET u1 0      # 1

# Efficient boolean flags: 100M users × 8 flags = 100MB vs 800MB with individual keys

# ── BITCOUNT / BITMAP ──
SETBIT active:2025-05-19 1234 1   # user 1234 was active today
SETBIT active:2025-05-19 5678 1
BITCOUNT active:2025-05-19        # count active users today
BITOP AND active:streak active:2025-05-19 active:2025-05-18  # active both days
BITCOUNT active:streak            # count users active both days
```

## 6.4 Redis Lua Scripts & Transactions

```bash
# MULTI/EXEC — basic transaction (not rollback, just atomic execution)
MULTI
SET user:1:balance 1000
INCR user:1:version
EXEC
# All or nothing execution (but no rollback on command errors)

# WATCH — optimistic locking
WATCH user:1:balance
balance = GET user:1:balance

MULTI
SET user:1:balance (balance - 100)
EXEC  # returns nil if balance changed since WATCH → retry

# Lua Script — atomic, complex operations
local key = KEYS[1]
local threshold = tonumber(ARGV[1])
local current = tonumber(redis.call('GET', key) or 0)
if current >= threshold then
    return 0  -- rate limited
end
redis.call('INCR', key)
redis.call('EXPIRE', key, 60)
return 1  -- allowed

# Execute:
EVAL "..." 1 "ratelimit:user:1" 100
# Or load script (better performance):
script_sha = SCRIPT LOAD "..."
EVALSHA script_sha 1 "ratelimit:user:1" 100

# Lua ensures: read + check + write is atomic (no race condition!)
```

---

# 7. N+1 Problem & Solutions

## 7.1 What is N+1?

```
N+1 Problem: 1 query to get list + N queries for each item's related data

Example: Get all users with their orders

WRONG (N+1):
  Query 1: SELECT * FROM users LIMIT 100          → 100 users
  Query 2: SELECT * FROM orders WHERE user_id = 1 → user 1's orders
  Query 3: SELECT * FROM orders WHERE user_id = 2 → user 2's orders
  ...
  Query 101: SELECT * FROM orders WHERE user_id = 100

Total: 101 queries for 100 users!
At scale: 1000 users = 1001 queries, 10000 users = 10001 queries

Impact:
  100 users × 5ms/query = 500ms total
  10000 users × 5ms/query = 50,000ms = 50 SECONDS!
  DB connection pool exhausted
```

## 7.2 Solutions in Different Contexts

```sql
-- ── SQL Solution: JOIN ──
-- 1 query instead of N+1
SELECT u.id, u.name, o.id as order_id, o.total, o.status
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'ACTIVE'
ORDER BY u.id, o.created_at DESC;

-- Or: IN clause
SELECT * FROM orders
WHERE user_id IN (1, 2, 3, ..., 100);  -- batch fetch

-- ── JPA/Hibernate Solutions ──

-- Problem: FetchType.LAZY causes N+1
@Entity
class User {
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)  // ← N+1 here
    List<Order> orders;
}

// Code that triggers N+1:
List<User> users = userRepo.findAll();  // 1 query
for (User u : users) {
    u.getOrders().size();               // N queries! (lazy load each time)
}

// FIX 1: JOIN FETCH in JPQL
@Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders")
List<User> findAllWithOrders();  // 1 query, all data!

// FIX 2: @EntityGraph
@EntityGraph(attributePaths = {"orders", "orders.items"})
List<User> findByStatus(UserStatus status);

// FIX 3: @BatchSize — batch lazy loading
@OneToMany
@BatchSize(size = 50)  // load 50 orders at a time instead of 1
List<Order> orders;
// Result: ceil(N/50) queries instead of N queries

// FIX 4: @Fetch(FetchMode.SUBSELECT)
@OneToMany
@Fetch(FetchMode.SUBSELECT)
List<Order> orders;
// SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE ...)
// 2 queries instead of N+1

// FIX 5: DTO Projection with JOIN
@Query("""
    SELECT new com.myapp.dto.UserOrderSummary(
        u.id, u.name, COUNT(o.id), SUM(o.total)
    )
    FROM User u LEFT JOIN u.orders o
    GROUP BY u.id, u.name
""")
List<UserOrderSummary> findUserOrderSummaries();
```

## 7.3 N+1 in REST APIs (GraphQL Solution)

```
Problem: REST API with nested resources

GET /users → returns 100 users
For each user: GET /users/{id}/orders  → 100 more requests

Client-side N+1:
  Frontend calls /users (100 users)
  For each user calls /users/1/profile, /users/2/profile... (100 calls)

Solutions:

1. Batch endpoint:
   GET /users/batch?ids=1,2,3,...,100
   POST /users/batch { "ids": [1,2,...,100] }

2. Include related data:
   GET /users?include=orders,profile
   Returns users with orders embedded
   Custom query param to control what's included

3. GraphQL + DataLoader:
   GraphQL query:
   {
     users(first: 100) {
       id
       name
       orders { id total status }
     }
   }

   WITHOUT DataLoader: resolves orders for each user = N+1!
   
   WITH DataLoader (batching + caching):
   1. Collect all user IDs that need orders (while resolving users)
   2. Batch: SELECT * FROM orders WHERE user_id IN (1,2,...,100)
   3. Distribute results back to each user resolver
   
   JavaScript:
   const orderLoader = new DataLoader(async (userIds) => {
       const orders = await db.query(
           'SELECT * FROM orders WHERE user_id = ANY($1)', [userIds]
       );
       return userIds.map(id => orders.filter(o => o.user_id === id));
   });
   
   // resolver called for each user
   User.orders = (user) => orderLoader.load(user.id);
   // DataLoader batches all .load() calls made in same tick → 1 SQL query!

4. Eager loading in ORM:
   Django: User.objects.prefetch_related('orders')
   Rails: User.includes(:orders)
   Sequelize: User.findAll({ include: [Order] })
```

## 7.4 Detecting N+1 in Production

```java
// Hibernate statistics (show slow queries)
spring.jpa.properties.hibernate.generate_statistics=true
spring.jpa.properties.hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS=100

// Datasource-proxy (Java: log all SQL queries)
@Bean
public DataSource dataSource(DataSourceProperties properties) {
    DataSource original = properties.initializeDataSourceBuilder().build();
    return ProxyDataSourceBuilder.create(original)
        .name("MyDS")
        .logQueryBySlf4j(SLF4JLogLevel.INFO)
        .countQuery()
        .build();
}

// p6spy — log all SQL with timing
// Add to application.properties:
// spring.datasource.url=jdbc:p6spy:postgresql://localhost:5432/mydb
// spring.datasource.driver-class-name=com.p6spy.engine.spy.P6SpyDriver

// Detect N+1 in test:
@Test
void testNoNPlusOne() {
    // Use Hibernate's StatisticsService or a query counter
    int queriesBefore = queryCounter.getCount();
    userService.getUsersWithOrders(100);
    int queriesAfter = queryCounter.getCount();
    
    assertThat(queriesAfter - queriesBefore)
        .isLessThanOrEqualTo(2);  // max 2 queries, not 101!
}
```

---

# 8. API Design & Gateway

## 8.1 REST API Best Practices

```
Resource naming:
  Use nouns, not verbs
  ✅ GET    /users          → list users
  ✅ POST   /users          → create user
  ✅ GET    /users/123      → get user 123
  ✅ PUT    /users/123      → replace user 123
  ✅ PATCH  /users/123      → update user 123 partially
  ✅ DELETE /users/123      → delete user 123
  ✅ GET    /users/123/orders → user 123's orders
  ❌ GET    /getUser/123
  ❌ POST   /createUser
  ❌ GET    /users/123/getOrders

Versioning:
  URL: /api/v1/users, /api/v2/users (most common, easy to cache)
  Header: Accept: application/vnd.myapi.v2+json
  Query: /users?version=2

Pagination:
  Cursor-based (recommended for large datasets):
    GET /posts?cursor=eyJpZCI6MTAwfQ&limit=20
    Response: { data: [...], nextCursor: "eyJpZCI6MTIwfQ" }
  
  Offset-based (simple but slow for large offsets):
    GET /posts?page=5&limit=20
    Response: { data: [...], total: 1000, page: 5, totalPages: 50 }
  
  Keyset (most efficient):
    GET /posts?after_id=100&limit=20

Filtering, Sorting:
  GET /orders?status=PENDING&user_id=123
  GET /orders?sort=created_at:desc,total:asc
  GET /orders?created_after=2025-01-01&created_before=2025-05-19

Response format:
  Success:
  {
    "data": { "id": 1, "name": "Khang" },
    "meta": { "requestId": "uuid", "timestamp": "..." }
  }
  
  List:
  {
    "data": [...],
    "pagination": { "total": 1000, "page": 1, "limit": 20, "cursor": "..." }
  }
  
  Error:
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Email is invalid",
      "details": [{ "field": "email", "message": "Invalid format" }],
      "requestId": "uuid"
    }
  }
```

## 8.2 API Gateway

```
API Gateway: single entry point for all clients

Responsibilities:
  Request routing: route to correct microservice
  Authentication: verify JWT/API key
  Rate limiting: throttle per user/IP/API key
  SSL termination: handle HTTPS
  Load balancing: distribute across instances
  Request/response transformation
  Caching: cache responses
  Logging & monitoring: centralized observability
  Circuit breaking: fail fast if downstream is down

┌──────────┐     ┌──────────────────┐
│ Client   │────▶│   API Gateway    │
└──────────┘     │                  │
                 │  Auth check      │──▶ ┌──────────────┐
                 │  Rate limit      │    │ User Service │
                 │  Route           │──▶ ┌──────────────┐
                 │  Transform       │    │ Order Service│
                 │  Log             │──▶ ┌──────────────┐
                 └──────────────────┘    │ Product Svc  │
                                         └──────────────┘

Popular API Gateways:
  Kong: open source, plugin-based, high performance
  AWS API Gateway: managed, serverless-friendly
  Nginx: simple, battle-tested, high performance
  Traefik: k8s-native, automatic service discovery
  Envoy: service mesh proxy (Istio uses Envoy)

Rate Limiting Algorithms:
  Fixed Window: count requests per minute window
    Simple, but burst at window boundary
  Sliding Window: smooth out requests over time
    More accurate, more memory
  Token Bucket: bucket fills at rate R, each request takes 1 token
    Allows controlled bursts
  Leaky Bucket: queue requests, process at constant rate
    Smoothest output, no bursts

Redis-based rate limiting:
  INCR ratelimit:{userId}:{minute}
  EXPIRE ratelimit:{userId}:{minute} 60
  if count > limit: reject with 429
```

---

# 9. Microservices Architecture

## 9.1 Microservices vs Monolith

```
MONOLITH:
  Single deployable unit, all services in one process

  ✅ Simple: 1 codebase, 1 deployment
  ✅ No network overhead between services
  ✅ Easy transactions (same DB)
  ✅ Easy local development
  ❌ Scales as unit (can't scale only the bottleneck)
  ❌ Deploy whole app for any change
  ❌ Technology lock-in
  ❌ Large codebase = slow development at scale

MICROSERVICES:
  Multiple independently deployable services

  ✅ Independent scaling
  ✅ Independent deployment
  ✅ Technology freedom per service
  ✅ Fault isolation (1 service fails ≠ all fail)
  ❌ Network latency between services
  ❌ Distributed transactions are hard
  ❌ Operational complexity (many services to monitor)
  ❌ Data consistency challenges

RULE: Start with modular monolith, extract services when:
  A specific service is the scaling bottleneck
  Team boundaries require independence
  You understand domain boundaries well

"Microservices are a distributed system.
 You inherit ALL distributed system problems." — Martin Fowler
```

## 9.2 Service Communication

```
SYNCHRONOUS (Request-Response):
  REST over HTTP/HTTPS
  gRPC (Protocol Buffers, HTTP/2, bidirectional streaming)

  gRPC advantages over REST:
    Binary protocol (faster, smaller than JSON)
    Strongly typed (protobuf schema)
    Generated client code
    Bidirectional streaming
    HTTP/2 multiplexing

  When to use:
    REST: public APIs, simple CRUD, browser clients
    gRPC: internal service-to-service, streaming, high performance

ASYNCHRONOUS (Event-Driven):
  Kafka, RabbitMQ, AWS SNS/SQS

  When to use:
    Fire-and-forget operations (email, notifications)
    Eventual consistency is OK
    Need to absorb traffic spikes
    Fan-out: one event → many consumers

SERVICE MESH (Istio, Linkerd):
  Sidecar proxy (Envoy) injected next to every service container
  Handles: mTLS, circuit breaking, retries, tracing, metrics
  App code doesn't need to know about these concerns!
  
  Without service mesh:
    Each service implements: retry, circuit breaker, tracing, auth
    Code is mixed with business logic
  
  With service mesh:
    Sidecar handles all cross-cutting concerns
    App code only handles business logic
```

## 9.3 Circuit Breaker Pattern

```
Problem: Service A calls Service B
  Service B is slow (high latency)
  Service A's threads wait → Service A runs out of threads
  Service A becomes slow too → cascading failure!

Circuit Breaker (like electrical circuit breaker):

CLOSED state (normal):
  Requests pass through
  Count failures
  If failure rate > threshold → trip → OPEN

OPEN state (failure):
  Requests FAIL FAST immediately (no waiting!)
  After timeout → HALF-OPEN

HALF-OPEN state (probe):
  Allow 1 request through
  Success → CLOSED
  Failure → OPEN again

                 failure rate > threshold
CLOSED ──────────────────────────────────▶ OPEN
  ▲                                         │
  │  probe success                          │ timeout
  │                                         ▼
  └───────────────────────────────────── HALF-OPEN

Resilience4j (Java):
@CircuitBreaker(name = "paymentService", fallbackMethod = "fallbackPayment")
public PaymentResult processPayment(PaymentRequest request) {
    return paymentServiceClient.process(request);
}

public PaymentResult fallbackPayment(PaymentRequest request, Exception e) {
    log.warn("Payment service unavailable, using fallback", e);
    return PaymentResult.pending("Payment will be processed later");
}

// application.yml:
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        sliding-window-size: 10
        failure-rate-threshold: 50      # open if 50% fail
        wait-duration-in-open-state: 30s
        permitted-calls-in-half-open-state: 3

Bulkhead Pattern (prevent cascading):
  Separate thread pools per external dependency
  DB pool: 20 threads
  PaymentService pool: 5 threads
  If PaymentService hangs: only 5 threads stuck, DB calls unaffected

@Bulkhead(name = "paymentService", type = Bulkhead.Type.THREADPOOL)
public CompletableFuture<PaymentResult> processPayment(PaymentRequest request) {
    return CompletableFuture.supplyAsync(() -> client.process(request));
}
```

## 9.4 Saga Pattern — Distributed Transactions

```
Problem: order creation spans multiple services
  1. Create order (Order Service)
  2. Reserve inventory (Inventory Service)
  3. Charge payment (Payment Service)
  4. Send confirmation (Notification Service)

Can't use DB transaction across services!
(Different DBs, different hosts)

SAGA Pattern: sequence of local transactions with compensating transactions

CHOREOGRAPHY-BASED SAGA (event-driven):
  Each service publishes events, others react

  OrderService: CREATE order → publish "OrderCreated"
  InventoryService: consume "OrderCreated" → reserve items
                  → publish "InventoryReserved" or "InventoryFailed"
  PaymentService: consume "InventoryReserved" → charge card
               → publish "PaymentProcessed" or "PaymentFailed"
  OrderService: consume "PaymentProcessed" → confirm order

  On failure (PaymentFailed):
  InventoryService: consume "PaymentFailed" → COMPENSATE: release items
  OrderService: consume "PaymentFailed" → COMPENSATE: cancel order

  ✅ Loosely coupled
  ❌ Hard to track overall saga status
  ❌ Hard to debug complex flows

ORCHESTRATION-BASED SAGA (central coordinator):
  Saga Orchestrator explicitly tells each service what to do

  SagaOrchestrator:
    Step 1: tell OrderService → create order
    Step 2: tell InventoryService → reserve items
    Step 3: tell PaymentService → charge card
    Step 4: tell NotificationService → send email
    
    On failure at step 3:
      Compensate step 2: tell InventoryService → release items
      Compensate step 1: tell OrderService → cancel order

  ✅ Clear flow, easy to track
  ✅ Single place to handle failures
  ❌ Orchestrator knows business logic (coupling)
  ❌ Orchestrator can be bottleneck/SPOF
```

---

# 10. Consistency Patterns

## 10.1 Strong vs Eventual Consistency

```
STRONG CONSISTENCY:
  After write completes, any subsequent read returns that value
  Client always sees latest data
  Cost: latency (wait for all replicas), availability (block if replica down)
  Examples: bank transfers, inventory (avoid overselling)

EVENTUAL CONSISTENCY:
  After write, reads WILL EVENTUALLY return the new value
  Temporary stale data is OK
  Cost: complexity (handle stale reads)
  Benefit: high availability, low latency
  Examples: social feed, view counts, DNS, shopping cart

CAUSAL CONSISTENCY:
  If A caused B, then any process that sees B also sees A
  Weaker than strong, stronger than eventual
  Example: reply to comment always shown after original comment

MONOTONIC READ:
  If process reads value v, it never reads older value later
  You won't see "time go backwards"

READ-YOUR-OWN-WRITES:
  After writing, you always see your own write
  Others might not see it yet, but YOU do

BOUNDED STALENESS:
  Reads are at most T seconds or K versions behind
  Example: DynamoDB consistent reads, Azure Cosmos DB
```

## 10.2 Two-Phase Commit (2PC)

```
Distributed transaction coordinator ensures all nodes commit or rollback

Phase 1 — PREPARE:
  Coordinator asks all participants: "Can you commit?"
  Each participant: locks resources, writes to journal, replies YES/NO

Phase 2 — COMMIT or ROLLBACK:
  All YES → Coordinator sends COMMIT to all
  Any NO  → Coordinator sends ROLLBACK to all
  Each participant: commits/rollbacks, releases locks, ACKs

Coordinator ──PREPARE──▶ Node1, Node2, Node3
             ◀──YES──── Node1 (acquired locks)
             ◀──YES──── Node2 (acquired locks)
             ◀──YES──── Node3 (acquired locks)
             ──COMMIT──▶ Node1, Node2, Node3

Problems:
  Blocking: if coordinator crashes after PREPARE → nodes stuck holding locks!
  Network partition: participants don't know if coordinator committed
  Performance: 2 round trips, locks held between phases
  Single point of failure: coordinator

3PC (Three-Phase Commit):
  Adds a "pre-commit" phase to avoid blocking
  Still vulnerable to network partitions
  Rarely used in practice

Modern alternative: Saga pattern (preferred for microservices)
```

## 10.3 Idempotency

```
Idempotent operation: calling N times = calling 1 time (same result)

Why crucial in distributed systems:
  Network timeout: did the request succeed or not?
  → Retry the request
  → If not idempotent: might execute twice! (double charge!)

Idempotency Key pattern:
  Client generates unique key per operation
  Client sends: POST /payments { ..., idempotencyKey: "uuid" }
  Server: check if key seen before
    No: execute + store key + response
    Yes: return stored response (don't execute again!)

Implementation:
  Redis: SET idempotency:{key} {response} NX EX 86400
    NX = only set if not exists (atomic check-and-set)

  Database:
    payments table: (id, idempotency_key UNIQUE, ...)
    INSERT ... ON CONFLICT (idempotency_key) DO NOTHING

Making operations idempotent:
  HTTP GET: always idempotent (read doesn't change state)
  HTTP PUT: idempotent (replace is idempotent)
  HTTP DELETE: idempotent (delete already deleted = ok)
  HTTP POST: NOT idempotent by default → use idempotency keys
  
  Stripe, Square, AWS all support idempotency keys for payments
```

---

# 11. Real-World System Designs

## 11.1 URL Shortener (bit.ly)

```
Requirements:
  Shorten long URL to short (e.g., bit.ly/abc123)
  Redirect short → long
  Analytics: click count

Design:

WRITE: POST /shorten { url: "https://very-long-url.com..." }
  1. Generate 6-char short code (base62: a-z A-Z 0-9 = 62^6 = 56 billion)
     Method: hash URL → take first 6 chars, check collision
     Or: use auto-increment ID, encode to base62
  2. Store: { code: "abc123", url: "...", created_at, click_count: 0 }
  3. Return: { shortUrl: "bit.ly/abc123" }

READ: GET /abc123 (redirect)
  1. Lookup "abc123" in Redis cache (TTL: 1 hour)
  2. If miss: query DB
  3. Async: increment click counter (don't slow down redirect!)
  4. Return 301 (permanent, browser caches) or 302 (temporary, we control)

Analytics:
  Async: publish click event to Kafka
  Consumer: batch update click counts
  Or: HyperLogLog for unique clicks

Scale:
  Write: 100 writes/sec → single DB easily handles this
  Read: 10,000 reads/sec → Redis cache, CDN for redirect
  Storage: 6 bytes code + 2KB URL × 100M URLs = 200GB → single DB fine

DB Schema:
  urls: (id BIGINT, code CHAR(6) UNIQUE, long_url TEXT, user_id, created_at, clicks)
  Create index on code (lookup by code is only read path)
```

## 11.2 Rate Limiter

```
Requirements:
  Limit each user to 100 API calls per minute
  Distributed (multiple API servers)
  Low latency impact (< 1ms)

Design using Redis:

Fixed Window:
  key = "ratelimit:{userId}:{minute}"
  INCR key → if > 100: reject → else: allow
  EXPIRE key 60
  
  Problem: burst at window boundary
  User makes 100 calls at 11:59 → 100 calls at 12:00 = 200 calls in 2s!

Sliding Window Log:
  Store timestamp of each request in sorted set:
  ZADD "ratelimit:{userId}" {timestamp} {requestId}
  ZREMRANGEBYSCORE "ratelimit:{userId}" 0 {one_minute_ago}
  count = ZCARD "ratelimit:{userId}"
  if count >= 100: reject
  EXPIRE "ratelimit:{userId}" 60
  
  ✅ Accurate sliding window
  ❌ Memory: store all request timestamps

Sliding Window Counter (best balance):
  Store count for current minute + previous minute
  Interpolate to estimate count in last 60 seconds:
  
  current_count = prev_count × (1 - elapsed/60) + curr_count
  
  Two counters: O(1) space, O(1) time, approximate but accurate

Token Bucket (Redis Lua):
  -- lua script for atomicity
  local tokens = tonumber(redis.call('GET', KEYS[1]) or ARGV[1])
  local refill = math.floor((current_time - last_refill) * rate)
  tokens = math.min(capacity, tokens + refill)
  if tokens >= 1 then
    redis.call('SET', KEYS[1], tokens - 1)
    return 1  -- allowed
  end
  return 0  -- denied

Response headers (tell client their limits):
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 43
  X-RateLimit-Reset: 1715960400
  Retry-After: 30  (on 429)
```

## 11.3 Notification System

```
Requirements:
  Send push, email, SMS notifications
  100M notifications/day (1,160/sec)
  Multiple channels: push, email, SMS
  Delivery guarantee, no duplicates

Design:

                     ┌─────────────────┐
 Any Service ──────▶ │ Notification    │
 (Order placed,      │ Service         │──▶ Kafka topic: "notifications"
  Payment done...)   │                 │
                     └─────────────────┘

Kafka: "notifications" topic
  Partition by user_id (all of user's notifications ordered)

Workers (per channel):

Email Worker:
  Consume from Kafka
  Lookup user email preferences (respect opt-outs!)
  Rate limit: 1 email/min per user (anti-spam)
  Send via SendGrid/SES
  Store delivery status in DB

Push Worker:
  Consume from Kafka
  Batch pushes per device (APNs batch API)
  Handle expired tokens, unsubscribed devices
  Send via Firebase FCM, Apple APNs

SMS Worker:
  Most expensive channel
  Send only critical (2FA, security alerts)
  Send via Twilio/AWS SNS

User Preferences Service:
  Which channels enabled per user per notification type
  Respect quiet hours, DND
  Cache aggressively (read-heavy)

Template Service:
  Notification content templated, not hardcoded
  i18n: locale-specific templates
  A/B testing: different templates

Delivery tracking:
  notifications_log table: user_id, type, channel, status, sent_at
  Webhook from SendGrid/FCM → update delivery status
  Idempotency key: prevent duplicate sends on retry
```

---

# 12. Numbers Every Engineer Should Know

## 12.1 Latency Numbers

```
Operation                                Time        Notes
─────────────────────────────────────────────────────────────────────
L1 cache reference                       0.5 ns
Branch mispredict                        5 ns
L2 cache reference                       7 ns
Mutex lock/unlock                        25 ns
Main memory (RAM) reference              100 ns
Compress 1KB with Snappy                 3,000 ns    3 μs
Send 2KB over 1 Gbps network             20,000 ns   20 μs
Read 1MB sequentially from RAM           250,000 ns  250 μs
Round trip within same datacenter        500,000 ns  500 μs = 0.5 ms
Read 1MB sequentially from SSD           1,000,000 ns 1 ms
HDD seek                                 10,000,000 ns 10 ms
Read 1MB sequentially from HDD          30,000,000 ns  30 ms
Send packet CA → Netherlands → CA       150,000,000 ns 150 ms

Practical API latencies:
  In-process function call:              < 1 μs
  Redis GET (same datacenter):           0.1 - 1 ms
  PostgreSQL indexed query (local):      1 - 5 ms
  PostgreSQL complex query:              10 - 100 ms
  HTTP API call (same datacenter):       1 - 10 ms
  HTTP API call (cross-region):          50 - 200 ms
  S3 GET:                               5 - 30 ms
  DNS resolution (cached):              < 1 ms
  DNS resolution (uncached):            20 - 100 ms

Key insights:
  RAM 200x faster than SSD
  SSD 100x faster than HDD
  Network within DC: ~1ms RTT
  Avoid disk access in hot path!
  Cache what you can in RAM
```

## 12.2 Availability Numbers

```
Availability    Downtime/year   Downtime/month  Downtime/day
─────────────────────────────────────────────────────────────
90%             36.5 days       72 hours        2.4 hours
99%             3.65 days       7.2 hours       14.4 min
99.9%           8.77 hours      43.8 min        1.44 min     ← "three nines"
99.95%          4.38 hours      21.9 min        43.2 sec
99.99%          52.6 min        4.38 min        8.64 sec     ← "four nines"
99.999%         5.26 min        26.3 sec        864 ms       ← "five nines"
99.9999%        31.6 sec        2.63 sec        86.4 ms

SLA targets by product type:
  Internal tools: 99.9% (1.44 min/day OK)
  External APIs: 99.99% (8.64 sec/day)
  Financial/Healthcare: 99.999% (5 min/year)
  Google/AWS: 99.99% committed, actual ~99.999%

Composite availability:
  System with N serial components:
  Availability = A1 × A2 × A3 × ... × AN
  
  3 services each 99.9%: 0.999 × 0.999 × 0.999 = 99.7%!
  → More dependencies = lower availability
  → Use async/event-driven to decouple dependencies

Improving availability:
  Redundancy: run 2+ instances, failover if 1 dies
  Health checks + auto-restart
  Multi-AZ deployment (different physical locations)
  Circuit breakers (fail fast, don't cascade)
  Graceful degradation (serve stale cache, partial features)
  Chaos engineering (Netflix Chaos Monkey)
```

## 12.3 Throughput Numbers

```
Typical single server throughput (well-optimized):
  Nginx static files:     100,000+ req/sec
  Nginx proxy:            20,000-50,000 req/sec
  Spring Boot API:        1,000-10,000 req/sec
  Node.js API:            10,000-50,000 req/sec
  PostgreSQL simple query: 10,000-100,000 q/sec
  Redis:                  100,000-1,000,000 ops/sec
  Kafka producer:         1,000,000+ msgs/sec
  Kafka consumer:         1,000,000+ msgs/sec

Reality check for interview:
  10M DAU × 10 requests/day = 100M req/day
  Peak (assume 3x average): 100M / 86400 × 3 ≈ 3,500 req/sec
  
  Can handle with:
    1-3 app servers (if stateless, DB is bottleneck)
    Read replicas for DB
    Redis cache for hot data
    CDN for static assets
  
  100M DAU × 10 requests/day → 35,000 req/sec peak
    10+ app servers
    DB sharding or specialized DB
    Redis cluster
    Kafka for async processing
    CDN + edge caching
```

---

## 📎 System Design Cheatsheet

```
STEP 1: Clarify → functional requirements, scale, consistency needs
STEP 2: Estimate → QPS, storage, bandwidth
STEP 3: Design → LB → App Servers → Cache → DB → MQ
STEP 4: Deep dive → schema, algorithms, bottlenecks
STEP 5: Evolve → scale each component, failure handling

READ HEAVY (100:1 read:write):
  → Aggressive caching (Redis)
  → Read replicas
  → CDN for static content
  → Denormalized read models

WRITE HEAVY (1:1 or more writes):
  → Message queue (buffer writes)
  → Batch processing
  → Async processing
  → Separate write/read paths (CQRS)

HIGH AVAILABILITY:
  → Eliminate SPOFs
  → Multiple instances per service
  → Multi-AZ deployment
  → Health checks + auto-recovery
  → Circuit breakers

LOW LATENCY:
  → Cache aggressively
  → CDN for geographic distribution
  → Optimize queries (indexes)
  → Async for non-critical path
  → Connection pooling
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Apache Kafka | <https://kafka.apache.org/documentation/> |
| Redis Docs | <https://redis.io/docs/> |
| Redis Patterns | <https://redis.io/docs/manual/patterns/> |
| PostgreSQL Performance | <https://www.postgresql.org/docs/current/performance-tips.html> |
| System Design Primer | <https://github.com/donnemartin/system-design-primer> |
| Designing Data-Intensive Apps | <https://dataintensive.net/> |
| AWS Architecture Center | <https://aws.amazon.com/architecture/> |
| Google SRE Book | <https://sre.google/sre-book/table-of-contents/> |
| Martin Fowler Patterns | <https://martinfowler.com/articles/patterns-of-distributed-systems/> |
| High Scalability Blog | <http://highscalability.com/> |
| Resilience4j | <https://resilience4j.readme.io/> |
| DDIA (free summary) | <https://github.com/keyvanakbary/learning-notes/blob/master/books/designing-data-intensive-applications.md> |

---

*Học theo thứ tự: Scalability fundamentals → Caching → DB scaling → Message queues → Microservices → Real-world designs*
