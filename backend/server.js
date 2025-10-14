const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://simple-weather-green-sigma.vercel.app' // Update after Vercel deployment
  ],
  credentials: true
}));

app.use(express.json());

// FIXED: PostgreSQL configuration for Supabase with IPv4 force
const getDbConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  
  // Parse the connection string to extract components
  const url = new URL(connectionString);
  
  return {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.substring(1), // Remove leading slash
    user: url.username,
    password: url.password,
    ssl: {
      rejectUnauthorized: false
    },
    // Force IPv4 connection
    family: 4
  };
};

let pool;

// Initialize database connection with retry logic
const initializePool = () => {
  try {
    const dbConfig = getDbConfig();
    pool = new Pool(dbConfig);
    
    console.log('🔧 Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      usingIPv4: true
    });
    
    return pool;
  } catch (error) {
    console.error('❌ Failed to create database pool:', error);
    throw error;
  }
};

// Initialize the pool
pool = initializePool();

// Test database connection with retry
async function testConnection(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ Database connected successfully. Current time:', result.rows[0].current_time);
      client.release();
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      
      if (i < retries - 1) {
        console.log(`🔄 Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('💥 All connection attempts failed');
        return false;
      }
    }
  }
}

// Database connection events
pool.on('connect', () => {
  console.log('✅ New client connected to database');
});

pool.on('error', (err) => {
  console.error('💥 Database pool error:', err);
});

// Test connection on startup
testConnection().then(success => {
  if (success) {
    console.log('🎉 Database connection established successfully');
  } else {
    console.log('⚠️  Database connection failed, but server will continue');
  }
});

// Routes
app.get('/api/weather/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    if (!city || city.trim() === '') {
      return res.status(400).json({ error: 'City name is required' });
    }

    // Fetch weather data
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );

    const weatherData = weatherResponse.data;

    // Insert into Supabase
    const insertResult = await pool.query(
      'INSERT INTO weather_searches (city, temperature, description) VALUES ($1, $2, $3) RETURNING *',
      [city, weatherData.main.temp, weatherData.weather[0].description]
    );

    console.log('✅ Search saved to database:', insertResult.rows[0].id);

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
      wind_speed: weatherData.wind.speed,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching weather:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'City not found. Please check the spelling.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(500).json({ error: 'Weather API configuration error' });
    }
    
    res.status(500).json({ error: 'Failed to fetch weather data. Please try again.' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM weather_searches ORDER BY search_date DESC LIMIT 10'
    );
    
    const history = result.rows.map(item => ({
      ...item,
      search_date: new Date(item.search_date).toLocaleString()
    }));
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Weather App Backend API',
    status: 'Running',
    database: 'Supabase PostgreSQL',
    endpoints: {
      weather: 'GET /api/weather/:city',
      history: 'GET /api/history',
      health: 'GET /api/health'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`🌤️ Weather API: ${process.env.WEATHER_API_KEY ? 'Configured' : 'Not configured'}`);
});