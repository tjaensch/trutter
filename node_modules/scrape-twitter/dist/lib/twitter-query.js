'use strict';

var cheerio = require('cheerio');
var query = require('./query');
var parser = require('./parser');
var fetchWithCookie = require('./twitter-login').fetch;

var toCheerio = function toCheerio(_ref) {
  var html = _ref.html,
      _minPosition = _ref._minPosition;
  return {
    $: cheerio.load(html),
    _minPosition: _minPosition
  };
};

var getUserTimeline = function getUserTimeline(username, startingId, _ref2) {
  var _ref2$replies = _ref2.replies,
      replies = _ref2$replies === undefined ? false : _ref2$replies;

  var url = 'https://twitter.com/i/profiles/show/' + username + '/timeline' + (replies ? '/with_replies' : '');
  var options = {
    include_available_features: '1',
    include_entities: '1',
    max_position: startingId
  };
  return query(url, options, replies ? fetchWithCookie : undefined).then(toCheerio).then(parser.toTweets);
};

var getUserMediaTimeline = function getUserMediaTimeline(username, maxPosition) {
  var url = 'https://twitter.com/i/search/timeline';
  var options = {
    vertical: 'default',
    src: 'typd',
    include_available_features: '1',
    include_entities: '1',
    f: 'tweets',
    q: 'from:' + username + ' filter:images',
    max_position: maxPosition
  };
  return query(url, options).then(toCheerio).then(parser.toTweets);
};

var getUserLikes = function getUserLikes(username, startingId) {
  var url = 'https://twitter.com/' + username + '/likes/timeline';
  var options = {
    include_available_features: '1',
    include_entities: '1',
    max_position: startingId
  };
  return query(url, options, fetchWithCookie).then(toCheerio).then(parser.toTweets);
};

var getUserList = function getUserList(username, list, startingId) {
  var url = 'https://twitter.com/' + username + '/lists/' + list + '/timeline';
  var options = {
    max_position: startingId
  };
  return query(url, options).then(toCheerio).then(parser.toTweets);
};

var getUserConnections = function getUserConnections(username, type, maxPosition) {
  if (typeof maxPosition === 'undefined') {
    var url = 'https://twitter.com/' + username + '/' + type;
    return query.get(url, fetchWithCookie).then(toCheerio).then(parser.toConnections);
  } else {
    var _url = 'https://twitter.com/' + username + '/' + type + '/users';
    var options = {
      include_available_features: '1',
      include_entities: '1',
      max_position: maxPosition
    };
    return query(_url, options, fetchWithCookie).then(toCheerio).then(parser.toConnections);
  }
};

var getUserConversation = function getUserConversation(username, id, maxPosition) {
  if (typeof maxPosition === 'undefined') {
    var url = 'https://twitter.com/' + username + '/status/' + id;
    return query.get(url).then(toCheerio).then(parser.toThreadedTweets(id));
  } else {
    var _url2 = 'https://twitter.com/i/' + username + '/conversation/' + id;
    var options = {
      include_available_features: '1',
      include_entities: '1',
      max_position: maxPosition
    };
    return query(_url2, options).then(toCheerio).then(parser.toThreadedTweets(id));
  }
};

var getThreadedConversation = function getThreadedConversation(id) {
  var url = 'https://twitter.com/i/threaded_conversation/' + id;
  return query(url).then(toCheerio).then(parser.toThreadedTweets(id));
};

var getUserProfile = function getUserProfile(username) {
  var url = 'https://twitter.com/' + username;
  return query.get(url).then(toCheerio).then(parser.toTwitterProfile);
};

var queryTweets = function queryTweets(q, type, maxPosition) {
  var url = 'https://twitter.com/i/search/timeline';
  var options = {
    vertical: 'default',
    src: 'typd',
    include_available_features: '1',
    include_entities: '1',
    f: type,
    q: q,
    max_position: maxPosition
  };
  return query(url, options).then(toCheerio).then(parser.toTweets);
};

module.exports = {
  getUserProfile: getUserProfile,
  getUserTimeline: getUserTimeline,
  getUserMediaTimeline: getUserMediaTimeline,
  getUserLikes: getUserLikes,
  getUserConnections: getUserConnections,
  getUserList: getUserList,
  getUserConversation: getUserConversation,
  getThreadedConversation: getThreadedConversation,
  queryTweets: queryTweets
};