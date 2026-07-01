# 💾 Storage & RAID — Toàn Tập
>
> Từ cách dữ liệu được lưu trên đĩa đến các kỹ thuật bảo vệ dữ liệu production

---

## Mục Lục

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

Trước khi hiểu RAID, cần hiểu cơ bản dữ liệu thực sự nằm ở đâu trên thiết bị lưu trữ.

## Bit Và Byte — Đơn Vị Nhỏ Nhất

```
Bit: đơn vị nhỏ nhất, chỉ có thể là 0 hoặc 1
Byte: 8 bit ghép lại = 256 giá trị khác nhau có thể biểu diễn (0-255)

1 KB = 1,024 bytes
1 MB = 1,024 KB
1 GB = 1,024 MB
1 TB = 1,024 GB

Lưu ý: nhà sản xuất ổ cứng thường tính theo hệ thập phân (1000)
thay vì nhị phân (1024) khi quảng cáo dung lượng
→ Ổ cứng ghi "1TB" thực tế hiển thị trong hệ điều hành
  có thể chỉ khoảng 931GB (vì OS tính theo 1024)
```

## Sector và Block — Đơn Vị Đọc/Ghi Thực Tế

Ổ đĩa không đọc/ghi từng byte riêng lẻ — nó hoạt động theo các khối cố định.

```
Sector: đơn vị vật lý nhỏ nhất mà ổ đĩa có thể đọc/ghi
  HDD truyền thống: 512 bytes/sector
  Ổ đĩa hiện đại: 4096 bytes/sector (gọi là "4Kn" hoặc Advanced Format)

Tại sao không đọc/ghi từng byte?
  Đọc/ghi có overhead cố định (di chuyển đầu đọc, định vị...)
  Nếu phải làm việc này cho từng byte → cực kỳ chậm
  Gộp thành block lớn hơn → giảm số lần overhead, tăng hiệu năng

Khi ứng dụng muốn ghi 10 bytes dữ liệu:
  Ổ đĩa vẫn phải đọc/ghi nguyên một sector 512 hoặc 4096 bytes
  Đây gọi là "write amplification" ở mức thấp nhất
```

---

# 2. HDD — Ổ Cứng Cơ Học

## Cấu Tạo Vật Lý

HDD (Hard Disk Drive) lưu dữ liệu bằng từ tính trên các đĩa kim loại quay tròn (platter).

```
Cấu tạo cơ bản:
  Platter: đĩa kim loại phủ vật liệu từ tính, quay với tốc độ cao
            (thường 5,400 - 15,000 vòng/phút - RPM)
  Đầu đọc/ghi (Read/Write Head): di chuyển qua lại trên platter,
            đọc/ghi dữ liệu bằng cách thay đổi từ tính
  Trục quay (Spindle): trục giữ các platter quay đồng bộ
  Actuator arm: cánh tay cơ học di chuyển đầu đọc đến đúng vị trí
```

## Tại Sao HDD Chậm Với Random Access

Đây là điểm quan trọng nhất để hiểu về hiệu năng storage truyền thống.

```
Khi đọc dữ liệu tuần tự (sequential read):
  Đầu đọc ở một vị trí cố định, platter quay qua
  Dữ liệu liền kề nhau được đọc liên tục, không cần di chuyển đầu đọc
  → Throughput cao (100-200 MB/s với HDD hiện đại)

Khi đọc dữ liệu ngẫu nhiên (random access):
  Mỗi lần đọc một vị trí khác nhau trên đĩa
  Đầu đọc phải DI CHUYỂN VẬT LÝ đến vị trí mới (seek time)
  Rồi CHỜ platter quay đến đúng điểm cần đọc (rotational latency)

  Seek time trung bình: 4-10 mili-giây
  Rotational latency trung bình (7200 RPM): ~4.2 mili-giây

  → Mỗi random read tốn khoảng 8-15 mili-giây CHỈ ĐỂ ĐỊNH VỊ
    trước khi thực sự đọc được dữ liệu!

So sánh: CPU xử lý một lệnh trong vài nano-giây
8 mili-giây với CPU giống như con người chờ... vài giờ đồng hồ
```

Đây là lý do tại sao database — vốn cần random access liên tục để tìm và cập nhật row — chạy trên HDD rất chậm so với SSD.

## IOPS Của HDD

```
IOPS (Input/Output Operations Per Second) đo số lượng thao tác
đọc/ghi mà thiết bị có thể xử lý mỗi giây

HDD 7200 RPM thông thường: ~75-100 IOPS (random)
HDD 15000 RPM (enterprise): ~175-210 IOPS (random)

Con số này RẤT THẤP so với nhu cầu thực tế của ứng dụng hiện đại
→ Đây là lý do SSD gần như thay thế hoàn toàn HDD cho
  workload cần performance (database, ứng dụng giao dịch)
```

---

# 3. SSD — Ổ Cứng Thể Rắn

## Không Có Bộ Phận Cơ Học

SSD (Solid State Drive) lưu dữ liệu bằng các transistor lưu trữ electron (NAND Flash memory) — không có đĩa quay, không có đầu đọc di chuyển.

```
Vì không có bộ phận cơ học:
  Không có seek time
  Không có rotational latency
  Truy cập ngẫu nhiên và tuần tự có tốc độ gần như nhau

SSD thông thường: 50,000 - 100,000+ IOPS (random read)
NVMe SSD cao cấp: hàng triệu IOPS

So với HDD (75-200 IOPS) → SSD nhanh hơn 500-1000 lần
cho random access!
```

## Cấu Trúc NAND Flash

```
Cell: đơn vị nhỏ nhất, lưu trữ electron để biểu diễn 0 hoặc 1
Page: tập hợp nhiều cell (thường 4-16 KB), đơn vị ĐỌC/GHI nhỏ nhất
Block: tập hợp nhiều page (thường 128-256 page), đơn vị XÓA nhỏ nhất

Điều đặc biệt quan trọng:
  Có thể GHI vào page trống
  KHÔNG THỂ ghi đè trực tiếp lên page đã có dữ liệu
  Phải XÓA CẢ BLOCK trước khi ghi lại vào bất kỳ page nào trong đó

  → Đây là lý do SSD cần "Garbage Collection" và
    "Wear Leveling" để quản lý việc này hiệu quả
```

## Write Amplification — Vấn Đề Đặc Trưng Của SSD

