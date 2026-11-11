import React, { useState } from 'react';
import { Branch, Student, FeePayment, TeacherWithdrawal } from '../types';
import { toBnNum, toBnCurrency, DIRECTOR_NAME, DIRECTOR_PHONE } from '../utils/storage';
import { translations, Language } from '../utils/translations';

interface TeacherListModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  students: Student[];
  feePayments: FeePayment[];
  withdrawals: TeacherWithdrawal[];
  onSaveWithdrawal: (withdrawal: TeacherWithdrawal) => void;
  onDeleteWithdrawal: (id: string) => void;
  language?: Language;
}

export const TeacherListModal: React.FC<TeacherListModalProps> = ({
  isOpen,
  onClose,
  branches,
  students,
  feePayments,
  withdrawals,
  onSaveWithdrawal,
  onDeleteWithdrawal,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  // Selected Teacher for withdrawal management
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawDate, setWithdrawDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [withdrawNote, setWithdrawNote] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  // Safe array references
  const safeBranches = Array.isArray(branches) ? branches : [];
  const safeFeePayments = Array.isArray(feePayments) ? feePayments : [];
  const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];

  // Distinct list of teachers
  const teachersList = safeBranches
    .map((b) => ({
      name: b.teacherName || (isBn ? 'নামহীন শিক্ষক' : 'Unnamed Teacher'),
      phone: b.teacherPhone,
      branchId: b.id,
      branchName: b.name,
      timeSlot: b.timeSlot,
    }))
    .filter((t) => Boolean(t.name));

  // Default selection if none
  const activeTeacher = teachersList.find((t) => t.name === selectedTeacherName) || teachersList[0];

  // Calculations for activeTeacher
  let teacherEarned50 = 0;
  let teacherWithdrawn = 0;
  let remainingBalance = 0;

  if (activeTeacher) {
    // Total fees collected in activeTeacher's branch
    const teacherFees = safeFeePayments
      .filter((f) => f.branchId === activeTeacher.branchId)
      .reduce((sum, f) => sum + f.amount, 0);

    // Requirement 14: ফিফটি পার্সেন্ট শিক্ষকের একাউন্টে চলে যাবে
    teacherEarned50 = teacherFees * 0.5;

    // Total Withdrawn by this teacher
    teacherWithdrawn = safeWithdrawals
      .filter((w) => w.teacherName === activeTeacher.name)
      .reduce((sum, w) => sum + w.amount, 0);

    remainingBalance = teacherEarned50 - teacherWithdrawn;
  }

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeacher) return;

    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      setErrorMsg(isBn ? 'সঠিক উত্তোলনের পরিমাণ লিখুন' : 'Enter valid withdrawal amount');
      return;
    }
    setErrorMsg('');

    const newWithdrawal: TeacherWithdrawal = {
      id: `wth_${Date.now()}`,
      teacherName: activeTeacher.name,
      branchId: activeTeacher.branchId,
      date: withdrawDate,
      amount: amt,
      note: withdrawNote.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveWithdrawal(newWithdrawal);
    setWithdrawAmount('');
    setWithdrawNote('');
    setSuccessMsg(
      isBn
        ? `${toBnCurrency(amt, isBn)} সফলভাবে উত্তোলন সম্পন্ন হয়েছে!`
        : `Withdrawal of ${toBnCurrency(amt, isBn)} confirmed!`
    );
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const activeTeacherWithdrawals = activeTeacher
    ? withdrawals.filter((w) => w.teacherName === activeTeacher.name)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <i className="fa-solid fa-chalkboard-user text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{isBn ? 'শিক্ষক তালিকা ও ৫০% একাউন্ট' : 'Teachers & 50% Account'}</h3>
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
          {/* Director Card */}
          <div className="bg-gradient-to-r from-emerald-900/90 to-teal-950/90 border border-amber-400/50 rounded-2xl p-3.5 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                  {isBn ? 'প্রধান পরিচালক' : 'Chief Director'}
                </span>
                <h4 className="text-sm font-black text-white mt-1.5">{DIRECTOR_NAME}</h4>
                <p className="text-xs text-amber-300 font-semibold mt-0.5 flex items-center gap-1">
                  <i className="fa-solid fa-phone text-[10px]"></i>
                  <span>{isBn ? 'মোবাইল: ' : 'Mobile: '}{toBnNum(DIRECTOR_PHONE, isBn)}</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-lg">
                <i className="fa-solid fa-user-tie"></i>
              </div>
            </div>
          </div>

          {/* Requirement 14 & 15: শিক্ষক তালিকার মধ্যে শিক্ষকের ৫০% একাউন্ট ও উত্তোলন (Withdrawal) ফরম */}
          {teachersList.length > 0 && activeTeacher && (
            <div className="bg-slate-800/90 border border-teal-500/30 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-hand-holding-dollar text-xs"></i>
                  <span>{isBn ? 'শিক্ষকের ৫০% বেতন ও উত্তোলন খতিয়ান' : 'Teacher 50% Ledger & Withdrawal'}</span>
                </span>
                <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/40 font-bold">
                  {isBn ? '৫০% বরাদ্দ' : '50% Share'}
                </span>
              </div>

              {/* Teacher Selector */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'শিক্ষক নির্বাচন করুন' : 'Select Teacher'}
                </label>
                <select
                  value={activeTeacher.name}
                  onChange={(e) => setSelectedTeacherName(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none"
                >
                  {teachersList.map((tc) => (
                    <option key={`${tc.name}_${tc.branchId}`} value={tc.name}>
                      {tc.name} ({tc.branchName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Requirement 15: ৫০% একাউন্ট স্ট্যাটাস কার্ড - ৫০% পাওনা, উত্তোলন, বাকি টাকা */}
              <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-950 p-2.5 rounded-xl border border-teal-500/20">
                <div className="p-1">
                  <span className="text-[9px] text-gray-400 block">{isBn ? 'মোট ৫০% পাওনা' : '50% Earned'}</span>
                  <span className="text-xs font-bold text-emerald-300">{toBnCurrency(teacherEarned50, isBn)}</span>
                </div>
                <div className="p-1 border-x border-slate-800">
                  <span className="text-[9px] text-gray-400 block">{isBn ? 'মোট উত্তোলন' : 'Withdrawn'}</span>
                  <span className="text-xs font-bold text-rose-300">{toBnCurrency(teacherWithdrawn, isBn)}</span>
                </div>
                <div className="p-1">
                  <span className="text-[9px] text-amber-400 block font-bold">{isBn ? 'বাকি টাকা' : 'Remaining'}</span>
                  <span className={`text-xs font-black ${remainingBalance < 0 ? 'text-rose-400' : 'text-amber-300'}`}>
                    {toBnCurrency(remainingBalance, isBn)}
                  </span>
                </div>
              </div>

              {/* Requirement 15: উত্তোলনের ফরম (তারিখ, এমাউন্ট, সাবমিট) */}
              <form onSubmit={handleWithdrawSubmit} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 space-y-2">
                <span className="text-[11px] font-bold text-white block">
                  {isBn ? `টাকা উত্তোলন ফরম (${activeTeacher.name})` : `Withdrawal Form (${activeTeacher.name})`}
                </span>

                {errorMsg && (
                  <div className="text-[10px] bg-rose-950 text-rose-200 px-2 py-1 rounded border border-rose-500/40">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="text-[10px] bg-emerald-950 text-emerald-200 px-2 py-1 rounded border border-emerald-500/40">
                    {successMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-300 block mb-0.5">{isBn ? 'উত্তোলন তারিখ' : 'Date'}</label>
                    <input
                      type="date"
                      value={withdrawDate}
                      onChange={(e) => setWithdrawDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-300 block mb-0.5">{isBn ? 'উত্তোলন এমাউন্ট (৳)' : 'Amount (৳)'}</label>
                    <input
                      type="number"
                      min="1"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full bg-slate-950 border border-amber-400/50 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition shadow"
                >
                  <i className="fa-solid fa-arrow-up-from-bracket text-xs"></i>
                  <span>{isBn ? 'উত্তোলন সাবমিট করুন' : 'Submit Withdrawal'}</span>
                </button>
              </form>

              {/* Withdrawal history */}
              {activeTeacherWithdrawals.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto pt-1">
                  <span className="text-[10px] text-gray-400 font-bold block">{isBn ? 'সাম্প্রতিক উত্তোলন হিস্ট্রি:' : 'Withdrawal History:'}</span>
                  {activeTeacherWithdrawals.slice().reverse().map((w) => (
                    <div key={w.id} className="p-1.5 bg-slate-950/70 rounded-lg text-[10px] flex justify-between items-center text-gray-300">
                      <span>{toBnNum(w.date, isBn)}</span>
                      <span className="font-bold text-rose-300">-{toBnCurrency(w.amount, isBn)}</span>
                      <button
                        onClick={() => onDeleteWithdrawal(w.id)}
                        className="text-rose-400 hover:text-rose-300 text-[10px] ml-2"
                        title={t.delete}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Teacher and Centre Overview Cards */}
          <div>
            <h4 className="text-xs font-bold text-emerald-300 mb-2 flex items-center gap-1">
              <i className="fa-solid fa-users text-amber-400"></i>
              {isBn ? `শাখাভিত্তিক ওস্তাদগণ (${toBnNum(branches.length, isBn)}টি কেন্দ্র)` : `All Teachers (${branches.length} Centres)`}
            </h4>

            {branches.length === 0 ? (
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-dashed border-emerald-500/20 text-center text-xs text-gray-400">
                {isBn ? 'কোনো কেন্দ্র বা শিক্ষক এখনও এন্ট্রি করা হয়নি।' : 'No teachers added yet.'}
              </div>
            ) : (
              <div className="space-y-2">
                {branches.map((b) => {
                  const studentCount = students.filter((s) => s.branchId === b.id).length;
                  const bFees = feePayments
                    .filter((f) => f.branchId === b.id)
                    .reduce((sum, f) => sum + f.amount, 0);
                  const b50 = bFees * 0.5;

                  return (
                    <div
                      key={b.id}
                      className="p-3 bg-slate-800/80 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-2 shadow"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {b.teacherName || (isBn ? 'ওস্তাদের নাম নেই' : 'No teacher')}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-200 mt-0.5 flex items-center gap-1">
                          <i className="fa-solid fa-mosque text-[10px] text-teal-400"></i>
                          <span>{b.name}</span>
                        </div>
                        {b.teacherPhone && (
                          <div className="text-[10px] text-amber-300 mt-0.5 flex items-center gap-1">
                            <i className="fa-solid fa-phone text-[9px]"></i>
                            <span>{toBnNum(b.teacherPhone, isBn)}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-teal-300 mt-0.5 font-bold">
                          {isBn ? 'মোট ৫০% পাওনা: ' : '50% Earned: '}{toBnCurrency(b50, isBn)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-1 rounded-xl">
                          {isBn ? `${toBnNum(studentCount, isBn)} জন ছাত্র` : `${studentCount} Students`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
