import { supabase, isSupabaseConfigured } from './supabase';

// ─── Types ───────────────────────────────────────────────────────
export interface DbGalleryAsset {
  id: string;
  user_email: string;
  filename: string;
  content_type: string;
  storage_path: string;
  public_url: string;
  caption: string | null;
  tags: string[];
  ocr_text: string | null;
  analysis_mode: string | null;
  size_bytes: number;
  created_at: string;
}

export interface DbAnalysisHistory {
  id: string;
  user_email: string;
  file_name: string;
  file_type: string;
  mode: string;
  model: string;
  analysis: any;
  preview_url: string | null;
  gallery_asset_id: string | null;
  created_at: string;
}

export interface DbUserSettings {
  id: string;
  user_email: string;
  dark_mode: boolean;
  auto_analysis: boolean;
  avatar_url: string | null;
  openai_key_encrypted: string | null;
  anthropic_key_encrypted: string | null;
  email_analysis_complete: boolean;
  email_weekly_summary: boolean;
  email_security_alerts: boolean;
  push_desktop: boolean;
  push_marketing: boolean;
  two_factor_enabled: boolean;
  data_privacy_enabled: boolean;
  api_usage_count: number;
  updated_at: string;
}

// ─── Storage bucket name ─────────────────────────────────────────
const BUCKET = 'gallery-images';

// ═══════════════════════════════════════════════════════════════════
// GALLERY ASSETS
// ═══════════════════════════════════════════════════════════════════

export async function uploadImageToStorage(
  file: File | Blob,
  filename: string,
  userEmail: string
): Promise<{ storagePath: string; publicUrl: string } | null> {
  if (!isSupabaseConfigured()) return null;

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userEmail}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Supabase Storage upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: urlData.publicUrl,
  };
}

export async function saveGalleryAsset(
  asset: {
    filename: string;
    contentType: string;
    storagePath: string;
    publicUrl: string;
    caption?: string;
    tags?: string[];
    ocrText?: string;
    analysisMode?: string;
    sizeBytes?: number;
  },
  userEmail: string
): Promise<DbGalleryAsset | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('gallery_assets')
    .insert({
      user_email: userEmail,
      filename: asset.filename,
      content_type: asset.contentType,
      storage_path: asset.storagePath,
      public_url: asset.publicUrl,
      caption: asset.caption || null,
      tags: asset.tags || [],
      ocr_text: asset.ocrText || null,
      analysis_mode: asset.analysisMode || null,
      size_bytes: asset.sizeBytes || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase gallery insert error:', error);
    return null;
  }
  return data;
}

export async function getGalleryAssets(
  userEmail: string,
  query?: string
): Promise<DbGalleryAsset[]> {
  if (!isSupabaseConfigured()) return [];

  let q = supabase
    .from('gallery_assets')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(100);

  if (query && query.trim()) {
    // Search in filename, caption, and tags
    q = q.or(
      `filename.ilike.%${query}%,caption.ilike.%${query}%`
    );
  }

  const { data, error } = await q;

  if (error) {
    console.log('Supabase gallery fetch error:', JSON.stringify(error, null, 2));
    throw new Error('Failed to fetch gallery from Supabase');
  }
  return data || [];
}

export async function deleteGalleryAsset(
  id: string,
  userEmail: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  // 1. Get the storage path first
  const { data: asset } = await supabase
    .from('gallery_assets')
    .select('storage_path')
    .eq('id', id)
    .eq('user_email', userEmail)
    .single();

  if (asset?.storage_path) {
    // 2. Delete from storage
    await supabase.storage.from(BUCKET).remove([asset.storage_path]);
  }

  // 3. Delete from database
  const { error } = await supabase
    .from('gallery_assets')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail);

  if (error) {
    console.error('Supabase gallery delete error:', error);
    return false;
  }
  return true;
}

export async function bulkDeleteGalleryAssets(
  ids: string[],
  userEmail: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || ids.length === 0) return false;

  // Get storage paths
  const { data: assets } = await supabase
    .from('gallery_assets')
    .select('storage_path')
    .in('id', ids)
    .eq('user_email', userEmail);

  if (assets && assets.length > 0) {
    const paths = assets.map((a) => a.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
  }

  const { error } = await supabase
    .from('gallery_assets')
    .delete()
    .in('id', ids)
    .eq('user_email', userEmail);

  if (error) {
    console.error('Supabase bulk delete error:', error);
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// ANALYSIS HISTORY
// ═══════════════════════════════════════════════════════════════════

export async function saveAnalysisHistory(
  entry: {
    fileName: string;
    fileType: string;
    mode: string;
    model: string;
    analysis: any;
    previewUrl?: string;
    galleryAssetId?: string;
  },
  userEmail: string
): Promise<DbAnalysisHistory | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('analysis_history')
    .insert({
      user_email: userEmail,
      file_name: entry.fileName,
      file_type: entry.fileType,
      mode: entry.mode,
      model: entry.model,
      analysis: entry.analysis,
      preview_url: entry.previewUrl || null,
      gallery_asset_id: entry.galleryAssetId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase history insert error:', error);
    return null;
  }
  return data;
}

export async function getAnalysisHistory(
  userEmail: string,
  query?: string
): Promise<DbAnalysisHistory[]> {
  if (!isSupabaseConfigured()) return [];

  let q = supabase
    .from('analysis_history')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(50);

  if (query && query.trim()) {
    q = q.or(`file_name.ilike.%${query}%,mode.ilike.%${query}%`);
  }

  const { data, error } = await q;

  if (error) {
    console.log('Supabase history fetch error:', JSON.stringify(error, null, 2));
    throw new Error('Failed to fetch history from Supabase');
  }
  return data || [];
}

export async function deleteAnalysisEntry(
  id: string,
  userEmail: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('analysis_history')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail);

  if (error) {
    console.error('Supabase history delete error:', error);
    return false;
  }
  return true;
}

export async function clearAnalysisHistory(
  userEmail: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('analysis_history')
    .delete()
    .eq('user_email', userEmail);

  if (error) {
    console.error('Supabase clear history error:', error);
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// USER SETTINGS
// ═══════════════════════════════════════════════════════════════════

export async function getUserSettings(
  userEmail: string
): Promise<DbUserSettings | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_email', userEmail)
    .single();

  if (error) {
    // Not found is expected for new users
    if (error.code === 'PGRST116') return null;
    console.log('Supabase settings fetch error:', JSON.stringify(error, null, 2));
    return null;
  }
  return data;
}

export async function updateUserSettings(
  userEmail: string,
  settings: Partial<Omit<DbUserSettings, 'id' | 'user_email' | 'updated_at'>>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_email: userEmail,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email' }
    );

  if (error) {
    console.log('Supabase settings upsert error:', JSON.stringify(error, null, 2));
    return false;
  }
  return true;
}
