import {
  synchroAurige,
  getCandidatsAsCsv,
  getBookedCandidatsAsCsv,
} from './business'
import { findAllCandidatsLean } from '../../models/candidat'
import { findPlaceById } from '../../models/place'

export const importCandidats = async (req, res) => {
  const files = req.files

  if (!files || !files.file) {
    res.status(400).json({
      success: false,
      message: 'Fichier manquant',
    })
    return
  }

  const jsonFile = files.file
  try {
    const result = await synchroAurige(jsonFile.data)
    res.status(200).send({
      fileName: jsonFile.name,
      success: true,
      message: `Le fichier ${jsonFile.name} a été synchronisé.`,
      candidats: result,
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
      error,
    })
  }
}

export const exportCandidats = async (req, res) => {
  const candidatsAsCsv = await getCandidatsAsCsv()
  let filename = 'candidatsLibresPrintel.csv'

  res
    .status(200)
    .attachment(filename)
    .send(candidatsAsCsv)
}

export const getCandidats = async (req, res) => {
  const {
    query: { format, filter },
  } = req
  if (format && format === 'csv' && (!filter || filter === 'aurige')) {
    exportCandidats(req, res)
    return
  }

  const candidatsLean = await findAllCandidatsLean()
  const candidats = await Promise.all(
    candidatsLean.map(async candidat => {
      const { place: placeId } = candidat
      if (placeId) {
        const place = await findPlaceById(placeId)
        candidat.place = place
      }
      return candidat
    })
  )

  if (format && format === 'csv' && filter && filter === 'resa') {
    const candidatsAsCsv = await getBookedCandidatsAsCsv(candidats)
    const filename = 'candidatsLibresReserve.csv'
    res
      .status(200)
      .attachment(filename)
      .send(candidatsAsCsv)
    return
  }
  res.json(candidats)
}
