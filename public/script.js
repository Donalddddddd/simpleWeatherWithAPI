class WeatherApp {
    constructor() {
        this.API_BASE = '/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDefaultCity();
    }

    bindEvents() {
        // Enter key support for search
        document.getElementById('cityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.getWeather();
            }
        });

        // Clear error when user starts typing
        document.getElementById('cityInput').addEventListener('input', () => {
            this.hideError();
        });
    }

    async getWeather() {
        const city = document.getElementById('cityInput').value.trim();
        
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        await this.fetchWeatherData({ city });
    }

    async getLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }

        this.showLoading();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await this.fetchWeatherData({ lat: latitude, lon: longitude });
            },
            (error) => {
                this.hideLoading();
                this.handleGeolocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    handleGeolocationError(error) {
        let message = 'Unable to retrieve your location';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access denied. Please allow location access to use this feature.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information unavailable.';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out. Please try again.';
                break;
        }
        
        this.showError(message);
    }

    async fetchWeatherData(params) {
        try {
            this.showLoading();
            this.hideError();
            this.hideCurrentWeather();
            this.hideForecast();

            const queryString = new URLSearchParams(params).toString();
            
            // Fetch current weather and forecast concurrently
            const [weatherResponse, forecastResponse] = await Promise.all([
                fetch(`${this.API_BASE}/weather?${queryString}`),
                fetch(`${this.API_BASE}/forecast?${queryString}`)
            ]);

            const [weatherData, forecastData] = await Promise.all([
                this.handleResponse(weatherResponse),
                this.handleResponse(forecastResponse)
            ]);

            this.displayCurrentWeather(weatherData);
            this.displayForecast(forecastData);
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.details || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    }

    displayCurrentWeather(data) {
        document.getElementById('cityName').textContent = `${data.city}, ${data.country}`;
        document.getElementById('temp').textContent = Math.round(data.temperature);
        document.getElementById('feelsLike').textContent = Math.round(data.feels_like);
        document.getElementById('humidity').textContent = data.humidity;
        document.getElementById('windSpeed').textContent = data.wind_speed.toFixed(1);
        document.getElementById('pressure').textContent = data.pressure;
        document.getElementById('description').textContent = data.description;
        
        // Update last updated time
        document.getElementById('lastUpdated').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        
        // Update weather icon
        const weatherIcon = document.getElementById('weatherIcon');
        weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
        weatherIcon.alt = data.description;

        this.showCurrentWeather();
    }

    displayForecast(forecastData) {
        const forecastList = document.getElementById('forecastList');
        forecastList.innerHTML = '';

        forecastData.forEach(day => {
            const date = new Date(day.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-date">${formattedDate}</div>
                <img src="https://openweathermap.org/img/wn/${day.icon}.png" 
                     alt="${day.description}" 
                     class="forecast-icon">
                <div class="forecast-temp">${Math.round(day.temperature)}°C</div>
                <div class="forecast-desc">${day.description}</div>
                <div class="forecast-details">
                    <small>Feels: ${Math.round(day.feels_like)}°C</small>
                    <small>Humidity: ${day.humidity}%</small>
                    <small>Wind: ${day.wind_speed.toFixed(1)} m/s</small>
                </div>
            `;

            forecastList.appendChild(forecastItem);
        });

        this.showForecast();
    }

    loadDefaultCity() {
        // Load weather for London on initial page load
        setTimeout(() => {
            if (!document.getElementById('cityInput').value) {
                this.fetchWeatherData({ city: 'London' });
            }
        }, 500);
    }

    // UI Helper methods
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showCurrentWeather() {
        document.getElementById('currentWeather').classList.remove('hidden');
    }

    hideCurrentWeather() {
        document.getElementById('currentWeather').classList.add('hidden');
    }

    showForecast() {
        document.getElementById('forecast').classList.remove('hidden');
    }

    hideForecast() {
        document.getElementById('forecast').classList.add('hidden');
    }

    showError(message) {
        const errorElement = document.getElementById('error');
        const errorText = errorElement.querySelector('.error-text');
        errorText.textContent = message;
        errorElement.classList.remove('hidden');
    }

    hideError() {
        document.getElementById('error').classList.add('hidden');
    }
}

// Initialize the weather app
const weatherApp = new WeatherApp();