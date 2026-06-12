# 🏗️ System Design — Xử Lý Tình Huống Thực Tế
>
> Không lý thuyết suông — Case bán vé, Flash sale, Payment, Rate Limit, 3 lớp phòng thủ

---

## 📚 Mục Lục

1. [Khung 3 Lớp Phòng Thủ — Tổng Quan](#1-khung-3-lớp-phòng-thủ--tổng-quan)
2. [Case 1: Bán Vé Concert — 10 Triệu Request](#2-case-1-bán-vé-concert--10-triệu-request)
3. [Case 2: Flash Sale E-commerce](#3-case-2-flash-sale-e-commerce)
4. [Case 3: Hệ Thống Thanh Toán Chịu Tải](#4-case-3-hệ-thống-thanh-toán-chịu-tải)
5. [Case 4: API Public với Rate Limiting](#5-case-4-api-public-với-rate-limiting)
6. [Case 5: Live Leaderboard / Realtime Feed](#6-case-5-live-leaderboard--realtime-feed)
7. [Chiến Lược Load Testing với wrk & JMeter](#7-chiến-lược-load-testing-với-wrk--jmeter)
8. [Đọc Grafana & Xác Định Điểm Bão Hòa](#8-đọc-grafana--xác-định-điểm-bão-hòa)
9. [Quyết Định Scale — Khi Nào Cần Gì](#9-quyết-định-scale--khi-nào-cần-gì)

---

# 1. Khung 3 Lớp Phòng Thủ — Tổng Quan

## 1.1 Tại Sao Cần 3 Lớp?

```
Tưởng tượng hệ thống bán vé concert BlackPink:
  20:00:00 → vé mở bán
  20:00:01 → 3 triệu user cùng bấm F5
  
  Nếu không có phòng thủ:
    → 3 triệu request đánh thẳng vào Database
    → MySQL max 151 kết nối đồng thời
    → 2.999.849 request xếp hàng
    → Database crash trong vài giây
    → Tất cả user thấy lỗi 500
  
  Giải pháp: 3 lớp lọc trước khi chạm DB

REQUEST FLOW QUA 3 LỚP:

User Request
    ↓
┌─────────────────────────────────────────────┐
│ LỚP 1: Rate Limiter + Circuit Breaker       │
│  - Giới hạn request/giây theo IP/User       │
│  - Ngắt mạch khi service downstream lỗi    │
│  - Công cụ: Resilience4j, API Gateway       │
│  - "Chỉ 100 user/giây được đi qua"         │
└──────────────────┬──────────────────────────┘
                   ↓ (request đã lọc)
┌─────────────────────────────────────────────┐
│ LỚP 2: Local Cache (trong mỗi service)      │
│  - Cache trong bộ nhớ JVM (~ns latency)     │
│  - Không cần gọi mạng                       │
│  - Công cụ: Caffeine, Guava                 │
│  - "80% request trả về từ đây, không đi xa"│
└──────────────────┬──────────────────────────┘
                   ↓ (chỉ 20% tiếp tục)
┌─────────────────────────────────────────────┐
│ LỚP 3: Redis (Distributed Cache)            │
│  - Cache phân tán dùng chung cho mọi service│
│  - ~1ms latency                             │
│  - Công cụ: Redis, ElastiCache              │
│  - "18% request trả về từ đây"             │
└──────────────────┬──────────────────────────┘
                   ↓ (chỉ 2% còn lại)
┌─────────────────────────────────────────────┐
│ DATABASE (PostgreSQL / MySQL)               │
│  - Chỉ xử lý 2% request                   │
│  - Tập trung vào write, transaction         │
└─────────────────────────────────────────────┘

KẾT QUẢ:
  3.000.000 request/s → DB chỉ thấy 60.000 request/s
  Hệ thống sống sót → user mua được vé
```

## 1.2 Bảng Quyết Định — Dùng Gì Cho Tầng Nào

```
┌──────────────┬────────────────────┬────────────────────┬──────────────────┐
│ Tiêu chí     │ Local Cache        │ Redis              │ Database         │
├──────────────┼────────────────────┼────────────────────┼──────────────────┤
│ Latency      │ ~100ns (in-memory) │ ~1ms (network)     │ ~10-100ms (disk) │
│ Dung lượng   │ Nhỏ (RAM JVM)      │ Lớn (riêng biệt)  │ Rất lớn (disk)   │
│ Nhất quán    │ Không (per-service)│ Tốt (shared)       │ ACID đầy đủ      │
│ Chi phí      │ Miễn phí (RAM sẵn) │ Cần server riêng   │ Đắt nhất         │
│ Dùng cho     │ Dữ liệu ít thay đổi│ Session, hot data  │ Source of truth  │
└──────────────┴────────────────────┴────────────────────┴──────────────────┘

NGUYÊN TẮC ĐẶT DATA Ở ĐÂU:
  Đọc nhiều, ít thay đổi (catalog, config)  → Local Cache
  Đọc nhiều, thay đổi vừa (user session)    → Redis
  Cần giao dịch, nhất quán tuyệt đối         → Database
  Cần ghi nhanh, đọc nhiều                   → Redis + async write to DB
```

---

# 2. Case 1: Bán Vé Concert — 10 Triệu Request

## 2.1 Bài Toán

```
YÊU CẦU:
  - 50.000 vé mở bán lúc 20:00:00
  - Dự kiến 10 triệu user đồng thời
  - Không được bán quá số vé (oversell)
  - Hệ thống không được crash
  - Response time < 500ms (user không chờ lâu)

CÁC VẤN ĐỀ PHẢI GIẢI QUYẾT:
  1. Oversell: 2 user cùng mua vé cuối → cả 2 thanh toán được → 51.000 vé đã bán
  2. Thundering herd: 10M request đánh vào cùng lúc
  3. Cache stampede: vé hết → cache miss → 10M request đánh DB
  4. Fairness: user vào đúng 20:00 phải được ưu tiên hơn user 20:01

STACK CÔNG NGHỆ:
  Spring Boot (service)
  Redis (distributed cache + distributed lock)
  Caffeine (local cache)
  Resilience4j (rate limiter + circuit breaker)
  PostgreSQL (source of truth)
  Kafka (async processing)
  Nginx (load balancer)
```

## 2.2 Kiến Trúc Tổng Thể

```
                         10.000.000 request
                               │
                    ┌──────────▼──────────┐
                    │   CDN / WAF         │
                    │ - Block bots        │
                    │ - DDoS protection   │
                    │ - Static content    │
                    └──────────┬──────────┘
                               │ ~5.000.000 (lọc bot, static)
                    ┌──────────▼──────────┐
                    │   Nginx             │
                    │ Load Balancer       │
                    │ - Round robin       │
                    │ - SSL termination   │
                    └──────────┬──────────┘
                               │ ~5.000.000
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼────┐  ┌────────▼────┐  ┌────────▼────┐
     │ Ticket API  │  │ Ticket API  │  │ Ticket API  │
     │  Server 1   │  │  Server 2   │  │  Server 3   │
     │ Rate Limiter│  │ Rate Limiter│  │ Rate Limiter│
     │ Local Cache │  │ Local Cache │  │ Local Cache │
     └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                    ┌────────▼────────┐
                    │     Redis       │
                    │  - Ticket count │
                    │  - Dist. lock   │
                    │  - Queue        │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────┐ ┌───────▼──────┐ ┌────▼─────────┐
     │   Kafka     │ │  PostgreSQL  │ │   Payment    │
     │ Async write │ │ Source of    │ │   Service    │
     │ to DB       │ │ truth        │ │              │
     └─────────────┘ └──────────────┘ └──────────────┘
```

## 2.3 Lớp 1 — Rate Limiter & Circuit Breaker

```yaml
# application.yml
resilience4j:
  rateLimiter:
    instances:
      ticketPurchase:
        limitForPeriod: 1000        # 1000 request được phép mỗi chu kỳ
        limitRefreshPeriod: 1s      # chu kỳ reset mỗi 1 giây
        timeoutDuration: 100ms      # chờ tối đa 100ms nếu hết quota
        # Ý nghĩa: tối đa 1000 req/s qua lớp này PER INSTANCE
        # 3 instance → tổng 3000 req/s → DB chịu được

  circuitBreaker:
    instances:
      paymentService:
        failureRateThreshold: 50          # 50% lỗi → OPEN
        slowCallRateThreshold: 80         # 80% chậm (>2s) → OPEN
        slowCallDurationThreshold: 2000ms
        waitDurationInOpenState: 30s      # đợi 30s trước khi HALF_OPEN
        permittedNumberOfCallsInHalfOpenState: 5
        slidingWindowSize: 20             # đánh giá trên 20 request gần nhất
```

```java
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @PostMapping("/{ticketId}/purchase")
    // Lớp 1a: Rate Limiter — giới hạn tốc độ
    @RateLimiter(name = "ticketPurchase", fallbackMethod = "rateLimitFallback")
    // Lớp 1b: Circuit Breaker — ngắt mạch khi payment lỗi
    @CircuitBreaker(name = "paymentService", fallbackMethod = "circuitBreakerFallback")
    public ResponseEntity<PurchaseResult> purchase(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ticketService.purchase(ticketId, user.getUsername()));
    }

    // Fallback khi quá rate limit:
    public ResponseEntity<PurchaseResult> rateLimitFallback(
            Long ticketId, UserDetails user, RequestNotPermitted e) {
        return ResponseEntity.status(429).body(
            PurchaseResult.failed("Hệ thống đang quá tải, vui lòng thử lại sau 1 giây")
        );
    }

    // Fallback khi payment service lỗi:
    public ResponseEntity<PurchaseResult> circuitBreakerFallback(
            Long ticketId, UserDetails user, CallNotPermittedException e) {
        // Ghi vào queue để xử lý sau, trả về "đơn hàng đang chờ xử lý"
        queueService.enqueuePendingPurchase(ticketId, user.getUsername());
        return ResponseEntity.accepted().body(
            PurchaseResult.queued("Đơn hàng của bạn đang được xử lý, vui lòng chờ")
        );
    }
}
```

## 2.4 Lớp 2 — Local Cache với Caffeine

```java
@Configuration
public class CacheConfig {

    @Bean
    public Cache<Long, TicketInfo> ticketLocalCache() {
        return Caffeine.newBuilder()
            .maximumSize(10_000)           // tối đa 10k item (các event đang bán)
            .expireAfterWrite(5, SECONDS)  // TTL 5 giây — dữ liệu vé thay đổi nhanh
            .expireAfterAccess(10, SECONDS)
            .recordStats()                 // theo dõi hit/miss cho Grafana
            .build();
    }
}

@Service
public class TicketService {

    private final Cache<Long, TicketInfo> localCache;
    private final RedisTemplate<String, Object> redis;

    // FLOW KHI USER CHECK THÔNG TIN VÉ:
    public TicketInfo getTicketInfo(Long ticketId) {

        // Tầng 1: kiểm tra local cache (~100ns)
        TicketInfo cached = localCache.getIfPresent(ticketId);
        if (cached != null) {
            return cached;  // 80% request kết thúc ở đây!
        }

        // Tầng 2: kiểm tra Redis (~1ms)
        String redisKey = "ticket:info:" + ticketId;
        TicketInfo fromRedis = (TicketInfo) redis.opsForValue().get(redisKey);
        if (fromRedis != null) {
            localCache.put(ticketId, fromRedis);  // warm local cache
            return fromRedis;  // 18% request kết thúc ở đây!
        }

        // Tầng 3: query DB (~50ms) — chỉ 2% request vào đây
        TicketInfo fromDb = ticketRepository.findById(ticketId).orElseThrow();
        redis.opsForValue().set(redisKey, fromDb, 5, MINUTES);
        localCache.put(ticketId, fromDb);
        return fromDb;
    }
}
```

## 2.5 Xử Lý Mua Vé — Chống Oversell

```
VẤN ĐỀ OVERSELL:
  Vé còn lại: 1
  User A query → còn 1 vé → chuẩn bị mua
  User B query → còn 1 vé → chuẩn bị mua
  User A ghi → đã mua, còn 0
  User B ghi → đã mua, còn -1 ← OVERSELL!

GIẢI PHÁP 1 (đơn giản): Redis DECRBY Atomic
  Redis là single-threaded → DECR là atomic
  Không thể có 2 DECR chạy cùng lúc
  → Chỉ 1 user thành công khi còn 1 vé

GIẢI PHÁP 2 (an toàn hơn): Distributed Lock + Lua Script
  Đảm bảo check-then-decrement là atomic
  Phù hợp khi cần logic phức tạp hơn
```

```java
@Service
public class TicketPurchaseService {

    // CÁCH 1: DECRBY Atomic — đơn giản, hiệu quả
    public PurchaseResult purchaseWithAtomicDecr(Long ticketId, String userId) {
        String stockKey = "ticket:stock:" + ticketId;

        // Redis DECR là atomic → thread-safe tự nhiên
        Long remaining = redis.opsForValue().decrement(stockKey);

        if (remaining == null || remaining < 0) {
            // Vé đã hết, hoàn lại
            redis.opsForValue().increment(stockKey);  // rollback
            return PurchaseResult.failed("Rất tiếc, vé đã hết");
        }

        // Ghi vào Kafka để async persist vào DB
        kafkaTemplate.send("ticket-purchase-events", new PurchaseEvent(ticketId, userId));
        return PurchaseResult.success("Đặt vé thành công! Còn " + remaining + " vé");
    }

    // CÁCH 2: Lua Script — atomic check + decrement
    private static final String PURCHASE_SCRIPT = """
        local stock = tonumber(redis.call('GET', KEYS[1]))
        if stock == nil or stock <= 0 then
            return 0  -- hết vé
        end
        redis.call('DECRBY', KEYS[1], 1)
        -- Ghi vào sorted set để tracking (score = timestamp)
        redis.call('ZADD', KEYS[2], ARGV[2], ARGV[1])
        return stock - 1  -- số vé còn lại
    """;

    public PurchaseResult purchaseWithLua(Long ticketId, String userId) {
        String stockKey    = "ticket:stock:" + ticketId;
        String purchaseLog = "ticket:purchases:" + ticketId;
        long   timestamp   = System.currentTimeMillis();

        Long remaining = (Long) redis.execute(
            new DefaultRedisScript<>(PURCHASE_SCRIPT, Long.class),
            List.of(stockKey, purchaseLog),
            userId, String.valueOf(timestamp)
        );

        if (remaining == null || remaining == 0) {
            return PurchaseResult.failed("Rất tiếc, vé đã hết");
        }

        kafkaTemplate.send("ticket-purchase-events", new PurchaseEvent(ticketId, userId));
        return PurchaseResult.success("Đặt vé thành công!");
    }
}
```

## 2.6 Hàng Đợi Ảo (Virtual Queue) — Giải Pháp Fairness

```
VẤN ĐỀ: 10 triệu user bấm cùng lúc → ai được mua trước?
  Không có hàng đợi: user vào sau (sau 20:00:01) có thể mua được
  vì user vào đúng 20:00:00 bị từ chối do rate limit → không công bằng

GIẢI PHÁP: Virtual Queue bằng Redis Sorted Set
  Score = thời điểm user vào hàng (unix timestamp milliseconds)
  → User vào sớm hơn → score nhỏ hơn → được xử lý trước → FAIR!

FLOW:
  20:00:00 → User vào queue (nhận token)
  20:00:00 → Worker xử lý queue theo thứ tự
  User nhận kết quả khi đến lượt
```

```java
@Service
public class VirtualQueueService {

    // BƯỚC 1: User gửi request → vào hàng đợi
    public QueueToken joinQueue(Long ticketId, String userId) {
        String queueKey = "ticket:queue:" + ticketId;
        long joinTime = System.currentTimeMillis();

        // ZADD: score = thời gian → user sớm hơn → score nhỏ hơn → ưu tiên cao hơn
        Double existing = redis.opsForZSet().score(queueKey, userId);
        if (existing != null) {
            // User đã trong hàng → trả token cũ
            long position = redis.opsForZSet().rank(queueKey, userId);
            return new QueueToken(userId, position, estimateWaitTime(position));
        }

        redis.opsForZSet().add(queueKey, userId, joinTime);
        long position = redis.opsForZSet().rank(queueKey, userId);

        return new QueueToken(
            userId,
            position,
            estimateWaitTime(position)  // "Bạn đứng thứ 1234, dự kiến 5 phút"
        );
    }

    // BƯỚC 2: Worker xử lý theo thứ tự FIFO
    @Scheduled(fixedDelay = 100)  // chạy mỗi 100ms
    public void processQueue() {
        String queueKey = "ticket:queue:*";
        // Lấy 10 user đầu hàng (score nhỏ nhất = vào sớm nhất)
        Set<String> nextUsers = redis.opsForZSet()
            .range("ticket:queue:" + currentEventId, 0, 9);

        for (String userId : nextUsers) {
            processPurchase(userId);
            redis.opsForZSet().remove("ticket:queue:" + currentEventId, userId);
        }
    }

    private long estimateWaitTime(long position) {
        long processingRate = 500;  // 500 user/giây
        return (position / processingRate) * 1000;  // milliseconds
    }
}
```

## 2.7 Async Persist với Kafka

```java
// Worker đọc từ Kafka → ghi vào DB
// DB không bị đánh trực tiếp từ 10M request
@Service
@Slf4j
public class PurchaseEventConsumer {

    @KafkaListener(topics = "ticket-purchase-events",
                   groupId = "ticket-db-writer",
                   concurrency = "5")  // 5 worker song song
    public void handlePurchaseEvent(PurchaseEvent event) {
        try {
            // Ghi vào DB với idempotency check
            // (đảm bảo xử lý 2 lần cùng event không bị duplicate)
            if (!purchaseRepository.existsByUserIdAndTicketId(
                    event.getUserId(), event.getTicketId())) {

                Purchase purchase = new Purchase(
                    event.getUserId(),
                    event.getTicketId(),
                    event.getTimestamp()
                );
                purchaseRepository.save(purchase);
                log.info("Saved purchase: userId={}, ticketId={}",
                    event.getUserId(), event.getTicketId());
            }
        } catch (Exception e) {
            log.error("Failed to save purchase, will retry via Kafka retry topic", e);
            throw e;  // Kafka sẽ retry tự động
        }
    }
}
```

## 2.8 Tóm Tắt Flow Hoàn Chỉnh

```
User bấm "Mua vé":
  
  1. CDN: block bot, trả static assets (trang vé)
  
  2. Rate Limiter (Lớp 1):
     - 10.000 req/s per instance × 3 instances = 30.000 req/s đi qua
     - Phần còn lại nhận 429 "Vui lòng thử lại sau 1 giây"
  
  3. Local Cache (Lớp 2):
     - Check thông tin vé (số lượng, giá) từ Caffeine
     - Hit rate ~80% → 24.000 req/s trả luôn từ đây
     - 6.000 req/s tiếp tục
  
  4. Redis (Lớp 3):
     - DECRBY atomic → không oversell
     - Virtual queue → fairness
     - Hit rate ~90% → 5.400 req/s trả từ Redis
     - 600 req/s xuống DB
  
  5. Database:
     - Chỉ xử lý 600 req/s → hoàn toàn chịu được
     - Kafka consumer async write → không block main thread
  
  Kết quả:
    10.000.000 req/s input → 600 req/s DB load
    Oversell = 0 (Redis atomic DECR)
    Response time < 50ms (80% từ local cache)
    50.000 vé được bán đúng
```

---

# 3. Case 2: Flash Sale E-commerce

## 3.1 Bài Toán Khác Với Bán Vé

```
ĐIỂM KHÁC BIỆT so với bán vé:
  - Bán vé: 1 loại sản phẩm, 50.000 đơn vị
  - Flash sale: 10.000 SKU khác nhau, số lượng khác nhau
  - Bán vé: ai cũng mua 1 vé
  - Flash sale: user mua nhiều món, cần check cart, coupon, địa chỉ

VẤN ĐỀ ĐẶC THÙ:
  1. Hot product: iPhone 16 Pro có 1 triệu view → hot key problem
  2. Coupon race condition: user dùng cùng 1 coupon 2 lần
  3. Inventory deduction: giảm tồn kho đúng số lượng
  4. Rollback: thanh toán thất bại → hoàn lại tồn kho

KIẾN TRÚC ĐỀ NGHỊ:
  Pre-cache toàn bộ inventory vào Redis trước khi flash sale
  Hot key sharding cho product phổ biến
  Distributed lock để trừ tồn kho
```

## 3.2 Pre-warm Cache Trước Flash Sale

```java
@Service
public class FlashSalePreparationService {

    // Chạy 30 phút trước flash sale (cron job)
    @Scheduled(cron = "0 30 * * * *")  // 30 phút mỗi giờ
    public void prewarmFlashSaleCache() {
        log.info("Bắt đầu pre-warm cache cho flash sale sắp diễn ra...");

        List<FlashSaleItem> items = flashSaleRepository.findUpcomingSaleItems();

        for (FlashSaleItem item : items) {
            String stockKey = "flash:stock:" + item.getProductId();
            String infoKey  = "flash:info:"  + item.getProductId();

            // Load tồn kho vào Redis
            redis.opsForValue().set(stockKey, item.getQuantity());
            redis.expire(stockKey, 2, HOURS);

            // Cache thông tin sản phẩm vào Redis
            redis.opsForValue().set(infoKey,
                productService.getFullInfo(item.getProductId()), 2, HOURS);

            log.info("Pre-warmed: productId={}, stock={}",
                item.getProductId(), item.getQuantity());
        }

        log.info("Pre-warm hoàn tất: {} sản phẩm đã được cache", items.size());
    }
}
```

## 3.3 Hot Key Sharding

```java
// VẤN ĐỀ: iPhone 16 Pro có 500k req/s → 1 Redis node đó bị crush
// GIẢI PHÁP: chia thành N bản sao, mỗi request đọc từ 1 bản ngẫu nhiên

@Service
public class HotProductCacheService {

    private static final int SHARD_COUNT = 20;  // 20 bản sao

    // Đọc từ shard ngẫu nhiên → 500k req/s ÷ 20 = 25k req/s mỗi shard
    public ProductInfo getHotProduct(Long productId) {
        int shard = ThreadLocalRandom.current().nextInt(SHARD_COUNT);
        String shardKey = "hot:product:" + productId + ":shard:" + shard;

        ProductInfo cached = (ProductInfo) redis.opsForValue().get(shardKey);
        if (cached != null) return cached;

        // Cache miss → load từ DB và populate tất cả shards
        ProductInfo product = productRepository.findById(productId).orElseThrow();
        populateAllShards(productId, product);
        return product;
    }

    private void populateAllShards(Long productId, ProductInfo product) {
        // Populate tất cả 20 shards cùng lúc (pipeline)
        redis.executePipelined((RedisCallback<Object>) conn -> {
            for (int i = 0; i < SHARD_COUNT; i++) {
                String key = "hot:product:" + productId + ":shard:" + i;
                conn.setEx(key.getBytes(),
                    30,  // TTL 30 giây (product info không đổi nhiều)
                    serialize(product));
            }
            return null;
        });
    }

    // Khi product thông tin thay đổi → invalidate tất cả shards
    public void invalidateHotProduct(Long productId) {
        for (int i = 0; i < SHARD_COUNT; i++) {
            redis.delete("hot:product:" + productId + ":shard:" + i);
        }
    }
}
```

## 3.4 Chống Oversell Cho Flash Sale (Nhiều SKU)

```java
// Lua script: kiểm tra tồn kho + trừ nguyên tử cho nhiều sản phẩm
private static final String BATCH_DEDUCT_SCRIPT = """
    -- KEYS: danh sách stock key cho từng product
    -- ARGV[i*2-1]: productId, ARGV[i*2]: quantity cần trừ

    local results = {}
    local n = #KEYS

    -- Bước 1: kiểm tra tất cả sản phẩm đủ tồn kho không
    for i = 1, n do
        local stock = tonumber(redis.call('GET', KEYS[i]))
        local qty   = tonumber(ARGV[i])
        if stock == nil or stock < qty then
            -- Thiếu hàng → không thực hiện gì, báo lỗi
            return {-1, KEYS[i]}  -- -1 = thiếu hàng, trả về key bị lỗi
        end
    end

    -- Bước 2: tất cả đủ → mới trừ tất cả
    for i = 1, n do
        local qty = tonumber(ARGV[i])
        redis.call('DECRBY', KEYS[i], qty)
    end

    return {1}  -- 1 = thành công
""";

@Service
public class FlashSaleOrderService {

    @Transactional
    public OrderResult placeOrder(OrderRequest request) {
        List<String> stockKeys = request.getItems().stream()
            .map(item -> "flash:stock:" + item.getProductId())
            .collect(toList());

        List<String> quantities = request.getItems().stream()
            .map(item -> String.valueOf(item.getQuantity()))
            .collect(toList());

        // Atomic batch deduction
        List<Long> result = (List<Long>) redis.execute(
            new DefaultRedisScript<>(BATCH_DEDUCT_SCRIPT, List.class),
            stockKeys,
            quantities.toArray(String[]::new)
        );

        if (result.get(0) == -1) {
            String failedKey = String.valueOf(result.get(1));
            String productId = failedKey.replace("flash:stock:", "");
            return OrderResult.outOfStock("Sản phẩm " + productId + " đã hết hàng");
        }

        // Tạo order và publish event
        Order order = orderRepository.save(new Order(request));
        kafkaTemplate.send("order-created", new OrderCreatedEvent(order));
        return OrderResult.success(order.getId());
    }
}
```

---

# 4. Case 3: Hệ Thống Thanh Toán Chịu Tải

## 4.1 Đặc Thù Của Payment System

```
PAYMENT KHÁC HOÀN TOÀN VỚI READ-HEAVY SYSTEMS:
  - Mỗi giao dịch PHẢI chính xác 100%
  - Không được xử lý 2 lần (idempotency)
  - Không được mất giao dịch (durability)
  - Cần audit log đầy đủ
  - Regulatory compliance

KHÔNG THỂ:
  ❌ Dùng eventual consistency cho balance
  ❌ Cache số dư tài khoản (stale data = tiền ảo)
  ❌ Async write balance update

CÓ THỂ cache:
  ✅ Thông tin sản phẩm, giá cả
  ✅ Cấu hình thanh toán (phí, tỷ giá)
  ✅ Rate limit per user

KIẾN TRÚC:
  Tách bạch Read path và Write path
  Read: cache hết, trả nhanh
  Write: đi thẳng vào DB, không cache, có distributed lock
```

## 4.2 Idempotency — Không Xử Lý 2 Lần

```java
// VẤN ĐỀ: User bấm thanh toán 2 lần (do mạng chậm, double-click)
// → 2 request đến server → trừ tiền 2 lần!

@Service
public class PaymentService {

    // Idempotency key từ client (UUID do frontend tạo, 1 lần bấm = 1 UUID)
    public PaymentResult processPayment(PaymentRequest request, String idempotencyKey) {

        // Kiểm tra đã xử lý chưa (dùng Redis với TTL 24h)
        String cacheKey = "payment:idempotent:" + idempotencyKey;
        String cachedResult = (String) redis.opsForValue().get(cacheKey);

        if (cachedResult != null) {
            // Đã xử lý rồi → trả lại kết quả cũ (không xử lý lại)
            return objectMapper.readValue(cachedResult, PaymentResult.class);
        }

        // Dùng distributed lock để đảm bảo chỉ 1 request được xử lý
        String lockKey = "payment:lock:" + idempotencyKey;
        boolean acquired = redis.opsForValue()
            .setIfAbsent(lockKey, "1", Duration.ofSeconds(30));

        if (!acquired) {
            // Request khác đang xử lý cùng transaction → chờ kết quả
            return waitForResult(idempotencyKey);
        }

        try {
            // Xử lý thanh toán thực sự
            PaymentResult result = executePayment(request);

            // Lưu kết quả vào Redis (TTL 24h) → retry request sẽ lấy ở đây
            redis.opsForValue().set(cacheKey,
                objectMapper.writeValueAsString(result), 24, HOURS);

            return result;
        } finally {
            redis.delete(lockKey);
        }
    }

    @Transactional  // DB transaction cho tính nhất quán
    private PaymentResult executePayment(PaymentRequest request) {
        // Trừ tiền từ tài khoản nguồn
        Account source = accountRepository.findByIdWithLock(request.getSourceAccountId());
        if (source.getBalance().compareTo(request.getAmount()) < 0) {
            return PaymentResult.failed("Số dư không đủ");
        }
        source.debit(request.getAmount());

        // Cộng tiền vào tài khoản đích
        Account dest = accountRepository.findByIdWithLock(request.getDestAccountId());
        dest.credit(request.getAmount());

        // Ghi audit log
        auditLogRepository.save(new PaymentAuditLog(request, source, dest));

        // Gửi notification async (không ảnh hưởng main flow)
        eventPublisher.publishEvent(new PaymentSuccessEvent(request));

        return PaymentResult.success(generateTransactionId());
    }
}
```

## 4.3 Circuit Breaker Cho Payment Gateway

```java
@Service
public class ExternalPaymentService {

    // Khi MoMo bị lỗi → không tiếp tục gọi → fallback sang VNPay
    @CircuitBreaker(name = "momoGateway", fallbackMethod = "fallbackToVnpay")
    @Retry(name = "momoGateway", fallbackMethod = "fallbackToVnpay")
    @TimeLimiter(name = "momoGateway")  // timeout 3 giây
    public CompletableFuture<PaymentResponse> payWithMomo(PaymentRequest req) {
        return CompletableFuture.supplyAsync(() -> momoClient.charge(req));
    }

    // Khi MoMo OPEN circuit → tự động chạy fallback này
    public CompletableFuture<PaymentResponse> fallbackToVnpay(
            PaymentRequest req, Throwable e) {
        log.warn("MoMo circuit OPEN ({}), falling back to VNPay", e.getMessage());
        return CompletableFuture.supplyAsync(() -> vnpayClient.charge(req));
    }
}
```

```yaml
resilience4j:
  circuitBreaker:
    instances:
      momoGateway:
        failureRateThreshold: 30      # 30% lỗi trong 20 request gần nhất → OPEN
        waitDurationInOpenState: 60s  # đợi 60s → HALF_OPEN
        permittedNumberOfCallsInHalfOpenState: 3
        slidingWindowSize: 20

  retry:
    instances:
      momoGateway:
        maxAttempts: 3
        waitDuration: 500ms           # đợi 500ms giữa các lần retry
        retryExceptions:
          - java.net.ConnectException
          - java.net.SocketTimeoutException
        ignoreExceptions:
          - com.example.BusinessException  # lỗi business không retry

  timeLimiter:
    instances:
      momoGateway:
        timeoutDuration: 3s           # timeout 3 giây
```

---

# 5. Case 4: API Public với Rate Limiting

## 5.1 Bài Toán API Public

```
KỊCH BẢN: Cung cấp API cho đối tác bên ngoài
  - Partner A: gói Free    → 100 req/giờ
  - Partner B: gói Basic   → 1.000 req/giờ
  - Partner C: gói Premium → 10.000 req/giờ
  - Attack: bot scan → 1.000.000 req/phút từ 1 IP

YÊU CẦU:
  - Giới hạn theo API key (partner)
  - Giới hạn theo IP (chống attack)
  - Trả về header thông báo quota còn lại
  - Khi hết quota → 429 với Retry-After header
```

## 5.2 Sliding Window Rate Limiter với Redis

```java
@Component
public class SlidingWindowRateLimiter {

    // Sliding window algorithm: mỗi request có timestamp riêng
    // Chỉ đếm request trong cửa sổ 1 giờ gần nhất
    private static final String RATE_LIMIT_SCRIPT = """
        local key      = KEYS[1]
        local limit    = tonumber(ARGV[1])
        local window   = tonumber(ARGV[2])  -- milliseconds
        local now      = tonumber(ARGV[3])
        local expire   = now - window

        -- Xóa các request đã cũ hơn cửa sổ
        redis.call('ZREMRANGEBYSCORE', key, '-inf', expire)

        -- Đếm request trong cửa sổ hiện tại
        local count = redis.call('ZCARD', key)

        if count < limit then
            -- Thêm request này vào cửa sổ
            redis.call('ZADD', key, now, now .. '-' .. math.random())
            redis.call('EXPIRE', key, math.ceil(window / 1000))
            return {1, limit - count - 1, 0}  -- [allowed, remaining, retry_after]
        else
            -- Lấy thời điểm request cũ nhất sẽ hết hạn
            local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
            local retryAfter = math.ceil((tonumber(oldest[2]) + window - now) / 1000)
            return {0, 0, retryAfter}  -- [denied, 0, retry_after_seconds]
        end
    """;

    public RateLimitResult checkLimit(String apiKey, int limitPerHour) {
        String redisKey = "ratelimit:api:" + apiKey;
        long now        = System.currentTimeMillis();
        long windowMs   = 3_600_000L;  // 1 giờ = 3.6 triệu ms

        List<Long> result = (List<Long>) redis.execute(
            new DefaultRedisScript<>(RATE_LIMIT_SCRIPT, List.class),
            List.of(redisKey),
            String.valueOf(limitPerHour),
            String.valueOf(windowMs),
            String.valueOf(now)
        );

        return new RateLimitResult(
            result.get(0) == 1,      // allowed?
            result.get(1),           // remaining
            result.get(2)            // retry_after_seconds
        );
    }
}

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        String apiKey = req.getHeader("X-API-Key");
        if (apiKey == null) {
            res.setStatus(401);
            return false;
        }

        ApiKeyConfig config = apiKeyService.getConfig(apiKey);
        RateLimitResult result = rateLimiter.checkLimit(apiKey, config.getHourlyLimit());

        // Thêm header thông báo quota (giống GitHub API)
        res.setHeader("X-RateLimit-Limit",     String.valueOf(config.getHourlyLimit()));
        res.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));
        res.setHeader("X-RateLimit-Reset",     String.valueOf(System.currentTimeMillis()/1000 + 3600));

        if (!result.isAllowed()) {
            res.setStatus(429);
            res.setHeader("Retry-After", String.valueOf(result.getRetryAfterSeconds()));
            return false;
        }
        return true;
    }
}
```

---

# 6. Case 5: Live Leaderboard / Realtime Feed

## 6.1 Bảng Xếp Hạng Realtime

```
KỊCH BẢN: Game có 1 triệu người chơi đồng thời
  - Mỗi người chơi ghi điểm → cập nhật bảng xếp hạng
  - Hiển thị top 100 người điểm cao nhất
  - Hiển thị xếp hạng của chính mình (có thể là rank 500.000)

NẾU DÙNG DATABASE:
  SELECT rank FROM (
    SELECT userId, RANK() OVER (ORDER BY score DESC)
    FROM scores
  ) ranked WHERE userId = ?
  → Mỗi query tính rank cho 1 triệu dòng → quá chậm!

REDIS SORTED SET GIẢI QUYẾT:
  ZINCRBY: cập nhật điểm O(log n)
  ZREVRANK: lấy rank O(log n)
  ZRANGE:   lấy top 100 O(log n + 100)
  → Tất cả O(log n) cho 1 triệu user = ~20 bước!
```

```java
@Service
public class LeaderboardService {

    private static final String LEADERBOARD_KEY = "game:leaderboard:";

    // Cập nhật điểm sau mỗi ván chơi
    public void addScore(String gameId, String userId, double score) {
        String key = LEADERBOARD_KEY + gameId;
        // ZINCRBY là atomic → không race condition khi cập nhật điểm
        redis.opsForZSet().incrementScore(key, userId, score);
    }

    // Lấy top 100 bảng xếp hạng
    public List<LeaderboardEntry> getTop100(String gameId) {
        String key = LEADERBOARD_KEY + gameId;
        // ZREVRANGE: lấy theo thứ tự giảm dần (score cao nhất = rank 1)
        Set<ZSetOperations.TypedTuple<String>> topPlayers =
            redis.opsForZSet().reverseRangeWithScores(key, 0, 99);

        List<LeaderboardEntry> result = new ArrayList<>();
        int rank = 1;
        for (ZSetOperations.TypedTuple<String> entry : topPlayers) {
            result.add(new LeaderboardEntry(
                rank++,
                entry.getValue(),      // userId
                entry.getScore()       // điểm số
            ));
        }
        return result;
    }

    // Lấy rank của một người chơi cụ thể (dù rank 500.000)
    public PlayerRank getMyRank(String gameId, String userId) {
        String key = LEADERBOARD_KEY + gameId;
        // ZREVRANK trả về 0-indexed rank (0 = vị trí 1)
        Long rank   = redis.opsForZSet().reverseRank(key, userId);
        Double score = redis.opsForZSet().score(key, userId);

        if (rank == null) return PlayerRank.notRanked();

        // Lấy thêm 5 người xung quanh để hiển thị context
        long start = Math.max(0, rank - 2);
        long end   = rank + 2;
        Set<ZSetOperations.TypedTuple<String>> neighbors =
            redis.opsForZSet().reverseRangeWithScores(key, start, end);

        return new PlayerRank(rank + 1, score, neighbors);
    }
}
```

## 6.2 Realtime Push với SSE

```java
@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    // Client kết nối → nhận cập nhật realtime
    @GetMapping(value = "/stream/{gameId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLeaderboard(@PathVariable String gameId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        leaderboardPushService.register(gameId, emitter);

        emitter.onCompletion(() -> leaderboardPushService.unregister(gameId, emitter));
        emitter.onTimeout(() -> leaderboardPushService.unregister(gameId, emitter));
        return emitter;
    }
}

@Service
public class LeaderboardPushService {

    private final Map<String, Set<SseEmitter>> gameEmitters = new ConcurrentHashMap<>();

    // Gọi mỗi khi có người ghi điểm mới
    public void pushUpdate(String gameId, List<LeaderboardEntry> top10) {
        Set<SseEmitter> emitters = gameEmitters.getOrDefault(gameId, Set.of());
        Set<SseEmitter> deadEmitters = ConcurrentHashMap.newKeySet();

        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                    .name("leaderboard-update")
                    .data(top10)
                    .id(String.valueOf(System.currentTimeMillis())));
            } catch (IOException e) {
                deadEmitters.add(emitter);  // kết nối đã chết
            }
        });

        emitters.removeAll(deadEmitters);  // dọn dẹp
    }
}
```

---

# 7. Chiến Lược Load Testing với wrk & JMeter

## 7.1 Script wrk Cho Bán Vé

```bash
# Cài đặt wrk:
# macOS: brew install wrk
# Ubuntu: apt-get install wrk

# Test cơ bản — 500 kết nối đồng thời trong 60 giây:
wrk -t12 -c500 -d60s http://localhost:8080/api/tickets/1/info

# Test với authentication (script Lua):
cat > auth_test.lua << 'LUA'
-- Tạo JWT token cho mỗi request
function request()
    local token = "Bearer eyJhbGciOiJIUzI1NiJ9..." -- token test
    wrk.headers["Authorization"] = token
    wrk.headers["Content-Type"] = "application/json"
    wrk.method = "POST"
    wrk.body = '{"userId": "user_' .. math.random(1000) .. '"}'
    return wrk.format()
end

-- Xử lý response
function response(status, headers, body)
    if status ~= 200 and status ~= 429 then
        print("Unexpected status: " .. status .. " body: " .. body)
    end
end
LUA

wrk -t12 -c2000 -d120s -s auth_test.lua http://localhost:8080/api/tickets/1/purchase
```

## 7.2 Kịch Bản Test Theo Giai Đoạn

```bash
#!/bin/bash
# script: load_test_ticket.sh
# Tìm điểm bão hòa của hệ thống bán vé

BASE_URL="http://localhost:8080/api/tickets/1"
DURATION="60s"

echo "=== BẮT ĐẦU LOAD TEST ==="
echo "Mục tiêu: tìm điểm bão hòa (max RPS trước khi hệ thống degraded)"
echo ""

for CONNECTIONS in 100 500 1000 2000 3000 5000; do
    echo "--- Test với ${CONNECTIONS} kết nối đồng thời ---"

    OUTPUT=$(wrk -t12 -c${CONNECTIONS} -d${DURATION} ${BASE_URL}/info 2>&1)

    RPS=$(echo "$OUTPUT" | grep "Requests/sec" | awk '{print $2}')
    P99=$(echo "$OUTPUT" | grep "99%" | awk '{print $2}')
    ERRORS=$(echo "$OUTPUT" | grep "Non-2xx" | awk '{print $3}')

    echo "  Connections: ${CONNECTIONS}"
    echo "  RPS:         ${RPS}"
    echo "  P99 latency: ${P99}"
    echo "  Errors:      ${ERRORS:-0}"
    echo ""

    # Nếu p99 > 1000ms → đã quá tải, dừng test
    P99_NUM=$(echo $P99 | sed 's/ms//')
    if (( $(echo "$P99_NUM > 1000" | bc -l) )); then
        echo "⚠️  P99 vượt 1 giây! Hệ thống đã quá tải tại ${CONNECTIONS} connections."
        echo "✅ Điểm bão hòa: với khoảng $(( CONNECTIONS / 2 )) connections"
        break
    fi

    sleep 10  # chờ hệ thống hồi phục
done
```

## 7.3 Giải Thích Kết Quả wrk

```
=== KẾT QUẢ MẪU ===
Running 2m test @ http://localhost:8080/api/tickets/1/purchase
  12 threads and 2000 connections

  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    45.23ms   28.34ms  350ms    85%
    Req/Sec   1.23k     234.00    2.10k    78%

  1,800,000 requests in 2.00m, 1.5GB read
  Non-2xx or 3xx responses: 150000  ← 150k request lỗi!

Requests/sec:  15000.00
Transfer/sec:  12.50MB

PHÂN TÍCH:
  RPS = 15.000 req/s → hệ thống xử lý 15k/s
  Avg latency = 45ms → trung bình 45ms mỗi request
  P99 latency suy ra từ "85% trong 45ms" → p99 ≈ 350ms (Max)
  Error rate = 150.000 / 1.800.000 = 8.3% → QUÁ CAO!
    → Nguyên nhân: rate limiter đang từ chối (429) → bình thường
    → Nếu 500 errors → problem thực sự

CÁC CON SỐ QUAN TRỌNG:
  RPS tốt: tăng dần khi thêm connection, sau đó không tăng nữa
  Latency cần để ý:
    p50 < 100ms → tốt
    p95 < 500ms → chấp nhận được
    p99 < 1000ms → cần cải thiện
    p99 > 1000ms → KHÔNG CHẤP NHẬN ĐƯỢC (user bỏ đi)
  Error rate:
    0% → lý tưởng
    < 0.1% → tốt
    0.1-1% → cần điều tra
    > 1% → VẤN ĐỀ NGHIÊM TRỌNG
```

## 7.4 Monitoring Trong Khi Test

```java
// Expose metrics qua Spring Boot Actuator + Micrometer
// Để xem realtime trong Grafana khi đang chạy wrk

@Configuration
public class MetricsConfig {

    @Bean
    MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config()
            .commonTags("application", "ticket-service", "environment", "load-test");
    }
}

@Service
public class TicketService {

    private final Counter purchaseCounter;
    private final Counter failureCounter;
    private final Timer purchaseTimer;
    private final Gauge queueSizeGauge;

    public TicketService(MeterRegistry registry) {
        this.purchaseCounter = Counter.builder("tickets.purchased")
            .description("Số vé đã bán thành công").register(registry);

        this.failureCounter = Counter.builder("tickets.failed")
            .description("Số lần mua vé thất bại").register(registry);

        this.purchaseTimer = Timer.builder("tickets.purchase.duration")
            .description("Thời gian xử lý mua vé")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);
    }

    public PurchaseResult purchase(Long ticketId, String userId) {
        return purchaseTimer.record(() -> {
            PurchaseResult result = doPurchase(ticketId, userId);
            if (result.isSuccess()) purchaseCounter.increment();
            else failureCounter.increment();
            return result;
        });
    }
}
```

---

# 8. Đọc Grafana & Xác Định Điểm Bão Hòa

## 8.1 Dashboard Cần Thiết

```
4 PANEL CỐT LÕI cho bất kỳ hệ thống nào:

PANEL 1: RPS (Requests Per Second)
  Metric: rate(http_requests_total[1m])
  Ý nghĩa: "Hệ thống xử lý bao nhiêu req/s?"
  Tăng đều → tốt. Plateau → đạt giới hạn. Giảm → quá tải.

PANEL 2: Latency Percentiles
  Metric: histogram_quantile(0.99, rate(http_duration_bucket[5m]))
  Hiển thị: p50, p95, p99 trên cùng graph
  Ý nghĩa: "Người dùng thực tế chờ bao lâu?"

PANEL 3: Error Rate
  Metric: rate(http_requests_total{status=~"5.."}[1m]) / rate(http_requests_total[1m])
  Ý nghĩa: "% request đang bị lỗi?"

PANEL 4: Resource Usage
  CPU: rate(process_cpu_seconds_total[1m]) * 100
  Memory: jvm_memory_used_bytes / jvm_memory_max_bytes
  Ý nghĩa: "Còn dư địa không?"

PANEL BỔ SUNG cho Cache:
  Local Cache hit rate: caffeine_cache_hits / (hits + misses)
  Redis hit rate: keyspace_hits / (hits + misses)
  Redis connections: connected_clients
```

## 8.2 Đọc Đồ Thị — Các Pattern Thường Gặp

```
PATTERN 1: HỆ THỐNG KHỎE MẠNH
  RPS: tăng đều theo connections
  Latency: thấp và ổn định (p99 < 200ms)
  Errors: gần 0%
  Action: không cần làm gì

PATTERN 2: ĐẠT ĐIỂM BÃO HÒA (cần chú ý)
  RPS: không tăng thêm dù thêm connections
  Latency: bắt đầu tăng
  Errors: 0-0.5%
  Action: đây là max capacity thực tế → cần scale nếu business cần nhiều hơn

PATTERN 3: QUÁ TẢI (nguy hiểm)
  RPS: bắt đầu GIẢM
  Latency: tăng vọt (p99 > 1s)
  Errors: > 1%
  Action: cần giảm tải ngay → xem xét autoscaling, tắt bớt feature

PATTERN 4: MEMORY LEAK (nguy hiểm ẩn)
  RPS: tốt trong 30 phút đầu
  Sau đó: RPS từ từ giảm, latency tăng dần
  Memory: tăng liên tục, không xuống
  Action: tìm memory leak (heap dump, profiler)

PATTERN 5: N+1 QUERY (phổ biến)
  RPS thấp dù DB CPU bình thường
  DB slow log: nhiều query nhỏ gần nhau
  Latency: cao hơn dự kiến
  Action: kiểm tra Hibernate lazy loading, thêm batch fetch

DẤU HIỆU CẦN ALERT NGAY:
  🔴 p99 > 1000ms
  🔴 Error rate > 1%
  🔴 JVM Memory > 85%
  🔴 DB connections > 80% max_connections
  🔴 Redis evicted_keys > 0 (đang mất dữ liệu!)
  🔴 Circuit breaker state = OPEN
```

## 8.3 Prometheus Alerts

```yaml
# prometheus/alerts.yml

groups:
  - name: ticket-service-alerts
    rules:
      # P99 latency cao
      - alert: HighP99Latency
        expr: histogram_quantile(0.99,
               rate(http_server_requests_seconds_bucket[5m])) > 1
        for: 2m  # kéo dài 2 phút mới alert (tránh false positive)
        labels:
          severity: warning
        annotations:
          summary: "P99 latency vượt 1 giây"
          description: "P99 = {{ $value | humanizeDuration }}"

      # Error rate cao
      - alert: HighErrorRate
        expr: |
          rate(http_server_requests_seconds_count{status=~"5.."}[5m])
          /
          rate(http_server_requests_seconds_count[5m]) > 0.01
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Error rate vượt 1%"

      # Redis eviction — đang mất data cache
      - alert: RedisEvictions
        expr: increase(redis_evicted_keys_total[5m]) > 0
        labels:
          severity: warning
        annotations:
          summary: "Redis đang evict keys — cache bị mất!"

      # Circuit Breaker mở
      - alert: CircuitBreakerOpen
        expr: resilience4j_circuitbreaker_state{state="open"} == 1
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Circuit Breaker '{{ $labels.name }}' đang OPEN"
```

---

# 9. Quyết Định Scale — Khi Nào Cần Gì

## 9.1 Quy Trình Ra Quyết Định

```
KHI HỆ THỐNG CHẬM → PHẢI TÌM BOTTLENECK TRƯỚC khi scale

Bước 1: Xác định bottleneck bằng số liệu
  Hỏi: CPU cao? Memory cao? DB slow query? Network latency?

  CPU bottleneck:   rate(process_cpu_seconds_total[1m]) > 0.8
  Memory leak:      jvm_memory_used_bytes tăng liên tục không xuống
  DB bottleneck:    pg_stat_activity (waiting queries tăng)
  Redis bottleneck: redis_connected_clients / 10000 > 0.8

Bước 2: Giải pháp tương ứng

  CPU cao → thêm horizontal scaling (thêm pod/instance)
  Memory leak → fix code (profiler, heap dump)
  DB bottleneck → thêm index, optimize query, read replica, cache
  Redis bottleneck → tăng maxclients, thêm local cache trước Redis, Cluster

Bước 3: ĐỪNG scale trước khi optimize
  Thêm server (tốn tiền) nhưng DB vẫn bị N+1 → RPS vẫn không tăng!
  Fix query (miễn phí) → RPS tăng 10x
```

## 9.2 Quyết Định Redis: Single vs Sentinel vs Cluster

```
SINGLE REDIS:
  Dùng khi: dev, staging, production nhỏ (<10k req/s)
  Ưu điểm: đơn giản, rẻ
  Nhược điểm: single point of failure, max ~100k ops/s

REDIS SENTINEL (High Availability):
  Dùng khi: cần HA, không cần scale write
  Cần: 1 master + 2 replica + 3 sentinel process
  Ưu điểm: tự động failover ~30s khi master chết
  Nhược điểm: vẫn 1 master → write không scale, tốn thêm ~2x infrastructure

LOCAL CACHE + SINGLE REDIS (Khuyên dùng khi còn đủ chi phí):
  Dùng khi: muốn tăng throughput mà không tốn tiền Cluster
  Caffeine (L1) + Redis (L2) → 80% từ L1 (gratis), 19% từ Redis
  Redis chỉ chịu 20% tải → có thể phục vụ 5x traffic với cùng Redis
  Nhược điểm: data không nhất quán giữa L1 cache của các server

REDIS CLUSTER (Scale Ngang):
  Dùng khi: > 50k write ops/s, dataset > 50GB, cần HA thực sự
  Cần: ≥ 6 node (3 master + 3 replica)
  Ưu điểm: scale horizontally, auto sharding, auto failover
  Nhược điểm:
    - Tốn tiền (6 server thay vì 1)
    - Multi-key operation phức tạp hơn (cần hash tags)
    - Không hỗ trợ MULTI/EXEC cross-slot

QUYẾT ĐỊNH THỰC TẾ:
  Budget hạn chế + traffic < 50k req/s:
    → Local Cache + Single Redis + đủ monitoring
  Budget vừa + cần HA:
    → Local Cache + Redis Sentinel
  Budget lớn + traffic cao:
    → Local Cache + Redis Cluster
```

## 9.3 Database Scaling

```
TẦNG 1: Optimize trước khi scale (miễn phí!)
  - Thêm index đúng chỗ (thường tăng 10-100x)
  - Optimize N+1 query (JOIN FETCH, @BatchSize)
  - Connection pooling (HikariCP đúng cấu hình)
  - Query timeout (tránh query dài block connection pool)

TẦNG 2: Vertical scaling (đơn giản)
  - Nâng cấp server (RAM, CPU, SSD NVMe)
  - PostgreSQL shared_buffers lên 25% RAM
  - Hiệu quả đến khi đạt ~1000 concurrent connections

TẦNG 3: Read Replica
  - 1 master (write) + N replica (read)
  - Tốt khi: 80% read, 20% write
  - Routing: @Transactional(readOnly=true) → replica
  - Nhược điểm: replication lag (~ms), eventual consistency

TẦNG 4: Caching Layer (đã nói ở trên)
  - Đa số read không cần chạm DB nữa

TẦNG 5: Sharding (phức tạp, tốn kém)
  - Chia data ra nhiều DB server theo rule (userId % N, region, v.v.)
  - Chỉ dùng khi tất cả cách trên đã không đủ
  - Cross-shard query rất phức tạp

THỰC TẾ: 99% app không bao giờ cần sharding
  PostgreSQL được tối ưu đúng cách có thể xử lý hàng nghìn TPS
```

## 9.4 Checklist Trước Khi Go Live Flash Sale

```
✅ PRE-SALE PREPARATION (trước 1 giờ):
  □ Pre-warm cache: load hot data vào Redis + local cache
  □ Test load với wrk: chạy 120s ở 2x expected traffic
  □ Verify circuit breaker config
  □ Kiểm tra Redis memory usage còn ≥ 30% free
  □ Database connection pool size đủ
  □ Alert channels test (PagerDuty, Slack, v.v.)
  □ Rollback plan rõ ràng

✅ MONITORING SETUP:
  □ Grafana dashboard mở trên màn hình riêng
  □ 4 panel chính: RPS, Latency, Errors, Resources
  □ Alert cho p99 > 500ms và error rate > 0.5%
  □ Redis monitor: evictions, memory, connections

✅ ON-CALL:
  □ Developer on-call biết cách: restart service, flush cache, scale pods
  □ DBA on-call biết cách: kill slow query, increase max_connections
  □ Liên lạc escalation chain rõ ràng

✅ AFTER SALE:
  □ Download Grafana dashboard → phân tích sau
  □ Document: max RPS đạt được, bottleneck gặp
  □ Postmortem nếu có incident
  □ Cải thiện cho lần sau
```

---

## 📎 Quick Reference

```
3 LỚP PHÒNG THỦ:
  Lớp 1: Rate Limiter + Circuit Breaker (Resilience4j)
           → Lọc request, ngắt mạch khi service lỗi
  Lớp 2: Local Cache (Caffeine) trong mỗi service
           → 80% request trả luôn từ RAM ~100ns
  Lớp 3: Redis Distributed Cache
           → 19% request còn lại ~1ms
  DB:     Chỉ xử lý ~1-2% request

CHỐNG OVERSELL:
  Redis DECRBY atomic → không thể xử lý < 0
  Lua script → check + decrement không thể tách rời

CHỐNG STAMPEDE:
  Mutex lock (SETNX) → chỉ 1 request query DB
  Background refresh → làm mới trước khi TTL hết

CHỐNG PENETRATION:
  Cache null value → key không tồn tại cũng được cache
  Bloom filter → biết chắc key không tồn tại → không query DB

HOT KEY:
  Shard thành N bản sao → requests phân tán
  Local cache L1 → không đánh Redis gì cả

LOAD TESTING:
  wrk: tìm giới hạn nhanh, không ramp-up
  JMeter: mô phỏng thực tế có ramp-up
  Đọc: RPS plateau = điểm bão hòa, RPS giảm = đã quá tải
```

## 📎 Tài Liệu Tham Khảo

| Chủ đề | Link |
|---|---|
| Resilience4j | <https://resilience4j.readme.io/docs/getting-started> |
| Caffeine Cache | <https://github.com/ben-manes/caffeine/wiki> |
| Redis Patterns | <https://redis.io/docs/manual/patterns> |
| wrk Load Testing | <https://github.com/wg/wrk> |
| Prometheus Alerts | <https://prometheus.io/docs/alerting/latest/alerting_rules> |
| Spring Actuator | <https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html> |
| High Scalability Blog | <http://highscalability.com> |

---

# 10. Case 6: Hệ Thống Nhắn Tin — Zalo / WhatsApp Scale

## 10.1 Bài Toán

```
YÊU CẦU:
  - 50 triệu user, 10 triệu online cùng lúc
  - Tin nhắn 1-1 và nhóm (tối đa 500 thành viên)
  - Delivery receipt: Sent → Delivered → Read
  - Offline: nhắn khi user offline → nhận khi online lại
  - Message history: lưu 2 năm, truy cập nhanh
  - Response time < 100ms từ lúc gửi đến lúc đối phương nhận

VẤN ĐỀ CỐT LÕI:
  1. Kết nối: 10 triệu WebSocket connections đồng thời ở đâu?
  2. Routing: server nhận tin nhắn của A biết B đang kết nối server nào?
  3. Offline: B đang offline → tin nhắn lưu ở đâu, gửi lại khi nào?
  4. Group: tin nhắn gửi 1 lần → fan-out đến 500 thành viên thế nào?
  5. History: load 50 tin nhắn cuối nhanh, không query full table
```

## 10.2 Kiến Trúc Tổng Thể

```
                         User A (mobile)
                              │
                    ┌─────────▼──────────┐
                    │   API Gateway /     │
                    │   Load Balancer     │
                    │  (sticky session    │
                    │   theo userId)      │
                    └─────────┬──────────┘
                              │ WebSocket (persistent)
             ┌────────────────┼────────────────┐
             │                │                │
    ┌────────▼────┐  ┌────────▼────┐  ┌────────▼────┐
    │  Chat       │  │  Chat       │  │  Chat       │
    │  Server 1   │  │  Server 2   │  │  Server 3   │
    │  (User A)   │  │  (User B)   │  │  (User C-Z) │
    │  ~3M conn   │  │  ~3M conn   │  │  ~4M conn   │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                │                │
           └────────────────┼────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
   ┌────────▼────┐ ┌────────▼────┐ ┌────────▼────┐
   │   Kafka     │ │   Redis     │ │  Message    │
   │  Message    │ │  Presence   │ │   Store     │
   │  Routing    │ │  (online?)  │ │  Cassandra  │
   └─────────────┘ └─────────────┘ └─────────────┘

ROUTING LÀ BÀI TOÁN KHÓ NHẤT:
  Server 1 nhận tin nhắn từ A gửi cho B
  B đang kết nối Server 2
  → Server 1 phải "tìm" Server 2 và forward tin nhắn

GIẢI PHÁP: Redis Pub/Sub làm message bus nội bộ
  Server 1 → Redis publish vào channel "user:B"
  Server 2 → Redis subscribe channel "user:B"
  Server 2 nhận → push WebSocket xuống B
```

## 10.3 Presence Service — Quản Lý Online/Offline

```java
@Service
public class PresenceService {

    // Khi user kết nối WebSocket
    public void userConnected(String userId, String serverId, String sessionId) {
        String presenceKey = "presence:" + userId;
        // Lưu: user đang ở server nào, session nào
        Map<String, String> presenceData = Map.of(
            "serverId",  serverId,
            "sessionId", sessionId,
            "status",    "ONLINE",
            "lastSeen",  String.valueOf(System.currentTimeMillis())
        );
        redis.opsForHash().putAll(presenceKey, presenceData);
        redis.expire(presenceKey, 30, SECONDS);  // TTL 30s — phải heartbeat duy trì

        // Thông báo bạn bè: "A vừa online"
        publishPresenceChange(userId, "ONLINE");
    }

    // Heartbeat mỗi 15 giây từ client → duy trì TTL
    public void heartbeat(String userId) {
        redis.expire("presence:" + userId, 30, SECONDS);
    }

    // Khi user ngắt kết nối
    public void userDisconnected(String userId) {
        redis.opsForHash().put("presence:" + userId, "status", "OFFLINE");
        redis.opsForHash().put("presence:" + userId, "lastSeen",
            String.valueOf(System.currentTimeMillis()));
        redis.expire("presence:" + userId, 300, SECONDS);  // giữ 5 phút cho "last seen"
        publishPresenceChange(userId, "OFFLINE");
    }

    // Kiểm tra user có online không
    public PresenceInfo getPresence(String userId) {
        Map<Object, Object> data = redis.opsForHash().entries("presence:" + userId);
        if (data.isEmpty()) return PresenceInfo.offline();
        return PresenceInfo.from(data);
    }

    private void publishPresenceChange(String userId, String status) {
        // Notify qua Kafka để fan-out đến bạn bè
        kafkaTemplate.send("user.presence.changed",
            new PresenceChangedEvent(userId, status));
    }
}
```

## 10.4 Gửi Tin Nhắn — Flow Chi Tiết

```java
@Service
public class MessageService {

    // BƯỚC 1: Client gửi tin → server nhận
    public void sendMessage(SendMessageRequest req, String senderSessionId) {
        // Tạo message với ID monotonically increasing (dùng Snowflake ID)
        Message message = Message.builder()
            .id(snowflakeIdGenerator.nextId())  // 64-bit unique ID, sortable by time
            .senderId(req.getSenderId())
            .receiverId(req.getReceiverId())
            .content(req.getContent())
            .status(MessageStatus.SENT)
            .timestamp(Instant.now())
            .build();

        // BƯỚC 2: Persist ngay (durability trước tiên)
        messageRepository.save(message);  // Cassandra — designed for write-heavy

        // BƯỚC 3: Gửi đến receiver (async, không block sender)
        kafkaTemplate.send("message.send",
            new MessageRouteEvent(message, req.getReceiverId()));

        // BƯỚC 4: Trả lại ACK cho sender ngay (không chờ delivery)
        webSocketHandler.sendToSession(senderSessionId,
            new MessageAck(message.getId(), MessageStatus.SENT));
    }

    // BƯỚC 4 (async): Kafka consumer routing tin nhắn
    @KafkaListener(topics = "message.send", groupId = "message-router")
    public void routeMessage(MessageRouteEvent event) {
        String receiverId = event.getReceiverId();
        PresenceInfo presence = presenceService.getPresence(receiverId);

        if (presence.isOnline()) {
            // User online → forward qua Redis pub/sub đến server đang giữ connection
            String channel = "chat:server:" + presence.getServerId();
            redis.convertAndSend(channel, new DeliverMessageCommand(
                receiverId, presence.getSessionId(), event.getMessage()
            ));
        } else {
            // User offline → lưu vào inbox queue
            pushOfflineMessage(receiverId, event.getMessage());
        }
    }

    // Khi user online lại → push pending messages
    @EventListener
    public void onUserCameOnline(UserOnlineEvent event) {
        List<Message> pending = offlineInbox.drain(event.getUserId());
        pending.forEach(msg -> deliverToWebSocket(event.getUserId(), msg));
    }
}
```

## 10.5 Message Storage — Cassandra Schema

```sql
-- Cassandra được thiết kế cho write-heavy + time-series
-- Partition key = conversation_id → tất cả tin nhắn 1 conversation ở cùng node
-- Clustering key = message_id (Snowflake, time-sortable) → tự sắp xếp theo thời gian

CREATE TABLE messages (
    conversation_id TEXT,          -- "dm:userA:userB" hoặc "group:groupId"
    message_id      BIGINT,        -- Snowflake ID (time-sortable)
    sender_id       TEXT,
    content         TEXT,
    content_type    TEXT,          -- TEXT, IMAGE, VIDEO, FILE
    status          TEXT,
    created_at      TIMESTAMP,
    PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC)  -- tin nhắn mới nhất trước
  AND default_time_to_live = 63072000;         -- TTL 2 năm tự động xóa

-- Load 50 tin nhắn gần nhất (O(1) — lấy từ đầu partition):
SELECT * FROM messages
WHERE conversation_id = 'dm:userA:userB'
LIMIT 50;

-- Load tin nhắn cũ hơn (pagination):
SELECT * FROM messages
WHERE conversation_id = 'dm:userA:userB'
  AND message_id < :lastMessageId
LIMIT 50;

-- Tại sao Cassandra thay vì PostgreSQL?
-- PostgreSQL: 1 table messages với 100 tỷ rows → query chậm dần
-- Cassandra: partition tự nhiên theo conversation → mỗi conversation ~vài nghìn rows
--            query chỉ scan 1 partition → luôn nhanh dù hệ thống lớn đến đâu
```

## 10.6 Group Message Fan-out

```java
@Service
public class GroupMessageService {

    // Gửi tin nhắn nhóm → fan-out đến N thành viên
    public void sendGroupMessage(GroupMessageRequest req) {
        Message message = createMessage(req);
        messageRepository.save(message);

        // Lấy danh sách thành viên (cache trong Redis, TTL 5 phút)
        List<String> memberIds = getGroupMembers(req.getGroupId());  // tối đa 500

        // FAN-OUT: tạo N delivery task, đẩy vào Kafka
        // Mỗi partition Kafka xử lý một batch thành viên
        // Tránh blocking: không deliver trực tiếp trong HTTP request
        List<MessageDeliveryTask> tasks = memberIds.stream()
            .filter(memberId -> !memberId.equals(req.getSenderId()))
            .map(memberId -> new MessageDeliveryTask(message, memberId))
            .collect(toList());

        // Batch send vào Kafka (1 lần gọi, N records)
        kafkaTemplate.send(tasks.stream()
            .map(task -> new ProducerRecord<>("message.deliver",
                task.getReceiverId(),  // partition key = receiverId (cùng user → cùng partition → ordered)
                task))
            .collect(toList()));
    }

    // Consumer: N thread xử lý song song fan-out
    @KafkaListener(topics = "message.deliver",
                   groupId = "message-delivery",
                   concurrency = "20")  // 20 partition = 20 thread song song
    public void deliverMessage(MessageDeliveryTask task) {
        routeToUser(task.getMessage(), task.getReceiverId());
    }

    // ĐIỂM BÃO HÒA:
    // Nhóm 500 người, 1 tin nhắn → 499 delivery task
    // 1000 tin nhắn/giây vào nhóm = 499.000 delivery/giây
    // 20 consumer partition × 25.000 delivery/partition/s → OK
}
```

---

# 11. Case 7: Event-Driven Architecture — Thiết Kế Đúng Cách

## 11.1 Vấn Đề Coupling Trong Microservices

```
TRƯỚC EVENT-DRIVEN (synchronous coupling):

  OrderService.placeOrder():
    1. Gọi HTTP → InventoryService.reserve()     [nếu lỗi → order fail]
    2. Gọi HTTP → PaymentService.charge()        [nếu lỗi → order fail]
    3. Gọi HTTP → EmailService.sendConfirmation() [nếu lỗi → order fail]
    4. Gọi HTTP → LoyaltyService.addPoints()     [nếu lỗi → order fail]
    5. Gọi HTTP → AnalyticsService.track()       [nếu lỗi → order fail]

  VẤN ĐỀ:
    - 5 external HTTP calls trước khi trả về cho user
    - Mỗi call 50ms → tổng 250ms chỉ cho external calls
    - EmailService chậm/lỗi → TOÀN BỘ order bị block/fail
    - OrderService biết về tất cả 5 services → tightly coupled
    - Thêm SMS service → phải sửa OrderService

SAU EVENT-DRIVEN:

  OrderService.placeOrder():
    1. Validate + persist order
    2. Publish event "OrderPlaced"
    3. Return 202 Accepted ngay lập tức

  Mỗi service lắng nghe và tự xử lý:
    InventoryService → lắng nghe OrderPlaced → reserve
    PaymentService   → lắng nghe OrderPlaced → charge
    EmailService     → lắng nghe OrderPlaced → send email
    LoyaltyService   → lắng nghe OrderPlaced → add points
    SmsService       → lắng nghe OrderPlaced → send SMS (thêm mà không sửa Order!)

  LỢI ÍCH:
    OrderService response time: ~20ms (chỉ persist + publish)
    EmailService lỗi: order vẫn thành công, email retry sau
    Thêm service mới: không đụng code OrderService
    Scale độc lập: tăng EmailService không ảnh hưởng OrderService
```

## 11.2 Outbox Pattern — Đảm Bảo Exactly-Once

```
VẤN ĐỀ DUAL-WRITE:
  @Transactional
  void placeOrder(Order order) {
      orderRepo.save(order);         // ghi DB
      kafka.publish("OrderPlaced");  // gửi Kafka
  }

  Nếu DB commit OK nhưng Kafka fail → order trong DB nhưng
  EmailService không biết → không gửi email → user nghĩ order thất bại!

  Nếu Kafka OK nhưng DB fail → email gửi đi nhưng order không tồn tại!
  → INCONSISTENCY

GIẢI PHÁP: Outbox Pattern
  Ghi event vào bảng "outbox" trong CÙNG transaction với business data
  Một process riêng đọc outbox → publish Kafka → đánh dấu đã publish

  Đảm bảo: nếu DB commit thành công → event SẼ được publish (eventually)
  Nếu DB rollback → event cũng không được tạo
```

```java
// 1. Entity Outbox trong cùng database
@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
    @Id private UUID id;
    private String aggregateType;     // "Order"
    private String aggregateId;       // orderId
    private String eventType;         // "OrderPlaced"
    private String payload;           // JSON
    private OutboxStatus status;      // PENDING, PUBLISHED
    private Instant createdAt;
    private Instant publishedAt;
}

// 2. Ghi vào outbox trong CÙNG transaction
@Service
public class OrderService {

    @Transactional  // 1 transaction duy nhất!
    public OrderResult placeOrder(PlaceOrderRequest req) {
        // Ghi business data
        Order order = orderRepository.save(new Order(req));

        // Ghi event vào CÙNG transaction (không Kafka call!)
        outboxRepository.save(new OutboxEvent(
            UUID.randomUUID(),
            "Order",
            order.getId().toString(),
            "OrderPlaced",
            objectMapper.writeValueAsString(new OrderPlacedEvent(order))
        ));

        return OrderResult.success(order.getId());
        // Commit → cả 2 records đều được lưu hoặc cả 2 rollback
    }
}

// 3. Outbox Publisher (chạy độc lập, đọc và publish)
@Service
public class OutboxPublisher {

    @Scheduled(fixedDelay = 500)  // check mỗi 500ms
    @Transactional
    public void publishPendingEvents() {
        // Lấy tối đa 100 event chưa publish, sắp xếp theo createdAt
        List<OutboxEvent> pending = outboxRepository
            .findTop100ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);

        for (OutboxEvent event : pending) {
            try {
                // Publish to Kafka
                kafkaTemplate.send(
                    topicMapping.get(event.getEventType()),
                    event.getAggregateId(),  // partition key
                    event.getPayload()
                ).get(5, SECONDS);  // chờ Kafka confirm

                // Đánh dấu đã publish
                event.setStatus(OutboxStatus.PUBLISHED);
                event.setPublishedAt(Instant.now());
                outboxRepository.save(event);

            } catch (Exception e) {
                log.error("Failed to publish event {}, will retry", event.getId(), e);
                // Không update status → sẽ retry lần sau
            }
        }
    }
}
```

## 11.3 Saga Pattern — Distributed Transaction

```
VẤN ĐỀ: Order cần giảm tồn kho + trừ tiền + tạo shipment
         Mỗi bước ở service khác nhau, không có distributed transaction
         Nếu bước 3 fail → phải "undo" bước 1 và 2

SAGA: chuỗi transactions cục bộ, mỗi bước publish event
      Nếu bước N fail → chạy các "compensating transaction" để undo

CHOREOGRAPHY SAGA (decentralized):
  OrderService  → publish OrderPlaced
  Inventory     → lắng nghe OrderPlaced → reserve → publish InventoryReserved
  Payment       → lắng nghe InventoryReserved → charge → publish PaymentCharged
  Shipping      → lắng nghe PaymentCharged → create → publish ShipmentCreated
  OrderService  → lắng nghe ShipmentCreated → complete order

  Nếu Payment fail:
  Payment       → publish PaymentFailed
  Inventory     → lắng nghe PaymentFailed → RELEASE inventory (compensate!)
  OrderService  → lắng nghe PaymentFailed → mark FAILED

ORCHESTRATION SAGA (centralized — giống README project):
  Orchestrator điều phối tất cả bước (state machine)
  Dễ debug, dễ trace, biết chính xác đang ở bước nào
  → Phù hợp cho onboarding, complex workflow
```

```java
// Orchestration Saga cho Order Processing
@Service
public class OrderSagaOrchestrator {

    // State machine: CREATED → INVENTORY_RESERVED → PAID → SHIPPED → COMPLETED
    @KafkaListener(topics = {
        "inventory.reserved", "inventory.failed",
        "payment.charged",   "payment.failed",
        "shipment.created",  "shipment.failed"
    })
    public void handleSagaEvent(SagaEvent event) {
        OrderSaga saga = sagaRepository.findByOrderId(event.getOrderId());

        switch (event.getType()) {
            case "InventoryReserved" -> {
                saga.transition(INVENTORY_RESERVED);
                // Bước tiếp: charge payment
                kafkaTemplate.send("payment.charge",
                    new ChargePaymentCommand(saga.getOrderId(), saga.getAmount()));
            }
            case "InventoryFailed" -> {
                saga.transition(FAILED);
                // Không cần compensate gì (inventory không được reserve)
                notifyOrderFailed(saga.getOrderId(), "Out of stock");
            }
            case "PaymentCharged" -> {
                saga.transition(PAID);
                kafkaTemplate.send("shipment.create",
                    new CreateShipmentCommand(saga.getOrderId()));
            }
            case "PaymentFailed" -> {
                saga.transition(COMPENSATING);
                // COMPENSATE: hoàn lại inventory đã reserve
                kafkaTemplate.send("inventory.release",
                    new ReleaseInventoryCommand(saga.getOrderId()));
                notifyOrderFailed(saga.getOrderId(), "Payment failed");
            }
            case "ShipmentCreated" -> saga.transition(COMPLETED);
        }
        sagaRepository.save(saga);
    }
}
```

## 11.4 CQRS — Tách Read và Write

```
VẤN ĐỀ: Order service vừa xử lý write (place order) vừa đọc báo cáo phức tạp
  Query "tổng doanh thu theo category trong 30 ngày" → JOIN 5 bảng, chậm
  Query này ảnh hưởng throughput của write operations

CQRS: Command Query Responsibility Segregation
  Write side (Command): PostgreSQL normalized, tối ưu cho write
  Read side  (Query):   Elasticsearch/MongoDB denormalized, tối ưu cho read

  Khi order được tạo → event sync sang read store
  Read store có schema riêng, tối ưu cho query cụ thể

                  Write side              Read side
  OrderService → PostgreSQL  →  Event  → Elasticsearch
  (normalized,                   sync    (denormalized,
   ACID, write                           full-text search,
   optimized)                            analytics optimized)

  Nhược điểm: eventual consistency (read store chậm hơn vài ms)
  Dùng khi: read và write có requirement khác nhau nhiều
```

---

# 12. Case 8: Đặt Xe Grab — Realtime Matching

## 12.1 Bài Toán

```
YÊU CẦU:
  - 10 triệu ride/ngày tại Đông Nam Á
  - Tìm tài xế gần nhất trong vòng 5km
  - Realtime tracking vị trí tài xế (cập nhật mỗi 3 giây)
  - Matching: tìm & gửi request đến tài xế trong < 2 giây
  - Surge pricing: tính giá động theo demand/supply khu vực
  - Trip state machine: SEARCHING → ACCEPTED → DRIVER_EN_ROUTE → TRIP_STARTED → COMPLETED

VẤN ĐỀ KỸ THUẬT:
  1. Location storage: 500.000 tài xế cập nhật vị trí mỗi 3s
     = 167.000 location update/giây → không thể write DB mỗi lần!
  2. Geo query: "tìm tài xế trong 5km quanh điểm A" → phải nhanh
  3. Matching: không để 2 hành khách match cùng 1 tài xế
  4. Driver state: tài xế đang busy/available cần update realtime
```

## 12.2 Location Service — Redis Geo

```java
@Service
public class DriverLocationService {

    // Tài xế update vị trí mỗi 3 giây
    // Redis GEO lưu tất cả tài xế available vào 1 sorted set
    // Score = geohash (52-bit encode lat/lng)
    public void updateDriverLocation(String driverId, double lat, double lng) {
        String geoKey = "drivers:available:geo";

        // GEOADD: O(log n) — thêm hoặc update vị trí
        redis.opsForGeo().add(geoKey,
            new RedisGeoCommands.GeoLocation<>(driverId,
                new Point(lng, lat)));

        // Driver metadata (status, vehicle type, rating)
        redis.opsForHash().put("driver:" + driverId, "lat", String.valueOf(lat));
        redis.opsForHash().put("driver:" + driverId, "lng", String.valueOf(lng));
        redis.opsForHash().put("driver:" + driverId, "updatedAt",
            String.valueOf(System.currentTimeMillis()));
        redis.expire("driver:" + driverId, 30, SECONDS);  // offline nếu không update 30s
    }

    // Tìm tài xế trong 5km, lấy tối đa 10 người gần nhất
    public List<NearbyDriver> findNearbyDrivers(double passengerLat,
                                                 double passengerLng,
                                                 double radiusKm) {
        GeoResults<RedisGeoCommands.GeoLocation<String>> results =
            redis.opsForGeo().radius(
                "drivers:available:geo",
                new Circle(new Point(passengerLng, passengerLat),
                           new Distance(radiusKm, Metrics.KILOMETERS)),
                RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
                    .includeDistance()
                    .includeCoordinates()
                    .sortAscending()        // gần nhất trước
                    .limit(10)             // tối đa 10 kết quả
            );

        return results.getContent().stream()
            .map(result -> new NearbyDriver(
                result.getContent().getName(),           // driverId
                result.getDistance().getValue(),         // khoảng cách km
                result.getContent().getPoint()           // tọa độ
            ))
            .collect(toList());
    }

    // Khi tài xế nhận trip → xóa khỏi available pool
    public void markDriverBusy(String driverId) {
        redis.opsForGeo().remove("drivers:available:geo", driverId);
        redis.opsForHash().put("driver:" + driverId, "status", "BUSY");
    }

    // Khi trip kết thúc → thêm lại vào available pool
    public void markDriverAvailable(String driverId,
                                     double lat, double lng) {
        updateDriverLocation(driverId, lat, lng);
        redis.opsForHash().put("driver:" + driverId, "status", "AVAILABLE");
    }
}
```

## 12.3 Matching Engine — Chống Duplicate Match

```java
@Service
public class MatchingService {

    // Xử lý yêu cầu đặt xe từ hành khách
    public MatchResult requestRide(RideRequest request) {
        List<NearbyDriver> candidates = locationService.findNearbyDrivers(
            request.getPickupLat(), request.getPickupLng(), 5.0);

        if (candidates.isEmpty()) {
            return MatchResult.noDriverAvailable();
        }

        // Thử match từng tài xế theo thứ tự (gần nhất trước)
        for (NearbyDriver driver : candidates) {
            MatchAttemptResult attempt = tryMatchDriver(
                driver.getDriverId(), request);

            if (attempt.isSuccess()) {
                return MatchResult.matched(driver.getDriverId(),
                    attempt.getEta());
            }
            // Tài xế vừa bị match bởi request khác → thử tiếp
        }
        return MatchResult.noDriverAvailable();
    }

    // Atomic lock: tránh 2 hành khách match cùng tài xế
    private MatchAttemptResult tryMatchDriver(String driverId,
                                               RideRequest request) {
        String lockKey = "driver:lock:" + driverId;

        // SET NX EX: atomic, đặt lock 30s
        boolean locked = Boolean.TRUE.equals(
            redis.opsForValue().setIfAbsent(lockKey,
                request.getPassengerId(), Duration.ofSeconds(30)));

        if (!locked) {
            // Tài xế đang được request khác lock → thử tài xế tiếp theo
            return MatchAttemptResult.driverBusy();
        }

        try {
            // Gửi request đến tài xế qua WebSocket
            boolean accepted = sendRideRequestToDriver(driverId, request);

            if (accepted) {
                // Tài xế chấp nhận → confirm match
                locationService.markDriverBusy(driverId);
                return MatchAttemptResult.success(calculateEta(driverId, request));
            } else {
                // Tài xế từ chối hoặc timeout → release lock, thử người khác
                redis.delete(lockKey);
                return MatchAttemptResult.rejected();
            }
        } catch (Exception e) {
            redis.delete(lockKey);  // đảm bảo release lock khi có lỗi
            return MatchAttemptResult.error();
        }
    }
}
```

## 12.4 Trip State Machine & Realtime Tracking

```java
// State machine cho 1 chuyến xe
// SEARCHING → ACCEPTED → DRIVER_EN_ROUTE → TRIP_STARTED → COMPLETED
// Lỗi: CANCELLED, NO_DRIVER_FOUND, DRIVER_NO_SHOW

@Entity
public class Trip {
    private TripStatus status;
    private String passengerId;
    private String driverId;
    private Point pickupLocation;
    private Point dropoffLocation;
    private BigDecimal fare;
    @Version private Long version;  // optimistic locking

    public void accept(String driverId) {
        validateTransition(SEARCHING, ACCEPTED);
        this.driverId = driverId;
        this.status = ACCEPTED;
    }

    public void startTrip() {
        validateTransition(DRIVER_EN_ROUTE, TRIP_STARTED);
        this.status = TRIP_STARTED;
    }

    public void complete(BigDecimal fare) {
        validateTransition(TRIP_STARTED, COMPLETED);
        this.status = COMPLETED;
        this.fare = fare;
    }

    private void validateTransition(TripStatus from, TripStatus to) {
        if (this.status != from) {
            throw new InvalidTransitionException(
                "Cannot go from " + this.status + " to " + to);
        }
    }
}

// Realtime: push location update đến hành khách qua SSE
@Service
public class TripTrackingService {

    // Tài xế update vị trí → push ngay đến hành khách đang chờ
    @KafkaListener(topics = "driver.location.updated")
    public void onDriverLocationUpdate(DriverLocationEvent event) {
        // Tìm trip đang active của tài xế này
        String passengerId = activeTrips.getPassengerId(event.getDriverId());
        if (passengerId == null) return;

        // Push vị trí đến hành khách qua SSE
        sseEmitters.getEmitter(passengerId).ifPresent(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                    .name("driver-location")
                    .data(Map.of(
                        "lat", event.getLat(),
                        "lng", event.getLng(),
                        "heading", event.getHeading(),
                        "eta", etaService.calculate(event, activeTrips.getPickup(passengerId))
                    )));
            } catch (IOException e) {
                sseEmitters.remove(passengerId);
            }
        });
    }
}
```

## 12.5 Surge Pricing — Tính Giá Động

```java
@Service
public class SurgePricingService {

    // Chia map thành lưới ô (hexagonal grid với H3 library)
    // Mỗi ô: đếm số tài xế available và số request đang chờ
    public double getSurgeMultiplier(double lat, double lng) {
        String hexCell = H3Core.geoToH3(lat, lng, 8);  // resolution 8 ≈ 0.7km²

        // Đếm supply (tài xế available trong ô này)
        long availableDrivers = redis.opsForZSet()
            .count("drivers:available:geo",
                Range.closed(/* geohash range cho ô */));

        // Đếm demand (request đang tìm tài xế)
        long pendingRequests = redis.opsForValue()
            .increment("demand:hex:" + hexCell, 0);

        if (availableDrivers == 0) return 3.0;  // không có tài xế → surge 3x

        double ratio = (double) pendingRequests / availableDrivers;
        // Công thức surge: linear từ 1.0 (ratio ≤ 1) đến 2.5 (ratio ≥ 5)
        return Math.min(2.5, Math.max(1.0, ratio * 0.5 + 0.5));
    }
}
```

---

# 13. Case 9: Bank Onboarding System — State Machine & Integration

## 13.1 Tổng Quan Hệ Thống (từ README thực tế)

```
YÊU CẦU NGÂN HÀNG:
  - Xác minh danh tính khách hàng (Identity Verification)
  - Kiểm tra tuân thủ (Compliance / AML / KYC)
  - Tích hợp nhiều service bên ngoài
  - Không được tạo tài khoản trùng lặp
  - Audit log đầy đủ mọi thao tác
  - Hỗ trợ retry khi service downstream lỗi

STATE MACHINE:
  INITIATED → DETAILS_PENDING → DOCS_UPLOADED → IDENTITY_CHECKING
  → COMPLIANCE_PENDING → ACCOUNT_CREATING → COMPLETE
  
  Lỗi: IDV_FAILED | NEEDS_REVIEW | FAILED

CÁC SERVICE TÍCH HỢP:
  Document Service (:8081) — lưu CMND/hộ chiếu
  IDV Service      (:8082) — xác minh danh tính qua AI/provider
  CIS Service      (:8083) — tạo customer record
  Compliance       (:8084) — kiểm tra blacklist, AML
  Core Banking     (:8085) — tạo tài khoản thực sự

KAFKA FLOW:
  orchestrator → account.requested → account-creation-service
  account-creation-service → account.opened / account.failed → orchestrator
```

## 13.2 Session State Machine

```java
@Entity
@Table(name = "onboarding_sessions")
public class OnboardingSession {

    @Id private UUID sessionId;
    @Enumerated(EnumType.STRING) private OnboardingStatus status;
    private String customerId;
    private String productType;

    @Type(JsonBinaryType.class)  // PostgreSQL JSONB
    @Column(columnDefinition = "jsonb")
    private PersonalDetails personalDetails;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private DocumentRefs documentRefs;

    private String correlationId;
    @Version private Long version;  // optimistic locking — tránh concurrent state update

    // State machine transitions (với validation)
    public void submitDetails(PersonalDetails details) {
        requireStatus(INITIATED);
        this.personalDetails = details;
        this.status = DETAILS_PENDING;
    }

    public void documentsUploaded(DocumentRefs refs) {
        requireStatus(DETAILS_PENDING);
        this.documentRefs = refs;
        this.status = DOCS_UPLOADED;
    }

    public void identityCheckStarted() {
        requireStatus(DOCS_UPLOADED);
        this.status = IDENTITY_CHECKING;
    }

    public void identityVerified() {
        requireStatus(IDENTITY_CHECKING);
        this.status = COMPLIANCE_PENDING;
    }

    public void identityFailed(String reason) {
        requireStatus(IDENTITY_CHECKING);
        this.status = IDV_FAILED;
        this.failureReason = reason;
    }

    public void accountCreating(String cisCustomerId) {
        requireStatus(COMPLIANCE_PENDING);
        this.customerId = cisCustomerId;
        this.status = ACCOUNT_CREATING;
    }

    public void complete(String accountNumber) {
        requireStatus(ACCOUNT_CREATING);
        this.accountNumber = accountNumber;
        this.status = COMPLETE;
    }

    private void requireStatus(OnboardingStatus expected) {
        if (this.status != expected) {
            throw new InvalidTransitionException(
                "Session " + sessionId + ": expected " + expected + ", got " + status);
        }
    }
}
```

## 13.3 Orchestrator Service — Điều Phối Toàn Bộ Flow

```java
@Service
@Slf4j
public class OnboardingOrchestrator {

    // BƯỚC 3: Trigger identity verification (docs upload + IDV call)
    @Transactional
    public void triggerIdentityVerification(UUID sessionId) {
        OnboardingSession session = sessionRepo.findByIdWithLock(sessionId);
        session.identityCheckStarted();
        sessionRepo.save(session);

        // Ghi history (audit log)
        historyRepo.save(new SessionStateHistory(session, IDENTITY_CHECKING,
            "Identity check triggered"));

        // Gọi Document Service với Circuit Breaker + Retry
        DocumentUploadResult docResult = documentServiceClient.upload(
            session.getDocumentRefs(), session.getCorrelationId());

        // Gọi IDV Service
        IDVResult idvResult = idvServiceClient.verify(
            session.getPersonalDetails(), docResult.getDocumentId(),
            session.getCorrelationId());

        processIdvResult(session, idvResult);
    }

    @Transactional
    private void processIdvResult(OnboardingSession session, IDVResult result) {
        if (result.isPassed()) {
            session.identityVerified();
            historyRepo.save(new SessionStateHistory(session, COMPLIANCE_PENDING,
                "IDV passed: score=" + result.getScore()));

            // Gọi Compliance async (có thể mất vài phút)
            kafkaTemplate.send("compliance.check.requested",
                new ComplianceCheckRequest(session.getSessionId(),
                    session.getPersonalDetails()));
        } else {
            session.identityFailed(result.getFailureReason());
            historyRepo.save(new SessionStateHistory(session, IDV_FAILED,
                "IDV failed: " + result.getFailureReason()));
        }
        sessionRepo.save(session);

        // Publish status change event (cho UI polling / webhook)
        kafkaTemplate.send("onboarding.status.changed",
            new OnboardingStatusChanged(session.getSessionId(), session.getStatus()));
    }

    // BƯỚC 4: Nhận kết quả Compliance (async)
    @KafkaListener(topics = "compliance.check.completed")
    @Transactional
    public void handleComplianceResult(ComplianceCheckResult result) {
        OnboardingSession session = sessionRepo.findById(result.getSessionId())
            .orElseThrow();

        if (result.isPassed()) {
            // Tạo customer record trong CIS
            CISCustomer customer = cisServiceClient.createCustomer(
                session.getPersonalDetails(), session.getCorrelationId());

            session.accountCreating(customer.getCustomerId());
            historyRepo.save(new SessionStateHistory(session, ACCOUNT_CREATING,
                "CIS customer created: " + customer.getCustomerId()));
            sessionRepo.save(session);

            // Trigger account creation qua Kafka
            kafkaTemplate.send("account.requested",
                new AccountRequest(session.getSessionId(),
                    customer.getCustomerId(), session.getProductType()));
        } else {
            session.markNeedsReview(result.getFlags());
            historyRepo.save(new SessionStateHistory(session, NEEDS_REVIEW,
                "Compliance flags: " + result.getFlags()));
            sessionRepo.save(session);
        }
    }

    // BƯỚC 5: Nhận kết quả tạo tài khoản (từ account-creation-service)
    @KafkaListener(topics = {"account.opened", "account.failed"})
    @Transactional
    public void handleAccountResult(AccountResultEvent event) {
        OnboardingSession session = sessionRepo.findById(event.getSessionId())
            .orElseThrow();

        if (event.isOpened()) {
            session.complete(event.getAccountNumber());
            historyRepo.save(new SessionStateHistory(session, COMPLETE,
                "Account opened: " + event.getAccountNumber()));
        } else {
            session.fail(event.getFailureReason());
            historyRepo.save(new SessionStateHistory(session, FAILED,
                "Account creation failed: " + event.getFailureReason()));
        }
        sessionRepo.save(session);

        kafkaTemplate.send("onboarding.status.changed",
            new OnboardingStatusChanged(session.getSessionId(), session.getStatus()));
    }
}
```

## 13.4 Idempotency — Tránh Tạo Trùng Session

```java
@RestController
@RequestMapping("/onboarding/sessions")
public class OnboardingController {

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(
            @RequestBody CreateSessionRequest req,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey) {

        // Kiểm tra idempotency key trong Redis (TTL 24h)
        String cacheKey = "onboarding:idempotent:" + idempotencyKey;
        String cached = (String) redis.opsForValue().get(cacheKey);
        if (cached != null) {
            // Request trùng lặp → trả lại kết quả cũ (201 nhưng không tạo mới)
            return ResponseEntity.status(201)
                .body(objectMapper.readValue(cached, SessionResponse.class));
        }

        // Tạo session mới
        OnboardingSession session = orchestrator.initiate(
            req.getProductType(), idempotencyKey);

        SessionResponse response = new SessionResponse(
            session.getSessionId(), session.getCorrelationId());

        // Lưu response với TTL 24h (cho retry)
        redis.opsForValue().set(cacheKey,
            objectMapper.writeValueAsString(response), 24, HOURS);

        return ResponseEntity.status(201).body(response);
    }
}
```

## 13.5 Resilience4j Config Cho Các Downstream Services

```yaml
# application.yml
resilience4j:
  # Circuit Breaker cho tất cả HTTP calls
  circuitBreaker:
    instances:
      documentService:
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
        slidingWindowSize: 10
        permittedNumberOfCallsInHalfOpenState: 3
      idvService:
        failureRateThreshold: 50
        waitDurationInOpenState: 60s  # IDV thường khôi phục chậm hơn
        slowCallDurationThreshold: 15s
        slowCallRateThreshold: 80
      cisService:
        failureRateThreshold: 30      # CIS quan trọng hơn, threshold thấp hơn
        waitDurationInOpenState: 30s

  # Retry với exponential backoff
  retry:
    instances:
      documentService:
        maxAttempts: 3
        waitDuration: 1s
        multiplier: 2               # 1s → 2s → 4s (exponential)
        retryExceptions:
          - java.net.ConnectException
          - org.springframework.web.client.HttpServerErrorException$ServiceUnavailable
        ignoreExceptions:
          - com.digitalbank.DocumentValidationException  # lỗi 4xx không retry
      idvService:
        maxAttempts: 3
        waitDuration: 2s
        multiplier: 2               # 2s → 4s → 8s

  # Rate Limiter — tránh spam downstream
  rateLimiter:
    instances:
      allDownstream:
        limitForPeriod: 10          # tối đa 10 req/s tổng cộng
        limitRefreshPeriod: 1s
        timeoutDuration: 100ms
```

```java
// HTTP client với Circuit Breaker + Retry
@Service
public class IdvServiceClient {

    @CircuitBreaker(name = "idvService", fallbackMethod = "idvFallback")
    @Retry(name = "idvService")
    @RateLimiter(name = "allDownstream")
    public IDVResult verify(PersonalDetails details,
                             String documentId, String correlationId) {
        return restTemplate.postForObject(
            idvServiceUrl + "/idv/verify",
            new IDVRequest(details, documentId, correlationId),
            IDVResult.class);
    }

    // Fallback khi IDV circuit OPEN hoặc hết retry
    public IDVResult idvFallback(PersonalDetails details,
                                  String documentId,
                                  String correlationId, Throwable e) {
        log.warn("IDV service unavailable for correlationId={}, scheduling for retry",
            correlationId, e);
        // Queue để retry sau khi IDV service phục hồi
        retryQueue.add(new PendingIdvCheck(details, documentId, correlationId));
        // Trả về "pending" để session đợi
        return IDVResult.pending("IDV service temporarily unavailable");
    }
}
```

## 13.6 Account Creation Service — Dead Letter Queue

```java
// Consumer với retry và DLQ (Dead Letter Queue)
@KafkaListener(
    topics = "account.requested",
    groupId = "account-creation",
    containerFactory = "retryableKafkaListenerFactory"  // auto-retry config
)
public void handleAccountRequest(AccountRequest request) {
    try {
        // Idempotency: kiểm tra đã xử lý chưa
        if (accountRequestRepo.existsBySessionId(request.getSessionId())) {
            log.info("Duplicate account request for session {}, skipping",
                request.getSessionId());
            return;
        }

        // Ghi tracking record
        AccountRequestRecord record = accountRequestRepo.save(
            new AccountRequestRecord(request, PROCESSING));

        // Gọi Core Banking
        CoreBankingResult result = coreBankingClient.createAccount(
            request.getCustomerId(), request.getProductType());

        // Cập nhật tracking
        record.complete(result.getAccountNumber());
        accountRequestRepo.save(record);

        // Publish success
        kafkaTemplate.send("account.opened",
            new AccountOpenedEvent(request.getSessionId(),
                result.getAccountNumber()));

    } catch (Exception e) {
        log.error("Failed to create account for session {}, attempt {}/3",
            request.getSessionId(), currentAttempt, e);
        throw e;  // Kafka sẽ retry (theo config)
        // Sau 3 lần → tự động vào account.requested.dlq
    }
}

// Dead Letter Queue processor — xử lý thủ công hoặc alert
@KafkaListener(topics = "account.requested.dlq", groupId = "dlq-handler")
public void handleDlqMessage(AccountRequest request, Acknowledgment ack) {
    log.error("MANUAL INTERVENTION NEEDED: Account request in DLQ for session {}",
        request.getSessionId());

    // Gửi alert đến Slack/PagerDuty
    alertService.sendDlqAlert(request);

    // Cập nhật session sang NEEDS_REVIEW để ops team xử lý
    kafkaTemplate.send("onboarding.status.changed",
        new OnboardingStatusChanged(request.getSessionId(), NEEDS_REVIEW));

    ack.acknowledge();
}
```

## 13.7 Observability — Correlation ID Xuyên Suốt

```java
// Mọi log phải có correlationId để trace xuyên service

// Filter: gắn correlationId vào MDC cho mọi request
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                     HttpServletResponse res,
                                     FilterChain chain) throws Exception {
        String correlationId = Optional
            .ofNullable(req.getHeader("X-Correlation-Id"))
            .orElse(UUID.randomUUID().toString());

        MDC.put("correlationId", correlationId);
        res.setHeader("X-Correlation-Id", correlationId);
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.clear();
        }
    }
}

// logback-spring.xml: mọi log đều có correlationId, sessionId
// Log JSON format với logstash-logback-encoder → Loki → Grafana

// Query trong Grafana Loki:
// {service="onboarding-orchestrator"} | json | correlationId="abc-123"
// → Thấy toàn bộ hành trình của 1 onboarding session!
```

---

## 📎 Tổng Hợp — Chọn Pattern Nào Cho Bài Toán Nào

```
BÀI TOÁN → PATTERN PHÙ HỢP:

Bán vé, flash sale (chịu tải cao):
  → 3 Lớp phòng thủ (Rate Limit + Local Cache + Redis)
  → Redis atomic DECRBY/Lua chống oversell
  → Virtual queue (Redis Sorted Set) cho fairness

Nhắn tin realtime:
  → WebSocket + Redis Pub/Sub để routing giữa servers
  → Cassandra cho message storage (time-series, write-heavy)
  → Presence service với Redis TTL

Microservices cần tách coupling:
  → Event-Driven + Kafka
  → Outbox Pattern để đảm bảo exactly-once
  → Saga Pattern cho distributed transaction

Đặt xe / matching realtime:
  → Redis GEO cho geospatial query O(log n)
  → Distributed lock chống duplicate match
  → SSE cho realtime tracking

Onboarding / workflow phức tạp:
  → State Machine với optimistic locking (@Version)
  → Orchestration Saga (orchestrator điều phối)
  → Resilience4j cho downstream calls
  → Kafka + DLQ cho async + retry
  → Idempotency key chống duplicate
  → Correlation ID xuyên suốt mọi service

NGUYÊN TẮC CHUNG:
  1. Write path: tối ưu cho correctness (lock, transaction, idempotency)
  2. Read path: tối ưu cho tốc độ (cache nhiều lớp)
  3. Async > Sync khi không cần kết quả ngay
  4. Eventual consistency OK cho non-critical (email, notification)
  5. Strong consistency bắt buộc cho money, inventory, identity
  6. Luôn có fallback khi service downstream lỗi
  7. Mọi state transition đều cần audit log
```

## 📎 Tài Liệu Tham Khảo Bổ Sung

| Chủ đề | Link |
|---|---|
| Kafka Consumer Groups | <https://kafka.apache.org/documentation/#intro_consumers> |
| Outbox Pattern | <https://microservices.io/patterns/data/transactional-outbox.html> |
| Saga Pattern | <https://microservices.io/patterns/data/saga.html> |
| Redis Geo Commands | <https://redis.io/docs/data-types/geospatial> |
| H3 Hexagonal Grid (Uber) | <https://h3geo.org/docs> |
| Cassandra Data Modeling | <https://cassandra.apache.org/doc/latest/cassandra/data_modeling> |
| WebSocket Spring | <https://docs.spring.io/spring-framework/reference/web/websocket.html> |
| CQRS Pattern | <https://martinfowler.com/bliki/CQRS.html> |
| Resilience4j Spring | <https://resilience4j.readme.io/docs/getting-started-3> |
