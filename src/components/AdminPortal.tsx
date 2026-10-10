import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Save, 
  X, 
  ArrowLeft, 
  KeyRound, 
  Download, 
  Upload, 
  RefreshCw, 
  Building2, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle,
  Compass,
  ShoppingBag,
  Coffee
} from 'lucide-react';
import { type CityBuilding } from '../data/portfolioProjects';
import { type KidsCharacter } from '../data/kidsContent';
import { type DigitalProduct } from '../data/creativeProducts';
import { projectStorage } from '../utils/projectStorage';
import { soundEngine } from '../utils/audioManager';

interface AdminPortalProps {
  onBackToCity: () => void;
  onProjectsUpdated: (updatedList: CityBuilding[]) => void;
}

const PRESET_COLORS = [
  { name: 'Electric Cyan', hex: '#00A2FF', num: 0x00A2FF },
  { name: 'Cyber Amber', hex: '#FFB800', num: 0xFFB800 },
  { name: 'Emerald Mint', hex: '#10B981', num: 0x10B981 },
  { name: 'Neon Purple', hex: '#A855F7', num: 0xA855F7 },
  { name: 'Plasma Violet', hex: '#8B5CF6', num: 0x8B5CF6 },
  { name: 'Crimson Matrix', hex: '#EF4444', num: 0xEF4444 },
  { name: 'Hot Magenta', hex: '#EC4899', num: 0xEC4899 },
];

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToCity, onProjectsUpdated }) => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Dashboard states
  const [activeTab, setActiveTab] = useState<'projects' | 'kids' | 'creative' | 'security' | 'backup'>('projects');
  const [projects, setProjects] = useState<CityBuilding[]>([]);
  const [kidsCharacters, setKidsCharacters] = useState<KidsCharacter[]>([]);
  const [creativeProducts, setCreativeProducts] = useState<DigitalProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit / Add Modal states (CityBuilding)
  const [editingBuilding, setEditingBuilding] = useState<CityBuilding | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Kids Character Modal & Form states
  const [editingKidChar, setEditingKidChar] = useState<KidsCharacter | null>(null);
  const [isKidModalOpen, setIsKidModalOpen] = useState<boolean>(false);
  const [isKidSaving, setIsKidSaving] = useState<boolean>(false);
  const [kidFormName, setKidFormName] = useState('');
  const [kidFormRole, setKidFormRole] = useState('');
  const [kidFormGreeting, setKidFormGreeting] = useState('');
  const [kidFormDialogueIntro, setKidFormDialogueIntro] = useState('');
  const [kidFormTopicTitle, setKidFormTopicTitle] = useState('');
  const [kidFormYoutubeUrl, setKidFormYoutubeUrl] = useState('');
  const [kidFormButtonText, setKidFormButtonText] = useState('');
  const [kidFormFunFact, setKidFormFunFact] = useState('');

  // Creative Product Modal & Form states
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isProductSaving, setIsProductSaving] = useState<boolean>(false);
  const [prodFormTitle, setProdFormTitle] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState<'tools' | 'templates' | 'code' | 'consult'>('tools');
  const [prodFormPrice, setProdFormPrice] = useState('Rp 29.000');
  const [prodFormOriginalPrice, setProdFormOriginalPrice] = useState('Rp 99.000');
  const [prodFormBadge, setProdFormBadge] = useState('BEST SELLER');
  const [prodFormIcon, setProdFormIcon] = useState('⚡');
  const [prodFormDescription, setProdFormDescription] = useState('');
  const [prodFormFeatures, setProdFormFeatures] = useState('');
  const [prodFormCtaLink, setProdFormCtaLink] = useState('');

  // Form states mapping directly to CityBuilding
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCategory, setFormCategory] = useState('Enterprise SaaS • Production Ready');
  const [formCategoryGroup, setFormCategoryGroup] = useState<'enterprise' | 'fintech_security' | 'corporate_b2b' | 'property_agency' | 'consumer_lifestyle'>('enterprise');
  const [formBadge, setFormBadge] = useState('ACTIVE PRODUCTION');
  const [formDesc, setFormDesc] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCoordX, setFormCoordX] = useState<number>(0);
  const [formCoordZ, setFormCoordZ] = useState<number>(0);
  const [formHeight, setFormHeight] = useState<number>(10);
  const [formWidth, setFormWidth] = useState<number>(8);
  const [formDepth, setFormDepth] = useState<number>(8);
  const [formNeonColor, setFormNeonColor] = useState<number>(0x00A2FF);
  const [formNpcName, setFormNpcName] = useState('CS Resepsionis');
  const [formNpcRole, setFormNpcRole] = useState('Konsultan Teknologi');
  const [formDialogueText, setFormDialogueText] = useState('');

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = projectStorage.getAuthToken();
    if (token) {
      setIsAuthenticated(true);
      loadAllData();
    }
  }, []);

  const loadAllData = async () => {
    const [currProjects, currKids, currProducts] = await Promise.all([
      projectStorage.loadProjects(),
      projectStorage.loadKidsCharacters(),
      projectStorage.loadCreativeProducts(),
    ]);
    setProjects(currProjects);
    setKidsCharacters(currKids);
    setCreativeProducts(currProducts);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    soundEngine.playTypewriterBlip();

    const res = await projectStorage.login(usernameInput, passwordInput);
    setIsLoggingIn(false);

    if (res.success) {
      soundEngine.playProximityChime();
      setIsAuthenticated(true);
      setPasswordInput('');
      await loadAllData();
    } else {
      setAuthError(res.error || 'Username atau kata sandi tidak valid.');
    }
  };

  const handleLogout = () => {
    projectStorage.clearSession();
    setIsAuthenticated(false);
    soundEngine.playTypewriterBlip();
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Open modal for adding a new building
  const handleAddNew = () => {
    const [suggX, suggY, suggZ] = projectStorage.suggestNextCoordinate(projects);
    setEditingBuilding(null);
    setFormId(`proj-${Date.now().toString(36)}`);
    setFormName('');
    setFormSubtitle('');
    setFormCategory('Enterprise SaaS • Production Ready');
    setFormCategoryGroup('enterprise');
    setFormBadge('LIVE ENTERPRISE');
    setFormDesc('');
    setFormFeatures('Arsitektur Skalabilitas Tinggi, Integrasi AI Cerdas, Proteksi Keamanan Teruji');
    setFormUrl('https://');
    setFormCoordX(suggX);
    setFormCoordZ(suggZ);
    setFormHeight(suggY * 2);
    setFormWidth(8);
    setFormDepth(8);
    setFormNeonColor(0x00A2FF);
    setFormNpcName('CS Konsultan');
    setFormNpcRole('AI Systems Advisor');
    setFormDialogueText('Selamat datang di gedung kami! Kami merancang solusi teknologi kelas industri.');
    setIsModalOpen(true);
    soundEngine.playTypewriterBlip();
  };

  // Open modal for editing existing building
  const handleEdit = (b: CityBuilding) => {
    setEditingBuilding(b);
    setFormId(b.id);
    setFormName(b.name);
    setFormSubtitle(b.subtitle);
    setFormCategory(b.category);
    setFormCategoryGroup(b.categoryGroup);
    setFormBadge(b.badge);
    setFormDesc(b.desc);
    setFormFeatures(b.features.join(', '));
    setFormUrl(b.url);
    setFormCoordX(b.position[0]);
    setFormCoordZ(b.position[2]);
    setFormHeight(b.height);
    setFormWidth(b.width);
    setFormDepth(b.depth);
    setFormNeonColor(b.neonColor);
    setFormNpcName(b.npcName);
    setFormNpcRole(b.npcRole);
    setFormDialogueText(b.dialogueText);
    setIsModalOpen(true);
    soundEngine.playTypewriterBlip();
  };

  // Save building
  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotification('error', 'Nama produk / gedung wajib diisi!');
      return;
    }

    setIsSaving(true);
    const featureArray = formFeatures
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    const newBuildingData: CityBuilding = {
      id: formId.trim() || `proj-${Date.now().toString(36)}`,
      name: formName.trim(),
      subtitle: formSubtitle.trim(),
      category: formCategory.trim(),
      categoryGroup: formCategoryGroup,
      badge: formBadge.trim() || 'LIVE KARYA',
      desc: formDesc.trim(),
      features: featureArray.length ? featureArray : ['Modern High-Speed Web'],
      url: formUrl.trim(),
      position: [Number(formCoordX), Number(formHeight) / 2, Number(formCoordZ)],
      color: 0x0F1B29,
      neonColor: Number(formNeonColor),
      height: Number(formHeight),
      width: Number(formWidth),
      depth: Number(formDepth),
      npcName: formNpcName.trim() || 'CS Resepsionis',
      npcRole: formNpcRole.trim() || 'Konsultan Teknologi',
      dialogueText: formDialogueText.trim(),
    };

    let updatedList: CityBuilding[];
    if (editingBuilding) {
      updatedList = projects.map(p => (p.id === editingBuilding.id ? newBuildingData : p));
    } else {
      updatedList = [...projects, newBuildingData];
    }

    const res = await projectStorage.saveProjects(updatedList);
    setIsSaving(false);
    setIsModalOpen(false);

    if (res.success) {
      setProjects(updatedList);
      onProjectsUpdated(updatedList);
      showNotification('success', res.message);
      soundEngine.playProximityChime();
    } else {
      showNotification('error', 'Gagal menyimpan karya.');
    }
  };

  // Delete building
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus gedung "${name}" dari kota 3D metaverse?`)) return;

    soundEngine.playTypewriterBlip();
    const updatedList = projects.filter(p => p.id !== id);
    const res = await projectStorage.saveProjects(updatedList);

    if (res.success) {
      setProjects(updatedList);
      onProjectsUpdated(updatedList);
      showNotification('success', `Gedung "${name}" berhasil dihapus.`);
    } else {
      showNotification('error', 'Gagal menghapus karya.');
    }
  };

  // ----------------------------------------------------
  // KIDS CHARACTERS HANDLERS
  // ----------------------------------------------------
  const handleEditKidChar = (c: KidsCharacter) => {
    setEditingKidChar(c);
    setKidFormName(c.name);
    setKidFormRole(c.role);
    setKidFormGreeting(c.greeting);
    setKidFormDialogueIntro(c.dialogueIntro);
    setKidFormTopicTitle(c.topicTitle);
    setKidFormYoutubeUrl(c.youtubeUrl || (c.youtubeId ? `https://www.youtube.com/watch?v=${c.youtubeId}` : ''));
    setKidFormButtonText(c.actionButtonText);
    setKidFormFunFact(c.lessonFunFact);
    setIsKidModalOpen(true);
    soundEngine.playTypewriterBlip();
  };

  const handleSaveKidChar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKidChar) return;

    setIsKidSaving(true);
    soundEngine.playTypewriterBlip();

    // Robust YouTube ID extraction supporting:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://m.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID?si=...
    // - https://www.youtube.com/shorts/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    // - Raw 11-char ID
    let extractedYtId = editingKidChar.youtubeId;
    const rawUrl = kidFormYoutubeUrl.trim();
    if (rawUrl) {
      const match = rawUrl.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?(?:.*&)?v=|shorts\/|live\/))([\w-]{11})/);
      if (match && match[1]) {
        extractedYtId = match[1];
      } else if (/^[a-zA-Z0-9_-]{11}$/.test(rawUrl)) {
        extractedYtId = rawUrl;
      }
    }

    // Clean, direct, highly compatible standard URL for mobile & desktop
    const standardCleanUrl = `https://www.youtube.com/watch?v=${extractedYtId}`;

    const updatedChar: KidsCharacter = {
      ...editingKidChar,
      name: kidFormName.trim(),
      role: kidFormRole.trim(),
      greeting: kidFormGreeting.trim(),
      dialogueIntro: kidFormDialogueIntro.trim(),
      topicTitle: kidFormTopicTitle.trim(),
      youtubeId: extractedYtId,
      youtubeUrl: standardCleanUrl,
      actionButtonText: kidFormButtonText.trim() || 'Tonton Petualangan Sekarang! ▶️',
      lessonFunFact: kidFormFunFact.trim(),
    };

    const updatedList = kidsCharacters.map(c => (c.id === editingKidChar.id ? updatedChar : c));
    const res = await projectStorage.saveKidsCharacters(updatedList);
    setIsKidSaving(false);
    setIsKidModalOpen(false);

    if (res.success) {
      setKidsCharacters(updatedList);
      showNotification('success', res.message);
      soundEngine.playProximityChime();
    } else {
      showNotification('error', 'Gagal menyimpan konten Fargan Kids.');
    }
  };

  // ----------------------------------------------------
  // CREATIVE PRODUCTS HANDLERS
  // ----------------------------------------------------
  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setProdFormTitle('');
    setProdFormCategory('tools');
    setProdFormPrice('Rp 29.000');
    setProdFormOriginalPrice('Rp 99.000');
    setProdFormBadge('BARU');
    setProdFormIcon('⚡');
    setProdFormDescription('');
    setProdFormFeatures('Akses Instan, Formula Teruji, Update Seumur Hidup');
    setProdFormCtaLink('https://wa.me/6281295175618?text=Halo%20Fargan,%20saya%20tertarik%20membeli%20produk%20digital...');
    setIsProductModalOpen(true);
    soundEngine.playTypewriterBlip();
  };

  const handleEditProduct = (p: DigitalProduct) => {
    setEditingProduct(p);
    setProdFormTitle(p.title);
    setProdFormCategory(p.category);
    setProdFormPrice(p.price);
    setProdFormOriginalPrice(p.originalPrice);
    setProdFormBadge(p.badge);
    setProdFormIcon(p.icon);
    setProdFormDescription(p.description);
    setProdFormFeatures(p.features.join(', '));
    setProdFormCtaLink(p.ctaLink);
    setIsProductModalOpen(true);
    soundEngine.playTypewriterBlip();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormTitle.trim()) {
      showNotification('error', 'Judul produk wajib diisi!');
      return;
    }

    setIsProductSaving(true);
    soundEngine.playTypewriterBlip();

    const featArray = prodFormFeatures
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    const newProdData: DigitalProduct = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now().toString(36)}`,
      title: prodFormTitle.trim(),
      category: prodFormCategory,
      price: prodFormPrice.trim(),
      originalPrice: prodFormOriginalPrice.trim(),
      rating: editingProduct ? editingProduct.rating : 4.9,
      salesCount: editingProduct ? editingProduct.salesCount : 1,
      badge: prodFormBadge.trim() || 'PRODUK UNGGULAN',
      icon: prodFormIcon.trim() || '⚡',
      description: prodFormDescription.trim(),
      features: featArray.length ? featArray : ['Akses Langsung via WhatsApp'],
      ctaLink: prodFormCtaLink.trim(),
    };

    let updatedList: DigitalProduct[];
    if (editingProduct) {
      updatedList = creativeProducts.map(p => (p.id === editingProduct.id ? newProdData : p));
    } else {
      updatedList = [...creativeProducts, newProdData];
    }

    const res = await projectStorage.saveCreativeProducts(updatedList);
    setIsProductSaving(false);
    setIsProductModalOpen(false);

    if (res.success) {
      setCreativeProducts(updatedList);
      showNotification('success', res.message);
      soundEngine.playProximityChime();
    } else {
      showNotification('error', 'Gagal menyimpan produk Cafe Kreatif.');
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!window.confirm(`Hapus produk "${title}" dari Cafe Kreatif?`)) return;

    soundEngine.playTypewriterBlip();
    const updatedList = creativeProducts.filter(p => p.id !== id);
    const res = await projectStorage.saveCreativeProducts(updatedList);

    if (res.success) {
      setCreativeProducts(updatedList);
      showNotification('success', `Produk "${title}" berhasil dihapus.`);
    } else {
      showNotification('error', 'Gagal menghapus produk.');
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Konfirmasi kata sandi baru tidak sama!' });
      return;
    }
    if (newPassword.length < 8) {
      setSecurityMessage({ type: 'error', text: 'Kata sandi baru minimal 8 karakter!' });
      return;
    }

    soundEngine.playTypewriterBlip();
    const res = await projectStorage.changePassword(oldPassword, newPassword, newUsername || undefined);
    if (res.success) {
      setSecurityMessage({ type: 'success', text: res.message || 'Kredensial keamanan berhasil diperbarui!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNewUsername('');
    } else {
      setSecurityMessage({ type: 'error', text: res.error || 'Gagal mengubah kata sandi!' });
    }
  };

  // Export JSON
  const handleExportBackup = () => {
    soundEngine.playTypewriterBlip();
    const jsonStr = projectStorage.exportJsonBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fargan-portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'File backup JSON berhasil diunduh!');
  };

  // Import JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      const res = await projectStorage.importJsonBackup(content);
      if (res.success) {
        await loadAllData();
        onProjectsUpdated(projectStorage.getProjects());
        showNotification('success', `Berhasil memulihkan ${res.count} gedung karya!`);
        soundEngine.playProximityChime();
      } else {
        showNotification('error', res.error || 'Gagal memulihkan file backup!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to original defaults
  const handleResetDefaults = async () => {
    if (!window.confirm('PERINGATAN: Kembalikan semua gedung ke data awal?')) return;
    await projectStorage.resetToDefaults();
    await loadAllData();
    onProjectsUpdated(projectStorage.getProjects());
    showNotification('success', 'Semua gedung berhasil dipulihkan ke data awal.');
    soundEngine.playProximityChime();
  };

  const filteredProjects = projects.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ----------------------------------------------------
  // LOGIN SCREEN (PROTECTED SHIELD)
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 select-none overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950 to-black pointer-events-none" />
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20" />
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

        <div className="relative w-full max-w-md roblox-panel p-6 sm:p-8 space-y-6 animate-fade-in border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-white tracking-wide">RUANG KENDALI EKSEKUTIF</h1>
                <p className="text-[10px] text-cyan-400 font-mono tracking-wider">FARGAN DIGITAL • SHIELD OS</p>
              </div>
            </div>

            <button
              onClick={onBackToCity}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Kembali ke Kota"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Portal manajemen karya, gedung 3D, percakapan CS, dan konfigurasi AI Cloud. Masukkan kredensial autentikasi Anda.
          </p>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>IDENTITAS PENGGUNA</span>
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="Masukkan username..."
                autoComplete="username"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 focus:border-cyan-400 text-white text-xs outline-none transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>KATA SANDI KEAMANAN</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900/90 border border-white/10 focus:border-cyan-400 text-white text-xs outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isLoggingIn ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>{isLoggingIn ? 'MEMVALIDASI ENKRIPSI...' : 'MASUK RUANG KENDALI'}</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={onBackToCity}
              className="text-[11px] font-mono text-slate-500 hover:text-cyan-400 transition-all cursor-pointer"
            >
              ← Kembali ke Eksplorasi Kota 3D
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Top Navbar */}
      <header className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-white">PANEL KELOLA KARYA 3D</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CLOUDFLARE EDGE ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Operator: <span className="text-cyan-400 font-bold">{projectStorage.getAuthUser()}</span> • Jalur: /fargan-admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToCity}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Lihat Kota 3D</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer transition-all"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-white/5 flex items-center gap-2 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'projects'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Gedung Kota Bisnis ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kids')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'kids'
              ? 'bg-pink-500 text-slate-950 shadow-md shadow-pink-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="text-sm">🎬</span>
          <span>🧸 Konten Fargan Kids ({kidsCharacters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('creative')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'creative'
              ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 text-purple-400" />
          <span>☕ Produk Cafe Kreatif ({creativeProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'security'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Keamanan & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'backup'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Backup & Pemulihan JSON</span>
        </button>
      </div>

      {/* Status toast */}
      {statusMessage && (
        <div className="px-4 py-2">
          <div
            className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 border animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: KELOLA GEDUNG */}
        {activeTab === 'projects' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari gedung berdasarkan nama atau kategori..."
                  className="w-full pl-3.5 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Gedung Baru</span>
                </button>
              </div>
            </div>

            {/* Buildings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(b => (
                <div
                  key={b.id}
                  className="roblox-panel p-4 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2.5">
                    {/* Header badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-md"
                          style={{
                            backgroundColor: `#${b.neonColor.toString(16).padStart(6, '0')}`,
                            boxShadow: `0 0 10px #${b.neonColor.toString(16).padStart(6, '0')}`,
                          }}
                        />
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-cyan-300 border border-white/5">
                          {b.category}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500">
                        [{b.position[0]}, {b.position[2]}]
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                        {b.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{b.subtitle}</p>
                    </div>

                    {/* CS Dialogue Quote */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[9px] font-bold">
                        <MessageSquare className="w-3 h-3" />
                        <span>SAMBUTAN CS ({b.npcName}):</span>
                      </div>
                      <p className="italic text-slate-400 line-clamp-2">
                        "{b.dialogueText || 'Belum ada percakapan CS...'}"
                      </p>
                    </div>

                    {/* Features tags */}
                    <div className="flex flex-wrap gap-1">
                      {b.features.slice(0, 3).map((f, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-slate-300">
                          {f}
                        </span>
                      ))}
                      {b.features.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-slate-400">
                          +{b.features.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Kunjungi</span>
                    </a>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(b)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-all cursor-pointer"
                        title="Edit Gedung"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 transition-all cursor-pointer"
                        title="Hapus Gedung"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12 roblox-panel p-6 rounded-2xl">
                <Building2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-mono">Tidak ada gedung yang cocok dengan pencarian.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KELOLA KONTEN FARGAN KIDS */}
        {activeTab === 'kids' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-pink-950/30 p-4 rounded-2xl border border-pink-500/20">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🧸</span>
                <div>
                  <h2 className="text-sm font-black text-white">5 MASKOT SAHABAT FARGAN KIDS</h2>
                  <p className="text-[11px] text-pink-200">
                    Ubah video YouTube, judul topik edukasi, dialog sapaan, dan fakta seru untuk setiap karakter sahabat di Disneyland virtual.
                  </p>
                </div>
              </div>
            </div>

            {/* Characters Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kidsCharacters.map(char => (
                <div
                  key={char.id}
                  className="roblox-panel p-5 rounded-2xl border border-pink-500/20 hover:border-pink-500/50 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl p-1.5 rounded-xl bg-pink-500/20 border border-pink-500/30">
                          {char.avatar}
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-white group-hover:text-pink-300 transition-colors">
                            {char.name}
                          </h3>
                          <span className="text-[10px] font-mono text-pink-400 font-bold">{char.role}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
                        PITCH: {char.speechAudioPitch}Hz
                      </span>
                    </div>

                    {/* Topic & Video Link */}
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400">TOPIK EDUKASI:</span>
                        <p className="text-xs font-bold text-white leading-tight">{char.topicTitle}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-mono text-slate-400">YOUTUBE ID / LINK:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-red-400">▶️</span>
                          <a
                            href={char.youtubeUrl || `https://www.youtube.com/watch?v=${char.youtubeId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-mono text-cyan-400 hover:underline truncate"
                          >
                            {char.youtubeId}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Dialogue & Fun Fact */}
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-300 italic line-clamp-2">"{char.dialogueIntro}"</p>
                      <p className="text-[10px] text-amber-300 line-clamp-2">💡 {char.lessonFunFact}</p>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-end">
                    <button
                      onClick={() => handleEditKidChar(char)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-pink-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Konten & Video YouTube</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: KELOLA PRODUK CAFE KREATIF */}
        {activeTab === 'creative' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-purple-950/30 p-4 rounded-2xl border border-purple-500/20">
              <div className="flex items-center gap-3">
                <span className="text-3xl">☕</span>
                <div>
                  <h2 className="text-sm font-black text-white">KATALOG PRODUK DIGITAL CAFE KREATIF</h2>
                  <p className="text-[11px] text-purple-200">
                    Kelola etalase hologram digital (tools, templates, source code, konsultasi) yang terhubung langsung ke WhatsApp Anda.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAddNewProduct}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Digital Baru</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creativeProducts.map(prod => (
                <div
                  key={prod.id}
                  className="roblox-panel p-5 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Header badge & Price */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30">
                          {prod.icon}
                        </span>
                        <div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                            {prod.badge}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5 uppercase">
                            Kategori: {prod.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-400">{prod.price}</div>
                        <div className="text-[10px] text-slate-500 line-through">{prod.originalPrice}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                        {prod.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{prod.description}</p>
                    </div>

                    {/* Features preview */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
                      <span className="text-[9px] font-mono text-slate-400">FITUR UTAMA:</span>
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        {prod.features.slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 truncate">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => handleDeleteProduct(prod.id, prod.title)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEditProduct(prod)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Produk</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: KEAMANAN & PASSWORD */}
        {activeTab === 'security' && (
          <div className="max-w-xl mx-auto roblox-panel p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">GANTI KREDENSIAL KEAMANAN</h2>
                <p className="text-[11px] text-slate-400 font-mono">Proteksi akses /fargan-admin dengan enkripsi SHA-256 Cloudflare</p>
              </div>
            </div>

            {securityMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 border ${
                  securityMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {securityMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{securityMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-300">GANTI USERNAME (OPSIONAL)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="Kosongkan jika tetap ingin memakai username saat ini"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-300">PASSWORD SAAT INI (LAMA)</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-300">PASSWORD BARU (MINIMAL 8 KARAKTER)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-300">KONFIRMASI PASSWORD BARU</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>PERBARUI KREDENSIAL KEAMANAN</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: BACKUP & RESTORE */}
        {activeTab === 'backup' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="roblox-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">UNDUH CADANGAN (EXPORT JSON)</h2>
                  <p className="text-[11px] text-slate-400 font-mono">Simpan salinan seluruh gedung dan percakapan ke file di perangkat Anda</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Anda dapat mengunduh seluruh data gedung kota, koordinat, warna neon, dan teks dialog kapan saja sebagai arsip cadangan.
              </p>

              <button
                onClick={handleExportBackup}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-cyan-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File JSON Sekarang</span>
              </button>
            </div>

            <div className="roblox-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">PULIHKAN DATA (IMPORT JSON)</h2>
                  <p className="text-[11px] text-slate-400 font-mono">Gantikan atau pulihkan data gedung dari file cadangan</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Pilih file `.json` cadangan yang sebelumnya diunduh untuk memulihkan seluruh struktur kota secara instan.
              </p>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer transition-all shadow-lg shadow-purple-500/20">
                <Upload className="w-4 h-4" />
                <span>Pilih File Backup JSON</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
              <h3 className="text-xs font-black text-rose-400 uppercase tracking-wide">Zona Bahaya</h3>
              <p className="text-[11px] text-slate-400">
                Kembalikan seluruh daftar karya ke data bawaan awal proyek Fargan Digital.
              </p>
              <button
                onClick={handleResetDefaults}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs cursor-pointer transition-all"
              >
                Reset ke Data Bawaan Pabrik
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------- */}
      {/* MODAL: TAMBAH / EDIT GEDUNG KARYA                     */}
      {/* ---------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl roblox-panel p-5 sm:p-7 space-y-5 border border-cyan-500/40 my-auto animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    {editingBuilding ? 'EDIT GEDUNG KARYA' : 'TAMBAH GEDUNG KARYA BARU'}
                  </h2>
                  <p className="text-[10px] text-cyan-400 font-mono">Dunia 3D Metaverse • Fargan Digital</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBuilding} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">NAMA PRODUK / GEDUNG *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                    placeholder="Contoh: Brand Owner OS"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">SUBTITLE / TAGLINE</label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={e => setFormSubtitle(e.target.value)}
                    placeholder="Contoh: Software CFO & Reseller Intelligence"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">KATEGORI</label>
                  <select
                    value={formCategoryGroup}
                    onChange={e => {
                      const grp = e.target.value as any;
                      setFormCategoryGroup(grp);
                      if (grp === 'enterprise') setFormCategory('Enterprise SaaS • Production Ready');
                      else if (grp === 'fintech_security') setFormCategory('FinTech & Trading Protection');
                      else if (grp === 'corporate_b2b') setFormCategory('Corporate B2B & Modern Ops');
                      else if (grp === 'property_agency') setFormCategory('Property & Luxury Architecture');
                      else setFormCategory('Consumer & Lifestyle Tech');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400"
                  >
                    <option value="enterprise">Enterprise SaaS</option>
                    <option value="fintech_security">FinTech & Trading Security</option>
                    <option value="corporate_b2b">Corporate B2B</option>
                    <option value="property_agency">Property & Luxury Agency</option>
                    <option value="consumer_lifestyle">Consumer Lifestyle</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">LABEL BADGE</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={e => setFormBadge(e.target.value)}
                    placeholder="Contoh: FLAGSHIP ERP (LIVE)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-300">DESKRIPSI LENGKAP KARYA</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Jelaskan fitur utama, manfaat bisnis, dan keunggulan software ini..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              {/* CS Typewriter Dialogue Script */}
              <div className="space-y-1 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 font-bold">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>TEKS SAMBUTAN CS GEDUNG (TYPEWRITER DIALOG)</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  Karakter NPC di depan gedung akan berbicara dengan teks diketik satu per satu dan berbunyi klik retro saat dihampiri.
                </p>
                <textarea
                  rows={3}
                  value={formDialogueText}
                  onChange={e => setFormDialogueText(e.target.value)}
                  placeholder="Selamat datang di gedung kami! Software ini mengintegrasikan seluruh operasional bisnis Anda..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-white outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              {/* URL & Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">URL LIVE PRODUK *</label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={e => setFormUrl(e.target.value)}
                    required
                    placeholder="https://brand-owner.pages.dev"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-cyan-400 outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">FITUR UTAMA (PISAH DENGAN KOMA)</label>
                  <input
                    type="text"
                    value={formFeatures}
                    onChange={e => setFormFeatures(e.target.value)}
                    placeholder="Realtime Webhook, Peta Interaktif, Auto Sync"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* NPC Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">NAMA KARAKTER CS</label>
                  <input
                    type="text"
                    value={formNpcName}
                    onChange={e => setFormNpcName(e.target.value)}
                    placeholder="Contoh: CS Resepsionis"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">ROLE / JABATAN CS</label>
                  <input
                    type="text"
                    value={formNpcRole}
                    onChange={e => setFormNpcRole(e.target.value)}
                    placeholder="Contoh: Konsultan Bisnis & AI"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Building Color & 3D Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Color Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-300">PILIHAN WARNA NEON GEDUNG</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setFormNeonColor(c.num)}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform cursor-pointer ${
                          formNeonColor === c.num ? 'scale-110 border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.hex, boxShadow: `0 0 8px ${c.hex}` }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* 3D Coordinates */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-slate-300">LOKASI GEDUNG DI KOTA 3D</label>
                    <button
                      type="button"
                      onClick={() => {
                        const [suggX, suggY, suggZ] = projectStorage.suggestNextCoordinate(projects);
                        setFormCoordX(suggX);
                        setFormCoordZ(suggZ);
                        setFormHeight(suggY * 2);
                      }}
                      className="text-[9px] font-mono text-cyan-400 hover:underline cursor-pointer"
                    >
                      ✨ Slot Otomatis
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono">Sumbu X:</span>
                      <input
                        type="number"
                        value={formCoordX}
                        onChange={e => setFormCoordX(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-mono">Sumbu Z:</span>
                      <input
                        type="number"
                        value={formCoordZ}
                        onChange={e => setFormCoordZ(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer transition-all"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'MENYIMPAN KE CLOUDFLARE...' : 'SIMPAN KE KOTA 3D'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT KONTEN FARGAN KIDS */}
      {/* ======================================================== */}
      {isKidModalOpen && editingKidChar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-xl roblox-panel p-5 sm:p-7 space-y-5 border border-pink-500/40 my-auto animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl p-1.5 rounded-xl bg-pink-500/20 border border-pink-500/30">
                  {editingKidChar.avatar}
                </span>
                <div>
                  <h2 className="text-base font-black text-white">EDIT KONTEN SAHABAT CILIK</h2>
                  <p className="text-[10px] text-pink-400 font-mono">{editingKidChar.name} • {editingKidChar.role}</p>
                </div>
              </div>

              <button
                onClick={() => setIsKidModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKidChar} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">NAMA KARAKTER</label>
                  <input
                    type="text"
                    value={kidFormName}
                    onChange={e => setKidFormName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-pink-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">PERAN / SEBUTAN SAHABAT</label>
                  <input
                    type="text"
                    value={kidFormRole}
                    onChange={e => setKidFormRole(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-pink-300 font-bold">LINK VIDEO YOUTUBE KIDS (URL ATAU ID) *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={kidFormYoutubeUrl}
                    onChange={e => setKidFormYoutubeUrl(e.target.value)}
                    required
                    placeholder="Contoh: https://www.youtube.com/watch?v=k4V3gH9m9E0 atau k4V3gH9m9E0"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-pink-500/40 text-xs text-white outline-none focus:border-pink-400 font-mono"
                  />
                  <span className="text-xs absolute left-3 top-2.5">▶️</span>
                </div>
                <p className="text-[9px] text-slate-400">
                  Cukup paste link video YouTube Fargan Kids apa saja, sistem otomatis mengekstrak ID video untuk bioskop cilik.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-300">JUDUL TOPIK PEMBELAJARAN / CERITA</label>
                <input
                  type="text"
                  value={kidFormTopicTitle}
                  onChange={e => setKidFormTopicTitle(e.target.value)}
                  required
                  placeholder="Contoh: Petualangan Mengenal Angka 1-10"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-pink-400 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-300">DIALOG SAPAAN AWAL (SUARA ROBOT KIDS)</label>
                <textarea
                  rows={2}
                  value={kidFormGreeting}
                  onChange={e => setKidFormGreeting(e.target.value)}
                  placeholder="Halo Teman Cilik! Senang sekali bisa bertemu denganmu..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-pink-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-300">PENJELASAN AJAKAN MENONTON</label>
                <textarea
                  rows={2}
                  value={kidFormDialogueIntro}
                  onChange={e => setKidFormDialogueIntro(e.target.value)}
                  placeholder="Hari ini aku punya cerita seru tentang..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-pink-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-300">FAKTA SERU EDUKATIF (FUN FACT)</label>
                <input
                  type="text"
                  value={kidFormFunFact}
                  onChange={e => setKidFormFunFact(e.target.value)}
                  placeholder="Tahukah kamu? Lebah bisa mengenali wajah manusia!"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-pink-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-300">TEKS TOMBOL AKSI BIOSKOP</label>
                <input
                  type="text"
                  value={kidFormButtonText}
                  onChange={e => setKidFormButtonText(e.target.value)}
                  placeholder="Tonton Petualangan Sekarang! ▶️"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-pink-400"
                />
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKidModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer transition-all"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isKidSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-pink-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isKidSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isKidSaving ? 'MENYIMPAN KE CLOUDFLARE...' : 'SIMPAN KONTEN KIDS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: TAMBAH / EDIT PRODUK CAFE KREATIF */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-xl roblox-panel p-5 sm:p-7 space-y-5 border border-purple-500/40 my-auto animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    {editingProduct ? 'EDIT PRODUK CAFE KREATIF' : 'TAMBAH PRODUK DIGITAL BARU'}
                  </h2>
                  <p className="text-[10px] text-purple-400 font-mono">Etalase Hologram 3D Lounge • alfargan.com</p>
                </div>
              </div>

              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">JUDUL PRODUK DIGITAL *</label>
                  <input
                    type="text"
                    value={prodFormTitle}
                    onChange={e => setProdFormTitle(e.target.value)}
                    required
                    placeholder="Contoh: Ultimate 500+ AI Prompt Engine"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-purple-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">EMOJI ICON</label>
                  <input
                    type="text"
                    value={prodFormIcon}
                    onChange={e => setProdFormIcon(e.target.value)}
                    placeholder="⚡"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white text-center text-lg outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">KATEGORI</label>
                  <select
                    value={prodFormCategory}
                    onChange={e => setProdFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-purple-400 font-mono"
                  >
                    <option value="tools">AI & Automation Tools</option>
                    <option value="templates">Templates & Design</option>
                    <option value="code">Source Code & Fullstack Kits</option>
                    <option value="consult">Konsultasi 1-on-1</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-300">BADGE PROMO</label>
                  <input
                    type="text"
                    value={prodFormBadge}
                    onChange={e => setProdFormBadge(e.target.value)}
                    placeholder="BEST SELLER / HEMAT 60%"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-emerald-400 font-bold">HARGA JUAL SPESIAL *</label>
                  <input
                    type="text"
                    value={prodFormPrice}
                    onChange={e => setProdFormPrice(e.target.value)}
                    required
                    placeholder="Rp 29.000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs text-emerald-300 outline-none focus:border-emerald-400 font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">HARGA CORET (ORIGINAL)</label>
                  <input
                    type="text"
                    value={prodFormOriginalPrice}
                    onChange={e => setProdFormOriginalPrice(e.target.value)}
                    placeholder="Rp 99.000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-400 outline-none focus:border-purple-400 font-mono line-through"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-300">DESKRIPSI PRODUK</label>
                <textarea
                  rows={2}
                  value={prodFormDescription}
                  onChange={e => setProdFormDescription(e.target.value)}
                  placeholder="Jelaskan ringkas manfaat produk digital ini bagi pembeli..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-300">FITUR-FITUR UTAMA (PISAHKAN DENGAN KOMA)</label>
                <textarea
                  rows={2}
                  value={prodFormFeatures}
                  onChange={e => setProdFormFeatures(e.target.value)}
                  placeholder="Akses Instan, Update Seumur Hidup, Bonus Notion Template"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-purple-300 font-bold">LINK ORDER WHATSAPP / CHECKOUT *</label>
                <input
                  type="text"
                  value={prodFormCtaLink}
                  onChange={e => setProdFormCtaLink(e.target.value)}
                  required
                  placeholder="https://wa.me/6281295175618?text=Halo%20Fargan..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-purple-500/40 text-xs text-white outline-none focus:border-purple-400 font-mono"
                />
                <p className="text-[9px] text-slate-400">
                  Masukkan link wa.me dengan pesan otomatis, pembeli akan langsung diarahkan ke chat Anda.
                </p>
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer transition-all"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isProductSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isProductSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isProductSaving ? 'MENYIMPAN KE CLOUDFLARE...' : 'SIMPAN PRODUK DIGITAL'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
