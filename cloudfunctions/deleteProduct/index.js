const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

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

  const { _id, deleted } = payload
  if (!_id) return { code: 400, message: '_id required' }
  const newDeleted = deleted !== false

  try {
    const res = await cloud.database().collection('products').doc(_id).update({
      data: { deleted: newDeleted, _updatedAt: Date.now() }
    })
    return { code: 0, updated: res.stats.updated, deleted: newDeleted }
  } catch (err) {
    return { code: 500, message: String(err) }
  }
}