```
Vì phải xóa cả block (128-256 page) chỉ để update 1 page:

Controller SSD làm việc này (đơn giản hóa):
  1. Đọc toàn bộ block vào bộ nhớ đệm
  2. Cập nhật page cần thay đổi trong bộ nhớ đệm
  3. Xóa block gốc trên flash
  4. Ghi lại TOÀN BỘ block (đã cập nhật) vào vị trí mới

  → Để ghi 4KB dữ liệu thực tế, có thể phải ghi lại
    cả MB dữ liệu vật lý

Write Amplification Factor (WAF) = dữ liệu thực ghi / dữ liệu logic
  WAF = 1: lý tưởng, không có overhead
  WAF = 3-5: phổ biến trong thực tế tùy workload

Hệ quả: SSD có giới hạn số lần ghi (write endurance)
  Mỗi cell NAND chỉ chịu được số lần ghi/xóa nhất định
  trước khi bắt đầu mất khả năng lưu trữ chính xác
  (thường tính bằng TBW — TeraBytes Written)
```

## Wear Leveling

```
Vấn đề: nếu cùng một vùng flash bị ghi/xóa liên tục
trong khi vùng khác hầu như không dùng đến
→ Vùng đó "chết" sớm trong khi phần còn lại của ổ vẫn tốt

Giải pháp: Controller SSD tự động PHÂN BỐ ĐỀU
các thao tác ghi trên toàn bộ vùng flash vật lý
→ Mọi cell mòn đều ở mức tương đương nhau
→ Kéo dài tuổi thọ tổng thể của ổ đĩa

Đây hoàn toàn xảy ra ở tầng firmware của SSD,
ứng dụng và hệ điều hành không cần biết đến chi tiết này
```

---

# 4. Các Chỉ Số Đo Hiệu Năng Storage

## IOPS — Số Thao Tác Mỗi Giây

```
Đo lường: bao nhiêu lệnh đọc/ghi xử lý được trong 1 giây
Phù hợp đo: workload có nhiều thao tác NHỎ, NGẪU NHIÊN
            (database transaction, file system metadata)

IOPS không cố định — phụ thuộc vào:
  Kích thước mỗi block I/O (4KB? 8KB? 64KB?)
  Tỷ lệ đọc/ghi (100% read? 70/30 read/write?)
  Random hay sequential
  Queue depth (số lệnh chờ xử lý đồng thời)

→ Khi nhà sản xuất quảng cáo "500,000 IOPS",
  cần hỏi rõ: với block size bao nhiêu? Random hay sequential?
  Read hay write? Queue depth bao nhiêu?
  Số liệu marketing thường là điều kiện lý tưởng nhất
```

## Throughput — Băng Thông

```
Đo lường: bao nhiêu DỮ LIỆU truyền được trong 1 giây (MB/s, GB/s)
Phù hợp đo: workload đọc/ghi file LỚN, TUẦN TỰ
            (backup, video streaming, data warehouse scan)

Mối quan hệ giữa IOPS và Throughput:
  Throughput = IOPS × Block Size

  Ví dụ: 10,000 IOPS với block size 4KB
        = 10,000 × 4KB = 40,000 KB/s = ~40 MB/s

  Cùng throughput 40MB/s nhưng với block size 256KB:
        chỉ cần ~160 IOPS

→ Đây là lý do một thiết bị có thể "IOPS cao nhưng
  throughput thấp" (tối ưu cho random nhỏ) hoặc ngược lại
  "throughput cao nhưng IOPS không nổi bật" (tối ưu sequential)
```

## Latency — Độ Trễ

```
Đo lường: THỜI GIAN để hoàn thành MỘT thao tác đơn lẻ
Đơn vị: thường tính bằng mili-giây (ms) hoặc micro-giây (μs)

So sánh latency giữa các loại storage:
  HDD:               5-15 ms
  SATA SSD:           0.1-0.5 ms
  NVMe SSD:            0.02-0.1 ms (20-100 μs)
  RAM:                 ~0.0001 ms (100 nano-giây)

Latency QUAN TRỌNG HƠN IOPS trong nhiều trường hợp thực tế:
  Một transaction database cần ĐỢI write hoàn thành
  trước khi xử lý bước tiếp theo (đặc biệt với synchronous write)

  Latency cao → mỗi transaction chậm
  → Dù IOPS tổng thể của hệ thống cao, một transaction đơn lẻ
    vẫn cảm nhận được độ trễ
```

## Queue Depth — Độ Sâu Hàng Đợi

```
Số lượng thao tác I/O được gửi đồng thời, chờ xử lý

Queue depth thấp (1):
  Mỗi lệnh phải hoàn thành mới gửi lệnh tiếp theo
  Phản ánh đúng latency thực tế của một thao tác đơn lẻ

Queue depth cao (32, 64, 128...):
  Nhiều lệnh được gửi cùng lúc, thiết bị xử lý song song
  IOPS tổng thể tăng lên đáng kể (đặc biệt với SSD/NVMe
  có nhiều kênh xử lý song song)
  Nhưng latency của TỪNG lệnh riêng lẻ có thể tăng
  (phải chờ trong hàng đợi)

Đây là lý do benchmark SSD thường công bố số liệu ở
nhiều queue depth khác nhau — con số "IOPS tối đa" thường
đo ở queue depth rất cao, không phản ánh trải nghiệm
thực tế của một ứng dụng đơn luồng
```

---

# 5. RAID Là Gì — Vấn Đề Cần Giải Quyết

## Hai Vấn Đề RAID Giải Quyết

RAID (Redundant Array of Independent Disks) là kỹ thuật kết hợp nhiều ổ đĩa vật lý thành một đơn vị logic. Nó giải quyết hai vấn đề khác nhau, và việc hiểu rõ sự khác biệt này là chìa khóa để hiểu các loại RAID.

```
VẤN ĐỀ 1: Hiệu năng (Performance)
  Một ổ đĩa đơn có giới hạn về IOPS và throughput
  Làm sao đạt hiệu năng cao hơn một ổ đĩa đơn có thể cung cấp?
  → Giải pháp: chia dữ liệu ra nhiều ổ, đọc/ghi SONG SONG

VẤN ĐỀ 2: Độ tin cậy (Reliability)
  Ổ đĩa LÀ thiết bị cơ khí/điện tử — CHẮC CHẮN sẽ hỏng
  một ngày nào đó (chỉ là vấn đề thời gian)
  Làm sao dữ liệu vẫn còn nguyên vẹn khi một ổ đĩa hỏng?
  → Giải pháp: lưu dữ liệu dư thừa (redundancy) trên
    nhiều ổ, để mất một ổ vẫn khôi phục được
```

