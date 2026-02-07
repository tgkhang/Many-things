import { Router } from 'express'

import userRoutes from '~/modules/users/user.routes'

const router = Router()

router.use('/users', userRoutes) // /api/users

export default router
