create database if not exists dtube_curation;

use dtube_curation;

create table if not exists message
(
  id          int auto_increment
    primary key,
  discord_id  varchar(50)        not null,
  up          int default '0'    not null,
  down        int default '0'    not null,
  voted       int default '0'    not null,
  vote_weight int default '2000' null,
  author      varchar(50)        null,
  permlink    varchar(280)       null,
  posted      datetime           null,
  constraint message_discord_id_uindex
  unique (discord_id)
);

