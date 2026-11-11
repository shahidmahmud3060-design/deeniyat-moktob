import React, { useState, useEffect } from 'react';
import { Student, Branch, Gender } from '../types';
import { DEENIYAT_CLASSES, toBnNum, sortStudentsByRoll } from '../utils/storage';
import { translations, Language } from '../utils/translations';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  branches: Branch[];
  mode?: 'add_only' | 'list_only' | 'both';
  onSaveStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  language?: Language;
}

// Helper to parse Bengali and English digits to an integer
export const parseRollToNumber = (rollStr: string): number | null => {
  if (!rollStr) return null;
  const raw = rollStr.toString().trim();
  const normalized = raw.replace(/[০-৯]/g, (d) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(bnDigits.indexOf(d));
  });
  const parsed = parseInt(normalized, 10);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
};

// Requirement: প্রত্যেকটা কেন্দ্রে ছেলে এবং মেয়েদের আলাদা করে ১ থেকে রোল তৈরি হবে
export const getNextAvailableRollNumber = (
  students: Student[],
  branchId?: string,
  gender: Gender = 'boy',
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

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  students,
  branches,
  mode = 'both',
  onSaveStudent,
  onDeleteStudent,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const safeStudents = Array.isArray(students) ? students : [];
  const safeBranches = Array.isArray(branches) ? branches : [];

  const [activeTab, setActiveTab] = useState<'add' | 'list'>(
    mode === 'list_only' ? 'list' : 'add'
  );
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Manual add toggle for list_only mode
  const [isManualAdd, setIsManualAdd] = useState(false);

  const initialBranchId = safeBranches[0]?.id || '';
  const [branchId, setBranchId] = useState(initialBranchId);
  const [gender, setGender] = useState<Gender>('boy');

  // Form states - Requirement: প্রত্যেকটা কেন্দ্রে ছেলে এবং মেয়েদের আলাদা করে ১ থেকে রোল তৈরি হবে
  const [name, setName] = useState('');
  const [roll, setRoll] = useState(() => getNextAvailableRollNumber(safeStudents, initialBranchId, 'boy', isBn));
  const [classLevel, setClassLevel] = useState(DEENIYAT_CLASSES[0]);
  const [guardianPhone, setGuardianPhone] = useState('');
  const [admissionDate, setAdmissionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Synchronize tab and auto-roll whenever mode, isOpen, branch, or gender changes
  useEffect(() => {
    if (isOpen) {
      setIsManualAdd(false);
      setEditingStudentId(null);
      const curBranch = branchId || safeBranches[0]?.id || '';
      if (mode === 'list_only') {
        setActiveTab('list');
      } else if (mode === 'add_only') {
        setActiveTab('add');
        setRoll(getNextAvailableRollNumber(safeStudents, curBranch, gender, isBn));
      } else {
        if (activeTab === 'add') {
          setRoll(getNextAvailableRollNumber(safeStudents, curBranch, gender, isBn));
        }
      }
    }
  }, [mode, isOpen]);

  // Search & Filter state for list view
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranchId, setFilterBranchId] = useState('all');
  const [filterGender, setFilterGender] = useState<'all' | 'boy' | 'girl'>('all');

  // In-app Delete Confirmation state
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  // Check if roll already exists in the same branch AND same gender (Requirement: ছেলে ও মেয়েদের আলাদা রোল তৈরি হবে)
  const targetBranchId = branchId || safeBranches[0]?.id || '';
  const duplicateStudent = roll.trim()
    ? safeStudents.find(
        (s) =>
          s.id !== editingStudentId &&
          s.branchId === targetBranchId &&
          (s.gender === 'girl' ? 'girl' : 'boy') === gender &&
          s.roll.trim().toLowerCase() === roll.trim().toLowerCase()
      )
    : null;

  if (!isOpen) return null;

  const selectedBranch = safeBranches.find((b) => b.id === targetBranchId);
  const branchAddress = selectedBranch ? selectedBranch.location : (isBn ? 'শাখা নির্বাচন করা হয়নি' : 'No centre selected');

  const handleStartEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setName(student.name);
    setRoll(student.roll);
    setGender(student.gender === 'girl' ? 'girl' : 'boy');
    setClassLevel(student.classLevel);
    setBranchId(student.branchId);
    setGuardianPhone(student.guardianPhone || '');
    setAdmissionDate(student.admissionDate);
    setActiveTab('add');
    setErrorMsg('');
  };

  const resetForm = () => {
    setEditingStudentId(null);
    setIsManualAdd(false);
    setName('');
    const curBranch = branchId || safeBranches[0]?.id || '';
    setRoll(getNextAvailableRollNumber(safeStudents, curBranch, gender, isBn));
    setClassLevel(DEENIYAT_CLASSES[0]);
    setGuardianPhone('');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(isBn ? 'শিক্ষার্থীর নাম লিখুন' : 'Please enter student name');
      return;
    }
    if (!roll.trim()) {
      setErrorMsg(isBn ? 'রোল নম্বর লিখুন' : 'Please enter roll number');
      return;
    }

    // Requirement: শিক্ষার্থীদের এক রোল দ্বিতীয়বার এন্ট্রি হবে না (একই কেন্দ্র ও জেন্ডারের ক্ষেত্রে)
    if (duplicateStudent) {
      setErrorMsg(
        isBn
          ? `রোল "${toBnNum(roll.trim(), isBn)}" ইতোমধ্যেই এই কেন্দ্রে ${gender === 'girl' ? 'ছাত্রীদের (মেয়ে)' : 'ছাত্রদের (ছেলে)'} তালিকায় "${duplicateStudent.name}" এর জন্য ব্যবহৃত হয়েছে! একই কেন্দ্রে একই ক্যাটাগরিতে এক রোল দ্বিতীয়বার দেওয়া যাবে না।`
          : `Roll "${roll.trim()}" is already assigned to "${duplicateStudent.name}" in this centre (${gender === 'girl' ? 'Girls' : 'Boys'})! Duplicate rolls are not allowed.`
      );
      return;
    }

    const currentBranch = branches.find((b) => b.id === targetBranchId);

    const studentData: Student = {
      id: editingStudentId || `student_${Date.now()}`,
      name: name.trim(),
      roll: roll.trim(),
      gender,
      classLevel,
      branchId: currentBranch ? currentBranch.id : 'no_branch',
      branchLocation: currentBranch ? currentBranch.location : '',
      guardianPhone: guardianPhone.trim(),
      admissionDate: admissionDate || new Date().toISOString().split('T')[0],
      status: 'active',
    };

    onSaveStudent(studentData);
    setSuccessMsg(isBn ? 'শিক্ষার্থী সফলভাবে সংরক্ষিত হয়েছে!' : 'Student saved successfully!');
    setTimeout(() => setSuccessMsg(''), 2500);

    resetForm();
    setActiveTab('list');
    setIsManualAdd(false);
  };

  const handleDelete = (id: string, sName: string) => {
    setStudentToDelete({ id, name: sName });
  };

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    const remainingStudents = safeStudents.filter((s) => s.id !== studentToDelete.id);
    onDeleteStudent(studentToDelete.id);
    if (editingStudentId === studentToDelete.id) {
      resetForm();
    } else if (!editingStudentId) {
      setRoll(getNextAvailableRollNumber(remainingStudents, branchId || safeBranches[0]?.id || '', gender, isBn));
    }
    const deletedName = studentToDelete.name;
    setStudentToDelete(null);
    setSuccessMsg(isBn ? `শিক্ষার্থী "${deletedName}" এর নাম সফলভাবে ডিলিট করা হয়েছে!` : `Student "${deletedName}" deleted successfully!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filteredStudents = sortStudentsByRoll(
    safeStudents.filter((s) => {
      const matchBranch = filterBranchId === 'all' || s.branchId === filterBranchId;
      const sGender = s.gender === 'girl' ? 'girl' : 'boy';
      const matchGender = filterGender === 'all' || sGender === filterGender;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(term) ||
        s.roll.toLowerCase().includes(term) ||
        (s.guardianPhone && s.guardianPhone.includes(term));
      return matchBranch && matchGender && matchSearch;
    })
  );

  // Statistics for current branch selection
  const branchStudents = safeStudents.filter(
    (s) => filterBranchId === 'all' || s.branchId === filterBranchId
  );
  const totalBoysCount = branchStudents.filter((s) => s.gender !== 'girl').length;
  const totalGirlsCount = branchStudents.filter((s) => s.gender === 'girl').length;

  const isFormVisible =
    editingStudentId !== null ||
    isManualAdd ||
    mode === 'add_only' ||
    (mode === 'both' && activeTab === 'add');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-teal-900 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <i className="fa-solid fa-graduation-cap text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {editingStudentId
                  ? (isBn ? 'শিক্ষার্থী তথ্য সংশোধন' : 'Edit Student Details')
                  : isFormVisible
                  ? (isBn ? 'নতুন শিক্ষার্থী ভর্তি' : 'Student Admission')
                  : (isBn ? 'শিক্ষার্থীদের তালিকা' : 'Student List')}
              </h3>
              <p className="text-[10px] text-teal-300">
                {isFormVisible
                  ? (isBn ? 'ভর্তি ফরম পূরণ করুন' : 'Fill Admission Form')
                  : (isBn ? `মোট শিক্ষার্থী: ${toBnNum(safeStudents.length, isBn)} জন` : `Total: ${safeStudents.length}`)}
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

        {/* Tab Switcher (Visible only if mode === 'both') */}
        {mode === 'both' && !editingStudentId && (
          <div className="flex border-b border-emerald-500/20 bg-slate-950/60 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('add');
                setIsManualAdd(false);
                if (!editingStudentId) {
                  setRoll(getNextAvailableRollNumber(safeStudents, isBn));
                }
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'add'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>{isBn ? 'ভর্তি ফরম' : 'Admission Form'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                setIsManualAdd(false);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'list'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-users"></i>
              <span>{isBn ? `শিক্ষার্থী তালিকা (${toBnNum(students.length, isBn)})` : `Students (${students.length})`}</span>
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-4 space-y-4">
          {isFormVisible ? (
            /* Add or Edit Form */
            <form onSubmit={handleSubmit} className="space-y-3">
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

              {/* ১. কেন্দ্র নির্বাচন */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'মক্তব কেন্দ্র নির্বাচন করুন' : 'Select Maktab Centre'} <span className="text-rose-400">*</span>
                </label>
                {branches.length === 0 ? (
                  <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 p-2.5 rounded-xl text-[11px]">
                    <i className="fa-solid fa-circle-exclamation mr-1"></i>
                    {isBn ? 'কোনো কেন্দ্র পাওয়া যায়নি। প্রথমে কেন্দ্র যোগ করুন।' : 'No centres available. Please add a centre first.'}
                  </div>
                ) : (
                  <select
                    value={branchId || safeBranches[0]?.id}
                    onChange={(e) => {
                      const newB = e.target.value;
                      setBranchId(newB);
                      if (!editingStudentId) {
                        setRoll(getNextAvailableRollNumber(safeStudents, newB, gender, isBn));
                      }
                    }}
                    className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-emerald-400"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* ২. শিক্ষার্থী ক্যাটাগরি: ছাত্র (ছেলে) / ছাত্রী (মেয়ে) আলাদা রোল */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-emerald-200">
                    {isBn ? 'শিক্ষার্থীর ক্যাটাগরি (আলাদা রোল ক্রম)' : 'Student Category'} <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-teal-300 font-medium">
                    {isBn ? 'ছেলে ও মেয়েদের আলাদা রোল তৈরি হবে' : 'Separate rolls for boys & girls'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('boy');
                      if (!editingStudentId) {
                        setRoll(getNextAvailableRollNumber(safeStudents, branchId || safeBranches[0]?.id || '', 'boy', isBn));
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition border cursor-pointer ${
                      gender === 'boy'
                        ? 'bg-blue-600/30 border-blue-400 text-blue-100 shadow-md ring-1 ring-blue-400 font-black'
                        : 'bg-slate-800/80 border-slate-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">👦</span>
                    <span>{isBn ? 'ছাত্র (ছেলে)' : 'Boy'}</span>
                    <span className="text-[10px] bg-blue-950 px-1.5 py-0.5 rounded text-blue-300 font-mono">
                      {toBnNum(safeStudents.filter(s => s.branchId === (branchId || safeBranches[0]?.id) && s.gender !== 'girl').length, isBn)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGender('girl');
                      if (!editingStudentId) {
                        setRoll(getNextAvailableRollNumber(safeStudents, branchId || safeBranches[0]?.id || '', 'girl', isBn));
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition border cursor-pointer ${
                      gender === 'girl'
                        ? 'bg-pink-600/30 border-pink-400 text-pink-100 shadow-md ring-1 ring-pink-400 font-black'
                        : 'bg-slate-800/80 border-slate-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">👧</span>
                    <span>{isBn ? 'ছাত্রী (মেয়ে)' : 'Girl'}</span>
                    <span className="text-[10px] bg-pink-950 px-1.5 py-0.5 rounded text-pink-300 font-mono">
                      {toBnNum(safeStudents.filter(s => s.branchId === (branchId || safeBranches[0]?.id) && s.gender === 'girl').length, isBn)}
                    </span>
                  </button>
                </div>
              </div>

              {/* ৩. নাম */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? (gender === 'girl' ? 'ছাত্রীর নাম' : 'ছাত্রের নাম') : 'Student Name'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isBn ? (gender === 'girl' ? 'যেমন: ফাতিমা জান্নাত' : 'যেমন: মুহাম্মদ তাওহীদ ইসলাম') : 'Student name'}
                  className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
                />
              </div>

              {/* ৪. রোল ও শ্রেণী */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-emerald-200">
                      {isBn ? (gender === 'girl' ? 'মেয়েদের রোল' : 'ছেলেদের রোল') : 'Roll No.'} <span className="text-rose-400">*</span>
                    </label>
                    {!editingStudentId && (
                      <span className="text-[9px] text-teal-300 font-bold bg-teal-950/80 border border-teal-500/30 px-1.5 py-0.2 rounded-md">
                        ✓ ১ থেকে অটো
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={roll}
                      onChange={(e) => setRoll(e.target.value)}
                      placeholder={isBn ? '০১' : '01'}
                      className={`w-full bg-slate-800 border ${
                        duplicateStudent ? 'border-rose-500 text-rose-300 font-bold' : 'border-emerald-500/30 text-white font-mono font-bold'
                      } rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-400 pr-12`}
                    />
                    {!editingStudentId && (
                      <button
                        type="button"
                        onClick={() => setRoll(getNextAvailableRollNumber(safeStudents, branchId || safeBranches[0]?.id || '', gender, isBn))}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-teal-300 hover:text-white px-1.5 py-0.5 bg-slate-900 rounded border border-teal-500/30 font-bold transition cursor-pointer"
                        title="১ থেকে পরবর্তী খালি রোল বসান"
                      >
                        <i className="fa-solid fa-arrows-rotate mr-0.5"></i> অটো
                      </button>
                    )}
                  </div>
                  {duplicateStudent ? (
                    <span className="text-[10px] text-rose-400 font-bold mt-1 block">
                      ⚠️ রোল {toBnNum(roll, isBn)} ইতোমধ্যেই "{duplicateStudent.name}" এর জন্য ব্যবহৃত!
                    </span>
                  ) : (
                    !editingStudentId && (
                      <span className="text-[9px] text-gray-400 mt-1 block">
                        এই কেন্দ্রে {gender === 'girl' ? 'মেয়েদের' : 'ছেলেদের'} খালি রোল বসেছে।
                      </span>
                    )
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'শ্রেণী' : 'Class'} <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl px-2.5 py-2 text-xs text-emerald-100 outline-none focus:border-emerald-400"
                  >
                    {DEENIYAT_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* কেন্দ্রের ঠিকানা (স্বয়ংক্রিয় প্রদর্শিত) */}
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'কেন্দ্রের ঠিকানা (অটোমেটিক পূরণ)' : 'Centre Address (Auto-filled)'}
                </label>
                <div className="w-full bg-slate-950/80 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-gray-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot text-amber-400 text-xs"></i>
                  <span>{branchAddress}</span>
                </div>
              </div>

              {/* অভিভাবকের মোবাইল ও ভর্তির তারিখ */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'অভিভাবকের মোবাইল' : 'Guardian Mobile'}
                  </label>
                  <input
                    type="text"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="01711-XXXXXX"
                    className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                    {isBn ? 'ভর্তির তারিখ' : 'Admission Date'} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* সাবমিট বাটন ও বাতিল বাটন */}
              <div className="pt-2 flex gap-2">
                {(isManualAdd || editingStudentId || mode === 'list_only') && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>{isBn ? 'তালিকায় ফিরুন' : 'Back to List'}</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                >
                  <i className={`fa-solid ${editingStudentId ? 'fa-check' : 'fa-paper-plane'}`}></i>
                  <span>{editingStudentId ? (isBn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes') : (isBn ? 'ভর্তি নিশ্চিত করুন' : 'Confirm Admission')}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Student List View with Search & Edit / Delete */
            <div className="space-y-3">
              {/* Quick Action: Add Student Button in List View */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-300 font-bold">
                  {isBn ? `মোট: ${toBnNum(filteredStudents.length, isBn)} জন শিক্ষার্থী` : `Total: ${filteredStudents.length} Students`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsManualAdd(true);
                  }}
                  className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                >
                  <i className="fa-solid fa-user-plus text-[10px]"></i>
                  <span>{isBn ? '+ নতুন শিক্ষার্থী ভর্তি' : '+ Add Student'}</span>
                </button>
              </div>

              {/* Search & Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isBn ? 'নাম, রোল বা মোবাইল দিয়ে খুঁজুন...' : 'Search by name, roll, phone...'}
                    className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
                  />
                </div>
                {branches.length > 0 && (
                  <select
                    value={filterBranchId}
                    onChange={(e) => setFilterBranchId(e.target.value)}
                    className="bg-slate-800 border border-emerald-500/30 rounded-xl px-2 py-1.5 text-xs text-emerald-200 outline-none"
                  >
                    <option value="all">{isBn ? 'সব শাখা' : 'All Centres'}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Gender Filter Pills (ছেলে / মেয়ে আলাদা ফিল্টার ও পরিসংখ্যান) */}
              <div className="flex gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-emerald-500/20 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterGender('all')}
                  className={`flex-1 py-1 rounded-lg font-bold transition text-[11px] ${
                    filterGender === 'all'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isBn ? `সকল (${toBnNum(branchStudents.length, isBn)})` : `All (${branchStudents.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterGender('boy')}
                  className={`flex-1 py-1 rounded-lg font-bold transition text-[11px] flex items-center justify-center gap-1 ${
                    filterGender === 'boy'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-blue-300 hover:text-white'
                  }`}
                >
                  <span>👦 ছাত্র</span>
                  <span>({toBnNum(totalBoysCount, isBn)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterGender('girl')}
                  className={`flex-1 py-1 rounded-lg font-bold transition text-[11px] flex items-center justify-center gap-1 ${
                    filterGender === 'girl'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'text-pink-300 hover:text-white'
                  }`}
                >
                  <span>👧 ছাত্রী</span>
                  <span>({toBnNum(totalGirlsCount, isBn)})</span>
                </button>
              </div>

              {/* Student Cards */}
              {filteredStudents.length === 0 ? (
                <div className="p-6 bg-slate-800/40 rounded-2xl border border-dashed border-emerald-500/20 text-center space-y-3">
                  <i className="fa-solid fa-users text-gray-500 text-3xl mb-1"></i>
                  <p className="text-xs text-gray-400">
                    {isBn
                      ? 'এই ক্যাটাগরিতে বর্তমানে কোনো শিক্ষার্থী নিবন্ধিত নেই।'
                      : 'No students found in this category.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsManualAdd(true);
                    }}
                    className="mx-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                  >
                    <i className="fa-solid fa-user-plus"></i>
                    <span>{isBn ? 'নতুন শিক্ষার্থী ভর্তি করুন' : 'Admit Student'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredStudents.map((s) => {
                    const b = branches.find((br) => br.id === s.branchId);
                    const isGirl = s.gender === 'girl';
                    return (
                      <div
                        key={s.id}
                        className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/20 rounded-2xl flex flex-col justify-between gap-2 shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white">{s.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                                isGirl
                                  ? 'bg-pink-950/80 text-pink-300 border-pink-500/40'
                                  : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                              }`}>
                                {isGirl ? '👧 ছাত্রী' : '👦 ছাত্র'}
                              </span>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-bold">
                                {isBn ? `রোল: ${toBnNum(s.roll, isBn)}` : `Roll: ${s.roll}`}
                              </span>
                            </div>
                            <div className="text-[11px] text-emerald-300 mt-0.5 flex items-center gap-1">
                              <i className="fa-solid fa-book-bookmark text-[10px]"></i>
                              <span>{s.classLevel}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <i className="fa-solid fa-mosque text-[10px] text-teal-400"></i>
                              <span>{b ? b.name : (isBn ? 'শাখা তথ্য নেই' : 'No centre')}</span>
                              {s.branchLocation && <span>({s.branchLocation})</span>}
                            </div>
                            {s.guardianPhone && (
                              <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                <i className="fa-solid fa-phone text-[9px] text-emerald-400"></i>
                                <span>{toBnNum(s.guardianPhone, isBn)}</span>
                              </div>
                            )}
                            <div className="text-[9px] text-gray-500 mt-0.5">
                              {isBn ? `ভর্তি: ${toBnNum(s.admissionDate, isBn)}` : `Admission: ${s.admissionDate}`}
                            </div>
                          </div>

                          {/* Edit & Delete Action Buttons */}
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(s)}
                              className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                              <span>{t.edit}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s.id, s.name)}
                              className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                              <span>{t.delete}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-emerald-500/20 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold py-2 rounded-xl text-xs transition"
          >
            {t.close}
          </button>
        </div>
      </div>

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
                আপনি কি নিশ্চিত যে শিক্ষার্থী <b className="text-amber-300">"{studentToDelete.name}"</b> এর সমস্ত তথ্য ডিলিট করতে চান?
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
                onClick={confirmDeleteStudent}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg active:scale-95"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
