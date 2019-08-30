import config from '../../config'
import {
  appLogger,
  getFrenchLuxonFromISO,
  getFrenchLuxonFromJSDate,
} from '../../util'
import {
  findAvailablePlacesByCentre,
  findPlacesByCentreAndDate,
  findPlaceBookedByCandidat,
  findAndbookPlace,
  removeBookedPlace,
} from '../../models/place'
import {
  findCentreByName,
  findCentreByNameAndDepartement,
} from '../../models/centre'
import {
  CANCEL_RESA_WITH_MAIL_SENT,
  CANCEL_RESA_WITH_NO_MAIL_SENT,
  SAME_RESA_ASKED,
  USER_INFO_MISSING,
  CANDIDAT_NOT_FOUND,
  CAN_BOOK_AFTER,
} from './message.constants'
import { sendCancelBooking } from '../business'
import { getAuthorizedDateToBook } from './authorize.business'
import {
  updateCandidatCanBookFrom,
  findCandidatById,
  archivePlace,
} from '../../models/candidat'
import {
  getFrenchFormattedDateTime,
  getFrenchLuxon,
} from '../../util/date.util'
import { REASON_CANCEL, REASON_MODIFY } from '../common/reason.constants'

export const getDatesByCentreId = async (_id, endDate) => {
  appLogger.debug({
    func: 'getDatesByCentreId',
    _id,
    endDate,
  })

  const beginDate = getAuthorizedDateToBook()
  const endDateTime = getFrenchLuxonFromISO(endDate)

  endDate = !endDateTime.invalid ? endDateTime.toJSDate() : undefined

  const places = await findAvailablePlacesByCentre(_id, beginDate, endDate)
  const dates = places.map(place =>
    getFrenchLuxonFromJSDate(place.date).toISO()
  )
  return [...new Set(dates)]
}

export const getDatesByCentre = async (
  departement,
  centre,
  beginDate,
  endDate
) => {
  appLogger.debug({
    func: 'getDatesByCentre',
    departement,
    centre,
    beginDate,
    endDate,
  })

  let foundCentre
  if (departement) {
    foundCentre = await findCentreByNameAndDepartement(centre, departement)
  } else {
    foundCentre = await findCentreByName(centre)
  }
  const dates = await getDatesByCentreId(foundCentre._id, beginDate, endDate)
  return dates
}

export const hasAvailablePlaces = async (id, date) => {
  const places = await findPlacesByCentreAndDate(id, date)
  const dates = places.map(place =>
    getFrenchLuxonFromJSDate(place.date).toISO()
  )
  return [...new Set(dates)]
}

export const hasAvailablePlacesByCentre = async (departement, centre, date) => {
  const foundCentre = await findCentreByNameAndDepartement(centre, departement)
  const dates = await hasAvailablePlaces(foundCentre._id, date)
  return dates
}

export const getReservationByCandidat = async (candidatId, options) => {
  const place = await findPlaceBookedByCandidat(
    candidatId,
    {},
    options || { centre: true }
  )
  return place
}

export const bookPlace = async (candidatId, centre, date) => {
  const place = await findAndbookPlace(
    candidatId,
    centre,
    date,
    { inspecteur: 0 },
    { centre: true, candidat: true }
  )

  return place
}

export const removeReservationPlace = async (bookedPlace, isModified) => {
  const candidat = bookedPlace.candidat
  if (!candidat) {
    throw new Error("Il n'y pas de candidat pour annuler la reservation")
  }
  const { _id: candidatId } = candidat

  let dateAfterBook
  const datetimeAfterBook = await applyCancelRules(candidat, bookedPlace.date)
  await removeBookedPlace(bookedPlace)
  await archivePlace(
    candidat,
    bookedPlace,
    isModified ? REASON_MODIFY : REASON_CANCEL
  )

  let statusmail = true
  let message = CANCEL_RESA_WITH_MAIL_SENT

  if (datetimeAfterBook) {
    if (isModified) {
      message =
        CAN_BOOK_AFTER + getFrenchFormattedDateTime(datetimeAfterBook).date
    } else {
      message =
        message +
        ' ' +
        CAN_BOOK_AFTER +
        getFrenchFormattedDateTime(datetimeAfterBook).date
    }
    dateAfterBook = datetimeAfterBook.toISODate()
  }

  try {
    await sendCancelBooking(candidat, bookedPlace)
  } catch (error) {
    appLogger.warn({
      section: 'candidat-remove-reservations',
      action: 'FAILED_SEND_MAIL',
      error,
    })
    statusmail = false
    message = CANCEL_RESA_WITH_NO_MAIL_SENT
  }

  appLogger.info({
    section: 'candidat-remove-reservations',
    candidatId,
    success: true,
    statusmail,
    message,
    place: bookedPlace._id,
  })

  return {
    statusmail,
    message,
    dateAfterBook,
  }
}

/**
 *
 * @param {*} centerId Type string from ObjectId of mongoose
 * @param {*} date Type DateTime from luxon
 * @param {*} previewBookedPlace Type model place which populate centre and candidat
 */
export const isSameReservationPlace = (centerId, date, previewBookedPlace) => {
  if (centerId === previewBookedPlace.centre._id.toString()) {
    const diffDateTime = date.diff(
      getFrenchLuxonFromJSDate(previewBookedPlace.date),
      'second'
    )
    if (diffDateTime.seconds === 0) {
      return true
    }
  }
  return false
}

