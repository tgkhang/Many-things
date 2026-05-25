# ⚡ Apache Kafka — Complete Deep Dive
>
> Architecture, Internals, Patterns, Real-World Use Cases, Common Mistakes

---

## 📚 Table of Contents

1. [Why Kafka Exists](#1-why-kafka-exists)
2. [Kafka Architecture](#2-kafka-architecture)
3. [Topics, Partitions & Offsets](#3-topics-partitions--offsets)
4. [Producers — Deep Dive](#4-producers--deep-dive)
5. [Consumers & Consumer Groups](#5-consumers--consumer-groups)
6. [Kafka Replication & Fault Tolerance](#6-kafka-replication--fault-tolerance)
7. [Delivery Guarantees](#7-delivery-guarantees)
8. [Kafka Transactions](#8-kafka-transactions)
9. [Kafka Streams](#9-kafka-streams)
10. [Kafka Connect](#10-kafka-connect)
11. [Schema Registry & Avro](#11-schema-registry--avro)
12. [Performance & Tuning](#12-performance--tuning)
13. [Real-World Use Cases & Study Cases](#13-real-world-use-cases--study-cases)
14. [Common Mistakes & Anti-Patterns](#14-common-mistakes--anti-patterns)
15. [Kafka vs Alternatives](#15-kafka-vs-alternatives)
16. [Operations & Monitoring](#16-operations--monitoring)

---

# 1. Why Kafka Exists

## 1.1 The Problem Before Kafka

```
BEFORE KAFKA — point-to-point integrations (spaghetti):

  Service A ──────────────────────────────────▶ Service B
  Service A ──────────────────────────────────▶ Service C
  Service A ──────────────────────────────────▶ Service D
  Service B ──────────────────────────────────▶ Service C
  Service B ──────────────────────────────────▶ Service D
  ...

  n services → n×(n-1)/2 connections!
  10 services → 45 pipelines to manage
  100 services → 4950 pipelines!

PROBLEMS:
  Tight coupling: Service A must know about B, C, D
  Fragile: if B is down, A might fail or lose data
  No replay: if C was down, it misses data sent to it
  Different speeds: fast producer overwhelms slow consumer
  No audit: data sent, data gone
  Scaling: each connection scaled independently
  Protocol mismatch: A speaks REST, B expects gRPC, C needs files

LINKEDIN'S PROBLEM (where Kafka was born, 2010-2011):
  800M+ events/day (activity data, metrics, logs)
  Needed: high throughput, fault tolerance, real-time, replay, multi-consumer
  Existing solutions (ActiveMQ, RabbitMQ) couldn't handle scale
  → Jay Kreps, Neha Narkhede, Jun Rao built Kafka

AFTER KAFKA — hub-and-spoke:

  Service A ──┐
  Service B ──┼──▶ KAFKA ──▶ Service C
  Service D ──┘         └──▶ Service E
                         └──▶ Analytics
                         └──▶ DB Sync
                         └──▶ ML Pipeline

  n services → n connections total!
  Decoupled: producers don't know consumers
  Durable: messages stored, replay anytime
  Scalable: consumers scale independently
  Multi-consumer: same data, many consumers
```

## 1.2 Kafka Core Philosophy

```
Kafka is NOT a traditional message queue
It is a DISTRIBUTED COMMIT LOG (Distributed Streaming Platform)

Traditional Queue:                    Kafka Log:
  [A][B][C][D][E]                      [A][B][C][D][E][F][G]
  Consumer reads A → A deleted         Consumer reads at any OFFSET
  Message gone after consumption       Messages RETAINED (days/forever)
  
KEY DESIGN DECISIONS:
  1. Append-only log: sequential writes are FAST (HDD seq I/O ≈ SSD random I/O)
  2. Immutable: messages never modified, only appended
  3. Consumer owns offset: consumer tracks position, not broker
  4. Pull-based: consumers pull data (not push) → consumer controls rate
  5. Batching: send/receive in batches → throughput vs latency tradeoff
  6. Zero-copy: OS kernel copies from disk → network (no userspace copy)
  
KAFKA = LinkedIn's "universal data pipeline"
"Kafka is the central nervous system for data at LinkedIn"
```

---

# 2. Kafka Architecture

## 2.1 Core Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KAFKA CLUSTER                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     ZooKeeper / KRaft                        │  │
│  │  (Cluster metadata: broker list, topic configs, leader info) │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │    Broker 1     │  │    Broker 2     │  │    Broker 3     │    │
│  │                 │  │                 │  │                 │    │
│  │  Topic A P0 [L] │  │  Topic A P0 [F] │  │  Topic A P1 [F] │    │
│  │  Topic A P1 [L] │  │  Topic A P2 [F] │  │  Topic A P2 [L] │    │
│  │  Topic B P0 [L] │  │  Topic B P0 [F] │  │  Topic B P1 [L] │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│       [L]=Leader           [F]=Follower                            │
└─────────────────────────────────────────────────────────────────────┘
         ▲                                              │
  Producers                                        Consumers
  (write to leaders)                         (read from any replica
                                              usually leader)

BROKER:
  A Kafka server process
  Receives messages from producers → stores to disk → serves to consumers
  One broker handles thousands of clients
  Stateless regarding consumer offsets (consumer tracks own offset)

ZOOKEEPER (legacy) / KRAFT (modern):
  ZooKeeper: external coordinator (Kafka 3.x deprecated, Kafka 4.0 removed)
    Stores: broker registration, topic configs, partition leaders, quotas
    Problem: bottleneck, extra operational complexity, 2-3s failover
  
  KRaft (Kafka Raft, Kafka 2.8+, stable 3.3+):
    Kafka manages its own metadata (built-in Raft consensus)
    Some brokers act as "controllers"
    Benefits: faster failover (ms not seconds), simpler ops, scales to millions of partitions

CONTROLLER:
  One special broker in the cluster
  Manages partition leadership elections
  Monitors broker health via ZooKeeper/KRaft heartbeats
  When broker dies → controller assigns new leaders for its partitions
```

## 2.2 Physical Storage

```
KAFKA STORAGE LAYOUT:
  /kafka-logs/
  ├── orders-0/              ← partition 0 of "orders" topic
  │   ├── 00000000000000000000.log        ← segment file (actual data)
  │   ├── 00000000000000000000.index      ← offset → position mapping
  │   ├── 00000000000000000000.timeindex  ← timestamp → offset mapping
  │   ├── 00000000001000000000.log        ← next segment (when previous full)
  │   ├── 00000000001000000000.index
  │   └── ...
  ├── orders-1/              ← partition 1
  └── orders-2/              ← partition 2

SEGMENT FILES:
  Log file: sequence of records
  Each segment has max size (log.segment.bytes, default 1GB)
  or max time (log.roll.ms, default 7 days)
  Only the ACTIVE (last) segment is written to

RECORD FORMAT (each message on disk):
  Length:     4 bytes
  CRC:        4 bytes (checksum)
  Attributes: 1 byte (compression type, etc.)
  Timestamp:  8 bytes
  Key length: 4 bytes (or -1 if null)
  Key:        variable
  Value length: 4 bytes
  Value:      variable

INDEX FILE:
  Sparse index (not every offset, every ~4KB of data)
  offset → physical byte position in .log file
  Binary search in index → O(log n) to find any offset
  Without index: O(n) scan of entire .log file

ZERO-COPY (why Kafka is fast):
  Traditional:  Disk → kernel buffer → user buffer → socket buffer → network
  Zero-copy:    Disk → kernel buffer → socket buffer → network
  (sendfile() syscall — skips userspace copy!)
  Result: 60% less CPU, near wire-speed throughput
```

---

# 3. Topics, Partitions & Offsets

## 3.1 Topics

```
TOPIC = logical stream of records
  Like a database table but append-only and distributed
  Named stream: "orders", "user-events", "payment-confirmations"
  
TOPIC CONFIGURATION (important settings):
  num.partitions:        how many partitions (parallelism)
  replication.factor:    how many copies of each partition
  retention.ms:          how long to keep messages (default: 7 days)
  retention.bytes:       max size before deleting old messages
  cleanup.policy:        "delete" (default) or "compact"
  min.insync.replicas:   min replicas that must acknowledge write
  compression.type:      "none", "gzip", "snappy", "lz4", "zstd"
  max.message.bytes:     max message size (default 1MB)
```

```bash
# Create topic
kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --partitions 6 \
  --replication-factor 3 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete \
  --config compression.type=lz4 \
  --config min.insync.replicas=2

# List topics
kafka-topics.sh --list --bootstrap-server localhost:9092

# Describe topic (see partitions, leaders, replicas)
kafka-topics.sh --describe --topic orders --bootstrap-server localhost:9092
# Topic: orders  PartitionCount: 6  ReplicationFactor: 3
# Topic: orders Partition: 0 Leader: 2 Replicas: 2,1,3 Isr: 2,1,3
# Topic: orders Partition: 1 Leader: 1 Replicas: 1,3,2 Isr: 1,3,2

# Alter topic
kafka-topics.sh --alter --topic orders \
  --partitions 12 \            # can only INCREASE partitions!
  --bootstrap-server localhost:9092

# Delete topic
kafka-topics.sh --delete --topic orders --bootstrap-server localhost:9092
```

## 3.2 Partitions & Offsets

```
PARTITION = ordered, immutable sequence of records
  Each record in partition has sequential OFFSET (0, 1, 2, 3...)
  Offsets are per-partition (not global across topic)
  
  Partition 0: [0][1][2][3][4][5][6]...
  Partition 1: [0][1][2][3][4]...
  Partition 2: [0][1][2][3][4][5][6][7]...

OFFSET:
  Integer that uniquely identifies position within partition
  Monotonically increasing, never reused
  Consumer commits offset to track its position

┌──────────────────────────────────────────────────────────────────┐
│  Topic: orders (3 partitions)                                    │
│                                                                  │
│  P0:  [0:order1] [1:order5] [2:order8] [3:order12] ...          │
│                                                    ↑ newest      │
│  P1:  [0:order2] [1:order4] [2:order9] ...                      │
│                                         ↑ newest                │
│  P2:  [0:order3] [1:order6] [2:order7] [3:order10] [4:order11]  │
│                                                          ↑newest │
└──────────────────────────────────────────────────────────────────┘

WHY PARTITIONS MATTER:
  1. PARALLELISM: each partition consumed independently
     3 partitions → up to 3 consumers in parallel
     
  2. ORDERING: messages in SAME partition are ordered
     messages ACROSS partitions have NO ordering guarantee
     
  3. SCALABILITY: partitions spread across brokers
     more brokers → more partitions → more throughput
     
  4. KEY-BASED ROUTING: same key → same partition → ordered
     user_id=123 always → partition 2 → all events for user ordered

CHOOSING NUMBER OF PARTITIONS:
  Rule of thumb: partitions ≥ max consumer count you'll ever want
  Over-provisioning is OK (unused partitions have low overhead)
  Can only INCREASE (never decrease without recreating topic!)
  
  Start with: max(throughput_MB/s / 10, num_consumers × 2)
  LinkedIn: some topics have 4000+ partitions
  
  Too few: limited parallelism, throughput bottleneck
  Too many: more files on disk, longer leader election time, more memory
  
  Practical: 6, 12, 24, 48 (multiples of 2,3 for easy repartitioning)
```

## 3.3 Log Compaction

```
CLEANUP POLICY: "compact" instead of "delete"
  Keep only the LATEST value for each KEY
  "Event sourcing lite" — always have latest state for each key

Normal (delete policy):          Compacted:
  [key=A, val=1]                   [key=A, val=4]  ← latest
  [key=B, val=1]                   [key=B, val=2]  ← latest
  [key=A, val=2]                   [key=C, val=3]  ← latest
  [key=C, val=1]
  [key=A, val=3]
  [key=B, val=2]
  [key=C, val=2]
  [key=A, val=4]    ← latest A
  [key=C, val=3]    ← latest C

Tombstone: key with null value → DELETE that key from compacted log
  Useful for: "user 123 deleted their account"

USE CASES for log compaction:
  Changelog topic: DB changes → always latest state
  Configuration: service config updates → always current config
  User profile updates: latest profile per user
  
  Kafka Streams uses internally for state stores!
  
IMPORTANT: compacted topics still have ALL recent messages
  Compaction runs in background, doesn't affect real-time consumers
  Active (recent) segment is NEVER compacted
```

---

# 4. Producers — Deep Dive

## 4.1 Producer Architecture

```
PRODUCER INTERNALS:

User Thread:
  producer.send(record)
       ↓
  Serializer (key + value → bytes)
       ↓
  Partitioner (which partition?)
       ↓
  RecordAccumulator (batching buffer)
       ↓
  [batch for P0] [batch for P1] [batch for P2]

I/O Thread (Sender):
  [batch] → compress → ProduceRequest → Broker Leader
  ← ProduceResponse (acks, errors)
  
BATCHING:
  linger.ms=0:  send immediately (low latency, low throughput)
  linger.ms=5:  wait 5ms to fill batch (better throughput)
  batch.size:   max bytes per batch (default 16KB)
  
  ┌────────────────────────────────────────────────────┐
  │  RecordAccumulator                                 │
  │                                                    │
  │  P0 batch: [msg1][msg2][msg3]  ←→ fill to         │
  │  P1 batch: [msg4]               batch.size OR      │
  │  P2 batch: [msg5][msg6]         wait linger.ms     │
  └────────────────────────────────────────────────────┘
```

## 4.2 Producer Configuration

```java
Properties props = new Properties();

// CONNECTION
props.put("bootstrap.servers", "broker1:9092,broker2:9092,broker3:9092");
// Don't need ALL brokers — just enough to discover cluster

// SERIALIZATION
props.put("key.serializer",   "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "io.confluent.kafka.serializers.KafkaAvroSerializer");

// ── ACKNOWLEDGMENT (most critical setting!) ──
props.put("acks", "all");
// "0": fire-and-forget — no wait, possible loss, FASTEST
// "1": leader ACK only — lose data if leader crashes before replication
// "all" or "-1": all ISR ACK — safest, honors min.insync.replicas

// ── IDEMPOTENCY (exactly-once delivery) ──
props.put("enable.idempotence", "true");
// Assigns producer ID + sequence numbers
// Broker deduplicates on retry → no duplicates!
// Requires: acks=all, retries > 0, max.in.flight.requests.per.connection ≤ 5

// ── RETRIES ──
props.put("retries", Integer.MAX_VALUE);    // retry forever on retriable errors
props.put("retry.backoff.ms", 100);         // wait between retries
props.put("delivery.timeout.ms", 120000);   // total time limit for delivery (2 min)

// ── BATCHING & THROUGHPUT ──
props.put("batch.size", 32768);             // 32KB batch (default 16KB)
props.put("linger.ms", 20);                 // wait 20ms to fill batch
props.put("buffer.memory", 33554432);       // 32MB buffer (default 32MB)
props.put("max.block.ms", 60000);           // how long to block if buffer full

// ── COMPRESSION ──
props.put("compression.type", "lz4");       // lz4: fast compression
// "none": default, "gzip": best compression, slow
// "snappy": medium compression, fast
// "lz4": fast, good compression
// "zstd": best compression/speed ratio (Kafka 2.1+)

// ── IN-FLIGHT REQUESTS ──
props.put("max.in.flight.requests.per.connection", 5);
// Default 5 — allows pipelining (send before getting ACK)
// Set to 1 if strict ordering needed AND idempotence disabled
// With idempotence=true: up to 5 is safe (Kafka deduplicates)

// ── TIMEOUTS ──
props.put("request.timeout.ms", 30000);    // wait for broker response
props.put("metadata.fetch.timeout.ms", 60000);

KafkaProducer<String, OrderEvent> producer = new KafkaProducer<>(props);
```

## 4.3 Sending Messages

```java
// ASYNC SEND (recommended for throughput)
ProducerRecord<String, OrderEvent> record = new ProducerRecord<>(
    "orders",              // topic
    orderId.toString(),    // key (determines partition!)
    new OrderEvent(...)    // value
);

// Fire-and-forget with callback
producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        // Retriable errors: retried automatically by producer
        // Non-retriable errors: arrive here
        log.error("Failed to send to {}-{} at offset {}",
            metadata.topic(), metadata.partition(), metadata.offset(), exception);
        handleFailure(record, exception);
    } else {
        log.debug("Sent to {}-{} at offset {} (timestamp: {})",
            metadata.topic(),
            metadata.partition(),
            metadata.offset(),
            metadata.timestamp());
    }
});

// SYNC SEND (for critical messages, lower throughput)
try {
    RecordMetadata metadata = producer.send(record).get();  // blocks!
    log.info("Sent synchronously: partition={}, offset={}",
        metadata.partition(), metadata.offset());
} catch (ExecutionException e) {
    if (e.getCause() instanceof ProducerFencedException) {
        // Our producer was fenced (another instance with same transactional.id)
        handleFencing();
    } else if (e.getCause() instanceof KafkaException) {
        handleKafkaError(e.getCause());
    }
}

// SYNC SEND WITH TIMEOUT
try {
    RecordMetadata metadata = producer.send(record).get(5, TimeUnit.SECONDS);
} catch (TimeoutException e) {
    // Took longer than 5 seconds
    handleTimeout(record);
}

// PARTITIONING STRATEGIES:
// Null key → round-robin (Kafka 2.4+ uses sticky partitioner: fill batch then rotate)
producer.send(new ProducerRecord<>("orders", null, event));

// Explicit key → hash(key) % num_partitions (consistent routing!)
producer.send(new ProducerRecord<>("orders", userId.toString(), event));

// Explicit partition → bypass partitioner (use sparingly)
producer.send(new ProducerRecord<>("orders", 0, key, value));

// Custom partitioner:
public class RegionPartitioner implements Partitioner {
    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        OrderEvent order = (OrderEvent) value;
        int numPartitions = cluster.partitionCountForTopic(topic);

        // Route Vietnam orders to first 3 partitions
        if (order.getRegion().equals("VN")) {
            return Math.abs(order.getUserId().hashCode()) % (numPartitions / 2);
        }
        // Other regions to remaining partitions
        return numPartitions / 2 + Math.abs(order.getUserId().hashCode()) % (numPartitions / 2);
    }
    // ...
}

// HEADERS (metadata alongside message):
ProducerRecord<String, byte[]> record = new ProducerRecord<>("orders", key, value);
record.headers()
    .add("correlationId", correlationId.getBytes())
    .add("sourceService", "order-service".getBytes())
    .add("schemaVersion", "v2".getBytes());
```

## 4.4 Producer Lifecycle & Flush

```java
// IMPORTANT: producer is NOT thread-safe
// Recommendation: ONE producer per application (shared across threads)
// Producer is heavyweight — don't create per request!

// Proper shutdown:
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    try {
        producer.flush();  // wait for all pending messages to be sent
        producer.close(Duration.ofSeconds(10));
    } catch (Exception e) {
        log.error("Error closing producer", e);
    }
}));

// FLUSH: blocks until all buffered messages are sent
// Use when:
//   Before application shutdown
//   Before committing a database transaction (transactional outbox pattern)
//   Before signaling "batch complete"
producer.flush();

// CLOSE: flush + close connections
producer.close(); // waits indefinitely — potentially bad in production!
producer.close(Duration.ofSeconds(30)); // with timeout
```

---

# 5. Consumers & Consumer Groups

## 5.1 Consumer Groups

```
CONSUMER GROUP: group of consumers that collectively consume a topic
  Each partition consumed by EXACTLY ONE consumer in the group
  Consumers in different groups consume INDEPENDENTLY (different offsets!)

WHY consumer groups?
  Parallelism: multiple consumers process topic in parallel
  Fault tolerance: if one consumer dies, partitions rebalanced to survivors
  Scaling: add consumers to increase throughput (up to num_partitions)

┌────────────────────────────────────────────────────────────────┐
│  Topic: orders (6 partitions)                                  │
│  [P0][P1][P2][P3][P4][P5]                                     │
└───┬────┬────┬────┬────┬───┘
    │    │    │    │    │
    ▼    ▼    ▼    ▼    ▼
GROUP "order-service" (3 consumers):
  Consumer-1: P0, P1
  Consumer-2: P2, P3
  Consumer-3: P4, P5
  (each partition → 1 consumer, balanced)

GROUP "analytics" (1 consumer):
  Consumer-A: P0, P1, P2, P3, P4, P5
  (same messages, independent offset, different group)

GROUP "notifications" (6 consumers — max parallelism!):
  Consumer-N1: P0
  Consumer-N2: P1
  Consumer-N3: P2
  Consumer-N4: P3
  Consumer-N5: P4
  Consumer-N6: P5
  (1 partition per consumer — maximum parallel)

GROUP "audit" (8 consumers — IDLE consumers!):
  Consumer 1-6: P0-P5 (one each)
  Consumer 7, 8: IDLE (more consumers than partitions)
  ← WASTE! Idle consumers do nothing
  Max parallelism = num_partitions

RULE: Never have more active consumers than partitions in a group
```

## 5.2 Consumer Configuration

```java
Properties props = new Properties();

// CONNECTION
props.put("bootstrap.servers", "broker1:9092,broker2:9092");
props.put("group.id", "order-processing-service");

// DESERIALIZATION (must match producer's serialization!)
props.put("key.deserializer",   StringDeserializer.class.getName());
props.put("value.deserializer", KafkaAvroDeserializer.class.getName());

// ── OFFSET RESET (what to do when no committed offset exists) ──
props.put("auto.offset.reset", "earliest");
// "earliest": read from beginning of partition (new consumer group)
// "latest":   read only new messages after consumer started (default)
// "none":     throw exception if no committed offset

// ── AUTO COMMIT (dangerous!) ──
props.put("enable.auto.commit", "false");   // DISABLE! Control manually
// If true: auto-commits every auto.commit.interval.ms (5s)
// Problem: commit BEFORE processing → if crash → messages LOST!

// ── SESSION & HEARTBEAT ──
props.put("session.timeout.ms", 30000);     // 30s: time before consumer considered dead
props.put("heartbeat.interval.ms", 3000);   // 3s: how often to send heartbeat
// heartbeat.interval.ms should be 1/3 of session.timeout.ms

// ── POLL SETTINGS ──
props.put("max.poll.records", 500);          // max records per poll() call
props.put("max.poll.interval.ms", 300000);   // 5 min: max time between poll() calls
// If consumer takes > max.poll.interval.ms to process → kicked out of group!
// Set based on: max time to process max.poll.records messages

// ── FETCH SETTINGS ──
props.put("fetch.min.bytes", 1024);          // wait until 1KB available (batching)
props.put("fetch.max.wait.ms", 500);         // wait max 500ms for fetch.min.bytes
props.put("fetch.max.bytes", 52428800);      // 50MB max per fetch
props.put("max.partition.fetch.bytes", 1048576); // 1MB per partition per fetch

KafkaConsumer<String, OrderEvent> consumer = new KafkaConsumer<>(props);
```

## 5.3 Consumer Poll Loop

```java
@Service
public class OrderConsumerService {

    private final KafkaConsumer<String, OrderEvent> consumer;
    private final OrderProcessor processor;
    private volatile boolean running = true;

    public void start() {
        consumer.subscribe(List.of("orders"), new ConsumerRebalanceListener() {
            @Override
            public void onPartitionsRevoked(Collection<TopicPartition> partitions) {
                // CALLED BEFORE rebalance — commit current offsets!
                log.info("Partitions revoked: {}", partitions);
                commitCurrentOffsets(partitions);
            }

            @Override
            public void onPartitionsAssigned(Collection<TopicPartition> partitions) {
                // CALLED AFTER rebalance — reset state if needed
                log.info("Partitions assigned: {}", partitions);
                // Optionally: seek to specific offsets
            }
        });

        // ── POLL LOOP ──
        while (running) {
            ConsumerRecords<String, OrderEvent> records =
                consumer.poll(Duration.ofMillis(100));  // block up to 100ms

            if (records.isEmpty()) continue;

            // ── PROCESS RECORDS ──
            for (ConsumerRecord<String, OrderEvent> record : records) {
                log.debug("Received: topic={} partition={} offset={} key={} timestamp={}",
                    record.topic(), record.partition(), record.offset(),
                    record.key(), record.timestamp());

                try {
                    processor.process(record.value());
                } catch (NonRetryableException e) {
                    // Skip this message — send to DLQ
                    deadLetterProducer.send(record);
                } catch (RetryableException e) {
                    // Retry — seek back to this offset
                    consumer.seek(
                        new TopicPartition(record.topic(), record.partition()),
                        record.offset());
                    break;  // re-process this batch
                }
            }

            // ── MANUAL COMMIT ──
            // Commit AFTER processing (at-least-once)
            try {
                consumer.commitSync();  // blocks — safe but slow
                // OR:
                consumer.commitAsync((offsets, exception) -> {
                    if (exception != null) log.error("Commit failed: {}", offsets, exception);
                });
            } catch (CommitFailedException e) {
                log.error("Commit failed — we were kicked out of the group!", e);
            }
        }

        consumer.close(Duration.ofSeconds(10));
    }

    // ── PER-PARTITION PROCESSING (better control) ──
    public void processPerPartition() {
        consumer.subscribe(List.of("orders"));

        while (running) {
            ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(100));

            // Process partition by partition
            for (TopicPartition partition : records.partitions()) {
                List<ConsumerRecord<String, OrderEvent>> partitionRecords =
                    records.records(partition);

                for (ConsumerRecord<String, OrderEvent> record : partitionRecords) {
                    processor.process(record.value());
                }

                // Commit only this partition's offset
                long lastOffset = partitionRecords.get(partitionRecords.size() - 1).offset();
                consumer.commitSync(Map.of(partition, new OffsetAndMetadata(lastOffset + 1)));
                //                                                                    ↑
                //                              NEXT expected offset (last processed + 1)!
            }
        }
    }

    // ── MANUAL SEEK (replay, skip messages) ──
    void replayFrom(String topic, int partition, long fromOffset) {
        TopicPartition tp = new TopicPartition(topic, partition);
        consumer.assign(List.of(tp));         // manually assign (not subscribe)
        consumer.seek(tp, fromOffset);         // seek to specific offset
        // Now poll() returns messages from fromOffset
    }

    void seekToBeginning() {
        consumer.seekToBeginning(consumer.assignment());  // read all messages
    }

    void seekToEnd() {
        consumer.seekToEnd(consumer.assignment());  // skip all existing messages
    }

    void seekByTimestamp(long timestamp) {
        Map<TopicPartition, Long> timestampQuery = consumer.assignment().stream()
            .collect(Collectors.toMap(tp -> tp, tp -> timestamp));

        consumer.offsetsForTimes(timestampQuery).forEach((tp, offsetAndTimestamp) -> {
            if (offsetAndTimestamp != null)
                consumer.seek(tp, offsetAndTimestamp.offset());
        });
    }
}
```

## 5.4 Rebalancing

```
REBALANCING: reassigning partitions to consumers in a group
Triggered when:
  - New consumer joins the group
  - Consumer leaves the group (graceful or crash)
  - Subscription changes
  - Partition count changes
  - Session timeout (consumer seems dead)

STOP-THE-WORLD REBALANCE (default, "eager"):
  1. All consumers STOP consuming (revoke all partitions)
  2. Group coordinator reassigns all partitions
  3. All consumers resume with new assignments
  
  PROBLEM: entire consumer group paused during rebalance
           For 100-consumer group with millions of partitions → painful!

COOPERATIVE (INCREMENTAL) REBALANCE (Kafka 2.4+):
  1. Only affected partitions are revoked (not all!)
  2. Unaffected consumers keep consuming
  3. Revoked partitions reassigned to new/other consumers
  
  Much better: minimal pause, incremental reassignment

STATIC MEMBERSHIP (Kafka 2.3+):
  Assign consumer a static group.instance.id
  Consumer with same ID rejoins → gets SAME partitions back
  Avoids rebalance for rolling restarts!
  
  props.put("group.instance.id", "consumer-app-1");
  // Rejoining within session.timeout.ms: NO rebalance triggered!

PARTITION ASSIGNMENT STRATEGIES:
  RangeAssignor (default):
    Assign consecutive partitions to each consumer
    P0,P1 → C1; P2,P3 → C2; P4,P5 → C3
    Can lead to uneven distribution if topics have different partition counts
  
  RoundRobinAssignor:
    Assign partitions round-robin across consumers
    P0 → C1; P1 → C2; P2 → C3; P3 → C1...
    More balanced
  
  StickyAssignor:
    Like RoundRobin but tries to minimize partition movement during rebalance
    Reduces expensive "cold start" for consumers getting new partitions
  
  CooperativeStickyAssignor (Kafka 2.4+):
    Sticky + cooperative (incremental) rebalance
    RECOMMENDED for most production use cases
  
  props.put("partition.assignment.strategy",
      "org.apache.kafka.clients.consumer.CooperativeStickyAssignor");
```

---

# 6. Kafka Replication & Fault Tolerance

## 6.1 Replication

```
REPLICATION FACTOR: how many copies of each partition
  rf=1: no fault tolerance (data lost if broker dies)
  rf=2: survives 1 broker failure
  rf=3: survives 2 broker failures (standard production setting)
  
  RULE: replication.factor ≤ number of brokers

ISR (In-Sync Replicas):
  Replicas that are "caught up" with the leader
  Caught up = replica.lag.time.max.ms (default 30s) behind leader
  
  ISR = {broker1, broker2, broker3} (all in sync)
  
  If broker3 falls behind:
  ISR = {broker1, broker2}  (broker3 removed from ISR)
  
  LEADER only ACKs write when all ISR replicas confirm (with acks=all)

UNCLEAN LEADER ELECTION:
  unclean.leader.election.enable=false (default, SAFE)
    Only ISR members can become leader
    If all ISR dead → topic unavailable until ISR returns (prefers availability)
    → BETTER: data safety over availability
  
  unclean.leader.election.enable=true (DANGEROUS)
    Out-of-sync replica can become leader
    → DATA LOSS: messages not replicated to this replica are LOST
    Use only when availability > durability

PREFERRED REPLICA:
  First replica in assignment list = preferred leader
  kafka-preferred-replica-election.sh: restore preferred replicas
  auto.leader.rebalance.enable=true: automatic rebalancing

REPLICA FETCH:
  Follower pulls from leader (not leader pushes)
  fetch continuously from leader's log
  Leader tracks "replica.fetch.wait.max.ms" to determine if replica is in-sync
```

## 6.2 Broker Failure Scenarios

```
SCENARIO 1: Follower fails
  P0: Leader=B1, Followers=[B2, B3]
  B3 crashes → ISR shrinks to [B1, B2]
  B1 still accepts writes (ISR still satisfies min.insync.replicas=2)
  B3 restarts → catches up → rejoins ISR
  ← No impact on producers or consumers!

SCENARIO 2: Leader fails
  P0: Leader=B1, Followers=[B2, B3]
  B1 crashes → Controller detects via ZooKeeper/KRaft
  Controller elects new leader from ISR: B2 becomes leader
  Producer reconnects to B2
  Consumer offset continues from last committed position
  ← Brief pause during election (seconds with ZooKeeper, ms with KRaft)

SCENARIO 3: ALL replicas fail
  P0: Leader=B1, ISR=[B1, B2, B3], all crash
  Option A (unclean=false): partition offline until at least one ISR recovers
  Option B (unclean=true): first restart becomes leader (may lose data)

SCENARIO 4: Network partition
  Cluster split: B1 can't see B2,B3
  B2 + B3 elect new leader among themselves
  B1 thinks it's still leader → "split brain"
  ZooKeeper/KRaft: only one partition has quorum (the majority side)
  B1 (minority) can't get epoch incremented → stops accepting writes
  When network heals: B1 catches up from new leader
```

---

# 7. Delivery Guarantees

## 7.1 The Three Guarantees

```
AT-MOST-ONCE:
  Message sent once, may be lost, never duplicated
  Use when: loss is acceptable (metrics, logs)
  Config: acks=0 OR enable.auto.commit=true + no retry on consumer

AT-LEAST-ONCE:
  Message delivered at least once, may be DUPLICATED
  Use when: can handle duplicates (idempotent operations)
  Config: acks=all + retries > 0 + manual commit after processing
  
  Why duplicates happen:
    Producer sent message → broker wrote → ACK lost in network
    Producer retries → broker writes DUPLICATE
    
    Consumer processed message → crash before committing offset
    Consumer restarts → re-reads same message → DUPLICATE processing

EXACTLY-ONCE:
  Message delivered exactly once, no loss, no duplicates
  Config: enable.idempotence=true + Kafka Transactions
  Most complex, slight performance cost
  Use when: financial transactions, counters, anything non-idempotent

┌─────────────────────────────────────────────────────────────────┐
│  acks    | enable.idempotence | retries | Result                 │
├─────────────────────────────────────────────────────────────────┤
│  0       | false              | 0       | At-most-once (fast)   │
│  1       | false              | default | At-least-once         │
│  all     | false              | >0      | At-least-once         │
│  all     | true               | max_int | Exactly-once (producer)│
│  all     | true + transactions| max_int | Exactly-once (e2e)    │
└─────────────────────────────────────────────────────────────────┘
```

## 7.2 Idempotent Producer

```java
// IDEMPOTENT PRODUCER: deduplicates retried messages on broker side
// 
// How it works:
//   Producer assigned unique ProducerID (PID) by broker
//   Each message gets sequence number (per partition)
//   Broker tracks PID + last sequence number per partition
//   If broker sees (PID, partition, seqNum) already received → duplicate!
//   → Silently drops duplicate, returns success to producer
//
// Coverage: deduplication within single PRODUCER SESSION
// If producer restarts: new PID assigned, dedup lost
// Cross-session exactly-once: need TRANSACTIONS

Properties props = new Properties();
props.put("enable.idempotence", "true");
// This also sets:
//   acks = all
//   retries = Integer.MAX_VALUE
//   max.in.flight.requests.per.connection = 5

// With idempotence: 
// Producer sends msg with seqNum=5
// Network fails AFTER broker writes but BEFORE ACK
// Producer retries (same seqNum=5)
// Broker sees seqNum=5 already written → drops duplicate
// Returns ACK to producer
// Result: exactly one copy in log!
```

---

# 8. Kafka Transactions

## 8.1 Transactional Producer

```java
// TRANSACTIONS: atomic writes across multiple partitions/topics
// All messages committed atomically OR none are

// SETUP: unique transactional.id per producer instance
// Enables:
//   - Exactly-once across multiple partitions
//   - Atomic read-process-write (consume + produce atomically)

Properties props = new Properties();
props.put("enable.idempotence", "true");
props.put("transactional.id", "order-payment-processor-1");
// transactional.id must be UNIQUE and STABLE per logical producer
// (restart with same ID: previous open transactions aborted)

KafkaProducer<String, Object> producer = new KafkaProducer<>(props);
producer.initTransactions();  // register with broker, abort any open transactions

// TRANSACTIONAL WRITE:
producer.beginTransaction();
try {
    // Write to multiple topics atomically
    producer.send(new ProducerRecord<>("orders", orderId, orderConfirmedEvent));
    producer.send(new ProducerRecord<>("inventory", productId, stockDeductedEvent));
    producer.send(new ProducerRecord<>("payments", paymentId, paymentCapturedEvent));
    producer.send(new ProducerRecord<>("notifications", userId, notificationEvent));

    producer.commitTransaction();  // ALL messages visible atomically
    log.info("Transaction committed");

} catch (ProducerFencedException e) {
    // Another producer with same transactional.id started
    // This producer is "fenced" — must shut down
    producer.close();
    throw e;
} catch (KafkaException e) {
    // Retriable error
    producer.abortTransaction();   // NONE of the messages visible
    log.warn("Transaction aborted", e);
    throw e;
}

// ── EXACTLY-ONCE: CONSUME-TRANSFORM-PRODUCE ──
// Read from input topic, process, write to output topic — atomically!
// No duplicates even if consumer crashes mid-processing

public void processExactlyOnce() {
    consumer.subscribe(List.of("raw-orders"));

    while (running) {
        ConsumerRecords<String, RawOrder> records = consumer.poll(Duration.ofMillis(100));

        producer.beginTransaction();
        try {
            for (ConsumerRecord<String, RawOrder> record : records) {
                ProcessedOrder processed = process(record.value());
                producer.send(new ProducerRecord<>("processed-orders", 
                    record.key(), processed));
            }

            // COMMIT OFFSETS AS PART OF TRANSACTION (key!)
            // Offsets and produced messages committed atomically
            Map<TopicPartition, OffsetAndMetadata> offsets = getOffsets(records);
            producer.sendOffsetsToTransaction(offsets, consumer.groupMetadata());

            producer.commitTransaction();
        } catch (Exception e) {
            producer.abortTransaction();
            // Records not committed → consumer will re-read
        }
    }
}
```

## 8.2 Transactional Consumer Configuration

```java
// Consumer MUST use isolation.level=read_committed
// Otherwise: sees messages from ABORTED transactions!

props.put("isolation.level", "read_committed");
// "read_uncommitted" (default): see all messages including uncommitted
// "read_committed": only see committed transaction messages

// read_committed adds LATENCY:
// Consumer waits for transaction to commit before consuming its messages
// "Last Stable Offset" (LSO) = highest offset up to which all transactions committed
// Consumer reads up to LSO, not Log End Offset (LEO)
```

---

# 9. Kafka Streams

## 9.1 Kafka Streams Overview

```
KAFKA STREAMS: library for stream processing WITHIN a Kafka application
  Not a separate cluster — just a Java library
  Reads from Kafka topics, processes, writes back to Kafka topics
  Provides: stateless transformations, stateful aggregations, joins, windowing

PROCESSING CONCEPTS:
  KStream:   unbounded stream of records (insert semantics)
  KTable:    changelog stream — each key has latest value (update semantics)
  GlobalKTable: fully replicated table on every instance (for lookups)

STATELESS OPERATIONS:
  filter, map, mapValues, flatMap, branch, merge

STATEFUL OPERATIONS:
  count, aggregate, reduce (with windowing)
  join (stream-stream, stream-table, table-table)

WINDOWING:
  Tumbling: fixed, non-overlapping windows [0-5min, 5-10min, 10-15min...]
  Hopping:  overlapping windows [0-10min, 5-15min, 10-20min...]
  Session:  activity-based, gaps between events define boundaries
```

```java
StreamsBuilder builder = new StreamsBuilder();

// ── SIMPLE FILTER + TRANSFORM ──
KStream<String, Order> orders = builder.stream("raw-orders");

KStream<String, Order> highValueOrders = orders
    .filter((key, order) -> order.getTotal().isGreaterThan(Money.of(1_000_000, "VND")))
    .mapValues(order -> enrichOrder(order));  // add discount info

highValueOrders.to("high-value-orders");

// ── BRANCH (split stream) ──
Map<String, KStream<String, Order>> branches = orders.split(Named.as("order-type-"))
    .branch((key, order) -> order.isExpress(),   Named.as("express"))
    .branch((key, order) -> order.isRegular(),   Named.as("regular"))
    .defaultBranch(Named.as("unknown"));

branches.get("order-type-express").to("express-orders");
branches.get("order-type-regular").to("regular-orders");

// ── STATEFUL: COUNT ORDERS PER USER (tumbling window) ──
KStream<String, Order> orderStream = builder.stream("orders",
    Consumed.with(Serdes.String(), orderSerde));

KTable<Windowed<String>, Long> orderCountPerUser = orderStream
    .groupBy((key, order) -> order.getUserId().toString())
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .count(Materialized.<String, Long, WindowStore<Bytes, byte[]>>
        as("order-count-store").withKeySerde(Serdes.String()));

// Query the state store:
ReadOnlyWindowStore<String, Long> store =
    kafkaStreams.store(StoreQueryParameters.fromNameAndType(
        "order-count-store", QueryableStoreTypes.windowStore()));
WindowStoreIterator<Long> it = store.fetch("user123", fromTime, toTime);

// ── STREAM-TABLE JOIN ──
KStream<String, Order> orderStream2 = builder.stream("orders");
KTable<String, Customer> customerTable = builder.table("customers");

KStream<String, EnrichedOrder> enriched = orderStream2.join(
    customerTable,
    (order, customer) -> new EnrichedOrder(order, customer),
    Joined.with(Serdes.String(), orderSerde, customerSerde));

enriched.to("enriched-orders");

// ── STREAM-STREAM JOIN (within time window) ──
KStream<String, Payment> payments = builder.stream("payments");

KStream<String, PaymentMatchedOrder> matched = orderStream.join(
    payments,
    (order, payment) -> new PaymentMatchedOrder(order, payment),
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofSeconds(10)),
    StreamJoined.with(Serdes.String(), orderSerde, paymentSerde));

// ── AGGREGATION: revenue per product per hour ──
KTable<Windowed<String>, BigDecimal> hourlyRevenue = orderStream
    .flatMapValues(order -> order.getLines())
    .groupBy((key, line) -> KeyValue.pair(
        line.getProductId().toString(), line))
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofHours(1)))
    .aggregate(
        () -> BigDecimal.ZERO,
        (productId, line, total) -> total.add(line.getSubtotal().getAmount()),
        Materialized.with(Serdes.String(), Serdes.serdeFrom(BigDecimal.class)));

KafkaStreams streams = new KafkaStreams(builder.build(), streamsConfig);
streams.setStateListener((newState, oldState) -> {
    log.info("State changed: {} → {}", oldState, newState);
    if (newState == KafkaStreams.State.ERROR) {
        log.error("Kafka Streams entered ERROR state — restarting...");
        streams.close();
        streams.start();
    }
});
streams.start();
```

---

# 10. Kafka Connect

## 10.1 Kafka Connect Overview

```
KAFKA CONNECT: framework for connecting Kafka to external systems
  Import data FROM external systems INTO Kafka (Source Connector)
  Export data FROM Kafka TO external systems (Sink Connector)
  
  No custom code needed for standard integrations!
  Configuration-driven (JSON config files)

COMMON CONNECTORS:
  Source Connectors (→ Kafka):
    Debezium: CDC from MySQL, PostgreSQL, MongoDB, Oracle...
    JDBC Source: read from relational DB
    File Source: read from files
    S3 Source: read from AWS S3
    HTTP Source: poll REST APIs
  
  Sink Connectors (Kafka →):
    JDBC Sink: write to relational DB
    Elasticsearch: search indexing
    S3 Sink: data lake archiving
    Redis Sink: cache population
    BigQuery/Snowflake: analytics warehouse
    HTTP Sink: push to REST APIs

DEPLOY MODES:
  Standalone: single process, for development
  Distributed: multiple workers, fault-tolerant, scalable, for production
```

## 10.2 Debezium CDC (Change Data Capture)

```json
// DEBEZIUM: captures DB changes as Kafka events
// Reads MySQL binlog / PostgreSQL WAL → produces events

// PostgreSQL Source Connector config:
{
  "name": "postgres-orders-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgres",
    "database.port": "5432",
    "database.user": "debezium",
    "database.password": "secret",
    "database.dbname": "orderdb",
    "database.server.name": "orderdb",
    "table.include.list": "public.orders,public.order_lines",
    "slot.name": "debezium_slot",
    "plugin.name": "pgoutput",
    "publication.name": "debezium_publication",
    
    "transforms": "unwrap",
    "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
    "transforms.unwrap.drop.tombstones": "false",
    
    "key.converter": "io.confluent.kafka.serializers.KafkaAvroSerializer",
    "value.converter": "io.confluent.kafka.serializers.KafkaAvroSerializer",
    "schema.registry.url": "http://schema-registry:8081"
  }
}
```

```java
// DEBEZIUM EVENT STRUCTURE:
// Before: { op: "u", before: {id:1, status:"PENDING"}, after: {id:1, status:"CONFIRMED"} }
// After unwrap: { id: 1, status: "CONFIRMED" }  ← just the new state

// Topic naming: {server.name}.{schema}.{table}
// → "orderdb.public.orders"

// Operations:
// op=c: INSERT (create)
// op=u: UPDATE
// op=d: DELETE
// op=r: READ (snapshot)

// USE CASE: Keep Elasticsearch in sync with PostgreSQL:
@KafkaListener(topics = "orderdb.public.orders", groupId = "es-sync")
public void syncToElasticsearch(ConsumerRecord<String, DebeziumOrderEvent> record) {
    DebeziumOrderEvent event = record.value();

    if (event.getOp().equals("d")) {
        elasticsearchClient.delete(OrderIndex.class, event.getBefore().getId());
    } else {
        OrderDocument doc = OrderDocument.from(event.getAfter());
        elasticsearchClient.index(idx -> idx.index("orders").id(doc.getId()).document(doc));
    }
}
```

---

# 11. Schema Registry & Avro

## 11.1 Why Schema Registry?

```
PROBLEM: Kafka messages are just bytes
  Producer and consumer must agree on format
  Without schema: producer changes format → consumer breaks!
  
  "Stringly-typed" APIs: fragile, no validation, no evolution

SOLUTION: Schema Registry
  Central repository of message schemas
  Schemas versioned, validated for compatibility
  Producer registers schema → gets schema ID
  Producer sends: [schema_id: 4 bytes][avro_payload]
  Consumer reads schema_id → fetches schema from registry → deserializes

SCHEMA EVOLUTION COMPATIBILITY:
  BACKWARD: new schema can read old data (consumers upgrade first)
    Safe changes: add optional fields, delete fields
  
  FORWARD: old schema can read new data (producers upgrade first)
    Safe changes: delete optional fields, add fields with defaults
  
  FULL: both backward + forward compatible
    Safe: add optional fields with defaults
  
  NONE: no compatibility check (dangerous for production)
  
  BREAKING CHANGES (always incompatible):
    ❌ Rename a field
    ❌ Change field type (int → string)
    ❌ Delete a required field (without default)
    ❌ Change semantics (repurpose existing field name)
```

```java
// AVRO SCHEMA:
String orderSchema = """
{
  "type": "record",
  "name": "OrderCreatedEvent",
  "namespace": "com.company.ordering.events",
  "fields": [
    { "name": "orderId",      "type": "string" },
    { "name": "customerId",   "type": "string" },
    { "name": "totalAmount",  "type": "double" },
    { "name": "currency",     "type": "string", "default": "VND" },
    { "name": "status",       "type": { "type": "enum",
                                        "name": "OrderStatus",
                                        "symbols": ["PENDING","CONFIRMED","CANCELLED"] }},
    { "name": "createdAt",    "type": "long", "logicalType": "timestamp-millis" },
    { "name": "metadata",     "type": ["null", "string"], "default": null }
  ]
}
""";

// PRODUCER WITH AVRO:
Properties props = new Properties();
props.put("schema.registry.url", "http://schema-registry:8081");
props.put("value.serializer", KafkaAvroSerializer.class);
props.put("auto.register.schemas", true);  // auto-register in dev
// In prod: auto.register.schemas=false — schemas registered manually (CI/CD)

// CONSUMER WITH AVRO:
props.put("value.deserializer", KafkaAvroDeserializer.class);
props.put("specific.avro.reader", true);   // use generated classes
// OR: false → use GenericRecord (dynamic, no code generation)

// GENERATED CLASS (from Avro schema — maven/gradle plugin):
OrderCreatedEvent event = OrderCreatedEvent.newBuilder()
    .setOrderId("order-123")
    .setCustomerId("customer-456")
    .setTotalAmount(50000.0)
    .setCurrency("VND")
    .setStatus(OrderStatus.PENDING)
    .setCreatedAt(Instant.now().toEpochMilli())
    .setMetadata(null)
    .build();

producer.send(new ProducerRecord<>("order-events", event.getOrderId(), event));
```

---

# 12. Performance & Tuning

## 12.1 Throughput Optimization

```java
// ── PRODUCER THROUGHPUT ──

// BATCHING: larger batches = higher throughput (at cost of latency)
props.put("batch.size", 65536);      // 64KB (default 16KB)
props.put("linger.ms", 50);          // wait 50ms to fill batch (default 0)
// Rule: larger linger.ms → higher throughput, higher latency

// COMPRESSION: reduces bytes on network + disk
props.put("compression.type", "lz4");
// CPU cost:  lz4 < snappy < gzip < zstd
// Compression: gzip > zstd > snappy > lz4
// Recommendation: lz4 for throughput, zstd for best ratio

// BUFFER: more memory = larger batches
props.put("buffer.memory", 67108864);  // 64MB (default 32MB)

// PARALLELISM: multiple producer threads
// Not needed — KafkaProducer is thread-safe, handles batching internally

// ── CONSUMER THROUGHPUT ──

// INCREASE PARALLELISM: more partitions + more consumers
// 1 consumer → 1 thread → sequential processing
// N consumers → N threads → parallel processing

// BATCH PROCESSING: process multiple records together
props.put("max.poll.records", 1000);  // get 1000 records per poll (default 500)
props.put("fetch.min.bytes", 65536);  // wait until 64KB available

// ASYNC PROCESSING: use thread pool for I/O-bound work
ExecutorService threadPool = Executors.newFixedThreadPool(10);
while (running) {
    ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(100));
    List<Future<?>> futures = new ArrayList<>();
    for (ConsumerRecord<String, OrderEvent> record : records) {
        futures.add(threadPool.submit(() -> processRecord(record)));
    }
    // Wait for all to complete
    for (Future<?> future : futures) future.get();
    consumer.commitSync();
}
// WARNING: async processing makes offset commit ordering complex!

// ── BROKER THROUGHPUT ──
# num.io.threads: disk I/O threads (match num of disks or slightly more)
num.io.threads=8

# num.network.threads: network request threads
num.network.threads=3

# log.flush.interval.messages: when to flush to disk
log.flush.interval.messages=Long.MAX_VALUE  # rely on OS (better performance)
log.flush.interval.ms=Long.MAX_VALUE

# socket buffers
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600  # 100MB
```

## 12.2 Latency Optimization

```java
// LOW LATENCY PRODUCER:
props.put("linger.ms", 0);           // send immediately (default)
props.put("batch.size", 1);          // don't batch (extreme, rarely needed)
props.put("compression.type", "none"); // no compression overhead
props.put("acks", "1");              // only leader ACK (faster than all)

// LOW LATENCY CONSUMER:
props.put("fetch.min.bytes", 1);     // return immediately even 1 byte available
props.put("fetch.max.wait.ms", 0);   // don't wait for more data

// NETWORK OPTIMIZATION:
# Broker OS tuning:
sysctl -w net.ipv4.tcp_window_scaling=1
sysctl -w net.core.rmem_max=16777216
sysctl -w net.core.wmem_max=16777216

# JVM heap for Kafka broker:
KAFKA_HEAP_OPTS="-Xms6g -Xmx6g"   # 6GB, no GC expansion
# G1GC is default and recommended:
KAFKA_JVM_PERFORMANCE_OPTS="-server -XX:+UseG1GC -XX:MaxGCPauseMillis=20"
```

## 12.3 Storage Optimization

```bash
# RETENTION POLICIES:
# Time-based (delete old messages)
kafka-configs.sh --alter --topic orders \
  --add-config retention.ms=86400000    # 1 day

# Size-based (delete when partition too large)
kafka-configs.sh --alter --topic logs \
  --add-config retention.bytes=1073741824  # 1GB per partition

# LOG COMPACTION (keep only latest per key)
kafka-configs.sh --alter --topic user-profiles \
  --add-config cleanup.policy=compact,delete \
  --add-config delete.retention.ms=86400000  # tombstones kept 1 day
  
# COMPRESSION AT REST:
kafka-configs.sh --alter --topic orders \
  --add-config compression.type=lz4

# SEGMENT SIZE (affects how quickly old data can be deleted):
kafka-configs.sh --alter --topic high-volume-logs \
  --add-config segment.bytes=536870912  # 512MB segments
  --add-config segment.ms=3600000       # roll every 1 hour
```

---

# 13. Real-World Use Cases & Study Cases

## 13.1 Study Case: E-Commerce Order Processing

```
SYSTEM: E-commerce platform (think Shopee/Lazada Vietnam scale)
  100M users, 10M orders/day, peak: 500K orders/hour (sale events)

ARCHITECTURE:

  Order API ──[create order]──▶ orders-commands topic (6 partitions)
       │                              │
       │                    Order Processing Service
       │                         (consumer group: order-processors, 6 instances)
       │                              │
       │              ┌──────────────────────────────┐
       │              │              │               │
       │     orders-confirmed  inventory-reserve  payment-capture
       │         topic              topic            topic
       │              │              │               │
       │     Notification     Inventory Svc    Payment Svc
       │        Service        (3 instances)   (4 instances)
       │              │
       │     [email/SMS/push]
       │
       └──[reads order status]──▶ orders-query topic (for CQRS read model)
                                         │
                                  Elasticsearch Sink Connector
                                         │
                                  Elasticsearch (search)

TOPIC DESIGN:
  orders-commands:     key=orderId, 6 partitions, retention=24h, acks=all
  orders-confirmed:    key=orderId, 6 partitions, retention=7d
  inventory-reserve:   key=productId, 12 partitions (more contention)
  payment-capture:     key=userId, 6 partitions, retention=30d
  orders-query:        key=orderId, 6 partitions, compacted (latest state)
  notification-events: key=userId, 12 partitions, retention=3d

SALE EVENT (11/11 Double Day):
  Normal: 1000 orders/min
  Sale peak: 100K orders/min (100x spike!)
  
  Handling:
    1. Auto-scaling consumer instances (K8s HPA based on consumer lag)
    2. Pre-scale to 48 consumer instances BEFORE sale
    3. Topics pre-configured with enough partitions (48+)
    4. Producers: batch.size=128KB, linger.ms=50 (absorb spikes in batches)
    5. Circuit breaker: if inventory service down → put in "pending-inventory" topic
    6. Back-pressure: consumer lag metric → alert → scale consumers

CONSUMER LAG MONITORING:
  consumer lag = latest offset - committed offset
  Alert if lag > 10,000 messages
  → Scale consumer instances
  → Investigate slow processing
```

## 13.2 Study Case: Real-Time Fraud Detection

```
COMPANY: Fintech (payment processor)
PROBLEM: Detect fraud in real-time (<100ms after transaction)
VOLUME:  50K transactions/second, 24/7

ARCHITECTURE:
  Payment Service ──▶ transactions topic (24 partitions)
                              │
                     ┌────────┴────────┐
                     │                 │
              Kafka Streams       ML Service
              (rule-based)     (model scoring)
                     │                 │
              ┌──────▼─────────────────▼──────┐
              │      fraud-decisions topic     │
              └──────────────┬────────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
           Alert Service        Transaction API
           (block payment)    (approve/decline)

KAFKA STREAMS FRAUD RULES:
  // Rule 1: Unusual location (transaction >500km from last transaction in <30min)
  KStream<String, Transaction> txStream = builder.stream("transactions");
  
  KTable<String, Transaction> lastTxPerUser = txStream
      .groupByKey()
      .reduce((prev, current) -> current,  // keep latest
          Materialized.as("last-tx-store"));
  
  txStream.join(lastTxPerUser, (current, previous) -> {
      if (previous == null) return FraudDecision.allowed(current.getId());
      double distanceKm = calculateDistance(current.getLocation(), previous.getLocation());
      long timeDiffMinutes = ChronoUnit.MINUTES.between(previous.getTimestamp(), current.getTimestamp());
      
      if (distanceKm > 500 && timeDiffMinutes < 30) {
          return FraudDecision.suspicious(current.getId(), "LOCATION_VELOCITY");
      }
      return FraudDecision.allowed(current.getId());
  }).to("fraud-decisions");

  // Rule 2: Multiple transactions within 1 minute
  txStream
      .groupByKey()
      .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1)))
      .count()
      .filter((key, count) -> count > 10)  // >10 txns/min = suspicious
      .toStream()
      .map((key, count) -> KeyValue.pair(
          key.key(),
          FraudDecision.suspicious(key.key(), "HIGH_FREQUENCY")))
      .to("fraud-decisions");

PERFORMANCE:
  50K txns/sec × 24 partitions ≈ 2,083 txns/sec/partition
  Kafka Streams processing: 8ms per transaction
  End-to-end: 15-30ms (well within 100ms requirement)
  
  Metrics:
    Consumer lag: < 100 messages (real-time)
    P99 latency: 45ms
    False positive rate: 0.1%
```

## 13.3 Study Case: Event-Driven Microservices (Saga Pattern)

```
COMPANY: Logistics company (like Grab/GoJek backend)
SCENARIO: Driver assignment saga

ORDER CREATED → ASSIGN DRIVER → NOTIFY → TRACK → COMPLETE

Topics:
  ride-requests       (new customer requests)
  driver-assignments  (assigned driver to request)
  driver-notifications (notify driver of assignment)
  driver-accepted     (driver accepted the ride)
  ride-started        (driver picked up passenger)
  ride-completed      (drop-off + payment)
  ride-cancelled      (cancellation events)

SAGA FLOW (Choreography-based):
  
  1. Customer creates ride request
     → Produce: ride-requests [rideId, pickup, dropoff, customerId]
  
  2. DriverMatchingService consumes ride-requests
     → Algorithm finds best available driver
     → Produce: driver-assignments [rideId, driverId, estimatedArrival]
  
  3. DriverNotificationService consumes driver-assignments
     → Push notification to driver app
     → Produce: driver-push-sent [rideId, driverId, pushId]
  
  4. Driver accepts in app
     → API call → produce: driver-accepted [rideId, driverId, acceptedAt]
  
  5. CustomerNotificationService consumes driver-accepted
     → Notify customer: "Driver assigned! ETA: 5 min"
  
  COMPENSATING TRANSACTIONS (cancellation):
  If driver doesn't respond in 30s:
     → DriverTimeoutService detects (via scheduled check or stream windowing)
     → Produce: driver-assignment-expired [rideId, driverId]
  
  DriverMatchingService consumes driver-assignment-expired:
     → Find next best driver
     → Produce: driver-assignments (new assignment, same rideId)

DEAD LETTER QUEUE PATTERN:
  If matching fails 3 times:
     → Produce to: ride-requests-failed [rideId, reason, attempts]
  
  Human operators / fallback algorithm handles failed rides
  Customer notification: "No driver available in your area"

MONITORING:
  lag on ride-requests > 100 → scale DriverMatchingService
  driver_acceptance_rate < 80% → alert (drivers not responding)
  ride_assignment_time_p95 > 5s → alert (matching algorithm slow)
```

## 13.4 Study Case: Streaming Analytics Pipeline

```
COMPANY: Gaming platform
DATA:    Player events (clicks, level completions, purchases, etc.)
VOLUME:  10M events/second at peak

LAMBDA ARCHITECTURE → KAPPA ARCHITECTURE with Kafka:

Old Lambda Architecture (two paths):
  Events → [Batch: Hadoop] → Historical reports (24h delay)
  Events → [Stream: Spark] → Real-time dashboards (but complex, two codebases)

Kappa Architecture (single Kafka-based path):
  Events → Kafka → Kafka Streams (replayable processing) → Multiple outputs

PIPELINE:
  Game Servers ──[UDP events]──▶ Event Collector Service
                                        │
                                        │ (validate, enrich, deduplicate)
                                        ▼
                                 raw-events topic (48 partitions, 7d retention)
                                        │
                    ┌───────────────────┼────────────────────┐
                    │                   │                    │
             Kafka Streams         Kafka Streams        Kafka Streams
             (real-time KPIs)  (session analysis)  (churn prediction)
                    │                   │                    │
             metrics topic        sessions topic       churn-scores topic
                    │                   │                    │
                 InfluxDB          Cassandra           ML Feature Store
                 (dashboards)    (session store)     (model serving)

REPLAY CAPABILITY (key advantage):
  "We deployed a bug that corrupted 6 hours of session analysis"
  Solution with Kafka:
    1. Fix the bug
    2. Reset consumer group offset to 6 hours ago
    3. Replay events through fixed pipeline
    4. Overwrite corrupted data
  
  Without Kafka: data gone, 6 hours of analytics permanently incorrect!

KAFKA STREAMS REAL-TIME KPI:
  // Player counts per game per 1-minute window
  KTable<Windowed<String>, Long> activePlayers = rawEvents
      .filter((k, event) -> event.getType().equals("GAMEPLAY"))
      .groupBy((k, event) -> KeyValue.pair(event.getGameId(), event))
      .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1)))
      .count();
  
  // Revenue per minute
  KTable<Windowed<String>, Double> revenue = rawEvents
      .filter((k, event) -> event.getType().equals("PURCHASE"))
      .groupBy((k, event) -> KeyValue.pair(event.getGameId(), event))
      .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1)))
      .aggregate(
          () -> 0.0,
          (gameId, event, total) -> total + event.getAmount());
