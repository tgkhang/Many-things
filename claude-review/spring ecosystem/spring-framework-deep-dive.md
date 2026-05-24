# 🌱 Spring Framework — Complete Deep Dive
>
> IoC Container, Dependency Injection, Bean Lifecycle, AOP, MVC — Cơ chế chi tiết

---

## 📚 Table of Contents

1. [Spring Framework Overview](#1-spring-framework-overview)
2. [IoC Container — "Tự lo" Là Tự Lo Cái Gì?](#2-ioc-container--tự-lo-là-tự-lo-cái-gì)
3. [ApplicationContext — Bean Registry](#3-applicationcontext--bean-registry)
4. [Bean Definition & Lifecycle](#4-bean-definition--lifecycle)
5. [Dependency Injection — 3 Cách](#5-dependency-injection--3-cách)
6. [Bean Scopes](#6-bean-scopes)
7. [Spring AOP — Aspect-Oriented Programming](#7-spring-aop--aspect-oriented-programming)
8. [Spring MVC — Request Processing Pipeline](#8-spring-mvc--request-processing-pipeline)
9. [Spring Data & Transactions](#9-spring-data--transactions)
10. [Spring Security Architecture](#10-spring-security-architecture)
11. [Spring Events & Environment](#11-spring-events--environment)

---

# 1. Spring Framework Overview

## 1.1 Core Problems Spring Solves

```
BẠN CÓ THỂ VIẾT JAVA KHÔNG CÓ SPRING:
  - Tự new object: UserService service = new UserService(new UserRepo(new DataSource(...)))
  - Tự manage lifecycle: khởi tạo, dùng, destroy — bạn lo hết
  - Tự cross-cutting: mỗi method tự gọi logger.info(), transactionManager.begin()...
  - Tự wire dependencies: ServiceA cần ServiceB cần ServiceC cần ServiceD...

SPRING GIẢI QUYẾT:
  ┌─────────────────────────────────────────────────────────────────┐
  │  BẠN VIẾT: "Tôi cần UserService"                               │
  │  SPRING LO: tạo UserService, tạo UserRepository bên trong,     │
  │             tạo DataSource bên trong repo, inject vào đúng chỗ │
  │             quản lý vòng đời toàn bộ object graph              │
  └─────────────────────────────────────────────────────────────────┘

SPRING MODULES (Mô-đun):
  spring-core:       IoC Container, DI — nền tảng
  spring-beans:      Bean factory, definition
  spring-context:    ApplicationContext, Events, i18n
  spring-aop:        AOP proxy, aspect weaving
  spring-web:        Web basics, HTTP abstractions
  spring-webmvc:     Spring MVC, DispatcherServlet
  spring-tx:         Transaction management
  spring-jdbc:       JDBC template, DataSource
  spring-orm:        JPA, Hibernate integration
  spring-security:   Authentication, Authorization
  spring-test:       Testing support
  
KHÔNG CẦN DÙNG HẾT — bạn chọn module cần thiết
Spring Boot auto-configure giúp bạn chọn tự động
```

---

# 2. IoC Container — "Tự Lo" Là Tự Lo Cái Gì?

## 2.1 IoC = Inversion of Control

```
TRƯỚC IoC (traditional control):
  Bạn ĐIỀU KHIỂN việc tạo dependency:
  
  class UserService {
      // BẠN quyết định tạo UserRepository như thế nào
      private UserRepository repo = new JpaUserRepository(
          new HikariDataSource(config)  // bạn tự new
      );
  }
  
  VẤN ĐỀ:
  - UserService biết cách tạo JpaUserRepository (tight coupling!)
  - Muốn thay MockRepo cho test → phải sửa UserService
  - UserService biết quá nhiều thứ không liên quan đến business

SAU IoC (Spring controls):
  SPRING ĐIỀU KHIỂN việc tạo và inject:
  
  class UserService {
      // Spring quyết định inject cái gì
      private final UserRepository repo;  // không new!
      
      UserService(UserRepository repo) {  // Spring gọi constructor này
          this.repo = repo;               // Spring truyền implementation
      }
  }
  
  UserService không cần biết repo là JPA hay Mock hay In-memory
  → Loose coupling
  → Dễ test (inject mock)
  → Dễ thay đổi implementation

IoC = "Don't call us, we'll call you"
  Bình thường: code của bạn gọi framework
  IoC:         framework gọi code của bạn
  
  Framework (Spring) ĐIỀU KHIỂN flow:
    Spring khởi động
    Spring đọc config/annotations
    Spring tạo object theo đúng thứ tự dependency
    Spring inject vào nhau
    Spring giao object đã sẵn sàng cho bạn dùng
```

## 2.2 Dependency Injection — Cơ Chế Cụ Thể

```
DI = cách Spring "inject" (đưa vào) dependency

SPRING LÀM GÌ KHI KHỞI ĐỘNG:

STEP 1: Scan & Parse Metadata
  Đọc tất cả @Component, @Service, @Repository, @Controller
  Đọc @Configuration + @Bean methods
  Đọc XML/Java config
  → Tạo BeanDefinition cho từng bean

STEP 2: Resolve Dependencies
  UserService cần UserRepository → tìm bean UserRepository
  UserRepository cần DataSource → tìm bean DataSource
  → Xây dựng dependency graph

STEP 3: Create Beans (đúng thứ tự!)
  DataSource (không phụ thuộc gì) → tạo trước
  UserRepository (cần DataSource) → tạo sau, inject DataSource
  UserService (cần UserRepository) → tạo sau, inject UserRepository
  UserController (cần UserService) → tạo sau, inject UserService

STEP 4: Post-Processing
  BeanPostProcessor chạy → can thiệp vào bean vừa tạo
  @PostConstruct → gọi init method
  Proxy creation → AOP proxy, Transaction proxy

SAU BƯỚC NÀY:
  ApplicationContext có registry đầy đủ
  Bạn gọi ctx.getBean(UserService.class) → lấy bean đã sẵn sàng

VÍ DỤ CỤ THỂ — Spring tạo object graph:

@Service
class UserService {
    private final UserRepository userRepo;
    private final EmailService emailService;
    
    UserService(UserRepository userRepo, EmailService emailService) {
        this.userRepo = userRepo;
        this.emailService = emailService;
    }
}

Spring thực hiện:
  1. Thấy @Service → đăng ký UserService vào BeanDefinition
  2. Phân tích constructor → cần UserRepository và EmailService
  3. Tìm bean UserRepository → found (từ @Repository)
  4. Tìm bean EmailService → found (từ @Service)
  5. Tạo UserRepository trước (nếu nó cũng có dependency → tạo sâu hơn)
  6. Tạo EmailService
  7. Gọi new UserService(userRepository, emailService)
  8. Đăng ký bean UserService vào context
  
  → BẠN không viết một dòng new nào!
```

---

# 3. ApplicationContext — Bean Registry

## 3.1 ApplicationContext vs BeanFactory

```
BeanFactory:
  - Interface cơ bản nhất
  - Lazy initialization (tạo bean khi cần)
  - Chỉ có DI cơ bản
  - Dùng cho: embedded devices, memory-critical (hiếm)

ApplicationContext (extends BeanFactory):
  - Eager initialization (tạo singleton beans khi startup)
  - Thêm: Events, i18n, AOP, @Transactional, @Async
  - Environment & Property sources
  - Dùng cho: 99% trường hợp thực tế
  
  Implementations:
  AnnotationConfigApplicationContext  → Java config + annotations (standalone)
  ClassPathXmlApplicationContext      → XML config (legacy)
  AnnotationConfigWebApplicationContext → Web app
  SpringApplication (Spring Boot)     → Boot app với auto-config

TẠOTHỦ CÔNG (không Boot):
  ApplicationContext ctx = new AnnotationConfigApplicationContext(AppConfig.class);
  UserService service = ctx.getBean(UserService.class);
```

## 3.2 @Configuration và @Bean

```java
// @Configuration = class chứa bean definitions
// Nó KHÔNG phải just @Component!
// Spring tạo CGLIB proxy của @Configuration class
// → Đảm bảo @Bean methods chỉ được gọi 1 lần (singleton behavior)

@Configuration
public class AppConfig {

    // CGLIB proxy magic:
    // Nếu bạn gọi dataSource() từ trong class này, Spring intercepts
    // → trả về bean đã tạo trong context (không tạo mới!)
    @Bean
    public DataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:postgresql://localhost/mydb");
        return ds;
    }

    @Bean
    public UserRepository userRepository() {
        // Gọi dataSource() — Spring intercept → trả về CÙNG DataSource instance!
        return new JpaUserRepository(dataSource());
    }

    @Bean
    public UserService userService(UserRepository userRepository) {
        // PARAMETER INJECTION: Spring inject bean vào method parameter
        // Tốt hơn gọi userRepository() trực tiếp — explicit dependency
        return new UserService(userRepository);
    }
    
    // BEAN NAMING:
    @Bean(name = "primaryUserService")
    @Primary  // khi có nhiều implementation, dùng cái này
    public UserService primaryService() { ... }
    
    @Bean(name = {"altService", "backupService"})  // multiple names
    public UserService alternativeService() { ... }
    
    // CONDITIONAL BEAN (chỉ tạo khi condition thỏa):
    @Bean
    @ConditionalOnMissingBean(DataSource.class)
    public DataSource h2DataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2).build();
    }
    
    @Bean
    @Profile("production")   // chỉ tạo khi profile=production
    public DataSource productionDataSource() { ... }
    
    @Bean
    @Lazy  // chỉ tạo khi lần đầu được request (không eager)
    public ExpensiveService expensiveService() { ... }
}
```

## 3.3 Component Scanning — Cơ Chế Scan

```java
// @ComponentScan — Spring quét package để tìm beans
@Configuration
@ComponentScan(
    basePackages = "com.example",            // quét package này
    basePackageClasses = Application.class,  // class làm anchor (type-safe)
    includeFilters = @ComponentScan.Filter(
        type = FilterType.ANNOTATION,
        classes = MyCustomAnnotation.class
    ),
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = {TestConfig.class, MockService.class}
    ),
    lazyInit = false  // eager init (default)
)
public class AppConfig { }

// STEREOTYPE ANNOTATIONS — đều là @Component với ngữ nghĩa khác nhau:
@Component      // generic bean
@Service        // business logic layer (semantic marker)
@Repository     // data access layer (THÊM: translates SQL exceptions to Spring exceptions)
@Controller     // web layer (THÊM: marks for MVC scanning)
@RestController // @Controller + @ResponseBody

// @Repository đặc biệt:
// PersistenceExceptionTranslationPostProcessor tự động bắt
// SQL/JPA exceptions và translate sang Spring DataAccessException hierarchy
// → Caller không cần biết bạn đang dùng JPA, Hibernate hay JDBC

// CÁC @Component BỔ SUNG:
@Configuration  // chứa @Bean definitions
@ControllerAdvice  // xử lý exception global cho @Controller
@RestControllerAdvice  // @ControllerAdvice + @ResponseBody
@Aspect         // AOP aspect
@EventListener  // không phải @Component nhưng dùng với @Component classes
```

---

# 4. Bean Definition & Lifecycle

## 4.1 BeanDefinition — Bản Thiết Kế của Bean

```java
// BeanDefinition = metadata mô tả bean
// Được tạo từ: @Component scan, @Bean methods, XML, @Import

// SPRING LƯU NHỮNG GÌ TRONG BeanDefinition:
interface BeanDefinition {
    String getBeanClassName();       // "com.example.UserService"
    String getScope();               // "singleton", "prototype", etc.
    boolean isSingleton();
    boolean isPrototype();
    boolean isAbstract();
    boolean isLazyInit();
    String[] getDependsOn();         // explicit ordering
    String getInitMethodName();      // @PostConstruct / init-method
    String getDestroyMethodName();   // @PreDestroy / destroy-method
    ConstructorArgumentValues getConstructorArgumentValues();
    MutablePropertyValues getPropertyValues();  // setter injection
    boolean isPrimary();
    String getFactoryBeanName();     // từ @Configuration class nào
    String getFactoryMethodName();   // từ @Bean method nào
}

// XEM BeanDefinition lúc runtime (diagnostic):
@Component
class BeanInspector implements ApplicationContextAware {
    private ApplicationContext ctx;
    
    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        this.ctx = ctx;
    }
    
    public void inspect(String beanName) {
        ConfigurableApplicationContext cac = (ConfigurableApplicationContext) ctx;
        BeanDefinition def = cac.getBeanFactory().getBeanDefinition(beanName);
        System.out.println("Class: "   + def.getBeanClassName());
        System.out.println("Scope: "   + def.getScope());
        System.out.println("Lazy: "    + def.isLazyInit());
        System.out.println("Primary: " + def.isPrimary());
    }
}
```

## 4.2 Bean Lifecycle — 11 Bước Chi Tiết

```
SINGLETON BEAN LIFECYCLE (quan trọng nhất):

PHASE 1: INSTANTIATION
  Spring gọi constructor (hoặc factory method)
  → Object được tạo nhưng CHƯA có dependency nào

PHASE 2: POPULATE PROPERTIES (Dependency Injection)
  Field injection: reflection để set field
  Setter injection: gọi setter methods
  Constructor injection: đã inject lúc phase 1
  → Object có đủ dependencies

PHASE 3: BeanNameAware.setBeanName()
  Nếu bean implements BeanNameAware
  → Spring truyền tên bean vào

PHASE 4: BeanFactoryAware / ApplicationContextAware
  Nếu implements các Aware interfaces
  → Spring truyền context vào bean

PHASE 5: BeanPostProcessor.postProcessBeforeInitialization()
  TẤT CẢ BeanPostProcessors chạy
  Đây là nơi Spring thêm infrastructure:
    CommonAnnotationBeanPostProcessor → xử lý @Resource, @PostConstruct
    AutowiredAnnotationBeanPostProcessor → xử lý @Autowired
    AsyncAnnotationBeanPostProcessor → xử lý @Async
    Thêm behavior TRƯỚC khi init

PHASE 6: @PostConstruct / InitializingBean.afterPropertiesSet() / init-method
  Custom init logic của bạn
  Thứ tự: @PostConstruct → afterPropertiesSet() → init-method

PHASE 7: BeanPostProcessor.postProcessAfterInitialization()
  TẤT CẢ BeanPostProcessors chạy LẦN NỮA
  ĐÂY LÀ NƠI PROXY ĐƯỢC TẠO!
    AbstractAdvisorAutoProxyCreator → tạo AOP proxy
    → Transaction proxy (@Transactional)
    → Caching proxy (@Cacheable)
    → Security proxy (@PreAuthorize)
    → Retry proxy (@Retryable)
  
  !! QUAN TRỌNG !!
  Bean đã được publish ra context có thể là PROXY, không phải original object!
  → Gọi service.save() → gọi proxy.save() → gọi original.save()

PHASE 8: Bean READY — đưa vào ApplicationContext
  Bean được đăng ký trong singleton registry
  Sẵn sàng để inject vào nơi khác

[TRONG LÚC DÙNG]
  Request đến → proxy intercepts → advice chạy → original method chạy

PHASE 9: @PreDestroy / DisposableBean.destroy() / destroy-method
  Khi context được đóng (ctx.close() / JVM shutdown)
  Cleanup resources, close connections

Diagram:
  Instantiation
       ↓
  Populate Properties (DI)
       ↓
  Aware interfaces (setBeanName, setApplicationContext...)
       ↓
  BeanPostProcessor.before()  ← @PostConstruct processed here
       ↓
  @PostConstruct / afterPropertiesSet() / init-method
       ↓
  BeanPostProcessor.after()   ← AOP PROXY CREATED HERE !!
       ↓
  [BEAN IN CONTEXT - ready for use]
       ↓
  [CONTEXT CLOSES]
       ↓
  @PreDestroy / destroy() / destroy-method
```

```java
// DEMO đầy đủ bean lifecycle:

@Component
public class DatabaseConnectionPool
    implements BeanNameAware, ApplicationContextAware,
               InitializingBean, DisposableBean {

    private String beanName;
    private ApplicationContext applicationContext;
    private HikariDataSource pool;

    // PHASE 1: Constructor
    public DatabaseConnectionPool() {
        System.out.println("1. Constructor called");
    }

    // PHASE 3: BeanNameAware
    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        System.out.println("2. BeanNameAware: " + name);
    }

    // PHASE 4: ApplicationContextAware
    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        this.applicationContext = ctx;
        System.out.println("3. ApplicationContextAware");
    }

    // PHASE 6a: @PostConstruct (runs before afterPropertiesSet)
    @PostConstruct
    public void postConstruct() {
        System.out.println("4. @PostConstruct");
        // Validate configuration is complete
    }

    // PHASE 6b: InitializingBean
    @Override
    public void afterPropertiesSet() {
        System.out.println("5. afterPropertiesSet — opening connection pool");
        this.pool = new HikariDataSource(config);
        this.pool.setMaximumPoolSize(20);
    }

    // PHASE 9a: @PreDestroy
    @PreDestroy
    public void preDestroy() {
        System.out.println("6. @PreDestroy");
    }

    // PHASE 9b: DisposableBean
    @Override
    public void destroy() {
        System.out.println("7. destroy — closing connection pool");
        if (pool != null) pool.close();
    }
}

// BeanPostProcessor — can thiệp vào MỌI bean:
@Component
public class AuditBeanPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        System.out.println("Before init: " + beanName);
        // có thể return wrapped/different object!
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        System.out.println("After init: " + beanName + " → " + bean.getClass().getSimpleName());
        // Đây là nơi Spring tạo AOP proxy — returns proxy instead of bean!
        return bean;
    }
}
```

---

# 5. Dependency Injection — 3 Cách

## 5.1 Constructor Injection (RECOMMENDED)

```java
// CONSTRUCTOR INJECTION — Spring khuyến nghị
// Spring tự gọi constructor với đúng params

@Service
public class OrderService {

    private final OrderRepository orderRepository;  // final! immutable
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    // Spring detect constructor với @Autowired (hoặc duy nhất 1 constructor → auto)
    // Từ Spring 4.3+: chỉ cần 1 constructor → không cần @Autowired
    @Autowired  // optional nếu chỉ có 1 constructor
    public OrderService(
            OrderRepository orderRepository,
            PaymentService paymentService,
            NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
    }
}

// LOMBOK @RequiredArgsConstructor — generate constructor cho final fields:
@Service
@RequiredArgsConstructor  // generates constructor for all final fields
public class OrderService {
    private final OrderRepository orderRepository;   // injected
    private final PaymentService paymentService;     // injected
    private final NotificationService notifier;      // injected
    // Spring thấy 1 constructor → inject automatically
}

// TẠI SAO CONSTRUCTOR INJECTION TỐT NHẤT:
// ✅ Dependencies rõ ràng (bắt buộc khai báo)
// ✅ final fields → immutable → thread-safe
// ✅ Object luôn fully initialized sau new
// ✅ Dễ test: new OrderService(mockRepo, mockPayment, mockNotifier)
// ✅ Phát hiện circular dependency sớm (at startup)
// ✅ Spring recommended

// CIRCULAR DEPENDENCY với constructor:
// A(B b) và B(A a) → Spring ERROR at startup! (good — catch early)
```

## 5.2 Setter Injection

```java
// SETTER INJECTION — optional dependencies

@Service
public class ReportService {

    private ReportFormatter formatter;   // optional
    private ReportRepository repository; // required

    // REQUIRED: thêm @Autowired required=true (default)
    @Autowired
    public void setRepository(ReportRepository repository) {
        this.repository = repository;
    }

    // OPTIONAL: nếu không có bean → Spring bỏ qua (không exception)
    @Autowired(required = false)
    public void setFormatter(ReportFormatter formatter) {
        this.formatter = formatter;
    }

    // DÙNG KHI:
    // - Dependency thực sự optional
    // - Cần reconfiguration sau khi tạo (hiếm)
    // - Tương thích với JavaBeans API
    
    // NHƯỢC ĐIỂM:
    // - Object có thể partial initialized
    // - Không final → mutable → thread safety concerns
}
```

## 5.3 Field Injection

```java
// FIELD INJECTION — tiện nhưng KHÔNG khuyến nghị

@Service
public class UserService {

    @Autowired  // Spring dùng reflection để inject vào private field
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    // TẠI SAO KHÔNG DÙNG:
    // ❌ Field là private → chỉ Spring (reflection) mới inject được
    // ❌ Khó test: không thể new UserService() rồi inject mock
    //    → Phải dùng @InjectMocks (reflection) hoặc ReflectionTestUtils
    // ❌ Không final → mutable
    // ❌ Che giấu dependencies (không thấy trong constructor)
    // ❌ NullPointerException nếu object được tạo ngoài Spring context
    
    // SonarQube sẽ warn: "Field injection is not recommended"
}

// QUALIFIER — khi có nhiều bean cùng type:
@Service
public class NotificationService {

    @Autowired
    @Qualifier("emailSender")          // chỉ định bean nào
    private MessageSender emailSender;

    @Autowired
    @Qualifier("smsSender")
    private MessageSender smsSender;
    
    // Hoặc dùng @Primary trên bean:
    // @Service @Primary class EmailSender implements MessageSender
    // → @Autowired MessageSender → luôn inject EmailSender
}

// @Resource (JSR-250) — inject by name trước, type sau:
@Resource(name = "primaryDataSource")
private DataSource dataSource;

// @Value — inject từ properties:
@Value("${app.max-connections:10}")   // default = 10
private int maxConnections;

@Value("#{systemProperties['java.home']}")  // SpEL
private String javaHome;

@Value("${app.admins}")               // inject list từ comma-separated
private List<String> adminEmails;
```

## 5.4 @Autowired Internals — Cơ Chế

```
SPRING AUTOWIRING RESOLUTION ORDER:

1. Find candidates by TYPE
   Có bao nhiêu bean implements UserRepository?
   
2. If 0 candidates:
   @Autowired(required=true) → NoSuchBeanDefinitionException
   @Autowired(required=false) → inject null
   Optional<T> → inject Optional.empty()
   
3. If 1 candidate → inject it
   
4. If >1 candidates:
   a. Check @Primary → inject primary bean
   b. Check @Qualifier → inject named bean
   c. Match by field/parameter NAME → try to find bean with same name
   d. Still ambiguous → NoUniqueBeanDefinitionException

VÍ DỤ RESOLUTION:
  interface PaymentGateway {}
  
  @Service @Primary
  class StripeGateway implements PaymentGateway {}
  
  @Service
  class PayPalGateway implements PaymentGateway {}
  
  @Service
  class OrderService {
      @Autowired
      PaymentGateway gateway;  // → injects StripeGateway (@Primary)
      
      @Autowired
      @Qualifier("payPalGateway")
      PaymentGateway backup;   // → injects PayPalGateway (by qualifier)
      
      @Autowired
      List<PaymentGateway> allGateways; // → injects BOTH! [stripe, paypal]
      
      @Autowired
      Map<String, PaymentGateway> gatewayMap;
      // → {"stripeGateway": stripe, "payPalGateway": paypal}
      // key = bean name, value = bean instance
  }
```

---

# 6. Bean Scopes

## 6.1 Scope Types

```java
// SINGLETON (default) — 1 instance cho toàn bộ context
@Service
@Scope("singleton")  // default, không cần khai báo
public class UserService {
    // 1 instance duy nhất, shared across all injections
    // Thread-safe concerns: nếu có state → phải synchronize!
}

// PROTOTYPE — tạo mới mỗi lần request
@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class OrderProcessor {
    private int processedCount = 0;  // ok! mỗi instance có state riêng
    
    public void process(Order order) {
        processedCount++;
    }
}

// Lấy prototype bean:
// ❌ SAI: inject 1 lần vào singleton → chỉ có 1 prototype instance!
@Service
public class OrderService {
    @Autowired
    private OrderProcessor processor;  // VẪN là 1 instance! Singleton inject prototype = problem!
}

// ✅ ĐÚNG: inject ApplicationContext và get mỗi lần
@Service
public class OrderService {
    @Autowired
    private ApplicationContext ctx;
    
    public void process(Order order) {
        OrderProcessor processor = ctx.getBean(OrderProcessor.class);  // new each time!
        processor.process(order);
    }
}

// ✅ HOẶC: ObjectFactory/Provider
@Service
public class OrderService {
    @Autowired
    private ObjectProvider<OrderProcessor> processorProvider;
    
    public void process(Order order) {
        OrderProcessor processor = processorProvider.getObject();  // new each time
        processor.process(order);
    }
}

// REQUEST SCOPE — 1 instance per HTTP request
@Component
@RequestScope  // = @Scope("request")
public class RequestContext {
    private String requestId = UUID.randomUUID().toString();
    private String userId;
    // Sống suốt 1 HTTP request, garbage collected sau đó
}

// SESSION SCOPE — 1 instance per HTTP session
@Component
@SessionScope  // = @Scope("session")
public class ShoppingCart {
    private List<CartItem> items = new ArrayList<>();
    // Sống suốt session của user (login → logout)
}

// APPLICATION SCOPE — 1 instance per ServletContext (similar to singleton for most)
@Component
@ApplicationScope
public class AppStatistics {
    private final AtomicLong requestCount = new AtomicLong();
}
```

## 6.2 Scoped Proxy — Inject Narrow Scope vào Wide Scope

```java
// VẤN ĐỀ: inject request-scoped bean vào singleton
// Singleton được tạo 1 lần — không thể inject request-scoped trực tiếp!

// ❌ SAI: request-scoped bean injected into singleton → Spring ERROR
@Service  // singleton
class OrderService {
    @Autowired
    RequestContext requestContext;  // request-scoped → PROBLEM at startup!
}

// ✅ ĐÚNG: dùng scoped proxy
@Component
@RequestScope
@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)
class RequestContext {
    private String userId;
    // Khi proxyMode=TARGET_CLASS:
    // Spring inject PROXY vào OrderService (singleton)
    // Mỗi khi gọi proxy.getUserId() → proxy lấy REAL instance từ current request scope
    // → OrderService (singleton) hold proxy, proxy delegate to request-scoped real bean
}

// Injection diagram:
// OrderService → holds → RequestContextProxy (singleton proxy)
//                              ↓ (per request)
//                        RequestContext (request-scoped real bean, per request)
```

---

# 7. Spring AOP — Aspect-Oriented Programming

## 7.1 Tại Sao AOP?

```
CROSS-CUTTING CONCERNS: logic được dùng nhiều nơi nhưng không thuộc business:
  - Logging: ghi log trước/sau mỗi method
  - Transactions: begin/commit/rollback xung quanh service methods
  - Security: check quyền trước khi thực thi
  - Caching: check cache trước, store sau
  - Retry: tự động retry khi lỗi
  - Metrics: đo thời gian thực thi

KHÔNG AOP:
  public Order createOrder(Cart cart) {
      log.info("Creating order for {}", cart.getUserId());  // logging boilerplate
      if (!security.hasPermission("ORDER_CREATE")) throw ...  // security boilerplate
      transaction.begin();  // transaction boilerplate
      try {
          Order order = buildOrder(cart);       // ← ACTUAL BUSINESS LOGIC (1 line!)
          orderRepo.save(order);
          transaction.commit();
          metrics.record("createOrder", elapsed);  // metrics boilerplate
          log.info("Order created: {}", order.getId());
          return order;
      } catch (Exception e) {
          transaction.rollback();
          log.error("Order creation failed", e);
          throw e;
      }
  }
  // 1 line business logic, 20 lines boilerplate → DRY violation!

VỚI AOP:
  @Transactional  // AOP handles transaction
  @Secured("ORDER_CREATE")  // AOP handles security
  @Timed  // AOP handles metrics
  @Logged  // AOP handles logging
  public Order createOrder(Cart cart) {
      Order order = buildOrder(cart);  // ← ONLY business logic!
      return orderRepo.save(order);
  }
  // Clean! AOP handles cross-cutting concerns!
```

## 7.2 AOP Concepts — Thuật Ngữ

```
JOIN POINT:
  Điểm trong chương trình mà aspect có thể "nhảy vào"
  Spring AOP: chỉ hỗ trợ METHOD EXECUTION join points
  (AspectJ hỗ trợ: field access, constructor call, etc.)
  
POINTCUT:
  Biểu thức chọn join points nào sẽ áp dụng advice
  "execution(* com.example.service.*.*(..))"  → tất cả methods trong service package
  
ADVICE:
  Code thực sự chạy tại join point
  Types:
    @Before:       chạy TRƯỚC method
    @After:        chạy SAU method (dù success hay exception)
    @AfterReturning: chạy sau method THÀNH CÔNG
    @AfterThrowing:  chạy sau method THROW EXCEPTION
    @Around:       bao quanh method (full control, most powerful)
  
ASPECT:
  Class chứa pointcut + advice
  @Aspect annotation
  
WEAVING:
  Quá trình áp dụng aspect vào target code
  Spring AOP: RUNTIME weaving (tạo proxy object)
  AspectJ: compile-time hoặc load-time weaving
  
TARGET:
  Object gốc được advice bao quanh
  
PROXY:
  Object mà Spring tạo ra thay thế cho target
  Caller gọi proxy → proxy chạy advice → proxy gọi target
```

## 7.3 Spring AOP Proxy — Cơ Chế

```java
// SPRING AOP DÙNG 2 LOẠI PROXY:

// 1. JDK Dynamic Proxy (interface-based):
//    - Target implement interface
//    - Proxy cũng implement interface
//    - Dùng java.lang.reflect.Proxy
//    - NHANH hơn nhưng target phải có interface

// 2. CGLIB Proxy (subclass-based):
//    - Target không có interface (hoặc Spring Boot default)
//    - Spring tạo subclass của target class
//    - Override methods để add advice
//    - Yêu cầu: class không phải final, method không phải final!

@Service  // không implement interface
class OrderService {
    public Order createOrder(Cart cart) { ... }
}

// Spring tạo (CGLIB):
class OrderService$$EnhancerByCGLIB$$abc123 extends OrderService {
    @Override
    public Order createOrder(Cart cart) {
        // TransactionInterceptor.before()
        // LoggingAspect.before()
        Order result = super.createOrder(cart);  // gọi original
        // LoggingAspect.after()
        // TransactionInterceptor.after()
        return result;
    }
}

// SELF-INVOCATION PROBLEM — common gotcha:
@Service
class UserService {
    @Transactional
    public void methodA() {
        this.methodB();  // ← this = real object, NOT PROXY!
    }
    
    @Transactional(propagation = REQUIRES_NEW)
    public void methodB() {
        // @Transactional ở đây BỊ BỎ QUA!
        // vì gọi qua this (real object), không qua proxy
    }
}

// FIX: inject self hoặc dùng AopContext
@Service
public class UserService {
    @Autowired
    private UserService self;  // inject self proxy!
    // hoặc: ((UserService) AopContext.currentProxy()).methodB()
    
    public void methodA() {
        self.methodB();  // ← gọi qua proxy → @Transactional works!
    }
}
```

## 7.4 @Aspect — Viết AOP

```java
@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    // POINTCUT EXPRESSIONS:
    // execution(modifiers? returnType declaringType? methodName(params) throws?)
    
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}    // named pointcut — reuse!
    
    @Pointcut("@annotation(com.example.Logged)")
    public void loggedMethods() {}   // methods với @Logged annotation
    
    @Pointcut("within(com.example..*)")
    public void inAppPackage() {}    // tất cả trong package

    // ── @Before — chạy TRƯỚC method ──
    @Before("serviceLayer()")
    public void logMethodEntry(JoinPoint joinPoint) {
        log.info("→ {}.{}({})",
            joinPoint.getTarget().getClass().getSimpleName(),
            joinPoint.getSignature().getName(),
            Arrays.toString(joinPoint.getArgs()));
    }

    // ── @AfterReturning — chạy sau khi SUCCESS ──
    @AfterReturning(pointcut = "serviceLayer()", returning = "result")
    public void logMethodReturn(JoinPoint jp, Object result) {
        log.info("← {}.{}() returned: {}",
            jp.getTarget().getClass().getSimpleName(),
            jp.getSignature().getName(),
            result);
    }

    // ── @AfterThrowing — chạy khi EXCEPTION ──
    @AfterThrowing(pointcut = "serviceLayer()", throwing = "ex")
    public void logException(JoinPoint jp, Exception ex) {
        log.error("✗ {}.{}() threw: {}",
            jp.getTarget().getClass().getSimpleName(),
            jp.getSignature().getName(),
            ex.getMessage());
    }

    // ── @After — luôn chạy (success hoặc exception) ──
    @After("serviceLayer()")
    public void logMethodFinished(JoinPoint jp) {
        log.debug("Finished: {}", jp.getSignature().getName());
    }

    // ── @Around — POWERFUL: full control ──
    @Around("@annotation(Timed)")
    public Object measureTime(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        String methodName = pjp.getSignature().getName();
        
        try {
            Object result = pjp.proceed();  // gọi original method!
            // proceed() với args khác: pjp.proceed(newArgs)
            long elapsed = System.currentTimeMillis() - start;
            metrics.record(methodName, elapsed);
            log.debug("{} took {}ms", methodName, elapsed);
            return result;
        } catch (Throwable ex) {
            long elapsed = System.currentTimeMillis() - start;
            metrics.recordError(methodName, elapsed);
            throw ex;  // re-throw để caller biết
        }
    }

    // ── CUSTOM ANNOTATION PARAMETER ──
    @Around("@annotation(retryable)")
    public Object retry(ProceedingJoinPoint pjp, Retryable retryable) throws Throwable {
        int maxAttempts = retryable.maxAttempts();  // annotation attribute
        int delayMs     = retryable.delayMs();
        
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return pjp.proceed();
            } catch (RetryableException ex) {
                if (attempt == maxAttempts) throw ex;
                log.warn("Attempt {} failed, retrying in {}ms...", attempt, delayMs);
                Thread.sleep(delayMs);
            }
        }
        throw new IllegalStateException("Should not reach here");
    }
}

// CUSTOM ANNOTATION dùng với AOP:
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Retryable {
    int maxAttempts() default 3;
    int delayMs() default 1000;
}

@Service
class ExternalApiService {
    @Retryable(maxAttempts = 5, delayMs = 500)
    public Response callExternalApi(Request req) {
        return httpClient.post(req);
    }
}
```

---

# 8. Spring MVC — Request Processing Pipeline

## 8.1 DispatcherServlet — Front Controller

```
MỌI request đều đi qua DispatcherServlet (Front Controller Pattern)

HTTP Request
     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DispatcherServlet                            │
│                                                                 │
│  1. HandlerMapping.getHandler()                                 │
│     → Tìm @Controller/@RestController xử lý URL này           │
│     → Trả về HandlerExecutionChain (handler + interceptors)    │
│                                                                 │
│  2. HandlerAdapter.supports(handler)                            │
│     → Tìm adapter phù hợp với handler type                     │
│     → RequestMappingHandlerAdapter (cho @Controller methods)   │
│                                                                 │
│  3. HandlerInterceptor.preHandle()                              │
│     → Chạy các interceptors trước handler                      │
│     → SecurityInterceptor, LoggingInterceptor, etc.            │
│                                                                 │
│  4. HandlerAdapter.handle()                                     │
│     → Gọi @RequestMapping method                               │
│     → Argument resolvers: parse request → method params        │
│     → Method executes                                           │
│     → Return value handlers: convert return → response         │
│                                                                 │
│  5. HandlerInterceptor.postHandle()                             │
│     → Chạy interceptors sau handler (trước render)             │
│                                                                 │
│  6. ViewResolver.resolveViewName() (nếu có ViewName)            │
│     → Tìm template (Thymeleaf, JSP, etc.)                      │
│     → Render view với model data                               │
│                                                                 │
│  7. HandlerInterceptor.afterCompletion()                        │
│     → Cleanup (luôn chạy)                                       │
└─────────────────────────────────────────────────────────────────┘
     ↓
HTTP Response
```

## 8.2 @RequestMapping — Argument Resolvers & Return Handlers

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // ARGUMENT RESOLVERS — Spring tự parse request thành params:

    // @PathVariable — từ URL path
    @GetMapping("/{orderId}")
    public OrderResponse getOrder(
            @PathVariable String orderId) { ... }

    // @RequestParam — từ query string
    @GetMapping
    public Page<OrderResponse> listOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) { ... }

    // @RequestBody — JSON body → Object (via HttpMessageConverter)
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestBody @Valid CreateOrderRequest request,
            BindingResult bindingResult) { ... }

    // @RequestHeader — từ HTTP header
    @GetMapping("/admin")
    public List<OrderResponse> adminList(
            @RequestHeader("X-Admin-Token") String token) { ... }

    // @CookieValue — từ cookie
    @GetMapping("/preferences")
    public Preferences getPreferences(
            @CookieValue("user_prefs") String prefsJson) { ... }

    // HttpServletRequest/Response — raw access
    @GetMapping("/download")
    public void download(HttpServletRequest req, HttpServletResponse res) {
        res.setContentType("application/octet-stream");
        // stream file...
    }

    // Principal — authenticated user (Spring Security)
    @GetMapping("/my-orders")
    public List<OrderResponse> myOrders(Principal principal) {
        return orderService.findByUser(principal.getName());
    }

    // @AuthenticationPrincipal — typed user object
    @GetMapping("/my-profile")
    public UserProfile profile(
            @AuthenticationPrincipal UserDetails userDetails) { ... }

    // Model — for view rendering (non-REST)
    @GetMapping("/view")
    public String viewOrders(Model model, Locale locale) {
        model.addAttribute("orders", orderService.findAll());
        model.addAttribute("title", messageSource.getMessage("title", null, locale));
        return "orders/list";  // view name
    }

    // RETURN VALUE HANDLERS:

    // String → ViewName (for non-@ResponseBody)
    // @ResponseBody (or @RestController) → serialize via HttpMessageConverter
    // ResponseEntity<T> → full HTTP response control
    // HttpEntity<T> → headers + body (no status)
    // ModelAndView → model + view name
    // Callable<T> / DeferredResult<T> → async response
    // StreamingResponseBody → stream response
    
    // ResponseEntity examples:
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody CreateOrderRequest req) {
        Order order = orderService.create(req);
        return ResponseEntity
            .created(URI.create("/api/orders/" + order.getId()))  // 201 Created
            .header("X-Order-Id", order.getId().toString())
            .body(OrderResponse.from(order));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable String id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();  // 204 No Content
    }
}
```

## 8.3 HandlerInterceptor

```java
// Interceptors chạy xung quanh Handler (Controller method)
// Khác Filter: chạy trong Spring context (có access to ApplicationContext)

@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res,
                              Object handler) {
        // Chạy TRƯỚC controller method
        // return true → tiếp tục xử lý
        // return false → dừng, không gọi controller
        
        String requestId = UUID.randomUUID().toString();
        MDC.put("requestId", requestId);  // Mapped Diagnostic Context for logging
        res.setHeader("X-Request-Id", requestId);
        
        log.info("→ {} {} from {}", req.getMethod(), req.getRequestURI(), req.getRemoteAddr());
        req.setAttribute("startTime", System.currentTimeMillis());
        return true;  // continue
    }

    @Override
    public void postHandle(HttpServletRequest req, HttpServletResponse res,
                            Object handler, ModelAndView modelAndView) {
        // Chạy SAU controller, TRƯỚC view rendering
        // modelAndView null cho @ResponseBody
        if (modelAndView != null) {
            modelAndView.addObject("appVersion", appVersion);
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res,
                                 Object handler, Exception ex) {
        // LUÔN chạy sau khi request complete (dù success hay error)
        long elapsed = System.currentTimeMillis() - (Long) req.getAttribute("startTime");
        log.info("← {} {} {}ms {}", 
            req.getMethod(), req.getRequestURI(), elapsed, res.getStatus());
        MDC.clear();  // cleanup MDC
    }
}

// ĐĂNG KÝ interceptor:
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    @Autowired
    private RequestLoggingInterceptor loggingInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(loggingInterceptor)
            .addPathPatterns("/api/**")
            .excludePathPatterns("/api/health", "/api/metrics");
    }
}
```

## 8.4 @ControllerAdvice — Global Exception Handling

```java
@RestControllerAdvice  // = @ControllerAdvice + @ResponseBody
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // CỤ THỂ nhất → CHUNG nhất: Spring chọn handler phù hợp nhất

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleUserNotFound(UserNotFoundException ex, WebRequest req) {
        log.warn("User not found: {}", ex.getUserId());
        return new ErrorResponse("USER_NOT_FOUND", ex.getMessage(), req.getDescription(false));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        List<FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> new FieldError(fe.getField(), fe.getDefaultMessage()))
            .collect(toList());
        return new ValidationErrorResponse("VALIDATION_FAILED", errors);
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleAccessDenied(AccessDeniedException ex) {
        return new ErrorResponse("ACCESS_DENIED", "Insufficient permissions");
    }

    @ExceptionHandler(Exception.class)  // fallback
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleAll(Exception ex, WebRequest req) {
        log.error("Unhandled exception for request: {}", req.getDescription(false), ex);
        return new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    }
    
    // @ModelAttribute trên @ControllerAdvice — add data to ALL controllers' models
    @ModelAttribute("appVersion")
    public String addAppVersion() {
        return "1.0.0";
    }
    
    // @InitBinder — configure data binding for ALL controllers
    @InitBinder
    public void configureBinding(WebDataBinder binder) {
        binder.addValidators(myCustomValidator);
    }
}
```

---

# 9. Spring Data & Transactions

## 9.1 @Transactional — Chi Tiết

```java
// @Transactional WORKS VIA AOP PROXY
// Khi gọi method → proxy intercepts → TransactionInterceptor chạy

@Transactional(
    propagation  = Propagation.REQUIRED,    // behavior khi có/không có tx
    isolation    = Isolation.READ_COMMITTED, // isolation level
    readOnly     = false,                   // true = hint for optimization
    timeout      = 30,                      // 30 seconds timeout
    rollbackFor  = {Exception.class},       // rollback on these exceptions
    noRollbackFor = {BusinessException.class} // don't rollback on these
)
public void transferMoney(String from, String to, BigDecimal amount) {
    accountRepo.debit(from, amount);
    accountRepo.credit(to, amount);
    // Exception here → rollback BOTH operations
}

// PROPAGATION TYPES:
// REQUIRED (default):
//   Có tx? Join it. Không có? Tạo mới.
//   Rollback trong nested → rollback outer!

// REQUIRES_NEW:
//   LUÔN tạo tx mới, suspend current tx nếu có
//   Use: audit logging (phải commit dù outer rollback)

@Service
class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action) {
        auditRepo.save(new AuditLog(action));
        // tx này INDEPENDENT với caller's tx
        // commit ngay cả khi caller rollbacks!
    }
}

// NESTED:
//   Savepoint trong current tx
//   Inner rollback → back to savepoint (không rollback outer)
//   Outer rollback → cũng rollback inner

// SUPPORTS:
//   Có tx? Dùng nó. Không có? Chạy non-transactionally.

// NOT_SUPPORTED:
//   Suspend current tx, chạy non-transactionally

// NEVER:
//   Nếu có tx → throw exception!

// MANDATORY:
//   Phải có tx đang chạy, không thì throw exception

// ISOLATION LEVELS:
// READ_UNCOMMITTED: đọc dirty reads (uncommitted data)
// READ_COMMITTED:   không dirty reads (default PostgreSQL, SQL Server)
// REPEATABLE_READ:  không non-repeatable reads (default MySQL InnoDB)
// SERIALIZABLE:     hoàn toàn isolated (chậm nhất)

// readOnly = true:
// → Không cần dirty checking cho JPA entities
// → Connection pool có thể dùng read replica
// → Database có thể optimize (no locking)
// DÙNG CHO: tất cả query-only methods!

@Transactional(readOnly = true)
public List<User> findActiveUsers() {
    return userRepo.findByStatus(UserStatus.ACTIVE);
}
```

## 9.2 Spring Data JPA — Repository

```java
// Spring Data tự GENERATE IMPLEMENTATION từ interface!
// Không cần implement findByEmail, findByNameContaining, etc.

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Query by method name (Spring generates JPQL):
    Optional<User> findByEmail(String email);
    List<User> findByStatus(UserStatus status);
    List<User> findByNameContainingIgnoreCase(String name);
    List<User> findByAgeGreaterThan(int age);
    List<User> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    long countByStatus(UserStatus status);
    boolean existsByEmail(String email);
    void deleteByStatus(UserStatus status);
    
    // SORTING & PAGING:
    List<User> findByStatus(UserStatus status, Sort sort);
    Page<User> findByStatus(UserStatus status, Pageable pageable);
    Slice<User> findByDepartment(String dept, Pageable pageable);
    
    // @Query — custom JPQL:
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.status = :status")
    Optional<User> findByEmailAndStatus(@Param("email") String email,
                                         @Param("status") UserStatus status);
    
    // Native SQL:
    @Query(value = "SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days'",
           nativeQuery = true)
    List<User> findRecentUsers();
    
    // @Modifying — UPDATE/DELETE queries:
    @Modifying
    @Transactional  // @Modifying queries need @Transactional!
    @Query("UPDATE User u SET u.status = :status WHERE u.id IN :ids")
    int updateStatusBatch(@Param("status") UserStatus status,
                           @Param("ids") List<Long> ids);
    
    // PROJECTIONS — chỉ lấy fields cần thiết (tránh N+1, less memory):
    List<UserSummary> findByStatus(UserStatus status);
    
    interface UserSummary {
        Long getId();
        String getName();
        String getEmail();
        // Spring generates proxy implementation!
    }
    
    // SPECIFICATIONS — dynamic queries:
    List<User> findAll(Specification<User> spec);
}

