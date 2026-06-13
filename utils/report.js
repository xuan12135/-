function reportOrder(order) {
  if (!wx.cloud) {
    console.warn('reportOrder: wx.cloud not available')
    return
  }
  if (!order) return
  wx.cloud.database().collection('orders').add({
    data: { ...order, _reportedAt: Date.now() }
  }).catch(err => {
    console.warn('reportOrder failed:', err)
  })
}

module.exports = { reportOrder }
