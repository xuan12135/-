const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const VALID_STATUS = ['pending', 'making', 'done']

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

  const { _id, status } = payload
  if (!_id) {
    return { code: 400, message: '_id required' }
  }
  if (!VALID_STATUS.includes(status)) {
    return { code: 400, message: 'invalid status: ' + status }
  }

  try {
    const res = await cloud.database().collection('orders').doc(_id).update({
      data: { status, _updatedAt: Date.now() }
    })
    return { code: 0, updated: res.stats.updated }
  } catch (err) {
    return { code: 500, message: String(err) }
  }
}
