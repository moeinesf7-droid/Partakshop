CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cat TEXT NOT NULL,
  price INTEGER NOT NULL,
  icon TEXT DEFAULT '🛍️',
  active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_products_active_cat ON products(active,cat);

CREATE TABLE IF NOT EXISTS orders (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  payment TEXT NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  FOREIGN KEY(order_code) REFERENCES orders(code)
);
CREATE INDEX IF NOT EXISTS idx_order_items_code ON order_items(order_code);

INSERT OR IGNORE INTO products(id,name,cat,price,icon,active) VALUES
(1,'ست لباس زیر گیپوری مشکی','لباس زیر زنانه',659000,'♢',1),
(2,'سرم ویتامین C','پوست و مراقبت',495000,'💧',1),
(3,'رژ لب مات شیک','آرایش صورت',385000,'💄',1),
(4,'پالت سایه چشم','چشم و ابرو',720000,'🎨',1),
(5,'کرم آبرسان روزانه','پوست و مراقبت',410000,'🫧',1),
(6,'عطر زنانه پارتاک','عطر و ادکلن',890000,'🌸',1),
(7,'ست لباس زیر صورتی','لباس زیر زنانه',590000,'♢',1),
(8,'خط چشم مایع','چشم و ابرو',290000,'🖊️',1);
