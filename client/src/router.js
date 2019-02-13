import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/views/Home.vue'
import AdminHome from '@/views/AdminHome.vue'
import CandidatHome from '@/views/CandidatHome.vue'
import MessageView from '@/views/Message.vue'
import EmailValidationComponent from '@/views/candidat/components/EmailValidationComponent.vue'
import Error404 from '@/views/Error404.vue'

import {
  requireAdminAuth,
  requireCandidatAuth,
  checkAdminToken,
  checkCandidatToken,
} from './router-checks'
import { SignupForm } from './views/candidat/components'

Vue.use(Router)

const { VUE_APP_CLIENT_BUILD_TARGET } = process.env

const isBuildWithAll = ['ALL', undefined].includes(VUE_APP_CLIENT_BUILD_TARGET)
const isBuildWithCandidat = isBuildWithAll || ['CANDIDAT'].includes(VUE_APP_CLIENT_BUILD_TARGET)
const isBuildWithAdmin = isBuildWithAll || ['ADMIN'].includes(VUE_APP_CLIENT_BUILD_TARGET)

const adminRoutes = [
  {
    path: '/admin-login',
    name: 'admin-login',
    component: AdminHome,
    beforeEnter: checkAdminToken,
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./views/admin'),
    beforeEnter: requireAdminAuth,
    children: [
      {
        path: ':tool',
        name: 'adminTool',
      },
    ],
  },
]

const candidatRoutes = [
  {
    path: '/guest',
    component: MessageView,
    children: [
      {
        path: '/candidat-presignup',
        name: 'candidat-presignup',
        component: SignupForm,
        beforeEnter: checkCandidatToken,
      },
      {
        path: '/email-en-attente-de-validation',
        name: 'email-validation-pending',
        component: EmailValidationComponent,
      },
      {
        path: '/email-validation',
        name: 'email-validation',
        component: EmailValidationComponent,
      },
    ],
  },
  {
    path: '/candidat',
    name: 'candidat',
    component: () => import('./views/candidat'),
    beforeEnter: requireCandidatAuth,
    children: [
      {
        path: ':subpage',
      },
    ],
  },
]

const HomeComponent = isBuildWithAll ? Home : (isBuildWithAdmin ? AdminHome : CandidatHome)

const commonRoutes = [
  {
    path: '/',
    name: 'home',
    component: HomeComponent,
  },
  {
    path: '/*',
    name: '404',
    component: Error404,
  },
]

const routes = [
  ...(isBuildWithCandidat ? candidatRoutes : []),
  ...(isBuildWithAdmin ? adminRoutes : []),
  ...commonRoutes,
]

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
