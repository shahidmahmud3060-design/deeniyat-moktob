import { MaktabDataStore, Book } from '../types';

export const DIRECTOR_NAME = 'হাফেজ মাওঃ আব্দুর রহমান';
export const DIRECTOR_PHONE = '০১৭২৭-৮২৩৭৮৭';
export const DEVELOPER_NAME = 'মোঃ শাহেদ আল মাহমুদ';
export const DEVELOPER_PHONE = '০১৯৯৮-২২৯৬৩০';

export const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
  'মে', 'জুন', 'জুলাই', 'আগস্ট',
  'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const BENGALI_DAYS = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার',
  'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
];

export const INCOME_CATEGORIES = [
  'হাদিয়া',
  'দান',
  'এককালীন অনুদান',
  'মসজিদ / মাদ্রাসা অনুদান',
  'উন্নয়ন তহবিল',
  'জাকাত ও ফিতরা',
  'সাধারণ সাহায্য',
  'অন্যান্য আয়'
];

// Deeniyat standard curriculum books collected from deeniyatbd.com/books
export const DEFAULT_DEENIYAT_BOOKS: Book[] = [
  {
    id: 'book-1',
    name: 'দ্বীনিয়াত মক্তব কোর্স প্রথম বর্ষ',
    stock: 25,
    buyPrice: 85,
    sellPrice: 100, // Explicitly specified: ১০০ টাকা
    classLevel: 'মক্তব ১ম বর্ষ',
  },
  {
    id: 'book-2',
    name: 'দ্বীনিয়াত মক্তব কোর্স দ্বিতীয় বর্ষ',
    stock: 20,
    buyPrice: 105,
    sellPrice: 125,
    classLevel: 'মক্তব ২য় বর্ষ',
  },
  {
    id: 'book-3',
    name: 'দ্বীনিয়াত মক্তব কোর্স তৃতীয় বর্ষ',
    stock: 15,
    buyPrice: 130,
    sellPrice: 150,
    classLevel: 'মক্তব ৩য় বর্ষ',
  },
  {
    id: 'book-4',
    name: 'দ্বীনিয়াত নূরানী কায়দা',
    stock: 50,
    buyPrice: 40,
    sellPrice: 50,
    classLevel: 'কায়দা বিভাগ',
  },
  {
    id: 'book-5',
    name: 'আমপারা শরীফ (দ্বীনিয়াত সংস্করণ)',
    stock: 30,
    buyPrice: 50,
    sellPrice: 65,
    classLevel: 'আমপারা বিভাগ',
  },
  {
    id: 'book-6',
    name: 'কুরআনুল কারীম (দ্বীনিয়াত নাযেরা)',
    stock: 20,
    buyPrice: 260,
    sellPrice: 300,
    classLevel: 'নাযেরা বিভাগ',
  },
  {
    id: 'book-7',
    name: 'দ্বীনিয়াত দু\'আ ও মাসায়েল শিক্ষা',
    stock: 35,
    buyPrice: 40,
    sellPrice: 55,
    classLevel: 'সকল শ্রেণী',
  },
  {
    id: 'book-8',
    name: 'দ্বীনিয়াত তাজবীদ শিক্ষা',
    stock: 25,
    buyPrice: 45,
    sellPrice: 60,
    classLevel: 'সকল শ্রেণী',
  },
  {
    id: 'book-9',
    name: 'দ্বীনিয়াত আকাঈদ ও মাসায়েল',
    stock: 20,
    buyPrice: 55,
    sellPrice: 70,
    classLevel: 'সকল শ্রেণী',
  },
  {
    id: 'book-10',
    name: 'দ্বীনিয়াত সীরাতুন্নবী (সা.)',
    stock: 18,
    buyPrice: 60,
    sellPrice: 80,
    classLevel: 'সকল শ্রেণী',
  },
];

export const DEENIYAT_CLASSES = [
  'মক্তব ১ম বর্ষ',
  'মক্তব ২য় বর্ষ',
  'মক্তব ৩য় বর্ষ',
  'কায়দা বিভাগ',
  'আমপারা বিভাগ',
  'নাযেরা বিভাগ',
  'হিফজ প্রস্তুতি বিভাগ',
];

