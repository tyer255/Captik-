import { handleTemplatesApi } from '../src/utils/templatesApiHandler.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let query = req.query || {};

  // If query is empty and URL has query parameters, parse them
  if (req.url && (!query || Object.keys(query).length === 0)) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      query = Object.fromEntries(urlObj.searchParams.entries());
    } catch {
      // ignore
    }
  }

  const { status, payload } = handleTemplatesApi(query);
  res.status(status).json(payload);
}
