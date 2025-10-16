// API Configuration
const API_BASE = 'https://simple-weather-kohl.vercel.app'; // Change this to your backend API URL

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

// Update current date
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

// Format time from timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Format date for forecast
function formatForecastDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

// Change background based on weather and time
function updateBackground(weather, timestamp) {
    const hour = new Date(timestamp * 1000).getHours();
    const isDay = hour > 6 && hour < 20;
    
    let gradient;
    
    if (weather.includes('clear')) {
        gradient = isDay 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'linear-gradient(135deg, #0c2461 0%, #1e3799 100%)';
    } else if (weather.includes('cloud')) {
        gradient = isDay 
            ? 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)' 
            : 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)';
    } else if (weather.includes('rain') || weather.includes('drizzle')) {
        gradient = 'linear-gradient(135deg, #373B44 0%, #4286f4 100%)';
    } else if (weather.includes('thunderstorm')) {
        gradient = 'linear-gradient(135deg, #232526 0%, #414345 100%)';
    } else if (weather.includes('snow')) {
        gradient = 'linear-gradient(135deg, #BBD2C5 0%, #536976 100%)';
    } else {
        gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    document.body.style.background = gradient;
}

// Fetch weather data from API
async function fetchWeatherData(city = 'New York') {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/weather?city=${encodeURIComponent(city)}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        updateWeatherUI(data);
        updateBackground(data.description, Date.now() / 1000);
        showWeatherData();
        
        // Fetch forecast data
        await fetchForecastData(city);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Failed to fetch weather data. Please try again.');
    }
}

// Fetch forecast data from API
async function fetchForecastData(city) {
    try {
        const response = await fetch(`${API_BASE}/forecast?city=${encodeURIComponent(city)}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        
        const data = await response.json();
        displayForecast(data);
        
    } catch (error) {
        console.error('Error fetching forecast data:', error);
        // Don't show error for forecast, just log it
    }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        updateWeatherUI(data);
        updateBackground(data.description, Date.now() / 1000);
        showWeatherData();
        
        // Fetch forecast data
        await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}`)
            .then(response => response.json())
            .then(data => displayForecast(data))
            .catch(error => console.error('Error fetching forecast:', error));
            
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Failed to fetch weather data. Please try again.');
    }
}

// Update UI with weather data
function updateWeatherUI(data) {
    cityName.textContent = `${data.city}, ${data.country}`;
    temperature.textContent = data.temperature;
    weatherDescription.textContent = data.description;
    feelsLike.textContent = `${data.feels_like}°C`;
    humidity.textContent = `${data.humidity}%`;
    windSpeed.textContent = `${data.wind_speed} m/s`;
    pressure.textContent = `${data.pressure} hPa`;
    
    // Set weather icon
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    weatherIcon.alt = data.description;
    
    // Additional info (if available)
    if (data.sunrise) sunrise.textContent = formatTime(data.sunrise);
    if (data.sunset) sunset.textContent = formatTime(data.sunset);
    if (data.visibility) visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    
    // Mock additional data (replace with actual API data when available)
    precipitation.textContent = `${data.precipitation || 0}%`;
    uvIndex.textContent = data.uvIndex || '4';
}

// Display forecast data
function displayForecast(forecastData) {
    forecastList.innerHTML = '';
    
    // Ensure we have forecast data
    if (!forecastData || !Array.isArray(forecastData)) {
        console.error('Invalid forecast data:', forecastData);
        return;
    }
    
    // Take only 5 forecast items (one per day)
    const dailyForecasts = forecastData.slice(0, 5);
    
    dailyForecasts.forEach(day => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-date">${formatForecastDate(day.dt)}</div>
            <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.description}" class="forecast-icon">
            <div class="forecast-temp">${day.temperature}°</div>
            <div class="forecast-desc">${day.description}</div>
            <div class="forecast-low">Feels: ${day.feels_like}°</div>
        `;
        
        forecastList.appendChild(forecastItem);
    });
}

// Mock data for demonstration (remove when using real API)
function loadMockData() {
    const mockWeatherData = {
        city: 'New York',
        country: 'US',
        temperature: 24,
        feels_like: 26,
        humidity: 65,
        wind_speed: 5.2,
        pressure: 1015,
        description: 'Clear sky',
        icon: '01d',
        sunrise: 1623462720,
        sunset: 1623517440,
        visibility: 10000
    };
    
    const mockForecastData = [
        { dt: Date.now()/1000 + 86400, temperature: 26, feels_like: 28, description: 'Sunny', icon: '01d' },
        { dt: Date.now()/1000 + 172800, temperature: 23, feels_like: 25, description: 'Partly cloudy', icon: '02d' },
        { dt: Date.now()/1000 + 259200, temperature: 21, feels_like: 22, description: 'Cloudy', icon: '03d' },
        { dt: Date.now()/1000 + 345600, temperature: 19, feels_like: 20, description: 'Light rain', icon: '10d' },
        { dt: Date.now()/1000 + 432000, temperature: 22, feels_like: 24, description: 'Clear sky', icon: '01d' }
    ];
    
    updateWeatherUI(mockWeatherData);
    displayForecast(mockForecastData);
    updateBackground('clear', Date.now() / 1000);
    showWeatherData();
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        }
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                showError('Unable to retrieve your location. Please try again or search for a city.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
});

// Initialize the app
function initApp() {
    updateCurrentDate();
    
    // Try to load weather for user's location or default city
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                // If location access denied, load mock data or default city
                loadMockData();
            },
            { timeout: 5000 }
        );
    } else {
        // Fallback to mock data
        loadMockData();
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);