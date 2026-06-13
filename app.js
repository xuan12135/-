// app.js
App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ env: 'cloud1-d5gaguanke825f14e', traceUser: true })
    }
    this.initData()
    this.syncProductsFromCloud()
  },

  async syncProductsFromCloud() {
    try {
      const db = wx.cloud.database()
      const _ = db.command
      const res = await db.collection('products')
        .where({ deleted: _.neq(true) })
        .orderBy('id', 'asc')
        .limit(100)
        .get()
      if (res.data && res.data.length > 0) {
        const products = res.data.map(p => {
          let avatar = p.avatar
          if (typeof avatar === 'string' && avatar.length > 0
              && !avatar.startsWith('cloud://')
              && !avatar.startsWith('http://')
              && !avatar.startsWith('https://')) {
            avatar = ''
          }
          return {
            id: p.id || 0,
            name: p.name,
            price: p.price,
            sales: p.sales || 0,
            rating: p.rating || 5.0,
            category: p.category,
            avatar: avatar || '',
            specs: p.specs || []
          }
        })
        wx.setStorageSync('products', products)
        console.log('[sync] products from cloud:', products.length)
      }
    } catch (e) {
      console.warn('[sync] products failed, using local:', e)
    }
  },

  initData() {
    const products = wx.getStorageSync('products')
    if (!products || products.length === 0) {
      const defaultProducts = [
        { id: 1, name: '珍珠奶茶', price: 15, sales: 999, rating: 5.0, category: 'tea', avatar: 'kitty-tea', specs: ['杯型', '温度'] },
        { id: 2, name: '草莓奶昔', price: 15, sales: 999, rating: 5.0, category: 'tea', avatar: 'kitty-shake', specs: ['杯型', '温度'] },
        { id: 3, name: '焦糖玛奇朵', price: 15, sales: 999, rating: 5.0, category: 'tea', avatar: 'kitty-coffee', specs: ['杯型', '温度'] },
        { id: 4, name: '芋圆波波', price: 16, sales: 666, rating: 4.9, category: 'tea', avatar: 'kitty-taro', specs: ['杯型', '温度'] },
        { id: 5, name: '杨枝甘露', price: 20, sales: 520, rating: 4.8, category: 'tea', avatar: 'kitty-mango', specs: ['杯型', '温度'] },
        { id: 6, name: '柠檬茶', price: 12, sales: 888, rating: 4.9, category: 'tea', avatar: 'kitty-lemon', specs: ['杯型', '温度'] },
        { id: 7, name: '咖喱鸡饭', price: 25, sales: 777, rating: 5.0, category: 'food', avatar: 'kitty-curry', specs: ['辣度'] },
        { id: 8, name: '卤肉饭', price: 22, sales: 888, rating: 4.8, category: 'food', avatar: 'kitty-rice', specs: ['辣度'] },
        { id: 9, name: '日式肥牛饭', price: 28, sales: 666, rating: 5.0, category: 'food', avatar: 'kitty-beef', specs: ['辣度'] },
        { id: 10, name: '蔬菜沙拉', price: 18, sales: 328, rating: 4.7, category: 'food', avatar: 'kitty-salad', specs: ['辣度'] },
        { id: 11, name: '意面', price: 26, sales: 520, rating: 4.9, category: 'food', avatar: 'kitty-pasta', specs: ['辣度'] },
        { id: 12, name: '小火锅', price: 35, sales: 999, rating: 5.0, category: 'food', avatar: 'kitty-hotpot', specs: ['辣度'] }
      ]
      wx.setStorageSync('products', defaultProducts)
    }

    const orders = wx.getStorageSync('orders')
    if (!orders) {
      const demoOrder = {
        id: this.generateOrderId(),
        productId: 1,
        productName: '珍珠奶茶',
        price: 15,
        specs: { '杯型': '大杯', '温度': '少冰' },
        status: 'pending',
        createTime: new Date().getTime(),
        category: 'tea'
      }
      wx.setStorageSync('orders', [demoOrder])
    }

    const points = wx.getStorageSync('points')
    if (points === '' || points === undefined || points === null) {
      wx.setStorageSync('points', 0)
    }

    const favorites = wx.getStorageSync('favorites')
    if (!favorites) {
      wx.setStorageSync('favorites', [])
    }
  },

  generateOrderId() {
    return Math.floor(1000 + Math.random() * 9000)
  },

  globalData: {
    userInfo: null
  }
})
