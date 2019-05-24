import { DateTime } from 'luxon'

export const FORMAT_DATE = 'cccc dd LLLL yyyy'

export const FRENCH_TIME_ZONE = 'Europe/Paris'

export const getDateTimeFrFromJSDate = date =>
  DateTime.fromJSDate(date, { locale: 'fr', zone: FRENCH_TIME_ZONE })

/**
 *
 * @param {*} datetime Type DateTime of luxon
 */
export const dateTimeToFormatFr = pDate => {
  let datetime

  if (pDate instanceof DateTime) {
    datetime = pDate.setLocale('fr').setZone(FRENCH_TIME_ZONE)
  } else if (pDate instanceof Date) {
    datetime = getDateTimeFrFromJSDate(pDate)
  } else if (pDate instanceof String) {
    datetime = DateTime.fromISO(pDate, { locale: 'fr', zone: FRENCH_TIME_ZONE })
  }

  const date = datetime.toFormat(FORMAT_DATE)

  const hour = datetime.toLocaleString(DateTime.TIME_24_SIMPLE)

  return {
    date,
    hour,
  }
}
