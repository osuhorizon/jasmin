const { Router } = require('express')
const { request, prepared, get } = require('../helper/database')
const config = require('../config.json')
const errors = require('../helper/errors')
const panel = require('../helper/functions')
const permissions = require('../helper/permissions')

const router = new Router()

router.use(async (req, res, next) => {
    if(!res.locals.session.user.privileges & permissions.ManageUsers) return panel.alert(req, res, 'danger', errors.PERMISSIONS_MISSING, '/errors/403')
    next()
})

router.get('/:page', async function (req, res){
    const users = await request(`SELECT u.*, s.country FROM users u JOIN users_stats s ON u.id = s.id WHERE u.id > 999 ORDER BY id ASC LIMIT ${(req.params.page == 0 ? 0 : req.params.page - 1) * 100}, 100`)
    const privileges = await request(`SELECT * FROM privileges_groups`)

    res.locals.title = 'Users'

    res.render("users", {
        users: users,
        privileges: privileges,
        page: req.params.page, pages: Math.ceil(await get("ripple:registered_users") / 100)
    })

})

router.get('/:id/edit', async function (req, res) {
    let user = await request(`SELECT u.*, s.current_status, s.country, s.userpage_content, s.badges_shown, ip.ip FROM users u JOIN users_stats s ON u.id = s.id JOIN ip_user ip ON u.id = ip.userid WHERE u.id = ${req.params.id}`)
    const privileges = await request(`SELECT * FROM privileges_groups`)
    const badges = await request("SELECT * FROM badges")
    if(user.length == 0) return panel.alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    res.locals.title = 'Edit User'

    res.render('user', { user: user[0], privileges : privileges, countries: require('../helper/countries.json'), badges : badges })

})

router.post('/edit/:id', async function(req, res){
    let user = await request(`SELECT * FROM users WHERE id = ${req.params.id}`)
    if(user.length == 0) return panel.alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    const privilegeGroups = await request(`SELECT * FROM privileges_groups`)
    request(`DELETE FROM badges WHERE user = ${req.params.id}`)

    let { userid, username, aka, email, privilege, notes, country, userpage } = req.body

    const privileges = privilegeGroups.find(p => p.privileges == privilege).privileges

    const badges = [];

    for(var i = 0; i < 6; i++){
        const badge = req.body[`Badge${i+1}`]
        badges.push(badge)
    }

    for(var i = 0; i < badges.length; i++){
        const badge = badges[i]
        if(badge == 0) continue;
        request(`INSERT INTO badges (user, badge) VALUES (${req.params.id}, ${badge})`)
    }

    prepared(`UPDATE users SET username = ?, username_safe = ?, privileges = ?, notes = ?, email = ? WHERE id = ?`,
     [username, username.toLowerCase().replaceAll(" ", "_"), privileges, notes, email, userid])
    prepared(`UPDATE users_stats SET username = ?, username_aka = ?, country = ?, userpage_content = ? WHERE id = ?`,
    [username, aka, country, userpage, userid])
    if(config.relax) prepared(`UPDATE rx_stats SET username = ?, username_aka = ?, country = ? WHERE id = ?`,
    [username, aka, country,  userid])
    if(config.auto) prepared(`UPDATE auto_stats SET username = ?, username_aka = ?, country = ? WHERE id = ?`,
    [username, aka, country, userid])
    if(config.v2) prepared(`UPDATE v2_stats SET username = ?, username_aka = ?, country = ? WHERE id = ?`,
    [username, aka, country, userid])

    res.locals.alert = {
        type: 'success',
        message: 'User edited'
    }

    res.redirect(`/users/${req.params.id}/edit`)
})

module.exports = router