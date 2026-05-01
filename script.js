const apiKey = "c48ab13330631a52b5e030067cdd2902";
const apiUrl =
  "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const searchForm = document.querySelector("form");
const searchInput = document.querySelector("form input");
const weatherIcon = document.querySelector(".weather-icon");

searchForm.addEventListener("submit", checkWeather);

function getLocalTime(timezoneOffset) {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcTime + timezoneOffset * 1000);
}

async function getForecast(city) {
  if (!city) {
    console.error("City is empty or undefined");
    return [];
  }

  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

  try {
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      throw new Error(
        `Forecast API error: ${forecastResponse.status} - ${errorText}`,
      );
    }

    const forecastData = await forecastResponse.json();
    if (!forecastData.list) {
      throw new Error("Forecast data is missing the 'list' property.");
    }

    const dailyForecasts = [];
    const seenDays = new Set();

    for (const item of forecastData.list) {
      const date = new Date(item.dt * 1000);
      const day = date.getDate();

      if (date.getHours() === 13 && !seenDays.has(day)) {
        seenDays.add(day)
        dailyForecasts.push(item)
        if (dailyForecasts.length ===5) break
      }
    }

    console.log("Extracted Daily Forecasts:", dailyForecasts);
    return dailyForecasts;
  } catch (error) {
    console.error("Error in getForecast:", error);
    return [];
  }
}

async function checkWeather(e) {
  e.preventDefault();
  const city = searchInput.value.trim();
  searchInput.value = "";

  if (!city) {
    console.error("City input is empty!");
    return;
  }

  try {
    const currentResponse = await fetch(
      apiUrl + encodeURIComponent(city) + `&appid=${apiKey}`,
    );

    if (currentResponse.status === 404) {
      document.querySelector(".error").style.display = "block";
      document.querySelector(".weather").style.display = "none";
      return;
    }

    const currentData = await currentResponse.json();
    const timezoneOffset = currentData.timezone;
    const localTime = getLocalTime(timezoneOffset);

    const hour = localTime.getHours();
    const isNight = hour >= 20 || hour < 6;
    let iconCode = currentData.weather[0].icon;

    if (isNight && !iconCode.endsWith("n")) {
      iconCode = iconCode.slice(0, -1) + "n";
    }

    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.src = iconUrl;

    const formattedTime = localTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const windSpeedMph = Math.round(currentData.wind.speed * 2.237);

    document.querySelector(".city").innerHTML = currentData.name;
    document.querySelector(".temp").innerHTML =
      Math.round(currentData.main.temp) + "°C";
    document.querySelector(".humidity").innerHTML =
      currentData.main.humidity + "%";
    document.querySelector(".wind").innerHTML = windSpeedMph + "mph";
    document.querySelector(".time").innerHTML = `Local Time: ${formattedTime}`;

    document.querySelector(".weather").style.display = "block";
    document.querySelector(".error").style.display = "none";

    const dailyForecasts = await getForecast(city);
    console.log("Daily Forecasts in checkWeather:", dailyForecasts);

    if (!dailyForecasts || dailyForecasts.length === 0) {
      console.error("No forecast data available.");
      return;
    }

    // Update forecast row
    for (let i = 0; i < 5; i++) {
      const dayData = dailyForecasts[i];
      if (!dayData) continue;

      const date = new Date(dayData.dt * 1000);
      const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
      const dayIconCode = dayData.weather[0].icon;

      // Use correct icon URL
      const dayIconUrl = `https://openweathermap.org/img/wn/${dayIconCode}@2x.png`;

      const dayDiv = document.querySelectorAll(".day")[i];
      if (!dayDiv) {
        console.error(`Day ${i + 1} div not found.`);
        continue;
      }

      const img = dayDiv.querySelector("img");
      const dayNameElement = dayDiv.querySelector(`.day-${i + 1}`);
      const weatherElement = dayDiv.querySelector(`.day-${i + 1}-weather`);

      if (!img || !dayNameElement || !weatherElement) {
        console.error(`Elements not found for day ${i + 1}.`);
        continue;
      }

      img.src = dayIconUrl;
      dayNameElement.textContent = dayName;
      weatherElement.textContent = `${Math.round(dayData.main.temp)}°C`;
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    document.querySelector(".error").style.display = "block";
    document.querySelector(".weather").style.display = "none";
  }
}
