export type Language = 'bn' | 'en';

export interface Translations {
  // Banner & Header
  appTitle: string;
  dateLabel: string;
  dayLabel: string;
  timeLabel: string;
  allBranchesTotalMoney: string;
  allBranchesOption: string;
  noBranchOption: string;
  themeDark: string;
  themeLight: string;
  langBtn: string;

  // Branch Card
  allBranchesName: string;
  noBranchesYetName: string;
  netLabel: string;
  subHeader: string;
  btnFeeCollect: string;
  btnNewStudent: string;
  btnMonthlyReport: string;

  // Stat Cards
  lblTotalStudents: string;
  subTotalStudents: string;
  lblCollectedFee: string;
  subCollectedFee: string;
  lblExpense: string;
  subExpense: string;
  lblBookSales: string;
  subBookSales: string;
  lblDeposited: string;
  subDeposited: string;
  lblTotalIncome: string;
  subTotalIncome: string;
  tapToToggleExpense: string;
  tapToToggleIncome: string;
  studentsSuffix: string;

  // Main Menu
  mainMenuTitle: string;
  mStudents: string;
  mIncome: string;
  mExpense: string;
  mDeposit: string;
  mBooks: string;
  mBranchManage: string; // "কেন্দ্র পরিচালনা"

  // Bottom 3 buttons
  btnTeacherList: string;
  btnDailyAttendance: string;
  btnAccount: string;

  // Month-Year Filter Box
  filterTitle: string;
  filterCheckbox: string;
  monthLabel: string;
  yearLabel: string;
  filterActiveNotice: string;

  // Footer
  directorLabel: string;
  developerLabel: string;
  mobileLabel: string;
  rightsReserved: string;

  // Common Modal / Form Labels
  close: string;
  save: string;
  submit: string;
  cancel: string;
  edit: string;
  delete: string;
  search: string;
  select: string;
  actions: string;
  date: string;
  amount: string;
  status: string;
  all: string;
  total: string;
  remaining: string;
  withdrawn: string;
  takaSymbol: string;
}

