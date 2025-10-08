// ==========================================================
// SCRIPT-ADMIN.JS (สำหรับหน้าแอดมิน)
// ==========================================================

// **ต้องเปลี่ยน** ใส่ URL ของ Web App ที่คุณ Deploy ครั้งล่าสุด
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxU1F0aLauV0O5WswANOs68hgi-MAkFFZujAMGDwaA4Kpt0OBMpWnZfn2d7hfdPQo5Tug/exec';
let fullHistoryData = [];

document.addEventListener('DOMContentLoaded', () => {
    loadMasterListForAdmin();
    document.getElementById('add-item-btn').addEventListener('click', handleAddItem);
    loadShipmentHistory();
    document.getElementById('history-search').addEventListener('input', filterAndRenderHistory);
    document.getElementById('history-filter').addEventListener('change', filterAndRenderHistory);
});

// --- [เวอร์ชันอัปเดต] ฟังก์ชัน loadMasterListForAdmin ---
async function loadMasterListForAdmin() {
    const listContainer = document.getElementById('master-list-admin-view');
    listContainer.innerHTML = '<p>กำลังโหลดรายการ...</p>';

    try {
        const response = await fetch(`${WEB_APP_URL}?action=getMasterList`);
        const data = await response.json();

        if (data.status === 'success' && data.masterItems.length > 0) {
            listContainer.innerHTML = '<ul></ul>';
            const ul = listContainer.querySelector('ul');
            data.masterItems.forEach(item => {
                const li = document.createElement('li');
                // *** [แก้ไข] โครงสร้าง HTML ใหม่ที่ใช้ Flexbox ***
                li.innerHTML = `
                    <div class="display-view">
                        <span class="item-name">${item.name} <em class="item-type">(${item.type})</em></span>
                        <div class="actions">
                            <button class="edit-btn admin-btn">แก้ไข</button>
                            <button class="delete-btn admin-btn">ลบ</button>
                        </div>
                    </div>
                    <div class="edit-view" style="display:none;">
                        <input type="text" class="edit-name-input" value="${item.name}">
                        <select class="edit-type-select">
                            <option value="เครื่องมือผ่าตัด" ${item.type === 'เครื่องมือผ่าตัด' ? 'selected' : ''}>เครื่องมือผ่าตัด</option>
                            <option value="อุปกรณ์" ${item.type === 'อุปกรณ์' ? 'selected' : ''}>อุปกรณ์</option>
                            <option value="อื่นๆ" ${item.type === 'อื่นๆ' ? 'selected' : ''}>อื่นๆ</option>
                        </select>
                        <div class="actions">
                            <button class="save-btn admin-btn">บันทึก</button>
                            <button class="cancel-btn admin-btn">ยกเลิก</button>
                        </div>
                    </div>
                `;
                // เพิ่ม Event Listener ให้ปุ่มต่างๆ (โค้ดส่วนนี้เหมือนเดิม)
                li.querySelector('.edit-btn').addEventListener('click', () => toggleEditView(li, true));
                li.querySelector('.cancel-btn').addEventListener('click', () => toggleEditView(li, false));
                li.querySelector('.delete-btn').addEventListener('click', () => handleDeleteItem(item.name));
                li.querySelector('.save-btn').addEventListener('click', () => handleSaveItem(li, item.name)); 
                ul.appendChild(li);
            });
        } else {
            listContainer.innerHTML = `<p class="no-data">ไม่พบรายการเครื่องมือ</p>`;
        }
    } catch (error) {
        console.error('Error loading master list for admin:', error);
        listContainer.innerHTML = '<p class="no-data">เกิดข้อผิดพลาดในการโหลดรายการ</p>';
    }
}

