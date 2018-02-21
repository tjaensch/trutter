'use strict';

var meow = require('meow');

var JSONStream = require('JSONStream');
var pump = require('pump');
var ConnectionStream = require('../lib/connection-stream');
var cliUtils = require('../lib/cli-utils');

var SCRAPE_TWITTER_CONFIG = cliUtils.SCRAPE_TWITTER_CONFIG;
var env = cliUtils.getEnv();

var cli = meow('\n  Usage\n    $ TWITTER_USERNAME=jack TWITTER_PASSWORD=p4ssw0rd scrape-twitter connections <username> --type=<type>\n\n  Options\n    --type,  -t   The type of connections: \'following\' or \'followers\'\n', {
  string: ['_'],
  default: { type: 'following' },
  alias: { t: 'type' }
});

if (cli.input.length === 0) {
  cli.showHelp();
} else if (!env.TWITTER_USERNAME || !env.TWITTER_PASSWORD) {
  console.log('Please ensure that the environment variables TWITTER_USERNAME and TWITTER_PASSWORD are set.');
  console.log();
  console.log('Environment variables can be set within the dotenv file: ' + SCRAPE_TWITTER_CONFIG);
  process.exit(1);
} else {
  var username = cliUtils.parseUsername(cli.input[0]);
  var type = cli.flags.type === 'following' ? 'following' : 'followers';
  var profiles = new ConnectionStream(username, type, env);
  pump(profiles, JSONStream.stringify('[\n', ',\n', '\n]\n'), process.stdout, cliUtils.handleError(process.exit.bind(process)));
}