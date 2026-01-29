const buildStaticMapUrl = ({ startLat, startLon, goalLat, goalLon, level }) => {
  const url = new URL("https://maps.apigw.ntruss.com/map-static/v2/raster");
  const centerLat = (startLat + goalLat) / 2;
  const centerLon = (startLon + goalLon) / 2;
  const mapLevel = Number.isFinite(level) ? level : 9;

  url.searchParams.set("w", "800");
  url.searchParams.set("h", "420");
  url.searchParams.set("center", `${centerLon},${centerLat}`);
  url.searchParams.set("level", String(mapLevel));

  const startPos = `${startLon} ${startLat}`;
  const goalPos = `${goalLon} ${goalLat}`;
  url.searchParams.set("markers", `type:t|size:mid|color:0x1f4b66|pos:${startPos}`);
  url.searchParams.append("markers", `type:t|size:mid|color:0xb24b34|pos:${goalPos}`);

  return url;
};

module.exports = async (req, res) => {
  const clientId = process.env.NAVER_MAPS_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAPS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(400).json({ message: "NAVER_MAPS_CLIENT_ID/SECRET가 필요합니다." });
    return;
  }

  const startLat = Number(req.query.startLat) || 37.5278;
  const startLon = Number(req.query.startLon) || 127.0285;
  const goalLat = Number(req.query.goalLat) || 38.1065;
  const goalLon = Number(req.query.goalLon) || 127.7084;
  const level = Number(req.query.level);
  const url = buildStaticMapUrl({ startLat, startLon, goalLat, goalLon, level });

  try {
    const response = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ message: "지도 API 호출 실패", detail: text });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
    res.status(200).send(buffer);
  } catch (error) {
    res.status(500).json({ message: "지도 API 처리 중 오류", detail: error.message });
  }
};
