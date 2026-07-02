// ==========================================
// 🛡️ 飯匙雲端 POS - 全域權限保全與攔截機制 (無懈可擊穩定版)
// ==========================================

// 🚀 【第 0 道超前防線】進網頁的一瞬間「立刻檢查」，根本不等 DOM 載入！
(function() {
    const currentUrl = window.location.href;
    const storedName = localStorage.getItem("cashier");

    // 🛑 如果「不是登入頁」且「瀏覽器小本子沒名字」，在畫面渲染前「直接踢回首頁」
    if (!currentUrl.includes("index.html")) {
        if (!storedName) {
            // 💡 移除惱人的 alert() 可以讓跳轉完全無縫、不卡頓；
            // 如果一定要提示，維持 alert 也可以，但此時畫面背景絕對會是白色的乾淨狀態！
            alert("🔒 系統偵測登入憑證失效，請重新登入！");
            window.location.href = "/index.html";
        }
    }
})();

// 🎨 畫面結構安全載入後，才執行非同步的名冊與 UI 覆蓋
window.addEventListener("DOMContentLoaded", () => {
    try {
        const currentUrl = window.location.href;
        const storedName = localStorage.getItem("cashier");
        const storedRole = localStorage.getItem("role") || "店員";

        // 1. 尋找右上角的身分顯示標籤
        const cashierNameSpan = document.getElementById("cashier-name");
        if (cashierNameSpan) {
            if (storedName) {
                cashierNameSpan.innerText = `${storedRole}：${storedName}`;
            } else {
                cashierNameSpan.innerText = `${storedRole}：未登入`;
            }
        }

        // 2. 🛑 職稱權限精細檢查：只有「店長」能進入門市人事管理
        if (currentUrl.includes("staff.html")) {
            if (storedRole !== "店長") {
                alert("❌ 您的系統權限不足！只有【店長】才能管理門市人事帳號。");
                window.location.href = "/home.html"; 
                return;
            }
        }

        // 3. 如果在「登入頁 (index.html)」，且下拉選單存在，才去後端載入名冊
        const staffSelect = document.getElementById("login-staff-select");
        if (staffSelect && currentUrl.includes("index.html")) {
            loadStaffDropdown();
        }

    } catch (globalError) {
        console.error("權限保全系統發生未預期錯誤:", globalError);
    }
});

// ⏳ 異步從 C# API 讀取 Linux MySQL 員工名冊並渲染至下拉選單
async function loadStaffDropdown() {
    const select = document.getElementById("login-staff-select");
    if (!select) return;

    try {
        const res = await fetch(`${API_BASE_URL}/staff`);
        if (!res.ok) throw new Error("後端資料庫回應異常");
        
        const staffs = await res.json();
        select.innerHTML = '<option value="" disabled selected>請選擇員工編號</option>';
        
        staffs.forEach(s => {
            select.innerHTML += `<option value="${s.StaffCode}">${s.StaffCode} - ${s.StaffName} (${s.Role})</option>`;
        });
    } catch (err) {
        console.error("無法載入員工名冊:", err);
        select.innerHTML = '<option value="" disabled>❌ 無法連線至 C# 後端資料庫，請檢查連線</option>';
    }
}

// 🔐 執行員工密碼驗證與登入
async function handleLoginExecute(event) {
    event.preventDefault();
    const staffCode = document.getElementById("login-staff-select").value;
    const password = document.getElementById("login-password").value;
    const errorMsg = document.getElementById("login-error-msg");
    const submitBtn = document.getElementById("login-submit-btn");

    if (!staffCode) {
        alert("請選擇員工編號！");
        return;
    }

    errorMsg.style.display = "none";
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                StaffCode: staffCode,
                Password: password
            })
        });

        if (res.ok) {
            const data = await res.json();
            
            // 💡 將 C# 傳回的大寫屬性值存入 localStorage
            localStorage.setItem("cashier", data.StaffName);
            localStorage.setItem("role", data.Role);
            
            // 驗證成功，放行進入系統主頁
            window.location.href = "/home.html"; 
        } else {
            errorMsg.style.display = "flex"; // 401 密碼錯誤
        }
    } catch (err) {
        console.error("登入通訊連線失敗:", err);
        alert("連線後端 API 失敗，請確認 C# 後端服務已成功執行。");
    } finally {
        submitBtn.disabled = false;
    }
}

// 🚪 登出系統並清除瀏覽器小本子憑證
function handleLogout() {
    if (confirm("確定要登出系統並鎖定收銀台嗎？")) {
        localStorage.clear(); 
        window.location.href = "/index.html";
    }
}