```

---

# 14. Common Mistakes & Anti-Patterns

## 14.1 Producer Mistakes

```java
// ❌ MISTAKE 1: Creating new producer per request (EXTREMELY COMMON)
// Producer creation is expensive (~100ms + threads + buffer)
@Service
public class OrderService {
    public void createOrder(Order order) {
        // BAD: creates producer for EVERY order!
        KafkaProducer<String, OrderEvent> producer = new KafkaProducer<>(getProps());
        producer.send(...);
        producer.close();  // flushes + closes — very slow!
    }
}

// ✅ CORRECT: singleton producer, reused
@Service
public class OrderService {
    private final KafkaProducer<String, OrderEvent> producer;  // injected, shared

    public void createOrder(Order order) {
        producer.send(...);  // reuse shared producer
    }
}


// ❌ MISTAKE 2: Ignoring send() return value / errors
producer.send(record);  // fire and forget — don't do this silently!

// ✅ CORRECT: always handle errors
producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        log.error("Failed to send: {}", record.value(), exception);
        alerting.trigger("kafka_producer_error", exception);
        // Consider: dead letter queue, retry logic, circuit breaker
    }
});


// ❌ MISTAKE 3: Not calling flush() before shutdown
// Messages buffered in RecordAccumulator → LOST on JVM exit!
producer.close();  // bad: races with in-flight messages

