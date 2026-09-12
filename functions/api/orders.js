function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function cleanPhone(v) {
  return String(v || "")
    .replace(/[^0-9+]/g, "")
    .slice(0, 20);
}

function normalizeCode(v) {
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 40);
}

function validCoupon(c) {
  if (!c || Number(c.active) !== 1) return false;

  if (
    c.expires_at &&
    new Date(c.expires_at).getTime() < Date.now()
  ) {
    return false;
  }

  if (
    c.max_uses !== null &&
    c.max_uses !== undefined &&
    Number(c.max_uses) > 0 &&
    Number(c.uses || 0) >= Number(c.max_uses)
  ) {
    return false;
  }

  return true;
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    const name = String(body.name || "")
      .trim()
      .slice(0, 100);

    const phone = cleanPhone(body.phone);

    const address = String(body.address || "")
      .trim()
      .slice(0, 500);

    const payment =
      body.payment === "online"
        ? "online_pending"
        : "cod";

    const items = Array.isArray(body.items)
      ? body.items
      : [];

    if (
      !name ||
      phone.length < 7 ||
      !address ||
      !items.length
    ) {
      return json(
        { error: "اطلاعات سفارش ناقص است" },
        400
      );
    }

    const ids = [
      ...new Set(
        items
          .map(x => Number(x.id))
          .filter(Number.isInteger)
      )
    ];

    if (!ids.length) {
      return json(
        { error: "محصول نامعتبر است" },
        400
      );
    }

    const placeholders = ids
      .map(() => "?")
      .join(",");

    const result = await env.DB
      .prepare(`
        SELECT id, name, price, active
        FROM products
        WHERE active = 1
        AND id IN (${placeholders})
      `)
      .bind(...ids)
      .all();

    const byId = new Map(
      (result.results || []).map(p => [
        Number(p.id),
        p
      ])
    );

    const normalized = [];
    let subtotal = 0;

    for (const raw of items) {
      const id = Number(raw.id);

      const qty = Math.max(
        1,
        Math.min(
          20,
          Number(raw.qty) || 1
        )
      );

      const product = byId.get(id);

      if (!product) {
        return json(
          { error: "یکی از محصولات دیگر موجود نیست" },
          400
        );
      }

      normalized.push({
        id,
        name: product.name,
        price: Number(product.price),
        qty
      });

      subtotal +=
        Number(product.price) * qty;
    }

    const couponCode = normalizeCode(
      body.coupon_code
    );

    let discount = 0;
    let usedCoupon = null;

    if (couponCode) {
      const coupon = await env.DB
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
          WHERE code = ?
        `)
        .bind(couponCode)
        .first();

      if (!validCoupon(coupon)) {
        return json(
          {
            error:
              "کد تخفیف معتبر نیست یا منقضی شده است"
          },
          400
        );
      }

      if (coupon.type === "percent") {
        discount = Math.floor(
          subtotal *
          Number(coupon.value) /
          100
        );
      } else {
        discount = Number(coupon.value);
      }

      discount = Math.max(
        0,
        Math.min(
          subtotal,
          Math.round(discount)
        )
      );

      usedCoupon = coupon;
    }

    const total = subtotal - discount;

    const code =
      "PT-" +
      Date.now()
        .toString()
        .slice(-7) +
      Math.floor(
        10 + Math.random() * 90
      );

    const created =
      new Date().toISOString();

    const status =
      payment === "online_pending"
        ? "در انتظار پرداخت آنلاین"
        : "در انتظار بررسی";

    const statements = [
      env.DB
        .prepare(`
          INSERT INTO orders
          (
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
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          code,
          name,
          phone,
          address,
          payment,
          total,
          status,
          created,
          usedCoupon
            ? usedCoupon.code
            : null,
          discount
        )
    ];

    for (const item of normalized) {
      statements.push(
        env.DB
          .prepare(`
            INSERT INTO order_items
            (
              order_code,
              product_id,
              product_name,
              price,
              qty
            )
            VALUES (?, ?, ?, ?, ?)
          `)
          .bind(
            code,
            item.id,
            item.name,
            item.price,
            item.qty
          )
      );
    }

    if (usedCoupon) {
      statements.push(
        env.DB
          .prepare(`
            UPDATE coupons
            SET uses = uses + 1
            WHERE code = ?
            AND active = 1
            AND (
              max_uses IS NULL
              OR max_uses <= 0
              OR uses < max_uses
            )
          `)
          .bind(usedCoupon.code)
      );
    }

    await env.DB.batch(statements);

    return json({
      ok: true,
      code,
      subtotal,
      discount,
      total,
      status,
      coupon_code:
        usedCoupon
          ? usedCoupon.code
          : null
    });

  } catch (error) {
    return json(
      { error: "خطا در ثبت سفارش" },
      500
    );
  }
}

export async function onRequestGet({
  request,
  env
}) {
  const code = String(
    new URL(request.url)
      .searchParams
      .get("code") || ""
  ).trim();

  if (!code) {
    return json(
      { error: "کد سفارش لازم است" },
      400
    );
  }

  const order = await env.DB
    .prepare(`
      SELECT
        code,
        total,
        status,
        created_at
      FROM orders
      WHERE code = ?
    `)
    .bind(code)
    .first();

  if (!order) {
    return json(
      {
        error:
          "سفارشی با این کد پیدا نشد"
      },
      404
    );
  }

  return json({ order });
}

export async function onRequestPatch({
  request,
  env
}) {
  const key =
    request.headers.get("x-admin-key");

  if (
    !env.ADMIN_KEY ||
    key !== env.ADMIN_KEY
  ) {
    return json(
      { error: "Unauthorized" },
      401
    );
  }

  try {
    const body =
      await request.json();

    const code =
      String(body.code || "").trim();

    const status =
      String(body.status || "")
        .trim()
        .slice(0, 60);

    const allowed = [
      "در انتظار بررسی",
      "در حال آماده‌سازی",
      "ارسال شد",
      "تحویل شد",
      "لغو شد",
      "در انتظار پرداخت آنلاین"
    ];

    if (
      !code ||
      !allowed.includes(status)
    ) {
      return json(
        { error: "وضعیت نامعتبر است" },
        400
      );
    }

    const result = await env.DB
      .prepare(`
        UPDATE orders
        SET status = ?
        WHERE code = ?
      `)
      .bind(status, code)
      .run();

    if (!result.meta?.changes) {
      return json(
        { error: "سفارش پیدا نشد" },
        404
      );
    }

    return json({ ok: true });

  } catch (error) {
    return json(
      { error: "خطا در تغییر وضعیت" },
      500
    );
  }
        }
