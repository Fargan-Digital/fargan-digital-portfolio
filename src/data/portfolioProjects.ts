/**
 * ============================================================================
 * FARGAN DIGITAL AI — MASTER DATABASE KARYA & GEDUNG KOTA 3D (BILINGUAL ID & EN)
 * ============================================================================
 */

export interface CityBuilding {
  id: string;
  name: string;
  subtitle: string;
  subtitleEn?: string;
  category: string;
  categoryEn?: string;
  categoryGroup: 'enterprise' | 'fintech_security' | 'corporate_b2b' | 'property_agency' | 'consumer_lifestyle';
  position: [number, number, number];
  color: number;
  neonColor: number;
  height: number;
  width: number;
  depth: number;
  url: string;
  badge: string;
  badgeEn?: string;
  desc: string;
  descEn?: string;
  features: string[];
  featuresEn?: string[];
  npcName: string;
  npcRole: string;
  npcRoleEn?: string;
  dialogueText: string;
  dialogueTextEn?: string;
}

export const portfolioProjects: CityBuilding[] = [
  {
    id: 'brandpulse',
    name: 'Brand Owner OS (BrandPulse AI)',
    subtitle: 'Software CFO & Reseller Intelligence untuk Brand Owner',
    subtitleEn: 'Intelligent CFO & Reseller Network Operating System for Brand Owners',
    category: 'Enterprise SaaS • Production Ready',
    categoryEn: 'Enterprise SaaS • Production Ready',
    categoryGroup: 'enterprise',
    position: [0, 5, -22],
    color: 0x0F1B29,
    neonColor: 0x00A2FF, // Electric Cyan
    height: 10,
    width: 10,
    depth: 8,
    url: 'https://brand-owner.pages.dev',
    badge: 'FLAGSHIP ERP (LIVE)',
    badgeEn: 'FLAGSHIP ERP (LIVE)',
    desc: 'Software finansial cerdas yang memotong kebocoran laba bersih secara real-time, memetakan jaringan reseller di peta GeoPulse, mendeteksi iklan boncos, mutasi gudang pintar, dan webhook TikTok/Shopee.',
    descEn: 'Intelligent financial enterprise software that eliminates net profit leaks in real time, visualizes reseller distributors across Indonesia on interactive GeoPulse maps, detects ad spend waste, and automates multi-channel inventory.',
    features: [
      'Live Webhook Sync pesanan TikTok Shop & Shopee',
      'Peta Sebaran Interaktif Indonesia (Hot vs Cold Zone)',
      'Smart Warehouse Ledger & Safety Stock Threshold',
      'Estimasi Kalender Pencairan Kas & Generator PO Maklon'
    ],
    featuresEn: [
      'Live Webhook Sync for TikTok Shop & Shopee orders',
      'Interactive Indonesian GeoPulse Heatmap (Hot vs Cold Zones)',
      'Smart Warehouse Ledger with automated safety stock alerts',
      'Cash flow disbursement projection calendar & PO generator'
    ],
    npcName: 'Alex Pratama',
    npcRole: '💼 CFO Advisor — Brand Owner OS',
    npcRoleEn: '💼 CFO Advisor — Brand Owner OS',
    dialogueText: 'Halo Brand Owner! Selamat datang di Brand Owner OS. Ini adalah operating system finansial terpadu yang memotong kebocoran laba bersih, mendeteksi iklan boncos, memetakan reseller di peta GeoPulse, dan mengatur mutasi gudang pintar secara otomatis. Silakan klik tombol untuk menjelajahi software live kami!',
    dialogueTextEn: 'Hello Brand Owner! Welcome to Brand Owner OS. This is our unified financial operating system engineered to eliminate net profit leaks, detect unprofitable ad campaigns, map nationwide reseller distributors, and automate inventory syncing in real time. Click the button below to launch the live platform!'
  },
  {
    id: 'anti-sobis',
    name: 'Anti Sobis Scanner',
    subtitle: 'Scan Link & Nomor Telepon Sebelum Kena Penipuan Online',
    subtitleEn: 'Scan Links & Phone Numbers Before Falling Victim to Online Scams',
    category: 'AI Cyber Security & Fraud Prevention',
    categoryEn: 'AI Cyber Security & Fraud Prevention',
    categoryGroup: 'fintech_security',
    position: [-18, 4.5, -16],
    color: 0x220A16,
    neonColor: 0xFF0055, // Alert Magenta Red
    height: 9,
    width: 8,
    depth: 7,
    url: 'https://laporkan-sobis.pages.dev',
    badge: 'CYBER FRAUD DETECTOR',
    badgeEn: 'CYBER FRAUD DETECTOR',
    desc: 'Platform intelijen keamanan siber untuk memverifikasi tautan phishing, nomor HP, dan rekening bank sindikat penipuan online (sobis) di Indonesia sebelum korban mentransfer dana.',
    descEn: 'Cybersecurity intelligence platform that verifies deceptive phishing links, suspicious phone numbers, and syndicate bank accounts across Indonesia before victims transfer funds.',
    features: [
      'Detektor URL & link manipulatif phishing otomatis',
      'Basis data verifikasi nomor telepon & rekening sindikat',
      'Edukasi preventif & laporan instan masyarakat digital'
    ],
    featuresEn: [
      'Automated URL & manipulative phishing link detector',
      'Syndicate phone number & fraud bank account database',
      'Preventive community intelligence & instant fraud reporting'
    ],
    npcName: 'Kapten Radit',
    npcRole: '🛡️ Cyber Sentinel — Anti Sobis',
    npcRoleEn: '🛡️ Cyber Sentinel — Anti Sobis',
    dialogueText: 'Waspada penipuan digital! Saya adalah agen pengawas Anti Sobis. Sistem ini bertugas memindai tautan mencurigakan, memeriksa nomor HP dan rekening bank sindikat penipuan online (sobis) sebelum korban mentransfer dana. Klik tombol untuk mencoba scanner live!',
    dialogueTextEn: 'Digital fraud alert! I am Captain Radit, Cyber Sentinel of Anti Sobis. Our mission is to analyze suspicious URLs, detect malicious phishing pages, and verify fraudulent phone & bank numbers before financial harm occurs. Click below to try our live scanner!'
  },
  {
    id: 'fargan-guard-trading',
    name: 'Fargan Guard Trading',
    subtitle: 'FinTech Terminal & Trading Risk Management Matrix',
    subtitleEn: 'FinTech Terminal & Trading Risk Management Matrix',
    category: 'FinTech & Trading Intelligence',
    categoryEn: 'FinTech & Trading Intelligence',
    categoryGroup: 'fintech_security',
    position: [18, 4.5, -16],
    color: 0x06150E,
    neonColor: 0x00FF66, // Matrix Green
    height: 9,
    width: 8,
    depth: 7,
    url: 'https://fargan-guard-trading.pages.dev',
    badge: 'FINTECH RISK MATRIX',
    badgeEn: 'FINTECH RISK MATRIX',
    desc: 'Terminal dark-matrix kuantitatif untuk manajemen risiko trading, kalkulasi ukuran posisi lot, penjaga batas kerugian maksimal (anti-margin call), dan disiplin psikologi pasar.',
    descEn: 'Quantitative dark-matrix trading terminal for risk management, algorithmic position lot sizing, automated maximum drawdown locks, and trading psychology discipline.',
    features: [
      'Antarmuka Dark Cyberpunk Matrix berkecepatan tinggi',
      'Kalkulator Position Sizing & Risk-to-Reward presisi',
      'Disiplin psikologi trading & batas stop-loss otomatis'
    ],
    featuresEn: [
      'High-velocity Dark Cyberpunk Matrix terminal interface',
      'Precision position sizing & risk-to-reward ratio calculator',
      'Market psychology guardrails & automated capital preservation'
    ],
    npcName: 'Neo Matrix',
    npcRole: '📈 Risk Guard — Trading Matrix',
    npcRoleEn: '📈 Risk Guard — Trading Matrix',
    dialogueText: 'Selamat datang di Terminal Fargan Guard Trading. Di sini kami mengunci risiko trading dengan disiplin Matrix: kalkulator lot presisi, stop loss guard otomatis, dan proteksi modal dari bahaya margin call. Silakan akses terminal trading live kami!',
    dialogueTextEn: 'Welcome to the Fargan Guard Trading Terminal. Here we enforce mathematical market discipline: precision lot calculators, automated stop-loss locks, and strict risk-to-reward matrices to protect your trading capital. Launch the live terminal below!'
  },
  {
    id: 'roban-alam-lestari',
    name: 'PT Roban Alam Lestari',
    subtitle: 'Solusi Terpadu Pengelolaan Limbah B3, Non-B3 & Medis',
    subtitleEn: 'Comprehensive Hazardous, Industrial & Medical Waste Management',
    category: 'Corporate Enterprise B2B',
    categoryEn: 'Corporate Enterprise B2B',
    categoryGroup: 'corporate_b2b',
    position: [-26, 4, -2],
    color: 0x0B231B,
    neonColor: 0x10B981, // Emerald Green
    height: 8,
    width: 8,
    depth: 8,
    url: 'https://robanalamlestari.co.id',
    badge: 'CORPORATE B2B PORTAL',
    badgeEn: 'CORPORATE B2B PORTAL',
    desc: 'Website korporat resmi perusahaan pengolah limbah B3 berlisensi Kementerian Lingkungan Hidup & Kehutanan (KLHK). Menampilkan legalitas perizinan, kapasitas armada, dan manifest limbah terpadu.',
    descEn: 'Official enterprise corporate portal for an accredited environmental waste management enterprise licensed by the Ministry of Environment and Forestry (KLHK).',
    features: [
      'Legalitas resmi KLHK & sertifikasi standar lingkungan hidup',
      'Katalog pengolahan limbah industri manufaktur & medis',
      'Sistem permohonan penjemputan limbah B2B terstruktur'
    ],
    featuresEn: [
      'Official KLHK licensing & verified environmental certifications',
      'Manufacturing & clinical medical waste processing catalog',
      'Structured enterprise B2B pickup logistics request system'
    ],
    npcName: 'Dra. Ratna',
    npcRole: '🌿 Compliance Officer — Roban Lestari',
    npcRoleEn: '🌿 Compliance Officer — Roban Lestari',
    dialogueText: 'Selamat datang di PT Roban Alam Lestari. Kami adalah partner industri terpercaya dalam pengelolaan limbah B3, Non-B3, dan limbah medis berizin resmi KLHK dengan manifest digital terpadu. Silakan kunjungi portal resmi kami!',
    dialogueTextEn: 'Welcome to PT Roban Alam Lestari. We are a trusted enterprise industrial partner for certified hazardous (B3), non-hazardous, and medical waste management fully licensed by KLHK with digital manifest tracking. Explore our portal below!'
  },
  {
    id: 'han-waste',
    name: 'PT Hijau Alam Nusantara',
    subtitle: 'Professional Waste Management & Oil Drilling Waste Services',
    subtitleEn: 'Professional Industrial Oil & Drilling Waste Management Services',
    category: 'Industrial Oil & Drilling Logistics',
    categoryEn: 'Industrial Oil & Drilling Logistics',
    categoryGroup: 'corporate_b2b',
    position: [-26, 4, 12],
    color: 0x15220A,
    neonColor: 0x84CC16, // Industrial Lime
    height: 8,
    width: 8,
    depth: 8,
    url: 'https://han-waste.pages.dev/',
    badge: 'INDUSTRIAL LOGISTICS',
    badgeEn: 'INDUSTRIAL LOGISTICS',
    desc: 'Layanan terpadu pengelolaan limbah industri pengeboran migas (drilling muds & cutting sludge), pengolahan termal, bioremediasi tanah tercemar, dan armada logistik berspesifikasi berat.',
    descEn: 'Integrated logistics and processing for oil & gas drilling waste (muds & cutting sludge), thermal desorption, contaminated soil bioremediation, and heavy-duty transport.',
    features: [
      'Drilling waste management sektor eksplorasi migas',
      'Fasilitas bioremediasi & pemulihan lingkungan berstandar HSE',
      'Armada transportasi limbah berizin khusus antar-provinsi'
    ],
    featuresEn: [
      'Specialized drilling waste treatment for oil & gas exploration',
      'Bioremediation & environmental restoration facilities with full HSE',
      'Inter-provincial specialized heavy hazardous transport fleet'
    ],
    npcName: 'Ir. Hendra',
    npcRole: '🛢️ HSE Lead — HAN Waste',
    npcRoleEn: '🛢️ HSE Lead — HAN Waste',
    dialogueText: 'Salam industri berkelanjutan! PT Hijau Alam Nusantara menyediakan solusi pengolahan limbah pengeboran migas, bioremediasi tanah, dan armada logistik berspesifikasi berat dengan kepatuhan standar HSE penuh. Silakan cek layanan kami!',
    dialogueTextEn: 'Sustainable industrial greetings! PT Hijau Alam Nusantara delivers certified offshore and onshore oil & gas drilling waste management, soil bioremediation, and specialized transport with rigorous HSE compliance. Discover our full logistics capability!'
  },
  {
    id: 'kavling-morowali',
    name: 'Kavling Morowali',
    subtitle: 'Tanah Kavling Siap Bangun di Bahodopi Kawasan Industri Nikel',
    subtitleEn: 'Prime Ready-to-Build Land Plots in Bahodopi Nickel Industrial Hub',
    category: 'Real Estate & Property Landing Page',
    categoryEn: 'Real Estate & Property Landing Page',
    categoryGroup: 'property_agency',
    position: [26, 4, -2],
    color: 0x241A0B,
    neonColor: 0xF59E0B, // Amber Gold
    height: 8,
    width: 8,
    depth: 8,
    url: 'https://kavling-morowali.pages.dev',
    badge: 'REAL ESTATE PROPERTY',
    badgeEn: 'REAL ESTATE PROPERTY',
    desc: 'Landing page properti berkonversi tinggi untuk penjualan kavling tanah strategis siap bangun di Bahodopi, Morowali (lingkar kawasan industri nikel IMIP) dengan sertifikat SHM mulai 25 jutaan.',
    descEn: 'High-conversion property landing page for premium residential and commercial land plots in Bahodopi, Morowali near the global IMIP nickel industrial park with SHM title deeds.',
    features: [
      'Visualisasi site plan & denah blok kavling interaktif',
      'Skema cicilan fleksibel & jaminan legalitas SHM aman',
      'Integrasi 1-klik WhatsApp booking konsultasi unit'
    ],
    featuresEn: [
      'Interactive master site-plan & block layout visualizer',
      'Flexible installment payment plans with guaranteed legal SHM deeds',
      '1-click direct WhatsApp booking & private unit survey'
    ],
    npcName: 'Bagus S.',
    npcRole: '🏡 Property Advisor — Kavling Morowali',
    npcRoleEn: '🏡 Property Advisor — Kavling Morowali',
    dialogueText: 'Mencari investasi properti bernilai tinggi? Kavling Bahodopi Morowali menawarkan tanah kavling strategis siap bangun di dekat lingkar industri nikel IMIP dengan legalitas SHM mulai Rp25 jutaan. Silakan jelajahi denah kavlingnya!',
    dialogueTextEn: 'Looking for a high-yield property investment? Kavling Bahodopi Morowali offers prime ready-to-build plots adjacent to the booming IMIP nickel industrial zone with SHM certification starting from Rp25M. Explore our block site plan now!'
  },
  {
    id: 'farghan-digital-marketing',
    name: 'Farghan Digital Marketing',
    subtitle: 'Jasa Pembuatan Website Marketing Terima Beres & Mesin Cuan',
    subtitleEn: 'Turnkey Marketing Websites & Automated Sales Conversion Engine',
    category: 'Digital Agency & Conversion Growth',
    categoryEn: 'Digital Agency & Conversion Growth',
    categoryGroup: 'property_agency',
    position: [26, 4, 12],
    color: 0x1A0D2E,
    neonColor: 0xA855F7, // Electric Purple
    height: 8,
    width: 8,
    depth: 8,
    url: 'https://farghan-digital-marketing.pages.dev/',
    badge: 'MARKETING AGENCY',
    badgeEn: 'MARKETING AGENCY',
    desc: 'Agensi pembuatan website marketing berfokus pada hasil penjualan dan konversi prospek bisnis. Menggabungkan copywriting hipnotik, kecepatan kilat, dan arsitektur landing page modern.',
    descEn: 'Performance digital agency crafting turnkey marketing websites focused on revenue conversion, magnetic sales copywriting, sub-second load times, and conversion tracking.',
    features: [
      'Copywriting berfokus closing & konversi penjualan otomatis',
      'Performa ultra cepat (Google PageSpeed Score 95+)',
      'Setup tracking piksel Meta Ads, TikTok Pixel & Google Ads'
    ],
    featuresEn: [
      'High-conversion sales copywriting engineered for automated closing',
      'Ultra-fast load speeds (Google PageSpeed Score 95+)',
      'Multi-channel pixel integration for Meta, TikTok & Google Ads'
    ],
    npcName: 'Rian F.',
    npcRole: '🚀 Growth Strategist — Marketing Agency',
    npcRoleEn: '🚀 Growth Strategist — Marketing Agency',
    dialogueText: 'Ingin website yang bikin cuan, bukan sekadar tampil? Farghan Digital Marketing merancang website terima beres dengan copywriting berfokus konversi, kecepatan tinggi, dan strategi closing otomatis. Mari lihat portofolio agency kami!',
    dialogueTextEn: 'Want a website that actively generates revenue instead of just looking pretty? Farghan Digital Marketing builds turnkey web machines equipped with hypnotic conversion copy, blazing speed, and automated sales closing. Check out our agency portfolio!'
  },
  {
    id: 'fargan-kopi',
    name: 'Fargan Kopi',
    subtitle: 'Ngopi Bareng? Di Mana Ajah Boleh! — F&B Coffee Commerce',
    subtitleEn: 'Coffee Anywhere, Anytime! — Smart F&B Hyperlocal Quick Commerce',
    category: 'F&B Brand & Quick Commerce',
    categoryEn: 'F&B Brand & Quick Commerce',
    categoryGroup: 'consumer_lifestyle',
    position: [-16, 3.5, 24],
    color: 0x251408,
    neonColor: 0xD97706, // Caramel Amber
    height: 7,
    width: 7.5,
    depth: 7,
    url: 'https://fargan-kopi.pages.dev/',
    badge: 'F&B BRAND COMMERCE',
    badgeEn: 'F&B BRAND COMMERCE',
    desc: 'Platform digital brand F&B modern untuk pemesanan kopi susu aren, kopi kemasan cup harian, hingga botol 1 liter. Menampilkan pengalaman visual menu interaktif yang menggugah selera.',
    descEn: 'Modern F&B brand commerce platform integrating artisanal palm sugar coffee ordering, on-demand cup deliveries, 1-liter party bottles, and a smart cloud kitchen POS engine.',
    features: [
      'Menu interaktif kopi artisan & varian susu gula aren',
      'Pemesanan takeaway & opsi literan untuk kantor/rumah',
      'Antarmuka mobile-first responsif dengan checkout ringkas'
    ],
    featuresEn: [
      'Interactive artisan coffee menu with palm sugar signature blends',
      'On-demand takeaway & 1-liter party bottles for home or office',
      'Mobile-first ordering interface with swift, frictionless checkout'
    ],
    npcName: 'Maya Barista',
    npcRole: '☕ Barista & AI Guide — Fargan Kopi',
    npcRoleEn: '☕ Barista & AI Guide — Fargan Kopi',
    dialogueText: 'Halo! Fargan Kopi adalah software cloud kitchen hyperlocal. Mesin yang terintegrasi antara Customer - Mitra - Owner. Lengkap dengan mesin kasir yang smart + fitur "Profesor Perkopian". Silakan kunjungi linknya untuk mencicipi kopi lezat kami!',
    dialogueTextEn: 'Hello! Fargan Kopi is a hyperlocal cloud kitchen software engine connecting Customers, Outlets, and Owners. Featuring a smart cloud POS and our interactive "Coffee Professor" blend guide. Click the link to explore our digital coffee universe!'
  },
  {
    id: 'farghan-butik',
    name: 'Farghan Butik',
    subtitle: 'Desain Butik Busana Muslim & Fashion Online Rasa Premium',
    subtitleEn: 'Luxury Muslim Fashion & High-End E-Commerce Boutique',
    category: 'Fashion & Luxury E-Commerce',
    categoryEn: 'Fashion & Luxury E-Commerce',
    categoryGroup: 'consumer_lifestyle',
    position: [0, 3.5, 24],
    color: 0x280D1C,
    neonColor: 0xEC4899, // Hot Pink Rose
    height: 7,
    width: 7.5,
    depth: 7,
    url: 'https://farghan-butik.pages.dev',
    badge: 'LUXURY BOUTIQUE',
    badgeEn: 'LUXURY BOUTIQUE',
    desc: 'Showcase desain butik fashion premium dengan estetika editorial majalah mewah. Menyuguhkan busana wanita anggun, kurasi kain eksklusif, dan konsultasi arah brand busana.',
    descEn: 'Luxury boutique fashion digital showcase crafted with high-fashion magazine editorial aesthetics, curated modest wear gowns, premium fabrics, and personal styling consultation.',
    features: [
      'Desain majalah mewah (luxury editorial aesthetic)',
      'Katalog koleksi gaun, gamis, dan busana premium',
      'Fitur konsultasi stylist pribadi & custom fitting'
    ],
    featuresEn: [
      'High-end fashion editorial aesthetic with cinematic typography',
      'Curated collection catalog of modest wear, gowns, and abayas',
      'Integrated private stylist consultation & custom fitting requests'
    ],
    npcName: 'Clara Stylist',
    npcRole: '👗 Fashion Curator — Farghan Butik',
    npcRoleEn: '👗 Fashion Curator — Farghan Butik',
    dialogueText: 'Selamat datang di Farghan Butik! Kami menyuguhkan konsep butik busana wanita muslim premium dengan tampilan editorial majalah mewah, katalog busana anggun, dan konsultasi gaya pribadi. Silakan kunjungi butik digital kami!',
    dialogueTextEn: 'Welcome to Farghan Butik! We showcase premium modest women’s fashion with a high-end luxury magazine aesthetic, an exclusive designer catalog, and personal styling appointments. Click below to experience our digital boutique!'
  },
  {
    id: 'hendar-fitness',
    name: 'Hendar Fitness Coach',
    subtitle: 'Personal Trainer Bersertifikat & Atlet Kontes Surabaya',
    subtitleEn: 'Certified Elite Personal Trainer & Surabaya Physique Athlete',
    category: 'Personal Branding & Health Fitness',
    categoryEn: 'Personal Branding & Health Fitness',
    categoryGroup: 'consumer_lifestyle',
    position: [16, 3.5, 24],
    color: 0x211208,
    neonColor: 0xEA580C, // Hyper Orange
    height: 7,
    width: 7.5,
    depth: 7,
    url: 'https://hendar-fitness.pages.dev/',
    badge: 'FITNESS COACHING',
    badgeEn: 'FITNESS COACHING',
    desc: 'Platform personal branding untuk personal trainer dan atlet kontes di Surabaya. Berfokus pada transformasi bentuk tubuh (fat loss & muscle gain), panduan nutrisi, dan coaching 1-on-1.',
    descEn: 'High-impact personal branding platform for an elite bodybuilding competitor and certified personal trainer in Surabaya, featuring customized nutrition plans and body transformations.',
    features: [
      'Galeri bukti nyata transformasi klien bertahap',
      'Paket program pendampingan 1-on-1 & online coaching',
      'Kalkulator kebutuhan kalori harian & konsultasi kebugaran'
    ],
    featuresEn: [
      'Real-world client physique transformation case studies & metrics',
      'Tailored 1-on-1 private training & digital coaching packages',
      'Macro & calorie requirement calculator with direct consultation'
    ],
    npcName: 'Coach Hendar',
    npcRole: '💪 Head Coach — Hendar Fitness',
    npcRoleEn: '💪 Head Coach — Hendar Fitness',
    dialogueText: 'Waktunya wujudkan versi terbaik tubuh Anda! Hendar Fitness Coach menyediakan panduan fat loss, muscle gain, pola makan terukur, dan private coaching bersama atlet kontes berpengalaman di Surabaya. Silakan lihat buktinya!',
    dialogueTextEn: 'Time to forge the strongest version of your body! Hendar Fitness Coach provides customized fat loss, muscle hypertrophy, precision macro nutrition, and 1-on-1 coaching with an elite Surabaya physique athlete. Check out the client results!'
  }
];
