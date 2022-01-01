DROP TABLE IF EXISTS `mp3s`;
DROP TABLE IF EXISTS `channels`;

CREATE TABLE `channels` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `identifier` varchar(100) NOT NULL,
  `url` varchar(100),
  `title` varchar(256),
  `description` varchar(1024),
  `author` varchar(256),
  `published` datetime
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `channels`
  ADD UNIQUE KEY `identifier` (`identifier`) USING BTREE;

INSERT INTO `channels`(`identifier`,`title`,`description`) VALUES ('misc','YT-2-RSS','Miscellaneous youtube video converted into a podcast rss!');

CREATE TABLE `mp3s` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `identifier` varchar(100) NOT NULL,
  `channel_identifier` varchar(100),
  `title` varchar(256),
  `description` varchar(1024),
  `author` varchar(256),
  `published` datetime,
  `length` int(11),
  `duration` int(11),
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `mp3s`
  ADD UNIQUE KEY `identifier` (`identifier`) USING BTREE,
  ADD FOREIGN KEY(`channel_identifier`) REFERENCES `channels`(`identifier`);



