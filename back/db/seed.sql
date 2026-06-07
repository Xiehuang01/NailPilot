USE nailpilot;

DELETE FROM merchant_conversion_suggestions;
DELETE FROM merchant_weekly_comparison;
DELETE FROM merchant_booking_times;
DELETE FROM merchant_user_preferences;
DELETE FROM merchant_style_ranking;
DELETE FROM merchant_skin_tones;
DELETE FROM merchant_funnel;
DELETE FROM merchant_trends;
DELETE FROM merchant_style_stats;
DELETE FROM merchant_dashboard_summary;
DELETE FROM style_selection_events;
DELETE FROM try_on_events;
DELETE FROM bookings;
DELETE FROM recommendations;
DELETE FROM try_on_templates;
DELETE FROM styles;

-- 单商家真实款式图种子数据
-- 名称与标签根据图片视觉风格做归类，便于前端展示与 AI 推荐
INSERT INTO styles (id, name, tags, price, score, image_url, sort_order) VALUES
(1, '奶油裸杏纯色', JSON_ARRAY('裸色', '通勤', '短甲友好'), '99-129', 96, 'http://p0.meituan.net/pilotimages/87797733466cfd525625a5947767e2ff1794125.png', 1),
(2, '抹茶奶咖跳色', JSON_ARRAY('跳色', '秋冬', '显白'), '129-159', 91, 'http://p0.meituan.net/pilotimages/162afb52255bd908ba3ec418fd61824a2254875.png', 2),
(3, '牛奶奶牛纹', JSON_ARRAY('奶牛纹', '可爱', '短甲'), '119-149', 89, 'http://p1.meituan.net/pilotimages/7bb5bc0c2c741f9f0aa63787a601d7ad2604877.png', 3),
(4, '幻黑星芒长甲', JSON_ARRAY('星星', '甜酷', '长甲'), '169-219', 90, 'http://p0.meituan.net/pilotimages/fc8fe60e78341d77a5070fc2f8e520072098070.png', 4),
(5, '黑金花卉透感长甲', JSON_ARRAY('花卉', '法式', '长甲'), '179-239', 92, 'http://p1.meituan.net/pilotimages/3c0d090e20f0cb56f70fcb56c54dd6582416974.png', 5),
(6, '香槟钻饰宫廷长甲', JSON_ARRAY('钻饰', '轻奢', '宴会'), '199-269', 95, 'http://p0.meituan.net/pilotimages/6c857edd85a5fa4bcec59698fe9416cb1913981.png', 6),
(7, '红丝带法式', JSON_ARRAY('法式', '约会', '少女'), '139-179', 93, 'http://p0.meituan.net/pilotimages/2ac2d01a9bc78320edbe2b545b485b4a2132292.png', 7),
(8, '冷茶裸咖方圆甲', JSON_ARRAY('裸咖', '气质', '日常'), '109-149', 88, 'http://p1.meituan.net/pilotimages/d15c06e8c2137d4f39f3b60476a90cf92026957.png', 8),
(9, '冰透银豹纹长甲', JSON_ARRAY('豹纹', '亮片', '甜酷'), '159-219', 90, 'http://p1.meituan.net/pilotimages/69614397f0ecb559b98cb46a5a46f3b32642714.png', 9),
(10, '琉璃裸感尖法式', JSON_ARRAY('法式', '极简', '长甲'), '149-199', 87, 'http://p1.meituan.net/pilotimages/2277d6f9d82264fa6a3c986373e5e44c2292083.png', 10),
(11, '豆沙蝴蝶结碎钻', JSON_ARRAY('蝴蝶结', '温柔', '约会'), '149-189', 91, 'http://p0.meituan.net/pilotimages/bc153edf655dd6961dc9f8e95ad8cd1e2561531.png', 11),
(12, '奶白珍珠新娘甲', JSON_ARRAY('珍珠', '婚礼', '精致'), '189-259', 94, 'http://p0.meituan.net/pilotimages/43cc4ced977a3dd271f60ee2f05607772681747.png', 12),
(13, '低饱和雾白小花', JSON_ARRAY('小花', '清新', '短甲'), '119-159', 88, 'http://p0.meituan.net/pilotimages/682c173ae3a95d0b838655e8337b30d72213857.png', 13),
(14, '极光糖纸镜面', JSON_ARRAY('镜面', '潮流', '派对'), '169-229', 89, 'http://p1.meituan.net/pilotimages/eecfba4ab276e895b579a79491b2d0211982788.png', 14),
(15, '奶杏金箔温柔款', JSON_ARRAY('金箔', '温柔', '百搭'), '129-169', 92, 'http://p0.meituan.net/pilotimages/1248ad42d355b98257e5fbcdf90efc552138079.png', 15),
(16, '烟粉流沙钻饰', JSON_ARRAY('流沙', '轻奢', '长甲'), '179-239', 90, 'http://p0.meituan.net/pilotimages/137aad1f6a36655ae395cf7dc57604642782680.png', 16),
(17, '摩卡奶茶渐层', JSON_ARRAY('渐层', '气质', '秋冬'), '129-169', 89, 'http://p0.meituan.net/pilotimages/ec437f6291295904c2f894edb8c01cb82131722.png', 17),
(18, '裸粉珍珠蝴蝶结', JSON_ARRAY('蝴蝶结', '珍珠', '甜美'), '159-209', 90, 'http://p0.meituan.net/pilotimages/5591229138c4e7e1d183b59be442d9dc2267735.png', 18),
(19, '奶咖水光方甲', JSON_ARRAY('方甲', '水光', '通勤'), '109-149', 86, 'http://p0.meituan.net/pilotimages/5fad21e6d38656170bf726ff3973a4501918338.png', 19),
(20, '蔷薇红爱心法式', JSON_ARRAY('红法式', '爱心', '约会'), '139-179', 93, 'http://p1.meituan.net/pilotimages/d5eedc75b0021f79381962fc145b0bc62301165.png', 20),
(21, '香槟裸透猫眼', JSON_ARRAY('猫眼', '轻透', '显手长'), '149-199', 91, 'http://p0.meituan.net/pilotimages/f4b69d45af5d3b496adbd9d21e768a8e2195181.png', 21),
(22, '奶白珍珠渐变', JSON_ARRAY('渐变', '新娘', '精致'), '159-219', 90, 'http://p0.meituan.net/pilotimages/5b985a1c661ae2e964286178e6c0b0f92258113.png', 22),
(23, '烟灰豹纹细闪', JSON_ARRAY('豹纹', '细闪', '个性'), '149-199', 88, 'http://p1.meituan.net/pilotimages/bf8657d94693fb0fe1da3f7729d5667d2020119.png', 23),
(24, '小香风黑尖法式', JSON_ARRAY('黑法式', '法式', '高级感'), '169-229', 92, 'http://p0.meituan.net/pilotimages/e80e1d25e48d7ef5c505b29ee8e331822641412.png', 24),
(25, '清透香槟婚礼甲', JSON_ARRAY('细闪', '婚礼', '长甲'), '169-239', 91, 'http://p1.meituan.net/pilotimages/73ee568aa09547d8bfc0168113ac9ebc2712329.png', 25);