Các loại RAID khác nhau ưu tiên giải quyết vấn đề nào, theo tỷ lệ nào, với chi phí (dung lượng sử dụng được) khác nhau.

## Khái Niệm Nền Tảng Trước Khi Vào Chi Tiết

```
Striping (Phân mảnh):
  Chia dữ liệu thành các "mảnh" nhỏ (stripe), ghi rải đều
  lên nhiều ổ đĩa khác nhau
  → Tăng hiệu năng (đọc/ghi song song nhiều ổ cùng lúc)
  → KHÔNG có redundancy — mất một ổ là mất dữ liệu

Mirroring (Nhân bản):
  Ghi CÙNG MỘT dữ liệu lên nhiều ổ đĩa giống hệt nhau
  → Tăng độ tin cậy (một ổ hỏng, ổ kia vẫn còn nguyên dữ liệu)
  → Tốn dung lượng (dùng N ổ chỉ có dung lượng = 1 ổ)

Parity (Dữ liệu chẵn lẻ):
  Tính toán một giá trị "kiểm tra" từ dữ liệu trên các ổ khác
  Nếu một ổ hỏng, dùng parity + dữ liệu còn lại để TÍNH TOÁN
  LẠI dữ liệu bị mất
  → Tiết kiệm dung lượng hơn mirroring, nhưng có chi phí
    tính toán khi ghi (và khi khôi phục)
```

---

# 6. RAID 0 — Striping

## Cách Hoạt Động

RAID 0 chia dữ liệu thành các stripe nhỏ, ghi rải đều lên tất cả các ổ đĩa trong mảng.

```
Dữ liệu: A B C D E F

RAID 0 với 2 ổ đĩa:
  Đĩa 1: A C E
  Đĩa 2: B D F

  Khi đọc/ghi A và B — XẢY RA ĐỒNG THỜI trên hai ổ khác nhau
  → Throughput gần như TĂNG GẤP ĐÔI so với một ổ đơn
```

## Đặc Điểm

```
Dung lượng sử dụng được: 100% tổng dung lượng các ổ
  (2 ổ × 1TB = 2TB dùng được, không mất gì cho redundancy)

Hiệu năng: CAO NHẤT trong tất cả các loại RAID
  Cả đọc và ghi đều được phân tán, tận dụng tối đa
  băng thông của tất cả các ổ cùng lúc

Độ tin cậy: TỆ NHẤT — KHÔNG CÓ redundancy nào cả
  Nếu BẤT KỲ một ổ nào trong mảng hỏng
  → TOÀN BỘ dữ liệu của cả mảng MẤT HOÀN TOÀN
  (vì mỗi file được chia rải trên tất cả các ổ,
  thiếu một phần là không thể khôi phục file đó)

Xác suất hỏng dữ liệu thực tế TĂNG LÊN khi thêm ổ:
  Mảng càng nhiều ổ → xác suất MỘT TRONG SỐ chúng hỏng
  càng cao → rủi ro tổng thể của mảng RAID 0 tăng theo
  số lượng ổ, không giảm
```

## Khi Nào Dùng RAID 0

```
Phù hợp khi:
  Cần hiệu năng tối đa tuyệt đối
  Dữ liệu KHÔNG QUAN TRỌNG hoặc có thể tái tạo dễ dàng
  (cache tạm thời, dữ liệu scratch cho xử lý video,
  bộ nhớ đệm có thể mất mà không ảnh hưởng nghiêm trọng)

KHÔNG BAO GIỜ dùng cho:
  Dữ liệu production quan trọng
  Database chứa dữ liệu khách hàng
  Bất kỳ thứ gì không có backup riêng biệt
```

---

# 7. RAID 1 — Mirroring

## Cách Hoạt Động

RAID 1 ghi CÙNG MỘT dữ liệu lên hai (hoặc nhiều) ổ đĩa giống hệt nhau.

```
Dữ liệu: A B C D

RAID 1 với 2 ổ đĩa:
  Đĩa 1: A B C D
  Đĩa 2: A B C D  (bản sao chính xác)

  Khi ghi: phải ghi vào CẢ HAI ổ → write có thêm overhead nhẹ
  Khi đọc: có thể đọc từ ổ NÀO CŨNG ĐƯỢC
           → một số implementation đọc song song từ cả hai
           ổ để TĂNG tốc độ đọc!
```

## Đặc Điểm

```
Dung lượng sử dụng được: 50% (với 2 ổ)
  2 ổ × 1TB = chỉ 1TB dùng được, một nửa "mất" cho bản sao

Hiệu năng ghi (write): tương đương một ổ đơn
  (phải ghi vào cả hai, không nhanh hơn ghi một ổ)
  Một số trường hợp chậm hơn nhẹ do phải đợi cả hai
  xác nhận hoàn thành

Hiệu năng đọc (read): có thể NHANH HƠN một ổ đơn
  (đọc song song từ nhiều ổ, chia tải)

Độ tin cậy: RẤT TỐT
  Mất MỘT ổ → dữ liệu vẫn CÒN NGUYÊN trên ổ còn lại
  Hệ thống tiếp tục hoạt động bình thường (degraded mode)
  trong khi chờ thay ổ mới

  Chỉ mất dữ liệu khi CẢ HAI ổ hỏng CÙNG LÚC
  (xác suất thấp hơn nhiều so với RAID 0)
```

## Khi Nào Dùng RAID 1

```
Phù hợp khi:
  Cần độ tin cậy cao, dung lượng không phải vấn đề lớn
  Hệ điều hành / boot drive (cần luôn sẵn sàng)
  Hệ thống nhỏ, ngân sách hạn chế nhưng cần redundancy
  (chỉ cần 2 ổ là có redundancy, không cần nhiều ổ
  như RAID 5/6)
```

---

# 8. RAID 5 — Striping Với Parity

## Cách Hoạt Động

RAID 5 kết hợp striping (như RAID 0) với một khối parity được tính toán, phân bố luân phiên trên tất cả các ổ.

```
Với 4 ổ đĩa (3 ổ chứa data, tương đương 1 ổ chứa parity,
nhưng parity được PHÂN BỐ LUÂN PHIÊN, không cố định một ổ):

  Đĩa 1: A    D    G    Parity(J,K,L)
  Đĩa 2: B    E    Parity(G,H,I)    J
  Đĩa 3: C    Parity(D,E,F)    H    K
  Đĩa 4: Parity(A,B,C)    F    I    L

Parity được tính bằng phép toán XOR giữa các block dữ liệu
tương ứng trên các ổ còn lại

Nếu MỘT ổ hỏng:
  Dữ liệu bị mất trên ổ đó được TÍNH LẠI
  từ dữ liệu trên các ổ còn lại + parity tương ứng
```

