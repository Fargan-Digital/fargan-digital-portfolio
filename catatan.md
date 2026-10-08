# 📘 CETAK BIRU & ARSITEKTUR TEKNOLOGI: FARGAN DIGITAL 3D METAVERSE PORTFOLIO

> **Dokumen Panduan Teknis & Rahasia Rekayasa Perangkat Lunak**  
> Dibuat khusus untuk: **Al Fargan Orin (Fargan Digital AI)**  
> Tujuan: Memahami pondasi rekayasa, tools yang digunakan, cara kerja sistem, serta blueprint pengembangan Dashboard CMS mandiri.

---

## 🌟 1. Filosofi & Visi Proyek

Kebanyakan portofolio web interaktif di dunia menggunakan format standar: halaman statis yang di-*scroll* dari atas ke bawah.  
**Fargan Digital** dibangun dengan pendekatan revolusioner:
- **Game-Fi & Metaverse First:** Pengunjung tidak sekadar membaca teks, tetapi **mengeksplorasi kota digital 3D** layaknya game Roblox/Cyberpunk langsung di browser tanpa perlu instalasi aplikasi apapun.
- **Ultra-Ringan & Loading Instan:** Tidak menggunakan file 3D biner raksasa (seperti `.gltf` atau `.fbx` berukuran puluhan megabyte yang memakan kuota dan lambat di HP). Semua bentuk, gedung, mobil, drone, dan karakter digambar secara **prosedural matematika (Procedural Voxel Geometry)** langsung oleh prosesor grafis pengguna.
- **Audio Synthesizer Native ($0 Asset Bandwidth):** Seluruh efek suara ketikan, langkah kaki, lompatan, hingga musik latar (BGM Lofi Cyberpunk) dibangkitkan langsung oleh chip suara browser menggunakan gelombang frekuensi (Web Audio API).

---

## 🛠️ 2. Stack Teknologi & Alat (Tools) yang Digunakan

| Kategori | Teknologi / Alat | Alasan & Peran dalam Sistem |
| :--- | :--- | :--- |
| **Framework UI** | `React` + `TypeScript` | Struktur komponen modular, penanganan *state* reaktif (mode presentasi vs mode kota 3D), serta pengetikan kode yang aman dari bug runtime (*type-safe*). |
| **Styling & HUD** | `Tailwind CSS` | Desain antarmuka futuristik bertema cyberpunk (glow neon, panel semi-transparan, tombol D-Pad mobile) tanpa menulis ratusan baris CSS manual. |
| **3D Rendering** | `Three.js` (WebGL) | Engine grafis 3D standar industri dunia untuk me-render kamera, pencahayaan, bayangan real-time, material neon, dan partikel debu cyber. |
| **Audio Engine** | `Web Audio API` (Native Browser) | Membangkitkan gelombang suara sintetis (*sine*, *triangle*, *square*, *sawtooth*) tanpa memuat file `.mp3` eksternal. Nol latensi, loading instan. |
| **Build & Bundler** | `Vite` | Kompilasi kode TypeScript ultra cepat, Rollup *tree-shaking*, dan minifikasi aset untuk performa kelas produksi. |
| **Ikonografi & Visual** | `lucide-react`, `canvas-confetti` | Ikon antarmuka modern yang tajam dan efek kembang api selebrasi interaktif. |
| **Infrastruktur & CDN** | `Cloudflare Pages` | Jaringan tepi (*Edge Network*) global terdistribusi di ratusan kota dunia. Menyajikan website dengan kecepatan sub-detik, sertifikat SSL HTTPS otomatis, dan ketahanan traffic masif. |
| **Version Control** | `Git` + `GitHub` | Pelacakan versi kode sumber dan sinkronisasi otomatis ke cloud (*Continuous Deployment*). |
| **Deployment CLI** | `Wrangler CLI` | Alat deployment langsung dari terminal ke server Cloudflare Edge. |

---

## 🔬 3. Bedah Anatomi Sistem & Logika Kode