INSERT INTO try_on_templates (style_id, result_url, score, explanation) VALUES
(1, 'http://p0.meituan.net/pilotimages/87797733466cfd525625a5947767e2ff1794125.png', 86, JSON_ARRAY('奶油裸杏属于高容错显白色系', '短圆手和通勤场景都很友好', '适合第一次试戴或想要低风险选款的用户')),
(7, 'http://p0.meituan.net/pilotimages/2ac2d01a9bc78320edbe2b545b485b4a2132292.png', 89, JSON_ARRAY('红丝带法式会增强约会感和精致度', '方圆甲面更适合做这种边缘描线', '适合喜欢温柔中带一点设计感的用户')),
(12, 'http://p0.meituan.net/pilotimages/43cc4ced977a3dd271f60ee2f05607772681747.png', 92, JSON_ARRAY('珍珠婚礼甲和浅肤色、礼服场景适配度很高', '高光与珠饰会放大贵气感', '更适合宴会、婚礼、写真场景'));

INSERT INTO recommendations (id, name, score, reason, image_url) VALUES
(1, '奶油裸杏纯色', 93, '显白又稳妥，短甲和通勤用户友好', 'http://p0.meituan.net/pilotimages/87797733466cfd525625a5947767e2ff1794125.png'),
(2, '红丝带法式', 90, '设计感明确，适合约会和节日场景', 'http://p0.meituan.net/pilotimages/2ac2d01a9bc78320edbe2b545b485b4a2132292.png'),
(3, '奶白珍珠新娘甲', 91, '精致度和贵气感强，适合重要场合', 'http://p0.meituan.net/pilotimages/43cc4ced977a3dd271f60ee2f05607772681747.png');

