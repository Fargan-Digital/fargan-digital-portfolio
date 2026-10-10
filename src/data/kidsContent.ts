export interface KidsVideo {
  id: string;
  title: string;
  category: 'cartoon' | 'song' | 'science' | 'moral';
  youtubeId: string;
  duration: string;
  thumbnail: string;
  description: string;
  badge: string;
}

export interface KidsAnimalFact {
  id: string;
  name: string;
  emoji: string;
  soundName: string;
  funFact: string;
  color: string;
}

export const KIDS_VIDEOS: KidsVideo[] = [
  {
    id: 'vid-1',
    title: 'Petualangan Fargan Cilik & Robot Sahabat Bintang',
    category: 'cartoon',
    youtubeId: 'k4V3gH9m9E0', // Safe friendly cartoon placeholder / ready for your channel
    duration: '04:15',
    thumbnail: '🌟',
    description: 'Kisah seru Fargan Cilik menjelajahi galaksi warna-warni dan belajar tolong menolong bersama robot ramah.',
    badge: 'ANIMASI TERPOPULER'
  },
  {
    id: 'vid-2',
    title: 'Lagu Ceria: Mengenal Angka 1 Sampai 10 Bersama Hewan Lucu',
    category: 'song',
    youtubeId: 'DR-cfDVxZ2A',
    duration: '03:30',
    thumbnail: '🎵',
    description: 'Bernyanyi gembira sambil belajar berhitung dengan irama yang menyenangkan dan mudah dihafal si kecil.',
    badge: 'LAGU EDUKASI'
  },
  {
    id: 'vid-3',
    title: 'Mengapa Langit Berwarna Biru & Dari Mana Asal Pelangi?',
    category: 'science',
    youtubeId: 'n1m4h753444',
    duration: '05:10',
    thumbnail: '🌈',
    description: 'Penjelasan sains sederhana yang seru dan penuh warna tentang keajaiban alam semesta untuk anak cerdas.',
    badge: 'SAINS CILIK'
  },
  {
    id: 'vid-4',
    title: 'Dongeng Nilai Kebaikan: Kelinci Cerdik & Pohon Kejujuran',
    category: 'moral',
    youtubeId: 'bTqVqk7FSmY',
    duration: '06:45',
    thumbnail: '🐰',
    description: 'Pesan moral penting tentang bersikap jujur, menghargai sesama teman, dan selalu berbuat baik.',
    badge: 'DONGENG BERKUALITAS'
  }
];

export const KIDS_ANIMALS: KidsAnimalFact[] = [
  {
    id: 'cat',
    name: 'Kucing Imut (Mochi)',
    emoji: '🐱',
    soundName: 'Meong... Meong!',
    funFact: 'Kucing bisa mendengar suara 3 kali lebih tajam dari manusia dan suka mendengkur saat merasa bahagia!',
    color: '#FFB703'
  },
  {
    id: 'rabbit',
    name: 'Kelinci Ceria (Bobi)',
    emoji: '🐰',
    soundName: 'Ciap... Ciap!',
    funFact: 'Kelinci melompat gembira dengan gerakan berputar di udara yang disebut "Binky" saat mereka sangat senang!',
    color: '#FB8500'
  },
  {
    id: 'panda',
    name: 'Panda Gemoy (Pao)',
    emoji: '🐼',
    soundName: 'Nyam... Nyam!',
    funFact: 'Panda menghabiskan 12 jam sehari hanya untuk mengunyah bambu segar yang lezat!',
    color: '#023047'
  },
  {
    id: 'dino',
    name: 'Dino Cilik (Rexy)',
    emoji: '🦖',
    soundName: 'Raaawrr Ceria!',
    funFact: 'Meskipun dinosaurus dulu berukuran raksasa, Rexy di dunia Fargan sangat ramah dan suka menari balon!',
    color: '#2A9D8F'
  }
];

export const KIDS_PIANO_NOTES = [
  { note: 'DO', freq: 261.63, color: '#FF595E', label: 'C4' },
  { note: 'RE', freq: 293.66, color: '#FF924C', label: 'D4' },
  { note: 'MI', freq: 329.63, color: '#FFCA3A', label: 'E4' },
  { note: 'FA', freq: 349.23, color: '#8AC926', label: 'F4' },
  { note: 'SOL', freq: 392.00, color: '#1982C4', label: 'G4' },
  { note: 'LA', freq: 440.00, color: '#6A4C93', label: 'A4' },
  { note: 'SI', freq: 493.88, color: '#B5179E', label: 'B4' },
  { note: 'DO+', freq: 523.25, color: '#F72585', label: 'C5' }
];
