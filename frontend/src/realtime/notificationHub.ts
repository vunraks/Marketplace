import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  type IRetryPolicy,
  LogLevel,
  type RetryContext,
} from '@microsoft/signalr'
import axios from 'axios'
import { notificationsHubUrl } from '../config/api'
import { apiBaseUrl } from '../config/api'
import { AUTH_EXPIRED_EVENT, storage } from '../utils/storage'
import type { AuthResponse, Conversation, NotificationItem } from '../types'

type NotificationHandler = (notification: NotificationItem, unreadCount: number) => void
type UnreadHandler = (unreadCount: number) => void
type ConversationHandler = (conversation: Conversation) => void
type ModerationHandler = () => void

const notificationHandlers = new Set<NotificationHandler>()
const unreadHandlers = new Set<UnreadHandler>()
const conversationHandlers = new Set<ConversationHandler>()
const moderationHandlers = new Set<ModerationHandler>()

let connection: HubConnection | null = null
let startPromise: Promise<void> | null = null
let refreshPromise: Promise<string | null> | null = null

const reconnectPolicy: IRetryPolicy = {
  nextRetryDelayInMilliseconds: (context: RetryContext) => {
    if (!storage.getAccessToken()) return null

    return [0, 2000, 5000, 10000, 30000][context.previousRetryCount] ?? null
  },
}

function emitNotification(notification: NotificationItem, unreadCount: number) {
  notificationHandlers.forEach((handler) => handler(notification, unreadCount))
}

function emitUnread(unreadCount: number) {
  unreadHandlers.forEach((handler) => handler(unreadCount))
}

function emitConversation(conversation: Conversation) {
  conversationHandlers.forEach((handler) => handler(conversation))
}

function emitModeration() {
  moderationHandlers.forEach((handler) => handler())
}

function createConnection() {
  const hub = new HubConnectionBuilder()
    .withUrl(notificationsHubUrl, {
      accessTokenFactory: () => storage.getAccessToken() ?? '',
    })
    .withAutomaticReconnect(reconnectPolicy)
    .configureLogging(LogLevel.Warning)
    .build()

  hub.on('NotificationReceived', (notification: NotificationItem, unreadCount: number) => {
    emitNotification(notification, unreadCount)
    emitUnread(unreadCount)
  })

  hub.on('UnreadCountChanged', (unreadCount: number) => {
    emitUnread(unreadCount)
  })

  hub.on('ConversationUpdated', (conversation: Conversation) => {
    emitConversation(conversation)
  })

  hub.on('ModerationQueueChanged', () => {
    emitModeration()
  })

  return hub
}

function isTokenExpiringSoon(token: string) {
  try {
    const [, payload] = token.split('.')
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    if (!decoded.exp) return true

    return decoded.exp * 1000 - Date.now() < 30_000
  } catch {
    return true
  }
}

async function refreshAccessToken() {
  const refreshToken = storage.getRefreshToken()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = axios
      .post<AuthResponse>(`${apiBaseUrl}/auth/refresh`, { refreshToken })
      .then((response) => {
        storage.setAuth(response.data.accessToken, response.data.refreshToken, response.data.user)
        return response.data.accessToken
      })
      .catch(() => {
        storage.clearAuth(true)
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function ensureAccessToken() {
  const token = storage.getAccessToken()
  if (!token) return refreshAccessToken()
  if (!isTokenExpiringSoon(token)) return token

  return refreshAccessToken()
}

const isUnauthorizedHubError = (error: unknown) =>
  String(error).includes('Status code \'401\'') ||
  String(error).includes('Status code "401"') ||
  String(error).includes('Status code: 401')

export async function startNotificationHub() {
  const token = await ensureAccessToken()
  if (!token) return

  if (!connection) connection = createConnection()

  if (connection.state === HubConnectionState.Connected) return
  if (startPromise) return startPromise

  startPromise = connection
    .start()
    .catch(async (error) => {
      if (isUnauthorizedHubError(error)) {
        const refreshedToken = await refreshAccessToken()
        if (!refreshedToken) {
          await stopNotificationHub()
          return
        }

        await stopNotificationHub()
        connection = createConnection()
        await connection.start()
        return
      }

      console.warn('SignalR connection failed', error)
    })
    .finally(() => {
      startPromise = null
    })

  return startPromise
}

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_EXPIRED_EVENT, () => {
    void stopNotificationHub()
  })
}

export async function stopNotificationHub() {
  startPromise = null
  if (!connection) return

  const current = connection
  connection = null

  try {
    await current.stop()
  } catch {
    // ignore disconnect errors during logout
  }
}

export function onNotificationReceived(handler: NotificationHandler) {
  notificationHandlers.add(handler)
  return () => {
    notificationHandlers.delete(handler)
  }
}

export function onUnreadCountChanged(handler: UnreadHandler) {
  unreadHandlers.add(handler)
  return () => {
    unreadHandlers.delete(handler)
  }
}

export function onConversationUpdated(handler: ConversationHandler) {
  conversationHandlers.add(handler)
  return () => {
    conversationHandlers.delete(handler)
  }
}

export function onModerationQueueChanged(handler: ModerationHandler) {
  moderationHandlers.add(handler)
  return () => {
    moderationHandlers.delete(handler)
  }
}
