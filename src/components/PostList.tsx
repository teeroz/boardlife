"use client";

import { Post } from "@/types/board";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface PostListProps {
  initialPosts: Post[];
}

export default function PostList({ initialPosts }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);

  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 모바일 여부 감지 (useLayoutEffect로 변경)
  useLayoutEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 초기 체크
    checkIsMobile();

    // 화면 크기 변경 시 체크
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

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

  // CSS와 레이아웃 최적화를 위한 스타일
  const globalStyles = `
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
      width: 60px !important;
      min-width: 60px !important;
      max-width: 60px !important;
    }
    /* 레이아웃 시프트 방지를 위한 추가 스타일 */
    .post-container {
      min-height: 500px;
    }
    .post-card {
      min-height: 120px;
    }
  `;

  // 모바일 카드 레이아웃 렌더링
  const renderMobileCards = () => {
    return (
      <div className="grid grid-cols-1 gap-4">
        {posts.map((post: Post) => (
          <div key={post.id} className="bg-white rounded-lg shadow p-4 post-card">
            <div className="flex mb-3">
              {post.thumbnailUrl && (
                <div className="mr-3 flex-shrink-0 w-12 h-12 relative overflow-hidden rounded border border-gray-200 shadow-sm">
                  <Image
                    src={post.thumbnailUrl}
                    alt="게임 썸네일"
                    fill
                    className="rounded"
                    style={{
                      objectFit: "cover",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.parentElement) {
                        target.parentElement.style.display = "none";
                      }
                    }}
                    unoptimized
                  />
                </div>
              )}

              <div className="flex-1">
                <div className="flex flex-col mb-1">
                  <a
                    href={post.link}
                    className={`text-sm sm:text-base font-medium ${
                      visitedLinks.has(post.link)
                        ? "text-gray-400 hover:text-gray-500"
                        : "text-blue-600 hover:text-blue-900"
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick(post.link)}
                  >
                    <span
                      className={`text-xs font-semibold mr-1 ${
                        visitedLinks.has(post.link) ? "text-gray-400" : "text-blue-600"
                      }`}
                    >
                      [{post.category}]
                    </span>
                    {post.title}
                    {post.comments > 0 && <span className="ml-1 text-xs">[{post.comments}]</span>}
                  </a>
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <div>{post.author}</div>
                  <div>{post.createdAt}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2 border-t pt-2">
              <div>👍 {post.likes}</div>
              <div>👁️ {post.views}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 데스크톱용 테이블 레이아웃 렌더링
  const renderDesktopTable = () => {
    return (
      <div className="overflow-x-auto">
        <style jsx global>
          {globalStyles}
        </style>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider thumbnail-column"></th>
              <th className="pl-4 pr-2 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider category-column"></th>
              <th className="pl-0 pr-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <td className="px-6 py-4 whitespace-nowrap text-center thumbnail-column">
                  {post.thumbnailUrl && (
                    <div className="thumbnail-container">
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
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.parentElement) {
                            target.parentElement.style.display = "none";
                          }
                        }}
                        unoptimized
                      />
                    </div>
                  )}
                </td>
                <td className="pl-4 pr-2 py-4 whitespace-nowrap text-center category-column">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {post.category}
                  </span>
                </td>
                <td className="pl-0 pr-6 py-4 whitespace-nowrap">
                  <a
                    href={post.link}
                    className={
                      visitedLinks.has(post.link)
                        ? "text-gray-500 hover:text-gray-600"
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
                  <div className="truncate max-w-[100px] mx-auto">{post.author}</div>
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
      </div>
    );
  };

  return (
    <div className="post-container">
      {mounted && (isMobile ? renderMobileCards() : renderDesktopTable())}
      <div ref={loadingRef} className="py-4 text-center">
        {loading && <div className="text-gray-500">게시물을 불러오는 중...</div>}
      </div>
    </div>
  );
}
