import { useEffect } from 'react'
import { useAppSelector } from '../store/hooks'
import { startNotificationHub, stopNotificationHub } from './notificationHub'

/** Keeps the notifications SignalR hub connected while the user is authenticated. */
export function RealtimeBridge() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      void stopNotificationHub()
      return
    }

    void startNotificationHub()

    return () => {
      void stopNotificationHub()
    }
  }, [isAuthenticated])

  return null
}