// Dùng Specification:
Specification<User> spec = Specification.where(
    UserSpecs.hasStatus(UserStatus.ACTIVE)
    .and(UserSpecs.createdAfter(LocalDate.now().minusDays(30)))
    .and(UserSpecs.inDepartment("Engineering"))
);
List<User> users = userRepo.findAll(spec);

// HOW SPRING DATA WORKS INTERNALLY:
// JpaRepositoryFactoryBean tạo proxy implementation
// SimpleJpaRepository là base implementation
// Query method names → SimpleJpaQueryCreator → JPQL → SQL
```

---

# 10. Spring Security Architecture

## 10.1 Security Filter Chain

```
Request
  ↓
┌─────────────────────────────────────────────────────────────────┐
│               Spring Security Filter Chain                      │
│  (một chuỗi javax.servlet.Filter)                               │
│                                                                 │
│  SecurityContextPersistenceFilter                               │
│    → Load SecurityContext từ session/header                     │
│                                                                 │
│  UsernamePasswordAuthenticationFilter (hoặc custom)            │
│    → Parse credentials (username/password, JWT, OAuth)         │
│    → AuthenticationManager.authenticate()                       │
│    → Set SecurityContext                                        │
│                                                                 │
│  ExceptionTranslationFilter                                     │
│    → Catch AccessDeniedException → 403                         │
│    → Catch AuthenticationException → 401                       │
│                                                                 │
│  FilterSecurityInterceptor (or AuthorizationFilter)             │
│    → Check permissions: @PreAuthorize, URL patterns            │
│    → AccessDecisionManager.decide()                             │
└─────────────────────────────────────────────────────────────────┘
  ↓
