import React, { useState } from 'react';
import { Book, BookSale, Student, Branch } from '../types';
import { toBnNum, toBnCurrency, DEENIYAT_CLASSES, sortStudentsByRoll } from '../utils/storage';
import { translations, Language } from '../utils/translations';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  students: Student[];
  branches: Branch[];
  sales: BookSale[];
  onSaveBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onRecordSale: (sale: BookSale) => void;
  language?: Language;
}

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  books,
  students,
  branches,
  sales,
  onSaveBook,
  onDeleteBook,
  onRecordSale,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const safeBooks = Array.isArray(books) ? books : [];
  const safeStudents = Array.isArray(students) ? students : [];
  const safeBranches = Array.isArray(branches) ? branches : [];
  const safeSales = Array.isArray(sales) ? sales : [];

  const [activeTab, setActiveTab] = useState<'sell' | 'buy' | 'inventory'>('sell');

  // Tab 1: Book Sale state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchInput, setStudentSearchInput] = useState<string>('');
  const [studentRoll, setStudentRoll] = useState<string>('');
  const [selectedBookId, setSelectedBookId] = useState<string>(safeBooks[0]?.id || '');
  const [quantity, setQuantity] = useState<string>('1');
  const [discount, setDiscount] = useState<string>('0');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saleSuccessMsg, setSaleSuccessMsg] = useState('');
  const [saleErrorMsg, setSaleErrorMsg] = useState('');

  // Tab 2: Book Purchase / Add Stock state
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookName, setBookName] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [buyPrice, setBuyPrice] = useState('80');
  const [sellPrice, setSellPrice] = useState('100');
  const [bookClass, setBookClass] = useState(DEENIYAT_CLASSES[0]);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [buyErrorMsg, setBuyErrorMsg] = useState('');
  const [buySuccessMsg, setBuySuccessMsg] = useState('');

  if (!isOpen) return null;

  // Selected Student
  const matchedStudent = safeStudents.find((s) => s.id === selectedStudentId);
  const studentBranch = matchedStudent ? safeBranches.find((b) => b.id === matchedStudent.branchId)?.name || '' : '';

  // Selected Book
  const currentBook = safeBooks.find((b) => b.id === (selectedBookId || safeBooks[0]?.id));
  const currentBookPrice = currentBook ? currentBook.sellPrice : 0;
  const currentBookStock = currentBook ? currentBook.stock : 0;

  const qtyNum = parseInt(quantity, 10) || 1;
  const discountNum = parseInt(discount, 10) || 0;
  const subTotal = currentBookPrice * qtyNum;
  const grandTotal = Math.max(0, subTotal - discountNum);

  // Student Search Filter: Strictly sorted by roll number 1, 2, 3...
  const filteredStudents = sortStudentsByRoll(
    safeStudents.filter((s) => {
      if (!studentSearchInput.trim()) return true;
      const term = studentSearchInput.toLowerCase();
      return s.name.toLowerCase().includes(term) || s.roll.toLowerCase().includes(term);
    })
  );

  const handleSelectStudent = (st: Student) => {
    setSelectedStudentId(st.id);
    setStudentSearchInput(st.name);
    setStudentRoll(st.roll);
  };

  const handleStudentNameInput = (val: string) => {
    setStudentSearchInput(val);
    const exact = safeStudents.find((s) => s.name.toLowerCase() === val.toLowerCase());
    if (exact) {
      setSelectedStudentId(exact.id);
      setStudentRoll(exact.roll);
    }
  };

  const handleRollSearch = (rVal: string) => {
    setStudentRoll(rVal);
    const exact = safeStudents.find((s) => s.roll === rVal.trim());
    if (exact) {
      setSelectedStudentId(exact.id);
      setStudentSearchInput(exact.name);
    }
  };

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBook) {
      setSaleErrorMsg(isBn ? 'অনুগ্রহ করে বই নির্বাচন করুন' : 'Please select a book');
      return;
    }
    setSaleErrorMsg('');

    const saleRecord: BookSale = {
      id: `sale_${Date.now()}`,
      date: saleDate,
      studentId: matchedStudent ? matchedStudent.id : 'general',
      studentName: matchedStudent ? matchedStudent.name : (studentSearchInput.trim() || (isBn ? 'সাধারণ শিক্ষার্থী' : 'General Student')),
      studentRoll: studentRoll || 'N/A',
      studentGender: matchedStudent ? (matchedStudent.gender === 'girl' ? 'girl' : 'boy') : undefined,
      bookId: currentBook.id,
      bookName: currentBook.name,
      quantity: qtyNum,
      unitPrice: currentBookPrice,
      discount: discountNum,
      totalAmount: grandTotal,
      branchId: matchedStudent ? matchedStudent.branchId : (branches[0]?.id || 'general'),
    };

    onRecordSale(saleRecord);

    // Reduce stock
    const updatedBook: Book = {
      ...currentBook,
      stock: Math.max(0, currentBook.stock - qtyNum),
    };
    onSaveBook(updatedBook);

    setSaleSuccessMsg(
      isBn
        ? `বই বিক্রি সম্পন্ন হয়েছে! মোট: ${toBnCurrency(grandTotal, isBn)}`
        : `Book sale confirmed! Total: ${toBnCurrency(grandTotal, isBn)}`
    );
    setTimeout(() => setSaleSuccessMsg(''), 3000);

    setSelectedStudentId('');
    setStudentSearchInput('');
    setStudentRoll('');
    setQuantity('1');
    setDiscount('0');
  };

  const handleSaveBookStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName.trim()) {
      setBuyErrorMsg(isBn ? 'বইয়ের নাম লিখুন' : 'Please enter book title');
      return;
    }
    setBuyErrorMsg('');

    const newBook: Book = {
      id: editingBookId || `book_${Date.now()}`,
      name: bookName.trim(),
      stock: parseInt(stockQuantity, 10) || 0,
      buyPrice: parseFloat(buyPrice) || 0,
      sellPrice: parseFloat(sellPrice) || 0,
      classLevel: bookClass,
    };

    onSaveBook(newBook);
    setEditingBookId(null);
    setBookName('');
    setStockQuantity('10');
    setBuyPrice('80');
    setSellPrice('100');
    setActiveTab('inventory');
  };

  const handleStartEditBook = (b: Book) => {
    setEditingBookId(b.id);
    setBookName(b.name);
    setStockQuantity(String(b.stock));
    setBuyPrice(String(b.buyPrice));
    setSellPrice(String(b.sellPrice));
    setBookClass(b.classLevel || DEENIYAT_CLASSES[0]);
    setActiveTab('buy');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-teal-950 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <i className="fa-solid fa-book-bookmark text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {isBn ? 'বই ক্রয় ও বিক্রি ব্যবস্থাপনা' : 'Book Sales & Inventory'}
              </h3>
              <p className="text-[10px] text-blue-300">https://www.deeniyatbd.com/books</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-emerald-500/20 bg-slate-950/60 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'sell'
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-cart-shopping text-xs"></i>
            <span>{isBn ? 'বই বিক্রি' : 'Sell Books'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'buy'
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-box-archive text-xs"></i>
            <span>{editingBookId ? (isBn ? 'এডিট' : 'Edit') : (isBn ? 'বই ক্রয় ও স্টক' : 'Purchase & Stock')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-layer-group text-xs"></i>
            <span>{isBn ? `ক্যাটালগ (${toBnNum(books.length, isBn)})` : `Catalog (${books.length})`}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {activeTab === 'sell' ? (
            <form onSubmit={handleCompleteSale} className="space-y-3">
              {saleErrorMsg && (
                <div className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow">
                  <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
                  <span>{saleErrorMsg}</span>
                </div>
              )}

              {saleSuccessMsg && (
                <div className="bg-emerald-950 border border-emerald-400 text-emerald-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow">
                  <i className="fa-solid fa-circle-check text-emerald-400"></i>
                  <span>{saleSuccessMsg}</span>
                </div>
              )}

              {/* Requirement 10: নাম সার্চ করলে অন্য ঘরে রোল ও দেখা যাবে */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 relative">
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'শিক্ষার্থীর নাম সার্চ / নির্বাচন' : 'Search / Select Student'}
                  </label>
                  <input
                    type="text"
                    value={studentSearchInput}
                    onChange={(e) => handleStudentNameInput(e.target.value)}
                    placeholder={isBn ? 'নাম লিখুন...' : 'Student name...'}
                    className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-400 font-bold"
                  />
                  {studentSearchInput && filteredStudents.length > 0 && !matchedStudent && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-emerald-500/40 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                      {filteredStudents.slice(0, 5).map((st) => (
                        <div
                          key={st.id}
                          onClick={() => handleSelectStudent(st)}
                          className="px-3 py-2 text-xs hover:bg-emerald-900/60 cursor-pointer border-b border-slate-700/50 flex items-center justify-between"
                        >
                          <span className="font-bold text-white flex items-center gap-1">
                            <span>{st.gender === 'girl' ? '👧' : '👦'}</span>
                            <span>{st.name}</span>
                          </span>
                          <span className="text-[10px] text-amber-300">
                            {isBn ? `রোল: ${toBnNum(st.roll, isBn)}` : `Roll: ${st.roll}`} ({st.classLevel})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* স্বয়ংক্রিয় অন্য ঘরে রোল */}
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'রোল (অটো)' : 'Roll (Auto)'}
                  </label>
                  <input
                    type="text"
                    value={studentRoll}
                    onChange={(e) => handleRollSearch(e.target.value)}
                    placeholder={isBn ? 'রোল' : 'Roll'}
                    className="w-full bg-slate-900 border border-amber-400/50 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-black outline-none text-center"
                  />
                </div>
              </div>

              {matchedStudent && (
                <div className="p-2 bg-slate-950/80 rounded-xl border border-emerald-500/20 text-xs flex justify-between items-center text-gray-300">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                      matchedStudent.gender === 'girl'
                        ? 'bg-pink-950/80 text-pink-300 border-pink-500/40'
                        : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                    }`}>
                      {matchedStudent.gender === 'girl' ? '👧 ছাত্রী' : '👦 ছাত্র'}
                    </span>
                    <span className="font-bold text-white">{matchedStudent.name}</span>
                    <span className="text-amber-300 font-mono">রোল: {toBnNum(matchedStudent.roll, isBn)}</span>
                    <span className="text-gray-500">•</span>
                    <span>{matchedStudent.classLevel}</span>
                  </div>
                  <span className="text-emerald-300 font-semibold">{studentBranch}</span>
                </div>
              )}

              {/* Requirement 10: শুধুমাত্র বইয়ের নাম থাকবে (দাম বা কোয়ান্টিটি ড্রপডাউনে থাকবে না) */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'বই নির্বাচন করুন (শুধুমাত্র বইয়ের নাম)' : 'Select Book (Title Only)'} <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:border-blue-400"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Requirement 10: দাম অন্য ঘরে এবং স্টক অন্য ঘরে এবং পরিমাণ অন্য ঘরে */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'বইয়ের দাম (৳)' : 'Price (৳)'}
                  </label>
                  <div className="bg-slate-950 border border-emerald-500/20 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-black text-center">
                    {toBnCurrency(currentBookPrice, isBn)}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'বর্তমান স্টক' : 'Stock'}
                  </label>
                  <div className="bg-slate-950 border border-emerald-500/20 rounded-xl px-2.5 py-2 text-xs text-emerald-300 font-bold text-center">
                    {isBn ? `${toBnNum(currentBookStock, isBn)}টি` : `${currentBookStock} pcs`}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'পরিমাণ (বিক্রি)' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl px-2.5 py-2 text-xs text-white font-bold outline-none focus:border-blue-400 text-center"
                  />
                </div>
              </div>

              {/* ছাড়ের ঘর ও বিক্রির তারিখ */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'ছাড়ের পরিমাণ (টাকা)' : 'Discount (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-rose-400/40 rounded-xl px-2.5 py-2 text-xs text-rose-300 font-bold outline-none text-center"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'বিক্রির তারিখ' : 'Sale Date'}
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* মোট প্রদেয় হিসাব কার্ড */}
              <div className="bg-slate-950 border border-blue-500/30 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400">{isBn ? 'মোট বিক্রয় মূল্য (ছাড় বাদে)' : 'Net Payable Total'}</div>
                  <div className="text-sm font-black text-amber-300">{toBnCurrency(grandTotal, isBn)}</div>
                </div>
                <div className="text-right text-[10px] text-gray-400">
                  <div>{isBn ? 'উপ-মোট: ' : 'Subtotal: '}{toBnCurrency(subTotal, isBn)}</div>
                  {discountNum > 0 && <div className="text-rose-400">{isBn ? 'ছাড়: -' : 'Disc: -'}{toBnCurrency(discountNum, isBn)}</div>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <i className="fa-solid fa-cart-check text-xs"></i>
                <span>{isBn ? 'বিক্রি নিশ্চিত করুন' : 'Confirm Book Sale'}</span>
              </button>
            </form>
          ) : activeTab === 'buy' ? (
            /* TAB 2: BUY / ADD BOOK STOCK */
            <form onSubmit={handleSaveBookStock} className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-3.5 space-y-3">
              <div className="text-xs font-bold text-amber-300 flex items-center justify-between border-b border-slate-700/60 pb-2">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-plus-circle text-xs"></i>
                  {editingBookId ? (isBn ? 'বইয়ের তথ্য পরিবর্তন করুন' : 'Edit Book') : (isBn ? 'নতুন বই ক্রয় ও স্টক যুক্তকরণ' : 'Purchase Book & Add Stock')}
                </span>
                {editingBookId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBookId(null);
                      setBookName('');
                      setStockQuantity('10');
                      setBuyPrice('80');
                      setSellPrice('100');
                    }}
                    className="text-[10px] text-rose-300 hover:underline"
                  >
                    {t.cancel}
                  </button>
                )}
              </div>

              {buyErrorMsg && (
                <div className="bg-rose-950/90 border border-rose-500 text-rose-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow">
                  <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
                  <span>{buyErrorMsg}</span>
                </div>
              )}

              {/* Requirement 10: ক্রয়ের অপশনে তারিখ এর অপশন থাকবে */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'ক্রয়ের তারিখ' : 'Purchase Date'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Requirement 10: বইয়ের নাম আলাদা ঘরে */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'বইয়ের নাম (https://www.deeniyatbd.com/books)' : 'Book Title'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder={isBn ? 'যেমন: দ্বীনিয়াত মক্তব কোর্স প্রথম বর্ষ' : 'e.g. Deeniyat Maktab Course Part 1'}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-400"
                />
              </div>

              {/* Requirement 10: পরিমাণ (স্টক) আলাদা ঘরে */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'পরিমাণ (স্টক সংখ্যা)' : 'Quantity / Stock Count'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-blue-400"
                />
              </div>

              {/* Requirement 10: ক্রয় মূল্য ও বিক্রয় মূল্য আলাদা আলাদা ঘরে */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'ক্রয় মূল্য (টাকা)' : 'Buy Price (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="85"
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'বিক্রয় মূল্য (টাকা)' : 'Sell Price (৳)'} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="100"
                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* সংশ্লিষ্ট শ্রেণী */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'সংশ্লিষ্ট শ্রেণী (সিলেবাস)' : 'Class / Curriculum'}
                </label>
                <select
                  value={bookClass}
                  onChange={(e) => setBookClass(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-100 outline-none"
                >
                  {DEENIYAT_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="সকল শ্রেণী">{isBn ? 'সকল শ্রেণী' : 'All Classes'}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <i className="fa-solid fa-check"></i>
                <span>{editingBookId ? (isBn ? 'বই আপডেট করুন' : 'Update Book') : (isBn ? 'বই স্টক যুক্ত করুন' : 'Save Book Stock')}</span>
              </button>
            </form>
          ) : (
            /* TAB 3: BOOK INVENTORY & CATALOG */
            <div className="space-y-3">
              <div className="text-xs font-bold text-blue-300 flex items-center justify-between">
                <span>{isBn ? 'দ্বীনিয়াত সিলেবাস বই ও স্টক বিবরণী' : 'Deeniyat Books & Stock'}</span>
                <span className="text-[10px] text-gray-400">deeniyatbd.com/books</span>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {books.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 bg-slate-800/80 border border-blue-500/20 rounded-2xl flex items-center justify-between gap-2 shadow"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{b.name}</h4>
                      <p className="text-[10px] text-gray-400">{b.classLevel || (isBn ? 'সাধারণ' : 'General')}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="text-emerald-300 font-bold">{isBn ? 'বিক্রয়: ' : 'Sell: '}{toBnCurrency(b.sellPrice, isBn)}</span>
                        <span className="text-gray-400">{isBn ? 'ক্রয়: ' : 'Buy: '}{toBnCurrency(b.buyPrice, isBn)}</span>
                        <span className="bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {isBn ? `স্টক: ${toBnNum(b.stock, isBn)}টি` : `Stock: ${b.stock}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditBook(b)}
                        className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 rounded-lg text-xs"
                        title={t.edit}
                      >
                        <i className="fa-solid fa-pen-to-square text-[11px]"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBook(b.id)}
                        className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-xs"
                        title={t.delete}
                      >
                        <i className="fa-solid fa-trash-can text-[11px]"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Sales Ledger snippet */}
              {sales.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1">
                    <i className="fa-solid fa-receipt text-xs"></i>
                    <span>{isBn ? `সাম্প্রতিক বিক্রয় রশিদ (${toBnNum(sales.length, isBn)}টি)` : `Recent Sales (${sales.length})`}</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {sales.slice(-5).reverse().map((sl) => (
                      <div key={sl.id} className="p-2 bg-slate-950/70 rounded-xl text-[11px] flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white">{sl.bookName}</span>
                          <span className="text-gray-400 ml-1">({sl.studentName})</span>
                        </div>
                        <div className="font-bold text-emerald-300">{toBnCurrency(sl.totalAmount, isBn)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
    </div>
  );
};
