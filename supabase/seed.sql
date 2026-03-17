-- Seed categories
insert into categories (id, name, icon, sort_order) values
  ('cat_cake', 'Cakes', '🎂', 0),
  ('cat_pastry', 'Pastries', '🥐', 1),
  ('cat_icecream', 'Ice Cream', '🍦', 2),
  ('cat_decoration', 'Decorations', '🎀', 3),
  ('cat_other', 'Other Items', '📦', 4);

-- Seed products
insert into products (id, cat_id, name, buy_price, sell_price, qty) values
  ('prod_001', 'cat_cake', 'Black Forest Cake (1kg)', 350, 600, 8),
  ('prod_002', 'cat_cake', 'Butterscotch Cake (500g)', 200, 380, 12),
  ('prod_003', 'cat_cake', 'Red Velvet Cake (1kg)', 400, 700, 5),
  ('prod_004', 'cat_cake', 'Pineapple Cake (500g)', 180, 350, 10),
  ('prod_005', 'cat_pastry', 'Chocolate Éclair', 25, 50, 30),
  ('prod_006', 'cat_pastry', 'Veg Puff', 15, 35, 50),
  ('prod_007', 'cat_pastry', 'Chicken Sandwich', 30, 60, 20),
  ('prod_008', 'cat_icecream', 'Vanilla Scoop', 20, 50, 100),
  ('prod_009', 'cat_icecream', 'Butterscotch Cone', 25, 55, 60),
  ('prod_010', 'cat_decoration', 'Fondant Flowers (set)', 80, 180, 25),
  ('prod_011', 'cat_decoration', 'Edible Glitter (50g)', 60, 150, 40),
  ('prod_012', 'cat_other', 'Paper Cups (100pcs)', 45, 90, 200);
