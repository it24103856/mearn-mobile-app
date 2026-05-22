# ✈️ AI-Powered Travel Agency Mobile Application

Welcome to the **Travel Agency Mobile Application** repository! This is a cutting-edge, full-stack mobile solution designed to streamline travel bookings, itinerary management, and user verification. The system combines a responsive mobile frontend with a scalable backend service architecture.

---

## 🛠️ Tech Stack & Architecture

The application is split into two major components: the mobile client and the centralized backend server, utilizing a hybrid database approach for optimal performance.

### 📱 Frontend (Mobile Client)
* **Framework:** React Native with Expo (TypeScript)
* **UI & Styling:** Modern, interactive user interface with custom dark/light theme support.
* **State & Navigation:** React Navigation for seamless screen transitions.

### ⚙️ Backend (Server & Cloud Services)
* **Runtime Environment:** Node.js
* **Web Framework:** Express.js
* **Primary Database:** MongoDB (for storing dynamic user data, trip details, and booking records).
* **Cloud Services (Supabase):** Utilized for secure user authentication, real-time data features, and bucket storage (e.g., receipt/identity verification).

---

## 📂 Project Structure

```text
mearn-mobile-app/
├── my-mobile-app-bacend/   # Node.js & Express.js backend server
├── my-mobile-app/          # React Native (Expo) mobile client source
├── README.md               # Documentation
└── tsconfig.json           # TypeScript configuration

