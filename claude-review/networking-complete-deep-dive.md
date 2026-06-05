# 🌐 Computer Networking — Complete Deep Dive
>
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

> 📖 <https://www.rfc-editor.org/rfc/rfc791> (IPv4)
> 📖 <https://www.rfc-editor.org/rfc/rfc8200> (IPv6)

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

> 📖 <https://www.rfc-editor.org/rfc/rfc768>

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

> 📖 <https://www.rfc-editor.org/rfc/rfc9293>

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

> 📖 <https://www.rfc-editor.org/rfc/rfc1035>

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

> 📖 <https://www.rfc-editor.org/rfc/rfc8446> (TLS 1.3)

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

> 📖 <https://developer.mozilla.org/en-US/docs/Web/HTTP>
> 📖 <https://www.rfc-editor.org/rfc/rfc9110> (HTTP Semantics)

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

> 📖 <https://www.rfc-editor.org/rfc/rfc6455> (WebSocket)

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
| HTTP/1.1 RFC | <https://www.rfc-editor.org/rfc/rfc9110> |
| HTTP/2 RFC | <https://www.rfc-editor.org/rfc/rfc9113> |
| HTTP/3 RFC | <https://www.rfc-editor.org/rfc/rfc9114> |
| TLS 1.3 RFC | <https://www.rfc-editor.org/rfc/rfc8446> |
| TCP RFC | <https://www.rfc-editor.org/rfc/rfc9293> |
| UDP RFC | <https://www.rfc-editor.org/rfc/rfc768> |
| DNS RFC | <https://www.rfc-editor.org/rfc/rfc1035> |
| IPv4 RFC | <https://www.rfc-editor.org/rfc/rfc791> |
| IPv6 RFC | <https://www.rfc-editor.org/rfc/rfc8200> |
| WebSocket RFC | <https://www.rfc-editor.org/rfc/rfc6455> |
| MDN HTTP Guide | <https://developer.mozilla.org/en-US/docs/Web/HTTP> |
| Nginx Docs | <https://nginx.org/en/docs/> |
| QUIC RFC | <https://www.rfc-editor.org/rfc/rfc9000> |
| Cloudflare Learning | <https://www.cloudflare.com/learning/> |
| Computer Networks (Tanenbaum) | Textbook reference |

---

# 14. Plain-English Networking — Basics for Every Developer

## 14.1 How Computers Talk to Each Other (Simple)

```
ANALOGY: Sending a physical letter through the postal system

You write a letter to your friend:
  Your address:   192.168.1.100  (your IP address)
  Friend's address: 93.184.216.34 (server IP address)
  Envelope:       TCP/IP packet
  Post office:    Router (knows which way to forward your letter)
  Mailman:        Your router / ISP
  Contents:       "GET /index.html HTTP/1.1"

WHAT HAPPENS WHEN YOU TYPE A URL:
  1. You type: https://example.com/products

  2. DNS LOOKUP — "Where is example.com?"
     Your computer asks: "Hey DNS server, what's the IP of example.com?"
     DNS server responds: "It's 93.184.216.34"
     (Like asking directory assistance for a phone number)

  3. TCP CONNECTION — "Knock knock"
     Your computer calls 93.184.216.34 port 443
     TCP three-way handshake: SYN → SYN-ACK → ACK
     (Like picking up the phone and saying hello)

  4. TLS HANDSHAKE — "Let's speak in code"
     Exchange encryption keys, verify server certificate
     (Like agreeing on a secret language before discussing private matters)

  5. HTTP REQUEST — "What do you want?"
     "GET /products HTTP/1.1
      Host: example.com
      Accept: text/html"

  6. HTTP RESPONSE — "Here it is"
     "HTTP/1.1 200 OK
      Content-Type: text/html
      <html>Products page...</html>"

  7. RENDER — browser shows the page

  ALL OF THIS takes ~100-300ms on a good connection!
```

## 14.2 IP Address — Your Computer's Home Address

```
IP ADDRESS = unique identifier for every device on a network
  Just like a home address: "Flat 5, 123 Main St, District 1, HCMC"

IPv4: 192.168.1.100 (4 numbers, 0-255, separated by dots)
IPv6: 2001:db8::1  (newer, more addresses, not yet universal)

TWO TYPES:
  Private IP (inside your home/office network):
    192.168.x.x → most home networks
    10.x.x.x    → enterprise/cloud (AWS VPC, K8s pods)
    These are NOT reachable from the internet!

  Public IP (internet-facing):
    Your router has ONE public IP
    All devices share it via NAT (like an apartment building with one address)
    When you request google.com: your router tags the request with your device info,
    sends it out using the public IP, maps the reply back to you

LOCALHOST = 127.0.0.1
  Your own computer talking to itself
  "Call yourself" — no network involved
  http://localhost:8080 → your own app running on port 8080

PORT = which door to knock on
  IP = building address
  Port = apartment number
  192.168.1.100:8080 = knock on port 8080 at that IP
  Common ports: 80 (HTTP), 443 (HTTPS), 5432 (PostgreSQL), 6379 (Redis)
```

## 14.3 HTTP vs HTTPS — The Clear Difference

```
HTTP (port 80) = PLAIN TEXT, like sending a postcard
  Everyone along the route can READ and MODIFY your message
  Coffee shop WiFi owner → reads your request and response
  Your ISP → logs every URL you visit
  An attacker → injects ads into pages, steals login credentials!

  curl http://example.com
  → All data visible to anyone on the network

HTTPS (port 443) = ENCRYPTED, like a sealed letter in a safe
  Only YOU and the server can read the contents
  Even your ISP only sees: "talked to 93.184.216.34" (not which page)
  Certificate proves: you're talking to the REAL example.com
  (not a fake site set up by an attacker)

WHAT HTTPS GUARANTEES:
  Confidentiality: data is encrypted (AES-256 typically)
  Integrity:       data can't be modified in transit (HMAC)
  Authentication:  certificate proves server identity (CA signature)

WHAT HTTPS DOES NOT GUARANTEE:
  The server is honest (certificate just proves domain ownership)
  Your data is safe on the server
  Anonymity (ISP still sees IP address, timing, data volume)

SIMPLE TEST — is my connection secure?
  Look for 🔒 padlock in browser → HTTPS, certificate valid
  "Not Secure" warning → HTTP or bad certificate
  Certificate error (NET::ERR_CERT_INVALID) → possible MITM attack!

DEVELOPER RULE:
  Always use HTTPS in production. No exceptions.
  HTTP only acceptable for: localhost development, internal services on trusted network
```

