export interface Post {
  id: number;
  category: string;
  title: string;
  author: string;
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  link: string;
}

export interface BoardListResponse {
  posts: Post[];
}
