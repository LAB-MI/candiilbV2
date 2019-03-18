import api from '@/api'

import { SHOW_SUCCESS } from '@/store'

export const FETCH_CANDIDAT_RESERVATION_REQUEST = 'FETCH_CANDIDAT_RESERVATION_REQUEST'
export const FETCH_CANDIDAT_RESERVATION_FAILURE = 'FETCH_CANDIDAT_RESERVATION_FAILURE'
export const FETCH_CANDIDAT_RESERVATION_SUCCESS = 'FETCH_CANDIDAT_RESERVATION_SUCCESS'

export const DELETE_CANDIDAT_RESERVATION_REQUEST = 'DELETE_CANDIDAT_RESERVATION_REQUEST'
export const DELETE_CANDIDAT_RESERVATION_FAILURE = 'DELETE_CANDIDAT_RESERVATION_FAILURE'
export const DELETE_CANDIDAT_RESERVATION_SUCCESS = 'DELETE_CANDIDAT_RESERVATION_SUCCESS'

export default {
  state: {
    isDeleting: false,
    isFetching: false,
    isModifying: false,
    list: undefined,
  },

  mutations: {
    [FETCH_CANDIDAT_RESERVATION_REQUEST] (state) {
      state.isFetching = true
    },
    [FETCH_CANDIDAT_RESERVATION_SUCCESS] (state, list) {
      state.isFetching = false
      state.list = list
    },
    [FETCH_CANDIDAT_RESERVATION_FAILURE] (state) {
      state.isFetching = false
    },

    [DELETE_CANDIDAT_RESERVATION_REQUEST] (state) {
      state.isDeleting = true
    },
    [DELETE_CANDIDAT_RESERVATION_SUCCESS] (state) {
      state.isDeleting = false
    },
    [DELETE_CANDIDAT_RESERVATION_FAILURE] (state) {
      state.isDeleting = false
    },
  },

  actions: {
    async [FETCH_CANDIDAT_RESERVATION_REQUEST] ({ commit, dispatch }) {
      commit(FETCH_CANDIDAT_RESERVATION_REQUEST)
      try {
        const response = await api.candidat.getReservations()
        if (response.success === false) {
          throw new Error(response.message)
        }
        commit(FETCH_CANDIDAT_RESERVATION_SUCCESS, response)
      } catch (error) {
        commit(FETCH_CANDIDAT_RESERVATION_FAILURE)
        throw error
      }
    },

    async [DELETE_CANDIDAT_RESERVATION_REQUEST] ({ commit, dispatch }) {
      commit(DELETE_CANDIDAT_RESERVATION_REQUEST)
      try {
        const result = await api.candidat.deleteReservation()
        if (result && result.success) {
          commit(DELETE_CANDIDAT_RESERVATION_SUCCESS)
          dispatch(SHOW_SUCCESS, result.message)
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        commit(DELETE_CANDIDAT_RESERVATION_FAILURE)
        throw error
      }
    },
  },
}
