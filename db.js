// this database will mimic a real one while storing users in the folder "/local"
const fs = require('fs')

const localUsers = './local/users.json'
const localBroadcasters = './local/broadcasters.json'
const localGuilds = './local/guilds.json'

let users = JSON.parse(fs.readFileSync(localUsers))
let broadcasters = JSON.parse(fs.readFileSync(localBroadcasters))
let guilds = JSON.parse(fs.readFileSync(localGuilds))

const addUser = (discord_id, twitch_id, twitch_name) => {
    users[discord_id] = {
        twitch_id,
        twitch_name
    }
    fs.writeFileSync(localUsers, JSON.stringify(users))
    return users[discord_id];
}

const getUser = (discord_id) => {
    if(users.hasOwnProperty(discord_id))
        return users[discord_id]
    return false
}

const getUserDiscordIDByTwitchID = (twitch_id) => {
    for(let [key, val] of Object.entries(users)){
        if(val.twitch_id == twitch_id)
            return key;
    }
    return false;
}

const addBroadcaster = (twitch_id, guild_id, twitch_name, twitch_token) => {
    broadcasters[twitch_id] = {
        guild_id,
        twitch_name,
        twitch_token
    }
    fs.writeFileSync(localBroadcasters, JSON.stringify(broadcasters))
}

const getBroadcaster = (twitch_id) => {
    if(broadcasters.hasOwnProperty(twitch_id))
        return broadcasters[twitch_id]
    return false
}

const setNewBroadcasterToken = (twitch_id, newToken) => {
    broadcasters[twitch_id].twitch_token = newToken
    fs.writeFileSync(localBroadcasters, JSON.stringify(broadcasters))
    return broadcasters[twitch_id]
}

const addGuild = (guild_id, owner_twitch_id) => {
    guilds[guild_id] = {
        owner_twitch_id,
        t1:"",
        t2:"",
        t3:""
    }
    fs.writeFileSync(localGuilds, JSON.stringify(guilds))
}

const setGuildTierRoles = (guild_id, roleSubs, roleT2, roleT3) => {
    if(guilds.hasOwnProperty(guild_id)){
        guilds[guild_id].t1 = roleSubs
        guilds[guild_id].t2 = roleT2
        guilds[guild_id].t3 = roleT3
    }
    fs.writeFileSync(localGuilds, JSON.stringify(guilds))
}

const setGuildIndivTier = (guild_id, tierName, role_id) => {
    if(guilds.hasOwnProperty(guild_id)){
        guilds[guild_id][tierName] = role_id
    }
    fs.writeFileSync(localGuilds, JSON.stringify(guilds))
}

const getGuild = (guild_id) => {
    if(guilds.hasOwnProperty(guild_id))
        return guilds[guild_id]
    return false
}

const getGuildByTwitchID = (twitch_id) => {
    return Object.keys(guilds).find(key => guilds[key].owner_twitch_id == twitch_id)
}

const deleteGuild = (guild_id) => {
    delete guilds[guild_id]
    fs.writeFileSync(localGuilds, JSON.stringify(guilds))
}

module.exports = {
    addUser,
    getUser,
    getUserDiscordIDByTwitchID,
    addBroadcaster,
    getBroadcaster,
    setNewBroadcasterToken,
    addGuild,
    getGuild,
    getGuildByTwitchID,
    setGuildTierRoles,
    setGuildIndivTier,
    deleteGuild
}