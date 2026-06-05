# 🗄️ Database Complete Deep Dive
>
> SQL, Partitioning, Sharding, Replication, NoSQL, Query Optimization, Redis

> 📖 PostgreSQL Docs: <https://www.postgresql.org/docs/current/>
> 📖 MySQL Docs: <https://dev.mysql.com/doc/refman/8.0/en/>
> 📖 Redis Docs: <https://redis.io/docs/>

---

## 📚 Table of Contents

1. [Relational Database Fundamentals](#1-relational-database-fundamentals)
2. [SQL Deep Dive](#2-sql-deep-dive)
3. [Indexes — The Most Important Optimization](#3-indexes--the-most-important-optimization)
4. [Transactions & ACID](#4-transactions--acid)
5. [Query Optimization](#5-query-optimization)
6. [Partitioning](#6-partitioning)
7. [Replication](#7-replication)
8. [Sharding](#8-sharding)
9. [NoSQL Databases](#9-nosql-databases)
10. [Redis — In-Memory Data Store](#10-redis--in-memory-data-store)
11. [CAP Theorem & Distributed Systems](#11-cap-theorem--distributed-systems)
12. [Database Design Best Practices](#12-database-design-best-practices)

---

# 1. Relational Database Fundamentals

## 1.1 Cách Database lưu dữ liệu trên disk

```
Database
└── Tablespace (logical storage unit)
    └── Data Files (.dbf, .mdf...)
        └── Pages/Blocks (8KB default in PostgreSQL)
            └── Rows (tuples)

┌──────────────────────────────────────────────────────────┐
│                    Page (8KB)                            │
│  ┌──────────┐  ┌────────────────────────────────────┐   │
│  │ Page     │  │           Rows                     │   │
│  │ Header   │  │  [row1][row2][row3]...[rowN]        │   │
│  │ (metadata│  │                                    │   │
│  │ checksum │  │                                    │   │
│  │ lsn...)  │  │  [item pointers → row offsets]     │   │
│  └──────────┘  └────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘

Khi query: DB đọc page vào Buffer Pool (RAM cache) trước
→ nếu page đã trong Buffer Pool: cache hit (nhanh)
→ nếu chưa có: đọc từ disk (chậm hơn 1000x)
```

## 1.2 Buffer Pool / Shared Buffer

```
┌─────────────────────────────────────────────────────────┐
│                 PostgreSQL Process                       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Shared Buffers (RAM)                 │  │
│  │                                                   │  │
│  │  [Page A][Page B][Page C]...[Page N]              │  │
│  │  (hot pages kept in memory — LRU eviction)        │  │
│  └───────────────────────────────────────────────────┘  │
│           ↑ cache hit (ns)    ↓ cache miss              │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Disk (SSD/HDD)                     │    │
│  │  [table data files][index files][WAL logs]      │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

PostgreSQL: shared_buffers = 25% RAM (rule of thumb)
MySQL: innodb_buffer_pool_size = 70-80% RAM
```

## 1.3 Data Types — Chọn đúng loại

```sql
-- INTEGER TYPES
SMALLINT        -- 2 bytes, -32768 to 32767
INTEGER / INT   -- 4 bytes, -2.1B to 2.1B  ← dùng cho IDs thông thường
BIGINT          -- 8 bytes, -9.2 * 10^18   ← cho high-volume systems
SERIAL          -- auto-increment int (PostgreSQL)
BIGSERIAL       -- auto-increment bigint
UUID            -- 16 bytes, universally unique  ← distributed systems

-- DECIMAL TYPES
REAL            -- 4 bytes floating point (imprecise!)
DOUBLE PRECISION-- 8 bytes floating point (imprecise!)
NUMERIC(p, s)   -- exact: p total digits, s after decimal ← dùng cho tiền
DECIMAL(19, 4)  -- ví dụ: 999999999999999.9999

-- TEXT TYPES
CHAR(n)         -- fixed length, padded with spaces ← hiếm dùng
VARCHAR(n)      -- variable length, max n chars
TEXT            -- unlimited length (PostgreSQL performance = VARCHAR)

-- DATE/TIME
DATE            -- date only (2025-05-19)
TIME            -- time only (14:30:00)
TIMESTAMP       -- date + time, no timezone
TIMESTAMPTZ     -- date + time WITH timezone ← LUÔN dùng cái này!
INTERVAL        -- duration ('2 hours 30 minutes')

-- BINARY
BYTEA           -- binary data (PostgreSQL)
BLOB            -- MySQL

-- BOOLEAN
BOOLEAN         -- true/false/null

-- JSON (PostgreSQL)
JSON            -- stored as text, reparsed each query
JSONB           -- stored as binary, indexed, faster queries ← prefer this

-- ⚠️ Common mistakes:
-- Dùng FLOAT cho tiền → sai do floating point errors
-- Dùng VARCHAR(255) mọi nơi → wasteful, use appropriate length
-- Store dates as VARCHAR → can't sort, filter properly
-- Dùng CHAR vs VARCHAR → CHAR pads spaces, wastes space
```

---

# 2. SQL Deep Dive

> 📖 <https://www.postgresql.org/docs/current/sql.html>

## 2.1 DDL — Data Definition Language

```sql
-- CREATE TABLE with constraints
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    age         SMALLINT CHECK (age >= 0 AND age <= 150),
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED')),
    balance     NUMERIC(19, 4) NOT NULL DEFAULT 0.0000
                    CHECK (balance >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,                   -- soft delete
    department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL
);

-- Foreign key behaviors:
-- ON DELETE CASCADE    → xóa user → xóa tất cả orders của user
-- ON DELETE SET NULL   → xóa department → user.department_id = NULL
-- ON DELETE RESTRICT   → không cho xóa department nếu còn user
-- ON DELETE NO ACTION  → default, like RESTRICT but deferred

-- ALTER TABLE
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users ALTER COLUMN name TYPE TEXT;
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'ACTIVE';
ALTER TABLE users ADD CONSTRAINT chk_name_len CHECK (LENGTH(name) >= 2);
ALTER TABLE users RENAME COLUMN name TO full_name;
ALTER TABLE users RENAME TO customers;

-- Indexes (separate section below)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL; -- partial index
DROP INDEX idx_users_email;
```

## 2.2 DML — Data Manipulation Language

```sql
-- INSERT
INSERT INTO users (email, name, age)
VALUES ('khang@example.com', 'Khang', 21);

-- Bulk insert (much faster than multiple single inserts)
INSERT INTO users (email, name, age)
VALUES
    ('user1@test.com', 'User One', 25),
    ('user2@test.com', 'User Two', 30),
    ('user3@test.com', 'User Three', 22);

-- INSERT ... ON CONFLICT (upsert) — PostgreSQL
INSERT INTO users (email, name, age)
VALUES ('khang@example.com', 'Khang Updated', 22)
ON CONFLICT (email)
    DO UPDATE SET
        name = EXCLUDED.name,
        age  = EXCLUDED.age,
        updated_at = NOW();

-- INSERT ... ON CONFLICT DO NOTHING
INSERT INTO user_roles (user_id, role_id)
VALUES (1, 3)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- UPDATE
UPDATE users
SET
    name       = 'New Name',
    updated_at = NOW()
WHERE id = 1
RETURNING id, name, updated_at;   -- return updated rows (PostgreSQL)

-- Bulk update with JOIN
UPDATE orders o
SET status = 'CANCELLED'
FROM users u
WHERE o.user_id = u.id
  AND u.status = 'BANNED'
  AND o.status = 'PENDING';

-- DELETE
DELETE FROM users WHERE id = 1 RETURNING *;

-- Soft delete (preferred in production)
UPDATE users SET deleted_at = NOW() WHERE id = 1;

-- TRUNCATE — xóa toàn bộ bảng, nhanh hơn DELETE (không log từng row)
TRUNCATE TABLE temp_data;
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;  -- reset sequence, cascade
```

## 2.3 SELECT — Advanced Queries

```sql
-- Basic SELECT structure (thứ tự execution khác thứ tự viết!)
SELECT   columns          -- 6. chọn columns
FROM     table            -- 1. xác định table
JOIN     other_table      -- 2. join tables
WHERE    condition        -- 3. filter rows
GROUP BY columns          -- 4. group rows
HAVING   condition        -- 5. filter groups
ORDER BY columns          -- 7. sort
LIMIT    n OFFSET m;      -- 8. paginate

-- ── JOINs ──
-- INNER JOIN — chỉ rows có match ở cả 2 bảng
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN — tất cả rows từ left, match từ right (NULL nếu không có)
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;

-- FULL OUTER JOIN — tất cả rows từ cả 2 bảng
SELECT u.name, o.total
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;

-- CROSS JOIN — cartesian product (mọi combination)
SELECT u.name, p.name as product
FROM users u
CROSS JOIN products p;  -- n_users * n_products rows

-- Self join — join table với chính nó
SELECT e.name as employee, m.name as manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- ── Aggregations ──
SELECT
    department_id,
    COUNT(*)                            as total,
    COUNT(DISTINCT status)              as unique_statuses,
    SUM(salary)                         as total_salary,
    AVG(salary)                         as avg_salary,
    MIN(salary)                         as min_salary,
    MAX(salary)                         as max_salary,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) as median_salary,
    ARRAY_AGG(name ORDER BY name)       as employee_names,  -- PostgreSQL
    STRING_AGG(name, ', ' ORDER BY name) as names_csv       -- PostgreSQL
FROM employees
WHERE deleted_at IS NULL
GROUP BY department_id
HAVING COUNT(*) > 5          -- filter groups (WHERE runs before GROUP BY!)
ORDER BY total_salary DESC;

-- ── Window Functions ──
-- Tính toán across rows liên quan, không group chúng lại

SELECT
    name,
    department_id,
    salary,
    -- Rank within department
    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as row_num,
    RANK()       OVER (PARTITION BY department_id ORDER BY salary DESC) as rank,
    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as dense_rank,

    -- Running totals
    SUM(salary)  OVER (PARTITION BY department_id ORDER BY salary) as running_total,
    AVG(salary)  OVER (PARTITION BY department_id)                 as dept_avg,

    -- Lag/Lead — access previous/next rows
    LAG(salary, 1)  OVER (PARTITION BY department_id ORDER BY salary) as prev_salary,
    LEAD(salary, 1) OVER (PARTITION BY department_id ORDER BY salary) as next_salary,

    -- First/Last value
    FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary DESC) as highest_in_dept,
    LAST_VALUE(salary)  OVER (PARTITION BY department_id ORDER BY salary DESC
                              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
                         ) as lowest_in_dept,

    -- Percentile rank
    PERCENT_RANK() OVER (ORDER BY salary) as pct_rank,
    NTILE(4)       OVER (ORDER BY salary) as quartile    -- divide into 4 buckets

FROM employees;

-- ── CTEs (Common Table Expressions) — WITH clause ──
-- Readable, reusable subqueries
WITH
-- CTE 1: active users
active_users AS (
    SELECT id, name, email
    FROM users
    WHERE status = 'ACTIVE' AND deleted_at IS NULL
),
-- CTE 2: their orders in last 30 days
recent_orders AS (
    SELECT user_id, COUNT(*) as order_count, SUM(total) as total_spent
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY user_id
),
-- CTE 3: combine
user_stats AS (
    SELECT
        u.id, u.name, u.email,
        COALESCE(o.order_count, 0)  as orders,
        COALESCE(o.total_spent, 0)  as spent
    FROM active_users u
    LEFT JOIN recent_orders o ON u.id = o.user_id
)
SELECT * FROM user_stats
WHERE spent > 1000000
ORDER BY spent DESC;

-- Recursive CTE — cho hierarchical data (org chart, categories)
WITH RECURSIVE category_tree AS (
    -- Base case: root categories
    SELECT id, name, parent_id, 0 as level, name::TEXT as path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive case: children
    SELECT c.id, c.name, c.parent_id, ct.level + 1, ct.path || ' > ' || c.name
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY path;

-- ── Subqueries ──
-- Scalar subquery (returns single value)
SELECT name, salary,
    (SELECT AVG(salary) FROM employees) as company_avg,
    salary - (SELECT AVG(salary) FROM employees) as diff_from_avg
FROM employees;

-- IN subquery
SELECT * FROM users
WHERE id IN (
    SELECT DISTINCT user_id FROM orders WHERE total > 1000000
);

-- EXISTS — often faster than IN for large datasets
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o
    WHERE o.user_id = u.id AND o.total > 1000000
);

-- Lateral join — subquery that references outer query columns
SELECT u.name, recent.* FROM users u
CROSS JOIN LATERAL (
    SELECT id, total, created_at
    FROM orders
    WHERE user_id = u.id          -- references outer u.id!
    ORDER BY created_at DESC
    LIMIT 3
) recent;
```

## 2.4 Advanced SQL Features

```sql
-- ── CASE WHEN ──
SELECT
    name,
    salary,
    CASE
        WHEN salary >= 50000000 THEN 'Senior'
        WHEN salary >= 30000000 THEN 'Mid'
        WHEN salary >= 15000000 THEN 'Junior'
        ELSE 'Intern'
    END as level,
    CASE status
        WHEN 'ACTIVE'   THEN '✅ Active'
        WHEN 'INACTIVE' THEN '⛔ Inactive'
        ELSE '❓ Unknown'
    END as status_label
FROM employees;

-- ── COALESCE — first non-null value ──
SELECT COALESCE(nickname, first_name, 'Anonymous') as display_name FROM users;

-- ── NULLIF — return null if equal ──
SELECT NULLIF(status, 'DELETED') FROM users;  -- returns NULL if status='DELETED'

-- ── Date/Time operations ──
SELECT
    NOW(),                                      -- current timestamp with tz
    CURRENT_DATE,                               -- current date
    NOW() - INTERVAL '30 days',                 -- 30 days ago
    DATE_TRUNC('month', created_at),            -- truncate to month start
    EXTRACT(YEAR FROM created_at),              -- extract year
    EXTRACT(DOW FROM created_at),               -- day of week (0=Sunday)
    AGE(NOW(), created_at),                     -- interval since created
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI'),  -- format date

-- ── String functions ──
    UPPER(name), LOWER(email),
    TRIM(name), LTRIM(name), RTRIM(name),
    LENGTH(name),
    SUBSTRING(email FROM 1 FOR 5),
    CONCAT(first_name, ' ', last_name),
    REPLACE(phone, '+84', '0'),
    REGEXP_REPLACE(phone, '[^0-9]', '', 'g'),  -- remove non-digits
    SPLIT_PART(email, '@', 2),                 -- domain from email

-- ── JSON operations (PostgreSQL) ──
    data->>'name',                   -- get JSON field as text
    data->'address'->>'city',        -- nested field
    jsonb_array_elements(data->'tags')  -- expand JSON array to rows

FROM users;
```

---

# 3. Indexes — The Most Important Optimization

> 📖 <https://www.postgresql.org/docs/current/indexes.html>

## 3.1 How Indexes Work Internally

```
Không có index — Full Table Scan:
Query: SELECT * FROM users WHERE email = 'khang@test.com'
→ Đọc từng row từ đầu đến cuối (O(n))
→ 1 triệu rows = 1 triệu comparisons

Có index (B-Tree):
→ B-Tree balanced structure: O(log n)
→ 1 triệu rows = ~20 comparisons

B-Tree structure:
              [P | Q]
             /   |   \
          [H|L] [M|N] [R|S]
          /  \    |    / \
        [A-G] [I-K] ...  [T-Z]
         (leaf nodes with data pointers)

Leaf nodes chứa: (indexed_value → page_id + row_offset)
→ PostgreSQL đọc đúng page cần thiết
```

## 3.2 Index Types

```sql
-- ── B-TREE (default) — dùng cho hầu hết cases ──
-- Supports: =, <, >, <=, >=, BETWEEN, LIKE 'prefix%', IS NULL
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Multi-column index — column order MATTERS
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
-- Supports: WHERE user_id = ?
--           WHERE user_id = ? AND status = ?
-- Does NOT efficiently support: WHERE status = ? (without user_id)
-- Leading column phải xuất hiện trong WHERE clause!

-- ── HASH index — chỉ cho equality (=) ──
CREATE INDEX idx_sessions_token ON sessions USING HASH (token);
-- Nhỏ hơn B-tree, nhanh hơn cho equality-only lookups

-- ── GIN (Generalized Inverted Index) ──
-- Cho arrays, JSONB, full-text search
CREATE INDEX idx_posts_tags ON posts USING GIN (tags);     -- array
CREATE INDEX idx_products_data ON products USING GIN (attributes); -- JSONB
CREATE INDEX idx_posts_fts ON posts USING GIN (to_tsvector('english', content)); -- full-text

-- Usage:
SELECT * FROM posts WHERE tags @> ARRAY['java', 'spring']; -- contains tags
SELECT * FROM products WHERE attributes @> '{"color": "red"}'; -- contains JSON key
SELECT * FROM posts WHERE to_tsvector('english', content) @@ to_tsquery('java & spring');

-- ── BRIN (Block Range Index) — cho huge, naturally ordered tables ──
-- Very small index, good for time-series data
CREATE INDEX idx_logs_created ON logs USING BRIN (created_at);
-- Assumes rows are roughly ordered by created_at (append-only logs)

-- ── Partial Index — index trên subset of rows ──
CREATE INDEX idx_orders_pending ON orders(user_id, created_at)
WHERE status = 'PENDING';
-- Nhỏ hơn full index, chỉ cho queries với WHERE status = 'PENDING'

CREATE INDEX idx_users_active ON users(email)
WHERE deleted_at IS NULL;   -- chỉ index active users

-- ── Expression/Functional Index ──
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
-- Supports: WHERE LOWER(email) = 'khang@test.com'

CREATE INDEX idx_users_year ON users(EXTRACT(YEAR FROM created_at));
```

## 3.3 Index Best Practices

```sql
-- ✅ GOOD: Index columns used in WHERE, JOIN ON, ORDER BY
CREATE INDEX idx_orders_user_id ON orders(user_id);        -- foreign key
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- ✅ GOOD: Covering index — includes all columns query needs (index-only scan)
CREATE INDEX idx_orders_covering ON orders(user_id, status)
INCLUDE (total, created_at);  -- PostgreSQL 11+
-- Query: SELECT status, total, created_at FROM orders WHERE user_id = ?
-- → DB không cần đọc actual table rows!

-- ❌ BAD: Over-indexing — mỗi index tốn space + slows down INSERT/UPDATE/DELETE
-- Ví dụ: 5 indexes trên orders table → mỗi INSERT phải update 5 index trees

-- ❌ BAD: Index on low-cardinality column
CREATE INDEX idx_users_gender ON users(gender);  -- chỉ 2 giá trị → không giúp nhiều
-- Exception: partial index có thể hữu ích

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;  -- indexes với idx_scan = 0 → unused, consider dropping

-- Check missing indexes (slow queries)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

# 4. Transactions & ACID

> 📖 <https://www.postgresql.org/docs/current/transaction-iso.html>

## 4.1 ACID Properties

```
A — Atomicity   : Tất cả operations trong transaction thành công, hoặc tất cả rollback
                  "All or Nothing"

C — Consistency : Transaction đưa DB từ valid state sang valid state khác
                  Constraints, rules, triggers đều được enforce

I — Isolation   : Concurrent transactions không thấy intermediate state của nhau
                  Mức độ isolation có thể điều chỉnh

D — Durability  : Committed transaction tồn tại dù có crash, power failure
                  Data được ghi vào WAL (Write-Ahead Log) trước khi confirm
```

## 4.2 Isolation Levels & Problems

```sql
-- ISOLATION PROBLEMS:

-- Dirty Read: đọc uncommitted data của transaction khác
-- Tx1: UPDATE balance SET amount = 1000 WHERE id = 1  (chưa commit)
-- Tx2: SELECT amount FROM balance WHERE id = 1  → thấy 1000 (dirty!)
-- Tx1: ROLLBACK → 1000 không thực sự tồn tại

-- Non-Repeatable Read: đọc 2 lần cùng row, kết quả khác nhau
-- Tx1: SELECT salary FROM employees WHERE id = 1  → 50000
-- Tx2: UPDATE employees SET salary = 60000 WHERE id = 1; COMMIT;
-- Tx1: SELECT salary FROM employees WHERE id = 1  → 60000  (khác lần trước!)

-- Phantom Read: đọc 2 lần cùng range query, kết quả khác số lượng rows
-- Tx1: SELECT COUNT(*) FROM orders WHERE user_id = 1  → 5
-- Tx2: INSERT INTO orders (user_id, ...) VALUES (1, ...); COMMIT;
-- Tx1: SELECT COUNT(*) FROM orders WHERE user_id = 1  → 6  (phantom!)

-- ISOLATION LEVELS:
--                          Dirty   Non-Repeatable  Phantom
-- READ UNCOMMITTED          ✅        ✅              ✅    (no protection)
-- READ COMMITTED            ❌        ✅              ✅    (default PostgreSQL, MySQL)
-- REPEATABLE READ           ❌        ❌              ✅    (default MySQL InnoDB)
-- SERIALIZABLE              ❌        ❌              ❌    (strictest, slowest)

-- Set isolation level
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- ... queries ...
COMMIT;

-- Or for session
SET default_transaction_isolation = 'repeatable read';
```

## 4.3 Locks

```sql
-- ── Row-level locks ──
-- FOR UPDATE — exclusive lock, blocks other FOR UPDATE
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;

-- FOR SHARE — shared lock, allows other FOR SHARE but blocks FOR UPDATE
SELECT * FROM accounts WHERE id = 1 FOR SHARE;

-- FOR NO KEY UPDATE — weaker than FOR UPDATE
-- FOR KEY SHARE — weaker than FOR SHARE

-- NOWAIT — fail immediately instead of waiting
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;

-- SKIP LOCKED — skip locked rows (queue processing pattern)
SELECT * FROM job_queue
WHERE status = 'PENDING'
ORDER BY created_at
LIMIT 10
FOR UPDATE SKIP LOCKED;
-- Multiple workers can process different rows concurrently!

-- ── Table-level locks ──
LOCK TABLE users IN EXCLUSIVE MODE;     -- blocks all reads + writes
LOCK TABLE users IN SHARE MODE;         -- blocks writes, allows reads
LOCK TABLE users IN ACCESS SHARE MODE;  -- only blocks ALTER TABLE

-- ── Deadlock ──
-- Tx1: LOCK row A → tries to LOCK row B
-- Tx2: LOCK row B → tries to LOCK row A
-- → Deadlock! One transaction is killed automatically by DB
-- Prevention: always lock resources in the SAME ORDER

-- Advisory Locks — application-level locks
SELECT pg_advisory_lock(12345);       -- acquire lock with key 12345
SELECT pg_advisory_unlock(12345);     -- release
SELECT pg_try_advisory_lock(12345);   -- non-blocking (returns boolean)
```

---

# 5. Query Optimization

> 📖 <https://www.postgresql.org/docs/current/performance-tips.html>

## 5.1 EXPLAIN ANALYZE — Reading Query Plans

```sql
-- EXPLAIN — shows plan without running
-- EXPLAIN ANALYZE — runs query AND shows actual stats
-- EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) — detailed with buffer hit info

EXPLAIN (ANALYZE, BUFFERS)
SELECT u.name, COUNT(o.id) as orders
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'ACTIVE'
GROUP BY u.id, u.name
ORDER BY orders DESC
LIMIT 10;

-- Output:
Limit  (cost=1234.56..1234.59 rows=10 width=40) (actual time=45.2..45.3 rows=10)
  ->  Sort  (cost=1234.56..1259.56 rows=10000) (actual time=45.2..45.2 rows=10)
        Sort Key: count(o.id) DESC
        Sort Method: top-N heapsort  Memory: 25kB
        ->  HashAggregate  (cost=800.00..900.00 rows=10000)
              ->  Hash Left Join  (cost=100.00..700.00 rows=50000)
                    Hash Cond: (o.user_id = u.id)
                    ->  Seq Scan on orders o  (cost=0.00..500.00 rows=50000)
                    ->  Hash  (cost=80.00..80.00 rows=5000)
                          ->  Index Scan on users u  (cost=0.00..80.00 rows=5000)
                                Index Cond: (status = 'ACTIVE')
Planning Time: 1.2 ms
Execution Time: 45.5 ms  ← actual time

-- Key terms to understand:
-- Seq Scan    : full table scan — BAD for large tables
-- Index Scan  : using index — GOOD
-- Index Only Scan: covering index, no heap access — BEST
-- Bitmap Heap Scan: multiple index ranges combined
-- Nested Loop : for each row in outer, scan inner (good for small sets)
-- Hash Join   : build hash table from smaller relation (good for large sets)
-- Merge Join  : both sides sorted (good for sorted/indexed data)
-- cost=X..Y   : X=startup cost, Y=total cost (arbitrary units)
-- rows=N      : estimated rows
-- actual rows=N: actual rows — if estimate vs actual differ a lot → stale stats
```

## 5.2 Common Query Optimization Techniques

```sql
-- ── 1. Use EXISTS instead of COUNT for existence checks ──
-- ❌ Slow: scans all matching rows
SELECT * FROM users WHERE (SELECT COUNT(*) FROM orders WHERE user_id = users.id) > 0;

-- ✅ Fast: stops at first match
SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- ── 2. Avoid functions on indexed columns in WHERE ──
-- ❌ Can't use index on email
SELECT * FROM users WHERE LOWER(email) = 'khang@test.com';
SELECT * FROM users WHERE YEAR(created_at) = 2025;
SELECT * FROM users WHERE created_at::DATE = '2025-05-19';

-- ✅ Use function index OR rewrite query
CREATE INDEX idx_lower_email ON users(LOWER(email));  -- index the function
-- OR:
SELECT * FROM users WHERE email = 'khang@test.com';  -- store lowercase in DB
SELECT * FROM users WHERE created_at >= '2025-05-19' AND created_at < '2025-05-20';

-- ── 3. Avoid SELECT * ──
-- ❌ Fetches all columns, prevents index-only scans
SELECT * FROM users WHERE id = 1;

-- ✅ Select only what you need
SELECT id, name, email FROM users WHERE id = 1;

-- ── 4. Use LIMIT for pagination wisely ──
-- ❌ OFFSET pagination is slow for large offsets
-- OFFSET 100000 → DB reads 100010 rows, discards first 100000
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 100000;

-- ✅ Keyset/Cursor pagination
SELECT * FROM posts
WHERE created_at < '2025-05-19 10:30:00'   -- last seen timestamp
ORDER BY created_at DESC
LIMIT 20;

-- ── 5. Optimize N+1 in raw SQL ──
-- ❌ N+1: 1 query for users + N queries for their orders
SELECT * FROM users;  -- then for each user:
SELECT * FROM orders WHERE user_id = ?;

-- ✅ Single JOIN
SELECT u.*, o.id as order_id, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- ── 6. Batch operations ──
-- ❌ Insert one by one
for user in users:
    INSERT INTO users (name, email) VALUES (?, ?);

-- ✅ Bulk insert
INSERT INTO users (name, email) VALUES
    ('User1', 'u1@test.com'),
    ('User2', 'u2@test.com'),
    ...;  -- thousands at once

-- ── 7. Materialized Views — pre-computed expensive queries ──
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    SUM(total) as revenue,
    COUNT(*) as order_count
FROM orders
WHERE status = 'COMPLETED'
GROUP BY 1;

CREATE INDEX idx_monthly_sales_month ON monthly_sales(month);

-- Query is instant (pre-computed)
SELECT * FROM monthly_sales WHERE month >= '2025-01-01';

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;
-- CONCURRENTLY: allows reads during refresh (needs unique index)

-- ── 8. Update Statistics ──
ANALYZE users;           -- update table statistics (optimizer needs this)
VACUUM ANALYZE users;    -- reclaim dead rows + update statistics
VACUUM FULL users;       -- reclaim space, rewrites table (locks table!)
```

---

# 6. Partitioning

> 📖 <https://www.postgresql.org/docs/current/ddl-partitioning.html>

## 6.1 What is Partitioning?

```
Partitioning = chia 1 bảng lớn thành nhiều bảng con (partitions)
→ Query chỉ scan partition liên quan (Partition Pruning)
→ Maintenance dễ hơn (archive/drop old partitions)
→ Tất cả transparent với application

Ví dụ: orders table — 500 triệu rows
Chia theo tháng:
  orders_2024_01 (50M rows)
  orders_2024_02 (48M rows)
  ...
  orders_2025_05 (45M rows)

Query: SELECT * FROM orders WHERE created_at >= '2025-05-01'
→ PostgreSQL chỉ scan orders_2025_05 (45M) thay vì 500M rows!
```

## 6.2 Range Partitioning (most common)

```sql
-- Create partitioned table
CREATE TABLE orders (
    id          BIGSERIAL,
    user_id     BIGINT NOT NULL,
    total       NUMERIC(19, 4),
    status      VARCHAR(20),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

CREATE TABLE orders_2025_q1 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE orders_2025_q2 PARTITION OF orders
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

-- Default partition (catches anything that doesn't fit)
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- Indexes on partitioned tables (creates index on each partition)
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);

-- Insert goes to correct partition automatically
INSERT INTO orders (user_id, total, created_at)
VALUES (1, 500000, '2025-05-19');  -- goes to orders_2025_q2

-- Query uses partition pruning automatically
EXPLAIN SELECT * FROM orders WHERE created_at >= '2025-04-01';
-- → Only scans orders_2025_q2, not all other partitions!

-- Drop old partition (much faster than DELETE millions of rows)
DROP TABLE orders_2023_q1;

-- Detach partition (keep data, just disconnect from parent)
ALTER TABLE orders DETACH PARTITION orders_2023_q1;
-- Can attach to archive table or backup separately
```

## 6.3 List Partitioning

```sql
-- Partition by discrete values
CREATE TABLE transactions (
    id          BIGSERIAL,
    user_id     BIGINT,
    amount      NUMERIC(19, 4),
    currency    VARCHAR(3),
    region      VARCHAR(20)
) PARTITION BY LIST (region);

CREATE TABLE transactions_apac PARTITION OF transactions
    FOR VALUES IN ('VN', 'TH', 'SG', 'MY', 'PH', 'ID');

CREATE TABLE transactions_us PARTITION OF transactions
    FOR VALUES IN ('US', 'CA', 'MX');

CREATE TABLE transactions_eu PARTITION OF transactions
    FOR VALUES IN ('DE', 'FR', 'GB', 'IT', 'ES');

CREATE TABLE transactions_other PARTITION OF transactions DEFAULT;
```

## 6.4 Hash Partitioning

```sql
-- Partition by hash of column — even distribution, no natural key needed
CREATE TABLE user_events (
    id      BIGSERIAL,
    user_id BIGINT NOT NULL,
    event   JSONB,
    ts      TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY HASH (user_id);

-- 4 partitions — modulus 4
CREATE TABLE user_events_0 PARTITION OF user_events
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE user_events_1 PARTITION OF user_events
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE user_events_2 PARTITION OF user_events
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE user_events_3 PARTITION OF user_events
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);
-- user_id 1 → hash(1) % 4 = 1 → user_events_1
-- user_id 5 → hash(5) % 4 = 1 → user_events_1
```

---

# 7. Replication

> 📖 <https://www.postgresql.org/docs/current/high-availability.html>

## 7.1 Replication Overview

```
Replication = sao chép data từ Primary → Replica(s)
Mục đích:
- High Availability: nếu Primary chết, Replica takeover
- Read Scaling: reads phân tán ra nhiều replicas
- Disaster Recovery: backup ở địa lý khác
- Zero-downtime maintenance
```

## 7.2 Types of Replication

```
┌──────────────────────────────────────────────────────────────┐
│  SYNCHRONOUS REPLICATION                                     │
│                                                              │
│  Client ──WRITE──▶ Primary ──▶ WAL sent to Replica          │
│                        │                                     │
│                        │ waits for ACK ◀─── Replica ACK     │
│                        │                                     │
│                   COMMIT confirmed to client                 │
│                                                              │
│  ✅ Zero data loss (RPO = 0)                                 │
│  ❌ Higher write latency (waits for replica)                 │
│  ❌ Primary blocked if replica goes down                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  ASYNCHRONOUS REPLICATION                                    │
│                                                              │
│  Client ──WRITE──▶ Primary                                   │
│                        │                                     │
│                   COMMIT confirmed immediately               │
│                        │                                     │
│                        └──▶ WAL sent to Replica (async)     │
│                                                              │
│  ✅ Low write latency                                        │
│  ✅ Primary not blocked by slow replicas                     │
│  ❌ Replication lag (replica slightly behind)                │
│  ❌ Potential data loss if primary crashes before WAL sent   │
└──────────────────────────────────────────────────────────────┘
```

## 7.3 Replication Setup Concepts

```sql
-- PRIMARY: write all changes to WAL (Write-Ahead Log)
-- WAL = journal of all changes, replicas replay these changes

-- REPLICA: continuously reads WAL from primary, applies changes
-- Replica is read-only by default

-- Replication Lag: how far behind is replica?
-- Check on replica:
SELECT
    now() - pg_last_xact_replay_timestamp() AS replication_lag;

-- Check on primary:
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    (sent_lsn - replay_lsn) * 8 / 1024 / 1024 AS lag_mb
FROM pg_stat_replication;

-- Read from replica in application:
-- Configure your connection pool with:
-- Primary URL: for writes
-- Replica URL: for reads
-- Most ORMs/frameworks support this (Spring Data, Sequelize, etc.)
```

## 7.4 Replication Topologies

```
── SINGLE PRIMARY, MULTIPLE REPLICAS ──
                 ┌─────────────┐
                 │   Primary   │ ← all writes
                 └──────┬──────┘
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      ┌────────┐    ┌────────┐   ┌────────┐
      │Replica1│    │Replica2│   │Replica3│
      │(reads) │    │(reads) │   │(backup)│
      └────────┘    └────────┘   └────────┘

── CASCADING REPLICATION ──
    Primary → Replica1 → Replica2 → Replica3
    Giảm tải WAL streaming từ Primary

── MULTI-PRIMARY (Bi-directional) ──
    Primary1 ⟷ Primary2
    ← Both accept writes, sync with each other
    Phức tạp, conflict resolution cần thiết
    Dùng trong active-active HA setups

── FAILOVER ──
    Primary chết → Replica được promote lên Primary
    Automatic: Patroni, Pacemaker, AWS RDS Multi-AZ
    Manual: pg_ctl promote
```

---

# 8. Sharding

## 8.1 What is Sharding?

```
Partitioning = chia data trong CÙNG MỘT server
Sharding     = chia data ra NHIỀU SERVERS khác nhau

Khi nào cần sharding?
→ Single server không đủ lưu data (TB/PB scale)
→ Single server không đủ xử lý writes (>100k writes/sec)
→ Partitioning + replication đã không đủ

Ví dụ: users table — 2 tỷ users
Shard 1 (server 1): users  0   - 500M
Shard 2 (server 2): users 500M - 1B
Shard 3 (server 3): users  1B  - 1.5B
Shard 4 (server 4): users 1.5B - 2B
```

## 8.2 Sharding Strategies

```
── RANGE SHARDING ──
  Shard by value range of shard key
  Shard1: user_id  1 - 10,000,000
  Shard2: user_id  10M - 20M
  Shard3: user_id  20M - 30M

  ✅ Range queries efficient (e.g., "all users created in Jan")
  ❌ Hotspot problem: new users always go to latest shard
  ❌ Uneven distribution if not planned well

── HASH SHARDING ──
  shard_id = hash(shard_key) % num_shards
  User 1:  hash(1)   % 4 = 1 → Shard 1
  User 2:  hash(2)   % 4 = 2 → Shard 2
  User 15: hash(15)  % 4 = 3 → Shard 3

  ✅ Even distribution
  ✅ No hotspots
  ❌ Range queries require hitting ALL shards
  ❌ Rebalancing when adding shards (consistent hashing solves this)

── CONSISTENT HASHING ──
  Ring của hash values (0 - 2^32)
  Servers placed at points on ring
  Data → closest server clockwise

  Virtual nodes: each server has multiple positions on ring
  → Even distribution even with different server capacities

  ✅ Adding/removing servers → only nearby data migrates
  ✅ Even distribution with virtual nodes
  Used by: Cassandra, DynamoDB, Redis Cluster

── DIRECTORY-BASED SHARDING ──
  Lookup service: "where is user 12345?" → Shard 3
  Most flexible, can rebalance without formula
  ❌ Lookup service is single point of failure
  ❌ Extra hop for every query
```

## 8.3 Sharding Challenges

```
── CROSS-SHARD JOINS ──
Problem:
  users on Shard1, orders on Shard2
  SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id
  → Can't do this in single DB query!

Solutions:
  1. Denormalization: store user_name in orders table (data duplication)
  2. Application-level join: query both shards, join in code
  3. Co-location: users and their orders on SAME shard (shard by user_id for both)

── DISTRIBUTED TRANSACTIONS ──
Problem:
  Transfer money between users on different shards
  Must be atomic (both debit and credit succeed or fail)

Solutions:
  1. Two-Phase Commit (2PC): heavy, can block
  2. Saga Pattern: chain of local transactions with compensating transactions
  3. Design to avoid: keep related data on same shard

── REBALANCING ──
Problem:
  Add new shard → must migrate data
  Hash(user_id) % 4 → Hash(user_id) % 5 after adding shard
  → 80% of data needs to move!

Solutions:
  1. Consistent hashing: only ~1/n data moves
  2. Double the shards: 4 → 8, each old shard splits into 2
  3. Virtual shards: logical shards >> physical shards
     Map 1000 virtual shards to physical servers
     Add server → reassign some virtual shards (no data movement formula change)
```

---

# 9. NoSQL Databases

> 📖 <https://www.mongodb.com/docs/>
> 📖 <https://cassandra.apache.org/doc/>

## 9.1 NoSQL Types

```
┌─────────────────────────────────────────────────────────────┐
│  DOCUMENT STORE                                             │
│  MongoDB, CouchDB, Firestore                                │
│  → Store JSON/BSON documents                               │
│  → Flexible schema                                         │
│  → Good for: catalogs, CMS, user profiles, events          │
│                                                             │
│  {                                                          │
│    "_id": "user123",                                        │
│    "name": "Khang",                                         │
│    "address": { "city": "HCMC", "zip": "70000" },          │
│    "tags": ["developer", "java"],                           │
│    "orders": [...]                                          │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  KEY-VALUE STORE                                            │
│  Redis, DynamoDB, Memcached                                 │
│  → Simple key → value lookup                               │
│  → Extremely fast (O(1))                                   │
│  → Good for: caching, sessions, leaderboards, rate limiting │
│                                                             │
│  "session:abc123" → { userId: 1, expires: ... }            │
│  "user:1:profile" → { name: "Khang", ... }                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  COLUMN-FAMILY STORE                                        │
│  Cassandra, HBase, ScyllaDB                                 │
│  → Data organized in column families                       │
│  → Optimized for time-series, write-heavy workloads        │
│  → Good for: IoT data, analytics, activity logs            │
│  → Scales horizontally extremely well                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GRAPH DATABASE                                             │
│  Neo4j, ArangoDB, Amazon Neptune                            │
│  → Nodes + Edges + Properties                              │
│  → Good for: social networks, recommendations, fraud detect │
│                                                             │
│  (Khang)-[:FOLLOWS]->(Alice)                                │
│  (Khang)-[:PURCHASED]->(Product)-[:BELONGS_TO]->(Category)  │
└─────────────────────────────────────────────────────────────┘
```

## 9.2 When SQL vs NoSQL

```
Use SQL (PostgreSQL/MySQL) when:
✅ Data has clear relationships (normalized schema)
✅ ACID transactions critical (banking, e-commerce orders)
✅ Complex queries (JOINs, aggregations, reporting)
✅ Schema is relatively stable
✅ Team knows SQL well

Use NoSQL when:
✅ Schema is flexible / changes frequently
✅ Huge scale (petabytes, millions writes/sec)
✅ Horizontal scaling is priority
✅ Data is naturally document-shaped (no JOINs needed)
✅ Specific patterns: time-series, graphs, key-value caching

Reality: Most production systems use BOTH
- PostgreSQL for transactional data
- Redis for caching, sessions
- Elasticsearch for full-text search
- Cassandra/ClickHouse for analytics/time-series
```

## 9.3 MongoDB Basics

```javascript
// Collection = table, Document = row

// Insert
db.users.insertOne({
  name: "Khang",
  email: "khang@test.com",
  age: 21,
  address: { city: "HCMC", country: "VN" },
  tags: ["developer", "java", "spring"]
});

// Find
db.users.find({ age: { $gte: 18 } });
db.users.find({ "address.city": "HCMC" });
db.users.find({ tags: { $in: ["java", "python"] } });
db.users.find({ $and: [{ age: { $gte: 18 } }, { status: "ACTIVE" }] });

// Update
db.users.updateOne(
  { email: "khang@test.com" },
  { $set: { age: 22 }, $addToSet: { tags: "spring-boot" } }
);

// Aggregation pipeline (like SQL GROUP BY + JOINs)
db.orders.aggregate([
  { $match: { status: "COMPLETED" } },                    // WHERE
  { $group: {
    _id: "$user_id",
    total: { $sum: "$amount" },
    count: { $sum: 1 }
  }},                                                     // GROUP BY
  { $lookup: {                                            // JOIN
    from: "users",
    localField: "_id",
    foreignField: "_id",
    as: "user"
  }},
  { $sort: { total: -1 } },                              // ORDER BY
  { $limit: 10 }                                         // LIMIT
]);

// Indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ "address.city": 1, age: -1 });
db.users.createIndex({ tags: 1 });                       // multikey index for arrays
db.posts.createIndex({ content: "text" });               // full-text search
```

---

# 10. Redis — In-Memory Data Store

> 📖 <https://redis.io/docs/data-types/>
> 📖 <https://redis.io/docs/manual/patterns/>

## 10.1 Redis Data Structures

```bash
# ── STRING — simplest type ──
SET user:1:name "Khang"
GET user:1:name                    # "Khang"
SET counter 0
INCR counter                       # 1 (atomic increment)
INCRBY counter 5                   # 6
INCRDECR counter                   # 5
SETNX key value                    # set only if Not eXists (distributed lock!)
SET key value EX 3600              # with TTL 1 hour
SET key value PX 5000              # TTL in milliseconds
SET key value XX                   # only update if exists
TTL key                            # remaining TTL in seconds (-2 = expired/gone)
EXPIRE key 3600                    # set TTL on existing key
PERSIST key                        # remove TTL

# ── HASH — like a mini Map, good for objects ──
HSET user:1 name "Khang" email "khang@test.com" age 21
HGET user:1 name                   # "Khang"
HMGET user:1 name email            # ["Khang", "khang@test.com"]
HGETALL user:1                     # all fields and values
HINCRBY user:1 age 1               # increment age to 22
HDEL user:1 email                  # delete a field
HEXISTS user:1 name                # 1 (exists)
HKEYS user:1                       # [name, age]
HVALS user:1                       # [Khang, 22]
HLEN user:1                        # 2 (number of fields)

# ── LIST — ordered, allows duplicates, like LinkedList ──
RPUSH queue "task1" "task2" "task3"  # push to right (tail)
LPUSH queue "urgent"                  # push to left (head)
LRANGE queue 0 -1                     # all elements
LRANGE queue 0 9                      # first 10
LLEN queue                            # length
LPOP queue                            # pop from head (returns and removes)
RPOP queue                            # pop from tail
BLPOP queue 30                        # blocking pop, wait 30s (queue processing!)
LINDEX queue 0                        # get by index
LSET queue 0 "new_task"              # set by index
LREM queue 0 "task1"                  # remove all occurrences

# ── SET — unordered, unique elements ──
SADD tags "java" "spring" "redis"
SADD tags "java"                   # returns 0, already exists
SMEMBERS tags                      # all members (unordered)
SISMEMBER tags "java"              # 1 (exists)
SCARD tags                         # 3 (count)
SREM tags "redis"                  # remove
SUNION set1 set2                   # union of two sets
SINTER set1 set2                   # intersection
SDIFF set1 set2                    # difference (in set1, not in set2)
SPOP tags                          # remove and return random member

# ── SORTED SET (ZSET) — like Set but with score ──
ZADD leaderboard 9800 "Alice"
ZADD leaderboard 8500 "Bob"
ZADD leaderboard 9950 "Charlie"
ZADD leaderboard 7200 "Diana"

ZRANK leaderboard "Alice"          # 1 (0-indexed, ascending)
ZREVRANK leaderboard "Alice"       # 2 (descending → highest score = rank 0)
ZSCORE leaderboard "Alice"         # 9800.0
ZINCRBY leaderboard 200 "Alice"    # add 200 to score

ZRANGE leaderboard 0 -1            # all, ascending by score
ZRANGE leaderboard 0 -1 WITHSCORES REV  # descending with scores
ZRANGEBYSCORE leaderboard 8000 10000    # members with score 8000-10000
ZREVRANGEBYSCORE leaderboard 10000 0 LIMIT 0 10  # top 10

ZCARD leaderboard                  # 4 (count)
ZCOUNT leaderboard 8000 10000      # count in score range
ZREM leaderboard "Diana"           # remove

# ── STREAM — append-only log (Kafka-like) ──
XADD events * user_id 1 action "login" ip "1.2.3.4"
XADD events * user_id 2 action "purchase" amount 50000
XLEN events
XRANGE events - +                  # all events
XREAD COUNT 10 STREAMS events 0    # read from beginning
XREAD BLOCK 0 STREAMS events $    # blocking read, wait for new events
```

## 10.2 Redis Patterns

```bash
# ── CACHING PATTERN ──
# Cache-aside (lazy loading):
# 1. Check cache
# 2. If miss → query DB → store in cache with TTL
# 3. Return data

# In application code:
# value = redis.get("user:1")
# if value is None:
#     value = db.query("SELECT * FROM users WHERE id = 1")
#     redis.setex("user:1", 3600, serialize(value))
# return deserialize(value)

SET "user:1" '{"id":1,"name":"Khang","email":"khang@test.com"}' EX 3600

# ── SESSION STORAGE ──
SET "session:abc123def456" '{"userId":1,"role":"USER","loginAt":"..."}' EX 86400
GET "session:abc123def456"
DEL "session:abc123def456"  # logout

# ── RATE LIMITING ──
# Allow max 100 requests per minute per IP
# Sliding window using sorted set:
ZADD ratelimit:192.168.1.1 {current_timestamp} {request_id}
ZREMRANGEBYSCORE ratelimit:192.168.1.1 0 {one_minute_ago}  # remove old
ZCARD ratelimit:192.168.1.1  # count in last minute
EXPIRE ratelimit:192.168.1.1 60

# Fixed window using simple counter:
INCR ratelimit:192.168.1.1:2025051914  # key includes minute
EXPIRE ratelimit:192.168.1.1:2025051914 60

# ── DISTRIBUTED LOCK ──
# SET if Not eXists with EX (atomic)
SET lock:resource:payment_1 "lock_owner_uuid" NX EX 30
# NX = only set if not exists
# EX 30 = auto-release after 30 seconds (prevent deadlock)

# Returns OK if acquired, nil if already locked
# Release: only delete if we own it (Lua script for atomicity)
# EVAL "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end" 1 lock:key owner_uuid

# ── LEADERBOARD ──
ZADD game:leaderboard 15000 "player:1"
ZADD game:leaderboard 22000 "player:2"
ZADD game:leaderboard 18500 "player:3"

# Top 10 players
ZREVRANGE game:leaderboard 0 9 WITHSCORES

# Player's rank (0-indexed)
ZREVRANK game:leaderboard "player:1"  # → 2 (3rd place)

# Add points
ZINCRBY game:leaderboard 500 "player:1"

# ── PUB/SUB — real-time messaging ──
# Publisher:
PUBLISH notifications:user:1 '{"type":"order_shipped","orderId":123}'

# Subscriber (blocks waiting for messages):
SUBSCRIBE notifications:user:1
PSUBSCRIBE notifications:user:*  # pattern subscribe

# ── COUNTER / ANALYTICS ──
# Page views
INCR pageviews:homepage
INCR pageviews:2025-05-19:homepage  # daily counter

# HyperLogLog — approximate distinct count (uses ~12KB regardless of cardinality)
PFADD unique_visitors:2025-05-19 "user:1" "user:2" "user:3"
PFCOUNT unique_visitors:2025-05-19  # approximate unique count
PFMERGE unique_visitors:week unique_visitors:mon unique_visitors:tue  # merge
```

## 10.3 Redis Persistence

```bash
# RDB (Redis Database) — point-in-time snapshots
# Saves entire dataset to disk periodically
# Pros: compact, fast restart
# Cons: may lose data between snapshots

# In redis.conf:
# save 900 1    → snapshot if 1+ changes in 900s
# save 300 10   → snapshot if 10+ changes in 300s
# save 60 10000 → snapshot if 10000+ changes in 60s

# AOF (Append-Only File) — logs every write operation
# Pros: durable, can replay to recover
# Cons: larger file, slower restart

# appendonly yes
# appendfsync always   → fsync every write (safest, slowest)
# appendfsync everysec → fsync every second (recommended)
# appendfsync no       → OS decides (fastest, least safe)

# RDB + AOF together: best durability
```

## 10.4 Redis Cluster

```
Redis Cluster = horizontal sharding built into Redis
→ Automatically shards data across multiple Redis nodes
→ Each node handles a subset of hash slots (0-16383)
→ Replication within cluster

Node 1 (Master): slots 0    - 5460   + Replica1
Node 2 (Master): slots 5461 - 10922  + Replica2
Node 3 (Master): slots 10923 - 16383 + Replica3

Key → CRC16(key) % 16384 → which slot → which node

Hash tags — force multiple keys to same slot:
{user:1}:profile   → hash of "user:1" → same slot
{user:1}:orders    → hash of "user:1" → same slot
→ Can do multi-key operations on these keys
```

---

# 11. CAP Theorem & Distributed Systems

## 11.1 CAP Theorem

```
In a distributed system, you can only guarantee 2 of 3:

C — Consistency    : All nodes see the same data at the same time
A — Availability   : Every request gets a response (not necessarily latest data)
P — Partition Tolerance: System works despite network partitions

⚠️ Network partitions WILL happen in distributed systems
→ Choice is really between: CP or AP

CP Systems (Consistency + Partition Tolerance):
→ Returns error or timeout if can't guarantee consistency
→ Examples: ZooKeeper, etcd, HBase, MongoDB (with strong consistency)
→ Use for: distributed locks, leader election, config management

AP Systems (Availability + Partition Tolerance):
→ Returns possibly stale data but always responds
→ Examples: Cassandra, DynamoDB, CouchDB, DNS
→ Use for: shopping carts, activity feeds, content delivery

CA Systems (Consistency + Availability):
→ Only works without partitions (single-node or LAN)
→ Traditional RDBMS on single server is effectively CA
```

## 11.2 PACELC — Beyond CAP

```
Even without partitions, there's a trade-off between Latency and Consistency:

If Partition (P):     trade-off between Availability (A) and Consistency (C)
Else (no partition):  trade-off between Latency (L) and Consistency (C)

System       P→?   else  Notes
PostgreSQL   C     C     Strongly consistent, higher latency
MySQL        C     C     Similar to PostgreSQL
DynamoDB     A     L     Eventually consistent, low latency
Cassandra    A     L     Tunable consistency, optimized for writes
MongoDB      A     L     Default, or C with w:majority
Redis        A     L     Single node: CA, Cluster: AP
```

## 11.3 Eventual Consistency

```
Eventual Consistency: given no new updates, all replicas will eventually converge

Read-your-writes: after writing, you always see your own writes
Monotonic reads: if you read value v, you never read older values after
Consistent prefix: reads see writes in order they happened

Conflicts in eventual consistency:
- Last-Write-Wins (LWW): use timestamp, latest write wins
  ❌ Clock skew can cause issues
- Vector Clocks: track causality between versions
- CRDT (Conflict-free Replicated Data Types):
  Data structures that automatically merge without conflicts
  Examples: counters, sets (add-only), last-write-wins registers
  Used by: Riak, Redis CRDT, Cassandra counters
```

---

# 12. Database Design Best Practices

## 12.1 Normalization

```
1NF (First Normal Form):
→ No repeating groups, each column atomic
❌ orders: id, product1, product2, product3  ← repeating columns
✅ order_items: order_id, product_id, quantity

2NF (Second Normal Form = 1NF + no partial dependencies):
→ Non-key attributes depend on ENTIRE primary key
❌ order_items: (order_id, product_id) → product_name  ← depends only on product_id
✅ Separate products table: product_id → product_name

3NF (Third Normal Form = 2NF + no transitive dependencies):
→ Non-key attributes depend ONLY on primary key, not on other non-key attributes
❌ employees: id, department_id, department_name  ← dept_name depends on dept_id
✅ Separate departments table: department_id → department_name

When to DENORMALIZE:
→ Read performance is critical
→ Joins are too expensive at scale
→ Data is rarely updated (reporting, analytics)
→ Store computed/aggregated values for fast reads
```

## 12.2 Schema Design Patterns

```sql
-- ── SOFT DELETE ──
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

-- "Delete" user
UPDATE users SET deleted_at = NOW() WHERE id = 1;

-- Query active users (always add this filter!)
SELECT * FROM users WHERE deleted_at IS NULL;

-- Partial index for performance
CREATE INDEX idx_users_active ON users(email) WHERE deleted_at IS NULL;

-- ── AUDIT TRAIL ──
ALTER TABLE users
ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN created_by BIGINT REFERENCES users(id),
ADD COLUMN updated_by BIGINT REFERENCES users(id);

-- Auto-update updated_at with trigger (PostgreSQL)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── OPTIMISTIC LOCKING — prevent concurrent update conflicts ──
ALTER TABLE products ADD COLUMN version INTEGER NOT NULL DEFAULT 0;

-- Update with version check
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 1 AND version = 5;    -- will fail if someone else updated

-- If 0 rows affected → conflict → retry or show error to user

-- ── POLYMORPHIC ASSOCIATIONS ──
-- Option 1: Separate nullable FK columns (simple, rigid)
CREATE TABLE comments (
    id          BIGSERIAL PRIMARY KEY,
    content     TEXT,
    post_id     BIGINT REFERENCES posts(id),       -- nullable
    product_id  BIGINT REFERENCES products(id),    -- nullable
    -- Add more as needed — gets messy
    CHECK (
        (post_id IS NOT NULL)::int +
        (product_id IS NOT NULL)::int = 1  -- exactly one must be set
    )
);

-- Option 2: Generic polymorphic (flexible, no FK constraint)
CREATE TABLE comments (
    id              BIGSERIAL PRIMARY KEY,
    content         TEXT,
    entity_type     VARCHAR(50) NOT NULL,  -- 'POST', 'PRODUCT', 'ORDER'
    entity_id       BIGINT NOT NULL,
    INDEX (entity_type, entity_id)
);

-- Option 3: Inheritance table (cleanest for complex cases)
CREATE TABLE commentable (id BIGSERIAL PRIMARY KEY);  -- abstract parent
CREATE TABLE posts     (id BIGINT PRIMARY KEY REFERENCES commentable(id), ...);
CREATE TABLE products  (id BIGINT PRIMARY KEY REFERENCES commentable(id), ...);
CREATE TABLE comments  (commentable_id BIGINT REFERENCES commentable(id), ...);
```

## 12.3 Connection Pooling

```
Application connects to DB Connection Pool (e.g., HikariCP, PgBouncer)
Pool maintains pre-established connections
→ Avoids expensive TCP + auth handshake per request

Without pool:
Request → open connection (100ms) → query (5ms) → close connection
→ 100ms overhead per request!

With pool:
Request → get connection from pool (< 1ms) → query (5ms) → return to pool
→ Negligible overhead

HikariCP settings (Spring Boot):
spring.datasource.hikari.maximum-pool-size=20    # max connections
spring.datasource.hikari.minimum-idle=5           # min idle connections
spring.datasource.hikari.connection-timeout=30000 # 30s wait for connection
spring.datasource.hikari.idle-timeout=600000      # 10min idle before close
spring.datasource.hikari.max-lifetime=1800000     # 30min max connection age

Rule of thumb: pool size = num_cores * 2 + 1
PostgreSQL max_connections: ~100-200 (depends on RAM)
For 10 app servers × 20 pool size = 200 connections → may hit limit!
Solution: PgBouncer between app and DB
```

---

# 13. Plain-English Guide — Basics for Every Developer

## 13.1 Relational Database — Đơn Giản Nhất

```
RELATIONAL DATABASE = a collection of organized spreadsheets that can talk to each other

Imagine Google Sheets, but:
  - Rows follow strict rules (can't put a name where a number is expected)
  - Rows can REFERENCE rows in other sheets (foreign keys!)
  - All changes happen safely (ACID — explained below)
  - Millions of rows work fast with proper indexing

WHAT IS A TABLE?
  A table = one concept (users, orders, products)
  Each column = one attribute (id, name, email, created_at)
  Each row    = one record (one user, one order, one product)

  TABLE: users
  ┌────┬──────────────────────┬───────────────┬────────────────────────┐
  │ id │ email                │ name          │ created_at             │
  ├────┼──────────────────────┼───────────────┼────────────────────────┤
  │  1 │ khang@example.com    │ Khang         │ 2025-01-15 08:00:00+07 │
  │  2 │ alice@example.com    │ Alice         │ 2025-02-20 09:30:00+07 │
  │  3 │ bob@example.com      │ Bob           │ 2025-03-01 14:00:00+07 │
  └────┴──────────────────────┴───────────────┴────────────────────────┘

  TABLE: orders
  ┌────┬─────────┬────────────┬────────────────────────┐
  │ id │ user_id │ total      │ status                 │
  ├────┼─────────┼────────────┼────────────────────────┤
  │ 10 │    1    │  500,000   │ CONFIRMED              │
  │ 11 │    1    │  250,000   │ SHIPPED                │
  │ 12 │    2    │ 1,200,000  │ DELIVERED              │
  └────┴─────────┴────────────┴────────────────────────┘

  user_id = 1 in orders → points to id = 1 in users (Khang)
  This is a FOREIGN KEY — the "relationship" in relational database!

WHY SPLIT INTO MULTIPLE TABLES?
  Don't duplicate: don't store user's name in EVERY order row
  If Khang changes email → update ONE place in users table
  All orders automatically see the new email (via join)
  This is called NORMALIZATION — "store each fact exactly once"

KEY CONCEPTS:
  Primary Key: unique identifier per row (id column — every table has one)
  Foreign Key: column that points to primary key of another table
  Schema:      the blueprint — table names, column names, types, constraints
```

## 13.2 NoSQL — What and Why

```
NoSQL = "Not Only SQL" — different data storage approaches
  Designed for: scale, flexibility, specific data patterns
  Trade-off: less structure, often less ACID guarantees

FOUR MAIN TYPES:

1. DOCUMENT DATABASE (MongoDB, Firestore, CouchDB)
   Store JSON-like documents — flexible, nested structure
   A "document" is like ONE row but can contain nested data

   // MongoDB document — ONE user WITH their addresses embedded
   {
     "_id": "507f1f77bcf86cd799439011",
     "email": "khang@example.com",
     "name": "Khang",
     "addresses": [                  // nested array!
       { "type": "home", "city": "HCMC", "street": "Le Loi" },
       { "type": "work", "city": "HCMC", "street": "Nguyen Hue" }
     ],
     "preferences": {                // nested object!
       "theme": "dark",
       "language": "vi"
     },
     "createdAt": "2025-01-15T08:00:00Z"
   }

   vs RELATIONAL (same data needs 3 tables + JOINs):
     users table
     user_addresses table (foreign key → users)
     user_preferences table (foreign key → users)

2. KEY-VALUE DATABASE (Redis, DynamoDB, Memcached)
   Simplest: key → value
   Like a giant dictionary/HashMap in the cloud

   SET user:1:name "Khang"
   SET session:abc123 '{"userId":1,"role":"admin"}' EX 3600
   GET user:1:name → "Khang"
   Use for: caching, sessions, counters, rate limiting

3. COLUMN-FAMILY DATABASE (Cassandra, HBase)
   Optimized for massive writes, time-series data
   Rows can have different sets of columns
   Used by: Netflix (viewing history), Instagram (timelines)

4. GRAPH DATABASE (Neo4j, Amazon Neptune)
   Nodes and relationships — best for connected data
   "Who are friends of friends of Khang who also like Java?"
   Used by: LinkedIn connections, recommendation engines

RELATIONAL vs DOCUMENT — ANALOGY:
  Relational: organized filing cabinet with strict folders
              Everything has its place, cross-references work perfectly
              Perfect for structured data with clear relationships

  Document:   flexible storage bins
              Put anything anywhere, nested structure fine
              Perfect for varied/flexible data that doesn't fit a rigid schema
```

## 13.3 ACID — Why It Matters (Real Examples)

```
ACID = 4 guarantees that make databases trustworthy
Without ACID: data corruption, lost money, inconsistent records

── A: ATOMICITY — "All or Nothing" ──

  REAL EXAMPLE: Bank Transfer
    Khang sends 500,000 VND to Alice
    
    Step 1: Deduct 500,000 from Khang's account
    Step 2: Add 500,000 to Alice's account
    
    What if server crashes after Step 1 but BEFORE Step 2?
    
    WITHOUT ATOMICITY:
      Khang's balance: -500,000  ← money deducted!
      Alice's balance: unchanged ← money never arrived!
      500,000 VND vanishes into thin air!
    
    WITH ATOMICITY:
      Both steps succeed → money transferred ✅
      OR crash after Step 1 → BOTH steps rolled back ✅
      Khang's balance restored, Alice unchanged
      Never a partial state!

  CODE:
  BEGIN;  -- start transaction
    UPDATE accounts SET balance = balance - 500000 WHERE user_id = 1;
    UPDATE accounts SET balance = balance + 500000 WHERE user_id = 2;
  COMMIT; -- ONLY if both succeed!
  -- If anything fails → automatic ROLLBACK (both undone)

── C: CONSISTENCY — "Valid State Always" ──

  Rules (constraints) are ALWAYS enforced:
    - balance cannot go below 0 (CHECK constraint)
    - email must be unique (UNIQUE constraint)
    - every order MUST have a valid user_id (FOREIGN KEY)
  
  Without consistency:
    Two users could register with same email
    Orders could exist for deleted users
    Account balances could go negative
  
  Atomicity alone isn't enough → you need constraints too!

── I: ISOLATION — "Transactions Don't Interfere" ──

  Two people buy the last concert ticket AT THE SAME TIME:
    
    WITHOUT ISOLATION:
      User A reads: "1 ticket available" ← both see 1 ticket!
      User B reads: "1 ticket available"
      User A buys: ticket count = 0
      User B buys: ticket count = -1  ← OVERSOLD!
    
    WITH ISOLATION:
      User A's transaction runs completely → ticket count = 0
      User B's transaction then reads count = 0 → "sorry, sold out!"
      OR: use FOR UPDATE lock → second buyer waits for first to finish

── D: DURABILITY — "Committed = Permanent" ──

  After you see "Payment Successful":
    Even if server crashes immediately after
    Even if power goes out
    Data IS saved and will be there when server restarts
  
  HOW: Write-Ahead Log (WAL)
    DB writes change to WAL on disk BEFORE confirming to you
    On startup after crash: replay WAL to restore state
    Your "successful" transaction is never lost

── WHAT NOSQL SACRIFICES FOR PERFORMANCE ──
  Many NoSQL databases choose:
  - Eventual Consistency (not immediate)
  - No multi-document transactions
  - No ACID guarantees across documents
  
  Why? Because ACID requires coordination = slower at massive scale
  "BASE" (Basically Available, Soft state, Eventually consistent)
  
  WHEN ACID IS NOT CRITICAL:
    Social media likes/views (slight inconsistency OK, speed matters)
    Shopping cart (eventual consistency fine for most cases)
    Event logging (append-only, no coordination needed)
  
  WHEN ACID IS CRITICAL:
    Financial transactions (ALWAYS use ACID!)
    Inventory management (can't oversell)
    User registration (email uniqueness MUST be enforced)
    Medical records (consistency is life-or-death)
```

## 13.4 How Queries Retrieve Data — Simple Mental Model

```
WHAT HAPPENS WHEN YOU RUN: SELECT * FROM users WHERE email = 'khang@test.com'

WITHOUT INDEX — Full Table Scan:
  Database reads every single row, one by one
  Checks: "is this row's email = 'khang@test.com'?"
  If yes → add to results
  If no → skip and continue
  
  With 1,000,000 users: reads ALL 1,000,000 rows
  Even to find ONE user!
  Time: O(n) — proportional to number of rows

  Analogy: finding a name in a book by reading EVERY PAGE
  (very slow for 1000-page book!)

WITH INDEX — Index Lookup:
  Database looks up email in the index (B-Tree data structure)
  Index stores: email → exact location of row on disk
  
  Jump DIRECTLY to the right row
  Time: O(log n) — logarithmic
  
  With 1,000,000 users: ~20 comparisons to find the row!
  (log₂(1,000,000) ≈ 20)
  
  Analogy: looking up a name using a book's INDEX AT THE BACK
  "Smith → page 847" → jump straight there!

WHAT IS AN INDEX ACTUALLY?
  A separate data structure maintained by the database
  Like a sorted copy of one column with pointers to the real rows
  
  Index on users.email:
  ┌─────────────────────────────┬─────────────┐
  │ email (sorted!)             │ row pointer │
  ├─────────────────────────────┼─────────────┤
  │ alice@example.com           │ row #2      │
  │ bob@example.com             │ row #3      │
  │ khang@example.com           │ row #1      │ ← binary search finds this fast!
  └─────────────────────────────┴─────────────┘
  
  Because it's sorted → binary search works → O(log n)!

INDEX TRADE-OFF:
  BENEFIT: fast SELECT/WHERE/JOIN (reads)
  COST:    slower INSERT/UPDATE/DELETE (must update the index too)
           uses extra disk space
  
  Rule of thumb:
    Columns you often filter by → add index
    Columns you rarely filter by → no index (just slows writes)
    Tables you write to 1000x/sec with few reads → be careful with indexes!
```

---

# 14. Practical Schema Navigation

## 14.1 Inspecting Database Structure (PostgreSQL)

```sql
-- ── LIST ALL TABLES ──
\dt                              -- psql: list all tables
\dt public.*                     -- tables in public schema
\dt orders.*                     -- tables matching pattern

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ── DESCRIBE A TABLE (show columns) ──
\d users                         -- psql: full table description (columns + indexes!)
\d+ users                        -- more detail (storage, comments)

-- Standard SQL:
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ── SEE TABLE SIZE ──
SELECT
    relname AS table,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- ── LIST ALL INDEXES ON A TABLE ──
\di users*                       -- psql: indexes for users

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'orders';

-- ── LIST FOREIGN KEYS ──
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name  AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ── COUNT ROWS IN EACH TABLE (fast estimate) ──
SELECT relname AS table, reltuples::bigint AS estimated_rows
FROM pg_class
WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
ORDER BY reltuples DESC;

-- ── SEE RUNNING QUERIES ──
SELECT pid, now() - query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- ── KILL LONG-RUNNING QUERY ──
SELECT pg_cancel_backend(pid);   -- graceful cancel
SELECT pg_terminate_backend(pid); -- force terminate
```

## 14.2 Inspecting MySQL Schema

```sql
-- ── LIST ALL DATABASES & TABLES ──
SHOW DATABASES;
USE mydb;
SHOW TABLES;

-- ── DESCRIBE TABLE ──
DESCRIBE users;                  -- columns + types
SHOW FULL COLUMNS FROM users;   -- with comments, privileges
SHOW CREATE TABLE users;        -- full CREATE TABLE statement (shows indexes too!)

-- ── SHOW INDEXES ──
SHOW INDEX FROM orders;

-- ── TABLE SIZE ──
SELECT
    table_name,
    ROUND(data_length / 1024 / 1024, 2) AS data_mb,
    ROUND(index_length / 1024 / 1024, 2) AS index_mb,
    table_rows AS estimated_rows
FROM information_schema.tables
WHERE table_schema = 'mydb'
ORDER BY (data_length + index_length) DESC;
```

## 14.3 Navigating MongoDB Collections

```javascript
// ── LIST ALL COLLECTIONS ──
show collections          // mongo shell
db.listCollections().toArray()  // programmatic

// ── INSPECT DOCUMENT STRUCTURE (sample) ──
db.users.findOne()        // see one document's structure
db.users.find().limit(3).pretty()  // formatted output

// ── COUNT DOCUMENTS ──
db.users.countDocuments()
db.users.countDocuments({ status: "active" })
db.orders.estimatedDocumentCount()  // fast estimate (uses metadata)

// ── COLLECTION STATS ──
db.orders.stats()         // size, count, index sizes

// ── LIST INDEXES ──
db.users.getIndexes()

// ── SAMPLE DOCUMENTS (see variety of shapes) ──
db.users.aggregate([{ $sample: { size: 5 } }])  // random 5 docs

// ── FIND DISTINCT VALUES IN A FIELD ──
db.users.distinct("status")         // ["active", "inactive", "banned"]
db.orders.distinct("paymentMethod") // ["card", "transfer", "cod"]

// ── GET FIELD NAMES THAT EXIST ──
db.users.aggregate([
  { $project: { keys: { $objectToArray: "$$ROOT" } } },
  { $unwind: "$keys" },
  { $group: { _id: "$keys.k" } }
])
// Shows all field names used across documents
```

---

# 15. Index Impact — Concrete Before/After Examples

## 15.1 Why a Query Is Slow — Step by Step

```sql
-- SCENARIO: orders table with 5,000,000 rows
-- User complaint: "The orders report takes 30 seconds!"

-- THE SLOW QUERY:
SELECT user_id, status, SUM(total) as revenue
FROM orders
WHERE status = 'DELIVERED'
  AND created_at >= '2025-01-01'
GROUP BY user_id, status
ORDER BY revenue DESC
LIMIT 100;

-- STEP 1: Run EXPLAIN ANALYZE to see the problem
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, status, SUM(total) as revenue
FROM orders
WHERE status = 'DELIVERED' AND created_at >= '2025-01-01'
GROUP BY user_id, status
ORDER BY revenue DESC LIMIT 100;

-- OUTPUT (BAD):
-- Limit  (cost=89234.56..89234.81 rows=100)
--   -> Sort  (cost=89234.56..89284.56 rows=20000)
--       -> HashAggregate  (cost=87500.00..88500.00 rows=20000)
--           -> Seq Scan on orders  (cost=0.00..85000.00 rows=500000)
--                Filter: ((status='DELIVERED') AND (created_at >= '2025-01-01'))
--                Rows Removed by Filter: 4500000
-- Execution Time: 28,450 ms   ← 28 SECONDS!

-- "Seq Scan on orders" = reading ALL 5M rows
-- "Rows Removed by Filter: 4,500,000" = threw away 90% of what it read
-- This is the PROBLEM

-- STEP 2: Add the right index
CREATE INDEX idx_orders_status_created
    ON orders(status, created_at DESC)
    INCLUDE (user_id, total);

-- STEP 3: Run EXPLAIN again
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, status, SUM(total) as revenue
FROM orders
WHERE status = 'DELIVERED' AND created_at >= '2025-01-01'
GROUP BY user_id, status ORDER BY revenue DESC LIMIT 100;

-- OUTPUT (GOOD):
-- Limit  (cost=1234.56..1234.81 rows=100)
--   -> Sort  (cost=1234.56..1284.56 rows=20000)
--       -> HashAggregate  (cost=500.00..600.00 rows=20000)
--           -> Index Only Scan on idx_orders_status_created
--                Index Cond: ((status='DELIVERED') AND (created_at >= '2025-01-01'))
--                Rows Removed by Filter: 0
-- Execution Time: 45 ms   ← 45 MILLISECONDS!

-- 28,450ms → 45ms = 632x improvement!
-- "Index Only Scan" = reading ONLY the index (no table access!)
-- "Rows Removed by Filter: 0" = index returned exactly what was needed
```

## 15.2 Common Slow Query Patterns & Fixes

```sql
-- ── PATTERN 1: Missing index on foreign key ──
-- Symptom: "select all orders for user X" is slow
SELECT * FROM orders WHERE user_id = 12345;
-- EXPLAIN shows: Seq Scan on orders (reads ALL orders!)

-- Fix:
CREATE INDEX idx_orders_user_id ON orders(user_id);
-- Now: Index Scan → jumps directly to user 12345's orders

-- ── PATTERN 2: Function on indexed column kills index ──
-- SLOW: function wraps the column → index can't be used!
SELECT * FROM users WHERE LOWER(email) = 'khang@example.com';
SELECT * FROM orders WHERE DATE(created_at) = '2025-01-15';
SELECT * FROM users WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- Fix Option A: store data normalized (always lowercase email at insert time)
SELECT * FROM users WHERE email = 'khang@example.com';  -- index works!

-- Fix Option B: create functional index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
-- Now LOWER(email) = '...' uses this index

-- Fix Option C: rewrite query
SELECT * FROM orders
WHERE created_at >= '2025-01-15'
  AND created_at < '2025-01-16';   -- range query instead of DATE()!
SELECT * FROM users
WHERE created_at >= '2025-01-01'
  AND created_at < '2026-01-01';   -- range instead of EXTRACT(YEAR)

-- ── PATTERN 3: LIKE with leading wildcard ──
-- SLOW: leading % means "starts with anything" → can't use B-tree index!
SELECT * FROM products WHERE name LIKE '%laptop%';
SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- Fix: full-text search or trigram index
-- PostgreSQL trigram (pg_trgm extension):
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
-- Now LIKE '%laptop%' uses this index!

-- Or: full-text search
CREATE INDEX idx_products_fts ON products
    USING GIN (to_tsvector('english', name || ' ' || description));
SELECT * FROM products
WHERE to_tsvector('english', name || ' ' || description)
    @@ to_tsquery('english', 'laptop');

-- ── PATTERN 4: Wrong composite index column order ──
-- Query: WHERE user_id = 5 AND created_at > '2025-01-01'
-- BAD index (range column first!):
CREATE INDEX idx_wrong ON orders(created_at, user_id);
-- Only uses created_at part of index, then scans all those rows for user_id

-- GOOD index (equality columns FIRST, range columns LAST):
CREATE INDEX idx_correct ON orders(user_id, created_at);
-- Uses user_id (equality) → then filters by created_at (range)

-- ── PATTERN 5: N+1 Problem in SQL ──
-- N+1: 1 query to get users + N queries to get their order count
-- Each extra query = roundtrip to DB = expensive!
SELECT * FROM users WHERE department_id = 3;
-- then for EACH user:
SELECT COUNT(*) FROM orders WHERE user_id = ?;
-- 50 users = 51 queries!

-- Fix: single JOIN query
SELECT
    u.id,
    u.name,
    COUNT(o.id) as order_count,
    COALESCE(SUM(o.total), 0) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.department_id = 3
GROUP BY u.id, u.name;
-- 1 query for 50 users!

-- ── PATTERN 6: SELECT * preventing index-only scan ──
-- SELECT *: must read ALL columns → must access actual table rows
SELECT * FROM orders WHERE user_id = 5;

-- If you only need specific columns → covering index possible:
CREATE INDEX idx_orders_user_covering ON orders(user_id)
    INCLUDE (status, total, created_at);

SELECT status, total, created_at FROM orders WHERE user_id = 5;
-- → Index Only Scan! Never touches the table rows at all!

-- ── DIAGNOSING WITH pg_stat_statements ──
-- Enable: shared_preload_libraries = 'pg_stat_statements' in postgresql.conf
SELECT
    query,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS avg_ms,
    ROUND(total_exec_time::numeric, 2) AS total_ms,
    rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
-- THE most useful tool for finding slow queries in production!

-- ── DIAGNOSING WITH auto_explain ──
-- Log slow query plans automatically:
-- postgresql.conf:
-- shared_preload_libraries = 'auto_explain'
-- auto_explain.log_min_duration = 1000  -- log queries > 1 second
-- auto_explain.log_analyze = true
-- auto_explain.log_buffers = true
```

---

# 16. Normalization vs NoSQL Flexibility — Feature Comparison

## 16.1 Practical Feature Examples

```
FEATURE: User Profile with Address
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RELATIONAL APPROACH:
  Table: users  (id, name, email, phone)
  Table: addresses (id, user_id, type, street, city, country, is_default)
  
  Get user with addresses:
  SELECT u.*, a.street, a.city, a.type
  FROM users u
  LEFT JOIN addresses a ON a.user_id = u.id
  WHERE u.id = 1;
  
  PROS: addresses normalized, easy to query "all users in HCMC"
  CONS: need JOIN for simple profile display

DOCUMENT APPROACH (MongoDB):
  {
    _id: "user123",
    name: "Khang",
    email: "khang@example.com",
    addresses: [                      // embedded array!
      { type: "home", street: "Le Loi", city: "HCMC" },
      { type: "work", street: "Nguyen Hue", city: "HCMC" }
    ]
  }
  
  Get user profile: db.users.findOne({_id: "user123"})
  → one query, no JOIN needed!
  
  PROS: natural structure, fast single-doc read
  CONS: harder to query "all users in HCMC" (need to index nested field)
  
  VERDICT: document wins for "show user profile" pattern
           relational wins for "find all users in city X" analytics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURE: E-commerce Orders
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RELATIONAL APPROACH:
  orders      (id, user_id, total, status, created_at)
  order_items (id, order_id, product_id, quantity, unit_price)
  products    (id, name, current_price, stock)
  
  Get order with items:
  SELECT o.*, oi.quantity, oi.unit_price, p.name
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  WHERE o.id = 42;
  
  PROS: unit_price preserved (historical!), stock tracked separately,
        powerful queries (top products by revenue, etc.)
  CONS: 3-table JOIN to display one order

DOCUMENT APPROACH:
  {
    _id: "order_42",
    userId: "user_1",
    status: "CONFIRMED",
    items: [
      { name: "Laptop", quantity: 1, unitPrice: 25000000 },
      { name: "Mouse",  quantity: 2, unitPrice: 500000   }
    ],
    total: 26000000,
    createdAt: ISODate("2025-05-01")
  }
  
  PROS: self-contained document, fast order display
  CONS: if product name changes → order shows old name (may be desired!)
         harder to do "total revenue by product" analytics

  VERDICT: relational usually better for orders
           (financial data + analytics + integrity)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURE: Product Catalog with Variable Attributes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RELATIONAL PROBLEM:
  Products have very different attributes:
    Laptop: CPU, RAM, SSD, display_size, weight
    T-Shirt: size, color, material, fit
    Book:    author, ISBN, pages, language
  
  Solutions in relational (all messy!):
    Option A: Add ALL possible columns → 90% NULL values
    Option B: attribute-value table (EAV) → complex, slow queries
    Option C: JSON column in relational table (hybrid!)

  Actually works in PostgreSQL with JSONB:
  CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    category VARCHAR(50),
    price NUMERIC(19,4),
    attributes JSONB           -- flexible!
  );
  CREATE INDEX idx_products_attrs ON products USING GIN(attributes);
  
  -- Laptop:
  INSERT INTO products (name, category, price, attributes)
  VALUES ('Dell XPS 15', 'laptop', 35000000,
    '{"cpu":"i7","ram_gb":16,"ssd_gb":512,"display":"15.6 inch"}');
  
  -- T-Shirt:
  INSERT INTO products (name, category, price, attributes)
  VALUES ('Basic Tee', 'clothing', 200000,
    '{"sizes":["S","M","L","XL"],"color":"white","material":"cotton"}');
  
  -- Query by attribute:
  SELECT * FROM products
  WHERE attributes @> '{"ram_gb": 16}';  -- uses GIN index!

DOCUMENT APPROACH (MongoDB) — NATURAL FIT:
  { name: "Dell XPS 15", cpu: "i7", ram_gb: 16, ssd_gb: 512 }
  { name: "Basic Tee", sizes: ["S","M","L"], color: "white" }
  
  VERDICT: Document DB wins for variable schema products
           PostgreSQL JSONB is a solid middle ground

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURE: User Activity Feed / Timeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RELATIONAL CHALLENGE:
  A social feed mixes: posts, likes, comments, follows, shares
  Each event type has different columns
  High write volume (millions of events/hour)
  Reading latest 20 events across types = complex query

DOCUMENT WINS:
  events collection (MongoDB/Cassandra):
  { type: "post",    userId: "u1", content: "Hello!", ts: ... }
  { type: "like",    userId: "u2", targetId: "post_1", ts: ... }
  { type: "follow",  userId: "u3", targetId: "u1", ts: ... }
  { type: "comment", userId: "u4", postId: "post_1", text: "Nice!" }
  
  All in one collection → simple query:
  db.events.find({ userId: "u1" }).sort({ ts: -1 }).limit(20)
  
  VERDICT: Document/wide-column DB (Cassandra) wins for feeds
           Cassandra specifically designed for time-series append
```

---

# 17. Data Model Design — Practical Guide

## 17.1 Decision Framework: Relational vs NoSQL

```
CHOOSE RELATIONAL (PostgreSQL/MySQL) WHEN:
  ✅ Data has clear relationships (orders → order_items → products → users)
  ✅ ACID transactions required (finance, inventory, medical records)
  ✅ Complex queries and reporting needed (JOINs, GROUP BY, aggregations)
  ✅ Data is structured and consistent (same fields for every row)
  ✅ Need to enforce constraints (unique email, non-negative balance)
  ✅ Team knows SQL well
  ✅ Scale: millions to ~100M rows (with proper indexing + partitioning)
  
  Examples: 
    Banking system, e-commerce orders, HR system,
    inventory management, any system needing audit trail

CHOOSE DOCUMENT DB (MongoDB) WHEN:
  ✅ Flexible/varying schema (products with different attributes)
  ✅ Hierarchical/nested data naturally (user + embedded preferences)
  ✅ Rapid prototyping (schema changes are easy)
  ✅ "Document = one screen of data" pattern (no JOINs needed to render UI)
  ✅ Team works in JavaScript/JSON naturally
  ✅ High write throughput, eventual consistency OK
  
  Examples:
    Content management, product catalog, user profiles,
    mobile apps, blogs, event logs

CHOOSE KEY-VALUE (Redis) WHEN:
  ✅ Caching (store expensive query results)
  ✅ Session storage
  ✅ Rate limiting counters
  ✅ Real-time leaderboards (sorted sets)
  ✅ Pub/Sub messaging
  ✅ Need microsecond response time
  ✅ Data can be rebuilt if lost (cache)

CHOOSE COLUMN-FAMILY (Cassandra) WHEN:
  ✅ Massive write throughput (millions/sec)
  ✅ Time-series data (metrics, events, logs)
  ✅ Need to scale to multiple datacenters easily
  ✅ Queries always include partition key (no arbitrary queries)
  ✅ Can accept eventual consistency

CHOOSE GRAPH DB (Neo4j) WHEN:
  ✅ Relationships ARE the data (social network, recommendation engine)
  ✅ Variable-depth traversals ("friends of friends of friends")
  ✅ Pattern matching in connected data

PRACTICAL RULE: "When in doubt, start with PostgreSQL"
  You can always add a cache layer (Redis) later
  You can add MongoDB for specific flexible-schema parts
  PostgreSQL can do more than most teams realize:
    - JSONB for semi-structured data
    - Full-text search
    - Partitioning for scale
    - Replication for HA
```

## 17.2 Designing Small-Scale Data Models

```sql
-- ── EXAMPLE 1: E-COMMERCE MINI (Start Here) ──

-- Step 1: Identify entities
-- Users, Products, Orders, OrderItems, Categories

-- Step 2: Identify relationships
-- User places Order (1:many)
-- Order contains OrderItems (1:many)  
-- OrderItem is a Product (many:1)
-- Product belongs to Category (many:1)

-- Step 3: Write the schema

CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,  -- url-friendly name
    parent_id   INT REFERENCES categories(id)  -- self-reference for subcategories
);

CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    sku         VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       NUMERIC(19, 4) NOT NULL CHECK (price >= 0),
    stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED')),
    subtotal    NUMERIC(19, 4) NOT NULL,
    discount    NUMERIC(19, 4) NOT NULL DEFAULT 0,
    total       NUMERIC(19, 4) NOT NULL,
    address     JSONB NOT NULL,               -- snapshot of delivery address
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,       -- snapshot (product may change later)
    unit_price  NUMERIC(19, 4) NOT NULL,      -- snapshot of price at time of order!
    quantity    INT NOT NULL CHECK (quantity > 0),
    subtotal    NUMERIC(19, 4) NOT NULL       -- unit_price * quantity
);

-- Step 4: Add indexes for common queries
CREATE INDEX idx_products_category   ON products(category_id) WHERE is_active = true;
CREATE INDEX idx_products_search     ON products USING GIN(to_tsvector('english', name));
CREATE INDEX idx_orders_user         ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status       ON orders(status, created_at DESC);
CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Step 5: Think about common queries and check they use indexes
-- "Show my orders" → idx_orders_user ✓
-- "Show orders by status" → idx_orders_status ✓
-- "Search products" → idx_products_search ✓
-- "Order detail with items" → idx_order_items_order ✓
```

```sql
-- ── EXAMPLE 2: BLOG / CONTENT PLATFORM ──

CREATE TABLE authors (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    bio         TEXT,
    avatar_url  TEXT
);

CREATE TABLE posts (
    id          BIGSERIAL PRIMARY KEY,
    author_id   BIGINT NOT NULL REFERENCES authors(id),
    title       VARCHAR(500) NOT NULL,
    slug        VARCHAR(500) NOT NULL UNIQUE,
    content     TEXT,
    summary     VARCHAR(1000),
    status      VARCHAR(20) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    published_at TIMESTAMPTZ,
    tags        TEXT[],                       -- PostgreSQL array for tags!
    view_count  INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id   BIGINT REFERENCES authors(id) ON DELETE SET NULL,
    parent_id   BIGINT REFERENCES comments(id) ON DELETE CASCADE, -- nested comments!
    content     TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes:
CREATE INDEX idx_posts_author      ON posts(author_id, published_at DESC);
CREATE INDEX idx_posts_published   ON posts(published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX idx_posts_tags        ON posts USING GIN(tags);          -- array search
CREATE INDEX idx_posts_fts         ON posts USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(summary, '')));
CREATE INDEX idx_comments_post     ON comments(post_id, created_at ASC);
CREATE INDEX idx_comments_parent   ON comments(parent_id) WHERE parent_id IS NOT NULL;

-- Common queries check:
-- "Latest published posts" → idx_posts_published ✓
-- "Posts by author" → idx_posts_author ✓
-- "Posts with tag 'java'" → idx_posts_tags (WHERE 'java' = ANY(tags)) ✓
-- "Search posts" → idx_posts_fts ✓
-- "Comments for post" → idx_comments_post ✓
-- "Replies to comment" → idx_comments_parent ✓
```

```javascript
// ── EXAMPLE 3: SAME BLOG IN MONGODB ──
// When to choose this over PostgreSQL above?
// - Content has very different structures per post type
// - Need to store arbitrary metadata per post
// - Team prefers working in JSON/JS

// Collection: posts
{
  _id: ObjectId("..."),
  title: "Getting Started with Java Streams",
  slug: "java-streams-guide",
  author: {                          // EMBEDDED (not referenced)
    _id: ObjectId("..."),
    username: "khang",
    displayName: "Khang"
  },
  content: "...",
  status: "published",
  publishedAt: ISODate("2025-05-01"),
  tags: ["java", "streams", "functional"],
  metadata: {                        // flexible!
    readingTimeMinutes: 8,
    coverImageUrl: "...",
    series: "Java Deep Dive",
    seriesPart: 3
  },
  viewCount: 1250,
  commentCount: 23,                  // denormalized counter (avoid COUNT query)
  updatedAt: ISODate("2025-05-02")
}

// Indexes:
db.posts.createIndex({ publishedAt: -1, status: 1 })
db.posts.createIndex({ tags: 1 })       // array index (automatic in Mongo)
db.posts.createIndex({ "author._id": 1 })
db.posts.createIndex(
  { title: "text", content: "text" },   // full-text search
  { weights: { title: 10, content: 1 }} // title matches count 10x more
)

// Collection: comments (separate — comments can be large!)
{
  _id: ObjectId("..."),
  postId: ObjectId("post_id"),          // reference to posts collection
  parentId: null,                        // null = top-level, or ObjectId for replies
  author: { _id: ..., username: "alice" },
  content: "Great article!",
  isApproved: true,
  createdAt: ISODate("2025-05-01")
}

db.comments.createIndex({ postId: 1, createdAt: 1 })
db.comments.createIndex({ parentId: 1 })
```

## 17.3 Implementing Indexes Effectively — Checklist

```sql
-- ── INDEXING STRATEGY CHECKLIST ──

-- STEP 1: Always index foreign keys
-- JOINs on unindexed FK = full table scan on the FK side!
CREATE INDEX idx_orders_user_id     ON orders(user_id);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_posts_author_id    ON posts(author_id);

-- STEP 2: Index columns in frequent WHERE clauses
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_users_email   ON users(email);   -- login lookup
CREATE INDEX idx_posts_slug    ON posts(slug);    -- URL routing

-- STEP 3: For filtering + sorting, composite index (filter first, then sort)
-- "Latest PENDING orders for user X"
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at DESC);
-- Supports: WHERE user_id = ? → O(log n)
--           WHERE user_id = ? AND status = ? → O(log n)
-- (created_at DESC for ORDER BY without extra sort step)

-- STEP 4: For analytics queries, consider partial indexes
-- "Find all PENDING orders" (only 5% of orders are PENDING)
CREATE INDEX idx_orders_pending ON orders(created_at DESC)
    WHERE status = 'PENDING';
-- Much smaller than full status index!

-- STEP 5: Use INCLUDE for covering indexes
CREATE INDEX idx_orders_user_covering ON orders(user_id, created_at DESC)
    INCLUDE (status, total);
-- SELECT status, total FROM orders WHERE user_id = ? ORDER BY created_at
-- → Index Only Scan! Never reads the actual table rows

-- STEP 6: Unique indexes for business constraints
CREATE UNIQUE INDEX idx_users_email        ON users(email);
CREATE UNIQUE INDEX idx_users_username     ON users(username);
CREATE UNIQUE INDEX idx_order_items_unique ON order_items(order_id, product_id);
-- Also enforces constraint: one row per product per order

-- STEP 7: Check indexes regularly — remove unused ones
SELECT
    schemaname || '.' || relname AS table,
    indexrelname AS index,
    idx_scan AS times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
-- idx_scan = 0 → index NEVER used → consider dropping (frees space + speeds up writes!)

-- STEP 8: Build indexes concurrently in production (no lock!)
CREATE INDEX CONCURRENTLY idx_orders_status_created
    ON orders(status, created_at DESC);
-- Regular CREATE INDEX locks the table!
-- CONCURRENTLY: no lock but takes longer

-- ── INDEX ANTI-PATTERNS TO AVOID ──

-- ❌ Indexing every column "just in case"
-- Each index = overhead on every INSERT/UPDATE/DELETE
-- 10 indexes on orders table → every new order updates 10 B-trees!

-- ❌ Composite index with wrong column order
-- For: WHERE user_id = ? AND created_at > ?
-- ❌ Wrong:   INDEX(created_at, user_id)   -- created_at range kills user_id use
-- ✅ Correct: INDEX(user_id, created_at)   -- equality first, range second

-- ❌ Index on low-cardinality column (rarely worth it)
-- gender has 2-3 values → query still reads 33-50% of table
-- status with 3 values on 10M row table → each status = 3.3M rows
-- Exception: partial index IS useful here:
CREATE INDEX idx_orders_pending ON orders(user_id) WHERE status = 'PENDING';
-- → Only indexes the 5% of orders that are PENDING

-- ❌ Redundant indexes (subset of another)
CREATE INDEX idx_orders_a     ON orders(user_id, status, created_at);  -- covers:
CREATE INDEX idx_orders_b     ON orders(user_id, status);              -- ← REDUNDANT
CREATE INDEX idx_orders_c     ON orders(user_id);                      -- ← REDUNDANT
-- idx_orders_a already handles queries that idx_b and idx_c would handle!
-- Keep only idx_orders_a (most specific)

-- ── QUICK REFERENCE: WHAT TO INDEX ──
-- ✅ Primary keys (automatic in PostgreSQL/MySQL)
-- ✅ Foreign keys (NOT automatic — add manually!)
-- ✅ Columns in WHERE clauses (high selectivity)
-- ✅ Columns in JOIN conditions
-- ✅ Columns in ORDER BY (if also filtering)
-- ✅ Unique constraints (email, username, slug)
-- ❌ Boolean columns alone (low cardinality)
-- ❌ Columns almost never queried
-- ❌ Very frequently updated columns (high write overhead)
-- ❌ Small tables (< ~1000 rows — full scan is fine!)
```

---

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| PostgreSQL Docs | <https://www.postgresql.org/docs/current/> |
| PostgreSQL Tutorial | <https://www.postgresqltutorial.com/> |
| MySQL 8.0 Docs | <https://dev.mysql.com/doc/refman/8.0/en/> |
| PostgreSQL Partitioning | <https://www.postgresql.org/docs/current/ddl-partitioning.html> |
| PostgreSQL Replication | <https://www.postgresql.org/docs/current/high-availability.html> |
| PostgreSQL Indexes | <https://www.postgresql.org/docs/current/indexes.html> |
| PostgreSQL EXPLAIN | <https://www.postgresql.org/docs/current/sql-explain.html> |
| PostgreSQL Transactions | <https://www.postgresql.org/docs/current/transaction-iso.html> |
| Redis Data Types | <https://redis.io/docs/data-types/> |
| Redis Commands | <https://redis.io/commands/> |
| Redis Patterns | <https://redis.io/docs/manual/patterns/> |
| Redis Cluster | <https://redis.io/docs/manual/scaling/> |
| MongoDB Docs | <https://www.mongodb.com/docs/> |
| MongoDB Aggregation | <https://www.mongodb.com/docs/manual/aggregation/> |
| Use the Index, Luke | <https://use-the-index-luke.com/> |
| pganalyze | <https://pganalyze.com/docs> |

---

*Học theo thứ tự: Plain-English Basics (13) → Schema Navigation (14) → Basic SQL (2) → Index Impact (15) → Normalization vs NoSQL (16) → Data Model Design (17) → Transactions/ACID (4) → Query Optimization (5) → Partitioning → Replication → Sharding → Redis*
