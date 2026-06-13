const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const VALID_CATEGORY = ['tea', 'food', 'fruit', 'interact']

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

  const { _id, product } = payload
  if (!_id) return { code: 400, message: '_id required' }
  if (!product || typeof product !== 'object') return { code: 400, message: 'product object required' }

  const data = { _updatedAt: Date.now() }
  const { name, price, category, specs, avatar } = product

  if (name !== undefined) {
    if (!name || typeof name !== 'string') return { code: 400, message: 'name cannot be empty' }
    data.name = name
  }
  if (price !== undefined) {
    if (typeof price !== 'number') return { code: 400, message: 'price must be number' }
    data.price = price
  }
  if (category !== undefined) {
    if (!VALID_CATEGORY.includes(category)) return { code: 400, message: 'invalid category: ' + category }
    data.category = category
  }
  if (specs !== undefined) {
    data.specs = (specs && typeof specs === 'object' && !Array.isArray(specs)) ? specs : {}
  }
  if (avatar !== undefined) {
    data.avatar = typeof avatar === 'string' ? avatar : ''
  }

  try {
    const res = await cloud.database().collection('products').doc(_id).update({ data })
    return { code: 0, updated: res.stats.updated }
  } catch (err) {
    return { code: 500, message: String(err) }
  }
}
