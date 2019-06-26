var token = process.env.token || ''
var wif = process.env.wif || '5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg'
var wifAvalon = process.env.wif_avalon || ''
var account = process.env.account || 'guest123'
var db_addr = process.env.db_addr || 'localhost'
var db_user = process.env.db_user || 'root'
var db_pass = process.env.db_pass || ''
var db_database = process.env.db_database || 'dtube'
var channel = process.env.channel || ''
var guild = process.env.guild || '347020217966395393'


let config = {
    discord: {
        token: token,
        curation: {
            channel: channel, // the channel where the curation takes place
            guild: guild, // the guild where the curation takes place
            curation_emojis: { // this emojis are used by the bot to calculate the vote
                up: "👍",
                down: "👎",
                one_hundred: "💯",
                game_die: "🎲",
                unicorn: "🦄",
                heart: '❤'
            },
            other_emojis: {
                clock: "⏰", // waiting for curators to add reactions
                check: "✅", // voted
                cross: "❌", // not voted
            },
            votes: {
                min: 100,
                max: 3500
            },
            timeout_minutes: 15 // wait x minutes after posting until the bot votes
        }
    },
    steem: {
        wif: wif,
        account: account
    },
    avalon: {
        account: account,
        wif: wifAvalon,
        vtMultiplier: 10
    },
    database: {
        host: db_addr,
        user: db_user,
        password: db_pass,
        database: db_database
    },
    mod_settings: {
        enabled: true,
        group_name: "mods",
        faq: {
            "error": [ // the key. Usage like !faq error
                "I'm getting an ERROR when trying to upload a video, what do?", // the displayed question
                "Log out of DTube, Clear your Cookies/Cache in your web browser, Log back into DTube with your Steemit \"Posting Key\"" // and the displayed answer
            ],
            "error2": [
                "I'm getting another strange ERROR, What could be wrong?",
                "Try making sure you don't have the hashtag character in your tags (#)"
            ],
            "video_spec": [
                "What is the best video spec to use for DTube?",
                "We suggest 720p (.mp4) at 30fps."
            ],
            "video_formats": [
                "Can I use other video formats?",
                "We suggest you use only .mp4 at the moment. If you need to transcode your videos from one spec to other, Google \"Handbrake Encoder\""
            ],
            "video_delete": [
                "How do I delete a video?",
                "You cannot delete the info off the blockchain but you can erase your hash codes so your video will become unviewable. Edit>Advance>Then delete the hash codes. You might want to delete your Steemit post information also."
            ],
            "4k": [
                "Can I upload in 4k?",
                "Sorry 4K is not supported at the moment."
            ],
            "snap_size": [
                "What is the best Snap image size?",
                "We suggest 1280 x 720 at 72dpi (.jpg) or (.png)"
            ],
            "snap_replace": [
                "I need to replace my \"Snap\" (Thumbnail). How do I do this?",
                "Please swap out the old \"Snap Hash\" with a the new one. In the \"EDIT>ADVANCE\" settings. Please watch this video: (https://d.tube/#!/v/reseller/a3khbeck)"
            ],
            "tags": [
                "How many tags can I use?",
                "Please use up to (4) Four. The 5th will default to #dtube "
            ],
            "bot_vote": [
                "When will I get a DTube upvote?",
                "DTube upvotes are not guaranteed to anyone. We suggest posting quality videos to DTube on a regular basis. This will better your chance at our curators seeing them. If we miss your video, it does NOT reflect on you as an artist and suggest becoming a daily video contributor to the platform."
            ],
            "beneficiary": [
                "Does DTube take 25% of our Author Rewards?",
                "no, DTube currently takes 10%, previously DTube took more and used it to directly reward curators, this program has now ended"
            ],
            "playback_error": [
                "Why can't I view my newly uploaded video?",
                "The Decentralized IPFS Nodes are catching up and might take up to 15 minutes to view after upload."
            ],
            "playback_error_old": [
                "Why wont my older videos play?",
                "We delete some older videos off the server to save on server space."
            ],
            "password": [
                "I lost my Password, Can you Help?",
                "Unfortunately. No we cant because we didnt create your account and due to how the blockchain works you can not just get an email with a new password. If your account was hacked, created at steemit.com and you still have your old owner key go here to recover your account: https://steemit.com/recover_account_step_1"
            ],
            "video_quality": [
                "My Video is only showing \"Source\", is there something wrong?",
                "If your video is over 20 Minutes long it will only show \"Source\""
            ]
        }
    }
};

module.exports = config;
