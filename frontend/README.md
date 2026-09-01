# 💬 PingTalk

A real-time, full-stack chat application built with the MERN stack and Socket.io — inspired by WhatsApp's core messaging experience.

## ✨ Features

- 🔐 **Secure Authentication** — JWT-based auth with bcrypt password hashing
- 📧 **Email OTP Verification** — Signup requires email verification via a 6-digit code (Nodemailer)
- 💬 **Real-Time Messaging** — Instant message delivery powered by Socket.io
- ✅ **Read Receipts** — WhatsApp-style single/double tick with real-time blue tick updates
- ⌨️ **Typing Indicator** — Live "typing..." status
- 🟢 **Online/Offline Status** — Real-time presence tracking
- 🔴 **Unread Message Badges** — Unread count and last message preview in the sidebar
- 📱 **Fully Responsive** — Mobile-first design with WhatsApp-style navigation (list → full-screen chat)
- 🌗 **Dark Mode Support**
- 🛡️ **Protected Routes** — Client and server-side route protection

## 🛠️ Tech Stack

**Frontend:** React (Vite), Tailwind CSS v4, React Router, Axios, Socket.io Client, React Hot Toast, Lucide Icons

**Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT, Bcrypt.js, Nodemailer

**Database:** MongoDB Atlas

## 📸 Screenshots

*(Add screenshots here)*

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB Atlas account
- Gmail account with an App Password (for OTP emails)

### Installation

1. Clone the repository
```bash
git clone https://github.com/abdulhaleem4722/PingTalk.git
cd PingTalk
```

2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

```bash
npm run dev
```

3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```

4. Open `http://localhost:5173` in your browser

## 📁 Project Structure



PingTalk/
├── backend/
│ ├── config/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── utils/
│ └── server.js
└── frontend/
└── src/
├── api/
├── components/
├── context/
└── pages/



## 👤 Author

**Abdul Haleem**
[GitHub](https://github.com/abdulhaleem4722)

---

⭐ If you like this project, consider giving it a star!