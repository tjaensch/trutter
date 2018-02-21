'use strict';

var meow = require('meow');
var twitterQuery = require('../lib/twitter-query');
var cliUtils = require('../lib/cli-utils');

var stringify = function stringify(v) {
  return console.log(JSON.stringify(v, null, 2));
};

var cli = meow('\n  Usage\n    $ scrape-twitter profile <username>\n', {
  string: ['_']
});

if (cli.input.length === 0) {
  cli.showHelp();
} else {
  var username = cliUtils.parseUsername(cli.input[0]);
  twitterQuery.getUserProfile(username).then(stringify).catch(cliUtils.handleError(process.exit.bind(process)));
}