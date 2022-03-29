import 'source-map-support/register'

import { CommandClient, Message, MessageContent, PossiblyUncachedTextableChannel } from 'eris'
import Markov from './markov'
import { Level } from 'level'

const commonPrefixes = '!$%^&*()-+=.>?/:;'.split('')

const messageDb = new Level('messages',  { valueEncoding: 'json' })
const attachmentDb = new Level('attachments', { valueEncoding: 'json' })
const generalDb = new Level('general', { valueEncoding: 'json' })

let m: Markov

const train = async () => {
  let order = 2
  try {
    order = Number(await generalDb.get('order'))
  } catch (e) {}
  m = new Markov()
  for await (const [key, value] of messageDb.iterator()) {
    m.seed(value)
  }
  console.log('Seeded markov thing')
}

const forgetMessages = async (ids: string[]) => {
  for (const id in ids) {
    await messageDb.del(id)
  }
  await train()
}

const forgetImage = async (img: string) => {
  await attachmentDb.del(img)
}

train()

const bot = new CommandClient(process.env.TOKEN, {
  intents: ['guildMessages']
}, {
  prefix: '>'
})

bot.registerCommand('retrain', async (msg, args) => {
  const order = Number(args[0])
  if (isNaN(order) || order < 1 || order > 10) {
    return 'number between 1 and 10 pls'
  }
  generalDb.put('order', order.toString())
  await train()
  return 'done'
})

bot.registerCommand('forget', async (msg, args) => {
  await forgetMessages(args)
  return 'forgotten forever'
})
bot.registerCommand('forgetImage', async (msg, args) => {
  await forgetImage(args[0])
  return 'image gone'
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

bot.on('messageUpdate', msg => {
  if (!msg.author.bot && !msg.mentions.includes(bot.user) && !commonPrefixes.includes(msg.content[0])) {
    messageDb.put(msg.id, msg.content)
    train()
  }
})

// Forget messages if they're deleted
bot.on('messageDelete', msg => forgetMessages([msg.id]))
bot.on('messageDeleteBulk', msgs => forgetMessages(msgs.map(m => m.id)))

const attachmentWatcher = async (msg: Message<PossiblyUncachedTextableChannel>) => {
  const urls: string[] = []
  msg.attachments?.forEach(a => urls.push(a.proxy_url))
  msg.embeds?.forEach(e => {
    if (e.image) urls.push(e.image.proxy_url)
  })
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
