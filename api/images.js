const buildImageSearchUrl = ({ query, display }) => {
  const url = new URL("https://openapi.naver.com/v1/search/image");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(display));
  url.searchParams.set("sort", "sim");
  return url;
};

const fallbackImages = [
  {
    image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=600&q=80",
    title: "겨울 축제",
  },
  {
    image: "https://images.unsplash.com/photo-1452723312111-3a7d0db0e024?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1452723312111-3a7d0db0e024?auto=format&fit=crop&w=600&q=80",
    title: "얼음낚시",
  },
  {
    image: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=600&q=80",
    title: "보온 준비",
  },
  {
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80",
    thumbnail: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=600&q=80",
    title: "화천 겨울",
  },
];

module.exports = async (req, res) => {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  const query = req.query.query || "화천 산천어 축제";
  const display = Number(req.query.display) || 8;

  if (!clientId || !clientSecret) {
    res.status(200).json({ items: fallbackImages, note: "NAVER_SEARCH_CLIENT_ID/SECRET 필요" });
    return;
  }

  try {
    const url = buildImageSearchUrl({ query, display });
    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ message: "이미지 API 호출 실패", detail: text });
      return;
    }

    const data = await response.json();
    const items = (data.items || []).map((item) => ({
      image: item.link,
      thumbnail: item.thumbnail,
      title: item.title?.replace(/<[^>]+>/g, "") || "",
    }));
    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ message: "이미지 API 처리 중 오류", detail: error.message });
  }
};
