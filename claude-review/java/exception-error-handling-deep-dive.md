# ⚠️ Exception & Error Handling — Java Deep Dive + JavaScript Comparison
>
> Throwable Hierarchy, Checked/Unchecked, Custom Exceptions, Best Practices

---

## 📚 Table of Contents

1. [Throwable Hierarchy — Toàn Bộ Cây](#1-throwable-hierarchy--toàn-bộ-cây)
2. [Checked vs Unchecked Exceptions](#2-checked-vs-unchecked-exceptions)
3. [Exception Lifecycle & JVM Internals](#3-exception-lifecycle--jvm-internals)
4. [Try-Catch-Finally — Cơ Chế Chi Tiết](#4-try-catch-finally--cơ-chế-chi-tiết)
5. [Custom Exceptions — Best Practices](#5-custom-exceptions--best-practices)
6. [Exception Chaining & Context](#6-exception-chaining--context)
7. [Common Built-in Exceptions](#7-common-built-in-exceptions)
8. [Multi-Catch, Try-with-Resources, Rethrowing](#8-multi-catch-try-with-resources-rethrowing)
9. [Exception Handling Patterns](#9-exception-handling-patterns)
10. [Spring Boot Exception Handling](#10-spring-boot-exception-handling)
11. [JavaScript Error — So Sánh với Java](#11-javascript-error--so-sánh-với-java)
12. [Anti-Patterns & Best Practices](#12-anti-patterns--best-practices)

---

# 1. Throwable Hierarchy — Toàn Bộ Cây

## 1.1 Full Java Throwable Tree

```
java.lang.Object
    └── java.lang.Throwable                    ← ROOT của tất cả!
            ├── java.lang.Error                 ← JVM/System problems (đừng catch!)
            │       ├── OutOfMemoryError         ← heap full
            │       ├── StackOverflowError       ← infinite recursion
            │       ├── AssertionError           ← assertion failed
            │       ├── VirtualMachineError      ← JVM broken
            │       │       ├── InternalError
            │       │       └── UnknownError
            │       ├── ThreadDeath              ← thread.stop() called (deprecated)
            │       ├── LinkageError             ← class linking failed
            │       │       ├── NoClassDefFoundError
            │       │       ├── ClassCircularityError
            │       │       └── IncompatibleClassChangeError
            │       │               └── AbstractMethodError
            │       │               └── InstantiationError
            │       │               └── NoSuchFieldError
            │       │               └── NoSuchMethodError
            │       └── AWTError
            │
            └── java.lang.Exception             ← Application problems
                    ├── RuntimeException         ← UNCHECKED (compiler silent)
                    │       ├── NullPointerException
                    │       ├── ArrayIndexOutOfBoundsException
                    │       ├── ClassCastException
                    │       ├── IllegalArgumentException
                    │       │       └── NumberFormatException
                    │       ├── IllegalStateException
                    │       ├── ArithmeticException      (divide by zero)
                    │       ├── UnsupportedOperationException
                    │       ├── ConcurrentModificationException
                    │       ├── IndexOutOfBoundsException
                    │       │       ├── ArrayIndexOutOfBoundsException
                    │       │       └── StringIndexOutOfBoundsException
                    │       ├── NoSuchElementException
                    │       ├── StackOverflowError (also subclass of Error!)
                    │       ├── NegativeArraySizeException
                    │       └── ... (rất nhiều!)
                    │
                    ├── IOException              ← CHECKED (compiler forces handle)
                    │       ├── FileNotFoundException
                    │       ├── EOFException
                    │       ├── SocketException
                    │       │       └── ConnectException
                    │       ├── MalformedURLException
                    │       └── UnknownHostException
                    │
                    ├── SQLException             ← CHECKED (database)
                    │       └── BatchUpdateException
                    │
                    ├── ReflectiveOperationException  ← CHECKED
                    │       ├── ClassNotFoundException
                    │       ├── NoSuchMethodException
                    │       ├── NoSuchFieldException
                    │       └── InstantiationException
                    │
                    ├── CloneNotSupportedException ← CHECKED
                    ├── InterruptedException      ← CHECKED (threading)
                    ├── ParseException            ← CHECKED
                    └── ... (many more checked exceptions)

PHÂN LOẠI:
  Throwable:          mọi thứ có thể throw/catch
  Error:              JVM/system level — thường KHÔNG nên catch
  Exception:          application level — có thể catch và handle
  RuntimeException:   UNCHECKED — extends Exception but compiler không force
  Everything else:    CHECKED — compiler requires try-catch or throws declaration
```

## 1.2 Throwable Class Internals

```java
// java.lang.Throwable — các field quan trọng:
public class Throwable implements Serializable {

    // THE MESSAGE: mô tả lỗi
    private String detailMessage;

    // THE CAUSE: exception gốc gây ra exception này (chaining!)
    private Throwable cause;

    // THE STACK TRACE: where it was thrown
    private StackTraceElement[] stackTrace;

    // SUPPRESSED EXCEPTIONS: từ try-with-resources
    private List<Throwable> suppressedExceptions;

    // KEY CONSTRUCTORS:
    public Throwable() {}
    public Throwable(String message) {}
    public Throwable(String message, Throwable cause) {}  // chaining!
    public Throwable(Throwable cause) {}

    // KEY METHODS:
    String getMessage()          // "File not found: /tmp/foo.txt"
    String getLocalizedMessage() // override for i18n
    Throwable getCause()         // the original exception
    StackTraceElement[] getStackTrace()
    void printStackTrace()       // print to stderr
    void printStackTrace(PrintStream s)
    String toString()            // "java.io.FileNotFoundException: /tmp/foo.txt"

    // FILL IN STACK TRACE (called in constructor — expensive!):
    Throwable fillInStackTrace()
    // Can override to skip: return this;  (for performance in hot paths)
}
```

---

# 2. Checked vs Unchecked Exceptions

## 2.1 Checked Exceptions

```java
// CHECKED: compiler FORCES you to handle them
// Must either: try-catch OR declare throws in method signature

// ── WITHOUT HANDLING → COMPILE ERROR ──
public void readFile(String path) {
    FileInputStream fis = new FileInputStream(path);  // COMPILE ERROR!
    // Unhandled exception type FileNotFoundException
}

// ── OPTION 1: try-catch ──
public void readFile(String path) {
    try {
        FileInputStream fis = new FileInputStream(path);
        // use fis...
    } catch (FileNotFoundException e) {
        log.error("File not found: {}", path, e);
        // Handle the error
    }
}

// ── OPTION 2: declare throws (propagate to caller) ──
public void readFile(String path) throws FileNotFoundException {
    FileInputStream fis = new FileInputStream(path);  // OK now!
    // Caller must handle FileNotFoundException
}

// CATCHING MULTIPLE CHECKED EXCEPTIONS:
public void processConfig(String path) throws IOException {
    try {
        FileInputStream fis = new FileInputStream(path);     // FileNotFoundException
        Properties props = new Properties();
        props.load(fis);                                      // IOException
        String host = props.getProperty("db.host");
        Connection conn = DriverManager.getConnection(host);  // SQLException
    } catch (FileNotFoundException e) {
        throw new ConfigurationException("Config file not found: " + path, e);
    } catch (IOException e) {
        throw new ConfigurationException("Error reading config: " + path, e);
    } catch (SQLException e) {
        throw new ConfigurationException("DB connection failed", e);
    }
}

// DESIGN RATIONALE FOR CHECKED EXCEPTIONS:
// "Checked exceptions represent recoverable conditions the caller SHOULD handle"
// FileNotFoundException: maybe try alternate path
// SQLException: maybe retry
// InterruptedException: maybe cancel operation

// CRITICS OF CHECKED EXCEPTIONS (Josh Bloch, Bruce Eckel):
// - Verbose boilerplate
// - Callers often just re-throw or swallow
// - Leaks implementation details (throws SQLException ties you to JDBC)
// - Kotlin, C#, Scala don't have checked exceptions → all unchecked
// Modern Java style: prefer unchecked for most cases
```

## 2.2 Unchecked Exceptions (RuntimeException)

```java
// UNCHECKED: compiler doesn't force handling
// Can throw/propagate WITHOUT declaring throws or try-catch
// Extends RuntimeException (which extends Exception)

// Common unchecked exceptions:
throw new NullPointerException("User cannot be null");
throw new IllegalArgumentException("Age must be positive: " + age);
throw new IllegalStateException("Cannot cancel confirmed order");
throw new UnsupportedOperationException("Feature not implemented yet");
throw new IndexOutOfBoundsException("Index " + i + " out of bounds for size " + size);
throw new ConcurrentModificationException("Collection modified during iteration");

// DESIGN RATIONALE FOR UNCHECKED:
// "Unchecked exceptions represent programming errors or unrecoverable conditions"
// NullPointerException: programming bug, fix the code
// ArrayIndexOutOfBoundsException: programming bug
// IllegalArgumentException: caller passed wrong arg — their bug

// WHEN TO USE UNCHECKED:
// Programming errors (should never happen with correct code)
// Unrecoverable conditions (can't do anything useful)
// When checked exception would force all callers to handle something
//   they can't meaningfully recover from

// SPRING/MODERN JAVA STYLE:
// Use unchecked for most application exceptions
// Easier to propagate through layers
// No interface pollution with throws declarations
// Global exception handler catches them

// CHECKED EXCEPTION → UNCHECKED WRAPPER (common pattern):
public User loadUser(long id) {
    try {
        return userRepository.findById(id);
    } catch (SQLException e) {
        throw new DataAccessException("Failed to load user: " + id, e);
        // DataAccessException is unchecked (RuntimeException)
        // Spring does this automatically for all JPA/JDBC exceptions!
    }
}
```

## 2.3 Error — Đừng Catch

```java
// ERROR: JVM/system level problems
// Generally: you CAN'T recover, shouldn't try

// ── OUTOFMEMORYERROR ──
// Heap full → JVM can't allocate new objects
// Catching it is almost always wrong — heap still full when you catch it!
// Usually: app needs more memory (-Xmx), fix memory leak, or crash cleanly

// BAD:
try {
    loadEverythingIntoMemory();
} catch (OutOfMemoryError e) {
    log.error("OOM!", e);
    // Then what? Heap is still exhausted. Any allocation here may also fail!
    retry();  // This will also OOM immediately!
}

// RARE LEGITIMATE USE: release memory then fail gracefully
try {
    byte[] hugeArray = new byte[Integer.MAX_VALUE];
} catch (OutOfMemoryError e) {
    // Release the one big allocation we were attempting
    // Then perform minimal cleanup (but avoid allocations!)
    log.error("OOM: could not allocate large buffer, falling back to streaming");
    return processByStreaming();  // streaming approach uses much less memory
}

// ── STACKOVERFLOWERROR ──
// Infinite recursion → call stack full
// Generally unrecoverable
int factorial(int n) {
    return n * factorial(n - 1);  // no base case → StackOverflowError!
}

// ── WHEN CATCHING ERROR IS OK (very rare cases) ──
// Top-level handlers (JVM shutdown hook, test cleanup):
public class ApplicationLifecycle {
    public static void main(String[] args) {
        try {
            Application app = new Application();
            app.run();
        } catch (Error e) {
            // Only at top level: log and attempt graceful shutdown
            System.err.println("FATAL: " + e.getMessage());
            System.exit(1);
        }
    }
}

// Testing: assert code throws Error:
@Test
void infiniteRecursion_throwsStackOverflow() {
    assertThrows(StackOverflowError.class, () -> infiniteMethod());
}

// Catching Throwable (even more extreme — only in frameworks):
// Used by: JUnit, Spring AOP, test frameworks
// To guarantee cleanup even on Error:
try {
    runTest();
} catch (Throwable t) {
    recordTestFailure(t);
    throw t;  // MUST re-throw! Don't swallow Error/Throwable.
}
```

---

# 3. Exception Lifecycle & JVM Internals

## 3.1 How Exceptions Work Internally

```
WHEN new SomeException("message") IS CALLED:
  1. JVM allocates Exception object on heap
  2. Constructor called
  3. fillInStackTrace() called (EXPENSIVE!)
     - Walks the call stack
     - Creates StackTraceElement[] array
     - Each element: class, method, file, line number
  4. Object is ready to throw

WHEN throw exception IS EXECUTED:
  1. JVM looks for matching catch block in current method
  2. If not found: unwind stack to caller method
  3. Check caller's exception table for matching handler
  4. Continue unwinding until handler found OR main() reached
  5. If reaches main() with no handler: JVM calls Thread.getDefaultUncaughtExceptionHandler()
  6. Then thread terminates (or JVM if main thread)

EXCEPTION TABLE (bytecode level):
  Each method has an exception table in bytecode:
  | from | to | target | type            |
  |------|-----|--------|-----------------|
  | 0    | 10  | 15     | IOException     |  ← catch IOException at offset 15
  | 0    | 10  | 20     | RuntimeException|  ← catch RuntimeException at offset 20
  | 0    | 25  | 30     | any             |  ← finally block at offset 30
  
  JVM checks: is current instruction between 'from' and 'to'?
              is thrown exception instanceof 'type'?
              If yes: jump to 'target' instruction

WHY fillInStackTrace() IS EXPENSIVE:
  Walking call stack: O(depth)
  Creating StackTraceElement objects: memory allocation
  100-level deep call stack: significant overhead
  
  In hot paths (logging, return-value exceptions):
  Override fillInStackTrace() to skip:
  
  public class FastException extends RuntimeException {
      @Override
      public synchronized Throwable fillInStackTrace() {
          return this;  // skip stack trace! Much faster.
      }
  }
  // Use when: exception used as control flow (not recommended but sometimes done)
  // Or when: exception always has same stack trace (sentinel values)
```

## 3.2 Stack Trace Analysis

```java
// ── READING A STACK TRACE ──
// java.lang.NullPointerException: Cannot invoke "String.length()" because "str" is null
//   at com.example.OrderService.processOrder(OrderService.java:45)   ← where thrown
//   at com.example.OrderController.createOrder(OrderController.java:23)
//   at com.example.OrderController$$FastClassByCGLIB$$abc.invoke(...)  ← Spring proxy!
//   at org.springframework.aop.framework.CglibAopProxy.invoke(...)
//   at sun.reflect.NativeMethodAccessorImpl.invoke0(...)    ← reflection
//   at java.lang.reflect.Method.invoke(...)
//   at org.springframework.web.servlet.DispatcherServlet.doDispatch(...)
//   at org.springframework.web.servlet.DispatcherServlet.doService(...)

// READING STRATEGY:
// 1. First line: exception type and message (most important!)
// 2. First "at" line from YOUR code: where it actually happened
// 3. Caused by: the original exception (if chained)
// 4. Ignore framework boilerplate (spring, cglib, reflection)

// ── CAUSED BY (exception chaining) ──
// org.springframework.dao.DataAccessException: could not execute statement
//   at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(...)
//   at ...
// Caused by: org.hibernate.exception.ConstraintViolationException: could not execute statement
//   at org.hibernate.exception.internal.SQLExceptionTypeDelegate.convert(...)
//   at ...
// Caused by: java.sql.SQLIntegrityConstraintViolationException: Duplicate entry 'user@email.com'
//   for key 'users.UK_users_email'
//   at com.mysql.cj.jdbc.exceptions.SQLError.createSQLException(...)
// 
// READ FROM BOTTOM UP for original cause!
// Original: SQLIntegrityConstraintViolationException (duplicate email)
// Wrapped by: Hibernate ConstraintViolationException
// Wrapped by: Spring DataAccessException

// ── PROGRAMMATIC STACK TRACE ACCESS ──
try {
    riskyOperation();
} catch (Exception e) {
    // Get all stack trace elements:
    StackTraceElement[] elements = e.getStackTrace();
    for (StackTraceElement elem : elements) {
        System.out.printf("  at %s.%s(%s:%d)%n",
            elem.getClassName(),
            elem.getMethodName(),
            elem.getFileName(),
            elem.getLineNumber());
    }

    // Check if thrown in specific class:
    boolean fromOrderService = Arrays.stream(e.getStackTrace())
        .anyMatch(e2 -> e2.getClassName().contains("OrderService"));

    // Get full chain:
    Throwable cause = e;
    while (cause.getCause() != null) {
        cause = cause.getCause();
    }
    System.out.println("Root cause: " + cause.getMessage());
}

// USEFUL: Exception to string
String stackTraceString = ExceptionUtils.getStackTrace(e);  // Apache Commons
// or:
StringWriter sw = new StringWriter();
e.printStackTrace(new PrintWriter(sw));
String stackTrace = sw.toString();
```

---

# 4. Try-Catch-Finally — Cơ Chế Chi Tiết

## 4.1 Execution Flow

```java
// ── BASIC TRY-CATCH-FINALLY FLOW ──
public String processOrder(Order order) {
    System.out.println("1. Before try");

    try {
        System.out.println("2. In try");
        validateOrder(order);          // may throw ValidationException
        System.out.println("3. After validate (no exception)");
        return "SUCCESS";              // return executed, but finally runs first!
    } catch (ValidationException e) {
        System.out.println("4. In catch for ValidationException");
        return "VALIDATION_FAILED";
    } catch (Exception e) {
        System.out.println("5. In catch for Exception (fallback)");
        return "ERROR";
    } finally {
        System.out.println("6. In finally");
        // ALWAYS executes: no exception, caught exception, or uncaught exception
        // Cleanup code goes here: close resources, release locks
        // EVEN IF return statement was in try or catch!
    }
    // System.out.println("7. After try block");  // unreachable!
}

// ORDER OF EXECUTION:
// Normal (no exception):     1 → 2 → 3 → 6 → return "SUCCESS"
// ValidationException:       1 → 2 → 4 → 6 → return "VALIDATION_FAILED"
// NullPointerException:      1 → 2 → 5 → 6 → return "ERROR"
// Uncaught (ThreadDeath etc): 1 → 2 → 6 → exception propagates!

// ── FINALLY AND RETURN — CRITICAL GOTCHA! ──
public int trickyMethod() {
    try {
        return 1;     // return 1? Not quite...
    } finally {
        return 2;     // ← OVERRIDES the return 1!
    }
}
// Returns: 2 (finally's return overrides try's return!)
// This is VERY confusing — avoid return in finally!

// ── FINALLY AND EXCEPTION — ANOTHER GOTCHA! ──
public void tricky2() throws IOException {
    try {
        throw new RuntimeException("original");
    } finally {
        throw new IOException("finally");  // SWALLOWS original exception!
    }
}
// Throws: IOException("finally") — original RuntimeException LOST!
// Original exception is suppressed → very hard to debug
// Avoid: throw in finally!

// ── EXCEPTION IN FINALLY (with try-with-resources) ──
// try-with-resources handles this correctly (adds suppressed exceptions)
// See section 8
```

## 4.2 Exception Matching Rules

```java
// CATCH BLOCKS ARE CHECKED IN ORDER — most specific FIRST!

try {
    riskyOperation();
} catch (FileNotFoundException e) {       // most specific
    handleFileMissing(e);
} catch (IOException e) {                  // broader (FileNotFoundException IS-A IOException)
    handleIOProblem(e);
} catch (Exception e) {                    // broadest
    handleAnyException(e);
} catch (Throwable t) {                    // catches Error too!
    handleEverything(t);
}

// !! COMPILE ERROR if broader catch comes before specific:
try {
    riskyOperation();
} catch (IOException e) {       // IOException catches FileNotFoundException too
    handle(e);
} catch (FileNotFoundException e) {  // COMPILE ERROR: already caught by IOException!
    handleFileMissing(e);
}

// INSTANCEOF check:
// catch (IOException e) → catches if (e instanceof IOException) → true!
// FileNotFoundException extends IOException
// So: catch (IOException e) catches FileNotFoundException too!

// ── NULL IN CATCH ──
// Can you catch null?
try {
    throw null;  // COMPILE ERROR? Actually compiles but...
} catch (NullPointerException e) {
    // ...throws NullPointerException! (null is not a Throwable)
}
```

---

# 5. Custom Exceptions — Best Practices

## 5.1 Exception Hierarchy Design

```java
// ── DOMAIN EXCEPTION HIERARCHY ──
// Base exception for your application/domain:

public abstract class AppException extends RuntimeException {

    // Error code for API responses + client handling:
    private final String errorCode;

    // HTTP status hint (for web layer):
    private final int httpStatus;

    protected AppException(String errorCode, String message, int httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    protected AppException(String errorCode, String message, int httpStatus, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public String getErrorCode()  { return errorCode;  }
    public int    getHttpStatus() { return httpStatus; }
}

// ── DOMAIN-SPECIFIC EXCEPTIONS ──

// Not Found (400-like):
public class ResourceNotFoundException extends AppException {
    private final String resourceType;
    private final String resourceId;

    public ResourceNotFoundException(String resourceType, String resourceId) {
        super(
            "RESOURCE_NOT_FOUND",
            String.format("%s with id '%s' not found", resourceType, resourceId),
            404
        );
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }

    // Convenience factory methods (prefer over constructors):
    public static ResourceNotFoundException forUser(Long userId) {
        return new ResourceNotFoundException("User", userId.toString());
    }

    public static ResourceNotFoundException forOrder(String orderId) {
        return new ResourceNotFoundException("Order", orderId);
    }

    public String getResourceType() { return resourceType; }
    public String getResourceId()   { return resourceId;   }
}

// Business Rule Violation:
public class BusinessRuleViolationException extends AppException {
    private final String rule;

    public BusinessRuleViolationException(String rule, String message) {
        super("BUSINESS_RULE_VIOLATION", message, 422);
        this.rule = rule;
    }

    // Named factory methods for specific rules:
    public static BusinessRuleViolationException insufficientFunds(BigDecimal balance, BigDecimal needed) {
        return new BusinessRuleViolationException(
            "INSUFFICIENT_FUNDS",
            String.format("Insufficient funds: balance %.2f, required %.2f", balance, needed)
        );
    }

    public static BusinessRuleViolationException orderAlreadyConfirmed(String orderId) {
        return new BusinessRuleViolationException(
            "ORDER_ALREADY_CONFIRMED",
            "Order " + orderId + " has already been confirmed"
        );
    }
}

// Validation:
public class ValidationException extends AppException {
    private final Map<String, List<String>> fieldErrors;

    public ValidationException(Map<String, List<String>> fieldErrors) {
        super("VALIDATION_FAILED", "Request validation failed", 400);
        this.fieldErrors = Collections.unmodifiableMap(fieldErrors);
    }

    public static ValidationException forField(String field, String message) {
        return new ValidationException(Map.of(field, List.of(message)));
    }

    public Map<String, List<String>> getFieldErrors() { return fieldErrors; }
}

// External Service:
public class ExternalServiceException extends AppException {
    private final String serviceName;
    private final int serviceStatusCode;

    public ExternalServiceException(String serviceName, String message,
                                     int serviceStatusCode, Throwable cause) {
        super("EXTERNAL_SERVICE_ERROR", message, 502, cause);
        this.serviceName = serviceName;
        this.serviceStatusCode = serviceStatusCode;
    }
}

// Unauthorized:
public class UnauthorizedException extends AppException {
    public UnauthorizedException(String message) {
        super("UNAUTHORIZED", message, 401);
    }
    public static UnauthorizedException invalidToken() {
        return new UnauthorizedException("Invalid or expired token");
    }
    public static UnauthorizedException sessionExpired() {
        return new UnauthorizedException("Session has expired, please login again");
    }
}

// Forbidden:
public class ForbiddenException extends AppException {
    public ForbiddenException(String action, String resource) {
        super("FORBIDDEN",
              String.format("You don't have permission to %s %s", action, resource),
              403);
    }
}
```

## 5.2 Exception Naming & Message Quality

```java
// ── NAMING CONVENTIONS ──
// Always end with "Exception" for exceptions
// Name describes the SITUATION, not the class or action:

// BAD names:
class DatabaseException extends RuntimeException {}  // too generic
class HandleUserException extends RuntimeException {} // "Handle" in exception name = wrong
class UserException extends RuntimeException {}       // what about user?

// GOOD names:
class UserNotFoundException extends RuntimeException {}      // specific condition
class DuplicateEmailException extends RuntimeException {}    // specific violation
class InsufficientInventoryException extends RuntimeException {} // business rule

// ── MESSAGE QUALITY ──
// Message should tell developer:
// WHAT went wrong
// WHERE (which value, which context)
// WHY it's wrong (if not obvious)
// WHAT to do about it (if actionable)

// BAD messages:
throw new IllegalArgumentException("Invalid input");         // what input? what's invalid?
throw new IllegalStateException("Error");                    // useless!
throw new NullPointerException();                            // no message = terrible
throw new IllegalArgumentException("order");                 // "order" what?

// GOOD messages:
throw new IllegalArgumentException(
    "Order quantity must be positive, but was: " + quantity);

throw new IllegalStateException(
    "Cannot cancel order " + orderId + " with status " + status +
    ". Only PENDING orders can be cancelled.");

throw new IllegalArgumentException(
    "Email '" + email + "' is not valid. Expected format: user@domain.com");

throw new ResourceNotFoundException("User", userId.toString());
// "User with id '123' not found" ← clear!

// INCLUDE CONTEXT VALUES in message!
// BAD:  "Product not found"
// GOOD: "Product with id '456' not found in category 'electronics'"
```

---

# 6. Exception Chaining & Context

## 6.1 Exception Wrapping (Chaining)

```java
// EXCEPTION CHAINING: preserve original cause while adding context
// cause = the original exception that caused this one

// ── BASIC CHAINING ──
public User loadUser(long id) {
    try {
        return jdbcTemplate.queryForObject(
            "SELECT * FROM users WHERE id = ?",
            userRowMapper, id);
    } catch (EmptyResultDataAccessException e) {
        // Wrap DB-specific exception with domain exception:
        throw new UserNotFoundException(id, e);  // pass cause!
    } catch (DataAccessException e) {
        // Wrap DB exception with service exception:
        throw new ServiceException(
            "Failed to load user " + id + " due to database error", e);
    }
}

// ── PRESERVING CAUSE ──
public class UserNotFoundException extends RuntimeException {

    // CORRECT: always include cause parameter for chaining!
    public UserNotFoundException(Long userId, Throwable cause) {
        super("User not found: " + userId, cause);  // cause preserved!
    }

    // Also useful: without cause (when there's no underlying exception)
    public UserNotFoundException(Long userId) {
        super("User not found: " + userId);
    }
}

// ── ACCESSING THE CHAIN ──
try {
    userService.loadUser(123L);
} catch (ServiceException e) {
    Throwable cause = e.getCause();               // UserNotFoundException
    Throwable rootCause = getRootCause(e);        // original DB exception

    // Full chain traversal:
    Throwable current = e;
    while (current != null) {
        log.error("Exception: {} - {}", current.getClass().getSimpleName(), current.getMessage());
        current = current.getCause();
    }
}

// getRootCause utility:
public static Throwable getRootCause(Throwable throwable) {
    Throwable cause = throwable.getCause();
    if (cause == null) return throwable;
    return getRootCause(cause);  // recursive
}
// Apache Commons: ExceptionUtils.getRootCause(e)
// Spring: NestedExceptionUtils.getMostSpecificCause(e)

// ── UNWRAP SPECIFIC CAUSE ──
public static <T extends Throwable> Optional<T> findCause(
        Throwable throwable, Class<T> causeType) {
    Throwable current = throwable;
    while (current != null) {
        if (causeType.isInstance(current)) {
            return Optional.of(causeType.cast(current));
        }
        current = current.getCause();
    }
    return Optional.empty();
}

// Usage:
Optional<ConstraintViolationException> constraintViolation =
    findCause(e, ConstraintViolationException.class);
constraintViolation.ifPresent(cv ->
    log.warn("Constraint violation: {}", cv.getConstraintName()));
```

---

# 7. Common Built-in Exceptions

## 7.1 RuntimeException Family

```java
// ── NullPointerException (NPE) ──
// Java 14+: Helpful NullPointerException messages!
String name = null;
name.length();
// Before Java 14: NullPointerException (no message)
// Java 14+: Cannot invoke "String.length()" because "name" is null

// Preventing NPE:
// 1. Objects.requireNonNull:
public void process(Order order) {
    Objects.requireNonNull(order, "order must not be null");
    Objects.requireNonNull(order.getCustomerId(), "order.customerId must not be null");
    // Now safe to use order
}

// 2. Optional (for methods that might return null):
Optional<User> user = userRepository.findByEmail(email);
user.ifPresent(u -> process(u));
String name2 = user.map(User::getName).orElse("Unknown");
User user2 = user.orElseThrow(() -> new UserNotFoundException(email));

// 3. @NonNull / @NotNull annotations (documentation + static analysis):
public void process(@NonNull Order order) { }  // Lombok or JSR-305

// ── IllegalArgumentException ──
// For invalid method arguments (programming error — caller's fault)
public void setAge(int age) {
    if (age < 0 || age > 150) {
        throw new IllegalArgumentException(
            "Age must be between 0 and 150, but was: " + age);
    }
    this.age = age;
}

// ── IllegalStateException ──
// For invalid object state (object not in right state for this operation)
public void ship() {
    if (status != OrderStatus.CONFIRMED) {
        throw new IllegalStateException(
            "Cannot ship order " + id + " in state " + status +
            ". Order must be CONFIRMED first.");
    }
    this.status = OrderStatus.SHIPPED;
}

// ── UnsupportedOperationException ──
// Method not implemented or not supported
List<String> readOnly = Collections.unmodifiableList(mutableList);
readOnly.add("new item");  // throws UnsupportedOperationException!

// In abstract classes:
public abstract class AbstractTemplate {
    public void process() {
        prepare();
        execute();
        cleanup();
    }
    protected abstract void execute();  // must implement
    protected void prepare() { }        // optional
    protected void cleanup() {
        // Default: nothing, but subclass can override
        throw new UnsupportedOperationException(
            "cleanup() not implemented in " + getClass().getName());
    }
}

// ── NumberFormatException ──
// extends IllegalArgumentException
try {
    int value = Integer.parseInt("abc");  // throws!
} catch (NumberFormatException e) {
    log.warn("Invalid number format: '{}' - {}", input, e.getMessage());
    return defaultValue;
}
// Better: use utility that returns Optional:
OptionalInt parsed = parseIntSafely("abc");  // returns OptionalInt.empty()

// ── ConcurrentModificationException ──
// Modifying collection while iterating (without using Iterator.remove())
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
for (String s : list) {
    if (s.equals("b")) {
        list.remove(s);  // throws ConcurrentModificationException!
    }
}
// FIX: use Iterator.remove() or removeIf():
list.removeIf(s -> s.equals("b"));  // safe!
// Or: collect items to remove, then remove after iteration
```

---

# 8. Multi-Catch, Try-with-Resources, Rethrowing

## 8.1 Multi-Catch (Java 7+)

```java
// BEFORE Java 7: duplicate catch blocks
try {
    riskyOperation();
} catch (IOException e) {
    log.error("Error", e);
    throw new ServiceException(e);
} catch (SQLException e) {
    log.error("Error", e);   // duplicate code!
    throw new ServiceException(e);
}

// Java 7+ MULTI-CATCH: catch multiple types in one block
try {
    riskyOperation();
} catch (IOException | SQLException e) {
    // e is effectively final here! Can't reassign.
    log.error("I/O or DB error in riskyOperation", e);
    throw new ServiceException("Operation failed", e);
}

// CATCH ORDERING STILL MATTERS with multi-catch:
// ❌ Cannot catch a supertype before subtype in same pipe:
// catch (Exception | IOException e)  // COMPILE ERROR: IOException is subtype of Exception

// ✅ Can catch unrelated exceptions:
// catch (IOException | SQLException | InterruptedException e)  // OK!
```

## 8.2 Try-with-Resources (Java 7+)

```java
// BEFORE: verbose, error-prone resource management
FileInputStream fis = null;
BufferedReader br = null;
try {
    fis = new FileInputStream("file.txt");
    br = new BufferedReader(new InputStreamReader(fis));
    String line;
    while ((line = br.readLine()) != null) {
        process(line);
    }
} catch (IOException e) {
    log.error("Error reading file", e);
} finally {
    if (br != null) {
        try { br.close(); }
        catch (IOException e) { log.error("Error closing reader", e); }
    }
    if (fis != null) {
        try { fis.close(); }
        catch (IOException e) { log.error("Error closing stream", e); }
    }
}

// Java 7+ TRY-WITH-RESOURCES:
// Resource must implement AutoCloseable (or Closeable)
// close() called automatically, even if exception thrown!
try (FileInputStream fis = new FileInputStream("file.txt");
     BufferedReader br = new BufferedReader(new InputStreamReader(fis))) {
    // Closed in REVERSE ORDER: br then fis!
    String line;
    while ((line = br.readLine()) != null) {
        process(line);
    }
} catch (IOException e) {
    log.error("Error reading file", e);
}

// SUPPRESSED EXCEPTIONS (key advantage!):
// If process(line) throws AND close() throws:
// Primary exception = thrown during body
// Secondary exception = thrown during close() → added as SUPPRESSED!
// Both preserved! (unlike manual finally where close() exception swallows primary)
try {
    throw new RuntimeException("body exception");
} finally {
    throw new IOException("close exception");  // ← swallows body exception! BAD!
}
// vs try-with-resources: both exceptions preserved as suppressed

// Accessing suppressed exceptions:
try {
    try (CloseableResource r = new CloseableResource()) {
        throw new RuntimeException("body");
    }
} catch (RuntimeException e) {
    Throwable[] suppressed = e.getSuppressed();
    // suppressed[0] = exception from close()
    for (Throwable s : suppressed) {
        log.warn("Suppressed: {}", s.getMessage());
    }
}

// CUSTOM AUTOCLOSEABLE:
public class DatabaseTransaction implements AutoCloseable {
    private final Connection conn;
    private boolean committed = false;

    public DatabaseTransaction(DataSource ds) throws SQLException {
        conn = ds.getConnection();
        conn.setAutoCommit(false);
    }

    public void commit() throws SQLException {
        conn.commit();
        committed = true;
    }

    @Override
    public void close() throws SQLException {
        if (!committed) {
            conn.rollback();  // auto-rollback if not committed!
        }
        conn.close();
    }
}

// Usage:
try (DatabaseTransaction tx = new DatabaseTransaction(dataSource)) {
    userRepository.save(user);
    orderRepository.save(order);
    tx.commit();
    // If any exception: close() called → conn.rollback()!
}
```

## 8.3 Rethrowing

```java
// ── RETHROW SAME EXCEPTION ──
try {
    riskyOperation();
} catch (IOException e) {
    log.error("Error in riskyOperation for user {}", userId, e);
    throw e;  // rethrow same exception (stack trace preserved!)
}

// ── RETHROW WITH CONTEXT (wrapping) ──
try {
    userRepository.save(user);
} catch (DataIntegrityViolationException e) {
    if (e.getMessage().contains("uk_users_email")) {
        throw new DuplicateEmailException(user.getEmail(), e);  // add context!
    }
    throw e;  // unknown constraint violation, rethrow as-is
}

// ── RETHROW CHECKED AS UNCHECKED ──
// Common pattern to avoid checked exception propagation:
try {
    return objectMapper.writeValueAsString(obj);
} catch (JsonProcessingException e) {
    throw new IllegalStateException("Failed to serialize: " + obj.getClass().getName(), e);
}

// ── SNEAKY THROW (advanced, controversial) ──
// Bypass compiler's checked exception tracking!
// Used by: Lombok @SneakyThrows, some frameworks

@SuppressWarnings("unchecked")
public static <T extends Throwable> RuntimeException sneakyThrow(Throwable t) throws T {
    throw (T) t;  // unchecked cast tricks compiler
}

// Usage (Lombok @SneakyThrows):
@SneakyThrows(IOException.class)
public void readFile(String path) {
    // IOException can be thrown without declaring throws!
    // Compiler doesn't know about it
    Files.readAllLines(Paths.get(path));
}
// Controversial: hides checked exceptions from caller!
// Use sparingly; only when caught exception genuinely can't happen
```

---

# 9. Exception Handling Patterns

## 9.1 Fail-Fast Pattern

```java
// FAIL-FAST: validate inputs immediately, fail early with clear error
// Better than: propagating nulls/bad values deep into code

// ── GUARD CLAUSES ──
public Order createOrder(CreateOrderRequest request) {
    // Validate early, clear errors:
    if (request == null)
        throw new IllegalArgumentException("request must not be null");
    if (request.getCustomerId() == null)
        throw new IllegalArgumentException("customerId must not be null");
    if (request.getItems() == null || request.getItems().isEmpty())
        throw new IllegalArgumentException("order must have at least one item");
    if (request.getItems().stream().anyMatch(i -> i.getQuantity() <= 0))
        throw new IllegalArgumentException("all item quantities must be positive");

    // Now safe to process:
    return orderDomainService.create(request);
}

// ── PRECONDITIONS (Guava or manual) ──
import com.google.common.base.Preconditions;

public void transfer(BankAccount from, BankAccount to, BigDecimal amount) {
    Preconditions.checkNotNull(from, "from account required");
    Preconditions.checkNotNull(to, "to account required");
    Preconditions.checkNotNull(amount, "transfer amount required");
    Preconditions.checkArgument(amount.compareTo(BigDecimal.ZERO) > 0,
        "amount must be positive, was: %s", amount);
    Preconditions.checkArgument(!from.getId().equals(to.getId()),
        "cannot transfer to same account: %s", from.getId());
    Preconditions.checkState(from.isActive(), "source account %s is not active", from.getId());
}
```

## 9.2 Result Type Pattern (No Exception)

```java
// ALTERNATIVE TO EXCEPTIONS for expected failures
// Inspired by Rust's Result<T, E>, Haskell's Either

// ── SIMPLE RESULT TYPE ──
public sealed interface Result<T> {
    record Success<T>(T value) implements Result<T> {}
    record Failure<T>(String errorCode, String message, Throwable cause) implements Result<T> {
        Failure(String errorCode, String message) {
            this(errorCode, message, null);
        }
    }

    // Factory methods:
    static <T> Result<T> success(T value) { return new Success<>(value); }
    static <T> Result<T> failure(String code, String message) {
        return new Failure<>(code, message);
    }

    // Utility methods:
    default boolean isSuccess() { return this instanceof Success<T>; }
    default boolean isFailure() { return this instanceof Failure<T>; }

    default T getValueOrThrow() {
        return switch (this) {
            case Success<T> s -> s.value();
            case Failure<T> f -> throw new RuntimeException(f.message());
        };
    }

    default <U> Result<U> map(java.util.function.Function<T, U> mapper) {
        return switch (this) {
            case Success<T> s -> success(mapper.apply(s.value()));
            case Failure<T> f -> failure(f.errorCode(), f.message());
        };
    }
}

// USAGE:
public Result<Order> placeOrder(PlaceOrderCommand cmd) {
    Customer customer = customerRepo.findById(cmd.getCustomerId()).orElse(null);
    if (customer == null)
        return Result.failure("CUSTOMER_NOT_FOUND", "Customer " + cmd.getCustomerId() + " not found");

    if (!customer.isActive())
        return Result.failure("CUSTOMER_INACTIVE", "Customer account is not active");

    Order order = buildOrder(customer, cmd);
    orderRepo.save(order);
    return Result.success(order);
}

// Caller:
Result<Order> result = orderService.placeOrder(cmd);
switch (result) {
    case Result.Success<Order> s -> sendConfirmationEmail(s.value());
    case Result.Failure<Order> f -> log.warn("Order failed: {} - {}", f.errorCode(), f.message());
}

// ── OPTIONAL (for "not found") ──
// Only for: "value may or may not exist"
// NOT for: exceptions/errors

Optional<User> user = userRepository.findByEmail(email);
// Forces caller to handle missing case:
User found = user.orElseThrow(() -> new UserNotFoundException(email));
String name = user.map(User::getName).orElse("Anonymous");
user.ifPresent(u -> sendWelcomeEmail(u));
```

---

# 10. Spring Boot Exception Handling

## 10.1 Global Exception Handler

```java
// ── @RestControllerAdvice ──
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── VALIDATION ERRORS (Bean Validation) ──
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, WebRequest request) {

        Map<String, List<String>> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.groupingBy(
                FieldError::getField,
                Collectors.mapping(FieldError::getDefaultMessage, Collectors.toList())
            ));

        return ResponseEntity.badRequest().body(
            ErrorResponse.builder()
                .errorCode("VALIDATION_FAILED")
                .message("Request validation failed")
                .fieldErrors(fieldErrors)
                .path(((ServletWebRequest)request).getRequest().getRequestURI())
                .timestamp(Instant.now())
                .build()
        );
    }

    // ── CONSTRAINT VIOLATION (method-level @Valid) ──
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex) {

        Map<String, List<String>> errors = ex.getConstraintViolations().stream()
            .collect(Collectors.groupingBy(
                cv -> cv.getPropertyPath().toString(),
                Collectors.mapping(ConstraintViolation::getMessage, Collectors.toList())
            ));

        return ResponseEntity.badRequest().body(
            ErrorResponse.validation("CONSTRAINT_VIOLATION", errors));
    }

    // ── APPLICATION-SPECIFIC EXCEPTIONS ──
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.info("Resource not found: {} id={}", ex.getResourceType(), ex.getResourceId());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ErrorResponse.simple(ex.getErrorCode(), ex.getMessage()));
    }

    @ExceptionHandler(BusinessRuleViolationException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRule(BusinessRuleViolationException ex) {
        log.info("Business rule violation: {} - {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.unprocessableEntity().body(
            ErrorResponse.simple(ex.getErrorCode(), ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            ErrorResponse.simple(ex.getErrorCode(), ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ErrorResponse.simple(ex.getErrorCode(), ex.getMessage()));
    }

    // ── BASE APP EXCEPTION (catch-all for typed app exceptions) ──
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException ex) {
        log.error("Application exception: {} - {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus()).body(
            ErrorResponse.simple(ex.getErrorCode(), ex.getMessage()));
    }

    // ── UNKNOWN EXCEPTIONS (catch-all) ──
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAll(Exception ex, WebRequest request) {
        // Log with full stack trace for unexpected errors:
        log.error("Unexpected error for request: {}",
            ((ServletWebRequest)request).getRequest().getRequestURI(), ex);

        // Return GENERIC message (don't leak internals!):
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ErrorResponse.simple(
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred. Please try again later."
                // DO NOT return: e.getMessage() — may contain sensitive info!
            )
        );
    }
}

// ── STANDARDIZED ERROR RESPONSE ──
@Value
@Builder
public class ErrorResponse {
    String errorCode;
    String message;
    Map<String, List<String>> fieldErrors;
    String path;
    Instant timestamp;

    // Factory methods:
    public static ErrorResponse simple(String code, String message) {
        return ErrorResponse.builder()
            .errorCode(code)
            .message(message)
            .timestamp(Instant.now())
            .build();
    }

    public static ErrorResponse validation(String code, Map<String, List<String>> errors) {
        return ErrorResponse.builder()
            .errorCode(code)
            .message("Validation failed")
            .fieldErrors(errors)
            .timestamp(Instant.now())
            .build();
    }
}
```

---

# 11. JavaScript Error — So Sánh với Java

## 11.1 JS Error Hierarchy

```
JAVASCRIPT KHÔNG có Checked/Unchecked distinction!
Tất cả errors trong JavaScript đều là "unchecked" — compiler không force handle

JS ERROR HIERARCHY:
  Error (base class)
    ├── EvalError           ← eval() errors (deprecated, rarely seen)
    ├── RangeError          ← value out of allowed range
    │     Examples: new Array(-1), num.toFixed(200)
    ├── ReferenceError      ← accessing undefined variable
    │     Example: console.log(undeclaredVar)
    ├── SyntaxError         ← invalid JavaScript syntax
    │     Example: JSON.parse("invalid json"), eval("if(")
    ├── TypeError           ← wrong type (MOST COMMON!)
    │     Example: null.property, undefined(), "str".methodNotExists()
    ├── URIError            ← malformed URI
    │     Example: decodeURIComponent('%')
    └── AggregateError      ← multiple errors (Promise.any, ES2021)

SO SÁNH VỚI JAVA:
  Java NullPointerException  ≈  JS TypeError (null/undefined access)
  Java NumberFormatException ≈  JS NaN (parseInt("abc") returns NaN, not throws!)
  Java ClassCastException    ≈  JS TypeError
  Java ArrayIndexOutOfBounds ≈  JS returns undefined (no throw!)
  Java StackOverflowError    ≈  JS RangeError: Maximum call stack size exceeded
  Java IllegalArgumentException ≈  No direct equivalent (manual throw)

KEY DIFFERENCE:
  Java: arr[1000] → ArrayIndexOutOfBoundsException (throws!)
  JS:   arr[1000] → undefined (no throw! silent failure)
  
  Java: null.method() → NullPointerException (throws!)
  JS:   null.property → TypeError: Cannot read properties of null (throws!)
  JS:   undefined?.property → undefined (optional chaining, no throw)
  
  Java: (int) "abc" → doesn't compile
  JS:   Number("abc") → NaN (no throw! silent failure)
  JS:   parseInt("abc") → NaN (no throw!)
```

## 11.2 JavaScript Error Object

```javascript
// ── ERROR OBJECT STRUCTURE ──
const err = new Error("Something went wrong");
console.log(err.name);        // "Error"
console.log(err.message);     // "Something went wrong"
console.log(err.stack);       // stack trace string
// Error: Something went wrong
//   at Object.<anonymous> (/app/index.js:1:13)
//   at Module._compile (internal/modules/cjs/loader.js:1063:30)
//   ...

// ── CREATING ERRORS ──
throw new Error("Generic error");
throw new TypeError("Expected string, got: " + typeof value);
throw new RangeError("Index " + index + " out of bounds [0, " + (arr.length-1) + "]");
throw new ReferenceError("Variable '" + name + "' is not defined");

// Throw ANYTHING (JS allows this, but bad practice!):
throw "string error";    // BAD: no stack trace, no instanceof check
throw 42;               // BAD: worse
throw { code: "ERR" };  // BAD: no stack trace

// ALWAYS throw Error instances (or subclasses)!

// ── CUSTOM ERRORS in JavaScript ──
class AppError extends Error {
    constructor(message, errorCode, httpStatus = 500) {
        super(message);               // sets this.message
        this.name = this.constructor.name;  // "AppError" not "Error"!
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;

        // Fix prototype chain (important for instanceof to work!)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);  // V8 only
        }
    }
}

class NotFoundError extends AppError {
    constructor(resource, id) {
        super(`${resource} with id '${id}' not found`, "NOT_FOUND", 404);
        this.resource = resource;
        this.resourceId = id;
    }
}

class ValidationError extends AppError {
    constructor(fieldErrors) {
        super("Validation failed", "VALIDATION_FAILED", 400);
        this.fieldErrors = fieldErrors;
    }
}

class BusinessError extends AppError {
    constructor(rule, message) {
        super(message, rule, 422);
        this.rule = rule;
    }
}

// ── TRY-CATCH in JavaScript ──
try {
    const result = JSON.parse(invalidJson);  // throws SyntaxError
    processResult(result);
} catch (error) {
    // JS has ONE catch block (no multiple catch types!)
    // Must use instanceof or error.name to differentiate:
    if (error instanceof SyntaxError) {
        console.error("Invalid JSON:", error.message);
    } else if (error instanceof TypeError) {
        console.error("Type error:", error.message);
    } else if (error instanceof NotFoundError) {
        console.error("Not found:", error.resource, error.resourceId);
    } else {
        console.error("Unknown error:", error);
        throw error;  // rethrow if can't handle!
    }
} finally {
    cleanup();  // always runs (same as Java)
}

// ── ASYNC ERROR HANDLING ──
// Promise rejection = async exception:
async function fetchUser(id) {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
        throw new NotFoundError("User", id);   // async throw = rejection!
    }
    return response.json();
}

// Catch async errors:
try {
    const user = await fetchUser(123);
    console.log(user);
} catch (error) {
    if (error instanceof NotFoundError) {
        console.error("User not found");
    } else {
        console.error("Unexpected error:", error);
    }
}

// Promise chain style:
fetchUser(123)
    .then(user => process(user))
    .catch(error => {
        if (error instanceof NotFoundError) handleNotFound(error);
        else throw error;  // rethrow!
    })
    .finally(() => cleanup());

// ── UNHANDLED REJECTIONS ──
// Unhandled promise rejections = uncaught exceptions!
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});

// Browser:
window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled rejection:", event.reason);
    event.preventDefault();  // prevent console error
});
```

## 11.3 Java vs JavaScript Comparison Table

```
FEATURE                     JAVA                        JAVASCRIPT
──────────────────────────────────────────────────────────────────────────────
Exception hierarchy         Checked + Unchecked         All unchecked
                            (compiler enforced)          (no compile check)

Multiple catch blocks       ✅ catch (A a) catch (B b)  ❌ ONE catch block
                                                          (must use instanceof)

Catch by type               ✅ Specific type matching    ❌ Manual instanceof

Checked exceptions          ✅ Yes (IOException etc.)    ❌ No

throws declaration          ✅ Method signature           ❌ No equivalent
                            void foo() throws IOException

finally                     ✅ Yes                       ✅ Yes (same behavior)

try-with-resources          ✅ AutoCloseable              ❌ No (manual finally)
                                                          (proposal exists)

Error vs Exception          ✅ Separate hierarchies       ❌ All same Error class
                            Error ≠ Exception

Custom exceptions           extend Exception/RuntimeExc  extend Error

Stack trace                 StackTraceElement[]           stack string property

Suppressed exceptions       ✅ getSuppressed()            ❌ Not built-in

Async exceptions            ✅ InterruptedException       ✅ Promise rejection
                            Future.get() throws           await throws

Static types                ✅ catch(IOException e) typed ❌ catch(e) = any type

null access                 NullPointerException          TypeError
                            (thrown)                      (thrown)

array out of bounds         ArrayIndexOutOfBoundsEx       undefined (NOT thrown!)
                            (thrown)                      silently fails

Division by zero (int)      ArithmeticException           Infinity or NaN
                            (thrown)                      (NOT thrown!)

Type coercion errors        ClassCastException (thrown)   TypeError (usually)
                                                          or silent coercion
```

---

# 12. Anti-Patterns & Best Practices

## 12.1 Exception Anti-Patterns

```java
// ❌ ANTI-PATTERN 1: SWALLOWING EXCEPTIONS
try {
    importantOperation();
} catch (Exception e) {
    // Do nothing!!! ← TERRIBLE
}
// Error happens silently → system in unknown state → downstream failures with no clue why

// ✅ CORRECT: at minimum, log the exception
try {
    importantOperation();
} catch (Exception e) {
    log.error("importantOperation failed, continuing", e);
    // Or: rethrow, or handle meaningfully
}


// ❌ ANTI-PATTERN 2: CATCH AND LOG THEN RETHROW (double logging!)
try {
    riskyOp();
} catch (Exception e) {
    log.error("Error in riskyOp", e);   // log here...
    throw new ServiceException("Failed", e);   // ...and logged again by caller!
}
// Results in same stack trace logged multiple times!

// ✅ CORRECT: log OR throw, not both
try {
    riskyOp();
} catch (Exception e) {
    throw new ServiceException("Failed", e);  // let top-level handler log
}
// OR: log here but don't rethrow


// ❌ ANTI-PATTERN 3: EXCEPTION AS CONTROL FLOW
// Using exceptions for normal flow (not exceptional conditions)
public boolean isValidEmail(String email) {
    try {
        new InternetAddress(email).validate();
        return true;
    } catch (AddressException e) {
        return false;  // using exception for control flow!
    }
}
// Exceptions are expensive! (fillInStackTrace)
// ✅ CORRECT: use validation logic that returns boolean

public boolean isValidEmail(String email) {
    return email != null && email.matches("^[^@]+@[^@]+\\.[^@]+$");
}


// ❌ ANTI-PATTERN 4: CATCHING THROWABLE OR ERROR
try {
    someCode();
} catch (Throwable t) {  // catches OutOfMemoryError, StackOverflowError!
    log.error("Error", t);
    // Then what? Heap is exhausted. Next allocation may fail.
}

// ✅ CORRECT: catch Exception (not Throwable or Error)
try {
    someCode();
} catch (Exception e) {
    handleException(e);
}
// Only catch Error/Throwable in: top-level handlers, test frameworks


// ❌ ANTI-PATTERN 5: OVERLY BROAD CATCH
try {
    String name = user.getName();
    Order order = orderRepo.findById(orderId).orElseThrow();
    Payment payment = paymentService.charge(order);
    notifyUser(user, payment);
} catch (Exception e) {
    log.error("Something failed", e);
    // Which operation failed? For what reason? No way to tell!
}

// ✅ CORRECT: catch at appropriate level or narrow the scope
Order order = orderRepo.findById(orderId)
    .orElseThrow(() -> new OrderNotFoundException(orderId));
try {
    Payment payment = paymentService.charge(order);
} catch (PaymentDeclinedException e) {
    notifyUser(user, "Payment declined: " + e.getReason());
    return OrderResult.paymentFailed(e.getReason());
}


// ❌ ANTI-PATTERN 6: NOT INCLUDING CAUSE IN WRAPPED EXCEPTION
try {
    jdbcTemplate.query(...);
} catch (DataAccessException e) {
    throw new ServiceException("DB error");  // LOST original cause!
}

// ✅ CORRECT: always pass cause
throw new ServiceException("DB error", e);  // cause preserved!


// ❌ ANTI-PATTERN 7: LOSING EXCEPTION IN FINALLY
public void process() throws IOException {
    try {
        doWork();  // throws IOException
    } finally {
        cleanup();  // also throws IOException → SWALLOWS doWork's exception!
    }
}

// ✅ CORRECT: protect against exception in finally
public void process() throws IOException {
    Throwable primaryException = null;
    try {
        doWork();
    } catch (Throwable t) {
        primaryException = t;
        throw t;
    } finally {
        if (primaryException != null) {
            try { cleanup(); }
            catch (Throwable suppressed) {
                primaryException.addSuppressed(suppressed);  // add as suppressed!
            }
        } else {
            cleanup();  // let cleanup exception propagate normally
        }
    }
}
// Or simply: use try-with-resources which handles this automatically!


// ❌ ANTI-PATTERN 8: EXPOSING SENSITIVE INFO IN EXCEPTIONS
throw new ServiceException("DB query failed: SELECT * FROM users WHERE password='" + password + "'");
// SQL with password in exception message! Logs contain passwords!

// ✅ CORRECT: sanitize exception messages
throw new ServiceException("User authentication failed for userId: " + userId);
// Never include: passwords, tokens, credit cards, PII in exception messages
```

## 12.2 Best Practices Summary

```java
// ── PREFER UNCHECKED EXCEPTIONS (modern Java style) ──
// For most application exceptions, use RuntimeException (unchecked)
// Easier to propagate through interfaces and lambda expressions
// Spring, Kotlin, modern libraries all use unchecked

// ── EXCEPTION HIERARCHY ──
// Create a base exception for your application
// Specific exceptions extend from it
// Keep hierarchy shallow (2-3 levels max)

// ── FACTORY METHODS OVER CONSTRUCTORS ──
// BAD:
throw new NotFoundException("User", userId.toString());
// GOOD: named factory method, clearer intent
throw ResourceNotFoundException.forUser(userId);
throw InsufficientFundsException.forAccount(accountId, required, available);

// ── LOG AT THE RIGHT LEVEL ──
// TRACE/DEBUG: expected, frequent, low severity
// INFO: significant business events
// WARN: unexpected but recoverable
// ERROR: unexpected, may require attention, with stack trace
// Never log and rethrow (double logging)!

// ── HANDLE AT THE RIGHT LAYER ──
// Repository: throw domain exceptions (not SQLException)
// Service: catch domain exceptions if can handle, otherwise propagate
// Controller: catch remaining exceptions (or @ControllerAdvice handles)
// Don't handle exception unless you CAN DO SOMETHING about it

// ── MESSAGES SHOULD HELP DEBUGGING ──
// Who is the audience? Developer reading logs
// Include: values that caused the error, expected range/format
// Include: object IDs, request IDs for correlation
// Exclude: passwords, tokens, sensitive data!

// ── TEST EXCEPTION SCENARIOS ──
// Test: exception is thrown with correct message
// Test: correct exception type
// Test: cause is preserved in wrapped exceptions

@Test
void findById_withNonExistentId_throwsNotFoundException() {
    ResourceNotFoundException ex = assertThrows(
        ResourceNotFoundException.class,
        () -> userService.findById(999L));

    assertThat(ex.getMessage()).contains("999");
    assertThat(ex.getResourceType()).isEqualTo("User");
    assertThat(ex.getResourceId()).isEqualTo("999");
}

@Test
void findById_withDbError_wrapsException() {
    when(userRepository.findById(any())).thenThrow(DataAccessException.class);

    ServiceException ex = assertThrows(
        ServiceException.class,
        () -> userService.findById(1L));

    assertThat(ex.getCause()).isInstanceOf(DataAccessException.class);
}
```

---

## 📎 Exception Quick Reference

```
JAVA HIERARCHY:
  Throwable → Error (don't catch!)
           → Exception → RuntimeException (unchecked, no compiler force)
                       → Others (checked, compiler forces handle)

KEY EXCEPTIONS:
  NullPointerException:        null dereference (Java 14+: helpful messages!)
  IllegalArgumentException:    invalid method argument (caller's bug)
  IllegalStateException:       object in wrong state for operation
  UnsupportedOperationException: method not supported
  IndexOutOfBoundsException:   array/list index invalid
  ConcurrentModificationException: modified during iteration
  ClassCastException:          invalid cast
  NumberFormatException:       invalid number string (extends IllegalArgumentException)

CUSTOM EXCEPTIONS:
  Extend RuntimeException (unchecked) for most application exceptions
  Add: errorCode (for API), httpStatus, factory methods
  Always include cause in wrapped exceptions!
  Message: include values, context, actionable info

TRY-CATCH:
  Multiple catch: catch (IOException | SQLException e) — Java 7+
  Specific before broad: FileNotFoundException before IOException
  Try-with-resources: AutoCloseable, suppressed exceptions handled correctly
  Finally: runs always, avoid throw/return in finally

ANTI-PATTERNS:
  Swallow exception (empty catch): NEVER
  Catch and log then rethrow: double logging
  Exception as control flow: expensive
  Catch Throwable/Error: almost never
  Lose cause in wrapping: always pass e as cause
  Sensitive data in message: never include passwords/tokens

JAVASCRIPT vs JAVA:
  JS: all unchecked, ONE catch block, instanceof to differentiate
  JS: array[out of bounds] → undefined (not exception!)
  JS: parseInt("abc") → NaN (not exception!)
  JS: async exceptions = Promise rejection
  Both: finally works same way
  JS Custom: extend Error, set this.name = constructor.name
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Java Throwable | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/lang/Throwable.html> |
| Java Exception | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/lang/Exception.html> |
| Java Error | <https://docs.oracle.com/en/java/se/17/docs/api/java.base/java/lang/Error.html> |
| Try-with-resources | <https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html> |
| Helpful NPE (JEP 358) | <https://openjdk.org/jeps/358> |
| Effective Java (Exceptions chapter) | <https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/> |
| Spring @ControllerAdvice | <https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-ann-controller-advice> |
| JavaScript Error | <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error> |
| JS Custom Error | <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types> |
| JS Promise rejection | <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#error_propagation> |
