# 🚀 Spring Boot — Complete Deep Dive
>
> Auto-Configuration, Starters, Actuator, Embedded Server, Testing, Production

---

## 📚 Table of Contents

1. [Spring Boot vs Spring Framework](#1-spring-boot-vs-spring-framework)
2. [Auto-Configuration — Cơ Chế Chi Tiết](#2-auto-configuration--cơ-chế-chi-tiết)
3. [Starters — Dependency Management](#3-starters--dependency-management)
4. [SpringApplication — Khởi Động](#4-springapplication--khởi-động)
5. [Embedded Server](#5-embedded-server)
6. [Configuration & Properties](#6-configuration--properties)
7. [Profiles](#7-profiles)
8. [Spring Boot Actuator](#8-spring-boot-actuator)
9. [Spring Boot Testing](#9-spring-boot-testing)
10. [Spring Boot Data (JPA, Redis, MongoDB)](#10-spring-boot-data-jpa-redis-mongodb)
11. [Spring Boot Security](#11-spring-boot-security)
12. [Spring Boot Messaging (Kafka, RabbitMQ)](#12-spring-boot-messaging-kafka-rabbitmq)
13. [Spring Boot Web — REST, Validation, Error Handling](#13-spring-boot-web--rest-validation-error-handling)
14. [Production Ready Features](#14-production-ready-features)

---

# 1. Spring Boot vs Spring Framework

## 1.1 Vấn Đề Trước Spring Boot

```
SPRING FRAMEWORK (2003): powerful nhưng configuration nặng

Để tạo một REST endpoint đơn giản với Spring + JPA, bạn cần:
  1. pom.xml: thêm spring-core, spring-web, spring-webmvc, spring-orm,
              hibernate-core, jackson-databind, servlet-api, log4j...
              (10-20 dependencies, version conflicts!)
  
  2. web.xml: deploy descriptor, DispatcherServlet config
  
  3. ApplicationContext.xml: component scan, data source, transaction manager
  
  4. persistence.xml: JPA configuration
  
  5. WebAppInitializer.java: programmatic Spring MVC setup
  
  6. DataSource config, EntityManagerFactory config, TransactionManager config...
  
  7. Khi deploy: phải build WAR, deploy to Tomcat!

→ "Configuration Hell" — developer spend more time on config than code!

SPRING BOOT (2014): "convention over configuration"
  - Auto-configure sensible defaults
  - Starters: add 1 dependency → get everything needed
  - Embedded server: just run main()
  - Production-ready features built-in
  - Opinionated but customizable

SPRING BOOT KHÁC SPRING Ở ĐÂU:
  Spring Framework:  bộ công cụ (bạn dùng theo cách bạn muốn)
  Spring Boot:       opinionated framework (câu trả lời cho "best practice")
  
  Spring Boot = Spring Framework + Auto-Configuration + Starters + Embedded Server
  Spring Boot KHÔNG thay Spring Framework — nó BUILD ON TOP of Spring Framework
```

## 1.2 Spring Boot Core Principles

```
1. AUTO-CONFIGURATION:
   Spring Boot đọc classpath → tìm các library đã add → tự configure chúng
   Thấy spring-data-jpa? → Tự tạo EntityManagerFactory, TransactionManager
   Thấy spring-security? → Tự enable security filter chain
   Thấy jackson-databind? → Tự configure ObjectMapper
   
2. CONVENTION OVER CONFIGURATION:
   Không có jpa config? → Dùng H2 in-memory (nếu có H2 on classpath)
   Không có server config? → Chạy trên port 8080
   Không có data source? → Dùng embedded H2
   BẠN chỉ cần configure khi muốn OVERRIDE default

3. STANDALONE:
   Không cần WAR, không cần external Tomcat
   java -jar myapp.jar → xong!

4. PRODUCTION-READY:
   Actuator: health checks, metrics, info endpoints
   Graceful shutdown built-in
   Externalized configuration
```

---

# 2. Auto-Configuration — Cơ Chế Chi Tiết

## 2.1 Cơ Chế Auto-Configuration

```
AUTO-CONFIGURATION: Spring Boot tự đăng ký beans dựa trên classpath

BƯỚC 1: @SpringBootApplication kích hoạt:
  @SpringBootApplication = @SpringBootConfiguration
                         + @EnableAutoConfiguration
                         + @ComponentScan

@EnableAutoConfiguration kích hoạt AutoConfigurationImportSelector

BƯỚC 2: AutoConfigurationImportSelector đọc danh sách auto-configs

Spring Boot 2.7 và trước:
  resources/META-INF/spring.factories:
    org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
      ...DataSourceAutoConfiguration,\
      ...JpaRepositoriesAutoConfiguration,\
      ...WebMvcAutoConfiguration,\
      ...SecurityAutoConfiguration,\
      ...KafkaAutoConfiguration,\
      ... (150+ auto-configurations!)

Spring Boot 3.0+:
  resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
  (new format, một class mỗi dòng)

BƯỚC 3: Mỗi AutoConfiguration class được evaluate
  Dùng @Conditional annotations để quyết định có apply không:
  @ConditionalOnClass: chỉ apply nếu class X tồn tại trên classpath
  @ConditionalOnMissingBean: chỉ apply nếu CHƯA có bean type Y
  @ConditionalOnProperty: chỉ apply nếu property Z = value
  @ConditionalOnWebApplication: chỉ apply trong web context

BƯỚC 4: Nếu condition thỏa → @Bean methods được tạo

Ví dụ DataSourceAutoConfiguration:

@Configuration
@ConditionalOnClass({ DataSource.class, EmbeddedDatabaseType.class })
@ConditionalOnMissingBean(type = "io.r2dbc.spi.ConnectionFactory")
@AutoConfigureBefore(SqlInitializationAutoConfiguration.class)
@EnableConfigurationProperties(DataSourceProperties.class)
@Import({ DataSourcePoolMetadataProvidersConfiguration.class, ... })
public class DataSourceAutoConfiguration {

    @Configuration
    @Conditional(EmbeddedDatabaseCondition.class)
    @ConditionalOnMissingBean({ DataSource.class, XADataSource.class })
    @Import(EmbeddedDataSourceConfiguration.class)
    protected static class EmbeddedDatabaseConfiguration {}

    @Configuration
    @ConditionalOnMissingBean({ DataSource.class, XADataSource.class })
    @ConditionalOnSingleCandidate(DataSourceProperties.class)
    protected static class PooledDataSourceConfiguration {
        // Creates HikariCP, Tomcat CP, or Commons DBCP datasource
        // based on what's on classpath
    }
}
```

## 2.2 @Conditional Annotations

```java
// ĐIỀU KIỆN để auto-configure:

// @ConditionalOnClass — có class trên classpath?
@Configuration
@ConditionalOnClass(name = "com.zaxxer.hikari.HikariDataSource")
class HikariAutoConfiguration {
    // Chỉ chạy nếu HikariCP được add vào classpath
}

// @ConditionalOnMissingBean — chưa có bean nào?
@Bean
@ConditionalOnMissingBean(DataSource.class)
// "Tôi chỉ tạo DataSource nếu bạn chưa tự tạo"
// → bạn @Bean DataSource của riêng mình → auto-config bỏ qua!
DataSource dataSource() {
    return createDefaultDataSource();
}

// @ConditionalOnProperty — property có giá trị gì?
@Bean
@ConditionalOnProperty(
    name = "app.cache.enabled",
    havingValue = "true",
    matchIfMissing = true)  // nếu property không tồn tại → cũng apply
CacheManager cacheManager() { ... }

// @ConditionalOnWebApplication
@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
class WebMvcAutoConfiguration { ... }

// @ConditionalOnSingleCandidate — chỉ có 1 bean type này
@Bean
@ConditionalOnSingleCandidate(DataSource.class)
JdbcTemplate jdbcTemplate(DataSource ds) {
    return new JdbcTemplate(ds);
}

// Tùy chỉnh condition:
public class OnProductionCondition implements Condition {
    @Override
    public boolean matches(ConditionContext ctx, AnnotatedTypeMetadata meta) {
        String[] profiles = ctx.getEnvironment().getActiveProfiles();
        return Arrays.asList(profiles).contains("production");
    }
}

@Bean
@Conditional(OnProductionCondition.class)
DatadogMetricsExporter datadogExporter() { ... }

// XEM AUTO-CONFIGURATION ĐÃ ÁP DỤNG (DEBUG):
// application.properties:
// debug=true
// → Spring Boot in ra auto-configuration report khi khởi động

// Hoặc Actuator:
// GET /actuator/conditions → toàn bộ conditions đã match/không match
```

## 2.3 Tùy Chỉnh / Override Auto-Configuration

```java
// CÁCH 1: Provide your own @Bean (most common)
@Configuration
public class MyDataSourceConfig {
    @Bean  // Spring Boot sees this → doesn't create its own DataSource
    public DataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:postgresql://my-server/mydb");
        ds.setMaximumPoolSize(30);
        return ds;
    }
}

// CÁCH 2: Properties (đơn giản nhất)
# application.properties:
spring.datasource.url=jdbc:postgresql://localhost/mydb
spring.datasource.username=postgres
spring.datasource.password=secret
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5

// CÁCH 3: Exclude specific auto-configuration
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    SecurityAutoConfiguration.class
})
public class MyApp { }
// Hoặc:
// spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.SecurityAutoConfiguration

// VIẾT AUTO-CONFIGURATION CỦA RIÊNG MÌNH (library):
@Configuration
@ConditionalOnClass(MyLibrary.class)
@EnableConfigurationProperties(MyLibraryProperties.class)
@AutoConfiguration  // Spring Boot 2.7+
public class MyLibraryAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MyService myService(MyLibraryProperties props) {
        return new MyService(props.getApiKey(), props.getTimeout());
    }
}

// META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports:
// com.example.MyLibraryAutoConfiguration
```

---

# 3. Starters — Dependency Management

## 3.1 Spring Boot Starters là gì?

```
STARTER = "pom wrapper" chứa tập hợp dependencies cần thiết cho 1 chức năng

TRƯỚC STARTERS (Spring Framework thuần):
  <dependency>spring-web</dependency>
  <dependency>spring-webmvc</dependency>
  <dependency>jackson-databind</dependency>
  <dependency>jackson-core</dependency>
  <dependency>jackson-annotations</dependency>
  <dependency>hibernate-validator</dependency>
  <dependency>tomcat-embed-core</dependency>
  <dependency>tomcat-embed-websocket</dependency>
  ... (8-10 dependencies, version conflicts!)

VỚI STARTERS:
  <dependency>spring-boot-starter-web</dependency>
  → Includes tất cả trên với COMPATIBLE versions!

NAMING CONVENTION:
  spring-boot-starter-*       → official Spring Boot starters
  thirdparty-spring-boot-starter → community starters
```

## 3.2 Các Starter Quan Trọng

```xml
<!-- WEB -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <!-- Includes: spring-webmvc, spring-core, tomcat-embed,
                  jackson, hibernate-validator, logback -->
</dependency>

<dependency>
    <artifactId>spring-boot-starter-webflux</artifactId>
    <!-- Reactive web: spring-webflux, netty, reactor-core -->
</dependency>

<!-- DATA -->
<dependency>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
    <!-- Includes: spring-data-jpa, hibernate-core, spring-jdbc,
                  spring-tx, HikariCP -->
</dependency>

<dependency>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
    <!-- spring-data-mongodb, mongodb-driver-sync -->
</dependency>

<dependency>
    <artifactId>spring-boot-starter-data-redis</artifactId>
    <!-- spring-data-redis, lettuce-core -->
</dependency>

<dependency>
    <artifactId>spring-boot-starter-jdbc</artifactId>
    <!-- spring-jdbc, HikariCP (without ORM) -->
</dependency>

<!-- SECURITY -->
<dependency>
    <artifactId>spring-boot-starter-security</artifactId>
    <!-- spring-security-core, spring-security-web, spring-security-config -->
</dependency>

<!-- MESSAGING -->
<dependency>
    <artifactId>spring-boot-starter-amqp</artifactId>
    <!-- spring-rabbit, amqp-client -->
</dependency>

<dependency>
    <artifactId>spring-kafka</artifactId>
    <!-- Apache Kafka client, spring-kafka -->
</dependency>

<!-- MONITORING -->
<dependency>
    <artifactId>spring-boot-starter-actuator</artifactId>
    <!-- actuator, micrometer-core, micrometer-observation -->
</dependency>

<!-- TESTING -->
<dependency>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
    <!-- JUnit 5, Mockito, AssertJ, Spring Test, JsonPath,
         Testcontainers, WireMock, MockMvc -->
</dependency>

<!-- CACHING -->
<dependency>
    <artifactId>spring-boot-starter-cache</artifactId>
    <!-- spring-context-support, caffeine, ehcache options -->
</dependency>

<!-- MAIL -->
<dependency>
    <artifactId>spring-boot-starter-mail</artifactId>
    <!-- spring-context-support, jakarta.mail -->
</dependency>

<!-- VALIDATION -->
<dependency>
    <artifactId>spring-boot-starter-validation</artifactId>
    <!-- hibernate-validator, jakarta.validation-api -->
</dependency>

<!-- BATCH -->
<dependency>
    <artifactId>spring-boot-starter-batch</artifactId>
    <!-- spring-batch-core, spring-jdbc -->
</dependency>

<!-- WEBSOCKET -->
<dependency>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

## 3.3 Dependency Management (BOM)

```xml
<!-- spring-boot-starter-parent → quản lý tất cả versions -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
</parent>
<!-- Inherit: dependency management, plugin config, Java version, encoding -->

<!-- Không dùng parent? → import BOM -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- OVERRIDE version (ví dụ dùng newer Jackson): -->
<properties>
    <jackson-bom.version>2.16.0</jackson-bom.version>
    <java.version>21</java.version>
</properties>

<!-- EXCLUDE transitive dependency: -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <artifactId>spring-boot-starter-undertow</artifactId>
    <!-- Replace Tomcat with Undertow! -->
</dependency>
```

---

# 4. SpringApplication — Khởi Động

## 4.1 Startup Process

```java
// ENTRY POINT:
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}

// SPRING APPLICATION KHỞI ĐỘNG LÀM GÌ:

BƯỚC 1: Create SpringApplication instance
  - Detect application type: SERVLET, REACTIVE, NONE
  - Load SpringApplicationRunListeners (SPI)
  - Load ApplicationContextInitializers
  - Load ApplicationListeners

BƯỚC 2: Prepare Environment
  - Create Environment (StandardServletEnvironment, etc.)
  - Add PropertySources: system properties, env vars, application.properties
  - Bind spring.* properties to SpringApplication

BƯỚC 3: Print Banner
  resources/banner.txt → ASCII art banner
  spring.banner.location, spring.main.banner-mode=off to disable

BƯỚC 4: Create ApplicationContext
  SERVLET → AnnotationConfigServletWebServerApplicationContext
  REACTIVE → AnnotationConfigReactiveWebServerApplicationContext
  NONE → AnnotationConfigApplicationContext

BƯỚC 5: Prepare ApplicationContext
  - Apply ApplicationContextInitializers
  - Process @SpringBootApplication → component scan, auto-config

BƯỚC 6: Refresh Context
  - Create ALL beans (component scan + auto-config)
  - Start embedded server
  - This is where 99% of startup work happens

BƯỚC 7: After Refresh
  - Call ApplicationRunner and CommandLineRunner beans
  - Emit ApplicationStartedEvent, ApplicationReadyEvent

DIAGRAM:
  main()
    ↓
  SpringApplication.run()
    ↓
  Starting event
    ↓
  Environment prepared
    ↓
  Context prepared
    ↓
  Context refreshed ← (most time here: bean creation, server start)
    ↓
  ApplicationRunner / CommandLineRunner
    ↓
  Ready event
    ↓
  Application listening on :8080
```

## 4.2 ApplicationRunner & CommandLineRunner

```java
// CHẠY CODE SAU KHI APP KHỞI ĐỘNG:

// CommandLineRunner — args là raw String[]
@Component
@Order(1)  // thứ tự nếu có nhiều runner
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // args từ command line: java -jar app.jar --env=prod foo bar
        // args = ["--env=prod", "foo", "bar"]
        
        if (userRepository.count() == 0) {
            userRepository.save(new User("admin", "admin@example.com"));
            log.info("Default admin user created");
        }
    }
}

// ApplicationRunner — args là ApplicationArguments (parsed)
@Component
@Order(2)
public class StartupValidator implements ApplicationRunner {
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        // args.getOptionValues("env") → ["prod"]
        // args.getNonOptionArgs() → ["foo", "bar"]
        // args.containsOption("debug") → boolean
        
        validateExternalConnections();
        warmupCaches();
        log.info("Startup validation complete");
    }
}

// LAMBDA style:
@Bean
@Order(3)
public ApplicationRunner schemaValidator() {
    return args -> {
        // Check DB schema compatibility
        dbVersionChecker.validate();
    };
}
```

## 4.3 Spring Boot Customization

```java
// CUSTOMIZE SpringApplication:
@SpringBootApplication
public class MyApplication {
    
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(MyApplication.class);
        
        // Disable banner:
        app.setBannerMode(Banner.Mode.OFF);
        
        // Add additional properties:
        app.setDefaultProperties(Map.of(
            "server.port", "8080",
            "spring.jpa.open-in-view", "false"
        ));
        
        // Set additional profiles:
        app.setAdditionalProfiles("metrics", "cloud");
        
        // Register beans BEFORE context refresh:
        app.addInitializers(ctx -> {
            ctx.getBeanFactory().registerSingleton("myBean", new MySpecialBean());
        });
        
        // Lazy initialization (faster startup, slower first request):
        app.setLazyInitialization(true);
        
        app.run(args);
    }
}

// SpringApplicationBuilder — fluent API:
new SpringApplicationBuilder(MyApplication.class)
    .bannerMode(Banner.Mode.LOG)
    .profiles("production")
    .properties("server.port=9090")
    .listeners(new MyApplicationListener())
    .run(args);
```

---

# 5. Embedded Server

## 5.1 Embedded Tomcat (Default)

```java
// Spring Boot INCLUDES Tomcat inside JAR
// Không cần deploy WAR!
// tomcat-embed-core, tomcat-embed-websocket trong spring-boot-starter-web

// CONFIGURE via properties:
server.port=8080
server.address=0.0.0.0        # bind address
server.servlet.context-path=/api  # context path

# Tomcat-specific:
server.tomcat.max-threads=200        # max worker threads (default 200)
server.tomcat.min-spare-threads=10   # min idle threads
server.tomcat.accept-count=100       # queue for connections beyond max-threads
server.tomcat.max-connections=8192   # max concurrent connections
server.tomcat.connection-timeout=20s
server.tomcat.keep-alive-timeout=75s
server.tomcat.max-http-form-post-size=2MB
server.tomcat.max-swallow-size=2MB
server.tomcat.basedir=/tmp/tomcat    # temp directory
server.tomcat.accesslog.enabled=true # access logs

# SSL/TLS:
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.jks
server.ssl.key-store-password=secret
server.ssl.key-alias=myapp
server.ssl.protocol=TLS
server.ssl.enabled-protocols=TLSv1.2,TLSv1.3

// PROGRAMMATIC Tomcat customization:
@Configuration
public class TomcatConfig {
    
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> customizer() {
        return factory -> {
            factory.setPort(8080);
            factory.setMaxThreads(500);
            factory.addConnectorCustomizers(connector -> {
                connector.setMaxPostSize(10_000_000);  // 10MB
                Http11NioProtocol protocol = (Http11NioProtocol) connector.getProtocolHandler();
                protocol.setMaxConnections(10000);
                protocol.setConnectionTimeout(20000);
            });
            factory.addContextCustomizers(context -> {
                context.setSessionTimeout(30);  // minutes
            });
        };
    }
}
```

## 5.2 Switching Servers

```xml
<!-- REPLACE Tomcat with Undertow (better performance for non-blocking): -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>

<!-- Undertow config: -->
server.undertow.io-threads=4          # IO threads (default: CPU cores * 2)
server.undertow.worker-threads=32     # worker threads (default: IO * 8)
server.undertow.buffer-size=1024      # bytes per buffer
server.undertow.direct-buffers=true   # use direct buffers (off-heap)

<!-- REPLACE with Jetty: -->
<dependency>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>

<!-- REACTIVE: uses Netty (not Servlet container): -->
<dependency>
    <artifactId>spring-boot-starter-webflux</artifactId>
    <!-- Netty embedded automatically -->
</dependency>
server.netty.connection-timeout=20s
server.netty.max-keep-alive-requests=100
```

---

# 6. Configuration & Properties

## 6.1 application.properties / application.yml

```yaml
# application.yml — full example

spring:
  application:
    name: order-service  # used by actuator, logging, service discovery

  # DATABASE
  datasource:
    url: jdbc:postgresql://localhost:5432/orderdb
    username: ${DB_USERNAME:postgres}   # ${env:default}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000        # 5 min
      connection-timeout: 30000   # 30s
      max-lifetime: 1800000       # 30 min
      leak-detection-threshold: 2000
      pool-name: OrderDB-Pool

  # JPA/HIBERNATE
  jpa:
    hibernate:
      ddl-auto: validate          # validate|update|create|create-drop|none
    show-sql: false               # true only in dev!
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        jdbc:
          batch_size: 50          # batch inserts
          fetch_size: 100         # JDBC fetch size
        order_inserts: true       # batch optimization
        order_updates: true
        generate_statistics: false
    open-in-view: false           # ALWAYS false! Prevents lazy loading pitfalls

  # REDIS
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: 6379
      password: ${REDIS_PASSWORD:}
      timeout: 2000ms
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 4
          max-wait: 1000ms

  # KAFKA
  kafka:
    bootstrap-servers: ${KAFKA_SERVERS:localhost:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: io.confluent.kafka.serializers.KafkaAvroSerializer
      acks: all
      retries: 2147483647
    consumer:
      group-id: ${spring.application.name}
      auto-offset-reset: earliest
      enable-auto-commit: false
    listener:
      ack-mode: MANUAL_IMMEDIATE
      concurrency: 3

  # MAIL
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USER}
    password: ${MAIL_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true

  # CACHE
  cache:
    type: redis                   # auto, redis, caffeine, simple, none
    redis:
      time-to-live: 600000       # 10 min default TTL
      key-prefix: "orders:"
      use-key-prefix: true
      cache-null-values: false

# SERVER
server:
  port: ${PORT:8080}
  servlet:
    context-path: /
  tomcat:
    max-threads: 200
    connection-timeout: 20s
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/plain
    min-response-size: 1024
  http2:
    enabled: true                 # HTTP/2 support

# LOGGING
logging:
  level:
    root: INFO
    com.example: DEBUG
    org.springframework.web: DEBUG
    org.hibernate.SQL: DEBUG      # show SQL
    org.hibernate.type.descriptor.sql: TRACE  # show bind params
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] [%X{requestId}] %-5level %logger{36} - %msg%n"
  file:
    name: /var/log/order-service/app.log
    max-size: 100MB
    max-history: 30

# ACTUATOR
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers,env,beans,conditions
  endpoint:
    health:
      show-details: when-authorized
      show-components: always
  metrics:
    tags:
      application: ${spring.application.name}
      environment: ${ENVIRONMENT:development}
```

## 6.2 @ConfigurationProperties — Strongly Typed Config

```java
// Thay vì @Value("${app.payment.timeout}") everywhere:

@ConfigurationProperties(prefix = "app.payment")
@Validated  // enables Bean Validation on the properties!
@Data       // Lombok
public class PaymentProperties {
    
    @NotBlank
    @URL
    private String gatewayUrl;
    
    @NotBlank
    private String apiKey;
    
    @Min(1) @Max(300)
    private int timeoutSeconds = 30;
    
    @NotNull
    private RetryConfig retry = new RetryConfig();
    
    @Data
    public static class RetryConfig {
        private int maxAttempts = 3;
        private long delayMs = 1000;
        private double multiplier = 2.0;
    }
}

// application.yml:
// app:
//   payment:
//     gateway-url: https://payment.example.com
//     api-key: ${PAYMENT_API_KEY}
//     timeout-seconds: 60
//     retry:
//       max-attempts: 5
//       delay-ms: 500

// ENABLE:
@SpringBootApplication
@ConfigurationPropertiesScan  // scans for @ConfigurationProperties
public class MyApp { }

// USE:
@Service
@RequiredArgsConstructor
public class PaymentService {
    
    private final PaymentProperties paymentProps;
    
    public void processPayment(Payment payment) {
        String url = paymentProps.getGatewayUrl();
        int timeout = paymentProps.getTimeoutSeconds();
        // Clean! No @Value annotations scattered everywhere
    }
}
```

---

# 7. Profiles

## 7.1 Spring Profiles

```java
// PROFILES = named groups of configuration
// Activate different beans and properties per environment

// ACTIVATE PROFILE:
// application.properties:
spring.profiles.active=development,metrics

// Env var: SPRING_PROFILES_ACTIVE=production
// VM arg: -Dspring.profiles.active=production
// Command line: --spring.profiles.active=production

// PROFILE-SPECIFIC PROPERTIES:
// application.properties          → always loaded
// application-development.yml    → only with "development" profile
// application-production.yml     → only with "production" profile
// application-test.yml            → only with "test" profile

// PROFILE-SPECIFIC BEANS:
@Configuration
@Profile("production")
public class ProductionConfig {
    
    @Bean
    public DataSource productionDataSource() {
        // RDS, Aurora, etc.
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:postgresql://prod-db.amazonaws.com/orders");
        return ds;
    }
}

@Configuration
@Profile("development")
public class DevelopmentConfig {
    
    @Bean
    public DataSource devDataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }
}

@Configuration
@Profile("!production")  // active when NOT production
public class DebugConfig {
    @Bean
    H2Console h2Console() { return new H2Console(); }
}

@Profile({"production", "staging"})  // multiple profiles
public class ProductionReadyConfig { }

// CONDITIONAL on profile in test:
@SpringBootTest
@ActiveProfiles("test")
class UserServiceIntegrationTest { }
```

---

# 8. Spring Boot Actuator

## 8.1 Actuator Endpoints

```java
// ADD DEPENDENCY:
// spring-boot-starter-actuator

// ĐÂY LÀ GÌ:
// Actuator = production-ready monitoring và management endpoints
// Expose metrics, health, beans, config, logs, etc.
// Tích hợp với Prometheus, Grafana, ELK, DataDog

// CÁC ENDPOINTS QUAN TRỌNG:

// GET /actuator/health — trạng thái hệ thống
{
  "status": "UP",
  "components": {
    "db": { "status": "UP", "details": { "database": "PostgreSQL", "validationQuery": "isValid()" }},
    "redis": { "status": "UP", "details": { "version": "7.0.5" }},
    "kafka": { "status": "UP" },
    "diskSpace": { "status": "UP", "details": { "total": 499963170816, "free": 387465306112 }},
    "ping": { "status": "UP" }
  }
}

// GET /actuator/info — app information
// app.info.* hoặc build-info (Maven plugin adds automatically)
{
  "app": { "name": "order-service", "version": "1.0.0", "description": "..." },
  "build": { "version": "1.0.0", "artifact": "order-service", "time": "2025-05-19T07:00:00Z" },
  "git": { "commit": { "id": "abc123", "time": "2025-05-19T06:55:00Z" }, "branch": "main" }
}

// GET /actuator/metrics — micrometer metrics
// GET /actuator/metrics/{name} — specific metric
// GET /actuator/metrics/http.server.requests?tag=status:200

// GET /actuator/prometheus — Prometheus format
// process_cpu_usage 0.005
// jvm_memory_used_bytes{area="heap",...} 1.23456789E8
// http_server_requests_seconds_count{...} 42.0

// GET /actuator/env — environment properties
// GET /actuator/env/{name} — specific property

// GET /actuator/loggers — current log levels
// POST /actuator/loggers/{logger} — CHANGE log level at runtime!
// {"configuredLevel": "DEBUG"}
// → Change com.example to DEBUG without restart!

// GET /actuator/beans — all Spring beans
// GET /actuator/conditions — auto-configuration report
// GET /actuator/mappings — all @RequestMapping URLs
// GET /actuator/configprops — @ConfigurationProperties

// POST /actuator/shutdown — graceful shutdown (disabled by default)
// POST /actuator/refresh — reload config (Spring Cloud)

// GET /actuator/threaddump — JVM thread dump
// GET /actuator/heapdump — JVM heap dump (large file!)
// GET /actuator/caches — cache statistics
```

## 8.2 Custom Health Indicator

```java
// THÊM custom health check:

@Component
public class PaymentGatewayHealthIndicator implements HealthIndicator {

    private final PaymentGatewayClient client;

    @Override
    public Health health() {
        try {
            PaymentGatewayStatus status = client.ping();
            
            if (status.isUp()) {
                return Health.up()
                    .withDetail("gateway", "payment.example.com")
                    .withDetail("responseTime", status.getResponseTimeMs() + "ms")
                    .withDetail("version", status.getVersion())
                    .build();
            } else {
                return Health.down()
                    .withDetail("gateway", "payment.example.com")
                    .withDetail("error", status.getError())
                    .build();
            }
        } catch (Exception e) {
            return Health.down(e)
                .withDetail("gateway", "payment.example.com")
                .withDetail("exception", e.getClass().getName())
                .build();
        }
    }
}
// → Tự động xuất hiện trong /actuator/health:
// "paymentGateway": { "status": "UP", "details": {...} }

// REACTIVE health indicator:
@Component
public class ExternalServiceHealthIndicator implements ReactiveHealthIndicator {
    @Override
    public Mono<Health> health() {
        return webClient.get().uri("/health")
            .retrieve()
            .bodyToMono(String.class)
            .map(response -> Health.up().build())
            .onErrorReturn(Health.down().build());
    }
}
```

## 8.3 Custom Metrics với Micrometer

```java
// MICROMETER = metrics facade (như SLF4J nhưng cho metrics)
// Hỗ trợ: Prometheus, Graphite, DataDog, InfluxDB, CloudWatch, etc.

@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final MeterRegistry meterRegistry;
    
    // Counter — monotonically increasing count
    private Counter orderCreatedCounter;
    private Counter orderFailedCounter;
    
    @PostConstruct
    void initMetrics() {
        orderCreatedCounter = Counter.builder("orders.created")
            .description("Total orders created")
            .tag("service", "order-service")
            .register(meterRegistry);
            
        orderFailedCounter = Counter.builder("orders.failed")
            .description("Total failed orders")
            .register(meterRegistry);
    }
    
    // Gauge — current value
    @PostConstruct
    void registerGauges() {
        Gauge.builder("orders.pending.count", this, OrderService::getPendingOrderCount)
            .description("Number of pending orders")
            .register(meterRegistry);
    }
    
    // Timer — duration of operations
    public Order createOrder(CreateOrderRequest req) {
        return Timer.builder("orders.creation.duration")
            .description("Time to create an order")
            .tag("region", req.getRegion())
            .register(meterRegistry)
            .recordCallable(() -> doCreateOrder(req));
    }
    
    // Distribution Summary — size/weight measurements
    private DistributionSummary orderValueSummary = DistributionSummary
        .builder("orders.value.distribution")
        .description("Distribution of order values")
        .baseUnit("VND")
        .publishPercentiles(0.5, 0.95, 0.99)
        .publishPercentileHistogram()
        .register(meterRegistry);
    
    // @Timed annotation (Micrometer):
    @Timed(value = "orders.payment.duration", percentiles = {0.5, 0.95})
    public void processPayment(Order order) { ... }
    
    // @Counted annotation:
    @Counted(value = "orders.cancelled", extraTags = {"reason", "user-request"})
    public void cancelOrder(String orderId) { ... }
}
```

---

# 9. Spring Boot Testing

## 9.1 Test Slices — Không Load Full Context

```java
// @SpringBootTest — load FULL ApplicationContext (slow!)
@SpringBootTest
@AutoConfigureMockMvc
class FullIntegrationTest {
    @Autowired MockMvc mockMvc;
    // ALL beans loaded: security, data, web, services, etc.
}

// ── TEST SLICES — chỉ load phần cần thiết (nhanh!) ──

// @WebMvcTest — chỉ load WEB layer
@WebMvcTest(OrderController.class)  // only OrderController
class OrderControllerTest {
    
    @Autowired
    MockMvc mockMvc;
    
    @MockBean  // mock tất cả service dependencies!
    OrderService orderService;
    
    @MockBean
    SecurityService securityService;
    
    @Test
    void createOrder_shouldReturn201() throws Exception {
        when(orderService.create(any())).thenReturn(mockOrder());
        
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + testToken())
                .content("""{"customerId": "123", "items": [...]}"""))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andDo(print());
    }
}

// @DataJpaTest — chỉ load JPA layer (dùng H2 in-memory mặc định)
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
// Replace.NONE → dùng real DB (với Testcontainers)
@Import(TestcontainersConfig.class)
class OrderRepositoryTest {
    
    @Autowired
    TestEntityManager em;
    
    @Autowired
    OrderRepository orderRepository;
    
    @Test
    void findByCustomerId_shouldReturnOrders() {
        // Arrange
        Customer customer = em.persistAndFlush(new Customer("Khang", "k@test.com"));
        Order order = em.persistAndFlush(new Order(customer.getId(), Money.of(50000)));
        
        // Act
        List<Order> orders = orderRepository.findByCustomerId(customer.getId());
        
        // Assert
        assertThat(orders).hasSize(1);
        assertThat(orders.get(0).getTotalAmount()).isEqualByComparingTo("50000");
    }
}

// @JsonTest — test JSON serialization/deserialization
@JsonTest
class OrderResponseTest {
    
    @Autowired
    JacksonTester<OrderResponse> json;
    
    @Test
    void serialize() throws Exception {
        OrderResponse response = new OrderResponse("123", "PENDING", Money.of(50000));
        
        assertThat(json.write(response))
            .hasJsonPathStringValue("$.id", "123")
            .hasJsonPathStringValue("$.status", "PENDING")
            .hasJsonPathNumberValue("$.amount", 50000);
    }
    
    @Test
    void deserialize() throws Exception {
        String json = """{"id": "123", "status": "PENDING", "amount": 50000}""";
        assertThat(this.json.parseObject(json).getId()).isEqualTo("123");
    }
}

// @RestClientTest — test RestTemplate/WebClient
@RestClientTest(PaymentGatewayClient.class)
class PaymentGatewayClientTest {
    
    @Autowired
    PaymentGatewayClient client;
    
    @Autowired
    MockRestServiceServer server;
    
    @Test
    void charge_shouldReturnSuccess() {
        server.expect(requestTo("https://payment.example.com/charge"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess("""{"status":"SUCCESS","transactionId":"tx123"}""",
                MediaType.APPLICATION_JSON));
        
        PaymentResult result = client.charge("cust123", 50000);
        assertThat(result.isSuccess()).isTrue();
    }
}
```

## 9.2 Testcontainers Integration

```java
// TESTCONTAINERS — real Docker containers in tests
// Real PostgreSQL, Real Redis, Real Kafka for tests

@SpringBootTest
@Testcontainers
class RealDatabaseIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test")
        .withInitScript("sql/schema.sql");

    @Container
    static RedisContainer redis = new RedisContainer(
        DockerImageName.parse("redis:7-alpine"))
        .withExposedPorts(6379);

    @Container
    static KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host",     redis::getHost);
        registry.add("spring.data.redis.port",     redis::getFirstMappedPort);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired OrderRepository orderRepository;
    @Autowired OrderService orderService;

    @Test
    @Transactional
    void createOrder_persistsToRealDatabase() {
        Order order = orderService.createOrder(new CreateOrderRequest("cust1", items));
        
        assertThat(orderRepository.findById(order.getId())).isPresent();
    }
}

// SPRING BOOT 3.1+ Testcontainers Service Connections:
@TestConfiguration
class TestcontainersConfig {
    
    @Bean
    @ServiceConnection  // auto-configures datasource properties!
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>("postgres:16");
    }
    
    @Bean
    @ServiceConnection
    RedisContainer redisContainer() {
        return new RedisContainer(DockerImageName.parse("redis:7"));
    }
    
    @Bean
    @ServiceConnection
    KafkaContainer kafkaContainer() {
        return new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));
    }
}
```

---

# 10. Spring Boot Data (JPA, Redis, MongoDB)

## 10.1 Spring Boot + JPA

```yaml
# application.yml:
spring:
  jpa:
    hibernate.ddl-auto: validate    # PRODUCTION: validate (never auto-create!)
    open-in-view: false              # ALWAYS false!
    properties:
      hibernate:
        jdbc.batch_size: 50         # batch inserts
        order_inserts: true
        order_updates: true
        connection.provider_disables_autocommit: true  # Hikari optimization
```

```java
// N+1 PREVENTION trong Spring Boot:

@Entity
@Table(name = "orders")
@NamedEntityGraph(name = "Order.withItems",
    attributeNodes = @NamedAttributeNode("orderItems"))
public class Order {
    @Id @GeneratedValue
    private Long id;
    
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)  // LAZY default
    private List<OrderItem> orderItems;
}

// Repository với EntityGraph:
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    @EntityGraph(attributePaths = {"orderItems", "orderItems.product"})
    @Query("SELECT o FROM Order o WHERE o.customerId = :customerId")
    List<Order> findByCustomerIdWithItems(@Param("customerId") Long customerId);
    
    // JPQL JOIN FETCH:
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems i LEFT JOIN FETCH i.product WHERE o.status = :status")
    List<Order> findByStatusWithItems(@Param("status") OrderStatus status);
    
    // Projection - select only needed fields:
    @Query("SELECT new com.example.OrderSummaryDto(o.id, o.status, o.totalAmount, o.createdAt) FROM Order o WHERE o.customerId = :id")
    List<OrderSummaryDto> findSummariesByCustomerId(Long id);
}
```

## 10.2 Spring Boot + Redis

```java
// SPRING BOOT AUTO-CONFIGURES:
// - RedisConnectionFactory (Lettuce by default)
// - RedisTemplate<Object, Object>
// - StringRedisTemplate
// - CacheManager (if spring-boot-starter-cache)