export const STORAGE_KEY = 'deeniyat_maktab_satkhira_data_v5';

// Helper to parse Bengali and English digits to an integer
export const parseRollToNumber = (rollStr: string | number): number | null => {
  if (rollStr === undefined || rollStr === null || rollStr === '') return null;
  const raw = rollStr.toString().trim();
  const normalized = raw.replace(/[০-৯]/g, (d) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(bnDigits.indexOf(d));
  });
  const parsed = parseInt(normalized, 10);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
};

// Requirement: এক নম্বর রোল আগে থাকবে একের পর থেকে ধারাবাহিক দুই তিন এইভাবে সিরিয়ালে থাকবে (ছেলে ও মেয়েদের আলাদা রোল ক্রম)
export const sortStudentsByRoll = <T extends { roll?: string | number; gender?: string }>(students: T[]): T[] => {
  if (!Array.isArray(students)) return [];
  return [...students].sort((a, b) => {
    const gA = a?.gender === 'girl' ? 1 : 0;
    const gB = b?.gender === 'girl' ? 1 : 0;
    if (gA !== gB) {
      return gA - gB;
    }

    const numA = parseRollToNumber(a?.roll ?? '');
    const numB = parseRollToNumber(b?.roll ?? '');
    if (numA !== null && numB !== null) {
      return numA - numB;
    }
    if (numA !== null) return -1;
    if (numB !== null) return 1;
    return String(a?.roll || '').localeCompare(String(b?.roll || ''));
  });
};

// Requirement: প্রত্যেকটা কেন্দ্রে ছেলে এবং মেয়েদের আলাদা করে ১ থেকে রোল তৈরি হবে
export const getNextAvailableRollNumber = (
  students: any[],
  branchId?: string,
  gender: 'boy' | 'girl' = 'boy',
  isBn = true
): string => {
  const used = new Set<number>();
  (students || []).forEach((s) => {
    const matchBranch = !branchId || branchId === 'all' || s.branchId === branchId;
    const sGender = s.gender === 'girl' ? 'girl' : 'boy';
    if (matchBranch && sGender === gender) {
      const n = parseRollToNumber(s.roll);
      if (n) used.add(n);
    }
  });

  let candidate = 1;
  while (used.has(candidate)) {
    candidate++;
  }

  const padded = candidate < 10 ? `0${candidate}` : `${candidate}`;
  return isBn ? toBnNum(padded, true) : padded;
};

export const normalizeMaktabData = (data: any): MaktabDataStore => {
  if (!data || typeof data !== 'object') {
    return {
      branches: [],
      students: [],
      books: DEFAULT_DEENIYAT_BOOKS,
      bookSales: [],
      feePayments: [],
      expenses: [],
      deposits: [],
      otherIncomes: [],
      teacherWithdrawals: [],
      attendanceRecords: [],
      account: { identifier: '', isLoggedIn: false },
    };
  }

  return {
    branches: Array.isArray(data.branches) ? data.branches : [],
    students: Array.isArray(data.students)
      ? sortStudentsByRoll(
          data.students.map((s: any) => ({
            ...s,
            gender: s.gender === 'girl' ? 'girl' : 'boy',
          }))
        )
      : [],
    books: Array.isArray(data.books) && data.books.length > 0 ? data.books : DEFAULT_DEENIYAT_BOOKS,
    bookSales: Array.isArray(data.bookSales) ? data.bookSales : [],
    feePayments: Array.isArray(data.feePayments) ? data.feePayments : [],
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
    deposits: Array.isArray(data.deposits) ? data.deposits : [],
    otherIncomes: Array.isArray(data.otherIncomes) ? data.otherIncomes : [],
    teacherWithdrawals: Array.isArray(data.teacherWithdrawals) ? data.teacherWithdrawals : [],
    attendanceRecords: Array.isArray(data.attendanceRecords) ? data.attendanceRecords : [],
    account: data.account || { identifier: '', isLoggedIn: false },
  };
};