## 14.4 Latency vs Bandwidth — Two Different Problems

```
ANALOGY: A highway

BANDWIDTH = width of the highway (how many lanes)
  More lanes = more cars per hour
  In networking: how many bits per second can travel
  Measured in: Mbps (megabits/second), Gbps (gigabits/second)
  Home internet: 100 Mbps, 1 Gbps
  Datacenter links: 10 Gbps, 100 Gbps

LATENCY = how far you have to drive (distance, speed of travel)
  Even if highway is huge, it still takes time to travel
  In networking: time for ONE bit to travel from A to B
  Measured in: milliseconds (ms)
  Same city: 1-5ms
  Cross-country: 20-80ms
  Asia ↔ Europe: 150-250ms
  Speed of light limit → physics, can't be fixed by money!

WHY BOTH MATTER:

  Large file download (1 GB):
    High bandwidth but high latency:
      Bandwidth 1 Gbps: 1 GB / 1 Gbps = 8 seconds (fast!)
      But first packet arrives after 200ms latency
    Low bandwidth but low latency:
      Bandwidth 10 Mbps: 1 GB / 10 Mbps = 800 seconds (slow!)
      First packet arrives after 5ms
    → For big files: BANDWIDTH is the bottleneck

  Small API call ("GET /user/1" → {"id":1,"name":"Khang"}):
    Response is only 100 bytes
    100 bytes at 1 Mbps = 0.0008s = near-instant
    But with 200ms latency: still takes ~200ms
    → For many small requests: LATENCY is the bottleneck!

  REAL-WORLD IMPACT:
    Web page with 80 resources (JS, CSS, images):
      HTTP/1.1: each resource = new connection = 80 × RTT latency!
      HTTP/2: ONE connection, multiplex all 80 → only 1 × RTT latency
      CDN: bring resources closer → reduce latency
      Gzip: compress files → reduce bandwidth needed

MEASURING LATENCY:
  ping google.com               # round-trip time (RTT)
  traceroute google.com         # hops + latency per hop
  curl -w "@curl-format.txt" https://example.com  # detailed timing breakdown
```

---

# 15. Practical HTTP — Inspecting Network Interactions

## 15.1 curl — Swiss Army Knife for HTTP

```bash
# ── BASIC REQUESTS ──
curl https://api.example.com/users              # GET request
curl -v https://api.example.com/users           # verbose (show headers!)
curl -s https://api.example.com/users | jq .    # silent + format JSON

# POST with JSON body:
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{"name":"Khang","email":"khang@example.com"}'

# PUT / PATCH / DELETE:
curl -X PUT https://api.example.com/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

curl -X DELETE https://api.example.com/users/1 \
  -H "Authorization: Bearer your-token"

# ── SHOWING RESPONSE DETAILS ──
curl -i https://api.example.com/users           # show response headers + body
curl -I https://api.example.com/users           # HEAD only (headers, no body)
curl -D - https://api.example.com/users -o /dev/null  # dump headers to stdout

# ── TIMING BREAKDOWN ──
curl -w "\n\nTiming:\n  DNS:        %{time_namelookup}s\n  Connect:    %{time_connect}s\n  TLS:        %{time_appconnect}s\n  TTFB:       %{time_starttransfer}s\n  Total:      %{time_total}s\n  Size:       %{size_download} bytes\n  HTTP code:  %{http_code}\n" \
  -s -o /dev/null https://api.example.com/users
# Timing:
#   DNS:        0.003s   ← DNS lookup
#   Connect:    0.025s   ← TCP handshake
#   TLS:        0.065s   ← TLS handshake
#   TTFB:       0.120s   ← Time to First Byte (server processing)
#   Total:      0.125s   ← Total
#   Size:       1524 bytes
#   HTTP code:  200

# ── FOLLOW REDIRECTS ──
curl -L https://example.com                     # follow 301/302 redirects
curl -v -L https://example.com 2>&1 | grep "< HTTP"  # see each redirect step

# ── AUTHENTICATION ──
curl -u username:password https://api.example.com    # Basic Auth
curl -H "Authorization: Bearer <token>" https://api.example.com
curl -H "X-API-Key: your-api-key" https://api.example.com

# ── USEFUL FLAGS ──
curl -k https://self-signed.example.com         # skip cert verification (DEV ONLY!)
curl --max-time 10 https://api.example.com      # 10 second total timeout
curl --connect-timeout 5 https://api.example.com  # 5 second connect timeout
curl -o /tmp/file.zip https://example.com/file.zip  # save to file
curl -C - -o /tmp/large.zip https://example.com/large.zip  # resume download

# ── DEBUGGING CURL OUTPUT ──
# Response with verbose (-v):
# * Trying 93.184.216.34:443...      ← TCP connect
# * Connected to example.com         ← connected
# * TLS handshake...                 ← TLS
# > GET /users HTTP/2                ← your request (> = sent)
# > Host: example.com
# > Authorization: Bearer ...
# >
# < HTTP/2 200                       ← server response (< = received)
# < content-type: application/json
# < cache-control: max-age=300
```

## 15.2 HTTP Status Codes — Complete Developer Guide

