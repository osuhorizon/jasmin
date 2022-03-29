const { Router } = require('express')
const { request } = require('../helper/database')
const md5 = require('md5')
const bcrypt = require('bcrypt')

const router = new Router()

router.post('/login', async function (req, res){
    console.log(req.body)
    const { username, password } = req.body;
    if(req.session.authenticated) return res.redirect('/dashboard')

    const userCheck = await request(`SELECT * FROM users WHERE username_safe = '${username.toLowerCase().replaceAll(" ", "_")}'`)
    if(userCheck.length == 0){
        res.locals.alert = "Username not found"
        return res.redirect('/login')
    }

    const user = userCheck[0]

    if(!await bcrypt.compare(md5(password), user.password_md5)){
        res.locals.alert = "Password incorrect"
        return res.redirect('/login')
    }

    req.session.authenticated = true
    req.session.user = user
    res.redirect('/dashboard')

})

router.post('/logout', function (req, res) {
    if(!req.session.authenticated) return res.sendStatus(403, 'Not authenticated')

    req.session.authenticated = false;
    req.session.user = undefined;
    return res.sendStatus(200)

})

module.exports = router