import React, { useState, useEffect } from 'react';
import { DailyAttendanceRecord, Branch, TimeSlot, Student } from '../types';
import { toBnNum, getDayNameBn, BENGALI_MONTHS, DIRECTOR_NAME, DIRECTOR_PHONE, DEVELOPER_NAME, DEVELOPER_PHONE } from '../utils/storage';
import { translations, Language, ENGLISH_MONTHS } from '../utils/translations';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  records: DailyAttendanceRecord[];
  students?: Student[];
  onSaveRecord: (record: DailyAttendanceRecord) => void;
  defaultBranchId?: string;
  language?: Language;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  branches,
  records,
  students = [],
  onSaveRecord,
  defaultBranchId,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const safeBranches = Array.isArray(branches) ? branches : [];
  const safeRecords = Array.isArray(records) ? records : [];

  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

  // Daily Attendance Form states
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    if (defaultBranchId && defaultBranchId !== 'all') return defaultBranchId;
    return safeBranches[0]?.id || '';
  });

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [boysCount, setBoysCount] = useState<string>('0');
  const [girlsCount, setGirlsCount] = useState<string>('0');
  const [newAdmission, setNewAdmission] = useState<string>('নেই');
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Month navigation for Monthly Report (Requirement 13)
  const now = new Date();
  const [reportYear, setReportYear] = useState<number>(now.getFullYear());
  const [reportMonthIdx, setReportMonthIdx] = useState<number>(now.getMonth()); // 0-11

  useEffect(() => {
    if (!selectedBranchId && safeBranches.length > 0) {
      setSelectedBranchId(safeBranches[0].id);
    }
  }, [safeBranches, selectedBranchId]);

  if (!isOpen) return null;

  const currentBranch = safeBranches.find((b) => b.id === selectedBranchId) || safeBranches[0];
  const branchName = currentBranch ? currentBranch.name : (isBn ? 'কেন্দ্র নির্বাচন করুন' : 'Select Centre');
  const branchLocation = currentBranch ? currentBranch.location : (isBn ? 'স্থান নির্ধারণ করা হয়নি' : 'Location not set');
  const timeSlot: TimeSlot = currentBranch ? currentBranch.timeSlot : 'সকাল';
  const teacherName = currentBranch ? currentBranch.teacherName : (isBn ? 'নিযুক্ত ওস্তাদ নেই' : 'No teacher');
  const dayName = getDayNameBn(date, isBn);

  const branchStudents = (students || []).filter((s) => s.branchId === currentBranch?.id);
  const registeredBoys = branchStudents.filter((s) => s.gender !== 'girl').length;
  const registeredGirls = branchStudents.filter((s) => s.gender === 'girl').length;

  // Requirement 13: মাস সিলেক্ট করে আগে ও পরের রিপোর্ট দেখা যাবে
  const handlePrevMonth = () => {
    if (reportMonthIdx === 0) {
      setReportMonthIdx(11);
      setReportYear(reportYear - 1);
    } else {
      setReportMonthIdx(reportMonthIdx - 1);
    }
  };

  const handleNextMonth = () => {
    if (reportMonthIdx === 11) {
      setReportMonthIdx(0);
      setReportYear(reportYear + 1);
    } else {
      setReportMonthIdx(reportMonthIdx + 1);
    }
  };

  const selectedMonthName = isBn ? BENGALI_MONTHS[reportMonthIdx] : ENGLISH_MONTHS[reportMonthIdx];

  // Records for current selected month: sorted by date
  const monthlyRecords = safeRecords
    .filter((r) => {
      const matchBranch = !selectedBranchId || selectedBranchId === 'all' || r.branchId === selectedBranchId;
      const rDate = new Date(r.date);
      return (
        matchBranch &&
        rDate.getMonth() === reportMonthIdx &&
        rDate.getFullYear() === reportYear
      );
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে প্রথমে একটি কেন্দ্র যুক্ত করুন বা নির্বাচন করুন।' : 'Please add or select a centre first.');
      return;
    }
    setErrorMsg('');

    const boys = parseInt(boysCount, 10) || 0;
    const girls = parseInt(girlsCount, 10) || 0;
    const total = boys + girls;

    const newRecord: DailyAttendanceRecord = {
      id: `att_${Date.now()}`,
      branchId: currentBranch.id,
      branchName: currentBranch.name,
      branchLocation: currentBranch.location,
      date,
      dayName,
      timeSlot,
      boysCount: boys,
      girlsCount: girls,
      totalCount: total,
      newAdmission: newAdmission.trim() || (isBn ? 'নেই' : 'None'),
      teacherName: currentBranch.teacherName || (isBn ? 'অনির্ধারিত' : 'Unassigned'),
      createdAt: new Date().toISOString(),
    };

    onSaveRecord(newRecord);

    const postText = `📚 কেন্দ্রের নাম: ${currentBranch.name}
📍 কেন্দ্রের স্থান: ${currentBranch.location}
📅 তারিখ: ${toBnNum(date, isBn)}
🗓️ বার ও সময়: ${dayName}, ${timeSlot}
👦 ছাত্র সংখ্যা: ${toBnNum(boys, isBn)} জন
👧 ছাত্রী সংখ্যা: ${toBnNum(girls, isBn)} জন
👥 মোট উপস্থিতি: ${toBnNum(total, isBn)} জন
🆕 এ মাসে নতুন ভর্তি: ${newAdmission.trim() || 'নেই'}
👨‍🏫 শিক্ষক: ${currentBranch.teacherName || 'অনির্ধারিত'}`;

    setGeneratedPost(postText);
  };

  const handleCopyText = async () => {
    if (!generatedPost) return;
    try {
      await navigator.clipboard.writeText(generatedPost);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = generatedPost;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    if (!generatedPost) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedPost)}`;
    window.open(url, '_blank');
  };

  const handlePrintA4 = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 to-teal-950 border-b border-emerald-500/20 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <i className="fa-solid fa-clipboard-user text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-100">{t.btnDailyAttendance}</h3>
              <p className="text-[10px] text-emerald-300">{t.appTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Tab Selection: দৈনিক উপস্থিতি ও মাসিক উপস্থিতি */}
        <div className="flex border-b border-emerald-500/20 bg-slate-950/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-calendar-day text-xs"></i>
            <span>{isBn ? 'দৈনিক উপস্থিতি' : 'Daily Attendance'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'monthly'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-calendar-week text-xs"></i>
            <span>{isBn ? 'মাসিক উপস্থিতি' : 'Monthly Attendance'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {activeTab === 'daily' ? (
            <div className="space-y-4">
              {/* Daily Attendance Form */}
              <form onSubmit={handlePostUpdate} className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
                  <i className="fa-solid fa-pen-fancy text-xs"></i>
                  <span>{isBn ? 'উপস্থিতি এন্ট্রি ফরম' : 'Daily Attendance Form'}</span>
                </div>

                {errorMsg && (
                  <div className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow">
                    <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* কেন্দ্র নির্বাচন */}
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'কেন্দ্র নির্বাচন করুন' : 'Select Centre'} <span className="text-rose-400">*</span>
                  </label>
                  {branches.length === 0 ? (
                    <div className="text-[11px] text-amber-300 bg-amber-950/50 p-2 rounded-xl border border-amber-500/30">
                      {isBn ? 'কোনো কেন্দ্র যুক্ত নেই' : 'No centre added'}
                    </div>
                  ) : (
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-emerald-400"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* কেন্দ্রের স্থান (অটোমেটিক সিলেক্ট) */}
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'কেন্দ্রের স্থান (অটো পূরণ)' : 'Location (Auto)'}
                  </label>
                  <div className="w-full bg-slate-950/70 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-gray-200 flex items-center gap-1.5">
                    <i className="fa-solid fa-location-dot text-amber-400 text-xs"></i>
                    <span>{branchLocation}</span>
                  </div>
                </div>

                {/* তারিখ ও সময় (অটো সিলেট: সকাল নাকি বিকাল) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                      {isBn ? 'তারিখ' : 'Date'} <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                      {isBn ? 'পড়ার সময় (অটো)' : 'Time (Auto)'}
                    </label>
                    <div className="w-full bg-slate-950/70 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold flex items-center gap-1.5">
                      <i className="fa-regular fa-clock text-emerald-400 text-xs"></i>
                      <span>{dayName}, {timeSlot}</span>
                    </div>
                  </div>
                </div>

                {/* ছাত্র সংখ্যা ও ছাত্রী সংখ্যা */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-emerald-200">
                        👦 {isBn ? 'ছাত্র সংখ্যা' : 'Boys'}
                      </label>
                      <span className="text-[10px] text-blue-300 font-mono">
                        {isBn ? `মোট: ${toBnNum(registeredBoys, isBn)} জন` : `Total: ${registeredBoys}`}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={boysCount}
                      onChange={(e) => setBoysCount(e.target.value)}
                      className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-emerald-200">
                        👧 {isBn ? 'ছাত্রী সংখ্যা' : 'Girls'}
                      </label>
                      <span className="text-[10px] text-pink-300 font-mono">
                        {isBn ? `মোট: ${toBnNum(registeredGirls, isBn)} জন` : `Total: ${registeredGirls}`}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={girlsCount}
                      onChange={(e) => setGirlsCount(e.target.value)}
                      className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* এ মাসে নতুন ভর্তি */}
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    🆕 {isBn ? 'এ মাসে নতুন ভর্তি' : 'New Admissions this month'}
                  </label>
                  <input
                    type="text"
                    value={newAdmission}
                    onChange={(e) => setNewAdmission(e.target.value)}
                    placeholder={isBn ? 'যেমন: ১ জন / নেই' : 'e.g. 1 / None'}
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
                  />
                </div>

                {/* ওস্তাদের নাম (অটোমেটিক পূরণ) */}
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    👨‍🏫 {isBn ? 'ওস্তাদের নাম (অটোমেটিক পূরণ)' : 'Teacher Name (Auto)'}
                  </label>
                  <div className="w-full bg-slate-950/70 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-emerald-200 font-medium flex items-center gap-1.5">
                    <i className="fa-solid fa-chalkboard-user text-teal-400 text-xs"></i>
                    <span>{teacherName}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={branches.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                >
                  <i className="fa-solid fa-arrows-rotate text-xs"></i>
                  <span>{isBn ? 'পোস্ট আপডেট করুন' : 'Generate & Update Post'}</span>
                </button>
              </form>

              {/* Generated Post Box */}
              {generatedPost && (
                <div className="bg-slate-950 border-2 border-emerald-400/60 rounded-2xl p-4 space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-bullhorn text-xs"></i>
                      {isBn ? 'জেনারেটকৃত পোস্ট কপি / শেয়ার' : 'Generated Post'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {isBn ? 'প্রস্তুত' : 'Ready'}
                    </span>
                  </div>

                  <pre className="font-sans whitespace-pre-wrap text-xs text-emerald-100 bg-slate-900/90 p-3 rounded-xl border border-emerald-500/20 leading-relaxed shadow-inner">
                    {generatedPost}
                  </pre>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="bg-slate-800 hover:bg-slate-700 border border-emerald-400/50 text-emerald-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow"
                    >
                      <i className={`fa-solid ${copySuccess ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                      <span>{copySuccess ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'লেখা কপি করুন' : 'Copy Text')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow"
                    >
                      <i className="fa-brands fa-whatsapp text-sm"></i>
                      <span>{isBn ? 'হোয়াটসঅ্যাপে পাঠান' : 'WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Requirement 13: Monthly Attendance View from Day 1 to entered date with Month Navigation & A4 Print */
            <div className="space-y-3">
              {/* Month Navigation (< & >) and Branch filter */}
              <div className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 bg-slate-900 hover:bg-slate-700 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-bold"
                    title={isBn ? 'আগের মাস' : 'Previous Month'}
                  >
                    <i className="fa-solid fa-chevron-left mr-1"></i>
                    <span>{isBn ? 'আগের মাস' : 'Prev'}</span>
                  </button>

                  <span className="text-xs font-bold text-amber-300 font-mono">
                    {selectedMonthName} {toBnNum(reportYear, isBn)}
                  </span>

                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 bg-slate-900 hover:bg-slate-700 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-bold"
                    title={isBn ? 'পরের মাস' : 'Next Month'}
                  >
                    <span>{isBn ? 'পরের মাস' : 'Next'}</span>
                    <i className="fa-solid fa-chevron-right ml-1"></i>
                  </button>
                </div>

                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs text-emerald-200 font-bold outline-none"
                >
                  <option value="all">{isBn ? 'সব শাখা (একত্রে)' : 'All Centres'}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Requirement 13: A4 Printable Beautiful Sheet */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-3 shadow-xl space-y-3 print:bg-white print:text-black">
                <div className="text-center border-b border-emerald-500/20 pb-2">
                  <h3 className="text-sm font-black text-emerald-300">{t.appTitle}</h3>
                  <p className="text-xs font-bold text-white mt-0.5">{branchName}</p>
                  <p className="text-[10px] text-amber-300 mt-0.5 font-bold">
                    {isBn ? `মাসিক উপস্থিতি রেজিস্টার: ১ তারিখ হতে অদ্যবধি (${selectedMonthName} ${toBnNum(reportYear, isBn)})` : `Monthly Attendance: Day 1 onwards (${selectedMonthName} ${reportYear})`}
                  </p>
                </div>

                {monthlyRecords.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-emerald-500/20 rounded-xl">
                    <p>{isBn ? 'এই মাসে কোনো দৈনিক উপস্থিতি এন্ট্রি পাওয়া যায়নি।' : 'No attendance entries for this month.'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-emerald-300 border-b border-slate-700">
                          <th className="p-1.5">{isBn ? 'তারিখ' : 'Date'}</th>
                          <th className="p-1.5">{isBn ? 'বার/সময়' : 'Day/Time'}</th>
                          <th className="p-1.5 text-center">{isBn ? 'ছাত্র' : 'Boys'}</th>
                          <th className="p-1.5 text-center">{isBn ? 'ছাত্রী' : 'Girls'}</th>
                          <th className="p-1.5 text-center">{isBn ? 'মোট' : 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyRecords.map((r, idx) => (
                          <tr key={r.id} className={idx % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-950'}>
                            <td className="p-1.5 border-b border-slate-800 font-mono font-bold text-white">
                              {toBnNum(r.date.split('-')[2], isBn)}-{toBnNum(reportMonthIdx + 1, isBn)}
                            </td>
                            <td className="p-1.5 border-b border-slate-800 text-gray-300">
                              {r.dayName}, {r.timeSlot}
                            </td>
                            <td className="p-1.5 border-b border-slate-800 text-center text-blue-300 font-bold">
                              {toBnNum(r.boysCount, isBn)}
                            </td>
                            <td className="p-1.5 border-b border-slate-800 text-center text-pink-300 font-bold">
                              {toBnNum(r.girlsCount, isBn)}
                            </td>
                            <td className="p-1.5 border-b border-slate-800 text-center text-emerald-300 font-black">
                              {toBnNum(r.totalCount, isBn)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Director & Developer Signatures in A4 view */}
                <div className="pt-2 border-t border-slate-800 text-[9px] text-gray-400 flex justify-between">
                  <span>{t.directorLabel} {DIRECTOR_NAME}</span>
                  <span>{t.developerLabel} {DEVELOPER_NAME}</span>
                </div>
              </div>

              {/* Requirement 13: A4 সাইজে ডাউনলোড / প্রিন্ট বোতাম */}
              <button
                type="button"
                onClick={handlePrintA4}
                className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow"
              >
                <i className="fa-solid fa-print"></i>
                <span>{isBn ? 'A4 সাইজে মাসিক উপস্থিতি প্রিন্ট / ডাউনলোড' : 'Download / Print A4 Attendance'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-emerald-500/20">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold py-2 rounded-xl text-xs transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
