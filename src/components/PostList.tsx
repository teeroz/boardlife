"use client";

import { Post } from "@/types/board";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface PostListProps {
  initialPosts: Post[];
}

export default function PostList({ initialPosts }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(new Set());
  const [lastVisitedLink, setLastVisitedLink] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [findingLastVisited, setFindingLastVisited] = useState(false);
  const [pagesLoaded, setPagesLoaded] = useState(0);
  const loadingRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Map<string, HTMLElement>>(new Map());

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

  // 방문한 링크와 마지막 방문 링크 로드
  useEffect(() => {
    try {
      const savedVisitedLinks = localStorage.getItem("boardlife-visited-links");
      if (savedVisitedLinks) {
        setVisitedLinks(new Set(JSON.parse(savedVisitedLinks)));
      }

      const lastVisited = localStorage.getItem("boardlife-last-visited");
      if (lastVisited) {
        setLastVisitedLink(lastVisited);
      }
    } catch (error) {
      console.error("방문 기록을 불러오는 중 오류 발생:", error);
    }
  }, []);

  // 링크 클릭 핸들러
  const handleLinkClick = useCallback(
    (link: string) => {
      try {
        // 방문한 링크 저장
        const newVisitedLinks = new Set(visitedLinks);
        newVisitedLinks.add(link);
        setVisitedLinks(newVisitedLinks);
        localStorage.setItem("boardlife-visited-links", JSON.stringify(Array.from(newVisitedLinks)));

        // 마지막 방문 링크 저장
        setLastVisitedLink(link);
        localStorage.setItem("boardlife-last-visited", link);
      } catch (error) {
        console.error("방문 기록을 저장하는 중 오류 발생:", error);
      }
    },
    [visitedLinks]
  );

  // 게시물 로드 함수
  const loadMorePosts = useCallback(
    async (specificPage?: number) => {
      if (loading) return { hasMore: false, newPosts: [] };

      try {
        setLoading(true);
        const nextPage = specificPage || currentPage + 1;
        const response = await fetch(`/api/posts?page=${nextPage}`);
        const data = await response.json();

        if (data.posts.length > 0) {
          setPosts((prevPosts) => [...prevPosts, ...data.posts]);
          setCurrentPage(nextPage);
          return {
            hasMore: data.posts.length > 0,
            newPosts: data.posts,
          };
        }
        return { hasMore: false, newPosts: [] };
      } catch (error) {
        console.error("게시물을 불러오는 중 오류가 발생했습니다:", error);
        return { hasMore: false, newPosts: [] };
      } finally {
        setLoading(false);
      }
    },
    [currentPage, loading]
  );

  // 무한 스크롤 구현
  useEffect(() => {
    if (findingLastVisited) return; // 마지막 방문글 찾는 중이면 무한 스크롤은 일시 중지

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
  }, [loadMorePosts, findingLastVisited]);

  // 마지막 방문 게시물로 이동하는 함수
  const scrollToLastVisited = useCallback(async () => {
    if (!lastVisitedLink) return;

    setFindingLastVisited(true);
    setPagesLoaded(0);

    // 현재 로드된 게시물 중에서 마지막 방문 게시물 찾기
    const findPostInList = (postList: Post[]) => {
      return postList.find((post) => post.link === lastVisitedLink);
    };

    // 이미 로드된 게시물에서 먼저 찾기
    let foundPost = findPostInList(posts);
    if (foundPost) {
      // 이미 찾았다면 바로 해당 위치로 스크롤
      setTimeout(() => {
        const postElement = postRefs.current.get(lastVisitedLink);
        if (postElement) {
          postElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      setFindingLastVisited(false);
      return;
    }

    // 찾지 못했다면 최대 30페이지까지 추가 로드하며 찾기
    let loadCount = 0;
    let pageToLoad = currentPage + 1; // 현재 페이지 이후부터 로드
    let allLoadedPosts = [...posts]; // 지금까지 불러온 모든 게시물

    while (!foundPost && loadCount < 30) {
      const result = await loadMorePosts(pageToLoad);
      loadCount++;
      pageToLoad++; // 다음 페이지로 증가
      setPagesLoaded(loadCount);

      if (!result.hasMore || result.newPosts.length === 0) break; // 더 이상 로드할 게시물이 없으면 중단

      // 새로 로드된 페이지의 마지막 게시물로 스크롤
      if (result.newPosts.length > 0) {
        // State 업데이트가 반영될 때까지 잠시 대기
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 새로 로드된 마지막 게시물로 스크롤
        const lastNewPost = result.newPosts[result.newPosts.length - 1];
        const lastPostElement = document.querySelector(`[data-post-id="${lastNewPost.id}"]`);
        if (lastPostElement) {
          lastPostElement.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }

      // 새로 로드된 게시물 배열에서 찾기
      foundPost = findPostInList(result.newPosts);

      // 찾은 경우 해당 게시물의 element 참조 기다리기
      if (foundPost) {
        // state 업데이트 및 렌더링을 기다리기 위한 짧은 지연
        await new Promise((resolve) => setTimeout(resolve, 300));
        break;
      }

      // 모든 로드된 게시물 업데이트
      allLoadedPosts = [...allLoadedPosts, ...result.newPosts];
    }

    // 게시물을 찾았다면 해당 위치로 스크롤
    if (foundPost) {
      // 약간의 시간을 주어 DOM에 요소가 생성되도록 함
      setTimeout(() => {
        const postElement = postRefs.current.get(lastVisitedLink);
        if (postElement) {
          postElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }

    setFindingLastVisited(false);
  }, [lastVisitedLink, posts, loadMorePosts, currentPage]);

  // 게시물 참조 등록 함수
  const registerPostRef = useCallback((link: string, element: HTMLElement | null) => {
    if (element) {
      postRefs.current.set(link, element);
    }
  }, []);

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
    .last-visited-button {
      background-color: #4B5563;
      color: white;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }
    .last-visited-button:hover {
      background-color: #374151;
    }
    .header-container {
      display: flex;
      justify-content: flex-end !important;
      align-items: center;
      margin-bottom: 1rem;
      width: 100%;
    }
    
    /* 모바일 스타일 */
    @media (max-width: 767px) {
      .last-visited-button {
        background-color: #e11d48;
        color: white;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        box-shadow: 0 4px 6px rgba(225, 29, 72, 0.25);
        text-align: center;
        position: relative;
        overflow: hidden;
        right: 0;
        margin-left: auto !important;
      }
      
      .last-visited-button::after {
        content: '→';
        margin-left: 5px;
        font-weight: bold;
      }
      
      .last-visited-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
        pointer-events: none;
      }
      
      .last-visited-button:active {
        transform: translateY(1px);
        box-shadow: 0 2px 3px rgba(225, 29, 72, 0.2);
      }
      
      .header-container {
        padding-right: 0.5rem;
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
        justify-content: flex-end !important;
        align-items: flex-end !important;
        flex-direction: row !important;
      }
    }
  `;

  // 숫자 형식화 함수 - K, M 형식으로 변경
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return num.toString();
  };

  // 모바일 카드 레이아웃 렌더링
  const renderMobileCards = () => {
    return (
      <div className="grid grid-cols-1 gap-4">
        {posts.map((post: Post) => {
          const isLastVisited = post.link === lastVisitedLink;
          return (
            <div
              key={post.id}
              className={`bg-white rounded-lg shadow p-4 post-card ${
                isLastVisited ? "border-l-4 border-red-500 bg-red-50" : ""
              }`}
              ref={(el) => registerPostRef(post.link, el)}
              data-post-id={post.id}
            >
              <div className="flex mb-3">
                {post.thumbnailUrl && (
                  <div className="mr-3 flex-shrink-0 w-12 h-12 relative overflow-hidden rounded border border-gray-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.thumbnailUrl}
                      alt="게임 썸네일"
                      className="rounded absolute top-0 left-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.parentElement) {
                          target.parentElement.style.display = "none";
                        }
                      }}
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
                          : isLastVisited
                          ? "text-red-600 hover:text-red-700 font-bold"
                          : "text-blue-600 hover:text-blue-900"
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleLinkClick(post.link)}
                    >
                      <span
                        className={`text-xs font-semibold mr-1 ${
                          visitedLinks.has(post.link)
                            ? "text-gray-400"
                            : isLastVisited
                            ? "text-red-600"
                            : "text-blue-600"
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
                <div>👍 {formatNumber(post.likes)}</div>
                <div>👁️ {formatNumber(post.views)}</div>
              </div>
            </div>
          );
        })}
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
              <th className="px-2 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider thumbnail-column"></th>
              <th className="pl-0 pr-2 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider category-column"></th>
              <th className="pl-0 pr-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제목
              </th>
              <th className="px-0 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider author-column">
                작성자
              </th>
              <th className="px-0 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider date-column">
                작성일
              </th>
              <th className="px-0 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider number-column">
                LIKE
              </th>
              <th className="px-0 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider number-column">
                READ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((post: Post) => {
              const isLastVisited = post.link === lastVisitedLink;
              return (
                <tr
                  key={post.id}
                  className={`hover:bg-gray-50 post-row ${isLastVisited ? "border-l-4 border-red-500 bg-red-50" : ""}`}
                  ref={(el) => registerPostRef(post.link, el)}
                  data-post-id={post.id}
                >
                  <td className="px-2 py-4 whitespace-nowrap text-center thumbnail-column">
                    {post.thumbnailUrl && (
                      <div className="thumbnail-container">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
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
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.parentElement) {
                              target.parentElement.style.display = "none";
                            }
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="pl-0 pr-2 py-4 whitespace-nowrap text-center category-column">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.category === "자게"
                          ? "bg-red-200 text-red-900"
                          : post.category === "문의"
                          ? "bg-purple-200 text-purple-900"
                          : post.category === "후기"
                          ? "bg-blue-200 text-blue-900"
                          : post.category === "자료"
                          ? "bg-green-200 text-green-900"
                          : post.category === "꿀팁"
                          ? "bg-indigo-100 text-indigo-800"
                          : post.category === "모임"
                          ? "bg-orange-100 text-orange-800"
                          : post.category === "구인"
                          ? "bg-teal-100 text-teal-800"
                          : post.category === "구성"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {post.category}
                    </span>
                  </td>
                  <td className="pl-0 pr-6 py-4 whitespace-nowrap">
                    <a
                      href={post.link}
                      className={`${
                        visitedLinks.has(post.link)
                          ? "text-gray-500 hover:text-gray-600"
                          : isLastVisited
                          ? "text-red-600 hover:text-red-700 font-bold"
                          : "text-blue-600 hover:text-blue-900"
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleLinkClick(post.link)}
                    >
                      {post.title}
                      {post.comments > 0 && <span className="ml-2 text-sm">[{post.comments}]</span>}
                    </a>
                  </td>
                  <td className="px-0 py-4 whitespace-nowrap text-sm text-gray-500 text-center author-column">
                    <div className="truncate max-w-[100px] mx-auto">{post.author}</div>
                  </td>
                  <td className="px-0 py-4 whitespace-nowrap text-sm text-gray-500 text-center date-column">
                    {post.createdAt}
                  </td>
                  <td className="px-0 py-4 whitespace-nowrap text-sm text-gray-500 text-center number-column">
                    {formatNumber(post.likes)}
                  </td>
                  <td className="px-0 py-4 whitespace-nowrap text-sm text-gray-500 text-center number-column">
                    {formatNumber(post.views)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const MobileButton = () => {
    if (!lastVisitedLink || findingLastVisited) return null;

    return (
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button className="last-visited-button" onClick={scrollToLastVisited} aria-label="마지막 방문글로 이동">
          마지막 방문글
        </button>
      </div>
    );
  };

  return (
    <div className="post-container">
      {isMobile ? (
        <MobileButton />
      ) : (
        <div className="header-container">
          {lastVisitedLink && !findingLastVisited && (
            <button className="last-visited-button" onClick={scrollToLastVisited} aria-label="마지막 방문글로 이동">
              마지막 방문글로 이동
            </button>
          )}
        </div>
      )}

      {mounted && (isMobile ? renderMobileCards() : renderDesktopTable())}
      <div ref={loadingRef} className="py-4 text-center">
        {loading && (
          <div className="text-gray-500">
            {findingLastVisited
              ? `마지막 방문글 찾는 중... (${pagesLoaded}/30 페이지 로드됨)`
              : "게시물을 불러오는 중..."}
          </div>
        )}
      </div>
    </div>
  );
}
