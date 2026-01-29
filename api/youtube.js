const buildYoutubeSearchUrl = ({ query, maxResults, apiKey }) => {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("safeSearch", "moderate");
  url.searchParams.set("regionCode", "KR");
  url.searchParams.set("key", apiKey);
  return url;
};

module.exports = async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const query = req.query.query || "화천 산천어 축제";
  const maxResults = Number(req.query.maxResults) || 6;

  if (!apiKey) {
    res.status(200).json({
      items: [],
      note: "YOUTUBE_API_KEY 필요",
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    });
    return;
  }

  try {
    const url = buildYoutubeSearchUrl({ query, maxResults, apiKey });
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ message: "유튜브 API 호출 실패", detail: text });
      return;
    }

    const data = await response.json();
    const items = (data.items || []).map((item) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
      channel: item.snippet?.channelTitle,
    }));
    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ message: "유튜브 API 처리 중 오류", detail: error.message });
  }
};
