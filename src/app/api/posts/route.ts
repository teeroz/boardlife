import axios from "axios";
import cheerio from "cheerio";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await axios.get("https://boardlife.co.kr/board/new/전체/1");
    const html = response.data;
    const $ = cheerio.load(html);

    const posts = [];

    // 게시물 목록을 파싱
    $(".board-list-item").each((index, element) => {
      const title = $(element).find(".board-list-title").text().trim();
      const author = $(element).find(".board-list-user").text().trim();
      const date = $(element).find(".board-list-date").text().trim();
      const views = $(element).find(".board-list-hit").text().trim();
      const link = $(element).find("a").attr("href");

      posts.push({
        id: index + 1,
        title,
        author,
        createdAt: date,
        views: parseInt(views) || 0,
        link: `https://boardlife.co.kr${link}`,
      });
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "게시물을 가져오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
