import { Post } from "@/types/board";
import axios from "axios";
import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await axios.get("https://boardlife.co.kr/board/new/전체/1", {
      responseType: "arraybuffer",
      responseEncoding: "binary",
    });

    const html = iconv.decode(Buffer.from(response.data), "euc-kr");
    const $ = cheerio.load(html);

    const posts: Post[] = [];

    // 게시물 목록을 파싱
    $(".board-row").each((index, element) => {
      const $element = $(element);

      const category = $element.find(".category_icon").text().trim();

      // "스폰" 카테고리 제외
      if (category === "스폰") {
        return;
      }

      const title = $element.find(".title.new-ellip").text().trim();
      const author = $element.find(".nick").text().trim();
      const createdAt = $element.find(".time").text().trim();
      const likes = parseInt($element.find(".like .data").text().trim()) || 0;
      const comments = parseInt($element.find(".comment .data").text().trim()) || 0;
      const link = "https://boardlife.co.kr" + $element.attr("href");

      posts.push({
        id: posts.length + 1, // index 대신 posts.length를 사용하여 연속된 번호 부여
        category,
        title,
        author,
        createdAt,
        views: comments, // 실제 조회수 데이터가 없어서 임시로 댓글 수로 대체
        likes,
        comments,
        link,
      });
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "게시물을 가져오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