## Hiểu Cơ Chế Parity Bằng XOR

```
XOR là phép toán: kết quả là 1 nếu số lượng bit 1 là LẺ,
kết quả là 0 nếu số lượng bit 1 là CHẴN

Ví dụ đơn giản với 3 ổ data + parity:
  Ổ A = 1
  Ổ B = 0
  Ổ C = 1
  Parity = A XOR B XOR C = 1 XOR 0 XOR 1 = 0

Nếu ổ B hỏng (giá trị bị mất):
  Khôi phục B = A XOR C XOR Parity = 1 XOR 1 XOR 0 = 0
  → Khôi phục ĐÚNG giá trị gốc của B!

Đây chính là cách RAID 5 phục hồi dữ liệu khi mất một ổ —
áp dụng nguyên lý này trên từng block dữ liệu thực tế
```

## Đặc Điểm

```
Dung lượng sử dụng được: (N-1)/N tổng dung lượng
  Với 4 ổ × 1TB: dùng được 3TB (mất 1TB tương đương cho parity)
  Với 8 ổ × 1TB: dùng được 7TB
  → Hiệu quả dung lượng TỐT HƠN RAID 1 khi có nhiều ổ

Yêu cầu tối thiểu: 3 ổ đĩa

Hiệu năng đọc: tốt, gần tương đương striping
Hiệu năng ghi: CÓ overhead đáng kể
  Mỗi lần ghi data, phải TÍNH LẠI parity tương ứng
  → Cần đọc dữ liệu cũ, tính toán XOR, rồi mới ghi
  (gọi là "RAID 5 write penalty" hoặc "read-modify-write")

Độ tin cậy: chịu được MẤT MỘT ổ
  Nhưng trong lúc rebuild (khôi phục) sau khi thay ổ mới:
  → Hệ thống phải ĐỌC TOÀN BỘ dữ liệu trên các ổ còn lại
    để tính toán lại dữ liệu cho ổ mới
  → Đây là quá trình NẶNG, có thể mất NHIỀU GIỜ với ổ dung
    lượng lớn
  → Trong lúc rebuild, nếu CÓ THÊM một ổ khác hỏng
    (hoặc thậm chí chỉ một bad sector xuất hiện)
    → MẤT TOÀN BỘ DỮ LIỆU của cả mảng!
```

## Vấn Đề Nghiêm Trọng Với RAID 5 Trên Ổ Đĩa Dung Lượng Lớn

```
Đây là lý do nhiều kỹ sư hệ thống khuyến cáo TRÁNH RAID 5
cho ổ đĩa dung lượng lớn (từ 2TB trở lên) trong thời điểm hiện tại:

Tính toán xác suất:
  Ổ đĩa hiện đại có "Unrecoverable Read Error Rate"
  (URE) khoảng 1 lỗi trên 10^14 đến 10^15 bit đọc được

  Một ổ 4TB có khoảng 3.2 × 10^13 bit
  Khi rebuild RAID 5, phải đọc TOÀN BỘ dữ liệu trên
  TẤT CẢ các ổ còn lại

  Với mảng nhiều ổ dung lượng lớn, xác suất gặp
  MỘT lỗi đọc không khôi phục được trong quá trình
  rebuild trở nên ĐÁNG KỂ — không còn là hiếm gặp

  → Nếu gặp lỗi này trong lúc rebuild, RAID 5 không thể
    hoàn thành rebuild → mất dữ liệu

Đây chính là lý do RAID 6 ra đời — thêm một lớp parity nữa
để chịu được mất HAI ổ cùng lúc, hoặc một ổ hỏng cộng với
một lỗi đọc trong lúc rebuild
```

---

# 9. RAID 6 — Double Parity

## Cách Hoạt Động

RAID 6 giống RAID 5 nhưng dùng HAI khối parity độc lập thay vì một, tính bằng hai thuật toán toán học khác nhau (không chỉ đơn giản là XOR hai lần).

```
Với 5 ổ đĩa:
  Mỗi "hàng" stripe có 3 block data + 2 block parity
  (P parity và Q parity — dùng thuật toán Reed-Solomon
  cho Q parity để đảm bảo toán học khôi phục được
  từ bất kỳ tổ hợp 2 ổ hỏng nào)

Có thể chịu được MẤT ĐỒNG THỜI HAI ổ đĩa bất kỳ
mà vẫn khôi phục được toàn bộ dữ liệu
```

## Đặc Điểm

```
Dung lượng sử dụng được: (N-2)/N tổng dung lượng
  Với 6 ổ × 1TB: dùng được 4TB (mất 2TB cho hai parity)

Yêu cầu tối thiểu: 4 ổ đĩa

Hiệu năng ghi: overhead LỚN HƠN RAID 5
  (phải tính TOÁN HAI loại parity cho mỗi lần ghi)

Độ tin cậy: chịu được mất HAI ổ cùng lúc
  Giải quyết trực tiếp vấn đề "rebuild gặp lỗi đọc"
  của RAID 5 — vì ngay cả khi gặp một lỗi đọc trong
  lúc rebuild (tương đương mất thêm "một phần" của
  một ổ khác), hệ thống vẫn còn dư một lớp parity
  để khôi phục
```

## Khi Nào Dùng RAID 6

```
Phù hợp khi:
  Mảng có NHIỀU ổ đĩa dung lượng LỚN
  Cần độ tin cậy cao hơn RAID 5 (production quan trọng)
  Chấp nhận overhead ghi cao hơn để đổi lấy an toàn

Đây là lựa chọn phổ biến cho storage array doanh nghiệp
hiện đại, đặc biệt với ổ đĩa SATA/SAS dung lượng lớn
trong môi trường archive, backup, hoặc workload
không quá nhạy cảm với write latency
```

---

# 10. RAID 10 — Kết Hợp Mirror Và Stripe

## Cách Hoạt Động

RAID 10 (còn gọi là RAID 1+0) kết hợp hai kỹ thuật: đầu tiên mirror từng cặp ổ, sau đó stripe dữ liệu trên các cặp mirror đó.

