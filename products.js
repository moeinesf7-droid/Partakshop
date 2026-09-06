export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(`SELECT id,name,cat,price,icon FROM products WHERE active=1 ORDER BY id DESC`).all();
  return Response.json({ products: rows.results || [] });
}

export async function onRequestPost({ request, env }) {
  const key = request.headers.get('x-admin-key');
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return Response.json({error:'Unauthorized'}, {status:401});
  const body = await request.json();
  const name = String(body.name||'').trim();
  const cat = String(body.cat||'').trim();
  const price = Number(body.price);
  const icon = String(body.icon||'🛍️').trim().slice(0,8);
  if (!name || !cat || !Number.isFinite(price) || price < 0) return Response.json({error:'Invalid product'}, {status:400});
  const result = await env.DB.prepare(`INSERT INTO products(name,cat,price,icon,active) VALUES(?,?,?,?,1)`).bind(name,cat,Math.round(price),icon).run();
  return Response.json({ok:true,id:result.meta.last_row_id});
}

export async function onRequestDelete({ request, env }) {
  const key = request.headers.get('x-admin-key');
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return Response.json({error:'Unauthorized'}, {status:401});
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  if (!Number.isInteger(id)) return Response.json({error:'Invalid id'}, {status:400});
  await env.DB.prepare(`UPDATE products SET active=0 WHERE id=?`).bind(id).run();
  return Response.json({ok:true});
}
