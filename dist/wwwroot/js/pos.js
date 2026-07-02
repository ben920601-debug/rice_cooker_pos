// ==========================================
// 🛒 飯匙雲端 POS - 點餐收銀與即時結帳核心模組
// ==========================================

let currentProducts = [];  // 儲存從後端 C# 抓到的商品選單陣列
let currentCartItems = []; // 購物車陣列，結構：{ id, name, price, qty }

window.addEventListener("DOMContentLoaded", () => {
    // 🛡️ 權限與憑證防護檢查
    const cashier = localStorage.getItem("cashier");
    if (!cashier) {
        alert("系統尚未授權連線，請先登入收銀帳號！");
        window.location.href = "/index.html";
        return;
    }

    // 如果確實處在點餐主頁，初始化商品選單
    if (window.location.href.includes("home.html")) {
        initPosPage();
    }
});

// 🚀 初始化點餐頁面
async function initPosPage() {
    await fetchProductsMenu();
    renderCart();
}

// 📦 1. 從 C# Web API 撈取目前 Linux MySQL 中的完整菜單
async function fetchProductsMenu() {
    const container = document.getElementById("products-container");
    if (!container) return;
    
    container.innerHTML = '<div style="color:var(--text-muted); padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> 雲端菜單即時同步中...</div>';
    
    try {
        // 💡 對齊相對路徑：組合出來會是剛好一個斜線的 "/api/products"
        const res = await fetch(`${API_BASE_URL}/products`);
        
        if (!res.ok) {
            if (res.status === 404) {
                throw new Error("找不到 API 路由 (404)，請確認 C# 後端控制器對接路徑。");
            }
            throw new Error("後端資料庫回應異常");
        }
        
        // 接收 C# 傳回的大寫屬性商品陣列
        currentProducts = await res.json();
        renderProductsMenu();
        
    } catch (err) {
        console.error("同步菜單失敗:", err);
        container.innerHTML = `<div style="color:var(--danger); padding:20px;"><i class="fa-solid fa-triangle-exclamation"></i> 同步失敗：${err.message}</div>`;
    }
}

// 🎨 2. 渲染前端點餐商品格子
function renderProductsMenu() {
    const container = document.getElementById("products-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (currentProducts.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); padding:20px;">目前後台尚無商品，請先至【商品管理】上架新品。</div>';
        return;
    }

    currentProducts.forEach(p => {
        // 動態生成精美的點餐卡片格子
        const card = document.createElement("div");
        card.style = "background:white; padding:20px; border-radius:10px; border:1px solid var(--border); cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.02); transition:transform 0.1s, box-shadow:0 4px 6px rgba(0,0,0,0.05);";
        
        // 💡 核心對齊：C# 傳回的屬性第一個字母是大寫 (p.Name / p.Price)
        card.innerHTML = `
            <div style="font-weight:bold; font-size:1.05rem; color:var(--text); margin-bottom:8px;">${p.Name}</div>
            <div style="color:var(--primary); font-weight:800; font-family:monospace;">$${p.Price}</div>
        `;
        
        // 綁定點擊事件，將整個商品物件傳入購物車
        card.onclick = () => addToCart(p);
        container.appendChild(card);
    });
}

// ➕ 3. 將品項點擊加入購物車
function addToCart(product) {
    // 💡 核心對齊：檢查重複時要使用 C# 的大寫 product.Id
    const exist = currentCartItems.find(item => item.id === product.Id);
    
    if (exist) {
        exist.qty++;
    } else {
        // 💡 核心對齊：建立橋樑！把 C# 的大寫屬性，賦值給前端 HTML 明細需要的小寫 key
        currentCartItems.push({
            id: product.Id,
            name: product.Name,   // 👈 大寫 Name 轉小寫 name
            price: product.Price, // 👈 大寫 Price 轉小寫 price
            qty: 1
        });
    }
    renderCart(); // 即時重繪右側結帳明細
}

// 🛒 4. 渲染右側「結帳明細」購物車清單
function renderCart() {
    const container = document.getElementById("cart-container");
    const totalSpan = document.getElementById("cart-total");
    const checkoutBtn = document.getElementById("checkout-btn");
    
    if (!container || !totalSpan || !checkoutBtn) return;

    if (currentCartItems.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:50px 10px;">購物車空空如也</div>';
        totalSpan.innerText = "$0";
        checkoutBtn.disabled = true;
        return;
    }

    container.innerHTML = "";
    let total = 0;

    currentCartItems.forEach((item, index) => {
        total += item.price * item.qty;
        
        const row = document.createElement("div");
        row.style = "display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px dashed #f3f4f6; padding-bottom:8px;";
        row.innerHTML = `
            <div style="flex:2;">
                <div style="font-weight:600; font-size:0.95rem; color:var(--text);">${item.name}</div>
                <div style="font-size:0.85rem; color:var(--text-muted); font-family:monospace;">$${item.price} x ${item.qty}</div>
            </div>
            <div style="flex:1; text-align:right; font-weight:bold; color:var(--text); font-family:monospace; margin-right:10px;">$${item.price * item.qty}</div>
            <button onclick="removeFromCart(${index})" style="background:none; border:none; color:var(--danger); cursor:pointer; padding:5px;"><i class="fa-solid fa-trash-can"></i></button>
        `;
        container.appendChild(row);
    });

    totalSpan.innerText = `$${total}`;
    checkoutBtn.disabled = false;
}

