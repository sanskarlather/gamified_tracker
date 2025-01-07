import React, { useState, useEffect } from 'react';

// Use a direct URL in development, or your deployed backend URL in production
const API_URL = 'https://gamified-tracker.onrender.com';

// Define types for points and history
type Point = {
  date: string;
  totalPoints: number;
};

type HistoryItem = {
  date: string;
  points: number;
};

const PointsTracker = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dailyPoints, setDailyPoints] = useState({
    reachOffice: false,
    makeBed: false,
    notSmoking: false,
    notOrdering: false,
    spending: false,
    pagesWritten: 0,
    hoursRead: 0,
    homeCookedMeal: false,
    laundry: false,
    unclutteredStreak: false,
  });

  const [deductions, setDeductions] = useState({
    screenTime: 0,
    jointsSmoked: 0,
    orderingAmount: 0,
    contentWatched: 0,
    techQuicke: 0,
    laundryDelay: 0,
    sleepDelay: 0,
  });

  useEffect(() => {
    fetchPoints();
    fetchMonthlyTotal();
  }, []);

  // ✅ Fixing the fetchPoints function by typing the 'point' object
  const fetchPoints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/points`);
      if (!response.ok) throw new Error('Failed to fetch points');
      const data: Point[] = await response.json(); // Type the response data
      setHistory(
        data.map((point: Point) => ({
          date: new Date(point.date).toLocaleDateString(),
          points: point.totalPoints,
        }))
      );
    } catch (error: any) {
      setError('Error fetching points: ' + error.message);
      console.error('Error fetching points:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyTotal = async () => {
    const now = new Date();
    try {
      const response = await fetch(
        `${API_URL}/points/monthly-total?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
      );
      if (!response.ok) throw new Error('Failed to fetch monthly total');
      const data = await response.json();
      setMonthlyTotal(data.total);
    } catch (error) {
      console.error('Error fetching monthly total:', error);
    }
  };

  const calculateDailyTotal = () => {
    let total = 0;

    // Add points only when tasks are actually completed (checked)
    if (dailyPoints.reachOffice) total += 2;
    if (dailyPoints.makeBed) total += 1;
    if (dailyPoints.notSmoking) total += 1;
    if (dailyPoints.notOrdering) total += 1;
    if (dailyPoints.spending) total += 1;
    if (dailyPoints.homeCookedMeal) total += 1;
    if (dailyPoints.laundry) total += 1;
    if (dailyPoints.unclutteredStreak) total += 1;

    // Add variable points
    total += Number(dailyPoints.pagesWritten) || 0;
    total += Number(dailyPoints.hoursRead) || 0;

    // Calculate deductions
    const deductionsTotal = Object.entries(deductions).reduce((sum, [key, value]) => {
      const amount = Number(value) || 0;
      let deduction = 0;

      switch (key) {
        case 'screenTime':
          deduction = amount;
          break;
        case 'jointsSmoked':
          deduction = amount;
          break;
        case 'orderingAmount':
          deduction = Math.max(0, Math.floor((amount - 300) / 100));
          break;
        case 'contentWatched':
          deduction = Math.max(0, Math.floor((amount - 120) / 10));
          break;
        case 'techQuicke':
          deduction = amount * 3;
          break;
        case 'laundryDelay':
          deduction = Math.floor(amount / 3);
          break;
        case 'sleepDelay':
          deduction = Math.floor(amount / 10);
          break;
        default:
          break;
      }
      return sum + deduction;
    }, 0);

    return total - deductionsTotal;
  };

  const saveDay = async () => {
    setIsLoading(true);
    setError(null);
    const total = calculateDailyTotal();

    try {
      const response = await fetch(`${API_URL}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date(),
          dailyPoints,
          deductions,
          totalPoints: total,
        }),
      });

      if (!response.ok) throw new Error('Failed to save points');

      await fetchPoints();
      await fetchMonthlyTotal();

      // Reset form
      setDailyPoints({
        reachOffice: false,
        makeBed: false,
        notSmoking: false,
        notOrdering: false,
        spending: false,
        pagesWritten: 0,
        hoursRead: 0,
        homeCookedMeal: false,
        laundry: false,
        unclutteredStreak: false,
      });

      setDeductions({
        screenTime: 0,
        jointsSmoked: 0,
        orderingAmount: 0,
        contentWatched: 0,
        techQuicke: 0,
        laundryDelay: 0,
        sleepDelay: 0,
      });
    } catch (error: any) {
      setError('Error saving points: ' + error.message);
      console.error('Error saving points:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Daily Points Tracker</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Points and Deductions form */}
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xl font-bold">Monthly Total: {monthlyTotal} points</div>
            <div className="text-xl font-bold">Today's Total: {calculateDailyTotal()}</div>
          </div>

          <button
            onClick={saveDay}
            disabled={isLoading}
            className={`w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 ${isLoading ? 'cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Saving...' : 'Save Day'}
          </button>
        </div>

        <div className="mt-6">
          <h3 className="font-bold mb-2">History</h3>
          <div className="space-y-1">
            {history.map((day, index) => (
              <div key={index} className="flex justify-between">
                <span>{day.date}</span>
                <span className={day.points >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {day.points > 0 ? '+' : '-'}{Math.abs(day.points)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsTracker;
