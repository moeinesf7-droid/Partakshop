function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestGet({ env }) {
  try {
    const result = await env.DB
      .prepare(`
        SELECT id, name, cat, price, icon
        FROM products
        WHERE active = 1
        ORDER BY id DESC
      `)
      .all();

    return json({
      products: result.results || []
    });

  } catch (e) {
    return json({
      error: "خطا در دریافت محصولات",
      detail: String(e.message || e)
    }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const adminKey = request.headers.get("x-admin-key");

    if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
      return json({
        error: "Unauthorized"
      }, 401);
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const cat = String(body.cat || "").trim();
    const price = Number(body.price);
    const icon = String(body.icon || "🛍️").trim().slice(0, 8);

    if (
      !name ||
      !cat ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return json({
        error: "اطلاعات محصول نامعتبر است"
      }, 400);
    }

    const result = await env.DB
      .prepare(`
        INSERT INTO products
        (name, cat, price, icon, active)
        VALUES (?, ?, ?, ?, 1)
      `)
      .bind(
        name,
        cat,
        Math.round(price),
        icon
      )
      .run();

    return json({
      ok: true,
      id: result.meta?.last_row_id
    });

  } catch (e) {
    return json({
      error: "خطا در ثبت محصول",
      detail: String(e.message || e)
    }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const adminKey = request.headers.get("x-admin-key");

    if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
      return json({
        error: "Unauthorized"
      }, 401);
    }

    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));

    if (!Number.isInteger(id)) {
      return json({
        error: "شناسه محصول نامعتبر است"
      }, 400);
    }

    await env.DB
      .prepare(`
        UPDATE products
        SET active = 0
        WHERE id = ?
      `)
      .bind(id)
      .run();

    return json({
      ok: true
    });

  } catch (e) {
    return json({
      error: "خطا در حذف محصول",
      detail: String(e.message || e)
    }, 500);
  }
}
