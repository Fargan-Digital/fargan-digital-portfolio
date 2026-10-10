import { portfolioProjects, type CityBuilding } from '../data/portfolioProjects';
import { KIDS_CHARACTERS, type KidsCharacter } from '../data/kidsContent';
import { DIGITAL_PRODUCTS, type DigitalProduct } from '../data/creativeProducts';

const STORAGE_KEY = 'fargan_portfolio_projects_v3';
const KIDS_STORAGE_KEY = 'fargan_kids_characters_v1';
const PRODUCTS_STORAGE_KEY = 'fargan_creative_products_v1';
const TOKEN_KEY = 'fargan_admin_token_v1';
const USER_KEY = 'fargan_admin_user_v1';

export class ProjectStorageService {
  private memoryProjects: CityBuilding[] = [...portfolioProjects];
  private memoryKidsCharacters: KidsCharacter[] = [...KIDS_CHARACTERS];
  private memoryCreativeProducts: DigitalProduct[] = [...DIGITAL_PRODUCTS];

  constructor() {
    this.initLocal();
  }

  private initLocal() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(p => p.id === 'fargan-tower')) {
          this.memoryProjects = parsed;
        } else {
          this.memoryProjects = [...portfolioProjects];
          this.saveToLocalCache(this.memoryProjects);
        }
      }

      // Kids Characters Cache
      const cachedKids = localStorage.getItem(KIDS_STORAGE_KEY);
      if (cachedKids) {
        const parsedKids = JSON.parse(cachedKids);
        if (Array.isArray(parsedKids) && parsedKids.length > 0) {
          this.memoryKidsCharacters = parsedKids;
        }
      }

      // Creative Products Cache
      const cachedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (cachedProducts) {
        const parsedProducts = JSON.parse(cachedProducts);
        if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
          this.memoryCreativeProducts = parsedProducts;
        }
      }
    } catch {}
  }

  // Fetch projects from Cloudflare KV Edge API with local fallback
  async loadProjects(): Promise<CityBuilding[]> {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.projects) && data.projects.length > 0) {
          // Merge KV project data with master grid layout from portfolioProjects
          // This guarantees buildings always stay in their engineered non-overlapping lots
          const merged: CityBuilding[] = portfolioProjects.map(master => {
            const remote = data.projects.find((p: any) => p.id === master.id);
            if (!remote) return master;
            return {
              ...master,
              ...remote,
              // Always lock 3D spatial layout & size from master urban grid
              position: master.position,
              width: master.width,
              height: master.height,
              depth: master.depth,
              color: master.color,
              neonColor: master.neonColor,
            };
          });

          this.memoryProjects = merged;
          this.saveToLocalCache(this.memoryProjects);
          return this.memoryProjects;
        }
      }
    } catch (err) {
      console.warn('Gagal memuat dari /api/projects, menggunakan cache lokal:', err);
    }
    return this.memoryProjects;
  }

  getProjects(): CityBuilding[] {
    return this.memoryProjects;
  }

  private saveToLocalCache(projects: CityBuilding[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {}
  }

  // Save projects to both Cloudflare KV & Local Storage
  async saveProjects(projects: CityBuilding[]): Promise<{ success: boolean; message: string }> {
    this.memoryProjects = [...projects];
    this.saveToLocalCache(this.memoryProjects);

    const token = this.getAuthToken();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ projects }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || 'Perubahan karya berhasil disimpan ke Cloudflare Edge!',
        };
      } else {
        const err = await res.json().catch(() => ({}));
        return {
          success: true,
          message: err.error 
            ? `Tersimpan Lokal (${err.error})` 
            : 'Tersimpan di Cache Browser.',
        };
      }
    } catch {
      return {
        success: true,
        message: 'Tersimpan di Cache Browser (Offline).',
      };
    }
  }

  // ==========================================
  // KIDS CHARACTERS & YOUTUBE CONTENT
  // ==========================================
  getKidsCharacters(): KidsCharacter[] {
    return this.memoryKidsCharacters;
  }

  async loadKidsCharacters(): Promise<KidsCharacter[]> {
    try {
      const res = await fetch('/api/kids', {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.characters) && data.characters.length > 0) {
          // Merge with master default properties to preserve 3D positions/colors
          const merged: KidsCharacter[] = KIDS_CHARACTERS.map(master => {
            const remote = data.characters.find((c: any) => c.id === master.id);
            if (!remote) return master;
            return {
              ...master,
              ...remote,
              position: master.position,
              color: master.color,
              secondaryColor: master.secondaryColor,
            };
          });

          this.memoryKidsCharacters = merged;
          localStorage.setItem(KIDS_STORAGE_KEY, JSON.stringify(merged));
          return this.memoryKidsCharacters;
        }
      }
    } catch {}
    return this.memoryKidsCharacters;
  }

  async saveKidsCharacters(characters: KidsCharacter[]): Promise<{ success: boolean; message: string }> {
    this.memoryKidsCharacters = [...characters];
    try {
      localStorage.setItem(KIDS_STORAGE_KEY, JSON.stringify(this.memoryKidsCharacters));
    } catch {}

    const token = this.getAuthToken();
    try {
      const res = await fetch('/api/kids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ characters }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || 'Konten & link YouTube Fargan Kids berhasil disimpan ke Cloudflare Edge!',
        };
      } else {
        const err = await res.json().catch(() => ({}));
        return {
          success: true,
          message: err.error ? `Tersimpan Lokal (${err.error})` : 'Tersimpan di Cache Browser.',
        };
      }
    } catch {
      return {
        success: true,
        message: 'Tersimpan di Cache Browser (Mode Mandiri).',
      };
    }
  }

  // ==========================================
  // CREATIVE LOUNGE DIGITAL PRODUCTS
  // ==========================================
  getCreativeProducts(): DigitalProduct[] {
    return this.memoryCreativeProducts;
  }

  async loadCreativeProducts(): Promise<DigitalProduct[]> {
    try {
      const res = await fetch('/api/products', {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          this.memoryCreativeProducts = data.products;
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(data.products));
          return this.memoryCreativeProducts;
        }
      }
    } catch {}
    return this.memoryCreativeProducts;
  }

  async saveCreativeProducts(products: DigitalProduct[]): Promise<{ success: boolean; message: string }> {
    this.memoryCreativeProducts = [...products];
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(this.memoryCreativeProducts));
    } catch {}

    const token = this.getAuthToken();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ products }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || 'Katalog produk digital Cafe Kreatif berhasil disimpan ke Cloudflare Edge!',
        };
      } else {
        const err = await res.json().catch(() => ({}));
        return {
          success: true,
          message: err.error ? `Tersimpan Lokal (${err.error})` : 'Tersimpan di Cache Browser.',
        };
      }
    } catch {
      return {
        success: true,
        message: 'Tersimpan di Cache Browser (Mode Mandiri).',
      };
    }
  }

  // Generate optimal non-overlapping street coordinates for new buildings
  suggestNextCoordinate(existingProjects: CityBuilding[]): [number, number, number] {
    const existingCoords = new Set(
      existingProjects.map(p => `${Math.round(p.position[0])},${Math.round(p.position[2])}`)
    );

    // Grid slots along city avenues
    const candidateSlots: [number, number][] = [
      [24, 8], [-24, 8], [24, -14], [-24, -14],
      [14, 20], [-14, 20], [14, -28], [-14, -28],
      [28, 20], [-28, 20], [28, -20], [-28, -20],
      [32, 0], [-32, 0], [0, 26], [0, -32]
    ];

    for (const slot of candidateSlots) {
      if (!existingCoords.has(`${slot[0]},${slot[1]}`)) {
        return [slot[0], 4.5, slot[1]];
      }
    }

    const count = existingProjects.length;
    const sign = count % 2 === 0 ? 1 : -1;
    return [sign * (22 + (count * 2)), 4.5, 12 + (count % 4) * 6];
  }

  // Session & Auth Helpers
  getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getAuthUser(): string | null {
    return localStorage.getItem(USER_KEY) || 'Fargan';
  }

  setSession(token: string, username: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
  }

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Login handler
  async login(username: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          this.setSession(data.token, data.user || username);
          return { success: true, message: data.message };
        } else {
          return { success: false, error: data.error || 'Autentikasi gagal.' };
        }
      } else {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Username atau password tidak sesuai.' };
      }
    } catch {
      return { success: false, error: 'Koneksi ke server autentikasi gagal. Silakan periksa koneksi internet Anda.' };
    }
  }

  // Change password
  async changePassword(oldPassword: string, newPassword: string, newUsername?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const token = this.getAuthToken();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          action: 'change_password',
          oldPassword,
          newPassword,
          username: newUsername,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (newUsername) localStorage.setItem(USER_KEY, newUsername);
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Gagal memperbarui password.' };
    } catch {
      return { success: false, error: 'Koneksi ke server Cloudflare gagal.' };
    }
  }

  exportJsonBackup(): string {
    return JSON.stringify(this.memoryProjects, null, 2);
  }

  async importJsonBackup(jsonStr: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) throw new Error('Format file bukan array!');
      await this.saveProjects(parsed);
      return { success: true, count: parsed.length };
    } catch (e: any) {
      return { success: false, error: e.message || 'File JSON rusak atau tidak valid!' };
    }
  }

  async resetToDefaults(): Promise<void> {
    await this.saveProjects(portfolioProjects);
  }
}

export const projectStorage = new ProjectStorageService();
