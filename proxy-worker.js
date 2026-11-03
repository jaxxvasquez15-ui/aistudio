// Cloudflare Worker：把浏览器请求转发到 GlobalRouter，并加上跨域(CORS)头  v2
const UPSTREAM = 'https://api.globalrouter.ai';
const ALLOW_ORIGIN = 'https://jaxxvasquez15-ui.github.io';

function corsHeaders(req) {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin === ALLOW_ORIGIN ? origin : ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') || 'Authorization, Content-Type, Accept',
    'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin, Access-Control-Request-Headers',
  };
}

export default {
  async fetch(req) {
    const cors = corsHeaders(req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      const url = new URL(req.url);
      const headers = new Headers();
      for (const k of ['authorization', 'content-type', 'accept']) {
        const v = req.headers.get(k);
        if (v) headers.set(k, v);
      }
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();
      const upstream = await fetch(UPSTREAM + url.pathname + url.search, { method: req.method, headers, body });
      const out = new Headers();
      for (const k of ['content-type', 'content-length', 'content-disposition', 'cache-control']) {
        const v = upstream.headers.get(k);
        if (v) out.set(k, v);
      }
      for (const k in cors) out.set(k, cors[k]);
      return new Response(upstream.body, { status: upstream.status, headers: out });
    } catch (e) {
      return new Response(JSON.stringify({ error: { message: 'proxy error: ' + (e && e.message || e) } }), {
        status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