Controller
```

## 10.2 Authentication Flow

```java
// AUTHENTICATION: "Who are you?"

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)  // for REST APIs
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    AuthenticationManager authManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // strength 12
    }
    
    @Bean
    UserDetailsService userDetailsService() {
        return username -> {
            User user = userRepo.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
            return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .authorities(user.getPermissions().stream()
                    .map(p -> new SimpleGrantedAuthority(p.getName()))
                    .collect(toList()))
                .build();
        };
    }
}

// JWT FILTER:
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                     HttpServletResponse res,
                                     FilterChain chain) throws IOException, ServletException {
        String authHeader = req.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }
        
        String token = authHeader.substring(7);
        
        try {
            Claims claims = jwtService.parseToken(token);
            String username = claims.getSubject();
            
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                
                // Set authentication in SecurityContext
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (JwtException e) {
            // Invalid token → continue without setting authentication
            // → FilterSecurityInterceptor will deny access
        }
        
        chain.doFilter(req, res);
    }
}

// AUTHORIZATION: "What can you do?"
@Service
public class OrderService {

    @PreAuthorize("hasRole('ADMIN') or @orderSecurity.isOwner(#orderId, authentication)")
    public void cancelOrder(String orderId) { ... }
    
    @PreAuthorize("hasAuthority('ORDER_READ') and #userId == authentication.principal.id")
    public List<Order> getUserOrders(Long userId) { ... }
    
