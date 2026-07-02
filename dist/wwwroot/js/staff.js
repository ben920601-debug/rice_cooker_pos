window.addEventListener("DOMContentLoaded", () => {
    if (window.location.href.includes("staff.html")) {
        loadStaffTable();
    }
});

// 📋 1. 載入員工資料表
async function loadStaffTable() {
    const tbody = document.getElementById("staff-table-body");
    try {
        const res = await fetch(`${API_BASE_URL}/staff`);
        const staffs = await res.json();
        
        tbody.innerHTML = "";
        staffs.forEach(s => {
            const roleBadge = s.Role === "店長" ? "badge-danger" : "badge-success";
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 14px 12px; font-family: monospace; font-weight: bold;">${s.StaffCode}</td>
                    <td style="padding: 14px 12px;">${s.StaffName}</td>
                    <td style="padding: 14px 12px;"><span class="badge ${roleBadge}">${s.Role}</span></td>
                    <td style="padding: 14px 12px; font-family: monospace; letter-spacing: 2px;">****</td>
                    <td style="padding: 14px 12px; text-align: center; display:flex; justify-content:center; gap:8px;">
                        <button onclick="openEditModal('${s.StaffCode}', '${s.StaffName}', '${s.Role}')" style="background:#e0f2fe; color:#0369a1; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.85rem;"><i class="fa-solid fa-user-pen"></i> 編輯</button>
                        <button onclick="deleteStaff('${s.StaffCode}')" style="background:#fee2e2; color:#b91c1c; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.85rem;"><i class="fa-solid fa-user-xmark"></i> 刪除</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger); padding:40px;">讀取雲端人事失敗</td></tr>';
    }
}

// ➕ 2. 新增員工控制
function openAddModal() { document.getElementById("addModal").classList.add("active"); }
function closeAddModal() { document.getElementById("addModal").classList.remove("active"); }

async function submitStaffFormAction() {
    const code = document.getElementById("staff-code").value.trim();
    const name = document.getElementById("staff-name").value.trim();
    const role = document.getElementById("staff-role").value;
    const pwd = document.getElementById("staff-password").value.trim();

    if(!code || !name || !pwd) { alert("請填寫完整員工權限欄位！"); return; }

    const payload = { StaffCode: code, StaffName: name, Role: role, Password: pwd };
    
    try {
        const res = await fetch(`${API_BASE_URL}/staff`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if(res.ok) {
            closeAddModal();
            // 清空輸入框
            document.getElementById("staff-code").value = "";
            document.getElementById("staff-name").value = "";
            document.getElementById("staff-password").value = "";
            await loadStaffTable();
        } else {
            const err = await res.json();
            alert(err.message || "新增失敗");
        }
    } catch { alert("連線錯誤"); }
}

// ✏️ 3. 編輯員工控制
function openEditModal(code, name, role) {
    document.getElementById("edit-staff-code").value = code;
    document.getElementById("edit-staff-name").value = name;
    document.getElementById("edit-staff-role").value = role;
    document.getElementById("edit-staff-password").value = "";
    document.getElementById("editModal").classList.add("active");
}
function closeEditModal() { document.getElementById("editModal").classList.remove("active"); }

async function handleUpdateStaff(event) {
    event.preventDefault();
    const code = document.getElementById("edit-staff-code").value;
    const name = document.getElementById("edit-staff-name").value;
    const role = document.getElementById("edit-staff-role").value;
    const pwd = document.getElementById("edit-staff-password").value;

    const payload = { StaffName: name, Role: role, Password: pwd };

    try {
        const res = await fetch(`${API_BASE_URL}/staff/${code}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            closeEditModal();
            await loadStaffTable();
        } else { alert("修改失敗"); }
    } catch { alert("連線故障"); }
}

// ❌ 4. 刪除員工
async function deleteStaff(code) {
    if(!confirm(`確定要註銷員工編號為 [ ${code} ] 的所有系統登入權限嗎？`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/staff/${code}`, { method: "DELETE" });
        if(res.ok) { await loadStaffTable(); }
    } catch { alert("刪除連線超時"); }
}

function handleManualRefresh() { loadStaffTable(); }