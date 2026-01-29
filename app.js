const countdownEl = document.querySelector("[data-countdown]");

if (countdownEl) {
  const target = new Date(countdownEl.dataset.countdown + "T00:00:00");
  const now = new Date();
  const diffMs = target - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    countdownEl.textContent = `D-${diffDays}`;
  } else if (diffDays === 0) {
    countdownEl.textContent = "D-Day";
  } else {
    countdownEl.textContent = `D+${Math.abs(diffDays)}`;
  }
}

const config = {
  origin: {
    label: "서울 압구정",
    lat: 37.5278,
    lon: 127.0285,
  },
  destination: {
    label: "화천 산천어축제",
    lat: 38.1065,
    lon: 127.7084,
  },
};

const weatherStatus = document.getElementById("weather-status");
const weatherDetail = document.getElementById("weather-detail");
const weatherBadge = document.getElementById("weather-badge");
const trafficStatus = document.getElementById("traffic-status");
const trafficDetail = document.getElementById("traffic-detail");
const trafficBadge = document.getElementById("traffic-badge");
const foodStatus = document.getElementById("food-status");
const foodList = document.getElementById("food-list");
const liveUpdated = document.getElementById("live-updated");

const formatTime = (date) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const updateTimestamp = () => {
  if (liveUpdated) {
    liveUpdated.textContent = `업데이트 ${formatTime(new Date())}`;
  }
};

const getWeatherBadge = (description) => {
  const text = description || "";
  if (text.includes("눈")) return { icon: "❄️", label: "눈" };
  if (text.includes("비")) return { icon: "🌧️", label: "비" };
  if (text.includes("안개") || text.includes("연무")) {
    return { icon: "🌫️", label: "연무" };
  }
  if (text.includes("구름") || text.includes("흐림")) {
    return { icon: "☁️", label: "흐림" };
  }
  if (text.includes("맑")) return { icon: "☀️", label: "맑음" };
  return { icon: "🌤️", label: "날씨" };
};

const getTrafficBadge = (durationMin) => {
  if (!Number.isFinite(durationMin)) {
    return { label: "확인 중", className: "badge--info" };
  }
  if (durationMin <= 100) return { label: "원활", className: "badge--ok" };
  if (durationMin <= 140) return { label: "보통", className: "badge--warn" };
  return { label: "혼잡", className: "badge--busy" };
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = [error.message, error.detail]
      .filter(Boolean)
      .join(" · ");
    throw new Error(message || "정보를 불러오지 못했습니다.");
  }
  return response.json();
};

const loadWeather = async () => {
  if (!weatherStatus || !weatherDetail) return;
  try {
    const query = new URLSearchParams({
      lat: String(config.destination.lat),
      lon: String(config.destination.lon),
    });
    const data = await fetchJson(`/api/weather?${query.toString()}`);
    const badge = getWeatherBadge(data.description);
    weatherStatus.textContent = `${data.temp}°C · ${data.description}`;
    if (weatherBadge) {
      weatherBadge.textContent = `${badge.icon} ${badge.label}`;
      weatherBadge.classList.remove("badge--info", "badge--ok", "badge--warn", "badge--busy");
      weatherBadge.classList.add("badge--info");
    }
    weatherDetail.innerHTML = `
      <span>체감 ${data.feelsLike}°C · 습도 ${data.humidity}%</span>
      <span>풍속 ${data.windSpeed}m/s · 최저/최고 ${data.tempMin}°C / ${data.tempMax}°C</span>
      <span>기준 지역: ${data.name}</span>
    `;
  } catch (error) {
    weatherStatus.textContent = "API 키 설정 필요";
    if (weatherBadge) {
      weatherBadge.textContent = "확인 필요";
      weatherBadge.classList.remove("badge--info", "badge--ok", "badge--warn", "badge--busy");
      weatherBadge.classList.add("badge--warn");
    }
    weatherDetail.textContent = error.message;
  }
};

const loadTraffic = async () => {
  if (!trafficStatus || !trafficDetail) return;
  try {
    const query = new URLSearchParams({
      startLat: String(config.origin.lat),
      startLon: String(config.origin.lon),
      goalLat: String(config.destination.lat),
      goalLon: String(config.destination.lon),
    });
    const data = await fetchJson(`/api/traffic?${query.toString()}`);
    const trafficMeta = getTrafficBadge(data.durationMin);
    const eta = new Date(Date.now() + data.durationMin * 60000);
    trafficStatus.textContent = `${data.durationMin}분 · ${data.distanceKm}km`;
    if (trafficBadge) {
      trafficBadge.textContent = trafficMeta.label;
      trafficBadge.classList.remove("badge--info", "badge--ok", "badge--warn", "badge--busy");
      trafficBadge.classList.add(trafficMeta.className);
    }
    trafficDetail.innerHTML = `
      <span>출발: ${config.origin.label}</span>
      <span>도착: ${config.destination.label}</span>
      <span>도착 예상 ${formatTime(eta)} · ${data.summary}</span>
    `;
  } catch (error) {
    trafficStatus.textContent = "API 키 설정 필요";
    if (trafficBadge) {
      trafficBadge.textContent = "확인 필요";
      trafficBadge.classList.remove("badge--info", "badge--ok", "badge--warn", "badge--busy");
      trafficBadge.classList.add("badge--warn");
    }
    trafficDetail.textContent = error.message;
  }
};

const renderPlaces = (items, label) => {
  if (!items || items.length === 0) return "";
  return `
    <li>
      <strong>${label}</strong><br />
      ${items
        .map((item) => `${item.name} · ${item.distanceKm}km`)
        .join("<br />")}
    </li>
  `;
};

const loadFood = async () => {
  if (!foodStatus || !foodList) return;
  try {
    const query = new URLSearchParams({
      lat: String(config.destination.lat),
      lon: String(config.destination.lon),
    });
    const data = await fetchJson(`/api/food?${query.toString()}`);
    if (data.note) {
      foodStatus.textContent = "현장 추천 기준";
      foodList.innerHTML = `
        <li>행사장 내 간식: 농특산물교환권 활용</li>
        <li>석식: 산천어 구이/회 또는 근처 식당</li>
        <li>이동 중 휴게소는 실시간 상황에 맞춰 선택</li>
      `;
      return;
    }
    foodStatus.textContent = "도착지 기준 추천";
    foodList.innerHTML =
      renderPlaces(data.restAreas, "근처 휴게소") +
      renderPlaces(data.restaurants, "맛집 키워드");
  } catch (error) {
    foodStatus.textContent = "API 키 설정 필요";
    foodList.innerHTML = `<li>${error.message}</li>`;
  }
};

const loadLiveData = async () => {
  await Promise.all([loadWeather(), loadTraffic(), loadFood()]);
  updateTimestamp();
};

loadLiveData();
