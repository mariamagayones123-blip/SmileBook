import { createContext, useContext } from 'react'

// Shared auth context. Kept out of App.jsx so App.jsx only exports a component (React Fast Refresh).
export const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)
