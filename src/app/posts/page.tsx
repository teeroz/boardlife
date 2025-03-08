import PostList from "@/components/PostList";
import "dayjs/locale/ko";

async function getPosts() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const response = await fetch(`${apiUrl}/api/posts`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("게시물을 가져오는데 실패했습니다.");
  }
  return response.json();
}

export default async function PostsPage() {
  const { posts } = await getPosts();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">보드라이프 게시판</h1>
            <PostList initialPosts={posts} />
          </div>
        </div>
      </div>
    </div>
  );
}
