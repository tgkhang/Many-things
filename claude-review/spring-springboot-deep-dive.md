# 🌱 Spring & Spring Boot — Complete Deep Dive
> Từ core concepts đến production-ready application

> 📖 Spring Docs: https://docs.spring.io/spring-framework/docs/current/reference/html/
> 📖 Spring Boot Docs: https://docs.spring.io/spring-boot/docs/current/reference/html/

---

## 📚 Table of Contents

1. [Spring Framework Overview](#1-spring-framework-overview)
2. [IoC Container & Dependency Injection](#2-ioc-container--dependency-injection)
3. [Bean Lifecycle](#3-bean-lifecycle)
4. [Spring Core Annotations](#4-spring-core-annotations)
5. [Spring Boot — Auto Configuration](#5-spring-boot--auto-configuration)
6. [Spring MVC — REST API](#6-spring-mvc--rest-api)
7. [Spring Data JPA](#7-spring-data-jpa)
8. [Spring Security](#8-spring-security)
9. [Spring AOP](#9-spring-aop)
10. [Configuration & Profiles](#10-configuration--profiles)
11. [Exception Handling](#11-exception-handling)
12. [Testing](#12-testing)
13. [Common Patterns & Best Practices](#13-common-patterns--best-practices)

---

# 1. Spring Framework Overview

## 1.1 Tại sao cần Spring?

Trước Spring, Java Enterprise (J2EE) cực kỳ phức tạp:

```java
// KHÔNG có Spring — tự wiring mọi thứ bằng tay
public class OrderController {
    // Tự tạo dependencies, tự quản lý lifecycle
    private DataSource dataSource = new OracleDataSource(...);
    private TransactionManager txManager = new JdbcTransactionManager(dataSource);
    private OrderRepository repo = new OrderRepositoryImpl(dataSource, txManager);
    private EmailService email = new SmtpEmailService("smtp.gmail.com", 587, ...);
    private PaymentService payment = new StripePaymentService("sk_live_...");
    private OrderService service = new OrderService(repo, email, payment);
    // Còn phải tự quản lý transaction, exception handling, logging...
}

// CÓ Spring — khai báo, Spring lo phần còn lại
@RestController
public class OrderController {
    private final OrderService orderService; // Spring inject tự động

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }
}
```

## 1.2 Spring Ecosystem

```
Spring Framework (Core)
├── Core Container     → IoC, DI, Bean management
├── Spring MVC         → Web, REST API
├── Spring Data        → Database access (JPA, MongoDB, Redis...)
├── Spring Security    → Authentication, Authorization
├── Spring AOP         → Aspect-Oriented Programming
├── Spring Test        → Testing utilities
└── Spring Boot        → Auto-configuration, opinionated setup

Spring Boot = Spring Framework + Starter POMs + Auto-Configuration
           → Convention over Configuration
```

## 1.3 Spring Boot vs Spring Framework

| | Spring Framework | Spring Boot |
|---|---|---|
| Configuration | Tay (XML hoặc Java Config) | Tự động (Auto-config) |
| Server | Deploy WAR lên Tomcat ngoài | Embedded Tomcat/Jetty/Undertow |
| Dependencies | Tự chọn từng version | Starter POMs quản lý versions |
| Boilerplate | Nhiều | Gần như không có |
| Production | Tự setup | Actuator sẵn sàng |

---

# 2. IoC Container & Dependency Injection

> 📖 https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans

## 2.1 IoC — Inversion of Control là gì?

**Không có IoC** (mày kiểm soát object creation):
```java
// Mày tạo → mày quản lý
OrderService service = new OrderService(
    new OrderRepositoryImpl(dataSource),
    new EmailServiceImpl(mailConfig),
    new PaymentServiceImpl(apiKey)
);
```

**Có IoC** (Container kiểm soát object creation):
```java
// Mày chỉ khai báo cần gì — Spring tạo và inject cho mày
@Service
public class OrderService {
    private final OrderRepository repo;
    private final EmailService email;

    public OrderService(OrderRepository repo, EmailService email) {
        this.repo = repo;       // Spring inject vào đây
        this.email = email;     // Spring inject vào đây
    }
}
// Spring tự biết OrderRepositoryImpl implements OrderRepository
// → tự tạo và truyền vào
```

## 2.2 ApplicationContext — The IoC Container

```
ApplicationContext
├── Đọc config (@ComponentScan, @Bean definitions)
├── Tạo tất cả Bean objects
├── Inject dependencies vào nhau
├── Quản lý lifecycle (init, destroy)
└── Cung cấp services (i18n, events, AOP...)
```

```java
// Cách Spring Boot khởi động container:
@SpringBootApplication
public class MyApp {
    public static void main(String[] args) {
        // Tạo ApplicationContext, scan components, wire everything
        ApplicationContext ctx = SpringApplication.run(MyApp.class, args);

        // Có thể lấy bean thủ công (hiếm khi cần trong thực tế)
        OrderService service = ctx.getBean(OrderService.class);
        OrderService byName = (OrderService) ctx.getBean("orderService");
    }
}
```

## 2.3 Ba kiểu Dependency Injection

```java
// ═══════════════════════════════════════════════════
// TYPE 1: Constructor Injection ← RECOMMENDED
// ═══════════════════════════════════════════════════
@Service
public class OrderService {
    private final OrderRepository repository;   // final ← immutable ✅
    private final EmailService emailService;

    // Nếu chỉ có 1 constructor, @Autowired không cần thiết (Spring 4.3+)
    public OrderService(OrderRepository repository, EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }
}

// WHY best:
// ✅ Dependencies bắt buộc và rõ ràng
// ✅ Dùng được với final fields
// ✅ Dễ test (chỉ cần new OrderService(mockRepo, mockEmail))
// ✅ Phát hiện circular dependency sớm (Spring throws exception)

// ═══════════════════════════════════════════════════
// TYPE 2: Setter Injection ← cho optional dependencies
// ═══════════════════════════════════════════════════
@Service
public class NotificationService {
    private SmsService smsService;   // optional dependency

    @Autowired(required = false)     // không bắt buộc
    public void setSmsService(SmsService smsService) {
        this.smsService = smsService;
    }
}

// ═══════════════════════════════════════════════════
// TYPE 3: Field Injection ← AVOID in production
// ═══════════════════════════════════════════════════
@Service
public class BadService {
    @Autowired
    private OrderRepository repository;   // inject qua reflection

    // ❌ Không dùng final
    // ❌ Khó test (cần Spring context hoặc reflection để inject)
    // ❌ Che giấu dependencies — nhìn vào class không thấy ngay
}
```

## 2.4 Qualifier — Khi có nhiều implementations

```java
public interface PaymentGateway {
    boolean charge(String customerId, double amount);
}

@Component("stripe")
public class StripeGateway implements PaymentGateway { ... }

@Component("paypal")
public class PaypalGateway implements PaymentGateway { ... }

// Vấn đề: Spring không biết inject cái nào!
@Service
public class OrderService {
    // ❌ NoUniqueBeanDefinitionException — 2 PaymentGateway beans!
    public OrderService(PaymentGateway gateway) { }

    // ✅ Dùng @Qualifier để chỉ định
    public OrderService(@Qualifier("stripe") PaymentGateway gateway) { }

    // ✅ Hoặc dùng @Primary trên bean muốn dùng mặc định
}

@Primary   // ← dùng cái này khi không có @Qualifier
@Component
public class StripeGateway implements PaymentGateway { ... }
```

---

# 3. Bean Lifecycle

> 📖 https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-factory-lifecycle

## 3.1 Full Lifecycle

```
Container starts
      │
      ▼
1. Instantiation     → Spring gọi constructor
      │
      ▼
2. Dependency        → @Autowired fields/setters được inject
   Injection
      │
      ▼
3. BeanNameAware,    → Spring set các "Aware" interfaces
   ApplicationContextAware...
      │
      ▼
4. BeanPostProcessor → postProcessBeforeInitialization()
   (before init)       (dùng bởi AOP, @Async, etc.)
      │
      ▼
5. @PostConstruct    → custom init logic của mày
      │
      ▼
6. InitializingBean  → afterPropertiesSet()
   .afterPropertiesSet
      │
      ▼
7. @Bean(initMethod) → custom init từ @Bean config
      │
      ▼
8. BeanPostProcessor → postProcessAfterInitialization()
   (after init)
      │
      ▼
  BEAN READY FOR USE  ← tất cả requests đến đây
      │
      ▼  (container shutting down)
9. @PreDestroy       → cleanup trước khi bean bị destroy
      │
      ▼
10. DisposableBean   → destroy()
      │
      ▼
11. @Bean(destroyMethod) → custom cleanup
```

## 3.2 Code Example

```java
@Component
public class DatabaseConnectionPool implements InitializingBean, DisposableBean {

    private final DataSource dataSource;
    private Connection[] pool;

    public DatabaseConnectionPool(DataSource dataSource) {
        this.dataSource = dataSource;
        System.out.println("1. Constructor called");
    }

    // Chạy SAU KHI tất cả dependencies đã được inject
    @PostConstruct
    public void init() {
        System.out.println("2. @PostConstruct — warming up connections");
        pool = new Connection[10];
        for (int i = 0; i < pool.length; i++) {
            pool[i] = dataSource.getConnection();
        }
    }

    // Chạy TRƯỚC KHI bean bị destroy (app shutdown)
    @PreDestroy
    public void cleanup() {
        System.out.println("3. @PreDestroy — closing connections");
        for (Connection conn : pool) {
            conn.close();
        }
    }

    // InitializingBean interface (ít dùng hơn @PostConstruct)
    @Override
    public void afterPropertiesSet() { }

    // DisposableBean interface (ít dùng hơn @PreDestroy)
    @Override
    public void destroy() { }
}
```

## 3.3 Bean Scopes

```java
// ═══════════════════════════════
// SINGLETON (default) — 1 instance cho toàn app
// ═══════════════════════════════
@Component  // mặc định là singleton
@Scope("singleton")  // explicit
public class UserService { }
// Spring tạo 1 lần → tái sử dụng mãi
// ⚠️ KHÔNG nên có mutable state trong singleton!

// ═══════════════════════════════
// PROTOTYPE — new instance mỗi lần inject/getBean
// ═══════════════════════════════
@Component
@Scope("prototype")
public class ShoppingCart {
    private List<Item> items = new ArrayList<>();
    // Mỗi user cần cart riêng → prototype
}

// ═══════════════════════════════
// WEB SCOPES (chỉ trong web app)
// ═══════════════════════════════
@Component
@RequestScope   // new instance mỗi HTTP request
public class RequestContext { }

@Component
@SessionScope   // 1 instance per HTTP session
public class UserSession { }

@Component
@ApplicationScope  // giống singleton nhưng trong WebApplicationContext
public class AppStats { }

// ⚠️ Vấn đề: inject prototype vào singleton
@Component
public class OrderService {
    @Autowired
    private ShoppingCart cart;  // ❌ inject 1 lần lúc startup → mãi dùng 1 cart!

    // ✅ Fix: dùng ObjectProvider hoặc @Lookup
    @Autowired
    private ObjectProvider<ShoppingCart> cartProvider;

    public void process() {
        ShoppingCart cart = cartProvider.getObject();  // new instance mỗi lần
    }
}
```

---

# 4. Spring Core Annotations

> 📖 https://docs.spring.io/spring-framework/docs/current/reference/html/core.html

## 4.1 Stereotype Annotations

```java
// Tất cả đều tạo Bean — khác nhau về semantic và AOP processing

@Component          // Generic bean — dùng khi không fit các loại dưới
@Repository         // Data access layer — thêm exception translation (SQLException → DataAccessException)
@Service            // Business logic layer — semantic annotation
@Controller         // Spring MVC controller — handles HTTP
@RestController     // = @Controller + @ResponseBody — REST API
@Configuration      // Config class — chứa @Bean methods
```

```java
// @Repository — auto exception translation
@Repository
public class UserRepositoryImpl implements UserRepository {
    @Override
    public User findById(Long id) {
        // SQLException tự động được wrap thành DataAccessException
        // → code tầng trên không cần handle JDBC-specific exceptions
    }
}

// @Service — thuần semantic
@Service
@Transactional  // thường đặt ở đây
public class UserService {
    public User createUser(CreateUserRequest request) {
        // business logic
    }
}
```

## 4.2 Component Scanning

```java
// Spring Boot tự động scan tất cả packages dưới @SpringBootApplication
@SpringBootApplication  // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class MyApp {
    public static void main(String[] args) {
        SpringApplication.run(MyApp.class, args);
    }
}

// Custom scan config
@ComponentScan(
    basePackages = {"com.myapp.service", "com.myapp.repository"},
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ANNOTATION,
        classes = Deprecated.class
    )
)
```

## 4.3 @Bean — Manual Bean Declaration

```java
@Configuration
public class AppConfig {

    // Dùng @Bean khi:
    // - Class đến từ third-party library (không thể add @Component)
    // - Cần custom initialization logic
    // - Cần conditional bean creation

    @Bean   // method name = bean name (mặc định)
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    @Bean("myDataSource")   // custom bean name
    @Primary
    public DataSource primaryDataSource(
            @Value("${db.url}") String url,
            @Value("${db.username}") String username,
            @Value("${db.password}") String password) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(20);
        return new HikariDataSource(config);
    }

    @Bean
    @ConditionalOnProperty(name = "feature.email.enabled", havingValue = "true")
    public EmailService emailService() {
        return new SmtpEmailService();  // chỉ tạo khi config có feature.email.enabled=true
    }
}
```

---

# 5. Spring Boot — Auto Configuration

> 📖 https://docs.spring.io/spring-boot/docs/current/reference/html/using.html#using.auto-configuration

## 5.1 Cơ chế Auto-Configuration

```
spring-boot-autoconfigure.jar
└── META-INF/
    └── spring/
        └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
            (danh sách hàng trăm AutoConfiguration classes)

Khi app start:
1. Spring Boot đọc file imports này
2. Check từng AutoConfiguration class có @Conditional... thỏa mãn không
3. Nếu có → apply configuration đó tự động
```

```java
// Ví dụ: DataSourceAutoConfiguration (simplified)
@AutoConfiguration
@ConditionalOnClass({ DataSource.class, EmbeddedDatabaseType.class })
@ConditionalOnMissingBean(type = "io.r2dbc.spi.ConnectionFactory")
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    // ← chỉ tạo nếu mày KHÔNG tự định nghĩa DataSource bean
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }
}
// → Nếu mày thêm spring-boot-starter-data-jpa vào pom.xml
// → DataSource được tạo tự động từ application.properties
// → Mày override bằng cách định nghĩa @Bean DataSource của riêng
```

## 5.2 Spring Boot Starters

```xml
<!-- pom.xml — Starters bundle related dependencies + auto-config -->
<dependencies>
    <!-- Web API: Tomcat + Spring MVC + Jackson -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- JPA: Hibernate + Spring Data JPA + JDBC -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- Security: Spring Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- Validation: Hibernate Validator (Bean Validation) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Test: JUnit 5 + Mockito + MockMvc -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>

    <!-- Actuator: health, metrics, info endpoints -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>

    <!-- Database driver (not a starter but commonly used) -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

## 5.3 application.properties / application.yml

```yaml
# application.yml — preferred over .properties for readability

spring:
  application:
    name: my-service

  # Database
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: postgres
    password: secret
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000

  # JPA / Hibernate
  jpa:
    hibernate:
      ddl-auto: validate     # none | validate | update | create | create-drop
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

  # Server
server:
  port: 8080
  servlet:
    context-path: /api

# Custom properties
app:
  jwt:
    secret: ${JWT_SECRET}         # từ environment variable
    expiration: 86400000          # 24h in ms
  mail:
    from: noreply@myapp.com

# Logging
logging:
  level:
    root: INFO
    com.myapp: DEBUG
    org.hibernate.SQL: DEBUG
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

```java
// Đọc custom properties
@Component
@ConfigurationProperties(prefix = "app.jwt")  // bind toàn bộ group
public class JwtProperties {
    private String secret;
    private long expiration;
    // getters + setters (hoặc dùng @ConstructorBinding với record)
}

@Service
public class JwtService {
    private final JwtProperties jwtProps;
    // Spring inject JwtProperties bean đã bind values

    public JwtService(JwtProperties jwtProps) {
        this.jwtProps = jwtProps;
    }
}

// Hoặc đọc từng giá trị lẻ
@Value("${app.jwt.secret}")
private String jwtSecret;

@Value("${app.mail.from:noreply@default.com}")  // default value sau dấu :
private String mailFrom;
```

---

# 6. Spring MVC — REST API

> 📖 https://docs.spring.io/spring-framework/docs/current/reference/html/web.html

## 6.1 Request Handling

```java
@RestController
@RequestMapping("/api/v1/users")  // base path cho tất cả methods trong class
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/v1/users
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        Page<UserResponse> users = userService.findAll(page, size, search);
        return ResponseEntity.ok(users.getContent());
    }

    // GET /api/v1/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/v1/users
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @RequestBody @Valid CreateUserRequest request) {
        UserResponse created = userService.create(request);
        URI location = URI.create("/api/v1/users/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }

    // PUT /api/v1/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody @Valid UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    // PATCH /api/v1/users/{id}
    @PatchMapping("/{id}")
    public ResponseEntity<UserResponse> patchUser(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(userService.patch(id, updates));
    }

    // DELETE /api/v1/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Request Header
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(userService.getFromToken(token));
    }
}
```

## 6.2 Request / Response DTOs với Validation

```java
// DTO — Data Transfer Object
// KHÔNG dùng Entity trực tiếp trong Controller!

// Request DTO
public record CreateUserRequest(
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    String name,

    @NotBlank
    @Email(message = "Invalid email format")
    String email,

    @NotBlank
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
        message = "Password must have uppercase, lowercase, digit, min 8 chars"
    )
    String password,

    @NotNull
    @Min(value = 18, message = "Must be 18+")
    @Max(value = 120)
    Integer age,

    @Valid   // validate nested object
    @NotNull
    AddressRequest address
) { }

public record AddressRequest(
    @NotBlank String street,
    @NotBlank String city,
    @NotBlank @Size(min = 2, max = 2) String countryCode
) { }

// Response DTO
public record UserResponse(
    Long id,
    String name,
    String email,
    int age,
    LocalDateTime createdAt
) {
    // Static factory — convert từ Entity sang DTO
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getAge(),
            user.getCreatedAt()
        );
    }
}
```

## 6.3 ResponseEntity — Full Control

```java
// ResponseEntity<T> = HTTP status + headers + body
// Nên dùng khi cần control response đầy đủ

ResponseEntity.ok(body)                    // 200 OK
ResponseEntity.created(location).body(b)  // 201 Created + Location header
ResponseEntity.noContent().build()         // 204 No Content
ResponseEntity.notFound().build()          // 404 Not Found
ResponseEntity.badRequest().body(error)    // 400 Bad Request

// Custom:
return ResponseEntity
    .status(HttpStatus.PARTIAL_CONTENT)    // 206
    .header("X-Total-Count", "100")
    .header("Content-Type", "application/json")
    .body(data);
```

---

# 7. Spring Data JPA

> 📖 https://docs.spring.io/spring-data/jpa/docs/current/reference/html/

## 7.1 Entity

```java
import jakarta.persistence.*;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_users_email", columnList = "email", unique = true),
        @Index(name = "idx_users_created_at", columnList = "created_at")
    }
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // auto-increment
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)     // lưu "ACTIVE" thay vì 0
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @CreationTimestamp               // Hibernate tự set khi insert
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp                 // Hibernate tự update khi update
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // One-to-Many: 1 User có nhiều Orders
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();

    // Many-to-One: nhiều User thuộc 1 Department
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    // Many-to-Many
    @ManyToMany
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
}
```

## 7.2 Repository

```java
// JpaRepository<Entity, ID> cung cấp sẵn:
// save, saveAll, findById, findAll, delete, deleteById, count, existsById...

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ── Derived Query Methods (Spring tự generate SQL từ method name) ──
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByStatus(UserStatus status);
    List<User> findByNameContainingIgnoreCase(String name);
    List<User> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<User> findByDepartmentNameAndStatus(String deptName, UserStatus status);
    long countByStatus(UserStatus status);
    void deleteByEmail(String email);

    // Sorting và Paging
    List<User> findByStatus(UserStatus status, Sort sort);
    Page<User> findByStatus(UserStatus status, Pageable pageable);

    // ── @Query — JPQL (Java Persistence Query Language) ──
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.status = 'ACTIVE'")
    Optional<User> findActiveByEmail(@Param("email") String email);

    // JPQL với JOIN FETCH — tránh N+1 problem
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders WHERE u.id = :id")
    Optional<User> findByIdWithOrders(@Param("id") Long id);

    // ── @Query với Native SQL ──
    @Query(value = "SELECT * FROM users WHERE email ILIKE %:search%", nativeQuery = true)
    List<User> searchByEmail(@Param("search") String search);

    // ── Modifying queries ──
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.status = :status WHERE u.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") UserStatus status);

    // ── Projections — chỉ lấy một số fields ──
    @Query("SELECT u.id AS id, u.name AS name, u.email AS email FROM User u")
    List<UserSummary> findAllSummaries();
}

// Interface-based projection
public interface UserSummary {
    Long getId();
    String getName();
    String getEmail();
}
```

## 7.3 @Transactional

```java
// 📖 https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#transaction

@Service
@Transactional(readOnly = true)   // default cho toàn service: read-only = tối ưu performance
public class OrderService {

    @Transactional   // override: read-write cho method này
    public Order createOrder(CreateOrderRequest request) {
        // Mọi thứ trong method này là 1 transaction
        // Nếu bất kỳ exception nào throw → rollback toàn bộ
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new UserNotFoundException(request.getUserId()));

        List<Product> products = productRepository.findAllById(request.getProductIds());
        checkStock(products);      // throws InsufficientStockException → rollback

        Order order = new Order(user, products);
        orderRepository.save(order);

        inventoryService.deductStock(products);   // cùng transaction
        emailService.sendConfirmation(order);      // nếu email fail → rollback order!
        // → cân nhắc dùng @Transactional(noRollbackFor = EmailException.class)

        return order;
    }

    // Propagation — behavior khi gọi transactional method từ transactional method
    @Transactional(propagation = Propagation.REQUIRED)         // default: join existing or create new
    @Transactional(propagation = Propagation.REQUIRES_NEW)     // always create new (suspend existing)
    @Transactional(propagation = Propagation.SUPPORTS)         // join if exists, non-tx if not
    @Transactional(propagation = Propagation.NOT_SUPPORTED)    // always non-tx (suspend existing)
    @Transactional(propagation = Propagation.MANDATORY)        // must exist, else exception
    @Transactional(propagation = Propagation.NEVER)            // must NOT exist, else exception

    // Isolation levels
    @Transactional(isolation = Isolation.READ_COMMITTED)       // default for most DBs
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    @Transactional(isolation = Isolation.SERIALIZABLE)         // strictest

    // ⚠️ Self-invocation problem
    // Gọi @Transactional method từ trong cùng class = KHÔNG hoạt động!
    public void outerMethod() {
        innerMethod();   // ❌ @Transactional bị bỏ qua! (no proxy)
    }

    @Transactional
    public void innerMethod() { }

    // Fix: inject self hoặc move method sang class khác
}
```

## 7.4 N+1 Problem

```java
// N+1 problem — truy vấn không hiệu quả
// 1 query lấy 100 users → 100 queries lấy orders của từng user = 101 queries!

@Entity
public class User {
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)  // LAZY = default
    private List<Order> orders;
}

// ❌ Gây N+1
List<User> users = userRepository.findAll();  // 1 query
for (User u : users) {
    u.getOrders().size();   // N queries (1 per user)!
}

// ✅ Fix 1: JOIN FETCH trong JPQL
@Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders")
List<User> findAllWithOrders();

// ✅ Fix 2: @EntityGraph
@EntityGraph(attributePaths = {"orders", "roles"})
List<User> findByStatus(UserStatus status);

// ✅ Fix 3: @BatchSize — batch loading
@OneToMany
@BatchSize(size = 50)   // load orders 50 cái 1 lúc thay vì 1 cái 1 query
private List<Order> orders;
```

---

# 8. Spring Security

> 📖 https://docs.spring.io/spring-security/reference/index.html

## 8.1 Security Filter Chain

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────────────┐
│              Security Filter Chain                   │
│                                                     │
│  SecurityContextPersistenceFilter (load security context)
│           ↓
│  UsernamePasswordAuthenticationFilter (form login)
│           ↓
│  JwtAuthenticationFilter (custom JWT filter)
│           ↓
│  ExceptionTranslationFilter (401/403 handling)
│           ↓
│  FilterSecurityInterceptor (authorization check)
└─────────────────────────────────────────────────────┘
    │
    ▼
DispatcherServlet → Controller
```

## 8.2 JWT Authentication Setup

```java
// Security Configuration
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // enables @PreAuthorize, @PostAuthorize
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())           // REST API → disable CSRF
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))  // no session
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()           // public
                .requestMatchers("/api/admin/**").hasRole("ADMIN")     // admin only
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .anyRequest().authenticated()                          // rest requires login
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // cost factor 12 (2^12 iterations)
    }
}

// JWT Filter
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(token, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        chain.doFilter(request, response);
    }
}
```

## 8.3 Method-Level Security

```java
@RestController
public class AdminController {

    // @PreAuthorize — kiểm tra TRƯỚC khi method chạy
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllUsers() { ... }

    // SpEL expressions
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public void deleteUser(@PathVariable Long id) { ... }

    // @PostAuthorize — kiểm tra SAU khi method chạy (có thể dùng returnObject)
    @GetMapping("/users/{id}")
    @PostAuthorize("returnObject.ownerId == authentication.principal.id or hasRole('ADMIN')")
    public UserDocument getDocument(@PathVariable Long id) { ... }

    // @Secured — simpler, no SpEL
    @Secured({"ROLE_ADMIN", "ROLE_MANAGER"})
    public void manageUsers() { ... }
}
```

---

# 9. Spring AOP

> 📖 https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop

## 9.1 AOP Concepts

```
AOP = cách tách "cross-cutting concerns" ra khỏi business logic
Cross-cutting concerns = logging, security, transaction, caching, metrics...

Concepts:
- Aspect    : module chứa cross-cutting logic (ví dụ: LoggingAspect)
- Advice    : action thực hiện (Before, After, Around...)
- Pointcut  : expression xác định WHERE advice được apply
- JoinPoint : điểm trong execution (method call, exception...)
- Weaving   : process gắn aspect vào code (Spring dùng proxy-based AOP)
```

## 9.2 Implementing Aspects

```java
@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    // Pointcut expressions
    // execution(* com.myapp.service.*.*(..))  — tất cả methods trong service package
    // @annotation(Loggable)                  — methods có annotation @Loggable
    // within(com.myapp.service.*)             — tất cả methods trong package
    // @within(Service)                        — classes có @Service

    // BEFORE — chạy trước method
    @Before("execution(* com.myapp.service.*.*(..))")
    public void logBefore(JoinPoint jp) {
        log.info("Calling: {}.{}({})",
            jp.getTarget().getClass().getSimpleName(),
            jp.getSignature().getName(),
            Arrays.toString(jp.getArgs()));
    }

    // AFTER RETURNING — chạy sau method (chỉ khi không throw)
    @AfterReturning(
        pointcut = "execution(* com.myapp.service.*.*(..))",
        returning = "result")
    public void logAfterReturning(JoinPoint jp, Object result) {
        log.info("Returned: {}", result);
    }

    // AFTER THROWING — chạy khi method throw exception
    @AfterThrowing(
        pointcut = "execution(* com.myapp.service.*.*(..))",
        throwing = "ex")
    public void logException(JoinPoint jp, Exception ex) {
        log.error("Exception in {}: {}", jp.getSignature().getName(), ex.getMessage());
    }

    // AROUND — full control: chạy trước + sau + handle exception
    @Around("@annotation(com.myapp.annotation.Timed)")
    public Object measureTime(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();   // gọi method thực sự
            long time = System.currentTimeMillis() - start;
            log.info("{} took {}ms", pjp.getSignature().getName(), time);
            return result;
        } catch (Exception e) {
            log.error("Failed after {}ms", System.currentTimeMillis() - start);
            throw e;
        }
    }
}

// Custom annotation cho @Around pointcut
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Timed { }

// Usage
@Service
public class UserService {
    @Timed   // LoggingAspect sẽ đo thời gian method này
    public User createUser(CreateUserRequest req) { ... }
}
```

---

# 10. Configuration & Profiles

> 📖 https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.profiles

## 10.1 Spring Profiles

```yaml
# application.yml — shared config
spring:
  application:
    name: my-service

---
# application-dev.yml — dev environment
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:h2:mem:testdb   # in-memory H2 cho dev
  jpa:
    show-sql: true

logging:
  level:
    com.myapp: DEBUG

---
# application-prod.yml — production
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    show-sql: false

logging:
  level:
    com.myapp: INFO
```

```java
// Activate profile:
// 1. application.properties: spring.profiles.active=dev
// 2. Environment variable: SPRING_PROFILES_ACTIVE=prod
// 3. JVM flag: -Dspring.profiles.active=prod
// 4. Programmatically: SpringApplication.setAdditionalProfiles("dev")

// Profile-specific beans
@Configuration
public class DataSourceConfig {

    @Bean
    @Profile("dev")    // chỉ tạo trong dev
    public DataSource h2DataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }

    @Bean
    @Profile("prod")   // chỉ tạo trong prod
    public DataSource postgresDataSource(DataSourceProperties props) {
        return props.initializeDataSourceBuilder().build();
    }

    @Bean
    @Profile("!prod")  // tất cả trừ prod (dev, staging...)
    public SeedDataRunner seedData() {
        return new SeedDataRunner();
    }
}
```

---

# 11. Exception Handling

> 📖 https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-ann-exceptionhandler

## 11.1 Global Exception Handler

```java
// @RestControllerAdvice = @ControllerAdvice + @ResponseBody
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 404 — Resource not found
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse("NOT_FOUND", ex.getMessage());
    }

    // 400 — Validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
            .forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));
        return new ValidationErrorResponse("VALIDATION_FAILED", errors);
    }

    // 409 — Conflict (duplicate data)
    @ExceptionHandler(DuplicateResourceException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleDuplicate(DuplicateResourceException ex) {
        return new ErrorResponse("CONFLICT", ex.getMessage());
    }

    // 403 — Forbidden
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleForbidden(AccessDeniedException ex) {
        return new ErrorResponse("FORBIDDEN", "You don't have permission");
    }

    // 500 — Catch-all
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleAll(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    }
}

