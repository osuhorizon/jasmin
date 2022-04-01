const { Router } = require('express')

const router = new Router()

router.use(async (req, res, next) => {
    res.locals.error = true;
    next()
})

router.get('/403', async (req, res) => {
    res.locals.title = '403';
    res.render('errors/403')
})


module.exports = router