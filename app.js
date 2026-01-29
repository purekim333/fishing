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

const metaApiBase = document.querySelector('meta[name="api-base"]')?.content;
const defaultApiBase =
  location.hostname === "localhost" && location.port === "5173"
    ? "http://localhost:3000"
    : "";
const apiBase = [window.API_BASE, metaApiBase, defaultApiBase].find(
  (value) => value && value.trim()
);
const normalizedApiBase = apiBase
  ? apiBase.replace(/\/$/, "")
  : "";
const apiUrl = (path) => (normalizedApiBase ? `${normalizedApiBase}${path}` : path);

const weatherStatus = document.getElementById("weather-status");
const weatherDetail = document.getElementById("weather-detail");
const weatherBadge = document.getElementById("weather-badge");
const trafficStatus = document.getElementById("traffic-status");
const trafficDetail = document.getElementById("traffic-detail");
const trafficBadge = document.getElementById("traffic-badge");
const foodStatus = document.getElementById("food-status");
const foodList = document.getElementById("food-list");
const liveUpdated = document.getElementById("live-updated");
const tipsTitle = document.getElementById("tips-title");
const tipsList = document.getElementById("tips-list");
const mapFrame = document.querySelector(".map-frame");
const mapImage = document.getElementById("naver-map");
const videoTrack = document.getElementById("video-track");
const videoMeta = document.getElementById("video-meta");
const journeyDuration = document.getElementById("journey-duration");
const journeyDistance = document.getElementById("journey-distance");
const journeyEta = document.getElementById("journey-eta");
const journeySummary = document.getElementById("journey-summary");

let latestWeather = null;
let latestTraffic = null;

const formatTime = (date) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes)) return "시간 확인 중";
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
};

const updateTimestamp = () => {
  if (liveUpdated) {
    liveUpdated.textContent = `업데이트 ${formatTime(new Date())}`;
  }
};


const renderTips = () => {
  if (!tipsTitle || !tipsList) return;
  const tips = [];
  let title = "현장 컨디션 요약";

  if (latestWeather) {
    if (latestWeather.temp <= -5) {
      tips.push("체감 영하권: 핫팩과 귀마개 필수");
    } else if (latestWeather.temp <= 2) {
      tips.push("추운 날씨: 방풍 겉옷과 장갑 준비");
    }
    if (latestWeather.description?.includes("눈")) {
      tips.push("눈 소식: 방수 부츠와 여벌 양말 챙기기");
    }
    if (latestWeather.windSpeed >= 6) {
      tips.push("바람 강함: 목도리와 넥워머 추천");
    }
    title = `${latestWeather.description} · 체감 ${latestWeather.feelsLike}°C`;
  }

  if (latestTraffic) {
    if (latestTraffic.durationMin >= 140) {
      tips.push("교통 혼잡 예상: 출발 시간을 앞당기기");
    } else if (latestTraffic.durationMin <= 100) {
      tips.push("교통 원활: 휴게소 들러도 여유 있음");
    }
  }

  if (tips.length === 0) {
    tips.push("따뜻한 물과 간식은 필수! 현장 컨디션 관리");
    tips.push("현장 사진 타임을 위해 배터리 체크");
    tips.push("출발 전 장비 점검과 장갑 준비");
  }

  tipsTitle.textContent = title;
  tipsList.innerHTML = tips.map((tip) => `<li>${tip}</li>`).join("");
};

const setMapPreview = ({ goalLat, goalLon, level }) => {
  if (!mapImage) return;
  const mapLevel = Number.isFinite(level) ? level : 9;
  const mapUrl = apiUrl(
    `/api/map?startLat=${encodeURIComponent(config.origin.lat)}&startLon=${encodeURIComponent(
      config.origin.lon
    )}&goalLat=${encodeURIComponent(goalLat)}&goalLon=${encodeURIComponent(
      goalLon
    )}&level=${encodeURIComponent(mapLevel)}`
  );
  mapImage.src = mapUrl;
};

