# TaskFlow – Smart Task Manager

TaskFlow is a modern task management web application built with the MERN Stack. It enables users to register securely, manage daily tasks, organize work using a Kanban board, and track deadlines through an interactive calendar. The project focuses on clean architecture, responsive design, and an intuitive user experience.

## Features

- **Authentication:** Secure Registration, Login, Logout using JWT.
- **Dashboard:** Overview of Total, Pending, Completed, and Due Today tasks, along with Recent and Upcoming Tasks.
- **Task Management:** Full CRUD operations with categories, priority, due date, and time.
- **Calendar:** Interactive monthly calendar view highlighting tasks based on priority.
- **Kanban Board:** Drag and drop interface for managing task status (To Do, In Progress, Completed).
- **Analytics:** Visual charts for task completion rates, tasks by status, category, and priority.
- **Archive & Trash:** Safely archive tasks or move them to the trash, with options to restore or permanently delete.
- **Profile & Settings:** Update user details, change passwords, and toggle dark mode/notification settings.

## Tech Stack

**Frontend:**
- React.js (Vite)
- React Router DOM
- Tailwind CSS
- Axios
- FullCalendar
- @dnd-kit (Drag and Drop)
- Recharts (Data Visualization)
- Lucide React (Icons)
- React Toastify (Notifications)

**Backend:**
- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Token (JWT)
- bcryptjs

## Installation

### Prerequisites
- Node.js
- MongoDB (Local or Atlas)
- Git

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Intership_project
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   # Update the .env file with your MongoDB URI
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the `server` directory with the following:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
```

## Folder Structure

```
Intership_project/
├── client/                 # Frontend React App (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components (Sidebar, Navbar, Layout)
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Application pages (Dashboard, Tasks, Kanban, etc.)
│   │   ├── services/       # API integration
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Backend Node.js/Express App
│   ├── config/             # Database connection
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth protection
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── server.js
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Tasks
- `GET /api/tasks` - Get all tasks (supports filtering, sorting, searching)
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Move a task to trash
- `PATCH /api/tasks/archive/:id` - Archive a task
- `PATCH /api/tasks/restore/:id` - Restore a task
- `DELETE /api/tasks/permanent/:id` - Permanently delete a task
- `GET /api/tasks/archived` - Get all archived tasks
- `GET /api/tasks/trashed` - Get all trashed tasks
- `GET /api/tasks/analytics` - Get user task analytics

## Screenshots
*(Add screenshots of your application here)*

## License
MIT License