```
1xx — INFORMATIONAL
  100 Continue:      server received headers, client should send body
  101 Switching:     upgrading protocol (WebSocket handshake)

2xx — SUCCESS
  200 OK:            standard success (GET, POST returning data)
  201 Created:       resource created (POST → new user/order)
                     should include Location: /users/123 header
  202 Accepted:      async processing started (request queued, not done yet)
  204 No Content:    success, no body (DELETE, PUT with no response needed)
  206 Partial Content: range request (file download resume, video streaming)

3xx — REDIRECT
  301 Moved Permanently:  bookmark new URL, cache the redirect
                          http:// → https:// redirect (permanent)
  302 Found:              temporary redirect (don't update bookmarks)
  304 Not Modified:       conditional GET, browser serves from cache
                          (ETag/If-None-Match matched)
  307 Temporary Redirect: temporary, preserve HTTP method (POST stays POST)
  308 Permanent Redirect: permanent, preserve HTTP method

4xx — CLIENT ERROR (your fault!)
  400 Bad Request:        malformed request, invalid data
                          → check your JSON body, query params, headers
  401 Unauthorized:       not authenticated (missing/invalid token)
                          → send Authorization header or login first
  403 Forbidden:          authenticated but not authorized
                          → user doesn't have permission for this resource
  404 Not Found:          resource doesn't exist
                          → wrong URL, deleted resource, typo
  405 Method Not Allowed: wrong HTTP verb (POST to a GET-only endpoint)
  408 Request Timeout:    server waited too long for client request
  409 Conflict:           conflict with current state (duplicate email, version mismatch)
  410 Gone:               resource permanently deleted (use 404 if you don't track this)
  413 Payload Too Large:  request body too big (file upload limit)
  415 Unsupported Media:  wrong Content-Type (sent XML, server expects JSON)
  422 Unprocessable:      valid JSON but business logic validation failed
                          (e.g., invalid email format, out of range value)
  429 Too Many Requests:  rate limited → check Retry-After header
                          → implement backoff in your client

5xx — SERVER ERROR (their fault... or yours on the server side)
  500 Internal Server Error:  unhandled exception, bug in server code
                              → check server logs!
  501 Not Implemented:        endpoint exists but not implemented yet
  502 Bad Gateway:            reverse proxy got bad response from upstream
                              → upstream server crashed/overloaded
  503 Service Unavailable:    server overloaded or in maintenance
                              → check Retry-After header, implement retry
  504 Gateway Timeout:        reverse proxy waited too long for upstream
                              → upstream server too slow (DB query? external API?)
  507 Insufficient Storage:   disk full!

DEVELOPER QUICK DECISION:
  "Did my code or data cause it?"  → 4xx
  "Is the server broken?"          → 5xx
  "Am I not logged in?"            → 401
  "Am I logged in but no access?"  → 403
  "Wrong URL?"                     → 404
  "Duplicate data?"                → 409
  "Validation failed?"             → 422
  "Too fast?"                      → 429
```

## 15.3 HTTP Headers — Practical Reading Guide

```
REQUEST HEADERS (what browser/client sends):

Host: api.example.com                    ← which virtual host (REQUIRED in HTTP/1.1)
Content-Type: application/json           ← format of request body
Accept: application/json                 ← format client wants in response
Authorization: Bearer eyJhbGci...        ← authentication token
User-Agent: Mozilla/5.0 (...)            ← what's making the request
Accept-Encoding: gzip, br               ← client can handle compressed responses
Cache-Control: no-cache                  ← "give me fresh, don't use cache"
X-Request-ID: uuid-here                  ← trace ID for logging/debugging
If-None-Match: "abc123"                  ← send 304 if ETag unchanged
Origin: https://app.example.com          ← where the request came from (CORS)
Referer: https://app.example.com/page   ← page that initiated this request

RESPONSE HEADERS (what server sends back):

Content-Type: application/json; charset=utf-8  ← format of response body
Content-Length: 1024                            ← body size in bytes
Content-Encoding: gzip                          ← body is compressed
Cache-Control: public, max-age=3600             ← caching instructions
ETag: "abc123def456"                            ← content fingerprint (for conditional requests)
Location: /users/123                            ← (with 201/301/302) where to find resource
Set-Cookie: session=xyz; HttpOnly; Secure; SameSite=Strict
Strict-Transport-Security: max-age=31536000     ← HSTS (use HTTPS only)
X-Request-ID: uuid-here                         ← echo back trace ID
Access-Control-Allow-Origin: *                  ← CORS (who can access)
Retry-After: 60                                 ← (with 429/503) wait this many seconds
X-RateLimit-Remaining: 47                       ← how many requests left

READING BROWSER DEVTOOLS (Network tab):
  Name → URL path
  Status → HTTP status code (color: green=2xx, orange=3xx, red=4xx/5xx)
  Method → GET/POST/etc
  Type → document/xhr/fetch/script/image/font/stylesheet
  Size → transfer size / resource size (e.g., "1.2kB / 5.4kB" = compressed/uncompressed)
  Time → total request time
  Waterfall → visual timeline showing DNS, connect, TLS, wait (TTFB), download

Click a request → see:
  Headers tab → request + response headers
  Preview tab → formatted response body (JSON, image, etc.)
  Timing tab → breakdown: Queued, DNS Lookup, Initial connection, SSL, TTFB, Download
```

## 15.4 Common Networking Issues — Diagnose & Fix

