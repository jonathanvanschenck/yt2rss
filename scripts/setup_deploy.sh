#!/bin/bash

# Many thanks to : https://gist.github.com/mihow/9c7f559807069a03e302605691f85572
if [ ! -e prod.env ]; then
  echo "prod.env file not found, please create it" >&2
  exit 1;
fi

# Load the environment
export $(cat prod.env | sed 's/#.*//g' | xargs)

# Make sure MYSQL_HOST is *not* "localhost
if [ "$MYSQL_HOST" == "localhost" ]; then
  echo "MYSQL_HOST value is set to 'localhost', this will fail in a docker container, please change it to something else in 'prod.env'" >&2
  exit 1;
fi

echo ""
echo " Got environment variables : "

echo "MYSQL_HOST : $MYSQL_HOST"
echo "MYSQL_DATABASE : $MYSQL_DATABASE"
echo "MYSQL_USER : $MYSQL_USER"
echo "MYSQL_PASSWORD : $MYSQL_PASSWORD"

echo ""
echo ""
echo "Running setup script"
echo ""

./scripts/setup.sh \
  --mysql-host "$MYSQL_HOST" \
  --mysql-database "$MYSQL_DATABASE" \
  --mysql-user "$MYSQL_USER" \
  --mysql-password "$MYSQL_PASSWORD" \
  -s

