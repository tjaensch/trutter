'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Readable = require('readable-stream/readable');
var debug = require('debug')('scrape-twitter:list-stream');

var twitterQuery = require('./twitter-query');

var ListStream = function (_Readable) {
  _inherits(ListStream, _Readable);

  function ListStream(username, list) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        count = _ref.count;

    _classCallCheck(this, ListStream);

    var _this = _possibleConstructorReturn(this, (ListStream.__proto__ || Object.getPrototypeOf(ListStream)).call(this, { objectMode: true }));

    _this.isLocked = false;
    _this._numberOfTweetsRead = 0;
    _this._lastReadTweetId = undefined;

    _this.username = username;
    _this.list = list;
    _this.count = count;
    debug('ListStream for ' + _this.username + '/' + _this.list + ' created');
    return _this;
  }

  _createClass(ListStream, [{
    key: '_read',
    value: function _read() {
      var _this2 = this;

      if (this.isLocked) {
        debug('ListStream cannot be read as it is locked');
        return false;
      }
      if (!!this.count && this._numberOfTweetsRead >= this.count) {
        debug('ListStream has read up to the max count');
        this.push(null);
        return false;
      }
      if (this._readableState.destroyed) {
        debug('ListStream cannot be read as it is destroyed');
        this.push(null);
        return false;
      }

      this.isLocked = true;
      debug('ListStream is now locked');

      debug('ListStream reads list' + (this._lastReadTweetId ? ' from tweet ' + this._lastReadTweetId + ' onwards' : ''));
      twitterQuery.getUserList(this.username, this.list, this._lastReadTweetId).then(function (tweets) {
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
              debug('ListStream has read up to the max count');
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
        var hasDifferentLastTweet = _this2._lastReadTweetId !== lastReadTweetId;
        var hasMoreTweets = !hasZeroTweets && hasDifferentLastTweet;
        if (hasMoreTweets === false) {
          debug('ListStream has no more tweets:', {
            hasZeroTweets: hasZeroTweets,
            hasDifferentLastTweet: hasDifferentLastTweet,
            hasMoreTweets: hasMoreTweets
          });
          _this2.push(null);
        } else {
          debug('ListStream has more tweets:', {
            hasZeroTweets: hasZeroTweets,
            hasDifferentLastTweet: hasDifferentLastTweet,
            hasMoreTweets: hasMoreTweets
          });
        }

        debug('ListStream sets the last tweet to ' + lastReadTweetId);
        _this2._lastReadTweetId = lastReadTweetId;

        _this2.isLocked = false;
        debug('ListStream is now unlocked');

        if (hasMoreTweets) {
          debug('ListStream has more tweets so calls this._read');
          _this2._read();
        }
      }).catch(function (err) {
        return _this2.emit('error', err);
      });
    }
  }]);

  return ListStream;
}(Readable);

module.exports = ListStream;