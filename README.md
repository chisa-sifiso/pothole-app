# Smart City AI-Enhanced Pothole Detection and Municipal RFQ Management System

A full-stack smart city platform for AI-powered pothole detection, municipal road management, and contractor procurement.

## Architecture

```
ISJ/
├── backend/        Spring Boot 3.2 (Java 21) — REST API + JWT
├── ai-service/     Python FastAPI — MobileNetV2 AI detection
├── frontend/       React 18 + Vite — Tailwind CSS UI
└── database/       PostgreSQL schema + seed data
```

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| JDK | 21+ | Required for Spring Boot 3.x. Download from [adoptium.net](https://adoptium.net) |
| Maven | 3.9+ | Or use the included `mvnw` wrapper |
| PostgreSQL | 15+ | Must be running locally |
| Python | 3.10+ | For AI service |
| Node.js | 20+ | For frontend |
| Google Maps API Key | — | Enable Maps JavaScript API at [console.cloud.google.com](https://console.cloud.google.com) |

---

## Quick Start

### 1. Database Setup

```sql
-- Connect to PostgreSQL as superuser (psql -U postgres)
CREATE DATABASE pothole_db;
CREATE USER pothole_user WITH ENCRYPTED PASSWORD 'pothole_pass';
GRANT ALL PRIVILEGES ON DATABASE pothole_db TO pothole_user;
```

Run the schema (optional — Spring Boot auto-creates tables on first run):
```bash
psql -U pothole_user -d pothole_db -f database/schema.sql
psql -U pothole_user -d pothole_db -f database/seed.sql
```

### 2. Start the AI Service

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install fastapi uvicorn python-multipart Pillow numpy python-dotenv
# For TensorFlow (CPU-only, faster install):
pip install tensorflow-cpu

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verify: http://localhost:8000/health

> **Note:** Without trained model weights the service runs in **mock mode** using image heuristics. To train a real model see `ai-service/train_model.py`.

### 3. Start the Backend

> **Important:** Ensure `JAVA_HOME` points to JDK 21.

```bash
cd backend
./mvnw spring-boot:run
```

Or build and run the JAR:
```bash
./mvnw clean package -DskipTests
java -jar target/pothole-0.0.1-SNAPSHOT.jar
```

Verify: http://localhost:8080/api/health

> **First run:** `spring.jpa.hibernate.ddl-auto=create` in `application.properties` will auto-create all tables. After the first successful start, change it to `validate`.

### 4. Start the Frontend

```bash
cd frontend
# Create your .env file with your Google Maps API key:
echo VITE_GOOGLE_MAPS_KEY=your_actual_key_here > .env

npm install
npm run dev
```

Open: **http://localhost:5173**

---

## Test Accounts (from seed.sql)

All accounts use password: **`password123`**

| Role | Email |
|------|-------|
| Citizen | citizen1@test.com |
| Citizen | citizen2@test.com |
| Municipal Official | official@city.gov.za |
| Contractor | contractor1@roads.co.za |
| Contractor | contractor2@repairs.co.za |

---

## User Flows

### Citizen Flow
1. Register → Login → **Report Pothole** (upload image + GPS auto-detected)
2. AI analyses the image → severity classified (LOW/MEDIUM/HIGH/CRITICAL)
3. Track status on **My Reports** page

### Municipal Official Flow
1. Login → **Reports Map** (view all potholes on Google Map, filtered by severity)
2. Click a marker → **Generate RFQ** (auto-sets 7-day deadline)
3. **RFQ Management** → view all RFQs, click **Evaluate Bids**
4. AI weighted scoring (Cost 40% + Rating 35% + Speed 25%) → **Award Contract**
5. **Dashboard** → charts showing reports by severity, status trends

### Contractor Flow
1. Login → **Contractor Dashboard** → update company profile
2. **Available RFQs** → browse open RFQs → **Submit Bid** (price, days, method)
3. **My Tasks** → once awarded: Start Repair → Complete Repair (upload after photo)

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, get JWT |
| POST | `/api/potholes/report` | CITIZEN | Report pothole (multipart) |
| GET | `/api/potholes` | Auth | List all reports |
| GET | `/api/potholes/my` | CITIZEN | My reports |
| PATCH | `/api/potholes/{id}/verify` | OFFICIAL | Manual verify |
| POST | `/api/rfqs/generate/{potholeId}` | OFFICIAL | Generate RFQ |
| GET | `/api/rfqs` | Auth | List RFQs |
| POST | `/api/rfqs/{id}/bid` | CONTRACTOR | Submit bid |
| GET | `/api/rfqs/{id}/bids` | OFFICIAL | View bids |
| POST | `/api/rfqs/{id}/award/{bidId}` | OFFICIAL | Award contract |
| PATCH | `/api/repairs/{id}/start` | CONTRACTOR | Start repair |
| POST | `/api/repairs/{id}/complete` | CONTRACTOR | Complete repair |
| GET | `/api/dashboard/stats` | OFFICIAL | Analytics data |

---

## AI Service API

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health + model mode (model/mock) |
| `POST /analyze` | Analyse pothole image → severity + confidence |

**Response:**
```json
{
  "is_pothole": true,
  "confidence": 0.87,
  "severity": "HIGH",
  "estimated_diameter_cm": 42.5,
  "estimated_depth_cm": 9.2
}
```

---

## Training the AI Model

Once you have labelled pothole images:

```bash
cd ai-service
python train_model.py --data_dir /path/to/dataset --epochs 20
```

Dataset structure:
```
dataset/
  train/
    pothole/      (images with potholes)
    no_pothole/   (normal road surface)
  val/
    pothole/
    no_pothole/
```

After training, weights are saved to `model/weights/pothole_mobilenetv2.h5` and the service automatically uses them on next startup.

Recommended datasets:
- [Kaggle: Pothole Image Dataset](https://www.kaggle.com/datasets/chitholian/annotated-potholes-dataset)
- [Kaggle: Road Damage Dataset](https://www.kaggle.com/datasets/imsparsh/road-damage-detection)

---

## Weighted Contractor Scoring Formula

When a municipal official awards a contract, all bids for that RFQ are scored:

```
normalizedCostScore = (maxPrice − bidPrice) / maxPrice        × 0.40
ratingScore         = contractorRating / 5.0                   × 0.35
speedScore          = (maxDays − bidDays) / maxDays            × 0.25

totalScore = normalizedCostScore + ratingScore + speedScore
```

- All scores normalized to 0–1 range
- Higher score = better bid
- The official may award any bid; scoring is advisory

---

## Project Structure

```
backend/src/main/java/com/municipality/pothole/
├── PotholeApplication.java
├── client/          AIServiceClient, AIAnalysisResult
├── config/          SecurityConfig, CorsConfig, FileStorageConfig, AppConfig
├── controller/      Auth, Pothole, RFQ, Repair, Contractor, Dashboard, GlobalExceptionHandler
├── dto/
│   ├── request/     RegisterRequest, LoginRequest, BidRequest, RFQGenerateRequest, ContractorProfileRequest
│   └── response/    AuthResponse, PotholeReportResponse, RFQResponse, BidResponse, RepairTaskResponse, DashboardStatsResponse
├── model/           User, ContractorProfile, PotholeReport, RFQ, Bid, RepairTask + enums
├── repository/      All JPA repositories
├── security/        JwtUtil, JwtAuthenticationFilter, CustomUserDetailsService
└── service/         Auth, Pothole, RFQ, Bid, RepairTask, Dashboard, Contractor, FileStorage
```
