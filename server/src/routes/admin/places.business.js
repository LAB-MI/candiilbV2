import * as csvParser from 'fast-csv'
import { DateTime } from 'luxon'

import { appLogger } from '../../util'
import {
  PLACE_ALREADY_IN_DB_ERROR,
  createPlace,
  findPlaceBookedByCandidat,
  removeBookedPlace,
} from '../../models/place'
import { findCentreByNameAndDepartement } from '../../models/centre/centre.queries'
import { archivePlace } from '../../models/candidat'
import { REASON_REMOVE_RESA_ADMIN } from '../common/reason.constants'
import { findUserById } from '../../models/user'

const getPlaceStatus = (
  departement,
  centre,
  inspecteur,
  date,
  status,
  message
) => ({
  departement,
  centre,
  inspecteur,
  date,
  status,
  message,
})
/**
 * TODO:departement a modifier
 * @param {*} data
 */
const transfomCsv = async ({ data, departement }) => {
  const [day, time, inspecteur, centre, dept] = data

  const myDate = `${day.trim()} ${time.trim()}`

  try {
    const date = DateTime.fromFormat(myDate, 'dd/MM/yy HH:mm', {
      zone: 'Europe/Paris',
      locale: 'fr',
    })
    if (dept !== departement) {
      throw new Error(
        'Le département du centre ne correspond pas au département dont vous avez la charge'
      )
    }

    if (!date.isValid) throw new Error('Date est invalide')
    // TODO: create test unit for search centre by center name and departement
    const foundCentre = await findCentreByNameAndDepartement(
      centre.trim(),
      departement
    )
    if (!foundCentre) throw new Error(`Le centre ${centre.trim()} est inconnu`)

    return {
      departement,
      centre: foundCentre,
      inspecteur: inspecteur.trim(),
      date,
    }
  } catch (error) {
    appLogger.error({
      section: 'admimImportPlaces',
      action: 'transformCsv',
      error,
    })
    return getPlaceStatus(
      departement,
      centre,
      inspecteur,
      myDate,
      'error',
      error.message
    )
  }
}

const createPlaceCsv = async place => {
  const { centre, inspecteur, date } = place
  try {
    const leanPlace = { inspecteur, date, centre: centre._id }
    await createPlace(leanPlace)
    appLogger.info({
      section: 'Admim-ImportPlaces',
      action: 'createPlaceCsv',
      message: `Place {${centre.departement},${
        centre.nom
      }, ${inspecteur}, ${date}} enregistrée en base`,
    })
    return getPlaceStatus(
      centre.departement,
      centre.nom,
      inspecteur,
      date,
      'success',
      `Place enregistrée en base`
    )
  } catch (error) {
    appLogger.error(JSON.stringify(error))
    if (error.message === PLACE_ALREADY_IN_DB_ERROR) {
      appLogger.warn({
        section: 'Admim-ImportPlaces',
        action: 'createPlaceCsv',
        message: 'Place déjà enregistrée en base',
      })
      return getPlaceStatus(
        centre.departement,
        centre.nom,
        inspecteur,
        date,
        'error',
        'Place déjà enregistrée en base'
      )
    }
    return getPlaceStatus(
      centre.departement,
      centre.nom,
      inspecteur,
      date,
      'error',
      error.message
    )
  }
}

export const importPlacesCsv = ({ csvFile, departement }, callback) => {
  let PlacesPromise = []

  csvParser
    .fromString(csvFile.data.toString(), { headers: true, ignoreEmpty: true })
    .transform((data, next) => {
      try {
        if (data[0] === 'Date') next()
        else {
          transfomCsv({ data, departement }).then(result => {
            appLogger.debug('transfomCsv' + result)
            if (result.status && result.status === 'error') {
              PlacesPromise.push(result)
              next()
            } else {
              next(null, result)
            }
          })
        }
      } catch (error) {
        appLogger.error(JSON.stringify(error))
      }
    })
    .on('data', place => {
      PlacesPromise.push(createPlaceCsv(place))
    })
    .on('end', () => {
      Promise.all(PlacesPromise).then(callback)
    })
}

export const releaseResa = async ({ _id }) => {
  const place = await findPlaceBookedByCandidat(_id)
  if (place) {
    appLogger.info({
      section: 'admin',
      action: 'releaseResa',
      candidat: _id,
      place,
    })
    return removeBookedPlace(place)
  }
}

export const removeReservationPlaceByAdmin = async (
  place,
  candidat,
  idAdmin
) => {
  const admin = await findUserById(idAdmin)
  // Annuler la place
  // TODO Annule place
  // Archive place
  await archivePlace(candidat, place, REASON_REMOVE_RESA_ADMIN, admin.email)
  return place
}
