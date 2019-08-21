import { checkToken, appLogger } from '../../util'
import { INVALID_TOKEN_PLEASE_RECONNECT } from '../message.constants.js'

export function verifyToken (req, res, next) {
  const authHeader = req.headers.authorization
  const tokenInAuthHeader = authHeader && authHeader.replace('Bearer ', '')
  const token = tokenInAuthHeader || req.query.token

  appLogger.debug({
    section: 'admin-verify-token',
    action: 'INFO',
    token,
  })

  if (!token) {
    appLogger.error({
      section: 'admin-verify-token',
      action: 'ABSENT',
      description: 'Token absent',
    })
    return res.status(401).send({
      message: 'Token absent',
      success: false,
    })
  }

  try {
    const decoded = checkToken(token)
    const { id, level, departements } = decoded
    req.userId = id
    req.userLevel = level
    req.departements = departements
    next()
  } catch (error) {
    appLogger.error({
      section: 'admin-verify-token',
      action: 'CHECK',
      error,
    })
    return res.status(401).send({
      isTokenValid: false,
      message: INVALID_TOKEN_PLEASE_RECONNECT,
      success: false,
      errorMessage: error.message,
      error,
    })
  }
}
