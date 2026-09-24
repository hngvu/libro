# 🏛️ Libro Infrastructure & Observability Guide

Thư mục này chứa toàn bộ cấu hình hạ tầng, lưu trữ, giám sát đo kiểm và kiểm thử hiệu năng cho hệ thống **Libro**.

---

## 📁 Cấu trúc thư mục

```text
infra/
├── compose.yaml          # Docker Compose: PostgreSQL, MinIO, Prometheus, Grafana
├── monitoring/           # Cấu hình Observability & Metrics
│   ├── prometheus.yml    # Prometheus Scraper cấu hình endpoint Spring Boot Actuator
│   └── grafana/          # Grafana Provisioning (Datasource Prometheus tự động)
│       └── provisioning/
│           └── datasources/
│               └── datasource.yml
├── performance-tests/    # Kịch bản kiểm thử tải K6 (Smoke, Load, Stress, Spike)
│   ├── k6/
│   ├── run-k6.ps1
│   └── run-k6.bat
└── PERFORMANCE_REPORT.md # Báo cáo kết quả đo kiểm hiệu năng hệ thống
```

---

## 🚀 Hướng dẫn sử dụng

### 1. Khởi động Hạ tầng cơ bản (PostgreSQL + MinIO Storage)
Từ thư mục gốc của dự án:
```powershell
cd infra
docker compose up -d
```
* **PostgreSQL:** `localhost:5432` (User: `postgres`, Password: `password`, DB: `libro`)
* **MinIO API (S3):** `http://localhost:9000` (User: `minioadmin`, Pass: `minioadmin`)
* **MinIO Console UI:** `http://localhost:9001` (Bucket `libro-storage` được tạo tự động)

---

### 2. Khởi động Full Observability (Thêm Prometheus + Grafana)
```powershell
cd infra
docker compose --profile monitoring up -d
```
* **Prometheus Dashboard:** `http://localhost:9090` (Metrics scrap từ `/api/actuator/prometheus`)
* **Grafana Dashboard:** `http://localhost:3000` (Tài khoản: `admin` / `admin`, Datasource Prometheus đã được cấu hình sẵn)

---

### 3. Chạy Kiểm thử tải (K6 Performance Testing)
```powershell
cd infra/performance-tests
.\run-k6.ps1 -Scenario smoke       # Kiểm thử nhẹ nhàng (Smoke test)
.\run-k6.ps1 -Scenario load        # Kiểm thử tải tiêu chuẩn (50-100 VUs)
.\run-k6.ps1 -Scenario stress      # Kiểm thử áp lực cao (Stress test)
.\run-k6.ps1 -Scenario spike       # Kiểm thử tải đột biến (Spike test)
```

---

### 4. Dừng hạ tầng
```powershell
cd infra
docker compose --profile monitoring down
```
*(Nếu muốn xóa sạch toàn bộ data volume: `docker compose --profile monitoring down -v`)*
