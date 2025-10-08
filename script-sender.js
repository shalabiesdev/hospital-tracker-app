// ==========================================================
// SCRIPT-SENDER.JS (สำหรับหน้าส่งของ)
// ==========================================================

// **ต้องเปลี่ยน** ใส่ URL ของ Web App ที่คุณ Deploy ครั้งล่าสุด
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwMHPiIECGbN_1O-7CJZa-kZl4s5mIy1V8g5DerNjxiuCIB63vYx3z7tcWGXpS_s1e5VQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  loadMasterList();
  document
    .getElementById("dispatch-btn")
    .addEventListener("click", handleDispatch);
});

// --- ฟังก์ชันสำหรับโหลด Master List (รายการเครื่องมือทั้งหมด) ---
async function loadMasterList() {
  const listContainer = document.getElementById("tha-chalom-instrument-list");
  listContainer.innerHTML = "<p>กำลังโหลดรายการเครื่องมือ...</p>";

  try {
    const response = await fetch(`${WEB_APP_URL}?action=getMasterList`);
    const data = await response.json();

    if (data.status === "success" && data.masterItems.length > 0) {
      listContainer.innerHTML = "";
      data.masterItems.forEach((item) => {
        const label = document.createElement("label");
        // เก็บข้อมูล type ไว้ใน data attribute
        label.innerHTML = `<input type="checkbox" value="${item.name}" data-type="${item.type}"> ${item.name} <em class="item-type">(${item.type})</em>`;
        listContainer.appendChild(label);
      });
    } else {
      listContainer.innerHTML = `<p class="no-data">ไม่พบรายการเครื่องมือ (Error: ${
        data.message || "No items found"
      })</p>`;
    }
  } catch (error) {
    console.error("Error loading master list:", error);
    listContainer.innerHTML =
      '<p class="no-data">เกิดข้อผิดพลาดในการโหลดรายการเครื่องมือ</p>';
  }
}

// --- ฟังก์ชันสำหรับจัดการการส่งออก (ใช้ GET Tunneling) ---
async function handleDispatch() {
  const selectedItems = [];
  document
    .querySelectorAll("#tha-chalom-instrument-list input:checked")
    .forEach((input) => {
      selectedItems.push({
        name: input.value,
        type: input.dataset.type,
      });
    });

  if (selectedItems.length === 0) {
    alert("กรุณาเลือกรายการเครื่องมือที่ต้องการส่งอย่างน้อย 1 รายการ");
    return;
  }

  // --- ส่วนที่เพิ่มเข้ามา ---
  // 1. สร้างข้อความสรุปรายการ
  const summaryList = selectedItems.map((item) => `- ${item.name}`).join("\n");
  const confirmationMessage = `คุณต้องการส่งออก ${selectedItems.length} รายการต่อไปนี้ใช่หรือไม่?\n\n${summaryList}`;

  // 2. แสดงหน้าต่างให้ผู้ใช้ยืนยัน (confirm)
  if (!confirm(confirmationMessage)) {
    // ถ้าผู้ใช้กด "Cancel", ให้ยกเลิกการทำงาน
    return;
  }

  // 3. แสดงหน้าต่างให้กรอกชื่อ (prompt) แบบบังคับกรอก
  let userName = "";
  while (userName.trim() === "") {
    userName = prompt('กรุณากรอก "ชื่อผู้ส่ง" (จำเป็น):');

    // ถ้าผู้ใช้กด "Cancel" ในหน้าต่าง prompt
    if (userName === null) {
      return; // ยกเลิกการทำงานทั้งหมด
    }

    // ถ้าผู้ใช้กด "OK" แต่ไม่ได้กรอกอะไรเลย
    if (userName.trim() === "") {
      alert("ชื่อผู้ส่งห้ามว่าง! กรุณากรอกใหม่อีกครั้ง");
    }
  }
  // --- สิ้นสุดส่วนที่เพิ่มเข้ามา ---

  const payload = {
    action: "dispatch",
    items: selectedItems,
    user: userName.trim(), // ส่งชื่อที่ตัดช่องว่างแล้วไป
  };

  const dispatchBtn = document.getElementById("dispatch-btn");
  try {
    dispatchBtn.disabled = true;
    dispatchBtn.textContent = "กำลังส่งออก...";

    const payloadString = JSON.stringify(payload);
    const encodedPayload = encodeURIComponent(payloadString);
    const requestUrl = `${WEB_APP_URL}?payload=${encodedPayload}`;

    const response = await fetch(requestUrl);
    const data = await response.json();

    if (data.status === "success") {
      alert(`บันทึกการส่งออกสำเร็จ! ID: ${data.shipmentId}`);
      document
        .querySelectorAll("#tha-chalom-instrument-list input:checked")
        .forEach((input) => (input.checked = false));
    } else {
      alert("เกิดข้อผิดพลาดในการส่งออก: " + data.message);
    }
  } catch (error) {
    console.error("Error during dispatch:", error);
    alert("เกิดข้อผิดพลาดในการส่งออก (เชื่อมต่อ Server ไม่ได้)");
  } finally {
    dispatchBtn.disabled = false;
    dispatchBtn.textContent = "กดเพื่อส่งออก 🚀";
  }
}

