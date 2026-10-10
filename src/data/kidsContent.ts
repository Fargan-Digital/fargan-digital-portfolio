export interface KidsVideo {
  id: string;
  title: string;
  category: 'cartoon' | 'song' | 'science' | 'moral' | 'craft';
  youtubeId: string;
  duration: string;
  thumbnail: string;
  description: string;
  badge: string;
}

export interface KidsCharacter {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: number;
  secondaryColor: number;
  position: [number, number, number]; // [x, y, z] in the 3D world
  greeting: string;
  dialogueIntro: string;
  topicTitle: string;
  youtubeId: string;
  youtubeUrl: string;
  actionButtonText: string;
  speechAudioPitch: number;
  lessonFunFact: string;
}

export interface KidsAnimalFact {
  id: string;
  name: string;
  emoji: string;
  soundName: string;
  funFact: string;
  color: string;
}

export const KIDS_CHARACTERS: KidsCharacter[] = [
  {
    id: 'char-milo',
    name: 'Milo si Petualang Rimba',
    role: 'Sahabat Dunia Hewan',
    avatar: '🦁',
    color: 0xffb703,
    secondaryColor: 0xfb8500,
    position: [-10, 0, -4],
    greeting: 'Halo Sahabat Petualang Cilik! 🌿🐾',
    dialogueIntro: 'Hari ini Milo mau ajak kamu jalan-jalan ke hutan ajaib untuk mengenal suara dan rahasia hewan-hewan lucu!',
    topicTitle: 'Mengenal Ragam Satwa & Suara Hewan Ceria',
    youtubeId: 'k4V3gH9m9E0',
    youtubeUrl: 'https://www.youtube.com/watch?v=k4V3gH9m9E0',
    actionButtonText: 'Tonton Petualangan Hewan Sekarang! ▶️',
    speechAudioPitch: 480,
    lessonFunFact: 'Tahukah kamu? Singa suka tidur sampai 20 jam sehari, tapi saat bangun larinya secepat mobil!'
  },
  {
    id: 'char-pipa',
    name: 'Pipa si Profesor Angka',
    role: 'Jagoan Berhitung Cilik',
    avatar: '🤖',
    color: 0x06d6a0,
    secondaryColor: 0x118ab2,
    position: [10, 0, -4],
    greeting: 'Bip-Bop! Halo Sahabat Pintar! 🔢✨',
    dialogueIntro: 'Siapa yang mau belajar berhitung 1 sampai 10 sambil bernyanyi bersama Pipa si Robot Ceria?',
    topicTitle: 'Belajar Berhitung & Matematika Ceria 1-10',
    youtubeId: 'DR-cfDVxZ2A',
    youtubeUrl: 'https://www.youtube.com/watch?v=DR-cfDVxZ2A',
    actionButtonText: 'Ayo Bernyanyi & Berhitung Bersama! 🎵',
    speechAudioPitch: 640,
    lessonFunFact: 'Angka 0 adalah angka yang sangat istimewa karena ditemukan oleh ilmuwan hebat untuk melengkapi hitungan!'
  },
  {
    id: 'char-luna',
    name: 'Luna si Penjelajah Bintang',
    role: 'Pakar Sains & Langit',
    avatar: '🚀',
    color: 0x8338ec,
    secondaryColor: 0x3a86ff,
    position: [-12, 0, 10],
    greeting: 'Bintang berkelip menyapamu! Halo! 🌌⭐',
    dialogueIntro: 'Pernahkah kamu penasaran mengapa langit berwarna biru dan bagaimana pelangi indah bisa muncul setelah hujan?',
    topicTitle: 'Rahasia Langit Biru, Pelangi & Luar Angkasa',
    youtubeId: 'n1m4h753444',
    youtubeUrl: 'https://www.youtube.com/watch?v=n1m4h753444',
    actionButtonText: 'Kupas Rahasia Pelangi di Video! 🌈',
    speechAudioPitch: 580,
    lessonFunFact: 'Cahaya matahari sebenarnya terdiri dari 7 warna pelangi yang bersatu menjadi sinar putih!'
  },
  {
    id: 'char-bobo',
    name: 'Bobo si Koki Kue Pelangi',
    role: 'Kreativitas & Seni Cilik',
    avatar: '🧁',
    color: 0xff006e,
    secondaryColor: 0xff595e,
    position: [12, 0, 10],
    greeting: 'Yum-yum! Selamat datang teman manis! 🍓🎨',
    dialogueIntro: 'Bobo punya resep warna-warni yang asyik untuk melatih imajinasimu menggambar dan membuat kreasi kerajinan tangan!',
    topicTitle: 'Kreasi Warna-Warni & Cerita Kejujuran Anak',
    youtubeId: 'bTqVqk7FSmY',
    youtubeUrl: 'https://www.youtube.com/watch?v=bTqVqk7FSmY',
    actionButtonText: 'Lihat Cara Bikin Kreasi Serunya! 🎨',
    speechAudioPitch: 520,
    lessonFunFact: 'Mencampur warna kuning dan biru akan menghasilkan warna hijau segar seperti daun!'
  },
  {
    id: 'char-chiki',
    name: 'Chiki si Burung Pos Sahabat',
    role: 'Duta Kebaikan & Akhlak',
    avatar: '🐤',
    color: 0xffbe0b,
    secondaryColor: 0xf72585,
    position: [0, 0, 14],
    greeting: 'Cuit cuit! Salam hangat untuk anak hebat! 💌💛',
    dialogueIntro: 'Chiki membawa pesan manis dari Fargan Kids tentang pentingnya tersenyum, mengucap tolong, terima kasih, dan maaf!',
    topicTitle: 'Dongeng 3 Kata Ajaib: Tolong, Maaf & Terima Kasih',
    youtubeId: 'k4V3gH9m9E0',
    youtubeUrl: 'https://www.youtube.com/watch?v=k4V3gH9m9E0',
    actionButtonText: 'Dengarkan Dongeng 3 Kata Ajaib! 📖',
    speechAudioPitch: 720,
    lessonFunFact: 'Mengucapkan kata "Terima Kasih" terbukti membuat hati yang mendengar dan yang mengucapkan merasa lebih bahagia!'
  }
];

