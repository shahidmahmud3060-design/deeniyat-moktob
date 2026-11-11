import React, { useState, useEffect, useMemo } from 'react';
import {
  MaktabDataStore,
  Branch,
  Student,
  Book,
  BookSale,
  FeePayment,
  Expense,
  Deposit,
  OtherIncome,
  TeacherWithdrawal,
  DailyAttendanceRecord,
  UserAccount,
} from './types';
import {
  getInitialData,
  saveToStorage,
  syncWithCloudServer,
  fetchFromServer,
  normalizeMaktabData,
  mergeMaktabStores,
  toBnNum,
  toBnCurrency,
  BENGALI_MONTHS,
  BENGALI_DAYS,
  DIRECTOR_NAME,
  DIRECTOR_PHONE,
  DEVELOPER_NAME,
  DEVELOPER_PHONE,
  formatMonthYearString,
  clearAllDataStore,
} from './utils/storage';
import { translations, Language, ENGLISH_MONTHS, ENGLISH_DAYS } from './utils/translations';

// Modals
import { BranchModal } from './components/BranchModal';
import { StudentModal } from './components/StudentModal';
import { AttendanceModal } from './components/AttendanceModal';
import { BookModal } from './components/BookModal';
import { DepositModal } from './components/DepositModal';
import { ExpenseModal } from './components/ExpenseModal';
import { IncomeModal } from './components/IncomeModal';
import { FeeCollectionModal } from './components/FeeCollectionModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { AccountBackupModal } from './components/AccountBackupModal';
import { TeacherListModal } from './components/TeacherListModal';

