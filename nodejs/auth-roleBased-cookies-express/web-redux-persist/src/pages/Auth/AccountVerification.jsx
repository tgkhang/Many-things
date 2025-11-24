import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import LoadingSpinner from '~/components/Loading/LoadingSpinner'
import { verifyUserAccountAPI } from '~/apis'

function AccountVerification() {
  // Get the query parameters from the URL
  let [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (email && token) {
      verifyUserAccountAPI({ email, token }).then(() => {
        setVerified(true)
      })
    }
  }, [email, token])

  if (!email || !token) {
    return <Navigate to='/404' />
  }

  if (!verified) {
    return <LoadingSpinner caption='Verifying your account...' />
  }

  return <Navigate to={`/login?verifiedEmail=${email}`} />
}

export default AccountVerification
