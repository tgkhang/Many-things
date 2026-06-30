# ☁️ Cloud & Infrastructure — Các Khái Niệm Nền Tảng
>
> Không gắn với AWS hay Azure — hiểu đúng bản chất trước khi học tool cụ thể

---

## Mục Lục

1. [Cloud Là Gì — Bản Chất Thực Sự](#1-cloud-là-gì--bản-chất-thực-sự)
2. [Ảo Hóa — Nền Tảng Của Mọi Thứ](#2-ảo-hóa--nền-tảng-của-mọi-thứ)
3. [Container vs Virtual Machine](#3-container-vs-virtual-machine)
4. [Các Mô Hình Dịch Vụ — IaaS, PaaS, SaaS, FaaS](#4-các-mô-hình-dịch-vụ--iaas-paas-saas-faas)
5. [Networking Cơ Bản Trong Cloud](#5-networking-cơ-bản-trong-cloud)
6. [DNS — Hệ Thống Phân Giải Tên](#6-dns--hệ-thống-phân-giải-tên)
7. [Load Balancing](#7-load-balancing)
8. [CDN — Content Delivery Network](#8-cdn--content-delivery-network)
9. [Storage — Các Loại Lưu Trữ](#9-storage--các-loại-lưu-trữ)
10. [Scalability — Mở Rộng Hệ Thống](#10-scalability--mở-rộng-hệ-thống)
11. [High Availability và Fault Tolerance](#11-high-availability-và-fault-tolerance)
12. [Disaster Recovery — Khôi Phục Sau Thảm Họa](#12-disaster-recovery--khôi-phục-sau-thảm-họa)
13. [Service Mesh](#13-service-mesh)
14. [API Gateway](#14-api-gateway)
15. [Infrastructure as Code — Triết Lý](#15-infrastructure-as-code--triết-lý)

---

# 1. Cloud Là Gì — Bản Chất Thực Sự

Nhiều người nghĩ "cloud" là một thứ gì đó huyền bí. Thực ra đây là định nghĩa đơn giản nhất:

**Cloud là máy tính của người khác mà bạn thuê qua internet.**

Cụ thể hơn, cloud là mô hình cung cấp tài nguyên máy tính (compute, storage, network) theo yêu cầu, tính tiền theo mức dùng, và người dùng không cần quan tâm đến phần cứng bên dưới.

```
Trước cloud:
  Muốn chạy server → mua phần cứng → đặt trong datacenter
  → Trả tiền mua + điện + làm mát + nhân sự quản lý
  → Phải dự đoán nhu cầu từ 3-5 năm trước khi mua

Với cloud:
  Muốn chạy server → click hoặc gọi API → có ngay trong vài phút
  → Trả tiền theo giờ hoặc giây
  → Scale lên/xuống tùy nhu cầu thực tế
```

## 5 Đặc Điểm Định Nghĩa Cloud (NIST)

Tổ chức NIST định nghĩa cloud computing bằng 5 đặc điểm. Nếu thiếu bất kỳ đặc điểm nào thì không phải cloud thật sự.

**On-demand self-service** — tự phục vụ theo nhu cầu.
Bạn tự tạo server, database, network mà không cần gọi điện hay gửi email cho ai. Mọi thứ qua web console hoặc API.

**Broad network access** — truy cập qua mạng rộng.
Tài nguyên được truy cập qua internet từ bất kỳ thiết bị nào — laptop, điện thoại, máy tính bảng.

**Resource pooling** — gộp tài nguyên chung.
Nhiều khách hàng dùng chung cùng pool phần cứng vật lý, nhưng được cách ly logic với nhau. Bạn không biết và không cần biết server của bạn đang chạy trên máy vật lý nào.

**Rapid elasticity** — co giãn nhanh.
Tài nguyên có thể tăng hoặc giảm nhanh chóng, thậm chí tự động. Sáng thứ Hai traffic tăng 10x → tự động tăng server → tối thứ Sáu traffic giảm → tự động giảm server.

**Measured service** — đo lường và tính tiền theo mức dùng.
Bạn trả tiền cho đúng những gì bạn dùng. Không dùng không mất tiền.

---

# 2. Ảo Hóa — Nền Tảng Của Mọi Thứ

Để hiểu cloud, phải hiểu ảo hóa (virtualization) — công nghệ nền tảng cho phép một máy vật lý chạy nhiều "máy ảo" độc lập.

## Hypervisor — Người Quản Lý

Hypervisor là phần mềm trực tiếp quản lý phần cứng và tạo ra các máy ảo. Nó phân chia CPU, RAM, storage của máy vật lý thành các phần riêng biệt cho từng máy ảo.

```
Máy vật lý: 64 CPU cores, 512GB RAM, 10TB storage

Hypervisor chia thành:
  VM 1: 8 CPU, 64GB RAM, 500GB storage  → khách hàng A
  VM 2: 4 CPU, 32GB RAM, 200GB storage  → khách hàng B
  VM 3: 16 CPU, 128GB RAM, 2TB storage  → khách hàng C
  ...

Mỗi VM tin rằng mình có phần cứng riêng
Thực ra dùng chung phần cứng vật lý
```

**Type 1 Hypervisor** (Bare-metal): chạy thẳng trên phần cứng, không cần OS. Đây là loại dùng trong datacenter vì hiệu năng cao. Ví dụ: KVM, VMware ESXi, Xen.

**Type 2 Hypervisor** (Hosted): chạy như một ứng dụng trên OS. Thường dùng cho dev local. Ví dụ: VirtualBox, VMware Workstation.

## Tại Sao Ảo Hóa Là Nền Tảng Của Cloud

Không có ảo hóa, mỗi khách hàng cần một máy vật lý riêng. Không thể "tạo server trong 30 giây" hay "tắt server khi không dùng". Cloud provider dùng ảo hóa để:

- Bán nhiều VM từ một máy vật lý → hiệu quả chi phí
- Tạo/xóa VM trong giây → on-demand self-service
- Cách ly các khách hàng với nhau → security
- Di chuyển VM giữa các máy vật lý (live migration) → không downtime khi bảo trì

---

# 3. Container vs Virtual Machine

Container là bước tiến hóa tiếp theo sau VM. Cả hai đều cô lập ứng dụng, nhưng theo cách khác nhau.

## Virtual Machine

VM ảo hóa toàn bộ phần cứng — CPU, RAM, disk, network card. Mỗi VM có kernel OS riêng. Kết quả là VM khá nặng:

```
Startup time:  1-5 phút (phải boot cả OS)
Kích thước:    vài GB (OS + app + dependencies)
Overhead:      cao (mỗi VM chạy OS riêng)
Cách ly:       hoàn toàn (kernel riêng biệt)
```

## Container

Container ảo hóa ở tầng OS, không phải phần cứng. Tất cả container trên một host dùng chung kernel của host OS. Container chỉ chứa app và dependencies của nó.

```
Startup time:  vài giây đến vài mili-giây
Kích thước:    vài MB đến vài trăm MB
Overhead:      thấp (không chạy OS riêng)
Cách ly:       tốt nhưng không hoàn toàn như VM (chung kernel)
```

## So Sánh Trực Quan

```
Virtual Machine:
┌─────────────────────────────────────┐
│    App A    │    App B    │  App C   │
│  Libs/Deps  │  Libs/Deps  │ Libs/Deps│
│  Guest OS A │  Guest OS B │ Guest OS │
│  (Linux)    │  (Windows)  │ (Linux)  │
├─────────────────────────────────────┤
│           Hypervisor                │
├─────────────────────────────────────┤
│        Phần cứng vật lý            │
└─────────────────────────────────────┘

Container:
┌─────────────────────────────────────┐
│    App A    │    App B    │  App C   │
│  Libs/Deps  │  Libs/Deps  │ Libs/Deps│
├─────────────────────────────────────┤
│         Container Runtime           │
│    (Docker Engine, containerd)      │
├─────────────────────────────────────┤
│       Host OS (Linux kernel)        │
├─────────────────────────────────────┤
│        Phần cứng vật lý            │
└─────────────────────────────────────┘
```

## Khi Nào Dùng Cái Nào

Không phải container lúc nào cũng tốt hơn VM. Chúng giải quyết vấn đề khác nhau.

```
Dùng VM khi:
  Cần cách ly hoàn toàn (security yêu cầu cao)
  Cần chạy nhiều OS khác nhau (Windows + Linux trên cùng host)
  Legacy app không containerize được

Dùng Container khi:
  Microservices
  Cần khởi động nhanh và scale nhanh
  App đã được containerize
  CI/CD pipelines (build và test nhanh)

Thực tế: hay dùng cả hai
  Container chạy BÊN TRONG VM
  VM cung cấp cách ly phần cứng
  Container cung cấp hiệu quả và tốc độ
```

## Linux Namespaces và Cgroups — Bên Dưới Container

Container không phải magic. Dưới hood, container dùng 2 tính năng của Linux kernel:

**Namespaces** tạo ra "không gian riêng" cho mỗi container. Mỗi namespace cô lập một khía cạnh của hệ thống:

```
PID namespace:     container thấy process của mình là PID 1
                   không thấy processes của host hay container khác

Network namespace: container có network stack riêng
                   địa chỉ IP riêng, routing table riêng

Mount namespace:   container thấy filesystem riêng của mình
                   không thấy filesystem của host

User namespace:    UID/GID trong container map sang UID khác trên host
                   root trong container không phải root trên host
```

**Cgroups** (control groups) giới hạn tài nguyên mỗi container được dùng:

```
Container A: tối đa 2 CPU cores, 512MB RAM
Container B: tối đa 1 CPU core, 256MB RAM

Nếu Container A cố dùng nhiều hơn → kernel throttle lại
→ Container B không bị ảnh hưởng
```

---

# 4. Các Mô Hình Dịch Vụ — IaaS, PaaS, SaaS, FaaS

## IaaS — Infrastructure as a Service

Bạn thuê phần cứng ảo hóa. Provider quản lý phần cứng vật lý, bạn quản lý mọi thứ bên trên: OS, middleware, runtime, application.

```
Provider lo: datacenter, servers vật lý, network, cooling, power
Bạn lo: OS installation, patches, security, runtime, app deployment

Ví dụ generic: Virtual Machines, Virtual Networks, Block Storage

Phù hợp khi:
  Cần full control over OS và software stack
  Lift-and-shift từ on-premises lên cloud
  Workload đặc biệt cần cấu hình OS cụ thể
```

## PaaS — Platform as a Service

Provider quản lý cả OS và runtime. Bạn chỉ deploy code.

```
Provider lo: phần cứng + OS + runtime + middleware + scaling
Bạn lo: code của app và data

Ví dụ generic: Managed Kubernetes, Managed databases, App hosting platforms

Phù hợp khi:
  Muốn tập trung vào code, không quản lý infrastructure
  Team nhỏ, không có DevOps chuyên biệt
  Standard tech stack (Java, Python, Node.js)
```

## SaaS — Software as a Service

Phần mềm hoàn chỉnh được cung cấp qua internet. Bạn chỉ dùng, không manage gì.

```
Provider lo: tất cả (code, infra, maintenance, updates)
Bạn lo: dữ liệu của mình và cách dùng

Ví dụ: Gmail, Slack, Salesforce, GitHub
```

## FaaS — Function as a Service (Serverless)

Model mới nhất. Bạn deploy từng function riêng lẻ, không cần nghĩ đến server. Function chạy khi có event trigger, tắt khi không dùng. Tính tiền theo số lần gọi và thời gian chạy.

```
Không có server để manage
Không trả tiền khi không có request
Tự động scale từ 0 đến hàng triệu requests

Phù hợp khi:
  Event-driven workloads (xử lý upload, webhook)
  Traffic không đoán trước được
  Muốn serverless hoàn toàn

Không phù hợp khi:
  Long-running processes (thường giới hạn 15 phút)
  Cần state (mỗi invocation là stateless)
  Low-latency cực kỳ quan trọng (cold start)
```

## Mức Trách Nhiệm

```
                    On-Prem    IaaS      PaaS      SaaS
Application            ✍         ✍         ✍         ☁
Data                   ✍         ✍         ✍         ☁
Runtime                ✍         ✍         ☁         ☁
Middleware             ✍         ✍         ☁         ☁
OS                     ✍         ✍         ☁         ☁
Virtualization         ✍         ☁         ☁         ☁
Servers                ✍         ☁         ☁         ☁
Storage                ✍         ☁         ☁         ☁
Networking             ✍         ☁         ☁         ☁
Datacenter             ✍         ☁         ☁         ☁

✍ = Bạn quản lý    ☁ = Provider quản lý
```

---

# 5. Networking Cơ Bản Trong Cloud

## Virtual Network (VPC / VNet / VCN)

Trong cloud, network được ảo hóa giống như server. Bạn tạo **virtual network** — một mạng riêng ảo, cô lập với các khách hàng khác và với internet.

```
Virtual Network: 10.0.0.0/16  (65,536 địa chỉ IP)
├── Public Subnet:  10.0.1.0/24  (kết nối được với internet)
│   ├── Load Balancer
│   └── NAT Gateway
└── Private Subnet: 10.0.2.0/24  (không kết nối trực tiếp internet)
    ├── App Servers
    └── Database Servers
```

**Tại sao cần chia subnet public và private?**

Không phải mọi resource đều nên tiếp xúc với internet. Database không cần và không nên được truy cập từ internet. Chỉ load balancer cần IP public. App server và database trong private subnet, chỉ load balancer biết cách nói chuyện với chúng.

## CIDR Notation — Cách Ký Hiệu Dải IP

CIDR (Classless Inter-Domain Routing) ký hiệu một dải địa chỉ IP.

```
10.0.0.0/16 có nghĩa:
  10.0.0.0   = địa chỉ bắt đầu
  /16        = 16 bit đầu cố định, 16 bit sau linh hoạt
  → 2^16 = 65,536 địa chỉ IP (từ 10.0.0.0 đến 10.0.255.255)

10.0.1.0/24 có nghĩa:
  /24        = 24 bit cố định, 8 bit linh hoạt
  → 2^8 = 256 địa chỉ IP (từ 10.0.1.0 đến 10.0.1.255)

Số /XX càng lớn → dải IP càng nhỏ
  /8  = 16 triệu địa chỉ (rất rộng)
  /16 = 65,536 địa chỉ (vừa cho VPC)
  /24 = 256 địa chỉ (subnet)
  /32 = 1 địa chỉ (chính xác 1 IP)
```

## Security Groups và Firewall Rules

Security group là firewall ảo áp dụng tại tầng instance/VM. Bạn định nghĩa rule cho phép traffic nào vào và ra.

```
Inbound rules (traffic vào):
  Protocol  Port   Source
  TCP       443    0.0.0.0/0        → cho phép HTTPS từ bất kỳ đâu
  TCP       22     10.0.0.0/8       → cho phép SSH chỉ từ internal network

Outbound rules (traffic ra):
  Protocol  Port   Destination
  TCP       5432   10.0.2.0/24      → chỉ kết nối PostgreSQL trong private subnet
  TCP       443    0.0.0.0/0        → cho phép HTTPS ra ngoài (gọi external API)
```

---

# 6. DNS — Hệ Thống Phân Giải Tên

DNS (Domain Name System) là "danh bạ điện thoại" của internet. Nó chuyển tên miền con người đọc được (example.com) thành địa chỉ IP máy tính hiểu được (203.0.113.42).

## Quá Trình Phân Giải DNS

```
Browser muốn truy cập "api.example.com":

1. Kiểm tra local cache (đã từng truy cập chưa?)
   → Có: dùng luôn
   → Không: tiếp tục

2. Hỏi Recursive Resolver (DNS server của ISP hoặc 8.8.8.8 của Google)
   Resolver sẽ "đi hỏi thay" cho bạn

3. Resolver hỏi Root nameserver:
   "Ai quản lý .com?"
   → "TLD nameserver tại địa chỉ X"

4. Resolver hỏi TLD nameserver:
   "Ai quản lý example.com?"
   → "Authoritative nameserver tại địa chỉ Y"

5. Resolver hỏi Authoritative nameserver:
   "api.example.com là gì?"
   → "203.0.113.42"

6. Resolver trả về cho browser: "203.0.113.42"
7. Browser kết nối đến 203.0.113.42
```

Toàn bộ quá trình này thường mất 10-100ms và được cache lại theo TTL.

## DNS Record Types

```
A Record:      tên miền → địa chỉ IPv4
               api.example.com → 203.0.113.42

AAAA Record:   tên miền → địa chỉ IPv6
               api.example.com → 2001:db8::1

CNAME Record:  tên miền → tên miền khác (alias)
               www.example.com → example.com
               Hữu ích khi IP có thể thay đổi

MX Record:     chỉ định mail server cho domain
               example.com mail → mail.example.com

TXT Record:    text bất kỳ, thường dùng để verify domain ownership
               hoặc SPF/DKIM cho email

SRV Record:    chỉ định service, protocol, port và hostname
               _https._tcp.example.com → port 443 tại server X
```

## TTL — Time To Live

TTL (tính bằng giây) nói với resolver "cache câu trả lời này bao lâu".

```
TTL thấp (60s):
  Ưu: thay đổi IP → propagate nhanh (trong 1 phút)
  Nhược: nhiều DNS query hơn → tốn tài nguyên

TTL cao (86400 = 1 ngày):
  Ưu: ít DNS query, nhanh hơn cho user
  Nhược: thay đổi IP → cần đợi đến 24h để propagate

Chiến lược:
  Bình thường: TTL cao (3600-86400)
  Trước khi migration: giảm TTL xuống thấp (60-300)
  → Sau migration, tăng TTL trở lại
```

---

# 7. Load Balancing

Load balancer là thành phần phân phối traffic đến từ nhiều nguồn (clients) ra nhiều servers backend.

## Tại Sao Cần Load Balancer

```
Không có load balancer:
  Một server nhận tất cả traffic
  → Server quá tải → chậm, crash
  → Single point of failure: server die → service die

Với load balancer:
  Load balancer nhận request → forward đến server ít tải nhất
  → Phân tải đều
  → Nếu một server die → load balancer detect và dừng gửi traffic đến đó
```

## Layer 4 vs Layer 7 Load Balancing

Hai loại load balancer hoạt động ở tầng khác nhau trong TCP/IP model.

**Layer 4 (Transport Layer)** hoạt động ở tầng TCP/UDP. Nó chỉ thấy IP address và port, không hiểu nội dung request.

```
Client → LB (TCP level) → Server A hoặc Server B
LB chỉ biết: từ IP X, đến port 443
LB không biết: đây là request GET /api/users hay POST /api/orders

Ưu điểm: cực kỳ nhanh, throughput cao
Dùng khi: game servers, database load balancing, bất kỳ TCP traffic
```

**Layer 7 (Application Layer)** hiểu được HTTP/HTTPS. Có thể đọc nội dung request và route thông minh hơn.

```
LB đọc: HTTP method, URL path, headers, cookies

Route theo URL:
  /api/users/*  → User Service cluster
  /api/orders/* → Order Service cluster
  /static/*     → CDN hoặc Storage

Route theo header:
  User-Agent: Mobile → Mobile-optimized servers
  Accept-Language: vi → Vietnamese region servers

Sticky sessions: gửi cùng user đến cùng server (dựa trên cookie)

Ưu điểm: thông minh, linh hoạt
Dùng khi: web apps, microservices, API gateway
```

## Thuật Toán Phân Phối Traffic

```
Round Robin:
  Request 1 → Server 1
  Request 2 → Server 2
  Request 3 → Server 3
  Request 4 → Server 1 (vòng lại)
  Đơn giản nhất, phù hợp khi servers tương đương nhau

Least Connections:
  Gửi đến server đang có ít kết nối nhất
  Tốt hơn Round Robin khi requests có thời gian xử lý khác nhau

Weighted Round Robin:
  Server A: weight 3 → nhận 3/5 requests
  Server B: weight 2 → nhận 2/5 requests
  Dùng khi servers có capacity khác nhau

IP Hash:
  Hash IP của client → chọn server
  Cùng IP → cùng server (pseudo sticky)

Random:
  Chọn ngẫu nhiên, đơn giản và hoạt động tốt trong thực tế

Health Check:
  LB định kỳ ping servers (HTTP GET /health)
  Server không respond hoặc trả 5xx → loại khỏi pool
  Server recover → thêm lại vào pool
```

---

# 8. CDN — Content Delivery Network

CDN là mạng lưới các server được đặt ở nhiều vị trí địa lý trên thế giới. Thay vì user phải kết nối đến server gốc (có thể ở xa), họ kết nối đến CDN node gần nhất.

## Vấn Đề CDN Giải Quyết

```
Không có CDN:
  User ở Hà Nội truy cập website có server ở Frankfurt
  → Độ trễ: ~200ms (đường đi dài)
  → Nếu 1 triệu user cùng lúc → server gốc bị tải nặng

Với CDN:
  CDN có node ở Singapore (gần Hà Nội hơn)
  User ở Hà Nội → Singapore CDN node → độ trễ ~30ms
  CDN serve cached content → server gốc không bị tải
```

## Cách CDN Hoạt Động

```
Lần đầu tiên user request file.jpg:
  1. User → CDN node Singapore → CACHE MISS
  2. CDN Singapore → Origin Server Frankfurt → lấy file
  3. CDN Singapore lưu file vào cache
  4. CDN Singapore trả file về cho user

Lần tiếp theo (user khác ở cùng khu vực):
  1. User → CDN node Singapore → CACHE HIT
  2. CDN Singapore trả file từ cache ngay
  → Không cần đến Frankfurt, nhanh hơn nhiều!
```

## Cache Control — Kiểm Soát Caching

CDN hiểu HTTP cache headers từ origin server.

```
Cache-Control: public, max-age=86400
  → CDN và browser cache trong 86400 giây (1 ngày)

Cache-Control: public, max-age=31536000, immutable
  → Cache 1 năm, không bao giờ revalidate
  → Dùng cho assets có hash trong tên: main.a3f9b2.js

Cache-Control: no-store
  → Không cache ở đâu cả
  → Dùng cho API response có dữ liệu cá nhân

Cache-Control: no-cache
  → Cache nhưng luôn revalidate với server trước khi serve
  → Server trả 304 Not Modified nếu unchanged → tiết kiệm bandwidth
```

## CDN Không Chỉ Cho Static Files

Ngày nay CDN cũng handle:

- **Dynamic content**: cache API response theo query params
- **Edge computing**: chạy code logic tại CDN node (Cloudflare Workers, Fastly Compute)
- **DDoS protection**: CDN absorb attack traffic trước khi đến origin
- **SSL termination**: handle HTTPS tại CDN, giảm tải cho origin

---

# 9. Storage — Các Loại Lưu Trữ

Cloud cung cấp nhiều loại storage khác nhau, mỗi loại phù hợp cho use case khác nhau.

## Block Storage

Block storage giống như hard drive được gắn vào một VM. Bạn có thể format nó với bất kỳ filesystem nào và dùng như ổ đĩa thông thường.

```
Đặc điểm:
  Gắn vào một instance tại một thời điểm (thường)
  Low latency, high IOPS (phù hợp cho database)
  Phải format và mount trước khi dùng
  Dữ liệu persist khi instance bị xóa (nếu không xóa volume)

Dùng cho:
  OS disk của VM
  Database data files (MySQL, PostgreSQL)
  Bất kỳ app cần low-latency random I/O
```

## Object Storage

Object storage lưu trữ file như các "object" — mỗi object có ID duy nhất, metadata, và data. Truy cập qua HTTP API, không phải filesystem.

```
Đặc điểm:
  Unlimited capacity (scale đến petabytes)
  Truy cập qua HTTP: PUT, GET, DELETE
  Không thể mount như filesystem
  Không phù hợp cho random write (phải overwrite cả object)
  Highly durable (thường 11 nines: 99.999999999%)
  Rẻ hơn block storage nhiều

Dùng cho:
  Ảnh, video, documents
  Backup và archive
  Static website hosting
  Data lake cho analytics
  Logs và audit files
```

## File Storage / Network File System

Shared filesystem mà nhiều instances có thể mount và dùng đồng thời.

```
Đặc điểm:
  Nhiều instances mount cùng lúc
  Giao diện như filesystem thông thường (đọc/ghi file)
  Cao hơn block storage về latency (network overhead)
  Đắt hơn object storage

Dùng cho:
  Content management (nhiều web servers đọc chung file)
  Home directories trong môi trường HPC
  App cần shared state qua nhiều instances
```

## Chọn Storage Phù Hợp

```
Câu hỏi để chọn:

Cần low latency và random I/O? → Block storage
Cần share giữa nhiều servers? → File storage
Cần lưu large files, ít thay đổi? → Object storage
Cần archive lâu dài, truy cập hiếm? → Cold/Archive object storage
```

---

# 10. Scalability — Mở Rộng Hệ Thống

## Vertical Scaling — Scale Up

Tăng sức mạnh của một máy. Từ server 4 CPU/16GB RAM lên 16 CPU/64GB RAM.

```
Ưu điểm:
  Đơn giản — không cần thay đổi architecture
  Không vấn đề với stateful apps

Nhược điểm:
  Giới hạn phần cứng — không thể scale mãi
  Thường phải downtime để resize
  Single point of failure
  Đắt khi lên cao
```

## Horizontal Scaling — Scale Out

Thêm nhiều máy hơn vào pool.

```
Ưu điểm:
  Scale gần như vô hạn (thêm server)
  High availability — một server die, còn server khác
  Chi phí tuyến tính

Nhược điểm:
  App phải stateless (không lưu state trong memory)
  Cần load balancer
  Phức tạp hơn về operations
  Distributed systems problems (consistency, network partition)
```

## Auto Scaling — Scale Tự Động

Hệ thống tự động thêm hoặc bớt instances dựa trên metrics.

```
Trigger để scale out (thêm instance):
  CPU > 70% trong 5 phút
  Memory > 80%
  Request queue depth > 100
  Custom metric từ app

Trigger để scale in (bớt instance):
  CPU < 30% trong 15 phút
  Để không scale in/out liên tục: có cooldown period

Chiến lược:
  Reactive: scale khi metric đã vượt ngưỡng
  Predictive: dự đoán từ historical data và scale trước
  Scheduled: biết 9am có traffic spike → scale lên trước 8:45am
```

## Stateless vs Stateful — Điều Kiện Để Scale Ngang

Để scale ngang thật sự, app phải **stateless** — không lưu state trong bộ nhớ của từng instance.

```
Stateful (không scale ngang được):
  Instance A nhớ session của user
  Request tiếp theo đến Instance B → không tìm thấy session → logout!

Stateless (scale được):
  Session lưu trong Redis (external, shared)
  Bất kỳ instance nào đều đọc được session từ Redis
  Request đến instance nào cũng được
```

---

# 11. High Availability và Fault Tolerance

## High Availability (HA)

HA là khả năng hệ thống tiếp tục hoạt động dù có component bị lỗi. Đo bằng uptime percentage.

```
99%    = 87.6 giờ downtime/năm   (quá tệ)
99.9%  = 8.76 giờ downtime/năm  (acceptable cho internal tools)
99.99% = 52.6 phút downtime/năm (production workload)
99.999%= 5.26 phút downtime/năm (financial, critical systems)
```

## Redundancy — Xây Dựng Dự Phòng

HA đạt được bằng cách loại bỏ **Single Points of Failure (SPOF)** — bất kỳ component nào mà nếu fail sẽ làm toàn bộ hệ thống down.

```
Nhận diện SPOF:
  Một database (SPOF) → thêm replica, failover
  Một load balancer (SPOF) → active-passive hoặc active-active LB pair
  Một datacenter (SPOF) → multi-zone hoặc multi-region

Nguyên tắc: N+1 redundancy
  N = số instance cần thiết để xử lý traffic
  N+1 = luôn có thêm 1 instance dự phòng
  Nếu N instance có thể handle 100% traffic thì không đủ
  Cần N instance handle 100% traffic + 1 instance dự phòng
  → Khi 1 die, N còn lại vẫn handle được traffic
```

## Availability Zones — Cách ly Failure Domain

Availability Zone (AZ) là datacenter riêng biệt trong cùng một region. Chúng được thiết kế để fail độc lập với nhau — riêng nguồn điện, riêng network, riêng vật lý.

```
Region: Asia Pacific (ví dụ)
├── AZ-1: Datacenter ở quận A, đường điện A, ISP A
├── AZ-2: Datacenter ở quận B, đường điện B, ISP B
└── AZ-3: Datacenter ở quận C, đường điện C, ISP C

Thiết kế Multi-AZ:
  App servers: 2 instance ở AZ-1, 2 instance ở AZ-2, 2 instance ở AZ-3
  Database: primary ở AZ-1, replica ở AZ-2, replica ở AZ-3
  AZ-1 bị mất điện → AZ-2 và AZ-3 vẫn chạy → user không bị ảnh hưởng
```

## Active-Passive vs Active-Active

Hai mô hình redundancy phổ biến.

**Active-Passive**: Một component chính đang xử lý traffic, một component dự phòng chờ sẵn. Khi primary fail, secondary được kích hoạt (failover).

```
Ưu: đơn giản, không có conflict
Nhược: secondary lãng phí tài nguyên khi idle
       failover thường mất vài giây đến vài phút
Dùng cho: database primary-replica, stateful services
```

**Active-Active**: Tất cả component đều đang xử lý traffic.

```
Ưu: dùng hết tài nguyên, scale tốt hơn, failover gần như tức thì
Nhược: cần xử lý consistency (2 node cùng ghi dữ liệu)
Dùng cho: stateless web/app servers, load-balanced clusters
```

---

# 12. Disaster Recovery — Khôi Phục Sau Thảm Họa

HA xử lý failure nhỏ (một server die). Disaster Recovery (DR) xử lý thảm họa lớn hơn — cả datacenter mất điện, cả region bị ảnh hưởng bởi thiên tai.

## RPO và RTO — Hai Chỉ Số Quan Trọng Nhất

**RPO — Recovery Point Objective**: Tối đa bao nhiêu dữ liệu bạn chấp nhận mất?

```
RPO = 0:     không được mất bất kỳ dữ liệu nào
             → synchronous replication (mọi write phải confirm ở DR site)
             → đắt và ảnh hưởng performance

RPO = 1 giờ: chấp nhận mất tối đa 1 giờ dữ liệu
             → backup mỗi giờ hoặc async replication với lag < 1 giờ

RPO = 24 giờ: chấp nhận mất đến 1 ngày dữ liệu
              → daily backup, rẻ nhất
```

**RTO — Recovery Time Objective**: Hệ thống phải recover trong bao lâu?

```
RTO = 0:    zero downtime (không thực tế cho mọi failure)
RTO = 15 phút: cần tự động failover
RTO = 4 giờ:  team có thể manual recover trong giờ làm
RTO = 24 giờ: restore từ backup
```

## 4 Chiến Lược DR theo Chi Phí vs RTO/RPO

```
BACKUP AND RESTORE — Rẻ nhất, RTO/RPO cao nhất
  Backup data định kỳ lên storage khác region
  Khi disaster: tạo infrastructure mới, restore từ backup
  RTO: vài giờ đến vài ngày
  RPO: từ thời điểm backup cuối cùng
  Chi phí: thấp (chỉ trả tiền storage)

PILOT LIGHT — Trung bình thấp
  Infrastructure tối thiểu luôn chạy ở DR site (chỉ data layer)
  App servers không chạy ở DR, chỉ có database replication
  Khi disaster: spin up app servers, route traffic
  RTO: 30 phút - 2 giờ
  RPO: vài phút (async replication)

WARM STANDBY — Trung bình cao
  Infrastructure thu nhỏ luôn chạy ở DR
  Có thể serve traffic nhưng chỉ một phần
  Khi disaster: scale up DR site, route full traffic
  RTO: vài phút
  RPO: gần zero (có thể vài giây lag)

ACTIVE-ACTIVE (MULTI-SITE) — Đắt nhất, RTO/RPO gần zero
  Full production chạy ở cả 2 region
  Traffic được phân phối (DNS routing)
  Disaster: chỉ route tất cả traffic về region còn lại
  RTO: gần zero (chỉ DNS propagation)
  RPO: gần zero (synchronous hoặc near-synchronous replication)
```

---

# 13. Service Mesh

## Vấn Đề Khi Microservices Gọi Nhau

Trong hệ thống microservices, service A gọi service B, B gọi C, C gọi D. Mỗi service cần xử lý:

```
Retry khi B timeout
Circuit breaker khi B bị lỗi liên tục
Load balancing giữa các instance của B
Mutual TLS để encrypt traffic giữa A và B
Distributed tracing để trace một request qua nhiều services
Rate limiting
```

Nếu mỗi service tự implement những thứ này → code lặp lại, khó consistent, phụ thuộc vào ngôn ngữ lập trình.

## Service Mesh Là Gì

Service mesh tách những mối quan tâm đó ra khỏi application code. Mỗi service có một **sidecar proxy** chạy bên cạnh. Tất cả network traffic đi qua sidecar, không qua trực tiếp.

```
Không có service mesh:
  Service A → (tự xử lý retry, TLS, LB) → Service B

Với service mesh:
  Service A → Sidecar A → (network) → Sidecar B → Service B
             ↑                                  ↑
             Sidecar lo retry, TLS, tracing      Sidecar lo authenticate A

Application code không biết gì về retry, TLS, circuit breaker
Sidecar proxy xử lý tất cả
```

## Data Plane và Control Plane

```
Data Plane:
  Các sidecar proxy (thường là Envoy)
  Thực sự xử lý traffic
  Apply policy từ control plane

Control Plane:
  Cấu hình và điều phối các sidecars
  Nơi bạn define: "Service A được phép gọi Service B"
  Push config xuống data plane

Ví dụ: Istio dùng Envoy làm data plane sidecar
        Istiod (control plane) quản lý Envoy configs
```

## Lợi Ích Của Service Mesh

```
Observability:
  Tự động distributed tracing cho mọi request
  Metrics cho mọi service-to-service call (latency, error rate)
  Không cần thêm code trong app

Security:
  Mutual TLS tự động giữa tất cả services
  Certificate rotation tự động
  Policy: "Service A không được gọi Database trực tiếp"

Traffic management:
  Canary deployment: 5% traffic đến version mới, 95% version cũ
  A/B testing dựa trên header
  Circuit breaker, retry, timeout — config, không cần code
```

---

# 14. API Gateway

## API Gateway Là Gì

API Gateway là entry point duy nhất cho tất cả client requests. Thay vì client phải biết địa chỉ của từng microservice, client chỉ cần biết API Gateway.

```
Không có API Gateway:
  Mobile app biết: user-service:8001, order-service:8002, product-service:8003
  → Client phải quản lý nhiều endpoints
  → Nếu services thay đổi địa chỉ → phải update client
  → Authentication phải implement ở mỗi service

Với API Gateway:
  Mobile app chỉ biết: api.example.com
  API Gateway:
    /api/users/*  → user-service
    /api/orders/* → order-service
    /api/products/* → product-service
  → Client chỉ một endpoint
  → Authentication tập trung tại Gateway
```

## Chức Năng Của API Gateway

```
Request Routing:
  Dựa trên URL path, method, header → route đến service phù hợp

Authentication & Authorization:
  Verify JWT token trước khi forward request
  Service không cần tự verify token nữa

Rate Limiting:
  Giới hạn request/giây theo IP, user, hoặc API key
  Trả về 429 khi vượt giới hạn

Request/Response Transformation:
  Chuyển đổi format: REST → gRPC
  Thêm/xóa headers
  Aggregate nhiều service calls thành một response

SSL Termination:
  Handle HTTPS tại Gateway
  Forward HTTP đến internal services (network nội bộ thường tin cậy hơn)

Caching:
  Cache response của common queries
  Giảm load cho services

Observability:
  Log tất cả requests và responses
  Metrics: latency, throughput, error rate
  Tập trung một chỗ
```

---

# 15. Infrastructure as Code — Triết Lý

## Vấn Đề Với Infrastructure Thủ Công

```
Môi trường được tạo thủ công qua web console:
  Không ai nhớ chính xác đã làm gì
  Dev environment và Production khác nhau không biết tại sao
  "Snowflake servers" — mỗi server đặc biệt riêng, không ai dám thay
  Không thể audit: ai thay đổi gì lúc nào?
  Disaster recovery: phải tạo lại từ đầu, nhớ là nhớ gì?
```

## Infrastructure as Code (IaC) Là Gì

IaC là phương pháp quản lý và provision infrastructure bằng code thay vì thao tác thủ công. Infrastructure được định nghĩa trong file text, lưu trong version control.

```
Code defines:
  Mạng nào được tạo
  Bao nhiêu server, cấu hình gì
  Firewall rules
  Database, cấu hình backup
  Load balancer, routing rules

Mọi thay đổi infrastructure → thay đổi code → code review → apply
→ Giống như workflow với application code
```

## Các Nguyên Tắc Cốt Lõi

**Idempotency** — áp dụng cùng code nhiều lần → kết quả giống nhau.

```
Chạy lần 1: tạo server, database, network
Chạy lần 2: không có gì thay đổi (đã tồn tại rồi)
Chạy lần 3: giống lần 2

→ Không sợ chạy nhiều lần, không tạo duplicate resources
```

**Declarative vs Imperative**

```
Imperative: chỉ định CÁC BƯỚC để đạt được mục tiêu
  Tạo server với cấu hình X
  Cài đặt software Y
  Cấu hình firewall Z

Declarative: chỉ định TRẠNG THÁI MONG MUỐN
  Tôi muốn: 3 server cấu hình X, software Y được cài, firewall Z
  Tool tự tính toán cần làm gì để đạt được trạng thái đó

Hầu hết IaC tools hiện đại là declarative:
  Terraform, Pulumi, CloudFormation, ARM templates
```

**Immutable Infrastructure** — thay vì update server đang chạy, tạo server mới với config mới và xóa server cũ.

```
Mutable (truyền thống):
  Server đang chạy → SSH vào → apt upgrade → restart service
  Dần dần server "drift" khỏi trạng thái ban đầu
  Hai server "giống nhau" dần trở nên khác nhau

Immutable:
  Muốn update → tạo AMI/image mới với version mới → deploy instance mới
  Route traffic sang instance mới → xóa instance cũ
  Mỗi instance là bản sao giống hệt nhau
  → Không bao giờ SSH vào production để thay đổi
```

## Drift Detection — Phát Hiện Sai Lệch

Khi ai đó thay đổi infrastructure thủ công (ngoài IaC), xảy ra "configuration drift". IaC tools có thể phát hiện:

```
terraform plan (ví dụ với Terraform):
  So sánh trạng thái mong muốn (code) vs trạng thái thực tế
  Hiển thị những gì khác nhau

Ví dụ output:
  ~ resource "server" "app" {
    ~ instance_type = "medium" → "large"  ← ai đó đã resize thủ công!
    }
  
  Plan: 0 to add, 1 to change, 0 to destroy
```

---

## Tóm Tắt

```
Virtualization:  nền tảng của cloud — chia phần cứng thành nhiều VM
Container:       nhẹ hơn VM, dùng Linux namespaces + cgroups
IaaS/PaaS/SaaS: càng managed → ít control → ít ops burden
Networking:      VPC = mạng ảo riêng, subnet public/private
DNS:             tên → IP, TTL kiểm soát cache
Load Balancing:  L4 (TCP) cho throughput, L7 (HTTP) cho smart routing
CDN:             cache content gần user, giảm latency và origin load
Storage:         Block = ổ cứng (DB), Object = files (S3), File = shared
Scalability:     Vertical = to hơn, Horizontal = nhiều hơn
HA:              loại bỏ SPOF, multi-AZ, redundancy
DR:              RPO = mất data tối đa, RTO = thời gian recovery
Service Mesh:    sidecar xử lý network concerns ngoài app code
API Gateway:     single entry point, authentication, routing
IaC:             infrastructure as code, declarative, idempotent
```
