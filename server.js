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

const { SETTINGS } = require('./config')
const localDB = (SETTINGS.localhost) ? 
    require('./db'):"Actual DB connection";

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
app.get('/discordlogin', (req, res) => {
    discord.getToken(req.query.code)
        .then(result => {
            discord.connectDiscordUser(result.access_token)
                .then(userInfo => {
                    //console.log(userInfo)
                    //console.log(result)
                    if(isConnectedToTwitch(userInfo.connections)){
                        const twitchLink = userInfo.connections.find(connection => {
                            return connection.type === "twitch"
                        })
                        const newUser = localDB.addUser(userInfo.identity.id, twitchLink.id, twitchLink.name)
                        const matchingGuildID = discord.getMatchingGuildId(userInfo.identity.id)
                        localDB.addGuild(matchingGuildID, newUser.twitch_id)
                        if(result.scope === 'bot')
                            res.redirect(twitch.getTwitchLogin())
                        else
                            res.send({userInfo})
                    }
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
                const { channelInfo, token } = result
                const guild_id = localDB.getGuildByTwitchID(channelInfo.token.user_id)
                if(guild_id){
                    localDB.addBroadcaster(channelInfo.token.user_id, guild_id, channelInfo.token.user_name, token)
                    discord.sendVerificationToOwner(guild_id, channelInfo.token.user_name)
                    res.send(`Thank you for linking your Channel Subs to Sync Bot ${channelInfo.token.user_name}`)
                }
                else{
                    res.send(`Something went wrong :(`)
                }
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