/**
 * ============================================================================
 * FARGAN DIGITAL AI — MASTER DATABASE KARYA & GEDUNG KOTA 3D
 * ============================================================================
 * PANDUAN CEPAT TAMBAH / HAPUS KARYA:
 * 
 * 1. UNTUK MENGHAPUS KARYA:
 *    Cukup hapus atau beri tanda komentar (//) pada blok objek karya yang diinginkan.
 * 
 * 2. UNTUK MENAMBAH KARYA BARU:
 *    Cukup copy-paste salah satu blok di bawah, lalu isi datanya.
 *    Mesin 3D Three.js, NPC Resepsionis, dan halaman presentasi akan
 *    OTOMATIS membuatkan gedung 3D, NPC interaktif, dialog typewriter,
 *    titik radar mini-map, tombol teleport, dan kartu portofolio!
 * ============================================================================
 */

export interface CityBuilding {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  categoryGroup: 'enterprise' | 'fintech_security' | 'corporate_b2b' | 'property_agency' | 'consumer_lifestyle';
  position: [number, number, number];
  color: number;
  neonColor: number;
  height: number;
  width: number;
  depth: number;
  url: string;
  badge: string;
  desc: string;
  features: string[];
  npcName: string;
  npcRole: string;
  dialogueText: string;
}

