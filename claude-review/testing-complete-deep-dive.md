# 🧪 Software Testing — Complete Deep Dive
>
> V-Model, Testing Types, Mock/Stub/Spy, TDD/BDD, Tools, Patterns

---

## 📚 Table of Contents

1. [Testing Fundamentals](#1-testing-fundamentals)
2. [V-Model & Testing Levels](#2-v-model--testing-levels)
3. [Testing Types — Complete Catalog](#3-testing-types--complete-catalog)
4. [Test Doubles — Mock, Stub, Spy, Fake, Dummy](#4-test-doubles--mock-stub-spy-fake-dummy)
5. [TDD — Test Driven Development](#5-tdd--test-driven-development)
6. [BDD — Behavior Driven Development](#6-bdd--behavior-driven-development)
7. [Unit Testing Deep Dive](#7-unit-testing-deep-dive)
8. [Integration Testing](#8-integration-testing)
9. [API Testing](#9-api-testing)
10. [Performance Testing — Load, Stress, Spike, Soak](#10-performance-testing--load-stress-spike-soak)
11. [Security Testing](#11-security-testing)
12. [Testing Tools Ecosystem](#12-testing-tools-ecosystem)
13. [Test Coverage & Metrics](#13-test-coverage--metrics)
14. [Testing Best Practices](#14-testing-best-practices)

---

# 1. Testing Fundamentals

## 1.1 Why Testing?

```
Cost of fixing bugs by phase (relative):
  Requirements:    1x   ← cheapest to fix here!
  Design:          5x
  Coding:         10x
  Integration:    25x
  System test:    50x
  Production:    100x   ← most expensive to fix here!

Testing is NOT optional — it's risk management.
The question isn't "should we test?" but "how much to test?"
```

## 1.2 The Seven Testing Principles

```
1. TESTING SHOWS PRESENCE OF DEFECTS, NOT THEIR ABSENCE
   "Tests can prove there ARE bugs, not that there are NONE"
   → Testing reduces probability of bugs, never eliminates entirely

2. EXHAUSTIVE TESTING IS IMPOSSIBLE
   Can't test all input combinations for even a simple login form
   → Prioritize: risk-based testing, equivalence partitioning

3. EARLY TESTING SAVES TIME AND MONEY
   Find bugs in requirements, not in production
   → Shift-left testing: move testing earlier

4. DEFECTS CLUSTER TOGETHER
   80% of bugs found in 20% of modules (Pareto principle)
   → Focus testing on high-risk, complex areas

5. BEWARE OF THE PESTICIDE PARADOX
   If you run same tests over and over → stop finding new bugs
   Bugs evolve their defenses against old tests
   → Review and update tests regularly, add new ones

6. TESTING IS CONTEXT DEPENDENT
   Safety-critical software (aviation, medical) needs more testing
   E-commerce needs different tests than gaming app
   → Tailor test strategy to product context

7. ABSENCE-OF-ERRORS FALLACY
   A product with 0 bugs is still a failure if it doesn't meet user needs
   → Test against REQUIREMENTS, not just technical correctness
```

## 1.3 Testing Pyramid vs Testing Trophy

```
TESTING PYRAMID (original — Mike Cohn):

              ╱──────────────╲
             ╱    UI/E2E      ╲      Few, Slow, Expensive
            ╱─────────────────╲
           ╱   Integration      ╲    Moderate
          ╱─────────────────────╲
         ╱       Unit            ╲   Many, Fast, Cheap
        ╱─────────────────────────╲

  70% Unit | 20% Integration | 10% E2E

TESTING TROPHY (Kent C. Dodds — for frontend/React):

              ╱───────────╲
             ╱    E2E       ╲    Few
            ╱───────────────╲
           ╱   Integration   ╲   MOST — confidence sweet spot
          ╱─────────────────╲
         ╱      Unit          ╲  Some
        ╱─────────────────────╲
       ╱    Static Analysis    ╲  TypeScript, ESLint (cheapest!)
      ╱─────────────────────────╲

  "Write tests. Not too many. Mostly integration."
  — Because integration tests give most confidence per cost

TESTING ICE CREAM CONE (anti-pattern — avoid!):
         ╱──────────────╲
        ╱      Manual     ╲   MOST (expensive, slow, inconsistent)
       ╱─────────────────╲
      ╱       UI/E2E       ╲   Many
     ╱─────────────────────╲
    ╱    Integration         ╲  Some
   ╱─────────────────────────╲
  ╱         Unit              ╲  Few (inverted pyramid!)
 ╱───────────────────────────╲

  Result: slow pipelines, flaky tests, high cost
  Common in orgs that bolt testing on after development
```

---

# 2. V-Model & Testing Levels

## 2.1 V-Model

```
The V-Model shows each development phase has a corresponding test phase.
Testing is planned DURING development, not AFTER.

DEVELOPMENT SIDE          TESTING SIDE
(Verification)            (Validation)
─────────────────────────────────────────────────────────────────
Business                                            Acceptance
Requirements ──────────────────────────────────→   Testing (UAT)
    │                                                   ↑
System                                          System Testing
Design ─────────────────────────────────────→  (System Test)
    │                                                   ↑
Architecture                                  Integration
Design ─────────────────────────────────────→ Testing
    │                                                   ↑
Module/Detailed                               Unit
Design ─────────────────────────────────────→ Testing
    │                                                   ↑
    └──────────────── CODING ──────────────────────────┘

Left side = What we plan to build (decreasing abstraction)
Right side = How we verify we built it right (increasing scope)
Bottom = most detailed, closest to actual code

Each arrow = test cases DESIGNED during left phase
           = executed during right phase
```

## 2.2 Four Testing Levels

```
LEVEL 1 — UNIT TESTING
  What:  Test individual components in isolation
         Function, method, class, module
  Who:   Developer (or TDD — before coding)
  When:  During coding, every commit
  Tools: JUnit, pytest, Jest, Mocha
  
  Characteristics:
    No external dependencies (DB, network, file system)
    All dependencies mocked/stubbed
    Milliseconds per test
    Hundreds to thousands of tests
    Should run in < 1 minute total

LEVEL 2 — INTEGRATION TESTING
  What:  Test interactions between components
         Service + DB, Module A + Module B, API + Cache
  Who:   Developer / Test Engineer
  When:  After unit tests pass, CI pipeline
  Tools: Spring Boot Test, Testcontainers, Postman
  
  Characteristics:
    Real components interacting (may use test DB)
    Slower than unit (seconds per test)
    Finds interface issues, data format mismatches
    Database migrations, connection pools tested

LEVEL 3 — SYSTEM TESTING
  What:  Test complete, integrated system
         End-to-end user journeys
  Who:   QA team
  When:  After integration, against staging environment
  Tools: Selenium, Playwright, Cypress, Robot Framework
  
  Characteristics:
    Tests full stack (UI → API → DB)
    Black box: no knowledge of internals
    Closest to real user experience
    Much slower (minutes per test)

LEVEL 4 — ACCEPTANCE TESTING
  What:  Verify system meets business requirements
         Does it solve the actual business problem?
  Who:   Business stakeholders + QA + PO
  When:  Before production release
  Tools: Manual, Cucumber, FitNesse
  
  Types:
    UAT (User Acceptance Testing): real users test
    BAT (Business Acceptance Testing): business validates
    Alpha: internal users
    Beta: limited external users
    Contract: system meets contractual obligations
    Regulation: compliance with laws/regulations
```

---

# 3. Testing Types — Complete Catalog

## 3.1 Functional Testing

```
Tests WHAT the system does (behavior, features)

SMOKE TESTING ("Sanity Check"):
  Quick test to verify basic functionality works
  Run BEFORE deeper testing begins
  "Does the app even start and core features work?"
  
  Origin: hardware testing — turn it on, if it smokes, stop testing
  
  Examples:
    Can users log in?
    Does the home page load?
    Can we create a basic order?
    Are all services responding?
  
  When: after every deployment (especially to new environment)
  Duration: 5-15 minutes
  Automated: YES — run on every deployment
  
  Purpose: Gate — don't waste time testing broken build
  If smoke tests FAIL → reject the build, no further testing

SANITY TESTING:
  Subset of regression testing
  Quick check that specific bug fixes work
  Less thorough than full regression
  
  Difference from Smoke:
    Smoke: "Is the build stable enough to test?"
    Sanity: "Does this specific fix actually work?"
  
  When: after bug fix before full regression

REGRESSION TESTING:
  Verify existing functionality still works after changes
  "Did my new feature break something old?"
  
  Types:
    Full regression: run ALL tests (comprehensive, slow)
    Partial regression: run tests related to changed area
    Selective: based on impact analysis
  
  When: every sprint, every major change
  Automation: MUST be automated (too many tests for manual)
  
  Regression suite grows over time:
    Every bug found → add test for it
    Prevents same bug recurring

EXPLORATORY TESTING:
  Simultaneous learning, test design, and execution
  No predefined test cases — tester explores freely
  
  "Charter" based:
    "Explore the checkout flow focusing on edge cases"
    "Explore payment with different card types"
  
  ✅ Finds bugs that scripted tests miss
  ✅ Discovers unexpected behaviors
  ✅ Good for new features, complex flows
  ❌ Not repeatable exactly
  
  Record sessions: note what was explored, bugs found
  Session-Based Test Management (SBTM)

AD-HOC TESTING:
  Informal, unstructured testing
  No documentation, no planning
  Tester's intuition and experience
  
  Pair testing: developer + QA test together
  Buddy testing: developer tests peer's code
```

## 3.2 Non-Functional Testing

```
Tests HOW WELL the system performs (quality attributes)

PERFORMANCE TESTING (parent category):
  Measures system behavior under load
  
  ┌─────────────────────────────────────────────────────────────┐
  │  LOAD TESTING                                               │
  │  Simulate expected production load                          │
  │  Verify system handles normal traffic                       │
  │  Find baseline performance metrics                          │
  │                                                             │
  │  Traffic: ──────────────────── (steady expected load)       │
  │  Goal: System performs within SLO under normal conditions   │
  └─────────────────────────────────────────────────────────────┘
  
  ┌─────────────────────────────────────────────────────────────┐
  │  STRESS TESTING                                             │
  │  Push BEYOND normal capacity                                │
  │  Find the breaking point                                    │
  │  How does it fail? (gracefully or catastrophically?)        │
  │                                                             │
  │  Traffic: ────────────────/─────────────── BREAK POINT      │
  │           normal  →  increasing → failure                   │
  │  Goal: Find limits, ensure graceful degradation             │
  └─────────────────────────────────────────────────────────────┘
  
  ┌─────────────────────────────────────────────────────────────┐
  │  SPIKE TESTING                                              │
  │  Sudden massive traffic increase, then back to normal       │
  │  "What happens when a celebrity tweets about us?"           │
  │                                                             │
  │  Traffic: ────────────╱╲────────────────                    │
  │           normal → spike → normal                           │
  │  Goal: Handle sudden spikes, recover automatically          │
  └─────────────────────────────────────────────────────────────┘
  
  ┌─────────────────────────────────────────────────────────────┐
  │  SOAK TESTING (Endurance Testing)                           │
  │  Sustained normal load for extended period (hours/days)     │
  │  Find memory leaks, resource exhaustion over time           │
  │                                                             │
  │  Traffic: ─────────────────────────────────────── (72h)     │
  │           constant moderate load for long duration          │
  │  Goal: Find slow leaks, degradation over time               │
  └─────────────────────────────────────────────────────────────┘
  
  ┌─────────────────────────────────────────────────────────────┐
  │  VOLUME TESTING                                             │
  │  Large amounts of DATA (not users)                          │
  │  "System with 100M records in DB"                           │
  │                                                             │
  │  Data:  ████████████████████████ (massive dataset)         │
  │  Goal: Find data-related bottlenecks, query degradation     │
  └─────────────────────────────────────────────────────────────┘
  
  ┌─────────────────────────────────────────────────────────────┐
  │  SCALABILITY TESTING                                        │
  │  Can system scale up when adding resources?                 │
  │  Verify horizontal/vertical scaling works                   │
  │                                                             │
  │  2 servers → 4 servers → 8 servers                         │
  │  Does throughput double when we double servers?             │
  └─────────────────────────────────────────────────────────────┘

USABILITY TESTING:
  Real users try to complete tasks with the product
  Observe: confusion, errors, time to complete
  Heuristic evaluation: expert evaluates against usability principles
  
  Jakob Nielsen's 10 Usability Heuristics:
    1. Visibility of system status (show what's happening)
    2. Match between system and real world
    3. User control and freedom (undo/redo)
    4. Consistency and standards
    5. Error prevention
    6. Recognition rather than recall
    7. Flexibility and efficiency of use
    8. Aesthetic and minimalist design
    9. Help users recognize, diagnose, and recover from errors
    10. Help and documentation

ACCESSIBILITY TESTING:
  Verify product usable by people with disabilities
  
  Standards:
    WCAG 2.1 Level A: minimum
    WCAG 2.1 Level AA: recommended (legal standard in many countries)
    WCAG 2.1 Level AAA: enhanced
  
  Tests:
    Keyboard-only navigation
    Screen reader compatibility (NVDA, JAWS, VoiceOver)
    Color contrast ratios
    Alt text for images
    Form labels and ARIA attributes
  
  Tools: axe, Lighthouse, WAVE, Pa11y

COMPATIBILITY TESTING:
  Cross-browser: Chrome, Firefox, Safari, Edge
  Cross-device: desktop, tablet, mobile
  Cross-OS: Windows, macOS, Linux, iOS, Android
  Cross-resolution: 1080p, 4K, mobile screens
  Cross-database: MySQL, PostgreSQL, Oracle
  
  Tools: BrowserStack, Sauce Labs, LambdaTest

LOCALIZATION (L10n) & INTERNATIONALIZATION (i18n) TESTING:
  i18n: app designed to support multiple languages/regions
  L10n: app adapted for specific locale
  
  Test:
    All strings externalized (none hardcoded)
    Date/time formats (MM/DD/YYYY vs DD/MM/YYYY)
    Number formats (1,000.50 vs 1.000,50)
    Currency symbols and positioning
    Right-to-left languages (Arabic, Hebrew)
    String expansion (German text ~30% longer than English)
    Character encoding (UTF-8, Unicode)
```

## 3.3 Specialized Testing Types

```
MUTATION TESTING:
  Test the quality of YOUR tests!
  Automatically introduce bugs (mutations) into code
  If tests still pass → tests are weak (missed the mutation)
  If tests fail → tests caught the bug (tests are good)
  
  Mutation Operators:
    Change + to - (arithmetic)
    Change > to >= (boundary)
    Remove negation (! removed)
    Change && to || (logic)
    Remove method call
    Return null instead of value
  
  Mutation Score = killed / total mutations × 100%
  Good: > 80% mutation score
  
  Tools: PIT Mutation Testing (Java), Stryker (JS/TS), mutmut (Python)
  
  Example:
  // Original code:
  boolean isAdult(int age) { return age >= 18; }
  
  // Mutation 1: change >= to >
  boolean isAdult(int age) { return age > 18; }
  // Good test: isAdult(18) == true → test catches this mutation ✅
  
  // Mutation 2: change 18 to 17
  boolean isAdult(int age) { return age >= 17; }
  // Good test: isAdult(17) == false → test catches this ✅

CONTRACT TESTING:
  Verifies API contracts between services
  Consumer-Driven Contracts: consumers define what they expect
  Providers verify they meet consumer expectations
  
  Without contract testing:
    Team A changes API response format
    Team B's code breaks
    Only found in staging or production!
  
  With Pact (contract testing tool):
    Consumer defines: "I expect GET /users/1 to return { id, name, email }"
    Contract saved as pact file
    Provider runs pact verification: "Does my API match this contract?"
    If not → build fails immediately! Before integration testing!
  
  // Consumer test (JavaScript Pact):
  const interaction = {
      state: 'user 1 exists',
      uponReceiving: 'a request for user 1',
      withRequest: { method: 'GET', path: '/users/1' },
      willRespondWith: {
          status: 200,
          body: { id: 1, name: like('Khang'), email: like('k@test.com') }
      }
  }

CHAOS ENGINEERING / RESILIENCE TESTING:
  Intentionally inject failures to verify system resilience
  "What happens when server X dies?"
  
  Chaos Monkey (Netflix): randomly terminates production instances
  Other chaos experiments:
    Kill random pods (Kubernetes)
    Add network latency
    Kill database connection
    Max out CPU
    Fill disk
    Corrupt network packets
  
  Hypothesis-based:
    "Our system can handle loss of 1 out of 3 payment service instances"
    → Kill 1 instance in production → measure impact
    → Passed: no customer impact
    → Failed: error rate increased → fix the resilience issue

FUZZ TESTING (Fuzzing):
  Send random, malformed, or unexpected inputs
  Find crashes, security vulnerabilities, edge cases
  
  Types:
    Mutation-based: mutate valid inputs
    Generation-based: generate random inputs from scratch
    Coverage-guided: focus on unexplored code paths
  
  What to fuzz:
    File parsers (PDF, image, audio parsers)
    Network protocols
    API endpoints (random JSON structures)
    Command-line argument parsing
  
  Tools: AFL (American Fuzzy Lop), libFuzzer, boofuzz, atheris (Python)
  
  Famous finds via fuzzing: hundreds of CVEs in Firefox, Chrome, SQLite

SNAPSHOT TESTING:
  Capture output, save as "snapshot"
  Future runs compare against snapshot
  Any change = test fails (intentional or unintentional)
  
  Use cases:
    React component rendering (Jest snapshots)
    API response structure
    CLI output
    Database query results
  
  // Jest snapshot:
  test('UserCard renders correctly', () => {
      const tree = renderer.create(<UserCard user={mockUser} />).toJSON()
      expect(tree).toMatchSnapshot()  // creates/compares snapshot
  })
  // First run: creates __snapshots__/test.snap
  // Future runs: must match snapshot exactly
  
  ⚠️  Don't blindly accept snapshot changes!
  ⚠️  Snapshots too large = meaningless (just update blindly)

VISUAL REGRESSION TESTING:
  Pixel-by-pixel comparison of UI screenshots
  Catch unintended visual changes
  
  Tools: Percy, Chromatic, BackstopJS, Playwright visual comparisons
  
  Workflow:
    Baseline: approved screenshots stored
    PR/commit: new screenshots taken
    Diff: highlight pixel differences
    Review: approve/reject visual changes

A/B TESTING (Experimentation):
  Not bug finding — hypothesis validation
  50% users see version A, 50% see version B
  Measure business metrics (conversion, engagement)
  
  Statistical significance required before conclusions!
  Minimum sample size: use power analysis calculator
  
  Tools: LaunchDarkly, Optimizely, Statsig, custom feature flags
```

---

# 4. Test Doubles — Mock, Stub, Spy, Fake, Dummy

> Gerard Meszaros coined the term "Test Double" (stunt double for tests)

## 4.1 Five Types of Test Doubles

```
REAL DEPENDENCY: actual object with real behavior
  Too slow, too brittle, or impossible in unit tests
  (DB calls, HTTP calls, file I/O, time-dependent...)

DUMMY:
  Passed but NEVER USED — just fills a parameter
  No behavior, no return values matter
  
  When: a method requires a parameter you don't need for THIS test
  
  // Need to test UserService.create() but it requires PasswordEncoder
  // PasswordEncoder isn't used in the specific path you're testing
  PasswordEncoder dummy = null; // or new DummyPasswordEncoder()
  UserService service = new UserService(userRepo, dummy, emailService);

STUB:
  Returns PREDEFINED data — no real logic
  "Canned answers" to calls made during test
  Does NOT verify calls were made
  
  When: test needs a response from dependency, don't care about behavior
  
  UserRepository stub = mock(UserRepository.class);
  when(stub.findById(1L)).thenReturn(Optional.of(user));  // predefined answer
  // Don't care HOW MANY TIMES it was called, just return this data

MOCK:
  Pre-programmed with EXPECTATIONS about how it will be called
  Verifies behavior: WAS the method called? HOW MANY TIMES? WITH WHAT ARGS?
  Test FAILS if expectations not met
  
  When: verifying BEHAVIOR, not just state
  "Did sendEmail() get called with the right arguments?"
  
  EmailService mock = mock(EmailService.class);
  // ... run the code under test ...
  verify(mock).sendWelcomeEmail("khang@test.com");     // MUST be called
  verify(mock, times(1)).sendWelcomeEmail(anyString()); // exactly once
  verify(mock, never()).sendAlert(any());               // must NOT be called

SPY:
  Wraps a REAL object — calls go through to real implementation
  BUT intercepts calls so you can verify/override them
  "Partial mock"
  
  When: want mostly real behavior but need to verify calls or override one method
  
  List<String> realList = new ArrayList<>();
  List<String> spy = spy(realList);    // wraps real ArrayList
  spy.add("hello");                     // calls REAL ArrayList.add()
  verify(spy).add("hello");            // verify call was made
  doReturn(5).when(spy).size();        // override just this one method

FAKE:
  Working implementation with SHORTCUTS
  Not suitable for production but works correctly for tests
  
  When: need realistic behavior but full implementation too heavy
  
  // InMemoryUserRepository: implements UserRepository interface
  // but stores in HashMap instead of real DB
  class InMemoryUserRepository implements UserRepository {
      private Map<Long, User> store = new HashMap<>();
      
      @Override
      public User save(User user) {
          store.put(user.getId(), user);
          return user;
      }
      
      @Override
      public Optional<User> findById(Long id) {
          return Optional.ofNullable(store.get(id));
      }
  }
  
  Other fakes:
    In-memory message queue (instead of real Kafka)
    H2 in-memory DB (instead of PostgreSQL)
    WireMock (fake HTTP server)
    Fake clock (control time in tests)
```

## 4.2 Mockito — Complete Guide (Java)

```java
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepository userRepository;           // creates mock

    @Mock
    EmailService emailService;

    @Spy
    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();  // spy on real

    @InjectMocks
    UserService userService;                 // creates UserService, injects mocks

    @Captor
    ArgumentCaptor<User> userCaptor;         // capture argument passed to mock

    // ── STUBBING — define return values ──
    @Test
    void stubbing_examples() {
        // Return value
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Return different values on consecutive calls
        when(userRepository.findAll())
            .thenReturn(List.of(user1))       // first call
            .thenReturn(List.of(user1, user2)) // second call
            .thenReturn(Collections.emptyList()); // subsequent calls

        // Throw exception
        when(userRepository.findById(99L))
            .thenThrow(new EntityNotFoundException("User not found"));

        // Answer based on argument
        when(userRepository.findById(anyLong()))
            .thenAnswer(invocation -> {
                Long id = invocation.getArgument(0);
                return id > 0 ? Optional.of(new User(id)) : Optional.empty();
            });

        // Void methods
        doNothing().when(emailService).sendWelcome(anyString()); // default anyway
        doThrow(new MailException()).when(emailService).sendWelcome("bad@email");
        doAnswer(inv -> { log(inv.getArgument(0)); return null; })
            .when(emailService).sendWelcome(anyString());
    }

    // ── ARGUMENT MATCHERS ──
    @Test
    void argument_matchers() {
        // Exact values
        when(repo.findById(1L)).thenReturn(Optional.of(user));

        // Any value of type
        when(repo.findById(anyLong())).thenReturn(Optional.of(user));
        when(repo.findByName(anyString())).thenReturn(user);
        when(repo.findAll(any(Pageable.class))).thenReturn(page);

        // Custom predicate
        when(repo.findByEmail(argThat(email -> email.contains("@"))))
            .thenReturn(Optional.of(user));

        // Null
        when(repo.findByName(isNull())).thenReturn(null);
        when(repo.findByName(notNull())).thenReturn(user);

        // String matchers
        when(repo.search(contains("khang"))).thenReturn(users);
        when(repo.search(startsWith("kh"))).thenReturn(users);
        when(repo.search(matches("k.*g"))).thenReturn(users);
    }

    // ── VERIFICATION ──
    @Test
    void verification_examples() {
        userService.registerUser(createRequest);

        // Was called at all?
        verify(userRepository).save(any(User.class));

        // Exact number of times
        verify(emailService, times(1)).sendWelcome(anyString());
        verify(emailService, atLeast(1)).sendWelcome(anyString());
        verify(emailService, atMost(2)).sendWelcome(anyString());
        verify(emailService, never()).sendAlert(any());

        // Order of calls
        InOrder inOrder = inOrder(userRepository, emailService);
        inOrder.verify(userRepository).save(any());   // must happen first
        inOrder.verify(emailService).sendWelcome(any()); // then this

        // Capture argument for assertion
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("khang@test.com");
        assertThat(savedUser.getStatus()).isEqualTo(UserStatus.PENDING);

        // No more interactions after verified calls
        verify(userRepository).save(any());
        verifyNoMoreInteractions(userRepository);

        // No interactions at all
        verifyNoInteractions(notificationService);
    }

    // ── SPY EXAMPLE ──
    @Test
    void spy_example() {
        List<String> realList = new ArrayList<>();
        List<String> spyList = spy(realList);

        spyList.add("one");
        spyList.add("two");

        verify(spyList, times(2)).add(anyString());
        assertThat(spyList).hasSize(2);  // real size, real data
        assertThat(spyList.get(0)).isEqualTo("one");

        // Override one method:
        doReturn(10).when(spyList).size();  // must use doReturn with spy!
        assertThat(spyList.size()).isEqualTo(10);  // overridden
    }
}
```

## 4.3 Jest Mocks (JavaScript/TypeScript)

```typescript
// ── jest.fn() — create mock function ──
const mockFn = jest.fn()
mockFn.mockReturnValue(42)
mockFn.mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValue(3)
mockFn.mockResolvedValue({ id: 1, name: 'Khang' })  // for async
mockFn.mockRejectedValue(new Error('API error'))
mockFn.mockImplementation((x: number) => x * 2)

expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(3)
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenLastCalledWith('last-arg')

// ── jest.mock() — mock entire module ──
jest.mock('../api/userApi')
import { fetchUser } from '../api/userApi'
const mockFetchUser = fetchUser as jest.MockedFunction<typeof fetchUser>
mockFetchUser.mockResolvedValue({ id: 1, name: 'Khang' })

// ── Mock module with factory ──
jest.mock('../services/emailService', () => ({
    sendWelcome: jest.fn(),
    sendAlert: jest.fn().mockResolvedValue(undefined)
}))

// ── Spy on object method ──
const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
// ... code that might log errors ...
expect(consoleSpy).toHaveBeenCalledWith('Error message')
consoleSpy.mockRestore()  // restore original

// ── Mock timer ──
jest.useFakeTimers()
const callback = jest.fn()
setTimeout(callback, 1000)
jest.advanceTimersByTime(500)
expect(callback).not.toHaveBeenCalled()
jest.advanceTimersByTime(500)
expect(callback).toHaveBeenCalledTimes(1)
jest.useRealTimers()

// ── Mock Date ──
jest.useFakeTimers().setSystemTime(new Date('2025-05-19'))
const now = new Date()
expect(now.getFullYear()).toBe(2025)
jest.useRealTimers()

// ── beforeEach reset ──
beforeEach(() => {
    jest.clearAllMocks()    // clear calls, instances, results
    jest.resetAllMocks()    // + remove mock implementations
    jest.restoreAllMocks()  // + restore spies to real implementation
})
```

---

# 5. TDD — Test Driven Development

## 5.1 Red → Green → Refactor

```
RED:    Write a FAILING test first (no production code yet)
GREEN:  Write MINIMUM code to make test pass (even hardcode if needed!)
REFACTOR: Clean up code while keeping tests green

The cycle is SHORT — minutes per cycle, not hours!

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│    ┌──── RED ────┐                                               │
│    │             │                                               │
│    ↑  Write      ↓                                               │
│    │  failing    Write                                           │
│    │  test       minimum                                         │
│    │             code                                            │
│    │             │                                               │
│    │         ┌───▼──── GREEN ──────┐                            │
│    │         │                     │                            │
│    │         ↑   All tests        Refactor                      │
│    │         │   pass?      ──────────────▶ Clean code          │
│    │         │   YES!              │        Still green?        │
│    └─────────┘              ───────┘        YES!                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

RULES of TDD:
  1. Write NO production code without a failing test
  2. Write only ENOUGH test to fail (including compilation failure)
  3. Write only ENOUGH production code to make test pass
```

## 5.2 TDD Example — Full Walkthrough

```java
// FEATURE: Build a FizzBuzz kata
// Rules: 1-100, multiples of 3 = "Fizz", 5 = "Buzz", 15 = "FizzBuzz"

// ── CYCLE 1: RED ──
@Test
void number_1_returns_string_1() {
    FizzBuzz fb = new FizzBuzz();
    assertEquals("1", fb.convert(1));  // FAILS: FizzBuzz class doesn't exist
}

// ── CYCLE 1: GREEN (minimum code) ──
class FizzBuzz {
    String convert(int n) {
        return "1";  // hardcoded! but tests pass
    }
}

// ── CYCLE 2: RED ──
@Test
void number_2_returns_string_2() {
    assertEquals("2", fb.convert(2));  // FAILS: returns "1" always
}

// ── CYCLE 2: GREEN ──
String convert(int n) {
    return String.valueOf(n);  // generalized
}

// ── CYCLE 3: RED (multiple of 3) ──
@Test
void multiple_of_3_returns_Fizz() {
    assertEquals("Fizz", fb.convert(3));   // FAILS
    assertEquals("Fizz", fb.convert(9));
}

// ── CYCLE 3: GREEN ──
String convert(int n) {
    if (n % 3 == 0) return "Fizz";
    return String.valueOf(n);
}

// ── CYCLE 4: RED (multiple of 5) ──
@Test
void multiple_of_5_returns_Buzz() {
    assertEquals("Buzz", fb.convert(5));   // FAILS
    assertEquals("Buzz", fb.convert(10));
}

// ── CYCLE 4: GREEN ──
String convert(int n) {
    if (n % 15 == 0) return "FizzBuzz";
    if (n % 3 == 0)  return "Fizz";
    if (n % 5 == 0)  return "Buzz";
    return String.valueOf(n);
}
// Note: 15 must come BEFORE 3 and 5!

// ── CYCLE 5: RED (multiple of 15) ──
@Test
void multiple_of_15_returns_FizzBuzz() {
    assertEquals("FizzBuzz", fb.convert(15));   // now passes!
    assertEquals("FizzBuzz", fb.convert(30));
}
// Tests pass immediately — already handled in GREEN step 4

// ── REFACTOR ──
// Code is already clean here. For complex code, refactor would:
//   Extract constants, rename variables, reduce duplication
//   All tests must still pass!

// FULL TEST SUITE EMERGED:
@ParameterizedTest
@CsvSource({
    "1,  1",
    "2,  2",
    "3,  Fizz",
    "5,  Buzz",
    "9,  Fizz",
    "10, Buzz",
    "15, FizzBuzz",
    "30, FizzBuzz",
    "7,  7"
})
void fizzBuzz_conversions(int input, String expected) {
    assertEquals(expected, new FizzBuzz().convert(input));
}
```

## 5.3 TDD for Real-World Code

```java
// FEATURE: UserRegistrationService
// Requirements:
//   - Email must be unique
//   - Password must be at least 8 chars with uppercase + lowercase + digit
//   - Send welcome email after registration
//   - Return created user

@ExtendWith(MockitoExtension.class)
class UserRegistrationServiceTest {

    @Mock UserRepository userRepository;
    @Mock EmailService emailService;
    @Mock PasswordEncoder passwordEncoder;
    @InjectMocks UserRegistrationService service;

    // TEST 1: Successful registration
    @Test
    void should_register_user_successfully() {
        // Arrange
        CreateUserRequest request = new CreateUserRequest(
            "Khang", "khang@test.com", "SecurePass1!"
        );
        when(userRepository.existsByEmail("khang@test.com")).thenReturn(false);
        when(passwordEncoder.encode("SecurePass1!")).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });

        // Act
        UserResponse response = service.register(request);

        // Assert
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Khang");
        assertThat(response.email()).isEqualTo("khang@test.com");

        // Verify side effects
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getPasswordHash()).isEqualTo("hashed");
        verify(emailService).sendWelcome("khang@test.com", "Khang");
    }

    // TEST 2: Duplicate email
    @Test
    void should_throw_when_email_already_exists() {
        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        assertThatThrownBy(() ->
            service.register(new CreateUserRequest("User", "existing@test.com", "Pass1!"))
        )
        .isInstanceOf(DuplicateEmailException.class)
        .hasMessageContaining("existing@test.com");

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendWelcome(any(), any());
    }

    // TEST 3: Weak password
    @ParameterizedTest
    @ValueSource(strings = {
        "short",          // too short
        "alllowercase1",  // no uppercase
        "ALLUPPERCASE1",  // no lowercase
        "NoDigitsHere",   // no digit
    })
    void should_throw_when_password_is_weak(String weakPassword) {
        assertThatThrownBy(() ->
            service.register(new CreateUserRequest("User", "u@test.com", weakPassword))
        ).isInstanceOf(WeakPasswordException.class);
    }

    // TEST 4: Email sending failure doesn't affect registration
    @Test
    void should_succeed_even_if_email_fails() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.save(any())).thenReturn(savedUser);
        doThrow(new MailException()).when(emailService).sendWelcome(any(), any());

        // Should not throw — email failure is logged but not propagated
        assertDoesNotThrow(() -> service.register(validRequest));
        verify(userRepository).save(any());
    }
}
```

## 5.4 TDD Benefits & Challenges

```
BENEFITS:
  ✅ Forces clear thinking before coding (understand before implementing)
  ✅ Instant feedback loop (know if you broke something)
  ✅ Built-in regression suite (free from day 1)
  ✅ Better design: TDD leads to loosely coupled, SRP code
     "If code is hard to test → code has poor design"
  ✅ Living documentation: tests show how to USE code
  ✅ Confidence to refactor (safety net!)
  ✅ Reduces debugging time significantly
  ✅ Lower bug count in production

CHALLENGES:
  ❌ Initial learning curve — writing tests first feels unnatural
  ❌ Hard for: UI code, legacy code, exploratory code
  ❌ Requires discipline and team agreement
  ❌ Mock-heavy tests can be brittle (test implementation not behavior)
  ❌ Can lead to over-engineering if not careful
  ❌ Integration issues still found at integration testing

TDD ANTIPATTERNS:
  Writing tests AFTER coding (defeats the purpose)
  Tests that test implementation not behavior
  One test per method (instead of one test per BEHAVIOR)
  Testing trivial getters/setters
  Giant tests that cover too much
  Tests with no assertions
  Hardcoded test data (use builders/factories!)
  
TYPES OF TDD:
  Classic TDD (Chicago style): Start from domain model, mock sparingly
  Mockist TDD (London style): Mock everything, test interactions
  Outside-In TDD: Start from acceptance test, work inward
```

---

# 6. BDD — Behavior Driven Development

## 6.1 BDD Overview

```
BDD = TDD + Business language + Collaboration
"Specification by Example"

Bridges gap between:
  Business (what should the system do?)
  Development (how to build it?)
  QA (how to verify it?)

Everyone writes scenarios together BEFORE development!

3 Amigos meeting:
  Business Analyst/PO: "what problem are we solving?"
  Developer: "how might we build this?"
  QA: "how will we test this? what could go wrong?"

Output: Gherkin scenarios that become:
  Living documentation
  Acceptance tests
  Communication tool
```

## 6.2 Gherkin Language

```gherkin
# ── FEATURE ──
Feature: User Login
  As a registered user
  I want to log into my account
  So that I can access my personal data

  Background:                                   # Runs before EACH scenario
    Given a user exists with email "k@test.com" and password "Pass1234!"

  # ── HAPPY PATH ──
  Scenario: Successful login with valid credentials
    Given I am on the login page
    When  I enter email "k@test.com" and password "Pass1234!"
    And   I click the "Login" button
    Then  I should be redirected to the dashboard
    And   I should see "Welcome back, Khang!" message
    And   the session cookie should be set

  # ── SAD PATH ──
  Scenario: Login fails with wrong password
    Given I am on the login page
    When  I enter email "k@test.com" and password "wrongpassword"
    And   I click the "Login" button
    Then  I should see error message "Invalid email or password"
    And   I should remain on the login page
    And   no session cookie should be set

  Scenario: Account locked after 5 failed attempts
    Given I am on the login page
    When  I try to login with wrong password 5 times
    Then  my account should be locked
    And   I should see "Account locked. Check your email for unlock instructions"
    And   I should receive a lock notification email

  # ── PARAMETERIZED SCENARIOS ──
  Scenario Outline: Login validation
    Given I am on the login page
    When  I enter email "<email>" and password "<password>"
    And   I click the "Login" button
    Then  I should see "<error_message>"

    Examples:
      | email           | password    | error_message               |
      | (empty)         | Pass1234!   | Email is required           |
      | notanemail      | Pass1234!   | Invalid email format        |
      | k@test.com      | (empty)     | Password is required        |
      | k@test.com      | short       | Password too short          |
      | unknown@test.com| Pass1234!   | Invalid email or password   |

# ── DATA TABLES ──
  Scenario: Create user with complete profile
    Given I create a user with the following details:
      | Field     | Value              |
      | name      | Khang              |
      | email     | khang@test.com     |
      | age       | 21                 |
      | role      | developer          |
    Then a user with email "khang@test.com" should exist in the system
```

## 6.3 Cucumber (Java) Step Definitions

```java
// Steps connect Gherkin to actual code
@SpringBootTest
@AutoConfigureMockMvc
class LoginStepDefinitions {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;

    private ResultActions result;

    @Given("a user exists with email {string} and password {string}")
    public void aUserExistsWithEmailAndPassword(String email, String password) {
        User user = User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(password))
            .name("Khang")
            .build();
        userRepository.save(user);
    }

    @Given("I am on the login page")
    public void iAmOnTheLoginPage() {
        // For API-level BDD: no-op or verify endpoint exists
        // For UI BDD: navigate browser to /login
    }

    @When("I enter email {string} and password {string}")
    public void iEnterEmailAndPassword(String email, String password) {
        this.email = email;
        this.password = password;
    }

    @When("I click the {string} button")
    public void iClickTheButton(String buttonName) throws Exception {
        if ("Login".equals(buttonName)) {
            result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "%s", "password": "%s"}
                    """.formatted(email, password)));
        }
    }

    @Then("I should be redirected to the dashboard")
    public void iShouldBeRedirectedToTheDashboard() throws Exception {
        result.andExpect(status().isOk());
    }

    @Then("I should see {string} message")
    public void iShouldSeeMessage(String expectedMessage) throws Exception {
        result.andExpect(jsonPath("$.message").value(expectedMessage));
    }

    @Then("no session cookie should be set")
    public void noSessionCookieShouldBeSet() throws Exception {
        result.andExpect(cookie().doesNotExist("SESSION"));
    }

    @When("I try to login with wrong password {int} times")
    public void iTryToLoginWithWrongPasswordTimes(int times) throws Exception {
        for (int i = 0; i < times; i++) {
            mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"email": "k@test.com", "password": "wrong"}"""));
        }
        result = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""{"email": "k@test.com", "password": "wrong"}"""));
    }
}
```

---

# 7. Unit Testing Deep Dive

## 7.1 FIRST Properties of Good Unit Tests

```
F — FAST
  Milliseconds, not seconds
  Slow tests = ignored tests
  No I/O (disk, network, DB) in unit tests

I — ISOLATED / INDEPENDENT
  Tests don't depend on each other
  Any test can run alone
  Any test can run in any order
  State from one test doesn't bleed into another

R — REPEATABLE
  Same result every run
  No time-dependent logic (use fake clock!)
  No random data without fixed seed
  No network calls (different results each time)

S — SELF-VALIDATING
  Binary pass/fail — no manual inspection
  Clear assertion messages when failing
  Never: "check log output to verify correctness"

T — THOROUGH / TIMELY
  Cover happy paths, edge cases, error paths
  Written just before or with the code (not months later)
  
Test naming: should describe BEHAVIOR, not method name
  ❌ testCalculateTax()
  ✅ should_return_10_percent_tax_for_income_50M()
  ✅ given_income_above_threshold_when_calculateTax_then_applies_higher_rate()
  
  Pattern: [given_context_]when_action_then_expected_result
```

## 7.2 AAA Pattern — Arrange, Act, Assert

```java
@Test
void should_calculate_order_total_with_discount() {
    // ── ARRANGE — set up the world ──
    Product laptop = Product.builder()
        .id(1L).name("MacBook").price(BigDecimal.valueOf(25000000)).build();
    Product mouse = Product.builder()
        .id(2L).name("Mouse").price(BigDecimal.valueOf(500000)).build();

    Order order = new Order();
    order.addItem(new OrderItem(laptop, 1));
    order.addItem(new OrderItem(mouse, 2));

    Discount discount = new PercentageDiscount(10);  // 10% off

    // ── ACT — execute the behavior ──
    BigDecimal total = orderCalculator.calculateTotal(order, discount);

    // ── ASSERT — verify the outcome ──
    BigDecimal expected = BigDecimal.valueOf(23400000);  // (25M + 1M) × 0.9
    assertThat(total)
        .usingComparatorWithPrecision(BigDecimal.valueOf(0.01))
        .isEqualByComparingTo(expected);
}

// ── GIVEN-WHEN-THEN (BDD style, same concept) ──
@Test
void givenUserWithSufficientBalance_whenWithdraw_thenBalanceDecreases() {
    // Given
    BankAccount account = new BankAccount("ACC001", BigDecimal.valueOf(1000));

    // When
    account.withdraw(BigDecimal.valueOf(300));

    // Then
    assertThat(account.getBalance()).isEqualByComparingTo("700");
}
```

## 7.3 AssertJ — Fluent Assertions (Java)

```java
// Basic assertions
assertThat(value).isEqualTo(expected)
assertThat(value).isNotEqualTo(other)
assertThat(value).isNull()
assertThat(value).isNotNull()
assertThat(value).isInstanceOf(String.class)

// Numbers
assertThat(3.14).isCloseTo(Math.PI, within(0.01))
assertThat(42).isBetween(1, 100)
assertThat(5).isGreaterThan(3)
assertThat(5).isLessThanOrEqualTo(5)

// Strings
assertThat("Hello World")
    .isEqualTo("Hello World")
    .isEqualToIgnoringCase("HELLO WORLD")
    .contains("World")
    .startsWith("Hello")
    .endsWith("World")
    .hasSize(11)
    .matches("[A-Za-z ]+")
    .doesNotContain("Foo")

// Collections
assertThat(List.of(1, 2, 3))
    .hasSize(3)
    .contains(1, 2)
    .containsExactly(1, 2, 3)  // exact order
    .containsExactlyInAnyOrder(3, 1, 2)
    .doesNotContain(4, 5)
    .allMatch(n -> n > 0)
    .anyMatch(n -> n == 2)
    .noneMatch(n -> n < 0)
    .isSortedAccordingTo(Comparator.naturalOrder())

// Objects
assertThat(user)
    .isNotNull()
    .hasFieldOrPropertyWithValue("email", "k@test.com")
    .hasFieldOrPropertyWithValue("age", 21)

// Extracting fields
assertThat(users)
    .extracting("name")
    .containsExactlyInAnyOrder("Alice", "Bob", "Khang")

assertThat(users)
    .extracting(User::getName, User::getEmail)
    .containsExactly(
        tuple("Alice", "alice@test.com"),
        tuple("Bob", "bob@test.com")
    )

// Exceptions
assertThatThrownBy(() -> service.getUser(-1L))
    .isInstanceOf(IllegalArgumentException.class)
    .hasMessage("ID must be positive")
    .hasMessageContaining("positive")

assertThatExceptionOfType(UserNotFoundException.class)
    .isThrownBy(() -> service.getUser(999L))
    .withMessage("User 999 not found")

assertDoesNotThrow(() -> service.getUser(1L))

// Soft assertions (collect ALL failures, not stop at first)
SoftAssertions.assertSoftly(soft -> {
    soft.assertThat(user.getName()).isEqualTo("Khang");
    soft.assertThat(user.getEmail()).isEqualTo("k@test.com");
    soft.assertThat(user.getAge()).isEqualTo(21);
    // All 3 failures reported, not just first
})
```

## 7.4 Parameterized Tests

```java
// JUnit 5 Parameterized Tests
@ParameterizedTest
@ValueSource(strings = {"admin", "user", "moderator"})
void should_create_valid_role(String roleName) {
    assertDoesNotThrow(() -> new Role(roleName));
}

@ParameterizedTest
@ValueSource(ints = {0, -1, -100, Integer.MIN_VALUE})
void should_reject_non_positive_quantity(int quantity) {
    assertThatThrownBy(() -> new OrderItem(product, quantity))
        .isInstanceOf(IllegalArgumentException.class);
}

@ParameterizedTest
@CsvSource({
    "100,  0.05,  5.00",   // amount, taxRate, expectedTax
    "200,  0.10, 20.00",
    "1000, 0.20, 200.00",
})
void should_calculate_correct_tax(double amount, double rate, double expectedTax) {
    assertThat(calculator.tax(amount, rate))
        .isCloseTo(expectedTax, within(0.001));
}

@ParameterizedTest
@CsvFileSource(resources = "/test-data/tax-calculations.csv", numLinesToSkip = 1)
void should_calculate_tax_from_csv_file(double amount, double rate, double expected) {
    // reads from src/test/resources/test-data/tax-calculations.csv
    assertThat(calculator.tax(amount, rate)).isCloseTo(expected, within(0.001));
}

@ParameterizedTest
@MethodSource("provideDiscountScenarios")
void should_apply_correct_discount(Order order, Discount discount, BigDecimal expected) {
    assertThat(calculator.calculateTotal(order, discount)).isEqualTo(expected);
}

static Stream<Arguments> provideDiscountScenarios() {
    return Stream.of(
        Arguments.of(orderWith100k(), noDiscount(), new BigDecimal("100000")),
        Arguments.of(orderWith100k(), tenPercent(), new BigDecimal("90000")),
        Arguments.of(orderWith100k(), fixedDiscount10k(), new BigDecimal("90000"))
    );
}

@ParameterizedTest
@EnumSource(UserStatus.class)
void should_handle_all_user_statuses(UserStatus status) {
    User user = new User("test@test.com", status);
    assertDoesNotThrow(() -> service.processUser(user));
}

@ParameterizedTest
@EnumSource(value = UserStatus.class, names = {"ACTIVE", "PENDING"})
void should_allow_login_for_active_statuses(UserStatus status) {
    assertThat(authService.canLogin(userWithStatus(status))).isTrue();
}
```

---

# 8. Integration Testing

## 8.1 Spring Boot Integration Tests

```java
// ── FULL CONTEXT (@SpringBootTest) ──
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional        // rollback after each test
@ActiveProfiles("test")
class OrderControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired OrderRepository orderRepository;
    @Autowired UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(User.builder()
            .name("Test User")
            .email("test@test.com")
            .build());
    }

    @Test
    @WithMockUser(username = "test@test.com", roles = "USER")
    void createOrder_withValidRequest_returns201() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(
            List.of(new OrderItemRequest(1L, 2)),
            "123 Main St"
        );

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.items", hasSize(1)))
            .andDo(print());  // prints request/response for debugging
    }
}

// ── SLICE TESTS — load only relevant layers ──

// @DataJpaTest — only JPA, uses H2 by default
@DataJpaTest
class UserRepositoryTest {

    @Autowired TestEntityManager em;
    @Autowired UserRepository userRepository;

    @Test
    void findByEmail_shouldReturnUser_whenExists() {
        em.persistAndFlush(User.builder()
            .email("test@test.com").name("Test").build());

        Optional<User> result = userRepository.findByEmail("test@test.com");

        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("test@test.com");
    }

    @Test
    void findByStatus_shouldReturnPagedResults() {
        // Create 25 active users
        IntStream.range(0, 25).forEach(i ->
            em.persist(User.builder()
                .email("user" + i + "@test.com")
                .status(UserStatus.ACTIVE).build()));
        em.flush();

        Page<User> page = userRepository.findByStatus(
            UserStatus.ACTIVE, PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(10);
        assertThat(page.getTotalElements()).isEqualTo(25);
    }
}

// @WebMvcTest — only MVC layer, mocks services
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean UserService userService;  // auto-mocked!

    @Test
    void getUser_shouldReturn200_withValidUser() throws Exception {
        when(userService.findById(1L)).thenReturn(
            new UserResponse(1L, "Khang", "k@test.com", LocalDateTime.now())
        );

        mockMvc.perform(get("/api/users/1")
                .header("Authorization", "Bearer " + validToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Khang"))
            .andExpect(jsonPath("$.email").value("k@test.com"));
    }
}
```

## 8.2 Testcontainers

```java
// Real DB/Redis/Kafka in tests using Docker containers!
@SpringBootTest
@Testcontainers
class RealDatabaseTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @Container
    static RedisContainer redis = new RedisContainer(
        DockerImageName.parse("redis:7-alpine"));

    @Container
    static KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.4.0"));

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired UserRepository userRepository;

    @Test
    void should_save_and_retrieve_user_from_real_postgres() {
        User user = userRepository.save(User.builder()
            .name("Khang").email("k@test.com").build());

        assertThat(user.getId()).isNotNull();
        assertThat(userRepository.findById(user.getId())).isPresent();
    }
}

// WireMock — fake HTTP server for external API testing
@SpringBootTest
@ExtendWith(WireMockExtension.class)
class PaymentServiceTest {

    @RegisterExtension
    static WireMockExtension wireMock = WireMockExtension.newInstance()
        .options(wireMockConfig().port(8089))
        .build();

    @Test
    void should_process_payment_via_stripe_api() {
        wireMock.stubFor(post(urlEqualTo("/v1/charges"))
            .withHeader("Authorization", containing("Bearer sk_test"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"id": "ch_123", "status": "succeeded", "amount": 5000}
                    """)));

        PaymentResult result = paymentService.charge("customer_123", 5000);

        assertThat(result.getStatus()).isEqualTo("succeeded");
        wireMock.verify(postRequestedFor(urlEqualTo("/v1/charges")));
    }
}
```

---

# 9. API Testing

## 9.1 REST API Testing with RestAssured

```java
// RestAssured — fluent API testing library
@SpringBootTest(webEnvironment = WebEnvironment.DEFINED_PORT)
class UserApiTest {

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = 8080;
        RestAssured.basePath = "/api/v1";
    }

    @Test
    void getUser_shouldReturn200_withCorrectBody() {
        given()
            .header("Authorization", "Bearer " + getTestToken())
            .accept(ContentType.JSON)
        .when()
            .get("/users/{id}", 1)
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("id", equalTo(1))
            .body("name", equalTo("Khang"))
            .body("email", matchesPattern("[a-z]+@[a-z]+\\.[a-z]+"))
            .body("orders", hasSize(greaterThan(0)))
            .time(lessThan(500L));  // must respond in < 500ms
    }

    @Test
    void createUser_shouldReturn201_withLocationHeader() {
        String requestBody = """
            {
                "name": "New User",
                "email": "newuser@test.com",
                "password": "SecurePass1!"
            }
            """;

        String location =
            given()
                .contentType(ContentType.JSON)
                .body(requestBody)
            .when()
                .post("/users")
            .then()
                .statusCode(201)
                .header("Location", matchesPattern(".*/users/\\d+"))
                .body("id", notNullValue())
                .body("name", equalTo("New User"))
            .extract()
                .header("Location");

        // Verify the created resource is accessible
        given()
            .header("Authorization", "Bearer " + getTestToken())
        .when()
            .get(location)
        .then()
            .statusCode(200)
            .body("email", equalTo("newuser@test.com"));
    }

    @Test
    void deleteUser_shouldReturn204_andUserShouldNotBeAccessible() {
        given()
            .header("Authorization", "Bearer " + getAdminToken())
        .when()
            .delete("/users/{id}", userId)
        .then()
            .statusCode(204);

        given()
            .header("Authorization", "Bearer " + getTestToken())
        .when()
            .get("/users/{id}", userId)
        .then()
            .statusCode(404);
    }
}
```

## 9.2 Postman / Newman

```javascript
// Postman test scripts (JavaScript in Tests tab)

// Test response status
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200)
})

// Parse response body
const body = pm.response.json()

// Assert body structure
pm.test("Response has required fields", () => {
    pm.expect(body).to.have.property('id')
    pm.expect(body).to.have.property('name')
    pm.expect(body).to.have.property('email')
    pm.expect(body.id).to.be.a('number')
    pm.expect(body.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
})

// Assert response time
pm.test("Response time < 500ms", () => {
    pm.expect(pm.response.responseTime).to.be.below(500)
})

// Store for next request (chaining)
pm.collectionVariables.set("userId", body.id)
pm.collectionVariables.set("authToken", body.token)

// Environment-specific
const baseUrl = pm.environment.get("BASE_URL")

// Schema validation
const schema = {
    type: "object",
    required: ["id", "name", "email"],
    properties: {
        id: { type: "number" },
        name: { type: "string" },
        email: { type: "string", format: "email" }
    }
}
pm.test("Response matches schema", () => {
    pm.response.to.have.jsonSchema(schema)
})

// Run Postman collections in CI:
// newman run collection.json -e environment.json --reporters junit,cli
// Output: JUnit XML for CI system to parse results
```

---

# 10. Performance Testing — Load, Stress, Spike, Soak

## 10.1 k6 Performance Testing

```javascript
// k6 — modern performance testing tool (JavaScript-based)
// https://k6.io/docs/

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const responseTimeTrend = new Trend('custom_response_time')
const requestCount = new Counter('total_requests')

// ── TEST SCENARIOS ──
export const options = {
    scenarios: {
        // LOAD TEST: ramp up to normal load
        load_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 50 },   // ramp up to 50 users in 1min
                { duration: '3m', target: 50 },   // hold 50 users for 3min
                { duration: '1m', target: 0 },    // ramp down
            ],
        },

        // STRESS TEST: push beyond normal
        stress_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 100 },
                { duration: '5m', target: 100 },
                { duration: '2m', target: 200 },  // increase beyond normal
                { duration: '5m', target: 200 },
                { duration: '2m', target: 300 },  // keep pushing
                { duration: '5m', target: 300 },
                { duration: '2m', target: 0 },
            ],
        },

        // SPIKE TEST: sudden burst
        spike_test: {
            executor: 'ramping-vus',
            stages: [
                { duration: '10s', target: 10 },  // normal
                { duration: '1m',  target: 1000}, // SPIKE!
                { duration: '10s', target: 10 },  // back to normal
                { duration: '3m',  target: 10 },  // recovery
                { duration: '10s', target: 0 },
            ],
        },

        // SOAK TEST: sustained load
        soak_test: {
            executor: 'constant-vus',
            vus: 50,
            duration: '4h',  // 4 hours!
        },
    },

    // Performance thresholds (fail test if violated)
    thresholds: {
        http_req_duration: ['p(95)<200', 'p(99)<500'], // 95th pct < 200ms
        http_req_failed: ['rate<0.01'],                 // error rate < 1%
        errors: ['rate<0.05'],                          // custom: < 5% errors
    },
}

const BASE_URL = 'https://api.example.com'

// Pre-test setup
export function setup() {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
        email: 'test@test.com',
        password: 'Test1234!'
    }), { headers: { 'Content-Type': 'application/json' } })

    return { token: loginRes.json('token') }
}

// Main test function (runs per virtual user per iteration)
export default function(data) {
    const headers = {
        'Authorization': `Bearer ${data.token}`,
        'Content-Type': 'application/json',
    }

    // Scenario 1: Browse products (weighted: 60% of traffic)
    if (Math.random() < 0.6) {
        const res = http.get(`${BASE_URL}/api/products?page=1&limit=20`, { headers })

        check(res, {
            'status is 200': r => r.status === 200,
            'has products': r => r.json('data').length > 0,
            'response time OK': r => r.timings.duration < 200,
        })

        errorRate.add(res.status !== 200)
        responseTimeTrend.add(res.timings.duration)
    }

    // Scenario 2: Search (30%)
    else if (Math.random() < 0.9) {
        const res = http.get(
            `${BASE_URL}/api/products/search?q=laptop`,
            { headers }
        )
        check(res, { 'search returns 200': r => r.status === 200 })
    }

    // Scenario 3: Create order (10%)
    else {
        const res = http.post(`${BASE_URL}/api/orders`,
            JSON.stringify({ productId: 1, quantity: 1 }),
            { headers }
        )
        check(res, {
            'order created': r => r.status === 201,
            'has order ID': r => r.json('id') !== undefined,
        })
    }

    requestCount.add(1)
    sleep(1 + Math.random() * 2)  // think time: 1-3 seconds
}

// Run: k6 run --out influxdb=http://localhost:8086/k6 test.js
// Grafana dashboard shows real-time results
```

---

# 11. Security Testing

## 11.1 OWASP Top 10 Testing

```
OWASP Top 10 Web Application Security Risks (2021):

A01 — Broken Access Control:
  Test: Can user X access user Y's data?
  Test: Can role=USER access admin endpoints?
  Test: Can I modify another user's order by changing ID in URL?
  Tool: OWASP ZAP, manual testing, Burp Suite

A02 — Cryptographic Failures:
  Test: Are passwords stored as plain text?
  Test: Is sensitive data transmitted over HTTP?
  Test: Are weak algorithms used (MD5, SHA1)?
  Test: Are secrets (API keys) in source code?
  Tool: Semgrep, truffleHog (scan for secrets)

A03 — Injection (SQL, NoSQL, LDAP):
  Test SQL injection:
    Input: ' OR '1'='1
    Input: 1; DROP TABLE users; --
    Input: 1 UNION SELECT * FROM users--
  Tool: SQLMap, manual testing

A04 — Insecure Design:
  Test: Is there rate limiting?
  Test: Can I enumerate user accounts?
  Test: Are there brute force protections?
  Review: threat modeling

A05 — Security Misconfiguration:
  Test: Are default credentials in use?
  Test: Is verbose error info exposed?
  Test: Are unnecessary features enabled?
  Test: Are HTTP security headers present?

A06 — Vulnerable and Outdated Components:
  Test: Are dependencies up to date?
  Tool: OWASP Dependency Check, Snyk, GitHub Dependabot

A07 — Identification and Authentication Failures:
  Test: Brute force login (no lockout?)
  Test: Weak session IDs?
  Test: Session not invalidated on logout?
  Test: Multi-factor authentication bypassed?

A08 — Software and Data Integrity Failures:
  Test: Is CI/CD pipeline secured?
  Test: Are library checksums verified?
  Test: Are JWT claims validated?

A09 — Security Logging and Monitoring Failures:
  Test: Are failed logins logged?
  Test: Are admin actions logged?
  Test: Alerts on suspicious activity?

A10 — Server-Side Request Forgery (SSRF):
  Test: Can I make server request internal URLs?
  Input: url=http://169.254.169.254/metadata (AWS metadata)
  Input: url=http://localhost:8080/admin
```

## 11.2 Security Testing Tools

```bash
# SAST (Static Analysis) — analyze source code

# SonarQube: code quality + security
sonar-scanner \
  -Dsonar.projectKey=myapp \
  -Dsonar.sources=./src \
  -Dsonar.host.url=http://localhost:9000

# Semgrep: pattern-based code scanning
semgrep --config=p/owasp-top-ten .
semgrep --config=p/java .
semgrep --config=p/spring .

# Trivy: container image scanning
trivy image myapp:latest
# Reports: CVEs in OS packages and application dependencies

# DAST (Dynamic Analysis) — attack running app

# OWASP ZAP (Zed Attack Proxy)
# Automated scan:
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.myapp.com \
  -r zap-report.html

# Nikto: web server scanner
nikto -h https://staging.myapp.com

# Dependency scanning
# OWASP Dependency Check
mvn org.owasp:dependency-check-maven:check

# Snyk
snyk test
snyk monitor

# Secret scanning
trufflehog git --repo https://github.com/myorg/myapp
gitleaks detect --source=.

# SSL/TLS testing
testssl.sh https://myapp.com
# Reports: cipher suites, protocols, certificate issues
```

---

# 12. Testing Tools Ecosystem

## 12.1 Java Testing Stack

```
JUnit 5 (Jupiter) — test framework
  @Test, @BeforeEach, @AfterEach, @BeforeAll, @AfterAll
  @Disabled, @Tag, @DisplayName
  @Nested (nested test classes)
  @ParameterizedTest
  Assumptions: assumeTrue, assumingThat
  Docs: https://junit.org/junit5/docs/current/user-guide/

Mockito — mocking framework
  mock(), spy(), verify(), when().thenReturn()
  @Mock, @Spy, @InjectMocks, @Captor
  Docs: https://javadoc.io/doc/org.mockito/mockito-core/latest/

AssertJ — fluent assertions
  assertThat(x).isEqualTo(y).hasSize(n)
  SoftAssertions for multiple assertions
  Docs: https://assertj.github.io/doc/

Testcontainers — real infrastructure in tests
  PostgreSQLContainer, RedisContainer, KafkaContainer
  Docs: https://testcontainers.com/

WireMock — HTTP service mock
  stubFor(get("/api").willReturn(aResponse()))
  Docs: https://wiremock.org/docs/

RestAssured — REST API testing
  given().when().get("/users").then().statusCode(200)
  Docs: https://rest-assured.io/

Awaitility — asynchronous testing
  await().atMost(5, SECONDS).until(() -> queue.isEmpty())
  Docs: http://www.awaitility.org/

PITest — mutation testing
  Docs: https://pitest.org/

Jacoco — code coverage
  Maven/Gradle plugin, HTML + XML reports
  Docs: https://www.jacoco.org/
```

## 12.2 JavaScript/TypeScript Testing Stack

```javascript
// Jest — all-in-one (test runner + assertions + mocking)
// Built-in: describe, it/test, expect, jest.fn(), jest.mock()
// Docs: https://jestjs.io/

// Vitest — Jest-compatible, faster (uses Vite)
// Drop-in replacement for Jest in Vite projects
// Docs: https://vitest.dev/

// React Testing Library — component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('login form submits with credentials', async () => {
    const handleSubmit = jest.fn()
    render(<LoginForm onSubmit={handleSubmit} />)

    await userEvent.type(screen.getByLabelText('Email'), 'test@test.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Pass1234!')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'Pass1234!'
    })
})
// Docs: https://testing-library.com/

// Playwright — E2E testing
import { test, expect } from '@playwright/test'

test('user can login and see dashboard', async ({ page }) => {
    await page.goto('https://myapp.com/login')
    await page.fill('[name=email]', 'test@test.com')
    await page.fill('[name=password]', 'Pass1234!')
    await page.click('button[type=submit]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toHaveText('Welcome back, Test User!')
})
// Docs: https://playwright.dev/

// Cypress — E2E + component testing
cy.get('[data-testid=email-input]').type('test@test.com')
cy.get('[data-testid=password-input]').type('Pass1234!')
cy.get('[data-testid=submit-btn]').click()
cy.url().should('include', '/dashboard')
// Docs: https://docs.cypress.io/

// Stryker — mutation testing for JS/TS
// Docs: https://stryker-mutator.io/
```

## 12.3 Performance & API Testing Tools

```
k6 — performance testing (JavaScript-based)
  Free, open source, scripting-based
  Excellent cloud integration
  Docs: https://k6.io/docs/

JMeter — Apache JMeter
  GUI-based test creation
  Long history, enterprise support
  Can be complex to set up
  Docs: https://jmeter.apache.org/

Gatling — performance testing (Scala DSL)
  Good for developers
  Detailed HTML reports
  Docs: https://gatling.io/

Locust — Python-based performance testing
  Write tests in Python
  Distributed load testing
  Docs: https://locust.io/

Postman / Newman — API testing
  GUI test creation
  Collection runner for CI
  Newman: CLI to run collections
  Docs: https://www.postman.com/docs/

Insomnia — API testing (alternative to Postman)
  Open source options
  GraphQL support
  Docs: https://insomnia.rest/

Artillery — modern performance testing
  YAML or JS configuration
  Docs: https://www.artillery.io/
```

---

# 13. Test Coverage & Metrics

## 13.1 Coverage Types

```
STATEMENT COVERAGE (Line Coverage):
  % of executable statements executed by tests
  Minimum baseline: aim for >80%
  
  int calculateDiscount(int price, String type) {  // line 1
      if (type.equals("VIP")) {                    // line 2
          return price * 20 / 100;                // line 3  ← if NOT tested
      }                                            // line 4
      return price * 10 / 100;                    // line 5
  }
  
  Test only "VIP": covers lines 1,2,3 → 60% coverage (line 4,5 not covered)

BRANCH COVERAGE (Decision Coverage):
  % of branches (if/else, switch cases) executed
  More thorough than statement coverage
  
  if (age >= 18) → 2 branches: true and false
  Both must be tested for 100% branch coverage

CONDITION COVERAGE:
  Each boolean condition is evaluated to both true and false
  
  if (age >= 18 && country == "VN") → 4 conditions to test

PATH COVERAGE:
  All possible execution paths through code
  Most thorough but exponentially grows with complexity
  Generally impossible to achieve 100% on real code

MUTATION SCORE (quality of tests):
  Better than line coverage — measures if tests can detect bugs
  Aim for: >80% mutation score

COVERAGE TOOLS:
  Java: JaCoCo (integrates with Maven/Gradle/SonarQube)
  JavaScript: Istanbul/nyc, Jest built-in
  Python: coverage.py
  Go: built-in go test -cover

// JaCoCo Maven config:
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <executions>
        <execution>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals><goal>report</goal></goals>
        </execution>
        <execution>
            <id>check</id>
            <goals><goal>check</goal></goals>
            <configuration>
                <rules>
                    <rule>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>  <!-- 80% minimum -->
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

---

# 14. Testing Best Practices

## 14.1 Test Code Quality

```java
// ── TEST BUILDERS (Object Mother / Test Data Builder) ──
// Problem: test setup is verbose and duplicated everywhere
// Solution: builder methods for test data

// Test Data Builder (fluent API):
public class UserTestBuilder {
    private Long id = 1L;
    private String name = "Test User";
    private String email = "test@test.com";
    private UserStatus status = UserStatus.ACTIVE;
    private int age = 25;

    public static UserTestBuilder aUser() { return new UserTestBuilder(); }
    public static UserTestBuilder anAdminUser() {
        return new UserTestBuilder().withRole(Role.ADMIN);
    }

    public UserTestBuilder withId(Long id) { this.id = id; return this; }
    public UserTestBuilder withName(String name) { this.name = name; return this; }
    public UserTestBuilder withEmail(String email) { this.email = email; return this; }
    public UserTestBuilder withStatus(UserStatus status) { this.status = status; return this; }
    public UserTestBuilder inactive() { this.status = UserStatus.INACTIVE; return this; }
    public UserTestBuilder withAge(int age) { this.age = age; return this; }

    public User build() {
        return User.builder()
            .id(id).name(name).email(email).status(status).age(age).build();
    }
}

// Usage — clean and expressive!
User activeAdult = aUser().withAge(21).build();
User inactiveUser = aUser().inactive().withEmail("inactive@test.com").build();
User adminUser = anAdminUser().withName("Admin Khang").build();

// ── CLEAN TEST NAMING ──
// Describes behavior, not implementation
class BankAccountTest {
    // ❌ Bad: tests method name
    @Test void testDeposit() { }
    @Test void testWithdraw() { }

    // ✅ Good: describes behavior
    @Test void deposit_increasesBalance_byDepositedAmount() { }
    @Test void withdraw_decreasesBalance_byWithdrawnAmount() { }
    @Test void withdraw_throwsException_whenBalanceInsufficient() { }
    @Test void withdraw_throwsException_whenAmountIsNegative() { }
    @Test void newAccount_hasZeroBalance() { }
}

// ── ONE ASSERTION CONCEPT PER TEST ──
// ❌ Testing multiple unrelated things:
@Test
void testUserCreation() {
    User user = service.create(request);
    assertEquals("Khang", user.getName());      // testing name
    assertNotNull(user.getId());                 // testing ID
    verify(emailService).sendWelcome(any());     // testing email sent
    verify(auditService).log(any());             // testing audit
}
// If test fails, which assertion? All mixed!

// ✅ Focused tests:
@Test void should_persist_user_with_correct_name() { }
@Test void should_assign_id_to_new_user() { }
@Test void should_send_welcome_email_after_registration() { }
@Test void should_create_audit_log_after_registration() { }
```

## 14.2 Anti-Patterns to Avoid

```
❌ THE EAGER TEST
  Tests too many things at once
  Hard to know what broke when it fails
  Fix: one concept per test

❌ THE MYSTERY GUEST
  Test data comes from external file/DB setup
  Reader can't understand test without looking elsewhere
  Fix: set up all data in the test or readable fixture

❌ THE CHATTY TEST
  Dozens of assertions on one test result
  Fix: extract to helper methods, focus each test

❌ TEST THE FRAMEWORK
  Testing that Spring's @Transactional works
  Testing Java's standard library
  Fix: test YOUR code, trust the framework

❌ THE SLOW POKE
  Tests that take 10+ seconds each
  Usually: real DB, real HTTP, real file system
  Fix: Mock external dependencies in unit tests
       Use Testcontainers for integration (run in parallel)

❌ THE FLAKY TEST
  Sometimes passes, sometimes fails
  Causes: race conditions, time dependencies, test order deps
  Fix: never share state, control time, async assertions with retry

❌ TESTING PRIVATE METHODS
  Testing internals instead of behavior
  If private method needs direct testing → SRP violation
  Fix: test through public API; if needed, make it package-private

❌ MOCKING EVERYTHING
  Mocks return mocks return mocks...
  Tests pass but nothing real is verified
  Fix: use real objects where possible, mock at boundaries

❌ NO TEST MAINTENANCE
  Tests written once, never updated as code changes
  Dead tests, wrong assertions
  Fix: tests are production code — maintain them!

❌ HARDCODED TEST DATA
  email = "test@test.com" everywhere
  If that user is created in DB, second test fails!
  Fix: use random data generators or unique values per test
       email = UUID.randomUUID() + "@test.com"
```

## 14.3 Test Strategy Document

```
A Test Strategy defines HOW you'll test a system/feature.
Should be written BEFORE development starts.

Template:
─────────────────────────────────────────────────────────────────
FEATURE: User Authentication
─────────────────────────────────────────────────────────────────

SCOPE:
  In scope:  email/password login, JWT issuance, token refresh,
             logout, password reset
  Out scope: OAuth (separate story), SSO (future)

RISK ASSESSMENT:
  HIGH risk: security vulnerabilities (incorrect auth = data breach)
  HIGH risk: JWT token manipulation
  MEDIUM risk: account lockout (affect UX)
  LOW risk: UI display issues

TEST LEVELS:
  Unit tests:
    PasswordValidator: weak password detection
    JwtService: token generation/validation
    LoginAttemptService: lockout logic
    
  Integration tests:
    AuthController ↔ UserRepository ↔ DB
    Login success/failure flows
    Token refresh with Redis
    
  Security tests:
    SQL injection in login fields
    JWT tampering attempts
    Brute force protection
    Session fixation

ENTRY/EXIT CRITERIA:
  Entry: code complete, unit tests pass, deployed to staging
  Exit:  100% critical/high bugs resolved, P95 < 200ms,
         security scan passed, UAT sign-off

TEST ENVIRONMENT:
  Staging: mirrors production (same infrastructure)
  Test DB: seeded with representative data
  
TOOLS:
  Unit: JUnit 5 + Mockito
  Integration: Testcontainers + RestAssured
  Security: OWASP ZAP + manual pen test
  Performance: k6

AUTOMATION:
  Unit + Integration: automated in CI (every commit)
  Security: automated weekly scan + pre-release manual test
  Performance: automated weekly + before major release

DEFECT MANAGEMENT:
  Critical (security): fix immediately, emergency release
  High (data loss): fix in current sprint
  Medium (functional): fix in next sprint
  Low (cosmetic): backlog
─────────────────────────────────────────────────────────────────
```

---

## 📎 Quick Reference — Testing Types Cheatsheet

```
Test Type          Purpose                    When to Run        Tools
─────────────────────────────────────────────────────────────────────────────
Unit              Component isolation         Every commit       JUnit, Jest
Integration       Component interaction       Every PR           Spring Test, Testcontainers
Smoke             Basic functionality         Every deploy       Postman, custom scripts
Regression        No existing feature broken  Every sprint       All automated tests
Performance/Load  Normal load behavior        Weekly/pre-release k6, JMeter, Gatling
Stress            Beyond normal capacity      Monthly            k6, JMeter
Spike             Sudden traffic burst        Quarterly          k6
Soak/Endurance    Sustained load (leaks)      Monthly            k6, JMeter
Security (SAST)   Code vulnerabilities        Every commit       SonarQube, Semgrep
Security (DAST)   Running app vulnerabilities Weekly             OWASP ZAP
Exploratory       Undiscovered bugs           Each sprint        Manual (session-based)
UAT               Business requirements met   Before release     Manual with stakeholders
Mutation          Test quality                Weekly             PITest, Stryker
Contract          API contracts between svcs  Every PR           Pact
Visual Regression UI pixel changes            Every PR           Percy, Chromatic
Accessibility     WCAG compliance             Every sprint       axe, Lighthouse
A/B               Hypothesis validation       Ongoing            LaunchDarkly, Statsig
Chaos             Resilience to failures      Monthly            Chaos Monkey, k6 fault injection
```

## 📎 Official Documentation Links

| Tool | Link |
|------|------|
| JUnit 5 | <https://junit.org/junit5/docs/current/user-guide/> |
| Mockito | <https://javadoc.io/doc/org.mockito/mockito-core/latest/> |
| AssertJ | <https://assertj.github.io/doc/> |
| Testcontainers | <https://testcontainers.com/> |
| WireMock | <https://wiremock.org/docs/> |
| RestAssured | <https://rest-assured.io/> |
| Spring Boot Testing | <https://docs.spring.io/spring-boot/docs/current/reference/html/testing.html> |
| Jest | <https://jestjs.io/docs/getting-started> |
| Playwright | <https://playwright.dev/docs/intro> |
| Cypress | <https://docs.cypress.io/> |
| React Testing Library | <https://testing-library.com/docs/> |
| k6 | <https://k6.io/docs/> |
| JMeter | <https://jmeter.apache.org/usermanual/> |
| OWASP ZAP | <https://www.zaproxy.org/docs/> |
| PITest Mutation | <https://pitest.org/> |
| Stryker (JS) | <https://stryker-mutator.io/> |
| Pact (Contract) | <https://docs.pact.io/> |
| JaCoCo Coverage | <https://www.jacoco.org/jacoco/trunk/doc/> |
| OWASP Testing Guide | <https://owasp.org/www-project-web-security-testing-guide/> |
| Cucumber | <https://cucumber.io/docs/> |

---

*Học theo thứ tự: Testing fundamentals → Unit testing + Mockito → TDD cycle → Integration testing → BDD → Performance testing → Security testing*
