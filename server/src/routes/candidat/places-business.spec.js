import { connect, disconnect } from '../../mongo-connection'

import config from '../../config'
import { findCandidatById } from '../../models/candidat'

import { findCentreByNameAndDepartement } from '../../models/centre'
import { createPlace } from '../../models/place'
import PlaceModel from '../../models/place/place.model'
import {
  centres,
  createCentres,
  createPlaces,
  removeCentres,
  removePlaces,
} from '../../models/__tests__/'
import {
  getDatesByCentre,
  canCancelReservation,
  getDatesByCentreId,
} from './places-business'
import { getFrenchLuxon, getFrenchFormattedDateTime } from '../../util'

import { NB_YEARS_ETG_EXPIRED } from '../common/constants'
import { CANDIDAT_DATE_ETG_KO } from './message.constants'

jest.mock('../../models/candidat')

describe('Test places business: utiles functions', () => {
  it('Should return true when entry date is 7 days and 2 hours days hours after now', () => {
    const dateResa = getFrenchLuxon()
      .plus({
        days: config.daysForbidCancel,
      })
      .set({ hour: 8, minute: 30 })
    const result = canCancelReservation(dateResa)
    expect(result).toBe(true)
  })

  it('Should return false when entry date is 6 days and 2 hours days hours after now', () => {
    const dateResa = getFrenchLuxon()
      .plus({
        days: config.daysForbidCancel - 1,
      })
      .set({ hour: 15, minute: 30 })
    const result = canCancelReservation(dateResa)
    expect(result).toBe(false)
  })
})

describe('Test places business: get dates from places available', () => {
  let placesCreated
  let centreSelected
  let nbPlacesAvaibles
  let dateIn3Months
  let inspecteur
  beforeAll(async () => {
    await connect()
    const centresCreated = await createCentres()
    placesCreated = await createPlaces()
    centreSelected = centresCreated.find(
      ({ nom, departement }) =>
        nom === centres[1].nom && departement === centres[1].departement
    )
    const placesCreatedFromSelected = placesCreated.filter(
      ({ centre }) => centre === centreSelected._id
    )
    inspecteur = placesCreatedFromSelected[0].inspecteur

    dateIn3Months = getFrenchLuxon().plus({
      month: 3,
    })
    const count = (await Promise.all([
      createPlace({
        centre: centreSelected._id,
        inspecteur,
        date: getFrenchLuxon().plus({
          month: 1,
        }),
      }),
      createPlace({
        centre: centreSelected._id,
        inspecteur,
        date: getFrenchLuxon().plus({
          month: 1,
          hours: 1,
        }),
      }),
      createPlace({
        centre: centreSelected._id,
        inspecteur,
        date: getFrenchLuxon().plus({ month: 2 }),
      }),
      createPlace({
        centre: centreSelected._id,
        inspecteur,
        date: dateIn3Months,
      }),
      createPlace({
        centre: centreSelected._id,
        inspecteur,
        date: getFrenchLuxon().plus({
          month: 4, // config.numberOfVisibleMonths + 1
        }),
      }),
    ])).length

    nbPlacesAvaibles = placesCreatedFromSelected.length + count - 1
  })

  afterAll(async () => {
    await removePlaces()
    await removeCentres()
    await disconnect()
  })

  it('Should get 2 dates from places Centre 2', async () => {
    findCandidatById.mockResolvedValue({
      dateReussiteETG: getFrenchLuxon().toJSDate(),
    })

    const centreSelected = centres[1]
    const dates = await getDatesByCentre(
      centreSelected.departement,
      centreSelected.nom
    )
    expect(dates).toBeDefined()
    expect(dates).toHaveLength(nbPlacesAvaibles)
  })

  it('Should get any places from Centre2 when ETG expired now', async () => {
    const dateETGExpired = getFrenchLuxon()
    findCandidatById.mockResolvedValue({
      dateReussiteETG: dateETGExpired
        .minus({ years: NB_YEARS_ETG_EXPIRED })
        .toJSDate(),
    })
    const centreSelected = await findCentreByNameAndDepartement(
      centres[1].nom,
      centres[1].departement
    )
    const begin = getFrenchLuxon().toISODate()
    const end = getFrenchLuxon()
      .plus({ years: 1 })
      .toISODate()

    try {
      const dates = await getDatesByCentreId(
        centreSelected._id,
        begin,
        end,
        'candidatId'
      )
      expect(dates).toBeUndefined()
    } catch (error) {
      expect(error).toHaveProperty('status', 400)
      expect(error).toHaveProperty(
        'message',
        CANDIDAT_DATE_ETG_KO + getFrenchFormattedDateTime(dateETGExpired).date
      )
    }
  })

  it('Should get many places from Centre2 when ETG expired in 2 months', async () => {
    const dateETGExpired = getFrenchLuxon().plus({ months: 1 })
    findCandidatById.mockResolvedValue({
      dateReussiteETG: dateETGExpired
        .minus({ years: NB_YEARS_ETG_EXPIRED })
        .toJSDate(),
    })
    const centreSelected = await findCentreByNameAndDepartement(
      centres[1].nom,
      centres[1].departement
    )
    const begin = getFrenchLuxon().toISODate()
    const end = getFrenchLuxon()
      .plus({ months: 6 })
      .toISODate()

    const dates = await getDatesByCentreId(
      centreSelected._id.toString(),
      begin,
      end,
      'candidatId'
    )
    expect(dates).toBeDefined()

    const count = await PlaceModel.count({
      centre: centreSelected._id,
      inspecteur,
      date: { $lt: dateETGExpired.endOf('days') },
    })
    expect(dates).toHaveLength(count)
    expect(dates.includes(dateIn3Months.toISO()))
  })
})