// ✅ CORRECT: flush then close
producer.flush();  // wait for ALL buffered messages to be sent
producer.close(Duration.ofSeconds(10));


// ❌ MISTAKE 4: Wrong acks for critical data
props.put("acks", "0");  // for payment events???

// ✅ CORRECT: acks=all for important data
props.put("acks", "all");
props.put("min.insync.replicas", "2");  // on broker side


// ❌ MISTAKE 5: Partition by index when semantics require key routing
// If you need user's events ordered, you MUST use user_id as key!
producer.send(new ProducerRecord<>("user-events", null, userEvent));
// null key → random partition → user's events UNORDERED across partitions!

// ✅ CORRECT: use meaningful key
producer.send(new ProducerRecord<>("user-events", userId.toString(), userEvent));


// ❌ MISTAKE 6: Sending massive messages (>1MB)
byte[] hugePayload = generateReport();  // 50MB report!
producer.send(new ProducerRecord<>("reports", hugePayload));
// Kafka is NOT designed for large blobs!

// ✅ CORRECT: store large blobs in S3/GCS, send reference in Kafka
String s3Key = s3Client.upload(hugePayload);
producer.send(new ProducerRecord<>("reports", new ReportReference(s3Key)));
```

## 14.2 Consumer Mistakes

```java
// ❌ MISTAKE 7: Auto-commit enabled with complex processing
// Default: enable.auto.commit=true, interval=5s
// Process message → crash before 5s → offset NOT committed → reprocessed (OK)
// Fetch batch, process half, auto-commit fires → crash
// → Second half LOST (offset committed but not processed!)