```
Với 4 ổ đĩa, tạo thành 2 cặp mirror:
  Cặp 1: Đĩa 1 + Đĩa 2 (mirror lẫn nhau — giống RAID 1)
  Cặp 2: Đĩa 3 + Đĩa 4 (mirror lẫn nhau — giống RAID 1)

  Sau đó STRIPE dữ liệu trên hai cặp này (giống RAID 0):
  Đĩa 1&2: A C E G  (cặp mirror — cả hai có cùng dữ liệu)
  Đĩa 3&4: B D F H  (cặp mirror khác — cả hai có cùng dữ liệu)

  → Đọc/ghi A và B diễn ra ĐỒNG THỜI trên hai cặp khác nhau
    (hiệu năng cao như striping)
  → Mỗi cặp có redundancy đầy đủ (an toàn như mirroring)
```

## Đặc Điểm

```
Dung lượng sử dụng được: 50% tổng dung lượng
  (giống RAID 1, vì bản chất là mirror)

Yêu cầu tối thiểu: 4 ổ đĩa (số chẵn)

Hiệu năng: GẦN BẰNG RAID 0
  Cả đọc và ghi đều được hưởng lợi từ striping
  KHÔNG có write penalty như RAID 5/6
  (không cần tính parity phức tạp, chỉ cần ghi
  vào cặp mirror tương ứng)

Độ tin cậy: RẤT TỐT
  Chịu được mất MỘT ổ trong MỖI cặp mirror
  (tức là có thể mất TỐI ĐA một nửa số ổ, miễn là
  không mất CẢ HAI ổ trong CÙNG MỘT cặp)

Rebuild: NHANH HƠN RAID 5/6 đáng kể
  Khi một ổ hỏng, chỉ cần COPY dữ liệu từ ổ còn lại
  TRONG CÙNG CẶP MIRROR sang ổ mới
  Không cần đọc và tính toán từ TẤT CẢ các ổ khác
  như RAID 5/6 → rebuild nhanh hơn, ít rủi ro hơn
```

## Khi Nào Dùng RAID 10

```
Phù hợp khi:
  Cần CẢ hiệu năng cao VÀ độ tin cậy cao
  Có đủ ngân sách cho việc "tốn 50% dung lượng"
  Database production quan trọng, cần write performance tốt
  (RAID 10 là lựa chọn phổ biến nhất cho database
  enterprise có ngân sách)

So với RAID 5/6:
  RAID 10 nhanh hơn đáng kể cho write-heavy workload
  RAID 10 rebuild nhanh hơn, an toàn hơn
  RAID 10 tốn nhiều dung lượng hơn (50% vs khoảng 75-85%)

→ RAID 10 thường được ưu tiên khi ngân sách cho phép,
  đặc biệt cho database transaction-heavy
```

# 11. So Sánh Toàn Diện Các Loại RAID

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

Ví dụ cụ thể với 8 ổ × 2TB (tổng raw = 16TB):

RAID 0:  16TB sử dụng được, 0 ổ chịu được mất
RAID 1:  Chỉ dùng 2 ổ thực tế hiệu quả → 2TB (hoặc mirror 4 cặp = 8TB)
RAID 5:  14TB sử dụng được (7/8), chịu mất 1 ổ
RAID 6:  12TB sử dụng được (6/8), chịu mất 2 ổ
RAID 10: 8TB sử dụng được (4 cặp mirror), chịu mất 1 ổ/cặp (tối đa 4 ổ
         nếu may mắn rơi đúng mỗi cặp một ổ)
```

## Cây Quyết Định Chọn RAID

```
Câu hỏi 1: Dữ liệu có quan trọng không?
  Không quan trọng, ưu tiên tốc độ tuyệt đối, có backup riêng
  → RAID 0

  Quan trọng, cần redundancy
  → Tiếp tục câu hỏi 2

Câu hỏi 2: Ngân sách dung lượng có thoải mái không?
  Thoải mái, ưu tiên hiệu năng VÀ an toàn
  → RAID 10

  Hạn chế, cần tối ưu dung lượng sử dụng được
  → Tiếp tục câu hỏi 3

Câu hỏi 3: Workload chủ yếu là đọc hay ghi nhiều?
  Đọc nhiều, ghi ít (archive, file server, backup target)
  → RAID 5 (nếu ổ nhỏ) hoặc RAID 6 (nếu ổ lớn, nhiều ổ)

  Ghi nhiều, cần hiệu năng ghi tốt
  → Cân nhắc lại RAID 10 nếu có thể, hoặc RAID 5/6 với
    cache lớn để bù đắp write penalty

Câu hỏi 4: Có bao nhiêu ổ, dung lượng mỗi ổ bao nhiêu?
  Ổ dung lượng lớn (4TB+), nhiều ổ trong mảng
  → ƯU TIÊN RAID 6 thay vì RAID 5
    (rủi ro lỗi đọc trong lúc rebuild RAID 5 quá cao)
```

---

# 12. Software RAID vs Hardware RAID

## Hardware RAID

RAID controller là một thiết bị phần cứng chuyên dụng (thường là card cắm vào mainboard) xử lý toàn bộ logic RAID, độc lập với hệ điều hành.

```
Cách hoạt động:
  Ổ đĩa vật lý kết nối vào RAID controller
  Controller có CPU và bộ nhớ RAM riêng (đôi khi có pin
  dự phòng để bảo vệ dữ liệu trong cache khi mất điện)
  Hệ điều hành CHỈ THẤY một ổ đĩa logic duy nhất
  (không biết, không cần biết về cấu trúc RAID bên dưới)

Ưu điểm:
  Hiệu năng tốt — tính toán parity (RAID 5/6) được xử lý
  bởi chip chuyên dụng, không tốn CPU của server
  Có thể có battery backup cho write cache
  → Bảo vệ dữ liệu trong cache khi mất điện đột ngột

Nhược điểm:
  Chi phí phần cứng bổ sung
  Vendor lock-in: ổ đĩa được format theo cách riêng
  của controller đó — nếu controller hỏng, đôi khi
  CHỈ CÓ THỂ đọc lại bằng đúng model controller đó
  (hoặc dòng tương thích) → rủi ro về khả năng phục hồi
  Khó migrate hoặc thay đổi cấu hình linh hoạt
```

## Software RAID

RAID được quản lý hoàn toàn bởi hệ điều hành, không cần phần cứng chuyên dụng.

```
Cách hoạt động:
  Hệ điều hành thấy TỪNG ổ đĩa riêng lẻ
  Driver/kernel của OS xử lý logic RAID
  (chia stripe, tính parity, quản lý mirror...)
  CPU của server xử lý các phép tính này

