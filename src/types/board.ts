export interface Post {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  views: number;
  link: string;
}

export interface BoardListResponse {
  posts: Post[];
}
