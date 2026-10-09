// Cloudflare Pages Function: /api/auth
interface Env {
  FARGAN_KV: KVNamespace;
}

// Master password hashing helper (SHA-256 with Salt)
async function hashPassword(password: string, salt = 'fargan_secure_salt_2026'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper for security headers & CORS restricted to alfargan.com
function getCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = origin === 'https://alfargan.com' || origin.endsWith('.fargan-digital.pages.dev') || origin.startsWith('http://localhost:');
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowed ? origin : 'https://alfargan.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff',
  };
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const corsHeaders = getCorsHeaders(context.request);

  try {
    const body = (await context.request.json()) as any;
    const { action, username, password, oldPassword, newPassword } = body;

    let storedUser = 'Fargan';
    let storedHash = '';

    if (context.env && context.env.FARGAN_KV) {
      storedUser = (await context.env.FARGAN_KV.get('admin_username')) || 'Fargan';
      storedHash = (await context.env.FARGAN_KV.get('admin_password_hash')) || '';
    }

    if (!storedHash) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Sistem keamanan belum dikonfigurasi di Cloudflare KV.',
        }),
        {
          status: 503,
          headers: corsHeaders,
        }
      );
    }

    if (action === 'login') {
      const clientIp = context.request.headers.get('cf-connecting-ip') || 'unknown';
      const failCountKey = `ratelimit_${clientIp}`;

      let failCount = 0;
      if (context.env && context.env.FARGAN_KV) {
        failCount = parseInt((await context.env.FARGAN_KV.get(failCountKey)) || '0', 10);
      }

      if (failCount >= 5) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Akun dikunci sementara demi keamanan! Terlalu banyak percobaan gagal. Silakan coba lagi dalam 15 menit.',
          }),
          {
            status: 429,
            headers: corsHeaders,
          }
        );
      }

      const inputHash = await hashPassword(password || '');
      const isUserMatch = (username || '').trim().toLowerCase() === storedUser.trim().toLowerCase();
      const isPassMatch = inputHash === storedHash;

      if (!isUserMatch || !isPassMatch) {
        const nextAttempts = failCount + 1;
        if (context.env && context.env.FARGAN_KV) {
          await context.env.FARGAN_KV.put(failCountKey, String(nextAttempts), { expirationTtl: 900 });
        }
        const remaining = Math.max(0, 5 - nextAttempts);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Username atau password salah! Sisa percobaan sebelum akun dikunci: ${remaining}`,
            remainingAttempts: remaining,
          }),
          {
            status: 401,
            headers: corsHeaders,
          }
        );
      }

      // Reset fail counter on success
      if (context.env && context.env.FARGAN_KV) {
        await context.env.FARGAN_KV.delete(failCountKey);
      }

      // Generate cryptographically secure session token (32 bytes = 256 bits)
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const sessionToken = Array.from(tokenBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Store session in KV for 24 hours
      if (context.env && context.env.FARGAN_KV) {
        await context.env.FARGAN_KV.put(
          `session_${sessionToken}`,
          JSON.stringify({
            user: storedUser,
            loginAt: Date.now(),
          }),
          { expirationTtl: 86400 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          token: sessionToken,
          user: storedUser,
          message: 'Autentikasi Berhasil! Selamat datang di Ruang Kendali Fargan Digital.',
        }),
        {
          headers: corsHeaders,
        }
      );
    }

    if (action === 'change_password') {
      const authHeader = context.request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ success: false, error: 'Akses ditolak.' }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const token = authHeader.replace('Bearer ', '');
      if (context.env && context.env.FARGAN_KV) {
        const validSession = await context.env.FARGAN_KV.get(`session_${token}`);
        if (!validSession) {
          return new Response(JSON.stringify({ success: false, error: 'Sesi kedaluwarsa. Silakan login kembali.' }), {
            status: 403,
            headers: corsHeaders,
          });
        }
      }

      const oldHash = await hashPassword(oldPassword || '');
      if (oldHash !== storedHash) {
        return new Response(JSON.stringify({ success: false, error: 'Password lama tidak cocok!' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!newPassword || newPassword.length < 8) {
        return new Response(JSON.stringify({ success: false, error: 'Password baru minimal 8 karakter!' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const newHash = await hashPassword(newPassword);
      if (context.env && context.env.FARGAN_KV) {
        await context.env.FARGAN_KV.put('admin_password_hash', newHash);
        if (username && username.trim().length >= 3) {
          await context.env.FARGAN_KV.put('admin_username', username.trim());
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Kredensial keamanan berhasil diperbarui di Cloudflare KV!',
        }),
        {
          headers: corsHeaders,
        }
      );
    }

    return new Response(JSON.stringify({ success: false, error: 'Aksi tidak valid' }), {
      status: 400,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Kesalahan server' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestOptions = async (context: { request: Request }) => {
  return new Response(null, {
    headers: getCorsHeaders(context.request),
  });
};
