const getNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMinutes = (seconds) => Math.round(seconds / 60);
const formatKm = (meters) => Math.round(meters / 1000);

module.exports = async (req, res) => {
  const clientId = process.env.NAVER_MAPS_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAPS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(400).json({ message: "NAVER_MAPS_CLIENT_ID/SECRET가 필요합니다." });
    return;
  }

  const startLat = getNumber(req.query.startLat, 37.5278);
  const startLon = getNumber(req.query.startLon, 127.0285);
  const goalLat = getNumber(req.query.goalLat, 38.1065);
  const goalLon = getNumber(req.query.goalLon, 127.7084);

  const url = new URL(
    "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving"
  );
  url.searchParams.set("start", `${startLon},${startLat}`);
  url.searchParams.set("goal", `${goalLon},${goalLat}`);
  url.searchParams.set("option", "trafast");

  try {
    const response = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ message: "교통 API 호출 실패", detail: text });
      return;
    }

    const data = await response.json();
    const summary = data.route?.trafast?.[0]?.summary;
    if (!summary) {
      res.status(502).json({ message: "교통 API 응답이 비어 있습니다." });
      return;
    }

    res.status(200).json({
      durationMin: formatMinutes(summary.duration),
      distanceKm: formatKm(summary.distance),
      summary: "실시간 빠른 길 기준",
    });
  } catch (error) {
    res.status(500).json({ message: "교통 API 처리 중 오류", detail: error.message });
  }
};
