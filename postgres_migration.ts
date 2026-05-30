/**
 * PostgreSQL Database Migration & Integration Script
 * This script exports the current local JSON database state (db.json) into robust,
 * transactional PostgreSQL DDL (Data Definition Language) and seeding queries.
 * 
 * Includes table constraints, optimal indices, multi-tenant vendor relations, 
 * cascade deletes, and relational normalization.
 */

import fs from "fs";
import path from "path";

// Main SQL DDL Generation
export function generatePostgresSchema(): string {
  return `-- =========================================================================
-- AI MALL HIGH-END MULTI-VENDOR MARKETPLACE - POSTGRESQL DATABASE SCHEMA
-- Generated automatically: ${new Date().toISOString()}
-- Target Engine: PostgreSQL 12 or higher
-- =========================================================================

-- Enable UUID extension for high security distributed keys if required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean previous schemas securely if migration is re-run (Strict Isolation mode)
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS ai_requests CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS stores CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS coupons CASCADE;

-- 1. USERS TABLE (Supports auth, multi-role central authorization)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password VARCHAR(255) NOT NULL, -- Encrypted hash space
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'owner', 'admin')),
    avatar VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'uz', 'ru')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexing for instant auth & lookup optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. STORES TABLE (Multi-tenant luxury merchant stores)
CREATE TABLE IF NOT EXISTS stores (
    id VARCHAR(100) PRIMARY KEY,
    owner_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(150) UNIQUE NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    logo VARCHAR(500),
    banner VARCHAR(500),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    commission_rate NUMERIC(5, 2) DEFAULT 10.00 CHECK (commission_rate BETWEEN 0 AND 100),
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating BETWEEN 1 AND 5),
    followers INT DEFAULT 0 CHECK (followers >= 0),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);

-- 3. CATEGORIES TABLE (Hierarchical taxonomy architecture)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(100) PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_uz VARCHAR(100) NOT NULL,
    name_ru VARCHAR(100) NOT NULL,
    parent_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. PRODUCTS TABLE (Item stock management with numeric decimals)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    store_id VARCHAR(100) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    images TEXT[] NOT NULL DEFAULT '{}', -- PostgreSQL text array for multi-images
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft')),
    rating NUMERIC(3, 2) DEFAULT 5.00,
    sales_count INT DEFAULT 0 CHECK (sales_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- 5. ORDERS TABLE (Unified order head unit)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- 6. ORDER ITEMS TABLE (Relational join breakdown)
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0), -- Captured price at order transaction time
    product_title VARCHAR(255),
    product_image VARCHAR(500),
    store_id VARCHAR(100) REFERENCES stores(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 7. REVIEWS TABLE (Buyer feedback & semantic mapping space)
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_full_name VARCHAR(150),
    user_avatar VARCHAR(500),
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- 8. COUPONS TABLE (Vouchers codes)
CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount NUMERIC(5, 2) NOT NULL CHECK (discount BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- 9. AI REQUESTS TABLE (System audit trail logs for try-ons and stylists)
CREATE TABLE IF NOT EXISTS ai_requests (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    response_data TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_user ON ai_requests(user_id);

-- 10. NOTIFICATIONS TABLE (Live dashboard notification events alerts)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
`;
}

