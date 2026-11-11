import React, { useState, useEffect } from 'react';
import { Deposit, Branch } from '../types';
import { DIRECTOR_NAME, DIRECTOR_PHONE, toBnCurrency, toBnNum } from '../utils/storage';
import { translations, Language } from '../utils/translations';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposits: Deposit[];
  branches: Branch[];
  onSaveDeposit: (deposit: Deposit) => void;
  onDeleteDeposit: (id: string) => void;
  language?: Language;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  deposits,
  branches,
  onSaveDeposit,
  onDeleteDeposit,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const safeBranches = Array.isArray(branches) ? branches : [];
  const safeDeposits = Array.isArray(deposits) ? deposits : [];

  // Unique saved teacher names across all branches
  const savedTeachers = Array.from(
    new Set(
      safeBranches
        .map((b) => b.teacherName?.trim())
        .filter((name): name is string => Boolean(name && name.length > 0))
    )
  );

  const recipientOptions = [
    `${isBn ? 'পরিচালক: ' : 'Director: '}${DIRECTOR_NAME}`,
    ...savedTeachers.map((tName) => `${isBn ? 'শিক্ষক: ' : 'Teacher: '}${tName}`),
  ];

  const [selectedBranchId, setSelectedBranchId] = useState<string>(safeBranches[0]?.id || '');
  const [recipient, setRecipient] = useState<string>(recipientOptions[0] || `${isBn ? 'পরিচালক: ' : 'Director: '}${DIRECTOR_NAME}`);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [depositedBy, setDepositedBy] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Requirement 9: জমা দানকারী ব্যক্তির নাম কেন্দ্রের শিক্ষকের নামের সাথে অটো সিলেক্ট হবে
  useEffect(() => {
    const br = safeBranches.find((b) => b.id === selectedBranchId) || safeBranches[0];
    if (br && br.teacherName) {
      setDepositedBy(br.teacherName);
    }
  }, [selectedBranchId, safeBranches]);

  if (!isOpen) return null;

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg(isBn ? 'সঠিক টাকার পরিমাণ লিখুন' : 'Please enter valid deposit amount');
      return;
    }

    if (!recipient) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে প্রাপক নির্বাচন করুন' : 'Please select recipient');
      return;
    }

    const newDeposit: Deposit = {
      id: `dep_${Date.now()}`,
      date,
      branchId: currentBranch ? currentBranch.id : 'general',
      recipient,
      amount: parsedAmount,
      depositedBy: depositedBy.trim() || (currentBranch?.teacherName || (isBn ? 'কেন্দ্র শিক্ষক' : 'Centre Teacher')),
      note: note.trim(),
    };

    onSaveDeposit(newDeposit);
    setSuccessMsg(isBn ? `টাকা জমা সফলভাবে এন্ট্রি হয়েছে! মোট: ${toBnCurrency(parsedAmount, isBn)}` : `Deposit of ${toBnCurrency(parsedAmount, isBn)} saved!`);
    setAmount('');
    setNote('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const totalDeposited = safeDeposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-950 via-teal-950 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <i className="fa-solid fa-wallet text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{isBn ? 'কেন্দ্রের টাকা জমা ব্যবস্থাপনা' : 'Centre Deposit Management'}</h3>
              <p className="text-[10px] text-indigo-300">{isBn ? 'শিক্ষক ও পরিচালক অনুকূলে জমা' : 'Deposits to Teacher & Director'}</p>
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
          {/* Policy Info */}
          <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-2xl p-3 text-xs text-indigo-200">
            <div className="flex items-start gap-2">
              <i className="fa-solid fa-shield-halved text-amber-400 text-sm mt-0.5"></i>
              <div>
                <span className="font-bold text-amber-300">{isBn ? 'নিরাপত্তা ও নীতিমালা:' : 'Security Policy:'}</span>
                <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                  {isBn
                    ? `টাকা শুধুমাত্র সংরক্ষিত শিক্ষকের কাছে অথবা পরিচালক ${DIRECTOR_NAME} (${toBnNum(DIRECTOR_PHONE, isBn)}) এর নামে জমা হবে।`
                    : `Deposits can only be assigned to Director ${DIRECTOR_NAME} (${DIRECTOR_PHONE}) or saved teachers.`}
                </p>
              </div>
            </div>
          </div>

          {/* Deposit Form */}
          <form onSubmit={handleSubmit} className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-3.5 space-y-3">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
              <i className="fa-solid fa-circle-dollar-to-slot text-xs"></i>
              <span>{isBn ? 'নতুন জমা এন্ট্রি করুন' : 'Add New Deposit'}</span>
            </div>

            {errorMsg && (
              <div className="text-[11px] bg-rose-950/80 border border-rose-500/40 text-rose-200 px-3 py-1.5 rounded-xl">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="text-[11px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-3 py-1.5 rounded-xl">
                {successMsg}
              </div>
            )}

            {/* কেন্দ্র নির্বাচন */}
            <div>
              <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                {isBn ? 'জমা প্রদানকারী কেন্দ্র' : 'Depositing Centre'} <span className="text-rose-400">*</span>
              </label>
              {branches.length === 0 ? (
                <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-xl">
                  {isBn ? 'কোনো কেন্দ্র যুক্ত নেই' : 'No centres available'}
                </div>
              ) : (
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-100 font-bold outline-none focus:border-indigo-400"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.location})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Requirement 9: জমা দানকারী ব্যক্তির নাম কেন্দ্রের শিক্ষকের নামের সাথে অটো সিলেক্ট হবে */}
            <div>
              <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                {isBn ? 'জমা দানকারী ব্যক্তি (কেন্দ্রের শিক্ষক অটো)' : 'Depositor (Centre Teacher Auto)'}
              </label>
              <input
                type="text"
                value={depositedBy}
                onChange={(e) => setDepositedBy(e.target.value)}
                placeholder={isBn ? 'কেন্দ্রের ওস্তাদের নাম' : 'Teacher name'}
                className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-indigo-400"
              />
            </div>

            {/* জমা গ্রহণকারী (Strict Dropdown Only) */}
            <div>
              <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                {isBn ? 'জমা গ্রহণকারীর নাম (পরিচালক / শিক্ষক)' : 'Recipient (Director / Teacher)'} <span className="text-rose-400">*</span>
              </label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-slate-900 border border-indigo-400/50 rounded-xl px-3 py-2 text-xs text-amber-300 font-extrabold outline-none focus:border-indigo-400"
              >
                {recipientOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* টাকার পরিমাণ ও তারিখ */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'জমার পরিমাণ (টাকা)' : 'Amount (৳)'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-black outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'জমার তারিখ' : 'Deposit Date'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                {isBn ? 'মন্তব্য / রেফারেন্স' : 'Note / Reference'}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isBn ? 'হিসাব নম্বর / চালান' : 'Ref no.'}
                className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <i className="fa-solid fa-check"></i>
              <span>{isBn ? 'জমা নিশ্চিত করুন' : 'Confirm Deposit'}</span>
            </button>
          </form>

          {/* Deposit Ledger & History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                <i className="fa-solid fa-list-check text-amber-400"></i>
                {isBn ? `জমা বিবরণী (${toBnNum(safeDeposits.length, isBn)}টি)` : `Deposits (${safeDeposits.length})`}
              </span>
              <span className="text-xs font-black text-amber-300">
                {isBn ? 'মোট: ' : 'Total: '}{toBnCurrency(totalDeposited, isBn)}
              </span>
            </div>

            {safeDeposits.length === 0 ? (
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-dashed border-indigo-500/20 text-center text-xs text-gray-400">
                {isBn ? 'কোনো জমার হিসাব এখনও এন্ট্রি করা হয়নি।' : 'No deposits recorded yet.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {safeDeposits.slice().reverse().map((d) => {
                  const br = safeBranches.find((b) => b.id === d.branchId);
                  return (
                    <div
                      key={d.id}
                      className="p-3 bg-slate-800/90 border border-indigo-500/20 rounded-2xl flex items-center justify-between gap-2 shadow"
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <i className="fa-solid fa-user-check text-emerald-400 text-xs"></i>
                          <span>{d.recipient}</span>
                        </div>
                        <div className="text-[11px] text-gray-300 mt-0.5">
                          {isBn ? 'কেন্দ্র: ' : 'Centre: '}{br ? br.name : 'N/A'}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                          <span>{isBn ? 'তারিখ: ' : 'Date: '}{toBnNum(d.date, isBn)}</span>
                          <span>{isBn ? 'জমাদানকারী: ' : 'By: '}{d.depositedBy}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-black text-amber-300">
                          {toBnCurrency(d.amount, isBn)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteDeposit(d.id)}
                          className="px-2 py-0.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded text-[10px]"
                        >
                          {t.delete}
                        </button>
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