/**
 *
 * @param {*} previewDateReservation Type DateTime luxon
 */
export const canCancelReservation = previewDateReservation => {
  const dateCancelAutorize = getFrenchLuxon().plus({
    days: config.daysForbidCancel,
  })
  return previewDateReservation.diff(dateCancelAutorize, 'days') > 0
}

/**
 *
 * @param {*} candidat type Candidate Model
 * @param {*} previewDateReservation Type Date javascript
 */
export const applyCancelRules = async (candidat, previewDateReservation) => {
  const previewBookedPlace = getFrenchLuxonFromJSDate(previewDateReservation)

  if (canCancelReservation(previewBookedPlace)) {
    return
  }

  const canBookFromDate = getCandBookFrom(candidat, previewBookedPlace)

  await updateCandidatCanBookFrom(candidat, canBookFromDate)

  return canBookFromDate
}

/**
 *
 * @param {*} candidat
 * @param {*} datePassage type DateTime of luxon
 */
export const getCandBookFrom = (candidat, datePassage) => {
  if (!datePassage) {
    throw new Error('Il manque la date de passage')
  }

  if (!candidat) {
    throw new Error('Il manque les information candidat')
  }

  const daysOfDatePassage = datePassage.endOf('days')
  const newCanBookFrom = daysOfDatePassage.plus({
    days: config.timeoutToRetry,
  })

  const { canBookFrom } = candidat
  const previewCanBookFrom = canBookFrom
    ? getFrenchLuxonFromJSDate(canBookFrom)
    : undefined

  if (
    previewCanBookFrom &&
    previewCanBookFrom.isValid &&
    previewCanBookFrom.diff(newCanBookFrom, 'days') > 0
  ) {
    return previewCanBookFrom
  }
  return newCanBookFrom
}

export const getBeginDateAutorize = candidat => {
  let beginDateAutoriseDefault
  if (config.delayToBook) {
    beginDateAutoriseDefault = getFrenchLuxon()
      .endOf('day')
      .plus({
        days: config.delayToBook,
      })
  } else {
    beginDateAutoriseDefault = getFrenchLuxon()
  }

  const dateCanBookFrom = getFrenchLuxonFromJSDate(candidat.canBookFrom)

  if (!!candidat.canBookFrom && dateCanBookFrom.isValid) {
    const { days } = dateCanBookFrom.diff(beginDateAutoriseDefault, ['days'])
    if (days > 0) {
      return dateCanBookFrom
    }
  }

  return beginDateAutoriseDefault
}

/**
 *
 * @param {*} dateReservation Type Date Javascript
 */
export const getLastDateToCancel = dateReservation => {
  const dateTimeResa = getFrenchLuxonFromJSDate(dateReservation)
  return dateTimeResa.minus({ days: config.daysForbidCancel }).toISODate()
}

export const addInfoDateToRulesResa = async (candidatId, reservation) => {
  const {
    timeoutToRetry: timeOutToRetry,
    daysForbidCancel: dayToForbidCancel,
  } = config

  const candidat = await findCandidatById(candidatId, {
    canBookFrom: 1,
    dateDernierEchecPratique: 1,
  })
  const { canBookFrom, dateDernierEchecPratique } = candidat

  return {
    ...reservation,
    dateDernierEchecPratique,
    canBookFrom,
    timeOutToRetry,
    dayToForbidCancel,
  }
}
/**
 *
 * @param {*} candidatId Type string from ObjectId of mongoose
 * @param {*} centre Type string from ObjectId of mongoose
 * @param {*} date Type Date from Janascript or mongoose Type Date
 * @param {*} previewBookedPlace Type model place which populate centre and candidat
 */
export const validCentreDateReservation = async (
  candidatId,
  centre,
  date,
  previewBookedPlace
) => {
  let candidat
  const dateTimeResa = getFrenchLuxonFromISO(date)
  if (previewBookedPlace) {
    const isSame = isSameReservationPlace(
      centre,
      dateTimeResa,
      previewBookedPlace
    )

    if (isSame) {
      const success = false
      const message = SAME_RESA_ASKED
      appLogger.warn({
        section: 'candidat-valid-centre-date-reservation',
        candidatId,
        success,
        message,
      })
      return {
        success,
        message,
      }
    }
    candidat = previewBookedPlace.candidat
  }

  if (!candidat) {
    if (!candidatId) {
      throw new Error(USER_INFO_MISSING)
    }

    candidat = await findCandidatById(candidatId, {})
    if (!candidat) {
      throw new Error(CANDIDAT_NOT_FOUND)
    }
  }

  let dateAuthorize = getBeginDateAutorize(candidat)
  const { days } = dateAuthorize.diff(dateTimeResa, ['days'])
  let isAuthorize = days < 0

  if (previewBookedPlace && isAuthorize) {
    const datePreview = getFrenchLuxonFromJSDate(previewBookedPlace.date)
    if (!canCancelReservation(datePreview)) {
      dateAuthorize = getCandBookFrom(candidat, datePreview)
      isAuthorize = dateTimeResa > dateAuthorize
    }
  }

  if (!isAuthorize) {
    const success = false
    const message =
      CAN_BOOK_AFTER + getFrenchFormattedDateTime(dateAuthorize).date
    appLogger.warn({
      section: 'candidat-valid-centre-date-reservation',
      candidatId,
      success,
      message,
    })
    return {
      success,
      message,
    }
  }
}
