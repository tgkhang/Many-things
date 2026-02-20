User navigates to /admin
    ↓
App2 gets currentUser from Redux
    ↓
currentUser stored in: localStorage → Redux → React Component
    ↓
ProtectedRoute checks: currentUser === null?
    ↓
YES → Navigate to /login
NO  → Show AdminPanel