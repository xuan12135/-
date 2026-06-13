const app = getApp()
const { reportOrder } = require('../../utils/report.js')

Page({
  data: {
    activeTab: 'eat',
    eatItems: [],
    drinkItems: [],
    eatColors: [],
    drinkColors: [],
    spinning: false,
    showResultPopup: false,
    resultType: '',
    resultText: '',
    resultEmoji: '',
    wheelSize: 300,
    goSize: 0,
    goLeft: 0,
    goTop: 0,
    wheelImage: '',
    loading: true
  },

  canvas: null,
  ctx: null,
  displaySize: 0,

  onShow() {
    this.setData({ loading: true })
    this.loadProductsFromCloud()
  },

  async loadProductsFromCloud() {
    try {
      const db = wx.cloud.database()
      const _ = db.command
      const res = await db.collection('products')
        .where({ deleted: _.neq(true) })
        .orderBy('id', 'asc')
        .limit(50)
        .get()
      const all = res.data || []
      const eat = all.filter(p => p.category === 'food').map(p => p.name)
      const drink = all.filter(p => p.category === 'tea').map(p => p.name)
      const palette = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#5DA5DA', '#FAA43A']
      const eatColors = eat.map((_, i) => palette[i % palette.length])
      const drinkColors = drink.map((_, i) => palette[i % palette.length])
      this.setData({ eatItems: eat, drinkItems: drink, eatColors, drinkColors, loading: false }, () => {
        if (this.ctx && this.displaySize) this.redraw()
      })
    } catch (e) {
      console.warn('loadProductsFromCloud failed:', e)
      this.setData({ loading: false })
    }
  },

  onReady() {
    const sysInfo = wx.getWindowInfo()
    const wheelSize = Math.floor(Math.min(sysInfo.windowWidth - 16, sysInfo.windowHeight - 140))
    const radius = wheelSize / 2 - 10
    const goR = Math.max(26, Math.floor(radius * 0.14))
    this.setData({
      wheelSize,
      goSize: goR * 2,
      goLeft: (wheelSize - goR * 2) / 2,
      goTop: (wheelSize - goR * 2) / 2
    }, () => {
      this.initCanvas()
    })
  },

  switchTab(e) {
    if (this.data.spinning) return
    this.setData({ activeTab: e.currentTarget.dataset.tab })
    this.redraw() 
  },

  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#wheelCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return
      this.canvas = res[0].node
      this.ctx = this.canvas.getContext('2d')
      const dpr = wx.getWindowInfo().pixelRatio
      this.displaySize = res[0].width
      this.canvas.width = this.displaySize * dpr
      this.canvas.height = this.displaySize * dpr
      this.ctx.scale(dpr, dpr)
      this.redraw()
    })
  },

  redraw() {
    if (!this.ctx || !this.displaySize) return
    const isEat = this.data.activeTab === 'eat'
    this.drawWheel(
      this.ctx, this.displaySize,
      isEat ? this.data.eatItems : this.data.drinkItems,
      isEat ? this.data.eatColors : this.data.drinkColors,
      0
    )
  },

  drawWheel(ctx, size, items, colors, rotation) {
    const center = size / 2
    const radius = center - 10
    const sliceAngle = (2 * Math.PI) / items.length
    const fontSize = Math.max(14, Math.floor(radius / 8))
    const rotRad = (rotation * Math.PI) / 180

    ctx.clearRect(0, 0, size, size)

    // 外圈
    ctx.beginPath()
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI)
    ctx.fillStyle = '#2D3436'
    ctx.fill()

    // 外圈小圆点
    for (let i = 0; i < items.length * 3; i++) {
      const angle = (i * 2 * Math.PI) / (items.length * 3) + rotRad
      const x = center + (radius + 2) * Math.cos(angle)
      const y = center + (radius + 2) * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(x, y, 3.5, 0, 2 * Math.PI)
      ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#FFEAA7'
      ctx.fill()
    }

    // 扇形 + 文字
    for (let i = 0; i < items.length; i++) {
      const startAngle = i * sliceAngle - Math.PI / 2 + rotRad
      const endAngle = startAngle + sliceAngle

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = colors[i]
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(startAngle + sliceAngle / 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(items[i], radius * 0.6, 0)
      ctx.restore()
    }

    // 中心圆（不跟着转）
    const cr = Math.max(20, Math.floor(radius * 0.12))
    ctx.beginPath()
    ctx.arc(center, center, cr + 3, 0, 2 * Math.PI)
    ctx.fillStyle = '#2D3436'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(center, center, cr, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.fillStyle = '#2D3436'
    ctx.font = `bold ${Math.floor(cr * 0.7)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('GO', center, center)
  },

  spin() {
    if (this.data.spinning) return
    if (this.data.loading) {
      wx.showToast({ title: '加载中,请稍候', icon: 'none' })
      return
    }
    if (!this.canvas || !this.ctx || !this.displaySize) return

    const type = this.data.activeTab
    const isEat = type === 'eat'
    const items = isEat ? this.data.eatItems : this.data.drinkItems
    const colors = isEat ? this.data.eatColors : this.data.drinkColors
    if (!items || items.length === 0) {
      wx.showToast({ title: '暂无商品', icon: 'none' })
      return
    }

    this.setData({ spinning: true })

    const count = items.length
    const targetIndex = Math.floor(Math.random() * count)
    const sliceAngle = 360 / count
    const targetAngle = 360 - (targetIndex * sliceAngle + sliceAngle / 2)
    // 4~6 圈 + 目标角度，始终正方向
    const totalRotation = 360 * (4 + Math.floor(Math.random() * 3)) + targetAngle

    const duration = 4000
    const startTime = Date.now()
    const ctx = this.ctx
    const size = this.displaySize
    const canvas = this.canvas

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // 缓出：先快后慢，一直往正方向转
      const eased = 1 - Math.pow(1 - progress, 4)
      const currentAngle = totalRotation * eased

      this.drawWheel(ctx, size, items, colors, currentAngle)

      if (progress < 1) {
        canvas.requestAnimationFrame(animate)
      } else {
        this.setData({ spinning: false })
        this.showResult(type, items[targetIndex])
      }
    }

    canvas.requestAnimationFrame(animate)
  },

  showResult(type, result) {
    let wheelImage = ''
    if (this.canvas) {
      try { wheelImage = this.canvas.toDataURL() } catch (e) {}
    }
    this.setData({
      showResultPopup: true,
      resultType: type,
      resultText: type === 'eat' ? `今天吃${result}吧！` : `今天喝${result}吧！`,
      resultEmoji: type === 'eat' ? '🍽️' : '🥤',
      wheelImage
    })
  },

  closeResultPopup() {
    this.setData({ showResultPopup: false, wheelImage: '' })
  },

  addResultToOrder() {
    const { resultType } = this.data
    const fullText = this.data.resultText
    let productName = ''
    if (resultType === 'eat') {
      productName = fullText.replace('今天吃', '').replace('吧！', '')
    } else {
      productName = fullText.replace('今天喝', '').replace('吧！', '')
    }
    const products = wx.getStorageSync('products') || []
    let product = products.find(p => p.name === productName)
    const category = resultType === 'eat' ? 'food' : 'tea'
    if (!product) {
      product = {
        id: products.length + 100,
        name: productName,
        price: resultType === 'eat' ? 22 : 16,
        category,
        specs: resultType === 'eat' ? ['辣度'] : ['杯型', '温度']
      }
    }
    const order = {
      id: app.generateOrderId(),
      productId: product.id,
      productName: product.name,
      price: product.price,
      specs: resultType === 'eat' ? { '辣度': '不辣' } : { '杯型': '中杯', '温度': '少冰' },
      status: 'pending',
      createTime: new Date().getTime(),
      category
    }
    const orders = wx.getStorageSync('orders') || []
    orders.unshift(order)
    reportOrder(order)
    wx.setStorageSync('orders', orders)
    const points = wx.getStorageSync('points') || 0
    wx.setStorageSync('points', points + 1)
    this.setData({ showResultPopup: false, wheelImage: '' })
    wx.showToast({ title: '已下单~', icon: 'success' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/order/order' })
    }, 1200)
  }
})