// Function to generate full SQL insert insert scripts based on raw db JSON structure
export function generatePostgresSeeding(dbState: any): string {
  let seedingSql = `-- =========================================================================
-- DATA SEEDING TRANSFORMATION FOR ACTIVE MARKETPLACE INVENTORY
-- Converts current db.json state into clean standard SQL INSERT statements
-- =========================================================================

BEGIN; -- Start Transaction block to secure consistency

`;

  // 1. Seed Users
  if (dbState.users && dbState.users.length > 0) {
    seedingSql += `-- Seed Users (${dbState.users.length} records)\n`;
    dbState.users.forEach((u: any) => {
      const pswd = u.password || "customer";
      seedingSql += `INSERT INTO users (id, full_name, email, phone, password, role, avatar, language, created_at) 
VALUES (${sqlVal(u.id)}, ${sqlVal(u.fullName)}, ${sqlVal(u.email)}, ${sqlVal(u.phone)}, ${sqlVal(pswd)}, ${sqlVal(u.role)}, ${sqlVal(u.avatar)}, ${sqlVal(u.language)}, ${sqlVal(u.createdAt)})
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, phone = EXCLUDED.phone, avatar = EXCLUDED.avatar;\n`;
    });
    seedingSql += "\n";
  }

  // 2. Seed Stores
  if (dbState.stores && dbState.stores.length > 0) {
    seedingSql += `-- Seed Stores (${dbState.stores.length} records)\n`;
    dbState.stores.forEach((s: any) => {
      seedingSql += `INSERT INTO stores (id, owner_id, name, slug, logo, banner, description, status, commission_rate, rating, followers, verified)
VALUES (${sqlVal(s.id)}, ${sqlVal(s.ownerId)}, ${sqlVal(s.name)}, ${sqlVal(s.slug)}, ${sqlVal(s.logo)}, ${sqlVal(s.banner)}, ${sqlVal(s.description)}, ${sqlVal(s.status)}, ${s.commissionRate || 10.00}, ${s.rating || 5.00}, ${s.followers || 0}, ${s.verified ? "TRUE" : "FALSE"})
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;\n`;
    });
    seedingSql += "\n";
  }

  // 3. Seed Categories
  if (dbState.categories && dbState.categories.length > 0) {
    seedingSql += `-- Seed Categories (${dbState.categories.length} records)\n`;
    dbState.categories.forEach((c: any) => {
      const enName = c.name?.en || c.name || "Category";
      const uzName = c.name?.uz || c.name || "Kategoriya";
      const ruName = c.name?.ru || c.name || "Категория";
      seedingSql += `INSERT INTO categories (id, name_en, name_uz, name_ru, parent_id)
VALUES (${sqlVal(c.id)}, ${sqlVal(enName)}, ${sqlVal(uzName)}, ${sqlVal(ruName)}, ${sqlVal(c.parentId)})
ON CONFLICT (id) DO NOTHING;\n`;
    });
    seedingSql += "\n";
  }

  // 4. Seed Products
  if (dbState.products && dbState.products.length > 0) {
    seedingSql += `-- Seed Products (${dbState.products.length} records)\n`;
    dbState.products.forEach((p: any) => {
      // Postgres Array Formatting: '{ "url1", "url2" }'
      const formattedImagesArray = "ARRAY[" + p.images.map((img: string) => sqlVal(img)).join(", ") + "]";
      seedingSql += `INSERT INTO products (id, store_id, category_id, title, description, price, stock, images, status, rating, sales_count)
VALUES (${sqlVal(p.id)}, ${sqlVal(p.storeId)}, ${sqlVal(p.categoryId)}, ${sqlVal(p.title)}, ${sqlVal(p.description)}, ${p.price}, ${p.stock}, ${formattedImagesArray}, 'active', ${p.rating || 5.00}, ${p.salesCount || 0})
ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock, price = EXCLUDED.price;\n`;
    });
    seedingSql += "\n";
  }

  // 5. Seed Orders
  if (dbState.orders && dbState.orders.length > 0) {
    seedingSql += `-- Seed Orders (${dbState.orders.length} records)\n`;
    dbState.orders.forEach((o: any) => {
      seedingSql += `INSERT INTO orders (id, user_id, total_amount, payment_status, order_status, created_at)
VALUES (${sqlVal(o.id)}, ${sqlVal(o.userId)}, ${o.totalAmount}, ${sqlVal(o.paymentStatus)}, ${sqlVal(o.orderStatus)}, ${sqlVal(o.createdAt)})
ON CONFLICT (id) DO NOTHING;\n`;
    });
    seedingSql += "\n";
  }

  // 6. Seed Order Items
  if (dbState.orderItems && dbState.orderItems.length > 0) {
    seedingSql += `-- Seed Order Items (${dbState.orderItems.length} records)\n`;
    dbState.orderItems.forEach((oi: any) => {
      seedingSql += `INSERT INTO order_items (id, order_id, product_id, quantity, price, product_title, product_image, store_id)
VALUES (${sqlVal(oi.id)}, ${sqlVal(oi.orderId)}, ${sqlVal(oi.productId)}, ${oi.quantity}, ${oi.price}, ${sqlVal(oi.productTitle)}, ${sqlVal(oi.productImage)}, ${sqlVal(oi.storeId)})
ON CONFLICT (id) DO NOTHING;\n`;
    });
    seedingSql += "\n";
  }

  // 7. Seed Reviews
  if (dbState.reviews && dbState.reviews.length > 0) {
    seedingSql += `-- Seed Reviews (${dbState.reviews.length} records)\n`;
    dbState.reviews.forEach((r: any) => {
      seedingSql += `INSERT INTO reviews (id, user_id, user_full_name, user_avatar, product_id, rating, comment, created_at)
VALUES (${sqlVal(r.id)}, ${sqlVal(r.userId || "customer-1")}, ${sqlVal(r.userFullName)}, ${sqlVal(r.userAvatar)}, ${sqlVal(r.productId)}, ${r.rating}, ${sqlVal(r.comment)}, ${sqlVal(r.createdAt)})
ON CONFLICT (id) DO NOTHING;\n`;
    });
    seedingSql += "\n";
  }

  // 8. Seed Coupons
  if (dbState.coupons && dbState.coupons.length > 0) {
    seedingSql += `-- Seed Coupons (${dbState.coupons.length} records)\n`;
    dbState.coupons.forEach((c: any) => {
      seedingSql += `INSERT INTO coupons (id, code, discount)
VALUES (${sqlVal(c.id)}, ${sqlVal(c.code)}, ${c.discount})
ON CONFLICT (id) DO UPDATE SET discount = EXCLUDED.discount;\n`;
    });
    seedingSql += "\n";
  }

  seedingSql += `
COMMIT; -- Save and apply changes completely and atomically
`;
  return seedingSql;
}

// Helpers
function sqlVal(val: any): string {
  if (val === undefined || val === null) {
    return "NULL";
  }
  if (typeof val === "string") {
    // Escape single quotes for SQL insertion safety
    return `'${val.replace(/'/g, "''")}'`;
  }
  return String(val);
}

// Runnable function if invoked manually from CLI
export function runSelfMigration() {
  const dbPath = path.join(process.cwd(), "db.json");
  if (!fs.existsSync(dbPath)) {
    console.error("Migration source db.json not found!");
    return;
  }
  const dbData = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  
  const fullSqlContent = generatePostgresSchema() + "\n\n" + generatePostgresSeeding(dbData);
  fs.writeFileSync(path.join(process.cwd(), "postgres-migration.sql"), fullSqlContent, "utf-8");
  console.log("PostgreSQL migration files successfully generated in ./postgres-migration.sql!");
}
