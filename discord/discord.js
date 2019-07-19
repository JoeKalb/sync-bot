const { Client, Attachment, RichEmbed } = require('discord.js')
let formurlencoded = require('form-urlencoded').default;
const client = new Client();
const fetch = require('node-fetch')
const stringSimilarity = require('string-similarity')
const twitch = require('../twitch/twitch')
const gifs = require('../gifs/gifs')

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
        .setTitle('ONE MORE THING!')
        .setColor(0xF04747)
        .setDescription('The final steps to getting Sync Bot up and running!')
        .addField('Elevate the "Sync Bot" Role in your Discord Server', `Server Drop Down Menu("v")>"Server Settings">"Roles">Drag "Sync Bot" above all the roles you wish it to control>"Save Changes"\nReply with "!gifs" for visual aids.\n`)
        .addField(`!commands`, 'Show all commands available by doing "!commands"')
    try{
        guild.owner.send(embed)
    }catch(err){
        console.log(err)
    }
})

client.on('guildMemberAdd', member => {
    let userInfo = localDB.getUser(member.id)
    if(userInfo){
        let guild = localDB.getGuild(member.guild.id)
        let caster = localDB.getBroadcaster(guild.owner_twitch_id)
        twitch.getIndivChannelSub(caster.twitch_token.access_token, guild.owner_twitch_id, userInfo.twitch_id)
            .then(res => {
                if(res.tier){
                    const { t2, t3 } = guild;
                    if(res.tier === "3000"){
                        member.addRole(t3)
                        member.removeRole(t2)
                    }
                    else if(res.tier === "2000"){
                        member.addRole(t2)
                        member.removeRole(t3)
                    }
                }
                else
                    console.log(`${member.user.username} not subbed!`)
            })
            .catch(err => {
                console.log(err)
            })
    }
    else{
        const guildName = member.guild.name;
        const text = `The Discord Server ${guildName} has Sync Bot! Click the link to make sure you get the proper Tier Sub Role ${CURRENTURL}discord/sync/member`
        member.send(text)
    }
})

