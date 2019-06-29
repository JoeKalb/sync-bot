const express = require('express')
const app = express()
const path = require('path')
const port = process.env.PORT || 8000;
const cors = require('cors')
const fs = require('fs')
const uuid = require('uuid/v4')

const discord = require('./discord/discord')
const twitch = require('./twitch/twitch')

const { SETTINGS } = require('./config')
const localDB = (SETTINGS.localhost) ? 
    require('./db'):"Actual DB connection";

//app.use(cors())

app.get('/', (req, res) => {
    res.redirect(discord.getDiscordLogin())
})

app.get('/discord/sync/member', (req, res) => {
    res.redirect(discord.getDiscordLesserLogin())
})

let allSessions = {}
app.get('/discordlogin', (req, res) => {
    discord.getToken(req.query.code)
        .then(result => {
            discord.connectDiscordUser(result.access_token)
                .then(userInfo => {
                    if(isConnectedToTwitch(userInfo.connections)){
                        const twitchLink = userInfo.connections.find(connection => {
                            return connection.type === "twitch"
                        })
                        const newUser = localDB.addUser(userInfo.identity.id, twitchLink.id, twitchLink.name)
                        if(result.scope === 'bot'){
                            const matchingGuildID = discord.getMatchingGuildId(userInfo.identity.id)
                            localDB.addGuild(matchingGuildID, newUser.twitch_id)
                            res.redirect(twitch.getTwitchLogin())
                        }
                        else
                            res.redirect(twitch.getLesserTwitchLogin())
                    }
                    else{
                        const session = uuid();
                        allSessions[session] = userInfo;
                        console.log(session)
                        res.redirect('https://cdn.discordapp.com/attachments/137074521940164608/594049398934208524/unknown.png')
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

app.get('/twitchuser', (req, res) => {
    res.redirect(twitch.getLesserTwitchLogin())
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
            res.redirect(`https://cdn.discordapp.com/attachments/137074521940164608/594049398934208524/unknown.png`)
        })
})

app.listen(port, () => {
    console.log(`Add the Bot Here! http://localhost:8000/`)
})