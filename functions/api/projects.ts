// Cloudflare Pages Function: /api/projects
interface Env {
  FARGAN_KV: KVNamespace;
}

function getCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = origin === 'https://alfargan.com' || origin.endsWith('.fargan-digital.pages.dev') || origin.startsWith('http://localhost:');
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowed ? origin : 'https://alfargan.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff',
  };
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const corsHeaders = getCorsHeaders(context.request);
  try {
    if (!context.env || !context.env.FARGAN_KV) {
      return new Response(JSON.stringify({ success: true, projects: null, source: 'fallback_no_kv' }), {
        headers: corsHeaders,
      });
    }

    const data = await context.env.FARGAN_KV.get('portfolio_projects');
    if (!data) {
      return new Response(JSON.stringify({ success: true, projects: null, source: 'empty_kv' }), {
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, projects: JSON.parse(data), source: 'kv' }), {
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const corsHeaders = getCorsHeaders(context.request);
  try {
    if (!context.env || !context.env.FARGAN_KV) {
      return new Response(JSON.stringify({ success: false, error: 'Database belum terhubung di server.' }), {
        status: 503,
        headers: corsHeaders,
      });
    }

    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Akses ditolak: Token autentikasi tidak ditemukan.' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const validSession = await context.env.FARGAN_KV.get(`session_${token}`);
    if (!validSession) {
      return new Response(JSON.stringify({ success: false, error: 'Sesi login telah kedaluwarsa. Silakan masuk kembali.' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const body = (await context.request.json()) as any;
    if (!body || !Array.isArray(body.projects)) {
      return new Response(JSON.stringify({ success: false, error: 'Format data karya tidak valid.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    await context.env.FARGAN_KV.put('portfolio_projects', JSON.stringify(body.projects));

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Perubahan karya berhasil disinkronisasi ke Cloudflare Global Edge!',
      count: body.projects.length
    }), {
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Gagal menyimpan karya' }), {
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
