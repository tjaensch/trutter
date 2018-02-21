'use strict';

var fetch = require('isomorphic-fetch');
var queryString = require('query-string');
var debug = require('debug')('scrape-twitter:query');
var https = require('https');

var DEFAULT_TIMEOUT = 10000;

var checkStatus = function checkStatus(response) {
  var requiresLogin = /login\?redirect_after_login/.test(response.url || '');
  if (requiresLogin) {
    var error = new Error('An active login is required for this API call');
    error.response = response;
    error.statusCode = 403;
    throw error;
  } else if (response.ok) {
    debug('response was ok');
    return response;
  } else {
    debug('response was error:', response);
    var _error = new Error(response.statusText);
    _error.response = response;
    _error.statusCode = response.status;
    throw _error;
  }
};

var toJson = function toJson(response) {
  return response.json();
};
var toText = function toText(response) {
  return response.text();
};

var toHtml = function toHtml(response) {
  var minPosition = null;
  var html = null;
  if ('items_html' in response) {
    minPosition = response['min_position'];
    html = response['items_html'].trim();
  } else if ('conversation_html' in response) {
    minPosition = response['min_position'];
    html = response['conversation_html'].trim();
  } else if ('descendants' in response && 'items-html' in response['descendants']) {
    minPosition = response['descendants']['min_position'];
    html = response['descendants']['items_html'].trim();
  }

  debug('received html of length:', html.length);
  if (minPosition) {
    debug('the min_position within the response is:', minPosition);
  }
  return { html: html, _minPosition: minPosition };
};

var query = function query(url, options) {
  var fetcher = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : fetch;

  var qs = queryString.stringify(options);
  var resource = url + (qs.length ? '?' + qs : '');
  debug('query on resource:', resource);
  return fetcher(resource, {
    agent: https.globalAgent,
    timeout: process.env.SCRAPE_TWITTER_TIMEOUT || DEFAULT_TIMEOUT
  }).then(checkStatus).then(toJson).then(toHtml);
};

var get = function get(resource) {
  var fetcher = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : fetch;

  debug('get on resource:', resource);
  return fetcher(resource, {
    agent: https.globalAgent,
    timeout: process.env.SCRAPE_TWITTER_TIMEOUT || DEFAULT_TIMEOUT
  }).then(checkStatus).then(toText).then(function (html) {
    return { html: html };
  });
};

module.exports = query;
module.exports.query = query;
module.exports.get = get;