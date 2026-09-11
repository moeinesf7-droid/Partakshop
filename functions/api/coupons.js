function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function checkAdmin(request, env) {
  return !!env.ADMIN_KEY &&
    request.headers.get("x-admin-key") === env.ADMIN_KEY;
}

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 40);
}

function validCoupon(coupon) {
  if (!coupon || Number(coupon.active) !== 1) return false;

  if (
    coupon.expires_at &&
    new Date(coupon.expires_at).getTime() < Date.now()
  ) {
    return false;
  }

  if (
    coupon.max_uses !== null &&
    coupon.max_uses !== undefined &&
    Number(coupon.max_uses) > 0 &&
    Number(coupon.uses || 0) >= Number(coupon.max_uses)
  ) {
    return false;
  }

  return true;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  const code = normalizeCode(
    url.searchParams.get("code")
  );

  const subtotal = Math.max(
    0,
    Math.round(
      Number(url.searchParams.get("subtotal") || 0)
    )
  );

  if (
    !code ||
    !Number.isFinite(subtotal) ||
    subtotal <= 0
  ) {
    return json(
      { error: "کد تخفیف یا مبلغ نامعتبر است" },
      400
    );
  }

  try {
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
      .bind(code)
      .first();

    if (!validCoupon(coupon)) {
      return json(
        { error: "کد تخفیف معتبر نیست یا منقضی شده است" },
        400
      );
    }

    let discount;

    if (coupon.type === "percent") {
      discount =
        Math.floor(
          subtotal * Number(coupon.value) / 100
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

    return json({
      ok: true,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount,
      total: subtotal - discount
    });

  } catch (error) {
    return json(
      { error: "خطا در بررسی کد تخفیف" },
      500
    );
  }
}

export async function onRequestPost({ request, env }) {
  if (!checkAdmin(request, env)) {
    return json(
      { error: "Unauthorized" },
      401
    );
  }

  try {
    const body = await request.json();

    const code = normalizeCode(body.code);

    const type =
      body.type === "fixed"
        ? "fixed"
        : "percent";

    const value =
      Math.round(Number(body.value));

    const maxUses =
      (
        body.max_uses === "" ||
        body.max_uses === null ||
        body.max_uses === undefined
      )
        ? null
        : Math.round(Number(body.max_uses));

    const expiresAt =
      String(body.expires_at || "").trim() || null;

    const active =
      body.active === false ? 0 : 1;

    if (
      !code ||
      !/^[A-Z0-9_-]+$/.test(code) ||
      !Number.isFinite(value) ||
      value <= 0 ||
      (
        type === "percent" &&
        value > 100
      ) ||
      (
        maxUses !== null &&
        (
          !Number.isFinite(maxUses) ||
          maxUses < 1
        )
      )
    ) {
      return json(
        { error: "اطلاعات کد تخفیف نامعتبر است" },
        400
      );
    }

    await env.DB
      .prepare(`
        INSERT INTO coupons
        (
          code,
          type,
          value,
          expires_at,
          max_uses,
          uses,
          active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        code,
        type,
        value,
        expiresAt,
        maxUses,
        0,
        active
      )
      .run();

    return json({
      ok: true,
      code
    });

  } catch (error) {
    return json(
      {
        error: String(error).includes("UNIQUE")
          ? "این کد قبلاً ثبت شده است"
          : "ثبت کد تخفیف انجام نشد"
      },
      400
    );
  }
}

export async function onRequestPatch({ request, env }) {
  if (!checkAdmin(request, env)) {
    return json(
      { error: "Unauthorized" },
      401
    );
  }

  try {
    const body = await request.json();

    const code = normalizeCode(body.code);

    const active =
      body.active ? 1 : 0;

    if (!code) {
      return json(
        { error: "کد نامعتبر است" },
        400
      );
    }

    const result = await env.DB
      .prepare(`
        UPDATE coupons
        SET active = ?
        WHERE code = ?
      `)
      .bind(active, code)
      .run();

    if (!result.meta?.changes) {
      return json(
        { error: "کد پیدا نشد" },
        404
      );
    }

    return json({
      ok: true
    });

  } catch (error) {
    return json(
      { error: "تغییر کد انجام نشد" },
      500
    );
  }
}

export async function onRequestDelete({ request, env }) {
  if (!checkAdmin(request, env)) {
    return json(
      { error: "Unauthorized" },
      401
    );
  }

  try {
    const url = new URL(request.url);

    const code = normalizeCode(
      url.searchParams.get("code")
    );

    if (!code) {
      return json(
        { error: "کد نامعتبر است" },
        400
      );
    }

    const result = await env.DB
      .prepare(`
        DELETE FROM coupons
        WHERE code = ?
      `)
      .bind(code)
      .run();

    if (!result.meta?.changes) {
      return json(
        { error: "کد پیدا نشد" },
        404
      );
    }

    return json({
      ok: true
    });

  } catch (error) {
    return json(
      { error: "حذف کد انجام نشد" },
      500
    );
  }
             }
