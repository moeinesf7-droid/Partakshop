let key = "";
let editingId = null;

const money = n =>
  Number(n || 0).toLocaleString("fa-IR");

const $ = id => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function login() {
  key = $("adminKey").value.trim();

  if (!key) {
    alert("کلید مدیریت را وارد کنید");
    return;
  }

  load();
}

async function load() {
  try {
    const res = await fetch("/api/admin", {
      headers: {
        "x-admin-key": key
      }
    });

    if (!res.ok) {
      alert("کلید مدیریت صحیح نیست");
      return;
    }

    const data = await res.json();
    render(data);

  } catch (err) {
    console.error(err);
    alert("خطا در ارتباط با سرور");
  }
}

function render(data) {
  const products = data.products || [];
  const orders = data.orders || [];

  $("products").innerHTML = products.map(p => {

    const oldPrice =
      p.old_price &&
      Number(p.old_price) > Number(p.price)
        ? `<del>${money(p.old_price)} تومان</del> `
        : "";

    return `
      <div class="product" style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        margin:10px 0;
        padding:12px;
        border:1px solid #eee;
        border-radius:12px;
      ">

        <span>
          ${escapeHtml(p.icon || "🛍️")}
          <b>${escapeHtml(p.name)}</b>
          <br>
          <small>
            ${escapeHtml(p.cat || "")}
            •
            ${oldPrice}
            <strong>${money(p.price)} تومان</strong>
          </small>
        </span>

        <span style="display:flex;gap:6px;">

          <button
            type="button"
            onclick="editProduct(${p.id})"
            style="
              background:#ff8fab;
              color:white;
              border:0;
              border-radius:8px;
              padding:7px 12px;
            "
          >
            ویرایش
          </button>

          <button
            type="button"
            onclick="del(${p.id})"
            style="
              background:#e74c3c;
              color:white;
              border:0;
              border-radius:8px;
              padding:7px 12px;
            "
          >
            حذف
          </button>

        </span>
      </div>
    `;
  }).join("");

  $("orders").innerHTML = orders.map(o => `
    <div class="order" style="
      padding:12px;
      margin:10px 0;
      border:1px solid #eee;
      border-radius:12px;
    ">

      <b>کد سفارش: ${escapeHtml(o.code)}</b>
      <br>

      <small>
        ${escapeHtml(o.name || "")}
        •
        ${escapeHtml(o.phone || "")}
      </small>

      <br>

      <strong>
        ${money(o.total)} تومان
      </strong>

      <br><br>

      <select
        onchange="changeOrderStatus('${escapeHtml(o.code)}', this.value)"
      >
        <option value="در انتظار بررسی"
          ${o.status === "در انتظار بررسی" ? "selected" : ""}>
          در انتظار بررسی
        </option>

        <option value="تایید شده"
          ${o.status === "تایید شده" ? "selected" : ""}>
          تایید شده
        </option>

        <option value="در حال ارسال"
          ${o.status === "در حال ارسال" ? "selected" : ""}>
          در حال ارسال
        </option>

        <option value="تحویل شده"
          ${o.status === "تحویل شده" ? "selected" : ""}>
          تحویل شده
        </option>

        <option value="لغو شده"
          ${o.status === "لغو شده" ? "selected" : ""}>
          لغو شده
        </option>
      </select>

    </div>
  `).join("");
}


/* =========================
   ویرایش محصول
========================= */