client.on('message', msg => {
    try{
        const ownerGuildID = ownerSetUp(msg)
        if(ownerGuildID){
            if(msg.content.substr(0, 1) !== '!')
                return
            const args = msg.content.trim().slice(1).split(' ')
            const commandName = args[0]
            switch(commandName){
                case('commands'):
                    const commands = [
                        '!link - provides link to share with other members of your server',
                        '!gifs - show gifs to elevate the "Sync Bot" role in your discord',
                        '!roles - display all discord roles in your server',
                        '!set - how to set the different tier subs to discord roles',
                        '!t<sub tier number> <role name> - set a specific sub tier to a role',
                        '!invite - send invite to server members that already have Twitch Synced to their discord account',
                        '!invite all - send the Sync Bot Invite to everyone on the Server!',
                        '!sync - will grab your current subs from twitch and reset everyones to the proper tier',
                    ]
                    msg.author.send(commands)
                    break
                case ('invite'):
                    const currentGuild = client.guilds.find(guild => guild.id === ownerGuildID)
                    let isSynced;
                    if(args.length === 1){
                        const twitchRoleID = localDB.getGuild(ownerGuildID).t1
                        const role = currentGuild.roles.find(role => role.id === twitchRoleID)
                        role.members.forEach(member => {
                            isSynced = localDB.getUser(member.id)
                            if(!isSynced)
                                member.send(`The Discord Server ${currentGuild.name} has added Sync Bot! Click the link to make sure you get the proper Tier Sub Role ${CURRENTURL}discord/sync/member`)
                        })
                        
                    }
                    else if(args[1] == 'all'){
                        currentGuild.members.forEach(member => {
                            isSynced = localDB.getUser(member.id)
                            if(!isSynced)
                                console.log(`The Discord Server ${currentGuild.name} has added Sync Bot! Click the link to make sure you get the proper Tier Sub Role ${CURRENTURL}discord/sync/member`)
                        })
                    }
                    break
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
                            msg.channel.stopTyping()
                            if(!subs){
                                msg.author.send([
                                    `OH NO! Sync Bot needs to reconnect to twitch.`,
                                    `Click the link below and then do !sync again.`,
                                    `${CURRENTURL}twitchsync`
                                ])
                            }
                            else{
                                const canMangeRoles = editSubRoles(ownerGuildID , subs)
    
                                if(canMangeRoles){
                                    msg.author.send('Subs Updated')
                                }
                                else{
                                    msg.author.send([`Sync Bot's role is lower than roles it's trying to manage.`,
                                    `Please elevate the "Sync Bot" role in your server settings.`,
                                    `!gifs - for the visual aids to show you how`])
                                }
                            }
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
    }
    catch(err){
        console.log(err)
    }
})

const editSubRoles = (guild_id, subs) => {
    let map = {}
    console.log(subs)
    subs.forEach(sub => {
        map[sub.user_id] = sub.sub_plan
    })
    const guild = client.guilds.find(guild => guild.id === guild_id)
    const guild_data = localDB.getGuild(guild_id)

    // check that Sync Bot has a higher role than the ones its trying to change
    const syncBot = guild.members.find(member => member.id === client.user.id)
    const syncBotRole = syncBot.roles.find(role => role.name === "Sync Bot")

    const t2Role = guild.roles.find(role => role.id === guild_data.t2)
    const t3Role = guild.roles.find(role => role.id === guild_data.t3)

    if(syncBotRole.comparePositionTo(t2Role) < 0
        && syncBotRole.comparePositionTo(t3Role) < 0){
        console.log('Sync Bot role setting is too low!')
        return false;
    }

    guild.members.forEach(member => {
        try{
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
        }
        catch(err){
            console.log(err)
        }
    })

    return true;
}

const syncUsers = async (twitch_id, caster) => {
    try{
        let subs = await 
            twitch.getAllChannelSubHelix(twitch_id, caster.twitch_token.access_token)
        return subs;
    }
    catch(err){
        console.log(err)
        return false;
    }
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
    try{
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
    catch(err){
        console.log(err)
    }
}

client.getRefreshToken = async (refresh_token) => {
    try{
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
    catch(err){
        console.log(err)
    }
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
    try{
        let res = await fetch(`${BASEURL}/users/@me/connections`, {
            headers:{
                'Authorization': `Bearer ${token}`
            }
        })
        let json = await res.json()
        return json;
    }
    catch(err){
        console.log(err)
    }
}

const getUserIdentity = async (token) => {
    try{
        let res = await fetch(`${BASEURL}/users/@me`, {
            headers:{
                'Authorization':`Bearer ${token}`
            }
        })
        let json = await res.json()
        return json
    }
    catch(err){
        console.log(err)
        return{err}
    }
}

client.connectDiscordUser = async (token) => {
    try{
        let connections = await getUserConnections(token)
        let identity = await getUserIdentity(token)
        return {
            connections,
            identity
        }
    }
    catch(err){
        console.log(err)
        return {err}
    }
}

client.getGuildIntegrations = async (guild_id) => {
    try{
        let res = await fetch(`${BASEURL}/guilds/${guild_id}/integrations`)
        let json = await res.json()
        return json;
    }
    catch(err){
        console.log(err)
        return {err}
    }
}

client.getMatchingGuildId = (owner_id) =>{
    let guild_id = client.guilds.find(guild => guild.ownerID === owner_id).id
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

    localDB.setGuildTierRoles(guild_id,
        (sub.id)?sub.id:"",
        (t2.id)?t2.id:"",
        (t3.id)?t3.id:"")
    
    try{
        const embed = new RichEmbed()
            .setTitle('All Synced Up!')
            .setColor(0xF04747)
            .setDescription(`Sync Bot has linked the following Server and Channel together!`)
            .addField('Discord Server', `${guild.name}`, true)
            .addField('Twitch Channel', `${twitch_name}`, true)
            .addBlankField()
            .addField('Twitch Sub Role', 
                `${(sub.name)? sub.name: `Response with "!t1 <role name>" to set this role`}`, true)
            .addField('Tier 2 Sub Role', 
                `${(t2.name)? t2.name: `Response with "!t2 <role name>" to set this role`}`, true)
            .addField('Tier 3 Sub Role',
                `${(t3.name)? t3.name: `Response with "!t3 <role name>" to set this role`}`, true)
                .addField('Roll Settings', `Sync Bot will guess what sub tiers match your discord roles. "!set" for help.`, true)
            .addField('Everything look good?', 
                [`!command - to see all commands`,
                `!invite - send the Sync Bot link to all current Twitch Subs who have yet to join Sync Bot`,
                `!invite all - to send the Sync Bot link to`,
                `!sync - set the roles for anyone that is signed into sync bot!`
            ])
            .setImage(gifs.getRandomGif())
        guild.owner.send(embed)
    }
    catch(err){
        console.log(err)
    }
    
}

client.getDiscordLesserLogin = () => {
    return getDiscordLesserLogin()
}

module.exports = client;