'use strict';

var meow = require('meow');

var JSONStream = require('JSONStream');
var pump = require('pump');
var ListStream = require('../lib/list-stream');
var cliUtils = require('../lib/cli-utils');

var cli = meow('\n  Usage\n    $ scrape-twitter list [--count=<count>] <username> <list>\n\n  Options\n    --count, -c   Get first N items\n', {
  string: ['_'],
  alias: { c: 'count' }
});

if (cli.input.length < 2) {
  cli.showHelp();
} else {
  var username = cliUtils.parseUsername(cli.input[0]);
  var list = cli.input[1];
  var tweets = new ListStream(username, list, { count: cli.flags.count });
  pump(tweets, JSONStream.stringify('[\n', ',\n', '\n]\n'), process.stdout, cliUtils.handleError(process.exit.bind(process)));
}