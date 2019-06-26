const express = require('express')
const app = express()
const path = require('path')
const port = 8000;
const cors = require('cors')
const fs = require('fs')
const uuid = require('uuid/v4')

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

let allSessions = {}
app.get('/discordconnect', (req, res) => {
    discord.getToken(req.query.code)
        .then(result => {
            console.log(result)
            discord.connectDiscordUser(result.access_token)
                .then(userInfo => {
                    if(isConnectedToTwitch(userInfo.connections))
                        res.send({userInfo})
                    else{
                        const session = uuid();
                        allSessions[session] = userInfo;
                        console.log(session)
                        res.send({
                            userInfo,
                            session
                        })
                    }
                })
                .catch(err => {
                    res.send(`Error: ${err}`)
                })
        })
        .catch(err => {
            res.send(`Error: ${err}`)
        })
})

const isConnectedToTwitch = (connectArr) => {
    const length = connectArr.length
    for(let i = 0; i < length; ++i){
        if(connectArr[0].type === "twitch")
            return true;
    }
    return false;
}

app.get('/twitchsync', (req, res) => {
    res.redirect(twitch.getTwitchLogin())
})

app.get('/twitchlink', (req, res) => {
    res.json({
        name:"Twitch",
        url:twitch.getTwitchLogin()
    })
})

app.get('/twitchlesserlink', (req, res) => {
    res.json({
        name:"Twitch",
        url:twitch.getLesserTwitchLogin()
    })
})

app.get('/twitchlogin', (req, res) => {
    twitch.getTwitchInfo(req.query.code)
        .then(result => {
            if(result.type === "Viewer"){
                res.send(`Thanks for linking your twitch account to Sync Bot ${result.accountInfo.data[0].display_name}!`)
            }
            else if(result.type === "Broadcaster"){
                res.send(`Thank you for linking your Channel Subs to Sync Bot ${result.channelInfo.token.user_name}`)
            }
            else{
                res.send(`Failed to Get Info`)
            }
        })
        .catch(err => {
            res.send(`Error: ${err}`)
        })
})

// to be deleted after testing is done
app.get('/demo', async (req, res) => {
    let session = uuid()
    try{
        let userInfo = await JSON.parse(fs.readFileSync('./subs/discordlogin.json'))
        allSessions[session] = userInfo
        console.log(allSessions)
        res.status(200).json({
            userInfo,
            session
        })
    }
    catch(err){
        res.status(404).json(err)
    }
})

app.listen(port, () => {
    `Listening on port ${port}`
})