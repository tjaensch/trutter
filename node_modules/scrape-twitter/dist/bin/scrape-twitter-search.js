'use strict';

var meow = require('meow');

var JSONStream = require('JSONStream');
var pump = require('pump');
var TweetStream = require('../lib/tweet-stream');
var cliUtils = require('../lib/cli-utils');

var cli = meow('\n  Usage\n    $ scrape-twitter search --query=<query> [--type=<type>] [--count=<count>]\n\n  Options\n    --query, -q   The query to search for\n    --type,  -t   The type of search: \'top\' or \'latest\'\n    --count, -c   Get first N items\n', {
  default: { type: 'top' },
  alias: { q: 'query', t: 'type', c: 'count' }
});

if ('query' in cli.flags === false) {
  cli.showHelp();
} else {
  var tweets = new TweetStream(cli.flags.query, cli.flags.type, {
    count: cli.flags.count
  });
  pump(tweets, JSONStream.stringify('[\n', ',\n', '\n]\n'), process.stdout, cliUtils.handleError(process.exit.bind(process)));
}