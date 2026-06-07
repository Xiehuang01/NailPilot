CREATE DATABASE IF NOT EXISTS nailpilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nailpilot;

CREATE TABLE IF NOT EXISTS styles (
  id INT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  tags JSON NOT NULL,
  price VARCHAR(32) NOT NULL,
  score INT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS try_on_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  style_id INT NOT NULL,
  result_url TEXT NOT NULL,
  score INT NOT NULL,
  explanation JSON NOT NULL,
  FOREIGN KEY (style_id) REFERENCES styles(id)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  score INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shop_id VARCHAR(64) NOT NULL,
  style_id INT NOT NULL,
  booking_time VARCHAR(64) NOT NULL,
  nickname VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (style_id) REFERENCES styles(id)
);

CREATE TABLE IF NOT EXISTS merchant_dashboard_summary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shop_name VARCHAR(128) NOT NULL,
  today_try_on INT NOT NULL,
  today_booking INT NOT NULL,
  conversion_rate VARCHAR(32) NOT NULL,
  top_style VARCHAR(128) NOT NULL,
  total_views INT NOT NULL,
  try_on_volume INT NOT NULL,
  favorite_volume INT NOT NULL,
  booking_volume INT NOT NULL,
  try_on_to_booking_rate VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS merchant_style_stats (
  id INT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  views INT NOT NULL,
  try_ons INT NOT NULL,
  favorites INT NOT NULL,
  bookings INT NOT NULL,
  conversion VARCHAR(32) NOT NULL,
  advice VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS merchant_trends (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date_label VARCHAR(32) NOT NULL,
  try_ons INT NOT NULL,
  sort_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS merchant_funnel (
  id INT PRIMARY KEY AUTO_INCREMENT,
  label VARCHAR(32) NOT NULL,
  value INT NOT NULL,
  sort_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS merchant_skin_tones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tone_name VARCHAR(32) NOT NULL,
  value INT NOT NULL,
  sort_order INT NOT NULL
);

-- 热门款式排行（含排名变化、综合评分）
CREATE TABLE IF NOT EXISTS merchant_style_ranking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  style_id INT NOT NULL,
  name VARCHAR(128) NOT NULL,
  current_rank INT NOT NULL,
  previous_rank INT NOT NULL,
  trend VARCHAR(8) NOT NULL COMMENT 'up/down/stable/new',
  composite_score DECIMAL(5,1) NOT NULL COMMENT '综合评分(百分制)',
  views INT NOT NULL,
  try_ons INT NOT NULL,
  favorites INT NOT NULL,
  bookings INT NOT NULL,
  conversion_rate VARCHAR(16) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- 用户偏好统计（手型、标签、价位、甲床多维度）
CREATE TABLE IF NOT EXISTS merchant_user_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category VARCHAR(32) NOT NULL COMMENT 'hand_shape/tag/price_range/nail_bed',
  label VARCHAR(64) NOT NULL,
  value INT NOT NULL,
  percentage VARCHAR(8) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- 预约时段分布
CREATE TABLE IF NOT EXISTS merchant_booking_times (
  id INT PRIMARY KEY AUTO_INCREMENT,
  time_period VARCHAR(16) NOT NULL COMMENT '上午/下午/晚上',
  booking_count INT NOT NULL,
  percentage VARCHAR(8) NOT NULL,
  insight VARCHAR(128) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- 转化优化建议
CREATE TABLE IF NOT EXISTS merchant_conversion_suggestions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category VARCHAR(32) NOT NULL COMMENT 'product/pricing/marketing/targeting',
  title VARCHAR(128) NOT NULL,
  suggestion TEXT NOT NULL,
  priority VARCHAR(8) NOT NULL COMMENT 'high/medium/low',
  expected_impact VARCHAR(64) NOT NULL,
  related_style_id INT DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- 周同比经营数据
CREATE TABLE IF NOT EXISTS merchant_weekly_comparison (
  id INT PRIMARY KEY AUTO_INCREMENT,
  metric_name VARCHAR(32) NOT NULL COMMENT 'views/try_ons/favorites/bookings/revenue',
  current_week_value INT NOT NULL,
  last_week_value INT NOT NULL,
  change_percentage VARCHAR(16) NOT NULL,
  trend VARCHAR(8) NOT NULL COMMENT 'up/down/stable'
);
