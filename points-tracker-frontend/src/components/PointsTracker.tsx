import React, { useState, useEffect } from 'react';


// Use a direct URL in development, or your deployed backend URL in production
const API_URL = 'https://gamified-tracker.onrender.com';

const PointsTracker = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
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

  const fetchPoints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/points`);
      if (!response.ok) throw new Error('Failed to fetch points');
      const data = await response.json();
      setHistory(data.map(point => ({
        date: new Date(point.date).toLocaleDateString(),
        points: point.totalPoints
      })));
    } catch (error) {
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
      
      switch(key) {
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
          totalPoints: total
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
    } catch (error) {
      setError('Error saving points: ' + error.message);
      console.error('Error saving points:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Points Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-bold text-lg">Points to Earn</h3>
              <div className="space-y-2 bg-gray-50 p-4 rounded">
                {Object.entries(dailyPoints).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      {key === 'reachOffice' && ' (2 points)'}
                      {typeof value === 'boolean' && key !== 'reachOffice' && ' (1 point)'}
                    </label>
                    {typeof value === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setDailyPoints({...dailyPoints, [key]: e.target.checked})}
                        className="w-4 h-4"
                      />
                    ) : (
                      <input
                        type="number"
                        value={value}
                        min="0"
                        onChange={(e) => setDailyPoints({...dailyPoints, [key]: parseInt(e.target.value) || 0})}
                        className="w-20 p-1 border rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-lg">Deductions</h3>
              <div className="space-y-2 bg-gray-50 p-4 rounded">
                {Object.entries(deductions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </label>
                    <input
                      type="number"
                      value={value}
                      min="0"
                      onChange={(e) => setDeductions({...deductions, [key]: parseInt(e.target.value) || 0})}
                      className="w-20 p-1 border rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xl font-bold">
                Monthly Total: {monthlyTotal} points
              </div>
              <div className="text-xl font-bold">
                Today's Total: {calculateDailyTotal()}
              </div>
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
                    {day.points > 0 ? <Plus className="inline w-4 h-4" /> : <Minus className="inline w-4 h-4" />}
                    {Math.abs(day.points)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PointsTracker;