    @PostAuthorize("returnObject.userId == authentication.principal.id")
    public Order getOrder(String orderId) { ... }  // check AFTER method returns
}

// Lấy current user:
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
String username = auth.getName();
UserDetails user = (UserDetails) auth.getPrincipal();
Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();
```

---

# 11. Spring Events & Environment

## 11.1 Application Events

```java
// SPRING EVENTS — loose coupling giữa components

// ĐỊNH NGHĨA event:
public class UserRegisteredEvent extends ApplicationEvent {
    private final User user;
    
    public UserRegisteredEvent(Object source, User user) {
        super(source);
        this.user = user;
    }
    
    public User getUser() { return user; }
}

// PUBLISH event:
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final ApplicationEventPublisher eventPublisher;
    
    @Transactional
    public User register(CreateUserRequest req) {
        User user = userRepository.save(buildUser(req));
        // Publish event — listeners handle their own concerns
        eventPublisher.publishEvent(new UserRegisteredEvent(this, user));
        return user;
        // UserService không biết gì về email, notification, analytics
    }
}

// LISTEN to event:
@Component
public class WelcomeEmailListener {
    
    @EventListener
    @Async  // xử lý async (không block event publisher)
    @Order(1)  // thứ tự nếu có nhiều listeners cùng event
    public void onUserRegistered(UserRegisteredEvent event) {
        emailService.sendWelcome(event.getUser().getEmail());
    }
}

