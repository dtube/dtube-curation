let config = {
    discord: {
        token: "NDYwMDk4Njk4NzU2NzUxMzcw.Dg_0SA.ox0LCqtnvrru7nEqd40B9CI2wBY",
        curation: {
            channel: "459820794273333263",
            guild: "347020217966395393",
            curation_emojis: {
                up: "👍",
                down: "👎",
                one_hundred: "💯",
                game_die: "🎲",
                heart: '❤'
            },
            other_emojis: {
                clock: "⏰",
                check: "✅",
                cross: "❌",
            },
            votes: {
                min: 100,
                max: 3500
            },
            timeout_minutes: 30
        }
    },
    steem: {
        wif: "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg",
        account: "guest123"
    },
    database: {
        host: "localhost",
        user: "root",
        password: "Yesowuhixu",
        database: "dtube"
    }
}

module.exports = config
