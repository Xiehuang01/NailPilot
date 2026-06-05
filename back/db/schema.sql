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
