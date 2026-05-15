export function formatTimeAgo(date) {
  if (!date) return '-'
  
  const now = new Date()
  const targetDate = new Date(date)
  const diffMs = now.getTime() - targetDate.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return '刚刚'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  }

  if (diffHours < 24) {
    return `${diffHours}小时前`
  }

  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth()
  const nowDay = now.getDate()
  const targetYear = targetDate.getFullYear()
  const targetMonth = targetDate.getMonth()
  const targetDay = targetDate.getDate()

  if (targetYear === nowYear && targetMonth === nowMonth && targetDay === nowDay - 1) {
    const hours = targetDate.getHours().toString().padStart(2, '0')
    const minutes = targetDate.getMinutes().toString().padStart(2, '0')
    return `昨天 ${hours}:${minutes}`
  }

  if (targetYear === nowYear) {
    const month = (targetMonth + 1).toString().padStart(2, '0')
    const day = targetDay.toString().padStart(2, '0')
    const hours = targetDate.getHours().toString().padStart(2, '0')
    const minutes = targetDate.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }

  const year = targetYear.toString()
  const month = (targetMonth + 1).toString().padStart(2, '0')
  const day = targetDay.toString().padStart(2, '0')
  const hours = targetDate.getHours().toString().padStart(2, '0')
  const minutes = targetDate.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

export function formatDateTime(date) {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.toLocaleDateString('zh-CN')} ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
}

export function formatTime(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