@Component
public class AnalyticsListener {
    
    @EventListener
    @Async
    public void trackRegistration(UserRegisteredEvent event) {
        analyticsService.track("user_registered", event.getUser().getId());
    }
}

// TRANSACTIONAL EVENTS — listen sau khi transaction COMMIT:
@Component
public class EmailAfterCommitListener {
    
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserRegistered(UserRegisteredEvent event) {
        // Chỉ chạy sau khi transaction đã COMMIT thành công!
        // Quan trọng: không gửi email nếu transaction rollback
        emailService.sendWelcome(event.getUser().getEmail());
    }
    
    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    public void onRollback(UserRegisteredEvent event) {
        log.warn("Registration rolled back for: {}", event.getUser().getEmail());
    }
}

// BUILT-IN APPLICATION EVENTS:
@Component
public class AppLifecycleListener {
    
    @EventListener(ContextRefreshedEvent.class)
    public void onContextRefreshed(ContextRefreshedEvent event) {
        // Context đã initialized/refreshed
        // ALL beans ready
    }
    
    @EventListener(ContextStartedEvent.class)
    public void onStart() { log.info("Application started!"); }
    
    @EventListener(ContextStoppedEvent.class)
    public void onStop() { log.info("Application stopping..."); }
    
    @EventListener(ContextClosedEvent.class)
    public void onClose() {
        // Cleanup resources
    }
}
```

## 11.2 Environment & PropertySources

```java
// SPRING ENVIRONMENT — unified access to configuration