export const portfolioProjects: CityBuilding[] = [
  {
    id: 'brandpulse',
    name: 'Brand Owner OS (BrandPulse AI)',
    subtitle: 'Software CFO & Reseller Intelligence untuk Brand Owner',
    category: 'Enterprise SaaS • Production Ready',
    categoryGroup: 'enterprise',
    position: [0, 5, -22],
    color: 0x0F1B29,
    neonColor: 0x00A2FF, // Electric Cyan
    height: 10,
    width: 10,
    depth: 8,
    url: 'https://brand-owner.pages.dev',
    badge: 'FLAGSHIP ERP (LIVE)',
    desc: 'Software finansial cerdas yang memotong kebocoran laba bersih secara real-time, memetakan jaringan reseller di peta GeoPulse, mendeteksi iklan boncos, mutasi gudang pintar, dan webhook TikTok/Shopee.',
    features: [
      'Live Webhook Sync pesanan TikTok Shop & Shopee',
      'Peta Sebaran Interaktif Indonesia (Hot vs Cold Zone)',
      'Smart Warehouse Ledger & Safety Stock Threshold',
      'Estimasi Kalender Pencairan Kas & Generator PO Maklon'
    ],
    npcName: 'Alex Pratama',
    npcRole: '💼 CFO Advisor — Brand Owner OS',
    dialogueText: 'Halo Brand Owner! Selamat datang di Brand Owner OS. Ini adalah operating system finansial terpadu yang memotong kebocoran laba bersih, mendeteksi iklan boncos, memetakan reseller di peta GeoPulse, dan mengatur mutasi gudang pintar secara otomatis. Silakan klik tombol untuk menjelajahi software live kami!'
  },
  {
    id: 'anti-sobis',
    name: 'Anti Sobis Scanner',
    subtitle: 'Scan Link & Nomor Telepon Sebelum Kena Penipuan Online',
    category: 'AI Cyber Security & Fraud Prevention',
    categoryGroup: 'fintech_security',
    position: [-18, 4.5, -16],
    color: 0x220A16,
    neonColor: 0xFF0055, // Alert Magenta Red
    height: 9,
    width: 8,
    depth: 7,
    url: 'https://laporkan-sobis.pages.dev',
    badge: 'CYBER FRAUD DETECTOR',
    desc: 'Platform intelijen keamanan siber untuk memverifikasi tautan phishing, nomor HP, dan rekening bank sindikat penipuan online (sobis) di Indonesia sebelum korban mentransfer dana.',
    features: [
      'Detektor URL & link manipulatif phishing otomatis',
      'Basis data verifikasi nomor telepon & rekening sindikat',
      'Edukasi preventif & laporan instan masyarakat digital'
    ],
    npcName: 'Kapten Radit',
    npcRole: '🛡️ Cyber Sentinel — Anti Sobis',
    dialogueText: 'Waspada penipuan digital! Saya adalah agen pengawas Anti Sobis. Sistem ini bertugas memindai tautan mencurigakan, memeriksa nomor HP dan rekening bank sindikat penipuan online (sobis) sebelum korban mentransfer dana. Klik tombol untuk mencoba scanner live!'
  },
  {
    id: 'fargan-guard-trading',
    name: 'Fargan Guard Trading',
    subtitle: 'FinTech Terminal & Trading Risk Management Matrix',
    category: 'FinTech & Trading Intelligence',
    categoryGroup: 'fintech_security',
    position: [18, 4.5, -16],
    color: 0x06150E,
    neonColor: 0x00FF66, // Matrix Green
    height: 9,
    width: 8,
    depth: 7,
    url: 'https://fargan-guard-trading.pages.dev',
    badge: 'FINTECH RISK MATRIX',
    desc: 'Terminal dark-matrix kuantitatif untuk manajemen risiko trading, kalkulasi ukuran posisi lot, penjaga batas kerugian maksimal (anti-margin call), dan disiplin psikologi pasar.',
    features: [
      'Antarmuka Dark Cyberpunk Matrix berkecepatan tinggi',
      'Kalkulator Position Sizing & Risk-to-Reward presisi',
      'Disiplin psikologi trading & batas stop-loss otomatis'
    ],
    npcName: 'Neo Matrix',
    npcRole: '📈 Risk Guard — Trading Matrix',
    dialogueText: 'Selamat datang di Terminal Fargan Guard Trading. Di sini kami mengunci risiko trading dengan disiplin Matrix: kalkulator lot presisi, stop loss guard otomatis, dan proteksi modal dari bahaya margin call. Silakan akses terminal trading live kami!'
  },
  {
    id: 'roban-alam-lestari',
    name: 'PT Roban Alam Lestari',
    subtitle: 'Solusi Terpadu Pengelolaan Limbah B3, Non-B3 & Medis',
    category: 'Corporate Enterprise B2B',
    categoryGroup: 'corporate_b2b',
    position: [-26, 4, -2],
    color: 0x0B231B,
    neonColor: 0x10B981, // Emerald Green
    height: 8,
    width: 8,
    depth: 8,
    url: 'https://robanalamlestari.co.id',
    badge: 'CORPORATE B2B PORTAL',
    desc: 'Website korporat resmi perusahaan pengolah limbah B3 berlisensi Kementerian Lingkungan Hidup & Kehutanan (KLHK). Menampilkan legalitas perizinan, kapasitas armada, dan manifest limbah terpadu.',
    features: [
      'Legalitas resmi KLHK & sertifikasi standar lingkungan hidup',
      'Katalog pengolahan limbah industri manufaktur & medis',
      'Sistem permohonan penjemputan limbah B2B terstruktur'
    ],
    npcName: 'Dra. Ratna',
    npcRole: '🌿 Compliance Officer — Roban Lestari',
    dialogueText: 'Selamat datang di PT Roban Alam Lestari. Kami adalah partner industri terpercaya dalam pengelolaan limbah B3, Non-B3, dan limbah medis berizin resmi KLHK dengan manifest digital terpadu. Silakan kunjungi portal resmi kami!'
  },
  {
    id: 'han-waste',
    name: 'PT Hijau Alam Nusantara',
    subtitle: 'Professional Waste Management & Oil Drilling Waste Services',
    category: 'Industrial Oil & Drilling Logistics',
    categoryGroup: 'corporate_b2b',
    position: [-26, 4, 12],
    color: 0x15220A,
    neonColor: 0x84CC16, // Industrial Lime
    height: 8,
    width: 8,
    depth: 8,
    url: 'https://han-waste.pages.dev/',
    badge: 'INDUSTRIAL LOGISTICS',
    desc: 'Layanan terpadu pengelolaan limbah industri pengeboran migas (drilling muds & cutting sludge), pengolahan termal, bioremediasi tanah tercemar, dan armada logistik berspesifikasi berat.',
    features: [
      'Drilling waste management sektor eksplorasi migas',
      'Fasilitas bioremediasi & pemulihan lingkungan berstandar HSE',
      'Armada transportasi limbah berizin khusus antar-provinsi'
    ],
    npcName: 'Ir. Hendra',
    npcRole: '🛢️ HSE Lead — HAN Waste',
    dialogueText: 'Salam industri berkelanjutan! PT Hijau Alam Nusantara menyediakan solusi pengolahan limbah pengeboran migas, bioremediasi tanah, dan armada logistik berspesifikasi berat dengan kepatuhan standar HSE penuh. Silakan cek layanan kami!'
  },
  {
    id: 'kavling-morowali',
    name: 'Kavling Morowali',
    subtitle: 'Tanah Kavling Siap Bangun di Bahodopi Kawasan Industri Nikel',
    category: 'Real Estate & Property Landing Page',
    categoryGroup: 'property_agency',
    position: [26, 4, -2],
    color: 0x241A0B,
    neonColor: 0xF59E0B, // Amber Gold
    height: 8,
    width: 8,
    depth: 8,
    url: 'https://kavling-morowali.pages.dev',
    badge: 'REAL ESTATE PROPERTY',
    desc: 'Landing page properti berkonversi tinggi untuk penjualan kavling tanah strategis siap bangun di Bahodopi, Morowali (lingkar kawasan industri nikel IMIP) dengan sertifikat SHM mulai 25 jutaan.',
    features: [
      'Visualisasi site plan & denah blok kavling interaktif',
      'Skema cicilan fleksibel & jaminan legalitas SHM aman',
      'Integrasi 1-klik WhatsApp booking konsultasi unit'
    ],
    npcName: 'Bagus S.',
    npcRole: '🏡 Property Advisor — Kavling Morowali',
    dialogueText: 'Mencari investasi properti bernilai tinggi? Kavling Bahodopi Morowali menawarkan tanah kavling strategis siap bangun di dekat lingkar industri nikel IMIP dengan legalitas SHM mulai Rp25 jutaan. Silakan jelajahi denah kavlingnya!'
  },
  {
    id: 'farghan-digital-marketing',
    name: 'Farghan Digital Marketing',
    subtitle: 'Jasa Pembuatan Website Marketing Terima Beres & Mesin Cuan',
    category: 'Digital Agency & Conversion Growth',
    categoryGroup: 'property_agency',
    position: [26, 4, 12],
    color: 0x1A0D2E,
    neonColor: 0xA855F7, // Electric Purple
    height: 8,
    width: 8,
    depth: 8,
    url: 'https://farghan-digital-marketing.pages.dev/',
    badge: 'MARKETING AGENCY',
    desc: 'Agensi pembuatan website marketing berfokus pada hasil penjualan dan konversi prospek bisnis. Menggabungkan copywriting hipnotik, kecepatan kilat, dan arsitektur landing page modern.',
    features: [
      'Copywriting berfokus closing & konversi penjualan otomatis',
      'Performa ultra cepat (Google PageSpeed Score 95+)',
      'Setup tracking piksel Meta Ads, TikTok Pixel & Google Ads'
    ],
    npcName: 'Rian F.',
    npcRole: '🚀 Growth Strategist — Marketing Agency',
    dialogueText: 'Ingin website yang bikin cuan, bukan sekadar tampil? Farghan Digital Marketing merancang website terima beres dengan copywriting berfokus konversi, kecepatan tinggi, dan strategi closing otomatis. Mari lihat portofolio agency kami!'
  },
  {
    id: 'fargan-kopi',
    name: 'Fargan Kopi',
    subtitle: 'Ngopi Bareng? Di Mana Ajah Boleh! — F&B Coffee Commerce',
    category: 'F&B Brand & Quick Commerce',
    categoryGroup: 'consumer_lifestyle',
    position: [-16, 3.5, 24],
    color: 0x251408,
    neonColor: 0xD97706, // Caramel Amber
    height: 7,
    width: 7.5,
    depth: 7,
    url: 'https://fargan-kopi.pages.dev/',
    badge: 'F&B BRAND COMMERCE',
    desc: 'Platform digital brand F&B modern untuk pemesanan kopi susu aren, kopi kemasan cup harian, hingga botol 1 liter. Menampilkan pengalaman visual menu interaktif yang menggugah selera.',
    features: [
      'Menu interaktif kopi artisan & varian susu gula aren',
      'Pemesanan takeaway & opsi literan untuk kantor/rumah',
      'Antarmuka mobile-first responsif dengan checkout ringkas'
    ],
    npcName: 'Maya Barista',
    npcRole: '☕ Barista & AI Guide — Fargan Kopi',
    dialogueText: 'Halo! Fargan Kopi adalah software cloud kitchen hyperlocal. Mesin yang terintegrasi antara Customer - Mitra - Owner. Lengkap dengan mesin kasir yang smart + fitur "Profesor Perkopian". Silakan kunjungi linknya untuk mencicipi kopi lezat kami!'
  },
  {
    id: 'farghan-butik',
    name: 'Farghan Butik',
    subtitle: 'Desain Butik Busana Muslim & Fashion Online Rasa Premium',
    category: 'Fashion & Luxury E-Commerce',
    categoryGroup: 'consumer_lifestyle',
    position: [0, 3.5, 24],
    color: 0x280D1C,
    neonColor: 0xEC4899, // Hot Pink Rose
    height: 7,
    width: 7.5,
    depth: 7,
    url: 'https://farghan-butik.pages.dev',
    badge: 'LUXURY BOUTIQUE',
    desc: 'Showcase desain butik fashion premium dengan estetika editorial majalah mewah. Menyuguhkan busana wanita anggun, kurasi kain eksklusif, dan konsultasi arah brand busana.',
    features: [
      'Desain majalah mewah (luxury editorial aesthetic)',
      'Katalog koleksi gaun, gamis, dan busana premium',
      'Fitur konsultasi stylist pribadi & custom fitting'
    ],
    npcName: 'Clara Stylist',
    npcRole: '👗 Fashion Curator — Farghan Butik',
    dialogueText: 'Selamat datang di Farghan Butik! Kami menyuguhkan konsep butik busana wanita muslim premium dengan tampilan editorial majalah mewah, katalog busana anggun, dan konsultasi gaya pribadi. Silakan kunjungi butik digital kami!'
  },
  {
    id: 'hendar-fitness',
    name: 'Hendar Fitness Coach',
    subtitle: 'Personal Trainer Bersertifikat & Atlet Kontes Surabaya',
    category: 'Personal Branding & Health Fitness',
    categoryGroup: 'consumer_lifestyle',
    position: [16, 3.5, 24],
    color: 0x211208,
    neonColor: 0xEA580C, // Hyper Orange
    height: 7,
    width: 7.5,
    depth: 7,
    url: 'https://hendar-fitness.pages.dev/',
    badge: 'FITNESS COACHING',
    desc: 'Platform personal branding untuk personal trainer dan atlet kontes di Surabaya. Berfokus pada transformasi bentuk tubuh (fat loss & muscle gain), panduan nutrisi, dan coaching 1-on-1.',
    features: [
      'Galeri bukti nyata transformasi klien bertahap',
      'Paket program pendampingan 1-on-1 & online coaching',
      'Kalkulator kebutuhan kalori harian & konsultasi kebugaran'
    ],
    npcName: 'Coach Hendar',
    npcRole: '💪 Head Coach — Hendar Fitness',
    dialogueText: 'Waktunya wujudkan versi terbaik tubuh Anda! Hendar Fitness Coach menyediakan panduan fat loss, muscle gain, pola makan terukur, dan private coaching bersama atlet kontes berpengalaman di Surabaya. Silakan lihat buktinya!'
  }
];
