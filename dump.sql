-- Dumping database structure for dtube
CREATE DATABASE IF NOT EXISTS `dtube` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `dtube`;

-- Dumping structure for table dtube.message
CREATE TABLE IF NOT EXISTS `message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discord_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `up` int(11) NOT NULL DEFAULT '0',
  `down` int(11) NOT NULL DEFAULT '0',
  `one_hundred` int(11) NOT NULL DEFAULT '0',
  `game_die` int(11) NOT NULL DEFAULT '0',
  `heart` int(11) NOT NULL DEFAULT '0',
  `voted` int(11) NOT NULL DEFAULT '0',
  `vote_weight` int(11) DEFAULT '2000',
  `author` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permlink` varchar(280) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posted` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_discord_id_uindex` (`discord_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