// ✅ CORRECT: manual commit AFTER processing
props.put("enable.auto.commit", "false");
// ... process all records ...
consumer.commitSync();


// ❌ MISTAKE 8: Heavy processing inside poll loop
// max.poll.interval.ms = 5 minutes (default)
// If you spend > 5 min processing one batch: KICKED OUT of consumer group!

while (running) {
    ConsumerRecords<String, Event> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, Event> record : records) {
        doExpensiveDBWork(record);       // takes 30 seconds per record
        callSlowExternalAPI(record);     // takes 60 seconds
    }
    // With 500 records × 90s = 12.5 hours per batch → TIMEOUT!
}

// ✅ CORRECT: reduce max.poll.records + increase max.poll.interval.ms
//             OR: async processing with careful offset management
props.put("max.poll.records", 10);           // fewer records per batch
props.put("max.poll.interval.ms", 600000);   // 10 minutes


// ❌ MISTAKE 9: Committing offsets too eagerly
for (ConsumerRecord<String, Event> record : records) {
    consumer.commitSync(Map.of(
        new TopicPartition(record.topic(), record.partition()),
        new OffsetAndMetadata(record.offset() + 1)));  // commit after EACH record
    processRecord(record);  // if crash here: offset committed but not processed!
}

// ✅ CORRECT: commit after ALL records in batch processed
for (ConsumerRecord<String, Event> record : records) {
    processRecord(record);
}
consumer.commitSync();  // commit after full batch