```bash
# ── ISSUE 1: DNS FAILURE ──
# Error: "ERR_NAME_NOT_RESOLVED", "NXDOMAIN", "could not resolve host"

# Diagnose:
dig api.example.com                     # DNS lookup details
dig api.example.com +trace              # full resolution path (root → TLD → auth)
nslookup api.example.com                # simpler DNS lookup
nslookup api.example.com 8.8.8.8       # use Google's DNS to test

# Output to read:
# NXDOMAIN = domain doesn't exist (typo? DNS not propagated yet?)
# SERVFAIL = DNS server error (try different resolver)
# Connection timed out = resolver unreachable
# ; ANSWER SECTION: api.example.com. 300 IN A 93.184.216.34  ← this is what you want

# Check /etc/hosts first (takes priority over DNS!):
cat /etc/hosts | grep api.example.com   # any overrides?

# Common causes:
# → Typo in domain name
# → DNS record not created/propagated yet (wait up to 24-48h after change)
# → DNS server unreachable (check VPN, firewall)
# → Negative cache (old NXDOMAIN cached) → flush DNS cache:
#   Mac:    sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
#   Linux:  sudo systemd-resolve --flush-caches
#   Windows: ipconfig /flushdns


# ── ISSUE 2: CONNECTION TIMEOUT ──
# Error: "Connection timed out", "ETIMEDOUT", "ConnectException"
# Different from response timeout (server received request but didn't respond in time)

# Diagnose:
ping api.example.com                    # basic reachability (ICMP)
telnet api.example.com 443              # can you connect to port 443?
nc -zv api.example.com 443              # cleaner: ncat test port open
traceroute api.example.com              # where is the packet dying?

# Traceroute output:
# 1. 192.168.1.1 (your router) - 2ms
# 2. 10.0.0.1 (ISP) - 5ms
# 3. * * * (timeout - firewall blocking ICMP)
# 4. 93.184.216.34 (destination) - 25ms
# * * * = packet not reaching that hop (firewall, unreachable)

# Common causes:
# → Server IP is wrong
# → Server is down
# → Firewall blocking port (check with nc/telnet)
# → VPN required (try connecting to VPN first)
# → Wrong port number

# In code — connect timeout vs read timeout:
# connect timeout: time to establish TCP connection (usually 3-10s)
# read timeout: time waiting for server to START responding (10-30s)
# socket timeout: time between data packets during response

# Java RestTemplate example:
HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
factory.setConnectTimeout(5_000);     // 5s to connect
factory.setConnectionRequestTimeout(1_000); // 1s from connection pool
factory.setReadTimeout(30_000);       // 30s waiting for response


# ── ISSUE 3: CORS ERRORS ──
# Browser error: "Access to fetch at 'https://api.example.com' from origin 
#   'https://app.example.com' has been blocked by CORS policy"
# NOTE: CORS is BROWSER enforcement only! curl/Postman don't have CORS.

# Diagnose:
curl -v -X OPTIONS https://api.example.com/users \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization"
# Check response for Access-Control-Allow-* headers

# What you need in response for CORS to work:
# Access-Control-Allow-Origin: https://app.example.com  (or *)
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization
# (If using cookies: Access-Control-Allow-Credentials: true
#  AND Access-Control-Allow-Origin MUST be specific, not *)

# Spring Boot fix:
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://app.example.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}

# Common CORS mistakes:
# → Wildcard (*) with allowCredentials(true) → browser rejects!
# → Missing OPTIONS preflight handling
# → Case-sensitive origin mismatch (http vs https, trailing slash)
# → Only some paths have CORS headers (config not applied globally)


# ── ISSUE 4: SSL/TLS ERRORS ──
# Error: NET::ERR_CERT_INVALID, CERTIFICATE_VERIFY_FAILED, SSL handshake failure

# Diagnose:
openssl s_client -connect api.example.com:443 -servername api.example.com
# Shows: certificate chain, expiry, cipher suite used
# Look for: "Verify return code: 0 (ok)" = valid cert
#           "Verify return code: 18 (self signed certificate)" = self-signed (dev)
#           "Verify return code: 20 (unable to get local issuer certificate)" = broken chain

curl -v https://api.example.com 2>&1 | grep -E "SSL|TLS|cert|verify"

# Check cert expiry:
echo | openssl s_client -connect api.example.com:443 2>/dev/null | openssl x509 -noout -dates
# notAfter=Apr 15 12:00:00 2025 GMT  ← when cert expires

# Common causes:
# → Certificate expired (not auto-renewed by certbot)
# → Domain mismatch (cert for api.example.com, connecting to api2.example.com)
# → Self-signed cert in production (don't!)
# → Broken certificate chain (intermediate CA missing)
# → System clock wrong (cert "not yet valid")


# ── ISSUE 5: 502/504 BAD GATEWAY / GATEWAY TIMEOUT ──
# Your reverse proxy (nginx, load balancer) got bad/no response from backend

# What it means:
# 502 = backend responded with garbage / crashed
# 504 = backend didn't respond in time (default nginx timeout: 60s)

# Check nginx error log:
tail -f /var/log/nginx/error.log | grep -E "502|504|upstream"
# Common: "upstream prematurely closed connection"
#         "upstream timed out (110: Connection timed out)"

# Check backend directly (bypassing nginx):
curl http://localhost:8080/api/health      # direct to app (not through nginx)
ss -tlnp | grep 8080                      # is app listening?

# Common causes:
# → App crashed (check: systemctl status myapp, journalctl -u myapp)
# → App overloaded / GC pause causing timeout
# → Database query too slow → app can't respond in time → 504
# → App running but not yet healthy after deploy → readiness probe failing
```

---

# 16. CDN — Content Delivery Networks

## 16.1 What is a CDN and Why?

```
PROBLEM without CDN:
  Your server: Ho Chi Minh City (Vietnam)
  User in Paris, France: 200ms latency just for physical distance
  User in São Paulo, Brazil: 300ms latency
  → Static assets (CSS, JS, images) fetched from HCMC every time → SLOW!

CDN SOLUTION:
  Distributed network of servers around the world ("edge servers" or "PoPs")
  Your content COPIED to servers in 50-300 locations worldwide
  User gets content from NEAREST server → latency drops dramatically

  User in Paris → CDN edge in Paris → 5ms instead of 200ms!
  User in São Paulo → CDN edge in São Paulo → 8ms instead of 300ms!

CDN PoP (Point of Presence) LOCATIONS:
  Major CDNs (Cloudflare, Fastly, Akamai, AWS CloudFront, Google Cloud CDN)
  have edge servers in:
    Every major city, university, ISP network
    Cloudflare: 300+ cities, 100+ countries (2024)
    Akamai: 4,000+ PoPs (largest)
    AWS CloudFront: 600+ PoPs

HOW CDN WORKS:
  1. You configure CDN: "cdn.example.com serves content from origin.example.com"
  2. User requests: https://cdn.example.com/app.js
  3. DNS resolves cdn.example.com → nearest CDN edge server IP (anycast routing)
  4. Edge server checks cache:
     HIT:  returns cached content directly (no origin contact!)
     MISS: fetches from your origin server, caches it, returns it
  5. Next user request → HIT → instant from edge!
```

