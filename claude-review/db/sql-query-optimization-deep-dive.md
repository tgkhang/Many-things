# 🗄️ SQL & Query Optimization — Complete Deep Dive
>
> Index, JOIN, Execution Plan, N+1 Problem, Query Tuning, PostgreSQL/MySQL

---

## 📚 Table of Contents

1. [SQL Fundamentals Review](#1-sql-fundamentals-review)
2. [Index — Deep Dive](#2-index--deep-dive)
3. [JOIN — Cơ Chế & Tối Ưu](#3-join--cơ-chế--tối-ưu)
4. [Execution Plan — EXPLAIN ANALYZE](#4-execution-plan--explain-analyze)
5. [N+1 Problem](#5-n1-problem)
6. [Query Optimization Techniques](#6-query-optimization-techniques)
7. [Aggregation & Window Functions](#7-aggregation--window-functions)
8. [Transactions & Locking](#8-transactions--locking)
9. [Schema Design for Performance](#9-schema-design-for-performance)
10. [PostgreSQL vs MySQL Specifics](#10-postgresql-vs-mysql-specifics)

---

# 1. SQL Fundamentals Review

## 1.1 Query Execution Order

```
SQL VIẾT theo thứ tự này:
  SELECT columns
  FROM table
  JOIN other_table ON condition
  WHERE filter
  GROUP BY columns
  HAVING aggregate_filter
  ORDER BY columns
  LIMIT n OFFSET m

NHƯNG Database THỰC HIỆN theo thứ tự này:
  1. FROM          ← xác định data source
  2. JOIN          ← kết hợp tables
  3. WHERE         ← lọc rows (trước GROUP BY → dùng để giảm data SỚMHẤT)
  4. GROUP BY      ← gom nhóm
  5. HAVING        ← lọc sau khi group (có thể dùng aggregate)
  6. SELECT        ← chọn columns, tính expressions
  7. DISTINCT      ← loại duplicates
  8. ORDER BY      ← sắp xếp (có thể dùng alias từ SELECT)
  9. LIMIT/OFFSET  ← phân trang

TẠI SAO QUAN TRỌNG:
  -- WRONG: dùng alias trong WHERE (SELECT chưa chạy!)
  SELECT price * 0.9 AS discounted_price
  FROM products
  WHERE discounted_price > 100;  -- ERROR! alias không tồn tại ở WHERE

  -- CORRECT: lặp expression
  SELECT price * 0.9 AS discounted_price
  FROM products
  WHERE price * 0.9 > 100;

  -- OR: dùng subquery/CTE
  WITH discounted AS (
      SELECT *, price * 0.9 AS discounted_price FROM products
  )
  SELECT * FROM discounted WHERE discounted_price > 100;

  -- CORRECT: alias có thể dùng trong ORDER BY (ORDER BY sau SELECT)
  SELECT price * 0.9 AS discounted_price
  FROM products
  ORDER BY discounted_price DESC;  -- OK!
```

## 1.2 Database Storage Basics

```
TABLE = collection of rows stored on DISK (pages/blocks)

PAGE (block):
  PostgreSQL: 8KB default page size
  MySQL InnoDB: 16KB default page size
  Each row stored within a page
  
  ┌──────────────────────────────────────────┐
  │  Page Header (24 bytes)                  │
  │  Item IDs (4 bytes per row pointer)      │
  ├──────────────────────────────────────────┤
  │  Row 1 data                              │
  │  Row 2 data                              │
  │  Row 3 data                              │
  │  ... (rows grow from end)                │
  └──────────────────────────────────────────┘

SEQUENTIAL SCAN (full table scan):
  Read pages one by one from first to last
  Cost: O(n) — proportional to number of rows
  When: no usable index, small tables, fetching >10-20% of rows

INDEX SCAN:
  Use index structure to find specific rows
  Cost: O(log n) — B-Tree traversal
  Then: fetch specific pages by row pointer
  When: selective filter (<5-10% of rows)
  
HEAP:
  PostgreSQL term for actual table data (vs index)
  Index stores: key + ctid (page number + slot number)
  To get full row: index lookup → ctid → fetch from heap (expensive!)

MVCC (Multi-Version Concurrency Control):
  PostgreSQL/MySQL InnoDB store MULTIPLE VERSIONS of rows
  Each transaction sees consistent snapshot
  SELECT sees rows committed before transaction started
  Old versions eventually cleaned up (VACUUM in PostgreSQL, purge in MySQL)
  → VACUUM is important! Dead tuples bloat table, slow queries
```

---

# 2. Index — Deep Dive

## 2.1 B-Tree Index (Default)

```
B-TREE = Balanced Tree = most common index type
  Self-balancing, O(log n) for all operations
  Works for: =, <, >, <=, >=, BETWEEN, LIKE 'prefix%'

STRUCTURE:
  Root → internal nodes → leaf nodes (all at same level)
  Leaf nodes contain: key value + pointer to row
  Leaf nodes linked (doubly): range scans efficient!

  Example: index on age column
  
                    [30]
                   /    \
              [15]        [45]
             /    \      /    \
          [5,10] [20,25] [35,40] [50,55]
           │       │       │       │
          rows    rows    rows    rows
  
  B-Tree height ≈ log_b(n) where b ≈ 100-200 (fanout)
  10M rows → height ≈ 3-4 → at most 4 page reads!
  vs Sequential scan: 10M rows / 100 rows/page = 100K page reads

LEAF NODE LINKAGE (range scan):
  SELECT * FROM users WHERE age BETWEEN 20 AND 40
  1. B-Tree traversal to first key ≥ 20: O(log n)
  2. Follow leaf links → scan until > 40: O(k) where k = result rows
  3. Fetch each row from heap: O(k)
  Very efficient for ranges!
```

```sql
-- ── INDEX CREATION ──

-- Single column index:
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_status ON orders(status);

-- Unique index (also enforces constraint):
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
-- CREATE UNIQUE INDEX is usually better than UNIQUE constraint (same internally but more options)

-- Multi-column (composite) index:
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
-- This index can satisfy:
--   WHERE user_id = 5                        ← uses index (leading column)
--   WHERE user_id = 5 AND status = 'PENDING' ← uses index (both columns)
--   WHERE status = 'PENDING'                 ← CANNOT use index! (not leading column)

-- COLUMN ORDER MATTERS in composite index!
-- Rule: most selective (most unique values) first
-- Rule: columns used in equality (=) before range (<, >, BETWEEN)

-- WRONG order (range before equality):
CREATE INDEX idx_wrong ON orders(created_at, user_id);
-- WHERE user_id = 5 AND created_at > '2025-01-01' → can't use created_at after range

-- CORRECT order (equality before range):
CREATE INDEX idx_correct ON orders(user_id, created_at);
-- WHERE user_id = 5 AND created_at > '2025-01-01' → uses both columns!

-- Partial index (only index subset of rows):
CREATE INDEX idx_orders_pending ON orders(user_id, created_at)
WHERE status = 'PENDING';
-- Much smaller index, only for specific query:
-- WHERE status = 'PENDING' AND user_id = 5 ORDER BY created_at
-- Doesn't help for other status values!

-- Covering index (include extra columns):
-- PostgreSQL:
CREATE INDEX idx_orders_covering ON orders(user_id, status)
INCLUDE (total_amount, created_at);
-- "Index-only scan": query can be answered from index alone (no heap access)!
-- SELECT total_amount, created_at FROM orders WHERE user_id=5 AND status='PAID'
-- → All needed data in index! Extremely fast!

-- MySQL:
CREATE INDEX idx_orders_covering ON orders(user_id, status, total_amount, created_at);
-- MySQL: covering = all needed columns IN the key (not INCLUDE)

-- Expression index:
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
-- Now: WHERE LOWER(email) = 'user@example.com' → uses index!
-- WITHOUT this: WHERE LOWER(email) → function on column → can't use regular index

-- Concurrent index (PostgreSQL — no table lock!):
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
-- Takes longer but doesn't block reads/writes
-- Use in production! Regular CREATE INDEX locks the table
```

## 2.2 Index Types

```sql
-- ── HASH INDEX ──
-- O(1) equality lookup, but NO range scan support
CREATE INDEX idx_users_email_hash ON users USING HASH (email);
-- Best for: large text columns with only equality checks
-- NOT for: LIKE, <, >, ORDER BY
-- PostgreSQL 10+ makes Hash indexes crash-safe

-- ── GIN Index (Generalized Inverted Index) ──
-- For: arrays, JSONB, full-text search
-- Index maps each element → set of rows containing it

-- Full-text search:
CREATE INDEX idx_products_search ON products
USING GIN(to_tsvector('english', name || ' ' || description));

SELECT * FROM products
WHERE to_tsvector('english', name || ' ' || description)
    @@ to_tsquery('english', 'laptop & gaming');

-- JSONB operations:
CREATE INDEX idx_metadata_gin ON events USING GIN(metadata);
-- Supports: @>, <@, ?, ?|, ?&  operators
SELECT * FROM events WHERE metadata @> '{"type": "click"}';
SELECT * FROM events WHERE metadata ? 'user_id';

-- Array column:
CREATE INDEX idx_tags_gin ON articles USING GIN(tags);
SELECT * FROM articles WHERE tags @> ARRAY['postgresql', 'performance'];
SELECT * FROM articles WHERE tags && ARRAY['docker', 'kubernetes'];

-- ── GIST Index ──
-- For: geometric types, range types, custom types
CREATE INDEX idx_locations_gist ON stores USING GIST(location);
-- PostGIS: spatial queries (nearby stores, within polygon)
SELECT * FROM stores
WHERE ST_DWithin(location, ST_Point(106.63, 10.82)::geography, 5000);  -- within 5km

-- Range types:
CREATE INDEX idx_bookings_range ON bookings USING GIST(during);
SELECT * FROM bookings WHERE during && '[2025-05-01, 2025-05-07)'::daterange;

-- ── BRIN Index (Block Range Index) ──
-- Very small! Only stores min/max per block range
-- Only useful when data is physically ordered (e.g., append-only time series)
CREATE INDEX idx_events_created ON events USING BRIN(created_at);
-- Tiny index, very fast to build, but only useful for naturally ordered data
-- NOT useful for randomly distributed data

-- ── INDEX MANAGEMENT ──
-- View index usage:
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
-- idx_scan = 0: index never used → candidate for removal!

-- Index size:
SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find missing indexes (PostgreSQL):
SELECT relname, seq_scan, idx_scan,
       ROUND(100 * idx_scan::NUMERIC / (seq_scan + idx_scan + 1), 2) AS idx_ratio
FROM pg_stat_user_tables
WHERE seq_scan > 100
ORDER BY seq_scan DESC;
-- High seq_scan + low idx_ratio → missing index!

-- Rebuild bloated index:
REINDEX INDEX idx_orders_status;         -- locks
REINDEX INDEX CONCURRENTLY idx_orders;   -- PostgreSQL 12+ no lock
```

## 2.3 When NOT to Use Index

```
INDEXES HURT PERFORMANCE when:
  1. Small tables (< 1000 rows):
     Sequential scan faster (no B-tree overhead)
     Query planner usually ignores index for small tables
  
  2. Low selectivity columns:
     status IN ('ACTIVE', 'INACTIVE') → 50% rows each
     Boolean columns
     Query returns >10-20% of rows → seq scan cheaper
  
  3. Heavy write workloads:
     Every INSERT/UPDATE/DELETE also updates all indexes
     10 indexes on table = 11 writes per row insert!
     Balance: read performance vs write overhead
  
  4. Functional query on non-functional index:
     WHERE UPPER(name) = 'KHANG'   → can't use index on name
     Need: CREATE INDEX ON users(UPPER(name))
  
  5. LIKE with leading wildcard:
     WHERE name LIKE '%khang%'  → can't use B-tree index!
     Fix: use full-text search (GIN + tsvector)
     Or: pg_trgm extension: CREATE INDEX USING GIN(name gin_trgm_ops)
```

---

# 3. JOIN — Cơ Chế & Tối Ưu

## 3.1 JOIN Types

```sql
-- ── VISUAL REPRESENTATION ──
-- Orders: O1(user1), O2(user1), O3(user2), O4(user3)
-- Users: U1, U2, U4 (no U3!)

-- INNER JOIN: only matching rows from BOTH tables
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
-- Results: O1(U1), O2(U1), O3(U2)
-- U4 excluded (no orders), O4 excluded (no user U3)

-- LEFT JOIN: ALL from left, matching from right (NULL if no match)
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- Results: O1(U1), O2(U1), O3(U2), (U4, NULL)
-- U4 included with NULL order, O4 still excluded

-- RIGHT JOIN: ALL from right, matching from left (rarely used, prefer LEFT JOIN)
SELECT u.name, o.total
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
-- Results: O1(U1), O2(U1), O3(U2), (NULL, O4)
-- O4 included with NULL user

-- FULL OUTER JOIN: ALL from BOTH tables
SELECT u.name, o.total
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;
-- All combinations: O1,O2,O3 + U4(NULL) + O4(NULL)

-- CROSS JOIN: cartesian product (every combination)
SELECT u.name, p.name
FROM users u
CROSS JOIN products p;
-- 100 users × 1000 products = 100,000 rows!
-- Rarely intended, often accidental (missing ON clause in implicit join)

-- SELF JOIN: table joined with itself
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
-- Finding hierarchy within same table

-- ANTI-JOIN pattern (rows in A but NOT in B):
-- Method 1: LEFT JOIN + NULL check
SELECT u.* FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;              -- users with NO orders

-- Method 2: NOT EXISTS (often better performance)
SELECT u.* FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- Method 3: NOT IN (careful with NULLs!)
SELECT * FROM users
WHERE id NOT IN (SELECT user_id FROM orders WHERE user_id IS NOT NULL);
-- NOT IN with NULL in subquery → returns NO ROWS! (NULL poison)
-- Safer: use NOT EXISTS
```

## 3.2 JOIN Algorithms

```
DATABASE has 3 join algorithms, chooses based on cost estimate:

1. NESTED LOOP JOIN:
   For each row in outer table → scan inner table for matches
   
   FOR each row r1 in R:          (outer relation)
       FOR each row r2 in S:      (inner relation)
           IF r1.key == r2.key:
               output (r1, r2)
   
   Cost: O(R × S) — SLOW for large tables without index!
   GOOD when: inner table has index on join key (index nested loop)
   GOOD when: outer table is very small (a few rows)
   
   With index: FOR each row r1 in R → index scan on S.key = r1.key
   Cost: O(R × log S) — much better!

2. HASH JOIN:
   Build phase: create hash table from smaller relation
   Probe phase: scan larger relation, probe hash table
   
   FOR each row r in R (smaller):
       hash_table[hash(r.key)] = r
   FOR each row s in S (larger):
       match = hash_table.get(s.key)
       IF match: output (s, match)
   
   Cost: O(R + S) — LINEAR! Excellent for large tables
   Requires: equality condition (=) only, no ranges
   Memory: hash table must fit in memory (if not → partitioned hash join, spills to disk)
   GOOD when: both tables large, no useful index

3. MERGE JOIN (Sort-Merge Join):
   Sort both relations on join key
   Then merge like mergesort's merge step
   
   SORT R by key
   SORT S by key
   merge(sorted_R, sorted_S)
   
   Cost: O(R log R + S log S) — if not already sorted
   Cost: O(R + S) — if already sorted (index scan!)
   GOOD when: both inputs already sorted (from index), large range joins
   GOOD when: join condition is inequality (<, >)

QUERY PLANNER CHOOSES BASED ON:
  Table statistics (pg_stats / information_schema.statistics)
  Estimated row counts
  Available indexes
  Available memory (work_mem)
  Enable/disable hints:
    SET enable_hashjoin = off;
    SET enable_nestloop = off;
    SET enable_mergejoin = off;
```

## 3.3 JOIN Optimization

```sql
-- ── ALWAYS JOIN ON INDEXED COLUMNS ──
-- Bad: joining on non-indexed columns
SELECT o.*, u.name
FROM orders o
JOIN users u ON u.email = o.billing_email;  -- email not indexed → seq scan each join!

-- Good: join on primary/foreign keys (almost always indexed)
SELECT o.*, u.name
FROM orders o
JOIN users u ON u.id = o.user_id;  -- id is PK → index!

-- ── FILTER EARLY (reduce rows before JOIN) ──
-- Bad: join everything then filter
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.created_at > '2025-01-01'
AND u.country = 'VN';

-- Good (usually same — query planner usually optimizes):
-- But explicit subquery can force early filtering:
SELECT u.name, o.total
FROM (SELECT * FROM users WHERE country = 'VN') u
JOIN (SELECT * FROM orders WHERE created_at > '2025-01-01') o
  ON u.id = o.user_id;

-- ── AVOID FUNCTIONS ON JOIN COLUMNS ──
-- Bad: function prevents index use
JOIN users u ON LOWER(u.email) = LOWER(o.email)
-- Forces seq scan (no index on LOWER(email) normally)

-- Good: normalize data before storing, or create functional index
JOIN users u ON u.email = o.email  -- store emails already lowercased!

-- ── LIMIT COLUMNS IN SELECT ──
-- Bad: SELECT * → fetches all columns (more I/O, network)
SELECT * FROM orders o JOIN users u ON u.id = o.user_id;

-- Good: only needed columns
SELECT o.id, o.total, o.status, u.name, u.email
FROM orders o JOIN users u ON u.id = o.user_id;

-- ── PROPER NULL HANDLING ──
-- INNER JOIN vs WHERE: functionally same but planner hints
SELECT * FROM orders o
JOIN users u ON u.id = o.user_id AND u.active = true;
-- vs
SELECT * FROM orders o
JOIN users u ON u.id = o.user_id
WHERE u.active = true;
-- INNER JOIN: second form usually same performance
-- LEFT JOIN: DIFFERENT! ON clause filter applied before join, WHERE after
```

---

# 4. Execution Plan — EXPLAIN ANALYZE

## 4.1 Reading EXPLAIN Output

```sql
-- ── BASIC EXPLAIN ──
EXPLAIN SELECT * FROM orders WHERE user_id = 5;
-- Shows: query plan WITHOUT executing
-- Shows: estimated costs, row counts, plan nodes

-- ── EXPLAIN ANALYZE (actually runs query!) ──
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.id, o.total, u.name
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'PENDING'
AND o.created_at > '2025-01-01'
ORDER BY o.created_at DESC
LIMIT 20;
```

```
OUTPUT EXAMPLE:
Limit  (cost=892.14..892.19 rows=20 width=48)
       (actual time=12.453..12.467 rows=20 loops=1)
  Buffers: shared hit=45 read=8
  ->  Sort  (cost=892.14..893.14 rows=400 width=48)
            (actual time=12.445..12.452 rows=20 loops=1)
        Sort Key: o.created_at DESC
        Sort Method: top-N heapsort  Memory: 27kB
        ->  Hash Join  (cost=24.50..876.14 rows=400 width=48)
                       (actual time=0.832..12.120 rows=412 loops=1)
              Hash Cond: (o.user_id = u.id)
              Buffers: shared hit=45 read=8
              ->  Index Scan using idx_orders_status_created
                  on orders o  (cost=0.43..850.14 rows=400 width=32)
                               (actual time=0.041..11.234 rows=412 loops=1)
                    Index Cond: ((status = 'PENDING')
                                 AND (created_at > '2025-01-01'))
                    Buffers: shared hit=8 read=8
              ->  Hash  (cost=14.00..14.00 rows=840 width=20)
                        (actual time=0.772..0.772 rows=840 loops=1)
                    Buckets: 1024  Batches: 1  Memory Usage: 51kB
                    Buffers: shared hit=37
                    ->  Seq Scan on users u
                        (cost=0.00..14.00 rows=840 width=20)
                        (actual time=0.008..0.411 rows=840 loops=1)
                        Buffers: shared hit=37
Planning Time: 0.892 ms
Execution Time: 12.534 ms

HOW TO READ:
  cost=startCost..totalCost   (in "cost units", relative)
  rows=estimatedRows          (planner's estimate)
  actual time=start..end ms   (real execution time)
  actual rows=N               (real row count)
  loops=N                     (how many times this node executed)

  TOTAL TIME = actual time × loops (important for nested loops!)

KEY NODES TO RECOGNIZE:
  Seq Scan:       full table scan (often BAD for large tables)
  Index Scan:     uses B-tree index, fetches rows from heap
  Index Only Scan: covering index, no heap access! (BEST)
  Bitmap Scan:    collect matching pages then fetch (good for 1-10% rows)
  Nested Loop:    outer loop × inner loop
  Hash Join:      build hash table then probe
  Merge Join:     sort both sides then merge
  Sort:           explicit sort (look for: Sort Method: external merge → spilling to disk!)
  Aggregate:      GROUP BY, COUNT, SUM
  HashAggregate:  GROUP BY using hash (in memory)
  Gather/Parallel: parallel query execution

RED FLAGS:
  Seq Scan on large table (rows >> 10000)
  estimated rows ≠ actual rows (bad statistics → ANALYZE table)
  Sort Method: external merge (sort spilling to disk → increase work_mem)
  Nested Loop with large outer × inner
  Buffers: read >> hit (lots of disk I/O vs cache hits)
```

## 4.2 Fixing Bad Plans

```sql
-- ── BAD ESTIMATES (outdated statistics) ──
-- estimated rows=10, actual rows=500000 → planner made wrong choice

-- Fix: update statistics
ANALYZE orders;           -- update stats for table
ANALYZE;                  -- all tables
VACUUM ANALYZE orders;    -- clean dead tuples + update stats

-- Increase statistics target for skewed distribution:
ALTER TABLE orders ALTER COLUMN status
    SET STATISTICS 500;  -- default 100, more samples = better estimates
ANALYZE orders;

-- ── FORCING INDEX USAGE ──
-- Planner chose seq scan even though index exists?
-- Reason: estimated it's cheaper (often correct!), or stats are stale

-- Check: is planner estimate correct?
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'CANCELLED';
-- If actual rows << estimated → planner overestimated → should use index
-- Fix: ANALYZE table first

-- Temporarily force index (for testing, not production!):
SET enable_seqscan = off;
EXPLAIN ANALYZE SELECT ...;
SET enable_seqscan = on;

-- ── WORK_MEM (memory for sort + hash) ──
-- Sort spilling to disk? Increase work_mem:
SET work_mem = '256MB';  -- for current session
EXPLAIN ANALYZE SELECT ...;  -- see if sort method changes
-- Sort Method: quicksort Memory: 128kB  ← good (in memory)
-- Sort Method: external merge  ← BAD (spilling to disk!)

-- Global setting (per sort/hash operation per query!):
-- postgresql.conf: work_mem = 64MB  -- careful: N queries × M sorts each!

-- ── PARALLEL QUERY ──
-- Check if parallel being used:
-- Gather or Gather Merge node = parallel!
-- If not parallel for expensive query:
SET max_parallel_workers_per_gather = 4;
EXPLAIN ANALYZE SELECT COUNT(*) FROM large_table;

-- ── pg_stat_statements (track slow queries!) ──
CREATE EXTENSION pg_stat_statements;
-- Find slowest queries:
SELECT query,
       calls,
       ROUND(total_exec_time::NUMERIC / calls, 2) AS avg_ms,
       ROUND(total_exec_time::NUMERIC, 2) AS total_ms,
       rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
-- This is THE most important tool for production query tuning!

-- ── MySQL EXPLAIN ──
EXPLAIN FORMAT=JSON
SELECT * FROM orders WHERE user_id = 5 AND status = 'PENDING';
-- key: which index used
-- key_len: how many bytes of index used (longer = more columns of composite index used)
-- rows: estimated rows to examine
-- Extra: "Using index" = covering index (good!), "Using filesort" = needs sort (maybe bad)

-- MySQL EXPLAIN ANALYZE (MySQL 8.0.18+):
EXPLAIN ANALYZE SELECT ...;
```

---

# 5. N+1 Problem

## 5.1 N+1 Explained

```
N+1 PROBLEM: fetch list of N items, then execute 1 query per item
  Result: 1 + N queries instead of 1 or 2!
  N=1000 items → 1001 queries → very slow!

EXAMPLE: get users and their order counts
  QUERY 1: SELECT * FROM users  → N users
  Then for EACH user:
    QUERY 2: SELECT COUNT(*) FROM orders WHERE user_id = 1
    QUERY 3: SELECT COUNT(*) FROM orders WHERE user_id = 2
    QUERY 4: SELECT COUNT(*) FROM orders WHERE user_id = 3
    ...
    QUERY N+1: SELECT COUNT(*) FROM orders WHERE user_id = N
  
  Each query fast (1ms) but 1000 queries = 1 second!
  vs single query = 5ms

LATENCY MATH:
  DB roundtrip ≈ 1ms (local), 5ms (cloud)
  1000 users:
    N+1 approach: 1000 × 1ms = 1 second!
    JOIN approach: ~5ms
    Difference: 200x!
```

## 5.2 N+1 in JPA/Hibernate

```java
// ── LAZY LOADING N+1 ──
// User has List<Order> with FETCH = LAZY (default for @OneToMany)

@Entity
class User {
    @Id Long id;
    String name;
    
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    List<Order> orders;  // LAZY: orders NOT loaded initially
}

// Service code that causes N+1:
List<User> users = userRepository.findAll();  // Query 1: SELECT * FROM users

for (User user : users) {
    System.out.println(user.getOrders().size());
    // EACH access to orders triggers:
    // SELECT * FROM orders WHERE user_id = ? (Query 2, 3, 4, ... N+1!)
}

// This looks innocent! But generates 1+N queries!

// ── DETECTING N+1 ──
// Enable SQL logging:
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.type.descriptor.sql=TRACE

// Or Hibernate statistics:
spring.jpa.properties.hibernate.generate_statistics=true
// Then check logs for: "Statements executed: 1001"

// ── P6SPY or datasource-proxy (better detection) ──
// Count queries per request, alert if > threshold
// datasource-proxy in Spring Boot:
@Configuration
public class DataSourceConfig {
    @Bean
    DataSource dataSource(DataSourceProperties properties) {
        DataSource original = properties.initializeDataSourceBuilder().build();
        
        return ProxyDataSourceBuilder.create(original)
            .name("DS-Proxy")
            .countQuery()
            .logQueryBySlf4j(SLF4JLogLevel.DEBUG)
            .multiline()
            .build();
    }
}
```

## 5.3 N+1 Solutions

```java
// ── SOLUTION 1: @EntityGraph (fetch join) ──
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // JPQL JOIN FETCH:
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders WHERE u.active = true")
    List<User> findActiveUsersWithOrders();
    // SQL: SELECT u.*, o.* FROM users u LEFT JOIN orders o ON o.user_id = u.id
    // Only 1 query! (DISTINCT prevents duplicate User objects for multi-order users)
    
    // @EntityGraph (cleaner syntax):
    @EntityGraph(attributePaths = {"orders", "orders.items"})
    List<User> findAll();
    // Hibernate generates LEFT JOIN FETCH automatically
    
    @EntityGraph(value = "User.withOrdersAndProfile", type = EntityGraph.EntityGraphType.FETCH)
    List<User> findByActive(boolean active);
}

// Named entity graph on entity:
@Entity
@NamedEntityGraph(
    name = "User.withOrdersAndProfile",
    attributeNodes = {
        @NamedAttributeNode("orders"),
        @NamedAttributeNode(value = "orders", subgraph = "order-items")
    },
    subgraphs = {
        @NamedSubgraph(name = "order-items",
            attributeNodes = @NamedAttributeNode("items"))
    }
)
class User { ... }

// ── SOLUTION 2: @BatchSize (lazy loading in batches) ──
@Entity
class User {
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @BatchSize(size = 100)
    List<Order> orders;
}
// Instead of N individual queries:
// SELECT * FROM orders WHERE user_id = 1
// SELECT * FROM orders WHERE user_id = 2
// ...
// Gets batched into:
// SELECT * FROM orders WHERE user_id IN (1, 2, 3, ..., 100)  ← 1 query for 100!
// Much better! (but still not 1 query)

// Global batch size in config:
// spring.jpa.properties.hibernate.default_batch_fetch_size=100

// ── SOLUTION 3: Projection DTO (best for read-only queries) ──
// Instead of loading full entity with all relations:
public record UserOrderCountDTO(Long userId, String name, Long orderCount) {}

@Query("""
    SELECT new com.example.dto.UserOrderCountDTO(
        u.id, u.name, COUNT(o.id))
    FROM User u
    LEFT JOIN u.orders o
    WHERE u.active = true
    GROUP BY u.id, u.name
""")
List<UserOrderCountDTO> findUserOrderCounts();
// Single JOIN query, no extra lazy loading, only needed data!

// ── SOLUTION 4: Native SQL (when JPQL is too complex) ──
@Query(value = """
    SELECT u.id, u.name, u.email,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.total), 0) as total_spent
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
      AND o.status != 'CANCELLED'
    WHERE u.active = true
    GROUP BY u.id, u.name, u.email
    ORDER BY total_spent DESC
    LIMIT :limit OFFSET :offset
""", nativeQuery = true)
List<Object[]> findTopCustomers(@Param("limit") int limit, @Param("offset") int offset);

// ── SOLUTION 5: Separate queries + programmatic JOIN ──
// Sometimes 2 queries + code is cleaner than complex JOIN
List<User> users = userRepository.findActiveUsers();
List<Long> userIds = users.stream().map(User::getId).collect(toList());

// One batch query for all orders:
Map<Long, List<Order>> ordersByUserId = orderRepository
    .findByUserIdIn(userIds)
    .stream()
    .collect(groupingBy(Order::getUserId));

// Set on users:
users.forEach(u -> u.setOrders(ordersByUserId.getOrDefault(u.getId(), List.of())));
// 2 queries total, no N+1!
```

---

# 6. Query Optimization Techniques

## 6.1 Common Patterns

```sql
-- ── AVOID SELECT * ──
-- Bad: fetches all columns (more I/O, network, memory)
SELECT * FROM orders WHERE user_id = 5;

-- Good: only needed columns (smaller rows = more rows per page = fewer I/Os)
SELECT id, status, total, created_at FROM orders WHERE user_id = 5;

-- ── PAGINATION PERFORMANCE ──
-- Bad: OFFSET gets worse as offset increases!
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 10000;
-- PROBLEM: DB must read 10020 rows, throw away 10000, return 20!
-- At OFFSET 1000000: reads 1000020 rows!

-- Good: Keyset pagination (cursor-based)
-- First page:
SELECT * FROM orders ORDER BY id LIMIT 20;
-- Next page (use last id from previous):
SELECT * FROM orders WHERE id > :lastId ORDER BY id LIMIT 20;
-- Always O(log n + limit), regardless of page number!
-- Requires: unique, sequential sort column (id, created_at+id)

-- For complex sorting (non-sequential):
-- Encode cursor: "created_at=2025-05-01,id=12345"
SELECT * FROM orders
WHERE (created_at, id) < (:cursorDate, :cursorId)
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- ── AVOID FUNCTIONS ON INDEXED COLUMNS IN WHERE ──
-- BAD: function call prevents index usage
WHERE YEAR(created_at) = 2025            -- MySQL
WHERE DATE_TRUNC('year', created_at) = '2025-01-01'  -- PostgreSQL
WHERE LOWER(email) = 'user@example.com'
WHERE TO_CHAR(amount, '999.99') = '100.00'

-- GOOD: rewrite to allow index
WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'
WHERE email = LOWER('User@Example.com')  -- function on VALUE not column!
WHERE amount = 100.00

-- ── IMPLICIT TYPE CONVERSION (silently kills index) ──
-- Table: user_id VARCHAR, but comparing to INT:
WHERE user_id = 12345   -- implicit cast on column → index not used!
WHERE user_id = '12345' -- explicit string → index used!

-- Date vs timestamp:
WHERE created_at = '2025-05-01'  -- may cast timestamp → date → index not used!
WHERE created_at >= '2025-05-01' AND created_at < '2025-05-02'  -- explicit range!

-- ── WILDCARD SEARCH ──
WHERE name LIKE 'Khang%'    -- leading match → B-tree index WORKS!
WHERE name LIKE '%Khang%'   -- leading wildcard → B-tree NOT useful
WHERE name LIKE '%Khang'    -- leading wildcard → NOT useful

-- Fix for contains search:
-- Option 1: pg_trgm trigram index (PostgreSQL)
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_name_trgm ON users USING GIN(name gin_trgm_ops);
WHERE name LIKE '%Khang%'   -- now uses trigram index!
WHERE name ILIKE '%khang%'  -- case-insensitive, also uses index!

-- Option 2: Full-text search
WHERE to_tsvector('english', name) @@ to_tsquery('english', 'khang')

-- ── EXISTS vs IN ──
-- IN with subquery: subquery runs first, loads all IDs into memory
SELECT * FROM orders
WHERE user_id IN (SELECT id FROM users WHERE country = 'VN');
-- If subquery returns 1M rows → 1M row set in memory!

-- EXISTS: stops at first match, no full load
SELECT * FROM orders o
WHERE EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = o.user_id AND u.country = 'VN'
);
-- Correlated: checks condition per row, but short-circuits!
-- Generally faster when subquery result is large
-- Modern optimizers often convert IN to EXISTS automatically

-- ── CTE vs SUBQUERY ──
-- PostgreSQL: CTE used to be "optimization fence" (prevented push-down)
-- PostgreSQL 12+: CTEs can be inlined (same as subquery)
-- WITH MATERIALIZED forces materialization (old behavior)
-- WITH NOT MATERIALIZED allows inlining

-- CTE for readability (PostgreSQL 12+, same performance as subquery):
WITH recent_orders AS (
    SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '30 days'
)
SELECT u.name, COUNT(o.id), SUM(o.total)
FROM users u
JOIN recent_orders o ON u.id = o.user_id
GROUP BY u.id, u.name;

-- ── UPSERT (Insert or Update) ──
-- PostgreSQL:
INSERT INTO user_preferences (user_id, key, value)
VALUES (1, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- MySQL:
INSERT INTO user_preferences (user_id, key, value)
VALUES (1, 'theme', 'dark')
ON DUPLICATE KEY UPDATE
    value = VALUES(value), updated_at = NOW();
```

## 6.2 Bulk Operations

```sql
-- ── BULK INSERT (much faster than individual inserts!) ──
-- Bad: N individual inserts
INSERT INTO products (name, price) VALUES ('A', 10);
INSERT INTO products (name, price) VALUES ('B', 20);
-- N=10000: 10000 round trips + 10000 transaction commits!

-- Good: single bulk insert
INSERT INTO products (name, price) VALUES
    ('A', 10), ('B', 20), ('C', 30), ...;  -- all in one statement!
-- 1 round trip, 1 transaction commit!

-- PostgreSQL COPY (fastest bulk load):
COPY products (name, price, category) FROM '/tmp/products.csv' CSV HEADER;
-- Or from stdin (in application):
COPY products (name, price) FROM STDIN CSV;

-- ── BULK UPDATE ──
-- Bad: N individual updates
UPDATE orders SET status = 'SHIPPED' WHERE id = 1;
UPDATE orders SET status = 'SHIPPED' WHERE id = 2;
-- ...

-- Good: single WHERE IN update
UPDATE orders SET status = 'SHIPPED'
WHERE id IN (1, 2, 3, 4, 5, ..., 1000);

-- Best: UPDATE FROM (PostgreSQL) with temporary table/CTE
WITH updates AS (
    SELECT * FROM (VALUES
        (1::bigint, 'SHIPPED'::text),
        (2, 'SHIPPED'),
        (3, 'CANCELLED')
    ) AS t(id, status)
)
UPDATE orders o
SET status = u.status, updated_at = NOW()
FROM updates u
WHERE o.id = u.id;

-- ── BATCH DELETE ──
-- Bad: DELETE all at once (locks table, long transaction)
DELETE FROM events WHERE created_at < '2024-01-01';
-- Deletes 10M rows in one go → huge transaction, table locked

-- Good: delete in batches
DO $$
DECLARE
    deleted INT;
BEGIN
    LOOP
        DELETE FROM events
        WHERE id IN (
            SELECT id FROM events
            WHERE created_at < '2024-01-01'
            LIMIT 10000
        );
        GET DIAGNOSTICS deleted = ROW_COUNT;
        EXIT WHEN deleted = 0;
        PERFORM pg_sleep(0.1);  -- small pause between batches
    END LOOP;
END $$;
```

---

# 7. Aggregation & Window Functions

## 7.1 Aggregation Optimization

```sql
-- ── PARTIAL AGGREGATION ──
-- COUNT(*) on all rows? Index-only scan might help:
CREATE INDEX idx_orders_status ON orders(status) INCLUDE (id);
SELECT COUNT(*) FROM orders WHERE status = 'PENDING';
-- Might use index-only scan! (no heap access needed)

-- ── APPROXIMATE COUNT ──
-- COUNT(*) on billion-row table = slow (full scan or index scan)
-- For rough estimates: use statistics
SELECT reltuples::bigint AS estimated_count
FROM pg_class WHERE relname = 'orders';
-- Very fast! But approximate.

-- ── GROUP BY OPTIMIZATION ──
-- Index on GROUP BY column helps:
CREATE INDEX idx_orders_user ON orders(user_id);
SELECT user_id, COUNT(*), SUM(total)
FROM orders
GROUP BY user_id;
-- Index scan → group by user_id in index order → no sort needed!

-- Add HAVING AFTER grouping (filter aggregate results):
SELECT user_id, COUNT(*) as order_count
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 10;  -- only users with > 10 orders
-- Note: HAVING is applied AFTER grouping (can't use WHERE here for aggregate!)

-- ── ROLLUP / CUBE for multiple grouping levels ──
-- Monthly revenue + total per year + grand total:
SELECT
    EXTRACT(YEAR FROM created_at) AS year,
    EXTRACT(MONTH FROM created_at) AS month,
    SUM(total) AS revenue
FROM orders
GROUP BY ROLLUP(
    EXTRACT(YEAR FROM created_at),
    EXTRACT(MONTH FROM created_at)
)
ORDER BY year NULLS LAST, month NULLS LAST;
-- year=2024, month=1: January revenue
-- year=2024, month=NULL: Annual total for 2024
-- year=NULL, month=NULL: Grand total

-- ── FILTER (conditional aggregation) ──
-- Count by status in single query:
SELECT
    COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
    COUNT(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed,
    COUNT(*) FILTER (WHERE status = 'SHIPPED') AS shipped,
    COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
    SUM(total) FILTER (WHERE status = 'DELIVERED') AS delivered_revenue
FROM orders
WHERE created_at > '2025-01-01';
-- ONE scan vs multiple COUNT queries!
```

## 7.2 Window Functions

```sql
-- WINDOW FUNCTIONS: aggregate without collapsing rows
-- Like GROUP BY but keeps original rows!

-- ── RUNNING TOTAL ──
SELECT
    order_id,
    user_id,
    total,
    SUM(total) OVER (
        PARTITION BY user_id          -- per user
        ORDER BY created_at           -- running total by date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM orders;

-- ── RANK / DENSE_RANK ──
SELECT
    user_id,
    total,
    RANK() OVER (ORDER BY total DESC) AS rank,
    -- RANK: 1,1,3 (gaps for ties)
    DENSE_RANK() OVER (ORDER BY total DESC) AS dense_rank,
    -- DENSE_RANK: 1,1,2 (no gaps)
    ROW_NUMBER() OVER (ORDER BY total DESC, id) AS row_num
    -- ROW_NUMBER: unique (tiebreaker by id)
FROM orders;

-- ── TOP N PER GROUP (classic interview problem) ──
-- Top 3 orders per user:
SELECT * FROM (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY user_id    -- restart numbering per user
               ORDER BY total DESC     -- highest total first
           ) AS rn
    FROM orders
) ranked
WHERE rn <= 3;  -- only top 3 per user

-- ── LAG / LEAD (previous/next row) ──
SELECT
    created_at,
    total,
    LAG(total, 1) OVER (ORDER BY created_at) AS prev_order_total,
    total - LAG(total, 1) OVER (ORDER BY created_at) AS change_from_prev,
    LEAD(total, 1) OVER (ORDER BY created_at) AS next_order_total
FROM orders
WHERE user_id = 5;

-- ── PERCENTILE ──
SELECT
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total) AS median,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total) AS p95,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total) AS p99
FROM orders;

-- ── WINDOW FRAME ──
-- 7-day moving average:
SELECT
    date,
    daily_revenue,
    AVG(daily_revenue) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW  -- last 7 days including today
    ) AS moving_avg_7d
FROM daily_revenue_view;
```

---

# 8. Transactions & Locking

## 8.1 Isolation Levels

```sql
-- ISOLATION LEVELS (weakest to strongest):

-- READ UNCOMMITTED (rarely used):
-- Can read dirty data (uncommitted changes from other transactions)
-- Fastest but dangerous — can read rolled-back data!

-- READ COMMITTED (PostgreSQL default):
-- Only reads committed data
-- Phantom reads possible (new rows appear between reads in same transaction)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- REPEATABLE READ (MySQL InnoDB default):
-- Same rows return same data throughout transaction
-- Prevents dirty + non-repeatable reads
-- Phantom reads still possible in theory (InnoDB uses gap locks to prevent)
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- SERIALIZABLE (strongest):
-- Fully isolated, as if transactions ran sequentially
-- Prevents all anomalies but slowest
-- PostgreSQL uses SSI (Serializable Snapshot Isolation) — efficient!
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- ── LOCKING ──

-- Optimistic locking (no DB locks, check version):
-- @Version in JPA — UPDATE WHERE id=? AND version=?
-- Returns 0 rows if version changed → OptimisticLockException → retry

-- Pessimistic locking (acquire lock immediately):
-- FOR UPDATE: exclusive row lock
SELECT * FROM orders WHERE id = 1 FOR UPDATE;
-- Others: SELECT FOR UPDATE → WAIT (or SKIP LOCKED below)

-- FOR UPDATE NOWAIT: fail immediately if locked
SELECT * FROM orders WHERE id = 1 FOR UPDATE NOWAIT;
-- Error: could not obtain lock on row

-- FOR SKIP LOCKED: skip locked rows (for job queues!)
SELECT * FROM job_queue
WHERE status = 'PENDING'
ORDER BY priority DESC, id
LIMIT 10
FOR UPDATE SKIP LOCKED;
-- Each worker gets different rows! No blocking, no duplicate processing!

-- ── DEADLOCK PREVENTION ──
-- Always lock rows in same order (by id ASC)
-- Keep transactions short
-- Use NOWAIT and retry if needed
```

---

# 9. Schema Design for Performance

## 9.1 Normalization vs Denormalization

```sql
-- ── NORMALIZED (3NF) ──
-- Pros: no redundancy, consistent updates
-- Cons: needs JOINs for most queries

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- To get user's name with order → need JOIN

-- ── DENORMALIZED (for read performance) ──
-- Pros: no JOINs, faster reads
-- Cons: redundant data, update anomalies

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(100) NOT NULL,    -- denormalized!
    user_email VARCHAR(255) NOT NULL,   -- denormalized!
    status VARCHAR(20) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Get order without JOIN → fast!
-- But: user changes name → all orders still show old name

-- ── PARTITIONING (very large tables) ──
-- Range partition by date (time series data):
CREATE TABLE orders (
    id BIGSERIAL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    total NUMERIC(12,2)
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Query planner automatically prunes irrelevant partitions:
SELECT * FROM orders WHERE created_at BETWEEN '2025-01-01' AND '2025-03-31';
-- Only scans orders_2025! (partition pruning)

-- ── DATA TYPES MATTER ──
-- Integer vs VARCHAR for IDs:
user_id BIGINT (8 bytes) vs user_id VARCHAR(36) (36 bytes for UUID as string)
-- BIGINT: faster comparison, smaller index, better cache utilization
-- UUID as binary: uuid type (16 bytes) → better than varchar UUID

-- Timestamps:
created_at TIMESTAMPTZ  -- with timezone (use this in PostgreSQL!)
created_at TIMESTAMP    -- without timezone (avoid unless deliberate)

-- JSONB vs JSON (PostgreSQL):
metadata JSONB  -- binary storage, indexable, slightly more write overhead
metadata JSON   -- text storage, preserved formatting, no indexing
-- Almost always use JSONB!
```

---

# 10. PostgreSQL vs MySQL Specifics

## 10.1 Key Differences

```sql
-- ── POSTGRESQL SPECIFICS ──

-- VACUUM (critical for performance!):
-- Dead tuples from MVCC accumulate → bloat → slow queries
VACUUM orders;               -- clean dead tuples (no lock)
VACUUM ANALYZE orders;       -- clean + update statistics
VACUUM FULL orders;          -- reclaim disk space (locks table!)
-- Auto-vacuum: PostgreSQL runs automatically in background
-- Monitor: SELECT * FROM pg_stat_user_tables (n_dead_tup column)

-- JSONB queries:
SELECT * FROM events WHERE payload->>'type' = 'CLICK';           -- string value
SELECT * FROM events WHERE (payload->>'amount')::numeric > 100;  -- numeric
SELECT * FROM events WHERE payload @> '{"status": "active"}';    -- contains
SELECT * FROM events WHERE payload ? 'user_id';                  -- key exists
SELECT id, payload->'user'->>'name' AS user_name FROM events;    -- nested

-- ARRAY type:
SELECT * FROM products WHERE 'electronics' = ANY(tags);
SELECT * FROM products WHERE tags @> ARRAY['sale', 'featured'];
SELECT *, array_length(tags, 1) AS tag_count FROM products;

-- CTEs (PostgreSQL 12+: inline by default):
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 0 AS depth
    FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id, ct.depth + 1
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY depth, name;

-- ── MYSQL/MARIADB SPECIFICS ──

-- MySQL doesn't have FULL OUTER JOIN:
-- Emulate with UNION:
SELECT u.*, o.*
FROM users u LEFT JOIN orders o ON u.id = o.user_id
UNION ALL
SELECT u.*, o.*
FROM users u RIGHT JOIN orders o ON u.id = o.user_id
WHERE u.id IS NULL;

-- MySQL JSON (5.7+):
SELECT * FROM events WHERE JSON_EXTRACT(payload, '$.type') = 'CLICK';
-- Or JSON path operator (MySQL 5.7.9+):
SELECT * FROM events WHERE payload->>'$.type' = 'CLICK';

-- MySQL INDEX HINTS:
SELECT * FROM orders USE INDEX (idx_orders_status) WHERE status = 'PENDING';
SELECT * FROM orders IGNORE INDEX (idx_orders_created) WHERE created_at > '2025-01-01';
SELECT * FROM orders FORCE INDEX (idx_orders_user) WHERE user_id = 5;

-- MySQL EXPLAIN FORMAT:
EXPLAIN FORMAT=JSON SELECT ...;
EXPLAIN FORMAT=TREE SELECT ...;   -- MySQL 8.0.16+, shows tree structure
-- key_len: how many bytes of composite index used
-- Extra: "Using index" (covering), "Using filesort", "Using temporary"
```

## 10.2 Index Hints & Query Hints

```sql
-- ── POSTGRESQL PLANNER HINTS (pg_hint_plan extension) ──
-- PostgreSQL doesn't have native hints (unlike Oracle, MySQL)
-- Use pg_hint_plan extension if needed:
/*+ SeqScan(orders) */
SELECT * FROM orders WHERE status = 'PENDING';

/*+ HashJoin(orders users) IndexScan(orders idx_orders_status) */
SELECT * FROM orders JOIN users ON orders.user_id = users.id;

-- ── IMPORTANT SETTINGS ──

-- PostgreSQL:
-- Max memory for single sort/hash (per operation!):
SET work_mem = '256MB';

-- Enable parallel query:
SET max_parallel_workers_per_gather = 4;

-- Statistics target (more detail for better estimates):
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 500;

-- MySQL:
-- Optimizer switch:
SET optimizer_switch = 'index_merge=on,index_merge_union=on';

-- Buffer pool (InnoDB cache, most important setting):
-- innodb_buffer_pool_size = 70-80% of available RAM
-- my.cnf: innodb_buffer_pool_size = 8G

-- Query cache (MySQL 5.7 and below, removed in 8.0):
-- query_cache_type = 0  (disable — causes more problems than it solves!)
```

---

## 📎 SQL Optimization Quick Reference

```
INDEX STRATEGY:
  B-Tree:   default, equality + range, ORDER BY, LIKE 'prefix%'
  Hash:     equality only, large text columns
  GIN:      arrays, JSONB, full-text search
  GIST:     geometric, range types
  BRIN:     very large, naturally ordered (time series)

COMPOSITE INDEX ORDER:
  1. Equality columns (=) first
  2. Range columns (<, >, BETWEEN) last
  3. Most selective (most unique values) first

QUERY OPTIMIZATION:
  EXPLAIN ANALYZE: always read before tuning
  pg_stat_statements: find slowest queries in production
  ANALYZE table: update statistics when estimates are wrong
  work_mem: increase for sort/hash spilling to disk

N+1 PREVENTION:
  JPA: @EntityGraph, JOIN FETCH, @BatchSize(100)
  Raw SQL: single query with LEFT JOIN
  Application: 2-query approach (load IDs, then IN query)
  Detect: datasource-proxy, count queries per request

PAGINATION:
  Offset: slow for large offsets (reads all skipped rows)
  Keyset: WHERE id > :lastId → O(log n) always!

JOINS:
  Nested Loop: small outer + indexed inner
  Hash Join: large tables without index
  Merge Join: pre-sorted inputs
  Always join on indexed/PK columns

COMMON PITFALLS:
  SELECT *: use only needed columns
  Function on column in WHERE: prevents index → rewrite!
  LIKE '%prefix': no index → use trigram or full-text
  Implicit type conversion: explicit cast on VALUE not column
  N+1: lazy load in loops → use JOIN FETCH or batch

TOOLS:
  EXPLAIN ANALYZE BUFFERS: full execution details
  pg_stat_statements: aggregate slow query stats
  auto_explain: log plans for slow queries automatically
  pgBadger: analyze PostgreSQL log files
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| PostgreSQL EXPLAIN | <https://www.postgresql.org/docs/current/using-explain.html> |
| PostgreSQL Indexes | <https://www.postgresql.org/docs/current/indexes.html> |
| PostgreSQL Window Functions | <https://www.postgresql.org/docs/current/tutorial-window.html> |
| pg_stat_statements | <https://www.postgresql.org/docs/current/pgstatstatements.html> |
| MySQL EXPLAIN | <https://dev.mysql.com/doc/refman/8.0/en/using-explain.html> |
| MySQL Index Types | <https://dev.mysql.com/doc/refman/8.0/en/innodb-indexes.html> |
| Use The Index, Luke! | <https://use-the-index-luke.com/> |
| PostgreSQL Performance | <https://wiki.postgresql.org/wiki/Performance_Optimization> |
