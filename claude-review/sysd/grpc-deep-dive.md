# ⚡ gRPC — Deep Dive
>
> Protocol Buffers · HTTP/2 · Streaming · Interceptors · Service Mesh

---

## 📚 Mục Lục

1. [Tại Sao gRPC Ra Đời?](#1-tại-sao-grpc-ra-đời)
2. [Protocol Buffers — Serialization Engine](#2-protocol-buffers--serialization-engine)
3. [HTTP/2 — Foundation của gRPC](#3-http2--foundation-của-grpc)
4. [4 Loại Streaming](#4-4-loại-streaming)
5. [Service Definition & Code Generation](#5-service-definition--code-generation)
6. [Error Handling — Status Codes](#6-error-handling--status-codes)
7. [Interceptors — Cross-cutting Concerns](#7-interceptors--cross-cutting-concerns)
8. [gRPC vs REST vs GraphQL](#8-grpc-vs-rest-vs-graphql)
9. [Spring Boot + gRPC](#9-spring-boot--grpc)
10. [gRPC-Web & Browser Support](#10-grpc-web--browser-support)
11. [Load Balancing & Service Mesh](#11-load-balancing--service-mesh)

---

# 1. Tại Sao gRPC Ra Đời?

## 1.1 Vấn Đề Với REST Cho Internal Services

```
Microservices gọi nhau rất nhiều (service-to-service):
  Order Service → User Service → 50 times/second
  Order Service → Inventory Service → 200 times/second
  Payment Service → Fraud Detection → 100 times/second

REST/JSON vấn đề:
  1. JSON serialization overhead:
     Parse JSON → Java object: 1-5ms mỗi lần
     100 calls/sec × 3ms = 300ms/sec overhead chỉ cho serialization!

  2. HTTP/1.1 limitations:
     Head-of-line blocking, no multiplexing
     Multiple connections → overhead

  3. Weak typing:
     JSON schema không enforce → runtime errors
     "price": "150000" vs "price": 150000 → type mismatch

  4. No native streaming:
     REST không có server push native
     Workarounds: SSE, WebSocket (khác protocol)

  5. Documentation overhead:
     API contract qua OpenAPI/Swagger → separate file, can get out of sync

Google giải pháp: gRPC (2015, internal Stubby → public gRPC)
  Protocol Buffers: binary serialization, 3-10x smaller, 20-100x faster than JSON
  HTTP/2: multiplexing, header compression, bidirectional streaming
  Strongly typed: .proto file là contract, code generated từ đó
  Native streaming: 4 streaming modes built-in
```

## 1.2 gRPC Là Gì?

```
gRPC = gRPC Remote Procedure Call (recursive acronym)

Core idea: gọi method trên remote service như gọi local method.

// Local:
UserService userService = new UserService();
User user = userService.getUser("user_123");

// Remote (gRPC):
UserServiceGrpc.UserServiceBlockingStub stub = ...;
User user = stub.getUser(
  GetUserRequest.newBuilder().setId("user_123").build()
);
// Looks like local call! gRPC handles:
// - Serialization (object → protobuf bytes)
// - Network transport (HTTP/2)
// - Deserialization (bytes → object)
// - Error propagation

Components:
  .proto file    → define services, messages (the contract)
  protoc         → code generator (from .proto → language-specific code)
  gRPC runtime   → handles transport, serialization
  Stub (client)  → generated client code
  Service impl   → developer writes server implementation
```

---

# 2. Protocol Buffers — Serialization Engine

## 2.1 Protobuf vs JSON — Tại Sao Nhanh Hơn?

```
JSON:
{
  "id": "user_123",
  "name": "Khang",
  "age": 25,
  "active": true
}
→ 55 bytes (UTF-8 text)
→ Parse: text → tokenize → build tree → map to object

Protobuf binary (same data):
→ ~15 bytes (binary)
→ Parse: read field tags + values directly → no text parsing

BINARY FORMAT:
  Field encoding: [tag][wire_type][value]
  tag = field number from .proto
  wire_type = how to read (varint, 64-bit, length-delimited, 32-bit)

  id = "user_123":
    tag=1, wire_type=2 (length-delimited string)
    → 0x0A 0x08 "user_123"  (tag+type byte, length byte, data)

  age = 25:
    tag=3, wire_type=0 (varint)
    → 0x18 0x19  (tag+type byte, value as varint)

Benefits:
  ✅ 3-10x smaller than JSON
  ✅ 20-100x faster to parse (no text tokenization)
  ✅ Backward/forward compatible (field numbers, not names)
  ✅ Language-agnostic (proto → Java, Go, Python, Rust, ...)

Drawbacks:
  ❌ Not human-readable (need tooling to inspect)
  ❌ Schema required (cannot deserialize without .proto)
  ❌ Binary not naturally browser-friendly
```

## 2.2 .proto File Syntax

```protobuf
// user.proto
syntax = "proto3";

package user.v1;

option java_package = "com.example.user.proto";
option java_outer_classname = "UserProto";
option java_multiple_files = true;

import "google/protobuf/timestamp.proto";
import "google/protobuf/wrappers.proto";  // nullable wrappers

// Message = data structure
message User {
  string id = 1;                              // field number 1
  string name = 2;                            // field number 2
  string email = 3;
  int32 age = 4;
  UserRole role = 5;
  bool active = 6;
  google.protobuf.Timestamp created_at = 7;
  repeated string tags = 8;                   // repeated = list/array

  // Nested message:
  Address address = 9;

  // Oneof: only one of these fields set at a time
  oneof contact {
    string phone = 10;
    string telegram = 11;
  }

  // Optional (proto3 explicit optional):
  optional string nickname = 12;
}

message Address {
  string street = 1;
  string city = 2;
  string country = 3;
}

enum UserRole {
  USER_ROLE_UNSPECIFIED = 0;  // Default in proto3 MUST be 0!
  USER_ROLE_USER = 1;
  USER_ROLE_ADMIN = 2;
  USER_ROLE_MODERATOR = 3;
}

// Request/Response messages:
message GetUserRequest {
  string id = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;   // cursor
  string filter = 3;
}

message ListUsersResponse {
  repeated User users = 1;
  string next_page_token = 2;
  int32 total_count = 3;
}

// Service definition:
service UserService {
  // Unary RPC (request-response):
  rpc GetUser(GetUserRequest) returns (User);

  // Server streaming:
  rpc ListUsers(ListUsersRequest) returns (stream User);

  // Client streaming:
  rpc BatchCreateUsers(stream CreateUserRequest) returns (BatchCreateResponse);

  // Bidirectional streaming:
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}
```

## 2.3 Field Numbers — Backward/Forward Compatibility

```protobuf
// Field numbers are the identity, NOT field names!
// Bạn có thể rename field mà không breaking compatibility
// Nhưng KHÔNG được thay đổi field number!

// v1:
message User {
  string id = 1;
  string name = 2;
  string email = 3;
}

// v2 (backward compatible):
message User {
  string id = 1;
  string full_name = 2;    // renamed! but field number 2 unchanged → OK
  string email = 3;
  int32 age = 4;           // new field: old clients ignore it (proto3)
  // NEVER reuse field number 3 even if you remove email!
  // reserved 3;           // mark as reserved to prevent accidental reuse
  // reserved "email";     // reserve field name too
}

// Proto3 default values (no null concept):
// string → ""
// int32/int64 → 0
// bool → false
// enum → first value (must be 0)
// message → null (optional)
// repeated → empty list

// Proto3 gotcha: cannot distinguish between "field not set" and "field = default value"
// Solution: optional keyword or google.protobuf.wrappers (Int32Value, StringValue, etc.)
```

---

# 3. HTTP/2 — Foundation của gRPC

## 3.1 HTTP/2 vs HTTP/1.1

```
HTTP/1.1 problems:
  Head-of-line blocking: request 2 waits for request 1 to complete
  Multiple connections: browsers open 6-8 connections per host
  Header overhead: same headers sent repeatedly (no compression)
  No server push: client always initiates

HTTP/2 solutions:
  MULTIPLEXING:
    Multiple streams on 1 TCP connection
    Stream 1: gRPC request A
    Stream 2: gRPC request B (concurrent, no waiting!)
    Stream 3: gRPC response A (interleaved!)
    
    → gRPC có thể có 100 concurrent requests trên 1 connection!
    
  HEADER COMPRESSION (HPACK):
    Static table: common headers indexed
    Dynamic table: learned headers within connection
    "content-type: application/grpc" → 1 byte index!
    
  BINARY FRAMING:
    Không phải text. Data chia thành frames.
    Headers frame, Data frame, Settings frame, etc.
    
  FLOW CONTROL:
    Per-stream + per-connection flow control
    Prevent fast sender from overwhelming slow receiver

gRPC dùng HTTP/2:
  mỗi gRPC call = 1 HTTP/2 stream
  Multiple calls = multiple streams trên 1 connection
  No connection overhead per call!
```

## 3.2 gRPC Wire Format

```
gRPC request:
  HTTP/2 HEADERS frame:
    :method = POST
    :scheme = https
    :path = /user.v1.UserService/GetUser
    :authority = api.example.com
    content-type = application/grpc
    grpc-timeout = 5S
    authorization = Bearer token123

  HTTP/2 DATA frame:
    [compressed flag: 1 byte] [message length: 4 bytes] [protobuf bytes]
    0x00 0x00 0x00 0x00 0x08  (no compression, 8 bytes)
    [protobuf bytes for GetUserRequest { id: "user_123" }]

gRPC response:
  HTTP/2 HEADERS frame (initial):
    :status = 200
    content-type = application/grpc
  
  HTTP/2 DATA frame(s):
    [compressed flag] [length] [protobuf response bytes]
  
  HTTP/2 HEADERS frame (trailers):
    grpc-status = 0          (0 = OK)
    grpc-message = ""        (empty = success)
    
  Trailers carry status! (unlike REST where status is in initial headers)
```

---

# 4. 4 Loại Streaming

## 4.1 Unary RPC (Request-Response)

```java
// Giống REST: 1 request → 1 response
// Dùng cho: CRUD operations, simple lookups

// .proto:
rpc GetUser(GetUserRequest) returns (User);

// Server implementation:
@Override
public void getUser(GetUserRequest request, StreamObserver<User> responseObserver) {
    try {
        User user = userService.findById(request.getId());
        responseObserver.onNext(user);      // send response
        responseObserver.onCompleted();     // signal completion
    } catch (UserNotFoundException e) {
        responseObserver.onError(
            Status.NOT_FOUND
                .withDescription("User " + request.getId() + " not found")
                .asRuntimeException()
        );
    }
}

// Client (blocking):
UserServiceGrpc.UserServiceBlockingStub stub = UserServiceGrpc.newBlockingStub(channel);
User user = stub.getUser(GetUserRequest.newBuilder().setId("user_123").build());
```

## 4.2 Server Streaming (1 Request → N Responses)

```java
// Server gửi nhiều responses về 1 request
// Use cases:
//   - Export large datasets (gửi từng batch)
//   - Live feed / event stream
//   - Search results (gửi dần)

// .proto:
rpc ListUsers(ListUsersRequest) returns (stream User);
rpc ExportOrders(ExportRequest) returns (stream OrderBatch);

// Server:
@Override
public void listUsers(ListUsersRequest request, StreamObserver<User> responseObserver) {
    // Stream từng user:
    userRepository.findAll().forEach(user -> {
        if (!responseObserver.isReady()) {
            // Backpressure: client not ready → wait
        }
        responseObserver.onNext(user);
    });
    responseObserver.onCompleted();
}

// Client (nhận stream):
stub.listUsers(request, new StreamObserver<User>() {
    @Override
    public void onNext(User user) {
        processUser(user);  // called for each streamed user
    }
    @Override
    public void onError(Throwable t) { handleError(t); }
    @Override
    public void onCompleted() { System.out.println("All users received"); }
});
```

## 4.3 Client Streaming (N Requests → 1 Response)

```java
// Client gửi nhiều requests, server trả 1 response sau khi nhận tất cả
// Use cases:
//   - Batch upload (file chunks, bulk insert)
//   - Aggregation (send many metrics → get summary)

// .proto:
rpc BatchCreateUsers(stream CreateUserRequest) returns (BatchCreateResponse);

// Server:
@Override
public StreamObserver<CreateUserRequest> batchCreateUsers(
        StreamObserver<BatchCreateResponse> responseObserver) {

    List<User> created = new ArrayList<>();

    return new StreamObserver<CreateUserRequest>() {
        @Override
        public void onNext(CreateUserRequest request) {
            // Nhận từng request từ client:
            User user = userService.create(request);
            created.add(user);
        }
        @Override
        public void onError(Throwable t) { handleError(t); }
        @Override
        public void onCompleted() {
            // Client finished sending → send final response:
            responseObserver.onNext(BatchCreateResponse.newBuilder()
                .setCreatedCount(created.size())
                .build());
            responseObserver.onCompleted();
        }
    };
}

// Client (gửi stream):
StreamObserver<CreateUserRequest> requestStream = asyncStub.batchCreateUsers(
    new StreamObserver<BatchCreateResponse>() {
        public void onNext(BatchCreateResponse r) {
            System.out.println("Created: " + r.getCreatedCount());
        }
        public void onError(Throwable t) { }
        public void onCompleted() { }
    }
);

// Gửi nhiều requests:
users.forEach(u -> requestStream.onNext(
    CreateUserRequest.newBuilder().setName(u.getName()).build()
));
requestStream.onCompleted();  // signal done
```

## 4.4 Bidirectional Streaming (N Requests ↔ N Responses)

```java
// Cả client và server gửi streams independently
// Use cases:
//   - Real-time chat
//   - Collaborative editing
//   - Live game state sync
//   - Sensor data with commands

// .proto:
rpc Chat(stream ChatMessage) returns (stream ChatMessage);

// Server:
@Override
public StreamObserver<ChatMessage> chat(StreamObserver<ChatMessage> responseObserver) {
    return new StreamObserver<ChatMessage>() {
        @Override
        public void onNext(ChatMessage message) {
            // Broadcast to other chat participants:
            chatRoom.broadcast(message, responseObserver);
        }
        @Override
        public void onCompleted() {
            chatRoom.leave(responseObserver);
            responseObserver.onCompleted();
        }
        @Override
        public void onError(Throwable t) {
            chatRoom.leave(responseObserver);
        }
    };
}
```

---

# 5. Service Definition & Code Generation

## 5.1 Code Generation Flow

```
.proto file
    ↓ protoc (protocol buffer compiler)
    ↓ + grpc plugin
    ↓
Generated Java code:
  UserProto.java            → Message classes (User, GetUserRequest, etc.)
  UserServiceGrpc.java      → Stub classes + abstract service
    UserServiceImplBase     → Extend this for server
    UserServiceBlockingStub → Synchronous client
    UserServiceStub         → Async client (StreamObserver)
    UserServiceFutureStub   → Returns ListenableFuture

Developer writes:
  UserServiceImpl extends UserServiceGrpc.UserServiceImplBase
```

## 5.2 Maven/Gradle Setup

```xml
<!-- pom.xml -->
<dependencies>
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-netty-shaded</artifactId>
  </dependency>
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-protobuf</artifactId>
  </dependency>
  <dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-stub</artifactId>
  </dependency>
</dependencies>

<build>
  <extensions>
    <extension>
      <groupId>kr.motd.maven</groupId>
      <artifactId>os-maven-plugin</artifactId>
    </extension>
  </extensions>
  <plugins>
    <plugin>
      <groupId>org.xolstice.maven.plugins</groupId>
      <artifactId>protobuf-maven-plugin</artifactId>
      <configuration>
        <protocArtifact>com.google.protobuf:protoc:${protobuf.version}:exe:${os.detected.classifier}</protocArtifact>
        <pluginId>grpc-java</pluginId>
        <pluginArtifact>io.grpc:protoc-gen-grpc-java:${grpc.version}:exe:${os.detected.classifier}</pluginArtifact>
      </configuration>
      <executions>
        <execution>
          <goals><goal>compile</goal><goal>compile-custom</goal></goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

---

# 6. Error Handling — Status Codes

## 6.1 gRPC Status Codes

```
gRPC có 16 status codes (không phải HTTP codes):

OK (0):              Success
CANCELLED (1):       Client cancelled the request
UNKNOWN (2):         Unknown error (no better code)
INVALID_ARGUMENT (3): Invalid input data (like HTTP 400)
DEADLINE_EXCEEDED (4): Timeout
NOT_FOUND (5):       Resource not found (like HTTP 404)
ALREADY_EXISTS (6):  Resource already exists (like HTTP 409)
PERMISSION_DENIED (7): No permission (like HTTP 403)
RESOURCE_EXHAUSTED (8): Rate limit exceeded (like HTTP 429)
FAILED_PRECONDITION (9): System not in state for operation
ABORTED (10):        Concurrency conflict (optimistic lock)
OUT_OF_RANGE (11):   Out of valid range
UNIMPLEMENTED (12):  Method not implemented (like HTTP 501)
INTERNAL (13):       Server internal error (like HTTP 500)
UNAVAILABLE (14):    Service unavailable (like HTTP 503) — RETRYABLE!
DATA_LOSS (15):      Unrecoverable data loss/corruption
UNAUTHENTICATED (16): No auth (like HTTP 401)

RETRYABLE codes: UNAVAILABLE, RESOURCE_EXHAUSTED (with backoff)
NON-RETRYABLE: INVALID_ARGUMENT, NOT_FOUND, PERMISSION_DENIED, UNAUTHENTICATED
```

## 6.2 Error Handling Implementation

```java
// Server: throw errors với status
@Override
public void getUser(GetUserRequest req, StreamObserver<User> resp) {
    // Validation:
    if (req.getId().isEmpty()) {
        resp.onError(Status.INVALID_ARGUMENT
            .withDescription("User ID cannot be empty")
            .asRuntimeException());
        return;
    }

    try {
        User user = userService.findById(req.getId());
        resp.onNext(user);
        resp.onCompleted();
    } catch (UserNotFoundException e) {
        resp.onError(Status.NOT_FOUND
            .withDescription("User " + req.getId() + " not found")
            .withCause(e)
            .asRuntimeException());
    } catch (Exception e) {
        resp.onError(Status.INTERNAL
            .withDescription("Internal error")
            .withCause(e)
            .asRuntimeException());
    }
}

// Client: handle errors
try {
    User user = stub.getUser(request);
} catch (StatusRuntimeException e) {
    switch (e.getStatus().getCode()) {
        case NOT_FOUND:
            System.out.println("User not found");
            break;
        case UNAUTHENTICATED:
            refreshToken();
            retry();
            break;
        case UNAVAILABLE:
            exponentialBackoff();
            retry();
            break;
        default:
            throw e;
    }
}

// Rich error details (google.rpc.Status):
import com.google.rpc.Code;
import io.grpc.protobuf.StatusProto;

com.google.rpc.Status richStatus = com.google.rpc.Status.newBuilder()
    .setCode(Code.INVALID_ARGUMENT_VALUE)
    .setMessage("Invalid user data")
    .addDetails(Any.pack(BadRequest.newBuilder()
        .addFieldViolations(FieldViolation.newBuilder()
            .setField("email")
            .setDescription("Invalid email format")
            .build())
        .build()))
    .build();

responseObserver.onError(StatusProto.toStatusRuntimeException(richStatus));
```

## 6.3 Deadlines & Timeouts

```java
// gRPC: deadlines propagate automatically through call chains!
// ServiceA (deadline: 5s) → ServiceB → ServiceC
// If ServiceA deadline passes → ServiceB/C automatically cancelled!

// Client set deadline:
User user = stub
    .withDeadline(Deadline.after(5, TimeUnit.SECONDS))
    .getUser(request);

// Server check if client cancelled:
@Override
public void slowOperation(Request req, StreamObserver<Response> resp) {
    for (int i = 0; i < 1000; i++) {
        if (Context.current().isCancelled()) {
            // Client deadline exceeded → stop processing!
            resp.onError(Status.CANCELLED.withDescription("Client cancelled").asRuntimeException());
            return;
        }
        processChunk(i);
        resp.onNext(partialResult(i));
    }
    resp.onCompleted();
}
```

---

# 7. Interceptors — Cross-cutting Concerns

## 7.1 Server Interceptors

```java
// Interceptors: như Servlet Filters nhưng cho gRPC
// Dùng cho: authentication, logging, metrics, tracing, validation

public class AuthInterceptor implements ServerInterceptor {

    static final Context.Key<User> USER_CONTEXT_KEY = Context.key("user");

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        // Extract token from metadata:
        String token = headers.get(Metadata.Key.of(
            "authorization", Metadata.ASCII_STRING_MARSHALLER));

        if (token == null || !token.startsWith("Bearer ")) {
            call.close(Status.UNAUTHENTICATED.withDescription("No token"), headers);
            return new ServerCall.Listener<>() {};
        }

        try {
            User user = jwtService.verify(token.substring(7));
            // Add user to gRPC context (propagates to service):
            Context ctx = Context.current().withValue(USER_CONTEXT_KEY, user);
            return Contexts.interceptCall(ctx, call, headers, next);
        } catch (Exception e) {
            call.close(Status.UNAUTHENTICATED.withDescription("Invalid token"), headers);
            return new ServerCall.Listener<>() {};
        }
    }
}

// Trong service: access user từ context
@Override
public void getMyProfile(Empty req, StreamObserver<User> resp) {
    User currentUser = AuthInterceptor.USER_CONTEXT_KEY.get();
    resp.onNext(userService.findById(currentUser.getId()));
    resp.onCompleted();
}

// Logging interceptor:
public class LoggingInterceptor implements ServerInterceptor {
    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call, Metadata headers, ServerCallHandler<ReqT, RespT> next) {

        String method = call.getMethodDescriptor().getFullMethodName();
        long start = System.currentTimeMillis();

        ServerCall<ReqT, RespT> wrappedCall = new ForwardingServerCall.SimpleForwardingServerCall<>(call) {
            @Override
            public void close(Status status, Metadata trailers) {
                long duration = System.currentTimeMillis() - start;
                log.info("gRPC {} → {} ({}ms)", method, status.getCode(), duration);
                super.close(status, trailers);
            }
        };
        return next.startCall(wrappedCall, headers);
    }
}
```

## 7.2 Client Interceptors

```java
// Client interceptor: add auth token to outgoing calls
public class ClientAuthInterceptor implements ClientInterceptor {

    private final TokenProvider tokenProvider;

    @Override
    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
            MethodDescriptor<ReqT, RespT> method,
            CallOptions callOptions,
            Channel next) {

        return new ForwardingClientCall.SimpleForwardingClientCall<>(
                next.newCall(method, callOptions)) {
            @Override
            public void start(Listener<RespT> responseListener, Metadata headers) {
                headers.put(
                    Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER),
                    "Bearer " + tokenProvider.getToken()
                );
                super.start(responseListener, headers);
            }
        };
    }
}

// Retry interceptor:
ManagedChannel channel = ManagedChannelBuilder.forAddress("localhost", 9090)
    .intercept(new ClientAuthInterceptor(tokenProvider))
    .intercept(new RetryInterceptor(maxRetries = 3))
    .usePlaintext()
    .build();
```

---

# 8. gRPC vs REST vs GraphQL

```
┌─────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                 │ REST/HTTP         │ GraphQL           │ gRPC             │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Protocol        │ HTTP/1.1 or 2    │ HTTP/1.1 or 2    │ HTTP/2 required  │
│ Data format     │ JSON (text)      │ JSON (text)      │ Protobuf (binary)│
│ Contract        │ OpenAPI (opt)    │ SDL (required)   │ .proto (required)│
│ Type safety     │ Weak             │ Strong           │ Very Strong      │
│ Performance     │ Medium           │ Medium           │ Excellent        │
│ Browser support │ Native           │ Native           │ Needs gRPC-Web   │
│ Streaming       │ SSE (1-way)      │ Subscriptions    │ 4 modes native   │
│ Code generation │ Optional         │ Optional         │ Required         │
│ Human readable  │ ✅               │ ✅               │ ❌ (binary)      │
│ HTTP caching    │ Native (GET)     │ Limited          │ ❌               │
│ Learning curve  │ Low              │ Medium           │ High             │
│ Ecosystem       │ Enormous         │ Large            │ Growing          │
│ Use case        │ Public APIs,     │ Flexible client  │ Internal micro-  │
│                 │ simple CRUD      │ needs, BFF       │ services, high   │
│                 │                  │                  │ performance      │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘

DECISION GUIDE:
  Public API, external developers → REST (widely understood, easy to use)
  Multiple clients, different data needs → GraphQL (client-driven)
  Internal microservices, high throughput → gRPC (performance, type safety)
  IoT, mobile with limited bandwidth → gRPC (small payload)
  Real-time chat, game → gRPC bidirectional streaming
  Event streaming → Consider Kafka/messaging instead
```

---

# 9. Spring Boot + gRPC

## 9.1 Setup với grpc-spring-boot-starter

```xml
<dependency>
  <groupId>net.devh</groupId>
  <artifactId>grpc-spring-boot-starter</artifactId>
  <version>2.15.0.RELEASE</version>
</dependency>
```

```yaml
# application.yml
grpc:
  server:
    port: 9090
    security:
      enabled: true
  client:
    user-service:
      address: static://user-service:9090
      negotiation-type: plaintext  # or TLS
```

```java
// Server:
@GrpcService
@Slf4j
public class UserGrpcService extends UserServiceGrpc.UserServiceImplBase {

    private final UserService userService;

    @Override
    public void getUser(GetUserRequest request, StreamObserver<UserProto> responseObserver) {
        userService.findById(request.getId())
            .map(user -> UserProto.newBuilder()
                .setId(user.getId())
                .setName(user.getName())
                .setEmail(user.getEmail())
                .build())
            .ifPresentOrElse(
                proto -> {
                    responseObserver.onNext(proto);
                    responseObserver.onCompleted();
                },
                () -> responseObserver.onError(
                    Status.NOT_FOUND.withDescription("User not found").asRuntimeException()
                )
            );
    }

    @Override
    public void listUsers(ListUsersRequest request, StreamObserver<UserProto> responseObserver) {
        userService.findAll().stream()
            .map(this::toProto)
            .forEach(responseObserver::onNext);
        responseObserver.onCompleted();
    }
}

// Client (trong another service):
@GrpcClient("user-service")
private UserServiceGrpc.UserServiceBlockingStub userServiceStub;

public User getUser(String id) {
    try {
        UserProto proto = userServiceStub.getUser(
            GetUserRequest.newBuilder().setId(id).build()
        );
        return fromProto(proto);
    } catch (StatusRuntimeException e) {
        if (e.getStatus().getCode() == Status.Code.NOT_FOUND) {
            throw new UserNotFoundException(id);
        }
        throw new ServiceException("User service error", e);
    }
}
```

---

# 10. gRPC-Web & Browser Support

## 10.1 Tại Sao Cần gRPC-Web?

```
Browsers KHÔNG support HTTP/2 trailers (nơi gRPC status được trả).
gRPC cần HTTP/2 trailers → browsers cannot use gRPC directly.

Giải pháp: gRPC-Web = wrapper protocol
  Client → [gRPC-Web format] → Envoy Proxy → [gRPC] → Server
  Browser → HTTP/1.1 or HTTP/2 (no trailers) → Proxy → HTTP/2 + trailers → gRPC

Architecture:
  Browser (grpc-web client) → Envoy proxy → gRPC server
  
Limitations:
  - Client streaming NOT supported (HTTP limitations)
  - Bidirectional streaming NOT supported
  - Only unary + server streaming

Alternatives:
  - gRPC-Web với Envoy
  - Connect (Buf): browser-friendly, works without proxy
  - Use REST/GraphQL for browser, gRPC for internal
```

## 10.2 Connect Protocol (Modern Alternative)

```typescript
// Buf Connect: gRPC-compatible but browser-native
// Works with fetch API, no proxy needed!

import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { UserService } from "./gen/user_connect";

const transport = createConnectTransport({
  baseUrl: "https://api.example.com",
});

const client = createClient(UserService, transport);

// Unary:
const user = await client.getUser({ id: "user_123" });
console.log(user.name);

// Server streaming:
for await (const user of client.listUsers({ pageSize: 100 })) {
  processUser(user);
}
```

---

# 11. Load Balancing & Service Mesh

## 11.1 gRPC Load Balancing

```
REST: HTTP/1.1 → new connection per request → load balancer routes easily
gRPC: HTTP/2 → long-lived connections → load balancer thấy 1 connection!
→ All requests từ client X đến cùng server Y → uneven load!

Solutions:
1. Client-side load balancing (gRPC built-in):
   Client maintains list of server IPs → round-robin distribution
   
   ManagedChannel channel = ManagedChannelBuilder
     .forTarget("dns:///user-service.namespace.svc.cluster.local")
     .defaultLoadBalancingPolicy("round_robin")
     .build();

2. L7 proxy (Envoy, Nginx, Traefik):
   Proxy understands HTTP/2 → routes individual streams
   Client → proxy → backend pool (stream-level LB)

3. Service Mesh (Istio, Linkerd):
   Sidecar proxy trên mỗi pod
   Intercept gRPC traffic → intelligent routing, retries, circuit breaking
   
   Benefits: no code changes, observability, security (mTLS)
```

## 11.2 Health Checking

```java
// gRPC Health Check Protocol (standard):
import io.grpc.health.v1.HealthCheckRequest;
import io.grpc.health.v1.HealthCheckResponse;
import io.grpc.health.v1.HealthGrpc;

// Implement health service:
HealthStatusManager healthManager = new HealthStatusManager();
Server server = ServerBuilder.forPort(9090)
    .addService(healthManager.getHealthService())
    .addService(new UserGrpcService())
    .build();

// Mark service as serving:
healthManager.setStatus("UserService", HealthCheckResponse.ServingStatus.SERVING);

// For Kubernetes: grpc_health_probe binary or native gRPC probe
// livenessProbe:
//   exec:
//     command: ["/bin/grpc_health_probe", "-addr=:9090"]
```

## 📎 Official Documentation Links

| Topic | Link |
|---|---|
| gRPC Official | <https://grpc.io/docs> |
| Protocol Buffers | <https://protobuf.dev> |
| gRPC Java | <https://grpc.io/docs/languages/java> |
| grpc-spring-boot-starter | <https://yidongnan.github.io/grpc-spring-boot-starter> |
| Buf (proto tooling) | <https://buf.build/docs> |
| Connect (modern gRPC) | <https://connectrpc.com/docs> |
| gRPC-Web | <https://github.com/grpc/grpc-web> |
| gRPC Status Codes | <https://grpc.github.io/grpc/core/md_doc_statuscodes.html> |