// Error response DTOs
public record ErrorResponse(String code, String message) { }

public record ValidationErrorResponse(
    String code,
    Map<String, String> fieldErrors
) { }

// Custom exceptions
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found with id: " + id);
    }
}

public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
```

---

# 12. Testing

> 📖 https://docs.spring.io/spring-boot/docs/current/reference/html/testing.html

## 12.1 Unit Test (không cần Spring context)

```java
// Test service logic thuần túy — nhanh nhất, không load Spring
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks              // tạo UserService với mocks inject vào
    private UserService userService;

    @Test
    void createUser_success() {
        // Arrange
        CreateUserRequest request = new CreateUserRequest("Khang", "khang@test.com", "Pass1234!", 21, null);
        User savedUser = new User(1L, "Khang", "khang@test.com");

        when(userRepository.existsByEmail("khang@test.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // Act
        UserResponse result = userService.create(request);

        // Assert
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Khang");
        verify(emailService).sendWelcome("khang@test.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_duplicateEmail_throwsException() {
        when(userRepository.existsByEmail("khang@test.com")).thenReturn(true);

        assertThatThrownBy(() ->
            userService.create(new CreateUserRequest("Khang", "khang@test.com", "Pass1234!", 21, null))
        ).isInstanceOf(DuplicateResourceException.class)
         .hasMessageContaining("khang@test.com");

        verify(userRepository, never()).save(any());
    }
}
```

## 12.2 Integration Test (với Spring context)

```java
// Load full Spring context — chậm hơn nhưng test thực tế hơn
@SpringBootTest
@AutoConfigureMockMvc
@Transactional   // rollback sau mỗi test
@ActiveProfiles("test")
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void createUser_returns201() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
            "Khang", "khang@test.com", "Pass1234!", 21, null);

        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Khang"))
            .andExpect(jsonPath("$.email").value("khang@test.com"))
            .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    void createUser_invalidEmail_returns400() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
            "Khang", "not-an-email", "Pass1234!", 21, null);

        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")   // mock authenticated user
    void deleteUser_asAdmin_returns204() throws Exception {
        User user = userRepository.save(new User("Test", "test@test.com"));

        mockMvc.perform(delete("/api/v1/users/" + user.getId()))
            .andExpect(status().isNoContent());
    }
}
```

## 12.3 Repository Test (Slice Test)

```java
// @DataJpaTest — chỉ load JPA layer, dùng H2 in-memory
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager em;  // helper cho setup

    @Test
    void findByEmail_existingUser_returnsUser() {
        // Arrange
        User user = new User("Khang", "khang@test.com");
        em.persistAndFlush(user);

        // Act
        Optional<User> found = userRepository.findByEmail("khang@test.com");

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Khang");
    }

    @Test
    void findByStatus_pagination_works() {
        // Create 25 active users
        IntStream.range(0, 25).forEach(i ->
            em.persist(new User("User" + i, "user" + i + "@test.com")));
        em.flush();

        Page<User> page = userRepository.findByStatus(
            UserStatus.ACTIVE,
            PageRequest.of(0, 10, Sort.by("name"))
        );

        assertThat(page.getContent()).hasSize(10);
        assertThat(page.getTotalElements()).isEqualTo(25);
        assertThat(page.getTotalPages()).isEqualTo(3);
    }
}
```

---

# 13. Common Patterns & Best Practices

## 13.1 Layered Architecture

```
┌────────────────────────────────────────────┐
│           Controller Layer                 │
│  - Nhận HTTP request                       │
│  - Validate input (@Valid)                 │
│  - Delegate sang Service                   │
│  - Format HTTP response                    │
│  - KHÔNG chứa business logic               │
├────────────────────────────────────────────┤
│           Service Layer                    │
│  - Business logic                          │
│  - Transaction management                  │
│  - Gọi repositories                        │
│  - Gọi external services                   │
│  - KHÔNG biết gì về HTTP                   │
├────────────────────────────────────────────┤
│          Repository Layer                  │
│  - Database operations only                │
│  - JPQL / native queries                   │
│  - KHÔNG chứa business logic               │
└────────────────────────────────────────────┘
```

## 13.2 Typical Project Structure

```
src/main/java/com/myapp/
├── MyAppApplication.java          ← entry point
│
├── config/                        ← Spring configs
│   ├── SecurityConfig.java
│   ├── JpaConfig.java
│   └── WebMvcConfig.java
│
├── controller/                    ← HTTP layer
│   ├── UserController.java
│   └── OrderController.java
│
├── service/                       ← business logic
│   ├── UserService.java
│   └── OrderService.java
│
├── repository/                    ← data access
│   ├── UserRepository.java
│   └── OrderRepository.java
│
├── entity/                        ← JPA entities
│   ├── User.java
│   └── Order.java
│
├── dto/                           ← request/response objects
│   ├── request/
│   │   ├── CreateUserRequest.java
│   │   └── CreateOrderRequest.java
│   └── response/
│       ├── UserResponse.java
│       └── OrderResponse.java
│
├── exception/                     ← custom exceptions + handler
│   ├── ResourceNotFoundException.java
│   ├── DuplicateResourceException.java
│   └── GlobalExceptionHandler.java
│
├── security/                      ← security components
│   ├── JwtAuthFilter.java
│   ├── JwtService.java
│   └── UserDetailsServiceImpl.java
│
└── util/                          ← utilities
    └── MappingUtils.java
