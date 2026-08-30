'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [walletToken, setWalletToken] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (!savedUser) return

    try {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)

      const savedWalletToken = localStorage.getItem('wp_token')
      if (savedWalletToken) {
        setWalletToken(savedWalletToken)
      } else if (parsedUser?.id) {
        createWalletSession(parsedUser.id)
      }
    } catch (error) {
      console.error('Invalid saved user:', error)
      localStorage.removeItem('currentUser')
      localStorage.removeItem('wp_token')
    }
  }, [])

  async function createWalletSession(userId) {
    try {
      const res = await fetch('/api/wallet/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })

      const data = await res.json()
      if (!res.ok || !data?.token) return null

      localStorage.setItem('wp_token', data.token)
      setWalletToken(data.token)
      return data.token
    } catch (error) {
      console.error('Wallet session error:', error)
      return null
    }
  }

  const loginUser = (userData, token = null) => {
    setUser(userData)
    localStorage.setItem('currentUser', JSON.stringify(userData))

    if (token) {
      localStorage.setItem('wp_token', token)
      setWalletToken(token)
    } else if (userData?.id) {
      createWalletSession(userData.id)
    }
  }

  const logoutUser = () => {
    setUser(null)
    setWalletToken(null)
    localStorage.removeItem('currentUser')
    localStorage.removeItem('wp_token')
  }

  return (
    <UserContext.Provider value={{ user, walletToken, loginUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
