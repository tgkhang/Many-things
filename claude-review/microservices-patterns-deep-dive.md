# 🔧 Microservices Patterns — Complete Deep Dive
>
> Circuit Breaker, Saga, API Gateway, Service Discovery, Event-Driven, CQRS

---

## 📚 Table of Contents

1. [Microservices Fundamentals](#1-microservices-fundamentals)
2. [Service Discovery](#2-service-discovery)
3. [API Gateway](#3-api-gateway)
4. [Circuit Breaker](#4-circuit-breaker)
5. [Saga Pattern](#5-saga-pattern)
6. [Event-Driven Architecture](#6-event-driven-architecture)
7. [CQRS in Microservices](#7-cqrs-in-microservices)
8. [Distributed Tracing & Observability](#8-distributed-tracing--observability)
9. [Data Management Patterns](#9-data-management-patterns)
10. [Deployment Patterns](#10-deployment-patterns)
11. [Security in Microservices](#11-security-in-microservices)
12. [Anti-Patterns & Common Mistakes](#12-anti-patterns--common-mistakes)

---

# 1. Microservices Fundamentals

## 1.1 Monolith vs Microservices

```
MONOLITH:
  Single deployable unit
  All modules in one process
  Shared database, shared memory

  PROS:
    Simple to develop (one codebase)
    Simple to test (no network calls)
    Simple to deploy (one artifact)
    No distributed system complexity
    Low latency (in-process calls)
    Easy transactions (single DB)

  CONS:
    Scales as a whole (can't scale one module)
    Technology lock-in (one language/framework)
    Slow build/deploy cycles (entire app)
    Large team coordination issues
    Single point of failure (one bug can crash all)

MICROSERVICES:
  Multiple small services, each independently deployable
  Each owns its own data
  Communicate via network (HTTP/gRPC/messaging)

  PROS:
    Independent scaling (scale only what's needed)
    Technology diversity (each service picks best tech)
    Independent deployment (release faster)
    Team autonomy (small teams own services)
    Fault isolation (one service fails, others continue)

  CONS:
    Distributed systems complexity
    Network latency, failures
    Data consistency challenges (no ACID across services)
    Harder to test end-to-end
    Operational overhead (many services to monitor)
    Service discovery, load balancing needed

WHEN TO USE MICROSERVICES:
  ✅ Large teams (>50 devs) needing autonomy
  ✅ Different scaling requirements per module
  ✅ Different deployment frequencies per module
  ✅ Technology diversity required
  ✅ High availability, fault isolation critical

  ❌ Small teams (< 10 devs)
  ❌ Simple domain
  ❌ Early-stage startup (premature optimization)
  ❌ Strong ACID transaction requirements

GOLDEN RULE: "Don't start with microservices.
              Start with a modular monolith.
              Extract services when you feel the pain." — Martin Fowler

SERVICE DECOMPOSITION STRATEGIES:
  By business capability:   Order Service, Payment Service, Inventory Service
  By subdomain (DDD):       Each bounded context = one service
  By team:                  Conway's Law — architecture mirrors team structure
  Strangler Fig:            gradually extract from monolith
```

## 1.2 Communication Patterns

```
SYNCHRONOUS (request-response):
  HTTP/REST:   simple, universal, human-readable
  gRPC:        binary, fast, strongly typed (Protobuf), streaming
  GraphQL:     flexible queries, single endpoint

  PROS: simple, immediate response, easy to understand
  CONS: coupling — caller waits, fails if callee fails

ASYNCHRONOUS (messaging):
  Kafka:       distributed log, persistent, replay
  RabbitMQ:    routing, complex patterns, task queues
  SQS/SNS:     AWS-native, managed

  PROS: decoupled, fault tolerant, buffering
  CONS: eventual consistency, harder to debug, no immediate response

CHOOSING:
  Need immediate response:          Synchronous (HTTP/gRPC)
  Can tolerate eventual consistency: Async messaging
  High throughput, replay needed:   Kafka
  Complex routing, task queues:     RabbitMQ
  Simple fan-out notifications:     SNS + SQS
```

---

# 2. Service Discovery

## 2.1 Why Service Discovery?

```
PROBLEM: In microservices, services scale up/down dynamically
         IP addresses change (container restarts, new instances)
         Hard-coding IPs = not scalable!

BEFORE SERVICE DISCOVERY:
  Order Service calls: http://192.168.1.10:8080/payments
  Payment Service restarts on different IP → Order Service broken!

SERVICE DISCOVERY PATTERNS:

CLIENT-SIDE DISCOVERY:
  Client queries Service Registry → gets list of instances
  Client chooses which instance (load balancing in client)
  Client → Registry → gets [IP1, IP2, IP3] → pick one → call directly

  ┌─────────────────────────────────────────┐
  │  Order Service                          │
  │    ↓ 1. query registry                 │
  │  Service Registry (Eureka/Consul)       │
  │    ↓ 2. returns [Pay1, Pay2, Pay3]     │
  │  Order Service → Load Balance → PaySvc │
  └─────────────────────────────────────────┘

  Examples: Netflix Eureka, Consul (client-side mode)

SERVER-SIDE DISCOVERY:
  Client calls a load balancer (no registry knowledge)
  Load balancer queries registry, routes to instance
  Client → Load Balancer → Registry → Instance

  ┌────────────────────────────────────────────┐
  │  Order Service                             │
  │    ↓ 1. call payment-service               │
  │  Load Balancer (AWS ELB, K8s Service)      │
  │    ↓ 2. queries registry / health checks  │
  │    ↓ 3. routes to healthy instance        │
  │  Payment Service Instance                  │
  └────────────────────────────────────────────┘

  Examples: AWS ALB, K8s Service (kube-proxy), nginx upstream
  Simpler client (no registry SDK needed!)

KUBERNETES SERVICE DISCOVERY:
  K8s Service = built-in server-side discovery
  DNS: payment-service.namespace.svc.cluster.local
  kube-proxy maintains iptables rules → routes to healthy pods
  Automatic! No explicit registry configuration.
```

## 2.2 Eureka (Spring Cloud)

```java
// ── EUREKA SERVER ──
@SpringBootApplication
@EnableEurekaServer
public class ServiceRegistryApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServiceRegistryApplication.class, args);
    }
}

# application.yml - Eureka Server:
server:
  port: 8761
eureka:
  instance:
    hostname: localhost
  client:
    registerWithEureka: false   # server doesn't register itself
    fetchRegistry: false

// ── EUREKA CLIENT (each service) ──
@SpringBootApplication
@EnableDiscoveryClient
public class PaymentServiceApplication { ... }

# application.yml - Payment Service:
spring:
  application:
    name: payment-service        # ← service name (used for discovery!)
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
  instance:
    preferIpAddress: true
    instanceId: ${spring.application.name}:${server.port}
    healthCheckUrlPath: /actuator/health
    leaseRenewalIntervalInSeconds: 10   # heartbeat frequency
    leaseExpirationDurationInSeconds: 30

// ── FEIGN CLIENT (declarative HTTP client with discovery) ──
@FeignClient(
    name = "payment-service",          // service name in registry!
    fallback = PaymentServiceFallback.class
)
public interface PaymentServiceClient {

    @PostMapping("/api/payments")
    PaymentResponse charge(@RequestBody ChargeRequest request);

    @GetMapping("/api/payments/{id}")
    PaymentResponse getPayment(@PathVariable String id);
}

@Component
class PaymentServiceFallback implements PaymentServiceClient {
    @Override
    public PaymentResponse charge(ChargeRequest request) {
        return PaymentResponse.failed("Payment service unavailable");
    }

    @Override
    public PaymentResponse getPayment(String id) {
        return PaymentResponse.unknown(id);
    }
}

// ── LOAD BALANCING with Spring Cloud LoadBalancer ──
@Configuration
public class LoadBalancerConfig {

    @Bean
    @LoadBalanced                        // ← enables load balancing!
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

@Service
public class OrderService {

    @Autowired
    private RestTemplate restTemplate;  // @LoadBalanced RestTemplate

    public PaymentResponse callPayment(ChargeRequest req) {
        // "payment-service" → resolved via Eureka → load balanced!
        return restTemplate.postForObject(
            "http://payment-service/api/payments",
            req,
            PaymentResponse.class
        );
    }
}
```

---

# 3. API Gateway

## 3.1 API Gateway Pattern

```
API GATEWAY: single entry point for all client requests
  Handles: routing, authentication, rate limiting, load balancing,
           request transformation, SSL termination, caching

  ┌────────────────────────────────────────────────────────────────┐
  │                                                                │
  │  Mobile App    Web App     Third-party API                    │
  │       │            │             │                             │
  │       └────────────┴─────────────┘                            │
  │                    ↓                                           │
  │             API GATEWAY                                        │
  │    ┌──────────────────────────────────┐                       │
  │    │ Auth   Rate Limit  Transform     │                       │
  │    │ Route  Log         Cache         │                       │
  │    └──────────┬────────────────────┬──┘                       │
  │               │                    │                           │
  │    ┌──────────▼──────┐  ┌──────────▼──────┐                   │
  │    │  Order Service  │  │ Payment Service  │                   │
  │    └─────────────────┘  └──────────────────┘                  │
  │    ┌──────────────────┐  ┌────────────────┐                   │
  │    │  User Service    │  │ Inventory Svc  │                   │
  │    └──────────────────┘  └────────────────┘                   │
  └────────────────────────────────────────────────────────────────┘

RESPONSIBILITIES:
  1. Routing:           URL → service mapping
  2. Authentication:    verify JWT/API keys (don't repeat in each service)
  3. Authorization:     basic access control
  4. Rate Limiting:     prevent abuse
  5. SSL Termination:   HTTPS → HTTP internally
  6. Load Balancing:    distribute across instances
  7. Request Transform: add headers, modify request/response
  8. Caching:           cache responses
  9. Circuit Breaking:  fail fast on downstream failures
  10. Logging/Tracing:  centralized observability

OPTIONS:
  Spring Cloud Gateway:  Java, Spring ecosystem, reactive
  Kong:                  Lua/Go, plugin-based, powerful
  AWS API Gateway:       fully managed, serverless
  NGINX/Traefik:         reverse proxy + gateway features
  Istio:                 service mesh with gateway capabilities
```

## 3.2 Spring Cloud Gateway

```java
// Spring Cloud Gateway: reactive (WebFlux), not blocking!

// ── ROUTE CONFIGURATION ──
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()

            // Route 1: Order Service
            .route("order-service", r -> r
                .path("/api/orders/**")              // match path pattern
                .filters(f -> f
                    .stripPrefix(1)                   // remove /api prefix
                    .addRequestHeader("X-Gateway", "spring-cloud-gateway")
                    .addResponseHeader("X-Response-Time", LocalDateTime.now().toString())
                    .retry(config -> config
                        .setRetries(3)
                        .setStatuses(HttpStatus.SERVICE_UNAVAILABLE)
                        .setBackoff(Duration.ofMillis(100), Duration.ofSeconds(2), 2, true))
                    .circuitBreaker(config -> config
                        .setName("order-service-cb")
                        .setFallbackUri("forward:/fallback/orders"))
                )
                .uri("lb://order-service")            // lb:// = load balanced!
            )

            // Route 2: Payment Service with rate limiting
            .route("payment-service", r -> r
                .path("/api/payments/**")
                .filters(f -> f
                    .requestRateLimiter(config -> config
                        .setRateLimiter(redisRateLimiter())
                        .setKeyResolver(userKeyResolver()))
                )
                .uri("lb://payment-service")
            )

            // Route 3: User Service with auth
            .route("user-service", r -> r
                .path("/api/users/**")
                .and()
                .header("Authorization")              // only route if has auth header
                .filters(f -> f
                    .filter(authFilter)
                )
                .uri("lb://user-service")
            )

            .build();
    }

    // Rate limiter using Redis:
    @Bean
    public RedisRateLimiter redisRateLimiter() {
        return new RedisRateLimiter(10, 20, 1);
        // replenishRate=10: 10 requests/second
        // burstCapacity=20: allow burst up to 20
        // requestedTokens=1: each request costs 1 token
    }

    // Rate limit key: by user ID from JWT
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String token = exchange.getRequest().getHeaders()
                .getFirst("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                String userId = jwtService.extractUserId(token.substring(7));
                return Mono.just(userId);
            }
            return Mono.just(exchange.getRequest().getRemoteAddress()
                .getAddress().getHostAddress());
        };
    }
}

// ── YAML ROUTE CONFIGURATION (alternative) ──
```

```yaml
spring:
  cloud:
    gateway:
      routes:
      - id: order-service
        uri: lb://order-service
        predicates:
        - Path=/api/orders/**
        - Method=GET,POST,PUT,DELETE
        filters:
        - StripPrefix=1
        - name: CircuitBreaker
          args:
            name: orderServiceCB
            fallbackUri: forward:/fallback/orders
        - name: Retry
          args:
            retries: 3
            statuses: SERVICE_UNAVAILABLE
            backoff:
              firstBackoff: 100ms
              maxBackoff: 2s
              factor: 2
        - name: RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate: 10
            redis-rate-limiter.burstCapacity: 20
      
      # Global filters applied to all routes:
      default-filters:
      - name: RequestSize
        args:
          maxSize: 5MB
      - AddResponseHeader=X-Response-Time, NOW
      - name: Logging
```

```java
// ── GATEWAY FILTER: Authentication ──
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final List<String> PUBLIC_PATHS = List.of(
        "/api/auth/login",
        "/api/auth/register",
        "/actuator/health"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Skip auth for public endpoints:
        if (PUBLIC_PATHS.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorized(exchange, "Missing authorization header");
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = jwtService.validateToken(token);

            // Add user info to downstream headers:
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Roles", claims.get("roles", String.class))
                .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (JwtException e) {
            return unauthorized(exchange, "Invalid token: " + e.getMessage());
        }
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        DataBuffer buffer = exchange.getResponse().bufferFactory()
            .wrap(("{\"error\":\"UNAUTHORIZED\",\"message\":\"" + message + "\"}").getBytes());
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() { return -1; }  // execute before other filters
}

// ── FALLBACK CONTROLLER ──
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/orders")
    public ResponseEntity<Map<String, String>> ordersFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "error", "SERVICE_UNAVAILABLE",
                "message", "Order service is temporarily unavailable",
                "retryAfter", "30"
            ));
    }
}
```

---

# 4. Circuit Breaker

## 4.1 Circuit Breaker Pattern

```
PROBLEM: Service A calls Service B repeatedly
         Service B is down or slow
         Service A threads pile up waiting
         Service A runs out of threads → Service A also goes down!
         CASCADE FAILURE across the entire system!

CIRCUIT BREAKER: wrapper around external calls
  3 STATES:
  
  CLOSED (normal operation):
    Requests flow through
    Counts failures
    If failures > threshold → trip to OPEN

  OPEN (fast fail):
    All requests immediately fail (no calling downstream!)
    Returns fallback response
    Wait for timeout (e.g., 30 seconds)
    Then transition to HALF-OPEN

  HALF-OPEN (testing recovery):
    Allow limited requests through (e.g., 5)
    If all succeed → CLOSE (service recovered)
    If any fails → OPEN again (service still down)

┌──────────────────────────────────────────────────────────────────┐
│ CLOSED                          OPEN                             │
│ requests → call downstream      all fail fast (no call)          │
│ count failures                  after timeout                    │
│ threshold exceeded ──────────────────────────────▶               │
│                   ◀──────────────────────────────── success      │
│                                 HALF-OPEN                        │
│                                 probe requests                   │
│                                 any fail → OPEN again           │
└──────────────────────────────────────────────────────────────────┘

BENEFITS:
  Fail fast: no waiting for timeout on every request
  Prevent cascade: protect caller from failed callee
  Auto-recovery: circuit closes when service recovers
  Visibility: metrics on failure rates

WHEN TO USE:
  All outbound HTTP calls, DB connections, external APIs
  Any call that can fail or be slow
```

## 4.2 Resilience4j (Spring Boot)

```java
// DEPENDENCY: resilience4j-spring-boot3

// ── CONFIGURATION ──
```

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        # When circuit trips:
        failureRateThreshold: 50          # 50% failure rate → OPEN
        slowCallRateThreshold: 80         # 80% slow calls → OPEN
        slowCallDurationThreshold: 3000ms # calls > 3s = "slow"
        
        # Window configuration:
        slidingWindowType: COUNT_BASED    # or TIME_BASED
        slidingWindowSize: 20             # last 20 calls
        minimumNumberOfCalls: 10          # need ≥10 calls before tripping
        
        # OPEN state:
        waitDurationInOpenState: 30s      # stay OPEN for 30 seconds
        
        # HALF-OPEN state:
        permittedNumberOfCallsInHalfOpenState: 5  # probe with 5 calls
        automaticTransitionFromOpenToHalfOpenEnabled: true

    instances:
      payment-service:
        base-config: default
        failureRateThreshold: 30         # payment: stricter (30%)
        waitDurationInOpenState: 60s     # payment: wait longer
      
      inventory-service:
        base-config: default
        failureRateThreshold: 60         # inventory: more tolerant

  retry:
    instances:
      payment-service:
        maxAttempts: 3
        waitDuration: 500ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        retryExceptions:
          - java.net.ConnectException
          - java.util.concurrent.TimeoutException
        ignoreExceptions:
          - com.example.BusinessException   # don't retry business errors!

  timelimiter:
    instances:
      payment-service:
        timeoutDuration: 5s               # fail if > 5 seconds
        cancelRunningFuture: true
  
  bulkhead:
    instances:
      payment-service:
        maxConcurrentCalls: 20            # max 20 concurrent calls
        maxWaitDuration: 500ms
```

```java
// ── USAGE WITH ANNOTATIONS ──
@Service
public class PaymentGatewayService {

    // Circuit breaker + retry + timeout combined:
    @CircuitBreaker(name = "payment-service", fallbackMethod = "chargeFallback")
    @Retry(name = "payment-service")
    @TimeLimiter(name = "payment-service")
    @Bulkhead(name = "payment-service", type = Bulkhead.Type.SEMAPHORE)
    public CompletableFuture<PaymentResponse> charge(ChargeRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            return paymentGatewayClient.charge(request);
        });
    }

    // Fallback: called when circuit is OPEN or after max retries
    public CompletableFuture<PaymentResponse> chargeFallback(
            ChargeRequest request, Throwable throwable) {
        log.warn("Payment service fallback triggered: {}", throwable.getMessage());

        // Strategy 1: Queue for later processing
        pendingPaymentQueue.offer(request);
        return CompletableFuture.completedFuture(
            PaymentResponse.queued("Payment queued for processing"));

        // Strategy 2: Try backup payment provider
        // return backupPaymentProvider.charge(request);

        // Strategy 3: Return error (let caller decide)
        // return CompletableFuture.completedFuture(
        //     PaymentResponse.failed("Payment service unavailable, try again later"));
    }
}

// ── PROGRAMMATIC API ──
@Service
public class PaymentService {

    private final CircuitBreaker circuitBreaker;
    private final Retry retry;

    public PaymentService(CircuitBreakerRegistry registry, RetryRegistry retryRegistry) {
        this.circuitBreaker = registry.circuitBreaker("payment-service");
        this.retry = retryRegistry.retry("payment-service");

        // Event listeners:
        circuitBreaker.getEventPublisher()
            .onStateTransition(event ->
                log.warn("CB state transition: {} → {}",
                    event.getStateTransition().getFromState(),
                    event.getStateTransition().getToState()))
            .onError(event ->
                log.error("CB recorded failure: {}", event.getThrowable().getMessage()))
            .onCallNotPermitted(event ->
                log.debug("CB rejected call (OPEN state)"));
    }

    public PaymentResponse charge(ChargeRequest request) {
        // Wrap call with circuit breaker + retry:
        Supplier<PaymentResponse> decoratedCall = CircuitBreaker
            .decorateSupplier(circuitBreaker,
                Retry.decorateSupplier(retry,
                    () -> paymentClient.charge(request)));

        Try<PaymentResponse> result = Try.ofSupplier(decoratedCall)
            .recover(CallNotPermittedException.class,
                e -> PaymentResponse.failed("Circuit breaker is OPEN"))
            .recover(Exception.class,
                e -> handlePaymentError(e, request));

        return result.get();
    }
}

// ── MONITORING ──
// Circuit Breaker state exposed via Actuator:
// GET /actuator/circuitbreakers
// GET /actuator/circuitbreakerevents
// Integrate with Prometheus:
// GET /actuator/prometheus → resilience4j_circuitbreaker_state, _calls_seconds...
```

---

# 5. Saga Pattern

## 5.1 Why Saga?

```
PROBLEM: Distributed transactions across microservices
  Traditional: ACID transaction across single DB
  Microservices: each service has its own DB → can't use single ACID transaction!

2-PHASE COMMIT (2PC) — naive solution:
  Phase 1 (Prepare): coordinator asks all services to "prepare" (lock resources)
  Phase 2 (Commit):  all prepared → coordinator sends commit to all
  
  PROBLEMS:
  - Blocking: locks held during both phases → performance bottleneck
  - Coordinator SPOF: if coordinator crashes after Phase 1 → resources locked forever!
  - Not all DBs support 2PC distributed transactions

SAGA — better solution:
  Break distributed transaction into sequence of LOCAL transactions
  Each service executes its own local transaction
  If step fails → execute COMPENSATING TRANSACTIONS to undo previous steps
  
  Eventual consistency instead of immediate consistency
  No distributed locks!

2 SAGA TYPES:

CHOREOGRAPHY (event-driven, decentralized):
  No central coordinator
  Each service publishes events, other services react
  Services are choreographed by the events they receive

  Order Service → OrderCreated event
  Payment Service reacts → PaymentProcessed event
  Inventory Service reacts → InventoryReserved event
  Shipping Service reacts → ShipmentScheduled event

  PROS: simple, loose coupling, no single point of failure
  CONS: complex to trace/debug, easy to create "spaghetti events"

ORCHESTRATION (centralized coordinator):
  Saga Orchestrator tells each service what to do
  Orchestrator tracks state, handles failures

  Orchestrator → call Payment Service → success
  Orchestrator → call Inventory Service → success
  Orchestrator → call Shipping Service → FAILS
  Orchestrator → compensate: call Inventory to release, Payment to refund

  PROS: clearer flow, easier to monitor, centralized logic
  CONS: orchestrator can become complex, potential SPOF
```

## 5.2 Choreography-Based Saga

```java
// ── CHOREOGRAPHY SAGA: Create Order ──
// Services communicate via events (Kafka)

// STEP 1: Order Service creates order and emits event
@Service
public class OrderService {

    @Transactional
    public Order createOrder(CreateOrderCommand cmd) {
        Order order = Order.builder()
            .customerId(cmd.getCustomerId())
            .items(cmd.getItems())
            .status(OrderStatus.PENDING)
            .totalAmount(calculateTotal(cmd.getItems()))
            .build();
        order = orderRepository.save(order);

        // Publish event AFTER local transaction commits:
        kafkaTemplate.send("order.created", order.getId().toString(),
            new OrderCreatedEvent(
                order.getId(),
                order.getCustomerId(),
                order.getItems(),
                order.getTotalAmount()
            ));
        return order;
    }

    // COMPENSATION: called when downstream step fails
    @KafkaListener(topics = "payment.failed")
    public void onPaymentFailed(PaymentFailedEvent event) {
        Order order = orderRepository.findById(event.getOrderId()).orElseThrow();
        order.setStatus(OrderStatus.PAYMENT_FAILED);
        order.setFailureReason(event.getReason());
        orderRepository.save(order);

        // Notify customer:
        kafkaTemplate.send("order.cancelled", order.getId().toString(),
            new OrderCancelledEvent(order.getId(), "Payment failed: " + event.getReason()));
    }

    @KafkaListener(topics = "inventory.reservation.failed")
    public void onInventoryFailed(InventoryReservationFailedEvent event) {
        Order order = orderRepository.findById(event.getOrderId()).orElseThrow();
        order.setStatus(OrderStatus.INVENTORY_FAILED);
        orderRepository.save(order);

        // Compensate: refund payment
        kafkaTemplate.send("payment.refund.requested",
            new RefundRequestedEvent(order.getId(), order.getTotalAmount()));
    }
}

// STEP 2: Payment Service reacts to OrderCreated
@Service
public class PaymentService {

    @KafkaListener(topics = "order.created", groupId = "payment-service")
    public void handleOrderCreated(OrderCreatedEvent event) {
        try {
            Payment payment = processPayment(
                event.getCustomerId(),
                event.getOrderId(),
                event.getTotalAmount()
            );

            kafkaTemplate.send("payment.processed",
                new PaymentProcessedEvent(event.getOrderId(), payment.getId()));

        } catch (InsufficientFundsException e) {
            kafkaTemplate.send("payment.failed",
                new PaymentFailedEvent(event.getOrderId(), e.getMessage()));
        }
    }

    @KafkaListener(topics = "payment.refund.requested")
    public void handleRefundRequest(RefundRequestedEvent event) {
        refundPayment(event.getOrderId(), event.getAmount());
        kafkaTemplate.send("payment.refunded",
            new PaymentRefundedEvent(event.getOrderId()));
    }
}

// STEP 3: Inventory Service reacts to PaymentProcessed
@Service
public class InventoryService {

    @KafkaListener(topics = "payment.processed", groupId = "inventory-service")
    public void handlePaymentProcessed(PaymentProcessedEvent event) {
        try {
            reserveInventory(event.getOrderId());
            kafkaTemplate.send("inventory.reserved",
                new InventoryReservedEvent(event.getOrderId()));
        } catch (InsufficientStockException e) {
            kafkaTemplate.send("inventory.reservation.failed",
                new InventoryReservationFailedEvent(event.getOrderId(), e.getMessage()));
        }
    }

    @KafkaListener(topics = "order.cancelled")  // compensation
    public void handleOrderCancelled(OrderCancelledEvent event) {
        releaseReservation(event.getOrderId());
    }
}
```

## 5.3 Orchestration-Based Saga

```java
// ── ORCHESTRATION SAGA using Temporal.io or simple state machine ──

@Service
public class CreateOrderSagaOrchestrator {

    // Saga state stored in DB (resumable after crash!)
    @Entity
    @Table(name = "saga_instances")
    class SagaInstance {
        @Id UUID sagaId;
        String orderId;
        @Enumerated(EnumType.STRING)
        SagaStatus status;
        String currentStep;
        String paymentId;
        boolean inventoryReserved;
        LocalDateTime createdAt;
        String failureReason;
    }

    public void startSaga(CreateOrderCommand cmd) {
        // 1. Create local order
        Order order = orderRepository.save(buildOrder(cmd));

        // 2. Create saga instance
        SagaInstance saga = new SagaInstance();
        saga.setSagaId(UUID.randomUUID());
        saga.setOrderId(order.getId().toString());
        saga.setStatus(SagaStatus.STARTED);
        saga.setCurrentStep("PAYMENT");
        sagaRepository.save(saga);

        // 3. Execute first step
        executePaymentStep(saga, order);
    }

    private void executePaymentStep(SagaInstance saga, Order order) {
        saga.setCurrentStep("PAYMENT");
        sagaRepository.save(saga);

        paymentService.charge(
            order.getCustomerId(),
            order.getTotalAmount(),
            saga.getSagaId().toString()   // correlation ID for callback!
        );
        // Async: payment service will call back with result
    }

    // Called by Payment Service (via event or direct call)
    @Transactional
    public void onPaymentResult(String sagaId, boolean success, String paymentId, String reason) {
        SagaInstance saga = sagaRepository.findById(UUID.fromString(sagaId)).orElseThrow();

        if (!success) {
            handlePaymentFailure(saga, reason);
            return;
        }

        saga.setPaymentId(paymentId);
        saga.setCurrentStep("INVENTORY");
        sagaRepository.save(saga);

        // Execute next step:
        executeInventoryStep(saga);
    }

    private void executeInventoryStep(SagaInstance saga) {
        Order order = orderRepository.findById(UUID.fromString(saga.getOrderId())).orElseThrow();

        try {
            inventoryService.reserve(order.getItems(), saga.getSagaId().toString());
        } catch (Exception e) {
            onInventoryResult(saga.getSagaId().toString(), false, e.getMessage());
        }
    }

    @Transactional
    public void onInventoryResult(String sagaId, boolean success, String reason) {
        SagaInstance saga = sagaRepository.findById(UUID.fromString(sagaId)).orElseThrow();

        if (!success) {
            handleInventoryFailure(saga, reason);
            return;
        }

        saga.setInventoryReserved(true);
        saga.setStatus(SagaStatus.COMPLETED);
        saga.setCurrentStep("COMPLETED");
        sagaRepository.save(saga);

        // Confirm order:
        Order order = orderRepository.findById(UUID.fromString(saga.getOrderId())).orElseThrow();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
    }

    // COMPENSATION FLOW:
    private void handleInventoryFailure(SagaInstance saga, String reason) {
        saga.setStatus(SagaStatus.COMPENSATING);
        saga.setCurrentStep("COMPENSATE_PAYMENT");
        saga.setFailureReason(reason);
        sagaRepository.save(saga);

        // Refund payment:
        paymentService.refund(saga.getPaymentId(), saga.getSagaId().toString());
    }

    private void handlePaymentFailure(SagaInstance saga, String reason) {
        saga.setStatus(SagaStatus.FAILED);
        saga.setFailureReason(reason);
        sagaRepository.save(saga);

        Order order = orderRepository.findById(UUID.fromString(saga.getOrderId())).orElseThrow();
        order.setStatus(OrderStatus.PAYMENT_FAILED);
        orderRepository.save(order);
    }
}
```

---

# 6. Event-Driven Architecture

## 6.1 Event Types

```java
// ── DOMAIN EVENTS (things that happened) ──
// Past tense! Immutable facts.
public record OrderConfirmedEvent(
    String eventId,            // UUID, unique per event
    String orderId,
    String customerId,
    List<OrderLineDto> lines,
    MoneyDto total,
    Instant occurredAt
) implements DomainEvent {}

// ── INTEGRATION EVENTS (cross-service) ──
// Published to message broker for other services to consume
// May differ from domain event (shape for integration vs internal)

// ── COMMANDS (requests to do something) ──
// Imperative, may be rejected
public record ReserveInventoryCommand(
    String orderId,
    List<ItemDto> items,
    String correlationId
) {}

// ── QUERIES (read requests) ──
// Should not change state

// EVENT SOURCING EVENTS (store state as events):
// Entity state = replay of all events in sequence
```

## 6.2 Outbox Pattern

```java
// PROBLEM: "Dual Write" — how to atomically:
//   1. Save to database
//   2. Publish to Kafka/RabbitMQ
// If app crashes between 1 and 2 → inconsistency!

// SOLUTION: Outbox Pattern
// Write event to SAME database as business data (atomic!)
// Separate process reads outbox → publishes to broker

// ── IMPLEMENTATION ──
@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
    @Id
    @GeneratedValue
    UUID id;

    String aggregateType;    // "Order"
    String aggregateId;      // orderId
    String eventType;        // "OrderConfirmed"

    @Column(columnDefinition = "jsonb")
    String payload;          // serialized event

    @Enumerated(EnumType.STRING)
    OutboxStatus status;     // PENDING, PUBLISHED, FAILED

    LocalDateTime createdAt;
    LocalDateTime publishedAt;
    int retryCount;
}

@Service
@Transactional
public class OrderService {

    public Order confirmOrder(String orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.confirm();
        orderRepository.save(order);

        // Save event to SAME transaction → atomic!
        OutboxEvent outboxEvent = new OutboxEvent();
        outboxEvent.setAggregateType("Order");
        outboxEvent.setAggregateId(orderId);
        outboxEvent.setEventType("OrderConfirmed");
        outboxEvent.setPayload(objectMapper.writeValueAsString(
            new OrderConfirmedEvent(order.getId(), order.getCustomerId(), ...)));
        outboxEvent.setStatus(OutboxStatus.PENDING);
        outboxEventRepository.save(outboxEvent);

        // At this point: BOTH order and outbox event saved atomically!
        return order;
        // Even if Kafka is down, event is in outbox DB safely
    }
}

// ── OUTBOX PUBLISHER (separate process) ──
@Component
public class OutboxEventPublisher {

    @Scheduled(fixedDelay = 1000)  // poll every second
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pending = outboxRepository.findTop100ByStatusOrderByCreatedAtAsc(
            OutboxStatus.PENDING);

        for (OutboxEvent event : pending) {
            try {
                kafkaTemplate.send(
                    topicFor(event.getEventType()),
                    event.getAggregateId(),
                    event.getPayload()
                ).get(5, TimeUnit.SECONDS);  // wait for ack

                event.setStatus(OutboxStatus.PUBLISHED);
                event.setPublishedAt(LocalDateTime.now());
            } catch (Exception e) {
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus(OutboxStatus.FAILED);
                    alertService.notify("Outbox event failed after 5 retries: " + event.getId());
                }
            }
            outboxRepository.save(event);
        }
    }
}

// ALTERNATIVE: Debezium CDC (Change Data Capture)
// Reads DB transaction log (WAL/binlog)
// Publishes outbox table changes to Kafka automatically
// No polling needed! Real-time, transactional
```

---

# 7. CQRS in Microservices

## 7.1 CQRS Pattern

```java
// CQRS = Command Query Responsibility Segregation
// Separate write model (commands) from read model (queries)
// Different services, different databases for reads vs writes

// ── WRITE SERVICE (Command side) ──
@Service
public class OrderCommandService {

    @Transactional
    public OrderId placeOrder(PlaceOrderCommand cmd) {
        // Validate with domain aggregate:
        Order order = Order.create(cmd.getCustomerId(), cmd.getItems());
        orderRepository.save(order);

        // Publish event → read model will be updated asynchronously:
        eventPublisher.publish(new OrderPlacedEvent(order.getId(), ...));
        return order.getId();
    }
}

// ── READ SERVICE (Query side) ──
// Completely separate database (optimized for reads)
// Denormalized, pre-computed views

@Service
public class OrderQueryService {

    // Read from denormalized read store (e.g., Elasticsearch):
    public List<OrderSummaryView> getOrdersByCustomer(String customerId, int page, int size) {
        return orderSearchRepository.findByCustomerId(customerId,
            PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public OrderDetailView getOrderDetail(String orderId) {
        return orderDetailRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
    }
}

// ── EVENT HANDLER (updates read model) ──
@Service
public class OrderProjection {

    @KafkaListener(topics = "order.placed")
    public void onOrderPlaced(OrderPlacedEvent event) {
        // Create/update read model:
        OrderSummaryView view = new OrderSummaryView(
            event.getOrderId(),
            event.getCustomerId(),
            event.getCustomerName(),   // denormalized!
            event.getTotalAmount(),
            "PENDING",
            event.getCreatedAt()
        );
        orderViewRepository.save(view);   // save to read DB (Elasticsearch, Cassandra, etc.)
    }

    @KafkaListener(topics = "order.confirmed")
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        orderViewRepository.updateStatus(event.getOrderId(), "CONFIRMED");
    }
}

// ── EVENTUAL CONSISTENCY ──
// Read model may be slightly behind write model
// User places order → immediately visible in write DB
// Read model: 100-500ms delay (Kafka processing)
// Solution: return orderId immediately, client polls or uses WebSocket
```

---

# 8. Distributed Tracing & Observability

## 8.1 The 3 Pillars

```
OBSERVABILITY = Metrics + Logs + Traces

METRICS (what's happening):
  - Request count, error rate, latency percentiles
  - CPU, memory, GC stats
  - Business metrics (orders per minute, revenue)
  - Tool: Prometheus + Grafana

LOGS (what happened):
  - Structured logs (JSON format)
  - Correlation ID across services
  - Tool: ELK Stack (Elasticsearch + Logstash + Kibana), Loki + Grafana

DISTRIBUTED TRACES (how it happened):
  - Track request across multiple services
  - Visualize latency at each service hop
  - Find bottleneck: which service is slow?
  - Tool: Jaeger, Zipkin, AWS X-Ray
```

## 8.2 Spring Micrometer Tracing (Sleuth successor)

```java
// Spring Boot 3: spring-boot-starter-actuator + micrometer-tracing-bridge-otel
// + opentelemetry-exporter-otlp (for Jaeger/Zipkin)

// application.yml:
```

```yaml
management:
  tracing:
    sampling:
      probability: 1.0    # sample 100% in dev, 0.1 (10%) in prod
  otlp:
    tracing:
      endpoint: http://jaeger:4318/v1/traces   # Jaeger OTLP endpoint

logging:
  pattern:
    correlation: "[${spring.application.name:},traceId=%mdc{traceId:-},spanId=%mdc{spanId:-}]"
```

```java
// Trace context AUTOMATICALLY propagated through:
// - Feign clients
// - RestTemplate (@LoadBalanced)
// - WebClient
// - @Async methods (with configuration)
// - Kafka producers/consumers (W3C TraceContext propagation)

// Manual span creation:
@Service
public class OrderService {

    @Autowired
    Tracer tracer;

    public Order createOrder(CreateOrderCommand cmd) {
        Span parentSpan = tracer.currentSpan();

        // Create child span for specific operation:
        Span dbSpan = tracer.nextSpan().name("db.order.save").start();
        try (Tracer.SpanInScope scope = tracer.withSpan(dbSpan)) {
            dbSpan.tag("order.customerId", cmd.getCustomerId());
            Order order = orderRepository.save(buildOrder(cmd));
            dbSpan.tag("order.id", order.getId().toString());
            return order;
        } finally {
            dbSpan.end();
        }
    }
}

// Structured logging with trace context:
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    public PaymentResult charge(ChargeRequest request) {
        // TraceId automatically in MDC → appears in every log line!
        log.info("Processing payment orderId={} amount={}",
            request.getOrderId(), request.getAmount());

        try {
            // MDC auto-populated with traceId, spanId
            PaymentResult result = gateway.charge(request);
            log.info("Payment success paymentId={} orderId={}",
                result.getPaymentId(), request.getOrderId());
            return result;
        } catch (Exception e) {
            log.error("Payment failed orderId={} error={}",
                request.getOrderId(), e.getMessage(), e);
            throw e;
        }
    }
}
// Log output:
// [payment-service,traceId=abc123def456,spanId=789012] INFO - Processing payment orderId=123 amount=50000
// [payment-service,traceId=abc123def456,spanId=789012] INFO - Payment success paymentId=pay_xyz orderId=123
// Same traceId across all services! Find all logs for one request!
```

---

# 9. Data Management Patterns

## 9.1 Database per Service

```
RULE: Each microservice has its OWN database
  No sharing of database between services!

WHY:
  Services can use different DB types (polyglot persistence)
  Independent schema changes (no cross-service coordination)
  Independent scaling of data tier
  Fault isolation (one DB down doesn't affect others)

DATABASE CHOICES BY SERVICE:
  Order Service:     PostgreSQL (ACID, relational, audit trail)
  Product Catalog:   MongoDB (flexible schema, rich queries)
  User Session:      Redis (fast key-value, TTL)
  Search:            Elasticsearch (full-text, faceted search)
  Analytics:         ClickHouse / BigQuery (OLAP, time series)
  Recommendations:   Graph database (Neo4j, relationships)

CHALLENGES:
  No JOIN across services (must do application-level join or denormalize)
  No ACID transactions across services (use Saga!)
  Data duplication (each service stores what it needs)
  Eventual consistency (data sync via events, not immediate)

DATA SYNCHRONIZATION:
  Via Events: Order Service publishes OrderConfirmed → Payment, Inventory react
  Via CDC: Debezium reads DB changes → publishes to Kafka
  Via API calls: on-demand fetch (but increases coupling)
```

## 9.2 API Composition Pattern

```java
// When client needs data from multiple services:
// Instead of N API calls from client → one call to aggregator service

@Service
public class OrderDashboardService {

    @Autowired
    private OrderServiceClient orderClient;

    @Autowired
    private UserServiceClient userClient;

    @Autowired
    private PaymentServiceClient paymentClient;

    // API Composition: single response from multiple services
    public OrderDashboardResponse getDashboard(String orderId) {
        // Call services in parallel (CompletableFuture):
        CompletableFuture<Order> orderFuture =
            CompletableFuture.supplyAsync(() -> orderClient.getOrder(orderId));

        CompletableFuture<UserProfile> userFuture = orderFuture
            .thenCompose(order ->
                CompletableFuture.supplyAsync(() ->
                    userClient.getUser(order.getCustomerId())));

        CompletableFuture<Payment> paymentFuture =
            CompletableFuture.supplyAsync(() -> paymentClient.getByOrderId(orderId));

        // Wait for all:
        CompletableFuture.allOf(orderFuture, paymentFuture).join();

        return new OrderDashboardResponse(
            orderFuture.join(),
            userFuture.join(),
            paymentFuture.join()
        );
    }
}
```

---

# 10. Deployment Patterns

## 10.1 Service Mesh (Istio/Linkerd)

```yaml
# SERVICE MESH: infrastructure layer for service-to-service communication
# Handles: mTLS, observability, traffic management, circuit breaking
# WITHOUT changing application code!

# ── ISTIO VIRTUAL SERVICE (traffic management) ──
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: payment-service
spec:
  hosts:
  - payment-service
  http:
  - match:
    - headers:
        x-canary:
          exact: "true"
    route:
    - destination:
        host: payment-service
        subset: v2                # canary version
      weight: 100
  - route:                        # all other traffic
    - destination:
        host: payment-service
        subset: v1                # stable version
      weight: 90
    - destination:
        host: payment-service
        subset: v2
      weight: 10                  # 10% canary traffic

---
# ── ISTIO DESTINATION RULE ──
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: payment-service
spec:
  host: payment-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    outlierDetection:              # circuit breaker at mesh level!
      consecutiveGatewayErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

---

# 11. Security in Microservices

## 11.1 Authentication & Authorization Patterns

```java
// ── JWT-BASED AUTHENTICATION ──
// 1. Client authenticates with Auth Service → gets JWT
// 2. Client includes JWT in every request
// 3. Each service validates JWT (no network call → fast!)

// API Gateway: validates JWT, adds user context headers
// Downstream services: trust headers from gateway (mTLS ensures only gateway sends them)

// ── SERVICE-TO-SERVICE AUTHENTICATION ──
// Option 1: JWT with service identity
@Service
public class ServiceJwtProvider {

    public String generateServiceToken(String targetService) {
        return Jwts.builder()
            .subject("order-service")               // calling service
            .audience().add(targetService).and()    // target service
            .claim("type", "SERVICE")
            .expiration(new Date(System.currentTimeMillis() + 60_000))  // 1 min
            .signWith(servicePrivateKey, Jwts.SIG.RS256)
            .compact();
    }
}

// Each service validates incoming service tokens:
// audience must match own service name
// type must be "SERVICE"
// issuer must be a known service

// Option 2: mTLS (Mutual TLS) — handled by service mesh (Istio)
// Each service has client certificate
// Istio Pilot distributes and rotates certificates
// No application code changes needed!

// ── ZERO TRUST NETWORKING ──
// Assume any service can be compromised
// Verify every request, even internal ones
// Least privilege: service A can only call specific endpoints of service B
// NetworkPolicy (K8s) + Istio AuthorizationPolicy

// Istio Authorization Policy:
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-service-authz
spec:
  selector:
    matchLabels:
      app: payment-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/order-service"]  # only order-service SA
    to:
    - operation:
        methods: ["POST"]
        paths: ["/api/payments"]
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/admin-service"]
    to:
    - operation:
        methods: ["GET", "POST", "DELETE"]
```

---

# 12. Anti-Patterns & Common Mistakes

## 12.1 Common Microservices Mistakes

```
❌ MISTAKE 1: DISTRIBUTED MONOLITH
  Services that are tightly coupled via synchronous calls
  Service A → Service B → Service C → Service D (synchronous chain!)
  One failure cascades through entire chain
  Any deploy requires coordinating all services
  
  FIX: Async events for non-critical flows
       Design for failure (circuit breakers)
       Services should be independently deployable

❌ MISTAKE 2: TOO FINE-GRAINED SERVICES (Nanoservices)
  Service for every function: GetUserService, UpdateEmailService
  100+ services for simple domain
  Network overhead exceeds benefit
  Operational nightmare
  
  FIX: Services around business capabilities, not functions
       "Could be deployed independently?" → if yes, viable service
       Aim for "right-sized" services, not micro for its own sake

❌ MISTAKE 3: SHARED DATABASE
  Two services using same database schema
  "Temporal coupling" via database
  Schema changes break both services
  
  FIX: Strict database per service
       Share via API or events, never via DB!

❌ MISTAKE 4: CHATTY SERVICES (too many fine-grained calls)
  Dashboard: calls 20 services to render one page
  High latency, high failure probability
  
  FIX: API composition layer (BFF - Backend for Frontend)
       Aggregate multiple service calls
       GraphQL federation

❌ MISTAKE 5: SYNCHRONOUS EVERYTHING
  Order placement:
    POST /orders → synchronous call to Payment → sync call to Inventory → sync call to Shipping
  Total latency: 500ms + 300ms + 200ms = 1 second!
  Payment fails → order fails immediately
  
  FIX: Use async for non-critical steps
       Reserve critical path for essential sync steps
       Order confirmed → async payment, inventory, shipping

❌ MISTAKE 6: NO CORRELATION IDs
  Request comes in, spawns calls to 5 services
  Error occurs — which service? Which request?
  Logs scattered across services, no way to trace
  
  FIX: Propagate correlation ID through ALL calls
       Add to Kafka message headers
       Add to HTTP headers (X-Correlation-ID)
       Include in all log statements

❌ MISTAKE 7: IGNORING IDEMPOTENCY
  Network retry sends same command twice
  Order placed twice, payment charged twice!
  
  FIX: All commands must be idempotent
       Use idempotency keys (client-generated UUID)
       Check if already processed before executing
       Return same result for duplicate requests

❌ MISTAKE 8: BREAKING CHANGES IN EVENTS
  Change event schema → all consumers break simultaneously
  No API versioning strategy
  
  FIX: Backward compatible changes only
       Add fields, never remove/rename
       Version events: OrderCreatedV1, OrderCreatedV2
       Consumers handle both versions during migration

❌ MISTAKE 9: MISSING CIRCUIT BREAKERS
  Service A calls Service B directly (no circuit breaker)
  Service B gets slow (1000ms latency)
  Service A threads pile up waiting
  Service A runs out of threads → goes down too
  Cascade failure!
  
  FIX: ALWAYS use circuit breaker for external calls
       Fallback strategies (cached data, default response, queue)
       Bulkhead: separate thread pools per downstream service

❌ MISTAKE 10: PREMATURE MICROSERVICES
  5-person team, simple domain → 15 microservices
  Ops overhead kills productivity
  "We spent more time on infrastructure than features"
  
  FIX: Modular monolith first
       Extract services when you have:
         - Independent scaling needs
         - Different deployment frequencies
         - Team autonomy requirements
         - Clear domain boundaries
```

---

## 📎 Microservices Quick Reference

```
SERVICE DISCOVERY:
  K8s native: Service DNS (payment-service.namespace.svc.cluster.local)
  Client-side: Eureka + Spring Cloud LoadBalancer
  Server-side: ALB/Ingress (no registry SDK needed)

API GATEWAY:
  Single entry point: auth, rate limit, routing, SSL termination
  Spring Cloud Gateway: reactive, filter chain, circuit breaker
  Kong: plugin-based, powerful, production favorite

CIRCUIT BREAKER (Resilience4j):
  CLOSED → failures > threshold → OPEN (fast fail)
  OPEN → timeout → HALF-OPEN (probe requests)
  HALF-OPEN → success → CLOSED (recovered)
  Config: failureRateThreshold, waitDurationInOpenState, slidingWindowSize

SAGA PATTERN (distributed transactions):
  Choreography: event-driven, decentralized, loose coupling
  Orchestration: central coordinator, clearer flow, easier monitoring
  Both: compensating transactions on failure

OUTBOX PATTERN:
  Write event to DB (same transaction as business data)
  Separate publisher reads outbox → sends to Kafka
  Guarantees: event published if-and-only-if business data committed

CQRS:
  Commands: write to normalized DB + publish events
  Queries: read from denormalized read store (updated by events)
  Eventual consistency between write and read models

OBSERVABILITY:
  Metrics: Prometheus + Grafana (latency, error rate, throughput)
  Logs: structured JSON + correlation ID + traceId
  Traces: Jaeger/Zipkin via OpenTelemetry (end-to-end request flow)

KEY PRINCIPLES:
  Database per service (never share DB!)
  Design for failure (circuit breakers, retries, fallbacks)
  Idempotent operations (retries safe)
  Async for loose coupling, sync when immediate response needed
  Propagate correlation ID always
  API versioning for event schemas
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Spring Cloud Gateway | <https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/> |
| Spring Cloud LoadBalancer | <https://docs.spring.io/spring-cloud-commons/docs/current/reference/html/#spring-cloud-loadbalancer> |
| Resilience4j | <https://resilience4j.readme.io/docs/getting-started> |
| Resilience4j Spring Boot | <https://resilience4j.readme.io/docs/getting-started-3> |
| Micrometer Tracing | <https://micrometer.io/docs/tracing> |
| Netflix Eureka | <https://github.com/Netflix/eureka/wiki> |
| Saga Pattern | <https://microservices.io/patterns/data/saga.html> |
| Outbox Pattern | <https://microservices.io/patterns/data/transactional-outbox.html> |
| Microservices.io Patterns | <https://microservices.io/patterns/> |
| Istio | <https://istio.io/latest/docs/> |
| OpenTelemetry Java | <https://opentelemetry.io/docs/instrumentation/java/> |
| Building Microservices (Sam Newman) | <https://samnewman.io/books/building_microservices_2nd_edition/> |