// ❌ MISTAKE 10: Not handling rebalances properly
consumer.subscribe(List.of("orders"));
// No rebalance listener → on rebalance, uncommitted work is lost/duplicated

// ✅ CORRECT: implement ConsumerRebalanceListener
consumer.subscribe(List.of("orders"), new ConsumerRebalanceListener() {
    @Override
    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {
        commitCurrentOffsets(partitions);  // commit before partitions taken away!
    }
    @Override
    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {
        // Initialize any partition-specific state
    }
});


// ❌ MISTAKE 11: Deserializing errors crash consumer
// If one malformed message causes deserialization error → entire consumer stops!

// ✅ CORRECT: error handler + DLQ
@KafkaListener(topics = "orders")
public void consume(ConsumerRecord<String, byte[]> record) {
    try {
        OrderEvent event = deserialize(record.value());
        process(event);
    } catch (DeserializationException e) {
        log.error("Failed to deserialize offset={} partition={}", 
            record.offset(), record.partition(), e);
        deadLetterProducer.send(new ProducerRecord<>("orders-dlq",
            record.key(), record.value()));
        // Don't re-throw: continue processing next message
    }
}


// ❌ MISTAKE 12: One consumer group for everything
// "analytics" team consumes "orders" topic
// "billing" team also needs to consume "orders"
// Both use group.id = "order-consumer"
// → They share partitions, each only sees HALF the messages!

