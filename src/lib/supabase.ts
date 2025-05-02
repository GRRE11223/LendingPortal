import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// 上传文件
export async function uploadFile(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file)
    
  if (error) throw error
  return data
}

// 获取文件 URL
export async function getFileUrl(path: string) {
  const { data } = await supabase.storage
    .from('documents')
    .getPublicUrl(path)
    
  return data.publicUrl
}

// 删除文件
export async function deleteFile(path: string) {
  const { error } = await supabase.storage
    .from('documents')
    .remove([path])
    
  if (error) throw error
}

// 获取文件列表
export async function listFiles(prefix?: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .list(prefix || '')
    
  if (error) throw error
  return data
} 