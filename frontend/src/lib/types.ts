/**
 * Type definitions for WebStar V1
 */

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  onboarding_completed: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface OnboardingStatus {
  archetype: string | null;
  role: string | null;
  expertise_level: string | null;
  completed: boolean;
  completed_at: string | null;
}

export interface Profile {
  id: number;
  user_id: number;
  username: string;
  display_name: string | null;
  role: string | null;
  expertise_badge: string | null;
  bio: string | null;  // Short bio below profile picture
  about: string | null;  // Detailed about section
  profile_picture: string | null;
  banner_image: string | null;
  location: string | null;
  skills: string | null;
  experience: string | null; // JSON string
  social_links: string | null; // JSON string
  website: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  instagram_url: string | null;
  behance_url: string | null;
  soundcloud_url: string | null;
  profile_likes_count: number;
  profile_views_count: number;
  portfolio_items_count: number;
  projects_count: number;
  total_points: number;
  has_profile_picture: boolean;
  has_about: boolean;
  has_skills: boolean;
  profile_completeness: number;
}

export interface PortfolioItem {
  id: number;
  user_id: number;
  content_type: string;
  content_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  aspect_ratio: string | null;
  views: number;
  clicks: number;
  order: number;
  created_at: string;
}

export interface Project {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  cover_image: string | null;
  tags: string | null;
  tools: string | null;
  project_url: string | null;
  views: number;
  clicks: number;
  order: number;
  media_count: number;
  created_at: string;
}

export interface ProjectMedia {
  id: number;
  project_id: number;
  media_url: string;
  media_type: string;
  thumbnail_url: string | null;
  order: number;
  created_at: string;
}

export interface PointsBalance {
  total_points: number;
  available_points: number;
}

export interface PointsTransaction {
  id: number;
  points: number;
  action: string;
  description: string | null;
  created_at: string;
}

export interface PointsHistory {
  balance: PointsBalance;
  transactions: PointsTransaction[];
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  available: boolean;
}

export interface ProfileMetrics {
  profile_views_7d: number;
  profile_views_30d: number;
  profile_likes: number;
  portfolio_views: number;
  portfolio_clicks: number;
  project_views: number;
  project_clicks: number;
}

