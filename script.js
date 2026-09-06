const fallbackProducts=[
{id:1,name:"ست لباس زیر گیپوری مشکی",cat:"لباس زیر زنانه",price:659000,icon:"♢"},
{id:2,name:"سرم ویتامین C",cat:"پوست و مراقبت",price:495000,icon:"💧"},
{id:3,name:"رژ لب مات شیک",cat:"آرایش صورت",price:385000,icon:"💄"},
{id:4,name:"پالت سایه چشم",cat:"چشم و ابرو",price:720000,icon:"🎨"},
{id:5,name:"کرم آبرسان روزانه",cat:"پوست و مراقبت",price:410000,icon:"🫧"},
{id:6,name:"عطر زنانه پارتاک",cat:"عطر و ادکلن",price:890000,icon:"🌸"},
{id:7,name:"ست لباس زیر صورتی",cat:"لباس زیر زنانه",price:590000,icon:"♢"},
{id:8,name:"خط چشم مایع",cat:"چشم و ابرو",price:290000,icon:"🖊️"}];
let products=[...fallbackProducts], category="همه";
let cart=JSON.parse(localStorage.getItem("partak_cart")||"[]"), fav=JSON.parse(localStorage.getItem("partak_fav")||"[]");
const money=n=>Number(n).toLocaleString("fa-IR")+" تومان";
async function loadProducts(){try{const r=await fetch('/api/products',{cache:'no-store'}); if(!r.ok)throw 0; const d=await r.json(); if(Array.isArray(d.products)&&d.products.length) products=d.products; }catch(e){} renderProducts();}
function renderProducts(){const q=(document.getElementById("search")?.value||"").trim().toLowerCase();const list=products.filter(p=>(category==="همه"||p.cat===category)&&(!q||p.name.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q)));document.getElementById("grid").innerHTML=list.map(p=>`<article class="card"><button class="fav" onclick="toggleFav('${String(p.name).replace(/'/g,"\\'")}')">${fav.includes(p.id)?"♥":"♡"}</button><div class="pic">${p.icon||'🛍️'}</div><div class="cat">${p.cat}</div><h3>${p.name}</h3><div class="price">${money(p.price)}</div><button class="add" onclick="add(${p.id})">افزودن به سبد</button></article>`).join("")||"<p>محصولی پیدا نشد.</p>";document.getElementById("favCount").textContent=fav.length}
function setCategory(c){category=c;document.getElementById("products").scrollIntoView({behavior:"smooth"});renderProducts()}
function add(id){const p=products.find(x=>Number(x.id)===Number(id));if(!p)return;const hit=cart.find(x=>Number(x.id)===Number(id));if(hit)hit.qty=(hit.qty||1)+1;else cart.push({id:p.id,name:p.name,price:p.price,qty:1});save();toast("محصول به سبد خرید اضافه شد")}
function save(){localStorage.setItem("partak_cart",JSON.stringify(cart));document.getElementById("cartCount").textContent=cart.reduce((a,x)=>a+(x.qty||1),0)}
function openCart(){document.getElementById("cartItems").innerHTML=cart.length?cart.map(x=>`<div class="cart-row"><span>${x.name} × ${x.qty||1}</span><b>${money(x.price*(x.qty||1))}</b></div>`).join(""):"<p>سبد خرید خالی است.</p>";document.getElementById("total").textContent=money(cart.reduce((a,x)=>a+x.price*(x.qty||1),0));document.getElementById("cart").style.display="flex"}
function closeCart(){document.getElementById("cart").style.display="none"}
function checkout(){if(!cart.length)return toast("سبد خرید خالی است");closeCart();document.getElementById("checkout").style.display="flex"}
function closeCheckout(){document.getElementById("checkout").style.display="none"}
async function submitOrder(e){e.preventDefault();const payload={name:customerName.value,phone:customerPhone.value,address:customerAddress.value,payment:payment.value,items:cart.map(x=>({id:x.id,qty:x.qty||1}))};try{const r=await fetch('/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw new Error(d.error||'خطا');localStorage.setItem('partak_last_code',d.code);cart=[];save();closeCheckout();toast('سفارش ثبت شد؛ کد: '+d.code);trackCode.value=d.code;trackOrder();document.getElementById('orders').scrollIntoView({behavior:'smooth'});}catch(err){toast(err.message||'خطا در ثبت سفارش')}}
async function trackOrder(){const c=trackCode.value.trim();if(!c)return;try{const r=await fetch('/api/orders?code='+encodeURIComponent(c));const d=await r.json();document.getElementById("trackResult").innerHTML=r.ok?`<p>سفارش <b>${d.order.code}</b> — وضعیت: <b>${d.order.status}</b></p>`:`<p>${d.error||'خطا'}</p>`}catch(e){document.getElementById("trackResult").textContent='ارتباط با سرور برقرار نشد.'}}
function toggleFav(id){fav=fav.includes(id)?fav.filter(x=>x!==id):[...fav,id];localStorage.setItem("partak_fav",JSON.stringify(fav));renderProducts()}
function openFavorites(){const names=products.filter(p=>fav.includes(p.id)).map(p=>p.name);toast(names.length?names.join("، "):"هنوز محصولی به علاقه‌مندی‌ها اضافه نشده")}
function toggleMenu(){document.getElementById("nav").classList.toggle("open")}
function toast(t){let x=document.getElementById("toast");x.textContent=t;x.style.display="block";setTimeout(()=>x.style.display="none",2800)}
save();renderProducts();loadProducts();
