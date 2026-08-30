import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('config')
      .update({ value })
      .eq('key', key);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Supabase update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}