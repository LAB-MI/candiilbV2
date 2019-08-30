import jwt from 'jsonwebtoken'

import { appLogger } from '../../util'
import config from '../../config'
import {
  findActiveCandidatByEmail,
  isCandidatExisting,
} from '../../models/candidat'
import { sendMagicLink } from '../business'
import { sendErrorResponse } from '../../util/send-error-response'

export const postMagicLink = async (req, res) => {
  const { email } = req.body
  const loggerInfo = {
    section: 'candidat-auth',
    action: 'post-magic-link',
    email,
  }
  appLogger.info({
    ...loggerInfo,
    description: `Trying to find candidat with email: ${email}`,
  })

  try {
    const candidat = await findActiveCandidatByEmail(email)

    if (!candidat) {
      const message = 'Utilisateur non reconnu'
      const status = 404
      return sendErrorResponse(res, { loggerInfo, message, status })
    }

    if (!candidat.isValidatedByAurige) {
      const message = 'Utilisateur en attente de validation.'
      const status = 401
      return sendErrorResponse(res, { loggerInfo, message, status })
    }

    const token = jwt.sign(
      {
        id: candidat._id,
      },
      config.secret,
      {
        expiresIn: config.candidatTokenExpiration,
      }
    )

    try {
      appLogger.info({
        ...loggerInfo,
        description: `Trying to send magic-link to ${email}`,
      })
      const response = await sendMagicLink(candidat, token)
      res.status(200).json({
        message:
          'Veuillez consulter votre boîte mail pour vous connecter (pensez à vérifier dans vos courriers indésirables).',
        response,
        success: true,
      })
    } catch (error) {
      appLogger.error({
        error,
        ...loggerInfo,
        description: `Impossible d'envoyer le mail à ${email}`,
      })

      const message =
        "Un problème est survenu lors de l'envoi du lien de connexion. Nous vous prions de réessayer plus tard."
      return res.status(500).json({
        message,
        success: false,
      })
    }
  } catch (error) {
    appLogger.error({
      ...loggerInfo,
      action: `findActiveCandidatByEmail('${email}')`,
      description: error.message,
      error,
    })
    res.status(500).json({
      message:
        "Un problème est survenu. Nous vous prions de réessayer plus tard. L'administrateur a été prévenu",
      success: false,
    })
  }
}

export const checkCandidat = async (req, res) => {
  const { userId: candidatId } = req
  const loggerInfo = {
    section: 'candidat-auth',
    action: 'CHECK-EXIST',
    candidatId,
  }

  appLogger.debug({
    ...loggerInfo,
    description: "Vérification de l'existence du candidat",
  })

  try {
    const isExisting = await isCandidatExisting(candidatId)
    if (!isExisting) {
      const status = 401
      return sendErrorResponse(res, {
        loggerInfo,
        description: 'Candidat non trouvé',
        status,
        otherData: { auth: false, isTokenValid: false },
      })
    }
    appLogger.info({ ...loggerInfo, description: 'Le candidat existe bien' })
    return res.json({ auth: true })
  } catch (error) {
    appLogger.error({
      ...loggerInfo,
      description: error.message,
      error,
    })
    return res.status(error.status || 500).json({
      auth: false,
      isTokenValid: false,
      message: 'Token invalide',
      success: false,
    })
  }
}
