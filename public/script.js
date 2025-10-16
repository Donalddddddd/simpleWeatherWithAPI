// API Configuration - UPDATE THIS WITH YOUR ACTUAL BACKEND URL
const API_BASE = '/api'; // ← CHANGE THIS

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loadingElement = document.getElementById('loading');
const weatherDataElement = document.getElementById('weatherData');
const errorElement = document.getElementById('error');
const errorText = document.getElementById('errorText');

// Weather data elements
const cityName = document.getElementById('cityName');
const currentDate = document.getElementById('currentDate');
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDescription = document.getElementById('weatherDescription');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const forecastList = document.getElementById('forecastList');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const visibility = document.getElementById('visibility');
const precipitation = document.getElementById('precipitation');
const uvIndex = document.getElementById('uvIndex');

// Weather backgrounds configuration
const weatherBackgrounds = {
    clear: {
        day: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        night: 'linear-gradient(135deg, #0c2461 0%, #1e3799 100%)'
    },
    cloud: {
        day: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
        night: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)'
    },
    rain: 'linear-gradient(135deg, #373B44 0%, #4286f4 100%)',
    drizzle: 'linear-gradient(135deg, #373B44 0%, #4286f4 100%)',
    thunderstorm: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    snow: 'linear-gradient(135deg, #BBD2C5 0%, #536976 100%)',
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
};

// Update current date
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

// Format time from timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Format date for forecast
function formatForecastDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Show loading state
function showLoading() {
    loadingElement.classList.remove('hidden');
    weatherDataElement.classList.add('hidden');
    errorElement.classList.add('hidden');
}

// Show weather data
function showWeatherData() {
    loadingElement.classList.add('hidden');
    weatherDataElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
}

// Show error
function showError(message) {
    loadingElement.classList.add('hidden');
    weatherDataElement.classList.add('hidden');
    errorElement.classList.remove('hidden');
    errorText.textContent = message;
}

// Change background based on weather - NO EVAL USAGE
function updateBackground(weatherDescription) {
    const hour = new Date().getHours();
    const isDay = hour > 6 && hour < 20;
    let gradient;

    // Convert to lowercase for case-insensitive matching
    const desc = weatherDescription.toLowerCase();

    // Determine background based on weather condition
    if (desc.includes('clear')) {
        gradient = isDay ? weatherBackgrounds.clear.day : weatherBackgrounds.clear.night;
    } else if (desc.includes('cloud')) {
        gradient = isDay ? weatherBackgrounds.cloud.day : weatherBackgrounds.cloud.night;
    } else if (desc.includes('rain')) {
        gradient = weatherBackgrounds.rain;
    } else if (desc.includes('drizzle')) {
        gradient = weatherBackgrounds.drizzle;
    } else if (desc.includes('thunderstorm')) {
        gradient = weatherBackgrounds.thunderstorm;
    } else if (desc.includes('snow')) {
        gradient = weatherBackgrounds.snow;
    } else {
        gradient = weatherBackgrounds.default;
    }

    // Apply gradient with smooth transition
    document.body.style.background = gradient;
}

// Fetch weather data from API
async function fetchWeatherData(city = 'New York') {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/weather?city=${encodeURIComponent(city)}`);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate required fields
        if (!data.city || data.temperature === undefined) {
            throw new Error('Invalid data received from server');
        }
        
        updateWeatherUI(data);
        updateBackground(data.description);
        showWeatherData();
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(`Failed to fetch weather data: ${error.message}. Using demo data.`);
        // Fallback to demo data
        loadDemoData(city);
    }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(latitude, longitude) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/weather?lat=${latitude}&lon=${longitude}`);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        updateWeatherUI(data);
        updateBackground(data.description);
        showWeatherData();
        
    } catch (error) {
        console.error('Error fetching weather by coordinates:', error);
        showError('Failed to get location weather. Search for a city instead.');
    }
}

// Update UI with weather data
function updateWeatherUI(data) {
    // Required fields
    cityName.textContent = `${data.city}, ${data.country || ''}`;
    temperature.textContent = Math.round(data.temperature);
    weatherDescription.textContent = data.description;
    
    // Optional fields with fallbacks
    feelsLike.textContent = `${Math.round(data.feels_like || data.temperature)}°C`;
    humidity.textContent = `${data.humidity || 'N/A'}%`;
    windSpeed.textContent = `${data.wind_speed || 'N/A'} m/s`;
    pressure.textContent = `${data.pressure || 'N/A'} hPa`;
    
    // Set weather icon
    if (data.icon) {
        weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
        weatherIcon.alt = data.description;
    }
    
    // Additional info
    if (data.sunrise) {
        sunrise.textContent = formatTime(data.sunrise);
    }
    if (data.sunset) {
        sunset.textContent = formatTime(data.sunset);
    }
    if (data.visibility) {
        visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    }
    
    // Mock additional data (you can replace with actual API data)
    precipitation.textContent = '0%';
    uvIndex.textContent = '4';
    
    // Generate demo forecast
    generateDemoForecast();
}

// Generate demo forecast data
function generateDemoForecast() {
    forecastList.innerHTML = '';
    
    const forecasts = [
        { day: 'Mon', temp: 22, icon: '01d', desc: 'Sunny' },
        { day: 'Tue', temp: 19, icon: '02d', desc: 'Partly cloudy' },
        { day: 'Wed', temp: 17, icon: '10d', desc: 'Light rain' },
        { day: 'Thu', temp: 20, icon: '03d', desc: 'Cloudy' },
        { day: 'Fri', temp: 23, icon: '01d', desc: 'Sunny' }
    ];
    
    forecasts.forEach(forecast => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-date">${forecast.day}</div>
            <img src="https://openweathermap.org/img/wn/${forecast.icon}.png" alt="${forecast.desc}" class="forecast-icon">
            <div class="forecast-temp">${forecast.temp}°</div>
            <div class="forecast-desc">${forecast.desc}</div>
        `;
        forecastList.appendChild(forecastItem);
    });
}

// Demo data fallback
function loadDemoData(city) {
    const demoData = {
        city: city,
        country: 'Demo',
        temperature: Math.floor(Math.random() * 30) + 10,
        feels_like: Math.floor(Math.random() * 30) + 10,
        humidity: Math.floor(Math.random() * 50) + 30,
        wind_speed: (Math.random() * 10).toFixed(1),
        pressure: Math.floor(Math.random() * 100) + 1000,
        description: ['Clear sky', 'Partly cloudy', 'Cloudy', 'Light rain'][Math.floor(Math.random() * 4)],
        icon: ['01d', '02d', '03d', '04d'][Math.floor(Math.random() * 4)],
        sunrise: Math.floor(Date.now() / 1000) - 3600,
        sunset: Math.floor(Date.now() / 1000) + 3600,
        visibility: 10000
    };
    
    updateWeatherUI(demoData);
    updateBackground(demoData.description);
    showWeatherData();
}

// Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    locationBtn.addEventListener('click', handleLocation);
}

function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    } else {
        showError('Please enter a city name');
    }
}

function handleLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                showError('Unable to retrieve your location. Please search for a city.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

// Initialize the app
function initApp() {
    updateCurrentDate();
    setupEventListeners();
    
    // Load initial data
    loadDemoData('New York');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);