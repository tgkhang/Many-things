# 🌐 Computer Networking — Complete Deep Dive
> TCP/IP, HTTP/HTTPS, UDP, OSI Model, Subnetting, DNS, TLS, Routing và hơn nữa

---

## 📚 Table of Contents

1. [OSI Model & TCP/IP Stack](#1-osi-model--tcpip-stack)
2. [IP Addressing](#2-ip-addressing)
3. [Subnetting](#3-subnetting)
4. [Routing](#4-routing)
5. [UDP — User Datagram Protocol](#5-udp--user-datagram-protocol)
6. [TCP — Transmission Control Protocol](#6-tcp--transmission-control-protocol)
7. [DNS — Domain Name System](#7-dns--domain-name-system)
8. [TLS/SSL — Transport Layer Security](#8-tlsssl--transport-layer-security)
9. [HTTP — HyperText Transfer Protocol](#9-http--hypertext-transfer-protocol)
10. [HTTPS](#10-https)
11. [WebSocket & Long Polling](#11-websocket--long-polling)
12. [Load Balancer & Reverse Proxy](#12-load-balancer--reverse-proxy)
13. [Network Security](#13-network-security)

---

# 1. OSI Model & TCP/IP Stack

## 1.1 OSI Model — 7 Layers

```
OSI Model                  Nhiệm vụ                        Ví dụ
─────────────────────────────────────────────────────────────────────
7. Application  ←→  Giao tiếp với user/app              HTTP, FTP, SMTP, DNS
6. Presentation ←→  Encode, encrypt, compress           TLS, JPEG, ASCII, UTF-8
5. Session      ←→  Manage sessions/connections         NetBIOS, RPC, PPTP
4. Transport    ←→  End-to-end delivery, reliability    TCP, UDP
3. Network      ←→  Routing giữa các networks           IP, ICMP, ARP, OSPF
2. Data Link    ←→  Node-to-node, MAC addressing        Ethernet, Wi-Fi, PPP
1. Physical     ←→  Bits → signals (electrical, optical) Cables, Wi-Fi radio, fiber

"Please Do Not Throw Sausage Pizza Away" — mnemonic (bottom to top)
"All People Seem To Need Data Processing" — top to bottom
```

## 1.2 TCP/IP Stack (thực tế dùng trong Internet)

```
TCP/IP Model         Tương đương OSI          Protocols
──────────────────────────────────────────────────────────────────
Application    ←→   Layer 5, 6, 7         HTTP, HTTPS, FTP, SMTP,
                                           DNS, SSH, WebSocket
Transport      ←→   Layer 4               TCP, UDP, QUIC
Internet       ←→   Layer 3               IP (v4/v6), ICMP, IGMP
Network Access ←→   Layer 1, 2            Ethernet, Wi-Fi, ARP
```

## 1.3 Encapsulation — Dữ liệu đi qua các tầng

```
Sender (Application → Physical):

[ HTTP Data "GET /index.html" ]                    Layer 7
         ↓  Transport adds header
[ TCP Header | HTTP Data ]                         Layer 4: Segment
         ↓  Network adds header
[ IP Header | TCP Header | HTTP Data ]             Layer 3: Packet
         ↓  Data Link adds header + trailer
[ ETH Header | IP Header | TCP Header | Data | ETH Trailer ] Layer 2: Frame
         ↓  Physical converts to bits
01001000 01000101 01000001 01000100 ...             Layer 1: Bits → Signals

Receiver (Physical → Application):
01001000...
→ strip ETH header/trailer → IP Packet
→ strip IP header → TCP Segment
→ strip TCP header → HTTP Data
→ Application reads "GET /index.html"
```

## 1.4 Key Protocols Per Layer

```
LAYER 7 — APPLICATION
  HTTP/1.1, HTTP/2, HTTP/3   Web browsing
  HTTPS                       Secure web
  FTP / SFTP                  File transfer
  SMTP / IMAP / POP3          Email
  DNS                         Domain resolution
  SSH                         Secure shell
  WebSocket                   Bidirectional real-time
  SNMP                        Network management
  DHCP                        IP auto-assignment

LAYER 4 — TRANSPORT
  TCP    Reliable, ordered, connection-oriented
  UDP    Fast, unreliable, connectionless
  QUIC   Modern (HTTP/3), UDP-based but reliable

LAYER 3 — NETWORK
  IPv4   32-bit addressing
  IPv6   128-bit addressing
  ICMP   Error messages (ping uses this)
  ARP    IP → MAC address resolution
  BGP    Border Gateway Protocol (Internet routing)
  OSPF   Open Shortest Path First (interior routing)

LAYER 2 — DATA LINK
  Ethernet (IEEE 802.3)
  Wi-Fi (IEEE 802.11 a/b/g/n/ac/ax)
  PPP    Point-to-Point Protocol
  VLAN   Virtual LAN (802.1Q)

LAYER 1 — PHYSICAL
  Twisted pair cable (Cat5e, Cat6, Cat6a)
  Fiber optic (single-mode, multi-mode)
  Wi-Fi radio signals
  Coaxial cable
```

---

# 2. IP Addressing

> 📖 https://www.rfc-editor.org/rfc/rfc791 (IPv4)
> 📖 https://www.rfc-editor.org/rfc/rfc8200 (IPv6)

## 2.1 IPv4

```
IPv4 = 32-bit address, viết dưới dạng 4 octets (8 bits mỗi cái)

192  .  168  .   1   .  100
11000000 10101000 00000001 01100100

Mỗi octet: 0 - 255
Total addresses: 2^32 = ~4.3 billion

──────────────────────────────────────────────
IP Address = Network Part + Host Part
──────────────────────────────────────────────

Subnet Mask xác định phần nào là Network, phần nào là Host:
IP:   192.168.1.100   = 11000000.10101000.00000001.01100100
Mask: 255.255.255.0   = 11111111.11111111.11111111.00000000
                                                    ↑ host part
Network: 192.168.1.0
Host:    100
```

## 2.2 IP Address Classes (truyền thống, CIDR thay thế rồi)

```
Class A:  1.0.0.0   – 126.255.255.255   /8   127 networks × 16M hosts
Class B:  128.0.0.0 – 191.255.255.255   /16  16384 networks × 65534 hosts
Class C:  192.0.0.0 – 223.255.255.255   /24  2M networks × 254 hosts
Class D:  224.0.0.0 – 239.255.255.255        Multicast
Class E:  240.0.0.0 – 255.255.255.255        Reserved/Research

Special addresses:
127.0.0.1           Loopback (localhost) — stays on this machine
0.0.0.0             Unspecified / "any" address
255.255.255.255     Broadcast (all hosts on local network)
169.254.x.x         Link-local (APIPA — when DHCP fails)
```

## 2.3 Private IP Ranges (RFC 1918)

```
Range                       CIDR          Usage
──────────────────────────────────────────────────────────────────
10.0.0.0 – 10.255.255.255   10.0.0.0/8    Large enterprise, cloud VPC
172.16.0.0 – 172.31.255.255 172.16.0.0/12 Medium networks
192.168.0.0 – 192.168.255.255 192.168.0.0/16 Home/small office

Private IPs KHÔNG route trên Internet → dùng NAT để ra ngoài

NAT (Network Address Translation):
Private: 192.168.1.100:54321 ──→ NAT ──→ Public: 203.1.2.3:54321
         (many devices)          Router    (1 IP, port mapping)
```

## 2.4 IPv6

```
IPv6 = 128-bit address, viết dưới dạng 8 groups × 16 bits hex

Full:    2001:0db8:0000:0000:0000:ff00:0042:8329
Short:   2001:db8::ff00:42:8329     (leading zeros dropped, :: = consecutive zeros)

Total:   2^128 = 3.4 × 10^38 addresses
→ Enough for 670 quadrillion addresses per mm² of Earth's surface!

Special:
::1              Loopback (like 127.0.0.1 in IPv4)
::               Unspecified
fe80::/10        Link-local (auto-configured)
fc00::/7         Unique local (like private in IPv4)
ff00::/8         Multicast
2001:db8::/32    Documentation/examples

IPv6 Header:
- Simpler than IPv4 (fixed 40 bytes)
- No checksum (handled by upper layers)
- No fragmentation at routers (done at source only)
- Built-in IPSec support
- Flow label for QoS

Dual Stack: server runs IPv4 AND IPv6 simultaneously
Tunneling: IPv6 packet wrapped in IPv4 for transit
```

---

# 3. Subnetting

## 3.1 CIDR Notation

```
CIDR (Classless Inter-Domain Routing)
Format: IP/prefix_length
192.168.1.0/24

/24 means: first 24 bits = network, last 8 bits = host
  11111111.11111111.11111111.00000000
  255      .255     .255     .0

Number of hosts = 2^(32 - prefix) - 2
  -2 because: network address (all host bits 0) + broadcast (all host bits 1)

/24 → 2^8 - 2 = 254 hosts
/25 → 2^7 - 2 = 126 hosts
/26 → 2^6 - 2 = 62 hosts
/30 → 2^2 - 2 = 2 hosts  (point-to-point links)
/32 → 2^0 - 2 = 0 hosts  (single host — loopback, route to one IP)
```

## 3.2 Subnet Calculation — Step by Step

```
Given: 192.168.10.0/24 → chia thành 4 equal subnets

Step 1: Cần bao nhiêu bits để tạo 4 subnets?
  2^n >= 4 → n = 2 bits
  New prefix = 24 + 2 = /26

Step 2: Subnet mask mới
  /26 = 11111111.11111111.11111111.11000000 = 255.255.255.192

Step 3: Block size = 2^(32-26) = 2^6 = 64

Step 4: List subnets
  Subnet 1: 192.168.10.0/26
    Network:   192.168.10.0
    First host: 192.168.10.1
    Last host:  192.168.10.62
    Broadcast:  192.168.10.63
    Hosts: 62

  Subnet 2: 192.168.10.64/26
    Network:   192.168.10.64
    First host: 192.168.10.65
    Last host:  192.168.10.126
    Broadcast:  192.168.10.127

  Subnet 3: 192.168.10.128/26
    Network:   192.168.10.128
    First host: 192.168.10.129
    Last host:  192.168.10.190
    Broadcast:  192.168.10.191

  Subnet 4: 192.168.10.192/26
    Network:   192.168.10.192
    First host: 192.168.10.193
    Last host:  192.168.10.254
    Broadcast:  192.168.10.255
```

## 3.3 CIDR Quick Reference Table

```
Prefix  Mask              Hosts    Subnets from /24
──────────────────────────────────────────────────
/24     255.255.255.0     254      1
/25     255.255.255.128   126      2
/26     255.255.255.192   62       4
/27     255.255.255.224   30       8
/28     255.255.255.240   14       16
/29     255.255.255.248   6        32
/30     255.255.255.252   2        64
/32     255.255.255.255   0 (host) —

Prefix  Mask        Hosts
──────────────────────────────────────
/8      255.0.0.0   16,777,214
/16     255.255.0.0 65,534
/20     255.255.240.0   4,094
/22     255.255.252.0   1,022
/23     255.255.254.0   510
/24     255.255.255.0   254
```

## 3.4 Tìm Subnet của một IP

```
Ví dụ: IP = 172.16.45.200/20

Step 1: Prefix /20 → mask = 255.255.240.0
  11111111.11111111.11110000.00000000

Step 2: AND IP với mask
  172.16.45.200  = 10101100.00010000.00101101.11001000
  255.255.240.0  = 11111111.11111111.11110000.00000000
  AND result     = 10101100.00010000.00100000.00000000
                 = 172.16.32.0

Step 3: Network address = 172.16.32.0/20
  Hosts: 2^12 - 2 = 4094
  Broadcast = 172.16.47.255  (last address: 32 + 16 - 1 = 47)
  Range: 172.16.32.1 – 172.16.47.254

Cách nhanh: block size = 256 - 240 = 16
  Starting points trong octet 3: 0, 16, 32, 48...
  45 nằm trong khoảng [32, 48) → network = 172.16.32.0
```

## 3.5 VLSM — Variable Length Subnet Masking

```
Chia subnet có kích thước khác nhau từ 1 block
Efficient hơn — không lãng phí IPs

Ví dụ: Công ty cần:
  - Network A: 100 hosts
  - Network B: 50 hosts
  - Network C: 25 hosts
  - WAN link 1: 2 hosts
  - WAN link 2: 2 hosts

Starting block: 192.168.1.0/24

Sắp xếp lớn nhất trước:

Network A (cần 100 hosts → /25 = 126 hosts):
  192.168.1.0/25  (192.168.1.0 - 192.168.1.127)

Network B (cần 50 hosts → /26 = 62 hosts):
  192.168.1.128/26 (192.168.1.128 - 192.168.1.191)

Network C (cần 25 hosts → /27 = 30 hosts):
  192.168.1.192/27 (192.168.1.192 - 192.168.1.223)

WAN link 1 (2 hosts → /30):
  192.168.1.224/30 (192.168.1.224 - 192.168.1.227)

WAN link 2 (2 hosts → /30):
  192.168.1.228/30 (192.168.1.228 - 192.168.1.231)

Remaining: 192.168.1.232 - 192.168.1.255 (for future use)
```

---

# 4. Routing

## 4.1 How Routing Works

```
Router = thiết bị chuyển tiếp packets giữa các networks
Mỗi router có Routing Table:

Destination       Mask              Gateway         Interface  Metric
0.0.0.0          0.0.0.0           203.1.2.1       eth0       1    ← default route
192.168.1.0      255.255.255.0     0.0.0.0         eth1       1    ← directly connected
10.0.0.0         255.255.0.0       192.168.1.254   eth1       2    ← static/dynamic route
172.16.0.0       255.255.240.0     10.0.0.1        eth2       10

Khi nhận packet đến 10.5.5.100:
1. Tìm longest prefix match trong routing table
2. 10.0.0.0/16 match (10.5.5.100 trong range 10.0.0.0-10.0.255.255)
3. Forward ra interface eth2, next-hop 10.0.0.1
4. Cập nhật Ethernet header với MAC của next-hop

Longest Prefix Match = rule quan trọng nhất:
  Packet đến 192.168.1.50:
    192.168.1.0/24 và 0.0.0.0/0 đều match
    /24 > /0 → chọn /24 (more specific)
```

## 4.2 Routing Protocols

```
STATIC ROUTING:
  Admin cấu hình tay từng route
  Ưu: đơn giản, dự đoán được, không overhead
  Nhược: không tự thích nghi khi topology thay đổi
  Dùng: mạng nhỏ, default route, stub networks

DYNAMIC ROUTING — tự học routes từ các router khác:

┌─────────────────────────────────────────────────────────────────┐
│  Interior Gateway Protocols (IGP) — trong 1 AS (Autonomous Sys) │
│                                                                  │
│  RIP (Routing Info Protocol)                                    │
│    - Distance vector (hop count, max 15 hops)                   │
│    - Slow convergence, simple, legacy                           │
│                                                                  │
│  OSPF (Open Shortest Path First)                                │
│    - Link-state, Dijkstra algorithm                             │
│    - Fast convergence, scalable, widely used in enterprise      │
│    - Builds complete topology map (LSDB)                        │
│                                                                  │
│  EIGRP (Enhanced IGRP)                                          │
│    - Cisco proprietary, hybrid (distance vector + link state)   │
│    - Fast, efficient                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Exterior Gateway Protocols (EGP) — giữa các AS                 │
│                                                                  │
│  BGP (Border Gateway Protocol) — "the protocol of the Internet" │
│    - Path vector protocol                                        │
│    - Routes based on policies, not just metrics                 │
│    - Each ISP, cloud provider = 1 AS                            │
│    - iBGP (within AS) vs eBGP (between ASes)                    │
│    - ~900,000 routes in Internet BGP table (2024)               │
└─────────────────────────────────────────────────────────────────┘
```

## 4.3 ARP — Address Resolution Protocol

```
ARP giải quyết vấn đề: biết IP, cần tìm MAC address để gửi frame

Scenario: 192.168.1.100 muốn gửi packet đến 192.168.1.200

1. Check ARP cache: có entry 192.168.1.200 không?

2. Nếu không có → gửi ARP Request (broadcast):
   "Who has 192.168.1.200? Tell 192.168.1.100"
   Destination MAC: FF:FF:FF:FF:FF:FF (broadcast — tất cả nhận)

3. Host có IP 192.168.1.200 trả lời ARP Reply (unicast):
   "192.168.1.200 is at AA:BB:CC:DD:EE:FF"

4. 192.168.1.100 cache entry, gửi packet

ARP Cache (xem trên Linux/Mac):
$ arp -n
Address          HWtype  HWaddress           Flags
192.168.1.1      ether   aa:bb:cc:dd:ee:ff   C
192.168.1.100    ether   11:22:33:44:55:66   C

Gratuitous ARP: host broadcast ARP reply không được yêu cầu
→ dùng để announce IP/MAC, failover notification, conflict detection

ARP Spoofing/Poisoning: attacker gửi fake ARP replies
→ "192.168.1.1 is at attacker's MAC" → MITM attack
→ Defense: Dynamic ARP Inspection (DAI) trên switch
```

## 4.4 NAT — Network Address Translation

```
NAT cho phép nhiều devices dùng chung 1 public IP

Static NAT: 1 private IP ↔ 1 public IP (1:1)
Dynamic NAT: pool of public IPs
PAT (Port Address Translation) / NAT Overload: many:1
  Đây là loại phổ biến nhất (home router dùng cái này)

PAT Table trên router:
Inside Local      Inside Global      Outside Global
192.168.1.100:1234  203.1.2.3:10000  8.8.8.8:53
192.168.1.100:1235  203.1.2.3:10001  8.8.8.8:80
192.168.1.101:5678  203.1.2.3:10002  142.250.1.1:443
192.168.1.102:9876  203.1.2.3:10003  142.250.1.1:443

Outbound packet:
  Src: 192.168.1.100:1234 → NAT → Src: 203.1.2.3:10000

Inbound reply:
  Dst: 203.1.2.3:10000 → NAT lookup → Dst: 192.168.1.100:1234

Problems with NAT:
- Breaks end-to-end connectivity (peer-to-peer hard)
- Stateful → NAT device is single point of failure
- IPv6 designed to eliminate NAT (everyone gets public IP)
```

---

# 5. UDP — User Datagram Protocol

> 📖 https://www.rfc-editor.org/rfc/rfc768

## 5.1 UDP Header

```
 0      7 8     15 16    23 24    31
┌──────────────────────────────────┐
│     Source Port  │  Dest Port   │  4 bytes
├──────────────────────────────────┤
│     Length       │  Checksum    │  4 bytes
├──────────────────────────────────┤
│            Data...               │
└──────────────────────────────────┘

Total header: chỉ 8 bytes! (TCP = 20+ bytes)
```

## 5.2 UDP Characteristics

```
✅ Connectionless — không handshake, gửi ngay
✅ Unreliable — không đảm bảo delivery
✅ No ordering — packets có thể đến không đúng thứ tự
✅ No congestion control
✅ Extremely fast — minimal overhead
✅ Broadcasting và multicasting support

❌ No retransmission nếu packet lost
❌ No flow control
❌ No guaranteed delivery

UDP phù hợp khi:
→ Speed quan trọng hơn reliability
→ Loss một ít data chấp nhận được
→ Application tự xử lý reliability nếu cần
→ Real-time: cũ hơn mà re-transmit thì vô nghĩa

Use cases:
  DNS          → 1 query/response, fast, retry nếu timeout
  Video call   → Zoom, Meet, Skype — 1 frame miss = ok, latency matters more
  Online games → Position updates — cũ = discard
  DHCP         → Bootstrap, don't have IP yet to establish TCP
  TFTP         → Simple file transfer
  SNMP         → Network monitoring
  NTP          → Time sync
  QUIC/HTTP3   → UDP với reliability built on top
  Streaming    → Live video, audio
  IoT sensors  → High-frequency, small data
```

---

# 6. TCP — Transmission Control Protocol

> 📖 https://www.rfc-editor.org/rfc/rfc9293

## 6.1 TCP Header

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
┌─────────────────────────────┬─────────────────────────────────┐
│         Source Port         │       Destination Port          │
├─────────────────────────────┴─────────────────────────────────┤
│                        Sequence Number                        │
├───────────────────────────────────────────────────────────────┤
│                    Acknowledgment Number                      │
├──────┬─────────┬─────────────────────────────────────────────┤
│ Data │Reserved │ Flags: URG ACK PSH RST SYN FIN │  Window    │
│Offset│         │                                │    Size    │
├──────┴─────────┴────────────────────────────────┴────────────┤
│           Checksum          │       Urgent Pointer            │
├─────────────────────────────┴─────────────────────────────────┤
│                    Options (if Data Offset > 5)               │
└───────────────────────────────────────────────────────────────┘
Minimum header: 20 bytes

Sequence Number: tracks bytes sent (not packets)
Ack Number: next byte expected from sender
Window Size: receive buffer space (flow control)
Flags:
  SYN: synchronize (connection setup)
  ACK: acknowledgment field is valid
  FIN: sender finished sending
  RST: reset connection immediately
  PSH: push data to application immediately
  URG: urgent data
```

## 6.2 TCP Three-Way Handshake

```
CLIENT                                    SERVER
  │                                          │
  │──── SYN (seq=x) ────────────────────────▶│  Client: "tôi muốn kết nối, seq bắt đầu x"
  │                                          │
  │◀─── SYN-ACK (seq=y, ack=x+1) ───────────│  Server: "OK, seq bắt đầu y, nhận được x"
  │                                          │
  │──── ACK (ack=y+1) ──────────────────────▶│  Client: "nhận được y, ready"
  │                                          │
  │    ===== CONNECTION ESTABLISHED =====    │
  │                                          │
  │──── [HTTP Request Data] ────────────────▶│
  │◀─── [HTTP Response Data] ────────────────│

Tại sao cần 3-way?
→ Client cần xác nhận server nhận được seq của mình
→ Server cần xác nhận client nhận được seq của server
→ Minimum 3 messages để đảm bảo cả 2 bên ready

SYN Flood Attack: attacker gửi nhiều SYN, không gửi ACK
→ Server allocate resources cho half-open connections
→ Server exhausted
→ Defense: SYN cookies, rate limiting
```

## 6.3 TCP Connection Termination — Four-Way Handshake

```
CLIENT                                    SERVER
  │                                          │
  │──── FIN (seq=u) ────────────────────────▶│  Client: "tôi xong gửi rồi"
  │                                          │
  │◀─── ACK (ack=u+1) ───────────────────────│  Server: "ok, nhận được"
  │                                          │  (Server có thể vẫn gửi data)
  │◀─── FIN (seq=v) ─────────────────────────│  Server: "tôi cũng xong"
  │                                          │
  │──── ACK (ack=v+1) ──────────────────────▶│  Client: "ok"
  │                                          │
  │      === CONNECTION CLOSED ===           │

Client enters TIME_WAIT state (2 × MSL = 2 × 60s = 2 minutes)
→ Đợi delayed packets từ connection cũ đến rồi mới mở connection mới
→ Đảm bảo server nhận được ACK cuối cùng
→ Tại sao TIME_WAIT quan trọng: tránh old packets bị nhầm là new connection

RST: force close ngay lập tức, không graceful
  Dùng khi: connection error, invalid port, kill connection
```

## 6.4 Reliability Mechanisms

```
── SEQUENCE NUMBERS & ACKNOWLEDGMENTS ──

Client sends: [Data bytes 1-1000, seq=1]
Server ACK: [ack=1001, "give me byte starting from 1001"]
Client sends: [Data bytes 1001-2000, seq=1001]
Server ACK: [ack=2001]

If packet lost:
Client sends: [seq=1001] → LOST
Server: timeout or received seq=2001 but expected 1001
Server: sends Duplicate ACK [ack=1001]
Client: retransmit [seq=1001]

── SLIDING WINDOW (FLOW CONTROL) ──

Window = how many bytes sender can send without waiting for ACK
→ Prevents fast sender overwhelming slow receiver

Receiver advertises window size in TCP header
If window = 65535 bytes, sender can have 65535 bytes "in flight"

Window scaling (RFC 7323): multiply window by 2^shift
→ Allows windows up to 1GB (needed for high-bandwidth, high-latency links)

── CONGESTION CONTROL ──

Problem: too many senders → network congestion → packet loss → retransmit → worse congestion

Congestion Window (CWND): sender-side limit based on network conditions

Slow Start:
  CWND = 1 MSS (Maximum Segment Size ~1460 bytes)
  Every ACK received → CWND × 2 (exponential growth)
  Until: CWND reaches ssthresh OR packet loss detected

Congestion Avoidance:
  After ssthresh: +1 MSS per RTT (linear growth)
  "Additive Increase"

On packet loss (timeout):
  ssthresh = CWND / 2
  CWND = 1 (start over)
  "Multiplicative Decrease"

TCP Cubic (modern default):
  Cubic function for CWND growth — faster recovery
  More aggressive in high-bandwidth networks

BBR (Bottleneck Bandwidth and RTT):
  Google's algorithm, used in QUIC/HTTP3
  Based on measured bandwidth and RTT, not loss
  Better for modern networks
```

## 6.5 TCP vs UDP Comparison

```
                    TCP                 UDP
Connection        Required (3WHS)      None
Reliability       Guaranteed           Best-effort
Order             Preserved            Not preserved
Flow Control      Yes (window)         No
Congestion Ctrl   Yes                  No
Header Size       20-60 bytes          8 bytes
Speed             Slower               Faster
Use Cases         HTTP, FTP, email     DNS, video, games, DHCP
Error Checking    Checksum + ACK       Checksum only
Broadcasting      No                   Yes
```

---

# 7. DNS — Domain Name System

> 📖 https://www.rfc-editor.org/rfc/rfc1035

## 7.1 DNS Hierarchy

```
Root (.)
├── .com
│   ├── google.com
│   │   ├── www.google.com
│   │   ├── mail.google.com
│   │   └── api.google.com
│   └── amazon.com
├── .org
│   └── wikipedia.org
├── .vn
│   └── vnexpress.net
└── .io

DNS Servers:
  Root Nameservers (13 clusters, a.root-servers.net – m.root-servers.net)
  → Knows where TLD nameservers are

  TLD Nameservers (e.g., Verisign for .com)
  → Knows where authoritative NS for each domain are

  Authoritative Nameservers (e.g., ns1.google.com)
  → Has actual DNS records for the domain

  Recursive Resolver (e.g., 8.8.8.8, 1.1.1.1, your ISP's resolver)
  → Does the work of querying root → TLD → authoritative
  → Caches results
```

## 7.2 DNS Resolution Process

```
User types: www.example.com

1. Check OS Cache (hosts file: /etc/hosts, C:\Windows\System32\drivers\etc\hosts)
   127.0.0.1   localhost
   192.168.1.1 myrouter.local
   → If found: done

2. Check OS DNS Cache (recently resolved names)
   $ ipconfig /displaydns  (Windows)
   $ sudo dscacheutil -cachedump (Mac)
   → If found: done

3. Query Recursive Resolver (from DHCP or manual config: 8.8.8.8)

4. Recursive Resolver checks its cache
   → If found: return (TTL not expired)

5. Recursive Resolver queries Root Server
   "Who knows about .com?"
   Root: "Ask a.gtld-servers.net (TLD server for .com)"

6. Resolver queries TLD Server (a.gtld-servers.net)
   "Who knows about example.com?"
   TLD: "Ask ns1.example.com (authoritative NS)"

7. Resolver queries Authoritative Server (ns1.example.com)
   "What is www.example.com?"
   Auth NS: "93.184.216.34" ← the actual answer

8. Resolver returns answer + caches it (TTL = e.g., 300 seconds)

9. OS caches it, returns to browser

Total: typically 10-100ms for uncached, <1ms for cached

──────────────────────────────────────────────────────
Browser → OS Cache → DNS Cache → Resolver Cache
                                    ↓ (miss)
                               Root → TLD → Auth NS
──────────────────────────────────────────────────────
```

## 7.3 DNS Record Types

```
A Record — hostname → IPv4 address
  www.example.com.   300   IN   A   93.184.216.34

AAAA Record — hostname → IPv6 address
  www.example.com.   300   IN   AAAA   2606:2800:220:1:248:1893:25c8:1946

CNAME — canonical name (alias)
  blog.example.com.  300   IN   CNAME  www.example.com.
  → blog.example.com is an alias for www.example.com
  → Can't CNAME the root domain! (@ or example.com) — use ALIAS/ANAME

MX — mail exchange
  example.com.       300   IN   MX   10   mail.example.com.
  example.com.       300   IN   MX   20   backup-mail.example.com.
  Priority: lower = preferred (10 before 20)

NS — nameserver
  example.com.       86400 IN   NS   ns1.example.com.
  example.com.       86400 IN   NS   ns2.example.com.

TXT — text (SPF, DKIM, domain verification)
  example.com.   300  IN  TXT  "v=spf1 include:_spf.google.com ~all"
  _dmarc.example.com. 300 IN TXT "v=DMARC1; p=reject; rua=mailto:..."

SOA — Start of Authority (zone metadata)
  example.com. IN SOA ns1.example.com. admin.example.com. (
    2025051901  ; serial (YYYYMMDDnn)
    86400       ; refresh (24h)
    7200        ; retry (2h)
    3600000     ; expire (1000h)
    300         ; minimum TTL
  )

PTR — reverse DNS (IP → hostname)
  34.216.184.93.in-addr.arpa.  IN  PTR  www.example.com.
  Used for: email spam filtering, logging, security

SRV — service location
  _http._tcp.example.com.  IN  SRV  10 5 80 www.example.com.
  Priority, Weight, Port, Target

CAA — Certification Authority Authorization
  example.com.  IN  CAA  0 issue "letsencrypt.org"
  → Only Let's Encrypt can issue certs for this domain

TTL (Time To Live):
  How long resolvers cache the record (seconds)
  Low TTL (60s): flexible, fast propagation, more DNS queries
  High TTL (86400s): less flexible, fewer queries, faster resolution
  Before DNS migration: lower TTL → after: raise again
```

## 7.4 DNS Security

```
DNS Spoofing / Cache Poisoning:
  Attacker tricks resolver into caching fake record
  "example.com → attacker's IP"
  → All users directed to malicious site

DNSSEC (DNS Security Extensions):
  Adds cryptographic signatures to DNS records
  Resolver verifies signature chain: Root → TLD → Domain
  Prevents spoofing, but NOT privacy (queries still visible)

DNS over HTTPS (DoH):
  DNS queries encrypted in HTTPS (port 443)
  Used by: Chrome, Firefox, 1.1.1.1
  ISP/attacker can't see what you're resolving

DNS over TLS (DoT):
  DNS encrypted with TLS (port 853)
  Less common than DoH

Split-horizon DNS:
  Same name resolves differently based on source
  Internal: api.company.com → 192.168.1.50 (private)
  External: api.company.com → 203.1.2.3 (public load balancer)
```

---

# 8. TLS/SSL — Transport Layer Security

> 📖 https://www.rfc-editor.org/rfc/rfc8446 (TLS 1.3)

## 8.1 TLS Overview

```
TLS = protocol cung cấp:
  Confidentiality : dữ liệu được mã hóa (eavesdropper không đọc được)
  Integrity       : dữ liệu không bị sửa đổi (HMAC)
  Authentication  : xác thực server (certificate) — optionally client too

TLS sits between Transport (TCP) and Application (HTTP):
  HTTP → [TLS encryption] → TCP → IP → Network

SSL vs TLS:
  SSL 2.0 (1995) — broken, deprecated
  SSL 3.0 (1996) — broken (POODLE attack), deprecated
  TLS 1.0 (1999) — deprecated 2020
  TLS 1.1 (2006) — deprecated 2020
  TLS 1.2 (2008) — still widely used
  TLS 1.3 (2018) — current standard, much faster and more secure
```

## 8.2 TLS 1.2 Handshake

```
CLIENT                                           SERVER
  │                                                 │
  │──ClientHello ──────────────────────────────────▶│
  │  TLS version, cipher suites, random_C           │
  │                                                 │
  │◀── ServerHello ──────────────────────────────── │
  │  Chosen cipher suite, random_S                  │
  │                                                 │
  │◀── Certificate ────────────────────────────────  │
  │  Server's certificate (public key + identity)   │
  │                                                 │
  │◀── ServerHelloDone ───────────────────────────── │
  │                                                 │
  │   Client verifies certificate:                  │
  │   - Valid signature from trusted CA?            │
  │   - Not expired?                                │
  │   - Domain matches?                             │
  │   - Not revoked (CRL/OCSP)?                     │
  │                                                 │
  │──ClientKeyExchange ────────────────────────────▶│
  │  pre_master_secret (encrypted with server's     │
  │  public key OR Diffie-Hellman exchange)         │
  │                                                 │
  │  Both sides derive session keys from:           │
  │  random_C + random_S + pre_master_secret        │
  │                                                 │
  │──ChangeCipherSpec + Finished ──────────────────▶│
  │◀── ChangeCipherSpec + Finished ─────────────── │
  │                                                 │
  │  ====== ENCRYPTED APPLICATION DATA ======       │
  │──── [HTTP GET /...] encrypted ─────────────────▶│
  │◀─── [HTTP 200 OK ...] encrypted ────────────── │

TLS 1.2: 2 round trips (2 × RTT) before data
```

## 8.3 TLS 1.3 Handshake (Much Faster)

```
CLIENT                                           SERVER
  │                                                 │
  │──ClientHello ──────────────────────────────────▶│
  │  + key_share (DH public key)                    │
  │  + supported cipher suites                      │
  │                                                 │
  │◀── ServerHello ─────────────────────────────────│
  │  + key_share (server DH public)                 │
  │◀── {Certificate} (encrypted already!)  ─────────│
  │◀── {CertificateVerify} ─────────────────────────│
  │◀── {Finished} ──────────────────────────────────│
  │                                                 │
  │  ← Keys derived from DH exchange here          │
  │  Client verifies certificate                    │
  │                                                 │
  │──{Finished} ───────────────────────────────────▶│
  │──[HTTP Request] (encrypted) ──────────────────▶│
  │                                                 │
  │  ====== APPLICATION DATA ======                  │

TLS 1.3: 1 round trip (1 × RTT) before data

0-RTT (Zero Round Trip Time) — resuming previous session:
  Client sends early data WITH ClientHello
  → Immediate data, no handshake wait
  ⚠️ Vulnerable to replay attacks — use only for idempotent requests
```

## 8.4 Certificate Chain & PKI

```
Certificate Authority (CA) hierarchy:

Root CA (self-signed, stored in browser/OS trust store)
    └── Intermediate CA (signed by Root CA)
            └── End-entity Certificate (signed by Intermediate CA)
                  (the certificate your website uses)

Why intermediate CA?
→ Root CA kept offline in HSM for security
→ If Intermediate CA compromised → revoke just that CA
→ Root CA reissues new Intermediate CA

Certificate contents (X.509):
  Subject:     CN=www.example.com, O=Example Inc, C=US
  Issuer:      CN=Let's Encrypt R3, O=Let's Encrypt
  Valid From:  2025-01-01
  Valid Until: 2025-04-01  (90 days for Let's Encrypt)
  Public Key:  (RSA 2048-bit or ECDSA P-256 — ECDSA preferred, smaller)
  SANs:        DNS:www.example.com, DNS:example.com
  Signature:   (signed by Issuer's private key)

Certificate Validation:
  DV (Domain Validation): proves you control the domain (quick, automated)
  OV (Organization Validation): proves organization identity
  EV (Extended Validation): strict org verification (green bar — less common now)

OCSP (Online Certificate Status Protocol):
  Check if cert revoked before its expiry
  OCSP Stapling: server includes OCSP response in TLS handshake
  → Faster, more private than client querying OCSP server

Let's Encrypt — free automated DV certificates:
  ACME protocol: HTTP-01 or DNS-01 challenge to prove domain ownership
  certbot client automates renewal
```

## 8.5 Cryptography in TLS

```
── KEY EXCHANGE (Asymmetric — slow, used only for handshake) ──
  RSA Key Exchange (TLS 1.2): encrypt pre-master with server's public key
    ❌ No forward secrecy (if private key compromised later → past sessions decryptable)

  ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) — TLS 1.2 + 1.3:
    Ephemeral = new key pair per session
    ✅ Forward Secrecy: even if server key compromised → past sessions safe
    DH: both generate keypairs, exchange public keys
        shared_secret = client_private × server_public = server_private × client_public

── SYMMETRIC ENCRYPTION (fast, used for actual data) ──
  AES-128-GCM, AES-256-GCM — most common
  ChaCha20-Poly1305 — better on mobile (no AES hardware acceleration)
  GCM = Galois/Counter Mode: provides both encryption + authentication (AEAD)

── MESSAGE AUTHENTICATION (Integrity) ──
  HMAC-SHA256 (TLS 1.2)
  Built into AEAD ciphers (TLS 1.3)

── CIPHER SUITE (combination of all above) ──
TLS 1.2: TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
  Key Exchange: ECDHE
  Authentication: RSA (certificate signature)
  Encryption: AES_256_GCM
  MAC: SHA384

TLS 1.3: TLS_AES_256_GCM_SHA384 (simpler, all must use ECDHE)
```

---

# 9. HTTP — HyperText Transfer Protocol

> 📖 https://developer.mozilla.org/en-US/docs/Web/HTTP
> 📖 https://www.rfc-editor.org/rfc/rfc9110 (HTTP Semantics)

## 9.1 HTTP/1.1

```
──── REQUEST ────
GET /api/users/1 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGc...
Accept: application/json
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
User-Agent: Mozilla/5.0...

──── RESPONSE ────
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Encoding: gzip
Content-Length: 256
Cache-Control: max-age=300, public
ETag: "abc123"
X-Request-Id: req-uuid-here
Date: Mon, 19 May 2025 10:30:00 GMT

{"id": 1, "name": "Khang", ...}

── HTTP METHODS ──
GET     Retrieve resource, safe + idempotent, cacheable
POST    Create resource, NOT safe, NOT idempotent
PUT     Replace resource entirely, idempotent
PATCH   Partial update, NOT necessarily idempotent
DELETE  Remove resource, idempotent
HEAD    Like GET but no body (check if resource exists)
OPTIONS CORS preflight, check allowed methods
CONNECT Establish tunnel (HTTPS proxy)

Safe     = no side effects (GET, HEAD, OPTIONS)
Idempotent = same result if called multiple times (GET, PUT, DELETE, HEAD)

── STATUS CODES ──
1xx Information:
  100 Continue           Client can continue sending body
  101 Switching Protocols Upgrade to WebSocket

2xx Success:
  200 OK                 Standard success
  201 Created            Resource created (POST)
  204 No Content         Success, no response body (DELETE)
  206 Partial Content    Range request

3xx Redirection:
  301 Moved Permanently  Permanent redirect (browser caches)
  302 Found              Temporary redirect
  304 Not Modified       Cache valid (conditional GET)
  307 Temporary Redirect Temporary, keep method (don't change POST to GET)
  308 Permanent Redirect Permanent, keep method

4xx Client Error:
  400 Bad Request        Invalid syntax, missing required fields
  401 Unauthorized       Not authenticated (need to login)
  403 Forbidden          Authenticated but no permission
  404 Not Found          Resource doesn't exist
  405 Method Not Allowed Wrong HTTP method
  409 Conflict           Conflict (duplicate, wrong state)
  410 Gone               Resource permanently deleted
  422 Unprocessable      Validation errors (semantic errors)
  429 Too Many Requests  Rate limited

5xx Server Error:
  500 Internal Server Error  Unexpected server error
  502 Bad Gateway            Upstream server error
  503 Service Unavailable    Server overloaded/down (retry-after)
  504 Gateway Timeout        Upstream timeout
```

## 9.2 HTTP/1.1 vs HTTP/2 vs HTTP/3

```
HTTP/1.1 Problems:
  - 1 request per TCP connection at a time
  - Head-of-line blocking: req 2 waits for req 1 to complete
  - Headers sent as plain text (repeated, large)
  - Solution: multiple TCP connections (browser opens 6 per domain)

──────────────────────────────────────────────────────

HTTP/2 (2015):
  ✅ Multiplexing: multiple requests on 1 TCP connection
     Request 1, 2, 3 sent simultaneously, responses interleaved
  ✅ Header Compression (HPACK): compress repeated headers
     "Authorization: Bearer xxx" sent once, referenced later
  ✅ Server Push: server proactively sends resources
     "I see you want index.html, here's style.css and app.js too"
  ✅ Binary framing: efficient parsing (HTTP/1.1 = text)
  ✅ Stream prioritization
  ❌ Still has TCP head-of-line blocking at transport layer
     1 lost packet stalls ALL streams on that TCP connection

──────────────────────────────────────────────────────

HTTP/3 (2022):
  ✅ Based on QUIC (UDP-based transport)
  ✅ NO head-of-line blocking at transport level
     Lost packet only affects that stream, not others
  ✅ Faster connection: QUIC 0-RTT or 1-RTT (combines TLS + transport)
  ✅ Connection migration: session continues when IP changes
     (phone switches Wi-Fi → 4G → connection survives!)
  ✅ Built-in encryption (always encrypted)
  ❌ UDP sometimes blocked by firewalls
  ❌ Higher CPU (encryption for every packet vs TCP)
```

## 9.3 HTTP Caching

```
Cache-Control directives:
  max-age=3600      Cache for 3600 seconds
  s-maxage=3600     CDN cache duration (overrides max-age for proxies)
  no-cache          Must revalidate with server before using cached
  no-store          Never cache (sensitive data)
  private           Only browser cache (not CDN/proxy)
  public            CDN/proxies can cache
  must-revalidate   Don't serve stale, even if server unreachable
  immutable         Content won't change (static assets with hash in URL)

ETag — conditional requests:
  Server: ETag: "abc123"
  Client: If-None-Match: "abc123"
  Server: 304 Not Modified (if unchanged) or 200 + new ETag

Last-Modified:
  Server: Last-Modified: Mon, 19 May 2025 10:00:00 GMT
  Client: If-Modified-Since: Mon, 19 May 2025 10:00:00 GMT
  Server: 304 Not Modified (if not changed)

Cache-busting for static assets:
  style.abc123.css    ← hash in filename
  app.bundle.v2.js    ← version in filename
  → Cache indefinitely (immutable) + new name when content changes
```

## 9.4 HTTP Headers Deep Dive

```
── AUTHENTICATION ──
Authorization: Bearer <JWT token>
Authorization: Basic <base64(user:pass)>  ← DON'T use without HTTPS!
Authorization: Digest <...>

── CORS (Cross-Origin Resource Sharing) ──
Browser blocks request from origin A to origin B by default
"Origin" = scheme + host + port

Preflight (OPTIONS) request for non-simple requests:
  OPTIONS /api/data HTTP/1.1
  Origin: https://app.example.com
  Access-Control-Request-Method: POST
  Access-Control-Request-Headers: Content-Type, Authorization

Server response:
  Access-Control-Allow-Origin: https://app.example.com
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Max-Age: 86400    ← cache preflight for 1 day
  Access-Control-Allow-Credentials: true  ← allow cookies

Simple requests (no preflight):
  GET/HEAD/POST with basic headers + certain content types

── CONTENT NEGOTIATION ──
Accept: application/json, text/html;q=0.9, */*;q=0.8
Accept-Language: vi-VN,vi;q=0.9,en;q=0.8
Accept-Encoding: gzip, deflate, br, zstd

── SECURITY HEADERS ──
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  → HSTS: force HTTPS for 1 year

Content-Security-Policy: default-src 'self'; script-src 'self' cdn.example.com
  → Prevent XSS: tell browser which sources are trusted

X-Frame-Options: DENY          → prevent clickjacking
X-Content-Type-Options: nosniff → prevent MIME sniffing
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()

── RATE LIMITING ──
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1715960400
Retry-After: 60  (with 429)
```

---

# 10. HTTPS

## 10.1 HTTPS = HTTP + TLS

```
HTTP  → port 80,  plain text, vulnerable to:
  - Eavesdropping (coffee shop Wi-Fi sniffer reads your data)
  - MITM (attacker modifies response, injects scripts)
  - Session hijacking (steal cookies from HTTP)

HTTPS → port 443, encrypted with TLS:
  - Confidentiality: attacker can't read data
  - Integrity: attacker can't modify data
  - Authentication: you're talking to real server (certificate)

HSTS (HTTP Strict Transport Security):
  After first HTTPS visit, browser NEVER tries HTTP again for that domain
  Strict-Transport-Security: max-age=31536000; includeSubDomains

HSTS Preload:
  Domain submitted to preload list built into browsers
  → Even FIRST visit is forced HTTPS (no HTTP redirect needed)
```

## 10.2 Certificate Transparency (CT)

```
Problem: rogue CA could issue fake certificate for google.com

Solution: CT Logs
  All certificates must be logged in public CT logs
  Browsers check certificate is in CT log
  Certificate owners can monitor logs for unauthorized certs

Lifecycle:
  1. Domain owner requests cert from CA
  2. CA issues cert AND submits to CT log
  3. CT log returns Signed Certificate Timestamp (SCT)
  4. CA includes SCT in certificate
  5. Browser checks SCT during TLS handshake
```

---

# 11. WebSocket & Long Polling

> 📖 https://www.rfc-editor.org/rfc/rfc6455 (WebSocket)

## 11.1 HTTP Polling vs Long Polling vs WebSocket

```
── POLLING (inefficient) ──
Client: "Any new messages?" → Server: "No"  (every 1s)
Client: "Any new messages?" → Server: "No"
Client: "Any new messages?" → Server: "Yes! Here: [...]"
→ Wastes bandwidth, server resources
→ Delay up to polling interval

── LONG POLLING ──
Client: "Any new messages?" → Server: holds connection open...
                                        (30 second timeout)
Server: "Yes! Here: [...]" → Client receives immediately
Client: "Any new messages?" → Server: holds again...
→ Better latency, but still overhead per message
→ Fallback for environments blocking WebSocket

── SERVER-SENT EVENTS (SSE) ──
Client connects once:
  GET /events HTTP/1.1
  Accept: text/event-stream

Server streams:
  data: {"type":"message","text":"Hello"}\n\n
  data: {"type":"notification","count":3}\n\n
→ One-directional: Server → Client only
→ Auto-reconnect built-in
→ Good for: live feeds, dashboards, notifications

── WEBSOCKET — full-duplex bidirectional ──
Upgrade from HTTP:
  GET /chat HTTP/1.1
  Upgrade: websocket
  Connection: Upgrade
  Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
  Sec-WebSocket-Version: 13

Server response:
  HTTP/1.1 101 Switching Protocols
  Upgrade: websocket
  Connection: Upgrade
  Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

Now: bidirectional TCP-like channel over single connection
  Client → Server: any time
  Server → Client: any time
  → Real-time chat, live games, collaborative editing, trading

WebSocket Frame:
  FIN bit | Opcode | MASK | Payload length | Masking key | Payload
  Opcodes: 0x1=text, 0x2=binary, 0x8=close, 0x9=ping, 0xA=pong
```

---

# 12. Load Balancer & Reverse Proxy

## 12.1 Load Balancing Algorithms

```
Round Robin:
  req1 → server1
  req2 → server2
  req3 → server3
  req4 → server1 (cycle)
  Simple, even distribution, doesn't account for server load

Weighted Round Robin:
  server1 (weight 3), server2 (weight 1)
  req1,2,3 → server1, req4 → server2
  For servers with different capacities

Least Connections:
  → Always route to server with fewest active connections
  Good when requests have variable processing time

Least Response Time:
  → Route to server with lowest response time + fewest connections
  Most adaptive

IP Hash:
  server = hash(client_IP) % num_servers
  → Same client always goes to same server
  → Session affinity (sticky sessions)
  Problem: if server dies, all its clients reassigned

Consistent Hash (with virtual nodes):
  → Minimal reassignment when servers added/removed
  → Used by CDNs, caching layers

Random:
  → Simple, surprisingly effective for stateless services

── LAYER 4 vs LAYER 7 LOAD BALANCER ──

Layer 4 (Transport):
  Routes based on IP + TCP/UDP port only
  Doesn't inspect HTTP content
  Faster, lower overhead
  Can't do content-based routing
  Example: AWS NLB, HAProxy TCP mode

Layer 7 (Application):
  Inspects HTTP headers, URL, cookies
  Content-based routing:
    /api/* → API servers
    /static/* → CDN/static servers
    Host: mobile.example.com → mobile backend
  Can do: SSL termination, HTTP rewrites, WAF
  Example: Nginx, AWS ALB, HAProxy HTTP mode
```

## 12.2 Nginx as Reverse Proxy & Load Balancer

```nginx
# /etc/nginx/nginx.conf

# Upstream servers (backend pool)
upstream api_servers {
    least_conn;                           # algorithm: least connections
    server 10.0.0.1:8080 weight=3;
    server 10.0.0.2:8080 weight=2;
    server 10.0.0.3:8080 weight=1;
    server 10.0.0.4:8080 backup;         # only used if others fail
    keepalive 32;                         # keep 32 persistent connections
}

upstream static_servers {
    server 10.0.1.1:80;
    server 10.0.1.2:80;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL
    ssl_certificate     /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;

    # Route to appropriate upstream
    location /api/ {
        proxy_pass         http://api_servers;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade $http_upgrade;    # WebSocket
        proxy_set_header   Connection "upgrade";      # WebSocket
        proxy_connect_timeout 5s;
        proxy_read_timeout    60s;
    }

    location /static/ {
        proxy_pass http://static_servers;
        proxy_cache_valid 200 1d;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}
```

## 12.3 Health Checks

```
Passive Health Check:
  Load balancer marks server unhealthy after N consecutive failures
  Error detected AFTER failed request reaches backend

Active Health Check:
  Load balancer periodically sends probe to each server
  /health endpoint returns 200 → healthy
  → Removes unhealthy servers BEFORE user traffic hits them

Health check endpoint should verify:
  - App process running
  - Database connectivity
  - Cache connectivity
  - Memory/CPU within limits

Nginx (active health check — nginx plus or ngx_http_upstream_hc_module):
  health_check interval=5s fails=3 passes=2 uri=/health;
```

---

# 13. Network Security

## 13.1 Common Attacks

```
── MAN IN THE MIDDLE (MITM) ──
  Attacker interposes between client and server
  Can read/modify traffic
  Defense: TLS with certificate verification, certificate pinning

── DNS SPOOFING ──
  Fake DNS response → wrong IP
  Defense: DNSSEC, DoH/DoT, certificate verification

── DDoS (Distributed Denial of Service) ──
  Flood server with traffic → legitimate users can't reach it
  Types:
    Volumetric: saturate bandwidth (UDP flood, ICMP flood)
    Protocol: exhaust server resources (SYN flood)
    Application: exhaust app layer (HTTP flood, Slowloris)
  Defense: CDN, anycast, rate limiting, DDoS protection (Cloudflare, AWS Shield)

── SYN FLOOD ──
  Send many SYN packets, never complete handshake
  Server keeps half-open connections → resources exhausted
  Defense: SYN cookies (server doesn't allocate until ACK received)

── IP SPOOFING ──
  Forge source IP address in packets
  Used in DDoS amplification attacks
  Defense: ingress/egress filtering (BCP38), RPF check

── ARP SPOOFING ──
  Send fake ARP replies → MITM on local network
  Defense: Dynamic ARP Inspection, static ARP entries

── Port Scanning (Reconnaissance) ──
  nmap: probe ports to find open services
  SYN scan: SYN → SYN-ACK (open) or RST (closed)
  Defense: firewall, introspection, port knocking
```

## 13.2 Firewall & Packet Filtering

```
Stateless Firewall (Packet Filter):
  Rules based on: src/dst IP, port, protocol
  Doesn't track connection state
  ALLOW tcp from any to 203.1.2.3 port 443
  DENY  tcp from 1.2.3.4 to any

Stateful Firewall:
  Tracks connection state table
  Automatically allows return traffic for established connections
  ALLOW tcp from any to 203.1.2.3 port 443 (NEW)
  → Return packets automatically allowed (ESTABLISHED/RELATED)
  Much more secure

WAF (Web Application Firewall):
  Layer 7 filtering
  Rules for: SQL injection, XSS, CSRF, path traversal
  Examples: AWS WAF, Cloudflare WAF, ModSecurity

iptables (Linux):
  # Allow established connections
  iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
  # Allow SSH from specific IP
  iptables -A INPUT -s 203.1.2.3 -p tcp --dport 22 -j ACCEPT
  # Allow HTTPS
  iptables -A INPUT -p tcp --dport 443 -j ACCEPT
  # Drop everything else
  iptables -A INPUT -j DROP
```

## 13.3 VPN & Tunneling

```
VPN (Virtual Private Network):
  Encrypted tunnel over public Internet
  Remote worker → VPN → Corporate network

Types:
  Site-to-Site: connect two networks (Office A ↔ Office B)
  Remote Access: user → corporate network

Protocols:
  IPSec: widely used, complex, layer 3
  OpenVPN: SSL/TLS-based, flexible, open source
  WireGuard: modern, simple, very fast, uses ChaCha20
  SSTP: Microsoft, uses HTTPS port (bypasses most firewalls)

SSH Tunneling:
  ssh -L 5432:db-server:5432 user@jump-host
  → localhost:5432 → jump-host → db-server:5432
  Forward: access private DB through bastion host

  ssh -R 8080:localhost:3000 user@public-server
  → public-server:8080 → your-machine:3000
  Reverse: expose local service to public

SOCKS Proxy:
  ssh -D 1080 user@remote-server
  → Route all traffic through remote server
  → Like poor-man's VPN
```

---

## 📎 Quick Reference — Ports

```
Port   Protocol   Service
──────────────────────────────────────────────────
20     TCP        FTP Data
21     TCP        FTP Control
22     TCP        SSH
23     TCP        Telnet (insecure, avoid)
25     TCP        SMTP (email sending)
53     TCP/UDP    DNS
67     UDP        DHCP Server
68     UDP        DHCP Client
80     TCP        HTTP
110    TCP        POP3 (email receive)
143    TCP        IMAP (email receive)
443    TCP        HTTPS
465    TCP        SMTP over SSL
587    TCP        SMTP (submission)
993    TCP        IMAP over SSL
995    TCP        POP3 over SSL
3306   TCP        MySQL
5432   TCP        PostgreSQL
6379   TCP        Redis
27017  TCP        MongoDB
8080   TCP        HTTP alternate
8443   TCP        HTTPS alternate
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| HTTP/1.1 RFC | https://www.rfc-editor.org/rfc/rfc9110 |
| HTTP/2 RFC | https://www.rfc-editor.org/rfc/rfc9113 |
| HTTP/3 RFC | https://www.rfc-editor.org/rfc/rfc9114 |
| TLS 1.3 RFC | https://www.rfc-editor.org/rfc/rfc8446 |
| TCP RFC | https://www.rfc-editor.org/rfc/rfc9293 |
| UDP RFC | https://www.rfc-editor.org/rfc/rfc768 |
| DNS RFC | https://www.rfc-editor.org/rfc/rfc1035 |
| IPv4 RFC | https://www.rfc-editor.org/rfc/rfc791 |
| IPv6 RFC | https://www.rfc-editor.org/rfc/rfc8200 |
| WebSocket RFC | https://www.rfc-editor.org/rfc/rfc6455 |
| MDN HTTP Guide | https://developer.mozilla.org/en-US/docs/Web/HTTP |
| Nginx Docs | https://nginx.org/en/docs/ |
| QUIC RFC | https://www.rfc-editor.org/rfc/rfc9000 |
| Cloudflare Learning | https://www.cloudflare.com/learning/ |
| Computer Networks (Tanenbaum) | Textbook reference |

---

*Học theo thứ tự: OSI Model → IP/Subnetting → TCP vs UDP → DNS → TLS → HTTP → HTTPS → Load Balancer → Security*
