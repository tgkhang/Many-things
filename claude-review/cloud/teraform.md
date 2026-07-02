# 🏗️ Terraform — Toàn Tập

## Infrastructure as Code từ nền tảng đến thực hành production

---

## Mục Lục

- [🏗️ Terraform — Toàn Tập](#️-terraform--toàn-tập)
  - [Infrastructure as Code từ nền tảng đến thực hành production](#infrastructure-as-code-từ-nền-tảng-đến-thực-hành-production)
  - [Mục Lục](#mục-lục)
- [1. Terraform Giải Quyết Vấn Đề Gì](#1-terraform-giải-quyết-vấn-đề-gì)
  - [1.1. Vấn Đề Trước Khi Có Terraform](#11-vấn-đề-trước-khi-có-terraform)
  - [1.2. Terraform Giải Quyết Vấn Đề Bằng Cách Nào](#12-terraform-giải-quyết-vấn-đề-bằng-cách-nào)
  - [1.3. Tại Sao Cách Tiếp Cận Này Mạnh Mẽ](#13-tại-sao-cách-tiếp-cận-này-mạnh-mẽ)
  - [1.4. Terraform Không Phải Là Gì](#14-terraform-không-phải-là-gì)
- [2. Kiến Trúc Terraform — Cách Hoạt Động Bên Trong](#2-kiến-trúc-terraform--cách-hoạt-động-bên-trong)
  - [2.1. Hai Thành Phần Chính](#21-hai-thành-phần-chính)
  - [2.2. Hai Giai Đoạn Tách Biệt: Plan và Apply](#22-hai-giai-đoạn-tách-biệt-plan-và-apply)
- [3. HCL — Ngôn Ngữ Cấu Hình](#3-hcl--ngôn-ngữ-cấu-hình)
  - [3.1. Cấu Trúc Block Cơ Bản](#31-cấu-trúc-block-cơ-bản)
  - [3.2. Kiểu Dữ Liệu Trong HCL](#32-kiểu-dữ-liệu-trong-hcl)
  - [3.3. Expressions — Biểu Thức Động](#33-expressions--biểu-thức-động)
  - [3.4. Comments — Chú Thích Code](#34-comments--chú-thích-code)
- [4. Provider — Cầu Nối Đến Hạ Tầng Thực](#4-provider--cầu-nối-đến-hạ-tầng-thực)
  - [4.1. Khai Báo Provider](#41-khai-báo-provider)
  - [4.2. Version Constraints — Tại Sao Phải Ghim Phiên Bản?](#42-version-constraints--tại-sao-phải-ghim-phiên-bản)
  - [4.3. Provider Alias — Dùng Nhiều Cấu Hình Cho Cùng Một Provider](#43-provider-alias--dùng-nhiều-cấu-hình-cho-cùng-một-provider)
- [5. Resource — Đơn Vị Cơ Bản Nhất](#5-resource--đơn-vị-cơ-bản-nhất)
  - [5.1. Giải Phẫu Của Một Resource](#51-giải-phẫu-của-một-resource)
  - [5.2. Vòng Đời Của Một Resource (CRUD)](#52-vòng-đời-của-một-resource-crud)
  - [5.3. `lifecycle` Block — Kiểm Soát Đặc Biệt Vòng Đời](#53-lifecycle-block--kiểm-soát-đặc-biệt-vòng-đời)
  - [5.2. Vòng Đời Của Một Resource (CRUD)](#52-vòng-đời-của-một-resource-crud-1)
  - [5.3. `lifecycle` Block — Kiểm Soát Đặc Biệt Vòng Đời](#53-lifecycle-block--kiểm-soát-đặc-biệt-vòng-đời-1)
- [6. State — Trái Tim Của Terraform](#6-state--trái-tim-của-terraform)
  - [6.1. State Là Gì Và Tại Sao Nó Tối Quan Trọng?](#61-state-là-gì-và-tại-sao-nó-tối-quan-trọng)
  - [6.2. Refresh — Đồng Bộ State Với Thực Tế](#62-refresh--đồng-bộ-state-với-thực-tế)
  - [6.3. Tại Sao Không Bao Giờ Sửa State File Bằng Tay?](#63-tại-sao-không-bao-giờ-sửa-state-file-bằng-tay)
- [7. Remote State và State Locking](#7-remote-state-và-state-locking)
  - [7.1. Vấn Đề Với Local State](#71-vấn-đề-với-local-state)
  - [7.2. Remote State — Lưu Trữ Tập Trung Và An Toàn](#72-remote-state--lưu-trữ-tập-trung-và-an-toàn)
  - [7.3. State Locking — Tránh Xung Đột Đồng Thời](#73-state-locking--tránh-xung-đột-đồng-thời)
  - [7.4. Tổ Chức State — Một State Lớn Hay Nhiều State Nhỏ?](#74-tổ-chức-state--một-state-lớn-hay-nhiều-state-nhỏ)
- [8. Vòng Đời Lệnh Terraform](#8-vòng-đời-lệnh-terraform)
  - [8.1. Các Lệnh Cốt Lõi](#81-các-lệnh-cốt-lõi)
  - [8.2. Đọc Output Của `terraform plan` Như Một Chuyên Gia](#82-đọc-output-của-terraform-plan-như-một-chuyên-gia)
- [9. Variables — Tham Số Hóa Cấu Hình](#9-variables--tham-số-hóa-cấu-hình)
  - [9.1. Khai Báo Variable](#91-khai-báo-variable)
  - [9.2. Các Cách Cung Cấp Giá Trị Cho Variable](#92-các-cách-cung-cấp-giá-trị-cho-variable)
  - [9.3. Type Constraints — Kiểm Tra Kiểu Dữ Liệu Nâng Cao](#93-type-constraints--kiểm-tra-kiểu-dữ-liệu-nâng-cao)
- [10. Output — Lấy Giá Trị Ra Ngoài](#10-output--lấy-giá-trị-ra-ngoài)
  - [10.1. Khai Báo và Sử Dụng Output](#101-khai-báo-và-sử-dụng-output)
  - [10.2. Các Use Case Quan Trọng Của Output](#102-các-use-case-quan-trọng-của-output)
- [11. Data Source — Đọc Tài Nguyên Có Sẵn](#11-data-source--đọc-tài-nguyên-có-sẵn)
  - [11.1. Sự Khác Biệt Giữa `resource` và `data`](#111-sự-khác-biệt-giữa-resource-và-data)
  - [11.2. Các Use Case Phổ Biến](#112-các-use-case-phổ-biến)
  - [11.3. `terraform_remote_state` — Cầu Nối Giữa Các State](#113-terraform_remote_state--cầu-nối-giữa-các-state)
- [12. Dependency Graph — Terraform Biết Thứ Tự Làm Gì](#12-dependency-graph--terraform-biết-thứ-tự-làm-gì)
  - [12.1. Implicit Dependency (Phụ thuộc ngầm)](#121-implicit-dependency-phụ-thuộc-ngầm)
  - [12.2. Parallel Execution (Thực thi song song)](#122-parallel-execution-thực-thi-song-song)
  - [12.3. Explicit Dependency (`depends_on`)](#123-explicit-dependency-depends_on)
- [13. Module — Tái Sử Dụng Cấu Hình](#13-module--tái-sử-dụng-cấu-hình)
  - [13.1. Tại Sao Cần Module?](#131-tại-sao-cần-module)
  - [13.2. Cấu Trúc Của Một Module](#132-cấu-trúc-của-một-module)
  - [13.3. Gọi Module Từ Root Module](#133-gọi-module-từ-root-module)
  - [13.4. Các Nguồn (Source) Của Module](#134-các-nguồn-source-của-module)
- [14. Meta-Arguments — `count`, `for_each`, `depends_on`](#14-meta-arguments--count-for_each-depends_on)
  - [14.1. `count` — Tạo Nhiều Bản Sao Theo Số Lượng](#141-count--tạo-nhiều-bản-sao-theo-số-lượng)
  - [14.2. `for_each` — Tạo Nhiều Bản Sao Với Danh Tính Rõ Ràng](#142-for_each--tạo-nhiều-bản-sao-với-danh-tính-rõ-ràng)
  - [14.3. `depends_on` (Đã giải thích chi tiết ở phần 12.3)](#143-depends_on-đã-giải-thích-chi-tiết-ở-phần-123)
- [15. Workspace — Quản Lý Nhiều Môi Trường](#15-workspace--quản-lý-nhiều-môi-trường)
  - [15.1. Ưu và Nhược Điểm Của Workspace](#151-ưu-và-nhược-điểm-của-workspace)
  - [15.2. Giải Pháp Thay Thế Cho Production](#152-giải-pháp-thay-thế-cho-production)
- [16. Provisioner — Khi Nào Thực Sự Cần](#16-provisioner--khi-nào-thực-sự-cần)
  - [16.1. Tại Sao Provisioner Là "Giải Pháp Cuối Cùng"?](#161-tại-sao-provisioner-là-giải-pháp-cuối-cùng)
  - [16.2. Các Giải Pháp Thay Thế Tốt Hơn Provisioner](#162-các-giải-pháp-thay-thế-tốt-hơn-provisioner)
- [17. Import — Đưa Tài Nguyên Có Sẵn Vào Terraform](#17-import--đưa-tài-nguyên-có-sẵn-vào-terraform)
  - [17.1. Quy Trình Import Chuẩn (Sử Dụng `import` Block - TF \>= 1.5.0)](#171-quy-trình-import-chuẩn-sử-dụng-import-block---tf--150)
- [18. Terraform Trong Team — Quy Trình Thực Tế](#18-terraform-trong-team--quy-trình-thực-tế)
  - [18.1. Quy Trình GitOps cho Infrastructure](#181-quy-trình-gitops-cho-infrastructure)
  - [18.2. Phân Quyền và Bảo Mật](#182-phân-quyền-và-bảo-mật)
- [19. Các Sai Lầm Thường Gặp](#19-các-sai-lầm-thường-gặp)
- [20. Terraform Best Practices](#20-terraform-best-practices)
  - [📎 Tóm Tắt và Tài Liệu Tham Khảo](#-tóm-tắt-và-tài-liệu-tham-khảo)
    - [Tóm tắt các nguyên lý cốt lõi](#tóm-tắt-các-nguyên-lý-cốt-lõi)
    - [Tài Liệu Tham Khảo Chính Thức](#tài-liệu-tham-khảo-chính-thức)

---

# 1. Terraform Giải Quyết Vấn Đề Gì

## 1.1. Vấn Đề Trước Khi Có Terraform

Để hiểu giá trị của Terraform, chúng ta cần nhìn vào cách quản lý hạ tầng thủ công truyền thống. Hãy tưởng tượng một công ty đang vận hành ứng dụng của họ trên cloud. Khi cần một máy chủ mới, một kỹ sư (Engineer A) sẽ thực hiện các bước sau:

1. Mở trình duyệt, đăng nhập vào giao diện web (console) của nhà cung cấp cloud (AWS, Azure, GCP,...).
2. Điều hướng qua các menu để đến phần quản lý máy chủ ảo (ví dụ: EC2 trên AWS).
3. Nhấn nút "Launch Instance" hoặc "Create VM".
4. Điền vào một form dài với nhiều lựa chọn: loại máy chủ (CPU, RAM), hệ điều hành (AMI/Image), cấu hình mạng (VPC, Subnet), tường lửa (Security Group), tên máy, v.v.
5. Nhấn "Launch" và chờ máy chủ được tạo.
6. Ghi lại các bước vừa làm vào một file tài liệu (hoặc thường là không ghi lại gì cả).

Sáu tháng sau, một kỹ sư khác (Engineer B) cần tạo một máy chủ tương tự cho một dự án mới. Lúc này, vấn đề phát sinh:

- Engineer B không biết Engineer A đã cấu hình chính xác như thế nào.
- Engineer B phải đoán, hoặc hỏi Engineer A (nếu người đó còn nhớ, và còn làm việc ở công ty).
- Kết quả là Engineer B tạo ra một máy chủ "gần giống", nhưng có một vài khác biệt nhỏ (ví dụ: quên mở một cổng, chọn sai phiên bản hệ điều hành, cấu hình bảo mật không đồng nhất).

Một năm sau, công ty có 47 máy chủ đang chạy production. Không một máy chủ nào giống hệt máy nào. Mỗi máy là một "bông tuyết" (snowflake server) độc nhất vô nhị. Việc sửa lỗi, nâng cấp, hay mở rộng hệ thống trở thành cơn ác mộng vì không ai dám động vào bất cứ thứ gì, sợ làm hỏng cả hệ thống.

**Vấn đề cốt lõi:** Hạ tầng được tạo ra qua các **hành động** (click chuột, gõ lệnh) chứ không phải qua một **bản mô tả**. Hành động thì không để lại dấu vết rõ ràng, không thể kiểm tra (review), và quan trọng nhất là **không thể lặp lại một cách chính xác**.

## 1.2. Terraform Giải Quyết Vấn Đề Bằng Cách Nào

Terraform là một công cụ "Hạ tầng dưới dạng Mã" (Infrastructure as Code - IaC). Triết lý của nó rất đơn giản: thay vì thực hiện các hành động thủ công, bạn sẽ **mô tả** hạ tầng mong muốn của mình trong các file văn bản. Terraform sẽ đọc bản mô tả đó và tự động thực hiện mọi API call cần thiết để đạt được trạng thái đó.

```
Cách làm cũ (Imperative - Mệnh lệnh):
  "Nhấn vào đây, gõ lệnh kia, chờ 5 phút, rồi nhấn tiếp..."

Cách làm mới với Terraform (Declarative - Khai báo):
  Bạn viết vào một file tên là main.tf:
  "Tôi muốn có 3 máy chủ ảo, mỗi máy loại t3.medium,
   nằm trong mạng có địa chỉ 10.0.0.0/16, và mở cổng 443."

  Terraform nhận file này và tự động:
  1. Phân tích yêu cầu.
  2. So sánh với hạ tầng thực tế đang có (nếu có).
  3. Tính toán xem cần tạo mới, sửa, hay xóa những gì.
  4. Thực thi các lệnh gọi API đến cloud provider để thực hiện.
```

Đây gọi là mô hình **Declarative** (Khai báo). Bạn chỉ cần khai báo **trạng thái mong muốn cuối cùng** (desired state), còn việc phải làm những bước gì để đạt được trạng thái đó là việc của Terraform. Điều này hoàn toàn khác với việc viết một script bash tuần tự, nơi bạn phải tự định nghĩa từng bước một ("làm A, rồi làm B, rồi làm C").

## 1.3. Tại Sao Cách Tiếp Cận Này Mạnh Mẽ

Sức mạnh của IaC với Terraform đến từ khả năng áp dụng các quy trình phát triển phần mềm tiêu chuẩn vào việc quản lý hạ tầng.

- **Lịch sử thay đổi (Versioning):** Vì bản mô tả hạ tầng chỉ là các file văn bản, bạn có thể lưu chúng vào Git. Điều này có nghĩa là bạn có toàn bộ lịch sử thay đổi: ai đã sửa gì, sửa khi nào, và tại sao lại sửa (qua nội dung commit message).
- **Khả năng kiểm tra (Review):** Trước khi bất kỳ thay đổi nào được áp dụng vào production, bạn có thể tạo một Pull Request. Các thành viên khác trong nhóm sẽ xem xét, thảo luận và phê duyệt những thay đổi đó, giống như họ làm với code của ứng dụng.
- **Khả năng quay lại (Rollback):** Nếu một thay đổi gây ra lỗi, bạn có thể dễ dàng quay về một commit cũ trong Git và áp dụng lại hạ tầng ở trạng thái ổn định trước đó.
- **Nguồn sự thật duy nhất (Single Source of Truth):** File code không chỉ là hướng dẫn, nó chính là định nghĩa thực tế của hạ tầng. Không còn tình trạng "snowflake infrastructure". Mọi máy chủ mới được tạo ra từ cùng một đoạn code sẽ giống hệt nhau.
- **Tự động hóa hoàn toàn (Automation):** Toàn bộ quy trình từ lập kế hoạch thay đổi đến thực thi có thể được tích hợp vào một CI/CD pipeline, loại bỏ hoàn toàn sự can thiệp thủ công và nguy cơ sai sót của con người.

## 1.4. Terraform Không Phải Là Gì

Để tránh những hiểu lầm phổ biến, hãy làm rõ Terraform không phải là:

- **Công cụ quản lý cấu hình (Configuration Management):** Các công cụ như Ansible, Chef, Puppet được thiết kế để quản lý cấu hình **bên trong** một máy chủ đã tồn tại (cài đặt phần mềm, chỉnh sửa file, quản lý service). Terraform tập trung vào việc quản lý **sự tồn tại** của chính hạ tầng đó (tạo máy chủ, mạng, database). Một kiến trúc rất phổ biến là dùng Terraform để tạo máy chủ, sau đó dùng Ansible để cấu hình bên trong máy chủ đó. Chúng bổ trợ cho nhau, không thay thế nhau.
- **Công cụ dành riêng cho một nền tảng cloud:** Bản thân Terraform Core không biết gì về AWS, Azure hay GCP. Nó là một engine đa năng. Khả năng tương tác với từng nền tảng được thực hiện qua các **plugin** gọi là Provider. Điều này có nghĩa là bạn có thể dùng cùng một ngôn ngữ, cùng một quy trình làm việc để quản lý hạ tầng trên AWS, Kubernetes, GitHub, Datadog, Cloudflare, và hàng trăm dịch vụ khác.
- **Công cụ tự động hóa toàn bộ vòng đời ứng dụng:** Terraform quản lý lớp **hạ tầng** (tạo sân chơi). Việc **deploy code ứng dụng** lên hạ tầng đó (thả bóng vào sân) là một bước riêng biệt, thường được thực hiện bởi các công cụ CI/CD khác. Terraform tạo ra Kubernetes cluster, một pipeline khác sẽ deploy ứng dụng của bạn lên cluster đó.

---

# 2. Kiến Trúc Terraform — Cách Hoạt Động Bên Trong

Hiểu biết về kiến trúc bên trong giúp bạn không chỉ dùng Terraform một cách máy móc mà còn hiểu được tại sao nó hoạt động như vậy, từ đó dễ dàng debug khi có sự cố và đưa ra các quyết định thiết kế đúng đắn.

## 2.1. Hai Thành Phần Chính

Kiến trúc của Terraform được chia thành hai phần tách biệt một cách rõ ràng.

```
┌─────────────────────────────────────────────────────────────┐
│                    Terraform Core                            │
│  (Engine - Bộ não)                                          │
│  - Đọc và phân tích các file cấu hình .tf của bạn.           │
│  - Đọc file state (trạng thái hiện tại đã lưu).              │
│  - Xây dựng một "đồ thị phụ thuộc" (dependency graph)        │
│    giữa các tài nguyên.                                     │
│  - So sánh cấu hình mong muốn và state hiện tại để tạo ra    │
│    một kế hoạch thay đổi (plan).                             │
└────────────────────────┬────────────────────────────────────┘
                         │ Giao tiếp qua gRPC (giao thức RPC)
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │  Provider    │ │  Provider    │ │  Provider    │
   │  AWS         │ │  Kubernetes  │ │  GitHub      │
   │  (Plugin)    │ │  (Plugin)    │ │  (Plugin)    │
   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
          │                │                │
          ▼                ▼                ▼
     API của AWS      API của K8s      API của GitHub
```

- **Terraform Core:** Đây là engine cốt lõi, là "bộ não" của Terraform. Nhiệm vụ của Core là đọc hiểu ngôn ngữ HCL, quản lý state, và tính toán đồ thị phụ thuộc. **Điều quan trọng là Core không hề biết cách giao tiếp với AWS, Azure hay bất kỳ dịch vụ nào khác.** Nó hoàn toàn "mù" về các nền tảng cụ thể.
- **Provider:** Provider là các plugin nhị phân riêng biệt. Chúng đóng vai trò như một "cầu nối" hoặc "trình biên dịch", chuyển đổi các khai báo resource chung chung của bạn thành các lệnh gọi API cụ thể của một dịch vụ. Mỗi provider (AWS, GCP, Kubernetes,...) là một plugin độc lập, được phát triển và duy trì bởi HashiCorp hoặc chính cộng đồng.

**Ví dụ để hiểu rõ hơn:**
Khi bạn viết:

```hcl
resource "aws_instance" "web_server" {
  instance_type = "t3.medium"
}
```

Terraform Core không hiểu `aws_instance` là gì. Nó sẽ hỏi AWS Provider: "Tôi có một resource loại `aws_instance`, tên là `web_server`, với tham số `instance_type = "t3.medium"`. Làm ơn hãy kiểm tra xem nó đã tồn tại chưa, và nếu chưa, hãy cho tôi biết cần gọi những API gì để tạo ra nó." AWS Provider, với hiểu biết sâu sắc về AWS, sẽ thực hiện chính xác yêu cầu đó.

Sự phân tách này là lý do Terraform có thể hỗ trợ hàng nghìn dịch vụ. Để thêm một dịch vụ mới, chỉ cần viết một provider mới, không cần đụng chạm gì đến Terraform Core.

## 2.2. Hai Giai Đoạn Tách Biệt: Plan và Apply

Đây là một trong những tính năng thiết kế quan trọng và hữu ích nhất của Terraform, mang lại sự an toàn và khả năng dự đoán.

- **`terraform plan` (Lập kế hoạch - Chỉ phân tích):**
    1. Terraform đọc tất cả các file cấu hình `.tf` trong thư mục hiện tại để xác định "trạng thái mong muốn".
    2. Nó đọc file state (có thể là local hoặc remote) để biết "trạng thái thực tế đã biết".
    3. Nó làm mới state bằng cách yêu cầu các provider gọi API để lấy thông tin mới nhất của các tài nguyên đang quản lý.
    4. Nó so sánh "trạng thái mong muốn" với "trạng thái thực tế đã được làm mới".
    5. Cuối cùng, nó in ra màn hình một bản kế hoạch chi tiết về những gì nó **sẽ làm** (thêm, sửa, xóa) nếu bạn cho phép.
    6. **Quan trọng: `terraform plan` không hề thay đổi bất cứ thứ gì trên hạ tầng thực tế.**

- **`terraform apply` (Áp dụng thay đổi - Thực thi):**
    1. Về cơ bản, `apply` sẽ chạy lại `plan` một lần nữa.
    2. Nó hiển thị kế hoạch và yêu cầu bạn xác nhận bằng cách gõ `yes`.
    3. Sau khi có xác nhận, nó sẽ thực sự gọi các API cần thiết để tạo, sửa, hoặc xóa tài nguyên.
    4. Sau khi mọi thứ thành công, nó sẽ cập nhật file state để phản ánh trạng thái mới.

Sự tách biệt này cũng giống như lệnh `git diff` và `git commit`. Bạn xem trước sự thay đổi (`git diff`), kiểm tra kỹ lưỡng, rồi mới lưu lại (`git commit`). Việc xem trước `plan` trước khi `apply` là lớp bảo vệ quan trọng nhất để tránh những thảm họa do thay đổi nhầm lẫn gây ra.

---

# 3. HCL — Ngôn Ngữ Cấu Hình

HCL (HashiCorp Configuration Language) là ngôn ngữ mà bạn dùng để "nói chuyện" với Terraform. Nó được thiết kế để vừa dễ đọc, dễ viết cho con người, vừa dễ dàng cho máy tính phân tích và xử lý. Cú pháp của nó trực quan, dựa trên các khối (block) và cặp khóa-giá trị (key-value).

## 3.1. Cấu Trúc Block Cơ Bản

Mọi thứ trong Terraform đều được xây dựng xung quanh các block. Một block có cấu trúc tổng quát như sau:

```hcl
<block_type> "<label_1>" "<label_2>" {
  <argument_name> = <value>
  <nested_block> {
    <nested_argument> = <value>
  }
}
```

Hãy cùng mổ xẻ một ví dụ cụ thể và quan trọng nhất: block `resource`.

```hcl
resource "aws_instance" "my_web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name        = "Web Server"
    Environment = "Production"
  }
}
```

- **`resource`**: Đây là `block_type`. Nó nói với Terraform rằng chúng ta đang khai báo một tài nguyên hạ tầng cần quản lý.
- **`"aws_instance"`**: Đây là `label_1`, còn được gọi là **resource type**. Nó xác định chính xác loại tài nguyên của một provider cụ thể. `aws_instance` là tên mà AWS Provider dùng để chỉ một máy chủ ảo EC2.
- **`"my_web_server"`**: Đây là `label_2`, còn được gọi là **local name**. Đây là tên do **bạn tự đặt**, có ý nghĩa trong phạm vi module của bạn. Bạn sẽ dùng tên này để tham chiếu đến tài nguyên này ở những nơi khác trong code. Tên này không hề xuất hiện trên AWS.
- **`{ ... }`**: Phần body của block, chứa các **argument** (đối số) để cấu hình cho tài nguyên.
  - `ami` và `instance_type` là các argument bắt buộc của `aws_instance`.
  - `tags` là một nested block, cho phép bạn gán metadata cho tài nguyên dưới dạng key-value.

Để tham chiếu đến một thuộc tính của tài nguyên này ở chỗ khác, bạn dùng cú pháp:
`<resource_type>.<local_name>.<attribute>`
Ví dụ: `aws_instance.my_web_server.id` sẽ trả về ID thực tế của máy chủ EC2 sau khi nó được tạo.

## 3.2. Kiểu Dữ Liệu Trong HCL

HCL hỗ trợ các kiểu dữ liệu cơ bản và phức tạp, giúp bạn mô hình hóa cấu hình một cách chính xác.

```hcl
# String (Chuỗi ký tự)
name        = "my-server"
description = "Đây là máy chủ web chính"

# Number (Số)
port       = 443
cpu_cores  = 2.5

# Bool (Boolean - Đúng/Sai)
enabled   = true
backup    = false

# List (Danh sách) - Tương tự như mảng, thứ tự quan trọng
# Mỗi phần tử được xác định bởi vị trí của nó (bắt đầu từ 0)
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Map (Ánh xạ) - Tập hợp các cặp key-value, thứ tự không quan trọng
# Mỗi phần tử được xác định bởi key của nó
common_tags = {
  Project     = "Alpha"
  Environment = "Production"
  ManagedBy   = "Terraform"
}

# Set (Tập hợp) - Giống list nhưng không có thứ tự và các giá trị là duy nhất
# Rất hữu ích cho các cấu hình như security group rules
allowed_ports = toset([80, 443])

# null - Đại diện cho việc không có giá trị, khác với chuỗi rỗng "" hay số 0
# Thường dùng để bỏ qua một argument không bắt buộc
optional_field = null
```

## 3.3. Expressions — Biểu Thức Động

Sức mạnh thực sự của HCL đến từ khả năng sử dụng các biểu thức để tạo ra các giá trị động, thay vì chỉ dùng giá trị tĩnh.

```hcl
# 1. Tham chiếu đến thuộc tính của resource khác
# Đây là cách tạo ra dependency ngầm (implicit dependency)
resource "aws_instance" "web" {
  subnet_id = aws_subnet.public.id # Lấy thuộc tính 'id' của tài nguyên 'aws_subnet.public'
}

# 2. Sử dụng giá trị của variable
# Giúp code linh hoạt, có thể tái sử dụng cho nhiều môi trường
resource "aws_instance" "web" {
  instance_type = var.instance_type
}

# 3. String interpolation (Nội suy chuỗi)
# Cho phép chèn giá trị của biến hoặc biểu thức vào trong chuỗi
resource "aws_instance" "web" {
  tags = {
    Name = "web-server-${var.environment}" # Nếu var.environment = "staging", kết quả là "web-server-staging"
  }
}

# 4. Conditional expression (Biểu thức điều kiện - Ternary)
# Cho phép chọn giữa hai giá trị dựa trên một điều kiện boolean
resource "aws_instance" "web" {
  instance_type = var.environment == "production" ? "t3.large" : "t3.micro"
  # Cú pháp: <ĐIỀU KIỆN> ? <GIÁ TRỊ NẾU ĐÚNG> : <GIÁ TRỊ NẾU SAI>
}

# 5. Gọi các hàm built-in (Function calls)
# Terraform cung cấp rất nhiều hàm có sẵn để xử lý chuỗi, số, list, map...
resource "aws_instance" "web" {
  tags = {
    Name = upper(var.environment) # Hàm upper() chuyển chuỗi thành chữ in hoa
  }
}
```

## 3.4. Comments — Chú Thích Code

Giải thích code của bạn là một thói quen cực kỳ tốt.

```hcl
# Đây là comment một dòng, thường dùng nhất

// Đây cũng là comment một dòng, ít phổ biến hơn

/*
  Đây là comment nhiều dòng.
  Dùng khi bạn cần giải thích một logic phức tạp
  hoặc một đoạn cấu hình dài.
*/
```

---

# 4. Provider — Cầu Nối Đến Hạ Tầng Thực

Provider là thành phần giúp Terraform "đa ngôn ngữ". Nó là plugin dịch các khai báo HCL của bạn thành các lệnh gọi API đặc thù cho từng nền tảng (AWS, Azure, GCP, Kubernetes, v.v.). Bạn không thể làm gì nếu không có provider.

## 4.1. Khai Báo Provider

Để sử dụng một provider, bạn cần khai báo nó trong một block `terraform {}` đặc biệt, thường đặt trong file `versions.tf`.

```hcl
terraform {
  required_version = ">= 1.6.0" # Đảm bảo mọi người dùng phiên bản Terraform CLI từ 1.6.0 trở lên

  required_providers {
    # Khai báo AWS Provider
    aws = {
      source  = "hashicorp/aws"   # Địa chỉ provider trên Terraform Registry
      version = "~> 5.0"           # Ràng buộc phiên bản (xem giải thích bên dưới)
    }
    # Khai báo Kubernetes Provider
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
  }
}

# Cấu hình cụ thể cho provider (khu vực, credentials...)
# Phần này thường được đặt trong file providers.tf
provider "aws" {
  region = "ap-southeast-1" # Chọn khu vực Singapore
  # Cách tốt nhất để cấp quyền là KHÔNG hard-code ở đây,
  # mà thông qua biến môi trường ($AWS_ACCESS_KEY_ID, $AWS_SECRET_ACCESS_KEY)
  # hoặc file credentials dùng chung.
}
```

## 4.2. Version Constraints — Tại Sao Phải Ghim Phiên Bản?

Đây là một thực hành bắt buộc. Việc không ghim phiên bản provider có thể dẫn đến tình huống code đang chạy ngon lành hôm nay, ngày mai tự nhiên lỗi vì provider tự động cập nhật lên phiên bản mới có breaking change.

```hcl
# Các loại ràng buộc phiên bản:
version = "= 5.31.0"   # Chính xác phiên bản 5.31.0
version = "~> 5.31"    # Lớn hơn hoặc bằng 5.31.0 và nhỏ hơn 5.32.0 (chỉ cho phép thay đổi bản vá - patch)
version = "~> 5.0"     # Lớn hơn hoặc bằng 5.0.0 và nhỏ hơn 6.0.0 (cho phép thay đổi bản phụ - minor)
version = ">= 5.0, < 6.0" # Tương tự như trên nhưng viết tường minh hơn
```

**Nguyên tắc vàng:** Luôn commit file `.terraform.lock.hcl` (được tạo bởi `terraform init`) vào Git. File này ghi lại chính xác version và checksum của các provider đã tải về, đảm bảo mọi thành viên trong team và cả CI/CD pipeline đều dùng cùng một phiên bản provider y hệt nhau. Nó giống như `package-lock.json` trong thế giới Node.js.

## 4.3. Provider Alias — Dùng Nhiều Cấu Hình Cho Cùng Một Provider

Trong thực tế, bạn thường cần tương tác với cùng một provider nhưng ở các khu vực (region) hoặc tài khoản (account) khác nhau. Provider alias cho phép bạn làm điều này.

```hcl
# Khai báo AWS Provider cho region Singapore với alias là "singapore"
provider "aws" {
  region = "ap-southeast-1"
  alias  = "singapore"
}

# Khai báo một instance khác của AWS Provider cho region Bắc Virginia
provider "aws" {
  region = "us-east-1"
  alias  = "virginia"
}

# Khi tạo resource, bạn chỉ định nó sẽ dùng provider nào qua tham số `provider`
resource "aws_instance" "asia_server" {
  provider = aws.singapore # Sử dụng provider có alias "singapore"
  ami           = "ami-xxx"
  instance_type = "t3.micro"
}

resource "aws_instance" "us_server" {
  provider = aws.virginia # Sử dụng provider có alias "virginia"
  ami           = "ami-yyy"
  instance_type = "t3.micro"
}
```

---

# 5. Resource — Đơn Vị Cơ Bản Nhất

`resource` là khối xây dựng nền tảng và quan trọng nhất trong Terraform. Mỗi block `resource` đại diện cho một "vật thể" hạ tầng cụ thể mà bạn muốn quản lý: một máy chủ ảo, một mạng con, một bản ghi DNS, một database, hay thậm chí là một repository trên GitHub.

## 5.1. Giải Phẫu Của Một Resource

Cấu trúc của một resource block đã được đề cập ở phần HCL, nhưng hãy nhấn mạnh lại ý nghĩa của nó.

```hcl
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0" # Argument: Image ID của máy ảo
  instance_type = "t3.micro"            # Argument: Loại phần cứng

  tags = {                              # Nested Block: Gán nhãn cho máy ảo
    Name = "My Main Web Server"
  }
}
```

- **`"aws_instance"` (Resource Type):** Là định danh của loại tài nguyên, do provider định nghĩa. Mỗi provider có hàng trăm loại resource khác nhau, luôn bắt đầu bằng tiền tố của provider (vd: `aws_`, `google_`, `azurerm_`).
- **`"web_server"` (Local Name):** Là tên do bạn tự đặt, có ý nghĩa duy nhất trong module của bạn. Bạn sẽ dùng nó để tham chiếu đến resource này ở chỗ khác. Nó không liên quan gì đến tên thực tế của máy ảo trên AWS.
- **Arguments vs. Computed Attributes:**
  - **Arguments (Đối số):** Là những giá trị bạn **thiết lập** để định nghĩa trạng thái mong muốn (`ami`, `instance_type`, `tags`...).
  - **Computed Attributes (Thuộc tính được tính toán):** Là những giá trị được provider trả về **sau khi** tài nguyên đã được tạo. Bạn không thể thiết lập chúng. Ví dụ: `id` (định danh duy nhất), `private_ip` (địa chỉ IP nội bộ), `arn` (Amazon Resource Name). Bạn chỉ có thể đọc chúng.

```hcl
# Ví dụ về việc sử dụng ComputedAttribute ở nơi khác trong code:
output "server_public_ip" {
  value = aws_instance.web_server.public_ip
}
#'public_ip' là một Computed Attribute, chỉ tồn tại sau khi máy ảo được tạo.
```

## 5.2. Vòng Đời Của Một Resource (CRUD)

Terraform quản lý vòng đời của một resource từ khi nó được sinh ra cho đến khi bị hủy bỏ.

1. **Create (Tạo mới):**
    - Lần đầu tiên bạn chạy `terraform apply`, Terraform thấy resource `web_server` trong code nhưng không có trong file state.
    - Nó gọi API `CreateInstance` của AWS để tạo một máy ảo EC2 mới với các đối số bạn đã cung cấp.
    - Sau khi tạo thành công, nó lưu tất cả thông tin của máy ảo (bao gồm cả ID mới và các computed attributes) vào file state.

2. **Update (Cập nhật tại chỗ - In-place Update):**
    - Bạn sửa `instance_type` từ `"t3.micro"` thành `"t3.small"` trong code và chạy `terraform apply` lại.
    - Terraform nhận thấy sự khác biệt giữa code (mong muốn) và state (thực tế).
    - Nó kiểm tra với AWS Provider và biết rằng có thể thay đổi `instance_type` mà không cần phá hủy máy ảo. Nó gọi API `ModifyInstanceAttribute` của AWS.
    - Sau khi cập nhật thành công, nó sửa thông tin `instance_type` trong file state.

3. **Replace (Phá hủy và Tạo mới - Destroy then Create):**
    - Bạn sửa `ami` (Image ID) sang một phiên bản hệ điều hành mới.
    - Terraform kiểm tra và biết rằng AWS không cho phép thay đổi AMI của một máy ảo đang chạy. Cách duy nhất là phá hủy máy ảo cũ và tạo một máy ảo mới.
    - Trong kế hoạch `plan`, bạn sẽ thấy ký hiệu `-/+` ở đầu dòng resource đó, nghĩa là "phá hủy cái này, rồi tạo cái mới".
    - **Đây là lý do tối quan trọng bạn phải đọc kỹ `terraform plan`.** Một thay đổi tưởng chừng nhỏ (đổi AMI) có thể dẫn đến việc xóa toàn bộ máy chủ production và tạo lại, gây mất dữ liệu nếu bạn chưa backup.

4. **Delete (Xóa bỏ):**
    - Bạn xóa toàn bộ block `resource "aws_instance" "web_server"` khỏi code, hoặc chạy lệnh `terraform destroy`.
    - Terraform thấy resource còn trong state nhưng không còn trong code. Nó hiểu rằng bạn muốn xóa tài nguyên này.
    - Nó gọi API `TerminateInstances` của AWS để xóa máy ảo, và sau đó xóa thông tin của nó khỏi file state.

## 5.3. `lifecycle` Block — Kiểm Soát Đặc Biệt Vòng Đời

Có những tình huống bạn cần can thiệp vào hành vi mặc định của vòng đời. Meta-argument `lifecycle` cho phép bạn làm điều đó.

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  lifecycle {
    # 1. Tạo mới trước khi phá hủy (cho trường hợp Replace)
    # Hữu ích để tránh downtime. Terraform sẽ tạo máy ảo mới,
    # chờ nó sẵn sàng, rồi mới phá hủy máy ảo cũ.
    create_before_destroy = true

    # 2. Ngăn chặn việc vô tình phá hủy tài nguyên quan trọng
    # Nếu ai đó cố tình xóa resource này khỏi code hoặc chạy destroy,
    # Terraform sẽ báo lỗi và dừng lại ngay lập tức.
    # Dùng cho database, dữ liệu quan trọng.
    prevent_destroy = true

    # 3. Bỏ qua sự thay đổi của một số thuộc tính nhất định
    # Ví dụ: tag "LastModifiedBy" được một hệ thống tự động khác cập nhật.
    # Bạn không muốn Terraform coi đó là "sai lệch" (drift) và
    # liên tục ghi đè hoặc báo có thay đổi trong mỗi lần plan.
    ignore_changes = [
      tags["LastModifiedBy"],
      # Thường dùng để bỏ qua các thay đổi do external system gây ra
    ]
  }
}


Attribute ở nơi khác trong code:
output "server_public_ip" {
  value = aws_instance.web_server.public_ip
  # 'public_ip' là một Computed Attribute, chỉ tồn tại sau khi máy ảo được tạo.
}
```

## 5.2. Vòng Đời Của Một Resource (CRUD)

Terraform quản lý vòng đời của một resource từ khi nó được sinh ra cho đến khi bị hủy bỏ.

1. **Create (Tạo mới):**
    - Lần đầu tiên bạn chạy `terraform apply`, Terraform thấy resource `web_server` trong code nhưng không có trong file state.
    - Nó gọi API `CreateInstance` của AWS để tạo một máy ảo EC2 mới với các đối số bạn đã cung cấp.
    - Sau khi tạo thành công, nó lưu tất cả thông tin của máy ảo (bao gồm cả ID mới và các computed attributes) vào file state.

2. **Update (Cập nhật tại chỗ - In-place Update):**
    - Bạn sửa `instance_type` từ `"t3.micro"` thành `"t3.small"` trong code và chạy `terraform apply` lại.
    - Terraform nhận thấy sự khác biệt giữa code (mong muốn) và state (thực tế).
    - Nó kiểm tra với AWS Provider và biết rằng có thể thay đổi `instance_type` mà không cần phá hủy máy ảo. Nó gọi API `ModifyInstanceAttribute` của AWS.
    - Sau khi cập nhật thành công, nó sửa thông tin `instance_type` trong file state.

3. **Replace (Phá hủy và Tạo mới - Destroy then Create):**
    - Bạn sửa `ami` (Image ID) sang một phiên bản hệ điều hành mới.
    - Terraform kiểm tra và biết rằng AWS không cho phép thay đổi AMI của một máy ảo đang chạy. Cách duy nhất là phá hủy máy ảo cũ và tạo một máy ảo mới.
    - Trong kế hoạch `plan`, bạn sẽ thấy ký hiệu `-/+` ở đầu dòng resource đó, nghĩa là "phá hủy cái này, rồi tạo cái mới".
    - **Đây là lý do tối quan trọng bạn phải đọc kỹ `terraform plan`.** Một thay đổi tưởng chừng nhỏ (đổi AMI) có thể dẫn đến việc xóa toàn bộ máy chủ production và tạo lại, gây mất dữ liệu nếu bạn chưa backup.

4. **Delete (Xóa bỏ):**
    - Bạn xóa toàn bộ block `resource "aws_instance" "web_server"` khỏi code, hoặc chạy lệnh `terraform destroy`.
    - Terraform thấy resource còn trong state nhưng không còn trong code. Nó hiểu rằng bạn muốn xóa tài nguyên này.
    - Nó gọi API `TerminateInstances` của AWS để xóa máy ảo, và sau đó xóa thông tin của nó khỏi file state.

## 5.3. `lifecycle` Block — Kiểm Soát Đặc Biệt Vòng Đời

Có những tình huống bạn cần can thiệp vào hành vi mặc định của vòng đời. Meta-argument `lifecycle` cho phép bạn làm điều đó.

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  lifecycle {
    # 1. Tạo mới trước khi phá hủy (cho trường hợp Replace)
    # Hữu ích để tránh downtime. Terraform sẽ tạo máy ảo mới,
    # chờ nó sẵn sàng, rồi mới phá hủy máy ảo cũ.
    create_before_destroy = true

    # 2. Ngăn chặn việc vô tình phá hủy tài nguyên quan trọng
    # Nếu ai đó cố tình xóa resource này khỏi code hoặc chạy destroy,
    # Terraform sẽ báo lỗi và dừng lại ngay lập tức.
    # Dùng cho database, dữ liệu quan trọng.
    prevent_destroy = true

    # 3. Bỏ qua sự thay đổi của một số thuộc tính nhất định
    # Ví dụ: tag "LastModifiedBy" được một hệ thống tự động khác cập nhật.
    # Bạn không muốn Terraform coi đó là "sai lệch" (drift) và
    # liên tục ghi đè hoặc báo có thay đổi trong mỗi lần plan.
    ignore_changes = [
      tags["LastModifiedBy"],
      # Thường dùng để bỏ qua các thay đổi do external system gây ra
    ]
  }
}
```

---

# 6. State — Trái Tim Của Terraform

Nếu không hiểu về state, bạn sẽ không thực sự hiểu Terraform. File state là thành phần quan trọng nhất, đóng vai trò như bộ não lưu trữ mọi ký ức của Terraform về hạ tầng nó đang quản lý.

## 6.1. State Là Gì Và Tại Sao Nó Tối Quan Trọng?

File state (mặc định là `terraform.tfstate`) là một file JSON ghi lại ánh xạ giữa các resource bạn khai báo trong code `.tf` và các đối tượng thực tế đang tồn tại trên thế giới bên ngoài (ví dụ: trên AWS).

**Tại sao cần state?**
Hãy tưởng tượng bạn có một team 5 người cùng quản lý hạ tầng. Nếu không có state, mỗi khi bạn chạy `terraform apply`, Terraform sẽ không biết resource `web_server` trong code của bạn tương ứng với máy ảo EC2 nào trong số hàng trăm máy ảo đang chạy. Nó có thể sẽ tạo ra một máy ảo mới mỗi lần bạn chạy lệnh, hoặc không thể biết máy ảo nào cần sửa, cần xóa.

**State giải quyết vấn đề này bằng cách:**

- **Lưu trữ ID:** Nó ghi nhớ ID thực tế của mọi tài nguyên mà nó đã tạo (vd: `i-0abc123def456789`). Nhờ đó, lần sau nó biết chính xác cần gọi API nào để cập nhật hay xóa.
- **Lưu trữ toàn bộ thuộc tính:** Nó lưu một bản sao của tất cả các thuộc tính của tài nguyên. Khi bạn chạy `plan`, Terraform so sánh cấu hình mong muốn trong code với bản sao trong state để tìm ra sự khác biệt.
- **Tăng hiệu năng:** Đối với hạ tầng lớn, việc gọi API để lấy thông tin của mọi tài nguyên mỗi lần chạy `plan` là rất chậm. State hoạt động như một bộ nhớ cache cục bộ, giúp quá trình này nhanh hơn rất nhiều. Terraform chỉ cần làm mới (refresh) state bằng cách gọi API, nhưng việc tính toán sự khác biệt thì dựa trên dữ liệu đã có trong state.

**Ví dụ cấu trúc state file:**

```json
{
  "version": 4,
  "terraform_version": "1.7.0",
  "resources": [
    {
      "type": "aws_instance",
      "name": "web_server",
      "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
      "instances": [
        {
          "attributes": {
            "id": "i-0abc123def456789",
            "instance_type": "t3.medium",
            "private_ip": "10.0.1.15",
            "public_ip": "54.123.45.67",
            "tags": {
              "Name": "My Main Web Server"
            }
          }
        }
      ]
    }
  ]
}
```

Như bạn thấy, state không chỉ lưu những gì bạn viết trong code (`instance_type`, `tags`), mà còn lưu cả những thông tin bạn không hề định nghĩa như `id` hay `public_ip`.

## 6.2. Refresh — Đồng Bộ State Với Thực Tế

Trước mỗi lần chạy `terraform plan` hoặc `apply`, Terraform thực hiện một bước gọi là **refresh**. Trong bước này, nó sử dụng provider để gọi API thực tế và kiểm tra trạng thái của từng tài nguyên có trong state.

**Mục đích của refresh là để phát hiện "Configuration Drift":**
Drift xảy ra khi có ai đó thay đổi hạ tầng thủ công bên ngoài Terraform (ví dụ: một admin SSH vào máy chủ và sửa cấu hình, hoặc dùng AWS Console để thay đổi Security Group). Lúc này, trạng thái thực tế đã khác với những gì được lưu trong state. Refresh giúp Terraform cập nhật state để khớp với thực tế. Nhờ đó, ở bước `plan` tiếp theo, Terraform sẽ phát hiện ra sự khác biệt và đề xuất sửa hạ tầng thực tế về đúng với cấu hình trong code của bạn.

## 6.3. Tại Sao Không Bao Giờ Sửa State File Bằng Tay?

- **Nguy cơ hỏng dữ liệu:** State file là một file JSON có cấu trúc chặt chẽ. Chỉ một lỗi nhỏ như thừa dấu phẩy cũng có thể khiến toàn bộ file không đọc được, và Terraform sẽ mất khả năng quản lý mọi tài nguyên.
- **Chứa dữ liệu nhạy cảm:** State file có thể chứa mật khẩu database, private key, hoặc bất kỳ secret nào bạn đặt làm argument cho resource. Do đó, state file **phải được bảo vệ như một bí mật tối mật**. Tuyệt đối không được commit file `terraform.tfstate` lên Git (trừ khi bạn dùng backend hỗ trợ mã hóa như S3 và có cấu hình riêng).

Nếu cần chỉnh sửa state (ví dụ: đổi tên resource, di chuyển resource sang module khác), bạn phải dùng các lệnh chuyên dụng của Terraform CLI:

- `terraform state mv`: Di chuyển một resource trong state (đổi tên, đổi địa chỉ).
- `terraform state rm`: Xóa một resource khỏi state mà không phá hủy tài nguyên thực tế.
- `terraform import`: Đưa một tài nguyên có sẵn vào state.
- `terraform state list`: Liệt kê tất cả resource trong state.
- `terraform state show <địa chỉ>`: Xem chi tiết thuộc tính của một resource trong state.

---

# 7. Remote State và State Locking

Đây là hai khái niệm nâng tầm Terraform từ một công cụ cá nhân thành một công cụ cho cả team.

## 7.1. Vấn Đề Với Local State

Khi làm việc một mình, việc lưu state ở máy cá nhân (`terraform.tfstate`) là chấp nhận được. Nhưng khi làm việc nhóm, mô hình này sụp đổ hoàn toàn.

- **Xung đột dữ liệu:** Kỹ sư A chạy `apply` và cập nhật state trên máy mình. Kỹ sư B, với một bản state cũ hơn trên máy, cũng chạy `apply`. Terraform của B không biết về những thay đổi của A. Kết quả là B có thể ghi đè lên thay đổi của A, tạo ra tài nguyên trùng lặp, hoặc gây ra những lỗi không thể đoán trước.
- **Rủi ro mất mát:** State file nằm trên laptop cá nhân. Nếu laptop bị hỏng hoặc mất, bạn sẽ mất toàn bộ khả năng quản lý hạ tầng bằng Terraform. Bạn vẫn có thể dùng `import` để lấy lại, nhưng đó là một quá trình thủ công, tốn thời gian và dễ sai sót.

## 7.2. Remote State — Lưu Trữ Tập Trung Và An Toàn

Giải pháp là lưu state file vào một vị trí tập trung, có độ bền cao và bảo mật mà tất cả thành viên trong team đều có thể truy cập. Đây được gọi là **Remote State**. Terraform sử dụng khái niệm **Backend** để cấu hình nơi lưu trữ state.

```hcl
# Ví dụ: Cấu hình backend là Amazon S3
terraform {
  backend "s3" {
    bucket         = "my-company-terraform-state" # Tên S3 bucket
    key            = "production/networking/terraform.tfstate" # Đường dẫn đến file state trong bucket
    region         = "ap-southeast-1"
    encrypt        = true                        # Bật mã hóa dữ liệu ở phía server
    dynamodb_table = "terraform-state-lock"      # Tên bảng DynamoDB dùng cho State Locking
  }
}
```

**Lợi ích của Remote State:**

- **Nguồn sự thật duy nhất:** Mọi người đều đọc và ghi vào cùng một file state, đảm bảo tính nhất quán.
- **Bảo mật:** Hầu hết các backend (S3, GCS, Azure Storage) đều hỗ trợ mã hóa dữ liệu khi lưu trữ (encryption at rest) và trong quá trình truyền tải (encryption in transit).
- **Độ bền cao:** State được lưu trên các dịch vụ lưu trữ có độ sẵn sàng và độ bền rất cao (99.999999999%).
- **Versioning:** Khi bật versioning trên S3 bucket, mỗi lần state được cập nhật, một phiên bản mới sẽ được lưu lại. Nếu chẳng may state bị hỏng, bạn có thể dễ dàng khôi phục lại một phiên bản cũ.

## 7.3. State Locking — Tránh Xung Đột Đồng Thời

Khi đã có remote state, vẫn còn một vấn đề nan giải: chuyện gì xảy ra nếu hai người cùng chạy `terraform apply` một lúc?

- Cả hai cùng đọc state phiên bản 1.
- Người A thực hiện thay đổi và ghi lại thành phiên bản 2.
- Người B cũng thực hiện thay đổi và ghi đè lên, tạo ra phiên bản 3.
- Thay đổi của người A đã bị "nuốt" mất một cách âm thầm.

**State Locking** ngăn chặn kịch bản này. Cơ chế hoạt động như sau:

1. Khi một tiến trình `terraform apply` bắt đầu, nó sẽ cố gắng tạo một "khóa" (lock) trên state. Trong ví dụ S3 ở trên, khóa này được lưu trong một bảng DynamoDB.
2. Nếu một tiến trình khác cũng cố gắng `apply`, nó sẽ thấy state đã bị khóa và ngay lập tức bị từ chối với một thông báo lỗi rõ ràng (không phải lỗi âm thầm). Tiến trình thứ hai phải chờ cho đến khi tiến trình thứ nhất hoàn thành và tự động giải phóng khóa.
3. Điều này đảm bảo tại một thời điểm, chỉ có một người duy nhất có thể thay đổi hạ tầng, loại bỏ hoàn toàn nguy cơ xung đột.

**Quan trọng:** Nếu tiến trình `terraform apply` bị crash hoặc bị kill giữa chừng, khóa có thể không được giải phóng. Lúc này, bạn cần dùng lệnh `terraform force-unlock <lock-id>` để mở khóa thủ công. **Phải cực kỳ chắc chắn rằng không có tiến trình apply nào khác đang thực sự chạy** trước khi force-unlock.

## 7.4. Tổ Chức State — Một State Lớn Hay Nhiều State Nhỏ?

Đây là một câu hỏi thiết kế quan trọng. Không có câu trả lời đúng tuyệt đối, nhưng có những mô hình phổ biến.

- **Mô hình 1: Monolithic State (Tệp state khổng lồ)**
  - **Mô tả:** Tất cả hạ tầng của bạn (networking, databases, applications) được quản lý trong cùng một thư mục và có chung một file state.
  - **Ưu điểm:** Đơn giản, dễ bắt đầu. Mọi dependency giữa các resource đều có thể được giải quyết dễ dàng.
  - **Nhược điểm:** Rất chậm khi hạ tầng lớn. Rủi ro cao (một lỗi nhỏ có thể ảnh hưởng đến toàn bộ hệ thống). Thường xuyên bị lock conflict khi team đông người.

- **Mô hình 2: Micro States (Chia nhỏ state)**
  - **Mô tả:** Chia hạ tầng thành các state nhỏ, độc lập dựa trên chức năng hoặc team sở hữu.
  - **Ví dụ:**
    - `production/networking/terraform.tfstate` (VPC, Subnets, Routes)
    - `production/database/terraform.tfstate` (RDS instances)
    - `production/application-a/terraform.tfstate` (App servers, Load Balancer của service A)
  - **Ưu điểm:** Mỗi state nhỏ, apply nhanh. Team khác nhau quản lý state khác nhau, giảm thiểu xung đột. Lỗi ở layer networking sẽ không làm hỏng database.
  - **Nhược điểm:** Phức tạp hơn khi cần chia sẻ thông tin giữa các state (ví dụ: ứng dụng cần biết VPC ID từ state networking). Cần dùng Data Source `terraform_remote_state` để giải quyết việc này.

**Lời khuyên cho production:** Hầu hết các tổ chức trưởng thành đều áp dụng mô hình Micro States, chia theo nguyên tắc "blast radius" (bán kính ảnh hưởng). Những thành phần càng quan trọng, càng nên được tách biệt để giảm thiểu rủi ro khi có thay đổi.

---

# 8. Vòng Đời Lệnh Terraform

Hiểu rõ từng lệnh và mục đích của nó giúp bạn làm việc với Terraform một cách tự tin và hiệu quả.

## 8.1. Các Lệnh Cốt Lõi

Chuỗi lệnh bạn sẽ chạy hàng ngày:

1. **`terraform init` (Khởi tạo):**
    - **Mục đích:** Chuẩn bị một thư mục làm việc cho Terraform.
    - **Khi nào cần chạy:** Lần đầu tiên trong một dự án; sau khi thêm/chỉnh sửa `required_providers` hoặc `backend`; sau khi pull code mới về có thêm module.
    - **Thực hiện:** Tải provider plugins về thư mục `.terraform/`; cấu hình backend (kết nối đến remote state); tải source code của module; tạo file `.terraform.lock.hcl`.

2. **`terraform fmt` (Định dạng code):**
    - **Mục đích:** Tự động định dạng lại code HCL theo chuẩn chính thức.
    - **Cách dùng:** `terraform fmt -recursive` (định dạng tất cả file `.tf` trong thư mục hiện tại và các thư mục con). Nên chạy trước mỗi lần commit.

3. **`terraform validate` (Kiểm tra cú pháp):**
    - **Mục đích:** Kiểm tra xem cấu hình HCL có đúng cú pháp và logic nội bộ không (ví dụ: tham chiếu đến resource không tồn tại, sai kiểu dữ liệu của variable...).
    - **Khác với `plan`:** `validate` chỉ kiểm tra code, không kết nối đến bất kỳ provider hay backend nào, do đó chạy rất nhanh. Đây là bước kiểm tra tĩnh đầu tiên.

4. **`terraform plan` (Lập kế hoạch - Dry Run):**
    - **Mục đích:** Tính toán và hiển thị những thay đổi Terraform sẽ thực hiện để đạt được trạng thái mong muốn. **Đây là bước quan trọng nhất, không bao giờ được bỏ qua.**
    - **Cách dùng:**
        - `terraform plan`: Chạy plan và in kết quả ra màn hình.
        - `terraform plan -out=tfplan`: Lưu kế hoạch vào một file nhị phân tên là `tfplan`.

5. **`terraform apply` (Áp dụng thay đổi):**
    - **Mục đích:** Thực thi những thay đổi đã được lên kế hoạch.
    - **Cách dùng:**
        - `terraform apply`: Chạy lại plan, hiển thị kết quả, yêu cầu xác nhận `yes`.
        - `terraform apply tfplan`: Áp dụng chính xác kế hoạch đã lưu trong file `tfplan`. **Đây là cách an toàn nhất** vì nó đảm bảo bạn apply đúng những gì đã được review, không bị ảnh hưởng bởi bất kỳ thay đổi nào xảy ra giữa lúc plan và apply.

6. **`terraform destroy` (Phá hủy):**
    - **Mục đích:** Xóa tất cả tài nguyên được quản lý bởi state hiện tại. Dùng để dọn dẹp môi trường dev/staging. Cực kỳ nguy hiểm với production.

7. **`terraform show` (Xem trạng thái):**
    - **Mục đích:** Hiển thị state hiện tại hoặc một file plan một cách dễ đọc.

8. **`terraform output` (Xem output):**
    - **Mục đích:** In ra giá trị của các biến output đã định nghĩa. Rất hữu ích để lấy thông tin (IP, URL) sau khi apply hoặc cho script khác sử dụng (`terraform output -json`).

## 8.2. Đọc Output Của `terraform plan` Như Một Chuyên Gia

Dòng đầu tiên của mỗi resource trong plan cho bạn biết hành động sẽ xảy ra:

| Ký hiệu | Ý nghĩa                                                                    | Mức độ nguy hiểm |
| :------ | :------------------------------------------------------------------------- | :--------------- |
| `+`     | **Create:** Tạo mới tài nguyên.                                            | Thấp             |
| `-`     | **Destroy:** Xóa tài nguyên.                                               | **Rất Cao**      |
| `~`     | **Update in-place:** Cập nhật tài nguyên tại chỗ, không cần tạo lại.       | Trung bình       |
| `-/+`   | **Replace (Destroy then Create):** Phá hủy tài nguyên cũ và tạo tài nguyên mới. | **Cao**          |

**Ví dụ thực tế:**

```text
Terraform will perform the following actions:

  # aws_instance.web_server will be updated in-place
  ~ resource "aws_instance" "web_server" {
        id            = "i-0abc123"
      ~ instance_type = "t3.micro" -> "t3.medium" # Thay đổi không gây nguy hiểm
        tags          = {
            "Name" = "web-server"
        }
    }

  # aws_security_group.old_group will be destroyed
  - resource "aws_security_group" "old_group" { # CẢNH BÁO ĐỎ: Một resource sẽ bị xóa
      - id   = "sg-0xyz789" -> null
        name = "old-sg"
    }

Plan: 0 to add, 1 to change, 1 to destroy.
```

Hãy tập trung vào dòng cuối cùng: `Plan: X to add, Y to change, Z to destroy.`
Nếu `Z` (destroy) lớn hơn 0 đối với các tài nguyên quan trọng (database, production server), hãy dừng lại ngay lập tức, kiểm tra lại code của bạn, và tìm hiểu lý do tại sao chúng lại bị xóa trước khi gõ `yes`.

---

# 9. Variables — Tham Số Hóa Cấu Hình

Variables (biến) giúp code Terraform của bạn trở nên linh hoạt, có thể tái sử dụng cho nhiều môi trường và team khác nhau mà không cần phải sửa code cứng.

## 9.1. Khai Báo Variable

Mỗi variable cần được khai báo với một khối `variable`. Nên khai báo trong file `variables.tf` để dễ quản lý.

```hcl
variable "instance_type" {
  description = "Loại EC2 instance dùng cho web server (vd: t3.micro, t3.medium)" # Mô tả giúp người khác hiểu biến này làm gì
  type        = string                                 # Kiểu dữ liệu của biến
  default     = "t3.micro"                             # Giá trị mặc định (nếu không được cung cấp)

  # Custom Validation - Kiểm tra giá trị đầu vào
  validation {
    condition     = contains(["t3.micro", "t3.small", "t3.medium"], var.instance_type)
    error_message = "ERROR: instance_type không hợp lệ. Chỉ chấp nhận: t3.micro, t3.small, t3.medium."
  }
}

variable "environment" {
  description = "Môi trường triển khai (dev, staging, prod)"
  type        = string
  # KHÔNG có 'default'. Điều này có nghĩa là biến này là bắt buộc.
  # Người dùng sẽ bị yêu cầu cung cấp giá trị khi chạy plan/apply.
}

variable "db_password" {
  description = "Mật khẩu cho database chính"
  type        = string
  sensitive   = true  # Che giấu giá trị này khỏi tất cả output trên console và log, tránh lộ bí mật.
}
```

## 9.2. Các Cách Cung Cấp Giá Trị Cho Variable

Terraform có một hệ thống phân cấp để xác định giá trị cuối cùng của một biến. Thứ tự ưu tiên từ thấp đến cao (giá trị sau sẽ ghi đè giá trị trước):

1. **Giá trị `default` trong khai báo `variable` (ưu tiên thấp nhất).**
2. **File `terraform.tfvars` hoặc `*.auto.tfvars` (tự động nạp).**

    ```hcl
    # File: terraform.tfvars
    environment   = "production"
    instance_type = "t3.medium"
    ```

3. **Biến môi trường (Environment Variables) với tiền tố `TF_VAR_`.**

    ```bash
    export TF_VAR_environment=staging
    export TF_VAR_db_password="supersecret"
    ```

4. **Truyền trực tiếp bằng flag `-var` trong câu lệnh (ưu tiên cao).**

    ```bash
    terraform apply -var="instance_type=t3.large"
    ```

5. **File biến được chỉ định bằng flag `-var-file` (ưu tiên cao nhất).**

    ```bash
    terraform apply -var-file="production.tfvars"
    ```

**Thực hành tốt nhất:** Tạo một thư mục `environments/` và đặt các file `.tfvars` cho từng môi trường vào đó (vd: `environments/dev.tfvars`, `environments/prod.tfvars`). Khi chạy, bạn chỉ cần chỉ định file tương ứng.

## 9.3. Type Constraints — Kiểm Tra Kiểu Dữ Liệu Nâng Cao

```hcl
# Kiểu cơ bản
variable "simple_string" { type = string }
variable "simple_number" { type = number }
variable "simple_bool"   { type = bool }

# Kiểu tập hợp (Collection Types)
variable "list_of_strings" { type = list(string) } # ["a", "b", "c"]
variable "map_of_numbers"  { type = map(number) }  # { key1 = 1, key2 = 2 }

# Kiểu cấu trúc (Structural Types)
variable "server_config" {
  description = "Cấu hình chi tiết cho một server"
  type = object({
    name          = string
    instance_type = string
    disk_size_gb  = number
    enable_backup = optional(bool, false) # Thuộc tính không bắt buộc, mặc định là false
  })
}
# Cách dùng trong .tfvars:
# server_config = {
#   name          = "web-1"
#   instance_type = "t3.medium"
#   disk_size_gb  = 50
#   # enable_backup được phép bỏ qua
# }
```

---

# 10. Output — Lấy Giá Trị Ra Ngoài

Output giống như "giá trị trả về" của một hàm hoặc một module. Nó cho phép bạn trích xuất các thông tin hữu ích từ hạ tầng vừa tạo để dùng cho các mục đích khác.

## 10.1. Khai Báo và Sử Dụng Output

```hcl
output "instance_public_ip" {
  description = "Địa chỉ IP công cộng để SSH vào web server"
  value       = aws_instance.web_server.public_ip
}

output "database_endpoint" {
  description = "Địa chỉ endpoint để kết nối đến database"
  value       = aws_db_instance.main.endpoint
  sensitive   = true # Ẩn giá trị này khỏi console, tránh bị lộ
}
```

Sau khi `terraform apply`, các output không `sensitive` sẽ được hiển thị trực tiếp trên màn hình. Để xem tất cả output (kể cả sensitive), bạn dùng lệnh:

```bash
terraform output
terraform output database_endpoint # Xem một output cụ thể
terraform output -json             # Hiển thị dưới dạng JSON, rất hữu ích để các script khác parse
```

## 10.2. Các Use Case Quan Trọng Của Output

1. **Hiển thị thông tin cần thiết:** IP để truy cập ứng dụng, connection string của database, URL của Load Balancer.
2. **Truyền dữ liệu giữa các Module:** Module con (child module) dùng output để trả về các giá trị cho module gốc (root module).
3. **Chia sẻ dữ liệu giữa các State:** Đây là cách để các state độc lập giao tiếp với nhau. State A (networking) output ra `vpc_id`. State B (application) dùng data source `terraform_remote_state` để đọc `vpc_id` đó (xem phần Data Source).
4. **Tích hợp với CI/CD Pipeline:** Pipeline có thể chạy `terraform output -json` để lấy các giá trị như `cluster_endpoint` và truyền vào bước deploy tiếp theo.

---

# 11. Data Source — Đọc Tài Nguyên Có Sẵn

Data Sources cho phép Terraform "hỏi" và sử dụng thông tin từ các tài nguyên không thuộc quyền quản lý của nó.

## 11.1. Sự Khác Biệt Giữa `resource` và `data`

Đây là điểm phân biệt quan trọng nhất cần nắm:

- **`resource`**: Bạn ra lệnh cho Terraform **TẠO, SỬA, XÓA** một đối tượng. Terraform chịu trách nhiệm về toàn bộ vòng đời của nó.
- **`data`**: Bạn yêu cầu Terraform **ĐỌC THÔNG TIN** của một đối tượng đã tồn tại sẵn. Terraform không tạo ra nó, không sửa nó, và chắc chắn sẽ không xóa nó.

## 11.2. Các Use Case Phổ Biến

**1. Lấy thông tin động:**
Thay vì hard-code một Amazon Machine Image (AMI) ID (sẽ thay đổi theo thời gian), bạn có thể yêu cầu Terraform tự tìm AMI mới nhất.

```hcl
# Tìm AMI Ubuntu 22.04 mới nhất do Canonical sở hữu
data "aws_ami" "ubuntu" {
  most_recent = true # Lấy AMI mới nhất
  owners      = ["099720109477"] # ID tài khoản AWS của Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id # Sử dụng AMI ID vừa tìm được
  instance_type = "t3.micro"
}
```

**2. Tham chiếu hạ tầng có sẵn:**
Bạn cần đặt máy ảo vào một VPC và Subnet đã được tạo sẵn (có thể bởi team khác, hoặc từ một dự án Terraform khác).

```hcl
data "aws_vpc" "shared" {
  tags = {
    Name = "shared-vpc"
  }
}

data "aws_subnet" "public" {
  vpc_id = data.aws_vpc.shared.id
  tags = {
    Type = "Public"
  }
}

resource "aws_instance" "app" {
  subnet_id = data.aws_subnet.public.id
  # ...
}
```

**3. Đọc thông tin từ tài khoản hiện tại:**

```hcl
data "aws_caller_identity" "current" {}
# Giờ bạn có thể dùng data.aws_caller_identity.current.account_id trong code
```

## 11.3. `terraform_remote_state` — Cầu Nối Giữa Các State

Đây là một data source đặc biệt, dùng để đọc output từ một Terraform state khác.

```hcl
# Trong state của ứng dụng, đọc dữ liệu từ state quản lý hạ tầng mạng
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "my-company-terraform-state"
    key    = "production/networking/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

# Sử dụng output 'vpc_id' từ state networking
resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.networking.outputs.public_subnet_id
  # ...
}
```

Đây chính là cơ chế giúp mô hình "Micro States" hoạt động hiệu quả, cho phép các team khác nhau làm việc độc lập nhưng vẫn có thể chia sẻ dữ liệu hạ tầng một cách tự động.

---

# 12. Dependency Graph — Terraform Biết Thứ Tự Làm Gì

Một trong những sức mạnh thông minh nhất của Terraform là khả năng tự động xây dựng một "đồ thị phụ thuộc" (dependency graph) để xác định đúng thứ tự tạo, sửa, xóa tài nguyên. Bạn không cần phải chỉ dẫn từng bước.

## 12.1. Implicit Dependency (Phụ thuộc ngầm)

Đây là cách Terraform suy ra sự phụ thuộc một cách tự nhiên dựa trên việc bạn tham chiếu thuộc tính của một resource trong cấu hình của một resource khác.

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id   # <--- Tham chiếu này TẠO RA dependency
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "web" {
  subnet_id = aws_subnet.public.id # <--- Dependency tiếp theo
  # ...
}
```

Terraform sẽ tự động vẽ ra đồ thị trong đầu nó:
`aws_vpc.main` → `aws_subnet.public` → `aws_instance.web`

Nó hiểu rằng phải tạo VPC trước, sau đó mới đến Subnet, và cuối cùng là Instance. Khi destroy, nó sẽ làm ngược lại: xóa Instance, rồi Subnet, rồi VPC.

## 12.2. Parallel Execution (Thực thi song song)

Một điểm mạnh nữa của đồ thị phụ thuộc là Terraform có thể xác định những resource nào **không** phụ thuộc lẫn nhau và tạo chúng **cùng một lúc**, giúp tăng tốc độ triển khai đáng kể.

```
       aws_vpc.main
            |
   ┌────────┼────────┐
   ▼        ▼        ▼
subnet_a subnet_b subnet_c   <--- Ba subnet này được tạo SONG SONG
   │        │        │         vì chúng đều chỉ phụ thuộc vào VPC.
   └────────┼────────┘
            ▼
   load_balancer   <--- Load balancer phải chờ cả 3 subnet tạo xong.
```

Mặc định, Terraform chạy tối đa 10 thao tác song song. Bạn có thể điều chỉnh bằng flag `-parallelism=N` khi chạy `plan` hoặc `apply`.

## 12.3. Explicit Dependency (`depends_on`)

Có những trường hợp sự phụ thuộc là có thật về mặt logic, nhưng không được thể hiện qua việc tham chiếu thuộc tính nào trong code. Lúc này, bạn cần khai báo một cách tường minh.

```hcl
# Một policy cho phép ứng dụng trên EC2 ghi vào S3 bucket
resource "aws_iam_role_policy" "app_policy" {
  name = "app-s3-access"
  # ...
}

resource "aws_instance" "app" {
  # Instance này khi khởi động sẽ gọi ngay đến S3.
  # Nó cần policy trên đã sẵn sàng, nhưng không có argument nào
  # trong resource "aws_instance" tham chiếu đến policy cả.
  # Do đó, chúng ta cần khai báo rõ ràng:
  depends_on = [aws_iam_role_policy.app_policy]
  # ...
}
```

**Nguyên tắc:** Hãy luôn ưu tiên implicit dependency thông qua tham chiếu thuộc tính. Chỉ dùng `depends_on` khi thực sự không còn cách nào khác. Việc lạm dụng `depends_on` sẽ làm code khó đọc và mất đi sự thông minh của đồ thị phụ thuộc tự động.

---

# 13. Module — Tái Sử Dụng Cấu Hình

Module là cách bạn đóng gói và tái sử dụng các cấu hình Terraform. Nó giống như việc bạn tạo ra một "function" trong lập trình. Mọi cấu hình Terraform bạn viết đều nằm trong một module (thư mục gốc được gọi là root module).

## 13.1. Tại Sao Cần Module?

Giả sử công ty bạn có 10 microservice. Mỗi microservice đều cần một bộ hạ tầng giống nhau: Load Balancer, Auto Scaling Group, Security Group, DNS Record. Nếu không có module, bạn sẽ phải copy-paste đoạn code đó 10 lần. Khi cần thay đổi logic chung (ví dụ: thêm một health check mới), bạn phải sửa ở tất cả 10 chỗ. Việc này rất thủ công và dễ gây ra sai sót.

Với module, bạn viết logic chung đó một lần và lưu vào một thư mục riêng. Sau đó, mỗi service chỉ cần gọi module đó và truyền vào các tham số khác nhau.

## 13.2. Cấu Trúc Của Một Module

Một module là một thư mục chứa ít nhất một file `.tf`. Cấu trúc tiêu chuẩn thường bao gồm:

```
modules/
└── web-service/
    ├── main.tf      # Khai báo các resource chính
    ├── variables.tf # Định nghĩa input (đối số đầu vào)
    ├── outputs.tf   # Định nghĩa output (giá trị trả về)
    └── README.md    # Tài liệu hướng dẫn sử dụng module
```

**Ví dụ nội dung module:**

```hcl
# modules/web-service/variables.tf
variable "service_name" {
  type = string
}
variable "instance_count" {
  type    = number
  default = 2
}

# modules/web-service/main.tf
resource "aws_autoscaling_group" "this" {
  name             = var.service_name
  desired_capacity = var.instance_count
  # ... các cấu hình khác
}

# modules/web-service/outputs.tf
output "asg_name" {
  value = aws_autoscaling_group.this.name
}
```

## 13.3. Gọi Module Từ Root Module

```hcl
# Trong file main.tf ở thư mục gốc
module "user_service" {
  source = "./modules/web-service" # Đường dẫn đến thư mục module

  service_name   = "user-service"
  instance_count = 5
}

module "payment_service" {
  source = "./modules/web-service"

  service_name   = "payment-service"
  instance_count = 10
}
```

## 13.4. Các Nguồn (Source) Của Module

Module không chỉ giới hạn ở các thư mục cục bộ. Bạn có thể gọi module từ nhiều nguồn khác nhau:

- **Local path:** `source = "./modules/web-service"`
- **Terraform Registry:** `source = "terraform-aws-modules/vpc/aws"` (Module VPC nổi tiếng của cộng đồng).
- **GitHub (HTTPS):** `source = "github.com/my-org/terraform-modules//web-service?ref=v1.0.0"`
- **S3 bucket, GCS bucket, HTTP URLs...**

**Lời khuyên:** Đối với các thành phần hạ tầng phổ biến và phức tạp (VPC, EKS, RDS), bạn nên ưu tiên sử dụng các module đã được kiểm chứng từ Terraform Registry. Chúng thường đã tích hợp sẵn rất nhiều best practices mà bạn sẽ mất rất nhiều thời gian để tự xây dựng.

---

# 14. Meta-Arguments — `count`, `for_each`, `depends_on`

Đây là những argument đặc biệt, bạn có thể sử dụng với **bất kỳ** resource hay module nào, không phụ thuộc vào provider.

## 14.1. `count` — Tạo Nhiều Bản Sao Theo Số Lượng

Dùng khi bạn cần tạo nhiều instance giống hệt nhau, và sự khác biệt giữa chúng chỉ là số thứ tự.

```hcl
resource "aws_instance" "web" {
  count = 3 # Tạo ra 3 instance giống hệt nhau

  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "web-server-${count.index}" # count.index là 0, 1, 2
  }
}

# Tham chiếu: aws_instance.web[0], aws_instance.web[1], aws_instance.web[2]
```

**Vấn đề lớn nhất với `count`:**
Khi bạn quản lý các resource bằng `count`, chúng được định danh bởi vị trí trong list. Nếu bạn xóa một phần tử ở giữa list, tất cả các phần tử phía sau sẽ bị thay đổi index. Terraform sẽ hiểu nhầm là cần phá hủy và tạo lại tất cả các resource đó, gây ra sự gián đoạn không cần thiết. Do đó, `count` phù hợp nhất cho các resource thực sự giống hệt nhau và bạn hiếm khi cần thay đổi số lượng một cách ngẫu nhiên.

## 14.2. `for_each` — Tạo Nhiều Bản Sao Với Danh Tính Rõ Ràng

Dùng khi bạn cần tạo nhiều instance với cấu hình khác nhau, và muốn mỗi instance được định danh bằng một khóa (key) có ý nghĩa. `for_each` làm việc với một map hoặc một set.

```hcl
variable "environments" {
  description = "Cấu hình cho các môi trường"
  type = map(object({
    instance_type = string
  }))
  default = {
    dev = { instance_type = "t3.micro" }
    staging = { instance_type = "t3.small" }
    production = { instance_type = "t3.large" }
  }
}

resource "aws_instance" "web" {
  for_each = var.environments # Vòng lặp qua từng phần tử trong map

  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = each.value.instance_type # Truy cập giá trị của phần tử hiện tại

  tags = {
    Name        = "web-${each.key}" # Sử dụng key (dev, staging, production)
    Environment = each.key
  }
}

# Tham chiếu bằng key: aws_instance.web["dev"], aws_instance.web["production"]
```

**Ưu điểm của `for_each`:** Resource được định danh bằng `key` (ví dụ: `"production"`). Nếu bạn xóa `"staging"` khỏi map, Terraform hiểu chính xác rằng chỉ cần xóa resource có key là `"staging"`. Các resource khác (`"dev"`, `"production"`) hoàn toàn không bị ảnh hưởng. Đây là cách an toàn và được khuyến nghị cho hầu hết các use case.

## 14.3. `depends_on` (Đã giải thích chi tiết ở phần 12.3)

---

# 15. Workspace — Quản Lý Nhiều Môi Trường

Workspace là một tính năng cho phép bạn dùng cùng một bộ code Terraform để quản lý nhiều tập hợp hạ tầng riêng biệt (ví dụ: dev, staging, production) bằng cách sử dụng các file state khác nhau.

```bash
# Tạo và chuyển đổi workspace
terraform workspace new staging
terraform workspace select production
terraform workspace show # Xem workspace hiện tại
```

```hcl
# Sử dụng tên workspace trong code
resource "aws_instance" "web" {
  instance_type = terraform.workspace == "production" ? "t3.large" : "t3.micro"
  tags = {
    Environment = terraform.workspace
  }
}
```

## 15.1. Ưu và Nhược Điểm Của Workspace

- **Phù hợp khi:** Các môi trường của bạn có kiến trúc gần như giống hệt nhau, chỉ khác về quy mô (size, số lượng). Team nhỏ, muốn một cách đơn giản để quản lý.
- **Không phù hợp khi:**
  - Môi trường có kiến trúc khác biệt (production multi-region, dev single-region).
  - Bạn cần kiểm soát truy cập riêng biệt (workspace dùng chung credentials và backend).
  - Bạn muốn cấu hình backend khác nhau cho từng môi trường (ví dụ: dev dùng local state, prod dùng S3).

## 15.2. Giải Pháp Thay Thế Cho Production

Trong các hệ thống lớn và nghiêm túc, mô hình **"Tách biệt thư mục"** thường được ưa chuộng hơn Workspace:

```
environments/
├── dev/
│   ├── main.tf
│   ├── backend.tf  (cấu hình backend riêng cho dev)
│   └── dev.tfvars
├── staging/
│   ├── main.tf
│   ├── backend.tf
│   └── staging.tfvars
└── production/
    ├── main.tf
    ├── backend.tf
    └── production.tfvars
```

Mỗi thư mục là một root module hoàn toàn độc lập, có thể có backend riêng, state riêng, thậm chí là cấu trúc code khác nhau. Các module dùng chung vẫn được gọi từ các thư mục này nhưng với input khác nhau. Cách này rõ ràng và an toàn hơn cho production.

---

# 16. Provisioner — Khi Nào Thực Sự Cần

Provisioner cho phép bạn thực thi các script (bash, PowerShell) trên máy ảo sau khi nó được tạo, hoặc trước khi nó bị xóa.

```hcl
resource "aws_instance" "web" {
  # ...

  provisioner "remote-exec" {
    inline = [
      "sudo apt update",
      "sudo apt install -y nginx"
    ]
    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("~/.ssh/id_rsa")
      host        = self.public_ip
    }
  }
}
```

## 16.1. Tại Sao Provisioner Là "Giải Pháp Cuối Cùng"?

HashiCorp, chính công ty tạo ra Terraform, coi provisioner là phương án cuối cùng. Lý do:

- **Phá vỡ tính "Declarative":** Provisioner là các lệnh thực thi tuần tự (imperative), đi ngược lại triết lý khai báo trạng thái mong muốn của Terraform. Terraform không thể quản lý được trạng thái của những gì đã xảy ra bên trong provisioner.
- **Quản lý trạng thái kém:** Terraform chỉ biết là nó "đã chạy" provisioner. Nó không biết provisioner có thực sự thành công hay không, và cũng không thể phát hiện ra nếu một ai đó SSH vào máy và gỡ bỏ `nginx`.
- **Khó debug:** Nếu provisioner bị lỗi giữa chừng (do network yếu, script sai...), resource sẽ bị đánh dấu là "tainted" (ô uế). Terraform sẽ hủy bỏ và tạo lại toàn bộ resource trong lần `apply` tiếp theo, gây gián đoạn không cần thiết.

## 16.2. Các Giải Pháp Thay Thế Tốt Hơn Provisioner

Hãy chọn một trong những cách sau trước khi nghĩ đến provisioner:

1. **Pre-baked Machine Images (Ami/Image):**
    Dùng công cụ như Packer để build sẵn một image máy ảo đã bao gồm đầy đủ ứng dụng và cấu hình (`nginx` đã được cài sẵn). Terraform chỉ việc launch image này. Kết quả là máy ảo khởi động xong là sẵn sàng hoạt động ngay. Đây là phương pháp nhanh và ổn định nhất.

2. **`user_data` / `cloud-init`:**
    Hầu hết các cloud provider đều hỗ trợ một cơ chế để chạy script khi máy ảo khởi động lần đầu tiên. Bạn có thể nhúng script cài đặt vào argument `user_data` của resource.

    ```hcl
    resource "aws_instance" "web" {
      # ...
      user_data = <<-EOF
        #!/bin/bash
        sudo apt update
        sudo apt install -y nginx
        sudo systemctl start nginx
      EOF
    }
    ```

    Script này do chính cloud provider thực thi, không cần Terraform phải kết nối vào. Tuy nhiên, cách này vẫn kém hơn pre-baked image.

3. **Công cụ Quản lý Cấu hình (Ansible, Chef, Puppet):**
    Terraform tạo máy ảo, và ngay sau đó, một pipeline CI/CD sẽ kích hoạt Ansible để cấu hình mọi thứ bên trong máy ảo đó. Đây là sự phân công "đúng người đúng việc", tận dụng thế mạnh của từng công cụ.

---

# 17. Import — Đưa Tài Nguyên Có Sẵn Vào Terraform

Khi bắt đầu với Terraform, bạn thường đã có sẵn hạ tầng được tạo thủ công. `import` là cách để đưa những tài nguyên đó vào sự quản lý của Terraform mà không cần phải phá hủy và tạo lại.

## 17.1. Quy Trình Import Chuẩn (Sử Dụng `import` Block - TF >= 1.5.0)

Đây là cách hiện đại và được khuyến khích.

1. **Viết `import` block:** Tạo một file (vd: `imports.tf`) và khai báo ý định import.

    ```hcl
    import {
      to = aws_instance.my_server # Địa chỉ resource mà bạn muốn import vào
      id = "i-0abc123def456789"   # ID thực tế của tài nguyên trên AWS
    }
    ```

2. **Viết `resource` block tương ứng:** Bạn cần viết một resource block trong code với cấu hình mà bạn **đoán** là đúng với tài nguyên thực tế.

    ```hcl
    resource "aws_instance" "my_server" {
      ami           = "ami-0c55b159cbfafe1f0"
      instance_type = "t3.micro"
      # ...
    }
    ```

3. **Chạy `terraform plan`:**
    Terraform sẽ đọc `import` block và thực hiện import vào state. Sau đó, nó sẽ so sánh code của bạn với trạng thái thực tế vừa import vào.
    - Nếu code khớp hoàn toàn với thực tế, plan sẽ báo `No changes. Your infrastructure matches the configuration.`
    - Nếu có sự khác biệt, plan sẽ hiển thị những gì nó muốn thay đổi.

4. **Điều chỉnh code cho đến khi plan "sạch":** Đây là bước quan trọng nhất. Bạn cần sửa đi sửa lại code `.tf` cho đến khi `terraform plan` không còn đề xuất bất kỳ thay đổi nào. Bạn không muốn Terraform phá hủy một tài nguyên chỉ vì code của bạn đoán sai một tham số.

5. **Chạy `terraform apply` để hoàn tất.**

Sau khi hoàn tất, bạn có thể xóa `import` block đi vì việc import đã được ghi vào state. Giờ đây, tài nguyên đã nằm dưới sự quản lý của Terraform.

---

# 18. Terraform Trong Team — Quy Trình Thực Tế

Đây là cách Terraform được sử dụng trong một team phát triển phần mềm chuyên nghiệp. Nó kết hợp IaC với Git và CI/CD.

## 18.1. Quy Trình GitOps cho Infrastructure

```
1. Developer tạo branch mới cho thay đổi.
   git checkout -b feature/add-redis-cache

2. Developer viết code Terraform trên branch của mình.
   - Chạy 'terraform fmt', 'validate' để kiểm tra local.

3. Developer push branch lên Git và tạo Pull Request (PR).

4. CI Pipeline tự động chạy trên PR:
   - terraform fmt -check -recursive  (Kiểm tra format code)
   - terraform init                    (Khởi tạo)
   - terraform validate                (Kiểm tra cú pháp)
   - terraform plan -out=plan.tfplan   (Tạo kế hoạch thay đổi)

5. Bot của CI sẽ post kết quả của 'terraform plan' lên PR.
   Đây là bước QUAN TRỌNG NHẤT để review.

6. Các Senior/Lead Engineer sẽ vào PR, xem xét kỹ lưỡng
   kết quả plan, thảo luận, và yêu cầu thay đổi nếu cần.

7. Khi PR được approved, nó sẽ được merge vào nhánh chính (main/master).

8. Một CI/CD Pipeline khác (hoặc một stage khác) được kích hoạt
   bởi sự kiện merge, sẽ chạy 'terraform apply plan.tfplan'
   để thực thi những thay đổi đã được duyệt lên môi trường thật.
```

## 18.2. Phân Quyền và Bảo Mật

- **Nguyên tắc "Không ai chạm tay vào Production":** Không một kỹ sư nào có quyền chạy `terraform apply` trực tiếp từ máy tính cá nhân của họ lên môi trường production.
- **CI/CD Service Account:** Chỉ có tài khoản dịch vụ (service account) của CI/CD pipeline mới có quyền `apply`. Thông tin xác thực (credentials) của tài khoản này được lưu trữ an toàn trong CI/CD tool (GitHub Actions Secrets, GitLab CI Variables...).
- **Approval Gate (Cổng phê duyệt):** Trước khi pipeline thực sự chạy `apply` lên production, nó sẽ tạm dừng và chờ một người có thẩm quyền (thường là team lead hoặc người không phải tác giả PR) vào nhấn nút "Approve".

---

# 19. Các Sai Lầm Thường Gặp

Dưới đây là những sai lầm "kinh điển" mà hầu hết người mới học Terraform đều mắc phải.

1. **Không dùng Remote State ngay từ đầu:** Bắt đầu với local state cho dễ, đến khi có thêm người thì vỡ lở. **Bài học:** Luôn cấu hình remote state ngay từ `terraform init` đầu tiên.

2. **Hard-code giá trị nhạy cảm:**

    ```hcl
    # TUYỆT ĐỐI KHÔNG LÀM
    resource "aws_db_instance" "main" {
      password = "MySuperSecretPassword"
    }
    ```

    **Hậu quả:** Mật khẩu sẽ nằm trong Git history mãi mãi và trong cả file state. **Giải pháp:** Dùng biến môi trường (`TF_VAR_db_password`), secret manager (Vault, AWS Secrets Manager) hoặc lấy giá trị từ CI/CD pipeline.

3. **Monolithic State:** Một file state "cân" cả thế giới. **Hậu quả:** Plan/apply chậm, lock conflict liên tục, một lỗi nhỏ block cả team. **Giải pháp:** Chia state theo kiến trúc và "blast radius".

4. **Không kiểm tra kỹ `plan` trước khi `apply`:** Gõ `yes` như một phản xạ. Đây là nguyên nhân số một dẫn đến việc xóa nhầm database production. **Bài học:** Hãy coi việc đọc `plan` là một nghi thức bắt buộc.

5. **Dùng `count` khi nên dùng `for_each`:** Dẫn đến việc Terraform hiểu nhầm và đòi phá hủy/tạo lại nhiều resource không liên quan khi bạn thay đổi list.

6. **Không ghim phiên bản Provider:** Không dùng `version` constraint trong `required_providers` và không commit `.terraform.lock.hcl`. **Hậu quả:** Code "chạy được trên máy tao" nhưng lỗi trên máy người khác hoặc trên CI/CD.

---

# 20. Terraform Best Practices

Đây là những lời khuyên đúc kết từ thực tế để bạn có một codebase Terraform mạnh mẽ, dễ bảo trì và an toàn.

1. **Cấu Trúc Thư Mục Rõ Ràng:**

    ```text
    project-root/
    ├── modules/                     # Chứa các module dùng chung
    │   ├── networking/
    │   └── compute/
    ├── environments/                # Chứa cấu hình cho từng môi trường
    │   ├── dev/
    │   │   ├── main.tf
    │   │   ├── variables.tf
    │   │   ├── outputs.tf
    │   │   ├── backend.tf
    │   │   └── terraform.tfvars
    │   └── production/
    └── global/                      # Các tài nguyên toàn cục như IAM, Route53
    ```

2. **Đặt Tên Và Tag Nhất Quán:**
    - Sử dụng `snake_case` cho mọi thứ.
    - Luôn thêm `description` cho `variable` và `output`.
    - Tag mọi resource với ít nhất các tag như `Project`, `Environment`, `ManagedBy = "terraform"`. Điều này cực kỳ hữu ích cho việc quản lý chi phí (cost tracking) và phân loại tài nguyên.

3. **Ghim Phiên Bản (Version Pinning):**
    - Luôn khai báo `required_version` cho Terraform CLI.
    - Luôn khai báo phiên bản cho provider.
    - Luôn commit `.terraform.lock.hcl`.
    - Khi gọi module từ Git, luôn dùng `?ref=vX.Y.Z`.

4. **Biến Hóa Code Của Bạn (Parameterize):**
    - Hard-code càng ít càng tốt. Đưa mọi thứ có thể thay đổi thành `variable`.
    - Dùng file `.tfvars` riêng cho mỗi môi trường.

5. **Tích Hợp Công Cụ Phân Tích Tĩnh (Linting & Security):**
    - Chạy `terraform fmt` và `terraform validate` là chưa đủ.
    - Sử dụng các công cụ như `tflint` để phát hiện lỗi tiềm ẩn và `tfsec` hoặc `checkov` để quét các lỗi cấu hình bảo mật (ví dụ: bucket S3 public, security group mở rộng quá mức). Tích hợp chúng vào CI pipeline của bạn.

6. **Production Approval Gate:**
    - Pipeline cho production **không bao giờ** được tự động chạy `terraform apply`.
    - Luôn có một bước phê duyệt thủ công (manual approval) trước khi thực sự thay đổi hạ tầng production, ngay cả khi PR đã được duyệt và merge. Đây là lớp bảo vệ "defense in depth" cuối cùng.

---

## 📎 Tóm Tắt và Tài Liệu Tham Khảo

### Tóm tắt các nguyên lý cốt lõi

- **Declarative over Imperative:** Mô tả cái bạn muốn, không phải làm thế nào để đạt được nó.
- **Plan then Apply:** Luôn luôn xem xét kế hoạch trước khi thực thi.
- **State is the Source of Truth:** Bảo vệ state file như bảo vệ dữ liệu quan trọng nhất của bạn.
- **Modules for Reuse:** Đóng gói các thành phần để tái sử dụng và giảm trùng lặp.
- **Automate Everything via CI/CD:** Loại bỏ yếu tố con người khỏi quy trình triển khai production.

### Tài Liệu Tham Khảo Chính Thức

- [Terraform Official Documentation](https://developer.hashicorp.com/terraform/docs)
- [HashiCorp Well-Architected Framework](https://developer.hashicorp.com/well-architected-framework)
- [Terraform Registry](https://registry.terraform.io)
- [Terraform Best Practices (community)](https://www.terraform-best-practices.com/)
