let key = "";
let editingId = null;


/* =========================
   ابزارهای کمکی
========================= */

const $ = id => document.getElementById(id);

const money = value =>
  Number(value || 0).toLocaleString("fa-IR");


function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   ورود به پنل مدیریت
========================= */

function login() {

  const input = $("adminKey");

  if (!input) {
    alert("فیلد کلید مدیریت پیدا نشد");
    return;
  }

  key = input.value.trim();

  if (!key) {
    alert("کلید مدیریت را وارد کنید");
    return;
  }

  load();
}


/* =========================
   دریافت اطلاعات پنل
========================= */

async function load() {

  try {

    const res = await fetch("/api/admin", {
      method: "GET",

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


/* =========================
   نمایش محصولات و سفارش‌ها
========================= */

function render(data) {

  const products = data.products || [];

  const orders = data.orders || [];


  /* =====================
     محصولات
  ===================== */

  const productsBox = $("products");

  if (productsBox) {

    productsBox.innerHTML = products
      .map(product => {

        const oldPrice =
          product.old_price &&
          Number(product.old_price) > Number(product.price)
            ? `
              <del style="
                color:#999;
                margin-left:6px;
              ">
                ${money(product.old_price)} تومان
              </del>
            `
            : "";


        return `
          <div
            class="product"
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              gap:10px;
              margin:10px 0;
              padding:12px;
              border:1px solid #eee;
              border-radius:12px;
            "
          >

            <span>

              ${escapeHtml(product.icon || "🛍️")}

              <b>
                ${escapeHtml(product.name)}
              </b>

              <br>

              <small>

                ${escapeHtml(product.cat || "")}

                •
                
                ${oldPrice}

                <strong>
                  ${money(product.price)} تومان
                </strong>

              </small>

            </span>


            <span
              style="
                display:flex;
                gap:6px;
                flex-wrap:wrap;
              "
            >

              <button
                type="button"
                onclick="editProduct(${product.id})"
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
                onclick="del(${product.id})"
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

      })
      .join("");
  }


  /* =====================
     سفارش‌ها
  ===================== */

  const ordersBox = $("orders");

  if (ordersBox) {

    ordersBox.innerHTML = orders
      .map(order => {

        return `
          <div
            class="order"
            style="
              padding:12px;
              margin:10px 0;
              border:1px solid #eee;
              border-radius:12px;
            "
          >

            <b>
              کد سفارش:
              ${escapeHtml(order.code)}
            </b>

            <br>

            <small>

              ${escapeHtml(order.name || "")}

              •

              ${escapeHtml(order.phone || "")}

            </small>

            <br>

            <strong>
              ${money(order.total)} تومان
            </strong>

            <br><br>


            <select
              onchange="
                changeOrderStatus(
                  '${escapeHtml(order.code)}',
                  this.value
                )
              "
            >

              <option
                value="در انتظار بررسی"
                ${order.status === "در انتظار بررسی" ? "selected" : ""}
              >
                در انتظار بررسی
              </option>


              <option
                value="تایید شده"
                ${order.status === "تایید شده" ? "selected" : ""}
              >
                تایید شده
              </option>


              <option
                value="در حال ارسال"
                ${order.status === "در حال ارسال" ? "selected" : ""}
              >
                در حال ارسال
              </option>


              <option
                value="تحویل شده"
                ${order.status === "تحویل شده" ? "selected" : ""}
              >
                تحویل شده
              </option>


              <option
                value="لغو شده"
                ${order.status === "لغو شده" ? "selected" : ""}
              >
                لغو شده
              </option>

            </select>

          </div>
        `;

      })
      .join("");
  }
}


/* =========================
   ویرایش محصول
========================= */

async function editProduct(id) {

  try {

    const res = await fetch("/api/admin", {
      method: "GET",

      headers: {
        "x-admin-key": key
      }
    });


    if (!res.ok) {

      alert("دسترسی مدیریت منقضی شده است");

      return;
    }


    const data = await res.json();


    const product =
      (data.products || [])
        .find(
          item =>
            Number(item.id) === Number(id)
        );


    if (!product) {

      alert("محصول پیدا نشد");

      return;
    }


    editingId = product.id;


    /* نام */

    $("name").value =
      product.name || "";


    /* دسته‌بندی */

    $("cat").value =
      product.cat || "";


    /*
      قیمت جدید
      این همان قیمت فروش فعلی است
    */

    $("price").value =
      product.price ?? "";


    /*
      قیمت قبلی
      اختیاری است
    */

    $("old_price").value =
      product.old_price ?? "";


    /* ایموجی */

    $("icon").value =
      product.icon || "";


    /* تغییر متن دکمه */

    const submitButton =
      document.querySelector(
        "form button[type='submit']"
      );


    if (submitButton) {

      submitButton.textContent =
        "ذخیره تغییرات";
    }


    /* ساخت دکمه لغو */

    let cancelButton =
      $("cancelEdit");


    if (!cancelButton) {

      cancelButton =
        document.createElement("button");


      cancelButton.id =
        "cancelEdit";


      cancelButton.type =
        "button";


      cancelButton.textContent =
        "لغو ویرایش";


      cancelButton.style.marginRight =
        "8px";


      cancelButton.onclick =
        cancelEdit;


      if (submitButton) {

        submitButton.parentNode
          .appendChild(cancelButton);
      }
    }


    /* رفتن به بالای صفحه */

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });


  } catch (err) {

    console.error(err);

    alert(
      "خطا در دریافت اطلاعات محصول"
    );
  }
}


/* =========================
   لغو ویرایش
========================= */

function cancelEdit() {

  editingId = null;


  const form =
    document.querySelector("form");


  if (form) {

    form.reset();
  }


  const submitButton =
    document.querySelector(
      "form button[type='submit']"
    );


  if (submitButton) {

    submitButton.textContent =
      "افزودن محصول";
  }


  const cancelButton =
    $("cancelEdit");


  if (cancelButton) {

    cancelButton.remove();
  }
}


/* =========================
   حذف محصول
========================= */

async function del(id) {

  if (
    !confirm(
      "آیا از حذف این محصول مطمئن هستید؟"
    )
  ) {

    return;
  }


  try {

    const res = await fetch(
      "/api/products",
      {
        method: "DELETE",

        headers: {
          "Content-Type":
            "application/json",

          "x-admin-key":
            key
        },

        body: JSON.stringify({
          id: Number(id)
        })
      }
    );


    const data =
      await res.json();


    if (!res.ok) {

      alert(
        data.error ||
        "حذف محصول انجام نشد"
      );

      return;
    }


    alert(
      "محصول حذف شد"
    );


    load();


  } catch (err) {

    console.error(err);

    alert(
      "خطا در حذف محصول"
    );
  }
}


/* =========================
   افزودن / ویرایش محصول
========================= */

const form =
  document.querySelector("form");


if (form) {

  form.onsubmit =
    async function (e) {

      e.preventDefault();


      /* =====================
         اطلاعات محصول
      ===================== */

      const name =
        $("name").value.trim();


      const cat =
        $("cat").value.trim();


      /*
        قیمت جدید
      */

      const price =
        Number(
          $("price").value
        );


      /*
        قیمت قبلی
        اختیاری
      */

      const oldPriceText =
        $("old_price").value.trim();


      const old_price =
        oldPriceText === ""
          ? null
          : Number(oldPriceText);


      /*
        ایموجی
        اختیاری
      */

      const icon =
        $("icon").value.trim();


      /* =====================
         بررسی نام
      ===================== */

      if (!name) {

        alert(
          "نام محصول را وارد کنید"
        );

        return;
      }


      /* =====================
         بررسی قیمت جدید
      ===================== */

      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {

        alert(
          "قیمت جدید را درست وارد کنید"
        );

        return;
      }


      /* =====================
         بررسی قیمت قبلی
      ===================== */

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


      /* =====================
         اطلاعات نهایی محصول
      ===================== */

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
           ویرایش محصول
        ===================== */

        if (
          editingId !== null
        ) {

          res =
            await fetch(
              "/api/products",
              {
                method: "PATCH",

                headers: {
                  "Content-Type":
                    "application/json",

                  "x-admin-key":
                    key
                },

                body: JSON.stringify({

                  id:
                    Number(editingId),

                  ...productData

                })
              }
            );
        }


        /* =====================
           افزودن محصول جدید
        ===================== */

        else {

          res =
            await fetch(
              "/api/products",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  "x-admin-key":
                    key
                },

                body:
                  JSON.stringify(
                    productData
                  )
              }
            );
        }


        const data =
          await res.json();


        /* =====================
           بررسی نتیجه
        ===================== */

        if (!res.ok) {

          alert(
            data.error ||
            "ذخیره محصول انجام نشد"
          );

          return;
        }


        /* =====================
           پیام موفقیت
        ===================== */

        if (
          editingId !== null
        ) {

          alert(
            "محصول با موفقیت ویرایش شد"
          );

        } else {

          alert(
            "محصول با موفقیت اضافه شد"
          );
        }


        /* پاک کردن حالت ویرایش */

        cancelEdit();


        /* بارگذاری دوباره */

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

async function changeOrderStatus(
  code,
  status
) {

  try {

    const res =
      await fetch(
        "/api/orders",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            "x-admin-key":
              key
          },

          body: JSON.stringify({

            code: code,

            status: status

          })
        }
      );


    const data =
      await res.json();


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
