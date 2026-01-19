import { Post } from "@/types/board";
import axios from "axios";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";

    const response = await axios.get(`https://boardlife.co.kr/board/new/${page}`);
    const $ = cheerio.load(response.data);

    const posts: Post[] = [];

    // 게시물 목록을 파싱
    $(".board-row").each((index, element) => {
      const $element = $(element);

      const category = $element.find(".category_icon").text().trim();

      // "스폰", "영상" 카테고리 제외
      if (category === "스폰" || category === "영상" || category === "모임") {
        return;
      }

      const title = $element.find(".title.new-ellip").text().trim();
      const author = $element.find(".nick").text().trim();
      const createdAt = $element.find(".time").text().trim();
      const likes = parseInt($element.find(".like .data").text().trim().replace(/,/g, "")) || 0;
      const comments = parseInt($element.find(".comment-count").text().trim().replace(/[\[\]]/g, "").replace(/,/g, "")) || 0;
      const link = "https://boardlife.co.kr" + $element.attr("href")?.replace(/&pg=\d+/, "");

      // 썸네일 이미지 URL 추출
      let thumbnailUrl = "";
      const thumbImg = $element.find(".board-game-thumb img");
      if (thumbImg.length > 0) {
        thumbnailUrl = thumbImg.attr("data-src") || thumbImg.attr("src") || "";
        // 상대 경로인 경우 절대 경로로 변환
        if (thumbnailUrl && !thumbnailUrl.startsWith("http")) {
          thumbnailUrl = "https://boardlife.co.kr" + thumbnailUrl;
        }
      }

      posts.push({
        id: `${page}-${posts.length + 1}`,
        category,
        title,
        author,
        createdAt,
        views: 0,
        likes,
        comments,
        link,
        thumbnailUrl,
      });
    });

    return NextResponse.json({
      posts,
      page: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "게시물을 가져오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