## 16.2 What CDNs Cache and How

```
WHAT CDNS CACHE:
  ✅ Static assets: JavaScript, CSS, images, fonts, PDFs, videos
  ✅ Cacheable API responses (with proper Cache-Control)
  ✅ HTML pages (for static sites)
  ❌ Usually NOT cached: authenticated requests, POST/PUT/DELETE, real-time data

CDN CACHE BEHAVIOR — controlled by HTTP headers:

  Server response header → CDN reads it → decides whether/how to cache

  Cache-Control: public, max-age=31536000, immutable
  → CDN caches this for 1 year (31536000s), never revalidate
  → Use for: static assets with hash in filename (app.a1b2c3.js)

  Cache-Control: public, max-age=3600
  → CDN caches for 1 hour, then re-fetches from origin
  → Use for: semi-static content that changes occasionally

  Cache-Control: no-store
  → CDN NEVER caches this
  → Use for: sensitive data, real-time data, authenticated responses

  Cache-Control: private
  → Browser can cache but CDN CANNOT (personal user data)

  Vary: Accept-Encoding
  → CDN keeps separate cache entries per encoding (gzip vs brotli vs none)

CDN CACHE KEY:
  Default key = URL (scheme + host + path + query string)
  Different URL = different cache entry
  
  Customization:
  → Ignore certain query params (tracking: ?utm_source=email → same cached content)
  → Vary by header (Accept-Language → different cache per language)
  → Vary by Cookie (logged-in vs logged-out content)

CDN INVALIDATION (clearing old cache):
  1. URL-based purge: "purge /api/products" → removes that URL from all edges
  2. Tag-based: tag responses with "product-123", purge all tagged
  3. Versioning: deploy new URL (app.v2.js) → old URL still valid, new URL fresh
  4. TTL expiry: just wait for max-age to expire (simplest!)
```

## 16.3 CDN for Performance — Real Impact

```
MEASURING CDN IMPACT:
  Without CDN (HCMC server, user in Frankfurt):
    DNS:        ~2ms
    TCP connect: ~180ms (physical RTT Asia ↔ Europe)
    TLS:         ~360ms (2 round trips × 180ms)
    TTFB:        ~400ms
    Download:    depends on file size and bandwidth
    → TOTAL for 100KB JS file: ~600ms just for first byte!

  With CDN (Frankfurt edge, user in Frankfurt):
    DNS:        ~2ms
    TCP connect: ~5ms (same city!)
    TLS:        ~10ms
    TTFB:       ~15ms (content already at edge)
    Download:   ~5ms for 100KB at 1Gbps
    → TOTAL: ~35ms! (17x improvement!)

KEY CDN PERFORMANCE FEATURES:
  1. Anycast routing: CDN DNS returns nearest PoP IP automatically
  2. HTTP/2 and HTTP/3: CDN supports modern protocols even if origin doesn't
  3. TLS offloading: CDN terminates TLS at edge (close to user)
  4. Compression: CDN compresses before sending (gzip/brotli)
  5. Connection pooling: CDN maintains persistent connection to origin
     (many edge requests → one connection to origin = less load on you)
  6. TCP optimization: CDN uses tuned TCP settings for performance

CDN AS SECURITY SHIELD:
  DDoS protection: CDN absorbs traffic (100+ Gbps capacity)
  WAF (Web Application Firewall): filter malicious requests at edge
  Bot protection: detect and block scraper bots
  Origin hiding: real server IP is unknown (CDN proxies everything)
  Rate limiting at edge: 1000 req/s limit before reaching your server

CLOUDFRONT EXAMPLE (AWS):
  // CloudFormation / Terraform config
  Distribution:
    Origins: your S3 bucket or EC2
    DefaultCacheBehavior:
      ViewerProtocolPolicy: redirect-to-https
      CachePolicyId: !Ref MyCachePolicy
      MinTTL: 0
      DefaultTTL: 86400    # 1 day
      MaxTTL: 31536000     # 1 year
    PriceClass: PriceClass_100  # North America + Europe only (cheapest)
    PriceClass: PriceClass_All  # Global (most expensive but best coverage)
    HttpVersion: http2and3
    IPV6Enabled: true
```

---

# 17. Retry Logic, Timeouts & Network-Aware Code

## 17.1 Timeout Strategy — Every Network Call Needs One

```java
// TYPES OF TIMEOUTS:

// 1. CONNECTION TIMEOUT: time to establish TCP connection
//    Should be short (1-5s) — if server unreachable, fail fast!

// 2. READ/SOCKET TIMEOUT: time waiting for server to START responding
//    Depends on operation: fast API = 5-10s, heavy report = 60s

// 3. RESPONSE TIMEOUT (total): maximum total time for entire request
//    Safety net: 30-120s depending on SLA requirements

// Java HTTP Client (Java 11+):
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(5))     // TCP connect
    .build();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users"))
    .timeout(Duration.ofSeconds(30))           // total request timeout
    .GET()
    .build();

// Spring WebClient (reactive):
WebClient webClient = WebClient.builder()
    .baseUrl("https://api.example.com")
    .clientConnector(new ReactorClientHttpConnector(
        HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5_000)  // connect
            .responseTimeout(Duration.ofSeconds(30))               // response
    ))
    .build();

// Apache HttpClient (RestTemplate backing):
RequestConfig config = RequestConfig.custom()
    .setConnectionRequestTimeout(Timeout.ofSeconds(1))   // from pool
    .setConnectTimeout(Timeout.ofSeconds(5))             // TCP connect
    .setResponseTimeout(Timeout.ofSeconds(30))           // response
    .build();

// TIMEOUT VALUES GUIDELINES:
// Fast health check: 1-3s total
// Typical REST API: 5-30s (connect: 3s, read: 10s)
// File upload/download: 60-300s (large data transfer)
// Database query: depends on query (short: 5s, complex report: 60s)
// External payment API: 30-60s (high latency acceptable, don't interrupt payment)

// WHAT HAPPENS WHEN TIMEOUT FIRES:
// Java: SocketTimeoutException (read), ConnectException (connect)
// Spring: ResourceAccessException wrapping SocketTimeoutException
// WebClient: WebClientRequestException → TimeoutException
// → You MUST handle these! Don't let timeout bubble to user as 500 error!

try {
    User user = userApiClient.getUser(id);
    return user;
} catch (ResourceAccessException e) {
    if (e.getCause() instanceof SocketTimeoutException) {
        throw new ExternalServiceTimeoutException("User service timed out", e);
    }
    throw new ExternalServiceException("User service unavailable", e);
}
```

