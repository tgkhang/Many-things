# 🌐 Phương Thức Hiện Đại & Micro Frontend
>
> WebSocket · SSE · WebRTC · Event-Driven · Module Federation · Micro FE Patterns

---

## 📚 Mục Lục

1. [WebSocket — Full-Duplex Communication](#1-websocket--full-duplex-communication)
2. [Server-Sent Events (SSE)](#2-server-sent-events-sse)
3. [WebRTC — Peer-to-Peer](#3-webrtc--peer-to-peer)
4. [Long Polling & Short Polling](#4-long-polling--short-polling)
5. [Event-Driven Architecture](#5-event-driven-architecture)
6. [Micro Frontend — Tại Sao Ra Đời?](#6-micro-frontend--tại-sao-ra-đời)
7. [Module Federation — Cơ Chế Bên Trong](#7-module-federation--cơ-chế-bên-trong)
8. [Micro FE Patterns & Integration Approaches](#8-micro-fe-patterns--integration-approaches)
9. [Micro FE Communication](#9-micro-fe-communication)
10. [Routing & Navigation](#10-routing--navigation)
11. [Shared State & Dependencies](#11-shared-state--dependencies)
12. [Deployment & CI/CD](#12-deployment--cicd)
13. [Challenges & Trade-offs](#13-challenges--trade-offs)

---

# 1. WebSocket — Full-Duplex Communication

## 1.1 WebSocket vs HTTP — Cơ Bản Nhất

```
HTTP: Client luôn PHẢI initiate. Request → Response. Connection đóng.

WebSocket:
  1. HTTP Upgrade handshake (vẫn bắt đầu bằng HTTP!)
  2. Connection "upgraded" → persistent, full-duplex TCP connection
  3. Cả client VÀ server có thể gửi BẤT KỲ LÚC NÀO
  4. Không cần request trước, không cần response sau

HTTP:   Client →  Request → Server
              ←  Response ←
        Connection closed.

WebSocket Handshake:
  Client: GET /ws HTTP/1.1
          Upgrade: websocket
          Connection: Upgrade
          Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
          Sec-WebSocket-Version: 13

  Server: HTTP/1.1 101 Switching Protocols
          Upgrade: websocket
          Connection: Upgrade
          Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
  
  Connection "upgraded". Now bidirectional TCP frames!

After handshake:
  Client → "Hello Server!"
  Server → "Hello Client!"
  Server → "New message from Alice"  (server-initiated!)
  Client → "Send this to Bob"
  Server → "Message delivered"
  (connection stays open indefinitely)
```

## 1.2 WebSocket Implementation

```javascript
// BROWSER (Client):
const ws = new WebSocket("wss://api.example.com/ws");
// wss = WebSocket Secure (TLS), ws = plain

ws.onopen = () => {
  console.log("Connected!");
  ws.send(JSON.stringify({ type: "subscribe", channel: "notifications" }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleMessage(data);
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = (event) => {
  console.log(`Closed: code=${event.code}, reason=${event.reason}`);
  // Auto-reconnect with exponential backoff:
  setTimeout(reconnect, Math.min(1000 * 2 ** reconnectAttempts, 30000));
};

// Send:
ws.send("plain text");
ws.send(JSON.stringify({ type: "message", content: "Hello!" }));
ws.send(new ArrayBuffer(8));  // Binary data

// Close:
ws.close(1000, "Normal closure");

// Close codes: 1000=Normal, 1001=GoingAway, 1006=AbnormalClosure,
//              1008=PolicyViolation, 1011=InternalError

// REACT hook:
function useChatWebSocket(roomId) {
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/chat/${roomId}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      setMessages(prev => [...prev, JSON.parse(e.data)]);
    };

    ws.onclose = () => {
      // Handle disconnect
    };

    return () => ws.close();  // cleanup on unmount
  }, [roomId]);

  const sendMessage = useCallback((content) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", content }));
    }
  }, []);

  return { messages, sendMessage };
}
```

## 1.3 Spring Boot WebSocket Server

```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatHandler(), "/ws/chat/{roomId}")
                .setAllowedOrigins("https://app.example.com")
                .withSockJS();  // SockJS fallback for older browsers
    }
}

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    // Thread-safe session storage:
    private final Map<String, Set<WebSocketSession>> roomSessions =
        new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String roomId = extractRoomId(session.getUri());
        roomSessions.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet())
                    .add(session);
        log.info("Connected: {} to room {}", session.getId(), roomId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message)
            throws Exception {
        ChatMessage msg = objectMapper.readValue(message.getPayload(), ChatMessage.class);
        String roomId = extractRoomId(session.getUri());

        // Broadcast to all in room:
        String payload = objectMapper.writeValueAsString(
            new ChatMessage(msg.getContent(), msg.getSenderId(), Instant.now())
        );
        TextMessage outgoing = new TextMessage(payload);

        Set<WebSocketSession> sessions = roomSessions.getOrDefault(roomId, Set.of());
        for (WebSocketSession s : sessions) {
            if (s.isOpen()) {
                synchronized (s) {  // synchronize per session!
                    s.sendMessage(outgoing);
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomId = extractRoomId(session.getUri());
        roomSessions.getOrDefault(roomId, Set.of()).remove(session);
    }
}
```

## 1.4 STOMP Over WebSocket (Spring)

```java
// STOMP (Simple Text Oriented Messaging Protocol):
// Messaging protocol ON TOP OF WebSocket
// Adds: topics, queues, subscriptions, acknowledgments

@Configuration
@EnableWebSocketMessageBroker
public class StompConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");  // in-memory broker
        // Or use RabbitMQ/ActiveMQ as external broker for scaling!
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").withSockJS();
    }
}

@Controller
public class ChatController {

    @MessageMapping("/chat/{roomId}")         // client sends to /app/chat/{roomId}
    @SendTo("/topic/chat/{roomId}")           // broadcast to subscribers of topic
    public ChatMessage handleMessage(
            @DestinationVariable String roomId,
            ChatMessage message,
            Principal user) {
        return new ChatMessage(message.getContent(), user.getName(), Instant.now());
    }

    // Send to specific user:
    @MessageMapping("/private")
    public void handlePrivate(Message msg, Principal user) {
        messagingTemplate.convertAndSendToUser(
            msg.getTargetUser(),
            "/queue/private",
            msg
        );
    }
}

// JavaScript (STOMP client):
const client = new StompJs.Client({
  brokerURL: "wss://api.example.com/ws",
});

client.onConnect = () => {
  client.subscribe("/topic/chat/room123", (msg) => {
    console.log("Received:", JSON.parse(msg.body));
  });
};

client.activate();

// Send:
client.publish({
  destination: "/app/chat/room123",
  body: JSON.stringify({ content: "Hello!" }),
});
```

---

# 2. Server-Sent Events (SSE)

## 2.1 SSE — Server Push Đơn Giản

```
SSE = server → client ONE-WAY streaming qua regular HTTP.
Không cần upgrade, không cần special protocol.
Browser dùng EventSource API.

Khi nào dùng SSE thay WebSocket:
  ✅ Chỉ cần server → client (notifications, live feed, dashboard updates)
  ✅ Không cần client → server realtime
  ✅ Native HTTP (qua reverse proxy dễ hơn WS)
  ✅ Auto-reconnect built-in (EventSource)
  ✅ Text-based (no binary)

Khi dùng WebSocket:
  Chat, collaborative editing, games (bidirectional realtime)

SSE advantages over WebSocket:
  - Works over HTTP/1.1 (WS cần upgrade)
  - Goes through HTTP proxies naturally
  - Automatic reconnection built into EventSource
  - Browser handles heartbeat
  - Simpler server implementation
```

## 2.2 SSE Protocol

```
HTTP Response format:
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type": "notification", "message": "New order!"}

event: order_update
data: {"orderId": "123", "status": "SHIPPED"}
id: 45

: this is a comment (keep-alive ping)

data: multi-line
data: message

Fields:
  data: the message data (can be multiple lines = concatenated with \n)
  event: custom event type (default: "message")
  id: last event ID (for reconnect resumption)
  retry: reconnection time in ms

Empty line = end of event block
```

## 2.3 Spring Boot SSE

```java
// Controller:
@RestController
@RequestMapping("/api/events")
public class EventController {

    private final SseEmitterService emitterService;

    // Client connects: GET /api/events/stream
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents(@RequestParam String userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);  // no timeout

        emitterService.register(userId, emitter);

        emitter.onCompletion(() -> emitterService.remove(userId));
        emitter.onTimeout(() -> emitterService.remove(userId));
        emitter.onError(e -> emitterService.remove(userId));

        // Send initial connection event:
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("{\"status\": \"connected\"}")
                .id("0"));
        } catch (IOException e) {
            emitter.complete();
        }

        return emitter;
    }
}

@Service
public class SseEmitterService {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public void register(String userId, SseEmitter emitter) {
        emitters.put(userId, emitter);
    }

    public void remove(String userId) {
        emitters.remove(userId);
    }

    // Push notification to specific user:
    public void sendToUser(String userId, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(objectMapper.writeValueAsString(data))
                    .id(String.valueOf(System.currentTimeMillis())));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        }
    }

    // Broadcast to all:
    public void broadcast(Object data) {
        emitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event().data(data));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        });
    }
}

// Broadcast từ @EventListener:
@Component
public class OrderEventHandler {

    @Autowired SseEmitterService sseService;

    @EventListener
    public void onOrderShipped(OrderShippedEvent event) {
        sseService.sendToUser(event.getUserId(), new Notification(
            "Your order #" + event.getOrderId() + " has been shipped!"
        ));
    }
}
```

## 2.4 Browser EventSource

```javascript
// EventSource: browser built-in, auto-reconnect!
const eventSource = new EventSource("/api/events/stream?userId=user_123", {
  withCredentials: true,  // send cookies for auth
});

// Default "message" events:
eventSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  handleUpdate(data);
};

// Named custom events:
eventSource.addEventListener("notification", (e) => {
  showNotification(JSON.parse(e.data));
});

eventSource.addEventListener("order_update", (e) => {
  updateOrderStatus(JSON.parse(e.data));
});

eventSource.onerror = (e) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log("Connection closed, will auto-reconnect");
  }
};
// EventSource auto-reconnects after ~3s by default!
// Use "retry: 5000" in server response to change interval.

// Manual close:
eventSource.close();
```

---

# 3. WebRTC — Peer-to-Peer

## 3.1 WebRTC Là Gì & Tại Sao?

```
WebRTC (Web Real-Time Communication):
  P2P direct connection giữa browsers (hoặc mobile apps).
  Không qua server (sau khi handshake).

Use cases:
  Video calls (Google Meet, Discord web)
  Voice calls
  Screen sharing
  P2P file transfer
  Real-time gaming (low latency)

Tại sao P2P tốt:
  Low latency: not going through server → faster
  Reduced server cost: video data không đi qua server
  Privacy: end-to-end encrypted by default (DTLS-SRTP)

Vấn đề P2P:
  NAT traversal: hai clients sau NAT không biết IP của nhau
  → Cần signaling server để exchange connection info
  → ICE (Interactive Connectivity Establishment) với STUN/TURN
```

## 3.2 WebRTC Connection Flow

```
Step 1: SIGNALING (qua server)
  Alice ──► Server ──► Bob
  "Alice muốn call Bob"

Step 2: SDP EXCHANGE (Session Description Protocol)
  Alice tạo "offer": {
    codec: VP8, H264
    resolution: 1280x720
    my ICE candidates: [...]
  }
  Alice → Server → Bob
  Bob tạo "answer" → Server → Alice

Step 3: ICE CANDIDATE EXCHANGE (qua STUN/TURN)
  STUN server: "Alice, your public IP is 1.2.3.4:5678"
  Alice → Server → Bob: "Try to reach me at 1.2.3.4:5678"
  Bob → Server → Alice: "Try to reach me at 5.6.7.8:9012"

Step 4: P2P CONNECTION ESTABLISHED
  Alice ◄────────────────────────────► Bob
       (direct, no server needed!)
  
  If direct fails (strict NAT): via TURN relay server
  Alice → TURN server → Bob

Step 5: MEDIA STREAMING
  Audio/Video encoded → RTP/SRTP → Direct P2P (or TURN)
  Encrypted end-to-end (DTLS-SRTP)
```

## 3.3 WebRTC Browser API

```javascript
// 1. Get user media:
const localStream = await navigator.mediaDevices.getUserMedia({
  video: { width: 1280, height: 720 },
  audio: true,
});
localVideoElement.srcObject = localStream;

// 2. Create PeerConnection:
const config = {
  iceServers: [
    { urls: "stun:stun.google.com:19302" },          // STUN server
    {
      urls: "turn:turn.example.com:3478",             // TURN relay (fallback)
      username: "user",
      credential: "pass",
    },
  ],
};

const pc = new RTCPeerConnection(config);

// Add local stream:
localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

// Receive remote stream:
pc.ontrack = (event) => {
  remoteVideoElement.srcObject = event.streams[0];
};

// ICE candidates: send to remote via signaling
pc.onicecandidate = (event) => {
  if (event.candidate) {
    signalingServer.send({ type: "ice-candidate", candidate: event.candidate });
  }
};

// 3. Create and send offer (caller side):
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
signalingServer.send({ type: "offer", sdp: offer });

// 4. Answer (callee side):
signalingServer.on("offer", async (offer) => {
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  signalingServer.send({ type: "answer", sdp: answer });
});

// 5. Handle ICE candidates:
signalingServer.on("ice-candidate", async (candidate) => {
  await pc.addIceCandidate(candidate);
});

// Data channel (P2P data, no audio/video):
const dataChannel = pc.createDataChannel("chat");
dataChannel.onmessage = (e) => console.log("P2P message:", e.data);
dataChannel.send("Hello P2P!");
```

---

# 4. Long Polling & Short Polling

## 4.1 Comparison — Khi Nào Dùng?

```
SHORT POLLING: Client hỏi định kỳ
  setInterval(() => fetch("/api/notifications"), 5000);
  → 5s latency, wasteful (nhiều empty responses)
  → Dùng khi: đơn giản nhất, latency không quan trọng, server không support SSE/WS

LONG POLLING: Server giữ request đến khi có data
  Client → Request → Server giữ → có data → Response
  Client nhận → ngay lập tức gửi request mới
  
  async function longPoll() {
    const response = await fetch("/api/poll?lastEventId=" + lastId);
    const data = await response.json();
    processData(data);
    longPoll();  // immediately poll again
  }
  
  Server:
  GET /api/poll → server holds response
  → 30s timeout: return empty (client re-polls)
  → Event arrives: return immediately
  
  → ~0s latency, still HTTP connection overhead
  → Dùng khi: không support SSE/WebSocket, need simple server push

SSE: Server push qua persistent HTTP connection
  → Native HTTP, auto-reconnect, text-only
  → Dùng khi: server-to-client push, simple, no binary

WEBSOCKET: Full-duplex persistent connection
  → Bidirectional, low latency, binary support
  → Dùng khi: chat, collaboration, gaming

SUMMARY:
  Simplest: Short polling
  Better: Long polling (dùng khi không có SSE/WS support)
  Server push: SSE (preferred over long polling)
  Bidirectional: WebSocket
  P2P: WebRTC
```

---

# 5. Event-Driven Architecture

## 5.1 Tại Sao Event-Driven?

```
Synchronous call chain (REST/gRPC):
  Order Service → calls → Payment Service → calls → Email Service
                                           ↓
                                    (waits for response)
  
  Vấn đề:
    Temporal coupling: Order Service phải chờ Email Service
    Brittle: Email Service down → Order creation fails!
    Scaling: tất cả scale cùng lúc

Event-driven (async messaging):
  Order Service → publishes "OrderCreated" event → Message Broker
  Payment Service subscribes → processes when ready
  Email Service subscribes → sends email when ready
  Inventory Service subscribes → decrements stock
  
  Benefits:
    Temporal decoupling: Order Service không chờ
    Resilient: consumers fail → events queued, replay later
    Scalable: scale consumers independently
    Auditable: event log = history of everything that happened
```

## 5.2 Event Types & Patterns

```
DOMAIN EVENT: "Điều gì đó đã xảy ra" (past tense)
  OrderCreated, UserRegistered, PaymentSucceeded

COMMAND: "Làm điều này" (imperative)
  CreateOrder, ProcessPayment (point-to-point, not broadcast)

QUERY: "Cho tôi biết" (questions)
  Usually synchronous (REST/gRPC)

EVENT PATTERNS:

1. EVENT NOTIFICATION:
   "Something happened, interested parties can react"
   Minimal payload (just ID or key info)
   Consumer fetches details if needed
   { type: "UserCreated", userId: "123" }
   → Email service calls GET /users/123 for full data

2. EVENT-CARRIED STATE TRANSFER:
   Event contains full state, consumer doesn't need to fetch back
   { type: "UserUpdated", user: { id, name, email, ... } }
   → Consumer can update its own data store without API call
   → Higher throughput, but larger events

3. EVENT SOURCING:
   Store ALL events (not current state)
   Current state = replay all events from beginning
   → Complete audit trail
   → Time-travel (rebuild state at any point in time)
   → Complex but powerful

OUTBOX PATTERN (prevent dual-write problem):
  Problem: save to DB + publish to Kafka → what if Kafka fails after DB save?
  → Inconsistency!
  
  Solution:
  @Transactional
  void createOrder(Order order) {
    orderRepo.save(order);                    // DB write
    outboxRepo.save(new OutboxEvent(          // SAME TRANSACTION!
      "OrderCreated", toJson(order)));
  }
  
  Separate Outbox Processor:
  → polls outbox table
  → publishes to Kafka
  → marks as published
  → Eventually consistent, guaranteed delivery
```

## 5.3 Kafka Basics (Cho Context)

```
Kafka concepts:
  Topic: named stream of events (VD: "orders", "payments")
  Partition: topic split into N partitions for parallelism
  Producer: publishes events
  Consumer Group: consumers sharing topic load
  Offset: position in partition (consumers track their offset)

Producer (Spring Boot):
@Service
public class OrderEventPublisher {
    @Autowired KafkaTemplate<String, String> kafkaTemplate;

    public void publishOrderCreated(Order order) {
        kafkaTemplate.send("orders", order.getId(),
            objectMapper.writeValueAsString(new OrderCreatedEvent(order)));
    }
}

Consumer:
@Service
public class EmailConsumer {
    @KafkaListener(topics = "orders", groupId = "email-service")
    public void handleOrderCreated(String message) {
        OrderCreatedEvent event = objectMapper.readValue(message, OrderCreatedEvent.class);
        emailService.sendOrderConfirmation(event.getUserEmail(), event.getOrderId());
    }
}

At-least-once delivery: events may be processed MULTIPLE TIMES
→ Make consumers IDEMPOTENT (same event processed twice → same result)
→ Use event ID to deduplicate: if (alreadyProcessed(event.id)) return;
```

---

# 6. Micro Frontend — Tại Sao Ra Đời?

## 6.1 Monolithic Frontend Problem

```
Typical large app: 1 big React/Angular app
  Checkout team ──────┐
  Product team ───────┤── Same codebase → Big Bundle → Long builds
  User profile team ──┤
  Search team ─────────┘

Problems với monolithic frontend:
  Slow builds: team A changes 1 file → build toàn bộ app (5-10 mins)
  Merge conflicts: 10 teams → same repo → conflict every day
  Technology lock-in: decided React 5 years ago → stuck with React
  Independent deployment impossible: all teams must release together
  Scaling teams: 10 teams, 100 developers → coordination nightmare
  Testing: changing small feature → run full test suite

Compare với backend microservices:
  Backend: Order Service, Payment Service, User Service → separate deploys
  Frontend: 1 app containing order, payment, user UI → monolith
  → Inconsistency! Micro Frontend extends microservices to frontend.
```

## 6.2 Micro Frontend Là Gì?

```
Micro Frontend = chia frontend thành nhiều smaller apps
  mỗi team own end-to-end (from DB to UI) của feature

Team A: Order Management
  → Order Service (Spring Boot)
  → Order Database
  → Order UI (React app)  ← Micro Frontend!

Team B: Product Catalog
  → Product Service (Spring Boot)
  → Product Database
  → Product UI (Vue app)   ← Micro Frontend!

Shell App (App Shell / Container):
  → Navigation, layout, shared auth
  → Composes Team A + B + C UI together
  → User sees 1 unified app!

Core principles:
  1. Each team deploys independently (no coordination)
  2. Teams choose their own tech (React, Vue, Angular, web components)
  3. Teams isolated (CSS, JS not leaking between apps)
  4. Communication via well-defined contracts (events, shared state)
```

---

# 7. Module Federation — Cơ Chế Bên Trong

## 7.1 Module Federation Là Gì?

```
Webpack 5 Module Federation: load JavaScript modules từ REMOTE app vào CURRENT app
at RUNTIME (không phải build time).

BEFORE Module Federation:
  Shell App builds với OrderUI, ProductUI bundled together
  → OrderUI updates → rebuild Shell → redeploy Shell

WITH Module Federation:
  Shell App: load OrderUI FROM order-team.example.com at runtime
  OrderUI deploys independently → Shell picks up new version automatically!
  
  runtime: shell.js fetches order-team.example.com/remoteEntry.js
           loads component from remote
           renders in shell
           
  No rebuild of shell needed!
```

## 7.2 Webpack Module Federation Config

```javascript
// ORDER APP (Remote) — webpack.config.js:
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "orderApp",           // remote name

      filename: "remoteEntry.js", // entry point file (fetched by shell)

      exposes: {
        // What this remote exposes to others:
        "./OrderList": "./src/components/OrderList",
        "./OrderDetail": "./src/components/OrderDetail",
        "./useOrderStore": "./src/stores/useOrderStore",
      },

      shared: {
        // Share React with host (don't load 2 copies!)
        react: { singleton: true, requiredVersion: "^18.0.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
        // singleton: true → crash if version mismatch
      },
    }),
  ],
};

// SHELL APP (Host) — webpack.config.js:
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "shell",

      remotes: {
        // Map name → remote URL:
        orderApp: "orderApp@https://orders.example.com/remoteEntry.js",
        productApp: "productApp@https://products.example.com/remoteEntry.js",
        // Dynamic remotes (set at runtime from config API):
        // userApp: dynamicRemoteUrl
      },

      shared: {
        react: { singleton: true, requiredVersion: "^18.0.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
      },
    }),
  ],
};
```

## 7.3 Lazy Loading Remote Components

```javascript
// Shell App — React component:
import React, { Suspense, lazy } from "react";

// Lazy load remote component:
const OrderList = lazy(() => import("orderApp/OrderList"));
const ProductDetail = lazy(() => import("productApp/ProductDetail"));

function App() {
  return (
    <Router>
      <Nav />
      <Routes>
        <Route
          path="/orders"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ErrorBoundary fallback={<ErrorPage />}>
                <OrderList />  {/* loaded from orders.example.com! */}
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/products/:id"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ProductDetail />  {/* loaded from products.example.com! */}
            </Suspense>
          }
        />
      </Routes>
    </Router>
  );
}
```

## 7.4 Dynamic Remotes — Load từ Config

```javascript
// Load remote URLs từ server (A/B testing, feature flags, versioning):
async function loadRemoteModule(remoteName, moduleUrl, exposedModule) {
  // 1. Load remoteEntry.js dynamically:
  if (!window[remoteName]) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = moduleUrl;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 2. Initialize container:
  await __webpack_init_sharing__("default");
  const container = window[remoteName];
  await container.init(__webpack_share_scopes__.default);

  // 3. Get exposed module:
  const factory = await container.get(exposedModule);
  return factory();
}

// Usage:
const { default: OrderList } = await loadRemoteModule(
  "orderApp",
  "https://orders.example.com/remoteEntry.js",
  "./OrderList"
);
```

## 7.5 Module Federation Cơ Chế Bên Trong

```
remoteEntry.js là gì?
  Small JS file exposing:
  - container.init(sharedScope): initialize shared modules
  - container.get(module): return factory for specific module

Khi Shell load OrderList:
  1. Browser fetches orders.example.com/remoteEntry.js
  2. remoteEntry.js registers window.orderApp container
  3. Shell calls orderApp.init(shell's shared scope)
     → negotiate shared modules (React, etc.)
     → nếu đã có compatible React → KHÔNG load React lần 2!
     → nếu version mismatch → load separate copy
  4. Shell calls orderApp.get("./OrderList")
     → orderApp dynamically fetches order-list.chunk.js
     → returns OrderList component
  5. Shell renders OrderList in Suspense

SHARED MODULES:
  Without sharing: Shell(React 18) + OrderApp(React 18) = 2 copies React!
  With sharing + singleton: only 1 React instance
  
  singleton: true → if version mismatch → warning/error
  strictVersion: true → throw error on version mismatch
  requiredVersion: "^18.0.0" → accept any 18.x.x
```

---

# 8. Micro FE Patterns & Integration Approaches

## 8.1 Build-time Integration

```
NOT true Micro Frontend — team A's code bundled into shell at build time.

npm package:
  Order team publishes: @company/order-ui npm package
  Shell: import { OrderList } from "@company/order-ui"

Problems:
  ❌ Deployment coupling: shell rebuild required when OrderList changes
  ❌ Version management: which version to use? When to upgrade?
  ❌ Shared dependencies duplicated if versions differ

Use when: internal design system, shared components library
NOT for: independent team deployments
```

## 8.2 Runtime Integration via Module Federation (Recommended)

```
Covered in Section 7. Each team deploys independently.
Shell picks up new versions automatically.

Best for: same-framework teams (all React, or all Vue)
Challenge: cross-framework (React MFE in Angular shell)
```

## 8.3 iFrame Integration

```
Simplest isolation — each MFE in its own iframe.

<iframe src="https://orders.example.com" />
<iframe src="https://products.example.com" />

Benefits:
  ✅ Perfect isolation (no CSS/JS leakage)
  ✅ Independent deployment
  ✅ Any framework

Drawbacks:
  ❌ UX challenges (scroll, focus, full-screen modals cross iframe)
  ❌ Performance (each iframe = full browser context)
  ❌ SEO (content not crawlable)
  ❌ Communication via postMessage (complex)

Use when: legacy integration, 3rd party widgets, strong isolation needed
```

## 8.4 Web Components Integration

```javascript
// Framework-agnostic! Works in any shell (React, Vue, Angular, plain HTML)

// Order team (using Lit):
import { LitElement, html } from "lit";

@customElement("order-list")
class OrderList extends LitElement {
  @property({ type: String }) userId = "";

  render() {
    return html`<div>Orders for ${this.userId}</div>`;
  }
}

// Shell (plain HTML, React, Vue — anything!):
// HTML: <order-list userId="user_123"></order-list>
// React:
function Shell() {
  return (
    <div>
      <order-list userId={currentUser.id} />
    </div>
  );
}

// Benefits:
// ✅ Framework-agnostic (each team chooses their framework)
// ✅ Native browser standard (no extra bundler config)
// ✅ Good isolation (Shadow DOM for CSS)

// Challenges:
// ❌ React → Web Component attribute passing (only strings/primitives)
// ❌ TypeScript support varies
// ❌ SSR complexity
```

---

# 9. Micro FE Communication

## 9.1 Custom Events (Browser Native)

```javascript
// Publisher MFE (Order App):
function orderShipped(orderId) {
  window.dispatchEvent(new CustomEvent("mfe:order:shipped", {
    detail: { orderId, timestamp: Date.now() },
    bubbles: true,
  }));
}

// Subscriber MFE (Notification App):
useEffect(() => {
  const handler = (event) => {
    showNotification(`Order ${event.detail.orderId} shipped!`);
  };
  window.addEventListener("mfe:order:shipped", handler);
  return () => window.removeEventListener("mfe:order:shipped", handler);
}, []);

// Shell composes:
<OrderApp />       // fires window events
<NotificationApp /> // listens to window events
// No direct coupling! Event-driven.
```

## 9.2 Shared Event Bus

```javascript
// Create event bus (in shared library or shell):
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);  // unsubscribe function
  }

  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(h => h(data));
  }
}

// Expose via Module Federation or window:
window.mfeEventBus = new EventBus();

// MFE A (sender):
window.mfeEventBus.emit("user:selected", { userId: "123" });

// MFE B (receiver):
useEffect(() => {
  const unsub = window.mfeEventBus.on("user:selected", ({ userId }) => {
    loadUserData(userId);
  });
  return unsub;
}, []);
```

## 9.3 URL/Routing Communication

```javascript
// Đơn giản nhất: URL là "shared state"
// MFE A navigates: history.pushState({}, "", "/orders/123")
// MFE B reads: const orderId = window.location.pathname.split("/")[2]

// Shell router delegates to MFEs:
// URL: /orders/123 → Shell renders OrderApp with orderId=123
// URL: /products/456 → Shell renders ProductApp with productId=456

// Query params for communication:
// /dashboard?selectedUser=user_123
// Each MFE reads query params it cares about
```

---

# 10. Routing & Navigation

## 10.1 Shell Routing Strategy

```javascript
// Shell owns top-level routes:
// /orders/* → Order MFE
// /products/* → Product MFE
// /users/* → User MFE

// Shell (React Router):
function Shell() {
  return (
    <Router>
      <GlobalNav />
      <Routes>
        <Route path="/orders/*" element={<OrderMFE />} />
        <Route path="/products/*" element={<ProductMFE />} />
        <Route path="/users/*" element={<UserMFE />} />
      </Routes>
    </Router>
  );
}

// Order MFE handles its own sub-routes:
// /orders → OrderList
// /orders/:id → OrderDetail
// /orders/new → CreateOrder

function OrderMFE() {
  return (
    <Routes>
      <Route index element={<OrderList />} />
      <Route path=":id" element={<OrderDetail />} />
      <Route path="new" element={<CreateOrder />} />
    </Routes>
  );
}
```

## 10.2 Memory Router cho Isolated MFEs

```javascript
// Khi MFE cần routing nhưng không muốn ảnh hưởng browser URL:
import { MemoryRouter } from "react-router-dom";

function OrderMFE({ initialPath = "/orders" }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
      </Routes>
    </MemoryRouter>
  );
}
// Routing internal to MFE, doesn't affect browser URL
// Shell controls the real URL
```

---

# 11. Shared State & Dependencies

## 11.1 Shared Auth State

```javascript
// Auth state: shell handles auth, MFEs consume
// Pattern: shell stores token, MFEs receive via props or custom event

// Shell:
function Shell() {
  const [authState, setAuthState] = useState({
    user: null, token: null
  });

  return (
    <>
      <AuthProvider value={authState}>
        <OrderMFE user={authState.user} />
      </AuthProvider>
    </>
  );
}

// Better: expose auth via Module Federation shared module
// auth-utils (shared library):
export const getToken = () => localStorage.getItem("authToken");
export const getUser = () => JSON.parse(localStorage.getItem("currentUser"));
export const onAuthChange = (handler) => {
  window.addEventListener("auth:changed", handler);
  return () => window.removeEventListener("auth:changed", handler);
};
```

## 11.2 Shared Dependencies Problem

```
Shared deps (React, ReactDOM):
  Both shell và OrderMFE bundle React separately → 2 copies → waste

Module Federation shared config:
  shared: {
    react: { singleton: true, requiredVersion: "^18.0.0" }
  }
  → Only 1 React instance, shared between shell + all MFEs

Version conflict scenario:
  Shell: React 18.2.0
  OrderMFE: React 18.0.0
  singleton: true → Error! Cannot have 2 versions
  
  Solutions:
  1. All teams upgrade to same version (coordination needed)
  2. requiredVersion: ">=18.0.0" (looser requirement)
  3. Each MFE bundles its own React (no sharing, larger bundles)
  4. Shell provides the React version, MFEs accept what's provided
```

---

# 12. Deployment & CI/CD

## 12.1 Independent Deployment

```
Each MFE team deploys independently:

Team A merges code → triggers CI/CD:
  1. Build OrderApp → order-app.js + remoteEntry.js
  2. Run tests (unit + integration + visual)
  3. Deploy to orders.example.com/remoteEntry.js
  4. Shell app picks up new version AUTOMATICALLY!
     (Shell fetches remoteEntry.js on each user visit)

No communication needed with Shell team.
No coordination with Product team.

VERSIONING STRATEGY:
  Current: https://orders.example.com/remoteEntry.js
  Versioned: https://orders.example.com/v1.2.3/remoteEntry.js
  
  Current: always latest → zero-downtime deploy
  Versioned: shell pins specific version → more control but coordination

CANARY DEPLOYMENT:
  10% users get new OrderMFE → 90% get old
  Monitor metrics
  Gradually increase if healthy
```

## 12.2 Content Security Policy & CORS

```
MFE loaded from different origins → CORS config needed!

Order team's server must allow:
  Access-Control-Allow-Origin: https://shell.example.com
  (for remoteEntry.js and chunks)

Shell CSP:
  Content-Security-Policy:
    script-src 'self'
      https://orders.example.com
      https://products.example.com;

Không config CORS/CSP → browser blocks MFE loading!
```

---

# 13. Challenges & Trade-offs

## 13.1 Micro Frontend Trade-offs

```
BENEFITS:
  ✅ Independent deployment (teams move fast)
  ✅ Technology flexibility (each team chooses framework)
  ✅ Isolated failures (OrderMFE fails → ProductMFE still works)
  ✅ Smaller codebases (easier to understand, maintain)
  ✅ Independent scaling of build pipelines

CHALLENGES:
  ❌ Operational complexity: deploy/monitor N apps instead of 1
  ❌ Payload size: potential duplication of shared libs
  ❌ UX consistency: each team might create different UI patterns
  ❌ End-to-end testing: testing across MFE boundaries is hard
  ❌ Cross-MFE communication: more complex than in-app
  ❌ Performance: more network requests, coordination overhead
  ❌ SEO: harder with client-side micro frontends

WHEN TO USE MICRO FRONTEND:
  ✅ Large org with multiple teams (>10 FE developers)
  ✅ Multiple teams need independent deployment
  ✅ Different parts have very different tech needs
  ✅ Gradual migration (strangler fig pattern)

WHEN NOT TO USE:
  ❌ Small team (1-5 developers)
  ❌ Simple application
  ❌ Team doesn't have operational maturity
  ❌ Tight coupling between features (shared state everywhere)

"Micro Frontends are not about technology. They're about team organization."
— Luca Mezzalira
```

## 13.2 Decision Matrix

```
┌──────────────────┬─────────────────┬──────────────────┬───────────────┐
│ Communication    │ Use Case        │ Latency          │ Complexity    │
├──────────────────┼─────────────────┼──────────────────┼───────────────┤
│ REST/HTTP        │ CRUD, public API │ 50-200ms         │ Low           │
│ GraphQL          │ Flexible client  │ 50-200ms         │ Medium        │
│ gRPC             │ Internal microS  │ 1-20ms           │ High          │
│ WebSocket        │ Realtime bidir   │ <10ms            │ Medium        │
│ SSE              │ Server push      │ <50ms            │ Low           │
│ WebRTC           │ P2P media/data   │ <5ms             │ Very High     │
│ Long Polling     │ Fallback push    │ <5s              │ Low           │
│ Kafka/Queue      │ Async events     │ 10ms-1s          │ High          │
├──────────────────┼─────────────────┼──────────────────┼───────────────┤
│ Integration      │ When to Use     │ Isolation        │ Complexity    │
├──────────────────┼─────────────────┼──────────────────┼───────────────┤
│ Module Federation│ Same framework   │ Medium           │ Medium        │
│ Web Components   │ Cross-framework  │ Good             │ Medium        │
│ iFrame           │ Max isolation    │ Perfect          │ Low (but UX!) │
│ npm package      │ Shared libs only │ None (same bundle│ Low           │
└──────────────────┴─────────────────┴──────────────────┴───────────────┘
```

## 📎 Official Documentation Links

| Topic | Link |
|---|---|
| WebSocket (MDN) | <https://developer.mozilla.org/en-US/docs/Web/API/WebSocket> |
| SSE (MDN) | <https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events> |
| Spring WebSocket | <https://docs.spring.io/spring-framework/reference/web/websocket.html> |
| WebRTC (MDN) | <https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API> |
| Module Federation | <https://webpack.js.org/concepts/module-federation> |
| Module Federation Examples | <https://github.com/module-federation/module-federation-examples> |
| Micro Frontends Book | <https://micro-frontends.org> |
| Luca Mezzalira (Micro FE) | <https://lucamezzalira.com> |
| Vite Module Federation | <https://github.com/originjs/vite-plugin-federation> |
| Single-SPA (Micro FE framework) | <https://single-spa.js.org> |
