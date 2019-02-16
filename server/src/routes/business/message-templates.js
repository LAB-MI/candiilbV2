import moment from 'moment'

import {
  CANDIDAT_NOK,
  CANDIDAT_NOK_NOM,
  EPREUVE_PRATIQUE_OK,
  EPREUVE_ETG_KO,
  INSCRIPTION_OK,
  INSCRIPTION_VALID,
  INSCRIPTION_UPDATE,
  AURIGE_OK,
  MAIL_CONVOCATION,
  ANNULATION_CONVOCATION,
  VALIDATION_EMAIL,
} from '../../util'
import config from '../../config'
import { findAllCentres } from '../../models/centre'

const getCentres = async () => findAllCentres()

const getHtmlBody = content => `<!DOCTYPE html>
<html>
  <head>
  <title>Email de Candilib</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta content="width=device-width">
  <style type="text/css">
  /* Fonts and Content */
  body, td { font-family: Roboto,'Helvetica Neue', Arial, Helvetica, Geneva, sans-serif; font-size:14px; color:rgba(0,0,0, 0.54); }
  body { background-color: #ffffff; margin: 0; padding: 0; -webkit-text-size-adjust:none; -ms-text-size-adjust:none; }
  h2{ color:black; font-size:3em; }

  @media only screen and (max-width: 480px) {

      table[class=w275], td[class=w275], img[class=w275] { width:135px !important; vertical-align:"middle"; }
      table[class=w30], td[class=w30], img[class=w30] { width:10px !important; vertical-align:"middle"; }
      table[class=w580], td[class=w580], img[class=w580] { width:280px !important; vertical-align:"middle"; }
      table[class=w640], td[class=w640], img[class=w640] { width:300px !important; vertical-align:"middle"; }
      img{ height:auto;}
      /*illisible, on passe donc sur 3 lignes */
      table[class=w180], td[class=w180], img[class=w180] {
          width:280px !important;
          display:block;
      }
      td[class=w20]{ display:none; }
  }

  </style>

  </head>
  <body style="margin:20px; padding:0px; -webkit-text-size-adjust:none;">

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:rgb(255, 255, 255)" >
          <tbody>
              <tr>
                  <td align="center" bgcolor="#FFFFFF">
                      <table  cellpadding="0" cellspacing="0" border="0">
                          <tbody>
                              <tr>
                                  <td class="w640"  width="640" height="10"></td>
                              </tr>
                              <tr>
                                  <td class="w640"  width="640" height="10"></td>
                              </tr>
                              <!-- entete -->
                              <tr class="pagetoplogo">
                                  <td class="w640"  width="640">
                                      <table  class="w640"  width="640" cellpadding="0" cellspacing="0" border="0">
                                          <tbody>
                                              <tr>
                                                  <td class="w30"  width="30"></td>
                                                  <td  class="w580"  width="580" valign="middle" align="left">
                                                  </td>
                                                  <td class="w30"  width="30"></td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                              </tr>
                              <!-- contenu -->
                              <tr class="content">
                                  <td class="w640" class="w640"  width="640" bgcolor="#ffffff">
                                      <table class="w640"  width="640" cellpadding="0" cellspacing="0" border="0">
                                          <tbody>
                                              <tr>
                                                  <td  class="w30"  width="30"></td>
                                                  <td  align="center" class="w580"  width="580">
                                                      <!-- une zone de contenu -->
                                                      <table class="w580"  width="580" cellpadding="10" cellspacing="10" border="0">
                                                          <tbody>
                                                              <tr>
                                                                  <td>
                                                                    <img width="80px" src="https://www.cartaplac.com/images/logo-securite-routiere.jpg" />
                                                                  </td>
                                                                  <td class="w580">
                                                                      <h2>
                                                                          C<span style="color:red;">A</span>NDILIB
                                                                      </h2>
                                                                  </td>
                                                              </tr>
                                                              <tr>
                                                                  <td class="article-content" colspan="2">
                                                                      ${content}
                                                                  </td>
                                                              </tr>
                                                          </tbody>
                                                      </table>
                                                      <!-- fin zone -->


                                                  </td>
                                                  <td class="w30" class="w30"  width="30"></td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                              </tr>

                              <!--  separateur horizontal de 15px de haut -->
                              <tr>
                                  <td class="w640"  width="640" height="15" bgcolor="#ffffff"></td>
                              </tr>

                              <!-- pied de page -->
                              <tr class="pagebottom">
                                  <td class="w640"  width="640">
                                      <table class="w640"  width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#c7c7c7">
                                          <tbody>
                                              <tr>
                                                  <td colspan="5" height="10"></td>
                                              </tr>
                                              <tr>
                                                  <td class="w30"  width="30"></td>
                                                  <td class="w580"  width="580" valign="top">
                                                      <p align="right" class="pagebottom-content-left"><span style="color:rgba(0,0,0, 0.54)">&copy; 2019 Candilib</span>
                                                      </p>
                                                  </td>

                                                  <td class="w30"  width="30"></td>
                                              </tr>
                                              <tr>
                                                  <td colspan="5" height="10"></td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </td>
                              </tr>
                              <tr>
                                  <td class="w640"  width="640" height="60"></td>
                              </tr>
                          </tbody>
                      </table>
                  </td>
              </tr>
          </tbody>
      </table>
  </body>
</html>`

