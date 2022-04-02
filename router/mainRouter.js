const { Router } = require('express')
const { request, get } = require('../helper/database')

const router = new Router()

router.get('/', async (req, res) => {
    if(!req.session.authenticated) return res.redirect('/login');
    res.redirect('/dashboard')
})

router.get('/login', async (req, res) => {
    res.locals.title = 'Login';
    res.locals.login = true
    res.render('login')
})

router.get('/dashboard', async (req, res) => {
    const fetch = require('node-fetch')
    res.locals.title = 'Dashboard';

    let banchoStatus = false;
    let letsStatus = false;
    let apiStatus = false;

    const [ BanchoRequest, LetsRequest, APIRequest ] = await Promise.all([
        fetch('https://c.lemres.de/api/v1/serverStatus'),
        fetch('https://lemres.de/letsapi/v1/status'),
        fetch('https://lemres.de/api/v1/ping')
    ])

    if(BanchoRequest.status == 200){
        banchoStatus = true;
    }

    if(LetsRequest.status == 200){
        letsStatus = true;
    }

    if(APIRequest.status == 200){
        apiStatus = true;
    }

    const data = {
        onlineUsers : await get("ripple:online_users"),
        registeredUsers : await get("ripple:registered_users"),
        totalPP : await get("ripple:total_pp"),
        totalPlays : await get("ripple:total_plays"),
        totalScores : await get("ripple:total_submitted_scores")
    }

    const mostPlayed = await request("SELECT * FROM beatmaps ORDER BY playcount DESC LIMIT 1")
    const recentPlayed = await request("SELECT s.*, u.username, b.song_name FROM scores s JOIN users u ON u.id = s.userid JOIN beatmaps b ON s.beatmap_md5 = b.beatmap_md5 WHERE completed > 0 ORDER BY time DESC LIMIT 15")

    res.render('dashboard', { 
        data,
        mostplayed : mostPlayed[0],
        plays : recentPlayed,
        BanchoStatus : banchoStatus,
        LetsStatus : letsStatus,
        APIStatus : apiStatus
    })
})


router.get('/logs/:page', async (req, res) => {
    res.locals.title = 'Logs';

    const logs = await request(`SELECT l.*, u.username FROM rap_logs l JOIN users u ON l.userid = u.id ORDER BY id DESC LIMIT ${(req.params.page == 0 ? 0 : req.params.page - 1) * 100}, 100`)
    const count = await request("SELECT COUNT(*) count FROM rap_logs")

    res.render('logs', { logs, page: req.params.page, pages: Math.ceil(count[0].count / 100) })
})


module.exports = router