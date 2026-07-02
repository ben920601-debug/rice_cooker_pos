window.addEventListener("DOMContentLoaded", () => {
    if (window.location.href.includes("orders.html")) {
        loadTodayOrders();
    }
});

async function loadTodayOrders() {
    const tbody = document.getElementById("orders-table-body");
    try {
        const res = await fetch(`${API_BASE_URL}/orders/today`);
        if (!res.ok) throw new Error();
        const orders = await res.json();
        
        tbody.innerHTML = "";
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:40px;">今日尚無收銀交易明細紀錄。</td></tr>';
            return;
        }

        orders.forEach(o => {
            // 解析 C# 傳回的 ISO 時間格式並調整為本地台北時間
            const localTime = new Date(o.TransactionTime).toLocaleString('zh-TW', { hour12: false });
            
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid var(--border); font-size:0.95rem;">
                    <td style="padding: 14px 10px;">${localTime}</td>
                    <td style="padding: 14px 10px; font-family: monospace; font-weight: bold; color:var(--text);">${o.OrderId}</td>
                    <td style="padding: 14px 10px;">${o.CashierName}</td>
                    <td style="padding: 14px 10px; font-size: 0.88rem; color: var(--text-muted);">${o.Summary || "無明細摘要"}</td>
                    <td style="padding: 14px 10px; text-align: right; padding-right: 20px; font-weight: 800; color: var(--primary); font-family: monospace;">$${o.TotalAmount}</td>
                </tr>
            `;
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger); padding:40px;"><i class="fa-solid fa-circle-exclamation"></i> 遠端 Linux MySQL 資料庫讀取失敗</td></tr>';
    }
}

function handleManualRefresh() {
    loadTodayOrders();
}