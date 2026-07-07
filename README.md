# RankLeet 🏆

A competitive LeetCode ranking and bounty platform where users form groups, track progress, compete on dynamic leaderboards, and participate in a gamified bounty economy. Built with React, Express.js, Node-Cron, and MongoDB.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## ✨ Features

### Core Features
- **🔐 User Authentication** - Secure JWT-based registration and login with bcryptjs password hashing
- **👤 Profile Management** - Link LeetCode account and automatically sync problem-solving progress
- **👥 Group Formation** - Create or join groups with shareable invite codes
- **🏅 Dynamic Leaderboards** - Real-time group rankings sorted by weighted score
- **📊 LeetCode Integration** - Automatic stats refresh every 30 minutes via background jobs
- **🎯 Smart Scoring System** - Weighted by difficulty (Easy: 1pt, Medium: 2pts, Hard: 3pts)
- **📈 Submission Calendar** - Visual heatmap of coding activity over time
- **🏆 Contest Tracking** - Monitor LeetCode contest history and ratings

### Bounty System
- **💰 Bounty Economy** - Create challenges with wagers and objective targets
- **⚡ Point Seeding** - Users earn initial bounty points from existing LeetCode progress
- **📅 Smart Deadlines** - All bounty deadlines normalized to UTC midnight
- **🗑️ Auto Cleanup** - Bounties automatically deleted 7 days after deadline
- **🎲 Wager System** - Join bounties with adjustable bounty point wagers
- **🏁 Resolution** - Automatic bounty resolution and point distribution to winners

### AI Features
- **🤖 AI Activity Feed** - Weekly AI-generated roasts, hype messages, and insights
- **💡 Mastery Paths** - Smart recommendations for problem types to focus on
- **📝 Recent Tags** - Analysis of recently solved problem categories

### UI/UX
- **🎨 Dark Theme** - Beautiful dark-themed interface with gradient accents
- **📱 Responsive Design** - Works seamlessly on desktop and mobile
- **⚙️ Real-time Updates** - Live leaderboard and bounty board updates
- **🔔 Error Handling** - Toast notifications and error boundaries for graceful failures

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2** - Modern UI library with hooks and concurrent rendering
- **React Router 7.13** - Client-side routing and navigation
- **Vite 7.3** - Lightning-fast build tool with HMR
- **Axios 1.13** - Promise-based HTTP client
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Recharts 3.8** - React charting library for visualizations
- **PropTypes 15.8** - Runtime type checking

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 5.2** - Minimalist web framework
- **MongoDB 9** - NoSQL database
- **Mongoose 9.2** - MongoDB ODM with schema validation
- **JWT 9.0** - JSON Web Token authentication
- **bcryptjs 3.0** - Password hashing and comparison
- **node-cron 4.2** - Task scheduling for background jobs
- **express-validator 7.3** - Input validation middleware
- **Helmet 8.1** - HTTP header security middleware
- **express-rate-limit 8.3** - Rate limiting middleware
- **CORS 2.8** - Cross-origin resource sharing
- **@google/genai 2.7** - Google Generative AI integration
- **Axios 1.16** - Server-side HTTP client for LeetCode API

### Development
- **Nodemon 3.1** - Auto-reload server during development
- **ESLint 9.39** - Code quality and style linting
- **PostCSS 8.5** - CSS transformation tool
- **dotenv 17.3** - Environment variable management

---

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** Account (local or MongoDB Atlas)
- **Google Generative AI API Key** (optional, for mastery paths)
- **Git** for version control

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AdarshKumar-rathaur/rankleet.git
cd rankleet
```

### 2. Environment Configuration

#### Server Setup
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your credentials:
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/rankleet

# Security
JWT_SECRET=your-secure-jwt-secret-min-32-chars
CRON_SECRET=your-secure-cron-secret-min-16-chars
NODE_ENV=development

# Server
PORT=5000
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# AI
LLM_PROVIDER=google
LLM_API_KEY=your-google-genai-api-key
```

