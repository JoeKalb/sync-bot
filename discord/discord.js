const { Client, Attachment, RichEmbed } = require('discord.js')
let formurlencoded = require('form-urlencoded').default;
const client = new Client();
const fetch = require('node-fetch')
const stringSimilarity = require('string-similarity');
const fs = require('fs')
const twitch = require('../twitch/twitch')

const { DISCORD } = require('../config')

client.login(DISCORD.bot_token)

const CURRENTURL = 'http://localhost:8000/'
client.on('ready', () => {
    client.guilds.forEach(guild => {
        guild.members.forEach(member => {
            //console.log(member.user.username)
        })
    })
})

client.on('guildCreate', (guild) => {
    const embed = new RichEmbed()
        .setTitle('Final Steps')
        .setColor(0xF04747)
        .setDescription('Here are the final steps to getting Sync Bot up and running!')
        .addField('1) Elevate the "Sync Bot" Role in your Discord Server', `Server Drop Down Menu("v")>"Server Settings">"Roles">Drag "Sync Bot" above all the roles you wish it to control>"Save Changes"\nReply with "!gifs" for visual aids.\n`)
        .addField('2) Authorize Sync Bot to see your Twitch Subs', `Click the link below to give Sync Bot access to your twitch channel subs.\n${CURRENTURL}twitchsync`)
        .addField('3) CONGRATULATIONS!', `The regular setup is now completed but all settings are set to default. For more options visit the site linked below.\n${CURRENTURL}`)
    guild.owner.send(`Sync Bot has now been added to your discord server ${guild.name}! There are just a few more steps to go!`, embed)
})

client.on('message', msg => {
    if(msg.channel.type === "dm" && msg.content == '!gifs'){
        gifVisualDirections(msg.author)
    }
    if(msg.channel.type === "dm" && msg.content == '!'){
        msg.author.send(getDiscordLesserLogin())
    }
})

client.getToken = async (code) => {
    const data = {
        'client_id': DISCORD.client_id,
        'client_secret': DISCORD.client_secret,
        'grant_type':'authorization_code',
        'code': code,
        'redirect_uri': DISCORD.redirect_uri,
        'scope': 'bot'
    }
    const body = formurlencoded(data)

    let res = await fetch(DISCORD.token_url, {
        method: 'POST',
        headers:{
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    })
    let json = await res.json()
    return json
}

client.getRefreshToken = async (refresh_token) => {
    const data = {
        'client_id': DISCORD.client_id,
        'client_secret': DISCORD.client_secret,
        'grant_type':'refresh_token',
        'refresh_token': refresh_token,
        'redirect_uri': DISCORD.redirect_uri,
        'scope': 'bot'
    }
    const body = formurlencoded(data)

    let res = await fetch(DISCORD.token_url, {
        method: 'POST',
        headers:{
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    })
    let json = await res.json()
    return json
}

client.getDiscordLogin = () => {
    const result = DISCORD.login_url.replace('<redirect_uri>', encodeURIComponent(DISCORD.redirect_uri))
    return result;
}

const getDiscordLesserLogin = () => {
    const result = DISCORD.login_url_user.replace('<redirect_uri>', encodeURIComponent(DISCORD.redirect_uri))
    return result;
}
const BASEURL = 'https://discordapp.com/api/v6'

const getUserConnections = async (token) => {
    let res = await fetch(`${BASEURL}/users/@me/connections`, {
        headers:{
            'Authorization': `Bearer ${token}`
        }
    })
    let json = await res.json()
    return json;
}

const getUserIdentity = async (token) => {
    let res = await fetch(`${BASEURL}/users/@me`, {
        headers:{
            'Authorization':`Bearer ${token}`
        }
    })
    let json = await res.json()
    return json
}

client.connectDiscordUser = async (token) => {
    let connections = await getUserConnections(token)
    let identity = await getUserIdentity(token)
    return {
        connections,
        identity
    }
}

client.getGuildIntegrations = async (guild_id) => {
    let res = await fetch(`${BASEURL}/guilds/${guild_id}/integrations`)
    let json = await res.json()
    return json;
}

const gifVisualDirections = (channelOwner) => {
    const gifDirections = [
        `1) "Server Settings"`,
        `2) "Roles"`,
        `3) Drag "Sync Bot" above all roles you want it to control`,
        `4) Don't forget to "Save Changes"`
    ]
    for(let i = 1; i < 5; ++i){
        setTimeout(() => {
            channelOwner.send(gifDirections[i-1],new Attachment(`./gifs/syncBot_part_${i}.gif`))
        }, i*1000)
    }
}

client.syncSubTiersToRoles = (twitchInfo) => {
    console.log(twitchInfo)
    const guild = client.guilds.find(val => val.owner.name == 'JoeFish')
    if(guild){
        return `Guild Found: ${guild.name}`
    }
    else
        return `Guild for broadcast ${twitchInfo.channelInfo.token.user_name} not found`
}

module.exports = client;