const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const TEA_SPECS = { '杯型': ['小杯', '中杯', '大杯'], '温度': ['热', '温', '少冰', '多冰'] }
const FOOD_SPECS = { '辣度': ['不辣', '微辣', '中辣', '特辣'] }

const DEFAULT_PRODUCTS = [
  { id: 1, name: '珍珠奶茶', price: 15, sales: 999, rating: 5.0, category: 'tea', avatar: 'kitty-tea', specs: TEA_SPECS },
  { id: 2, name: '草莓奶昔', price: 15, sales: 999, rating: 5.0, category: 'tea', avatar: 'kitty-shake', specs: TEA_SPECS },
  { id: 3, name: '焦糖玛奇朵', price: 15, sales: 999, rating: 5.0, category: 'tea', avatar: 'kitty-coffee', specs: TEA_SPECS },
  { id: 4, name: '芋圆波波', price: 16, sales: 666, rating: 4.9, category: 'tea', avatar: 'kitty-taro', specs: TEA_SPECS },
  { id: 5, name: '杨枝甘露', price: 20, sales: 520, rating: 4.8, category: 'tea', avatar: 'kitty-mango', specs: TEA_SPECS },
  { id: 6, name: '柠檬茶', price: 12, sales: 888, rating: 4.9, category: 'tea', avatar: 'kitty-lemon', specs: TEA_SPECS },
  { id: 7, name: '咖喱鸡饭', price: 25, sales: 777, rating: 5.0, category: 'food', avatar: 'kitty-curry', specs: FOOD_SPECS },
  { id: 8, name: '卤肉饭', price: 22, sales: 888, rating: 4.8, category: 'food', avatar: 'kitty-rice', specs: FOOD_SPECS },
  { id: 9, name: '日式肥牛饭', price: 28, sales: 666, rating: 5.0, category: 'food', avatar: 'kitty-beef', specs: FOOD_SPECS },
  { id: 10, name: '蔬菜沙拉', price: 18, sales: 328, rating: 4.7, category: 'food', avatar: 'kitty-salad', specs: FOOD_SPECS },
  { id: 11, name: '意面', price: 26, sales: 520, rating: 4.9, category: 'food', avatar: 'kitty-pasta', specs: FOOD_SPECS },
  { id: 12, name: '小火锅', price: 35, sales: 999, rating: 5.0, category: 'food', avatar: 'kitty-hotpot', specs: FOOD_SPECS }
]

exports.main = async (event, context) => {
  let payload = event
  if (event.httpMethod && typeof event.body === 'string') {
    try {
      payload = JSON.parse(event.body)
    } catch (e) {
      return { code: 400, message: 'invalid JSON body' }
    }
  }

  const token = process.env.ADMIN_TOKEN
  if (!token) return { code: 500, message: 'ADMIN_TOKEN not configured' }
  if (payload.token !== token) return { code: 401, message: 'invalid token' }

  try {
    const db = cloud.database()
    const existing = await db.collection('products').field({ id: true }).get()
    const existingIds = new Set(existing.data.map(p => p.id))

    let added = 0
    let skipped = 0
    for (const p of DEFAULT_PRODUCTS) {
      if (existingIds.has(p.id)) { skipped++; continue }
      await db.collection('products').add({
        data: { ...p, deleted: false, _createdAt: Date.now() }
      })
      added++
    }
    return { code: 0, added, skipped, total: DEFAULT_PRODUCTS.length }
  } catch (err) {
    return { code: 500, message: String(err) }
  }
}
