let config = {
    discord: {
        token: "NDUxNTE5MTM4MDI4ODQ3MTE1.Dg2bTQ.MP1xX4vgz2F8Zdshs_xntAorXKM",
        curation: {
            channel: "459485361450778645",
            guild: "451518794335125514",
            curation_emojis: {
                up: "👍",
                down: "👎",
                one_hundred: "💯",
                game_die: "🎲",
                heart: "❤️"
            },
            other_emojis: {
                clock: "⏰",
                check: "✔️",
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
