'use strict';

// API

const api_key = "fe5eddc9d40d6f49f133ebce75e1210e";

/**
 * Fetch data from server
 * @param {string} URL API url
 * @param {Function} callback callback
 */
export const fetchData = function (URL, callback) {
  fetch(`${URL}&appid=${api_key}`)
    .then(res => res.json())
    .then(data => callback(data));
}

export const url = {
  currentWeather(lat, lon) {
    return `https://api.openweathermap.org/data/2.5/weather?${lat}&${lon}&units=metric`
  },
  forecast(lat, lon) {
    return `https://api.openweathermap.org/data/2.5/forecast?${lat}&${lon}&units=metric`
  },
  airPollution(lat, lon) {
    return `https://api.openweathermap.org/data/2.5/air_pollution?${lat}&${lon}`
  },
  reverseGeo(lat, lon) {
    return `https://api.openweathermap.org/geo/1.0/reverse?${lat}&${lon}&limit=5`
  },
  /**
   * @param {string} query Search query e.g.: "London", "New York"
   */
  geo(query) {
    return `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5`
  }
}
//////


//// Module JS

export const weekDayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

/**
 * @param {number} dateUnix Unix date in seconds
 * @param {number} timezone Timezone shift from UTC in seconds
 * @returns {string} Date String. formate: "Sunday 10, Jan"
 */
export const getDate = function (dateUnix, timezone) {
  const date = new Date((dateUnix + timezone) * 1000);
  const weekDayName = weekDayNames[date.getUTCDay()];
  const monthName = monthNames[date.getUTCMonth()];

  return `${weekDayName} ${date.getUTCDate()}, ${monthName}`;
}

/**
 * @param {number} timeUnix Unix date in seconds
 * @param {number} timezone Timezone shift from UTC in seconds
 * @returns {string} Time string. formate: "HH:MM AM/PM"
 */
export const getTime = function (timeUnix, timezone) {
  const date = new Date((timeUnix + timezone) * 1000);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12}:${minutes} ${period}`;
}

/**
 * @param {number} timeUnix Unix date in seconds
 * @param {number} timezone Timezone shift from UTC in seconds
 * @returns {string} Time string. formate: "HH AM/PM"
 */
export const getHours = function (timeUnix, timezone) {
  const date = new Date((timeUnix + timezone) * 1000);
  const hours = date.getUTCHours();
  const period = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12} ${period}`;
}

/**
 * @param {number} mps Metter per seconds
 * @returns {number} Kilometer per hours
 */
export const mps_to_kmh = mps => {
  const mph = mps * 3600;
  return mph / 1000;
}

export const aqiText = {
  1: {
    level: "Good",
    message: "Air quality is considered satisfactory, and air pollution poses little or no risk"
  },
  2: {
    level: "Fair",
    message: "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution."
  },
  3: {
    level: "Moderate",
    message: "Members of sensitive groups may experience health effects. The general public is not likely to be affected."
  },
  4: {
    level: "Poor",
    message: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects"
  },
  5: {
    level: "Very Poor",
    message: "Health warnings of emergency conditions. The entire population is more likely to be affected."
  }
}
///

/**
 * Add event listener on multiple elements
 * @param {NodeList} elements Eelements node array
 * @param {string} eventType Event Type e.g.: "click", "mouseover"
 * @param {Function} callback Callback function
 */
const addEventOnElements = function (elements, eventType, callback) {
  for (const element of elements) element.addEventListener(eventType, callback);
}

/**
 * Toggle search in mobile devices
 */
const searchView = document.querySelector("[data-search-view]");
const searchTogglers = document.querySelectorAll("[data-search-toggler]");

const toggleSearch = () => searchView.classList.toggle("active");
addEventOnElements(searchTogglers, "click", toggleSearch);

/**
 * SEARCH INTEGRATION
 */
const searchField = document.querySelector("[data-search-field]");
const searchResult = document.querySelector("[data-search-result]");

