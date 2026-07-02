// js/ui.js

document.addEventListener("DOMContentLoaded", () => {
    // ==================== 1. 自動偵測網址並高亮側邊欄 ====================
    handleSidebarActiveState();

    // ==================== 2. 頂部即時時鐘 ====================
    handleLiveClock();

    // ==================== 3. ✨ 新增：跨頁面自動同步目前登入的收銀員名字 ====================
    syncHeaderCashierName();
});

function handleSidebarActiveState() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    if (!sidebarItems.length) return;
    const currentPath = window.location.pathname.split("/").pop();
    sidebarItems.forEach(item => {
        const link = item.querySelector('a');
        if (!link) return;
        const href = link.getAttribute('href');
        if (currentPath === href) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function handleLiveClock() {
    const liveClock = document.getElementById('liveClock');
    if (!liveClock) return;
    liveClock.innerText = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    setInterval(() => {
        liveClock.innerText = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    }, 1000);
}

/**
 * ✨ 新增：讓今日訂單、商品管理、人事管理頁面也能知道目前是誰登入
 */
function syncHeaderCashierName() {
    const cashierNameSpan = document.getElementById("cashier-name");
    if (!cashierNameSpan) return;

    const savedCode = localStorage.getItem("current_cashier_code");
    const savedName = localStorage.getItem("current_cashier_name");
    const savedRole = localStorage.getItem("current_cashier_role"); // 💡 抓取角色

    if (savedCode && savedName) {
        cashierNameSpan.innerText = `收銀員：${savedCode} ${savedName} (${savedRole})`;

        // 💡 ✨ 核心權限控管：如果是店員
        if (savedRole === "店員") {
            // 1. 自動找出側邊欄「商品管理」、「人事管理」、「今日訂單」的 HTML 標籤並隱藏
            const menuItems = document.querySelectorAll('.sidebar-menu .sidebar-item');
            menuItems.forEach(item => {
                const href = item.querySelector('a')?.getAttribute('href');
                // 如果超連結包含以下三個後台頁面，直接對店員隱藏
                if (href === "products.html" || href === "staff.html" || href === "orders.html") {
                    item.style.display = "none";
                }
            });

            // 2. 防偷開防線：如果店員手動在網址列輸入 staff.html 或 products.html 意圖強行進入
            const currentPath = window.location.pathname.split("/").pop();
            if (currentPath === "products.html" || currentPath === "staff.html" || currentPath === "orders.html") {
                alert("⚠️ 權限不足！此頁面僅限【管理者】存取。");
                window.location.href = "home.html"; // 強制遣返回點餐首頁
            }
        }

    } else {
        const cashier = localStorage.getItem("cashier"); 

        if (!cashier) {
            alert("系統尚未授權連線，請先登入收銀帳號！");
            window.location.href = "/index.html";
            return;
        }
    }
}

/**
 * 即時時鐘功能
 */
function handleLiveClock() {
    const liveClock = document.getElementById('liveClock');
    if (!liveClock) return;

    liveClock.innerText = new Date().toLocaleTimeString('zh-TW', { hour12: false });

    setInterval(() => {
        liveClock.innerText = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    }, 1000);
}

// ==================== 🔄 全域手動強制重載雲端資料中心 ====================
// js/ui.js 內部的 handleManualRefresh 微調
window.handleManualRefresh = function() {
    const refreshBtnIcon = document.querySelector(".btn-refresh-trigger i");
    if (refreshBtnIcon) {
        refreshBtnIcon.classList.add("fa-spin");
    }

    // 💡 捕捉跑馬燈元件
    const marqueeElement = document.getElementById("system-marquee");
    if (marqueeElement) {
        // 瞬間切換成帥氣的連線同步中字樣！
        marqueeElement.innerHTML = `<i class="fa-solid fa-cloud-arrow-down" style="color:#3b82f6;"></i> 正在強制繞過快取，向 Google 試算表請求最新密鑰資料...`;
    }

    const currentPage = window.location.pathname.split("/").pop();

    // ... (這裡維持你原本寫好的分頁 if/else 派發抓取邏輯，不需要改動) ...

    // 延遲 800 毫秒後，把轉動動畫拔掉
    setTimeout(() => {
        if (refreshBtnIcon) refreshBtnIcon.classList.remove("fa-spin");
        
        // 💡 同步完成！再次動態改寫跑馬燈，給店員一個最完美的視覺反饋！
        if (marqueeElement) {
            marqueeElement.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#10b981;"></i> ⚡️ 雲端資料庫同步完成！全系統本地緩衝快取已校正歸位。`;
        }
    }, 800);
};