async function editProduct(id) {
  try {
    const res = await fetch("/api/admin", {
      headers: {
        "x-admin-key": key
      }
    });

    if (!res.ok) {
      alert("دسترسی مدیریت منقضی شده است");
      return;
    }

    const data = await res.json();

    const product = (data.products || [])
      .find(p => Number(p.id) === Number(id));

    if (!product) {
      alert("محصول پیدا نشد");
      return;
    }

    editingId = product.id;

    $("name").value = product.name || "";
    $("cat").value = product.cat || "";

    /*
      بسیار مهم:

      price = قیمت جدید
      old_price = قیمت قبلی
    */

    $("price").value = product.price ?? "";
    $("old_price").value = product.old_price ?? "";

    $("icon").value = product.icon || "";

    const submitBtn =
      document.querySelector("form button[type='submit']");

    if (submitBtn) {
      submitBtn.textContent = "ذخیره تغییرات";
    }

    let cancelBtn = $("cancelEdit");

    if (!cancelBtn) {
      cancelBtn = document.createElement("button");

      cancelBtn.id = "cancelEdit";
      cancelBtn.type = "button";
      cancelBtn.textContent = "لغو ویرایش";

      cancelBtn.style.marginRight = "8px";

      cancelBtn.onclick = cancelEdit;

      if (submitBtn) {
        submitBtn.parentNode.appendChild(cancelBtn);
      }
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  } catch (err) {
    console.error(err);
    alert("خطا در دریافت اطلاعات محصول");
  }
}


/* =========================
   لغو ویرایش
========================= */

function cancelEdit() {
  editingId = null;

  const form = document.querySelector("form");

  if (form) {
    form.reset();
  }

  const submitBtn =
    document.querySelector("form button[type='submit']");

  if (submitBtn) {
    submitBtn.textContent = "افزودن محصول";
  }

  const cancelBtn = $("cancelEdit");

  if (cancelBtn) {
    cancelBtn.remove();
  }
}


/* =========================
   حذف محصول
========================= */

async function del(id) {
  if (!confirm("آیا از حذف این محصول مطمئن هستید؟")) {
    return;
  }

  try {
    const res = await fetch("/api/products", {
      method: "DELETE",

      headers: {
        "Content-Type": "application/json",
        "x-admin-key": key
      },

      body: JSON.stringify({
        id: Number(id)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "حذف محصول انجام نشد");
      return;
    }

    alert("محصول حذف شد");

    load();

  } catch (err) {
    console.error(err);
    alert("خطا در حذف محصول");
  }
}


/* =========================
   افزودن / ویرایش محصول
========================= */

const form = document.querySelector("form");

if (form) {

  form.onsubmit = async e => {

    e.preventDefault();

    const name =
      $("name").value.trim();

    const cat =
      $("cat").value.trim();

    /*
      قیمت جدید
    */
    const price =
      Number($("price").value);

    /*
      قیمت قبلی - اختیاری
    */
    const oldPriceText =
      $("old_price").value.trim();

    const old_price =
      oldPriceText === ""
        ? null
        : Number(oldPriceText);

    const icon =
      $("icon").value.trim();


    /* بررسی نام */
    if (!name) {
      alert("نام محصول را وارد کنید");
      return;
    }

    /* بررسی قیمت جدید */
    if (!price || price <= 0) {
      alert("قیمت جدید را درست وارد کنید");
      return;
    }

    /*
      اگر قیمت قبلی وارد شده باشد
      باید از قیمت جدید بیشتر باشد
    */
    if (
      old_price !== null &&
      (
        !Number.isFinite(old_price) ||
        old_price <= price
      )
    ) {
      alert(
        "قیمت قبلی باید بیشتر از قیمت جدید باشد"
      );
      return;
    }


    const productData = {
      name: name,
      cat: cat,
      price: price,
      old_price: old_price,
      icon: icon
    };


    try {

      let res;

      /* =====================
         حالت ویرایش
      ===================== */

      if (editingId !== null) {

        res = await fetch("/api/products", {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            "x-admin-key": key
          },

          body: JSON.stringify({
            id: Number(editingId),
            ...productData
          })
        });

      }

      /* =====================
         حالت افزودن
      ===================== */

      else {

        res = await fetch("/api/products", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "x-admin-key": key
          },

          body: JSON.stringify(productData)
        });

      }


      const data = await res.json();

      if (!res.ok) {
        alert(
          data.error ||
          "ذخیره محصول انجام نشد"
        );
        return;
      }


      if (editingId !== null) {
        alert("محصول با موفقیت ویرایش شد");
      } else {
        alert("محصول با موفقیت اضافه شد");
      }


      cancelEdit();

      load();

    } catch (err) {

      console.error(err);

      alert(
        "خطا در ارتباط با سرور"
      );
    }

  };

}


/* =========================
   تغییر وضعیت سفارش
========================= */

async function changeOrderStatus(code, status) {

  try {

    const res = await fetch("/api/orders", {

      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
        "x-admin-key": key
      },

      body: JSON.stringify({
        code: code,
        status: status
      })

    });

    const data = await res.json();

    if (!res.ok) {
      alert(
        data.error ||
        "تغییر وضعیت سفارش انجام نشد"
      );
      return;
    }

    load();

  } catch (err) {

    console.error(err);

    alert(
      "خطا در تغییر وضعیت سفارش"
    );
  }
      }