export const translations: Record<Language, Translations> = {
  bn: {
    appTitle: 'দ্বীনিয়াত মক্তব সাতক্ষীরা',
    dateLabel: 'তারিখ:',
    dayLabel: 'বার:',
    timeLabel: 'সময়:',
    allBranchesTotalMoney: 'সব কেন্দ্রের মোট টাকা:',
    allBranchesOption: 'সব শাখা (একত্রে)',
    noBranchOption: 'কোনো কেন্দ্র যুক্ত নেই (যোগ করুন)',
    themeDark: 'ডার্ক',
    themeLight: 'লাইট',
    langBtn: 'English',

    allBranchesName: 'দ্বীনিয়াত মক্তব (সব শাখা)',
    noBranchesYetName: 'দ্বীনিয়াত মক্তব (কোনো কেন্দ্র যুক্ত নেই)',
    netLabel: 'নিট:',
    subHeader: 'চলতি সর্বমোট আপডেট হিসাব বিবরণী',
    btnFeeCollect: 'বেতন আদায়',
    btnNewStudent: 'শিক্ষার্থী যুক্ত করুন',
    btnMonthlyReport: 'মাসিক রিপোর্ট',

    lblTotalStudents: 'মোট শিক্ষার্থী',
    subTotalStudents: 'সক্রিয় অধ্যয়নরত',
    lblCollectedFee: 'আদায়কৃত বেতন',
    subCollectedFee: 'শাখাভিত্তিক আদায়',
    lblExpense: 'মক্তবের ব্যয়',
    subExpense: 'চাপলে ব্যয়/আয় দেখা যাবে',
    lblBookSales: 'বই বিক্রি',
    subBookSales: 'বই বিক্রির হিসাব',
    lblDeposited: 'জমা হয়েছে',
    subDeposited: 'শিক্ষক/পরিচালক অনুকূলে',
    lblTotalIncome: 'মোট আয়',
    subTotalIncome: 'চাপলে মোট আয়/ব্যয় দেখা যাবে',
    tapToToggleExpense: 'মক্তবের ব্যয়',
    tapToToggleIncome: 'মক্তবের আয়',
    studentsSuffix: 'জন',

    mainMenuTitle: 'প্রধান মেনু',
    mStudents: 'শিক্ষার্থী',
    mIncome: 'আয়',
    mExpense: 'ব্যয়',
    mDeposit: 'জমা',
    mBooks: 'বই ক্রয় ও বিক্রি',
    mBranchManage: 'কেন্দ্র পরিচালনা',

    btnTeacherList: 'শিক্ষক তালিকা',
    btnDailyAttendance: 'দৈনিক উপস্থিতি',
    btnAccount: 'একাউন্ট',

    filterTitle: 'বেতনের মাস ও বছর ফিল্টার',
    filterCheckbox: 'নির্দিষ্ট মাস দেখুন',
    monthLabel: 'মাস নির্বাচন (MM)',
    yearLabel: 'বছর নির্বাচন (YYYY)',
    filterActiveNotice: 'ড্যাশবোর্ডের পরিসংখ্যান এখন ফিল্টারকৃত মাস অনুযায়ী প্রদর্শিত',

    directorLabel: 'পরিচালক:',
    developerLabel: 'ডেভলপার:',
    mobileLabel: 'মোবাইল:',
    rightsReserved: 'দ্বীনিয়াত মক্তব সাতক্ষীরা • সর্বস্বত্ব সংরক্ষিত',

    close: 'বন্ধ করুন',
    save: 'সংরক্ষণ করুন',
    submit: 'সাবমিট করুন',
    cancel: 'বাতিল',
    edit: 'এডিট',
    delete: 'মুছুন',
    search: 'অনুসন্ধান...',
    select: 'নির্বাচন করুন',
    actions: 'অ্যাকশন',
    date: 'তারিখ',
    amount: 'টাকার পরিমাণ',
    status: 'অবস্থা',
    all: 'সব',
    total: 'মোট',
    remaining: 'বাকি টাকা',
    withdrawn: 'উত্তোলন',
    takaSymbol: '৳',
  },
  en: {
    appTitle: 'Deeniyat Maktab Satkhira',
    dateLabel: 'Date:',
    dayLabel: 'Day:',
    timeLabel: 'Time:',
    allBranchesTotalMoney: 'All Centres Total:',
    allBranchesOption: 'All Centres (Combined)',
    noBranchOption: 'No Centres Added (Add Centre)',
    themeDark: 'Dark',
    themeLight: 'Light',
    langBtn: 'বাংলা',

    allBranchesName: 'Deeniyat Maktab (All Centres)',
    noBranchesYetName: 'Deeniyat Maktab (No Centres Added)',
    netLabel: 'Net:',
    subHeader: 'Current Statement & Financial Overview',
    btnFeeCollect: 'Collect Fee',
    btnNewStudent: 'Add Student',
    btnMonthlyReport: 'Monthly Report',

    lblTotalStudents: 'Total Students',
    subTotalStudents: 'Active Enrolled',
    lblCollectedFee: 'Collected Fees',
    subCollectedFee: 'Centre Based Fees',
    lblExpense: 'Maktab Expenses',
    subExpense: 'Tap to view Income/Expense',
    lblBookSales: 'Book Sales',
    subBookSales: 'Book Sales Total',
    lblDeposited: 'Deposited',
    subDeposited: 'To Teacher/Director',
    lblTotalIncome: 'Total Income',
    subTotalIncome: 'Tap to view Income/Expense',
    tapToToggleExpense: 'Expenses',
    tapToToggleIncome: 'Income',
    studentsSuffix: 'Students',

    mainMenuTitle: 'Main Menu',
    mStudents: 'Students',
    mIncome: 'Income',
    mExpense: 'Expense',
    mDeposit: 'Deposit',
    mBooks: 'Books',
    mBranchManage: 'Centre Management',

    btnTeacherList: 'Teacher List',
    btnDailyAttendance: 'Daily Attendance',
    btnAccount: 'Account',

    filterTitle: 'Month & Year Filter (MM-YYYY)',
    filterCheckbox: 'Filter by specific month',
    monthLabel: 'Month (MM)',
    yearLabel: 'Year (YYYY)',
    filterActiveNotice: 'Dashboard statistics are now filtered for the selected month',

    directorLabel: 'Director:',
    developerLabel: 'Developer:',
    mobileLabel: 'Mobile:',
    rightsReserved: 'Deeniyat Maktab Satkhira • All rights reserved',

    close: 'Close',
    save: 'Save',
    submit: 'Submit',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search...',
    select: 'Select',
    actions: 'Actions',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    all: 'All',
    total: 'Total',
    remaining: 'Remaining',
    withdrawn: 'Withdrawn',
    takaSymbol: '৳',
  },
};

export const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

export const ENGLISH_DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday'
];
