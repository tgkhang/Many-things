# Redux vs Context API for Authentication

A comparison of two state management approaches for React authentication.

## Overview

| Aspect | Redux + Redux Persist | Context + Hooks |
|--------|----------------------|-----------------|
| Bundle Size | ~15-20KB (gzipped) | 0 (built-in React) |
| Dependencies | 3 packages | 0 packages |
| Boilerplate | More | Less |
| Learning Curve | Steeper | Easier |
| DevTools | Redux DevTools | React DevTools |
| Best For | Complex global state | Simple/medium state |

---

## File Structure Comparison

### Redux Approach

```
src/
├── redux/
│   ├── store.js              # Store configuration + persist
│   └── user/
│       └── userSlice.js      # Reducers, actions, selectors
├── main.jsx                  # Provider + PersistGate wrapping
└── components/
    └── Example.jsx           # useSelector, useDispatch
```

### Context + Hooks Approach

```
src/
├── contexts/
│   └── AuthContext.jsx       # Context + Provider + state logic
├── hooks/
│   └── useAuth.js            # Custom hook for easy access
├── guards/
│   ├── AuthGuard.jsx         # Protected route wrapper
│   └── GuestGuard.jsx        # Guest-only route wrapper
├── main.jsx                  # AuthProvider wrapping
└── components/
    └── Example.jsx           # useAuth hook
```

---

## Code Comparison

### 1. Setup / Provider

#### Redux

```jsx
// store.js
import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'],
}

export const store = configureStore({
  reducer: persistReducer(persistConfig, rootReducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

// main.jsx
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store } from './redux/store'
import { persistStore } from 'redux-persist'

const persistor = persistStore(store)

<Provider store={store}>
  <PersistGate loading={null} persistor={persistor}>
    <App />
  </PersistGate>
</Provider>
```

#### Context

```jsx
// AuthContext.jsx
import { createContext, useState, useEffect, useMemo, useCallback } from 'react'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('auth_user')
    if (stored) setUser(JSON.parse(stored))
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      user
        ? localStorage.setItem('auth_user', JSON.stringify(user))
        : localStorage.removeItem('auth_user')
    }
  }, [user, isInitialized])

  const login = useCallback(async (email, password) => {
    const response = await api.login({ email, password })
    setUser(response.data)
    return response.data
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user, isAuthenticated: !!user, isInitialized, login, logout
  }), [user, isInitialized, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// main.jsx
import { AuthProvider } from './contexts/AuthContext'

<AuthProvider>
  <App />
</AuthProvider>
```

---

### 2. State Access in Components

#### Redux

```jsx
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, logoutUserAPI } from '~/redux/user/userSlice'

function Profile() {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  const handleLogout = () => {
    dispatch(logoutUserAPI(true))
  }

  return <div>Welcome, {currentUser?.displayName}</div>
}
```

#### Context

```jsx
import { useAuth } from '~/hooks/useAuth'

function Profile() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout(true)
  }

  return <div>Welcome, {user?.displayName}</div>
}
```

---

### 3. Async Actions (Login Example)

#### Redux (with createAsyncThunk)

```jsx
// userSlice.js
export const loginUserAPI = createAsyncThunk(
  'user/loginUserAPI',
  async (data) => {
    const response = await axios.post('/v1/users/login', data)
    return response.data
  }
)

export const userSlice = createSlice({
  name: 'user',
  initialState: { currentUser: null },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loginUserAPI.fulfilled, (state, action) => {
      state.currentUser = action.payload
    })
  },
})

// Component
const onSubmit = async (data) => {
  toast.promise(dispatch(loginUserAPI(data)), { pending: 'Logging in...' })
    .then((response) => {
      if (!response.error) navigate('/')
    })
}
```

#### Context

```jsx
// AuthContext.jsx
const login = useCallback(async (email, password) => {
  const response = await axios.post('/v1/users/login', { email, password })
  setUser(response.data)
  return response.data
}, [])

// Component
const onSubmit = async (data) => {
  toast.promise(login(data.email, data.password), { pending: 'Logging in...' })
    .then(() => navigate('/'))
    .catch(() => { /* handled by interceptor */ })
}
```

---

### 4. Route Protection

#### Redux

```jsx
// App.jsx
import { useSelector } from 'react-redux'
import { selectCurrentUser } from './redux/user/userSlice'

const ProtectedRoute = ({ user }) => {
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function App() {
  const currentUser = useSelector(selectCurrentUser)

  return (
    <Routes>
      <Route element={<ProtectedRoute user={currentUser} />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
```

#### Context (with Guards)

```jsx
// AuthGuard.jsx
import { useAuth } from '~/hooks/useAuth'

function AuthGuard() {
  const { isAuthenticated, isInitialized } = useAuth()

  if (!isInitialized) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

// App.jsx
function App() {
  return (
    <Routes>
      <Route element={<AuthGuard />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  )
}
```

---

## Dependencies

### Redux

```json
{
  "@reduxjs/toolkit": "^2.9.2",
  "react-redux": "^9.2.0",
  "redux-persist": "^6.0.0"
}
```

### Context

```json
{
  // No additional dependencies required
}
```

---

## Pros and Cons

### Redux + Redux Toolkit

**Pros:**
- Powerful DevTools for debugging
- Time-travel debugging
- Middleware support (thunks, sagas)
- Predictable state updates
- Great for complex state with many slices
- Built-in state persistence with redux-persist
- Large ecosystem and community

**Cons:**
- More boilerplate code
- Additional dependencies (~15-20KB)
- Steeper learning curve
- Overkill for simple state
- Need to inject store for non-component files (axios interceptors)

### Context + Hooks

**Pros:**
- No additional dependencies
- Less boilerplate
- Easier to understand
- Built into React
- Direct function calls (no dispatch)
- Simpler mental model
- Easier integration with axios interceptors

**Cons:**
- No built-in DevTools
- Re-renders all consumers on state change
- Manual persistence implementation
- Less suitable for complex state
- No middleware pattern

---

## When to Use Which?

### Use Redux When:
- Your app has complex global state
- Multiple unrelated state slices
- You need middleware (logging, async flows)
- Team is familiar with Redux
- You need powerful debugging tools
- State is updated from many places

### Use Context When:
- Simple to medium complexity state
- Authentication state only
- Small team or solo project
- Want minimal dependencies
- Learning React
- State updates are straightforward

---

## Migration Checklist (Redux to Context)

1. [ ] Create `AuthContext.jsx` with state and methods
2. [ ] Create `useAuth.js` custom hook
3. [ ] Create route guards (`AuthGuard`, `GuestGuard`)
4. [ ] Update `main.jsx` - replace Provider/PersistGate with AuthProvider
5. [ ] Update `App.jsx` - use guards instead of inline protection
6. [ ] Update components - replace `useSelector`/`useDispatch` with `useAuth`
7. [ ] Update axios interceptors - remove store injection, use direct methods
8. [ ] Delete `redux/` folder
9. [ ] Remove Redux dependencies from `package.json`
10. [ ] Run `npm install` to update lock file

---

## Conclusion

For authentication-only state management, **Context + Hooks** is often the simpler and more lightweight choice. It reduces bundle size, eliminates boilerplate, and is easier to maintain.

Redux remains the better choice for applications with complex, interconnected state that benefits from its powerful debugging tools and middleware ecosystem.
