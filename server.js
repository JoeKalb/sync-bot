const express = require('express')
const app = express()
const path = require('path')
const port = 8000;
const cors = require('cors')

const discord = require('./discord/discord')
const twitch = require('./twitch/twitch')

const FRONTEND = 'http://localhost:3000/'

app.use(cors())

app.get('/', (req, res) => {
    res.redirect(FRONTEND)
})

app.get('/discordlink', (req, res) => {
    res.json({
        name:"Discord",
        url:discord.getDiscordLogin()
    })
})

app.get('/discordlogin', (req, res) => {
    discord.getToken(req.query.code)
        .then(result => {
            console.log(result)
            discord.connectDiscordUser(result.access_token)
                .then(userInfo => {
                    res.send({userInfo})
                })
                .catch(err => {
                    res.send(`Error: ${err}`)
                })
        })
        .catch(err => {
            res.send(`Error: ${err}`)
        })
})

app.get('/twitchsync', (req, res) => {
    res.redirect(twitch.getTwitchLogin())
})

app.get('/twitchlink', (req, res) => {
    res.json({
        name:"Twitch",
        url:twitch.getTwitchLogin()
    })
})

app.get('/twitchlogin', (req, res) => {
    twitch.getAllChannelSubs(req.query.code)
        .then(result => {
            console.log(result)
            if(result.type === "Viewer"){
                res.send(`Thanks for linking your twitch account to Sync Bot ${result.accountInfo.data[0].display_name}!`)
            }
            else if(result.type === "Broadcaster"){
                res.send(`Thank you for linking your twitch account ${result.channelInfo.token.user_name}`)
            }
            else{
                res.send(`Failed to Get Info`)
            }
        })
        .catch(err => {
            res.send(`Error: ${err}`)
        })
})

app.listen(port, () => {
    `Listening on port ${port}`
})