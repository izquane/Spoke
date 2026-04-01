// api/recordings/[id].js — GET /api/recordings/:id
// Retrieves a previously processed recording from Supabase by UUID.
//
// Response (JSON):
//   { id, transcript, formats: { tweet, thread, longform }, created_at }

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Recording ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[/api/recordings/:id] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
