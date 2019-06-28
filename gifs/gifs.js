const gifsList = [
    'https://media.giphy.com/media/F9hQLAVhWnL56/giphy.gif',
    'https://tenor.com/view/thabuttress-eyebrows-gif-13565868',
    'https://tenor.com/4qka.gif',
    'https://tenor.com/5NAc.gif',
    'https://tenor.com/4QVK.gif',
    'https://tenor.com/5Nzo.gif',
    'https://gph.is/2qLgXli'
]

const randomGif = () => {
    return gifsList[Math.floor(Math.random() * gifsList.length)]
}

module.exports = {
    randomGif
}