// ✅ CORRECT: separate group.id per independent consumer
// analytics: group.id = "analytics-order-consumer"
// billing:   group.id = "billing-order-consumer"
// Each gets ALL messages independently!
```

## 14.3 Architecture Mistakes

```
// ❌ MISTAKE 13: Using Kafka as a database
// Storing all user profiles in Kafka, querying them directly
// Kafka is NOT a database! No random access, no indexes, no SQL

// ✅ CORRECT: Kafka for streaming, DB for storage
// Use Kafka to stream changes → project into PostgreSQL/Cassandra
// Query the database, not Kafka directly

// ❌ MISTAKE 14: Too few partitions upfront
// Start with 3 partitions, grow to need 30 consumers
// Can increase partitions but: key routing CHANGES!
// user_id=123 was in P2, after repartition might be in P7
// → Messages for same user no longer ordered across partition change

// ✅ CORRECT: over-provision partitions from start
// Start with 12-24 partitions for important topics
// Adding partitions breaks key-based ordering!

// ❌ MISTAKE 15: Messages too tightly coupled between services
// Order Service produces OrderCreatedEvent with ALL order details
// Inventory Service, Payment Service, Shipping Service all consume it
// Change order schema → ALL downstream services must update simultaneously
// This is the "distributed monolith" anti-pattern!