### A. Geometri Voxel Prosedural (`RobloxCityWorld.tsx`)
1. **Karakter Pemain (Roblox Avatar):**
   - Karakter dirakit dari gabungan `THREE.BoxGeometry`:
     - Kepala: Kubus dengan helm cyberpunk berbalut kacamata visor cyan neon (`emissive: 0x00f3ff`).
     - Badan (Torso): Kubus berbalut hoodie/baju gelap beraksen logo Fargan Digital.
     - Kaki & Tangan: Bergerak dengan rotasi berayun (*swing*) memanfaatkan fungsi matematika sinus `Math.sin(walkCycle) * 0.6` saat tombol arah ditekan.
2. **Gedung-Gedung Portofolio:**
   - Dibuat dengan `THREE.BoxGeometry` tinggi bergradasi.
   - Jendela gedung dipasang menggunakan material emissive yang berpendar di malam hari.
   - Papan nama (*hologram header*) digambar di atas kanvas 2D (*CanvasTexture*) dan ditempelkan di puncak gedung.

### B. Kamera Cerdas & Navigasi Fleksibel (Desktop & Mobile)
1. **Smooth Lerp Tracking:**
   - Kamera tidak kaku menempel di karakter, melainkan bergerak secara halus menggunakan interpolasi linier (`camera.position.lerp(targetCameraPos, 0.08)`).
2. **Navigasi Layar Sentuh ala Google Maps:**
   - Menggunakan kalkulasi `Touch Events`:
     - **1 Jari Geser:** Memutar sudut orbit kamera horizontal & vertikal (`touchOrbitDelta`).
     - **2 Jari Pinch (Cubit):** Menghitung jarak Euclidean antar jari `Math.hypot(x2 - x1, y2 - y1)` untuk memperbesar (*zoom-in*) atau memperkecil (*zoom-out*) tampilan kota.
3. **D-Pad Kompak & Tombol Lompat:**
   - Tombol sentuh transparan elegan yang mengirim status arah (`forward`, `backward`, `left`, `right`, `jump`) ke vektor kecepatan fisik karakter.

### C. Suasana Kota Hidup (*Living City Atmosphere*)
1. **Hover Cars (Mobil Masa Depan):**
   - 3 unit kendaraan futuristik berlampu neon meluncur di jalur jalan raya.
   - Logika pergerakan menggunakan pengecekan batas koordinat sumbu $X$ dan $Z$. Ketika mobil mencapai ujung kota, koordinatnya berputar kembali (*looping seamless*).
2. **Drone Pengawas AI:**
   - Melayang di atas langit pusat kota, bergerak melingkar menggunakan trigonometri:
     $$x = \cos(t) \times r, \quad z = \sin(t) \times r, \quad y = y_0 + \sin(t \times 2) \times h$$
   - Memancarkan lampu sorot (*spotlight*) berkedip lembut ke bawah.
3. **Neon Cyber Dust (Partikel Atmosfer):**
   - 70 partikel titik berpendar melayang perlahan di udara yang posisinya diperbarui di setiap frame *render loop* Three.js.

### D. Audio Engine Sintetis (`src/utils/audioManager.ts`)
1. **Mengapa Bukan File MP3?**
   - File MP3 membutuhkan waktu *download*, rentan gagal putar di koneksi seluler lambat, dan memakan memori browser.
   - Web Audio API membangkitkan nada langsung dari CPU:
     - **Typewriter Click:** Nada *sine wave* frekuensi tinggi singkat (1800Hz - 2400Hz, durasi 0.02s) menyerupai ketikan komputer agen sci-fi.
     - **Langkah Kaki:** Pulsa frekuensi rendah (120Hz) yang teredam (*damped*).
     - **Lompat:** Glissando sapuan frekuensi ke atas (200Hz $\rightarrow$ 600Hz).
     - **BGM Lofi Cyberpunk:** Progresi 4 akord (*Dm9 $\rightarrow$ G13 $\rightarrow$ Cmaj9 $\rightarrow$ Am9*) dengan filter lembut (*Low-Pass Filter 650Hz*) yang menciptakan atmosfer tenang dan fokus.
