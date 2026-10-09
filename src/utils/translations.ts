export type Language = 'id' | 'en';
export type DayNightMode = 'day' | 'night';
export type CharacterGender = 'male' | 'female';

export const translations = {
  id: {
    // Topbar & Navigation
    cityMode: 'Kota 3D',
    cinematicMode: 'Presentasi',
    dayMode: 'Siang',
    nightMode: 'Malam',
    charMale: 'Pria',
    charFemale: 'Wanita',
    bgmOn: 'BGM 🎵',
    bgmMute: 'MUTE 🔇',
    langToggle: '🇮🇩 ID',

    // HUD & Controls
    radarTitle: 'RADAR KOTA 3D',
    radarSubtitle: 'PETA TELEPORTASI METAVERSE',
    buildingDirectory: 'Daftar Gedung Karya',
    closeRadar: '✕ Tutup',
    compassNorth: 'Utara',
    controlsHintDesktop: 'Gerak: W A S D / Panah • Lompat: Spasi • Putar/Zoom: Geser Mouse',
    controlsHintMobile: 'Gunakan D-Pad untuk berjalan • Geser layar untuk memutar sudut pandang',
    jumpBtn: 'Lompat',
    visitWebsiteBtn: 'Kunjungi Website',
    backToCityBtn: 'Kembali ke Kota',
    launchTabBtn: 'Buka Website Live di Tab Baru',

    // Stages
    stageLobby: 'LOBBY',
    stageCharacter: 'KARAKTER',
    stageProjects: 'KARYA',
    stageServices: 'LAYANAN',
    stageContact: 'KONTAK',

    // Stage 1: Lobby / Metaverse Welcome Dialogue
    lobbyBadge: 'EXPERIENCE THE DIGITAL REVOLUTION',
    lobbyHeading1: 'Ciptakan Software Cerdas.',
    lobbyHeading2: 'Bangun Skala Bisnis.',
    lobbyBio: 'Halo, saya adalah kreator di balik Fargan Digital AI. Spesialis merancang perangkat lunak kelas industri, arsitektur cloud performa tinggi, dan otomatisasi AI mutakhir untuk pemilik brand & pengusaha.',
    lobbyEnterCity: 'Masuk & Eksplorasi Kota 3D',
    lobbyViewProfile: 'Lihat Profil Karakter',
    metaverseWelcomeTag: 'AI GUIDE VIRTUAL • METAVERSE FARGAN DIGITAL CREATIVE',
    metaverseSpeakerTitle: 'Fargan (Avatar Digital & Lead Architect)',
    metaverseSpeakerStatus: 'TRANSMISI SUARA LANGSUNG • KOTA DIGITAL AKTIF',
    metaverseGreetingSpeech: 'Selamat datang di Metaverse Portofolio Fargan Digital Creative! Saya adalah avatar digital dari Fargan. Di kota 3D masa depan ini, seluruh portofolio rekayasa software, aplikasi SaaS, dan otomatisasi AI kami diwujudkan menjadi gedung-gedung kota yang hidup. Anda dapat berjalan bebas, berdialog langsung dengan staf resepsionis AI di setiap gedung, memeriksa spesifikasi teknologi, hingga meluncurkan setiap website secara live. Siap menjelajah?',
    metaverseExploreBtn: '🚀 JELAJAHI KOTA METAVERSE FARGAN DIGITAL CREATIVE ➔',
    metaverseProfileBtn: 'Profil Engineer 👤',
    metaverseWorksBtn: '11 Gedung Kota 🏢',
    metaverseServicesBtn: 'Solusi Layanan ⚡',
    metaverseCityFeaturesTag: 'KAPABILITAS METAVERSE:',
    metaverseFeature1: '11 Gedung 3D Termasuk Menara Pusat HQ',
    metaverseFeature2: 'Resepsionis AI Percakapan Real-Time',
    metaverseFeature3: 'Navigasi Bebas W A S D & Orbit 360°',
    metaverseFeature4: 'Situs Produksi Live di Cloudflare & Vercel',

    // Stage 2: Character
    characterStatus: 'STATUS KARAKTER: ONLINE',
    characterLevel: 'LVL. 99 FULLSTACK ENG',
    characterName: 'Fargan',
    characterRoleDescMale: 'Software Engineer & AI Architect yang memadukan keahlian teknik full-stack modern dengan pemahaman mendalam tentang unit ekonomi bisnis, margin profitabilitas, dan konversi pemasaran digital.',
    characterRoleDescFemale: 'Software Engineer & AI Architect (Edisi Avatar Digital) yang memadukan keahlian arsitektur cloud modern dengan otomasi AI mutakhir dan desain antarmuka imersif masa depan.',
    statWebSaas: 'Arsitektur Web & SaaS (React/TypeScript/Cloudflare)',
    statAiWorkflow: 'AI Workflow & LLM Integration',
    statEnterpriseCloud: 'Enterprise Cloud Architecture & Scalability',
    badgeWorksCount: '11+ Karya Web & HQ',
    badgeWorksDesc: 'Beroperasi aktif di Cloudflare & Vercel',
    badgeSecurity: 'Anti Kebocoran',
    badgeSecurityDesc: 'Proteksi data & unit ekonomi teruji',
    badgeScale: 'High Scalability',
    badgeScaleDesc: 'Arsitektur cloud global dengan ketahanan traffic tinggi',
    charGenderPrompt: 'PILIH MODEL KARAKTER:',

    // Stage 3: Projects
    projectsHeading: 'Koleksi Karya Digital & Gedung Kota',
    projectsSubheading: 'Semua situs web di bawah ini aktif beroperasi dan dapat dikunjungi langsung',
    projectsOpenCity: 'Buka Kota 3D ➔',
    filterAll: 'Semua',
    filterEnterprise: 'Enterprise & AI',
    filterFintech: 'FinTech & Security',
    filterCorporate: 'Korporat B2B',
    filterProperty: 'Properti & Agensi',
    filterConsumer: 'F&B, Fashion & Fitness',
    projectCapabilities: 'Spesifikasi & Kapabilitas:',

    // Stage 4: Services
    servicesHeading: 'Solusi Rekayasa & Layanan Digital',
    servicesSubheading: 'Membantu bisnis bertransformasi dengan teknologi modern berkecepatan tinggi',
    service1Title: 'Custom Web & SaaS Development',
    service1Desc: 'Membangun aplikasi web, portal bisnis, dan software SaaS kelas produksi dengan performa ultra-cepat, keamanan enterprise-grade, dan arsitektur serverless modern.',
    service2Title: 'Integrasi AI Agent & Otomasi',
    service2Desc: 'Mengotomatiskan alur bisnis Anda dengan bot WhatsApp cerdas, pembersihan data otomatis, dan agen AI yang bekerja 24/7 menghemat waktu Anda.',
    service3Title: 'UI/UX & Interactive Landing Page',
    service3Desc: 'Merancang antarmuka web modern, estetik, responsif, dan fokus konversi tinggi yang memikat pelanggan dalam 3 detik pertama.',
    service4Title: 'Konsultasi Arsitektur Digital',
    service4Desc: 'Membantu brand owner & pengusaha merancang blueprint teknologi, efisiensi sistem berskala besar, dan kesiapan ekspansi bisnis.',

    // Stage 5: Contact
    contactHeading: 'Mari Kolaborasi & Bangun Bersama!',
    contactSubheading: 'Punya ide software, butuh otomatisasi AI cerdas, atau ingin portofolio digital interaktif 3D seperti ini? Pintu server terbuka untuk Anda.',
    contactWhatsAppCta: 'Chat WhatsApp: 0812-9517-5618 (Konsultasi Bisnis)',
    contactSubtext: 'Fast Response • Fargan • Siap Diskusi Arsitektur & Penawaran',

    // CS Dialogue Card
    csGreetingHeader: 'KONSULTASI & INFORMASI RESEPSIONIS',
    csBadgeLive: 'KARYA AKTIF'
  },
  en: {
    // Topbar & Navigation
    cityMode: '3D City',
    cinematicMode: 'Showcase',
    dayMode: 'Day',
    nightMode: 'Night',
    charMale: 'Male',
    charFemale: 'Female',
    bgmOn: 'BGM 🎵',
    bgmMute: 'MUTE 🔇',
    langToggle: '🇬🇧 EN',

    // HUD & Controls
    radarTitle: '3D CITY RADAR',
    radarSubtitle: 'METAVERSE TELEPORT MAP',
    buildingDirectory: 'Building Directory',
    closeRadar: '✕ Close',
    compassNorth: 'North',
    controlsHintDesktop: 'Move: W A S D / Arrows • Jump: Space • Orbit/Zoom: Drag Mouse',
    controlsHintMobile: 'Use D-Pad to walk • Drag screen to orbit camera',
    jumpBtn: 'Jump',
    visitWebsiteBtn: 'Visit Website',
    backToCityBtn: 'Back to City',
    launchTabBtn: 'Launch Live Website in New Tab',

    // Stages
    stageLobby: 'LOBBY',
    stageCharacter: 'CHARACTER',
    stageProjects: 'PORTFOLIO',
    stageServices: 'SERVICES',
    stageContact: 'CONTACT',

    // Stage 1: Lobby / Metaverse Welcome Dialogue
    lobbyBadge: 'EXPERIENCE THE DIGITAL REVOLUTION',
    lobbyHeading1: 'Craft Intelligent Software.',
    lobbyHeading2: 'Scale Enterprise Business.',
    lobbyBio: 'Hello, I am the creator behind Fargan Digital AI. Specializing in enterprise-grade software engineering, high-performance cloud architecture, and cutting-edge AI automation for brand owners & entrepreneurs.',
    lobbyEnterCity: 'Enter & Explore 3D City',
    lobbyViewProfile: 'View Character Profile',
    metaverseWelcomeTag: 'AI VIRTUAL GUIDE • FARGAN DIGITAL CREATIVE METAVERSE',
    metaverseSpeakerTitle: 'Fargan (Digital Avatar & Lead Architect)',
    metaverseSpeakerStatus: 'LIVE AUDIO BROADCAST • DIGITAL METROPOLIS ONLINE',
    metaverseGreetingSpeech: 'Welcome to the Fargan Digital Creative Metaverse Portfolio! I am the digital avatar of Fargan. In this futuristic 3D virtual world, our entire software engineering, SaaS applications, and AI automation portfolio are manifested as living city skyscrapers. You can freely explore, chat directly with AI receptionists at each building, inspect technical architecture, and launch live production websites. Ready to explore?',
    metaverseExploreBtn: '🚀 EXPLORE FARGAN DIGITAL CREATIVE METAVERSE ➔',
    metaverseProfileBtn: 'Engineer Profile 👤',
    metaverseWorksBtn: '11 City Buildings 🏢',
    metaverseServicesBtn: 'Solutions & Services ⚡',
    metaverseCityFeaturesTag: 'METAVERSE CAPABILITIES:',
    metaverseFeature1: '11 3D Buildings Including Central HQ Tower',
    metaverseFeature2: 'Real-Time Conversational AI Receptionists',
    metaverseFeature3: 'Free W A S D Walk & 360° Orbit Navigation',
    metaverseFeature4: 'Live Production Deployments on Cloudflare & Vercel',

    // Stage 2: Character
    characterStatus: 'CHARACTER STATUS: ONLINE',
    characterLevel: 'LVL. 99 FULLSTACK ENG',
    characterName: 'Fargan',
    characterRoleDescMale: 'Software Engineer & AI Architect combining modern full-stack engineering with deep mastery of unit economics, net margins, and high-conversion digital growth.',
    characterRoleDescFemale: 'Software Engineer & AI Architect (Digital Avatar Edition) fusing cutting-edge cloud architectures with autonomous AI workflows and immersive future UI systems.',
    statWebSaas: 'Web & SaaS Architecture (React/TypeScript/Cloudflare)',
    statAiWorkflow: 'AI Workflow & LLM Integration',
    statEnterpriseCloud: 'Enterprise Cloud Architecture & Scalability',
    badgeWorksCount: '11+ Live Systems & HQ',
    badgeWorksDesc: 'Operating globally on Cloudflare & Vercel',
    badgeSecurity: 'Zero Leakage',
    badgeSecurityDesc: 'Rock-solid data protection & proven unit economics',
    badgeScale: 'High Scalability',
    badgeScaleDesc: 'Global cloud architecture engineered for high-traffic spikes',
    charGenderPrompt: 'SELECT AVATAR MODEL:',

    // Stage 3: Projects
    projectsHeading: 'Digital Works & 3D City Buildings',
    projectsSubheading: 'All software and web applications below are live and ready for instant exploration',
    projectsOpenCity: 'Open 3D City ➔',
    filterAll: 'All',
    filterEnterprise: 'Enterprise & AI',
    filterFintech: 'FinTech & Security',
    filterCorporate: 'Corporate B2B',
    filterProperty: 'Property & Agency',
    filterConsumer: 'F&B, Fashion & Fitness',
    projectCapabilities: 'Specifications & Capabilities:',

    // Stage 4: Services
    servicesHeading: 'Engineering Solutions & Digital Services',
    servicesSubheading: 'Empowering enterprises to scale with cutting-edge, high-velocity digital products',
    service1Title: 'Custom Web & SaaS Development',
    service1Desc: 'Building production-grade web applications, business portals, and SaaS platforms with ultra-fast performance, enterprise security, and modern serverless architectures.',
    service2Title: 'AI Agent & Autonomous Workflows',
    service2Desc: 'Automating business operations with intelligent WhatsApp bots, autonomous data cleaning pipelines, and 24/7 AI agents that multiply your productivity.',
    service3Title: 'UI/UX & Interactive Landing Pages',
    service3Desc: 'Designing modern, aesthetic, responsive, high-converting digital interfaces that captivate your customers within the first 3 seconds.',
    service4Title: 'Digital Architecture Advisory',
    service4Desc: 'Guiding brand owners and entrepreneurs to architect bulletproof technology blueprints, optimize cloud efficiency, and prepare for rapid business scaling.',

    // Stage 5: Contact
    contactHeading: "Let's Collaborate & Build Together!",
    contactSubheading: 'Have a software vision, need autonomous AI agents, or want an interactive 3D digital metaverse portfolio like this? Server doors are open for you.',
    contactWhatsAppCta: 'Chat WhatsApp: 0812-9517-5618 (Business Advisory)',
    contactSubtext: 'Fast Response • Fargan • Ready for Architecture Discussions & Quotations',

    // CS Dialogue Card
    csGreetingHeader: 'RECEPTIONIST CS ADVISORY',
    csBadgeLive: 'ACTIVE PRODUCTION'
  }
};
