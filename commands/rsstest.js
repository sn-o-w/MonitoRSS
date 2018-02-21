const getRandomArticle = require('../rss/getArticle.js')
const sendToDiscord = require('../util/sendToDiscord.js')
const currentGuilds = require('../util/storage.js').currentGuilds
const FeedSelector = require('./util/FeedSelector.js')

module.exports = (bot, message, command) => {
  let simple = !!(message.content.split(' ').length > 1 && message.content.split(' ')[1] === 'simple')

  new FeedSelector(message, null, { command: command }).send(null, async (err, data, msgHandler) => {
    try {
      if (err) return err.code === 50013 ? null : await message.channel.send(err.message)
      // else if (!rssName) return
      const { rssName } = data

      const guildRss = currentGuilds.get(message.guild.id)

      const grabMsg = await message.channel.send(`Grabbing a random feed article...`)
      getRandomArticle(guildRss, rssName, false, (err, article) => {
        if (err) {
          let channelErrMsg = ''
          switch (err.type) {
            case 'failedLink':
              channelErrMsg = 'Reached fail limit. Use `rssrefresh` to try to validate and refresh feed'
              break
            case 'request':
              channelErrMsg = 'Unable to connect to feed link'
              break
            case 'feedparser':
              channelErrMsg = 'Invalid feed'
              break
            case 'database':
              channelErrMsg = 'Internal database error. Try again'
              break
            case 'deleted':
              channelErrMsg = 'Feed missing from database'
              break
            case 'empty':
              channelErrMsg = 'No existing articles'
              break
            default:
              channelErrMsg = 'No reason available'
          }
          console.log(`RSS Warning: Unable to send test article for feed ${err.feed.link}:`, err.message || err)
          msgHandler.deleteAll(message.channel)
          return grabMsg.edit(`Unable to grab random feed article for <${err.feed.link}>. (${channelErrMsg})`).catch(err => console.log(`Commands Warning: rsstest 1: `, err.message || err))
        }
        article.rssName = rssName
        article.discordChannelId = message.channel.id
        msgHandler.add(grabMsg)

        sendToDiscord(bot, article, (err) => {
          if (err) {
            console.log(`RSS Test Delivery Failure: (${message.guild.id}, ${message.guild.name}) => channel (${message.channel.id}, ${message.channel.name}) for article ${article.link}`, err.message || err)
            message.channel.send(`Failed to send test article. \`\`\`${err.message}\`\`\``).catch(err => console.log(`Commands Warning: rsstest 2: `, err.message || err))
          }
          msgHandler.deleteAll(message.channel)
        }, simple ? null : grabMsg) // Last parameter indicating a test message
      })
    } catch (err) {
      console.log(`Commands Warning: (${message.guild.id}, ${message.guild.name}) => Could initiate random feed grab for test:`, err.message || err)
    }
  })
}
