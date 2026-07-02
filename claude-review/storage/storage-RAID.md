Tôi sẽ viết lại file này một cách rõ ràng, chi tiết và dễ hiểu hơn, đặc biệt tập trung vào việc giải thích các khái niệm một cách trực quan với nhiều ví dụ thực tế.

---

# 💾 Storage & RAID — Hướng Dẫn Toàn Diện

> Từ cách dữ liệu được lưu trên đĩa đến các kỹ thuật bảo vệ dữ liệu trong môi trường production

---

## 📚 Mục Lục

1. [Dữ Liệu Được Lưu Trữ Vật Lý Như Thế Nào](#1-dữ-liệu-được-lưu-trữ-vật-lý-như-thế-nào)
2. [HDD — Ổ Cứng Cơ Học](#2-hdd--ổ-cứng-cơ-học)
3. [SSD — Ổ Cứng Thể Rắn](#3-ssd--ổ-cứng-thể-rắn)
4. [Các Chỉ Số Đo Hiệu Năng Storage](#4-các-chỉ-số-đo-hiệu-năng-storage)
5. [RAID Là Gì — Vấn Đề Cần Giải Quyết](#5-raid-là-gì--vấn-đề-cần-giải-quyết)
6. [RAID 0 — Striping](#6-raid-0--striping)
7. [RAID 1 — Mirroring](#7-raid-1--mirroring)
8. [RAID 5 — Striping Với Parity](#8-raid-5--striping-với-parity)
9. [RAID 6 — Double Parity](#9-raid-6--double-parity)
10. [RAID 10 — Kết Hợp Mirror Và Stripe](#10-raid-10--kết-hợp-mirror-và-stripe)
11. [So Sánh Toàn Diện Các Loại RAID](#11-so-sánh-toàn-diện-các-loại-raid)
12. [Software RAID vs Hardware RAID](#12-software-raid-vs-hardware-raid)
13. [RAID Không Phải Là Backup](#13-raid-không-phải-là-backup)
14. [Filesystem — Lớp Tổ Chức Dữ Liệu](#14-filesystem--lớp-tổ-chức-dữ-liệu)
15. [Distributed Storage — Khi Một Máy Không Đủ](#15-distributed-storage--khi-một-máy-không-đủ)
16. [Erasure Coding — RAID Cho Hệ Thống Phân Tán](#16-erasure-coding--raid-cho-hệ-thống-phân-tán)
17. [Storage Trong Thực Tế Production](#17-storage-trong-thực-tế-production)

---

# 1. Dữ Liệu Được Lưu Trữ Vật Lý Như Thế Nào

Trước khi hiểu RAID, bạn cần hiểu cơ bản về cách dữ liệu thực sự được tổ chức trên thiết bị lưu trữ.

## 💡 Bit Và Byte — Đơn Vị Nhỏ Nhất

Hãy tưởng tượng bit như một công tắc đèn chỉ có hai trạng thái: **bật (1)** hoặc **tắt (0)**. Byte là một nhóm 8 công tắc đèn như vậy.

```
📌 Bit: đơn vị nhỏ nhất, chỉ có thể là 0 hoặc 1
📌 Byte: 8 bit ghép lại = 256 giá trị khác nhau (0-255)

Mối quan hệ:
  1 KB = 1,024 bytes
  1 MB = 1,024 KB
  1 GB = 1,024 MB
  1 TB = 1,024 GB

⚠️ LƯU Ý QUAN TRỌNG:
Nhà sản xuất ổ cứng thường dùng hệ thập phân (1 KB = 1000 bytes) 
trong khi máy tính dùng hệ nhị phân (1 KB = 1024 bytes).

Vì vậy, ổ cứng 1 TB chỉ hiển thị khoảng 931 GB trong Windows 
(sự khác biệt khoảng 7%)!

Ví dụ cụ thể:
  Ổ cứng: 1,000,000,000,000 bytes (theo nhà sản xuất)
  Máy tính: 1,000,000,000,000 / 1024 / 1024 / 1024 ≈ 931 GB
```

## 📂 Sector và Block — Đơn Vị Đọc/Ghi Thực Tế

Ổ đĩa không đọc/ghi từng byte riêng lẻ. Điều này giống như việc bạn không viết từng chữ cái vào sổ mà viết cả từ hoặc câu.

```
📌 Sector: đơn vị vật lý nhỏ nhất mà ổ đĩa có thể đọc/ghi
  • HDD truyền thống: 512 bytes/sector
  • Ổ đĩa hiện đại: 4096 bytes/sector (gọi là "4Kn")

📌 Block: nhóm các sector, là đơn vị mà hệ điều hành sử dụng

🔍 TẠI SAO CẦN NHÓM DỮ LIỆU?
Nếu phải thực hiện thao tác đọc/ghi cho từng byte:
  • HDD: phải di chuyển đầu đọc mỗi lần → cực kỳ chậm
  • SSD: phải quản lý hàng triệu byte riêng lẻ → phức tạp

Ví dụ thực tế:
  Khi bạn muốn ghi 10 bytes dữ liệu:
  • Ổ đĩa vẫn phải đọc/ghi nguyên một sector 512 hoặc 4096 bytes
  • Đây gọi là "write amplification" (hiệu ứng ghi phóng đại)
```

---

# 2. HDD — Ổ Cứng Cơ Học

## 🏗️ Cấu Tạo Vật Lý

HDD giống như một chiếc máy hát đĩa siêu nhỏ: nó có các đĩa kim loại xoay tròn và một kim đọc (thực chất là đầu đọc/ghi) di chuyển trên bề mặt đĩa.

```
📀 Cấu tạo cơ bản của HDD:

  1. Platter (đĩa): 
     • Là đĩa kim loại phủ vật liệu từ tính
     • Xoay với tốc độ cao (thường 5,400 - 15,000 vòng/phút)
     • Giống như đĩa than trong máy hát

  2. Đầu đọc/ghi (Read/Write Head):
     • Di chuyển qua lại trên bề mặt đĩa
     • Đọc/ghi dữ liệu bằng cách thay đổi từ tính
     • Không bao giờ chạm vào bề mặt đĩa (bay cách vài nano-met!)

  3. Trục quay (Spindle): giữ các đĩa quay đồng bộ

  4. Actuator arm: cánh tay cơ học di chuyển đầu đọc
```

## 🐢 Tại Sao HDD Chậm Với Truy Cập Ngẫu Nhiên

Đây là điểm quan trọng nhất để hiểu về hiệu năng của HDD.

```
🔍 SO SÁNH ĐỌC DỮ LIỆU:

📖 Đọc tuần tự (sequential read) - NHANH:
  Bạn đọc một cuốn sách từ đầu đến cuối:
  • Đầu đọc ở một vị trí cố định
  • Đĩa xoay qua, dữ liệu liền kề được đọc liên tục
  • Không cần di chuyển đầu đọc
  → Tốc độ: 100-200 MB/s

📖 Đọc ngẫu nhiên (random access) - CHẬM:
  Bạn tra cứu từ điển, mỗi lần tìm một từ khác nhau:
  • Mỗi lần phải di chuyển đầu đọc đến vị trí mới (seek time)
  • Chờ đĩa xoay đến đúng điểm cần đọc (rotational latency)
  
  • Seek time trung bình: 4-10 mili-giây
  • Rotational latency: ~4.2 mili-giây (với đĩa 7200 RPM)
  
  → Mỗi lần đọc ngẫu nhiên tốn 8-15 mili-giây CHỈ ĐỂ ĐỊNH VỊ!

⏰ SO SÁNH VỚI TỐC ĐỘ CPU:
  CPU xử lý một lệnh trong vài nano-giây
  1 mili-giây = 1,000,000 nano-giây
  
  Với CPU, 8 mili-giây giống như con người chờ vài giờ đồng hồ!
```

**Ví dụ thực tế:** Database thường xuyên phải tìm và cập nhật các bản ghi ở vị trí ngẫu nhiên. Vì vậy, database chạy trên HDD sẽ rất chậm so với SSD. Đây là lý do các hệ thống database quan trọng hầu như luôn chạy trên SSD.

## 📊 IOPS Của HDD

```
IOPS (Input/Output Operations Per Second): 
số lượng thao tác đọc/ghi mỗi giây

• HDD 7200 RPM thông thường: 75-100 IOPS (random)
• HDD 15000 RPM (doanh nghiệp): 175-210 IOPS (random)

🔑 ĐIỂM QUAN TRỌNG:
IOPS của HDD RẤT THẤP so với yêu cầu của ứng dụng hiện đại.
Đây là lý do SSD thay thế HDD trong hầu hết các hệ thống 
cần hiệu năng cao (database, ứng dụng giao dịch).
```

---

# 3. SSD — Ổ Cứng Thể Rắn

## ⚡ Không Có Bộ Phận Cơ Học

SSD khác HDD ở chỗ nó hoàn toàn không có bộ phận chuyển động. Nó giống như một chiếc USB cực lớn và cực nhanh.

```
💡 SSD (Solid State Drive):

  • Không có đĩa quay
  • Không có đầu đọc di chuyển
  • Không có seek time
  • Không có rotational latency
  
  → Truy cập ngẫu nhiên và tuần tự có tốc độ gần như nhau

📊 SO SÁNH IOPS:
  • HDD thông thường: 75-200 IOPS
  • SSD SATA: 50,000 - 100,000+ IOPS
  • NVMe SSD cao cấp: hàng triệu IOPS

  → SSD nhanh hơn HDD 500-1000 lần cho thao tác ngẫu nhiên!
```

## 🧱 Cấu Trúc NAND Flash

```
🏗️ CẤU TRÚC NAND FLASH (đơn giản hóa):

  Cell: 
    • Đơn vị nhỏ nhất
    • Lưu trữ electron để biểu diễn 0 hoặc 1
    • Giống như một thùng chứa nhỏ có thể đổ đầy hoặc để trống

  Page: 
    • Nhóm nhiều cell (thường 4-16 KB)
    • Là đơn vị ĐỌC/GHI nhỏ nhất
    • Giống như một tờ giấy trong cuốn sổ

  Block:
    • Nhóm nhiều page (thường 128-256 page)
    • Là đơn vị XÓA nhỏ nhất
    • Giống như một quyển sổ hoàn chỉnh

🔑 ĐIỀU QUAN TRỌNG NHẤT:
  • Bạn có thể GHI vào page trống
  • KHÔNG THỂ ghi đè trực tiếp lên page đã có dữ liệu
  • Phải XÓA CẢ BLOCK trước khi ghi lại vào bất kỳ page nào

  → Giống như việc bạn không thể tẩy một từ trong sổ, 
    mà phải xé cả trang và viết lại từ đầu!
```

## 📈 Write Amplification — Vấn Đề Đặc Trưng Của SSD

**Write Amplification Factor (WAF)** đo tỷ lệ giữa dữ liệu thực sự được ghi và dữ liệu logic bạn muốn ghi.

```
📝 VÍ DỤ THỰC TẾ:

Bạn muốn sửa một từ trong một đoạn văn:
  • Thực tế phải xóa cả đoạn và viết lại toàn bộ
  
  Tương tự, khi bạn muốn cập nhật 4 KB dữ liệu:
  • SSD phải:
    1. Đọc toàn bộ block (4 MB) vào bộ nhớ
    2. Cập nhật 4 KB trong bộ nhớ
    3. Xóa block gốc trên flash
    4. Ghi lại toàn bộ block 4 MB
  
  → Để ghi 4 KB, thực tế phải ghi 4 MB!
  → WAF = 4,096 KB / 4 KB = 1024 (trong ví dụ này)

WAF trong thực tế:
  • Lý tưởng: WAF = 1 (không có overhead)
  • Thực tế thông thường: WAF = 3-5
  • Trường hợp xấu nhất: WAF = 10-20

🔋 TÁC ĐỘNG ĐẾN TUỔI THỌ:
  Mỗi cell NAND chỉ chịu được số lần ghi/xóa nhất định
  • WAF cao → cell chết nhanh hơn
  • Tuổi thọ thường tính bằng TBW (TeraBytes Written)
```

## 🔄 Wear Leveling — Cân Bằng Tải Ghi

```
🔴 VẤN ĐỀ:
  Nếu cùng một vùng flash bị ghi/xóa liên tục:
  • Vùng đó "chết" sớm
  • Trong khi vùng khác vẫn còn tốt

🟢 GIẢI PHÁP:
  Controller SSD tự động PHÂN BỐ ĐỀU các thao tác ghi:
  • Giống như quản lý kho hàng: xếp hàng vào các kệ khác nhau
  • Mọi cell đều bị mòn đều nhau
  • Kéo dài tuổi thọ tổng thể

💡 LƯU Ý:
  Wear leveling xảy ra ở firmware của SSD
  • Ứng dụng và hệ điều hành không cần biết đến
  • Hoàn toàn tự động
```

---

# 4. Các Chỉ Số Đo Hiệu Năng Storage

## 🔢 IOPS — Số Thao Tác Mỗi Giây

```
📊 IOPS đo: số lượng lệnh đọc/ghi xử lý trong 1 giây

🎯 Phù hợp với: workload có nhiều thao tác NHỎ, NGẪU NHIÊN
  • Database transaction
  • File system metadata
  • Email server

📈 IOPS PHỤ THUỘC VÀO:
  • Kích thước block I/O (4KB? 8KB? 64KB?)
  • Tỷ lệ đọc/ghi (100% read? 70/30 read/write?)
  • Random hay sequential
  • Queue depth (số lệnh chờ xử lý)

⚠️ CẢNH BÁO KHI XEM SỐ LIỆU MARKETING:
  Nhà sản xuất quảng cáo "500,000 IOPS" thường:
  • Dùng block size nhỏ nhất (4KB)
  • Đo với điều kiện lý tưởng (100% read)
  • Queue depth rất cao (128+)

  → Số liệu thực tế của bạn có thể thấp hơn rất nhiều!
```

## 📦 Throughput — Băng Thông

```
📊 Throughput đo: lượng DỮ LIỆU truyền trong 1 giây (MB/s, GB/s)

🎯 Phù hợp với: workload đọc/ghi file LỚN, TUẦN TỰ
  • Backup và restore
  • Video streaming
  • Data warehouse scan

📐 CÔNG THỨC QUAN TRỌNG:
  Throughput = IOPS × Block Size

  Ví dụ 1:
    10,000 IOPS × 4 KB = 40,000 KB/s = 40 MB/s

  Ví dụ 2:
    Cùng 40 MB/s nhưng với block 256 KB:
    Chỉ cần 160 IOPS

🔍 HIỂU ĐÚNG THÔNG SỐ:
  Một thiết bị có thể:
  • "IOPS cao nhưng throughput thấp" 
    → Tối ưu cho random nhỏ (database)
  • "Throughput cao nhưng IOPS không nổi bật"
    → Tối ưu cho sequential (video editing)
```

## ⏱️ Latency — Độ Trễ

```
📊 Latency đo: THỜI GIAN hoàn thành MỘT thao tác đơn lẻ

📊 SO SÁNH LATENCY:
  • HDD:               5-15 ms
  • SATA SSD:           0.1-0.5 ms
  • NVMe SSD:           0.02-0.1 ms (20-100 μs)
  • RAM:               ~0.0001 ms (100 nano-giây)

💡 TẠI SAO LATENCY QUAN TRỌNG?
  Database transaction thường cần ĐỢI write hoàn thành:
  • Database ghi log transaction (synchronous write)
  • Client phải chờ xác nhận ghi xong mới tiếp tục
  
  → Latency cao → mỗi transaction chậm
  → Người dùng cảm thấy ứng dụng chậm chạp

  Ngay cả khi hệ thống có IOPS cao, 
  một transaction đơn lẻ vẫn bị ảnh hưởng bởi latency!
```

## 📥 Queue Depth — Độ Sâu Hàng Đợi

```
Queue depth = số lượng thao tác I/O chờ xử lý đồng thời

📊 SO SÁNH QUEUE DEPTH:

  Queue depth = 1 (chạy đơn luồng):
    • Mỗi lệnh phải hoàn thành mới gửi lệnh tiếp theo
    • Phản ánh đúng latency thực tế
    • Giống như người qua cửa quẹt thẻ một người một lượt

  Queue depth = 64 (chạy đa luồng):
    • Nhiều lệnh được gửi cùng lúc
    • Device xử lý song song (đặc biệt với NVMe có nhiều kênh)
    • IOPS tổng thể tăng đáng kể
    • Nhưng LATENCY MỖI LỆNH có thể tăng (phải chờ xếp hàng)
    • Giống như mở nhiều cửa quẹt thẻ cùng lúc

🔑 TẠI SAO QUAN TRỌNG:
  Benchmark SSD thường công bố IOPS ở queue depth rất cao
  • Đây là số liệu "tối đa", không phải "thực tế" cho ứng dụng đơn luồng
  • Ứng dụng web thường có queue depth trung bình (8-32)
```

---

# 5. RAID Là Gì — Vấn Đề Cần Giải Quyết

RAID (Redundant Array of Independent Disks) là kỹ thuật kết hợp nhiều ổ đĩa vật lý thành một đơn vị logic, giải quyết hai vấn đề chính.

## 🎯 Hai Vấn Đề RAID Giải Quyết

```
🔴 VẤN ĐỀ 1: Hiệu năng (Performance)
  • Một ổ đĩa đơn có giới hạn về IOPS và throughput
  • Cần hiệu năng cao hơn một ổ đĩa đơn
  
  ✅ Giải pháp: chia dữ liệu ra nhiều ổ, đọc/ghi SONG SONG
  → Giống như nhiều người cùng làm việc thay vì một người

🔴 VẤN ĐỀ 2: Độ tin cậy (Reliability)
  • Ổ đĩa CHẮC CHẮN sẽ hỏng một ngày nào đó
  • Cần bảo vệ dữ liệu khi một ổ đĩa hỏng
  
  ✅ Giải pháp: lưu dữ liệu dư thừa (redundancy) trên nhiều ổ
  → Giống như có bản sao lưu dự phòng

🎯 Các loại RAID khác nhau có cách tiếp cận và ưu tiên khác nhau
  • Chi phí (dung lượng sử dụng được)
  • Hiệu năng
  • Độ tin cậy
```

## 📚 Khái Niệm Nền Tảng

```
🔀 Striping (Phân mảnh):
  • Chia dữ liệu thành các "mảnh" nhỏ
  • Ghi rải đều lên nhiều ổ đĩa khác nhau
  • ✅ Tăng hiệu năng (đọc/ghi song song)
  • ❌ KHÔNG có redundancy - mất một ổ là mất dữ liệu
  • Giống như chia một cuốn sách thành nhiều phần, 
    mỗi người đọc một phần cùng lúc

🔄 Mirroring (Nhân bản):
  • Ghi CÙNG MỘT dữ liệu lên nhiều ổ đĩa
  • ✅ Tăng độ tin cậy (một ổ hỏng, ổ kia còn nguyên)
  • ❌ Tốn dung lượng (dùng N ổ chỉ có dung lượng = 1 ổ)
  • Giống như photocopy cuốn sách, có bản dự phòng

🔢 Parity (Dữ liệu chẵn lẻ):
  • Tính giá trị "kiểm tra" từ dữ liệu trên các ổ
  • Nếu một ổ hỏng → dùng parity + dữ liệu còn lại 
    để TÍNH LẠI dữ liệu bị mất
  • ✅ Tiết kiệm dung lượng hơn mirroring
  • ❌ Có chi phí tính toán khi ghi và khi khôi phục
  • Giống như giải mã mật mã: từ các mảnh ghép, 
    bạn có thể tái tạo lại mảnh bị thiếu
```

---

# 6. RAID 0 — Striping

## 🔀 Cách Hoạt Động

RAID 0 chia dữ liệu thành các stripe và ghi lên tất cả các ổ đĩa.

```
📝 VÍ DỤ CỤ THỂ:
  Dữ liệu cần lưu: A B C D E F G H

  RAID 0 với 4 ổ đĩa:
  Ổ 1: A E ...
  Ổ 2: B F ...
  Ổ 3: C G ...
  Ổ 4: D H ...

  Khi đọc dữ liệu:
    • Lệnh đọc A, B, C, D được thực hiện ĐỒNG THỜI
    • Mỗi ổ đọc một phần khác nhau
    → Tốc độ đọc tăng gấp 4 lần!

  Khi ghi dữ liệu:
    • Dữ liệu được chia nhỏ và ghi song song
    → Tốc độ ghi tăng gấp 4 lần!
```

## 📊 Đặc Điểm

```
Dung lượng sử dụng: 100%
  • 4 ổ × 1TB = 4TB dùng được
  • Không mất dung lượng cho redundancy

Hiệu năng: CAO NHẤT
  • Cả đọc và ghi đều song song
  • Tận dụng tối đa băng thông của tất cả các ổ

Độ tin cậy: KÉM NHẤT
  • KHÔNG CÓ redundancy
  • Nếu BẤT KỲ một ổ nào hỏng → MẤT TOÀN BỘ DỮ LIỆU
  • Vì mỗi file được chia trên nhiều ổ, thiếu một phần là hỏng cả file

⚠️ RỦI RO TĂNG THEO SỐ Ổ:
  • Mảng 2 ổ: xác suất hỏng gấp 2 lần ổ đơn
  • Mảng 4 ổ: xác suất hỏng gấp 4 lần ổ đơn
  • Càng nhiều ổ càng rủi ro!
```

## ✅ Khi Nào Dùng RAID 0

```
✅ PHÙ HỢP KHI:
  • Cần hiệu năng tối đa
  • Dữ liệu KHÔNG QUAN TRỌNG hoặc có thể tái tạo dễ dàng
  • Cache tạm thời (browser cache, hệ thống render video)
  • Scratch disk cho xử lý dữ liệu
  • Dữ liệu có sẵn backup chất lượng cao

❌ KHÔNG BAO GIỜ DÙNG CHO:
  • Dữ liệu production quan trọng
  • Database chứa dữ liệu khách hàng
  • Bất kỳ thứ gì không có backup riêng biệt
  • Hệ thống mà bạn không muốn mất dữ liệu
```

---

# 7. RAID 1 — Mirroring

## 🔄 Cách Hoạt Động

RAID 1 ghi CÙNG MỘT dữ liệu lên hai ổ đĩa giống hệt nhau.

```
📝 VÍ DỤ CỤ THỂ:
  Dữ liệu cần lưu: A B C D

  RAID 1 với 2 ổ đĩa:
  Ổ 1: A B C D
  Ổ 2: A B C D

  Khi ghi dữ liệu:
    • Phải ghi vào CẢ HAI ổ
    • Chậm hơn một chút (phải đợi cả hai hoàn thành)

  Khi đọc dữ liệu:
    • Có thể đọc từ ổ NÀO CŨNG ĐƯỢC
    • Một số hệ thống đọc song song từ cả hai ổ
    → Tăng tốc độ đọc!
```

## 📊 Đặc Điểm

```
Dung lượng sử dụng: 50%
  • 2 ổ × 1TB = 1TB dùng được
  • Một nửa dung lượng dành cho bản sao

Hiệu năng ghi: tương đương ổ đơn (có thể chậm hơn nhẹ)
  • Phải ghi vào cả hai ổ
  • Phải đợi cả hai xác nhận hoàn thành

Hiệu năng đọc: có thể NHANH HƠN ổ đơn
  • Đọc từ cả hai ổ song song
  • Phân tải đọc giữa các ổ

Độ tin cậy: RẤT TỐT
  • Mất MỘT ổ → dữ liệu vẫn CÒN NGUYÊN trên ổ còn lại
  • Hệ thống tiếp tục hoạt động (degraded mode)
  • Chỉ mất dữ liệu khi CẢ HAI ổ hỏng CÙNG LÚC
  • Xác suất thấp hơn nhiều so với RAID 0
```

## ✅ Khi Nào Dùng RAID 1

```
✅ PHÙ HỢP KHI:
  • Cần độ tin cậy cao
  • Dung lượng không phải vấn đề lớn
  • Hệ điều hành / boot drive (cần luôn sẵn sàng)
  • Hệ thống nhỏ, ngân sách hạn chế nhưng cần redundancy
  • Chỉ cần 2 ổ là đã có redundancy

📝 VÍ DỤ THỰC TẾ:
  • Server database nhỏ cần độ tin cậy cao
  • Máy chủ web không thể downtime
  • Hệ thống lưu trữ email của công ty nhỏ
```

---

# 8. RAID 5 — Striping Với Parity

## 🔢 Cách Hoạt Động

RAID 5 kết hợp striping với một khối parity, phân bố luân phiên trên các ổ.

```
📝 VÍ DỤ VỚI 4 Ổ ĐĨA:

  Ổ 1: A    D    Parity(J,K,L)   M
  Ổ 2: B    Parity(G,H,I)   J    N
  Ổ 3: Parity(D,E,F)   H    K    O
  Ổ 4: Parity(A,B,C)   G    L    P

  Giải thích:
  • Parity(A,B,C) = A XOR B XOR C
  • Parity được phân bố luân phiên, không cố định một ổ

🔍 CÁCH TÍNH PARITY BẰNG XOR:

  XOR là phép toán đặc biệt:
    Kết quả = 1 nếu số lượng bit 1 là LẺ
    Kết quả = 0 nếu số lượng bit 1 là CHẴN

  Ví dụ với 3 bit:
    1 XOR 0 XOR 1 = 0 (vì có 2 bit 1 → chẵn → kết quả 0)
    1 XOR 1 XOR 1 = 1 (vì có 3 bit 1 → lẻ → kết quả 1)

  Áp dụng vào RAID 5:
    Ổ A = 1, Ổ B = 0, Ổ C = 1
    Parity = 1 XOR 0 XOR 1 = 0

  Nếu Ổ B hỏng (mất bit 0):
    Khôi phục B = A XOR C XOR Parity
                = 1 XOR 1 XOR 0 = 0
    → Khôi phục ĐÚNG giá trị gốc của B!
```

## 📊 Đặc Điểm

```
Dung lượng sử dụng: (N-1)/N
  • 4 ổ × 1TB = 3TB dùng được (mất 1TB cho parity)
  • 8 ổ × 1TB = 7TB dùng được (mất 1TB cho parity)
  → Hiệu quả dung lượng TỐT HƠN RAID 1 khi có nhiều ổ

Yêu cầu tối thiểu: 3 ổ đĩa

Hiệu năng đọc: tốt (gần tương đương striping)
Hiệu năng ghi: CÓ overhead đáng kể
  • Mỗi lần ghi phải TÍNH LẠI parity
  • Phải đọc dữ liệu cũ, tính XOR, rồi ghi
  → Gọi là "RAID 5 write penalty" (phạt khi ghi)

Độ tin cậy: chịu được MẤT MỘT ổ
  ⚠️ NHƯNG trong lúc rebuild (khôi phục):
  • Phải ĐỌC TOÀN BỘ dữ liệu từ các ổ còn lại
  • Quá trình này NẶNG, có thể mất NHIỀU GIỜ
  • Nếu CÓ THÊM một ổ hỏng trong lúc rebuild
    → MẤT TOÀN BỘ DỮ LIỆU!
```

## ⚠️ Vấn Đề Nghiêm Trọng Với RAID 5

```
🔴 TẠI SAO TRÁNH RAID 5 VỚI Ổ ĐĨA LỚN (≥ 2TB):

  Unrecoverable Read Error Rate (URE):
    • Ổ đĩa hiện đại: 1 lỗi trên 10^14 đến 10^15 bit đọc
    • Ổ 4TB có khoảng 3.2 × 10^13 bit

  Xác suất lỗi trong rebuild:
    • Phải đọc TOÀN BỘ dữ liệu trên TẤT CẢ các ổ
    • Với 4TB, xác suất gặp lỗi đọc trong quá trình này 
      là ĐÁNG KỂ, KHÔNG CÒN HIẾM NỮA!
    
    • Nếu gặp lỗi đọc trong lúc rebuild:
      → RAID 5 không thể hoàn thành rebuild
      → MẤT DỮ LIỆU VĨNH VIỄN

📊 TÍNH TOÁN XÁC SUẤT (ước tính):
  • Mảng RAID 5 với 4 ổ × 2TB
  • Phải đọc 6TB dữ liệu để rebuild
  • Xác suất gặp lỗi đọc ≈ 6TB × (1/10^14) ≈ 0.006%
  
  • Mảng RAID 5 với 8 ổ × 4TB
  • Phải đọc 28TB dữ liệu để rebuild
  • Xác suất gặp lỗi đọc ≈ 28TB × (1/10^14) ≈ 0.028%
  
  Con số này không lớn nhưng KHÔNG PHẢI LÀ KHÔNG!
  Và trong production, rủi ro này là hoàn toàn không chấp nhận được.

→ Đây là lý do RAID 6 ra đời!
```

---

# 9. RAID 6 — Double Parity

## 🔢 Cách Hoạt Động

RAID 6 giống RAID 5 nhưng dùng HAI khối parity độc lập.

```
📝 VÍ DỤ VỚI 5 Ổ ĐĨA:
  Ổ 1: A    E    Parity(J,K,L)   Q
  Ổ 2: B    F    J                ...
  Ổ 3: C    G    K                ...
  Ổ 4: D    H    L                ...
  Ổ 5: P    Q    R                ...

  Trong đó:
  • P = Parity 1 (XOR như RAID 5)
  • Q = Parity 2 (thuật toán Reed-Solomon)
  
  • Hai parity độc lập
  • Chịu được MẤT ĐỒNG THỜI HAI ổ đĩa bất kỳ
```

## 📊 Đặc Điểm

```
Dung lượng sử dụng: (N-2)/N
  • 6 ổ × 1TB = 4TB dùng được (mất 2TB cho hai parity)
  • 8 ổ × 1TB = 6TB dùng được

Yêu cầu tối thiểu: 4 ổ đĩa

Hiệu năng ghi: overhead LỚN HƠN RAID 5
  • Phải tính TOÁN HAI loại parity
  • Write penalty cao hơn

Độ tin cậy: chịu được mất HAI ổ cùng lúc
  ✅ Giải quyết vấn đề của RAID 5:
    • Trong lúc rebuild, nếu gặp lỗi đọc ở một ổ khác
    • Vẫn còn một lớp parity để khôi phục
    • An toàn hơn rất nhiều!

  ✅ An toàn với ổ đĩa dung lượng lớn
```

## ✅ Khi Nào Dùng RAID 6

```
✅ PHÙ HỢP KHI:
  • Mảng có NHIỀU ổ đĩa dung lượng LỚN (≥ 2TB)
  • Cần độ tin cậy cao hơn RAID 5
  • Production quan trọng
  • Chấp nhận overhead ghi cao hơn để đổi lấy an toàn

📝 VÍ DỤ THỰC TẾ:
  • Storage array doanh nghiệp hiện đại
  • Ổ đĩa SATA/SAS dung lượng lớn (4TB, 8TB, 12TB)
  • Môi trường archive và backup
  • Workload không quá nhạy cảm với write latency
```

---

# 10. RAID 10 — Kết Hợp Mirror Và Stripe

## 🔄 Cách Hoạt Động

RAID 10 (RAID 1+0) = Mirror + Stripe theo thứ tự.

```
📝 VÍ DỤ VỚI 4 Ổ ĐĨA:

  Bước 1: Tạo 2 cặp mirror (RAID 1):
    Cặp 1: Ổ 1 + Ổ 2 (giống hệt nhau)
    Cặp 2: Ổ 3 + Ổ 4 (giống hệt nhau)

  Bước 2: Stripe (RAID 0) trên 2 cặp mirror:
    Cặp 1: A E I M ...
    Cặp 2: B F J N ...

  Kết quả:
    • Dữ liệu được stripe qua các cặp (hiệu năng cao)
    • Mỗi cặp có mirror (an toàn)

  Khi đọc/ghi A và B:
    • Xảy ra ĐỒNG THỜI trên hai cặp khác nhau
    → Hiệu năng gần bằng RAID 0
    • Mỗi cặp có redundancy đầy đủ
    → An toàn như RAID 1
```

## 📊 Đặc Điểm

```
Dung lượng sử dụng: 50%
  • 4 ổ × 1TB = 2TB dùng được
  • Giống RAID 1 về hiệu quả dung lượng

Yêu cầu tối thiểu: 4 ổ đĩa (số chẵn)

Hiệu năng: GẦN BẰNG RAID 0
  • Cả đọc và ghi đều song song
  • KHÔNG có write penalty (không cần tính parity)
  • Chỉ cần ghi vào cặp mirror tương ứng

Độ tin cậy: RẤT TỐT
  • Chịu được mất MỘT ổ trong MỖI cặp mirror
  • Có thể mất TỐI ĐA một nửa số ổ
  • Miễn là không mất CẢ HAI ổ trong CÙNG MỘT cặp

Rebuild: NHANH HƠN RAID 5/6
  • Khi một ổ hỏng, chỉ cần COPY dữ liệu từ ổ còn lại
  • Không cần đọc và tính toán từ TẤT CẢ các ổ
  → Rebuild nhanh hơn, ít rủi ro hơn
```

## ✅ Khi Nào Dùng RAID 10

```
✅ PHÙ HỢP KHI:
  • Cần CẢ hiệu năng cao VÀ độ tin cậy cao
  • Có đủ ngân sách (tốn 50% dung lượng)
  • Database production quan trọng
  • Write-heavy workload cần performance tốt

📊 SO SÁNH VỚI RAID 5/6:
  • Nhanh hơn đáng kể cho write-heavy workload
  • Rebuild nhanh hơn, an toàn hơn
  • Tốn nhiều dung lượng hơn (50% vs ~70-85% của RAID 5/6)

📝 VÍ DỤ THỰC TẾ:
  • Database transaction-heavy (ngân hàng, thương mại điện tử)
  • Hệ thống OLTP (Online Transaction Processing)
  • Môi trường có ngân sách, cần hiệu năng tối đa
  • Là lựa chọn phổ biến nhất cho database enterprise
```

---

# 11. So Sánh Toàn Diện Các Loại RAID

## 📊 Bảng So Sánh Tổng Quan

```
┌────────┬──────────────┬───────────┬───────────┬─────────────┬──────────┐
│ RAID   │ Dung lượng   │ Hiệu năng │ Hiệu năng │ Chịu được   │ Ổ tối    │
│ Level  │ sử dụng được │ đọc       │ ghi       │ mất bao     │ thiểu    │
│        │              │           │           │ nhiêu ổ     │          │
├────────┼──────────────┼───────────┼───────────┼─────────────┼──────────┤
│ 0      │ 100%         │ Rất cao   │ Rất cao   │ 0 ổ         │ 2        │
│ 1      │ 50%          │ Cao       │ Trung bình│ 1 ổ         │ 2        │
│ 5      │ (N-1)/N      │ Cao       │ Thấp      │ 1 ổ         │ 3        │
│ 6      │ (N-2)/N      │ Cao       │ Thấp nhất │ 2 ổ         │ 4        │
│ 10     │ 50%          │ Rất cao   │ Cao       │ 1 ổ/cặp     │ 4        │
└────────┴──────────────┴───────────┴───────────┴─────────────┴──────────┘
```

## 📝 Ví Dụ Cụ Thể Với 8 Ổ × 2TB (Total Raw = 16TB)

| RAID Level | Dung lượng dùng được | Mất bao nhiêu ổ? | Ghi chú |
|------------|---------------------|------------------|---------|
| RAID 0 | 16 TB | 0 ổ | Tốc độ tối đa, rủi ro cao nhất |
| RAID 1 | 8 TB (4 cặp) | 1 ổ/cặp | Tốn 50% dung lượng |
| RAID 5 | 14 TB | 1 ổ | Hiệu quả dung lượng cao |
| RAID 6 | 12 TB | 2 ổ | An toàn hơn với ổ lớn |
| RAID 10 | 8 TB | 1 ổ/cặp | Nhanh và an toàn, tốn 50% dung lượng |

## 🌳 Cây Quyết Định Chọn RAID

```
Câu hỏi 1: Dữ liệu có quan trọng không?
  ├─ Không quan trọng, chỉ cần tốc độ tối đa
  │   → RAID 0 (có backup riêng!)
  │
  └─ Quan trọng, cần redundancy
      → Câu hỏi 2

Câu hỏi 2: Ngân sách dung lượng có thoải mái không?
  ├─ Thoải mái, ưu tiên hiệu năng VÀ an toàn
  │   → RAID 10
  │
  └─ Hạn chế, cần tối ưu dung lượng
      → Câu hỏi 3

Câu hỏi 3: Workload chủ yếu là đọc hay ghi?
  ├─ Đọc nhiều, ghi ít (archive, file server)
  │   → RAID 5 (nếu ổ nhỏ) hoặc RAID 6 (nếu ổ lớn)
  │
  └─ Ghi nhiều, cần hiệu năng ghi tốt
      → Cân nhắc RAID 10 nếu có thể
      → Hoặc RAID 5/6 với cache lớn để bù write penalty

Câu hỏi 4: Số ổ và dung lượng mỗi ổ?
  ├─ Nhiều ổ dung lượng lớn (≥ 4TB)
  │   → ƯU TIÊN RAID 6 thay vì RAID 5
  │   (rủi ro lỗi đọc trong rebuild quá cao)
  │
  └─ Ít ổ, dung lượng nhỏ
      → Có thể cân nhắc RAID 5
```

---

# 12. Software RAID vs Hardware RAID

## 🔧 Hardware RAID

RAID controller là thiết bị phần cứng chuyên dụng.

```
📦 Cấu tạo:
  • Card cắm vào mainboard
  • Có CPU riêng
  • Có RAM cache riêng (có thể có pin dự phòng)
  • Độc lập với hệ điều hành

✅ Ưu điểm:
  • Hiệu năng tốt hơn (tính parity bằng chip chuyên dụng)
  • Không tốn CPU của server
  • Cache có thể được bảo vệ bằng pin (battery backup)
  • Bảo vệ dữ liệu trong cache khi mất điện

❌ Nhược điểm:
  • Chi phí phần cứng bổ sung
  • Vendor lock-in: format theo cách riêng của hãng
  • Nếu controller hỏng, có thể chỉ đọc được bằng đúng model đó
  • Khó migrate hoặc thay đổi cấu hình

📝 Ví dụ:
  • Dell PERC (PowerEdge RAID Controller)
  • HP Smart Array
  • LSI MegaRAID
```

## 💻 Software RAID

RAID được quản lý hoàn toàn bởi phần mềm, không cần phần cứng chuyên dụng.

```
📦 Cấu tạo:
  • Hệ điều hành thấy TỪNG ổ đĩa riêng lẻ
  • Driver/kernel của OS xử lý logic RAID
  • CPU của server thực hiện các phép tính

✅ Ưu điểm:
  • Không cần phần cứng bổ sung → tiết kiệm
  • Linh hoạt, dễ thay đổi cấu hình
  • Không phụ thuộc vendor
  • Dễ di chuyển mảng RAID sang máy khác

❌ Nhược điểm:
  • Tốn CPU (đặc biệt với RAID 5/6)
  • Không có battery-backed cache như hardware cao cấp
  • Rủi ro mất dữ liệu cache khi mất điện (trừ khi có UPS)

📝 Ví dụ:
  • Linux MD RAID (mdadm)
  • Windows Storage Spaces
  • ZFS (có cả software RAID)
```

## 🌐 Xu Hướng Hiện Đại

```
🚀 Trong môi trường cloud và ảo hóa hiện đại:
  Software RAID (hoặc tương đương) đang phổ biến hơn

📊 Lý do:
  • CPU hiện đại đủ mạnh, overhead không còn đáng kể
  • Tính linh hoạt quan trọng hơn trong cloud
  • Không phụ thuộc phần cứng vật lý cụ thể
  • Nhiều hệ thống lưu trữ phân tán hiện đại 
    đã thay thế RAID truyền thống bằng redundancy ở tầng software
    trên nhiều máy chủ khác nhau
```

---

# 13. RAID Không Phải Là Backup

## ⚠️ Hiểu Lầm Nguy Hiểm Nhất Trong Vận Hành Hệ Thống

```
🔴 RAID BẢO VỆ KHỎI:
  • Hỏng PHẦN CỨNG của một (hoặc vài) ổ đĩa

🔴 RAID KHÔNG BẢO VỆ KHỎI:

  1. Lỗi do con người:
     • Xóa nhầm file/database
     • RAID nhân bản việc xóa đó NGAY LẬP TỨC!
     → Không có "phiên bản cũ" để quay lại

  2. Lỗi phần mềm / corruption:
     • Bug trong ứng dụng ghi dữ liệu sai/hỏng
     • Dữ liệu hỏng được lưu trên TẤT CẢ các ổ RAID
     → RAID chỉ đảm bảo dữ liệu GIỐNG NHAU, không đảm bảo ĐÚNG

  3. Ransomware / mã độc:
     • Mã độc mã hóa toàn bộ file
     • RAID nhân bản việc mã hóa đó lên tất cả các ổ

  4. Thiên tai / hỏa hoạn:
     • Nếu tất cả ổ đĩa trong CÙNG MỘT server
     • Một sự cố vật lý lớn (cháy, ngập) phá hủy TẤT CẢ

  5. Lỗi controller RAID:
     • Lỗi ở chính phần mềm/phần cứng quản lý RAID
     • Có thể làm hỏng dữ liệu trên toàn mảng
```

## 📋 Nguyên Tắc 3-2-1 Cho Backup

```
🎯 RAID vs Backup - SỰ KHÁC NHAU CƠ BẢN:
  • RAID: giúp hệ thống TIẾP TỤC HOẠT ĐỘNG khi một ổ hỏng
  • Backup: bảo vệ khỏi MẤT DỮ LIỆU vĩnh viễn

📌 NGUYÊN TẮC 3-2-1 KINH ĐIỂN:

  3️⃣ 3 bản sao của dữ liệu
      • Bản gốc + ít nhất 2 bản sao

  2️⃣ 2 loại phương tiện lưu trữ khác nhau
      • Ví dụ: ổ đĩa local + cloud storage
      • Hoặc: disk + tape

  1️⃣ 1 bản sao lưu trữ OFF-SITE
      • Vị trí địa lý khác nhau
      • Bảo vệ khỏi thảm họa tại một địa điểm

💡 RAID là một LỚP trong chiến lược tổng thể
  • Không bao giờ là chiến lược DUY NHẤT
  • Không thay thế được backup thực sự
```

---

# 14. Filesystem — Lớp Tổ Chức Dữ Liệu

## 📂 Vai Trò Của Filesystem

```
Raw block device (ổ đĩa hoặc mảng RAID):
  • Chỉ là chuỗi block đánh số liên tục
  • Không có khái niệm "file", "folder", "tên file"

Filesystem thêm vào:
  • Cấu trúc thư mục phân cấp
  • Metadata: tên file, kích thước, thời gian sửa, quyền truy cập
  • Cơ chế cấp phát không gian
  • Cơ chế theo dõi block nào đang dùng, block nào trống
```

## 📝 Journaling — Bảo Vệ Tính Toàn Vẹn

```
🔴 VẤN ĐỀ:
  • Mất điện đột ngột GIỮA LÚC đang ghi file
  • Filesystem có thể rơi vào trạng thái KHÔNG NHẤT QUÁN
  • Một số cấu trúc dữ liệu nội bộ bị hỏng

🟢 GIẢI PHÁP - Journaling:
  Bước 1: Ghi Ý ĐỊNH thay đổi vào "nhật ký" (journal)
  Bước 2: Thực hiện thay đổi THỰC SỰ
  Bước 3: Đánh dấu journal entry là "đã hoàn thành"

  Nếu mất điện giữa chừng:
  • Khi khởi động lại, đọc journal
  • Entry nào "chưa hoàn thành" → REPLAY (thực hiện lại)
  • Hoặc ROLLBACK (hủy bỏ) một cách an toàn

  → Đảm bảo filesystem luôn nhất quán!

✅ Hầu hết filesystem hiện đại đều có journaling
```

## 🌀 Copy-on-Write Filesystem

```
🔄 CƠ CHẾ ĐẶC BIỆT:
  • Không ghi đè trực tiếp lên dữ liệu cũ
  • Ghi dữ liệu MỚI vào vị trí KHÁC
  • Sau đó mới cập nhật con trỏ đến vị trí mới

✅ LỢI ÍCH:
  1. An toàn hơn khi có sự cố:
     • Dữ liệu cũ vẫn còn nguyên
     • Cho đến khi thao tác mới HOÀN TOÀN thành công

  2. Snapshot cực kỳ hiệu quả:
     • Dữ liệu cũ không bị ghi đè
     • Giữ lại con trỏ đến trạng thái cũ làm "snapshot"
     • Không cần copy toàn bộ dữ liệu ngay lập tức

  3. Built-in checksum:
     • Phát hiện được data corruption (bit rot)
     • Mà filesystem truyền thống không phát hiện được

📝 Ví dụ:
  • ZFS
  • Btrfs
  • OpenZFS
```

---

# 15. Distributed Storage — Khi Một Máy Không Đủ

## 🏢 Giới Hạn Của RAID Truyền Thống

```
🔴 GIỚI HẠN CỦA RAID TRONG MỘT MÁY:
  • Toàn bộ dữ liệu nằm trong MỘT server vật lý
  • Server hỏng nguồn, mainboard, hoặc mất điện
    → TOÀN BỘ dữ liệu không truy cập được
    (dù ổ đĩa hoàn toàn nguyên vẹn)
  • Dung lượng giới hạn bởi số khe cắm ổ đĩa vật lý

🟢 DISTRIBUTED STORAGE GIẢI QUYẾT:
  • Phân tán dữ liệu trên NHIỀU máy chủ khác nhau
  • Có thể ở nhiều rack, nhiều datacenter
  • Redundancy ở TẦNG MẠNG, không chỉ ở tầng ổ đĩa
```

## 📦 Replication — Nhân Bản Qua Nhiều Node

```
🔄 KHÁI NIỆM:
  Tương tự RAID 1 (mirroring) nhưng ở quy mô NHIỀU MÁY CHỦ

📊 Replication Factor = 3 (phổ biến):
  • Mỗi block dữ liệu trên 3 node KHÁC NHAU
  • Lý tưởng: các rack khác nhau, availability zone khác nhau

📝 QUY TRÌNH GHI:
  Client → Node 1 → Node 2 + Node 3 (copy)
  • Đồng bộ hoặc bất đồng bộ tùy hệ thống

📝 QUY TRÌNH ĐỌC:
  • Đọc từ BẤT KỲ node nào có bản sao
  • Load balancing tự nhiên

🔒 MỘT NODE HỎNG:
  • Dữ liệu còn trên 2 node khác
  • Tự động tạo bản sao mới trên node khác

💰 Chi phí: với replication factor 3
  • Chỉ dùng được 1/3 tổng dung lượng raw
  • Tương tự overhead của RAID 1
```

## ⚖️ Quorum — Đảm Bảo Nhất Quán

```
🔴 VẤN ĐỀ:
  Với 3 bản sao khác nhau, làm sao đảm bảo đọc được 
  giá trị MỚI NHẤT, NHẤT QUÁN?

🟢 GIẢI PHÁP - Quorum:

  W (write quorum): số node phải xác nhận ghi thành công
  R (read quorum): số node phải được đọc và so sánh
  
  Nguyên tắc: W + R > N (N = tổng số bản sao)
  → Bất kỳ tập READ nào cũng GIAO NHAU với tập WRITE gần nhất

📊 VÍ DỤ VỚI N=3:
  W=2, R=2: 2+2=4 > 3 → đảm bảo consistency (mạnh)
  W=1, R=1: 1+1=2 < 3 → KHÔNG đảm bảo (eventual consistency)
```

---

# 16. Erasure Coding — RAID Cho Hệ Thống Phân Tán

## 🔴 Vấn Đề Với Replication Thuần Túy

```
💰 Replication factor 3:
  • Tốn chi phí dung lượng RẤT LỚN
  • Chỉ dùng được 33% dung lượng raw
  
  → Với hệ thống petabyte, chi phí này rất đáng kể!
```

## 🧮 Erasure Coding — Giải Pháp Tiết Kiệm

```
🎯 KHÁI NIỆM:
  Tương đương "RAID 5/6" ở quy mô PHÂN TÁN
  (nhiều node, thay vì nhiều ổ đĩa)

📝 CÁCH HOẠT ĐỘNG:

  Bước 1: Chia dữ liệu thành K mảnh (data fragments)
  
  Bước 2: Tính thêm M mảnh parity 
    (Reed-Solomon coding - phức tạp hơn XOR)
  
  Bước 3: Lưu K+M mảnh trên K+M node khác nhau
  
  🔑 Điểm quan trọng:
    Để khôi phục, chỉ cần BẤT KỲ K mảnh 
    trong tổng K+M mảnh

📊 VÍ DỤ: Erasure Coding 10+4
  • 10 mảnh dữ liệu + 4 mảnh parity = 14 mảnh
  • Chịu mất TỐI ĐA 4 node bất kỳ
  • Hiệu quả dung lượng: 10/14 ≈ 71% 
    (so với replication factor 3 chỉ 33%)
```

## 📊 So Sánh Replication vs Erasure Coding

```
┌──────────────────┬─────────────────────┬──────────────────────┐
│                  │ Replication (×3)     │ Erasure Coding (10+4)│
├──────────────────┼─────────────────────┼──────────────────────┤
│ Hiệu quả dung    │ ~33%                 │ ~71%                 │
│ lượng            │                      │                      │
│ Chịu mất bao     │ 2 node               │ 4 node               │
│ nhiêu node       │                      │                      │
│ Tốc độ đọc       │ Nhanh (đọc 1 bản)    │ Chậm hơn (đọc nhiều │
│                  │                      │ mảnh, decode)        │
│ Tốc độ rebuild   │ Nhanh (copy 1-1)     │ Chậm hơn (tính toán │
│                  │                      │ từ nhiều mảnh)       │
│ CPU overhead     │ Thấp                 │ Cao hơn              │
├──────────────────┼──────────────────────┼─────────────────────┤
│ Phù hợp cho      │ Dữ liệu HOT          │ Dữ liệu COLD/Archive │
│                  │ (truy cập thường)    │ (lưu lâu dài)        │
└──────────────────┴──────────────────────┴─────────────────────┘

💡 Chiến lược hybrid (Nhiều hệ thống lớn):
  • Dữ liệu mới, hay truy cập → Replication
    (ưu tiên tốc độ, chấp nhận tốn dung lượng)
  
  • Dữ liệu cũ, ít truy cập → Erasure Coding
    (tiết kiệm dung lượng, chấp nhận chậm hơn)
```

---

# 17. Storage Trong Thực Tế Production

## 📋 Checklist Khi Thiết Kế Storage

```
❓ CÂU HỎI VỀ HIỆU NĂNG:
  • Workload đọc nhiều hay ghi nhiều? Tỷ lệ?
  • Cần random access (database) hay sequential (streaming)?
  • Yêu cầu latency bao nhiêu?
  • IOPS dự kiến ở peak traffic?

❓ CÂU HỎI VỀ ĐỘ TIN CẬY:
  • RPO (Recovery Point Objective) - chấp nhận mất bao nhiêu dữ liệu?
  • RTO (Recovery Time Objective) - chấp nhận downtime bao lâu?
  • Chịu được mất CẢ MỘT datacenter hay chỉ một ổ?

❓ CÂU HỎI VỀ CHI PHÍ:
  • Ngân sách cho redundancy?
  • So sánh: chi phí downtime/mất dữ liệu vs chi phí redundancy?
```

## 📊 Monitoring Storage Trong Production

```
📈 CÁC CHỈ SỐ CẦN THEO DÕI:

1. SMART attributes của ổ đĩa:
   • Reallocated sector count (sector dự phòng đã dùng)
   • Temperature (nhiệt độ)
   • Power-on hours (thời gian hoạt động)

2. Trạng thái mảng RAID:
   • Có đang "degraded" không? (mất một ổ)
   • Tiến độ rebuild (nếu đang phục hồi)

3. Latency và IOPS thực tế:
   • So với baseline bình thường
   • Latency tăng đột biến = dấu hiệu sớm của vấn đề

4. Dung lượng còn trống:
   • Ổ gần đầy → performance degradation
   • Đặc biệt với SSD: cần space cho garbage collection

⚠️ NGUYÊN TẮC VÀNG:
  Mảng RAID bị "degraded" = TÍN HIỆU KHẨN CẤP!
  • Không phải để yên tâm quên đi
  • KHÔNG CÒN redundancy dự phòng
  • Nếu thêm sự cố trước khi rebuild xong → MẤT DỮ LIỆU
```

---

## 📝 Tóm Tắt Toàn Bộ

```
🏗️ NỀN TẢNG VẬT LÝ:
  • HDD: cơ học, chậm random (seek time)
  • SSD: điện tử, nhanh, nhưng có write amplification

📊 CHỈ SỐ HIỆU NĂNG:
  • IOPS: thao tác/giây → quan trọng cho random
  • Throughput: dữ liệu/giây → quan trọng cho sequential
  • Latency: thời gian/thao tác → quan trọng với ứng dụng nhạy cảm

🎯 RAID GIẢI QUYẾT HAI VẤN ĐỀ:
  • Hiệu năng (striping)
  • Độ tin cậy (mirroring hoặc parity)

📊 CÁC LOẠI RAID:
  • RAID 0: striping, nhanh nhất, KHÔNG redundancy
  • RAID 1: mirror, an toàn, tốn 50% dung lượng
  • RAID 5: stripe + 1 parity, hiệu quả dung lượng, rủi ro với ổ lớn
  • RAID 6: stripe + 2 parity, an toàn với ổ lớn
  • RAID 10: mirror + stripe, nhanh và an toàn, tốn 50% dung lượng

⚠️ NGUYÊN TẮC VÀNG:
  • RAID không phải backup!
  • Luôn áp dụng nguyên tắc 3-2-1 cho backup thực sự

🌐 DISTRIBUTED STORAGE:
  • Replication: RAID 1 ở quy mô nhiều máy
  • Erasure Coding: RAID 5/6 ở quy mô nhiều máy
  • Quorum (W+R>N): đảm bảo nhất quán

🔧 VẬN HÀNH THỰC TẾ:
  • Mảng "degraded" = tín hiệu khẩn cấp
  • Theo dõi SMART, latency, dung lượng liên tục
  • Luôn có backup 3-2-1 cho dữ liệu quan trọng
```
