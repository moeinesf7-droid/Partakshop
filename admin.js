let key = "";
let editingId = null;

const $ = (id) => document.getElementById(id);

const money = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString("fa-IR");
};

function showMessage(message, type = "info") {
  let box = $("adminMessage");

  if (!box) {
    box = document.createElement("div");
    box.id = "adminMessage";
    box.style.cssText = `
      margin:12px 0;
      padding:12px;
      border-radius:12px;
      text-align:center;
      font-size:14px;
    `;

    const form = document.querySelector("form");
    if (form) {
      form.parentNode.insertBefore(box, form);
    } else {
      document.body.prepend(box);
    }
  }

  box.textContent = message;

  if (type === "error") {
    box.style.background = "#ffe5e5";
    box.style.color = "#a00000";
  } else if (type === "success") {
    box.style.background = "#e5f8e9";
    box.style.color = "#176b2c";
  } else {
    box.style.background = "#eeeeee";
    box.style.color = "#333";
  }
}


/* =========================
   ورود مدیر
========================= */

async function login() {
  const input = $("adminKey");

  if (!input) {
    alert("کادر کلید مدیر پیدا نشد.");
    return;
  }

  key = input.value.trim();

  if (!key) {
    $("loginMsg").textContent = "کلید مدیر را وارد کنید";
    return;
  }

  try {
    const res = await fetch("/api/admin", {
      method: "GET",
      headers: {
        "x-admin-key": key
      },
      cache: "no-store"
    });

    if (!res.ok) {
      $("loginMsg").textContent = "کلید مدیر نادرست است";
      return;
    }

    const data = await res.json();

    if ($("panel")) {
      $("panel").hidden = false;
    }

    $("loginMsg").textContent = "ورود موفق";

    render(data);

    showMessage("پنل مدیریت آماده است", "success");

  } catch (err) {
    console.error(err);
    $("loginMsg").textContent = "ارتباط با سرور برقرار نشد";
  }
}


/* =========================
   دریافت اطلاعات
========================= */

async function load() {
  if (!key) return false;

  try {
    const res = await fetch("/api/admin", {
      method: "GET",
      headers: {
        "x-admin-key": key
      },
      cache: "no-store"
    });

    if (!res.ok) {
      showMessage("دریافت اطلاعات از سرور انجام نشد", "error");
      return false;
    }

    const data = await res.json();

    render(data);

    return true;

  } catch (err) {
    console.error(err);
    showMessage("خطا در ارتباط با سرور", "error");
    return false;
  }
}


/* =========================
   نمایش اطلاعات
========================= */

