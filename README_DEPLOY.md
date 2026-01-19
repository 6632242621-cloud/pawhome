# PawHome - Tinder for Pets 🐾

Pet adoption and matching platform with real-time chat functionality.

## Features
- Pet adoption matching
- Real-time chat with Socket.IO
- Breeding program
- Pet services marketplace
- Admin panel

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: MySQL
- **Real-time**: Socket.IO
- **Frontend**: Vanilla JavaScript

## Deployment on Render

### Prerequisites
1. Render account (free)
2. GitHub repository

### Environment Variables (Required on Render)
```
DATABASE_URL=mysql://user:password@host:port/database
NODE_ENV=production
FRONTEND_URL=https://your-app.onrender.com
PORT=3000
```

### Deploy Steps
1. Create PostgreSQL database on Render (or use external MySQL)
2. Create Web Service
3. Connect GitHub repo
4. Set environment variables
5. Deploy!

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`)

3. Setup MySQL database:
```bash
mysql -u root -p < database.sql
```

4. Start server:
```bash
npm start
```

5. Open http://localhost:3000

## Database Schema
See `database.sql` for complete schema.

## License
MIT
