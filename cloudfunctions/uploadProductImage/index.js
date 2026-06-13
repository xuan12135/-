const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const MAX_BYTES = 1.5 * 1024 * 1024  // 1.5MB 上限(base64 后)

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

  const { base64, filename, contentType } = payload
  if (!base64 || typeof base64 !== 'string') {
    return { code: 400, message: 'base64 required' }
  }

  let buffer
  try {
    buffer = Buffer.from(base64, 'base64')
  } catch (e) {
    return { code: 400, message: 'invalid base64' }
  }
  if (buffer.length > MAX_BYTES) {
    return { code: 400, message: 'image too large, max 1.5MB, got ' + Math.round(buffer.length / 1024) + 'KB' }
  }

  const ext = contentTypeToExt(contentType)
  const ts = Date.now()
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  const cloudPath = `products/${ts}_${rand}.${ext}`

  try {
    const res = await cloud.uploadFile({
      cloudPath,
      fileContent: buffer
    })
    return { code: 0, fileId: res.fileID, cloudPath }
  } catch (err) {
    return { code: 500, message: String(err) }
  }
}

function contentTypeToExt(ct) {
  if (!ct) return 'jpg'
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif')) return 'gif'
  return 'jpg'
}
