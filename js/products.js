// js/products.js (v1.9 獨立自主版)

(function() {
    // 💡 內建專屬 GAS 網址防火牆，再也不需要依賴全域變數或 pos.js
    // ⚠️ 請精準替換成你目前最新部署、包含 add_product / delete_product 的 GAS 網址！
    const PROD_GAS_URL = "https://script.google.com/macros/s/AKfycbyj0LZVFv9e7cp8Fn8guntnYNy78Dw7USlZ8gM3fJLag_ERtghpNlvNu9x6EtBfBDsB/exec";

    // 建立後台專用的私有商品陣列，完全自主管控
    let managerProductsList = []; 

    // ─── 🌐 1. 主動發動連線去雲端抓取商品菜單 ───
    window.fetchManagerProductsSelf = function() {
        const tableBody = document.getElementById("manager-product-table");
        if (!tableBody) return; // 安全防線：如果這頁沒有管理表格，就優雅退出

        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> 正在自主連線雲端菜單...</td></tr>`;

        // 自己帶著 action=get_products 去敲雲端 GAS 大門
        fetch(`${PROD_GAS_URL}?action=get_products`)
        .then(response => response.json())
        .then(data => {
            if (data && data.error) {
                console.error("GAS 回傳錯誤:", data.error);
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--danger); padding:20px;">❌ 雲端分頁錯誤: ${data.error}</td></tr>`;
                return;
            }

            if (!Array.isArray(data)) {
                throw new Error("回傳格式異常（非陣列）");
            }

            // 儲存到自己內部的陣列中
            managerProductsList = data; 
            
            // 執行後台表格渲染
            renderManagerTable();
        })
        .catch(error => {
            console.error("後端自主同步失敗:", error);
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--danger); padding:20px;">❌ 無法同步雲端菜單，請檢查網路或 GAS 網址。</td></tr>`;
        });
    }

    // ─── 📊 2. 將商品陣列渲染成後台 HTML 表格 ───
    function renderManagerTable() {
        const tableBody = document.getElementById("manager-product-table");
        if (!tableBody) return;

        if (managerProductsList.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:40px;">📭 目前雲端試算表菜單無任何商品</td></tr>`;
            return;
        }

        tableBody.innerHTML = managerProductsList.map(p => `
            <tr style="border-bottom: 1px solid var(--border); font-size: 0.95rem; transition: background 0.15s;">
                <td style="padding: 12px 8px; color: var(--text-muted); font-family: monospace;">#${String(p.id).padStart(3, '0')}</td>
                <td style="padding: 12px 8px; font-weight: 500; color: var(--text);">${p.name}</td>
                <td style="padding: 12px 8px; color: var(--primary); font-weight: 600;">$${p.price}</td>
                <td style="padding: 12px 8px; text-align: center;">
                    <button onclick="handleDeleteProduct(${p.id})" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 1.05rem;" title="將此品項從雲端刪除">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // ─── ➕ 3. 後台表單提交：上架新商品品項 ───
    window.handleCreateProduct = function(event) {
        event.preventDefault();

        const nameInput = document.getElementById("new-prod-name");
        const priceInput = document.getElementById("new-prod-price");
        const submitBtn = document.getElementById("add-product-btn"); 

        if (!nameInput || !priceInput || !submitBtn) return;

        // 改用自己內部的 managerProductsList 來計算下一個自動遞增的 ID
        const nextId = managerProductsList.length > 0 ? Math.max(...managerProductsList.map(p => p.id)) + 1 : 1;

        const payload = {
            action: "add_product", 
            id: nextId,
            name: nameInput.value.trim(),
            price: parseInt(priceInput.value)
        };

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 上傳中...`;

        fetch(PROD_GAS_URL, {
            method: "POST",
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            alert(`🎉 商品【${payload.name}】已成功寫入 Google 試算表！`);
            nameInput.value = "";
            priceInput.value = "";
            
            // 💡 成功後，自己發動重新拉取，完全獨立閉環
            window.fetchManagerProductsSelf(); 
        })
        .catch(error => {
            console.error("上傳失敗:", error);
            alert("❌ 無法連線到雲端資料庫");
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-plus"></i> 加入菜單`;
        });
    }

    // ─── 🗑️ 4. 後台表格操作：刪除雲端商品 ───
    window.handleDeleteProduct = function(productId) {
        const prod = managerProductsList.find(p => p.id === productId);
        if (!prod) return;

        if (confirm(`確定要將【${prod.name}】從 Google 試算表菜單中永久移除嗎？`)) {
            const payload = {
                action: "delete_product",
                id: productId
            };

            fetch(PROD_GAS_URL, {
                method: "POST",
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(() => {
                alert("🗑️ 商品已從雲端刪除！");
                // 💡 刪除後，自己發動重新拉取
                window.fetchManagerProductsSelf(); 
            })
            .catch(error => console.error("刪除失敗:", error));
        }
    }

    // 🚀 5. 頁面初始化：一開機就完全自主發動連線
    document.addEventListener("DOMContentLoaded", () => {
        window.fetchManagerProductsSelf();
    });

})();