# DevOps Learning Guide

เอกสารนี้ออกแบบให้ใช้คู่กับโปรเจกต์นี้แบบลงมือทำจริง เริ่มจากรันในเครื่อง แล้วค่อยเพิ่มความเหมือน production ทีละชั้น

## 1. พื้นฐานที่ต้องแน่น

### Linux และ Shell

- ใช้คำสั่งพื้นฐาน: `cd`, `ls`, `cat`, `grep`, `curl`, `ps`, `netstat` หรือ `ss`
- อ่าน log ด้วย `tail -f`
- เข้าใจ process, port, environment variables, file permissions

แบบฝึก:

```powershell
docker compose logs -f backend
docker compose exec backend sh
docker compose exec mysql mysql -uapp_user -p devops_practice
```

### Git

- branch, commit, merge, rebase แบบพื้นฐาน
- อ่าน diff และแก้ conflict
- เขียน commit message ให้คนอื่นเข้าใจ

แบบฝึก:

```powershell
git status
git diff
git log --oneline --graph --decorate -10
```

## 2. Docker และ Container

สิ่งที่ควรรู้:

- image vs container
- layer cache
- multi-stage build
- bind mount vs named volume
- container network
- healthcheck

แบบฝึกกับโปรเจกต์นี้:

```powershell
docker compose up --build
docker compose ps
docker compose logs -f proxy backend mysql
docker compose exec backend wget -qO- http://localhost:3000/api/health
docker compose down
```

คำถามที่ควรตอบให้ได้:

- ทำไม backend ใช้ `MYSQL_HOST=mysql` ไม่ใช่ `localhost`
- ทำไม MySQL ต้องใช้ named volume
- healthcheck ของ backend ช่วย proxy/startup อย่างไร
- ถ้าลบ volume แล้ว seed data กลับมาไหม

## 3. Networking และ Reverse Proxy

ในโปรเจกต์นี้ Nginx ทำหน้าที่รับ request จาก browser:

- `/` ส่งไป frontend
- `/api/*` ส่งไป backend

แบบฝึก:

```powershell
docker compose exec proxy nginx -T
curl http://localhost/api/health
curl http://localhost/api/deployments
```

ลองแก้ `infra/nginx/proxy.conf` แล้ว reload:

```powershell
docker compose exec proxy nginx -s reload
```

## 4. Database Operations

MySQL init scripts อยู่ที่ `infra/mysql/init`

- `001_schema.sql`: สร้าง table
- `002_seed.sql`: seed sample data

แบบฝึก:

```powershell
docker compose exec mysql mysql -uapp_user -p devops_practice
SHOW TABLES;
SELECT * FROM deployments;
```

เรื่องที่ควรฝึกต่อ:

- migration versioning ด้วย Flyway หรือ Prisma
- backup/restore
- read replica concept
- connection pool tuning

## 5. Observability

Backend ใช้ structured logging ผ่าน Pino และมี health endpoint

แบบฝึก:

```powershell
docker compose logs -f backend
Invoke-RestMethod http://localhost/api/health
Invoke-RestMethod http://localhost/api/deployments
```

สิ่งที่ควรเพิ่มต่อ:

- request id หรือ correlation id
- alert เมื่อ `/api/health` ล้มเหลว

เปิด monitoring profile:

```powershell
docker compose --profile observability up -d
```

เปิด:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

Grafana login เริ่มต้นคือ `admin` / `admin` สำหรับ lab local เท่านั้น

## 6. CI/CD Path

Pipeline พื้นฐานในโปรเจกต์นี้ใช้ Jenkins ผ่านไฟล์ `Jenkinsfile`

Jenkins pipeline ควรมี:

1. Checkout
2. Install dependencies
3. Lint
4. Typecheck
5. Build frontend/backend
6. Build Docker images
7. Run smoke test
8. Push image
9. Deploy

ตัวอย่าง pipeline อยู่ที่ `Jenkinsfile`

เปิด Jenkins local lab:

```powershell
docker compose --profile ci up -d jenkins
```