-- 用户端真实行为联通到商家端：选款事件
INSERT INTO style_selection_events (style_id, source, session_id, created_at)
SELECT 1, 'catalog', CONCAT('seed-sel-1-', n), DATE_SUB(NOW(), INTERVAL MOD(n, 7) DAY)
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
  SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL
  SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL
  SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
) seq;

INSERT INTO style_selection_events (style_id, source, session_id, created_at)
SELECT 7, 'catalog', CONCAT('seed-sel-7-', n), DATE_SUB(NOW(), INTERVAL MOD(n + 1, 7) DAY)
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
  SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL
  SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18
) seq;

INSERT INTO style_selection_events (style_id, source, session_id, created_at)
SELECT 12, 'ai_recommendation', CONCAT('seed-sel-12-', n), DATE_SUB(NOW(), INTERVAL MOD(n + 2, 7) DAY)
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
  SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL
  SELECT 13 UNION ALL SELECT 14
) seq;

INSERT INTO style_selection_events (style_id, source, session_id, created_at)
SELECT 24, 'catalog', CONCAT('seed-sel-24-', n), DATE_SUB(NOW(), INTERVAL MOD(n + 3, 7) DAY)
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
  SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
) seq;

INSERT INTO style_selection_events (style_id, source, session_id, created_at)
SELECT 2, 'catalog', CONCAT('seed-sel-2-', n), DATE_SUB(NOW(), INTERVAL MOD(n + 4, 7) DAY)
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
  SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
) seq;

INSERT INTO style_selection_events (style_id, source, session_id, created_at)
SELECT 15, 'ai_recommendation', CONCAT('seed-sel-15-', n), DATE_SUB(NOW(), INTERVAL MOD(n + 5, 7) DAY)
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
  SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
) seq;

INSERT INTO style_selection_events (style_id, source, session_id, created_at)
SELECT 20, 'catalog', CONCAT('seed-sel-20-', n), DATE_SUB(NOW(), INTERVAL MOD(n, 7) DAY)
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
  SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
) seq;

INSERT INTO style_selection_events (style_id, source, session_id, created_at)
SELECT 11, 'catalog', CONCAT('seed-sel-11-', n), DATE_SUB(NOW(), INTERVAL MOD(n + 1, 7) DAY)
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
  SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
) seq;

INSERT INTO style_selection_events (style_id, source, session_id, created_at)
SELECT 9, 'ai_recommendation', CONCAT('seed-sel-9-', n), DATE_SUB(NOW(), INTERVAL MOD(n + 2, 7) DAY)
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) seq;

INSERT INTO style_selection_events (style_id, source, session_id, created_at)
SELECT 17, 'catalog', CONCAT('seed-sel-17-', n), DATE_SUB(NOW(), INTERVAL MOD(n + 3, 7) DAY)
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
) seq;

-- 用户端真实行为联通到商家端：试戴事件
INSERT INTO try_on_events (style_id, provider, success, fit_score, brighten_score, style_match_score, total_score, skin_tone, hand_shape, nail_bed, recommended_style_ids, explanation, created_at)
SELECT 1, 'gptImage2', 1, 94, 95, 94, 94, '暖黄皮', '短圆手', '偏短甲床', JSON_ARRAY(7, 15, 19), JSON_ARRAY('通勤显白、适配度高'), DATE_SUB(NOW(), INTERVAL 6 DAY)
FROM (SELECT 1 AS n UNION ALL SELECT 2) seq;
INSERT INTO try_on_events (style_id, provider, success, fit_score, brighten_score, style_match_score, total_score, skin_tone, hand_shape, nail_bed, recommended_style_ids, explanation, created_at)
VALUES
(7, 'gptImage2', 1, 92, 92, 93, 92, '冷白皮', '细长手', '中等甲床', JSON_ARRAY(1, 20, 11), JSON_ARRAY('约会氛围感强'), DATE_SUB(NOW(), INTERVAL 6 DAY)),
(12, 'gptImage2', 1, 93, 94, 95, 94, '中性皮', '方圆手', '中等甲床', JSON_ARRAY(15, 22, 25), JSON_ARRAY('婚礼感和精致度高'), DATE_SUB(NOW(), INTERVAL 6 DAY));