@Component
public class ConfigDemo {
    
    @Autowired
    private Environment env;
    
    public void demo() {
        String host = env.getProperty("db.host");
        int port    = env.getProperty("db.port", Integer.class, 5432);
        boolean ssl = env.getProperty("db.ssl", Boolean.class, false);
        
        // Check active profiles:
        boolean isProd = env.acceptsProfiles(Profiles.of("production"));
        String[] activeProfiles = env.getActiveProfiles();
    }
}

// PROPERTYSOURCE HIERARCHY (sau ghi đè trước):
// 1. Command line args:        --server.port=8081
// 2. System properties:        -Dserver.port=8081
// 3. System environment vars:  SERVER_PORT=8081
// 4. application-{profile}.properties
// 5. application.properties
// 6. @PropertySource in @Configuration
// 7. Default values in code

// @PropertySource — thêm property file:
@Configuration
@PropertySource("classpath:custom.properties")
@PropertySource(value = "file:/etc/myapp/secret.properties", ignoreResourceNotFound = true)
public class AppConfig { }

// @ConfigurationProperties — bind nhiều properties vào POJO:
@ConfigurationProperties(prefix = "app.database")
@Validated  // validate values
public class DatabaseProperties {
    @NotBlank
    private String host;
    @Min(1) @Max(65535)
    private int port = 5432;
    @NotBlank
    private String name;
    private Pool pool = new Pool();
    
