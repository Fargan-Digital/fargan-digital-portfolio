export interface DigitalProduct {
  id: string;
  title: string;
  category: 'tools' | 'templates' | 'code' | 'consult';
  price: string;
  originalPrice: string;
  rating: number;
  salesCount: number;
  badge: string;
  icon: string;
  description: string;
  features: string[];
  ctaLink: string;
}

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: 'prod-1',
    title: 'Ultimate 500+ AI Prompt & Content Engine 2026',
    category: 'tools',
    price: 'Rp 29.000',
    originalPrice: 'Rp 99.000',
    rating: 4.9,
    salesCount: 142,
    badge: 'BEST SELLER',
    icon: '⚡',
    description: 'Kumpulan formula prompt ChatGPT, Claude & Midjourney siap pakai untuk riset bisnis, copywriting penjualan, dan otomatisasi ide.',
    features: [
      '500+ Prompt Teruji & Kategorisasi Rapi',
      'Formula Hook & Storytelling Viral',
      'Format Notion & PDF Praktis',
      'Update Gratis Seumur Hidup'
    ],
    ctaLink: 'https://wa.me/6281295175618?text=Halo%20Fargan,%20saya%20tertarik%20membeli%20Ultimate%20AI%20Prompt%20Engine...'
  },
  {
    id: 'prod-2',
    title: 'Pack 50+ Template Canva & Micro-Site UMKM',
    category: 'templates',
    price: 'Rp 39.000',
    originalPrice: 'Rp 149.000',
    rating: 4.8,
    salesCount: 88,
    badge: 'PALING LARIS',
    icon: '🎨',
    description: 'Desain feed Instagram, banner promosi, dan template website satu halaman yang estetik dan siap edit dalam 5 menit.',
    features: [
      '50+ Desain Canva Siap Edit',
      'Kompatibel Akun Canva Gratis',
      'Panduan Color Palette & Tipografi',
      'Bonus Icon Pack Cyberpunk'
    ],
    ctaLink: 'https://wa.me/6281295175618?text=Halo%20Fargan,%20saya%20tertarik%20membeli%20Pack%20Template%20Canva%20UMKM...'
  },
  {
    id: 'prod-3',
    title: 'Fullstack React & Three.js Cyberpunk UI Kit',
    category: 'code',
    price: 'Rp 79.000',
    originalPrice: 'Rp 250.000',
    rating: 5.0,
    salesCount: 45,
    badge: 'PRO DEVELOPER',
    icon: '💻',
    description: 'Komponen kode React, Three.js Voxel, dan Tailwind CSS siap pasang untuk membuat website interaktif sekeren Metaverse Fargan.',
    features: [
      'Source Code TypeScript Lengkap',
      'Audio Synthesizer Native Hook',
      'Optimasi Mobile Touch & D-Pad',
      'Dokumentasi Integrasi Cepat'
    ],
    ctaLink: 'https://wa.me/6281295175618?text=Halo%20Fargan,%20saya%20tertarik%20membeli%20React%20Cyberpunk%20UI%20Kit...'
  },
  {
    id: 'prod-4',
    title: 'Sesi 1-on-1 Mentoring Ide Bisnis & Bedah Software',
    category: 'consult',
    price: 'Rp 149.000',
    originalPrice: 'Rp 500.000',
    rating: 5.0,
    salesCount: 26,
    badge: 'VIP SESSION',
    icon: '☕',
    description: 'Sesi konsultasi privat 60 menit bersama Fargan: bedah strategi website, arsitektur software, dan tips otomatisasi AI untuk bisnis Anda.',
    features: [
      '60 Menit Google Meet Eksklusif',
      'Bedah Blueprint Teknis & Roadmap',
      'Rekomendasi Arsitektur Hemat Biaya',
      'Akses Kontak Diskusi WhatsApp Prioritas'
    ],
    ctaLink: 'https://wa.me/6281295175618?text=Halo%20Fargan,%20saya%20ingin%20booking%20sesi%20Mentoring%20Ide%20Bisnis%20&%20Bedah%20Software...'
  }
];
