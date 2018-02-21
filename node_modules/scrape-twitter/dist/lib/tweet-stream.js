'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Readable = require('readable-stream/readable');
var debug = require('debug')('scrape-twitter:tweet-stream');

var twitterQuery = require('./twitter-query');

var TweetStream = function (_Readable) {
  _inherits(TweetStream, _Readable);

  function TweetStream(query, type) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        count = _ref.count;

    _classCallCheck(this, TweetStream);

    var _this = _possibleConstructorReturn(this, (TweetStream.__proto__ || Object.getPrototypeOf(TweetStream)).call(this, { objectMode: true }));

    _this.isLocked = false;
    _this._numberOfTweetsRead = 0;
    _this._firstReadTweet = undefined;
    _this._lastReadTweet = undefined;

    _this.query = query;
    _this.type = type === 'latest' ? 'tweets' : 'top';
    _this.count = count;
    debug('TweetStream for "' + _this.query + '" and type ' + type + ' created');
    return _this;
  }

  _createClass(TweetStream, [{
    key: '_read',
    value: function _read() {
      var _this2 = this;

      if (this.isLocked) {
        debug('TweetStream cannot be read as it is locked');
        return false;
      }
      if (!!this.count && this._numberOfTweetsRead >= this.count) {
        debug('TweetStream has read up to the max count');
        this.push(null);
        return false;
      }
      if (this._readableState.destroyed) {
        debug('TweetStream cannot be read as it is destroyed');
        this.push(null);
        return false;
      }

      this.isLocked = true;
      debug('TweetStream is now locked');

      debug('TweetStream queries for tweets outside [ ' + this._firstReadTweet + ', ..., ' + this._lastReadTweet + ' ]');
      var maxPosition = this._firstReadTweet && this._lastReadTweet ? 'TWEET-' + this._lastReadTweet + '-' + this._firstReadTweet : null;
      twitterQuery.queryTweets(this.query, this.type, maxPosition).then(function (tweets) {
        if (!_this2._firstReadTweet) {
          _this2._firstReadTweet = tweets[0] ? tweets[0].id : null;
        }

        var lastReadTweetId = void 0;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = tweets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var tweet = _step.value;

            lastReadTweetId = tweet.id;

            _this2.push(tweet);
            _this2._numberOfTweetsRead++;
            if (_this2._numberOfTweetsRead >= _this2.count) {
              debug('TweetStream has read up to the max count');
              break;
            }
          }

          // We have to check to see if there are more tweets, by seeing if the
          // last tweet id has been repeated or not.
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        var hasZeroTweets = lastReadTweetId === undefined;
        var hasDifferentLastTweet = _this2._lastReadTweet !== lastReadTweetId;
        var hasMoreTweets = !hasZeroTweets && hasDifferentLastTweet;
        if (hasMoreTweets === false) {
          debug('TweetStream has no more tweets:', {
            hasZeroTweets: hasZeroTweets,
            hasDifferentLastTweet: hasDifferentLastTweet,
            hasMoreTweets: hasMoreTweets
          });
          _this2.push(null);
        } else {
          debug('TweetStream has more tweets:', {
            hasZeroTweets: hasZeroTweets,
            hasDifferentLastTweet: hasDifferentLastTweet,
            hasMoreTweets: hasMoreTweets
          });
        }

        debug('TweetStream sets the last tweet to ' + lastReadTweetId);
        _this2._lastReadTweet = lastReadTweetId;

        _this2.isLocked = false;
        debug('TweetStream is now unlocked');

        if (hasMoreTweets) {
          debug('TweetStream has more tweets so calls this._read');
          _this2._read();
        }
      }).catch(function (err) {
        return _this2.emit('error', err);
      });
    }
  }]);

  return TweetStream;
}(Readable);

module.exports = TweetStream;