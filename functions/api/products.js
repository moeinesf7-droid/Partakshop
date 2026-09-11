export async function onRequestGet({ env }) {
  try {
    const rows = await env.DB.prepare(`
      SELECT id, name, cat, price, old_price, icon
      FROM products
      WHERE active = 1
      ORDER BY id DESC
    `).all();

    return Response.json({
      products: rows.results || []
    });

  } catch (e) {
    return Response.json(
      { error: "خطا در دریافت محصولات" },
      { status: 500 }
    );
  }
}


function checkAdmin(request, env) {
  const key = request.headers.get("x-admin-key");

  return (
    !!env.ADMIN_KEY &&
    key === env.ADMIN_KEY
  );
}


function getProductData(body) {

  const name = String(body.name || "").trim();

  const cat = String(body.cat || "").trim();

  const price = Number(body.price);

  const icon = String(body.icon || "")
    .trim()
    .slice(0, 8);


  let old_price = null;


  if (
    body.old_price !== null &&
    body.old_price !== undefined &&
    body.old_price !== ""
  ) {

    old_price = Number(body.old_price);

    if (
      !Number.isFinite(old_price) ||
      old_price <= price
    ) {
      return null;
    }

    old_price = Math.round(old_price);
  }


  if (
    !name ||
    !cat ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return null;
  }


  return {
    name,
    cat,
    price: Math.round(price),
    old_price,
    icon
  };
}



export async function onRequestPost({ request, env }) {

  if (!checkAdmin(request, env)) {

    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }


  try {

    const body = await request.json();

    const data = getProductData(body);


    if (!data) {

      return Response.json(
        { error: "اطلاعات محصول نامعتبر است" },
        { status: 400 }
      );
    }


    const result = await env.DB.prepare(`
      INSERT INTO products
      (name, cat, price, old_price, icon, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `)
      .bind(
        data.name,
        data.cat,
        data.price,
        data.old_price,
        data.icon
      )
      .run();


    return Response.json({
      ok: true,
      id: result.meta.last_row_id
    });


  } catch (e) {

    return Response.json(
      { error: "ثبت محصول انجام نشد" },
      { status: 500 }
    );
  }
}



export async function onRequestPatch({ request, env }) {

  if (!checkAdmin(request, env)) {

    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }


  try {

    const url = new URL(request.url);

    const id = Number(
      url.searchParams.get("id")
    );


    if (!Number.isInteger(id)) {

      return Response.json(
        { error: "شناسه محصول نامعتبر است" },
        { status: 400 }
      );
    }


    const body = await request.json();

    const data = getProductData(body);


    if (!data) {

      return Response.json(
        { error: "اطلاعات محصول نامعتبر است" },
        { status: 400 }
      );
    }


    const result = await env.DB.prepare(`
      UPDATE products
      SET
        name = ?,
        cat = ?,
        price = ?,
        old_price = ?,
        icon = ?
      WHERE id = ?
      AND active = 1
    `)
      .bind(
        data.name,
        data.cat,
        data.price,
        data.old_price,
        data.icon,
        id
      )
      .run();


    if (
      !result.meta ||
      result.meta.changes !== 1
    ) {

      return Response.json(
        { error: "محصول پیدا نشد" },
        { status: 404 }
      );
    }


    return Response.json({
      ok: true,
      id
    });


  } catch (e) {

    return Response.json(
      { error: "ویرایش محصول انجام نشد" },
      { status: 500 }
    );
  }
}



export async function onRequestDelete({ request, env }) {

  if (!checkAdmin(request, env)) {

    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }


  try {

    const url = new URL(request.url);

    const id = Number(
      url.searchParams.get("id")
    );


    if (!Number.isInteger(id)) {

      return Response.json(
        { error: "شناسه محصول نامعتبر است" },
        { status: 400 }
      );
    }


    const result = await env.DB.prepare(`
      UPDATE products
      SET active = 0
      WHERE id = ?
    `)
      .bind(id)
      .run();


    if (
      !result.meta ||
      result.meta.changes !== 1
    ) {

      return Response.json(
        { error: "محصول پیدا نشد" },
        { status: 404 }
      );
    }


    return Response.json({
      ok: true
    });


  } catch (e) {

    return Response.json(
      { error: "حذف محصول انجام نشد" },
      { status: 500 }
    );
  }
}
