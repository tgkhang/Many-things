# 🏗️ Terraform — Toàn Tập
>
> Infrastructure as Code từ nền tảng đến thực hành production

---

## Mục Lục

1. [Terraform Giải Quyết Vấn Đề Gì](#1-terraform-giải-quyết-vấn-đề-gì)
2. [Kiến Trúc Terraform — Cách Hoạt Động Bên Trong](#2-kiến-trúc-terraform--cách-hoạt-động-bên-trong)
3. [HCL — Ngôn Ngữ Cấu Hình](#3-hcl--ngôn-ngữ-cấu-hình)
4. [Provider — Cầu Nối Đến Hạ Tầng Thực](#4-provider--cầu-nối-đến-hạ-tầng-thực)
5. [Resource — Đơn Vị Cơ Bản](#5-resource--đơn-vị-cơ-bản)
6. [State — Trái Tim Của Terraform](#6-state--trái-tim-của-terraform)
7. [Remote State và State Locking](#7-remote-state-và-state-locking)
8. [Vòng Đời Lệnh Terraform](#8-vòng-đời-lệnh-terraform)
9. [Variables — Tham Số Hóa Cấu Hình](#9-variables--tham-số-hóa-cấu-hình)
10. [Output — Lấy Giá Trị Ra Ngoài](#10-output--lấy-giá-trị-ra-ngoài)
11. [Data Source — Đọc Tài Nguyên Có Sẵn](#11-data-source--đọc-tài-nguyên-có-sẵn)
12. [Dependency Graph — Terraform Biết Thứ Tự Làm Gì](#12-dependency-graph--terraform-biết-thứ-tự-làm-gì)
13. [Module — Tái Sử Dụng Cấu Hình](#13-module--tái-sử-dụng-cấu-hình)
14. [Meta-Arguments — count, for_each, depends_on](#14-meta-arguments--count-foreach-dependson)
15. [Workspace — Quản Lý Nhiều Môi Trường](#15-workspace--quản-lý-nhiều-môi-trường)
16. [Provisioner — Khi Nào Thực Sự Cần](#16-provisioner--khi-nào-thực-sự-cần)
17. [Import — Đưa Tài Nguyên Có Sẵn Vào Terraform](#17-import--đưa-tài-nguyên-có-sẵn-vào-terraform)
18. [Terraform Trong Team — Quy Trình Thực Tế](#18-terraform-trong-team--quy-trình-thực-tế)
19. [Các Sai Lầm Thường Gặp](#19-các-sai-lầm-thường-gặp)
20. [Terraform Best Practices](#20-terraform-best-practices)

---

# 1. Terraform Giải Quyết Vấn Đề Gì

## Vấn Đề Trước Khi Có Terraform

Hãy tưởng tượng một công ty quản lý hạ tầng theo cách thủ công.

```
Engineer A muốn tạo một server:
  Đăng nhập vào web console của cloud provider
  Click "Create Instance"
  Chọn loại máy, network, security group
  Click "Launch"
  Ghi chú lại (hoặc quên ghi) những gì vừa làm

Sáu tháng sau, Engineer B cần tạo một server tương tự:
  Không biết Engineer A đã cấu hình thế nào
  Đoán mò, hoặc hỏi Engineer A (nếu còn nhớ, nếu còn ở công ty)
  Tạo ra một server "gần giống" nhưng có vài khác biệt nhỏ

Một năm sau, không ai nhớ chính xác hạ tầng trông như thế nào
  Production có 47 server, không server nào giống hệt nhau
  Đây gọi là "snowflake infrastructure" — mỗi server là một bông tuyết độc nhất
  Không ai dám động vào vì không biết nó sẽ ảnh hưởng gì
```

Vấn đề cốt lõi: hạ tầng được tạo ra qua **hành động** (click, gõ lệnh) chứ không phải qua **mô tả**. Hành động không để lại dấu vết, không thể review, không thể lặp lại chính xác.

## Terraform Giải Quyết Bằng Cách Nào

Terraform là công cụ Infrastructure as Code — bạn **mô tả** hạ tầng mong muốn bằng văn bản, Terraform tự tính toán cách đạt được điều đó.

```
Thay vì: "Click vào đây, gõ lệnh kia, chờ rồi click tiếp"

Bạn viết:
  "Tôi muốn có 3 server, mỗi server 4GB RAM,
   nằm trong network X, mở port 80 và 443"

Terraform:
  Đọc mô tả này
  So sánh với hạ tầng thực tế đang có
  Tính toán: cần tạo gì, sửa gì, xóa gì
  Thực thi các thay đổi đó qua API của cloud provider
```

Đây gọi là **declarative** — bạn khai báo trạng thái mong muốn (desired state), không khai báo các bước thực hiện (steps). Khác với một script bash tuần tự "làm A rồi làm B rồi làm C", Terraform tự suy luận ra A, B, C cần làm theo thứ tự nào.

## Tại Sao Đây Là Cách Tiếp Cận Mạnh

```
Văn bản mô tả hạ tầng → có thể lưu vào Git
  → Có lịch sử: ai thay đổi gì, lúc nào, tại sao (qua commit message)
  → Có thể review: Pull Request trước khi áp dụng vào production
  → Có thể rollback: quay lại commit cũ nếu có vấn đề

Mô tả là duy nhất nguồn sự thật (single source of truth)
  → Không còn "snowflake infrastructure"
  → Server mới giống hệt server cũ vì cùng được tạo từ cùng đoạn code

Terraform tự tính dependency
  → Bạn không cần nhớ "phải tạo network trước, rồi mới tạo server"
  → Terraform tự hiểu server phụ thuộc vào network và làm đúng thứ tự
```

## Terraform Không Phải Là Gì

Cần làm rõ vài hiểu lầm phổ biến.

```
Terraform không phải là configuration management tool
  Ansible, Chef, Puppet — quản lý CẤU HÌNH BÊN TRONG server đã tồn tại
  Terraform — quản lý sự TỒN TẠI của hạ tầng (tạo, sửa, xóa server)
  Nhiều team dùng cả hai: Terraform tạo server, Ansible cấu hình bên trong

Terraform không phải dành riêng cho một cloud provider
  Terraform là engine, provider là plugin
  Cùng workflow dùng được cho AWS, Azure, GCP, Kubernetes,
  thậm chí cả các dịch vụ không phải cloud (GitHub, Datadog, Cloudflare)

Terraform không tự động hoá toàn bộ vòng đời ứng dụng
  Terraform tạo HẠ TẦNG (server, network, database instance)
  Việc deploy CODE lên hạ tầng đó thường là việc của CI/CD pipeline riêng
```

---

# 2. Kiến Trúc Terraform — Cách Hoạt Động Bên Trong

Hiểu kiến trúc bên trong giúp bạn debug khi có vấn đề và hiểu tại sao Terraform hoạt động theo cách nó hoạt động.

## Ba Thành Phần Chính

```
┌─────────────────────────────────────────────────────────┐
│                  Terraform Core                          │
│  - Đọc file .tf (cấu hình của bạn)                       │
│  - Đọc state file (trạng thái đã biết)                   │
│  - Tính toán dependency graph                             │
│  - Quyết định: cần làm gì để đạt desired state           │
└────────────────────┬──────────────────────────────────────┘
                     │ giao tiếp qua RPC (gRPC)
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐┌──────────────┐┌──────────────┐
│  Provider A  ││  Provider B  ││  Provider C  │
│  (vd: cloud  ││  (vd:        ││  (vd:        │
│  provider)   ││  Kubernetes) ││  GitHub)     │
└──────┬───────┘└──────┬───────┘└──────┬───────┘
       │                │                │
       ▼                ▼                ▼
   API thật của     API thật của     API thật của
   Cloud Provider    Kubernetes        GitHub
```

**Terraform Core** là engine chính — không biết gì về cloud provider cụ thể nào. Nó chỉ biết cách đọc cấu hình, quản lý state, và tính dependency graph.

**Provider** là plugin riêng biệt, biết cách giao tiếp với một dịch vụ cụ thể. Provider dịch các resource block của bạn thành API calls thực tế.

```
Khi bạn viết:
  resource "compute_instance" "web" {
    machine_type = "e2-medium"
  }

Terraform Core không biết "compute_instance" nghĩa là gì
Nó hỏi Provider: "đây là loại resource gì, làm sao tạo nó?"
Provider biết cách gọi đúng API, đúng field, đúng format
```

Đây là lý do tại sao Terraform hỗ trợ được hàng nghìn loại dịch vụ khác nhau — mỗi dịch vụ chỉ cần viết một provider, không cần sửa Terraform Core.

## Plan và Apply — Hai Giai Đoạn Tách Biệt

Terraform tách biệt rõ ràng giữa **tính toán thay đổi** và **thực hiện thay đổi**. Đây là một trong những thiết kế quan trọng nhất.

```
terraform plan:
  Đọc cấu hình hiện tại trong file .tf
  Đọc state (trạng thái Terraform biết được lần cuối)
  Gọi provider để refresh — kiểm tra thực tế có khớp với state không
  So sánh ba thứ: Config mong muốn / State đã biết / Thực tế hiện tại
  In ra: "đây là những gì sẽ thay đổi nếu bạn apply"
  KHÔNG thay đổi gì cả — chỉ là dry-run

terraform apply:
  Chạy lại plan (hoặc dùng plan đã lưu)
  Hỏi xác nhận (yes/no)
  Thực sự gọi API để tạo/sửa/xóa resource
  Cập nhật state file sau khi thành công
```

Sự tách biệt này quan trọng vì nó cho phép review trước khi thay đổi production — giống như code review trước khi merge.

---

# 3. HCL — Ngôn Ngữ Cấu Hình

HCL (HashiCorp Configuration Language) là ngôn ngữ Terraform dùng để viết cấu hình. Nó được thiết kế để vừa dễ đọc cho con người, vừa dễ máy tính xử lý.

## Cấu Trúc Block Cơ Bản

```hcl
# Cấu trúc chung của một block:
<block_type> "<label_1>" "<label_2>" {
  <argument_name> = <value>
  <nested_block> {
    <argument_name> = <value>
  }
}

# Ví dụ thực tế:
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name        = "web-server"
    Environment = "production"
  }
}
```

```
Giải thích từng phần:
  resource          → block type (loại block: resource, variable, output...)
  "aws_instance"    → label thứ nhất, thường là loại resource cụ thể
  "web_server"      → label thứ hai, tên bạn đặt để tham chiếu sau này
  { ... }           → body, chứa các argument cấu hình resource đó

  Để tham chiếu resource này ở nơi khác trong code:
  aws_instance.web_server.id
  <resource_type>.<local_name>.<attribute>
```

## Kiểu Dữ Liệu Trong HCL

```hcl
# String
name = "my-server"

# Number
port = 8080
cpu_count = 2.5

# Bool
enabled = true

# List (array) — thứ tự quan trọng, có thể trùng giá trị
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Map (object) — key-value pairs
tags = {
  Environment = "production"
  Team        = "platform"
}

# Set — giống list nhưng không có thứ tự, không trùng giá trị
allowed_ports = toset([80, 443, 22])

# Null — không có giá trị (khác với chuỗi rỗng "")
optional_field = null
```

## Expressions — Biểu Thức Động

HCL cho phép viết biểu thức thay vì chỉ giá trị tĩnh.

```hcl
# Tham chiếu đến resource khác
resource "aws_instance" "web" {
  subnet_id = aws_subnet.public.id
  # Lấy attribute "id" từ resource "aws_subnet.public" đã định nghĩa ở nơi khác
}

# Tham chiếu đến variable
resource "aws_instance" "web" {
  instance_type = var.instance_type
}

# String interpolation — chèn biến vào trong chuỗi
resource "aws_instance" "web" {
  tags = {
    Name = "web-server-${var.environment}"
    # Nếu var.environment = "prod" → "web-server-prod"
  }
}

# Conditional expression (ternary)
resource "aws_instance" "web" {
  instance_type = var.environment == "production" ? "t3.large" : "t3.micro"
  # Nếu production → t3.large, ngược lại → t3.micro
}

# Function calls
resource "aws_instance" "web" {
  tags = {
    Name = upper(var.environment)
    # Chuyển thành chữ hoa: "production" → "PRODUCTION"
  }
}
```

## Comments — Chú Thích

```hcl
# Đây là comment một dòng (dùng dấu #)
// Đây cũng là comment một dòng (dùng dấu //, ít phổ biến hơn)

/*
  Đây là comment nhiều dòng
  Dùng khi cần giải thích dài
*/
```

---

# 4. Provider — Cầu Nối Đến Hạ Tầng Thực

## Khai Báo Provider

Mỗi project Terraform cần khai báo provider nào sẽ dùng và phiên bản nào.

```hcl
terraform {
  required_version = ">= 1.6.0"  # phiên bản Terraform tối thiểu

  required_providers {
    aws = {
      source  = "hashicorp/aws"   # nguồn của provider
      version = "~> 5.0"           # phiên bản provider, cho phép 5.x nhưng không 6.x
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
  }
}

# Cấu hình cụ thể cho provider
provider "aws" {
  region = "ap-southeast-1"
  # Credentials thường KHÔNG nên hard-code ở đây
  # Terraform tự đọc từ environment variables hoặc credentials file
}
```

## Version Constraints — Tại Sao Phải Ghim Phiên Bản

```hcl
version = "= 5.31.0"   # chính xác phiên bản này, không hơn không kém
version = "~> 5.31"    # >= 5.31.0 và < 5.32.0 (chỉ patch version được thay đổi)
version = "~> 5.0"     # >= 5.0.0 và < 6.0.0 (minor version được thay đổi)
version = ">= 5.0"     # từ 5.0.0 trở lên, không giới hạn trên
```

```
Tại sao quan trọng:
  Không ghim version → provider tự update → behavior có thể thay đổi
  đột ngột mà bạn không biết, có thể breaking change

Đội ngũ làm việc cùng project cần dùng CÙNG version provider
  → tránh tình trạng "trên máy tôi chạy được" do khác version

Thực hành tốt: dùng "~> X.Y" để cho phép patch updates (bug fixes)
  nhưng khóa minor/major version (tránh breaking changes)
```

## Provider Alias — Nhiều Cấu Hình Cùng Một Provider

Đôi khi bạn cần dùng cùng một provider với cấu hình khác nhau — ví dụ deploy tài nguyên vào nhiều region.

```hcl
provider "aws" {
  region = "ap-southeast-1"
  alias  = "singapore"
}

provider "aws" {
  region = "us-east-1"
  alias  = "virginia"
}

resource "aws_instance" "asia_server" {
  provider = aws.singapore
  # ... cấu hình khác
}

resource "aws_instance" "us_server" {
  provider = aws.virginia
  # ... cấu hình khác
}
```

---

# 5. Resource — Đơn Vị Cơ Bản

Resource là khối xây dựng cơ bản nhất trong Terraform — mỗi resource đại diện cho một thành phần hạ tầng cụ thể: một máy chủ, một mạng, một bản ghi DNS, một database.

## Anatomy Của Một Resource

```hcl
resource "<provider>_<resource_type>" "<local_name>" {
  argument_1 = value_1
  argument_2 = value_2

  nested_block {
    nested_argument = value
  }
}
```

```
provider_resourcetype: loại resource cụ thể, được định nghĩa bởi provider
  Mỗi provider có hàng trăm loại resource khác nhau
  Tên resource type luôn bắt đầu bằng tên provider (vd: aws_, google_, azurerm_)

local_name: tên BẠN đặt, chỉ tồn tại trong code Terraform
  Không liên quan gì đến tên thực tế của resource trên cloud
  Dùng để tham chiếu resource này ở chỗ khác trong code
```

## Resource Attributes — Hai Loại

```hcl
resource "aws_instance" "web" {
  # ARGUMENTS: bạn set, Terraform dùng để tạo resource
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  # Sau khi resource được tạo, nó có thêm
  # COMPUTED ATTRIBUTES: do provider trả về, bạn KHÔNG set
  # Ví dụ: id, private_ip, public_ip, arn
}

# Tham chiếu computed attribute ở nơi khác:
output "server_ip" {
  value = aws_instance.web.public_ip
  # public_ip không phải thứ bạn gõ vào, mà là kết quả AWS trả về
  # sau khi resource được tạo
}
```

## Lifecycle Của Một Resource

```
1. terraform apply chạy lần đầu
   → Resource chưa tồn tại trong state
   → Terraform CREATE resource mới
   → Lưu thông tin vào state

2. Sửa argument trong code, terraform apply lại
   → Resource đã tồn tại trong state
   → Terraform so sánh config mới với state cũ
   → Nếu khác → UPDATE (hoặc REPLACE tùy loại thay đổi)

3. Xóa resource block khỏi code, terraform apply
   → Resource có trong state nhưng không có trong code
   → Terraform DESTROY resource đó
```

## Update vs Replace — Khác Biệt Quan Trọng

Không phải mọi thay đổi đều update tại chỗ được — một số thay đổi buộc Terraform phải xóa và tạo lại resource.

```
Update tại chỗ (in-place update):
  Thay đổi không ảnh hưởng đến identity cơ bản của resource
  Ví dụ: đổi tags, đổi security group attached vào

Replace (destroy rồi create):
  Thay đổi thuộc tính không thể sửa được sau khi tạo
  Ví dụ: đổi availability_zone của một instance
  (Cloud provider không cho phép "di chuyển" instance giữa các AZ)

  Terraform sẽ hiển thị trong plan:
  -/+ resource "aws_instance" "web" {
      ~ availability_zone = "us-east-1a" -> "us-east-1b" # forces replacement
      }

Đây là lý do TẠI SAO phải đọc kỹ terraform plan trước khi apply
Một thay đổi tưởng chừng nhỏ có thể gây ra việc xóa và tạo lại
toàn bộ database production!
```

## Lifecycle Block — Kiểm Soát Hành Vi

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  lifecycle {
    # Tạo resource mới TRƯỚC khi xóa resource cũ
    # Tránh downtime khi phải replace
    create_before_destroy = true

    # Ngăn không cho terraform destroy resource này
    # Bảo vệ database production khỏi việc xóa nhầm
    prevent_destroy = true

    # Bỏ qua thay đổi ở những field này khi so sánh
    # (vd: tags được hệ thống khác tự động thêm vào,
    # không muốn Terraform coi đó là "drift")
    ignore_changes = [tags["LastModifiedBy"]]
  }
}
```

---

# 6. State — Trái Tim Của Terraform

Đây là khái niệm quan trọng nhất để hiểu Terraform thực sự hoạt động như thế nào.

## State Là Gì

State là file (mặc định tên `terraform.tfstate`) ghi lại Terraform **biết** những gì về hạ tầng nó đang quản lý. Đây là bộ nhớ của Terraform.

```
Tại sao cần state?

Khi bạn viết:
  resource "aws_instance" "web" {
    instance_type = "t3.medium"
  }

Và chạy terraform apply lần thứ hai, Terraform cần biết:
  Resource "web" đã tồn tại chưa?
  Nếu có, ID thực tế của nó trên AWS là gì?
  Giá trị hiện tại của nó là gì để so sánh với config?

Không có state, Terraform sẽ KHÔNG biết
"aws_instance.web" này tương ứng với server nào trên AWS
→ Có thể tạo nhầm thêm một server mới thay vì update server đã có!
```

## Cấu Trúc State File

State file là JSON, chứa mapping giữa resource trong code và resource thực tế.

```json
{
  "version": 4,
  "terraform_version": "1.7.0",
  "resources": [
    {
      "type": "aws_instance",
      "name": "web",
      "instances": [
        {
          "attributes": {
            "id": "i-0abc123def456789",
            "instance_type": "t3.medium",
            "private_ip": "10.0.1.15",
            "public_ip": "54.123.45.67"
            // ... tất cả attributes khác của resource thực tế
          }
        }
      ]
    }
  ]
}
```

State không chỉ lưu config bạn viết — nó lưu TOÀN BỘ thông tin về resource thực tế, kể cả những computed attributes mà bạn không hề set.

## Refresh — Đồng Bộ State Với Thực Tế

```
Trước mỗi plan/apply, Terraform (mặc định) refresh state:
  Gọi API thực tế để lấy trạng thái hiện tại của mỗi resource
  Cập nhật state nếu có khác biệt

Tại sao cần refresh?
  Có thể ai đó đã thay đổi resource thủ công qua console
  (đây gọi là "configuration drift" — trạng thái thực tế
  trôi dạt khỏi những gì Terraform nghĩ là đúng)

  Refresh giúp Terraform phát hiện drift này
  trước khi tính toán plan tiếp theo
```

## Tại Sao Không Bao Giờ Sửa State File Bằng Tay

```
State file chứa thông tin nhạy cảm:
  Database password (nếu là argument của resource)
  Private keys
  Bất kỳ secret nào được set làm argument

  → State file PHẢI được bảo vệ giống như bí mật quan trọng nhất
  → Không bao giờ commit state file vào Git (trừ khi đã mã hóa kỹ)

Sửa tay state file dễ làm hỏng cấu trúc JSON
  → Terraform không đọc được state nữa
  → Mất khả năng quản lý toàn bộ hạ tầng đã tạo

Nếu cần sửa state, dùng lệnh chuyên dụng:
  terraform state mv    — di chuyển resource trong state (đổi tên, refactor)
  terraform state rm    — xóa resource khỏi state (không xóa resource thật)
  terraform import      — đưa resource có sẵn vào state
  terraform state list  — liệt kê resource trong state
  terraform state show  — xem chi tiết một resource trong state
```

---

# 7. Remote State và State Locking

## Vấn Đề Với Local State

Mặc định, Terraform lưu state file ngay trên máy bạn đang chạy lệnh (local state). Điều này hoạt động tốt khi học, nhưng có vấn đề nghiêm trọng khi làm việc theo team.

```
Engineer A chạy terraform apply trên máy mình
  → state được cập nhật, lưu ở local máy A

Engineer B chạy terraform apply trên máy mình (state khác, cũ hơn)
  → Terraform B không biết về thay đổi A vừa làm
  → Có thể tạo trùng resource, hoặc xóa nhầm resource A vừa tạo

Hai người không bao giờ nên có hai bản state riêng biệt
của CÙNG một hạ tầng
```

## Remote State — Lưu Trữ Tập Trung

Giải pháp là lưu state ở một nơi tập trung, tất cả mọi người trong team đọc/ghi vào cùng một state.

```hcl
terraform {
  backend "s3" {
    bucket         = "my-company-terraform-state"
    key            = "production/networking/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"  # cho state locking
  }
}
```

```
Backend là khái niệm chung — nơi Terraform lưu state
Có nhiều loại backend: object storage (S3-compatible),
HTTP backend, Terraform Cloud, Consul, etc.

Lợi ích của remote state:
  Tất cả team member đọc cùng một state — luôn đồng bộ
  Có thể mã hóa state khi lưu trữ (encrypt at rest)
  Có thể versioning — rollback nếu state bị hỏng
  Tách biệt khỏi máy cá nhân — không sợ mất khi đổi máy
```

## State Locking — Tránh Xung Đột Đồng Thời

```
Vấn đề: Engineer A và Engineer B CÙNG LÚC chạy terraform apply
  Cả hai đọc cùng state ban đầu
  Cả hai tính toán thay đổi riêng
  Cả hai cùng ghi vào state
  → State bị corrupt, hoặc thay đổi của một người bị mất

Giải pháp: State Locking
  Khi terraform apply bắt đầu, nó tạo một "lock"
  (thường lưu trong một bảng database riêng, hoặc cơ chế lock
  có sẵn của backend)

  Engineer B cố apply trong khi A đang chạy
  → Terraform B nhận lỗi: "state đang bị lock bởi process khác"
  → B phải đợi A xong (lock được giải phóng tự động)

Nếu Terraform process bị kill đột ngột (không giải phóng lock)
  → Cần dùng: terraform force-unlock <lock-id>
  → Cẩn thận: chỉ dùng khi chắc chắn không có process nào khác đang chạy
```

## Tổ Chức State — Một State Lớn Hay Nhiều State Nhỏ

```
Cách 1: Một state cho TOÀN BỘ hạ tầng
  Ưu: đơn giản, dependency giữa resource luôn resolve được
  Nhược: state lớn → plan/apply chậm
         Một lỗi nhỏ ảnh hưởng risk đến toàn bộ hạ tầng
         Lock conflict thường xuyên khi nhiều người làm việc

Cách 2: Nhiều state nhỏ, chia theo layer hoặc team
  networking/terraform.tfstate     — VPC, subnet, routing
  database/terraform.tfstate       — RDS instances
  application/terraform.tfstate    — App servers, load balancer

  Ưu: Mỗi state nhỏ hơn, apply nhanh hơn
      Team khác nhau quản lý state khác nhau, ít conflict
      Lỗi ở một layer không ảnh hưởng layer khác
  Nhược: Cần data source hoặc remote state data source
         để layer này tham chiếu output của layer khác

Thực tế: hầu hết tổ chức trưởng thành dùng Cách 2,
chia theo blast radius — phần nào càng quan trọng,
càng nên tách biệt để giảm rủi ro khi thay đổi
```

---

# 8. Vòng Đời Lệnh Terraform

## Các Lệnh Cốt Lõi

```bash
# Khởi tạo working directory
# Tải provider plugins, cấu hình backend
terraform init

# Kiểm tra cú pháp HCL có hợp lệ không
terraform validate

# Format code theo chuẩn (giống prettier cho code thường)
terraform fmt

# Tính toán những gì sẽ thay đổi (KHÔNG thực thi)
terraform plan

# Lưu plan ra file để dùng lại chính xác plan đó khi apply
terraform plan -out=tfplan

# Thực thi thay đổi
terraform apply

# Apply chính xác plan đã lưu trước đó (đảm bảo không có gì thay đổi
# giữa lúc review plan và lúc thực sự apply)
terraform apply tfplan

# Xóa TẤT CẢ resource được quản lý bởi state này
terraform destroy

# Xem trạng thái hiện tại
terraform show

# Liệt kê resource trong state
terraform state list

# Output values
terraform output
```

## terraform init — Bước Đầu Tiên Luôn Cần

```
Khi nào cần chạy lại init:
  Lần đầu tiên trong một thư mục mới
  Sau khi thêm provider mới vào required_providers
  Sau khi thay đổi cấu hình backend
  Sau khi pull code có thay đổi module source

init làm gì:
  Tải provider plugin xuống .terraform/ folder
  Cấu hình backend (kết nối đến remote state)
  Tải module nếu có khai báo source bên ngoài
  Tạo file .terraform.lock.hcl (khóa chính xác version provider)
```

## .terraform.lock.hcl — Tại Sao Phải Commit File Này

```
File này ghi lại CHÍNH XÁC phiên bản và checksum
của mỗi provider được dùng

Tương tự package-lock.json (npm) hay pom.xml dependencies (Maven)
nhưng cho Terraform providers

Phải commit vào Git:
  Đảm bảo mọi người trong team, và CI/CD pipeline,
  dùng CHÍNH XÁC cùng version provider
  → Tránh tình huống "chạy được trên máy tôi"
```

## Đọc Output Của terraform plan

```
Terraform sẽ làm gì với mỗi resource được ký hiệu bằng dấu:

  + create        resource mới sẽ được tạo
  - destroy       resource sẽ bị xóa
  ~ update in-place  resource sẽ được sửa, không cần xóa tạo lại
  -/+ replace     resource sẽ bị xóa rồi tạo lại (CẨN THẬN!)

Ví dụ output thực tế:

  Terraform will perform the following actions:

  # aws_instance.web will be updated in-place
  ~ resource "aws_instance" "web" {
        id            = "i-0abc123"
      ~ instance_type = "t3.micro" -> "t3.medium"
        tags          = {
            "Name" = "web-server"
        }
    }

  # aws_security_group.old will be destroyed
  - resource "aws_security_group" "old" {
      - id   = "sg-0xyz789" -> null
    }

  Plan: 0 to add, 1 to change, 1 to destroy.

Luôn đọc kỹ dòng cuối: "X to add, Y to change, Z to destroy"
Nếu thấy "destroy" cho resource quan trọng (database, production data)
→ DỪNG LẠI, kiểm tra kỹ tại sao trước khi apply
```

---

# 9. Variables — Tham Số Hóa Cấu Hình

## Tại Sao Cần Variables

Nếu hard-code mọi giá trị trực tiếp vào resource, code không thể tái sử dụng cho môi trường khác (dev, staging, production).

```hcl
# Không tốt — hard-code, không linh hoạt
resource "aws_instance" "web" {
  instance_type = "t3.large"
  # Mỗi lần muốn dùng size khác cho dev/prod phải sửa code trực tiếp
}

# Tốt hơn — dùng variable
resource "aws_instance" "web" {
  instance_type = var.instance_type
  # Giá trị được truyền vào từ bên ngoài
}
```

## Khai Báo Variable

```hcl
variable "instance_type" {
  description = "Loại EC2 instance dùng cho web server"
  type        = string
  default     = "t3.micro"

  validation {
    condition     = contains(["t3.micro", "t3.small", "t3.medium"], var.instance_type)
    error_message = "instance_type phải là một trong: t3.micro, t3.small, t3.medium"
  }
}

variable "environment" {
  description = "Môi trường triển khai (dev, staging, production)"
  type        = string
  # Không có default → bắt buộc người dùng phải cung cấp giá trị
}

variable "allowed_ports" {
  description = "Danh sách port được phép mở"
  type        = list(number)
  default     = [80, 443]
}

variable "tags" {
  description = "Tags chung áp dụng cho mọi resource"
  type        = map(string)
  default     = {}
}

variable "db_password" {
  description = "Mật khẩu database"
  type        = string
  sensitive   = true  # ẩn giá trị này khỏi output console và logs
}
```

## Các Cách Cung Cấp Giá Trị Cho Variable

Terraform có nhiều cách để set giá trị, theo thứ tự ưu tiên từ thấp đến cao (cái sau ghi đè cái trước):

```
1. Giá trị default trong khai báo variable (thấp nhất)

2. File terraform.tfvars (tự động được load nếu tồn tại)
   instance_type = "t3.medium"
   environment   = "production"

3. File *.auto.tfvars (tự động load, có thể có nhiều file)
   network.auto.tfvars
   database.auto.tfvars

4. Environment variable, với prefix TF_VAR_
   export TF_VAR_db_password="supersecret"

5. Flag -var khi chạy lệnh
   terraform apply -var="instance_type=t3.large"

6. Flag -var-file chỉ định file cụ thể
   terraform apply -var-file="production.tfvars"  (ưu tiên cao nhất)
```

```hcl
# Ví dụ file environments/production.tfvars
environment    = "production"
instance_type  = "t3.large"
allowed_ports  = [443]  # production chỉ cho phép HTTPS

tags = {
  Environment = "production"
  CostCenter  = "platform-engineering"
}
```

```bash
# Áp dụng cấu hình cho production
terraform apply -var-file="environments/production.tfvars"

# Áp dụng cấu hình cho dev
terraform apply -var-file="environments/dev.tfvars"
```

## Type Constraints — Kiểm Tra Kiểu Dữ Liệu

```hcl
variable "simple_string" {
  type = string
}

variable "simple_number" {
  type = number
}

variable "simple_bool" {
  type = bool
}

variable "list_of_strings" {
  type = list(string)
}

variable "map_of_numbers" {
  type = map(number)
}

# Object type — cấu trúc phức tạp với field cụ thể
variable "server_config" {
  type = object({
    name          = string
    instance_type = string
    disk_size_gb  = number
    enable_backup = optional(bool, false)  # optional với default value
  })
}

# Cách dùng:
# server_config = {
#   name          = "web-1"
#   instance_type = "t3.medium"
#   disk_size_gb  = 50
# }
# enable_backup không cần khai báo, mặc định là false
```

---

# 10. Output — Lấy Giá Trị Ra Ngoài

## Output Là Gì

Output cho phép Terraform hiển thị giá trị sau khi apply xong, hoặc cho phép module khác/state khác đọc giá trị này.

```hcl
output "instance_public_ip" {
  description = "Địa chỉ IP public của web server"
  value       = aws_instance.web.public_ip
}

output "database_endpoint" {
  description = "Endpoint kết nối database"
  value       = aws_db_instance.main.endpoint
  sensitive   = true  # ẩn giá trị này khỏi console output
}
```

```bash
# Sau khi apply, Terraform tự động hiển thị các output:
Outputs:

instance_public_ip = "54.123.45.67"
database_endpoint = <sensitive>

# Xem giá trị cụ thể (kể cả sensitive):
terraform output database_endpoint

# Xem dưới dạng JSON (để script khác parse)
terraform output -json
```

## Tại Sao Output Quan Trọng

```
Use case 1: Thông tin cần biết sau khi apply
  IP address để SSH vào server
  URL của load balancer
  Connection string của database

Use case 2: Truyền giá trị giữa các module
  Module "networking" output ra subnet_id
  Module "compute" dùng subnet_id đó làm input

Use case 3: Truyền giá trị giữa các state riêng biệt
  State "networking" có output vpc_id
  State "application" đọc vpc_id đó qua remote state data source
  (sẽ giải thích ở phần Data Source)

Use case 4: CI/CD pipeline đọc output để dùng ở bước tiếp theo
  Terraform tạo Kubernetes cluster, output ra cluster endpoint
  Pipeline đọc output đó để cấu hình kubectl trong bước deploy
```

---

# 11. Data Source — Đọc Tài Nguyên Có Sẵn

## Sự Khác Biệt Giữa Resource và Data Source

```
Resource: Terraform TẠO RA và QUẢN LÝ vòng đời của nó
  resource "aws_instance" "web" { ... }
  → Terraform sẽ tạo, sửa, xóa instance này

Data Source: Terraform CHỈ ĐỌC thông tin, không tạo, không quản lý
  data "aws_ami" "ubuntu" { ... }
  → Terraform chỉ truy vấn thông tin về AMI đã tồn tại sẵn,
    không tạo AMI mới, không có quyền xóa nó
```

## Khi Nào Dùng Data Source

```hcl
# Tìm AMI mới nhất của Ubuntu thay vì hard-code ID cụ thể
# (ID của AMI thay đổi theo thời gian khi có version mới)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id  # dùng AMI tìm được
  instance_type = "t3.micro"
}
```

```
Các trường hợp dùng data source phổ biến:

1. Tham chiếu hạ tầng được tạo bởi team khác (không thuộc state của bạn)
   data "aws_vpc" "existing" {
     tags = { Name = "shared-vpc" }
   }

2. Lấy thông tin động (AMI mới nhất, availability zones có sẵn)
   data "aws_availability_zones" "available" {
     state = "available"
   }

3. Đọc giá trị tính toán phía cloud (account ID hiện tại, region hiện tại)
   data "aws_caller_identity" "current" {}
   # data.aws_caller_identity.current.account_id
```

## Remote State Data Source — Liên Kết Giữa Các State

```hcl
# Trong state "application", đọc output từ state "networking"
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "my-company-terraform-state"
    key    = "production/networking/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

resource "aws_instance" "web" {
  subnet_id = data.terraform_remote_state.networking.outputs.public_subnet_id
  # Lấy giá trị output "public_subnet_id" từ state khác
}
```

Đây là cách các layer hạ tầng tách biệt (chia theo Cách 2 trong phần State ở trên) giao tiếp với nhau — không cần copy giá trị thủ công, luôn tự động đồng bộ với thực tế.

---

# 12. Dependency Graph — Terraform Biết Thứ Tự Làm Gì

## Implicit Dependency — Phụ Thuộc Ngầm Định

Terraform tự động hiểu thứ tự cần làm dựa trên cách bạn tham chiếu giữa các resource.

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id   # ← tham chiếu này tạo ra dependency!
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "web" {
  subnet_id = aws_subnet.public.id  # ← dependency tiếp theo
}
```

```
Terraform tự suy ra dependency graph:

  aws_vpc.main
       ↓
  aws_subnet.public
       ↓
  aws_instance.web

→ Tự động: tạo VPC trước, rồi subnet, rồi instance
→ Bạn KHÔNG cần viết "làm cái này trước, cái kia sau"
  Terraform tự hiểu qua việc bạn tham chiếu .id của resource khác

Khi destroy, Terraform làm NGƯỢC LẠI:
  Xóa instance trước, rồi subnet, rồi VPC
  (không thể xóa VPC khi vẫn còn subnet bên trong nó)
```

## Parallel Execution — Tận Dụng Song Song

```
Những resource KHÔNG phụ thuộc lẫn nhau sẽ được tạo SONG SONG:

  aws_vpc.main
       ↓
  ┌────┴────┬─────────┐
  ▼         ▼          ▼
subnet_a  subnet_b   subnet_c   ← ba cái này tạo CÙNG LÚC
  │         │          │         (đều chỉ phụ thuộc vào VPC,
  └────┬────┴──────────┘          không phụ thuộc lẫn nhau)
       ▼
  load_balancer (phụ thuộc cả ba subnet)

Terraform mặc định chạy tối đa 10 operation song song
(có thể điều chỉnh bằng flag -parallelism=N)
```

## Khi Implicit Dependency Không Đủ — Explicit Dependency

Đôi khi có dependency thực tế nhưng không thể hiện qua việc tham chiếu attribute. Lúc này cần khai báo rõ ràng.

```hcl
resource "aws_iam_role_policy" "example" {
  # ... cấu hình policy
}

resource "aws_instance" "web" {
  # Instance này CẦN policy đã tồn tại trước khi chạy
  # (ứng dụng bên trong instance gọi AWS API ngay khi khởi động)
  # nhưng không có attribute nào của policy được dùng trực tiếp trong code

  depends_on = [aws_iam_role_policy.example]
  # Khai báo rõ ràng: "đợi cái này xong trước"
}
```

```
Nguyên tắc: ưu tiên implicit dependency (qua tham chiếu attribute)
Chỉ dùng depends_on khi THỰC SỰ cần thiết — không thể thể hiện
qua tham chiếu tự nhiên

Lạm dụng depends_on làm code khó đọc và mất đi lợi ích
của dependency graph tự động
```

---

# 13. Module — Tái Sử Dụng Cấu Hình

## Module Là Gì

Module là một tập hợp file Terraform được đóng gói lại, có thể tái sử dụng nhiều lần với input khác nhau. Mọi cấu hình Terraform thực ra đều là module — thư mục gốc bạn đang chạy lệnh được gọi là "root module".

## Tại Sao Cần Module

```
Không có module:
  Bạn cần tạo hạ tầng cho 5 microservice khác nhau
  Mỗi microservice cần: load balancer, auto scaling group,
  security group, CloudWatch alarms
  → Copy-paste cùng đoạn code 5 lần
  → Sửa một chỗ phải nhớ sửa cả 5 chỗ
  → Dễ sai sót, dễ không đồng bộ

Với module:
  Viết một lần module "microservice"
  Gọi module đó 5 lần với input khác nhau (tên, port, scale...)
  Sửa logic chung → chỉ sửa một chỗ → áp dụng cho cả 5
```

## Cấu Trúc Một Module

```
modules/
└── web-service/
    ├── main.tf          # resource chính
    ├── variables.tf     # input variables
    ├── outputs.tf       # output values
    └── README.md        # tài liệu mô tả cách dùng
```

```hcl
# modules/web-service/variables.tf
variable "service_name" {
  description = "Tên của service"
  type        = string
}

variable "instance_count" {
  description = "Số lượng instance"
  type        = number
  default     = 2
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

# modules/web-service/main.tf
resource "aws_launch_template" "this" {
  name_prefix   = "${var.service_name}-"
  instance_type = var.instance_type
}

resource "aws_autoscaling_group" "this" {
  name             = var.service_name
  desired_capacity = var.instance_count
  min_size         = var.instance_count
  max_size         = var.instance_count * 2

  launch_template {
    id = aws_launch_template.this.id
  }
}

# modules/web-service/outputs.tf
output "asg_name" {
  value = aws_autoscaling_group.this.name
}
```

## Gọi Module Từ Root Module

```hcl
# main.tf ở root module
module "user_service" {
  source = "./modules/web-service"

  service_name   = "user-service"
  instance_count = 3
  instance_type  = "t3.medium"
}

module "order_service" {
  source = "./modules/web-service"

  service_name   = "order-service"
  instance_count = 5
  instance_type  = "t3.large"
}

# Tham chiếu output của module
output "user_service_asg" {
  value = module.user_service.asg_name
}
```

```
Cùng một module, hai lần gọi với input khác nhau
→ Tạo ra hai hạ tầng độc lập, mỗi cái phù hợp với nhu cầu riêng
→ Code chung (logic launch_template, autoscaling_group) chỉ viết một lần
```

## Nguồn Module — Source

```hcl
# Local path — module nằm trong cùng repository
module "example" {
  source = "./modules/web-service"
}

# Terraform Registry — module công khai do cộng đồng hoặc công ty publish
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
}

# Git repository — module riêng của công ty, không công khai
module "internal_module" {
  source = "git::https://github.com/mycompany/terraform-modules.git//web-service?ref=v1.2.0"
}
```

```
Registry modules (như terraform-aws-modules) thường đã được
cộng đồng kiểm thử kỹ, hỗ trợ nhiều use case, có sẵn best practice
→ Nên ưu tiên dùng trước khi tự viết module mới từ đầu
  cho những thành phần phổ biến (VPC, EKS, RDS...)
```

---

# 14. Meta-Arguments — count, for_each, depends_on

Meta-arguments là các argument đặc biệt có thể dùng với BẤT KỲ resource hoặc module nào, không phải argument cụ thể của resource type đó.

## count — Tạo Nhiều Bản Sao Theo Số Lượng

```hcl
resource "aws_instance" "web" {
  count = 3  # tạo 3 instance giống hệt nhau

  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "web-server-${count.index}"
    # count.index là số thứ tự: 0, 1, 2
    # → web-server-0, web-server-1, web-server-2
  }
}

# Tham chiếu một instance cụ thể trong list
output "first_instance_id" {
  value = aws_instance.web[0].id
}

# Tham chiếu TẤT CẢ instance (trả về list)
output "all_instance_ids" {
  value = aws_instance.web[*].id
}
```

## for_each — Tạo Nhiều Bản Sao Theo Map Hoặc Set

```hcl
# Dùng khi mỗi resource cần một bộ giá trị riêng biệt, không chỉ là số đếm
variable "environments" {
  default = {
    dev = {
      instance_type = "t3.micro"
    }
    staging = {
      instance_type = "t3.small"
    }
    production = {
      instance_type = "t3.large"
    }
  }
}

resource "aws_instance" "web" {
  for_each = var.environments

  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = each.value.instance_type

  tags = {
    Name        = "web-${each.key}"
    Environment = each.key
  }
}

# Tham chiếu một resource cụ thể bằng key
output "production_instance_id" {
  value = aws_instance.web["production"].id
}
```

## count vs for_each — Khi Nào Dùng Cái Nào

```
count phù hợp khi:
  Các resource giống hệt nhau, chỉ khác số lượng
  Không cần phân biệt resource bằng tên có ý nghĩa

for_each phù hợp khi:
  Mỗi resource cần config khác nhau (không chỉ là số đếm)
  Muốn tham chiếu resource bằng tên rõ ràng (vd: "production")
  thay vì chỉ số (vd: [2])

VẤN ĐỀ QUAN TRỌNG với count:
  Nếu bạn xóa phần tử ở GIỮA list, Terraform coi đó là
  thay đổi TẤT CẢ phần tử phía sau (vì index dịch chuyển)
  → Có thể gây ra việc xóa và tạo lại nhầm nhiều resource!

  Ví dụ: có ["dev", "staging", "prod"] dùng count
  Xóa "staging" → list còn ["dev", "prod"]
  Terraform thấy: index 1 đổi từ "staging" thành "prod"
  → Nghĩ rằng cần destroy resource cũ ở index 1, tạo mới
  → Trong khi thực ra chỉ cần xóa "staging", giữ nguyên "prod"!

  for_each tránh được vấn đề này vì dùng KEY thay vì index
  → Xóa "staging" khỏi map → Terraform chỉ xóa đúng resource đó
  → "prod" không bị ảnh hưởng gì cả

Khuyến nghị: ưu tiên for_each trừ khi thực sự chỉ cần đếm số lượng
giống hệt nhau hoàn toàn
```

---

# 15. Workspace — Quản Lý Nhiều Môi Trường

## Workspace Là Gì

Terraform workspace cho phép cùng một bộ cấu hình quản lý nhiều state riêng biệt — thường dùng để tách dev/staging/production.

```bash
# Tạo workspace mới
terraform workspace new staging
terraform workspace new production

# Liệt kê các workspace
terraform workspace list
# * default
#   staging
#   production

# Chuyển sang workspace khác
terraform workspace select production

# Xem workspace hiện tại
terraform workspace show
```

```hcl
# Dùng workspace name trong code
resource "aws_instance" "web" {
  instance_type = terraform.workspace == "production" ? "t3.large" : "t3.micro"

  tags = {
    Environment = terraform.workspace
  }
}
```

## Workspace Không Phải Lúc Nào Cũng Là Giải Pháp Tốt Nhất

```
Workspace phù hợp khi:
  Cấu hình GIỐNG HỆT nhau giữa các môi trường, chỉ khác giá trị
  (vd: scale nhỏ hơn ở dev, scale lớn hơn ở production
  nhưng cùng kiến trúc)

  Team nhỏ, đơn giản hóa workflow

Workspace KHÔNG phù hợp khi:
  Môi trường có kiến trúc khác biệt đáng kể
  (vd: production có multi-region, dev chỉ có một region)

  Cần access control riêng biệt cho từng môi trường
  (workspace dùng chung credentials, khó tách quyền)

  Cần backend configuration khác nhau hoàn toàn

Thay thế phổ biến hơn trong production: tách thư mục riêng biệt
  environments/
  ├── dev/
  │   ├── main.tf
  │   └── terraform.tfvars
  ├── staging/
  │   ├── main.tf
  │   └── terraform.tfvars
  └── production/
      ├── main.tf
      └── terraform.tfvars

  Mỗi thư mục có backend riêng, state riêng, có thể có
  cấu trúc khác nhau hoàn toàn nếu cần
  Module dùng chung được gọi từ mỗi thư mục với input khác nhau
```

# 16. Provisioner — Khi Nào Thực Sự Cần

## Provisioner Là Gì

Provisioner cho phép Terraform thực thi lệnh (chạy script, copy file) trên resource sau khi nó được tạo ra, hoặc trước khi nó bị xóa.

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  provisioner "remote-exec" {
    inline = [
      "sudo apt update",
      "sudo apt install -y nginx",
      "sudo systemctl start nginx"
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

## Tại Sao Provisioner Là Lựa Chọn Cuối Cùng

HashiCorp (công ty tạo ra Terraform) chính thức khuyến cáo: provisioner nên là **giải pháp cuối cùng**, không phải cách tiếp cận mặc định.

```
Vấn đề với provisioner:

Terraform không quản lý được trạng thái của những gì
provisioner thực thi. Terraform chỉ biết "đã chạy lệnh này chưa",
không biết "lệnh này có còn đúng với trạng thái mong muốn không"

Nếu provisioner fail giữa chừng (network timeout, lỗi script)
→ Resource được tạo ra (vd: instance đã chạy) nhưng bị đánh dấu
"tainted" — Terraform sẽ destroy và tạo lại ở lần apply tiếp theo

Provisioner làm cho cấu hình kém "declarative" hơn —
nó là một chuỗi LỆNH cần thực thi, không phải MÔ TẢ trạng thái
mong muốn — đi ngược lại triết lý cốt lõi của Terraform
```

## Giải Pháp Tốt Hơn Thay Thế Provisioner

```
Thay vì SSH vào cài đặt phần mềm sau khi tạo server:

1. Dùng pre-baked image (Image đã build sẵn)
   Dùng công cụ như Packer để build sẵn image có ứng dụng
   cài đặt đầy đủ → Terraform chỉ cần launch image đó
   → Không cần chạy lệnh nào sau khi tạo, instant ready

2. Dùng cloud-init / user_data
   resource "aws_instance" "web" {
     user_data = file("setup-script.sh")
   }
   Cloud provider tự chạy script này khi instance khởi động
   lần đầu, không cần Terraform phải SSH vào

3. Dùng configuration management tool riêng biệt
   Terraform chỉ tạo hạ tầng (server, network)
   Ansible/Chef/Puppet xử lý việc cài đặt cấu hình bên trong
   Đây là "đúng công cụ cho đúng việc"

4. Dùng Kubernetes thay vì raw VM
   Nếu ứng dụng container hóa, deploy lên Kubernetes
   Terraform chỉ tạo cluster, việc deploy app là việc khác
```

```hcl
# Cách tiếp cận tốt hơn — dùng user_data thay vì provisioner
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  user_data = <<-EOF
    #!/bin/bash
    apt update
    apt install -y nginx
    systemctl start nginx
  EOF
  # Script này chạy NGAY KHI instance boot, do cloud provider
  # tự xử lý, không cần Terraform phải connect SSH
}
```

---

# 17. Import — Đưa Tài Nguyên Có Sẵn Vào Terraform

## Vấn Đề Cần Giải Quyết

Rất nhiều tổ chức bắt đầu với hạ tầng được tạo thủ công (qua console), sau đó muốn chuyển sang quản lý bằng Terraform. Import giải quyết bài toán này — đưa resource đã tồn tại vào quyền quản lý của Terraform mà không cần xóa và tạo lại.

## Import Block (Cách Hiện Đại, Terraform 1.5+)

```hcl
import {
  to = aws_instance.web
  id = "i-0abc123def456789"
}

# Cần viết resource block tương ứng để Terraform biết
# config nào sẽ áp dụng cho resource được import
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  # Các giá trị này CẦN khớp với resource thực tế,
  # nếu không Terraform sẽ thấy có thay đổi cần áp dụng
}
```

```bash
# Chạy plan để xem Terraform sẽ làm gì
terraform plan
# Output sẽ cho biết: import resource này, và liệu config
# hiện tại có khớp hoàn toàn với thực tế hay không

terraform apply
```

## Quy Trình Import Thực Tế

```
Bước 1: Xác định resource thực tế cần import (ID của nó)

Bước 2: Viết resource block trong code TRƯỚC,
        cố gắng đoán đúng các argument hiện tại

Bước 3: Chạy import (qua import block hoặc lệnh terraform import)

Bước 4: Chạy terraform plan
        Nếu plan cho thấy "no changes" → config khớp hoàn hảo
        Nếu plan cho thấy changes → cần sửa code để khớp
        với thực tế (KHÔNG để Terraform "sửa" resource thật
        chỉ vì code của bạn đoán sai!)

Bước 5: Lặp lại bước 4 cho đến khi plan completely clean
        (không có thay đổi nào được đề xuất)
```

```
Lưu ý quan trọng: import KHÔNG tự động viết code Terraform cho bạn
(một số phiên bản mới có lệnh hỗ trợ generate config, nhưng
vẫn cần review kỹ trước khi tin tưởng hoàn toàn)

Quá trình import có thể tốn thời gian với hạ tầng lớn —
nên làm từng phần nhỏ, verify kỹ mỗi bước, không vội vàng
import hàng trăm resource cùng lúc
```

---

# 18. Terraform Trong Team — Quy Trình Thực Tế

## Git Workflow Cho Infrastructure Code

```
Quy trình thực tế ở một team trưởng thành:

1. Engineer tạo branch mới từ main
   git checkout -b add-redis-cache

2. Sửa file .tf — thêm resource Redis cache mới

3. Chạy local validation trước khi push
   terraform fmt -check
   terraform validate
   terraform plan   (xem trước thay đổi sẽ là gì)

4. Push code, tạo Pull Request

5. CI Pipeline tự động chạy:
   terraform fmt -check    (kiểm tra format)
   terraform validate      (kiểm tra cú pháp)
   terraform plan          (tính toán thay đổi)
   → Comment kết quả plan vào PR để mọi người review

6. Team review Pull Request
   Đọc kỹ phần plan: có gì sẽ bị destroy không?
   Có hợp lý với business requirement không?
   Approve

7. Merge vào main

8. CI/CD Pipeline tự động (hoặc cần manual trigger
   cho production) chạy:
   terraform apply
   → Áp dụng thay đổi thật vào hạ tầng
```

## Tại Sao Review Plan Trong PR Quan Trọng

```
Đây là lợi ích lớn nhất của Infrastructure as Code so với
việc thay đổi thủ công qua console:

Trước khi BẤT KỲ thay đổi nào chạm vào production,
TOÀN BỘ team có thể thấy CHÍNH XÁC:
  Resource nào sẽ được tạo
  Resource nào sẽ bị sửa
  Resource nào sẽ bị XÓA (cảnh báo lớn nhất!)

Nếu một Pull Request có dòng:
  # aws_db_instance.production will be destroyed
- resource "aws_db_instance" "production" {

→ Team ngay lập tức nhận ra có vấn đề nghiêm trọng
  TRƯỚC KHI nó thực sự xảy ra, không phải sau khi
  database đã biến mất
```

## CI/CD Pipeline Cho Terraform (Ví Dụ Generic)

```yaml
# Ví dụ cấu trúc pipeline (generic, không gắn cụ thể nền tảng CI nào)

stages:
  validate:
    steps:
      - terraform fmt -check -recursive
      - terraform init -backend=false
      - terraform validate

  plan:
    steps:
      - terraform init
      - terraform plan -out=tfplan
      - # Post plan output làm comment vào Pull Request

  # Stage này chỉ chạy khi PR được merge vào main
  apply:
    when: branch == main
    steps:
      - terraform init
      - terraform apply tfplan
      # Dùng plan ĐÃ ĐƯỢC REVIEW, không tính lại plan mới
      # Đảm bảo apply đúng những gì đã được approve

  # Đối với production, thường thêm bước approval thủ công
  apply_production:
    when: branch == main && environment == production
    needs_manual_approval: true
    steps:
      - terraform apply tfplan
```

## Phân Quyền Truy Cập

```
Không phải ai trong team cũng nên có quyền chạy
terraform apply trực tiếp vào production

Mô hình phổ biến:

  Developer: có quyền chạy plan, không có quyền apply trực tiếp
             Apply chỉ chạy qua CI/CD pipeline sau khi PR approved

  CI/CD service account: có quyền apply, nhưng credentials
             được giữ riêng, không ai SSH/access trực tiếp

  Production apply: thường cần thêm bước approval
             (một người khác ngoài tác giả PR phải click approve
             trước khi pipeline thực sự chạy apply)

Nguyên tắc: KHÔNG AI chạy terraform apply trực tiếp từ máy cá nhân
vào production. Mọi thay đổi production đi qua pipeline có
audit trail đầy đủ
```

---

# 19. Các Sai Lầm Thường Gặp

## Sai Lầm 1: Không Dùng Remote State Ngay Từ Đầu

```
Vấn đề:
  Bắt đầu dự án với local state "để học cho nhanh"
  Dự án phát triển, thêm người vào team
  Phát hiện ra mỗi người có một bản state riêng không đồng bộ

Giải pháp:
  Cấu hình remote state NGAY TỪ KHI BẮT ĐẦU dự án thật
  (kể cả khi chỉ có một người làm việc lúc đầu)
  Việc chuyển từ local sang remote sau này phức tạp hơn
  nhiều so với cấu hình đúng từ đầu
```

## Sai Lầm 2: Hard-code Giá Trị Nhạy Cảm

```hcl
# SAI — password xuất hiện trực tiếp trong code, commit vào Git
resource "aws_db_instance" "main" {
  password = "SuperSecret123!"
}
```

```
Vấn đề:
  Password nằm trong Git history MÃI MÃI, kể cả sau khi xóa
  khỏi code (lịch sử Git vẫn còn commit cũ)
  Bất kỳ ai có quyền đọc repository đều thấy được password

Giải pháp:
  Dùng secret manager bên ngoài (Vault, hoặc dịch vụ
  secret manager của cloud provider)
  Terraform đọc secret tại thời điểm apply, không bao giờ
  lưu giá trị plaintext vào code

  data "vault_generic_secret" "db_password" {
    path = "secret/database/main"
  }

  resource "aws_db_instance" "main" {
    password = data.vault_generic_secret.db_password.data["password"]
  }

  Lưu ý: dù không hard-code, giá trị secret VẪN sẽ xuất hiện
  trong state file! → State file PHẢI được mã hóa và bảo vệ
  nghiêm ngặt, không bao giờ commit vào Git
```

## Sai Lầm 3: Một State Khổng Lồ Cho Toàn Bộ Tổ Chức

```
Vấn đề:
  Một file state quản lý TẤT CẢ mọi thứ — từ networking
  đến từng microservice nhỏ nhất

  terraform plan mất 10+ phút chỉ để tính toán
  Một lỗi nhỏ ở một resource có thể block toàn bộ team
  khác đang cần apply thay đổi không liên quan
  Lock conflict xảy ra liên tục

Giải pháp:
  Chia state theo blast radius và theo team ownership
  Networking layer riêng, database layer riêng,
  mỗi service riêng nếu cần
  Dùng data source hoặc remote state để liên kết giữa các layer
```

## Sai Lầm 4: Không Kiểm Tra Kỹ Plan Trước Khi Apply

```
Vấn đề thường gặp nhất gây ra incident:
  Chạy terraform apply, thấy có "X to destroy"
  Không đọc kỹ resource nào sẽ bị destroy
  Gõ "yes" theo phản xạ
  → Database production bị xóa, mất dữ liệu

Giải pháp:
  LUÔN đọc kỹ phần Plan trước khi confirm apply
  Đặc biệt chú ý dòng có dấu "-" (destroy) hoặc "-/+" (replace)
  Với resource quan trọng, dùng lifecycle { prevent_destroy = true }
  để Terraform tự chặn destroy nhầm
  Tách riêng plan và apply trong CI/CD, có bước review giữa
  hai bước này (không tự động apply ngay sau plan)
```

## Sai Lầm 5: Quản Lý Quá Nhiều Thứ Bằng count Khi Nên Dùng for_each

```
Đã giải thích chi tiết ở Section 14 —
dùng count cho resource cần phân biệt rõ ràng theo tên
dễ dẫn đến việc destroy/recreate nhầm khi list thay đổi thứ tự
```

## Sai Lầm 6: Không Ghim Version Của Provider

```hcl
# SAI — không giới hạn version
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      # Không có version constraint
    }
  }
}
```

```
Vấn đề:
  Provider tự động lấy version mới nhất mỗi lần init
  Version mới có thể có breaking change
  Code chạy tốt hôm qua, hôm nay tự nhiên fail
  vì provider đã update mà không ai biết

Giải pháp:
  Luôn ghim version constraint (như đã giải thích Section 4)
  Commit file .terraform.lock.hcl vào Git
  Update provider version một cách có chủ đích, có testing,
  không để nó tự động trôi
```

---

# 20. Terraform Best Practices

## Cấu Trúc Thư Mục Khuyến Nghị

```
project/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   └── (cấu trúc tương tự)
│   └── production/
│       └── (cấu trúc tương tự)
│
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/
│   │   └── ...
│   └── database/
│       └── ...
│
└── README.md
```

## Naming Convention Nhất Quán

```hcl
# Nguyên tắc đặt tên resource:
# Dùng snake_case, mô tả rõ mục đích, không lặp lại loại resource trong tên

# Tốt:
resource "aws_instance" "web_server" { }
resource "aws_security_group" "web_sg" { }

# Không tốt — lặp lại thông tin đã có trong resource type:
resource "aws_instance" "aws_instance_web_server" { }

# Variable và output cũng nên có description rõ ràng,
# luôn luôn — kể cả khi tên đã có vẻ rõ ràng
variable "instance_type" {
  description = "EC2 instance type, ví dụ t3.micro hoặc t3.large"
  type        = string
}
```

## Tag Resource Nhất Quán

```hcl
# Định nghĩa tag chung một lần, áp dụng cho mọi resource
locals {
  common_tags = {
    Project     = "my-application"
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}

resource "aws_instance" "web" {
  # ...
  tags = merge(local.common_tags, {
    Name = "web-server"
  })
}
```

```
Tại sao tag nhất quán quan trọng:
  Dễ filter resource theo project/environment trên console
  Cost tracking — biết chi phí của environment nào, project nào
  Dễ tìm resource nào được tạo bởi Terraform vs tạo thủ công
  (ManagedBy = "terraform" giúp phân biệt rõ ràng)
```

## Sử Dụng Linter và Security Scanner

```
Trước khi merge code Terraform, nên chạy qua các công cụ kiểm tra:

  terraform fmt    — format code đúng chuẩn (built-in)
  terraform validate — kiểm tra cú pháp (built-in)

  Linter bổ sung (công cụ bên thứ ba phổ biến):
    Kiểm tra best practice, phát hiện lỗi tiềm ẩn,
    style không nhất quán

  Security scanner (công cụ bên thứ ba phổ biến):
    Phát hiện misconfiguration nguy hiểm
    Ví dụ: security group mở port SSH cho 0.0.0.0/0,
    storage bucket public accessible,
    encryption không được bật cho database

Tích hợp các công cụ này vào CI pipeline để tự động
chặn merge nếu phát hiện vấn đề nghiêm trọng
```

## Module Versioning

```hcl
# Khi gọi module nội bộ qua Git, LUÔN ghim version cụ thể
module "web_service" {
  source = "git::https://github.com/mycompany/tf-modules.git//web-service?ref=v2.3.1"
  # KHÔNG dùng ref=main — main có thể thay đổi bất cứ lúc nào
  # gây ra thay đổi không mong muốn ở mọi nơi gọi module này
}
```

```
Khi module nội bộ thay đổi, tăng version theo Semantic Versioning:
  Patch (v2.3.1 → v2.3.2): bug fix, không thay đổi behavior
  Minor (v2.3.0 → v2.4.0): thêm tính năng mới, backward compatible
  Major (v2.0.0 → v3.0.0): breaking change, cần action từ
  người dùng module để upgrade
```

## Đừng Tự Động Apply Production Mà Không Có Approval

```
Pipeline tốt cho production:

  Merge vào main
       ↓
  Auto-deploy vào DEV (không cần approval, rủi ro thấp)
       ↓
  Auto-deploy vào STAGING (không cần approval)
       ↓
  Manual approval gate ← một người review và click "Approve"
       ↓
  Deploy vào PRODUCTION

Đây không phải là thiếu tin tưởng vào automation —
đây là defense in depth. Plan đã được review trong PR,
nhưng có thêm một lớp kiểm tra cuối cùng trước khi
chạm vào hệ thống có real user traffic là hợp lý
```

---

## Tóm Tắt Toàn Bộ

```
TRIẾT LÝ CỐT LÕI:
  Declarative — mô tả trạng thái mong muốn, không phải các bước
  Idempotent — apply nhiều lần cho cùng kết quả
  Plan trước, Apply sau — luôn review trước khi thay đổi thật

KIẾN TRÚC:
  Terraform Core (engine) + Provider (plugin kết nối dịch vụ thật)
  HCL là ngôn ngữ cấu hình — block, argument, expression

STATE:
  State = bộ nhớ của Terraform, ánh xạ code ↔ resource thực tế
  Remote state bắt buộc khi làm việc team
  State locking tránh xung đột khi nhiều người cùng apply
  Không bao giờ sửa state file bằng tay, dùng terraform state *

VARIABLES VÀ OUTPUT:
  Variables tham số hóa cấu hình cho nhiều môi trường
  Output lấy giá trị ra, truyền giữa module/state

DEPENDENCY:
  Implicit dependency qua tham chiếu attribute (ưu tiên)
  Explicit dependency qua depends_on (chỉ khi cần thiết)
  Terraform tự chạy song song những gì không phụ thuộc nhau

MODULE:
  Đóng gói cấu hình tái sử dụng
  Ghim version khi gọi module nội bộ qua Git

META-ARGUMENTS:
  for_each ưu tiên hơn count khi cần phân biệt theo tên
  count phù hợp cho resource giống hệt nhau, chỉ khác số lượng

PROVISIONER:
  Giải pháp cuối cùng, không phải mặc định
  Ưu tiên: pre-baked image, user_data, configuration management
  tool riêng biệt

QUY TRÌNH TEAM:
  Pull Request → CI chạy plan → Review → Merge → CD apply
  Production cần thêm manual approval gate
  Không ai apply trực tiếp từ máy cá nhân vào production

SAI LẦM CẦN TRÁNH:
  Local state khi làm team
  Hard-code secret trong code
  Một state khổng lồ cho mọi thứ
  Không đọc kỹ plan trước khi apply
  Không ghim version provider
```

## 📎 Tài Liệu Tham Khảo

| Chủ đề | Link |
|---|---|
| Terraform Documentation | <https://developer.hashicorp.com/terraform/docs> |
| HCL Syntax | <https://developer.hashicorp.com/terraform/language/syntax/configuration> |
| Terraform Registry | <https://registry.terraform.io> |
| State Management | <https://developer.hashicorp.com/terraform/language/state> |
| Module Development | <https://developer.hashicorp.com/terraform/language/modules/develop> |
| Provisioners (và lý do tránh dùng) | <https://developer.hashicorp.com/terraform/language/resources/provisioners/syntax> |
| Best Practices | <https://developer.hashicorp.com/well-architected-framework> |
