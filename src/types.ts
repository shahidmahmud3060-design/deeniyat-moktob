export type TimeSlot = 'সকাল' | 'বিকাল';

export interface Branch {
  id: string;
  name: string; // কেন্দ্রের নাম (বাংলা)
  location: string; // কেন্দ্রের স্থান / ঠিকানা
  timeSlot: TimeSlot; // পড়ার সময় (শুধুমাত্র সকাল ও বিকাল)
  teacherName: string; // নিযুক্ত ওস্তাদ
  teacherPhone: string; // মোবাইল
  monthlyFee?: number; // ডিফল্ট বা কাস্টম ফি
  createdAt: string;
}

export type Gender = 'boy' | 'girl'; // ছেলে বা মেয়ে

export interface Student {
  id: string;
  name: string; // শিক্ষার্থীর নাম
  roll: string; // রোল
  gender?: Gender; // ছেলে বা মেয়ে (আলাদা রোল নাম্বার)
  classLevel: string; // শ্রেণী
  branchId: string; // কেন্দ্র আইডি
  branchLocation: string; // কেন্দ্রের ঠিকানা (অটোমেটিক)
  guardianPhone: string; // অভিভাবকের মোবাইল
  admissionDate: string; // ভর্তি তারিখ (YYYY-MM-DD)
  status: 'active' | 'inactive';
}

export interface Book {
  id: string;
  name: string; // বইয়ের নাম
  stock: number; // স্টক পরিমাণ
  buyPrice: number; // ক্রয় মূল্য
  sellPrice: number; // বিক্রয় মূল্য
  classLevel?: string;
}

export interface BookSale {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentGender?: Gender;
  bookId: string;
  bookName: string;
  quantity: number;
  unitPrice: number;
  discount: number; // ছাড়
  totalAmount: number; // (unitPrice * quantity) - discount
  branchId: string;
}

export interface FeePayment {
  id: string;
  date: string;
  month: string; // যেমন: "মার্চ"
  year: number; // যেমন: 2026
  monthYear: string; // যেমন: "03-2026"
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentGender?: Gender;
  branchId: string;
  amount: number;
  collectorName: string;
  receiptNo?: string;
  note?: string;
}

export interface Expense {
  id: string;
  date: string;
  branchId: string; // 'all' or specific branchId
  category: string; // মক্তব খরচ, শিক্ষক হাদিয়া/ভাতা, নাস্তা/আপ্যায়ন, ইত্যাদি
  amount: number;
  description: string;
}

export interface Deposit {
  id: string;
  date: string;
  branchId: string;
  recipient: string; // শিক্ষক অথবা পরিচালক হাফেজ মাওঃ আব্দুর রহমান
  amount: number;
  depositedBy: string; // অটোমেটিক কেন্দ্রের শিক্ষকের নাম
  note?: string;
}

export interface OtherIncome {
  id: string;
  date: string;
  category: string; // হাদিয়া, দান, এককালীন অনুদান, ইত্যাদি
  title: string;
  amount: number;
  donorName?: string;
  source?: string;
  branchId?: string;
}

export interface TeacherWithdrawal {
  id: string;
  teacherName: string;
  branchId: string;
  date: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface DailyAttendanceRecord {
  id: string;
  branchId: string;
  branchName: string;
  branchLocation: string;
  date: string;
  dayName: string;
  timeSlot: TimeSlot;
  boysCount: number;
  girlsCount: number;
  totalCount: number;
  newAdmission: string; // "নেই" অথবা সংখ্যা
  teacherName: string;
  createdAt: string;
}

export interface UserAccount {
  identifier: string; // Mobile or Email
  password?: string;
  name?: string;
  isLoggedIn: boolean;
  lastSyncedAt?: string;
}

export interface MaktabDataStore {
  branches: Branch[];
  students: Student[];
  books: Book[];
  bookSales: BookSale[];
  feePayments: FeePayment[];
  expenses: Expense[];
  deposits: Deposit[];
  otherIncomes: OtherIncome[];
  teacherWithdrawals: TeacherWithdrawal[];
  attendanceRecords: DailyAttendanceRecord[];
  account?: UserAccount;
}
