let key = '';
let editingId = null;

const money = n => Number(n || 0).toLocaleString('fa-IR');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

window.login = login;

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
      .map(p => {

        const oldPrice =
          Number(p.old_price || 0);

        const currentPrice =
          Number(p.price || 0);

        let priceHtml = '';

        if (oldPrice > currentPrice) {
          priceHtml = `
            <del style="
              color:#999;
              margin-left:8px;
            ">
              ${money(oldPrice)} تومان
            </del>

            <strong style="color:#e91e63;">
              ${money(currentPrice)} تومان
            </strong>
          `;
        } else {
          priceHtml = `
            <strong>
              ${money(currentPrice)} تومان
            </strong>
          `;
        }

        return `
          <div class="product">

            <span>
              ${escapeHtml(p.icon || '🛍️')}
              <b>${escapeHtml(p.name)}</b>

              <br>

              <small>
                ${escapeHtml(p.cat)}
                •
                ${priceHtml}
              </small>
            </span>

            <div style="
              display:flex;
              gap:6px;
              flex-wrap:wrap;
            ">

              <button
                type="button"
                onclick="editProduct(${p.id})"
              >
                ویرایش
              </button>

              <button
                type="button"
                onclick="del(${p.id})"
              >
                حذف
              </button>

            </div>

          </div>
        `;
      })
      .join('') || '<p>محصولی نیست.</p>';

  document.getElementById('orders').innerHTML =
    (d.orders || [])
      .map(o => `
        <div class="product">

          <span>

            <b>${escapeHtml(o.code)}</b>
            —
            ${escapeHtml(o.name)}

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

            <select
              onchange="statusChange('${escapeHtml(o.code)}',this.value)"
            >

              <option
                ${o.status === 'در انتظار بررسی' ? 'selected' : ''}
              >
                در انتظار بررسی
              </option>

              <option
                ${o.status === 'در حال آماده‌سازی' ? 'selected' : ''}
              >
                در حال آماده‌سازی
              </option>

              <option
                ${o.status === 'ارسال شد' ? 'selected' : ''}
              >
                ارسال شد
              </option>

              <option
                ${o.status === 'تحویل شد' ? 'selected' : ''}
              >
                تحویل شد
              </option>

              <option
                ${o.status === 'لغو شد' ? 'selected' : ''}
              >
                لغو شد
              </option>

              <option
                ${o.status === 'در انتظار پرداخت آنلاین' ? 'selected' : ''}
              >
                در انتظار پرداخت آنلاین
              </option>

            </select>

          </span>

        </div>
      `)
      .join('') || '<p>سفارشی نیست.</p>';
}


// =========================
// ویرایش محصول
// =========================

