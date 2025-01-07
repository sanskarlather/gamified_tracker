// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/points-tracker')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Points Schema
const pointsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dailyPoints: {
    reachOffice: Boolean,
    makeBed: Boolean,
    notSmoking: Boolean,
    notOrdering: Boolean,
    spending: Boolean,
    pagesWritten: Number,
    hoursRead: Number,
    homeCookedMeal: Boolean,
    laundry: Boolean,
    unclutteredStreak: Boolean
  },
  deductions: {
    screenTime: Number,
    jointsSmoked: Number,
    orderingAmount: Number,
    contentWatched: Number,
    techQuicke: Number,
    laundryDelay: Number,
    sleepDelay: Number
  },
  totalPoints: Number
}, { timestamps: true });

const Points = mongoose.model('Points', pointsSchema);

// Routes
app.post('/api/points', async (req, res) => {
  try {
    const points = new Points(req.body);
    await points.save();
    res.status(201).json(points);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/points', async (req, res) => {
  try {
    const points = await Points.find().sort({ date: -1 });
    res.json(points);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/points/monthly-total', async (req, res) => {
  const { month, year } = req.query;
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const monthlyPoints = await Points.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPoints' }
        }
      }
    ]);
    
    res.json({ total: monthlyPoints[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
