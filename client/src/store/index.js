
import Vue from 'vue'
import Vuex from 'vuex'

import admin from './admin'
import adminBordereaux from './admin-bordereaux'
import adminModifInspecteur from './admin-modif-inspecteur'
import adminPlacesInspecteur from './admin-places-inspecteur'
import adminSearch from './admin-search'
import adminStatsKpi from './admin-stats-kpi'
import aurige from './aurige'
import auth from './auth'
import candidat from './candidat'
import candidats from './candidats'
import center from './center'
import config from './config'
import departements from './departements'
import importPlaces from './import-places'
import message from './message'
import reservation from './reservation'
import timeSlots from './time-slots'
import whitelist from './whitelist'
import users from './users'

export * from './admin-bordereaux'
export * from './admin-modif-inspecteur'
export * from './admin-places-inspecteur'
export * from './admin-search'
export * from './admin-stats-kpi'
export * from './admin'
export * from './aurige'
export * from './auth'
export * from './candidat'
export * from './candidats'
export * from './center'
export * from './config'
export * from './departements'
export * from './import-places'
export * from './message'
export * from './reservation'
export * from './time-slots'
export * from './whitelist'
export * from './users'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    admin,
    adminBordereaux,
    adminModifInspecteur,
    adminPlacesInspecteur,
    adminSearch,
    adminStatsKpi,
    aurige,
    auth,
    candidat,
    candidats,
    center,
    config,
    departements,
    importPlaces,
    message,
    reservation,
    timeSlots,
    whitelist,
    users,
  },
})
