import PostList from "@/components/PostList";
import "dayjs/locale/ko";

async function getPosts() {
  // 서버 컴포넌트에서는 절대 URL을 사용해야 함
  let baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // 개발 환경에서는 기본 URL 설정
  if (!baseUrl) {
    baseUrl = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://boardlife.teeroz.net";
  }

  // URL에 마지막 슬래시가 있다면 제거
  baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  // 절대 URL 생성
  const apiUrl = `${baseUrl}/api/posts`;

  const response = await fetch(apiUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("게시물을 가져오는데 실패했습니다.");
  }
  return response.json();
}

export default async function PostsPage() {
  const { posts } = await getPosts();

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-3 py-4 sm:px-4 sm:py-5 md:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-8">보드라이프 게시판</h1>
            <PostList initialPosts={posts} />
          </div>
        </div>
      </div>
    </div>
  );
}
