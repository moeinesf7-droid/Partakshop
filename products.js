function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

export async function onRequestGet({ env }) {
  try {
    const rows = await env.DB
      .prepare(`
        SELECT id, name, cat, price, icon
        FROM products
        WHERE active = 1
        ORDER BY id DESC
      `)
      .all();

    return json({
      products: rows.results || []
    });

  } catch (error) {
    return json({
      error: 'خطا در دریافت محصولات',
      detail: String(error?.message || error)
    }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const key = request.headers.get('x-admin-key');

    if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = await request.json();

    const name = String(body.name || '').trim().slice(0, 200);
    const cat = String(body.cat || '').trim().slice(0, 100);
    const price = Number(body.price);
    const icon = String(body.icon || '🛍️').trim().slice(0, 20);

    if (!name) {
      return json({ error: 'نام محصول وارد نشده است' }, 400);
    }

    if (!cat) {
      return json({ error: 'دسته‌بندی وارد نشده است' }, 400);
    }

    if (!Number.isFinite(price) || price < 0) {
      return json({ error: 'قیمت محصول نامعتبر است' }, 400);
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
      id: result.meta?.last_row_id || null
    });

  } catch (error) {
    console.error('PRODUCT INSERT ERROR:', error);

    return json({
      error: 'خطا در ثبت محصول',
      detail: String(error?.message || error)
    }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const key = request.headers.get('x-admin-key');

    if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));

    if (!Number.isInteger(id)) {
      return json({ error: 'شناسه محصول نامعتبر است' }, 400);
    }

    await env.DB
      .prepare(`
        UPDATE products
        SET active = 0
        WHERE id = ?
      `)
      .bind(id)
      .run();

    return json({ ok: true });

  } catch (error) {
    console.error('PRODUCT DELETE ERROR:', error);

    return json({
      error: 'خطا در حذف محصول',
      detail: String(error?.message || error)
    }, 500);
  }
}
