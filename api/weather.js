const getNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = async (req, res) => {
  const apiKey = process.env.OPENWEATHER_KEY;
  if (!apiKey) {
    res.status(400).json({ message: "OPENWEATHER_KEY가 필요합니다." });
    return;
  }

  const lat = getNumber(req.query.lat, 38.1065);
  const lon = getNumber(req.query.lon, 127.7084);

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "kr");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ message: "날씨 API 호출 실패", detail: text });
      return;
    }
    const data = await response.json();
    const payload = {
      name: data.name,
      description: data.weather?.[0]?.description || "-",
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed ?? 0,
    };
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: "날씨 API 처리 중 오류", detail: error.message });
  }
};
