#!/bin/sh
exec 2>/dev/null
/usr/local/bin/scrape-twitter timeline realDonaldTrump | head -n 6 > tweets.json
sed -i '$ s/.$//' tweets.json
echo "]" >> tweets.json