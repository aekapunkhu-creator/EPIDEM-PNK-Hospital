import React, { useState, useMemo } from 'react';
import { 
  InvestigationRecord, 
  Patient, 
  HouseholdContact, 
  SubdistrictInfo 
} from '../types';
import { 
  Network, 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  ChevronRight, 
  Share2, 
  Layers, 
  ArrowRight, 
  Home, 
  Activity, 
  ExternalLink,
  Flame,
  Info,
  Calendar,
  MapPin
} from 'lucide-react';

interface EpidemiologicalLinkageProps {
  investigations: InvestigationRecord[];
  patients: Patient[];
  contacts: HouseholdContact[];
  subdistricts: SubdistrictInfo[];
  onNavigateToInvestigations: () => void;
  onNavigateToContacts: () => void;
}

interface TransmissionCluster {
  id: string;
  clusterName: string;
  subdistrict: string;
  villageName: string;
  suspectedSource: string;
  transmissionRisk: 'สูง (High Risk)' | 'ปานกลาง (Moderate Risk)' | 'ต่ำ (Low Risk)';
  indexCase: InvestigationRecord | null;
  linkedContacts: HouseholdContact[];
  secondaryActiveCount: number;
  tptInitiatedCount: number;
  clearedCount: number;
  underEvaluationCount: number;
  totalContacts: number;
}

