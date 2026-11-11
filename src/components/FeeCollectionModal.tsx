import React, { useState, useEffect } from 'react';
import { FeePayment, Student, Branch } from '../types';
import { BENGALI_MONTHS, toBnCurrency, toBnNum, sortStudentsByRoll } from '../utils/storage';
import { translations, Language } from '../utils/translations';

interface FeeCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  branches: Branch[];
  feePayments: FeePayment[];
  onSavePayment: (payment: FeePayment) => void;
  defaultMonthYear?: string; // "MM-YYYY"
  language?: Language;
}

export const FeeCollectionModal: React.FC<FeeCollectionModalProps> = ({
  isOpen,
  onClose,
  students,
  branches,
  feePayments,
  onSavePayment,
  defaultMonthYear,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  // Sorted by roll serial: 1, 2, 3, ...
  const safeStudents = sortStudentsByRoll(Array.isArray(students) ? students : []);
  const safeBranches = Array.isArray(branches) ? branches : [];
  const safeFeePayments = Array.isArray(feePayments) ? feePayments : [];

  // Default month and year
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1; // 1-12
  const currentYearNum = now.getFullYear();
  const defaultMonthYearVal = `${currentYearNum}-${currentMonthNum < 10 ? '0' + currentMonthNum : currentMonthNum}`;

  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [studentId, setStudentId] = useState<string>(safeStudents[0]?.id || '');
  const [studentRoll, setStudentRoll] = useState<string>(safeStudents[0]?.roll || '');
  const [selectedMonthYearInput, setSelectedMonthYearInput] = useState<string>(defaultMonthYearVal);
  const [amount, setAmount] = useState<string>('200');
  const [collectorName, setCollectorName] = useState<string>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected student
  const currentStudent = safeStudents.find((s) => s.id === studentId) || safeStudents[0];
  const studentBranch = currentStudent ? safeBranches.find((b) => b.id === currentStudent.branchId) : null;

  // Filtered student options for dropdown
  const filteredStudents = safeStudents.filter((s) => {
    const matchBranch = branchFilter === 'all' || s.branchId === branchFilter;
    const matchGender =
      genderFilter === 'all' ||
      (genderFilter === 'boy' && s.gender !== 'girl') ||
      (genderFilter === 'girl' && s.gender === 'girl');
    return matchBranch && matchGender;
  });

  // Auto-sync collector name to student's centre teacher name
  useEffect(() => {
    if (studentBranch && studentBranch.teacherName) {
      setCollectorName(studentBranch.teacherName);
    }
  }, [studentBranch]);

  // Sync roll when studentId changes
  useEffect(() => {
    if (currentStudent) {
      setStudentRoll(currentStudent.roll);
      if (studentBranch?.teacherName) {
        setCollectorName(studentBranch.teacherName);
      }
    }
  }, [studentId, currentStudent, studentBranch]);

  if (!isOpen) return null;

  // Parse Month and Year from single field
  const [yrStr, moStr] = selectedMonthYearInput.split('-');
  const parsedYear = parseInt(yrStr, 10) || currentYearNum;
  const parsedMonthNum = parseInt(moStr, 10) || currentMonthNum;
  const parsedMonthNameBn = BENGALI_MONTHS[parsedMonthNum - 1] || 'মার্চ';
  const displayMMYYYY = `${moStr || (currentMonthNum < 10 ? '0' + currentMonthNum : currentMonthNum)}-${parsedYear}`;

  // Calculate unpaid/due months from admission date to selected month
  let dueMonthsCount = 0;
  let admissionMonthYearStr = 'N/A';

  if (currentStudent && currentStudent.admissionDate) {
    const admDate = new Date(currentStudent.admissionDate);
    const admYear = admDate.getFullYear();
    const admMonth = admDate.getMonth() + 1; // 1-12
    admissionMonthYearStr = `${admMonth < 10 ? '0' + admMonth : admMonth}-${admYear}`;

    // Total elapsed months from admission to selected payment month
    const totalElapsed = (parsedYear - admYear) * 12 + (parsedMonthNum - admMonth) + 1;

    // How many fee payments recorded for this student?
    const paidRecords = safeFeePayments.filter((f) => f.studentId === currentStudent.id);
    const paidMonthsCount = paidRecords.length;

    dueMonthsCount = Math.max(0, (totalElapsed > 0 ? totalElapsed : 1) - paidMonthsCount);
  }

  // Handle Dual Sync: When Roll changes, update student name taking gender/branch into account
  const handleRollChange = (newRoll: string) => {
    setStudentRoll(newRoll);
    const clean = newRoll.trim();
    if (!clean) return;

    // Try finding within current branch and gender first
    let matched = safeStudents.find((s) => {
      const matchBranch = branchFilter === 'all' ? (currentStudent ? s.branchId === currentStudent.branchId : true) : s.branchId === branchFilter;
      const matchGender = genderFilter === 'all' ? (currentStudent ? (s.gender === 'girl') === (currentStudent.gender === 'girl') : true) : (genderFilter === 'girl' ? s.gender === 'girl' : s.gender !== 'girl');
      return matchBranch && matchGender && s.roll === clean;
    });

    if (!matched) {
      matched = safeStudents.find((s) => s.roll === clean);
    }

    if (matched) {
      setStudentId(matched.id);
      const b = safeBranches.find((br) => br.id === matched.branchId);
      if (b?.teacherName) setCollectorName(b.teacherName);
    }
  };

  // Handle Dual Sync: When Student Name changes, update roll
  const handleStudentSelect = (sId: string) => {
    setStudentId(sId);
    const matched = safeStudents.find((s) => s.id === sId);
    if (matched) {
      setStudentRoll(matched.roll);
      const b = safeBranches.find((br) => br.id === matched.branchId);
      if (b?.teacherName) setCollectorName(b.teacherName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে একজন শিক্ষার্থী নির্বাচন করুন' : 'Please select a student');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg(isBn ? 'সঠিক ফি পরিমাণ লিখুন' : 'Please enter valid fee amount');
      return;
    }

    setErrorMsg('');
    const payment: FeePayment = {
      id: `fee_${Date.now()}`,
      date,
      month: parsedMonthNameBn,
      year: parsedYear,
      monthYear: displayMMYYYY, // Single line MM-YYYY format!
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentRoll: currentStudent.roll,
      studentGender: currentStudent.gender === 'girl' ? 'girl' : 'boy',
      branchId: currentStudent.branchId,
      amount: parsedAmount,
      collectorName: collectorName.trim() || (studentBranch?.teacherName || (isBn ? 'মক্তব দায়িত্বশীল' : 'Maktab Incharge')),
      note: note.trim(),
    };

    onSavePayment(payment);
    setSuccessMsg(
      isBn
        ? `${currentStudent.gender === 'girl' ? '👧' : '👦'} ${currentStudent.name} এর (${displayMMYYYY}) মাসের বেতন আদায় সম্পন্ন হয়েছে!`
        : `Fee for ${currentStudent.name} (${displayMMYYYY}) collected successfully!`
    );
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 to-teal-950 border-b border-emerald-500/20 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <i className="fa-solid fa-hand-holding-dollar text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {isBn ? 'বেতন আদায় ফরম' : 'Fee Collection Form'}
              </h3>
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

        {/* Content */}
        <div className="p-4 space-y-4">
          {errorMsg && (
            <div className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow">
              <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950 border border-emerald-400 text-emerald-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow">
              <i className="fa-solid fa-circle-check text-emerald-400"></i>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-3.5 space-y-3">
            {/* শাখা ও জেন্ডার ফিল্টার */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">
                  {isBn ? 'কেন্দ্র ফিল্টার' : 'Branch Filter'}
                </label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-2 py-1.5 text-[11px] text-emerald-200 outline-none"
                >
                  <option value="all">{isBn ? 'সব কেন্দ্র' : 'All Centres'}</option>
                  {safeBranches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">
                  {isBn ? 'ছাত্র / ছাত্রী ফিল্টার' : 'Gender Filter'}
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-0.5 rounded-xl border border-emerald-500/30">
                  <button
                    type="button"
                    onClick={() => setGenderFilter('all')}
                    className={`py-1 text-[10px] font-bold rounded-lg transition ${
                      genderFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    সব
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('boy')}
                    className={`py-1 text-[10px] font-bold rounded-lg transition ${
                      genderFilter === 'boy' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    👦 ছাত্র
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('girl')}
                    className={`py-1 text-[10px] font-bold rounded-lg transition ${
                      genderFilter === 'girl' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    👧 ছাত্রী
                  </button>
                </div>
              </div>
            </div>

            {/* Dual Sync: শিক্ষার্থী নির্বাচন ও রোল নির্বাচন */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'শিক্ষার্থীর নাম' : 'Student Name'} <span className="text-rose-400">*</span>
                </label>
                {filteredStudents.length === 0 ? (
                  <div className="p-2 bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs rounded-xl">
                    {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found'}
                  </div>
                ) : (
                  <select
                    value={studentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-400 font-bold"
                  >
                    {filteredStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.gender === 'girl' ? '👧 ছাত্রী' : '👦 ছাত্র'} | রোল {toBnNum(st.roll, isBn)}: {st.name} ({st.classLevel})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'রোল (অটো)' : 'Roll (Auto)'}
                </label>
                <input
                  type="text"
                  value={studentRoll}
                  onChange={(e) => handleRollChange(e.target.value)}
                  placeholder={isBn ? '০১' : '01'}
                  className="w-full bg-slate-900 border border-amber-400/50 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-black outline-none focus:border-amber-400 text-center"
                />
              </div>
            </div>

            {/* স্বয়ংক্রিয় তথ্য প্রদর্শন */}
            {currentStudent && (
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-emerald-500/20 text-xs flex justify-between items-center text-gray-300">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    currentStudent.gender === 'girl'
                      ? 'bg-pink-950/80 text-pink-300 border border-pink-500/40'
                      : 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                  }`}>
                    {currentStudent.gender === 'girl' ? '👧 ছাত্রী' : '👦 ছাত্র'}
                  </span>
                  <span className="text-amber-300 font-bold">
                    {isBn ? `রোল: ${toBnNum(currentStudent.roll, isBn)}` : `Roll: ${currentStudent.roll}`}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span>{currentStudent.classLevel}</span>
                </div>
                <div className="text-emerald-300 font-semibold truncate max-w-[150px]">
                  {studentBranch ? studentBranch.name : (isBn ? 'শাখা নেই' : 'No centre')}
                </div>
              </div>
            )}

            {/* Requirement 3: বেতনের মাস ও বছর একটা ঘরের মধ্যে থাকবে (MM-YYYY) */}
            <div>
              <label className="text-[11px] font-semibold text-emerald-200 block mb-1 flex items-center justify-between">
                <span>{isBn ? 'বেতনের মাস ও বছর (এক ঘরে নির্বাচন)' : 'Fee Month & Year (Combined)'} <span className="text-rose-400">*</span></span>
                <span className="text-amber-300 font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {displayMMYYYY}
                </span>
              </label>
              <input
                type="month"
                value={selectedMonthYearInput}
                onChange={(e) => setSelectedMonthYearInput(e.target.value)}
                className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-emerald-400 cursor-pointer"
              />
            </div>

            {/* Requirement 3: একটা ঘরে ভর্তির মাস থেকে যে কয় মাস বেতন বাকি তা দেখা যাবে */}
            <div className="p-3 bg-gradient-to-r from-amber-950/70 to-slate-950/90 border border-amber-500/40 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 flex items-center gap-1.5 font-medium">
                  <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>
                  {isBn ? 'ভর্তির মাস হতে বকেয়া হিসাব:' : 'Due Fee from Admission:'}
                </span>
                <span className={`font-black px-2 py-0.5 rounded-lg text-xs ${
                  dueMonthsCount > 0 ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {dueMonthsCount > 0
                    ? (isBn ? `${toBnNum(dueMonthsCount, isBn)} মাস বাকি` : `${dueMonthsCount} Months Due`)
                    : (isBn ? 'সব পরিশোধিত' : 'All Paid')}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 pt-1 border-t border-slate-800">
                <span>{isBn ? `ভর্তির সময়: ${toBnNum(admissionMonthYearStr, isBn)}` : `Enrolled: ${admissionMonthYearStr}`}</span>
                <span className="text-amber-300 font-semibold">
                  {isBn ? `আনুমানিক বকেয়া: ${toBnCurrency(dueMonthsCount * (parseFloat(amount) || 200), isBn)}` : `Total Due: ${toBnCurrency(dueMonthsCount * (parseFloat(amount) || 200), isBn)}`}
                </span>
              </div>
            </div>

            {/* টাকার পরিমাণ ও তারিখ */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'টাকার পরিমাণ (৳)' : 'Amount (৳)'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="200"
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-black outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'আদায়ের তারিখ' : 'Collection Date'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Requirement 3: আদায়কারী কেন্দ্রের শিক্ষক এর নাম অটো সিলেক্ট হবে */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'আদায়কারী শিক্ষক (অটো)' : 'Collector (Auto)'}
                </label>
                <input
                  type="text"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  placeholder={isBn ? 'কেন্দ্রের ওস্তাদ' : 'Teacher name'}
                  className="w-full bg-slate-900 border border-teal-500/40 rounded-xl px-3 py-2 text-xs text-emerald-200 font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'রশিদ / নোট (ঐচ্ছিক)' : 'Receipt / Note'}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={isBn ? 'রশিদ নং' : 'Receipt No.'}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={students.length === 0}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <i className="fa-solid fa-check-double"></i>
              <span>{isBn ? 'বেতন আদায় সংরক্ষণ করুন' : 'Confirm Fee Collection'}</span>
            </button>
          </form>

          {/* Recent Collections */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
              <i className="fa-solid fa-receipt text-amber-400"></i>
              {isBn ? 'সাম্প্রতিক আদায়কৃত বেতন (MM-YYYY)' : 'Recent Fees (MM-YYYY)'}
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {feePayments.slice(-5).reverse().map((fee) => (
                <div key={fee.id} className="p-2.5 bg-slate-800/80 rounded-xl border border-emerald-500/20 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white flex items-center gap-1">
                      <span>{fee.studentGender === 'girl' ? '👧' : '👦'}</span>
                      <span>{fee.studentName}</span>
                      {fee.studentRoll && (
                        <span className="text-[10px] bg-slate-900 text-amber-300 px-1 rounded border border-gray-700 font-mono">
                          রোল: {toBnNum(fee.studentRoll, isBn)}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-amber-300 ml-1.5 font-mono">
                      ({fee.monthYear || `${fee.month} ${fee.year}`})
                    </span>
                  </div>
                  <span className="font-black text-amber-300">{toBnCurrency(fee.amount, isBn)}</span>
                </div>
              ))}
            </div>
          </div>
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
