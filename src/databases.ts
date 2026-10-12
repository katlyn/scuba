import { Level } from 'level'

export const messageDb = new Level('messages',  { valueEncoding: 'json' })
export const attachmentDb = new Level('attachments', { valueEncoding: 'json' })
export const generalDb = new Level('general', { valueEncoding: 'json' })