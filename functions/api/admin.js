export async function onRequestGet({ request, env }) {
  const key = request.headers.get("x-admin-key");

  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const orders = await env.DB
    .prepare(`
      SELECT
        code,
        name,
        phone,
        address,
        payment,
        total,
        status,
        created_at,
        coupon_code,
        discount
      FROM orders
      ORDER BY created_at DESC
      LIMIT 100
    `)
    .all();

  const products = await env.DB
    .prepare(`
      SELECT
        id,
        name,
        cat,
        price,
        old_price,
        icon
      FROM products
      WHERE active = 1
      ORDER BY id DESC
    `)
    .all();

  const coupons = await env.DB
    .prepare(`
      SELECT
        code,
        type,
        value,
        expires_at,
        max_uses,
        uses,
        active
      FROM coupons
      ORDER BY code
    `)
    .all();

  return Response.json({
    orders: orders.results || [],
    products: products.results || [],
    coupons: coupons.results || []
  });
}
