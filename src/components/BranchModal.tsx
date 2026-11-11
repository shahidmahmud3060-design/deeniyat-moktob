import React, { useState } from 'react';
import { Branch, TimeSlot } from '../types';
import { toBnNum } from '../utils/storage';
import { translations, Language } from '../utils/translations';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  onSaveBranch: (branch: Branch) => void;
  onDeleteBranch: (branchId: string) => void;
  language?: Language;
}

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  branches,
  onSaveBranch,
  onDeleteBranch,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const safeBranches = Array.isArray(branches) ? branches : [];

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  // Form states - Requirement 11: Only সকাল & বিকাল, NO monthly fee!
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('সকাল');
  const [teacherName, setTeacherName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [branchToDelete, setBranchToDelete] = useState<{ id: string; name: string } | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setName(branch.name);
    setLocation(branch.location);
    setTimeSlot(branch.timeSlot === 'বিকাল' ? 'বিকাল' : 'সকাল');
    setTeacherName(branch.teacherName || '');
    setTeacherPhone(branch.teacherPhone || '');
    setErrorMsg('');
  };

  const handleCancelEdit = () => {
    setEditingBranchId(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setTimeSlot('সকাল');
    setTeacherName('');
    setTeacherPhone('');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে কেন্দ্রের নাম লিখুন' : 'Please enter centre name');
      return;
    }
    if (!location.trim()) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে কেন্দ্রের স্থান বা ঠিকানা লিখুন' : 'Please enter centre address');
      return;
    }

    const branchData: Branch = {
      id: editingBranchId || `branch_${Date.now()}`,
      name: name.trim(),
      location: location.trim(),
      timeSlot, // Strictly 'সকাল' or 'বিকাল'
      teacherName: teacherName.trim(),
      teacherPhone: teacherPhone.trim(),
      createdAt: editingBranchId
        ? branches.find((b) => b.id === editingBranchId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    onSaveBranch(branchData);
    setEditingBranchId(null);
    resetForm();
  };

  const handleDelete = (id: string, branchName: string) => {
    setBranchToDelete({ id, name: branchName });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header - Requirement 12: "কেন্দ্র পরিচালনা" */}
        <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-950 border-b border-emerald-500/20 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <i className="fa-solid fa-mosque text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-100">
                {editingBranchId
                  ? (isBn ? 'কেন্দ্রের তথ্য সংশোধন (Edit)' : 'Edit Centre Details')
                  : (isBn ? 'কেন্দ্র পরিচালনা ও নতুন কেন্দ্র' : 'Centre Management & Add Centre')}
              </h3>
              <p className="text-[10px] text-emerald-300">{t.appTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4">
          {/* Add / Edit Form */}
          <form onSubmit={handleSubmit} className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <i className={`fa-solid ${editingBranchId ? 'fa-pen-to-square' : 'fa-circle-plus'}`}></i>
                {editingBranchId
                  ? (isBn ? 'কেন্দ্রের তথ্য আপডেট করুন' : 'Update Centre Information')
                  : (isBn ? 'নতুন কেন্দ্র তথ্য ফরম' : 'New Centre Information Form')}
              </span>
              {editingBranchId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[10px] text-rose-300 hover:underline"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="text-[11px] bg-rose-950/70 border border-rose-500/40 text-rose-200 px-2.5 py-1.5 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* কেন্দ্রের নাম */}
            <div>
              <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                {isBn ? 'কেন্দ্রের নাম' : 'Centre Name'} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isBn ? 'যেমন: পুরাতন সাতক্ষীরা কেন্দ্রীয় মক্তব' : 'e.g. Satkhira Central Maktab'}
                className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
              />
            </div>

            {/* কেন্দ্রের স্থান / ঠিকানা */}
            <div>
              <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                {isBn ? 'কেন্দ্রের স্থান বা ঠিকানা' : 'Centre Location / Address'} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={isBn ? 'যেমন: জামে মসজিদ প্রাঙ্গণ, পুরাতন সাতক্ষীরা' : 'e.g. Jame Masjid Compound'}
                className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
              />
            </div>

            {/* Requirement 11: পড়ার সময় শুধুমাত্র (সকাল ও বিকাল)। No extra time, NO monthly fee! */}
            <div>
              <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                {isBn ? 'পড়ার সময়' : 'Study Time'} <span className="text-rose-400">*</span>
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
                className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-emerald-400"
              >
                <option value="সকাল">{isBn ? 'সকাল' : 'Morning (সকাল)'}</option>
                <option value="বিকাল">{isBn ? 'বিকাল' : 'Afternoon (বিকাল)'}</option>
              </select>
            </div>

            {/* ওস্তাদের নাম ও মোবাইল নম্বর */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'নিযুক্ত ওস্তাদের নাম' : 'Teacher Name'}
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder={isBn ? 'মাওলানা ...' : 'Teacher name'}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-emerald-200 block mb-1">
                  {isBn ? 'ওস্তাদের মোবাইল' : 'Teacher Mobile'}
                </label>
                <input
                  type="text"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  placeholder="017..."
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <i className={`fa-solid ${editingBranchId ? 'fa-check' : 'fa-plus'}`}></i>
              <span>{editingBranchId ? (isBn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Update Centre') : (isBn ? 'নতুন কেন্দ্র সংরক্ষণ করুন' : 'Save New Centre')}</span>
            </button>
          </form>

          {/* Existing Centres List - Requirement 12: সকল কেন্দ্রের ঠিকানা সহ সবকিছু আপডেট করা যাবে */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                <i className="fa-solid fa-list-check text-amber-400"></i>
                {isBn ? `সংরক্ষিত কেন্দ্র তালিকা (${toBnNum(safeBranches.length, isBn)}টি)` : `Centres List (${safeBranches.length})`}
              </h4>
            </div>

            {safeBranches.length === 0 ? (
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-dashed border-emerald-500/30 text-center">
                <i className="fa-solid fa-building-circle-exclamation text-amber-400 text-2xl mb-1.5 opacity-80"></i>
                <p className="text-xs text-gray-300 font-medium">{isBn ? 'কোনো কেন্দ্রের নাম এখনও যুক্ত করা হয়নি।' : 'No centres added yet.'}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{isBn ? 'উপরে ফরম পূরণ করে আপনার প্রথম কেন্দ্র যুক্ত করুন।' : 'Fill form above to add your first centre.'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {safeBranches.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/20 rounded-2xl flex flex-col justify-between gap-2 shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span className="text-xs font-bold text-white">{b.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-300 mt-1 flex items-center gap-1">
                          <i className="fa-solid fa-location-dot text-amber-400 text-[10px]"></i>
                          <span>{b.location}</span>
                        </p>
                        {b.teacherName && (
                          <p className="text-[11px] text-emerald-200 mt-0.5 flex items-center gap-1">
                            <i className="fa-solid fa-chalkboard-user text-teal-400 text-[10px]"></i>
                            <span>{isBn ? 'ওস্তাদ: ' : 'Teacher: '}{b.teacherName}</span>
                            {b.teacherPhone && (
                              <span className="text-gray-400">({toBnNum(b.teacherPhone, isBn)})</span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(b)}
                          className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-90 transition"
                          title={isBn ? 'এডিট করুন' : 'Edit'}
                        >
                          <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                          <span>{t.edit}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id, b.name)}
                          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-90 transition"
                          title={isBn ? 'ডিলিট করুন' : 'Delete'}
                        >
                          <i className="fa-solid fa-trash-can text-[10px]"></i>
                          <span>{t.delete}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-emerald-500/20 text-center">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold py-2 rounded-xl text-xs transition"
          >
            {t.close}
          </button>
        </div>

        {branchToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-4 max-w-xs w-full text-center space-y-3 shadow-2xl">
              <i className="fa-solid fa-triangle-exclamation text-rose-400 text-2xl"></i>
              <h4 className="text-sm font-bold text-white">
                {isBn ? `"${branchToDelete.name}" কেন্দ্রটি মুছবেন?` : `Delete "${branchToDelete.name}"?`}
              </h4>
              <p className="text-xs text-rose-200">
                {isBn ? 'এই কেন্দ্রের সকল তথ্য মুছে যাবে।' : 'All centre data will be deleted.'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBranchToDelete(null)}
                  className="flex-1 py-2 bg-slate-800 text-gray-200 font-bold rounded-xl text-xs"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteBranch(branchToDelete.id);
                    if (editingBranchId === branchToDelete.id) {
                      handleCancelEdit();
                    }
                    setBranchToDelete(null);
                  }}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
                >
                  {isBn ? 'মুছে ফেলুন' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