2. **Trik "AudioContext Unlock" di Smartphone:**
   - Browser modern (Safari di iOS & Chrome di Android) memblokir pemutaran audio otomatis sebelum pengguna berinteraksi.
   - Solusi: Kami memasang pendengar global `pointerdown` / `keydown` pertama kali untuk melanjutkan (*resume*) status `AudioContext` seketika.

### E. Dialog Interaktif & Karakter CS Gedung
- Setiap gedung memiliki karakter perwakilan (NPC) yang berdiri di pelataran.
- Ketika karakter pemain berada di radius $\le 4.5$ unit dari gedung:
  1. Suara lonceng deteksi (*proximity chime*) berbunyi.
  2. Dialog percakapan CS muncul secara otomatis.
  3. Teks diketik huruf demi huruf secara dinamis disertai ketukan suara *typewriter*.
  4. Tombol *Akses Software / Website* mengarahkan pengunjung langsung ke tautan aplikasi yang bersangkutan.

---

## 📂 4. Struktur Direktori Proyek

```text
portfolio/
├── src/
│   ├── components/
│   │   ├── RobloxCityWorld.tsx    <-- Dunia 3D, Three.js, Karakter, Mobil, Drone, D-Pad, Dialog
│   │   └── VoxelAvatar3D.tsx      <-- Karakter 3D di halaman Presentasi
│   ├── data/
│   │   └── portfolioProjects.ts   <-- Master data gedung, deskripsi, link web, warna, posisi
│   ├── utils/
│   │   └── audioManager.ts        <-- Audio synthesizer, Web Audio API, BGM, SFX
│   ├── App.tsx                    <-- Induk aplikasi, HUD Navigasi, Toggle Musik, Mode Presentasi
│   ├── index.css                  <-- Desain CSS cyberpunk, efek glow, adaptasi mobile 100dvh
│   └── main.tsx                   <-- Titik masuk utama React
├── public/                        <-- Aset statis & favicon
├── dist/                          <-- Hasil kompilasi siap saji untuk Cloudflare Pages
├── package.json                   <-- Daftar pustaka (dependencies) & skrip npm
└── catatan.md                     <-- Dokumen ini (Cetak Biru Pembelajaran)
```

---

## ✏️ 5. Cara Tambah / Hapus Karya Secara Manual (Saat Ini)

Seluruh portofolio dan gedung kota 3D berpusat di satu file:  
`src/data/portfolioProjects.ts`

Untuk menambah karya baru, cukup tambahkan satu blok objek di dalam *array* `portfolioProjects`:

```typescript
{
  id: 'nama-proyek-anda',
  title: 'Nama Proyek Keren',
  tagline: 'Solusi SaaS / Aplikasi Modern',
  category: 'Enterprise & AI',
  categoryGroup: 'enterprise',
  description: 'Penjelasan lengkap nilai bisnis dan fitur utama produk...',
  metrics: '99.9% Uptime • High Speed • AI Powered',
  techStack: ['React', 'TypeScript', 'Cloudflare', 'Tailwind'],
  previewUrl: 'https://proyek-anda.pages.dev',
  sourceUrl: 'https://github.com/...',
  featured: true,
  buildingPosition: [x, z],         // Koordinat peletakan gedung di peta (contoh: [-16, 12])
  buildingColor: 0x00f3ff,          // Warna neon khas gedung (Hex Code)
  dialogueText: 'Selamat datang di Gedung Kami! Kami siap melayani otomatisasi bisnis Anda...'
}
```
Setelah disimpan, jalankan `npm run build` dan deploy ke Cloudflare.

---

## 🚀 6. Realisasi: Dashboard Admin Mandiri Jalur Rahasia `/Alfarghan`

