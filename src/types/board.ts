export interface Post {
  id: string;
  category: string;
  title: string;
  author: string;
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  link: string;
  thumbnailUrl: string;
}

export interface BoardListResponse {
  posts: Post[];
  page: number;
}
