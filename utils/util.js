const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const generateOrderId = () => {
  return Math.floor(1000 + Math.random() * 9000)
}

const statusText = (status) => {
  const map = {
    pending: '待制作',
    making: '制作中',
    done: '已完成'
  }
  return map[status] || status
}

const statusColor = (status) => {
  const map = {
    pending: '#FF6B8B',
    making: '#FFA500',
    done: '#4CAF50'
  }
  return map[status] || '#999'
}

module.exports = {
  formatTime,
  formatNumber,
  generateOrderId,
  statusText,
  statusColor
}
