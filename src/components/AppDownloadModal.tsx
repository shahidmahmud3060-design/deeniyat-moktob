import React, { useState, useEffect } from 'react';
import { translations, Language } from '../utils/translations';
import { DIRECTOR_NAME, DIRECTOR_PHONE, DEVELOPER_NAME, DEVELOPER_PHONE } from '../utils/storage';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'zip' | 'apk' | 'pwa'>('zip');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const handleDownloadSourceZip = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const response = await fetch('/api/download-source-zip');
      if (!response.ok) {
        throw new Error('Server returned error');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deeniyat-maktab-satkhira-source-code.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (e) {
      console.error('Download error:', e);
      // Fallback direct navigation
      window.location.href = '/api/download-source-zip';
    } finally {
      setIsDownloading(false);
    }
  };

  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
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
      showToast(
        isBn
          ? 'আপনার ব্রাউজারের থ্রি-ডট (⋮) মেনুতে চাপ দিয়ে "Add to Home screen" বা "Install App" সিলেক্ট করুন।'
          : 'Please open browser menu (⋮) and tap "Add to Home screen" or "Install App".'
      );
    }
  };

  const appUrl = window.location.origin;

  const copyAppUrl = () => {
    try {
      navigator.clipboard.writeText(appUrl);
    } catch {}
    showToast(isBn ? 'অ্যাপ লিংক কপি করা হয়েছে!' : 'App link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-teal-950 via-emerald-950 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <i className="fa-solid fa-file-zipper text-sm"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {isBn ? 'সোর্স কোড জিপ (ZIP) ও APK গাইড' : 'Source Code ZIP & APK Guide'}
              </h3>
              <p className="text-[10px] text-emerald-300">
                {isBn ? 'দ্বীনিয়াত মক্তব সাতক্ষীরা' : 'Deeniyat Maktab Satkhira'}
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

        {/* Tab Switcher */}
        <div className="flex border-b border-emerald-500/20 bg-slate-950/70 p-1.5 gap-1.5 sticky top-[65px] z-10">
          <button
            type="button"
            onClick={() => setActiveTab('zip')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'zip'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-download"></i>
            <span>{isBn ? 'ZIP ডাউনলোড' : 'Download ZIP'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-brands fa-android"></i>
            <span>{isBn ? 'APK তৈরির নিয়ম' : 'Make APK'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-mobile-screen"></i>
            <span>{isBn ? 'মোবাইল অ্যাপ' : 'Mobile App'}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 space-y-4">
          {toastMsg && (
            <div className="bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-lg animate-fade-in">
              <i className="fa-solid fa-circle-check text-emerald-400"></i>
              <span>{toastMsg}</span>
            </div>
          )}

          {/* TAB 1: ZIP DOWNLOAD */}
          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-2xl shadow-lg">
                  <i className="fa-solid fa-file-zipper"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {isBn ? 'সম্পূর্ণ সোর্স কোড জিপ (ZIP) প্যাকেজ' : 'Complete Source Code Archive'}
                  </h4>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                    {isBn
                      ? 'অ্যাপের সমস্ত React, Vite, Express সার্ভার এবং Tailwind CSS কোড একটি জিপ ফাইলে ডাউনলোড করুন।'
                      : 'Download full application source code including React frontend, Express server, and styles.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSourceZip}
                  disabled={isDownloading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
                >
                  <i className={`fa-solid ${isDownloading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-down'} text-base`}></i>
                  <span>
                    {isDownloading
                      ? (isBn ? 'জিপ তৈরি ও ডাউনলোড হচ্ছে...' : 'Generating ZIP Archive...')
                      : (isBn ? '১-ক্লিকে সম্পূর্ণ সোর্স কোড ডাউনলোড করুন (.zip)' : 'Download Source Code (.zip)')}
                  </span>
                </button>

                {downloadSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold">
                    ✓ জিপ ফাইল সফলভাবে ডাউনলোড শুরু হয়েছে!
                  </div>
                )}
              </div>

              {/* Codebase Details */}
              <div className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-code text-xs"></i>
                  <span>প্রজেক্টের ফাইল ও ফোল্ডার বিবরণী:</span>
                </div>
                <div className="font-mono text-[11px] text-gray-300 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-emerald-400">📁 src/components/ - সকল ড্যাশবোর্ড ও মডাল কম্পোনেন্ট</div>
                  <div className="text-emerald-400">📁 src/utils/ - স্টোরেজ, হিসাব ও বাংলা অনুবাদ লজিক</div>
                  <div className="text-teal-300">📄 server.ts - নোড এক্সপ্রেস ব্যাকএন্ড সার্ভার ও ব্যাকআপ API</div>
                  <div className="text-teal-300">📄 vite.config.ts & package.json - কনফিগারেশন ও লাইব্রেরি</div>
                  <div className="text-amber-300">📄 index.html - মোবাইল-ফ্রেন্ডলি এন্ট্রি ফাইল</div>
                </div>

                <div className="text-[11px] text-gray-400 leading-relaxed pt-1">
                  <b>লোকাল রান করার কমান্ড:</b>
                  <div className="mt-1 bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-emerald-300">
                    <div>1. unzip deeniyat-maktab-satkhira-source-code.zip</div>
                    <div>2. cd deeniyat-maktab-satkhira</div>
                    <div>3. npm install</div>
                    <div>4. npm run dev</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APK CREATION GUIDE */}
          {activeTab === 'apk' && (
            <div className="space-y-3.5 text-xs text-gray-300">
              {/* App URL Box */}
              <div className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-3 space-y-1.5">
                <div className="text-[11px] text-emerald-300 font-bold flex justify-between items-center">
                  <span>আপনার অ্যাপের বর্তমান লিংক:</span>
                  <button
                    type="button"
                    onClick={copyAppUrl}
                    className="text-[10px] bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 px-2 py-0.5 rounded-lg border border-emerald-500/40 font-bold"
                  >
                    লিংক কপি
                  </button>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 break-all select-all">
                  {appUrl}
                </div>
              </div>

              {/* Method 1: WebIntoApp */}
              <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    ১
                  </span>
                  <h4 className="font-bold text-emerald-300 text-xs">
                    পদ্ধতি ১: WebIntoApp (সবচেয়ে সহজ - ১ মিনিটে অনলাইন থেকে APK)
                  </h4>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] pl-1 leading-relaxed">
                  <li>ব্রাউজারে ভিজিট করুন: <b className="text-amber-300">webintoapp.com</b> অথবা <b className="text-amber-300">appsgeyser.com</b></li>
                  <li>"Make App" অপশনে উপরের অ্যাপ লিংকটি পেস্ট করুন।</li>
                  <li>অ্যাপের নাম দিন: <b className="text-emerald-300">দ্বীনিয়াত মক্তব সাতক্ষীরা</b></li>
                  <li>আইকন হিসেবে যেকোনো সুন্দর ইসলামিক লোগো সিলেক্ট করুন।</li>
                  <li>"Create App" বাটনে চাপ দিলেই সরাসরি <b className="text-amber-300">.apk</b> ফাইল ডাউনলোড হবে।</li>
                  <li>ডাউনলোডকৃত APK ফাইলটি যেকোনো অ্যান্ড্রয়েড মোবাইলে ইনস্টল করে চালান!</li>
                </ol>
              </div>

              {/* Method 2: PWABuilder (Google TWA) */}
              <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    ২
                  </span>
                  <h4 className="font-bold text-teal-300 text-xs">
                    পদ্ধতি ২: PWABuilder (গুগল প্লে-স্টোর উপযোগী অফিসিয়াল APK/AAB)
                  </h4>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] pl-1 leading-relaxed">
                  <li>ভিজিট করুন: <b className="text-amber-300">pwabuilder.com</b></li>
                  <li>আপনার অ্যাপ লিংকটি দিয়ে <b>"Start"</b> বাটনে চাপ দিন।</li>
                  <li>PWABuilder অ্যাপটিকে ভেরিফাই করবে।</li>
                  <li><b>"Package for Android"</b> সিলেক্ট করুন।</li>
                  <li>সরাসরি সাইনড APK এবং Google Play Store এ পাবলিশ করার উপযোগী <b>.aab</b> প্যাকেজ পেয়ে যাবেন।</li>
                </ol>
              </div>

              {/* Method 3: Capacitor & Android Studio */}
              <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    ৩
                  </span>
                  <h4 className="font-bold text-cyan-300 text-xs">
                    পদ্ধতি ৩: Capacitor ও Android Studio (সোর্স কোড দিয়ে)
                  </h4>
                </div>
                <p className="text-[11px] leading-relaxed">
                  এই অ্যাপের সোর্স কোড ZIP ডাউনলোড করার পর কম্পিউটারে Android Studio দিয়ে সম্পূর্ণ নেটিভ APK বানাতে পারবেন:
                </p>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[10px] text-emerald-300 space-y-1">
                  <div>npm install @capacitor/core @capacitor/cli @capacitor/android</div>
                  <div>npx cap init "দ্বীনিয়াত মক্তব" "com.deeniyat.satkhira"</div>
                  <div>npm run build</div>
                  <div>npx cap add android</div>
                  <div>npx cap copy</div>
                  <div>npx cap open android</div>
                </div>
                <p className="text-[10px] text-gray-400">
                  Android Studio ওপেন হলে <b>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</b> এ ক্লিক করলেই অফলাইন APK প্রস্তুত!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PWA MOBILE INSTALL */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white text-2xl shadow-lg">
                  <i className="fa-solid fa-mobile-screen-button"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {isBn ? 'সরাসরি মোবাইলের স্ক্রিনে অ্যাপ যুক্ত করুন' : 'Install Directly on Mobile Screen'}
                  </h4>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                    {isBn
                      ? 'প্লে-স্টোর ছাড়াও এই অ্যাপটি এক ক্লিকে আপনার ফোনে আসল অ্যাপের মতো ইনস্টল হয়ে যায় এবং অফলাইনেও দ্রুত চলে।'
                      : 'Install as Progressive Web App directly to your device home screen.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleInstallPWA}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>{isBn ? '📱 ফোনে এখনই অ্যাপ ইনস্টল করুন' : '📱 Install App on Mobile'}</span>
                </button>

                {pwaInstalled && (
                  <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold">
                    ✓ অ্যাপটি সফলভাবে আপনার মোবাইলে ইনস্টল হয়েছে!
                  </div>
                )}
              </div>

              {/* Step by Step instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Android Chrome */}
                <div className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-3 space-y-2">
                  <h5 className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    <i className="fa-brands fa-android text-emerald-400"></i>
                    <span>অ্যান্ড্রয়েড (Google Chrome)</span>
                  </h5>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-300">
                    <li>ক্রোম ব্রাউজারের উপরে ডানপাশের ৩-ডট (⋮) মেনুতে চাপ দিন।</li>
                    <li><b className="text-emerald-300">"Install App"</b> অথবা <b className="text-emerald-300">"Add to Home screen"</b> চাপুন।</li>
                    <li>অ্যাপের আইকন আপনার ফোনে চলে আসবে।</li>
                  </ol>
                </div>

                {/* iPhone Safari */}
                <div className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-3 space-y-2">
                  <h5 className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                    <i className="fa-brands fa-apple text-gray-200"></i>
                    <span>আইফোন (Apple Safari)</span>
                  </h5>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-300">
                    <li>সাফারি ব্রাউজারের নিচের শেয়ার (Share) আইকনে চাপ দিন।</li>
                    <li>স্ক্রল করে <b className="text-emerald-300">"Add to Home Screen"</b> অপশনে চাপ দিন।</li>
                    <li>উপরে "Add" চাপলেই হোমস্ক্রিনে অ্যাপ তৈরি হবে।</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Footer Contact Info */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] text-gray-400 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-200">পরিচালক: {DIRECTOR_NAME}</p>
              <p>মোবাইল: {DIRECTOR_PHONE}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-300">ডেভেলপার: {DEVELOPER_NAME}</p>
              <p>মোবাইল: {DEVELOPER_PHONE}</p>
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
