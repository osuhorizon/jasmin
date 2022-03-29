const path = require('path');
const session = require("express-session");
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const store = new session.MemoryStore()
const bodyParser = require('body-parser')
const app = express();
const moment = require('moment')

const { connect, request, get } = require('./helper/database');

connect();

app.use(expressLayouts)
app.use(express.json())
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use(session({
    secret: 'secret',
    cookie: { maxAge: 30000 },
    resave: false,
    saveUninitialized: false,
    store
}));

app.use(async (req, res, next) => {
    res.locals.moment = moment
    res.locals.system = require('./helper/functions')
    res.locals.login = false;
    res.locals.error = false;
    next();
})

app.use('/auth', require('./router/authRouter'))
app.use('/users', require('./router/userRouter'))

// app.use('*/assets', express.static(__dirname + '/assets'));
app.use('*/static', express.static(__dirname + '/static'));

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '/templates'));

app.get('/', async (req, res) => {
    if(!req.session.authenticated) return res.redirect('/login');
    res.redirect('/dashboard')
})

app.get('/login', async (req, res) => {
    res.locals.title = 'Login';
    res.locals.login = true
    res.render('login')
})

app.get('/dashboard', async (req, res) => {
    res.locals.title = 'Dashboard';

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
        plays : recentPlayed
    })
})

app.get('/logs/:page', async (req, res) => {
    res.locals.title = 'Logs';

    const logs = await request(`SELECT l.*, u.username FROM rap_logs l JOIN users u ON l.userid = u.id ORDER BY id DESC LIMIT ${(req.params.page == 0 ? 0 : req.params.page - 1) * 100}, 100`)
    const count = await request("SELECT COUNT(*) count FROM rap_logs")

    res.render('logs', { logs, page: req.params.page, pages: Math.ceil(count[0].count / 100) })
})

app.listen(2446, () => {
    console.log('Server running on port 2446');
});