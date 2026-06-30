# 🛡️ SRE — Site Reliability Engineering
>
> Triết lý, công cụ và thực hành vận hành hệ thống đáng tin cậy

---

## Mục Lục

1. [SRE Là Gì — Nguồn Gốc và Triết Lý](#1-sre-là-gì--nguồn-gốc-và-triết-lý)
2. [SLI, SLO, SLA — Bộ Ba Quan Trọng Nhất](#2-sli-slo-sla--bộ-ba-quan-trọng-nhất)
3. [Error Budget — Ngân Sách Lỗi](#3-error-budget--ngân-sách-lỗi)
4. [Toil — Công Việc Vô Nghĩa Cần Loại Bỏ](#4-toil--công-việc-vô-nghĩa-cần-loại-bỏ)
5. [Observability — Khả Năng Quan Sát Hệ Thống](#5-observability--khả-năng-quan-sát-hệ-thống)
6. [Metrics — Đo Lường Đúng Thứ](#6-metrics--đo-lường-đúng-thứ)
7. [Logging — Ghi Nhật Ký Có Cấu Trúc](#7-logging--ghi-nhật-ký-có-cấu-trúc)
8. [Distributed Tracing — Theo Dấu Xuyên Service](#8-distributed-tracing--theo-dấu-xuyên-service)
9. [Alerting — Cảnh Báo Đúng Lúc](#9-alerting--cảnh-báo-đúng-lúc)
10. [Incident Management — Xử Lý Sự Cố](#10-incident-management--xử-lý-sự-cố)
11. [Postmortem — Học Từ Thất Bại](#11-postmortem--học-từ-thất-bại)
12. [On-Call — Trực Để Sẵn Sàng](#12-on-call--trực-để-sẵn-sàng)
13. [Capacity Planning — Lên Kế Hoạch Tài Nguyên](#13-capacity-planning--lên-kế-hoạch-tài-nguyên)
14. [Chaos Engineering — Phá Để Học](#14-chaos-engineering--phá-để-học)
15. [Reliability Patterns — Mẫu Thiết Kế Đáng Tin Cậy](#15-reliability-patterns--mẫu-thiết-kế-đáng-tin-cậy)

---

# 1. SRE Là Gì — Nguồn Gốc và Triết Lý

## Câu Chuyện Từ Google

SRE (Site Reliability Engineering) được Google tạo ra vào năm 2003. Ben Treynor Sloss — người sáng lập ngành SRE tại Google — có một định nghĩa đơn giản:

> "SRE là những gì xảy ra khi bạn yêu cầu một software engineer thiết kế một operations team."

Trước SRE, có sự chia cắt rõ rệt giữa Dev (development) và Ops (operations):

```
Dev team:  viết code, push feature nhanh, không quan tâm production
Ops team:  giữ hệ thống ổn định, sợ thay đổi vì thay đổi gây lỗi

Xung đột cốt lõi:
  Dev muốn: deploy nhanh, thay đổi thường xuyên
  Ops muốn: ổn định, không thay đổi gì cả
  → Hai team chống đối nhau
  → Feature chậm ra, hệ thống không cải thiện
```

Google quyết định: thay vì dùng ops engineer truyền thống, dùng software engineer để xây dựng và vận hành hệ thống. Software engineer tự nhiên muốn **automation** thay vì làm thủ công.

## SRE Khác DevOps Thế Nào

DevOps là triết lý và văn hóa — phá bỏ tường ngăn giữa Dev và Ops.

SRE là một **implementation cụ thể** của triết lý DevOps. Nếu DevOps là "mục tiêu cần đạt", thì SRE là "một cách để đạt được mục tiêu đó".

```
DevOps nói: "Dev và Ops cần hợp tác"
SRE nói:    "Đây là các practices cụ thể để làm điều đó:
              - SLO/SLA/Error Budget
              - Toil reduction
              - Postmortems không đổ lỗi
              - On-call rotations
              - 50% time cho engineering"
```

## Nguyên Tắc Cốt Lõi Của SRE

**Ôm lấy rủi ro.** Hệ thống 100% reliable là không khả thi và không cần thiết. Người dùng không phân biệt được 99.99% và 100% uptime. Thay vào đó, SRE chấp nhận một mức rủi ro nhất định và quản lý nó.

**Giảm toil.** Mọi công việc thủ công lặp đi lặp lại cần được tự động hóa. SRE dành thời gian automation, không phải làm thủ công mãi.

**Monitoring và observability.** Bạn không thể quản lý thứ bạn không đo được.

**Automation.** Mọi thứ có thể automation được thì nên automation.

**Release engineering.** Cách release phải được thiết kế để đáng tin cậy.

**Giảm sự phức tạp.** Sự phức tạp là kẻ thù của reliability.

---

# 2. SLI, SLO, SLA — Bộ Ba Quan Trọng Nhất

Đây là foundation của SRE. Nếu chỉ học được một thứ từ SRE, học bộ ba này.

## SLI — Service Level Indicator

SLI là một **phép đo cụ thể** về hành vi của service. Nó là con số thực tế thu thập được từ hệ thống.

```
SLI phải là con số có thể đo được:
  Tỷ lệ request thành công (success rate)
  Độ trễ trung vị (median latency)
  P99 latency (99th percentile)
  Throughput (requests/second)
  Error rate
  Availability (% thời gian service online)

Ví dụ SLI cụ thể:
  "Tỷ lệ HTTP request trả về 2xx hoặc 3xx trong tổng số request"
  "% requests có latency < 200ms"
  "Tỷ lệ thành công của background jobs"
```

Không phải mọi metric đều là SLI tốt. SLI tốt là metric phản ánh trực tiếp trải nghiệm của người dùng.

```
Metric không tốt làm SLI:
  CPU utilization của server → user không quan tâm CPU của bạn bao nhiêu
  Số connection đến database → không liên quan trực tiếp đến user experience

Metric tốt làm SLI:
  Tỷ lệ request thành công → user thấy lỗi hay không?
  Latency → user chờ bao lâu?
  Tỷ lệ checkout thành công → user mua được hàng không?
```

## SLO — Service Level Objective

SLO là **mục tiêu** cho SLI. Đây là con số bạn đặt ra và cam kết đạt được.

```
SLO = SLI + Target + Time Window

Ví dụ:
  SLI: tỷ lệ request thành công
  SLO: tỷ lệ request thành công >= 99.9% trong rolling 30 ngày

  SLI: P99 latency
  SLO: P99 latency < 200ms cho 99% thời gian trong tuần

  SLI: availability
  SLO: service available 99.95% thời gian mỗi tháng
```

**Quan trọng: SLO không nên là 100%.** Hướng đến 100% có nghĩa là bạn không thể làm gì cả — mọi deploy đều rủi ro, mọi thay đổi đều đáng sợ.

```
Tại sao không đặt SLO = 100%?
  100% là không thể đạt (phần cứng fail, network glitch)
  Hướng đến 100% → quá bảo thủ → feature chậm ra
  User không phân biệt được 99.99% và 100%

Hướng đến: "reliability tốt nhất mà user sẽ nhận ra sự khác biệt"
  Nếu user dùng service trên mobile với 4G, họ không thể thấy downtime < 10ms
  → SLO 99.9% là đủ, không cần 99.999%
```

## SLA — Service Level Agreement

SLA là **hợp đồng** với khách hàng bên ngoài. Nếu vi phạm SLA, có hậu quả pháp lý hoặc tài chính (hoàn tiền, penalty).

```
Quan hệ giữa ba:
  SLA < SLO < thực tế

Ví dụ:
  Thực tế:  system đạt 99.98% availability
  SLO:      team cam kết nội bộ 99.95%
  SLA:      hứa với khách hàng 99.9%

  Tại sao SLA thấp hơn SLO?
  Buffer để không vi phạm hợp đồng khi có sự cố
  Nếu SLO = SLA, mọi sự cố nhỏ đều vi phạm hợp đồng → penalty!
```

---

# 3. Error Budget — Ngân Sách Lỗi

Đây là khái niệm quan trọng nhất và thú vị nhất của SRE.

## Error Budget Là Gì

Error budget là lượng "lỗi" được phép xảy ra trong một khoảng thời gian mà không vi phạm SLO.

```
SLO = 99.9% availability trong 30 ngày
Tổng thời gian = 30 ngày × 24h × 60min = 43,200 phút
Allowed downtime = 43,200 × 0.1% = 43.2 phút

Error budget = 43.2 phút downtime mỗi tháng

Khi hệ thống down 10 phút → dùng 10/43.2 = 23% error budget
Còn lại: 33.2 phút
```

## Tại Sao Error Budget Thay Đổi Cuộc Chơi

Trước khi có error budget, Dev và Ops ở thế đối lập:

```
Không có error budget:
  Dev: "Deploy thôi, user cần feature này!"
  Ops: "Không, risky quá!"
  → Tranh cãi, không có hướng giải quyết khách quan

Với error budget:
  Còn nhiều error budget → Dev có thể deploy thoải mái
  Gần hết error budget → Dev phải dừng, tập trung fix reliability

Error budget là ngôn ngữ chung cho Dev và Ops
Không ai đổ lỗi, chỉ nhìn vào con số khách quan
```

## Sử Dụng Error Budget Như Thế Nào

```
Scenario 1: Còn dư error budget
  → Signal: hệ thống đang tốt hơn SLO
  → Action: có thể deploy aggressively, experiment, try new things
  → Dùng thời gian này để ship feature

Scenario 2: Dùng hết error budget
  → Signal: hệ thống đang dưới SLO
  → Action: freeze all feature releases
  → Tập trung toàn bộ vào reliability improvement
  → Không deploy thêm gì cho đến khi budget recover

Scenario 3: Budget hồi phục sau khi cải thiện
  → Học được gì từ incidents?
  → Automation nào có thể prevent tái diễn?
  → Resume feature development
```

## Error Budget Policy — Văn Bản Hóa

Team nên có văn bản rõ ràng về cách dùng error budget:

```
Error Budget Policy:

Còn > 50% budget: Deploy tự do, không cần approval đặc biệt
Còn 25-50% budget: Deploy vẫn OK, nhưng phải có rollback plan rõ ràng
Còn 10-25% budget: Chỉ deploy change nhỏ, không breaking change
Còn < 10% budget: Feature freeze. Chỉ deploy security fixes và reliability fixes
Budget = 0%: Full freeze. Incident review bắt buộc trước khi tiếp tục
```

---

# 4. Toil — Công Việc Vô Nghĩa Cần Loại Bỏ

## Toil Là Gì

Toil là loại công việc vận hành có đặc điểm:

```
Manual:      phải làm bằng tay, không tự động
Repetitive:  làm đi làm lại, không có gì mới
Automatable: máy tính có thể làm được
Tactical:    reactive, không có giá trị lâu dài
No value:    làm hôm nay xong, ngày mai lại phải làm lại
Scales with service: khi traffic tăng, work tăng tỉ lệ thuận
```

Ví dụ về toil:

```
Toil rõ ràng:
  Restart service mỗi khi memory leak → xảy ra mỗi ngày
  Approve request thủ công từ user muốn access
  Check log thủ công sau mỗi deploy
  Cập nhật số lượng server thủ công khi traffic tăng

Không phải toil:
  On-call investigation vì có cái mới lạ → có giá trị học hỏi
  Viết runbook → có giá trị lâu dài
  Thiết kế alert mới → không repetitive
```

## Tại Sao Toil Là Vấn Đề

```
Toil chiếm thời gian của engineering → không còn thời gian để cải thiện hệ thống
Toil tăng theo traffic → càng scale lớn, càng nhiều toil
Toil gây burn out → engineer cảm thấy không có giá trị
Toil không giảm — chỉ tăng nếu không chủ động automation

Google SRE rule: không quá 50% thời gian cho toil
  Nếu SRE team dành > 50% thời gian cho toil → cần automation ngay
```

## Cách Giảm Toil

```
Identify → Measure → Automate

Identify:
  Track time: SRE dùng bao nhiêu thời gian cho việc gì?
  Những task nào xuất hiện nhiều nhất trong rotation?

Measure:
  Lượng toil hiện tại là bao nhiêu giờ/tuần?
  Trend tăng hay giảm?

Automate:
  Viết script để automate task phổ biến nhất
  Tạo runbook tự động execute
  Self-healing: service tự restart khi detect lỗi
  Auto-scaling: không cần resize thủ công
```

---

# 5. Observability — Khả Năng Quan Sát Hệ Thống

## Monitoring vs Observability

Đây là hai khái niệm liên quan nhưng khác nhau.

**Monitoring** là theo dõi những thứ **đã biết trước** là quan trọng. Bạn biết trước mình muốn check gì, đặt alert cho những trường hợp đó.

```
Monitoring hỏi: "Hệ thống có đang OK không?"
Alert khi: CPU > 80%, response time > 500ms, error rate > 1%
```

**Observability** là khả năng **tìm hiểu bất kỳ câu hỏi nào** về hệ thống từ bên ngoài, kể cả những câu hỏi bạn chưa nghĩ đến trước.

```
Observability hỏi: "Tại sao user X lại bị lỗi? Điều gì khác thường?"
Phải có đủ dữ liệu để trả lời câu hỏi chưa biết trước
```

Hệ thống có thể có đầy đủ monitoring nhưng thiếu observability:

```
Bạn biết: error rate đang tăng (monitoring alert fires)
Bạn không biết: tại sao? từ user nào? component nào? khi nào bắt đầu?
                 request nào bị ảnh hưởng? có correlation với deploy gần đây không?

Đó là thiếu observability
```

## Ba Trụ Cột — The Three Pillars

Observability được xây dựng từ ba loại dữ liệu bổ sung cho nhau:

```
Metrics:  SỐ theo thời gian
          CPU: 45%... 67%... 89%... 45%...
          "Điều gì đang xảy ra ở mức độ tổng quan?"

Logs:     SỰ KIỆN có context
          [14:32:01] ERROR: DB connection timeout, userId=123, query=SELECT...
          "Điều gì đã xảy ra, với ai, khi nào, tại sao?"

Traces:   ĐƯỜNG ĐI của một request qua các service
          Request #abc → API Gateway (5ms) → User Service (20ms) → DB (150ms, slow!)
          "Bình quán thời gian đi đâu? Bottleneck ở đâu?"
```

Mỗi trụ cột trả lời câu hỏi khác nhau. Cần cả ba để debug hiệu quả:

```
Alert fires: P99 latency tăng (metrics)
Tìm slow request: trace cho thấy DB query chậm (traces)
Hiểu tại sao chậm: log DB cho thấy missing index (logs)
→ Fix: thêm index

Thiếu traces: biết chậm nhưng không biết ở đâu
Thiếu logs: biết DB chậm nhưng không biết query nào
```

---

# 6. Metrics — Đo Lường Đúng Thứ

## Metric Types

**Counter** — chỉ tăng, không bao giờ giảm. Reset về 0 khi restart.

```
Dùng cho: đếm số sự kiện tích lũy
  Tổng số request
  Tổng số lỗi
  Tổng số bytes được truyền
  Tổng số order được tạo

Query: rate(http_requests_total[5m]) → số request/giây trong 5 phút qua
```

**Gauge** — giá trị có thể tăng hoặc giảm.

```
Dùng cho: đo giá trị tại thời điểm hiện tại
  CPU utilization
  Memory usage
  Số kết nối đang active
  Số item trong queue

Query: memory_usage_bytes → bao nhiêu RAM đang dùng ngay lúc này
```

**Histogram** — phân phối các giá trị, cho phép tính percentile.

```
Dùng cho: đo latency, response size
  Chia thành các "bucket" (ví dụ: < 10ms, < 50ms, < 100ms, < 500ms, > 500ms)
  Đếm số request vào mỗi bucket

Cho phép tính:
  Median (P50): 50% request nhanh hơn bao nhiêu?
  P95: 95% request nhanh hơn bao nhiêu?
  P99: 99% request nhanh hơn bao nhiêu?
```

## The Four Golden Signals

Google SRE book giới thiệu "Four Golden Signals" — 4 metrics mọi service đều cần theo dõi:

**Latency — Độ trễ**

```
Thời gian xử lý request bao lâu?
Phân biệt latency của successful requests và failed requests
Failed request nhanh (trả 500 ngay) không nên kéo trung bình xuống
→ Track P50, P95, P99 riêng cho success và error
```

**Traffic — Lưu lượng**

```
Hệ thống đang chịu bao nhiêu tải?
HTTP requests/second
Database queries/second
Messages processed/second
Concurrent connections
```

**Errors — Lỗi**

```
Tỷ lệ request thất bại
HTTP 5xx / total requests
Failed jobs / total jobs
Timeout rate
Phân biệt: expected errors (400 Bad Request) vs unexpected (500 Internal Error)
```

**Saturation — Độ bão hòa**

```
Hệ thống đang "đầy" đến mức nào?
CPU: bao nhiêu % đang dùng? Còn bao nhiêu headroom?
Memory: bao nhiêu % đang dùng?
Disk I/O: queue depth có đang tăng không?
Connection pool: bao nhiêu % connections đang dùng?
```

## RED Method — Cho Microservices

Một framework khác đơn giản hơn, tập trung vào service-level:

```
R — Rate:   Số request service nhận mỗi giây
E — Errors: Tỷ lệ request thất bại
D — Duration: Thời gian xử lý request (latency)
```

---

# 7. Logging — Ghi Nhật Ký Có Cấu Trúc

## Structured Logging vs Unstructured

**Unstructured logging** (cũ) — text thuần túy, khó tìm kiếm và phân tích:

```
[2025-05-19 14:32:01] ERROR User authentication failed for user john@example.com from IP 192.168.1.1
[2025-05-19 14:32:01] INFO  Processing order #12345 for user john@example.com
```

Để tìm tất cả lỗi của user <john@example.com> phải dùng grep — chậm và không thể aggregate.

**Structured logging** — mỗi log entry là JSON hoặc key-value pairs:

```json
{
  "timestamp": "2025-05-19T14:32:01.234Z",
  "level": "ERROR",
  "service": "auth-service",
  "event": "authentication_failed",
  "userId": "user_123",
  "email": "john@example.com",
  "ip": "192.168.1.1",
  "reason": "invalid_password",
  "traceId": "abc-def-123"
}
```

Với structured logging:

```
Tìm tất cả lỗi của user_123 → query: userId="user_123" AND level="ERROR"
Đếm lỗi authentication theo giờ → aggregate trên event field
Tìm tất cả request có traceId=abc-def-123 → trace một request qua nhiều service
```

## Log Levels — Phân Cấp Độ Quan Trọng

```
TRACE / DEBUG:
  Thông tin chi tiết nhất, dùng khi debug
  "Entering function processOrder with params {...}"
  Chỉ bật trong development, tắt ở production (tốn dung lượng)

INFO:
  Sự kiện bình thường quan trọng
  "Order #12345 created successfully"
  "User logged in: userId=123"
  Bật ở production để track normal operations

WARN:
  Điều gì đó không ổn nhưng chưa gây lỗi
  "Database connection pool at 80% capacity"
  "Rate limit approaching for user_123"
  Cần chú ý nhưng không cần wake up on-call

ERROR:
  Lỗi đã xảy ra, một operation cụ thể thất bại
  "Failed to process payment for order #12345"
  "Database query timeout after 30s"
  Cần investigate

FATAL / CRITICAL:
  Lỗi nghiêm trọng, service không thể tiếp tục
  "Cannot connect to database on startup"
  "Out of memory, shutting down"
  Wake up on-call ngay lập tức
```

## Log Context — Thông Tin Cần Có Trong Mọi Log

```json
// Mỗi log entry nên có:
{
  "timestamp":    "ISO 8601 format, UTC",
  "level":        "INFO / WARN / ERROR",
  "service":      "tên service",
  "version":      "v1.2.3",
  "environment":  "production / staging",
  "traceId":      "để link với distributed traces",
  "spanId":       "span hiện tại trong trace",
  "requestId":    "ID của HTTP request",
  "userId":       "nếu có user context",
  "message":      "mô tả ngắn gọn",
  // ... thêm context cụ thể của event
}
```

---

# 8. Distributed Tracing — Theo Dấu Xuyên Service

## Vấn Đề Distributed Tracing Giải Quyết

Khi request đi qua nhiều service, một log entry đơn lẻ không đủ để hiểu vấn đề.

```
User nhận lỗi 500. Nhìn vào log:
  API Gateway:  "Forwarded request to UserService" → OK
  UserService:  "Calling OrderService" → OK
  OrderService: "Calling InventoryService" → OK
  InventoryService: "Database timeout" → ĐÂY LÀ LỖI!

Không có tracing: phải tự join logs từ 4 service theo timestamp
Rất khó khi hàng nghìn request/giây đang xử lý đồng thời

Với distributed tracing:
  Mỗi request có một Trace ID duy nhất
  Tất cả service ghi log với cùng Trace ID
  Trace ID lan truyền qua HTTP headers sang service tiếp theo
  Có thể xem toàn bộ hành trình của một request
```

## Concept Cốt Lõi

**Trace** là toàn bộ hành trình của một request từ đầu đến cuối, qua tất cả services.

**Span** là một đơn vị công việc trong trace — thường là một service call, một query, hay một operation cụ thể.

```
Trace ID: abc-123

  ├── Span: API Gateway (0-50ms)
  │     Gọi UserService
  │
  ├── Span: UserService (10-45ms)
  │     Gọi OrderService
  │     Gọi Redis (12-15ms)
  │
  ├── Span: OrderService (15-42ms)
  │     Gọi InventoryService
  │
  └── Span: InventoryService (18-40ms)
        Query DB (20-40ms) ← chỗ chậm nhất!
        "SELECT * FROM inventory WHERE..."
```

**Context Propagation** — Trace ID được truyền qua HTTP header từ service này sang service khác:

```
Khi API Gateway gọi UserService:
  HTTP Header: X-Trace-Id: abc-123
               X-Span-Id: span-001
               X-Parent-Span-Id: (none — là root)

UserService nhận request, gọi OrderService:
  HTTP Header: X-Trace-Id: abc-123         ← giữ nguyên Trace ID
               X-Span-Id: span-002          ← Span ID mới
               X-Parent-Span-Id: span-001   ← parent là span của UserService
```

## OpenTelemetry — Standard Hiện Đại

OpenTelemetry (OTel) là project open-source, chuẩn hóa cách thu thập và export telemetry data (metrics, logs, traces). Không phụ thuộc vào vendor.

```
Không có OTel: mỗi observability vendor có SDK riêng
  Chuyển từ Jaeger sang Zipkin → phải refactor toàn bộ instrumentation code

Với OTel: code instrumentation một lần
  Chọn exporter (Jaeger, Zipkin, Grafana Tempo) → chỉ đổi config
  Không đổi code
```

---

# 9. Alerting — Cảnh Báo Đúng Lúc

## Triết Lý Về Alert

Alert tốt phải đáp ứng một điều kiện đơn giản:

> **Alert chỉ nên fire khi cần có người xem xét ngay lập tức.**

Nghe có vẻ đơn giản nhưng thực tế rất hay bị vi phạm. Hậu quả của alerting kém:

```
Quá nhiều alert (alert fatigue):
  On-call nhận 50 alert mỗi đêm
  Hầu hết là false positive
  Bắt đầu ignore alert
  Khi alert thật quan trọng → cũng bị ignore
  → Nguy hiểm!

Quá ít alert:
  Production down 30 phút trước khi ai biết
  User phải tự báo cáo lỗi
```

## Symptoms vs Causes — Alert Về Triệu Chứng

Sai lầm phổ biến: alert về nguyên nhân nội bộ thay vì triệu chứng user thấy.

```
Alert về nguyên nhân (không tốt):
  "CPU > 80%"  → có thể CPU cao mà user vẫn OK
  "Memory > 90%" → có thể memory cao nhưng GC đang hoạt động bình thường
  "Database connections > 80 pool size" → có thể backend đang handle tốt

Alert về triệu chứng (tốt):
  "Error rate > 1% trong 5 phút" → user đang thấy lỗi
  "P99 latency > 2s trong 5 phút" → user đang chờ lâu
  "Checkout success rate < 95%" → user không mua được hàng
```

## Đặc Điểm Của Alert Tốt

**Actionable** — người nhận alert biết ngay phải làm gì.

```
Tốt:
  Alert: "Checkout service error rate 5% (threshold: 1%), last 10 minutes"
  Runbook: https://wiki.internal/runbooks/checkout-errors
  Người nhận biết: đọc runbook → check logs → điều tra

Không tốt:
  Alert: "Something is wrong with the system"
  → Không biết bắt đầu từ đâu
```

**Urgent** — chỉ alert khi thật sự cần phản hồi ngay.

```
Không nên alert on-call lúc 3am vì:
  CPU spike 2 phút rồi về bình thường
  Memory tăng nhẹ nhưng không ảnh hưởng response time
  Log có warning nhưng không ảnh hưởng user

Nên alert lúc 3am vì:
  Error rate đang tăng và chưa có dấu hiệu dừng
  Service hoàn toàn không respond
  Database sắp hết dung lượng trong vài giờ
```

**Alert threshold có time window** — tránh false positive từ spike ngắn:

```
Không tốt: CPU > 80% → alert ngay lập tức
  Một spike 30 giây sẽ fire alert nhưng tự recover

Tốt: CPU > 80% trong 5 phút liên tục → mới alert
  Spike ngắn không trigger
  Vấn đề thật sự sẽ bị bắt sau 5 phút
```

---

# 10. Incident Management — Xử Lý Sự Cố

## Incident Là Gì

Incident là bất kỳ sự gián đoạn nào ảnh hưởng đến user. Không nhất thiết phải là "hệ thống hoàn toàn down".

```
Severity levels phổ biến:

SEV-1 (Critical):
  Service hoàn toàn không hoạt động
  Ảnh hưởng > 50% user
  Tính năng core bị lỗi (payment, login)
  → Wake up everyone, all hands on deck

SEV-2 (High):
  Tính năng quan trọng bị ảnh hưởng
  Performance giảm đáng kể
  Một số user bị ảnh hưởng
  → Wake up on-call, có thể cần escalate

SEV-3 (Medium):
  Non-core feature bị lỗi
  Có workaround
  Ít user bị ảnh hưởng
  → Fix trong giờ làm, không cần wake up

SEV-4 (Low):
  Cosmetic issues, minor bugs
  Không ảnh hưởng chức năng
  → Ticket để fix later
```

## Incident Response Framework

Khi incident xảy ra, chaos là kẻ thù. Cần process rõ ràng.

**1. Detect** — phát hiện incident.

```
Nguồn phát hiện:
  Alert tự động từ monitoring
  User report (support ticket, social media)
  Internal team phát hiện khi làm việc
  Automated health check
```

**2. Triage** — đánh giá mức độ nghiêm trọng.

```
Hỏi ngay:
  Ai đang bị ảnh hưởng? Bao nhiêu %?
  Tính năng nào bị ảnh hưởng?
  Bắt đầu từ khi nào?
  Đây là SEV mấy?
```

**3. Communicate** — thông báo.

```
Internal:
  Notify on-call team và management
  Mở incident channel riêng (Slack #incident-2025-05-19)
  Bắt đầu incident log (timeline của mọi action)

External (nếu cần):
  Status page update: "We are investigating issues with checkout"
  Không nói "everything is fine" khi chưa chắc chắn
```

**4. Mitigate** — giảm thiểu tác động trước, fix sau.

```
Tư duy: "Restore service first, understand why later"

Mitigation actions (không cần biết root cause):
  Rollback deploy gần nhất (80% incidents liên quan đến recent change)
  Restart service (nhiều khi fix transient issues)
  Scale up (nếu do tải cao)
  Fail over sang region khác
  Feature flag — tắt tính năng đang gây lỗi

Root cause analysis có thể làm sau khi service restored
```

**5. Resolve** — confirm đã fix.

```
Verify bằng metrics, không chỉ gut feeling:
  Error rate về bình thường?
  Latency về bình thường?
  User reports đã dừng?

Update status page: "This incident has been resolved"
Assign task: ai viết postmortem, deadline khi nào?
```

## Incident Commander — Người Điều Phối

Trong incident lớn, cần một người làm Incident Commander (IC).

```
IC không nhất thiết phải là người giỏi kỹ thuật nhất.
IC là người điều phối tất cả:
  Giao nhiệm vụ cho từng người
  Giữ cho communication rõ ràng
  Tránh nhiều người cùng làm một thứ hoặc không ai làm gì
  Quyết định khi cần escalate
  Cập nhật status page và stakeholders

Người khác (Engineers):
  Tập trung vào kỹ thuật, không phải communication
  Báo cáo update cho IC
  Không tự ý escalate — để IC quyết định
```

---

# 11. Postmortem — Học Từ Thất Bại

## Blameless Postmortem

Sau mỗi incident đáng kể, team viết postmortem — tài liệu phân tích những gì xảy ra và cách ngăn tái diễn.

Nguyên tắc quan trọng nhất: **blameless** — không đổ lỗi cho cá nhân.

```
Tại sao không đổ lỗi?

Người thường không cố tình gây incident.
Họ đưa ra quyết định tốt nhất với thông tin họ có lúc đó.
Nếu một người có thể phá vỡ production → vấn đề ở system, không phải người.

Nếu có blame:
  Engineer sợ nhận lỗi → che giấu thông tin → không học được gì
  Engineer sợ làm → không dám thử → không có innovation
  Mất một người giỏi vì xấu hổ, không giải quyết được vấn đề gốc

Blameless:
  "System allowed this to happen" → fix the system
  "Process didn't catch this" → improve the process
  "Alert didn't fire" → fix alerting
```

## Cấu Trúc Postmortem

```
1. SUMMARY — TÓM TẮT
   Đây là gì? Bắt đầu lúc nào? Kết thúc lúc nào?
   Mức độ ảnh hưởng?
   (2-3 câu, người không liên quan đọc được ngay)

2. TIMELINE — DÒNG THỜI GIAN
   Liệt kê theo thứ tự thời gian mọi thứ đã xảy ra:
   14:30 - Alert fire: error rate > 5%
   14:32 - On-call engineer paged
   14:35 - Engineer bắt đầu investigate
   14:40 - Phát hiện memory leak sau deploy mới
   14:45 - Rollback deploy
   14:50 - Error rate về bình thường
   15:00 - Confirmed resolved
   
3. ROOT CAUSE ANALYSIS
   Đào sâu đến "tại sao thật sự":
   "Service restart → tại sao?"
   "Memory leak → tại sao?"
   "Code change X gây memory leak → tại sao không bắt được trong test?"
   "Test không cover case này → tại sao?"
   
4. CONTRIBUTING FACTORS
   Những yếu tố nào đã làm incident tệ hơn?
   Alert không fire sớm hơn
   Runbook không rõ ràng
   On-call không có đủ access để rollback

5. ACTION ITEMS
   Mỗi action item cần: owner cụ thể + deadline cụ thể
   "Add memory limit check trong CI/CD - @NguyenKhang - 2025-05-26"
   "Update runbook cho memory leak - @Alice - 2025-05-23"
   "Add alert cho memory usage trend - @Bob - 2025-05-24"
   
   KHÔNG có: "Improve testing" (quá mơ hồ, không ai làm)
   CÓ:       "Add unit test cho OrderService memory management" (cụ thể)
```

---

# 12. On-Call — Trực Để Sẵn Sàng

## On-Call Là Gì

On-call là rotation trong đó engineer sẵn sàng respond khi có incident ngoài giờ làm. Mỗi tuần (hoặc hai tuần) có một người primary on-call và một secondary on-call.

## Healthy On-Call

On-call tệ sẽ burn out engineer. Dấu hiệu on-call khỏe mạnh:

```
Alert volume thấp: không quá vài alert/ngày
False positive thấp: khi alert fire → thật sự cần investigation
Incidents ít: automation và reliability tốt giảm incidents
Runbooks đầy đủ: engineer mới on-call cũng biết làm gì
Sleep không bị interrupted: nếu wake up nhiều đêm → vấn đề
```

## Runbook — Sách Hướng Dẫn Ứng Phó

Runbook là tài liệu step-by-step để xử lý một loại incident cụ thể. Khi alert fire lúc 3am, engineer không cần nghĩ — chỉ cần follow runbook.

```
Runbook tốt:
  Tên alert + mô tả ngắn gọn
  Mức độ severity thường gặp
  Tác động đến user
  Điều đầu tiên cần check
  Steps điều tra (từng bước cụ thể, có lệnh cụ thể)
  Steps mitigation (có thể copy-paste command)
  Khi nào cần escalate và escalate cho ai
  Link đến dashboards liên quan

Ví dụ:
  Alert: HighCheckoutErrorRate
  Tác động: User không mua được hàng
  Severity: SEV-2
  
  Steps:
  1. Check dashboard: https://grafana.internal/checkout
  2. Check recent deploys: kubectl rollout history deploy/checkout
  3. Nếu có deploy < 1h ago: rollback
     kubectl rollout undo deploy/checkout
  4. Check error logs:
     kubectl logs -l app=checkout --since=1h | grep ERROR
  5. Nếu OOM errors: tăng memory limit tạm thời
  6. Nếu DB errors: xem Section "Database Issues"
  
  Escalate khi: không resolve trong 30 phút → ping @checkout-team
```

---

# 13. Capacity Planning — Lên Kế Hoạch Tài Nguyên

## Tại Sao Cần Capacity Planning

```
Không có planning:
  Traffic tăng đột biến (Black Friday, viral post)
  → Hết tài nguyên → service crash
  → Phải provision trong hỗn loạn

Với planning:
  Dự đoán trước nhu cầu
  Provision đủ trước khi cần
  Không bị surprise
```

## Demand Forecasting — Dự Đoán Nhu Cầu

```
Nhìn vào historical data:
  Traffic patterns: giờ cao điểm nào? Ngày nào?
  Growth rate: tháng này so với tháng trước?
  Seasonal patterns: Black Friday, Tết, back-to-school?

Project forward:
  "Traffic tăng 20%/tháng → 3 tháng nữa cần thêm bao nhiêu capacity?"
  "Black Friday traffic gấp 5x normal → cần provision từ trước"

Lập kế hoạch cho "what if":
  Viral event: traffic spike 100x trong 1 giờ → có plan không?
  DDoS: traffic tăng đột ngột không tự nhiên → có rate limiting không?
```

## Capacity Buffer

Không nên run service ở 100% capacity — cần buffer:

```
Mục tiêu sử dụng tài nguyên:
  CPU: 60-70% average, không vượt 85% trong sustained period
  Memory: 70-80%, không bao giờ > 95% (OOM risk)
  Disk: < 80% (cần space cho logs, swap, temp)
  Database connections: < 80% of max connections

Tại sao cần buffer?
  Traffic spikes: cần headroom để absorb spike tạm thời
  Failover: nếu 1 instance die, còn lại phải handle traffic của nó
  Deployments: rolling deploy cần extra capacity khi cả old và new chạy cùng
```

---

# 14. Chaos Engineering — Phá Để Học

## Triết Lý Chaos Engineering

Netflix tạo ra "Chaos Monkey" — một tool tự động random kill production instances. Mục đích: buộc system phải có resilience thực sự, không chỉ trên giấy.

> "Nếu bạn không test failure, failure sẽ test bạn — vào lúc tệ nhất."

```
Vấn đề của "we think it's reliable":
  Team thiết kế hệ thống, tự tin về resilience
  Nhưng chưa từng thử failover thật sự
  Khi incident xảy ra → failover không hoạt động như mong đợi
  → Đã test thì đã biết và đã fix

Chaos Engineering:
  Chủ động gây failure trong môi trường có kiểm soát
  Học cách hệ thống respond
  Fix gaps trước khi production incident xảy ra
```

## Chaos Experiments — Các Loại Thí Nghiệm

```
Infrastructure chaos:
  Kill một instance ngẫu nhiên → hệ thống có failover không?
  Kill cả một availability zone → multi-AZ có hoạt động không?
  Giới hạn network bandwidth → service có degrade gracefully không?
  Đầy disk → có alert không? Service có crash không?

Application chaos:
  Inject latency vào calls đến Service B → circuit breaker có trigger không?
  Return error từ downstream service → retry có hoạt động không?
  Tăng response time của DB lên 5s → timeout có fire đúng không?

Network chaos:
  Packet loss 30% → TCP retry có hoạt động không?
  DNS failure → service có dùng cached DNS không?
  Thêm độ trễ vào cross-zone communication → timeout đủ lớn không?
```

## Cách Chạy Chaos Experiment An Toàn

```
Bước 1: Define hypothesis
  "Nếu giết instance A, load balancer sẽ route traffic sang B và C
   và P99 latency sẽ không vượt 500ms trong vòng 30 giây"

Bước 2: Define steady state
  Đo baseline: error rate, latency, traffic hiện tại
  Đây là "bình thường" để compare với

Bước 3: Start small
  Bắt đầu trên staging environment
  Nếu stable, thử trên production với traffic nhỏ
  Không inject chaos vào toàn bộ production ngay

Bước 4: Inject chaos
  Kill instance → observe metrics
  Ready to stop nếu blast radius lớn hơn dự kiến

Bước 5: Observe and compare
  Hệ thống có recover về steady state không?
  Trong bao lâu?
  Có alert fire không?

Bước 6: Fix và repeat
  Nếu hệ thống không behave như hypothesis → fix
  Chạy lại experiment để confirm fix
```

---

# 15. Reliability Patterns — Mẫu Thiết Kế Đáng Tin Cậy

## Retry Pattern

Khi một operation fail, thử lại có thể giải quyết nếu đó là lỗi tạm thời.

```
Retry phù hợp cho:
  Network timeout (tạm thời)
  HTTP 503 (service tạm thời không available)
  Rate limit (429) với Retry-After header

Retry KHÔNG phù hợp cho:
  HTTP 400 Bad Request → retry cũng vẫn 400
  HTTP 401/403 → retry không giúp gì
  Idempotent operations chỉ (POST tạo order → retry tạo duplicate!)

Exponential Backoff + Jitter:
  Retry 1: đợi 1s
  Retry 2: đợi 2s
  Retry 3: đợi 4s
  Retry 4: đợi 8s
  + Jitter: thêm random time để tránh thundering herd
    (tất cả client retry cùng lúc → spike)
```

## Circuit Breaker Pattern

Khi downstream service đang fail, tiếp tục gọi là waste of time và làm hệ thống chậm.

```
CLOSED (Normal):
  Mọi request đi qua
  Đếm failures
  Failure rate < threshold → ở trạng thái này

OPEN (Tripped):
  Phát hiện failure rate > threshold (vd: 50% trong 1 phút)
  NGAY LẬP TỨC trả về lỗi không gọi downstream
  Đợi một khoảng thời gian (vd: 30 giây)
  Timeout phải được xử lý nhanh, không chờ downstream

HALF_OPEN (Testing):
  Sau thời gian chờ, cho phép một request test qua
  Nếu success → CLOSED
  Nếu fail → OPEN lại (đợi lâu hơn)
```

## Timeout Pattern

Mọi network call phải có timeout. Không có timeout → thread có thể chờ mãi → thread pool cạn → service không respond.

```
Timeout nên đặt ở đâu:
  Client timeout: thời gian client chờ response
  Connect timeout: thời gian để establish connection
  Read timeout: thời gian chờ data sau khi connected

Timeout values:
  Internal service call: 100-500ms (fast network, cùng datacenter)
  External API call: 2-5s (slower, third-party)
  Database query: 1-3s (depends on query)
  
Không nên set timeout quá cao:
  Database query: 30s timeout → một query chậm giữ DB connection 30s
  → Có thể làm hệ thống cascade fail
```

## Bulkhead Pattern

Cô lập các phần của hệ thống để failure ở một phần không lan sang phần khác.

```
Ví dụ thread pool bulkhead:
  Không có bulkhead:
    Một thread pool cho tất cả operations
    OrderService calls bị slow → thread pool full
    UserService calls cũng không được xử lý (dùng chung pool)
    → Toàn bộ service bị tê liệt vì một downstream chậm

  Với bulkhead:
    Thread pool riêng cho OrderService calls (max 10 threads)
    Thread pool riêng cho UserService calls (max 10 threads)
    OrderService bị slow → 10 threads của OrderService pool full
    UserService calls vẫn được xử lý bình thường
```

## Fallback Pattern

Khi operation fail, có alternative để trả về thay vì lỗi hoàn toàn.

```
Các loại fallback:

Return cached value:
  Payment service down → trả về cached result từ lần gọi trước

Return default value:
  Recommendation service down → trả về "popular items" default list

Degrade gracefully:
  Full personalization fail → trả về basic (non-personalized) version
  Real-time inventory fail → trả về "check availability" thay vì exact count

Queue for later:
  Email service down → lưu email vào queue, gửi khi service recover

Static response:
  Pricing service down → hiển thị "price unavailable, call us"
```

---

## Tóm Tắt SRE

```
SLI/SLO/SLA: đo lường đúng, đặt mục tiêu rõ ràng, SLO < SLA (buffer)
Error Budget: ngân sách lỗi cho phép → dùng để cân bằng reliability và velocity
Toil: nhận diện, đo lường, automate — không quá 50% thời gian
Observability: Metrics + Logs + Traces — ba trụ cột không thiếu cái nào
Four Golden Signals: Latency, Traffic, Errors, Saturation
Alerting: alert về symptoms của user, không phải internal metrics
Incident: Detect → Triage → Communicate → Mitigate → Resolve → Postmortem
Postmortem: blameless, có action items cụ thể với owner và deadline
On-Call: healthy = ít alert, ít false positive, runbook đầy đủ
Chaos Engineering: chủ động test failure trong môi trường có kiểm soát
Reliability Patterns: Retry, Circuit Breaker, Timeout, Bulkhead, Fallback
```
