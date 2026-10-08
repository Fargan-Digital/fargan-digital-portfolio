// Cloudflare Pages Function: /api/projects
interface Env {
  FARGAN_KV: KVNamespace;
}

export const onRequestGet = async (context: { env: Env }) => {
  try {
    if (!context.env || !context.env.FARGAN_KV) {
      return new Response(JSON.stringify({ success: true, projects: null, source: 'fallback_no_kv' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = await context.env.FARGAN_KV.get('portfolio_projects');
    if (!data) {
      return new Response(JSON.stringify({ success: true, projects: null, source: 'empty_kv' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ success: true, projects: JSON.parse(data), source: 'kv' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Akses ditolak: Token autentikasi tidak ditemukan.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (context.env && context.env.FARGAN_KV) {
      const validSession = await context.env.FARGAN_KV.get(`session_${token}`);
      if (!validSession) {
        return new Response(JSON.stringify({ success: false, error: 'Sesi login telah kedaluwarsa. Silakan masuk kembali.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    const body = (await context.request.json()) as any;
    if (!body || !Array.isArray(body.projects)) {
      return new Response(JSON.stringify({ success: false, error: 'Format data karya tidak valid.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (context.env && context.env.FARGAN_KV) {
      await context.env.FARGAN_KV.put('portfolio_projects', JSON.stringify(body.projects));
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Perubahan karya berhasil disinkronisasi ke Cloudflare Global Edge!',
      count: body.projects.length
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Gagal menyimpan karya' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