export default function App() {
  // Application Data State
  const [data, setData] = useState<MaktabDataStore>(() => getInitialData());

  // UI States - Requirement 1: Full bilingual English & Bengali support
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('bn');
  const isBn = language === 'bn';
  const t = translations[language];

  // Clock state - Requirement 2: English AM/PM beside clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Requirement 5 & 6: Toggle behavior for stat cards (Income & Expense)
  const [card3Mode, setCard3Mode] = useState<'expense' | 'income'>('expense');
  const [card6Mode, setCard6Mode] = useState<'income' | 'expense'>('income');
  // Controls whether Income/Expense modal is opened in view-only mode (no add forms)
  const [incomeExpenseViewOnly, setIncomeExpenseViewOnly] = useState<boolean>(false);

  // Default month and year for modals
  const now = new Date();
  const currentMonthFilterMMYYYY = formatMonthYearString(now.getMonth() + 1, now.getFullYear());

  // Modal Open States
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState<'add_only' | 'list_only' | 'both'>('both');
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  // Real-time Clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme Sync
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDarkMode]);

  // Initial fetch from backend with SAFE intelligent merge
  useEffect(() => {
    async function loadBackendData() {
      try {
        const serverData = await fetchFromServer();
        const currentLocal = getInitialData();
        if (serverData) {
          const normalizedServer = normalizeMaktabData(serverData);
          // Intelligent union merge: Never allow empty/partial server payload to wipe local entries
          const merged = mergeMaktabStores(currentLocal, normalizedServer);
          setData(merged);
          saveToStorage(merged);
          // Push merged data to server to keep cloud storage synchronized
          syncWithCloudServer(merged);
        } else {
          // If server is unreachable, local storage remains authoritative
          setData(currentLocal);
          saveToStorage(currentLocal);
        }
      } catch (err) {
        console.warn('Backend load error, using local storage:', err);
      }
    }
    loadBackendData();
  }, []);

  // Sync to storage & backend on state change
  const updateData = (newData: MaktabDataStore) => {
    const normalized = normalizeMaktabData(newData);
    setData(normalized);
    saveToStorage(normalized);
    syncWithCloudServer(normalized);
  };

  // Branch CRUD Handlers
  const handleSaveBranch = (branch: Branch) => {
    const exists = data.branches.some((b) => b.id === branch.id);
    const updatedBranches = exists
      ? data.branches.map((b) => (b.id === branch.id ? branch : b))
      : [...data.branches, branch];

    const updatedData: MaktabDataStore = { ...data, branches: updatedBranches };
    updateData(updatedData);

    if (data.branches.length === 0) {
      setSelectedBranchId(branch.id);
    }
  };

  const handleDeleteBranch = (branchId: string) => {
    const updatedBranches = data.branches.filter((b) => b.id !== branchId);
    const updatedData: MaktabDataStore = { ...data, branches: updatedBranches };
    updateData(updatedData);
    if (selectedBranchId === branchId) {
      setSelectedBranchId('all');
    }
  };

  // Student CRUD Handlers
  const handleSaveStudent = (student: Student) => {
    // Requirement: শিক্ষার্থীদের এক রোল দ্বিতীয়বার এন্ট্রি হবে না
    const isDuplicate = data.students.some(
      (s) => s.id !== student.id && s.roll.trim().toLowerCase() === student.roll.trim().toLowerCase()
    );
    if (isDuplicate) {
      return;
    }

    const exists = data.students.some((s) => s.id === student.id);
    const updatedStudents = exists
      ? data.students.map((s) => (s.id === student.id ? student : s))
      : [...data.students, student];

    updateData({ ...data, students: updatedStudents });
  };

  const handleDeleteStudent = (studentId: string) => {
    const updatedStudents = data.students.filter((s) => s.id !== studentId);
    updateData({ ...data, students: updatedStudents });
  };

  // Book Handlers
  const handleSaveBook = (book: Book) => {
    const exists = data.books.some((b) => b.id === book.id);
    const updatedBooks = exists
      ? data.books.map((b) => (b.id === book.id ? book : b))
      : [...data.books, book];
    updateData({ ...data, books: updatedBooks });
  };

  const handleDeleteBook = (bookId: string) => {
    const updatedBooks = data.books.filter((b) => b.id !== bookId);
    updateData({ ...data, books: updatedBooks });
  };

  const handleRecordSale = (sale: BookSale) => {
    updateData({ ...data, bookSales: [...data.bookSales, sale] });
  };

  // Fee, Expense, Deposit & Income Handlers with full Edit & Delete
  const handleSaveFeePayment = (payment: FeePayment) => {
    const exists = data.feePayments.some((f) => f.id === payment.id);
    const updated = exists
      ? data.feePayments.map((f) => (f.id === payment.id ? payment : f))
      : [...data.feePayments, payment];
    updateData({ ...data, feePayments: updated });
  };

  const handleDeleteFeePayment = (paymentId: string) => {
    updateData({
      ...data,
      feePayments: data.feePayments.filter((f) => f.id !== paymentId),
    });
  };

  const handleSaveExpense = (expense: Expense) => {
    const exists = data.expenses.some((e) => e.id === expense.id);
    const updated = exists
      ? data.expenses.map((e) => (e.id === expense.id ? expense : e))
      : [...data.expenses, expense];
    updateData({ ...data, expenses: updated });
  };

  const handleDeleteExpense = (expenseId: string) => {
    updateData({ ...data, expenses: data.expenses.filter((e) => e.id !== expenseId) });
  };

  const handleSaveDeposit = (deposit: Deposit) => {
    const exists = data.deposits.some((d) => d.id === deposit.id);
    const updated = exists
      ? data.deposits.map((d) => (d.id === deposit.id ? deposit : d))
      : [...data.deposits, deposit];
    updateData({ ...data, deposits: updated });
  };

  const handleDeleteDeposit = (depositId: string) => {
    updateData({ ...data, deposits: data.deposits.filter((d) => d.id !== depositId) });
  };

  const handleAddOtherIncome = (inc: OtherIncome) => {
    const exists = (data.otherIncomes || []).some((o) => o.id === inc.id);
    const updated = exists
      ? (data.otherIncomes || []).map((o) => (o.id === inc.id ? inc : o))
      : [...(data.otherIncomes || []), inc];
    updateData({ ...data, otherIncomes: updated });
  };

  const handleDeleteOtherIncome = (id: string) => {
    updateData({
      ...data,
      otherIncomes: (data.otherIncomes || []).filter((o) => o.id !== id),
    });
  };

  const handleDeleteBookSale = (saleId: string) => {
    updateData({
      ...data,
      bookSales: (data.bookSales || []).filter((s) => s.id !== saleId),
    });
  };

  const handleSaveWithdrawal = (withdrawal: TeacherWithdrawal) => {
    updateData({
      ...data,
      teacherWithdrawals: [...(data.teacherWithdrawals || []), withdrawal],
    });
  };

  const handleDeleteWithdrawal = (id: string) => {
    updateData({
      ...data,
      teacherWithdrawals: (data.teacherWithdrawals || []).filter((w) => w.id !== id),
    });
  };

  const handleSaveAttendance = (record: DailyAttendanceRecord) => {
    updateData({ ...data, attendanceRecords: [...data.attendanceRecords, record] });
  };

  const handleUpdateAccount = (acc: UserAccount) => {
    updateData({ ...data, account: acc });
  };

  const handleRestoreFullData = (restored: MaktabDataStore) => {
    updateData(restored);
  };

  const handleResetAllData = async () => {
    const emptyState = await clearAllDataStore();
    setData(emptyState);
  };

  // Requirement 14: Teacher 50% split and Central Net formula across ALL branches
  const allBranchesTotalNet = useMemo(() => {
    const totalFees = (data.feePayments || []).reduce((sum, f) => sum + f.amount, 0);
    const netFee50 = totalFees * 0.5; // 50% stays in Net account
    const totalBookSales = (data.bookSales || []).reduce((sum, s) => sum + s.totalAmount, 0);
    const totalOther = (data.otherIncomes || []).reduce((sum, o) => sum + o.amount, 0);

    const totalExpense = (data.expenses || []).reduce((sum, e) => sum + e.amount, 0);
    const totalDeposit = (data.deposits || []).reduce((sum, d) => sum + d.amount, 0);

    return (netFee50 + totalBookSales + totalOther) - totalExpense - totalDeposit;
  }, [data]);

  // Branch Filtered Statistics (Filtered by branch or all branches)
  const stats = useMemo(() => {
    const isAll = selectedBranchId === 'all';

    // Students
    const branchStudents = isAll
      ? (data.students || [])
      : (data.students || []).filter((s) => s.branchId === selectedBranchId);

    // Fees
    const branchFees = (data.feePayments || []).filter((f) =>
      isAll || f.branchId === selectedBranchId
    );

    // Book sales
    const branchSales = (data.bookSales || []).filter((s) =>
      isAll || s.branchId === selectedBranchId
    );

    // Other Incomes
    const branchOtherIncomes = (data.otherIncomes || []).filter((o) =>
      isAll || o.branchId === selectedBranchId || !o.branchId
    );

    // Expenses
    const branchExpenses = (data.expenses || []).filter((exp) =>
      isAll || exp.branchId === selectedBranchId || exp.branchId === 'all'
    );

    // Deposits
    const branchDeposits = (data.deposits || []).filter((dep) =>
      isAll || dep.branchId === selectedBranchId
    );

    const feeSum = branchFees.reduce((sum, f) => sum + f.amount, 0);
    const feeTeacher50 = feeSum * 0.5;
    const feeNet50 = feeSum * 0.5;

    const bookSum = branchSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const otherSum = branchOtherIncomes.reduce((sum, o) => sum + o.amount, 0);
    const totalIncome = feeSum + bookSum + otherSum;

    const expenseSum = branchExpenses.reduce((sum, e) => sum + e.amount, 0);
    const depositSum = branchDeposits.reduce((sum, d) => sum + d.amount, 0);

    // Requirement 14: নিট একাউন্ট = (ফিফটি পার্সেন্ট বেতন + বই বিক্রি + অন্যান্য আয়) - খরচ - জমা
    const netMoney = (feeNet50 + bookSum + otherSum) - expenseSum - depositSum;

    return {
      studentCount: branchStudents.length,
      feeSum,
      feeTeacher50,
      feeNet50,
      expenseSum,
      bookSum,
      depositSum,
      totalIncome,
      netMoney,
    };
  }, [data, selectedBranchId]);

  // Current Branch Name
  const currentBranch = data.branches.find((b) => b.id === selectedBranchId);
  const currentBranchDisplayName =
    selectedBranchId === 'all'
      ? data.branches.length === 0
        ? t.noBranchesYetName
        : t.allBranchesName
      : currentBranch?.name || t.appTitle;

  // Requirement 2: English AM/PM beside Clock
  const dayNameFormatted = isBn
    ? BENGALI_DAYS[currentTime.getDay()]
    : ENGLISH_DAYS[currentTime.getDay()];

  const dateFormatted = isBn
    ? `${toBnNum(currentTime.getDate(), true)} ${BENGALI_MONTHS[currentTime.getMonth()]}, ${toBnNum(currentTime.getFullYear(), true)}`
    : `${currentTime.getDate()} ${ENGLISH_MONTHS[currentTime.getMonth()]}, ${currentTime.getFullYear()}`;

  const hours24 = currentTime.getHours();
  const ampmEnglish = hours24 >= 12 ? 'PM' : 'AM'; // Requirement 2: Explicitly English AM/PM
  const hours12 = hours24 % 12 || 12;
  const hh = hours12 < 10 ? `0${hours12}` : `${hours12}`;
  const mm = currentTime.getMinutes() < 10 ? `0${currentTime.getMinutes()}` : `${currentTime.getMinutes()}`;
  const ss = currentTime.getSeconds() < 10 ? `0${currentTime.getSeconds()}` : `${currentTime.getSeconds()}`;
  const timeFormatted = `${toBnNum(`${hh}:${mm}:${ss}`, isBn)} ${ampmEnglish}`;

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? 'dark bg-slate-950 text-gray-100' : 'light bg-slate-50 text-slate-900'
      } transition-colors duration-300 font-sans touch-pan-y select-none overflow-x-hidden`}
    >
      {/* Mobile Wrapper Container - Fixed width with zero horizontal swipe */}
      <div className="max-w-md mx-auto min-h-screen pb-10 relative overflow-x-hidden flex flex-col justify-between shadow-2xl">
        <div>
          {/* ========================================================
              TOP BANNER (STICKY & FROZEN AT TOP)
              ======================================================== */}
          <div className="glass-banner rounded-b-3xl px-4 py-3.5 text-white text-center sticky top-0 z-40 shadow-2xl backdrop-blur-xl">
            {/* Glowing orb accents */}
            <div className="absolute -top-10 -left-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-teal-500/20 rounded-full blur-2xl pointer-events-none"></div>

            {/* Header Row: Language & Theme */}
            <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
              <button
                type="button"
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                className="flex items-center gap-1.5 bg-black/40 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold hover:bg-emerald-900/80 transition active:scale-95 shadow cursor-pointer"
              >
                <i className="fa-solid fa-language text-xs"></i>
                <span>{t.langBtn}</span>
              </button>

              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide drop-shadow-md">
                {t.appTitle}
              </h2>

              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-1.5 bg-black/40 border border-emerald-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-bold hover:bg-emerald-900/80 transition active:scale-95 shadow cursor-pointer"
              >
                <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-300' : 'fa-moon text-blue-200'} text-xs`}></i>
                <span>{isDarkMode ? t.themeLight : t.themeDark}</span>
              </button>
            </div>

            {/* Requirement 2: Live Date & Clock with English AM/PM */}
            <div className="bg-black/40 border border-emerald-400/30 rounded-2xl py-1.5 px-3 mb-2.5 backdrop-blur-md shadow-inner">
              <p className="text-xs sm:text-sm text-emerald-100 font-bold tracking-wide flex items-center justify-center gap-2">
                <span className="flex items-center">
                  <i className="fa-regular fa-calendar-days text-amber-400 mr-1"></i>
                  <span>{t.dateLabel} </span>
                  <span className="text-amber-300 ml-1 font-bold">{dateFormatted}</span>
                </span>
                <span className="text-emerald-500">|</span>
                <span>
                  <span>{t.dayLabel} </span>
                  <span className="text-emerald-200 ml-1 font-bold">{dayNameFormatted}</span>
                </span>
              </p>
              <p className="text-xs text-amber-300 font-extrabold tracking-wider mt-0.5 flex items-center justify-center gap-1">
                <i className="fa-regular fa-clock text-amber-400 animate-pulse text-xs"></i>
                <span>{t.timeLabel} </span>
                <span className="text-sm ml-1 font-mono font-black">{timeFormatted}</span>
              </p>
            </div>

            {/* All Branches Total Net & Branch Dropdown */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-700/50">
              <div
                className="bg-black/40 border border-emerald-500/50 rounded-xl px-2.5 py-1.5 text-xs text-emerald-200 font-bold flex items-center shadow-md select-text"
                title="All Centres Net Balance"
              >
                <i className="fa-solid fa-vault text-amber-400 mr-1 text-xs"></i>
                <span className="text-[11px]">{t.allBranchesTotalMoney}</span>
                <span className="text-amber-300 ml-1.5 font-black text-xs">
                  {toBnCurrency(allBranchesTotalNet, isBn)}
                </span>
              </div>

              {/* Branch Selector */}
              <div className="relative flex-1">
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-400/50 text-emerald-100 text-xs font-bold rounded-xl px-2 py-1.5 outline-none cursor-pointer appearance-none pr-6 shadow-md text-ellipsis overflow-hidden whitespace-nowrap"
                >
                  {data.branches.length === 0 ? (
                    <option value="none">{t.noBranchOption}</option>
                  ) : (
                    <>
                      <option value="all">{t.allBranchesOption}</option>
                      {data.branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300 text-[10px] pointer-events-none"></i>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECOND SECTION: BRANCH CARD & QUICK ACTION BUTTONS
              ======================================================== */}
          <div className="px-3 mt-3">
            <div className="branch-card-bg rounded-2xl p-3.5 relative overflow-hidden shadow-xl text-white">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <h3 className="font-extrabold text-sm sm:text-base text-emerald-200 drop-shadow truncate">
                    {currentBranchDisplayName}
                  </h3>
                </div>

                {/* Net balance */}
                <div className="bg-black/40 border border-emerald-400/40 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-300 flex items-center gap-1 shrink-0">
                  <i className="fa-solid fa-chart-line text-[10px] text-emerald-400"></i>
                  <span>{t.netLabel} {toBnCurrency(stats.netMoney, isBn)}</span>
                </div>
              </div>

              <p className="text-[11px] text-emerald-100 mt-1 font-medium">
                {t.subHeader}
              </p>

              {/* Top 3 Quick Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {/* 1. বেতন আদায় */}
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition active:scale-95 border border-emerald-400/30 cursor-pointer"
                >
                  <i className="fa-solid fa-hand-holding-dollar text-xs text-amber-300"></i>
                  <span>{t.btnFeeCollect}</span>
                </button>

                {/* 2. শিক্ষার্থী যুক্ত করুন - Requirement 7: শুধুমাত্র শিক্ষার্থী যুক্ত করা যাবে */}
                <button
                  type="button"
                  onClick={() => {
                    setStudentModalMode('add_only');
                    setIsStudentModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition active:scale-95 border border-teal-400/30 cursor-pointer"
                >
                  <i className="fa-solid fa-user-plus text-xs text-cyan-200"></i>
                  <span>{t.btnNewStudent}</span>
                </button>

                {/* 3. মাসিক রিপোর্ট */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition active:scale-95 border border-cyan-400/30 cursor-pointer"
                >
                  <i className="fa-solid fa-file-invoice text-xs text-blue-200"></i>
                  <span>{t.btnMonthlyReport}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              STAT CARDS GRID (6 CARDS)
              Requirement 5: মক্তবের আয় অপশনে চাপ দিলে মক্তবের ব্যয় দেখা যাবে
                             আবার মক্তবের ব্যয় অপশনে চাপ দিলে মক্তবের আয় দেখা যাবে।
              Requirement 6: মোট আয় অপশনে চাপ দিলে মোট ব্যয় দেখা যাবে
                             আবার মোট ব্যয় অপশনে চাপ দিলে মোট আয় দেখা যাবে।
              ======================================================== */}
          <div className="px-3 mt-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Card 1: মোট শিক্ষার্থী (Display Only) */}
              <div
                className="glass-card rounded-2xl p-2.5 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between cursor-default"
                title={t.lblTotalStudents}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{t.lblTotalStudents}</span>
                  <i className="fa-solid fa-graduation-cap text-emerald-500 dark:text-emerald-400 text-xs"></i>
                </div>
                <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                  {toBnNum(stats.studentCount, isBn)} {t.studentsSuffix}
                </div>
                <div className="text-[9px] text-gray-500 truncate">{t.subTotalStudents}</div>
              </div>

              {/* Card 2: আদায়কৃত বেতন (Display Only) */}
              <div
                className="glass-card rounded-2xl p-2.5 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between cursor-default"
                title={t.lblCollectedFee}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{t.lblCollectedFee}</span>
                  <i className="fa-solid fa-money-bill-wave text-amber-500 dark:text-amber-400 text-xs"></i>
                </div>
                <div className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                  {toBnCurrency(stats.feeSum, isBn)}
                </div>
                <div className="text-[9px] text-gray-500 truncate">{t.subCollectedFee}</div>
              </div>

              {/* Card 3: মক্তবের ব্যয় / আয় (চাপলে শুধু আয় ও ব্যয়ের হিসাব পরিবর্তন হবে, কোনো পপআপ বা নতুন অপশন আসবে না) */}
              <button
                type="button"
                onClick={() => {
                  setCard3Mode((prev) => (prev === 'expense' ? 'income' : 'expense'));
                }}
                className={`glass-card rounded-2xl p-2.5 border ${
                  card3Mode === 'expense' ? 'border-rose-500/30 hover:border-rose-400' : 'border-teal-500/30 hover:border-teal-400'
                } relative overflow-hidden flex flex-col justify-between text-left transition active:scale-95 group shadow-sm cursor-pointer select-none`}
                title={isBn ? 'চাপলে ব্যয় ও আয় পরিবর্তন হবে' : 'Tap to toggle Expense and Income'}
              >
                <div className="flex items-center justify-between mb-1 w-full">
                  <span className={`text-[11px] font-bold ${card3Mode === 'expense' ? 'text-rose-600 dark:text-rose-300' : 'text-teal-600 dark:text-teal-300'} flex items-center gap-1`}>
                    <span>{card3Mode === 'expense' ? t.lblExpense : t.mIncome}</span>
                    <i className="fa-solid fa-repeat text-[9px]"></i>
                  </span>
                  <i className={`fa-solid ${card3Mode === 'expense' ? 'fa-receipt text-rose-500' : 'fa-sack-dollar text-teal-400'} text-xs`}></i>
                </div>
                <div className={`text-sm sm:text-base font-black ${card3Mode === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'}`}>
                  {toBnCurrency(card3Mode === 'expense' ? stats.expenseSum : stats.totalIncome, isBn)}
                </div>
                <div className="text-[9px] text-gray-400 truncate">
                  {card3Mode === 'expense'
                    ? (isBn ? 'চাপলে আয় হিসাব 🔄' : 'Tap for Income 🔄')
                    : (isBn ? 'চাপলে ব্যয় হিসাব 🔄' : 'Tap for Expense 🔄')}
                </div>
              </button>

              {/* Card 4: বই বিক্রি (Display Only) */}
              <div
                className="glass-card rounded-2xl p-2.5 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between cursor-default"
                title={t.lblBookSales}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{t.lblBookSales}</span>
                  <i className="fa-solid fa-book-open text-blue-500 dark:text-blue-400 text-xs"></i>
                </div>
                <div className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400">
                  {toBnCurrency(stats.bookSum, isBn)}
                </div>
                <div className="text-[9px] text-gray-500 truncate">{t.subBookSales}</div>
              </div>

              {/* Card 5: জমা হয়েছে (Display Only) */}
              <div
                className="glass-card rounded-2xl p-2.5 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between cursor-default"
                title={t.lblDeposited}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{t.lblDeposited}</span>
                  <i className="fa-solid fa-building-columns text-indigo-500 dark:text-indigo-400 text-xs"></i>
                </div>
                <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
                  {toBnCurrency(stats.depositSum, isBn)}
                </div>
                <div className="text-[9px] text-gray-500 truncate">{t.subDeposited}</div>
              </div>

              {/* Card 6: মোট আয় / মোট ব্যয় (চাপলে শুধু মোট আয় ও ব্যয়ের হিসাব পরিবর্তন হবে, কোনো পপআপ বা নতুন অপশন আসবে না) */}
              <button
                type="button"
                onClick={() => {
                  setCard6Mode((prev) => (prev === 'income' ? 'expense' : 'income'));
                }}
                className={`glass-card rounded-2xl p-2.5 border ${
                  card6Mode === 'income' ? 'border-teal-500/40 hover:border-teal-400' : 'border-rose-500/40 hover:border-rose-400'
                } relative overflow-hidden flex flex-col justify-between text-left transition active:scale-95 group shadow-sm cursor-pointer select-none`}
                title={isBn ? 'চাপলে মোট আয় ও মোট ব্যয় পরিবর্তন হবে' : 'Tap to toggle Total Income and Total Expense'}
              >
                <div className="flex items-center justify-between mb-1 w-full">
                  <span className={`text-[11px] font-bold ${card6Mode === 'income' ? 'text-teal-600 dark:text-teal-300' : 'text-rose-600 dark:text-rose-300'} flex items-center gap-1`}>
                    <span>{card6Mode === 'income' ? t.lblTotalIncome : t.lblExpense}</span>
                    <i className="fa-solid fa-repeat text-[9px]"></i>
                  </span>
                  <i className={`fa-solid ${card6Mode === 'income' ? 'fa-chart-line text-teal-400' : 'fa-receipt text-rose-400'} text-xs`}></i>
                </div>
                <div className={`text-sm sm:text-base font-black ${card6Mode === 'income' ? 'text-teal-700 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {toBnCurrency(card6Mode === 'income' ? stats.totalIncome : stats.expenseSum, isBn)}
                </div>
                <div className="text-[9px] text-gray-400 truncate">
                  {card6Mode === 'income'
                    ? (isBn ? 'চাপলে মোট ব্যয় হিসাব 🔄' : 'Tap for Total Expense 🔄')
                    : (isBn ? 'চাপলে মোট আয় হিসাব 🔄' : 'Tap for Total Income 🔄')}
                </div>
              </button>
            </div>
          </div>

          {/* ========================================================
              MAIN MENU (6 CARDS)
              Requirement 7: নিচে শিক্ষার্থী অপশনে শুধুমাত্র শিক্ষার্থীদের তালিকা দেখা যাবে
              Requirement 12: শাখা যোগ মুছে "কেন্দ্র পরিচালনা"
              ======================================================== */}
          <div className="px-3 mt-4">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-grid-2 text-amber-500 dark:text-amber-400"></i>
              <span>{t.mainMenuTitle}</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Menu 1: শিক্ষার্থী (Requirement 7: শুধুমাত্র শিক্ষার্থীদের তালিকা দেখা যাবে) */}
              <button
                type="button"
                onClick={() => {
                  setStudentModalMode('list_only');
                  setIsStudentModalOpen(true);
                }}
                className="bg-gradient-to-br from-emerald-900/80 via-teal-950/80 to-slate-900/90 border border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-1.5 shadow-md group-hover:rotate-6 transition">
                  <i className="fa-solid fa-users text-base"></i>
                </div>
                <span className="text-xs font-extrabold text-emerald-100">{t.mStudents}</span>
              </button>

              {/* Menu 2: আয় (হাদিয়া, দান ইত্যাদি) */}
              <button
                type="button"
                onClick={() => {
                  setIncomeExpenseViewOnly(false);
                  setIsIncomeModalOpen(true);
                }}
                className="bg-gradient-to-br from-amber-950/80 via-emerald-950/80 to-slate-900/90 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-white flex items-center justify-center mb-1.5 shadow-md group-hover:rotate-6 transition">
                  <i className="fa-solid fa-sack-dollar text-base"></i>
                </div>
                <span className="text-xs font-extrabold text-amber-100">{t.mIncome}</span>
              </button>

              {/* Menu 3: ব্যয় */}
              <button
                type="button"
                onClick={() => {
                  setIncomeExpenseViewOnly(false);
                  setIsExpenseModalOpen(true);
                }}
                className="bg-gradient-to-br from-rose-950/80 via-emerald-950/80 to-slate-900/90 border border-rose-500/30 hover:border-rose-400 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center mb-1.5 shadow-md group-hover:rotate-6 transition">
                  <i className="fa-solid fa-file-circle-minus text-base"></i>
                </div>
                <span className="text-xs font-extrabold text-rose-100">{t.mExpense}</span>
              </button>

              {/* Menu 4: জমা */}
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(true)}
                className="bg-gradient-to-br from-indigo-950/80 via-teal-950/80 to-slate-900/90 border border-indigo-500/30 hover:border-indigo-400 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center mb-1.5 shadow-md group-hover:rotate-6 transition">
                  <i className="fa-solid fa-wallet text-base"></i>
                </div>
                <span className="text-xs font-extrabold text-indigo-100">{t.mDeposit}</span>
              </button>

              {/* Menu 5: বই কেনা / বিক্রি */}
              <button
                type="button"
                onClick={() => setIsBookModalOpen(true)}
                className="bg-gradient-to-br from-blue-950/80 via-teal-950/80 to-slate-900/90 border border-blue-500/30 hover:border-blue-400 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center mb-1.5 shadow-md group-hover:rotate-6 transition">
                  <i className="fa-solid fa-cart-shopping text-base"></i>
                </div>
                <span className="text-xs font-extrabold text-blue-100">{t.mBooks}</span>
              </button>

              {/* Menu 6: কেন্দ্র পরিচালনা - Requirement 12: "শাখা যোগ মুছে কেন্দ্র পরিচালনা" */}
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(true)}
                className="bg-gradient-to-br from-teal-950/80 via-emerald-950/80 to-slate-900/90 border border-teal-500/30 hover:border-teal-400 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-md group-hover:rotate-6 transition">
                  <i className="fa-solid fa-mosque text-base"></i>
                </div>
                <span className="text-xs font-extrabold text-teal-100">{t.mBranchManage}</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              BOTTOM COMPACT SINGLE ROW (3 OPTIONS)
              ======================================================== */}
          <div className="px-3 mt-3 mb-4">
            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: শিক্ষক তালিকা ও ৫০% একাউন্ট */}
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(true)}
                className="bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 rounded-2xl py-2 px-1 flex items-center justify-center gap-1.5 text-emerald-200 text-xs font-bold shadow transition active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-chalkboard-user text-xs text-amber-400"></i>
                <span className="truncate">{t.btnTeacherList}</span>
              </button>

              {/* Option 2: দৈনিক উপস্থিতি */}
              <button
                type="button"
                onClick={() => setIsAttendanceModalOpen(true)}
                className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 border border-emerald-400/50 rounded-2xl py-2 px-1 flex items-center justify-center gap-1.5 text-white text-xs font-black shadow-lg transition active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-calendar-check text-xs text-amber-300"></i>
                <span className="truncate">{t.btnDailyAttendance}</span>
              </button>

              {/* Option 3: একাউন্ট ও আইডি-পাসওয়ার্ড */}
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                className="bg-slate-900/90 hover:bg-slate-850 border-2 border-emerald-500/40 rounded-2xl py-2 px-1 flex items-center justify-center gap-1.5 text-emerald-200 text-xs font-black shadow transition active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-key text-xs text-amber-300"></i>
                <span className="truncate">
                  {data.account?.isLoggedIn && data.account.identifier
                    ? `একাউন্ট (${data.account.name || data.account.identifier})`
                    : 'আইডি ও পাসওয়ার্ড'}
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* ========================================================
            FOOTER
            Exact details:
            পরিচালক: হাফেজ মাওঃ আব্দুর রহমান | মোবাইল: ০১৭২৭-৮২৩৭৮৭
            ডেভলপার: মোঃ শাহেদ আল মাহমুদ | মোবাইল: ০১৯৯৮-২২৯৬৩০
            ======================================================== */}
        <footer className="mt-6 px-3">
          <div className="bg-slate-900/90 dark:bg-slate-900/95 border border-emerald-500/30 rounded-2xl p-3 text-center shadow-xl backdrop-blur-md">
            <div className="text-[11px] font-bold text-gray-200 leading-relaxed space-y-1">
              <div className="text-emerald-300 flex items-center justify-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-white">{t.directorLabel} {DIRECTOR_NAME}</span>
                <span className="text-emerald-500">|</span>
                <span className="text-amber-300">{t.mobileLabel} {toBnNum(DIRECTOR_PHONE, isBn)}</span>
              </div>
              <div className="text-gray-300 flex items-center justify-center gap-1.5 flex-wrap pt-0.5 border-t border-slate-800">
                <span className="font-bold text-teal-200">{t.developerLabel} {DEVELOPER_NAME}</span>
                <span className="text-teal-600">|</span>
                <span className="text-teal-300">{t.mobileLabel} {toBnNum(DEVELOPER_PHONE, isBn)}</span>
              </div>
            </div>
            <div className="text-[9px] text-gray-500 mt-1">
              {t.rightsReserved}
            </div>
          </div>
        </footer>
      </div>

      {/* ========================================================
          MODALS WITH BILINGUAL & FEATURE UPDATES
          ======================================================== */}
      {/* 1. Branch Modal (Centre Management - কেন্দ্র পরিচালনা) */}
      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        branches={data.branches}
        onSaveBranch={handleSaveBranch}
        onDeleteBranch={handleDeleteBranch}
        language={language}
      />

      {/* 2. Student Modal (Strictly separates Add Student & Student List) */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        students={data.students}
        branches={data.branches}
        mode={studentModalMode}
        onSaveStudent={handleSaveStudent}
        onDeleteStudent={handleDeleteStudent}
        language={language}
      />

      {/* 3. Attendance Modal (With A4 sheet and month navigation) */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        branches={data.branches}
        records={data.attendanceRecords}
        students={data.students}
        onSaveRecord={handleSaveAttendance}
        defaultBranchId={selectedBranchId}
        language={language}
      />

      {/* 4. Book Modal (With clean dropdown title, separate price/stock, purchase date) */}
      <BookModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        books={data.books}
        students={data.students}
        branches={data.branches}
        sales={data.bookSales}
        onSaveBook={handleSaveBook}
        onDeleteBook={handleDeleteBook}
        onRecordSale={handleRecordSale}
        language={language}
      />

      {/* 5. Deposit Modal (Auto depositor to centre teacher name) */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        deposits={data.deposits}
        branches={data.branches}
        onSaveDeposit={handleSaveDeposit}
        onDeleteDeposit={handleDeleteDeposit}
        language={language}
      />

      {/* 6. Expense Modal (With toggle to income) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenses={data.expenses}
        branches={data.branches}
        onSaveExpense={handleSaveExpense}
        onDeleteExpense={handleDeleteExpense}
        onToggleToIncome={() => {
          setIsExpenseModalOpen(false);
          setIsIncomeModalOpen(true);
        }}
        viewOnly={incomeExpenseViewOnly}
        language={language}
      />

      {/* 7. Income Modal (With Hadia/Donation categories and toggle to expense) */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        feePayments={data.feePayments}
        bookSales={data.bookSales}
        otherIncomes={data.otherIncomes || []}
        onAddOtherIncome={handleAddOtherIncome}
        onDeleteOtherIncome={handleDeleteOtherIncome}
        onToggleToExpense={() => {
          setIsIncomeModalOpen(false);
          setIsExpenseModalOpen(true);
        }}
        viewOnly={incomeExpenseViewOnly}
        language={language}
      />

      {/* 8. Fee Collection Modal (Single MM-YYYY, due months calculator, dual sync roll-name) */}
      <FeeCollectionModal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        students={data.students}
        branches={data.branches}
        feePayments={data.feePayments}
        onSavePayment={handleSaveFeePayment}
        defaultMonthYear={currentMonthFilterMMYYYY}
        language={language}
      />

      {/* 9. Monthly Report Modal (5 separate tabs: Students, Income, Expense, Deposit, Summary with full Edit/Delete) */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        data={data}
        branches={data.branches}
        defaultMonthYear={currentMonthFilterMMYYYY}
        onSaveFeePayment={handleSaveFeePayment}
        onDeleteFeePayment={handleDeleteFeePayment}
        onSaveExpense={handleSaveExpense}
        onDeleteExpense={handleDeleteExpense}
        onSaveDeposit={handleSaveDeposit}
        onDeleteDeposit={handleDeleteDeposit}
        onAddOtherIncome={handleAddOtherIncome}
        onDeleteOtherIncome={handleDeleteOtherIncome}
        onDeleteBookSale={handleDeleteBookSale}
        onSaveStudent={handleSaveStudent}
        onDeleteStudent={handleDeleteStudent}
        language={language}
      />

      {/* 10. Account & Backup Modal (Includes Cloud Sync, Source ZIP, APK Guides, File Backup & Reset) */}
      <AccountBackupModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        data={data}
        account={data.account || { identifier: '', isLoggedIn: false }}
        onUpdateAccount={handleUpdateAccount}
        onRestoreData={handleRestoreFullData}
        onResetAllData={handleResetAllData}
        language={language}
      />

      {/* 11. Teacher List Modal (Teacher 50% account, withdrawal form, balance) */}
      <TeacherListModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        branches={data.branches}
        students={data.students}
        feePayments={data.feePayments}
        withdrawals={data.teacherWithdrawals || []}
        onSaveWithdrawal={handleSaveWithdrawal}
        onDeleteWithdrawal={handleDeleteWithdrawal}
        language={language}
      />
    </div>
  );
}
