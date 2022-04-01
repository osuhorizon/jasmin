const { prepared, request, get } = require('./database')

module.exports = {
    alert : async function(req, res, type, message, redirect){
        req.session.lastAlert = {
            type: type,
            message: message
        }
        res.redirect(redirect)
    },

    checkPermission : async function(privileges, privilege){
        return (privileges & privilege) != 0
    },

    checkPermissionSync : function(privileges, privilege){
        return (privileges & privilege) != 0
    },

    addLog : async function(admin, message){
        await prepared(`INSERT INTO rap_logs (userid, text, datetime, through) VALUES (?, ?, ?, ?)`, 
        [admin, message, Math.round(Date.now() / 1000), 'Admin Panel'])
    },

    addNote : async function(user, message){
        let check = await request(`SELECT * FROM users WHERE id = ${user}`)
        if(check.length == 0) return
        await prepared(`UPDATE users SET notes = ? WHERE id = ?`, [`${check[0].notes != null ? `${check[0].notes}\n` : ''}[${await this.getDate()}] ${message}`, user])
    },

    getDate : async function(){
        let d = new Date(Math.round(Date.now()))
        let year = `${d.getFullYear()}`
        let month = `${d.getMonth() + 1 < 10 ? "0" + d.getMonth() : d.getMonth()}`
        let day = `${d.getDate() < 10 ? "0" + d.getDate() : d.getDate()}`
        let hours = `${d.getHours() < 10 ? "0" + d.getHours() : d.getHours()}`
        let minutes = `${d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes()}`
        let seconds = `${d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds()}`
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }
}