export const EpidemiologicalLinkage: React.FC<EpidemiologicalLinkageProps> = ({
  investigations,
  patients,
  contacts,
  subdistricts,
  onNavigateToInvestigations,
  onNavigateToContacts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);

  // Group Investigations and Contacts into Epidemiological Clusters
  const clusters = useMemo(() => {
    const list: TransmissionCluster[] = [];

    // For each investigation, build a cluster
    investigations.forEach((inv, index) => {
      // Find linked contacts by indexPatientHN or indexPatientId or same name / house / village
      const matchedContacts = contacts.filter(c => 
        (c.indexPatientHN && c.indexPatientHN === inv.hn) ||
        (inv.patientId && c.indexPatientId === inv.patientId) ||
        (c.indexPatientName && c.indexPatientName.includes(inv.lastName)) ||
        (c.subdistrict === inv.subdistrict && c.village === inv.villageName && c.lastName === inv.lastName)
      );

      const secondaryActive = matchedContacts.filter(c => c.outcome === 'Active TB (Referred)').length + (inv.contactsActiveTbFound || 0);
      const tptCount = matchedContacts.filter(c => c.outcome === 'TPT Initiated').length + (inv.contactsTptInitiated || 0);
      const cleared = matchedContacts.filter(c => c.outcome === 'Cleared').length;
      const underEval = matchedContacts.filter(c => c.outcome === 'Under Evaluation').length;
      const totalCont = Math.max(matchedContacts.length, inv.contactsIdentified || 0);

      list.push({
        id: inv.id || `cluster-${index}`,
        clusterName: `กลุ่มก้อน: ${inv.villageName} (${inv.subdistrict})`,
        subdistrict: inv.subdistrict,
        villageName: inv.villageName,
        suspectedSource: inv.suspectedSource,
        transmissionRisk: inv.transmissionRisk,
        indexCase: inv,
        linkedContacts: matchedContacts,
        secondaryActiveCount: secondaryActive,
        tptInitiatedCount: tptCount,
        clearedCount: cleared,
        underEvaluationCount: underEval,
        totalContacts: totalCont
      });
    });

    return list;
  }, [investigations, contacts]);

  // Filtered clusters
  const filteredClusters = useMemo(() => {
    return clusters.filter(c => {
      const matchSearch = 
        !searchTerm ||
        c.clusterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.indexCase && `${c.indexCase.firstName} ${c.indexCase.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.indexCase && c.indexCase.hn.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSub = selectedSubdistrict === 'all' || c.subdistrict === selectedSubdistrict;
      const matchSource = selectedSource === 'all' || c.suspectedSource === selectedSource;
      const matchRisk = selectedRisk === 'all' || c.transmissionRisk.includes(selectedRisk);

      return matchSearch && matchSub && matchSource && matchRisk;
    });
  }, [clusters, searchTerm, selectedSubdistrict, selectedSource, selectedRisk]);

  // Overall Linkage Metrics
  const summaryMetrics = useMemo(() => {
    const totalClusters = clusters.length;
    const highRiskClusters = clusters.filter(c => c.transmissionRisk?.includes('สูง')).length;
    const totalSecondaryFound = clusters.reduce((sum, c) => sum + c.secondaryActiveCount, 0);
    const totalTptShielded = clusters.reduce((sum, c) => sum + c.tptInitiatedCount, 0);
    const cavitaryIndexCases = investigations.filter(i => i.cxrLesionType === 'Cavity (มีโพรงแผล)').length;
    const smear3PlusCases = investigations.filter(i => i.afbSmear1 === '3+' || i.afbSmear2 === '3+').length;

    return {
      totalClusters,
      highRiskClusters,
      totalSecondaryFound,
      totalTptShielded,
      cavitaryIndexCases,
      smear3PlusCases
    };
  }, [clusters, investigations]);

  const selectedCluster = useMemo(() => {
    if (!activeClusterId && filteredClusters.length > 0) {
      return filteredClusters[0];
    }
    return filteredClusters.find(c => c.id === activeClusterId) || filteredClusters[0] || null;
  }, [activeClusterId, filteredClusters]);

  if (investigations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Network className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-lg font-bold text-slate-900">ยังไม่มีข้อมูลผังเชื่อมโยงการแพร่เชื้อ</h3>
          <p className="text-xs text-slate-500">
            ระบบจะสร้างแผนผังความเชื่อมโยงทางระบาดวิทยา (Transmission Tree & Contact Cascade) อัตโนมัติเมื่อมีการบันทึกแบบสอบสวนผู้ป่วย
          </p>
        </div>
        <button
          onClick={onNavigateToInvestigations}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow transition"
        >
          <span>ไปที่ระบบบันทึกแบบสอบสวนโรค</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Linkage Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">กลุ่มก้อนการระบาด (Clusters)</span>
            <Network className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summaryMetrics.totalClusters} กลุ่ม</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-rose-600 font-semibold">{summaryMetrics.highRiskClusters} กลุ่ม</span>
            <span>เสี่ยงแพร่กระจายสูง</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">ผู้ป่วยรายใหม่จากการค้นหา (Secondary TB)</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{summaryMetrics.totalSecondaryFound} ราย</div>
          <div className="text-[11px] text-rose-600 font-medium">ตรวจพบจากการคัดกรองผู้สัมผัส</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">เกราะป้องกันด้วยยา TPT</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">{summaryMetrics.totalTptShielded} ราย</div>
          <div className="text-[11px] text-teal-600 font-medium">ได้รับยาป้องกันตัดวงจรแพร่เชื้อ</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Index Cases แพร่เชื้อสูง</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{summaryMetrics.cavitaryIndexCases} ราย</div>
          <div className="text-[11px] text-slate-500">CXR พบ Cavity / เสมหะ 3+</div>
        </div>

      </div>

      {/* Main Linkage Workspace (Sidebar Cluster List + Interactive Visualizer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Cluster Directory (5 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>รายการกลุ่มก้อนการระบาด ({filteredClusters.length})</span>
              </h3>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผู้ป่วย, HN, หมู่บ้าน..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={selectedSubdistrict}
                  onChange={e => setSelectedSubdistrict(e.target.value)}
                  className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white"
                >
                  <option value="all">ทุกตำบล</option>
                  {subdistricts.map(s => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={selectedRisk}
                  onChange={e => setSelectedRisk(e.target.value)}
                  className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white"
                >
                  <option value="all">ทุกระดับความเสี่ยง</option>
                  <option value="สูง">เสี่ยงสูง</option>
                  <option value="ปานกลาง">เสี่ยงปานกลาง</option>
                  <option value="ต่ำ">เสี่ยงต่ำ</option>
                </select>
              </div>
            </div>

            {/* Clusters List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredClusters.map(cluster => {
                const isSelected = selectedCluster?.id === cluster.id;
                const inv = cluster.indexCase;

                return (
                  <button
                    key={cluster.id}
                    onClick={() => setActiveClusterId(cluster.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-400' 
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{cluster.clusterName}</span>
                        </div>
                        {inv && (
                          <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                            ผู้ป่วยต้นตอ: {inv.prefix}{inv.firstName} {inv.lastName} ({inv.hn})
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${
                        cluster.transmissionRisk.includes('สูง')
                          ? 'bg-rose-100 text-rose-700'
                          : cluster.transmissionRisk.includes('ปานกลาง')
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {cluster.transmissionRisk.includes('สูง') ? 'เสี่ยงสูง' : cluster.transmissionRisk.includes('ปานกลาง') ? 'เสี่ยงปานกลาง' : 'เสี่ยงต่ำ'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>แหล่งโรค: {cluster.suspectedSource}</span>
                      <div className="flex items-center gap-2">
                        <span>ผู้สัมผัส: <strong className="text-slate-800">{cluster.totalContacts}</strong></span>
                        {cluster.secondaryActiveCount > 0 && (
                          <span className="text-rose-600 font-bold">พบป่วย: +{cluster.secondaryActiveCount}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right Col: Interactive Visualizer & Network Topology (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCluster && selectedCluster.indexCase ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-6">
              
              {/* Cluster Title Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                    <Share2 className="w-4 h-4" />
                    <span>แผนผังการแพร่กระจายเชื้อและการป้องกัน (Transmission & Barrier Network)</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedCluster.clusterName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedCluster.villageName}, {selectedCluster.subdistrict}
                    </span>
                    <span>• แหล่งแพร่เชื้อ: <strong className="text-slate-700">{selectedCluster.suspectedSource}</strong></span>
                    <span>• รหัสสอบสวน: <strong className="font-mono text-emerald-800">{selectedCluster.indexCase.investigationNumber}</strong></span>
                  </div>
                </div>

                <button
                  onClick={onNavigateToContacts}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition self-start sm:self-auto"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>บันทึกผู้สัมผัสเพิ่ม</span>
                </button>
              </div>

              {/* Graphical Network Hierarchy (Tree Structure) */}
              <div className="space-y-6">
                
                {/* 1. Primary Index Case Node */}
                <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-8 before:bottom-0 before:w-0.5 before:bg-slate-200">
                  
                  <div className="absolute left-0 top-1 w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    1
                  </div>

                  <div className="bg-gradient-to-r from-rose-50/80 via-white to-slate-50 border border-rose-200 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] uppercase">
                          ผู้ป่วยดัชนี (Index Case)
                        </span>
                        <h4 className="text-base font-bold text-slate-900">
                          {selectedCluster.indexCase.prefix}{selectedCluster.indexCase.firstName} {selectedCluster.indexCase.lastName}
                        </h4>
                        <span className="font-mono text-xs font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                          HN: {selectedCluster.indexCase.hn}
                        </span>
                      </div>
                      
                      <span className="text-xs text-slate-500">
                        อายุ {selectedCluster.indexCase.age} ปี • เพศ {selectedCluster.indexCase.gender}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-rose-100 text-xs">
                      <div className="p-2 rounded-lg bg-white/80 border border-rose-100">
                        <span className="text-[10px] text-slate-500 block">ชนิดวัณโรค</span>
                        <span className="font-bold text-slate-800">{selectedCluster.indexCase.tbType}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-white/80 border border-rose-100">
                        <span className="text-[10px] text-slate-500 block">เสมหะ AFB ครั้งที่ 1</span>
                        <span className="font-bold text-rose-700">{selectedCluster.indexCase.afbSmear1}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-white/80 border border-rose-100">
                        <span className="text-[10px] text-slate-500 block">ภาพถ่ายรังสีปอด (CXR)</span>
                        <span className="font-bold text-slate-800">{selectedCluster.indexCase.cxrLesionType}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-white/80 border border-rose-100">
                        <span className="text-[10px] text-slate-500 block">สูตรยาที่ได้รับ</span>
                        <span className="font-bold text-emerald-800">{selectedCluster.indexCase.treatmentRegimen}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/60 flex items-center justify-between">
                      <span>วันเริ่มมีอาการ: <strong>{selectedCluster.indexCase.onsetDate || '-'}</strong></span>
                      <span>ระยะเวลาแพร่เชื้อก่อนเริ่มยา: <strong>{selectedCluster.indexCase.durationOfSymptomsWeeks || 0} สัปดาห์</strong></span>
                      <span>เริ่มยาเมื่อ: <strong>{selectedCluster.indexCase.treatmentStartDate || '-'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 2. Transmission Barrier & Prevention Zone (ลูกศรการแพร่กระจายและการป้องกัน) */}
                <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200">
                  <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-slate-800">สายโซ่การสัมผัสและการแพร่กระจายเชื้อ (Exposure Pathway)</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      จำนวนผู้สัมผัสเสี่ยงสูงค้นพบ: <strong className="text-slate-900">{selectedCluster.totalContacts} คน</strong>
                    </span>
                  </div>
                </div>

                {/* 3. Linked Contacts Cascade & Outcomes */}
                <div className="relative pl-6 sm:pl-8">
                  
                  <div className="absolute left-0 top-1 w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    2
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>ผลลัพธ์การคัดกรองผู้สัมผัสร่วมบ้าน (Contact Outcomes & TPT Shield)</span>
                      </h4>
                    </div>

                    {selectedCluster.linkedContacts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedCluster.linkedContacts.map((contact, cIdx) => {
                          const isActiveTB = contact.outcome === 'Active TB (Referred)';
                          const isTPT = contact.outcome === 'TPT Initiated';
                          const isCleared = contact.outcome === 'Cleared';

                          return (
                            <div 
                              key={contact.id || cIdx}
                              className={`p-3.5 rounded-xl border transition space-y-2 ${
                                isActiveTB
                                  ? 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-300'
                                  : isTPT
                                  ? 'bg-teal-50/90 border-teal-300'
                                  : isCleared
                                  ? 'bg-emerald-50/60 border-emerald-200'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <div className="text-xs font-bold text-slate-900">
                                    {contact.prefix}{contact.firstName} {contact.lastName}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    ความสัมพันธ์: <strong className="text-slate-700">{contact.relationship}</strong> (อายุ {contact.age} ปี)
                                  </div>
                                </div>

                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isActiveTB
                                    ? 'bg-rose-600 text-white'
                                    : isTPT
                                    ? 'bg-teal-600 text-white'
                                    : isCleared
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {isActiveTB ? '🚨 ตรวจพบ Active TB' : isTPT ? '🛡️ ได้ยาป้องกัน TPT' : isCleared ? '🟢 ปลอดภัย (Cleared)' : '🟡 รอประเมิน'}
                                </span>
                              </div>

                              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                                <div>
                                  <span>ผล CXR: </span>
                                  <strong className="text-slate-800">{contact.cxrResult || 'ไม่ได้ตรวจ'}</strong>
                                </div>
                                <div>
                                  <span>ผล AFB: </span>
                                  <strong className="text-slate-800">{contact.afbResult || 'ไม่ได้ตรวจ'}</strong>
                                </div>
                              </div>

                              {isTPT && contact.tptRegimen && (
                                <div className="text-[10px] text-teal-800 bg-teal-100/70 px-2 py-1 rounded font-medium">
                                  สูตรยาป้องกัน: {contact.tptRegimen} (เริ่มเมื่อ {contact.tptStartDate || '-'})
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 space-y-2">
                        <div>
                          บันทึกสรุปในแบบสอบสวนพบผู้สัมผัส {selectedCluster.indexCase.contactsIdentified || 0} ราย (ตรวจ CXR แล้ว {selectedCluster.indexCase.contactsCxrDone || 0} ราย)
                        </div>
                        <button
                          onClick={onNavigateToContacts}
                          className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline text-xs"
                        >
                          <span>คลิกเพื่อลงทะเบียนรายชื่อผู้สัมผัสรายบุคคล</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>

                {/* 4. Investigation Summary & Public Health Measures */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <span>สรุปการสอบสวนและมาตรการควบคุมโรคในพื้นที่:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedCluster.indexCase.investigationSummary || 'ผู้ป่วยได้รับการวินิจฉัยและเริ่มยาตามมาตรฐาน DOTS พร้อมประสานเจ้าหน้าที่ รพ.สต. และ อสม. ลงพื้นที่ติดตามผู้สัมผัสร่วมบ้าน'}
                  </p>
                  {selectedCluster.indexCase.controlMeasuresTaken && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 mt-2">
                      <span className="font-semibold">มาตรการที่ดำเนินการ: </span>
                      {selectedCluster.indexCase.controlMeasuresTaken}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              เลือกกลุ่มก้อนการระบาดทางด้านซ้ายเพื่อดูผังเชื่อมโยง
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