function render(data) {
  const products = Array.isArray(data.products)
    ? data.products
    : [];

  const orders = Array.isArray(data.orders)
    ? data.orders
    : [];


  /* تعداد محصولات */

  const productCount =
    $("productCount") ||
    $("productsCount") ||
    $("statProducts");

  if (productCount) {
    productCount.textContent = products.length;
  }


  /* تعداد سفارش */

  const orderCount =
    $("orderCount") ||
    $("ordersCount") ||
    $("statOrders");

  if (orderCount) {
    orderCount.textContent = orders.length;
  }


  /* فروش */

  let totalSales = 0;

  orders.forEach(order => {
    const status = String(order.status || "");

    if (
      status.includes("تکمیل") ||
      status.includes("پرداخت") ||
      status === "completed"
    ) {
      totalSales += Number(order.total || 0);
    }
  });

  const salesBox =
    $("sales") ||
    $("salesTotal") ||
    $("statSales");

  if (salesBox) {
    salesBox.innerHTML =
      `${money(totalSales)}<br><span style="font-size:14px">تومان</span>`;
  }


  /* محصولات */

  const productsBox = $("products");

  if (productsBox) {

    if (products.length === 0) {
      productsBox.innerHTML = `
        <div style="
          text-align:center;
          padding:25px;
          color:#777;
        ">
          هنوز محصولی ثبت نشده است.
        </div>
      `;
    } else {

      productsBox.innerHTML = products.map(product => {

        const icon = product.icon || "🛍️";

        return `
          <div style="
            background:#fff;
            border:1px solid #eee;
            border-radius:16px;
            padding:16px;
            margin:12px 0;
          ">

            <div style="
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:10px;
            ">

              <div>
                <div style="
                  font-size:18px;
                  font-weight:bold;
                  margin-bottom:8px;
                ">
                  ${escapeHtml(icon)}
                  ${escapeHtml(product.name || "")}
                </div>

                <div style="
                  color:#777;
                  margin-bottom:8px;
                ">
                  ${escapeHtml(product.cat || "")}
                </div>

                <div style="
                  font-weight:bold;
                ">
                  ${money(product.price)}
                  تومان
                </div>
              </div>

              <div style="
                display:flex;
                flex-direction:column;
                gap:8px;
              ">

                <button
                  type="button"
                  onclick="editProduct(${Number(product.id)})"
                  style="
                    padding:9px 14px;
                    border:0;
                    border-radius:10px;
                    cursor:pointer;
                  "
                >
                  ویرایش
                </button>

                <button
                  type="button"
                  onclick="deleteProduct(${Number(product.id)})"
                  style="
                    padding:9px 14px;
                    border:0;
                    border-radius:10px;
                    cursor:pointer;
                  "
                >
                  حذف
                </button>

              </div>

            </div>

          </div>
        `;

      }).join("");
    }
  }


  /* =========================
     سفارش‌ها
  ========================= */

  const ordersBox =
    $("orders") ||
    $("recentOrders");

  if (ordersBox) {

    if (orders.length === 0) {

      ordersBox.innerHTML = `
        <div style="
          text-align:center;
          padding:25px;
          color:#777;
        ">
          هنوز سفارشی ثبت نشده است.
        </div>
      `;

    } else {

      ordersBox.innerHTML = orders.map(order => {

        return `
          <div style="
            background:#fff;
            border:1px solid #eee;
            border-radius:16px;
            padding:15px;
            margin:10px 0;
          ">

            <div>
              <strong>
                ${escapeHtml(order.code || "")}
              </strong>
            </div>

            <div>
              ${escapeHtml(order.name || "")}
            </div>

            <div>
              ${money(order.total)}
              تومان
            </div>

            <div style="
              margin-top:8px;
              color:#777;
            ">
              وضعیت:
              ${escapeHtml(order.status || "در انتظار بررسی")}
            </div>

          </div>
        `;

      }).join("");
    }
  }
}


/* =========================
   افزودن / ویرایش محصول
========================= */

const form = document.querySelector("form");

if (form) {

  form.addEventListener("submit", async function(e) {

    e.preventDefault();

    if (!key) {
      alert("ابتدا وارد پنل مدیریت شوید.");
      return;
    }

    const nameInput = $("name");
    const catInput = $("cat");
    const priceInput = $("price");
    const iconInput = $("icon");

    const name = nameInput
      ? nameInput.value.trim()
      : "";

    const cat = catInput
      ? catInput.value.trim()
      : "";

    const price = priceInput
      ? Number(priceInput.value)
      : 0;

    const icon = iconInput
      ? iconInput.value.trim()
      : "";


    if (!name) {
      alert("نام محصول را وارد کنید.");
      return;
    }

    if (!cat) {
      alert("دسته‌بندی را وارد کنید.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert("قیمت را درست وارد کنید.");
      return;
    }


    const productData = {
      name: name,
      cat: cat,
      price: price,
      icon: icon
    };


    try {

      let res;

      /* ویرایش */

      if (editingId) {

        res = await fetch(
          "/api/products?id=" + encodeURIComponent(editingId),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": key
            },
            body: JSON.stringify(productData)
          }
        );

      }

      /* افزودن محصول جدید */

      else {

        res = await fetch(
          "/api/products",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": key
            },
            body: JSON.stringify(productData)
          }
        );

      }


      const text = await res.text();

      let result = {};

      try {
        result = JSON.parse(text);
      } catch (_) {}


      if (!res.ok) {

        console.error(
          "API ERROR:",
          res.status,
          result
        );

        alert(
          result.error ||
          `خطا در ثبت محصول (${res.status})`
        );

        return;
      }


      /* موفق */

      showMessage(
        editingId
          ? "محصول با موفقیت ویرایش شد ✅"
          : "محصول با موفقیت اضافه شد ✅",
        "success"
      );


      editingId = null;


      form.reset();


      const button =
        form.querySelector(
          "button[type='submit']"
        );

      if (button) {
        button.textContent = "افزودن محصول";
      }


      await load();


    } catch (err) {

      console.error(err);

      alert(
        "خطا در ارتباط با سرور.\nلطفاً دوباره امتحان کنید."
      );

    }

  });
}


