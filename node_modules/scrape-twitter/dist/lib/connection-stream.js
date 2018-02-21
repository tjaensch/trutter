'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Readable = require('readable-stream/readable');
var debug = require('debug')('scrape-twitter:connection-stream');

var login = require('./twitter-login');
var twitterQuery = require('./twitter-query');

var ConnectionStream = function (_Readable) {
  _inherits(ConnectionStream, _Readable);

  function ConnectionStream(username, type) {
    var env = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, ConnectionStream);

    var _this = _possibleConstructorReturn(this, (ConnectionStream.__proto__ || Object.getPrototypeOf(ConnectionStream)).call(this, { objectMode: true }));

    _this.isLocked = false;
    _this._numberOfConnectionsRead = 0;
    _this._lastMinPosition = undefined;

    _this.username = username;
    _this.type = type;
    _this.env = env;
    debug('ConnectionStream for ' + _this.username + ' created for ', {
      type: _this.type
    });
    return _this;
  }

  _createClass(ConnectionStream, [{
    key: '_read',
    value: function _read() {
      var _this2 = this;

      if (this.isLocked) {
        debug('ConnectionStream cannot be read as it is locked');
        return false;
      }
      if (this._readableState.destroyed) {
        debug('ConnectionStream cannot be read as it is destroyed');
        this.push(null);
        return false;
      }

      this.isLocked = true;
      debug('ConnectionStream is now locked');

      debug('ConnectionStream reads profiles' + (this._lastMinPosition ? ' from position ' + this._lastMinPosition + ' onwards' : ''));

      login(this.env).then(function () {
        return twitterQuery.getUserConnections(_this2.username, _this2.type, _this2._lastMinPosition).then(function (connections) {
          var lastReadConnectionId = void 0;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = connections[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var connection = _step.value;

              lastReadConnectionId = connection.screenName;

              _this2.push(connection);
              _this2._numberOfConnectionsRead++;
            }

            // We have to check to see if there are more connections,
            // by seeing if the last connection id has been repeated or not.
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

          var hasZeroConnections = lastReadConnectionId === undefined;
          var hasDifferentLastConnection = _this2._lastReadConnectionId !== lastReadConnectionId;
          var hasMoreConnections = !hasZeroConnections && hasDifferentLastConnection;
          if (hasMoreConnections === false) {
            debug('ConnectionStream has no more connections:', {
              hasZeroConnections: hasZeroConnections,
              hasDifferentLastConnection: hasDifferentLastConnection,
              hasMoreConnections: hasMoreConnections
            });
            _this2.push(null);
          } else {
            debug('ConnectionStream has more connections:', {
              hasZeroConnections: hasZeroConnections,
              hasDifferentLastConnection: hasDifferentLastConnection,
              hasMoreConnections: hasMoreConnections
            });
          }

          debug('ConnectionStream sets the last min position to ' + connections._minPosition);
          _this2._lastMinPosition = connections._minPosition;

          _this2.isLocked = false;
          debug('ConnectionStream is now unlocked');

          if (hasMoreConnections) {
            debug('ConnectionStream has more connections so calls this._read');
            _this2._read();
          }
        }).catch(function (err) {
          return _this2.emit('error', err);
        });
      }).catch(function (err) {
        return _this2.emit('error', err);
      });
    }
  }]);

  return ConnectionStream;
}(Readable);

module.exports = ConnectionStream;