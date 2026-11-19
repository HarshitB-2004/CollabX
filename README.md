# CollabX – Real-Time Team Collaboration Platform

CollabX is a full-stack team collaboration platform designed to help teams communicate, organize projects, manage tasks, and collaborate in real time through a centralized workspace.

Built using the MERN stack, Socket.IO, WebRTC, and Google Gemini AI, CollabX combines project-based channels, real-time messaging, task management, file sharing, and AI-powered productivity tools in one application.

**[Live Demo](https://collaboration-platform-delta.vercel.app/)**

---

## Features

### 🔐 Authentication & Authorization
- User registration and login.
- Secure password hashing using bcrypt.
- JWT-based authentication.
- Protected routes and authenticated API requests.

### 🏢 Project & Workspace Management
- Create and manage workspaces.
- Add members to projects.
- Organize team discussions using project-based channels.
- Manage workspace members and channels.

### 💬 Real-Time Messaging
- Instant messaging using Socket.IO.
- Real-time message updates across connected users.
- Edit and delete messages.
- Share file attachments, images, videos, and audio.
- Channel-based conversations.

### ✅ Task Management
- Create and assign tasks to project members.
- Organize tasks by status:
  - To Do
  - In Progress
  - Completed
- Set task priorities: Low, Medium, High, and Urgent.
- Add task descriptions and due dates.
- Update task status and manage assignments.

### 🤖 AI-Powered Productivity
Powered by Google Gemini AI.

- **AI Message Enhancement:** Rewrite messages in professional, friendly, concise, or confident tones.
- **Channel Summarization:** Generate summaries from recent channel conversations.
- **Action Item Extraction:** Identify actionable tasks from team discussions.
- **Save AI Insights:** Store generated summaries and action items for future reference.
- **Task Creation:** Convert extracted action items into tasks.

### 🎙️ Voice & Video Huddles
- Real-time voice and video communication.
- WebRTC peer-to-peer connections.
- Microphone and camera controls.
- Real-time participant updates using Socket.IO.

### 📊 Dashboard & People
- Workspace and task overview.
- Completed task statistics.
- Recent and assigned tasks.
- Deadline alerts for overdue and upcoming tasks.
- User search and friend request management.

---

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Real-Time Communication | Socket.IO |
| Voice & Video | WebRTC |
| AI Integration | Google Gemini API |
| File Uploads | Multer |
| Drag & Drop | dnd-kit |

---

## Project Architecture

CollabX follows a client-server architecture.

```text
                 ┌──────────────────────┐
                 │      React Client    │
                 │                      │
                 │  Dashboard           │
                 │  Projects & Channels │
                 │  Real-Time Chat      │
                 │  Task Management     │
                 │  AI Features         │
                 │  Voice/Video Huddles │
                 └──────────┬───────────┘
                            │
                 REST API   │   Socket.IO
                            │
                 ┌──────────▼───────────┐
                 │    Express Server    │
                 │                      │
                 │  Authentication      │
                 │  API Routes          │
                 │  Controllers         │
                 │  JWT Middleware      │
                 │  Socket.IO Signaling │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │       MongoDB        │
                 │                      │
                 │  Users               │
                 │  Projects            │
                 │  Channels            │
                 │  Messages            │
                 │  Tasks               │
                 │  AI Insights         │
                 └──────────────────────┘

       Google Gemini API ── AI-powered features

       WebRTC ── Peer-to-peer voice/video communication
```

---

## Project Structure

```text
CollabX/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── aiController.js
│   │   ├── authController.js
│   │   ├── channelController.js
│   │   ├── dashboardController.js
│   │   ├── friendController.js
│   │   ├── messageController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── userController.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── AIInsight.js
│   │   ├── Channel.js
│   │   ├── FriendRequest.js
│   │   ├── Message.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   ├── authRoutes.js
│   │   ├── channelRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── friendRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── socket/
│       ├── theme/
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
│
├── images/
├── package.json
└── README.md
```

---

## Getting Started

Follow these steps to run CollabX locally.

### Prerequisites

- Node.js and npm
- MongoDB database (local or MongoDB Atlas)
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/HarshitB-2004/CollabX.git

cd CollabX
```

### 2. Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend server:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

The Vite development server will provide a local URL, usually:

```text
http://localhost:5173
```

**Note:** The current frontend API and Socket.IO client configuration uses `http://localhost:5000`. For production deployment, update these configurations to point to your deployed backend URL.

---

## API Overview

All REST API routes are prefixed with `/api`.

| Module | Base Route | Description |
|---|---|---|
| Authentication | `/api/auth` | Registration, login, profile |
| Projects | `/api/projects` | Create, retrieve, add members, delete |
| Channels | `/api/channels` | Create, retrieve, delete channels |
| Messages | `/api/messages` | Retrieve, upload, edit, delete messages |
| Tasks | `/api/tasks` | Create, retrieve, update, delete tasks |
| AI | `/api/ai` | Message enhancement, summaries, action items |
| Dashboard | `/api/dashboard` | Dashboard overview and statistics |
| Users | `/api/users` | Search users |
| Friends | `/api/friends` | Friend requests and connections |

Protected endpoints require a JWT access token in the request header:

```http
Authorization: Bearer <your_token>
```

---

## Real-Time Communication

Socket.IO handles real-time events such as:

- Joining project channels.
- Sending and receiving messages.
- Broadcasting message updates and deletions.
- Managing voice/video huddle participants.
- Exchanging WebRTC offers, answers, and ICE candidates.

WebRTC enables peer-to-peer audio and video communication, while Socket.IO handles the signaling and participant coordination.

---

## Environment Variables

The backend requires the following environment variables:

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `GEMINI_API_KEY` | Google Gemini API key |

**Security:** Never commit your `.env` file, database credentials, JWT secrets, or API keys to GitHub.

---

## Future Improvements

- Improve production deployment configuration.
- Add stronger real-time presence and notification capabilities.
- Expand workspace administration and collaboration features.
- Improve file storage and upload management.
- Add automated testing and CI/CD workflows.

---

## Author

**Harshit Bhardwaj**

B.Tech – Computer Science & Engineering

GitHub: [HarshitB-2004](https://github.com/HarshitB-2004)

---

*CollabX – Bringing team communication and project collaboration together in one workspace.*
