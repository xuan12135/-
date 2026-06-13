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
  if (!token) {
    return { code: 500, message: 'ADMIN_TOKEN env var not configured' }
  }
  if (payload.token !== token) {
    return { code: 401, message: 'invalid token' }
  }

  try {
    const limit = Math.min(Number(payload.limit) || 50, 100)
    const db = cloud.database()
    const res = await db.collection('orders')
      .orderBy('_reportedAt', 'desc')
      .limit(limit)
      .get()
    return { code: 0, total: res.data.length, data: res.data }
  } catch (err) {
    return { code: 500, message: String(err) }
  }
}