let searchTimeout = null;
const serachTimeoutDuration = 500;

searchField.addEventListener("input", function () {

  searchTimeout ?? clearTimeout(searchTimeout);

  if (!searchField.value) {
    searchResult.classList.remove("active");
    searchResult.innerHTML = "";
    searchField.classList.remove("searching");
  } else {
    searchField.classList.add("searching");
  }

  if (searchField.value) {
    searchTimeout = setTimeout(() => {
      fetchData(url.geo(searchField.value), function (locations) {
        searchField.classList.remove("searching");
        searchResult.classList.add("active");
        searchResult.innerHTML = `
          <ul class="view-list" data-search-list></ul>
        `;

        const /** {NodeList} | [] */ items = [];

        for (const { name, lat, lon, country, state } of locations) {
          const searchItem = document.createElement("li");
          searchItem.classList.add("view-item");

          searchItem.innerHTML = `
            <span class="m-icon">location_on</span>

            <div>
              <p class="item-title">${name}</p>

              <p class="label-2 item-subtitle">${state || ""} ${country}</p>
            </div>

            <a href="#/weather?lat=${lat}&lon=${lon}" class="item-link has-state" aria-label="${name} weather" data-search-toggler></a>
          `;

          searchResult.querySelector("[data-search-list]").appendChild(searchItem);
          items.push(searchItem.querySelector("[data-search-toggler]"));
        }

        addEventOnElements(items, "click", function () {
          toggleSearch();
          searchResult.classList.remove("active");
        })
      });
    }, serachTimeoutDuration);
  }

});


const container = document.querySelector("[data-container]");
const loading = document.querySelector("[data-loading]");
const currentLocationBtn = document.querySelector("[data-current-location-btn]");
const errorContent = document.querySelector("[data-error-content]");

