# ☁️ Cloud, DevOps & AWS — Deep Dive
>
> Lý Thuyết Nền Tảng → Cơ Chế → Thực Hành Production

---

## 📚 Mục Lục

1. [Cloud Fundamentals — Tại Sao Cloud?](#1-cloud-fundamentals--tại-sao-cloud)
2. [AWS Global Infrastructure](#2-aws-global-infrastructure)
3. [Compute — EC2, Lambda, ECS, EKS](#3-compute--ec2-lambda-ecs-eks)
4. [Storage — S3, EBS, EFS](#4-storage--s3-ebs-efs)
5. [Networking — VPC, Load Balancer, CloudFront](#5-networking--vpc-load-balancer-cloudfront)
6. [Database — RDS, Aurora, DynamoDB, ElastiCache](#6-database--rds-aurora-dynamodb-elasticache)
7. [IAM — Identity & Access Management](#7-iam--identity--access-management)
8. [CI/CD — Tại Sao & Các Patterns](#8-cicd--tại-sao--các-patterns)
9. [Docker — Cơ Chế Bên Trong](#9-docker--cơ-chế-bên-trong)
10. [Kubernetes — Orchestration](#10-kubernetes--orchestration)
11. [Infrastructure as Code — Terraform](#11-infrastructure-as-code--terraform)
12. [Monitoring & Observability](#12-monitoring--observability)
13. [High Availability & Disaster Recovery](#13-high-availability--disaster-recovery)
14. [Security Best Practices](#14-security-best-practices)

---

# 1. Cloud Fundamentals — Tại Sao Cloud?

## 1.1 Trước Cloud — On-Premises Vấn Đề Gì?

```
Startup A muốn launch product:
  1. Mua servers ($5,000-$50,000/server)
  2. Thuê datacenter rack space ($500-2000/month)
  3. Mua network equipment, cáp, cooling
  4. Hire sysadmin để maintain
  5. Wait 3-6 weeks for hardware delivery

Sau 6 tháng: product thất bại → servers bỏ không
Hoặc: product thành công → traffic tăng 10x → mua thêm servers → wait 3-6 weeks!

Fundamental problems:
  Capital Expenditure (CapEx): trả trước, locked-in, waste nếu không dùng
  Scaling lag: không thể scale ngay lập tức
  Capacity planning: đoán sai → over-provision (waste) hoặc under-provision (outage)
  Maintenance burden: hardware failures, OS updates, security patches
  Geographic expansion: muốn serve Asia → cần datacenter ở Asia → 6 months+
```

## 1.2 Cloud Value Proposition

```
Cloud = "rent compute/storage/network instead of buying"

Benefits:
  ELASTICITY: scale up và down instantly
    Monday 9am: 100 servers (peak)
    Sunday 3am: 5 servers (low traffic)
    Pay for what you use!
  
  OPEX INSTEAD OF CAPEX: pay-as-you-go, no upfront
    No $50,000 server purchase
    $0.1/hour per server, cancel anytime
  
  GLOBAL REACH: deploy worldwide in minutes
    AWS has 33 regions → your app near every user
    Latency: Singapore-based user + Singapore region = 5ms
    vs Hanoi server = 20ms, US server = 200ms
  
  MANAGED SERVICES: không cần manage infrastructure
    vs. bare metal: manage OS, patching, hardware failures
    AWS RDS: managed database, auto backup, multi-AZ, patching handled
  
  RELIABILITY: built-in redundancy
    Multiple datacenters per region
    SLA: 99.99% uptime (52 minutes downtime/year)
```

## 1.3 Service Models

```
IaaS (Infrastructure as a Service):
  Bạn control: OS, runtime, application, data
  Cloud provides: compute (virtual machines), storage, networking
  Examples: EC2 (AWS), Compute Engine (GCP), Azure VMs
  Use when: maximum control needed, lift-and-shift existing apps

PaaS (Platform as a Service):
  Bạn control: application code, data
  Cloud provides: runtime, OS, middleware, infrastructure
  Examples: Elastic Beanstalk, Heroku, App Engine, Cloud Run
  Use when: want to focus on code, not infrastructure

SaaS (Software as a Service):
  Bạn control: configuration, data
  Cloud provides: everything else
  Examples: Gmail, Salesforce, GitHub, Slack
  Use when: using pre-built software

FaaS (Function as a Service) / Serverless:
  Bạn control: function code
  Cloud provides: everything, scales to zero!
  Examples: AWS Lambda, Google Cloud Functions, Azure Functions
  Pay per invocation (not per hour!)
  Use when: event-driven, unpredictable traffic

RESPONSIBILITY MODEL:
  More managed (SaaS) → Less control → Less ops burden
  More control (IaaS) → More flexibility → More ops burden

        Data        [You manage]  [You manage]  [You manage]  [Provider]
        Application [You manage]  [You manage]  [You manage]  [Provider]
        Runtime     [You manage]  [You manage]  [Provider]    [Provider]
        OS          [You manage]  [Provider]    [Provider]    [Provider]
        Compute     [You manage]  [Provider]    [Provider]    [Provider]
                     On-Prem       IaaS          PaaS          SaaS
```

## 1.4 Cloud Deployment Models

```
PUBLIC CLOUD: AWS, GCP, Azure
  Shared infrastructure, logically isolated
  Lowest cost, highest flexibility
  Most common for new projects

PRIVATE CLOUD: on-premises cloud (OpenStack, VMware)
  Dedicated infrastructure
  Higher compliance control
  Higher cost, internal IT team needed

HYBRID CLOUD: public + private connected
  Sensitive data on-premises, scalable workloads on cloud
  Complex networking (VPN, Direct Connect)
  Many enterprises: core data on-prem, burst to cloud

MULTI-CLOUD: multiple providers (AWS + GCP)
  Avoid vendor lock-in
  Best-of-breed services (GCP for ML, AWS for general)
  Complexity: different APIs, different tooling
```

---

# 2. AWS Global Infrastructure

## 2.1 Regions, Availability Zones, Edge Locations

```
AWS REGION:
  Geographic area with 2+ Availability Zones
  33 Regions worldwide (2025): us-east-1, ap-southeast-1 (Singapore), etc.
  Data sovereignty: data stays in region unless you explicitly move it
  
  Choosing region:
    1. Compliance: data must stay in Vietnam → need nearest compliant region
    2. Latency: closest to your users
    3. Service availability: not all services in all regions
    4. Cost: prices vary by region (us-east-1 cheapest)

AVAILABILITY ZONE (AZ):
  One or more discrete datacenters with redundant power/networking
  Each region has 3-6 AZs (e.g., ap-southeast-1a, 1b, 1c)
  Connected by high-bandwidth, low-latency fiber
  AZs in same region ~1-2ms latency
  
  WHY MULTI-AZ?
  AZ fails (rare but happens) → other AZs unaffected
  Deploy across 3 AZs → survive single AZ failure!
  
  Production pattern: run instances in 3 AZs
    AZ-a: 2 EC2 instances
    AZ-b: 2 EC2 instances  → 1 AZ fails → still 4 instances running
    AZ-c: 2 EC2 instances

EDGE LOCATION / POINT OF PRESENCE (PoP):
  400+ locations worldwide
  Used by: CloudFront (CDN), Route 53 (DNS), AWS Shield (DDoS)
  Content cached close to users → reduced latency
  
  User in Hanoi → nearest edge location (Singapore or Tokyo)
  → cached content served from edge, not US origin
  → 50ms instead of 300ms!
```

## 2.2 AWS Services Landscape

```
COMPUTE:
  EC2: virtual machines
  Lambda: serverless functions
  ECS: Docker containers (managed)
  EKS: Kubernetes (managed)
  Fargate: serverless containers (no server management)

STORAGE:
  S3: object storage (images, videos, backups)
  EBS: block storage (like hard drive attached to EC2)
  EFS: managed NFS (shared file system)
  S3 Glacier: cheap archival storage

DATABASE:
  RDS: managed relational (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server)
  Aurora: AWS-optimized MySQL/PostgreSQL (5x faster)
  DynamoDB: managed NoSQL key-value/document
  ElastiCache: managed Redis/Memcached
  Redshift: data warehouse

NETWORKING:
  VPC: isolated virtual network
  Route 53: DNS service
  CloudFront: CDN
  ELB: Elastic Load Balancer (ALB, NLB, CLB)
  API Gateway: managed API endpoint

MESSAGING:
  SQS: Simple Queue Service (decoupling)
  SNS: Simple Notification Service (pub/sub)
  EventBridge: event bus
  Kinesis: real-time data streaming (like Kafka)

CI/CD & DEVOPS:
  CodePipeline: CI/CD pipeline
  CodeBuild: build service
  CodeDeploy: deployment automation
  ECR: Elastic Container Registry (Docker images)

MONITORING:
  CloudWatch: metrics, logs, alarms
  X-Ray: distributed tracing
  CloudTrail: audit log (who did what)

SECURITY:
  IAM: identity and access management
  KMS: Key Management Service (encryption)
  Secrets Manager: store secrets (DB passwords, API keys)
  WAF: Web Application Firewall
  Shield: DDoS protection
```

---

# 3. Compute — EC2, Lambda, ECS, EKS

## 3.1 EC2 — Virtual Machines

```
EC2 = Elastic Compute Cloud = virtual machine trên AWS

INSTANCE TYPES (naming: [family][generation][size]):
  t3.micro → t=burstable, gen=3, micro=very small (2 vCPU, 1GB)
  m5.xlarge → m=general purpose, gen=5, xlarge (4 vCPU, 16GB)
  c5.2xlarge → c=compute optimized, 2xlarge (8 vCPU, 16GB)
  r5.4xlarge → r=memory optimized, 4xlarge (16 vCPU, 128GB)
  p3.2xlarge → p=GPU instances (ML, rendering)
  i3.large → i=storage optimized (NVMe SSD)

PRICING MODELS:
  On-Demand: pay per hour/second, no commitment
    → development, unpredictable workloads
    → most expensive but most flexible
  
  Reserved Instances: 1 or 3 year commitment, up to 72% discount
    → steady-state production workloads
    Standard RI: locked to specific instance type
    Convertible RI: can change instance type, less discount
  
  Spot Instances: bid on unused capacity, up to 90% discount
    → can be interrupted with 2-minute notice!
    → batch processing, stateless workloads, fault-tolerant
    → NEVER use for databases or stateful services
  
  Savings Plans: flexible, commits to $/hour spend, up to 66% savings
    → more flexible than RI (works across instance families)

AMI (Amazon Machine Image):
  Template for EC2: OS + software pre-installed
  Create golden AMI: base image with your app baked in
  → instances launch faster (no setup time)
  → immutable infrastructure (never SSH to update, replace with new AMI)
```

## 3.2 Auto Scaling

```
AUTO SCALING GROUP (ASG):
  Automatically add/remove EC2 instances based on demand.

  min_size: 2      ← always at least 2 (for HA)
  max_size: 20     ← never more than 20 (cost control)
  desired: 4       ← start with 4

Scaling Policies:
  DYNAMIC SCALING:
    Target tracking: "keep CPU at 70%"
      → CPU > 70%: add instances
      → CPU < 70%: remove instances
    
    Step scaling: "if CPU 70-90%: add 2. if CPU > 90%: add 4"
    
    Simple scaling: "if CPU > 80%: add 1 (then cooldown 5min)"
  
  SCHEDULED SCALING:
    "Every Monday 8am: scale to 10 instances"
    "Every night 11pm: scale down to 2 instances"
    → predictable traffic patterns
  
  PREDICTIVE SCALING:
    ML-based, predict future traffic from historical patterns
    Pre-scale before traffic spike!

SCALE-IN PROTECTION:
  Protect specific instances from termination during scale-in
  → long-running jobs that can't be interrupted

COOLDOWN PERIOD:
  After scaling action: wait X seconds before next action
  Prevents thrashing: scale out → scale in → scale out → ...
```

## 3.3 Lambda — Serverless Functions

```
LAMBDA EXECUTION MODEL:
  1. Event triggers Lambda (API Gateway, S3, SQS, EventBridge, ...)
  2. Lambda service finds available execution environment
     (container với runtime: Java, Node.js, Python, Go, ...)
  3. If warm environment available: WARM START (~1-10ms overhead)
     If no warm environment: COLD START (~100ms-10s!)
  4. Function runs, returns result
  5. Environment kept warm for ~15 min (reuse next invocation)

COLD START PROBLEM:
  Cold start: initialize runtime + load code + run init code
  Java cold start: 1-10 seconds! (JVM startup)
  Node.js/Python: 100-500ms (faster runtime)
  
  Mitigations:
    Provisioned Concurrency: keep N environments always warm (costs money!)
    Lambda SnapStart (Java): snapshot initialized state → restore on invoke
    Reduce deployment package size (smaller zip → faster load)
    Use lightweight runtimes if possible (Node over Java for simple functions)
    Minimize code in handler (heavy init in global scope, not handler)

CONCURRENCY:
  Lambda scales horizontally: 1 request = 1 Lambda instance
  1000 concurrent requests = 1000 Lambda instances
  (Account limit: 1000 concurrent by default, can increase)
  
  Burst limit: initial scale of 500-3000/minute per region
  Throttling: if limit exceeded → 429 Too Many Requests

LAMBDA LIMITATIONS:
  Max execution time: 15 minutes
  Memory: 128MB - 10GB
  Deployment package: 50MB zipped, 250MB unzipped
  Tmp storage: /tmp 512MB - 10GB
  
  NOT suitable for:
    Long-running processes (>15min)
    Stateful applications (each invocation potentially new env)
    High memory, lots of CPU (ECS/EKS better)
    Predictable high-concurrency (always-on EC2 might be cheaper)
```

## 3.4 Containers — ECS vs EKS vs Fargate

```
WHY CONTAINERS?
  "Works on my machine" → Docker solves this
  Consistent environment: dev = staging = production
  Faster than VMs: seconds to start vs minutes
  Better resource utilization: multiple containers per VM

ECS (Elastic Container Service):
  AWS-native container orchestration
  LAUNCH TYPES:
    EC2: you manage EC2 instances (control over instance type, cost)
    Fargate: serverless! AWS manages infrastructure
              you only define CPU/memory for containers
  
  Simpler than Kubernetes, AWS-integrated
  Good for teams not needing full K8s power

EKS (Elastic Kubernetes Service):
  Managed Kubernetes control plane (AWS runs master nodes)
  You manage worker nodes (EC2) OR use Fargate for serverless
  Full Kubernetes API compatibility
  Best for: large teams already using K8s, complex orchestration needs
  
FARGATE:
  Serverless containers (works with both ECS and EKS)
  No EC2 to manage: no patching, no capacity planning
  Pay for exact CPU/memory used
  Slightly more expensive than optimized EC2 for steady workloads
  
CHOOSING:
  Simple workload, AWS-native: ECS + Fargate
  Kubernetes expertise, complex: EKS
  Cost-optimized, control: ECS + EC2 Spot
  Truly serverless: Lambda
```

---

# 4. Storage — S3, EBS, EFS

## 4.1 S3 — Object Storage

```
S3 = Simple Storage Service = unlimited object store

OBJECT STORAGE VS BLOCK STORAGE:
  Object: file + metadata + unique ID
    Access via URL/API (HTTP), NOT mounted as filesystem
    Immutable: cannot edit parts, must replace whole object
    Scalable: unlimited objects, unlimited size (up to 5TB/object)
    
  Block: raw storage blocks (like HDD)
    Mounted as filesystem (/dev/sda)
    Can read/write at byte level
    Fixed size, attached to one server
    Fast random I/O (databases use this)

S3 STORAGE CLASSES (cost optimization!):
  Standard:            $0.023/GB    → frequently accessed data
  Intelligent-Tiering: automatic    → unknown/changing patterns
  Standard-IA:         $0.0125/GB   → infrequent access, need fast
  One Zone-IA:         $0.01/GB     → infrequent, single AZ (lower durability)
  Glacier Instant:     $0.004/GB    → archive, retrieve in ms
  Glacier Flexible:    $0.0036/GB   → archive, retrieve in minutes-hours
  Glacier Deep Archive:$0.00099/GB  → long-term archive, 12h retrieval

DURABILITY & AVAILABILITY:
  Durability: 11 nines = 99.999999999%
  → store 10 million objects → expect to lose 1 object every 10,000 years!
  → data stored across ≥3 AZs (Standard)
  
  Availability: 99.99% = ~52 minutes downtime/year

S3 FEATURES:
  Versioning: keep history of all versions (protection against deletion)
  Lifecycle rules: auto-transition to cheaper class / auto-delete
  Replication:
    CRR (Cross-Region): disaster recovery, compliance
    SRR (Same-Region): log aggregation, test with prod data
  Presigned URLs: time-limited access without credentials
  Event notifications: trigger Lambda/SNS/SQS on upload
  Object Lock: WORM (Write Once Read Many) for compliance

SECURITY:
  Bucket policies: JSON-based access control
  ACLs: legacy, prefer bucket policies
  Block Public Access: account/bucket level kill switch for public access
  Server-side encryption: SSE-S3, SSE-KMS, SSE-C
  TLS in transit: always use HTTPS endpoints

USE CASES:
  Static website hosting (React build output)
  Media storage (images, videos)
  Data lake (raw data for analytics)
  Backup and archive
  Application state (Lambda function packages, Terraform state)
```

## 4.2 EBS — Block Storage for EC2

```
EBS = Elastic Block Store = virtual hard drive for EC2

Attached to ONE EC2 instance at a time (multi-attach available for io2)
Persists independently of EC2 instance lifecycle
Network-attached (small latency vs instance store)

VOLUME TYPES:
  gp3 (General Purpose SSD):
    3,000-16,000 IOPS, 125-1000 MB/s throughput
    Independently configure IOPS and throughput (unlike gp2)
    Cost-effective default for most use cases
    
  gp2 (General Purpose SSD, older):
    IOPS tied to volume size (3 IOPS/GB, max 16,000)
    Migrate to gp3 for same performance at lower cost!
    
  io2 Block Express (Provisioned IOPS SSD):
    Up to 256,000 IOPS
    For databases requiring sub-millisecond latency
    SAP HANA, Oracle, critical workloads
    
  st1 (Throughput Optimized HDD):
    High throughput, low IOPS, sequential access
    Big Data, data warehouses, log processing
    
  sc1 (Cold HDD):
    Lowest cost, infrequent access
    Archival data on block storage

SNAPSHOTS:
  Point-in-time backup → stored in S3
  Incremental: only changed blocks after first snapshot
  Cross-region copy: disaster recovery
  Create volume from snapshot (restore or clone)

ENCRYPTION:
  AES-256, managed by KMS
  Encrypt at rest + in transit (between EBS and EC2)
  Cannot un-encrypt: create new encrypted volume, copy data
```

## 4.3 EFS — Shared File System

```
EFS = Elastic File System = managed NFS (Network File System)

UNLIKE EBS: multiple EC2 instances can mount simultaneously!
→ Shared file system across instances/containers

Use cases:
  Content management: multiple web servers reading same files
  Application configuration shared across instances
  Machine learning training data shared across GPUs
  Container persistent storage (EFS + EKS)

PERFORMANCE MODES:
  General Purpose: default, low latency
  Max I/O: higher throughput, higher latency (big data, parallel)

THROUGHPUT MODES:
  Bursting: throughput scales with storage size
  Provisioned: set throughput independently of size
  Elastic: auto-scale throughput based on workload (recommended)

STORAGE CLASSES:
  Standard: frequently accessed
  IA (Infrequent Access): cheaper, retrieval fee
  Lifecycle policy: auto-move files to IA after N days
```

---

# 5. Networking — VPC, Load Balancer, CloudFront

## 5.1 VPC — Virtual Private Cloud

```
VPC = your own isolated virtual network on AWS
Every AWS account has a default VPC in each region.

WHY VPC?
  Internet → AWS → directly accessible? NO!
  Internet → VPC boundary → subnet → security group → EC2
  Multiple layers of network isolation.

VPC COMPONENTS:
  CIDR Block: IP range for your VPC
    VPC: 10.0.0.0/16 → 65,536 IP addresses
    
  SUBNETS: subdivide VPC into smaller networks
    Public subnet:  10.0.1.0/24 → has route to Internet Gateway → internet accessible
    Private subnet: 10.0.2.0/24 → NO route to internet → isolated
    
    Best practice: 1 public + 1 private per AZ
    3 AZs → 6 subnets minimum
    
    Public: Load Balancers, Bastion hosts, NAT Gateway
    Private: EC2, RDS, Lambda → never directly internet-accessible!
  
  INTERNET GATEWAY (IGW):
    Connects VPC to internet (bidirectional)
    Public subnet → route table has: 0.0.0.0/0 → IGW
    
  NAT GATEWAY:
    Private subnet instances → need to download packages? call external APIs?
    Private → NAT Gateway (in public subnet) → Internet → response back
    OUTBOUND only! Internet cannot initiate connection to private subnet.
    Managed, highly available. ~$0.045/hour + data transfer cost.
    
  SECURITY GROUPS:
    Virtual firewall at INSTANCE level
    Stateful: allow inbound request → response automatically allowed
    Rules: ALLOW only (no deny rules, implicit deny all)
    
    Example:
    Web server SG: allow 80, 443 from 0.0.0.0/0 (internet)
    App server SG: allow 8080 from Web server SG (not from internet!)
    DB SG:         allow 5432 from App server SG only
    
  NETWORK ACL (NACL):
    Firewall at SUBNET level
    Stateless: must explicitly allow both inbound AND outbound
    Rules: numbered, evaluated in order, can DENY
    Default NACL: allow all (security groups are primary defense)
    
  VPC PEERING:
    Connect two VPCs (same or different accounts, same or different regions)
    Not transitive: A↔B, B↔C does NOT mean A↔C
    
  TRANSIT GATEWAY:
    Hub-and-spoke: connect many VPCs + on-premises
    Transitive routing (unlike peering)
    Central place for network topology
    
  VPC ENDPOINTS:
    Access AWS services (S3, DynamoDB) WITHOUT internet
    Interface endpoint: private IP in your VPC, works with most services
    Gateway endpoint: free! for S3 and DynamoDB only
    EC2 → private endpoint → S3 (never leaves AWS network!)
```

## 5.2 Load Balancers

```
WHY LOAD BALANCER?
  1 server → single point of failure
  Load balancer → distribute traffic across multiple servers
  Health checks → route only to healthy servers
  SSL termination → handle HTTPS, forward HTTP internally
  
AWS LOAD BALANCER TYPES:

APPLICATION LOAD BALANCER (ALB) — Layer 7:
  HTTP/HTTPS aware, content-based routing
  Route based on: path, host, header, query string
    /api/* → API EC2 instances
    /static/* → S3 (redirect!)
    app.example.com → App servers
    api.example.com → API servers
  
  WebSocket support
  gRPC support (HTTP/2)
  Fixed response (return 404 without backend)
  Redirect (HTTP → HTTPS)
  
  → Use for: web apps, microservices, REST APIs, containers

NETWORK LOAD BALANCER (NLB) — Layer 4:
  TCP/UDP/TLS, extreme performance
  Millions of requests/second, ultra-low latency (<1ms)
  Static IP address (ALB has dynamic IPs)
  
  → Use for: gaming, IoT, financial trading, gRPC, static IP requirement

GATEWAY LOAD BALANCER (GWLB) — Layer 3:
  For network appliances (firewalls, intrusion detection)
  Transparent to traffic
  → Use for: security inspection, network monitoring

ALB HEALTH CHECKS:
  Check each target every 30s (configurable)
  HTTP/HTTPS GET to /health endpoint
  2xx/3xx response = healthy
  Non-2xx or timeout = unhealthy → removed from rotation
  Requires: implement GET /health returning 200

ALB TARGET TYPES:
  Instances: EC2 instance IDs
  IP: any IP (on-premises servers, peered VPCs)
  Lambda: serverless!
  ALB: (for GWLB chaining)
```

## 5.3 CloudFront — CDN

```
CloudFront = Content Delivery Network
  Content cached at 400+ edge locations globally
  Users fetch from nearest edge → low latency
  Reduces load on origin (EC2, S3, ALB)

HOW IT WORKS:
  1. User in Hanoi requests image
  2. DNS resolves to nearest CloudFront edge (Singapore)
  3. Edge has cached copy → serve immediately (HIT)
  4. Edge cache miss → fetch from origin (S3, EC2, ALB)
  5. Cache and serve → next requests: serve from cache

CACHE HIT RATIO = hits / (hits + misses)
  High = good (less origin load, faster for users)
  Low = most requests hitting origin (check cache settings)

ORIGINS:
  S3 bucket (static files)
  EC2 instance
  ALB
  API Gateway
  Any HTTP server (even on-premises)

CACHE BEHAVIOR SETTINGS:
  TTL (Time To Live): how long cache entry lives
    min TTL, max TTL, default TTL
    Cache-Control header from origin takes precedence!
    
  Cache Key: what uniquely identifies cached object
    Default: URL path only
    Can add: headers, query strings, cookies
    More specific cache key = more cache misses (worse ratio)
    Less specific = more hits but potential wrong content served

  Path patterns:
    /images/* → cache 365 days (images rarely change)
    /api/*    → don't cache (dynamic data)
    /static/* → cache 30 days, compress (CSS, JS)
    Default   → cache 1 day

CLOUDFRONT SECURITY:
  HTTPS everywhere (even to S3 origin)
  OAC (Origin Access Control): S3 bucket only accessible via CloudFront
    → cannot bypass CDN and access S3 directly
  WAF integration: rate limiting, IP blocking, SQL injection protection
  Geo-restriction: block/allow specific countries
  Signed URLs/Cookies: time-limited access to private content
    Use case: paid video streaming, temporary download links

PRICE CLASSES:
  All: cheapest per-request, most edge locations
  100: only cheapest locations (US, EU, Asia)
  200: exclude most expensive regions
  Choose based on user geography vs cost
```

---

# 6. Database — RDS, Aurora, DynamoDB, ElastiCache

## 6.1 RDS — Relational Database Service

```
RDS = managed relational database
Engines: PostgreSQL, MySQL, MariaDB, Oracle, SQL Server

WHAT AWS MANAGES:
  ✅ OS patching
  ✅ Database software updates
  ✅ Automated backups (daily snapshot + transaction logs)
  ✅ Multi-AZ failover
  ✅ Monitoring, metrics
  ✅ Storage auto-scaling

WHAT YOU MANAGE:
  Database schema, queries, indexes
  Security groups, parameter groups
  Instance size selection
  Read replica setup

MULTI-AZ DEPLOYMENT:
  Primary DB in AZ-a + Standby in AZ-b (synchronous replication)
  Standby: not readable! Only for failover.
  Failover: 1-2 minutes automatic (DNS flips to standby)
  → High Availability, not performance!

READ REPLICAS:
  Asynchronous replication from primary
  Readable! For read scaling (reporting, analytics)
  Up to 5 read replicas per primary
  Can be in different region (disaster recovery!)
  Promoted to primary manually (unlike Multi-AZ auto failover)

STORAGE:
  gp3 (General Purpose SSD): default, good balance
  io1 (Provisioned IOPS SSD): high-performance OLTP
  Storage auto-scaling: grows automatically when approaching limit
  
BACKUP & RESTORE:
  Automated backups: 1-35 days retention
  Manual snapshots: keep until you delete
  Point-in-time restore: restore to any second within retention window
  Cross-region snapshot copy: disaster recovery

RDS PROXY:
  Connection pooling for Lambda/serverless
  Lambda: 1000 concurrent invocations = 1000 DB connections!
  RDS Proxy: pools connections, Lambda connects to proxy
  → reduces DB connections by 80%!
```

## 6.2 Aurora — AWS-Optimized Database

```
Aurora = AWS proprietary, MySQL and PostgreSQL compatible
5x faster than MySQL, 3x faster than PostgreSQL on RDS

WHY AURORA FASTER?
  Custom storage engine: 6-way replication across 3 AZs
  (vs RDS Multi-AZ: 2-way sync replication)
  
  Distributed storage: 10GB chunks distributed across hundreds of nodes
  → writes go to 4/6 storage nodes → considered durable
  → reads from any storage node
  → auto-heal: if storage node fails → rebuilds from other replicas
  
  Less latency: writes ack after 4/6 replicas confirm
  (vs traditional: wait for full sync to standby)

AURORA ARCHITECTURE:
  1 Primary writer + up to 15 read replicas (vs 5 for RDS)
  All share same underlying storage (replicas catch up fast!)
  Failover to replica: ~30s (vs 1-2min RDS Multi-AZ)

AURORA SERVERLESS v2:
  Auto-scale capacity (ACUs) based on demand
  0.5 to 128 ACUs (1 ACU = 2GB RAM)
  Scales in seconds (not minutes)
  Pay per second when active
  → perfect for: dev environments, variable workloads, multi-tenant

AURORA GLOBAL DATABASE:
  1 primary region + up to 5 secondary regions
  <1 second replication lag
  Disaster recovery: promote secondary region in <1 min
  Low-latency reads globally
```

## 6.3 DynamoDB — Managed NoSQL

```
DynamoDB = serverless key-value + document database
Single-digit millisecond performance at ANY scale!

CORE CONCEPTS:
  Table: collection of items (like rows)
  Item: collection of attributes (like columns, but flexible schema!)
  Primary Key:
    Simple: Partition Key (PK) only
    Composite: Partition Key + Sort Key
  
  Partition Key: determines which partition stores the item
    → high cardinality = better distribution!
    → DON'T use: date, boolean, small enum as PK (hot partition problem!)
    → DO use: userId, orderId, productId (UUID-like)
  
  Sort Key: items with same PK sorted by SK
    → enables range queries on SK: "orders between Jan and Mar"
    → enables hierarchy: PK=userId, SK=order#2024-01-15#orderId

READ/WRITE CAPACITY:
  PROVISIONED mode:
    Pre-provision RCUs (Read Capacity Units) and WCUs
    1 RCU = 1 strongly consistent read of item ≤4KB/second
    1 WCU = 1 write of item ≤1KB/second
    Auto-scaling available but not instant
    
  ON-DEMAND mode:
    Pay per request, scale instantly to any throughput
    More expensive per request but no capacity planning
    → dev/test, unpredictable traffic, new applications

CONSISTENCY MODELS:
  Eventually Consistent Read (default): might read stale data
    → propagation to all copies takes ~milliseconds
    → cheaper (0.5 RCU per 4KB read)
    
  Strongly Consistent Read: always latest data
    → 1 RCU per 4KB read (2x more expensive)
    → higher latency

GLOBAL TABLES:
  Multi-region, multi-active (write to any region!)
  <1 second replication
  Automatic conflict resolution (last-writer-wins)
  → Global applications with local latency

DAX (DynamoDB Accelerator):
  In-memory cache for DynamoDB
  Microsecond reads (vs ms for DynamoDB)
  Drop-in replacement (same API)
  → read-heavy, hot keys, gaming leaderboards

WHEN NOT TO USE DYNAMODB:
  Complex queries with multiple join conditions
  Ad-hoc reporting/analytics (use Redshift or Athena)
  Large blobs > 400KB (use S3, store reference in DynamoDB)
  ACID transactions spanning multiple tables (limited support)
```

## 6.4 ElastiCache — In-Memory Cache

```
ElastiCache = managed Redis or Memcached

WHY CACHING?
  Database: disk-based → milliseconds per query
  Cache: memory-based → microseconds per lookup
  
  Common pattern: Cache-Aside
    1. Check cache: hit → return immediately
    2. Cache miss → query DB → store in cache → return

REDIS vs MEMCACHED:
  Redis:
    ✅ Data structures: strings, lists, sets, sorted sets, hashes, streams
    ✅ Persistence (optional): survive restart
    ✅ Pub/Sub messaging
    ✅ Lua scripting
    ✅ Multi-AZ with replication
    ✅ Cluster mode: shard data across nodes
    → Most use cases: session, cache, leaderboard, real-time analytics
  
  Memcached:
    Simple strings only
    Multi-threaded (better CPU utilization)
    No persistence, no replication
    → Simple caching only

ELASTICACHE REDIS:
  Cluster Mode Disabled:
    1 primary + up to 5 replicas
    All data on every node (full copies)
    Failover: promote replica in <1min
    
  Cluster Mode Enabled:
    Data sharded across up to 500 nodes
    Each shard has 1 primary + replicas
    → Horizontal scaling for write-heavy workloads

USE CASES:
  Session storage: user sessions (scale app servers stateless)
  DB query caching: cache expensive queries
  Rate limiting: INCR command for distributed counters
  Leaderboards: sorted sets for real-time rankings
  Pub/Sub: real-time messaging (NOT replacement for full MQ)
  Distributed lock: SETNX (Set if Not eXists)
```

---

# 7. IAM — Identity & Access Management

## 7.1 IAM Core Concepts

```
IAM = control WHO can do WHAT on WHICH AWS resources

IDENTITIES (who):
  Users:  long-term credentials (human or service)
          Access Key (programmatic) + Password (console)
          Best practice: only for humans, not services!
          
  Groups: collection of users, attach policies to group
          Not identities, just for policy management
          
  Roles:  temporary credentials, assumed by trusted entity
          No long-term credentials (auto-rotated)
          For: EC2, Lambda, ECS (service roles)
          For: Cross-account access
          For: Identity Federation (SSO, SAML)
          → Prefer roles over users for services!

POLICIES (what they can do):
  JSON document defining permissions
  
  IDENTITY-BASED POLICIES: attach to users/groups/roles
  RESOURCE-BASED POLICIES: attach to resources (S3 bucket, SQS queue)
  PERMISSION BOUNDARIES: maximum permissions allowed for identity
  SCP (Service Control Policies): max permissions for entire AWS account (Organizations)
  
  POLICY EVALUATION:
    1. Explicit DENY → DENY (always wins!)
    2. Explicit ALLOW → ALLOW
    3. Default → DENY (implicit deny)
    
    If same statement has allow and deny → DENY wins!

PRINCIPLE OF LEAST PRIVILEGE:
  Grant ONLY permissions needed for the task.
  Start with minimum, add as needed.
  Regularly audit and remove unused permissions.
```

## 7.2 IAM Policies Deep Dive

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ReadOnSpecificBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-bucket",
        "arn:aws:s3:::my-app-bucket/*"
      ],
      "Condition": {
        "StringEquals": {
          "s3:prefix": ["user/${aws:username}/"]
        },
        "IpAddress": {
          "aws:SourceIp": "203.0.113.0/24"
        }
      }
    },
    {
      "Sid": "DenyDeleteEverywhere",
      "Effect": "Deny",
      "Action": "s3:DeleteObject",
      "Resource": "*"
    }
  ]
}

ARN = Amazon Resource Name (unique identifier):
arn:partition:service:region:account-id:resource
arn:aws:s3:::my-bucket               (no region/account for global S3)
arn:aws:ec2:ap-southeast-1:123456:instance/i-abc123
arn:aws:iam::123456:role/my-role     (no region for IAM - global)

WILDCARDS:
  * = any resource
  ? = single character
  arn:aws:s3:::my-bucket/* = all objects in my-bucket
```

## 7.3 IAM Roles for Services

```
EC2 INSTANCE PROFILE:
  Attach IAM role to EC2 → code running on EC2 inherits role permissions
  SDK automatically gets temp credentials from metadata service!
  
  Without role: hardcode access keys in code (BAD! leaked if code leaked)
  With role:    SDK calls http://169.254.169.254/latest/meta-data/iam/...
                Gets temp credentials (auto-rotate every hour)
  
  // Java SDK: automatically picks up instance profile credentials
  S3Client s3 = S3Client.builder().region(Region.AP_SOUTHEAST_1).build();
  // No credentials needed! Role provides them.

LAMBDA EXECUTION ROLE:
  Lambda needs to access S3, DynamoDB, etc.
  Attach role with required permissions
  Auto-rotated temp credentials

EKS SERVICE ACCOUNTS (IRSA):
  Pod needs to access S3
  IAM Role for Service Account → map to K8s service account
  Pod assumes role when calling AWS APIs
  Least privilege: different pods, different roles
```

## 7.4 AWS Organizations & Multi-Account Strategy

```
MULTIPLE AWS ACCOUNTS:
  Dev, Staging, Prod in separate accounts
  → Blast radius: mistake in Dev doesn't affect Prod
  → Billing separation: track costs per environment
  → Security boundary: Prod credentials separate from Dev

AWS ORGANIZATIONS:
  Management account (root) controls member accounts
  Organizational Units (OUs): group accounts by purpose
  
  Example OU structure:
  Root
  ├── Security OU
  │   ├── Security-Audit account
  │   └── Security-Logging account
  ├── Infrastructure OU
  │   └── Shared-Services account (DNS, monitoring)
  ├── Workloads OU
  │   ├── Production OU
  │   │   ├── Prod-App account
  │   │   └── Prod-Data account
  │   └── Non-Production OU
  │       ├── Dev account
  │       └── Staging account

SCPs (Service Control Policies):
  Guardrails applied to entire OU/account
  Cannot override: no matter who, what role
  
  Examples:
  "DenyDeleteCloudTrail": prevent disabling audit logs
  "DenyNonApprovedRegions": only allow ap-southeast-1
  "RequireIMDSv2": enforce secure metadata service
```

---

# 8. CI/CD — Tại Sao & Các Patterns

## 8.1 Tại Sao CI/CD?

```
TRƯỚC CI/CD:
  Developer code trên branch hàng tuần
  Merge vào main → "merge hell" (conflicts everywhere)
  Manual deploy: login server, git pull, restart app
  Test: manually click through features
  Release: weekend maintenance window, 2am deploy
  
  Problems:
    Slow feedback: bug introduced Monday, found Friday
    Risky releases: big batches, hard to rollback
    Manual error-prone: "works on my machine"
    Fear of deployment: teams deploy less often → bigger batches → more risk!

WITH CI/CD:
  Continuous Integration: merge to main frequently (multiple times/day)
    → Automated tests run on every push
    → Fast feedback: bug found in minutes, not days
    → Small merges → fewer conflicts
  
  Continuous Delivery: every commit COULD be deployed (with manual approval)
  Continuous Deployment: every commit IS deployed automatically
  
  Benefits:
    Small batches: easy to identify what broke
    Fast rollback: revert 1 commit, not 1 month of changes
    Low-risk deployments: small changes, easy to verify
    Developer confidence: know if code is good immediately
```

## 8.2 GitHub Actions — Modern CI/CD

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: ap-southeast-1
  ECR_REPOSITORY: my-app
  ECS_SERVICE: my-app-service
  ECS_CLUSTER: my-cluster

jobs:
  # ── JOB 1: TEST ──
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 10s

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Run tests
        run: mvn test
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/testdb
          SPRING_DATASOURCE_PASSWORD: test

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  # ── JOB 2: BUILD & PUSH IMAGE ──
  build:
    needs: test  # only if tests pass!
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    outputs:
      image: ${{ steps.build-image.outputs.image }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, push image
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

  # ── JOB 3: DEPLOY TO ECS ──
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production  # requires manual approval!

    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition my-app \
            --query taskDefinition > task-definition.json

      - name: Update task definition with new image
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: my-app
          image: ${{ needs.build.outputs.image }}

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true  # wait until deploy complete
```

## 8.3 Deployment Strategies

```
BLUE/GREEN DEPLOYMENT:
  Blue = current production (v1)
  Green = new version (v2)
  
  1. Deploy v2 to new "green" environment (separate ASG/ECS tasks)
  2. Run smoke tests on green
  3. Shift traffic: ALB switches target group → 100% → green
  4. Keep blue running for quick rollback
  5. After confidence: terminate blue
  
  Pros: zero downtime, instant rollback (switch back to blue)
  Cons: 2x resources during deployment (cost)

ROLLING DEPLOYMENT:
  Replace instances one batch at a time
  
  100% v1 running
  → Replace 25%: 75% v1 + 25% v2
  → Replace 25%: 50% v1 + 50% v2
  → Replace 25%: 25% v1 + 75% v2
  → Replace 25%: 100% v2
  
  Pros: gradual, lower cost (no double resources)
  Cons: two versions running simultaneously (API compatibility!)
        rollback = another rolling deploy

CANARY DEPLOYMENT:
  Send small % of traffic to new version first
  
  100% v1
  → 5% → v2, 95% → v1 (canary)
  Monitor metrics (error rate, latency)
  → 20% v2, 80% v1 (if metrics good)
  → 100% v2 (or rollback if metrics bad)
  
  Pros: early error detection with minimal user impact
  Cons: complex traffic splitting setup, longer deployment

FEATURE FLAGS:
  Deploy code but keep feature OFF
  Enable for specific users (internal, beta, % of users)
  → Separate deployment from feature release!
  
  LaunchDarkly, AWS AppConfig, custom solution
  Toggle feature without deployment: instant rollback!
```

---

# 9. Docker — Cơ Chế Bên Trong

## 9.1 Docker vs Virtual Machines

```
VIRTUAL MACHINE:
  Hardware
  └── Hypervisor (Type 1: bare metal, Type 2: on OS)
       ├── VM 1: Guest OS (full Linux kernel) + App A
       ├── VM 2: Guest OS (full Linux kernel) + App B
       └── VM 3: Guest OS (full Windows) + App C
  
  Each VM: 1-4GB OS overhead, minutes to start
  Isolation: complete (separate kernel)

DOCKER CONTAINER:
  Hardware
  └── Host OS (Linux kernel)
       └── Docker Engine
            ├── Container A: App A + libs (shared kernel!)
            ├── Container B: App B + libs (shared kernel!)
            └── Container C: App C + libs (shared kernel!)
  
  Each container: ~MBs overhead, seconds to start
  Isolation: process-level (namespaces + cgroups)
  
DOCKER USES LINUX FEATURES:
  Namespaces: isolation
    PID namespace: container sees own process tree (PID 1 = app)
    Network namespace: own network stack, IP, ports
    Mount namespace: own filesystem view
    User namespace: own user IDs
    UTS namespace: own hostname
    
  cgroups (control groups): resource limits
    CPU: container can use max 2 cores
    Memory: container limited to 512MB
    I/O: bandwidth limits
    Prevents "noisy neighbor" problem
    
  Union filesystem (overlay2):
    Layers: base image + each Dockerfile command = 1 layer
    Read-only layers (shared between containers!)
    Thin writable layer per container
    → 10 containers from same image → 10 writable layers + 1 shared read-only layers
    → Huge disk space savings!
```

## 9.2 Dockerfile Best Practices

```dockerfile
# ── MULTI-STAGE BUILD (production pattern) ──
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Copy dependencies first (cache layer!)
COPY pom.xml .
RUN mvn dependency:go-offline -B  # download deps → cached layer

# Then copy source (this layer invalidated when source changes)
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Runtime (minimal image!)
FROM eclipse-temurin:21-jre-alpine AS runtime
# alpine = tiny base (5MB vs 100MB+ for full Ubuntu)
# jre = just runtime, no compiler (smaller than jdk)

# Security: don't run as root!
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

# Copy only the JAR from builder stage (not source code, not Maven!)
COPY --from=builder /build/target/app.jar app.jar

# Document port (does NOT publish):
EXPOSE 8080

# Health check:
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# Use exec form (not shell form) → proper signal handling!
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]

# LAYER ORDERING PRINCIPLES:
# 1. Things that change rarely → EARLY (pom.xml dependencies)
# 2. Things that change often → LATE (source code)
# → Cache hits for slow layers, only rebuild fast layers

# COMMON MISTAKES:
# ❌ RUN apt-get update && RUN apt-get install  (2 layers, second might use stale cache)
# ✅ RUN apt-get update && apt-get install -y package && rm -rf /var/lib/apt/lists/*
#    (1 layer, cleanup in same layer = smaller image!)

# ❌ COPY . .  (copies everything including .git, node_modules, IDE files)
# ✅ .dockerignore file: .git, node_modules, target, *.md, .env
```

## 9.3 Docker Networking & Volumes

```yaml
# docker-compose.yml (development environment)
version: "3.9"

services:
  app:
    build:
      context: .
      target: runtime          # use runtime stage from multi-stage
    ports:
      - "8080:8080"            # host:container
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/myapp
      # 'db' = service name in same network → DNS resolution!
      SPRING_PROFILES_ACTIVE: dev
    depends_on:
      db:
        condition: service_healthy  # wait for DB health check!
    networks:
      - backend

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password  # dev only! use secrets in prod!
    volumes:
      - postgres_data:/var/lib/postgresql/data  # named volume: persist data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # init script
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass password
    volumes:
      - redis_data:/data
    networks:
      - backend

volumes:
  postgres_data:    # named volume: managed by Docker, persists across restarts
  redis_data:

networks:
  backend:
    driver: bridge  # default, containers can communicate by service name
```

---

# 10. Kubernetes — Orchestration

## 10.1 Tại Sao Kubernetes?

```
Docker trên 1 server:
  "What if server dies?" → app down!
  "Traffic spike?" → 1 server, cannot scale
  "Update app?" → manual, downtime

Docker Swarm / Kubernetes: orchestrate containers across MANY servers

WHY KUBERNETES WON:
  Google open-sourced Borg (internal) as Kubernetes (2014)
  Rich ecosystem, declarative config, auto-healing, self-service

KUBERNETES DOES:
  ✅ Self-healing: container crashes → auto-restart
  ✅ Auto-scaling: CPU/memory based horizontal scaling
  ✅ Rolling deployments: zero-downtime updates
  ✅ Service discovery: pods find each other by service name
  ✅ Load balancing: distribute traffic across pod replicas
  ✅ Config management: ConfigMaps, Secrets (not baked in image!)
  ✅ Storage orchestration: auto-provision PersistentVolumes
  ✅ Bin packing: efficiently fit containers on nodes
```

## 10.2 Kubernetes Architecture

```
CONTROL PLANE (master node — AWS manages in EKS):
  API Server:    entry point for all K8s operations
                 kubectl, CI/CD, all talk to API server
  etcd:          distributed key-value store
                 cluster state, all resource definitions
  Scheduler:     decides WHICH node to run pod on
                 considers: resource requests, affinity, taints
  Controller Manager: watches desired state vs actual state
                 ReplicaSet controller: "3 pods desired, only 2 running → create 1"
                 Node controller: "node not responding → mark NotReady"

WORKER NODES (you manage or Fargate):
  kubelet:       agent on each node
                 watch API server for pods assigned to this node
                 start/stop containers, report status
  kube-proxy:    network proxy on each node
                 iptables/IPVS rules for service load balancing
  Container Runtime: containerd (or Docker)
                 actually runs containers

DESIRED STATE vs ACTUAL STATE:
  You define: "I want 3 replicas of my-app"
  K8s stores in etcd
  Controllers continuously reconcile:
    etcd: 3 desired
    Actual: 2 running (1 crashed)
    → Controller creates 1 new pod → converge to desired state
  This reconciliation loop is the heart of Kubernetes!
```

## 10.3 Core Resources

```yaml
# POD: smallest deployable unit (1+ containers sharing network/storage)
apiVersion: v1
kind: Pod
metadata:
  name: my-app-pod
  labels:
    app: my-app
    version: v1.2.3
spec:
  containers:
  - name: my-app
    image: 123456.dkr.ecr.ap-southeast-1.amazonaws.com/my-app:v1.2.3
    ports:
    - containerPort: 8080
    resources:
      requests:             # minimum guaranteed
        cpu: "250m"         # 250 millicores = 0.25 CPU
        memory: "256Mi"
      limits:               # maximum allowed
        cpu: "500m"         # 0.5 CPU
        memory: "512Mi"     # OOMKilled if exceeded!
    livenessProbe:          # restart if fails
      httpGet:
        path: /actuator/health/liveness
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:         # remove from service if fails
      httpGet:
        path: /actuator/health/readiness
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
    env:
    - name: SPRING_PROFILES_ACTIVE
      value: "production"
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:       # from Secret, not hardcoded!
          name: db-secret
          key: password

---
# DEPLOYMENT: manages ReplicaSet, rolling updates
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1     # allow 1 pod down during update
      maxSurge: 1           # allow 1 extra pod during update
  template:
    metadata:
      labels:
        app: my-app
    spec:
      # Spread pods across AZs (HA!):
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: my-app
      containers:
      - name: my-app
        image: 123456.dkr.ecr.ap-southeast-1.amazonaws.com/my-app:v1.2.3
        # ... (same as pod spec above)

---
# SERVICE: stable endpoint for pods (pods come and go, service IP is stable)
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app             # routes to pods with this label
  ports:
  - port: 80                # service port
    targetPort: 8080        # pod port
  type: ClusterIP           # internal only (default)
  # type: LoadBalancer      # creates AWS NLB (external access)
  # type: NodePort          # exposes on each node's IP:port

---
# INGRESS: HTTP/HTTPS routing to services (needs Ingress Controller like nginx or ALB)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api/users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80
      - path: /api/orders
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 80

---
# CONFIGMAP: non-sensitive configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  application.properties: |
    spring.datasource.url=jdbc:postgresql://db:5432/myapp
    logging.level.root=INFO
  MAX_CONNECTIONS: "100"

---
# SECRET: sensitive data (base64 encoded, NOT encrypted by default!)
# Use AWS Secrets Manager + External Secrets Operator for real encryption!
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  password: cGFzc3dvcmQ=  # base64("password") — NOT secure by itself!

---
# HPA: Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # scale when avg CPU > 70%
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

# 11. Infrastructure as Code — Terraform

## 11.1 Tại Sao IaC?

```
MANUAL INFRASTRUCTURE (ClickOps):
  Login AWS Console → click → create resources
  
  Problems:
    No history: who created what, when?
    Not reproducible: "I set it up somehow, I forgot"
    Drift: prod and staging diverge over time (manual changes)
    No review: no PR process for infrastructure changes
    Fear: "what if I change this and break prod?"

INFRASTRUCTURE AS CODE:
  Infrastructure defined in code files → version controlled
  
  Benefits:
    Version history: git log → "who added this security group, why?"
    Reproducible: apply same config → same infrastructure, every time
    Code review: PR for infrastructure changes (peer review!)
    Drift detection: terraform plan → shows what changed
    Automation: CI/CD pipeline applies infra changes
    Documentation: code IS documentation
```

## 11.2 Terraform Core Concepts

```hcl
# Provider: tells Terraform which cloud to manage
terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state (CRITICAL for teams!):
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"  # prevent concurrent applies!
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "github.com/company/infra"
    }
  }
}

# Variables:
variable "aws_region" {
  description = "AWS region to deploy in"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

# Data sources: reference existing AWS resources
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

data "aws_vpc" "default" {
  default = true
}

# Resource: create AWS resources
resource "aws_instance" "app_server" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.private.id  # reference to other resource!

  iam_instance_profile = aws_iam_instance_profile.app.name

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    systemctl start amazon-ssm-agent
  EOF

  tags = {
    Name = "${var.environment}-app-server"
  }

  lifecycle {
    create_before_destroy = true  # create new before destroying old (HA!)
    ignore_changes = [user_data]  # don't recreate if user_data changes
  }
}

# Locals: computed values
locals {
  common_name = "${var.environment}-my-app"
  azs         = slice(data.aws_availability_zones.available.names, 0, 3)
}

# Outputs: expose values after apply
output "app_server_private_ip" {
  description = "Private IP of app server"
  value       = aws_instance.app_server.private_ip
}

output "load_balancer_dns" {
  description = "ALB DNS name"
  value       = aws_lb.app.dns_name
}
```

## 11.3 Terraform Workflow & State

```
TERRAFORM STATE:
  terraform.tfstate = JSON file mapping config ↔ actual resources
  
  Critical! Without state:
    Terraform doesn't know what resources exist
    Cannot update or destroy existing resources
    
  Remote state (S3 + DynamoDB lock):
    Team shares same state
    DynamoDB prevents concurrent applies (state lock)
    S3 versioning: recover from corrupted state
    
  NEVER manually edit state!
  Use: terraform state mv, terraform import, terraform state rm

WORKFLOW:
  terraform init     → download providers, configure backend
  terraform plan     → show what will change (dry run)
  terraform apply    → make changes (prompts for approval)
  terraform destroy  → delete all managed resources

TERRAFORM PLAN OUTPUT:
  + create   → new resource (green)
  ~ update   → modify existing (yellow)
  - destroy  → delete resource (red)
  -/+ replace → destroy then create (when can't update in-place)
  
  DANGEROUS: -/+ on RDS instance, EC2 instance
  → destroys production database!
  → lifecycle.prevent_destroy = true prevents this!
```

## 11.4 Terraform Modules

```hcl
# module/vpc/main.tf — reusable VPC module
resource "aws_vpc" "this" {
  cidr_block           = var.cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = var.name }
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnets)
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.public_subnets[count.index]
  availability_zone = var.azs[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "${var.name}-public-${count.index + 1}" }
}

# Output module values:
output "vpc_id" { value = aws_vpc.this.id }
output "public_subnet_ids" { value = aws_subnet.public[*].id }

# Using module:
# main.tf
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"   # public registry!
  version = "~> 5.0"

  name = "${var.environment}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "prod"  # save cost in dev
  enable_dns_hostnames   = true
}

module "rds" {
  source = "terraform-aws-modules/rds/aws"
  # ... pass vpc_id from vpc module output
  vpc_security_group_ids = [module.vpc.vpc_id]
}
```

---

# 12. Monitoring & Observability

## 12.1 Three Pillars of Observability

```
OBSERVABILITY = ability to understand what's happening inside system
from OUTSIDE, using outputs (metrics, logs, traces).

METRICS: numeric measurements over time
  CPU: 45% at 14:30, 89% at 14:31
  Request rate: 1000 req/s
  Error rate: 0.1%
  P99 latency: 450ms
  → WHAT is happening (aggregated)

LOGS: text events with context
  ERROR 2025-05-01 14:31:05 OrderService - Failed to process order: userId=123, error=...
  → WHAT happened, with details (individual events)

TRACES: end-to-end request tracking
  Request ID abc123:
    API Gateway: 10ms
    → OrderService: 50ms
      → DB query: 35ms (slow!)
      → UserService call: 5ms
    → Response: 200 OK
  → WHERE time was spent, which service is slow
  
THREE TOGETHER:
  Alert fires: P99 latency spike (metric)
  Navigate to traces: find slow requests
  Drill into logs: "DB connection pool exhausted at 14:31"
  → Root cause in minutes, not hours!
```

## 12.2 CloudWatch — AWS Native

```
METRICS:
  AWS services auto-publish metrics to CloudWatch
  EC2: CPUUtilization, NetworkIn, DiskReadOps
  RDS: DatabaseConnections, FreeStorageSpace, ReadLatency
  ALB: RequestCount, HTTPCode_Target_5XX_Count, TargetResponseTime
  Lambda: Duration, Errors, Throttles, ConcurrentExecutions

Custom metrics from application:
  # Spring Boot Actuator → Micrometer → CloudWatch
  management.metrics.export.cloudwatch.namespace=MyApp
  management.metrics.export.cloudwatch.enabled=true

ALARMS:
  Alert when metric crosses threshold
  Actions: SNS → email/SMS/PagerDuty, Auto Scaling, Lambda

  Example: "Alert if error rate > 1% for 5 consecutive minutes"
  → SNS → PagerDuty → page on-call engineer

LOG GROUPS & LOG STREAMS:
  Log Group: collection of logs from same source
  Log Stream: sequence from single instance
  /aws/lambda/my-function → CloudWatch Log Group
  
  Log Insights: query logs with SQL-like syntax
  fields @timestamp, @message
  | filter @message like /ERROR/
  | sort @timestamp desc
  | limit 50
  
  Container Logs → CloudWatch: use awslogs driver in ECS task definition

DASHBOARDS:
  Custom dashboards: combine metrics from multiple services
  Production Dashboard:
    - Request rate (ALB)
    - Error rate (ALB 5xx)
    - P99 latency (ALB)
    - CPU/Memory (ECS)
    - DB connections (RDS)
    - Cache hit rate (ElastiCache)
```

## 12.3 Distributed Tracing — X-Ray

```java
// AWS X-Ray: trace requests across microservices
// Visualize service map, find bottlenecks

// Spring Boot + X-Ray:
@EnableXRay
@SpringBootApplication
public class Application { }

// X-Ray SDK auto-instruments:
//   HTTP requests (incoming + outgoing)
//   AWS SDK calls (S3, DynamoDB, SQS)
//   SQL queries (via JDBC)

// Add custom segment:
import com.amazonaws.xray.AWSXRay;

@Service
public class OrderService {
    public Order processOrder(OrderRequest req) {
        // Create subsegment for custom code:
        AWSXRay.createSubsegment("processPayment", () -> {
            paymentService.charge(req.getPaymentInfo());
        });
        return orderRepo.save(new Order(req));
    }
}

// X-Ray shows:
// Request trace: API GW → Service A (20ms) → DynamoDB (5ms)
//                         → Service B (50ms) ← SLOW!
//                           → RDS (45ms) ← ROOT CAUSE
// → Service B's RDS query is slow → optimize query!
```

## 12.4 Application Metrics Best Practices

```yaml
# Spring Boot Actuator + Micrometer setup:

# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    tags:
      application: ${spring.application.name}
      environment: ${spring.profiles.active}
    export:
      prometheus:
        enabled: true  # for Prometheus/Grafana stack

# In code — custom metrics:
```

```java
@Service
public class OrderService {

    private final Counter ordersCreatedCounter;
    private final Timer orderProcessingTimer;
    private final Gauge pendingOrdersGauge;

    public OrderService(MeterRegistry registry) {
        // Counter: total orders created (monotonically increasing)
        ordersCreatedCounter = Counter.builder("orders.created")
            .description("Total orders created")
            .tag("status", "success")
            .register(registry);

        // Timer: how long order processing takes
        orderProcessingTimer = Timer.builder("order.processing.duration")
            .description("Order processing time")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);

        // Gauge: current value (pending orders in queue)
        Gauge.builder("orders.pending.count", orderRepo, OrderRepository::countPending)
            .description("Current pending orders")
            .register(registry);
    }

    public Order createOrder(OrderRequest req) {
        return orderProcessingTimer.record(() -> {
            Order order = processOrder(req);
            ordersCreatedCounter.increment();
            return order;
        });
    }
}

// Key metrics to track:
// Business: orders/hour, revenue/hour, conversion rate
// Application: request rate, error rate, latency (P50/P95/P99)
// Infrastructure: CPU, memory, connections, disk
// Dependencies: DB query time, external API latency, cache hit rate

// USE SLIs, SLOs, SLAs:
// SLI (Service Level Indicator): actual measurement
//   "API P99 latency = 450ms"
// SLO (Service Level Objective): target
//   "P99 latency < 500ms for 99.9% of requests"
// SLA (Service Level Agreement): contract with customers
//   "99.9% uptime per month = max 43.8 minutes downtime"
// Error Budget: allowed violations before freezing deployments
//   99.9% SLO → 0.1% error budget = 43.8 min/month
```

---

# 13. High Availability & Disaster Recovery

## 13.1 Availability Concepts

```
AVAILABILITY = uptime / (uptime + downtime) × 100%

"Five nines" 99.999% = 5.26 minutes downtime/year
"Four nines" 99.99%  = 52.6 minutes downtime/year  (most target this)
"Three nines" 99.9%  = 8.76 hours downtime/year

SINGLE POINTS OF FAILURE (SPOF):
  Any component that, if failed, takes down entire system
  
  Common SPOFs:
    Single EC2 → 1 server fails → down
    Single AZ → AZ has outage → down
    Single DB → DB fails → down
    Single NAT Gateway → all outbound fails
  
  Eliminate SPOFs:
    Multiple EC2 behind ASG
    Multi-AZ deployments
    RDS Multi-AZ
    NAT Gateway per AZ

FAULT TOLERANCE vs HIGH AVAILABILITY:
  HA: system remains AVAILABLE despite failures (user doesn't notice)
  FT: system continues operating through faults with ZERO service degradation
  HA = weaker requirement than FT
  FT: flight control systems (no degradation allowed)
  HA: web apps (brief slowdown OK, complete outage not OK)
```

## 13.2 DR Strategies

```
RPO (Recovery Point Objective): max acceptable data loss
  "If disaster happens at 2pm, latest we can recover from is 1pm" = 1hr RPO

RTO (Recovery Time Objective): max acceptable downtime
  "System must be back online within 4 hours of disaster" = 4hr RTO

DR STRATEGIES (cost vs RTO/RPO tradeoff):

BACKUP & RESTORE (cheapest):
  RTO: hours. RPO: hours.
  S3 backups, AMI snapshots
  Disaster → restore from backup → hours to recover
  Cost: minimal (just storage)
  Use: dev/test, non-critical systems

PILOT LIGHT:
  RTO: 10-30 min. RPO: minutes.
  Core services running in DR region at minimal scale
  DB replication active (minimal RDS instance)
  Disaster → scale up, switch DNS
  Cost: low (small instance running)

WARM STANDBY:
  RTO: minutes. RPO: seconds.
  Full scale-down copy running in DR region
  DB replication, scaled-down EC2/ECS
  Disaster → scale up to production, switch DNS
  Cost: medium (running scaled-down)

MULTI-SITE ACTIVE-ACTIVE (most expensive):
  RTO: near zero. RPO: near zero.
  Full production running in 2+ regions simultaneously
  Traffic split between regions (Route 53 weighted routing)
  Disaster → remove failed region from DNS
  Cost: 2x production infrastructure
  Use: critical systems (banking, healthcare)
```

## 13.3 Route 53 Routing Policies

```
Route 53 = AWS DNS service

ROUTING POLICIES for HA/DR:

SIMPLE: return 1 IP address
  → single resource, no HA

WEIGHTED: split traffic by percentage
  Region A: weight 70 (70% traffic)
  Region B: weight 30 (30% traffic → DR test or canary)

FAILOVER: primary + secondary
  Primary: active region
  Secondary: DR region
  Health check on primary → if unhealthy → auto-failover to secondary
  → DNS TTL matters! Short TTL (30-60s) = faster failover

LATENCY-BASED: route to lowest latency region
  User in Vietnam → Singapore region (20ms)
  User in Europe → Frankfurt region (10ms)
  → Global performance optimization

GEOLOCATION: route based on user location
  APAC users → Singapore
  European users → Frankfurt
  US users → us-east-1
  → Data sovereignty compliance, localization

GEOPROXIMITY: route by proximity, with bias
  Shift traffic between regions by adjusting bias

HEALTH CHECKS:
  Route 53 checks endpoints: HTTP, HTTPS, TCP
  Failed health check → remove from DNS → DNS failover
  CloudWatch metric health check: custom logic
```

---

# 14. Security Best Practices

## 14.1 AWS Security Pillars

```
DEFENSE IN DEPTH: multiple security layers
  If one layer fails → other layers contain the breach

Layer 1: Identity (IAM)
  Strong passwords, MFA required
  Least privilege roles
  No root account for daily use
  Rotate access keys regularly

Layer 2: Perimeter (Network)
  VPC with private subnets
  Security groups (deny all by default)
  NACLs for subnet-level control
  WAF for web application attacks

Layer 3: Data
  Encryption at rest (S3 SSE, EBS encryption, RDS encryption)
  Encryption in transit (HTTPS, TLS 1.2+)
  KMS for key management
  Secrets Manager for passwords/API keys (NOT hardcoded!)

Layer 4: Application
  Input validation, output encoding
  Dependency scanning (Snyk, Dependabot)
  OWASP Top 10 mitigations
  Container image scanning (ECR scan on push)

Layer 5: Detection & Response
  CloudTrail: log all API calls (who did what, when)
  GuardDuty: threat detection (unusual API calls, crypto mining)
  Security Hub: centralized security findings
  Config: track resource configuration changes
```

## 14.2 Secrets Management

```bash
# NEVER do this:
# application.yml
spring:
  datasource:
    password: "mypassword123"  # ← committed to git → EXPOSED!

# CORRECT: AWS Secrets Manager
aws secretsmanager create-secret \
  --name "prod/myapp/db-password" \
  --secret-string "mypassword123"

# Application retrieves at startup:
# Spring Cloud AWS auto-resolves:
spring:
  datasource:
    password: "${aws-secretsmanager:/prod/myapp/db-password}"

# Lambda:
import boto3, json
def get_secret():
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId="prod/myapp/db-password")
    return json.loads(response["SecretString"])

# Rotation:
# Secrets Manager can auto-rotate on schedule
# Rotates DB password AND updates secret value atomically
# Zero downtime rotation!

# ENV VARS in ECS/EKS:
# ECS Task Definition:
{
  "secrets": [{
    "name": "DB_PASSWORD",
    "valueFrom": "arn:aws:secretsmanager:region:account:secret:prod/myapp/db-password"
  }]
}
# ECS injects secret value as env var at container start
```

## 14.3 Security Scanning & Compliance

```yaml
# GitHub Actions security scanning:
name: Security Scan

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      # Dependency vulnerability scan:
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          vuln-type: 'library'
          severity: 'CRITICAL,HIGH'

      # Container image scan:
      - name: Scan Docker image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.IMAGE_TAG }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          exit-code: '1'  # fail if critical found

      # Secret detection:
      - name: Detect secrets
        uses: gitleaks/gitleaks-action@v2

      # SAST (Static Application Security Testing):
      - name: CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          languages: java

# AWS Config Rules (detect misconfigurations):
# s3-bucket-public-read-prohibited
# rds-instance-public-access-check
# encrypted-volumes (all EBS must be encrypted)
# root-account-mfa-enabled
# cloudtrail-enabled
# iam-password-policy
```

## 14.4 Cost Optimization

```
COST PILLARS:
  Right-sizing: match instance size to actual usage
    EC2 t3.xlarge running at 10% CPU? → downsize to t3.medium
    Use AWS Compute Optimizer recommendations
    
  Reserved Instances / Savings Plans: commit for discount
    Steady workloads: 1-year RI = 40% savings
    Flexible: Compute Savings Plan
    
  Spot Instances: 70-90% cheaper
    Stateless, fault-tolerant: batch jobs, CI/CD workers
    Mixed fleet (On-Demand + Spot) for ASG
    
  S3 lifecycle policies: auto-tier to cheaper storage
    Standard → Standard-IA (30 days) → Glacier (90 days)
    
  Data transfer optimization:
    Data transfer within same AZ: FREE
    Cross-AZ: $0.01/GB (use VPC endpoints!)
    Internet egress: $0.09/GB (put CloudFront in front!)
    
  Unused resources:
    Stop dev instances nights/weekends
    Delete unattached EBS volumes
    Remove old AMI snapshots
    
  Cost Allocation Tags:
    Tag all resources: Environment, Team, Project
    AWS Cost Explorer: drill down costs per team/project
    
TOOLS:
  AWS Cost Explorer: visualize, forecast, anomaly detection
  AWS Budgets: set alerts when spending exceeds threshold
  Trusted Advisor: recommendations (cost, security, performance)
  Compute Optimizer: right-sizing EC2, Lambda, ECS
```

---

## 📎 Quick Reference

```
AWS ACCOUNT STRUCTURE:
  Organizations → OUs → Accounts (dev/staging/prod separate)
  SCPs: guardrails per OU
  CloudTrail: audit log for all accounts

NETWORKING:
  VPC → Subnets (public/private) per AZ
  IGW (internet), NAT GW (outbound only), VPC Endpoint (AWS services)
  Security Group (instance, stateful), NACL (subnet, stateless)

COMPUTE CHOICE:
  Predictable, always-on: EC2 Reserved
  Variable, manageable: EC2 + ASG + On-Demand/Spot mix
  Containers: ECS Fargate (simple) or EKS (K8s expertise)
  Event-driven: Lambda
  
STORAGE CHOICE:
  Object (images, backups): S3
  Block (DB, OS): EBS gp3
  Shared filesystem: EFS
  
DATABASE CHOICE:
  Relational, managed: RDS PostgreSQL
  High performance relational: Aurora
  Serverless NoSQL: DynamoDB
  Cache: ElastiCache Redis
  
HIGH AVAILABILITY:
  Multi-AZ for databases
  ASG across 3 AZs for compute
  ALB in front
  Route 53 health checks for DNS failover
  
CI/CD:
  GitHub Actions → Test → Build image → Push ECR → Deploy ECS/EKS
  Blue/Green for zero-downtime
  Canary for progressive rollout
  
OBSERVABILITY:
  CloudWatch: AWS native metrics + logs
  X-Ray: distributed tracing
  Custom metrics: Micrometer → Prometheus → Grafana
  
SECURITY:
  IAM roles, not keys for services
  Secrets Manager for credentials
  VPC private subnets, security groups
  Encryption at rest + transit
  CloudTrail for audit
```

## 📎 Official Documentation Links

| Topic | Link |
|---|---|
| AWS Well-Architected Framework | <https://aws.amazon.com/architecture/well-architected> |
| AWS Documentation | <https://docs.aws.amazon.com> |
| ECS Best Practices | <https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide> |
| EKS Best Practices | <https://aws.github.io/aws-eks-best-practices> |
| Terraform AWS Provider | <https://registry.terraform.io/providers/hashicorp/aws/latest> |
| Terraform AWS Modules | <https://registry.terraform.io/namespaces/terraform-aws-modules> |
| GitHub Actions for AWS | <https://github.com/aws-actions> |
| Docker Best Practices | <https://docs.docker.com/build/building/best-practices> |
| Kubernetes Docs | <https://kubernetes.io/docs> |
| AWS Pricing Calculator | <https://calculator.aws.amazon.com> |
| CloudWatch Dashboards | <https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring> |
| AWS Security Hub | <https://docs.aws.amazon.com/securityhub> |
