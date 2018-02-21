'use strict';

var expandHome = require('expand-home-dir');
var touch = require('touch');

var SCRAPE_TWITTER_CONFIG = expandHome('~/.scrape-twitter');

touch.sync(SCRAPE_TWITTER_CONFIG);

var parseUsername = function parseUsername(username) {
  return (username || '').replace('@', '');
};

var handleError = function handleError(exit) {
  return function (err) {
    if (err != null) {
      if (err.statusCode === 429) {
        console.error(err.message);
      } else if (err.statusCode !== 404) {
        console.error(err.message);
        console.error(err.stack);
      }
      return exit(1);
    }
  };
};

var getEnv = function getEnv() {
  require('dotenv').config({ path: SCRAPE_TWITTER_CONFIG });
  var env = {
    SCRAPE_TWITTER_CONFIG: SCRAPE_TWITTER_CONFIG,
    TWITTER_USERNAME: process.env.TWITTER_USERNAME,
    TWITTER_PASSWORD: process.env.TWITTER_PASSWORD,
    TWITTER_KDT: process.env.TWITTER_KDT // used to determine whether a new device is logging in
  };
  return env;
};

module.exports = {
  SCRAPE_TWITTER_CONFIG: SCRAPE_TWITTER_CONFIG,
  getEnv: getEnv,
  parseUsername: parseUsername,
  handleError: handleError
};