Ưu điểm:
  Không cần phần cứng bổ sung — tiết kiệm chi phí
  Linh hoạt — dễ thay đổi cấu hình, không phụ thuộc
  vào driver hay vendor cụ thể nào
  Có thể di chuyển mảng RAID sang máy khác dễ dàng hơn
  (đặc biệt với các giải pháp mở, độc lập vendor)

Nhược điểm:
  Tốn CPU của server (đặc biệt RAID 5/6 với tính
  toán parity phức tạp) — tuy nhiên CPU hiện đại
  rất mạnh nên đây ít còn là vấn đề lớn
  Không có battery-backed cache như nhiều giải pháp
  hardware cao cấp (rủi ro mất dữ liệu trong cache
  khi mất điện đột ngột, trừ khi có UPS bảo vệ)
```

## Xu Hướng Hiện Đại

```
Trong môi trường cloud và ảo hóa hiện đại:
  Software RAID (hoặc các giải pháp tương đương ở tầng
  ảo hóa/cloud) đang phổ biến hơn hardware RAID truyền thống

Lý do:
  CPU hiện đại đủ mạnh, overhead tính toán parity
  không còn đáng kể
  Tính linh hoạt quan trọng hơn trong môi trường cloud
  (không cần phụ thuộc vào phần cứng vật lý cụ thể)
  Nhiều hệ thống lưu trữ phân tán hiện đại (sẽ nói ở
  phần sau) đã thay thế hoàn toàn khái niệm RAID
  truyền thống bằng cơ chế redundancy ở tầng software
  trên nhiều máy chủ khác nhau
```

---

# 13. RAID Không Phải Là Backup

Đây là một trong những hiểu lầm phổ biến và nguy hiểm nhất trong vận hành hệ thống.

## Tại Sao RAID Không Thay Thế Được Backup

```
RAID bảo vệ khỏi: HỎNG PHẦN CỨNG của một (hoặc vài) ổ đĩa

RAID KHÔNG bảo vệ khỏi:

  Lỗi do con người:
    Xóa nhầm file/database → RAID nhân bản việc xóa đó
    NGAY LẬP TỨC trên tất cả các ổ trong mảng!
    RAID không có khái niệm "phiên bản cũ" để quay lại

  Lỗi phần mềm / corruption:
    Bug trong ứng dụng ghi dữ liệu sai/hỏng vào database
    → Dữ liệu hỏng đó được lưu trên TẤT CẢ các ổ RAID
    (RAID chỉ đảm bảo dữ liệu được ghi GIỐNG NHAU
    trên các ổ, không đảm bảo dữ liệu đó ĐÚNG)

  Ransomware / mã độc:
    Mã độc mã hóa toàn bộ file → RAID nhân bản
    việc mã hóa đó lên tất cả các ổ

  Thiên tai / hỏa hoạn tại datacenter:
    Nếu tất cả ổ đĩa RAID nằm trong CÙNG MỘT server,
    CÙNG MỘT datacenter — một sự cố vật lý lớn
    (cháy, ngập nước, động đất) phá hủy TẤT CẢ cùng lúc

  Lỗi controller RAID hoặc bug trong chính phần mềm RAID:
    Hiếm gặp nhưng đã từng xảy ra — lỗi ở chính tầng
    quản lý RAID có thể làm hỏng dữ liệu trên toàn mảng
```

## Nguyên Tắc 3-2-1 Cho Backup

```
RAID là một phần của chiến lược độ tin cậy (availability)
— giúp hệ thống TIẾP TỤC HOẠT ĐỘNG khi một ổ đĩa hỏng

Backup là một chiến lược HOÀN TOÀN KHÁC — bảo vệ khỏi
MẤT DỮ LIỆU vĩnh viễn, kể cả khi nguyên nhân không phải
do phần cứng

Nguyên tắc 3-2-1 kinh điển:

  3 bản sao của dữ liệu (bản gốc + ít nhất 2 bản sao)

  2 loại phương tiện lưu trữ khác nhau
    (ví dụ: ổ đĩa local + cloud storage,
    hoặc disk + tape)

  1 bản sao lưu trữ OFF-SITE (vị trí địa lý khác)
    → Bảo vệ khỏi thảm họa tại một địa điểm cụ thể

RAID có thể là một LỚP trong chiến lược tổng thể
(giúp server tiếp tục chạy khi 1 ổ hỏng), nhưng
KHÔNG BAO GIỜ là chiến lược DUY NHẤT để bảo vệ dữ liệu
```

---

# 14. Filesystem — Lớp Tổ Chức Dữ Liệu

## Vai Trò Của Filesystem

RAID (hoặc storage thuần) cung cấp một không gian lưu trữ thô (raw block storage). Filesystem là lớp phần mềm tổ chức không gian thô đó thành cấu trúc file/folder mà ứng dụng có thể sử dụng.

```
Raw block device (ổ đĩa hoặc mảng RAID):
  Chỉ là một chuỗi block đánh số liên tục
  Không có khái niệm "file", "folder", "tên file"

Filesystem thêm vào:
  Cấu trúc thư mục phân cấp
  Metadata: tên file, kích thước, thời gian sửa,
  quyền truy cập
  Cơ chế cấp phát không gian: file mới lấy block nào?
  Cơ chế theo dõi block nào đang dùng, block nào trống
```

## Journaling — Bảo Vệ Tính Toàn Vẹn

```
Vấn đề: nếu mất điện đột ngột GIỮA LÚC đang ghi file
(ví dụ: đang cập nhật metadata của filesystem)
→ Filesystem có thể rơi vào trạng thái KHÔNG NHẤT QUÁN
  (inconsistent state) — một số cấu trúc dữ liệu nội bộ
  bị hỏng, dẫn đến mất dữ liệu hoặc filesystem corrupt

Journaling giải quyết bằng cách:
  TRƯỚC KHI thực sự thay đổi cấu trúc filesystem,
  ghi lại Ý ĐỊNH thay đổi đó vào một "nhật ký" (journal)
  riêng biệt
  Sau khi thay đổi THỰC SỰ hoàn thành, đánh dấu
  journal entry đó là "đã hoàn thành"

  Nếu mất điện giữa chừng:
  Khi khởi động lại, filesystem ĐỌC journal
  Thấy entry nào "chưa hoàn thành" → REPLAY (thực hiện lại)
  hoặc ROLLBACK (hủy bỏ) một cách an toàn
  → Đảm bảo filesystem luôn ở trạng thái nhất quán,
    dù có mất điện giữa chừng

