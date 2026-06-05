USE nailpilot;

DELETE FROM merchant_skin_tones;
DELETE FROM merchant_funnel;
DELETE FROM merchant_trends;
DELETE FROM merchant_style_stats;
DELETE FROM merchant_dashboard_summary;
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

INSERT INTO merchant_dashboard_summary (
  shop_name, today_try_on, today_booking, conversion_rate, top_style, total_views, try_on_volume, favorite_volume, booking_volume, try_on_to_booking_rate
) VALUES (
  'Lisa 美甲工作室', 518, 67, '12.9%', '奶油裸杏纯色', 18760, 6930, 1840, 512, '7.4%'
);

INSERT INTO merchant_style_stats (id, name, views, try_ons, favorites, bookings, conversion, advice) VALUES
(1, '奶油裸杏纯色', 4620, 1780, 560, 162, '9.1%', '高通勤适配，建议放在默认推荐位'),
(7, '红丝带法式', 3560, 1320, 488, 144, '10.9%', '节日与约会场景转化高，建议做专题活动'),
(12, '奶白珍珠新娘甲', 2940, 980, 410, 126, '12.8%', '高客单高转化，适合婚礼档期重点推广'),
(24, '小香风黑尖法式', 3180, 1170, 276, 82, '7.0%', '点击高于收藏，适合精准推送给高级感人群'),
(2, '抹茶奶咖跳色', 2860, 1090, 322, 74, '6.8%', '秋冬氛围感强，建议和毛衣穿搭内容联动'),
(9, '冰透银豹纹长甲', 2480, 860, 295, 68, '7.9%', '甜酷风用户更爱，适合年轻用户分组投放');

INSERT INTO merchant_trends (date_label, try_ons, sort_order) VALUES
('10-01', 320, 1),
('10-02', 380, 2),
('10-03', 410, 3),
('10-04', 390, 4),
('10-05', 460, 5),
('10-06', 520, 6),
('10-07', 452, 7);

INSERT INTO merchant_funnel (label, value, sort_order) VALUES
('浏览', 12580, 1),
('试戴', 4520, 2),
('收藏', 1280, 3),
('预约', 320, 4);

INSERT INTO merchant_skin_tones (tone_name, value, sort_order) VALUES
('暖黄皮', 45, 1),
('冷白皮', 25, 2),
('中性皮', 20, 3),
('橄榄皮', 10, 4);