```

## 13.3 Common Anti-Patterns to Avoid

```java
// ❌ ANTI-PATTERN 1: Business logic trong Controller
@PostMapping("/orders")
public ResponseEntity<?> createOrder(@RequestBody OrderRequest req) {
    // Đừng làm thế này!
    User user = userRepository.findById(req.getUserId()).orElseThrow(...);
    double total = req.getItems().stream().mapToDouble(i -> i.price() * i.qty()).sum();
    Order order = new Order(user, total);
    orderRepository.save(order);
    emailService.send(...);
    return ResponseEntity.ok(order);
}

// ✅ Đúng: delegate hết cho Service
@PostMapping("/orders")
public ResponseEntity<OrderResponse> createOrder(@RequestBody @Valid OrderRequest req) {
    return ResponseEntity.ok(orderService.create(req));
}


// ❌ ANTI-PATTERN 2: Return Entity trực tiếp
@GetMapping("/{id}")
public User getUser(@PathVariable Long id) {
    return userRepository.findById(id).orElseThrow(...);
    // Expose internal structure, có thể leak sensitive data (password hash!)
    // Circular reference khi serialize (User → Orders → User → ...)
}

// ✅ Dùng DTO
@GetMapping("/{id}")
public UserResponse getUser(@PathVariable Long id) {
    return UserResponse.from(userRepository.findById(id).orElseThrow(...));
}


