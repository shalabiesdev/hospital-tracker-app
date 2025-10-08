// ==========================================================
// SCRIPT-RECEIVER.JS (สำหรับหน้ารับของ)
// ==========================================================

// **ต้องเปลี่ยน** ใส่ URL ของ Web App ที่คุณ Deploy ครั้งล่าสุด
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz6QJ-jTtkRtFxuj4DNSKFRcabmCCyreQXQccrm-a582ogTPTiaMW15KTIq5QeQViyWGQ/exec';

document.addEventListener('DOMContentLoaded', () => {
    loadInTransitShipments();
    document.getElementById('refresh-receive-btn').addEventListener('click', loadInTransitShipments);

    // --- Modal Event Listeners ---
    const modal = document.getElementById('receive-modal');
    const closeBtn = document.querySelector('.close-button');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    closeBtn.onclick = () => modal.style.display = "none";
    cancelBtn.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
    confirmBtn.addEventListener('click', handleConfirmReceive);
});

// --- ฟังก์ชันสำหรับโหลดรายการที่กำลังขนส่ง ---
async function loadInTransitShipments() {
    const listContainer = document.getElementById('in-transit-shipments');
    listContainer.innerHTML = '<p>กำลังโหลดรายการที่กำลังขนส่ง...</p>';
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getInTransitShipments`);
        const data = await response.json();

        if (data.status === 'success' && data.shipments.length > 0) {
            listContainer.innerHTML = '';
            data.shipments.forEach(shipment => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('shipment-item');
                const itemsForDisplay = shipment.Items.map(item => item.name).join(', '); 
                itemDiv.innerHTML = `
                    <div>
                        <p><strong>ID:</strong> ${shipment.ShipmentID}</p>
                        <p><strong>ส่งออกเมื่อ:</strong> ${new Date(shipment.DispatchTimestamp).toLocaleString('th-TH')}</p>
                        <p><strong>รายการ:</strong> ${itemsForDisplay}</p>
                    </div>
                    <button class="receive-btn">รับของและตรวจสอบ</button>
                `;
                itemDiv.querySelector('.receive-btn').addEventListener('click', () => openReceiveModal(shipment));
                listContainer.appendChild(itemDiv);
            });
        } else {
            listContainer.innerHTML = '<p class="no-data">ไม่มีรายการเครื่องมือที่กำลังขนส่ง</p>';
        }
    } catch (error) {
        console.error('Error loading in-transit shipments:', error);
        listContainer.innerHTML = '<p class="no-data">เกิดข้อผิดพลาดในการโหลดรายการ</p>';
    }
}

// --- ฟังก์ชันสำหรับเปิดและเตรียม Modal ---
function openReceiveModal(shipment) {
    const modal = document.getElementById('receive-modal');
    const modalTitle = document.getElementById('modal-title');
    const checklistContainer = document.getElementById('modal-checklist');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    modalTitle.textContent = `ตรวจสอบรายการรับของ ID: ${shipment.ShipmentID}`;
    checklistContainer.innerHTML = '';
    shipment.Items.forEach(item => {
        const label = document.createElement('label');
        // เก็บ type ไว้ใน data attribute แต่แสดงแค่ชื่อ
        label.innerHTML = `<input type="checkbox" value="${item.name}" data-type="${item.type}" checked> ${item.name} <em class="item-type">(${item.type})</em>`;
        checklistContainer.appendChild(label);
    });
    confirmBtn.dataset.shipmentId = shipment.ShipmentID;
    modal.style.display = "block";
}

// --- ฟังก์ชันที่ทำงานเมื่อกดยืนยันใน Modal ---
async function handleConfirmReceive() {
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const shipmentId = confirmBtn.dataset.shipmentId;

    const verifiedItems = [];
    document.querySelectorAll('#modal-checklist input:checked').forEach(checkbox => {
        verifiedItems.push({
            name: checkbox.value,
            type: checkbox.dataset.type
        });
    });

    // --- ส่วนที่แก้ไข ---
    // แสดงหน้าต่างให้กรอกชื่อ (prompt) แบบบังคับกรอก
    let userName = '';
    while (userName.trim() === '') {
        userName = prompt('กรุณากรอก "ชื่อผู้รับ" (จำเป็น):');
        
        // ถ้าผู้ใช้กด "Cancel" ในหน้าต่าง prompt
        if (userName === null) {
            return; // ยกเลิกการทำงานทั้งหมด
        }
        
        // ถ้าผู้ใช้กด "OK" แต่ไม่ได้กรอกอะไรเลย
        if (userName.trim() === '') {
            alert('ชื่อผู้รับห้ามว่าง! กรุณากรอกใหม่อีกครั้ง');
        }
    }
    // --- สิ้นสุดส่วนที่แก้ไข ---


    const payload = {
        action: 'receive',
        shipmentId: shipmentId,
        user: userName.trim(), // ส่งชื่อที่ตัดช่องว่างแล้วไป
        verifiedItems: verifiedItems
    };

    try {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'กำลังบันทึก...';

        const payloadString = JSON.stringify(payload);
        const encodedPayload = encodeURIComponent(payloadString);
        const requestUrl = `${WEB_APP_URL}?payload=${encodedPayload}`;
        
        const response = await fetch(requestUrl);
        const data = await response.json();

        if (data.status === 'success') {
            alert('บันทึกการรับของสำเร็จ!');
            document.getElementById('receive-modal').style.display = "none";
            loadInTransitShipments();
        } else {
            alert('เกิดข้อผิดพลาดในการรับของ: ' + data.message);
        }
    } catch (error) {
        console.error('Error during receive confirmation:', error);
        alert('เกิดข้อผิดพลาดในการรับของ (เชื่อมต่อ Server ไม่ได้)');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'ยืนยันการรับของ';
    }
}