Hầu hết filesystem hiện đại đều có journaling
(đây là tính năng cơ bản, không phải tùy chọn nâng cao)
```

## Copy-on-Write Filesystem

```
Một số filesystem hiện đại dùng cơ chế khác — thay vì
ghi đè trực tiếp lên dữ liệu cũ, chúng ghi dữ liệu MỚI
vào vị trí KHÁC, rồi mới cập nhật con trỏ trỏ đến
vị trí mới đó

Lợi ích:
  KHÔNG BAO GIỜ ghi đè trực tiếp lên dữ liệu đang
  tồn tại → an toàn hơn nhiều khi có sự cố giữa chừng
  (dữ liệu cũ vẫn còn nguyên cho đến khi thao tác
  mới HOÀN TOÀN thành công)

  Hỗ trợ snapshot CỰC KỲ HIỆU QUẢ — vì dữ liệu cũ
  không bị ghi đè, có thể giữ lại con trỏ đến trạng
  thái cũ làm "snapshot" mà không cần copy toàn bộ
  dữ liệu ngay lập tức

  Built-in checksum cho dữ liệu — phát hiện được
  data corruption (bit rot) mà các filesystem
  truyền thống không phát hiện được
```

---

# 15. Distributed Storage — Khi Một Máy Không Đủ

## Giới Hạn Của RAID Truyền Thống

RAID giải quyết vấn đề redundancy TRONG MỘT máy chủ. Nhưng khi dữ liệu lớn đến mức một máy chủ không chứa nổi, hoặc cần độ tin cậy ở mức "cả một datacenter có thể mất" — cần một cách tiếp cận khác.

```
Giới hạn của RAID trong một máy:
  Toàn bộ mảng RAID vẫn nằm trong MỘT server vật lý
  Server đó hỏng nguồn, hỏng mainboard, hoặc cả
  datacenter mất điện → TOÀN BỘ dữ liệu không truy
  cập được (dù ổ đĩa hoàn toàn nguyên vẹn)

  Dung lượng bị giới hạn bởi số khe cắm ổ đĩa
  vật lý của MỘT server

Distributed Storage giải quyết bằng cách:
  Phân tán dữ liệu trên NHIỀU máy chủ khác nhau
  (có thể ở nhiều rack, nhiều datacenter, nhiều khu vực
  địa lý khác nhau)
  Redundancy được thực hiện ở TẦNG MẠNG, không chỉ
  ở tầng ổ đĩa trong một máy
```

## Replication — Nhân Bản Qua Nhiều Node

```
Khái niệm tương tự RAID 1 (mirroring) nhưng áp dụng
ở quy mô NHIỀU MÁY CHỦ thay vì nhiều ổ đĩa

Replication Factor = 3 (phổ biến trong nhiều hệ thống
phân tán như HDFS, Cassandra):

  Mỗi block dữ liệu được lưu trên 3 node KHÁC NHAU
  (lý tưởng: đặt ở các rack khác nhau, hoặc thậm chí
  availability zone khác nhau)

  Ghi dữ liệu mới:
    Client ghi vào node 1
    Node 1 tự động sao chép sang node 2 và node 3
    (đồng bộ hoặc bất đồng bộ tùy hệ thống)

  Đọc dữ liệu:
    Có thể đọc từ BẤT KỲ node nào trong 3 node có bản sao
    → Load balancing tự nhiên cho việc đọc

  Một node hỏng:
    Dữ liệu vẫn còn nguyên trên 2 node còn lại
    Hệ thống tự động tạo bản sao thứ 3 mới trên
    một node khác để khôi phục lại replication factor = 3

Chi phí dung lượng: với replication factor 3,
chỉ dùng được 1/3 tổng dung lượng raw
(tương tự overhead của RAID 1, nhưng ở quy mô lớn hơn)
```

## Quorum — Đảm Bảo Nhất Quán Khi Có Nhiều Bản Sao

```
Vấn đề: nếu có 3 bản sao của cùng một dữ liệu trên
3 node khác nhau, làm sao đảm bảo TẤT CẢ client đọc
được giá trị MỚI NHẤT, nhất quán?

Quorum-based approach:
  W (write quorum): số node TỐI THI�ỂU phải xác nhận
  ghi thành công trước khi coi là "ghi xong"

  R (read quorum): số node TỐI THIỂU phải được đọc
  và so sánh trước khi trả kết quả cho client

  Nguyên tắc: W + R > N (N = tổng số bản sao)
  → Đảm bảo bất kỳ tập hợp READ nào cũng GIAO NHAU
    với tập hợp WRITE gần nhất → luôn đọc được
    giá trị mới nhất (hoặc ít nhất phát hiện được
    có nhiều phiên bản và xử lý conflict)

  Ví dụ với N=3:
    W=2, R=2 → 2+2=4 > 3 → đảm bảo consistency
    W=1, R=1 → 1+1=2 < 3 → KHÔNG đảm bảo,
    có thể đọc dữ liệu cũ (eventual consistency)
```

---

# 16. Erasure Coding — RAID Cho Hệ Thống Phân Tán

## Vấn Đề Với Replication Thuần Túy

Replication factor 3 đảm bảo độ tin cậy tốt nhưng tốn chi phí dung lượng RẤT LỚN — chỉ dùng được 33% dung lượng raw. Với hệ thống lưu trữ ở quy mô petabyte, chi phí này trở nên đáng kể.

```
Erasure Coding là khái niệm tương đương "RAID 5/6"
nhưng áp dụng ở quy mô PHÂN TÁN nhiều node, thay vì
nhiều ổ đĩa trong một máy

Cách hoạt động (đơn giản hóa):
  Chia dữ liệu thành K mảnh (data fragments)
  Tính toán thêm M mảnh parity (giống nguyên lý
  RAID 5/6 nhưng phức tạp hơn về mặt toán học —
  thường dùng Reed-Solomon coding)
  Lưu TỔNG CỘNG K+M mảnh trên K+M node khác nhau

  Để khôi phục dữ liệu gốc, chỉ cần BẤT KỲ K mảnh
  nào trong tổng số K+M mảnh (không quan trọng là
  mảnh data hay mảnh parity)

Ví dụ phổ biến: Erasure Coding 10+4
  10 mảnh dữ liệu + 4 mảnh parity = 14 mảnh tổng cộng
  Chịu được MẤT TỐI ĐA 4 node bất kỳ mà vẫn khôi
  phục được toàn bộ dữ liệu

  Hiệu quả dung lượng: 10/14 ≈ 71% dung lượng sử dụng được
  (so với Replication factor 3 chỉ có 33%)