@Service
@RequiredArgsConstructor
public class ProductCacheService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final StringRedisTemplate stringRedisTemplate;
    
    public void cacheProduct(Product product) {
        String key = "product:" + product.getId();
        redisTemplate.opsForValue().set(key, product, Duration.ofHours(1));
    }
    
    public Optional<Product> getCachedProduct(String id) {
        Product cached = (Product) redisTemplate.opsForValue().get("product:" + id);
        return Optional.ofNullable(cached);
    }
    
    // Hash operations:
    public void updateProductField(String id, String field, Object value) {
        redisTemplate.opsForHash().put("product:" + id, field, value);
    }
    
    // Atomic operations:
    public Long incrementViewCount(String productId) {
        return redisTemplate.opsForValue().increment("views:" + productId);
    }
    
    // Sorted Set for leaderboard:
    public void updateScore(String userId, double score) {
        redisTemplate.opsForZSet().add("leaderboard", userId, score);
    }
    
    public Set<ZSetOperations.TypedTuple<Object>> getTopN(int n) {
        return redisTemplate.opsForZSet()
            .reverseRangeWithScores("leaderboard", 0, n - 1);
    }
}

// @Cacheable — Spring Cache Abstraction with Redis:
@Service
public class ProductService {
    
    @Cacheable(value = "products", key = "#id",
               condition = "#id != null",
               unless = "#result == null")
    public Product findById(String id) {
        return productRepository.findById(id).orElse(null);
        // Result auto-cached in Redis!
    }
    
