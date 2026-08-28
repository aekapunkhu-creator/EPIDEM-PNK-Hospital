import { LineNotificationConfig } from '../types';

export function generateGoogleAppsScript(config: LineNotificationConfig): string {
  const token = config.token || 'YOUR_LINE_NOTIFY_TOKEN_HERE';
  const channelAccessToken = config.channelAccessToken || 'YOUR_LINE_OA_CHANNEL_ACCESS_TOKEN_HERE';
  const targetGroupId = config.targetGroupId || 'YOUR_LINE_GROUP_ID_HERE';

  return `/**
 * ==============================================================================
 * โปรแกรมควบคุมและติดตามผู้ป่วยวัณโรค อ.โพนนาแก้ว จ.สกลนคร (TB-Care Phon Na Kaeo)
 * Google Apps Script + LINE Messaging API (LINE OA Group Push) & LINE Notify
 * ==============================================================================
 * 
 * วิธีเปิดใช้งาน:
 * 1. เปิด Google Sheets -> ไปที่เมนู "ส่วนขยาย (Extensions)" -> "Apps Script"
 * 2. คัดลอกโค้ดนี้ทั้งหมดวางลงในไฟล์ Code.gs
 * 3. ใส่ CHANNEL_ACCESS_TOKEN และ TARGET_GROUP_ID สำหรับ LINE Official Account ด้านล่าง
 * 4. กดเรียกใช้ฟังก์ชัน initializeSheets() เพื่อสร้างโครงสร้างตาราง
 * 5. กดเรียกใช้ฟังก์ชัน setupTriggers() เพื่อเปิดระบบแจ้งเตือนทานยา (08:00 น.) และวันนัดให้อัตโนมัติ
 */

// 1. ตั้งค่า LINE Messaging API (LINE Official Account)
const LINE_CHANNEL_ACCESS_TOKEN = "${channelAccessToken}";
const LINE_TARGET_GROUP_ID = "${targetGroupId}"; // รหัสกลุ่มไลน์ (เช่น C1234567890abcdef...)

// 2. ตั้งค่า LINE Notify (สำรอง)
const LINE_NOTIFY_TOKEN = "${token}";

/**
 * ฟังก์ชันหลัก: ส่งข้อความเข้ากลุ่มไลน์ด้วย LINE Messaging API (Push Message)
 */
function sendLineGroupMessage(messageText) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || LINE_CHANNEL_ACCESS_TOKEN.indexOf("YOUR_") !== -1) {
    Logger.log("ไม่พบ Channel Access Token สลับไปใช้วิธี LINE Notify");
    return sendLineNotify(messageText);
  }
  
  if (!LINE_TARGET_GROUP_ID || LINE_TARGET_GROUP_ID.indexOf("YOUR_") !== -1) {
    Logger.log("ไม่พบ Target Group ID สลับไปใช้วิธี LINE Notify");
    return sendLineNotify(messageText);
  }

  const url = "https://api.line.me/v2/bot/message/push";
  const payload = {
    "to": LINE_TARGET_GROUP_ID,
    "messages": [
      {
        "type": "text",
        "text": messageText
      }
    ]
  };

  const options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + LINE_CHANNEL_ACCESS_TOKEN
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    Logger.log("LINE Messaging API Response (" + code + "): " + response.getContentText());
    if (code === 200) return true;
    
    // หากมีปัญหาใน Messaging API ให้ fallback ไปยัง LINE Notify
    return sendLineNotify(messageText);
  } catch (e) {
    Logger.log("Error sending LINE Messaging API: " + e.toString());
    return sendLineNotify(messageText);
  }
}

/**
 * ฟังก์ชันสำรอง: ส่งข้อความด้วย LINE Notify
 */
function sendLineNotify(message) {
  if (!LINE_NOTIFY_TOKEN || LINE_NOTIFY_TOKEN.indexOf("YOUR_") !== -1) {
    Logger.log("กรุณาใส่ LINE Token ให้ถูกต้อง");
    return false;
  }
  
  const url = "https://notify-api.line.me/api/notify";
  const options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer " + LINE_NOTIFY_TOKEN
    },
    "payload": {
      "message": message
    },
    "muteHttpExceptions": true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log("LINE Notify Response: " + response.getContentText());
    return true;
  } catch (e) {
    Logger.log("Error sending LINE Notify: " + e.toString());
    return false;
  }
}

/**
 * งานประจำวัน (Daily Job): เตือนทานยา DOTS ประจำวัน (ตั้งเวลา 08:00 น.)
 */
function dailyDotsReminderJob() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const patientSheet = ss.getSheetByName("TB_Patients");
  if (!patientSheet) return;
  
  const data = patientSheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  let activeCount = 0;
  let reminderList = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = row[3] + row[4] + " " + row[5];
    const status = row[14];
    const subdistrict = row[9];
    const village = row[10];
    const supervisor = row[11];
    
    if (status === "Active" || status === "อยู่ระหว่างรักษา") {
      activeCount++;
      reminderList.push("• " + name + " (" + subdistrict + " " + village + ") - อสม./พี่เลี้ยง: " + supervisor);
    }
  }
  
  if (activeCount > 0) {
    const todayStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "dd/MM/yyyy");
    let msg = "💊 [เตือนทานยา DOTS ประจำวัน อ.โพนนาแก้ว]\\nประจำวันที่: " + todayStr;
    msg += "\\nยอดผู้ป่วยอยู่ระหว่างรักษา: " + activeCount + " ราย\\n\\nรายชื่อผู้ป่วยที่ต้องรับยาเช้านี้:\\n";
    msg += reminderList.join("\\n");
    msg += "\\n\\nข้อแนะนำ: เจ้าหน้าที่ รพ.สต./อสม. โปรดตรวจสอบการรับประทานยาผ่านแอป TB-Care";
    
    sendLineGroupMessage(msg);
  }
}

/**
 * งานเตือนวันนัดหมายตรวจเสมหะและรับยา (ตั้งเวลา 07:30 น.)
 */
function appointmentReminderJob() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const patientSheet = ss.getSheetByName("TB_Patients");
  if (!patientSheet) return;
  
  const data = patientSheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let apptList = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = row[3] + row[4] + " " + row[5];
    const apptDateRaw = row[16];
    const reason = row[17] || "ตรวจเสมหะ/รับยาตามกำหนด";
    const status = row[14];
    
    if ((status === "Active" || status === "อยู่ระหว่างรักษา") && apptDateRaw) {
      const apptDate = new Date(apptDateRaw);
      apptDate.setHours(0,0,0,0);
      
      const diffTime = apptDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 3) {
        const apptStr = Utilities.formatDate(apptDate, "Asia/Bangkok", "dd/MM/yyyy");
        const dayTag = diffDays === 0 ? "⚠️ [นัดวันนี้]" : (diffDays === 1 ? "⏰ [นัดพรุ่งนี้]" : "📅 [อีก " + diffDays + " วัน]");
        apptList.push(dayTag + " " + name + "\\n  วันนัด: " + apptStr + "\\n  เหตุผล: " + reason);
      }
    }
  }
  
  if (apptList.length > 0) {
    let msg = "📅 [แจ้งเตือนนัดหมายติดตามวัณโรค อ.โพนนาแก้ว]\\nมีรายการนัดหมายตรวจเสมหะ/รับยาล่วงหน้าดังนี้:\\n\\n";
    msg += apptList.join("\\n\\n");
    
    sendLineGroupMessage(msg);
  }
}

/**
 * ติดตั้ง Triggers อัตโนมัติ
 */
function setupTriggers() {
  const existingTriggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < existingTriggers.length; i++) {
    ScriptApp.deleteTrigger(existingTriggers[i]);
  }
  
  ScriptApp.newTrigger("dailyDotsReminderJob")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .inTimezone("Asia/Bangkok")
    .create();
    
  ScriptApp.newTrigger("appointmentReminderJob")
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .nearMinute(30)
    .inTimezone("Asia/Bangkok")
    .create();
    
  Logger.log("ติดตั้งระบบแจ้งเตือนสำเร็จแล้ว!");
  sendLineGroupMessage("✅ [ระบบ TB-Care โพนนาแก้ว]\\nเริ่มต้นระบบแจ้งเตือนเข้ากลุ่มไลน์สำเร็จ (เตือนทานยา 08:00 น. / เตือนนัดหมาย 07:30 น.)");
}

/**
 * ฟังก์ชันสร้าง Sheet หัวตารางเริ่มต้น
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let pSheet = ss.getSheetByName("TB_Patients");
  if (!pSheet) pSheet = ss.insertSheet("TB_Patients");
  pSheet.getRange(1, 1, 1, 18).setValues([[
    "ID", "HN", "เลขบัตรประชาชน", "คำนำหน้า", "ชื่อ", "นามสกุล", "เพศ", "อายุ", "เบอร์โทร", 
    "ตำบล", "หมู่บ้าน", "ผู้ควบคุม DOTS", "ตำแหน่งผู้ควบคุม", "เบอร์ผู้ควบคุม", "สถานะการรักษา",
    "วันเริ่มรับยา", "วันนัดถัดไป", "สาเหตุการนัด"
  ]]);
  pSheet.getRange(1, 1, 1, 18).setFontWeight("bold").setBackground("#e2e8f0");
  
  let cSheet = ss.getSheetByName("TB_Contacts");
  if (!cSheet) cSheet = ss.insertSheet("TB_Contacts");
  cSheet.getRange(1, 1, 1, 12).setValues([[
    "ID ผู้สัมผัส", "ผู้ป่วยดัชนี (Index Case)", "ชื่อผู้สัมผัส", "ความสัมพันธ์", "อายุ", 
    "เบอร์โทร", "ตำบล", "หมู่บ้าน", "ผล CXR", "ผล AFB/GeneXpert", "ผลการคัดกรอง", "หมายเหตุ/TPT"
  ]]);
  cSheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#e2e8f0");
  
  Logger.log("สร้างหัวตารางใน Google Sheets เรียบร้อยแล้ว!");
}

/**
 * Webhook Endpoint รับคำสั่ง Webhook จาก LINE หรือระบบภายนอก
 */
function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    
    // ดักจับ Webhook event จาก LINE Developers ในการหา Group ID
    if (contents.events && contents.events.length > 0) {
      const ev = contents.events[0];
      if (ev.source && ev.source.groupId) {
        Logger.log("ตรวจพบ LINE Group ID: " + ev.source.groupId);
      }
    }

    if (contents.action === "send_custom_notify") {
      const res = sendLineGroupMessage(contents.message);
      return ContentService.createTextOutput(JSON.stringify({ success: res })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
}

