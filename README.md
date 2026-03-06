# RankLeet 🏆

A competitive LeetCode ranking platform where users can form groups, track their LeetCode progress, and compete on a dynamic leaderboard. Built with React, Express.js, and MongoDB.

## ✨ Features

- **User Authentication**: Secure registration and login with JWT
- **Profile Management**: Link your LeetCode account and track problem-solving progress
- **Group Formation**: Create or join groups with invite codes
- **Real-time Leaderboards**: Dynamic leaderboards showing group rankings by score
- **Automatic Stats Refresh**: Background job updates LeetCode statistics every 30 minutes
- **Smart Scoring**: Problems weighted by difficulty (Easy: 1pt, Medium: 3pts, Hard: 5pts)
- **Responsive Design**: Beautiful dark-themed UI built with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router 7** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS 3** - Styling
- **Vite** - Build tool

### Backend
- **Node.js + Express 4** - Server framework
- **MongoDB 9** - Database
- **Mongoose 8** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Helmet.js** - Security headers
- **node-cron** - Scheduled jobs

### DevTools
- **Nodemon** - Development server
- **ESLint** - Code linting
- **Vite** - Frontend build

## � Documentation

This repository contains the main README for users and developers. Internal development documentation including production guides, API fixes, validation details, and utility references are maintained locally for team reference but are not included in version control to keep the repository focused on production-ready code.

## �📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- MongoDB Atlas account (for database)

### Clone Repository
```bash
git clone https://github.com/AdarshKumar-rathaur/rankleet.git
cd RankLeet
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the server directory:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/rankleet
JWT_SECRET=your-secret-key-change-in-production
CLIENT_URL=http://localhost:5173
```

Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### 2. Frontend Setup

```bash
cd client
npm install
```

Create a `.env.local` file in the client directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FRONTEND_URL=http://localhost:5173
```

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

#### Server (`.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing key (min 32 chars in production) | Random string |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `SERVER_URL` | Server URL for health checks | `http://localhost:5000` |

#### Client (`.env.local`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `http://localhost:5000/api` |
| `VITE_FRONTEND_URL` | Frontend URL | `http://localhost:5173` |

## 📁 Project Structure

```
RankLeet/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Group.jsx
│   │   │   ├── Join.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/           # API services
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                      # Express backend
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── groupController.js
│   │   └── userController.js
│   ├── middleware/            # Express middleware
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/                # MongoDB schemas
│   │   ├── Group.js
│   │   └── User.js
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── groupRoutes.js
│   │   └── userRoutes.js
│   ├── services/              # Business logic
│   │   ├── cronJobs.js
│   │   └── leetcodeService.js
│   ├── utils/
│   │   └── scoreCalculator.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── PRODUCTION_GUIDE.md
├── FIXES_APPLIED.md
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and get JWT token

### Users
- `GET /api/users/profile` - Get current user profile (Protected)
- `GET /api/users/groups` - Get user's groups (Protected)

### Groups
- `POST /api/groups/create` - Create new group (Protected)
- `POST /api/groups/join/:inviteCode` - Join group by code (Protected)
- `GET /api/groups/:groupId` - Get group details (Protected)
- `GET /api/groups/:groupId/leaderboard` - Get leaderboard (Protected)
- `DELETE /api/groups/:groupId` - Delete group (Protected, creator only)

### Health
- `GET /health` - Server health check

## 🔒 Security Features

- ✅ Password hashing with bcryptjs (12 rounds)
- ✅ JWT-based authentication (7-day expiration)
- ✅ Rate limiting (100 req/15min global, 5 req/15min auth)
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Input validation and sanitization
- ✅ MongoDB injection prevention
- ✅ Environment variable validation
- ✅ Secure error handling


### Quick Deploy Checklist
1. Configure all environment variables
2. Generate strong JWT_SECRET
3. Set up MongoDB Atlas cluster
4. Build frontend: `npm run build` in client/
5. Deploy with Node.js or Docker
6. Configure CORS for your domain
7. Enable HTTPS on your server

## 📊 LeetCode Integration

- Fetches stats from LeetCode GraphQL API
- Updates every 30 minutes via cron job
- Tracks Easy, Medium, Hard problems solved
- Calculates weighted score (1-3-5 point system)
- Handles API errors gracefully with retry logic

## 🧪 Testing

### Frontend
```bash
cd client
npm run lint  # ESLint
```

### Backend
Create test file as needed. Current setup ready for:
- Jest for unit tests
- Supertest for API tests

## 📈 Performance Optimizations

- Database query optimization with lean()
- Connection pooling (5-10 connections)
- Request payload limit (10KB)
- Timeout on external API calls (10s)
- Efficient cron job scheduling

## 🐛 Known Issues & Limitations

1. **Local Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
2. **Cron Jobs**: In-memory store (use Redis for distributed systems)
3. **LeetCode API**: Rate limited - stats refresh every 30 minutes
4. **Profile Picture**: Not implemented yet

## 🔄 Future Enhancements

- [ ] Token refresh mechanism
- [ ] Profile pictures/avatars
- [ ] Email verification
- [ ] Password reset
- [ ] Group chat
- [ ] Problem solving notifications
- [ ] Achievement badges
- [ ] API rate limit by user
- [ ] Two-factor authentication
- [ ] Dark/Light theme toggle

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

Created with ❤️ by [Your Name]

## 📞 Support & Contact

For support, email support@rankleet.com or open an issue on GitHub.

## 🙏 Acknowledgments

- LeetCode for the public API
- React community for amazing tools
- Open source contributors

---

Made with ❤️ | [GitHub](https://github.com/AdarshKumar-rathaur/rankleet.git) | Check out [RankLeet](https://rankleet.vercel.app)
