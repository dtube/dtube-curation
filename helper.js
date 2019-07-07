const config = require('./config');
const steem = require('steem');
const javalon = require('javalon');

let database = require('mysql').createConnection(config.database);

database.connect((err) => {
    if (err) throw err;
    console.log("Database connection etablished!");
    database.query("set session sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';", () => {
        console.log("Initialized Database")
    })
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

database.getMessageSummary = async(days) => {
    return new Promise((resolve, reject) => {
        let sql = "select Count(id) as count, posted from message m WHERE m.posted > CURDATE() - INTERVAL ? DAY GROUP BY Day(m.posted);";
        database.query(sql,[days], (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(result.reverse());
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
};

database.getMessage = async (author, permlink) => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM message where author = ? and permlink = ?";
        database.query(sql, [author, permlink], (err, result) => {
            if (err) {
                reject(err);
                console.log(err);
            } else {
                if (result.length != 1)
                    resolve(null);
                else
                    resolve(result[0]);
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

database.countMessages = async () => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT Count(id) as count FROM message";
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

database.countCurators = async () => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT Count(DISTINCT(discord_id)) as count FROM message";
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
        if (!message) resolve(false);
        else resolve(true)
    })
};

database.updateReactions = async (id, reactions) => {
    return new Promise((resolve, reject) => {
        let sql = "UPDATE message SET ? WHERE voted = 0 and discord_id = " + id;
        database.query(sql, reactions, (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(true);
            }
        })
    })
};

database.feedBackExist = async (author, permlink) => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * from feedback where author = ? and permlink = ?";
        database.query(sql, [author, permlink], (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(result);
            }
        })
    });
};

database.addFeedback = async (from, msg, author, permlink) => {
    let sql = "INSERT INTO feedback (discord,message,author,permlink) VALUES (?,?,?,?)";
    return new Promise((resolve, reject) => {

        database.query(sql, [from, msg, author, permlink], (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(true);
            }
        })
    });
};

function calculateVote(post) {
    console.log(post)
    if (post.one_hundred >= 3)
        return 10000;

    let weight = 0;

    // add up all the weights
    for (let i = 0; i < post.game_die; i++)
        weight += 100 * (1 + Math.floor(Math.random() * 6));
    for (let i = 0; i < post.heart; i++)
        weight += 1500;
    for (let i = 0; i < post.up; i++)
        weight += 500;
    for (let i = 0; i < post.unicorn; i++)
        weight += 2500;
    for (let i = 0; i < post.down; i++)
        weight -= 500;

    // if there is a disagrement, no vote
    if (weight > 0 && post.down > 0)
        return 0;

    if (weight > 10000)
        weight = 10000;

    return weight
}

function countReaction(message) {
    let reactions = {};
    for (const key in config.discord.curation.curation_emojis)
        reactions[key] =
            message.reactions.get(config.discord.curation.curation_emojis[key]) ?
                message.reactions.get(config.discord.curation.curation_emojis[key]).count
                : 0;

    return reactions;
}

function generatePermlink() {
    let permlink = ""
    let possible = "abcdefghijklmnopqrstuvwxyz0123456789"

    for (let i = 0; i < 8; i++) {
        permlink += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return permlink
}

module.exports = {
    DTubeLink: (str) => {
        let words = str.split(' ');
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (word.startsWith('https://d.tube'))
                return word
        }

    },
    calculateVote,
    countReaction,
    generatePermlink,
    getMinutesSincePost: (posted) => {
        let diff = (new Date()).getTime() - posted.getTime();
        return (diff / 60000);
    },
    vote: async (message, client) => {
        return new Promise((resolve, reject) => {
            client
                .guilds
                .get(config.discord.curation.guild)
                .channels
                .get(config.discord.curation.channel)
                .fetchMessage(message.discord_id).then(post => {
                database.updateReactions(post.id, countReaction(post)).then(async () => {
                    let weight = calculateVote(message);
                    if (weight === 0) {
                        reject('Weight=0')
                    } else {
                        console.log('voting', message.author + '/' + message.permlink, weight);

                        // voting on avalon
                        var newTx = {
                            type: javalon.TransactionType.VOTE,
                            data: {
                                author: message.author,
                                link: message.permlink,
                                vt: weight*config.avalon.vtMultiplier,
                                tag: ''
                            }
                        }
                        
                        newTx = javalon.sign(config.avalon.wif, config.avalon.account, newTx)

                        javalon.sendRawTransaction(newTx, function(err, res) {
                            if (!err) {
                                let sql = "UPDATE message SET voted = 1, vote_weight = ? WHERE author = ? and permlink = ?";
                                database.query(sql, [weight, message.author, message.permlink], (err, result) => {
                                    console.log("Voted with " + (weight / 100) + "% for @" + message.author + '/' + message.permlink);
                                    resolve({});
                                })
                            }
                        })

                        javalon.getContent(message.author, message.permlink, function(err, res) {
                            if (res.json && res.json.refs) {
                                for (let i = 0; i < res.json.refs.length; i++) {
                                    var ref = res.json.refs[i].split('/')
                                    if (ref[0] == 'steem') {
                                        // voting on steem !
                                        steem.broadcast.vote(
                                            config.steem.wif,
                                            config.steem.account, // Voter
                                            ref[1], // Author
                                            ref[2], // Permlink
                                            weight,
                                            (err, result_bc) => {
                                                if (err) {
                                                    reject(err);
                                                }
                                            }
                                        );
                                        // making sure its only spending one vote :)
                                        break;
                                    }
                                }
                            }
                        })
                    }


                })
            });

        })
    },
    database
};