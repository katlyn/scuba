declare module 'dream-api' {
  // The best (no more than n) matches among the possibilities are returned in a
  // list, sorted by similarity score, most similar first.
  export interface GeneratedImage {
    id: string
    user_id: string
    input_spec: {
      style: number
      prompt: string
      display_freq: number
    }
    state: string
    premium: boolean
    created_at: string
    updated_at: string
    photo_url_list: string[]
    generated_photo_keys: string[]
    result: {
      final: string
    }
  }
  export function generateImage (style: number, prompt: string): Promise<GeneratedImage>
}
