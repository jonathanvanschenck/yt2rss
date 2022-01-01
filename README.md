# yt2rss
A webserver to convert youtube videos to an audio podcast RSS feed

## Basic Usage
### Set up proxy parameters
In your `*.env` file (see setup sections below), get your proxy parameters:

```bash
PROXY_ADDRESS="your_domain.com"
PROXY_PORT=1234
```

These define the url which you can use to access the rss feed from an external device. In particular, you can (in your podcast app) subscribe to:

`http://your_domain.com:1234/api/rss/misc.xml`

Which will then have newly converted youtube videos appear.

### API
To trigger a youtube video to be converted, get the youtube video's id (you can get this from the youtube url: `youtube.com/watch?v=<yt_video_id>`), and then POST to the following endpoint:

`POST http://your_domain.com:1234/api/youtube/podcasts?v=<yt_video_id>`

Depending on the length of the video, the conversion process can take several minutes. Feel free to queue up multiple youtube videos using several posts in the previous endpoint in quick succession. You can check the status of the queue using:

`GET http://your_domain.com:1234/api/youtube/status`

Note, if you copy your `config.json` file into the `testing` directory, then the following commands can be used
```bash
# Eventually, I will be in a seperate client CLI repo . . .
cp config.json ./testing/config.json
node testing/post.js /api/youtube/podcasts?v=<yt_video_id>
node testing/get.js /api/youtube/status
```

## Setup for docker
```bash
cp env.template prod.env
```
Then modify the `prod.env`, in particular, change the `MYSQL_HOST` to something that is not 'localhost'.
```bash
npm run setup:prod

# All these commands require sudo
npm run docker:build
npm run docker:up
# Press CTRL+C to stop to logging
npm run docker:down
```

## Setup for development
### Dependencies
This requires `ffmpeg`, which you can install via:
```bash
sudo apt install ffmpeg
```

### Install and Configure
```bash
npm install
cp env.template dev.env
```
Then modify the `dev.env`, and finally run the setup script:
```bash
npm run setup:dev
```

### Create a Database
Within your favorite MySQL shell, run something like this (check your `dev.env` for exact usernames):
```mysql
DROP DATABASE IF EXISTS yt2rss;
CREATE DATABASE IF NOT EXISTS yt2rss DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'hackmaster';
CREATE USER 'hackmaster'@'localhost' IDENTIFIED BY 'guessme';
GRANT ALL PRIVILEGES ON yt2rss.* to 'hackmaster'@'localhost';
FLUSH PRIVILEGES;
```
Then copy in the database schema:
```bash
mysql -u hackmaster -pguessme yt2rss < db/entrypoint/0_schema.sql
```

### To run
```bash
npm run start:concise
```

## TODO
  - Make basic index.html with description
  - Add a favicon.ico to public
  - Add channel subscriptions with pubsubhubbub
  - Add https support
  - Add actual authentication support
  - Fix audio mountpoint in docker-compose to be modular
  - Add body options to the POST endpoints
  - Write a client CLI
