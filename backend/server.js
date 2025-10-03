import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://simple-weather-bay-chi.vercel.app', // Your Vercel frontend URL
    process.env.FRONTEND_URL // Dynamic frontend URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Database configuration for production
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

// Create database connection pool
const createPool = () => {
  return mysql.createPool(dbConfig);
};

// Weather API configuration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Routes (same as before)
app.get('/api/weather/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const pool = createPool();

    const weatherResponse = await axios.get(
      `${WEATHER_BASE_URL}/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );

    const weatherData = weatherResponse.data;

    await pool.execute(
      'INSERT INTO weather_searches (city, temperature, description) VALUES (?, ?, ?)',
      [city, weatherData.main.temp, weatherData.weather[0].description]
    );

    const response = {
      city: weatherData.name,
      country: weatherData.sys.country,
      temperature: weatherData.main.temp,
      feels_like: weatherData.main.feels_like,
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      wind_speed: weatherData.wind.speed
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching weather:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const pool = createPool();
    const [rows] = await pool.execute(
      'SELECT * FROM weather_searches ORDER BY search_date DESC LIMIT 10'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const pool = createPool();
    await pool.execute('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.json({ status: 'OK', database: 'Disconnected' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});