#### Client Setup
```bash
cd ../client
cat > .env.local << EOF
VITE_API_URL=http://localhost:5000/api
EOF
```

### 3. Install Dependencies

```bash
# From project root
npm install
```

Or install separately:
```bash
# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 4. Database Setup

Ensure MongoDB is running:
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGO_URI in .env
```

### 5. Start Development Server

```bash
# From project root - runs both client and server concurrently
npm run dev

# OR run separately
# Terminal 1: npm run dev:server (from server directory)
# Terminal 2: npm run dev:client (from client directory)
```

Access the application:
- **Client:** http://localhost:5173
- **Server:** http://localhost:5000
- **API Health:** http://localhost:5000/api/health

---

## 📦 Production Build

### Build Client
```bash
cd client
npm run build
```

### Production Deployment
```bash
# Set environment
NODE_ENV=production

# Start server (assumes client is built)
cd server
npm start
```

### Docker Deployment (Optional)
```bash
docker-compose up --build
```

---

## 📖 Usage Guide

### Register & Login
1. Visit http://localhost:5173
2. Click "Register" and create an account with:
   - Name, email, password (min 8 chars, letters + numbers)
   - LeetCode username
3. Login with your credentials

### Create a Group
1. Navigate to Dashboard → Groups
2. Click "Create Group"
3. Enter group name, get invite code
4. Share code with others to join

### Join a Group
1. Obtain invite code from group creator
2. Click "Join Group" and enter code
3. You'll appear on the group leaderboard

### View Leaderboard
1. Select a group from sidebar
2. See ranked members by score
3. Scores update every 30 minutes automatically

### Create a Bounty
1. Go to Bounties tab (requires group)
2. Click "Create Bounty"
3. Set objective (Easy/Medium/Hard/Total solves)
4. Set target amount and deadline
5. Other members can join with wagers

### Join a Bounty
1. View bounties in the board
2. Click "Join Bounty"
3. Enter wager amount (in bounty points)
4. Compete until deadline, earn rewards if won

### Sync Points
1. Go to Dashboard → Points Card
2. Click "Sync Points" to refresh bounty points
3. Points awarded based on new progress since last sync

---

## 🗂️ Project Structure

```
rankleet/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page components (Login, Dashboard, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client (axios)
│   │   ├── utils/            # Utility functions and helpers
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # React entry point
│   ├── package.json
│   ├── vite.config.js        # Vite build config
│   └── tailwind.config.js    # Tailwind CSS config
│
├── server/                    # Express backend
│   ├── config/               # Database and configuration
│   ├── controllers/          # Route handlers and business logic
│   ├── middleware/           # Express middleware (auth, validation, etc.)
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API route definitions
│   ├── services/             # External services (LeetCode, AI, cron jobs)
│   ├── utils/                # Utility functions
│   ├── server.js             # Express app setup and entry point
│   └── package.json
│
├── package.json              # Root package with npm scripts
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and get JWT token

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/groups` - Get user's groups
- `POST /api/users/sync-points` - Sync bounty points from LeetCode progress
- `POST /api/users/refresh` - Force refresh LeetCode data
- `GET /api/users/leetcode-totals` - Get global LeetCode statistics

### Groups
- `POST /api/groups/create` - Create new group
- `GET /api/groups/join/:inviteCode` - Join group by code
- `GET /api/groups/:id/leaderboard` - Get group leaderboard
- `DELETE /api/groups/:id` - Delete group (creator only)

### Bounties
- `POST /api/bounties/create` - Create new bounty
- `GET /api/bounties/group/:groupId` - Get group bounties
- `POST /api/bounties/:id/join` - Join bounty with wager
- `POST /api/bounties/resolve` - Resolve expired bounties (cron)

