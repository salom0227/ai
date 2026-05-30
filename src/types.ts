/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'customer' | 'owner' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  avatar: string;
  language: 'en' | 'uz' | 'ru';
  createdAt: string;
}

export type StoreStatus = 'pending' | 'active' | 'suspended';

export interface Store {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  description: string;
  status: StoreStatus;
  commissionRate: number; // e.g. 10 for 10%
  rating?: number;
  followers?: number;
  verified?: boolean;
}

export interface Category {
  id: string;
  name: {
    en: string;
    uz: string;
    ru: string;
  };
  parentId: string | null;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  status: 'active' | 'draft';
  rating?: number;
  salesCount?: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';
export type PaymentStatus = 'unpaid' | 'paid';

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number; // Price when purchased
  productTitle?: string;
  productImage?: string;
  storeId?: string;
}

export interface Review {
  id: string;
  userId: string;
  userFullName?: string;
  userAvatar?: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number; // percentage or absolute amount
}

export interface AIRequest {
  id: string;
  userId: string;
  requestType: 'try_on' | 'size_recommend' | 'stylist' | 'shopping_assistant' | 'description_gen' | 'review_analyze';
  createdAt: string;
  responseData: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

// Client State Definitions
export interface CartItem {
  product: Product;
  quantity: number;
  storeId: string;
}

// Standard Translation Object Schema
export interface Dictionary {
  // Navigation
  products: string;
  stores: string;
  orders: string;
  home: string;
  dashboard: string;
  logout: string;
  login: string;
  register: string;
  aiTools: string;
  cart: string;
  language: string;

  // Search and AI Assistant
  searchPlaceholder: string;
  aiAssistantBtn: string;
  aiAssistantHeading: string;
  trends: string;

  // Product page
  addToCart: string;
  buyNow: string;
  stockText: string;
  reviewsTitle: string;
  writeReview: string;
  relatedProducts: string;

  // AI Features
  tryOnTitle: string;
  tryOnDesc: string;
  sizeRecTitle: string;
  sizeRecDesc: string;
  stylistTitle: string;
  stylistDesc: string;

  // Roles
  customer: string;
  storeOwner: string;
  superAdmin: string;
}
