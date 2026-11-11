import React, { useState } from 'react';
import { FeePayment, BookSale, OtherIncome } from '../types';
import { toBnCurrency, toBnNum, INCOME_CATEGORIES } from '../utils/storage';
import { translations, Language } from '../utils/translations';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feePayments: FeePayment[];
  bookSales: BookSale[];
  otherIncomes: OtherIncome[];
  onAddOtherIncome: (income: OtherIncome) => void;
  onDeleteOtherIncome: (id: string) => void;
  onToggleToExpense?: () => void; // Requirement 5 & 6: Toggle between income & expense
  viewOnly?: boolean; // When true: hide add income form
  language?: Language;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  feePayments,
  bookSales,
  otherIncomes,
  onAddOtherIncome,
  onDeleteOtherIncome,
  onToggleToExpense,
  viewOnly = false,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  // Form states - Requirement 8: আয় এর খাত যেমন হাদিয়া, দান ইত্যাদি
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const safeFeePayments = Array.isArray(feePayments) ? feePayments : [];
  const safeBookSales = Array.isArray(bookSales) ? bookSales : [];
  const safeOtherIncomes = Array.isArray(otherIncomes) ? otherIncomes : [];

  const totalFees = safeFeePayments.reduce((sum, f) => sum + f.amount, 0);
  const totalBookSales = safeBookSales.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalOther = safeOtherIncomes.reduce((sum, o) => sum + o.amount, 0);
  const grandTotalIncome = totalFees + totalBookSales + totalOther;

  const handleAddDonation = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    onAddOtherIncome({
      id: `other_inc_${Date.now()}`,
      date,
      category,
      title: title.trim() || category,
      amount: val,
      donorName: donorName.trim() || (isBn ? 'হিতাকাঙ্ক্ষী দাতা' : 'Well-wisher Donor'),
    });

    setTitle('');
    setDonorName('');
    setAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header with Quick Toggle to Expense (Requirement 5 & 6) */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <i className="fa-solid fa-chart-line text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {viewOnly
                  ? (isBn ? 'মোট আয় বিবরণী ও হিসাব' : 'Total Income Statement & Calculation')
                  : (isBn ? 'মোট আয় বিবরণী ও নতুন এন্ট্রি' : 'Income Statement & Add Entry')}
              </h3>
              <p className="text-[10px] text-teal-300">{t.appTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onToggleToExpense && (
              <button
                type="button"
                onClick={onToggleToExpense}
                className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/50 text-rose-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                title={isBn ? 'মক্তবের ব্যয় দেখতে চাপ দিন' : 'Toggle to Expenses'}
              >
                <i className="fa-solid fa-arrows-rotate text-[9px]"></i>
                <span>{isBn ? 'ব্যয় দেখুন' : 'View Expenses'}</span>
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
            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-2 text-center text-[11px] text-emerald-200 font-bold flex items-center justify-center gap-1.5">
              <i className="fa-solid fa-eye text-emerald-400"></i>
              <span>{isBn ? 'শুধুমাত্র হিসাব ও তালিকা প্রদর্শন (নতুন আয় যুক্ত করতে মূল মেনু ব্যবহার করুন)' : 'View Only Mode (Use Main Menu to record new income)'}</span>
            </div>
          )}

          {/* Grand Total Income Card */}
          <div className="bg-gradient-to-br from-emerald-900/90 to-teal-950/90 border border-emerald-400/40 rounded-2xl p-4 shadow-xl">
            <div className="text-[11px] text-emerald-200 font-semibold">{isBn ? 'সর্বমোট অর্জিত মোট আয়' : 'Total Gross Income'}</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{toBnCurrency(grandTotalIncome, isBn)}</div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-emerald-700/50 text-[11px]">
              <div>
                <span className="text-gray-300 block text-[10px]">{isBn ? 'বেতন আদায়' : 'Fee Income'}</span>
                <span className="text-emerald-300 font-bold">{toBnCurrency(totalFees, isBn)}</span>
              </div>
              <div>
                <span className="text-gray-300 block text-[10px]">{isBn ? 'বই বিক্রি' : 'Book Sales'}</span>
                <span className="text-blue-300 font-bold">{toBnCurrency(totalBookSales, isBn)}</span>
              </div>
              <div>
                <span className="text-gray-300 block text-[10px]">{isBn ? 'দান / হাদিয়া' : 'Donations/Hadia'}</span>
                <span className="text-amber-300 font-bold">{toBnCurrency(totalOther, isBn)}</span>
              </div>
            </div>
          </div>

          {/* Add Other Income / Donation form - Hidden when viewOnly */}
          {!viewOnly && (
            <form onSubmit={handleAddDonation} className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-3.5 space-y-3">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
                <i className="fa-solid fa-hand-holding-heart text-xs"></i>
                <span>{isBn ? 'নতুন আয় যুক্ত করুন (হাদিয়া, দান ও অনুদান)' : 'Add Income (Hadia, Donation, Grants)'}</span>
              </div>

              {/* খাতের নাম নির্বাচন */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'আয়ের খাত নির্বাচন করুন' : 'Income Category'} <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none"
                >
                  {INCOME_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'বিবরণ / শিরোনাম' : 'Description / Title'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isBn ? 'যেমন: মক্তব উন্নয়ন হাদিয়া / দান' : 'e.g. Maktab development hadia'}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                />
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
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'দাতার নাম' : 'Donor Name'}
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder={isBn ? 'নাম (ঐচ্ছিক)' : 'Name (Optional)'}
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                  />
                </div>
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

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow"
              >
                <i className="fa-solid fa-plus"></i>
                <span>{isBn ? 'আয় এন্ট্রি সংরক্ষণ করুন' : 'Save Income Entry'}</span>
              </button>
            </form>
          )}

          {/* Income streams list */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
              <i className="fa-solid fa-list-check text-teal-400"></i>
              {isBn ? 'সংরক্ষিত আয়ের তালিকা' : 'Income Ledger List'}
            </h4>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {/* Other incomes / Hadia / Donations */}
              {safeOtherIncomes.map((inc) => (
                <div key={inc.id} className="p-2.5 bg-slate-800/80 rounded-xl border border-emerald-500/20 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 font-bold">
                        {inc.category || 'দান'}
                      </span>
                      <span>{inc.title}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{inc.donorName} • {toBnNum(inc.date, isBn)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300">+{toBnCurrency(inc.amount, isBn)}</span>
                    {!viewOnly && (
                      <button
                        onClick={() => onDeleteOtherIncome(inc.id)}
                        className="text-rose-400 hover:text-rose-300 text-[10px] cursor-pointer"
                        title={isBn ? 'ডিলিট করুন' : 'Delete'}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Fee payment entries */}
              {safeFeePayments.slice(-4).reverse().map((fee) => (
                <div key={fee.id} className="p-2.5 bg-slate-800/80 rounded-xl border border-emerald-500/20 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{isBn ? 'বেতন: ' : 'Fee: '}{fee.studentName}</div>
                    <div className="text-[10px] text-gray-400">
                      {isBn ? `রোল: ${toBnNum(fee.studentRoll, isBn)}` : `Roll: ${fee.studentRoll}`} ({fee.monthYear || `${fee.month} ${fee.year}`})
                    </div>
                  </div>
                  <span className="font-bold text-emerald-400">+{toBnCurrency(fee.amount, isBn)}</span>
                </div>
              ))}

              {/* Book sales */}
              {safeBookSales.slice(-3).reverse().map((bk) => (
                <div key={bk.id} className="p-2.5 bg-slate-800/80 rounded-xl border border-blue-500/20 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{isBn ? 'বই: ' : 'Book: '}{bk.bookName}</div>
                    <div className="text-[10px] text-gray-400">{bk.studentName} • {toBnNum(bk.quantity, isBn)}টি</div>
                  </div>
                  <span className="font-bold text-blue-300">+{toBnCurrency(bk.totalAmount, isBn)}</span>
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