### AI Activity
- `GET /api/ai-activity/feed` - Get AI activity feed
- `GET /api/ai-activity/group/:groupId` - Get group AI activities
- `POST /api/ai-activity/:id/like` - Like an activity

---

## 🔄 Background Jobs (Cron)

The application runs several automated tasks:

- **30-minute cycle:** Refresh LeetCode stats for all users
- **Daily at 3 AM UTC:** Delete bounties older than 7 days
- **Weekly on Monday at 9 AM UTC:** Generate AI activity messages
- **Weekly on Sunday at 10 AM UTC:** Regenerate mastery paths for all users

---

## 🔒 Security Features

- ✅ JWT authentication with 7-day expiry
- ✅ bcryptjs password hashing (12 rounds)
- ✅ Rate limiting (5 auth requests, 100 API requests per 15 min)
- ✅ Content Security Policy (CSP) headers
- ✅ CORS protection with whitelist
- ✅ Helmet.js HTTP header security
- ✅ Input validation and sanitization
- ✅ NoSQL injection prevention
- ✅ XSS protection
- ✅ HSTS header (1-year max-age)

---

## 🧪 Testing

### Run Linter
```bash
cd client && npm run lint
```

### Manual Testing Checklist
- [ ] Register with valid/invalid inputs
- [ ] Login with correct/incorrect credentials
- [ ] Create and join group
- [ ] View group leaderboard
- [ ] Create bounty with various objectives
- [ ] Join bounty with different wagers
- [ ] Sync bounty points
- [ ] View profile and mastery path
- [ ] Check AI activity feed

---

## 📊 Performance Optimization

- **Caching:** GET request caching with 30-second TTL
- **Lean queries:** Database queries exclude unnecessary fields
- **Batch operations:** LeetCode stats fetched once per user per cycle
- **Connection pooling:** MongoDB connection pool size: 5-10
- **Rate limiting:** Prevents server overload

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```
Error: MONGO_URI not configured
Solution: Check .env file and verify MongoDB connection string is correct
```

### Port Already in Use
```
Solution: Change PORT in .env or kill the process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

### CORS Errors
```
Solution: Update CLIENT_URL in server .env to match frontend URL
```

### LeetCode Stats Not Updating
```
Solution: Check if LeetCode username is correct in user profile
Background jobs run every 30 minutes automatically
```

### 401 Unauthorized on API Calls
```
Solution: Token may be expired. Login again to get a new token
```

---

## 📈 Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Generate strong JWT_SECRET and CRON_SECRET
- [ ] Configure MONGO_URI for production database
- [ ] Set CLIENT_URL to production frontend domain
- [ ] Enable HTTPS/TLS on server
- [ ] Configure firewall and security groups
- [ ] Set up database backups
- [ ] Enable error logging/monitoring (Sentry)
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Test all features in production environment

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Adarsh Singh** - [GitHub Profile](https://github.com/AdarshKumar-rathaur)

---

## 🙏 Acknowledgments

- LeetCode API for problem data
- MongoDB for reliable data storage
- Google Generative AI for intelligent recommendations
- React and Express communities

---

## 📞 Support

For issues, questions, or suggestions:
- Open an [Issue](https://github.com/AdarshKumar-rathaur/rankleet/issues)
- Check [Discussions](https://github.com/AdarshKumar-rathaur/rankleet/discussions)
- Email: adarshkumar9582@gmail.com

---

## 🗺️ Roadmap

### v1.1
- ✅ User profile avatars
- [ ] In-game notifications system
- [ ] Friend requests and messaging
- [ ] Tournament brackets

### v1.2
- [ ] Twitch integration
- [ ] Problem difficulty recommendations
- [ ] Custom problem playlists

### v2.0
- [ ] Marketplace for bounty rewards
- [ ] Streaming integration
- [ ] Advanced analytics dashboard
- [ ] OpenAI GPT integration for code reviews

---

**Last Updated:** June 21, 2026  
**Status:** Active Development

