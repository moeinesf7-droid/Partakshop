const fallbackProducts=[
{id:1,name:"ست لباس زیر گیپوری مشکی",cat:"لباس زیر زنانه",price:659000,icon:"♢"},
{id:2,name:"سرم ویتامین C",cat:"پوست و مراقبت",price:495000,icon:"💧"},
{id:3,name:"رژ لب مات شیک",cat:"آرایش صورت",price:385000,icon:"💄"},
{id:4,name:"پالت سایه چشم",cat:"چشم و ابرو",price:720000,icon:"🎨"},
{id:5,name:"کرم آبرسان روزانه",cat:"پوست و مراقبت",price:410000,icon:"🫧"},
{id:6,name:"عطر زنانه پارتاک",cat:"عطر و ادکلن",price:890000,icon:"🌸"},
{id:7,name:"ست لباس زیر صورتی",cat:"لباس زیر زنانه",price:590000,icon:"♢"},
{id:8,name:"خط چشم مایع",cat:"چشم و ابرو",price:290000,icon:"🖊️"}
];

let products=[...fallbackProducts];
let category="همه";
let cart=JSON.parse(localStorage.getItem("partak_cart")||"[]");
let fav=JSON.parse(localStorage.getItem("partak_fav")||"[]");
let couponCode="";
let couponDiscount=0;

const money=n=>Number(n||0).toLocaleString("fa-IR")+" تومان";

function esc(v){
  return String(v??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[c]));
}

async function loadProducts(){
  try{
    const r=await fetch("/api/products",{cache:"no-store"});
    if(!r.ok)throw 0;
    const d=await r.json();
    if(Array.isArray(d.products)&&d.products.length){
      products=d.products;
      syncCartWithProducts();
    }
  }catch(e){}
  renderProducts();
  renderCart();
}

function syncCartWithProducts(){
  cart=cart.map(item=>{
    const p=products.find(x=>Number(x.id)===Number(item.id));
    if(!p)return item;
    return {
      ...item,
      name:p.name,
      price:Number(p.price||0),
      old_price:Number(p.old_price||0),
      icon:p.icon||""
    };
  }).filter(item=>products.some(p=>Number(p.id)===Number(item.id)));
  save();
}

function priceHTML(p){
  const old=Number(p.old_price||0);
  const now=Number(p.price||0);
  if(old>now){
    const percent=Math.round(((old-now)/old)*100);
    return `
      <span class="old-price">${money(old)}</span>
      <span class="new-price">${money(now)}</span>
      <span class="sale-badge">${percent}٪ تخفیف</span>
    `;
  }
  return `<span class="new-price">${money(now)}</span>`;
}

function renderProducts(){
  const q=(document.getElementById("search")?.value||"").trim().toLowerCase();
  const list=products.filter(p=>
    (category==="همه"||p.cat===category)&&
    (!q||String(p.name).toLowerCase().includes(q)||String(p.cat).toLowerCase().includes(q))
  );

  document.getElementById("grid").innerHTML=list.map(p=>`
    <article class="card">
      <button class="fav" onclick="toggleFav(${Number(p.id)})">${fav.includes(Number(p.id))?"♥":"♡"}</button>
      <div class="pic">${esc(p.icon||"🛍️")}</div>
      <div class="cat">${esc(p.cat)}</div>
      <h3>${esc(p.name)}</h3>
      <div class="price">${priceHTML(p)}</div>
      <button class="add" onclick="add(${Number(p.id)})">افزودن به سبد</button>
    </article>
  `).join("")||"<p>محصولی پیدا نشد.</p>";

  document.getElementById("favCount").textContent=fav.length;
}

function setCategory(c){
  category=c;
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
  renderProducts();
}

function add(id){
  const p=products.find(x=>Number(x.id)===Number(id));
  if(!p)return;

  const hit=cart.find(x=>Number(x.id)===Number(id));
  if(hit){
    hit.qty=(hit.qty||1)+1;
    hit.price=Number(p.price||0);
    hit.old_price=Number(p.old_price||0);
    hit.name=p.name;
  }else{
    cart.push({
      id:p.id,
      name:p.name,
      price:Number(p.price||0),
      old_price:Number(p.old_price||0),
      icon:p.icon||"",
      qty:1
    });
  }

  clearCouponBecauseCartChanged();
  save();
  renderCart();
  toast("محصول به سبد خرید اضافه شد");
}

function changeQty(id,delta){
  const item=cart.find(x=>Number(x.id)===Number(id));
  if(!item)return;
  item.qty=Math.max(1,Math.min(20,(item.qty||1)+delta));
  clearCouponBecauseCartChanged();
  save();
  renderCart();
}

function removeCartItem(id){
  cart=cart.filter(x=>Number(x.id)!==Number(id));
  clearCouponBecauseCartChanged();
  save();
  renderCart();
  toast("محصول از سبد خرید حذف شد");
}

function save(){
  localStorage.setItem("partak_cart",JSON.stringify(cart));
  document.getElementById("cartCount").textContent=
    cart.reduce((a,x)=>a+(x.qty||1),0);
}

function itemIsDiscounted(item){
  return Number(item.old_price||0)>Number(item.price||0);
}

function cartSubtotal(){
  return cart.reduce((a,x)=>a+Number(x.price||0)*(x.qty||1),0);
}

function eligibleSubtotal(){
  return cart.reduce((a,x)=>{
    return a+(itemIsDiscounted(x)?0:Number(x.price||0)*(x.qty||1));
  },0);
}