// ✅ CORRECT: consumer fetches what it needs
// OrderCreatedEvent: just { orderId, customerId, totalAmount }
// Inventory Service: uses orderId to fetch items from Order Service API
// OR: separate events for each concern
//   OrderItemsReservedEvent → inventory
//   OrderPaymentRequiredEvent → payment

// ❌ MISTAKE 16: Not planning for consumer group rebalance storms
// 50 consumer instances all restart simultaneously (rolling deploy)
// Each restart triggers rebalance
// → 50 consecutive rebalances, extended period of no processing!

// ✅ CORRECT: 
// 1. Static membership (group.instance.id)
// 2. Rolling restart (1 at a time)
// 3. CooperativeStickyAssignor (minimizes rebalance impact)

// ❌ MISTAKE 17: Unbounded retries causing ordering issues
// Msg at offset 5 fails, retried
// Meanwhile offset 6,7,8 succeed → committed
// Offset 5 retry succeeds → but ordering violated!

// ✅ CORRECT:
// For ordering: max.in.flight.requests.per.connection=1 (with no idempotence)
// Or: enable.idempotence=true (handles ordering + dedup)

// ❌ MISTAKE 18: Not monitoring consumer lag
// Consumer group silently falls behind by millions of messages
// "Why is our data 6 hours old?"

// ✅ CORRECT: monitor consumer_lag_sum metric, alert on threshold
// kafka_consumer_group_lag{group="order-processors"} > 10000 → alert!
```

---

# 15. Kafka vs Alternatives

## 15.1 Comparison Matrix

```
                Kafka           RabbitMQ        AWS SQS         Redis Streams
─────────────────────────────────────────────────────────────────────────────────
Type            Distributed log  Message broker  Managed queue   In-memory stream
Ordering        Per partition    Per queue        FIFO queues     Per stream
Retention       Days/forever     Until consumed  4d/14d (FIFO)   configurable
Replay          ✅ Yes          ❌ No           ❌ No           ✅ Yes
Multi-consumer  ✅ Yes (groups) ✅ Yes          ✅ Yes          ✅ Yes
Throughput      Very high        High            High (managed)  Very high
Latency         Low (ms)         Very low (ms)   Medium (ms-s)   Very low (<1ms)
Schema          Via registry     No built-in     No built-in     No built-in
Stream proc.    Kafka Streams    No              No              No
Operations      Complex          Medium          None (managed)  Simple
Persistence     Disk             RAM+Disk        Managed         RAM (optional disk)
Scale           Horizontal       Vertical+horiz  Auto (managed)  Vertical
Protocol        Kafka protocol   AMQP, MQTT      AWS SDK         RESP
Use cases       Event streaming  Task queues     AWS ecosystem   Low-latency, cache

WHEN TO CHOOSE:
  Kafka:    > 100K events/sec, need replay, complex routing, stream processing
  RabbitMQ: complex routing (fanout, direct, topic exchanges), RPC, simpler setup
  SQS:      AWS-native, need zero ops, simpler use cases, auto-scaling
  Redis Streams: already using Redis, need sub-millisecond, smaller scale
  Pulsar:   multi-tenancy, geo-replication, serverless functions

