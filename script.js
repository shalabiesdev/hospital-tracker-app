// **ต้องเปลี่ยน** ใส่ URL ของ Web App ที่ได้จาก Google Apps Script ตรงนี้
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxDMXk2aj0GANTSnRMVHOTeaoDVASs5QcOdJqDawzzw6QXWgxwwrHILU04yfDU6frnTWw/exec';
// **ต้องเปลี่ยน** ใส่ URL ของ Google Sheet ของคุณตรงนี้
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1THjak6UCGPXgsaOqJ0YBh9_jVA-e_E5ZBMmCI_qPUKo/edit?usp=sharing'; 

document.addEventListener('DOMContentLoaded', () => {
    loadMasterList();
    loadInTransitShipments();
    document.getElementById('dispatch-btn').addEventListener('click', handleDispatch);
    document.getElementById('refresh-receive-btn').addEventListener('click', loadInTransitShipments);
    document.querySelector('#admin-section a').href = GOOGLE_SHEET_URL;
});

// --- ฟังก์ชันสำหรับโหลด Master List (รายการเครื่องมือทั้งหมด) ---
async function loadMasterList() {
    const listContainer = document.getElementById('tha-chalom-instrument-list');
    listContainer.innerHTML = '<p>กำลังโหลดรายการเครื่องมือ...</p>';

    try {
        // *** [แก้ไข] เปลี่ยนเป็น GET และส่ง action ผ่าน URL ***
        const response = await fetch(`${WEB_APP_URL}?action=getMasterList`);
        const data = await response.json();

        if (data.status === 'success' && data.masterItems.length > 0) {
            listContainer.innerHTML = '';
            data.masterItems.forEach(item => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" value="${item}"> ${item}`;
                listContainer.appendChild(label);
            });
        } else {
            listContainer.innerHTML = `<p class="no-data">ไม่พบรายการเครื่องมือใน MasterList (Error: ${data.message || 'No items found'})</p>`;
        }
    } catch (error) {
        console.error('Error loading master list:', error);
        listContainer.innerHTML = '<p class="no-data">เกิดข้อผิดพลาดในการโหลดรายการเครื่องมือ</p>';
    }
}

// --- ฟังก์ชันสำหรับจัดการการส่งออก (ใช้ POST ถูกต้องแล้ว) ---
// --- ฟังก์ชันสำหรับจัดการการส่งออก (เวอร์ชันแก้ไข - ใช้ GET Tunneling) ---
async function handleDispatch() {
    const selectedItems = [];
    document.querySelectorAll('#tha-chalom-instrument-list input:checked').forEach(input => {
        selectedItems.push(input.value);
    });
    if (selectedItems.length === 0) {
        alert('กรุณาเลือกรายการเครื่องมือที่ต้องการส่ง');
        return;
    }
    const userName = prompt('ชื่อผู้ส่ง (รพ.ท่าฉลอม):', 'พนักงานท่าฉลอม');
    if (!userName) return; // ถ้าผู้ใช้กด Cancel

    const payload = {
        action: 'dispatch',
        items: selectedItems,
        user: userName
    };

    const dispatchBtn = document.getElementById('dispatch-btn');
    try {
        dispatchBtn.disabled = true;
        dispatchBtn.textContent = 'กำลังส่งออก...';

        // --- ส่วนสำคัญที่แก้ไข ---
        // 1. แปลง object 'payload' ให้เป็นข้อความ JSON (String)
        const payloadString = JSON.stringify(payload);
        // 2. เข้ารหัสข้อความนั้นเพื่อให้สามารถส่งผ่าน URL ได้อย่างปลอดภัย
        const encodedPayload = encodeURIComponent(payloadString);
        // 3. สร้าง URL สำหรับ request โดยแนบข้อมูลที่เข้ารหัสแล้วเข้าไป
        const requestUrl = `${WEB_APP_URL}?payload=${encodedPayload}`;
        
        // 4. ส่ง request แบบ GET ไปยัง URL ที่สร้างขึ้น
        const response = await fetch(requestUrl);
        const data = await response.json();

        if (data.status === 'success') {
            alert(`บันทึกการส่งออกสำเร็จ! ID: ${data.shipmentId}`);
            document.querySelectorAll('#tha-chalom-instrument-list input:checked').forEach(input => input.checked = false);
            loadInTransitShipments(); // โหลดรายการที่กำลังขนส่งใหม่
        } else {
            // แสดง Error ที่ได้จาก Backend
            alert('เกิดข้อผิดพลาดในการส่งออก: ' + data.message);
        }
    } catch (error) {
        console.error('Error during dispatch:', error);
        alert('เกิดข้อผิดพลาดในการส่งออก (เชื่อมต่อ Server ไม่ได้)');
    } finally {
        dispatchBtn.disabled = false;
        dispatchBtn.textContent = 'กดเพื่อส่งออก 🚀';
    }
}
// --- ฟังก์ชันสำหรับโหลดรายการที่กำลังขนส่ง (สำหรับ รพ.สมุทรสาคร) ---
async function loadInTransitShipments() {
    const listContainer = document.getElementById('in-transit-shipments');
    listContainer.innerHTML = '<p>กำลังโหลดรายการที่กำลังขนส่ง...</p>';

    try {
        // *** [แก้ไข] เปลี่ยนเป็น GET และส่ง action ผ่าน URL ***
        const response = await fetch(`${WEB_APP_URL}?action=getInTransitShipments`);
        const data = await response.json();

        if (data.status === 'success' && data.shipments.length > 0) {
            listContainer.innerHTML = '';
            data.shipments.forEach(shipment => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('shipment-item');
                itemDiv.innerHTML = `
                    <div>
                        <p><strong>ID:</strong> ${shipment.ShipmentID}</p>
                        <p><strong>ส่งออกเมื่อ:</strong> ${new Date(shipment.DispatchTimestamp).toLocaleString('th-TH')}</p>
                        <p><strong>รายการ:</strong> ${shipment.Items}</p>
                    </div>
                    <button onclick="handleReceive('${shipment.ShipmentID}', this)">รับของ</button>
                `;
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


// --- ฟังก์ชันสำหรับจัดการการรับของ (เวอร์ชันแก้ไข - ใช้ GET Tunneling) ---
async function handleReceive(shipmentId, buttonElement) {
    const userName = prompt('ชื่อผู้รับ (รพ.สมุทรสาคร):', 'พนักงานสมุทรสาคร');
    if (!userName) return; // ถ้าผู้ใช้กด Cancel

    const payload = {
        action: 'receive',
        shipmentId: shipmentId,
        user: userName
    };

    try {
        buttonElement.disabled = true;
        buttonElement.textContent = 'กำลังบันทึก...';

        // --- ส่วนสำคัญที่แก้ไข (ทำเหมือนกับ handleDispatch) ---
        const payloadString = JSON.stringify(payload);
        const encodedPayload = encodeURIComponent(payloadString);
        const requestUrl = `${WEB_APP_URL}?payload=${encodedPayload}`;
        
        const response = await fetch(requestUrl);
        const data = await response.json();

        if (data.status === 'success') {
            alert('บันทึกการรับของสำเร็จ!');
            loadInTransitShipments(); // โหลดรายการใหม่เพื่อให้รายการที่รับแล้วหายไป
        } else {
            alert('เกิดข้อผิดพลาดในการรับของ: ' + data.message);
        }
    } catch (error) {
        console.error('Error during receive:', error);
        alert('เกิดข้อผิดพลาดในการรับของ (เชื่อมต่อ Server ไม่ได้)');
    } finally {
        buttonElement.disabled = false;
        buttonElement.textContent = 'รับของ';
    }
}


