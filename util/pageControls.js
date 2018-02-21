class PageContainer {
  constructor () {
    this.messageList = {}
  }

  async nextPage (message) {
    if (this.messageList[message.id].currentPage + 1 > this.messageList[message.id].pages.length - 1) return
    this.messageList[message.id].currentPage++
    const pageMsg = this.messageList[message.id]

    try {
      const m = await message.channel.fetchMessage(message.id)
      await m.edit({embed: pageMsg.pages[pageMsg.currentPage]})
    } catch (err) {
      console.log(`Page Controls Warning: nextPage:`, err.message || err)
    }
  }

  async prevPage (message) {
    if (this.messageList[message.id].currentPage - 1 < 0) return
    this.messageList[message.id].currentPage--
    const pageMsg = this.messageList[message.id]

    try {
      const m = await message.channel.fetchMessage(message.id)
      await m.edit({embed: pageMsg.pages[pageMsg.currentPage]})
    } catch (err) {
      console.log(`Page Controls Warning: prevPage:`, err.message || err)
    }
  }
}

const pageMsgs = new PageContainer()

exports.add = (msgId, pages) => {
  pageMsgs.messageList[msgId] = {
    currentPage: 0,
    pages: pages
  }
}
exports.nextPage = message => pageMsgs.nextPage(message)
exports.prevPage = message => pageMsgs.prevPage(message)
exports.has = id => pageMsgs.messageList[id]
