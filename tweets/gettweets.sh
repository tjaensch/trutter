#!/bin/sh
exec 2>/dev/null
/usr/bin/scrape-twitter timeline realDonaldTrump | head -n 6 > tweets.json
sed -i '$ s/.$//' tweets.json
echo "]" >> tweets.json
file=`cat tweets.json`
echo $file | sudo tee /var/www/html/index.html