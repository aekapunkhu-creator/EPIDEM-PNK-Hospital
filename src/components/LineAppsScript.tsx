import React, { useState } from 'react';
import { LineNotificationConfig, NotificationLog } from '../types';
import { generateGoogleAppsScript } from '../utils/gasCodeGenerator';
import { 
  Bell, Send, Copy, Check, Code, MessageSquare, 
  Settings, History, Sparkles, CheckCircle2, Users, Bot, ExternalLink
} from 'lucide-react';

interface LineAppsScriptProps {
  lineConfig: LineNotificationConfig;
  onUpdateLineConfig: (newConfig: LineNotificationConfig) => void;
  logs: NotificationLog[];
  onAddLog: (log: NotificationLog) => void;
}

export const LineAppsScript: React.FC<LineAppsScriptProps> = ({
  lineConfig,
  onUpdateLineConfig,
  logs,
  onAddLog
}) => {
  const [activeMode, setActiveMode] = useState<'messaging_api' | 'notify'>(lineConfig.mode || 'messaging_api');
  const [channelAccessToken, setChannelAccessToken] = useState(lineConfig.channelAccessToken || '');
  const [targetGroupId, setTargetGroupId] = useState(lineConfig.targetGroupId || '');
  const [tokenInput, setTokenInput] = useState(lineConfig.token || '');
  const [lineGroupName, setLineGroupName] = useState(lineConfig.lineGroupName || 'กลุ่มงานควบคุมวัณโรค อ.โพนนาแก้ว');

  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Custom Message Sandbox State
  const [customMessage, setCustomMessage] = useState(
    '💊 [เตือนทานยา DOTS ประจำวัน]\nสวัสดีครับ แจ้งเตือน อสม. พี่เลี้ยงติดตามผู้ป่วยวัณโรค ต.นาแก้ว และ ต.บ้านโพน รับประทานยาเช้านี้เรียบร้อยครับ'
  );

  const currentConfig: LineNotificationConfig = {
    ...lineConfig,
    mode: activeMode,
    channelAccessToken,
    targetGroupId,
    token: tokenInput,
    lineGroupName
  };

  // Generated GAS Code
  const gasCode = generateGoogleAppsScript(currentConfig);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gasCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveConfig = () => {
    onUpdateLineConfig(currentConfig);
    setTestResult({ success: true, msg: 'บันทึกการตั้งค่าระบบแจ้งเตือน LINE เรียบร้อยแล้ว' });
  };

  const handleSendTestMessage = async () => {
    setIsSending(true);
    setTestResult(null);

    try {
      if (activeMode === 'messaging_api') {
        if (!channelAccessToken || !targetGroupId) {
          throw new Error('กรุณากรอก Channel Access Token และ Group ID ให้ครบถ้วน');
        }

        const res = await fetch('/api/line-messaging', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelAccessToken,
            targetId: targetGroupId,
            message: customMessage
          })
        });

        const data = await res.json();

        if (data.success) {
          setTestResult({
            success: true,
            msg: `ส่งข้อความผ่าน LINE OA Messaging API เข้ากลุ่มไลน์ (${targetGroupId}) สำเร็จแล้ว!`
          });
          onAddLog({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toLocaleString('th-TH'),
            type: 'system',
            targetName: `${lineGroupName} (Group ID: ${targetGroupId.substring(0, 8)}...)`,
            message: customMessage,
            status: 'sent'
          });
        } else {
          setTestResult({
            success: false,
            msg: `ข้อผิดพลาดจาก LINE API: ${data.error || 'ไม่สามารถส่งข้อความได้'}`
          });
        }
      } else {
        // LINE Notify Mode
        if (!tokenInput) {
          throw new Error('กรุณากรอก LINE Notify Access Token');
        }

        const res = await fetch('/api/line-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: tokenInput,
            message: customMessage
          })
        });

        const data = await res.json();

        if (data.success) {
          setTestResult({
            success: true,
            msg: 'ส่งข้อความ LINE Notify สำเร็จแล้ว! (ตรวจสอบในแอป LINE)'
          });
          onAddLog({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toLocaleString('th-TH'),
            type: 'system',
            targetName: lineGroupName,
            message: customMessage,
            status: 'sent'
          });
        } else {
          setTestResult({
            success: false,
            msg: `ข้อผิดพลาด LINE Notify: ${JSON.stringify(data.error)}`
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setTestResult({
        success: false,
        msg: err.message || 'เกิดข้อผิดพลาดในการส่งข้อความ'
      });
      // Fallback log
      onAddLog({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('th-TH'),
        type: 'system',
        targetName: lineGroupName,
        message: customMessage,
        status: 'simulated'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 shadow-sm border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wide">
            <Bell className="w-4 h-4" />
            <span>ระบบแจ้งเตือนเข้ากลุ่มไลน์ด้วย LINE Official Account (Messaging API) & Google Apps Script</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            ตั้งค่าระบบส่งข้อความเข้ากลุ่มไลน์ (LINE Group Messaging)
          </h2>
          <p className="text-slate-300 text-xs max-w-2xl">
            รองรับการดึง LINE Official Account (LINE OA Bot) เข้าร่วมกลุ่มไลน์ สสอ./รพ./รพ.สต./อสม. และส่งข้อความเตือนทานยา (08:00 น.), เตือนนัดตรวจเสมหะ และเตือนผู้ป่วยขาดรับยาแบบอัตโนมัติ
          </p>
        </div>

        <button
          onClick={handleCopyCode}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition shrink-0"
        >
          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{isCopied ? 'คัดลอกโค้ดเรียบร้อย!' : 'คัดลอกโค้ด Apps Script'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Token & Channel Setup */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Settings className="w-5 h-5 text-emerald-600" />
              <span>ตั้งค่าวิธีส่งข้อความเข้ากลุ่มไลน์</span>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveMode('messaging_api')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeMode === 'messaging_api'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>LINE OA (Messaging API)</span>
              </button>
              <button
                onClick={() => setActiveMode('notify')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeMode === 'notify'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>LINE Notify</span>
              </button>
            </div>
          </div>

          {activeMode === 'messaging_api' ? (
            /* LINE OA Messaging API Mode */
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>วิธีส่งข้อความเข้ากลุ่มไลน์ผ่าน LINE Official Account (LINE OA):</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-emerald-800 space-y-0.5">
                  <li>ดึงบัญชี LINE Official Account (LINE OA) เข้ากลุ่มไลน์ปฏิบัติงานของคุณ</li>
                  <li>สร้าง Channel Access Token (Long-lived) จาก <a href="https://developers.line.biz/" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-950">LINE Developers Console</a></li>
                  <li>ระบุ <b>LINE Group ID</b> (รหัสกลุ่มไลน์ที่เริ่มด้วย <code>C...</code>)</li>
                </ol>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  LINE OA Channel Access Token (Long-lived) *
                </label>
                <input
                  type="text"
                  placeholder="วาง Channel Access Token ของ LINE OA ที่นี่..."
                  value={channelAccessToken}
                  onChange={e => setChannelAccessToken(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Target LINE Group ID (รหัสกลุ่มไลน์เป้าหมาย) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น C1234567890abcdef1234567890abcde"
                  value={targetGroupId}
                  onChange={e => setTargetGroupId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  รหัสกลุ่มไลน์ดูได้จาก Webhook Logs หรือบอทแจ้งเตือนอัตโนมัติเมื่อเชิญบอทเข้ากลุ่ม
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่อกลุ่มไลน์งานวัณโรค
                </label>
                <input
                  type="text"
                  placeholder="เช่น กลุ่มควบคุมวัณโรค อ.โพนนาแก้ว"
                  value={lineGroupName}
                  onChange={e => setLineGroupName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveConfig}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition shadow-sm"
              >
                บันทึกการตั้งค่า LINE Messaging API
              </button>
            </div>
          ) : (
            /* LINE Notify Mode */
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  LINE Notify Access Token *
                </label>
                <input
                  type="text"
                  placeholder="วาง LINE Notify Token ของคุณที่นี่..."
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  สร้าง Token จากเว็บไซต์ <a href="https://notify-bot.line.me/" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-700">notify-bot.line.me</a>
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่อกลุ่มไลน์
                </label>
                <input
                  type="text"
                  placeholder="เช่น กลุ่มควบคุมวัณโรค อ.โพนนาแก้ว"
                  value={lineGroupName}
                  onChange={e => setLineGroupName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveConfig}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition shadow-sm"
              >
                บันทึกการตั้งค่า LINE Notify
              </button>
            </div>
          )}

          {/* Test Sandbox */}
          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>ทดสอบส่งข้อความเข้ากลุ่มไลน์ทันที</span>
              </h4>
            </div>

            {/* Template Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCustomMessage('💊 [เตือนทานยา DOTS ประจำวัน]\nขอความร่วมมือ อสม. พี่เลี้ยงติดตามผู้ป่วยวัณโรคในพื้นที่ อ.โพนนาแก้ว รับประทานยาตามกำหนดเวลา 08:00 น.')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition"
              >
                💊 เตือนทานยาประจำวัน
              </button>

              <button
                onClick={() => setCustomMessage('📅 [แจ้งเตือนวันนัดตรวจเสมหะ]\nพรุ่งนี้มีนัดตรวจเสมหะเดือนที่ 2/5/6 ณ รพ.โพนนาแก้ว / รพ.สต. โปรดเน้นย้ำผู้ป่วยนำเสมหะตลับเช้ามาส่ง')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition"
              >
                📅 เตือนนัดตรวจเสมหะ
              </button>

              <button
                onClick={() => setCustomMessage('🚨 [แจ้งฉุกเฉิน] ตรวจพบผู้ป่วยขาดการทานยาเกิน 2 วันติดต่อกันใน ต.นาแก้ว โปรดลงพื้นที่เยี่ยมบ้านและติดตามยา')}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium text-[11px] transition"
              >
                🚨 เตือนขาดรับยาด่วน
              </button>
            </div>

            <textarea
              rows={4}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans text-xs"
            />

            <button
              onClick={handleSendTestMessage}
              disabled={isSending}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'กำลังส่งข้อความเข้ากลุ่มไลน์...' : `ทดสอบส่งข้อความเข้ากลุ่มไลน์ (${activeMode === 'messaging_api' ? 'LINE OA Messaging API' : 'LINE Notify'})`}</span>
            </button>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Apps Script Guide & Live Code Generator */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Code className="w-5 h-5 text-emerald-600" />
              <span>ซอร์สโค้ด Google Apps Script ส่งข้อความเข้ากลุ่มไลน์ (Code.gs)</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>คัดลอกโค้ดทั้งหมด</span>
            </button>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 text-slate-200 font-mono text-[11px] h-[340px] overflow-y-auto leading-relaxed border border-slate-800">
            <pre>{gasCode}</pre>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>วิธีติดตั้งง่ายๆ ใน 3 ขั้นตอน:</span>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-emerald-800">
              <li>เปิด Google Sheets ใหม่ &rarr; ไปที่ <b>ส่วนขยาย (Extensions) &rarr; Apps Script</b></li>
              <li>คัดลอกโค้ดด้านบนทั้งหมดไปวางแทนที่ในไฟล์ <code>Code.gs</code></li>
              <li>กดเรียกใช้ฟังก์ชัน <code>initializeSheets()</code> แล้วตามด้วย <code>setupTriggers()</code></li>
            </ol>
          </div>
        </div>

      </div>

      {/* Notification History Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <History className="w-5 h-5 text-emerald-600" />
            <span>ประวัติการส่งข้อความแจ้งเตือนเข้ากลุ่มไลน์ (Notification Logs)</span>
          </div>
          <span className="text-xs text-slate-400">จำนวนบันทึก: {logs.length} รายการ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">เวลาส่ง</th>
                <th className="py-2.5 px-3">ผู้รับ / กลุ่มเป้าหมาย</th>
                <th className="py-2.5 px-3">ข้อความแจ้งเตือน</th>
                <th className="py-2.5 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    {log.targetName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                    {log.message}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'sent'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {log.status === 'sent' ? 'ส่งสำเร็จ (LINE)' : 'จำลองระบบ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
