import React, { useState, useMemo } from 'react';
import { Patient, LineNotificationConfig, NotificationLog } from '../types';
import { 
  Send, X, Copy, Check, ExternalLink, Share2, MessageSquare, 
  Sparkles, Bell, Calendar, MapPin, AlertTriangle, Pill, ShieldAlert, CheckCircle2
} from 'lucide-react';

interface LineSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  patientsList?: Patient[];
  lineConfig: LineNotificationConfig;
  onAddLog?: (log: NotificationLog) => void;
  onShowToast: (msg: string) => void;
  onOpenShareLocationModal?: (patient?: Patient) => void;
}

type TemplateType = 'daily_dots' | 'appointment' | 'supervisor_visit' | 'location_pin' | 'missed_dose' | 'custom';

export const LineSendModal: React.FC<LineSendModalProps> = ({
  isOpen,
  onClose,
  patient,
  patientsList,
  lineConfig,
  onAddLog,
  onShowToast,
  onOpenShareLocationModal
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('daily_dots');
  const [isSendingApi, setIsSendingApi] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiResult, setApiResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Target patients list
  const activePatients = useMemo(() => {
    if (patientsList && patientsList.length > 0) return patientsList;
    if (patient) return [patient];
    return [];
  }, [patient, patientsList]);

  // Generate location pinning URL helper
  const getPinUrl = (p: Patient) => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
    return `${origin}/?pinLocationFor=${encodeURIComponent(p.id)}`;
  };

  // Generate dynamic message content based on template and patient(s)
  const defaultGeneratedMessage = useMemo(() => {
    if (activePatients.length === 0) {
      return `📢 [แจ้งเตือนระบบงานควบคุมวัณโรค อ.โพนนาแก้ว]\nสวัสดีครับ ขอแจ้งเตือนทีมงาน อสม. และบุคลากรสาธารณสุขทุกท่าน`;
    }

    if (activePatients.length === 1) {
      const p = activePatients[0];
      const pinUrl = getPinUrl(p);

      switch (selectedTemplate) {
        case 'daily_dots':
          return `💊 [เตือนรับประทานยา DOTS ประจำวัน]\n` +
            `เรียน คุณ${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn})\n` +
            `📍 ที่อยู่: ต.${p.subdistrict} (${p.village})\n` +
            `สูตรยา: ${p.regimen} (ระยะ${p.phase === 'Intensive' ? 'เข้มข้น 2 เดือนแรก' : 'ต่อเนื่อง'})\n` +
            `👤 อสม.ผู้ดูแล: ${p.dotsSupervisorName} (โทร: ${p.dotsSupervisorPhone || '-'})\n` +
            `⏰ ได้เวลาทานยาต้านวัณโรคประจำวันแล้วครับ ทานยาต่อเนื่องตรงเวลาเพื่อการรักษาที่หายขาด\n` +
            `🏥 ด้วยความห่วงใยจาก โรงพยาบาลโพนนาแก้ว จ.สกลนคร`;

        case 'appointment':
          return `📅 [แจ้งเตือนนัดตรวจเสมหะและรับยาต่อเนื่อง]\n` +
            `เรียน คุณ${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn})\n` +
            `📍 ต.${p.subdistrict} (${p.village})\n` +
            `วันนัดครั้งถัดไป: ${p.nextAppointmentDate || 'ตามใบนัด'}\n` +
            `สูตรยาปัจจุบัน: ${p.regimen}\n` +
            `💡 กรุณานำสมุดประจำตัวผู้ป่วย และเก็บเสมหะตอนเช้ามาตรวจตามนัดหมาย\n` +
            `🏥 คลินิกวัณโรค รพ.โพนนาแก้ว`;

        case 'supervisor_visit':
          return `🧑‍⚕️ [แจ้งเตือน อสม. พี่เลี้ยง DOTS ลงพื้นที่ติดตาม]\n` +
            `เรียน อสม. ${p.dotsSupervisorName} (โทร: ${p.dotsSupervisorPhone || '-'})\n` +
            `ขอความอนุเคราะห์ติดตามการทานยาของผู้ป่วย:\n` +
            `👤 คุณ${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn})\n` +
            `🏠 ที่อยู่: ${p.houseNo ? `บ้านเลขที่ ${p.houseNo} ` : ''}${p.village} ต.${p.subdistrict}\n` +
            `💊 สูตรยา: ${p.regimen}\n` +
            `🔗 พิกัดบ้าน: ${pinUrl}\n` +
            `ขอบคุณ อสม. ทุกท่านที่ร่วมดูแลผู้ป่วยในชุมชนครับ`;

        case 'location_pin':
          return `📍 [ขอความอนุเคราะห์ระบุพิกัดตำแหน่งบ้านผู้ป่วยวัณโรค]\n` +
            `เรียน อสม./ผู้ป่วย คุณ${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn})\n` +
            `🏠 ต.${p.subdistrict} (${p.village})\n` +
            `โปรดแตะลิงก์ด้านล่างเพื่อเปิดแผนที่ Google Maps และกดระบุพิกัดบ้าน:\n` +
            `👉 ${pinUrl}\n` +
            `💡 (เปิดผ่านมือถือ สามารถกดปุ่มค้นหาพิกัด GPS ได้ทันที)`;

        case 'missed_dose':
          return `⚠️ [แจ้งเตือนด่วน: ผู้ป่วยขาดรับประทานยา/ขาดนัด]\n` +
            `ผู้ป่วย: คุณ${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn})\n` +
            `ต.${p.subdistrict} (${p.village})\n` +
            `อสม. ผู้ดูแล: ${p.dotsSupervisorName} (${p.dotsSupervisorPhone || '-'})\n` +
            `สถานะ: พบประวัติขาดทานยา/ขาดนัดรับยา ขอให้ทีม รพ.สต./อสม. เร่งประสานติดตามเยี่ยมบ้านด่วนครับ`;

        case 'custom':
        default:
          return `📢 [ข้อความแจ้งเตือน รพ.โพนนาแก้ว]\nผู้ป่วย: คุณ${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn})\nต.${p.subdistrict}`;
      }
    }

    // Multiple patients batch message
    const lines = activePatients.map((p, idx) => {
      const pinUrl = getPinUrl(p);
      return `${idx + 1}. ${p.prefix}${p.firstName} ${p.lastName} (HN: ${p.hn}) - ต.${p.subdistrict}\n   💊 ${p.regimen} | อสม: ${p.dotsSupervisorName}\n   👉 ${pinUrl}`;
    }).join('\n\n');

    return `💊 [แจ้งเตือนรายชื่อผู้ป่วยวัณโรค อ.โพนนาแก้ว รวม ${activePatients.length} ราย]\n\n${lines}\n\n🏥 กลุ่มงานควบคุมโรค รพ.โพนนาแก้ว`;
  }, [activePatients, selectedTemplate]);

  // Editable custom text
  const [customText, setCustomText] = useState<string>('');

  // Sync default message when template changes
  React.useEffect(() => {
    setCustomText(defaultGeneratedMessage);
    setApiResult(null);
  }, [defaultGeneratedMessage]);

  if (!isOpen) return null;

  // Active message to send
  const finalMessage = customText || defaultGeneratedMessage;

  // 1. Direct Open in LINE app (Universal + Protocol Handler)
  const handleOpenLineDirect = () => {
    if (!finalMessage) return;

    // Direct Universal Link to open LINE chat with pre-filled message
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(finalMessage)}`;
    
    // Copy to clipboard first for seamless paste safety
    try {
      navigator.clipboard.writeText(finalMessage);
    } catch (_) {}

    // Open LINE in new window / app
    window.open(lineUrl, '_blank');
    onShowToast('เปิดแอป LINE เรียบร้อยแล้ว (คัดลอกข้อความลงคลิปบอร์ดให้พร้อมใช้งาน)');

    // Log action
    if (onAddLog) {
      onAddLog({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('th-TH'),
        type: selectedTemplate === 'location_pin' ? 'location_share' : 'daily_dots',
        targetName: activePatients.length === 1 
          ? `${activePatients[0].prefix}${activePatients[0].firstName} (HN: ${activePatients[0].hn})`
          : `ผู้ป่วย ${activePatients.length} ราย (เปิดส่งผ่าน LINE App)`,
        message: finalMessage,
        status: 'sent'
      });
    }
  };

  // 2. Native Web Share API (Best on mobile for choosing LINE, WhatsApp, etc.)
  const handleNativeShare = async () => {
    if (!finalMessage) return;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'แจ้งเตือนวัณโรค รพ.โพนนาแก้ว',
          text: finalMessage
        });
        onShowToast('แชร์ข้อความเรียบร้อยแล้ว');
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback if not supported
    handleOpenLineDirect();
  };

  // 3. Copy message to clipboard
  const handleCopy = () => {
    if (!finalMessage) return;
    navigator.clipboard.writeText(finalMessage);
    setCopied(true);
    onShowToast('คัดลอกข้อความแจ้งเตือนแล้ว สามารถนำไปวางใน LINE ได้ทันที');
    setTimeout(() => setCopied(false), 2500);
  };

  // 4. Send via LINE OA Messaging API (Push to Group ID)
  const handleSendMessagingApi = async () => {
    if (!lineConfig.channelAccessToken || !lineConfig.targetGroupId) {
      setApiResult({
        success: false,
        msg: 'ยังไม่ได้ระบุ Channel Access Token หรือ Group ID ของ LINE OA (กรุณาไปที่เมนู "ระบบแจ้งเตือน LINE")'
      });
      return;
    }

    setIsSendingApi(true);
    setApiResult(null);

    try {
      const res = await fetch('/api/line-messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelAccessToken: lineConfig.channelAccessToken,
          targetId: lineConfig.targetGroupId,
          message: finalMessage
        })
      });

      const data = await res.json();
      if (data.success) {
        setApiResult({
          success: true,
          msg: `ส่งข้อความเข้ากลุ่ม LINE (${lineConfig.lineGroupName || lineConfig.targetGroupId}) สำเร็จแล้ว!`
        });
        onShowToast('ส่งข้อความผ่าน LINE OA Messaging API สำเร็จ');

        if (onAddLog) {
          onAddLog({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toLocaleString('th-TH'),
            type: 'system',
            targetName: `${lineConfig.lineGroupName || 'กลุ่ม LINE'}`,
            message: finalMessage,
            status: 'sent'
          });
        }
      } else {
        setApiResult({
          success: false,
          msg: `เกิดข้อผิดพลาดจาก LINE API: ${data.error || 'โปรดตรวจสอบความถูกต้องของ Token หรือ Group ID'}`
        });
      }
    } catch (err: any) {
      setApiResult({
        success: false,
        msg: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ${err.message}`
      });
    } finally {
      setIsSendingApi(false);
    }
  };

  // 5. Send via LINE Notify
  const handleSendLineNotify = async () => {
    if (!lineConfig.token) {
      setApiResult({
        success: false,
        msg: 'ยังไม่ได้ระบุ LINE Notify Access Token'
      });
      return;
    }

    setIsSendingApi(true);
    setApiResult(null);

    try {
      const res = await fetch('/api/line-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: lineConfig.token,
          message: finalMessage
        })
      });

      const data = await res.json();
      if (data.success) {
        setApiResult({
          success: true,
          msg: 'ส่งข้อความผ่าน LINE Notify เข้ากลุ่มเรียบร้อยแล้ว!'
        });
        onShowToast('ส่งข้อความผ่าน LINE Notify สำเร็จ');

        if (onAddLog) {
          onAddLog({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toLocaleString('th-TH'),
            type: 'system',
            targetName: lineConfig.lineGroupName || 'กลุ่ม LINE Notify',
            message: finalMessage,
            status: 'sent'
          });
        }
      } else {
        setApiResult({
          success: false,
          msg: `ข้อผิดพลาดจาก LINE Notify: ${JSON.stringify(data.error)}`
        });
      }
    } catch (err: any) {
      setApiResult({
        success: false,
        msg: `ส่งข้อความไม่สำเร็จ: ${err.message}`
      });
    } finally {
      setIsSendingApi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in font-['Prompt',sans-serif]">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <MessageSquare className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  ส่งข้อความแจ้งเตือนผ่าน LINE
                </h3>
                <span className="text-[10px] bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                  LINE Share & Messaging API
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {activePatients.length === 1 
                  ? `ผู้ป่วย: ${activePatients[0].prefix}${activePatients[0].firstName} ${activePatients[0].lastName} (HN: ${activePatients[0].hn})`
                  : `ส่งแจ้งเตือนรายชื่อผู้ป่วยที่เลือก (${activePatients.length} ราย)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Template Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              เลือกรูปแบบข้อความแจ้งเตือน (Templates):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplate('daily_dots')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left flex items-center gap-2 ${
                  selectedTemplate === 'daily_dots'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">เตือนทานยาประจำวัน</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('appointment')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left flex items-center gap-2 ${
                  selectedTemplate === 'appointment'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">เตือนนัดตรวจเสมหะ</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('supervisor_visit')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left flex items-center gap-2 ${
                  selectedTemplate === 'supervisor_visit'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">แจ้ง อสม. ลงติดตาม</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('location_pin')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left flex items-center gap-2 ${
                  selectedTemplate === 'location_pin'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <span className="truncate">ส่งลิงก์ปักหมุดบ้าน</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('missed_dose')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left flex items-center gap-2 ${
                  selectedTemplate === 'missed_dose'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="truncate">เตือนขาดรับยา</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('custom')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left flex items-center gap-2 ${
                  selectedTemplate === 'custom'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="truncate">ข้อความกำหนดเอง</span>
              </button>
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>ข้อความที่จะส่งไปยัง LINE:</span>
                <span className="text-[11px] font-normal text-slate-400">({finalMessage.length} ตัวอักษร)</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
              </button>
            </div>

            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={7}
              className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              placeholder="พิมพ์หรือแก้ไขข้อความที่ต้องการส่งที่นี่..."
            />
          </div>

          {/* Status Message if any */}
          {apiResult && (
            <div className={`p-3 rounded-2xl text-xs font-medium flex items-start gap-2 ${
              apiResult.success 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}>
              {apiResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{apiResult.msg}</span>
            </div>
          )}

          {/* Sending Channels Grid */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-800">
              เลือกช่องทางส่งข้อความ (LINE Channels):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* 1. Open LINE App directly */}
              <button
                type="button"
                onClick={handleOpenLineDirect}
                className="p-3.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-md transition group"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div>
                    <div className="text-sm font-bold leading-tight">เปิดแอป LINE ส่งทันที</div>
                    <div className="text-[10px] text-emerald-100 font-normal">เปิดห้องแชท/กลุ่มใน LINE พร้อมข้อความ</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-white/80" />
              </button>

              {/* 2. Web Share API */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-md transition group"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold leading-tight">แชร์ผ่านระบบสมาร์ตโฟน</div>
                    <div className="text-[10px] text-indigo-200 font-normal">แชร์เข้า LINE / แอพใดก็ได้ในมือถือ</div>
                  </div>
                </div>
                <Share2 className="w-4 h-4 text-white/80" />
              </button>

              {/* 3. Send via LINE OA Messaging API */}
              <button
                type="button"
                onClick={handleSendMessagingApi}
                disabled={isSendingApi}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-md transition disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">บอท LINE OA (Messaging API)</div>
                    <div className="text-[10px] text-slate-300 font-normal">
                      {lineConfig.channelAccessToken ? 'ยิงเข้ากลุ่มไลน์อัตโนมัติ' : 'ยังไม่ได้ตั้งค่า Bot Token'}
                    </div>
                  </div>
                </div>
                <Send className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              {/* 4. Send via LINE Notify */}
              <button
                type="button"
                onClick={handleSendLineNotify}
                disabled={isSendingApi}
                className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-between border border-slate-300 transition disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">ส่งผ่าน LINE Notify</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {lineConfig.token ? 'แจ้งเตือนเข้ากลุ่มผ่าน Notify' : 'ยังไม่ได้ใส่ Notify Token'}
                    </div>
                  </div>
                </div>
                <Send className="w-3.5 h-3.5 text-slate-600" />
              </button>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
          >
            ปิดหน้าต่าง
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenLineDirect}
              className="px-5 py-2 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-200 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่งผ่าน LINE ทันที</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