const setupMapPreview = () => {
  if (!mapFrame || !mapImage) return;
  const lat = mapFrame.dataset.mapLat;
  const lon = mapFrame.dataset.mapLon;
  if (!lat || !lon) return;
  setMapPreview({ goalLat: lat, goalLon: lon });
  mapImage.addEventListener("error", () => {
    mapImage.removeAttribute("src");
  });
};

const buildVideoCard = ({ url, thumbnail, title, channel }) => {
  const card = document.createElement("a");
  card.className = "video-card";
  card.href = url;
  card.target = "_blank";
  card.rel = "noreferrer";

  const img = document.createElement("img");
  img.className = "video-card__thumb";
  img.src = thumbnail;
  img.alt = title || "YouTube 영상";
  img.loading = "lazy";

  const play = document.createElement("span");
  play.className = "video-card__play";
  play.textContent = "▶";

  const body = document.createElement("div");
  body.className = "video-card__body";

  const titleEl = document.createElement("div");
  titleEl.className = "video-card__title";
  titleEl.textContent = title || "유튜브에서 보기";

  const metaEl = document.createElement("div");
  metaEl.className = "video-card__meta";
  metaEl.textContent = channel || "YouTube";

  body.appendChild(titleEl);
  body.appendChild(metaEl);
  card.appendChild(img);
  card.appendChild(play);
  card.appendChild(body);
  return card;
};

const setupYoutubeVideos = async () => {
  if (!videoTrack || !videoMeta) return;
  const query = "화천 산천어 축제";
  try {
    const data = await fetchJson(`/api/youtube?query=${encodeURIComponent(query)}&maxResults=10`);
    if (!data.items || data.items.length === 0) {
      videoMeta.textContent = data.note || "유튜브 추천을 불러오지 못했습니다.";
      const empty = document.createElement("div");
      empty.className = "video-card video-card--empty";
      empty.textContent = "유튜브 API 키를 설정하면 영상이 표시됩니다.";
      videoTrack.appendChild(empty);
      return;
    }

    videoMeta.textContent = "현장 분위기 영상 추천";
    data.items.forEach((item) => {
      if (!item.videoId) return;
      const url = `https://www.youtube.com/watch?v=${item.videoId}`;
      const thumb = item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
      videoTrack.appendChild(
        buildVideoCard({
          url,
          thumbnail: thumb,
          title: item.title,
          channel: item.channel,
        })
      );
    });
  } catch (error) {
    videoMeta.textContent = "유튜브 추천 로딩 실패";
  }
};