## 17.2 Retry Logic — When and How

```java
// WHEN TO RETRY:
// ✅ RETRY: transient failures (network blip, brief unavailability)
//   5xx errors (server errors — server may recover)
//   503 Service Unavailable (server overloaded, might recover)
//   504 Gateway Timeout (backend slow but might succeed next time)
//   Connection timeout (transient network issue)
//   SocketTimeoutException (slow server, might be faster next try)

// ❌ DON'T RETRY: permanent failures or non-idempotent failures
//   4xx errors (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422)
//   → These won't change on retry!
//   409 Conflict (stale data — need fresh data, not retry)
//   POST that already succeeded (non-idempotent → duplicate!!)
//   Business logic errors

// ── BASIC RETRY WITH EXPONENTIAL BACKOFF ──
public <T> T retry(Supplier<T> operation, int maxAttempts) {
    int attempt = 0;
    while (attempt < maxAttempts) {
        try {
            return operation.get();
        } catch (TransientException e) {
            attempt++;
            if (attempt >= maxAttempts) throw e;

            // Exponential backoff: 1s, 2s, 4s, 8s...
            long delayMs = (long) Math.pow(2, attempt) * 1000;
            // + JITTER: random 0-1000ms added (CRITICAL! prevents thundering herd)
            // Jitter: when many clients all retry at same time → surge of requests
            long jitter = ThreadLocalRandom.current().nextLong(0, 1000);
            long sleepMs = delayMs + jitter;

            log.warn("Attempt {} failed, retrying in {}ms: {}", attempt, sleepMs, e.getMessage());
            Thread.sleep(sleepMs);
        }
    }
    throw new MaxRetriesExceededException();
}

// USAGE:
User user = retry(() -> userApiClient.getUser(id), 3);

// ── SPRING RETRY (@Retryable) ──
@Service
public class PaymentService {

    @Retryable(
        value = {RestClientException.class, ResourceAccessException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2, random = true)
        // delay=1s, multiplier=2: 1s → 2s → 4s (with random jitter)
    )
    public PaymentResult charge(ChargeRequest req) {
        return paymentGateway.post("/charge", req);
    }

    @Recover
    public PaymentResult handlePaymentFailure(RestClientException e, ChargeRequest req) {
        log.error("Payment failed after retries: {}", req.getOrderId());
        // Queue for manual processing or return failure
        return PaymentResult.failed("Service temporarily unavailable");
    }
}

// ── RESILIENCE4J (more control) ──
RetryConfig retryConfig = RetryConfig.custom()
    .maxAttempts(3)
    .waitDuration(Duration.ofSeconds(1))
    .intervalFunction(IntervalFunction.ofExponentialBackoff(1000, 2))
    .retryOnException(e -> e instanceof TimeoutException)
    .retryOnResult(response -> ((HttpResponse)response).getStatusCode() == 503)
    .ignoreExceptions(IllegalArgumentException.class)
    .build();

Retry retry = Retry.of("userService", retryConfig);
Supplier<User> decorated = Retry.decorateSupplier(retry, () -> userApi.getUser(id));
User user2 = Try.ofSupplier(decorated).recover(e -> User.anonymous()).get();

// ── IDEMPOTENCY KEY — safe retrying of non-idempotent operations ──
// POST /orders is not naturally idempotent (creates duplicate orders on retry!)
// Add idempotency key: server deduplicates by key
String idempotencyKey = UUID.randomUUID().toString(); // generate once per logical operation
OrderResponse response = orderClient.createOrder(request,
    Headers.of("Idempotency-Key", idempotencyKey));
// If request fails, retry with SAME idempotency key
// Server: if key seen before → return original response (don't create again)
// Result: safe to retry even POST requests!
```

## 17.3 HTTP Verb Best Practices

