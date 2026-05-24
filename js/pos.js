// js/pos.js (v1.8 終極修復版)

(function() {
    // ⚠️ 請精準替換成你目前最新部署、包含 checkout 動作的 GAS 網址！
    const POS_GAS_URL = "https://script.google.com/macros/s/AKfycbyj0LZVFv9e7cp8Fn8guntnYNy78Dw7USlZ8gM3fJLag_ERtghpNlvNu9x6EtBfBDsB/exec"; 

    let localProducts = []; // 前台專用商品備份
    let localCart = [];      // 購物車紀錄
    let totalPayableAmount = 0; // 暫存應付總金額

    // 1. 从云端精准拉取商品菜单
    window.fetchCloudProducts = function() {
        const container = document.getElementById("products-container");
        if (container) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:40px;"><i class="fa-solid fa-spinner fa-spin"></i> 正在連線雲端菜單...</div>`;
        }

        // 發送 GET 請求向 GAS 要商品
        fetch(`${POS_GAS_URL}?action=get_products`)
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data)) {
                console.error("後端回傳菜單格式異常:", data);
                return;
            }
            
            // 💡 ✨ 關鍵一：雙向塞入商品，將資料確實共享至全域
            localProducts = data;     
            window.products = data;   
            
            // 💡 ✨ 關鍵二：打破盲區！先把通知後台重繪的暗號往前移！
            // 這樣不論現在在哪一頁，後台的表格只要存在，就絕對能拿到熱騰騰的資料！
            if (typeof window.renderManagerProducts === "function") {
                console.log("📢 [pos.js] 偵測到後台渲染函式，立即命令 products.js 刷新表格！");
                window.renderManagerProducts();
            }

            // 執行前台點餐格渲染
            renderProductsGrid(); 
        })
        .catch(error => {
            console.error("無法取得雲端菜單:", error);
            if (container) {
                container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--danger); padding:40px;">❌ 菜單載入失敗</div>`;
            }
        });
    }

    // 2. 渲染前台收銀點餐網格
    function renderProductsGrid() {
        const container = document.getElementById("products-container");
        // 💡 雖然這裡在 products.html 會 return 退出，但因為後台渲染已經在上面跑完了，所以完全沒影響！
        if (!container) return; 

        if (localProducts.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:40px;">📭 雲端菜單目前沒有任何商品</div>`;
            return;
        }

        container.innerHTML = localProducts.map(p => `
            <div class="product-card" onclick="localAddToCart(${p.id})">
                <div class="product-name">${p.name}</div>
                <div class="product-price">$${p.price}</div>
            </div>
        `).join('');
    }

    // 3. 點擊商品加入購物車
    window.localAddToCart = function(productId) {
        const product = localProducts.find(p => p.id === productId);
        if (!product) return;

        const cartItem = localCart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.qty += 1;
        } else {
            localCart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                qty: 1
            });
        }
        renderLocalCart();
    }

    // 4. 變更購物車數量
    window.changeLocalQty = function(productId, amount) {
        const cartItem = localCart.find(item => item.id === productId);
        if (!cartItem) return;

        cartItem.qty += amount;
        if (cartItem.qty <= 0) {
            localCart = localCart.filter(item => item.id !== productId);
        }
        renderLocalCart();
    }

    // 5. 渲染側邊待結帳明細
    function renderLocalCart() {
        const cartContainer = document.getElementById("cart-container");
        const cartTotal = document.getElementById("cart-total");
        const checkoutBtn = document.getElementById("checkout-btn");
        
        if (!cartContainer || !cartTotal) return;

        if (localCart.length === 0) {
            cartContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:50px 10px;">購物車空空如也</div>`;
            cartTotal.innerText = "$0";
            if (checkoutBtn) checkoutBtn.disabled = true;
            totalPayableAmount = 0;
            return;
        }

        cartContainer.innerHTML = localCart.map(item => `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:8px;">
                <div class="item-info">
                    <div class="item-name" style="font-weight:600;">${item.name}</div>
                    <div class="item-meta" style="font-size:0.85rem; color:var(--text-muted);">$${item.price} x ${item.qty}</div>
                </div>
                <div class="item-actions" style="display:flex; align-items:center; gap:8px;">
                    <button class="btn-qty" onclick="changeLocalQty(${item.id}, -1)">-</button>
                    <span class="item-qty" style="font-weight:bold; font-family:monospace;">${item.qty}</span>
                    <button class="btn-qty" onclick="changeLocalQty(${item.id}, 1)">+</button>
                </div>
            </div>
        `).join('');

        totalPayableAmount = localCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        cartTotal.innerText = `$${totalPayableAmount}`;
        if (checkoutBtn) checkoutBtn.disabled = false;
    }

    // 6. 打開結帳交易確認視窗 (Modal)
    window.openCheckoutModal = function() {
        if (localCart.length === 0) return;

        const summaryList = document.getElementById("checkout-summary-list");
        summaryList.innerHTML = localCart.map(item => `
            <div class="summary-row">
                <span style="color:var(--text); font-weight:500;">${item.name} <span style="color:var(--text-muted); font-size:0.85rem;">x${item.qty}</span></span>
                <span style="font-family:monospace; font-weight:600; color:#4b5563;">$${item.price * item.qty}</span>
            </div>
        `).join('');

        document.getElementById("modal-payable-amount").innerText = `$${totalPayableAmount}`;
        
        const cashInput = document.getElementById("cash-received");
        cashInput.value = ""; 
        document.getElementById("modal-change-amount").innerText = "$0";
        document.getElementById("modal-change-amount").style.color = "var(--text-muted)";

        document.getElementById("checkoutModal").classList.add("active");
        setTimeout(() => cashInput.focus(), 200);
    }

    // 7. 關閉結帳確認視窗
    window.closeCheckoutModal = function() {
        document.getElementById("checkoutModal").classList.remove("active");
    }

    // 8. 即時動態計算找零金額
    window.calculateChangeDirectly = function() {
        const cashInput = document.getElementById("cash-received");
        const changeDisplay = document.getElementById("modal-change-amount");
        const confirmPayBtn = document.getElementById("confirm-pay-btn");
        
        const cashReceived = parseInt(cashInput.value) || 0;
        const change = cashReceived - totalPayableAmount;

        if (cashInput.value === "") {
            changeDisplay.innerText = "$0";
            changeDisplay.style.color = "var(--text-muted)";
            confirmPayBtn.disabled = false; 
            return;
        }

        if (change < 0) {
            changeDisplay.innerText = `還差 $${Math.abs(change)}`;
            changeDisplay.style.color = "var(--danger)";
            confirmPayBtn.disabled = true; 
        } else {
            changeDisplay.innerText = `$${change}`;
            changeDisplay.style.color = "#10b981"; 
            confirmPayBtn.disabled = false; 
        }
    }

    // 9. 確認扣款並正式送出交易至 GAS
    window.handleCheckoutExecute = function() {
        if (localCart.length === 0) return;

        const cashInput = document.getElementById("cash-received");
        const cashReceived = parseInt(cashInput.value) || totalPayableAmount;
        
        if (cashReceived < totalPayableAmount) {
            alert("❌ 實收金額不足，無法完成扣款結帳！");
            return;
        }

        const transactionId = "TX-" + Date.now();
        const detailsText = localCart.map(item => `${item.name} x ${item.qty}`).join(", ");
        const cashierCode = localStorage.getItem("current_cashier_code") || "未知";
        const cashierName = localStorage.getItem("current_cashier_name") || "系統";
        const fullCashierInfo = `${cashierCode} ${cashierName}`;

        const payload = {
            action: "checkout",
            transaction_id: transactionId,
            cashier: fullCashierInfo,
            details: detailsText,
            total: totalPayableAmount
        };

        const confirmPayBtn = document.getElementById("confirm-pay-btn");
        confirmPayBtn.disabled = true;
        confirmPayBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 扣款上傳中...`;

        fetch(POS_GAS_URL, {
            method: "POST",
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            const finalChange = cashReceived - totalPayableAmount;
            alert(`🎉 交易成功！\n─────────────────\n應付金額：$${totalPayableAmount}\n實收金額：$${cashReceived}\n應找零錢：$${finalChange}\n─────────────────\n單號：${transactionId}`);
            
            localCart = [];
            renderLocalCart();
            window.closeCheckoutModal(); 
        })
        .catch(error => {
            console.error("結帳連線失敗:", error);
            alert("❌ 結帳傳輸中斷，請確認網絡！");
        })
        .finally(() => {
            confirmPayBtn.disabled = false;
            confirmPayBtn.innerHTML = `<i class="fa-solid fa-print"></i> 確認扣款結帳`;
        });
    }

    // 🚀 頁面初始化自動載入
    document.addEventListener("DOMContentLoaded", () => {
        window.fetchCloudProducts();
        renderLocalCart();
    });

})();