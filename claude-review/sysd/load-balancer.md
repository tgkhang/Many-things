# ⚖️ Load Balancer — Toàn Tập
>
> Từ nguyên lý OSI đến triển khai thực tế production

---

## Mục Lục

1. [Tại Sao Cần Load Balancer](#1-tại-sao-cần-load-balancer)
2. [OSI Model — Nền Tảng Để Hiểu L4 vs L7](#2-osi-model--nền-tảng-để-hiểu-l4-vs-l7)
3. [Layer 4 Load Balancing](#3-layer-4-load-balancing)
4. [Layer 7 Load Balancing](#4-layer-7-load-balancing)
5. [Thuật Toán Phân Phối Traffic](#5-thuật-toán-phân-phối-traffic)
6. [Health Check — Phát Hiện Server Hỏng](#6-health-check--phát-hiện-server-hỏng)
7. [Session Persistence — Sticky Session](#7-session-persistence--sticky-session)
8. [SSL/TLS Termination](#8-ssltls-termination)
9. [Reverse Proxy vs Load Balancer](#9-reverse-proxy-vs-load-balancer)
10. [Load Balancer Chính Nó Cũng Cần High Availability](#10-load-balancer-chính-nó-cũng-cần-high-availability)
11. [Connection Draining — Tắt Server An Toàn](#11-connection-draining--tắt-server-an-toàn)
12. [DNS Load Balancing](#12-dns-load-balancing)
13. [Global Server Load Balancing](#13-global-server-load-balancing)
14. [Rate Limiting Tại Load Balancer](#14-rate-limiting-tại-load-balancer)
15. [Các Công Cụ Phổ Biến](#15-các-công-cụ-phổ-biến)
16. [Các Sai Lầm Thường Gặp](#16-các-sai-lầm-thường-gặp)

---

# 1. Tại Sao Cần Load Balancer

## Vấn Đề Của Một Server Đơn Lẻ

Hãy hình dung một ứng dụng web chỉ chạy trên một server duy nhất.

```
Vấn đề thứ nhất: Giới hạn năng lực xử lý
  Một server có giới hạn cứng: số CPU core, RAM, băng thông mạng
  Khi traffic tăng vượt quá khả năng xử lý của server đó
  → Request bị xếp hàng, response time tăng vọt
  → Cuối cùng server bị quá tải, không phản hồi được nữa

Vấn đề thứ hai: Single Point of Failure (SPOF)
  Server đó hỏng (phần cứng lỗi, OS crash, ứng dụng bị lỗi)
  → TOÀN BỘ dịch vụ ngừng hoạt động
  → Không có server dự phòng nào để tiếp nhận traffic

Vấn đề thứ ba: Không thể bảo trì mà không downtime
  Muốn deploy version mới, cần restart ứng dụng
  → Với một server duy nhất, restart đồng nghĩa với
    downtime — user không truy cập được trong lúc đó
```

## Load Balancer Giải Quyết Bằng Cách Nào

Load balancer là một thành phần đứng giữa client và một nhóm server backend, có nhiệm vụ phân phối traffic đến đến các server đó theo một chiến lược nhất định.

```
                    Client requests
                          │
                          ▼
                  ┌───────────────┐
                  │ Load Balancer │
                  └───────┬───────┘
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
       ┌─────────┐  ┌─────────┐  ┌─────────┐
       │Server A │  │Server B │  │Server C │
       └─────────┘  └─────────┘  └─────────┘

Giải quyết vấn đề năng lực:
  Traffic được CHIA RA nhiều server thay vì dồn vào một
  → Tổng năng lực xử lý = tổng năng lực của TẤT CẢ server
  → Cần thêm năng lực? Thêm server vào nhóm (horizontal scaling)

Giải quyết vấn đề SPOF:
  Load balancer liên tục kiểm tra (health check) xem
  server nào còn sống, server nào đã chết
  → Một server hỏng, load balancer TỰ ĐỘNG ngừng gửi
    traffic đến nó, chuyển hướng sang server còn lại
  → User không hề biết có sự cố xảy ra

Giải quyết vấn đề bảo trì:
  Muốn deploy version mới cho Server A:
  → Báo load balancer "tạm ngừng gửi traffic đến A"
  → Deploy version mới lên A một cách an toàn
  → Báo load balancer "A đã sẵn sàng, tiếp tục gửi traffic"
  → Lặp lại cho B, C... → ZERO DOWNTIME deployment
```

---

# 2. OSI Model — Nền Tảng Để Hiểu L4 vs L7

Để hiểu sự khác biệt giữa các loại load balancer, cần hiểu sơ lược về mô hình OSI — cách dữ liệu mạng được đóng gói qua nhiều tầng.

## Các Tầng Liên Quan Đến Load Balancing

```
Layer 7 — Application Layer
  Đây là tầng giao thức ứng dụng: HTTP, HTTPS, gRPC, WebSocket
  Chứa đầy đủ thông tin: URL path, HTTP headers, cookies,
  request body
  Load balancer ở tầng này HIỂU được nội dung của request

Layer 4 — Transport Layer
  Đây là tầng TCP/UDP
  Chỉ biết: source IP, source port, destination IP,
  destination port
  Load balancer ở tầng này KHÔNG hiểu nội dung bên trong
  gói tin, chỉ thấy "gói tin từ IP X port Y đến IP Z port W"
```

```
Một request HTTP thực tế khi đi qua mạng được đóng gói
như sau (đơn giản hóa):

┌─────────────────────────────────────────────────┐
│ Layer 4 (TCP) Header: source/dest IP, port      │
│  ┌──────────────────────────────────────────┐  │
│  │ Layer 7 (HTTP) Data:                      │  │
│  │   GET /api/users HTTP/1.1                 │  │
│  │   Host: example.com                       │  │
│  │   Cookie: session=abc123                  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

Load balancer L4 chỉ ĐỌC được phần khung bên ngoài
(IP, port) — không "mở" phần dữ liệu bên trong

Load balancer L7 ĐỌC được TOÀN BỘ, bao gồm cả URL path,
headers, cookie bên trong
```

---

# 3. Layer 4 Load Balancing

## Cách Hoạt Động

L4 load balancer đưa ra quyết định routing CHỈ DỰA VÀO thông tin ở tầng TCP/UDP — không hề "nhìn vào" nội dung của request.

```
Thông tin L4 load balancer có thể sử dụng:
  Source IP address (địa chỉ IP của client)
  Source port
  Destination IP address
  Destination port
  Giao thức (TCP hay UDP)

Load balancer KHÔNG biết:
  Đây là request GET hay POST
  URL đang truy cập là gì
  HTTP header chứa gì
  Có cookie gì trong request
```

## Hai Phương Thức Triển Khai L4

```
NAT Mode (Network Address Translation):
  Load balancer nhận gói tin, THAY ĐỔI địa chỉ đích
  thành địa chỉ của server backend được chọn
  Response từ server PHẢI ĐI NGƯỢC LẠI qua load balancer
  (để load balancer đổi địa chỉ nguồn lại thành chính nó
  trước khi trả về client)

  → Load balancer xử lý CẢ HAI CHIỀU traffic
    (cả request lẫn response)

Direct Server Return (DSR):
  Load balancer chỉ xử lý CHIỀU REQUEST
  Server backend trả lời TRỰC TIẾP về client,
  KHÔNG đi qua load balancer nữa

  → Giảm tải đáng kể cho load balancer (chỉ xử lý
    một chiều, thường response nặng hơn request nhiều,
    ví dụ tải file lớn, video streaming)
  → Yêu cầu cấu hình mạng phức tạp hơn (server backend
    cần được cấu hình đặc biệt để giả lập IP của
    load balancer khi trả lời)
```

## Đặc Điểm Của L4 Load Balancing

```
Ưu điểm:

  Hiệu năng CỰC CAO
  Vì không cần "mở" và phân tích nội dung gói tin,
  chỉ xử lý ở tầng network/transport
  → Có thể xử lý hàng triệu request/giây với độ trễ
    cực thấp (thường dưới 1 mili-giây overhead)

  Hỗ trợ MỌI giao thức dựa trên TCP/UDP
  Không chỉ HTTP — có thể load balance cho database
  connections, game server traffic, bất kỳ giao thức
  TCP/UDP nào

Nhược điểm:

  KHÔNG THỂ routing thông minh dựa trên nội dung
  Không thể làm: "route request có URL /api/* đến
  nhóm server A, /static/* đến nhóm server B"
  (vì L4 không biết URL là gì)

  KHÔNG THỂ thao tác với HTTP headers
  Không thêm/sửa/xóa header được (vì không đọc
  được nội dung)

  Một kết nối TCP thường được gán cố định cho
  MỘT server trong suốt thời gian kết nối đó tồn tại
  (do bản chất stateful của TCP)
```

## Khi Nào Dùng L4

```
Phù hợp khi:
  Cần hiệu năng tối đa, độ trễ tối thiểu
  (gaming server, tài chính giao dịch tần suất cao,
  streaming dữ liệu lớn)

  Giao thức KHÔNG PHẢI HTTP/HTTPS
  (database connection pooling, message queue, gRPC
  ở mức transport thuần)

  Cần static IP cố định cho client kết nối tới
  (nhiều L4 load balancer cung cấp IP cố định,
  trong khi L7 thường có IP động)

  Không cần routing thông minh dựa trên nội dung
  request — chỉ cần phân phối tải đơn giản
```

---

# 4. Layer 7 Load Balancing

## Cách Hoạt Động

L7 load balancer HIỂU ĐƯỢC nội dung của request ở tầng ứng dụng — nó thực sự "đọc" HTTP request, bao gồm method, URL path, headers, cookies, thậm chí có thể đọc cả request body.

```
Vì L7 load balancer hiểu nội dung, nó có thể đưa ra
quyết định routing THÔNG MINH HƠN NHIỀU:

Route dựa trên URL path:
  /api/users/*    → nhóm server User Service
  /api/orders/*   → nhóm server Order Service
  /static/*       → chuyển hướng đến CDN/object storage

Route dựa trên Host header (virtual hosting):
  app.example.com  → nhóm server Application
  api.example.com  → nhóm server API
  admin.example.com → nhóm server Admin Panel

Route dựa trên HTTP header tùy ý:
  Header "X-API-Version: v2" → server cluster mới
  Header "X-API-Version: v1" → server cluster cũ
  (hữu ích cho việc chuyển đổi version dần dần)

Route dựa trên cookie:
  Cookie "ab_test_group=B" → server nhóm B
  (dùng cho A/B testing)
```

## Khả Năng Bổ Sung Của L7

Vì có quyền truy cập đầy đủ vào nội dung request/response, L7 load balancer có thể làm nhiều thứ hơn việc routing đơn thuần.

```
Sửa đổi request/response:
  Thêm header (ví dụ: thêm X-Forwarded-For để server
  backend biết IP thực của client)
  Xóa header nhạy cảm trước khi forward đến backend
  Nén response (gzip) để giảm băng thông

Trả response trực tiếp KHÔNG cần đến backend:
  Redirect HTTP sang HTTPS
  Trả response tĩnh cố định (ví dụ: maintenance page)
  Chặn request không hợp lệ ngay tại load balancer
  (giảm tải cho backend)

Request aggregation / splitting:
  Một số implementation nâng cao có thể gộp nhiều
  request backend thành một response, hoặc tách
  một request thành nhiều cuộc gọi backend
```

## Đặc Điểm Của L7 Load Balancing

```
Ưu điểm:

  Routing CỰC KỲ THÔNG MINH dựa trên nội dung thực tế
  Hỗ trợ các pattern phức tạp: canary deployment,
  A/B testing, API versioning, microservices routing

  Có thể can thiệp sâu vào request/response
  (modify headers, compression, caching tại edge)

Nhược điểm:

  Hiệu năng THẤP HƠN L4 (vì phải "mở" và phân tích
  nội dung mỗi request — tốn CPU và thời gian xử lý
  nhiều hơn)

  Chỉ hỗ trợ giao thức ứng dụng cụ thể mà nó hiểu
  (chủ yếu HTTP/HTTPS, một số hỗ trợ thêm gRPC, WebSocket)
  Không dùng được cho giao thức TCP/UDP thuần tùy ý
```

## Khi Nào Dùng L7

```
Phù hợp khi:
  Ứng dụng web/API dựa trên HTTP/HTTPS (phần lớn
  ứng dụng hiện đại)

  Kiến trúc microservices — cần route request đến
  đúng service dựa trên URL path

  Cần các tính năng nâng cao: canary deployment,
  blue/green deployment, A/B testing dựa trên traffic
  splitting

  Cần SSL termination tập trung (sẽ giải thích ở
  phần sau)

Thực tế: phần lớn ứng dụng web hiện đại sử dụng L7
load balancer (như Nginx, HAProxy ở chế độ HTTP,
hoặc Application Load Balancer của các cloud provider)
vì sự linh hoạt nó mang lại vượt trội hơn overhead
hiệu năng trong hầu hết trường hợp thực tế
```

---

# 5. Thuật Toán Phân Phối Traffic

Load balancer cần một thuật toán để quyết định: với request tiếp theo, nên gửi đến server nào trong nhóm backend.

## Round Robin

```
Cách hoạt động: gửi request lần lượt, tuần tự,
quay vòng qua các server

Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A  (quay lại từ đầu)
Request 5 → Server B

Ưu điểm: đơn giản, dễ hiểu, phân phối đều về SỐ LƯỢNG
request cho mỗi server

Nhược điểm: KHÔNG quan tâm đến tải THỰC TẾ của
từng server
  Nếu một request xử lý nhanh (1ms), request khác
  xử lý chậm (1000ms) — Round Robin vẫn coi chúng
  "ngang nhau" về mặt phân phối
  → Server đang xử lý các request nặng có thể
    bị quá tải trong khi server khác nhàn rỗi
```

## Weighted Round Robin

```
Cách hoạt động: giống Round Robin nhưng mỗi server
có một "trọng số" (weight) khác nhau, server có
weight cao nhận nhiều request hơn theo tỷ lệ

Server A: weight 3
Server B: weight 1

→ Cứ 4 request thì 3 request đến A, 1 request đến B

Phù hợp khi:
  Các server có NĂNG LỰC PHẦN CỨNG khác nhau
  (server A có 16 core, server B chỉ có 4 core
  → A nên nhận nhiều traffic hơn theo tỷ lệ năng lực)
```

## Least Connections

```
Cách hoạt động: gửi request đến server đang có
SỐ LƯỢNG KẾT NỐI ĐANG HOẠT ĐỘNG ít nhất

Server A: đang xử lý 5 connection
Server B: đang xử lý 2 connection
Server C: đang xử lý 8 connection

→ Request tiếp theo gửi đến Server B
  (đang có ít connection nhất, có khả năng còn
  rảnh rỗi hơn các server khác)

Ưu điểm: phản ánh tải THỰC TẾ tốt hơn Round Robin
đặc biệt khi thời gian xử lý mỗi request KHÁC NHAU
đáng kể (một số request nhanh, một số chậm)

Phù hợp khi:
  Các request có thời gian xử lý KHÔNG ĐỀU
  (một số API trả về nhanh, một số cần xử lý lâu)
```

## Least Response Time

```
Cách hoạt động: kết hợp số lượng connection ĐANG HOẠT
ĐỘNG VỚI thời gian phản hồi TRUNG BÌNH gần đây
của mỗi server

Phức tạp hơn Least Connections nhưng phản ánh chính
xác hơn về hiệu năng THỰC TẾ hiện tại của từng server

Phù hợp khi:
  Cần độ chính xác cao trong việc cân bằng tải,
  đặc biệt khi server có hiệu năng dao động theo
  thời gian (do garbage collection, cache warming,
  hoặc tải từ tiến trình khác trên cùng máy)
```

## IP Hash

```
Cách hoạt động: tính toán hash từ IP của client,
dùng kết quả hash để xác định server cố định
sẽ phục vụ client đó

hash(client_IP) % số_lượng_server → chọn server

Đặc điểm quan trọng: CÙNG MỘT client IP sẽ LUÔN
LUÔN được route đến CÙNG MỘT server
(miễn là số lượng server trong nhóm không thay đổi)

Phù hợp khi:
  Cần một dạng "session affinity" đơn giản KHÔNG
  CẦN cookie (sẽ giải thích kỹ hơn ở phần Session
  Persistence)

Nhược điểm:
  Nếu nhiều client cùng đứng sau MỘT NAT gateway
  (chia sẻ cùng public IP — phổ biến trong mạng
  doanh nghiệp hoặc một số ISP), TẤT CẢ các client
  đó sẽ luôn route đến CÙNG MỘT server
  → Có thể gây mất cân bằng tải nghiêm trọng
```

## Random

```
Cách hoạt động: chọn ngẫu nhiên một server cho
mỗi request

Nghe có vẻ kém tinh vi, nhưng trong thực tế với
số lượng request đủ lớn, phân phối ngẫu nhiên
có xu hướng cân bằng khá tốt theo quy luật số lớn
(law of large numbers), và CỰC KỲ ĐƠN GIẢN để
triển khai (không cần lưu trạng thái nào về
server trước đó)

Một biến thể phổ biến: "Power of Two Choices"
  Chọn NGẪU NHIÊN hai server trong nhóm
  So sánh tải hiện tại của hai server đó
  Chọn server có tải THẤP HƠN trong hai server đó

  → Đạt hiệu quả cân bằng GẦN BẰNG Least Connections
    nhưng với chi phí tính toán THẤP HƠN NHIỀU
    (không cần theo dõi tải của TOÀN BỘ server trong
    nhóm, chỉ cần so sánh 2 server được chọn ngẫu nhiên)
```

# 6. Health Check — Phát Hiện Server Hỏng

## Tại Sao Health Check Là Trái Tim Của Load Balancer

Load balancer chỉ hữu ích nếu nó BIẾT server nào đang hoạt động bình thường, server nào đã chết hoặc đang gặp sự cố. Health check là cơ chế liên tục kiểm tra điều này.

```
Không có health check:
  Server B bị crash lúc 2 giờ sáng
  Load balancer KHÔNG BIẾT điều này
  → Vẫn tiếp tục gửi traffic đến Server B
  → Toàn bộ request đến Server B đều THẤT BẠI
  → User gặp lỗi liên tục cho đến khi có người
    phát hiện và can thiệp thủ công

Với health check:
  Load balancer định kỳ "hỏi thăm" từng server
  ("bạn có khỏe không?")
  Server B không phản hồi (hoặc phản hồi lỗi)
  → Load balancer TỰ ĐỘNG đánh dấu B là "unhealthy"
  → NGỪNG gửi traffic đến B ngay lập tức
  → Traffic được chuyển hết sang A và C
  → User KHÔNG hề bị ảnh hưởng (giả sử A, C đủ
    năng lực xử lý)
```

## Các Loại Health Check

```
TCP Health Check (đơn giản nhất):
  Load balancer thử mở một kết nối TCP đến server
  Kết nối thành công → coi là "healthy"
  Kết nối thất bại/timeout → coi là "unhealthy"

  Hạn chế: chỉ biết server có đang LẮNG NGHE port đó
  không, KHÔNG biết ứng dụng bên trong có hoạt động
  ĐÚNG không (ví dụ: server có thể nhận kết nối
  nhưng ứng dụng bên trong đã bị treo, không xử lý
  được request thực sự)

HTTP Health Check (phổ biến nhất cho web app):
  Load balancer gửi một HTTP request đến một endpoint
  cụ thể (thường là /health hoặc /healthz)
  Kiểm tra response code (thường mong đợi 200 OK)
  Có thể kiểm tra cả nội dung response

  Endpoint /health này thường được ứng dụng tự
  implement, có thể kiểm tra sâu hơn:
    Ứng dụng có kết nối được database không?
    Cache (Redis) có phản hồi không?
    Các dependency quan trọng khác có sẵn sàng không?

Custom/Script Health Check:
  Chạy một script tùy chỉnh để kiểm tra điều kiện
  phức tạp hơn (ví dụ: kiểm tra disk space còn đủ
  không, kiểm tra một process cụ thể có đang chạy không)
```

## Cấu Hình Health Check — Các Tham Số Quan Trọng

```
Interval (khoảng thời gian giữa các lần kiểm tra):
  Quá ngắn (ví dụ: mỗi 1 giây)
  → Tạo overhead không cần thiết, có thể làm
    server bận rộn xử lý health check thay vì
    request thực sự
  Quá dài (ví dụ: mỗi 5 phút)
  → Mất nhiều thời gian để PHÁT HIỆN server hỏng,
    trong lúc đó user vẫn gặp lỗi liên tục
  Giá trị phổ biến trong thực tế: 5-30 giây

Timeout (thời gian chờ phản hồi trước khi coi là fail):
  Nên ngắn hơn thời gian xử lý request bình thường
  một chút, nhưng đủ dài để tránh false positive
  do network jitter tạm thời

Healthy Threshold (số lần check THÀNH CÔNG liên tiếp
cần thiết để chuyển từ unhealthy → healthy):
  Tránh việc một server vừa mới khởi động lại,
  health check pass MỘT LẦN đã vội đưa vào phục vụ
  traffic ngay (có thể server cần warm-up thêm)

Unhealthy Threshold (số lần check THẤT BẠI liên tiếp
cần thiết để chuyển từ healthy → unhealthy):
  Tránh việc MỘT lần network glitch tạm thời
  đã loại bỏ một server hoàn toàn khỏe mạnh
  khỏi vòng quay

Ví dụ cấu hình thực tế:
  Interval: 10 giây
  Timeout: 5 giây
  Healthy threshold: 2 lần liên tiếp thành công
  Unhealthy threshold: 3 lần liên tiếp thất bại

  → Phải mất TỐI THIỂU 30 giây (3 lần × 10 giây)
    để phát hiện một server đã hỏng và loại nó ra
  → Phải mất TỐI THIỂU 20 giây (2 lần × 10 giây)
    để xác nhận một server đã hồi phục trước khi
    đưa lại vào phục vụ
```

## Health Check Endpoint Nên Kiểm Tra Gì

```
Đây là một thiết kế quan trọng thường bị bỏ qua —
endpoint /health nên trả lời CHÍNH XÁC câu hỏi:
"Tôi có sẵn sàng XỬ LÝ REQUEST THỰC SỰ không?"

Thiết kế ĐƠN GIẢN (chỉ kiểm tra process còn sống):
  GET /health → luôn trả 200 OK nếu process còn chạy
  
  Vấn đề: ứng dụng có thể đang chạy nhưng
  KHÔNG THỂ kết nối database → mọi request thực tế
  đều fail, nhưng health check vẫn báo "khỏe mạnh"!

Thiết kế TỐT HƠN (kiểm tra dependency quan trọng):
  GET /health:
    Kiểm tra kết nối database — còn sống không?
    Kiểm tra kết nối cache — còn sống không?
    Nếu TẤT CẢ OK → trả 200
    Nếu CÓ vấn đề → trả 503 Service Unavailable

  Cẩn thận: đừng kiểm tra QUÁ NHIỀU dependency
  không thiết yếu — nếu health check phụ thuộc vào
  MỘT dependency không quan trọng bị lỗi tạm thời,
  có thể khiến TOÀN BỘ server bị loại khỏi vòng quay
  một cách không cần thiết

Phân biệt Liveness và Readiness (khái niệm phổ biến
trong môi trường container/Kubernetes):
  Liveness: "Process có đang chạy bình thường không,
  hay cần được khởi động lại?"
  Readiness: "Server đã sẵn sàng nhận traffic chưa?"
  (có thể process còn sống nhưng CHƯA sẵn sàng,
  ví dụ đang trong giai đoạn khởi động, load cache...)
```

---

# 7. Session Persistence — Sticky Session

## Vấn Đề Cần Giải Quyết

Nhiều ứng dụng web lưu trạng thái phiên làm việc (session) NGAY TRÊN BỘ NHỚ của server xử lý request đó. Nếu load balancer phân phối các request của CÙNG MỘT user đến các server KHÁC NHAU, session đó sẽ không được nhận diện đúng.

```
Kịch bản gây vấn đề:

User đăng nhập, request đầu tiên đến Server A
  Server A lưu thông tin session ("user X đã đăng nhập")
  TRONG BỘ NHỚ của chính Server A

User thực hiện hành động tiếp theo (ví dụ: thêm vào giỏ hàng)
  Load balancer (dùng Round Robin) gửi request này
  đến Server B
  Server B KHÔNG BIẾT GÌ về session vừa được tạo
  ở Server A
  → User bị coi là "chưa đăng nhập" mặc dù vừa
    đăng nhập thành công!
```

## Giải Pháp 1: Sticky Session (Session Affinity)

```
Cách hoạt động: load balancer đảm bảo TẤT CẢ request
từ CÙNG MỘT user sẽ LUÔN được gửi đến CÙNG MỘT server
trong suốt phiên làm việc

Cơ chế phổ biến nhất: dùng Cookie
  Lần đầu tiên user kết nối, load balancer chọn
  một server (theo thuật toán bình thường)
  Load balancer chèn thêm một cookie đặc biệt
  vào response (ví dụ: SERVERID=server-A)
  Các request tiếp theo của user đó CÓ KÈM cookie này
  Load balancer ĐỌC cookie, biết user này thuộc
  về Server A → LUÔN route đến Server A

Ưu điểm: đơn giản, hoạt động tốt với ứng dụng
đã có sẵn (không cần thay đổi kiến trúc lưu session)

Nhược điểm:
  Nếu Server A hỏng, TOÀN BỘ session của user
  đang gắn với A bị MẤT (phải đăng nhập lại)
  Phân phối tải KHÔNG ĐỀU — nếu một nhóm user
  "dính" vào một server cụ thể tạo ra tải nặng
  hơn (ví dụ: nhiều request phức tạp), server đó
  bị quá tải trong khi server khác nhàn rỗi
  Gây khó khăn khi cần SCALE DOWN (giảm số lượng
  server) — không thể đơn giản tắt một server
  vì có user đang "dính" session vào đó
```

## Giải Pháp 2: Centralized Session Store (Khuyến Nghị)

```
Đây là giải pháp KIẾN TRÚC TỐT HƠN, giải quyết vấn
đề từ GỐC thay vì dựa vào load balancer

Cách hoạt động:
  KHÔNG lưu session trong bộ nhớ của TỪNG server
  Thay vào đó, lưu session vào một KHO LƯU TRỮ
  TẬP TRUNG (thường là Redis hoặc một database
  nhanh tương tự), mà TẤT CẢ server đều có thể
  truy cập

  User đăng nhập → Server A xử lý → LƯU session
  vào Redis (không lưu trong bộ nhớ riêng của A)

  Request tiếp theo, dù được route đến Server B,
  Server C, hay quay lại A → server đó ĐỌC session
  từ Redis → BIẾT NGAY user này đã đăng nhập

Ưu điểm:
  Load balancer có thể dùng BẤT KỲ thuật toán nào
  (kể cả Round Robin đơn giản) mà không lo về session
  Server nào hỏng cũng KHÔNG ảnh hưởng đến session
  của user (vì session không nằm TRONG server đó)
  Dễ dàng scale up/down số lượng server mà không
  ảnh hưởng đến session đang tồn tại

  Đây chính là khái niệm "stateless application server"
  đã được nhắc đến khi nói về Horizontal Scaling —
  giải pháp NÀY mới thực sự cho phép scale ngang
  một cách thoải mái, không phụ thuộc vào việc
  "dính" user vào một server cụ thể
```

```
Khuyến nghị thực tế:
  Với hệ thống MỚI, NÊN thiết kế stateless ngay
  từ đầu (dùng centralized session store)

  Sticky session chỉ nên coi là giải pháp TẠM THỜI
  hoặc dùng cho hệ thống LEGACY chưa thể refactor
  ngay, KHÔNG nên là lựa chọn kiến trúc lâu dài
  cho hệ thống mới
```

---

# 8. SSL/TLS Termination

## Khái Niệm

SSL/TLS Termination là việc xử lý quá trình mã hóa/giải mã HTTPS NGAY TẠI load balancer, thay vì để từng server backend tự xử lý việc này.

```
Không có SSL Termination (mỗi server tự xử lý HTTPS):

  Client ──HTTPS (encrypted)──> Load Balancer
                                       │
                                  (forward nguyên trạng,
                                   vẫn encrypted)
                                       ▼
                                   Server A
                            (tự giải mã, tự xử lý
                             chứng chỉ SSL riêng)

  Mỗi server backend đều cần:
    Có certificate SSL riêng được cài đặt
    Tự thực hiện việc mã hóa/giải mã (tốn CPU)
    Khi certificate hết hạn, phải cập nhật trên
    TẤT CẢ server backend

Với SSL Termination (load balancer xử lý HTTPS):

  Client ──HTTPS (encrypted)──> Load Balancer
                                  (GIẢI MÃ tại đây)
                                       │
                              ──HTTP (plain text)──>
                                       ▼
                                   Server A
                            (không cần xử lý SSL,
                             chỉ nhận HTTP đơn giản)

  Chỉ load balancer cần:
    Có certificate SSL
    Thực hiện việc mã hóa/giải mã
  Server backend ĐƠN GIẢN HÓA đáng kể, chỉ cần
  xử lý HTTP, không cần lo về SSL/TLS
```

## Lợi Ích Của SSL Termination

```
Quản lý certificate TẬP TRUNG:
  Chỉ cần cài đặt và gia hạn certificate ở MỘT NƠI
  (load balancer), không cần đồng bộ trên hàng chục
  server backend

Giảm tải CPU cho server backend:
  Việc mã hóa/giải mã SSL/TLS tốn CPU đáng kể
  Để load balancer xử lý (thường có phần cứng
  hoặc tối ưu chuyên biệt cho việc này) giúp
  server backend tập trung CPU cho logic ứng dụng

Load balancer L7 CẦN giải mã để routing thông minh:
  Nhớ lại phần L7 — load balancer cần ĐỌC được
  URL path, header để routing dựa trên nội dung
  Nếu traffic vẫn đang được mã hóa, load balancer
  KHÔNG THỂ đọc được nội dung bên trong
  → SSL Termination là ĐIỀU KIỆN CẦN để L7 routing
    hoạt động với HTTPS traffic
```

## Cân Nhắc Về Bảo Mật

```
Vấn đề: sau khi giải mã tại load balancer, traffic
giữa load balancer và server backend đi qua dưới
dạng HTTP THUẦN TÚY (không mã hóa)

Nếu mạng nội bộ (giữa load balancer và backend)
được coi là TIN CẬY (trusted network — ví dụ cùng
một private network, cùng datacenter, có kiểm soát
truy cập chặt chẽ):
  → Chấp nhận được, đây là pattern PHỔ BIẾN trong
    thực tế

Nếu cần bảo mật NGHIÊM NGẶT HƠN, hoặc tuân thủ
quy định compliance yêu cầu mã hóa "end-to-end":
  → Dùng "SSL Passthrough" — load balancer KHÔNG
    giải mã, chỉ forward traffic đã mã hóa nguyên
    trạng đến backend (lúc này hoạt động giống L4,
    không thể routing dựa trên nội dung)

  → Hoặc dùng "SSL Re-encryption" — load balancer
    giải mã traffic từ client, rồi MÃ HÓA LẠI
    bằng một certificate khác trước khi gửi đến
    backend (vẫn có routing thông minh L7, vẫn
    có mã hóa end-to-end, nhưng tốn thêm CPU
    cho việc mã hóa lần hai)
```

---

# 9. Reverse Proxy vs Load Balancer

Đây là hai khái niệm có liên quan mật thiết và thường bị nhầm lẫn hoặc dùng thay thế cho nhau, dù về bản chất chúng giải quyết những vấn đề hơi khác nhau.

## Reverse Proxy

```
Reverse Proxy: một server đứng GIỮA client và
MỘT (hoặc nhiều) server backend, nhận request thay
mặt cho backend, rồi forward đến backend xử lý

Mục đích CHÍNH của Reverse Proxy:
  Ẩn cấu trúc hạ tầng phía sau (client không biết
  có bao nhiêu server thực sự, IP thực của chúng
  là gì)
  Cung cấp một điểm TẬP TRUNG để xử lý: caching,
  compression, SSL termination, logging
  Có thể chỉ forward đến MỘT backend duy nhất
  (không nhất thiết phải "cân bằng tải" giữa
  nhiều server)
```

## Load Balancer

```
Load Balancer: tập trung vào việc PHÂN PHỐI traffic
giữa NHIỀU server backend theo một thuật toán
nhất định, với mục tiêu chính là cân bằng tải
và đảm bảo high availability
```

## Sự Trùng Lặp Trong Thực Tế

```
Trong thực tế, hầu hết Load Balancer HIỆN ĐẠI
(đặc biệt là L7) ĐỀU hoạt động NHƯ một Reverse Proxy
— chúng nhận request, "đứng giữa" client và backend,
và CÓ THÊM khả năng phân phối tải thông minh

Ngược lại, một Reverse Proxy ĐƠN GIẢN (chỉ forward
đến MỘT backend) KHÔNG được coi là Load Balancer
(vì không có việc "cân bằng" giữa nhiều lựa chọn)

Sự khác biệt cốt lõi nằm ở MỤC ĐÍCH SỬ DỤNG:
  Nếu mục đích chính là "ẩn backend, thêm tính năng
  như cache/compression cho MỘT service" → gọi là
  Reverse Proxy

  Nếu mục đích chính là "phân phối tải giữa NHIỀU
  instance của CÙNG một service để đạt high
  availability và scale" → gọi là Load Balancer

Nhiều công cụ phổ biến (Nginx, HAProxy, Envoy) có
thể đóng CẢ HAI vai trò tùy theo cách cấu hình —
đây là lý do gây nhầm lẫn thuật ngữ trong thực tế
```

---

# 10. Load Balancer Chính Nó Cũng Cần High Availability

## Vấn Đề: Load Balancer Trở Thành SPOF Mới

Load balancer giải quyết vấn đề SPOF cho server backend — nhưng nếu CHÍNH load balancer đó là một thiết bị/instance duy nhất, nó lại TRỞ THÀNH single point of failure mới!

```
Kiến trúc CÓ VẤN ĐỀ:

  Client → [MỘT load balancer duy nhất] → nhiều server

  Load balancer đó hỏng
  → Dù TẤT CẢ server backend đều khỏe mạnh
  → KHÔNG AI truy cập được dịch vụ
  → Đã giải quyết SPOF ở tầng server, nhưng tạo ra
    SPOF MỚI ở tầng load balancer!
```

## Giải Pháp: Active-Passive Load Balancer Pair

```
Triển khai HAI load balancer, một active (đang xử lý
traffic thực tế), một passive (standby, sẵn sàng
tiếp quản khi active gặp sự cố)

Cơ chế phát hiện sự cố và chuyển đổi (failover)
thường dùng giao thức như VRRP (Virtual Router
Redundancy Protocol) hoặc tương tự:

  Hai load balancer chia sẻ MỘT địa chỉ IP ảo (VIP)
  Load balancer Active "giữ" VIP này, xử lý traffic
  Load balancer Passive liên tục theo dõi Active
  (qua heartbeat — tín hiệu "tôi vẫn sống" định kỳ)

  Nếu Active KHÔNG GỬI heartbeat trong một khoảng
  thời gian (nghi ngờ đã hỏng):
    Passive TỰ ĐỘNG "chiếm" lấy VIP đó
    Passive trở thành Active mới, bắt đầu xử lý traffic
    Toàn bộ quá trình này diễn ra trong VÀI GIÂY,
    KHÔNG cần can thiệp thủ công
```

## Giải Pháp: Active-Active Load Balancer

```
Thay vì một active một passive (lãng phí tài nguyên
khi passive không làm gì), triển khai NHIỀU load
balancer CÙNG hoạt động đồng thời, phân phối traffic
giữa CHÍNH CÁC LOAD BALANCER đó

Thường kết hợp với DNS Load Balancing (sẽ giải thích
ở phần sau) hoặc Anycast routing — client có thể
kết nối đến BẤT KỲ load balancer nào trong nhóm,
load balancer nào cũng có khả năng xử lý đầy đủ

Ưu điểm so với Active-Passive:
  TẬN DỤNG toàn bộ năng lực của tất cả load balancer
  (không có instance nào "ngồi không" chờ failover)
  Khả năng chịu tải CAO HƠN (năng lực = tổng của
  tất cả load balancer, không chỉ một cái)

Trong môi trường cloud hiện đại, nhiều dịch vụ
Load Balancer được CUNG CẤP SẴN ở dạng managed
service đã tự động giải quyết vấn đề HA này —
người dùng KHÔNG CẦN tự triển khai VRRP hay quản
lý active-passive pair thủ công, nhà cung cấp dịch
vụ đã đảm bảo high availability ở tầng hạ tầng
```

---

# 11. Connection Draining — Tắt Server An Toàn

## Vấn Đề

Khi cần lấy một server ra khỏi vòng quay (để bảo trì, deploy version mới, hoặc scale down), việc TẮT NGAY LẬP TỨC sẽ làm GIÁN ĐOẠN các request ĐANG XỬ LÝ trên server đó.

```
Kịch bản gây vấn đề:

Server A đang xử lý một request PHỨC TẠP (ví dụ:
tạo báo cáo lớn, mất 30 giây để hoàn thành)

Đúng lúc đó, có lệnh "tắt Server A để deploy version mới"
→ Nếu tắt NGAY LẬP TỨC
  → Request đang xử lý (30 giây kia) bị NGẮT GIỮA CHỪNG
  → User nhận được lỗi, mất công việc đang làm dở
```

## Connection Draining Giải Quyết Như Thế Nào

```
Cách hoạt động:
  1. Đánh dấu Server A là "draining" (đang rút dần)
     Load balancer NGỪNG GỬI REQUEST MỚI đến Server A
     từ thời điểm này

  2. Server A VẪN TIẾP TỤC xử lý các request ĐANG
     DANG DỞ (những kết nối đã được thiết lập từ
     trước khi draining bắt đầu)

  3. Chờ đợi trong một khoảng thời gian timeout
     nhất định (ví dụ: 30 giây, 60 giây — tùy cấu hình,
     thường đặt dài hơn thời gian xử lý request lâu
     nhất dự kiến)

  4. Khi TẤT CẢ request cũ đã hoàn thành (hoặc hết
     thời gian timeout), Server A được coi là AN TOÀN
     để tắt hoàn toàn

  Trong suốt quá trình này, USER KHÔNG HỀ BỊ ẢNH HƯỞNG
  — request mới được route đến server khác, request
  cũ vẫn hoàn thành bình thường trên Server A
```

```
Cấu hình quan trọng cần lưu ý:

Draining Timeout PHẢI ĐỦ DÀI để các request chậm
NHẤT có cơ hội hoàn thành (nếu timeout quá ngắn,
vẫn có nguy cơ ngắt request giữa chừng — y như
không có draining)

Nhưng cũng KHÔNG NÊN quá dài (nếu có một kết nối
"treo" mãi không bao giờ kết thúc — ví dụ WebSocket
kết nối liên tục, hoặc một bug khiến request không
bao giờ hoàn thành — draining sẽ chờ VÔ ÍCH, làm
chậm quá trình deploy/bảo trì)

Đây là lý do tại sao quy trình deployment tốt thường
kết hợp Connection Draining với Health Check —
khi server bắt đầu draining, health check cũng nên
trả về "not ready" để load balancer biết KHÔNG gửi
traffic mới đến, đồng thời vẫn cho phép request
cũ hoàn thành
```

---

# 12. DNS Load Balancing

## Khái Niệm

DNS Load Balancing là một hình thức cân bằng tải Ở MỨC ĐƠN GIẢN NHẤT — thực hiện NGAY TẠI tầng phân giải tên miền, TRƯỚC KHI request thậm chí đến được bất kỳ load balancer "thật" nào.

```
Cách hoạt động:
  Một tên miền (vd: example.com) được CẤU HÌNH
  để trỏ đến NHIỀU địa chỉ IP, thay vì chỉ MỘT

  example.com  →  IP: 203.0.113.10
  example.com  →  IP: 203.0.113.20
  example.com  →  IP: 203.0.113.30

  Khi client phân giải DNS, DNS server TRẢ VỀ
  một (hoặc nhiều) trong số các IP đó — thường
  theo Round Robin đơn giản giữa các lần truy vấn
```

## Đặc Điểm Và Hạn Chế

```
Ưu điểm:
  CỰC KỲ ĐƠN GIẢN để triển khai (chỉ cần cấu hình
  thêm bản ghi DNS, không cần thiết bị/phần mềm
  load balancer chuyên dụng)
  Phân phối tải Ở MỨC TOÀN CẦU, giữa các datacenter
  khác nhau, TRƯỚC KHI traffic thậm chí đi vào
  mạng nội bộ của bất kỳ datacenter nào

Hạn chế NGHIÊM TRỌNG:
  DNS Load Balancing KHÔNG BIẾT server nào đang
  hoạt động, server nào đã hỏng (trừ khi tích hợp
  thêm health check ở tầng DNS — một số dịch vụ
  DNS nâng cao hỗ trợ điều này, nhưng KHÔNG PHẢI
  mặc định)
  → Có thể VẪN trả về IP của một server đã HỎNG

  CACHING — đây là vấn đề lớn nhất:
  Kết quả DNS thường được CACHE (lưu tạm) ở nhiều
  tầng: trình duyệt, hệ điều hành, DNS resolver
  của ISP...
  Caching này tuân theo giá trị TTL (Time To Live)
  được cấu hình
  → Nếu một server hỏng, dù DNS đã cập nhật để
    KHÔNG TRẢ VỀ IP đó nữa, CÁC CLIENT ĐÃ CACHE
    kết quả CŨ vẫn tiếp tục cố kết nối đến IP đã hỏng
    cho đến khi cache hết hạn (có thể vài phút
    đến vài giờ, tùy TTL)

  → Đây là lý do DNS Load Balancing KHÔNG THỂ
    thay thế hoàn toàn cho Load Balancer "thật" —
    nó thường được dùng Ở TẦNG TRÊN, kết hợp VỚI
    Load Balancer thật ở tầng dưới, không phải
    dùng MỘT MÌNH
```

## Vai Trò Thực Tế Của DNS Load Balancing

```
Trong kiến trúc thực tế, DNS Load Balancing thường
được dùng để:

  Phân phối traffic giữa các REGION/DATACENTER
  khác nhau (ví dụ: user ở châu Á → datacenter
  Singapore, user ở châu Âu → datacenter Frankfurt)

  KHÔNG dùng để phân phối traffic giữa CÁC SERVER
  ĐƠN LẺ trong CÙNG một datacenter (việc này nên
  giao cho Load Balancer thật — L4/L7 — vốn có
  health check tức thời và không bị giới hạn bởi
  DNS caching)

Đây chính là tiền đề cho khái niệm tiếp theo —
Global Server Load Balancing — kết hợp DNS thông
minh hơn với health checking thực sự
```

---

# 13. Global Server Load Balancing

## Vấn Đề Cần Giải Quyết Ở Quy Mô Toàn Cầu

Khi một ứng dụng được triển khai ở NHIỀU datacenter trên khắp thế giới (để giảm độ trễ cho user ở các khu vực địa lý khác nhau, và để có khả năng chịu lỗi ở mức TOÀN BỘ một region), cần một cơ chế phân phối traffic THÔNG MINH HƠN DNS Round Robin đơn giản.

## GSLB Hoạt Động Như Thế Nào

```
GSLB (Global Server Load Balancing) là DNS THÔNG MINH,
kết hợp với HEALTH CHECK THỰC SỰ và nhiều tiêu chí
quyết định khác

Khi client truy vấn DNS cho example.com:
  GSLB KIỂM TRA health status của TỪNG datacenter
  TRƯỚC KHI trả lời

  Nếu datacenter Singapore đang khỏe mạnh
  → Có thể trả về IP của Singapore

  Nếu datacenter Singapore đang gặp sự cố
  (health check fail)
  → GSLB TỰ ĐỘNG loại bỏ IP đó khỏi câu trả lời,
    chỉ trả về IP của datacenter KHÁC đang khỏe mạnh
  → Quá trình này diễn ra THỰC SỰ DỰA TRÊN sức khỏe
    hiện tại, không như DNS Round Robin "mù quáng"
```

## Các Chiến Lược Routing Của GSLB

```
Geo-proximity (định tuyến theo vị trí địa lý):
  Phân tích vị trí địa lý của client (dựa trên IP)
  Trả về IP của datacenter GẦN NHẤT về mặt địa lý
  → Giảm độ trễ mạng (latency) cho user

Latency-based routing:
  Thay vì chỉ dựa vào khoảng cách địa lý THUẦN TÚY,
  đo lường ĐỘ TRỄ THỰC TẾ từ các khu vực mạng khác
  nhau đến từng datacenter
  → Đôi khi datacenter "xa hơn về địa lý" lại có
    độ trễ THẤP HƠN do đường truyền mạng tốt hơn
    (chất lượng cáp quang, peering agreements...)
  → Latency-based routing chọn theo ĐỘ TRỄ THỰC TẾ
    thay vì khoảng cách vật lý đơn thuần

Weighted distribution:
  Phân phối traffic theo TỶ LỆ được cấu hình trước
  Hữu ích cho việc CHUYỂN DẦN traffic từ datacenter
  cũ sang datacenter mới (ví dụ: bắt đầu với 10%
  traffic vào datacenter mới, tăng dần theo thời gian
  khi đã xác nhận ổn định)

Failover routing:
  Định nghĩa rõ datacenter CHÍNH (primary) và
  datacenter DỰ PHÒNG (secondary)
  Bình thường, TẤT CẢ traffic đi vào primary
  Khi primary gặp sự cố (health check fail)
  → TỰ ĐỘNG chuyển TOÀN BỘ traffic sang secondary
  → Đây là chiến lược disaster recovery ở mức
    DNS/network
```

## Hạn Chế Vẫn Còn Tồn Tại

```
Dù thông minh hơn DNS Round Robin thuần túy, GSLB
vẫn KẾ THỪA một phần hạn chế cố hữu của DNS:

DNS caching vẫn tồn tại
  Dù GSLB phát hiện datacenter A đã hỏng và CẬP NHẬT
  câu trả lời ngay lập tức, CÁC CLIENT ĐÃ CACHE kết
  quả CŨ (trỏ đến A) vẫn tiếp tục cố gắng kết nối
  đến A cho đến khi cache hết hạn

Giải pháp giảm thiểu: cấu hình TTL của DNS record
NGẮN HƠN cho các bản ghi liên quan đến GSLB
(ví dụ: 30-60 giây thay vì giá trị mặc định
thường là nhiều giờ)
→ Giảm thời gian client "dính" vào IP đã chết,
  nhưng đánh đổi: tăng số lượng truy vấn DNS
  (tải nhiều hơn cho hệ thống DNS, độ trễ phân
  giải DNS xảy ra thường xuyên hơn)
```

---

# 14. Rate Limiting Tại Load Balancer

## Tại Sao Đặt Rate Limiting Ở Load Balancer

Load balancer là điểm TẬP TRUNG đầu tiên mà mọi traffic đi qua trước khi chạm đến server backend — vì vậy đây là vị trí LÝ TƯỞNG để chặn traffic quá mức TRƯỚC KHI nó làm quá tải server thực sự.

```
So sánh hai cách tiếp cận:

Rate limit Ở TỪNG SERVER backend:
  Mỗi server tự đếm và giới hạn request riêng
  Vấn đề: traffic vẫn phải ĐI QUA mạng, ĐẾN ĐƯỢC
  server, TIÊU TỐN tài nguyên xử lý mạng/kết nối
  TRƯỚC KHI bị từ chối
  → Lãng phí tài nguyên cho traffic SẼ BỊ TỪ CHỐI
    dù sao đi nữa

Rate limit NGAY TẠI load balancer:
  Traffic vượt giới hạn bị CHẶN NGAY TỪ CỬA NGÕ
  Server backend KHÔNG BAO GIỜ phải nhận, xử lý,
  hay tốn tài nguyên cho những request sẽ bị từ chối
  → Hiệu quả hơn đáng kể, bảo vệ server tốt hơn
```

## Các Tiêu Chí Phổ Biến Để Rate Limit

```
Theo IP address của client:
  Giới hạn số request/giây từ MỘT địa chỉ IP cụ thể
  Phù hợp để chống các cuộc tấn công đơn giản
  từ một nguồn duy nhất

  Hạn chế: nhiều client thực có thể CHIA SẺ
  cùng một IP (đứng sau NAT chung) → có thể
  vô tình chặn nhầm user hợp lệ

Theo API key / User account:
  Giới hạn dựa trên định danh CỦA TỪNG USER
  (thường lấy từ token xác thực, API key)
  Chính xác hơn IP-based, vì gắn liền với DANH
  TÍNH thực sự thay vì địa chỉ mạng

Theo endpoint cụ thể:
  Một số endpoint có thể CẦN giới hạn chặt hơn
  endpoint khác
  Ví dụ: endpoint "đăng nhập" (login) cần giới
  hạn chặt để chống brute-force, trong khi
  endpoint "xem sản phẩm" có thể cho phép tần
  suất cao hơn nhiều
```

## Phản Hồi Khi Vượt Giới Hạn

```
Khi một client vượt quá giới hạn rate limit, load
balancer (hoặc API Gateway tích hợp chức năng này)
thường trả về:

  HTTP Status Code: 429 Too Many Requests
  (mã trạng thái HTTP CHUẨN cho tình huống này)

  Header Retry-After: chỉ định cho client BIẾT
  CHÍNH XÁC nên đợi bao lâu trước khi thử lại
  (ví dụ: Retry-After: 30 — nghĩa là đợi 30 giây)

Đây là thực hành TỐT — không chỉ đơn giản từ chối
request, mà còn HƯỚNG DẪN client RÕ RÀNG cách
xử lý tình huống đó một cách lịch sự (thay vì
client cứ liên tục thử lại ngay lập tức, làm tình
hình tệ hơn)
```

---

# 15. Các Công Cụ Phổ Biến

Đây là tổng quan ngắn gọn về các công cụ thường gặp trong thực tế, không đi sâu vào cấu hình cụ thể của từng cái (vì mỗi công cụ có tài liệu riêng đầy đủ).

```
Nginx:
  Ban đầu là web server, sau phát triển thành cả
  reverse proxy và load balancer L7 mạnh mẽ
  Cực kỳ phổ biến, hiệu năng cao, cộng đồng lớn
  Cấu hình bằng file text dễ đọc

HAProxy:
  Chuyên biệt cho load balancing (cả L4 và L7)
  từ đầu, không phải web server "kiêm thêm"
  chức năng load balancer
  Nổi tiếng về độ ổn định và hiệu năng trong
  môi trường production có tải cao

Envoy:
  Load balancer/proxy hiện đại hơn, được thiết
  kế đặc biệt cho kiến trúc microservices
  và môi trường cloud-native
  Hỗ trợ mạnh các tính năng quan sát (observability):
  metrics, tracing tích hợp sẵn
  Thường được dùng làm THÀNH PHẦN NỀN TẢNG cho
  Service Mesh (đã đề cập ở các khái niệm
  microservices)

Cloud-managed Load Balancer:
  Các nhà cung cấp dịch vụ cloud đều cung cấp
  dịch vụ load balancer được QUẢN LÝ HOÀN TOÀN
  (managed service) — không cần tự cài đặt, tự
  vận hành phần mềm load balancer
  Tự động có sẵn tính năng High Availability,
  tích hợp dễ dàng với các dịch vụ khác trong
  cùng hệ sinh thái cloud đó
  Thường có cả lựa chọn L4 và L7 dưới các tên
  gọi sản phẩm khác nhau tùy nhà cung cấp

DNS-based GSLB Services:
  Nhiều nhà cung cấp dịch vụ DNS chuyên nghiệp
  có tích hợp sẵn tính năng GSLB với health
  checking toàn cầu, không cần tự xây dựng
  hạ tầng kiểm tra sức khỏe riêng
```

---

# 16. Các Sai Lầm Thường Gặp

## Sai Lầm 1: Health Check Không Phản Ánh Đúng Tình Trạng Thực Sự

```
Vấn đề: health check chỉ kiểm tra "process còn sống
không" (ví dụ: TCP connection có mở được không)
mà KHÔNG kiểm tra các dependency quan trọng
(database, cache...)

Hậu quả: server bị coi là "khỏe mạnh" trong khi
THỰC TẾ không thể xử lý được request thật (vì
không kết nối được database) → user vẫn gặp lỗi
liên tục dù load balancer "nghĩ" mọi thứ ổn

Giải pháp: thiết kế health check endpoint kiểm tra
ĐÚNG những gì THỰC SỰ cần thiết để xử lý request
thành công, như đã giải thích ở Section 6
```

## Sai Lầm 2: Sticky Session Cho Hệ Thống Mới

```
Vấn đề: thiết kế hệ thống MỚI ngay từ đầu đã dựa
vào sticky session để quản lý trạng thái, thay vì
xây dựng kiến trúc stateless với centralized
session store

Hậu quả: gặp khó khăn nghiêm trọng khi cần scale,
khi cần thay đổi số lượng server, và risk mất
session khi một server hỏng

Giải pháp: với hệ thống mới, LUÔN ưu tiên thiết
kế stateless ngay từ đầu, như đã giải thích ở
Section 7
```

## Sai Lầm 3: Quên Mất Load Balancer Cũng Cần HA

```
Vấn đề: đầu tư rất nhiều công sức để có nhiều
server backend với health check, auto-scaling...
nhưng lại chỉ có MỘT load balancer duy nhất
đứng phía trước

Hậu quả: đã chuyển SPOF từ tầng application server
sang tầng load balancer — vẫn còn một single point
of failure, chỉ là ở vị trí khác

Giải pháp: áp dụng các kỹ thuật HA cho chính load
balancer như đã giải thích ở Section 10
(active-passive hoặc active-active, hoặc dùng
managed load balancer service đã có sẵn HA)
```

## Sai Lầm 4: Timeout Không Nhất Quán Giữa Các Tầng

```
Vấn đề: load balancer có timeout 30 giây cho mỗi
request, nhưng server backend có timeout xử lý
nội bộ là 60 giây (cho một thao tác tính toán phức tạp)

Hậu quả: load balancer "bỏ cuộc" và trả lỗi cho
client SAU 30 GIÂY, trong khi server backend
VẪN ĐANG TIẾP TỤC xử lý request đó (lãng phí
tài nguyên cho một request mà client đã không
còn chờ kết quả nữa nữa)

Giải pháp: đảm bảo TIMEOUT GIẢM DẦN theo từng tầng
từ ngoài vào trong (client timeout > load balancer
timeout > server processing timeout), để mỗi tầng
"bỏ cuộc" SỚM HƠN tầng phía sau nó, tránh lãng phí
tài nguyên xử lý cho request mà phía trước đã
không còn chờ đợi
```

## Sai Lầm 5: Bỏ Qua Connection Draining Khi Deploy

```
Vấn đề: script deployment đơn giản chỉ "kill" process
cũ ngay lập tức rồi khởi động process mới, không
báo cho load balancer biết trước để rút server
ra khỏi vòng quay một cách an toàn

Hậu quả: user đang giữa chừng một request (đặc
biệt các request xử lý lâu) bị NGẮT ĐỘT NGỘT,
nhận lỗi dù về mặt tổng thể hệ thống vẫn "đang
hoạt động bình thường" (chỉ là tại đúng thời điểm
đó, đúng server đó tắt giữa chừng)

Giải pháp: luôn tích hợp connection draining vào
quy trình deployment, như đã giải thích ở Section 11
— đánh dấu server "draining" trước, chờ request cũ
hoàn thành, RỒI mới tắt hẳn
```

---

## Tóm Tắt Toàn Bộ

```
TẠI SAO CẦN LOAD BALANCER:
  Giải quyết giới hạn năng lực một server
  Loại bỏ single point of failure
  Cho phép bảo trì/deploy không downtime

L4 vs L7:
  L4: nhanh, chỉ thấy IP/port, không hiểu nội dung
  L7: chậm hơn, hiểu HTTP/headers/URL, routing
  thông minh hơn nhiều

THUẬT TOÁN PHÂN PHỐI:
  Round Robin: đơn giản, không quan tâm tải thực tế
  Least Connections: phản ánh tải tốt hơn
  IP Hash: session affinity đơn giản không cần cookie
  Power of Two Choices: cân bằng tốt, chi phí thấp

HEALTH CHECK:
  Trái tim của load balancer — phát hiện server hỏng
  Endpoint /health nên kiểm tra dependency thực sự
  quan trọng, không chỉ "process còn sống"

SESSION PERSISTENCE:
  Sticky session: giải pháp nhanh nhưng có nhược điểm
  Centralized session store: kiến trúc đúng đắn
  cho hệ thống mới

SSL TERMINATION:
  Tập trung quản lý certificate, giảm tải CPU backend
  Điều kiện cần để L7 routing hoạt động với HTTPS

LOAD BALANCER CŨNG CẦN HA:
  Active-Passive hoặc Active-Active
  Tránh tạo SPOF mới ở tầng load balancer

CONNECTION DRAINING:
  Rút server ra an toàn, không ngắt request đang xử lý

DNS LOAD BALANCING VÀ GSLB:
  Phù hợp cho phân phối Ở MỨC TOÀN CẦU/datacenter
  Bị giới hạn bởi DNS caching, không thay thế
  load balancer thật ở tầng dưới

RATE LIMITING:
  Đặt ở load balancer hiệu quả hơn đặt ở từng server
  Trả 429 + Retry-After header khi vượt giới hạn
```
