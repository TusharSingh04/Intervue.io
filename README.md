# Resilient Live Polling System

A real-time polling application with teacher and student personas, featuring state recovery, timer synchronization, and robust error handling.

## Features

### Teacher Persona (Admin)
- **Poll Creation**: Create questions with multiple options and configurable timer duration
- **Live Dashboard**: View real-time updates as students submit votes
- **Poll History**: View previously conducted polls and their final results (from database)
- **Student Management**: View connected students and ability to remove them
- **Chat**: Interact with students in real-time

### Student Persona (User)
- **Onboarding**: Enter name on first visit (unique per session/tab)
- **Real-time Interaction**: Receive questions instantly when teacher asks
- **Timer Synchronization**: Timer remains in sync with server (late joiners see correct remaining time)
- **Voting**: Submit answers within the time limit
- **Live Results**: View live polling results after submission

### Resilience Features
- **State Recovery**: Page refresh during active poll restores UI to correct state
- **Race Condition Prevention**: Server-side validation prevents duplicate votes
- **Connection Handling**: Automatic reconnection with state restoration
- **Error Handling**: Graceful degradation when database is unavailable

## Technology Stack

- **Frontend**: React.js 18 with TypeScript, Vite, TailwindCSS
- **Backend**: Node.js with Express and TypeScript
- **Real-time Communication**: Socket.io
- **Database**: MongoDB with Mongoose

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # HTTP request handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic layer
│   │   ├── socket/         # Socket.io handlers
│   │   ├── types/          # TypeScript definitions
│   │   └── server.ts       # Application entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── common/     # Buttons, inputs, cards, etc.
│   │   │   ├── poll/       # Poll-related components
│   │   │   ├── chat/       # Chat components
│   │   │   ├── participants/
│   │   │   └── history/
│   │   ├── context/        # React Context for state
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
└── package.json            # Root package.json with workspaces
```

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Install all dependencies
npm run install:all
```

Or manually:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/polling-system
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start MongoDB

Make sure MongoDB is running locally, or update `MONGODB_URI` to point to your MongoDB Atlas cluster.

### 4. Run the Application

**Development Mode (both servers):**
```bash
npm run dev
```

Or run separately:

```bash
# Backend (in backend/ directory)
npm run dev

# Frontend (in frontend/ directory)
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## API Endpoints

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/polls/active` | GET | Get current active poll |
| `/api/polls/history` | GET | Get poll history |
| `/api/polls/:id` | GET | Get poll by ID |

### Socket Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ name, role, participantId? }` | Join the session |
| `create_poll` | `{ question, options[], duration }` | Create new poll (teacher) |
| `vote` | `{ pollId, optionId }` | Submit a vote |
| `kick_student` | `{ participantId }` | Remove student (teacher) |
| `send_message` | `{ message }` | Send chat message |
| `request_state` | `{ participantId? }` | Request current state |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `participant_joined` | `{ participant }` | Confirmation of join |
| `update_participants` | `{ participants[] }` | Updated participant list |
| `poll_created` | `{ poll, remainingTime }` | New poll started |
| `poll_state` | `{ poll, remainingTime, hasVoted, results }` | Current state |
| `vote_received` | `{ success, optionId }` | Vote confirmation |
| `poll_results` | `{ pollId, results[] }` | Updated results |
| `timer_sync` | `{ pollId, remainingTime, results }` | Timer synchronization |
| `poll_ended` | `{ poll, results[] }` | Poll has ended |
| `new_message` | `{ message }` | New chat message |
| `kicked` | `{ message }` | Student was removed |
| `error` | `{ message }` | Error occurred |

## Architecture Decisions

### Controller-Service Pattern
- **Controllers/Handlers**: Handle incoming requests/events, validate input
- **Services**: Contain business logic and database interactions

### Custom Hooks
- `useSocket`: Manages Socket.io connection and event handling
- `usePollTimer`: Handles timer state with local interpolation between server syncs
- `useStorage`: Handles session/local storage for state persistence

### State Management
- React Context API for global state
- SessionStorage for state recovery across page refreshes

### Error Handling
- Graceful fallback to in-memory storage when DB unavailable
- User-friendly error messages via toast notifications
- Automatic reconnection handling

## Deployment

### Backend
The backend can be deployed to any Node.js hosting platform:
- Heroku
- Railway
- Render
- AWS EC2/ECS

### Frontend
The frontend can be deployed as a static site:
- Vercel
- Netlify
- AWS S3 + CloudFront

Remember to update environment variables for production URLs.

## License

MIT