const setupVideoSlider = () => {
  if (!videoTrack) return;
  const prevButton = document.querySelector("[data-video-prev]");
  const nextButton = document.querySelector("[data-video-next]");
  const scrollByPage = (direction) => {
    const amount = Math.max(240, videoTrack.clientWidth * 0.9);
    videoTrack.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  if (prevButton) prevButton.addEventListener("click", () => scrollByPage(-1));
  if (nextButton) nextButton.addEventListener("click", () => scrollByPage(1));
};

const setupRouteSteps = () => {
  const steps = document.querySelectorAll("[data-route-step]");
  const title = document.getElementById("route-title");
  const desc = document.getElementById("route-desc");
  const meta = document.getElementById("route-meta");
  const progress = document.getElementById("route-progress");
  if (!steps.length || !title || !desc || !meta) return;

  const details = [
    {
      title: "신사중학교",
      desc: "집결 후 출발 준비를 마친 뒤 바로 진입합니다.",
      meta: "도착 10분 전 단체 연락",
      lat: 37.5208,
      lon: 127.0227,
      level: 11,
    },
    {
      title: "올림픽대로 18km",
      desc: "서울 구간 혼잡 시 우회 루트도 고려하세요.",
      meta: "혼잡 시간대라면 빠른 길 재탐색",
      lat: 37.5403,
      lon: 126.9757,
      level: 11,
    },
    {
      title: "서울양양고속도로 62km",
      desc: "장거리 주행 구간으로 휴게소 타이밍을 잡습니다.",
      meta: "휴게소 1회 계획 추천",
      lat: 37.6765,
      lon: 127.2244,
      level: 10,
    },
    {
      title: "순환대로 17km",
      desc: "막바지 구간에서 교통 흐름을 재확인합니다.",
      meta: "도착 예상 시간 업데이트",
      lat: 37.9356,
      lon: 127.6617,
      level: 10,
    },
    {
      title: "화천정보산업고등학교 (주차장)",
      desc: "주차 후 현장으로 이동합니다.",
      meta: "현장 안내 표지판 확인",
      lat: 38.1065,
      lon: 127.7084,
      level: 9,
    },
  ];

  const updateProgress = (index) => {
    if (!progress) return;
    const ratio = Math.max(1, index + 1) / steps.length;
    progress.style.width = `${Math.round(ratio * 100)}%`;
  };

  steps.forEach((step) => {
    step.addEventListener("click", () => {
      steps.forEach((item) => item.classList.remove("is-active"));
      step.classList.add("is-active");
      const index = Number(step.dataset.routeStep) || 0;
      const info = details[index] || details[0];
      title.textContent = info.title;
      desc.textContent = info.desc;
      meta.textContent = info.meta;
      if (Number.isFinite(info.lat) && Number.isFinite(info.lon)) {
        setMapPreview({ goalLat: info.lat, goalLon: info.lon, level: info.level });
      }
      updateProgress(index);
    });
  });

  const initial = details[0];
  if (Number.isFinite(initial.lat) && Number.isFinite(initial.lon)) {
    setMapPreview({ goalLat: initial.lat, goalLon: initial.lon, level: initial.level });
  }
  updateProgress(0);
};

const setupStageObserver = () => {
  const stages = document.querySelectorAll("[data-stage]");
  if (!stages.length) return;
  document.body.dataset.stage = stages[0].dataset.stage || "hero";
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          document.body.dataset.stage = entry.target.dataset.stage;
        }
      });
    },
    { threshold: 0.55 }
  );
  stages.forEach((stage) => observer.observe(stage));
};

const setupReveal = () => {
  const revealItems = document.querySelectorAll(".reveal");
  if (!revealItems.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.3 }
  );
  revealItems.forEach((item) => observer.observe(item));
};


