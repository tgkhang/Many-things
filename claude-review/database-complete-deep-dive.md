# 🗄️ Database Complete Deep Dive
> SQL, Partitioning, Sharding, Replication, NoSQL, Query Optimization, Redis

> 📖 PostgreSQL Docs: https://www.postgresql.org/docs/current/
> 📖 MySQL Docs: https://dev.mysql.com/doc/refman/8.0/en/
> 📖 Redis Docs: https://redis.io/docs/

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

> 📖 https://www.postgresql.org/docs/current/sql.html

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

> 📖 https://www.postgresql.org/docs/current/indexes.html

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

> 📖 https://www.postgresql.org/docs/current/transaction-iso.html

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

> 📖 https://www.postgresql.org/docs/current/performance-tips.html

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

> 📖 https://www.postgresql.org/docs/current/ddl-partitioning.html

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

> 📖 https://www.postgresql.org/docs/current/high-availability.html

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

> 📖 https://www.mongodb.com/docs/
> 📖 https://cassandra.apache.org/doc/

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

> 📖 https://redis.io/docs/data-types/
> 📖 https://redis.io/docs/manual/patterns/

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

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| PostgreSQL Docs | https://www.postgresql.org/docs/current/ |
| PostgreSQL Tutorial | https://www.postgresqltutorial.com/ |
| MySQL 8.0 Docs | https://dev.mysql.com/doc/refman/8.0/en/ |
| PostgreSQL Partitioning | https://www.postgresql.org/docs/current/ddl-partitioning.html |
| PostgreSQL Replication | https://www.postgresql.org/docs/current/high-availability.html |
| PostgreSQL Indexes | https://www.postgresql.org/docs/current/indexes.html |
| PostgreSQL EXPLAIN | https://www.postgresql.org/docs/current/sql-explain.html |
| PostgreSQL Transactions | https://www.postgresql.org/docs/current/transaction-iso.html |
| Redis Data Types | https://redis.io/docs/data-types/ |
| Redis Commands | https://redis.io/commands/ |
| Redis Patterns | https://redis.io/docs/manual/patterns/ |
| Redis Cluster | https://redis.io/docs/manual/scaling/ |
| MongoDB Docs | https://www.mongodb.com/docs/ |
| MongoDB Aggregation | https://www.mongodb.com/docs/manual/aggregation/ |
| Use the Index, Luke | https://use-the-index-luke.com/ |
| pganalyze | https://pganalyze.com/docs |

---

*Học theo thứ tự: SQL cơ bản → Indexes → Transactions → Query optimization → Partitioning → Replication → Sharding → NoSQL → Redis*
