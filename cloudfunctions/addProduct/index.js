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

  const p = payload.product || payload
  const { name, price, category, specs, avatar } = p
  if (!name || typeof price !== 'number') {
    return { code: 400, message: 'name and price(number) required' }
  }
  if (!VALID_CATEGORY.includes(category)) {
    return { code: 400, message: 'invalid category: ' + category }
  }

  try {
    const db = cloud.database()
    const existing = await db.collection('products').orderBy('id', 'desc').limit(1).get()
    const maxId = (existing.data[0] && existing.data[0].id) || 0
    const newId = maxId + 1

    const normalizedSpecs = (specs && typeof specs === 'object' && !Array.isArray(specs)) ? specs : {}

    const res = await db.collection('products').add({
      data: {
        id: newId,
        name, price, category,
        specs: normalizedSpecs,
        avatar: avatar || '',
        sales: 0,
        rating: 5.0,
        deleted: false,
        _createdAt: Date.now()
      }
    })
    return { code: 0, _id: res._id, id: newId }
  } catch (err) {
    return { code: 500, message: String(err) }
  }
}
