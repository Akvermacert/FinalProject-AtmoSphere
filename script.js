// --- Element Selection ---
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherDisplay = document.getElementById('weather-display');
const unitToggle = document.getElementById('unit-toggle');
const mapContainer = document.getElementById('map');

// --- API Configuration ---
const apiKey = '2edcd7b00ea2081f236aee32ad231ca6';

// --- State ---
let isFahrenheit = false;
let map; // Global variable for the Leaflet map instance

// --- Event Listeners ---
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
        cityInput.value = '';
    } else {
        showMessage("Please enter a city name.", "error");
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeather(city);
            cityInput.value = '';
        } else {
            showMessage("Please enter a city name.", "error");
        }
    }
});

unitToggle.addEventListener('change', () => {
    isFahrenheit = unitToggle.checked;
    const currentCity = document.querySelector('h2');
    if (currentCity) {
        // Re-fetch weather for the current city to update units
        getWeather(currentCity.textContent.split(',')[0].trim());
    } else {
        // If no city is displayed, get weather for the user's location again
        getLocationWeather();
    }
});

// Auto-detect location on page load
window.addEventListener('load', getLocationWeather);

// --- Functions ---

// Fetch weather by city name
async function getWeather(city) {
    const units = isFahrenheit ? "imperial" : "metric";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
    showMessage("Loading weather data...", "loading");

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('City not found. Please try again.');
        }
        const data = await response.json();
        displayWeather(data);
        initMap(data.coord.lat, data.coord.lon);
    } catch (error) {
        showMessage(error.message, "error");
        console.error("Failed to fetch weather:", error);
    }
}

// Fetch weather by geolocation (latitude/longitude)
function getLocationWeather() {
    if (navigator.geolocation) {
        showMessage("Finding your location...", "loading");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherByCoords(lat, lon);
            },
            () => {
                showMessage("Location access denied. Please enter a city manually.", "error");
            }
        );
    } else {
        showMessage("Geolocation is not supported by this browser.", "error");
    }
}

async function getWeatherByCoords(lat, lon) {
    const units = isFahrenheit ? "imperial" : "metric";
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    showMessage("Loading weather data...", "loading");

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Could not fetch weather for your location.');
        }
        const data = await response.json();
        displayWeather(data);
        initMap(lat, lon);
    } catch (error) {
        showMessage(error.message, "error");
        console.error("Failed to fetch weather:", error);
    }
}

// Display weather info and update background
function displayWeather(data) {
    weatherDisplay.innerHTML = '';
    
    // Clear the map container before initializing a new map
    mapContainer.innerHTML = '';

    const unitSymbol = isFahrenheit ? "°F" : "°C";
    const windUnit = isFahrenheit ? "mph" : "m/s";

    const sunrise = formatTime(data.sys.sunrise, data.timezone);
    const sunset = formatTime(data.sys.sunset, data.timezone);

    const weatherHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon">
        <p class="temp">${Math.round(data.main.temp)}${unitSymbol}</p>
        <p class="feels-like">Feels like: ${Math.round(data.main.feels_like)}${unitSymbol}</p>
        <p class="description">${data.weather[0].description}</p>
        
        <div class="details-container">
            <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
            <p><strong>Wind:</strong> ${data.wind.speed} ${windUnit}</p>
        </div>

        <div class="sun-times-container">
            <p><strong>🌅 Sunrise:</strong> ${sunrise}</p>
            <p><strong>🌇 Sunset:</strong> ${sunset}</p>
        </div>
    `;

    weatherDisplay.insertAdjacentHTML('beforeend', weatherHTML);
    changeBackground(data.weather[0].main.toLowerCase());
}

// --- Helper Functions ---

// Correctly format time using UTC and timezone offset
function formatTime(unixTime, timezoneOffset) {
    // 1. Get the UTC time from the Unix timestamp
    const utcTime = new Date(unixTime * 1000);

    // 2. Adjust for the city's timezone offset
    // The timezoneOffset is in seconds.
    const cityTime = new Date(utcTime.getTime() + timezoneOffset * 1000);
    
    // 3. Manually get the hours and minutes in the city's time
    const hours = cityTime.getUTCHours();
    const minutes = cityTime.getUTCMinutes();
    
    // 4. Format the time to a 12-hour (AM/PM) format
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0 to 12
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${formattedHours}:${formattedMinutes} ${period}`;
}

// Show messages to the user (instead of alert)
function showMessage(message, type = "info") {
    weatherDisplay.innerHTML = `<p class="message ${type}">${message}</p>`;
}

// Change page background color depending on weather condition
function changeBackground(condition) {
    if (condition.includes("cloud")) {
        document.body.style.background = "linear-gradient(135deg, #d3d3d3, #999)";
    } else if (condition.includes("rain") || condition.includes("drizzle")) {
        document.body.style.background = "linear-gradient(135deg, #87a8d0, #536976)";
    } else if (condition.includes("clear")) {
        document.body.style.background = "linear-gradient(135deg, #f7d794, #f6e58d)";
    } else if (condition.includes("snow")) {
        document.body.style.background = "linear-gradient(135deg, #e0f2f7, #c6e2ff)";
    } else if (condition.includes("thunderstorm")) {
        document.body.style.background = "linear-gradient(135deg, #5c5c5c, #2b2d35)";
    } else if (condition.includes("mist") || condition.includes("haze") || condition.includes("fog")) {
        document.body.style.background = "linear-gradient(135deg, #bdc3c7, #2c3e50)";
    } else {
        document.body.style.background = "linear-gradient(135deg, #f0f4f8, #dfe6e9)";
    }
}

// Initialize Leaflet map
function initMap(lat, lon) {
    if (map) {
        map.remove();
    }
    
    map = L.map('map').setView([lat, lon], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b>${document.querySelector('h2').textContent}</b>`).openPopup();
}
