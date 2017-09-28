/*
SQLyog Ultimate v11.27 (32 bit)
MySQL - 5.6.29 : Database - riody
*********************************************************************
*/


/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`riody` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `riody`;

/*Table structure for table `mu_admin` */

DROP TABLE IF EXISTS `mu_admin`;

CREATE TABLE `mu_admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `passwd` varchar(100) NOT NULL,
  `flag` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


/*Table structure for table `mu_category` */

DROP TABLE IF EXISTS `mu_category`;

CREATE TABLE `mu_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL,
  `f_id` int(11) NOT NULL DEFAULT '0',
  `cat_name` varchar(225) NOT NULL,
  `rank_id` int(11) NOT NULL DEFAULT '50',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


/*Table structure for table `mu_config` */

DROP TABLE IF EXISTS `mu_config`;

CREATE TABLE `mu_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conobj` varchar(225) NOT NULL,
  `conval` text NOT NULL,
  `valtype` varchar(50) NOT NULL,
  `delor` int(11) NOT NULL DEFAULT '0',
  `rank_id` int(11) NOT NULL DEFAULT '50',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

/*Table structure for table `mu_note` */

DROP TABLE IF EXISTS `mu_note`;

CREATE TABLE `mu_note` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL,
  `title` varchar(225) NOT NULL,
  `mark` varchar(50) NOT NULL,
  `content` text NOT NULL,
  `cat_id` int(11) NOT NULL DEFAULT '0',
  `permission` int(11) NOT NULL DEFAULT '0',
  `tag` varchar(50) NOT NULL,
  `view` bigint(55) NOT NULL DEFAULT '0',
  `share_link` varchar(50) NOT NULL,
  `add_time` int(10) unsigned NOT NULL DEFAULT '0',
  `rank_id` int(11) NOT NULL DEFAULT '50',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

/*Table structure for table `mu_page` */

DROP TABLE IF EXISTS `mu_page`;

CREATE TABLE `mu_page` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `f_id` int(11) NOT NULL DEFAULT '50',
  `title` varchar(225) NOT NULL,
  `content` text NOT NULL,
  `desc` varchar(255) NOT NULL,
  `add_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `rank_id` int(11) NOT NULL DEFAULT '50',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `mu_user`;

CREATE TABLE `mu_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `passwd` varchar(100) NOT NULL,
  `token` varchar(100) NOT NULL,
  `reg_time` int(10) NOT NULL DEFAULT '0',
  `ulevel` int(11) NOT NULL DEFAULT '0',
  `favorite` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
