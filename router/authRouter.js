const { Router } = require('express')
const { request } = require('../helper/database')
const md5 = require('md5')
const bcrypt = require('bcrypt')
const { alert } = require('../helper/functions')
const errors = require('../helper/errors')

const router = new Router()

router.post('/login', async function (req, res){
    const { username, password } = req.body;
    if(req.session.authenticated) return res.redirect('/dashboard')

    const userCheck = await request(`SELECT * FROM users WHERE username_safe = '${username.toLowerCase().replaceAll(" ", "_")}'`)
    if(userCheck.length == 0) return alert(req, res, 'danger', errors.ALREADY_LOGGED_IN, '/dashboard')

    const user = userCheck[0]

    if(!await bcrypt.compare(md5(password), user.password_md5)) return alert(req, res, 'danger', errors.PASSWORD_MISMATCH, '/login')

    req.session.authenticated = true
    req.session.user = user
    res.redirect('/dashboard')

})

router.get('/logout', function (req, res) {
    req.session.authenticated = false;
    req.session.user = undefined;
    alert(req, res, 'success', 'Logged out', '/login')
})

module.exports = router