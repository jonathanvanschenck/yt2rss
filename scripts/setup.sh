#!/bin/sh

useage() {
    echo ""
    echo "Setup script for yt2rss"
    echo ""
    echo "  Usage: setup.sh [OPTIONS] [REQUIRED]"
    echo ""
    echo "OPTIONS"
    echo "  -h,--help                    : Display this help menu."
    echo "  -c,--force-config            : Forcably write over config if it exists"
    echo "  -s,--skip-config             : Skip writing over the configuration file"
    echo "     --mysql-host              : Host name for the sql server"
    echo "     --mysql-database          : Database name for the sql server"
    echo "     --mysql-user              : Username for the sql server"
    echo "     --mysql-password          : Password for the sql server"
    echo "     --proxy-address           : " # TODO
    echo "     --proxy-port              : " # TODO
    echo "     --webservice-address      : " # TODO
    echo "     --webservice-port         : " # TODO
    echo "     --mp3-manager-url         : " # TODO
    echo "     --mp3-expiration-time-ms  : " # TODO
}

# Set defaults
skip_config=0
force_config=0

mysql_host="localhost"
mysql_database="yt2rss"
mysql_user="hackmaster"
mysql_password="guessme"

proxy_address=""
proxy_port=""
webservice_address=""
webservice_port=""
mp3_manager_url=""
mp3_expiration_time_ms=""

# Unpack all the args
while [ "$#" -gt 0 ]; do
  case "$1" in
    -c|--force-config)
      force_config=1
      ;;

    -s|--skip-config)
      skip_config=1
      ;;

    --mysql-host|--mysql-host=*)
      if [ "$1" != "*=*" ]; then shift; fi
      mysql_host="${1#*=}"
      if [ -z "$mysql_host" ]; then
        echo "Bad mysql host '$mysql_host'" >&2 
        useage
        exit 1
      fi
      ;;

    --mysql-database|--mysql-database=*)
      if [ "$1" != "*=*" ]; then shift; fi
      mysql_database="${1#*=}"
      if [ -z "$mysql_database" ]; then
        echo "Bad mysql database '$mysql_database'" >&2 
        useage
        exit 1
      fi
      ;;

    --mysql-user|--mysql-user=*)
      if [ "$1" != "*=*" ]; then shift; fi
      mysql_user="${1#*=}"
      if [ -z "$mysql_user" ]; then
        echo "Bad mysql user '$mysql_user'" >&2 
        useage
        exit 1
      fi
      ;;

    --mysql-password|--mysql-password=*)
      if [ "$1" != "*=*" ]; then shift; fi
      mysql_password="${1#*=}"
      if [ -z "$mysql_password" ]; then
        echo "Bad mysql password '$mysql_password'" >&2 
        useage
        exit 1
      fi
      ;;

    --proxy-address|--proxy-address=*)
      if [ "$1" != "*=*" ]; then shift; fi
      proxy_address="${1#*=}"
      if [ -z "$proxy_address" ]; then
        echo "Bad proxy address '$proxy_address'" >&2 
        useage
        exit 1
      fi
      ;;

    --proxy-port|--proxy-port=*)
      if [ "$1" != "*=*" ]; then shift; fi
      proxy_port="${1#*=}"
      if [ ! "$proxy_port" -eq "$proxy_port" ] 2>/dev/null; then
        echo "Bad proxy port '$proxy_port'" >&2
        useage
        exit 1
      fi
      ;;

    --webservice-address|--webservice-address=*)
      if [ "$1" != "*=*" ]; then shift; fi
      webservice_address="${1#*=}"
      if [ -z "$webservice_address" ]; then
        echo "Bad webservice address '$webservice_address'" >&2 
        useage
        exit 1
      fi
      ;;

    --webservice-port|--webservice-port=*)
      if [ "$1" != "*=*" ]; then shift; fi
      webservice_port="${1#*=}"
      if [ ! "$webservice_port" -eq "$webservice_port" ] 2>/dev/null; then
        echo "Bad webservice port '$webservice_port'" >&2
        useage
        exit 1
      fi
      ;;

    --mp3-manager-url|--mp3-manager-url=*)
      if [ "$1" != "*=*" ]; then shift; fi
      mp3_manager_url="${1#*=}"
      if [ -z "$mp3_manager_url" ]; then
        echo "Bad mp3 manager url '$mp3_manager_url'" >&2 
        useage
        exit 1
      fi
      ;;

    --mp3-expiration-time-ms|--mp3-expiration-time-ms=*)
      if [ "$1" != "*=*" ]; then shift; fi
      mp3_expiration_time_ms="${1#*=}"
      if [ ! "$mp3_expiration_time_ms" -eq "$mp3_expiration_time_ms" ] 2>/dev/null; then
        echo "Bad mp3 expiration time ms '$mp3_expiration_time_ms'" >&2
        useage
        exit 1
      fi
      ;;

    -h|--help)
      useage "no_error"
      exit 0
      ;;

    *)
      echo "Unrecognized argument '$1'" >&2
      useage
      exit 1
      ;;
  esac
  shift
done

# Parse the external configuration, if any
echo "Generating external configurations and environments"
mkdir -p db
node scripts/create_mysql_config.js "$mysql_host" "$mysql_database" "$mysql_user" "$mysql_password"

# FIXME
mkdir -p public/audio

if [ "$skip_config" -lt 1 ]; then
  if [ -e config.json ] && [ "$force_config" -lt 1 ]; then
    echo ""
    echo "Dax-auth configuration already found, either delete it or use parameter '-c/--force-config' to write over it if you were intending to update this deployment manager"
    echo ""
  else
    echo "Generating Configuration file"
    node scripts/setup_configuration.js "$proxy_address" "$proxy_port" "$webservice_address" "$webservice_port" "$mp3_manager_url" "$mp3_expiration_time_ms"
  fi
else
  echo "Skipping configuration generation, things may misbehave . . ."
fi