    @CachePut(value = "products", key = "#product.id")
    public Product update(Product product) {
        return productRepository.save(product);
        // Always updates cache
    }
    
    @CacheEvict(value = "products", key = "#id")
    public void delete(String id) {
        productRepository.deleteById(id);
        // Removes from cache
    }
    
    @CacheEvict(value = "products", allEntries = true)  // clear all cache
    @Scheduled(fixedRate = 3600000)
    public void clearProductCache() {}
}

// REDIS CONFIG:
@Configuration
@EnableCaching
public class RedisConfig {
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .disableCachingNullValues()
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()));
        
        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(
            "products",      config.entryTtl(Duration.ofHours(1)),
            "users",         config.entryTtl(Duration.ofMinutes(30)),
            "sessions",      config.entryTtl(Duration.ofDays(1))
        );
        
        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .withInitialCacheConfigurations(cacheConfigs)
            .build();
    }
}
```

---

# 11. Spring Boot Security

```java
// SPRING BOOT AUTO-CONFIGURES SECURITY:
// - SecurityFilterChain (protect all URLs, form login, HTTP basic)
// - UserDetailsService (in-memory user: user/random-password)
// - PasswordEncoder (BCrypt)
// Prints: "Using generated security password: abc123def456"

// OVERRIDE với JWT:
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // enables @PreAuthorize, @PostAuthorize
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                              JwtAuthFilter jwtFilter) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/v*/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/reports/**").hasAnyAuthority("REPORT_READ", "ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> {
                    res.setContentType("application/json");
                    res.setStatus(HttpStatus.UNAUTHORIZED.value());
                    res.getWriter().write("""{"error":"UNAUTHORIZED","message":"Authentication required"}""");
                })
                .accessDeniedHandler((req, res, e) -> {
                    res.setContentType("application/json");
                    res.setStatus(HttpStatus.FORBIDDEN.value());
                    res.getWriter().write("""{"error":"FORBIDDEN","message":"Insufficient permissions"}""");
                })
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("https://app.example.com", "https://admin.example.com"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

---

# 12. Spring Boot Messaging (Kafka, RabbitMQ)

```java
// ── KAFKA ──
@Service
public class OrderEventProducer {
    
    @Autowired
    private KafkaTemplate<String, OrderCreatedEvent> kafkaTemplate;
    
    public CompletableFuture<SendResult<String, OrderCreatedEvent>> publishOrderCreated(Order order) {
        OrderCreatedEvent event = OrderCreatedEvent.from(order);
        
        ProducerRecord<String, OrderCreatedEvent> record =
            new ProducerRecord<>("orders", order.getId().toString(), event);
        record.headers()
            .add("correlationId", UUID.randomUUID().toString().getBytes())
            .add("sourceService", "order-service".getBytes());
        
        return kafkaTemplate.send(record)
            .whenComplete((result, ex) -> {
                if (ex != null) log.error("Failed to send event", ex);
                else log.debug("Sent to partition {} offset {}",
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());
            });
    }
}

@Service
public class OrderEventConsumer {
    
    @KafkaListener(topics = "orders", groupId = "order-processors",
                   concurrency = "3",
                   containerFactory = "kafkaListenerContainerFactory")
    public void handleOrderCreated(
            ConsumerRecord<String, OrderCreatedEvent> record,
            Acknowledgment ack) {
        try {
            orderProcessor.process(record.value());
            ack.acknowledge();
        } catch (Exception e) {
            // Based on exception type: ack (skip), nack (retry), or throw
            ack.acknowledge();  // send to DLT via @RetryableTopic
            throw e;
        }
    }
    
    @RetryableTopic(attempts = "4",
                    backoff = @Backoff(delay = 1000, multiplier = 2),
                    dltTopicSuffix = "-dead-letter")
    @KafkaListener(topics = "payments")
    public void handlePayment(PaymentEvent event) {
        paymentProcessor.process(event);
    }
}

// ── RABBITMQ ──
@Service
public class NotificationPublisher {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void publishNotification(NotificationEvent event) {
        rabbitTemplate.convertAndSend(
            "notifications",      // exchange
            "notifications.email.user",  // routing key
            event,
            message -> {
                message.getMessageProperties().setMessageId(UUID.randomUUID().toString());
                message.getMessageProperties().setPriority(event.getPriority());
                return message;
            }
        );
    }
}

@Component
public class NotificationConsumer {
    
    @RabbitListener(queues = "notifications.email",
                    concurrency = "3-10",
                    containerFactory = "rabbitListenerContainerFactory")
    public void handleEmailNotification(
            @Payload NotificationEvent event,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag,
            Channel channel) throws IOException {
        try {
            emailService.send(event);
            channel.basicAck(deliveryTag, false);
        } catch (TemporaryEmailException e) {
            channel.basicNack(deliveryTag, false, true);  // requeue
        } catch (Exception e) {
            channel.basicNack(deliveryTag, false, false); // dead letter
        }
    }
}
```

---

# 13. Spring Boot Web — REST, Validation, Error Handling

## 13.1 Input Validation

```java
// Bean Validation với Spring Boot:

// REQUEST DTO với constraints:
public record CreateUserRequest(
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    String name,
    
    @NotBlank @Email(message = "Must be a valid email")
    String email,
    
    @NotBlank
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,}$",
             message = "Password must have uppercase, lowercase, digit, and special char")
    String password,
    
    @NotNull @Min(18) @Max(120)
    Integer age,
    
    @NotEmpty
    @Valid  // cascade validation into list items
    List<@NotBlank String> roles,
    
    @Valid  // cascade validation into nested object
    AddressRequest address
) {}

// CONTROLLER với validation:
@RestController
@RequestMapping("/api/users")
@Validated  // enables @Valid on method parameters AND @Validated on class
public class UserController {
    
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @RequestBody @Valid CreateUserRequest request) {
        // If validation fails → MethodArgumentNotValidException thrown
        // Handled by @ControllerAdvice
        return ResponseEntity.created(...).body(userService.create(request));
    }
    
    // @PathVariable validation (needs @Validated on class):
    @GetMapping("/{id}")
    public UserResponse getUser(
            @PathVariable @Positive(message = "ID must be positive") Long id) {
        return userService.findById(id);
    }
    
    // @RequestParam validation:
    @GetMapping
    public Page<UserResponse> listUsers(
            @RequestParam @Min(0) int page,
            @RequestParam @Min(1) @Max(100) int size) {
        return userService.findAll(PageRequest.of(page, size));
    }
}

// GLOBAL EXCEPTION HANDLER (trong Spring Boot):
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    
    // Override Spring's default handler for validation:
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", "Validation Failed");
        body.put("path", ((ServletWebRequest)request).getRequest().getRequestURI());
        
        Map<String, List<String>> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.groupingBy(
                FieldError::getField,
                Collectors.mapping(FieldError::getDefaultMessage, Collectors.toList())
            ));
        body.put("fieldErrors", fieldErrors);
        
        return new ResponseEntity<>(body, headers, status);
    }
}
```

---

# 14. Production Ready Features

## 14.1 Graceful Shutdown

```yaml
# application.yml
server:
  shutdown: graceful        # Graceful shutdown (default: immediate)

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s  # wait max 30s for active requests
```

```java
// SHUTDOWN HOOKS — cleanup on shutdown:
@Component
public class CleanupOnShutdown {
    
    @PreDestroy
    public void cleanup() {
        // Called before Spring context closes
        log.info("Application shutting down gracefully...");
        // Close DB connections, flush buffers, etc.
    }
    
    @EventListener
    public void onContextClose(ContextClosedEvent event) {
        // Also triggered on shutdown
        log.info("Context is closing");
    }
    
    // SmartLifecycle for more control:
    @Bean
    public SmartLifecycle kafkaConsumerLifecycle() {
        return new SmartLifecycle() {
            @Override
            public void stop(Runnable callback) {
                log.info("Stopping Kafka consumers...");
                kafkaListenerEndpointRegistry.stop(callback);
            }
            @Override
            public int getPhase() { return Integer.MAX_VALUE; }  // stop last
        };
    }
}
```

## 14.2 Logging Configuration

```java
// LOGBACK trong Spring Boot (default logging framework):
// src/main/resources/logback-spring.xml:

// TẠO CUSTOM LOGGING CONFIGURATION:
// spring.config.activate.onProfile trong logback cho phép profile-specific logging!

// Programmatic logger level change:
@Autowired
LoggingSystem loggingSystem;

public void setLogLevel(String loggerName, LogLevel level) {
    loggingSystem.setLogLevel(loggerName, level);
}

// Via Actuator (no code needed!):
// POST /actuator/loggers/com.example.service
// {"configuredLevel": "DEBUG"}
// GET /actuator/loggers/com.example.service
// → {"configuredLevel":"DEBUG","effectiveLevel":"DEBUG"}

// STRUCTURED LOGGING với Logstash:
// spring-boot-starter-logging → logback → logstash-logback-encoder
// Add to logback-spring.xml:
// <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
// → JSON structured logs:
// {"@timestamp":"2025-05-19T10:00:00.000Z","level":"INFO","logger":"c.e.OrderService","message":"Order created","orderId":"123","userId":"456"}
```

## 14.3 Spring Boot DevTools

```xml
<!-- DevTools — development productivity tools -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <optional>true</optional>  <!-- không đưa vào production JAR -->
    <scope>runtime</scope>
</dependency>
```

```
DEVTOOLS FEATURES:
  1. Automatic Restart:
     Classpath thay đổi → app restart tự động
     Nhanh hơn full restart vì dùng 2 classloaders:
       - Base classloader: 3rd party JARs (không thay đổi)
       - Restart classloader: code của bạn
     Restart chỉ reload restart classloader (~1-2s vs 5-10s full)
  
  2. LiveReload:
     Kích hoạt LiveReload server (port 35729)
     Chrome extension → browser tự refresh khi resources thay đổi
  
  3. Property Overrides:
     Tự động set useful dev properties:
     spring.thymeleaf.cache=false
     spring.web.resources.cache.period=0
     spring.mvc.log-resolved-exception=true
  
  4. Global DevTools Settings:
     ~/.spring-boot-devtools.properties
  
  5. Remote Development:
     spring.devtools.remote.secret=mysecret
     Restart trigger over HTTP (không dùng production!)
```

---

## 📎 Quick Reference — Spring Boot

```
SpringApplication:       main entry point, detects web type, loads auto-config
@SpringBootApplication:  @SpringBootConfiguration + @EnableAutoConfiguration + @ComponentScan
Auto-config:             reads classpath → conditionally applies config
@ConditionalOnClass:     only if class exists on classpath
@ConditionalOnMissingBean: only if no bean of type already exists
Starters:                spring-boot-starter-* = curated dependency sets
Embedded server:         Tomcat (default), Undertow, Jetty, Netty (reactive)
application.yml:         externalized config, hierarchy, placeholders ${VAR:default}
@ConfigurationProperties: strongly-typed config binding
Profiles:                application-{profile}.yml, @Profile("production")
Actuator:                /health, /metrics, /prometheus, /loggers (change live!)
/actuator/conditions:    debug auto-configuration decisions
Test slices:             @WebMvcTest, @DataJpaTest, @JsonTest (faster tests)
@MockBean:               replace bean with mock in test context
DevTools:                auto-restart, LiveReload (dev only)
Graceful shutdown:       server.shutdown=graceful
open-in-view=false:      ALWAYS set this! Avoid lazy loading pitfalls
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Spring Boot Reference | <https://docs.spring.io/spring-boot/docs/current/reference/html/> |
| Auto-Configuration | <https://docs.spring.io/spring-boot/docs/current/reference/html/using.html#using.auto-configuration> |
| Common Properties | <https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html> |
| Actuator | <https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html> |
| Testing | <https://docs.spring.io/spring-boot/docs/current/reference/html/testing.html> |
| Spring Boot Starters | <https://docs.spring.io/spring-boot/docs/current/reference/html/using.html#using.build-systems.starters> |
| Testcontainers | <https://docs.spring.io/spring-boot/docs/current/reference/html/testing.html#testing.testcontainers> |
| Micrometer | <https://micrometer.io/docs> |
| Spring Security Boot | <https://docs.spring.io/spring-security/reference/servlet/getting-started.html> |
