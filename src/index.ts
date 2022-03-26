import 'source-map-support/register'

import { CommandClient, Message, MessageContent, PossiblyUncachedTextableChannel } from 'eris'
import markov from 'markov'
import { Level } from 'level'

const commonPrefixes = '!$%^&*()-+=.>?/:;'.split('')

const messageDb = new Level('messages',  { valueEncoding: 'json' })
const attachmentDb = new Level('general', { valueEncoding: 'json' })

const m = markov()

;(async () => {
  for await (const [key, value] of messageDb.iterator()) {
    await new Promise(resolve => m.seed(value, () => resolve(null)))
  }
  console.log('Seeded markov thing')
})()

const bot = new CommandClient(process.env.TOKEN, {
  intents: ['guildMessages']
})

process.on('SIGINT', () => {
  bot.disconnect({ reconnect: false })
  messageDb.close()
  attachmentDb.close()
})

bot.on('ready', () => console.log('ready'))

bot.on('messageCreate', async msg => {
  if (!msg.author.bot && msg.mentions.includes(bot.user)) {
    try {
      const response: MessageContent = {
        allowedMentions: {
          users: []
        },
        content: m.respond(msg.content).join(' ')
      }
      if (Math.random() * 10 > 9) {
        const images: string[] = []
        for await (const [key] of attachmentDb.iterator()) {
          images.push(key)
        }
        const random = Math.floor(Math.random() * images.length)
        response.content += '\n' + images[random]
      }
      bot.createMessage(msg.channel.id, response)
    } catch (e) {
      try {
        bot.createMessage(msg.channel.id, 'something broke and I couldn\'t generate a response')
      } catch (eee) {
        console.error(eee)
      }
    }
  } else if (!msg.author.bot && !commonPrefixes.includes(msg.content[0])) {
    m.seed(msg.content)
    await messageDb.put(msg.id, msg.content)
  }
})

const attachmentWatcher = async (msg: Message<PossiblyUncachedTextableChannel>) => {
  const urls = msg.attachments.map(a => a.proxy_url).concat(msg.embeds.map(e => e.image?.proxy_url).filter(v => v !== undefined))
  for (const url of urls) {
    await attachmentDb.put(url, url)
  }
}

bot.on('messageCreate', attachmentWatcher)
bot.on('messageUpdate', attachmentWatcher)

bot.connect()
  .catch(err => {
    console.error(err)
  })
