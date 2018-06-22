const config = require('./config');
const steem = require('steem');

let database = require('mysql').createConnection(config.database);

database.connect((err) => {
    if (err) throw err;
    console.log("Database connection etablished!");
});

database.addMessage = async (id, author, permlink) => {
    return new Promise((resolve, reject) => {
        let sql = "INSERT INTO message (discord_id, author, permlink, posted) VALUES (?,?,?,?)";
        database.query(sql, [id, author, permlink, (new Date()).toISOString().slice(0, 19).replace('T', ' ')], (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(true);
            }
        })
    })
};

database.getMessagesToVote = async () => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM message WHERE voted = 0";
        database.query(sql, (err, result) => {
            if (err) {
                reject(err);
                console.log(err);
            } else {
                resolve(result);
            }
        })
    })
}

database.getMessage = async (author, permlink) => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM message where author = ? and permlink = ?";
        database.query(sql, [author, permlink], (err, result) => {
            if (err) {
                reject(err);
                console.log(err);
            } else {
                resolve(result);
            }
        })
    })
};

database.getMessages = async () => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM message";
        database.query(sql, (err, result) => {
            if (err) {
                reject(err);
                console.log(err);
            } else {
                resolve(result);
            }
        })
    })
};

database.existMessage = async (author, permlink) => {
    let message = await database.getMessage(author, permlink);
    return new Promise((resolve, reject) => {
        if (message.length === 0) {
            resolve(false);
        } else {
            resolve(true)
        }
    })
};

database.updateReactions = async (id, reactions) => {
    return new Promise((resolve, reject) => {
        let sql = "UPDATE message SET up = ?, down = ? WHERE discord_id = ?";
        database.query(sql, [reactions.up, reactions.down, id], (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(true);
            }
        })
    })
};

function calculateVote(post) {
    let base = 2000;
    base = base + (post.up * 100 * .5);
    base = base - (post.down * 100 * -1);
    if (base < config.discord.curation.votes.min) {
        base = config.discord.curation.votes.min
    }
    if (base > config.discord.curation.votes.max) {
        base = config.discord.curation.votes.max
    }
    return base;
}

module.exports = {
    DTubeLink: (str) => {
        let words = str.split(' ')
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (word.startsWith('https://d.tube'))
                return word
        }
        console.log('end')
        return
    },
    calculateVote,
    countReaction: (message) => {
        let reactions = {up: -1, down: -1};
        let up = message.reactions.get(config.discord.curation.up);
        let down = message.reactions.get(config.discord.curation.down);
        if (up) {
            reactions.up = reactions.up + up.count;
        } else {
            reactions.up = 0;
        }

        if (down) {
            reactions.down = reactions.down + down.count;
        } else {
            reactions.down = 0;
        }

        return reactions;

    },
    getMinutesSincePost: (posted) => {
        let diff = (new Date()).getTime() - posted.getTime();
        return (diff / 60000);
    },
    vote: async (author, permlink, client) => {
        let message = await database.getMessage(author, permlink)[0];
        return new Promise((resolve, reject) => {
            client
                .guilds
                .get(config.discord.curation.guild)
                .channels
                .get(config.discord.curation.channel)
                .fetchMessage(message.discord_id).then(post => {
                helper.database.updateReactions(post.id, helper.countReaction(post)).then(async () => {
                    message = await database.getMessage(author, permlink)[0];
                    let weight = calculateVote(message);
                    steem.broadcast.vote(
                        config.steem.wif,
                        config.steem.account, // Voter
                        author, // Author
                        permlink, // Permlink
                        weight,
                        (err, result_bc) => {
                            if (err) {
                                console.log(err);
                                reject(err);
                            } else {
                                let sql = "UPDATE message SET voted = 1, vote_weight = ? WHERE author = ? and permlink = ?";
                                database.query(sql, [weight, author, permlink], (err, result) => {
                                    console.log("Voted with " + (weight / 100) + "% for @" + author + '/' + permlink)
                                    resolve(result_bc);
                                })
                            }
                        }
                    );
                })
            });

        })
    },
    database
};