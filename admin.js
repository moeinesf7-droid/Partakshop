let key = '';

const money = n => Number(n).toLocaleString('fa-IR');

function login() {
  key = document.getElementById('adminKey').value.trim();

  if (!key) return;

  load().then(ok => {
    if (ok) {
      document.getElementById('panel').hidden = false;
      document.getElementById('loginMsg').textContent = 'ورود موفق';
    } else {
      document.getElementById('loginMsg').textContent =
        'کلید مدیر نادرست است';
    }
  });
}

async function load() {
  try {
    const r = await fetch('/api/admin', {
      headers: {
        'x-admin-key': key
      },
      cache: 'no-store'
    });

    if (!r.ok) return false;

    const d = await r.json();

    render(d);

    return true;

  } catch (e) {

    document.getElementById('loginMsg').textContent =
      'ارتباط با سرور برقرار نشد';

    return false;
  }
}

function render(d) {

  document.getElementById('items').textContent =
    (d.products || []).length.toLocaleString('fa-IR');

  document.getElementById('ordersCount').textContent =
    (d.orders || []).length.toLocaleString('fa-IR');

  document.getElementById('sales').textContent =
    (d.orders || [])
      .reduce((a, o) => a + Number(o.total || 0), 0)
      .toLocaleString('fa-IR');

  document.getElementById('products').innerHTML =
    (d.products || [])
      .map(p => `
        <div class="product">
          <span>
            ${p.icon || '🛍️'}
            <b>${p.name}</b>
            <br>
            <small>
              ${p.cat} • ${money(p.price)} تومان
            </small>
          </span>

          <button onclick="del(${p.id})">
            حذف
          </button>
        </div>
      `)
      .join('') || '<p>محصولی نیست.</p>';

  document.getElementById('orders').innerHTML =
    (d.orders || [])
      .map(o => `
        <div class="product">
          <span>
            <b>${o.code}</b> — ${o.name}
            <br>
            <small>
              ${o.phone} • ${money(o.total)} تومان • ${o.status}
            </small>
            <br>
            <small>${o.address}</small>
            <br>

            <select onchange="statusChange('${o.code}',this.value)">

              <option ${o.status === 'در انتظار بررسی' ? 'selected' : ''}>
                در انتظار بررسی
              </option>

              <option ${o.status === 'در حال آماده‌سازی' ? 'selected' : ''}>
                در حال آماده‌سازی
              </option>

              <option ${o.status === 'ارسال شد' ? 'selected' : ''}>
                ارسال شد
              </option>

              <option ${o.status === 'تحویل شد' ? 'selected' : ''}>
                تحویل شد
              </option>

              <option ${o.status === 'لغو شد' ? 'selected' : ''}>
                لغو شد
              </option>

              <option ${o.status === 'در انتظار پرداخت آنلاین' ? 'selected' : ''}>
                در انتظار پرداخت آنلاین
              </option>

            </select>
          </span>
        </div>
      `)
      .join('') || '<p>سفارشی نیست.</p>';
}

async function del(id) {

  if (!confirm('این محصول حذف شود؟')) return;

  const r = await fetch(
    '/api/products?id=' + id,
    {
      method: 'DELETE',
      headers: {
        'x-admin-key': key
      }
    }
  );

  if (r.ok) load();
}

form.onsubmit = async e => {

  e.preventDefault();

  const r = await fetch(
    '/api/products',
    {
      method: 'POST',

      headers: {
        'content-type': 'application/json',
        'x-admin-key': key
      },

      body: JSON.stringify({
        name: name.value,
        cat: cat.value,
        price: Number(price.value),
        icon: icon.value
      })
    }
  );

  if (r.ok) {

    e.target.reset();

    load();

  } else {

    alert('ثبت محصول انجام نشد');
  }
};

async function statusChange(code, status) {

  const r = await fetch(
    '/api/orders',
    {
      method: 'PATCH',

      headers: {
        'content-type': 'application/json',
        'x-admin-key': key
      },

      body: JSON.stringify({
        code,
        status
      })
    }
  );

  if (r.ok) {

    load();

  } else {

    alert('تغییر وضعیت انجام نشد');
  }
}
