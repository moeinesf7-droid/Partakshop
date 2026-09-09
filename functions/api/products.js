export async function onRequestGet({ env }) {
  try {
    const rows = await env.DB
      .prepare(`
        SELECT id, name, cat, price, old_price, icon
        FROM products
        WHERE active = 1
        ORDER BY id DESC
      `)
      .all();

    return Response.json({
      products: rows.results || []
    });

  } catch (e) {
    return Response.json(
      { error: 'خطا در دریافت محصولات' },
      { status: 500 }
    );
  }
}


export async function onRequestPost({ request, env }) {
  const key = request.headers.get('x-admin-key');

  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const name = String(body.name || '').trim();
    const cat = String(body.cat || '').trim();
    const price = Number(body.price);

    const oldPrice =
      body.old_price === '' ||
      body.old_price === null ||
      body.old_price === undefined
        ? null
        : Number(body.old_price);

    const icon = String(body.icon || '').trim().slice(0, 8);

    if (
      !name ||
      !cat ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return Response.json(
        { error: 'اطلاعات محصول نامعتبر است' },
        { status: 400 }
      );
    }

    if (
      oldPrice !== null &&
      (!Number.isFinite(oldPrice) || oldPrice < 0)
    ) {
      return Response.json(
        { error: 'قیمت قبلی نامعتبر است' },
        { status: 400 }
      );
    }

    if (
      oldPrice !== null &&
      oldPrice <= price
    ) {
      return Response.json(
        {
          error: 'قیمت قبلی باید بیشتر از قیمت فعلی باشد'
        },
        { status: 400 }
      );
    }

    const result = await env.DB
      .prepare(`
        INSERT INTO products
        (name, cat, price, old_price, icon, active)
        VALUES (?, ?, ?, ?, ?, 1)
      `)
      .bind(
        name,
        cat,
        Math.round(price),
        oldPrice === null ? null : Math.round(oldPrice),
        icon
      )
      .run();

    return Response.json({
      ok: true,
      id: result.meta.last_row_id
    });

  } catch (e) {
    return Response.json(
      { error: 'خطا در افزودن محصول' },
      { status: 500 }
    );
  }
}


export async function onRequestPatch({ request, env }) {
  const key = request.headers.get('x-admin-key');

  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const id = Number(body.id);
    const name = String(body.name || '').trim();
    const cat = String(body.cat || '').trim();
    const price = Number(body.price);

    const oldPrice =
      body.old_price === '' ||
      body.old_price === null ||
      body.old_price === undefined
        ? null
        : Number(body.old_price);

    const icon = String(body.icon || '').trim().slice(0, 8);

    if (
      !Number.isInteger(id) ||
      !name ||
      !cat ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return Response.json(
        { error: 'اطلاعات محصول نامعتبر است' },
        { status: 400 }
      );
    }

    if (
      oldPrice !== null &&
      (!Number.isFinite(oldPrice) || oldPrice < 0)
    ) {
      return Response.json(
        { error: 'قیمت قبلی نامعتبر است' },
        { status: 400 }
      );
    }

    if (
      oldPrice !== null &&
      oldPrice <= price
    ) {
      return Response.json(
        {
          error: 'قیمت قبلی باید بیشتر از قیمت فعلی باشد'
        },
        { status: 400 }
      );
    }

    const result = await env.DB
      .prepare(`
        UPDATE products
        SET name = ?,
            cat = ?,
            price = ?,
            old_price = ?,
            icon = ?
        WHERE id = ?
          AND active = 1
      `)
      .bind(
        name,
        cat,
        Math.round(price),
        oldPrice === null ? null : Math.round(oldPrice),
        icon,
        id
      )
      .run();

    if (!result.meta?.changes) {
      return Response.json(
        { error: 'محصول پیدا نشد' },
        { status: 404 }
      );
    }

    return Response.json({ ok: true });

  } catch (e) {
    return Response.json(
      { error: 'خطا در ویرایش محصول' },
      { status: 500 }
    );
  }
}


export async function onRequestDelete({ request, env }) {
  const key = request.headers.get('x-admin-key');

  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));

  if (!Number.isInteger(id)) {
    return Response.json(
      { error: 'شناسه محصول نامعتبر است' },
      { status: 400 }
    );
  }

  await env.DB
    .prepare(`
      UPDATE products
      SET active = 0
      WHERE id = ?
    `)
    .bind(id)
    .run();

  return Response.json({ ok: true });
}