/* =========================
   ویرایش محصول
========================= */

async function editProduct(id) {

  try {

    const res = await fetch("/api/products", {
      cache: "no-store"
    });

    if (!res.ok) {
      alert("دریافت محصولات انجام نشد.");
      return;
    }

    const data = await res.json();

    const products =
      Array.isArray(data.products)
        ? data.products
        : [];

    const product =
      products.find(
        p => Number(p.id) === Number(id)
      );

    if (!product) {
      alert("محصول پیدا نشد.");
      return;
    }


    if ($("name")) {
      $("name").value =
        product.name || "";
    }

    if ($("cat")) {
      $("cat").value =
        product.cat || "";
    }

    if ($("price")) {
      $("price").value =
        product.price || "";
    }

    if ($("icon")) {
      $("icon").value =
        product.icon || "";
    }


    editingId = id;


    const button =
      form &&
      form.querySelector(
        "button[type='submit']"
      );

    if (button) {
      button.textContent =
        "ذخیره ویرایش";
    }


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });


  } catch (err) {

    console.error(err);

    alert("خطا در دریافت اطلاعات محصول.");

  }
}


/* =========================
   حذف محصول
========================= */

async function deleteProduct(id) {

  if (!key) {
    alert("ابتدا وارد پنل مدیریت شوید.");
    return;
  }

  const ok = confirm(
    "آیا از حذف این محصول مطمئن هستید؟"
  );

  if (!ok) return;


  try {

    const res = await fetch(
      "/api/products?id=" +
      encodeURIComponent(id),
      {
        method: "DELETE",
        headers: {
          "x-admin-key": key
        }
      }
    );


    const text = await res.text();

    let result = {};

    try {
      result = JSON.parse(text);
    } catch (_) {}


    if (!res.ok) {

      alert(
        result.error ||
        `حذف محصول انجام نشد (${res.status})`
      );

      return;
    }


    showMessage(
      "محصول با موفقیت حذف شد ✅",
      "success"
    );


    await load();


  } catch (err) {

    console.error(err);

    alert("خطا در حذف محصول.");

  }
}


/* =========================
   امنیت نمایش متن
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================
   دکمه ورود
========================= */

const loginButton =
  document.querySelector(
    "button[onclick='login()']"
  );

if (loginButton) {

  loginButton.addEventListener(
    "click",
    function() {
      login();
    }
  );

}


/* =========================
   نمایش تومان کنار قیمت
========================= */

const priceInput = $("price");

if (priceInput) {

  const parent = priceInput.parentElement;

  if (
    parent &&
    !parent.querySelector(".price-unit")
  ) {

    const unit = document.createElement("span");

    unit.className = "price-unit";

    unit.textContent = "تومان";

    unit.style.cssText = `
      margin-right:8px;
      font-weight:bold;
      white-space:nowrap;
    `;

    parent.style.display = "flex";
    parent.style.alignItems = "center";

    parent.appendChild(unit);
  }
                               }
