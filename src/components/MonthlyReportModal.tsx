import React, { useState } from 'react';
import {
  MaktabDataStore,
  Branch,
  Student,
  FeePayment,
  Expense,
  Deposit,
  OtherIncome,
  BookSale,
} from '../types';
import {
  BENGALI_MONTHS,
  toBnCurrency,
  toBnNum,
  DIRECTOR_NAME,
  DIRECTOR_PHONE,
  DEVELOPER_NAME,
  DEVELOPER_PHONE,
  INCOME_CATEGORIES,
  sortStudentsByRoll,
} from '../utils/storage';
import { translations, Language } from '../utils/translations';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MaktabDataStore;
  branches: Branch[];
  defaultMonthYear?: string;
  onSaveFeePayment?: (payment: FeePayment) => void;
  onDeleteFeePayment?: (paymentId: string) => void;
  onSaveExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onSaveDeposit?: (deposit: Deposit) => void;
  onDeleteDeposit?: (depositId: string) => void;
  onAddOtherIncome?: (income: OtherIncome) => void;
  onDeleteOtherIncome?: (incomeId: string) => void;
  onDeleteBookSale?: (saleId: string) => void;
  onSaveStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  language?: Language;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  data,
  branches,
  defaultMonthYear,
  onSaveFeePayment,
  onDeleteFeePayment,
  onSaveExpense,
  onDeleteExpense,
  onSaveDeposit,
  onDeleteDeposit,
  onAddOtherIncome,
  onDeleteOtherIncome,
  onDeleteBookSale,
  onSaveStudent,
  onDeleteStudent,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const now = new Date();
  const currentMonthNum = now.getMonth() + 1;
  const currentYearNum = now.getFullYear();
  const initialMonthYearStr = `${currentYearNum}-${currentMonthNum < 10 ? '0' + currentMonthNum : currentMonthNum}`;

  // Month-Year combined selector (e.g., 2026-03)
  const [monthYearInput, setMonthYearInput] = useState<string>(initialMonthYearStr);
  const [selectedBranchId, setSelectedBranchId] = useState('all');

  // 5 Separate Tabs: 'students' | 'income' | 'expense' | 'deposit' | 'summary'
  const [activeTab, setActiveTab] = useState<'students' | 'income' | 'expense' | 'deposit' | 'summary'>('students');

  // Search & Filter for students
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');

  // Edit Modals / States
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [editingFeePayment, setEditingFeePayment] = useState<FeePayment | null>(null);
  const [editingOtherIncome, setEditingOtherIncome] = useState<OtherIncome | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentError, setEditStudentError] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  // New quick entry modal state for selected month
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState<'fee' | 'expense' | 'deposit' | 'income' | null>(null);

  if (!isOpen) return null;

  const [yrStr, moStr] = monthYearInput.split('-');
  const selYear = parseInt(yrStr, 10) || currentYearNum;
  const selMonthNum = parseInt(moStr, 10) || currentMonthNum;
  const selMonthNameBn = BENGALI_MONTHS[selMonthNum - 1] || 'মার্চ';
  const displayMMYYYY = `${moStr || (currentMonthNum < 10 ? '0' + currentMonthNum : currentMonthNum)}-${selYear}`;

  // Safe Arrays with fallbacks
  const safeStudents: Student[] = Array.isArray(data?.students) ? data.students : [];
  const safeBranches: Branch[] = Array.isArray(branches) ? branches : [];
  const feePayments: FeePayment[] = Array.isArray(data?.feePayments) ? data.feePayments : [];
  const bookSales: BookSale[] = Array.isArray(data?.bookSales) ? data.bookSales : [];
  const otherIncomes: OtherIncome[] = Array.isArray(data?.otherIncomes) ? data.otherIncomes : [];
  const expenses: Expense[] = Array.isArray(data?.expenses) ? data.expenses : [];
  const deposits: Deposit[] = Array.isArray(data?.deposits) ? data.deposits : [];

  // Filter items for the selected month, year and branch
  const filteredFees = feePayments.filter((f) => {
    const matchBranch = selectedBranchId === 'all' || f.branchId === selectedBranchId;
    const matchMonth =
      f.monthYear === displayMMYYYY ||
      (f.month === selMonthNameBn && f.year === selYear);
    return matchBranch && matchMonth;
  });

  const filteredSales = bookSales.filter((s) => {
    const matchBranch = selectedBranchId === 'all' || s.branchId === selectedBranchId;
    const sDate = new Date(s.date);
    return (
      matchBranch &&
      sDate.getMonth() + 1 === selMonthNum &&
      sDate.getFullYear() === selYear
    );
  });

  const filteredOtherIncomes = otherIncomes.filter((o) => {
    const matchBranch = selectedBranchId === 'all' || o.branchId === selectedBranchId || !o.branchId;
    const oDate = new Date(o.date);
    return (
      matchBranch &&
      oDate.getMonth() + 1 === selMonthNum &&
      oDate.getFullYear() === selYear
    );
  });

  const filteredExpenses = expenses.filter((e) => {
    const matchBranch = selectedBranchId === 'all' || e.branchId === selectedBranchId || e.branchId === 'all';
    const eDate = new Date(e.date);
    return (
      matchBranch &&
      eDate.getMonth() + 1 === selMonthNum &&
      eDate.getFullYear() === selYear
    );
  });

  const filteredDeposits = deposits.filter((d) => {
    const matchBranch = selectedBranchId === 'all' || d.branchId === selectedBranchId;
    const dDate = new Date(d.date);
    return (
      matchBranch &&
      dDate.getMonth() + 1 === selMonthNum &&
      dDate.getFullYear() === selYear
    );
  });

  // Filter students by branch and sort by roll serial: 1, 2, 3, ...
  const branchStudents = sortStudentsByRoll(
    safeStudents.filter((s) => {
      return selectedBranchId === 'all' || s.branchId === selectedBranchId;
    })
  );

  // Calculate each student's payment for this specific selected month and due months
  const studentLedger = branchStudents.map((student) => {
    const thisMonthPayment = feePayments.find(
      (f) =>
        f.studentId === student.id &&
        (f.monthYear === displayMMYYYY || (f.month === selMonthNameBn && f.year === selYear))
    );

    const paidAmount = thisMonthPayment ? thisMonthPayment.amount : 0;
    const isPaid = paidAmount > 0;

    let dueMonthsCount = 0;
    let admissionMonthYearStr = 'N/A';
    let totalElapsedMonths = 1;

    if (student.admissionDate) {
      const admDate = new Date(student.admissionDate);
      const admYear = admDate.getFullYear();
      const admMonth = admDate.getMonth() + 1;
      admissionMonthYearStr = `${admMonth < 10 ? '0' + admMonth : admMonth}-${admYear}`;

      totalElapsedMonths = (selYear - admYear) * 12 + (selMonthNum - admMonth) + 1;
      if (totalElapsedMonths < 1) totalElapsedMonths = 1;

      const allPaidRecords = feePayments.filter((f) => f.studentId === student.id);
      const paidCount = allPaidRecords.length;

      dueMonthsCount = Math.max(0, totalElapsedMonths - paidCount);
    }

    const branchObj = safeBranches.find((b) => b.id === student.branchId);

    return {
      student,
      branchName: branchObj ? branchObj.name : student.branchLocation || (isBn ? 'শাখা নেই' : 'No centre'),
      admissionMonthYearStr,
      paidAmount,
      isPaid,
      paymentRecord: thisMonthPayment,
      dueMonthsCount,
      totalElapsedMonths,
    };
  });

  // Filter students based on search and status
  const filteredStudentLedger = studentLedger.filter((item) => {
    const term = studentSearch.toLowerCase();
    const matchSearch =
      item.student.name.toLowerCase().includes(term) ||
      item.student.roll.toLowerCase().includes(term) ||
      (item.student.guardianPhone && item.student.guardianPhone.includes(term));

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && item.isPaid) ||
      (statusFilter === 'unpaid' && !item.isPaid);

    const matchGender =
      genderFilter === 'all' ||
      (genderFilter === 'boy' && item.student.gender !== 'girl') ||
      (genderFilter === 'girl' && item.student.gender === 'girl');

    return matchSearch && matchStatus && matchGender;
  });

  // Financial calculations with 50% Teacher split & Central Net
  const totalFeeAmount = filteredFees.reduce((sum, f) => sum + f.amount, 0);
  const teacherShare50 = totalFeeAmount * 0.5;
  const netFeeShare50 = totalFeeAmount * 0.5;
  const totalBookSalesAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalOtherIncome = filteredOtherIncomes.reduce((sum, o) => sum + o.amount, 0);

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDeposited = filteredDeposits.reduce((sum, d) => sum + d.amount, 0);

  const netAccountBalance = (netFeeShare50 + totalBookSalesAmount + totalOtherIncome) - totalExpense - totalDeposited;
  const grossTotalIncome = totalFeeAmount + totalBookSalesAmount + totalOtherIncome;

  const currentBranchName =
    selectedBranchId === 'all'
      ? (isBn ? 'দ্বীনিয়াত মক্তব (সব শাখা)' : 'Deeniyat Maktab (All Centres)')
      : branches.find((b) => b.id === selectedBranchId)?.name || (isBn ? 'নির্বাচিত শাখা' : 'Selected Centre');

  const handlePrint = () => {
    window.print();
  };

  const handleShareSummaryReport = () => {
    const text = `📊 দ্বীনিয়াত মক্তব সাতক্ষীরা - মাসিক আর্থিক খতিয়ান
🏢 কেন্দ্র: ${currentBranchName}
📅 মাস ও বছর: ${displayMMYYYY} (${selMonthNameBn} ${toBnNum(selYear, isBn)})
---------------------------------
💰 মোট আদায়কৃত বেতন: ${toBnCurrency(totalFeeAmount, isBn)}
👨‍🏫 শিক্ষকের ৫০% প্রাপ্য: ${toBnCurrency(teacherShare50, isBn)}
🏛️ নেট একাউন্টে ৫০% জমা: ${toBnCurrency(netFeeShare50, isBn)}
📚 বই বিক্রি আয়: ${toBnCurrency(totalBookSalesAmount, isBn)}
🎁 হাদিয়া ও অনুদান: ${toBnCurrency(totalOtherIncome, isBn)}
📈 সর্বমোট মোট আয়: ${toBnCurrency(grossTotalIncome, isBn)}
📉 মক্তবের ব্যয়: -${toBnCurrency(totalExpense, isBn)}
🏦 জমা হয়েছে: -${toBnCurrency(totalDeposited, isBn)}
---------------------------------
⚖️ কেন্দ্রীয় নিট স্থিতি: ${toBnCurrency(netAccountBalance, isBn)}
---------------------------------
পরিচালক: ${DIRECTOR_NAME} (${toBnNum(DIRECTOR_PHONE, isBn)})`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareStudentReport = () => {
    let text = `📋 দ্বীনিয়াত মক্তব সাতক্ষীরা - শিক্ষার্থী বেতন ও বকেয়া খতিয়ান
🏢 কেন্দ্র: ${currentBranchName}
📅 মাস: ${displayMMYYYY} (${selMonthNameBn} ${toBnNum(selYear, isBn)})
👥 মোট শিক্ষার্থী: ${toBnNum(studentLedger.length, isBn)} জন
✅ পরিশোধিত: ${toBnNum(studentLedger.filter(i => i.isPaid).length, isBn)} জন
❌ বকেয়া: ${toBnNum(studentLedger.filter(i => !i.isPaid).length, isBn)} জন
---------------------------------
`;
    studentLedger.forEach((item, idx) => {
      const s = item.student;
      const statusText = item.isPaid ? `জমা: ${toBnCurrency(item.paidAmount, isBn)}` : `বকেয়া (৳ ০)`;
      const dueText = item.dueMonthsCount > 0 ? `[বকেয়া: ${toBnNum(item.dueMonthsCount, isBn)} মাস]` : `[সম্পূর্ণ পরিশোধ]`;
      text += `${idx + 1}. রোল ${toBnNum(s.roll, isBn)}: ${s.name} - ${statusText} | ${dueText}\n`;
    });
    text += `---------------------------------\nপরিচালক: ${DIRECTOR_NAME} (${toBnNum(DIRECTOR_PHONE, isBn)})`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-950 via-teal-950 to-slate-900 border-b border-cyan-500/20 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <i className="fa-solid fa-file-invoice-dollar text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {isBn ? 'মাসিক পূর্ণাঙ্গ রিপোর্ট ও খতিয়ান' : 'Monthly Comprehensive Report'}
              </h3>
              <p className="text-[10px] text-cyan-300 font-mono">
                {displayMMYYYY} ({selMonthNameBn} {toBnNum(selYear, isBn)})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Month & Branch Controls */}
        <div className="p-3 bg-slate-950/90 border-b border-emerald-500/20 sticky top-[65px] z-10">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-emerald-200 block mb-0.5">{isBn ? 'শাখা নির্বাচন' : 'Select Centre'}</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-xs text-white font-bold outline-none"
              >
                <option value="all">{isBn ? 'সব শাখা (একত্রে)' : 'All Centres'}</option>
                {safeBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-emerald-200 block mb-0.5 flex justify-between">
                <span>{isBn ? 'বেতনের মাস ও বছর' : 'Month & Year'}</span>
                <span className="text-amber-300 font-mono font-bold">{displayMMYYYY}</span>
              </label>
              <input
                type="month"
                value={monthYearInput}
                onChange={(e) => setMonthYearInput(e.target.value)}
                className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-xs text-amber-300 font-bold outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 5 Distinct Tabs: শিক্ষার্থীর তালিকা, আয়, ব্যয়, জমা, খতিয়ান */}
        <div className="flex border-b border-emerald-500/20 bg-slate-950 p-1 gap-1 overflow-x-auto text-[11px] sticky top-[125px] z-10">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`py-1.5 px-2.5 rounded-xl font-bold transition flex items-center gap-1 shrink-0 ${
              activeTab === 'students'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-user-graduate text-[10px]"></i>
            <span>{isBn ? `শিক্ষার্থীর তালিকা (${toBnNum(branchStudents.length, isBn)})` : `Students (${branchStudents.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`py-1.5 px-2.5 rounded-xl font-bold transition flex items-center gap-1 shrink-0 ${
              activeTab === 'income'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-sack-dollar text-[10px]"></i>
            <span>{isBn ? `আয় (${toBnCurrency(grossTotalIncome, isBn)})` : `Income`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`py-1.5 px-2.5 rounded-xl font-bold transition flex items-center gap-1 shrink-0 ${
              activeTab === 'expense'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-receipt text-[10px]"></i>
            <span>{isBn ? `ব্যয় (${toBnCurrency(totalExpense, isBn)})` : `Expense`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deposit')}
            className={`py-1.5 px-2.5 rounded-xl font-bold transition flex items-center gap-1 shrink-0 ${
              activeTab === 'deposit'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-building-columns text-[10px]"></i>
            <span>{isBn ? `জমা (${toBnCurrency(totalDeposited, isBn)})` : `Deposit`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`py-1.5 px-2.5 rounded-xl font-bold transition flex items-center gap-1 shrink-0 ${
              activeTab === 'summary'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-chart-pie text-[10px]"></i>
            <span>{isBn ? 'সার্বিক খতিয়ান' : 'Summary'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 space-y-4">
          {/* ========================================================
              TAB 1: শিক্ষার্থীর তালিকা ও বকেয়া
              ======================================================== */}
          {activeTab === 'students' && (
            <div className="space-y-3">
              {/* Badges */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-slate-800/80 border border-emerald-500/20 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-gray-400">মোট শিক্ষার্থী</div>
                  <div className="text-xs font-black text-white mt-0.5">{toBnNum(studentLedger.length, isBn)}</div>
                </div>
                <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-emerald-300">পরিশোধিত</div>
                  <div className="text-xs font-black text-emerald-400 mt-0.5">
                    {toBnNum(studentLedger.filter((i) => i.isPaid).length, isBn)}
                  </div>
                </div>
                <div className="bg-rose-950/50 border border-rose-500/30 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-rose-300">বকেয়া</div>
                  <div className="text-xs font-black text-rose-400 mt-0.5">
                    {toBnNum(studentLedger.filter((i) => !i.isPaid).length, isBn)}
                  </div>
                </div>
                <div className="bg-amber-950/50 border border-amber-500/30 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-amber-300">মোট আদায়</div>
                  <div className="text-xs font-black text-amber-400 mt-0.5">{toBnCurrency(totalFeeAmount, isBn)}</div>
                </div>
              </div>

              {/* Search & Status & Gender Filter */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="নাম বা রোল দিয়ে খুঁজুন..."
                      className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-800 border border-emerald-500/30 rounded-xl px-2 py-1.5 text-xs text-emerald-200 outline-none"
                  >
                    <option value="all">সকল অবস্থা</option>
                    <option value="paid">শুধুমাত্র পরিশোধিত</option>
                    <option value="unpaid">শুধুমাত্র বকেয়া</option>
                  </select>
                </div>

                {/* Gender filter pills */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGenderFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      genderFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800/80 text-gray-400 hover:text-white border border-emerald-500/20'
                    }`}
                  >
                    <span>সকল</span>
                    <span className="text-[10px] opacity-80 font-mono">({toBnNum(studentLedger.length, isBn)})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('boy')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      genderFilter === 'boy'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-800/80 text-blue-300 hover:text-white border border-blue-500/20'
                    }`}
                  >
                    <span>👦 ছাত্র</span>
                    <span className="text-[10px] opacity-80 font-mono">
                      ({toBnNum(studentLedger.filter((i) => i.student.gender !== 'girl').length, isBn)})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderFilter('girl')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      genderFilter === 'girl'
                        ? 'bg-pink-600 text-white shadow'
                        : 'bg-slate-800/80 text-pink-300 hover:text-white border border-pink-500/20'
                    }`}
                  >
                    <span>👧 ছাত্রী</span>
                    <span className="text-[10px] opacity-80 font-mono">
                      ({toBnNum(studentLedger.filter((i) => i.student.gender === 'girl').length, isBn)})
                    </span>
                  </button>
                </div>
              </div>

              {/* Student Cards */}
              {filteredStudentLedger.length === 0 ? (
                <div className="p-6 bg-slate-800/40 rounded-2xl border border-dashed border-emerald-500/20 text-center">
                  <i className="fa-solid fa-user-xmark text-gray-500 text-2xl mb-1.5"></i>
                  <p className="text-xs text-gray-400">কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredStudentLedger.map((item) => {
                    const s = item.student;
                    return (
                      <div
                        key={s.id}
                        className={`p-3 rounded-2xl border transition shadow-sm ${
                          item.isPaid
                            ? 'bg-slate-800/80 border-emerald-500/30 hover:border-emerald-400'
                            : 'bg-slate-800/60 border-rose-500/30 hover:border-rose-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white">{s.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                                s.gender === 'girl'
                                  ? 'bg-pink-950/80 text-pink-300 border-pink-500/40'
                                  : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                              }`}>
                                {s.gender === 'girl' ? '👧 ছাত্রী' : '👦 ছাত্র'}
                              </span>
                              <span className="text-[10px] bg-slate-900 border border-gray-600 px-1.5 py-0.2 rounded font-bold text-amber-300">
                                রোল: {toBnNum(s.roll, isBn)}
                              </span>
                            </div>

                            <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <i className="fa-solid fa-mosque text-teal-400 text-[9px]"></i>
                              <span>{item.branchName}</span>
                              <span className="text-gray-500">•</span>
                              <span>{s.classLevel}</span>
                            </div>

                            <div className="text-[10px] text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                              <span>ভর্তির মাস: <b className="text-gray-300 font-mono">{toBnNum(item.admissionMonthYearStr, isBn)}</b></span>
                              {s.guardianPhone && <span>📞 {toBnNum(s.guardianPhone, isBn)}</span>}
                            </div>
                          </div>

                          {/* Fee Status & Actions */}
                          <div className="text-right flex flex-col items-end shrink-0">
                            {item.isPaid ? (
                              <div className="space-y-0.5">
                                <div className="text-xs font-black text-emerald-400">
                                  {toBnCurrency(item.paidAmount, isBn)}
                                </div>
                                <span className="inline-block text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.5 rounded-md font-bold">
                                  উক্ত মাসে পরিশোধিত ✓
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="text-xs font-black text-rose-400">
                                  {toBnCurrency(0, isBn)}
                                </div>
                                <span className="inline-block text-[9px] bg-rose-500/20 text-rose-300 border border-rose-400/40 px-1.5 py-0.5 rounded-md font-bold">
                                  এই মাসে বকেয়া ✗
                                </span>
                              </div>
                            )}

                            {/* Due Months */}
                            <div className="mt-1">
                              {item.dueMonthsCount > 0 ? (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-bold">
                                  {toBnNum(item.dueMonthsCount, isBn)} মাস বাকি
                                </span>
                              ) : (
                                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-md font-bold">
                                  কোনো বকেয়া নেই
                                </span>
                              )}
                            </div>

                            {/* Edit & Delete Action Buttons */}
                            <div className="flex items-center gap-1 mt-1.5">
                              {item.isPaid && item.paymentRecord && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setEditingFeePayment(item.paymentRecord!)}
                                    className="px-1.5 py-0.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded text-[9px] font-bold border border-amber-500/40 flex items-center gap-0.5"
                                    title="বেতন এন্ট্রি সংশোধন"
                                  >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                    <span>ফি এডিট</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteFeePayment?.(item.paymentRecord!.id)}
                                    className="px-1.5 py-0.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded text-[9px] font-bold border border-rose-500/40 flex items-center gap-0.5"
                                    title="বেতন এন্ট্রি মুছুন"
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                    <span>ফি মুছুন</span>
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => setEditingStudent(s)}
                                className="px-1.5 py-0.5 bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 rounded text-[9px] font-bold border border-teal-500/40 flex items-center gap-0.5"
                                title="শিক্ষার্থীর তথ্য সংশোধন"
                              >
                                <i className="fa-solid fa-user-pen"></i>
                                <span>ছাত্র এডিট</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setStudentToDelete({ id: s.id, name: s.name })}
                                className="px-1.5 py-0.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded text-[9px] font-bold border border-rose-500/40 flex items-center gap-0.5"
                                title="শিক্ষার্থী মুছে ফেলুন"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                                <span>ছাত্র মুছুন</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
                >
                  <i className="fa-solid fa-print"></i>
                  <span>তালিকা প্রিন্ট</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareStudentReport}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition shadow"
                >
                  <i className="fa-brands fa-whatsapp"></i>
                  <span>হোয়াটসঅ্যাপে পাঠান</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: মাসিক আয় (Fees, Book Sales, Hadia/Donations)
              ======================================================== */}
          {activeTab === 'income' && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-teal-900/80 to-emerald-900/80 border border-emerald-400/40 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-200 font-bold block">নির্বাচিত মাসের মোট আয়:</span>
                  <span className="text-base sm:text-lg font-black text-amber-300">{toBnCurrency(grossTotalIncome, isBn)}</span>
                </div>
                <div className="text-right text-[10px] text-gray-300 space-y-0.5">
                  <div>বেতন: {toBnCurrency(totalFeeAmount, isBn)}</div>
                  <div>বই বিক্রি: {toBnCurrency(totalBookSalesAmount, isBn)}</div>
                  {totalOtherIncome > 0 && <div>হাদিয়া/দান: {toBnCurrency(totalOtherIncome, isBn)}</div>}
                </div>
              </div>

              {/* 1. বেতন আদায় তালিকা */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-money-bill-wave text-amber-400"></i>
                    <span>আদায়কৃত বেতন তালিকা ({toBnNum(filteredFees.length, isBn)} টি)</span>
                  </h4>
                  <span className="text-xs font-black text-emerald-400">{toBnCurrency(totalFeeAmount, isBn)}</span>
                </div>

                {filteredFees.length === 0 ? (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-center text-[11px] text-gray-400">
                    এই মাসে কোনো বেতন আদায় এন্ট্রি নেই।
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
                    {filteredFees.map((fee) => (
                      <div
                        key={fee.id}
                        className="p-2.5 bg-slate-800/80 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{fee.studentName}</span>
                            <span className="text-[10px] bg-slate-900 text-amber-300 px-1 rounded border border-gray-700 font-mono">
                              রোল: {toBnNum(fee.studentRoll, isBn)}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            তারিখ: {fee.date} • মাস: {fee.month} {fee.year} {fee.collectorName && `• শিক্ষক: ${fee.collectorName}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-black text-emerald-400">{toBnCurrency(fee.amount, isBn)}</span>
                          <button
                            type="button"
                            onClick={() => setEditingFeePayment(fee)}
                            className="p-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-lg text-[10px]"
                            title="সংশোধন করুন"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteFeePayment?.(fee.id)}
                            className="p-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-lg text-[10px]"
                            title="মুছে ফেলুন"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. বই বিক্রি তালিকা */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-book-open text-blue-400"></i>
                    <span>বই বিক্রি হিসাব ({toBnNum(filteredSales.length, isBn)} টি)</span>
                  </h4>
                  <span className="text-xs font-black text-blue-400">{toBnCurrency(totalBookSalesAmount, isBn)}</span>
                </div>

                {filteredSales.length === 0 ? (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-center text-[11px] text-gray-400">
                    এই মাসে কোনো বই বিক্রি হয়নি।
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[25vh] overflow-y-auto pr-1">
                    {filteredSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="p-2.5 bg-slate-800/80 border border-blue-500/20 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{sale.bookName}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            ক্রেতা: {sale.studentName} (রোল: {toBnNum(sale.studentRoll, isBn)}) • পরিমাণ: {toBnNum(sale.quantity, isBn)}টি • তারিখ: {sale.date}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-black text-blue-300">{toBnCurrency(sale.totalAmount, isBn)}</span>
                          <button
                            type="button"
                            onClick={() => onDeleteBookSale?.(sale.id)}
                            className="p-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-lg text-[10px]"
                            title="মুছে ফেলুন"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. হাদিয়া ও অনুদান তালিকা */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-hand-holding-heart text-amber-400"></i>
                    <span>হাদিয়া, দান ও অনুদান ({toBnNum(filteredOtherIncomes.length, isBn)} টি)</span>
                  </h4>
                  <span className="text-xs font-black text-amber-400">{toBnCurrency(totalOtherIncome, isBn)}</span>
                </div>

                {filteredOtherIncomes.length === 0 ? (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-center text-[11px] text-gray-400">
                    এই মাসে কোনো অতিরিক্ত হাদিয়া বা দান এন্ট্রি নেই।
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[25vh] overflow-y-auto pr-1">
                    {filteredOtherIncomes.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-2.5 bg-slate-800/80 border border-amber-500/20 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{inc.title}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            খাত: {inc.category} • তারিখ: {inc.date} {(inc.donorName || inc.source) ? `• দাতা: ${inc.donorName || inc.source}` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-black text-amber-300">{toBnCurrency(inc.amount, isBn)}</span>
                          <button
                            type="button"
                            onClick={() => setEditingOtherIncome(inc)}
                            className="p-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-lg text-[10px]"
                            title="সংশোধন করুন"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteOtherIncome?.(inc.id)}
                            className="p-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-lg text-[10px]"
                            title="মুছে ফেলুন"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: মাসিক ব্যয় (Expenses with Edit & Delete)
              ======================================================== */}
          {activeTab === 'expense' && (
            <div className="space-y-4">
              {/* Expense Summary Header */}
              <div className="bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-500/40 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-rose-200 font-bold block">নির্বাচিত মাসের মোট ব্যয়:</span>
                  <span className="text-base sm:text-lg font-black text-rose-400">{toBnCurrency(totalExpense, isBn)}</span>
                </div>
                <div className="text-right text-[10px] text-gray-300">
                  মোট ভাউচার সংখ্যা: <b className="text-white font-mono">{toBnNum(filteredExpenses.length, isBn)}</b> টি
                </div>
              </div>

              {/* Expense List */}
              {filteredExpenses.length === 0 ? (
                <div className="p-8 bg-slate-800/40 rounded-2xl border border-dashed border-rose-500/20 text-center space-y-2">
                  <i className="fa-solid fa-file-circle-minus text-gray-500 text-3xl"></i>
                  <p className="text-xs text-gray-400">এই মাসে কোনো খরচের এন্ট্রি পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-rose-500/30 rounded-2xl flex items-start justify-between gap-2 shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{exp.description || exp.category}</span>
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-400/30 px-1.5 py-0.2 rounded font-bold">
                            {exp.category}
                          </span>
                        </div>

                        <div className="text-[10px] text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                          <span>📅 {exp.date}</span>
                          {exp.branchId && (
                            <span>
                              🏢 {branches.find(b => b.id === exp.branchId)?.name || 'সকল কেন্দ্র'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        <span className="text-xs font-black text-rose-400">-{toBnCurrency(exp.amount, isBn)}</span>

                        {/* Action buttons: Edit & Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingExpense(exp)}
                            className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 transition"
                            title="খরচ সংশোধন করুন"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                            <span>এডিট</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense?.(exp.id)}
                            className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-500/40 flex items-center gap-1 transition"
                            title="খরচ মুছে ফেলুন"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                            <span>মুছুন</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 4: মাসিক জমা (Deposits with Edit & Delete)
              ======================================================== */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              {/* Deposit Summary Header */}
              <div className="bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/40 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-indigo-200 font-bold block">নির্বাচিত মাসে মোট জমা:</span>
                  <span className="text-base sm:text-lg font-black text-indigo-400">{toBnCurrency(totalDeposited, isBn)}</span>
                </div>
                <div className="text-right text-[10px] text-gray-300">
                  মোট জমা রেকর্ড: <b className="text-white font-mono">{toBnNum(filteredDeposits.length, isBn)}</b> টি
                </div>
              </div>

              {/* Deposit List */}
              {filteredDeposits.length === 0 ? (
                <div className="p-8 bg-slate-800/40 rounded-2xl border border-dashed border-indigo-500/20 text-center space-y-2">
                  <i className="fa-solid fa-building-columns text-gray-500 text-3xl"></i>
                  <p className="text-xs text-gray-400">এই মাসে কোনো জমার এন্ট্রি পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredDeposits.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-indigo-500/30 rounded-2xl flex items-start justify-between gap-2 shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">প্রাপক: {dep.recipient}</span>
                        </div>

                        <div className="text-[10px] text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                          <span>📅 {dep.date}</span>
                          {dep.depositedBy && <span>👤 জমাকারী: {dep.depositedBy}</span>}
                          {dep.branchId && (
                            <span>🏢 {branches.find(b => b.id === dep.branchId)?.name || ''}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        <span className="text-xs font-black text-indigo-400">-{toBnCurrency(dep.amount, isBn)}</span>

                        {/* Action buttons: Edit & Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingDeposit(dep)}
                            className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 transition"
                            title="জমা সংশোধন করুন"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                            <span>এডিট</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDeposit?.(dep.id)}
                            className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-lg text-[10px] font-bold border border-rose-500/40 flex items-center gap-1 transition"
                            title="জমা মুছে ফেলুন"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                            <span>মুছুন</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 5: সার্বিক খতিয়ান ও স্থিতি (Financial Statement)
              ======================================================== */}
          {activeTab === 'summary' && (
            <div className="space-y-3">
              {/* Printable Statement Card */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 shadow-xl space-y-3 print:bg-white print:text-black">
                <div className="text-center border-b border-emerald-500/20 pb-2.5">
                  <h2 className="text-sm font-black text-emerald-300">{t.appTitle}</h2>
                  <p className="text-xs font-bold text-white mt-0.5">{currentBranchName}</p>
                  <p className="text-[11px] text-amber-300 mt-0.5 font-bold font-mono">
                    হিসাব বিবরণী মাস: {displayMMYYYY} ({selMonthNameBn} {toBnNum(selYear, isBn)})
                  </p>
                </div>

                {/* Rows */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-money-bill-wave text-amber-400 text-xs"></i>
                      আদায়কৃত বেতন ({toBnNum(filteredFees.length, isBn)} জন)
                    </span>
                    <span className="font-bold text-emerald-400">{toBnCurrency(totalFeeAmount, isBn)}</span>
                  </div>

                  <div className="p-2 bg-slate-900/90 rounded-xl border border-teal-500/30 space-y-1">
                    <div className="flex justify-between text-[11px] text-teal-200">
                      <span>👨‍🏫 শিক্ষকের একাউন্টে ৫০% প্রাপ্য</span>
                      <span className="font-bold text-teal-300">{toBnCurrency(teacherShare50, isBn)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-200">
                      <span>🏛️ কেন্দ্রীয় নিট একাউন্টে ৫০% জমা</span>
                      <span className="font-bold text-emerald-300">{toBnCurrency(netFeeShare50, isBn)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-book-open text-blue-400 text-xs"></i>
                      বই বিক্রি আয় (নিট ফান্ডে)
                    </span>
                    <span className="font-bold text-blue-300">{toBnCurrency(totalBookSalesAmount, isBn)}</span>
                  </div>

                  {totalOtherIncome > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-800">
                      <span className="text-gray-300 flex items-center gap-1.5">
                        <i className="fa-solid fa-hand-holding-heart text-amber-400 text-xs"></i>
                        হাদিয়া ও অনুদান
                      </span>
                      <span className="font-bold text-amber-300">{toBnCurrency(totalOtherIncome, isBn)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1 border-b border-slate-800 bg-emerald-950/40 px-2 rounded-lg font-bold">
                    <span className="text-emerald-200">সর্বমোট অর্জিত আয়</span>
                    <span className="text-emerald-300">{toBnCurrency(grossTotalIncome, isBn)}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-receipt text-rose-400 text-xs"></i>
                      মক্তবের মোট ব্যয় (নিট থেকে কর্তন)
                    </span>
                    <span className="font-bold text-rose-400">-{toBnCurrency(totalExpense, isBn)}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-building-columns text-indigo-400 text-xs"></i>
                      জমা টাকা (নিট থেকে কর্তন)
                    </span>
                    <span className="font-bold text-indigo-300">-{toBnCurrency(totalDeposited, isBn)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-gradient-to-r from-emerald-900 to-teal-900 border border-emerald-400/40 mt-3">
                    <span className="font-black text-amber-200 text-xs">কেন্দ্রীয় নিট একাউন্ট স্থিতি</span>
                    <span className="font-black text-sm text-amber-300">{toBnCurrency(netAccountBalance, isBn)}</span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-3 border-t border-slate-800 text-[10px] text-gray-400 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-200">{t.directorLabel} {DIRECTOR_NAME}</p>
                    <p>{t.mobileLabel} {toBnNum(DIRECTOR_PHONE, isBn)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-300">{t.developerLabel} {DEVELOPER_NAME}</p>
                    <p>{t.mobileLabel} {toBnNum(DEVELOPER_PHONE, isBn)}</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
                >
                  <i className="fa-solid fa-print"></i>
                  <span>A4 সাইজে প্রিন্ট</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareSummaryReport}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition shadow"
                >
                  <i className="fa-brands fa-whatsapp"></i>
                  <span>হোয়াটসঅ্যাপে পাঠান</span>
                </button>
              </div>
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

      {/* ========================================================
          EDIT MODAL: Fee Payment
          ======================================================== */}
      {editingFeePayment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-sm p-4 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-xs text-amber-300">বেতন এন্ট্রি সংশোধন</h4>
              <button onClick={() => setEditingFeePayment(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">শিক্ষার্থীর নাম</label>
              <input
                type="text"
                value={editingFeePayment.studentName}
                onChange={(e) => setEditingFeePayment({ ...editingFeePayment, studentName: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">রোল নম্বর</label>
                <input
                  type="text"
                  value={editingFeePayment.studentRoll}
                  onChange={(e) => setEditingFeePayment({ ...editingFeePayment, studentRoll: e.target.value })}
                  className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={editingFeePayment.amount}
                  onChange={(e) => setEditingFeePayment({ ...editingFeePayment, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">তারিখ</label>
              <input
                type="date"
                value={editingFeePayment.date}
                onChange={(e) => setEditingFeePayment({ ...editingFeePayment, date: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingFeePayment(null)}
                className="flex-1 py-2 bg-slate-800 rounded-xl text-xs font-bold text-gray-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveFeePayment?.(editingFeePayment);
                  setEditingFeePayment(null);
                }}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-bold text-white"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MODAL: Expense
          ======================================================== */}
      {editingExpense && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-sm p-4 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-xs text-rose-300">ব্যয় এন্ট্রি সংশোধন</h4>
              <button onClick={() => setEditingExpense(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">খরচের বিবরণ</label>
              <input
                type="text"
                value={editingExpense.description}
                onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">খরচের খাত</label>
                <input
                  type="text"
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-rose-400 font-bold"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">তারিখ</label>
              <input
                type="date"
                value={editingExpense.date}
                onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="flex-1 py-2 bg-slate-800 rounded-xl text-xs font-bold text-gray-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveExpense?.(editingExpense);
                  setEditingExpense(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MODAL: Deposit
          ======================================================== */}
      {editingDeposit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-sm p-4 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-xs text-indigo-300">জমা এন্ট্রি সংশোধন</h4>
              <button onClick={() => setEditingDeposit(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">প্রাপকের নাম</label>
              <input
                type="text"
                value={editingDeposit.recipient}
                onChange={(e) => setEditingDeposit({ ...editingDeposit, recipient: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">টাকার পরিমাণ (৳)</label>
              <input
                type="number"
                value={editingDeposit.amount}
                onChange={(e) => setEditingDeposit({ ...editingDeposit, amount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-indigo-300 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">তারিখ</label>
              <input
                type="date"
                value={editingDeposit.date}
                onChange={(e) => setEditingDeposit({ ...editingDeposit, date: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingDeposit(null)}
                className="flex-1 py-2 bg-slate-800 rounded-xl text-xs font-bold text-gray-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveDeposit?.(editingDeposit);
                  setEditingDeposit(null);
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MODAL: Other Income
          ======================================================== */}
      {editingOtherIncome && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-sm p-4 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-xs text-amber-300">আয় এন্ট্রি সংশোধন</h4>
              <button onClick={() => setEditingOtherIncome(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">আয়ের বিবরণ</label>
              <input
                type="text"
                value={editingOtherIncome.title}
                onChange={(e) => setEditingOtherIncome({ ...editingOtherIncome, title: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">টাকার পরিমাণ (৳)</label>
              <input
                type="number"
                value={editingOtherIncome.amount}
                onChange={(e) => setEditingOtherIncome({ ...editingOtherIncome, amount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">তারিখ</label>
              <input
                type="date"
                value={editingOtherIncome.date}
                onChange={(e) => setEditingOtherIncome({ ...editingOtherIncome, date: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingOtherIncome(null)}
                className="flex-1 py-2 bg-slate-800 rounded-xl text-xs font-bold text-gray-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddOtherIncome?.(editingOtherIncome);
                  setEditingOtherIncome(null);
                }}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-bold text-white"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MODAL: Student Details
          ======================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80">
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl w-full max-w-sm p-4 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-xs text-teal-300">শিক্ষার্থী তথ্য সংশোধন</h4>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">নাম</label>
              <input
                type="text"
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">রোল</label>
                <input
                  type="text"
                  value={editingStudent.roll}
                  onChange={(e) => setEditingStudent({ ...editingStudent, roll: e.target.value })}
                  className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">মোবাইল</label>
                <input
                  type="text"
                  value={editingStudent.guardianPhone || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, guardianPhone: e.target.value })}
                  className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
            {/* জেন্ডার নির্বাচন */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">শিক্ষার্থীর ধরণ (জেন্ডার)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent({ ...editingStudent, gender: 'boy' })}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    editingStudent.gender !== 'girl'
                      ? 'bg-blue-600/30 border-blue-400 text-blue-300 shadow'
                      : 'bg-slate-800 border-gray-700 text-gray-400'
                  }`}
                >
                  <i className="fa-solid fa-child text-xs"></i>
                  <span>👦 ছাত্র</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent({ ...editingStudent, gender: 'girl' })}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    editingStudent.gender === 'girl'
                      ? 'bg-pink-600/30 border-pink-400 text-pink-300 shadow'
                      : 'bg-slate-800 border-gray-700 text-gray-400'
                  }`}
                >
                  <i className="fa-solid fa-child-dress text-xs"></i>
                  <span>👧 ছাত্রী</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">ভর্তির তারিখ</label>
              <input
                type="date"
                value={editingStudent.admissionDate}
                onChange={(e) => setEditingStudent({ ...editingStudent, admissionDate: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            {editStudentError && (
              <div className="bg-rose-950/90 border border-rose-500 text-rose-200 text-[11px] p-2 rounded-xl flex items-center gap-1.5 shadow">
                <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
                <span>{editStudentError}</span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setEditStudentError('');
                }}
                className="flex-1 py-2 bg-slate-800 rounded-xl text-xs font-bold text-gray-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  const cleanRoll = editingStudent.roll.trim().toLowerCase();
                  const targetGender = editingStudent.gender === 'girl' ? 'girl' : 'boy';
                  const duplicate = safeStudents.find(
                    (s) =>
                      s.id !== editingStudent.id &&
                      s.branchId === editingStudent.branchId &&
                      (s.gender === 'girl' ? 'girl' : 'boy') === targetGender &&
                      s.roll.trim().toLowerCase() === cleanRoll
                  );
                  if (duplicate) {
                    setEditStudentError(
                      `এই কেন্দ্রে ${targetGender === 'girl' ? 'ছাত্রী' : 'ছাত্র'} শাখায় রোল "${editingStudent.roll}" ইতোমধ্যেই "${duplicate.name}" এর জন্য ব্যবহৃত হয়েছে!`
                    );
                    return;
                  }
                  setEditStudentError('');
                  onSaveStudent?.(editingStudent);
                  setEditingStudent(null);
                }}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-bold text-white"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Student Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-600/20 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 text-2xl shadow-lg">
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <div>
              <h4 className="text-base font-black text-white">শিক্ষার্থী ডিলিট নিশ্চিতকরণ</h4>
              <p className="text-xs text-gray-200 mt-1 leading-relaxed">
                আপনি কি নিশ্চিত যে শিক্ষার্থী <b className="text-amber-300">"{studentToDelete.name}"</b> এর সমস্ত তথ্য মুছে ফেলতে চান?
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteStudent?.(studentToDelete.id);
                  setStudentToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg active:scale-95"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
