#  ChatApp

A full-stack messaging and social app built with a modern TypeScript monorepo architecture. Sign up, connect with friends, and chat — all in one place.

---

##  Project Structure

```
/
├── client/                        # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/                   # API call functions
│   │   ├── assets/                # Static assets (images, icons)
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page-level components
│   │   ├── store/                 # Zustand global state
│   │   ├── styles/                # Global styles
│   │   ├── types/                 # TypeScript type definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env
│   ├── index.html
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── eslint.config.js
│
└── server/                        # Node.js + Express backend
    ├── prisma/                    # Prisma schema and migrations
    ├── src/
    │   ├── controllers/           # Route handler logic
    │   ├── routes/                # Express route definitions
    │   ├── middleware/            # Auth and other middleware
    │   ├── lib/                   # Shared utilities / Prisma client
    │   ├── generated/prisma/      # Auto-generated Prisma types
    │   ├── types/                 # TypeScript type definitions
    │   ├── validations/           # Zod validation schemas
    │   └── index.ts               # App entry point
    ├── dist/                      # Compiled output
    ├── .env
    ├── tsconfig.json
    ├── prisma.config.ts
    └── package.json
```

---

##  Features

### Authentication
- Sign up with a username and password
- Secure login with JWT-based authentication
- Passwords hashed with bcrypt
- Request validation with Zod schemas

### Profile Management
- Edit your bio
- Upload / update your profile picture
- Delete your account

### Friends System
- Discover all users in the app via the **People** tab
- Send friend requests to anyone
- Accept or decline incoming requests via the pending requests icon
- View your sent and pending requests separately

### Messaging
- Chat exclusively with friends in the **Chat** tab
- Send messages to yourself (personal notes / bookmarks)

---

##  Tech Stack

### Backend (`/server`)

| Technology | Purpose |
|---|---|
| Node.js + Express | HTTP server and routing |
| TypeScript | Type safety |
| Prisma ORM | Database access and schema management |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| Zod | Request body validation |
| CORS | Cross-origin resource sharing |
| dotenv | Environment variable management |

### Frontend (`/client`)

| Technology | Purpose |
|---|---|
| React | UI framework |
| Vite | Build tool and dev server |
| TypeScript | Type safety |
| TanStack Query | Server state, caching, and data fetching |
| Zustand | Client-side global state |
| React Router | Client-side routing |
| Styled Components | CSS-in-JS styling |

---

##  Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- A running database (configured via `DATABASE_URL`)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/messaging-app.git
cd messaging-app
```

### 2. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 3. Configure environment variables

`/server/.env`
```env
DATABASE_URL="your_database_connection_string"
JWT_SECRET="your_jwt_secret"
PORT=5000
```

`/client/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Set up the database

```bash
cd server
npx prisma migrate dev
```

### 5. Run the app

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

The client runs at `http://localhost:5173` and the server at `http://localhost:5000`.

---

##  API Reference

All routes are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Log in and receive a JWT | No |

### Users — `/api/users`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/users` | Get all users (People tab) | Yes |
| GET | `/users/me` | Get the currently logged-in user | Yes |
| GET | `/users/:id` | Get a specific user's profile | Yes |
| PUT | `/users/:id` | Update bio or profile picture | Yes |
| DELETE | `/users/:id` | Delete account | Yes |

### Messages — `/api/messages`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/messages/:userId` | Get conversation with a user | Yes |
| POST | `/messages/:userId` | Send a message to a user | Yes |

### Friendships — `/api/friendships`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/friendships` | Get your full friends list | Yes |
| GET | `/friendships/pending` | Get incoming friend requests | Yes |
| GET | `/friendships/sent` | Get your sent friend requests | Yes |
| POST | `/friendships/request/:userId` | Send a friend request | Yes |
| PUT | `/friendships/accept/:requestId` | Accept a friend request | Yes |
| PUT | `/friendships/reject/:requestId` | Decline a friend request | Yes |

---

##  Authentication Flow

1. User registers or logs in via `/api/auth`
2. Server returns a signed JWT
3. Client stores the token and attaches it to all subsequent requests:
   ```
   Authorization: Bearer <token>
   ```
4. The `authenticateToken` middleware validates the token on every protected route

---


---

##  Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

##  License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
