let cart = JSON.parse(localStorage.getItem("cart")) || [];

// LOAD PRODUCTS
async function loadProducts(){
  let res = await fetch("http://localhost:5000/products");
  let data = await res.json();

  let html = "";

  data.forEach(p=>{
    html += `
      <div class="card">
        <img src="http://localhost:5000/uploads/${p.image}" 
             onerror="this.src='https://via.placeholder.com/150'">

        <h4>${p.name}</h4>
        <p>?${p.price}</p>

        <button onclick='add(${JSON.stringify(p)})'>Add to Cart</button>
      </div>
    `;
  });

  document.getElementById("products").innerHTML = html;
}

// ADD CART
function add(p){
  cart.push(p);
  localStorage.setItem("cart", JSON.stringify(cart));
  update();
}

// UPDATE COUNT
function update(){
  document.getElementById("count").innerText = cart.length;
}

// TOGGLE CART
function toggleCart(){
  let box = document.getElementById("cartBox");
  box.style.display = box.style.display==="block"?"none":"block";
  loadCart();
}

// LOAD CART
function loadCart(){
  let html="";
  let total=0;

  cart.forEach((item,i)=>{
    total += Number(item.price);

    html += `
      <p>${item.name} - ?${item.price}
      <button onclick="remove(${i})">X</button></p>
    `;
  });

  html += `<h4>Total: ?${total}</h4>`;

  document.getElementById("cartItems").innerHTML = html;
}

// REMOVE
function remove(i){
  cart.splice(i,1);
  localStorage.setItem("cart", JSON.stringify(cart));
  update();
  loadCart();
}

// ORDER
async function order(){
  let name = document.getElementById("name").value;
  let phone = document.getElementById("phone").value;
  let address = document.getElementById("address").value;

  if(!name || !phone || !address){
    alert("Fill all fields");
    return;
  }

  await fetch("http://localhost:5000/order",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({name,phone,address,cart})
  });

  alert("Order placed ?");

  cart=[];
  localStorage.removeItem("cart");
  update();
  loadCart();
}

// INIT
loadProducts();
update();