```
HTTP VERBS — when to use which:

GET:
  Purpose: retrieve resource (READ)
  Body: never (use query params instead)
  Safe: YES (no side effects)
  Idempotent: YES (same result every time)
  Cacheable: YES (by default)
  Examples:
    GET /users           → list all users
    GET /users/123       → get user 123
    GET /orders?status=pending&page=1  → filtered list

POST:
  Purpose: create resource or submit data (CREATE / ACTION)
  Body: YES (new resource data)
  Safe: NO (creates data)
  Idempotent: NO (calling twice creates two resources!)
  Cacheable: NO
  Examples:
    POST /users          → create new user
    POST /orders         → place new order
    POST /login          → submit login credentials
    POST /payments/process → trigger payment

PUT:
  Purpose: replace resource entirely (UPDATE/REPLACE)
  Body: YES (complete representation)
  Safe: NO
  Idempotent: YES (same result each time)
  Cacheable: NO
  Examples:
    PUT /users/123       → replace user 123 completely
    PUT /settings        → replace all settings

PATCH:
  Purpose: partial update (UPDATE/PARTIAL)
  Body: YES (only changed fields)
  Safe: NO
  Idempotent: depends on implementation
  Examples:
    PATCH /users/123 {"name": "New Name"}  → update only name
    PATCH /orders/456 {"status": "SHIPPED"}

DELETE:
  Purpose: remove resource (DELETE)
  Body: avoid (some servers ignore it)
  Safe: NO
  Idempotent: YES (deleting already-deleted = still not there)
  Examples:
    DELETE /users/123    → delete user 123
    DELETE /sessions/abc → logout

HEAD:
  Purpose: GET without body (metadata check)
  Use for: checking if resource exists, checking cache validity
  Examples:
    HEAD /files/large.pdf  → check file size (Content-Length) before downloading

OPTIONS:
  Purpose: check what methods are supported; CORS preflight
  Sent automatically by browser for CORS

COMMON MISTAKES:
  ❌ POST /users/123/delete   → use DELETE /users/123
  ❌ GET /users?action=delete → GET should NEVER have side effects!
  ❌ POST /getUser            → use GET /users/123
  ❌ POST /updateUser         → use PUT or PATCH /users/123
  ❌ Using POST for everything → breaks caching, RESTful conventions

REST RESOURCE NAMING:
  /users              collection
  /users/123          specific resource (use nouns, not verbs!)
  /users/123/orders   nested resource (user's orders)
  /orders?userId=123  filtered collection (alternative)
  
  Actions that don't fit CRUD:
  POST /payments/123/refund   ← action on resource (OK!)
  POST /users/123/activate    ← action on resource (OK!)
  POST /search                ← when GET has too many params (OK!)
```

## 17.4 Efficient Request Patterns & Caching Headers

```java
// ── CACHING HEADERS — getting this right ──

// For STATIC ASSETS (JS, CSS, images with hash in filename):
// app.a1b2c3.js, logo-v2.png
response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
// max-age=31536000 = 1 year in seconds
// immutable = browser/CDN: don't even revalidate, ever (unless URL changes)

// For FREQUENTLY UPDATED API responses:
response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
// max-age=60: fresh for 60s
// stale-while-revalidate=300: serve stale for up to 5 min while fetching fresh in background

// For SENSITIVE/USER-SPECIFIC data:
response.setHeader("Cache-Control", "private, no-store");
// private: only browser cache (not CDN/proxies)
// no-store: don't cache at all (most paranoid — for auth tokens, sensitive data)

// For HTML PAGES:
response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
// Don't cache the HTML itself (it references versioned JS/CSS)
// But DO cache the JS/CSS files referenced within it!

// ETAG — conditional requests (bandwidth saving):
// First request:
// Response: ETag: "v3-abc123"
// Browser caches + stores ETag
//
// Next request:
// Request: If-None-Match: "v3-abc123"
// Server: compares hash → if unchanged: 304 Not Modified (0 bytes body!)
//                       → if changed: 200 OK + new body + new ETag

// Spring Boot ETag filter (automatic!):
@Bean
public FilterRegistrationBean<ShallowEtagHeaderFilter> eTagFilter() {
    FilterRegistrationBean<ShallowEtagHeaderFilter> bean = new FilterRegistrationBean<>();
    bean.setFilter(new ShallowEtagHeaderFilter());
    bean.addUrlPatterns("/api/*");
    return bean;
}
// Spring auto-computes MD5 of response body → adds ETag header
// On conditional request → automatically returns 304 if unchanged

// ── CONNECTION POOLING (critical for performance!) ──
// Creating new TCP+TLS connection = 100-300ms overhead
// Reuse connections via connection pool!

// Apache HttpClient pool (used by Spring RestTemplate):
PoolingHttpClientConnectionManager connectionManager =
    new PoolingHttpClientConnectionManager();
connectionManager.setMaxTotal(200);          // max 200 total connections
connectionManager.setDefaultMaxPerRoute(20); // max 20 per host

CloseableHttpClient httpClient = HttpClients.custom()
    .setConnectionManager(connectionManager)
    .setKeepAliveStrategy((response, context) -> 30_000) // keep 30s
    .build();

// HTTP/2 — automatic multiplexing (even better than pooling!):
// HTTP/1.1: one request per connection (need pool of connections)
// HTTP/2:   multiple requests on SAME connection (multiplexing!)
// → With HTTP/2: fewer connections needed, less overhead
// WebClient uses HTTP/2 automatically when available:
HttpClient http2Client = HttpClient.create()
    .protocol(HttpProtocol.H2, HttpProtocol.HTTP11);  // prefer H2, fall back to HTTP/1.1

// ── REQUEST BATCHING (reduce round trips) ──
// BAD: 100 individual requests
for (Long userId : userIds) {
    User user = userApi.getUser(userId);  // 100 × RTT latency!
}

// GOOD: batch API (if server supports it)
List<User> users = userApi.getUsers(userIds);  // 1 request!

// GOOD: GraphQL (if available)
// { users(ids: [1,2,3,...,100]) { id name email } }  // 1 request!

// ── API PAGINATION — efficient large dataset ──
// Offset pagination (simpler, worse performance for large offsets):
GET /orders?page=5&size=20
// Server: SELECT * FROM orders OFFSET 100 LIMIT 20 (OFFSET scans 100 rows!)

// Cursor pagination (better for large data, infinite scroll):
GET /orders?after=order_id_last_seen&size=20
// Server: SELECT * FROM orders WHERE id > :cursor LIMIT 20 (uses index!)
// Response includes: { data: [...], nextCursor: "order_id_xyz", hasMore: true }
```

## 17.5 Resilience Patterns for Network Calls

