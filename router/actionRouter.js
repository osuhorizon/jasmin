const { Router } = require('express')
const { request, prepared, get } = require('../helper/database')
const md5 = require('md5')
const bcrypt = require('bcrypt')
const config = require('../config.json')
const panel = require('../helper/functions')
const errors = require('../helper/errors')
const permissions = require('../helper/permissions')

const router = new Router()

router.use(async (req, res, next) => {
    admin = res.locals.session.user
    next()
})

router.get('/password/:id', async function(req, res) {
    const user = await request(`SELECT * FROM users WHERE id = ${req.params.id}`)
    if(user.length == 0) return alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    res.locals.title = 'Change Password'

    res.render('actions/password', { user: user[0] })
})

router.post('/password/:id', async function (req, res){
    let user = await request(`SELECT * FROM users WHERE id = ${req.params.id}`)
    if(user.length == 0) return panel.alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    const { newpass, confpass } = req.body
    if(newpass != confpass) return panel.alert(req, res, 'danger', errors.PASSWORD_MISMATCH, `/users/${req.params.id}/password`)

    const password = await bcrypt.hash(md5(newpass), 10)

    await prepared(`UPDATE users SET password_md5 = ? WHERE id = ?`, [password, user[0].id])

    panel.alert(req, res, 'success', 'Password changed', `/users/${req.params.id}/edit`)
})

router.get('/donor/award/:id', async function (req, res) {
    let user = await request(`SELECT * FROM users WHERE id = '${req.params.id}'`)
    if(user.length == 0) return alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    res.locals.title = 'Award Donator'

    res.render('actions/donor', { user: user[0] })
})

router.post('/donor/award/:id', async function (req, res){
    let user = await request(`SELECT * FROM users WHERE id = ${req.params.id}`)
    if(user.length == 0) return panel.alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    const { time } = req.body

    if(donor_expire < Math.round(Date.now() / 1000)){
        await prepared(`UPDATE users SET donor_expire = ? WHERE id = ?`,
        [Math.round(Date.now() / 1000) + parseInt(time * 24 * 60 * 60), user[0].id])
    } else {
        await prepared(`UPDATE users SET donor_expire = ? WHERE id = ?`,
        [parseInt(donor_expire) + parseInt(time * 24 * 60 * 60), user[0].id])
    }
})

router.get('/restrict/:id', async (req, res) => {
    if(!await panel.checkPermission(admin.privileges, permissions.BanUsers)) return panel.alert(req, res, 'danger', errors.PERMISSIONS_MISSING, '/errors/403')
    let user = await request(`SELECT * FROM users WHERE id = ${req.params.id}`)
    if(user.length == 0) return panel.alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    res.locals.title = "Restrict"
    res.render('actions/restrict', { user: user[0] })
})

router.post('/restrict/:id', async (req, res) => {
    if(!await panel.checkPermission(admin.privileges, permissions.BanUsers)) return panel.alert(req, res, 'danger', errors.PERMISSIONS_MISSING, '/errors/403')
    
    let user = await request(`SELECT * FROM users WHERE id = ${req.params.id}`)
    if(user.length == 0) return panel.alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    const { reason } = req.body
    const time = Math.round(Date.now() / 1000)

    if(await panel.checkPermission(user[0].privileges, permissions.UserPublic)){
        request(`UPDATE users SET privileges = ${permissions.UserNormal}, ban_datetime = ${time} WHERE id = ${user[0].id}`)
        panel.addLog(admin.id, `Restricted ${user[0].username}: ${reason}`)
        panel.addNote(user[0].id, `has been restricted by ${admin.username} for: ${reason}`)
        return panel.alert(req, res, 'success', 'User restricted', `/users/${req.params.id}/edit`)
    } else {
        request(`UPDATE users SET privileges = ${permissions.UserNormal + permissions.UserPublic}, ban_datetime = 0 WHERE id = ${user[0].id}`)
        panel.addLog(admin.id, `Unrestricted ${user[0].username}`)
        panel.addNote(user[0].id, `has been unrestricted by ${admin.username}`)
        return panel.alert(req, res, 'success', 'User unrestricted', `/users/${req.params.id}/edit`)
    }
})

