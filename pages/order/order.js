const util = require('../../utils/util.js')

Page({
  data: {
    orders: [],
    statusList: ['pending', 'making', 'done'],
    statusTextMap: { pending: '待制作', making: '制作中', done: '已完成' }
  },

  onShow() {
    this.loadOrders()
  },

  loadOrders() {
    const orders = wx.getStorageSync('orders') || []
    this.setData({ orders })
  },

  switchStatus(e) {
    const { id, status } = e.currentTarget.dataset
    const orders = this.data.orders
    const idx = orders.findIndex(o => o.id === id)
    if (idx === -1) return

    const statusList = this.data.statusList
    const currentIdx = statusList.indexOf(status)
    const nextIdx = (currentIdx + 1) % statusList.length
    const nextStatus = statusList[nextIdx]

    orders[idx].status = nextStatus

    if (nextStatus === 'done') {
      const products = wx.getStorageSync('products') || []
      const pIdx = products.findIndex(p => p.id === orders[idx].productId)
      if (pIdx !== -1) {
        products[pIdx].sales += 1
        wx.setStorageSync('products', products)
      }
    }

    wx.setStorageSync('orders', orders)
    this.setData({ orders })
  },

  deleteOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个订单吗？',
      confirmColor: '#6A5ACD',
      success: (res) => {
        if (res.confirm) {
          const orders = this.data.orders.filter(o => o.id !== id)
          wx.setStorageSync('orders', orders)
          this.setData({ orders })
          wx.showToast({ title: '已删除~', icon: 'success' })
        }
      }
    })
  }
})
