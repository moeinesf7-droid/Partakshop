export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM products ORDER BY id DESC"
  ).all();

  return Response.json(results);
}

export async function onRequestPost({ request, env }) {
  const adminKey = request.headers.get("x-admin-key");

  if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const result = await env.DB.prepare(`
    INSERT INTO products
    (name, category, price, image, description, stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    data.name,
    data.category || "",
    Number(data.price || 0),
    data.image || "",
    data.description || "",
    Number(data.stock || 0)
  ).run();

  return Response.json({
    success: true,
    id: result.meta.last_row_id
  });
}

export async function onRequestDelete({ request, env }) {
  const adminKey = request.headers.get("x-admin-key");

  if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing product id" }, { status: 400 });
  }

  await env.DB.prepare(
    "DELETE FROM products WHERE id = ?"
  ).bind(id).run();

  return Response.json({ success: true });
                          }
