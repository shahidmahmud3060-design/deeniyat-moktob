import React, { useState } from 'react';
import { Expense, Branch } from '../types';
import { toBnCurrency, toBnNum } from '../utils/storage';
import { translations, Language } from '../utils/translations';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  branches: Branch[];
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onToggleToIncome?: () => void; // Requirement 5 & 6
  viewOnly?: boolean;
  language?: Language;
}

const EXPENSE_CATEGORIES = [
  'মক্তবের সাধারণ ব্যয়',
  'শিক্ষক হাদিয়া / ভাতা',
  'নাস্তা ও আপ্যায়ন',
  'পাঠ্য উপকরণ ও সরঞ্জাম',
  'বিদ্যুৎ ও ইউটিলিটি বিল',
  'ভাড়া ও স্থাপনা সংস্কার',
  'অনুষ্ঠান ও পুরস্কার বিতরণ',
  'অন্যান্য বিবিধ খরচ',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenses,
  branches,
  onSaveExpense,
  onDeleteExpense,
  onToggleToIncome,
  viewOnly = false,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const [branchId, setBranchId] = useState<string>('all');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setErrorMsg(isBn ? 'সঠিক ব্যয়ের পরিমাণ লিখুন' : 'Please enter valid expense amount');
      return;
    }

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      date,
      branchId,
      category,
      amount: val,
      description: description.trim() || category,
    };

    onSaveExpense(newExpense);
    setAmount('');
    setDescription('');
    setErrorMsg('');
  };

  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeBranches = Array.isArray(branches) ? branches : [];
  const totalExpenseAmount = safeExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header with Toggle to Income (Requirement 5 & 6) */}
        <div className="p-4 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-b border-rose-500/20 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <i className="fa-solid fa-receipt text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {viewOnly
                  ? (isBn ? 'মক্তব ব্যয় বিবরণী ও হিসাব' : 'Maktab Expense Statement & Calculation')
                  : (isBn ? 'মক্তবের ব্যয় বিবরণী ও নতুন এন্ট্রি' : 'Maktab Expense Statement & Add Entry')}
              </h3>
              <p className="text-[10px] text-rose-300">{t.appTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onToggleToIncome && (
              <button
                type="button"
                onClick={onToggleToIncome}
                className="px-2.5 py-1 bg-teal-600/30 hover:bg-teal-600/50 border border-teal-400/50 text-teal-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                title={isBn ? 'মক্তবের আয় দেখতে চাপ দিন' : 'Toggle to Income'}
              >
                <i className="fa-solid fa-arrows-rotate text-[9px]"></i>
                <span>{isBn ? 'আয় দেখুন' : 'View Income'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {viewOnly && (
            <div className="bg-rose-950/60 border border-rose-500/30 rounded-xl p-2 text-center text-[11px] text-rose-200 font-bold flex items-center justify-center gap-1.5">
              <i className="fa-solid fa-eye text-rose-400"></i>
              <span>{isBn ? 'শুধুমাত্র ব্যয় হিসাব প্রদর্শন (নতুন ব্যয় যুক্ত করতে মূল মেনু ব্যবহার করুন)' : 'View Only Mode (Use Main Menu to record new expenses)'}</span>
            </div>
          )}

          {/* Quick Stats banner */}
          <div className="bg-rose-950/50 border border-rose-500/30 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-300 font-semibold block">{isBn ? 'সর্বমোট মক্তব ব্যয়' : 'Total Expenses'}</span>
              <span className="text-base font-black text-rose-400">{toBnCurrency(totalExpenseAmount, isBn)}</span>
            </div>
            <div className="text-right text-[11px] text-gray-400">
              <span>{isBn ? `মোট এন্ট্রি: ${toBnNum(expenses.length, isBn)}টি` : `Total entries: ${expenses.length}`}</span>
            </div>
          </div>

          {/* Add Expense Form - Hidden when viewOnly */}
          {!viewOnly && (
            <form onSubmit={handleSubmit} className="bg-slate-800/80 border border-rose-500/20 rounded-2xl p-3.5 space-y-3">
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
                <i className="fa-solid fa-file-circle-minus text-xs"></i>
                <span>{isBn ? 'নতুন ব্যয় এন্ট্রি করুন' : 'Add New Expense'}</span>
              </div>

              {errorMsg && (
                <div className="text-[11px] bg-rose-950 text-rose-200 px-3 py-1.5 rounded-xl border border-rose-500/40">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'শাখা / কেন্দ্র' : 'Centre / Branch'}
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-2.5 py-2 text-xs text-emerald-100 outline-none"
                  >
                    <option value="all">{isBn ? 'সাধারণ (সকল কেন্দ্র)' : 'General (All Centres)'}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'ব্যয়ের খাত' : 'Expense Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-2 py-2 text-xs text-white outline-none"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                    placeholder="500"
                    className="w-full bg-slate-900 border border-rose-400/40 rounded-xl px-3 py-2 text-xs text-rose-300 font-black outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'তারিখ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'ব্যয়ের বিবরণ' : 'Description'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isBn ? 'যেমন: মাসিক চক, ডাস্টার ও নাস্তা খরচ' : 'Expense description'}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <i className="fa-solid fa-plus"></i>
                <span>{isBn ? 'ব্যয় এন্ট্রি সংরক্ষণ করুন' : 'Save Expense Entry'}</span>
              </button>
            </form>
          )}

          {/* Expense History List */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
              <i className="fa-solid fa-clock-rotate-left text-rose-400"></i>
              {isBn ? 'ব্যয় তালিকা' : 'Expense History List'}
            </h4>

            {safeExpenses.length === 0 ? (
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-dashed border-rose-500/20 text-center text-xs text-gray-400">
                {isBn ? 'কোনো ব্যয়ের হিসাব এন্ট্রি করা হয়নি।' : 'No expenses recorded yet.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {safeExpenses.slice().reverse().map((exp) => {
                  const br = safeBranches.find((b) => b.id === exp.branchId);
                  return (
                    <div
                      key={exp.id}
                      className="p-3 bg-slate-800/90 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-2 shadow"
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="text-rose-400">●</span>
                          <span>{exp.category}</span>
                        </div>
                        {exp.description && exp.description !== exp.category && (
                          <p className="text-[11px] text-gray-300 mt-0.5">{exp.description}</p>
                        )}
                        <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                          <span>{toBnNum(exp.date, isBn)}</span>
                          <span>{br ? br.name : (isBn ? 'সকল কেন্দ্র' : 'All Centres')}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-black text-rose-400">
                          -{toBnCurrency(exp.amount, isBn)}
                        </span>
                        {!viewOnly && (
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(exp.id)}
                            className="px-2 py-0.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded text-[10px] cursor-pointer"
                          >
                            {t.delete}
                          </button>
                        )}
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
