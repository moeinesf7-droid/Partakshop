function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
function cleanPhone(v){return String(v||'').replace(/[^0-9+]/g,'').slice(0,20)}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const name = String(body.name||'').trim().slice(0,100);
    const phone = cleanPhone(body.phone);
    const address = String(body.address||'').trim().slice(0,500);
    const payment = body.payment === 'online' ? 'online_pending' : 'cod';
    const items = Array.isArray(body.items) ? body.items : [];
    if (!name || phone.length < 7 || !address || !items.length) return json({error:'اطلاعات سفارش ناقص است'},400);

    const ids = [...new Set(items.map(x=>Number(x.id)).filter(Number.isInteger))];
    if (!ids.length) return json({error:'محصول نامعتبر است'},400);
    const placeholders = ids.map(()=>'?').join(',');
    const result = await env.DB.prepare(`SELECT id,name,price,active FROM products WHERE active=1 AND id IN (${placeholders})`).bind(...ids).all();
    const byId = new Map((result.results||[]).map(p=>[Number(p.id),p]));
    const normalized = [];
    let total = 0;
    for (const raw of items) {
      const id = Number(raw.id); const qty = Math.max(1, Math.min(20, Number(raw.qty)||1));
      const p = byId.get(id); if (!p) return json({error:'یکی از محصولات دیگر موجود نیست'},400);
      normalized.push({id, name:p.name, price:Number(p.price), qty});
      total += Number(p.price) * qty;
    }
    const code = 'PT-' + Date.now().toString().slice(-7) + Math.floor(10+Math.random()*90);
    const created = new Date().toISOString();
    const status = payment==='online_pending' ? 'در انتظار پرداخت آنلاین' : 'در انتظار بررسی';
    const statements = [env.DB.prepare(`INSERT INTO orders(code,name,phone,address,payment,total,status,created_at) VALUES(?,?,?,?,?,?,?,?)`)
      .bind(code,name,phone,address,payment,total,status,created)];
    for (const item of normalized) {
      statements.push(env.DB.prepare(`INSERT INTO order_items(order_code,product_id,product_name,price,qty) VALUES(?,?,?,?,?)`)
        .bind(code,item.id,item.name,item.price,item.qty));
    }
    await env.DB.batch(statements);
    return json({ok:true,code,total,status});
  } catch (e) { return json({error:'خطا در ثبت سفارش'},500); }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = String(url.searchParams.get('code')||'').trim();
  if (!code) return json({error:'کد سفارش لازم است'},400);
  const order = await env.DB.prepare(`SELECT code,total,status,created_at FROM orders WHERE code=?`).bind(code).first();
  if (!order) return json({error:'سفارشی با این کد پیدا نشد'},404);
  return json({order});
}


export async function onRequestPatch({ request, env }) {
  const key = request.headers.get('x-admin-key');
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({error:'Unauthorized'},401);
  try {
    const body = await request.json();
    const code = String(body.code||'').trim();
    const status = String(body.status||'').trim().slice(0,60);
    const allowed = ['در انتظار بررسی','در حال آماده‌سازی','ارسال شد','تحویل شد','لغو شد','در انتظار پرداخت آنلاین'];
    if (!code || !allowed.includes(status)) return json({error:'وضعیت نامعتبر است'},400);
    const result = await env.DB.prepare(`UPDATE orders SET status=? WHERE code=?`).bind(status,code).run();
    if (!result.meta?.changes) return json({error:'سفارش پیدا نشد'},404);
    return json({ok:true});
  } catch(e) { return json({error:'خطا در تغییر وضعیت'},500); }
}
