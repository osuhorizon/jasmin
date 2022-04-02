const { Router } = require('express')
const { request, prepared } = require('../helper/database')
const { alert } = require('../helper/functions')
const permissions = require('../helper/permissions')

const router = new Router()

router.get('/bancho', async (req, res) => {
    if(!(res.locals.session.user.privileges & permissions.ManageServers)) return res.redirect('/errors/403')
    res.locals.title = 'Bancho';

    const values = await request('SELECT * FROM bancho_settings')

    const bancho = {
        maintenance : values[0].value_int,
        icon : values[2].value_string,
        login : values[5].value_string
    }

    res.render('settings/bancho', { bancho })
})

router.post('/bancho', async (req, res) => {
    if(!(res.locals.session.user.privileges & permissions.ManageServers)) return res.redirect('/errors/403')
    const { maintenance, icon, login } = req.body

    request(`UPDATE bancho_settings SET value_int = ${maintenance} WHERE id = 1`)
    prepared(`UPDATE bancho_settings SET value_string = ? WHERE id = 3`, [icon])
    prepared(`UPDATE bancho_settings SET value_string = ? WHERE id = 6`, [login])

    alert(req, res, 'success', 'Bancho settings updated', '/settings/bancho')
})

router.get('/system', async (req, res) => {
    if(!(res.locals.session.user.privileges & permissions.ManageSettings)) return res.redirect('/errors/403')
    res.locals.title = 'System';

    const values = await request('SELECT * FROM system_settings')

    const settings = {
        webMaintenance : values[0].value_int,
        banchoMaintenance : values[1].value_int,
        globalAlert : values[2].value_string,
        homeAlert : values[3].value_string,
        register : values[4].value_int
    }

    res.render('settings/system', { settings })
})

router.post('/system', async (req, res) => {
    if(!(res.locals.session.user.privileges & permissions.ManageSettings)) return res.redirect('/errors/403')
    const { webMaintenance, banchoMaintenance, globalAlert, homeAlert, register } = req.body

    request(`UPDATE system_settings SET value_int = ${webMaintenance} WHERE id = 1`)
    request(`UPDATE system_settings SET value_int = ${banchoMaintenance} WHERE id = 2`)
    request(`UPDATE system_settings SET value_int = ${register} WHERE id = 5`)
    prepared(`UPDATE system_settings SET value_string = ? WHERE id = 3`, [globalAlert])
    prepared(`UPDATE system_settings SET value_string = ? WHERE id = 4`, [homeAlert])

    alert(req, res, 'success', 'System settings updated', '/settings/system')
})

module.exports = router