const fetch = require('node-fetch')
const fs = require('fs')

const { TWITCH } = require('../config')

const getToken = async (code) => {
    try{
        let res = await fetch(`${TWITCH.token_url}?client_id=${TWITCH.client_id}&client_secret=${TWITCH.client_secret}&code=${code}&grant_type=authorization_code&redirect_uri=${TWITCH.redirect_uri}`, {
            method: 'POST'
        })
        let json = await res.json()
        return json
    }
    catch(err){
        return {err}
    }
    
}

const getRefreshToken = async (refresh_token) => {
    console.log(refresh_token)
    try{
        let res = await fetch(`${TWITCH.token_url}?grant_type=refresh_token&refreshtoken=${refresh_token}&client_id=${TWITCH.client_id}&client_secret=${TWITCH.client_secret}`, {
            method: 'POST',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        })
        let json = await res.json()
        console.log(json)
        return json
    }
    catch(err){
        return {err}
    }
    
}

const getChannelInfo = async (token) => {
    try{
        let res = await fetch('https://api.twitch.tv/kraken',{
            headers: {
                'Authorization':`OAuth ${token}`,
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID':TWITCH.client_id
            }
        })
        let json = await res.json()
        return json
    }
    catch(err){
        console.log(err)
        return {err}
    }
}

const getIndivChannelSub = async (token, broad_id, user_id) => {
    try{
        let res = await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${broad_id}&user_id=${user_id}`,{
            headers:{
                'Authorization': `Bearer ${token}`
            }
        })
        let json = res.json()
        return json
    }
    catch(err){
        console.log(err)
        return {err}
    }
}

const getAllChannelSubsHelper = async (user_id, token) => {
    let offset = 0;
    let subs = []
    let subsFromCall = 100;
    const limit = 100;
    let total = 1;
    while(subs.length < total){
        //console.log(`Current offset: ${offset}`)
        try{
            let res = await fetch(`https://api.twitch.tv/kraken/channels/${user_id}/subscriptions?limit=${limit}&offset=${offset}`, {
                headers:{
                    'Accept': 'application/vnd.twitchtv.v5+json',
                    'Authorization': `OAuth ${token}`,
                }
            })
            let json = await res.json()
            if(json.error)
                return false;
            
            total = json._total;
            subs = [...subs, ...json.subscriptions]
            subsFromCall = json.subscriptions.length
            //console.log(`Subs in Call: ${subsFromCall}`)
        }
        catch(err){
            console.log(err)
            subsFromCall = 0;
            return false;
        }
        ++offset;
    }
    return subs
}

const getChannelInfoAuthorized = async (token, username) => {
    try{
        let res = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
            headers:{
                'Authorization': `Bearer ${token}`
            }
        })
        let json = await res.json()
        return json;
    }
    catch(err){
        console.log(err)
        return {err}
    }
}

const getChannelInfoOnlyName = async (username) => {
    try{
        let res = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
            'Client-ID':TWITCH.client_id
        })
        let json = await res.json()
        return json
    }
    catch(err){
        console.log(err)
        return {err}
    }
}

const getTwitchInfo = async (code) => {
    try{
        let token = await getToken(code)
        let channelInfo = await getChannelInfo(token.access_token)
        if(channelInfo.token.authorization.scopes[0] == 'user:read:email'){
            let accountInfo = await getChannelInfoAuthorized(token.access_token, channelInfo.token.user_name)
            return {
                type:"Viewer",
                accountInfo
            };
        }
        else if(channelInfo.token.valid){
            let subs = await getAllChannelSubsHelper(channelInfo.token.user_id, token.access_token)
            /* fs.writeFileSync(`./subs/${channelInfo.token.user_name}Subs.json`, JSON.stringify({
                token,
                channelInfo,
                subs
            })) */
            return {
                type:"Broadcaster",
                token,
                channelInfo,
                subs
            }
        }
        return 'Did not work'
    }
    catch(err){
        console.log(err)
        return {err}
    }
}

const getTwitchLogin = () => {
    const result = TWITCH.login_url.replace('<redirect_uri>', TWITCH.redirect_uri).replace('<client_id>', TWITCH.client_id)
    return result;
}

const getLesserTwitchLogin = () => {
    const result = TWITCH.verify_account.replace('<redirect_uri>', TWITCH.redirect_uri).replace('<client_id>', TWITCH.client_id)
    return result;
}

module.exports = {
    getChannelInfoOnlyName,
    getTwitchInfo,
    getTwitchLogin,
    getLesserTwitchLogin,
    getRefreshToken,
    getAllChannelSubsHelper
}