Portal administrasi mandiri telah **100% selesai dibangun dan beroperasi aktif** di Cloudflare Pages Global Edge.  
Sesuai arahan khusus Anda, jalur URL dibuat **rahasia** (bukan `/admin` yang mudah ditebak bot atau pihak luar):

👉 **URL Rahasia Portal:** `https://fargan-digital.pages.dev/Alfarghan`  
*(Atau tekan tombol `Alt + A` di keyboard Anda saat membuka website)*

```
[ PENGUNJUNG UMUM ]                            [ AL FARGAN ORIN (ADMIN) ]
         │                                                 │
         ▼                                                 ▼
https://fargan-digital.pages.dev               https://fargan-digital.pages.dev/Alfarghan
         │                                                 │
         │ (Baca Data Kota 3D Real-Time)                   │ (Login Shield Enkripsi SHA-256 + Salt)
         │                                                 ▼
         │                                        [ Panel Kendali Eksekutif ]
         │                                        - Tambah / Edit / Hapus Gedung
         │                                        - Ganti Warna Neon & Posisi 3D
         │                                        - Ketik Dialog Percakapan CS
         │                                        - Ganti Kata Sandi & Unduh Backup
         │                                                 │
         └───────────────────────┬─────────────────────────┘
                                 ▼
                     [ CLOUDFLARE KV EDGE ]
                    Namespace: FARGAN_PORTFOLIO_KV
```

### 🛡️ Fitur Keamanan "Anti-Jebol" yang Berjalan:
1. **Enkripsi Hash SHA-256 with Salt:**  
   Password tidak pernah disimpan mentah (*plain text*), melainkan melalui fungsi kriptografi satu arah yang terlindungi *salt* rahasia.
2. **Kunci Sesi Kriptografi 256-Bit (`crypto.getRandomValues`):**  
   Setiap login menghasilkan token sesi unik 32-byte acak yang disimpan di Cloudflare KV dengan masa berlaku otomatis (*Auto Expiration TTL*).
3. **Pertahanan Anti Brute-Force (Rate Limiting IP):**  
   Maksimal **5 kali percobaan salah**. Jika terdeteksi upaya peretasan atau tebakan berulang, sistem otomatis mengunci akses dari IP tersebut selama 15 menit.
4. **Kredensial Bawaan & Pengubahan Mandiri:**  
   - **Username:** `Alfarghan`
   - **Password Awal:** `FarganAI#2026!Secure`  
   *(Anda dapat mengganti username dan password kapan saja langsung di tab "Keamanan & Password" di dalam dashboard!)*

### 🎮 Fitur-Fitur di Dalam Portal `/Alfarghan`:
1. **Tambah Gedung / Karya Baru:**  
   Isi Nama Gedung, Tagline, Kategori, Deskripsi, Fitur, Link Web, serta Teks CS.
2. **Penentuan Lokasi Otomatis (✨ Slot Otomatis):**  
   Sistem secara cerdas menghitung koordinat jalan raya kota yang masih kosong sehingga gedung baru tidak akan pernah bertubrukan dengan gedung lain.
3. **Pemilih Warna Neon Interaktif:**  
   Pilih warna neon khas (*Electric Cyan, Cyber Amber, Emerald Mint, Neon Purple, dll.*) yang langsung memancarkan aura di malam hari kota 3D.
4. **Editor Teks Sambutan CS Gedung:**  
   Ketik pesan apa saja yang akan diucapkan karakter NPC di depan gedung dalam mode ketikan mesin (*typewriter*) berbunyi retro.
5. **Cadangan & Pemulihan (Backup JSON):**  
   Unduh seluruh data kota Anda dalam 1 file `.json`, atau pulihkan kapan saja jika Anda berganti perangkat.

---

*Cetak biru ini dirancang untuk memastikan Fargan Digital terus berkembang menjadi agensi teknologi dan solusi perangkat lunak terdepan di Indonesia.*  
**Maju terus, Partner! 🚀**
