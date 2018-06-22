const Discord = require('discord.js');
const client = new Discord.Client();
const steem = require("steem");

const config = require('./config');
const helper = require('./helper');

let scheduledVotes = [];

helper.database.getMessagesToVote().then(posts => {
    posts.forEach(post => {
        let sincePost = helper.getMinutesSincePost(post.posted);
        let startIn = 30 - sincePost;
        let voteNow = [];
        if (startIn <= 0) {
            voteNow.push(post);
        } else {
            scheduledVotes.push({
                post, timer: setTimeout(() => {
                    helper.vote(post.author, post.permlink, helper.calculateVote(post));
                }, startIn * 60 * 1000)
            })
        }
        for (let i = 0; i <= voteNow.length - 1; i++) {
            setTimeout(() => {
                helper.vote(voteNow[i].author, voteNow[i].permlink, helper.calculateVote(voteNow[i]));
            }, i * 3500)
        }

    })
})


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

client.on('message', msg => {
    if (msg.author.bot) {
        return;
    }
    if (msg.channel.id === config.discord.curation.channel) {
        if (helper.DTubeLink(msg.content)) {
            const link = helper.DTubeLink(msg.content)
            let video = new Discord.RichEmbed();
            video.setFooter("Powered by d.tube Curation")
                .setTimestamp();
            let authorInformation = link.replace('/#!', '').replace('https://d.tube/v/', '').split('/');
            steem.api.getContent(authorInformation[0], authorInformation[1], async (err, result) => {
                if (err) {
                    msg.reply("Oups! An error occured. See the logs for more details");
                    console.log(err);
                } else {
                    try {
                        let json = JSON.parse(result.json_metadata);
                        video.setTitle(json.video.info.title.substr(0, 1024))
                            .setImage('https://ipfs.io/ipfs/' + json.video.info.snaphash)
                            .setAuthor("@" + json.video.info.author, null, "https://d.tube/#!/c/" + json.video.info.author)
                            .setThumbnail('https://login.oracle-d.com/' + json.video.info.author + '.jpg')
                            .addField("Tags", json.tags.join(', '), true)
                            .addField("Uploaded", Math.round(helper.getMinutesSincePost(new Date(result.created+'Z'))) + ' minutes ago', true);
                        let exist = await helper.database.existMessage(json.video.info.author, json.video.info.permlink);
                        if (!exist) {
                            msg.channel.send({embed: video}).then(async (embed) => {
                                embed.react(config.discord.curation.other_emojis.clock);
                                helper.database.addMessage(embed.id, json.video.info.author, json.video.info.permlink)
                                setTimeout(() => {
                                    helper.database.getMessage(json.video.info.author, json.video.info.permlink).then(message => {
                                        helper.vote(message[0].author, message[0].permlink, helper.calculateVote(message[0]));
                                    });
                                }, 1000 * config.discord.curation.timeout_minutes)
                            });
                        } else {
                            msg.reply("This video has already been posted to the curation channel.").then(reply => {
                                setTimeout(() => {
                                    reply.delete();
                                }, 5000)
                            })
                        }
                        msg.delete();
                    } catch (err) {
                        msg.reply("Oups! An error occured. See the logs for more detauls");
                        console.log(err);
                    }
                }
            })


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