async function handleAddItem() {
    const newItemInput = document.getElementById('new-item-input');
    const newItemTypeSelect = document.getElementById('new-item-type-select');
    const newItemName = newItemInput.value.trim();
    const newItemType = newItemTypeSelect.value;

    if (newItemName === '') {
        alert('กรุณาป้อนชื่อรายการเครื่องมือ');
        return;
    }

    const payload = {
        action: 'addMasterListItem',
        itemName: newItemName,
        itemType: newItemType 
    };

    const addBtn = document.getElementById('add-item-btn');
    try {
        addBtn.disabled = true;
        addBtn.textContent = 'กำลังเพิ่ม...';

        const payloadString = JSON.stringify(payload);
        const encodedPayload = encodeURIComponent(payloadString);
        const requestUrl = `${WEB_APP_URL}?payload=${encodedPayload}`;

        const response = await fetch(requestUrl);
        const data = await response.json();

        if (data.status === 'success') {
            alert(data.message);
            newItemInput.value = ''; // ล้างช่อง input
            loadMasterListForAdmin(); // โหลดรายการใหม่
        } else {
            alert('เกิดข้อผิดพลาด: ' + data.message);
        }
    } catch (error) {
        console.error('Error adding item:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'เพิ่ม';
    }
}

async function handleDeleteItem(itemName) {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${itemName}" ?`)) {
        return;
    }

    const payload = {
        action: 'deleteMasterListItem',
        itemName: itemName
    };

    try {
        // อาจจะเพิ่ม UI แสดงสถานะกำลังลบได้
        const payloadString = JSON.stringify(payload);
        const encodedPayload = encodeURIComponent(payloadString);
        const requestUrl = `${WEB_APP_URL}?payload=${encodedPayload}`;

        const response = await fetch(requestUrl);
        const data = await response.json();

        if (data.status === 'success') {
            alert(data.message);
            loadMasterListForAdmin(); // โหลดรายการใหม่
        } else {
            alert('เกิดข้อผิดพลาด: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
}
// ฟังก์ชันใหม่: จัดการการบันทึกชื่อที่แก้ไข
async function handleSaveItem(listItemElement, oldItemName) {
    const inputField = listItemElement.querySelector('.edit-view input');
    const newItemName = inputField.value.trim();

    if (newItemName === '') {
        alert('ชื่อรายการห้ามว่าง');
        return;
    }

    if (newItemName === oldItemName) {
        // ถ้าไม่มีการเปลี่ยนแปลง ก็แค่สลับกลับไปโหมดแสดงผล
        toggleEditView(listItemElement, false);
        return;
    }

    const payload = {
        action: 'editMasterListItem',
        oldItemName: oldItemName,
        newItemName: newItemName
    };
    
    // (ใช้ GET Tunneling เหมือนเดิม)
    try {
        const payloadString = JSON.stringify(payload);
        const encodedPayload = encodeURIComponent(payloadString);
        const requestUrl = `${WEB_APP_URL}?payload=${encodedPayload}`;

        const response = await fetch(requestUrl);
        const data = await response.json();

        if (data.status === 'success') {
            alert(data.message);
            loadMasterListForAdmin(); // โหลดรายการใหม่ทั้งหมด
        } else {
            alert('เกิดข้อผิดพลาด: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving item:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
}

// ฟังก์ชันใหม่: สลับระหว่างโหมดแสดงผลและโหมดแก้ไข
function toggleEditView(listItemElement, isEditing) {
    const displayView = listItemElement.querySelector('.display-view');
    const editView = listItemElement.querySelector('.edit-view');
    if (isEditing) {
        displayView.style.display = 'none';
        editView.style.display = 'flex'; // ใช้ flexbox เพื่อจัดเรียง
    } else {
        displayView.style.display = 'flex';
        editView.style.display = 'none';
    }
}

// ฟังก์ชันใหม่: จัดการการบันทึกชื่อที่แก้ไข
async function handleSaveItem(listItemElement, oldItemName) {
    const inputField = listItemElement.querySelector('.edit-view input');
    const newItemName = inputField.value.trim();
    const newNameInput = listItemElement.querySelector('.edit-name-input');
    const newTypeSelect = listItemElement.querySelector('.edit-type-select');
    const newItemType = newTypeSelect.value; // ดึงค่า Type ใหม่

    if (newItemName === '') {
        alert('ชื่อรายการห้ามว่าง');
        return;
    }

    if (newItemName === oldItemName) {
        // ถ้าไม่มีการเปลี่ยนแปลง ก็แค่สลับกลับไปโหมดแสดงผล
        toggleEditView(listItemElement, false);
        return;
    }

   const payload = {
        action: 'editMasterListItem',
        oldItemName: oldItemName,
        newItemName: newItemName,
        itemType: newItemType // ส่ง Type ไปด้วย
    };
    
    // (ใช้ GET Tunneling เหมือนเดิม)
    try {
        const payloadString = JSON.stringify(payload);
        const encodedPayload = encodeURIComponent(payloadString);
        const requestUrl = `${WEB_APP_URL}?payload=${encodedPayload}`;

        const response = await fetch(requestUrl);
        const data = await response.json();

        if (data.status === 'success') {
            alert(data.message);
            loadMasterListForAdmin(); // โหลดรายการใหม่ทั้งหมด
        } else {
            alert('เกิดข้อผิดพลาด: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving item:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
}
async function loadShipmentHistory() {
    const container = document.getElementById('history-table-container');
    container.innerHTML = '<p>กำลังโหลดประวัติ...</p>';

    try {
        const response = await fetch(`${WEB_APP_URL}?action=getShipmentHistory`);
        const data = await response.json();

        if (data.status === 'success') {
            fullHistoryData = data.history; // เก็บข้อมูลทั้งหมดไว้
            filterAndRenderHistory(); // เรียกใช้ฟังก์ชันแสดงผลครั้งแรก
        } else {
            container.innerHTML = `<p class="no-data">เกิดข้อผิดพลาด: ${data.message}</p>`;
        }
    } catch (error) {
        console.error('Error loading shipment history:', error);
        container.innerHTML = '<p class="no-data">เกิดข้อผิดพลาดในการโหลดประวัติ</p>';
    }
}
function filterAndRenderHistory() {
    const container = document.getElementById('history-table-container');
    const searchKeyword = document.getElementById('history-search').value.toLowerCase();
    const statusFilter = document.getElementById('history-filter').value;

    // 1. กรองข้อมูลจาก fullHistoryData
    let filteredData = fullHistoryData.filter(shipment => {
        // กรองตามสถานะ
        const statusMatch = (statusFilter === 'all') || (shipment.Status === statusFilter);

        // กรองตาม Keyword (ค้นหาจากหลายๆ field)
        const keywordMatch = (
            shipment.ShipmentID.toLowerCase().includes(searchKeyword) ||
            shipment.Items.toLowerCase().includes(searchKeyword) ||
            shipment.DispatchedBy.toLowerCase().includes(searchKeyword) ||
            (shipment.ReceivedBy && shipment.ReceivedBy.toLowerCase().includes(searchKeyword))
        );
        
        return statusMatch && keywordMatch;
    });

    // 2. สร้างตารางจากข้อมูลที่กรองแล้ว
    if (filteredData.length === 0) {
        container.innerHTML = '<p class="no-data">ไม่พบข้อมูลตรงตามเงื่อนไข</p>';
        return;
    }

    let tableHTML = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>สถานะ</th>
                    <th>เวลาส่งออก</th>
                    <th>ผู้ส่ง</th>
                    <th>เวลาที่รับ</th>
                    <th>ผู้รับ</th>
                    <th>ผลการตรวจสอบ</th>
                    <th>หมายเหตุ</th>
                    <th>รายการ</th>
                </tr>
            </thead>
            <tbody>
    `;

    filteredData.forEach(shipment => {
        // จัดรูปแบบข้อมูลสำหรับแสดงผล
        const dispatchTime = shipment.DispatchTimestamp ? new Date(shipment.DispatchTimestamp).toLocaleString('th-TH') : '-';
        const receiveTime = shipment.ReceivedTimestamp ? new Date(shipment.ReceivedTimestamp).toLocaleString('th-TH') : '-';
        const items = shipment.Items.replace(/\|\|\|/g, ', ').replace(/::/g, ': ');

        // สร้าง Badge สำหรับสถานะ
        let statusBadge = '';
        if (shipment.Status === 'In Transit') statusBadge = `<span class="status-badge status-in-transit">กำลังขนส่ง</span>`;
        else if (shipment.Status === 'Delayed') statusBadge = `<span class="status-badge status-delayed">ล่าช้า</span>`;
        else if (shipment.Status === 'Received') statusBadge = `<span class="status-badge status-received">รับของแล้ว</span>`;

        // สร้าง Badge สำหรับผลการตรวจสอบ
        let verificationBadge = '-';
        if (shipment.VerificationStatus === 'OK') verificationBadge = `<span class="status-badge status-ok">OK</span>`;
        else if (shipment.VerificationStatus === 'Discrepancy') verificationBadge = `<span class="status-badge status-discrepancy">ไม่ตรงกัน</span>`;

        tableHTML += `
            <tr>
                <td>${shipment.ShipmentID}</td>
                <td>${statusBadge}</td>
                <td>${dispatchTime}</td>
                <td>${shipment.DispatchedBy || '-'}</td>
                <td>${receiveTime}</td>
                <td>${shipment.ReceivedBy || '-'}</td>
                <td>${verificationBadge}</td>
                <td>${shipment.Notes || '-'}</td>
                <td style="white-space: normal;">${items}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}


