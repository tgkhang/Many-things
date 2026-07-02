# ☁️ Cloud Task Deep Dive — DR, Patching, IaC/IaCM, Compliance (AWS-focused)

> **Dành cho ai:** SRE / Cloud Engineer mới vào nghề, cần hiểu **bản chất + kịch bản thực chiến** của các "cloud task" thường gặp: Disaster Recovery, Patching, Infrastructure as Code Management (IaCM), xử lý resource non-compliant, và các internal tool xoay quanh chúng.
>
> **Cách đọc:** Mỗi phần đi theo cấu trúc: **Lý thuyết → Dịch vụ AWS liên quan → Kịch thực chiến (scenario) → Câu hỏi interview/pitfall**. Highlight `⭐` = bắt buộc phải nhớ.

---

## Mục lục

1. [Nền tảng bắt buộc trước khi làm Cloud Task](#1-nền-tảng-bắt-buộc)
2. [Disaster Recovery (DR)](#2-disaster-recovery-dr)
3. [Patching](#3-patching)
4. [IaC & IaCM (Infrastructure as Code Management)](#4-iac--iacm)
5. [Compliance & Non-Compliant Resources](#5-compliance--non-compliant-resources)
6. [Observability & Incident Response cho Cloud Task](#6-observability--incident-response)
7. [Kịch bản thực chiến tổng hợp (Scenarios)](#7-kịch-bản-thực-chiến-tổng-hợp)
8. [Checklist & Tài liệu chính thức](#8-checklist--tài-liệu-chính-thức)

---

# 1. Nền tảng bắt buộc

## 1.1. Shared Responsibility Model ⭐

AWS chịu trách nhiệm **security OF the cloud** (hạ tầng vật lý, hypervisor, network backbone). Bạn chịu trách nhiệm **security IN the cloud** (OS patching trên EC2, data, IAM, cấu hình security group...).

| Tầng | Ai lo? | Ví dụ liên quan cloud task |
|---|---|---|
| Physical / Hypervisor | AWS | Bạn **không bao giờ** patch hypervisor |
| Managed service (RDS, Lambda, Fargate) | AWS lo OS, bạn lo config | RDS: AWS patch OS + engine minor, bạn chọn **maintenance window** |
| EC2 (IaaS) | **Bạn lo OS trở lên** | Patching OS, agent, hardening là việc của bạn |
| Data, IAM, Network config | Luôn là bạn | Non-compliant SG, bucket public → việc của bạn |

👉 **Vì sao quan trọng:** khi nhận task "patch fleet EC2" hay "RDS non-compliant vì minor version cũ" — bạn phải biết ngay ranh giới trách nhiệm để chọn công cụ đúng.

📖 Docs: <https://aws.amazon.com/compliance/shared-responsibility-model/>

## 1.2. Region, AZ, Edge — đơn vị của "blast radius" ⭐

- **Region**: cụm data center độc lập theo địa lý (vd: `ap-southeast-1` Singapore, `ap-southeast-2` Sydney). DR "xịn" = multi-region.
- **Availability Zone (AZ)**: 1+ data center trong region, cách nhau đủ xa để 1 thảm hoạ (cháy, mất điện) không quét sạch cả region, nhưng đủ gần để latency thấp (<10ms). **Multi-AZ là mức HA tối thiểu cho production.**
- **Blast radius**: phạm vi ảnh hưởng khi 1 thứ chết. Tư duy SRE: *thiết kế sao cho blast radius nhỏ nhất có thể*.

```
Region (ap-southeast-2)
├── AZ-a  ── EC2, RDS primary
├── AZ-b  ── EC2, RDS standby   ← Multi-AZ = HA
└── AZ-c  ── EC2

Region khác (ap-southeast-1)     ← Multi-Region = DR
└── Standby / backup environment
```

⭐ **HA ≠ DR**: HA (Multi-AZ) chống lỗi *thành phần/AZ*; DR (Multi-Region / backup) chống lỗi *cả region, ransomware, xoá nhầm data, lỗi logic*. Multi-AZ RDS **không cứu bạn** nếu ai đó chạy `DROP TABLE` — vì lệnh đó replicate sang standby ngay lập tức. Đây là câu hỏi interview kinh điển.

📖 Docs: <https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/abstract-and-introduction.html>

## 1.3. AWS Well-Architected — Reliability Pillar

Mọi cloud task (DR, patching, compliance) đều là hiện thực hoá của **Reliability** và **Operational Excellence** pillar. Nên đọc lướt 1 lần để nói chuyện "cùng ngôn ngữ" với team:

- **Operational Excellence**: runbook, automation, learn from failure (postmortem)
- **Security**: least privilege, patch nhanh, detect non-compliant
- **Reliability**: backup, DR, auto scaling, limit/quota
- **Performance / Cost / Sustainability**

📖 Docs: <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html>

## 1.4. Ba con số phải thuộc lòng: RTO, RPO, SLA ⭐⭐

| Thuật ngữ | Nghĩa | Câu hỏi tương ứng |
|---|---|---|
| **RPO** (Recovery Point Objective) | Chấp nhận **mất bao nhiêu data** (tính bằng thời gian) | "Backup gần nhất cách đây bao lâu?" |
| **RTO** (Recovery Time Objective) | Chấp nhận **downtime bao lâu** để khôi phục | "Bao lâu thì hệ thống chạy lại?" |
| **SLA/SLO** | Cam kết/mục tiêu độ khả dụng (99.9%, 99.99%...) | "1 năm được phép chết bao nhiêu phút?" |

Bảng quy đổi SLA nên nhớ:

| SLA | Downtime cho phép / năm |
|---|---|
| 99% | ~3.65 ngày |
| 99.9% ("three nines") | ~8.77 giờ |
| 99.99% | ~52.6 phút |
| 99.999% | ~5.26 phút |

👉 **RTO/RPO quyết định chiến lược DR và ngân sách.** RPO 24h → backup hằng ngày là đủ. RPO ~0 → phải replicate liên tục (tốn tiền gấp nhiều lần). Đừng bao giờ chọn chiến lược DR trước khi chốt RTO/RPO với business.

> 🔎 RTO/RPO chỉ là 2 trong số **rất nhiều loại "thời gian"** được nhắc trong họp DR (còn MTD, WRT, TTL, drill window, cutover window...). Xem **mục 2.6 — Từ điển thời gian trong DR** để giải mã đầy đủ.

---

# 2. Disaster Recovery (DR)

## 2.1. Disaster là gì? (rộng hơn bạn nghĩ)

"Disaster" không chỉ là động đất/cháy data center. Trong thực tế SRE, các disaster **thường gặp nhất** là:

1. **Human error** ⭐ — xoá nhầm resource, `terraform destroy` nhầm workspace, drop nhầm DB (phổ biến nhất!)
2. **Bad deployment** — release lỗi làm corrupt data
3. **Ransomware / security breach** — attacker mã hoá hoặc xoá data (vì vậy backup phải **immutable**)
4. **Region/AZ outage** — hiếm nhưng có thật (đọc các AWS post-event summaries)
5. **Dependency failure** — third-party API, DNS, certificate hết hạn

## 2.2. Bốn chiến lược DR của AWS ⭐⭐ (câu hỏi interview số 1)

Xếp theo chi phí tăng dần, RTO/RPO giảm dần:

```
Chi phí:   $           $$            $$$             $$$$
          Backup &   Pilot        Warm            Multi-site
          Restore    Light        Standby         Active/Active
RTO:      giờ→ngày   chục phút→giờ  phút→chục phút  ~0 (real-time)
RPO:      giờ        phút→giờ       giây→phút       ~0
```

### (1) Backup & Restore

- **Ý tưởng:** chỉ lưu backup (snapshot, AMI, S3) sang region/account khác. Khi disaster → dựng lại toàn bộ hạ tầng (bằng IaC!) rồi restore data.
- **Điểm mấu chốt:** RTO phụ thuộc vào việc bạn có **IaC + runbook đã test** hay không. Không có IaC → RTO tính bằng ngày.
- Dùng cho: hệ thống non-critical, dev/test, hoặc ngân sách hạn chế.

### (2) Pilot Light

- **Ý tưởng:** như ngọn lửa mồi của bình gas — phần **core tối thiểu luôn chạy** ở region DR (thường là **database được replicate liên tục**), còn app server thì tắt/chưa tạo, chỉ có sẵn AMI + launch template + IaC.
- Khi disaster: bật/scale app layer lên → trỏ traffic sang.
- Data luôn "nóng", compute "nguội".

### (3) Warm Standby

- **Ý tưởng:** một **bản thu nhỏ nhưng đầy đủ chức năng** của production chạy sẵn ở region DR (vd: 10% capacity). Khi disaster → scale up + failover DNS.
- Khác Pilot Light: warm standby **có thể phục vụ traffic ngay** (dù ít), pilot light thì phải bật lên đã.

### (4) Multi-site Active/Active

- **Ý tưởng:** production chạy song song ở ≥2 region, traffic chia bằng Route 53 / Global Accelerator. Region chết → traffic tự dồn sang region còn lại.
- Đắt nhất, phức tạp nhất (data replication 2 chiều, conflict resolution), chỉ dùng cho hệ thống mission-critical (banking core, payment).

📖 Docs (whitepaper phải đọc): <https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html>

## 2.3. Các dịch vụ AWS phục vụ DR ⭐

| Dịch vụ | Vai trò | Ghi chú thực chiến |
|---|---|---|
| **AWS Backup** | Backup tập trung đa dịch vụ (EBS, RDS, DynamoDB, EFS, S3...) theo **backup plan** + tag | Hỗ trợ **cross-region & cross-account copy**, **Vault Lock (immutable)** chống ransomware |
| **EBS Snapshot / AMI** | Snapshot incremental của volume; AMI = snapshot + metadata để launch EC2 | Snapshot nằm trên S3 (ẩn), copy được cross-region |
| **RDS**: Automated backup, Snapshot, **Multi-AZ**, **Read Replica**, Cross-region replica | Multi-AZ = HA (failover tự động, sync replication). Read replica = async, có thể **promote** làm DR | ⭐ Multi-AZ không phải DR; cross-region read replica mới là DR |
| **Aurora Global Database** | Replicate <1s sang region khác, RPO ~1s, RTO <1 phút | Chuẩn cho pilot light/warm standby tier DB |
| **S3 Versioning + Cross-Region Replication (CRR)** | Chống xoá nhầm (versioning) + DR (CRR) | Bật **MFA Delete / Object Lock** cho bucket quan trọng |
| **AWS Elastic Disaster Recovery (DRS)** | Replicate liên tục **cả server** (block-level) sang region khác, RPO giây, RTO phút | Kế thừa CloudEndure; phù hợp lift-and-shift, server "pet" |
| **Route 53** | Failover routing policy + **health check** để tự động chuyển traffic sang DR site | Nhớ hạ TTL trước khi failover |
| **Route 53 ARC** (Application Recovery Controller) | Readiness check + routing control để failover có kiểm soát | Dùng cho hệ thống lớn, tránh "split brain" |
| **DynamoDB Global Tables / PITR** | Multi-region active-active table; Point-in-time recovery 35 ngày | |

📖 AWS Backup: <https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html>
📖 AWS DRS: <https://docs.aws.amazon.com/drs/latest/userguide/what-is-drs.html>
📖 Route 53 failover: <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html>

## 2.4. Nguyên tắc vàng khi làm DR ⭐⭐

1. **"Backup chưa test = chưa có backup."** Restore drill định kỳ (quarterly) là bắt buộc. Rất nhiều công ty phát hiện backup hỏng *đúng lúc cần restore*.
2. **3-2-1 rule**: 3 bản data, 2 loại media/service, 1 bản offsite (region/account khác).
3. **Backup phải thoát khỏi blast radius**: cross-account copy để nếu account bị compromise, attacker không xoá được backup. Kết hợp **AWS Backup Vault Lock** (WORM - write once read many).
4. **DR phụ thuộc IaC**: nếu hạ tầng không được định nghĩa bằng code, RTO của bạn là con số tưởng tượng.
5. **Runbook phải cụ thể đến mức "người trực đêm chưa từng làm cũng chạy được"**: từng lệnh, từng URL console, ai được quyền quyết định failover.
6. **GameDay**: diễn tập disaster có chủ đích (tắt hẳn 1 AZ/region ở môi trường staging) — văn hoá chaos engineering.
7. **Failback cũng phải có kế hoạch**: quay về region chính sau disaster thường khó hơn failover (data đã ghi ở DR site phải sync ngược lại).

## 2.5. Runbook mẫu: Failover RDS cross-region (rút gọn)

```
Tiền điều kiện:
- Cross-region read replica đang healthy (ReplicaLag < 60s)
- IaC cho app layer ở region DR đã apply sẵn (pilot light)
- Route 53 TTL đã hạ xuống 60s

Bước thực hiện:
1. Xác nhận disaster (checklist: region status, health check, 2 người approve)
2. Ghi lại ReplicaLag hiện tại → đây là data loss thực tế (RPO thực)
3. Promote read replica:  aws rds promote-read-replica --db-instance-identifier mydb-dr
4. Đợi status = available; chạy smoke test kết nối DB
5. Scale app layer (ASG desired capacity 0 → N) hoặc terraform apply
6. Update Route 53 failover record / bật routing control (ARC)
7. Smoke test end-to-end qua domain chính
8. Thông báo stakeholder; mở incident timeline để viết postmortem
```

## 2.6. ⏱️ TỪ ĐIỂN THỜI GIAN TRONG DR — nghe họp hiểu ngay ⭐⭐

> **Bối cảnh thực tế:** trong các buổi họp DR, người ta gần như chỉ nói chuyện bằng... các con số thời gian. Câu kiểu *"30 phút ít quá, tăng lên 60 phút đi"* có thể đang nói về **rất nhiều loại thời gian khác nhau** — và mỗi loại kéo theo hệ quả kỹ thuật + chi phí hoàn toàn khác nhau. Phần này giúp bạn "giải mã" đang nói về con số nào.

### 2.6.1. Bản đồ đầy đủ các mốc thời gian

Trước tiên, nhìn timeline của một disaster để thấy các con số nằm ở đâu:

```
────────●───────────────✖──────────●─────────────●──────────────●──────→ thời gian
     backup/          DISASTER   phát hiện    hệ thống       nghiệp vụ
     replication       xảy ra    (detect)     chạy lại       hoạt động lại
     cuối cùng                                (recover)      bình thường
        │                 │          │            │               │
        └────── RPO ──────┘          │            │               │
        (data mất tối đa)            │            │               │
                          └─ MTTD ───┘            │               │
                          (time to detect)        │               │
                          └──────── RTO ──────────┘               │
                          (downtime cho phép để khôi phục)        │
                                                  └───── WRT ─────┘
                                                  (Work Recovery Time:
                                                   verify data, chạy lại
                                                   batch job, nhập bù...)
                          └──────────────── MTD/MTPD ─────────────┘
                          (Maximum Tolerable Downtime — business chết
                           thật sự nếu vượt quá con số này)
```

⭐ Quan hệ phải nhớ: **RTO + WRT ≤ MTD**. RTO là con số *kỹ thuật* (hệ thống up), MTD là con số *business* (quá mốc này thì mất khách hàng/vi phạm quy định/bị phạt). Nhiều buổi họp DR thực chất là đàm phán: business đưa MTD, kỹ thuật báo giá RTO khả thi.

### 2.6.2. Vậy "tăng 30 phút lên 60 phút" trong họp là đang nói cái gì?

Đây là các "nghi phạm" phổ biến nhất, kèm dấu hiệu nhận biết theo ngữ cảnh câu nói:

| Nếu ngữ cảnh là... | Con số đó khả năng cao là | Ý nghĩa của việc TĂNG nó |
|---|---|---|
| "Team không kịp khôi phục trong 30p" / bàn về cam kết với business | **RTO** | **Nới lỏng cam kết** → đội vận hành dễ thở hơn, có thể chọn chiến lược DR rẻ hơn (vd warm standby → pilot light). Ngược lại *giảm* RTO = tốn tiền hơn |
| "Backup/replication 30p một lần thưa quá" | **RPO / tần suất backup** | Chú ý chiều: *tăng tần suất* (backup dày hơn) = **giảm RPO** = tốn hơn. Còn *tăng RPO* (chấp nhận mất 60p data) = rẻ hơn |
| "Buổi diễn tập 30p không đủ làm gì" | **DR drill / GameDay window** | Kéo dài thời lượng diễn tập failover — rất phổ biến vì lần drill đầu hầu như luôn vỡ kế hoạch thời gian |
| "Cutover 30p sợ không kịp, xin 60p" | **Cutover / change window** | Khung giờ được phép thực hiện failover/migration có kế hoạch (thường đêm/cuối tuần), phải đăng ký qua change management |
| "Đợi 30p mới được tuyên bố disaster" | **Declaration time / escalation timer** | Thời gian chờ xác nhận trước khi kích hoạt DR plan (tránh failover oan vì alarm chập chờn) — tăng lên = thận trọng hơn nhưng **ăn thẳng vào RTO!** |
| "Health check 30 giây/lần" (đơn vị nhỏ hơn) | **Health check interval + failure threshold** | Quyết định *bao lâu thì hệ thống nhận ra mình chết* (MTTD). Interval 30s × 3 lần fail = ~90s mới bắt đầu failover |
| "DNS mất 30p mới trỏ hết sang DR" | **DNS TTL** | Thời gian client còn cache IP cũ. Muốn failover nhanh phải **hạ TTL từ trước** ít nhất 1 chu kỳ TTL cũ (TTL đang 24h → phải hạ trước 24h) |
| "Giữ backup 30 ngày ít quá" (đơn vị ngày) | **Retention period** | RDS automated backup giữ tối đa **35 ngày**; lâu hơn phải dùng snapshot thủ công/AWS Backup. Tăng retention = tăng chi phí lưu trữ; trong banking một số data phải giữ đến **7 năm** theo luật |

👉 **Tip đi họp:** nếu không chắc, hỏi một câu rất "senior": *"Con số 60 phút này là RTO cam kết với business, hay là thời lượng của bài test?"* — câu này vừa giúp bạn hiểu, vừa buộc cả phòng làm rõ (rất nhiều meeting mơ hồ đúng chỗ này, mỗi người hiểu một kiểu).

### 2.6.3. Các con số thời gian "cứng" của AWS nên thuộc ⭐

Đây là giới hạn/đặc tính có thật của dịch vụ — dùng để phản biện trong họp (vd: *"RPO 1 phút mà dùng RDS snapshot là bất khả thi, phải chuyển sang Aurora Global"*):

| Dịch vụ / cơ chế | Con số thời gian | Ghi chú |
|---|---|---|
| RDS automated backup | Transaction log upload **~5 phút/lần** → PITR restore được đến từng giây, nhưng **RPO thực tế tối đa ~5 phút** | Retention 0–**35 ngày** |
| RDS Multi-AZ failover | Thường **60–120 giây**; Multi-AZ **DB cluster** (2 readable standby) nhanh hơn, thường **~35 giây** | Đây là HA, không phải DR |
| Aurora Global Database | Replication lag điển hình **< 1 giây**; RTO promote secondary region **< 1 phút** | Vũ khí cho RPO/RTO khắt khe |
| Cross-region read replica (RDS) | Async → lag từ **vài giây đến vài phút** tuỳ tải | Lag tại thời điểm promote = data loss thực |
| AWS Elastic DRS | RPO **tính bằng giây**, RTO **5–20 phút** (launch instance từ replica) | Block-level continuous replication |
| EBS Snapshot (qua Data Lifecycle Manager) | Lịch tối thiểu **mỗi 1 giờ**; snapshot incremental | RPO tốt nhất theo cơ chế này ≈ 1h |
| S3 CRR / SRR | Đa số object replicate trong vòng **15 phút** (bật S3 RTC để có cam kết 99.99% trong 15p) | **Không phải tức thời!** |
| Route 53 health check | Interval **30s (standard)** hoặc **10s (fast)** + failure threshold (mặc định 3 lần) | Quyết định tốc độ phát hiện chết |
| DNS TTL | Tuỳ bạn đặt; thực chiến hay để **60s** cho failover record | TTL cao = failover chậm |
| DynamoDB PITR | Restore về bất kỳ giây nào trong **35 ngày** gần nhất | |
| AWS Backup | Lịch backup dày nhất **mỗi 1 giờ**; cross-region copy tốn thêm thời gian truyền | Backup xong ≠ bản copy ở region khác đã sẵn sàng |

📖 RDS backup & PITR: <https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html>
📖 Aurora Global Database: <https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html>
📖 S3 Replication Time Control: <https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-time-control.html>
📖 Route 53 health check: <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-determining-health-of-endpoints.html>
📖 Data Lifecycle Manager: <https://docs.aws.amazon.com/ebs/latest/userguide/snapshot-lifecycle.html>

### 2.6.4. RTO "trên giấy" vs RTO "thực tế" — vì sao con số 30 phút hay bị vỡ ⭐⭐

Lý do phổ biến nhất khiến meeting phải "tăng 30p lên 60p": RTO trên slide chỉ tính thời gian chạy lệnh, còn RTO thực tế là **tổng của cả chuỗi**:

```
RTO thực = detect   (5–10p : alarm nổ + con người nhìn thấy)
         + declare  (5–15p : xác nhận disaster, gọi đúng người, approve)
         + execute  (10–30p: promote DB, scale compute, đổi DNS)
         + DNS/TTL  (1–30p : client hết cache IP cũ)
         + verify   (5–15p : smoke test, business xác nhận OK)
```

Cộng lại, một failover "30 phút" trên giấy dễ dàng thành **60–90 phút** ngoài đời. Các yếu tố hay bị bỏ quên:

- **Con người là phần chậm nhất**: 3h sáng, người có quyền approve đang ngủ → runbook phải ghi rõ ai được quyết, backup approver là ai, và escalation tự động sau X phút không phản hồi.
- **Warm-up time**: DR site vừa scale lên chưa có cache/connection pool ấm → hệ thống "up" nhưng chậm; "chạy lại" ≠ "hoạt động bình thường" (đây chính là khoảng WRT).
- **Quota & capacity ở region DR**: xin nâng quota lúc khẩn cấp mất hàng giờ đến hàng ngày → phải nâng sẵn từ trước (xem Scenario 7).
- **Thứ tự phụ thuộc**: DB lên trước app, app trước batch job... một mắt xích kẹt là cả chuỗi đứng chờ.

👉 Cách duy nhất để biết RTO thực: **đo bằng đồng hồ trong DR drill**. Con số đo được từ drill mới là con số mang đi cam kết — và đó chính là lý do sau mỗi lần diễn tập, meeting lại ngồi chỉnh các con số.

### 2.6.5. Tips về thời gian khi tham gia họp / vận hành DR

1. **Luôn hỏi rõ loại thời gian và đơn vị** — "60 phút" là RTO, drill window hay cutover window? Ghi vào meeting minutes bằng đúng thuật ngữ để lần sau không cãi nhau lại từ đầu.
2. **Mọi con số thời gian đều là trade-off tiền ↔ rủi ro**: giảm RTO/RPO một nửa thường không tăng chi phí gấp đôi mà gấp nhiều lần (vì phải đổi cả kiến trúc, vd backup → replication). Khi ai đó đòi giảm, câu hỏi đúng là *"budget có đi theo không?"*
3. **Không phải hệ thống nào cũng chung một RTO**: phân tier (Tier 0: payment, RTO 15p / Tier 1: internet banking, RTO 1h / Tier 2: báo cáo nội bộ, RTO 24h). Họp DR trưởng thành là họp về *tier*, không phải một con số áp cho tất cả.
4. **Ghi timestamp mọi bước trong drill lẫn incident thật** (lúc detect, lúc declare, promote xong, DNS xong, verify xong) — đây là dữ liệu vàng để lần họp sau tranh luận bằng số liệu thay vì cảm giác.
5. **TTL là việc chuẩn bị trước, không phải việc làm trong lúc failover** — hạ TTL trước sự kiện ít nhất một chu kỳ TTL cũ.
6. **Đồng hồ RTO đếm từ lúc disaster xảy ra, không phải từ lúc bạn bắt đầu gõ lệnh** — MTTD ăn thẳng vào RTO, nên đầu tư monitoring/alerting cũng chính là đầu tư giảm RTO.
7. **Kiểm tra con số AWS cam kết trước khi hứa với business** (bảng 2.6.3) — đừng hứa RPO 30 giây khi cơ chế bên dưới là backup mỗi giờ.
8. **Drill có "time-box" và tiêu chí abort**: quy định trước "nếu sau 60p chưa xong bước X thì dừng drill, rollback" — tránh diễn tập biến thành incident thật.

---

# 3. Patching

## 3.1. Vì sao patching là "cloud task" quan trọng?

- **Security**: đa số breach khai thác lỗ hổng **đã có patch từ lâu** (vd: Log4Shell — CVE-2021-44228). Patch chậm = mở cửa cho attacker.
- **Compliance**: chuẩn như PCI-DSS, APRA CPS 234 (ngân hàng Úc — rất liên quan môi trường NAB) yêu cầu vá lỗ hổng critical trong thời hạn cụ thể (vd: 30 ngày, critical có thể 48-72h).
- **Ổn định**: bug fix, driver, kernel improvements.

Từ vựng cần biết:

- **CVE** (Common Vulnerabilities and Exposures): mã định danh lỗ hổng, vd `CVE-2021-44228`.
- **CVSS score** (0–10): độ nghiêm trọng. 9.0+ = Critical → patch gấp.
- **Patch compliance**: % máy đã cài đủ patch theo baseline.
- **Patch window / Maintenance window**: khung giờ được phép patch (thường ban đêm, cuối tuần).

## 3.2. AWS Systems Manager (SSM) — bộ đồ nghề patching chuẩn AWS ⭐⭐

SSM là **trung tâm của mọi task vận hành EC2**. Các mảnh ghép:

| Thành phần | Vai trò |
|---|---|
| **SSM Agent** | Agent cài trên EC2/on-prem, có sẵn trong Amazon Linux/Ubuntu AMI chính chủ. Không có agent + IAM role → máy "invisible" với SSM |
| **Managed Instance** | EC2 có agent + instance profile với policy `AmazonSSMManagedInstanceCore` |
| **Session Manager** | SSH không cần mở port 22, không cần key — audit qua CloudTrail. ⭐ Chuẩn secure access hiện đại |
| **Run Command** | Chạy lệnh/script hàng loạt trên fleet (vd: restart agent, thu log) |
| **Patch Manager** | Quét + cài patch theo **Patch Baseline** |
| **Patch Baseline** | Luật chọn patch: OS nào, mức severity nào, **auto-approve sau N ngày**, danh sách approved/rejected |
| **Patch Group** | Gom máy bằng tag `Patch Group` để gán baseline khác nhau (vd: dev patch trước, prod sau 7 ngày) |
| **Maintenance Window** | Lịch (cron) + target + task: "patch nhóm X vào 2h sáng Chủ nhật, tối đa 10% máy cùng lúc, dừng nếu lỗi >5%" |
| **State Manager** | Đảm bảo trạng thái mong muốn liên tục (vd: agent luôn chạy, patch scan mỗi ngày) |
| **Compliance** | Dashboard xem máy nào **Non-Compliant** với patch baseline |
| **Automation (runbook)** | Workflow tự động nhiều bước (vd: `AWS-PatchAsgInstance`, tự viết runbook YAML) |
| **Inventory** | Thu thập software/OS version toàn fleet |

📖 SSM Patch Manager: <https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager.html>
📖 SSM tổng quan: <https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html>

### Flow patching chuẩn với SSM

```
1. Tag máy:            Patch Group = "prod-linux"
2. Tạo Patch Baseline: Critical+Important, auto-approve sau 7 ngày
3. Gán baseline → patch group
4. Maintenance Window: Sun 02:00, concurrency 10%, error threshold 5%
5. Task: AWS-RunPatchBaseline
   - Operation=Scan     → chỉ quét, báo compliance (chạy hằng ngày)
   - Operation=Install  → cài thật (chạy trong maintenance window)
6. Xem kết quả: SSM Compliance / Patch Manager dashboard
```

⭐ **Scan vs Install**: Scan chạy thường xuyên để biết mình đang thiếu gì (visibility); Install chỉ chạy trong window. Đây là điểm hay bị hỏi.

## 3.3. Hai triết lý patching: In-place vs Immutable ⭐⭐

### In-place patching (truyền thống)

- Patch trực tiếp trên máy đang chạy (yum/apt update qua SSM).
- ✅ Đơn giản, phù hợp server "pet", stateful.
- ❌ Máy trôi cấu hình dần (configuration drift), khó rollback, có downtime khi reboot.

### Immutable / AMI baking (hiện đại) ⭐

- **Không bao giờ patch máy đang chạy.** Thay vào đó: build **AMI mới đã patch sẵn** (golden AMI) → rolling replace instance trong Auto Scaling Group.
- Công cụ: **EC2 Image Builder** (pipeline build AMI định kỳ: base AMI → patch → cài agent → harden → test → distribute), hoặc Packer (HashiCorp).
- ✅ Rollback = deploy lại AMI cũ; không drift; test được AMI trước khi ra prod.
- ❌ Cần app stateless + ASG + pipeline; không áp dụng được cho DB "pet".

📖 EC2 Image Builder: <https://docs.aws.amazon.com/imagebuilder/latest/userguide/what-is-image-builder.html>

👉 Thực tế doanh nghiệp lớn dùng **cả hai**: immutable cho fleet stateless, in-place (SSM) cho máy stateful/legacy.

## 3.4. Patching managed services

- **RDS/Aurora**: chọn **maintenance window**; minor version có thể auto upgrade; **major version phải tự lên kế hoạch** (test trên bản restore/blue-green deployment của RDS).
- **EKS**: Kubernetes version upgrade theo lộ trình (control plane → node group → addon). Node patch = thay node bằng AMI mới (immutable). Chú ý **EKS version chỉ được support ~14 tháng** → upgrade là task định kỳ bắt buộc.
- **Lambda/Fargate**: AWS lo runtime OS; bạn lo **runtime deprecation** (vd Node 16 EOL → phải nâng code lên Node 20).

📖 RDS maintenance: <https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.Maintenance.html>

## 3.5. Kịch bản thực chiến: Zero-day nghiêm trọng (kiểu Log4Shell)

```
T+0h   Security team báo CVE critical (CVSS 10.0), có exploit công khai
T+0.5h Xác định phạm vi:
       - SSM Inventory / Run Command: grep version thư viện trên toàn fleet
       - ECR image scan / Amazon Inspector: tìm container ảnh hưởng
T+1h   Giảm thiểu tạm (mitigation) trước khi patch:
       - WAF rule chặn pattern khai thác
       - Tắt tính năng bị ảnh hưởng qua env var (vd log4j2.formatMsgNoLookups=true)
T+2h+  Patch thật:
       - Fleet ASG: build AMI/image mới → rolling deploy
       - Máy pet: SSM Run Command cài bản vá, có canary trước
T+...  Verify: Inspector re-scan, compliance dashboard xanh
       Viết postmortem + cập nhật runbook
```

⭐ Bài học: **mitigation trước, patch sau** — không chờ patch xong mới chặn attack.

---

# 4. IaC & IaCM

## 4.1. IaC là gì, vì sao là xương sống của mọi cloud task? ⭐

**Infrastructure as Code**: định nghĩa hạ tầng (VPC, EC2, RDS, IAM...) bằng file code, version control bằng Git, deploy qua pipeline — thay vì click console ("ClickOps").

Lợi ích cốt lõi:

- **Repeatable**: dựng lại môi trường giống hệt (nền tảng của DR backup & restore!)
- **Reviewable**: mọi thay đổi qua Pull Request → 4-eyes principle (quan trọng trong banking)
- **Auditable**: Git history = lịch sử hạ tầng
- **Drift detection**: phát hiện ai đó sửa tay ngoài code

Công cụ chính:

| Tool | Đặc điểm |
|---|---|
| **Terraform / OpenTofu** ⭐ | Đa cloud, HCL, có **state file**, hệ sinh thái module khổng lồ. Chuẩn de-facto doanh nghiệp |
| **CloudFormation** | Native AWS, state do AWS quản (stack), có drift detection built-in |
| **CDK** | Viết TypeScript/Python → synth ra CloudFormation. Hợp dev-background như bạn |
| **Pulumi** | Ngôn ngữ lập trình thật, state service riêng |

📖 Terraform: <https://developer.hashicorp.com/terraform/docs>
📖 CloudFormation: <https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html>
📖 CDK: <https://docs.aws.amazon.com/cdk/v2/guide/home.html>

## 4.2. Terraform — những khái niệm sống còn ⭐⭐

```
Vòng đời:  write → terraform init → plan → apply → (destroy)
```

1. **State file (`terraform.tfstate`)** — trái tim và cũng là điểm yếu:
   - Là "bản đồ" mapping code ↔ resource thật trên AWS.
   - ⭐ Phải lưu **remote backend** (S3 + state locking — Terraform ≥1.10 hỗ trợ native S3 locking, trước đó dùng DynamoDB lock table), bật versioning + encryption.
   - State chứa **secret dạng plaintext** → khoá quyền đọc chặt.
   - Mất state ≠ mất hạ tầng, nhưng = mất khả năng quản lý → phải `import` lại từng resource (ác mộng).

2. **Plan trước, apply sau**: `terraform plan` là "diff" — đọc kỹ trước khi apply, đặc biệt các dòng `-destroy` và `-/+ (replace)`. ⭐ Nhiều thay đổi tưởng vô hại (đổi tên, đổi AZ) thực chất **destroy & recreate** resource → mất data.

3. **Module**: đóng gói tái sử dụng (vd module `vpc`, `rds`). Doanh nghiệp có **module registry nội bộ** đã bake sẵn security standard — bạn chỉ gọi module, không tự viết resource thô.

4. **Workspace / environment separation**: dev/staging/prod tách state, tách account. Sai workspace khi destroy là tai nạn kinh điển.

5. **Import & moved**: đưa resource tạo tay vào quản lý (`terraform import` / `import` block), refactor không destroy (`moved` block).

📖 State: <https://developer.hashicorp.com/terraform/language/state>
📖 S3 backend: <https://developer.hashicorp.com/terraform/language/backend/s3>

## 4.3. Drift — kẻ thù số 1 của IaC ⭐⭐

**Drift** = trạng thái thực tế trên cloud khác với code (thường do ai đó sửa tay trên console: mở thêm port SG, tăng size instance lúc incident rồi quên...).

Vì sao nguy hiểm:

- `terraform apply` lần sau có thể **revert thay đổi tay đó** (đôi khi thay đổi tay là bản fix incident!) hoặc destroy nhầm.
- Hạ tầng thật không còn được review/audit → lỗ hổng compliance.

Cách phát hiện & xử lý:

```
Phát hiện:
- terraform plan định kỳ trong pipeline (schedule hằng ngày) → plan có diff = có drift
- CloudFormation: nút "Detect drift" / API DetectStackDrift
- IaCM tool (Harness IaCM, Terraform Cloud/HCP, Spacelift, env0): drift detection tự động + notify

Xử lý (quyết định theo từng resource):
1. Thay đổi tay là ĐÚNG (hotfix hợp lệ)  → cập nhật code cho khớp thực tế → PR → apply (no-op)
2. Thay đổi tay là SAI (vi phạm)         → terraform apply để revert về code
3. Resource ngoài luồng                  → import vào code hoặc xoá
```

⭐ Nguyên tắc văn hoá: **"Nếu nó không nằm trong code, nó không tồn tại."** Console prod chỉ nên read-only với đa số engineer (trừ break-glass access có audit).

📖 CloudFormation drift: <https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html>

## 4.4. IaCM — Infrastructure as Code Management ⭐

Khi tổ chức có **hàng trăm workspace Terraform + hàng chục team**, chạy `terraform apply` từ laptop cá nhân là thảm hoạ. **IaCM = tầng quản trị tập trung cho IaC**, giải quyết:

| Vấn đề | IaCM giải quyết bằng |
|---|---|
| State ở đâu, ai lock? | Remote state được quản lý tập trung, locking tự động |
| Ai được apply? | RBAC + approval gate (plan → người review → approve → apply) |
| Thay đổi có an toàn/đúng chuẩn không? | **Policy as Code** (OPA/Rego, Sentinel): chặn apply nếu vi phạm (vd: S3 không encrypt, SG mở 0.0.0.0/0, thiếu tag) |
| Drift? | Scheduled drift detection + alert |
| Chi phí thay đổi? | Cost estimation ngay trong PR (Infracost-style) |
| Audit? | Log đầy đủ ai plan/apply gì, khi nào |
| Module chuẩn? | Private module registry |

Các sản phẩm tiêu biểu: **HCP Terraform (Terraform Cloud/Enterprise)**, **Harness IaCM** (nếu công ty đã dùng Harness cho CI/CD thì đây là mảnh ghép tự nhiên), Spacelift, env0, Atlantis (open-source, PR-driven).

📖 Harness IaCM: <https://developer.harness.io/docs/infra-as-code-management/get-started/overview>
📖 HCP Terraform: <https://developer.hashicorp.com/terraform/cloud-docs>
📖 OPA: <https://www.openpolicyagent.org/docs/latest/>

### Flow IaCM chuẩn trong doanh nghiệp

```
Dev sửa .tf → push branch → PR
   │
   ├─ CI tự chạy: fmt, validate, tflint, checkov/tfsec (security scan)
   ├─ IaCM chạy: terraform plan + cost estimate + OPA policy check
   │        └─ policy FAIL (vd SG mở 0.0.0.0/0:22) → block merge ⛔
   ├─ Reviewer đọc plan output → approve PR
   └─ Merge → IaCM apply vào môi trường (có approval gate riêng cho prod)
```

⭐ Với người mới: bạn sẽ **hầu như không bao giờ chạy `terraform apply` bằng tay vào prod** — mọi thứ đi qua pipeline. Việc của bạn là đọc hiểu plan output và policy failure.

## 4.5. Internal tool — vì sao công ty nào cũng có "wrapper" riêng?

Doanh nghiệp lớn (đặc biệt ngân hàng) thường bọc AWS/Terraform bằng **internal platform / internal tool**:

- **Landing Zone / Account Factory** (AWS Control Tower hoặc tự build): xin account mới qua form/API, tự có sẵn guardrails, network, logging.
- **Golden module / template**: chỉ được tạo resource qua module đã được security duyệt.
- **Self-service portal (IDP — Internal Developer Platform)**: Backstage-style, dev bấm nút "tạo service" → tool sinh repo + pipeline + hạ tầng chuẩn.
- **Guardrails**: SCP (Service Control Policy) ở Organizations chặn hành vi nguy hiểm ở mức account (vd: không được tắt CloudTrail, không được dùng region lạ).

👉 **Mindset khi vào công ty:** đừng hỏi "làm sao tạo EC2 trên AWS" mà hỏi **"quy trình/tool nội bộ để tạo EC2 ở đây là gì"**. Kỹ năng đọc doc nội bộ + hiểu vì sao có guardrail đó = kỹ năng sống còn của SRE mới.

📖 Control Tower: <https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html>
📖 SCP: <https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html>

---

# 5. Compliance & Non-Compliant Resources

## 5.1. "Non-compliant" nghĩa là gì? ⭐

Một resource bị đánh dấu **Non-Compliant** khi nó **vi phạm một rule/policy** mà tổ chức đặt ra. Nguồn rule:

1. **Security baseline** — vd: S3 bucket không được public, EBS phải encrypt, SG không được mở 0.0.0.0/0 port 22/3389
2. **Patch compliance** — máy thiếu patch theo baseline (mục 3)
3. **Tagging policy** — thiếu tag bắt buộc (`Owner`, `CostCenter`, `Environment`) → không biết của ai, không tính được cost
4. **Regulatory** — chuẩn ngành: PCI-DSS, CIS Benchmark, APRA CPS 234 (banking Úc), ISO 27001
5. **Cost/ops policy** — instance type bị cấm, resource bỏ hoang

## 5.2. AWS Config — máy quét compliance liên tục ⭐⭐

**AWS Config** ghi lại **configuration history** của mọi resource (ai đổi gì, khi nào) và đánh giá chúng theo **Config Rules**:

- **Managed rules** (400+ có sẵn): `s3-bucket-public-read-prohibited`, `encrypted-volumes`, `restricted-ssh`, `required-tags`, `rds-instance-public-access-check`...
- **Custom rules**: viết Lambda hoặc **Guard (policy language)** cho rule riêng.
- **Conformance Packs**: gói rule đóng sẵn theo chuẩn (CIS, PCI-DSS, "Operational Best Practices for...") — deploy 1 phát ra cả bộ.
- **Aggregator**: gom compliance status **đa account/đa region** về 1 dashboard (chuẩn cho AWS Organizations).

Kết quả mỗi rule trên mỗi resource: `COMPLIANT` / `NON_COMPLIANT` / `NOT_APPLICABLE`.

📖 AWS Config: <https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html>
📖 Managed rules list: <https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html>

## 5.3. Auto-remediation — tự động sửa non-compliant ⭐⭐

Flow chuẩn:

```
AWS Config rule đánh giá → NON_COMPLIANT
        │
        ├── (a) Notify: EventBridge → SNS/Slack → con người xử lý
        │
        └── (b) Auto-remediate: Config Remediation Action
                → gọi SSM Automation runbook
                → sửa resource tự động
                → Config re-evaluate → COMPLIANT ✅
```

Ví dụ kinh điển:

| Vi phạm | Runbook remediation |
|---|---|
| S3 bucket public | `AWS-DisableS3BucketPublicReadWrite` |
| SG mở 0.0.0.0/0 port 22 | `AWS-DisablePublicAccessForSecurityGroup` |
| EBS volume không encrypt | Notify (không auto được — phải snapshot→copy encrypted→swap) |
| CloudTrail bị tắt | `AWS-EnableCloudTrail` |
| Thiếu tag | Auto-tag bằng Lambda đọc CloudTrail xem ai tạo |

⭐ **Cẩn trọng với auto-remediation**: sửa tự động SG đang được app hợp lệ dùng có thể **gây outage**. Best practice: bắt đầu bằng **detect + notify**, chỉ auto-remediate các rule "chắc chắn an toàn", và luôn có exception process (resource được whitelist có lý do + expiry date).

📖 Config remediation: <https://docs.aws.amazon.com/config/latest/developerguide/remediation.html>
📖 SSM Automation runbooks: <https://docs.aws.amazon.com/systems-manager-automation-runbooks/latest/userguide/automation-runbook-reference.html>

## 5.4. Hệ sinh thái security/compliance liên quan (biết để phân biệt) ⭐

| Dịch vụ | Trả lời câu hỏi | Phân biệt |
|---|---|---|
| **AWS Config** | "Resource có đúng cấu hình chuẩn không?" | Config-focused, có history |
| **Security Hub** | "Toàn cảnh security posture của tôi?" | **Tổng hợp** finding từ Config, GuardDuty, Inspector... theo chuẩn (CIS, FSBP), chấm điểm |
| **GuardDuty** | "Có ai đang tấn công/hành vi bất thường không?" | **Threat detection** (runtime), phân tích CloudTrail/VPC Flow/DNS logs |
| **Inspector** | "Máy/container/Lambda của tôi có CVE nào?" | **Vulnerability scan** — gắn chặt với patching (mục 3) |
| **Trusted Advisor** | "Best practice cơ bản: cost, limit, security?" | Check tổng quát, có quota/limit check |
| **CloudTrail** | "Ai đã làm gì, khi nào, từ đâu?" | **Audit log mọi API call** — nguồn sự thật khi điều tra |
| **IAM Access Analyzer** | "Resource nào đang share ra ngoài?" | Phát hiện external access ngoài ý muốn |

📖 Security Hub: <https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html>
📖 GuardDuty: <https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html>
📖 Inspector: <https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html>

## 5.5. Phòng bệnh hơn chữa bệnh: Preventive vs Detective controls ⭐

```
PREVENTIVE (chặn từ đầu)                DETECTIVE (phát hiện sau)
├─ SCP (Organizations)                  ├─ AWS Config rules
├─ IAM policy / permission boundary     ├─ Security Hub / GuardDuty
├─ OPA/Sentinel trong IaCM pipeline     ├─ Inspector scan
├─ checkov/tfsec scan code trước merge  └─ CloudTrail analysis
└─ Golden module (chỉ cho tạo đồ chuẩn)
```

Tư duy trưởng thành của tổ chức: **đẩy compliance sang trái (shift-left)** — chặn resource non-compliant ngay ở PR (policy as code) rẻ hơn nhiều so với phát hiện và remediate trên prod.

---

# 6. Observability & Incident Response

(Cloud task nào cũng cần "mắt" và quy trình khi có sự cố — phần này là keo dán các phần trên.)

## 6.1. Bộ ba trụ cột + dịch vụ AWS

| Trụ cột | Dịch vụ AWS | Ghi chú |
|---|---|---|
| **Metrics** | CloudWatch Metrics, Container Insights | Alarm dựa trên threshold/anomaly detection |
| **Logs** | CloudWatch Logs, Logs Insights (query) | Structured logging (JSON) để query được |
| **Traces** | X-Ray, ADOT (OpenTelemetry) | Distributed tracing cho microservice |
| Sự kiện hạ tầng | **EventBridge**, **AWS Health Dashboard** | Health event (vd: EC2 scheduled maintenance, AWS thông báo region issue) → tự động hoá phản ứng |

📖 CloudWatch: <https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html>
📖 AWS Health: <https://docs.aws.amazon.com/health/latest/ug/what-is-aws-health.html>

## 6.2. Khái niệm SRE cốt lõi ⭐

- **SLI** (indicator): số đo được — vd % request thành công, p99 latency.
- **SLO** (objective): mục tiêu nội bộ — vd 99.9% request thành công/30 ngày.
- **Error budget**: 100% − SLO = "ngân sách lỗi". Còn budget → được ship nhanh; cháy budget → freeze feature, tập trung reliability. Đây là cơ chế cân bằng dev vs ops nổi tiếng của Google SRE.
- **Toil**: việc tay lặp lại không tạo giá trị lâu dài (vd: patch tay từng máy) → mục tiêu SRE là **automate toil đi** (đó là lý do mọi phần trên đều xoay quanh automation).
- **MTTR / MTTD / MTBF**: thời gian trung bình để recover / detect / giữa các lần hỏng.

📖 Google SRE Book (miễn phí, kinh thánh): <https://sre.google/sre-book/table-of-contents/>

## 6.3. Incident response flow chuẩn

```
Detect (alarm) → Triage (severity? ai bị ảnh hưởng?) → Mitigate TRƯỚC (rollback,
failover, scale, feature flag off) → Root cause SAU → Resolve → Blameless Postmortem
```

⭐ Nguyên tắc: **"Stop the bleeding first."** Trong incident, mục tiêu là khôi phục dịch vụ (thường bằng rollback/failover), *không phải* tìm nguyên nhân gốc — cái đó để postmortem. Postmortem phải **blameless** (không đổ lỗi cá nhân) và ra **action items** có owner + deadline.

---

# 7. Kịch bản thực chiến tổng hợp

> Đây là dạng tình huống hay gặp trong công việc thật lẫn interview vòng scenario. Với mỗi kịch bản, hãy tự trả lời trước khi đọc lời giải.

### 🔥 Scenario 1: "Region chính bị degraded, quyết định failover?"

**Suy nghĩ đúng:**

1. **Xác nhận**: AWS Health Dashboard + health check của mình (đừng failover vì 1 alarm chập chờn).
2. **So sánh chi phí**: thời gian region tự hồi phục (thường AWS fix trong 1-4h) vs RTO failover của mình + rủi ro failback. Failover sang DR cũng có rủi ro riêng (DR chưa từng chịu full load).
3. Nếu RTO cam kết sắp vỡ → chạy runbook failover (mục 2.5), có 2 người approve.
4. Ghi timeline, thông báo status page, postmortem sau.

### 🔥 Scenario 2: "Sau đợt patch đêm qua, 20% máy prod không lên lại"

1. **Dừng rollout ngay** — maintenance window đã cấu hình error threshold chưa? (bài học: luôn đặt `max errors` + patch theo wave).
2. Máy trong ASG: dễ — set AMI cũ / launch template version cũ, thay máy hỏng.
3. Máy pet: Session Manager (nếu SSM còn sống) hoặc EC2 Serial Console xem boot log; tệ nhất: detach root volume, gắn sang máy khác sửa, gắn lại.
4. Root cause thường gặp: kernel mới xung đột driver/agent, disk đầy khi update, service không auto-start.
5. Phòng ngừa lần sau: patch **dev → staging soak 24-48h → prod theo wave 10%**, có automated health check sau reboot.

### 🔥 Scenario 3: "AWS Config báo 40 security group non-compliant (mở 0.0.0.0/0)"

1. **Đừng xoá rule hàng loạt** — có thể có SG hợp lệ (public ALB port 443 là bình thường!). Phân loại trước: rule nào là 22/3389 (nguy hiểm thật) vs 80/443 trên ALB (hợp lệ).
2. Truy nguồn: CloudTrail xem ai tạo; SG này do Terraform quản hay tạo tay?
   - Do Terraform quản → sửa **trong code**, không sửa console (tránh drift!)
   - Tạo tay → tìm owner qua tag, hẹn deadline fix, sau đó remediate.
3. Dài hạn: thêm OPA policy chặn ở PR + Config auto-remediation cho port 22/3389 + SCP nếu cần.

### 🔥 Scenario 4: "terraform plan trên prod hiện 15 thay đổi mà không ai đụng code"

= **Drift**. Xử lý theo playbook mục 4.3: đối chiếu từng resource với CloudTrail (ai đổi tay, khi nào, có ticket không) → quyết định *codify* (đưa vào code) hay *revert*. Tuyệt đối không `apply` bừa khi chưa hiểu diff — có thể revert mất bản hotfix của ai đó lúc incident.

### 🔥 Scenario 5: "Dev xoá nhầm bảng production trong RDS"

1. Multi-AZ không cứu được (đã replicate lệnh xoá). Cần **Point-in-Time Recovery (PITR)**: restore instance **mới** về thời điểm ngay trước khi xoá (RDS giữ log 5 phút/lần, restore được tới giây bất kỳ trong retention period).
2. Restore ra instance mới → export bảng bị mất → import lại vào prod (hoặc swap endpoint nếu mất nhiều).
3. RPO thực = khoảng giữa thời điểm xoá và bản ghi log cuối (~≤5 phút).
4. Phòng ngừa: quyền prod DB theo least-privilege, deletion protection, backup cross-account.

📖 RDS PITR: <https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html>

### 🔥 Scenario 6: "Certificate hết hạn làm chết service lúc 3h sáng"

1. Mitigate: renew/deploy cert mới (ACM cert dùng với ALB/CloudFront **tự renew** — sự cố này thường do cert tự quản trên EC2/container hoặc private CA).
2. Phòng ngừa: chuyển hết về **ACM** nơi có thể; cert tự quản → CloudWatch alarm/Config rule `acm-certificate-expiration-check` cảnh báo trước 30-45 ngày; đưa việc renew vào automation.

📖 ACM: <https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html>

### 🔥 Scenario 7: "Deploy thất bại vì vượt service quota"

- Mỗi account có **Service Quotas** (vd: số vCPU On-Demand, số EIP, số rule/SG). Scale event lớn hoặc DR failover (bật cả fleet ở region mới!) rất hay đụng quota.
- ⭐ Bài học DR ít người để ý: **quota ở region DR phải được nâng sẵn** bằng với region chính — lúc disaster mới xin nâng quota thì quá muộn.
- Chủ động: quota monitoring qua Trusted Advisor / Service Quotas + alarm ở 80%.

📖 Service Quotas: <https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html>

---

# 8. Checklist & Tài liệu chính thức

## 8.1. Checklist tự kiểm tra kiến thức (trước interview / nhận việc)

**DR**

- [ ] Giải thích được RTO vs RPO và cho ví dụ số cụ thể
- [ ] Vẽ và so sánh 4 chiến lược DR (chi phí, RTO/RPO, dịch vụ AWS dùng)
- [ ] Giải thích vì sao Multi-AZ ≠ DR; khi nào cần cross-region
- [ ] Biết AWS Backup Vault Lock để chống ransomware
- [ ] Nêu được quy trình DR test/GameDay
- [ ] Phân biệt được RTO / MTD / WRT / MTTD và vẽ được timeline (mục 2.6.1)
- [ ] Nghe "tăng 30p lên 60p" trong họp là xác định được đang nói về loại thời gian nào (mục 2.6.2)
- [ ] Thuộc các con số thời gian "cứng" của AWS: RDS log 5p, retention max 35 ngày, Multi-AZ failover 60–120s, Aurora Global lag <1s, S3 RTC 15p (mục 2.6.3)
- [ ] Giải thích được vì sao RTO trên giấy luôn nhỏ hơn RTO thực tế (mục 2.6.4)

**Patching**

- [ ] Mô tả flow SSM: baseline → patch group → maintenance window → compliance
- [ ] Phân biệt Scan vs Install; in-place vs immutable (AMI baking)
- [ ] Trình bày chiến lược rollout: dev → staging → prod theo wave + error threshold
- [ ] Biết xử lý zero-day: inventory → mitigate → patch → verify

**IaC/IaCM**

- [ ] Giải thích Terraform state, vì sao cần remote backend + locking
- [ ] Đọc hiểu plan output, nhận ra thao tác destroy/replace nguy hiểm
- [ ] Định nghĩa drift, cách phát hiện, 3 hướng xử lý
- [ ] Nêu vai trò của IaCM: RBAC, approval, policy as code, drift detection
- [ ] Hiểu vì sao doanh nghiệp có internal tool/golden module/SCP

**Compliance**

- [ ] Mô tả AWS Config rule → NON_COMPLIANT → remediation flow
- [ ] Phân biệt Config / Security Hub / GuardDuty / Inspector / CloudTrail
- [ ] Giải thích preventive vs detective control, shift-left
- [ ] Nêu rủi ro của auto-remediation và cách triển khai an toàn

**SRE nền**

- [ ] SLI/SLO/error budget, toil, MTTR
- [ ] Incident flow: mitigate trước, root cause sau, blameless postmortem

## 8.2. Tài liệu chính thức nên bookmark

| Chủ đề | Link |
|---|---|
| DR whitepaper (⭐ đọc đầu tiên) | <https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html> |
| Well-Architected Reliability | <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html> |
| AWS Backup | <https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html> |
| Elastic Disaster Recovery (DRS) | <https://docs.aws.amazon.com/drs/latest/userguide/what-is-drs.html> |
| SSM Patch Manager | <https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager.html> |
| EC2 Image Builder | <https://docs.aws.amazon.com/imagebuilder/latest/userguide/what-is-image-builder.html> |
| Terraform docs | <https://developer.hashicorp.com/terraform/docs> |
| Terraform state | <https://developer.hashicorp.com/terraform/language/state> |
| Harness IaCM | <https://developer.harness.io/docs/infra-as-code-management/get-started/overview> |
| Open Policy Agent | <https://www.openpolicyagent.org/docs/latest/> |
| AWS Config | <https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html> |
| Config remediation | <https://docs.aws.amazon.com/config/latest/developerguide/remediation.html> |
| Security Hub | <https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html> |
| CloudWatch | <https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html> |
| Service Quotas | <https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html> |
| Google SRE Book (free) | <https://sre.google/sre-book/table-of-contents/> |

---
