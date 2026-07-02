window.addEventListener("DOMContentLoaded", () => {
    if (window.location.href.includes("products.html")) {
        loadManagerProducts();
    }
});

// 📋 1. 拉取所有同步品項
async function loadManagerProducts() {
    const tbody = document.getElementById("manager-product-table");
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        const products = await res.json();
        
        tbody.innerHTML = "";
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:30px;">目前試算表/資料庫尚無任何品項</td></tr>';
            return;
        }

        products.forEach(p => {
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 14px 10px; font-family: monospace;">${p.Id}</td>
                    <td style="padding: 14px 10px; font-weight: 600;">${p.Name}</td>
                    <td style="padding: 14px 10px; font-family: monospace; font-weight: bold; color: var(--primary);">$${p.Price}</td>
                    <td style="padding: 14px 10px; text-align: center;">
                        <button onclick="deleteProduct('${p.Id}')" style="background:#fee2e2; color:#b91c1c; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.85rem;"><i class="fa-solid fa-trash"></i> 下架</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--danger); padding:30px;">❌ 連線 C# 後端失敗</td></tr>';
    }
}

// ➕ 2. 新增上架新品
async function handleCreateProduct(event) {
    event.preventDefault();
    const nameInput = document.getElementById("new-prod-name");
    const priceInput = document.getElementById("new-prod-price");
    const btn = document.getElementById("add-product-btn");

    const payload = {
        Name: nameInput.value,
        Price: parseFloat(priceInput.value)
    };

    btn.disabled = true;
    try {
        const res = await fetch(`${API_BASE_URL}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            nameInput.value = "";
            priceInput.value = "";
            await loadManagerProducts(); // 刷新列表
        } else {
            alert("新增商品失敗");
        }
    } catch (err) {
        alert("通訊故障，無法連線後端 API");
    } finally {
        btn.disabled = false;
    }
}

// ❌ 3. 下架商品
async function deleteProduct(id) {
    if (!confirm(`確定要下架商品代碼為 [ ${id} ] 的品項嗎？`)) return;

    try {
        const res = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: "DELETE"
        });
        if (res.ok) {
            await loadManagerProducts();
        } else {
            alert("下架失敗");
        }
    } catch (err) {
        alert("連線失敗");
    }
}

function handleManualRefresh() {
    loadManagerProducts();
}