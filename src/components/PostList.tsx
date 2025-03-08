"use client";

import { Post } from "@/types/board";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface PostListProps {
  initialPosts: Post[];
}

export default function PostList({ initialPosts }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(new Set());
  const loadingRef = useRef<HTMLDivElement>(null);

  // 방문한 링크 로드
  useEffect(() => {
    try {
      const savedVisitedLinks = localStorage.getItem("boardlife-visited-links");
      if (savedVisitedLinks) {
        setVisitedLinks(new Set(JSON.parse(savedVisitedLinks)));
      }
    } catch (error) {
      console.error("방문 기록을 불러오는 중 오류 발생:", error);
    }
  }, []);

  // 링크 클릭 핸들러
  const handleLinkClick = useCallback(
    (link: string) => {
      try {
        const newVisitedLinks = new Set(visitedLinks);
        newVisitedLinks.add(link);
        setVisitedLinks(newVisitedLinks);
        localStorage.setItem("boardlife-visited-links", JSON.stringify(Array.from(newVisitedLinks)));
      } catch (error) {
        console.error("방문 기록을 저장하는 중 오류 발생:", error);
      }
    },
    [visitedLinks]
  );

  const loadMorePosts = useCallback(async () => {
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
  }, [currentPage, loading]);

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
  }, [loadMorePosts]);

  return (
    <div className="overflow-x-auto">
      <style jsx global>{`
        .post-link:visited {
          color: #6b7280 !important;
        }
        .thumbnail-column {
          width: 65px !important;
          min-width: 65px !important;
          max-width: 65px !important;
        }
        .thumbnail-img {
          width: 45px !important;
          height: 45px !important;
          max-width: 45px !important;
          max-height: 45px !important;
          min-width: 45px !important;
          min-height: 45px !important;
          object-fit: cover !important;
          display: block !important;
          margin: 0 auto !important;
        }
        .post-row {
          height: 70px !important;
        }
        .thumbnail-container {
          width: 45px;
          height: 45px;
          margin: 0 auto;
          display: block;
          position: relative;
          overflow: hidden;
        }
        .author-column {
          width: 100px !important;
          max-width: 100px !important;
        }
        .date-column {
          width: 100px !important;
          max-width: 100px !important;
        }
        .number-column {
          width: 70px !important;
          max-width: 70px !important;
        }
        .category-column {
          width: 80px !important;
          max-width: 80px !important;
        }
      `}</style>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider category-column"></th>
            <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider thumbnail-column"></th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              제목
            </th>
            <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider author-column">
              작성자
            </th>
            <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider date-column">
              작성일
            </th>
            <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider number-column">
              LIKE
            </th>
            <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider number-column">
              READ
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {posts.map((post: Post) => (
            <tr key={post.id} className="hover:bg-gray-50 post-row">
              <td className="px-6 py-4 whitespace-nowrap category-column">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {post.category}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center thumbnail-column">
                <div className="thumbnail-container">
                  {post.thumbnailUrl ? (
                    <Image
                      src={post.thumbnailUrl}
                      alt="게임 썸네일"
                      width={45}
                      height={45}
                      className="rounded border border-gray-200 shadow-sm thumbnail-img"
                      style={{
                        objectFit: "cover",
                        width: "45px",
                        height: "45px",
                      }}
                      onError={() => {
                        const img = document.querySelector(
                          `img[alt="게임 썸네일"][src="${post.thumbnailUrl}"]`
                        ) as HTMLImageElement;
                        if (img) img.style.display = "none";
                      }}
                      unoptimized
                    />
                  ) : (
                    <div className="thumbnail-img rounded border border-gray-200 bg-gray-100"></div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <a
                  href={post.link}
                  className={
                    visitedLinks.has(post.link)
                      ? "text-gray-500 hover:text-gray-700"
                      : "text-blue-600 hover:text-blue-900"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick(post.link)}
                >
                  {post.title}
                  {post.comments > 0 && <span className="ml-2 text-sm">[{post.comments}]</span>}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center author-column">
                {post.author}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center date-column">
                {post.createdAt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center number-column">
                {post.likes}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center number-column">
                {post.views}
              </td>
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
