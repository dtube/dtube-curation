const Discord = require('discord.js');
const client = new Discord.Client();
const steem = require("steem");
const javalon = require('javalon');
const asyncjs = require('async')
const fetch = require("node-fetch");
const ChartjsNode = require('chartjs-node');
const chartNode = new ChartjsNode(720, 720 * .5);
const Sentry = require('@sentry/node');
Sentry.init({dsn: 'https://4f28bfc09ac54a2ea8dfaa70413ebc3e@sentry.io/1419531'});

const config = require('./config');
const helper = require('./helper');

client.on('ready', () => {

    console.log(`Logged in as ${client.user.tag}!`);
    client
        .guilds
        .get(config.discord.curation.guild)
        .channels
        .get(config.discord.curation.channel)
        .fetchMessages({limit: 100})
        .then(messages => {
            messages = Array.from(messages);
            messages.forEach(message => {
                helper.database.updateReactions(message[0], helper.countReaction(message[1]));
            })
        })
});

function buildCurationTable(DB_RESULT) {
    DB_RESULT = DB_RESULT.reverse();
    let data = [
        '```+--------+---------+',
        '|Videos  |Date     |',
        '+------------------+',

    ];

    for (let i = 0; i < DB_RESULT.length; i++) {
        data.push("|" +
            DB_RESULT[i].count +
            " ".repeat(8 - DB_RESULT[i].count.toString().length) + "|" +
            (new Date(DB_RESULT[i].posted)).toLocaleDateString("en-US") +
            " ".repeat(9 - (new Date(DB_RESULT[i].posted)).toLocaleDateString("en-US").length) +
            "|"
        );
    }

    data.push('+--------+---------+```');
    return data.join("\n");
}

function createChartOptions(DB_RESULT) {
    DB_RESULT = DB_RESULT.reverse();
    return {
        type: 'line',
        data: {

            labels: DB_RESULT.map(x => (new Date(x.posted)).toLocaleDateString("en-US")),
            datasets: [{
                label: 'Daily Curated Videos',
                data: DB_RESULT.map(x => x.count),
                borderColor: "#ff0000",
                backgroundColor: [
                    'rgba(245,245,245,0.4)'
                ],
                borderWidth: 3
            }]
        },
        options: {
            legend: {
                labels: {
                    fontColor: "white"
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        fontColor: "#FFF",
                    }
                }], xAxes: [{
                    backgroundColor: [
                        'rgba(245,245,245,0.4)'
                    ],
                    ticks: {
                        fontColor: "#FFF"
                    }
                }]
            }
        }
    }
}

function countCurators() {
    return client.guilds.get(config.discord.curation.guild).channels.get(config.discord.curation.channel).permissionOverwrites.filter(x => x.type === 'member').array().length
}

async function getSP(account) {
    let sp = await steem.api.getAccountsAsync([account]);
    let props = await steem.api.getDynamicGlobalPropertiesAsync();
    sp = sp[0];
    return steem.formatter.vestToSteem(parseFloat(sp.vesting_shares) + parseFloat(sp.received_vesting_shares), props.total_vesting_shares, props.total_vesting_fund_steem)

}

async function getVoteValue(vw, user) {
    let vp = parseInt(((await getvotingpower(user))).toFixed(0));
    let sp = await getSP(user);
    let a, n, r, i, o, p = 1e4;

    function calculate(sp, vp, vw) {
        let e = sp, //sp
            t = vp, //vp
            n = vw, // vw
            r = e / a,
            m = parseInt(100 * t * (100 * n) / p);
        m = parseInt((m + 49) / 50);
        let l = parseInt(r * m * 100) * i * o;
        return l.toFixed(2);
    }

    return new Promise((resolve, reject) => {
        steem.api.getRewardFund("post", function (e, t) {
            n = t.reward_balance,
                r = t.recent_claims,
                i = n.replace(" STEEM", "") / r;
            steem.api.getCurrentMedianHistoryPrice(function (e, t) {
                o = t.base.replace(" SBD", "") / t.quote.replace(" STEEM", "");
                steem.api.getDynamicGlobalProperties(function (t, n) {
                    a = n.total_vesting_fund_steem.replace(" STEEM", "") / n.total_vesting_shares.replace(" VESTS", "");
                    resolve(calculate(sp, vp, vw));
                });
            })

        });
    })
}


