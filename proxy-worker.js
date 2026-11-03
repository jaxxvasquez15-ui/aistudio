// Cloudflare Worker：把浏览器请求转发到 GlobalRouter，并加上跨域(CORS)头
const UPSTREAM = 'https://api.globalrouter.ai';
const ALLOW_ORIGIN = 'https://jaxxvasquez15-ui.github.io';

export default {
  async fetch(req) {
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': origin === ALLOW_ORIGIN ? origin : ALLOW_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': '*',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);
    const headers = new Headers(req.headers);
    ['origin', 'referer', 'host', 'cf-connecting-ip', 'x-forwarded-for', 'x-real-ip'].forEach(k => headers.delete(k));
    const upstream = await fetch(UPSTREAM + url.pathname + url.search, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      redirect: 'follow',
    });
    const out = new Headers(upstream.headers);
    for (const k in cors) out.set(k, cors[k]);
    return new Response(upstream.body, { status: upstream.status, headers: out });
  },
};
