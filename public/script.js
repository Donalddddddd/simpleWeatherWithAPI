const API_BASE = '/api';

async function getWeather() {
    const city = document.getElementById('cityInput').value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    await fetchWeatherData({ city });
}

async function getLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchWeatherData({ lat: latitude, lon: longitude });
        },
        (error) => {
            hideLoading();
            showError('Unable to retrieve your location');
            console.error('Geolocation error:', error);
        }
    );
}

async function fetchWeatherData(params) {
    try {
        showLoading();
        hideError();
        hideCurrentWeather();
        hideForecast();

        const queryString = new URLSearchParams(params).toString();
        
        // Fetch current weather
        const weatherResponse = await fetch(`${API_BASE}/weather?${queryString}`);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) {
            throw new Error(weatherData.details || 'Failed to fetch weather data');
        }

        // Fetch forecast
        const forecastResponse = await fetch(`${API_BASE}/forecast?${queryString}`);
        const forecastData = await forecastResponse.json();

        if (!forecastResponse.ok) {
            throw new Error(forecastData.details || 'Failed to fetch forecast data');
        }

        displayCurrentWeather(weatherData);
        displayForecast(forecastData);
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function displayCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.city}, ${data.country}`;
    document.getElementById('temp').textContent = data.temperature;
    document.getElementById('feelsLike').textContent = data.feels_like;
    document.getElementById('humidity').textContent = data.humidity;
    document.getElementById('windSpeed').textContent = data.wind_speed;
    document.getElementById('pressure').textContent = data.pressure;
    document.getElementById('description').textContent = data.description;
    
    const weatherIcon = document.getElementById('weatherIcon');
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    weatherIcon.alt = data.description;

    showCurrentWeather();
}

function displayForecast(forecastData) {
    const forecastList = document.getElementById('forecastList');
    forecastList.innerHTML = '';

    forecastData.forEach(day => {
        const date = new Date(day.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-date">${date}</div>
            <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.description}">
            <div class="forecast-temp">${day.temperature}°C</div>
            <div class="forecast-desc">${day.description}</div>
            <div class="forecast-details">
                <small>Feels: ${day.feels_like}°C</small><br>
                <small>Humidity: ${day.humidity}%</small><br>
                <small>Wind: ${day.wind_speed} m/s</small>
            </div>
        `;

        forecastList.appendChild(forecastItem);
    });

    showForecast();
}

// UI Helper functions
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showCurrentWeather() {
    document.getElementById('currentWeather').classList.remove('hidden');
}

function hideCurrentWeather() {
    document.getElementById('currentWeather').classList.add('hidden');
}

function showForecast() {
    document.getElementById('forecast').classList.remove('hidden');
}

function hideForecast() {
    document.getElementById('forecast').classList.add('hidden');
}

function showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

// Enter key support for search
document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getWeather();
    }
});

// Load weather for a default city on page load
window.addEventListener('load', () => {
    // Optional: Load weather for a default city
    // fetchWeatherData({ city: 'London' });
});