router.get('/ban/:id', async (req, res) => {
    if(!await panel.checkPermission(admin.privileges, permissions.BanUsers)) return panel.alert(req, res, 'danger', errors.PERMISSIONS_MISSING, '/errors/403')
    let user = await request(`SELECT * FROM users WHERE id = ${req.params.id}`)
    if(user.length == 0) return panel.alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    res.locals.title = "Ban"
    res.render('actions/ban', { user: user[0] })
})

router.post('/ban/:id', async (req, res) => {
    if(!await panel.checkPermission(admin.privileges, permissions.BanUsers)) return panel.alert(req, res, 'danger', errors.PERMISSIONS_MISSING, '/errors/403')
    
    let user = await request(`SELECT * FROM users WHERE id = ${req.params.id}`)
    if(user.length == 0) return panel.alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    const { reason } = req.body
    const time = Math.round(Date.now() / 1000)

    if(await panel.checkPermission(user[0].privileges, permissions.UserNormal)){
        request(`UPDATE users SET privileges = ${permissions.NoPriv}, ban_datetime = ${time} WHERE id = ${user[0].id}`)
        panel.addLog(admin.id, `Banned ${user[0].username}: ${reason}`)
        panel.addNote(user[0].id, `has been banned by ${admin.username} for: ${reason}`)
        return panel.alert(req, res, 'success', 'User banned', `/users/${req.params.id}/edit`)
    } else {
        request(`UPDATE users SET privileges = ${permissions.UserNormal + permissions.UserPublic}, ban_datetime = 0 WHERE id = ${user[0].id}`)
        panel.addLog(admin.id, `Unbanned ${user[0].username}`)
        panel.addNote(user[0].id, `has been unbanned by ${admin.username}`)
        return panel.alert(req, res, 'success', 'User unbanned', `/users/${req.params.id}/edit`)
    }
})

router.get('/wipe/:id', async (req, res) => {
    if(!await panel.checkPermission(admin.privileges, permissions.WipeUsers)) return panel.alert(req, res, 'danger', errors.PERMISSIONS_MISSING, `/users/${req.params.id}/edit`)
    let user = await request(`SELECT * FROM users WHERE id = ${req.params.id}`)
    if(user.length == 0) return panel.alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    res.locals.title = "Wipe"
    res.render('actions/wipe', { user: user[0] })
})

router.post('/wipe/:id', async (req, res) => {
    if(!await panel.checkPermission(admin.privileges, permissions.WipeUsers)) return panel.alert(req, res, 'danger', errors.PERMISSIONS_MISSING, '/errors/403')

    let user = await request(`SELECT * FROM users WHERE id = ${req.params.id}`)
    if(user.length == 0) return panel.alert(req, res, 'danger', errors.USER_NOT_FOUND, '/users')

    const tables = ["", "_relax", "_ap", "_v2"]
    const modeNames = ["Standard", "Taiko", "Catch the Beat", "Mania"]
    const modNames = ["Vanilla", "Relax", "Autopilot", "ScoreV2"]

    const { mod, mode } = req.body

    if(mod == -1){
        for(let i = 0; i < tables.length; i++){
            request(`DELETE FROM scores${tables[i]} WHERE userid = ${user[0].id} ${mode != -1 ? "AND mode = " + mode : ""}`)
        }
        panel.addLog(admin.id, `Wiped ${user[0].username}`)
        panel.addNote(user[0].id, `has been wiped by ${admin.username}`)
    } else {
        const table = tables[mod]
        request(`DELETE FROM scores${table} WHERE userid = ${user[0].id} ${mode != -1 ? "AND mode = " + mode : ""}`)
        panel.addLog(admin.id, `Wiped ${user[0].username} ${mode != -1 ? "on " + modeNames[mode] + " " : ""}(${modNames[mod]})`)
        panel.addNote(user[0].id, `has been wiped by ${admin.username} ${mode != -1 ? "on " + modeNames[mode] + " " : ""}(${modNames[mod]})`)
    }

    return panel.alert(req, res, 'success', 'User wiped', `/users/${req.params.id}/edit`)
})

module.exports = router