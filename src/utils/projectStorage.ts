import { portfolioProjects, type CityBuilding } from '../data/portfolioProjects';

const STORAGE_KEY = 'fargan_portfolio_projects_v3';
const TOKEN_KEY = 'fargan_admin_token_v1';
const USER_KEY = 'fargan_admin_user_v1';

export class ProjectStorageService {
  private memoryProjects: CityBuilding[] = [...portfolioProjects];

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
          return;
        }
      }
      // If no cache or older cache without fargan-tower, use latest default projects
      this.memoryProjects = [...portfolioProjects];
      this.saveToLocalCache(this.memoryProjects);
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
          this.memoryProjects = data.projects;
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
    return localStorage.getItem(USER_KEY) || 'Alfarghan';
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
      // Local fallback for dev/offline testing
      const defaultUser = 'Alfarghan';
      const defaultPass = 'FarganAI#2026!Secure';
      if (
        (username.trim().toLowerCase() === defaultUser.toLowerCase() || username.trim().toLowerCase() === 'alfargan') &&
        password === defaultPass
      ) {
        this.setSession('local_session_token_' + Date.now(), 'Alfarghan');
        return { success: true, message: 'Autentikasi Berhasil (Mode Lokal).' };
      }
      return { success: false, error: 'Username atau password salah!' };
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
