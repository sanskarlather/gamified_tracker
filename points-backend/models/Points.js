const mongoose = require('mongoose');

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

module.exports = mongoose.model('Points', pointsSchema);