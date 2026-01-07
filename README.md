# EventSphere 🌐

**EventSphere** is a modern, comprehensive event management platform designed to streamline the experience for both event organizers and participants. It provides a seamless interface for creating, managing, and browsing events, backed by a robust and secure infrastructure.

🚀 **Live Demo:** [eventsphere-ochre.vercel.app](https://eventsphere-ochre.vercel.app)

---

## ✨ Features

### 🏢 For Organizers
- **Dashboard:** A centralized hub to view and manage all your events.
- **Event Creation:** Easy-to-use forms for creating new events with details like date, time, location, and description.
- **Management:** Edit or delete existing events with ease.
- **Real-time Updates:** Changes are instantly reflected across the platform.

### 👥 For Participants
- **Event Browsing:** Discover events tailored to your interests.
- **Registration:** Simple and quick registration process for events.
- **Dashboard:** View your registered events and upcoming schedule.

### 🔐 Security & Core
- **Authentication:** Secure login and signup powered by **Firebase Authentication**.
- **Role-Based Access:** Distinct features and views for Organizers and Participants.
- **Responsive Design:** Optimized for all devices using **Tailwind CSS**.

---

## 🛠️ Tech Stack

- **Frontend:** [React](https://reactjs.org/) (v18), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend / Database:** [Firebase](https://firebase.google.com/) (Auth, Firestore)
- **Routing:** [React Router](https://reactrouter.com/) (v7)

---

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/eventsphere.git
   cd eventsphere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

---

## 📜 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run preview`: Preview the production build locally.
- `npm run lint`: Run linting checks (if configured).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built with ❤️ by [Your Name]
