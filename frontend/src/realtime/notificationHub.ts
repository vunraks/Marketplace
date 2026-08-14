import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import { notificationsHubUrl } from '../config/api'
import { storage } from '../utils/storage'
import type { Conversation, NotificationItem } from '../types'

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
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
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

export async function startNotificationHub() {
  if (!storage.getAccessToken()) return

  if (!connection) connection = createConnection()

  if (connection.state === HubConnectionState.Connected) return
  if (startPromise) return startPromise

  startPromise = connection
    .start()
    .catch((error) => {
      console.warn('SignalR connection failed', error)
      throw error
    })
    .finally(() => {
      startPromise = null
    })

  return startPromise
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
