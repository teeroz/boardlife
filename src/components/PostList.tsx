"use client";

import { Post } from "@/types/board";
import { useEffect, useRef, useState } from "react";

interface PostListProps {
  initialPosts: Post[];
}

export default function PostList({ initialPosts }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);

  const loadMorePosts = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const nextPage = currentPage + 1;
      const response = await fetch(`/api/posts?page=${nextPage}`);
      const data = await response.json();

      if (data.posts.length > 0) {
        setPosts((prevPosts) => [...prevPosts, ...data.posts]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error("게시물을 불러오는 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [currentPage, loading]);

  return (
    <div className="overflow-x-auto">
      <style jsx global>{`
        .post-link:visited {
          color: #6b7280 !important;
        }
      `}</style>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              카테고리
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              제목
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              작성자
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              작성일
            </th>
            <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              좋아요
            </th>
            <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              댓글
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {posts.map((post: Post) => (
            <tr key={post.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {post.category}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <a href={post.link} className="post-link text-blue-600 hover:text-blue-900">
                  {post.title}
                  {post.comments > 0 && <span className="ml-2 text-gray-500 text-sm">[{post.comments}]</span>}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.author}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.createdAt}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{post.likes}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{post.comments}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div ref={loadingRef} className="py-4 text-center">
        {loading && <div className="text-gray-500">게시물을 불러오는 중...</div>}
      </div>
    </div>
  );
}