export const KIDS_VIDEOS: KidsVideo[] = [
  {
    id: 'vid-1',
    title: 'Petualangan Milo di Hutan Ajaib: Mengenal Hewan Ceria',
    category: 'cartoon',
    youtubeId: 'k4V3gH9m9E0',
    duration: '04:15',
    thumbnail: '🦁',
    description: 'Bersama Milo si Petualang Rimba mengenal aneka hewan, suara uniknya, dan kebiasaan seru mereka di alam bebas.',
    badge: 'BERSAMA MILO'
  },
  {
    id: 'vid-2',
    title: 'Lagu Ceria: Belajar Berhitung 1 Sampai 10 Bersama Robot Pipa',
    category: 'song',
    youtubeId: 'DR-cfDVxZ2A',
    duration: '03:30',
    thumbnail: '🤖',
    description: 'Bernyanyi gembira sambil menghafal angka 1-10 dengan irama riang animasi robotik penuh warna.',
    badge: 'BERSAMA PIPA'
  },
  {
    id: 'vid-3',
    title: 'Penjelajahan Luna: Mengapa Langit Berwarna Biru & Dari Mana Pelangi?',
    category: 'science',
    youtubeId: 'n1m4h753444',
    duration: '05:10',
    thumbnail: '🚀',
    description: 'Penjelasan sains cilik super seru tentang partikel cahaya matahari dan keajaiban pelangi di langit kita.',
    badge: 'BERSAMA LUNA'
  },
  {
    id: 'vid-4',
    title: 'Dapur Kreasi Bobo: Membuat Warna Pelangi & Kisah Pohon Kejujuran',
    category: 'moral',
    youtubeId: 'bTqVqk7FSmY',
    duration: '06:45',
    thumbnail: '🧁',
    description: 'Belajar mencampur warna indah sembari menyimak dongeng kebaikan tentang berbuat jujur kepada teman.',
    badge: 'BERSAMA BOBO'
  },
  {
    id: 'vid-5',
    title: 'Chiki & Tiga Kata Ajaib: Menjadi Anak Santun yang Dicintai Teman',
    category: 'moral',
    youtubeId: 'k4V3gH9m9E0',
    duration: '04:50',
    thumbnail: '🐤',
    description: 'Dongeng animasi lembut mengajarkan anak membiasakan berkata Tolong, Maaf, dan Terima Kasih dalam keseharian.',
    badge: 'BERSAMA CHIKI'
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
