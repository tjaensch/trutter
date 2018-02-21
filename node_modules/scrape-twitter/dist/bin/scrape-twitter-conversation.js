'use strict';

var meow = require('meow');

var JSONStream = require('JSONStream');
var pump = require('pump');
var ConversationStream = require('../lib/conversation-stream');
var ThreadedConversationStream = require('../lib/threaded-conversation-stream');
var cliUtils = require('../lib/cli-utils');

var cli = meow('\n  Usage\n    $ scrape-twitter conversation [--count=<count>] <username> <id>\n\n  Options\n    --count, -c   Get first N items\n', {
  string: ['_'], // Twitter ids too large for JavaScript numbers. And hexadecimal usernames break minimist.
  alias: { c: 'count' }
});

if (cli.input.length === 0) {
  cli.showHelp();
} else {
  var tweets = void 0;
  if (cli.input.length >= 2) {
    var username = cliUtils.parseUsername(cli.input[0]);
    var id = cli.input[1];
    tweets = new ConversationStream(username, id, { count: cli.flags.count });
  } else {
    var _id = cli.input[0];
    tweets = new ThreadedConversationStream(_id, { count: cli.flags.count });
  }
  pump(tweets, JSONStream.stringify('[\n', ',\n', '\n]\n'), process.stdout, cliUtils.handleError(process.exit.bind(process)));
}