INSERT INTO try_on_events (style_id, provider, success, fit_score, brighten_score, style_match_score, total_score, skin_tone, hand_shape, nail_bed, recommended_style_ids, explanation, created_at)
VALUES
(1, 'gptImage2', 1, 93, 95, 94, 94, '暖黄皮', '短圆手', '偏短甲床', JSON_ARRAY(7, 15, 19), JSON_ARRAY('通勤场景稳定显白'), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7, 'gptImage2', 1, 91, 92, 93, 92, '冷白皮', '细长手', '中等甲床', JSON_ARRAY(1, 20, 11), JSON_ARRAY('节日感较强'), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(24, 'gptImage2', 1, 88, 90, 89, 89, '冷白皮', '细长手', '偏长甲床', JSON_ARRAY(6, 21, 9), JSON_ARRAY('高级感明显'), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 'gptImage2', 1, 90, 91, 90, 90, '暖黄皮', '方圆手', '中等甲床', JSON_ARRAY(17, 19, 15), JSON_ARRAY('秋冬显气色'), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(12, 'gptImage2', 1, 93, 94, 95, 94, '中性皮', '方圆手', '中等甲床', JSON_ARRAY(15, 22, 25), JSON_ARRAY('礼服场景适配'), DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO try_on_events (style_id, provider, success, fit_score, brighten_score, style_match_score, total_score, skin_tone, hand_shape, nail_bed, recommended_style_ids, explanation, created_at)
VALUES
(1, 'gptImage2', 1, 94, 95, 94, 94, '暖黄皮', '短圆手', '偏短甲床', JSON_ARRAY(7, 15, 19), JSON_ARRAY('适合日常高频选择'), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(7, 'gptImage2', 1, 91, 92, 93, 92, '冷白皮', '细长手', '中等甲床', JSON_ARRAY(1, 20, 11), JSON_ARRAY('约会场景表现稳定'), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(12, 'gptImage2', 1, 93, 94, 95, 94, '中性皮', '方圆手', '中等甲床', JSON_ARRAY(15, 22, 25), JSON_ARRAY('精致感优秀'), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(15, 'gptImage2', 1, 91, 92, 91, 91, '暖黄皮', '短圆手', '中等甲床', JSON_ARRAY(1, 17, 21), JSON_ARRAY('温柔显手净'), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(20, 'gptImage2', 1, 92, 91, 93, 92, '中性皮', '方圆手', '中等甲床', JSON_ARRAY(7, 11, 18), JSON_ARRAY('节日活力感突出'), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(9, 'gptImage2', 1, 87, 89, 88, 88, '橄榄皮', '细长手', '偏长甲床', JSON_ARRAY(24, 6, 23), JSON_ARRAY('甜酷风格更挑人群'), DATE_SUB(NOW(), INTERVAL 4 DAY));

INSERT INTO try_on_events (style_id, provider, success, fit_score, brighten_score, style_match_score, total_score, skin_tone, hand_shape, nail_bed, recommended_style_ids, explanation, created_at)
VALUES
(1, 'gptImage2', 1, 94, 95, 94, 94, '暖黄皮', '短圆手', '偏短甲床', JSON_ARRAY(7, 15, 19), JSON_ARRAY('短甲友好'), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(7, 'gptImage2', 1, 91, 92, 93, 92, '冷白皮', '细长手', '中等甲床', JSON_ARRAY(1, 20, 11), JSON_ARRAY('约会用户喜欢'), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(24, 'gptImage2', 1, 88, 90, 89, 89, '冷白皮', '细长手', '偏长甲床', JSON_ARRAY(6, 21, 9), JSON_ARRAY('高点击但适配门槛更高'), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 'gptImage2', 1, 90, 91, 90, 90, '暖黄皮', '方圆手', '中等甲床', JSON_ARRAY(17, 19, 15), JSON_ARRAY('显白偏稳妥'), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(15, 'gptImage2', 1, 91, 92, 91, 91, '暖黄皮', '短圆手', '中等甲床', JSON_ARRAY(1, 17, 21), JSON_ARRAY('温柔系选择'), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(11, 'gptImage2', 1, 90, 90, 91, 90, '中性皮', '短圆手', '偏短甲床', JSON_ARRAY(18, 20, 7), JSON_ARRAY('甜美用户偏爱'), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(17, 'gptImage2', 1, 89, 90, 90, 89, '橄榄皮', '方圆手', '中等甲床', JSON_ARRAY(2, 8, 15), JSON_ARRAY('秋冬氛围感好'), DATE_SUB(NOW(), INTERVAL 3 DAY));

INSERT INTO try_on_events (style_id, provider, success, fit_score, brighten_score, style_match_score, total_score, skin_tone, hand_shape, nail_bed, recommended_style_ids, explanation, created_at)
VALUES
(1, 'gptImage2', 1, 94, 95, 94, 94, '暖黄皮', '短圆手', '偏短甲床', JSON_ARRAY(7, 15, 19), JSON_ARRAY('通勤高容错'), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(7, 'gptImage2', 1, 91, 92, 93, 92, '冷白皮', '细长手', '中等甲床', JSON_ARRAY(1, 20, 11), JSON_ARRAY('显手更精致'), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(12, 'gptImage2', 1, 93, 94, 95, 94, '中性皮', '方圆手', '中等甲床', JSON_ARRAY(15, 22, 25), JSON_ARRAY('重要场合适配'), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(24, 'gptImage2', 1, 88, 90, 89, 89, '冷白皮', '细长手', '偏长甲床', JSON_ARRAY(6, 21, 9), JSON_ARRAY('高级感强'), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'gptImage2', 1, 90, 91, 90, 90, '暖黄皮', '方圆手', '中等甲床', JSON_ARRAY(17, 19, 15), JSON_ARRAY('暖黄皮更容易转化'), DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO try_on_events (style_id, provider, success, fit_score, brighten_score, style_match_score, total_score, skin_tone, hand_shape, nail_bed, recommended_style_ids, explanation, created_at)
VALUES
(1, 'gptImage2', 1, 94, 95, 94, 94, '暖黄皮', '短圆手', '偏短甲床', JSON_ARRAY(7, 15, 19), JSON_ARRAY('适合新客首次试戴'), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 'gptImage2', 1, 94, 95, 94, 94, '暖黄皮', '短圆手', '偏短甲床', JSON_ARRAY(7, 15, 19), JSON_ARRAY('显白表现稳定'), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(7, 'gptImage2', 1, 91, 92, 93, 92, '冷白皮', '细长手', '中等甲床', JSON_ARRAY(1, 20, 11), JSON_ARRAY('精致感到位'), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(12, 'gptImage2', 1, 93, 94, 95, 94, '中性皮', '方圆手', '中等甲床', JSON_ARRAY(15, 22, 25), JSON_ARRAY('高客单优势明显'), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(24, 'gptImage2', 1, 88, 90, 89, 89, '冷白皮', '细长手', '偏长甲床', JSON_ARRAY(6, 21, 9), JSON_ARRAY('更适合定向推荐'), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(15, 'gptImage2', 1, 91, 92, 91, 91, '暖黄皮', '短圆手', '中等甲床', JSON_ARRAY(1, 17, 21), JSON_ARRAY('温柔日常感强'), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(20, 'gptImage2', 1, 92, 91, 93, 92, '中性皮', '方圆手', '中等甲床', JSON_ARRAY(7, 11, 18), JSON_ARRAY('节日感选择'), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(11, 'gptImage2', 1, 90, 90, 91, 90, '暖黄皮', '短圆手', '偏短甲床', JSON_ARRAY(18, 20, 7), JSON_ARRAY('甜美款补充推荐'), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 'gptImage2', 1, 90, 91, 90, 90, '橄榄皮', '方圆手', '中等甲床', JSON_ARRAY(17, 19, 15), JSON_ARRAY('秋冬偏暖色调表现好'), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 'gptImage2', 1, 89, 90, 92, 90, '冷白皮', '细长手', '偏长甲床', JSON_ARRAY(12, 25, 24), JSON_ARRAY('宴会用户偏好'), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO try_on_events (style_id, provider, success, fit_score, brighten_score, style_match_score, total_score, skin_tone, hand_shape, nail_bed, recommended_style_ids, explanation, created_at)
VALUES
(1, 'gptImage2', 1, 94, 95, 94, 94, '暖黄皮', '短圆手', '偏短甲床', JSON_ARRAY(7, 15, 19), JSON_ARRAY('当天最稳妥显白款'), NOW()),
(1, 'gptImage2', 1, 94, 95, 94, 94, '暖黄皮', '短圆手', '偏短甲床', JSON_ARRAY(7, 15, 19), JSON_ARRAY('继续适合作为默认推荐'), NOW()),
(7, 'gptImage2', 1, 91, 92, 93, 92, '冷白皮', '细长手', '中等甲床', JSON_ARRAY(1, 20, 11), JSON_ARRAY('约会感强'), NOW()),
(7, 'gptImage2', 1, 91, 92, 93, 92, '冷白皮', '细长手', '中等甲床', JSON_ARRAY(1, 20, 11), JSON_ARRAY('手部精致感好'), NOW()),
(12, 'gptImage2', 1, 93, 94, 95, 94, '中性皮', '方圆手', '中等甲床', JSON_ARRAY(15, 22, 25), JSON_ARRAY('高质感婚礼款'), NOW()),
(24, 'gptImage2', 1, 88, 90, 89, 89, '冷白皮', '细长手', '偏长甲床', JSON_ARRAY(6, 21, 9), JSON_ARRAY('适合窄人群定向'), NOW()),
(15, 'gptImage2', 1, 91, 92, 91, 91, '暖黄皮', '短圆手', '中等甲床', JSON_ARRAY(1, 17, 21), JSON_ARRAY('温柔系新客友好'), NOW()),
(2, 'gptImage2', 1, 90, 91, 90, 90, '暖黄皮', '方圆手', '中等甲床', JSON_ARRAY(17, 19, 15), JSON_ARRAY('今日显白表现稳定'), NOW()),
(20, 'gptImage2', 1, 92, 91, 93, 92, '橄榄皮', '方圆手', '中等甲床', JSON_ARRAY(7, 11, 18), JSON_ARRAY('节日风格有记忆点'), NOW());

-- 用户端真实行为联通到商家端：预约事件
INSERT INTO bookings (shop_id, style_id, booking_time, nickname, status, created_at) VALUES
('demo_shop_001', 20, '2026-06-11 15:00', '小柚', 'confirmed', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('demo_shop_001', 7, '2026-06-12 19:30', 'Lina', 'confirmed', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('demo_shop_001', 1, '2026-06-12 14:00', '阿梨', 'confirmed', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('demo_shop_001', 2, '2026-06-12 18:00', 'Mika', 'confirmed', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('demo_shop_001', 1, '2026-06-13 10:30', 'Yoyo', 'confirmed', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('demo_shop_001', 7, '2026-06-13 20:00', '小鹿', 'confirmed', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('demo_shop_001', 12, '2026-06-13 16:00', 'Lemon', 'confirmed', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('demo_shop_001', 24, '2026-06-13 17:30', 'Nana', 'confirmed', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('demo_shop_001', 6, '2026-06-13 19:00', 'Momo', 'confirmed', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('demo_shop_001', 1, '2026-06-14 14:00', 'Kiki', 'confirmed', NOW()),
('demo_shop_001', 1, '2026-06-14 18:00', '小桃', 'confirmed', NOW()),
('demo_shop_001', 7, '2026-06-14 19:30', 'Eden', 'confirmed', NOW()),
('demo_shop_001', 12, '2026-06-14 15:30', 'Ava', 'confirmed', NOW()),
('demo_shop_001', 15, '2026-06-14 11:00', 'Rita', 'confirmed', NOW());

INSERT INTO merchant_dashboard_summary (
  shop_name, today_try_on, today_booking, conversion_rate, top_style, total_views, try_on_volume, favorite_volume, booking_volume, try_on_to_booking_rate
) VALUES (
  'Lisa 美甲工作室', 9, 5, '55.6%', '奶油裸杏纯色', 113, 46, 29, 14, '30.4%'
);

INSERT INTO merchant_style_stats (id, name, views, try_ons, favorites, bookings, conversion, advice) VALUES
(1, '奶油裸杏纯色', 24, 10, 6, 4, '40.0%', '高通勤适配，建议继续放在默认推荐位'),
(7, '红丝带法式', 18, 8, 5, 3, '37.5%', '约会和节日场景转化高，适合活动专题位'),
(12, '奶白珍珠新娘甲', 14, 6, 4, 2, '33.3%', '高客单婚礼款，建议在重要场景专题里强化曝光'),
(24, '小香风黑尖法式', 12, 5, 3, 1, '20.0%', '被选中多但预约偏低，更适合冷白皮定向推荐'),
(2, '抹茶奶咖跳色', 10, 5, 2, 1, '20.0%', '秋冬氛围感强，适合和穿搭内容做联动'),
(15, '奶杏金箔温柔款', 9, 4, 2, 1, '25.0%', '温柔显白，适合新客承接'),
(20, '蔷薇红爱心法式', 8, 3, 2, 1, '33.3%', '节日氛围强，适合节点营销'),
(11, '豆沙蝴蝶结碎钻', 7, 2, 2, 0, '0.0%', '收藏意向不差，可优化预约承接'),
(9, '冰透银豹纹长甲', 6, 1, 1, 0, '0.0%', '甜酷风更挑人群，建议缩小推荐范围'),
(17, '摩卡奶茶渐层', 5, 1, 1, 0, '0.0%', '可作为秋冬搭配款补充展示');

INSERT INTO merchant_trends (date_label, try_ons, sort_order) VALUES
('06-01', 4, 1),
('06-02', 5, 2),
('06-03', 6, 3),
('06-04', 7, 4),
('06-05', 5, 5),
('06-06', 10, 6),
('06-07', 9, 7);

INSERT INTO merchant_funnel (label, value, sort_order) VALUES
('选款', 113, 1),
('试戴', 46, 2),
('收藏', 29, 3),
('预约', 14, 4);

INSERT INTO merchant_skin_tones (tone_name, value, sort_order) VALUES
('暖黄皮', 21, 1),
('冷白皮', 11, 2),
('中性皮', 9, 3),
('橄榄皮', 5, 4);

-- 热门款式排行（综合评分 = views*0.2 + try_ons*0.3 + favorites*0.25 + bookings*0.25）
INSERT INTO merchant_style_ranking (style_id, name, current_rank, previous_rank, trend, composite_score, views, try_ons, favorites, bookings, conversion_rate, sort_order) VALUES
(1,  '奶油裸杏纯色',      1,  2, 'up',     94.5, 4620, 1780, 560, 162, '9.1%',  1),
(7,  '红丝带法式',        2,  1, 'down',   91.2, 3560, 1320, 488, 144, '10.9%', 2),
(12, '奶白珍珠新娘甲',    3,  4, 'up',     88.7, 2940,  980, 410, 126, '12.8%', 3),
(15, '奶杏金箔温柔款',    4,  6, 'up',     86.3, 2750, 1020, 380,  98, '9.6%',  4),
(2,  '抹茶奶咖跳色',      5,  3, 'down',   84.1, 2860, 1090, 322,  74, '6.8%',  5),
(24, '小香风黑尖法式',    6,  5, 'down',   82.8, 3180, 1170, 276,  82, '7.0%',  6),
(20, '蔷薇红爱心法式',    7,  8, 'up',     80.5, 2680,  950, 355,  89, '9.4%',  7),
(11, '豆沙蝴蝶结碎钻',    8,  7, 'down',   79.3, 2540,  880, 340,  82, '9.3%',  8),
(9,  '冰透银豹纹长甲',    9,  9, 'stable', 77.6, 2480,  860, 295,  68, '7.9%',  9),
(17, '摩卡奶茶渐层',      10, 12, 'up',    75.4, 2380,  820, 298,  72, '8.8%',  10),
(21, '香槟裸透猫眼',      11, 10, 'down',  73.9, 2320,  780, 275,  65, '8.3%',  11),
(6,  '香槟钻饰宫廷长甲',  12, 11, 'down',  72.1, 2250,  740, 290,  62, '8.4%',  12),
(3,  '牛奶奶牛纹',        13, 14, 'up',    69.8, 2180,  720, 262,  55, '7.6%',  13),
(18, '裸粉珍珠蝴蝶结',    14, 13, 'down',  68.5, 2120,  690, 260,  52, '7.5%',  14),
(5,  '黑金花卉透感长甲',  15, 15, 'stable',67.2, 2080,  660, 248,  50, '7.6%',  15);

-- 用户偏好统计：手型分布
INSERT INTO merchant_user_preferences (category, label, value, percentage, sort_order) VALUES
('hand_shape', '短圆手', 38, '38%', 1),
('hand_shape', '细长手', 27, '27%', 2),
('hand_shape', '方圆手', 22, '22%', 3),
('hand_shape', '宽大手', 13, '13%', 4);

-- 用户偏好统计：热门标签偏好（按试戴量加权）
INSERT INTO merchant_user_preferences (category, label, value, percentage, sort_order) VALUES
('tag', '裸色/通勤',   680, '18%', 1),
('tag', '法式',        560, '15%', 2),
('tag', '渐变',        480, '13%', 3),
('tag', '珍珠/精致',  450, '12%', 4),
('tag', '猫眼/镜面',  380, '10%', 5),
('tag', '蝴蝶结/甜美',350,  '9%', 6),
('tag', '豹纹/个性',  280,  '7%', 7),
('tag', '跳色',        240,  '6%', 8);

-- 用户偏好统计：价格带偏好
INSERT INTO merchant_user_preferences (category, label, value, percentage, sort_order) VALUES
('price_range', '99-149元',  42, '42%', 1),
('price_range', '149-199元', 30, '30%', 2),
('price_range', '199-269元', 18, '18%', 3),
('price_range', '69-99元',   10, '10%', 4);

-- 用户偏好统计：甲床类型分布
INSERT INTO merchant_user_preferences (category, label, value, percentage, sort_order) VALUES
('nail_bed', '偏短甲床', 40, '40%', 1),
('nail_bed', '中等甲床', 35, '35%', 2),
('nail_bed', '偏长甲床', 25, '25%', 3);

-- 预约时段分布
INSERT INTO merchant_booking_times (time_period, booking_count, percentage, insight, sort_order) VALUES
('下午 14:00-18:00', 156, '42%', '下午茶时段为预约高峰，可集中安排技师排班', 1),
('上午 10:00-12:00', 112, '30%', '上午预约集中在周末，工作日可推早鸟优惠', 2),
('晚上 18:00-21:00', 102, '28%', '晚间时段以通勤族为主，适合推短时快速款', 3);

-- 转化优化建议
INSERT INTO merchant_conversion_suggestions (category, title, suggestion, priority, expected_impact, related_style_id, sort_order) VALUES
('product',    '首页主推「奶油裸杏纯色」',          '该款浏览量高且转化稳定（9.1%），建议放首页首屏推荐位，预计日均曝光可增加 40%',                     'high',   '预计提升转化 15%',   1,  1),
('product',    '打造「短甲显白」专属品类',          '短圆手用户占比 38%，可将奶油裸杏、牛奶奶牛纹、低饱和雾白小花归入「短甲友好」集合页，降低选择成本', 'high',   '预计提升转化 12%',   NULL, 2),
('pricing',    '推出 99 元低门槛体验套餐',          '42% 用户偏好 99-149 元价格带，建议选 1-2 款通勤款做 99 元新客体验，以低价引流拉动预约',               'high',   '预计新增 30 单/周',  NULL, 3),
('targeting',  '暖黄皮用户精准推荐豆沙系',          '暖黄皮用户占比 45%，豆沙蝴蝶结碎钻在该人群的试戴转化率高达 10.5%，可做肤色定向推荐',                'high',   '预计提升转化 20%',   11,  4),
('marketing',  '周末上午推早鸟价',                  '上午预约集中在周末，可推出周末上午 9 折早鸟优惠，拉升工作日午间预约量',                               'medium', '预计提升预约 10%',   NULL, 5),
('product',    '婚礼季主推「奶白珍珠新娘甲」',      '该款转化率 12.8% 为全场最高，客单价 189-259 元，适合在婚礼旺季（5-6月、9-11月）重点投放',              'high',   '预计提升客单价 20%', 12,  6),
('targeting',  '减少黑色款的泛曝光',                '小香风黑尖法式点击量高但预约转化仅 7.0%，建议从首页移除，改为推荐给冷白皮细长手用户分组',              'medium', '预计减少流失 8%',    24,  7),
('marketing',  '小红书种草「红丝带法式」',          '红丝带法式约会属性强，在小红书投放「约会美甲」关键词，配合试戴前后对比图',                             'medium', '预计提升曝光 25%',   7,   8),
('pricing',    '阶梯定价引导升单',                  '当前 99-149 元带占比最高，可在试戴完成页推荐「加 30 元升级钻饰版」，引导用户向高价位转化',              'medium', '预计提升客单价 15%',  NULL, 9),
('targeting',  '回归用户定向推送新品',              '近 30 天未访问的老用户，推送上新款式 + 专属折扣券，通过短信/小程序通知触达',                            'low',    '预计召回 8%',        NULL, 10);

-- 周同比经营数据
INSERT INTO merchant_weekly_comparison (metric_name, current_week_value, last_week_value, change_percentage, trend) VALUES
('views',        113,   96, '+17.7%', 'up'),
('try_ons',       46,   38, '+21.1%', 'up'),
('favorites',     29,   24, '+20.8%', 'up'),
('bookings',      14,   11, '+27.3%', 'up'),
('revenue',     4180, 3360, '+24.4%', 'up');
