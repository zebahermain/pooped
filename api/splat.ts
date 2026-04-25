import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: any, res: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(404).send('Not Found');
  }

  let query = supabase.from('splats').select('*');
  
  if (id.length === 8) {
    query = query.filter('id', 'like', `${id}%`);
  } else {
    query = query.eq('id', id);
  }

  const { data: splat, error } = await query.maybeSingle();

  if (error || !splat) {
    if (id.length === 8) {
       const { data: allSplats } = await supabase.from('splats').select('*').limit(200).order('created_at', { ascending: false });
       const found = allSplats?.find(s => s.id.startsWith(id));
       if (found) {
         return serveHtml(res, found);
       }
    }
    return res.redirect(`https://pooped.vercel.app/?redirect=/splat/${id}`);
  }

  return serveHtml(res, splat);
}

function serveHtml(res: any, splat: any) {
  const sender = splat.sender_name || 'Someone';
  const title = `${sender} just hit you 💩`;
  const description = 'Open to see the damage and retaliate';
  
  const ogImages: Record<string, string> = {
    cannon: '/og/cannon.png',
    monsoon: '/og/monsoon.png',
    stealth: '/og/stealth.png',
    gentle: '/og/gift.png',
  };
  const imagePath = ogImages[splat.style] || '/og/cannon.png';
  const imageUrl = `https://pooped.vercel.app${imagePath}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  
  <meta name="title" content="${title}" />
  <meta name="description" content="${description}" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://pooped.vercel.app/splat/${splat.id}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />

  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://pooped.vercel.app/splat/${splat.id}" />
  <meta property="twitter:title" content="${title}" />
  <meta property="twitter:description" content="${description}" />
  <meta property="twitter:image" content="${imageUrl}" />

  <script>
    window.location.href = '/?redirect=/splat/${splat.id}';
  </script>
</head>
<body style="background: #1C1A14; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
  <div style="text-align: center;">
    <div style="font-size: 48px;">💩</div>
    <p>Loading splat...</p>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  return res.status(200).send(html);
}
