class WeatherApp {
    constructor() {
        this.API_BASE = '/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.createParticles();
        this.loadDefaultCity();
    }

    createParticles() {
        const container = document.querySelector('.particles-container');
        const particles = 50;
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: ${this.getRandomColor()};
                border-radius: 50%;
                top: ${Math.random() * 100}vh;
                left: ${Math.random() * 100}vw;
                animation: floatParticle ${Math.random() * 20 + 10}s linear infinite;
                filter: blur(1px);
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes floatParticle {
                    0% {
                        transform: translate(0, 0) rotate(0deg);
                        opacity: ${Math.random() * 0.5 + 0.1};
                    }
                    100% {
                        transform: translate(${Math.random() * 100 - 50}vw, ${Math.random() * 100 - 50}vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            
            document.head.appendChild(style);
            container.appendChild(particle);
        }
    }

    getRandomColor() {
        const colors = [
            '#00f3ff', '#b967ff', '#ff2a6d', '#00ff88', '#fff500'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    bindEvents() {
        // Enter key support for search
        document.getElementById('cityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.getWeather();
            }
        });

        // Add cyber typing effect
        document.getElementById('cityInput').addEventListener('input', (e) => {
            this.hideError();
            this.cyberTypeEffect(e.target);
        });
    }

    cyberTypeEffect(input) {
        input.style.textShadow = '0 0 10px var(--neon-blue)';
        setTimeout(() => {
            input.style.textShadow = 'none';
        }, 200);
    }

    async getWeather() {
        const city = document.getElementById('cityInput').value.trim();
        
        if (!city) {
            this.showError('PLEASE ENTER CITY COORDINATES');
            return;
        }

        await this.fetchWeatherData({ city });
    }

    async getLocation() {
        if (!navigator.geolocation) {
            this.showError('GEOLOCATION PROTOCOL UNAVAILABLE');
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
        let message = 'UNABLE TO ACCESS LOCATION DATA';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'LOCATION ACCESS DENIED. ENABLE PERMISSIONS.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'LOCATION DATA UNAVAILABLE.';
                break;
            case error.TIMEOUT:
                message = 'LOCATION REQUEST TIMEOUT. RETRY INITIATED.';
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

            // Add cyber transition effect
            await this.cyberTransition();
            
            this.displayCurrentWeather(weatherData);
            this.displayForecast(forecastData);
            
        } catch (error) {
            this.showError(error.message.toUpperCase());
        } finally {
            this.hideLoading();
        }
    }

    cyberTransition() {
        return new Promise((resolve) => {
            const elements = document.querySelectorAll('.futuristic-glass');
            elements.forEach(el => {
                el.style.opacity = '0.5';
                el.style.transform = 'scale(0.95)';
            });
            
            setTimeout(() => {
                elements.forEach(el => {
                    el.style.opacity = '1';
                    el.style.transform = 'scale(1)';
                });
                resolve();
            }, 300);
        });
    }

    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.details || `NETWORK ERROR: ${response.status}`);
        }
        
        return data;
    }

    displayCurrentWeather(data) {
        document.getElementById('cityName').textContent = `${data.city.toUpperCase()}, ${data.country}`;
        document.getElementById('temp').textContent = Math.round(data.temperature);
        document.getElementById('feelsLike').textContent = Math.round(data.feels_like);
        document.getElementById('humidity').textContent = data.humidity;
        document.getElementById('windSpeed').textContent = data.wind_speed.toFixed(1);
        document.getElementById('pressure').textContent = data.pressure;
        document.getElementById('description').textContent = data.description.toUpperCase();
        
        // Update last updated time with cyber format
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('lastUpdated').textContent = `LAST UPDATE: ${timeString}`;
        
        // Update weather icon with glow effect
        const weatherIcon = document.getElementById('weatherIcon');
        weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
        weatherIcon.alt = data.description;

        this.showCurrentWeather();
    }

    displayForecast(forecastData) {
        const forecastList = document.getElementById('forecastList');
        forecastList.innerHTML = '';

        forecastData.forEach((day, index) => {
            const date = new Date(day.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            }).toUpperCase();

            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item futuristic-glass';
            forecastItem.style.animationDelay = `${index * 0.1}s`;
            forecastItem.innerHTML = `
                <div class="forecast-date">${formattedDate}</div>
                <img src="https://openweathermap.org/img/wn/${day.icon}.png" 
                     alt="${day.description}" 
                     class="forecast-icon">
                <div class="forecast-temp data-glow">${Math.round(day.temperature)}°C</div>
                <div class="forecast-desc">${day.description.toUpperCase()}</div>
                <div class="forecast-details">
                    <small>THERMAL: ${Math.round(day.feels_like)}°C</small>
                    <small>HUMIDITY: ${day.humidity}%</small>
                    <small>WIND: ${day.wind_speed.toFixed(1)} M/S</small>
                </div>
            `;

            forecastList.appendChild(forecastItem);
        });

        this.showForecast();
    }

    loadDefaultCity() {
        // Load weather for Tokyo on initial page load (futuristic default)
        setTimeout(() => {
            if (!document.getElementById('cityInput').value) {
                document.getElementById('cityInput').placeholder = "INITIALIZING TOKYO SCAN...";
                setTimeout(() => {
                    this.fetchWeatherData({ city: 'Tokyo' });
                }, 1000);
            }
        }, 800);
    }

    // UI Helper methods
    showLoading() {
        const loading = document.getElementById('loading');
        loading.classList.remove('hidden');
        loading.style.animation = 'glitchAppear 0.5s ease-out';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.style.animation = 'none';
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 300);
    }

    showCurrentWeather() {
        const currentWeather = document.getElementById('currentWeather');
        currentWeather.classList.remove('hidden');
        currentWeather.style.animation = 'cardAppear 0.6s ease-out';
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
        errorElement.style.animation = 'errorPulse 0.5s ease-in-out';
        
        // Add glitch effect
        setTimeout(() => {
            errorElement.style.animation = 'none';
        }, 500);
    }

    hideError() {
        document.getElementById('error').classList.add('hidden');
    }
}

// Initialize the cyber weather app
const weatherApp = new WeatherApp();

// Add cyber console message
console.log(`
%cNEXUS WEATHER SYSTEMS v2.4.7
%cQuantum Atmospheric Interface Online
All Systems Nominal
🌐 Network: Connected
📡 Sensors: Active
🌀 Processing: Optimal
`, 'color: #00f3ff; font-size: 16px; font-weight: bold;', 'color: #00ff88;');