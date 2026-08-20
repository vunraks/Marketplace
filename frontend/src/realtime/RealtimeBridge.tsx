import { useEffect } from 'react'
import { useAppSelector } from '../store/hooks'
import { startNotificationHub, stopNotificationHub } from './notificationHub'

/** Keeps the notifications SignalR hub connected while the user is authenticated. */
export function RealtimeBridge() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const profile = useAppSelector((s) => s.auth.profile)
  const isRestricted = Boolean(profile?.isBlocked && (!profile.blockedUntil || new Date(profile.blockedUntil) > new Date()))

  useEffect(() => {
    if (!isAuthenticated || !profile || isRestricted) {
      void stopNotificationHub()
      return
    }

    void startNotificationHub()

    return () => {
      void stopNotificationHub()
    }
  }, [isAuthenticated, isRestricted, profile])

  return null
}
