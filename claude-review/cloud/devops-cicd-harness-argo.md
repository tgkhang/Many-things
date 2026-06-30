# 🚀 DevOps, CI/CD, Harness & Argo
>
> Từ triết lý đến tool — GitOps, pipelines, deployment strategies, Argo, Harness

---

## Mục Lục

1. [DevOps — Văn Hóa Và Triết Lý](#1-devops--văn-hóa-và-triết-lý)
2. [CI — Continuous Integration](#2-ci--continuous-integration)
3. [CD — Continuous Delivery vs Deployment](#3-cd--continuous-delivery-vs-deployment)
4. [Pipeline Anatomy — Giải Phẫu Một Pipeline](#4-pipeline-anatomy--giải-phẫu-một-pipeline)
5. [GitOps — Khi Git Là Source Of Truth](#5-gitops--khi-git-là-source-of-truth)
6. [Branching Strategies — Chiến Lược Nhánh](#6-branching-strategies--chiến-lược-nhánh)
7. [Deployment Strategies — Chiến Lược Triển Khai](#7-deployment-strategies--chiến-lược-triển-khai)
8. [Environment Management](#8-environment-management)
9. [Secret Management Trong Pipeline](#9-secret-management-trong-pipeline)
10. [ArgoCD — GitOps Controller](#10-argocd--gitops-controller)
11. [Argo Rollouts — Progressive Delivery](#11-argo-rollouts--progressive-delivery)
12. [Argo Workflows — Pipeline Engine](#12-argo-workflows--pipeline-engine)
13. [Harness — Enterprise CI/CD Platform](#13-harness--enterprise-cicd-platform)
14. [Infrastructure as Code Trong Pipeline](#14-infrastructure-as-code-trong-pipeline)
15. [DevSecOps — Security Trong Pipeline](#15-devsecops--security-trong-pipeline)

---

# 1. DevOps — Văn Hóa Và Triết Lý

## Tại Sao DevOps Ra Đời

Trước DevOps, phần lớn công ty có hai nhóm hoàn toàn tách biệt:

```
Development team:
  Mục tiêu: ship feature nhanh
  Bị đánh giá bằng: số feature hoàn thành
  Mindset: "Done means working on my machine"

Operations team:
  Mục tiêu: hệ thống ổn định
  Bị đánh giá bằng: uptime
  Mindset: "Change is the enemy of stability"

Kết quả:
  Dev tạo code → "throw over the wall" cho Ops
  Ops nhận code → không hiểu, không biết tại sao fail → blame Dev
  Dev không biết production fail thế nào → không fix được
  Release: tháng một lần, cần deploy window cuối tuần
  Khi fail: "It works on Dev's machine" vs "It worked before you deployed"
```

DevOps phá bỏ bức tường này. Không phải là tạo thêm team mới, mà là thay đổi cách Dev và Ops làm việc cùng nhau — hoặc thậm chí merge thành một team.

## CALMS — Framework Của DevOps

```
C — Culture (Văn hóa):
  Collaboration thay vì blame
  Shared responsibility cho uptime VÀ feature velocity
  Fail fast và học hỏi từ thất bại

A — Automation (Tự động hóa):
  Automate mọi thứ có thể: build, test, deploy, infra provisioning
  Manual process là toil cần loại bỏ

L — Lean:
  Giảm batch size (deploy nhỏ, thường xuyên hơn deploy lớn, ít lần)
  Identify và loại bỏ bottleneck trong workflow
  Continuous improvement

M — Measurement (Đo lường):
  Track metrics: deployment frequency, lead time, MTTR, change failure rate
  Quyết định dựa trên data, không phải gut feeling

S — Sharing:
  Chia sẻ knowledge, tool, practice
  Không siloed — Dev hiểu infra, Ops hiểu code
```

## DORA Metrics — Đo Lường DevOps Performance

DORA (DevOps Research and Assessment) xác định 4 metrics đo lường độ hiệu quả của team:

```
1. Deployment Frequency:
   Bạn deploy production bao nhiêu lần?
   Elite: nhiều lần mỗi ngày
   High: mỗi ngày đến mỗi tuần
   Medium: mỗi tuần đến mỗi tháng
   Low: ít hơn mỗi tháng

2. Lead Time for Changes:
   Từ khi commit code đến khi code chạy ở production mất bao lâu?
   Elite: < 1 giờ
   High: 1 ngày đến 1 tuần
   Medium: 1 tuần đến 1 tháng
   Low: > 1 tháng

3. Mean Time to Restore (MTTR):
   Khi hệ thống fail, mất bao lâu để restore?
   Elite: < 1 giờ
   High: < 1 ngày
   Medium: < 1 tuần
   Low: > 1 tuần

4. Change Failure Rate:
   Bao nhiêu % deploy dẫn đến failure (cần rollback, hotfix)?
   Elite: 0-15%
   High: 16-30%
   Medium/Low: > 30%
```

---

# 2. CI — Continuous Integration

## Continuous Integration Là Gì

CI là practice mà developer thường xuyên merge code vào shared branch (thường là main hoặc develop), và mỗi merge được automatically build và tested.

```
Không có CI:
  Developer làm việc trên feature branch 2 tuần
  Merge vào main → conflicts khổng lồ → "merge hell"
  Build fail → không biết lỗi xuất hiện khi nào
  Test không được chạy → bug vào production

Với CI:
  Developer merge nhỏ, thường xuyên (ít nhất mỗi ngày)
  Mỗi merge → CI pipeline tự động chạy
  Build, test trong vài phút
  Nếu fail → developer biết ngay, fix ngay khi còn nhớ code
```

## CI Pipeline Cơ Bản

```
Code push hoặc Pull Request →
  ↓
Checkout source code
  ↓
Install dependencies
  ↓
Lint & Code Quality checks
  ↓
Unit Tests
  ↓
Build artifact (JAR, Docker image)
  ↓
Integration Tests
  ↓
Security scan
  ↓
Publish artifact to registry
```

## Nguyên Tắc CI Tốt

**Fast feedback** — pipeline phải chạy nhanh. Nếu chờ 1 tiếng thì developer đã context switch sang việc khác.

```
Target: pipeline xong trong 10-15 phút
  Lint/format check: < 1 phút
  Unit tests: < 5 phút
  Build: < 3 phút
  Integration tests: < 5 phút (chọn lọc, không phải tất cả)
  
Nếu tổng > 15 phút:
  Parallelism: chạy test suites song song
  Caching: cache dependencies, không download lại mỗi lần
  Test selection: chỉ chạy tests liên quan đến thay đổi
```

**Every commit is verified** — không có "I'll fix tests later". Pipeline fail → không merge.

**Fix broken build ngay lập tức** — broken build là emergency. Mọi người khác bị block.

---

# 3. CD — Continuous Delivery vs Deployment

Đây là hai khái niệm hay bị nhầm lẫn. Khác nhau một từ nhưng nghĩa khác nhau.

## Continuous Delivery

Mọi commit đã qua CI có thể được deploy lên production **bất cứ lúc nào** — nhưng việc deploy cần **manual trigger** (một cái click, một lệnh).

```
CI passes → Artifact ready → Manual decision to deploy → Deploy production

"Ready to deploy at any time" ≠ "Auto deployed"
Business có thể quyết định khi nào deploy
→ Cho phép: "Deploy vào thứ Hai sau khi Ops team đã sẵn sàng"
```

## Continuous Deployment

Mọi commit đã qua CI **tự động** được deploy lên production, không cần manual intervention.

```
CI passes → Auto deploy to production

Cần:
  Test coverage rất cao (bạn tin tưởng automation)
  Solid rollback mechanism
  Feature flags (để tắt feature nếu cần mà không cần rollback)
  Good monitoring (detect ngay nếu có vấn đề)

Phù hợp cho:
  Web apps, SaaS, startup muốn move nhanh
  
Không phù hợp cho:
  Mobile app (app store review)
  Regulated industries cần compliance approval
  Embedded firmware
```

---

# 4. Pipeline Anatomy — Giải Phẫu Một Pipeline

## Stages và Jobs

Pipeline được tổ chức thành stages (giai đoạn). Các jobs trong cùng stage thường chạy song song. Stage này phải xong mới bắt đầu stage tiếp theo.

```
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 1: Validate (song song)                                    │
│   [Lint]    [Unit Tests]    [Security Scan]    [Type Check]     │
└─────────────────────────────────────────────────────────────────┘
              ↓ (nếu tất cả pass)
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 2: Build                                                   │
│   [Build Docker Image]    [Build Frontend Bundle]                │
└─────────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 3: Integration Test (cần cả image và bundle)               │
│   [API Tests]    [E2E Tests on Staging-like env]                 │
└─────────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 4: Publish                                                 │
│   [Push image to registry]    [Publish artifacts]                │
└─────────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 5: Deploy (thứ tự quan trọng)                             │
│   [Deploy to Dev] → [Deploy to Staging] → [Manual Gate]         │
│                                         → [Deploy to Production] │
└─────────────────────────────────────────────────────────────────┘
```

## Artifacts — Sản Phẩm Của Pipeline

Artifact là output của build stage, được dùng bởi các stage tiếp theo. Quan trọng: build một lần, deploy nhiều lần (không build lại ở mỗi environment).

```
Nguyên tắc: Build once, deploy many
  SAI: build Docker image ở dev environment, build lại ở staging
  → Hai image có thể khác nhau (khác dependencies, khác OS updates)
  
  ĐÚNG: build image một lần, tag với commit SHA
  → Deploy cùng image đó lên dev, staging, production
  → Đảm bảo "what you test is what you deploy"

Artifact examples:
  Docker image: myapp:abc123def456 (commit SHA làm tag)
  JAR file: myapp-1.2.3.jar
  npm package: mylib@2.0.1.tgz
  Helm chart: myapp-chart-0.5.0.tgz
```

## Caching Trong Pipeline

Dependencies download chiếm nhiều thời gian pipeline. Cache để tái sử dụng.

```
Các thứ nên cache:
  Node.js: node_modules/ (cache theo package-lock.json hash)
  Maven: ~/.m2/repository (cache theo pom.xml hash)
  Docker layers: layers không thay đổi không rebuild

Cache invalidation:
  Cache key thường là hash của dependency file
  Nếu package.json thay đổi → cache miss → download lại
  Nếu package.json không thay đổi → cache hit → tiết kiệm 2-5 phút
```

---

# 5. GitOps — Khi Git Là Source Of Truth

## GitOps Là Gì

GitOps là phương pháp vận hành hệ thống trong đó **Git repository là source of truth duy nhất** cho cả code lẫn infrastructure. Mọi thay đổi được thực hiện qua Pull Request vào Git — không ai SSH vào server để thay đổi.

```
Trước GitOps:
  Dev merge code → pipeline build image → pipeline SSH vào server → update container
  Ai đó SSH vào server → kubectl edit deployment → thay đổi trực tiếp
  → Không ai biết ai đã thay đổi gì
  → Config drift: thực tế khác với những gì code nói

GitOps:
  Mọi desired state được lưu trong Git
  Git repository: "Tôi muốn app version 1.2.3 chạy trên production với 3 replicas"
  GitOps controller (ArgoCD, Flux) watch Git
  Khi Git thay đổi → controller sync để thực tế match với desired state
  Không ai có thể thay đổi cluster mà không qua Git PR
```

## Pull Model vs Push Model

Đây là sự khác biệt quan trọng giữa traditional CI/CD và GitOps.

```
Push model (traditional CI/CD):
  Pipeline chạy → push changes vào cluster
  Pipeline cần credentials để access cluster (thường là strong credentials)
  Pipeline "ngoài" cluster push "vào trong"

Pull model (GitOps):
  Controller chạy TRONG cluster
  Controller liên tục pull từ Git
  Controller reconcile actual state với desired state từ Git
  Không cần expose cluster ra ngoài cho pipeline
  → Security tốt hơn: không có external credentials đến cluster
```

## GitOps Principles

```
1. Declarative:
   Desired state được mô tả declaratively (YAML, không script)
   "Tôi muốn 3 replicas của app version 1.2.3"
   Không phải "scale up 1 replica nếu có ít hơn 3"

2. Versioned and Immutable:
   Lưu trong Git → có history, có immutability
   Mọi thay đổi tạo commit mới, không xóa history

3. Pulled Automatically:
   Software agents tự pull và apply approved state
   Không cần manual intervention sau khi merge PR

4. Continuously Reconciled:
   Agents liên tục compare actual state với desired state
   Nếu có drift (ai đó thay đổi thủ công) → tự correct
   → "Self-healing" infrastructure
```

---

# 6. Branching Strategies — Chiến Lược Nhánh

## Trunk-Based Development

Developer commit trực tiếp lên main branch (trunk) hoặc merge Pull Request sau ít ngày (không phải tuần).

```
Nguyên tắc:
  Không có long-lived feature branches
  Branch sống không quá 1-2 ngày
  Commit nhỏ, thường xuyên
  Feature flags để hide incomplete features

Ưu điểm:
  Không có "merge hell"
  CI/CD đơn giản hơn
  Tất cả developer thường xuyên sync với nhau

Phù hợp cho:
  Team có CI/CD mạnh
  Có feature flag system
  Team nhỏ đến trung bình, trust cao
```

## Git Flow

Có nhiều long-lived branches: main, develop, feature/*, release/*, hotfix/*.

```
main:     production code, luôn stable
develop:  integration branch, next release
feature branches: từ develop, merge vào develop
release branches: từ develop khi chuẩn bị release
hotfix branches: từ main, merge vào main và develop

Flow:
  feature/login ──────────────────→ develop
  feature/payment ─────────────────→ develop
                    develop → release/1.2 → main (tag v1.2)
                                          ↘ develop (merge back)
  hotfix/security ──────────────────────→ main (tag v1.2.1)
                                        ↘ develop

Ưu điểm: rõ ràng, phù hợp release cycle rõ ràng
Nhược điểm: phức tạp, nhiều merge, CI/CD phức tạp hơn
Phù hợp cho: phần mềm với versioned release (mobile app, library)
```

---

# 7. Deployment Strategies — Chiến Lược Triển Khai

## Recreate — Đơn Giản Nhất

Tắt tất cả instances cũ, bật tất cả instances mới.

```
Trước: [v1] [v1] [v1]
       ↓
Trong: [ ] [ ] [ ]    ← downtime!
       ↓
Sau:   [v2] [v2] [v2]

Ưu: đơn giản
Nhược: downtime (không phù hợp production thường xuyên)
Dùng khi: dev/staging, hoặc khi v1 và v2 không thể chạy cùng lúc (DB schema change)
```

## Rolling Update — Thay Dần Dần

Thay thế instances cũ bằng instances mới từng phần.

```
Trước: [v1] [v1] [v1] [v1]

Step 1: [v2] [v1] [v1] [v1]  ← thay 1
Step 2: [v2] [v2] [v1] [v1]  ← thay 2
Step 3: [v2] [v2] [v2] [v1]  ← thay 3
Step 4: [v2] [v2] [v2] [v2]  ← xong

Ưu: không downtime, dần dần
Nhược:
  Hai version chạy cùng lúc (cần backward compatible)
  Rollback = rolling update ngược lại (chậm)
  Khó detect nếu v2 có vấn đề trước khi đã deploy nhiều
```

## Blue/Green — Đổi Nguyên Cụm

Maintain hai environments giống hệt nhau — Blue (hiện tại) và Green (mới). Deploy vào Green, test, rồi switch traffic.

```
Traffic:  → [Blue: v1, v1, v1, v1]

Deploy v2 vào Green (không có traffic):
          → [Blue: v1, v1, v1, v1]
             [Green: v2, v2, v2, v2]  ← test ở đây

Switch traffic (instant):
             [Blue: v1, v1, v1, v1]  ← standby (rollback nhanh!)
          → [Green: v2, v2, v2, v2]

Rollback: switch traffic lại về Blue (< 1 phút)

Ưu:
  Không downtime
  Rollback cực kỳ nhanh (chỉ switch traffic)
  Test được environment production-like trước khi go-live

Nhược:
  Tốn gấp đôi resources
  Database migration phức tạp (cả hai env dùng chung DB?)
```

## Canary — Thử Nghiệm Trên Một Nhóm Nhỏ

Chuyển dần dần một phần nhỏ traffic sang version mới. Quan sát metrics trước khi roll out toàn bộ.

```
Step 1: 95% → v1, 5% → v2   (canary = 5%)
        Monitor error rate, latency trong 30 phút
        
Step 2: 80% → v1, 20% → v2  (nếu metrics tốt)
        Monitor tiếp
        
Step 3: 50% → v1, 50% → v2

Step 4: 100% → v2            (rollout hoàn tất)

Rollback bất cứ lúc nào: về 100% → v1

Ưu:
  Detect vấn đề sớm với impact nhỏ
  Rollback dễ dàng
  "Real world testing" trước khi full rollout

Nhược:
  Cần infrastructure support traffic splitting
  Cần monitoring đủ tốt để detect vấn đề
  Lâu hơn blue/green
```

## Feature Flags — Tách Deployment Và Release

Feature flag (feature toggle) cho phép deploy code mà feature vẫn tắt. Bật feature riêng biệt khi sẵn sàng.

```
Code deployment và feature release là hai việc khác nhau:

  Deploy code (feature flag OFF): tất cả user không thấy feature mới
  Enable flag cho internal users: test trên production data
  Enable flag cho 1% users: canary testing
  Enable flag cho 100%: release!

Ưu điểm:
  Rollback = tắt flag (không cần redeploy)
  Dark launch: deploy sẵn nhưng chưa announce
  A/B testing: 50% user dùng variant A, 50% dùng variant B
  Kill switch: khi có vấn đề, tắt ngay không cần code change
```

---

# 8. Environment Management

## Phân Cấp Environments

```
Typical environment pipeline:

Local (dev machine):
  Developer test code locally
  Dùng Docker Compose cho dependencies
  Không phải "real" environment

Development (dev):
  Integration point cho team
  Deploy khi merge vào main/develop branch
  Data: synthetic/fake
  Debug logging bật

Staging (pre-production):
  Clone gần nhất của production
  Deploy trước khi production
  Data: anonymized prod data hoặc realistic synthetic
  Performance testing ở đây

Production:
  Real user traffic
  Chỉ deploy code đã pass staging
  Real data
  Strict access control
```

## Environment Parity — Giữ Môi Trường Giống Nhau

```
12-Factor App nguyên tắc: Dev/Staging/Prod càng giống nhau càng tốt

Thường bị vi phạm:
  Database: SQLite ở local, PostgreSQL ở production
  → Bug SQLite-specific không thấy cho đến production

  External services: mock ở local, real ở production
  → Integration bugs không detect

  Config: hard-code ở local, environment vars ở production
  → Config bugs

Giải pháp:
  Docker + Docker Compose: cùng base image ở mọi environment
  Same DB engine: PostgreSQL local, PostgreSQL production
  Same config approach: env vars everywhere (12-factor)
  Testcontainers: same real DB trong tests
```

---

# 9. Secret Management Trong Pipeline

## Vấn Đề Với Secrets Trong Pipeline

```
Secrets cần trong pipeline:
  Docker registry credentials (push image)
  Kubernetes cluster credentials (deploy)
  Database passwords (integration tests)
  API keys của external services

Cách SAI:
  Hard-code trong code → commit vào Git → lộ!
  Hard-code trong Dockerfile → baked vào image → lộ khi inspect image!
  Lưu trong environment variables mà không mã hóa
```

## Cách Đúng — Secret Management Tools

Các CI/CD platform đều có secret storage:

```
Secrets được:
  Lưu encrypted ở phía platform
  Inject vào pipeline runtime như environment variable
  Không xuất hiện trong logs (masked)
  Có thể rotate mà không thay đổi code

Pipeline config (Ví dụ generic):
  env:
    DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
    KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}

Code không bao giờ thấy actual value
```

## External Secret Managers

Trong production, nên dùng dedicated secret management:

```
Concept chung:
  Application xác thực với secret manager (không phải user/password)
  Secret manager trả về secret
  Secret manager có audit log: ai access gì lúc nào
  Secret có version và rotation tự động
  
Flow:
  Pipeline → authenticate với secret manager
  Pipeline → "Tôi cần DATABASE_PASSWORD"
  Secret manager → verify permission → trả secret
  Pipeline → dùng trong runtime (không persist, không log)
  
  Sau khi dùng: secret không còn trong memory
```

---

# 10. ArgoCD — GitOps Controller

## ArgoCD Là Gì

ArgoCD là GitOps continuous delivery tool cho Kubernetes. Nó watch Git repositories và tự động sync Kubernetes cluster để match desired state trong Git.

## Core Concepts

**Application** là unit cơ bản trong ArgoCD — định nghĩa mối quan hệ giữa Git repo và Kubernetes cluster.

```yaml
# Ví dụ ArgoCD Application definition
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-web-app
  namespace: argocd
spec:
  project: default

  # Source: Git repo chứa Kubernetes manifests
  source:
    repoURL: https://github.com/company/k8s-configs
    targetRevision: main        # branch, tag, hoặc commit SHA
    path: apps/my-web-app       # thư mục trong repo

  # Destination: cluster và namespace để deploy
  destination:
    server: https://kubernetes.default.svc  # in-cluster
    namespace: production

  syncPolicy:
    automated:
      prune: true         # xóa resource không có trong Git
      selfHeal: true      # tự correct nếu ai đó thay đổi thủ công
    syncOptions:
      - CreateNamespace=true
```

## Sync Phases — Quá Trình Sync

```
ArgoCD check Git mỗi 3 phút (hoặc qua webhook, ngay lập tức):

1. Compare:
   Git manifest: "muốn 3 replicas version 1.2.3"
   Cluster actual: "đang có 2 replicas version 1.1.0"
   → Status: OutOfSync

2. Sync:
   Apply Git manifests vào cluster
   Kubernetes tạo mới / update resources

3. Health Check:
   ArgoCD check health của tất cả resources
   Deployment: có bao nhiêu replicas healthy?
   Pod: running và ready?
   Service: endpoint có healthy không?
   → Status: Healthy / Degraded / Progressing / Suspended

4. Result:
   InSync + Healthy = OK
   OutOfSync = có thứ gì đó trong cluster không match Git
   Degraded = resources đang không healthy
```

## App of Apps Pattern

Khi có nhiều applications, dùng "App of Apps" để quản lý centrally:

```
Root Application (App of Apps):
  Watch: /apps-of-apps directory
  Nội dung: Application CRD cho mỗi app

/apps-of-apps/
  ├── frontend-app.yaml      → tạo ArgoCD Application cho frontend
  ├── backend-app.yaml       → tạo ArgoCD Application cho backend
  └── database-app.yaml      → tạo ArgoCD Application cho database

Khi add app mới: thêm file yaml vào /apps-of-apps/
ArgoCD detect → tạo Application mới → bắt đầu sync
→ Quản lý fleet của applications qua Git
```

---

# 11. Argo Rollouts — Progressive Delivery

## Argo Rollouts Giải Quyết Gì

Kubernetes Deployment có rolling update nhưng khá hạn chế. Argo Rollouts thêm:

```
Kubernetes Deployment:
  Rolling update
  Không có traffic splitting thông minh
  Không có automated analysis (dựa vào metrics)
  Rollback thủ công

Argo Rollouts thêm:
  Canary với traffic splitting chính xác (5%, 20%, 50%, 100%)
  Blue/Green deployment
  Automated analysis: "chỉ tiếp tục nếu error rate < 1%"
  Progressive delivery: tự động tăng traffic nếu healthy
  Rollback tự động nếu analysis fail
```

## Canary Với Argo Rollouts

```yaml
# Rollout manifest thay thế Deployment
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app
spec:
  replicas: 10
  strategy:
    canary:
      # Traffic splitting: cần ingress controller support
      canaryService: my-app-canary
      stableService: my-app-stable

      steps:
        # Bước 1: gửi 5% traffic vào canary
        - setWeight: 5

        # Pause: đợi 10 phút để observe metrics
        - pause: { duration: 10m }

        # Bước 2: Tự động analysis
        - analysis:
            templates:
              - templateName: success-rate
            args:
              - name: service-name
                value: my-app-canary

        # Nếu analysis pass, tiếp tục:
        - setWeight: 20
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 10m }
        - setWeight: 100
        # Bước cuối: 100% traffic → rollout hoàn tất

---
# AnalysisTemplate: định nghĩa "thế nào là healthy?"
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  metrics:
    - name: success-rate
      interval: 2m
      # Query Prometheus để check error rate
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{app="{{args.service-name}}",
              status!~"5.."}[2m]))
            /
            sum(rate(http_requests_total{app="{{args.service-name}}"}[2m]))
      successCondition: result[0] >= 0.99  # 99%+ success rate
      failureLimit: 3                       # fail 3 lần → abort rollout
```

## Blue/Green Với Argo Rollouts

```yaml
strategy:
  blueGreen:
    activeService: my-app-active      # stable, nhận production traffic
    previewService: my-app-preview    # green, không có traffic
    autoPromotionEnabled: false       # cần manual promotion (click)
    # Hoặc: autoPromotionEnabled: true + autoPromotionSeconds: 300
    # Tự động promote sau 5 phút nếu healthy

# Flow:
# Deploy new version → chạy ở preview service (không có traffic)
# Team test preview URL
# Manual approval (hoặc auto sau X giây) → switch traffic
# Old version standby cho quick rollback
```

---

# 12. Argo Workflows — Pipeline Engine

## Argo Workflows Là Gì

Argo Workflows là workflow engine chạy trên Kubernetes. Mỗi step trong workflow là một Kubernetes Pod. Dùng cho:

```
CI/CD pipelines
Data processing pipelines (ETL)
Machine learning training pipelines
Batch jobs
Bất kỳ sequential hoặc parallel workflow nào
```

## Core Concepts

**Template** là unit tái sử dụng — định nghĩa một step hoặc group of steps.

**Workflow** là instance của một template chạy cụ thể.

```yaml
# Ví dụ Workflow đơn giản
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: build-and-deploy-
spec:
  entrypoint: build-and-deploy

  templates:
    # Main flow: DAG (Directed Acyclic Graph)
    - name: build-and-deploy
      dag:
        tasks:
          # Chạy lint và test song song
          - name: lint
            template: run-lint

          - name: test
            template: run-tests

          # Build chỉ chạy khi cả lint và test pass
          - name: build
            template: build-image
            dependencies: [lint, test]

          # Deploy chỉ chạy sau khi build xong
          - name: deploy-staging
            template: deploy
            dependencies: [build]
            arguments:
              parameters:
                - name: environment
                  value: staging

    # Individual step templates
    - name: run-lint
      container:
        image: node:18-alpine
        command: [npm, run, lint]

    - name: run-tests
      container:
        image: node:18-alpine
        command: [npm, test]

    - name: build-image
      container:
        image: docker:dind   # docker in docker
        command: [docker, build, -t, myapp:latest, .]

    - name: deploy
      inputs:
        parameters:
          - name: environment
      container:
        image: kubectl-tools:latest
        command:
          - kubectl
          - apply
          - -f
          - "manifests/{{inputs.parameters.environment}}/"
```

## Artifacts — Truyền Data Giữa Steps

```yaml
# Step A tạo artifact, Step B đọc
templates:
  - name: generate-report
    container:
      image: python:3.11
      command: [python, generate.py]
    outputs:
      artifacts:
        - name: report
          path: /tmp/report.json   # output file path

  - name: process-report
    inputs:
      artifacts:
        - name: report
          from: "{{tasks.generate-report.outputs.artifacts.report}}"
    container:
      image: python:3.11
      command: [python, process.py]
```

---

# 13. Harness — Enterprise CI/CD Platform

## Harness Là Gì

Harness là enterprise-grade software delivery platform. Nếu ArgoCD chuyên về Kubernetes GitOps, Harness rộng hơn — bao gồm CI, CD, Feature Flags, Cloud Cost Management, Chaos Engineering, STO (Security Testing).

## Harness Modules

```
Harness Platform:
  ├── CI (Continuous Integration)
  │     Build, test, scan code
  │     Faster builds với caching và test intelligence
  │
  ├── CD (Continuous Delivery)
  │     Multi-cloud deployments
  │     Kubernetes, VMs, serverless
  │     Approval gates, verification
  │
  ├── Feature Flags
  │     Roll out features gradually
  │     A/B testing
  │
  ├── Cloud Cost Management
  │     Visibility vào cloud spending
  │     Optimization recommendations
  │
  ├── Chaos Engineering
  │     Integrated chaos experiments
  │     Built-in resilience testing
  │
  └── STO (Security Testing Orchestration)
        Aggregate security scan results
        Policy enforcement
```

## Core Concepts Trong Harness

**Pipeline** là collection của stages thực thi theo thứ tự hoặc song song.

**Stage** là nhóm các bước logic liên quan (Build, Deploy, Approval, Custom).

**Step** là action đơn lẻ (Run Script, Build Docker Image, Deploy to Kubernetes).

**Connector** là cách Harness kết nối đến external systems (Git provider, Container Registry, Kubernetes cluster, Cloud provider).

**Delegate** là agent chạy trong infrastructure của bạn, thực thi pipeline steps.

```
Harness Platform (SaaS)
     ↕ (TLS encrypted)
Delegate Agent (chạy trong cluster của bạn)
     ↓
Kubernetes Cluster / Cloud Provider / On-Premises
```

Delegate pattern cho phép Harness là SaaS (không cần self-host platform) nhưng vẫn deploy vào infrastructure private của bạn. Delegate pull instructions từ Harness, thực thi locally.

## CD Pipeline Trong Harness

```yaml
# Ví dụ Harness Pipeline YAML structure
pipeline:
  name: Deploy My App
  identifier: Deploy_My_App
  stages:
    - stage:
        name: Build
        type: CI
        spec:
          execution:
            steps:
              - step:
                  name: Run Tests
                  type: Run
                  spec:
                    command: npm test

              - step:
                  name: Build Docker Image
                  type: BuildAndPushDockerRegistry
                  spec:
                    connectorRef: dockerhub_connector
                    repo: mycompany/myapp
                    tags:
                      - <+pipeline.executionId>  # unique tag

    - stage:
        name: Deploy Staging
        type: Deployment
        spec:
          deploymentType: Kubernetes
          service:
            serviceRef: my-app-service
          environment:
            environmentRef: staging
          execution:
            steps:
              - step:
                  name: Rollout Deployment
                  type: K8sRollingDeploy

              # Verify: check metrics sau deploy
              - step:
                  name: Verify
                  type: Verify
                  spec:
                    type: Canary
                    spec:
                      sensitivity: MEDIUM
                      duration: 15m

    - stage:
        name: Approval Gate
        type: Approval
        spec:
          execution:
            steps:
              - step:
                  name: Manual Approval
                  type: HarnessApproval
                  spec:
                    approvers:
                      userGroups:
                        - production-approvers
                    message: "Please review staging metrics before production deploy"

    - stage:
        name: Deploy Production
        type: Deployment
        # ... similar to staging
```

## Harness Verification — CV (Continuous Verification)

Đây là feature nổi bật của Harness — tự động verify deploy bằng cách so sánh metrics.

```
Sau mỗi deploy, Harness CV:
  1. Thu thập metrics từ monitoring (Prometheus, Datadog, Splunk...)
     từ CANARY environment (deployment mới)
     từ PRIMARY environment (deployment cũ)

  2. So sánh bằng Machine Learning:
     Metrics có khác bất thường so với baseline không?
     Error rate tăng? Latency tăng?

  3. Kết luận:
     Healthy → tiếp tục deploy
     Unhealthy → auto rollback

Không cần viết queries thủ công
ML học pattern từ historical data
```

---

# 14. Infrastructure as Code Trong Pipeline

## IaC Workflow Với Pipeline

IaC không chỉ chạy thủ công. Nên integrate vào pipeline như application code.

```
Developer thay đổi IaC code (Terraform, Pulumi, ...)
    ↓
PR được tạo
    ↓
Pipeline CI chạy:
  Validate: syntax check, lint
  Plan: "đây là những gì sẽ thay đổi" → post comment vào PR
  Security scan: tìm misconfiguration (port 22 open to world?)
    ↓
Team review plan trong PR
    ↓
Merge PR
    ↓
Pipeline CD chạy:
  Apply: thực sự thay đổi infrastructure
  Verify: check resources được tạo đúng không
```

## Plan Review — Quan Trọng Nhất

Khi pipeline chạy plan, kết quả được post vào PR comment:

```
## Terraform Plan

Reviewing changes for: production/networking

  ~ resource "load_balancer" "main" {
    ~ listener_port = 80 → 443   (thay đổi port)
    }

  + resource "firewall_rule" "allow_https" {  (thêm mới)
      port = 443
      source = "0.0.0.0/0"
    }

  - resource "firewall_rule" "allow_http" {   (xóa cái cũ)
      port = 80
    }

Plan: 1 to add, 1 to change, 1 to destroy.

⚠️ Caution: this will cause brief network disruption during apply.
```

Team review plan → approve PR → pipeline apply. Không ai apply thủ công.

---

# 15. DevSecOps — Security Trong Pipeline

## Shift Left Security

"Shift left" nghĩa là làm security sớm hơn trong development cycle — không phải chỉ kiểm tra ở cuối.

```
Truyền thống:
  Code → Build → Test → Security Review (cuối) → Deploy
  Tìm thấy vấn đề lúc cuối → đắt và chậm để fix

Shift Left:
  Code → [SAST] → Build → [SCA] → Test → [DAST] → [Container Scan] → Deploy
  Tìm vấn đề sớm nhất có thể → rẻ và nhanh để fix
```

## Các Loại Security Scan Trong Pipeline

**SAST — Static Application Security Testing**

Phân tích source code để tìm security vulnerabilities mà không chạy code.

```
Tìm được:
  SQL injection patterns
  Hard-coded credentials (password = "abc123")
  Use of deprecated/insecure functions
  Buffer overflow risks
  Insecure cryptography

Chạy khi: có code change, trước khi build
Nhanh: phân tích source code, không cần deploy
```

**SCA — Software Composition Analysis**

Kiểm tra dependencies/third-party libraries có vulnerabilities không.

```
Tìm được:
  Known CVEs (Common Vulnerabilities and Exposures) trong dependencies
  Ví dụ: Log4j vulnerability (Log4Shell) — scannable

  Outdated libraries với known security issues
  License compliance issues

Chạy khi: dependencies thay đổi
Input: package.json, pom.xml, requirements.txt, go.mod
```

**Container Image Scanning**

Scan Docker image để tìm vulnerabilities trong OS packages và libraries bên trong image.

```
Tìm được:
  OS-level CVEs (vulnerable OpenSSL, bash, libc)
  Application dependencies trong image
  Sensitive files accidentally included (private keys, passwords)

Chạy khi: sau khi build image, trước khi push
Best practice: scan cả base image regularly (mới CVE được publish)
```

**DAST — Dynamic Application Security Testing**

Test ứng dụng đang chạy bằng cách attack nó như hacker.

```
Tìm được:
  XSS (Cross-Site Scripting)
  SQL Injection khi ứng dụng đang chạy
  Authentication bypass
  Business logic flaws

Chạy khi: sau khi deploy lên staging
Chậm hơn SAST: cần app đang chạy
```

## Security Gate — Khi Nào Dừng Pipeline

```
Critical CVE trong dependencies → fail pipeline, không deploy
High CVE → fail pipeline (hoặc warning tùy policy)
Medium CVE → warning, không fail
Low CVE → log, không fail

Hard-coded secret → ALWAYS fail immediately, alert team

Container with root user → warning or fail (policy-based)
Container with known critical CVE in base image → fail

Policy as Code:
  Không phải quy tắc hard-coded trong pipeline script
  Thay vào đó: policy được define riêng, pipeline enforce
  Thay đổi policy không cần thay đổi pipeline code
```

---

## Tóm Tắt

```
DEVOPS:
  Văn hóa phá bỏ tường Dev vs Ops
  CALMS: Culture, Automation, Lean, Measurement, Sharing
  DORA: đo lường Deployment Frequency, Lead Time, MTTR, Change Failure Rate

CI:
  Merge nhỏ, thường xuyên
  Automated build và test mỗi commit
  Fast feedback (10-15 phút)
  Fix broken build ngay lập tức

CD:
  Continuous Delivery: sẵn sàng deploy bất cứ lúc, manual trigger
  Continuous Deployment: tự động deploy
  Build once, deploy many (cùng artifact qua tất cả env)

GITOPS:
  Git là source of truth duy nhất
  Pull model: controller trong cluster pull từ Git
  Mọi thay đổi qua PR, không SSH trực tiếp

DEPLOYMENT STRATEGIES:
  Recreate: đơn giản, có downtime
  Rolling: không downtime, hai version cùng chạy
  Blue/Green: không downtime, rollback nhanh, tốn 2x resources
  Canary: detect vấn đề sớm với impact nhỏ
  Feature Flags: tách deployment và release

ARGOCD:
  GitOps controller cho Kubernetes
  Watch Git → sync cluster → self-heal

ARGO ROLLOUTS:
  Progressive delivery cho Kubernetes
  Canary và Blue/Green với automated analysis và auto-rollback

ARGO WORKFLOWS:
  Workflow engine trên Kubernetes
  DAG-based pipelines, each step is a Pod

HARNESS:
  Enterprise CD platform
  Delegate pattern: SaaS platform + agent trong infrastructure bạn
  Built-in verification với ML

DEVSECOPS:
  Shift left: security sớm nhất có thể
  SAST, SCA, Container Scan, DAST trong pipeline
  Policy as Code: không hard-code rules trong pipeline
```
