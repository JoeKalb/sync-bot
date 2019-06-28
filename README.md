# Sync Bot
## A #HackWeek Discord Bot

> Sync Bot helps to manage Discord roles related to Twitch sub tiers. No more having to manually look through every channel sub to make sure that people have the correct roles!

> Note: Since twitch already manages a general Twitch Subscribers role through the server integerations, having that connected is a prerequisite to having the bot work. If twitch is not already integrated to the users account and server the bot will promp them to the [Twitch Integration FAQ](https://support.discordapp.com/hc/en-us/articles/212112068-Twitch-Integration-FAQ).  

To get the bot up and running you'll need both discord and twitch api credentials. The `config.js` file will have the following format and sit on the top level of the app.

```
module.exports = {
    DISCORD:{
        client_id:"<client id>",
        client_secret:"<client secret>",
        scope:"bot",
        redirect_uri:"<discord redirect uri>",
        login_url:"<Discord OAUTH2 URL GENERATER SCOPRES = [identify, connections, bot] BOT PERMISSIONS = [Manage Roles, All Text Permissions]>",
        login_url_user:"<Discord OAUTH2 URL GENERATER SCOPRES = [identify, connections]>",
        token_url:"https://discordapp.com/api/oauth2/token",
        bot_token:"<bot token>"
    },
    TWITCH:{
        client_id:"<client id>",
        client_secret:"<client secret>",
        scope:"channel:read:subscriptions+channel_subscriptions",
        response_type:"code",
        redirect_uri:"<twitch redirect uri>",
        login_url:"https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=<client_id>&redirect_uri=<redirect_uri>&scope=channel:read:subscriptions+channel_subscriptions",
        token_url:"https://id.twitch.tv/oauth2/token",
        verify_account:"https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=<client_id>&redirect_uri=<redirect_uri>&scope=user:read:email"
    },
    SETTINGS:{
        localhost:"true"
    }
}
```

After that is finished only a few simple node commands are needed

```
npm install
node .
```
[Click here to invite the bot to your server](http://localhost:8000)

Once Sync Bot is added to your discord it will prompt you to elevate it's role in order to manage the other roles beneth it. 