#!/bin/bash

# Many thanks to : https://gist.github.com/mihow/9c7f559807069a03e302605691f85572
if [ ! -e dev.env ]; then
  echo "dev.env file not found, please create it" >&2
  exit 1;
fi

# Load the environment
export $(cat dev.env | sed 's/#.*//g' | xargs)

echo ""
echo " Got environment variables : "


echo "MYSQL_HOST : $MYSQL_HOST"
echo "MYSQL_DATABASE : $MYSQL_DATABASE"
echo "MYSQL_USER : $MYSQL_USER"
echo "MYSQL_PASSWORD : $MYSQL_PASSWORD"
echo "WEBSERVICE_ADDRESS : $WEBSERVICE_ADDRESS"
echo "WEBSERVICE_PORT : $WEBSERVICE_PORT"

[ -z "$PROXY_ADDRESS" ] || echo "PROXY_ADDRESS : $PROXY_ADDRESS"
[ -z "$PROXY_PORT" ] || echo "PROXY_PORT : $PROXY_PORT"
[ -z "$MP3_MANAGER_URL" ] || echo "MP3_MANAGER_URL : $MP3_MANAGER_URL"
[ -z "$MP3_EXPIRATION_TIME_MS" ] || echo "MP3_EXPIRATION_TIME_MS : $MP3_EXPIRATION_TIME_MS"


echo ""
echo ""
echo "Running setup script"
echo ""

./scripts/setup.sh \
  --mysql-host "$MYSQL_HOST" \
  --mysql-database "$MYSQL_DATABASE" \
  --mysql-user "$MYSQL_USER" \
  --mysql-password "$MYSQL_PASSWORD" \
  --webservice-address "$WEBSERVICE_ADDRESS" \
  --webservice-port "$WEBSERVICE_PORT" \
  $([ -z "$PROXY_ADDRESS" ] || ( echo "--proxy-address" && echo "$PROXY_ADDRESS" )) \
  $([ -z "$PROXY_PORT" ] || ( echo "--proxy-port" && echo "$PROXY_PORT" )) \
  $([ -z "$MP3_MANAGER_URL" ] || ( echo "--mp3-manager-url" && echo "$MP3_MANAGER_URL" )) \
  $([ -z "$MP3_EXPIRATION_TIME_MS" ] || ( echo "--mp3-expiration-time-ms" && echo "$MP3_EXPIRATION_TIME_MS" )) \
  -c

