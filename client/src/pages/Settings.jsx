import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Profile from './Profile'

export default function Settings() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/profile', { replace: true })
  }, [navigate])

  return <Profile />
}