```java
// ── CIRCUIT BREAKER — fail fast when service is down ──
// Without circuit breaker:
// All requests queue up waiting for timeout → your service degraded!
// With circuit breaker: after N failures → open circuit → fail immediately
// → Other services get fast failure, can use fallback

@Service
public class UserService {

    @CircuitBreaker(name = "userApi", fallbackMethod = "getUserFallback")
    @TimeLimiter(name = "userApi")  // timeout as circuit breaker
    public CompletableFuture<User> getUser(Long id) {
        return CompletableFuture.supplyAsync(() -> userApiClient.getUser(id));
    }

    public CompletableFuture<User> getUserFallback(Long id, Throwable ex) {
        log.warn("User service unavailable, using cached/default: {}", ex.getMessage());
        // Options:
        return CompletableFuture.completedFuture(
            cache.get(id)                    // 1. return stale cached value
            .orElse(User.anonymous())        // 2. return safe default
        );
        // 3. throw ServiceUnavailableException (let caller decide)
        // 4. queue for later (async)
    }
}

# Resilience4j config (application.yml):
resilience4j:
  circuitbreaker:
    instances:
      userApi:
        slidingWindowSize: 10        # last 10 calls
        failureRateThreshold: 50     # 50% failure → OPEN
        waitDurationInOpenState: 30s # stay OPEN for 30s, then HALF_OPEN
        permittedNumberOfCallsInHalfOpenState: 3
  timelimiter:
    instances:
      userApi:
        timeoutDuration: 5s

// ── BULKHEAD — limit concurrent calls to external service ──
// Without bulkhead: slow external service captures ALL your threads
// With bulkhead: limit threads used for one service
@Bulkhead(name = "userApi", type = Bulkhead.Type.THREADPOOL)
public User getUser(Long id) {
    return userApiClient.getUser(id);
}

resilience4j:
  bulkhead:
    instances:
      userApi:
        maxConcurrentCalls: 10    # max 10 concurrent calls to user API
        maxWaitDuration: 500ms    # wait 500ms for slot, else reject

// ── FALLBACK STRATEGIES (ranked by preference) ──

// 1. CACHE: return stale data (often good enough!)
User user3 = cache.getIfPresent(userId);
if (user3 != null) return user3;  // stale but functional

// 2. DEFAULT VALUE: safe empty/anonymous state
return User.builder().id(userId).name("Unknown").anonymous(true).build();

// 3. QUEUE: defer non-critical work
notificationQueue.add(new DeferredNotification(userId, message));
return Response.accepted("Notification queued");

// 4. DEGRADE GRACEFULLY: return partial data
OrderResponse order = new OrderResponse(orderId, status);
// user details failed → return order without user details
// (better than failing the entire request!)

// 5. FAIL FAST: throw clear exception
throw new ServiceUnavailableException("User service is currently unavailable. Try again later.");
// → API gateway returns 503 with Retry-After header

// ── GRACEFUL DEGRADATION EXAMPLE ──
public ProductPageResponse getProductPage(String productId, String userId) {
    ProductPageResponse response = new ProductPageResponse();

    // CRITICAL: must have product data
    response.setProduct(productService.getProduct(productId)); // throws if fails

    // NON-CRITICAL: enhance if available
    try {
        response.setRecommendations(recommendationService.get(userId, productId));
    } catch (Exception e) {
        log.warn("Recommendations unavailable: {}", e.getMessage());
        response.setRecommendations(List.of()); // empty = graceful
    }

    try {
        response.setReviews(reviewService.getTopReviews(productId, 5));
    } catch (Exception e) {
        log.warn("Reviews unavailable: {}", e.getMessage());
        response.setReviews(List.of()); // empty = graceful
    }

    return response; // returns with what we have, not all-or-nothing!
}
```

---

## 📎 Updated Quick Reference — Developer Focus

```
BASIC CONCEPTS:
  IP address:     your device's unique address on the network
  Port:           which door to knock (80=HTTP, 443=HTTPS, 5432=PostgreSQL)
  DNS:            translates example.com → 93.184.216.34
  HTTP:           text-based request/response protocol (readable by anyone!)
  HTTPS:          HTTP + TLS = encrypted (only you and server can read)
  Latency:        time for data to travel (physics-limited by distance)
  Bandwidth:      how much data per second (improvable by hardware)

INSPECT HTTP:
  curl -v URL              see all headers + timing
  curl -w "..." URL        detailed timing breakdown
  Browser DevTools         Network tab: status, headers, timing waterfall
  dig domain               DNS lookup
  traceroute domain        path packets take

STATUS CODES:
  2xx: success (200 OK, 201 Created, 204 No Content)
  3xx: redirect (301 permanent, 302 temporary, 304 not modified)
  4xx: YOUR error (400 bad request, 401 not authenticated, 403 forbidden,
                   404 not found, 429 rate limited)
  5xx: SERVER error (500 crash, 502 bad gateway, 503 unavailable, 504 timeout)

COMMON ISSUES:
  NXDOMAIN/DNS failure:   domain not found → check DNS record, flush cache
  Connection timeout:      can't reach server → firewall? wrong IP? server down?
  CORS:                   browser blocks cross-origin → add CORS headers to API
  SSL error:              bad/expired certificate → check cert, check system clock
  502/504:                reverse proxy got bad/no response → check app logs

CDN:
  Caches static assets at edge (near user) → dramatically lower latency
  Cache-Control: public, max-age=31536000  → CDN caches for 1 year
  Cache-Control: no-store                  → never cache (sensitive data)
  Cache-Control: private                   → browser only, not CDN
  CDN invalidation: purge by URL, or change filename (cache-busting)

RESILIENT CODE:
  Timeout:        always set connect + read timeouts (never infinite!)
  Retry:          5xx + timeouts → retry with exponential backoff + jitter
  No retry:       4xx errors (won't change), successful POST (duplicate!)
  Idempotency:    use Idempotency-Key header for safe POST retries
  Circuit breaker: after N failures → fail fast → use fallback
  Graceful degrade: return partial data when optional services fail
  Caching:        cache GET responses, validate with ETag/If-None-Match

HTTP VERBS:
  GET:    read, safe, idempotent, cacheable → no body
  POST:   create/action, NOT idempotent, NOT cacheable
  PUT:    replace entirely, idempotent
  PATCH:  partial update
  DELETE: remove, idempotent
```

---

*Học theo thứ tự: Plain English (14) → HTTP Status + Headers (15) → DNS + TLS → CDN (16) → Timeouts + Retry (17) → OSI Model → IP/Subnetting → TCP/UDP → Load Balancers → Security*
