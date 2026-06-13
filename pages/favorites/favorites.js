Page({
  data: {
    favorites: [],
    kittyEmojis: ['🐱', '🎀', '💕', '🌸', '🍰', '🧋', '☕', '🍓', '🥭', '🍋', '🍛', '🍚']
  },

  onShow() {
    this.loadFavorites()
  },

  loadFavorites() {
    const favorites = wx.getStorageSync('favorites') || []
    this.setData({ favorites })
  },

  removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    let favorites = this.data.favorites.filter(f => f.id !== id)
    wx.setStorageSync('favorites', favorites)
    this.setData({ favorites })
    wx.showToast({ title: '已移除~', icon: 'success' })
  },

  addFavoriteFromProducts() {
    wx.showModal({
      title: '去首页收藏',
      content: '在首页选商品 → 点选规格 → 点 ❤️ 即可收藏',
      showCancel: false,
      confirmText: '去首页',
      confirmColor: '#6A5ACD',
      success: () => {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  }
})
