const { Router } = require('express')
const { request, get } = require('../helper/database')
const md5 = require('md5')
const bcrypt = require('bcrypt')

const router = new Router()

router.get('/:page', async function (req, res){
    const users = await request(`SELECT u.*, s.country FROM users u JOIN users_stats s ON u.id = s.id WHERE u.id > 999 ORDER BY id ASC LIMIT ${(req.params.page == 0 ? 0 : req.params.page - 1) * 100}, 100`)

    res.locals.title = 'Users'

    res.render("users", {users: users, page: req.params.page, pages: Math.ceil(await get("ripple:registered_users") / 100)})

})

router.get('/:id/edit', async function (req, res) {
    let user = await request(`SELECT u.*, s.current_status, s.country, s.userpage_content, s.badges_shown, ip.ip FROM users u JOIN users_stats s ON u.id = s.id JOIN ip_user ip ON u.id = ip.userid WHERE u.id = ${req.params.id}`)
    const privileges = await request(`SELECT * FROM privileges_groups`)
    const badges = await request("SELECT * FROM badges")
    if(user.length == 0) return res.redirect('/users')

    res.locals.title = 'Edit User'

    res.render('user', { user: user[0], privileges : privileges, countries: require('../helper/countries.json'), badges : badges })

})

module.exports = router