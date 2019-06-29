const gifsList = [
    'https://media.giphy.com/media/F9hQLAVhWnL56/giphy.gif',
    'https://media.giphy.com/media/TbYgHMnICI1A4/giphy.gif',
    'https://media.giphy.com/media/9yZlYdTpB1V2U/giphy.gif',
    'https://media.giphy.com/media/jnVnopFu8omBE2lLzY/giphy.gif',
    'https://media.giphy.com/media/RMYATXO5PQ6zhwxfPC/giphy.gif',
    'https://media.giphy.com/media/Q8m8pJRlmChqm2AH0p/giphy.gif',
    'https://media.giphy.com/media/Y3FvDlbT53Om7xwAPk/giphy.gif',
    'https://media.giphy.com/media/RLkcGcTtWc7QyQZqSM/giphy.gif',
    'https://media.giphy.com/media/OMH0r40qUNOXS/giphy.gif',
    'https://media.giphy.com/media/11YMhfLfGoq5Gg/giphy.gif',
    'https://media.giphy.com/media/g1EGGf9NymomY/giphy.gif',
    'https://media.giphy.com/media/ZtB2l3jHiJsFa/giphy.gif',
    'https://media.giphy.com/media/AFdcYElkoNAUE/giphy.gif',
    'https://media.giphy.com/media/vncgdgPWLwGRi/giphy.gif',
    'https://media.giphy.com/media/diUKszNTUghVe/giphy.gif',
    'https://media.giphy.com/media/brDwVn5kGIz3W/giphy.gif',
    'https://media.giphy.com/media/14bhmZtBNhVnIk/giphy.gif',
    'https://media.giphy.com/media/BIuuwHRNKs15C/giphy.gif',
    'https://media.giphy.com/media/1fj7LPAGBMiCfxqtQy/giphy.gif',
    'https://media.giphy.com/media/3NnnS6Q8hVPZC/giphy.gif',
    'https://media.giphy.com/media/IzfJSTepKi5vW/giphy.gif',
    'https://media.giphy.com/media/mIZ9rPeMKefm0/giphy.gif',
    'https://media.giphy.com/media/BWD3CtcudWL28/giphy.gif',
    'https://media.giphy.com/media/bqxbgri8lBSzvMVI3Y/giphy.gif',
    'https://media.giphy.com/media/39nnEwo17dRoZD69sJ/giphy.gif',
    'https://media.giphy.com/media/RfzzO0Y4SKyJy/giphy.gif',
    'https://media.giphy.com/media/3oKIPzVXlzxhAWamNW/giphy.gif'
]

const getRandomGif = () => {
    return gifsList[Math.floor(Math.random() * gifsList.length)]
}

module.exports = {
    getRandomGif
}