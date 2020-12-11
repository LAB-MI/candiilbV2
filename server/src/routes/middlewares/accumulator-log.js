import { logsTypeName } from '../../config'
import { saveManyLogActionsCandidat } from '../../models/logs-candidat/logs-queries'

import { getFrenchLuxon, techLogger } from '../../util'
import { candidatStatuses } from '../common/candidat-status-const'

function saveAccumulatorWithBulk () {
  const dateTimeNow = getFrenchLuxon()
  const datetimeNowToISO = dateTimeNow.toISO()
  const hourNow = dateTimeNow.hour
  if (hourNow !== accumulatorLog.lastSave && [0, 4, 6, 9, 11, 13, 17, 21].includes(hourNow)) {
    if (accumulatorLog.isSet) {
      const content = stringifyJson(accumulatorLog.get())
      const section = 'save-many-log-actions-candidat'

      saveManyLogActionsCandidat({
        type: logsTypeName,
        content,
        beginAt: accumulatorLog.beginAt,
        savedAt: datetimeNowToISO,
      }).then(({ savedAt }) => {
        techLogger.info({ section, description: `Logs created at ${savedAt}` })
      })
        .catch((error) => {
          techLogger.error({ section, description: error.message, error })
        })

      accumulatorLog.resetAccumulator()
      accumulatorLog.lastSave = hourNow
      accumulatorLog.beginAt = datetimeNowToISO
    }
  }
}

export function saveAccumulatorAsIntervalOf (intervalInMilscd) {
  accumulatorLog.intervalId = setInterval(saveAccumulatorWithBulk, intervalInMilscd)
}

const shapedStatus = {
  ...Array(candidatStatuses.nbStatus).fill(true).map(() => ({ logs: {} })),
}

const getHumanPathName = (method, isModification) => {
  if (method === 'DELETE') {
    return 'A'
  }
  if (method === 'PATCH' && !isModification) {
    return 'R'
  }
  if (method === 'PATCH' && isModification) {
    return 'M'
  }
}

export const accumulatorLog = {
  // timerIntervalSetting in msec
  beginAt: getFrenchLuxon().toISO(),
  timerIntervalSetting: 60000 * 1,
  intervalId: undefined,
  lastSave: undefined,
  buffer: {},
  isSet: false,
  get () {
    return this.buffer
  },
  set (logRequest) {
    const {
      method,
      candidatStatus,
      departementBooked,
      candidatDepartement,
      isModification,
    } = logRequest

    const requestString = getHumanPathName(method, isModification)
    const departementOfCandidat = departementBooked || candidatDepartement
    if (!this.buffer[`${departementOfCandidat}`]) {
      this.buffer[`${departementOfCandidat}`] = shapedStatus
    }

    const tmpLogValue = this.buffer[`${departementOfCandidat}`][`${candidatStatus}`].logs[requestString]

    this.buffer[`${departementOfCandidat}`][`${candidatStatus}`].logs[requestString] =
    tmpLogValue ? tmpLogValue + 1 : 1

    this.isSet = true
  },

  resetAccumulator () {
    this.buffer = {}
    this.isSet = false
  },
}

// TODO: Changé l'emplacement du lancement la fonction suivante
if (process.env.NODE_ENV !== 'test') {
  saveAccumulatorAsIntervalOf(accumulatorLog.timerIntervalSetting)
}

const stringifyJson = (value) => JSON.stringify(value)
const parseJson = (value) => JSON.parse(value)

export const setAccumulatorRequest = async (req, res, next) => {
  const {
    method,
    path,
    candidatStatus,
    body,
    candidatDepartement,
  } = req

  const oldWrite = res.write
  const oldEnd = res.end
  const chunks = []

  res.write = (...restArgs) => {
    chunks.push(Buffer.from(restArgs[0]))
    oldWrite.apply(res, restArgs)
  }

  res.end = (...restArgs) => {
    if (restArgs[0]) {
      chunks.push(Buffer.from(restArgs[0]))
    }
    const resBody = Buffer.concat(chunks).toString('utf8')

    if ((method === 'PATCH' || method === 'DELETE') && path === '/places' && res.statusCode.toString() === '200') {
      accumulatorLog.set({
        method,
        candidatStatus,
        departementBooked: parseJson(resBody)?.reservation?.departement,
        candidatDepartement,
        isModification: body?.isModification,
      })
    }

    oldEnd.apply(res, restArgs)
  }

  next()
}