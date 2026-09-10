(() => {
  let key = '';
  let editingId = null;

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
        .reduce(
          (sum, order) => sum + Number(order.total || 0),
          0
        )
        .toLocaleString('fa-IR');

    $('products').innerHTML =
      products.map(p => {

        const oldPrice = Number(p.old_price || 0);
        const currentPrice = Number(p.price || 0);

        return `
          <div class="product" style="margin-bottom:12px">

            <span>
              ${p.icon ? p.icon + ' ' : ''}

              <b>${escapeHtml(p.name)}</b>

              <br>

              <small>
                ${escapeHtml(p.cat)}
              </small>

              <br>

              ${
                oldPrice > currentPrice
                  ? `
                    <small style="text-decoration:line-through;color:#999">
                      ${money(oldPrice)} تومان
                    </small>
                    <br>
                  `
                  : ''
              }

              <b>
                ${money(currentPrice)} تومان
              </b>
            </span>

            <span>

              <button
                type="button"
                data-edit="${p.id}"
              >
                ✏️ ویرایش
              </button>

              <button
                type="button"
                data-delete="${p.id}"
              >
                🗑️ حذف
              </button>

            </span>

          </div>
        `;
      }).join('') || '<p>محصولی نیست.</p>';

    $('orders').innerHTML =
      orders.map(o => `
        <div class="product">

          <span>

            <b>${escapeHtml(o.code)}</b>
            — ${escapeHtml(o.name)}

            <br>

            <small>
              ${escapeHtml(o.phone)}
              •
              ${money(o.total)} تومان
              •
              ${escapeHtml(o.status)}
            </small>

            <br>

            <small>
              ${escapeHtml(o.address)}
            </small>

            <br>

            <select data-status="${escapeHtml(o.code)}">

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
                >
                  ${status}
                </option>
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

    document.querySelectorAll('[data-edit]')
      .forEach(button => {
        button.addEventListener('click', () => {
          editProduct(button.dataset.edit, products);
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

  function editProduct(id, products) {
  const product = products.find(p => Number(p.id) === Number(id));
  if (!product) return;

  $('name').value = product.name || '';
  $('cat').value = product.cat || '';

  ensureOldPriceField();

  // قیمت جدید باید خالی باشد
  $('price').value = '';

  // قیمت فعلی محصول برود داخل قیمت قبلی
  $('old_price').value = product.price || '';

  $('icon').value = product.icon || '';

  editingId = product.id;

  const btn = document.querySelector('#form button');
  if (btn) btn.textContent = 'ذخیره تغییرات';

  arrangePriceFields();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  }
    const product =
      products.find(p => String(p.id) === String(id));

    if (!product) return;

    editingId = product.id;

    $('name').value = product.name || '';
    $('cat').value = product.cat || '';
    $('price').value = product.price || '';
    $('icon').value = product.icon || '';

    ensureOldPriceField();

    $('old_price').value =
      product.old_price || '';

    const submitButton =
      document.querySelector('#form button');

    if (submitButton) {
      submitButton.textContent = 'ذخیره تغییرات';
    }

    const cancel =
      document.getElementById('cancelEdit');

    if (cancel) {
      cancel.hidden = false;
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function ensureOldPriceField() {
    if ($('old_price')) return;

    const priceInput = $('price');

    if (!priceInput) return;

    const input = document.createElement('input');

    input.id = 'old_price';
    input.type = 'number';
    input.min = '0';
    input.placeholder = 'قیمت قبلی (اختیاری)';

    priceInput.parentNode.insertBefore(
      input,
      priceInput.nextSibling
    );
  }

  function cancelEdit() {
    editingId = null;

    $('form').reset();

    const submitButton =
      document.querySelector('#form button');

    if (submitButton) {
      submitButton.textContent = 'افزودن';
    }

    const cancel =
      document.getElementById('cancelEdit');

    if (cancel) {
      cancel.hidden = true;
    }
  }

  async function saveProduct() {
    ensureOldPriceField();

    const body = {
      name: $('name').value,
      cat: $('cat').value,
      price: Number($('price').value),
      old_price: $('old_price').value,
      icon: $('icon').value
    };

    if (editingId !== null) {
      body.id = editingId;

      await api('/api/products', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });

    } else {

      await api('/api/products', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }

    cancelEdit();

    await load();
  }

  async function deleteProduct(id) {
    if (!confirm('این محصول حذف شود؟')) return;

    try {

      await api(
        '/api/products?id=' +
        encodeURIComponent(id),
        {
          method: 'DELETE'
        }
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

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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

  document.addEventListener(
    'DOMContentLoaded',
    () => {

      const form = $('form');

      if (!form) return;

      ensureOldPriceField();

      const cancelButton =
        document.createElement('button');

      cancelButton.type = 'button';
      cancelButton.id = 'cancelEdit';
      cancelButton.textContent = 'لغو ویرایش';
      cancelButton.hidden = true;

      cancelButton.addEventListener(
        'click',
        cancelEdit
      );

      form.appendChild(cancelButton);

      form.addEventListener(
        'submit',
        async (e) => {

          e.preventDefault();

          try {

            await saveProduct();

          } catch (err) {

            alert('خطا: ' + err.message);

          }

        }
      );

    }
  );

})();
