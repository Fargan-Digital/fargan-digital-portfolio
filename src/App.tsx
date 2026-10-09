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
  Moon,
  MessageSquare
} from 'lucide-react';

export function App() {
  // Default to cinematic stage presentation for super-cool intro welcoming
  const [viewMode, setViewMode] = useState<'city' | 'cinematic' | 'alfarghan'>('cinematic');
  const [projects, setProjects] = useState<CityBuilding[]>(projectStorage.getProjects());
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedBuilding, setSelectedBuilding] = useState<CityBuilding | null>(null);
  const [targetBuildingId, setTargetBuildingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Typewriter intro text animation state
  const [typedIntroSpeech, setTypedIntroSpeech] = useState<string>('');
  const [isIntroTypingDone, setIsIntroTypingDone] = useState<boolean>(false);

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

  // Handle Typewriter effect for Stage 0 Welcoming Dialogue with retro click SFX
  useEffect(() => {
    if (viewMode !== 'cinematic' || currentStage !== 0) {
      setTypedIntroSpeech(t.metaverseGreetingSpeech);
      setIsIntroTypingDone(true);
      return;
    }

    const fullSpeech = t.metaverseGreetingSpeech;
    let charIdx = 0;
    setTypedIntroSpeech('');
    setIsIntroTypingDone(false);

    const timer = setInterval(() => {
      charIdx++;
      if (charIdx <= fullSpeech.length) {
        setTypedIntroSpeech(fullSpeech.slice(0, charIdx));
        if (soundEnabled && (charIdx % 2 === 0 || fullSpeech[charIdx - 1] === ' ')) {
          soundEngine.playTypewriterBlip();
        }
      } else {
        setIsIntroTypingDone(true);
        clearInterval(timer);
      }
    }, 22);

    return () => clearInterval(timer);
  }, [viewMode, currentStage, lang, soundEnabled, t.metaverseGreetingSpeech]);

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
            <header className="absolute top-0 left-0 right-0 z-40 px-2 sm:px-5 py-2 sm:py-3 flex items-center justify-between border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
              <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 flex items-center justify-center p-1 shadow-lg shadow-cyan-500/20 border border-cyan-400/40 flex-shrink-0">
                  <img src="/logo.svg" alt="Fargan Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="font-extrabold text-white text-xs sm:text-sm tracking-wide">
                      <span className="sm:hidden">FARGAN</span>
                      <span className="hidden sm:inline">FARGAN METAVERSE CITY</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                      {projects.length}
                    </span>
                  </div>
                  <p className="hidden md:block text-[10px] text-slate-400 font-mono">Gunakan W,A,S,D untuk berjalan mendekati gedung karya</p>
                </div>
              </div>

              {/* Mode Switcher & Global Toggles - Compact on Mobile */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                <div className="flex bg-slate-900/90 rounded-lg sm:rounded-xl p-0.5 border border-white/10 text-xs">
                  <button
                    onClick={() => {
                      setViewMode('city');
                      playSfx(520, 'sine');
                    }}
                    className="flex items-center gap-1 p-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg font-bold transition-all cursor-pointer bg-cyan-500 text-slate-950 shadow-md text-[11px]"
                    title={t.cityMode}
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.cityMode}</span>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode('cinematic');
                      playSfx(520, 'sine');
                    }}
                    className="flex items-center gap-1 p-1 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg font-bold transition-all cursor-pointer text-slate-400 hover:text-white text-[11px]"
                    title={t.cinematicMode}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.cinematicMode}</span>
                  </button>
                </div>

                {/* Day / Night Toggle */}
                <button
                  onClick={toggleMode}
                  className="p-1 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title={mode === 'day' ? t.nightMode : t.dayMode}
                >
                  {mode === 'day' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
                </button>

                {/* Character Avatar Toggle */}
                <button
                  onClick={toggleGender}
                  className="p-1 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title="Pilih Model Karakter (Pria / Wanita)"
                >
                  <span className="text-xs">{gender === 'female' ? '👧' : '👦'}</span>
                </button>

                {/* Language Toggle */}
                <button
                  onClick={toggleLang}
                  className="p-1 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-0.5 sm:gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title="Ganti Bahasa (ID / EN)"
                >
                  <span className="text-xs">{lang === 'id' ? '🇮🇩' : '🇬🇧'}</span>
                  <span className="hidden sm:inline text-[10px] font-mono font-bold">{lang === 'id' ? 'ID' : 'EN'}</span>
                </button>

                {/* Sound BGM Toggle */}
                <button
                  onClick={() => {
                    const newMuted = soundEngine.toggleMute();
                    setSoundEnabled(!newMuted);
                  }}
                  className="p-1 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 transition-colors shadow active:scale-95"
                  title="Toggle Suara Musik & Efek"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
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
          <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
            <DustCanvas />

            {/* Ambient High-Tech Fargan Logo Backdrop Watermark */}
            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
              <div className="relative w-[280px] h-[280px] sm:w-[480px] sm:h-[480px] md:w-[600px] md:h-[600px] flex items-center justify-center">
                {/* Cyberpunk Radial Glow Rings */}
                <div className="absolute inset-0 rounded-full bg-cyan-500/15 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute inset-8 rounded-full bg-indigo-600/15 blur-2xl animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute w-[90%] h-[90%] rounded-full border border-cyan-400/20 animate-spin" style={{ animationDuration: '40s' }} />
                <div className="absolute w-[75%] h-[75%] rounded-full border border-dashed border-indigo-400/20 animate-spin" style={{ animationDuration: '60s', animationDirection: 'reverse' }} />
                
                {/* Full Iconic Fargan Logo */}
                <img 
                  src="/logo.svg" 
                  alt="Fargan Digital Creative Logo Watermark" 
                  className="w-3/4 h-3/4 object-contain opacity-20 sm:opacity-25 filter drop-shadow-[0_0_40px_rgba(6,182,212,0.6)] select-none pointer-events-none"
                />
              </div>
            </div>

            {/* Topbar HUD in Cinematic Mode */}
            <header className="relative z-40 w-full px-2 sm:px-5 py-1.5 sm:py-3 flex items-center justify-between border-b border-white/10 bg-slate-950/80 backdrop-blur-md flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 flex items-center justify-center p-1 shadow-lg shadow-cyan-500/20 border border-cyan-400/40 flex-shrink-0">
                  <img src="/logo.svg" alt="Fargan Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="font-extrabold text-white text-xs sm:text-sm tracking-wide">
                      <span className="sm:hidden">FARGAN</span>
                      <span className="hidden sm:inline">FARGAN DIGITAL</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                      HUD
                    </span>
                  </div>
                  <p className="hidden md:block text-[10px] text-slate-400 font-mono">Creative Tech & Fullstack Engineer</p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                {/* Day / Night Toggle */}
                <button
                  onClick={toggleMode}
                  className="p-1 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title={mode === 'day' ? t.nightMode : t.dayMode}
                >
                  {mode === 'day' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
                </button>

                {/* Character Gender Toggle */}
                <button
                  onClick={toggleGender}
                  className="p-1 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title="Pilih Model Karakter (Pria / Wanita)"
                >
                  <span className="text-xs">{gender === 'female' ? '👧' : '👦'}</span>
                </button>

                {/* Language Toggle */}
                <button
                  onClick={toggleLang}
                  className="p-1 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-0.5 sm:gap-1 text-slate-200 hover:text-white shadow active:scale-95 transition-all"
                  title="Ganti Bahasa (ID / EN)"
                >
                  <span className="text-xs">{lang === 'id' ? '🇮🇩' : '🇬🇧'}</span>
                  <span className="hidden sm:inline text-[10px] font-mono font-bold">{lang === 'id' ? 'ID' : 'EN'}</span>
                </button>

                {/* Sound BGM Toggle */}
                <button
                  onClick={() => {
                    const newMuted = soundEngine.toggleMute();
                    setSoundEnabled(!newMuted);
                  }}
                  className="p-1 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/90 border border-white/10 text-xs cursor-pointer flex items-center gap-1 transition-colors shadow active:scale-95"
                  title="Toggle Suara Musik & Efek"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>

                <button
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.unmute();
                    soundEngine.startBgm();
                    setSoundEnabled(true);
                    setViewMode('city');
                    playSfx(600, 'triangle');
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>{t.backToCityBtn} ➔</span>
                </button>
              </div>
            </header>

            {/* Stage Presentation Split-Screen Container */}
            <main className="relative z-30 flex-1 w-full min-h-0 px-2.5 sm:px-6 py-1.5 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-6 overflow-hidden">
              {/* Left Column: 3D Voxel Avatar as Host & Explainer */}
              <div className="w-full md:w-5/12 h-36 sm:h-52 md:h-full relative flex items-center justify-center flex-shrink-0 overflow-hidden">
                <div className="w-full h-full relative">
                  <VoxelAvatar3D currentStage={currentStage} gender={gender} mode={mode} />
                </div>

                {/* Floating Avatar Host Nametag & Status Badge */}
                <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-0.5 sm:gap-1 z-10 w-full px-2 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-950/90 border border-cyan-400/40 backdrop-blur-md shadow-lg shadow-cyan-500/20 max-w-full">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white tracking-wide whitespace-nowrap">
                      {t.metaverseSpeakerTitle}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 flex-shrink-0">
                      {gender === 'female' ? t.charFemale : t.charMale}
                    </span>
                  </div>
                  <div className="text-[8px] sm:text-[9px] font-mono text-cyan-400/80 uppercase tracking-wider whitespace-nowrap">
                    {t.metaverseSpeakerStatus}
                  </div>
                </div>
              </div>

              {/* Right Column: Host Dialogue Terminal & Stage Cards */}
              <div className="w-full md:w-7/12 h-full min-h-0 flex items-center justify-center overflow-y-auto py-1 sm:py-2">
                {/* STAGE 0: Grand Host Dialogue & Metaverse Entry */}
                {currentStage === 0 && (
                  <div className="w-full max-w-xl roblox-panel roblox-panel-glow p-3 sm:p-5 space-y-2.5 sm:space-y-4 animate-fade-in my-auto border-cyan-500/40">
                    {/* Header Badge with Official Brand Logo */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-slate-900 border border-cyan-400/50 p-0.5 flex-shrink-0 shadow-sm shadow-cyan-500/30">
                          <img src="/logo.svg" alt="Fargan Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] sm:text-xs font-mono font-bold truncate">
                          <Sparkles className="w-3 h-3 text-cyan-400 animate-spin flex-shrink-0" style={{ animationDuration: '4s' }} />
                          <span className="truncate">{t.metaverseWelcomeTag}</span>
                        </div>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0 ml-1">
                        ONLINE LIVE
                      </span>
                    </div>

                    {/* Speech Dialogue Bubble from Character */}
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-inner space-y-1.5 sm:space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-cyan-400 text-[11px] sm:text-xs font-mono font-bold">
                          <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span>{t.metaverseSpeakerTitle}:</span>
                        </div>
                        {!isIntroTypingDone && (
                          <button
                            onClick={() => {
                              setTypedIntroSpeech(t.metaverseGreetingSpeech);
                              setIsIntroTypingDone(true);
                              soundEngine.playTypewriterBlip();
                            }}
                            className="text-[9px] sm:text-[10px] font-mono text-cyan-300 hover:text-white px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/30 transition-all cursor-pointer"
                          >
                            Skip ➔
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-sm text-slate-100 leading-relaxed font-sans min-h-[52px] sm:min-h-[68px]">
                        "{typedIntroSpeech}"
                        {!isIntroTypingDone && (
                          <span className="inline-block w-1.5 h-3 sm:h-3.5 ml-1 bg-cyan-400 animate-pulse align-middle" />
                        )}
                      </p>
                    </div>

                    {/* Metaverse Highlights Grid */}
                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                        {t.metaverseCityFeaturesTag}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono text-slate-300">
                        <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-950/70 border border-white/5 flex items-center gap-1.5">
                          <span className="text-cyan-400 font-bold flex-shrink-0">🏢</span>
                          <span className="truncate">{t.metaverseFeature1}</span>
                        </div>
                        <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-950/70 border border-white/5 flex items-center gap-1.5">
                          <span className="text-amber-400 font-bold flex-shrink-0">🤖</span>
                          <span className="truncate">{t.metaverseFeature2}</span>
                        </div>
                        <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-950/70 border border-white/5 flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold flex-shrink-0">🎮</span>
                          <span className="truncate">{t.metaverseFeature3}</span>
                        </div>
                        <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-950/70 border border-white/5 flex items-center gap-1.5">
                          <span className="text-purple-400 font-bold flex-shrink-0">⚡</span>
                          <span className="truncate">{t.metaverseFeature4}</span>
                        </div>
                      </div>
                    </div>

                    {/* Big Hero WAH Button: Jelajahi Kota Metaverse */}
                    <div className="space-y-1.5 sm:space-y-2 pt-0.5 sm:pt-1">
                      <button
                        onClick={() => {
                          soundEngine.unlock();
                          soundEngine.unmute();
                          soundEngine.startBgm();
                          setSoundEnabled(true);
                          setViewMode('city');
                          playSfx(700, 'sine');
                        }}
                        className="w-full py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xl shadow-cyan-500/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] border border-cyan-300/40 tracking-wide uppercase"
                      >
                        <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 animate-bounce flex-shrink-0" />
                        <span className="truncate">{t.metaverseExploreBtn}</span>
                      </button>

                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        <button
                          onClick={() => goToStage(1)}
                          className="py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-[10px] sm:text-[11px] border border-white/10 flex items-center justify-center gap-1 cursor-pointer transition-all hover:border-cyan-400/40 truncate"
                        >
                          <span>{t.metaverseProfileBtn}</span>
                        </button>
                        <button
                          onClick={() => goToStage(2)}
                          className="py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-[10px] sm:text-[11px] border border-white/10 flex items-center justify-center gap-1 cursor-pointer transition-all hover:border-cyan-400/40 truncate"
                        >
                          <span>{t.metaverseWorksBtn}</span>
                        </button>
                        <button
                          onClick={() => goToStage(3)}
                          className="py-1.5 sm:py-2 px-1 rounded-lg sm:rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-[10px] sm:text-[11px] border border-white/10 flex items-center justify-center gap-1 cursor-pointer transition-all hover:border-cyan-400/40 truncate"
                        >
                          <span>{t.metaverseServicesBtn}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 1: Profile & Character Stats */}
                {currentStage === 1 && (
                  <div className="w-full max-w-xl roblox-panel p-5 sm:p-6 space-y-4 animate-fade-in my-auto">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="font-mono text-xs font-bold text-cyan-400">{t.characterStatus}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">{t.characterLevel}</span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl sm:text-2xl font-black text-white">{t.characterName}</h2>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {gender === 'female' ? t.characterRoleDescFemale : t.characterRoleDescMale}
                      </p>
                    </div>

                    {/* Character Gender Selector */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
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
                    <div className="space-y-2.5 pt-0.5">
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
                    <div className="pt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 space-y-0.5 text-center">
                        <div className="text-xs font-mono text-cyan-300 font-bold">{t.badgeWorksCount}</div>
                        <div className="text-[10px] text-slate-400">{t.badgeWorksDesc}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 space-y-0.5 text-center">
                        <div className="text-xs font-mono text-emerald-300 font-bold">{t.badgeSecurity}</div>
                        <div className="text-[10px] text-slate-400">{t.badgeSecurityDesc}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 space-y-0.5 text-center col-span-2 sm:col-span-1">
                        <div className="text-xs font-mono text-amber-300 font-bold">{t.badgeScale}</div>
                        <div className="text-[10px] text-slate-400">{t.badgeScaleDesc}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 2: Projects Showcase */}
                {currentStage === 2 && (
                  <div className="w-full max-w-2xl roblox-panel p-4 sm:p-6 space-y-3.5 animate-fade-in my-auto max-h-[75vh] overflow-y-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-2.5 gap-2">
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                          <Boxes className="w-5 h-5 text-amber-400" />
                          <span>{t.projectsHeading} ({projects.length})</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">{t.projectsSubheading}</p>
                      </div>

                      <button
                        onClick={() => setViewMode('city')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {filteredProjects.map(p => (
                        <div 
                          key={p.id}
                          className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-cyan-500/50 transition-all space-y-2 flex flex-col justify-between"
                        >
                          <div className="space-y-1">
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

                            <h3 className="text-sm font-black text-white">{p.name}</h3>
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
                              className="flex-1 py-1 px-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow"
                            >
                              <span>{lang === 'en' ? 'Live Site' : 'Situs Live'}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => {
                                setTargetBuildingId(p.id);
                                setViewMode('city');
                                playSfx(650, 'triangle');
                              }}
                              className="py-1 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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

                {/* STAGE 3: Services */}
                {currentStage === 3 && (
                  <div className="w-full max-w-xl roblox-panel p-5 sm:p-6 space-y-4 animate-fade-in my-auto max-h-[75vh] overflow-y-auto">
                    <div className="border-b border-white/10 pb-2.5">
                      <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span>{t.servicesHeading}</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">{t.servicesSubheading}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.map((svc, i) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="p-2 rounded-xl bg-slate-900 border border-white/10">
                              {svc.icon}
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-white/10">
                              {svc.tag}
                            </span>
                          </div>

                          <h3 className="text-xs sm:text-sm font-bold text-white">{svc.title}</h3>
                          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">{svc.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STAGE 4: Contact & Collaboration */}
                {currentStage === 4 && (
                  <div className="w-full max-w-lg roblox-panel roblox-panel-glow p-5 sm:p-7 text-center space-y-4 animate-fade-in my-auto">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-500/30">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>

                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {t.contactHeading}
                      </h2>
                      <p className="text-xs text-slate-300 max-w-md mx-auto mt-1.5 leading-relaxed">
                        {t.contactSubheading}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2.5 pt-1">
                      <a
                        href="https://wa.me/6281295175618?text=Halo%20Al%20Fargan,%20saya%20tertarik%20konsultasi%20mengenai%20solusi%20website%20/%20software%20AI..."
                        target="_blank"
                        rel="noreferrer"
                        onClick={triggerConfetti}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 cursor-pointer transition-all hover:scale-105"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span>{t.contactWhatsAppCta}</span>
                      </a>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {t.contactSubtext}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Stage Dots Pager Bottom Nav */}
            <nav 
              aria-label="Navigasi Pager Stage" 
              className="relative z-40 w-full px-2.5 sm:px-5 py-2 sm:py-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-md flex items-center justify-between flex-shrink-0 gap-2"
            >
              <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate">
                <span className="hidden sm:inline">STAGE </span><strong className="text-cyan-400">{currentStage + 1}</strong>/{totalStages}: <span className="text-slate-200">{stageNames[currentStage]}</span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {Array.from({ length: totalStages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToStage(idx)}
                    aria-label={`Buka babak ${idx + 1}: ${stageNames[idx]}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentStage === idx
                        ? 'w-4 sm:w-6 bg-cyan-400 shadow-md shadow-cyan-400/50'
                        : 'w-1.5 sm:w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                <button
                  onClick={handlePrevStage}
                  className="px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-[10px] sm:text-xs cursor-pointer font-bold"
                >
                  ◀ <span className="hidden sm:inline">{lang === 'en' ? 'Prev' : 'Sebelumnya'}</span>
                </button>
                <button
                  onClick={handleNextStage}
                  className="px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-[10px] sm:text-xs cursor-pointer font-bold"
                >
                  <span className="hidden sm:inline">{lang === 'en' ? 'Next' : 'Berikutnya'}</span> ▶
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