const getMailData = async (candidat, flag, urlMagicLink) => {
  const urlFAQ = `${config.PUBLIC_URL}/informations`
  const urlRESA = `${config.PUBLIC_URL}/auth?redirect=calendar`
  const urlConnexion = `${config.PUBLIC_URL}`

  const { codeNeph, nomNaissance, place, email, emailValidationHash } = candidat

  const urlValidationEmail = `${
    config.PUBLIC_URL
  }/email-validation?e=${email}&h=${emailValidationHash}`

  const message = {}

  const nomMaj = nomNaissance ? nomNaissance.toUpperCase() : ''

  const site = place && place.title ? place.title : ''
  const dateCreneau =
    place && place.start ? moment(place.start).format('DD MMMM YYYY') : ''
  const heureCreneau =
    place && place.start ? moment(place.start).format('HH:mm') : ''

  let siteAdresse = []

  if (place && place.title) {
    const sites = await getCentres()
    siteAdresse = sites.find(item => item.nom.toUpperCase() === place.title)
  }

  const ANNULATION_CONVOCATION_MSG = `<p>Madame, Monsieur ${nomMaj},</p>
  <br>
  <p>votre réservation à l'examen pratique du permis de conduire avec
  le numéro NEPH ${codeNeph} est bien annulée. </p>
  <br>
  <p align="right">L'équipe Candilib</p>`

  const MAIL_CONVOCATION_MSG = `
  <p>Le présent mail vaut convocation.</p>
  <p>Madame, Monsieur ${nomMaj},</p>
  <br>
  <p>Nous avons bien pris en compte votre réservation à l'examen pratique
  du permis de conduire à ${site} le ${dateCreneau} à ${heureCreneau} avec
   le numéro NEPH ${codeNeph}.</p>
  <p>${siteAdresse.adresse} </p>
  <br>
  <p>Nous vous rappelons les éléments à vérifier le jour de l'examen :</p>
  <div>
    <ul>
      <li>Vous fournirez un véhicule en parfait état, équipé d’une double
      commande de frein et d’embrayage, de 2 rétroviseurs intérieurs et
      de 2 rétroviseurs latéraux.
      </li>
      <li>
        <p>Votre accompagnateur sera :<p>
          <ul>
            <li>
              soit un enseignant de la conduite en possession de l'original de son
              autorisation d'enseigner pour la présenter à l'inspecteur,
            </li>
            <li>
              soit une personne dont le permis B est en cours de validité.
              Cette dernière devra présenter son permis ainsi que
              la « <a href='https://www.legifrance.gouv.fr/jo_pdf.do?id=JORFTEXT000036251681'>charte de l’accompagnateur</a> » remplie et signée
              pour la remettre à l’inspecteur avant le début de l’examen.
            </li>
            <li>
              <p>
                Vous présenterez un titre d’identité en cours de validité : carte nationale
                d’identité, passeport ou titre de séjour
                (liste complète             {' '}
                <a href="https://legifrance.gouv.fr/affichTexte.do?cidTexte=JORFTEXT000033736411&categorieLien=id">
                  arrêté du 23 décembre 2016 relatif à la justification de
                  l&apos;identité, du domicile, de la résidence normale et de la
                  régularité du séjour pour l&apos;obtention du permis de conduire
                </a>).
              <p>
            </li>
            <li>
              <p>Votre permis de conduire original si vous avez obtenu une autre
              catégorie depuis moins de 5 ans afin de bénéficier d’une dispense
              d’examen théorique général.</p>
            </li>
            <li>
              L'attestation d'assurance du véhicule, en cours de validité,
              comportant obligatoirement les mentions suivantes :
              <uL>
                <li>la raison sociale de la société d'assurance ;</li>
                <li>les nom et prénom du candidat bénéficiant de la police d'assurance ;</li>
                <li>le numéro d'immatriculation du véhicule couvert ;</li>
                <li>le type d'assurance (couverture de l'ensemble des dommages
                pouvant être causés aux tiers à l'occasion de l'examen)</li>
              </ul>
            </li>
          </ul>
      </li>
      <li>
        Une enveloppe affranchie à 20 g.
      </li>
      <li>
        Lorsque vous avez fait l'objet d'une annulation du permis, le récépissé
        de la « fiche retour au permis de conduire » que vous aurez imprimé
        sur le site de l’ <a href='https://permisdeconduire.ants.gouv.fr/'>ANTS</a>.
      </li>
    </ul>
  </div>
  <p><b>Attention :</b></p>
  <p>
    Le mauvais état du véhicule (pneus lisses, rétros cassés ou
    absents, non fonctionnement de tous les feux, etc.),
    ou l'absence ou la non-validité d'un des documents exigés ci-dessus,
    pour le candidat ou pour l'accompagnateur, entraîne le report de l'examen
    À une date ultérieure.
    <br/>
  </p>
  <p>
    Si besoin, vous pouvez annuler <a href=${urlRESA}>votre réservation</a>.
    Si vous annulez 7 jours avant la date prévue, vous pourrez choisir un autre créneau disponible.
    Nous vous souhaitons une bonne préparation et le succès à l'examen.
    Pour toute information, vous pouvez consulter <a href=${urlFAQ}>notre aide en ligne</a>.
  </p>
  <br/>
  <p align="right">L'équipe Candilib</p>`

  const INSCRIPTION_OK_MSG = `<p>Madame, Monsieur ${nomMaj},</p>
  <br>
  <p>Bienvenue sur Candilib !</p>
  <br>
  <p>
    Vous êtes inscrit sur
    le site de réservation de l'examen pratique du permis de conduire.
  </p>
  <br/>
  <p>
    <a href="${urlMagicLink}">
      Se connecter
    </a>
  </p>
  <br/>
  <p>
      Ce lien est valable 3 jours à compter de la réception de cet email.
  </p>
  <p>
    Passé ce délai, allez sur <a href="${urlConnexion}">Candilib</a>, saisissez votre adresse email ${email} dans  "déjà inscrit" et vous recevrez un nouveau lien par email.
  </p>
  <p>
    Lorsque vous recevrez l’email, cliquez sur "Se connecter".
  </p>
  <br/>
  <p>
  <strong>Attention : </strong>vous ne devez transmettre cet email à personne. Il permet d'accéder à votre compte personnel, de créer ou modifier votre réservation.
  </p>

  <p align="right">L'équipe Candilib</p>`

  const VALIDATION_EMAIL_MSG = `<p>Madame, Monsieur ${nomMaj},</p>
  <br>
  <p>Vous avez demandé à être inscrit·e sur le site de réservation de l'examen pratique du permis de conduire.</p>
  <br/>
  <p>
    <a href="${urlValidationEmail}">
      Valider mon adresse email
    </a>
  </p>
  <br/>
  <p>
      Ce lien est valable 2 heures à compter de la réception de cet email.
  </p>
  <p>
    Passé ce délai, vous devrez de nouveau faire une demande de pré-inscription sur <a href="${urlConnexion}">Candilib</a>.
  </p>
  <br/>

  <p align="right">L'équipe Candilib</p>`

  const INSCRIPTION_KO_MSG = `<p>Madame, Monsieur ${nomMaj},</p>
  <br>
  <p>
    Vous avez demandé à rejoindre le site de réservation des candidats libres. Malheureusement les informations
    que vous avez fournies sont erronées :
  </p>
  <p align="center">NEPH ${codeNeph} / NOM ${nomMaj}</p>
  <p>Merci de les vérifier avant de renouveler votre demande d’inscription.</p>
  <br>
  <p>Veuillez consulter notre <a href=${urlFAQ}>aide en ligne</a>.<p>
  <br>
  <p align="right">L'équipe Candilib</p>`

  const EPREUVE_PRATIQUE_OK_MSG = `<p>Madame, Monsieur ${nomMaj},</p>
  <br>
  <p>Selon nos informations vous avez déjà réussi votre examen du permis de conduire, notre service ne vous est plus utile.</p>
  <br>
  <p><b>Attention :</b></p>
  <p>
    Si vous recevez ce message et que vous êtes en situation de retour au permis de conduire après une annulation,
    vous ne pouvez pas rejoindre le site de réservation des candidats libres sans examen du code de la route réussi
    et en cours de validité.
  </p>
  <p>Vous pourrez trouver des informations utiles en consultant notre <a href=${urlFAQ}>aide en ligne</a>.<p>
  <br>
  <p align="right">L'équipe Candilib</p>`

  const EPREUVE_ETG_KO_MSG = `<p>Madame, Monsieur ${nomMaj},</p>
  <br>
  <p>Votre code de la route n’est pas/plus valide.</p>
  </p>Vous ne pouvez pas rejoindre le site de réservation des candidats libres sans examen du code de la route réussi et en cours de validité.</p>
  <p>Vous pourrez trouver des informations utiles en consultant <a href=${urlFAQ}>notre aide en ligne</a>.<p>
  <br>
  <p align="right">L'équipe Candilib</p>`

  const INSCRIPTION_VALID_MSG = `<p>Madame, Monsieur ${nomMaj},</p>
  <p>
    Votre adresse courriel a été validée, et
    votre demande d’inscription est en cours de vérification,
    vous recevrez une information sous 48h hors week-end et jours fériés.
  </p>
  <br>
  <p align="right">L'équipe Candilib</p>`

  switch (flag) {
    case CANDIDAT_NOK:
      message.content = getHtmlBody(INSCRIPTION_KO_MSG)
      message.subject = 'Inscription Candilib non validée'
      return message
    case VALIDATION_EMAIL:
      message.content = getHtmlBody(VALIDATION_EMAIL_MSG)
      message.subject = "Validation d'adresse email pour Candilib"
      return message
    case INSCRIPTION_VALID:
      message.content = getHtmlBody(INSCRIPTION_VALID_MSG)
      message.subject = "Confirmation d'inscription Candilib"
      return message
    case CANDIDAT_NOK_NOM:
      message.content = getHtmlBody(INSCRIPTION_KO_MSG)
      message.subject = 'Inscription Candilib non validée'
      return message
    case EPREUVE_PRATIQUE_OK:
      message.content = getHtmlBody(EPREUVE_PRATIQUE_OK_MSG)
      message.subject = 'Problème inscription Candilib'
      return message
    case INSCRIPTION_OK:
      message.content = getHtmlBody(INSCRIPTION_VALID_MSG)
      message.subject = 'Inscription Candilib en attente de vérification'
      return message
    case EPREUVE_ETG_KO:
      message.content = getHtmlBody(EPREUVE_ETG_KO_MSG)
      message.subject = 'Problème inscription Candilib'
      return message
    case AURIGE_OK:
      message.content = getHtmlBody(INSCRIPTION_OK_MSG)
      message.subject = 'Validation de votre inscription à Candilib'
      return message
    case MAIL_CONVOCATION:
      message.content = getHtmlBody(MAIL_CONVOCATION_MSG)
      message.subject = "Convocation à l'examen"
      return message
    case ANNULATION_CONVOCATION:
      message.content = getHtmlBody(ANNULATION_CONVOCATION_MSG)
      message.subject = "Annulation de Convocation à l'examen"
      return message
    case INSCRIPTION_UPDATE:
      message.content = getHtmlBody(INSCRIPTION_VALID_MSG)
      message.subject = 'Inscription Candilib en attente de vérification'
      return message
    default:
      return ''
  }
}

export default getMailData
