import nodemailer from 'nodemailer'
import smtpTransport from 'nodemailer-smtp-transport'
import { htmlToText } from 'nodemailer-html-to-text'

import getMailData from './message-templates'
import config, { smtpOptions } from '../../config'
import { techLogger, appLogger } from '../../util'

export const sendMail = async (to, { subject, content: html }) => {
  const transporter = nodemailer.createTransport(smtpTransport(smtpOptions))

  transporter.use('compile', htmlToText())

  const mailOptions = {
    from: config.mailFrom,
    to,
    subject,
    html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    appLogger.info({
      section: 'send-mail',
      to,
      subject,
      description: 'Mail sent: ' + info.response,
      info,
    })
  } catch (error) {
    techLogger.error({
      section: 'send-mail',
      to,
      subject,
      description: error.message,
      error,
    })
    throw error
  } finally {
    transporter.close()
  }
}

export const sendMailToAccount = async (candidat, flag) => {
  const message = await getMailData(candidat, flag)
  return sendMail(candidat.email, message)
}

export const sendMagicLink = async (candidat, token) => {
  const flag = 'CHECK_OK'
  const authUrl = `${config.PUBLIC_URL}${config.CANDIDAT_ROUTE}`

  const url = `${authUrl}?token=${encodeURIComponent(token)}`

  const message = await getMailData(candidat, flag, url)
  return sendMail(candidat.email, message)
}
