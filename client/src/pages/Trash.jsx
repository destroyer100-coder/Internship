import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Archive from './Archive'

export default function Trash() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/archive?tab=trash', { replace: true })
  }, [navigate])

  return <Archive />
}