// ➖ 5. 購物車單項刪除與清空
function removeFromCart(index) {
    currentCartItems.splice(index, 1);
    renderCart();
}

function clearCart() {
    currentCartItems = [];
    renderCart();
}

// 💡 6. 彈出收銀交易確認明細視窗 (Modal)
function openCheckoutModal() {
    const modal = document.getElementById("checkoutModal");
    const totalText = document.getElementById("cart-total").innerText;
    
    document.getElementById("modal-payable-amount").innerText = totalText;
    
    // 渲染彈出視窗內部的購買明細摘要
    const summaryBox = document.getElementById("checkout-summary-list");
    summaryBox.innerHTML = "";
    
    currentCartItems.forEach(item => {
        summaryBox.innerHTML += `
            <div class="summary-row">
                <span>${item.name} x ${item.qty}</span>
                <span style="font-family:monospace; font-weight:600;">$${item.price * item.qty}</span>
            </div>
        `;
    });

    // 初始化輸入框與找零欄位
    document.getElementById("cash-received").value = "";
    document.getElementById("modal-change-amount").innerText = "$0";
    
    modal.classList.add("active");
    document.getElementById("cash-received").focus();
}

function closeCheckoutModal() {
    document.getElementById("checkoutModal").classList.remove("active");
}

// 🔢 7. 實收現金輸入，即時動態計算找零金額
function calculateChangeDirectly() {
    const payableText = document.getElementById("modal-payable-amount").innerText;
    const payable = parseInt(payableText.replace('$', '')) || 0;
    
    const receivedInput = document.getElementById("cash-received").value;
    const received = receivedInput ? parseInt(receivedInput) : 0;
    
    const changeSpan = document.getElementById("modal-change-amount");

    if (received >= payable) {
        changeSpan.innerText = `$${received - payable}`;
        changeSpan.style.color = "#10b981"; // 實收足夠顯示綠色
    } else {
        changeSpan.innerText = `$0`;
        changeSpan.style.color = "var(--danger)"; // 不足顯示紅色
    }
}

// 🚀 8. 確認扣款結帳：正式將訂單資料打包傳送給 C# Web API
async function handleCheckoutExecute() {
    const payableText = document.getElementById("modal-payable-amount").innerText;
    const payable = parseInt(payableText.replace('$', '')) || 0;
    
    const receivedInput = document.getElementById("cash-received").value;
    const received = receivedInput ? parseInt(receivedInput) : 0;
    
    if (received < payable) {
        alert("⚠️ 實收現金不足，無法完成此筆結帳交易！");
        return;
    }

    const confirmBtn = document.getElementById("confirm-pay-btn");
    confirmBtn.disabled = true;

    // 💡 核心對齊：包裝出完全符合 C# 後端 Order 模型的 PascalCase JSON 結構
    const orderPayload = {
        CashierName: localStorage.getItem("cashier") || "店員",
        TotalAmount: payable,
        Items: currentCartItems.map(item => ({
            ProductName: item.name,
            Quantity: item.qty,
            Price: item.price
        }))
    };

    try {
        // 💡 對齊相對路徑："/api/orders"
        const res = await fetch(`${API_BASE_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload)
        });

        if (res.ok) {
            const result = await res.json();
            alert(`🎉 交易扣款成功！\n---------------------------\n系統單號：${result.OrderId}\n應付金額：$${payable}\n實收金額：$${received}\n應找零錢：$${received - payable} 元`);
            
            clearCart();          // 清空購物車
            closeCheckoutModal(); // 關閉彈出視窗
        } else {
            alert("❌ 結帳失敗，後端 API 拒絕了此筆交易請求。");
        }
    } catch (err) {
        console.error("結帳發送失敗:", err);
        alert("❌ 通訊故障，無法連線至 C# API，請檢查後端服務。");
    } finally {
        confirmBtn.disabled = false;
    }
}

// 🔄 手動點擊同步按鈕
function handleManualRefresh() {
    initPosPage();
}