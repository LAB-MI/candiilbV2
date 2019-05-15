
import { storiesOf } from '@storybook/vue'
import Vuex from 'vuex'
import delay from 'delay'

import AdminWhitelist from './Whitelist.vue'

const getRandomString = () => Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)

storiesOf('Admin', module)
  .add('AdminWhitelist', () => ({
    components: { AdminWhitelist },
    store: new Vuex.Store({
      state: {
        admin: {
          departements: {
            active: '93',
          },

        },
        whitelist: {
          isFetching: false,
          list: [
            {
              _id: getRandomString(),
              email: 'jean@dupont.fr',
              departement: '93',
            },
          ],
        },
      },
      mutations: {
        DELETE_EMAIL_REQUEST (state, idToRemove) {
          state.whitelist.list = state.whitelist.list.filter(({ _id }) => _id !== idToRemove)
        },

        FETCH_WHITELIST_REQUEST (state) {
          state.whitelist.isFetching = true
        },

        FETCH_WHITELIST_SUCCESS (state, list) {
          state.whitelist.isFetching = false
        },

        SAVE_EMAIL_REQUEST (state, email) {
          state.whitelist.list = [
            ...state.whitelist.list,
            {
              _id: getRandomString(),
              email,
              departement: '93',
            },
          ]
        },

        SAVE_EMAIL_BATCH_REQUEST (state, emails) {
          state.whitelist.list = [
            ...state.whitelist.list,
            ...emails.map(email => ({
              _id: getRandomString(),
              email,
              departement: '93',
            })),
          ]
        },
      },
      actions: {
        async FETCH_WHITELIST_REQUEST ({ commit }) {
          commit('FETCH_WHITELIST_REQUEST')
          await delay(1000)
          commit('FETCH_WHITELIST_SUCCESS')
        },
        async DELETE_EMAIL_REQUEST ({ commit }, id) {
          commit('FETCH_WHITELIST_REQUEST')
          await delay(500)
          commit('DELETE_EMAIL_REQUEST', id)
          commit('FETCH_WHITELIST_SUCCESS')
        },
        async SAVE_EMAIL_REQUEST ({ commit }, email) {
          commit('FETCH_WHITELIST_REQUEST')
          await delay(1000)
          commit('SAVE_EMAIL_REQUEST', email)
          commit('FETCH_WHITELIST_SUCCESS')
        },
        async SAVE_EMAIL_BATCH_REQUEST ({ commit }, emails) {
          commit('FETCH_WHITELIST_REQUEST')
          await delay(1000)
          commit('SAVE_EMAIL_BATCH_REQUEST', emails)
          commit('FETCH_WHITELIST_SUCCESS')
        },
      },
    }),
    template: '<admin-whitelist />',
  }))
