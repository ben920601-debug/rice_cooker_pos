// js/staff.js (v2.0 增刪改全功能終極版)

(function() {
    // ⚠️ 請精準替換成你目前最新部署好的 GAS 網址（尾巴必須有 /exec）！
    const STAFF_GAS_URL = "https://script.google.com/macros/s/AKfycbyj0LZVFv9e7cp8Fn8guntnYNy78Dw7USlZ8gM3fJLag_ERtghpNlvNu9x6EtBfBDsB/exec";

    let localStaffList = []; // 本地人事名冊暫存庫
    let currentMode = "add"; // 💡 狀態控管中心："add" 代表新增模式，"edit" 代表編輯模式

    // ─── 🌐 1. 從雲端 GAS 非同步抓取最新員工名冊 ───
    window.fetchCloudStaff = function() {
        const tableBody = document.getElementById("staff-table-body");
        if (!tableBody) return;

        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> 正在連線雲端資料庫，讀取最新人事名冊...</td></tr>`;

        fetch(`${STAFF_GAS_URL}?action=get_staff`)
        .then(response => response.json())
        .then(data => {
            if (data && data.error) {
                console.error("GAS 後端回傳錯誤:", data.error);
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger); padding:20px;">❌ 雲端分頁異常: ${data.error}</td></tr>`;
                return;
            }
            if (!Array.isArray(data)) {
                return;
            }
            localStaffList = data;
            renderStaffTable();
        })
        .catch(error => {
            console.error("抓取人事名冊連線失敗:", error);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger); padding:20px;">❌ 無法連線到雲端資料庫</td></tr>`;
        });
    }

    // ─── 📊 2. 將員工陣列渲染成 HTML 表格列 (加入編輯 ✏️ 按鈕) ───
    function renderStaffTable() {
        const tableBody = document.getElementById("staff-table-body");
        if (!tableBody) return;

        if (localStaffList.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:40px;">📭 目前雲端試算表無任何員工資料</td></tr>`;
            return;
        }

        tableBody.innerHTML = localStaffList.map(staff => `
            <tr style="border-bottom: 1px solid var(--border); font-size: 0.95rem; transition: background 0.15s;">
                <td style="padding: 14px 10px; font-weight: 600; color: var(--primary); font-family: monospace;">${staff.code}</td>
                <td style="padding: 14px 10px; font-weight: 500; color: var(--text);">${staff.name}</td>
                <td style="padding: 14px 10px;"><span class="badge-${staff.role === '店長' ? 'manager' : 'staff'}" style="padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${staff.role}</span></td>
                <td style="padding: 14px 10px; color: var(--text-muted); font-family: monospace;">••••••</td>
                <td style="padding: 14px 10px; text-align: center; display: flex; gap: 15px; justify-content: center;">
                    <button onclick="openEditModalDirectly('${staff.code}')" style="background: transparent; border: none; color: var(--primary); cursor: pointer; font-size: 1.05rem;" title="修改員工資料">
                        <i class="fa-solid fa-user-pen"></i>
                    </button>
                    <button onclick="handleDeleteStaff('${staff.code}', '${staff.name}')" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 1.05rem;" title="註銷此員工帳號">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // ─── 🎯 3. 控制中樞：判斷現在點擊按鈕是要「新增」還是「編輯」 ───
    window.submitStaffFormAction = function() {
        if (currentMode === "add") {
            window.submitNewStaffDirectly();
        } else if (currentMode === "edit") {
            window.submitEditStaffDirectly();
        }
    }

    // ─── ➕ 4. 提交動作：執行「新增員工」 ───
    window.submitNewStaffDirectly = function() {
        const payload = getStaffFormPayload("add_staff");
        if (!payload) return;

        toggleSubmitButtonState(true, "寫入雲端中...");

        fetch(STAFF_GAS_URL, {
            method: "POST",
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            alert(`🎉 員工帳號【${payload.code}】已成功寫入雲端名冊！`);
            window.closeAddModal();   
            setTimeout(() => window.fetchCloudStaff(), 1000);
        })
        .catch(err => alert("❌ 連線失敗"))
        .finally(() => toggleSubmitButtonState(false, `<i class="fa-solid fa-check"></i> 確認新增`));
    };

    // ─── ✏️ 5. 提交動作：執行「編輯修改員工資料」 ───
    window.submitEditStaffDirectly = function() {
        const payload = getStaffFormPayload("edit_staff"); // 動態指派為修改分流
        if (!payload) return;

        toggleSubmitButtonState(true, "更新資料中...");

        fetch(STAFF_GAS_URL, {
            method: "POST",
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            alert(`✏️ 員工【${payload.code}】的個人資料已成功在雲端校正更新！`);
            window.closeAddModal();   
            setTimeout(() => window.fetchCloudStaff(), 1000); // 重新撈取最新名冊
        })
        .catch(err => alert("❌ 連線失敗"))
        .finally(() => toggleSubmitButtonState(false, `<i class="fa-solid fa-check"></i> 確認修改`));
    };

    // ─── 🗑️ 6. 註銷動作：刪除雲端員工帳號 ───
    window.handleDeleteStaff = function(staffCode, staffName) {
        const currentLogUser = localStorage.getItem("current_cashier_code");
        if (currentLogUser === staffCode) {
            alert("❌ 系統防呆：您目前正以此帳號登入中，無法進行自我註銷！");
            return;
        }

        if (confirm(`⚠️ 警告！您確定要將員工【${staffName}】從雲端名冊中永久移除嗎？`)) {
            fetch(STAFF_GAS_URL, {
                method: "POST",
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "delete_staff", code: staffCode })
            })
            .then(() => {
                alert(`🗑️ 員工帳號【${staffCode}】已成功註銷！`);
                window.fetchCloudStaff();
            })
            .catch(error => console.error(error));
        }
    }

    // ─── 🗃️ 7. 內部輔助：打包並檢查欄位 ───
    function getStaffFormPayload(actionName) {
        const codeInput = document.getElementById("staff-code");
        const nameInput = document.getElementById("staff-name");
        const passInput = document.getElementById("staff-password");
        const roleInput = document.getElementById("staff-role");

        const code = codeInput.value.trim().toUpperCase();
        const name = nameInput.value.trim();
        const password = passInput.value.trim();
        const role = roleInput.value;

        if (!code || !name || !password) {
            alert("⚠️ 所有欄位皆為必填，請檢查後再提交！");
            return null;
        }
        return { action: actionName, code, name, password, role };
    }

    function toggleSubmitButtonState(disabled, text) {
        const btn = document.getElementById("staff-submit-btn");
        if (btn) {
            btn.disabled = disabled;
            btn.innerHTML = text;
        }
    }

    // ─── 🗳️ 8. 彈窗控制：開啟「新增模式」彈窗 ───
    window.openAddModal = function() {
        currentMode = "add"; // 設定為新增
        
        // 變更 UI 文字，使其看起來是新增狀態
        document.getElementById("modal-title").innerHTML = `<i class="fa-solid fa-user-plus" style="color:var(--primary)"></i> 新增員工權限`;
        document.getElementById("staff-submit-btn").innerHTML = `<i class="fa-solid fa-check"></i> 確認新增`;
        
        // 💡 確保編號欄位可寫入
        document.getElementById("staff-code").disabled = false;
        document.getElementById("staff-code").style.background = "#fffdfa";

        document.getElementById("addModal").classList.add("active");
        setTimeout(() => document.getElementById("staff-code").focus(), 200);
    }

    // ─── ✏️ 9. 彈窗控制：開啟「編輯模式」彈窗，並自動帶入舊資料 ───
    window.openEditModalDirectly = function(staffCode) {
        currentMode = "edit"; // 💡 切換狀態為編輯
        
        // 尋找快取陣列裡面的員工
        const staff = localStaffList.find(s => s.code === staffCode);
        if (!staff) return;

        // 1. 動態調度變更 Modal 的抬頭與按鈕外觀文字
        document.getElementById("modal-title").innerHTML = `<i class="fa-solid fa-user-gear" style="color:var(--primary)"></i> 編輯員工權限與資料`;
        document.getElementById("staff-submit-btn").innerHTML = `<i class="fa-solid fa-user-check"></i> 確認修改資料`;

        // 2. 💡 完美灌入舊資料到各個輸入框中
        document.getElementById("staff-code").value = staff.code;
        document.getElementById("staff-name").value = staff.name;
        document.getElementById("staff-password").value = staff.password;
        document.getElementById("staff-role").value = staff.role;

        // 3. 💡 安全防線：編輯時編號不可以被亂改，所以將 Input 設為禁用狀態 (Disabled)
        document.getElementById("staff-code").disabled = true;
        document.getElementById("staff-code").style.background = "#e5e7eb"; // 灰色不可改背景

        // 顯示 Modal
        document.getElementById("addModal").classList.add("active");
        setTimeout(() => document.getElementById("staff-name").focus(), 200);
    }

    // ─── 🧽 10. 彈窗控制：安全手動關閉並清空 ───
    window.closeAddModal = function() {
        const addModal = document.getElementById("addModal");
        if (addModal) addModal.classList.remove("active");

        const codeInput = document.getElementById("staff-code");
        const nameInput = document.getElementById("staff-name");
        const passInput = document.getElementById("staff-password");
        const roleInput = document.getElementById("staff-role");

        if (codeInput) { codeInput.value = ""; codeInput.disabled = false; }
        if (nameInput) nameInput.value = "";
        if (passInput) passInput.value = "";
        if (roleInput) roleInput.value = "店員";
    }

    // 🚀 11. 初始化自動執行
    document.addEventListener("DOMContentLoaded", () => {
        window.fetchCloudStaff();
    });

})();