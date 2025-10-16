const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Routes
app.get('/api/weather', async (req, res) => {
    try {
        const { city, lat, lon } = req.query;
        
        let url;
        if (lat && lon) {
            url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        } else if (city) {
            url = `${BASE_URL}/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        } else {
            return res.status(400).json({ error: 'Please provide city or coordinates' });
        }

        const response = await axios.get(url);
        const weatherData = {
            city: response.data.name,
            country: response.data.sys.country,
            temperature: Math.round(response.data.main.temp),
            feels_like: Math.round(response.data.main.feels_like),
            humidity: response.data.main.humidity,
            pressure: response.data.main.pressure,
            wind_speed: response.data.wind.speed,
            description: response.data.weather[0].description,
            icon: response.data.weather[0].icon,
            main: response.data.weather[0].main
        };

        res.json(weatherData);
    } catch (error) {
        console.error('Weather API error:', error.response?.data);
        res.status(500).json({ 
            error: 'Failed to fetch weather data',
            details: error.response?.data?.message || 'Unknown error'
        });
    }
});

app.get('/api/forecast', async (req, res) => {
    try {
        const { city, lat, lon } = req.query;
        
        let url;
        if (lat && lon) {
            url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        } else if (city) {
            url = `${BASE_URL}/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        } else {
            return res.status(400).json({ error: 'Please provide city or coordinates' });
        }

        const response = await axios.get(url);
        const forecastData = response.data.list
            .filter((item, index) => index % 8 === 0) // Get one forecast per day
            .slice(0, 5) // Next 5 days
            .map(item => ({
                date: item.dt_txt,
                temperature: Math.round(item.main.temp),
                feels_like: Math.round(item.main.feels_like),
                humidity: item.main.humidity,
                description: item.weather[0].description,
                icon: item.weather[0].icon,
                wind_speed: item.wind.speed
            }));

        res.json(forecastData);
    } catch (error) {
        console.error('Forecast API error:', error.response?.data);
        res.status(500).json({ 
            error: 'Failed to fetch forecast data',
            details: error.response?.data?.message || 'Unknown error'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;