const setupCarousel = () => {
  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;
  const track = carousel.querySelector("[data-carousel-track]");
  const viewport = carousel.querySelector("[data-carousel-viewport]");
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dotsContainer = carousel.querySelector("[data-carousel-dots]");
  const tabs = document.querySelectorAll("[data-gallery-tab]");
  if (!track || !viewport || !dotsContainer) return;

  const galleryQueries = {
    festival: "화천 산천어 축제",
    ice: "화천 산천어 축제 얼음낚시",
    food: "화천 산천어 축제 먹거리",
    night: "화천 산천어 축제 야간",
  };

  const fallbackSlides = [
    {
      src: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
      alt: "겨울 축제",
      caption: "축제의 활기",
    },
    {
      src: "https://images.unsplash.com/photo-1452723312111-3a7d0db0e024?auto=format&fit=crop&w=1200&q=80",
      alt: "얼음낚시",
      caption: "얼음낚시 포인트",
    },
    {
      src: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1200&q=80",
      alt: "보온 준비",
      caption: "보온 아이템",
    },
    {
      src: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80",
      alt: "화천 풍경",
      caption: "겨울 풍경",
    },
  ];

  let slides = [];
  let index = 0;
  let autoTimer = null;

  const update = () => {
    if (!slides.length) return;
    track.style.transform = `translateX(-${index * 100}%)`;
    const dots = dotsContainer.querySelectorAll(".carousel__dot");
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
    });
  };

  const goTo = (nextIndex) => {
    if (!slides.length) return;
    index = (nextIndex + slides.length) % slides.length;
    update();
  };

  const startAuto = () => {
    if (autoTimer || slides.length <= 1) return;
    autoTimer = setInterval(() => goTo(index + 1), 5000);
  };

  const stopAuto = () => {
    if (!autoTimer) return;
    clearInterval(autoTimer);
    autoTimer = null;
  };

  const buildDots = () => {
    dotsContainer.innerHTML = "";
    slides.forEach((_, dotIndex) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel__dot";
      dot.addEventListener("click", () => goTo(dotIndex));
      dotsContainer.appendChild(dot);
    });
  };

  const buildSlide = (item) => {
    const figure = document.createElement("figure");
    figure.className = "carousel__slide";

    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.alt;
    img.loading = "lazy";

    const caption = document.createElement("figcaption");
    caption.textContent = item.caption;

    figure.appendChild(img);
    figure.appendChild(caption);
    return figure;
  };

  const renderSlides = (items) => {
    stopAuto();
    track.innerHTML = "";
    items.forEach((item) => track.appendChild(buildSlide(item)));
    slides = Array.from(track.children);
    index = 0;
    buildDots();
    update();
    startAuto();
  };

  const loadSlidesFor = async (key) => {
    const query = galleryQueries[key] || galleryQueries.festival;
    try {
      const data = await fetchJson(`/api/images?query=${encodeURIComponent(query)}&display=8`);
      const items = (data.items || []).slice(0, 8).map((item) => ({
        src: item.image,
        alt: item.title || query,
        caption: item.title || query,
      }));
      if (items.length === 0) {
        renderSlides(fallbackSlides);
        return;
      }
      renderSlides(items);
    } catch (error) {
      renderSlides(fallbackSlides);
    }
  };

  if (prevButton) {
    prevButton.addEventListener("click", () => goTo(index - 1));
  }
  if (nextButton) {
    nextButton.addEventListener("click", () => goTo(index + 1));
  }

  if (tabs.length) {
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((btn) => btn.classList.remove("is-active"));
        tab.classList.add("is-active");
        const key = tab.dataset.galleryTab;
        loadSlidesFor(key);
      });
    });
  }

  carousel.addEventListener("mouseenter", stopAuto);
  carousel.addEventListener("mouseleave", startAuto);
  carousel.addEventListener("focusin", stopAuto);
  carousel.addEventListener("focusout", startAuto);

  loadSlidesFor("festival");
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
  const response = await fetch(apiUrl(url));
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
    latestWeather = data;
    renderTips();
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
    latestWeather = null;
    renderTips();
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
    latestTraffic = data;
    renderTips();
    const trafficMeta = getTrafficBadge(data.durationMin);
    const eta = new Date(Date.now() + data.durationMin * 60000);
    trafficStatus.textContent = `${data.durationMin}분 · ${data.distanceKm}km`;
    if (journeyDuration) {
      journeyDuration.textContent = formatDuration(data.durationMin);
    }
    if (journeyDistance) {
      journeyDistance.textContent = `${data.distanceKm}km 기준`;
    }
    if (journeyEta) {
      journeyEta.textContent = formatTime(eta);
    }
    if (journeySummary) {
      journeySummary.textContent = data.summary || "실시간 빠른 길 기준";
    }
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
    latestTraffic = null;
    renderTips();
    trafficStatus.textContent = "API 키 설정 필요";
    if (journeyDuration) journeyDuration.textContent = "확인 불가";
    if (journeyDistance) journeyDistance.textContent = "거리 확인 불가";
    if (journeyEta) journeyEta.textContent = "확인 불가";
    if (journeySummary) journeySummary.textContent = "교통 API 확인 필요";
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
setupCarousel();
renderTips();
setupMapPreview();
setupYoutubeVideos();
setupVideoSlider();
setupRouteSteps();
setupStageObserver();
setupReveal();
