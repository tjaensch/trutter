#!/bin/sh
exec 2>/dev/null
$(npm bin)/scrape-twitter timeline realDonaldTrump | head -n 6 > tweets/tweets.json
sed -i '$ s/.$//' tweets/tweets.json
echo "]" >> tweets/tweets.json