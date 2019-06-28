const { Client, Attachment, RichEmbed } = require('discord.js')
let formurlencoded = require('form-urlencoded').default;
const client = new Client();
const fetch = require('node-fetch')
const stringSimilarity = require('string-similarity');
const fs = require('fs')
const twitch = require('../twitch/twitch')

const { DISCORD, SETTINGS } = require('../config')

const localDB = (SETTINGS.localhost) ? 
    require('../db'):"Actual DB connection";

client.login(DISCORD.bot_token)

const CURRENTURL = 'http://localhost:8000/'
client.on('ready', () => {
    'Discord Bot is up and Running!'
})

client.on('guildCreate', (guild) => {
    const embed = new RichEmbed()
        .setTitle('Final Steps')
        .setColor(0xF04747)
        .setDescription('Here are the final steps to getting Sync Bot up and running!')
        .addField('Elevate the "Sync Bot" Role in your Discord Server', `Server Drop Down Menu("v")>"Server Settings">"Roles">Drag "Sync Bot" above all the roles you wish it to control>"Save Changes"\nReply with "!gifs" for visual aids.\n`)
        .addField(`Authorize Sync Bot to see your Twitch Subs if you Haven't Already`, `Click the link below to give Sync Bot access to your twitch channel subs.\n${CURRENTURL}twitchsync`)
        //.addField('3) CONGRATULATIONS!', `The regular setup is now completed but all settings are set to default. For more options visit the site linked below.\n${CURRENTURL}`)
    guild.owner.send(embed)
})

client.on('message', msg => {
    const ownerGuildID = ownerSetUp(msg)
    if(ownerGuildID){
        if(msg.content.substr(0, 1) !== '!')
            return
        const args = msg.content.trim().slice(1).split(' ')
        const commandName = args[0]
        switch(commandName){
            case('gifs'):
                gifVisualDirections(msg.author)
                break
            case('set'):
                msg.author.send(`Set a tier sub role with "!t<number> <role name>"\nEx: !t3 iPhone Xs Max Owners`)
                break
            case('link'):
                msg.author.send(getDiscordLesserLogin())
                break
            case('t1'):
                let t1 = findClosestMatch(commandName, args, ownerGuildID)
                msg.author.send(`Set Tier 1 subs to ${t1} role.`)
                break
            case('t2'):
                let t2 = findClosestMatch(commandName, args, ownerGuildID)
                msg.author.send(`Set Tier 2 subs to ${t2} role.`)
                break
            case('t3'):
                let t3 = findClosestMatch(commandName, args, ownerGuildID)
                msg.author.send(`Set Tier 3 subs to ${t3} role.`)
                break
            case('sync'):
                msg.channel.startTyping()
                const user = localDB.getUser(msg.author.id)
                let caster = localDB.getBroadcaster(user.twitch_id)
                //console.log(caster)
                syncUsers(user.twitch_id, caster)
                    .then(subs => {
                        editSubRoles(ownerGuildID , subs)
                        msg.channel.stopTyping()
                        msg.author.send('Subs Updated')
                    })
                break
            case('roles'):
                let roles = []
                const guild = client.guilds.find(guild => guild.id === ownerGuildID)
                guild.roles.forEach(role => {
                    roles = [...roles, role.name]
                })
                roles = [`Below are all the roles available in the ${guild.name} server.`, ...roles]
                msg.author.send(roles)
                break
            default:
        }
    }
})

const editSubRoles = (guild_id, subs) => {
    let map = {}
    subs.forEach(sub => {
        map[sub.user._id] = sub.sub_plan
    })
    const guild = client.guilds.find(guild => guild.id === guild_id)
    const guild_data = localDB.getGuild(guild_id)
    guild.members.forEach(member => {
        const user = localDB.getUser(member.id)
        if(user && map.hasOwnProperty(user.twitch_id)){
            if(map[user.twitch_id] === "3000"){
                member.addRole(guild_data.t3)
                member.removeRole(guild_data.t2)
            }
            else if(map[user.twitch_id] === "2000"){
                member.addRole(guild_data.t2)
                member.removeRole(guild_data.t3)
            }
        }
        else
            member.removeRoles([guild_data.t2, guild_data.t3])
    })
}

const syncUsers = async (twitch_id, caster) => {
    let subs = await 
        twitch.getAllChannelSubsHelper(twitch_id, caster.twitch_token.access_token)
    return subs;
}

const findClosestMatch = (commandName, args, ownerGuildID) => {
    const inputRole = args.slice(1, args.length).join(' ')
    const guild = client.guilds.find(guild => guild.id === ownerGuildID)
    let roleNames = []
    let roleID = []

    guild.roles.forEach(role => {
        roleNames = [...roleNames, role.name]
        roleID = [...roleID, role.id]
    })

    const matchRatings = stringSimilarity.findBestMatch(inputRole, roleNames)
    localDB.setGuildIndivTier(guild.id, commandName, roleID[matchRatings.bestMatchIndex])

    return matchRatings.bestMatch.target
}

const ownerSetUp = (msg) => {
    let isOwner = false;
    let guild_id = ""
    client.guilds.forEach(guild => {
        if(guild.ownerID === msg.author.id){
            isOwner = true;
            guild_id = guild.id;
        }
    })
    if(msg.channel.type === "dm" && isOwner)
        return guild_id
    return false;
}

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

client.getMatchingGuildId = (owner_id) =>{
    let guild_id = client.guilds.find(guild => guild.ownerID === owner_id).id
    console.log(guild_id)
    return guild_id
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

client.sendVerificationToOwner = (guild_id, twitch_name) => {
    const guild = client.guilds.find(guild => guild.id === guild_id)
    let sub, t2, t3;
    guild.roles.forEach(role => {
        let regexSub = /twitch subs/i
        let regexT2 = /2/
        let regexT3 = /3/
        if(regexSub.test(role.name)){
            sub = role;
        }
        else if(regexT2.test(role.name)){
            t2 = role
        }
        else if(regexT3.test(role.name)){
            t3 = role
        }
    })
    console.log(guild_id, sub.id)
    localDB.setGuildTierRoles(guild_id,
        (sub.id)?sub.id:"",
        (t2.id)?t2.id:"",
        (t3.id)?t3.id:"")
    
    const embed = new RichEmbed()
        .setTitle('All Synced Up!')
        .setColor(0xF04747)
        .setDescription(`Sync Bot has linked the following Server and Channel together!`)
        .addField('Discord Server', `${guild.name}`, true)
        .addField('Twitch Channel', `${twitch_name}`, true)
        .addField('Roll Settings', `Sync Bot will guess what sub tiers match your discord roles. "!set" for help.`)
        .addField('General Twitch Sub Role', 
            `${(sub.name)? sub.name: `Response with "!t1 <role name>" to set this role`}`, true)
        .addField('Tier 2 Sub Role', 
            `${(t2.name)? t2.name: `Response with "!t2 <role name>" to set this role`}`, true)
        .addField('Tier 3 Sub Role',
            `${(t3.name)? t3.name: `Response with "!t3 <role name>" to set this role`}`, true)
        .setImage('https://media.giphy.com/media/F9hQLAVhWnL56/giphy.gif')
    guild.owner.send(embed)
}

module.exports = client;