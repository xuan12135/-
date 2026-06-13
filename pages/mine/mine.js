const app = getApp()

Page({
  data: {
    totalOrders: 0,
    favorites: [],
    showAboutPopup: false,
    version: '1.0.0'
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const orders = wx.getStorageSync('orders') || []
    const favorites = wx.getStorageSync('favorites') || []
    this.setData({
      totalOrders: orders.length,
      favorites
    })
  },

  goToOrders() {
    wx.switchTab({ url: '/pages/order/order' })
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  clearAllOrders() {
    wx.showModal({
      title: '🎀 确认清空',
      content: '真的要清空所有订单吗？此操作不可恢复哦~',
      confirmColor: '#FF6B8B',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('orders', [])
          wx.setStorageSync('points', 0)
          this.loadData()
          wx.showToast({ title: '已清空~', icon: 'success' })
        }
      }
    })
  },

  openAbout() {
    this.setData({ showAboutPopup: true })
  },

  closeAbout() {
    this.setData({ showAboutPopup: false })
  }
})
