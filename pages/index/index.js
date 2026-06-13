const app = getApp()
const { reportOrder } = require('../../utils/report.js')

Page({
  data: {
    currentCategory: 'tea',
    currentCategoryName: '奶茶',
    categories: [
      { key: 'tea', name: '奶茶', count: 6 },
      { key: 'food', name: '食物', count: 6 },
      { key: 'fruit', name: '水果', count: 0 },
      { key: 'interact', name: '互动', count: 0 }
    ],
    products: [],
    filteredProducts: [],
    searchKey: '',
    showSearch: false,
    shopInfo: {
      name: '小梁宝贝的愿望 ✨',
      desc: '(持续升级中)',
      rating: 4.8,
      sales: 9999
    },
    showSpecPopup: false,
    currentProduct: null,
    specOptions: {
      '杯型': ['小杯', '中杯', '大杯'],
      '温度': ['热', '温', '少冰', '多冰'],
      '辣度': ['不辣', '微辣', '中辣', '特辣']
    },
    selectedSpecs: {},
    kittyEmojis: ['🐱', '🎀', '💕', '🌸', '🍰', '🧋', '☕', '🍓', '🥭', '🍋', '🍛', '🍚'],
    cart: [],
    cartCount: 0,
    cartTotal: 0,
    showCartPopup: false,
    tabBarHeight: 50,
    isFavorited: false
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    // 动态计算tabbar高度：屏幕高 - 页面可用高 - 状态栏高 - 导航栏高
    const navBarHeight = 44
    let tabBarHeight = sysInfo.screenHeight - sysInfo.windowHeight - (sysInfo.statusBarHeight || 0) - navBarHeight
    if (tabBarHeight < 0 || tabBarHeight > 100) tabBarHeight = 50
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20, tabBarHeight })
  },

  onShow() {
    this.loadProducts()
    this.loadCart()
  },

  loadProducts() {
    const products = wx.getStorageSync('products') || []
    const orders = wx.getStorageSync('orders') || []

    // 计算每个商品的实际月销量
    const salesMap = {}
    orders.forEach(order => {
      if (order.productId) {
        salesMap[order.productId] = (salesMap[order.productId] || 0) + 1
      }
    })

    const updatedProducts = products.map(p => ({
      ...p,
      sales: salesMap[p.id] || 0
    }))

    const categoryCounts = {}
    products.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1
    })
    const updatedCategories = this.data.categories.map(c => ({
      ...c,
      count: categoryCounts[c.key] || 0
    }))

    // 更新店铺总销量
    const totalSales = Object.values(salesMap).reduce((sum, n) => sum + n, 0)
    this.setData({
      products: updatedProducts,
      categories: updatedCategories,
      'shopInfo.sales': totalSales
    })
    this.filterProducts()
  },

  loadCart() {
    const cart = wx.getStorageSync('cart') || []
    this.setData({ cart })
    this.calcCart()
  },

  calcCart() {
    let count = 0
    let total = 0
    this.data.cart.forEach(item => {
      count += item.quantity
      total += item.price * item.quantity
    })
    this.setData({ cartCount: count, cartTotal: total })
  },

  filterProducts() {
    const { products, currentCategory, searchKey } = this.data
    let filtered = products.filter(p => p.category === currentCategory)
    if (searchKey) {
      filtered = filtered.filter(p => p.name.indexOf(searchKey) !== -1)
    }
    this.setData({ filteredProducts: filtered })
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.key
    const cat = this.data.categories.find(c => c.key === category)
    this.setData({
      currentCategory: category,
      currentCategoryName: cat ? cat.name : '',
      searchKey: ''
    })
    this.filterProducts()
  },

  focusSearch() {
    this.setData({ showSearch: true })
  },

  blurSearch() {
    if (!this.data.searchKey) {
      this.setData({ showSearch: false })
    }
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value })
    this.filterProducts()
  },

  openSpecPopup(e) {
    const product = e.currentTarget.dataset.product
    console.log('[openSpecPopup] product.specs:', product && product.specs)
    const specList = []
    const defaultSpecs = {}
    if (product.specs && typeof product.specs === 'object' && !Array.isArray(product.specs)) {
      Object.entries(product.specs).forEach(([name, options]) => {
        if (Array.isArray(options) && options.length > 0) {
          specList.push({ name, options })
          defaultSpecs[name] = options[0]
        }
      })
    } else if (Array.isArray(product.specs)) {
      product.specs.forEach(name => {
        const options = this.data.specOptions[name]
        if (options && options.length > 0) {
          specList.push({ name, options })
          defaultSpecs[name] = options[0]
        }
      })
    }
    const favorites = wx.getStorageSync('favorites') || []
    const isFavorited = favorites.some(f => f.id === product.id)
    this.setData({
      showSpecPopup: true,
      currentProduct: { ...product, specList },
      selectedSpecs: defaultSpecs,
      isFavorited
    })
  },

  closeSpecPopup() {
    this.setData({ showSpecPopup: false, currentProduct: null })
  },

  toggleFavorite() {
    const product = this.data.currentProduct
    if (!product) return
    let favorites = wx.getStorageSync('favorites') || []
    const idx = favorites.findIndex(f => f.id === product.id)
    if (idx !== -1) {
      favorites.splice(idx, 1)
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      favorites.push(product)
      wx.showToast({ title: '已收藏~', icon: 'success' })
    }
    wx.setStorageSync('favorites', favorites)
    this.setData({ isFavorited: idx === -1 })
  },

  selectSpec(e) {
    const { name, value } = e.currentTarget.dataset
    console.log('[selectSpec]', { name, value, before: this.data.selectedSpecs })
    const specs = { ...this.data.selectedSpecs, [name]: value }
    this.setData({ selectedSpecs: specs })
    console.log('[selectSpec] after:', specs)
  },

  noop() {},

  addToCart() {
    const product = this.data.currentProduct
    const specs = this.data.selectedSpecs
    if (!product) return

    const specKey = JSON.stringify(specs)
    const cart = [...this.data.cart]
    const existIdx = cart.findIndex(item => item.productId === product.id && item.specKey === specKey)

    if (existIdx !== -1) {
      cart[existIdx].quantity += 1
    } else {
      cart.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        specs: { ...specs },
        specKey,
        quantity: 1,
        category: product.category
      })
    }

    wx.setStorageSync('cart', cart)
    this.setData({ showSpecPopup: false, currentProduct: null, cart })
    this.calcCart()

    wx.showToast({ title: '已加入购物车~', icon: 'success', duration: 1000 })
  },

  toggleCartPopup() {
    if (this.data.cartCount === 0) return
    this.setData({ showCartPopup: !this.data.showCartPopup })
  },

  closeCartPopup() {
    this.setData({ showCartPopup: false })
  },

  changeQuantity(e) {
    const { index, delta } = e.currentTarget.dataset
    const cart = [...this.data.cart]
    cart[index].quantity += delta
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1)
    }
    wx.setStorageSync('cart', cart)
    this.setData({ cart })
    this.calcCart()
    if (cart.length === 0) {
      this.setData({ showCartPopup: false })
    }
  },

  removeCartItem(e) {
    const index = e.currentTarget.dataset.index
    const cart = [...this.data.cart]
    cart.splice(index, 1)
    wx.setStorageSync('cart', cart)
    this.setData({ cart })
    this.calcCart()
    if (cart.length === 0) {
      this.setData({ showCartPopup: false })
    }
  },

  clearCart() {
    wx.setStorageSync('cart', [])
    this.setData({ cart: [], cartCount: 0, cartTotal: 0, showCartPopup: false })
  },

  // 结算
  checkout() {
    const cart = this.data.cart
    if (cart.length === 0) return

    wx.showModal({
      title: '确认结算',
      content: `共 ${this.data.cartCount} 件商品，合计 ¥${this.data.cartTotal}`,
      confirmColor: '#6A5ACD',
      success: (res) => {
        if (!res.confirm) return

        const orders = wx.getStorageSync('orders') || []
        let points = wx.getStorageSync('points') || 0

        cart.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            const newOrder = {
              id: app.generateOrderId(),
              productId: item.productId,
              productName: item.productName,
              price: item.price,
              specs: { ...item.specs },
              status: 'pending',
              createTime: new Date().getTime(),
              category: item.category
            }
            orders.unshift(newOrder)
            reportOrder(newOrder)
            points += 1
          }
        })

        wx.setStorageSync('orders', orders)
        wx.setStorageSync('points', points)
        this.clearCart()

        wx.showToast({ title: '下单成功~', icon: 'success', duration: 1200 })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/order/order' })
        }, 1200)
      }
    })
  }
})
