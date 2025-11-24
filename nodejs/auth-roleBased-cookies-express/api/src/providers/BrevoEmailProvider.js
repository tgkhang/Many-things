// third party imports (jwt, mail, s3,...)

import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo'
import { env } from '~/config/environment'

let emailAPI = new TransactionalEmailsApi()
emailAPI.authentications.apiKey.apiKey = env.BREVO_API_KEY

const sendEmail = async (to, subject, textContent, htmlContent) => {
  let message = new SendSmtpEmail()
  message.sender = {
    email: env.ADMIN_EMAIL_ADDRESS,
    name: env.ADMIN_EMAIL_NAME,
  }
  message.to = [{ email: to }]
  message.subject = subject
  message.textContent = textContent
  message.htmlContent = htmlContent

  return emailAPI.sendTransacEmail(message)
}

export const BrevoEmailProvider = {
  sendEmail,
}