export const getInitialData = (): MaktabDataStore => {
  try {
    const candidateKeys = [
      STORAGE_KEY,
      'deeniyat_maktab_last_known_good_backup',
      'deeniyat_maktab_satkhira_data_v4',
      'deeniyat_maktab_satkhira_data_v3',
      'deeniyat_maktab_satkhira_data_v2',
      'deeniyat_maktab_satkhira_data',
    ];

    for (const key of candidateKeys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            const hasData =
              (parsed.branches?.length > 0) ||
              (parsed.students?.length > 0) ||
              (parsed.feePayments?.length > 0) ||
              (parsed.expenses?.length > 0);
            if (hasData) {
              const normalized = normalizeMaktabData(parsed);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
              return normalized;
            }
          }
        } catch {}
      }
    }

    // Check user backups in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('deeniyat_user_backup_')) {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (parsed && ((parsed.students?.length > 0) || (parsed.branches?.length > 0))) {
              const normalized = normalizeMaktabData(parsed);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
              return normalized;
            }
          } catch {}
        }
      }
    }

    // Standard fallback to STORAGE_KEY if empty store exists
    const fallback = localStorage.getItem(STORAGE_KEY);
    if (fallback) {
      return normalizeMaktabData(JSON.parse(fallback));
    }
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
  }

  return normalizeMaktabData(null);
};

export const saveToStorage = (data: MaktabDataStore) => {
  try {
    const str = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, str);

    // If data contains actual entries, also create a last-known-good backup snapshot
    const entryCount =
      (data.branches?.length || 0) +
      (data.students?.length || 0) +
      (data.feePayments?.length || 0) +
      (data.expenses?.length || 0);

    if (entryCount > 0) {
      localStorage.setItem('deeniyat_maktab_last_known_good_backup', str);
    }

    // Also mirror to user backup if account identifier exists
    if (data.account?.identifier) {
      const userKey = 'deeniyat_user_backup_' + data.account.identifier.trim().toLowerCase();
      localStorage.setItem(userKey, str);
    }
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

// Intelligent Store Merge: NEVER overwrite populated data with empty data
export const mergeMaktabStores = (local: MaktabDataStore, remote: MaktabDataStore): MaktabDataStore => {
  const countEntries = (s: MaktabDataStore) =>
    (s?.branches?.length || 0) +
    (s?.students?.length || 0) +
    (s?.feePayments?.length || 0) +
    (s?.expenses?.length || 0) +
    (s?.deposits?.length || 0) +
    (s?.otherIncomes?.length || 0) +
    (s?.attendanceRecords?.length || 0) +
    (s?.bookSales?.length || 0);

  const localCount = countEntries(local);
  const remoteCount = countEntries(remote);

  // If remote is empty and local has user data: KEEP LOCAL!
  if (remoteCount === 0 && localCount > 0) {
    return local;
  }
  // If local is empty and remote has user data: USE REMOTE!
  if (localCount === 0 && remoteCount > 0) {
    return remote;
  }
  if (localCount === 0 && remoteCount === 0) {
    return local;
  }

  // Merge branches by id
  const branchMap = new Map<string, any>();
  (remote.branches || []).forEach((b) => branchMap.set(b.id, b));
  (local.branches || []).forEach((b) => branchMap.set(b.id, b));

  // Merge students by id
  const studentMap = new Map<string, any>();
  (remote.students || []).forEach((s) => studentMap.set(s.id, s));
  (local.students || []).forEach((s) => studentMap.set(s.id, s));

  // Merge feePayments by id
  const feeMap = new Map<string, any>();
  (remote.feePayments || []).forEach((f) => feeMap.set(f.id, f));
  (local.feePayments || []).forEach((f) => feeMap.set(f.id, f));

  // Merge expenses by id
  const expenseMap = new Map<string, any>();
  (remote.expenses || []).forEach((e) => expenseMap.set(e.id, e));
  (local.expenses || []).forEach((e) => expenseMap.set(e.id, e));

  // Merge deposits by id
  const depositMap = new Map<string, any>();
  (remote.deposits || []).forEach((d) => depositMap.set(d.id, d));
  (local.deposits || []).forEach((d) => depositMap.set(d.id, d));

  // Merge otherIncomes by id
  const incMap = new Map<string, any>();
  (remote.otherIncomes || []).forEach((i) => incMap.set(i.id, i));
  (local.otherIncomes || []).forEach((i) => incMap.set(i.id, i));

  // Merge attendance records by id
  const attMap = new Map<string, any>();
  (remote.attendanceRecords || []).forEach((a) => attMap.set(a.id, a));
  (local.attendanceRecords || []).forEach((a) => attMap.set(a.id, a));

  // Merge book sales by id
  const saleMap = new Map<string, any>();
  (remote.bookSales || []).forEach((s) => saleMap.set(s.id, s));
  (local.bookSales || []).forEach((s) => saleMap.set(s.id, s));

  // Account: preserve logged in account
  const account = local.account?.isLoggedIn ? local.account : (remote.account || local.account);

  return normalizeMaktabData({
    branches: Array.from(branchMap.values()),
    students: sortStudentsByRoll(Array.from(studentMap.values())),
    feePayments: Array.from(feeMap.values()),
    expenses: Array.from(expenseMap.values()),
    deposits: Array.from(depositMap.values()),
    otherIncomes: Array.from(incMap.values()),
    attendanceRecords: Array.from(attMap.values()),
    bookSales: Array.from(saleMap.values()),
    books: (local.books?.length || 0) > 0 ? local.books : remote.books,
    account,
  });
};

export const clearAllDataStore = async (): Promise<MaktabDataStore> => {
  try {
    const keysToRemove = [
      STORAGE_KEY,
      'deeniyat_maktab_last_known_good_backup',
      'deeniyat_maktab_satkhira_data_v4',
      'deeniyat_maktab_satkhira_data_v3',
      'deeniyat_maktab_satkhira_data_v2',
      'deeniyat_maktab_satkhira_data',
    ];
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.error('Failed to clear local storage:', e);
  }

  try {
    await fetch('/api/reset-data', { method: 'POST' });
  } catch (e) {
    console.warn('Could not contact server to reset data:', e);
  }

  return normalizeMaktabData(null);
};

export const syncWithCloudServer = async (data: MaktabDataStore) => {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: data,
        account: data.account,
      }),
    });
    if (res.ok) {
      return { success: true };
    }
  } catch (e) {
    console.warn('Server sync skipped (running local):', e);
  }
  return { success: false };
};