function getvotingpower(account_name) {
    return new Promise(resolve => {
        steem.api.getAccounts([account_name], function (err, account) {

            account = account[0];
            if (account === undefined) {

                console.log(account_name)
            }
            const totalShares = parseFloat(account.vesting_shares) + parseFloat(account.received_vesting_shares) - parseFloat(account.delegated_vesting_shares) - parseFloat(account.vesting_withdraw_rate);

            const elapsed = Math.floor(Date.now() / 1000) - account.voting_manabar.last_update_time;
            const maxMana = totalShares * 1000000;
            // 432000 sec = 5 days
            let currentMana = parseFloat(account.voting_manabar.current_mana) + elapsed * maxMana / 432000;

            if (currentMana > maxMana) {
                currentMana = maxMana;
            }

            const currentManaPerc = currentMana * 100 / maxMana;

            return resolve(currentManaPerc);
        });
    });
}

async function getBlacklistEntries(user) {
    let blacklist = require("fs").readFileSync(__dirname + "/blacklist").toString().split("\n");
    let entries = await (await fetch("http://blacklist.usesteem.com/user/" + user)).json();
    return {
        entries: entries.blacklisted,
        text: entries.blacklisted.join(", "),
        count: entries.blacklisted.length,
        noVote: blacklist.includes(user)
    }
}

function handleLink(msg) {
    const link = helper.DTubeLink(msg.content);
    let video = new Discord.RichEmbed();
    video.setFooter("Powered by d.tube Curation 🦄")
        .setTimestamp();
    let authorInformation = link.replace('/#!', '').replace('https://d.tube/v/', '').split('/');
    javalon.getContent(authorInformation[0], authorInformation[1], async (err, result) => {
        if (err) {
            msg.reply("Oups! An error occured. See the logs for more details");
            console.log(err);
        } else {
            try {
                let json = result.json
                let posted_ago = Math.round(helper.getMinutesSincePost(new Date(result.ts)));
                if (posted_ago > 2880) {
                    msg.channel.send("This post is too old for curation through d.tube");
                } else {
                    var topTags = []
                    for (const key in result.tags)
                        topTags.push(key)
                    if (topTags.length == 0)
                        topTags.push('No tags yet')
                    video.setTitle(json.title.substr(0, 1024))
                        .setAuthor("@" + result.author, null, "https://d.tube/#!/c/" + result.link)
                        .setThumbnail(json.thumbnailUrl)
                        .setDescription("[Watch Video](" + link + ")")
                        .addField("Tags", topTags.join(', '), true)
                        .addField("Uploaded with "+json.providerName, posted_ago + ' minutes ago', true)
                        .setColor("DARK_NAVY");
                    let exist = await helper.database.existMessage(result.author, result.link);
                    if (!exist) {
                        msg.channel.send({embed: video}).then(async (embed) => {
                            embed.react(config.discord.curation.other_emojis.clock).then(clockReaction => {
                                setTimeout(() => {
                                    clockReaction.remove();
                                    helper.database.getMessage(result.author, result.link).then(message => {
                                        helper.vote(message, client).then(async (tx) => {
                                            let msg = await helper.database.getMessage(result.author, result.link);
                                            embed.react(config.discord.curation.other_emojis.check);
                                            video.addField("Vote Weight", (msg.vote_weight / 100) + "%", true);
                                            embed.edit({embed: video})
                                        }).catch(error => {
                                            let errmsg = "An error occured while voting. Please check the logs!";
                                            try {
                                                errmsg = error.cause.data.stack[0].format.split(":")[1]
                                            } catch (e) {

                                            }
                                            video.addField("ERROR", errmsg);
                                            embed.edit({embed: video});
                                            console.error('Vote failed',);
                                            embed.react(config.discord.curation.other_emojis.cross);
                                        })
                                    })
                                }, 60 * 1000 * config.discord.curation.timeout_minutes)
                            });
                            helper.database.addMessage(embed.id, result.author, result.link)
                        }).catch(error => {
                            console.log(error)
                        });
                    } else {
                        msg.reply("This video has already been posted to the curation channel.").then(reply => {
                            setTimeout(() => {
                                reply.delete();
                            }, 5000)
                        })
                    }
                }

            } catch (err) {
                msg.reply("Oups! An error occured. See the logs for more detauls");
                console.log(err);
            }
        }
    })
}

