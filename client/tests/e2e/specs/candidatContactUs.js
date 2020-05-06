describe('Contact Us', () => {
  if (Cypress.env('VUE_APP_CLIENT_BUILD_INFO') !== 'COVID') {
    before(() => {
      cy.deleteAllMails()
      cy.candidatConnection(Cypress.env('emailCandidatContactUs'))
      cy.getLastMail().its('Content.Body').then((mailBody) => {
        const codedLink = mailBody.split('href=3D"')[1].split('">')[0]
        const withoutEq = codedLink.replace(/=\r\n/g, '')
        const magicLink = withoutEq.replace(/=3D/g, '=')
        cy.visit(magicLink)
      })
    })

    const subjectForCandidat = 'Prise en compte de votre demande'
    const subject = 'Text de object du message'
    const message = 'Text du message du candidat'

    it('Should get confirm mail to candidat and send mail to admin when candidat is sign-in', () => {
      cy.visit(Cypress.env('frontCandidat') + 'contact-us')

      cy.get('.app-title').should('contain', 'Nous contacter')
      cy.get('.t-contact-us-form').within(($inForm) => {
        cy.get('.contact-us-button').should('contain', 'Envoyer').should('be.disabled')

        cy.get('.t-checkbox').should('not.exist')
        const dataInfos = [
          { label: 'NEPH', value: Cypress.env('codeNephCandidatContactUs') },
          { label: 'Nom de naissance', value: Cypress.env('candidatContactUs') },
          { label: 'Prénom', value: Cypress.env('prenomCandidatContactUs') },
          { label: 'Courriel', value: Cypress.env('emailCandidatContactUs') },
          { label: 'Portable', value: Cypress.env('portableCandidatContactUs') },
        ]
        dataInfos.forEach(({ label, value }, index) => {
          cy.get('label').eq(index).should('contain', label)
          cy.get('input').eq(index).should('have.value', value)
          cy.get('.contact-us-button').should('contain', 'Envoyer').should('be.disabled')
        })
        cy.get('.t-select-departements').should('contain', Cypress.env('homeDepartementCandidatContactUs'))
        cy.get('.contact-us-button').should('contain', 'Envoyer').should('be.disabled')
      })

      cy.get('.t-contact-us-form').within(($inForm) => {
        const dataInfos = [
          { label: 'Objet du message', value: subject },
          { label: 'Message', value: message },
        ]
        dataInfos.forEach(({ label, value }, index) => {
          cy.get('label').eq(index + 6).should('contain', label)
          cy.get('input, textarea').eq(index + 7).type(value)
        })
        cy.get('.contact-us-button').should('contain', 'Envoyer').click()
      })

      cy.get('.v-snack--active').should(
        'contain',
        'Votre demande a été envoyé.',
      )

      cy.getLastMail({ recipient: Cypress.env('emailRepartiteur93') })
        .then($mail => {
          cy.wrap($mail)
            .getSubject()
            .should('contain', subject)
          cy.wrap($mail)
            .its('Content.Body')
            .should('contain', message)
        })

      cy.getLastMail({ subject: subjectForCandidat, recipient: Cypress.env('emailCandidatContactUs') })
        .getSubject().should('contain', subjectForCandidat)

      if (!Cypress.env('API_CONTACT_US')) {
        cy.server({ enable: false })
      }
    })

    it('Should get confirm mail to candidat and send mail to admin when candidat is not sign-in', () => {
      cy.deleteAllMails()
      cy.visit(Cypress.env('frontCandidat') + 'contact-us', {
        onBeforeLoad: (win) => {
          win.localStorage.clear()
        },
      })
      cy.get('.contact-us-title').should('contain', 'Nous contacter')
      cy.get('.t-contact-us-form').within(($inForm) => {
        cy.get('.contact-us-button').should('contain', 'Envoyer').should('be.disabled')

        cy.get('.t-checkbox').parent().click()
        const dataInfos = [
          { label: 'NEPH', value: Cypress.env('NEPH') },
          { label: 'Nom de naissance', value: Cypress.env('candidat') },
          { label: 'Prénom', value: Cypress.env('firstName') },
          { label: 'Courriel', value: Cypress.env('emailCandidat') },
          { label: 'Portable', value: Cypress.env('portableCandidatContactUs') },
        ]
        dataInfos.forEach(({ label, value }, index) => {
          cy.get('label').eq(index + 1).should('contain', label)
          cy.get('input').eq(index + 1).type(value)
          cy.get('.contact-us-button').should('contain', 'Envoyer').should('be.disabled')
        })
        cy.get('.t-select-departements .v-input__slot').click()
      })
      cy.get('.v-list-item')
        .contains(Cypress.env('departement'))
        .click()
      cy.get('.contact-us-button').should('contain', 'Envoyer').should('be.disabled')
      cy.get('.t-contact-us-form').within(($inForm) => {
        const dataInfos = [
          { label: 'Objet du message', value: subject },
          { label: 'Message', value: message },
        ]
        dataInfos.forEach(({ label, value, typeTag }, index) => {
          cy.get('label').eq(index + 7).should('contain', label)
          cy.get('input, textarea').eq(index + 8).type(value)
        })
        cy.get('.contact-us-button').should('contain', 'Envoyer').click()
      })

      cy.get('.v-snack--active').should(
        'contain',
        'Votre demande a été envoyé.',
      )

      cy.getLastMail({ recipient: Cypress.env('emailRepartiteur') })
        .then($mail => {
          cy.wrap($mail)
            .getSubject()
            .should('contain', subject)
          cy.wrap($mail)
            .its('Content.Body')
            .should('contain', message)
        })

      cy.getLastMail({ subject: subjectForCandidat, recipient: Cypress.env('emailCandidat') })
        .getSubject().should('contain', subjectForCandidat)
    })
  } else {
    it('skip for message CODIV 19', () => { cy.log('skip for message CODIV 19') })
  }
})