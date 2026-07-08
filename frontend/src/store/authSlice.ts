import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { authApi, type LoginPayload, type RegisterPayload } from '../api/authApi'
import { usersApi } from '../api/usersApi'
import type { UserProfile, UserSummary } from '../types'
import { storage } from '../utils/storage'
import { getErrorMessage } from '../utils/format'

interface AuthState {
  user: UserSummary | null
  profile: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: storage.getUser(),
  profile: null,
  isAuthenticated: !!storage.getAccessToken(),
  loading: false,
  error: null,
}

export const login = createAsyncThunk('auth/login', async (payload: LoginPayload, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(payload)
    storage.setAuth(data.accessToken, data.refreshToken, data.user)
    return data.user
  } catch (e) {
    return rejectWithValue(getErrorMessage(e, 'Неверный email или пароль'))
  }
})

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      await authApi.register(payload)
      return null
    } catch (e) {
      return rejectWithValue(getErrorMessage(e, 'Ошибка регистрации'))
    }
  },
)

export const loginWithGoogle = createAsyncThunk('auth/googleLogin', async (idToken: string, { rejectWithValue }) => {
  try {
    const { data } = await authApi.externalLogin('google', { idToken })
    storage.setAuth(data.accessToken, data.refreshToken, data.user)
    return data.user
  } catch (e) {
    return rejectWithValue(getErrorMessage(e, 'Не удалось войти через Google'))
  }
})

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await usersApi.getMe()
    const accessToken = storage.getAccessToken()
    const refreshToken = storage.getRefreshToken()
    if (accessToken && refreshToken) {
      storage.setAuth(accessToken, refreshToken, {
        id: data.id,
        email: data.email,
        username: data.username,
        virtualBalance: data.virtualBalance,
        roles: data.roles,
      })
    }
    return data
  } catch (e) {
    return rejectWithValue(getErrorMessage(e))
  }
})

export const becomeSeller = createAsyncThunk('auth/becomeSeller', async (_, { rejectWithValue, dispatch }) => {
  try {
    await usersApi.becomeSeller()
    await dispatch(fetchProfile())
  } catch (e) {
    return rejectWithValue(getErrorMessage(e))
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      const refresh = storage.getRefreshToken()
      if (refresh) authApi.logout(refresh).catch(() => undefined)
      storage.clearAuth()
      state.user = null
      state.profile = null
      state.isAuthenticated = false
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action: PayloadAction<UserSummary>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profile = action.payload
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          username: action.payload.username,
          virtualBalance: action.payload.virtualBalance,
          roles: action.payload.roles,
        }
      })
  },
})

export const { logout, clearError, setUser } = authSlice.actions
export default authSlice.reducer

export const selectIsSeller = (state: { auth: AuthState }) =>
  state.auth.user?.roles.some((r) => ['Seller', 'Moderator', 'Admin'].includes(r)) ?? false

export const selectIsAdmin = (state: { auth: AuthState }) =>
  state.auth.user?.roles.includes('Admin') ?? false

export const selectIsModerator = (state: { auth: AuthState }) =>
  state.auth.user?.roles.some((r) => ['Moderator', 'Admin'].includes(r)) ?? false