```

## So Sánh Replication vs Erasure Coding

```
┌──────────────────┬─────────────────────┬──────────────────────┐
│                  │ Replication (×3)     │ Erasure Coding (10+4)│
├──────────────────┼─────────────────────┼──────────────────────┤
│ Hiệu quả dung    │ ~33%                 │ ~71%                 │
│ lượng            │                      │                      │
│ Chịu mất bao     │ 2 node               │ 4 node               │
│ nhiêu node       │                      │                      │
│ Tốc độ đọc       │ Nhanh (đọc trực tiếp │ Chậm hơn (cần đọc    │
│                  │ 1 bản sao)           │ nhiều mảnh, decode)  │
│ Tốc độ rebuild   │ Nhanh (copy 1-1)     │ Chậm hơn (cần tính   │
│                  │                      │ toán từ nhiều mảnh)  │
│ CPU overhead     │ Thấp                 │ Cao hơn (encode/     │
│                  │                      │ decode toán học)     │
│ Phù hợp cho      │ Dữ liệu truy cập     │ Dữ liệu lưu trữ lâu  │
│                  │ thường xuyên (hot)   │ dài, ít truy cập     │
│                  │                      │ (cold/archive)       │
└──────────────────┴─────────────────────┴──────────────────────┘

Nhiều hệ thống lưu trữ phân tán lớn dùng CẢ HAI chiến lược:
  Dữ liệu mới, hay được truy cập → Replication
  (ưu tiên tốc độ, chấp nhận tốn dung lượng)

  Dữ liệu cũ, ít truy cập → chuyển sang Erasure Coding
  sau một khoảng thời gian (tiết kiệm dung lượng,
  chấp nhận tốc độ đọc chậm hơn một chút)
```

---

# 17. Storage Trong Thực Tế Production

## Checklist Khi Thiết Kế Storage Cho Hệ Thống Mới

```
Câu hỏi về hiệu năng:
  Workload chủ yếu là đọc hay ghi? Tỷ lệ bao nhiêu?
  Cần random access (database) hay sequential
  (streaming, backup)?
  Yêu cầu latency là bao nhiêu? (database transaction
  thường cần latency thấp, dưới vài mili-giây)
  IOPS dự kiến cần là bao nhiêu, ở peak traffic?

Câu hỏi về độ tin cậy:
  RPO (Recovery Point Objective) — chấp nhận mất
  bao nhiêu dữ liệu nếu có sự cố?
  RTO (Recovery Time Objective) — chấp nhận downtime
  bao lâu để khôi phục?
  Có cần chịu được mất CẢ MỘT datacenter, hay chỉ
  cần chịu được mất một ổ đĩa?

Câu hỏi về chi phí:
  Ngân sách cho phép tốn bao nhiêu % cho redundancy?
  Chi phí của downtime/mất dữ liệu so với chi phí
  đầu tư thêm cho redundancy — cái nào lớn hơn?
```

## Monitoring Storage Trong Production

```
Các chỉ số CẦN theo dõi liên tục:

SMART attributes của ổ đĩa (cho phần cứng vật lý):
  Reallocated sector count — số sector lỗi đã được
  thay thế bằng sector dự phòng
  (tăng dần theo thời gian → dấu hiệu ổ sắp hỏng)
  Temperature — nhiệt độ vận hành của ổ đĩa
  Power-on hours — tổng thời gian hoạt động

Trạng thái mảng RAID:
  Mảng có đang ở trạng thái "degraded" không?
  (một ổ đã hỏng, đang chạy thiếu redundancy)
  Tiến độ rebuild nếu đang trong quá trình khôi phục

Latency và IOPS thực tế:
  So sánh với baseline bình thường
  Latency tăng đột biến có thể là dấu hiệu sớm
  của vấn đề phần cứng trước khi nó hỏng hoàn toàn

Dung lượng còn trống:
  Disk gần đầy có thể gây ra performance degradation
  đáng kể với nhiều loại filesystem (đặc biệt SSD —
  cần không gian trống để garbage collection
  hoạt động hiệu quả)

NGUYÊN TẮC QUAN TRỌNG:
  Khi một ổ trong mảng RAID hỏng, hệ thống VẪN HOẠT ĐỘNG
  (đó là mục đích của RAID!) — nhưng đây là tín hiệu
  CẦN HÀNH ĐỘNG NGAY, không phải để yên tâm rồi quên đi

  Mảng đang "degraded" có nghĩa là KHÔNG CÒN redundancy
  dự phòng — nếu có thêm sự cố trước khi thay ổ và
  rebuild hoàn tất, rủi ro mất dữ liệu là rất thật
```

---

## Tóm Tắt Toàn Bộ

```
NỀN TẢNG VẬT LÝ:
  HDD: cơ học, chậm với random access do seek time
  SSD: điện tử, nhanh, nhưng có write amplification
  và giới hạn số lần ghi

CHỈ SỐ HIỆU NĂNG:
  IOPS: số thao tác/giây — quan trọng cho random workload
  Throughput: lượng dữ liệu/giây — quan trọng cho sequential
  Latency: thời gian một thao tác — quan trọng cho
  ứng dụng nhạy cảm độ trễ

RAID GIẢI QUYẾT HAI VẤN ĐỀ:
  Hiệu năng (qua striping)
  Độ tin cậy (qua mirroring hoặc parity)

CÁC LOẠI RAID:
  RAID 0: striping thuần, nhanh nhất, KHÔNG có redundancy
  RAID 1: mirror, an toàn, tốn 50% dung lượng
  RAID 5: stripe + 1 parity, hiệu quả dung lượng,
  rủi ro khi ổ lớn (rebuild dễ gặp lỗi đọc)
  RAID 6: stripe + 2 parity, an toàn hơn cho ổ lớn
  RAID 10: mirror + stripe, nhanh và an toàn,
  tốn 50% dung lượng

NGUYÊN TẮC VÀNG:
  RAID không phải backup — không bảo vệ khỏi lỗi
  con người, corruption, ransomware
  Luôn áp dụng nguyên tắc 3-2-1 cho backup thực sự

DISTRIBUTED STORAGE:
  Replication: tương tự RAID 1 ở quy mô nhiều máy
  Erasure Coding: tương tự RAID 5/6 ở quy mô nhiều máy,
  hiệu quả dung lượng hơn replication
  Quorum (W+R>N): đảm bảo nhất quán khi đọc/ghi
  nhiều bản sao

VẬN HÀNH THỰC TẾ:
  Mảng "degraded" là tín hiệu khẩn cấp, không phải
  để yên tâm
  Theo dõi SMART attributes, latency, dung lượng
  trống liên tục
```
