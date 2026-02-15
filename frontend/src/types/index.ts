export interface Badge {
  badgeKey: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'contributor' | 'moderator' | 'admin';
  bio: string;
  avatar: string | null;
  location: string;
  points: number;
  contributionCount: number;
  dateJoined: string;
  badges?: Badge[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  assetCount: number;
}

export interface AssetImage {
  id: number;
  image: string;
  caption: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface Asset {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: Category;
  categoryName?: string;
  categorySlug?: string;
  latitude: number;
  longitude: number;
  address: string;
  postcode: string;
  website: string;
  phone: string;
  openingHours: Record<string, string>;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  featured: boolean;
  images: AssetImage[];
  primaryImage?: AssetImage;
  status?: 'pending' | 'approved' | 'rejected';
  submittedByUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  asset: number;
  assetSlug?: string;
  assetTitle?: string;
  user: number;
  username: string;
  userAvatar: string | null;
  rating: number;
  title: string;
  content: string;
  visitDate: string | null;
  helpfulCount: number;
  hasVotedHelpful: boolean;
  pointsAwarded?: number;
  badgesAwarded?: string[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  passwordConfirm: string;
  firstName?: string;
  lastName?: string;
}

/** Asset as returned by my_submissions (includes status). */
export interface AssetWithStatus extends Asset {
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AssetCreateData {
  title: string;
  description: string;
  category: number;
  latitude: number;
  longitude: number;
  address?: string;
  postcode?: string;
  website?: string;
  phone?: string;
}
