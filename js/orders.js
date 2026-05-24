// js/orders.js

(function() {
    // 💡 終極優化：將訂單管理看板的網址鎖在內部，不需要再依賴全域變數！
    // ⚠️ 請精準替換成你最新部署好的 GAS 網址（尾巴必須有 /exec）！
    const ORDERS_GAS_URL = "https://script.google.com/macros/s/AKfycbyj0LZVFv9e7cp8Fn8guntnYNy78Dw7USlZ8gM3fJLag_ERtghpNlvNu9x6EtBfBDsB/exec";

    let localOrdersList = []; // 本地今日交易紀錄暫存庫

    // 1. 從雲端 GAS 非同步抓取今日所有交易紀錄
    window.fetchCloudOrders = function() {
        const tableBody = document.getElementById("orders-table-body");
        
        // 安全防線：如果這一頁沒有訂單表格（例如人在點餐頁），就優雅退出，絕不噴錯卡死系統
        if (!tableBody) return;

        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> 正在連線雲端資料庫，拉取最新交易看板...</td></tr>`;

        // 帶上 action=get_orders 參數去敲 GAS 大門
        fetch(`${ORDERS_GAS_URL}?action=get_orders`)
        .then(response => response.json())
        .then(data => {
            // 防呆：檢查後端是否噴錯
            if (data && data.error) {
                console.error("GAS 後端回傳錯誤:", data.error);
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger); padding:20px;">❌ 雲端分頁異常: ${data.error}</td></tr>`;
                return;
            }

            // 防呆：確認回傳的是否為陣列
            if (!Array.isArray(data)) {
                console.error("回傳格式異常，預期為陣列:", data);
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger); padding:20px;">❌ 雲端回傳資料格式錯誤（非陣列）</td></tr>`;
                return;
            }

            // 💡 排序小巧思：最新結帳的訂單永遠顯示在最上面（倒序排列）
            localOrdersList = data.reverse(); 
            
            // 執行畫面渲染
            renderOrdersTable();
        })
        .catch(error => {
            console.error("抓取訂單看板連線失敗:", error);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger); padding:20px;">❌ 無法連線到雲端資料庫，請檢查網路狀態或 F12 Console。</td></tr>`;
        });
    }

    // 2. 將訂單陣列渲染成 HTML 表格列
    function renderOrdersTable() {
        const tableBody = document.getElementById("orders-table-body");
        if (!tableBody) return;

        if (localOrdersList.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:50px;">📭 今日目前尚無任何交易扣款紀錄</td></tr>`;
            return;
        }

        // 💡 精準解構新版 GAS 的五大指標欄位：timestamp, id, cashier, details, total
        tableBody.innerHTML = localOrdersList.map(order => {
            
            // 🕒 時間格式優化相容鏈
            let displayTime = order.timestamp;
            if (typeof order.timestamp === "string") {
                // 如果是 GAS 帶有 T 的 ISO 時間格式，轉化為易讀格式
                displayTime = order.timestamp.replace("T", " ").replace(".000Z", "");
            }

            return `
                <tr style="border-bottom: 1px solid var(--border); font-size: 0.95rem; transition: background 0.15s;">
                    <td style="padding: 14px 10px; color: var(--text-muted); font-size: 0.85rem; font-family: monospace;">${displayTime}</td>
                    <td style="padding: 14px 10px; font-weight: 600; color: var(--text); font-family: monospace;">${order.id}</td>
                    <td style="padding: 14px 10px; color: #4b5563;"><i class="fa-regular fa-user" style="font-size:0.85rem; margin-right:4px; color: var(--primary);"></i> ${order.cashier}</td>
                    <td style="padding: 14px 10px; font-weight: 500; color: #1f2937; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${order.details}">${order.details}</td>
                    <td style="padding: 14px 10px; font-weight: 700; color: var(--primary); font-size: 1.05rem; font-family: monospace; text-align: right; padding-right: 20px;">$${order.total}</td>
                </tr>
            `;
        }).join('');
    }

    // 🚀 頁面加載完成後自動安全觸發
    document.addEventListener("DOMContentLoaded", () => {
        window.fetchCloudOrders();
    });

})();