    public static class Pool {
        private int maxSize = 10;
        private int minIdle = 2;
        private Duration connectionTimeout = Duration.ofSeconds(30);
        // getters/setters
    }
    // getters/setters
}

// application.properties:
// app.database.host=postgres.example.com
// app.database.port=5432
// app.database.name=mydb
// app.database.pool.max-size=20
// app.database.pool.connection-timeout=PT30S
```

---

## 📎 Quick Reference

```
IoC:          Spring tạo và quản lý objects (beans)
DI:           Spring inject dependencies vào beans
BeanFactory:  lazy, basic DI
ApplicationContext: eager, AOP, Events, i18n (dùng cái này!)
@Component:   generic bean
@Service:     business layer
@Repository:  data layer + exception translation
@Controller:  web layer
Bean scope:   singleton (default) → prototype → request → session
Lifecycle:    Constructor → DI → Aware → BPP.before → @PostConstruct → BPP.after → [USE] → @PreDestroy
AOP proxy:    JDK (interface) hoặc CGLIB (subclass)
@Transactional: AOP proxy around method, REQUIRES_NEW = independent tx
Self-invoke:  this.method() bypasses proxy! Inject self hoặc AopContext
@Autowired:   by type → @Primary → @Qualifier → by name
DispatcherServlet: routes request → HandlerMapping → HandlerAdapter → Controller
@ControllerAdvice: global exception handling
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Spring Core (IoC) | <https://docs.spring.io/spring-framework/docs/current/reference/html/core.html> |
| Spring AOP | <https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop> |
| Spring MVC | <https://docs.spring.io/spring-framework/docs/current/reference/html/web.html> |
| Spring Data JPA | <https://docs.spring.io/spring-data/jpa/docs/current/reference/html/> |
| Spring Security | <https://docs.spring.io/spring-security/reference/> |
| Spring Transaction | <https://docs.spring.io/spring-framework/docs/current/reference/html/data-access.html> |