// ❌ ANTI-PATTERN 3: Catch exception rồi không làm gì
@Transactional
public void processOrder(Long id) {
    try {
        order.process();
    } catch (Exception e) {
        log.error("Error");   // swallow exception — caller không biết có lỗi!
    }
}

// ✅ Re-throw hoặc wrap
@Transactional
public void processOrder(Long id) {
    try {
        order.process();
    } catch (PaymentException e) {
        throw new OrderProcessingException("Payment failed for order " + id, e);
    }
}
```

---

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Spring Framework | https://docs.spring.io/spring-framework/docs/current/reference/html/ |
| Spring Boot | https://docs.spring.io/spring-boot/docs/current/reference/html/ |
| Spring Data JPA | https://docs.spring.io/spring-data/jpa/docs/current/reference/html/ |
| Spring Security | https://docs.spring.io/spring-security/reference/index.html |
| Spring MVC | https://docs.spring.io/spring-framework/docs/current/reference/html/web.html |
| Spring AOP | https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop |
| Spring Testing | https://docs.spring.io/spring-boot/docs/current/reference/html/testing.html |
| Spring Profiles | https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.profiles |
| Bean Lifecycle | https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-factory-lifecycle |
| Transaction Mgmt | https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html#transaction |
| Actuator | https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html |
| Auto-Config | https://docs.spring.io/spring-boot/docs/current/reference/html/using.html#using.auto-configuration |

---

*Thứ tự học: IoC/DI → Bean Lifecycle → Spring Boot basics → REST API → JPA → Security → Testing → AOP*
