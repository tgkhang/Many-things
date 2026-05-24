# 🏛️ DDD & MVC — Architecture Deep Dive
>
> Domain-Driven Design, MVC, Layered Architecture, Hexagonal, CQRS, Event Sourcing

---

## 📚 Table of Contents

1. [Architecture Fundamentals](#1-architecture-fundamentals)
2. [MVC — Model View Controller](#2-mvc--model-view-controller)
3. [MVC Variants — MVP, MVVM, MVT](#3-mvc-variants--mvp-mvvm-mvt)
4. [Layered Architecture](#4-layered-architecture)
5. [DDD — Domain-Driven Design Overview](#5-ddd--domain-driven-design-overview)
6. [DDD Strategic Design](#6-ddd-strategic-design)
7. [DDD Tactical Design — Building Blocks](#7-ddd-tactical-design--building-blocks)
8. [DDD Repository & Domain Services](#8-ddd-repository--domain-services)
9. [Hexagonal Architecture (Ports & Adapters)](#9-hexagonal-architecture-ports--adapters)
10. [CQRS — Command Query Responsibility Segregation](#10-cqrs--command-query-responsibility-segregation)
11. [Event Sourcing](#11-event-sourcing)
12. [DDD + Spring Boot — Full Implementation](#12-ddd--spring-boot--full-implementation)
13. [Architecture Anti-Patterns](#13-architecture-anti-patterns)
14. [When to Use What](#14-when-to-use-what)

---

# 1. Architecture Fundamentals

## 1.1 Why Architecture Matters

```
Bad architecture causes:
  "Big Ball of Mud" — everything connected to everything
  → Change one thing → break 10 other things
  → Feature takes 2 weeks that should take 2 hours
  → New developer needs 3 months to understand codebase
  → Testing nearly impossible (tight coupling)
  → Deployment is terrifying

Good architecture:
  → Changes isolated to relevant modules
  → New feature = add code, not change existing
  → Test in isolation
  → Reason about one part without understanding all parts
  → Multiple teams work independently

FUNDAMENTAL GOALS:
  Separation of Concerns: each module has ONE clear responsibility
  Loose Coupling:        modules can change without affecting others
  High Cohesion:         related things are together
  Dependency Rule:       dependencies point INWARD (toward business logic)
```

## 1.2 Architecture Evolution

```
1970s-80s:  Procedural, spaghetti code
1990s:      Object-Oriented, N-Tier (Client/Server/DB)
2000s:      MVC, SOA (Service-Oriented Architecture)
2003:       Domain-Driven Design (Eric Evans' Blue Book)
2005:       Hexagonal Architecture (Alistair Cockburn)
2008:       CQRS & Event Sourcing (Greg Young)
2010s:      Microservices, Clean Architecture (Robert Martin)
2020s:      Modular Monolith, MACH, micro-frontends

KEY INSIGHT: Architecture solves the complexity problem
  As domain complexity grows → need more structure
  Simple CRUD app: MVC is fine
  Complex business rules: DDD becomes essential
  Multiple teams: bounded contexts, microservices
```

---

# 2. MVC — Model View Controller

## 2.1 MVC Concept

```
MVC separates application into 3 components:

  MODEL:       business data + business rules
               "What the application knows and does"
               
  VIEW:        presentation / user interface
               "How data is displayed to users"
               
  CONTROLLER:  handles user input, orchestrates model and view
               "Responds to events, updates model"

FLOW:
  User → (input) → Controller
  Controller → (updates) → Model
  Model → (notifies) → View
  View → (displays) → User

┌──────────────────────────────────────────────────────────────┐
│                        User                                  │
│                       /    \                                 │
│              (input) /      \ (displays)                    │
│                     ▼        ▼                               │
│              Controller    View                              │
│                     │        ▲                               │
│              (modifies)  (observes/queries)                  │
│                     ▼        │                               │
│                      Model ──┘                               │
└──────────────────────────────────────────────────────────────┘

ORIGINAL MVC (Smalltalk, 1979 — Trygve Reenskaug):
  Observer pattern: Model notifies Views of changes
  View subscribes to Model events
  Multiple Views can show same Model differently

WEB MVC (modern, request-response):
  No continuous observation (stateless HTTP)
  Controller receives request, asks Model, returns rendered View
  One request → one response cycle
```

## 2.2 MVC in Web Frameworks

```java
// ── SPRING MVC (Java) ──

// MODEL: business data
public class User {
    private Long id;
    private String name;
    private String email;
    private UserStatus status;
    // getters, setters...
}

// MODEL LAYER: Service handles business logic
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(CreateUserRequest request) {
        validateUniqueEmail(request.getEmail());
        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .status(UserStatus.ACTIVE)
            .build();
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    private void validateUniqueEmail(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException(email);
        }
    }
}

// CONTROLLER: handles HTTP, delegates to Service
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserResponse> response = users.stream()
            .map(UserResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // POST /api/users
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @RequestBody @Valid CreateUserRequest request) {
        User user = userService.createUser(request);
        return ResponseEntity
            .created(URI.create("/api/users/" + user.getId()))
            .body(UserResponse.from(user));
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return userService.findById(id)
            .map(UserResponse::from)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}

// VIEW: in REST API = JSON response (DTO)
public record UserResponse(
    Long id,
    String name,
    String email,
    UserStatus status
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getStatus()
        );
    }
}

// ── REQUEST FLOW ──
// HTTP GET /api/users
//   → DispatcherServlet (Front Controller)
//   → routes to UserController.getAllUsers()
//   → calls UserService.getAllUsers()
//   → UserService queries UserRepository
//   → returns List<User>
//   → Controller maps to List<UserResponse>
//   → Jackson serializes to JSON
//   → HTTP 200 with JSON body
```

## 2.3 MVC Request Lifecycle (Spring)

```
                    HTTP Request
                         │
                         ▼
              ┌──────────────────────┐
              │  DispatcherServlet   │  ← Front Controller
              │  (single entry point)│
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │  HandlerMapping      │  ← find which Controller handles URL
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │  HandlerAdapter      │  ← invoke Controller method
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │    Controller        │  ← @RestController/@Controller
              │  (your code here)    │
              └──────────┬───────────┘
                         │ calls
              ┌──────────▼───────────┐
              │    Service Layer     │  ← business logic
              └──────────┬───────────┘
                         │ uses
              ┌──────────▼───────────┐
              │   Repository/DAO     │  ← data access
              └──────────┬───────────┘
                         │
                    Database
                         │
              ┌──────────┴───────────┐
              │  ModelAndView /      │
              │  ResponseEntity      │  ← View
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │  ViewResolver /      │
              │  MessageConverter    │  ← JSON/HTML rendering
              └──────────┬───────────┘
                         │
                    HTTP Response

Filters & Interceptors run AROUND this flow:
  Filters (Servlet level): authentication, CORS, logging
  Interceptors (Spring level): preHandle, postHandle, afterCompletion
```

## 2.4 MVC Strengths & Weaknesses

```
✅ STRENGTHS:
  Separation of concerns (UI ≠ Business Logic ≠ Data)
  Independent development (UI dev ≠ backend dev)
  Easy to test controllers in isolation
  Well-understood, universal pattern
  Framework support (Spring MVC, Rails, Django, Laravel, ASP.NET MVC)

❌ WEAKNESSES:
  Controller can become FAT with complex orchestration
  "Model" is ambiguous — often becomes a thin data holder
  No clear guidance on business logic organization
  Doesn't handle complex domain logic well
  View-Controller coupling can be tight (especially in desktop apps)

COMMON MVC MISTAKES:
  Fat Controller: business logic in controller (should be in Service/Model)
  Anemic Model: model = just getters/setters, no behavior
  Thin Service: service just delegates to repository, no logic
  Direct Entity exposure: returning JPA entities from controller (leaks internals)
  Missing DTO: controller receives/returns entities directly
```

---

# 3. MVC Variants — MVP, MVVM, MVT

## 3.1 MVP — Model View Presenter

```
Used heavily in: Android (classic), desktop apps, Winforms

Differences from MVC:
  Presenter replaces Controller
  View is PASSIVE — has no logic, just renders
  Presenter contains ALL UI logic
  Presenter holds reference to View (via interface)
  View holds reference to Presenter
  View and Model DON'T communicate directly!

FLOW:
  User → View → Presenter → Model
  Model → Presenter → View (updates)

      ┌──────┐        ┌───────────┐        ┌───────┐
      │ View │◄──────▶│ Presenter │◄──────▶│ Model │
      └──────┘        └───────────┘        └───────┘
      (passive)    (all UI logic)    (business logic)

BENEFIT: View is easily testable (just an interface)
  → Can test Presenter without real UI!
  → View implements IView interface → can mock it in tests
```

```java
// MVP in Android (classic style):

// VIEW INTERFACE — all UI interactions abstracted
interface LoginView {
    void showLoading();
    void hideLoading();
    void showError(String message);
    void navigateToDashboard(User user);
    String getEmail();
    String getPassword();
}

// PRESENTER — all UI logic here
class LoginPresenter {
    private final LoginView view;
    private final AuthService authService;

    LoginPresenter(LoginView view, AuthService authService) {
        this.view = view;
        this.authService = authService;
    }

    void onLoginButtonClicked() {
        String email    = view.getEmail();
        String password = view.getPassword();

        if (email.isEmpty()) {
            view.showError("Email cannot be empty");
            return;
        }

        view.showLoading();
        authService.login(email, password)
            .subscribe(
                user -> {
                    view.hideLoading();
                    view.navigateToDashboard(user);
                },
                error -> {
                    view.hideLoading();
                    view.showError(error.getMessage());
                }
            );
    }
}

// VIEW IMPLEMENTATION (Android Activity)
class LoginActivity extends AppCompatActivity implements LoginView {
    private LoginPresenter presenter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // ...
        presenter = new LoginPresenter(this, new AuthServiceImpl());
        loginButton.setOnClickListener(v -> presenter.onLoginButtonClicked());
    }

    @Override public void showLoading()  { progressBar.setVisibility(VISIBLE); }
    @Override public void hideLoading()  { progressBar.setVisibility(GONE); }
    @Override public void showError(String msg) { Toast.makeText(this, msg).show(); }
    @Override public String getEmail()    { return emailInput.getText().toString(); }
    @Override public String getPassword() { return passwordInput.getText().toString(); }
    @Override public void navigateToDashboard(User user) {
        startActivity(new Intent(this, DashboardActivity.class));
    }
}
```

## 3.2 MVVM — Model View ViewModel

```
Used in: Android (modern/Jetpack), WPF, Angular, Vue.js, SwiftUI

Key idea: DATA BINDING — View automatically reflects ViewModel state
  ViewModel exposes observable data (LiveData, StateFlow, Observable)
  View BINDS to ViewModel observables
  No direct reference: ViewModel → View (unlike MVP!)
  → ViewModel doesn't know about View implementation!

FLOW:
  User → View → ViewModel (commands) → Model
  Model → ViewModel (data) → View (auto-updates via binding)

      ┌──────┐  data binding   ┌───────────┐        ┌───────┐
      │ View │◄────────────────│ ViewModel │◄──────▶│ Model │
      │      │────(commands)──▶│           │        └───────┘
      └──────┘                 └───────────┘
                          (no View reference!)

BENEFIT: ViewModel easily unit-testable (no Android framework dependency)
         View can be swapped (different platforms, same ViewModel)
```

```kotlin
// MVVM in Android with Jetpack (Kotlin):

// MODEL (Repository pattern)
class UserRepository(private val api: UserApi, private val db: UserDao) {
    suspend fun getUser(id: Long): Result<User> = 
        try { Result.success(api.getUser(id)) }
        catch (e: Exception) { 
            db.getUser(id)?.let { Result.success(it) } 
            ?: Result.failure(e) 
        }
}

// VIEWMODEL — exposes state as Flow/LiveData
class UserViewModel(private val repository: UserRepository) : ViewModel() {

    // UI STATE — immutable from View's perspective
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    sealed class UiState {
        object Loading : UiState()
        data class Success(val user: User) : UiState()
        data class Error(val message: String) : UiState()
    }

    // INTENT — user actions flow into ViewModel
    fun loadUser(id: Long) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            repository.getUser(id)
                .onSuccess { _uiState.value = UiState.Success(it) }
                .onFailure { _uiState.value = UiState.Error(it.message ?: "Unknown error") }
        }
    }
}

// VIEW (Compose or Fragment) — observes ViewModel
@Composable
fun UserScreen(viewModel: UserViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    when (uiState) {
        is UiState.Loading -> CircularProgressIndicator()
        is UiState.Success -> UserCard(user = (uiState as UiState.Success).user)
        is UiState.Error   -> ErrorMessage(message = (uiState as UiState.Error).message)
    }

    LaunchedEffect(Unit) { viewModel.loadUser(123L) }
}
```

## 3.3 Comparison Table

```
                MVC          MVP          MVVM
─────────────────────────────────────────────────────────────────────
UI logic in     Controller   Presenter    ViewModel
View passivity  Moderate     Fully passive Active (binds to VM)
VM→View ref     Yes          Yes          NO (observes only)
Data binding    Manual       Manual       Automatic
Testability     Medium       High         Very High
Framework       Spring, Rails Android(old) Android(new), WPF, Vue
Coupling        Medium       Lower        Lowest
Best for        Web APIs     Desktop/Android Mobile/Desktop/Web
```

---

# 4. Layered Architecture

## 4.1 Traditional Three-Tier

```
Classic enterprise layering:

┌──────────────────────────────────────────┐
│         PRESENTATION LAYER               │
│   Controllers, REST endpoints, Views     │
│   Handles: HTTP, serialization, routing  │
├──────────────────────────────────────────┤
│          BUSINESS LAYER                  │
│   Services, Use Cases, Business Rules    │
│   Handles: validation, orchestration     │
├──────────────────────────────────────────┤
│           DATA LAYER                     │
│   Repositories, DAOs, ORM Entities       │
│   Handles: DB access, querying           │
├──────────────────────────────────────────┤
│           DATABASE                       │
│   PostgreSQL, MySQL, MongoDB...          │
└──────────────────────────────────────────┘

DEPENDENCY RULE in layered architecture:
  Each layer only depends on layer BELOW it
  Upper layers are "dirtier" (I/O, frameworks)
  Lower layers are "purer" (domain logic)

PROBLEM with naive layering:
  Business layer depends on Data layer (imports Repository interfaces)
  → Business logic coupled to persistence technology!
  → Can't test Business layer without DB
  
  Solution: Dependency Inversion (DIP)
  → Business layer defines Repository INTERFACE
  → Data layer IMPLEMENTS that interface
  → Business layer doesn't depend on implementation!
```

## 4.2 Onion Architecture

```
Robert C. Martin, 2008 (Clean Architecture)
"Dependency Rule": code dependencies ONLY point INWARD

      ┌─────────────────────────────────────────────┐
      │             Frameworks & Drivers             │ ← outermost: details
      │  (Web, DB, UI, External Services, Devices)  │
      │    ┌─────────────────────────────────────┐   │
      │    │     Interface Adapters               │   │
      │    │  (Controllers, Presenters, Gateways) │   │
      │    │    ┌─────────────────────────────┐   │   │
      │    │    │     Application Business    │   │   │
      │    │    │          Rules              │   │   │
      │    │    │     (Use Cases/Services)    │   │   │
      │    │    │    ┌─────────────────────┐  │   │   │
      │    │    │    │   Enterprise        │  │   │   │
      │    │    │    │  Business Rules     │  │   │   │
      │    │    │    │   (Entities/Domain) │  │   │   │
      │    │    │    └─────────────────────┘  │   │   │
      │    │    └─────────────────────────────┘   │   │
      │    └─────────────────────────────────────┘   │
      └─────────────────────────────────────────────┘

INNERMOST RING (Entities): Pure business rules, no framework dependency
  Domain objects, business logic, domain rules
  Could run without database, HTTP, UI

APPLICATION (Use Cases): Application-specific business rules
  Orchestrate entities, define what system does
  Doesn't know about HTTP, DB format, UI

INTERFACE ADAPTERS: Convert data between formats
  MVC Controllers (adapt HTTP → Use Cases)
  Repository Implementations (adapt Domain → DB)
  Presenters (adapt Use Case output → View format)

FRAMEWORKS: Frameworks and tools
  Spring, Hibernate, React, DB drivers
  Plugin-like: replaceable without affecting inner rings

DEPENDENCY RULE:
  ✅ Inner layer → NO dependency on outer layers
  ✅ Outer layer → CAN depend on inner layers
  ❌ Domain → Repository Implementation (outer)
  ✅ Domain → Repository Interface (defined in Domain)
  ✅ Repository Implementation → Repository Interface
```

---

# 5. DDD — Domain-Driven Design Overview

## 5.1 What is DDD?

```
DDD = approach to software development that focuses on:
  1. Deep understanding of DOMAIN (business problem)
  2. Model domain in code with UBIQUITOUS LANGUAGE
  3. Isolate domain from infrastructure concerns

WHO: Eric Evans, "Domain-Driven Design" (Blue Book, 2003)
     Vaughn Vernon, "Implementing DDD" (Red Book, 2013)

CORE IDEA:
  Most complexity in enterprise software is DOMAIN complexity
  Not technology complexity
  → Tech team must understand domain DEEPLY
  → Domain experts and developers SHARE a common language
  → Code should READ like the business domain

"If you can't understand what the code does without understanding the technology,
 then the model is buried under the implementation." — Eric Evans

WHEN TO USE DDD:
  ✅ Complex business rules (finance, healthcare, logistics, legal)
  ✅ Domain knowledge is specialized and evolving
  ✅ Long-lived software (5+ years)
  ✅ Multiple teams, multiple bounded contexts
  ✅ Business processes that go beyond simple CRUD

WHEN NOT TO USE DDD:
  ❌ Simple CRUD applications (admin panels, basic blogs)
  ❌ Short-lived projects
  ❌ Domain is well-understood and stable
  ❌ Small team, small codebase
  → DDD has overhead; apply selectively

TWO SPACES of DDD:
  STRATEGIC DESIGN: how to organize large system
    Bounded Contexts, Context Maps, Ubiquitous Language
  
  TACTICAL DESIGN: how to model inside a bounded context
    Entities, Value Objects, Aggregates, Repositories, Services, Events
```

## 5.2 Ubiquitous Language

```
UBIQUITOUS LANGUAGE: shared vocabulary between domain experts + developers
  Used in: conversations, documentation, code, tests
  Eliminates translation layer between business and tech

WITHOUT ubiquitous language:
  Business: "customer places order, payment captured, order fulfilled"
  Code: UserTable → OrderRecord → TransactionRow → FulfillmentJob
  
  Developer must constantly translate → understanding lost → bugs

WITH ubiquitous language:
  Business: "customer places order, payment captured, order fulfilled"
  Code: customer.placeOrder(...) → order.capturePayment(...) → order.fulfill(...)
  
  Code READS like the domain!

EXAMPLE: Banking Domain
  Wrong naming:     BankDbRecord, AccountProcessor, MoneyTransferUtil
  Correct naming:   BankAccount, AccountHolder, MoneyTransfer, Transaction

  Wrong method:     account.processDebit(amount)
  Correct method:   account.debit(Money amount)

  Wrong:            account.balance < amount → throw Exception("insufficient")
  Correct:          account.debit(amount) throws InsufficientFundsException

HOW TO BUILD:
  1. Domain experts describe the business verbally
  2. Capture the nouns (entities), verbs (actions), adjectives (states)
  3. Discuss with domain experts — question unclear terms
  4. Refine continuously as understanding grows
  5. Update code when language evolves
  
ANTI-PATTERNS:
  Tech terms in domain: "serialize order", "cache customer", "index products"
  Generic terms: "Manager", "Helper", "Processor", "Handler", "Util"
  Abbreviations: "cust" instead of "customer", "amt" instead of "amount"
```

---

# 6. DDD Strategic Design

## 6.1 Bounded Context

```
BOUNDED CONTEXT: explicit boundary within which a domain model applies
  Inside boundary: terms have SPECIFIC, CONSISTENT meaning
  Different bounded contexts may use SAME term DIFFERENTLY

Real-world example: "Customer"
  SALES context:       Customer = prospect + buyer, has potential value, pipeline stage
  SUPPORT context:     Customer = person with problems to solve, has ticket history
  BILLING context:     Customer = account with billing address, payment methods, invoices
  SHIPPING context:    Customer = delivery address, delivery preferences

  ALL use the word "Customer" but they mean DIFFERENT THINGS!
  → Each bounded context has its OWN Customer model
  → No need for a single "unified" Customer model (would be too complex)

WRONG approach (without bounded contexts):
  One giant Customer class with 50+ fields covering all contexts
  → Changes for billing affect shipping code
  → Testing requires understanding all contexts
  → Teams step on each other

RIGHT approach (with bounded contexts):
  SalesContext.Customer      { name, email, leadScore, pipelineStage }
  SupportContext.Customer    { name, email, ticketHistory, priority }
  BillingContext.Customer    { name, billingAddress, paymentMethods }
  ShippingContext.Customer   { name, deliveryAddress, deliveryPrefs }

Each is INDEPENDENTLY deployable, testable, changeable!

E-COMMERCE bounded contexts example:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
  │  │   Catalog    │    │   Ordering   │    │   Shipping   │  │
  │  │              │    │              │    │              │  │
  │  │  Product     │    │  Order       │    │  Shipment    │  │
  │  │  Category    │    │  OrderItem   │    │  Address     │  │
  │  │  Inventory   │    │  Cart        │    │  Carrier     │  │
  │  └──────────────┘    └──────────────┘    └──────────────┘  │
  │                                                              │
  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
  │  │   Payment    │    │  Customer    │    │  Notification │  │
  │  │              │    │  Identity    │    │              │  │
  │  │  Payment     │    │              │    │  Email       │  │
  │  │  Invoice     │    │  User        │    │  SMS         │  │
  │  │  Refund      │    │  Profile     │    │  Push        │  │
  │  └──────────────┘    └──────────────┘    └──────────────┘  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

## 6.2 Context Map

```
CONTEXT MAP: shows relationships between bounded contexts

RELATIONSHIP PATTERNS:

SHARED KERNEL:
  Two contexts share a subset of domain model
  Changes must be agreed upon by both teams
  Risky but reduces duplication
  ──── Shared Kernel ────
  Context A ↔ Context B

CUSTOMER-SUPPLIER:
  Upstream (supplier) provides API
  Downstream (customer) uses it
  Upstream should accommodate downstream needs
  
  Catalog → [API] → Ordering
  (Catalog is upstream, Ordering is downstream)

CONFORMIST:
  Downstream adopts upstream's model blindly
  No influence over upstream
  Common with external services (payment gateways, AWS)
  
  Our System → [conforms to] → Stripe API

ANTICORRUPTION LAYER (ACL):
  Downstream protects itself from upstream's model
  Translation layer converts upstream model → downstream model
  Most important pattern when models differ significantly!
  
  Our System ↔ [ACL] ↔ Legacy System
  (ACL translates legacy "client number" → our "customerId")

OPEN HOST SERVICE:
  Context publishes a protocol/API for others to use
  Well-documented, versioned
  Like a public API contract

PUBLISHED LANGUAGE:
  Well-documented shared language between contexts
  Often combined with Open Host Service
  Examples: JSON:API, GraphQL schema, Protobuf definitions

SEPARATE WAYS:
  No integration at all — contexts are completely independent
  Each has its own solution

PARTNERSHIP:
  Two teams plan releases together, coordinate changes
  Neither is fully upstream or downstream
```

## 6.3 Subdomain Types

```
CORE DOMAIN: the heart of the business, competitive advantage
  This is WHERE you invest most effort
  THIS is why the company exists
  
  E-commerce: recommendation engine, fraud detection, supply chain
  Bank: risk assessment, trading algorithm
  Uber: matching algorithm, pricing algorithm
  
  → Apply DDD fully here
  → Write code from scratch
  → Hire domain experts

SUPPORTING SUBDOMAIN: necessary but not competitive advantage
  Supports the core domain
  Custom to your business but not your competitive edge
  
  E-commerce: order management, returns processing
  Bank: account management, customer onboarding
  
  → Apply DDD here too (it's complex enough)
  → Could buy software but usually build

GENERIC SUBDOMAIN: solved problems, buy don't build
  Same across all companies in all industries
  Authentication, email sending, notifications, billing
  
  → Use off-the-shelf software (Auth0, Stripe, SendGrid)
  → Don't apply DDD (not worth the effort)
  → May still need ACL to translate to your domain

THE INSIGHT: most companies try to apply equal effort everywhere
  → Correct strategy: go deep on Core Domain
  → Use bought solutions for Generic Subdomains
  → Keep Supporting Subdomains pragmatic
```

---

# 7. DDD Tactical Design — Building Blocks

## 7.1 Entities

```
ENTITY: object defined by its IDENTITY, not its attributes
  Has a unique ID that persists over its lifetime
  Can CHANGE its attributes but remains the same entity
  
  "Even if all fields change, it's still the same thing"

Real-world analogy:
  Person: changes name (marriage), address, appearance, job...
          but stays the SAME PERSON (same ID = SSN, passport number)

  Bank Account: balance changes, account type may upgrade...
                but stays the SAME ACCOUNT (same account number)

CHARACTERISTICS:
  ✅ Has unique identity (usually Long ID, UUID, domain-specific ID)
  ✅ Mutable (attributes can change over lifetime)
  ✅ Has lifecycle (created, modified, deleted)
  ✅ Equality based on IDENTITY (not attributes)
  ✅ Contains behavior (domain logic), not just data!
```

```java
// ── ENTITY ── 
// Note: equals/hashCode based on ID, NOT fields!
public class Order {

    // IDENTITY — immutable, set at creation
    private final OrderId id;

    // ATTRIBUTES — can change
    private CustomerId customerId;
    private OrderStatus status;
    private List<OrderLine> lines;
    private Money totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // DOMAIN EVENTS accumulated during lifecycle
    private final List<DomainEvent> domainEvents = new ArrayList<>();

    // FACTORY METHOD (preferred over public constructor)
    public static Order create(CustomerId customerId, List<OrderLine> lines) {
        if (lines.isEmpty()) throw new InvalidOrderException("Order must have items");

        Order order = new Order(
            OrderId.generate(),
            customerId,
            OrderStatus.PENDING,
            lines,
            calculateTotal(lines),
            LocalDateTime.now()
        );
        // Record domain event
        order.domainEvents.add(new OrderCreatedEvent(order.id, customerId));
        return order;
    }

    // BEHAVIOR — business logic lives HERE, not in services!
    public void confirm() {
        if (status != OrderStatus.PENDING) {
            throw new InvalidOrderStateException(
                "Can only confirm PENDING orders, current: " + status);
        }
        this.status = OrderStatus.CONFIRMED;
        this.updatedAt = LocalDateTime.now();
        domainEvents.add(new OrderConfirmedEvent(this.id));
    }

    public void cancel(String reason) {
        if (status == OrderStatus.SHIPPED || status == OrderStatus.DELIVERED) {
            throw new InvalidOrderStateException("Cannot cancel shipped/delivered orders");
        }
        this.status = OrderStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
        domainEvents.add(new OrderCancelledEvent(this.id, reason));
    }

    public void addLine(OrderLine line) {
        if (status != OrderStatus.PENDING) {
            throw new InvalidOrderStateException("Can only modify PENDING orders");
        }
        this.lines.add(line);
        this.totalAmount = calculateTotal(this.lines);
        this.updatedAt = LocalDateTime.now();
    }

    public void applyDiscount(Percentage discount) {
        this.totalAmount = totalAmount.multiply(
            BigDecimal.ONE.subtract(discount.asDecimal()));
        domainEvents.add(new DiscountAppliedEvent(this.id, discount));
    }

    // EQUALITY based on ID
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Order other)) return false;
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() { return Objects.hash(id); }

    // Getters (no setters — use explicit methods with domain meaning!)
    public OrderId getId()              { return id; }
    public OrderStatus getStatus()      { return status; }
    public List<OrderLine> getLines()   { return Collections.unmodifiableList(lines); }
    public Money getTotalAmount()       { return totalAmount; }

    // Collect and clear events (called by repository when persisting)
    public List<DomainEvent> pullDomainEvents() {
        List<DomainEvent> events = List.copyOf(domainEvents);
        domainEvents.clear();
        return events;
    }

    private static Money calculateTotal(List<OrderLine> lines) {
        return lines.stream()
            .map(OrderLine::getSubtotal)
            .reduce(Money.ZERO, Money::add);
    }
}
```

## 7.2 Value Objects

```
VALUE OBJECT: object defined by its ATTRIBUTES, not identity
  No identity — two VOs with same values ARE the same thing
  IMMUTABLE — once created, never changes
  Replace instead of modify
  
  "If attributes are the same → objects are equal"

Real-world analogy:
  Money: $50 bill A = $50 bill B (same value → interchangeable)
  Address: "123 Main St, NYC" = "123 Main St, NYC" (same value → equal)
  Color: RGB(255, 0, 0) is always "red" regardless of which instance

WHEN TO USE VALUE OBJECT:
  Describe, quantify, or measure something
  No need to track identity or lifecycle
  Conceptually like a measurement: weight, money, temperature, coordinates

CHARACTERISTICS:
  ✅ Equality based on ALL attributes
  ✅ IMMUTABLE — never change after creation
  ✅ Side-effect free — no mutations
  ✅ Can be shared safely (immutable = thread-safe)
  ✅ Self-validating in constructor
  ✅ Rich behavior (domain logic about the concept)
```

```java
// ── VALUE OBJECTS ──

// MONEY — classic value object
public final class Money {

    private final BigDecimal amount;
    private final Currency currency;

    // Self-validating constructor!
    public Money(BigDecimal amount, Currency currency) {
        if (amount == null) throw new NullPointerException("amount");
        if (currency == null) throw new NullPointerException("currency");
        if (amount.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("Amount cannot be negative: " + amount);
        this.amount = amount.setScale(2, RoundingMode.HALF_UP);
        this.currency = currency;
    }

    public static Money of(double amount, Currency currency) {
        return new Money(BigDecimal.valueOf(amount), currency);
    }
    public static final Money ZERO = Money.of(0, Currency.getInstance("USD"));

    // BEHAVIOR — money knows how to do money things
    public Money add(Money other) {
        assertSameCurrency(other);
        return new Money(this.amount.add(other.amount), this.currency);
        // Returns NEW Money — doesn't modify this! (immutable)
    }

    public Money subtract(Money other) {
        assertSameCurrency(other);
        Money result = new Money(this.amount.subtract(other.amount), this.currency);
        if (result.isNegative()) throw new InsufficientFundsException(this, other);
        return result;
    }

    public Money multiply(BigDecimal factor) {
        return new Money(this.amount.multiply(factor), this.currency);
    }

    public boolean isGreaterThan(Money other) {
        assertSameCurrency(other);
        return this.amount.compareTo(other.amount) > 0;
    }

    public boolean isNegative()    { return amount.compareTo(BigDecimal.ZERO) < 0; }
    public boolean isZero()        { return amount.compareTo(BigDecimal.ZERO) == 0; }

    private void assertSameCurrency(Money other) {
        if (!this.currency.equals(other.currency))
            throw new CurrencyMismatchException(this.currency, other.currency);
    }

    // EQUALITY based on ALL fields!
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Money m)) return false;
        return amount.compareTo(m.amount) == 0 && currency.equals(m.currency);
    }
    @Override
    public int hashCode() { return Objects.hash(amount, currency); }
    @Override
    public String toString() { return currency.getSymbol() + amount; }
}

// ADDRESS value object
public final class Address {
    private final String street;
    private final String city;
    private final String state;
    private final String postalCode;
    private final String country;

    public Address(String street, String city, String state,
                   String postalCode, String country) {
        this.street     = requireNonBlank(street,     "street");
        this.city       = requireNonBlank(city,       "city");
        this.state      = requireNonBlank(state,      "state");
        this.postalCode = requireNonBlank(postalCode, "postalCode");
        this.country    = requireNonBlank(country,    "country");
    }

    public String format() {
        return street + "\n" + city + ", " + state + " " + postalCode + "\n" + country;
    }

    public boolean isSameCity(Address other) {
        return this.city.equalsIgnoreCase(other.city)
            && this.country.equalsIgnoreCase(other.country);
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Address a)) return false;
        return Objects.equals(street, a.street) && Objects.equals(city, a.city)
            && Objects.equals(state, a.state)   && Objects.equals(postalCode, a.postalCode)
            && Objects.equals(country, a.country);
    }
    @Override
    public int hashCode() {
        return Objects.hash(street, city, state, postalCode, country);
    }
}

// STRONGLY-TYPED IDs — avoid primitive obsession!
// Using long for ID everywhere leads to bugs: orderId vs userId both Long
public final class OrderId {
    private final UUID value;

    private OrderId(UUID value) { this.value = value; }

    public static OrderId generate()         { return new OrderId(UUID.randomUUID()); }
    public static OrderId of(String id)      { return new OrderId(UUID.fromString(id)); }
    public static OrderId of(UUID id)        { return new OrderId(id); }

    public UUID getValue()  { return value; }
    @Override
    public String toString() { return value.toString(); }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof OrderId oid)) return false;
        return Objects.equals(value, oid.value);
    }
    @Override
    public int hashCode() { return Objects.hash(value); }
}
```

## 7.3 Aggregates

```
AGGREGATE: cluster of entities and value objects treated as a unit
  Has ONE root entity (the Aggregate Root)
  External code ONLY accesses aggregate through its root
  Defines CONSISTENCY BOUNDARY — all invariants enforced within

AGGREGATE ROOT:
  The single entry point to the aggregate
  Has global identity (ID accessible from outside)
  Ensures ALL invariants across the aggregate are satisfied
  Controls lifecycle of child entities

AGGREGATE DESIGN RULES:
  1. Reference other aggregates by ID only (not direct object reference)
  2. One aggregate = one transaction (never update 2 aggregates in 1 tx)
  3. Eventual consistency BETWEEN aggregates (domain events)
  4. Keep aggregates SMALL (easier to reason about, fewer conflicts)

EXAMPLE: Order Aggregate
  ┌────────────────────────────────────────────────────────────┐
  │  AGGREGATE: Order                                          │
  │                                                            │
  │  ROOT: Order (has OrderId — globally accessible)          │
  │    │                                                       │
  │    ├── OrderLine (entity within aggregate, no global ID)   │
  │    │     ├── ProductId (reference to another aggregate!)   │
  │    │     ├── Quantity (value object)                       │
  │    │     └── Price (Money value object)                    │
  │    │                                                       │
  │    ├── ShippingAddress (value object)                      │
  │    └── OrderStatus (value object / enum)                   │
  │                                                            │
  │  INVARIANTS enforced by Order:                             │
  │    - Must have at least 1 OrderLine                        │
  │    - Total = sum of all line subtotals                     │
  │    - Can only add lines to PENDING order                   │
  │    - CANCELLED orders cannot be confirmed                  │
  └────────────────────────────────────────────────────────────┘
  
  OUTSIDE the aggregate:
    Product (separate aggregate, referenced by ProductId only)
    Customer (separate aggregate, referenced by CustomerId only)
    
  Access rule:
    ✅ orderRepository.findById(orderId).addLine(...)
    ❌ order.getLines().get(0).setPrice(...) — bypasses aggregate!
```

```java
// ORDER AGGREGATE with invariant enforcement

@Getter  // only getters — no setters!
public class Order {  // AGGREGATE ROOT

    private final OrderId id;
    private final CustomerId customerId;  // reference by ID only!
    private final List<OrderLine> lines = new ArrayList<>();  // child entities
    private Money totalAmount;
    private OrderStatus status;
    private ShippingAddress shippingAddress;
    private final List<DomainEvent> domainEvents = new ArrayList<>();

    // Private constructor — use factory
    private Order(OrderId id, CustomerId customerId, ShippingAddress address) {
        this.id = id;
        this.customerId = customerId;
        this.shippingAddress = address;
        this.status = OrderStatus.PENDING;
        this.totalAmount = Money.ZERO;
    }

    // FACTORY — validates invariants before creating
    public static Order create(CustomerId customerId, ShippingAddress address) {
        Objects.requireNonNull(customerId, "customerId required");
        Objects.requireNonNull(address, "shippingAddress required");
        Order order = new Order(OrderId.generate(), customerId, address);
        order.raise(new OrderCreatedEvent(order.id, customerId));
        return order;
    }

    // COMMAND: addLine — enforces aggregate invariants
    public OrderLine addLine(ProductId productId, Quantity quantity, Money unitPrice) {
        // INVARIANT: can only modify pending orders
        assertStatus(OrderStatus.PENDING, "add lines to");

        // INVARIANT: no duplicate products in same order
        if (lines.stream().anyMatch(l -> l.getProductId().equals(productId))) {
            throw new DuplicateProductException(productId);
        }

        OrderLine line = new OrderLine(
            OrderLineId.generate(),
            this.id,           // belongs to this order
            productId,
            quantity,
            unitPrice
        );
        lines.add(line);
        recalculateTotal();    // maintain consistency!
        return line;
    }

    public void removeLine(OrderLineId lineId) {
        assertStatus(OrderStatus.PENDING, "remove lines from");
        boolean removed = lines.removeIf(l -> l.getId().equals(lineId));
        if (!removed) throw new OrderLineNotFoundException(lineId);

        // INVARIANT: order must have at least 1 line
        if (lines.isEmpty()) throw new EmptyOrderException();
        recalculateTotal();
    }

    public void submit() {
        assertStatus(OrderStatus.PENDING, "submit");
        if (lines.isEmpty()) throw new EmptyOrderException();
        this.status = OrderStatus.SUBMITTED;
        raise(new OrderSubmittedEvent(id, customerId, totalAmount));
    }

    public void confirm(PaymentId paymentId) {
        assertStatus(OrderStatus.SUBMITTED, "confirm");
        this.status = OrderStatus.CONFIRMED;
        raise(new OrderConfirmedEvent(id, paymentId));
    }

    public void ship(TrackingNumber trackingNumber) {
        assertStatus(OrderStatus.CONFIRMED, "ship");
        this.status = OrderStatus.SHIPPED;
        raise(new OrderShippedEvent(id, trackingNumber));
    }

    private void assertStatus(OrderStatus required, String action) {
        if (this.status != required) {
            throw new InvalidOrderStateException(
                "Cannot " + action + " order with status: " + status);
        }
    }

    private void recalculateTotal() {
        this.totalAmount = lines.stream()
            .map(OrderLine::getSubtotal)
            .reduce(Money.ZERO, Money::add);
    }

    private void raise(DomainEvent event) {
        domainEvents.add(event);
    }

    public List<DomainEvent> pullDomainEvents() {
        List<DomainEvent> events = List.copyOf(domainEvents);
        domainEvents.clear();
        return events;
    }
}

// ORDER LINE — entity within aggregate (no global identity outside)
public class OrderLine {
    private final OrderLineId id;
    private final OrderId orderId;     // knows which order it belongs to
    private final ProductId productId; // reference to Product aggregate by ID only!
    private Quantity quantity;
    private Money unitPrice;

    // Derived value — computed, not stored
    public Money getSubtotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity.getValue()));
    }

    public void updateQuantity(Quantity newQty) {
        if (newQty.isZero()) throw new IllegalArgumentException("Quantity must be positive");
        this.quantity = newQty;
    }
}
```

## 7.4 Domain Events

```java
// DOMAIN EVENT: records something significant that HAPPENED in the domain
// Immutable — past tense naming ("OrderPlaced", "PaymentFailed")
// Raised inside aggregate, processed externally

public abstract class DomainEvent {
    private final String eventId;
    private final LocalDateTime occurredOn;
    private final int eventVersion;

    protected DomainEvent() {
        this.eventId      = UUID.randomUUID().toString();
        this.occurredOn   = LocalDateTime.now();
        this.eventVersion = 1;
    }
    // getters...
}

// Specific domain events
public class OrderConfirmedEvent extends DomainEvent {
    private final OrderId orderId;
    private final CustomerId customerId;
    private final Money totalAmount;
    private final List<OrderLineDto> lines;

    public OrderConfirmedEvent(Order order) {
        this.orderId     = order.getId();
        this.customerId  = order.getCustomerId();
        this.totalAmount = order.getTotalAmount();
        this.lines       = order.getLines().stream().map(OrderLineDto::from).toList();
    }
}

// PUBLISHING EVENTS (Spring):
@Service
@Transactional
public class OrderApplicationService {

    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    public OrderId confirmOrder(OrderId orderId, PaymentId paymentId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        order.confirm(paymentId);

        orderRepository.save(order);

        // Publish domain events AFTER successful persistence
        order.pullDomainEvents().forEach(eventPublisher::publishEvent);

        return orderId;
    }
}

// EVENT HANDLERS in other bounded contexts:
@Component
public class NotificationEventHandler {

    @EventListener
    @Async                                // process asynchronously!
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        // Send confirmation email — different bounded context (Notification)
        notificationService.sendOrderConfirmation(
            event.getCustomerId(),
            event.getOrderId(),
            event.getTotalAmount()
        );
    }
}

@Component
public class InventoryEventHandler {
    @EventListener
    @Async
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        // Reserve inventory — different bounded context (Inventory)
        event.getLines().forEach(line ->
            inventoryService.reserve(line.getProductId(), line.getQuantity()));
    }
}
```

---

# 8. DDD Repository & Domain Services

## 8.1 Repository Pattern

```java
// REPOSITORY: abstraction over storage — collection-like interface
// Domain layer defines the INTERFACE
// Infrastructure layer provides the IMPLEMENTATION
// → Domain doesn't depend on persistence technology!

// ── DOMAIN LAYER: interface ──
public interface OrderRepository {
    // Retrieval
    Optional<Order> findById(OrderId id);
    List<Order> findByCustomerId(CustomerId customerId);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByStatusAndCreatedBetween(
        OrderStatus status, LocalDateTime from, LocalDateTime to);

    // Persistence
    Order save(Order order);         // insert or update
    void  delete(OrderId id);

    // Queries returning value objects (not full aggregates)
    boolean existsById(OrderId id);
    long countByStatus(OrderStatus status);

    // Pagination
    Page<Order> findAll(Pageable pageable);
}

// ── INFRASTRUCTURE LAYER: JPA implementation ──
@Repository
public class JpaOrderRepository implements OrderRepository {

    private final JpaOrderEntityRepository jpa;
    private final OrderMapper mapper;

    @Override
    public Optional<Order> findById(OrderId id) {
        return jpa.findById(id.getValue().toString())
            .map(mapper::toDomain);      // JPA Entity → Domain Object
    }

    @Override
    public Order save(Order order) {
        OrderEntity entity = mapper.toEntity(order);
        OrderEntity saved  = jpa.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public List<Order> findByCustomerId(CustomerId customerId) {
        return jpa.findByCustomerId(customerId.getValue().toString())
            .stream()
            .map(mapper::toDomain)
            .collect(Collectors.toList());
    }

    // ...
}

// ── MAPPER: translate between Domain ↔ Infrastructure ──
@Component
public class OrderMapper {

    public Order toDomain(OrderEntity entity) {
        return Order.reconstitute(  // factory for restoring from persistence
            OrderId.of(entity.getId()),
            CustomerId.of(entity.getCustomerId()),
            entity.getLines().stream().map(this::toLinesDomain).toList(),
            new Money(entity.getTotalAmount(), Currency.getInstance(entity.getCurrency())),
            OrderStatus.valueOf(entity.getStatus()),
            toAddressDomain(entity.getShippingAddress())
        );
    }

    public OrderEntity toEntity(Order order) {
        OrderEntity entity = new OrderEntity();
        entity.setId(order.getId().getValue().toString());
        entity.setCustomerId(order.getCustomerId().getValue().toString());
        entity.setStatus(order.getStatus().name());
        entity.setTotalAmount(order.getTotalAmount().getAmount());
        entity.setCurrency(order.getTotalAmount().getCurrency().getCurrencyCode());
        entity.setLines(order.getLines().stream().map(this::toLinesEntity).toList());
        return entity;
    }
    // ...
}
```

## 8.2 Domain Services

```java
// DOMAIN SERVICE: business logic that doesn't naturally belong to any entity/VO
// Stateless — no fields, no state
// Operations that involve MULTIPLE aggregates or external systems

// WHEN to use Domain Service (not Entity/VO):
//   Operation involves multiple aggregates
//   Operation doesn't conceptually belong to one aggregate
//   Operation requires external infrastructure (but domain service = abstraction)

// EXAMPLE: Transfer between two bank accounts
// Should TransferService live in Account entity?
//   account.transferTo(other, amount) — awkward, account knows about other account
//   otherAccount.receive(amount) — two separate operations, not atomic

public interface MoneyTransferService {
    TransferResult transfer(AccountId fromId, AccountId toId, Money amount, String reason);
}

@DomainService  // custom annotation to mark as domain service
public class MoneyTransferDomainService implements MoneyTransferService {

    private final AccountRepository accountRepository;
    private final TransferRepository transferRepository;

    @Override
    public TransferResult transfer(AccountId fromId, AccountId toId, Money amount, String reason) {
        // Load both aggregates
        BankAccount source = accountRepository.findById(fromId)
            .orElseThrow(() -> new AccountNotFoundException(fromId));
        BankAccount target = accountRepository.findById(toId)
            .orElseThrow(() -> new AccountNotFoundException(toId));

        // Business rule: can't transfer to yourself
        if (source.getId().equals(target.getId()))
            throw new SameAccountTransferException();

        // Business rule: source must have sufficient funds
        if (!source.hasSufficientFunds(amount))
            throw new InsufficientFundsException(source.getId(), amount);

        // Perform the transfer — DOMAIN LOGIC
        source.debit(amount, reason);
        target.credit(amount, reason);

        // Record transfer
        MoneyTransfer transfer = MoneyTransfer.create(fromId, toId, amount, reason);

        // Persist both aggregates in same transaction
        accountRepository.save(source);
        accountRepository.save(target);
        transferRepository.save(transfer);

        return new TransferResult(transfer.getId(), source.getBalance(), target.getBalance());
    }
}

// APPLICATION SERVICE vs DOMAIN SERVICE:
// Domain Service:
//   - Contains DOMAIN LOGIC
//   - Uses domain language
//   - Part of the domain model
//   - MoneyTransferDomainService, PricingDomainService
//
// Application Service:
//   - ORCHESTRATES domain objects and infrastructure
//   - No domain logic (delegates to entities/domain services)
//   - Handles transactions, security, DTO conversion
//   - UserRegistrationApplicationService
```

---

# 9. Hexagonal Architecture (Ports & Adapters)

## 9.1 Overview

```
Alistair Cockburn, 2005 — also called "Ports & Adapters"
Same idea as Clean Architecture's dependency rule

GOAL: application core (domain + use cases) is completely isolated
      from external systems (DB, HTTP, messaging, UI)

                    ┌──────────────────────────────────────┐
                    │         APPLICATION CORE              │
                    │                                      │
  HTTP Request ──▶  │PORT──▶ Use Case ──▶ PORT──▶ DB       │
  GraphQL ──────▶  │PORT──▶ (Domain)  ──▶ PORT──▶ Email    │
  CLI ──────────▶  │PORT──▶           ──▶ PORT──▶ Kafka     │
                    │                                      │
                    └──────────────────────────────────────┘
    PRIMARY/DRIVING                    SECONDARY/DRIVEN
    (initiate action)                  (driven by app)

PORTS: interfaces defined by the application core
  Primary Ports (Driving): Use Case interfaces (what the app CAN do)
                           Called by adapters (HTTP, CLI, Tests)
  Secondary Ports (Driven): Repository interfaces, Notification interfaces
                            Implemented by adapters (DB, Email, Kafka)

ADAPTERS: implementations of ports
  Primary Adapters (Driving): REST Controller, CLI, Test Client
                               Call into primary ports
  Secondary Adapters (Driven): JPA Repository, SMTP Email, Kafka Producer
                                Implement secondary ports

DEPENDENCY DIRECTION:
  Adapters → Core (always)
  Core NEVER depends on adapters!
  Core depends only on its own interfaces (ports)
```

## 9.2 Hexagonal Architecture in Code

```java
// PROJECT STRUCTURE:
src/
├── domain/                      ← innermost: pure domain
│   ├── model/                   (entities, VOs, aggregates)
│   │   ├── Order.java
│   │   ├── OrderId.java
│   │   └── Money.java
│   └── repository/              (repository interfaces = secondary ports)
│       └── OrderRepository.java
│
├── application/                 ← use cases
│   ├── port/
│   │   ├── in/                  ← PRIMARY PORTS (use case interfaces)
│   │   │   ├── CreateOrderUseCase.java
│   │   │   ├── ConfirmOrderUseCase.java
│   │   │   └── GetOrderQuery.java
│   │   └── out/                 ← SECONDARY PORTS (driven interfaces)
│   │       ├── OrderRepository.java (same as domain/repository)
│   │       ├── PaymentGateway.java
│   │       └── NotificationSender.java
│   └── service/
│       └── OrderService.java    ← implements use cases, orchestrates
│
└── adapter/                     ← outermost: details
    ├── in/                      ← PRIMARY ADAPTERS (driving)
    │   ├── web/
    │   │   ├── OrderController.java   (REST → use case)
    │   │   └── OrderRequest.java
    │   └── messaging/
    │       └── OrderEventConsumer.java (Kafka → use case)
    └── out/                     ← SECONDARY ADAPTERS (driven)
        ├── persistence/
        │   ├── JpaOrderRepository.java  (implements secondary port)
        │   ├── OrderEntity.java         (JPA entity, NOT domain entity)
        │   └── OrderMapper.java
        ├── email/
        │   └── SmtpNotificationSender.java
        └── payment/
            └── StripePaymentGateway.java

// ── PRIMARY PORT (Use Case Interface) ──
public interface CreateOrderUseCase {
    OrderId createOrder(CreateOrderCommand command);
}

public record CreateOrderCommand(
    CustomerId customerId,
    ShippingAddress shippingAddress,
    List<OrderLineCommand> lines
) {
    public record OrderLineCommand(ProductId productId, Quantity quantity, Money unitPrice) {}
}

// ── APPLICATION SERVICE (implements primary port) ──
@Service
@Transactional
public class OrderService implements CreateOrderUseCase, ConfirmOrderUseCase {

    // These are SECONDARY PORTS — interfaces from domain/application
    private final OrderRepository orderRepository;    // port
    private final PaymentGateway paymentGateway;      // port
    private final NotificationSender notifier;        // port
    private final ApplicationEventPublisher events;

    @Override
    public OrderId createOrder(CreateOrderCommand cmd) {
        Order order = Order.create(cmd.customerId(), cmd.shippingAddress());

        cmd.lines().forEach(line ->
            order.addLine(line.productId(), line.quantity(), line.unitPrice()));

        orderRepository.save(order);
        order.pullDomainEvents().forEach(events::publishEvent);

        return order.getId();
    }

    @Override
    public void confirmOrder(ConfirmOrderCommand cmd) {
        Order order = orderRepository.findById(cmd.orderId())
            .orElseThrow(() -> new OrderNotFoundException(cmd.orderId()));

        PaymentResult payment = paymentGateway.charge(
            order.getCustomerId(), order.getTotalAmount());

        if (!payment.isSuccessful())
            throw new PaymentFailedException(payment.getFailureReason());

        order.confirm(payment.getPaymentId());
        orderRepository.save(order);
        order.pullDomainEvents().forEach(events::publishEvent);
    }
}

// ── PRIMARY ADAPTER: REST Controller ──
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final CreateOrderUseCase createOrder;  // depends on PORT, not service!
    private final ConfirmOrderUseCase confirmOrder;

    public OrderController(CreateOrderUseCase createOrder, ConfirmOrderUseCase confirmOrder) {
        this.createOrder  = createOrder;
        this.confirmOrder = confirmOrder;
    }

    @PostMapping
    public ResponseEntity<CreateOrderResponse> createOrder(
            @RequestBody @Valid CreateOrderRequest req) {
        CreateOrderCommand command = OrderWebMapper.toCommand(req);
        OrderId orderId = createOrder.createOrder(command);
        return ResponseEntity.created(URI.create("/api/orders/" + orderId))
            .body(new CreateOrderResponse(orderId.toString()));
    }
}

// ── SECONDARY ADAPTER: Payment Gateway ──
@Component
public class StripePaymentGateway implements PaymentGateway {  // implements PORT!

    private final StripeClient stripeClient;

    @Override
    public PaymentResult charge(CustomerId customerId, Money amount) {
        try {
            ChargeCreateParams params = ChargeCreateParams.builder()
                .setAmount((long)(amount.getAmount().doubleValue() * 100))
                .setCurrency(amount.getCurrency().getCurrencyCode().toLowerCase())
                .setCustomer(customerId.getValue().toString())
                .build();

            Charge charge = Charge.create(params, stripeClient.options());
            return PaymentResult.success(PaymentId.of(charge.getId()));
        } catch (StripeException e) {
            return PaymentResult.failure(e.getMessage());
        }
    }
}
```

---

# 10. CQRS — Command Query Responsibility Segregation

## 10.1 CQRS Concept

```
"A method should either change state OR return data — never both"
— Bertrand Meyer (CQS principle, 1988)

CQRS extends CQS to the ARCHITECTURE level:
  COMMAND side: changes state, no return value (or just ID)
                Write model — optimized for writes
  QUERY side:   returns data, doesn't change state
                Read model — optimized for reads

WITHOUT CQRS (same model for read and write):
  Write model: normalized (3NF), transactional, complex relations
  Read model: denormalized, pre-aggregated, fast reads
  CONFLICT: these requirements are OPPOSITE!
  
  Result: compromise model that does both poorly

WITH CQRS:
  Write model: aggregate-based, enforces invariants, complex domain logic
  Read model: flat projections, optimized for specific queries, potentially different DB

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Client → COMMAND → Command Handler → Aggregate → Write DB  │
│                                            ↓                │
│              (synchronize via events or polling)           │
│                                            ↓                │
│  Client ← QUERY ← Query Handler ← Read Model ← Read DB     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

WHEN to use CQRS:
  ✅ Different scaling needs for reads vs writes (100:1 read:write ratio)
  ✅ Complex domain logic (aggregates are complex, queries are simple)
  ✅ Many different "views" of same data (different clients need different shapes)
  ✅ Audit requirements (commands are already events)
  
WHEN NOT to use:
  ❌ Simple CRUD (overhead without benefit)
  ❌ Same read/write model works fine
  ❌ Small team that can't maintain two models
```

## 10.2 CQRS Implementation

```java
// ── COMMAND SIDE ──

// Commands: intent to change state
public record CreateOrderCommand(
    CustomerId customerId,
    ShippingAddress address,
    List<OrderLineCommand> lines) {}

public record ConfirmOrderCommand(OrderId orderId, PaymentDetails payment) {}
public record CancelOrderCommand(OrderId orderId, String reason) {}

// Command Handler
@Service
@Transactional
public class OrderCommandHandler {

    private final OrderRepository orderRepository;
    private final EventBus eventBus;

    public OrderId handle(CreateOrderCommand cmd) {
        Order order = Order.create(cmd.customerId(), cmd.address());
        cmd.lines().forEach(l -> order.addLine(l.productId(), l.quantity(), l.price()));
        orderRepository.save(order);
        eventBus.publish(order.pullDomainEvents());
        return order.getId();
    }

    public void handle(ConfirmOrderCommand cmd) {
        Order order = orderRepository.findById(cmd.orderId()).orElseThrow();
        order.confirm(cmd.payment().getPaymentId());
        orderRepository.save(order);
        eventBus.publish(order.pullDomainEvents());
    }
}

// ── QUERY SIDE — completely separate! ──

// Read Models (flat, denormalized, query-optimized)
// Note: NO aggregate structure, NO business logic — just data!
public record OrderSummaryView(
    String orderId,
    String customerName,
    String customerEmail,
    String status,
    String totalAmount,
    int itemCount,
    LocalDateTime createdAt
) {}

public record OrderDetailView(
    String orderId,
    CustomerInfo customer,
    List<OrderLineView> lines,
    String status,
    MoneyView total,
    AddressView shippingAddress,
    LocalDateTime createdAt
) {}

// Query — describes what you want to read
public record GetOrderByIdQuery(String orderId) {}
public record GetOrdersByCustomerQuery(String customerId, int page, int size) {}
public record GetOrdersByStatusQuery(String status, int page, int size) {}

// Query Handler
@Service
@Transactional(readOnly = true)
public class OrderQueryHandler {

    // Can use a DIFFERENT database/table from write side!
    // Or same DB but different queries
    @Autowired JdbcTemplate jdbc;  // use raw SQL for read side (faster!)

    public Optional<OrderDetailView> handle(GetOrderByIdQuery query) {
        String sql = """
            SELECT o.id, o.status, o.total_amount, o.currency,
                   o.created_at, o.shipping_street, o.shipping_city,
                   c.name AS customer_name, c.email AS customer_email,
                   json_agg(json_build_object(
                       'productId', ol.product_id,
                       'productName', p.name,
                       'quantity', ol.quantity,
                       'unitPrice', ol.unit_price
                   )) AS lines
            FROM orders o
            JOIN customers c ON c.id = o.customer_id
            JOIN order_lines ol ON ol.order_id = o.id
            JOIN products p ON p.id = ol.product_id
            WHERE o.id = ?
            GROUP BY o.id, c.name, c.email
            """;

        return Optional.ofNullable(
            jdbc.queryForObject(sql, orderDetailViewMapper(), query.orderId()));
    }

    public Page<OrderSummaryView> handle(GetOrdersByStatusQuery query) {
        // Optimized query for list view — much simpler than domain model
        return orderSummaryRepository.findByStatus(query.status(),
            PageRequest.of(query.page(), query.size()));
    }
}

// ── CONTROLLER delegates to both sides ──
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderCommandHandler commandHandler;
    private final OrderQueryHandler   queryHandler;

    @PostMapping
    public ResponseEntity<Map<String, String>> createOrder(
            @RequestBody CreateOrderRequest req) {
        OrderId id = commandHandler.handle(new CreateOrderCommand(/* ... */));
        return ResponseEntity.created(URI.create("/api/orders/" + id))
            .body(Map.of("id", id.toString()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDetailView> getOrder(@PathVariable String id) {
        return queryHandler.handle(new GetOrderByIdQuery(id))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
```

---

# 11. Event Sourcing

## 11.1 Event Sourcing Concept

```
TRADITIONAL: store CURRENT STATE
  accounts table: { id: 1, balance: 500, owner: "Khang" }
  What happened to get here? UNKNOWN (unless you have audit log)

EVENT SOURCING: store EVENTS, derive current state by replaying them
  events table:
  { AccountCreated: id=1, owner="Khang", initial=1000 }
  { MoneyWithdrawn: id=1, amount=200 }
  { MoneyDeposited: id=1, amount=100 }
  { MoneyWithdrawn: id=1, amount=400 }
  
  Current balance = 1000 - 200 + 100 - 400 = 500 ✅
  We KNOW what happened!

BENEFITS:
  Complete audit trail — know exactly what happened and when
  Time travel — rebuild state at any point in time
  Debug by replaying events
  Multiple projections from same events
  Event-driven integrations (events are already there!)
  Undo/replay capabilities

CHALLENGES:
  Querying current state requires projection
  Event schema evolution (old events must still work)
  Performance (replay all events for current state → use snapshots)
  Learning curve, mental model shift
  Storage grows indefinitely

SNAPSHOT: periodic snapshot of aggregate state
  Avoid replaying thousands of events
  Store snapshot every N events, replay only recent events
  snapshot: { at_version: 1000, balance: 5000, ... }
  events 1001-1050: replay on top of snapshot

WHEN event sourcing makes sense:
  ✅ Audit requirements (financial, healthcare, legal)
  ✅ Complex business logic, rollback needed
  ✅ Event-driven architecture already in place
  ✅ CQRS already planned
  ❌ Simple CRUD
  ❌ Team unfamiliar (steep learning curve)
```

```java
// EVENT SOURCING IMPLEMENTATION:

// All domain events must be serializable (stored to DB)
public interface DomainEvent {
    String getAggregateId();
    int getVersion();
    LocalDateTime getOccurredOn();
}

public record AccountCreatedEvent(
    String aggregateId,
    int version,
    LocalDateTime occurredOn,
    String owner,
    Money initialBalance
) implements DomainEvent {}

public record MoneyDepositedEvent(
    String aggregateId,
    int version,
    LocalDateTime occurredOn,
    Money amount,
    String description
) implements DomainEvent {}

public record MoneyWithdrawnEvent(
    String aggregateId,
    int version,
    LocalDateTime occurredOn,
    Money amount,
    String description
) implements DomainEvent {}

// EVENT-SOURCED AGGREGATE
// State derived by applying events, not stored directly
public class BankAccount {

    private AccountId id;
    private String owner;
    private Money balance;
    private AccountStatus status;
    private int version;  // for optimistic concurrency

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    // PRIVATE — use reconstitute() for existing, factory for new
    private BankAccount() {}

    // FACTORY: creates new account
    public static BankAccount open(String owner, Money initialBalance) {
        BankAccount account = new BankAccount();
        account.apply(new AccountCreatedEvent(
            AccountId.generate().toString(), 0,
            LocalDateTime.now(), owner, initialBalance));
        return account;
    }

    // RECONSTITUTE: rebuild from stored events
    public static BankAccount reconstitute(List<DomainEvent> events) {
        BankAccount account = new BankAccount();
        events.forEach(account::apply);
        return account;
    }

    // COMMAND: deposit
    public void deposit(Money amount, String description) {
        if (status != AccountStatus.ACTIVE)
            throw new AccountNotActiveException(id);
        if (amount.isNegative())
            throw new InvalidAmountException(amount);

        apply(new MoneyDepositedEvent(
            id.toString(), version + 1, LocalDateTime.now(), amount, description));
    }

    // COMMAND: withdraw
    public void withdraw(Money amount, String description) {
        if (status != AccountStatus.ACTIVE)
            throw new AccountNotActiveException(id);
        if (balance.isLessThan(amount))
            throw new InsufficientFundsException(id, balance, amount);

        apply(new MoneyWithdrawnEvent(
            id.toString(), version + 1, LocalDateTime.now(), amount, description));
    }

    // APPLY: update state based on event (NO validation here — already validated above)
    private void apply(DomainEvent event) {
        mutate(event);                    // update state
        uncommittedEvents.add(event);     // track for persistence
    }

    // MUTATE: state transition functions (pure — no side effects!)
    private void mutate(DomainEvent event) {
        switch (event) {
            case AccountCreatedEvent e -> {
                this.id      = AccountId.of(e.aggregateId());
                this.owner   = e.owner();
                this.balance = e.initialBalance();
                this.status  = AccountStatus.ACTIVE;
                this.version = e.version();
            }
            case MoneyDepositedEvent e -> {
                this.balance = balance.add(e.amount());
                this.version = e.version();
            }
            case MoneyWithdrawnEvent e -> {
                this.balance = balance.subtract(e.amount());
                this.version = e.version();
            }
            default -> throw new UnknownEventException(event.getClass().getName());
        }
    }

    public List<DomainEvent> getUncommittedEvents() { return List.copyOf(uncommittedEvents); }
    public void markEventsAsCommitted()               { uncommittedEvents.clear(); }
}

// EVENT STORE (the persistence layer for event sourcing)
public interface EventStore {
    void append(String aggregateId, List<DomainEvent> events, int expectedVersion);
    List<DomainEvent> load(String aggregateId);
    List<DomainEvent> loadFrom(String aggregateId, int fromVersion);
}

// EVENT-SOURCED REPOSITORY
@Repository
public class EventSourcedAccountRepository {

    private final EventStore eventStore;

    public Optional<BankAccount> findById(AccountId id) {
        List<DomainEvent> events = eventStore.load(id.toString());
        if (events.isEmpty()) return Optional.empty();
        return Optional.of(BankAccount.reconstitute(events));
    }

    public void save(BankAccount account) {
        eventStore.append(
            account.getId().toString(),
            account.getUncommittedEvents(),
            account.getVersion() - account.getUncommittedEvents().size()
        );
        account.markEventsAsCommitted();
    }
}
```

---

# 12. DDD + Spring Boot — Full Implementation

## 12.1 Complete Project Structure

```
com.company.ordering/
│
├── domain/                              ← INNER RING: pure domain
│   ├── model/
│   │   ├── order/
│   │   │   ├── Order.java               (aggregate root)
│   │   │   ├── OrderId.java             (value object)
│   │   │   ├── OrderLine.java           (entity)
│   │   │   ├── OrderLineId.java
│   │   │   ├── OrderStatus.java         (enum)
│   │   │   └── events/
│   │   │       ├── OrderCreatedEvent.java
│   │   │       ├── OrderConfirmedEvent.java
│   │   │       └── OrderCancelledEvent.java
│   │   ├── customer/
│   │   │   ├── CustomerId.java
│   │   │   └── CustomerName.java
│   │   └── shared/
│   │       ├── Money.java               (shared value object)
│   │       ├── Address.java
│   │       └── Quantity.java
│   ├── repository/
│   │   └── OrderRepository.java         (port — interface only)
│   ├── service/
│   │   └── OrderPricingService.java     (domain service)
│   └── exception/
│       ├── OrderNotFoundException.java
│       ├── InvalidOrderStateException.java
│       └── InsufficientFundsException.java
│
├── application/                         ← USE CASES
│   ├── port/
│   │   ├── in/
│   │   │   ├── CreateOrderUseCase.java
│   │   │   ├── ConfirmOrderUseCase.java
│   │   │   └── CancelOrderUseCase.java
│   │   └── out/
│   │       ├── LoadOrderPort.java
│   │       ├── SaveOrderPort.java
│   │       ├── PaymentPort.java
│   │       └── NotificationPort.java
│   ├── service/
│   │   └── OrderApplicationService.java  (implements use cases)
│   └── dto/
│       ├── CreateOrderCommand.java
│       └── OrderCreatedResult.java
│
└── adapter/                             ← OUTER RING: details
    ├── in/
    │   └── web/
    │       ├── OrderController.java       (HTTP → use case)
    │       ├── request/
    │       │   └── CreateOrderRequest.java
    │       ├── response/
    │       │   └── OrderResponse.java
    │       └── mapper/
    │           └── OrderWebMapper.java
    └── out/
        ├── persistence/
        │   ├── OrderJpaRepository.java    (Spring Data)
        │   ├── OrderEntity.java           (JPA entity — SEPARATE from domain!)
        │   ├── OrderLineEntity.java
        │   ├── OrderPersistenceAdapter.java  (implements LoadOrderPort, SaveOrderPort)
        │   └── OrderMapper.java
        ├── payment/
        │   └── StripePaymentAdapter.java   (implements PaymentPort)
        └── notification/
            └── EmailNotificationAdapter.java (implements NotificationPort)
```

## 12.2 Application Service

```java
@Service
@Transactional
@RequiredArgsConstructor
public class OrderApplicationService
        implements CreateOrderUseCase, ConfirmOrderUseCase, CancelOrderUseCase {

    private final LoadOrderPort   loadOrder;
    private final SaveOrderPort   saveOrder;
    private final PaymentPort     payment;
    private final NotificationPort notifier;
    private final ApplicationEventPublisher events;

    @Override
    public OrderCreatedResult createOrder(CreateOrderCommand cmd) {
        // 1. Create aggregate (domain logic)
        Order order = Order.create(
            CustomerId.of(cmd.customerId()),
            Address.of(cmd.street(), cmd.city(), cmd.country())
        );

        // 2. Add lines (domain logic enforces invariants)
        cmd.lines().forEach(line -> order.addLine(
            ProductId.of(line.productId()),
            Quantity.of(line.quantity()),
            Money.of(line.unitPrice(), "USD")
        ));

        // 3. Persist
        Order savedOrder = saveOrder.save(order);

        // 4. Publish domain events
        savedOrder.pullDomainEvents().forEach(events::publishEvent);

        // 5. Return result (NOT the domain object! return DTO)
        return new OrderCreatedResult(savedOrder.getId().toString(), savedOrder.getTotalAmount());
    }

    @Override
    public void confirmOrder(String orderId, String paymentMethodId) {
        Order order = loadOrder.findById(OrderId.of(orderId))
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        // Process payment (infrastructure concern via port)
        PaymentResult result = payment.charge(
            order.getCustomerId(), order.getTotalAmount(), paymentMethodId);

        if (!result.isSuccessful())
            throw new PaymentFailedException(orderId, result.getFailureReason());

        // Domain logic
        order.confirm(PaymentId.of(result.getPaymentId()));
        saveOrder.save(order);
        order.pullDomainEvents().forEach(events::publishEvent);
    }

    @Override
    public void cancelOrder(String orderId, String reason) {
        Order order = loadOrder.findById(OrderId.of(orderId))
            .orElseThrow(() -> new OrderNotFoundException(orderId));

        order.cancel(reason);   // domain validates state transition
        saveOrder.save(order);
        order.pullDomainEvents().forEach(events::publishEvent);
    }
}
```

---

# 13. Architecture Anti-Patterns

## 13.1 Common Mistakes

```java
// ❌ ANTI-PATTERN 1: ANEMIC DOMAIN MODEL
// Entity is just a data holder — all logic in services
// (Most common DDD mistake!)

// BAD: Anemic Order
public class Order {
    private String id;
    private String status;
    private double totalAmount;
    // just getters/setters, no behavior
}

// BAD: Fat Service with all logic
public class OrderService {
    public void confirmOrder(String orderId) {
        Order order = repo.findById(orderId);
        if (!order.getStatus().equals("PENDING"))
            throw new Exception("Not pending");      // business rule in service!
        order.setStatus("CONFIRMED");                 // data manipulation!
        repo.save(order);
    }
}

// ✅ GOOD: Rich Domain Model
public class Order {
    public void confirm() {
        if (status != OrderStatus.PENDING)           // business rule in ENTITY!
            throw new InvalidOrderStateException(...);
        this.status = OrderStatus.CONFIRMED;         // state transition in ENTITY!
        raise(new OrderConfirmedEvent(this.id));
    }
}
public class OrderService {
    public void confirmOrder(OrderId id) {
        Order order = repo.findById(id).orElseThrow();
        order.confirm();                              // service just orchestrates!
        repo.save(order);
    }
}


// ❌ ANTI-PATTERN 2: OVER-ENGINEERING SIMPLE THINGS
// Applying DDD to everything, including simple CRUD

// For a simple blog post CRUD — DDD is overkill:
// Just use: JPA Entity + Spring Data Repository + Service + Controller
// No aggregates, no domain events, no ports/adapters needed!
// DDD should be applied selectively to CORE domain


// ❌ ANTI-PATTERN 3: CROSSING AGGREGATE BOUNDARIES
// Updating two aggregates in one transaction

// BAD: two aggregates in one transaction
@Transactional
public void transferMoney(String fromId, String toId, double amount) {
    Account source = accountRepo.findById(fromId);
    Account target = accountRepo.findById(toId);
    source.debit(amount);   // modifying aggregate 1
    target.credit(amount);  // modifying aggregate 2 — VIOLATION!
    accountRepo.save(source);
    accountRepo.save(target);
}

// ✅ GOOD: one aggregate per transaction, eventual consistency
@Transactional
public void initiateTransfer(String fromId, String toId, double amount) {
    Account source = accountRepo.findById(fromId);
    source.initiateTransfer(toId, amount);  // raises TransferInitiatedEvent
    accountRepo.save(source);
    // Event handler will credit target account in separate transaction
}

@EventListener
@Transactional
public void onTransferInitiated(TransferInitiatedEvent event) {
    Account target = accountRepo.findById(event.getTargetId());
    target.receiveTransfer(event.getAmount(), event.getTransferId());
    accountRepo.save(target);
}


// ❌ ANTI-PATTERN 4: REPOSITORY IN DOMAIN LOGIC
// Aggregate fetching other aggregates directly

// BAD: aggregate calls repository (fetches another aggregate)
public class Order {
    @Autowired ProductRepository productRepo;  // NEVER inject into entity!

    public void addLine(ProductId productId, Quantity quantity) {
        Product product = productRepo.findById(productId);  // DATABASE CALL IN ENTITY!
        this.lines.add(new OrderLine(productId, quantity, product.getPrice()));
    }
}

// ✅ GOOD: pass the data needed as parameter
public class Order {
    public void addLine(ProductId productId, Quantity quantity, Money unitPrice) {
        this.lines.add(new OrderLine(productId, quantity, unitPrice));
    }
}
// Caller (application service) fetches price from Product before calling


// ❌ ANTI-PATTERN 5: EXPOSING JPA ENTITIES AS DTOs
// Controller returns @Entity directly — leaks persistence details

// BAD:
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable Long id) {
    return orderRepository.findById(id);  // returns JPA entity directly!
    // Problems: lazy loading issues, N+1, exposes internal structure,
    //           circular JSON (bidirectional relationships), security risk
}

// ✅ GOOD: always map to DTO/Response object
@GetMapping("/orders/{id}")
public OrderResponse getOrder(@PathVariable String id) {
    return orderService.findById(OrderId.of(id))
        .map(OrderResponse::from)
        .orElseThrow();
}
```

---

# 14. When to Use What

## 14.1 Architecture Decision Matrix

```
COMPLEXITY OF DOMAIN:
  Low (CRUD, simple rules):
    → MVC + Service Layer + JPA
    → No DDD, no hexagonal, no CQRS
    → Spring Boot + Spring Data is enough

  Medium (some business rules, moderate complexity):
    → MVC + Rich Service Layer
    → Consider Value Objects for domain concepts
    → Maybe Repository pattern
    → Possibly some DDD tactical patterns

  High (complex rules, many concepts, multiple teams):
    → Full DDD (strategic + tactical)
    → Hexagonal architecture
    → Bounded contexts
    → Consider CQRS if read/write models differ significantly

  Very High (financial, healthcare, logistics core domains):
    → DDD + Hexagonal + CQRS
    → Consider Event Sourcing for audit trail
    → Microservices aligned with bounded contexts

TEAM & PROJECT CONSIDERATIONS:
  Small team (<5 devs), short project:
    → MVC, keep it simple
    → Overhead of DDD not worth it
  
  Growing team (5-20 devs):
    → Modular monolith with clear bounded contexts
    → DDD within modules
    → Good boundaries prevent teams stepping on each other
  
  Multiple teams, large system:
    → Microservices or modular monolith
    → Strict bounded context boundaries
    → Full DDD + hexagonal per service/module

ARCHITECTURE SELECTION GUIDE:
                    Simple    Moderate   Complex    Very Complex
Simple CRUD:         MVC         MVC     MVC+DDD     DDD+Hex
Business Logic:      MVC        MVC      DDD         DDD+Hex
Read/Write Split:    N/A        N/A      CQRS        CQRS+ES
Audit Required:      N/A        Log      Log/ES      Event Sourcing
Multiple Teams:      N/A       Modules   BC+modules  Microservices

EVOLUTION PATH:
  1. Start simple: MVC + Service Layer
  2. Extract rich domain objects when: service getting fat with business rules
  3. Add bounded contexts when: different teams working on different parts
  4. Add CQRS when: read/write models significantly different
  5. Add Event Sourcing when: audit trail / time-travel required
  
  "Don't start with the final architecture. Let it evolve."
  "Architecture is not a destination, it's a journey." — Eric Evans
```

## 14.2 Quick Reference

```
MVC:
  Model = business data + logic
  View = presentation
  Controller = request handling
  USE: web apps, REST APIs, any size

DDD Strategic:
  Bounded Context = clear boundary of model
  Ubiquitous Language = shared vocabulary
  Context Map = relationships between contexts
  USE: complex domains, multiple teams

DDD Tactical:
  Entity = identity-based object, mutable, lifecycle
  Value Object = attribute-based, immutable, no identity
  Aggregate = cluster with invariants, single root
  Repository = collection-like persistence interface
  Domain Event = something significant happened
  USE: complex business rules within a context

Hexagonal (Ports & Adapters):
  Port = interface defined by application core
  Adapter = implementation of port
  → Core never depends on infrastructure!
  USE: when you want maximum testability and flexibility

CQRS:
  Command = change state
  Query = read state (no change)
  USE: when read/write models significantly differ

Event Sourcing:
  Store events, not state
  Current state = replay events
  USE: audit trail, time-travel, event-driven integration
```

---

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| DDD Blue Book (Evans) | <https://www.domainlanguage.com/ddd/> |
| Implementing DDD (Vernon) | <https://vaughnvernon.com/> |
| Hexagonal Architecture | <https://alistair.cockburn.us/hexagonal-architecture/> |
| Clean Architecture (Martin) | <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html> |
| CQRS (Greg Young) | <https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf> |
| Martin Fowler DDD | <https://martinfowler.com/tags/domain%20driven%20design.html> |
| Spring MVC Docs | <https://docs.spring.io/spring-framework/docs/current/reference/html/web.html> |
| DDD Community | <https://dddcommunity.org/> |
| EventSourcing.com | <https://eventstore.com/blog/event-sourcing-and-cqrs/> |
| Modular Monolith | <https://www.kamilgrzybek.com/design/modular-monolith-primer/> |

---

*Học theo thứ tự: MVC basics → Layered Architecture → DDD concepts (Ubiquitous Language, Bounded Context) → DDD Tactical (Entity, Value Object, Aggregate) → Hexagonal → CQRS → Event Sourcing*
