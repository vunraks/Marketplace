import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import { usersApi } from '../api/usersApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { AdminUser } from '../types'
import { formatDate, getErrorMessage } from '../utils/format'

const managedRoles = ['User', 'Seller', 'Moderator']

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return users
    return users.filter((user) =>
      user.email.toLowerCase().includes(value) ||
      user.username.toLowerCase().includes(value) ||
      user.roles.some((role) => role.toLowerCase().includes(value)),
    )
  }, [query, users])

  const load = () => {
    setLoading(true)
    setError('')
    usersApi.getAdminUsers()
      .then((r) => setUsers(r.data))
      .catch((e) => setError(getErrorMessage(e, 'Не удалось загрузить пользователей')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const toggleRole = async (user: AdminUser, role: 'Seller' | 'Moderator', enabled: boolean) => {
    setProcessingId(user.id)
    setError('')

    const nextRoles = new Set(user.roles.filter((item) => managedRoles.includes(item)))
    nextRoles.add('User')
    if (enabled) nextRoles.add(role)
    else nextRoles.delete(role)

    try {
      const { data } = await usersApi.updateAdminUserRoles(user.id, Array.from(nextRoles))
      setUsers((current) => current.map((item) => item.id === data.id ? data : item))
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось обновить роли пользователя'))
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <AdminPanelSettingsIcon color="primary" />
            <Typography variant="h4" fontWeight={800}>Пользователи</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Админ управляет ролями, модераторы получают доступ только к проверке объявлений.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField size="small" placeholder="Поиск" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Chip label={filteredUsers.length} color="primary" variant="outlined" />
          <Button variant="outlined" onClick={load}>Обновить</Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Пользователь</TableCell>
              <TableCell>Роли</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Баланс</TableCell>
              <TableCell align="right">Объявления</TableCell>
              <TableCell>Последний вход</TableCell>
              <TableCell align="right">Права</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => {
              const isAdmin = user.roles.includes('Admin')
              const disabled = processingId === user.id || isAdmin
              return (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography fontWeight={800}>{user.username}</Typography>
                    <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                      {user.roles.map((role) => (
                        <Chip key={role} label={role} size="small" color={role === 'Admin' ? 'error' : role === 'Moderator' ? 'warning' : 'default'} variant="outlined" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                      <Chip label={user.isActive ? 'Активен' : 'Отключён'} size="small" color={user.isActive ? 'success' : 'default'} />
                      {user.isBlocked && <Chip label="Заблокирован" size="small" color="error" />}
                      {user.isEmailVerified && <Chip label="Email OK" size="small" variant="outlined" />}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{user.virtualBalance.toLocaleString('ru-RU')} VT</TableCell>
                  <TableCell align="right">{user.listingsCount}</TableCell>
                  <TableCell>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Не входил'}</TableCell>
                  <TableCell align="right">
                    <Stack spacing={0.5} alignItems="flex-end">
                      <FormControlLabel
                        control={<Switch checked={user.roles.includes('Moderator')} disabled={disabled} onChange={(e) => toggleRole(user, 'Moderator', e.target.checked)} />}
                        label={<Stack direction="row" spacing={0.5} alignItems="center"><ShieldOutlinedIcon fontSize="small" /> <span>Модератор</span></Stack>}
                      />
                      <FormControlLabel
                        control={<Switch checked={user.roles.includes('Seller')} disabled={disabled} onChange={(e) => toggleRole(user, 'Seller', e.target.checked)} />}
                        label="Продавец"
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
