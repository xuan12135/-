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

  const isAdmin = payload.token && payload.token === process.env.ADMIN_TOKEN
  const includeDeleted = isAdmin && payload.includeDeleted

  try {
    const db = cloud.database()
    const _ = db.command
    let q = db.collection('products')
    if (!includeDeleted) {
      q = q.where({ deleted: _.neq(true) })
    }
    const res = await q.orderBy('id', 'asc').limit(100).get()
    const data = res.data

    const fileIds = data.map(p => p.avatar).filter(a => typeof a === 'string' && a.startsWith('cloud://'))
    if (fileIds.length > 0) {
      try {
        const urlRes = await cloud.getTempFileURL({ fileList: fileIds })
        const urlMap = {}
        urlRes.fileList.forEach(f => {
          if (f.status === 0) urlMap[f.fileID] = f.tempFileURL
        })
        data.forEach(p => {
          if (p.avatar && urlMap[p.avatar]) p.avatarUrl = urlMap[p.avatar]
        })
      } catch (e) {}
    }

    return { code: 0, total: data.length, data }
  } catch (err) {
    return { code: 500, message: String(err) }
  }
}
