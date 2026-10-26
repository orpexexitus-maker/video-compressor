import { useState, useEffect } from "react";

declare global {
  interface Window { FFmpeg: any; }
}

const translations: any = {
  en: {
    home: "Home", offline: "offline · 100% private",
    dropTitle: "<strong>Click to upload</strong> a video", dropSub: "MP4, MOV, WebM (Max 100MB)",
    qualityHigh: "High Quality (Larger File)", qualityMed: "Balanced (Recommended)", qualityLow: "Low Quality (Smallest File)",
    resOriginal: "Original Resolution", res1080: "Downscale to 1080p", res720: "Downscale to 720p", res480: "Downscale to 480p",
    btnCompress: "Compress Video", btnDownload: "Download Compressed Video",
    statusReady: "Ready. Waiting for file...", statusLoading: "Loading engine...",
    statusCompressing: "Compressing... This may take a few minutes.", statusDone: "Compression complete!",
    statusError: "Error during compression.",
    errorSize: "Error: File is larger than 100MB. Please download the ORSPEX Desktop App for large files.",
    advertTitle: "Need to compress a larger file?",
    advertDesc: "Download the ORSPEX Desktop Compressor for unlimited file sizes, faster speeds, and 100% offline processing.",
    advertBtn: "Get Desktop App"
  },
  ar: {
    home: "الرئيسية", offline: "بدون إنترنت · خاص 100%",
    dropTitle: "<strong>انقر للتحميل</strong> فيديو", dropSub: "MP4, MOV, WebM (بحد أقصى 100 ميجابايت)",
    qualityHigh: "جودة عالية (ملف أكبر)", qualityMed: "متوازن (موصى به)", qualityLow: "جودة منخفضة (ملف أصغر)",
    resOriginal: "الدقة الأصلية", res1080: "تصغير إلى 1080p", res720: "تصغير إلى 720p", res480: "تصغير إلى 480p",
    btnCompress: "ضغط الفيديو", btnDownload: "تحميل الفيديو",
    statusReady: "جاهز. في انتظار الملف...", statusLoading: "جاري تحميل المحرك...",
    statusCompressing: "جاري الضغط...", statusDone: "اكتمل الضغط!",
    statusError: "خطأ أثناء الضغط.",
    errorSize: "خطأ: الملف أكبر من 100 ميجابايت. يرجى تنزيل تطبيق ORSPEX Desktop للملفات الكبيرة.",
    advertTitle: "تحتاج إلى ضغط ملف أكبر؟",
    advertDesc: "قم بتنزيل ORSPEX Desktop Compressor لأحجام ملفات غير محدودة وسرعات أسرع ومعالجة دون اتصال 100٪.",
    advertBtn: "احصل على تطبيق سطح المكتب"
  },
  zh: {
    home: "主页", offline: "离线 · 100% 私密",
    dropTitle: "<strong>点击上传</strong> 视频", dropSub: "MP4, MOV, WebM (最大 100MB)",
    qualityHigh: "高质量（文件较大）", qualityMed: "平衡（推荐）", qualityLow: "低质量（文件最小）",
    resOriginal: "原始分辨率", res1080: "缩小至 1080p", res720: "缩小至 720p", res480: "缩小至 480p",
    btnCompress: "压缩视频", btnDownload: "下载压缩视频",
    statusReady: "准备就绪。等待文件...", statusLoading: "加载引擎中...",
    statusCompressing: "压缩中...", statusDone: "压缩完成！",
    statusError: "压缩出错。",
    errorSize: "错误：文件大于 100MB。请下载 ORSPEX 桌面应用程序处理大文件。",
    advertTitle: "需要压缩更大的文件？",
    advertDesc: "下载 ORSPEX 桌面压缩器，享受无限文件大小、更快的速度和 100% 离线处理。",
    advertBtn: "获取桌面应用"
  }
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'ar' | 'zh'>('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState(translations['en'].statusReady);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  const [quality, setQuality] = useState("medium");
  const [resolution, setResolution] = useState("1080p");
  
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // 100MB Limit Check (100 * 1024 * 1024 bytes)
      if (file.size > 100 * 1024 * 1024) {
        setStatusText(t.errorSize);
        setSelectedFile(null);
        setDownloadUrl(null);
        e.target.value = ''; // Reset input
        return;
      }

      setSelectedFile(file);
      setStatusText(`${t.statusReady} (${file.name})`);
      setDownloadUrl(null);
    }
  };

  const compressVideo = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setStatusText(t.statusLoading);

    try {
      const { createFFmpeg } = window.FFmpeg;
      const ffmpeg = createFFmpeg({ 
        log: false,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js' 
      });

      if (!ffmpeg.isLoaded()) await ffmpeg.load();

      setStatusText(t.statusCompressing);
      
      ffmpeg.FS('writeFile', 'input.mp4', await window.FFmpeg.fetchFile(selectedFile));

      const crf = quality === 'high' ? '23' : (quality === 'medium' ? '28' : '32');
      
      let scaleFilter = '';
      if (resolution === '1080p') scaleFilter = 'scale=-2:1080';
      if (resolution === '720p') scaleFilter = 'scale=-2:720';
      if (resolution === '480p') scaleFilter = 'scale=-2:480';

      const args = [
        '-i', 'input.mp4', '-vcodec', 'libx264', '-preset', 'fast',
        '-crf', crf, '-acodec', 'aac', '-b:a', '128k'
      ];

      if (scaleFilter) args.push('-vf', scaleFilter);
      
      args.push('output.mp4');

      await ffmpeg.run(...args);

      const data = ffmpeg.FS('readFile', 'output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      
      setDownloadUrl(URL.createObjectURL(blob));
      setStatusText(t.statusDone);

    } catch (error) {
      console.error(error);
      setStatusText(t.statusError);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F8FAFC', fontFamily: lang === 'ar' ? 'Cairo, sans-serif' : (lang === 'zh' ? 'Noto Sans SC, sans-serif' : 'Montserrat, sans-serif'), position: 'relative', overflowX: 'hidden' }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* BACKGROUND */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.28, width: '100%', height: '100%' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#0F172A" strokeWidth="0.5" opacity="0.015"/>
            </pattern>
            <radialGradient id="fade-soft" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="0.45"/>
              <stop offset="55%" stopColor="white" stopOpacity="0.12"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
          </defs>

          <rect width="1600" height="900" fill="url(#grid)"/>

          <g className="orb-1"><circle cx="200" cy="200" r="220" fill="#6EE7A0" opacity="0.35"/><circle cx="200" cy="200" r="220" fill="url(#fade-soft)"/></g>
          <g className="orb-2"><circle cx="1300" cy="220" r="260" fill="#5BC0EB" opacity="0.3"/><circle cx="1300" cy="220" r="260" fill="url(#fade-soft)"/></g>
          <g className="orb-3"><circle cx="320" cy="720" r="240" fill="#2563EB" opacity="0.28"/><circle cx="320" cy="720" r="240" fill="url(#fade-soft)"/></g>
          <g className="orb-4"><circle cx="1180" cy="760" r="230" fill="#22C55E" opacity="0.3"/><circle cx="1180" cy="760" r="230" fill="url(#fade-soft)"/></g>
          <g className="orb-5"><circle cx="820" cy="440" r="150" fill="#5BC0EB" opacity="0.28"/><circle cx="820" cy="440" r="150" fill="url(#fade-soft)"/></g>

          <circle className="pulse-1" cx="500" cy="480" r="140" fill="none" stroke="#5BC0EB" strokeWidth="1" opacity="0.25"/>
          <circle className="pulse-2" cx="1080" cy="380" r="180" fill="none" stroke="#22C55E" strokeWidth="1" opacity="0.22"/>
          <circle className="pulse-3" cx="760" cy="620" r="110" fill="none" stroke="#5BC0EB" strokeWidth="1" opacity="0.22"/>

          <circle className="ring-1" cx="1300" cy="200" r="200" fill="none" stroke="#2563EB" strokeWidth="0.8" strokeDasharray="6 14" opacity="0.22"/>
          <circle className="ring-2" cx="250" cy="850" r="220" fill="none" stroke="#5BC0EB" strokeWidth="0.8" strokeDasharray="8 18" opacity="0.2"/>

          <circle className="dot-1" cx="340" cy="140" r="2.5" fill="#2563EB"/>
          <circle className="dot-2" cx="900" cy="120" r="2" fill="#5BC0EB"/>
          <circle className="dot-3" cx="1250" cy="480" r="2.5" fill="#22C55E"/>
          <circle className="dot-4" cx="1520" cy="700" r="2" fill="#6EE7A0"/>
          <circle className="dot-5" cx="600" cy="820" r="2.5" fill="#2563EB"/>
          <circle className="dot-6" cx="120" cy="560" r="2" fill="#5BC0EB"/>
          <circle className="dot-7" cx="1000" cy="780" r="2" fill="#22C55E"/>
          <circle className="dot-8" cx="700" cy="240" r="2.5" fill="#2563EB"/>

          <g opacity="0.6">
            <line x1="980" y1="640" x2="1290" y2="640" stroke="#0F172A" strokeWidth="0.6" opacity="0.15"/>
            <rect className="bar-1" x="995" y="540" width="22" height="100" rx="3" fill="#22C55E"/>
            <rect className="bar-2" x="1055" y="500" width="22" height="140" rx="3" fill="#22C55E"/>
            <rect className="bar-3" x="1115" y="460" width="22" height="180" rx="3" fill="#22C55E"/>
            <rect className="bar-4" x="1175" y="430" width="22" height="210" rx="3" fill="#22C55E"/>
            <rect className="bar-5" x="1235" y="390" width="22" height="250" rx="3" fill="#22C55E"/>
            <path className="trend-line" d="M 1006 530 L 1066 480 L 1126 440 L 1186 400 L 1246 355" fill="none" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="800" opacity="0.5"/>
            <circle cx="1246" cy="355" r="3" fill="#2563EB" opacity="0.5"/>
          </g>

          <g className="coin" opacity="0.4">
            <circle cx="260" cy="640" r="42" fill="none" stroke="#22C55E" strokeWidth="1.4"/>
            <circle cx="260" cy="640" r="34" fill="none" stroke="#6EE7A0" strokeWidth="0.8" strokeDasharray="3 6"/>
          </g>
          <text className="currency" x="260" y="660" textAnchor="middle" fontFamily="'Inter', system-ui, sans-serif" fontSize="48" fontWeight="600" fill="#22C55E" opacity="0.35">$</text>

          <g opacity="0.35">
            <line className="tick-1" x1="1360" y1="600" x2="1360" y2="650" stroke="#22C55E" strokeWidth="1.4" strokeLinecap="round"/>
            <rect className="tick-1" x="1355" y="615" width="10" height="20" rx="1.5" fill="#22C55E" opacity="0.7"/>
            <line className="tick-2" x1="1390" y1="590" x2="1390" y2="655" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round"/>
            <rect className="tick-2" x="1385" y="608" width="10" height="24" rx="1.5" fill="#2563EB" opacity="0.7"/>
            <line className="tick-3" x1="1420" y1="575" x2="1420" y2="645" stroke="#22C55E" strokeWidth="1.4" strokeLinecap="round"/>
            <rect className="tick-3" x="1415" y="595" width="10" height="22" rx="1.5" fill="#22C55E" opacity="0.7"/>
            <line className="tick-4" x1="1450" y1="560" x2="1450" y2="630" stroke="#6EE7A0" strokeWidth="1.4" strokeLinecap="round"/>
            <rect className="tick-4" x="1445" y="580" width="10" height="26" rx="1.5" fill="#6EE7A0" opacity="0.7"/>
          </g>

          <text x="930" y="430" textAnchor="middle" fontFamily="'Inter', system-ui, sans-serif" fontSize="36" fontWeight="500" fill="#5BC0EB" opacity="0.18">%</text>
        </svg>
      </div>

      {/* HEADER */}
      <header style={{ width: '100%', padding: '20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', boxSizing: 'border-box', zIndex: 10 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="50" height="50" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
              <circle cx="300" cy="300" r="280" fill="none" stroke="#6EE7A0" strokeWidth="18"/>
              <circle cx="300" cy="300" r="200" fill="none" stroke="#5BC0EB" strokeWidth="16"/>
              <circle cx="300" cy="300" r="160" fill="#2563EB"/>
              <circle cx="300" cy="300" r="90" fill="#0F172A"/>
              <circle cx="300" cy="100" r="22" fill="#5BC0EB"/>
              <circle cx="300" cy="500" r="22" fill="#5BC0EB"/>
              <circle cx="100" cy="300" r="22" fill="#22C55E"/>
              <circle cx="500" cy="300" r="22" fill="#22C55E"/>
          </svg>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '2px', lineHeight: 1 }}>ORSPEX</h1>
            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>Online Video Compressor</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '8px 16px', borderRadius: '30px', border: '1px solid #E2E8F0', backdropFilter: 'blur(10px)' }}>
          
          <a href="https://orspex.vercel.app" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            {t.home}
          </a>

          <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0' }}></div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setLang('en')} style={{ padding: '6px 12px', border: 'none', borderRadius: '16px', cursor: 'pointer', backgroundColor: lang === 'en' ? '#0F172A' : 'transparent', color: lang === 'en' ? 'white' : '#64748B', fontWeight: 600 }}>🇬🇧 EN</button>
            <button onClick={() => setLang('ar')} style={{ padding: '6px 12px', border: 'none', borderRadius: '16px', cursor: 'pointer', backgroundColor: lang === 'ar' ? '#0F172A' : 'transparent', color: lang === 'ar' ? 'white' : '#64748B', fontWeight: 600 }}>🇸🇦 عربي</button>
            <button onClick={() => setLang('zh')} style={{ padding: '6px 12px', border: 'none', borderRadius: '16px', cursor: 'pointer', backgroundColor: lang === 'zh' ? '#0F172A' : 'transparent', color: lang === 'zh' ? 'white' : '#64748B', fontWeight: 600 }}>🇨🇳 中文</button>
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0' }}></div>

          <div style={{ color: '#166534', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#22C55E', borderRadius: '50%' }}></div>
            {t.offline}
          </div>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ width: '100%', maxWidth: '600px', marginTop: '20px', backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', boxSizing: 'border-box', zIndex: 10 }}>
        
        <label style={{ display: 'block', border: '2px dashed #E2E8F0', borderRadius: '12px', padding: '50px 20px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#F8FAFC', marginBottom: '20px' }}>
          <input type="file" accept="video/*" onChange={handleFileChange} hidden />
          <div style={{ fontSize: '40px', color: '#5BC0EB', marginBottom: '10px' }}>↑</div>
          <p style={{ margin: '5px 0', color: '#0F172A' }} dangerouslySetInnerHTML={{ __html: t.dropTitle }}></p>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{t.dropSub}</p>
          {selectedFile && <p style={{ marginTop: '10px', color: '#2563EB', fontWeight: 'bold' }}>{selectedFile.name}</p>}
        </label>

        {/* ADVERTISE DESKTOP APP FOR LARGER FILES */}
        <div style={{ backgroundColor: '#0F172A', borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#5BC0EB', fontSize: '16px' }}>{t.advertTitle}</h4>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px', lineHeight: 1.4 }}>{t.advertDesc}</p>
          <a href="https://orspex.vercel.app" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '5px', padding: '10px 16px', backgroundColor: '#22C55E', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
            ⬇️ {t.advertBtn}
          </a>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
          <select value={quality} onChange={(e) => setQuality(e.target.value)} style={{ padding: '15px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '15px', outline: 'none', cursor: 'pointer' }}>
            <option value="high">{t.qualityHigh}</option>
            <option value="medium">{t.qualityMed}</option>
            <option value="low">{t.qualityLow}</option>
          </select>
          <select value={resolution} onChange={(e) => setResolution(e.target.value)} style={{ padding: '15px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '15px', outline: 'none', cursor: 'pointer' }}>
            <option value="original">{t.resOriginal}</option>
            <option value="1080p">{t.res1080}</option>
            <option value="720p">{t.res720}</option>
            <option value="480p">{t.res480}</option>
          </select>
        </div>

        <button onClick={compressVideo} disabled={!selectedFile || isProcessing} style={{ width: '100%', padding: '16px', backgroundColor: (!selectedFile || isProcessing) ? '#CBD5E1' : '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: (!selectedFile || isProcessing) ? 'not-allowed' : 'pointer', transition: '0.2s' }}>
          {isProcessing ? t.statusCompressing : t.btnCompress}
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#64748B', fontSize: '14px' }}>
          {statusText}
        </div>

        {downloadUrl && (
          <a href={downloadUrl} download="compressed_video.mp4" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '20px', padding: '16px', backgroundColor: '#22C55E', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', boxSizing: 'border-box' }}>
            ⬇️ {t.btnDownload}
          </a>
        )}
      </main>
    </div>
  );
}