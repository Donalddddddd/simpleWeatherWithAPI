// Configuration
const API_BASE_URL = 'https://weather-backend-u240.onrender.com';

// DOM elements
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const historyList = document.getElementById('historyList');

// Weather icons mapping
const weatherIcons = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '☁️',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌦️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '❄️',
    '13n': '❄️',
    '50d': '🌫️',
    '50n': '🌫️'
};

// Functions
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        getWeather();
    }
}

async function getWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    hideError();
    showLoading();
    hideWeather();

    try {
        const response = await fetch(`${API_BASE_URL}/weather/${encodeURIComponent(city)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch weather data');
        }

        const weatherData = await response.json();
        displayWeather(weatherData);
        loadHistory();
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function displayWeather(data) {
    document.getElementById('weatherIcon').textContent = weatherIcons[data.icon] || '🌤️';
    document.getElementById('temperature').textContent = `${Math.round(data.temperature)}°C`;
    document.getElementById('description').textContent = data.description;
    document.getElementById('location').textContent = `${data.city}, ${data.country}`;
    document.getElementById('feelsLike').textContent = `${Math.round(data.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
    document.getElementById('pressure').textContent = `${data.pressure} hPa`;
    document.getElementById('windSpeed').textContent = `${data.wind_speed} m/s`;

    showWeather();
}

async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/history`);
        
        if (!response.ok) {
            throw new Error('Failed to load history');
        }
        
        const history = await response.json();
        displayHistory(history);
    } catch (error) {
        console.error('Error loading history:', error);
        historyList.innerHTML = '<div class="history-item">Error loading history</div>';
    }
}

function displayHistory(history) {
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-item">No search history yet</div>';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div>
                <strong>${item.city}</strong>
                <div>${Math.round(item.temperature)}°C - ${item.description}</div>
            </div>
            <div class="search-date">
                ${new Date(item.search_date).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

// UI helper functions
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showWeather() {
    weatherResult.classList.remove('hidden');
}

function hideWeather() {
    weatherResult.classList.add('hidden');
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    cityInput.focus();
    
    // Test backend connection
    fetch(`${API_BASE_URL}/health`)
        .then(response => response.json())
        .then(data => {
            console.log('Backend health:', data);
        })
        .catch(error => {
            console.error('Backend connection failed:', error);
        });
});