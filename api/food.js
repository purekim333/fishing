const getNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapPlaces = (documents) =>
  documents.map((place) => ({
    name: place.place_name,
    distanceKm: Math.max(1, Math.round(Number(place.distance) / 1000)),
    address: place.road_address_name || place.address_name,
  }));

const searchPlaces = async ({ query, lat, lon, apiKey }) => {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("x", String(lon));
  url.searchParams.set("y", String(lat));
  url.searchParams.set("radius", "20000");
  url.searchParams.set("size", "5");

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  const data = await response.json();
  return mapPlaces(data.documents || []);
};

module.exports = async (req, res) => {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  const hasKey = apiKey && !apiKey.includes("YOUR_KAKAO_REST_API_KEY");
  if (!hasKey) {
    res.status(200).json({
      restAreas: [],
      restaurants: [],
      note: "카카오 로컬 API 미사용",
    });
    return;
  }

  const lat = getNumber(req.query.lat, 38.1065);
  const lon = getNumber(req.query.lon, 127.7084);

  try {
    const [restAreas, restaurants] = await Promise.all([
      searchPlaces({ query: "휴게소", lat, lon, apiKey }),
      searchPlaces({ query: "맛집", lat, lon, apiKey }),
    ]);

    res.status(200).json({ restAreas, restaurants });
  } catch (error) {
    res.status(500).json({ message: "맛집/휴게소 API 처리 중 오류", detail: error.message });
  }
};