Jenkins local lab ใช้ custom image จาก `infra/jenkins/Dockerfile` เพื่อเพิ่ม Docker CLI และ Docker Compose plugin เข้าไปใน Jenkins controller container

Smoke test ของ Jenkins ใช้ `docker-compose.ci.yml` เพิ่มจาก compose หลัก เพราะ Jenkins รันอยู่ใน container แต่ Docker daemon อยู่ด้านนอก การ bind mount ไฟล์จาก workspace เช่น Nginx config อาจชน path ฝั่ง host ได้ CI override จึงไม่ start proxy ระหว่าง smoke test และใช้ healthcheck ของ MySQL ที่เช็คว่า schema พร้อมจริงก่อนเริ่ม backend

สิ่งที่ Jenkins agent ต้องมี:

- Node.js 22 และ npm
- Docker CLI และ Docker Compose plugin
- สิทธิ์เข้าถึง Docker daemon
- PowerShell ถ้าจะรัน smoke test script เดิม

แนวคิดสำคัญของ Jenkins:

- Controller: ตัว Jenkins หลักที่เก็บ job และ UI
- Agent: เครื่องหรือ container ที่ใช้รัน pipeline
- Jenkinsfile: pipeline as code ที่เก็บไปกับ repo
- Credentials: ที่เก็บ secret เช่น registry token, SSH key, cloud key
- Workspace: folder ชั่วคราวที่ Jenkins checkout code มารัน

## 7. Scaling Ideas

ลองเพิ่มความซับซ้อนแบบค่อยเป็นค่อยไป:

- เพิ่ม backend replicas แล้วดูว่า proxy balance อย่างไร
- เพิ่ม Redis cache
- แยก migration job ออกจาก backend
- เพิ่ม `prometheus` และ `grafana` services
- ใช้ Docker secrets แทน plain env
- deploy ไป VPS ด้วย SSH และ Compose
- deploy ไป Kubernetes ด้วย Helm

ตัวอย่าง scale backend:

```powershell
docker compose up --build --scale backend=3
```

หมายเหตุ: ถ้า scale backend ผ่าน Compose และมี fixed `container_name` จะ scale ไม่ได้ โปรเจกต์นี้จึงไม่กำหนด `container_name`

## 8. Roadmap สำหรับฝึกเป็น DevOps

### เดือนที่ 1: Foundation

- Linux, Git, HTTP, DNS, TCP/IP
- Dockerfile และ Docker Compose
- อ่าน logs และ debug port/network

### เดือนที่ 2: CI/CD

- Jenkins pipeline
- build/test/lint pipeline
- artifact และ Docker image registry
- secrets management

### เดือนที่ 3: Cloud และ Infrastructure

- AWS/GCP/Azure พื้นฐาน
- VM, security group, load balancer
- Terraform เบื้องต้น
- deploy app นี้ขึ้น VPS หรือ cloud VM

### เดือนที่ 4: Kubernetes

- Pod, Deployment, Service, Ingress, ConfigMap, Secret
- Helm
- readiness/liveness probe
- rolling update และ rollback

### เดือนที่ 5: Observability และ Reliability

- Prometheus, Grafana, Loki หรือ ELK
- SLO/SLI เบื้องต้น
- incident response
- backup/restore drill

## 9. Mini Challenges

1. ทำให้ backend endpoint `/api/health` แสดง migration version
2. เพิ่ม Jenkins stage ให้ push Docker image ไป registry
3. เพิ่ม staging compose file แยกจาก dev
4. เพิ่ม Prometheus + Grafana
5. เขียน rollback script
6. ย้าย plain DB password ไป Docker secrets
7. ทำ zero-downtime deploy บน VPS

## 10. Debug Checklist

เมื่อระบบล่ม ให้ไล่แบบนี้:

1. `docker compose ps`
2. `docker compose logs -f <service>`
3. เช็ค health endpoint
4. เช็ค env vars ใน container
5. เช็ค network ว่า service name resolve ได้ไหม
6. เช็ค DB credentials และ volume
7. เช็ค proxy routing
8. rollback config ล่าสุดถ้าจำเป็น
