const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');

// Override DNS to bypass Windows/Cloudflare blocking MongoDB Atlas domains
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = require('./config/db');
const { startNotificationCron } = require('./cron/notificationJob');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

app.get('/', (req, res) => res.json({ message: 'TaskFlow API is running ✅' }));

// Start email notification cron job
startNotificationCron();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
