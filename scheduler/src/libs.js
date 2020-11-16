import { appLogger } from './utils/index.js'

/**
 * Schedule jobs in agenda
 *
 * @async
 * @function
 *
 * @param {import('agenda').Agenda} agenda
 */
export const scheduleJobs = async (agenda, jobs) => {
  appLogger.debug({ description: 'Scheduling jobs' })

  const jobPromises = jobs.map(({ repeatInterval, name }) => {
    return agenda.every(
      repeatInterval,
      name,
      null,
      { timezone: 'Europe/Paris' },
    )
  })

  const jobsScheduled = await Promise.all(jobPromises)

  appLogger.info({ description: 'Jobs scheduled!' })

  return jobsScheduled
}

/**
 * Définit les jobs de l'agenda
 *
 * @async
 * @function
 *
 * @param {import('agenda').Agenda} agenda
 * @param {}
 */
export const defineJobs = async (agenda, jobs) => {
  for (const job of jobs) {
    agenda.define(job.name, job.fn)
  }
}