function renderCart(){
  const items=document.getElementById("cartItems");
  const subtotal=cartSubtotal();

  items.innerHTML=cart.length
    ? cart.map(x=>{
        const qty=x.qty||1;
        const line=Number(x.price||0)*qty;
        const price=priceHTML({
          price:x.price,
          old_price:x.old_price
        });
        return `
        <div class="cart-row">
          <div class="cart-info">
            <div class="cart-name">${esc(x.name)}</div>
            <div class="cart-price">${price}</div>
            <div class="qty-controls">
              <button type="button" onclick="changeQty(${Number(x.id)},1)">+</button>
              <span>${qty}</span>
              <button type="button" onclick="changeQty(${Number(x.id)},-1)">−</button>
              <button type="button" class="remove-item" onclick="removeCartItem(${Number(x.id)})">حذف</button>
            </div>
          </div>
          <b>${money(line)}</b>
        </div>`;
      }).join("")
    : "<p>سبد خرید خالی است.</p>";

  document.getElementById("subtotal").textContent=money(subtotal);
  document.getElementById("discount").textContent=money(couponDiscount);
  document.getElementById("discountLine").hidden=!(couponDiscount>0);
  document.getElementById("total").textContent=money(Math.max(0,subtotal-couponDiscount));
  document.getElementById("removeCouponBtn").hidden=!couponCode;

  if(couponCode && eligibleSubtotal()<=0){
    couponCode="";
    couponDiscount=0;
    document.getElementById("removeCouponBtn").hidden=true;
    document.getElementById("discountLine").hidden=true;
    document.getElementById("total").textContent=money(subtotal);
  }
}

function openCart(){
  renderCart();
  document.getElementById("cart").style.display="flex";
}

function closeCart(){
  document.getElementById("cart").style.display="none";
}

function clearCouponBecauseCartChanged(){
  couponCode="";
  couponDiscount=0;
  const input=document.getElementById("couponCode");
  const msg=document.getElementById("couponMsg");
  if(input)input.value="";
  if(msg)msg.textContent="";
}

async function applyCoupon(){
  const input=document.getElementById("couponCode");
  const msg=document.getElementById("couponMsg");
  const code=(input.value||"").trim().toUpperCase();
  const eligible=eligibleSubtotal();

  if(!code){
    msg.textContent="کد تخفیف را وارد کنید.";
    return;
  }
  if(cart.length===0){
    msg.textContent="سبد خرید خالی است.";
    return;
  }
  if(eligible<=0){
    msg.textContent="هیچ‌کدام از کالاهای سبد شامل کد تخفیف نمی‌شوند.";
    couponCode="";
    couponDiscount=0;
    renderCart();
    return;
  }

  msg.textContent="در حال بررسی...";

  try{
    const r=await fetch(
      "/api/coupons?code="+encodeURIComponent(code)+"&subtotal="+eligible,
      {cache:"no-store"}
    );
    const d=await r.json();

    if(!r.ok)throw new Error(d.error||"کد تخفیف معتبر نیست");

    couponCode=d.code;
    couponDiscount=Number(d.discount||0);
    msg.textContent="کد تخفیف با موفقیت اعمال شد ✅";
    renderCart();
  }catch(e){
    couponCode="";
    couponDiscount=0;
    msg.textContent=e.message||"کد تخفیف معتبر نیست";
    renderCart();
  }
}

function removeCoupon(){
  couponCode="";
  couponDiscount=0;
  document.getElementById("couponCode").value="";
  document.getElementById("couponMsg").textContent="";
  renderCart();
}

function checkout(){
  if(!cart.length)return toast("سبد خرید خالی است");
  closeCart();
  document.getElementById("checkout").style.display="flex";
}

function closeCheckout(){
  document.getElementById("checkout").style.display="none";
}

async function submitOrder(e){
  e.preventDefault();

  const payload={
    name:customerName.value,
    phone:customerPhone.value,
    address:customerAddress.value,
    payment:payment.value,
    items:cart.map(x=>({id:x.id,qty:x.qty||1})),
    coupon_code:couponCode
  };

  try{
    const r=await fetch("/api/orders",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(payload)
    });

    const d=await r.json();
    if(!r.ok)throw new Error(d.error||"خطا");

    localStorage.setItem("partak_last_code",d.code);
    cart=[];
    couponCode="";
    couponDiscount=0;
    save();
    closeCheckout();
    toast("سفارش ثبت شد؛ کد: "+d.code);
    trackCode.value=d.code;
    trackOrder();
    document.getElementById("orders").scrollIntoView({behavior:"smooth"});
  }catch(err){
    toast(err.message||"خطا در ثبت سفارش");
  }
}

async function trackOrder(){
  const c=trackCode.value.trim();
  if(!c)return;

  try{
    const r=await fetch("/api/orders?code="+encodeURIComponent(c));
    const d=await r.json();
    document.getElementById("trackResult").innerHTML=r.ok
      ? `<p>سفارش <b>${esc(d.order.code)}</b> — وضعیت: <b>${esc(d.order.status)}</b></p>`
      : `<p>${esc(d.error||"خطا")}</p>`;
  }catch(e){
    document.getElementById("trackResult").textContent="ارتباط با سرور برقرار نشد.";
  }
}

function toggleFav(id){
  id=Number(id);
  fav=fav.includes(id)?fav.filter(x=>Number(x)!==id):[...fav,id];
  localStorage.setItem("partak_fav",JSON.stringify(fav));
  renderProducts();
}

function openFavorites(){
  const names=products.filter(p=>fav.includes(Number(p.id))).map(p=>p.name);
  toast(names.length?names.join("، "):"هنوز محصولی به علاقه‌مندی‌ها اضافه نشده");
}

function toggleMenu(){
  document.getElementById("nav").classList.toggle("open");
}

function toast(t){
  const x=document.getElementById("toast");
  x.textContent=t;
  x.style.display="block";
  setTimeout(()=>x.style.display="none",2800);
}

save();
renderProducts();
renderCart();
loadProducts();