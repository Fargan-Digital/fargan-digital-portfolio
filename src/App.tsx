import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { DustCanvas } from './components/DustCanvas';
import { VoxelAvatar3D } from './components/VoxelAvatar3D';
import { RobloxCityWorld } from './components/RobloxCityWorld';
import { type CityBuilding } from './data/portfolioProjects';
import { soundEngine } from './utils/audioManager';
import { AdminPortal } from './components/AdminPortal';
import { projectStorage } from './utils/projectStorage';
import { 
  translations, 
  type Language, 
  type DayNightMode, 
  type CharacterGender 
} from './utils/translations';
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
  Filter,
  Sun,
  Moon
} from 'lucide-react';

export function App() {
  const [viewMode, setViewMode] = useState<'city' | 'cinematic' | 'alfarghan'>('city');
  const [projects, setProjects] = useState<CityBuilding[]>(projectStorage.getProjects());
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedBuilding, setSelectedBuilding] = useState<CityBuilding | null>(null);
  const [targetBuildingId, setTargetBuildingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Persistence States: Language, Day/Night Mode, Avatar Gender
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('fargan_lang') as Language) || 'id';
  });
  const [mode, setMode] = useState<DayNightMode>(() => {
    return (localStorage.getItem('fargan_mode') as DayNightMode) || 'night';
  });
  const [gender, setGender] = useState<CharacterGender>(() => {
    return (localStorage.getItem('fargan_gender') as CharacterGender) || 'male';
  });

  useEffect(() => {
    localStorage.setItem('fargan_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('fargan_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('fargan_gender', gender);
  }, [gender]);

  const toggleLang = () => {
    soundEngine.playTypewriterBlip();
    setLang(prev => (prev === 'id' ? 'en' : 'id'));
  };

  const toggleMode = () => {
    soundEngine.playTypewriterBlip();
    setMode(prev => (prev === 'night' ? 'day' : 'night'));
  };

  const toggleGender = () => {
    soundEngine.playTypewriterBlip();
    setGender(prev => (prev === 'male' ? 'female' : 'male'));
  };

  const t = translations[lang];
  const totalStages = 5;
  const stageNames = [t.stageLobby, t.stageCharacter, t.stageProjects, t.stageServices, t.stageContact];

  // Check URL route for secret portal /Alfarghan
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/alfarghan' || path === '/alfarghan/' || hash === '#alfarghan') {
        setViewMode('alfarghan');
      }
    };
    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  // Secret keyboard shortcut (Alt + A) to toggle /Alfarghan portal
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        window.history.pushState({}, '', '/Alfarghan');
        setViewMode('alfarghan');
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Fetch updated projects from Cloudflare Edge KV
  useEffect(() => {
    projectStorage.loadProjects().then(setProjects);
  }, []);

  // Unlock and start audio engine on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundEngine.unlock();
      if (soundEnabled) {
        soundEngine.startBgm();
      }
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [soundEnabled]);

  const handleBuildingSelect = useCallback((b: CityBuilding) => {
    setSelectedBuilding(b);
  }, []);

  const playSfx = (_freq = 440, _type: OscillatorType = 'sine', _duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      soundEngine.playTypewriterBlip();
    } catch {}
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
      title: t.service1Title,
      desc: t.service1Desc,
      tag: 'Fullstack Solution'
    },
    {
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      title: t.service2Title,
      desc: t.service2Desc,
      tag: 'AI Workflows'
    },
    {
      icon: <Layers className="w-6 h-6 text-emerald-400" />,
      title: t.service3Title,
      desc: t.service3Desc,
      tag: 'High Conversion'
    },
    {
      icon: <Compass className="w-6 h-6 text-amber-400" />,
      title: t.service4Title,
      desc: t.service4Desc,
      tag: 'Strategic Advice'
    }
  ];

  // Filter projects by category
  const filteredProjects = selectedCategory === 'all' 
    ? projects 
    : projects.filter(p => p.categoryGroup === selectedCategory);

  const categoriesList = [
    { id: 'all', label: `${t.filterAll} (${projects.length})` },
    { id: 'enterprise', label: t.filterEnterprise },
    { id: 'fintech_security', label: t.filterFintech },
    { id: 'corporate_b2b', label: t.filterCorporate },
    { id: 'property_agency', label: t.filterProperty },
    { id: 'consumer_lifestyle', label: t.filterConsumer },
  ];

  if (viewMode === 'alfarghan') {
    return (
      <AdminPortal
        onBackToCity={() => {
          window.history.pushState({}, '', '/');
          setViewMode('city');
        }}
        onProjectsUpdated={updatedList => {
          setProjects(updatedList);
        }}
      />
    );
  }

  return (
    <div className="canvas-wrapper">
      <main className="cinematic-frame flex flex-col justify-between">
        
        {/* ========================================================= */}
        {/* VIEW MODE 1: PLAYABLE ROBLOX 3D CITY WORLD */}
        {/* ========================================================= */}
        {viewMode === 'city' ? (
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Topbar HUD */}
            <header className="absolute top-0 left-0 right-0 z-40 px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between border-b border-white/10 bg-slate-950/75 backdrop-blur-md">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-red-600/30 border border-red-400/50 flex-shrink-0">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-xs sm:text-sm tracking-wide">FARGAN ROBLOX CITY</span>
                    <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono animate-pulse">
                      10 KARYA
                    </span>
                  </div>
                  <p className="hidden md:block text-[10px] text-slate-400 font-mono">Gunakan W,A,S,D untuk berjalan mendekati gedung karya</p>
                </div>
              </div>

              {/* Mode Switcher & Global Toggles */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex bg-slate-900/90 rounded-xl p-0.5 sm:p-1 border border-white/10 text-xs">
                  <button
                    onClick={() => {
                      setViewMode('city');
                      playSfx(520, 'sine');
                    }}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition-all cursor-pointer bg-cyan-500 text-slate-950 shadow-md text-[11px] sm:text-xs"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>{t.cityMode}</span>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode('cinematic');
                      playSfx(520, 'sine');
                    }}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition-all cursor-pointer text-slate-400 hover:text-white text-[11px] sm:text-xs"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>{t.cinematicMode}</span>
                  </button>
                </div>

                {/* Day / Night Toggle */}
                <button
                  onClick={toggleMode}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title={mode === 'day' ? t.nightMode : t.dayMode}
                >
                  {mode === 'day' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
                  <span className="hidden md:inline text-[11px] font-mono font-bold">{mode === 'day' ? t.dayMode : t.nightMode}</span>
                </button>

                {/* Character Avatar Toggle */}
                <button
                  onClick={toggleGender}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title="Pilih Model Karakter (Pria / Wanita)"
                >
                  <span>{gender === 'female' ? '👧' : '👦'}</span>
                  <span className="hidden md:inline text-[11px] font-mono font-bold">{gender === 'female' ? t.charFemale : t.charMale}</span>
                </button>

                {/* Language Toggle */}
                <button
                  onClick={toggleLang}
                  className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title="Ganti Bahasa (ID / EN)"
                >
                  <span>{lang === 'id' ? '🇮🇩' : '🇬🇧'}</span>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold">{lang === 'id' ? 'ID' : 'EN'}</span>
                </button>

                {/* Sound BGM Toggle */}
                <button
                  onClick={() => {
                    const newMuted = soundEngine.toggleMute();
                    setSoundEnabled(!newMuted);
                  }}
                  className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow active:scale-95"
                  title="Toggle Suara Musik & Efek"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      <span className="hidden sm:inline text-[10px] sm:text-[11px] font-mono text-cyan-300 font-bold">{t.bgmOn}</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline text-[10px] sm:text-[11px] font-mono text-slate-400 font-bold">{t.bgmMute}</span>
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* Playable 3D Roblox Canvas */}
            <div className="w-full h-full">
              <RobloxCityWorld 
                onBuildingSelect={handleBuildingSelect}
                targetBuildingId={targetBuildingId}
                projects={projects}
                lang={lang}
                mode={mode}
                gender={gender}
                onToggleLang={toggleLang}
                onToggleMode={toggleMode}
                onToggleGender={toggleGender}
              />
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW MODE 2: CINEMATIC STAGE PRESENTATION (ALA JILLYWOSY) */
          /* ========================================================= */
          <div className="relative w-full h-full flex flex-col justify-between">
            <DustCanvas />
            <VoxelAvatar3D currentStage={currentStage} gender={gender} mode={mode} />

            {/* Topbar HUD in Cinematic Mode */}
            <header className="relative z-40 w-full px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
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

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Day / Night Toggle */}
                <button
                  onClick={toggleMode}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title={mode === 'day' ? t.nightMode : t.dayMode}
                >
                  {mode === 'day' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
                  <span className="hidden md:inline text-[11px] font-mono font-bold">{mode === 'day' ? t.dayMode : t.nightMode}</span>
                </button>

                {/* Character Gender Toggle */}
                <button
                  onClick={toggleGender}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title="Pilih Model Karakter (Pria / Wanita)"
                >
                  <span>{gender === 'female' ? '👧' : '👦'}</span>
                  <span className="hidden md:inline text-[11px] font-mono font-bold">{gender === 'female' ? t.charFemale : t.charMale}</span>
                </button>

                {/* Language Toggle */}
                <button
                  onClick={toggleLang}
                  className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title="Ganti Bahasa (ID / EN)"
                >
                  <span>{lang === 'id' ? '🇮🇩' : '🇬🇧'}</span>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold">{lang === 'id' ? 'ID' : 'EN'}</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode('city');
                    playSfx(600, 'triangle');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>{t.backToCityBtn} ➔</span>
                </button>
              </div>
            </header>

            {/* Stage Presentation Container */}
            <div className="relative z-30 flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
              {currentStage === 0 && (
                <div className="w-full max-w-2xl roblox-panel roblox-panel-glow p-6 sm:p-8 text-center space-y-5 animate-fade-in my-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.lobbyBadge}</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                    {t.lobbyHeading1} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-300">
                      {t.lobbyHeading2}
                    </span>
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                    {t.lobbyBio}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setViewMode('city')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-cyan-500/30 cursor-pointer transition-all hover:scale-105"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>{t.lobbyEnterCity}</span>
                    </button>

                    <button
                      onClick={handleNextStage}
                      className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 cursor-pointer transition-all"
                    >
                      <span>{t.lobbyViewProfile}</span>
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
                      <span className="font-mono text-xs font-bold text-cyan-400">{t.characterStatus}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{t.characterLevel}</span>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-2xl font-black text-white">{t.characterName}</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {gender === 'female' ? t.characterRoleDescFemale : t.characterRoleDescMale}
                    </p>
                  </div>

                  {/* Character Gender Selector */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-300 font-bold">{t.charGenderPrompt}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setGender('male');
                          soundEngine.playTypewriterBlip();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          gender === 'male' ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        👦 {t.charMale}
                      </button>
                      <button
                        onClick={() => {
                          setGender('female');
                          soundEngine.playTypewriterBlip();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          gender === 'female' ? 'bg-pink-500 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        👧 {t.charFemale}
                      </button>
                    </div>
                  </div>

                  {/* Character Stats Bars */}
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-bold">{t.statWebSaas}</span>
                        <span className="text-cyan-400">98%</span>
                      </div>
                      <div className="roblox-stat-bar">
                        <div className="roblox-stat-fill" style={{ width: '98%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-bold">{t.statAiWorkflow}</span>
                        <span className="text-purple-400">95%</span>
                      </div>
                      <div className="roblox-stat-bar">
                        <div className="roblox-stat-fill bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '95%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-bold">{t.statEnterpriseCloud}</span>
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
                      <div className="text-xs font-mono text-cyan-300 font-bold">{t.badgeWorksCount}</div>
                      <div className="text-[10px] text-slate-400">{t.badgeWorksDesc}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1 text-center">
                      <div className="text-xs font-mono text-emerald-300 font-bold">{t.badgeSecurity}</div>
                      <div className="text-[10px] text-slate-400">{t.badgeSecurityDesc}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1 text-center col-span-2 sm:col-span-1">
                      <div className="text-xs font-mono text-amber-300 font-bold">{t.badgeScale}</div>
                      <div className="text-[10px] text-slate-400">{t.badgeScaleDesc}</div>
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
                        <span>{t.projectsHeading} ({projects.length})</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">{t.projectsSubheading}</p>
                    </div>

                    <button
                      onClick={() => setViewMode('city')}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>{t.projectsOpenCity}</span>
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
                          soundEngine.playTypewriterBlip();
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
                              {(lang === 'en' && p.badgeEn) ? p.badgeEn : p.badge}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              POS [{p.position[0]}, {p.position[2]}]
                            </span>
                          </div>

                          <h3 className="text-base font-black text-white">{p.name}</h3>
                          <p className="text-[11px] text-cyan-300 font-mono line-clamp-1">
                            {(lang === 'en' && p.subtitleEn) ? p.subtitleEn : p.subtitle}
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                            {(lang === 'en' && p.descEn) ? p.descEn : p.desc}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => playSfx(750, 'square')}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow"
                          >
                            <span>{lang === 'en' ? 'Open Live' : 'Buka Live'}</span>
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
                            <span>{t.cityMode}</span>
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
                        <span>{t.servicesHeading}</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">{t.servicesSubheading}</p>
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
                      {t.contactHeading}
                    </h2>
                    <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                      {t.contactSubheading}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-3">
                    <a
                      href="https://wa.me/6281295175618?text=Halo%20Al%20Fargan,%20saya%20tertarik%20konsultasi%20mengenai%20solusi%20website%20/%20software%20AI..."
                      target="_blank"
                      rel="noreferrer"
                      onClick={triggerConfetti}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 cursor-pointer transition-all hover:scale-105"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>{t.contactWhatsAppCta}</span>
                    </a>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {t.contactSubtext}
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
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs cursor-pointer font-bold"
                >
                  ◀ {lang === 'en' ? 'Prev' : 'Sebelumnya'}
                </button>
                <button
                  onClick={handleNextStage}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs cursor-pointer font-bold"
                >
                  {lang === 'en' ? 'Next' : 'Berikutnya'} ▶
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
                  {(lang === 'en' && selectedBuilding.badgeEn) ? selectedBuilding.badgeEn : selectedBuilding.badge}
                </span>
                <h3 className="text-xl font-black text-white mt-2 tracking-tight">{selectedBuilding.name}</h3>
                <p className="text-xs text-cyan-300 font-mono mt-0.5">
                  {(lang === 'en' && selectedBuilding.subtitleEn) ? selectedBuilding.subtitleEn : selectedBuilding.subtitle}
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {(lang === 'en' && selectedBuilding.descEn) ? selectedBuilding.descEn : selectedBuilding.desc}
              </p>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/70 border border-white/10">
                <div className="text-xs font-bold text-white">{t.projectCapabilities}</div>
                <div className="space-y-1">
                  {((lang === 'en' && selectedBuilding.featuresEn) ? selectedBuilding.featuresEn : selectedBuilding.features).map((f, i) => (
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
                  {t.backToCityBtn}
                </button>

                <a
                  href={selectedBuilding.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => playSfx(880, 'square')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 cursor-pointer transition-all hover:scale-105"
                >
                  <span>{t.launchTabBtn}</span>
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
