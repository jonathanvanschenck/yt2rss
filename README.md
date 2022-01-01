# yt2rss
A webserver to convert youtube videos to an audio podcast RSS feed

## Basic Usage
`POST /api/youtube/podcasts?v=<yt_video_id>` - Trigger a video to get converted
`GET /api/youtube/status` - check on the status of the converting videos queue
`GET /api/rss/misc.xml` - subscribe to this in your podcast app

## Setup for docker
```bash
cp env.template prod.env
```
Then modify the `prod.env`, in particular, change the `MYSQL_HOST` to something that is not 'localhost'
```bash
./scripts/setup_deploy.sh
sudo docker build -t yt2rss .
sudo docker compose --env-file prod.env up -d
sudo docker compose --env-file prod.env logs -f
```

## Setup for development
### Install and Configure
```bash
npm install
cp env.template dev.env
```
Then modify the `dev.env`
```bash
./scripts/setup_dev.sh
```

### Create a Database
```mysql
DROP DATABASE IF EXISTS yt2rss;
CREATE DATABASE IF NOT EXISTS yt2rss DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'hackmaster';
CREATE USER 'hackmaster'@'localhost' IDENTIFIED BY 'guessme';
GRANT ALL PRIVILEGES ON yt2rss.* to 'hackmaster'@'localhost';
FLUSH PRIVILEGES;
```
```bash
mysql -u hackmaster -pguessme yt2rss < db/entrypoint/0_schema.sql
```

### To run
```bash
npm run start:concise
```

## TODO
 [ ] Make basic index.html with description
 [ ] Add a favicon.ico to public
 [ ] Add channel subscriptions with pubsubhubbub
 [ ] Add https support
 [ ] Add actual authentication support
 [ ] Fix audio mountpoint in docker-compose to be modular
