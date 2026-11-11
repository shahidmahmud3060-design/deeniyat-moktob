import React, { useState, useEffect } from 'react';
import { MaktabDataStore, UserAccount } from '../types';
import {
  syncWithCloudServer,
  toBnNum,
  toBnCurrency,
  DIRECTOR_NAME,
  DIRECTOR_PHONE,
  DEVELOPER_NAME,
  DEVELOPER_PHONE,
  normalizeMaktabData,
  saveToStorage,
} from '../utils/storage';
import { translations, Language } from '../utils/translations';

interface AccountBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MaktabDataStore;
  account: UserAccount;
  onUpdateAccount: (acc: UserAccount) => void;
  onRestoreData: (restoredData: MaktabDataStore) => void;
  onResetAllData?: () => void;
  language?: Language;
}

export const AccountBackupModal: React.FC<AccountBackupModalProps> = ({
  isOpen,
  onClose,
  data,
  account,
  onUpdateAccount,
  onRestoreData,
  onResetAllData,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  // 4 Clear Tabs: 'login' (আইডি ও পাসওয়ার্ড), 'profile' (একাউন্ট তথ্য), 'source_apk' (সোর্স কোড ও APK), 'backup_reset' (ব্যাকআপ ও রিসেট)
  const [activeTab, setActiveTab] = useState<'login' | 'profile' | 'source_apk' | 'backup_reset'>('login');

  // Account form states
  const [identifier, setIdentifier] = useState(account.identifier || '');
  const [password, setPassword] = useState(account.password || '');
  const [displayName, setDisplayName] = useState(account.name || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ZIP download state
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  // PWA install state
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  // In-app confirmations
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    if (account.identifier) setIdentifier(account.identifier);
    if (account.password) setPassword(account.password);
    if (account.name) setDisplayName(account.name);
  }, [account, isOpen]);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const appUrl = window.location.origin;

  const copyAppUrl = () => {
    try {
      navigator.clipboard.writeText(appUrl);
    } catch {}
    setMsg({ type: 'success', text: isBn ? 'অ্যাপ লিংক সফলভাবে কপি করা হয়েছে!' : 'App link copied to clipboard!' });
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId) {
      setMsg({ type: 'error', text: 'অনুগ্রহ করে ব্যবহারকারী আইডি বা মোবাইল নম্বর দিন।' });
      return;
    }
    if (!cleanPass) {
      setMsg({ type: 'error', text: 'অনুগ্রহ করে পাসওয়ার্ড অথবা পিন (PIN) দিন।' });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch('/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          password: cleanPass,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        const updatedAcc: UserAccount = {
          identifier: cleanId,
          password: cleanPass,
          name: displayName.trim() || result.account?.name || cleanId,
          isLoggedIn: true,
          lastSyncedAt: new Date().toISOString(),
        };

        onUpdateAccount(updatedAcc);

        // Check for backup payload from server or local fallback
        let backupData = result.backup;
        if (!backupData) {
          const localSaved = localStorage.getItem('deeniyat_user_backup_' + cleanId);
          if (localSaved) {
            try {
              backupData = JSON.parse(localSaved);
            } catch {}
          }
        }

        if (backupData) {
          const restored = normalizeMaktabData(backupData);
          restored.account = updatedAcc;
          onRestoreData(restored);
          saveToStorage(restored);
          localStorage.setItem('deeniyat_user_backup_' + cleanId, JSON.stringify(restored));

          setMsg({
            type: 'success',
            text: `✅ লগইন সফল! আইডি (${cleanId}) এর পূর্বের সংরক্ষিত সকল হিসাব, কেন্দ্র ও শিক্ষার্থী সফলভাবে ফিরে এসেছে।`,
          });
        } else {
          // Fresh account: sync current store
          const currentStoreWithAcc = { ...data, account: updatedAcc };
          await syncWithCloudServer(currentStoreWithAcc);
          localStorage.setItem('deeniyat_user_backup_' + cleanId, JSON.stringify(currentStoreWithAcc));

          setMsg({
            type: 'success',
            text: `✅ সফলভাবে নতুন একাউন্টে লগইন হয়েছে! বর্তমান সকল তথ্য এই আইডিতে (${cleanId}) সংরক্ষিত হয়েছে।`,
          });
        }
      } else {
        setMsg({
          type: 'error',
          text: result.error || 'ভুল পাসওয়ার্ড অথবা লগইন ব্যর্থ হয়েছে। সঠিক তথ্য দিন।',
        });
      }
    } catch {
      // Offline fallback
      const updatedAcc: UserAccount = {
        identifier: cleanId,
        password: cleanPass,
        name: displayName.trim() || cleanId,
        isLoggedIn: true,
        lastSyncedAt: new Date().toISOString(),
      };
      onUpdateAccount(updatedAcc);

      const localSaved = localStorage.getItem('deeniyat_user_backup_' + cleanId);
      if (localSaved) {
        try {
          const restored = normalizeMaktabData(JSON.parse(localSaved));
          restored.account = updatedAcc;
          onRestoreData(restored);
          saveToStorage(restored);
        } catch {}
      }

      setMsg({
        type: 'success',
        text: 'অফলাইন মোডে আইডি ও পাসওয়ার্ড সংরক্ষিত হয়েছে এবং ডাটা ফিরে এসেছে।',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSyncNow = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const result = await syncWithCloudServer(data);
      if (result.success) {
        const cleanId = (account.identifier || identifier).trim().toLowerCase();
        if (cleanId) {
          localStorage.setItem('deeniyat_user_backup_' + cleanId, JSON.stringify(data));
        }
        setMsg({
          type: 'success',
          text: '✅ ক্লাউড সার্ভারে সমস্ত তথ্য সফলভাবে ব্যাকআপ ও সিঙ্ক সম্পন্ন হয়েছে!',
        });
      } else {
        setMsg({
          type: 'error',
          text: 'সিঙ্ক করা সম্ভব হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।',
        });
      }
    } catch {
      setMsg({ type: 'error', text: 'সার্ভার সংযোগে সমস্যা হয়েছে।' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deeniyat_maktab_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const normalized = normalizeMaktabData(parsed);
        onRestoreData(normalized);
        saveToStorage(normalized);
        setMsg({
          type: 'success',
          text: '✅ ফাইল থেকে পূর্বের সকল তথ্য সফলভাবে ড্যাশবোর্ডে ফিরিয়ে আনা হয়েছে!',
        });
      } catch {
        setMsg({
          type: 'error',
          text: 'অবৈধ ব্যাকআপ ফাইল। অনুগ্রহ করে সঠিক JSON ফাইল নির্বাচন করুন।',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSourceZip = async () => {
    setIsDownloadingZip(true);
    setZipSuccess(false);

    try {
      const response = await fetch('/api/download-source-zip');
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deeniyat-maktab-satkhira-source-code.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 6000);
    } catch {
      window.location.href = '/api/download-source-zip';
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleInstallPWA = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      const { outcome } = await pwaPrompt.userChoice;
      if (outcome === 'accepted') {
        setPwaInstalled(true);
      }
      setPwaPrompt(null);
    } else {
      setMsg({
        type: 'success',
        text: isBn
          ? 'আপনার ব্রাউজারের ৩-ডট (⋮) মেনুতে চাপ দিয়ে "Add to Home screen" অথবা "Install App" চাপুন।'
          : 'Please open browser menu (⋮) and select "Add to Home screen" or "Install App".',
      });
    }
  };

  const executeLogout = () => {
    const emptyAcc: UserAccount = {
      identifier: '',
      password: '',
      name: '',
      isLoggedIn: false,
    };
    onUpdateAccount(emptyAcc);
    setIdentifier('');
    setPassword('');
    setDisplayName('');
    setConfirmLogoutOpen(false);
    setMsg({ type: 'success', text: 'সফলভাবে লগআউট সম্পন্ন হয়েছে।' });
  };

  // Stats calculation for profile
  const branchCount = data.branches?.length || 0;
  const studentCount = data.students?.length || 0;
  const totalFees = (data.feePayments || []).reduce((s, f) => s + (f.amount || 0), 0);
  const totalExpenses = (data.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        
        {/* ========================================================
            HEADER: Bold, High-Contrast Title & Close Button
            ======================================================== */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/40 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border-2 border-emerald-400/60 flex items-center justify-center text-emerald-300 text-lg shadow-md">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white tracking-wide">
                মক্তব একাউন্ট ও ক্লাউড ডাটা
              </h3>
              <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                আইডি ও পাসওয়ার্ড দিয়ে সকল হিসাব আজীবন সুরক্ষিত রাখুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-rose-600/80 border border-white/20 flex items-center justify-center text-gray-200 hover:text-white transition cursor-pointer shadow"
            title="বন্ধ করুন"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* ========================================================
            ACCOUNT STATUS BANNER (সবার উপরে স্পষ্ট স্ট্যাটাস কার্ড)
            ======================================================== */}
        <div className="px-4 sm:px-5 pt-4">
          {account.isLoggedIn && account.identifier ? (
            <div className="p-3.5 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border-2 border-emerald-400 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse mt-1 shrink-0"></div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 px-2 py-0.5 rounded-full font-bold">
                      ✓ লগইন সক্রিয়
                    </span>
                    <span className="text-sm font-black text-white">
                      আইডি: <span className="font-mono text-amber-300">{account.identifier}</span>
                    </span>
                    {account.name && (
                      <span className="text-xs text-gray-300">({account.name})</span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-200 mt-1 font-medium">
                    সংরক্ষিত: <b className="text-white">{toBnNum(branchCount, isBn)}</b> কেন্দ্র •{' '}
                    <b className="text-white">{toBnNum(studentCount, isBn)}</b> শিক্ষার্থী •{' '}
                    মোট ফি: <b className="text-amber-300">{toBnCurrency(totalFees, isBn)}</b>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleManualSyncNow}
                  disabled={loading}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow active:scale-95 transition cursor-pointer"
                  title="ক্লাউডে সিঙ্ক করুন"
                >
                  <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'}`}></i>
                  <span>সিঙ্ক করুন</span>
                </button>
                {!confirmLogoutOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmLogoutOpen(true)}
                    className="px-2.5 py-2 bg-rose-600/30 hover:bg-rose-600/60 border border-rose-500/50 text-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="লগআউট"
                  >
                    <i className="fa-solid fa-power-off"></i>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={executeLogout}
                      className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold"
                    >
                      লগআউট?
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmLogoutOpen(false)}
                      className="px-1.5 py-1 bg-slate-700 text-gray-300 rounded-lg text-[10px]"
                    >
                      না
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-gradient-to-r from-amber-950/90 to-rose-950/80 border-2 border-amber-500/80 rounded-2xl shadow-lg flex items-start gap-3">
              <i className="fa-solid fa-circle-exclamation text-amber-400 text-lg mt-0.5 shrink-0"></i>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-200">
                  সতর্কতা: এখনো কোনো একাউন্টে লগইন করা নেই!
                </h4>
                <p className="text-xs text-gray-200 mt-0.5 leading-relaxed">
                  নিচের ঘরে আপনার <b>আইডি (মোবাইল নম্বর)</b> ও <b>পাসওয়ার্ড</b> দিন। পূর্বে তথ্য সেভ করা থাকলে সাথে সাথে ফিরে আসবে, অথবা নতুন একাউন্ট চালু হবে।
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            4 CLEAR, LARGE TABS (স্পষ্ট ও বড় আকারের ট্যাব)
            ======================================================== */}
        <div className="px-4 sm:px-5 pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            {/* Tab 1 */}
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400 shadow-emerald-950/50'
                  : 'bg-slate-900/80 text-gray-300 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
            >
              <i className="fa-solid fa-key text-amber-300 text-sm"></i>
              <span>আইডি ও পাসওয়ার্ড</span>
            </button>

            {/* Tab 2 */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400 shadow-emerald-950/50'
                  : 'bg-slate-900/80 text-gray-300 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
            >
              <i className="fa-solid fa-address-card text-teal-300 text-sm"></i>
              <span>একাউন্ট প্রোফাইল</span>
            </button>

            {/* Tab 3 */}
            <button
              type="button"
              onClick={() => setActiveTab('source_apk')}
              className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow ${
                activeTab === 'source_apk'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400 shadow-emerald-950/50'
                  : 'bg-slate-900/80 text-gray-300 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
            >
              <i className="fa-solid fa-file-zipper text-cyan-300 text-sm"></i>
              <span>সোর্স কোড ও APK</span>
            </button>

            {/* Tab 4 */}
            <button
              type="button"
              onClick={() => setActiveTab('backup_reset')}
              className={`py-2.5 px-2 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow ${
                activeTab === 'backup_reset'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400 shadow-emerald-950/50'
                  : 'bg-slate-900/80 text-gray-300 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
            >
              <i className="fa-solid fa-database text-rose-300 text-sm"></i>
              <span>ব্যাকআপ ও রিসেট</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Status / Error / Success Message */}
          {msg && (
            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-start gap-2.5 border-2 shadow-lg animate-in fade-in duration-200 ${
                msg.type === 'success'
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
                  : 'bg-rose-950 border-rose-500 text-rose-200'
              }`}
            >
              <i
                className={`fa-solid mt-0.5 text-base shrink-0 ${
                  msg.type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-rose-400'
                }`}
              ></i>
              <span className="leading-relaxed">{msg.text}</span>
            </div>
          )}

          {/* ========================================================
              TAB 1: আইডি ও পাসওয়ার্ড দিয়ে লগইন / রিস্টোর (PROMINENT & CLEAR)
              ======================================================== */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <div className="bg-slate-800/90 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
                
                <div className="border-b border-emerald-500/30 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                      <i className="fa-solid fa-right-to-bracket text-sm"></i>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white">
                        আইডি ও পাসওয়ার্ড প্রবেশ করুন
                      </h4>
                      <p className="text-xs text-emerald-300 font-medium">
                        পূর্বে সংরক্ষিত তথ্য ফিরে পেতে আপনার আইডি ও পাসওয়ার্ড দিন
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono bg-emerald-900/60 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-lg">
                    Cloud v5
                  </span>
                </div>

                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  {/* Field 1: User ID */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-emerald-200 flex items-center gap-1.5 mb-1.5">
                      <i className="fa-solid fa-id-card text-amber-400"></i>
                      <span>ইউজার আইডি বা মোবাইল নম্বর:</span>
                      <span className="text-rose-400 font-black">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="যেমন: 01998-229630 অথবা আপনার নাম/আইডি"
                        className="w-full bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-2xl px-4 py-3 text-sm sm:text-base text-white font-bold placeholder-gray-500 outline-none transition shadow-inner font-mono"
                        required
                      />
                      <i className="fa-solid fa-user absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      যে আইডি দিয়ে আগে ডাটা সেভ করেছেন তা দিন (যেমন মোবাইল নম্বর)।
                    </span>
                  </div>

                  {/* Field 2: Password with Show/Hide Toggle */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-emerald-200 flex items-center gap-1.5 mb-1.5">
                      <i className="fa-solid fa-lock text-amber-400"></i>
                      <span>পাসওয়ার্ড অথবা পিন (PIN):</span>
                      <span className="text-rose-400 font-black">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="আপনার ৪ বা ৬ ডিজিটের পাসওয়ার্ড বা পিন"
                        className="w-full bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-2xl px-4 py-3 text-sm sm:text-base text-white font-bold placeholder-gray-500 outline-none transition shadow-inner pr-12 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-gray-300 hover:text-amber-300 text-sm rounded-lg transition cursor-pointer"
                        title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                      >
                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash text-amber-400' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      আইডির জন্য যেকোনো গোপন পাসওয়ার্ড দিন যা দিয়ে পরে ডাটা ফিরিয়ে আনবেন।
                    </span>
                  </div>

                  {/* Field 3: Display Name (Optional) */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-emerald-200 flex items-center gap-1.5 mb-1.5">
                      <i className="fa-solid fa-signature text-teal-400"></i>
                      <span>আপনার নাম বা প্রতিষ্ঠানের নাম (ঐচ্ছিক):</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="যেমন: হাফেজ মাওঃ আব্দুর রহমান"
                      className="w-full bg-slate-950 border border-emerald-500/40 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none transition shadow-inner"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer border border-emerald-300/40"
                  >
                    <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-right-to-bracket'} text-lg`}></i>
                    <span>
                      {loading
                        ? 'ডাটা যাচাই ও রিস্টোর হচ্ছে...'
                        : 'আইডি ও পাসওয়ার্ড দিয়ে প্রবেশ করুন (ডাটা ফিরিয়ে আনুন)'}
                    </span>
                  </button>
                </form>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-gray-300 space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>সহজ নিয়মাবলী:</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    ১. পূর্বে ডাটা সেভ করে থাকলে সেই আইডি ও পাসওয়ার্ড দিলে আপনার সকল কেন্দ্র ও হিসাব অবিকল ফেরত আসবে।<br />
                    ২. প্রথমবারের মতো হলে যেকোনো আইডি ও পাসওয়ার্ড দিয়ে সাবমিট করলেই সাথে সাথে সুরক্ষিত ক্লাউড একাউন্ট তৈরি হয়ে যাবে।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: একাউন্ট প্রোফাইল ও বিস্তারিত তথ্য (PROFILE & STATS)
              ======================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-slate-800/90 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h4 className="font-black text-sm sm:text-base text-teal-300 flex items-center gap-2">
                    <i className="fa-solid fa-id-badge text-emerald-400"></i>
                    <span>বর্তমান একাউন্ট বিবরণী</span>
                  </h4>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    account.isLoggedIn
                      ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
                      : 'bg-rose-950 border-rose-500 text-rose-200'
                  }`}>
                    {account.isLoggedIn ? '● লগইন সক্রিয়' : '○ লগইন নেই'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-gray-400 block">ব্যবহারকারী আইডি:</span>
                    <span className="text-sm font-black text-white font-mono">
                      {account.identifier || 'কোনো আইডি যুক্ত নেই'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-gray-400 block">ব্যবহারকারীর নাম:</span>
                    <span className="text-sm font-black text-emerald-300">
                      {account.name || 'নাম যুক্ত নেই'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-gray-400 block">সর্বশেষ ব্যাকআপ সিঙ্ক:</span>
                    <span className="text-xs font-bold text-amber-300">
                      {account.lastSyncedAt
                        ? new Date(account.lastSyncedAt).toLocaleString('bn-BD')
                        : 'এখনো সিঙ্ক করা হয়নি'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-gray-400 block">সার্ভার স্ট্যাটাস:</span>
                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5 mt-0.5">
                      <i className="fa-solid fa-server"></i>
                      <span>অনলাইন ক্লাউড ডাটাবেস সক্রিয়</span>
                    </span>
                  </div>
                </div>

                {/* Saved Data Breakdown */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-xs text-amber-300">এই ডিভাইসে সংরক্ষিত মক্তব ডাটা:</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-gray-400 block">মোট কেন্দ্র</span>
                      <span className="text-base font-black text-emerald-400">{toBnNum(branchCount, isBn)}</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-gray-400 block">মোট শিক্ষার্থী</span>
                      <span className="text-base font-black text-teal-400">{toBnNum(studentCount, isBn)}</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-gray-400 block">আদায়কৃত ফি</span>
                      <span className="text-xs font-black text-amber-400">{toBnCurrency(totalFees, isBn)}</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-gray-400 block">মোট ব্যয়</span>
                      <span className="text-xs font-black text-rose-400">{toBnCurrency(totalExpenses, isBn)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleManualSyncNow}
                    disabled={loading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition shadow cursor-pointer"
                  >
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                    <span>এখনই ক্লাউডে সব সেভ করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-750 border border-emerald-400/50 text-emerald-300 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <i className="fa-solid fa-key"></i>
                    <span>আইডি পরিবর্তন</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: সোর্স কোড (ZIP) ও APK গাইড (USER: একাউন্টের মধ্যে থাকবে)
              ======================================================== */}
          {activeTab === 'source_apk' && (
            <div className="space-y-4">
              {/* 1-Click ZIP Download */}
              <div className="bg-slate-800/90 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 text-center space-y-3.5 shadow-xl">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white text-3xl shadow-lg">
                  <i className="fa-solid fa-file-zipper"></i>
                </div>
                <div>
                  <h4 className="text-base font-black text-white">
                    সম্পূর্ণ সোর্স কোড জিপ (ZIP) প্যাকেজ
                  </h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed max-w-md mx-auto">
                    অ্যাপের সমস্ত React, Vite, Express সার্ভার এবং Tailwind CSS কোড একটি জিপ ফাইলে ডাউনলোড করে আপনার কম্পিউটারে সংরক্ষণ করতে পারবেন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSourceZip}
                  disabled={isDownloadingZip}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-2xl active:scale-98 transition cursor-pointer border border-emerald-300/40"
                >
                  <i className={`fa-solid ${isDownloadingZip ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-down'} text-xl`}></i>
                  <span>
                    {isDownloadingZip
                      ? 'জিপ ফাইল প্রস্তুত ও ডাউনলোড হচ্ছে...'
                      : '১-ক্লিকে সম্পূর্ণ সোর্স কোড ডাউনলোড করুন (.zip)'}
                  </span>
                </button>

                {zipSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950 border-2 border-emerald-400 text-emerald-200 text-xs font-bold animate-in fade-in">
                    ✓ সম্পূর্ণ সোর্স কোড সফলভাবে ডাউনলোড শুরু হয়েছে!
                  </div>
                )}

                {/* Direct HTML File Download Button */}
                <div className="pt-1">
                  <a
                    href="/api/download-html"
                    download="deeniyat_maktab_satkhira.html"
                    className="w-full py-3 bg-slate-950 hover:bg-slate-900 border-2 border-emerald-400 text-emerald-300 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow cursor-pointer text-center block"
                  >
                    <i className="fa-brands fa-html5 text-amber-400 text-base"></i>
                    <span>📄 সরাসরি HTML ফাইল ডাউনলোড করুন (.html)</span>
                  </a>
                </div>
              </div>

              {/* Mobile App Install (PWA) One-Click */}
              <div className="bg-gradient-to-r from-teal-950/80 to-slate-900 border-2 border-teal-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600/30 border border-teal-400/50 flex items-center justify-center text-teal-300 text-xl shrink-0">
                    <i className="fa-solid fa-mobile-screen-button"></i>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">প্লে-স্টোর ছাড়াই সরাসরি ফোনে ইনস্টল</h5>
                    <p className="text-xs text-teal-200">হোমস্ক্রিনে আসল মোবাইল অ্যাপের মতো এক ক্লিকে ইনস্টল করুন</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInstallPWA}
                  className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm rounded-xl shadow active:scale-95 transition cursor-pointer shrink-0"
                >
                  📲 ফোনে ইনস্টল করুন
                </button>
              </div>

              {/* APK Creation Guides */}
              <div className="bg-slate-800/90 border-2 border-cyan-500/40 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <h4 className="font-black text-sm text-cyan-300 flex items-center gap-2">
                    <i className="fa-brands fa-android text-emerald-400 text-base"></i>
                    <span>অ্যান্ড্রয়েড মোবাইল APK তৈরির ৩টি সহজ উপায়</span>
                  </h4>
                  <button
                    type="button"
                    onClick={copyAppUrl}
                    className="text-xs bg-cyan-600/30 hover:bg-cyan-600/60 border border-cyan-400/50 text-cyan-200 px-3 py-1 rounded-xl font-bold cursor-pointer"
                  >
                    🔗 অ্যাপ লিংক কপি
                  </button>
                </div>

                {/* Method 1 */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">১</span>
                    <span className="font-bold text-xs sm:text-sm text-emerald-300">পদ্ধতি ১: WebIntoApp (সবচেয়ে সহজ - ১ মিনিটে অনলাইন থেকে APK)</span>
                  </div>
                  <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1 pl-1 leading-relaxed">
                    <li>যেকোনো ব্রাউজারে যান: <b className="text-amber-300">webintoapp.com</b></li>
                    <li>"Make App" এ চাপ দিয়ে আপনার অ্যাপ লিংকটি পেস্ট করুন।</li>
                    <li>অ্যাপের নাম দিন: <b className="text-emerald-300">দ্বীনিয়াত মক্তব সাতক্ষীরা</b></li>
                    <li>"Create App" চাপলেই সরাসরি <b className="text-amber-300">.apk</b> ডাউনলোড হয়ে যাবে।</li>
                  </ol>
                </div>

                {/* Method 2 */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center">২</span>
                    <span className="font-bold text-xs sm:text-sm text-teal-300">পদ্ধতি ২: PWABuilder (প্লে-স্টোর উপযোগী অফিশিয়াল APK/AAB)</span>
                  </div>
                  <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1 pl-1 leading-relaxed">
                    <li>ভিজিট করুন: <b className="text-amber-300">pwabuilder.com</b> এবং অ্যাপ লিংকটি দিন।</li>
                    <li>"Start" চেপে "Package for Android" সিলেক্ট করুন।</li>
                    <li>প্লে-স্টোর ও মোবাইলের জন্য সাইনড APK এবং .aab বান্ডিল পেয়ে যাবেন।</li>
                  </ol>
                </div>

                {/* Method 3 */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">৩</span>
                    <span className="font-bold text-xs sm:text-sm text-cyan-300">পদ্ধতি ৩: Capacitor ও Android Studio (সোর্স কোড দিয়ে অফলাইনে)</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    সোর্স কোড ZIP ডাউনলোড করে কম্পিউটারে Android Studio দিয়ে সম্পূর্ণ অফলাইন নেটিভ APK তৈরি করা যাবে।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: ব্যাকআপ ফাইল (JSON) ও ফ্রেশ রিসেট (DATA RESET)
              ======================================================== */}
          {activeTab === 'backup_reset' && (
            <div className="space-y-4">
              {/* File Export */}
              <div className="bg-slate-800/90 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
                <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
                  <i className="fa-solid fa-file-export text-base"></i>
                  <span>অফলাইন ব্যাকআপ ফাইল ডাউনলোড (JSON Export)</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  আপনার সম্পূর্ণ মক্তবের সকল কেন্দ্র, শিক্ষার্থী ও যাবতীয় আয়-ব্যয়ের ডাটা একটি .json ব্যাকআপ ফাইল হিসেবে ডাউনলোড করে কম্পিউটার বা পেনড্রাইভে রাখতে পারেন।
                </p>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full py-3 bg-slate-950 hover:bg-slate-900 border-2 border-emerald-400 text-emerald-300 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow cursor-pointer"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>সম্পূর্ণ ব্যাকআপ ফাইল ডাউনলোড করুন (.json)</span>
                </button>
              </div>

              {/* File Import */}
              <div className="bg-slate-800/90 border-2 border-teal-500/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
                <div className="font-bold text-sm text-teal-300 flex items-center gap-2">
                  <i className="fa-solid fa-file-import text-base"></i>
                  <span>ফাইল থেকে পূর্বের ডাটা ফিরিয়ে আনা (Import)</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  পূর্বে ডাউনলোড করা যেকোনো .json ব্যাকআপ ফাইল আপলোড করলেই সাথে সাথে পূর্বের সকল তথ্য অবিকল পুনঃস্থাপন হয়ে যাবে।
                </p>
                <label className="w-full py-3 bg-slate-950 hover:bg-slate-900 border-2 border-teal-400 text-teal-300 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow cursor-pointer">
                  <i className="fa-solid fa-upload"></i>
                  <span>কম্পিউটার/মোবাইল থেকে ব্যাকআপ ফাইল নির্বাচন করুন</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Danger Zone: Reset Everything */}
              <div className="bg-rose-950/70 border-2 border-rose-500/70 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
                <div className="font-black text-sm text-rose-300 flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation text-base"></i>
                  <span>সকল এন্ট্রি ডিলিট ও সম্পূর্ণ ফ্রেশ রিসেট</span>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed">
                  পূর্বে এন্ট্রি করা সকল কেন্দ্র, শিক্ষার্থী, বেতন ও খরচের হিসাব স্থায়ীভাবে মুছে ফেলে অ্যাপটিকে একদম প্রথম দিনের মতো ফ্রেশ ও খালি অবস্থায় রূপান্তর করুন।
                </p>
                {!confirmResetOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(true)}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow cursor-pointer"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>সকল ডাটা মুছুন ও ফ্রেশ রিসেট করুন</span>
                  </button>
                ) : (
                  <div className="bg-rose-950/90 border border-rose-500 p-3 rounded-2xl space-y-2">
                    <p className="text-xs text-rose-200 font-bold text-center">
                      ⚠️ আপনি কি নিশ্চিত যে সমস্ত এন্ট্রি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না!
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmResetOpen(false)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-xl text-xs"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmResetOpen(false);
                          if (onResetAllData) {
                            onResetAllData();
                          }
                          onClose();
                        }}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow"
                      >
                        হ্যাঁ, সমস্ত ডাটা মুছুন
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Contacts */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-gray-300 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <p className="font-extrabold text-white">{t.directorLabel} {DIRECTOR_NAME}</p>
              <p className="text-amber-300 font-mono">{t.mobileLabel} {toBnNum(DIRECTOR_PHONE, isBn)}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-bold text-teal-200">{t.developerLabel} {DEVELOPER_NAME}</p>
              <p className="text-teal-400 font-mono">{t.mobileLabel} {toBnNum(DEVELOPER_PHONE, isBn)}</p>
            </div>
          </div>
        </div>

        {/* Modal Close Button */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
