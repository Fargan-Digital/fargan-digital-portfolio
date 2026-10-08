import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { DustCanvas } from './components/DustCanvas';
import { VoxelAvatar3D } from './components/VoxelAvatar3D';
import { RobloxCityWorld } from './components/RobloxCityWorld';
import { portfolioProjects, type CityBuilding } from './data/portfolioProjects';
import { 
  Sparkles, 
  ChevronRight, 
  Code2, 
  Cpu, 
  Layers, 
  ExternalLink, 
  MessageCircle, 
  CheckCircle2, 
  Zap, 
  Boxes, 
  Volume2, 
  VolumeX, 
  Compass, 
  Gamepad2, 
  Tv,
  MapPin,
  Filter
} from 'lucide-react';

export function App() {
  const [viewMode, setViewMode] = useState<'city' | 'cinematic'>('city');
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedBuilding, setSelectedBuilding] = useState<CityBuilding | null>(null);
  const [targetBuildingId, setTargetBuildingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const totalStages = 5;
  const stageNames = ['LOBBY', 'KARAKTER', 'KARYA', 'LAYANAN', 'KONTAK'];

  // Retro Web Audio SFX
  const playSfx = (freq = 440, type: OscillatorType = 'sine', duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext fallback
    }
  };

  const handleNextStage = () => {
    playSfx(580, 'triangle');
    setCurrentStage(prev => (prev + 1) % totalStages);
  };

  const handlePrevStage = () => {
    playSfx(420, 'triangle');
    setCurrentStage(prev => (prev - 1 + totalStages) % totalStages);
  };

  const goToStage = (idx: number) => {
    playSfx(650, 'sine');
    setCurrentStage(idx);
  };

  const triggerConfetti = () => {
    playSfx(880, 'square', 0.2);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Keyboard navigation for cinematic mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'cinematic') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNextStage();
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrevStage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  const services = [
    {
      icon: <Code2 className="w-6 h-6 text-cyan-400" />,
      title: 'Custom Web & SaaS Development',
      desc: 'Membangun aplikasi web, portal bisnis, dan software SaaS kelas produksi dengan arsitektur modal Rp 0, performa ultra-cepat, dan bebas celah keamanan.',
      tag: 'Fullstack Solution'
    },
    {
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      title: 'Integrasi AI Agent & Otomasi',
      desc: 'Mengotomatiskan alur bisnis Anda dengan bot WhatsApp cerdas, pembersihan data otomatis, dan agen AI yang bekerja 24/7 menghemat waktu Anda.',
      tag: 'AI Workflows'
    },
    {
      icon: <Layers className="w-6 h-6 text-emerald-400" />,
      title: 'UI/UX & Interactive Landing Page',
      desc: 'Merancang antarmuka web modern, estetik, responsif, dan fokus konversi tinggi yang memikat pelanggan dalam 3 detik pertama.',
      tag: 'High Conversion'
    },
    {
      icon: <Compass className="w-6 h-6 text-amber-400" />,
      title: 'Konsultasi Arsitektur Digital',
      desc: 'Membantu brand owner & pengusaha merancang blueprint teknologi, memotong biaya server yang membengkak, dan menyiapkan skala bisnis.',
      tag: 'Strategic Advice'
    }
  ];

  // Filter projects by category
  const filteredProjects = selectedCategory === 'all' 
    ? portfolioProjects 
    : portfolioProjects.filter(p => p.categoryGroup === selectedCategory);

  const categoriesList = [
    { id: 'all', label: `Semua (${portfolioProjects.length})` },
    { id: 'enterprise', label: 'Enterprise & AI' },
    { id: 'fintech_security', label: 'FinTech & Security' },
    { id: 'corporate_b2b', label: 'Korporat B2B' },
    { id: 'property_agency', label: 'Properti & Agensi' },
    { id: 'consumer_lifestyle', label: 'F&B, Fashion & Fitness' },
  ];

  return (
    <div className="canvas-wrapper">
      <main className="cinematic-frame flex flex-col justify-between">
        
        {/* ========================================================= */}
        {/* VIEW MODE 1: PLAYABLE ROBLOX 3D CITY WORLD */}
        {/* ========================================================= */}
        {viewMode === 'city' ? (
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Topbar HUD */}
            <header className="absolute top-0 left-0 right-0 z-40 px-5 py-3.5 flex items-center justify-between border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-red-600/30 border border-red-400/50">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-sm tracking-wide">FARGAN ROBLOX CITY</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono animate-pulse">
                      10 GEDUNG INTERAKTIF
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">Gunakan W,A,S,D untuk berjalan mendekati gedung karya</p>
                </div>
              </div>

              {/* Mode Switcher Buttons */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-900/90 rounded-xl p-1 border border-white/10 text-xs">
                  <button
                    onClick={() => {
                      setViewMode('city');
                      playSfx(520, 'sine');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer bg-cyan-500 text-slate-950 shadow-md"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Jalan di Kota 3D</span>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode('cinematic');
                      playSfx(520, 'sine');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-slate-400 hover:text-white"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Mode Presentasi</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    playSfx(520, 'sine');
                  }}
                  className="p-2 rounded-xl bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white text-xs cursor-pointer"
                  title="Toggle Sound Effects"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </header>

            {/* Playable 3D Roblox Canvas */}
            <div className="w-full h-full">
              <RobloxCityWorld 
                onBuildingSelect={(b) => setSelectedBuilding(b)}
                targetBuildingId={targetBuildingId}
              />
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW MODE 2: CINEMATIC STAGE PRESENTATION (ALA JILLYWOSY) */
          /* ========================================================= */
          <div className="relative w-full h-full flex flex-col justify-between">
            <DustCanvas />
            <VoxelAvatar3D currentStage={currentStage} />

            {/* Topbar HUD */}
            <header className="relative z-40 w-full px-5 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center font-black text-white text-xs border border-red-400/50">
                  F
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-sm tracking-wide">FARGAN DIGITAL</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                      CINEMATIC HUD
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">Creative Tech & Fullstack Engineer</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setViewMode('city');
                    playSfx(600, 'triangle');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Kembali ke Kota 3D ➔</span>
                </button>
              </div>
            </header>

            {/* Stage Presentation Container */}
            <div className="relative z-30 flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
              {currentStage === 0 && (
                <div className="w-full max-w-2xl roblox-panel roblox-panel-glow p-6 sm:p-8 text-center space-y-5 animate-fade-in my-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>EXPERIENCE THE DIGITAL REVOLUTION</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    Ciptakan Software Cerdas. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-300">
                      Bangun Skala Bisnis.
                    </span>
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                    Halo, saya adalah kreator di balik <strong>Fargan Digital AI</strong>. Spesialis merancang perangkat lunak kelas industri, arsitektur data efisiensi tinggi (Rp 0 modal infrastruktur awal), dan otomatisasi AI untuk pemilik brand & pengusaha.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setViewMode('city')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-cyan-500/30 cursor-pointer transition-all hover:scale-105"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>Masuk & Eksplorasi Kota 3D</span>
                    </button>

                    <button
                      onClick={handleNextStage}
                      className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 cursor-pointer transition-all"
                    >
                      <span>Lihat Profil Karakter</span>
                      <ChevronRight className="w-4 h-4 text-cyan-400" />
                    </button>
                  </div>
                </div>
              )}

              {currentStage === 1 && (
                <div className="w-full max-w-2xl roblox-panel p-6 sm:p-8 space-y-5 animate-fade-in my-auto">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                      <span className="font-mono text-xs font-bold text-cyan-400">STATUS KARAKTER: ONLINE</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">LVL. 99 FULLSTACK ENG</span>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-2xl font-black text-white">Al Fargan Orin</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Software Engineer & AI Architect yang memadukan keahlian teknik full-stack modern dengan pemahaman mendalam tentang unit ekonomi bisnis, margin profitabilitas, dan konversi pemasaran digital.
                    </p>
                  </div>

                  {/* Character Stats Bars */}
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-bold">Arsitektur Web & SaaS (React/TypeScript/Cloudflare)</span>
                        <span className="text-cyan-400">98%</span>
                      </div>
                      <div className="roblox-stat-bar">
                        <div className="roblox-stat-fill" style={{ width: '98%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-bold">AI Workflow & LLM Integration</span>
                        <span className="text-purple-400">95%</span>
                      </div>
                      <div className="roblox-stat-bar">
                        <div className="roblox-stat-fill bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '95%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-bold">Zero-Cost Cloud Architecture (Rp 0 CapEx)</span>
                        <span className="text-emerald-400">100%</span>
                      </div>
                      <div className="roblox-stat-bar">
                        <div className="roblox-stat-fill bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Badge Row */}
                  <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1 text-center">
                      <div className="text-xs font-mono text-cyan-300 font-bold">10+ Karya Web</div>
                      <div className="text-[10px] text-slate-400">Beroperasi aktif di Cloudflare & Vercel</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1 text-center">
                      <div className="text-xs font-mono text-emerald-300 font-bold">Anti Kebocoran</div>
                      <div className="text-[10px] text-slate-400">Proteksi data & unit ekonomi teruji</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1 text-center col-span-2 sm:col-span-1">
                      <div className="text-xs font-mono text-amber-300 font-bold">Zero Overhead</div>
                      <div className="text-[10px] text-slate-400">Produksi aplikasi skala besar dengan Rp 0 modal server</div>
                    </div>
                  </div>
                </div>
              )}

              {currentStage === 2 && (
                <div className="w-full max-w-4xl roblox-panel p-5 sm:p-7 space-y-4 animate-fade-in my-auto max-h-[82vh] overflow-y-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-3">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-amber-400" />
                        <span>Koleksi Karya Digital & Gedung Kota (10 Karya)</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Semua situs web di bawah ini aktif beroperasi dan dapat dikunjungi langsung</p>
                    </div>

                    <button
                      onClick={() => setViewMode('city')}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>Buka Kota 3D ➔</span>
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
                    {categoriesList.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          playSfx(500, 'sine');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-cyan-500 text-slate-950 shadow-md'
                            : 'bg-slate-900/90 text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Projects Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {filteredProjects.map(p => (
                      <div 
                        key={p.id}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-cyan-500/50 transition-all space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span 
                              className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                              style={{ 
                                backgroundColor: `#${p.neonColor.toString(16).padStart(6, '0')}22`,
                                color: `#${p.neonColor.toString(16).padStart(6, '0')}`,
                                border: `1px solid #${p.neonColor.toString(16).padStart(6, '0')}44`
                              }}
                            >
                              {p.badge}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              POS [{p.position[0]}, {p.position[2]}]
                            </span>
                          </div>

                          <h3 className="text-base font-black text-white">{p.name}</h3>
                          <p className="text-[11px] text-cyan-300 font-mono line-clamp-1">{p.subtitle}</p>
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{p.desc}</p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => playSfx(750, 'square')}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow"
                          >
                            <span>Buka Live</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => {
                              setTargetBuildingId(p.id);
                              setViewMode('city');
                              playSfx(650, 'triangle');
                            }}
                            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Teleport avatar ke depan gedung ini di Kota 3D"
                          >
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Kota 3D</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStage === 3 && (
                <div className="w-full max-w-3xl roblox-panel p-6 sm:p-7 space-y-5 animate-fade-in my-auto">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span>Layanan & Solusi yang Saya Tawarkan</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Solusi teknologi bernilai tinggi untuk mempercepat pertumbuhan bisnis Anda</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {services.map((svc, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="p-2 rounded-xl bg-slate-900 border border-white/10">
                            {svc.icon}
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-white/10">
                            {svc.tag}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white">{svc.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{svc.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStage === 4 && (
                <div className="w-full max-w-xl roblox-panel roblox-panel-glow p-6 sm:p-8 text-center space-y-6 animate-fade-in my-auto">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Mari Kolaborasi & Bangun Bersama!
                    </h2>
                    <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                      Punya ide software, butuh otomatisasi AI cerdas, atau ingin portofolio digital interaktif 3D seperti ini? Pintu server terbuka untuk Anda.
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-3">
                    <a
                      href="https://wa.me/6281295175618?text=Halo%20Al%20Fargan,%20saya%20tertarik%20konsultasi%20gratis%20mengenai%20pembuatan%20website%20/%20software%20AI..."
                      target="_blank"
                      rel="noreferrer"
                      onClick={triggerConfetti}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 cursor-pointer transition-all hover:scale-105"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Chat WhatsApp: 0812-9517-5618 (Konsultasi Gratis)</span>
                    </a>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Fast Response • Al Fargan Orin • Siap Diskusi Arsitektur & Penawaran
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stage Dots Pager */}
            <nav 
              aria-label="Navigasi Pager Stage" 
              className="relative z-40 w-full px-5 py-3 border-t border-white/10 bg-slate-950/60 backdrop-blur-md flex items-center justify-between"
            >
              <div className="text-[11px] font-mono text-slate-400">
                STAGE <strong className="text-cyan-400">{currentStage + 1}</strong> / {totalStages}: {stageNames[currentStage]}
              </div>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalStages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToStage(idx)}
                    aria-label={`Buka babak ${idx + 1}: ${stageNames[idx]}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentStage === idx
                        ? 'w-6 bg-cyan-400 shadow-md shadow-cyan-400/50'
                        : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevStage}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ◀ Prev
                </button>
                <button
                  onClick={handleNextStage}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Next ▶
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* ========================================================= */}
        {/* INTERACTIVE BUILDING DETAILS MODAL (WHEN VISITING BUILDING) */}
        {/* ========================================================= */}
        {selectedBuilding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg roblox-panel p-6 sm:p-7 space-y-4 relative border-cyan-400 shadow-2xl">
              <button
                onClick={() => setSelectedBuilding(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>

              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  {selectedBuilding.badge}
                </span>
                <h3 className="text-xl font-black text-white mt-2 tracking-tight">{selectedBuilding.name}</h3>
                <p className="text-xs text-cyan-300 font-mono mt-0.5">{selectedBuilding.subtitle}</p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedBuilding.desc}
              </p>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/70 border border-white/10">
                <div className="text-xs font-bold text-white">Spesifikasi & Kapabilitas:</div>
                <div className="space-y-1">
                  {selectedBuilding.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  onClick={() => setSelectedBuilding(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
                >
                  Kembali ke Kota
                </button>

                <a
                  href={selectedBuilding.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => playSfx(880, 'square')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 cursor-pointer transition-all hover:scale-105"
                >
                  <span>Buka Website Live di Tab Baru</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