export const fetchFromServer = async (): Promise<MaktabDataStore | null> => {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const json = await res.json();
      if (json.data && typeof json.data === 'object') {
        return json.data as MaktabDataStore;
      }
    }
  } catch (e) {
    console.warn('Could not fetch initial data from server:', e);
  }
  return null;
};

// Bengali Number conversion
export const toBnNum = (n: number | string, isBangla = true): string => {
  if (!isBangla) return String(n);
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/[0-9]/g, (w) => bnDigits[+w]);
};

export const toBnCurrency = (n: number | string, isBangla = true): string => {
  const num = typeof n === 'string' ? parseFloat(n) || 0 : n;
  const formatted = Math.round(num).toLocaleString('en-US');
  const currencySymbol = '৳';
  return `${currencySymbol} ${toBnNum(formatted, isBangla)}`;
};

export const getDayNameBn = (dateStr: string, isBangla = true): string => {
  try {
    const d = new Date(dateStr);
    const dayIndex = d.getDay();
    if (!isBangla) {
      const enDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return enDays[dayIndex] || 'Saturday';
    }
    return BENGALI_DAYS[dayIndex] || 'শনিবার';
  } catch {
    return isBangla ? 'শনিবার' : 'Saturday';
  }
};

// Helper: Format MM-YYYY
export const formatMonthYearString = (monthNum: number, yearNum: number): string => {
  const m = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
  return `${m}-${yearNum}`;
};
