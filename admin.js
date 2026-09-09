(() => {
  let key = '';

  const $ = (id) => document.getElementById(id);

  const money = (n) =>
    Number(n || 0).toLocaleString('fa-IR');

  async function api(path, options = {}) {
    const res = await fetch(path, {
      cache: 'no-store',
      ...options,
      headers: {
        ...(options.headers || {}),
        'x-admin-key': key
      }
    });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {}

    if (!res.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    return data;
  }

  async function load() {
    try {
      const data = await api('/api/admin');

      render(data);

      $('panel').hidden = false;
      $('loginMsg').textContent = 'ورود موفق ✓';
      $('loginMsg').style.color = '#18864b';

      return true;
    } catch (err) {
      $('panel').hidden = true;
      $('loginMsg').textContent = 'خطا: ' + err.message;
      $('loginMsg').style.color = '#c62828';

      return false;
    }
  }

  function render(data) {
    const products = data.products || [];
    const orders = data.orders || [];

    $('items').textContent =
      products.length.toLocaleString('fa-IR');

    $('ordersCount').textContent =
      orders.length.toLocaleString('fa-IR');

    $('sales').textContent =
      orders
        .reduce((sum, order) => sum + Number(order.total || 0), 0)
        .toLocaleString('fa-IR');

    $('products').innerHTML =
      products.map(p => `
        <div class="product">
          <span>
            ${p.icon || '🛍️'}
            <b>${p.name}</b><br>
            <small>
              ${p.cat} • ${money(p.price)} تومان
            </small>
          </span>

          <button type="button" data-delete="${p.id}">
            حذف
          </button>
        </div>
      `).join('') || '<p>محصولی نیست.</p>';

    $('orders').innerHTML =
      orders.map(o => `
        <div class="product">
          <span>
            <b>${o.code}</b> — ${o.name}<br>

            <small>
              ${o.phone} •
              ${money(o.total)} تومان •
              ${o.status}
            </small>

            <br>

            <small>${o.address}</small>

            <br>

            <select data-status="${o.code}">
              ${[
                'در انتظار بررسی',
                'در حال آماده‌سازی',
                'ارسال شد',
                'تحویل شد',
                'لغو شد',
                'در انتظار پرداخت آنلاین'
              ].map(status => `
                <option
                  ${o.status === status ? 'selected' : ''}
                >${status}</option>
              `).join('')}
            </select>
          </span>
        </div>
      `).join('') || '<p>سفارشی نیست.</p>';

    document.querySelectorAll('[data-delete]')
      .forEach(button => {
        button.addEventListener('click', () => {
          deleteProduct(button.dataset.delete);
        });
      });

    document.querySelectorAll('[data-status]')
      .forEach(select => {
        select.addEventListener('change', () => {
          statusChange(
            select.dataset.status,
            select.value
          );
        });
      });
  }

  async function deleteProduct(id) {
    if (!confirm('این محصول حذف شود؟')) return;

    try {
      await api(
        '/api/products?id=' + encodeURIComponent(id),
        { method: 'DELETE' }
      );

      await load();
    } catch (err) {
      alert('خطا: ' + err.message);
    }
  }

  async function statusChange(code, status) {
    try {
      await api('/api/orders', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          code,
          status
        })
      });

      await load();
    } catch (err) {
      alert('خطا: ' + err.message);
    }
  }

  // دکمه ورود
  window.login = async function () {
    key = $('adminKey').value.trim();

    if (!key) {
      $('loginMsg').textContent =
        'کلید مدیر را وارد کنید.';
      $('loginMsg').style.color = '#c62828';
      return;
    }

    $('loginMsg').textContent =
      'در حال بررسی...';

    $('loginMsg').style.color = '#555';

    const button =
      document.querySelector('button');

    if (button) button.disabled = true;

    await load();

    if (button) button.disabled = false;
  };

  // فرم افزودن محصول
  document.addEventListener('DOMContentLoaded', () => {

    const form = $('form');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        await api('/api/products', {
          method: 'POST',

          headers: {
            'content-type': 'application/json'
          },

          body: JSON.stringify({
            name: $('name').value,
            cat: $('cat').value,
            price: Number($('price').value),
            icon: $('icon').value
          })
        });

        form.reset();

        await load();

      } catch (err) {
        alert('خطا: ' + err.message);
      }
    });

  });

})();
