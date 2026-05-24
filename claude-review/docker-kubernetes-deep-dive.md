# 🐳 Docker & Kubernetes — Complete Deep Dive
>
> Containerization, Images, Networking, Deploy Workflow, K8s Architecture

---

## 📚 Table of Contents

1. [Containerization Fundamentals](#1-containerization-fundamentals)
2. [Docker Architecture](#2-docker-architecture)
3. [Dockerfile — Build Images](#3-dockerfile--build-images)
4. [Docker Networking & Storage](#4-docker-networking--storage)
5. [Docker Compose](#5-docker-compose)
6. [Kubernetes Architecture](#6-kubernetes-architecture)
7. [Kubernetes Workloads](#7-kubernetes-workloads)
8. [Kubernetes Networking & Services](#8-kubernetes-networking--services)
9. [Kubernetes Config & Storage](#9-kubernetes-config--storage)
10. [Deploy Workflow — CI/CD Pipeline](#10-deploy-workflow--cicd-pipeline)
11. [Kubernetes Production Patterns](#11-kubernetes-production-patterns)
12. [Monitoring & Troubleshooting](#12-monitoring--troubleshooting)

---

# 1. Containerization Fundamentals

## 1.1 Vấn Đề Trước Containers

```
"IT WORKS ON MY MACHINE!" — câu nói kinh điển trước thời containers

VẤN ĐỀ:
  Dev machine:   Java 17, Ubuntu 22, PostgreSQL 15, env vars set
  Staging:       Java 11, CentOS 7, PostgreSQL 12, env vars missing
  Production:    Java 21, RHEL 8, PostgreSQL 14, different configs
  → App chạy khác nhau trên mỗi môi trường!

CÁC GIẢI PHÁP TRƯỚC CONTAINERS:
  VM (Virtual Machine):
    + Complete isolation (own OS)
    + Reproducible environment
    - Heavy: GB per VM, slow to start (minutes)
    - Wasteful: OS overhead for each app
    - Hard to ship: VM images are huge

  Configuration Management (Ansible, Chef, Puppet):
    + Automates setup
    - "Snowflake servers": each server drifts differently over time
    - Slow: configure server from scratch takes hours
    - Drift: servers diverge as they're patched/updated differently

CONTAINER SOLUTION:
  Package app + all dependencies + config into ONE UNIT
  Run identically on any machine with container runtime
  Lightweight: share host OS kernel (not own OS like VM)
  Fast: start in milliseconds (no OS boot)
  Portable: "build once, run anywhere"

CONTAINER vs VM:
  ┌─────────────────────────────────────────────────────────┐
  │    VMs                        Containers                │
  │                                                         │
  │  ┌──────┐ ┌──────┐          ┌──────┐ ┌──────┐         │
  │  │App A │ │App B │          │App A │ │App B │         │
  │  ├──────┤ ├──────┤          ├──────┤ ├──────┤         │
  │  │Libs  │ │Libs  │          │Libs  │ │Libs  │         │
  │  ├──────┤ ├──────┤          └──────┴─┴──────┘         │
  │  │Guest │ │Guest │              Container Runtime      │
  │  │OS    │ │OS    │              ─────────────────       │
  │  ├──────┴─┴──────┤              HOST OS KERNEL          │
  │  │  Hypervisor   │          ─────────────────────────  │
  │  ├───────────────┤              Hardware                │
  │  │  Host OS      │                                     │
  │  ├───────────────┤                                     │
  │  │  Hardware     │                                     │
  └─────────────────────────────────────────────────────────┘
  VM: each has full OS (GBs, minutes boot)
  Container: share kernel (MBs, milliseconds start)
```

## 1.2 How Containers Work (Linux Internals)

```
Containers = Linux kernel features packaged nicely:

NAMESPACES (Isolation):
  pid:    process sees only its own processes (isolated PID tree)
  net:    process has its own network stack (interfaces, routing)
  mnt:    process sees its own filesystem mount points
  uts:    process has its own hostname
  ipc:    process has isolated IPC (inter-process communication)
  user:   process can have different user/group mappings
  cgroup: process has its own cgroup hierarchy
  → Container thinks it's the only process on the machine!

CGROUPS (Resource Limits):
  Limit CPU: container can only use 0.5 CPU cores
  Limit Memory: container can only use 512MB RAM
  Limit I/O: container can only do X bytes/sec disk I/O
  Limit Network: container bandwidth limits
  → Prevents one container from starving others!

UNION FILESYSTEM (Layered Images):
  Each layer = set of filesystem changes (files added/modified/deleted)
  Layers stacked → single filesystem view
  Copy-on-Write: reads from lower layers, writes to top layer
  Layer sharing: multiple containers share same base layers!
  
  Layer 1: Ubuntu base OS (150MB)     ← shared by all Ubuntu containers
  Layer 2: Java 17 runtime (300MB)   ← shared by all Java apps
  Layer 3: App dependencies (50MB)    ← shared by same app version
  Layer 4: App code (10MB)            ← unique per build
  
  Total if 10 containers: not 10×510MB = 5.1GB
  But: 510MB (shared) + 10×10MB = 610MB!  ← HUGE SAVING
```

---

# 2. Docker Architecture

## 2.1 Docker Components

```
DOCKER ARCHITECTURE:

  Developer/CI
       │ docker commands
       ▼
  ┌─────────────────────────────────────────────────┐
  │         Docker Client (CLI)                     │
  │  docker build, docker run, docker push          │
  └─────────────────────┬───────────────────────────┘
                        │ REST API (Unix socket)
                        ▼
  ┌─────────────────────────────────────────────────┐
  │         Docker Daemon (dockerd)                 │
  │  Manages: images, containers, networks, volumes │
  └──────┬───────────────────┬──────────────────────┘
         │ pull/push         │ manages
         ▼                   ▼
  ┌──────────────┐  ┌───────────────────────────────┐
  │ Docker       │  │  containerd                   │
  │ Registry     │  │  (container runtime)          │
  │              │  │         │                     │
  │  Docker Hub  │  │     runc (OCI runtime)        │
  │  ECR         │  │     creates actual containers │
  │  GCR         │  └───────────────────────────────┘
  │  Private     │
  └──────────────┘

DOCKER IMAGE:
  Read-only template for creating containers
  Consists of layers (each instruction = one layer)
  Identified by: name:tag or SHA256 digest
  Stored in: local cache or registry

DOCKER CONTAINER:
  Running instance of an image
  Writable layer on top of image layers
  Has its own network, filesystem, process space
  Ephemeral: killed container = lost data (unless volumes)

DOCKER REGISTRY:
  Repository for storing and distributing images
  Docker Hub: public registry (docker.io)
  ECR: AWS Elastic Container Registry
  GCR: Google Container Registry
  ACR: Azure Container Registry
  Self-hosted: Harbor, JFrog Artifactory
```

## 2.2 Docker Commands

```bash
# ── IMAGE MANAGEMENT ──
docker pull nginx:1.25                        # pull from registry
docker pull ubuntu:22.04
docker images                                 # list local images
docker image ls --filter "dangling=true"      # untagged images
docker image prune                            # remove dangling images
docker image prune -a                         # remove all unused images
docker rmi nginx:1.25                         # remove image
docker tag myapp:latest registry.io/team/myapp:1.0.0  # tag image
docker push registry.io/team/myapp:1.0.0     # push to registry
docker save myapp:latest > myapp.tar          # export image
docker load < myapp.tar                       # import image
docker inspect nginx:1.25                     # image metadata

# ── CONTAINER LIFECYCLE ──
docker run --name my-nginx -d -p 80:80 nginx:1.25
#  --name:  container name
#  -d:      detached (background)
#  -p HOST:CONTAINER: port mapping

docker run -it ubuntu:22.04 /bin/bash         # interactive terminal
docker run --rm ubuntu:22.04 echo "hello"     # remove after exit

docker start my-nginx                         # start stopped container
docker stop my-nginx                          # graceful stop (SIGTERM)
docker kill my-nginx                          # force stop (SIGKILL)
docker restart my-nginx                       # restart
docker pause my-nginx                         # freeze (SIGSTOP)
docker unpause my-nginx

docker ps                                     # running containers
docker ps -a                                  # all containers (including stopped)
docker rm my-nginx                            # remove stopped container
docker container prune                        # remove all stopped containers

# ── CONTAINER INSPECTION ──
docker logs my-nginx                          # stdout/stderr logs
docker logs -f my-nginx                       # follow (tail -f)
docker logs --tail 100 --since 30m my-nginx   # last 100 lines, last 30min
docker stats                                  # live resource usage
docker stats --no-stream                      # snapshot
docker inspect my-nginx                       # full metadata (JSON)
docker top my-nginx                           # running processes in container
docker diff my-nginx                          # filesystem changes vs image

# ── EXECUTE IN CONTAINER ──
docker exec -it my-nginx /bin/bash            # interactive shell
docker exec my-nginx ls /etc/nginx            # run single command
docker exec -u root my-nginx apt-get update   # run as specific user
docker cp my-nginx:/etc/nginx/nginx.conf .    # copy from container
docker cp ./config.conf my-nginx:/etc/nginx/  # copy to container

# ── RUN WITH RESOURCES ──
docker run -d \
  --name app \
  --memory="512m" \                           # max 512MB RAM
  --memory-swap="1g" \                        # RAM + swap = 1GB
  --cpus="0.5" \                              # 0.5 CPU cores
  --cpu-shares=512 \                          # relative CPU weight
  --restart=unless-stopped \                  # restart policy
  -e SPRING_PROFILES_ACTIVE=production \      # env vars
  -e DB_PASSWORD="${DB_PASSWORD}" \
  -v /host/data:/app/data \                   # volume mount
  -v /host/config:/app/config:ro \            # read-only
  --network=app-network \                     # network
  --log-driver=json-file \                    # logging
  --log-opt max-size=100m \
  --log-opt max-file=3 \
  myapp:1.0.0
```

---

# 3. Dockerfile — Build Images

## 3.1 Dockerfile Instructions

```dockerfile
# ── COMPLETE SPRING BOOT DOCKERFILE ──
# STAGE 1: Build
FROM eclipse-temurin:21-jdk-alpine AS build
# FROM <image>:<tag> AS <name>
# eclipse-temurin: AdoptOpenJDK distribution
# alpine: minimal Linux (5MB vs Ubuntu 180MB!)

WORKDIR /workspace
# Sets working directory for subsequent commands
# Creates directory if doesn't exist

# Copy dependency files FIRST (for layer caching!)
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw .
RUN chmod +x mvnw

# Download dependencies (cached layer — only re-runs if pom.xml changes!)
RUN ./mvnw dependency:go-offline -B
# -B: batch mode (no interactive output)

# Copy source code
COPY src/ src/

# Build application
RUN ./mvnw package -DskipTests -B
# DskipTests: don't run tests in Docker build (tests run in CI separately)

# ─────────────────────────────────────────
# STAGE 2: Runtime (smaller final image!)
FROM eclipse-temurin:21-jre-alpine AS runtime
# JRE only (not JDK) — smaller image, no compiler

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Creates system group and user (no home dir, no shell)

WORKDIR /app

# Copy ONLY the built artifact (not source code, not build tools!)
COPY --from=build /workspace/target/*.jar app.jar

# Change ownership to non-root user
RUN chown appuser:appgroup app.jar

# Switch to non-root user
USER appuser

# Declare port (documentation only — doesn't actually publish)
EXPOSE 8080

# JVM optimizations for containers:
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:InitialRAMPercentage=50.0 \
               -Djava.security.egd=file:/dev/./urandom"
# UseContainerSupport: JVM respects container memory limits (not host RAM)
# MaxRAMPercentage: use max 75% of container's RAM for heap
# urandom: faster startup (avoids blocking on /dev/random)

# Health check (Docker can monitor container health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -q --spider http://localhost:8080/actuator/health || exit 1
# --start-period: wait 60s before starting health checks (startup time)
# wget: lightweight alternative to curl in alpine

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
# ENTRYPOINT: main command (not overridden by docker run args)
# CMD: default args (can be overridden)
# ENTRYPOINT + CMD together: ENTRYPOINT is main, CMD is default args
```

## 3.2 Layer Caching & Optimization

```dockerfile
# ── LAYER CACHING STRATEGY ──
# Layers rebuilt from first CHANGE onwards
# Put FREQUENTLY CHANGING things LAST

# BAD order (cache busted on every code change):
COPY . .                    # copy everything (code changes often)
RUN mvn dependency:resolve  # re-downloads deps every time!

# GOOD order (cache dependencies separately):
COPY pom.xml .              # only changes when deps change
RUN mvn dependency:resolve  # cached unless pom.xml changes!
COPY src/ src/              # code changes, but deps already cached
RUN mvn package -DskipTests

# ── .dockerignore (like .gitignore) ──
# Exclude unnecessary files from build context:
cat > .dockerignore << 'EOF'
target/
.git/
.gitignore
*.md
*.log
.env
.env.*
node_modules/
test-results/
Dockerfile*
docker-compose*
.mvn/wrapper/maven-wrapper.jar
EOF
# Without .dockerignore: entire project (including target/) sent to daemon
# Slows build, increases image size!

# ── MULTI-STAGE BUILD (production pattern) ──
# Stage 1: Builder (has all build tools — JDK, Maven, Node, etc.)
FROM eclipse-temurin:21-jdk AS builder
# ... build steps ...

# Stage 2: Runtime (only what's needed to RUN)
FROM eclipse-temurin:21-jre-alpine AS runtime
COPY --from=builder /workspace/target/*.jar app.jar
# Final image: doesn't have JDK, Maven, source code, test files!
# Much smaller + more secure (less attack surface)

# ── SIZE COMPARISON ──
# Without multi-stage:  ~650MB (JDK + app + build artifacts)
# With multi-stage:     ~180MB (JRE + app only)
# With native image:    ~50MB  (GraalVM native compilation)

# ── NODE.JS EXAMPLE ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production  # exact versions, no dev deps

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # include dev deps for build
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json .
USER node                     # non-root!
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## 3.3 Docker Best Practices

```dockerfile
# ── SECURITY BEST PRACTICES ──

# 1. ALWAYS run as non-root:
RUN addgroup -S app && adduser -S app -G app
USER app
# If app needs port < 1024: use CAP_NET_BIND_SERVICE capability
# Or: use port 8080 instead of 80

# 2. Use specific version tags (not latest!):
FROM eclipse-temurin:21.0.3_9-jre-alpine  # specific version
# NOT: FROM eclipse-temurin:latest  (unpredictable!)

# 3. Scan image for vulnerabilities:
# docker scout cves myapp:latest    (Docker Desktop)
# trivy image myapp:latest           (open source scanner)
# snyk container test myapp:latest   (Snyk)

# 4. Minimize installed packages:
RUN apk add --no-cache curl         # --no-cache: no cache dir (smaller)
# NOT: apt-get install curl (without cleanup)
# apt-get:
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*     # clean up!

# 5. Don't store secrets in images!
# BAD:
ENV DB_PASSWORD=secret123           # visible in image layers!
# GOOD: inject at runtime via env or secrets manager:
# docker run -e DB_PASSWORD="$DB_PASSWORD" myapp

# 6. Read-only filesystem where possible:
docker run --read-only --tmpfs /tmp myapp

# ── HEALTHCHECK ──
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=60s \
            --retries=3 \
    CMD wget --no-verbose --tries=1 --spider \
        http://localhost:8080/actuator/health || exit 1
# exit 0 = healthy, exit 1 = unhealthy

# ── ARG vs ENV ──
ARG APP_VERSION=1.0.0       # build-time variable (not in final image)
ARG JAR_FILE=target/*.jar

ENV APP_HOME=/app            # runtime environment variable (persists in image)
ENV SPRING_PROFILES_ACTIVE=production

# Override ARG at build time:
# docker build --build-arg APP_VERSION=2.0.0 .
```

---

# 4. Docker Networking & Storage

## 4.1 Docker Networks

```bash
# ── NETWORK TYPES ──

# BRIDGE (default for containers on same host):
docker network create app-network
docker run --network=app-network --name db postgres:16
docker run --network=app-network --name app myapp
# Containers on same bridge network: resolve by container name!
# app container: curl http://db:5432  ← DNS resolution by name!

# HOST: container shares host's network (no isolation)
docker run --network=host myapp
# App binds to 0.0.0.0:8080 = directly on host port 8080
# Fastest (no NAT overhead) but no port isolation
# Linux only (not Mac/Windows)

# NONE: no network access
docker run --network=none myapp
# For offline processing tasks

# ── INSPECT NETWORKS ──
docker network ls
docker network inspect app-network
docker network connect app-network existing-container    # add to network
docker network disconnect app-network existing-container

# ── PORT MAPPING ──
# -p HOST_PORT:CONTAINER_PORT
docker run -p 8080:8080 myapp          # map host:8080 → container:8080
docker run -p 127.0.0.1:8080:8080 myapp  # only localhost access!
docker run -p 8080-8090:8080-8090 myapp  # range mapping
# Without -p: container not accessible from outside!

# ── DNS RESOLUTION ──
# On user-defined bridge network:
# Container name → IP (automatic DNS!)
# So: no hardcoded IPs needed in config
# SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/mydb
# "db" = container name on same bridge network
```

## 4.2 Docker Volumes & Storage

```bash
# ── VOLUME TYPES ──

# 1. NAMED VOLUMES (managed by Docker, best practice):
docker volume create mydata
docker run -v mydata:/app/data myapp
# Data persists even when container removed
# Location: /var/lib/docker/volumes/mydata/_data
# Docker manages it — don't modify directly on host

# 2. BIND MOUNTS (map host directory):
docker run -v /host/path:/container/path myapp
docker run -v $(pwd)/config:/app/config:ro myapp  # :ro = read-only
# Good for: development (hot reload), injecting config files
# Bad for: production (ties container to specific host path)

# 3. TMPFS MOUNTS (in-memory, ephemeral):
docker run --tmpfs /tmp:size=100m myapp
# Lost on container stop, faster than disk I/O
# Good for: temp files, sensitive data (not persisted to disk)

# ── VOLUME OPERATIONS ──
docker volume ls
docker volume inspect mydata
docker volume rm mydata
docker volume prune              # remove all unused volumes

# ── BACKUP VOLUME ──
docker run --rm \
  -v mydata:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/mydata-backup.tar.gz -C /source .

# ── RESTORE VOLUME ──
docker run --rm \
  -v mydata:/target \
  -v $(pwd):/backup:ro \
  alpine tar xzf /backup/mydata-backup.tar.gz -C /target

# ── DATABASE PERSISTENCE EXAMPLE ──
docker run -d \
  --name postgres \
  -v postgres-data:/var/lib/postgresql/data \  # ← persist DB data
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  postgres:16-alpine
# Remove container → data still in 'postgres-data' volume!
# New container with same volume = same data!
```

---

# 5. Docker Compose

## 5.1 Complete Docker Compose

```yaml
# docker-compose.yml — full production-like setup

version: '3.9'

# ── SERVICES ──
services:

  # ── APPLICATION ──
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_VERSION: ${APP_VERSION:-1.0.0}
      target: runtime          # multi-stage: use 'runtime' stage
    image: myapp:${APP_VERSION:-latest}
    container_name: myapp
    restart: unless-stopped    # restart unless manually stopped
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: production
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/${DB_NAME:-mydb}
      SPRING_DATASOURCE_USERNAME: ${DB_USER:-postgres}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: 6379
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    env_file:
      - .env.production          # load from file (don't commit!)
    depends_on:
      db:
        condition: service_healthy  # wait for DB health check
      redis:
        condition: service_healthy
      kafka:
        condition: service_started
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - backend
      - frontend
    volumes:
      - app-logs:/app/logs
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: json-file
      options:
        max-size: "100m"
        max-file: "3"

  # ── DATABASE ──
  db:
    image: postgres:16-alpine
    container_name: postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-mydb}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # init script
    ports:
      - "127.0.0.1:5432:5432"    # localhost only! Not exposed publicly
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-mydb}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - backend
    deploy:
      resources:
        limits:
          memory: 512M

  # ── REDIS ──
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --appendonly yes
    volumes:
      - redis-data:/data
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - backend

  # ── NGINX (reverse proxy + static files) ──
  nginx:
    image: nginx:1.25-alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - nginx-logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - frontend

# ── NETWORKS ──
networks:
  backend:
    driver: bridge
    internal: true      # NOT accessible from host! Only between containers
  frontend:
    driver: bridge

# ── VOLUMES ──
volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  app-logs:
    driver: local
  nginx-logs:
    driver: local
```

## 5.2 Docker Compose Commands

```bash
# ── BASIC OPERATIONS ──
docker compose up -d                    # start all services (detached)
docker compose up -d --build            # rebuild images then start
docker compose up -d app db             # start only specific services
docker compose down                     # stop and remove containers (keep volumes)
docker compose down -v                  # also remove volumes!
docker compose down --remove-orphans    # remove containers not in compose file

# ── LIFECYCLE ──
docker compose start                    # start stopped services
docker compose stop                     # stop running services (keep containers)
docker compose restart app              # restart specific service
docker compose pause / unpause

# ── MONITORING ──
docker compose ps                       # status of all services
docker compose logs -f                  # all logs, follow
docker compose logs -f --tail=100 app   # specific service, last 100 lines
docker compose top                      # running processes
docker compose stats                    # resource usage

# ── SCALE ──
docker compose up -d --scale app=3      # run 3 instances of app

# ── EXEC ──
docker compose exec app sh              # shell in running container
docker compose exec db psql -U postgres # postgres CLI
docker compose run --rm app mvn test    # run one-off command in new container

# ── BUILD ──
docker compose build                    # build all images
docker compose build --no-cache app     # force rebuild without cache
docker compose pull                     # pull latest images

# ── ENVIRONMENT ──
docker compose --env-file .env.staging up -d  # use different env file
docker compose config                         # show merged compose file (for debugging)

# ── DEVELOPMENT OVERRIDE ──
# docker-compose.yml:      base config
# docker-compose.override.yml:  auto-merged for development!

# docker-compose.override.yml:
services:
  app:
    build: .
    volumes:
      - ./src:/app/src          # hot reload
    environment:
      SPRING_PROFILES_ACTIVE: development
      SPRING_JPA_SHOW_SQL: "true"
  db:
    ports:
      - "5432:5432"             # expose to host for dev tools
```

---

# 6. Kubernetes Architecture

## 6.1 K8s Components

```
KUBERNETES = orchestration platform cho containers
  Handles: deployment, scaling, self-healing, load balancing, rolling updates

CLUSTER ARCHITECTURE:

  ┌─────────────────────────────────────────────────────────────────┐
  │                    CONTROL PLANE (Master)                       │
  │                                                                 │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
  │  │  API Server  │  │  Scheduler   │  │  Controller Manager  │ │
  │  │ (kube-apiserver)  (kube-scheduler) (kube-controller-mgr)  │ │
  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │
  │  ┌──────────────────────────────────────────────────────────┐  │
  │  │                     etcd                                 │  │
  │  │            (distributed key-value store)                 │  │
  │  └──────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────┘
           │ (API calls)        │ (API calls)
  ┌────────▼──────────┐  ┌──────▼──────────────┐
  │   Worker Node 1   │  │   Worker Node 2      │
  │                   │  │                      │
  │  ┌─────────────┐  │  │  ┌─────────────┐    │
  │  │   kubelet   │  │  │  │   kubelet   │    │
  │  └─────────────┘  │  │  └─────────────┘    │
  │  ┌─────────────┐  │  │  ┌─────────────┐    │
  │  │ kube-proxy  │  │  │  │ kube-proxy  │    │
  │  └─────────────┘  │  │  └─────────────┘    │
  │  ┌───┐ ┌───┐ ┌───┐│  │  ┌───┐ ┌───┐       │
  │  │Pod│ │Pod│ │Pod││  │  │Pod│ │Pod│       │
  │  └───┘ └───┘ └───┘│  │  └───┘ └───┘       │
  └───────────────────┘  └─────────────────────┘

CONTROL PLANE COMPONENTS:

kube-apiserver:
  REST API gateway — ALL communication goes through it
  Validates and processes API objects (Pods, Services, etc.)
  kubectl communicates with API server

etcd:
  Distributed key-value store — source of truth for cluster state
  All cluster configuration/state stored here
  Highly available (Raft consensus, typically 3 or 5 nodes)
  If etcd fails → cluster can't make changes (but running pods continue)

kube-scheduler:
  Assigns pods to nodes based on:
    - Resource requirements (CPU, memory)
    - Node selectors and affinity rules
    - Taints and tolerations
    - Topology spread constraints
  Watch for unscheduled pods → find best node → assign

kube-controller-manager:
  Runs controllers (control loops) to maintain desired state:
    - ReplicaSet controller: ensure correct number of pod replicas
    - Node controller: detect and respond to node failures
    - Endpoint controller: maintain endpoint objects
    - ServiceAccount controller: create default service accounts

WORKER NODE COMPONENTS:

kubelet:
  Agent running on every node
  Receives pod specs from API server
  Creates/starts/monitors containers via CRI (Container Runtime Interface)
  Reports node and pod status back to API server
  Runs health checks (liveness, readiness probes)

kube-proxy:
  Network proxy on every node
  Implements Service networking (virtual IPs)
  Manages iptables/IPVS rules for traffic routing
  Routes traffic to correct pod(s) for a Service

Container Runtime:
  Runs actual containers: containerd, CRI-O
  (Docker was removed in K8s 1.24 — replaced by containerd)
```

## 6.2 kubectl — CLI

```bash
# ── ESSENTIAL kubectl COMMANDS ──

# Cluster info:
kubectl cluster-info
kubectl get nodes
kubectl get nodes -o wide              # more details (IPs, OS)
kubectl describe node worker-1

# Context / namespace:
kubectl config get-contexts
kubectl config use-context prod-cluster
kubectl config set-context --current --namespace=myapp
kubectl get all -n myapp               # resources in namespace
kubectl get all --all-namespaces       # all namespaces

# ── PODS ──
kubectl get pods
kubectl get pods -n myapp -o wide      # with node and IP info
kubectl get pods -l app=myapp          # by label
kubectl get pods --watch               # watch for changes
kubectl describe pod myapp-7d8f9-abc12 # full details + events
kubectl logs myapp-7d8f9-abc12         # container logs
kubectl logs -f myapp-7d8f9-abc12      # follow logs
kubectl logs --previous myapp-7d8f9-abc12  # logs from crashed container
kubectl exec -it myapp-7d8f9-abc12 -- /bin/sh  # shell in pod
kubectl exec myapp-7d8f9-abc12 -- env  # run command
kubectl port-forward pod/myapp-7d8f9-abc12 8080:8080  # local access
kubectl delete pod myapp-7d8f9-abc12   # delete (will be recreated by ReplicaSet!)

# ── DEPLOYMENTS ──
kubectl get deployments
kubectl describe deployment myapp
kubectl rollout status deployment/myapp     # wait for rollout
kubectl rollout history deployment/myapp    # revision history
kubectl rollout undo deployment/myapp       # rollback to previous
kubectl rollout undo deployment/myapp --to-revision=3
kubectl set image deployment/myapp app=myapp:2.0.0  # update image
kubectl scale deployment myapp --replicas=5          # manual scale

# ── APPLY / CREATE ──
kubectl apply -f deployment.yaml           # create or update (idempotent)
kubectl apply -f ./k8s/                    # apply all in directory
kubectl apply -f https://example.com/manifest.yaml
kubectl delete -f deployment.yaml          # delete from manifest
kubectl diff -f deployment.yaml            # show what would change

# ── DEBUGGING ──
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl get events -n myapp --field-selector type=Warning
kubectl top nodes                          # CPU/memory usage
kubectl top pods -n myapp                 # pod resource usage
kubectl explain deployment.spec.replicas  # API documentation!
kubectl get pod myapp-xxx -o yaml         # full YAML of running pod
kubectl api-resources                     # all resource types
```

---

# 7. Kubernetes Workloads

## 7.1 Pod & Deployment

```yaml
# ── POD (lowest level, rarely created directly) ──
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  namespace: production
  labels:
    app: myapp
    version: "1.0.0"
    environment: production
spec:
  containers:
  - name: app
    image: myapp:1.0.0
    ports:
    - containerPort: 8080
    resources:
      requests:                    # minimum guaranteed resources
        memory: "256Mi"
        cpu: "250m"                # 250 millicores = 0.25 CPU
      limits:                      # maximum allowed
        memory: "512Mi"
        cpu: "500m"
    env:
    - name: SPRING_PROFILES_ACTIVE
      value: production
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:              # from Secret
          name: db-credentials
          key: password
    livenessProbe:                 # is container alive?
      httpGet:
        path: /actuator/health/liveness
        port: 8080
      initialDelaySeconds: 60      # wait 60s before first check
      periodSeconds: 10
      failureThreshold: 3          # restart after 3 failures
    readinessProbe:                # is container ready for traffic?
      httpGet:
        path: /actuator/health/readiness
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 5
      failureThreshold: 3
    # If readiness fails: pod removed from Service endpoints (no traffic)
    # If liveness fails: pod restarted
    startupProbe:                  # has container started? (for slow apps)
      httpGet:
        path: /actuator/health
        port: 8080
      failureThreshold: 30         # 30 * 10s = 5 minutes to start
      periodSeconds: 10
  restartPolicy: Always

---
# ── DEPLOYMENT (manages ReplicaSet, handles rollouts) ──
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
spec:
  replicas: 3                      # desired number of pods
  selector:
    matchLabels:
      app: myapp                   # which pods this Deployment manages
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                  # how many extra pods during update
      maxUnavailable: 0            # ZERO downtime: don't kill pods before new ones ready
      # maxSurge: 25%, maxUnavailable: 25% (defaults) — or absolute numbers
  template:                        # pod template (same as Pod spec)
    metadata:
      labels:
        app: myapp
        version: "1.0.0"
    spec:
      # Spread pods across nodes (high availability):
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: myapp
      # Don't schedule on same node as DB (resource isolation):
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: postgres
              topologyKey: kubernetes.io/hostname
      containers:
      - name: app
        image: myregistry.io/myapp:1.0.0
        imagePullPolicy: Always    # Always pull (use IfNotPresent for faster restarts)
        ports:
        - containerPort: 8080
          name: http
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        envFrom:
        - configMapRef:
            name: myapp-config     # load all keys from ConfigMap as env vars
        - secretRef:
            name: myapp-secrets    # load all keys from Secret
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name    # pod's own name as env var!
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
          readOnly: true
        - name: logs
          mountPath: /app/logs
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
          failureThreshold: 3
      volumes:
      - name: config-volume
        configMap:
          name: myapp-config
      - name: logs
        emptyDir: {}               # ephemeral, lives with pod
      imagePullSecrets:
      - name: registry-credentials  # for private registry
      serviceAccountName: myapp-sa  # pod's identity for K8s API
      terminationGracePeriodSeconds: 30  # time to graceful shutdown
```

## 7.2 Other Workload Types

```yaml
# ── StatefulSet (for stateful apps: databases, Kafka) ──
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless   # headless service for DNS
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:            # creates PVC per pod!
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 100Gi
# StatefulSet gives:
# - Stable pod names: postgres-0, postgres-1, postgres-2
# - Stable DNS: postgres-0.postgres-headless.namespace.svc.cluster.local
# - Ordered deployment/scaling (0 before 1 before 2)
# - Persistent volume per pod (not shared!)

---
# ── DaemonSet (run ONE pod per node) ──
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd:v1.16
        volumeMounts:
        - name: varlog
          mountPath: /var/log
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
# Use: log collectors, monitoring agents, network plugins
# Automatically runs on new nodes as they join cluster

---
# ── Job (run to completion) ──
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  completions: 1
  backoffLimit: 3                  # retry 3 times on failure
  activeDeadlineSeconds: 300       # timeout 5 minutes
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: migration
        image: myapp:1.0.0
        command: ["java", "-jar", "app.jar", "--spring.batch.job.enabled=true"]

---
# ── CronJob ──
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-job
spec:
  schedule: "0 2 * * *"           # 2am daily (cron syntax)
  concurrencyPolicy: Forbid        # don't run if previous still running
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: cleanup
            image: myapp:1.0.0
            command: ["java", "-jar", "app.jar", "--cleanup-mode=true"]

---
# ── HorizontalPodAutoscaler ──
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70    # scale when CPU > 70%
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"       # custom metric from Prometheus!
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # wait 5min before scale-down
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60             # max 2 pods removed per minute
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
      - type: Pods
        value: 4
        periodSeconds: 60             # max 4 pods added per minute
```

---

# 8. Kubernetes Networking & Services

## 8.1 Service Types

```yaml
# ── ClusterIP (default, internal only) ──
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
  namespace: production
spec:
  type: ClusterIP             # default, only accessible within cluster
  selector:
    app: myapp                # routes to pods with this label
  ports:
  - name: http
    protocol: TCP
    port: 80                  # Service port (what you call)
    targetPort: 8080          # Pod port (where traffic goes)
  # DNS: myapp-service.production.svc.cluster.local:80
  # Short form within namespace: myapp-service:80

---
# ── NodePort (expose on every node's IP) ──
spec:
  type: NodePort
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080           # 30000-32767 range, accessible on ANY node IP
# Access: http://<any-node-ip>:30080
# Use: development, on-prem without cloud load balancer

---
# ── LoadBalancer (cloud-native external LB) ──
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
  - port: 443
    targetPort: 8443
# Cloud provider creates external load balancer (ELB, GCE LB, etc.)
# Gets EXTERNAL IP → accessible from internet
# Use: production, public-facing services on cloud

---
# ── Headless Service (no ClusterIP, direct DNS to pods) ──
spec:
  type: ClusterIP
  clusterIP: None             # ← headless!
  selector:
    app: postgres
# DNS returns individual pod IPs (not virtual IP)
# Use: StatefulSets (Kafka, Cassandra, Postgres cluster)
# Pods addressable individually: postgres-0.postgres.namespace.svc.cluster.local

---
# ── INGRESS (HTTP routing + TLS termination) ──
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    cert-manager.io/cluster-issuer: letsencrypt-prod  # auto TLS!
spec:
  tls:
  - hosts:
    - api.example.com
    - app.example.com
    secretName: example-tls   # cert-manager creates this
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: admin.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80
# Ingress Controller (nginx-ingress, traefik, etc.) handles actual routing
# One LoadBalancer for multiple services! (cost efficient)
```

---

# 9. Kubernetes Config & Storage

## 9.1 ConfigMap & Secret

```yaml
# ── CONFIGMAP ──
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
  namespace: production
data:
  # Key-value pairs:
  APP_LOG_LEVEL: INFO
  SERVER_PORT: "8080"
  CACHE_TTL: "3600"

  # Multi-line config file:
  application.yml: |
    spring:
      application:
        name: myapp
      jpa:
        show-sql: false
        hibernate:
          ddl-auto: validate

  # Properties file:
  log4j2.properties: |
    rootLogger=INFO, STDOUT
    appender.console.type=Console

---
# ── SECRET ──
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
  namespace: production
type: Opaque
data:
  # Values must be base64 encoded:
  # echo -n "mypassword" | base64
  DB_PASSWORD: bXlwYXNzd29yZA==
  JWT_SECRET: c3VwZXJzZWNyZXRrZXkxMjM0NTY3ODk=
  API_KEY: YXBpa2V5MTIzNDU2Nzg=
stringData:               # auto base64-encodes!
  DB_URL: "jdbc:postgresql://db:5432/mydb"
  # Use stringData for clarity, K8s converts to base64 automatically

---
# ── USE IN DEPLOYMENT ──
# Method 1: As environment variables
envFrom:
- configMapRef:
    name: myapp-config
- secretRef:
    name: myapp-secrets

# Method 2: Specific keys
env:
- name: LOG_LEVEL
  valueFrom:
    configMapKeyRef:
      name: myapp-config
      key: APP_LOG_LEVEL
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: myapp-secrets
      key: DB_PASSWORD

# Method 3: As files (volumes)
volumes:
- name: config-files
  configMap:
    name: myapp-config
- name: secret-files
  secret:
    secretName: myapp-secrets
    defaultMode: 0400     # read-only for owner only!

volumeMounts:
- name: config-files
  mountPath: /app/config
  readOnly: true
- name: secret-files
  mountPath: /app/secrets
  readOnly: true
# /app/config/application.yml  ← ConfigMap key becomes filename
# /app/secrets/DB_PASSWORD      ← Secret key becomes filename, value = file content
```

## 9.2 Persistent Volumes

```yaml
# ── PersistentVolume (admin creates) ──
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-pv
spec:
  capacity:
    storage: 100Gi
  accessModes:
  - ReadWriteOnce             # one node at a time (most common)
  # ReadWriteMany: multiple nodes simultaneously (NFS, EFS)
  # ReadOnlyMany:  multiple nodes, read-only
  persistentVolumeReclaimPolicy: Retain  # don't delete data when PVC deleted
  storageClassName: fast-ssd
  csi:
    driver: ebs.csi.aws.com
    volumeHandle: vol-0123456789abcdef  # AWS EBS volume ID

---
# ── PersistentVolumeClaim (developer requests) ──
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: production
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: fast-ssd  # must match PV's storageClassName
  resources:
    requests:
      storage: 50Gi            # request 50GB from 100GB PV

---
# ── StorageClass (dynamic provisioning) ──
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com  # AWS EBS CSI driver
parameters:
  type: gp3                    # EBS volume type
  encrypted: "true"
  iops: "3000"
  throughput: "125"
reclaimPolicy: Delete          # delete EBS when PVC deleted
allowVolumeExpansion: true     # can resize
volumeBindingMode: WaitForFirstConsumer  # don't provision until pod scheduled
# Dynamic provisioning: PVC created → StorageClass creates PV automatically!
# No need to pre-create PVs!
```

---

# 10. Deploy Workflow — CI/CD Pipeline

## 10.1 Complete CI/CD Pipeline

```yaml
# ── GITHUB ACTIONS PIPELINE ──
# .github/workflows/deploy.yml

name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}    # org/repo format

jobs:
  # ── STEP 1: Test ──
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4

    - name: Set up Java
      uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'
        cache: maven

    - name: Run tests
      run: ./mvnw test -B
      env:
        SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/testdb
        SPRING_DATASOURCE_USERNAME: test
        SPRING_DATASOURCE_PASSWORD: test

    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results
        path: target/surefire-reports/

  # ── STEP 2: Security Scan ──
  security-scan:
    runs-on: ubuntu-latest
    needs: test
    steps:
    - uses: actions/checkout@v4

    - name: OWASP Dependency-Check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'myapp'
        path: '.'
        format: 'HTML'
        failBuildOnCVSS: '7'      # fail if CVSS score >= 7

    - name: Snyk security scan
      uses: snyk/actions/maven@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # ── STEP 3: Build & Push Image ──
  build-push:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'    # only on main branch
    outputs:
      image-digest: ${{ steps.push.outputs.digest }}
      image-tag: ${{ steps.meta.outputs.tags }}

    steps:
    - uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
      with:
        platforms: linux/amd64,linux/arm64  # multi-platform build

    - name: Log in to registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata for Docker
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=sha,prefix=sha-,format=short
          type=ref,event=branch
          type=semver,pattern={{version}}
          type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

    - name: Build and push
      id: push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha          # GitHub Actions cache
        cache-to: type=gha,mode=max
        platforms: linux/amd64,linux/arm64
        build-args: |
          APP_VERSION=${{ github.sha }}

    - name: Scan image with Trivy
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
        format: 'sarif'
        exit-code: '1'
        severity: 'CRITICAL'

  # ── STEP 4: Deploy to Staging ──
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build-push
    environment: staging

    steps:
    - uses: actions/checkout@v4

    - name: Install kubectl
      uses: azure/setup-kubectl@v3

    - name: Configure kubeconfig
      run: |
        echo "${{ secrets.KUBE_CONFIG_STAGING }}" | base64 -d > kubeconfig
        echo "KUBECONFIG=$PWD/kubeconfig" >> $GITHUB_ENV

    - name: Update image in manifests
      run: |
        # Update image tag using kustomize or sed:
        cd k8s/overlays/staging
        kustomize edit set image \
          myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}

    - name: Deploy to staging
      run: |
        kubectl apply -k k8s/overlays/staging/
        kubectl rollout status deployment/myapp -n staging --timeout=5m

    - name: Run smoke tests
      run: |
        STAGING_URL="https://staging.example.com"
        curl -f "$STAGING_URL/actuator/health" || exit 1
        curl -f "$STAGING_URL/api/v1/ping" || exit 1
        echo "Smoke tests passed!"

  # ── STEP 5: Deploy to Production (manual approval) ──
  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production          # requires manual approval in GitHub!

    steps:
    - uses: actions/checkout@v4

    - name: Configure kubeconfig
      run: |
        echo "${{ secrets.KUBE_CONFIG_PROD }}" | base64 -d > kubeconfig
        echo "KUBECONFIG=$PWD/kubeconfig" >> $GITHUB_ENV

    - name: Deploy to production
      run: |
        cd k8s/overlays/production
        kustomize edit set image \
          myapp=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
        kubectl apply -k .
        kubectl rollout status deployment/myapp -n production --timeout=10m

    - name: Notify on success
      uses: slackapi/slack-github-action@v1.26.0
      with:
        payload: |
          {"text": "✅ Deployed ${{ env.IMAGE_NAME }}:${{ github.sha }} to production!"}
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

    - name: Rollback on failure
      if: failure()
      run: |
        kubectl rollout undo deployment/myapp -n production
        echo "Rolled back deployment due to failure!"
```

## 10.2 Kustomize — K8s Config Management

```yaml
# ── DIRECTORY STRUCTURE ──
# k8s/
# ├── base/                    # shared config
# │   ├── kustomization.yaml
# │   ├── deployment.yaml
# │   ├── service.yaml
# │   └── configmap.yaml
# └── overlays/
#     ├── staging/
#     │   ├── kustomization.yaml
#     │   └── patches/
#     └── production/
#         ├── kustomization.yaml
#         └── patches/

# k8s/base/kustomization.yaml:
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
- configmap.yaml
- ingress.yaml
commonLabels:
  app: myapp
  managed-by: kustomize

---
# k8s/overlays/staging/kustomization.yaml:
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base
namespace: staging
namePrefix: staging-
images:
- name: myapp
  newTag: sha-abc123def    # updated by CI/CD!
replicas:
- name: myapp
  count: 1                 # only 1 replica in staging
patches:
- path: patches/env-patch.yaml
- path: patches/resources-patch.yaml

---
# k8s/overlays/staging/patches/env-patch.yaml:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: staging
        - name: LOG_LEVEL
          value: DEBUG

---
# k8s/overlays/production/kustomization.yaml:
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base
namespace: production
images:
- name: myapp
  newTag: sha-abc123def
replicas:
- name: myapp
  count: 5                 # 5 replicas in production!
patches:
- path: patches/hpa.yaml
- path: patches/resources.yaml
- path: patches/pdb.yaml   # PodDisruptionBudget
```

---

# 11. Kubernetes Production Patterns

## 11.1 Zero-Downtime Deployments

```yaml
# ── ROLLING UPDATE (default) ──
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1           # 1 extra pod during update
    maxUnavailable: 0     # NO pods unavailable (zero downtime!)
# Flow: new pod starts → passes readiness → old pod removed

# ── BLUE-GREEN DEPLOYMENT ──
# Two identical deployments: blue (current) and green (new)
# Switch traffic by updating Service selector

# Blue deployment: app=myapp, version=blue
# Green deployment: app=myapp, version=green

# Service points to blue:
spec:
  selector:
    app: myapp
    version: blue         # ← change to "green" to switch!

# To switch:
kubectl patch service myapp-service -p '{"spec":{"selector":{"version":"green"}}}'
# Instant switch! If issues: switch back to blue immediately

# ── CANARY DEPLOYMENT ──
# Send small % of traffic to new version, gradually increase

# 90% to stable:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-stable
spec:
  replicas: 9             # 90% of traffic (same service, weighted by replicas)
  template:
    metadata:
      labels:
        app: myapp
        version: stable

---
# 10% to canary:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-canary
spec:
  replicas: 1             # 10% of traffic
  template:
    metadata:
      labels:
        app: myapp
        version: canary

---
# Service selects BOTH:
spec:
  selector:
    app: myapp            # matches both stable and canary!
    # Traffic split proportional to replica count: 9:1 = 90%/10%

# Advanced: use Istio/Argo Rollouts for precise traffic splitting
```

## 11.2 Resource Management & Reliability

```yaml
# ── NAMESPACE RESOURCE QUOTAS ──
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "20"           # total CPU requests in namespace
    requests.memory: 40Gi        # total memory requests
    limits.cpu: "40"
    limits.memory: 80Gi
    count/pods: "50"             # max 50 pods
    count/services: "20"
    count/persistentvolumeclaims: "10"

---
# ── LIMIT RANGE (defaults for containers) ──
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
  - type: Container
    default:                     # default limit if not specified
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:              # default request if not specified
      cpu: "100m"
      memory: "128Mi"
    max:                         # max allowed
      cpu: "4"
      memory: "8Gi"
    min:                         # min required
      cpu: "50m"
      memory: "64Mi"

---
# ── POD DISRUPTION BUDGET ──
# Ensures minimum available pods during maintenance/updates
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp-pdb
spec:
  minAvailable: 2              # at least 2 pods always available
  # OR: maxUnavailable: 1     # at most 1 pod can be unavailable
  selector:
    matchLabels:
      app: myapp
# kubectl drain node: respects PDB — won't evict if would violate
# Rollouts: respects PDB during rolling updates

---
# ── NETWORK POLICY (restrict traffic) ──
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myapp-netpol
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: nginx           # only from nginx pods
    - namespaceSelector:
        matchLabels:
          name: monitoring     # or from monitoring namespace
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres        # only to postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  # Deny all other ingress/egress!
```

---

# 12. Monitoring & Troubleshooting

## 12.1 Observability Stack

```yaml
# ── PROMETHEUS + GRAFANA (standard monitoring stack) ──

# Spring Boot: expose metrics to Prometheus
# build.gradle / pom.xml: spring-boot-starter-actuator + micrometer-registry-prometheus

# application.yml:
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    tags:
      application: ${spring.application.name}
      environment: ${ENVIRONMENT:production}
      version: ${APP_VERSION:unknown}

# Kubernetes ServiceMonitor (for Prometheus Operator):
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp-monitor
  namespace: production
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: http
    path: /actuator/prometheus
    interval: 15s
    scrapeTimeout: 10s
```

## 12.2 Troubleshooting Commands

```bash
# ── POD NOT STARTING ──
kubectl describe pod <pod-name> -n <namespace>
# Look at: Events section (bottom of output)
# Common issues:
#   ImagePullBackOff: wrong image name or registry auth
#   CrashLoopBackOff: container crashes repeatedly
#   Pending: not enough resources on nodes
#   OOMKilled: exceeded memory limit

# ── IMAGEpullbackoff ──
kubectl get events --field-selector involvedObject.name=<pod>
# Check registry credentials:
kubectl get secret registry-credentials -o yaml
# Re-create pull secret:
kubectl create secret docker-registry registry-credentials \
  --docker-server=ghcr.io \
  --docker-username=<user> \
  --docker-password=<token>

# ── CRASHLOOPBACKOFF ──
kubectl logs <pod> --previous            # logs from crashed container
kubectl logs <pod> -c <container-name>   # specific container
# Common causes: wrong env vars, DB unreachable, OOM

# ── PENDING POD (not scheduled) ──
kubectl describe pod <pod>
# Look for: "Insufficient cpu/memory", "no nodes match taints"
kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.allocatable.cpu,MEM:.status.allocatable.memory
kubectl describe node <node-name>    # check node conditions, taints

# ── SERVICE NOT ROUTING ──
kubectl get endpoints <service-name>    # should show pod IPs
# If no endpoints: service selector doesn't match pod labels
kubectl get pods --show-labels          # check pod labels
kubectl describe service <service>      # check selector

# Test service from inside cluster:
kubectl run test-pod --rm -it --image=busybox -- sh
# Inside: wget -qO- http://myapp-service.production.svc.cluster.local:80

# ── DEPLOYMENT ROLLOUT ISSUES ──
kubectl rollout status deployment/myapp
kubectl describe deployment myapp       # check events and conditions
kubectl get replicasets                 # see old and new RS
kubectl rollout undo deployment/myapp   # rollback!

# ── RESOURCE DEBUGGING ──
kubectl top nodes                       # node CPU/memory usage
kubectl top pods -n production          # pod CPU/memory usage
kubectl top pods -n production --sort-by=memory

# ── NETWORK DEBUGGING ──
# Test DNS resolution:
kubectl run dnsutils --rm -it --image=gcr.io/kubernetes-e2e-test-images/dnsutils -- nslookup myapp-service

# Test connectivity:
kubectl exec <pod> -- curl http://myapp-service:80/health
kubectl exec <pod> -- wget -qO- http://postgres:5432

# ── PORT FORWARD (local debugging) ──
kubectl port-forward deployment/myapp 8080:8080 -n production
kubectl port-forward svc/postgres 5432:5432 -n production
# Then access localhost:8080 → routes to pod!

# ── RESOURCE AUDITING ──
kubectl get all -n production
kubectl get events -n production --sort-by=.metadata.creationTimestamp
kubectl get events -n production --field-selector type=Warning

# ── NODE DRAINING (maintenance) ──
kubectl cordon <node>                    # mark unschedulable (no new pods)
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data  # evict pods
# Do maintenance...
kubectl uncordon <node>                  # mark schedulable again
```

---

## 📎 Docker & K8s Quick Reference

```
DOCKER:
  Image:       immutable template (layers, union filesystem)
  Container:   running instance of image (ephemeral!)
  Volume:      persistent storage for containers
  Network:     container communication (bridge, host, none)

DOCKERFILE:
  FROM:        base image
  COPY:        copy files (add context to image)
  RUN:         execute command (creates layer)
  ENV:         environment variable (persists in image)
  ARG:         build-time variable (not in final image)
  EXPOSE:      document port (doesn't publish!)
  ENTRYPOINT:  main command
  CMD:         default args (overridable)
  USER:        switch to non-root!
  HEALTHCHECK: container health monitoring

MULTI-STAGE: separate build and runtime → smaller, safer images
LAYER CACHE: put frequently changing things LAST
.dockerignore: exclude unnecessary files from build context

KUBERNETES:
  Pod:         smallest unit, 1+ containers
  Deployment:  manages ReplicaSet, handles rolling updates
  Service:     stable networking (ClusterIP, NodePort, LoadBalancer)
  Ingress:     HTTP routing, TLS termination
  ConfigMap:   non-sensitive configuration
  Secret:      sensitive data (base64 encoded, NOT encrypted by default!)
  PVC:         persistent storage request
  HPA:         auto-scaling based on metrics
  PDB:         minimum available pods during disruptions

PROBES:
  liveness:    is container alive? (restart if fail)
  readiness:   is container ready for traffic? (remove from LB if fail)
  startup:     has container started? (for slow-starting apps)

DEPLOY WORKFLOW:
  1. git push → CI triggered
  2. Unit tests + integration tests
  3. Security scan (Trivy, Snyk)
  4. docker build + docker push (with SHA tag!)
  5. Update image tag in K8s manifests (kustomize)
  6. kubectl apply → rolling update
  7. Monitor: rollout status + health checks
  8. Smoke tests
  9. Production deploy (manual approval)

ZERO-DOWNTIME: readinessProbe + maxUnavailable=0 + terminationGracePeriodSeconds
```

## 📎 Official Documentation Links

| Topic | Link |
|-------|------|
| Docker Documentation | <https://docs.docker.com/> |
| Dockerfile Reference | <https://docs.docker.com/reference/dockerfile/> |
| Docker Compose | <https://docs.docker.com/compose/> |
| Docker Best Practices | <https://docs.docker.com/build/building/best-practices/> |
| Kubernetes Docs | <https://kubernetes.io/docs/> |
| K8s API Reference | <https://kubernetes.io/docs/reference/kubernetes-api/> |
| kubectl Cheatsheet | <https://kubernetes.io/docs/reference/kubectl/cheatsheet/> |
| Kustomize | <https://kustomize.io/> |
| Helm (K8s package manager) | <https://helm.sh/docs/> |
| Kubernetes Patterns | <https://k8spatterns.io/> |
| GitHub Actions | <https://docs.github.com/en/actions> |
| Trivy (image scanner) | <https://trivy.dev/> |
| Prometheus + Grafana | <https://prometheus.io/docs/> |
| OWASP Container Security | <https://owasp.org/www-project-docker-security/> |
