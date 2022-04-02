const { Router } = require('express')
const { request } = require('../helper/database')
const panel = require('../helper/functions')
const errors = require('../helper/errors')
const permissions = require('../helper/permissions')

const router = new Router()

router.use(async (req, res, next) => {
    if(!(res.locals.session.user.privileges & permissions.ManageBadges)) return panel.alert(req, res, 'danger', errors.PERMISSIONS_MISSING, '/errors/403')
    next()
})

router.get('/', async (req, res) => {
    res.locals.title = 'Badges';

    const badges = await request('SELECT * FROM badges')

    res.render('badges', { badges })
})

router.get('/create', async (req, res) => {
    res.locals.title = 'Create badge';

    const badges = await request('SELECT id FROM badges ORDER BY id DESC LIMIT 1')

    const id = parseInt(badges[0].id) + 1

    res.render('actions/badges/create', { id })
})

router.post('/create', async (req, res) => {
    const { name, icon } = req.body

    await request(`INSERT INTO badges (name, icon) VALUES ('${name}', '${icon}')`)

    res.redirect('/badges')
})

module.exports = router