async function editProduct(id) {

  const r = await fetch('/api/admin', {
    headers: {
      'x-admin-key': key
    },
    cache: 'no-store'
  });

  if (!r.ok) {
    alert('خطا در دریافت اطلاعات محصول');
    return;
  }

  const d = await r.json();

  const product =
    (d.products || []).find(
      p => Number(p.id) === Number(id)
    );

  if (!product) {
    alert('محصول پیدا نشد');
    return;
  }

  editingId = product.id;

  document.getElementById('name').value =
    product.name || '';

  document.getElementById('cat').value =
    product.cat || '';

  document.getElementById('price').value =
    product.price || '';

  document.getElementById('old_price').value =
    product.old_price || '';

  document.getElementById('icon').value =
    product.icon || '';

  const submitButton =
    document.querySelector('#form button[type="submit"]');

  if (submitButton) {
    submitButton.textContent =
      'ذخیره تغییرات';
  }

  showCancelButton();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


// =========================
// دکمه لغو ویرایش
// =========================

function showCancelButton() {

  let cancelButton =
    document.getElementById('cancelEdit');

  if (!cancelButton) {

    cancelButton =
      document.createElement('button');

    cancelButton.id =
      'cancelEdit';

    cancelButton.type =
      'button';

    cancelButton.textContent =
      'لغو ویرایش';

    cancelButton.style.marginRight =
      '8px';

    cancelButton.onclick =
      cancelEdit;

    const form =
      document.getElementById('form');

    if (form) {
      form.appendChild(cancelButton);
    }
  }

  cancelButton.hidden = false;
}

function cancelEdit() {

  editingId = null;

  const form =
    document.getElementById('form');

  if (form) {
    form.reset();
  }

  const submitButton =
    document.querySelector('#form button[type="submit"]');

  if (submitButton) {
    submitButton.textContent =
      'افزودن';
  }

  const cancelButton =
    document.getElementById('cancelEdit');

  if (cancelButton) {
    cancelButton.hidden = true;
  }
}


// =========================
// حذف محصول
// =========================

async function del(id) {

  if (!confirm('این محصول حذف شود؟')) {
    return;
  }

  const r = await fetch(
    '/api/products?id=' + id,
    {
      method: 'DELETE',

      headers: {
        'x-admin-key': key
      }
    }
  );

  if (r.ok) {
    load();
  } else {
    alert('حذف محصول انجام نشد');
  }
}

window.del = del;
window.editProduct = editProduct;


// =========================
// افزودن / ویرایش محصول
// =========================

document.addEventListener('DOMContentLoaded', () => {

  const form =
    document.getElementById('form');

  const oldPriceInput =
    document.getElementById('old_price');

  // تغییر عنوان قیمت قبلی
  if (
    oldPriceInput &&
    oldPriceInput.previousElementSibling &&
    oldPriceInput.previousElementSibling.tagName === 'LABEL'
  ) {
    oldPriceInput.previousElementSibling.textContent =
      'قیمت قبلی';
  }

  if (!form) return;

  form.addEventListener('submit', async e => {

    e.preventDefault();

    const name =
      document.getElementById('name').value.trim();

    const cat =
      document.getElementById('cat').value.trim();

    const price =
      Number(
        document.getElementById('price').value
      );

    const oldPriceValue =
      document.getElementById('old_price').value.trim();

    const icon =
      document.getElementById('icon').value.trim();

    if (!name || !cat || !price) {
      alert('نام، دسته‌بندی و قیمت جدید را وارد کنید.');
      return;
    }

    const oldPrice =
      oldPriceValue
        ? Number(oldPriceValue)
        : null;

    if (
      oldPrice !== null &&
      oldPrice <= price
    ) {
      alert(
        'قیمت قبلی باید بیشتر از قیمت جدید باشد.'
      );
      return;
    }

    const data = {
      name,
      cat,
      price,
      icon
    };

    if (oldPrice !== null) {
      data.old_price = oldPrice;
    } else {
      data.old_price = null;
    }

    try {

      let r;

      // ویرایش
      if (editingId !== null) {

        r = await fetch(
          '/api/products',
          {
            method: 'PATCH',

            headers: {
              'content-type':
                'application/json',

              'x-admin-key':
                key
            },

            body: JSON.stringify({
              id: editingId,
              ...data
            })
          }
        );

      }

      // افزودن
      else {

        r = await fetch(
          '/api/products',
          {
            method: 'POST',

            headers: {
              'content-type':
                'application/json',

              'x-admin-key':
                key
            },

            body: JSON.stringify(data)
          }
        );

      }

      if (r.ok) {

        alert(
          editingId !== null
            ? 'محصول با موفقیت ویرایش شد.'
            : 'محصول با موفقیت اضافه شد.'
        );

        cancelEdit();

        load();

      } else {

        let errorText =
          'ثبت محصول انجام نشد';

        try {
          const result =
            await r.json();

          if (result.error) {
            errorText =
              result.error;
          }

        } catch (e) {}

        alert(errorText);
      }

    } catch (error) {

      console.error(error);

      alert(
        'ارتباط با سرور برقرار نشد.'
      );
    }

  });

});


// =========================
// تغییر وضعیت سفارش
// =========================

async function statusChange(code, status) {

  const r = await fetch(
    '/api/orders',
    {
      method: 'PATCH',

      headers: {
        'content-type':
          'application/json',

        'x-admin-key':
          key
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

    alert(
      'تغییر وضعیت انجام نشد'
    );
  }
}

window.statusChange =
  statusChange;