Kafka vs Pulsar (newer competitor):
  Pulsar: separate compute (brokers) and storage (BookKeeper)
          → Elastic scaling of each independently
          → Better for cloud-native, serverless
  Kafka:  integrated compute + storage in brokers
          → Simpler, battle-tested, larger ecosystem
          → KRaft makes it more cloud-friendly
```

---

# 16. Operations & Monitoring

## 16.1 Key Metrics to Monitor

```
PRODUCER METRICS:
  record-send-rate:          records sent per second
  record-error-rate:         failed sends per second (should be 0)
  request-latency-avg:       average time for broker to ack
  outgoing-byte-rate:        bytes sent per second
  batch-size-avg:            average batch size (higher = better batching)
  record-queue-time-avg:     time spent in buffer (high = slow broker/network)
  compression-rate-avg:      compression ratio (1.0 = no compression)

CONSUMER METRICS:
  records-consumed-rate:     records consumed per second
  records-lag-max:           max lag across all partitions (MOST IMPORTANT!)
  fetch-rate:                fetch requests per second
  fetch-latency-avg:         time for fetch to return
  commit-rate:               offset commits per second

BROKER METRICS:
  UnderReplicatedPartitions: partitions with fewer replicas than expected (should be 0)
  OfflinePartitionsCount:    partitions with no leader (should be 0)
  ActiveControllerCount:     should be exactly 1
  RequestsPerSec:            request rate by type
  NetworkProcessorAvgIdlePercent: idle time (low = network bottleneck)
  LogFlushRateAndTimeMs:     disk flush rate and latency
  
CONSUMER LAG (most important operational metric):
  lag = log_end_offset - consumer_offset
  lag = 0: real-time consumer
  lag growing: consumer can't keep up → scale consumers or optimize processing
  lag = offset difference, time lag = lag × avg_time_per_record
```

## 16.2 Operational Commands

```bash
# ── CONSUMER GROUP MANAGEMENT ──

# List all consumer groups
kafka-consumer-groups.sh --list --bootstrap-server localhost:9092

# Check consumer group lag (MOST USED COMMAND!)
kafka-consumer-groups.sh --describe --group order-processors \
  --bootstrap-server localhost:9092
# Output:
# GROUP            TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# order-processors orders  0          12345           12350           5
# order-processors orders  1          8901            8905            4
# order-processors orders  2          15678           15681           3

# Reset offsets (replay or skip messages)
# Dry run first!
kafka-consumer-groups.sh --reset-offsets --group order-processors \
  --topic orders --to-earliest \
  --bootstrap-server localhost:9092 --dry-run

# Actually reset
kafka-consumer-groups.sh --reset-offsets --group order-processors \
  --topic orders --to-earliest \
  --bootstrap-server localhost:9092 --execute

# Reset to specific datetime
kafka-consumer-groups.sh --reset-offsets --group order-processors \
  --topic orders --to-datetime 2025-05-19T10:00:00.000 \
  --bootstrap-server localhost:9092 --execute

# ── TOPIC MANAGEMENT ──

# Read messages (for debugging)
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --from-beginning \
  --max-messages 100 \
  --property print.key=true \
  --property print.timestamp=true

# Write test messages
kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --property key.separator=: \
  --property parse.key=true
# Then type: order-123:{"orderId":"123","status":"PENDING"}

# ── PARTITION MANAGEMENT ──

# Reassign partitions (balance load after adding brokers)
# 1. Generate reassignment plan
kafka-reassign-partitions.sh --generate \
  --topics-to-move-json-file topics.json \
  --broker-list "1,2,3,4" \
  --bootstrap-server localhost:9092 > reassignment.json

# 2. Execute reassignment
kafka-reassign-partitions.sh --execute \
  --reassignment-json-file reassignment.json \
  --bootstrap-server localhost:9092

# 3. Verify completion
kafka-reassign-partitions.sh --verify \
  --reassignment-json-file reassignment.json \
  --bootstrap-server localhost:9092

# ── LOG RETENTION ──
# Delete messages older than retention (immediate effect)
kafka-configs.sh --alter --topic orders \
  --add-config retention.ms=1  \           # set to 1ms
  --bootstrap-server localhost:9092

# Wait a few seconds for deletion, then restore
kafka-configs.sh --alter --topic orders \
  --add-config retention.ms=604800000 \    # back to 7 days
  --bootstrap-server localhost:9092
```

## 16.3 Spring Boot Kafka Configuration

```yaml
# application.yml — complete Spring Kafka configuration

spring:
  kafka:
    # Connection
    bootstrap-servers: broker1:9092,broker2:9092,broker3:9092

    # Producer
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: io.confluent.kafka.serializers.KafkaAvroSerializer
      acks: all
      retries: 2147483647
      batch-size: 32768
      linger-ms: 20
      compression-type: lz4
      enable-idempotence: true
      properties:
        schema.registry.url: http://schema-registry:8081
        delivery.timeout.ms: 120000
        max.in.flight.requests.per.connection: 5

    # Consumer
    consumer:
      group-id: order-processing-service
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: io.confluent.kafka.serializers.KafkaAvroDeserializer
      auto-offset-reset: earliest
      enable-auto-commit: false
      max-poll-records: 500
      properties:
        schema.registry.url: http://schema-registry:8081
        specific.avro.reader: true
        isolation.level: read_committed
        session.timeout.ms: 30000
        heartbeat.interval.ms: 3000
        max.poll.interval.ms: 300000

    # Listener container
    listener:
      ack-mode: MANUAL_IMMEDIATE     # manual commit
      concurrency: 3                  # 3 listener threads (= 3 consumers)
      missing-topics-fatal: false     # don't fail if topic doesn't exist yet
      idle-event-interval: 30000      # emit idle event every 30s if no messages
      type: batch                     # or 'single' for one-by-one
      poll-timeout: 3000

    # Streams (if using Kafka Streams)
    streams:
      application-id: order-stream-processor
      properties:
        default.key.serde: org.apache.kafka.common.serialization.Serdes$StringSerde
        default.value.serde: io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
        processing.guarantee: exactly_once_v2
        num.stream.threads: 4
        replication.factor: 3
        commit.interval.ms: 1000
```

```java
// Spring Kafka @KafkaListener with all features:
@Component
@Slf4j
public class OrderEventConsumer {

    @KafkaListener(
        topics = "orders",
        groupId = "order-processors",
        concurrency = "3",           // 3 consumers in this listener container
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onOrderCreated(
            @Payload OrderCreatedEvent event,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            @Header(KafkaHeaders.RECEIVED_TIMESTAMP) long timestamp,
            Acknowledgment ack) {

        log.info("Processing order {} from {}-{} at offset {}",
            event.getOrderId(), topic, partition, offset);

        try {
            processOrder(event);
            ack.acknowledge();  // commit offset
        } catch (RecoverableException e) {
            // Don't ack — will be redelivered
            log.warn("Recoverable error, will retry", e);
            throw e;
        } catch (Exception e) {
            // Non-recoverable: ack to skip + send to DLQ
            log.error("Non-recoverable error, sending to DLQ", e);
            sendToDLQ(event, e);
            ack.acknowledge();
        }
    }

    // Batch listener
    @KafkaListener(topics = "high-volume-events", batch = "true")
    public void onBatch(
            List<ConsumerRecord<String, Event>> records,
            Acknowledgment ack) {
        log.info("Processing batch of {} records", records.size());
        batchProcessor.processBatch(records);
        ack.acknowledge();
    }

    // Dead Letter Topic (automatic retry + DLT)
    @RetryableTopic(
        attempts = "4",
        backoff = @Backoff(delay = 1000, multiplier = 2, maxDelay = 10000),
        dltTopicSuffix = "-dead-letter",
        include = {RecoverableException.class}
    )
    @KafkaListener(topics = "payments")
    public void onPayment(PaymentEvent event) {
        // Retried 4 times with exponential backoff
        // Final failure → sent to "payments-dead-letter"
        paymentProcessor.process(event);
    }

    @DltHandler
    public void handleDlt(PaymentEvent event, @Header KafkaHeaders.DLT_EXCEPTION_MESSAGE String error) {
        log.error("Payment event went to DLT after all retries: {} error: {}", event, error);
        alertingService.critical("payment_dlt", event, error);
    }
}
```

---

## 📎 Kafka Quick Reference

```
PARTITION FORMULA:        max(throughput / 10MB, max_consumers × 2)
REPLICATION FACTOR:       3 (production standard)
MIN.INSYNC.REPLICAS:      2 (with RF=3)
ACKS for safety:          all
ACKS for speed:           1 or 0
IDEMPOTENCE:              enable.idempotence=true + acks=all
EXACTLY-ONCE:             transactions + isolation.level=read_committed
OFFSET COMMIT:            manual, after processing
REBALANCE STRATEGY:       CooperativeStickyAssignor
STATIC MEMBERSHIP:        group.instance.id for rolling restarts
MONITOR FIRST:            consumer_lag_sum (alert if > threshold)
REPLAY:                   kafka-consumer-groups.sh --reset-offsets
LARGE MESSAGES:           store in S3, put reference in Kafka
TOPIC NAMING:             domain.entity.event (orders.order.created)
PARTITION KEY:            use entity ID for ordering (user_id, order_id)
COMPRESSION:              lz4 (throughput) or zstd (storage)
SCHEMA EVOLUTION:         backward compatible, Schema Registry
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Apache Kafka Docs | <https://kafka.apache.org/documentation/> |
| Confluent Platform | <https://docs.confluent.io/> |
| Kafka Design | <https://kafka.apache.org/documentation/#design> |
| Kafka Streams | <https://kafka.apache.org/documentation/streams/> |
| Kafka Connect | <https://docs.confluent.io/platform/current/connect/index.html> |
| Debezium | <https://debezium.io/documentation/> |
| Schema Registry | <https://docs.confluent.io/platform/current/schema-registry/> |
| Spring Kafka | <https://docs.spring.io/spring-kafka/docs/current/reference/html/> |
| KRaft Mode | <https://kafka.apache.org/documentation/#kraft> |
| Kafka Operations | <https://kafka.apache.org/documentation/#operations> |
| Kafka Summit Talks | <https://kafka-summit.org/> |
| Confluent Blog | <https://www.confluent.io/blog/> |
| Exactly Once Blog | <https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/> |
