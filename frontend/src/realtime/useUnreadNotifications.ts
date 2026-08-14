import { useEffect, useState } from 'react'
import { commerceApi } from '../api/commerceApi'
import { useAppSelector } from '../store/hooks'
import { onUnreadCountChanged } from './notificationHub'

export function useUnreadNotifications() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }

    let cancelled = false

    commerceApi.getNotifications()
      .then((response) => {
        if (!cancelled) setUnreadCount(response.data.unreadCount)
      })
      .catch(() => undefined)

    const unsubscribe = onUnreadCountChanged((count) => {
      if (!cancelled) setUnreadCount(count)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [isAuthenticated])

  return unreadCount
}