client.on('message', msg => {
    if (msg.author.bot) {
        return;
    }

    if (msg.content.startsWith("!chart")) {
        let days = parseInt(msg.content.replace("!chart", "").trim());
        if (isNaN(days)) {
            days = 7
        }
        if (days < 1 || days > 14) {
            days = 7
        }

        helper.database.getMessageSummary(days).then(data => {
            chartNode.drawChart(createChartOptions(data))
                .then(() => {
                    return chartNode.getImageBuffer('image/png');
                })
                .then(buffer => {
                    return chartNode.getImageStream('image/png');
                })
                .then(streamResult => {
                    return chartNode.writeImageToFile('image/png', './statistics.png');
                })
                .then(() => {
                    msg.channel.send(buildCurationTable(data), {files: ["./statistics.png"]})
                });
        })
    }

    if (msg.content.startsWith("!status")) {

        const team = [
            "heimindanger",
            "nannal",
            "steeminator3000",
            "wehmoen",
            "hetmasteen",
            "macron"
        ];

        let user = msg.content.replace("!status", "").trim();

        if (steem.utils.validateAccountName(user) !== null) {
            user = "dtube"
        }

        let active = client
            .guilds
            .get(config.discord.curation.guild)
            .channels
            .get(config.discord.curation.channel)
            .members.array();
        let ids = active.map(x => x.user.id);
        let online = [];
        for (let i = 0;i<ids.length;i++) {
            if(client.guilds.get(config.discord.curation.guild).presences.get(ids[i]) !== undefined && client.guilds.get('347020217966395393').presences.get(ids[i]).status !== 'offline') {
                online.push(ids[i]);
            }
        }

        steem.api.getAccounts([user], (err, res) => {
            if (err || res.length === 0) {
                msg.reply(user + " seems not to be a valid Steem account");
            } else {
                helper.database.countMessages().then(count => {
                    helper.database.countCurators().then(curators => {
                        getSP(user).then(sp => {
                            getvotingpower(user).then(vp => {
                                getVoteValue(vp, user).then(vote_value => {
                                    getBlacklistEntries(user).then(blacklist => {

                                        if (blacklist.noVote===true) {
                                            return  msg.channel.send(user + " is on the \"No Vote\" list!")
                                        } else {

                                            let status = new Discord.RichEmbed();
                                            status.setFooter("Powered by d.tube Curation 🦄");
                                            if (user === "dtube") {
                                                status.setTitle("DTube Curation Bot - Status Overview");
                                            } else {
                                                status.setTitle("@" + user + " - Status Overview");
                                            }

                                            status.setThumbnail('https://login.oracle-d.com/' + user + ".jpg");
                                            status.setColor(0x0878e0);
                                            if (user === "dtube") {
                                                status.addField("Total Curated Videos:", count[0].count, true);
                                                status.addField("Total Number of Curators:", countCurators(), true);
                                                status.addField("Online Curators:", online.length, true);
                                            }

                                            status.addField("Current 100% Vote Value:", vote_value + "$", true);
                                            status.addField("Current Steem Power:", sp.toFixed(3) + "SP", true);
                                            status.addField("Current Voting Power:", vp.toFixed(2) + "%", true);

                                            if (blacklist.count > 0 && !team.includes(user)) {
                                                status.addField("Blacklisted:", blacklist.text);
                                            }

                                            if (team.includes(user)) {
                                                status.addField("DTube Team Member:", "Yes 🤟");
                                            }
                                            msg.channel.send(status)
                                        }

                                    });

                                })
                            })
                        })

                    })

                })
            }
        });
    }

    if (msg.channel.id === config.discord.curation.channel) {

        if (msg.content === "!help") {
            let video = new Discord.RichEmbed();
            video.setFooter("Powered by d.tube Curation 🦄");
            video.setTitle("Curation Emojis Overview");
            video.setThumbnail("https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/155/unicorn-face_1f984.png");

            video.addField("👎", "Removes 5% from the upvote", true);
            video.addField("👍", "Adds 5% to the upvote", true);
            video.addField("🎲", "Adds between 1% and 6% to the upvote", true);
            video.addField("❤", "Adds 15% to the upvote", true);
            video.addField("🦄", "Adds 25% to the upvote", true);
            video.addField("💯", "Grants a 100% if at least three curators react with it.", false);

            video.setDescription("Post any DTube link into the <#" + config.discord.curation.channel + "> channel. You can not curate videos older than 2 hours. Do not upvote videos talking about EOS. Do not upvote religious / violent / hate speech / etc content. Do not upvote promotional videos. To curate add the emotes shown above. You may add more than one emote. For questions ask Steeminator3000");

            msg.channel.send(video);

        }

        if (msg.content === "!vp") {
            getvotingpower("dtube").then(vp => {
                msg.channel.send("DTubes Voting Power: " + vp.toFixed(2) + "%")
            })
        }

        if (msg.content.startsWith("!feedback")) {
            let parts = msg.content.replace("!feedback").trim().split(" ").slice(1);
            if (parts.length >= 2) {
                const video = helper.DTubeLink(parts[0].trim());
                const link = video;
                if (video !== undefined) {
                    const feedback = parts.slice(1).join(" ");

                    let authorInformation = video.replace('/#!', '').replace('https://d.tube/v/', '').split('/');
                    helper.database.feedBackExist(authorInformation[0], authorInformation[1]).then(exist => {
                        if (exist.length !== 0) {
                            console.log(exist[0].discord);
                            let user = client.guilds.get(config.discord.curation.guild).members.get(exist[0].discord);
                            let video = new Discord.RichEmbed();
                            video.setFooter("Powered by d.tube Curation 🦄")
                                .setTimestamp()
                                .setTitle("Feedback for: @" + exist[0].author + '/' + exist[0].permlink)
                                .addField("View Video", "[Watch Video](https://d.tube/#!/v/" + exist[0].author + "/" + exist[0].permlink + ")", true)
                                .setDescription("This video already received feedback from <@" + user.user.id + '>')
                                .addField("Feedback", exist[0].message, true)
                                .setColor("LUMINOUS_VIVID_PINK");
                            msg.channel.send(video);
                        } else {
                            javalon.getContent(authorInformation[0],authorInformation[1],async (err,result) => {
                                let posted_ago = Math.round(helper.getMinutesSincePost(new Date(result.ts)))
                                let video = new Discord.RichEmbed()
                                let topTags = []
                                for (const key in result.tags)
                                    topTags.push(key)
                                if (topTags.length == 0)
                                    topTags.push('No tags yet')
                                video.setFooter("Powered by d.tube curation")
                                    .setTimestamp()
                                    .setTitle("Feedback for: @" + result.author + '/' + result.link)
                                    .setAuthor("@" + result.author, 'https://image.d.tube/u/' + result.author + '/avatar', "https://d.tube/#!/c/" + result.author)
                                    .setThumbnail(result.json.thumbnailUrl)
                                    .setDescription("[Watch Video](" + link + ")")
                                    .addField("Tags", topTags.join(', '), true)
                                    .addField("Uploaded", posted_ago + ' minutes ago', true)
                                    .setColor("DARK_GOLD")
                                
                                let commentLink = helper.generatePermlink()
                                let feedbackFooter = '\n![](https://cdn.discordapp.com/attachments/429110955914428426/520078555204288524/dtubeanimated2.gif)\nThis feedback was posted by ' + msg.author.username + ' through [OneLoveCuration Discord Bot](https://github.com/techcoderx/OneLoveCuration).'
                                msg.channel.send(video).then(async (embed) => {
                                    // Generate Avalon comment
                                    let avalonCommentTx = {
                                        type: 4,
                                        data: {
                                            link: commentLink,
                                            pa: result.author,
                                            pp: result.link,
                                            json: {
                                                app: 'dtube/feedback',
                                                title: '',
                                                description: feedback,
                                                refs: []
                                            },
                                            vt: config.avalon.vpToSpendForFeedback,
                                            tag: config.avalon.tag,
                                        }
                                    }

                                    // Steem comment
                                    let steempa, steempp
                                    if (result.json.refs) for (let i = 0; i < result.json.refs.length; i++) {
                                        let ref = result.json.refs[i].split('/')
                                        if (ref[0] === 'steem') {
                                            avalonCommentTx.data.json.refs = ['steem/' + ref[1] + commentLink]
                                            steempa = ref[1]
                                            steempp = ref[2]
                                            break
                                        }
                                    }

                                    // Comment broadcasts
                                    let commentOps = {
                                        avalon: (cb) => {
                                            let signedTx = javalon.sign(config.avalon.wif,config.avalon.account,avalonCommentTx)
                                            javalon.sendTransaction(signedTx,(err,aresult) => {
                                                if (err) return cb(err)
                                                cb(null,aresult)
                                            })
                                        }
                                    }

                                    if (steempa && steempp) {
                                        commentOps.steem = (cb) => {
                                            steem.broadcast.comment(config.steem.wif, steempa, steempp, config.steem.account, commentLink, "", feedback + feedbackFooter, JSON.stringify({
                                                app: "dtube/feedback"
                                            }),(err,sresult) => {
                                                if (err) return cb(err)
                                                cb(null,sresult)
                                            })
                                        }
                                    }
                                    
                                    asyncjs.parallel(commentOps,(errors,results) => {
                                        if (errors) console.log(errors)
                                        if (errors && errors.steem && errors.avalon) {
                                            video.addField("Info", "Something went wrong while broadcasting the feedback to the blockchains. Please manually verify that the feedback was posted. If not try again. If this still does not work: Don't panic. Contact <@356200653640695811>")
                                            return embed.edit({embed: video})
                                        }

                                        // Commented successfully on at least one blockchain
                                        if (errors && errors.avalon) {
                                            video.addField("Commented","[View on DTube](https://d.tube/#!/v/" + config.steem.account + "/" + commentLink + ")")
                                            video.addField("Info", "Something went wrong while broadcasting the feedback to Avalon blockchain. Please manually verify that the feedback was posted onto the blockchains.")
                                        } else
                                            video.addField("Commented","[View on DTube](https://d.tube/#!/v/" + config.avalon.account + "/" + commentLink + ")")
                                        
                                        if (errors && errors.steem) {
                                            video.addField("Info", "Something went wrong while broadcasting the feedback to Steem blockchain. Please manually verify that the feedback was posted onto the blockchains.")
                                        }

                                        helper.database.addFeedback(msg.author.id,feedback,authorInformation[0],authorInformation[1]).then(() => {
                                            embed.edit({embed: video})
                                        }).catch(() => {
                                            video.addField("Info", "Something went wrong while saving this feedback to the database. Please manually verify that the feedback was posted.")
                                            embed.edit({embed: video})
                                        })
                                    })
                                })
                            })
                        }
                    });
                }
            } else if (parts.length === 1) {
                const video = helper.DTubeLink(parts[0].trim());
                if (video !== undefined) {
                    let authorInformation = video.replace('/#!', '').replace('https://d.tube/v/', '').split('/');
                    helper.database.feedBackExist(authorInformation[0], authorInformation[1]).then(exist => {
                        if (exist.length === 1) {
                            console.log(exist[0].discord);
                            let user = client.guilds.get(config.discord.curation.guild).members.get(exist[0].discord);
                            let video = new Discord.RichEmbed();
                            video.setFooter("Powered by d.tube Curation 🦄")
                                .setTimestamp()
                                .setTitle("Feedback for: @" + exist[0].author + '/' + exist[0].permlink)
                                .addField("View Video", "[Watch Video](https://d.tube/#!/v/" + exist[0].author + "/" + exist[0].permlink + ")", true)
                                .setDescription("This video already received feedback from <@" + user.user.id + '>')
                                .addField("Feedback", exist[0].message, true)
                                .setColor("LUMINOUS_VIVID_PINK");
                            msg.channel.send(video);
                        } else {
                            const emote = client.emojis.find(emoji => emoji.name === "DTube_D");
                            msg.reply(`This video has not received any feedback. ${emote}`)
                        }
                    });
                }
            }

        } else {
            if (helper.DTubeLink(msg.content)) {
                handleLink(msg)
            }
        }
    }

    if (msg.content.startsWith('!faq') && config.mod_settings.enabled === true) {
        let faq = msg.content.replace('!faq', '').trim();
        if (faq.length > 0) {
            if (faq === 'list') {
                let faqs = Object.keys(config.mod_settings.faq);
                let faq_embed = new Discord.RichEmbed().setTimestamp().setFooter("Powered by d.tube 🦄")
                    .setTitle("This are the help topics I know").setDescription(faqs.join(", "))
                    .addField("Usage:", "!faq *topic*")
                    .setThumbnail('https://image.flaticon.com/icons/png/512/258/258349.png');
                msg.channel.send({embed: faq_embed});
            } else {
                if (config.mod_settings.faq.hasOwnProperty(faq)) {
                    faq = config.mod_settings.faq[faq];
                    let faq_embed = new Discord.RichEmbed().setTimestamp().setFooter("Powered by d.tube 🦄")
                        .setTitle(faq[0]).setDescription(faq[1])
                        .setThumbnail('https://image.flaticon.com/icons/png/512/258/258349.png');
                    msg.channel.send({embed: faq_embed});
                }
            }
        }
    }

});

client.on('messageReactionAdd', (reaction, user) => {
    helper.database.updateReactions(reaction.message.id, helper.countReaction(reaction.message))
});

client.on('messageReactionRemove', (reaction, user) => {
    helper.database.updateReactions(reaction.message.id, helper.countReaction(reaction.message))
});

client.login(config.discord.token);

process.on('uncaughtException', function (error) {
    Sentry.captureException(error);
    process.exit(1)
});

process.on('unhandledRejection', function (error, p) {
    console.log(p);
    Sentry.captureException(error);
    process.exit(1)
});