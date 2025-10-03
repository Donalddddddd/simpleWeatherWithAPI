const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'weather_app'
};

// Weather API configuration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '667cfa84d905b65d1d16614d960456f4';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Create database connection pool
const createPool = () => {
    return mysql.createPool(dbConfig);
};

// Routes

// Get weather by city name
app.get('/api/weather/:city', async (req, res) => {
    try {
        const { city } = req.params;
        const pool = createPool();

        // Fetch weather data from OpenWeather API
        const weatherResponse = await axios.get(
            `${WEATHER_BASE_URL}/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
        );

        const weatherData = weatherResponse.data;

        // Save search to database
        const [result] = await pool.execute(
            'INSERT INTO weather_searches (city, temperature, description) VALUES (?, ?, ?)',
            [city, weatherData.main.temp, weatherData.weather[0].description]
        );

        // Format response
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

// Get search history
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

// Health check
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