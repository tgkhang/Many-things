# 🐇 RabbitMQ & Message Queues — Complete Deep Dive
>
> RabbitMQ Internals, AMQP, Exchanges, Patterns + Full MQ Market Comparison

---

## 📚 Table of Contents

1. [Message Queue Fundamentals](#1-message-queue-fundamentals)
2. [AMQP Protocol — The Heart of RabbitMQ](#2-amqp-protocol--the-heart-of-rabbitmq)
3. [RabbitMQ Architecture](#3-rabbitmq-architecture)
4. [Exchanges — Complete Guide](#4-exchanges--complete-guide)
5. [Queues — Deep Dive](#5-queues--deep-dive)
6. [Message Lifecycle & Delivery Guarantees](#6-message-lifecycle--delivery-guarantees)
7. [Consumers & Acknowledgment](#7-consumers--acknowledgment)
8. [RabbitMQ Clustering & High Availability](#8-rabbitmq-clustering--high-availability)
9. [Advanced Patterns](#9-advanced-patterns)
10. [RabbitMQ Streams (Kafka-like)](#10-rabbitmq-streams-kafka-like)
11. [Message Queue Market Comparison](#11-message-queue-market-comparison)
12. [Use Case Decision Guide](#12-use-case-decision-guide)
13. [Common Mistakes & Anti-Patterns](#13-common-mistakes--anti-patterns)
14. [Production Setup & Monitoring](#14-production-setup--monitoring)

---

# 1. Message Queue Fundamentals

## 1.1 Why Message Queues?

```
WITHOUT MQ — tightly coupled, synchronous:

  OrderService ──HTTP──▶ InventoryService  (blocks waiting for response)
       │                  (if inventory down → order fails!)
       └──HTTP──▶ PaymentService          (sequential, slow)
       └──HTTP──▶ NotificationService     (payment must wait for notifications!)
       └──HTTP──▶ AnalyticsService

  PROBLEMS:
  Cascading failures: 1 service down → caller fails
  Temporal coupling: both must be available SIMULTANEOUSLY
  Speed coupling: fast producer overwhelms slow consumer
  Scaling coupling: must scale producer + consumer together

WITH MQ — decoupled, asynchronous:

  OrderService ──▶ [Queue] ◀── InventoryService (reads when ready)
                  [Queue] ◀── PaymentService    (reads at its own pace)
                  [Queue] ◀── NotificationSvc   (reads independently)
                  [Queue] ◀── AnalyticsService  (batch reads)

  BENEFITS:
  Decoupling:   services don't know about each other
  Buffering:    absorbs traffic spikes (queue buffers requests)
  Reliability:  messages survive consumer failures
  Async:        producer returns immediately, consumer processes later
  Fan-out:      one message → many consumers
  Load leveling: consumer processes at sustainable rate

MQ CORE CONCEPTS:
  Producer:   sends messages to queue
  Consumer:   receives and processes messages
  Queue:      holds messages until consumed
  Message:    payload (body) + metadata (headers, routing info)
  Broker:     the MQ server (RabbitMQ, Kafka broker, etc.)
  Exchange:   (RabbitMQ-specific) routes messages to queues
  Binding:    (RabbitMQ-specific) rules connecting exchanges to queues

COMMUNICATION PATTERNS:
  Point-to-Point:  1 producer → 1 consumer (task queue)
  Pub/Sub:         1 producer → N consumers (event notification)
  Request/Reply:   sync RPC over async messaging
  Competing Consumers: N consumers compete for messages (load balancing)
```

## 1.2 Push vs Pull Model

```
PUSH MODEL (RabbitMQ default):
  Broker PUSHES messages to consumer
  Consumer registers → broker sends messages
  
  ✅ Low latency (immediate delivery)
  ✅ Simple consumer code
  ❌ Consumer can be overwhelmed (need flow control!)
  ❌ Broker must track consumer state
  
  RabbitMQ: broker.channel.basicConsume(...) → broker pushes
  Use: task queues, notifications, low-latency requirements

PULL MODEL (Kafka, HTTP polling):
  Consumer PULLS messages from broker
  Consumer decides when to fetch
  
  ✅ Consumer controls its own pace
  ✅ Broker simpler (just stores, doesn't track consumers)
  ✅ Batch processing natural
  ❌ Higher latency (polling interval)
  ❌ Consumer must implement polling loop
  
  Kafka: consumer.poll() → consumer pulls from log
  Use: stream processing, batch analytics, high-throughput

HYBRID (RabbitMQ basicGet):
  Manual pull per message
  Less efficient than push, but useful for batch scenarios
```

---

# 2. AMQP Protocol — The Heart of RabbitMQ

## 2.1 AMQP Overview

```
AMQP = Advanced Message Queuing Protocol
  Open standard protocol for message-oriented middleware
  RabbitMQ = most popular AMQP 0-9-1 implementation
  
  Unlike Kafka (custom protocol), RabbitMQ is PROTOCOL-BASED:
    Any AMQP client works with any AMQP broker
    Java, Python, .NET, Go, Node.js all use same protocol
    Interoperability by design

AMQP 0-9-1 CONCEPTS:
  Connection: TCP connection between client and broker
  Channel:    virtual connection WITHIN a Connection (multiplexed)
              Multiple channels on one TCP connection (efficient!)
              Each thread should use its own channel
  Exchange:   receives messages from producers, routes to queues
  Queue:      stores messages until consumed
  Binding:    rule that links exchange to queue
  Consumer:   registered on queue to receive messages

AMQP MESSAGE STRUCTURE:
  Properties (metadata):
    delivery-mode:  1=transient, 2=persistent (survives restart)
    content-type:   "application/json", "text/plain"
    content-encoding: "UTF-8", "gzip"
    priority:       0-9 (queue must support priority)
    correlation-id: link reply to request (RPC pattern)
    reply-to:       queue name for replies (RPC pattern)
    expiration:     message TTL in milliseconds (string!)
    message-id:     unique message identifier
    timestamp:      Unix timestamp
    type:           message type string
    user-id:        publishing user (validated by broker)
    app-id:         publishing application
    headers:        custom key-value headers (Map<String, Object>)
  
  Body (payload): raw bytes (any format)

AMQP vs HTTP:
  HTTP: stateless, request-response, high overhead per request
  AMQP: stateful connection, async, binary protocol, low overhead
  AMQP connection: ~1KB overhead (vs HTTP: ~100 bytes per header!)
  AMQP channel: multiplexed, lightweight virtual connection
```

## 2.2 Channel & Connection Management

```java
// CONNECTION FACTORY:
ConnectionFactory factory = new ConnectionFactory();
factory.setHost("rabbitmq.example.com");
factory.setPort(5672);
factory.setVirtualHost("/");            // vhost for isolation
factory.setUsername("appuser");
factory.setPassword("secret");

// SSL/TLS:
factory.useSslProtocol();               // TLS with default settings
// Or custom:
SSLContext sslContext = SSLContext.getInstance("TLSv1.3");
factory.useSslProtocol(sslContext);

// CONNECTION POOL (Connections are expensive — TCP + auth + vhost setup):
factory.setAutomaticRecoveryEnabled(true);   // auto-reconnect on failure
factory.setNetworkRecoveryInterval(5000);     // retry every 5s
factory.setTopologyRecoveryEnabled(true);     // re-declare exchanges/queues/bindings
factory.setConnectionTimeout(10000);          // 10s connection timeout
factory.setHeartbeat(60);                     // 60s heartbeat (detect dead connections)
factory.setRequestedChannelMax(0);            // 0 = unlimited channels

// CREATE CONNECTION (ONE per application — expensive):
Connection connection = factory.newConnection("my-app");
// Or with addresses for HA:
List<Address> addresses = List.of(
    new Address("rabbit1.example.com", 5672),
    new Address("rabbit2.example.com", 5672),
    new Address("rabbit3.example.com", 5672));
Connection connection = factory.newConnection(addresses, "my-app");

// CREATE CHANNEL (ONE per thread — lightweight):
Channel channel = connection.createChannel();
// DON'T share channels across threads!
// ThreadLocal<Channel> is common pattern

// CHANNEL LIFECYCLE:
channel.isOpen();           // check if channel still open
channel.getChannelNumber(); // unique channel number within connection
channel.close();            // explicit close (graceful)
// Connection close automatically closes all channels
connection.close();
```

---

# 3. RabbitMQ Architecture

## 3.1 Internal Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        RabbitMQ BROKER                               │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Virtual Host: /production                                     │  │
│  │                                                                │  │
│  │  ┌──────────────┐  routing key   ┌────────────────────────┐  │  │
│  │  │   Exchange   │───────────────▶│       Queue            │  │  │
│  │  │  (type:topic)│  binding rules │  ┌──┐┌──┐┌──┐┌──┐     │  │  │
│  │  └──────────────┘                │  │m1││m2││m3││m4│     │  │  │
│  │                                  │  └──┘└──┘└──┘└──┘     │  │  │
│  │                                  └────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  COMPONENTS:                                                         │
│  Virtual Host (vhost): isolated namespace (like DB schema)          │
│  Exchange: routing engine (receives from producers)                 │
│  Queue: message store (holds for consumers)                         │
│  Binding: exchange → queue routing rule                             │
│  Shovel: move messages between brokers/queues                       │
│  Federation: federated exchanges/queues across brokers              │
└──────────────────────────────────────────────────────────────────────┘

RABBIT'S BRAIN — Erlang OTP:
  RabbitMQ built on Erlang/OTP
  Erlang designed for telecom: fault-tolerant, distributed, concurrent
  Processes: lightweight Erlang processes (not OS threads)
    millions of processes per node (each connection = 1 process)
    ~2KB memory per process!
  "Let it crash" philosophy: if process fails, supervisor restarts it
  Hot code loading: upgrade code without stopping broker!

VHOSTS (Virtual Hosts):
  Logical isolation within one RabbitMQ broker
  Different exchanges, queues, permissions per vhost
  Like "databases" in PostgreSQL
  Default vhost: "/"
  
  Use cases:
    /production, /staging, /development (environment isolation)
    /team-a, /team-b (team isolation)
    /app1, /app2 (multi-tenant)
  
  Create vhost:
  rabbitmqctl add_vhost /my-vhost
  rabbitmqctl set_permissions -p /my-vhost appuser ".*" ".*" ".*"
```

## 3.2 Message Flow

```
PRODUCER → RABBITMQ:
  1. Producer creates connection + channel
  2. Producer publishes to EXCHANGE (not directly to queue!)
     channel.basicPublish(exchange, routingKey, properties, body)
  3. Exchange applies routing rules (type-dependent)
  4. Exchange routes to matching queue(s)
  5. Queue stores message (in memory + disk if persistent)
  6. Broker ACKs to producer (if publisher confirms enabled)
  
RABBITMQ → CONSUMER:
  1. Consumer creates connection + channel
  2. Consumer subscribes to QUEUE
     channel.basicConsume(queueName, autoAck, consumer)
  3. Broker pushes messages to consumer
  4. Consumer processes message
  5. Consumer sends ACK (explicit) or auto-ACKed
  6. Broker removes ACKed message from queue
  7. If NACK/reject: message can be requeued or dead-lettered
```

---

# 4. Exchanges — Complete Guide

## 4.1 Exchange Types

```
RABBITMQ HAS 4 BUILT-IN EXCHANGE TYPES:
  direct:  route by exact routing key match
  fanout:  broadcast to ALL bound queues
  topic:   route by routing key pattern (wildcards)
  headers: route by message header values (rarely used)
  + custom: plugins can add exchange types (consistent-hash, etc.)

ALSO:
  Default exchange: nameless exchange, routes by queue name
  Dead Letter Exchange (DLX): receives undeliverable messages
  Alternate Exchange: fallback if no routes match
```

```java
// ── CHANNEL: declare exchange and queue ──
// Both producer and consumer should declare (idempotent if params match)

// DECLARE EXCHANGE:
channel.exchangeDeclare(
    "orders",        // name
    "topic",         // type: direct, fanout, topic, headers
    true,            // durable: survive broker restart
    false,           // autoDelete: delete when no bindings
    false,           // internal: only receive from other exchanges
    null             // arguments: Map<String, Object>
);

// DECLARE QUEUE:
Map<String, Object> args = new HashMap<>();
args.put("x-dead-letter-exchange", "orders.dlx");  // DLX
args.put("x-message-ttl", 3600000);                // 1 hour TTL
args.put("x-max-length", 100000);                  // max 100K messages
args.put("x-max-priority", 10);                    // priority queue

channel.queueDeclare(
    "orders.processing",  // name (empty = auto-generated unique name)
    true,                 // durable: survive restart
    false,                // exclusive: only this connection
    false,                // autoDelete: delete when no consumers
    args                  // additional arguments
);

// BIND QUEUE TO EXCHANGE:
channel.queueBind(
    "orders.processing",  // queue name
    "orders",             // exchange name
    "orders.#"            // routing key (pattern for topic exchange)
);
```

## 4.2 Direct Exchange

```
DIRECT EXCHANGE: route to queues where binding key = routing key
  Exact string match
  One message → one queue (or multiple if same binding key)

                                  binding: "high"
  Producer ──▶ [direct exchange] ─────────────────▶ [high-priority-queue]
  routingKey:                    ─────────────────▶ [normal-queue]
  "high"                          binding: "high"
                                  (multiple queues can have same binding!)

USE CASES:
  Task routing to specific workers
  Log level routing (error, warn, info)
  Command routing (payment.capture, payment.refund)
```

```java
// DIRECT EXCHANGE SETUP:
channel.exchangeDeclare("payments", BuiltinExchangeType.DIRECT, true);

channel.queueDeclare("payment.capture", true, false, false, null);
channel.queueDeclare("payment.refund",  true, false, false, null);
channel.queueDeclare("payment.dispute", true, false, false, null);

channel.queueBind("payment.capture", "payments", "capture");
channel.queueBind("payment.refund",  "payments", "refund");
channel.queueBind("payment.dispute", "payments", "dispute");

// PUBLISH to direct exchange:
channel.basicPublish("payments", "capture",  // exchange, routingKey
    MessageProperties.PERSISTENT_TEXT_PLAIN, capturePayload);
channel.basicPublish("payments", "refund",   // → payment.refund queue
    MessageProperties.PERSISTENT_TEXT_PLAIN, refundPayload);

// DEFAULT EXCHANGE (special direct exchange with name ""):
// Binding: every queue is AUTOMATICALLY bound to default exchange
//          with routing key = queue name
channel.basicPublish("", "orders.processing",  // "" = default exchange
    MessageProperties.PERSISTENT_TEXT_PLAIN, body);
// This sends directly to "orders.processing" queue
// Useful for simple point-to-point (no exchange configuration needed)
```

## 4.3 Fanout Exchange

```
FANOUT EXCHANGE: broadcast to ALL bound queues
  Routing key IGNORED
  Message copied to every queue

              binding (any key, ignored)
Producer ──▶ [fanout exchange] ─────────▶ [email-service queue]
routingKey:                    ─────────▶ [sms-service queue]
(ignored)                      ─────────▶ [push-service queue]
                               ─────────▶ [analytics queue]

USE CASES:
  Event broadcasting (order confirmed → notify all interested services)
  Cache invalidation (update → notify all cache nodes)
  Logging (copy to multiple logging systems)
  Live score updates (football → notify all connected apps)
```

```java
// FANOUT EXCHANGE:
channel.exchangeDeclare("order.events", BuiltinExchangeType.FANOUT, true);

// Each consumer creates its OWN queue (often auto-named, exclusive):
String emailQueue = channel.queueDeclare().getQueue();  // auto-named
String smsQueue   = channel.queueDeclare().getQueue();
String auditQueue = channel.queueDeclare("order.audit", true, false, false, null).getQueue();

// Bind all to fanout exchange (routing key is irrelevant for fanout):
channel.queueBind(emailQueue, "order.events", "");
channel.queueBind(smsQueue,   "order.events", "");
channel.queueBind(auditQueue, "order.events", "");

// PUBLISH (routing key ignored):
channel.basicPublish("order.events", "",  // routingKey ignored!
    MessageProperties.PERSISTENT_TEXT_PLAIN, 
    "{\"orderId\": \"123\", \"event\": \"confirmed\"}".getBytes());
// ALL three queues receive this message!
```

## 4.4 Topic Exchange

```
TOPIC EXCHANGE: route by routing key pattern
  Routing key: words separated by "." (e.g., "orders.vietnam.express")
  Binding patterns:
    * = exactly ONE word
    # = zero or more words

  "orders.vietnam.express" matches:
    "orders.#"              YES (# = vietnam.express)
    "orders.*.express"      YES (* = vietnam)
    "orders.vietnam.*"      YES (* = express)
    "*.vietnam.*"           YES
    "#.express"             YES
    "orders.#.express"      YES (# = vietnam)
    "orders.europe.express" NO  (europe ≠ vietnam)
    "orders.vietnam"        NO  (missing express)

ROUTING KEY CONVENTION:
  entity.location.action: "order.vietnam.created"
  service.level.event:    "payment.high.processed"
  app.component.severity: "web.auth.error"

USE CASES:
  Log routing (app.production.error, app.staging.warn)
  Regional routing (orders.vietnam.express)
  Wildcard subscriptions (service monitoring any topic)
```

```java
// TOPIC EXCHANGE — most flexible!
channel.exchangeDeclare("logs", BuiltinExchangeType.TOPIC, true);

// Different queues interested in different topics:
channel.queueDeclare("all-errors",   true, false, false, null);
channel.queueDeclare("kern-logs",    true, false, false, null);
channel.queueDeclare("critical-all", true, false, false, null);

// Bindings with patterns:
channel.queueBind("all-errors",    "logs", "*.*.error");    // any app, any host, error
channel.queueBind("kern-errors",   "logs", "kern.*");        // any kern message
channel.queueBind("critical-all",  "logs", "#.critical");   // critical from anywhere

// Publishing with dot-separated routing keys:
channel.basicPublish("logs", "kern.prod.error",    props, kernelError.getBytes());
// Received by: all-errors ✅, kern-logs ✅, critical-all ❌

channel.basicPublish("logs", "web.prod.critical",  props, webCritical.getBytes());
// Received by: all-errors ❌, kern-logs ❌, critical-all ✅

channel.basicPublish("logs", "app.staging.error",  props, appError.getBytes());
// Received by: all-errors ✅, kern-logs ❌, critical-all ❌

channel.basicPublish("logs", "kern.dev.critical",  props, kernCritical.getBytes());
// Received by: all-errors ❌, kern-logs ✅, critical-all ✅
```

## 4.5 Headers Exchange

```java
// HEADERS EXCHANGE: route based on message headers (not routing key)
// More expressive than topic but less common, more overhead

channel.exchangeDeclare("reports", BuiltinExchangeType.HEADERS, true);

// Bind with header matching rules:
Map<String, Object> pdfHeaders = new HashMap<>();
pdfHeaders.put("format", "pdf");
pdfHeaders.put("type", "report");
pdfHeaders.put("x-match", "all");  // "all" = AND logic, "any" = OR logic

channel.queueBind("pdf-queue", "reports", "", pdfHeaders);

Map<String, Object> urgentHeaders = new HashMap<>();
urgentHeaders.put("priority", "urgent");
urgentHeaders.put("x-match", "any");  // any matching header → route here

channel.queueBind("urgent-queue", "reports", "", urgentHeaders);

// Publishing with headers:
AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
    .headers(Map.of("format", "pdf", "type", "report", "priority", "normal"))
    .deliveryMode(2)
    .build();

channel.basicPublish("reports", "",  // routing key ignored for headers exchange
    props, reportData);
// Received by: pdf-queue (matches all: format=pdf AND type=report)
// NOT urgent-queue (priority=normal, not urgent)
```

---

# 5. Queues — Deep Dive

## 5.1 Queue Properties

```java
// QUEUE DECLARATION with all options:
Map<String, Object> args = new HashMap<>();

// ── MESSAGE TTL ──
args.put("x-message-ttl", 60000);           // messages expire after 60s
// Per-message TTL (overrides queue TTL if smaller):
AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
    .expiration("30000")                     // 30s (string, milliseconds!)
    .build();

// ── QUEUE LENGTH LIMITS ──
args.put("x-max-length", 10000);            // max 10K messages
args.put("x-max-length-bytes", 10485760);   // max 10MB total
// Overflow behavior when limit reached:
args.put("x-overflow", "drop-head");         // drop oldest (default)
args.put("x-overflow", "reject-publish");    // reject new publishes
args.put("x-overflow", "reject-publish-dlx"); // reject + dead-letter

// ── DEAD LETTER EXCHANGE ──
args.put("x-dead-letter-exchange", "orders.dlx");
// Optionally set DL routing key (overrides original routing key):
args.put("x-dead-letter-routing-key", "dead.orders");
// Messages dead-lettered when:
//   1. Rejected (basicReject/basicNack with requeue=false)
//   2. TTL expired
//   3. Queue max-length exceeded (with drop-head behavior)

// ── PRIORITY QUEUE ──
args.put("x-max-priority", 10);             // priorities 0-10
// Higher number = higher priority
// Publish with priority:
AMQP.BasicProperties highPriority = new AMQP.BasicProperties.Builder()
    .priority(8)                             // 8 out of 10
    .build();

// ── QUEUE TTL ──
args.put("x-expires", 1800000);             // queue expires if unused for 30 min

// ── LAZY QUEUE (for very large queues) ──
args.put("x-queue-mode", "lazy");           // deprecated in 3.12+
// In RabbitMQ 3.12+: queues are lazy by default (memory-efficient)

// ── SINGLE ACTIVE CONSUMER ──
args.put("x-single-active-consumer", true); // only 1 consumer at a time
// Others wait; if active consumer disconnects, next takes over
// Use for: strict ordering with multiple consumers

// ── QUORUM QUEUE (recommended for production HA) ──
args.put("x-queue-type", "quorum");         // Raft-based, replicated, durable
// OR:
args.put("x-queue-type", "stream");         // Kafka-like stream (replay!)

Map.Entry<String, AMQP.Queue.DeclareOk> result = channel.queueDeclare(
    "orders.processing",
    true,    // durable
    false,   // exclusive (only this connection, deleted on disconnect)
    false,   // autoDelete (deleted when last consumer disconnects)
    args
);
```

## 5.2 Queue Types

```
CLASSIC QUEUES (default):
  Original RabbitMQ queue implementation
  Stored in memory (with option to page to disk)
  Per-queue process in Erlang
  For HA: mirrored queues (deprecated in 3.13!)
  
QUORUM QUEUES (recommended for new systems):
  Based on Raft consensus protocol
  Replicated across N nodes (quorum)
  Replaces classic mirrored queues
  
  Advantages over classic:
  ✅ Strong consistency via Raft
  ✅ Predictable behavior on failures
  ✅ Dead letter with routing key cycles detection
  ✅ Delivery limits (prevent poison messages)
  
  Limitations:
  ❌ Higher memory (must keep committed log)
  ❌ No per-message TTL (only per-queue TTL)
  ❌ No priority queues
  ❌ Minimum 3 nodes for meaningful HA

STREAM QUEUES (RabbitMQ 3.9+):
  Persistent, append-only log (like Kafka!)
  Multiple consumers can read from ANY offset
  Long retention
  Much faster for high-throughput scenarios
  (Covered in section 10)

CHOOSING QUEUE TYPE:
  Task queue, RPC, simple workloads:   Classic (small) or Quorum
  High availability, important data:   Quorum (always!)
  Event streaming, log replay:         Stream
  Large volumes, time series:          Stream
```

---

# 6. Message Lifecycle & Delivery Guarantees

## 6.1 Publisher Confirms

```java
// BY DEFAULT: RabbitMQ offers no delivery guarantee!
// basicPublish returns immediately — message might be lost!
// For guarantees: PUBLISHER CONFIRMS

// ENABLE PUBLISHER CONFIRMS on channel:
channel.confirmSelect();

// ── SYNCHRONOUS CONFIRM (simple, blocking) ──
channel.basicPublish(exchange, routingKey, props, body);
if (!channel.waitForConfirms(5000)) {  // wait up to 5s
    // Message NOT confirmed → retry or handle error!
    handleUnconfirmed(message);
}
// PROBLEM: one message at a time → terrible throughput (RTT latency per message)

// ── ASYNC CONFIRM LISTENER (high throughput) ──
channel.addConfirmListener(new ConfirmListener() {
    @Override
    public void handleAck(long deliveryTag, boolean multiple) {
        // Message(s) successfully stored by broker
        if (multiple) {
            // All messages up to deliveryTag confirmed
            confirmedMessages.headMap(deliveryTag, true).clear();
        } else {
            confirmedMessages.remove(deliveryTag);
        }
    }

    @Override
    public void handleNack(long deliveryTag, boolean multiple) {
        // Message(s) NOT stored (broker internal error)
        // MUST retry!
        if (multiple) {
            confirmedMessages.headMap(deliveryTag, true)
                .forEach((tag, msg) -> resend(msg));
        } else {
            resend(confirmedMessages.get(deliveryTag));
        }
    }
});

// Track unconfirmed messages:
ConcurrentNavigableMap<Long, byte[]> unconfirmedMessages = new ConcurrentSkipListMap<>();

for (String message : messages) {
    byte[] body = message.getBytes();
    long seqNo = channel.getNextPublishSeqNo();  // sequence number
    unconfirmedMessages.put(seqNo, body);
    channel.basicPublish(exchange, routingKey, props, body);
}

// Wait for all confirmations:
if (!channel.waitForConfirms(60000)) {
    log.error("Some messages not confirmed! Unconfirmed: {}", unconfirmedMessages.size());
    // Resend unconfirmed messages
}

// ── MANDATORY FLAG ── (unroutable message handling)
channel.basicPublish(exchange, routingKey, mandatory=true, props, body);
// If message can't be routed to any queue → broker returns it to producer!
channel.addReturnListener((replyCode, replyText, exchange, routingKey, properties, body) -> {
    log.error("Message returned! Code: {} Reason: {}", replyCode, replyText);
    // Handle unroutable message
});
// Alternative: set alternate-exchange on exchange to catch unroutable messages
```

## 6.2 Message Persistence

```java
// PERSISTENT MESSAGES: survive broker restart
// REQUIRES BOTH:
//   1. Durable queue
//   2. Persistent message (delivery-mode=2)

// DURABLE queue (declared with durable=true)
channel.queueDeclare("orders", true, false, false, null);

// PERSISTENT message:
channel.basicPublish(
    "orders", "key",
    MessageProperties.PERSISTENT_TEXT_PLAIN,  // delivery-mode=2
    body
);

// Or explicit:
AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
    .deliveryMode(2)          // 2 = persistent, 1 = transient
    .contentType("application/json")
    .contentEncoding("UTF-8")
    .timestamp(new Date())
    .messageId(UUID.randomUUID().toString())
    .build();

// TRANSIENT message on DURABLE queue:
// Queue survives restart but transient messages DON'T
// Use for: messages where loss on restart is acceptable (cache warming)

// PERFORMANCE IMPACT:
// Persistent messages: written to disk → slower but safe
// Transient messages: in memory → faster but lost on restart
// With Quorum queues: ALL messages are persisted (to WAL log)
```

---

# 7. Consumers & Acknowledgment

## 7.1 Consumer Setup & QoS

```java
// BASIC CONSUME (push, preferred for most cases):
DeliverCallback deliverCallback = (consumerTag, delivery) -> {
    AMQP.BasicProperties properties = delivery.getProperties();
    byte[] body = delivery.getBody();
    long deliveryTag = delivery.getEnvelope().getDeliveryTag();
    String routingKey = delivery.getEnvelope().getRoutingKey();

    try {
        OrderEvent event = deserialize(body, OrderEvent.class);
        orderProcessor.process(event);

        // ACKNOWLEDGE: remove from queue
        channel.basicAck(deliveryTag, false);  // false = only this message
        // true = ack all messages up to this deliveryTag (batch ack)
    } catch (RecoverableException e) {
        // Requeue for retry:
        channel.basicNack(deliveryTag, false, true);  // requeue=true
        // WARNING: if always failing → infinite retry loop!
        // Use DLX + retry counter to prevent this
    } catch (PoisonMessageException e) {
        // Don't requeue — send to dead letter:
        channel.basicNack(deliveryTag, false, false); // requeue=false → DLX
        // OR:
        channel.basicReject(deliveryTag, false);       // same as nack for single message
    }
};

CancelCallback cancelCallback = (consumerTag) -> {
    log.warn("Consumer cancelled: {}", consumerTag);
    // Re-subscribe or alert
};

// QOS — PREFETCH (critical for performance!):
// Without prefetch: broker sends ALL queued messages at once!
// Consumer buffer overwhelmed, fairness lost, OOM possible
channel.basicQos(
    0,        // prefetchSize: 0 = no size limit
    50,       // prefetchCount: max 50 unacked messages at a time
    false     // global: false = per-consumer, true = per-channel
);
// Only after ACKing a message will broker send the next one
// Optimal prefetchCount: tune based on message processing time + throughput

String consumerTag = channel.basicConsume(
    "orders.processing",  // queue
    false,                // autoAck: FALSE! Always manual for reliability
    "order-processor-1",  // consumer tag (for identification)
    deliverCallback,
    cancelCallback
);

// CANCEL CONSUMER:
channel.basicCancel(consumerTag);

// BASIC GET (manual pull, not recommended for production):
GetResponse response = channel.basicGet("orders.processing", false);
if (response != null) {
    processMessage(response.getBody());
    channel.basicAck(response.getEnvelope().getDeliveryTag(), false);
}
// Inefficient: one message per round trip
// Use push-based consume for production!
```

## 7.2 Consumer Fairness & Load Balancing

```
WITHOUT QOS (prefetch):
  Queue: [1][2][3][4][5][6][7][8][9][10]
  Consumer A: receives ALL messages (buffered)!
  Consumer B: idle!
  
  Problem: Consumer A buffer: 10 messages waiting
  Consumer B: nothing to do
  Not fair!

WITH QOS prefetchCount=1:
  Queue: [1][2][3][4][5][6][7][8][9][10]
  Consumer A receives [1], processing...
  Consumer B receives [2], processing...
  Consumer A ACKs [1] → receives [3]
  Consumer B ACKs [2] → receives [4]
  ...perfect round-robin!

PREFETCH TUNING:
  prefetch=1:   safest, fairest, slowest (broker waits for ACK each time)
  prefetch=10:  balanced (broker sends 10, waits until some ACKed)
  prefetch=100: high throughput (less waiting for broker)
  
  Rule of thumb: prefetch ≈ (max processing time / target round-trip time)
  
  E.g.: processing 50ms, broker RTT 5ms, target throughput 100 msg/s
  In-flight: 100 × 50ms = 5 messages/consumer
  Set prefetch=10 (with buffer)

COMPETING CONSUMERS (horizontal scaling):
  Multiple consumers on SAME queue:
    Consumer A, B, C all consume "orders.processing"
    Broker distributes messages (round-robin by default)
    With prefetch: distributed based on capacity
  
  Scale out: just add more consumers (no reconfiguration needed!)
  Scale in: consumers disconnect, messages redistributed automatically
```

---

# 8. RabbitMQ Clustering & High Availability

## 8.1 RabbitMQ Cluster

```
CLUSTER: multiple Erlang nodes forming one logical broker
  Shared: exchanges, vhosts, users, permissions, bindings
  NOT shared by default: queue DATA (queues live on one node)
  
  rabbit@node1 ──── rabbit@node2 ──── rabbit@node3
  
  Queue "orders" declared on node1:
    node1: has queue data
    node2: has queue metadata (knows queue is on node1)
    node3: has queue metadata
    
    Client connects to node2, publishes to "orders":
    node2 → routes to node1 transparently!

ERLANG COOKIE:
  All cluster nodes must share same ~/.erlang.cookie
  Authentication mechanism between Erlang nodes
  echo "my-secret-cookie" > ~/.erlang.cookie
  chmod 400 ~/.erlang.cookie
  
CLUSTER SETUP:
  rabbitmqctl stop_app
  rabbitmqctl reset
  rabbitmqctl join_cluster rabbit@node1
  rabbitmqctl start_app
  rabbitmqctl cluster_status  # verify

LIMITATIONS (classic cluster):
  Queue data on ONE node → if that node fails → queue unavailable!
  Solution: Quorum Queues (replicate data across nodes!)

QUORUM QUEUES REPLICATION:
  "x-queue-type": "quorum"
  Leader node: receives writes, replicates to followers
  Follower nodes: replicas, can serve reads
  
  Quorum (majority): (n/2)+1 nodes must acknowledge write
  3 nodes → need 2 acks
  5 nodes → need 3 acks
  
  initial-quorum-queue-size: how many replicas initially
  # Per queue:
  args.put("x-quorum-initial-group-size", 3);  // start with 3 replicas
```

## 8.2 Load Balancer + Client Configuration

```java
// LOAD BALANCER in front of RabbitMQ cluster:
// HAProxy, Nginx, AWS ALB
// Clients connect to LB → distributed across nodes

// SPRING BOOT multi-node config:
spring:
  rabbitmq:
    addresses: rabbit1:5672,rabbit2:5672,rabbit3:5672
    username: appuser
    password: secret
    virtual-host: /production
    publisher-confirms: CORRELATED  # or SIMPLE
    publisher-returns: true
    connection-timeout: 10000
    listener:
      simple:
        acknowledge-mode: MANUAL
        prefetch: 50
        concurrency: 3      # 3 consumer threads
        max-concurrency: 10 # scale up to 10 under load
        retry:
          enabled: true
          max-attempts: 5
          initial-interval: 2000
          multiplier: 2.0
          max-interval: 30000
    template:
      mandatory: true
      retry:
        enabled: true
        max-attempts: 3

// Java with auto-recovery:
ConnectionFactory factory = new ConnectionFactory();
factory.setAutomaticRecoveryEnabled(true);
factory.setNetworkRecoveryInterval(5000);       // retry every 5s
factory.setTopologyRecoveryEnabled(true);       // re-declare topology
factory.setConnectionRecoveryTriggeringCondition(cause -> {
    return !(cause instanceof AuthenticationFailureException);
});

// Connection recovery retries:
factory.setRecoveryDelayHandler(nbAttempts -> {
    return Math.min(nbAttempts * 1000L, 30_000L);  // exponential backoff
});
```

---

# 9. Advanced Patterns

## 9.1 Dead Letter Queue (DLQ) Pattern

```java
// FULL DLQ SETUP with retry:

// Step 1: Main queue with DLX configured
Map<String, Object> mainArgs = new HashMap<>();
mainArgs.put("x-dead-letter-exchange", "orders.retry");
mainArgs.put("x-dead-letter-routing-key", "orders.retry");
mainArgs.put("x-message-ttl", 3600000);  // 1 hour max
channel.queueDeclare("orders.main", true, false, false, mainArgs);

// Step 2: Retry queue (holds failed messages for 30s before re-queuing)
Map<String, Object> retryArgs = new HashMap<>();
retryArgs.put("x-dead-letter-exchange", "orders.main.exchange");
retryArgs.put("x-dead-letter-routing-key", "orders.main");
retryArgs.put("x-message-ttl", 30000);          // wait 30s before retry
retryArgs.put("x-message-ttl", 0);              // actually: no consumers, message expires → DLX back to main
channel.queueDeclare("orders.retry.30s", true, false, false, retryArgs);

// Step 3: Dead letter queue (truly failed messages)
channel.queueDeclare("orders.dead-letter", true, false, false, null);
channel.queueBind("orders.dead-letter", "orders.dlx.final", "#");

// EXPONENTIAL BACKOFF RETRY:
// Retry queues at different intervals: 5s, 30s, 2min, 10min

// DELIVERY LIMIT (Quorum Queues only):
Map<String, Object> quorumArgs = new HashMap<>();
quorumArgs.put("x-queue-type", "quorum");
quorumArgs.put("x-delivery-limit", 5);    // after 5 failed deliveries → dead letter
quorumArgs.put("x-dead-letter-exchange", "orders.dlx");
channel.queueDeclare("orders.quorum", true, false, false, quorumArgs);
// No need to track retry count manually!

// CONSUMER with retry tracking:
deliverCallback = (consumerTag, delivery) -> {
    Map<String, Object> headers = delivery.getProperties().getHeaders();
    Integer retryCount = headers != null ? (Integer) headers.get("x-retry-count") : 0;
    
    try {
        process(delivery.getBody());
        channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
    } catch (Exception e) {
        if (retryCount < 5) {
            // Add retry count header and republish to retry queue:
            AMQP.BasicProperties retryProps = new AMQP.BasicProperties.Builder()
                .headers(Map.of("x-retry-count", retryCount + 1,
                                "x-error", e.getMessage(),
                                "x-original-queue", "orders.main"))
                .deliveryMode(2)
                .build();
            channel.basicPublish("", "orders.retry.30s", retryProps, delivery.getBody());
            channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
        } else {
            // Max retries exceeded → dead letter
            channel.basicNack(delivery.getEnvelope().getDeliveryTag(), false, false);
        }
    }
};
```

## 9.2 RPC Pattern (Request-Reply)

```java
// RPC over RabbitMQ:
// Client sends request → includes replyTo and correlationId
// Server processes → sends reply to replyTo queue with correlationId

// RPC CLIENT:
public class RabbitRpcClient {
    private final Channel channel;
    private final String requestQueue;
    private final Map<String, CompletableFuture<byte[]>> pendingCalls = new ConcurrentHashMap<>();

    public RabbitRpcClient(Channel channel, String requestQueue) throws IOException {
        this.channel = channel;
        this.requestQueue = requestQueue;
        
        // Create exclusive, auto-delete reply queue:
        String replyQueue = channel.queueDeclare().getQueue();  // auto-named
        
        // Listen for replies:
        channel.basicConsume(replyQueue, true, (tag, delivery) -> {
            String correlationId = delivery.getProperties().getCorrelationId();
            CompletableFuture<byte[]> future = pendingCalls.remove(correlationId);
            if (future != null) {
                future.complete(delivery.getBody());
            }
        }, tag -> {});
    }
    
    public CompletableFuture<byte[]> call(byte[] request) throws IOException {
        String correlationId = UUID.randomUUID().toString();
        CompletableFuture<byte[]> future = new CompletableFuture<>();
        pendingCalls.put(correlationId, future);
        
        AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
            .correlationId(correlationId)
            .replyTo(replyQueue)
            .expiration("30000")  // 30s timeout
            .build();
        
        channel.basicPublish("", requestQueue, props, request);
        return future;
    }
}

// Usage:
byte[] response = rpcClient.call(request).get(30, TimeUnit.SECONDS);

// RPC SERVER:
channel.basicConsume("rpc-queue", false, (tag, delivery) -> {
    byte[] result = processRequest(delivery.getBody());
    
    AMQP.BasicProperties replyProps = new AMQP.BasicProperties.Builder()
        .correlationId(delivery.getProperties().getCorrelationId())  // echo back!
        .build();
    
    channel.basicPublish(
        "",                                    // default exchange
        delivery.getProperties().getReplyTo(), // send to client's reply queue
        replyProps,
        result
    );
    channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
}, tag -> {});
```

## 9.3 Consistent Hash Exchange

```java
// CONSISTENT HASH EXCHANGE (plugin: rabbitmq-consistent-hash-exchange):
// Route messages to queues based on hash of routing key
// Ensures same routing key ALWAYS goes to same queue
// Useful for: ordered processing per customer/user, partitioning

channel.exchangeDeclare("orders.hash", "x-consistent-hash", true);

// Queues with weights (higher weight = more messages):
channel.queueDeclare("orders.shard.0", true, false, false, null);
channel.queueDeclare("orders.shard.1", true, false, false, null);
channel.queueDeclare("orders.shard.2", true, false, false, null);

// Weight is the binding key (number as string):
channel.queueBind("orders.shard.0", "orders.hash", "10");  // weight 10
channel.queueBind("orders.shard.1", "orders.hash", "10");  // weight 10
channel.queueBind("orders.shard.2", "orders.hash", "10");  // weight 10

// Publishing: routing key = entity to hash on (user_id, order_id)
channel.basicPublish("orders.hash", "user:123", props, body);
// user:123 ALWAYS routes to same shard → ordered processing per user!
```

---

# 10. RabbitMQ Streams (Kafka-like)

## 10.1 RabbitMQ Streams

```java
// RABBITMQ STREAMS (3.9+): persistent, replayable, high-throughput
// Like Kafka built into RabbitMQ!
// Uses DIFFERENT protocol: Stream Protocol (port 5552)

// DECLARE STREAM:
Map<String, Object> streamArgs = new HashMap<>();
streamArgs.put("x-queue-type", "stream");
streamArgs.put("x-max-length-bytes", 10_737_418_240L);  // 10GB max
streamArgs.put("x-stream-max-segment-size-bytes", 500_000_000L); // 500MB segments
streamArgs.put("x-max-age", "7D");   // keep 7 days of data

channel.queueDeclare("orders.stream", true, false, false, streamArgs);

// CONSUME from any offset:
Map<String, Object> consumerArgs = new HashMap<>();
consumerArgs.put("x-stream-offset", "first");      // from beginning
// or:
consumerArgs.put("x-stream-offset", "last");       // only new messages
// or:
consumerArgs.put("x-stream-offset", "next");       // alias for last
// or:
consumerArgs.put("x-stream-offset", 100L);         // from offset 100
// or:
consumerArgs.put("x-stream-offset", new Date(timestamp)); // from timestamp

channel.basicQos(100);  // REQUIRED for streams!
channel.basicConsume("orders.stream", false, consumerArgs,
    deliverCallback, cancelCallback);

// STREAM JAVA CLIENT (dedicated, more features):
// io.github.rabbitmq:rabbitmq-stream-java-client
Environment env = Environment.builder()
    .host("rabbitmq")
    .build();

Producer producer = env.producerBuilder()
    .stream("orders.stream")
    .build();

// Send message:
producer.send(
    producer.messageBuilder()
        .addData("order-data".getBytes())
        .properties()
            .correlationId(UUID.randomUUID().toString())
            .messageId("msg-1")
        .messageBuilder()
        .build(),
    confirmationStatus -> {
        if (!confirmationStatus.isConfirmed())
            handleError(confirmationStatus.getCode());
    }
);

// Consumer with offset tracking:
Consumer consumer = env.consumerBuilder()
    .stream("orders.stream")
    .name("order-processor")          // consumer name for offset tracking!
    .autoTrackingStrategy()           // auto-commit offsets
        .messageCountBeforeStorage(100)
    .builder()
    .offset(OffsetSpecification.first())
    .messageHandler((offset, message) -> {
        processMessage(message.getBodyAsBinary());
    })
    .build();

// STREAMS vs AMQP QUEUES:
//                Streams         Classic/Quorum Queues
// Retention      Long (days)     Until consumed
// Replay         ✅ Yes          ❌ No
// Multi-consumer Same messages   Each consumer gets different messages
// Throughput     Very high       High
// Ordering       Per stream      Per queue
// Use case       Event log       Task queue
```

---

# 11. Message Queue Market Comparison

## 11.1 The Landscape

```
MESSAGE QUEUE / STREAMING PLATFORMS:
  
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  TRADITIONAL MESSAGE BROKERS          STREAMING PLATFORMS          │
  │  (push, routing, task queues)         (pull, log, replay)          │
  │                                                                     │
  │  RabbitMQ    ActiveMQ    IBM MQ        Apache Kafka                │
  │  Azure SB    AWS SQS     HiveMQ        Apache Pulsar               │
  │  Google PubSub NATS      Mosquitto      AWS Kinesis                │
  │                          (MQTT)         Redis Streams              │
  │                                         RabbitMQ Streams           │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘

CHOOSING A MESSAGE QUEUE:
  Core questions:
  1. Do consumers need to REPLAY messages? → Streaming platform
  2. Do you need complex ROUTING logic? → RabbitMQ
  3. Do you need ULTRA-HIGH throughput (millions/sec)? → Kafka/Pulsar
  4. Do you want ZERO OPERATIONS? → Managed services (SQS, PubSub, EventBridge)
  5. Is this IoT/device communication? → MQTT (Mosquitto, HiveMQ)
  6. Do you need request-reply RPC? → RabbitMQ or NATS
  7. Simple AWS integration? → SQS/SNS
```

## 11.2 Full Comparison Matrix

```
                Apache Kafka   RabbitMQ      AWS SQS        Apache Pulsar
────────────────────────────────────────────────────────────────────────────
TYPE            Distributed    Message       Managed        Streaming +
                commit log     broker        queue          messaging
PROTOCOL        Kafka native   AMQP 0-9-1    HTTP/SQS API  Pulsar native
                               MQTT, STOMP                  AMQP, MQTT
MESSAGE MODEL   Pull           Push + Pull   Pull           Push + Pull
ORDERING        Per partition  Per queue     FIFO queues    Per topic
                                             ordered       partition
RETENTION       Days/forever   Until consumed 4d/14d       Configurable
REPLAY          ✅ Yes         ❌ (Streams✅) ❌ No         ✅ Yes
ROUTING         Topic-based    Rich (direct, None (by      Topic-based
                               fanout,topic, queue name)
                               headers)
THROUGHPUT      Millions/sec   100K+/sec     High (AWS     Millions/sec
                                             managed)
LATENCY         Low (ms)       Low (ms)      Medium (ms-s) Low (ms)
OPERATIONS      Complex        Medium        None (managed) Medium
CLUSTERING      Built-in       Built-in      Auto (AWS)    Built-in
MULTI-TENANCY   Limited        VHosts        AWS accounts  Native (namespace)
SCHEMA          Schema         None built-in None          Schema registry
                Registry                                    built-in
STREAM PROC     Kafka Streams  Limited       Lambda        Pulsar Functions
                KsqlDB         (3.9+)
PERSISTENCE     Disk (always)  Memory+Disk   AWS-managed   BookKeeper
                                             (EFS)         (separate)
CLOUD NATIVE    Self-hosted    Self-hosted   AWS native    Multi-cloud
                (MSK managed)  (CloudAMQP)
LICENSE         Apache 2.0    Mozilla       Proprietary   Apache 2.0
                               (BSL 2.1 for (AWS)
                               newer)
BEST FOR        Event stream   Task queues  AWS ecosystem  Multi-cloud,
                analytics      complex      simple use    serverless,
                microservices  routing      cases         geo-repl.
```

```
                AWS SQS        AWS SNS        AWS EventBridge  Google PubSub
────────────────────────────────────────────────────────────────────────────
TYPE            Queue          Pub/Sub        Event bus        Pub/Sub
DELIVERY        At-least-once  At-least-once  At-least-once    At-least-once
ORDERING        Optional FIFO  No (SNS+SQS)  No               No
RETENTION       4 days (std)   None           24 hours         7 days
                14 days (FIFO)
REPLAY          ❌ No          ❌ No          ❌ No (archive)  Limited
THROUGHPUT      3000 FIFO/s    300K pub/s    Throttled        10MB/s/topic
                Unlimited std
ROUTING         Queue per URL  Topic ARN     Pattern matching Simple
MAX MSG SIZE    256KB          256KB         256KB            10MB
CONSUMERS       One per msg    Fan-out       Rules-based      Multiple groups
DEDUP           FIFO: yes      No            No               No
USE CASE        Task queue     Fan-out notif Event-driven     GCP-native
                decoupling     AWS services  SaaS integrations pub/sub
COST            Per request    Per request   Per event        Per message
MANAGED         ✅ Fully       ✅ Fully      ✅ Fully         ✅ Fully
```

```
                NATS           Redis Streams  ActiveMQ       IBM MQ
────────────────────────────────────────────────────────────────────
TYPE            Messaging       In-memory     Message        Enterprise
                system          stream        broker         MQ
PROTOCOL        NATS            RESP          AMQP, OpenWire MQ native
                (custom)                      MQTT, STOMP    AMQP
THROUGHPUT      Very high       Very high     Medium         Medium
LATENCY         Sub-ms (<1ms)   Sub-ms        Low            Low
ORDERING        Per subject     Per stream    Per queue      Per queue
RETENTION       Short (memory)  Configurable  Until consumed Until consumed
REPLAY          ✅ JetStream    ✅ Yes        ❌ No          ❌ No
PERSISTENCE     JetStream       Optional      Yes            Yes
CLUSTERING      Yes (Cluster)   Sentinel/     Network of     Multi-instance
                                Cluster       Brokers
CLOUD           Yes (Synadia    Self/Redis    Self-hosted    IBM Cloud
                Cloud)          Cloud
USE CASE        Microservices   Redis users,  Legacy Java    Financial,
                IoT, low-       small scale   EE, Spring     banking,
                latency cloud   caching +     JMS apps       IBM legacy
                native          messaging
ENTERPRISE      OSS + Synadia   OSS           OSS + AMQ      Expensive
SUPPORT                                        (paid)         (IBM)
```

---

# 12. Use Case Decision Guide

## 12.1 Decision Flowchart

```
START: What problem are you solving?

═══════════════════════════════════════════════════════════════════

Q1: Need to REPLAY old messages?
    Yes → Kafka, Pulsar, RabbitMQ Streams, AWS Kinesis
    No  → Continue to Q2

Q2: Primary use: TASK QUEUE (each message processed once by one worker)?
    Yes → RabbitMQ, AWS SQS, ActiveMQ
    No  → Continue to Q3

Q3: Need complex ROUTING (content-based, wildcards, header matching)?
    Yes → RabbitMQ (best routing in the industry)
    No  → Continue to Q4

Q4: Ultra-HIGH THROUGHPUT (>100K msgs/sec) needed?
    Yes → Kafka (1M+/sec), Pulsar (1M+/sec)
    No  → Continue to Q5

Q5: ZERO OPERATIONS (fully managed, no infra management)?
    Yes → AWS: SQS/SNS/EventBridge, Google: PubSub, Azure: Service Bus
    No  → Continue to Q6

Q6: IoT/device communication (MQTT protocol needed)?
    Yes → HiveMQ, Mosquitto, EMQX, or RabbitMQ with MQTT plugin
    No  → Continue to Q7

Q7: Need sub-millisecond latency and microservice RPC?
    Yes → NATS (fastest!), or NATS JetStream for persistence
    No  → Continue to Q8

Q8: Deep AWS ecosystem integration?
    Yes → SQS/SNS/EventBridge
    No  → Continue to Q9

Q9: Multi-cloud, multi-tenant, geo-replication?
    Yes → Apache Pulsar (designed for this!)
    No  → 

Q10: Using Redis already, small scale messaging needed?
    Yes → Redis Streams (keep your stack simple)
    No  → Default recommendation: Kafka (events) or RabbitMQ (tasks)

═══════════════════════════════════════════════════════════════════
```

## 12.2 By Use Case

```
TASK QUEUE / WORKER PATTERN:
  "Process job and mark done, only one worker processes each job"
  ✅ RabbitMQ: competing consumers, ack/nack, DLQ, priority
  ✅ AWS SQS: serverless-friendly, automatic scaling
  ❌ Kafka: not designed for task queue (no per-message ACK delete)

EVENT STREAMING / ANALYTICS PIPELINE:
  "Stream of events, multiple consumers, replay needed"
  ✅ Kafka: industry standard, ecosystem, Kafka Streams, KSQL
  ✅ Apache Pulsar: multi-tenant, tiered storage, Pulsar Functions
  ✅ AWS Kinesis: AWS-native, auto-scaling
  ❌ RabbitMQ: possible (Streams) but not ideal
  ❌ SQS: no replay

MICROSERVICE INTEGRATION (Event-driven):
  "Services communicate via events, eventual consistency"
  ✅ Kafka: for high throughput, event sourcing
  ✅ RabbitMQ: for complex routing, request-reply RPC
  ✅ AWS EventBridge: for SaaS integrations, event filtering
  ✅ NATS: for lightweight, low-latency service mesh

FAN-OUT NOTIFICATIONS:
  "One event → notify many subscribers"
  ✅ RabbitMQ fanout exchange
  ✅ AWS SNS → multiple SQS queues
  ✅ Google PubSub
  ❌ SQS alone (point-to-point only)

REQUEST-REPLY / RPC:
  "Synchronous RPC but with async messaging"
  ✅ RabbitMQ: native replyTo/correlationId support
  ✅ NATS: designed for request-reply (sub-ms!)
  ❌ Kafka: awkward for RPC (not designed for it)

IOT / DEVICE MESSAGING:
  "Millions of IoT devices, MQTT protocol, QoS levels"
  ✅ HiveMQ: enterprise IoT MQTT broker
  ✅ EMQX: high-performance open-source MQTT
  ✅ RabbitMQ + MQTT plugin: for smaller scale
  ✅ AWS IoT Core: fully managed MQTT

FINANCIAL TRANSACTIONS:
  "Strict ordering, exactly-once, audit trail"
  ✅ IBM MQ: battle-tested, XA transactions, banking standard
  ✅ Kafka: exactly-once transactions, event sourcing
  ✅ RabbitMQ: reliable with quorum queues + confirms
  Consider: FIFO SQS for simple AWS-based finance

LOG AGGREGATION:
  "Collect logs from all services, long retention"
  ✅ Kafka: designed for this (LinkedIn's original use case!)
  ✅ AWS Kinesis Data Firehose: S3/Redshift delivery
  ✅ Fluentd → Kafka: common pattern
  ❌ RabbitMQ: not designed for high-retention logs

SAGAS / LONG-RUNNING WORKFLOWS:
  "Coordinate multiple services over time, compensation"
  ✅ RabbitMQ: with DLX, TTL, routing for saga coordination
  ✅ Kafka: choreography-based sagas
  ✅ AWS Step Functions + SQS: for AWS-native orchestration
  ✅ Temporal/Cadence: purpose-built for workflows
```

## 12.3 Side-by-Side Scenarios

```
SCENARIO 1: E-commerce Order Processing
  Volume: 10K orders/sec
  Requirements: task queue, retries, dead letters, notifications
  
  Option A (AWS native):     SQS (orders) + SNS (notifications) + Lambda
    Pro: zero ops, auto-scale
    Con: vendor lock-in, limited routing
  
  Option B (self-hosted):    RabbitMQ
    Pro: rich routing, DLX, priority, RPC to inventory check
    Con: ops overhead
  
  Option C (high scale):     Kafka
    Pro: 10K/sec easily, replay for analytics, stream processing
    Con: no task queue semantics natively, complex

SCENARIO 2: Real-time Analytics Dashboard
  Volume: 1M events/sec from 10K microservices
  Requirements: replay, stream processing, no message loss, multiple dashboards
  
  WINNER: Kafka
    1M/sec handled with 10-20 partitions
    Kafka Streams for real-time aggregations
    Multiple consumer groups (Grafana, ML pipeline, archive)
    Log compaction for latest state
  
  NOT RabbitMQ: not designed for 1M/sec + replay

SCENARIO 3: Multi-region IoT Platform
  Volume: 500K devices, MQTT, geo-replication needed
  Requirements: MQTT, multi-tenant, geo-distribution, tiered storage
  
  Option A: Apache Pulsar
    Native geo-replication
    Built-in multi-tenancy (namespace per customer)
    Tiered storage to S3 (old data offloaded from memory)
    MQTT protocol support (Pulsar MQTT plugin)
  
  Option B: HiveMQ Cluster + Kafka
    HiveMQ: MQTT layer (device connectivity)
    Kafka: backend event streaming
    More complex but industry-proven IoT pattern

SCENARIO 4: Internal Microservices (startup, 5-20 services)
  Volume: 1K messages/sec, growing
  Requirements: simple, reliable, easy to operate
  
  Start with: RabbitMQ (single node)
  Scale with: RabbitMQ cluster + quorum queues
  If needs replay: add RabbitMQ Streams
  
  Don't over-engineer with Kafka until you ACTUALLY need it!
  Kafka complexity at small scale is not worth it.

SCENARIO 5: Serverless / FaaS
  Need: zero management, pay per use, auto-scale
  
  AWS Lambda + SQS: most common
  AWS Lambda + EventBridge: event-driven workflows
  Google Cloud Functions + PubSub
  Azure Functions + Service Bus
  
  All managed: no servers to provision, scale automatically

SCENARIO 6: Legacy Java Enterprise
  Has: Spring JMS, Java EE MessageDrivenBeans, old architecture
  
  Stay with: ActiveMQ (Spring JMS compatible) → upgrade to Artemis (ActiveMQ 6)
  Or: RabbitMQ (Spring AMQP, good Spring Boot support)
  Avoid: Kafka (too different paradigm for task-queue code)
```

---

# 13. Common Mistakes & Anti-Patterns

## 13.1 RabbitMQ Mistakes

```java
// ❌ MISTAKE 1: Sharing channel across threads
// Channels are NOT thread-safe!
Channel sharedChannel = connection.createChannel();

// Thread 1:
sharedChannel.basicPublish(exchange, key, props, body1);
// Thread 2 (simultaneously):
sharedChannel.basicPublish(exchange, key, props, body2);
// RESULT: corrupt frames, channel closure, data mixing!

// ✅ CORRECT: One channel per thread
ThreadLocal<Channel> channelThreadLocal = ThreadLocal.withInitial(() -> {
    try {
        return connection.createChannel();
    } catch (IOException e) {
        throw new RuntimeException(e);
    }
});

// ❌ MISTAKE 2: autoAck=true for non-idempotent operations
channel.basicConsume(queue, true, callback);  // autoAck!
// Message removed from queue WHEN RECEIVED (not when processed!)
// Consumer crashes while processing → message LOST!

// ✅ CORRECT: Always manual ack for important operations
channel.basicConsume(queue, false, (tag, delivery) -> {
    try {
        process(delivery.getBody());
        channel.basicAck(delivery.getEnvelope().getDeliveryTag(), false);
    } catch (Exception e) {
        channel.basicNack(delivery.getEnvelope().getDeliveryTag(), false, true);
    }
});


// ❌ MISTAKE 3: No prefetch (QoS) setting
// Without prefetch: broker sends ALL queued messages to consumer immediately!
// 10K messages queued → consumer gets all 10K at once → OOM!
channel.basicConsume(queue, false, callback);  // no QoS!

// ✅ CORRECT: Set appropriate prefetch
channel.basicQos(50);  // max 50 unacked messages at a time
channel.basicConsume(queue, false, callback);


// ❌ MISTAKE 4: Re-queuing on every exception (poison message loop!)
channel.basicNack(tag, false, true);  // requeue=true for ALL exceptions!
// Unprocessable message → requeueing forever → queue starved → CPU spike

// ✅ CORRECT: Track retries, dead-letter after max retries
// Use x-delivery-limit (Quorum Queues) or track in headers


// ❌ MISTAKE 5: Not declaring durable + persistent for important messages
channel.queueDeclare("orders", false, ...);  // NOT durable!
channel.basicPublish("", "orders",
    MessageProperties.TRANSIENT_TEXT_PLAIN,  // NOT persistent!
    body);
// RabbitMQ restarts → ALL messages LOST!

// ✅ CORRECT: durable queue + persistent messages
channel.queueDeclare("orders", true, false, false, null);
channel.basicPublish("", "orders",
    MessageProperties.PERSISTENT_TEXT_PLAIN, body);


// ❌ MISTAKE 6: Creating new connection per request (connection overhead)
// TCP + auth + vhost = ~100ms
// 1000 req/sec = 1000 new connections/sec → RabbitMQ overwhelmed!
void handleRequest() {
    Connection conn = factory.newConnection();  // PER REQUEST!
    Channel ch = conn.createChannel();
    ch.basicPublish(...);
    conn.close();
}

// ✅ CORRECT: Connection pool
// Spring AMQP: CachingConnectionFactory (handles pooling!)
@Bean
CachingConnectionFactory connectionFactory() {
    CachingConnectionFactory factory = new CachingConnectionFactory("rabbitmq");
    factory.setChannelCacheSize(25);   // cache 25 channels
    factory.setConnectionCacheSize(5); // pool of 5 connections
    return factory;
}


// ❌ MISTAKE 7: Forgetting to handle channel/connection recovery
// Network blip → connection drops → producer silently stops sending!
// Consumer disconnects → messages pile up in queue unprocessed!

// ✅ CORRECT: Enable auto-recovery
factory.setAutomaticRecoveryEnabled(true);
factory.setTopologyRecoveryEnabled(true);
// AND: implement recovery callbacks
connection.addShutdownListener(cause -> {
    if (!cause.isInitiatedByApplication()) {
        log.error("Connection lost unexpectedly", cause);
        alerting.notify("rabbitmq_connection_lost");
    }
});
```

## 13.2 General Message Queue Mistakes

```
// ❌ MISTAKE 8: Using MQ for synchronous request-response where latency matters
// "Let's put every API call through the message queue!"
// 200ms+ latency added unnecessarily
// Complex: request correlation, timeout handling, error propagation

// ✅ CORRECT: Use direct HTTP/gRPC for synchronous calls
// Use MQ for: truly async operations (email, notifications, batch processing)

// ❌ MISTAKE 9: Making messages too large
// 50MB message in SQS → ERROR (max 256KB!)
// 100KB message in RabbitMQ → frequent redelivery → performance issue

// ✅ CORRECT: Store large payloads externally (S3, MinIO)
// Message = reference: { "type": "report", "s3Key": "reports/2025/..." }

// ❌ MISTAKE 10: No idempotency in consumers
// Network blip → RabbitMQ redelivers same message
// Consumer processes it TWICE!
// "Email sent twice!", "Charge applied twice!", "Inventory deducted twice!"

// ✅ CORRECT: Idempotent consumers
String messageId = delivery.getProperties().getMessageId();
if (processedMessageIds.contains(messageId)) {
    channel.basicAck(tag, false);  // already processed, just ack
    return;
}
// Process...
processedMessageIds.add(messageId);
// Or: DB unique constraint on messageId

// ❌ MISTAKE 11: Unbounded queue growth (no monitoring)
// Queue fills up → memory exhausted → broker crash
// Or: slow consumer → queue grows silently → processing falls behind
// "Why is my data from 3 hours ago only being processed now?"

// ✅ CORRECT: Monitor queue depth + set x-max-length with overflow policy
// Alert: queue depth > 10,000 messages
// Set: x-overflow=reject-publish-dlx (back-pressure + dead-letter overflow)
```

---

# 14. Production Setup & Monitoring

## 14.1 RabbitMQ Production Config

```ini
# rabbitmq.conf

# Connection limits
tcp_listen_options.backlog = 4096
tcp_listen_options.keepalive = true
vm_memory_high_watermark.relative = 0.6  # pause publishers at 60% memory
disk_free_limit.relative = 1.5           # require 1.5x current DB size free

# Flow control
vm_memory_high_watermark_paging_ratio = 0.5  # start paging at 50% of watermark

# Heartbeat
heartbeat = 60  # 60 second heartbeat

# Queue defaults
default_vhost = /
default_user = guest
default_pass = guest

# Management plugin (web UI + HTTP API)
management.tcp.port = 15672
management.tcp.ip = 0.0.0.0

# Clustering
cluster_partition_handling = pause_minority  # pause when partition detected
```

## 14.2 Key Metrics to Monitor

```bash
# ── RABBITMQ MANAGEMENT HTTP API ──
# Get all queues:
curl -u guest:guest http://localhost:15672/api/queues | jq .

# Queue details:
curl -u guest:guest http://localhost:15672/api/queues/%2F/orders | jq '{
  name,
  messages,
  messages_ready,
  messages_unacknowledged,
  consumers,
  memory,
  consumer_utilisation
}'

# Critical metrics:
# messages:                   total messages in queue (growing = consumer too slow!)
# messages_ready:             waiting to be delivered
# messages_unacknowledged:    delivered but not yet ACKed (consumer processing)
# consumers:                  active consumer count (0 = no one consuming!)
# consumer_utilisation:       busy fraction (0.9 = 90% busy, optimal)
# memory:                     queue's memory usage

# Node health:
curl -u guest:guest http://localhost:15672/api/nodes | jq '.[] | {
  name,
  running,
  mem_used,
  mem_limit,
  disk_free,
  fd_used,
  fd_total,
  proc_used,
  proc_total,
  gc_num,
  gc_bytes_reclaimed
}'

# PROMETHEUS METRICS (rabbitmq-prometheus plugin):
# Enable:
rabbitmq-plugins enable rabbitmq_prometheus
# Scrape:
curl http://localhost:15692/metrics

# KEY PROMETHEUS METRICS:
rabbitmq_queue_messages              # queue depth
rabbitmq_queue_messages_ready        # ready to deliver
rabbitmq_queue_messages_unacked      # pending ACK
rabbitmq_queue_consumers             # consumer count
rabbitmq_channel_messages_published_total
rabbitmq_channel_messages_confirmed_total
rabbitmq_channel_messages_nacked_total
rabbitmq_connections_total
rabbitmq_node_mem_used_bytes
rabbitmq_node_disk_space_available_bytes

# ALERTS to configure:
# 1. Queue depth > threshold (consumer not keeping up)
# 2. consumer_count = 0 on important queue (no consumers!)
# 3. messages_unacknowledged growing (consumers stuck / too slow)
# 4. Memory > 80% watermark (flow control about to kick in)
# 5. Disk free < 1.5GB (disk pressure)
# 6. Node down (cluster member lost)
# 7. Unroutable messages (messages dropped)
```

## 14.3 Spring Boot Integration

```java
// SPRING AMQP full setup:

@Configuration
public class RabbitMQConfig {

    // ── INFRASTRUCTURE ──
    @Bean
    CachingConnectionFactory connectionFactory() {
        CachingConnectionFactory cf = new CachingConnectionFactory();
        cf.setAddresses("rabbit1:5672,rabbit2:5672,rabbit3:5672");
        cf.setVirtualHost("/production");
        cf.setUsername(username);
        cf.setPassword(password);
        cf.setChannelCacheSize(25);
        cf.setConnectionCacheSize(5);
        cf.setPublisherReturns(true);
        cf.setPublisherConfirmType(CachingConnectionFactory.ConfirmType.CORRELATED);
        return cf;
    }

    @Bean
    RabbitTemplate rabbitTemplate(ConnectionFactory factory) {
        RabbitTemplate template = new RabbitTemplate(factory);
        template.setMessageConverter(new Jackson2JsonMessageConverter());
        template.setMandatory(true);
        template.setConfirmCallback((correlationData, ack, cause) -> {
            if (!ack) log.error("Message not confirmed: {}, cause: {}", correlationData, cause);
        });
        template.setReturnsCallback(returned -> {
            log.error("Message returned: {} → {}:{}", 
                returned.getMessage(), returned.getReplyCode(), returned.getReplyText());
        });
        return template;
    }

    // ── TOPOLOGY (exchanges, queues, bindings) ──
    @Bean
    TopicExchange ordersExchange() {
        return ExchangeBuilder.topicExchange("orders")
            .durable(true).build();
    }

    @Bean
    Queue ordersQueue() {
        return QueueBuilder.durable("orders.processing")
            .withArgument("x-queue-type", "quorum")
            .withArgument("x-delivery-limit", 5)
            .withArgument("x-dead-letter-exchange", "orders.dlx")
            .build();
    }

    @Bean
    Binding ordersBinding(Queue ordersQueue, TopicExchange ordersExchange) {
        return BindingBuilder.bind(ordersQueue)
            .to(ordersExchange)
            .with("orders.#");
    }

    // ── LISTENER CONTAINER ──
    @Bean
    SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory factory) {
        SimpleRabbitListenerContainerFactory f = new SimpleRabbitListenerContainerFactory();
        f.setConnectionFactory(factory);
        f.setMessageConverter(new Jackson2JsonMessageConverter());
        f.setAcknowledgeMode(AcknowledgeMode.MANUAL);
        f.setPrefetchCount(50);
        f.setConcurrentConsumers(3);
        f.setMaxConcurrentConsumers(10);
        f.setDefaultRequeueRejected(false);  // don't requeue rejected messages
        f.setMissingQueuesFatal(false);       // don't crash if queue doesn't exist yet
        
        // Retry advice:
        f.setAdviceChain(RetryInterceptorBuilder.stateful()
            .maxAttempts(3)
            .backOffOptions(2000, 2.0, 10000)
            .recoverer(new RejectAndDontRequeueRecoverer())  // DLX after max retries
            .build());
        
        return f;
    }
}

// PRODUCERS:
@Service
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishOrderCreated(OrderCreatedEvent event) {
        CorrelationData correlationData = new CorrelationData(event.getOrderId());
        rabbitTemplate.convertAndSend(
            "orders",           // exchange
            "orders.created",   // routing key
            event,              // message (auto-converted to JSON)
            message -> {
                // Enrich message properties:
                message.getMessageProperties().setMessageId(event.getOrderId());
                message.getMessageProperties().setTimestamp(new Date());
                message.getMessageProperties().setContentType("application/json");
                return message;
            },
            correlationData
        );
    }
}

// CONSUMERS:
@Component
public class OrderEventConsumer {

    @RabbitListener(queues = "orders.processing",
                    containerFactory = "rabbitListenerContainerFactory")
    public void handleOrderCreated(
            @Payload OrderCreatedEvent event,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag,
            @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey,
            Channel channel) throws IOException {

        log.info("Processing order: {} via {}", event.getOrderId(), routingKey);

        try {
            orderService.processOrder(event);
            channel.basicAck(deliveryTag, false);
        } catch (RecoverableException e) {
            // Requeue once, then DLX (via delivery-limit on quorum queue)
            channel.basicNack(deliveryTag, false, true);
        } catch (PoisonMessageException e) {
            channel.basicNack(deliveryTag, false, false);  // → DLX
        }
    }

    @RabbitListener(queues = "orders.dead-letter")
    public void handleDeadLetter(
            @Payload Object rawMessage,
            @Headers Map<String, Object> headers) {
        log.error("Dead letter received. Original queue: {}, reason: {}, retries: {}",
            headers.get("x-death[0].queue"),
            headers.get("x-death[0].reason"),
            headers.get("x-death[0].count"));
        alertService.notifyDeadLetter(rawMessage, headers);
    }
}
```

---

## 📎 Quick Reference

```
RABBITMQ EXCHANGE TYPES:
  direct:  exact routing key match → 1 queue
  fanout:  ignore routing key → ALL queues
  topic:   pattern (* = 1 word, # = 0+ words)
  headers: match by header values (x-match: all/any)

QUEUE TYPES:
  classic:  default, memory+disk, per-node
  quorum:   Raft-based HA (RECOMMENDED!)
  stream:   persistent log, replayable

DELIVERY GUARANTEE:
  None:              basicPublish (fire-and-forget)
  At-least-once:     publisher confirms + manual consumer ACK
  Exactly-once:      idempotent consumer + dedup by messageId

KEY CONFIG:
  durable queue + persistent message → survives restart
  prefetchCount: ALWAYS set! (avoid consumer overwhelm)
  autoAck=false: ALWAYS manual ack for important work
  x-dead-letter-exchange: handle failures gracefully
  x-delivery-limit (quorum): avoid poison message loops

WHEN TO USE WHAT:
  Complex routing, task queues → RabbitMQ
  High throughput events, replay → Kafka
  Serverless, zero-ops → SQS/SNS/EventBridge
  Sub-ms latency, microservices → NATS
  IoT, MQTT → HiveMQ / EMQX
  Multi-cloud, geo-replication → Apache Pulsar
  Simple Redis + messaging → Redis Streams
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| RabbitMQ Documentation | <https://www.rabbitmq.com/docs> |
| AMQP 0-9-1 Model | <https://www.rabbitmq.com/tutorials/amqp-concepts> |
| RabbitMQ Tutorials | <https://www.rabbitmq.com/tutorials> |
| Quorum Queues | <https://www.rabbitmq.com/docs/quorum-queues> |
| RabbitMQ Streams | <https://www.rabbitmq.com/docs/streams> |
| Spring AMQP | <https://docs.spring.io/spring-amqp/docs/current/reference/html/> |
| Apache Kafka | <https://kafka.apache.org/documentation/> |
| Apache Pulsar | <https://pulsar.apache.org/docs/> |
| AWS SQS | <https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/> |
| AWS SNS | <https://docs.aws.amazon.com/sns/latest/dg/> |
| AWS EventBridge | <https://docs.aws.amazon.com/eventbridge/latest/userguide/> |
| NATS Documentation | <https://docs.nats.io/> |
| ActiveMQ Artemis | <https://activemq.apache.org/components/artemis/documentation/> |
| HiveMQ (MQTT) | <https://www.hivemq.com/docs/> |
| Redis Streams | <https://redis.io/docs/data-types/streams/> |
| Google Cloud PubSub | <https://cloud.google.com/pubsub/docs> |

---

*Học theo thứ tự: MQ fundamentals → AMQP concepts → Exchange types (direct→fanout→topic) → Queue properties → Publisher confirms + Consumer ACK → DLX pattern → Clustering → Use case comparison*
