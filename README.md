# ☀️ TopRoof Solar – Smart Solar Verification System

### AI-powered remote verification of rooftop solar installations for PM Surya Ghar: Muft Bijli Yojana

TopRoof Solar ensures transparent, audit-ready, and remote verification of rooftop solar systems using satellite and aerial imagery powered by deep learning. Our system helps government agencies and DISCOM officials verify whether solar panels are genuinely installed at the submitted location — eliminating fraud, delays, and manual inspection costs.

---

## 🚀 Live Project
🔗 **User Website**: https://roofscanai.netlify.app  
🔗 **Backend/Docker Demo**: https://solar-roof-verify-latest.onrender.com  
🐳 **Docker Hub**: https://hub.docker.com/r/bathalabalaji/solar-roof-verify  
📦 **Tag:** `latest`  
📁 **GitHub Repo**: https://github.com/balajibathala003344/solar-roof-verify

---

## 🎯 Key Features
- 🛰 **Fetch & process satellite / rooftop images** using coordinate & buffer search (±20m)
- 🤖 **YOLOv8 based PV panel detection** with confidence score
- 📏 **Solar Panel Quantification** – panel count, area (m²), estimated capacity (kW)
- 🔍 **QC Explainability** – reason codes, bounding boxes, segmentation mask
- 📤 **CSV batch processing for mass verification**
- 📑 **JSON Export for DISCOM auditing**
- 🛂 **Dual dashboards** – Public Users & Government Officers
- ⏳ **Real-time status tracking** (Approved / Rejected / Needs Review / AI Pending)

---

## 🧠 AI & Model Card
| Category | Details |
|---------|---------|
| Model | YOLOv8 Custom Trained |
| Dataset | Mixed Rooftop Solar dataset (India + Global) with manual annotation |
| Performance | ~92% accuracy on validation |
| Inputs | Satellite / rooftop top-view images |
| Output | Bounding boxes, mask polygons, confidence, classification |
| Capacity Estimate | `wp_per_m2 = 180–220`, assumption used = **190 W/m²** |
| Explainability | Bounding boxes + reason codes (grid pattern, solar cell reflections, racking shadows) |
| QC Status | VERIFIABLE / NOT-VERIFIABLE |

> **Bias Note:** Model precision may vary for rural low-res images, metal-sheet rooftops, and heavy shade. We mitigate this using additional image enhancement & buffering.

---

## 🛠 Tech Stack
### Frontend
- React + Vite
- Tailwind CSS
- ShadCN UI

### Backend
- Node.js + Express
- Firebase Authentication & Firestore
- Docker + Render Hosting

### AI & ML
- Python
- YOLOv8 (Ultralytics)
- OpenCV

### Tools
- Netlify, Render, Docker CLI, GeoTools

---

## 📸 Screenshots

### 🏠 Landing Page
![Home](/screenshots/s1.png)

### 👤 User Dashboard
![Dashboard](/screenshots/u1.png)

### 📝 Application Form
![Submit](/screenshots/ua.png)

### 🛂 Officer Dashboard
![Officer](/screenshots/o1.png)

### 🔍 AI Detection & QC Results
![results](/screenshots/or.png)

(Images stored under `/screenshots` in repo)

---

## 🧪 How to Run Locally
```bash
git clone https://github.com/balajibathala003344/solar-roof-verify.git
cd solar-roof-verify
npm install
npm run dev
