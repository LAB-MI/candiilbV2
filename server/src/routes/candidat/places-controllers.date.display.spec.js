import request from 'supertest'

import { connect, disconnect } from '../../mongo-connection'

import app, { apiPrefix } from '../../app'

import {
  createCandidats,
  setInitCreatedCentre,
  resetCreatedInspecteurs,
} from '../../models/__tests__'
import {
  centreDateDisplay,
  createPlacesWithCreatedAtDiff,
  createdAtBefore,
} from '../../models/__tests__/places.date.display'
import { getFrenchLuxonFromJSDate, getFrenchLuxon, getFrenchLuxonFromObject } from '../../util'
import { findPlaceByCandidatId } from '../../models/place'
import {
  setNowBefore12h,
  setNowAtNow,
  setNowAfter12h,
  setNowAfter1d12h,
} from './__tests__/luxon-time-setting'

jest.mock('../../util/logger')
require('../../util/logger').setWithConsole(false)
jest.mock('../middlewares/verify-token')
jest.mock('../business/send-mail')
jest.mock('../middlewares/verify-user')

const isBefore12h = getFrenchLuxon() < getFrenchLuxonFromObject({ hour: 12, minute: 0, second: 0 })

describe('Get places available and display at 12h', () => {
  let places
  let placesCreatedBefore
  let idCandidat
  let placesUpdated

  beforeAll(async () => {
    setInitCreatedCentre()
    resetCreatedInspecteurs()

    await connect()
    const createdCandidats = await createCandidats()
    idCandidat = createdCandidats[0]._id
    require('../middlewares/verify-token').__setIdCandidat(idCandidat)

    places = await createPlacesWithCreatedAtDiff()
    placesCreatedBefore = places.find(({ updatedAt }) =>
      getFrenchLuxonFromJSDate(updatedAt).equals(createdAtBefore),
    )
    placesUpdated = places.find(({ createdAt, updatedAt }) => createdAt !== updatedAt)
  })

  afterAll(async () => {
    await disconnect()
    setNowAtNow()
  })

  async function assertPlaces (nbplaces) {
    const { body } = await request(app)
      .get(
        `${apiPrefix}/candidat/places?geoDepartement=${centreDateDisplay.geoDepartement}&nomCentre=${centreDateDisplay.nom}`,
      )
      .set('Accept', 'application/json')
      .expect(200)
    expect(body).toBeDefined()
    expect(body).toHaveLength(nbplaces)
  }

  it('Should get 1 place for 75 when now is before 12h', async () => {
    setNowBefore12h()
    await assertPlaces(1)
  })

  it('Should get 3 places for 75 when now is after 12h', async () => {
    setNowAfter12h()
    await assertPlaces(isBefore12h ? 4 : 3)
  })

  const assertPlaceByCentreId = async (date, nbPlaces) => {
    const placeSelected = encodeURIComponent(date)
    const { body } = await request(app)
      .get(
        `${apiPrefix}/candidat/places/${centreDateDisplay._id}?dateTime=${placeSelected}`,
      )
      .set('Accept', 'application/json')
      .expect(200)
    expect(body).toBeDefined()
    expect(body).toHaveLength(nbPlaces)
    nbPlaces && expect(body[0]).toBe(getFrenchLuxonFromJSDate(date).toISO())
  }

  it('Should 200 with an available place created before 12h when it is after 12h by centreId', async () => {
    setNowAfter12h()
    await assertPlaceByCentreId(placesCreatedBefore.date, 1)
  })

  it('Should 200 with an available place updated now when it is after 12h by centreId', async () => {
    setNowAfter12h()
    await assertPlaceByCentreId(placesUpdated.date, isBefore12h ? 1 : 0)
  })

  it('Should 200 with an available place updated now when it is after 1 day and 12h by centreId', async () => {
    setNowAfter1d12h()
    await assertPlaceByCentreId(placesUpdated.date, 1)
  })

  it('Should 200 with no available place before 12h when it is before 12h by centreId', async () => {
    setNowBefore12h()
    await assertPlaceByCentreId(placesCreatedBefore.date, 0)
  })

  it('Should 200 with no available place updated now when it is before 12h by centreId', async () => {
    setNowBefore12h()
    await assertPlaceByCentreId(placesUpdated.date, 0)
  })

  const assertPlaceByNameCentreAndGeoDep = async (date, nbPlaces) => {
    const placeSelected = encodeURIComponent(date)
    const { body } = await request(app)
      .get(
        `${apiPrefix}/candidat/places/?geoDepartement=${centreDateDisplay.geoDepartement}&nomCentre=${centreDateDisplay.nom}&dateTime=${placeSelected}`,
      )
      .set('Accept', 'application/json')
      .expect(200)

    expect(body).toBeDefined()
    expect(body).toHaveLength(nbPlaces)
    nbPlaces && expect(body[0]).toBe(getFrenchLuxonFromJSDate(date).toISO())
  }

  it('Should 200 with an available place before 12h when it is after 12h by center name and geo-departement', async () => {
    setNowAfter12h()
    await assertPlaceByNameCentreAndGeoDep(placesCreatedBefore.date, 1)
  })

  it('Should 200 with an available place updated now when it is after 12h by center name and geo-departement', async () => {
    setNowAfter12h()
    await assertPlaceByNameCentreAndGeoDep(placesUpdated.date, isBefore12h ? 1 : 0)
  })

  it('Should 200 with an available place updated now when it is after 1 day and 12h by center name and geo-departement', async () => {
    setNowAfter1d12h()
    await assertPlaceByNameCentreAndGeoDep(placesUpdated.date, 1)
  })

  it('Should 200 with no available place before 12h when it is after 12h by center name and geo-departement', async () => {
    setNowBefore12h()
    await assertPlaceByNameCentreAndGeoDep(placesCreatedBefore.date, 0)
  })

  it('Should 200 with no available place updated now when it is after 12h by center name and geo-departement', async () => {
    setNowBefore12h()
    await assertPlaceByNameCentreAndGeoDep(placesUpdated.date, 0)
  })

  const assertBooked = async (placeSelected) => {
    const { body } = await request(app)
      .patch(`${apiPrefix}/candidat/places`)
      .set('Accept', 'application/json')
      .send({
        nomCentre: centreDateDisplay.nom,
        geoDepartement: centreDateDisplay.geoDepartement,
        date: placeSelected.date,
        isAccompanied: true,
        hasDualControlCar: true,
      })
      .expect(200)

    expect(body).toBeDefined()
    expect(body).toHaveProperty('success', true)

    const placefounded = await findPlaceByCandidatId(idCandidat)
    expect(placefounded).toBeDefined()
    expect(placefounded).toHaveProperty('bookedAt')
    expect(placefounded).toHaveProperty('date', placeSelected.date)
    expect(placefounded).toHaveProperty('centre', placeSelected.centre)

    placefounded.candidat = undefined
    placefounded.booked = undefined
    await placefounded.save()
  }

  it('should booked place by candidat with info bookedAt when it is after 12h', async () => {
    setNowAfter12h()
    await assertBooked(placesCreatedBefore)
  })

  const assertBookedFailed = async (placeSelected) => {
    const { body } = await request(app)
      .patch(`${apiPrefix}/candidat/places`)
      .set('Accept', 'application/json')
      .send({
        nomCentre: centreDateDisplay.nom,
        geoDepartement: centreDateDisplay.geoDepartement,
        date: placeSelected.date,
        isAccompanied: true,
        hasDualControlCar: true,
      })
      .expect(400)

    expect(body).toBeDefined()
    expect(body).toHaveProperty('success', false)
    expect(body).toHaveProperty(
      'message',
      "Il n'y a pas de place pour ce créneau",
    )

    const placefounded = await findPlaceByCandidatId(idCandidat)
    expect(placefounded).toBeNull()
  }

  it('should not booked place by candidat with info bookedAt when it is before 12h', async () => {
    setNowBefore12h()
    await assertBookedFailed(placesCreatedBefore)
  })

  it('should booked place updated now by candidat with info bookedAt when it is after 12h', async () => {
    setNowAfter12h()
    isBefore12h ? await assertBooked(placesUpdated) : await assertBookedFailed(placesUpdated)
  })

  it('should booked place updated now by candidat with info bookedAt when it is after 1d and 12h', async () => {
    setNowAfter1d12h()
    await assertBooked(placesUpdated)
  })

  it('should not booked place updated now by candidat with info bookedAt when it is before 12h', async () => {
    setNowBefore12h()
    await assertBookedFailed(placesUpdated)
  })
})
