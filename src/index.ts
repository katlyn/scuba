import 'source-map-support/register'

import { CommandClient } from 'eris'
import markov from 'markov'
import { Level } from 'level'

const commonPrefixes = '!$%^&*()-+=.>?/:;'.split('')

const db = new Level('messages',  { valueEncoding: 'json' })

const m = markov()

;(async () => {
  for await (const [key, value] of db.iterator()) {
    await new Promise(resolve => m.seed(value, () => resolve(null)))
  }
  console.log('Seeded markov thing')
})()

const bot = new CommandClient(process.env.TOKEN, {
  intents: ['guildMessages']
})

process.on('SIGINT', () => {
  bot.disconnect({ reconnect: false })
  db.close()
})

bot.on('ready', () => console.log('ready'))

bot.on('messageCreate', async msg => {
  if (!msg.author.bot && msg.mentions.includes(bot.user)) {
    try {
      const response = m.respond(msg.content)
      bot.createMessage(msg.channel.id, response.join(' '))
    } catch (e) {
      try {
        bot.createMessage(msg.channel.id, 'something broke and I couldn\'t generate a response')
      } catch (eee) {
        console.error(eee)
      }
    }
  } else if (!msg.author.bot && !commonPrefixes.includes(msg.content[0])) {
    m.seed(msg.content)
    await db.put(msg.id, msg.content)
  }
})

bot.connect()
  .catch(err => {
    console.error(err)
  })