/**
 * Render all weather data in html page
 * 
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 */
export const updateWeather = function (lat, lon) {

  loading.style.display = "grid";
  container.style.overflowY = "hidden";
  container.classList.remove("fade-in");
  errorContent.style.display = "none";

  const currentWeatherSection = document.querySelector("[data-current-weather]");
  const highlightSection = document.querySelector("[data-highlights]");
  const hourlySection = document.querySelector("[data-hourly-forecast]");
  const forecastSection = document.querySelector("[data-5-day-forecast]");

  currentWeatherSection.innerHTML = "";
  highlightSection.innerHTML = "";
  hourlySection.innerHTML = "";
  forecastSection.innerHTML = "";

  if (window.location.hash === "#/current-location") {
    currentLocationBtn.setAttribute("disabled", "");
  } else {
    currentLocationBtn.removeAttribute("disabled");
  }

  /**
   * CURRENT WEATHER SECTION
   */
  fetchData(url.currentWeather(lat, lon), function (currentWeather) {

    const {
      weather,
      dt: dateUnix,
      sys: { sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC },
      main: { temp, feels_like, pressure, humidity },
      visibility,
      timezone
    } = currentWeather
    const [{ description, icon }] = weather;

    const card = document.createElement("div");
    card.classList.add("card", "card-lg", "current-weather-card");

    card.innerHTML = `
      <h2 class="title-2 card-title">Now</h2>

      <div class="weapper">
        <p class="heading">${parseInt(temp)}&deg;<sup>c</sup></p>

        <img src="./images/weather_icons/${icon}.png" width="64" height="64" alt="${description}"
          class="weather-icon">
      </div>

      <p class="body-3">${description}</p>

      <ul class="meta-list">

        <li class="meta-item">
          <span class="m-icon">calendar_today</span>

          <p class="title-3 meta-text">${getDate(dateUnix, timezone)}</p>
        </li>

        <li class="meta-item">
          <span class="m-icon">location_on</span>

          <p class="title-3 meta-text" data-location></p>
        </li>

      </ul>
    `;

    fetchData(url.reverseGeo(lat, lon), function ([{ name, country }]) {
      card.querySelector("[data-location]").innerHTML = `${name}, ${country}`
    });

    currentWeatherSection.appendChild(card);

    /**
     * TODAY'S HIGHLIGHTS
     */
    fetchData(url.airPollution(lat, lon), function (airPollution) {

      const [{
        main: { aqi },
        components: { no2, o3, so2, pm2_5 }
      }] = airPollution.list;

      const card = document.createElement("div");
      card.classList.add("card", "card-lg");

      card.innerHTML = `
        <h2 class="title-2" id="highlights-label">Todays Highlights</h2>

        <div class="highlight-list">

          <div class="card card-sm highlight-card one">

            <h3 class="title-3">Air Quality Index</h3>

            <div class="wrapper">

              <span class="m-icon">air</span>

              <ul class="card-list">

                <li class="card-item">
                  <p class="title-1">${pm2_5.toPrecision(3)}</p>

                  <p class="label-1">PM<sub>2.5</sub></p>
                </li>

                <li class="card-item">
                  <p class="title-1">${so2.toPrecision(3)}</p>

                  <p class="label-1">SO<sub>2</sub></p>
                </li>

                <li class="card-item">
                  <p class="title-1">${no2.toPrecision(3)}</p>

                  <p class="label-1">NO<sub>2</sub></p>
                </li>

                <li class="card-item">
                  <p class="title-1">${o3.toPrecision(3)}</p>

                  <p class="label-1">O<sub>3</sub></p>
                </li>

              </ul>

            </div>

            <span class="badge aqi-${aqi} label-${aqi}" title="${aqiText[aqi].message}">
              ${aqiText[aqi].level}
            </span>

          </div>

          <div class="card card-sm highlight-card two">

            <h3 class="title-3">Sunrise & Sunset</h3>

            <div class="card-list">

              <div class="card-item">
                <span class="m-icon">clear_day</span>

                <div>
                  <p class="label-1">Sunrise</p>

                  <p class="title-1">${getTime(sunriseUnixUTC, timezone)}</p>
                </div>
              </div>

              <div class="card-item">
                <span class="m-icon">clear_night</span>

                <div>
                  <p class="label-1">Sunset</p>

                  <p class="title-1">${getTime(sunsetUnixUTC, timezone)}</p>
                </div>
              </div>

            </div>

          </div>

          <div class="card card-sm highlight-card">

            <h3 class="title-3">Humidity</h3>

            <div class="wrapper">
              <span class="m-icon">humidity_percentage</span>

              <p class="title-1">${humidity}<sub>%</sub></p>
            </div>

          </div>

          <div class="card card-sm highlight-card">

            <h3 class="title-3">Pressure</h3>

            <div class="wrapper">
              <span class="m-icon">airwave</span>

              <p class="title-1">${pressure}<sub>hPa</sub></p>
            </div>

          </div>

          <div class="card card-sm highlight-card">

            <h3 class="title-3">Visibility</h3>

            <div class="wrapper">
              <span class="m-icon">visibility</span>

              <p class="title-1">${visibility / 1000}<sub>km</sub></p>
            </div>

          </div>

          <div class="card card-sm highlight-card">

            <h3 class="title-3">Feels Like</h3>

            <div class="wrapper">
              <span class="m-icon">thermostat</span>

              <p class="title-1">${parseInt(feels_like)}&deg;<sup>c</sup></p>
            </div>

          </div>

        </div>
      `;

      highlightSection.appendChild(card);

    });

    /**
     * 24H FORECAST SECTION
     */
    fetchData(url.forecast(lat, lon), function (forecast) {

      const {
        list: forecastList,
        city: { timezone }
      } = forecast;

      hourlySection.innerHTML = `
        <h2 class="title-2">Today at</h2>

        <div class="slider-container">
          <ul class="slider-list" data-temp></ul>

          <ul class="slider-list" data-wind></ul>
        </div>
      `;

      for (const [index, data] of forecastList.entries()) {

        if (index > 7) break;

        const {
          dt: dateTimeUnix,
          main: { temp },
          weather,
          wind: { deg: windDirection, speed: windSpeed }
        } = data
        const [{ icon, description }] = weather

        const tempLi = document.createElement("li");
        tempLi.classList.add("slider-item");

        tempLi.innerHTML = `
          <div class="card card-sm slider-card">

            <p class="body-3">${getHours(dateTimeUnix, timezone)}</p>

            <img src="./images/weather_icons/${icon}.png" width="48" height="48" loading="lazy" alt="${description}"
              class="weather-icon" title="${description}">

            <p class="body-3">${parseInt(temp)}&deg;</p>

          </div>
        `;
        hourlySection.querySelector("[data-temp]").appendChild(tempLi);

        const windLi = document.createElement("li");
        windLi.classList.add("slider-item");

        windLi.innerHTML = `
        <div class="card card-sm slider-card">

          <p class="body-3">${getHours(dateTimeUnix, timezone)}</p>

          <img src="./images/weather_icons/direction.png" width="48" height="48" loading="lazy" alt="direction"
            class="weather-icon" style="transform: rotate(${windDirection - 180}deg)">

          <p class="body-3">${parseInt(mps_to_kmh(windSpeed))} km/h</p>

        </div>
        `;
        hourlySection.querySelector("[data-wind]").appendChild(windLi);

      }

      /**
       * 5 DAY FORECAST SECTION
       */
      forecastSection.innerHTML = `
        <h2 class="title-2" id="forecast-label">5 Days Forecast</h2>

        <div class="card card-lg forecast-card">
          <ul data-forecast-list></ul>
        </div>
      `;

      for (let i = 7, len = forecastList.length; i < len; i += 8) {

        const {
          main: { temp_max },
          weather,
          dt_txt
        } = forecastList[i];
        const [{ icon, description }] = weather
        const date = new Date(dt_txt);

        const li = document.createElement("li");
        li.classList.add("card-item");

        li.innerHTML = `
          <div class="icon-wrapper">
            <img src="./images/weather_icons/${icon}.png" width="36" height="36" alt="${description}"
              class="weather-icon" title="${description}">

            <span class="span">
              <p class="title-2">${parseInt(temp_max)}&deg;</p>
            </span>
          </div>

          <p class="label-1">${date.getDate()} ${monthNames[date.getUTCMonth()]}</p>

          <p class="label-1">${weekDayNames[date.getUTCDay()]}</p>
        `;
        forecastSection.querySelector("[data-forecast-list]").appendChild(li);

      }

      loading.style.display = "none";
      container.style.overflowY = "overlay";
      container.classList.add("fade-in");
    });

  });

}

export const error404 = () => errorContent.style.display = "flex";

// route

const defaultLocation = "#/weather?lat=17.0050454&lon=81.7804732" // Rajahmundry

const currentLocation = function () {
  window.navigator.geolocation.getCurrentPosition(res => {
    const { latitude, longitude } = res.coords;

    updateWeather(`lat=${latitude}`, `lon=${longitude}`);
  }, err => {
    window.location.hash = defaultLocation;
  });
}

/**
 * @param {string} query Searched query
 */
const searchedLocation = query => updateWeather(...query.split("&"));
// updateWeather("lat=51.5073219", "lon=-0.1276474")

const routes = new Map([
  ["/current-location", currentLocation],
  ["/weather", searchedLocation]
]);

const checkHash = function () {
  const requestURL = window.location.hash.slice(1);

  const [route, query] = requestURL.includes ? requestURL.split("?") : [requestURL];

  routes.get(route) ? routes.get(route)(query) : error404();
}

window.addEventListener("hashchange", checkHash);

window.addEventListener("load", function () {
  if (!window.location.hash) {
    window.location.hash = "#/current-location";
  } else {
    checkHash();
  }
});
///