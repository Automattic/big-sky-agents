#!/usr/bin/env node
'use strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import require$$0, { statSync, readdirSync, readFileSync, writeFile } from 'fs';
import path$1, { resolve, dirname, normalize, basename, extname, relative } from 'path';
import require$$2 from 'os';
import require$$3 from 'crypto';
import { notStrictEqual, strictEqual } from 'assert';
import { format, inspect } from 'util';
import { fileURLToPath } from 'url';

// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues$1;
const rnds8$1 = new Uint8Array(16);
function rng$1() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues$1) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
    getRandomValues$1 = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
    if (!getRandomValues$1) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }
  return getRandomValues$1(rnds8$1);
}

var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

function validate(uuid) {
  return typeof uuid === 'string' && REGEX.test(uuid);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

const byteToHex$1 = [];
for (let i = 0; i < 256; ++i) {
  byteToHex$1.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify$1(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  return byteToHex$1[arr[offset + 0]] + byteToHex$1[arr[offset + 1]] + byteToHex$1[arr[offset + 2]] + byteToHex$1[arr[offset + 3]] + '-' + byteToHex$1[arr[offset + 4]] + byteToHex$1[arr[offset + 5]] + '-' + byteToHex$1[arr[offset + 6]] + byteToHex$1[arr[offset + 7]] + '-' + byteToHex$1[arr[offset + 8]] + byteToHex$1[arr[offset + 9]] + '-' + byteToHex$1[arr[offset + 10]] + byteToHex$1[arr[offset + 11]] + byteToHex$1[arr[offset + 12]] + byteToHex$1[arr[offset + 13]] + byteToHex$1[arr[offset + 14]] + byteToHex$1[arr[offset + 15]];
}

const randomUUID$1 = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native$1 = {
  randomUUID: randomUUID$1
};

function v4$1(options, buf, offset) {
  if (native$1.randomUUID && !buf && !options) {
    return native$1.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng$1)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided
  return unsafeStringify$1(rnds);
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var pRetry$2 = {exports: {}};

var retry$2 = {};

function RetryOperation(timeouts, options) {
  // Compatibility for the old (timeouts, retryForever) signature
  if (typeof options === 'boolean') {
    options = {
      forever: options
    };
  }
  this._originalTimeouts = JSON.parse(JSON.stringify(timeouts));
  this._timeouts = timeouts;
  this._options = options || {};
  this._maxRetryTime = options && options.maxRetryTime || Infinity;
  this._fn = null;
  this._errors = [];
  this._attempts = 1;
  this._operationTimeout = null;
  this._operationTimeoutCb = null;
  this._timeout = null;
  this._operationStart = null;
  this._timer = null;
  if (this._options.forever) {
    this._cachedTimeouts = this._timeouts.slice(0);
  }
}
var retry_operation = RetryOperation;
RetryOperation.prototype.reset = function () {
  this._attempts = 1;
  this._timeouts = this._originalTimeouts.slice(0);
};
RetryOperation.prototype.stop = function () {
  if (this._timeout) {
    clearTimeout(this._timeout);
  }
  if (this._timer) {
    clearTimeout(this._timer);
  }
  this._timeouts = [];
  this._cachedTimeouts = null;
};
RetryOperation.prototype.retry = function (err) {
  if (this._timeout) {
    clearTimeout(this._timeout);
  }
  if (!err) {
    return false;
  }
  var currentTime = new Date().getTime();
  if (err && currentTime - this._operationStart >= this._maxRetryTime) {
    this._errors.push(err);
    this._errors.unshift(new Error('RetryOperation timeout occurred'));
    return false;
  }
  this._errors.push(err);
  var timeout = this._timeouts.shift();
  if (timeout === undefined) {
    if (this._cachedTimeouts) {
      // retry forever, only keep last error
      this._errors.splice(0, this._errors.length - 1);
      timeout = this._cachedTimeouts.slice(-1);
    } else {
      return false;
    }
  }
  var self = this;
  this._timer = setTimeout(function () {
    self._attempts++;
    if (self._operationTimeoutCb) {
      self._timeout = setTimeout(function () {
        self._operationTimeoutCb(self._attempts);
      }, self._operationTimeout);
      if (self._options.unref) {
        self._timeout.unref();
      }
    }
    self._fn(self._attempts);
  }, timeout);
  if (this._options.unref) {
    this._timer.unref();
  }
  return true;
};
RetryOperation.prototype.attempt = function (fn, timeoutOps) {
  this._fn = fn;
  if (timeoutOps) {
    if (timeoutOps.timeout) {
      this._operationTimeout = timeoutOps.timeout;
    }
    if (timeoutOps.cb) {
      this._operationTimeoutCb = timeoutOps.cb;
    }
  }
  var self = this;
  if (this._operationTimeoutCb) {
    this._timeout = setTimeout(function () {
      self._operationTimeoutCb();
    }, self._operationTimeout);
  }
  this._operationStart = new Date().getTime();
  this._fn(this._attempts);
};
RetryOperation.prototype.try = function (fn) {
  console.log('Using RetryOperation.try() is deprecated');
  this.attempt(fn);
};
RetryOperation.prototype.start = function (fn) {
  console.log('Using RetryOperation.start() is deprecated');
  this.attempt(fn);
};
RetryOperation.prototype.start = RetryOperation.prototype.try;
RetryOperation.prototype.errors = function () {
  return this._errors;
};
RetryOperation.prototype.attempts = function () {
  return this._attempts;
};
RetryOperation.prototype.mainError = function () {
  if (this._errors.length === 0) {
    return null;
  }
  var counts = {};
  var mainError = null;
  var mainErrorCount = 0;
  for (var i = 0; i < this._errors.length; i++) {
    var error = this._errors[i];
    var message = error.message;
    var count = (counts[message] || 0) + 1;
    counts[message] = count;
    if (count >= mainErrorCount) {
      mainError = error;
      mainErrorCount = count;
    }
  }
  return mainError;
};

(function (exports) {
  var RetryOperation = retry_operation;
  exports.operation = function (options) {
    var timeouts = exports.timeouts(options);
    return new RetryOperation(timeouts, {
      forever: options && (options.forever || options.retries === Infinity),
      unref: options && options.unref,
      maxRetryTime: options && options.maxRetryTime
    });
  };
  exports.timeouts = function (options) {
    if (options instanceof Array) {
      return [].concat(options);
    }
    var opts = {
      retries: 10,
      factor: 2,
      minTimeout: 1 * 1000,
      maxTimeout: Infinity,
      randomize: false
    };
    for (var key in options) {
      opts[key] = options[key];
    }
    if (opts.minTimeout > opts.maxTimeout) {
      throw new Error('minTimeout is greater than maxTimeout');
    }
    var timeouts = [];
    for (var i = 0; i < opts.retries; i++) {
      timeouts.push(this.createTimeout(i, opts));
    }
    if (options && options.forever && !timeouts.length) {
      timeouts.push(this.createTimeout(i, opts));
    }

    // sort the array numerically ascending
    timeouts.sort(function (a, b) {
      return a - b;
    });
    return timeouts;
  };
  exports.createTimeout = function (attempt, opts) {
    var random = opts.randomize ? Math.random() + 1 : 1;
    var timeout = Math.round(random * Math.max(opts.minTimeout, 1) * Math.pow(opts.factor, attempt));
    timeout = Math.min(timeout, opts.maxTimeout);
    return timeout;
  };
  exports.wrap = function (obj, options, methods) {
    if (options instanceof Array) {
      methods = options;
      options = null;
    }
    if (!methods) {
      methods = [];
      for (var key in obj) {
        if (typeof obj[key] === 'function') {
          methods.push(key);
        }
      }
    }
    for (var i = 0; i < methods.length; i++) {
      var method = methods[i];
      var original = obj[method];
      obj[method] = function retryWrapper(original) {
        var op = exports.operation(options);
        var args = Array.prototype.slice.call(arguments, 1);
        var callback = args.pop();
        args.push(function (err) {
          if (op.retry(err)) {
            return;
          }
          if (err) {
            arguments[0] = op.mainError();
          }
          callback.apply(this, arguments);
        });
        op.attempt(function () {
          original.apply(obj, args);
        });
      }.bind(obj, original);
      obj[method].options = options;
    }
  };
})(retry$2);

var retry$1 = retry$2;

const retry = retry$1;
const networkErrorMsgs = ['Failed to fetch',
// Chrome
'NetworkError when attempting to fetch resource.',
// Firefox
'The Internet connection appears to be offline.',
// Safari
'Network request failed' // `cross-fetch`
];
class AbortError extends Error {
  constructor(message) {
    super();
    if (message instanceof Error) {
      this.originalError = message;
      ({
        message
      } = message);
    } else {
      this.originalError = new Error(message);
      this.originalError.stack = this.stack;
    }
    this.name = 'AbortError';
    this.message = message;
  }
}
const decorateErrorWithCounts = (error, attemptNumber, options) => {
  // Minus 1 from attemptNumber because the first attempt does not count as a retry
  const retriesLeft = options.retries - (attemptNumber - 1);
  error.attemptNumber = attemptNumber;
  error.retriesLeft = retriesLeft;
  return error;
};
const isNetworkError = errorMessage => networkErrorMsgs.includes(errorMessage);
const pRetry = (input, options) => new Promise((resolve, reject) => {
  options = {
    onFailedAttempt: () => {},
    retries: 10,
    ...options
  };
  const operation = retry.operation(options);
  operation.attempt(async attemptNumber => {
    try {
      resolve(await input(attemptNumber));
    } catch (error) {
      if (!(error instanceof Error)) {
        reject(new TypeError(`Non-error was thrown: "${error}". You should only throw errors.`));
        return;
      }
      if (error instanceof AbortError) {
        operation.stop();
        reject(error.originalError);
      } else if (error instanceof TypeError && !isNetworkError(error.message)) {
        operation.stop();
        reject(error);
      } else {
        decorateErrorWithCounts(error, attemptNumber, options);
        try {
          await options.onFailedAttempt(error);
        } catch (error) {
          reject(error);
          return;
        }
        if (!operation.retry(error)) {
          reject(operation.mainError());
        }
      }
    }
  });
});
pRetry$2.exports = pRetry;
// TODO: remove this in the next major version
pRetry$2.exports.default = pRetry;
pRetry$2.exports.AbortError = AbortError;
var pRetryExports = pRetry$2.exports;
var pRetry$1 = /*@__PURE__*/getDefaultExportFromCjs(pRetryExports);

var dist = {};

var eventemitter3 = {exports: {}};

(function (module) {

  var has = Object.prototype.hasOwnProperty,
    prefix = '~';

  /**
   * Constructor to create a storage for our `EE` objects.
   * An `Events` instance is a plain object whose properties are event names.
   *
   * @constructor
   * @private
   */
  function Events() {}

  //
  // We try to not inherit from `Object.prototype`. In some engines creating an
  // instance in this way is faster than calling `Object.create(null)` directly.
  // If `Object.create(null)` is not supported we prefix the event names with a
  // character to make sure that the built-in object properties are not
  // overridden or used as an attack vector.
  //
  if (Object.create) {
    Events.prototype = Object.create(null);

    //
    // This hack is needed because the `__proto__` property is still inherited in
    // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
    //
    if (!new Events().__proto__) prefix = false;
  }

  /**
   * Representation of a single event listener.
   *
   * @param {Function} fn The listener function.
   * @param {*} context The context to invoke the listener with.
   * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
   * @constructor
   * @private
   */
  function EE(fn, context, once) {
    this.fn = fn;
    this.context = context;
    this.once = once || false;
  }

  /**
   * Add a listener for a given event.
   *
   * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} context The context to invoke the listener with.
   * @param {Boolean} once Specify if the listener is a one-time listener.
   * @returns {EventEmitter}
   * @private
   */
  function addListener(emitter, event, fn, context, once) {
    if (typeof fn !== 'function') {
      throw new TypeError('The listener must be a function');
    }
    var listener = new EE(fn, context || emitter, once),
      evt = prefix ? prefix + event : event;
    if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);else emitter._events[evt] = [emitter._events[evt], listener];
    return emitter;
  }

  /**
   * Clear event by name.
   *
   * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
   * @param {(String|Symbol)} evt The Event name.
   * @private
   */
  function clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0) emitter._events = new Events();else delete emitter._events[evt];
  }

  /**
   * Minimal `EventEmitter` interface that is molded against the Node.js
   * `EventEmitter` interface.
   *
   * @constructor
   * @public
   */
  function EventEmitter() {
    this._events = new Events();
    this._eventsCount = 0;
  }

  /**
   * Return an array listing the events for which the emitter has registered
   * listeners.
   *
   * @returns {Array}
   * @public
   */
  EventEmitter.prototype.eventNames = function eventNames() {
    var names = [],
      events,
      name;
    if (this._eventsCount === 0) return names;
    for (name in events = this._events) {
      if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
    }
    if (Object.getOwnPropertySymbols) {
      return names.concat(Object.getOwnPropertySymbols(events));
    }
    return names;
  };

  /**
   * Return the listeners registered for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Array} The registered listeners.
   * @public
   */
  EventEmitter.prototype.listeners = function listeners(event) {
    var evt = prefix ? prefix + event : event,
      handlers = this._events[evt];
    if (!handlers) return [];
    if (handlers.fn) return [handlers.fn];
    for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
      ee[i] = handlers[i].fn;
    }
    return ee;
  };

  /**
   * Return the number of listeners listening to a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Number} The number of listeners.
   * @public
   */
  EventEmitter.prototype.listenerCount = function listenerCount(event) {
    var evt = prefix ? prefix + event : event,
      listeners = this._events[evt];
    if (!listeners) return 0;
    if (listeners.fn) return 1;
    return listeners.length;
  };

  /**
   * Calls each of the listeners registered for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @returns {Boolean} `true` if the event had listeners, else `false`.
   * @public
   */
  EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt]) return false;
    var listeners = this._events[evt],
      len = arguments.length,
      args,
      i;
    if (listeners.fn) {
      if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);
      switch (len) {
        case 1:
          return listeners.fn.call(listeners.context), true;
        case 2:
          return listeners.fn.call(listeners.context, a1), true;
        case 3:
          return listeners.fn.call(listeners.context, a1, a2), true;
        case 4:
          return listeners.fn.call(listeners.context, a1, a2, a3), true;
        case 5:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
        case 6:
          return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
      }
      for (i = 1, args = new Array(len - 1); i < len; i++) {
        args[i - 1] = arguments[i];
      }
      listeners.fn.apply(listeners.context, args);
    } else {
      var length = listeners.length,
        j;
      for (i = 0; i < length; i++) {
        if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);
        switch (len) {
          case 1:
            listeners[i].fn.call(listeners[i].context);
            break;
          case 2:
            listeners[i].fn.call(listeners[i].context, a1);
            break;
          case 3:
            listeners[i].fn.call(listeners[i].context, a1, a2);
            break;
          case 4:
            listeners[i].fn.call(listeners[i].context, a1, a2, a3);
            break;
          default:
            if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
              args[j - 1] = arguments[j];
            }
            listeners[i].fn.apply(listeners[i].context, args);
        }
      }
    }
    return true;
  };

  /**
   * Add a listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   * @returns {EventEmitter} `this`.
   * @public
   */
  EventEmitter.prototype.on = function on(event, fn, context) {
    return addListener(this, event, fn, context, false);
  };

  /**
   * Add a one-time listener for a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn The listener function.
   * @param {*} [context=this] The context to invoke the listener with.
   * @returns {EventEmitter} `this`.
   * @public
   */
  EventEmitter.prototype.once = function once(event, fn, context) {
    return addListener(this, event, fn, context, true);
  };

  /**
   * Remove the listeners of a given event.
   *
   * @param {(String|Symbol)} event The event name.
   * @param {Function} fn Only remove the listeners that match this function.
   * @param {*} context Only remove the listeners that have this context.
   * @param {Boolean} once Only remove one-time listeners.
   * @returns {EventEmitter} `this`.
   * @public
   */
  EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
    var evt = prefix ? prefix + event : event;
    if (!this._events[evt]) return this;
    if (!fn) {
      clearEvent(this, evt);
      return this;
    }
    var listeners = this._events[evt];
    if (listeners.fn) {
      if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
        clearEvent(this, evt);
      }
    } else {
      for (var i = 0, events = [], length = listeners.length; i < length; i++) {
        if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
          events.push(listeners[i]);
        }
      }

      //
      // Reset the array, or remove it completely if we have no more listeners.
      //
      if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;else clearEvent(this, evt);
    }
    return this;
  };

  /**
   * Remove all listeners, or those of the specified event.
   *
   * @param {(String|Symbol)} [event] The event name.
   * @returns {EventEmitter} `this`.
   * @public
   */
  EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
    var evt;
    if (event) {
      evt = prefix ? prefix + event : event;
      if (this._events[evt]) clearEvent(this, evt);
    } else {
      this._events = new Events();
      this._eventsCount = 0;
    }
    return this;
  };

  //
  // Alias methods names because people roll like that.
  //
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  //
  // Expose the prefix.
  //
  EventEmitter.prefixed = prefix;

  //
  // Allow `EventEmitter` to be imported as module namespace.
  //
  EventEmitter.EventEmitter = EventEmitter;

  //
  // Expose the module.
  //
  {
    module.exports = EventEmitter;
  }
})(eventemitter3);
var eventemitter3Exports = eventemitter3.exports;

var pTimeout$1 = {exports: {}};

var pFinally$1 = (promise, onFinally) => {
  onFinally = onFinally || (() => {});
  return promise.then(val => new Promise(resolve => {
    resolve(onFinally());
  }).then(() => val), err => new Promise(resolve => {
    resolve(onFinally());
  }).then(() => {
    throw err;
  }));
};

const pFinally = pFinally$1;
class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}
const pTimeout = (promise, milliseconds, fallback) => new Promise((resolve, reject) => {
  if (typeof milliseconds !== 'number' || milliseconds < 0) {
    throw new TypeError('Expected `milliseconds` to be a positive number');
  }
  if (milliseconds === Infinity) {
    resolve(promise);
    return;
  }
  const timer = setTimeout(() => {
    if (typeof fallback === 'function') {
      try {
        resolve(fallback());
      } catch (error) {
        reject(error);
      }
      return;
    }
    const message = typeof fallback === 'string' ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
    const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message);
    if (typeof promise.cancel === 'function') {
      promise.cancel();
    }
    reject(timeoutError);
  }, milliseconds);

  // TODO: Use native `finally` keyword when targeting Node.js 10
  pFinally(
  // eslint-disable-next-line promise/prefer-await-to-then
  promise.then(resolve, reject), () => {
    clearTimeout(timer);
  });
});
pTimeout$1.exports = pTimeout;
// TODO: Remove this for the next major release
pTimeout$1.exports.default = pTimeout;
pTimeout$1.exports.TimeoutError = TimeoutError;
var pTimeoutExports = pTimeout$1.exports;

var priorityQueue = {};

var lowerBound$1 = {};

Object.defineProperty(lowerBound$1, "__esModule", {
  value: true
});
// Port of lower_bound from https://en.cppreference.com/w/cpp/algorithm/lower_bound
// Used to compute insertion index to keep queue sorted after insertion
function lowerBound(array, value, comparator) {
  let first = 0;
  let count = array.length;
  while (count > 0) {
    const step = count / 2 | 0;
    let it = first + step;
    if (comparator(array[it], value) <= 0) {
      first = ++it;
      count -= step + 1;
    } else {
      count = step;
    }
  }
  return first;
}
lowerBound$1.default = lowerBound;

Object.defineProperty(priorityQueue, "__esModule", {
  value: true
});
const lower_bound_1 = lowerBound$1;
class PriorityQueue {
  constructor() {
    this._queue = [];
  }
  enqueue(run, options) {
    options = Object.assign({
      priority: 0
    }, options);
    const element = {
      priority: options.priority,
      run
    };
    if (this.size && this._queue[this.size - 1].priority >= options.priority) {
      this._queue.push(element);
      return;
    }
    const index = lower_bound_1.default(this._queue, element, (a, b) => b.priority - a.priority);
    this._queue.splice(index, 0, element);
  }
  dequeue() {
    const item = this._queue.shift();
    return item === null || item === void 0 ? void 0 : item.run;
  }
  filter(options) {
    return this._queue.filter(element => element.priority === options.priority).map(element => element.run);
  }
  get size() {
    return this._queue.length;
  }
}
priorityQueue.default = PriorityQueue;

Object.defineProperty(dist, "__esModule", {
  value: true
});
const EventEmitter = eventemitter3Exports;
const p_timeout_1 = pTimeoutExports;
const priority_queue_1 = priorityQueue;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const empty = () => {};
const timeoutError = new p_timeout_1.TimeoutError();
/**
Promise queue with concurrency control.
*/
class PQueue extends EventEmitter {
  constructor(options) {
    var _a, _b, _c, _d;
    super();
    this._intervalCount = 0;
    this._intervalEnd = 0;
    this._pendingCount = 0;
    this._resolveEmpty = empty;
    this._resolveIdle = empty;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    options = Object.assign({
      carryoverConcurrencyCount: false,
      intervalCap: Infinity,
      interval: 0,
      concurrency: Infinity,
      autoStart: true,
      queueClass: priority_queue_1.default
    }, options);
    if (!(typeof options.intervalCap === 'number' && options.intervalCap >= 1)) {
      throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${(_b = (_a = options.intervalCap) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : ''}\` (${typeof options.intervalCap})`);
    }
    if (options.interval === undefined || !(Number.isFinite(options.interval) && options.interval >= 0)) {
      throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${(_d = (_c = options.interval) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ''}\` (${typeof options.interval})`);
    }
    this._carryoverConcurrencyCount = options.carryoverConcurrencyCount;
    this._isIntervalIgnored = options.intervalCap === Infinity || options.interval === 0;
    this._intervalCap = options.intervalCap;
    this._interval = options.interval;
    this._queue = new options.queueClass();
    this._queueClass = options.queueClass;
    this.concurrency = options.concurrency;
    this._timeout = options.timeout;
    this._throwOnTimeout = options.throwOnTimeout === true;
    this._isPaused = options.autoStart === false;
  }
  get _doesIntervalAllowAnother() {
    return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
  }
  get _doesConcurrentAllowAnother() {
    return this._pendingCount < this._concurrency;
  }
  _next() {
    this._pendingCount--;
    this._tryToStartAnother();
    this.emit('next');
  }
  _resolvePromises() {
    this._resolveEmpty();
    this._resolveEmpty = empty;
    if (this._pendingCount === 0) {
      this._resolveIdle();
      this._resolveIdle = empty;
      this.emit('idle');
    }
  }
  _onResumeInterval() {
    this._onInterval();
    this._initializeIntervalIfNeeded();
    this._timeoutId = undefined;
  }
  _isIntervalPaused() {
    const now = Date.now();
    if (this._intervalId === undefined) {
      const delay = this._intervalEnd - now;
      if (delay < 0) {
        // Act as the interval was done
        // We don't need to resume it here because it will be resumed on line 160
        this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
      } else {
        // Act as the interval is pending
        if (this._timeoutId === undefined) {
          this._timeoutId = setTimeout(() => {
            this._onResumeInterval();
          }, delay);
        }
        return true;
      }
    }
    return false;
  }
  _tryToStartAnother() {
    if (this._queue.size === 0) {
      // We can clear the interval ("pause")
      // Because we can redo it later ("resume")
      if (this._intervalId) {
        clearInterval(this._intervalId);
      }
      this._intervalId = undefined;
      this._resolvePromises();
      return false;
    }
    if (!this._isPaused) {
      const canInitializeInterval = !this._isIntervalPaused();
      if (this._doesIntervalAllowAnother && this._doesConcurrentAllowAnother) {
        const job = this._queue.dequeue();
        if (!job) {
          return false;
        }
        this.emit('active');
        job();
        if (canInitializeInterval) {
          this._initializeIntervalIfNeeded();
        }
        return true;
      }
    }
    return false;
  }
  _initializeIntervalIfNeeded() {
    if (this._isIntervalIgnored || this._intervalId !== undefined) {
      return;
    }
    this._intervalId = setInterval(() => {
      this._onInterval();
    }, this._interval);
    this._intervalEnd = Date.now() + this._interval;
  }
  _onInterval() {
    if (this._intervalCount === 0 && this._pendingCount === 0 && this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
    this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
    this._processQueue();
  }
  /**
  Executes all queued functions until it reaches the limit.
  */
  _processQueue() {
    // eslint-disable-next-line no-empty
    while (this._tryToStartAnother()) {}
  }
  get concurrency() {
    return this._concurrency;
  }
  set concurrency(newConcurrency) {
    if (!(typeof newConcurrency === 'number' && newConcurrency >= 1)) {
      throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
    }
    this._concurrency = newConcurrency;
    this._processQueue();
  }
  /**
  Adds a sync or async task to the queue. Always returns a promise.
  */
  async add(fn, options = {}) {
    return new Promise((resolve, reject) => {
      const run = async () => {
        this._pendingCount++;
        this._intervalCount++;
        try {
          const operation = this._timeout === undefined && options.timeout === undefined ? fn() : p_timeout_1.default(Promise.resolve(fn()), options.timeout === undefined ? this._timeout : options.timeout, () => {
            if (options.throwOnTimeout === undefined ? this._throwOnTimeout : options.throwOnTimeout) {
              reject(timeoutError);
            }
            return undefined;
          });
          resolve(await operation);
        } catch (error) {
          reject(error);
        }
        this._next();
      };
      this._queue.enqueue(run, options);
      this._tryToStartAnother();
      this.emit('add');
    });
  }
  /**
  Same as `.add()`, but accepts an array of sync or async functions.
   @returns A promise that resolves when all functions are resolved.
  */
  async addAll(functions, options) {
    return Promise.all(functions.map(async function_ => this.add(function_, options)));
  }
  /**
  Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
  */
  start() {
    if (!this._isPaused) {
      return this;
    }
    this._isPaused = false;
    this._processQueue();
    return this;
  }
  /**
  Put queue execution on hold.
  */
  pause() {
    this._isPaused = true;
  }
  /**
  Clear the queue.
  */
  clear() {
    this._queue = new this._queueClass();
  }
  /**
  Can be called multiple times. Useful if you for example add additional items at a later time.
   @returns A promise that settles when the queue becomes empty.
  */
  async onEmpty() {
    // Instantly resolve if the queue is empty
    if (this._queue.size === 0) {
      return;
    }
    return new Promise(resolve => {
      const existingResolve = this._resolveEmpty;
      this._resolveEmpty = () => {
        existingResolve();
        resolve();
      };
    });
  }
  /**
  The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.
   @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
  */
  async onIdle() {
    // Instantly resolve if none pending and if nothing else is queued
    if (this._pendingCount === 0 && this._queue.size === 0) {
      return;
    }
    return new Promise(resolve => {
      const existingResolve = this._resolveIdle;
      this._resolveIdle = () => {
        existingResolve();
        resolve();
      };
    });
  }
  /**
  Size of the queue.
  */
  get size() {
    return this._queue.size;
  }
  /**
  Size of the queue, filtered by the given options.
   For example, this can be used to find the number of items remaining in the queue with a specific priority level.
  */
  sizeBy(options) {
    // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
    return this._queue.filter(options).length;
  }
  /**
  Number of pending promises.
  */
  get pending() {
    return this._pendingCount;
  }
  /**
  Whether the queue is currently paused.
  */
  get isPaused() {
    return this._isPaused;
  }
  get timeout() {
    return this._timeout;
  }
  /**
  Set the timeout for future operations.
  */
  set timeout(milliseconds) {
    this._timeout = milliseconds;
  }
}
var _default = dist.default = PQueue;

const STATUS_NO_RETRY = [400,
// Bad Request
401,
// Unauthorized
403,
// Forbidden
404,
// Not Found
405,
// Method Not Allowed
406,
// Not Acceptable
407,
// Proxy Authentication Required
408 // Request Timeout
];
const STATUS_IGNORE = [409 // Conflict
];
/**
 * A class that can be used to make async calls with concurrency and retry logic.
 *
 * This is useful for making calls to any kind of "expensive" external resource,
 * be it because it's rate-limited, subject to network issues, etc.
 *
 * Concurrent calls are limited by the `maxConcurrency` parameter, which defaults
 * to `Infinity`. This means that by default, all calls will be made in parallel.
 *
 * Retries are limited by the `maxRetries` parameter, which defaults to 6. This
 * means that by default, each call will be retried up to 6 times, with an
 * exponential backoff between each attempt.
 */
class AsyncCaller {
  constructor(params) {
    var _params$maxConcurrenc, _params$maxRetries;
    Object.defineProperty(this, "maxConcurrency", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "maxRetries", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "queue", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "onFailedResponseHook", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.maxConcurrency = (_params$maxConcurrenc = params.maxConcurrency) !== null && _params$maxConcurrenc !== void 0 ? _params$maxConcurrenc : Infinity;
    this.maxRetries = (_params$maxRetries = params.maxRetries) !== null && _params$maxRetries !== void 0 ? _params$maxRetries : 6;
    if ("default" in _default) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.queue = new _default.default({
        concurrency: this.maxConcurrency
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.queue = new _default({
        concurrency: this.maxConcurrency
      });
    }
    this.onFailedResponseHook = params?.onFailedResponseHook;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call(callable, ...args) {
    const onFailedResponseHook = this.onFailedResponseHook;
    return this.queue.add(() => pRetry$1(() => callable(...args).catch(error => {
      // eslint-disable-next-line no-instanceof/no-instanceof
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(error);
      }
    }), {
      async onFailedAttempt(error) {
        if (error.message.startsWith("Cancel") || error.message.startsWith("TimeoutError") || error.message.startsWith("AbortError")) {
          throw error;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (error?.code === "ECONNABORTED") {
          throw error;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = error?.response;
        const status = response?.status;
        if (status) {
          if (STATUS_NO_RETRY.includes(+status)) {
            throw error;
          } else if (STATUS_IGNORE.includes(+status)) {
            return;
          }
          if (onFailedResponseHook) {
            await onFailedResponseHook(response);
          }
        }
      },
      // If needed we can change some of the defaults here,
      // but they're quite sensible.
      retries: this.maxRetries,
      randomize: true
    }), {
      throwOnTimeout: true
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callWithOptions(options, callable, ...args) {
    // Note this doesn't cancel the underlying request,
    // when available prefer to use the signal option of the underlying call
    if (options.signal) {
      return Promise.race([this.call(callable, ...args), new Promise((_, reject) => {
        options.signal?.addEventListener("abort", () => {
          reject(new Error("AbortError"));
        });
      })]);
    }
    return this.call(callable, ...args);
  }
  fetch(...args) {
    return this.call(() => fetch(...args).then(res => res.ok ? res : Promise.reject(res)));
  }
}

function isLangChainMessage(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
message) {
  return typeof message?._getType === "function";
}
function convertLangChainMessageToExample(message) {
  const converted = {
    type: message._getType(),
    data: {
      content: message.content
    }
  };
  // Check for presence of keys in additional_kwargs
  if (message?.additional_kwargs && Object.keys(message.additional_kwargs).length > 0) {
    converted.data.additional_kwargs = {
      ...message.additional_kwargs
    };
  }
  return converted;
}

// Inlined from https://github.com/flexdinesh/browser-or-node
let globalEnv;
const isBrowser$1 = () => typeof window !== "undefined" && typeof window.document !== "undefined";
const isWebWorker$1 = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
const isJsDom$1 = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && (navigator.userAgent.includes("Node.js") || navigator.userAgent.includes("jsdom"));
// Supabase Edge Function provides a `Deno` global object
// without `version` property
const isDeno$1 = () => typeof Deno !== "undefined";
// Mark not-as-node if in Supabase Edge Function
const isNode$1 = () => typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && !isDeno$1();
const getEnv$1 = () => {
  if (globalEnv) {
    return globalEnv;
  }
  if (isBrowser$1()) {
    globalEnv = "browser";
  } else if (isNode$1()) {
    globalEnv = "node";
  } else if (isWebWorker$1()) {
    globalEnv = "webworker";
  } else if (isJsDom$1()) {
    globalEnv = "jsdom";
  } else if (isDeno$1()) {
    globalEnv = "deno";
  } else {
    globalEnv = "other";
  }
  return globalEnv;
};
let runtimeEnvironment$1;
async function getRuntimeEnvironment$1() {
  if (runtimeEnvironment$1 === undefined) {
    const env = getEnv$1();
    const releaseEnv = getShas();
    runtimeEnvironment$1 = {
      library: "langsmith",
      runtime: env,
      sdk: "langsmith-js",
      sdk_version: __version__,
      ...releaseEnv
    };
  }
  return runtimeEnvironment$1;
}
/**
 * Retrieves the LangChain-specific metadata from the current runtime environment.
 *
 * @returns {Record<string, string>}
 *  - A record of LangChain-specific metadata environment variables.
 */
function getLangChainEnvVarsMetadata() {
  const allEnvVars = getEnvironmentVariables() || {};
  const envVars = {};
  const excluded = ["LANGCHAIN_API_KEY", "LANGCHAIN_ENDPOINT", "LANGCHAIN_TRACING_V2", "LANGCHAIN_PROJECT", "LANGCHAIN_SESSION"];
  for (const [key, value] of Object.entries(allEnvVars)) {
    if (key.startsWith("LANGCHAIN_") && typeof value === "string" && !excluded.includes(key) && !key.toLowerCase().includes("key") && !key.toLowerCase().includes("secret") && !key.toLowerCase().includes("token")) {
      if (key === "LANGCHAIN_REVISION_ID") {
        envVars["revision_id"] = value;
      } else {
        envVars[key] = value;
      }
    }
  }
  return envVars;
}
/**
 * Retrieves the environment variables from the current runtime environment.
 *
 * This function is designed to operate in a variety of JS environments,
 * including Node.js, Deno, browsers, etc.
 *
 * @returns {Record<string, string> | undefined}
 *  - A record of environment variables if available.
 *  - `undefined` if the environment does not support or allows access to environment variables.
 */
function getEnvironmentVariables() {
  try {
    // Check for Node.js environment
    // eslint-disable-next-line no-process-env
    if (typeof process !== "undefined" && process.env) {
      // eslint-disable-next-line no-process-env
      return Object.entries(process.env).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {});
    }
    // For browsers and other environments, we may not have direct access to env variables
    // Return undefined or any other fallback as required.
    return undefined;
  } catch (e) {
    // Catch any errors that might occur while trying to access environment variables
    return undefined;
  }
}
function getEnvironmentVariable$1(name) {
  // Certain Deno setups will throw an error if you try to access environment variables
  // https://github.com/hwchase17/langchainjs/issues/1412
  try {
    return typeof process !== "undefined" ?
    // eslint-disable-next-line no-process-env
    process.env?.[name] : undefined;
  } catch (e) {
    return undefined;
  }
}
let cachedCommitSHAs;
/**
 * Get the Git commit SHA from common environment variables
 * used by different CI/CD platforms.
 * @returns {string | undefined} The Git commit SHA or undefined if not found.
 */
function getShas() {
  if (cachedCommitSHAs !== undefined) {
    return cachedCommitSHAs;
  }
  const common_release_envs = ["VERCEL_GIT_COMMIT_SHA", "NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA", "COMMIT_REF", "RENDER_GIT_COMMIT", "CI_COMMIT_SHA", "CIRCLE_SHA1", "CF_PAGES_COMMIT_SHA", "REACT_APP_GIT_SHA", "SOURCE_VERSION", "GITHUB_SHA", "TRAVIS_COMMIT", "GIT_COMMIT", "BUILD_VCS_NUMBER", "bamboo_planRepository_revision", "Build.SourceVersion", "BITBUCKET_COMMIT", "DRONE_COMMIT_SHA", "SEMAPHORE_GIT_SHA", "BUILDKITE_COMMIT"];
  const shas = {};
  for (const env of common_release_envs) {
    const envVar = getEnvironmentVariable$1(env);
    if (envVar !== undefined) {
      shas[env] = envVar;
    }
  }
  cachedCommitSHAs = shas;
  return shas;
}

function assertUuid(str) {
  if (!validate(str)) {
    throw new Error(`Invalid UUID: ${str}`);
  }
}

const warnedMessages = {};
function warnOnce(message) {
  if (!warnedMessages[message]) {
    console.warn(message);
    warnedMessages[message] = true;
  }
}

async function mergeRuntimeEnvIntoRunCreates(runs) {
  const runtimeEnv = await getRuntimeEnvironment$1();
  const envVars = getLangChainEnvVarsMetadata();
  return runs.map(run => {
    var _run$extra, _run$revision_id;
    const extra = (_run$extra = run.extra) !== null && _run$extra !== void 0 ? _run$extra : {};
    const metadata = extra.metadata;
    run.extra = {
      ...extra,
      runtime: {
        ...runtimeEnv,
        ...extra?.runtime
      },
      metadata: {
        ...envVars,
        ...(envVars.revision_id || run.revision_id ? {
          revision_id: (_run$revision_id = run.revision_id) !== null && _run$revision_id !== void 0 ? _run$revision_id : envVars.revision_id
        } : {}),
        ...metadata
      }
    };
    return run;
  });
}
const getTracingSamplingRate = () => {
  const samplingRateStr = getEnvironmentVariable$1("LANGCHAIN_TRACING_SAMPLING_RATE");
  if (samplingRateStr === undefined) {
    return undefined;
  }
  const samplingRate = parseFloat(samplingRateStr);
  if (samplingRate < 0 || samplingRate > 1) {
    throw new Error(`LANGCHAIN_TRACING_SAMPLING_RATE must be between 0 and 1 if set. Got: ${samplingRate}`);
  }
  return samplingRate;
};
// utility functions
const isLocalhost = url => {
  const strippedUrl = url.replace("http://", "").replace("https://", "");
  const hostname = strippedUrl.split("/")[0].split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};
const raiseForStatus = async (response, operation) => {
  // consume the response body to release the connection
  // https://undici.nodejs.org/#/?id=garbage-collection
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to ${operation}: ${response.status} ${response.statusText} ${body}`);
  }
};
async function toArray(iterable) {
  const result = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}
function trimQuotes(str) {
  if (str === undefined) {
    return undefined;
  }
  return str.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}
const handle429 = async response => {
  if (response?.status === 429) {
    var _response$headers$get;
    const retryAfter = parseInt((_response$headers$get = response.headers.get("retry-after")) !== null && _response$headers$get !== void 0 ? _response$headers$get : "30", 10) * 1000;
    if (retryAfter > 0) {
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      // Return directly after calling this check
      return true;
    }
  }
  // Fall back to existing status checks
  return false;
};
class Queue {
  constructor() {
    Object.defineProperty(this, "items", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
  }
  get size() {
    return this.items.length;
  }
  push(item) {
    // this.items.push is synchronous with promise creation:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise
    return new Promise(resolve => {
      this.items.push([item, resolve]);
    });
  }
  pop(upToN) {
    if (upToN < 1) {
      throw new Error("Number of items to pop off may not be less than 1.");
    }
    const popped = [];
    while (popped.length < upToN && this.items.length) {
      const item = this.items.shift();
      if (item) {
        popped.push(item);
      } else {
        break;
      }
    }
    return [popped.map(it => it[0]), () => popped.forEach(it => it[1]())];
  }
}
// 20 MB
const DEFAULT_BATCH_SIZE_LIMIT_BYTES = 20_971_520;
class Client {
  constructor(config = {}) {
    var _trimQuotes, _config$apiUrl, _config$apiKey, _config$webUrl, _config$timeout_ms, _config$callerOptions, _config$callerOptions2, _ref, _config$hideInputs, _ref2, _config$hideOutputs, _config$autoBatchTrac, _config$pendingAutoBa;
    Object.defineProperty(this, "apiKey", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "apiUrl", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "webUrl", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "caller", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "batchIngestCaller", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "timeout_ms", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_tenantId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "hideInputs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "hideOutputs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tracingSampleRate", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "sampledPostUuids", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Set()
    });
    Object.defineProperty(this, "autoBatchTracing", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "batchEndpointSupported", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "autoBatchQueue", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Queue()
    });
    Object.defineProperty(this, "pendingAutoBatchedRunLimit", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 100
    });
    Object.defineProperty(this, "autoBatchTimeout", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "autoBatchInitialDelayMs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 250
    });
    Object.defineProperty(this, "autoBatchAggregationDelayMs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 50
    });
    Object.defineProperty(this, "serverInfo", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "fetchOptions", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    const defaultConfig = Client.getDefaultClientConfig();
    this.tracingSampleRate = getTracingSamplingRate();
    this.apiUrl = (_trimQuotes = trimQuotes((_config$apiUrl = config.apiUrl) !== null && _config$apiUrl !== void 0 ? _config$apiUrl : defaultConfig.apiUrl)) !== null && _trimQuotes !== void 0 ? _trimQuotes : "";
    this.apiKey = trimQuotes((_config$apiKey = config.apiKey) !== null && _config$apiKey !== void 0 ? _config$apiKey : defaultConfig.apiKey);
    this.webUrl = trimQuotes((_config$webUrl = config.webUrl) !== null && _config$webUrl !== void 0 ? _config$webUrl : defaultConfig.webUrl);
    this.timeout_ms = (_config$timeout_ms = config.timeout_ms) !== null && _config$timeout_ms !== void 0 ? _config$timeout_ms : 12_000;
    this.caller = new AsyncCaller((_config$callerOptions = config.callerOptions) !== null && _config$callerOptions !== void 0 ? _config$callerOptions : {});
    this.batchIngestCaller = new AsyncCaller({
      ...((_config$callerOptions2 = config.callerOptions) !== null && _config$callerOptions2 !== void 0 ? _config$callerOptions2 : {}),
      onFailedResponseHook: handle429
    });
    this.hideInputs = (_ref = (_config$hideInputs = config.hideInputs) !== null && _config$hideInputs !== void 0 ? _config$hideInputs : config.anonymizer) !== null && _ref !== void 0 ? _ref : defaultConfig.hideInputs;
    this.hideOutputs = (_ref2 = (_config$hideOutputs = config.hideOutputs) !== null && _config$hideOutputs !== void 0 ? _config$hideOutputs : config.anonymizer) !== null && _ref2 !== void 0 ? _ref2 : defaultConfig.hideOutputs;
    this.autoBatchTracing = (_config$autoBatchTrac = config.autoBatchTracing) !== null && _config$autoBatchTrac !== void 0 ? _config$autoBatchTrac : this.autoBatchTracing;
    this.pendingAutoBatchedRunLimit = (_config$pendingAutoBa = config.pendingAutoBatchedRunLimit) !== null && _config$pendingAutoBa !== void 0 ? _config$pendingAutoBa : this.pendingAutoBatchedRunLimit;
    this.fetchOptions = config.fetchOptions || {};
  }
  static getDefaultClientConfig() {
    var _getEnvironmentVariab;
    const apiKey = getEnvironmentVariable$1("LANGCHAIN_API_KEY");
    const apiUrl = (_getEnvironmentVariab = getEnvironmentVariable$1("LANGCHAIN_ENDPOINT")) !== null && _getEnvironmentVariab !== void 0 ? _getEnvironmentVariab : "https://api.smith.langchain.com";
    const hideInputs = getEnvironmentVariable$1("LANGCHAIN_HIDE_INPUTS") === "true";
    const hideOutputs = getEnvironmentVariable$1("LANGCHAIN_HIDE_OUTPUTS") === "true";
    return {
      apiUrl: apiUrl,
      apiKey: apiKey,
      webUrl: undefined,
      hideInputs: hideInputs,
      hideOutputs: hideOutputs
    };
  }
  getHostUrl() {
    if (this.webUrl) {
      return this.webUrl;
    } else if (isLocalhost(this.apiUrl)) {
      this.webUrl = "http://localhost:3000";
      return this.webUrl;
    } else if (this.apiUrl.includes("/api") && !this.apiUrl.split(".", 1)[0].endsWith("api")) {
      this.webUrl = this.apiUrl.replace("/api", "");
      return this.webUrl;
    } else if (this.apiUrl.split(".", 1)[0].includes("dev")) {
      this.webUrl = "https://dev.smith.langchain.com";
      return this.webUrl;
    } else if (this.apiUrl.split(".", 1)[0].includes("eu")) {
      this.webUrl = "https://eu.smith.langchain.com";
      return this.webUrl;
    } else {
      this.webUrl = "https://smith.langchain.com";
      return this.webUrl;
    }
  }
  get headers() {
    const headers = {
      "User-Agent": `langsmith-js/${__version__}`
    };
    if (this.apiKey) {
      headers["x-api-key"] = `${this.apiKey}`;
    }
    return headers;
  }
  processInputs(inputs) {
    if (this.hideInputs === false) {
      return inputs;
    }
    if (this.hideInputs === true) {
      return {};
    }
    if (typeof this.hideInputs === "function") {
      return this.hideInputs(inputs);
    }
    return inputs;
  }
  processOutputs(outputs) {
    if (this.hideOutputs === false) {
      return outputs;
    }
    if (this.hideOutputs === true) {
      return {};
    }
    if (typeof this.hideOutputs === "function") {
      return this.hideOutputs(outputs);
    }
    return outputs;
  }
  prepareRunCreateOrUpdateInputs(run) {
    const runParams = {
      ...run
    };
    if (runParams.inputs !== undefined) {
      runParams.inputs = this.processInputs(runParams.inputs);
    }
    if (runParams.outputs !== undefined) {
      runParams.outputs = this.processOutputs(runParams.outputs);
    }
    return runParams;
  }
  async _getResponse(path, queryParams) {
    var _queryParams$toString;
    const paramsString = (_queryParams$toString = queryParams?.toString()) !== null && _queryParams$toString !== void 0 ? _queryParams$toString : "";
    const url = `${this.apiUrl}${path}?${paramsString}`;
    const response = await this.caller.call(fetch, url, {
      method: "GET",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
    }
    return response;
  }
  async _get(path, queryParams) {
    const response = await this._getResponse(path, queryParams);
    return response.json();
  }
  async *_getPaginated(path, queryParams = new URLSearchParams()) {
    let offset = Number(queryParams.get("offset")) || 0;
    const limit = Number(queryParams.get("limit")) || 100;
    while (true) {
      queryParams.set("offset", String(offset));
      queryParams.set("limit", String(limit));
      const url = `${this.apiUrl}${path}?${queryParams}`;
      const response = await this.caller.call(fetch, url, {
        method: "GET",
        headers: this.headers,
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
      }
      const items = await response.json();
      if (items.length === 0) {
        break;
      }
      yield items;
      if (items.length < limit) {
        break;
      }
      offset += items.length;
    }
  }
  async *_getCursorPaginatedList(path, body = null, requestMethod = "POST", dataKey = "runs") {
    const bodyParams = body ? {
      ...body
    } : {};
    while (true) {
      const response = await this.caller.call(fetch, `${this.apiUrl}${path}`, {
        method: requestMethod,
        headers: {
          ...this.headers,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(this.timeout_ms),
        ...this.fetchOptions,
        body: JSON.stringify(bodyParams)
      });
      const responseBody = await response.json();
      if (!responseBody) {
        break;
      }
      if (!responseBody[dataKey]) {
        break;
      }
      yield responseBody[dataKey];
      const cursors = responseBody.cursors;
      if (!cursors) {
        break;
      }
      if (!cursors.next) {
        break;
      }
      bodyParams.cursor = cursors.next;
    }
  }
  _filterForSampling(runs, patch = false) {
    if (this.tracingSampleRate === undefined) {
      return runs;
    }
    if (patch) {
      const sampled = [];
      for (const run of runs) {
        if (this.sampledPostUuids.has(run.id)) {
          sampled.push(run);
          this.sampledPostUuids.delete(run.id);
        }
      }
      return sampled;
    } else {
      const sampled = [];
      for (const run of runs) {
        if (Math.random() < this.tracingSampleRate) {
          sampled.push(run);
          this.sampledPostUuids.add(run.id);
        }
      }
      return sampled;
    }
  }
  async drainAutoBatchQueue() {
    while (this.autoBatchQueue.size >= 0) {
      const [batch, done] = this.autoBatchQueue.pop(this.pendingAutoBatchedRunLimit);
      if (!batch.length) {
        done();
        return;
      }
      try {
        await this.batchIngestRuns({
          runCreates: batch.filter(item => item.action === "create").map(item => item.item),
          runUpdates: batch.filter(item => item.action === "update").map(item => item.item)
        });
      } finally {
        done();
      }
    }
  }
  async processRunOperation(item, immediatelyTriggerBatch) {
    const oldTimeout = this.autoBatchTimeout;
    clearTimeout(this.autoBatchTimeout);
    this.autoBatchTimeout = undefined;
    const itemPromise = this.autoBatchQueue.push(item);
    if (immediatelyTriggerBatch || this.autoBatchQueue.size > this.pendingAutoBatchedRunLimit) {
      await this.drainAutoBatchQueue();
    }
    if (this.autoBatchQueue.size > 0) {
      this.autoBatchTimeout = setTimeout(() => {
        this.autoBatchTimeout = undefined;
        // This error would happen in the background and is uncatchable
        // from the outside. So just log instead.
        void this.drainAutoBatchQueue().catch(console.error);
      }, oldTimeout ? this.autoBatchAggregationDelayMs : this.autoBatchInitialDelayMs);
    }
    return itemPromise;
  }
  async _getServerInfo() {
    const response = await fetch(`${this.apiUrl}/info`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      // consume the response body to release the connection
      // https://undici.nodejs.org/#/?id=garbage-collection
      await response.text();
      throw new Error("Failed to retrieve server info.");
    }
    return response.json();
  }
  async batchEndpointIsSupported() {
    try {
      this.serverInfo = await this._getServerInfo();
    } catch (e) {
      return false;
    }
    return true;
  }
  async createRun(run) {
    var _run$start_time;
    if (!this._filterForSampling([run]).length) {
      return;
    }
    const headers = {
      ...this.headers,
      "Content-Type": "application/json"
    };
    const session_name = run.project_name;
    delete run.project_name;
    const runCreate = this.prepareRunCreateOrUpdateInputs({
      session_name,
      ...run,
      start_time: (_run$start_time = run.start_time) !== null && _run$start_time !== void 0 ? _run$start_time : Date.now()
    });
    if (this.autoBatchTracing && runCreate.trace_id !== undefined && runCreate.dotted_order !== undefined) {
      void this.processRunOperation({
        action: "create",
        item: runCreate
      }).catch(console.error);
      return;
    }
    const mergedRunCreateParams = await mergeRuntimeEnvIntoRunCreates([runCreate]);
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify(mergedRunCreateParams[0]),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    await raiseForStatus(response, "create run");
  }
  /**
   * Batch ingest/upsert multiple runs in the Langsmith system.
   * @param runs
   */
  async batchIngestRuns({
    runCreates,
    runUpdates
  }) {
    var _runCreates$map, _runUpdates$map, _this$serverInfo$batc;
    if (runCreates === undefined && runUpdates === undefined) {
      return;
    }
    let preparedCreateParams = (_runCreates$map = runCreates?.map(create => this.prepareRunCreateOrUpdateInputs(create))) !== null && _runCreates$map !== void 0 ? _runCreates$map : [];
    let preparedUpdateParams = (_runUpdates$map = runUpdates?.map(update => this.prepareRunCreateOrUpdateInputs(update))) !== null && _runUpdates$map !== void 0 ? _runUpdates$map : [];
    if (preparedCreateParams.length > 0 && preparedUpdateParams.length > 0) {
      const createById = preparedCreateParams.reduce((params, run) => {
        if (!run.id) {
          return params;
        }
        params[run.id] = run;
        return params;
      }, {});
      const standaloneUpdates = [];
      for (const updateParam of preparedUpdateParams) {
        if (updateParam.id !== undefined && createById[updateParam.id]) {
          createById[updateParam.id] = {
            ...createById[updateParam.id],
            ...updateParam
          };
        } else {
          standaloneUpdates.push(updateParam);
        }
      }
      preparedCreateParams = Object.values(createById);
      preparedUpdateParams = standaloneUpdates;
    }
    const rawBatch = {
      post: this._filterForSampling(preparedCreateParams),
      patch: this._filterForSampling(preparedUpdateParams, true)
    };
    if (!rawBatch.post.length && !rawBatch.patch.length) {
      return;
    }
    preparedCreateParams = await mergeRuntimeEnvIntoRunCreates(preparedCreateParams);
    if (this.batchEndpointSupported === undefined) {
      this.batchEndpointSupported = await this.batchEndpointIsSupported();
    }
    if (!this.batchEndpointSupported) {
      this.autoBatchTracing = false;
      for (const preparedCreateParam of rawBatch.post) {
        await this.createRun(preparedCreateParam);
      }
      for (const preparedUpdateParam of rawBatch.patch) {
        if (preparedUpdateParam.id !== undefined) {
          await this.updateRun(preparedUpdateParam.id, preparedUpdateParam);
        }
      }
      return;
    }
    const sizeLimitBytes = (_this$serverInfo$batc = this.serverInfo?.batch_ingest_config?.size_limit_bytes) !== null && _this$serverInfo$batc !== void 0 ? _this$serverInfo$batc : DEFAULT_BATCH_SIZE_LIMIT_BYTES;
    const batchChunks = {
      post: [],
      patch: []
    };
    let currentBatchSizeBytes = 0;
    for (const k of ["post", "patch"]) {
      const key = k;
      const batchItems = rawBatch[key].reverse();
      let batchItem = batchItems.pop();
      while (batchItem !== undefined) {
        const stringifiedBatchItem = JSON.stringify(batchItem);
        if (currentBatchSizeBytes > 0 && currentBatchSizeBytes + stringifiedBatchItem.length > sizeLimitBytes) {
          await this._postBatchIngestRuns(JSON.stringify(batchChunks));
          currentBatchSizeBytes = 0;
          batchChunks.post = [];
          batchChunks.patch = [];
        }
        currentBatchSizeBytes += stringifiedBatchItem.length;
        batchChunks[key].push(batchItem);
        batchItem = batchItems.pop();
      }
    }
    if (batchChunks.post.length > 0 || batchChunks.patch.length > 0) {
      await this._postBatchIngestRuns(JSON.stringify(batchChunks));
    }
  }
  async _postBatchIngestRuns(body) {
    const headers = {
      ...this.headers,
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    const response = await this.batchIngestCaller.call(fetch, `${this.apiUrl}/runs/batch`, {
      method: "POST",
      headers,
      body: body,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    await raiseForStatus(response, "batch create run");
  }
  async updateRun(runId, run) {
    assertUuid(runId);
    if (run.inputs) {
      run.inputs = this.processInputs(run.inputs);
    }
    if (run.outputs) {
      run.outputs = this.processOutputs(run.outputs);
    }
    // TODO: Untangle types
    const data = {
      ...run,
      id: runId
    };
    if (!this._filterForSampling([data], true).length) {
      return;
    }
    if (this.autoBatchTracing && data.trace_id !== undefined && data.dotted_order !== undefined) {
      if (run.end_time !== undefined && data.parent_run_id === undefined) {
        // Trigger a batch as soon as a root trace ends and block to ensure trace finishes
        // in serverless environments.
        await this.processRunOperation({
          action: "update",
          item: data
        }, true);
        return;
      } else {
        void this.processRunOperation({
          action: "update",
          item: data
        }).catch(console.error);
      }
      return;
    }
    const headers = {
      ...this.headers,
      "Content-Type": "application/json"
    };
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(run),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    await raiseForStatus(response, "update run");
  }
  async readRun(runId, {
    loadChildRuns
  } = {
    loadChildRuns: false
  }) {
    assertUuid(runId);
    let run = await this._get(`/runs/${runId}`);
    if (loadChildRuns && run.child_run_ids) {
      run = await this._loadChildRuns(run);
    }
    return run;
  }
  async getRunUrl({
    runId,
    run,
    projectOpts
  }) {
    if (run !== undefined) {
      let sessionId;
      if (run.session_id) {
        sessionId = run.session_id;
      } else if (projectOpts?.projectName) {
        sessionId = (await this.readProject({
          projectName: projectOpts?.projectName
        })).id;
      } else if (projectOpts?.projectId) {
        sessionId = projectOpts?.projectId;
      } else {
        const project = await this.readProject({
          projectName: getEnvironmentVariable$1("LANGCHAIN_PROJECT") || "default"
        });
        sessionId = project.id;
      }
      const tenantId = await this._getTenantId();
      return `${this.getHostUrl()}/o/${tenantId}/projects/p/${sessionId}/r/${run.id}?poll=true`;
    } else if (runId !== undefined) {
      const run_ = await this.readRun(runId);
      if (!run_.app_path) {
        throw new Error(`Run ${runId} has no app_path`);
      }
      const baseUrl = this.getHostUrl();
      return `${baseUrl}${run_.app_path}`;
    } else {
      throw new Error("Must provide either runId or run");
    }
  }
  async _loadChildRuns(run) {
    const childRuns = await toArray(this.listRuns({
      id: run.child_run_ids
    }));
    const treemap = {};
    const runs = {};
    // TODO: make dotted order required when the migration finishes
    childRuns.sort((a, b) => {
      var _a$dotted_order, _b$dotted_order;
      return ((_a$dotted_order = a?.dotted_order) !== null && _a$dotted_order !== void 0 ? _a$dotted_order : "").localeCompare((_b$dotted_order = b?.dotted_order) !== null && _b$dotted_order !== void 0 ? _b$dotted_order : "");
    });
    for (const childRun of childRuns) {
      if (childRun.parent_run_id === null || childRun.parent_run_id === undefined) {
        throw new Error(`Child run ${childRun.id} has no parent`);
      }
      if (!(childRun.parent_run_id in treemap)) {
        treemap[childRun.parent_run_id] = [];
      }
      treemap[childRun.parent_run_id].push(childRun);
      runs[childRun.id] = childRun;
    }
    run.child_runs = treemap[run.id] || [];
    for (const runId in treemap) {
      if (runId !== run.id) {
        runs[runId].child_runs = treemap[runId];
      }
    }
    return run;
  }
  /**
   * List runs from the LangSmith server.
   * @param projectId - The ID of the project to filter by.
   * @param projectName - The name of the project to filter by.
   * @param parentRunId - The ID of the parent run to filter by.
   * @param traceId - The ID of the trace to filter by.
   * @param referenceExampleId - The ID of the reference example to filter by.
   * @param startTime - The start time to filter by.
   * @param isRoot - Indicates whether to only return root runs.
   * @param runType - The run type to filter by.
   * @param error - Indicates whether to filter by error runs.
   * @param id - The ID of the run to filter by.
   * @param query - The query string to filter by.
   * @param filter - The filter string to apply to the run spans.
   * @param traceFilter - The filter string to apply on the root run of the trace.
   * @param limit - The maximum number of runs to retrieve.
   * @returns {AsyncIterable<Run>} - The runs.
   *
   * @example
   * // List all runs in a project
   * const projectRuns = client.listRuns({ projectName: "<your_project>" });
   *
   * @example
   * // List LLM and Chat runs in the last 24 hours
   * const todaysLLMRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   start_time: new Date(Date.now() - 24 * 60 * 60 * 1000),
   *   run_type: "llm",
   * });
   *
   * @example
   * // List traces in a project
   * const rootRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   execution_order: 1,
   * });
   *
   * @example
   * // List runs without errors
   * const correctRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   error: false,
   * });
   *
   * @example
   * // List runs by run ID
   * const runIds = [
   *   "a36092d2-4ad5-4fb4-9c0d-0dba9a2ed836",
   *   "9398e6be-964f-4aa4-8ae9-ad78cd4b7074",
   * ];
   * const selectedRuns = client.listRuns({ run_ids: runIds });
   *
   * @example
   * // List all "chain" type runs that took more than 10 seconds and had `total_tokens` greater than 5000
   * const chainRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   filter: 'and(eq(run_type, "chain"), gt(latency, 10), gt(total_tokens, 5000))',
   * });
   *
   * @example
   * // List all runs called "extractor" whose root of the trace was assigned feedback "user_score" score of 1
   * const goodExtractorRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   filter: 'eq(name, "extractor")',
   *   traceFilter: 'and(eq(feedback_key, "user_score"), eq(feedback_score, 1))',
   * });
   *
   * @example
   * // List all runs that started after a specific timestamp and either have "error" not equal to null or a "Correctness" feedback score equal to 0
   * const complexRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   filter: 'and(gt(start_time, "2023-07-15T12:34:56Z"), or(neq(error, null), and(eq(feedback_key, "Correctness"), eq(feedback_score, 0.0))))',
   * });
   *
   * @example
   * // List all runs where `tags` include "experimental" or "beta" and `latency` is greater than 2 seconds
   * const taggedRuns = client.listRuns({
   *   projectName: "<your_project>",
   *   filter: 'and(or(has(tags, "experimental"), has(tags, "beta")), gt(latency, 2))',
   * });
   */
  async *listRuns(props) {
    const {
      projectId,
      projectName,
      parentRunId,
      traceId,
      referenceExampleId,
      startTime,
      executionOrder,
      isRoot,
      runType,
      error,
      id,
      query,
      filter,
      traceFilter,
      treeFilter,
      limit,
      select
    } = props;
    let projectIds = [];
    if (projectId) {
      projectIds = Array.isArray(projectId) ? projectId : [projectId];
    }
    if (projectName) {
      const projectNames = Array.isArray(projectName) ? projectName : [projectName];
      const projectIds_ = await Promise.all(projectNames.map(name => this.readProject({
        projectName: name
      }).then(project => project.id)));
      projectIds.push(...projectIds_);
    }
    const default_select = ["app_path", "child_run_ids", "completion_cost", "completion_tokens", "dotted_order", "end_time", "error", "events", "extra", "feedback_stats", "first_token_time", "id", "inputs", "name", "outputs", "parent_run_id", "parent_run_ids", "prompt_cost", "prompt_tokens", "reference_example_id", "run_type", "session_id", "start_time", "status", "tags", "total_cost", "total_tokens", "trace_id"];
    const body = {
      session: projectIds.length ? projectIds : null,
      run_type: runType,
      reference_example: referenceExampleId,
      query,
      filter,
      trace_filter: traceFilter,
      tree_filter: treeFilter,
      execution_order: executionOrder,
      parent_run: parentRunId,
      start_time: startTime ? startTime.toISOString() : null,
      error,
      id,
      limit,
      trace: traceId,
      select: select ? select : default_select,
      is_root: isRoot
    };
    let runsYielded = 0;
    for await (const runs of this._getCursorPaginatedList("/runs/query", body)) {
      if (limit) {
        if (runsYielded >= limit) {
          break;
        }
        if (runs.length + runsYielded > limit) {
          const newRuns = runs.slice(0, limit - runsYielded);
          yield* newRuns;
          break;
        }
        runsYielded += runs.length;
        yield* runs;
      } else {
        yield* runs;
      }
    }
  }
  async getRunStats({
    id,
    trace,
    parentRun,
    runType,
    projectNames,
    projectIds,
    referenceExampleIds,
    startTime,
    endTime,
    error,
    query,
    filter,
    traceFilter,
    treeFilter,
    isRoot,
    dataSourceType
  }) {
    let projectIds_ = projectIds || [];
    if (projectNames) {
      projectIds_ = [...(projectIds || []), ...(await Promise.all(projectNames.map(name => this.readProject({
        projectName: name
      }).then(project => project.id))))];
    }
    const payload = {
      id,
      trace,
      parent_run: parentRun,
      run_type: runType,
      session: projectIds_,
      reference_example: referenceExampleIds,
      start_time: startTime,
      end_time: endTime,
      error,
      query,
      filter,
      trace_filter: traceFilter,
      tree_filter: treeFilter,
      is_root: isRoot,
      data_source_type: dataSourceType
    };
    // Remove undefined values from the payload
    const filteredPayload = Object.fromEntries(Object.entries(payload).filter(([_, value]) => value !== undefined));
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs/stats`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(filteredPayload),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    const result = await response.json();
    return result;
  }
  async shareRun(runId, {
    shareId
  } = {}) {
    const data = {
      run_id: runId,
      share_token: shareId || v4$1()
    };
    assertUuid(runId);
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}/share`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    const result = await response.json();
    if (result === null || !("share_token" in result)) {
      throw new Error("Invalid response from server");
    }
    return `${this.getHostUrl()}/public/${result["share_token"]}/r`;
  }
  async unshareRun(runId) {
    assertUuid(runId);
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}/share`, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    await raiseForStatus(response, "unshare run");
  }
  async readRunSharedLink(runId) {
    assertUuid(runId);
    const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}/share`, {
      method: "GET",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    const result = await response.json();
    if (result === null || !("share_token" in result)) {
      return undefined;
    }
    return `${this.getHostUrl()}/public/${result["share_token"]}/r`;
  }
  async listSharedRuns(shareToken, {
    runIds
  } = {}) {
    const queryParams = new URLSearchParams({
      share_token: shareToken
    });
    if (runIds !== undefined) {
      for (const runId of runIds) {
        queryParams.append("id", runId);
      }
    }
    assertUuid(shareToken);
    const response = await this.caller.call(fetch, `${this.apiUrl}/public/${shareToken}/runs${queryParams}`, {
      method: "GET",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    const runs = await response.json();
    return runs;
  }
  async readDatasetSharedSchema(datasetId, datasetName) {
    if (!datasetId && !datasetName) {
      throw new Error("Either datasetId or datasetName must be given");
    }
    if (!datasetId) {
      const dataset = await this.readDataset({
        datasetName
      });
      datasetId = dataset.id;
    }
    assertUuid(datasetId);
    const response = await this.caller.call(fetch, `${this.apiUrl}/datasets/${datasetId}/share`, {
      method: "GET",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    const shareSchema = await response.json();
    shareSchema.url = `${this.getHostUrl()}/public/${shareSchema.share_token}/d`;
    return shareSchema;
  }
  async shareDataset(datasetId, datasetName) {
    if (!datasetId && !datasetName) {
      throw new Error("Either datasetId or datasetName must be given");
    }
    if (!datasetId) {
      const dataset = await this.readDataset({
        datasetName
      });
      datasetId = dataset.id;
    }
    const data = {
      dataset_id: datasetId
    };
    assertUuid(datasetId);
    const response = await this.caller.call(fetch, `${this.apiUrl}/datasets/${datasetId}/share`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    const shareSchema = await response.json();
    shareSchema.url = `${this.getHostUrl()}/public/${shareSchema.share_token}/d`;
    return shareSchema;
  }
  async unshareDataset(datasetId) {
    assertUuid(datasetId);
    const response = await this.caller.call(fetch, `${this.apiUrl}/datasets/${datasetId}/share`, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    await raiseForStatus(response, "unshare dataset");
  }
  async readSharedDataset(shareToken) {
    assertUuid(shareToken);
    const response = await this.caller.call(fetch, `${this.apiUrl}/public/${shareToken}/datasets`, {
      method: "GET",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    const dataset = await response.json();
    return dataset;
  }
  async createProject({
    projectName,
    description = null,
    metadata = null,
    upsert = false,
    projectExtra = null,
    referenceDatasetId = null
  }) {
    const upsert_ = upsert ? `?upsert=true` : "";
    const endpoint = `${this.apiUrl}/sessions${upsert_}`;
    const extra = projectExtra || {};
    if (metadata) {
      extra["metadata"] = metadata;
    }
    const body = {
      name: projectName,
      extra,
      description
    };
    if (referenceDatasetId !== null) {
      body["reference_dataset_id"] = referenceDatasetId;
    }
    const response = await this.caller.call(fetch, endpoint, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to create session ${projectName}: ${response.status} ${response.statusText}`);
    }
    return result;
  }
  async updateProject(projectId, {
    name = null,
    description = null,
    metadata = null,
    projectExtra = null,
    endTime = null
  }) {
    const endpoint = `${this.apiUrl}/sessions/${projectId}`;
    let extra = projectExtra;
    if (metadata) {
      extra = {
        ...(extra || {}),
        metadata
      };
    }
    const body = {
      name,
      extra,
      description,
      end_time: endTime ? new Date(endTime).toISOString() : null
    };
    const response = await this.caller.call(fetch, endpoint, {
      method: "PATCH",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to update project ${projectId}: ${response.status} ${response.statusText}`);
    }
    return result;
  }
  async hasProject({
    projectId,
    projectName
  }) {
    // TODO: Add a head request
    let path = "/sessions";
    const params = new URLSearchParams();
    if (projectId !== undefined && projectName !== undefined) {
      throw new Error("Must provide either projectName or projectId, not both");
    } else if (projectId !== undefined) {
      assertUuid(projectId);
      path += `/${projectId}`;
    } else if (projectName !== undefined) {
      params.append("name", projectName);
    } else {
      throw new Error("Must provide projectName or projectId");
    }
    const response = await this.caller.call(fetch, `${this.apiUrl}${path}?${params}`, {
      method: "GET",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    // consume the response body to release the connection
    // https://undici.nodejs.org/#/?id=garbage-collection
    try {
      const result = await response.json();
      if (!response.ok) {
        return false;
      }
      // If it's OK and we're querying by name, need to check the list is not empty
      if (Array.isArray(result)) {
        return result.length > 0;
      }
      // projectId querying
      return true;
    } catch (e) {
      return false;
    }
  }
  async readProject({
    projectId,
    projectName,
    includeStats
  }) {
    let path = "/sessions";
    const params = new URLSearchParams();
    if (projectId !== undefined && projectName !== undefined) {
      throw new Error("Must provide either projectName or projectId, not both");
    } else if (projectId !== undefined) {
      assertUuid(projectId);
      path += `/${projectId}`;
    } else if (projectName !== undefined) {
      params.append("name", projectName);
    } else {
      throw new Error("Must provide projectName or projectId");
    }
    if (includeStats !== undefined) {
      params.append("include_stats", includeStats.toString());
    }
    const response = await this._get(path, params);
    let result;
    if (Array.isArray(response)) {
      if (response.length === 0) {
        throw new Error(`Project[id=${projectId}, name=${projectName}] not found`);
      }
      result = response[0];
    } else {
      result = response;
    }
    return result;
  }
  async getProjectUrl({
    projectId,
    projectName
  }) {
    if (projectId === undefined && projectName === undefined) {
      throw new Error("Must provide either projectName or projectId");
    }
    const project = await this.readProject({
      projectId,
      projectName
    });
    const tenantId = await this._getTenantId();
    return `${this.getHostUrl()}/o/${tenantId}/projects/p/${project.id}`;
  }
  async getDatasetUrl({
    datasetId,
    datasetName
  }) {
    if (datasetId === undefined && datasetName === undefined) {
      throw new Error("Must provide either datasetName or datasetId");
    }
    const dataset = await this.readDataset({
      datasetId,
      datasetName
    });
    const tenantId = await this._getTenantId();
    return `${this.getHostUrl()}/o/${tenantId}/datasets/${dataset.id}`;
  }
  async _getTenantId() {
    if (this._tenantId !== null) {
      return this._tenantId;
    }
    const queryParams = new URLSearchParams({
      limit: "1"
    });
    for await (const projects of this._getPaginated("/sessions", queryParams)) {
      this._tenantId = projects[0].tenant_id;
      return projects[0].tenant_id;
    }
    throw new Error("No projects found to resolve tenant.");
  }
  async *listProjects({
    projectIds,
    name,
    nameContains,
    referenceDatasetId,
    referenceDatasetName,
    referenceFree
  } = {}) {
    const params = new URLSearchParams();
    if (projectIds !== undefined) {
      for (const projectId of projectIds) {
        params.append("id", projectId);
      }
    }
    if (name !== undefined) {
      params.append("name", name);
    }
    if (nameContains !== undefined) {
      params.append("name_contains", nameContains);
    }
    if (referenceDatasetId !== undefined) {
      params.append("reference_dataset", referenceDatasetId);
    } else if (referenceDatasetName !== undefined) {
      const dataset = await this.readDataset({
        datasetName: referenceDatasetName
      });
      params.append("reference_dataset", dataset.id);
    }
    if (referenceFree !== undefined) {
      params.append("reference_free", referenceFree.toString());
    }
    for await (const projects of this._getPaginated("/sessions", params)) {
      yield* projects;
    }
  }
  async deleteProject({
    projectId,
    projectName
  }) {
    let projectId_;
    if (projectId === undefined && projectName === undefined) {
      throw new Error("Must provide projectName or projectId");
    } else if (projectId !== undefined && projectName !== undefined) {
      throw new Error("Must provide either projectName or projectId, not both");
    } else if (projectId === undefined) {
      projectId_ = (await this.readProject({
        projectName
      })).id;
    } else {
      projectId_ = projectId;
    }
    assertUuid(projectId_);
    const response = await this.caller.call(fetch, `${this.apiUrl}/sessions/${projectId_}`, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    await raiseForStatus(response, `delete session ${projectId_} (${projectName})`);
  }
  async uploadCsv({
    csvFile,
    fileName,
    inputKeys,
    outputKeys,
    description,
    dataType,
    name
  }) {
    const url = `${this.apiUrl}/datasets/upload`;
    const formData = new FormData();
    formData.append("file", csvFile, fileName);
    inputKeys.forEach(key => {
      formData.append("input_keys", key);
    });
    outputKeys.forEach(key => {
      formData.append("output_keys", key);
    });
    if (description) {
      formData.append("description", description);
    }
    if (dataType) {
      formData.append("data_type", dataType);
    }
    if (name) {
      formData.append("name", name);
    }
    const response = await this.caller.call(fetch, url, {
      method: "POST",
      headers: this.headers,
      body: formData,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      const result = await response.json();
      if (result.detail && result.detail.includes("already exists")) {
        throw new Error(`Dataset ${fileName} already exists`);
      }
      throw new Error(`Failed to upload CSV: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  async createDataset(name, {
    description,
    dataType
  } = {}) {
    const body = {
      name,
      description
    };
    if (dataType) {
      body.data_type = dataType;
    }
    const response = await this.caller.call(fetch, `${this.apiUrl}/datasets`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      const result = await response.json();
      if (result.detail && result.detail.includes("already exists")) {
        throw new Error(`Dataset ${name} already exists`);
      }
      throw new Error(`Failed to create dataset ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  async readDataset({
    datasetId,
    datasetName
  }) {
    let path = "/datasets";
    // limit to 1 result
    const params = new URLSearchParams({
      limit: "1"
    });
    if (datasetId !== undefined && datasetName !== undefined) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId !== undefined) {
      assertUuid(datasetId);
      path += `/${datasetId}`;
    } else if (datasetName !== undefined) {
      params.append("name", datasetName);
    } else {
      throw new Error("Must provide datasetName or datasetId");
    }
    const response = await this._get(path, params);
    let result;
    if (Array.isArray(response)) {
      if (response.length === 0) {
        throw new Error(`Dataset[id=${datasetId}, name=${datasetName}] not found`);
      }
      result = response[0];
    } else {
      result = response;
    }
    return result;
  }
  async hasDataset({
    datasetId,
    datasetName
  }) {
    try {
      await this.readDataset({
        datasetId,
        datasetName
      });
      return true;
    } catch (e) {
      if (
      // eslint-disable-next-line no-instanceof/no-instanceof
      e instanceof Error && e.message.toLocaleLowerCase().includes("not found")) {
        return false;
      }
      throw e;
    }
  }
  async diffDatasetVersions({
    datasetId,
    datasetName,
    fromVersion,
    toVersion
  }) {
    let datasetId_ = datasetId;
    if (datasetId_ === undefined && datasetName === undefined) {
      throw new Error("Must provide either datasetName or datasetId");
    } else if (datasetId_ !== undefined && datasetName !== undefined) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId_ === undefined) {
      const dataset = await this.readDataset({
        datasetName
      });
      datasetId_ = dataset.id;
    }
    const urlParams = new URLSearchParams({
      from_version: typeof fromVersion === "string" ? fromVersion : fromVersion.toISOString(),
      to_version: typeof toVersion === "string" ? toVersion : toVersion.toISOString()
    });
    const response = await this._get(`/datasets/${datasetId_}/versions/diff`, urlParams);
    return response;
  }
  async readDatasetOpenaiFinetuning({
    datasetId,
    datasetName
  }) {
    const path = "/datasets";
    if (datasetId !== undefined) ; else if (datasetName !== undefined) {
      datasetId = (await this.readDataset({
        datasetName
      })).id;
    } else {
      throw new Error("Must provide datasetName or datasetId");
    }
    const response = await this._getResponse(`${path}/${datasetId}/openai_ft`);
    const datasetText = await response.text();
    const dataset = datasetText.trim().split("\n").map(line => JSON.parse(line));
    return dataset;
  }
  async *listDatasets({
    limit = 100,
    offset = 0,
    datasetIds,
    datasetName,
    datasetNameContains
  } = {}) {
    const path = "/datasets";
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    if (datasetIds !== undefined) {
      for (const id_ of datasetIds) {
        params.append("id", id_);
      }
    }
    if (datasetName !== undefined) {
      params.append("name", datasetName);
    }
    if (datasetNameContains !== undefined) {
      params.append("name_contains", datasetNameContains);
    }
    for await (const datasets of this._getPaginated(path, params)) {
      yield* datasets;
    }
  }
  /**
   * Update a dataset
   * @param props The dataset details to update
   * @returns The updated dataset
   */
  async updateDataset(props) {
    const {
      datasetId,
      datasetName,
      ...update
    } = props;
    if (!datasetId && !datasetName) {
      throw new Error("Must provide either datasetName or datasetId");
    }
    const _datasetId = datasetId !== null && datasetId !== void 0 ? datasetId : (await this.readDataset({
      datasetName
    })).id;
    assertUuid(_datasetId);
    const response = await this.caller.call(fetch, `${this.apiUrl}/datasets/${_datasetId}`, {
      method: "PATCH",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(update),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      throw new Error(`Failed to update dataset ${_datasetId}: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }
  async deleteDataset({
    datasetId,
    datasetName
  }) {
    let path = "/datasets";
    let datasetId_ = datasetId;
    if (datasetId !== undefined && datasetName !== undefined) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetName !== undefined) {
      const dataset = await this.readDataset({
        datasetName
      });
      datasetId_ = dataset.id;
    }
    if (datasetId_ !== undefined) {
      assertUuid(datasetId_);
      path += `/${datasetId_}`;
    } else {
      throw new Error("Must provide datasetName or datasetId");
    }
    const response = await this.caller.call(fetch, this.apiUrl + path, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ${path}: ${response.status} ${response.statusText}`);
    }
    await response.json();
  }
  async createExample(inputs, outputs, {
    datasetId,
    datasetName,
    createdAt,
    exampleId,
    metadata,
    split
  }) {
    let datasetId_ = datasetId;
    if (datasetId_ === undefined && datasetName === undefined) {
      throw new Error("Must provide either datasetName or datasetId");
    } else if (datasetId_ !== undefined && datasetName !== undefined) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId_ === undefined) {
      const dataset = await this.readDataset({
        datasetName
      });
      datasetId_ = dataset.id;
    }
    const createdAt_ = createdAt || new Date();
    const data = {
      dataset_id: datasetId_,
      inputs,
      outputs,
      created_at: createdAt_?.toISOString(),
      id: exampleId,
      metadata,
      split
    };
    const response = await this.caller.call(fetch, `${this.apiUrl}/examples`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      throw new Error(`Failed to create example: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  async createExamples(props) {
    const {
      inputs,
      outputs,
      metadata,
      sourceRunIds,
      exampleIds,
      datasetId,
      datasetName
    } = props;
    let datasetId_ = datasetId;
    if (datasetId_ === undefined && datasetName === undefined) {
      throw new Error("Must provide either datasetName or datasetId");
    } else if (datasetId_ !== undefined && datasetName !== undefined) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId_ === undefined) {
      const dataset = await this.readDataset({
        datasetName
      });
      datasetId_ = dataset.id;
    }
    const formattedExamples = inputs.map((input, idx) => {
      return {
        dataset_id: datasetId_,
        inputs: input,
        outputs: outputs ? outputs[idx] : undefined,
        metadata: metadata ? metadata[idx] : undefined,
        split: props.splits ? props.splits[idx] : undefined,
        id: exampleIds ? exampleIds[idx] : undefined,
        source_run_id: sourceRunIds ? sourceRunIds[idx] : undefined
      };
    });
    const response = await this.caller.call(fetch, `${this.apiUrl}/examples/bulk`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formattedExamples),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      throw new Error(`Failed to create examples: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  async createLLMExample(input, generation, options) {
    return this.createExample({
      input
    }, {
      output: generation
    }, options);
  }
  async createChatExample(input, generations, options) {
    const finalInput = input.map(message => {
      if (isLangChainMessage(message)) {
        return convertLangChainMessageToExample(message);
      }
      return message;
    });
    const finalOutput = isLangChainMessage(generations) ? convertLangChainMessageToExample(generations) : generations;
    return this.createExample({
      input: finalInput
    }, {
      output: finalOutput
    }, options);
  }
  async readExample(exampleId) {
    assertUuid(exampleId);
    const path = `/examples/${exampleId}`;
    return await this._get(path);
  }
  async *listExamples({
    datasetId,
    datasetName,
    exampleIds,
    asOf,
    splits,
    inlineS3Urls,
    metadata,
    limit,
    offset,
    filter
  } = {}) {
    let datasetId_;
    if (datasetId !== undefined && datasetName !== undefined) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId !== undefined) {
      datasetId_ = datasetId;
    } else if (datasetName !== undefined) {
      const dataset = await this.readDataset({
        datasetName
      });
      datasetId_ = dataset.id;
    } else {
      throw new Error("Must provide a datasetName or datasetId");
    }
    const params = new URLSearchParams({
      dataset: datasetId_
    });
    const dataset_version = asOf ? typeof asOf === "string" ? asOf : asOf?.toISOString() : undefined;
    if (dataset_version) {
      params.append("as_of", dataset_version);
    }
    const inlineS3Urls_ = inlineS3Urls !== null && inlineS3Urls !== void 0 ? inlineS3Urls : true;
    params.append("inline_s3_urls", inlineS3Urls_.toString());
    if (exampleIds !== undefined) {
      for (const id_ of exampleIds) {
        params.append("id", id_);
      }
    }
    if (splits !== undefined) {
      for (const split of splits) {
        params.append("splits", split);
      }
    }
    if (metadata !== undefined) {
      const serializedMetadata = JSON.stringify(metadata);
      params.append("metadata", serializedMetadata);
    }
    if (limit !== undefined) {
      params.append("limit", limit.toString());
    }
    if (offset !== undefined) {
      params.append("offset", offset.toString());
    }
    if (filter !== undefined) {
      params.append("filter", filter);
    }
    let i = 0;
    for await (const examples of this._getPaginated("/examples", params)) {
      for (const example of examples) {
        yield example;
        i++;
      }
      if (limit !== undefined && i >= limit) {
        break;
      }
    }
  }
  async deleteExample(exampleId) {
    assertUuid(exampleId);
    const path = `/examples/${exampleId}`;
    const response = await this.caller.call(fetch, this.apiUrl + path, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ${path}: ${response.status} ${response.statusText}`);
    }
    await response.json();
  }
  async updateExample(exampleId, update) {
    assertUuid(exampleId);
    const response = await this.caller.call(fetch, `${this.apiUrl}/examples/${exampleId}`, {
      method: "PATCH",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(update),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      throw new Error(`Failed to update example ${exampleId}: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  async updateExamples(update) {
    const response = await this.caller.call(fetch, `${this.apiUrl}/examples/bulk`, {
      method: "PATCH",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(update),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      throw new Error(`Failed to update examples: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  async listDatasetSplits({
    datasetId,
    datasetName,
    asOf
  }) {
    let datasetId_;
    if (datasetId === undefined && datasetName === undefined) {
      throw new Error("Must provide dataset name or ID");
    } else if (datasetId !== undefined && datasetName !== undefined) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId === undefined) {
      const dataset = await this.readDataset({
        datasetName
      });
      datasetId_ = dataset.id;
    } else {
      datasetId_ = datasetId;
    }
    assertUuid(datasetId_);
    const params = new URLSearchParams();
    const dataset_version = asOf ? typeof asOf === "string" ? asOf : asOf?.toISOString() : undefined;
    if (dataset_version) {
      params.append("as_of", dataset_version);
    }
    const response = await this._get(`/datasets/${datasetId_}/splits`, params);
    return response;
  }
  async updateDatasetSplits({
    datasetId,
    datasetName,
    splitName,
    exampleIds,
    remove = false
  }) {
    let datasetId_;
    if (datasetId === undefined && datasetName === undefined) {
      throw new Error("Must provide dataset name or ID");
    } else if (datasetId !== undefined && datasetName !== undefined) {
      throw new Error("Must provide either datasetName or datasetId, not both");
    } else if (datasetId === undefined) {
      const dataset = await this.readDataset({
        datasetName
      });
      datasetId_ = dataset.id;
    } else {
      datasetId_ = datasetId;
    }
    assertUuid(datasetId_);
    const data = {
      split_name: splitName,
      examples: exampleIds.map(id => {
        assertUuid(id);
        return id;
      }),
      remove
    };
    const response = await this.caller.call(fetch, `${this.apiUrl}/datasets/${datasetId_}/splits`, {
      method: "PUT",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    await raiseForStatus(response, "update dataset splits");
  }
  /**
   * @deprecated This method is deprecated and will be removed in future LangSmith versions, use `evaluate` from `langsmith/evaluation` instead.
   */
  async evaluateRun(run, evaluator, {
    sourceInfo,
    loadChildRuns,
    referenceExample
  } = {
    loadChildRuns: false
  }) {
    warnOnce("This method is deprecated and will be removed in future LangSmith versions, use `evaluate` from `langsmith/evaluation` instead.");
    let run_;
    if (typeof run === "string") {
      run_ = await this.readRun(run, {
        loadChildRuns
      });
    } else if (typeof run === "object" && "id" in run) {
      run_ = run;
    } else {
      throw new Error(`Invalid run type: ${typeof run}`);
    }
    if (run_.reference_example_id !== null && run_.reference_example_id !== undefined) {
      referenceExample = await this.readExample(run_.reference_example_id);
    }
    const feedbackResult = await evaluator.evaluateRun(run_, referenceExample);
    const [_, feedbacks] = await this._logEvaluationFeedback(feedbackResult, run_, sourceInfo);
    return feedbacks[0];
  }
  async createFeedback(runId, key, {
    score,
    value,
    correction,
    comment,
    sourceInfo,
    feedbackSourceType = "api",
    sourceRunId,
    feedbackId,
    feedbackConfig,
    projectId,
    comparativeExperimentId
  }) {
    if (!runId && !projectId) {
      throw new Error("One of runId or projectId must be provided");
    }
    if (runId && projectId) {
      throw new Error("Only one of runId or projectId can be provided");
    }
    const feedback_source = {
      type: feedbackSourceType !== null && feedbackSourceType !== void 0 ? feedbackSourceType : "api",
      metadata: sourceInfo !== null && sourceInfo !== void 0 ? sourceInfo : {}
    };
    if (sourceRunId !== undefined && feedback_source?.metadata !== undefined && !feedback_source.metadata["__run"]) {
      feedback_source.metadata["__run"] = {
        run_id: sourceRunId
      };
    }
    if (feedback_source?.metadata !== undefined && feedback_source.metadata["__run"]?.run_id !== undefined) {
      assertUuid(feedback_source.metadata["__run"].run_id);
    }
    const feedback = {
      id: feedbackId !== null && feedbackId !== void 0 ? feedbackId : v4$1(),
      run_id: runId,
      key,
      score,
      value,
      correction,
      comment,
      feedback_source: feedback_source,
      comparative_experiment_id: comparativeExperimentId,
      feedbackConfig,
      session_id: projectId
    };
    const url = `${this.apiUrl}/feedback`;
    const response = await this.caller.call(fetch, url, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(feedback),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    await raiseForStatus(response, "create feedback");
    return feedback;
  }
  async updateFeedback(feedbackId, {
    score,
    value,
    correction,
    comment
  }) {
    const feedbackUpdate = {};
    if (score !== undefined && score !== null) {
      feedbackUpdate["score"] = score;
    }
    if (value !== undefined && value !== null) {
      feedbackUpdate["value"] = value;
    }
    if (correction !== undefined && correction !== null) {
      feedbackUpdate["correction"] = correction;
    }
    if (comment !== undefined && comment !== null) {
      feedbackUpdate["comment"] = comment;
    }
    assertUuid(feedbackId);
    const response = await this.caller.call(fetch, `${this.apiUrl}/feedback/${feedbackId}`, {
      method: "PATCH",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(feedbackUpdate),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    await raiseForStatus(response, "update feedback");
  }
  async readFeedback(feedbackId) {
    assertUuid(feedbackId);
    const path = `/feedback/${feedbackId}`;
    const response = await this._get(path);
    return response;
  }
  async deleteFeedback(feedbackId) {
    assertUuid(feedbackId);
    const path = `/feedback/${feedbackId}`;
    const response = await this.caller.call(fetch, this.apiUrl + path, {
      method: "DELETE",
      headers: this.headers,
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    if (!response.ok) {
      throw new Error(`Failed to delete ${path}: ${response.status} ${response.statusText}`);
    }
    await response.json();
  }
  async *listFeedback({
    runIds,
    feedbackKeys,
    feedbackSourceTypes
  } = {}) {
    const queryParams = new URLSearchParams();
    if (runIds) {
      queryParams.append("run", runIds.join(","));
    }
    if (feedbackKeys) {
      for (const key of feedbackKeys) {
        queryParams.append("key", key);
      }
    }
    if (feedbackSourceTypes) {
      for (const type of feedbackSourceTypes) {
        queryParams.append("source", type);
      }
    }
    for await (const feedbacks of this._getPaginated("/feedback", queryParams)) {
      yield* feedbacks;
    }
  }
  /**
   * Creates a presigned feedback token and URL.
   *
   * The token can be used to authorize feedback metrics without
   * needing an API key. This is useful for giving browser-based
   * applications the ability to submit feedback without needing
   * to expose an API key.
   *
   * @param runId - The ID of the run.
   * @param feedbackKey - The feedback key.
   * @param options - Additional options for the token.
   * @param options.expiration - The expiration time for the token.
   *
   * @returns A promise that resolves to a FeedbackIngestToken.
   */
  async createPresignedFeedbackToken(runId, feedbackKey, {
    expiration,
    feedbackConfig
  } = {}) {
    const body = {
      run_id: runId,
      feedback_key: feedbackKey,
      feedback_config: feedbackConfig
    };
    if (expiration) {
      if (typeof expiration === "string") {
        body["expires_at"] = expiration;
      } else if (expiration?.hours || expiration?.minutes || expiration?.days) {
        body["expires_in"] = expiration;
      }
    } else {
      body["expires_in"] = {
        hours: 3
      };
    }
    const response = await this.caller.call(fetch, `${this.apiUrl}/feedback/tokens`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    const result = await response.json();
    return result;
  }
  async createComparativeExperiment({
    name,
    experimentIds,
    referenceDatasetId,
    createdAt,
    description,
    metadata,
    id
  }) {
    if (experimentIds.length === 0) {
      throw new Error("At least one experiment is required");
    }
    if (!referenceDatasetId) {
      referenceDatasetId = (await this.readProject({
        projectId: experimentIds[0]
      })).reference_dataset_id;
    }
    if (!referenceDatasetId == null) {
      throw new Error("A reference dataset is required");
    }
    const body = {
      id,
      name,
      experiment_ids: experimentIds,
      reference_dataset_id: referenceDatasetId,
      description,
      created_at: (createdAt !== null && createdAt !== void 0 ? createdAt : new Date())?.toISOString(),
      extra: {}
    };
    if (metadata) body.extra["metadata"] = metadata;
    const response = await this.caller.call(fetch, `${this.apiUrl}/datasets/comparative`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout_ms),
      ...this.fetchOptions
    });
    return await response.json();
  }
  /**
   * Retrieves a list of presigned feedback tokens for a given run ID.
   * @param runId The ID of the run.
   * @returns An async iterable of FeedbackIngestToken objects.
   */
  async *listPresignedFeedbackTokens(runId) {
    assertUuid(runId);
    const params = new URLSearchParams({
      run_id: runId
    });
    for await (const tokens of this._getPaginated("/feedback/tokens", params)) {
      yield* tokens;
    }
  }
  _selectEvalResults(results) {
    let results_;
    if ("results" in results) {
      results_ = results.results;
    } else {
      results_ = [results];
    }
    return results_;
  }
  async _logEvaluationFeedback(evaluatorResponse, run, sourceInfo) {
    const evalResults = this._selectEvalResults(evaluatorResponse);
    const feedbacks = [];
    for (const res of evalResults) {
      let sourceInfo_ = sourceInfo || {};
      if (res.evaluatorInfo) {
        sourceInfo_ = {
          ...res.evaluatorInfo,
          ...sourceInfo_
        };
      }
      let runId_ = null;
      if (res.targetRunId) {
        runId_ = res.targetRunId;
      } else if (run) {
        runId_ = run.id;
      }
      feedbacks.push(await this.createFeedback(runId_, res.key, {
        score: res.score,
        value: res.value,
        comment: res.comment,
        correction: res.correction,
        sourceInfo: sourceInfo_,
        sourceRunId: res.sourceRunId,
        feedbackConfig: res.feedbackConfig,
        feedbackSourceType: "model"
      }));
    }
    return [evalResults, feedbacks];
  }
  async logEvaluationFeedback(evaluatorResponse, run, sourceInfo) {
    const [results] = await this._logEvaluationFeedback(evaluatorResponse, run, sourceInfo);
    return results;
  }
}

const isTracingEnabled$1 = tracingEnabled => {
  if (tracingEnabled !== undefined) {
    return tracingEnabled;
  }
  const envVars = ["LANGSMITH_TRACING_V2", "LANGCHAIN_TRACING_V2", "LANGSMITH_TRACING", "LANGCHAIN_TRACING"];
  return !!envVars.find(envVar => getEnvironmentVariable$1(envVar) === "true");
};

function stripNonAlphanumeric$1(input) {
  return input.replace(/[-:.]/g, "");
}
function convertToDottedOrderFormat$1(epoch, runId, executionOrder = 1) {
  // Date only has millisecond precision, so we use the microseconds to break
  // possible ties, avoiding incorrect run order
  const paddedOrder = executionOrder.toFixed(0).slice(0, 3).padStart(3, "0");
  return stripNonAlphanumeric$1(`${new Date(epoch).toISOString().slice(0, -1)}${paddedOrder}Z`) + runId;
}
/**
 * Baggage header information
 */
class Baggage {
  constructor(metadata, tags) {
    Object.defineProperty(this, "metadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.metadata = metadata;
    this.tags = tags;
  }
  static fromHeader(value) {
    const items = value.split(",");
    let metadata = {};
    let tags = [];
    for (const item of items) {
      const [key, uriValue] = item.split("=");
      const value = decodeURIComponent(uriValue);
      if (key === "langsmith-metadata") {
        metadata = JSON.parse(value);
      } else if (key === "langsmith-tags") {
        tags = value.split(",");
      }
    }
    return new Baggage(metadata, tags);
  }
  toHeader() {
    const items = [];
    if (this.metadata && Object.keys(this.metadata).length > 0) {
      items.push(`langsmith-metadata=${encodeURIComponent(JSON.stringify(this.metadata))}`);
    }
    if (this.tags && this.tags.length > 0) {
      items.push(`langsmith-tags=${encodeURIComponent(this.tags.join(","))}`);
    }
    return items.join(",");
  }
}
class RunTree {
  constructor(originalConfig) {
    var _config$client, _this$execution_order, _this$child_execution;
    Object.defineProperty(this, "id", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "run_type", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "project_name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "parent_run", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "child_runs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "start_time", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "end_time", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "extra", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "error", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "serialized", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "inputs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "outputs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "reference_example_id", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "client", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "events", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "trace_id", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "dotted_order", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tracingEnabled", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "execution_order", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "child_execution_order", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    const defaultConfig = RunTree.getDefaultConfig();
    const {
      metadata,
      ...config
    } = originalConfig;
    const client = (_config$client = config.client) !== null && _config$client !== void 0 ? _config$client : new Client();
    const dedupedMetadata = {
      ...metadata,
      ...config?.extra?.metadata
    };
    config.extra = {
      ...config.extra,
      metadata: dedupedMetadata
    };
    Object.assign(this, {
      ...defaultConfig,
      ...config,
      client
    });
    if (!this.trace_id) {
      if (this.parent_run) {
        var _this$parent_run$trac;
        this.trace_id = (_this$parent_run$trac = this.parent_run.trace_id) !== null && _this$parent_run$trac !== void 0 ? _this$parent_run$trac : this.id;
      } else {
        this.trace_id = this.id;
      }
    }
    (_this$execution_order = this.execution_order) !== null && _this$execution_order !== void 0 ? _this$execution_order : this.execution_order = 1;
    (_this$child_execution = this.child_execution_order) !== null && _this$child_execution !== void 0 ? _this$child_execution : this.child_execution_order = 1;
    if (!this.dotted_order) {
      const currentDottedOrder = convertToDottedOrderFormat$1(this.start_time, this.id, this.execution_order);
      if (this.parent_run) {
        this.dotted_order = this.parent_run.dotted_order + "." + currentDottedOrder;
      } else {
        this.dotted_order = currentDottedOrder;
      }
    }
  }
  static getDefaultConfig() {
    var _ref, _getEnvironmentVariab, _getEnvironmentVariab2;
    return {
      id: v4$1(),
      run_type: "chain",
      project_name: (_ref = (_getEnvironmentVariab = getEnvironmentVariable$1("LANGCHAIN_PROJECT")) !== null && _getEnvironmentVariab !== void 0 ? _getEnvironmentVariab : getEnvironmentVariable$1("LANGCHAIN_SESSION")) !== null && _ref !== void 0 ? _ref :
      // TODO: Deprecate
      "default",
      child_runs: [],
      api_url: (_getEnvironmentVariab2 = getEnvironmentVariable$1("LANGCHAIN_ENDPOINT")) !== null && _getEnvironmentVariab2 !== void 0 ? _getEnvironmentVariab2 : "http://localhost:1984",
      api_key: getEnvironmentVariable$1("LANGCHAIN_API_KEY"),
      caller_options: {},
      start_time: Date.now(),
      serialized: {},
      inputs: {},
      extra: {}
    };
  }
  createChild(config) {
    var _config$extra$LC_CHIL;
    const child_execution_order = this.child_execution_order + 1;
    const child = new RunTree({
      ...config,
      parent_run: this,
      project_name: this.project_name,
      client: this.client,
      tracingEnabled: this.tracingEnabled,
      execution_order: child_execution_order,
      child_execution_order: child_execution_order
    });
    const LC_CHILD = Symbol.for("lc:child_config");
    const presentConfig = (_config$extra$LC_CHIL = config.extra?.[LC_CHILD]) !== null && _config$extra$LC_CHIL !== void 0 ? _config$extra$LC_CHIL : this.extra[LC_CHILD];
    // tracing for LangChain is defined by the _parentRunId and runMap of the tracer
    if (isRunnableConfigLike(presentConfig)) {
      const newConfig = {
        ...presentConfig
      };
      const callbacks = isCallbackManagerLike(newConfig.callbacks) ? newConfig.callbacks.copy?.() : undefined;
      if (callbacks) {
        // update the parent run id
        Object.assign(callbacks, {
          _parentRunId: child.id
        });
        // only populate if we're in a newer LC.JS version
        callbacks.handlers?.find(isLangChainTracerLike)?.updateFromRunTree?.(child);
        newConfig.callbacks = callbacks;
      }
      child.extra[LC_CHILD] = newConfig;
    }
    // propagate child_execution_order upwards
    const visited = new Set();
    let current = this;
    while (current != null && !visited.has(current.id)) {
      visited.add(current.id);
      current.child_execution_order = Math.max(current.child_execution_order, child_execution_order);
      current = current.parent_run;
    }
    this.child_runs.push(child);
    return child;
  }
  async end(outputs, error, endTime = Date.now()) {
    var _this$outputs, _this$error, _this$end_time;
    this.outputs = (_this$outputs = this.outputs) !== null && _this$outputs !== void 0 ? _this$outputs : outputs;
    this.error = (_this$error = this.error) !== null && _this$error !== void 0 ? _this$error : error;
    this.end_time = (_this$end_time = this.end_time) !== null && _this$end_time !== void 0 ? _this$end_time : endTime;
  }
  _convertToCreate(run, runtimeEnv, excludeChildRuns = true) {
    var _run$extra;
    const runExtra = (_run$extra = run.extra) !== null && _run$extra !== void 0 ? _run$extra : {};
    if (!runExtra.runtime) {
      runExtra.runtime = {};
    }
    if (runtimeEnv) {
      for (const [k, v] of Object.entries(runtimeEnv)) {
        if (!runExtra.runtime[k]) {
          runExtra.runtime[k] = v;
        }
      }
    }
    let child_runs;
    let parent_run_id;
    if (!excludeChildRuns) {
      child_runs = run.child_runs.map(child_run => this._convertToCreate(child_run, runtimeEnv, excludeChildRuns));
      parent_run_id = undefined;
    } else {
      parent_run_id = run.parent_run?.id;
      child_runs = [];
    }
    const persistedRun = {
      id: run.id,
      name: run.name,
      start_time: run.start_time,
      end_time: run.end_time,
      run_type: run.run_type,
      reference_example_id: run.reference_example_id,
      extra: runExtra,
      serialized: run.serialized,
      error: run.error,
      inputs: run.inputs,
      outputs: run.outputs,
      session_name: run.project_name,
      child_runs: child_runs,
      parent_run_id: parent_run_id,
      trace_id: run.trace_id,
      dotted_order: run.dotted_order,
      tags: run.tags
    };
    return persistedRun;
  }
  async postRun(excludeChildRuns = true) {
    const runtimeEnv = await getRuntimeEnvironment$1();
    const runCreate = await this._convertToCreate(this, runtimeEnv, true);
    await this.client.createRun(runCreate);
    if (!excludeChildRuns) {
      warnOnce("Posting with excludeChildRuns=false is deprecated and will be removed in a future version.");
      for (const childRun of this.child_runs) {
        await childRun.postRun(false);
      }
    }
  }
  async patchRun() {
    const runUpdate = {
      end_time: this.end_time,
      error: this.error,
      inputs: this.inputs,
      outputs: this.outputs,
      parent_run_id: this.parent_run?.id,
      reference_example_id: this.reference_example_id,
      extra: this.extra,
      events: this.events,
      dotted_order: this.dotted_order,
      trace_id: this.trace_id,
      tags: this.tags
    };
    await this.client.updateRun(this.id, runUpdate);
  }
  toJSON() {
    return this._convertToCreate(this, undefined, false);
  }
  static fromRunnableConfig(parentConfig, props) {
    var _parentRun$tags, _parentConfig$tags;
    // We only handle the callback manager case for now
    const callbackManager = parentConfig?.callbacks;
    let parentRun;
    let projectName;
    let client;
    let tracingEnabled = isTracingEnabled$1();
    if (callbackManager) {
      var _callbackManager$getP;
      const parentRunId = (_callbackManager$getP = callbackManager?.getParentRunId?.()) !== null && _callbackManager$getP !== void 0 ? _callbackManager$getP : "";
      const langChainTracer = callbackManager?.handlers?.find(handler => handler?.name == "langchain_tracer");
      parentRun = langChainTracer?.getRun?.(parentRunId);
      projectName = langChainTracer?.projectName;
      client = langChainTracer?.client;
      tracingEnabled = tracingEnabled || !!langChainTracer;
    }
    if (!parentRun) {
      return new RunTree({
        ...props,
        client,
        tracingEnabled,
        project_name: projectName
      });
    }
    const parentRunTree = new RunTree({
      name: parentRun.name,
      id: parentRun.id,
      client,
      tracingEnabled,
      project_name: projectName,
      tags: [...new Set(((_parentRun$tags = parentRun?.tags) !== null && _parentRun$tags !== void 0 ? _parentRun$tags : []).concat((_parentConfig$tags = parentConfig?.tags) !== null && _parentConfig$tags !== void 0 ? _parentConfig$tags : []))],
      extra: {
        metadata: {
          ...parentRun?.extra?.metadata,
          ...parentConfig?.metadata
        }
      }
    });
    return parentRunTree.createChild(props);
  }
  static fromDottedOrder(dottedOrder) {
    return this.fromHeaders({
      "langsmith-trace": dottedOrder
    });
  }
  static fromHeaders(headers, inheritArgs) {
    var _inheritArgs$name, _inheritArgs$run_type, _inheritArgs$start_ti;
    const rawHeaders = "get" in headers && typeof headers.get === "function" ? {
      "langsmith-trace": headers.get("langsmith-trace"),
      baggage: headers.get("baggage")
    } : headers;
    const headerTrace = rawHeaders["langsmith-trace"];
    if (!headerTrace || typeof headerTrace !== "string") return undefined;
    const parentDottedOrder = headerTrace.trim();
    const parsedDottedOrder = parentDottedOrder.split(".").map(part => {
      const [strTime, uuid] = part.split("Z");
      return {
        strTime,
        time: Date.parse(strTime + "Z"),
        uuid
      };
    });
    const traceId = parsedDottedOrder[0].uuid;
    const config = {
      ...inheritArgs,
      name: (_inheritArgs$name = inheritArgs?.["name"]) !== null && _inheritArgs$name !== void 0 ? _inheritArgs$name : "parent",
      run_type: (_inheritArgs$run_type = inheritArgs?.["run_type"]) !== null && _inheritArgs$run_type !== void 0 ? _inheritArgs$run_type : "chain",
      start_time: (_inheritArgs$start_ti = inheritArgs?.["start_time"]) !== null && _inheritArgs$start_ti !== void 0 ? _inheritArgs$start_ti : Date.now(),
      id: parsedDottedOrder.at(-1)?.uuid,
      trace_id: traceId,
      dotted_order: parentDottedOrder
    };
    if (rawHeaders["baggage"] && typeof rawHeaders["baggage"] === "string") {
      const baggage = Baggage.fromHeader(rawHeaders["baggage"]);
      config.metadata = baggage.metadata;
      config.tags = baggage.tags;
    }
    return new RunTree(config);
  }
  toHeaders(headers) {
    const result = {
      "langsmith-trace": this.dotted_order,
      baggage: new Baggage(this.extra?.metadata, this.tags).toHeader()
    };
    if (headers) {
      for (const [key, value] of Object.entries(result)) {
        headers.set(key, value);
      }
    }
    return result;
  }
}
function isRunTree(x) {
  return x !== undefined && typeof x.createChild === "function" && typeof x.postRun === "function";
}
function isLangChainTracerLike(x) {
  return typeof x === "object" && x != null && typeof x.name === "string" && x.name === "langchain_tracer";
}
function containsLangChainTracerLike(x) {
  return Array.isArray(x) && x.some(callback => isLangChainTracerLike(callback));
}
function isCallbackManagerLike(x) {
  return typeof x === "object" && x != null && Array.isArray(x.handlers);
}
function isRunnableConfigLike(x) {
  // Check that it's an object with a callbacks arg
  // that has either a CallbackManagerLike object with a langchain tracer within it
  // or an array with a LangChainTracerLike object within it
  return x !== undefined && typeof x.callbacks === "object" && (
  // Callback manager with a langchain tracer
  containsLangChainTracerLike(x.callbacks?.handlers) ||
  // Or it's an array with a LangChainTracerLike object within it
  containsLangChainTracerLike(x.callbacks));
}

// Update using yarn bump-version
const __version__ = "0.1.39";

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  //
  // Note to future-self: No, you can't remove the `toLowerCase()` call.
  // REF: https://github.com/uuidjs/uuid/pull/677#issuecomment-1757351351
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).

var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }
  return getRandomValues(rnds8);
}

var randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native = {
  randomUUID
};

function v4(options, buf, offset) {
  if (native.randomUUID && !buf && !options) {
    return native.randomUUID();
  }
  options = options || {};
  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80;
  return unsafeStringify(rnds);
}

var decamelize$1 = function (str, sep) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }
  sep = typeof sep === 'undefined' ? '_' : sep;
  return str.replace(/([a-z\d])([A-Z])/g, '$1' + sep + '$2').replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1' + sep + '$2').toLowerCase();
};
var snakeCase = /*@__PURE__*/getDefaultExportFromCjs(decamelize$1);

var camelcase = {exports: {}};

const UPPERCASE = /[\p{Lu}]/u;
const LOWERCASE = /[\p{Ll}]/u;
const LEADING_CAPITAL = /^[\p{Lu}](?![\p{Lu}])/gu;
const IDENTIFIER = /([\p{Alpha}\p{N}_]|$)/u;
const SEPARATORS = /[_.\- ]+/;
const LEADING_SEPARATORS = new RegExp('^' + SEPARATORS.source);
const SEPARATORS_AND_IDENTIFIER = new RegExp(SEPARATORS.source + IDENTIFIER.source, 'gu');
const NUMBERS_AND_IDENTIFIER = new RegExp('\\d+' + IDENTIFIER.source, 'gu');
const preserveCamelCase = (string, toLowerCase, toUpperCase) => {
  let isLastCharLower = false;
  let isLastCharUpper = false;
  let isLastLastCharUpper = false;
  for (let i = 0; i < string.length; i++) {
    const character = string[i];
    if (isLastCharLower && UPPERCASE.test(character)) {
      string = string.slice(0, i) + '-' + string.slice(i);
      isLastCharLower = false;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = true;
      i++;
    } else if (isLastCharUpper && isLastLastCharUpper && LOWERCASE.test(character)) {
      string = string.slice(0, i - 1) + '-' + string.slice(i - 1);
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = false;
      isLastCharLower = true;
    } else {
      isLastCharLower = toLowerCase(character) === character && toUpperCase(character) !== character;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = toUpperCase(character) === character && toLowerCase(character) !== character;
    }
  }
  return string;
};
const preserveConsecutiveUppercase = (input, toLowerCase) => {
  LEADING_CAPITAL.lastIndex = 0;
  return input.replace(LEADING_CAPITAL, m1 => toLowerCase(m1));
};
const postProcess = (input, toUpperCase) => {
  SEPARATORS_AND_IDENTIFIER.lastIndex = 0;
  NUMBERS_AND_IDENTIFIER.lastIndex = 0;
  return input.replace(SEPARATORS_AND_IDENTIFIER, (_, identifier) => toUpperCase(identifier)).replace(NUMBERS_AND_IDENTIFIER, m => toUpperCase(m));
};
const camelCase$1 = (input, options) => {
  if (!(typeof input === 'string' || Array.isArray(input))) {
    throw new TypeError('Expected the input to be `string | string[]`');
  }
  options = {
    pascalCase: false,
    preserveConsecutiveUppercase: false,
    ...options
  };
  if (Array.isArray(input)) {
    input = input.map(x => x.trim()).filter(x => x.length).join('-');
  } else {
    input = input.trim();
  }
  if (input.length === 0) {
    return '';
  }
  const toLowerCase = options.locale === false ? string => string.toLowerCase() : string => string.toLocaleLowerCase(options.locale);
  const toUpperCase = options.locale === false ? string => string.toUpperCase() : string => string.toLocaleUpperCase(options.locale);
  if (input.length === 1) {
    return options.pascalCase ? toUpperCase(input) : toLowerCase(input);
  }
  const hasUpperCase = input !== toLowerCase(input);
  if (hasUpperCase) {
    input = preserveCamelCase(input, toLowerCase, toUpperCase);
  }
  input = input.replace(LEADING_SEPARATORS, '');
  if (options.preserveConsecutiveUppercase) {
    input = preserveConsecutiveUppercase(input, toLowerCase);
  } else {
    input = toLowerCase(input);
  }
  if (options.pascalCase) {
    input = toUpperCase(input.charAt(0)) + input.slice(1);
  }
  return postProcess(input, toUpperCase);
};
camelcase.exports = camelCase$1;
// TODO: Remove this for the next major release
camelcase.exports.default = camelCase$1;

function keyToJson(key, map) {
  return map?.[key] || snakeCase(key);
}
function mapKeys(fields, mapper, map) {
  const mapped = {};
  for (const key in fields) {
    if (Object.hasOwn(fields, key)) {
      mapped[mapper(key, map)] = fields[key];
    }
  }
  return mapped;
}

function shallowCopy(obj) {
  return Array.isArray(obj) ? [...obj] : {
    ...obj
  };
}
function replaceSecrets(root, secretsMap) {
  const result = shallowCopy(root);
  for (const [path, secretId] of Object.entries(secretsMap)) {
    const [last, ...partsReverse] = path.split(".").reverse();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current = result;
    for (const part of partsReverse.reverse()) {
      if (current[part] === undefined) {
        break;
      }
      current[part] = shallowCopy(current[part]);
      current = current[part];
    }
    if (current[last] !== undefined) {
      current[last] = {
        lc: 1,
        type: "secret",
        id: [secretId]
      };
    }
  }
  return result;
}
/**
 * Get a unique name for the module, rather than parent class implementations.
 * Should not be subclassed, subclass lc_name above instead.
 */
function get_lc_unique_name(
// eslint-disable-next-line @typescript-eslint/no-use-before-define
serializableClass) {
  // "super" here would refer to the parent class of Serializable,
  // when we want the parent class of the module actually calling this method.
  const parentClass = Object.getPrototypeOf(serializableClass);
  const lcNameIsSubclassed = typeof serializableClass.lc_name === "function" && (typeof parentClass.lc_name !== "function" || serializableClass.lc_name() !== parentClass.lc_name());
  if (lcNameIsSubclassed) {
    return serializableClass.lc_name();
  } else {
    return serializableClass.name;
  }
}
class Serializable {
  /**
   * The name of the serializable. Override to provide an alias or
   * to preserve the serialized module name in minified environments.
   *
   * Implemented as a static method to support loading logic.
   */
  static lc_name() {
    return this.name;
  }
  /**
   * The final serialized identifier for the module.
   */
  get lc_id() {
    return [...this.lc_namespace, get_lc_unique_name(this.constructor)];
  }
  /**
   * A map of secrets, which will be omitted from serialization.
   * Keys are paths to the secret in constructor args, e.g. "foo.bar.baz".
   * Values are the secret ids, which will be used when deserializing.
   */
  get lc_secrets() {
    return undefined;
  }
  /**
   * A map of additional attributes to merge with constructor args.
   * Keys are the attribute names, e.g. "foo".
   * Values are the attribute values, which will be serialized.
   * These attributes need to be accepted by the constructor as arguments.
   */
  get lc_attributes() {
    return undefined;
  }
  /**
   * A map of aliases for constructor args.
   * Keys are the attribute names, e.g. "foo".
   * Values are the alias that will replace the key in serialization.
   * This is used to eg. make argument names match Python.
   */
  get lc_aliases() {
    return undefined;
  }
  constructor(kwargs, ..._args) {
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "lc_kwargs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.lc_kwargs = kwargs || {};
  }
  toJSON() {
    if (!this.lc_serializable) {
      return this.toJSONNotImplemented();
    }
    if (
    // eslint-disable-next-line no-instanceof/no-instanceof
    this.lc_kwargs instanceof Serializable || typeof this.lc_kwargs !== "object" || Array.isArray(this.lc_kwargs)) {
      // We do not support serialization of classes with arg not a POJO
      // I'm aware the check above isn't as strict as it could be
      return this.toJSONNotImplemented();
    }
    const aliases = {};
    const secrets = {};
    const kwargs = Object.keys(this.lc_kwargs).reduce((acc, key) => {
      acc[key] = key in this ? this[key] : this.lc_kwargs[key];
      return acc;
    }, {});
    // get secrets, attributes and aliases from all superclasses
    for (
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current = Object.getPrototypeOf(this); current; current = Object.getPrototypeOf(current)) {
      Object.assign(aliases, Reflect.get(current, "lc_aliases", this));
      Object.assign(secrets, Reflect.get(current, "lc_secrets", this));
      Object.assign(kwargs, Reflect.get(current, "lc_attributes", this));
    }
    // include all secrets used, even if not in kwargs,
    // will be replaced with sentinel value in replaceSecrets
    Object.keys(secrets).forEach(keyPath => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-explicit-any
      let read = this;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let write = kwargs;
      const [last, ...partsReverse] = keyPath.split(".").reverse();
      for (const key of partsReverse.reverse()) {
        if (!(key in read) || read[key] === undefined) return;
        if (!(key in write) || write[key] === undefined) {
          if (typeof read[key] === "object" && read[key] != null) {
            write[key] = {};
          } else if (Array.isArray(read[key])) {
            write[key] = [];
          }
        }
        read = read[key];
        write = write[key];
      }
      if (last in read && read[last] !== undefined) {
        write[last] = write[last] || read[last];
      }
    });
    return {
      lc: 1,
      type: "constructor",
      id: this.lc_id,
      kwargs: mapKeys(Object.keys(secrets).length ? replaceSecrets(kwargs, secrets) : kwargs, keyToJson, aliases)
    };
  }
  toJSONNotImplemented() {
    return {
      lc: 1,
      type: "not_implemented",
      id: this.lc_id
    };
  }
}

const isBrowser = () => typeof window !== "undefined" && typeof window.document !== "undefined";
const isWebWorker = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
const isJsDom = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && (navigator.userAgent.includes("Node.js") || navigator.userAgent.includes("jsdom"));
// Supabase Edge Function provides a `Deno` global object
// without `version` property
const isDeno = () => typeof Deno !== "undefined";
// Mark not-as-node if in Supabase Edge Function
const isNode = () => typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && !isDeno();
const getEnv = () => {
  let env;
  if (isBrowser()) {
    env = "browser";
  } else if (isNode()) {
    env = "node";
  } else if (isWebWorker()) {
    env = "webworker";
  } else if (isJsDom()) {
    env = "jsdom";
  } else if (isDeno()) {
    env = "deno";
  } else {
    env = "other";
  }
  return env;
};
let runtimeEnvironment;
async function getRuntimeEnvironment() {
  if (runtimeEnvironment === undefined) {
    const env = getEnv();
    runtimeEnvironment = {
      library: "langchain-js",
      runtime: env
    };
  }
  return runtimeEnvironment;
}
function getEnvironmentVariable(name) {
  // Certain Deno setups will throw an error if you try to access environment variables
  // https://github.com/langchain-ai/langchainjs/issues/1412
  try {
    return typeof process !== "undefined" ?
    // eslint-disable-next-line no-process-env
    process.env?.[name] : undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Abstract class that provides a set of optional methods that can be
 * overridden in derived classes to handle various events during the
 * execution of a LangChain application.
 */
class BaseCallbackHandlerMethodsClass {}
/**
 * Abstract base class for creating callback handlers in the LangChain
 * framework. It provides a set of optional methods that can be overridden
 * in derived classes to handle various events during the execution of a
 * LangChain application.
 */
class BaseCallbackHandler extends BaseCallbackHandlerMethodsClass {
  get lc_namespace() {
    return ["langchain_core", "callbacks", this.name];
  }
  get lc_secrets() {
    return undefined;
  }
  get lc_attributes() {
    return undefined;
  }
  get lc_aliases() {
    return undefined;
  }
  /**
   * The name of the serializable. Override to provide an alias or
   * to preserve the serialized module name in minified environments.
   *
   * Implemented as a static method to support loading logic.
   */
  static lc_name() {
    return this.name;
  }
  /**
   * The final serialized identifier for the module.
   */
  get lc_id() {
    return [...this.lc_namespace, get_lc_unique_name(this.constructor)];
  }
  constructor(input) {
    super();
    Object.defineProperty(this, "lc_serializable", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "lc_kwargs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "ignoreLLM", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "ignoreChain", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "ignoreAgent", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "ignoreRetriever", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "ignoreCustomEvent", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "raiseError", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    Object.defineProperty(this, "awaitHandlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: getEnvironmentVariable("LANGCHAIN_CALLBACKS_BACKGROUND") !== "true"
    });
    this.lc_kwargs = input || {};
    if (input) {
      var _input$ignoreLLM, _input$ignoreChain, _input$ignoreAgent, _input$ignoreRetrieve, _input$ignoreCustomEv, _input$raiseError, _input$_awaitHandler;
      this.ignoreLLM = (_input$ignoreLLM = input.ignoreLLM) !== null && _input$ignoreLLM !== void 0 ? _input$ignoreLLM : this.ignoreLLM;
      this.ignoreChain = (_input$ignoreChain = input.ignoreChain) !== null && _input$ignoreChain !== void 0 ? _input$ignoreChain : this.ignoreChain;
      this.ignoreAgent = (_input$ignoreAgent = input.ignoreAgent) !== null && _input$ignoreAgent !== void 0 ? _input$ignoreAgent : this.ignoreAgent;
      this.ignoreRetriever = (_input$ignoreRetrieve = input.ignoreRetriever) !== null && _input$ignoreRetrieve !== void 0 ? _input$ignoreRetrieve : this.ignoreRetriever;
      this.ignoreCustomEvent = (_input$ignoreCustomEv = input.ignoreCustomEvent) !== null && _input$ignoreCustomEv !== void 0 ? _input$ignoreCustomEv : this.ignoreCustomEvent;
      this.raiseError = (_input$raiseError = input.raiseError) !== null && _input$raiseError !== void 0 ? _input$raiseError : this.raiseError;
      this.awaitHandlers = this.raiseError || ((_input$_awaitHandler = input._awaitHandler) !== null && _input$_awaitHandler !== void 0 ? _input$_awaitHandler : this.awaitHandlers);
    }
  }
  copy() {
    return new this.constructor(this);
  }
  toJSON() {
    return Serializable.prototype.toJSON.call(this);
  }
  toJSONNotImplemented() {
    return Serializable.prototype.toJSONNotImplemented.call(this);
  }
  static fromMethods(methods) {
    class Handler extends BaseCallbackHandler {
      constructor() {
        super();
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: v4()
        });
        Object.assign(this, methods);
      }
    }
    return new Handler();
  }
}

var ansiStyles = {exports: {}};

ansiStyles.exports;
(function (module) {

  const ANSI_BACKGROUND_OFFSET = 10;
  const wrapAnsi256 = (offset = 0) => code => `\u001B[${38 + offset};5;${code}m`;
  const wrapAnsi16m = (offset = 0) => (red, green, blue) => `\u001B[${38 + offset};2;${red};${green};${blue}m`;
  function assembleStyles() {
    const codes = new Map();
    const styles = {
      modifier: {
        reset: [0, 0],
        // 21 isn't widely supported and 22 does the same thing
        bold: [1, 22],
        dim: [2, 22],
        italic: [3, 23],
        underline: [4, 24],
        overline: [53, 55],
        inverse: [7, 27],
        hidden: [8, 28],
        strikethrough: [9, 29]
      },
      color: {
        black: [30, 39],
        red: [31, 39],
        green: [32, 39],
        yellow: [33, 39],
        blue: [34, 39],
        magenta: [35, 39],
        cyan: [36, 39],
        white: [37, 39],
        // Bright color
        blackBright: [90, 39],
        redBright: [91, 39],
        greenBright: [92, 39],
        yellowBright: [93, 39],
        blueBright: [94, 39],
        magentaBright: [95, 39],
        cyanBright: [96, 39],
        whiteBright: [97, 39]
      },
      bgColor: {
        bgBlack: [40, 49],
        bgRed: [41, 49],
        bgGreen: [42, 49],
        bgYellow: [43, 49],
        bgBlue: [44, 49],
        bgMagenta: [45, 49],
        bgCyan: [46, 49],
        bgWhite: [47, 49],
        // Bright color
        bgBlackBright: [100, 49],
        bgRedBright: [101, 49],
        bgGreenBright: [102, 49],
        bgYellowBright: [103, 49],
        bgBlueBright: [104, 49],
        bgMagentaBright: [105, 49],
        bgCyanBright: [106, 49],
        bgWhiteBright: [107, 49]
      }
    };

    // Alias bright black as gray (and grey)
    styles.color.gray = styles.color.blackBright;
    styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
    styles.color.grey = styles.color.blackBright;
    styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;
    for (const [groupName, group] of Object.entries(styles)) {
      for (const [styleName, style] of Object.entries(group)) {
        styles[styleName] = {
          open: `\u001B[${style[0]}m`,
          close: `\u001B[${style[1]}m`
        };
        group[styleName] = styles[styleName];
        codes.set(style[0], style[1]);
      }
      Object.defineProperty(styles, groupName, {
        value: group,
        enumerable: false
      });
    }
    Object.defineProperty(styles, 'codes', {
      value: codes,
      enumerable: false
    });
    styles.color.close = '\u001B[39m';
    styles.bgColor.close = '\u001B[49m';
    styles.color.ansi256 = wrapAnsi256();
    styles.color.ansi16m = wrapAnsi16m();
    styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
    styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);

    // From https://github.com/Qix-/color-convert/blob/3f0e0d4e92e235796ccb17f6e85c72094a651f49/conversions.js
    Object.defineProperties(styles, {
      rgbToAnsi256: {
        value: (red, green, blue) => {
          // We use the extended greyscale palette here, with the exception of
          // black and white. normal palette only has 4 greyscale shades.
          if (red === green && green === blue) {
            if (red < 8) {
              return 16;
            }
            if (red > 248) {
              return 231;
            }
            return Math.round((red - 8) / 247 * 24) + 232;
          }
          return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
        },
        enumerable: false
      },
      hexToRgb: {
        value: hex => {
          const matches = /(?<colorString>[a-f\d]{6}|[a-f\d]{3})/i.exec(hex.toString(16));
          if (!matches) {
            return [0, 0, 0];
          }
          let {
            colorString
          } = matches.groups;
          if (colorString.length === 3) {
            colorString = colorString.split('').map(character => character + character).join('');
          }
          const integer = Number.parseInt(colorString, 16);
          return [integer >> 16 & 0xFF, integer >> 8 & 0xFF, integer & 0xFF];
        },
        enumerable: false
      },
      hexToAnsi256: {
        value: hex => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
        enumerable: false
      }
    });
    return styles;
  }

  // Make the export immutable
  Object.defineProperty(module, 'exports', {
    enumerable: true,
    get: assembleStyles
  });
})(ansiStyles);
var ansiStylesExports = ansiStyles.exports;
var styles = /*@__PURE__*/getDefaultExportFromCjs(ansiStylesExports);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _coerceToDict(value, defaultKey) {
  return value && !Array.isArray(value) && typeof value === "object" ? value : {
    [defaultKey]: value
  };
}
function stripNonAlphanumeric(input) {
  return input.replace(/[-:.]/g, "");
}
function convertToDottedOrderFormat(epoch, runId, executionOrder) {
  const paddedOrder = executionOrder.toFixed(0).slice(0, 3).padStart(3, "0");
  return stripNonAlphanumeric(`${new Date(epoch).toISOString().slice(0, -1)}${paddedOrder}Z`) + runId;
}
function isBaseTracer(x) {
  return typeof x._addRunToRunMap === "function";
}
class BaseTracer extends BaseCallbackHandler {
  constructor(_fields) {
    super(...arguments);
    Object.defineProperty(this, "runMap", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new Map()
    });
  }
  copy() {
    return this;
  }
  stringifyError(error) {
    // eslint-disable-next-line no-instanceof/no-instanceof
    if (error instanceof Error) {
      return error.message + (error?.stack ? `\n\n${error.stack}` : "");
    }
    if (typeof error === "string") {
      return error;
    }
    return `${error}`;
  }
  _addChildRun(parentRun, childRun) {
    parentRun.child_runs.push(childRun);
  }
  _addRunToRunMap(run) {
    const currentDottedOrder = convertToDottedOrderFormat(run.start_time, run.id, run.execution_order);
    const storedRun = {
      ...run
    };
    if (storedRun.parent_run_id !== undefined) {
      const parentRun = this.runMap.get(storedRun.parent_run_id);
      if (parentRun) {
        this._addChildRun(parentRun, storedRun);
        parentRun.child_execution_order = Math.max(parentRun.child_execution_order, storedRun.child_execution_order);
        storedRun.trace_id = parentRun.trace_id;
        if (parentRun.dotted_order !== undefined) {
          storedRun.dotted_order = [parentRun.dotted_order, currentDottedOrder].join(".");
        }
      }
    } else {
      storedRun.trace_id = storedRun.id;
      storedRun.dotted_order = currentDottedOrder;
    }
    this.runMap.set(storedRun.id, storedRun);
    return storedRun;
  }
  async _endTrace(run) {
    const parentRun = run.parent_run_id !== undefined && this.runMap.get(run.parent_run_id);
    if (parentRun) {
      parentRun.child_execution_order = Math.max(parentRun.child_execution_order, run.child_execution_order);
    } else {
      await this.persistRun(run);
    }
    this.runMap.delete(run.id);
    await this.onRunUpdate?.(run);
  }
  _getExecutionOrder(parentRunId) {
    const parentRun = parentRunId !== undefined && this.runMap.get(parentRunId);
    // If a run has no parent then execution order is 1
    if (!parentRun) {
      return 1;
    }
    return parentRun.child_execution_order + 1;
  }
  /**
   * Create and add a run to the run map for LLM start events.
   * This must sometimes be done synchronously to avoid race conditions
   * when callbacks are backgrounded, so we expose it as a separate method here.
   */
  _createRunForLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata, name) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const finalExtraParams = metadata ? {
      ...extraParams,
      metadata
    } : extraParams;
    const run = {
      id: runId,
      name: name !== null && name !== void 0 ? name : llm.id[llm.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: llm,
      events: [{
        name: "start",
        time: new Date(start_time).toISOString()
      }],
      inputs: {
        prompts
      },
      execution_order,
      child_runs: [],
      child_execution_order: execution_order,
      run_type: "llm",
      extra: finalExtraParams !== null && finalExtraParams !== void 0 ? finalExtraParams : {},
      tags: tags || []
    };
    return this._addRunToRunMap(run);
  }
  async handleLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata, name) {
    var _this$runMap$get;
    const run = (_this$runMap$get = this.runMap.get(runId)) !== null && _this$runMap$get !== void 0 ? _this$runMap$get : this._createRunForLLMStart(llm, prompts, runId, parentRunId, extraParams, tags, metadata, name);
    await this.onRunCreate?.(run);
    await this.onLLMStart?.(run);
    return run;
  }
  /**
   * Create and add a run to the run map for chat model start events.
   * This must sometimes be done synchronously to avoid race conditions
   * when callbacks are backgrounded, so we expose it as a separate method here.
   */
  _createRunForChatModelStart(llm, messages, runId, parentRunId, extraParams, tags, metadata, name) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const finalExtraParams = metadata ? {
      ...extraParams,
      metadata
    } : extraParams;
    const run = {
      id: runId,
      name: name !== null && name !== void 0 ? name : llm.id[llm.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: llm,
      events: [{
        name: "start",
        time: new Date(start_time).toISOString()
      }],
      inputs: {
        messages
      },
      execution_order,
      child_runs: [],
      child_execution_order: execution_order,
      run_type: "llm",
      extra: finalExtraParams !== null && finalExtraParams !== void 0 ? finalExtraParams : {},
      tags: tags || []
    };
    return this._addRunToRunMap(run);
  }
  async handleChatModelStart(llm, messages, runId, parentRunId, extraParams, tags, metadata, name) {
    var _this$runMap$get2;
    const run = (_this$runMap$get2 = this.runMap.get(runId)) !== null && _this$runMap$get2 !== void 0 ? _this$runMap$get2 : this._createRunForChatModelStart(llm, messages, runId, parentRunId, extraParams, tags, metadata, name);
    await this.onRunCreate?.(run);
    await this.onLLMStart?.(run);
    return run;
  }
  async handleLLMEnd(output, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "llm") {
      throw new Error("No LLM run to end.");
    }
    run.end_time = Date.now();
    run.outputs = output;
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    await this.onLLMEnd?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleLLMError(error, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "llm") {
      throw new Error("No LLM run to end.");
    }
    run.end_time = Date.now();
    run.error = this.stringifyError(error);
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    await this.onLLMError?.(run);
    await this._endTrace(run);
    return run;
  }
  /**
   * Create and add a run to the run map for chain start events.
   * This must sometimes be done synchronously to avoid race conditions
   * when callbacks are backgrounded, so we expose it as a separate method here.
   */
  _createRunForChainStart(chain, inputs, runId, parentRunId, tags, metadata, runType, name) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const run = {
      id: runId,
      name: name !== null && name !== void 0 ? name : chain.id[chain.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: chain,
      events: [{
        name: "start",
        time: new Date(start_time).toISOString()
      }],
      inputs,
      execution_order,
      child_execution_order: execution_order,
      run_type: runType !== null && runType !== void 0 ? runType : "chain",
      child_runs: [],
      extra: metadata ? {
        metadata
      } : {},
      tags: tags || []
    };
    return this._addRunToRunMap(run);
  }
  async handleChainStart(chain, inputs, runId, parentRunId, tags, metadata, runType, name) {
    var _this$runMap$get3;
    const run = (_this$runMap$get3 = this.runMap.get(runId)) !== null && _this$runMap$get3 !== void 0 ? _this$runMap$get3 : this._createRunForChainStart(chain, inputs, runId, parentRunId, tags, metadata, runType, name);
    await this.onRunCreate?.(run);
    await this.onChainStart?.(run);
    return run;
  }
  async handleChainEnd(outputs, runId, _parentRunId, _tags, kwargs) {
    const run = this.runMap.get(runId);
    if (!run) {
      throw new Error("No chain run to end.");
    }
    run.end_time = Date.now();
    run.outputs = _coerceToDict(outputs, "output");
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    if (kwargs?.inputs !== undefined) {
      run.inputs = _coerceToDict(kwargs.inputs, "input");
    }
    await this.onChainEnd?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleChainError(error, runId, _parentRunId, _tags, kwargs) {
    const run = this.runMap.get(runId);
    if (!run) {
      throw new Error("No chain run to end.");
    }
    run.end_time = Date.now();
    run.error = this.stringifyError(error);
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    if (kwargs?.inputs !== undefined) {
      run.inputs = _coerceToDict(kwargs.inputs, "input");
    }
    await this.onChainError?.(run);
    await this._endTrace(run);
    return run;
  }
  /**
   * Create and add a run to the run map for tool start events.
   * This must sometimes be done synchronously to avoid race conditions
   * when callbacks are backgrounded, so we expose it as a separate method here.
   */
  _createRunForToolStart(tool, input, runId, parentRunId, tags, metadata, name) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const run = {
      id: runId,
      name: name !== null && name !== void 0 ? name : tool.id[tool.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: tool,
      events: [{
        name: "start",
        time: new Date(start_time).toISOString()
      }],
      inputs: {
        input
      },
      execution_order,
      child_execution_order: execution_order,
      run_type: "tool",
      child_runs: [],
      extra: metadata ? {
        metadata
      } : {},
      tags: tags || []
    };
    return this._addRunToRunMap(run);
  }
  async handleToolStart(tool, input, runId, parentRunId, tags, metadata, name) {
    var _this$runMap$get4;
    const run = (_this$runMap$get4 = this.runMap.get(runId)) !== null && _this$runMap$get4 !== void 0 ? _this$runMap$get4 : this._createRunForToolStart(tool, input, runId, parentRunId, tags, metadata, name);
    await this.onRunCreate?.(run);
    await this.onToolStart?.(run);
    return run;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleToolEnd(output, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "tool") {
      throw new Error("No tool run to end");
    }
    run.end_time = Date.now();
    run.outputs = {
      output
    };
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    await this.onToolEnd?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleToolError(error, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "tool") {
      throw new Error("No tool run to end");
    }
    run.end_time = Date.now();
    run.error = this.stringifyError(error);
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    await this.onToolError?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleAgentAction(action, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "chain") {
      return;
    }
    const agentRun = run;
    agentRun.actions = agentRun.actions || [];
    agentRun.actions.push(action);
    agentRun.events.push({
      name: "agent_action",
      time: new Date().toISOString(),
      kwargs: {
        action
      }
    });
    await this.onAgentAction?.(run);
  }
  async handleAgentEnd(action, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "chain") {
      return;
    }
    run.events.push({
      name: "agent_end",
      time: new Date().toISOString(),
      kwargs: {
        action
      }
    });
    await this.onAgentEnd?.(run);
  }
  /**
   * Create and add a run to the run map for retriever start events.
   * This must sometimes be done synchronously to avoid race conditions
   * when callbacks are backgrounded, so we expose it as a separate method here.
   */
  _createRunForRetrieverStart(retriever, query, runId, parentRunId, tags, metadata, name) {
    const execution_order = this._getExecutionOrder(parentRunId);
    const start_time = Date.now();
    const run = {
      id: runId,
      name: name !== null && name !== void 0 ? name : retriever.id[retriever.id.length - 1],
      parent_run_id: parentRunId,
      start_time,
      serialized: retriever,
      events: [{
        name: "start",
        time: new Date(start_time).toISOString()
      }],
      inputs: {
        query
      },
      execution_order,
      child_execution_order: execution_order,
      run_type: "retriever",
      child_runs: [],
      extra: metadata ? {
        metadata
      } : {},
      tags: tags || []
    };
    return this._addRunToRunMap(run);
  }
  async handleRetrieverStart(retriever, query, runId, parentRunId, tags, metadata, name) {
    var _this$runMap$get5;
    const run = (_this$runMap$get5 = this.runMap.get(runId)) !== null && _this$runMap$get5 !== void 0 ? _this$runMap$get5 : this._createRunForRetrieverStart(retriever, query, runId, parentRunId, tags, metadata, name);
    await this.onRunCreate?.(run);
    await this.onRetrieverStart?.(run);
    return run;
  }
  async handleRetrieverEnd(documents, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "retriever") {
      throw new Error("No retriever run to end");
    }
    run.end_time = Date.now();
    run.outputs = {
      documents
    };
    run.events.push({
      name: "end",
      time: new Date(run.end_time).toISOString()
    });
    await this.onRetrieverEnd?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleRetrieverError(error, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "retriever") {
      throw new Error("No retriever run to end");
    }
    run.end_time = Date.now();
    run.error = this.stringifyError(error);
    run.events.push({
      name: "error",
      time: new Date(run.end_time).toISOString()
    });
    await this.onRetrieverError?.(run);
    await this._endTrace(run);
    return run;
  }
  async handleText(text, runId) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "chain") {
      return;
    }
    run.events.push({
      name: "text",
      time: new Date().toISOString(),
      kwargs: {
        text
      }
    });
    await this.onText?.(run);
  }
  async handleLLMNewToken(token, idx, runId, _parentRunId, _tags, fields) {
    const run = this.runMap.get(runId);
    if (!run || run?.run_type !== "llm") {
      throw new Error(`Invalid "runId" provided to "handleLLMNewToken" callback.`);
    }
    run.events.push({
      name: "new_token",
      time: new Date().toISOString(),
      kwargs: {
        token,
        idx,
        chunk: fields?.chunk
      }
    });
    await this.onLLMNewToken?.(run, token, {
      chunk: fields?.chunk
    });
    return run;
  }
}

function wrap$1(style, text) {
  return `${style.open}${text}${style.close}`;
}
function tryJsonStringify(obj, fallback) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (err) {
    return fallback;
  }
}
function elapsed(run) {
  if (!run.end_time) return "";
  const elapsed = run.end_time - run.start_time;
  if (elapsed < 1000) {
    return `${elapsed}ms`;
  }
  return `${(elapsed / 1000).toFixed(2)}s`;
}
const {
  color
} = styles;
/**
 * A tracer that logs all events to the console. It extends from the
 * `BaseTracer` class and overrides its methods to provide custom logging
 * functionality.
 * @example
 * ```typescript
 *
 * const llm = new ChatAnthropic({
 *   temperature: 0,
 *   tags: ["example", "callbacks", "constructor"],
 *   callbacks: [new ConsoleCallbackHandler()],
 * });
 *
 * ```
 */
class ConsoleCallbackHandler extends BaseTracer {
  constructor() {
    super(...arguments);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "console_callback_handler"
    });
  }
  /**
   * Method used to persist the run. In this case, it simply returns a
   * resolved promise as there's no persistence logic.
   * @param _run The run to persist.
   * @returns A resolved promise.
   */
  persistRun(_run) {
    return Promise.resolve();
  }
  // utility methods
  /**
   * Method used to get all the parent runs of a given run.
   * @param run The run whose parents are to be retrieved.
   * @returns An array of parent runs.
   */
  getParents(run) {
    const parents = [];
    let currentRun = run;
    while (currentRun.parent_run_id) {
      const parent = this.runMap.get(currentRun.parent_run_id);
      if (parent) {
        parents.push(parent);
        currentRun = parent;
      } else {
        break;
      }
    }
    return parents;
  }
  /**
   * Method used to get a string representation of the run's lineage, which
   * is used in logging.
   * @param run The run whose lineage is to be retrieved.
   * @returns A string representation of the run's lineage.
   */
  getBreadcrumbs(run) {
    const parents = this.getParents(run).reverse();
    const string = [...parents, run].map((parent, i, arr) => {
      const name = `${parent.execution_order}:${parent.run_type}:${parent.name}`;
      return i === arr.length - 1 ? wrap$1(styles.bold, name) : name;
    }).join(" > ");
    return wrap$1(color.grey, string);
  }
  // logging methods
  /**
   * Method used to log the start of a chain run.
   * @param run The chain run that has started.
   * @returns void
   */
  onChainStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.green, "[chain/start]")} [${crumbs}] Entering Chain run with input: ${tryJsonStringify(run.inputs, "[inputs]")}`);
  }
  /**
   * Method used to log the end of a chain run.
   * @param run The chain run that has ended.
   * @returns void
   */
  onChainEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.cyan, "[chain/end]")} [${crumbs}] [${elapsed(run)}] Exiting Chain run with output: ${tryJsonStringify(run.outputs, "[outputs]")}`);
  }
  /**
   * Method used to log any errors of a chain run.
   * @param run The chain run that has errored.
   * @returns void
   */
  onChainError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.red, "[chain/error]")} [${crumbs}] [${elapsed(run)}] Chain run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
   * Method used to log the start of an LLM run.
   * @param run The LLM run that has started.
   * @returns void
   */
  onLLMStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    const inputs = "prompts" in run.inputs ? {
      prompts: run.inputs.prompts.map(p => p.trim())
    } : run.inputs;
    console.log(`${wrap$1(color.green, "[llm/start]")} [${crumbs}] Entering LLM run with input: ${tryJsonStringify(inputs, "[inputs]")}`);
  }
  /**
   * Method used to log the end of an LLM run.
   * @param run The LLM run that has ended.
   * @returns void
   */
  onLLMEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.cyan, "[llm/end]")} [${crumbs}] [${elapsed(run)}] Exiting LLM run with output: ${tryJsonStringify(run.outputs, "[response]")}`);
  }
  /**
   * Method used to log any errors of an LLM run.
   * @param run The LLM run that has errored.
   * @returns void
   */
  onLLMError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.red, "[llm/error]")} [${crumbs}] [${elapsed(run)}] LLM run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
   * Method used to log the start of a tool run.
   * @param run The tool run that has started.
   * @returns void
   */
  onToolStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.green, "[tool/start]")} [${crumbs}] Entering Tool run with input: "${run.inputs.input?.trim()}"`);
  }
  /**
   * Method used to log the end of a tool run.
   * @param run The tool run that has ended.
   * @returns void
   */
  onToolEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.cyan, "[tool/end]")} [${crumbs}] [${elapsed(run)}] Exiting Tool run with output: "${run.outputs?.output?.trim()}"`);
  }
  /**
   * Method used to log any errors of a tool run.
   * @param run The tool run that has errored.
   * @returns void
   */
  onToolError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.red, "[tool/error]")} [${crumbs}] [${elapsed(run)}] Tool run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
   * Method used to log the start of a retriever run.
   * @param run The retriever run that has started.
   * @returns void
   */
  onRetrieverStart(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.green, "[retriever/start]")} [${crumbs}] Entering Retriever run with input: ${tryJsonStringify(run.inputs, "[inputs]")}`);
  }
  /**
   * Method used to log the end of a retriever run.
   * @param run The retriever run that has ended.
   * @returns void
   */
  onRetrieverEnd(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.cyan, "[retriever/end]")} [${crumbs}] [${elapsed(run)}] Exiting Retriever run with output: ${tryJsonStringify(run.outputs, "[outputs]")}`);
  }
  /**
   * Method used to log any errors of a retriever run.
   * @param run The retriever run that has errored.
   * @returns void
   */
  onRetrieverError(run) {
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.red, "[retriever/error]")} [${crumbs}] [${elapsed(run)}] Retriever run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
  }
  /**
   * Method used to log the action selected by the agent.
   * @param run The run in which the agent action occurred.
   * @returns void
   */
  onAgentAction(run) {
    const agentRun = run;
    const crumbs = this.getBreadcrumbs(run);
    console.log(`${wrap$1(color.blue, "[agent/action]")} [${crumbs}] Agent selected action: ${tryJsonStringify(agentRun.actions[agentRun.actions.length - 1], "[action]")}`);
  }
}

/**
 * This function is used by memory classes to get a string representation
 * of the chat message history, based on the message content and role.
 */
function getBufferString(messages, humanPrefix = "Human", aiPrefix = "AI") {
  const string_messages = [];
  for (const m of messages) {
    let role;
    if (m._getType() === "human") {
      role = humanPrefix;
    } else if (m._getType() === "ai") {
      role = aiPrefix;
    } else if (m._getType() === "system") {
      role = "System";
    } else if (m._getType() === "function") {
      role = "Function";
    } else if (m._getType() === "tool") {
      role = "Tool";
    } else if (m._getType() === "generic") {
      role = m.role;
    } else {
      throw new Error(`Got unsupported message type: ${m._getType()}`);
    }
    const nameStr = m.name ? `${m.name}, ` : "";
    const readableContent = typeof m.content === "string" ? m.content : JSON.stringify(m.content, null, 2);
    string_messages.push(`${role}: ${nameStr}${readableContent}`);
  }
  return string_messages.join("\n");
}

class MockAsyncLocalStorage {
  getStore() {
    return undefined;
  }
  run(_, callback) {
    return callback();
  }
}
const TRACING_ALS_KEY = Symbol.for("ls:tracing_async_local_storage");
const mockAsyncLocalStorage = new MockAsyncLocalStorage();
class AsyncLocalStorageProvider {
  getInstance() {
    var _globalThis$TRACING_A;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_globalThis$TRACING_A = globalThis[TRACING_ALS_KEY]) !== null && _globalThis$TRACING_A !== void 0 ? _globalThis$TRACING_A : mockAsyncLocalStorage;
  }
  initializeGlobalInstance(instance) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (globalThis[TRACING_ALS_KEY] === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      globalThis[TRACING_ALS_KEY] = instance;
    }
  }
}
const AsyncLocalStorageProviderSingleton = new AsyncLocalStorageProvider();
/**
 * Return the current run tree from within a traceable-wrapped function.
 * Will throw an error if called outside of a traceable function.
 *
 * @returns The run tree for the given context.
 */
const getCurrentRunTree = () => {
  const runTree = AsyncLocalStorageProviderSingleton.getInstance().getStore();
  if (runTree === undefined) {
    throw new Error(["Could not get the current run tree.", "", "Please make sure you are calling this method within a traceable function or the tracing is enabled."].join("\n"));
  }
  return runTree;
};
const ROOT = Symbol.for("langsmith:traceable:root");

class LangChainTracer extends BaseTracer {
  constructor(fields = {}) {
    var _ref;
    super(fields);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "langchain_tracer"
    });
    Object.defineProperty(this, "projectName", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "exampleId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "client", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    const {
      exampleId,
      projectName,
      client
    } = fields;
    this.projectName = (_ref = projectName !== null && projectName !== void 0 ? projectName : getEnvironmentVariable("LANGCHAIN_PROJECT")) !== null && _ref !== void 0 ? _ref : getEnvironmentVariable("LANGCHAIN_SESSION");
    this.exampleId = exampleId;
    this.client = client !== null && client !== void 0 ? client : new Client({});
    const traceableTree = LangChainTracer.getTraceableRunTree();
    if (traceableTree) {
      this.updateFromRunTree(traceableTree);
    }
  }
  async _convertToCreate(run, example_id = undefined) {
    return {
      ...run,
      extra: {
        ...run.extra,
        runtime: await getRuntimeEnvironment()
      },
      child_runs: undefined,
      session_name: this.projectName,
      reference_example_id: run.parent_run_id ? undefined : example_id
    };
  }
  async persistRun(_run) {}
  async onRunCreate(run) {
    const persistedRun = await this._convertToCreate(run, this.exampleId);
    await this.client.createRun(persistedRun);
  }
  async onRunUpdate(run) {
    const runUpdate = {
      end_time: run.end_time,
      error: run.error,
      outputs: run.outputs,
      events: run.events,
      inputs: run.inputs,
      trace_id: run.trace_id,
      dotted_order: run.dotted_order,
      parent_run_id: run.parent_run_id
    };
    await this.client.updateRun(run.id, runUpdate);
  }
  getRun(id) {
    return this.runMap.get(id);
  }
  updateFromRunTree(runTree) {
    var _runTree$client, _runTree$project_name, _runTree$reference_ex;
    let rootRun = runTree;
    const visited = new Set();
    while (rootRun.parent_run) {
      if (visited.has(rootRun.id)) break;
      visited.add(rootRun.id);
      if (!rootRun.parent_run) break;
      rootRun = rootRun.parent_run;
    }
    visited.clear();
    const queue = [rootRun];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current.id)) continue;
      visited.add(current.id);
      // @ts-expect-error Types of property 'events' are incompatible.
      this.runMap.set(current.id, current);
      if (current.child_runs) {
        queue.push(...current.child_runs);
      }
    }
    this.client = (_runTree$client = runTree.client) !== null && _runTree$client !== void 0 ? _runTree$client : this.client;
    this.projectName = (_runTree$project_name = runTree.project_name) !== null && _runTree$project_name !== void 0 ? _runTree$project_name : this.projectName;
    this.exampleId = (_runTree$reference_ex = runTree.reference_example_id) !== null && _runTree$reference_ex !== void 0 ? _runTree$reference_ex : this.exampleId;
  }
  convertToRunTree(id) {
    const runTreeMap = {};
    const runTreeList = [];
    for (const [id, run] of this.runMap) {
      // by converting the run map to a run tree, we are doing a copy
      // thus, any mutation performed on the run tree will not be reflected
      // back in the run map
      // TODO: Stop using `this.runMap` in favour of LangSmith's `RunTree`
      const runTree = new RunTree({
        ...run,
        child_runs: [],
        parent_run: undefined,
        // inherited properties
        client: this.client,
        project_name: this.projectName,
        reference_example_id: this.exampleId,
        tracingEnabled: true
      });
      runTreeMap[id] = runTree;
      runTreeList.push([id, run.dotted_order]);
    }
    runTreeList.sort((a, b) => {
      if (!a[1] || !b[1]) return 0;
      return a[1].localeCompare(b[1]);
    });
    for (const [id] of runTreeList) {
      const run = this.runMap.get(id);
      const runTree = runTreeMap[id];
      if (!run || !runTree) continue;
      if (run.parent_run_id) {
        const parentRunTree = runTreeMap[run.parent_run_id];
        if (parentRunTree) {
          parentRunTree.child_runs.push(runTree);
          runTree.parent_run = parentRunTree;
        }
      }
    }
    return runTreeMap[id];
  }
  static getTraceableRunTree() {
    try {
      return getCurrentRunTree();
    } catch {
      return undefined;
    }
  }
}

let queue;
/**
 * Creates a queue using the p-queue library. The queue is configured to
 * auto-start and has a concurrency of 1, meaning it will process tasks
 * one at a time.
 */
function createQueue() {
  const PQueue = "default" in _default ? _default.default : _default;
  return new PQueue({
    autoStart: true,
    concurrency: 1
  });
}
/**
 * Consume a promise, either adding it to the queue or waiting for it to resolve
 * @param promiseFn Promise to consume
 * @param wait Whether to wait for the promise to resolve or resolve immediately
 */
async function consumeCallback(promiseFn, wait) {
  if (wait === true) {
    await promiseFn();
  } else {
    if (typeof queue === "undefined") {
      queue = createQueue();
    }
    void queue.add(promiseFn);
  }
}

const isTracingEnabled = tracingEnabled => {
  const envVars = ["LANGSMITH_TRACING_V2", "LANGCHAIN_TRACING_V2", "LANGSMITH_TRACING", "LANGCHAIN_TRACING"];
  return !!envVars.find(envVar => getEnvironmentVariable(envVar) === "true");
};

/**
 * Manage callbacks from different components of LangChain.
 */
class BaseCallbackManager {
  setHandler(handler) {
    return this.setHandlers([handler]);
  }
}
/**
 * Base class for run manager in LangChain.
 */
class BaseRunManager {
  constructor(runId, handlers, inheritableHandlers, tags, inheritableTags, metadata, inheritableMetadata, _parentRunId) {
    Object.defineProperty(this, "runId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: runId
    });
    Object.defineProperty(this, "handlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: handlers
    });
    Object.defineProperty(this, "inheritableHandlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: inheritableHandlers
    });
    Object.defineProperty(this, "tags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: tags
    });
    Object.defineProperty(this, "inheritableTags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: inheritableTags
    });
    Object.defineProperty(this, "metadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: metadata
    });
    Object.defineProperty(this, "inheritableMetadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: inheritableMetadata
    });
    Object.defineProperty(this, "_parentRunId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: _parentRunId
    });
  }
  get parentRunId() {
    return this._parentRunId;
  }
  async handleText(text) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      try {
        await handler.handleText?.(text, this.runId, this._parentRunId, this.tags);
      } catch (err) {
        console.error(`Error in handler ${handler.constructor.name}, handleText: ${err}`);
        if (handler.raiseError) {
          throw err;
        }
      }
    }, handler.awaitHandlers)));
  }
}
/**
 * Manages callbacks for retriever runs.
 */
class CallbackManagerForRetrieverRun extends BaseRunManager {
  getChild(tag) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const manager = new CallbackManager(this.runId);
    manager.setHandlers(this.inheritableHandlers);
    manager.addTags(this.inheritableTags);
    manager.addMetadata(this.inheritableMetadata);
    if (tag) {
      manager.addTags([tag], false);
    }
    return manager;
  }
  async handleRetrieverEnd(documents) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreRetriever) {
        try {
          await handler.handleRetrieverEnd?.(documents, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleRetriever`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleRetrieverError(err) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreRetriever) {
        try {
          await handler.handleRetrieverError?.(err, this.runId, this._parentRunId, this.tags);
        } catch (error) {
          console.error(`Error in handler ${handler.constructor.name}, handleRetrieverError: ${error}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
}
class CallbackManagerForLLMRun extends BaseRunManager {
  async handleLLMNewToken(token, idx, _runId, _parentRunId, _tags, fields) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreLLM) {
        try {
          await handler.handleLLMNewToken?.(token, idx !== null && idx !== void 0 ? idx : {
            prompt: 0,
            completion: 0
          }, this.runId, this._parentRunId, this.tags, fields);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleLLMNewToken: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleLLMError(err) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreLLM) {
        try {
          await handler.handleLLMError?.(err, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleLLMError: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleLLMEnd(output) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreLLM) {
        try {
          await handler.handleLLMEnd?.(output, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleLLMEnd: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
}
class CallbackManagerForChainRun extends BaseRunManager {
  getChild(tag) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const manager = new CallbackManager(this.runId);
    manager.setHandlers(this.inheritableHandlers);
    manager.addTags(this.inheritableTags);
    manager.addMetadata(this.inheritableMetadata);
    if (tag) {
      manager.addTags([tag], false);
    }
    return manager;
  }
  async handleChainError(err, _runId, _parentRunId, _tags, kwargs) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreChain) {
        try {
          await handler.handleChainError?.(err, this.runId, this._parentRunId, this.tags, kwargs);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleChainError: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleChainEnd(output, _runId, _parentRunId, _tags, kwargs) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreChain) {
        try {
          await handler.handleChainEnd?.(output, this.runId, this._parentRunId, this.tags, kwargs);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleChainEnd: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleAgentAction(action) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreAgent) {
        try {
          await handler.handleAgentAction?.(action, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleAgentAction: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
  async handleAgentEnd(action) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreAgent) {
        try {
          await handler.handleAgentEnd?.(action, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleAgentEnd: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
}
class CallbackManagerForToolRun extends BaseRunManager {
  getChild(tag) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const manager = new CallbackManager(this.runId);
    manager.setHandlers(this.inheritableHandlers);
    manager.addTags(this.inheritableTags);
    manager.addMetadata(this.inheritableMetadata);
    if (tag) {
      manager.addTags([tag], false);
    }
    return manager;
  }
  async handleToolError(err) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreAgent) {
        try {
          await handler.handleToolError?.(err, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleToolError: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleToolEnd(output) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreAgent) {
        try {
          await handler.handleToolEnd?.(output, this.runId, this._parentRunId, this.tags);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleToolEnd: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
}
/**
 * @example
 * ```typescript
 * const prompt = PromptTemplate.fromTemplate("What is the answer to {question}?");
 *
 * // Example of using LLMChain with OpenAI and a simple prompt
 * const chain = new LLMChain({
 *   llm: new ChatOpenAI({ temperature: 0.9 }),
 *   prompt,
 * });
 *
 * // Running the chain with a single question
 * const result = await chain.call({
 *   question: "What is the airspeed velocity of an unladen swallow?",
 * });
 * console.log("The answer is:", result);
 * ```
 */
class CallbackManager extends BaseCallbackManager {
  constructor(parentRunId, options) {
    var _options$handlers, _options$inheritableH, _options$tags, _options$inheritableT, _options$metadata, _options$inheritableM;
    super();
    Object.defineProperty(this, "handlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "inheritableHandlers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "tags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "inheritableTags", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "metadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {}
    });
    Object.defineProperty(this, "inheritableMetadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {}
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "callback_manager"
    });
    Object.defineProperty(this, "_parentRunId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.handlers = (_options$handlers = options?.handlers) !== null && _options$handlers !== void 0 ? _options$handlers : this.handlers;
    this.inheritableHandlers = (_options$inheritableH = options?.inheritableHandlers) !== null && _options$inheritableH !== void 0 ? _options$inheritableH : this.inheritableHandlers;
    this.tags = (_options$tags = options?.tags) !== null && _options$tags !== void 0 ? _options$tags : this.tags;
    this.inheritableTags = (_options$inheritableT = options?.inheritableTags) !== null && _options$inheritableT !== void 0 ? _options$inheritableT : this.inheritableTags;
    this.metadata = (_options$metadata = options?.metadata) !== null && _options$metadata !== void 0 ? _options$metadata : this.metadata;
    this.inheritableMetadata = (_options$inheritableM = options?.inheritableMetadata) !== null && _options$inheritableM !== void 0 ? _options$inheritableM : this.inheritableMetadata;
    this._parentRunId = parentRunId;
  }
  /**
   * Gets the parent run ID, if any.
   *
   * @returns The parent run ID.
   */
  getParentRunId() {
    return this._parentRunId;
  }
  async handleLLMStart(llm, prompts, runId = undefined, _parentRunId = undefined, extraParams = undefined, _tags = undefined, _metadata = undefined, runName = undefined) {
    return Promise.all(prompts.map(async (prompt, idx) => {
      // Can't have duplicate runs with the same run ID (if provided)
      const runId_ = idx === 0 && runId ? runId : v4();
      await Promise.all(this.handlers.map(handler => {
        if (handler.ignoreLLM) {
          return;
        }
        if (isBaseTracer(handler)) {
          // Create and add run to the run map.
          // We do this synchronously to avoid race conditions
          // when callbacks are backgrounded.
          handler._createRunForLLMStart(llm, [prompt], runId_, this._parentRunId, extraParams, this.tags, this.metadata, runName);
        }
        return consumeCallback(async () => {
          try {
            await handler.handleLLMStart?.(llm, [prompt], runId_, this._parentRunId, extraParams, this.tags, this.metadata, runName);
          } catch (err) {
            console.error(`Error in handler ${handler.constructor.name}, handleLLMStart: ${err}`);
            if (handler.raiseError) {
              throw err;
            }
          }
        }, handler.awaitHandlers);
      }));
      return new CallbackManagerForLLMRun(runId_, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
    }));
  }
  async handleChatModelStart(llm, messages, runId = undefined, _parentRunId = undefined, extraParams = undefined, _tags = undefined, _metadata = undefined, runName = undefined) {
    return Promise.all(messages.map(async (messageGroup, idx) => {
      // Can't have duplicate runs with the same run ID (if provided)
      const runId_ = idx === 0 && runId ? runId : v4();
      await Promise.all(this.handlers.map(handler => {
        if (handler.ignoreLLM) {
          return;
        }
        if (isBaseTracer(handler)) {
          // Create and add run to the run map.
          // We do this synchronously to avoid race conditions
          // when callbacks are backgrounded.
          handler._createRunForChatModelStart(llm, [messageGroup], runId_, this._parentRunId, extraParams, this.tags, this.metadata, runName);
        }
        return consumeCallback(async () => {
          try {
            if (handler.handleChatModelStart) {
              await handler.handleChatModelStart?.(llm, [messageGroup], runId_, this._parentRunId, extraParams, this.tags, this.metadata, runName);
            } else if (handler.handleLLMStart) {
              const messageString = getBufferString(messageGroup);
              await handler.handleLLMStart?.(llm, [messageString], runId_, this._parentRunId, extraParams, this.tags, this.metadata, runName);
            }
          } catch (err) {
            console.error(`Error in handler ${handler.constructor.name}, handleLLMStart: ${err}`);
            if (handler.raiseError) {
              throw err;
            }
          }
        }, handler.awaitHandlers);
      }));
      return new CallbackManagerForLLMRun(runId_, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
    }));
  }
  async handleChainStart(chain, inputs, runId = v4(), runType = undefined, _tags = undefined, _metadata = undefined, runName = undefined) {
    await Promise.all(this.handlers.map(handler => {
      if (handler.ignoreChain) {
        return;
      }
      if (isBaseTracer(handler)) {
        // Create and add run to the run map.
        // We do this synchronously to avoid race conditions
        // when callbacks are backgrounded.
        handler._createRunForChainStart(chain, inputs, runId, this._parentRunId, this.tags, this.metadata, runType, runName);
      }
      return consumeCallback(async () => {
        try {
          await handler.handleChainStart?.(chain, inputs, runId, this._parentRunId, this.tags, this.metadata, runType, runName);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleChainStart: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }, handler.awaitHandlers);
    }));
    return new CallbackManagerForChainRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
  }
  async handleToolStart(tool, input, runId = v4(), _parentRunId = undefined, _tags = undefined, _metadata = undefined, runName = undefined) {
    await Promise.all(this.handlers.map(handler => {
      if (handler.ignoreAgent) {
        return;
      }
      if (isBaseTracer(handler)) {
        // Create and add run to the run map.
        // We do this synchronously to avoid race conditions
        // when callbacks are backgrounded.
        handler._createRunForToolStart(tool, input, runId, this._parentRunId, this.tags, this.metadata, runName);
      }
      return consumeCallback(async () => {
        try {
          await handler.handleToolStart?.(tool, input, runId, this._parentRunId, this.tags, this.metadata, runName);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleToolStart: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }, handler.awaitHandlers);
    }));
    return new CallbackManagerForToolRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
  }
  async handleRetrieverStart(retriever, query, runId = v4(), _parentRunId = undefined, _tags = undefined, _metadata = undefined, runName = undefined) {
    await Promise.all(this.handlers.map(handler => {
      if (handler.ignoreRetriever) {
        return;
      }
      if (isBaseTracer(handler)) {
        // Create and add run to the run map.
        // We do this synchronously to avoid race conditions
        // when callbacks are backgrounded.
        handler._createRunForRetrieverStart(retriever, query, runId, this._parentRunId, this.tags, this.metadata, runName);
      }
      return consumeCallback(async () => {
        try {
          await handler.handleRetrieverStart?.(retriever, query, runId, this._parentRunId, this.tags, this.metadata, runName);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleRetrieverStart: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }, handler.awaitHandlers);
    }));
    return new CallbackManagerForRetrieverRun(runId, this.handlers, this.inheritableHandlers, this.tags, this.inheritableTags, this.metadata, this.inheritableMetadata, this._parentRunId);
  }
  async handleCustomEvent(eventName,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data, runId, _tags,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _metadata) {
    await Promise.all(this.handlers.map(handler => consumeCallback(async () => {
      if (!handler.ignoreCustomEvent) {
        try {
          await handler.handleCustomEvent?.(eventName, data, runId, this.tags, this.metadata);
        } catch (err) {
          console.error(`Error in handler ${handler.constructor.name}, handleCustomEvent: ${err}`);
          if (handler.raiseError) {
            throw err;
          }
        }
      }
    }, handler.awaitHandlers)));
  }
  addHandler(handler, inherit = true) {
    this.handlers.push(handler);
    if (inherit) {
      this.inheritableHandlers.push(handler);
    }
  }
  removeHandler(handler) {
    this.handlers = this.handlers.filter(_handler => _handler !== handler);
    this.inheritableHandlers = this.inheritableHandlers.filter(_handler => _handler !== handler);
  }
  setHandlers(handlers, inherit = true) {
    this.handlers = [];
    this.inheritableHandlers = [];
    for (const handler of handlers) {
      this.addHandler(handler, inherit);
    }
  }
  addTags(tags, inherit = true) {
    this.removeTags(tags); // Remove duplicates
    this.tags.push(...tags);
    if (inherit) {
      this.inheritableTags.push(...tags);
    }
  }
  removeTags(tags) {
    this.tags = this.tags.filter(tag => !tags.includes(tag));
    this.inheritableTags = this.inheritableTags.filter(tag => !tags.includes(tag));
  }
  addMetadata(metadata, inherit = true) {
    this.metadata = {
      ...this.metadata,
      ...metadata
    };
    if (inherit) {
      this.inheritableMetadata = {
        ...this.inheritableMetadata,
        ...metadata
      };
    }
  }
  removeMetadata(metadata) {
    for (const key of Object.keys(metadata)) {
      delete this.metadata[key];
      delete this.inheritableMetadata[key];
    }
  }
  copy(additionalHandlers = [], inherit = true) {
    const manager = new CallbackManager(this._parentRunId);
    for (const handler of this.handlers) {
      const inheritable = this.inheritableHandlers.includes(handler);
      manager.addHandler(handler, inheritable);
    }
    for (const tag of this.tags) {
      const inheritable = this.inheritableTags.includes(tag);
      manager.addTags([tag], inheritable);
    }
    for (const key of Object.keys(this.metadata)) {
      const inheritable = Object.keys(this.inheritableMetadata).includes(key);
      manager.addMetadata({
        [key]: this.metadata[key]
      }, inheritable);
    }
    for (const handler of additionalHandlers) {
      if (
      // Prevent multiple copies of console_callback_handler
      manager.handlers.filter(h => h.name === "console_callback_handler").some(h => h.name === handler.name)) {
        continue;
      }
      manager.addHandler(handler, inherit);
    }
    return manager;
  }
  static fromHandlers(handlers) {
    class Handler extends BaseCallbackHandler {
      constructor() {
        super();
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: v4()
        });
        Object.assign(this, handlers);
      }
    }
    const manager = new this();
    manager.addHandler(new Handler());
    return manager;
  }
  static async configure(inheritableHandlers, localHandlers, inheritableTags, localTags, inheritableMetadata, localMetadata, options) {
    return this._configureSync(inheritableHandlers, localHandlers, inheritableTags, localTags, inheritableMetadata, localMetadata, options);
  }
  // TODO: Deprecate async method in favor of this one.
  static _configureSync(inheritableHandlers, localHandlers, inheritableTags, localTags, inheritableMetadata, localMetadata, options) {
    var _getEnvironmentVariab;
    let callbackManager;
    if (inheritableHandlers || localHandlers) {
      if (Array.isArray(inheritableHandlers) || !inheritableHandlers) {
        var _inheritableHandlers$;
        callbackManager = new CallbackManager();
        callbackManager.setHandlers((_inheritableHandlers$ = inheritableHandlers?.map(ensureHandler)) !== null && _inheritableHandlers$ !== void 0 ? _inheritableHandlers$ : [], true);
      } else {
        callbackManager = inheritableHandlers;
      }
      callbackManager = callbackManager.copy(Array.isArray(localHandlers) ? localHandlers.map(ensureHandler) : localHandlers?.handlers, false);
    }
    const verboseEnabled = getEnvironmentVariable("LANGCHAIN_VERBOSE") === "true" || options?.verbose;
    const tracingV2Enabled = LangChainTracer.getTraceableRunTree()?.tracingEnabled || isTracingEnabled();
    const tracingEnabled = tracingV2Enabled || ((_getEnvironmentVariab = getEnvironmentVariable("LANGCHAIN_TRACING")) !== null && _getEnvironmentVariab !== void 0 ? _getEnvironmentVariab : false);
    if (verboseEnabled || tracingEnabled) {
      if (!callbackManager) {
        callbackManager = new CallbackManager();
      }
      if (verboseEnabled && !callbackManager.handlers.some(handler => handler.name === ConsoleCallbackHandler.prototype.name)) {
        const consoleHandler = new ConsoleCallbackHandler();
        callbackManager.addHandler(consoleHandler, true);
      }
      if (tracingEnabled && !callbackManager.handlers.some(handler => handler.name === "langchain_tracer")) {
        if (tracingV2Enabled) {
          var _LangChainTracer$getT;
          const tracerV2 = new LangChainTracer();
          callbackManager.addHandler(tracerV2, true);
          // handoff between langchain and langsmith/traceable
          // override the parent run ID
          callbackManager._parentRunId = (_LangChainTracer$getT = LangChainTracer.getTraceableRunTree()?.id) !== null && _LangChainTracer$getT !== void 0 ? _LangChainTracer$getT : callbackManager._parentRunId;
        }
      }
    }
    if (inheritableTags || localTags) {
      if (callbackManager) {
        callbackManager.addTags(inheritableTags !== null && inheritableTags !== void 0 ? inheritableTags : []);
        callbackManager.addTags(localTags !== null && localTags !== void 0 ? localTags : [], false);
      }
    }
    if (inheritableMetadata || localMetadata) {
      if (callbackManager) {
        callbackManager.addMetadata(inheritableMetadata !== null && inheritableMetadata !== void 0 ? inheritableMetadata : {});
        callbackManager.addMetadata(localMetadata !== null && localMetadata !== void 0 ? localMetadata : {}, false);
      }
    }
    return callbackManager;
  }
}
function ensureHandler(handler) {
  if ("name" in handler) {
    return handler;
  }
  return BaseCallbackHandler.fromMethods(handler);
}

function isPromiseMethod(x) {
  if (x === "then" || x === "catch" || x === "finally") {
    return true;
  }
  return false;
}
function isKVMap(x) {
  if (typeof x !== "object" || x == null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(x);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in x) && !(Symbol.iterator in x);
}
const isAsyncIterable = x => x != null && typeof x === "object" &&
// eslint-disable-next-line @typescript-eslint/no-explicit-any
typeof x[Symbol.asyncIterator] === "function";
const isIteratorLike = x => x != null && typeof x === "object" && "next" in x && typeof x.next === "function";
const GeneratorFunction = function* () {}.constructor;
const isGenerator = x =>
// eslint-disable-next-line no-instanceof/no-instanceof
x != null && typeof x === "function" && x instanceof GeneratorFunction;
const isThenable = x => x != null && typeof x === "object" && "then" in x && typeof x.then === "function";
const isReadableStream = x => x != null && typeof x === "object" && "getReader" in x && typeof x.getReader === "function";

AsyncLocalStorageProviderSingleton.initializeGlobalInstance(new AsyncLocalStorage());
const handleRunInputs = rawInputs => {
  const firstInput = rawInputs[0];
  if (firstInput == null) {
    return {};
  }
  if (rawInputs.length > 1) {
    return {
      args: rawInputs
    };
  }
  if (isKVMap(firstInput)) {
    return firstInput;
  }
  return {
    input: firstInput
  };
};
const handleRunOutputs = rawOutputs => {
  if (isKVMap(rawOutputs)) {
    return rawOutputs;
  }
  return {
    outputs: rawOutputs
  };
};
const getTracingRunTree = (runTree, inputs, getInvocationParams) => {
  if (!isTracingEnabled$1(runTree.tracingEnabled)) {
    return undefined;
  }
  runTree.inputs = handleRunInputs(inputs);
  const invocationParams = getInvocationParams?.(...inputs);
  if (invocationParams != null) {
    var _runTree$extra;
    (_runTree$extra = runTree.extra) !== null && _runTree$extra !== void 0 ? _runTree$extra : runTree.extra = {};
    runTree.extra.metadata = {
      ...invocationParams,
      ...runTree.extra.metadata
    };
  }
  return runTree;
};
// idea: store the state of the promise outside
// but only when the promise is "consumed"
const getSerializablePromise = arg => {
  const proxyState = {
    current: undefined
  };
  const promiseProxy = new Proxy(arg, {
    get(target, prop, receiver) {
      if (prop === "then") {
        const boundThen = arg[prop].bind(arg);
        return (resolve, reject = x => {
          throw x;
        }) => {
          return boundThen(value => {
            proxyState.current = ["resolve", value];
            return resolve(value);
          }, error => {
            proxyState.current = ["reject", error];
            return reject(error);
          });
        };
      }
      if (prop === "catch") {
        const boundCatch = arg[prop].bind(arg);
        return reject => {
          return boundCatch(error => {
            proxyState.current = ["reject", error];
            return reject(error);
          });
        };
      }
      if (prop === "toJSON") {
        return () => {
          var _proxyState$current;
          if (!proxyState.current) return undefined;
          const [type, value] = (_proxyState$current = proxyState.current) !== null && _proxyState$current !== void 0 ? _proxyState$current : [];
          if (type === "resolve") return value;
          return {
            error: value
          };
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  return promiseProxy;
};
const convertSerializableArg = arg => {
  if (isReadableStream(arg)) {
    const proxyState = [];
    const transform = new TransformStream({
      start: () => void 0,
      transform: (chunk, controller) => {
        proxyState.push(chunk);
        controller.enqueue(chunk);
      },
      flush: () => void 0
    });
    const pipeThrough = arg.pipeThrough(transform);
    Object.assign(pipeThrough, {
      toJSON: () => proxyState
    });
    return pipeThrough;
  }
  if (isAsyncIterable(arg)) {
    const proxyState = {
      current: []
    };
    return new Proxy(arg, {
      get(target, prop, receiver) {
        if (prop === Symbol.asyncIterator) {
          return () => {
            const boundIterator = arg[Symbol.asyncIterator].bind(arg);
            const iterator = boundIterator();
            return new Proxy(iterator, {
              get(target, prop, receiver) {
                if (prop === "next" || prop === "return" || prop === "throw") {
                  const bound = iterator.next.bind(iterator);
                  return (...args) => {
                    // @ts-expect-error TS cannot infer the argument types for the bound function
                    const wrapped = getSerializablePromise(bound(...args));
                    proxyState.current.push(wrapped);
                    return wrapped;
                  };
                }
                if (prop === "return" || prop === "throw") {
                  return iterator.next.bind(iterator);
                }
                return Reflect.get(target, prop, receiver);
              }
            });
          };
        }
        if (prop === "toJSON") {
          return () => {
            const onlyNexts = proxyState.current;
            const serialized = onlyNexts.map(next => next.toJSON());
            const chunks = serialized.reduce((memo, next) => {
              if (next?.value) memo.push(next.value);
              return memo;
            }, []);
            return chunks;
          };
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }
  if (!Array.isArray(arg) && isIteratorLike(arg)) {
    const proxyState = [];
    return new Proxy(arg, {
      get(target, prop, receiver) {
        if (prop === "next" || prop === "return" || prop === "throw") {
          const bound = arg[prop]?.bind(arg);
          return (...args) => {
            // @ts-expect-error TS cannot infer the argument types for the bound function
            const next = bound?.(...args);
            if (next != null) proxyState.push(next);
            return next;
          };
        }
        if (prop === "toJSON") {
          return () => {
            const chunks = proxyState.reduce((memo, next) => {
              if (next.value) memo.push(next.value);
              return memo;
            }, []);
            return chunks;
          };
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }
  if (isThenable(arg)) {
    return getSerializablePromise(arg);
  }
  return arg;
};
/**
 * Higher-order function that takes function as input and returns a
 * "TraceableFunction" - a wrapped version of the input that
 * automatically handles tracing. If the returned traceable function calls any
 * traceable functions, those are automatically traced as well.
 *
 * The returned TraceableFunction can accept a run tree or run tree config as
 * its first argument. If omitted, it will default to the caller's run tree,
 * or will be treated as a root run.
 *
 * @param wrappedFunc Targeted function to be traced
 * @param config Additional metadata such as name, tags or providing
 *     a custom LangSmith client instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function traceable(wrappedFunc, config) {
  const {
    aggregator,
    argsConfigPath,
    ...runTreeConfig
  } = config !== null && config !== void 0 ? config : {};
  const traceableFunc = (...args) => {
    let ensuredConfig;
    try {
      var _runTreeConfig$tags, _runtimeConfig$tags;
      let runtimeConfig;
      if (argsConfigPath) {
        const [index, path] = argsConfigPath;
        if (index === args.length - 1 && !path) {
          runtimeConfig = args.pop();
        } else if (index <= args.length && typeof args[index] === "object" && args[index] !== null) {
          if (path) {
            const {
              [path]: extracted,
              ...rest
            } = args[index];
            runtimeConfig = extracted;
            args[index] = rest;
          } else {
            runtimeConfig = args[index];
            args.splice(index, 1);
          }
        }
      }
      ensuredConfig = {
        name: wrappedFunc.name || "<lambda>",
        ...runTreeConfig,
        ...runtimeConfig,
        tags: [...new Set([...((_runTreeConfig$tags = runTreeConfig?.tags) !== null && _runTreeConfig$tags !== void 0 ? _runTreeConfig$tags : []), ...((_runtimeConfig$tags = runtimeConfig?.tags) !== null && _runtimeConfig$tags !== void 0 ? _runtimeConfig$tags : [])])],
        metadata: {
          ...runTreeConfig?.metadata,
          ...runtimeConfig?.metadata
        }
      };
    } catch (err) {
      var _runTreeConfig$name;
      console.warn(`Failed to extract runtime config from args for ${(_runTreeConfig$name = runTreeConfig?.name) !== null && _runTreeConfig$name !== void 0 ? _runTreeConfig$name : wrappedFunc.name}`, err);
      ensuredConfig = {
        name: wrappedFunc.name || "<lambda>",
        ...runTreeConfig
      };
    }
    const asyncLocalStorage = AsyncLocalStorageProviderSingleton.getInstance();
    // TODO: deal with possible nested promises and async iterables
    const processedArgs = args;
    for (let i = 0; i < processedArgs.length; i++) {
      processedArgs[i] = convertSerializableArg(processedArgs[i]);
    }
    const [currentRunTree, rawInputs] = (() => {
      const [firstArg, ...restArgs] = processedArgs;
      // used for handoff between LangChain.JS and traceable functions
      if (isRunnableConfigLike(firstArg)) {
        return [getTracingRunTree(RunTree.fromRunnableConfig(firstArg, ensuredConfig), restArgs, config?.getInvocationParams), restArgs];
      }
      // deprecated: legacy CallbackManagerRunTree used in runOnDataset
      // override ALS and do not pass-through the run tree
      if (isRunTree(firstArg) && "callbackManager" in firstArg && firstArg.callbackManager != null) {
        return [firstArg, restArgs];
      }
      // when ALS is unreliable, users can manually
      // pass in the run tree
      if (firstArg === ROOT || isRunTree(firstArg)) {
        const currentRunTree = getTracingRunTree(firstArg === ROOT ? new RunTree(ensuredConfig) : firstArg.createChild(ensuredConfig), restArgs, config?.getInvocationParams);
        return [currentRunTree, [currentRunTree, ...restArgs]];
      }
      // Node.JS uses AsyncLocalStorage (ALS) and AsyncResource
      // to allow storing context
      const prevRunFromStore = asyncLocalStorage.getStore();
      if (prevRunFromStore) {
        return [getTracingRunTree(prevRunFromStore.createChild(ensuredConfig), processedArgs, config?.getInvocationParams), processedArgs];
      }
      const currentRunTree = getTracingRunTree(new RunTree(ensuredConfig), processedArgs, config?.getInvocationParams);
      return [currentRunTree, processedArgs];
    })();
    return asyncLocalStorage.run(currentRunTree, () => {
      const postRunPromise = currentRunTree?.postRun();
      async function handleChunks(chunks) {
        if (aggregator !== undefined) {
          try {
            return await aggregator(chunks);
          } catch (e) {
            console.error(`[ERROR]: LangSmith aggregation failed: `, e);
          }
        }
        return chunks;
      }
      async function* wrapAsyncIteratorForTracing(iterator, snapshot) {
        let finished = false;
        const chunks = [];
        try {
          while (true) {
            const {
              value,
              done
            } = await (snapshot ? snapshot(() => iterator.next()) : iterator.next());
            if (done) {
              finished = true;
              break;
            }
            chunks.push(value);
            yield value;
          }
        } catch (e) {
          await currentRunTree?.end(undefined, String(e));
          throw e;
        } finally {
          if (!finished) await currentRunTree?.end(undefined, "Cancelled");
          await currentRunTree?.end(handleRunOutputs(await handleChunks(chunks)));
          await handleEnd();
        }
      }
      function wrapAsyncGeneratorForTracing(iterable, snapshot) {
        const iterator = iterable[Symbol.asyncIterator]();
        const wrappedIterator = wrapAsyncIteratorForTracing(iterator, snapshot);
        iterable[Symbol.asyncIterator] = () => wrappedIterator;
        return iterable;
      }
      async function handleEnd() {
        const onEnd = config?.on_end;
        if (onEnd) {
          if (!currentRunTree) {
            console.warn("Can not call 'on_end' if currentRunTree is undefined");
          } else {
            onEnd(currentRunTree);
          }
        }
        await postRunPromise;
        await currentRunTree?.patchRun();
      }
      function gatherAll(iterator) {
        const chunks = [];
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const next = iterator.next();
          chunks.push(next);
          if (next.done) break;
        }
        return chunks;
      }
      let returnValue;
      try {
        returnValue = wrappedFunc(...rawInputs);
      } catch (err) {
        returnValue = Promise.reject(err);
      }
      if (isAsyncIterable(returnValue)) {
        const snapshot = AsyncLocalStorage.snapshot();
        return wrapAsyncGeneratorForTracing(returnValue, snapshot);
      }
      const tracedPromise = new Promise((resolve, reject) => {
        Promise.resolve(returnValue).then(async rawOutput => {
          if (isAsyncIterable(rawOutput)) {
            const snapshot = AsyncLocalStorage.snapshot();
            return resolve(wrapAsyncGeneratorForTracing(rawOutput, snapshot));
          }
          if (isGenerator(wrappedFunc) && isIteratorLike(rawOutput)) {
            const chunks = gatherAll(rawOutput);
            await currentRunTree?.end(handleRunOutputs(await handleChunks(chunks.reduce((memo, {
              value,
              done
            }) => {
              if (!done || typeof value !== "undefined") {
                memo.push(value);
              }
              return memo;
            }, []))));
            await handleEnd();
            return function* () {
              for (const ret of chunks) {
                if (ret.done) return ret.value;
                yield ret.value;
              }
            }();
          }
          try {
            await currentRunTree?.end(handleRunOutputs(rawOutput));
            await handleEnd();
          } finally {
            // eslint-disable-next-line no-unsafe-finally
            return rawOutput;
          }
        }, async error => {
          await currentRunTree?.end(undefined, String(error));
          await handleEnd();
          throw error;
        }).then(resolve, reject);
      });
      if (typeof returnValue !== "object" || returnValue === null) {
        return tracedPromise;
      }
      return new Proxy(returnValue, {
        get(target, prop, receiver) {
          if (isPromiseMethod(prop)) {
            return tracedPromise[prop].bind(tracedPromise);
          }
          return Reflect.get(target, prop, receiver);
        }
      });
    });
  };
  Object.defineProperty(traceableFunc, "langsmith:traceable", {
    value: runTreeConfig
  });
  return traceableFunc;
}

/**
 * Converts the current run tree active within a traceable-wrapped function
 * into a LangChain compatible callback manager. This is useful to handoff tracing
 * from LangSmith to LangChain Runnables and LLMs.
 *
 * @param {RunTree | undefined} currentRunTree Current RunTree from within a traceable-wrapped function. If not provided, the current run tree will be inferred from AsyncLocalStorage.
 * @returns {CallbackManager | undefined} Callback manager used by LangChain Runnable objects.
 */
async function getLangchainCallbacks(currentRunTree) {
  const runTree = getCurrentRunTree();
  if (!runTree) return undefined;
  // TODO: CallbackManager.configure() is only async due to LangChainTracer
  // factory being unnecessarily async.
  let callbacks = await CallbackManager.configure();
  if (!callbacks && runTree.tracingEnabled) {
    callbacks = new CallbackManager();
  }
  let langChainTracer = callbacks?.handlers.find(handler => handler?.name === "langchain_tracer");
  if (!langChainTracer && runTree.tracingEnabled) {
    langChainTracer = new LangChainTracer();
    callbacks?.addHandler(langChainTracer);
  }
  const runMap = new Map();
  // find upward root run
  let rootRun = runTree;
  const rootVisited = new Set();
  while (rootRun.parent_run) {
    if (rootVisited.has(rootRun.id)) break;
    rootVisited.add(rootRun.id);
    rootRun = rootRun.parent_run;
  }
  const queue = [rootRun];
  const visited = new Set();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);
    runMap.set(current.id, current);
    if (current.child_runs) {
      queue.push(...current.child_runs);
    }
  }
  if (callbacks != null) {
    Object.assign(callbacks, {
      _parentRunId: runTree.id
    });
  }
  if (langChainTracer != null) {
    if ("updateFromRunTree" in langChainTracer && typeof langChainTracer === "function") {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore @langchain/core can use a different version of LangSmith
      langChainTracer.updateFromRunTree(runTree);
    } else {
      Object.assign(langChainTracer, {
        runMap,
        client: runTree.client,
        projectName: runTree.project_name || langChainTracer.projectName,
        exampleId: runTree.reference_example_id || langChainTracer.exampleId
      });
    }
  }
  return callbacks;
}

async function importChildProcess() {
  const {
    exec
  } = await import('child_process');
  return {
    exec
  };
}
const execGit = (command, exec) => {
  return new Promise(resolve => {
    exec(`git ${command.join(" ")}`, (error, stdout) => {
      if (error) {
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });
};
const getGitInfo = async (remote = "origin") => {
  let exec;
  try {
    const execImport = await importChildProcess();
    exec = execImport.exec;
  } catch (e) {
    // no-op
    return null;
  }
  const isInsideWorkTree = await execGit(["rev-parse", "--is-inside-work-tree"], exec);
  if (!isInsideWorkTree) {
    return null;
  }
  const [remoteUrl, commit, commitTime, branch, tags, dirty, authorName, authorEmail] = await Promise.all([execGit(["remote", "get-url", remote], exec), execGit(["rev-parse", "HEAD"], exec), execGit(["log", "-1", "--format=%ct"], exec), execGit(["rev-parse", "--abbrev-ref", "HEAD"], exec), execGit(["describe", "--tags", "--exact-match", "--always", "--dirty"], exec), execGit(["status", "--porcelain"], exec).then(output => output !== ""), execGit(["log", "-1", "--format=%an"], exec), execGit(["log", "-1", "--format=%ae"], exec)]);
  return {
    remoteUrl,
    commit,
    commitTime,
    branch,
    tags,
    dirty,
    authorName,
    authorEmail
  };
};
const getDefaultRevisionId = async () => {
  let exec;
  try {
    const execImport = await importChildProcess();
    exec = execImport.exec;
  } catch (e) {
    // no-op
    return null;
  }
  const commit = await execGit(["rev-parse", "HEAD"], exec);
  if (!commit) {
    return null;
  }
  return commit;
};

function atee(iter, length = 2) {
  const buffers = Array.from({
    length
  }, () => []);
  return buffers.map(async function* makeIter(buffer) {
    while (true) {
      if (buffer.length === 0) {
        const result = await iter.next();
        for (const buffer of buffers) {
          buffer.push(result);
        }
      } else if (buffer[0].done) {
        return;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        yield buffer.shift().value;
      }
    }
  });
}

function getErrorStackTrace(e) {
  if (typeof e !== "object" || e == null) return undefined;
  if (!("stack" in e) || typeof e.stack !== "string") return undefined;
  let stack = e.stack;
  const prevLine = `${e}`;
  if (stack.startsWith(prevLine)) {
    stack = stack.slice(prevLine.length);
  }
  if (stack.startsWith("\n")) {
    stack = stack.slice(1);
  }
  return stack;
}
function printErrorStackTrace(e) {
  const stack = getErrorStackTrace(e);
  if (stack == null) return;
  console.error(stack);
}

const adjectives = ["abandoned", "aching", "advanced", "ample", "artistic", "back", "best", "bold", "brief", "clear", "cold", "complicated", "cooked", "crazy", "crushing", "damp", "dear", "definite", "dependable", "diligent", "drab", "earnest", "elderly", "enchanted", "essential", "excellent", "extraneous", "fixed", "flowery", "formal", "fresh", "frosty", "giving", "glossy", "healthy", "helpful", "impressionable", "kind", "large", "left", "long", "loyal", "mealy", "memorable", "monthly", "new", "notable", "only", "ordinary", "passionate", "perfect", "pertinent", "proper", "puzzled", "reflecting", "respectful", "roasted", "scholarly", "shiny", "slight", "sparkling", "spotless", "stupendous", "sunny", "tart", "terrific", "timely", "unique", "upbeat", "vacant", "virtual", "warm", "weary", "whispered", "worthwhile", "yellow"];
const nouns = ["account", "acknowledgment", "address", "advertising", "airplane", "animal", "appointment", "arrival", "artist", "attachment", "attitude", "availability", "backpack", "bag", "balance", "bass", "bean", "beauty", "bibliography", "bill", "bite", "blossom", "boat", "book", "box", "boy", "bread", "bridge", "broccoli", "building", "butter", "button", "cabbage", "cake", "camera", "camp", "candle", "candy", "canvas", "car", "card", "carrot", "cart", "case", "cat", "chain", "chair", "chalk", "chance", "change", "channel", "character", "charge", "charm", "chart", "check", "cheek", "cheese", "chef", "cherry", "chicken", "child", "church", "circle", "class", "clay", "click", "clock", "cloth", "cloud", "clove", "club", "coach", "coal", "coast", "coat", "cod", "coffee", "collar", "color", "comb", "comfort", "comic", "committee", "community", "company", "comparison", "competition", "condition", "connection", "control", "cook", "copper", "copy", "corn", "cough", "country", "cover", "crate", "crayon", "cream", "creator", "crew", "crown", "current", "curtain", "curve", "cushion", "dad", "daughter", "day", "death", "debt", "decision", "deer", "degree", "design", "desire", "desk", "detail", "development", "digestion", "dime", "dinner", "direction", "dirt", "discovery", "discussion", "disease", "disgust", "distance", "distribution", "division", "doctor", "dog", "door", "drain", "drawer", "dress", "drink", "driving", "dust", "ear", "earth", "edge", "education", "effect", "egg", "end", "energy", "engine", "error", "event", "example", "exchange", "existence", "expansion", "experience", "expert", "eye", "face", "fact", "fall", "family", "farm", "father", "fear", "feeling", "field", "finger", "fire", "fish", "flag", "flight", "floor", "flower", "fold", "food", "football", "force", "form", "frame", "friend", "frog", "fruit", "fuel", "furniture", "game", "garden", "gate", "girl", "glass", "glove", "goat", "gold", "government", "grade", "grain", "grass", "green", "grip", "group", "growth", "guide", "guitar", "hair", "hall", "hand", "harbor", "harmony", "hat", "head", "health", "heart", "heat", "hill", "history", "hobbies", "hole", "hope", "horn", "horse", "hospital", "hour", "house", "humor", "idea", "impulse", "income", "increase", "industry", "ink", "insect", "instrument", "insurance", "interest", "invention", "iron", "island", "jelly", "jet", "jewel", "join", "judge", "juice", "jump", "kettle", "key", "kick", "kiss", "kitten", "knee", "knife", "knowledge", "land", "language", "laugh", "law", "lead", "learning", "leather", "leg", "lettuce", "level", "library", "lift", "light", "limit", "line", "linen", "lip", "liquid", "list", "look", "loss", "love", "lunch", "machine", "man", "manager", "map", "marble", "mark", "market", "mass", "match", "meal", "measure", "meat", "meeting", "memory", "metal", "middle", "milk", "mind", "mine", "minute", "mist", "mitten", "mom", "money", "monkey", "month", "moon", "morning", "mother", "motion", "mountain", "mouth", "muscle", "music", "nail", "name", "nation", "neck", "need", "news", "night", "noise", "note", "number", "nut", "observation", "offer", "oil", "operation", "opinion", "orange", "order", "organization", "ornament", "oven", "page", "pail", "pain", "paint", "pan", "pancake", "paper", "parcel", "parent", "part", "passenger", "paste", "payment", "peace", "pear", "pen", "pencil", "person", "pest", "pet", "picture", "pie", "pin", "pipe", "pizza", "place", "plane", "plant", "plastic", "plate", "play", "pleasure", "plot", "plough", "pocket", "point", "poison", "police", "pollution", "popcorn", "porter", "position", "pot", "potato", "powder", "power", "price", "print", "process", "produce", "product", "profit", "property", "prose", "protest", "pull", "pump", "punishment", "purpose", "push", "quarter", "question", "quiet", "quill", "quilt", "quince", "rabbit", "rail", "rain", "range", "rat", "rate", "ray", "reaction", "reading", "reason", "record", "regret", "relation", "religion", "representative", "request", "respect", "rest", "reward", "rhythm", "rice", "river", "road", "roll", "room", "root", "rose", "route", "rub", "rule", "run", "sack", "sail", "salt", "sand", "scale", "scarecrow", "scarf", "scene", "scent", "school", "science", "scissors", "screw", "sea", "seat", "secretary", "seed", "selection", "self", "sense", "servant", "shade", "shake", "shame", "shape", "sheep", "sheet", "shelf", "ship", "shirt", "shock", "shoe", "shop", "show", "side", "sign", "silk", "sink", "sister", "size", "sky", "sleep", "smash", "smell", "smile", "smoke", "snail", "snake", "sneeze", "snow", "soap", "society", "sock", "soda", "sofa", "son", "song", "sort", "sound", "soup", "space", "spark", "speed", "sponge", "spoon", "spray", "spring", "spy", "square", "stamp", "star", "start", "statement", "station", "steam", "steel", "stem", "step", "stew", "stick", "stitch", "stocking", "stomach", "stone", "stop", "store", "story", "stove", "stranger", "straw", "stream", "street", "stretch", "string", "structure", "substance", "sugar", "suggestion", "suit", "summer", "sun", "support", "surprise", "sweater", "swim", "system", "table", "tail", "talk", "tank", "taste", "tax", "tea", "teaching", "team", "tendency", "test", "texture", "theory", "thing", "thought", "thread", "throat", "thumb", "thunder", "ticket", "time", "tin", "title", "toad", "toe", "tooth", "toothpaste", "touch", "town", "toy", "trade", "train", "transport", "tray", "treatment", "tree", "trick", "trip", "trouble", "trousers", "truck", "tub", "turkey", "turn", "twist", "umbrella", "uncle", "underwear", "unit", "use", "vacation", "value", "van", "vase", "vegetable", "veil", "vein", "verse", "vessel", "view", "visitor", "voice", "volcano", "walk", "wall", "war", "wash", "waste", "watch", "water", "wave", "wax", "way", "wealth", "weather", "week", "weight", "wheel", "whip", "whistle", "window", "wine", "wing", "winter", "wire", "wish", "woman", "wood", "wool", "word", "work", "worm", "wound", "wrist", "writer", "yard", "yoke", "zebra", "zinc", "zipper", "zone"];
/**
 * Generate a random name.
 * @returns {string} A random name.
 */
function randomName() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}-${noun}-${number}`;
}

/**
 * Wraps an evaluator function + implements the RunEvaluator interface.
 */
class DynamicRunEvaluator {
  constructor(evaluator) {
    Object.defineProperty(this, "func", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.func = input => {
      const {
        run,
        example
      } = input.langSmithRunAndExample;
      return evaluator(run, example);
    };
  }
  isEvaluationResults(x) {
    return typeof x === "object" && x != null && "results" in x && Array.isArray(x.results) && x.results.length > 0;
  }
  coerceEvaluationResults(results, sourceRunId) {
    if (this.isEvaluationResults(results)) {
      return {
        results: results.results.map(r => this.coerceEvaluationResult(r, sourceRunId, false))
      };
    }
    return this.coerceEvaluationResult(results, sourceRunId, true);
  }
  coerceEvaluationResult(result, sourceRunId, allowNoKey = false) {
    if ("key" in result) {
      if (!result.sourceRunId) {
        result.sourceRunId = sourceRunId;
      }
      return result;
    }
    if (!("key" in result)) {
      if (allowNoKey) {
        result["key"] = this.func.name;
      }
    }
    return {
      sourceRunId,
      ...result
    };
  }
  /**
   * Evaluates a run with an optional example and returns the evaluation result.
   * @param run The run to evaluate.
   * @param example The optional example to use for evaluation.
   * @returns A promise that extracts to the evaluation result.
   */
  async evaluateRun(run, example, options) {
    const sourceRunId = v4$1();
    const metadata = {
      targetRunId: run.id
    };
    if ("session_id" in run) {
      metadata["experiment"] = run.session_id;
    }
    if (typeof this.func !== "function") {
      throw new Error("Target must be runnable function");
    }
    const wrappedTraceableFunc = traceable(this.func, {
      project_name: "evaluators",
      name: "evaluator",
      id: sourceRunId,
      ...options
    });
    const result = await wrappedTraceableFunc(
    // Pass data via `langSmithRunAndExample` key to avoid conflicts with other
    // inputs. This key is extracted in the wrapped function, with `run` and
    // `example` passed to evaluator function as arguments.
    {
      langSmithRunAndExample: {
        run,
        example
      }
    }, {
      metadata
    });
    // Check the one required property of EvaluationResult since 'instanceof' is not possible
    if ("key" in result) {
      if (!result.sourceRunId) {
        result.sourceRunId = sourceRunId;
      }
      return result;
    }
    if (typeof result !== "object") {
      throw new Error("Evaluator function must return an object.");
    }
    return this.coerceEvaluationResults(result, sourceRunId);
  }
}
function runEvaluator(func) {
  return new DynamicRunEvaluator(func);
}

function evaluate(
/**
 * The target system or function to evaluate.
 */
target, options) {
  return _evaluate(target, options);
}
/**
 * Manage the execution of experiments.
 *
 * Supports lazily running predictions and evaluations in parallel to facilitate
 * result streaming and early debugging.
 */
class _ExperimentManager {
  get experimentName() {
    if (this._experimentName) {
      return this._experimentName;
    } else {
      throw new Error("Experiment name not provided, and experiment not yet started.");
    }
  }
  async getExamples() {
    if (!this._examples) {
      if (!this._data) {
        throw new Error("Data not provided in this experiment.");
      }
      const unresolvedData = _resolveData(this._data, {
        client: this.client
      });
      if (!this._examples) {
        this._examples = [];
      }
      const exs = [];
      for await (const example of unresolvedData) {
        exs.push(example);
      }
      if (this._numRepetitions && this._numRepetitions > 0) {
        const repeatedExamples = [];
        for (let i = 0; i < this._numRepetitions; i++) {
          repeatedExamples.push(...exs);
        }
        this.setExamples(repeatedExamples);
      } else {
        this.setExamples(exs);
      }
    }
    return this._examples;
  }
  setExamples(examples) {
    this._examples = examples;
  }
  get datasetId() {
    return this.getExamples().then(examples => {
      if (examples.length === 0) {
        throw new Error("No examples found in the dataset.");
      }
      if (this._experiment && this._experiment.reference_dataset_id) {
        return this._experiment.reference_dataset_id;
      }
      return examples[0].dataset_id;
    });
  }
  get evaluationResults() {
    if (this._evaluationResults === undefined) {
      return async function* () {
        for (const _ of await this.getExamples()) {
          yield {
            results: []
          };
        }
      }.call(this);
    } else {
      return this._evaluationResults;
    }
  }
  get runs() {
    if (this._runsArray && this._runsArray.length > 0) {
      throw new Error("Runs already provided as an array.");
    }
    if (this._runs === undefined) {
      throw new Error("Runs not provided in this experiment. Please predict first.");
    } else {
      return this._runs;
    }
  }
  constructor(args) {
    var _args$client;
    Object.defineProperty(this, "_data", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_runs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_evaluationResults", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_summaryResults", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_examples", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_numRepetitions", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_runsArray", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "client", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_experiment", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_experimentName", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_metadata", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_description", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.client = (_args$client = args.client) !== null && _args$client !== void 0 ? _args$client : new Client();
    if (!args.experiment) {
      this._experimentName = randomName();
    } else if (typeof args.experiment === "string") {
      this._experimentName = `${args.experiment}-${v4$1().slice(0, 8)}`;
    } else {
      if (!args.experiment.name) {
        throw new Error("Experiment must have a name");
      }
      this._experimentName = args.experiment.name;
      this._experiment = args.experiment;
    }
    let metadata = args.metadata || {};
    if (!("revision_id" in metadata)) {
      metadata = {
        revision_id: getLangChainEnvVarsMetadata().revision_id,
        ...metadata
      };
    }
    this._metadata = metadata;
    if (args.examples && args.examples.length) {
      this.setExamples(args.examples);
    }
    this._data = args.data;
    if (args._runsArray && args._runsArray.length) {
      this._runsArray = args._runsArray;
    }
    this._runs = args.runs;
    this._evaluationResults = args.evaluationResults;
    this._summaryResults = args.summaryResults;
    this._numRepetitions = args.numRepetitions;
  }
  _getExperiment() {
    if (!this._experiment) {
      throw new Error("Experiment not yet started.");
    }
    return this._experiment;
  }
  async _getExperimentMetadata() {
    var _this$_metadata;
    let projectMetadata = (_this$_metadata = this._metadata) !== null && _this$_metadata !== void 0 ? _this$_metadata : {};
    const gitInfo = await getGitInfo();
    if (gitInfo) {
      projectMetadata = {
        ...projectMetadata,
        git: gitInfo
      };
    }
    if (this._experiment) {
      const experimentMetadata = this._experiment.extra && "metadata" in this._experiment.extra ? this._experiment.extra.metadata : {};
      projectMetadata = {
        ...experimentMetadata,
        ...projectMetadata
      };
    }
    return projectMetadata;
  }
  async _getProject(firstExample) {
    let project;
    if (!this._experiment) {
      try {
        const projectMetadata = await this._getExperimentMetadata();
        project = await this.client.createProject({
          projectName: this.experimentName,
          referenceDatasetId: firstExample.dataset_id,
          metadata: projectMetadata,
          description: this._description
        });
        this._experiment = project;
      } catch (e) {
        if (String(e).includes("already exists")) {
          throw e;
        }
        throw new Error(`Experiment ${this._experimentName} already exists. Please use a different name.`);
      }
    } else {
      project = this._experiment;
    }
    return project;
  }
  async _printExperimentStart() {
    console.log(`Starting evaluation of experiment: ${this.experimentName}`);
    const firstExample = this._examples?.[0];
    const datasetId = firstExample?.dataset_id;
    if (!datasetId || !this._experiment) return;
    const datasetUrl = await this.client.getDatasetUrl({
      datasetId
    });
    const compareUrl = `${datasetUrl}/compare?selectedSessions=${this._experiment.id}`;
    console.log(`View results at ${compareUrl}`);
  }
  async start() {
    const examples = await this.getExamples();
    const firstExample = examples[0];
    const project = await this._getProject(firstExample);
    await this._printExperimentStart();
    this._metadata["num_repetitions"] = this._numRepetitions;
    return new _ExperimentManager({
      examples,
      experiment: project,
      metadata: this._metadata,
      client: this.client,
      evaluationResults: this._evaluationResults,
      summaryResults: this._summaryResults
    });
  }
  async withPredictions(target, options) {
    const experimentResults = this._predict(target, options);
    return new _ExperimentManager({
      examples: await this.getExamples(),
      experiment: this._experiment,
      metadata: this._metadata,
      client: this.client,
      runs: async function* () {
        for await (const pred of experimentResults) {
          yield pred.run;
        }
      }()
    });
  }
  async withEvaluators(evaluators, options) {
    const resolvedEvaluators = _resolveEvaluators(evaluators);
    const experimentResults = this._score(resolvedEvaluators, options);
    const [r1, r2] = atee(experimentResults);
    return new _ExperimentManager({
      examples: await this.getExamples(),
      experiment: this._experiment,
      metadata: this._metadata,
      client: this.client,
      runs: async function* () {
        for await (const result of r1) {
          yield result.run;
        }
      }(),
      evaluationResults: async function* () {
        for await (const result of r2) {
          yield result.evaluationResults;
        }
      }(),
      summaryResults: this._summaryResults
    });
  }
  async withSummaryEvaluators(summaryEvaluators) {
    const aggregateFeedbackGen = this._applySummaryEvaluators(summaryEvaluators);
    return new _ExperimentManager({
      examples: await this.getExamples(),
      experiment: this._experiment,
      metadata: this._metadata,
      client: this.client,
      runs: this.runs,
      _runsArray: this._runsArray,
      evaluationResults: this._evaluationResults,
      summaryResults: aggregateFeedbackGen
    });
  }
  async *getResults() {
    const examples = await this.getExamples();
    const evaluationResults = [];
    if (!this._runsArray) {
      this._runsArray = [];
      for await (const run of this.runs) {
        this._runsArray.push(run);
      }
    }
    for await (const evaluationResult of this.evaluationResults) {
      evaluationResults.push(evaluationResult);
    }
    for (let i = 0; i < this._runsArray.length; i++) {
      yield {
        run: this._runsArray[i],
        example: examples[i],
        evaluationResults: evaluationResults[i]
      };
    }
  }
  async getSummaryScores() {
    if (!this._summaryResults) {
      return {
        results: []
      };
    }
    const results = [];
    for await (const evaluationResultsGenerator of this._summaryResults) {
      if (typeof evaluationResultsGenerator === "function") {
        // This is because runs array is not available until after this generator
        // is set, so we need to pass it like so.
        for await (const evaluationResults of evaluationResultsGenerator((_this$_runsArray = this._runsArray) !== null && _this$_runsArray !== void 0 ? _this$_runsArray : [])) {
          var _this$_runsArray;
          results.push(...evaluationResults.results);
        }
      }
    }
    return {
      results
    };
  }
  // Private methods
  /**
   * Run the target function or runnable on the examples.
   * @param {TargetT} target The target function or runnable to evaluate.
   * @param options
   * @returns {AsyncGenerator<_ForwardResults>} An async generator of the results.
   */
  async *_predict(target, options) {
    var _options$maxConcurren;
    const maxConcurrency = (_options$maxConcurren = options?.maxConcurrency) !== null && _options$maxConcurren !== void 0 ? _options$maxConcurren : 0;
    const examples = await this.getExamples();
    if (maxConcurrency === 0) {
      for (const example of examples) {
        yield await _forward(target, example, this.experimentName, this._metadata, this.client);
      }
    } else {
      const caller = new AsyncCaller({
        maxConcurrency
      });
      const futures = [];
      for await (const example of examples) {
        futures.push(caller.call(_forward, target, example, this.experimentName, this._metadata, this.client));
      }
      for await (const future of futures) {
        yield future;
      }
    }
    // Close out the project.
    await this._end();
  }
  async _runEvaluators(evaluators, currentResults, fields) {
    const {
      run,
      example,
      evaluationResults
    } = currentResults;
    for (const evaluator of evaluators) {
      try {
        const options = {
          reference_example_id: example.id,
          project_name: "evaluators",
          metadata: {
            example_version: example.modified_at ? new Date(example.modified_at).toISOString() : new Date(example.created_at).toISOString()
          },
          client: fields.client
        };
        const evaluatorResponse = await evaluator.evaluateRun(run, example, options);
        evaluationResults.results.push(...(await fields.client.logEvaluationFeedback(evaluatorResponse, run)));
      } catch (e) {
        console.error(`Error running evaluator ${evaluator.evaluateRun.name} on run ${run.id}: ${e}`);
        printErrorStackTrace(e);
      }
    }
    return {
      run,
      example,
      evaluationResults
    };
  }
  /**
   * Run the evaluators on the prediction stream.
   * Expects runs to be available in the manager.
   * (e.g. from a previous prediction step)
   * @param {Array<RunEvaluator>} evaluators
   * @param {number} maxConcurrency
   */
  async *_score(evaluators, options) {
    const {
      maxConcurrency = 0
    } = options || {};
    if (maxConcurrency === 0) {
      for await (const currentResults of this.getResults()) {
        yield this._runEvaluators(evaluators, currentResults, {
          client: this.client
        });
      }
    } else {
      const caller = new AsyncCaller({
        maxConcurrency
      });
      const futures = [];
      for await (const currentResults of this.getResults()) {
        futures.push(caller.call(this._runEvaluators, evaluators, currentResults, {
          client: this.client
        }));
      }
      for (const result of futures) {
        yield result;
      }
    }
  }
  async *_applySummaryEvaluators(summaryEvaluators) {
    const projectId = this._getExperiment().id;
    const examples = await this.getExamples();
    const options = Array.from({
      length: summaryEvaluators.length
    }).map(() => ({
      project_name: "evaluators",
      experiment: this.experimentName,
      projectId: projectId
    }));
    const wrappedEvaluators = await wrapSummaryEvaluators(summaryEvaluators, options);
    yield async function* (runsArray) {
      const aggregateFeedback = [];
      for (const evaluator of wrappedEvaluators) {
        try {
          const summaryEvalResult = await evaluator(runsArray, examples);
          const flattenedResults = this.client._selectEvalResults(summaryEvalResult);
          aggregateFeedback.push(...flattenedResults);
          for (const result of flattenedResults) {
            const {
              targetRunId,
              ...feedback
            } = result;
            const evaluatorInfo = feedback.evaluatorInfo;
            delete feedback.evaluatorInfo;
            await this.client.createFeedback(null, "key", {
              ...feedback,
              projectId: projectId,
              sourceInfo: evaluatorInfo
            });
          }
        } catch (e) {
          console.error(`Error running summary evaluator ${evaluator.name}: ${JSON.stringify(e, null, 2)}`);
          printErrorStackTrace(e);
        }
      }
      yield {
        results: aggregateFeedback
      };
    }.bind(this);
  }
  async _getDatasetVersion() {
    const examples = await this.getExamples();
    const modifiedAt = examples.map(ex => ex.modified_at);
    // Python might return microseconds, which we need
    // to account for when comparing dates.
    const modifiedAtTime = modifiedAt.map(date => {
      function getMiliseconds(isoString) {
        const time = isoString.split("T").at(1);
        if (!time) return "";
        const regex = /[0-9]{2}:[0-9]{2}:[0-9]{2}.([0-9]+)/;
        const strMiliseconds = time.match(regex)?.[1];
        return strMiliseconds !== null && strMiliseconds !== void 0 ? strMiliseconds : "";
      }
      const jsDate = new Date(date);
      let source = getMiliseconds(date);
      let parsed = getMiliseconds(jsDate.toISOString());
      const length = Math.max(source.length, parsed.length);
      source = source.padEnd(length, "0");
      parsed = parsed.padEnd(length, "0");
      const microseconds = (Number.parseInt(source, 10) - Number.parseInt(parsed, 10)) / 1000;
      const time = jsDate.getTime() + microseconds;
      return {
        date,
        time
      };
    });
    if (modifiedAtTime.length === 0) return undefined;
    return modifiedAtTime.reduce((max, current) => current.time > max.time ? current : max, modifiedAtTime[0]).date;
  }
  async _getDatasetSplits() {
    const examples = await this.getExamples();
    const allSplits = examples.reduce((acc, ex) => {
      if (ex.metadata && ex.metadata.dataset_split) {
        if (Array.isArray(ex.metadata.dataset_split)) {
          ex.metadata.dataset_split.forEach(split => acc.add(split));
        } else if (typeof ex.metadata.dataset_split === "string") {
          acc.add(ex.metadata.dataset_split);
        }
      }
      return acc;
    }, new Set());
    return allSplits.size ? Array.from(allSplits) : undefined;
  }
  async _end() {
    const experiment = this._experiment;
    if (!experiment) {
      throw new Error("Experiment not yet started.");
    }
    const projectMetadata = await this._getExperimentMetadata();
    projectMetadata["dataset_version"] = await this._getDatasetVersion();
    projectMetadata["dataset_splits"] = await this._getDatasetSplits();
    // Update revision_id if not already set
    if (!projectMetadata["revision_id"]) {
      projectMetadata["revision_id"] = await getDefaultRevisionId();
    }
    await this.client.updateProject(experiment.id, {
      endTime: new Date().toISOString(),
      metadata: projectMetadata
    });
  }
}
/**
 * Represents the results of an evaluate() call.
 * This class provides an iterator interface to iterate over the experiment results
 * as they become available. It also provides methods to access the experiment name,
 * the number of results, and to wait for the results to be processed.
 */
class ExperimentResults {
  constructor(experimentManager) {
    Object.defineProperty(this, "manager", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "results", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "processedCount", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "summaryResults", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.manager = experimentManager;
  }
  get experimentName() {
    return this.manager.experimentName;
  }
  [Symbol.asyncIterator]() {
    return this;
  }
  async next() {
    if (this.processedCount < this.results.length) {
      const result = this.results[this.processedCount];
      this.processedCount++;
      return Promise.resolve({
        value: result,
        done: false
      });
    } else {
      return Promise.resolve({
        value: undefined,
        done: true
      });
    }
  }
  async processData(manager) {
    for await (const item of manager.getResults()) {
      this.results.push(item);
      this.processedCount++;
    }
    this.summaryResults = await manager.getSummaryScores();
  }
  get length() {
    return this.results.length;
  }
}
async function _evaluate(target, fields) {
  var _fields$client, _fields$experiment, _fields$numRepetition;
  const client = (_fields$client = fields.client) !== null && _fields$client !== void 0 ? _fields$client : new Client();
  const runs = _isCallable(target) ? null : target;
  const [experiment_, newRuns] = await _resolveExperiment((_fields$experiment = fields.experiment) !== null && _fields$experiment !== void 0 ? _fields$experiment : null, runs, client);
  let manager = await new _ExperimentManager({
    data: Array.isArray(fields.data) ? undefined : fields.data,
    examples: Array.isArray(fields.data) ? fields.data : undefined,
    client,
    metadata: fields.metadata,
    experiment: experiment_ !== null && experiment_ !== void 0 ? experiment_ : fields.experimentPrefix,
    runs: newRuns !== null && newRuns !== void 0 ? newRuns : undefined,
    numRepetitions: (_fields$numRepetition = fields.numRepetitions) !== null && _fields$numRepetition !== void 0 ? _fields$numRepetition : 1
  }).start();
  if (_isCallable(target)) {
    manager = await manager.withPredictions(target, {
      maxConcurrency: fields.maxConcurrency
    });
  }
  if (fields.evaluators) {
    manager = await manager.withEvaluators(fields.evaluators, {
      maxConcurrency: fields.maxConcurrency
    });
  }
  if (fields.summaryEvaluators) {
    manager = await manager.withSummaryEvaluators(fields.summaryEvaluators);
  }
  // Start consuming the results.
  const results = new ExperimentResults(manager);
  await results.processData(manager);
  return results;
}
async function _forward(fn, example, experimentName, metadata, client) {
  let run = null;
  const _getRun = r => {
    run = r;
  };
  const options = {
    reference_example_id: example.id,
    on_end: _getRun,
    project_name: experimentName,
    metadata: {
      ...metadata,
      example_version: example.modified_at ? new Date(example.modified_at).toISOString() : new Date(example.created_at).toISOString()
    },
    client,
    tracingEnabled: true
  };
  const wrappedFn = "invoke" in fn ? traceable(async inputs => {
    const callbacks = await getLangchainCallbacks();
    return fn.invoke(inputs, {
      callbacks
    });
  }, options) : traceable(fn, options);
  try {
    await wrappedFn(example.inputs);
  } catch (e) {
    console.error(`Error running target function: ${e}`);
    printErrorStackTrace(e);
  }
  if (!run) {
    throw new Error(`Run not created by target function.
This is most likely due to tracing not being enabled.\n
Try setting "LANGCHAIN_TRACING_V2=true" in your environment.`);
  }
  return {
    run,
    example
  };
}
function _resolveData(data, options) {
  let isUUID = false;
  try {
    if (typeof data === "string") {
      assertUuid(data);
      isUUID = true;
    }
  } catch (_) {
    isUUID = false;
  }
  if (typeof data === "string" && isUUID) {
    return options.client.listExamples({
      datasetId: data
    });
  }
  if (typeof data === "string") {
    return options.client.listExamples({
      datasetName: data
    });
  }
  return data;
}
async function wrapSummaryEvaluators(evaluators, optionsArray) {
  async function _wrap(evaluator) {
    const evalName = evaluator.name || "BatchEvaluator";
    const wrapperInner = (runs, examples) => {
      const wrapperSuperInner = traceable((_runs_, _examples_) => {
        return Promise.resolve(evaluator(runs, examples));
      }, {
        ...optionsArray,
        name: evalName
      });
      return Promise.resolve(wrapperSuperInner(`Runs[] (Length=${runs.length})`, `Examples[] (Length=${examples.length})`));
    };
    return wrapperInner;
  }
  const results = [];
  for (let i = 0; i < evaluators.length; i++) {
    results.push(await _wrap(evaluators[i]));
  }
  return results;
}
function _resolveEvaluators(evaluators) {
  const results = [];
  for (const evaluator of evaluators) {
    if ("evaluateRun" in evaluator) {
      results.push(evaluator);
      // todo fix this by porting LangChainStringEvaluator to langsmith sdk
    } else if (evaluator.name === "LangChainStringEvaluator") {
      throw new Error("Not yet implemented");
    } else {
      results.push(runEvaluator(evaluator));
    }
  }
  return results;
}
async function _resolveExperiment(experiment, runs, client) {
  // TODO: Remove this, handle outside the manager
  if (experiment !== null) {
    if (!experiment.name) {
      throw new Error("Experiment name must be defined if provided.");
    }
    return [experiment, undefined];
  }
  // If we have runs, that means the experiment was already started.
  if (runs !== null) {
    const results = [];
    for await (const item of atee(runs)) {
      results.push(item);
    }
    const [runsClone, runsOriginal] = results;
    const runsCloneIterator = runsClone[Symbol.asyncIterator]();
    // todo: this is `any`. does it work properly?
    const firstRun = await runsCloneIterator.next().then(result => result.value);
    const retrievedExperiment = await client.readProject(firstRun.sessionId);
    if (!retrievedExperiment.name) {
      throw new Error("Experiment name not found for provided runs.");
    }
    return [retrievedExperiment, runsOriginal];
  }
  return [undefined, undefined];
}
function _isCallable(target) {
  return Boolean(typeof target === "function" || "invoke" in target && typeof target.invoke === "function");
}

// TODO: switch to the following before going to production.
// const showLogs = process.env.DEBUG;

const globalConsole = typeof window !== 'undefined' ? window.console : console;
var log = {
  info: globalConsole.info.bind(globalConsole) ,
  warn: globalConsole.warn.bind(globalConsole) ,
  error: globalConsole.error.bind(globalConsole) 
};

// TODO: extract all this to a JSON configuration file
const ChatModelService = {
  WPCOM_JETPACK_AI: 'wpcom-jetpack-ai',
  WPCOM_OPENAI: 'wpcom-openai',
  // the wpcom OpenAI proxy
  OPENAI: 'openai',
  GROQ: 'groq',
  OLLAMA: 'ollama',
  LMSTUDIO: 'lmstudio',
  LOCALAI: 'localai',
  getAvailable: () => {
    const services = [ChatModelService.WPCOM_JETPACK_AI, ChatModelService.WPCOM_OPENAI, ChatModelService.OLLAMA, ChatModelService.LMSTUDIO, ChatModelService.LOCALAI, ChatModelService.OPENAI, ChatModelService.GROQ];
    return services;
  },
  getDefault: () => {
    return ChatModelService.OPENAI;
  },
  getDefaultApiKey: service => {
    if (service === ChatModelService.GROQ && typeof process !== 'undefined') {
      return process.env.GROQ_API_KEY;
    } else if (service === ChatModelService.OPENAI && typeof process !== 'undefined') {
      return process.env.OPENAI_API_KEY;
    }
    return null;
  }
};
const ChatModelType = {
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_4O: 'gpt-4o',
  LLAMA3_70B_8192: 'llama3-70b-8192',
  LLAMA3_70B_8192_WPCOM: 'llama3-70b',
  GEMMA_7b_INSTRUCT: 'gemma:7b-instruct-q5_K_M',
  PHI_3_MEDIUM: 'legraphista/Phi-3-medium-128k-instruct-IMat-GGUF',
  MISTRAL_03: 'mistral-0.3',
  HERMES_2_PRO_MISTRAL: 'hermes-2-pro-mistral',
  isMultimodal: model => model === ChatModelType.GPT_4O,
  supportsToolMessages: model => [ChatModelType.GPT_4O, ChatModelType.GPT_4_TURBO, ChatModelType.GPT_4O_MINI, ChatModelType.LLAMA3_70B_8192, ChatModelType.MISTRAL_03, ChatModelType.HERMES_2_PRO_MISTRAL].includes(model),
  getAvailable: service => {
    if (service === ChatModelService.GROQ) {
      return [ChatModelType.LLAMA3_70B_8192];
    } else if ([ChatModelService.WPCOM_JETPACK_AI, ChatModelService.WPCOM_OPENAI].includes(service)) {
      return [ChatModelType.GPT_4O, ChatModelType.GPT_4_TURBO, ChatModelType.GPT_4O_MINI, ChatModelType.LLAMA3_70B_8192_WPCOM];
    } else if (service === ChatModelService.OLLAMA) {
      // TODO: obtain dynamically
      return [ChatModelType.GEMMA_7b_INSTRUCT];
    } else if (service === ChatModelService.LOCALAI) {
      // TODO: obtain dynamically
      return [ChatModelType.MISTRAL_03, ChatModelType.HERMES_2_PRO_MISTRAL];
    } else if (service === ChatModelService.LMSTUDIO) {
      return [ChatModelType.PHI_3_MEDIUM];
    }
    return [ChatModelType.GPT_4O_MINI, ChatModelType.GPT_4_TURBO, ChatModelType.GPT_4O];
  },
  getDefault(service = null) {
    if (!service) {
      service = ChatModelService.getDefault();
    }
    if (service === ChatModelService.GROQ) {
      return ChatModelType.LLAMA3_70B_8192;
    } else if ([ChatModelService.WPCOM_JETPACK_AI, ChatModelService.WPCOM_OPENAI, ChatModelService.OPENAI].includes(service)) {
      return ChatModelType.GPT_4O;
    } else if (service === ChatModelService.OLLAMA) {
      return ChatModelType.GEMMA_7b_INSTRUCT;
    } else if (service === ChatModelService.LOCALAI) {
      return ChatModelType.HERMES_2_PRO_MISTRAL;
    }
    return ChatModelType.GPT_4O;
  }
};

// reformat the message history based on what the model supports
const formatMessagesForModel = (messages, model) => {
  const maxImageURLLength = 200; // typically they are base64-encoded so very large
  const isMultimodal = ChatModelType.isMultimodal(model);
  const supportsToolMessages = ChatModelType.supportsToolMessages(model);

  // if it's not multimodal, convert any multipart "content" properties to a simple string containing a list of image URLs.
  if (!isMultimodal) {
    messages = messages.map(message => {
      if (message.content && Array.isArray(message.content)) {
        const text = message.content.filter(content => content.type === 'text').map(content => content.text).join('\n');
        const imageUrls = message.content.filter(content => content.type === 'image_url').map(content => content.image_url.substring(0, maxImageURLLength)).join('\n');
        message.content = [text, imageUrls].join('\n');
      }
      return message;
    });
  }
  if (!supportsToolMessages) {
    console.warn('remapping history', messages);
    messages = messages.map(message => {
      if (message.role === 'tool') {
        return {
          ...message,
          role: 'user'
        };
      }
      return message;
    });
    console.warn('remapped history', messages);
  }

  // JSON-serialize any tool call arguments in messages[X].tool_calls[Y].function.arguments
  messages = messages.map(message => {
    if (message.tool_calls) {
      return {
        ...message,
        tool_calls: message.tool_calls.map(tool_call => {
          if (typeof tool_call.function.arguments !== 'string') {
            tool_call.function.arguments = JSON.stringify(tool_call.function.arguments);
          }
          return tool_call;
        })
      };
    }
    return message;
  });
  return messages;
};
const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant.';
function formatMessages(history, instructions, additionalInstructions, maxHistoryLength, model) {
  const trimmedMessages = history.slice(-maxHistoryLength);
  const firstNonToolMessageIndex = trimmedMessages.findIndex(message => message.role !== 'tool');
  if (firstNonToolMessageIndex > 0) {
    trimmedMessages.splice(0, firstNonToolMessageIndex);
  }
  const messages = [{
    role: 'system',
    content: instructions
  }, ...formatMessagesForModel(trimmedMessages, model)];
  if (additionalInstructions) {
    messages.push({
      role: 'system',
      content: additionalInstructions
    });
  }
  return messages;
}
class ChatModel {
  constructor({
    apiKey,
    feature,
    sessionId
  }) {
    this.apiKey = apiKey;
    this.feature = feature;
    this.sessionId = sessionId;
    this.abortController = null;
  }
  getApiKey() {
    return this.apiKey;
  }

  /**
   * A higher level call to the chat completions API. This method formats the history, sets defaults,
   * calls the API, and returns the assistant response message.
   *
   * @param {Object}        params                        The parameters for the API call
   * @param {string}        params.model                  The model to use
   * @param {Array<Object>} params.messages               The history of messages (OpenAI Chat Completion format)
   * @param {Array<Object>} params.tools                  The tools to use (Swagger/JSONSchema format)
   * @param {string}        params.instructions           The system prompt
   * @param {string}        params.additionalInstructions The agent loop prompt
   * @param {number}        params.temperature            The temperature to use
   * @param {number}        params.maxTokens              The maximum number of tokens to generate
   * @param {Array<string>} params.tags                   The tags to use
   * @return {Promise<Object>} The response message
   */
  async run({
    model,
    messages,
    tools,
    instructions,
    additionalInstructions,
    temperature,
    maxTokens,
    tags
  }) {
    var _model, _temperature;
    if (!messages || !messages.length) {
      throw new Error('Missing history');
    }
    model = (_model = model) !== null && _model !== void 0 ? _model : this.getDefaultModel();
    messages = formatMessages(messages, instructions !== null && instructions !== void 0 ? instructions : DEFAULT_SYSTEM_PROMPT, additionalInstructions, this.maxHistoryLength, model);
    temperature = (_temperature = temperature) !== null && _temperature !== void 0 ? _temperature : this.getDefaultTemperature(model);
    const max_tokens = maxTokens !== null && maxTokens !== void 0 ? maxTokens : this.getDefaultMaxTokens(model);
    const invokeChatModel = traceable(this.call.bind(this), {
      run_type: 'llm',
      name: 'chat_completion',
      tags,
      metadata: {
        ls_model_name: model,
        ls_provider: this.service,
        ls_temperature: temperature,
        ls_max_tokens: max_tokens,
        ls_model_type: 'llm'
      }
    });
    const response = await invokeChatModel({
      model,
      temperature,
      max_tokens,
      messages,
      tools
    });
    const choice = response.choices[0];
    if (choice.finish_reason === 'tool_calls') ; else if (choice.finish_reason === 'length') {
      throw new Error('Finish reason length not implemented');
    } else if (choice.finish_reason === 'content_filter') {
      throw new Error('Finish reason content_filter not implemented');
    } else if (choice.finish_reason === 'stop') ;
    return choice.message;
  }

  /**
   * A direct Chat Completions call. Simply makes the call and checks for HTTP errors.
   * @see https://platform.openai.com/docs/api-reference/chat/create
   *
   * @param {Object}        request             The request object
   * @param {string}        request.model       The model to use
   * @param {number}        request.temperature The temperature to use
   * @param {number}        request.max_tokens  The maximum number of tokens to generate
   * @param {Array<Object>} request.messages    The messages to use
   * @param {Array<Object>} request.tools       The tools to use
   * @param {string}        request.tool_choice The tool to use
   *
   * @return {Promise<Object>} The response object
   */
  async call(request) {
    const params = this.getParams(request);
    const headers = this.getHeaders();
    this.abortController = new AbortController();
    log.info(`🤖 Calling ${this.constructor.name} with model ${params.model}, temperature ${params.temperature}, max_tokens ${params.max_tokens}`);
    const serviceRequest = await fetch(this.getServiceUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal: this.abortController.signal
    });
    if (serviceRequest.status === 401) {
      throw new Error('Unauthorized');
    } else if (serviceRequest.status === 429) {
      throw new Error('Rate limit exceeded');
    } else if (serviceRequest.status === 500) {
      const responseText = await serviceRequest.text();
      throw new Error(`Internal server error: ${responseText}`);
    }
    let response;
    try {
      response = await serviceRequest.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      }
      console.error('Error parsing response', error);
      throw new Error('Unexpected response format');
    } finally {
      this.abortController = null;
    }

    // if response.code is set and response.choices is not, assume it's an error
    if (response.code && !response.choices) {
      var _response$message;
      throw new Error(`${response.code} ${(_response$message = response.message) !== null && _response$message !== void 0 ? _response$message : ''}`);
    }
    if (response.error) {
      console.error('Chat Model Error', response.error, params);
      throw new Error(`${response.error.type}: ${response.error.message}`);
    }
    if (!response?.choices || response?.choices.length > 1) {
      console.error('Invalid response from server, unexpected number of choices', response, response?.choices);
      throw new Error('Invalid response from server');
    }
    return response;
  }
  abortRequest() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
  getParams({
    model,
    temperature,
    max_tokens,
    messages,
    tools,
    tool_choice = null
  }) {
    const params = {
      stream: false,
      model,
      temperature,
      messages,
      max_tokens
    };
    if (tools?.length) {
      params.tools = tools;
    }
    if (tool_choice) {
      params.tool_choice = {
        type: 'function',
        function: {
          name: tool_choice
        }
      };
    }
    return params;
  }
  getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  getDefaultMaxTokens( /* model */
  ) {
    return 4096;
  }
  getDefaultTemperature( /* model */
  ) {
    return 0.2;
  }
  getDefaultModel() {
    throw new Error('Not implemented');
  }
  getServiceUrl() {
    throw new Error('Not implemented');
  }
  static getInstance(service, apiKey, feature, sessionId) {
    const params = {
      apiKey,
      feature,
      sessionId
    };
    switch (service) {
      case ChatModelService.GROQ:
        return new GroqChatModel(params);
      case ChatModelService.OPENAI:
        return new OpenAIChatModel(params);
      case ChatModelService.WPCOM_JETPACK_AI:
        return new WPCOMJetpackAIChatModel(params);
      case ChatModelService.WPCOM_OPENAI:
        return new WPCOMOpenAIChatModel(params);
      case ChatModelService.OLLAMA:
        return new OllamaChatModel(params);
      case ChatModelService.LMSTUDIO:
        return new LMStudioChatModel(params);
      case ChatModelService.LOCALAI:
        return new LocalAIChatModel(params);
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }
}
class WPCOMJetpackAIChatModel extends ChatModel {
  getDefaultModel() {
    return ChatModelType.GPT_4O;
  }
  getParams(request) {
    const params = super.getParams(request);
    if (this.feature) {
      params.feature = this.feature;
    }
    if (this.sessionId) {
      params.session_id = this.sessionId;
    }
    return params;
  }
  getServiceUrl() {
    return 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query';
  }
}
class WPCOMOpenAIChatModel extends ChatModel {
  getHeaders() {
    const headers = super.getHeaders();
    if (this.feature) {
      headers['X-WPCOM-AI-Feature'] = this.feature;
      headers['Access-Control-Request-Headers'] = 'authorization,content-type,X-WPCOM-AI-Feature';
    }
    if (this.sessionId) {
      headers['X-WPCOM-Session-ID'] = this.sessionId;
    }
    return headers;
  }
  getDefaultModel() {
    return ChatModelType.GPT_4O;
  }
  getServiceUrl() {
    return 'https://public-api.wordpress.com/wpcom/v2/openai-proxy/v1/chat/completions';
  }
}
class OllamaChatModel extends ChatModel {
  getDefaultModel() {
    return ChatModelType.GEMMA_7b_INSTRUCT;
  }
  getServiceUrl() {
    return 'http://localhost:11434/api/chat';
  }
}
class LMStudioChatModel extends ChatModel {
  getDefaultModel() {
    return ChatModelType.PHI_3_MEDIUM;
  }
  getServiceUrl() {
    return 'http://localhost:1234/v1/chat/completions';
  }
}
class LocalAIChatModel extends ChatModel {
  getDefaultModel() {
    return ChatModelType.HERMES_2_PRO_MISTRAL;
  }
  getServiceUrl() {
    return 'http://localhost:1234/v1/chat/completions';
  }
}
class OpenAIChatModel extends ChatModel {
  getDefaultModel() {
    return ChatModelType.GPT_4O;
  }
  getServiceUrl() {
    return 'https://api.openai.com/v1/chat/completions';
  }
}
class GroqChatModel extends ChatModel {
  getDefaultModel() {
    return ChatModelType.LLAMA3_70B_8192;
  }
  getDefaultTemperature() {
    return 0.1;
  }
  getDefaultMaxTokens() {
    return 8192;
  }
  getServiceUrl() {
    return 'https://api.groq.com/openai/v1/chat/completions';
  }
}

var main$1 = {exports: {}};

var name = "dotenv";
var version$1 = "16.4.5";
var description = "Loads environment variables from .env file";
var main = "lib/main.js";
var types = "lib/main.d.ts";
var exports = {
	".": {
		types: "./lib/main.d.ts",
		require: "./lib/main.js",
		"default": "./lib/main.js"
	},
	"./config": "./config.js",
	"./config.js": "./config.js",
	"./lib/env-options": "./lib/env-options.js",
	"./lib/env-options.js": "./lib/env-options.js",
	"./lib/cli-options": "./lib/cli-options.js",
	"./lib/cli-options.js": "./lib/cli-options.js",
	"./package.json": "./package.json"
};
var scripts = {
	"dts-check": "tsc --project tests/types/tsconfig.json",
	lint: "standard",
	"lint-readme": "standard-markdown",
	pretest: "npm run lint && npm run dts-check",
	test: "tap tests/*.js --100 -Rspec",
	"test:coverage": "tap --coverage-report=lcov",
	prerelease: "npm test",
	release: "standard-version"
};
var repository = {
	type: "git",
	url: "git://github.com/motdotla/dotenv.git"
};
var funding = "https://dotenvx.com";
var keywords = [
	"dotenv",
	"env",
	".env",
	"environment",
	"variables",
	"config",
	"settings"
];
var readmeFilename = "README.md";
var license = "BSD-2-Clause";
var devDependencies = {
	"@definitelytyped/dtslint": "^0.0.133",
	"@types/node": "^18.11.3",
	decache: "^4.6.1",
	sinon: "^14.0.1",
	standard: "^17.0.0",
	"standard-markdown": "^7.1.0",
	"standard-version": "^9.5.0",
	tap: "^16.3.0",
	tar: "^6.1.11",
	typescript: "^4.8.4"
};
var engines = {
	node: ">=12"
};
var browser = {
	fs: false
};
var require$$4 = {
	name: name,
	version: version$1,
	description: description,
	main: main,
	types: types,
	exports: exports,
	scripts: scripts,
	repository: repository,
	funding: funding,
	keywords: keywords,
	readmeFilename: readmeFilename,
	license: license,
	devDependencies: devDependencies,
	engines: engines,
	browser: browser
};

const fs = require$$0;
const path = path$1;
const os = require$$2;
const crypto$1 = require$$3;
const packageJson = require$$4;
const version = packageJson.version;
const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;

// Parse src into an Object
function parse(src) {
  const obj = {};

  // Convert buffer to string
  let lines = src.toString();

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n');
  let match;
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1];

    // Default undefined or null to empty string
    let value = match[2] || '';

    // Remove whitespace
    value = value.trim();

    // Check if double quoted
    const maybeQuote = value[0];

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2');

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n');
      value = value.replace(/\\r/g, '\r');
    }

    // Add to object
    obj[key] = value;
  }
  return obj;
}
function _parseVault(options) {
  const vaultPath = _vaultPath(options);

  // Parse .env.vault
  const result = DotenvModule.configDotenv({
    path: vaultPath
  });
  if (!result.parsed) {
    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
    err.code = 'MISSING_DATA';
    throw err;
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
  const keys = _dotenvKey(options).split(',');
  const length = keys.length;
  let decrypted;
  for (let i = 0; i < length; i++) {
    try {
      // Get full key
      const key = keys[i].trim();

      // Get instructions for decrypt
      const attrs = _instructions(result, key);

      // Decrypt
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
      break;
    } catch (error) {
      // last key
      if (i + 1 >= length) {
        throw error;
      }
      // try next key
    }
  }

  // Parse decrypted .env string
  return DotenvModule.parse(decrypted);
}
function _log(message) {
  console.log(`[dotenv@${version}][INFO] ${message}`);
}
function _warn(message) {
  console.log(`[dotenv@${version}][WARN] ${message}`);
}
function _debug(message) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`);
}
function _dotenvKey(options) {
  // prioritize developer directly setting options.DOTENV_KEY
  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
    return options.DOTENV_KEY;
  }

  // secondary infra already contains a DOTENV_KEY environment variable
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY;
  }

  // fallback to empty string
  return '';
}
function _instructions(result, dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  let uri;
  try {
    uri = new URL(dotenvKey);
  } catch (error) {
    if (error.code === 'ERR_INVALID_URL') {
      const err = new Error('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development');
      err.code = 'INVALID_DOTENV_KEY';
      throw err;
    }
    throw error;
  }

  // Get decrypt key
  const key = uri.password;
  if (!key) {
    const err = new Error('INVALID_DOTENV_KEY: Missing key part');
    err.code = 'INVALID_DOTENV_KEY';
    throw err;
  }

  // Get environment
  const environment = uri.searchParams.get('environment');
  if (!environment) {
    const err = new Error('INVALID_DOTENV_KEY: Missing environment part');
    err.code = 'INVALID_DOTENV_KEY';
    throw err;
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
  const ciphertext = result.parsed[environmentKey]; // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
    err.code = 'NOT_FOUND_DOTENV_ENVIRONMENT';
    throw err;
  }
  return {
    ciphertext,
    key
  };
}
function _vaultPath(options) {
  let possibleVaultPath = null;
  if (options && options.path && options.path.length > 0) {
    if (Array.isArray(options.path)) {
      for (const filepath of options.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`;
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`;
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), '.env.vault');
  }
  if (fs.existsSync(possibleVaultPath)) {
    return possibleVaultPath;
  }
  return null;
}
function _resolveHome(envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath;
}
function _configVault(options) {
  _log('Loading env from encrypted .env.vault');
  const parsed = DotenvModule._parseVault(options);
  let processEnv = process.env;
  if (options && options.processEnv != null) {
    processEnv = options.processEnv;
  }
  DotenvModule.populate(processEnv, parsed, options);
  return {
    parsed
  };
}
function configDotenv(options) {
  const dotenvPath = path.resolve(process.cwd(), '.env');
  let encoding = 'utf8';
  const debug = Boolean(options && options.debug);
  if (options && options.encoding) {
    encoding = options.encoding;
  } else {
    if (debug) {
      _debug('No encoding is specified. UTF-8 is used by default');
    }
  }
  let optionPaths = [dotenvPath]; // default, look for .env
  if (options && options.path) {
    if (!Array.isArray(options.path)) {
      optionPaths = [_resolveHome(options.path)];
    } else {
      optionPaths = []; // reset default
      for (const filepath of options.path) {
        optionPaths.push(_resolveHome(filepath));
      }
    }
  }

  // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
  // parsed data, we will combine it with process.env (or options.processEnv if provided).
  let lastError;
  const parsedAll = {};
  for (const path of optionPaths) {
    try {
      // Specifying an encoding returns a string instead of a buffer
      const parsed = DotenvModule.parse(fs.readFileSync(path, {
        encoding
      }));
      DotenvModule.populate(parsedAll, parsed, options);
    } catch (e) {
      if (debug) {
        _debug(`Failed to load ${path} ${e.message}`);
      }
      lastError = e;
    }
  }
  let processEnv = process.env;
  if (options && options.processEnv != null) {
    processEnv = options.processEnv;
  }
  DotenvModule.populate(processEnv, parsedAll, options);
  if (lastError) {
    return {
      parsed: parsedAll,
      error: lastError
    };
  } else {
    return {
      parsed: parsedAll
    };
  }
}

// Populates process.env from .env file
function config(options) {
  // fallback to original dotenv if DOTENV_KEY is not set
  if (_dotenvKey(options).length === 0) {
    return DotenvModule.configDotenv(options);
  }
  const vaultPath = _vaultPath(options);

  // dotenvKey exists but .env.vault file does not exist
  if (!vaultPath) {
    _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
    return DotenvModule.configDotenv(options);
  }
  return DotenvModule._configVault(options);
}
function decrypt(encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), 'hex');
  let ciphertext = Buffer.from(encrypted, 'base64');
  const nonce = ciphertext.subarray(0, 12);
  const authTag = ciphertext.subarray(-16);
  ciphertext = ciphertext.subarray(12, -16);
  try {
    const aesgcm = crypto$1.createDecipheriv('aes-256-gcm', key, nonce);
    aesgcm.setAuthTag(authTag);
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
  } catch (error) {
    const isRange = error instanceof RangeError;
    const invalidKeyLength = error.message === 'Invalid key length';
    const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data';
    if (isRange || invalidKeyLength) {
      const err = new Error('INVALID_DOTENV_KEY: It must be 64 characters long (or more)');
      err.code = 'INVALID_DOTENV_KEY';
      throw err;
    } else if (decryptionFailed) {
      const err = new Error('DECRYPTION_FAILED: Please check your DOTENV_KEY');
      err.code = 'DECRYPTION_FAILED';
      throw err;
    } else {
      throw error;
    }
  }
}

// Populate process.env with parsed values
function populate(processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug);
  const override = Boolean(options && options.override);
  if (typeof parsed !== 'object') {
    const err = new Error('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate');
    err.code = 'OBJECT_REQUIRED';
    throw err;
  }

  // Set process.env
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key];
      }
      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`);
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`);
        }
      }
    } else {
      processEnv[key] = parsed[key];
    }
  }
}
const DotenvModule = {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
};
main$1.exports.configDotenv = DotenvModule.configDotenv;
main$1.exports._configVault = DotenvModule._configVault;
main$1.exports._parseVault = DotenvModule._parseVault;
main$1.exports.config = DotenvModule.config;
main$1.exports.decrypt = DotenvModule.decrypt;
main$1.exports.parse = DotenvModule.parse;
main$1.exports.populate = DotenvModule.populate;
main$1.exports = DotenvModule;
var mainExports = main$1.exports;
var dotenv = /*@__PURE__*/getDefaultExportFromCjs(mainExports);

const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) {
    return true;
  }
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
};

const toOpenAITool = tool => {
  var _tool$parameters;
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      // default to a single string parameter called "value"
      parameters: (_tool$parameters = tool.parameters) !== null && _tool$parameters !== void 0 ? _tool$parameters : {
        type: 'object',
        properties: {
          value: {
            type: 'string'
          }
        },
        required: ['value']
      }
    }
  };
};

const getVar = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};
const includeString = (key, {
  string
}) => async run => {
  console.warn('includeString', string, run.outputs);
  return {
    key,
    score: run.outputs?.message.content.includes(string)
  };
};
const includeContext = (key, {
  contextName
}) => async (run, example) => {
  // get the variable from the context using dot notation
  const varValue = getVar(example.inputs.context, contextName);
  if (!varValue) {
    return {
      key,
      score: false
    };
  }
  return {
    key,
    score: run.outputs?.message.content.includes(varValue)
  };
};
const matchRegex = (key, {
  pattern
}) => async run => {
  return {
    key,
    score: new RegExp(pattern).test(run.outputs?.message.content)
  };
};
const matchToolCall = key => async (run, example) => {
  var _exampleMessage$tool_, _outputMessage$tool_c, _exampleMessage$tool_2;
  const outputMessage = run.outputs?.message;
  const exampleMessage = example.outputs.message;
  const exampleToolCall = (_exampleMessage$tool_ = exampleMessage?.tool_calls?.[0]?.function.name) !== null && _exampleMessage$tool_ !== void 0 ? _exampleMessage$tool_ : '';
  const outputToolCall = (_outputMessage$tool_c = outputMessage?.tool_calls?.[0]?.function.name) !== null && _outputMessage$tool_c !== void 0 ? _outputMessage$tool_c : '';
  const nameMatch = !exampleToolCall || exampleToolCall === outputToolCall;
  const exampleToolCallArgs = (_exampleMessage$tool_2 = exampleMessage.tool_calls?.[0]?.function.arguments) !== null && _exampleMessage$tool_2 !== void 0 ? _exampleMessage$tool_2 : {};
  const outputToolCallArgs = JSON.parse(outputMessage.tool_calls?.[0]?.function.arguments || '{}');
  const argsMatch = deepEqual(exampleToolCallArgs, outputToolCallArgs);
  return {
    key,
    score: nameMatch && argsMatch
  };
};

// rough match of message content using gpt-4o-mini
const compareContent = key => async (run, example) => {
  var _run$outputs$message$, _example$outputs$mess;
  const outputMessage = (_run$outputs$message$ = run.outputs?.message.content) !== null && _run$outputs$message$ !== void 0 ? _run$outputs$message$ : '';
  const exampleMessage = (_example$outputs$mess = example.outputs.message?.content) !== null && _example$outputs$mess !== void 0 ? _example$outputs$mess : '';
  if (!exampleMessage && !outputMessage) {
    // nothing to match, so return true
    return {
      key,
      score: true
    };
  }
  if (!exampleMessage || !outputMessage) {
    // one is empty, so return false
    return {
      key,
      score: false
    };
  }
  const toolName = 'SimilarityResult';
  const systemMessage = `You are a helpful assistant and an expert in comparing and classifying sentences`;
  const userMessage = `I am going to give you two sentences to compare. You need to tell me if they are similar. Call the ${toolName} tool with your result.` + `\n\nFor example, these two sentences are similar:\nSentence 1: "Please give me your location"\nSentence 2: "In order to proceed, can you tell me where you are?".\nSimilarityResult: similar` + `\n\nThese two sentences are different: \nSentence 1: "Let's create a post"\nSentence 2: "Let's create a comment".\nSimilarityResult: different` + `\n\nNow, here are your sentences:` + `\n\nSentence 1: "${exampleMessage}"\nSentence 2: "${outputMessage}"`;
  const tool = {
    type: 'function',
    function: {
      name: toolName,
      description: 'Called with the result of comparing two sentences',
      parameters: {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            description: '"similar" if the sentences are similar, "different" if they are different',
            enum: ['similar', 'different']
          }
        }
      }
    }
  };
  const messages = [{
    role: 'system',
    content: systemMessage
  }, {
    role: 'user',
    content: userMessage
  }];
  const result = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      tools: [tool],
      max_tokens: 2000,
      temperature: 0.1
    })
  });
  const resultJson = await result.json();
  if (resultJson.choices?.[0]?.finish_reason !== 'tool_calls') {
    throw new Error(`Expected tool_call, got ${resultJson.choices?.[0]?.finish_reason}`);
  }
  const message = resultJson.choices?.[0]?.message;
  const toolCall = message.tool_calls?.[0];
  if (!toolCall) {
    throw new Error(`Missing tool call, expected ${toolName}`);
  }
  if (toolCall.function.name !== toolName) {
    throw new Error(`Expected ${toolName}, got ${toolCall.function.name}`);
  }
  const parsedArgs = JSON.parse(toolCall.function.arguments);
  return {
    key,
    score: parsedArgs.value === 'similar'
  };
};

dotenv.config();
const client = new Client();

// a class for registering and running evaluators
// e.g. Evaluators.register( 'chat:matchToolCall', matchToolCallEvaluator );
// e.g. Evaluators.get( 'chat:matchToolCall', 'my_field', { } )( 'matched_tool_call' )( run, example );
class Evaluators {
  static evaluators = {};
  static register(slug, evaluator) {
    this.evaluators[slug] = evaluator;
  }
  static get(slug, key, args) {
    if (!this.evaluators[slug]) {
      throw new Error(`Evaluator ${slug} not found.`);
    }
    return this.evaluators[slug](key, args);
  }
}
Evaluators.register('chat:matchToolCall', matchToolCall);
Evaluators.register('chat:compareContent', compareContent);
Evaluators.register('chat:includeContext', includeContext);
Evaluators.register('chat:includeString', includeString);
Evaluators.register('chat:matchRegex', matchRegex);
const createProject = async (projectName, description) => {
  if (!(await client.hasProject({
    projectName
  }))) {
    await client.createProject({
      projectName,
      description
    });
  }
};
const loadDataset = async datasetFilePath => {
  const fileExtension = path$1.extname(datasetFilePath);
  let dataset;
  try {
    if (fileExtension === '.json') {
      const datasetContent = require$$0.readFileSync(path$1.resolve(datasetFilePath), 'utf-8');
      dataset = JSON.parse(datasetContent);
    } else if (fileExtension === '.js') {
      const modulePath = path$1.resolve(datasetFilePath);
      const module = await import(modulePath);
      dataset = module.default;
    } else {
      throw new Error('Unsupported file type. Please provide a .json or .js file.');
    }
  } catch (error) {
    console.error('Error reading or parsing the dataset file:', error.message);
    process.exit(1);
  }
  return dataset;
};
const createChatDataset = async dataset => {
  const {
    name,
    description,
    data,
    metadata = {}
  } = dataset;
  console.warn('create dataset', dataset);
  if (!(await client.hasDataset({
    datasetName: name
  }))) {
    const datasetResult = await client.createDataset(name, {
      data_type: 'chat',
      description
    });
    for (const example of data) {
      await client.createExample(example.inputs, example.outputs, {
        datasetId: datasetResult.id,
        metadata: {
          ...metadata,
          exampleId: example.id
        }
      });
    }
  } else {
    const datasetResult = await client.readDataset({
      datasetName: name
    });

    // Collect existing example IDs
    const existingExampleIds = new Set();
    for await (const remoteExample of client.listExamples({
      datasetId: datasetResult.id
    })) {
      existingExampleIds.add(remoteExample.metadata.exampleId);

      // Look up from example using id
      const example = data.find(e => e.id === remoteExample.metadata.exampleId);
      if (example) {
        if (!deepEqual(example.inputs, remoteExample.inputs) || !deepEqual(example.outputs, remoteExample.outputs)) {
          console.warn(`updating example ${remoteExample.id}`);
          await client.updateExample(remoteExample.id, {
            inputs: example.inputs,
            outputs: example.outputs
          });
        } else {
          console.warn(`example ${remoteExample.id} is up to date`);
        }
      } else {
        console.warn(`deleting example ${remoteExample.id}`);
        await client.deleteExample(remoteExample.id);
      }
    }

    // Add new examples that do not exist in the dataset
    for (const example of data) {
      if (!existingExampleIds.has(example.id)) {
        console.warn(`creating new example ${example.id}`);
        await client.createExample(example.inputs, example.outputs, {
          datasetId: datasetResult.id,
          metadata: {
            ...metadata,
            exampleId: example.id
          }
        });
      }
    }
  }
};

// Function to parse and load evaluators
async function getEvaluators(evaluators) {
  const parsedEvaluators = [];
  for (const evaluator of evaluators) {
    // const [ library, func ] = evaluator.function.split( ':' );
    // const modulePath = `./evaluators/${ library }.js`;
    parsedEvaluators.push(Evaluators.get(evaluator.function, evaluator.key, evaluator.arguments));
  }
  return parsedEvaluators;
}
const evaluateAgent = async (experimentPrefix, agent, dataset, service, apiKey, model, temperature, maxTokens) => {
  const chatModel = ChatModel.getInstance(service, apiKey);
  const agentMetadata = agent.metadata || {};
  const agentTags = agent.tags || [];
  const evaluators = await getEvaluators(dataset.evaluators);
  return await evaluate(async example => {
    const {
      messages,
      context = {}
    } = example;
    const instructions = typeof agent.instructions === 'function' ? agent.instructions(context) : agent.instructions;
    const additionalInstructions = typeof agent.additionalInstructions === 'function' ? agent.additionalInstructions(context) : agent.additionalInstructions;
    const tools = [];
    if (agent.toolkits) {
      if (agent.toolkits && Array.isArray(agent.toolkits)) {
        for (const toolkit of agent.toolkits) {
          const toolkitTools = typeof toolkit.tools === 'function' ? toolkit.tools(context) : toolkit.tools;
          if (toolkitTools && Array.isArray(toolkitTools)) {
            tools.push(...toolkitTools);
          }
        }
      }
    }
    if (agent.tools) {
      const agentTools = typeof agent.tools === 'function' ? agent.tools(context) : agent.tools;
      console.warn('agent tools', agent.tools, agentTools);
      if (agentTools && Array.isArray(agentTools)) {
        tools.push(...agentTools);
      }
    }
    const openAITools = tools.map(toOpenAITool);
    const message = await chatModel.run({
      instructions,
      additionalInstructions,
      tools: openAITools,
      model,
      messages,
      temperature,
      maxTokens
    });
    return {
      message,
      instructions,
      additionalInstructions,
      tools
    };
  }, {
    experimentPrefix,
    data: dataset.name,
    client,
    evaluators,
    tags: agentTags,
    metadata: {
      a8c_agent_name: agent.name,
      ls_model_name: model,
      ls_provider: service,
      ls_temperature: temperature,
      ls_max_tokens: maxTokens,
      ls_model_type: 'chat',
      ...agentMetadata
    }
  });
};
const runEvaluation = async (name, agents, dataset, model, service, apiKey, temperature, maxTokens) => {
  // experimentPrefix is a slugified version of the project name
  const experimentPrefix = name.toLowerCase().replace(/ /g, '_');
  await createProject(name);
  await createChatDataset(dataset);
  const evaluationResults = [];
  for (const agent of agents) {
    var _agent$metadata$versi;
    const agentNameSlug = agent.name.toLowerCase().replace(/ /g, '_');
    const evaluationResult = await evaluateAgent(`${experimentPrefix}-${agentNameSlug}-v${(_agent$metadata$versi = agent.metadata?.version) !== null && _agent$metadata$versi !== void 0 ? _agent$metadata$versi : '1'}`, agent, dataset, service, apiKey, model, temperature, maxTokens);
    /**
     * [
     *   {
     *     "key": "has_site_title",
     *     "score": true,
     *     "sourceRunId": "f0ca35df-800e-4a10-8327-39409f9508cb"
     *   },
     *   //....
     * ]
     */
    const results = evaluationResult.results.map(result => {
      const exampleId = result.example.metadata.exampleId;
      const scores = {};
      result.evaluationResults.results.forEach(r => {
        scores[r.key] = r.score;
      });
      return {
        exampleId,
        inputs: result.run.inputs,
        outputs: result.run.outputs,
        exampleOutputs: result.example.outputs,
        scores
      };
    });

    // let nextResult = await evaluationResult.next();
    // while ( ! nextResult.done ) {
    // 	results.push( nextResult.value );
    // 	nextResult = await evaluationResult.next();
    // }
    evaluationResults.push({
      agent: agent.name,
      tags: agent.tags,
      metadata: agent.metadata,
      results
    });
  }
  return evaluationResults;
};

var isMergeableObject = function isMergeableObject(value) {
  return isNonNullObject(value) && !isSpecial(value);
};
function isNonNullObject(value) {
  return !!value && typeof value === 'object';
}
function isSpecial(value) {
  var stringValue = Object.prototype.toString.call(value);
  return stringValue === '[object RegExp]' || stringValue === '[object Date]' || isReactElement(value);
}

// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;
function isReactElement(value) {
  return value.$$typeof === REACT_ELEMENT_TYPE;
}
function emptyTarget(val) {
  return Array.isArray(val) ? [] : {};
}
function cloneUnlessOtherwiseSpecified(value, options) {
  return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
}
function defaultArrayMerge(target, source, options) {
  return target.concat(source).map(function (element) {
    return cloneUnlessOtherwiseSpecified(element, options);
  });
}
function getMergeFunction(key, options) {
  if (!options.customMerge) {
    return deepmerge;
  }
  var customMerge = options.customMerge(key);
  return typeof customMerge === 'function' ? customMerge : deepmerge;
}
function getEnumerableOwnPropertySymbols(target) {
  return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function (symbol) {
    return Object.propertyIsEnumerable.call(target, symbol);
  }) : [];
}
function getKeys(target) {
  return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}
function propertyIsOnObject(object, property) {
  try {
    return property in object;
  } catch (_) {
    return false;
  }
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
  return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
  && !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
  && Object.propertyIsEnumerable.call(target, key)); // and also unsafe if they're nonenumerable.
}
function mergeObject(target, source, options) {
  var destination = {};
  if (options.isMergeableObject(target)) {
    getKeys(target).forEach(function (key) {
      destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
    });
  }
  getKeys(source).forEach(function (key) {
    if (propertyIsUnsafe(target, key)) {
      return;
    }
    if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
      destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
    } else {
      destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
    }
  });
  return destination;
}
function deepmerge(target, source, options) {
  options = options || {};
  options.arrayMerge = options.arrayMerge || defaultArrayMerge;
  options.isMergeableObject = options.isMergeableObject || isMergeableObject;
  // cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
  // implementations can use it. The caller may not replace it.
  options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
  var sourceIsArray = Array.isArray(source);
  var targetIsArray = Array.isArray(target);
  var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
  if (!sourceAndTargetTypesMatch) {
    return cloneUnlessOtherwiseSpecified(source, options);
  } else if (sourceIsArray) {
    return options.arrayMerge(target, source, options);
  } else {
    return mergeObject(target, source, options);
  }
}
deepmerge.all = function deepmergeAll(array, options) {
  if (!Array.isArray(array)) {
    throw new Error('first argument should be an array');
  }
  return array.reduce(function (prev, next) {
    return deepmerge(prev, next, options);
  }, {});
};

const align = {
  right: alignRight,
  center: alignCenter
};
const top = 0;
const right = 1;
const bottom = 2;
const left = 3;
class UI {
  constructor(opts) {
    var _a;
    this.width = opts.width;
    this.wrap = (_a = opts.wrap) !== null && _a !== void 0 ? _a : true;
    this.rows = [];
  }
  span(...args) {
    const cols = this.div(...args);
    cols.span = true;
  }
  resetOutput() {
    this.rows = [];
  }
  div(...args) {
    if (args.length === 0) {
      this.div('');
    }
    if (this.wrap && this.shouldApplyLayoutDSL(...args) && typeof args[0] === 'string') {
      return this.applyLayoutDSL(args[0]);
    }
    const cols = args.map(arg => {
      if (typeof arg === 'string') {
        return this.colFromString(arg);
      }
      return arg;
    });
    this.rows.push(cols);
    return cols;
  }
  shouldApplyLayoutDSL(...args) {
    return args.length === 1 && typeof args[0] === 'string' && /[\t\n]/.test(args[0]);
  }
  applyLayoutDSL(str) {
    const rows = str.split('\n').map(row => row.split('\t'));
    let leftColumnWidth = 0;
    // simple heuristic for layout, make sure the
    // second column lines up along the left-hand.
    // don't allow the first column to take up more
    // than 50% of the screen.
    rows.forEach(columns => {
      if (columns.length > 1 && mixin$1.stringWidth(columns[0]) > leftColumnWidth) {
        leftColumnWidth = Math.min(Math.floor(this.width * 0.5), mixin$1.stringWidth(columns[0]));
      }
    });
    // generate a table:
    //  replacing ' ' with padding calculations.
    //  using the algorithmically generated width.
    rows.forEach(columns => {
      this.div(...columns.map((r, i) => {
        return {
          text: r.trim(),
          padding: this.measurePadding(r),
          width: i === 0 && columns.length > 1 ? leftColumnWidth : undefined
        };
      }));
    });
    return this.rows[this.rows.length - 1];
  }
  colFromString(text) {
    return {
      text,
      padding: this.measurePadding(text)
    };
  }
  measurePadding(str) {
    // measure padding without ansi escape codes
    const noAnsi = mixin$1.stripAnsi(str);
    return [0, noAnsi.match(/\s*$/)[0].length, 0, noAnsi.match(/^\s*/)[0].length];
  }
  toString() {
    const lines = [];
    this.rows.forEach(row => {
      this.rowToString(row, lines);
    });
    // don't display any lines with the
    // hidden flag set.
    return lines.filter(line => !line.hidden).map(line => line.text).join('\n');
  }
  rowToString(row, lines) {
    this.rasterize(row).forEach((rrow, r) => {
      let str = '';
      rrow.forEach((col, c) => {
        const {
          width
        } = row[c]; // the width with padding.
        const wrapWidth = this.negatePadding(row[c]); // the width without padding.
        let ts = col; // temporary string used during alignment/padding.
        if (wrapWidth > mixin$1.stringWidth(col)) {
          ts += ' '.repeat(wrapWidth - mixin$1.stringWidth(col));
        }
        // align the string within its column.
        if (row[c].align && row[c].align !== 'left' && this.wrap) {
          const fn = align[row[c].align];
          ts = fn(ts, wrapWidth);
          if (mixin$1.stringWidth(ts) < wrapWidth) {
            ts += ' '.repeat((width || 0) - mixin$1.stringWidth(ts) - 1);
          }
        }
        // apply border and padding to string.
        const padding = row[c].padding || [0, 0, 0, 0];
        if (padding[left]) {
          str += ' '.repeat(padding[left]);
        }
        str += addBorder(row[c], ts, '| ');
        str += ts;
        str += addBorder(row[c], ts, ' |');
        if (padding[right]) {
          str += ' '.repeat(padding[right]);
        }
        // if prior row is span, try to render the
        // current row on the prior line.
        if (r === 0 && lines.length > 0) {
          str = this.renderInline(str, lines[lines.length - 1]);
        }
      });
      // remove trailing whitespace.
      lines.push({
        text: str.replace(/ +$/, ''),
        span: row.span
      });
    });
    return lines;
  }
  // if the full 'source' can render in
  // the target line, do so.
  renderInline(source, previousLine) {
    const match = source.match(/^ */);
    const leadingWhitespace = match ? match[0].length : 0;
    const target = previousLine.text;
    const targetTextWidth = mixin$1.stringWidth(target.trimRight());
    if (!previousLine.span) {
      return source;
    }
    // if we're not applying wrapping logic,
    // just always append to the span.
    if (!this.wrap) {
      previousLine.hidden = true;
      return target + source;
    }
    if (leadingWhitespace < targetTextWidth) {
      return source;
    }
    previousLine.hidden = true;
    return target.trimRight() + ' '.repeat(leadingWhitespace - targetTextWidth) + source.trimLeft();
  }
  rasterize(row) {
    const rrows = [];
    const widths = this.columnWidths(row);
    let wrapped;
    // word wrap all columns, and create
    // a data-structure that is easy to rasterize.
    row.forEach((col, c) => {
      // leave room for left and right padding.
      col.width = widths[c];
      if (this.wrap) {
        wrapped = mixin$1.wrap(col.text, this.negatePadding(col), {
          hard: true
        }).split('\n');
      } else {
        wrapped = col.text.split('\n');
      }
      if (col.border) {
        wrapped.unshift('.' + '-'.repeat(this.negatePadding(col) + 2) + '.');
        wrapped.push("'" + '-'.repeat(this.negatePadding(col) + 2) + "'");
      }
      // add top and bottom padding.
      if (col.padding) {
        wrapped.unshift(...new Array(col.padding[top] || 0).fill(''));
        wrapped.push(...new Array(col.padding[bottom] || 0).fill(''));
      }
      wrapped.forEach((str, r) => {
        if (!rrows[r]) {
          rrows.push([]);
        }
        const rrow = rrows[r];
        for (let i = 0; i < c; i++) {
          if (rrow[i] === undefined) {
            rrow.push('');
          }
        }
        rrow.push(str);
      });
    });
    return rrows;
  }
  negatePadding(col) {
    let wrapWidth = col.width || 0;
    if (col.padding) {
      wrapWidth -= (col.padding[left] || 0) + (col.padding[right] || 0);
    }
    if (col.border) {
      wrapWidth -= 4;
    }
    return wrapWidth;
  }
  columnWidths(row) {
    if (!this.wrap) {
      return row.map(col => {
        return col.width || mixin$1.stringWidth(col.text);
      });
    }
    let unset = row.length;
    let remainingWidth = this.width;
    // column widths can be set in config.
    const widths = row.map(col => {
      if (col.width) {
        unset--;
        remainingWidth -= col.width;
        return col.width;
      }
      return undefined;
    });
    // any unset widths should be calculated.
    const unsetWidth = unset ? Math.floor(remainingWidth / unset) : 0;
    return widths.map((w, i) => {
      if (w === undefined) {
        return Math.max(unsetWidth, _minWidth(row[i]));
      }
      return w;
    });
  }
}
function addBorder(col, ts, style) {
  if (col.border) {
    if (/[.']-+[.']/.test(ts)) {
      return '';
    }
    if (ts.trim().length !== 0) {
      return style;
    }
    return '  ';
  }
  return '';
}
// calculates the minimum width of
// a column, based on padding preferences.
function _minWidth(col) {
  const padding = col.padding || [];
  const minWidth = 1 + (padding[left] || 0) + (padding[right] || 0);
  if (col.border) {
    return minWidth + 4;
  }
  return minWidth;
}
function getWindowWidth() {
  /* istanbul ignore next: depends on terminal */
  if (typeof process === 'object' && process.stdout && process.stdout.columns) {
    return process.stdout.columns;
  }
  return 80;
}
function alignRight(str, width) {
  str = str.trim();
  const strWidth = mixin$1.stringWidth(str);
  if (strWidth < width) {
    return ' '.repeat(width - strWidth) + str;
  }
  return str;
}
function alignCenter(str, width) {
  str = str.trim();
  const strWidth = mixin$1.stringWidth(str);
  /* istanbul ignore next */
  if (strWidth >= width) {
    return str;
  }
  return ' '.repeat(width - strWidth >> 1) + str;
}
let mixin$1;
function cliui(opts, _mixin) {
  mixin$1 = _mixin;
  return new UI({
    width: (opts === null || opts === void 0 ? void 0 : opts.width) || getWindowWidth(),
    wrap: opts === null || opts === void 0 ? void 0 : opts.wrap
  });
}

// Minimal replacement for ansi string helpers "wrap-ansi" and "strip-ansi".
// to facilitate ESM and Deno modules.
// TODO: look at porting https://www.npmjs.com/package/wrap-ansi to ESM.
// The npm application
// Copyright (c) npm, Inc. and Contributors
// Licensed on the terms of The Artistic License 2.0
// See: https://github.com/npm/cli/blob/4c65cd952bc8627811735bea76b9b110cc4fc80e/lib/utils/ansi-trim.js
const ansi = new RegExp('\x1b(?:\\[(?:\\d+[ABCDEFGJKSTm]|\\d+;\\d+[Hfm]|' + '\\d+;\\d+;\\d+m|6n|s|u|\\?25[lh])|\\w)', 'g');
function stripAnsi(str) {
  return str.replace(ansi, '');
}
function wrap(str, width) {
  const [start, end] = str.match(ansi) || ['', ''];
  str = stripAnsi(str);
  let wrapped = '';
  for (let i = 0; i < str.length; i++) {
    if (i !== 0 && i % width === 0) {
      wrapped += '\n';
    }
    wrapped += str.charAt(i);
  }
  if (start && end) {
    wrapped = `${start}${wrapped}${end}`;
  }
  return wrapped;
}

// Bootstrap cliui with CommonJS dependencies:

function ui (opts) {
  return cliui(opts, {
    stringWidth: (str) => {
      return [...str].length
    },
    stripAnsi,
    wrap
  })
}

function escalade (start, callback) {
	let dir = resolve('.', start);
	let tmp, stats = statSync(dir);

	if (!stats.isDirectory()) {
		dir = dirname(dir);
	}

	while (true) {
		tmp = callback(dir, readdirSync(dir));
		if (tmp) return resolve(dir, tmp);
		dir = dirname(tmp = dir);
		if (tmp === dir) break;
	}
}

/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
function camelCase(str) {
  // Handle the case where an argument is provided as camel case, e.g., fooBar.
  // by ensuring that the string isn't already mixed case:
  const isCamelCase = str !== str.toLowerCase() && str !== str.toUpperCase();
  if (!isCamelCase) {
    str = str.toLowerCase();
  }
  if (str.indexOf('-') === -1 && str.indexOf('_') === -1) {
    return str;
  } else {
    let camelcase = '';
    let nextChrUpper = false;
    const leadingHyphens = str.match(/^-+/);
    for (let i = leadingHyphens ? leadingHyphens[0].length : 0; i < str.length; i++) {
      let chr = str.charAt(i);
      if (nextChrUpper) {
        nextChrUpper = false;
        chr = chr.toUpperCase();
      }
      if (i !== 0 && (chr === '-' || chr === '_')) {
        nextChrUpper = true;
      } else if (chr !== '-' && chr !== '_') {
        camelcase += chr;
      }
    }
    return camelcase;
  }
}
function decamelize(str, joinString) {
  const lowercase = str.toLowerCase();
  joinString = joinString || '-';
  let notCamelcase = '';
  for (let i = 0; i < str.length; i++) {
    const chrLower = lowercase.charAt(i);
    const chrString = str.charAt(i);
    if (chrLower !== chrString && i > 0) {
      notCamelcase += `${joinString}${lowercase.charAt(i)}`;
    } else {
      notCamelcase += chrString;
    }
  }
  return notCamelcase;
}
function looksLikeNumber(x) {
  if (x === null || x === undefined) return false;
  // if loaded from config, may already be a number.
  if (typeof x === 'number') return true;
  // hexadecimal.
  if (/^0x[0-9a-f]+$/i.test(x)) return true;
  // don't treat 0123 as a number; as it drops the leading '0'.
  if (/^0[^.]/.test(x)) return false;
  return /^[-]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}

/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
// take an un-split argv string and tokenize it.
function tokenizeArgString(argString) {
  if (Array.isArray(argString)) {
    return argString.map(e => typeof e !== 'string' ? e + '' : e);
  }
  argString = argString.trim();
  let i = 0;
  let prevC = null;
  let c = null;
  let opening = null;
  const args = [];
  for (let ii = 0; ii < argString.length; ii++) {
    prevC = c;
    c = argString.charAt(ii);
    // split on spaces unless we're in quotes.
    if (c === ' ' && !opening) {
      if (!(prevC === ' ')) {
        i++;
      }
      continue;
    }
    // don't split the string if we're in matching
    // opening or closing single and double quotes.
    if (c === opening) {
      opening = null;
    } else if ((c === "'" || c === '"') && !opening) {
      opening = c;
    }
    if (!args[i]) args[i] = '';
    args[i] += c;
  }
  return args;
}

/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
var DefaultValuesForTypeKey;
(function (DefaultValuesForTypeKey) {
  DefaultValuesForTypeKey["BOOLEAN"] = "boolean";
  DefaultValuesForTypeKey["STRING"] = "string";
  DefaultValuesForTypeKey["NUMBER"] = "number";
  DefaultValuesForTypeKey["ARRAY"] = "array";
})(DefaultValuesForTypeKey || (DefaultValuesForTypeKey = {}));

/**
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
let mixin;
class YargsParser {
  constructor(_mixin) {
    mixin = _mixin;
  }
  parse(argsInput, options) {
    const opts = Object.assign({
      alias: undefined,
      array: undefined,
      boolean: undefined,
      config: undefined,
      configObjects: undefined,
      configuration: undefined,
      coerce: undefined,
      count: undefined,
      default: undefined,
      envPrefix: undefined,
      narg: undefined,
      normalize: undefined,
      string: undefined,
      number: undefined,
      __: undefined,
      key: undefined
    }, options);
    // allow a string argument to be passed in rather
    // than an argv array.
    const args = tokenizeArgString(argsInput);
    // tokenizeArgString adds extra quotes to args if argsInput is a string
    // only strip those extra quotes in processValue if argsInput is a string
    const inputIsString = typeof argsInput === 'string';
    // aliases might have transitive relationships, normalize this.
    const aliases = combineAliases(Object.assign(Object.create(null), opts.alias));
    const configuration = Object.assign({
      'boolean-negation': true,
      'camel-case-expansion': true,
      'combine-arrays': false,
      'dot-notation': true,
      'duplicate-arguments-array': true,
      'flatten-duplicate-arrays': true,
      'greedy-arrays': true,
      'halt-at-non-option': false,
      'nargs-eats-options': false,
      'negation-prefix': 'no-',
      'parse-numbers': true,
      'parse-positional-numbers': true,
      'populate--': false,
      'set-placeholder-key': false,
      'short-option-groups': true,
      'strip-aliased': false,
      'strip-dashed': false,
      'unknown-options-as-args': false
    }, opts.configuration);
    const defaults = Object.assign(Object.create(null), opts.default);
    const configObjects = opts.configObjects || [];
    const envPrefix = opts.envPrefix;
    const notFlagsOption = configuration['populate--'];
    const notFlagsArgv = notFlagsOption ? '--' : '_';
    const newAliases = Object.create(null);
    const defaulted = Object.create(null);
    // allow a i18n handler to be passed in, default to a fake one (util.format).
    const __ = opts.__ || mixin.format;
    const flags = {
      aliases: Object.create(null),
      arrays: Object.create(null),
      bools: Object.create(null),
      strings: Object.create(null),
      numbers: Object.create(null),
      counts: Object.create(null),
      normalize: Object.create(null),
      configs: Object.create(null),
      nargs: Object.create(null),
      coercions: Object.create(null),
      keys: []
    };
    const negative = /^-([0-9]+(\.[0-9]+)?|\.[0-9]+)$/;
    const negatedBoolean = new RegExp('^--' + configuration['negation-prefix'] + '(.+)');
    [].concat(opts.array || []).filter(Boolean).forEach(function (opt) {
      const key = typeof opt === 'object' ? opt.key : opt;
      // assign to flags[bools|strings|numbers]
      const assignment = Object.keys(opt).map(function (key) {
        const arrayFlagKeys = {
          boolean: 'bools',
          string: 'strings',
          number: 'numbers'
        };
        return arrayFlagKeys[key];
      }).filter(Boolean).pop();
      // assign key to be coerced
      if (assignment) {
        flags[assignment][key] = true;
      }
      flags.arrays[key] = true;
      flags.keys.push(key);
    });
    [].concat(opts.boolean || []).filter(Boolean).forEach(function (key) {
      flags.bools[key] = true;
      flags.keys.push(key);
    });
    [].concat(opts.string || []).filter(Boolean).forEach(function (key) {
      flags.strings[key] = true;
      flags.keys.push(key);
    });
    [].concat(opts.number || []).filter(Boolean).forEach(function (key) {
      flags.numbers[key] = true;
      flags.keys.push(key);
    });
    [].concat(opts.count || []).filter(Boolean).forEach(function (key) {
      flags.counts[key] = true;
      flags.keys.push(key);
    });
    [].concat(opts.normalize || []).filter(Boolean).forEach(function (key) {
      flags.normalize[key] = true;
      flags.keys.push(key);
    });
    if (typeof opts.narg === 'object') {
      Object.entries(opts.narg).forEach(([key, value]) => {
        if (typeof value === 'number') {
          flags.nargs[key] = value;
          flags.keys.push(key);
        }
      });
    }
    if (typeof opts.coerce === 'object') {
      Object.entries(opts.coerce).forEach(([key, value]) => {
        if (typeof value === 'function') {
          flags.coercions[key] = value;
          flags.keys.push(key);
        }
      });
    }
    if (typeof opts.config !== 'undefined') {
      if (Array.isArray(opts.config) || typeof opts.config === 'string') {
        [].concat(opts.config).filter(Boolean).forEach(function (key) {
          flags.configs[key] = true;
        });
      } else if (typeof opts.config === 'object') {
        Object.entries(opts.config).forEach(([key, value]) => {
          if (typeof value === 'boolean' || typeof value === 'function') {
            flags.configs[key] = value;
          }
        });
      }
    }
    // create a lookup table that takes into account all
    // combinations of aliases: {f: ['foo'], foo: ['f']}
    extendAliases(opts.key, aliases, opts.default, flags.arrays);
    // apply default values to all aliases.
    Object.keys(defaults).forEach(function (key) {
      (flags.aliases[key] || []).forEach(function (alias) {
        defaults[alias] = defaults[key];
      });
    });
    let error = null;
    checkConfiguration();
    let notFlags = [];
    const argv = Object.assign(Object.create(null), {
      _: []
    });
    // TODO(bcoe): for the first pass at removing object prototype  we didn't
    // remove all prototypes from objects returned by this API, we might want
    // to gradually move towards doing so.
    const argvReturn = {};
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const truncatedArg = arg.replace(/^-{3,}/, '---');
      let broken;
      let key;
      let letters;
      let m;
      let next;
      let value;
      // any unknown option (except for end-of-options, "--")
      if (arg !== '--' && /^-/.test(arg) && isUnknownOptionAsArg(arg)) {
        pushPositional(arg);
        // ---, ---=, ----, etc,
      } else if (truncatedArg.match(/^---+(=|$)/)) {
        // options without key name are invalid.
        pushPositional(arg);
        continue;
        // -- separated by =
      } else if (arg.match(/^--.+=/) || !configuration['short-option-groups'] && arg.match(/^-.+=/)) {
        // Using [\s\S] instead of . because js doesn't support the
        // 'dotall' regex modifier. See:
        // http://stackoverflow.com/a/1068308/13216
        m = arg.match(/^--?([^=]+)=([\s\S]*)$/);
        // arrays format = '--f=a b c'
        if (m !== null && Array.isArray(m) && m.length >= 3) {
          if (checkAllAliases(m[1], flags.arrays)) {
            i = eatArray(i, m[1], args, m[2]);
          } else if (checkAllAliases(m[1], flags.nargs) !== false) {
            // nargs format = '--f=monkey washing cat'
            i = eatNargs(i, m[1], args, m[2]);
          } else {
            setArg(m[1], m[2], true);
          }
        }
      } else if (arg.match(negatedBoolean) && configuration['boolean-negation']) {
        m = arg.match(negatedBoolean);
        if (m !== null && Array.isArray(m) && m.length >= 2) {
          key = m[1];
          setArg(key, checkAllAliases(key, flags.arrays) ? [false] : false);
        }
        // -- separated by space.
      } else if (arg.match(/^--.+/) || !configuration['short-option-groups'] && arg.match(/^-[^-]+/)) {
        m = arg.match(/^--?(.+)/);
        if (m !== null && Array.isArray(m) && m.length >= 2) {
          key = m[1];
          if (checkAllAliases(key, flags.arrays)) {
            // array format = '--foo a b c'
            i = eatArray(i, key, args);
          } else if (checkAllAliases(key, flags.nargs) !== false) {
            // nargs format = '--foo a b c'
            // should be truthy even if: flags.nargs[key] === 0
            i = eatNargs(i, key, args);
          } else {
            next = args[i + 1];
            if (next !== undefined && (!next.match(/^-/) || next.match(negative)) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
              setArg(key, next);
              i++;
            } else if (/^(true|false)$/.test(next)) {
              setArg(key, next);
              i++;
            } else {
              setArg(key, defaultValue(key));
            }
          }
        }
        // dot-notation flag separated by '='.
      } else if (arg.match(/^-.\..+=/)) {
        m = arg.match(/^-([^=]+)=([\s\S]*)$/);
        if (m !== null && Array.isArray(m) && m.length >= 3) {
          setArg(m[1], m[2]);
        }
        // dot-notation flag separated by space.
      } else if (arg.match(/^-.\..+/) && !arg.match(negative)) {
        next = args[i + 1];
        m = arg.match(/^-(.\..+)/);
        if (m !== null && Array.isArray(m) && m.length >= 2) {
          key = m[1];
          if (next !== undefined && !next.match(/^-/) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
            setArg(key, next);
            i++;
          } else {
            setArg(key, defaultValue(key));
          }
        }
      } else if (arg.match(/^-[^-]+/) && !arg.match(negative)) {
        letters = arg.slice(1, -1).split('');
        broken = false;
        for (let j = 0; j < letters.length; j++) {
          next = arg.slice(j + 2);
          if (letters[j + 1] && letters[j + 1] === '=') {
            value = arg.slice(j + 3);
            key = letters[j];
            if (checkAllAliases(key, flags.arrays)) {
              // array format = '-f=a b c'
              i = eatArray(i, key, args, value);
            } else if (checkAllAliases(key, flags.nargs) !== false) {
              // nargs format = '-f=monkey washing cat'
              i = eatNargs(i, key, args, value);
            } else {
              setArg(key, value);
            }
            broken = true;
            break;
          }
          if (next === '-') {
            setArg(letters[j], next);
            continue;
          }
          // current letter is an alphabetic character and next value is a number
          if (/[A-Za-z]/.test(letters[j]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next) && checkAllAliases(next, flags.bools) === false) {
            setArg(letters[j], next);
            broken = true;
            break;
          }
          if (letters[j + 1] && letters[j + 1].match(/\W/)) {
            setArg(letters[j], next);
            broken = true;
            break;
          } else {
            setArg(letters[j], defaultValue(letters[j]));
          }
        }
        key = arg.slice(-1)[0];
        if (!broken && key !== '-') {
          if (checkAllAliases(key, flags.arrays)) {
            // array format = '-f a b c'
            i = eatArray(i, key, args);
          } else if (checkAllAliases(key, flags.nargs) !== false) {
            // nargs format = '-f a b c'
            // should be truthy even if: flags.nargs[key] === 0
            i = eatNargs(i, key, args);
          } else {
            next = args[i + 1];
            if (next !== undefined && (!/^(-|--)[^-]/.test(next) || next.match(negative)) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
              setArg(key, next);
              i++;
            } else if (/^(true|false)$/.test(next)) {
              setArg(key, next);
              i++;
            } else {
              setArg(key, defaultValue(key));
            }
          }
        }
      } else if (arg.match(/^-[0-9]$/) && arg.match(negative) && checkAllAliases(arg.slice(1), flags.bools)) {
        // single-digit boolean alias, e.g: xargs -0
        key = arg.slice(1);
        setArg(key, defaultValue(key));
      } else if (arg === '--') {
        notFlags = args.slice(i + 1);
        break;
      } else if (configuration['halt-at-non-option']) {
        notFlags = args.slice(i);
        break;
      } else {
        pushPositional(arg);
      }
    }
    // order of precedence:
    // 1. command line arg
    // 2. value from env var
    // 3. value from config file
    // 4. value from config objects
    // 5. configured default value
    applyEnvVars(argv, true); // special case: check env vars that point to config file
    applyEnvVars(argv, false);
    setConfig(argv);
    setConfigObjects();
    applyDefaultsAndAliases(argv, flags.aliases, defaults, true);
    applyCoercions(argv);
    if (configuration['set-placeholder-key']) setPlaceholderKeys(argv);
    // for any counts either not in args or without an explicit default, set to 0
    Object.keys(flags.counts).forEach(function (key) {
      if (!hasKey(argv, key.split('.'))) setArg(key, 0);
    });
    // '--' defaults to undefined.
    if (notFlagsOption && notFlags.length) argv[notFlagsArgv] = [];
    notFlags.forEach(function (key) {
      argv[notFlagsArgv].push(key);
    });
    if (configuration['camel-case-expansion'] && configuration['strip-dashed']) {
      Object.keys(argv).filter(key => key !== '--' && key.includes('-')).forEach(key => {
        delete argv[key];
      });
    }
    if (configuration['strip-aliased']) {
      [].concat(...Object.keys(aliases).map(k => aliases[k])).forEach(alias => {
        if (configuration['camel-case-expansion'] && alias.includes('-')) {
          delete argv[alias.split('.').map(prop => camelCase(prop)).join('.')];
        }
        delete argv[alias];
      });
    }
    // Push argument into positional array, applying numeric coercion:
    function pushPositional(arg) {
      const maybeCoercedNumber = maybeCoerceNumber('_', arg);
      if (typeof maybeCoercedNumber === 'string' || typeof maybeCoercedNumber === 'number') {
        argv._.push(maybeCoercedNumber);
      }
    }
    // how many arguments should we consume, based
    // on the nargs option?
    function eatNargs(i, key, args, argAfterEqualSign) {
      let ii;
      let toEat = checkAllAliases(key, flags.nargs);
      // NaN has a special meaning for the array type, indicating that one or
      // more values are expected.
      toEat = typeof toEat !== 'number' || isNaN(toEat) ? 1 : toEat;
      if (toEat === 0) {
        if (!isUndefined(argAfterEqualSign)) {
          error = Error(__('Argument unexpected for: %s', key));
        }
        setArg(key, defaultValue(key));
        return i;
      }
      let available = isUndefined(argAfterEqualSign) ? 0 : 1;
      if (configuration['nargs-eats-options']) {
        // classic behavior, yargs eats positional and dash arguments.
        if (args.length - (i + 1) + available < toEat) {
          error = Error(__('Not enough arguments following: %s', key));
        }
        available = toEat;
      } else {
        // nargs will not consume flag arguments, e.g., -abc, --foo,
        // and terminates when one is observed.
        for (ii = i + 1; ii < args.length; ii++) {
          if (!args[ii].match(/^-[^0-9]/) || args[ii].match(negative) || isUnknownOptionAsArg(args[ii])) available++;else break;
        }
        if (available < toEat) error = Error(__('Not enough arguments following: %s', key));
      }
      let consumed = Math.min(available, toEat);
      if (!isUndefined(argAfterEqualSign) && consumed > 0) {
        setArg(key, argAfterEqualSign);
        consumed--;
      }
      for (ii = i + 1; ii < consumed + i + 1; ii++) {
        setArg(key, args[ii]);
      }
      return i + consumed;
    }
    // if an option is an array, eat all non-hyphenated arguments
    // following it... YUM!
    // e.g., --foo apple banana cat becomes ["apple", "banana", "cat"]
    function eatArray(i, key, args, argAfterEqualSign) {
      let argsToSet = [];
      let next = argAfterEqualSign || args[i + 1];
      // If both array and nargs are configured, enforce the nargs count:
      const nargsCount = checkAllAliases(key, flags.nargs);
      if (checkAllAliases(key, flags.bools) && !/^(true|false)$/.test(next)) {
        argsToSet.push(true);
      } else if (isUndefined(next) || isUndefined(argAfterEqualSign) && /^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next)) {
        // for keys without value ==> argsToSet remains an empty []
        // set user default value, if available
        if (defaults[key] !== undefined) {
          const defVal = defaults[key];
          argsToSet = Array.isArray(defVal) ? defVal : [defVal];
        }
      } else {
        // value in --option=value is eaten as is
        if (!isUndefined(argAfterEqualSign)) {
          argsToSet.push(processValue(key, argAfterEqualSign, true));
        }
        for (let ii = i + 1; ii < args.length; ii++) {
          if (!configuration['greedy-arrays'] && argsToSet.length > 0 || nargsCount && typeof nargsCount === 'number' && argsToSet.length >= nargsCount) break;
          next = args[ii];
          if (/^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next)) break;
          i = ii;
          argsToSet.push(processValue(key, next, inputIsString));
        }
      }
      // If both array and nargs are configured, create an error if less than
      // nargs positionals were found. NaN has special meaning, indicating
      // that at least one value is required (more are okay).
      if (typeof nargsCount === 'number' && (nargsCount && argsToSet.length < nargsCount || isNaN(nargsCount) && argsToSet.length === 0)) {
        error = Error(__('Not enough arguments following: %s', key));
      }
      setArg(key, argsToSet);
      return i;
    }
    function setArg(key, val, shouldStripQuotes = inputIsString) {
      if (/-/.test(key) && configuration['camel-case-expansion']) {
        const alias = key.split('.').map(function (prop) {
          return camelCase(prop);
        }).join('.');
        addNewAlias(key, alias);
      }
      const value = processValue(key, val, shouldStripQuotes);
      const splitKey = key.split('.');
      setKey(argv, splitKey, value);
      // handle populating aliases of the full key
      if (flags.aliases[key]) {
        flags.aliases[key].forEach(function (x) {
          const keyProperties = x.split('.');
          setKey(argv, keyProperties, value);
        });
      }
      // handle populating aliases of the first element of the dot-notation key
      if (splitKey.length > 1 && configuration['dot-notation']) {
        (flags.aliases[splitKey[0]] || []).forEach(function (x) {
          let keyProperties = x.split('.');
          // expand alias with nested objects in key
          const a = [].concat(splitKey);
          a.shift(); // nuke the old key.
          keyProperties = keyProperties.concat(a);
          // populate alias only if is not already an alias of the full key
          // (already populated above)
          if (!(flags.aliases[key] || []).includes(keyProperties.join('.'))) {
            setKey(argv, keyProperties, value);
          }
        });
      }
      // Set normalize getter and setter when key is in 'normalize' but isn't an array
      if (checkAllAliases(key, flags.normalize) && !checkAllAliases(key, flags.arrays)) {
        const keys = [key].concat(flags.aliases[key] || []);
        keys.forEach(function (key) {
          Object.defineProperty(argvReturn, key, {
            enumerable: true,
            get() {
              return val;
            },
            set(value) {
              val = typeof value === 'string' ? mixin.normalize(value) : value;
            }
          });
        });
      }
    }
    function addNewAlias(key, alias) {
      if (!(flags.aliases[key] && flags.aliases[key].length)) {
        flags.aliases[key] = [alias];
        newAliases[alias] = true;
      }
      if (!(flags.aliases[alias] && flags.aliases[alias].length)) {
        addNewAlias(alias, key);
      }
    }
    function processValue(key, val, shouldStripQuotes) {
      // strings may be quoted, clean this up as we assign values.
      if (shouldStripQuotes) {
        val = stripQuotes(val);
      }
      // handle parsing boolean arguments --foo=true --bar false.
      if (checkAllAliases(key, flags.bools) || checkAllAliases(key, flags.counts)) {
        if (typeof val === 'string') val = val === 'true';
      }
      let value = Array.isArray(val) ? val.map(function (v) {
        return maybeCoerceNumber(key, v);
      }) : maybeCoerceNumber(key, val);
      // increment a count given as arg (either no value or value parsed as boolean)
      if (checkAllAliases(key, flags.counts) && (isUndefined(value) || typeof value === 'boolean')) {
        value = increment();
      }
      // Set normalized value when key is in 'normalize' and in 'arrays'
      if (checkAllAliases(key, flags.normalize) && checkAllAliases(key, flags.arrays)) {
        if (Array.isArray(val)) value = val.map(val => {
          return mixin.normalize(val);
        });else value = mixin.normalize(val);
      }
      return value;
    }
    function maybeCoerceNumber(key, value) {
      if (!configuration['parse-positional-numbers'] && key === '_') return value;
      if (!checkAllAliases(key, flags.strings) && !checkAllAliases(key, flags.bools) && !Array.isArray(value)) {
        const shouldCoerceNumber = looksLikeNumber(value) && configuration['parse-numbers'] && Number.isSafeInteger(Math.floor(parseFloat(`${value}`)));
        if (shouldCoerceNumber || !isUndefined(value) && checkAllAliases(key, flags.numbers)) {
          value = Number(value);
        }
      }
      return value;
    }
    // set args from config.json file, this should be
    // applied last so that defaults can be applied.
    function setConfig(argv) {
      const configLookup = Object.create(null);
      // expand defaults/aliases, in-case any happen to reference
      // the config.json file.
      applyDefaultsAndAliases(configLookup, flags.aliases, defaults);
      Object.keys(flags.configs).forEach(function (configKey) {
        const configPath = argv[configKey] || configLookup[configKey];
        if (configPath) {
          try {
            let config = null;
            const resolvedConfigPath = mixin.resolve(mixin.cwd(), configPath);
            const resolveConfig = flags.configs[configKey];
            if (typeof resolveConfig === 'function') {
              try {
                config = resolveConfig(resolvedConfigPath);
              } catch (e) {
                config = e;
              }
              if (config instanceof Error) {
                error = config;
                return;
              }
            } else {
              config = mixin.require(resolvedConfigPath);
            }
            setConfigObject(config);
          } catch (ex) {
            // Deno will receive a PermissionDenied error if an attempt is
            // made to load config without the --allow-read flag:
            if (ex.name === 'PermissionDenied') error = ex;else if (argv[configKey]) error = Error(__('Invalid JSON config file: %s', configPath));
          }
        }
      });
    }
    // set args from config object.
    // it recursively checks nested objects.
    function setConfigObject(config, prev) {
      Object.keys(config).forEach(function (key) {
        const value = config[key];
        const fullKey = prev ? prev + '.' + key : key;
        // if the value is an inner object and we have dot-notation
        // enabled, treat inner objects in config the same as
        // heavily nested dot notations (foo.bar.apple).
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && configuration['dot-notation']) {
          // if the value is an object but not an array, check nested object
          setConfigObject(value, fullKey);
        } else {
          // setting arguments via CLI takes precedence over
          // values within the config file.
          if (!hasKey(argv, fullKey.split('.')) || checkAllAliases(fullKey, flags.arrays) && configuration['combine-arrays']) {
            setArg(fullKey, value);
          }
        }
      });
    }
    // set all config objects passed in opts
    function setConfigObjects() {
      if (typeof configObjects !== 'undefined') {
        configObjects.forEach(function (configObject) {
          setConfigObject(configObject);
        });
      }
    }
    function applyEnvVars(argv, configOnly) {
      if (typeof envPrefix === 'undefined') return;
      const prefix = typeof envPrefix === 'string' ? envPrefix : '';
      const env = mixin.env();
      Object.keys(env).forEach(function (envVar) {
        if (prefix === '' || envVar.lastIndexOf(prefix, 0) === 0) {
          // get array of nested keys and convert them to camel case
          const keys = envVar.split('__').map(function (key, i) {
            if (i === 0) {
              key = key.substring(prefix.length);
            }
            return camelCase(key);
          });
          if ((configOnly && flags.configs[keys.join('.')] || !configOnly) && !hasKey(argv, keys)) {
            setArg(keys.join('.'), env[envVar]);
          }
        }
      });
    }
    function applyCoercions(argv) {
      let coerce;
      const applied = new Set();
      Object.keys(argv).forEach(function (key) {
        if (!applied.has(key)) {
          // If we haven't already coerced this option via one of its aliases
          coerce = checkAllAliases(key, flags.coercions);
          if (typeof coerce === 'function') {
            try {
              const value = maybeCoerceNumber(key, coerce(argv[key]));
              [].concat(flags.aliases[key] || [], key).forEach(ali => {
                applied.add(ali);
                argv[ali] = value;
              });
            } catch (err) {
              error = err;
            }
          }
        }
      });
    }
    function setPlaceholderKeys(argv) {
      flags.keys.forEach(key => {
        // don't set placeholder keys for dot notation options 'foo.bar'.
        if (~key.indexOf('.')) return;
        if (typeof argv[key] === 'undefined') argv[key] = undefined;
      });
      return argv;
    }
    function applyDefaultsAndAliases(obj, aliases, defaults, canLog = false) {
      Object.keys(defaults).forEach(function (key) {
        if (!hasKey(obj, key.split('.'))) {
          setKey(obj, key.split('.'), defaults[key]);
          if (canLog) defaulted[key] = true;
          (aliases[key] || []).forEach(function (x) {
            if (hasKey(obj, x.split('.'))) return;
            setKey(obj, x.split('.'), defaults[key]);
          });
        }
      });
    }
    function hasKey(obj, keys) {
      let o = obj;
      if (!configuration['dot-notation']) keys = [keys.join('.')];
      keys.slice(0, -1).forEach(function (key) {
        o = o[key] || {};
      });
      const key = keys[keys.length - 1];
      if (typeof o !== 'object') return false;else return key in o;
    }
    function setKey(obj, keys, value) {
      let o = obj;
      if (!configuration['dot-notation']) keys = [keys.join('.')];
      keys.slice(0, -1).forEach(function (key) {
        // TODO(bcoe): in the next major version of yargs, switch to
        // Object.create(null) for dot notation:
        key = sanitizeKey(key);
        if (typeof o === 'object' && o[key] === undefined) {
          o[key] = {};
        }
        if (typeof o[key] !== 'object' || Array.isArray(o[key])) {
          // ensure that o[key] is an array, and that the last item is an empty object.
          if (Array.isArray(o[key])) {
            o[key].push({});
          } else {
            o[key] = [o[key], {}];
          }
          // we want to update the empty object at the end of the o[key] array, so set o to that object
          o = o[key][o[key].length - 1];
        } else {
          o = o[key];
        }
      });
      // TODO(bcoe): in the next major version of yargs, switch to
      // Object.create(null) for dot notation:
      const key = sanitizeKey(keys[keys.length - 1]);
      const isTypeArray = checkAllAliases(keys.join('.'), flags.arrays);
      const isValueArray = Array.isArray(value);
      let duplicate = configuration['duplicate-arguments-array'];
      // nargs has higher priority than duplicate
      if (!duplicate && checkAllAliases(key, flags.nargs)) {
        duplicate = true;
        if (!isUndefined(o[key]) && flags.nargs[key] === 1 || Array.isArray(o[key]) && o[key].length === flags.nargs[key]) {
          o[key] = undefined;
        }
      }
      if (value === increment()) {
        o[key] = increment(o[key]);
      } else if (Array.isArray(o[key])) {
        if (duplicate && isTypeArray && isValueArray) {
          o[key] = configuration['flatten-duplicate-arrays'] ? o[key].concat(value) : (Array.isArray(o[key][0]) ? o[key] : [o[key]]).concat([value]);
        } else if (!duplicate && Boolean(isTypeArray) === Boolean(isValueArray)) {
          o[key] = value;
        } else {
          o[key] = o[key].concat([value]);
        }
      } else if (o[key] === undefined && isTypeArray) {
        o[key] = isValueArray ? value : [value];
      } else if (duplicate && !(o[key] === undefined || checkAllAliases(key, flags.counts) || checkAllAliases(key, flags.bools))) {
        o[key] = [o[key], value];
      } else {
        o[key] = value;
      }
    }
    // extend the aliases list with inferred aliases.
    function extendAliases(...args) {
      args.forEach(function (obj) {
        Object.keys(obj || {}).forEach(function (key) {
          // short-circuit if we've already added a key
          // to the aliases array, for example it might
          // exist in both 'opts.default' and 'opts.key'.
          if (flags.aliases[key]) return;
          flags.aliases[key] = [].concat(aliases[key] || []);
          // For "--option-name", also set argv.optionName
          flags.aliases[key].concat(key).forEach(function (x) {
            if (/-/.test(x) && configuration['camel-case-expansion']) {
              const c = camelCase(x);
              if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                flags.aliases[key].push(c);
                newAliases[c] = true;
              }
            }
          });
          // For "--optionName", also set argv['option-name']
          flags.aliases[key].concat(key).forEach(function (x) {
            if (x.length > 1 && /[A-Z]/.test(x) && configuration['camel-case-expansion']) {
              const c = decamelize(x, '-');
              if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                flags.aliases[key].push(c);
                newAliases[c] = true;
              }
            }
          });
          flags.aliases[key].forEach(function (x) {
            flags.aliases[x] = [key].concat(flags.aliases[key].filter(function (y) {
              return x !== y;
            }));
          });
        });
      });
    }
    function checkAllAliases(key, flag) {
      const toCheck = [].concat(flags.aliases[key] || [], key);
      const keys = Object.keys(flag);
      const setAlias = toCheck.find(key => keys.includes(key));
      return setAlias ? flag[setAlias] : false;
    }
    function hasAnyFlag(key) {
      const flagsKeys = Object.keys(flags);
      const toCheck = [].concat(flagsKeys.map(k => flags[k]));
      return toCheck.some(function (flag) {
        return Array.isArray(flag) ? flag.includes(key) : flag[key];
      });
    }
    function hasFlagsMatching(arg, ...patterns) {
      const toCheck = [].concat(...patterns);
      return toCheck.some(function (pattern) {
        const match = arg.match(pattern);
        return match && hasAnyFlag(match[1]);
      });
    }
    // based on a simplified version of the short flag group parsing logic
    function hasAllShortFlags(arg) {
      // if this is a negative number, or doesn't start with a single hyphen, it's not a short flag group
      if (arg.match(negative) || !arg.match(/^-[^-]+/)) {
        return false;
      }
      let hasAllFlags = true;
      let next;
      const letters = arg.slice(1).split('');
      for (let j = 0; j < letters.length; j++) {
        next = arg.slice(j + 2);
        if (!hasAnyFlag(letters[j])) {
          hasAllFlags = false;
          break;
        }
        if (letters[j + 1] && letters[j + 1] === '=' || next === '-' || /[A-Za-z]/.test(letters[j]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next) || letters[j + 1] && letters[j + 1].match(/\W/)) {
          break;
        }
      }
      return hasAllFlags;
    }
    function isUnknownOptionAsArg(arg) {
      return configuration['unknown-options-as-args'] && isUnknownOption(arg);
    }
    function isUnknownOption(arg) {
      arg = arg.replace(/^-{3,}/, '--');
      // ignore negative numbers
      if (arg.match(negative)) {
        return false;
      }
      // if this is a short option group and all of them are configured, it isn't unknown
      if (hasAllShortFlags(arg)) {
        return false;
      }
      // e.g. '--count=2'
      const flagWithEquals = /^-+([^=]+?)=[\s\S]*$/;
      // e.g. '-a' or '--arg'
      const normalFlag = /^-+([^=]+?)$/;
      // e.g. '-a-'
      const flagEndingInHyphen = /^-+([^=]+?)-$/;
      // e.g. '-abc123'
      const flagEndingInDigits = /^-+([^=]+?\d+)$/;
      // e.g. '-a/usr/local'
      const flagEndingInNonWordCharacters = /^-+([^=]+?)\W+.*$/;
      // check the different types of flag styles, including negatedBoolean, a pattern defined near the start of the parse method
      return !hasFlagsMatching(arg, flagWithEquals, negatedBoolean, normalFlag, flagEndingInHyphen, flagEndingInDigits, flagEndingInNonWordCharacters);
    }
    // make a best effort to pick a default value
    // for an option based on name and type.
    function defaultValue(key) {
      if (!checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts) && `${key}` in defaults) {
        return defaults[key];
      } else {
        return defaultForType(guessType(key));
      }
    }
    // return a default value, given the type of a flag.,
    function defaultForType(type) {
      const def = {
        [DefaultValuesForTypeKey.BOOLEAN]: true,
        [DefaultValuesForTypeKey.STRING]: '',
        [DefaultValuesForTypeKey.NUMBER]: undefined,
        [DefaultValuesForTypeKey.ARRAY]: []
      };
      return def[type];
    }
    // given a flag, enforce a default type.
    function guessType(key) {
      let type = DefaultValuesForTypeKey.BOOLEAN;
      if (checkAllAliases(key, flags.strings)) type = DefaultValuesForTypeKey.STRING;else if (checkAllAliases(key, flags.numbers)) type = DefaultValuesForTypeKey.NUMBER;else if (checkAllAliases(key, flags.bools)) type = DefaultValuesForTypeKey.BOOLEAN;else if (checkAllAliases(key, flags.arrays)) type = DefaultValuesForTypeKey.ARRAY;
      return type;
    }
    function isUndefined(num) {
      return num === undefined;
    }
    // check user configuration settings for inconsistencies
    function checkConfiguration() {
      // count keys should not be set as array/narg
      Object.keys(flags.counts).find(key => {
        if (checkAllAliases(key, flags.arrays)) {
          error = Error(__('Invalid configuration: %s, opts.count excludes opts.array.', key));
          return true;
        } else if (checkAllAliases(key, flags.nargs)) {
          error = Error(__('Invalid configuration: %s, opts.count excludes opts.narg.', key));
          return true;
        }
        return false;
      });
    }
    return {
      aliases: Object.assign({}, flags.aliases),
      argv: Object.assign(argvReturn, argv),
      configuration: configuration,
      defaulted: Object.assign({}, defaulted),
      error: error,
      newAliases: Object.assign({}, newAliases)
    };
  }
}
// if any aliases reference each other, we should
// merge them together.
function combineAliases(aliases) {
  const aliasArrays = [];
  const combined = Object.create(null);
  let change = true;
  // turn alias lookup hash {key: ['alias1', 'alias2']} into
  // a simple array ['key', 'alias1', 'alias2']
  Object.keys(aliases).forEach(function (key) {
    aliasArrays.push([].concat(aliases[key], key));
  });
  // combine arrays until zero changes are
  // made in an iteration.
  while (change) {
    change = false;
    for (let i = 0; i < aliasArrays.length; i++) {
      for (let ii = i + 1; ii < aliasArrays.length; ii++) {
        const intersect = aliasArrays[i].filter(function (v) {
          return aliasArrays[ii].indexOf(v) !== -1;
        });
        if (intersect.length) {
          aliasArrays[i] = aliasArrays[i].concat(aliasArrays[ii]);
          aliasArrays.splice(ii, 1);
          change = true;
          break;
        }
      }
    }
  }
  // map arrays back to the hash-lookup (de-dupe while
  // we're at it).
  aliasArrays.forEach(function (aliasArray) {
    aliasArray = aliasArray.filter(function (v, i, self) {
      return self.indexOf(v) === i;
    });
    const lastAlias = aliasArray.pop();
    if (lastAlias !== undefined && typeof lastAlias === 'string') {
      combined[lastAlias] = aliasArray;
    }
  });
  return combined;
}
// this function should only be called when a count is given as an arg
// it is NOT called to set a default value
// thus we can start the count at 1 instead of 0
function increment(orig) {
  return orig !== undefined ? orig + 1 : 1;
}
// TODO(bcoe): in the next major version of yargs, switch to
// Object.create(null) for dot notation:
function sanitizeKey(key) {
  if (key === '__proto__') return '___proto___';
  return key;
}
function stripQuotes(val) {
  return typeof val === 'string' && (val[0] === "'" || val[0] === '"') && val[val.length - 1] === val[0] ? val.substring(1, val.length - 1) : val;
}

/**
 * @fileoverview Main entrypoint for libraries using yargs-parser in Node.js
 * CJS and ESM environments.
 *
 * @license
 * Copyright (c) 2016, Contributors
 * SPDX-License-Identifier: ISC
 */
var _a, _b, _c;
// See https://github.com/yargs/yargs-parser#supported-nodejs-versions for our
// version support policy. The YARGS_MIN_NODE_VERSION is used for testing only.
const minNodeVersion = process && process.env && process.env.YARGS_MIN_NODE_VERSION ? Number(process.env.YARGS_MIN_NODE_VERSION) : 12;
const nodeVersion = (_b = (_a = process === null || process === void 0 ? void 0 : process.versions) === null || _a === void 0 ? void 0 : _a.node) !== null && _b !== void 0 ? _b : (_c = process === null || process === void 0 ? void 0 : process.version) === null || _c === void 0 ? void 0 : _c.slice(1);
if (nodeVersion) {
  const major = Number(nodeVersion.match(/^([^.]+)/)[1]);
  if (major < minNodeVersion) {
    throw Error(`yargs parser supports a minimum Node.js version of ${minNodeVersion}. Read our version support policy: https://github.com/yargs/yargs-parser#supported-nodejs-versions`);
  }
}
// Creates a yargs-parser instance using Node.js standard libraries:
const env = process ? process.env : {};
const parser = new YargsParser({
  cwd: process.cwd,
  env: () => {
    return env;
  },
  format,
  normalize,
  resolve,
  // TODO: figure  out a  way to combine ESM and CJS coverage, such  that
  // we can exercise all the lines below:
  require: path => {
    if (typeof require !== 'undefined') {
      return require(path);
    } else if (path.match(/\.json$/)) {
      // Addresses: https://github.com/yargs/yargs/issues/2040
      return JSON.parse(readFileSync(path, 'utf8'));
    } else {
      throw Error('only .json config files are supported in ESM');
    }
  }
});
const yargsParser = function Parser(args, opts) {
  const result = parser.parse(args.slice(), opts);
  return result.argv;
};
yargsParser.detailed = function (args, opts) {
  return parser.parse(args.slice(), opts);
};
yargsParser.camelCase = camelCase;
yargsParser.decamelize = decamelize;
yargsParser.looksLikeNumber = looksLikeNumber;

function getProcessArgvBinIndex() {
  if (isBundledElectronApp()) return 0;
  return 1;
}
function isBundledElectronApp() {
  return isElectronApp() && !process.defaultApp;
}
function isElectronApp() {
  return !!process.versions.electron;
}
function hideBin(argv) {
  return argv.slice(getProcessArgvBinIndex() + 1);
}
function getProcessArgvBin() {
  return process.argv[getProcessArgvBinIndex()];
}

class YError extends Error {
  constructor(msg) {
    super(msg || 'yargs error');
    this.name = 'YError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YError);
    }
  }
}

var shim$3 = {
  fs: {
    readFileSync,
    writeFile
  },
  format,
  resolve,
  exists: file => {
    try {
      return statSync(file).isFile();
    } catch (err) {
      return false;
    }
  }
};

let shim$2;
class Y18N {
  constructor(opts) {
    // configurable options.
    opts = opts || {};
    this.directory = opts.directory || './locales';
    this.updateFiles = typeof opts.updateFiles === 'boolean' ? opts.updateFiles : true;
    this.locale = opts.locale || 'en';
    this.fallbackToLanguage = typeof opts.fallbackToLanguage === 'boolean' ? opts.fallbackToLanguage : true;
    // internal stuff.
    this.cache = Object.create(null);
    this.writeQueue = [];
  }
  __(...args) {
    if (typeof arguments[0] !== 'string') {
      return this._taggedLiteral(arguments[0], ...arguments);
    }
    const str = args.shift();
    let cb = function () {}; // start with noop.
    if (typeof args[args.length - 1] === 'function') cb = args.pop();
    cb = cb || function () {}; // noop.
    if (!this.cache[this.locale]) this._readLocaleFile();
    // we've observed a new string, update the language file.
    if (!this.cache[this.locale][str] && this.updateFiles) {
      this.cache[this.locale][str] = str;
      // include the current directory and locale,
      // since these values could change before the
      // write is performed.
      this._enqueueWrite({
        directory: this.directory,
        locale: this.locale,
        cb
      });
    } else {
      cb();
    }
    return shim$2.format.apply(shim$2.format, [this.cache[this.locale][str] || str].concat(args));
  }
  __n() {
    const args = Array.prototype.slice.call(arguments);
    const singular = args.shift();
    const plural = args.shift();
    const quantity = args.shift();
    let cb = function () {}; // start with noop.
    if (typeof args[args.length - 1] === 'function') cb = args.pop();
    if (!this.cache[this.locale]) this._readLocaleFile();
    let str = quantity === 1 ? singular : plural;
    if (this.cache[this.locale][singular]) {
      const entry = this.cache[this.locale][singular];
      str = entry[quantity === 1 ? 'one' : 'other'];
    }
    // we've observed a new string, update the language file.
    if (!this.cache[this.locale][singular] && this.updateFiles) {
      this.cache[this.locale][singular] = {
        one: singular,
        other: plural
      };
      // include the current directory and locale,
      // since these values could change before the
      // write is performed.
      this._enqueueWrite({
        directory: this.directory,
        locale: this.locale,
        cb
      });
    } else {
      cb();
    }
    // if a %d placeholder is provided, add quantity
    // to the arguments expanded by util.format.
    const values = [str];
    if (~str.indexOf('%d')) values.push(quantity);
    return shim$2.format.apply(shim$2.format, values.concat(args));
  }
  setLocale(locale) {
    this.locale = locale;
  }
  getLocale() {
    return this.locale;
  }
  updateLocale(obj) {
    if (!this.cache[this.locale]) this._readLocaleFile();
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        this.cache[this.locale][key] = obj[key];
      }
    }
  }
  _taggedLiteral(parts, ...args) {
    let str = '';
    parts.forEach(function (part, i) {
      const arg = args[i + 1];
      str += part;
      if (typeof arg !== 'undefined') {
        str += '%s';
      }
    });
    return this.__.apply(this, [str].concat([].slice.call(args, 1)));
  }
  _enqueueWrite(work) {
    this.writeQueue.push(work);
    if (this.writeQueue.length === 1) this._processWriteQueue();
  }
  _processWriteQueue() {
    const _this = this;
    const work = this.writeQueue[0];
    // destructure the enqueued work.
    const directory = work.directory;
    const locale = work.locale;
    const cb = work.cb;
    const languageFile = this._resolveLocaleFile(directory, locale);
    const serializedLocale = JSON.stringify(this.cache[locale], null, 2);
    shim$2.fs.writeFile(languageFile, serializedLocale, 'utf-8', function (err) {
      _this.writeQueue.shift();
      if (_this.writeQueue.length > 0) _this._processWriteQueue();
      cb(err);
    });
  }
  _readLocaleFile() {
    let localeLookup = {};
    const languageFile = this._resolveLocaleFile(this.directory, this.locale);
    try {
      // When using a bundler such as webpack, readFileSync may not be defined:
      if (shim$2.fs.readFileSync) {
        localeLookup = JSON.parse(shim$2.fs.readFileSync(languageFile, 'utf-8'));
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        err.message = 'syntax error in ' + languageFile;
      }
      if (err.code === 'ENOENT') localeLookup = {};else throw err;
    }
    this.cache[this.locale] = localeLookup;
  }
  _resolveLocaleFile(directory, locale) {
    let file = shim$2.resolve(directory, './', locale + '.json');
    if (this.fallbackToLanguage && !this._fileExistsSync(file) && ~locale.lastIndexOf('_')) {
      // attempt fallback to language only
      const languageFile = shim$2.resolve(directory, './', locale.split('_')[0] + '.json');
      if (this._fileExistsSync(languageFile)) file = languageFile;
    }
    return file;
  }
  _fileExistsSync(file) {
    return shim$2.exists(file);
  }
}
function y18n$1(opts, _shim) {
  shim$2 = _shim;
  const y18n = new Y18N(opts);
  return {
    __: y18n.__.bind(y18n),
    __n: y18n.__n.bind(y18n),
    setLocale: y18n.setLocale.bind(y18n),
    getLocale: y18n.getLocale.bind(y18n),
    updateLocale: y18n.updateLocale.bind(y18n),
    locale: y18n.locale
  };
}

const y18n = (opts) => {
  return y18n$1(opts, shim$3)
};

const REQUIRE_ERROR = 'require is not supported by ESM';
const REQUIRE_DIRECTORY_ERROR = 'loading a directory of commands is not supported yet for ESM';

let __dirname;
try {
  __dirname = fileURLToPath(import.meta.url);
} catch (e) {
  __dirname = process.cwd();
}
const mainFilename = __dirname.substring(0, __dirname.lastIndexOf('node_modules'));

var shim$1 = {
  assert: {
    notStrictEqual,
    strictEqual
  },
  cliui: ui,
  findUp: escalade,
  getEnv: (key) => {
    return process.env[key]
  },
  inspect,
  getCallerFile: () => {
    throw new YError(REQUIRE_DIRECTORY_ERROR)
  },
  getProcessArgvBin,
  mainFilename: mainFilename || process.cwd(),
  Parser: yargsParser,
  path: {
    basename,
    dirname,
    extname,
    relative,
    resolve
  },
  process: {
    argv: () => process.argv,
    cwd: process.cwd,
    emitWarning: (warning, type) => process.emitWarning(warning, type),
    execPath: () => process.execPath,
    exit: process.exit,
    nextTick: process.nextTick,
    stdColumns: typeof process.stdout.columns !== 'undefined' ? process.stdout.columns : null
  },
  readFileSync,
  require: () => {
    throw new YError(REQUIRE_ERROR)
  },
  requireDirectory: () => {
    throw new YError(REQUIRE_DIRECTORY_ERROR)
  },
  stringWidth: (str) => {
    return [...str].length
  },
  y18n: y18n({
    directory: resolve(__dirname, '../../../locales'),
    updateFiles: false
  })
};

function assertNotStrictEqual(actual, expected, shim, message) {
  shim.assert.notStrictEqual(actual, expected, message);
}
function assertSingleKey(actual, shim) {
  shim.assert.strictEqual(typeof actual, 'string');
}
function objectKeys(object) {
  return Object.keys(object);
}

function isPromise(maybePromise) {
  return !!maybePromise && !!maybePromise.then && typeof maybePromise.then === 'function';
}

function parseCommand(cmd) {
  const extraSpacesStrippedCommand = cmd.replace(/\s{2,}/g, ' ');
  const splitCommand = extraSpacesStrippedCommand.split(/\s+(?![^[]*]|[^<]*>)/);
  const bregex = /\.*[\][<>]/g;
  const firstCommand = splitCommand.shift();
  if (!firstCommand) throw new Error(`No command found in: ${cmd}`);
  const parsedCommand = {
    cmd: firstCommand.replace(bregex, ''),
    demanded: [],
    optional: []
  };
  splitCommand.forEach((cmd, i) => {
    let variadic = false;
    cmd = cmd.replace(/\s/g, '');
    if (/\.+[\]>]/.test(cmd) && i === splitCommand.length - 1) variadic = true;
    if (/^\[/.test(cmd)) {
      parsedCommand.optional.push({
        cmd: cmd.replace(bregex, '').split('|'),
        variadic
      });
    } else {
      parsedCommand.demanded.push({
        cmd: cmd.replace(bregex, '').split('|'),
        variadic
      });
    }
  });
  return parsedCommand;
}

const positionName = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
function argsert(arg1, arg2, arg3) {
  function parseArgs() {
    return typeof arg1 === 'object' ? [{
      demanded: [],
      optional: []
    }, arg1, arg2] : [parseCommand(`cmd ${arg1}`), arg2, arg3];
  }
  try {
    let position = 0;
    const [parsed, callerArguments, _length] = parseArgs();
    const args = [].slice.call(callerArguments);
    while (args.length && args[args.length - 1] === undefined) args.pop();
    const length = _length || args.length;
    if (length < parsed.demanded.length) {
      throw new YError(`Not enough arguments provided. Expected ${parsed.demanded.length} but received ${args.length}.`);
    }
    const totalCommands = parsed.demanded.length + parsed.optional.length;
    if (length > totalCommands) {
      throw new YError(`Too many arguments provided. Expected max ${totalCommands} but received ${length}.`);
    }
    parsed.demanded.forEach(demanded => {
      const arg = args.shift();
      const observedType = guessType(arg);
      const matchingTypes = demanded.cmd.filter(type => type === observedType || type === '*');
      if (matchingTypes.length === 0) argumentTypeError(observedType, demanded.cmd, position);
      position += 1;
    });
    parsed.optional.forEach(optional => {
      if (args.length === 0) return;
      const arg = args.shift();
      const observedType = guessType(arg);
      const matchingTypes = optional.cmd.filter(type => type === observedType || type === '*');
      if (matchingTypes.length === 0) argumentTypeError(observedType, optional.cmd, position);
      position += 1;
    });
  } catch (err) {
    console.warn(err.stack);
  }
}
function guessType(arg) {
  if (Array.isArray(arg)) {
    return 'array';
  } else if (arg === null) {
    return 'null';
  }
  return typeof arg;
}
function argumentTypeError(observedType, allowedTypes, position) {
  throw new YError(`Invalid ${positionName[position] || 'manyith'} argument. Expected ${allowedTypes.join(' or ')} but received ${observedType}.`);
}

class GlobalMiddleware {
  constructor(yargs) {
    this.globalMiddleware = [];
    this.frozens = [];
    this.yargs = yargs;
  }
  addMiddleware(callback, applyBeforeValidation, global = true, mutates = false) {
    argsert('<array|function> [boolean] [boolean] [boolean]', [callback, applyBeforeValidation, global], arguments.length);
    if (Array.isArray(callback)) {
      for (let i = 0; i < callback.length; i++) {
        if (typeof callback[i] !== 'function') {
          throw Error('middleware must be a function');
        }
        const m = callback[i];
        m.applyBeforeValidation = applyBeforeValidation;
        m.global = global;
      }
      Array.prototype.push.apply(this.globalMiddleware, callback);
    } else if (typeof callback === 'function') {
      const m = callback;
      m.applyBeforeValidation = applyBeforeValidation;
      m.global = global;
      m.mutates = mutates;
      this.globalMiddleware.push(callback);
    }
    return this.yargs;
  }
  addCoerceMiddleware(callback, option) {
    const aliases = this.yargs.getAliases();
    this.globalMiddleware = this.globalMiddleware.filter(m => {
      const toCheck = [...(aliases[option] || []), option];
      if (!m.option) return true;else return !toCheck.includes(m.option);
    });
    callback.option = option;
    return this.addMiddleware(callback, true, true, true);
  }
  getMiddleware() {
    return this.globalMiddleware;
  }
  freeze() {
    this.frozens.push([...this.globalMiddleware]);
  }
  unfreeze() {
    const frozen = this.frozens.pop();
    if (frozen !== undefined) this.globalMiddleware = frozen;
  }
  reset() {
    this.globalMiddleware = this.globalMiddleware.filter(m => m.global);
  }
}
function commandMiddlewareFactory(commandMiddleware) {
  if (!commandMiddleware) return [];
  return commandMiddleware.map(middleware => {
    middleware.applyBeforeValidation = false;
    return middleware;
  });
}
function applyMiddleware(argv, yargs, middlewares, beforeValidation) {
  return middlewares.reduce((acc, middleware) => {
    if (middleware.applyBeforeValidation !== beforeValidation) {
      return acc;
    }
    if (middleware.mutates) {
      if (middleware.applied) return acc;
      middleware.applied = true;
    }
    if (isPromise(acc)) {
      return acc.then(initialObj => Promise.all([initialObj, middleware(initialObj, yargs)])).then(([initialObj, middlewareObj]) => Object.assign(initialObj, middlewareObj));
    } else {
      const result = middleware(acc, yargs);
      return isPromise(result) ? result.then(middlewareObj => Object.assign(acc, middlewareObj)) : Object.assign(acc, result);
    }
  }, argv);
}

function maybeAsyncResult(getResult, resultHandler, errorHandler = err => {
  throw err;
}) {
  try {
    const result = isFunction(getResult) ? getResult() : getResult;
    return isPromise(result) ? result.then(result => resultHandler(result)) : resultHandler(result);
  } catch (err) {
    return errorHandler(err);
  }
}
function isFunction(arg) {
  return typeof arg === 'function';
}

function whichModule(exported) {
  if (typeof require === 'undefined') return null;
  for (let i = 0, files = Object.keys(require.cache), mod; i < files.length; i++) {
    mod = require.cache[files[i]];
    if (mod.exports === exported) return mod;
  }
  return null;
}

const DEFAULT_MARKER = /(^\*)|(^\$0)/;
class CommandInstance {
  constructor(usage, validation, globalMiddleware, shim) {
    this.requireCache = new Set();
    this.handlers = {};
    this.aliasMap = {};
    this.frozens = [];
    this.shim = shim;
    this.usage = usage;
    this.globalMiddleware = globalMiddleware;
    this.validation = validation;
  }
  addDirectory(dir, req, callerFile, opts) {
    opts = opts || {};
    if (typeof opts.recurse !== 'boolean') opts.recurse = false;
    if (!Array.isArray(opts.extensions)) opts.extensions = ['js'];
    const parentVisit = typeof opts.visit === 'function' ? opts.visit : o => o;
    opts.visit = (obj, joined, filename) => {
      const visited = parentVisit(obj, joined, filename);
      if (visited) {
        if (this.requireCache.has(joined)) return visited;else this.requireCache.add(joined);
        this.addHandler(visited);
      }
      return visited;
    };
    this.shim.requireDirectory({
      require: req,
      filename: callerFile
    }, dir, opts);
  }
  addHandler(cmd, description, builder, handler, commandMiddleware, deprecated) {
    let aliases = [];
    const middlewares = commandMiddlewareFactory(commandMiddleware);
    handler = handler || (() => {});
    if (Array.isArray(cmd)) {
      if (isCommandAndAliases(cmd)) {
        [cmd, ...aliases] = cmd;
      } else {
        for (const command of cmd) {
          this.addHandler(command);
        }
      }
    } else if (isCommandHandlerDefinition(cmd)) {
      let command = Array.isArray(cmd.command) || typeof cmd.command === 'string' ? cmd.command : this.moduleName(cmd);
      if (cmd.aliases) command = [].concat(command).concat(cmd.aliases);
      this.addHandler(command, this.extractDesc(cmd), cmd.builder, cmd.handler, cmd.middlewares, cmd.deprecated);
      return;
    } else if (isCommandBuilderDefinition(builder)) {
      this.addHandler([cmd].concat(aliases), description, builder.builder, builder.handler, builder.middlewares, builder.deprecated);
      return;
    }
    if (typeof cmd === 'string') {
      const parsedCommand = parseCommand(cmd);
      aliases = aliases.map(alias => parseCommand(alias).cmd);
      let isDefault = false;
      const parsedAliases = [parsedCommand.cmd].concat(aliases).filter(c => {
        if (DEFAULT_MARKER.test(c)) {
          isDefault = true;
          return false;
        }
        return true;
      });
      if (parsedAliases.length === 0 && isDefault) parsedAliases.push('$0');
      if (isDefault) {
        parsedCommand.cmd = parsedAliases[0];
        aliases = parsedAliases.slice(1);
        cmd = cmd.replace(DEFAULT_MARKER, parsedCommand.cmd);
      }
      aliases.forEach(alias => {
        this.aliasMap[alias] = parsedCommand.cmd;
      });
      if (description !== false) {
        this.usage.command(cmd, description, isDefault, aliases, deprecated);
      }
      this.handlers[parsedCommand.cmd] = {
        original: cmd,
        description,
        handler,
        builder: builder || {},
        middlewares,
        deprecated,
        demanded: parsedCommand.demanded,
        optional: parsedCommand.optional
      };
      if (isDefault) this.defaultCommand = this.handlers[parsedCommand.cmd];
    }
  }
  getCommandHandlers() {
    return this.handlers;
  }
  getCommands() {
    return Object.keys(this.handlers).concat(Object.keys(this.aliasMap));
  }
  hasDefaultCommand() {
    return !!this.defaultCommand;
  }
  runCommand(command, yargs, parsed, commandIndex, helpOnly, helpOrVersionSet) {
    const commandHandler = this.handlers[command] || this.handlers[this.aliasMap[command]] || this.defaultCommand;
    const currentContext = yargs.getInternalMethods().getContext();
    const parentCommands = currentContext.commands.slice();
    const isDefaultCommand = !command;
    if (command) {
      currentContext.commands.push(command);
      currentContext.fullCommands.push(commandHandler.original);
    }
    const builderResult = this.applyBuilderUpdateUsageAndParse(isDefaultCommand, commandHandler, yargs, parsed.aliases, parentCommands, commandIndex, helpOnly, helpOrVersionSet);
    return isPromise(builderResult) ? builderResult.then(result => this.applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, result.innerArgv, currentContext, helpOnly, result.aliases, yargs)) : this.applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, builderResult.innerArgv, currentContext, helpOnly, builderResult.aliases, yargs);
  }
  applyBuilderUpdateUsageAndParse(isDefaultCommand, commandHandler, yargs, aliases, parentCommands, commandIndex, helpOnly, helpOrVersionSet) {
    const builder = commandHandler.builder;
    let innerYargs = yargs;
    if (isCommandBuilderCallback(builder)) {
      yargs.getInternalMethods().getUsageInstance().freeze();
      const builderOutput = builder(yargs.getInternalMethods().reset(aliases), helpOrVersionSet);
      if (isPromise(builderOutput)) {
        return builderOutput.then(output => {
          innerYargs = isYargsInstance(output) ? output : yargs;
          return this.parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly);
        });
      }
    } else if (isCommandBuilderOptionDefinitions(builder)) {
      yargs.getInternalMethods().getUsageInstance().freeze();
      innerYargs = yargs.getInternalMethods().reset(aliases);
      Object.keys(commandHandler.builder).forEach(key => {
        innerYargs.option(key, builder[key]);
      });
    }
    return this.parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly);
  }
  parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly) {
    if (isDefaultCommand) innerYargs.getInternalMethods().getUsageInstance().unfreeze(true);
    if (this.shouldUpdateUsage(innerYargs)) {
      innerYargs.getInternalMethods().getUsageInstance().usage(this.usageFromParentCommandsCommandHandler(parentCommands, commandHandler), commandHandler.description);
    }
    const innerArgv = innerYargs.getInternalMethods().runYargsParserAndExecuteCommands(null, undefined, true, commandIndex, helpOnly);
    return isPromise(innerArgv) ? innerArgv.then(argv => ({
      aliases: innerYargs.parsed.aliases,
      innerArgv: argv
    })) : {
      aliases: innerYargs.parsed.aliases,
      innerArgv: innerArgv
    };
  }
  shouldUpdateUsage(yargs) {
    return !yargs.getInternalMethods().getUsageInstance().getUsageDisabled() && yargs.getInternalMethods().getUsageInstance().getUsage().length === 0;
  }
  usageFromParentCommandsCommandHandler(parentCommands, commandHandler) {
    const c = DEFAULT_MARKER.test(commandHandler.original) ? commandHandler.original.replace(DEFAULT_MARKER, '').trim() : commandHandler.original;
    const pc = parentCommands.filter(c => {
      return !DEFAULT_MARKER.test(c);
    });
    pc.push(c);
    return `$0 ${pc.join(' ')}`;
  }
  handleValidationAndGetResult(isDefaultCommand, commandHandler, innerArgv, currentContext, aliases, yargs, middlewares, positionalMap) {
    if (!yargs.getInternalMethods().getHasOutput()) {
      const validation = yargs.getInternalMethods().runValidation(aliases, positionalMap, yargs.parsed.error, isDefaultCommand);
      innerArgv = maybeAsyncResult(innerArgv, result => {
        validation(result);
        return result;
      });
    }
    if (commandHandler.handler && !yargs.getInternalMethods().getHasOutput()) {
      yargs.getInternalMethods().setHasOutput();
      const populateDoubleDash = !!yargs.getOptions().configuration['populate--'];
      yargs.getInternalMethods().postProcess(innerArgv, populateDoubleDash, false, false);
      innerArgv = applyMiddleware(innerArgv, yargs, middlewares, false);
      innerArgv = maybeAsyncResult(innerArgv, result => {
        const handlerResult = commandHandler.handler(result);
        return isPromise(handlerResult) ? handlerResult.then(() => result) : result;
      });
      if (!isDefaultCommand) {
        yargs.getInternalMethods().getUsageInstance().cacheHelpMessage();
      }
      if (isPromise(innerArgv) && !yargs.getInternalMethods().hasParseCallback()) {
        innerArgv.catch(error => {
          try {
            yargs.getInternalMethods().getUsageInstance().fail(null, error);
          } catch (_err) {}
        });
      }
    }
    if (!isDefaultCommand) {
      currentContext.commands.pop();
      currentContext.fullCommands.pop();
    }
    return innerArgv;
  }
  applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, innerArgv, currentContext, helpOnly, aliases, yargs) {
    let positionalMap = {};
    if (helpOnly) return innerArgv;
    if (!yargs.getInternalMethods().getHasOutput()) {
      positionalMap = this.populatePositionals(commandHandler, innerArgv, currentContext, yargs);
    }
    const middlewares = this.globalMiddleware.getMiddleware().slice(0).concat(commandHandler.middlewares);
    const maybePromiseArgv = applyMiddleware(innerArgv, yargs, middlewares, true);
    return isPromise(maybePromiseArgv) ? maybePromiseArgv.then(resolvedInnerArgv => this.handleValidationAndGetResult(isDefaultCommand, commandHandler, resolvedInnerArgv, currentContext, aliases, yargs, middlewares, positionalMap)) : this.handleValidationAndGetResult(isDefaultCommand, commandHandler, maybePromiseArgv, currentContext, aliases, yargs, middlewares, positionalMap);
  }
  populatePositionals(commandHandler, argv, context, yargs) {
    argv._ = argv._.slice(context.commands.length);
    const demanded = commandHandler.demanded.slice(0);
    const optional = commandHandler.optional.slice(0);
    const positionalMap = {};
    this.validation.positionalCount(demanded.length, argv._.length);
    while (demanded.length) {
      const demand = demanded.shift();
      this.populatePositional(demand, argv, positionalMap);
    }
    while (optional.length) {
      const maybe = optional.shift();
      this.populatePositional(maybe, argv, positionalMap);
    }
    argv._ = context.commands.concat(argv._.map(a => '' + a));
    this.postProcessPositionals(argv, positionalMap, this.cmdToParseOptions(commandHandler.original), yargs);
    return positionalMap;
  }
  populatePositional(positional, argv, positionalMap) {
    const cmd = positional.cmd[0];
    if (positional.variadic) {
      positionalMap[cmd] = argv._.splice(0).map(String);
    } else {
      if (argv._.length) positionalMap[cmd] = [String(argv._.shift())];
    }
  }
  cmdToParseOptions(cmdString) {
    const parseOptions = {
      array: [],
      default: {},
      alias: {},
      demand: {}
    };
    const parsed = parseCommand(cmdString);
    parsed.demanded.forEach(d => {
      const [cmd, ...aliases] = d.cmd;
      if (d.variadic) {
        parseOptions.array.push(cmd);
        parseOptions.default[cmd] = [];
      }
      parseOptions.alias[cmd] = aliases;
      parseOptions.demand[cmd] = true;
    });
    parsed.optional.forEach(o => {
      const [cmd, ...aliases] = o.cmd;
      if (o.variadic) {
        parseOptions.array.push(cmd);
        parseOptions.default[cmd] = [];
      }
      parseOptions.alias[cmd] = aliases;
    });
    return parseOptions;
  }
  postProcessPositionals(argv, positionalMap, parseOptions, yargs) {
    const options = Object.assign({}, yargs.getOptions());
    options.default = Object.assign(parseOptions.default, options.default);
    for (const key of Object.keys(parseOptions.alias)) {
      options.alias[key] = (options.alias[key] || []).concat(parseOptions.alias[key]);
    }
    options.array = options.array.concat(parseOptions.array);
    options.config = {};
    const unparsed = [];
    Object.keys(positionalMap).forEach(key => {
      positionalMap[key].map(value => {
        if (options.configuration['unknown-options-as-args']) options.key[key] = true;
        unparsed.push(`--${key}`);
        unparsed.push(value);
      });
    });
    if (!unparsed.length) return;
    const config = Object.assign({}, options.configuration, {
      'populate--': false
    });
    const parsed = this.shim.Parser.detailed(unparsed, Object.assign({}, options, {
      configuration: config
    }));
    if (parsed.error) {
      yargs.getInternalMethods().getUsageInstance().fail(parsed.error.message, parsed.error);
    } else {
      const positionalKeys = Object.keys(positionalMap);
      Object.keys(positionalMap).forEach(key => {
        positionalKeys.push(...parsed.aliases[key]);
      });
      Object.keys(parsed.argv).forEach(key => {
        if (positionalKeys.includes(key)) {
          if (!positionalMap[key]) positionalMap[key] = parsed.argv[key];
          if (!this.isInConfigs(yargs, key) && !this.isDefaulted(yargs, key) && Object.prototype.hasOwnProperty.call(argv, key) && Object.prototype.hasOwnProperty.call(parsed.argv, key) && (Array.isArray(argv[key]) || Array.isArray(parsed.argv[key]))) {
            argv[key] = [].concat(argv[key], parsed.argv[key]);
          } else {
            argv[key] = parsed.argv[key];
          }
        }
      });
    }
  }
  isDefaulted(yargs, key) {
    const {
      default: defaults
    } = yargs.getOptions();
    return Object.prototype.hasOwnProperty.call(defaults, key) || Object.prototype.hasOwnProperty.call(defaults, this.shim.Parser.camelCase(key));
  }
  isInConfigs(yargs, key) {
    const {
      configObjects
    } = yargs.getOptions();
    return configObjects.some(c => Object.prototype.hasOwnProperty.call(c, key)) || configObjects.some(c => Object.prototype.hasOwnProperty.call(c, this.shim.Parser.camelCase(key)));
  }
  runDefaultBuilderOn(yargs) {
    if (!this.defaultCommand) return;
    if (this.shouldUpdateUsage(yargs)) {
      const commandString = DEFAULT_MARKER.test(this.defaultCommand.original) ? this.defaultCommand.original : this.defaultCommand.original.replace(/^[^[\]<>]*/, '$0 ');
      yargs.getInternalMethods().getUsageInstance().usage(commandString, this.defaultCommand.description);
    }
    const builder = this.defaultCommand.builder;
    if (isCommandBuilderCallback(builder)) {
      return builder(yargs, true);
    } else if (!isCommandBuilderDefinition(builder)) {
      Object.keys(builder).forEach(key => {
        yargs.option(key, builder[key]);
      });
    }
    return undefined;
  }
  moduleName(obj) {
    const mod = whichModule(obj);
    if (!mod) throw new Error(`No command name given for module: ${this.shim.inspect(obj)}`);
    return this.commandFromFilename(mod.filename);
  }
  commandFromFilename(filename) {
    return this.shim.path.basename(filename, this.shim.path.extname(filename));
  }
  extractDesc({
    describe,
    description,
    desc
  }) {
    for (const test of [describe, description, desc]) {
      if (typeof test === 'string' || test === false) return test;
      assertNotStrictEqual(test, true, this.shim);
    }
    return false;
  }
  freeze() {
    this.frozens.push({
      handlers: this.handlers,
      aliasMap: this.aliasMap,
      defaultCommand: this.defaultCommand
    });
  }
  unfreeze() {
    const frozen = this.frozens.pop();
    assertNotStrictEqual(frozen, undefined, this.shim);
    ({
      handlers: this.handlers,
      aliasMap: this.aliasMap,
      defaultCommand: this.defaultCommand
    } = frozen);
  }
  reset() {
    this.handlers = {};
    this.aliasMap = {};
    this.defaultCommand = undefined;
    this.requireCache = new Set();
    return this;
  }
}
function command(usage, validation, globalMiddleware, shim) {
  return new CommandInstance(usage, validation, globalMiddleware, shim);
}
function isCommandBuilderDefinition(builder) {
  return typeof builder === 'object' && !!builder.builder && typeof builder.handler === 'function';
}
function isCommandAndAliases(cmd) {
  return cmd.every(c => typeof c === 'string');
}
function isCommandBuilderCallback(builder) {
  return typeof builder === 'function';
}
function isCommandBuilderOptionDefinitions(builder) {
  return typeof builder === 'object';
}
function isCommandHandlerDefinition(cmd) {
  return typeof cmd === 'object' && !Array.isArray(cmd);
}

function objFilter(original = {}, filter = () => true) {
  const obj = {};
  objectKeys(original).forEach(key => {
    if (filter(key, original[key])) {
      obj[key] = original[key];
    }
  });
  return obj;
}

function setBlocking(blocking) {
  if (typeof process === 'undefined') return;
  [process.stdout, process.stderr].forEach(_stream => {
    const stream = _stream;
    if (stream._handle && stream.isTTY && typeof stream._handle.setBlocking === 'function') {
      stream._handle.setBlocking(blocking);
    }
  });
}

function isBoolean(fail) {
  return typeof fail === 'boolean';
}
function usage(yargs, shim) {
  const __ = shim.y18n.__;
  const self = {};
  const fails = [];
  self.failFn = function failFn(f) {
    fails.push(f);
  };
  let failMessage = null;
  let globalFailMessage = null;
  let showHelpOnFail = true;
  self.showHelpOnFail = function showHelpOnFailFn(arg1 = true, arg2) {
    const [enabled, message] = typeof arg1 === 'string' ? [true, arg1] : [arg1, arg2];
    if (yargs.getInternalMethods().isGlobalContext()) {
      globalFailMessage = message;
    }
    failMessage = message;
    showHelpOnFail = enabled;
    return self;
  };
  let failureOutput = false;
  self.fail = function fail(msg, err) {
    const logger = yargs.getInternalMethods().getLoggerInstance();
    if (fails.length) {
      for (let i = fails.length - 1; i >= 0; --i) {
        const fail = fails[i];
        if (isBoolean(fail)) {
          if (err) throw err;else if (msg) throw Error(msg);
        } else {
          fail(msg, err, self);
        }
      }
    } else {
      if (yargs.getExitProcess()) setBlocking(true);
      if (!failureOutput) {
        failureOutput = true;
        if (showHelpOnFail) {
          yargs.showHelp('error');
          logger.error();
        }
        if (msg || err) logger.error(msg || err);
        const globalOrCommandFailMessage = failMessage || globalFailMessage;
        if (globalOrCommandFailMessage) {
          if (msg || err) logger.error('');
          logger.error(globalOrCommandFailMessage);
        }
      }
      err = err || new YError(msg);
      if (yargs.getExitProcess()) {
        return yargs.exit(1);
      } else if (yargs.getInternalMethods().hasParseCallback()) {
        return yargs.exit(1, err);
      } else {
        throw err;
      }
    }
  };
  let usages = [];
  let usageDisabled = false;
  self.usage = (msg, description) => {
    if (msg === null) {
      usageDisabled = true;
      usages = [];
      return self;
    }
    usageDisabled = false;
    usages.push([msg, description || '']);
    return self;
  };
  self.getUsage = () => {
    return usages;
  };
  self.getUsageDisabled = () => {
    return usageDisabled;
  };
  self.getPositionalGroupName = () => {
    return __('Positionals:');
  };
  let examples = [];
  self.example = (cmd, description) => {
    examples.push([cmd, description || '']);
  };
  let commands = [];
  self.command = function command(cmd, description, isDefault, aliases, deprecated = false) {
    if (isDefault) {
      commands = commands.map(cmdArray => {
        cmdArray[2] = false;
        return cmdArray;
      });
    }
    commands.push([cmd, description || '', isDefault, aliases, deprecated]);
  };
  self.getCommands = () => commands;
  let descriptions = {};
  self.describe = function describe(keyOrKeys, desc) {
    if (Array.isArray(keyOrKeys)) {
      keyOrKeys.forEach(k => {
        self.describe(k, desc);
      });
    } else if (typeof keyOrKeys === 'object') {
      Object.keys(keyOrKeys).forEach(k => {
        self.describe(k, keyOrKeys[k]);
      });
    } else {
      descriptions[keyOrKeys] = desc;
    }
  };
  self.getDescriptions = () => descriptions;
  let epilogs = [];
  self.epilog = msg => {
    epilogs.push(msg);
  };
  let wrapSet = false;
  let wrap;
  self.wrap = cols => {
    wrapSet = true;
    wrap = cols;
  };
  self.getWrap = () => {
    if (shim.getEnv('YARGS_DISABLE_WRAP')) {
      return null;
    }
    if (!wrapSet) {
      wrap = windowWidth();
      wrapSet = true;
    }
    return wrap;
  };
  const deferY18nLookupPrefix = '__yargsString__:';
  self.deferY18nLookup = str => deferY18nLookupPrefix + str;
  self.help = function help() {
    if (cachedHelpMessage) return cachedHelpMessage;
    normalizeAliases();
    const base$0 = yargs.customScriptName ? yargs.$0 : shim.path.basename(yargs.$0);
    const demandedOptions = yargs.getDemandedOptions();
    const demandedCommands = yargs.getDemandedCommands();
    const deprecatedOptions = yargs.getDeprecatedOptions();
    const groups = yargs.getGroups();
    const options = yargs.getOptions();
    let keys = [];
    keys = keys.concat(Object.keys(descriptions));
    keys = keys.concat(Object.keys(demandedOptions));
    keys = keys.concat(Object.keys(demandedCommands));
    keys = keys.concat(Object.keys(options.default));
    keys = keys.filter(filterHiddenOptions);
    keys = Object.keys(keys.reduce((acc, key) => {
      if (key !== '_') acc[key] = true;
      return acc;
    }, {}));
    const theWrap = self.getWrap();
    const ui = shim.cliui({
      width: theWrap,
      wrap: !!theWrap
    });
    if (!usageDisabled) {
      if (usages.length) {
        usages.forEach(usage => {
          ui.div({
            text: `${usage[0].replace(/\$0/g, base$0)}`
          });
          if (usage[1]) {
            ui.div({
              text: `${usage[1]}`,
              padding: [1, 0, 0, 0]
            });
          }
        });
        ui.div();
      } else if (commands.length) {
        let u = null;
        if (demandedCommands._) {
          u = `${base$0} <${__('command')}>\n`;
        } else {
          u = `${base$0} [${__('command')}]\n`;
        }
        ui.div(`${u}`);
      }
    }
    if (commands.length > 1 || commands.length === 1 && !commands[0][2]) {
      ui.div(__('Commands:'));
      const context = yargs.getInternalMethods().getContext();
      const parentCommands = context.commands.length ? `${context.commands.join(' ')} ` : '';
      if (yargs.getInternalMethods().getParserConfiguration()['sort-commands'] === true) {
        commands = commands.sort((a, b) => a[0].localeCompare(b[0]));
      }
      const prefix = base$0 ? `${base$0} ` : '';
      commands.forEach(command => {
        const commandString = `${prefix}${parentCommands}${command[0].replace(/^\$0 ?/, '')}`;
        ui.span({
          text: commandString,
          padding: [0, 2, 0, 2],
          width: maxWidth(commands, theWrap, `${base$0}${parentCommands}`) + 4
        }, {
          text: command[1]
        });
        const hints = [];
        if (command[2]) hints.push(`[${__('default')}]`);
        if (command[3] && command[3].length) {
          hints.push(`[${__('aliases:')} ${command[3].join(', ')}]`);
        }
        if (command[4]) {
          if (typeof command[4] === 'string') {
            hints.push(`[${__('deprecated: %s', command[4])}]`);
          } else {
            hints.push(`[${__('deprecated')}]`);
          }
        }
        if (hints.length) {
          ui.div({
            text: hints.join(' '),
            padding: [0, 0, 0, 2],
            align: 'right'
          });
        } else {
          ui.div();
        }
      });
      ui.div();
    }
    const aliasKeys = (Object.keys(options.alias) || []).concat(Object.keys(yargs.parsed.newAliases) || []);
    keys = keys.filter(key => !yargs.parsed.newAliases[key] && aliasKeys.every(alias => (options.alias[alias] || []).indexOf(key) === -1));
    const defaultGroup = __('Options:');
    if (!groups[defaultGroup]) groups[defaultGroup] = [];
    addUngroupedKeys(keys, options.alias, groups, defaultGroup);
    const isLongSwitch = sw => /^--/.test(getText(sw));
    const displayedGroups = Object.keys(groups).filter(groupName => groups[groupName].length > 0).map(groupName => {
      const normalizedKeys = groups[groupName].filter(filterHiddenOptions).map(key => {
        if (aliasKeys.includes(key)) return key;
        for (let i = 0, aliasKey; (aliasKey = aliasKeys[i]) !== undefined; i++) {
          if ((options.alias[aliasKey] || []).includes(key)) return aliasKey;
        }
        return key;
      });
      return {
        groupName,
        normalizedKeys
      };
    }).filter(({
      normalizedKeys
    }) => normalizedKeys.length > 0).map(({
      groupName,
      normalizedKeys
    }) => {
      const switches = normalizedKeys.reduce((acc, key) => {
        acc[key] = [key].concat(options.alias[key] || []).map(sw => {
          if (groupName === self.getPositionalGroupName()) return sw;else {
            return (/^[0-9]$/.test(sw) ? options.boolean.includes(key) ? '-' : '--' : sw.length > 1 ? '--' : '-') + sw;
          }
        }).sort((sw1, sw2) => isLongSwitch(sw1) === isLongSwitch(sw2) ? 0 : isLongSwitch(sw1) ? 1 : -1).join(', ');
        return acc;
      }, {});
      return {
        groupName,
        normalizedKeys,
        switches
      };
    });
    const shortSwitchesUsed = displayedGroups.filter(({
      groupName
    }) => groupName !== self.getPositionalGroupName()).some(({
      normalizedKeys,
      switches
    }) => !normalizedKeys.every(key => isLongSwitch(switches[key])));
    if (shortSwitchesUsed) {
      displayedGroups.filter(({
        groupName
      }) => groupName !== self.getPositionalGroupName()).forEach(({
        normalizedKeys,
        switches
      }) => {
        normalizedKeys.forEach(key => {
          if (isLongSwitch(switches[key])) {
            switches[key] = addIndentation(switches[key], '-x, '.length);
          }
        });
      });
    }
    displayedGroups.forEach(({
      groupName,
      normalizedKeys,
      switches
    }) => {
      ui.div(groupName);
      normalizedKeys.forEach(key => {
        const kswitch = switches[key];
        let desc = descriptions[key] || '';
        let type = null;
        if (desc.includes(deferY18nLookupPrefix)) desc = __(desc.substring(deferY18nLookupPrefix.length));
        if (options.boolean.includes(key)) type = `[${__('boolean')}]`;
        if (options.count.includes(key)) type = `[${__('count')}]`;
        if (options.string.includes(key)) type = `[${__('string')}]`;
        if (options.normalize.includes(key)) type = `[${__('string')}]`;
        if (options.array.includes(key)) type = `[${__('array')}]`;
        if (options.number.includes(key)) type = `[${__('number')}]`;
        const deprecatedExtra = deprecated => typeof deprecated === 'string' ? `[${__('deprecated: %s', deprecated)}]` : `[${__('deprecated')}]`;
        const extra = [key in deprecatedOptions ? deprecatedExtra(deprecatedOptions[key]) : null, type, key in demandedOptions ? `[${__('required')}]` : null, options.choices && options.choices[key] ? `[${__('choices:')} ${self.stringifiedValues(options.choices[key])}]` : null, defaultString(options.default[key], options.defaultDescription[key])].filter(Boolean).join(' ');
        ui.span({
          text: getText(kswitch),
          padding: [0, 2, 0, 2 + getIndentation(kswitch)],
          width: maxWidth(switches, theWrap) + 4
        }, desc);
        const shouldHideOptionExtras = yargs.getInternalMethods().getUsageConfiguration()['hide-types'] === true;
        if (extra && !shouldHideOptionExtras) ui.div({
          text: extra,
          padding: [0, 0, 0, 2],
          align: 'right'
        });else ui.div();
      });
      ui.div();
    });
    if (examples.length) {
      ui.div(__('Examples:'));
      examples.forEach(example => {
        example[0] = example[0].replace(/\$0/g, base$0);
      });
      examples.forEach(example => {
        if (example[1] === '') {
          ui.div({
            text: example[0],
            padding: [0, 2, 0, 2]
          });
        } else {
          ui.div({
            text: example[0],
            padding: [0, 2, 0, 2],
            width: maxWidth(examples, theWrap) + 4
          }, {
            text: example[1]
          });
        }
      });
      ui.div();
    }
    if (epilogs.length > 0) {
      const e = epilogs.map(epilog => epilog.replace(/\$0/g, base$0)).join('\n');
      ui.div(`${e}\n`);
    }
    return ui.toString().replace(/\s*$/, '');
  };
  function maxWidth(table, theWrap, modifier) {
    let width = 0;
    if (!Array.isArray(table)) {
      table = Object.values(table).map(v => [v]);
    }
    table.forEach(v => {
      width = Math.max(shim.stringWidth(modifier ? `${modifier} ${getText(v[0])}` : getText(v[0])) + getIndentation(v[0]), width);
    });
    if (theWrap) width = Math.min(width, parseInt((theWrap * 0.5).toString(), 10));
    return width;
  }
  function normalizeAliases() {
    const demandedOptions = yargs.getDemandedOptions();
    const options = yargs.getOptions();
    (Object.keys(options.alias) || []).forEach(key => {
      options.alias[key].forEach(alias => {
        if (descriptions[alias]) self.describe(key, descriptions[alias]);
        if (alias in demandedOptions) yargs.demandOption(key, demandedOptions[alias]);
        if (options.boolean.includes(alias)) yargs.boolean(key);
        if (options.count.includes(alias)) yargs.count(key);
        if (options.string.includes(alias)) yargs.string(key);
        if (options.normalize.includes(alias)) yargs.normalize(key);
        if (options.array.includes(alias)) yargs.array(key);
        if (options.number.includes(alias)) yargs.number(key);
      });
    });
  }
  let cachedHelpMessage;
  self.cacheHelpMessage = function () {
    cachedHelpMessage = this.help();
  };
  self.clearCachedHelpMessage = function () {
    cachedHelpMessage = undefined;
  };
  self.hasCachedHelpMessage = function () {
    return !!cachedHelpMessage;
  };
  function addUngroupedKeys(keys, aliases, groups, defaultGroup) {
    let groupedKeys = [];
    let toCheck = null;
    Object.keys(groups).forEach(group => {
      groupedKeys = groupedKeys.concat(groups[group]);
    });
    keys.forEach(key => {
      toCheck = [key].concat(aliases[key]);
      if (!toCheck.some(k => groupedKeys.indexOf(k) !== -1)) {
        groups[defaultGroup].push(key);
      }
    });
    return groupedKeys;
  }
  function filterHiddenOptions(key) {
    return yargs.getOptions().hiddenOptions.indexOf(key) < 0 || yargs.parsed.argv[yargs.getOptions().showHiddenOpt];
  }
  self.showHelp = level => {
    const logger = yargs.getInternalMethods().getLoggerInstance();
    if (!level) level = 'error';
    const emit = typeof level === 'function' ? level : logger[level];
    emit(self.help());
  };
  self.functionDescription = fn => {
    const description = fn.name ? shim.Parser.decamelize(fn.name, '-') : __('generated-value');
    return ['(', description, ')'].join('');
  };
  self.stringifiedValues = function stringifiedValues(values, separator) {
    let string = '';
    const sep = separator || ', ';
    const array = [].concat(values);
    if (!values || !array.length) return string;
    array.forEach(value => {
      if (string.length) string += sep;
      string += JSON.stringify(value);
    });
    return string;
  };
  function defaultString(value, defaultDescription) {
    let string = `[${__('default:')} `;
    if (value === undefined && !defaultDescription) return null;
    if (defaultDescription) {
      string += defaultDescription;
    } else {
      switch (typeof value) {
        case 'string':
          string += `"${value}"`;
          break;
        case 'object':
          string += JSON.stringify(value);
          break;
        default:
          string += value;
      }
    }
    return `${string}]`;
  }
  function windowWidth() {
    const maxWidth = 80;
    if (shim.process.stdColumns) {
      return Math.min(maxWidth, shim.process.stdColumns);
    } else {
      return maxWidth;
    }
  }
  let version = null;
  self.version = ver => {
    version = ver;
  };
  self.showVersion = level => {
    const logger = yargs.getInternalMethods().getLoggerInstance();
    if (!level) level = 'error';
    const emit = typeof level === 'function' ? level : logger[level];
    emit(version);
  };
  self.reset = function reset(localLookup) {
    failMessage = null;
    failureOutput = false;
    usages = [];
    usageDisabled = false;
    epilogs = [];
    examples = [];
    commands = [];
    descriptions = objFilter(descriptions, k => !localLookup[k]);
    return self;
  };
  const frozens = [];
  self.freeze = function freeze() {
    frozens.push({
      failMessage,
      failureOutput,
      usages,
      usageDisabled,
      epilogs,
      examples,
      commands,
      descriptions
    });
  };
  self.unfreeze = function unfreeze(defaultCommand = false) {
    const frozen = frozens.pop();
    if (!frozen) return;
    if (defaultCommand) {
      descriptions = {
        ...frozen.descriptions,
        ...descriptions
      };
      commands = [...frozen.commands, ...commands];
      usages = [...frozen.usages, ...usages];
      examples = [...frozen.examples, ...examples];
      epilogs = [...frozen.epilogs, ...epilogs];
    } else {
      ({
        failMessage,
        failureOutput,
        usages,
        usageDisabled,
        epilogs,
        examples,
        commands,
        descriptions
      } = frozen);
    }
  };
  return self;
}
function isIndentedText(text) {
  return typeof text === 'object';
}
function addIndentation(text, indent) {
  return isIndentedText(text) ? {
    text: text.text,
    indentation: text.indentation + indent
  } : {
    text,
    indentation: indent
  };
}
function getIndentation(text) {
  return isIndentedText(text) ? text.indentation : 0;
}
function getText(text) {
  return isIndentedText(text) ? text.text : text;
}

const completionShTemplate = `###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.bashrc
#    or {{app_path}} {{completion_command}} >> ~/.bash_profile on OSX.
#
_{{app_name}}_yargs_completions()
{
    local cur_word args type_list

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=("\${COMP_WORDS[@]}")

    # ask yargs to generate completions.
    type_list=$({{app_path}} --get-yargs-completions "\${args[@]}")

    COMPREPLY=( $(compgen -W "\${type_list}" -- \${cur_word}) )

    # if no match was found, fall back to filename completion
    if [ \${#COMPREPLY[@]} -eq 0 ]; then
      COMPREPLY=()
    fi

    return 0
}
complete -o bashdefault -o default -F _{{app_name}}_yargs_completions {{app_name}}
###-end-{{app_name}}-completions-###
`;
const completionZshTemplate = `#compdef {{app_name}}
###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.zshrc
#    or {{app_path}} {{completion_command}} >> ~/.zprofile on OSX.
#
_{{app_name}}_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'\n' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" {{app_path}} --get-yargs-completions "\${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _{{app_name}}_yargs_completions {{app_name}}
###-end-{{app_name}}-completions-###
`;

class Completion {
  constructor(yargs, usage, command, shim) {
    var _a, _b, _c;
    this.yargs = yargs;
    this.usage = usage;
    this.command = command;
    this.shim = shim;
    this.completionKey = 'get-yargs-completions';
    this.aliases = null;
    this.customCompletionFunction = null;
    this.indexAfterLastReset = 0;
    this.zshShell = (_c = ((_a = this.shim.getEnv('SHELL')) === null || _a === void 0 ? void 0 : _a.includes('zsh')) || ((_b = this.shim.getEnv('ZSH_NAME')) === null || _b === void 0 ? void 0 : _b.includes('zsh'))) !== null && _c !== void 0 ? _c : false;
  }
  defaultCompletion(args, argv, current, done) {
    const handlers = this.command.getCommandHandlers();
    for (let i = 0, ii = args.length; i < ii; ++i) {
      if (handlers[args[i]] && handlers[args[i]].builder) {
        const builder = handlers[args[i]].builder;
        if (isCommandBuilderCallback(builder)) {
          this.indexAfterLastReset = i + 1;
          const y = this.yargs.getInternalMethods().reset();
          builder(y, true);
          return y.argv;
        }
      }
    }
    const completions = [];
    this.commandCompletions(completions, args, current);
    this.optionCompletions(completions, args, argv, current);
    this.choicesFromOptionsCompletions(completions, args, argv, current);
    this.choicesFromPositionalsCompletions(completions, args, argv, current);
    done(null, completions);
  }
  commandCompletions(completions, args, current) {
    const parentCommands = this.yargs.getInternalMethods().getContext().commands;
    if (!current.match(/^-/) && parentCommands[parentCommands.length - 1] !== current && !this.previousArgHasChoices(args)) {
      this.usage.getCommands().forEach(usageCommand => {
        const commandName = parseCommand(usageCommand[0]).cmd;
        if (args.indexOf(commandName) === -1) {
          if (!this.zshShell) {
            completions.push(commandName);
          } else {
            const desc = usageCommand[1] || '';
            completions.push(commandName.replace(/:/g, '\\:') + ':' + desc);
          }
        }
      });
    }
  }
  optionCompletions(completions, args, argv, current) {
    if ((current.match(/^-/) || current === '' && completions.length === 0) && !this.previousArgHasChoices(args)) {
      const options = this.yargs.getOptions();
      const positionalKeys = this.yargs.getGroups()[this.usage.getPositionalGroupName()] || [];
      Object.keys(options.key).forEach(key => {
        const negable = !!options.configuration['boolean-negation'] && options.boolean.includes(key);
        const isPositionalKey = positionalKeys.includes(key);
        if (!isPositionalKey && !options.hiddenOptions.includes(key) && !this.argsContainKey(args, key, negable)) {
          this.completeOptionKey(key, completions, current, negable && !!options.default[key]);
        }
      });
    }
  }
  choicesFromOptionsCompletions(completions, args, argv, current) {
    if (this.previousArgHasChoices(args)) {
      const choices = this.getPreviousArgChoices(args);
      if (choices && choices.length > 0) {
        completions.push(...choices.map(c => c.replace(/:/g, '\\:')));
      }
    }
  }
  choicesFromPositionalsCompletions(completions, args, argv, current) {
    if (current === '' && completions.length > 0 && this.previousArgHasChoices(args)) {
      return;
    }
    const positionalKeys = this.yargs.getGroups()[this.usage.getPositionalGroupName()] || [];
    const offset = Math.max(this.indexAfterLastReset, this.yargs.getInternalMethods().getContext().commands.length + 1);
    const positionalKey = positionalKeys[argv._.length - offset - 1];
    if (!positionalKey) {
      return;
    }
    const choices = this.yargs.getOptions().choices[positionalKey] || [];
    for (const choice of choices) {
      if (choice.startsWith(current)) {
        completions.push(choice.replace(/:/g, '\\:'));
      }
    }
  }
  getPreviousArgChoices(args) {
    if (args.length < 1) return;
    let previousArg = args[args.length - 1];
    let filter = '';
    if (!previousArg.startsWith('-') && args.length > 1) {
      filter = previousArg;
      previousArg = args[args.length - 2];
    }
    if (!previousArg.startsWith('-')) return;
    const previousArgKey = previousArg.replace(/^-+/, '');
    const options = this.yargs.getOptions();
    const possibleAliases = [previousArgKey, ...(this.yargs.getAliases()[previousArgKey] || [])];
    let choices;
    for (const possibleAlias of possibleAliases) {
      if (Object.prototype.hasOwnProperty.call(options.key, possibleAlias) && Array.isArray(options.choices[possibleAlias])) {
        choices = options.choices[possibleAlias];
        break;
      }
    }
    if (choices) {
      return choices.filter(choice => !filter || choice.startsWith(filter));
    }
  }
  previousArgHasChoices(args) {
    const choices = this.getPreviousArgChoices(args);
    return choices !== undefined && choices.length > 0;
  }
  argsContainKey(args, key, negable) {
    const argsContains = s => args.indexOf((/^[^0-9]$/.test(s) ? '-' : '--') + s) !== -1;
    if (argsContains(key)) return true;
    if (negable && argsContains(`no-${key}`)) return true;
    if (this.aliases) {
      for (const alias of this.aliases[key]) {
        if (argsContains(alias)) return true;
      }
    }
    return false;
  }
  completeOptionKey(key, completions, current, negable) {
    var _a, _b, _c, _d;
    let keyWithDesc = key;
    if (this.zshShell) {
      const descs = this.usage.getDescriptions();
      const aliasKey = (_b = (_a = this === null || this === void 0 ? void 0 : this.aliases) === null || _a === void 0 ? void 0 : _a[key]) === null || _b === void 0 ? void 0 : _b.find(alias => {
        const desc = descs[alias];
        return typeof desc === 'string' && desc.length > 0;
      });
      const descFromAlias = aliasKey ? descs[aliasKey] : undefined;
      const desc = (_d = (_c = descs[key]) !== null && _c !== void 0 ? _c : descFromAlias) !== null && _d !== void 0 ? _d : '';
      keyWithDesc = `${key.replace(/:/g, '\\:')}:${desc.replace('__yargsString__:', '').replace(/(\r\n|\n|\r)/gm, ' ')}`;
    }
    const startsByTwoDashes = s => /^--/.test(s);
    const isShortOption = s => /^[^0-9]$/.test(s);
    const dashes = !startsByTwoDashes(current) && isShortOption(key) ? '-' : '--';
    completions.push(dashes + keyWithDesc);
    if (negable) {
      completions.push(dashes + 'no-' + keyWithDesc);
    }
  }
  customCompletion(args, argv, current, done) {
    assertNotStrictEqual(this.customCompletionFunction, null, this.shim);
    if (isSyncCompletionFunction(this.customCompletionFunction)) {
      const result = this.customCompletionFunction(current, argv);
      if (isPromise(result)) {
        return result.then(list => {
          this.shim.process.nextTick(() => {
            done(null, list);
          });
        }).catch(err => {
          this.shim.process.nextTick(() => {
            done(err, undefined);
          });
        });
      }
      return done(null, result);
    } else if (isFallbackCompletionFunction(this.customCompletionFunction)) {
      return this.customCompletionFunction(current, argv, (onCompleted = done) => this.defaultCompletion(args, argv, current, onCompleted), completions => {
        done(null, completions);
      });
    } else {
      return this.customCompletionFunction(current, argv, completions => {
        done(null, completions);
      });
    }
  }
  getCompletion(args, done) {
    const current = args.length ? args[args.length - 1] : '';
    const argv = this.yargs.parse(args, true);
    const completionFunction = this.customCompletionFunction ? argv => this.customCompletion(args, argv, current, done) : argv => this.defaultCompletion(args, argv, current, done);
    return isPromise(argv) ? argv.then(completionFunction) : completionFunction(argv);
  }
  generateCompletionScript($0, cmd) {
    let script = this.zshShell ? completionZshTemplate : completionShTemplate;
    const name = this.shim.path.basename($0);
    if ($0.match(/\.js$/)) $0 = `./${$0}`;
    script = script.replace(/{{app_name}}/g, name);
    script = script.replace(/{{completion_command}}/g, cmd);
    return script.replace(/{{app_path}}/g, $0);
  }
  registerFunction(fn) {
    this.customCompletionFunction = fn;
  }
  setParsed(parsed) {
    this.aliases = parsed.aliases;
  }
}
function completion(yargs, usage, command, shim) {
  return new Completion(yargs, usage, command, shim);
}
function isSyncCompletionFunction(completionFunction) {
  return completionFunction.length < 3;
}
function isFallbackCompletionFunction(completionFunction) {
  return completionFunction.length > 3;
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  let i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  let j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        if (i > 1 && j > 1 && b.charAt(i - 2) === a.charAt(j - 1) && b.charAt(i - 1) === a.charAt(j - 2)) {
          matrix[i][j] = matrix[i - 2][j - 2] + 1;
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
      }
    }
  }
  return matrix[b.length][a.length];
}

const specialKeys = ['$0', '--', '_'];
function validation(yargs, usage, shim) {
  const __ = shim.y18n.__;
  const __n = shim.y18n.__n;
  const self = {};
  self.nonOptionCount = function nonOptionCount(argv) {
    const demandedCommands = yargs.getDemandedCommands();
    const positionalCount = argv._.length + (argv['--'] ? argv['--'].length : 0);
    const _s = positionalCount - yargs.getInternalMethods().getContext().commands.length;
    if (demandedCommands._ && (_s < demandedCommands._.min || _s > demandedCommands._.max)) {
      if (_s < demandedCommands._.min) {
        if (demandedCommands._.minMsg !== undefined) {
          usage.fail(demandedCommands._.minMsg ? demandedCommands._.minMsg.replace(/\$0/g, _s.toString()).replace(/\$1/, demandedCommands._.min.toString()) : null);
        } else {
          usage.fail(__n('Not enough non-option arguments: got %s, need at least %s', 'Not enough non-option arguments: got %s, need at least %s', _s, _s.toString(), demandedCommands._.min.toString()));
        }
      } else if (_s > demandedCommands._.max) {
        if (demandedCommands._.maxMsg !== undefined) {
          usage.fail(demandedCommands._.maxMsg ? demandedCommands._.maxMsg.replace(/\$0/g, _s.toString()).replace(/\$1/, demandedCommands._.max.toString()) : null);
        } else {
          usage.fail(__n('Too many non-option arguments: got %s, maximum of %s', 'Too many non-option arguments: got %s, maximum of %s', _s, _s.toString(), demandedCommands._.max.toString()));
        }
      }
    }
  };
  self.positionalCount = function positionalCount(required, observed) {
    if (observed < required) {
      usage.fail(__n('Not enough non-option arguments: got %s, need at least %s', 'Not enough non-option arguments: got %s, need at least %s', observed, observed + '', required + ''));
    }
  };
  self.requiredArguments = function requiredArguments(argv, demandedOptions) {
    let missing = null;
    for (const key of Object.keys(demandedOptions)) {
      if (!Object.prototype.hasOwnProperty.call(argv, key) || typeof argv[key] === 'undefined') {
        missing = missing || {};
        missing[key] = demandedOptions[key];
      }
    }
    if (missing) {
      const customMsgs = [];
      for (const key of Object.keys(missing)) {
        const msg = missing[key];
        if (msg && customMsgs.indexOf(msg) < 0) {
          customMsgs.push(msg);
        }
      }
      const customMsg = customMsgs.length ? `\n${customMsgs.join('\n')}` : '';
      usage.fail(__n('Missing required argument: %s', 'Missing required arguments: %s', Object.keys(missing).length, Object.keys(missing).join(', ') + customMsg));
    }
  };
  self.unknownArguments = function unknownArguments(argv, aliases, positionalMap, isDefaultCommand, checkPositionals = true) {
    var _a;
    const commandKeys = yargs.getInternalMethods().getCommandInstance().getCommands();
    const unknown = [];
    const currentContext = yargs.getInternalMethods().getContext();
    Object.keys(argv).forEach(key => {
      if (!specialKeys.includes(key) && !Object.prototype.hasOwnProperty.call(positionalMap, key) && !Object.prototype.hasOwnProperty.call(yargs.getInternalMethods().getParseContext(), key) && !self.isValidAndSomeAliasIsNotNew(key, aliases)) {
        unknown.push(key);
      }
    });
    if (checkPositionals && (currentContext.commands.length > 0 || commandKeys.length > 0 || isDefaultCommand)) {
      argv._.slice(currentContext.commands.length).forEach(key => {
        if (!commandKeys.includes('' + key)) {
          unknown.push('' + key);
        }
      });
    }
    if (checkPositionals) {
      const demandedCommands = yargs.getDemandedCommands();
      const maxNonOptDemanded = ((_a = demandedCommands._) === null || _a === void 0 ? void 0 : _a.max) || 0;
      const expected = currentContext.commands.length + maxNonOptDemanded;
      if (expected < argv._.length) {
        argv._.slice(expected).forEach(key => {
          key = String(key);
          if (!currentContext.commands.includes(key) && !unknown.includes(key)) {
            unknown.push(key);
          }
        });
      }
    }
    if (unknown.length) {
      usage.fail(__n('Unknown argument: %s', 'Unknown arguments: %s', unknown.length, unknown.map(s => s.trim() ? s : `"${s}"`).join(', ')));
    }
  };
  self.unknownCommands = function unknownCommands(argv) {
    const commandKeys = yargs.getInternalMethods().getCommandInstance().getCommands();
    const unknown = [];
    const currentContext = yargs.getInternalMethods().getContext();
    if (currentContext.commands.length > 0 || commandKeys.length > 0) {
      argv._.slice(currentContext.commands.length).forEach(key => {
        if (!commandKeys.includes('' + key)) {
          unknown.push('' + key);
        }
      });
    }
    if (unknown.length > 0) {
      usage.fail(__n('Unknown command: %s', 'Unknown commands: %s', unknown.length, unknown.join(', ')));
      return true;
    } else {
      return false;
    }
  };
  self.isValidAndSomeAliasIsNotNew = function isValidAndSomeAliasIsNotNew(key, aliases) {
    if (!Object.prototype.hasOwnProperty.call(aliases, key)) {
      return false;
    }
    const newAliases = yargs.parsed.newAliases;
    return [key, ...aliases[key]].some(a => !Object.prototype.hasOwnProperty.call(newAliases, a) || !newAliases[key]);
  };
  self.limitedChoices = function limitedChoices(argv) {
    const options = yargs.getOptions();
    const invalid = {};
    if (!Object.keys(options.choices).length) return;
    Object.keys(argv).forEach(key => {
      if (specialKeys.indexOf(key) === -1 && Object.prototype.hasOwnProperty.call(options.choices, key)) {
        [].concat(argv[key]).forEach(value => {
          if (options.choices[key].indexOf(value) === -1 && value !== undefined) {
            invalid[key] = (invalid[key] || []).concat(value);
          }
        });
      }
    });
    const invalidKeys = Object.keys(invalid);
    if (!invalidKeys.length) return;
    let msg = __('Invalid values:');
    invalidKeys.forEach(key => {
      msg += `\n  ${__('Argument: %s, Given: %s, Choices: %s', key, usage.stringifiedValues(invalid[key]), usage.stringifiedValues(options.choices[key]))}`;
    });
    usage.fail(msg);
  };
  let implied = {};
  self.implies = function implies(key, value) {
    argsert('<string|object> [array|number|string]', [key, value], arguments.length);
    if (typeof key === 'object') {
      Object.keys(key).forEach(k => {
        self.implies(k, key[k]);
      });
    } else {
      yargs.global(key);
      if (!implied[key]) {
        implied[key] = [];
      }
      if (Array.isArray(value)) {
        value.forEach(i => self.implies(key, i));
      } else {
        assertNotStrictEqual(value, undefined, shim);
        implied[key].push(value);
      }
    }
  };
  self.getImplied = function getImplied() {
    return implied;
  };
  function keyExists(argv, val) {
    const num = Number(val);
    val = isNaN(num) ? val : num;
    if (typeof val === 'number') {
      val = argv._.length >= val;
    } else if (val.match(/^--no-.+/)) {
      val = val.match(/^--no-(.+)/)[1];
      val = !Object.prototype.hasOwnProperty.call(argv, val);
    } else {
      val = Object.prototype.hasOwnProperty.call(argv, val);
    }
    return val;
  }
  self.implications = function implications(argv) {
    const implyFail = [];
    Object.keys(implied).forEach(key => {
      const origKey = key;
      (implied[key] || []).forEach(value => {
        let key = origKey;
        const origValue = value;
        key = keyExists(argv, key);
        value = keyExists(argv, value);
        if (key && !value) {
          implyFail.push(` ${origKey} -> ${origValue}`);
        }
      });
    });
    if (implyFail.length) {
      let msg = `${__('Implications failed:')}\n`;
      implyFail.forEach(value => {
        msg += value;
      });
      usage.fail(msg);
    }
  };
  let conflicting = {};
  self.conflicts = function conflicts(key, value) {
    argsert('<string|object> [array|string]', [key, value], arguments.length);
    if (typeof key === 'object') {
      Object.keys(key).forEach(k => {
        self.conflicts(k, key[k]);
      });
    } else {
      yargs.global(key);
      if (!conflicting[key]) {
        conflicting[key] = [];
      }
      if (Array.isArray(value)) {
        value.forEach(i => self.conflicts(key, i));
      } else {
        conflicting[key].push(value);
      }
    }
  };
  self.getConflicting = () => conflicting;
  self.conflicting = function conflictingFn(argv) {
    Object.keys(argv).forEach(key => {
      if (conflicting[key]) {
        conflicting[key].forEach(value => {
          if (value && argv[key] !== undefined && argv[value] !== undefined) {
            usage.fail(__('Arguments %s and %s are mutually exclusive', key, value));
          }
        });
      }
    });
    if (yargs.getInternalMethods().getParserConfiguration()['strip-dashed']) {
      Object.keys(conflicting).forEach(key => {
        conflicting[key].forEach(value => {
          if (value && argv[shim.Parser.camelCase(key)] !== undefined && argv[shim.Parser.camelCase(value)] !== undefined) {
            usage.fail(__('Arguments %s and %s are mutually exclusive', key, value));
          }
        });
      });
    }
  };
  self.recommendCommands = function recommendCommands(cmd, potentialCommands) {
    const threshold = 3;
    potentialCommands = potentialCommands.sort((a, b) => b.length - a.length);
    let recommended = null;
    let bestDistance = Infinity;
    for (let i = 0, candidate; (candidate = potentialCommands[i]) !== undefined; i++) {
      const d = levenshtein(cmd, candidate);
      if (d <= threshold && d < bestDistance) {
        bestDistance = d;
        recommended = candidate;
      }
    }
    if (recommended) usage.fail(__('Did you mean %s?', recommended));
  };
  self.reset = function reset(localLookup) {
    implied = objFilter(implied, k => !localLookup[k]);
    conflicting = objFilter(conflicting, k => !localLookup[k]);
    return self;
  };
  const frozens = [];
  self.freeze = function freeze() {
    frozens.push({
      implied,
      conflicting
    });
  };
  self.unfreeze = function unfreeze() {
    const frozen = frozens.pop();
    assertNotStrictEqual(frozen, undefined, shim);
    ({
      implied,
      conflicting
    } = frozen);
  };
  return self;
}

let previouslyVisitedConfigs = [];
let shim;
function applyExtends(config, cwd, mergeExtends, _shim) {
  shim = _shim;
  let defaultConfig = {};
  if (Object.prototype.hasOwnProperty.call(config, 'extends')) {
    if (typeof config.extends !== 'string') return defaultConfig;
    const isPath = /\.json|\..*rc$/.test(config.extends);
    let pathToDefault = null;
    if (!isPath) {
      try {
        pathToDefault = require.resolve(config.extends);
      } catch (_err) {
        return config;
      }
    } else {
      pathToDefault = getPathToDefaultConfig(cwd, config.extends);
    }
    checkForCircularExtends(pathToDefault);
    previouslyVisitedConfigs.push(pathToDefault);
    defaultConfig = isPath ? JSON.parse(shim.readFileSync(pathToDefault, 'utf8')) : require(config.extends);
    delete config.extends;
    defaultConfig = applyExtends(defaultConfig, shim.path.dirname(pathToDefault), mergeExtends, shim);
  }
  previouslyVisitedConfigs = [];
  return mergeExtends ? mergeDeep(defaultConfig, config) : Object.assign({}, defaultConfig, config);
}
function checkForCircularExtends(cfgPath) {
  if (previouslyVisitedConfigs.indexOf(cfgPath) > -1) {
    throw new YError(`Circular extended configurations: '${cfgPath}'.`);
  }
}
function getPathToDefaultConfig(cwd, pathToExtend) {
  return shim.path.resolve(cwd, pathToExtend);
}
function mergeDeep(config1, config2) {
  const target = {};
  function isObject(obj) {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
  }
  Object.assign(target, config1);
  for (const key of Object.keys(config2)) {
    if (isObject(config2[key]) && isObject(target[key])) {
      target[key] = mergeDeep(config1[key], config2[key]);
    } else {
      target[key] = config2[key];
    }
  }
  return target;
}

var __classPrivateFieldSet = undefined && undefined.__classPrivateFieldSet || function (receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = undefined && undefined.__classPrivateFieldGet || function (receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _YargsInstance_command, _YargsInstance_cwd, _YargsInstance_context, _YargsInstance_completion, _YargsInstance_completionCommand, _YargsInstance_defaultShowHiddenOpt, _YargsInstance_exitError, _YargsInstance_detectLocale, _YargsInstance_emittedWarnings, _YargsInstance_exitProcess, _YargsInstance_frozens, _YargsInstance_globalMiddleware, _YargsInstance_groups, _YargsInstance_hasOutput, _YargsInstance_helpOpt, _YargsInstance_isGlobalContext, _YargsInstance_logger, _YargsInstance_output, _YargsInstance_options, _YargsInstance_parentRequire, _YargsInstance_parserConfig, _YargsInstance_parseFn, _YargsInstance_parseContext, _YargsInstance_pkgs, _YargsInstance_preservedGroups, _YargsInstance_processArgs, _YargsInstance_recommendCommands, _YargsInstance_shim, _YargsInstance_strict, _YargsInstance_strictCommands, _YargsInstance_strictOptions, _YargsInstance_usage, _YargsInstance_usageConfig, _YargsInstance_versionOpt, _YargsInstance_validation;
function YargsFactory(_shim) {
  return (processArgs = [], cwd = _shim.process.cwd(), parentRequire) => {
    const yargs = new YargsInstance(processArgs, cwd, parentRequire, _shim);
    Object.defineProperty(yargs, 'argv', {
      get: () => {
        return yargs.parse();
      },
      enumerable: true
    });
    yargs.help();
    yargs.version();
    return yargs;
  };
}
const kCopyDoubleDash = Symbol('copyDoubleDash');
const kCreateLogger = Symbol('copyDoubleDash');
const kDeleteFromParserHintObject = Symbol('deleteFromParserHintObject');
const kEmitWarning = Symbol('emitWarning');
const kFreeze = Symbol('freeze');
const kGetDollarZero = Symbol('getDollarZero');
const kGetParserConfiguration = Symbol('getParserConfiguration');
const kGetUsageConfiguration = Symbol('getUsageConfiguration');
const kGuessLocale = Symbol('guessLocale');
const kGuessVersion = Symbol('guessVersion');
const kParsePositionalNumbers = Symbol('parsePositionalNumbers');
const kPkgUp = Symbol('pkgUp');
const kPopulateParserHintArray = Symbol('populateParserHintArray');
const kPopulateParserHintSingleValueDictionary = Symbol('populateParserHintSingleValueDictionary');
const kPopulateParserHintArrayDictionary = Symbol('populateParserHintArrayDictionary');
const kPopulateParserHintDictionary = Symbol('populateParserHintDictionary');
const kSanitizeKey = Symbol('sanitizeKey');
const kSetKey = Symbol('setKey');
const kUnfreeze = Symbol('unfreeze');
const kValidateAsync = Symbol('validateAsync');
const kGetCommandInstance = Symbol('getCommandInstance');
const kGetContext = Symbol('getContext');
const kGetHasOutput = Symbol('getHasOutput');
const kGetLoggerInstance = Symbol('getLoggerInstance');
const kGetParseContext = Symbol('getParseContext');
const kGetUsageInstance = Symbol('getUsageInstance');
const kGetValidationInstance = Symbol('getValidationInstance');
const kHasParseCallback = Symbol('hasParseCallback');
const kIsGlobalContext = Symbol('isGlobalContext');
const kPostProcess = Symbol('postProcess');
const kRebase = Symbol('rebase');
const kReset = Symbol('reset');
const kRunYargsParserAndExecuteCommands = Symbol('runYargsParserAndExecuteCommands');
const kRunValidation = Symbol('runValidation');
const kSetHasOutput = Symbol('setHasOutput');
const kTrackManuallySetKeys = Symbol('kTrackManuallySetKeys');
class YargsInstance {
  constructor(processArgs = [], cwd, parentRequire, shim) {
    this.customScriptName = false;
    this.parsed = false;
    _YargsInstance_command.set(this, void 0);
    _YargsInstance_cwd.set(this, void 0);
    _YargsInstance_context.set(this, {
      commands: [],
      fullCommands: []
    });
    _YargsInstance_completion.set(this, null);
    _YargsInstance_completionCommand.set(this, null);
    _YargsInstance_defaultShowHiddenOpt.set(this, 'show-hidden');
    _YargsInstance_exitError.set(this, null);
    _YargsInstance_detectLocale.set(this, true);
    _YargsInstance_emittedWarnings.set(this, {});
    _YargsInstance_exitProcess.set(this, true);
    _YargsInstance_frozens.set(this, []);
    _YargsInstance_globalMiddleware.set(this, void 0);
    _YargsInstance_groups.set(this, {});
    _YargsInstance_hasOutput.set(this, false);
    _YargsInstance_helpOpt.set(this, null);
    _YargsInstance_isGlobalContext.set(this, true);
    _YargsInstance_logger.set(this, void 0);
    _YargsInstance_output.set(this, '');
    _YargsInstance_options.set(this, void 0);
    _YargsInstance_parentRequire.set(this, void 0);
    _YargsInstance_parserConfig.set(this, {});
    _YargsInstance_parseFn.set(this, null);
    _YargsInstance_parseContext.set(this, null);
    _YargsInstance_pkgs.set(this, {});
    _YargsInstance_preservedGroups.set(this, {});
    _YargsInstance_processArgs.set(this, void 0);
    _YargsInstance_recommendCommands.set(this, false);
    _YargsInstance_shim.set(this, void 0);
    _YargsInstance_strict.set(this, false);
    _YargsInstance_strictCommands.set(this, false);
    _YargsInstance_strictOptions.set(this, false);
    _YargsInstance_usage.set(this, void 0);
    _YargsInstance_usageConfig.set(this, {});
    _YargsInstance_versionOpt.set(this, null);
    _YargsInstance_validation.set(this, void 0);
    __classPrivateFieldSet(this, _YargsInstance_shim, shim, "f");
    __classPrivateFieldSet(this, _YargsInstance_processArgs, processArgs, "f");
    __classPrivateFieldSet(this, _YargsInstance_cwd, cwd, "f");
    __classPrivateFieldSet(this, _YargsInstance_parentRequire, parentRequire, "f");
    __classPrivateFieldSet(this, _YargsInstance_globalMiddleware, new GlobalMiddleware(this), "f");
    this.$0 = this[kGetDollarZero]();
    this[kReset]();
    __classPrivateFieldSet(this, _YargsInstance_command, __classPrivateFieldGet(this, _YargsInstance_command, "f"), "f");
    __classPrivateFieldSet(this, _YargsInstance_usage, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), "f");
    __classPrivateFieldSet(this, _YargsInstance_validation, __classPrivateFieldGet(this, _YargsInstance_validation, "f"), "f");
    __classPrivateFieldSet(this, _YargsInstance_options, __classPrivateFieldGet(this, _YargsInstance_options, "f"), "f");
    __classPrivateFieldGet(this, _YargsInstance_options, "f").showHiddenOpt = __classPrivateFieldGet(this, _YargsInstance_defaultShowHiddenOpt, "f");
    __classPrivateFieldSet(this, _YargsInstance_logger, this[kCreateLogger](), "f");
  }
  addHelpOpt(opt, msg) {
    const defaultHelpOpt = 'help';
    argsert('[string|boolean] [string]', [opt, msg], arguments.length);
    if (__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")) {
      this[kDeleteFromParserHintObject](__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"));
      __classPrivateFieldSet(this, _YargsInstance_helpOpt, null, "f");
    }
    if (opt === false && msg === undefined) return this;
    __classPrivateFieldSet(this, _YargsInstance_helpOpt, typeof opt === 'string' ? opt : defaultHelpOpt, "f");
    this.boolean(__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"));
    this.describe(__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"), msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup('Show help'));
    return this;
  }
  help(opt, msg) {
    return this.addHelpOpt(opt, msg);
  }
  addShowHiddenOpt(opt, msg) {
    argsert('[string|boolean] [string]', [opt, msg], arguments.length);
    if (opt === false && msg === undefined) return this;
    const showHiddenOpt = typeof opt === 'string' ? opt : __classPrivateFieldGet(this, _YargsInstance_defaultShowHiddenOpt, "f");
    this.boolean(showHiddenOpt);
    this.describe(showHiddenOpt, msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup('Show hidden options'));
    __classPrivateFieldGet(this, _YargsInstance_options, "f").showHiddenOpt = showHiddenOpt;
    return this;
  }
  showHidden(opt, msg) {
    return this.addShowHiddenOpt(opt, msg);
  }
  alias(key, value) {
    argsert('<object|string|array> [string|array]', [key, value], arguments.length);
    this[kPopulateParserHintArrayDictionary](this.alias.bind(this), 'alias', key, value);
    return this;
  }
  array(keys) {
    argsert('<array|string>', [keys], arguments.length);
    this[kPopulateParserHintArray]('array', keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  boolean(keys) {
    argsert('<array|string>', [keys], arguments.length);
    this[kPopulateParserHintArray]('boolean', keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  check(f, global) {
    argsert('<function> [boolean]', [f, global], arguments.length);
    this.middleware((argv, _yargs) => {
      return maybeAsyncResult(() => {
        return f(argv, _yargs.getOptions());
      }, result => {
        if (!result) {
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(__classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.__('Argument check failed: %s', f.toString()));
        } else if (typeof result === 'string' || result instanceof Error) {
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(result.toString(), result);
        }
        return argv;
      }, err => {
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(err.message ? err.message : err.toString(), err);
        return argv;
      });
    }, false, global);
    return this;
  }
  choices(key, value) {
    argsert('<object|string|array> [string|array]', [key, value], arguments.length);
    this[kPopulateParserHintArrayDictionary](this.choices.bind(this), 'choices', key, value);
    return this;
  }
  coerce(keys, value) {
    argsert('<object|string|array> [function]', [keys, value], arguments.length);
    if (Array.isArray(keys)) {
      if (!value) {
        throw new YError('coerce callback must be provided');
      }
      for (const key of keys) {
        this.coerce(key, value);
      }
      return this;
    } else if (typeof keys === 'object') {
      for (const key of Object.keys(keys)) {
        this.coerce(key, keys[key]);
      }
      return this;
    }
    if (!value) {
      throw new YError('coerce callback must be provided');
    }
    __classPrivateFieldGet(this, _YargsInstance_options, "f").key[keys] = true;
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").addCoerceMiddleware((argv, yargs) => {
      let aliases;
      const shouldCoerce = Object.prototype.hasOwnProperty.call(argv, keys);
      if (!shouldCoerce) {
        return argv;
      }
      return maybeAsyncResult(() => {
        aliases = yargs.getAliases();
        return value(argv[keys]);
      }, result => {
        argv[keys] = result;
        const stripAliased = yargs.getInternalMethods().getParserConfiguration()['strip-aliased'];
        if (aliases[keys] && stripAliased !== true) {
          for (const alias of aliases[keys]) {
            argv[alias] = result;
          }
        }
        return argv;
      }, err => {
        throw new YError(err.message);
      });
    }, keys);
    return this;
  }
  conflicts(key1, key2) {
    argsert('<string|object> [string|array]', [key1, key2], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").conflicts(key1, key2);
    return this;
  }
  config(key = 'config', msg, parseFn) {
    argsert('[object|string] [string|function] [function]', [key, msg, parseFn], arguments.length);
    if (typeof key === 'object' && !Array.isArray(key)) {
      key = applyExtends(key, __classPrivateFieldGet(this, _YargsInstance_cwd, "f"), this[kGetParserConfiguration]()['deep-merge-config'] || false, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = (__classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || []).concat(key);
      return this;
    }
    if (typeof msg === 'function') {
      parseFn = msg;
      msg = undefined;
    }
    this.describe(key, msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup('Path to JSON config file'));
    (Array.isArray(key) ? key : [key]).forEach(k => {
      __classPrivateFieldGet(this, _YargsInstance_options, "f").config[k] = parseFn || true;
    });
    return this;
  }
  completion(cmd, desc, fn) {
    argsert('[string] [string|boolean|function] [function]', [cmd, desc, fn], arguments.length);
    if (typeof desc === 'function') {
      fn = desc;
      desc = undefined;
    }
    __classPrivateFieldSet(this, _YargsInstance_completionCommand, cmd || __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") || 'completion', "f");
    if (!desc && desc !== false) {
      desc = 'generate completion script';
    }
    this.command(__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f"), desc);
    if (fn) __classPrivateFieldGet(this, _YargsInstance_completion, "f").registerFunction(fn);
    return this;
  }
  command(cmd, description, builder, handler, middlewares, deprecated) {
    argsert('<string|array|object> [string|boolean] [function|object] [function] [array] [boolean|string]', [cmd, description, builder, handler, middlewares, deprecated], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_command, "f").addHandler(cmd, description, builder, handler, middlewares, deprecated);
    return this;
  }
  commands(cmd, description, builder, handler, middlewares, deprecated) {
    return this.command(cmd, description, builder, handler, middlewares, deprecated);
  }
  commandDir(dir, opts) {
    argsert('<string> [object]', [dir, opts], arguments.length);
    const req = __classPrivateFieldGet(this, _YargsInstance_parentRequire, "f") || __classPrivateFieldGet(this, _YargsInstance_shim, "f").require;
    __classPrivateFieldGet(this, _YargsInstance_command, "f").addDirectory(dir, req, __classPrivateFieldGet(this, _YargsInstance_shim, "f").getCallerFile(), opts);
    return this;
  }
  count(keys) {
    argsert('<array|string>', [keys], arguments.length);
    this[kPopulateParserHintArray]('count', keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  default(key, value, defaultDescription) {
    argsert('<object|string|array> [*] [string]', [key, value, defaultDescription], arguments.length);
    if (defaultDescription) {
      assertSingleKey(key, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = defaultDescription;
    }
    if (typeof value === 'function') {
      assertSingleKey(key, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      if (!__classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key]) __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = __classPrivateFieldGet(this, _YargsInstance_usage, "f").functionDescription(value);
      value = value.call();
    }
    this[kPopulateParserHintSingleValueDictionary](this.default.bind(this), 'default', key, value);
    return this;
  }
  defaults(key, value, defaultDescription) {
    return this.default(key, value, defaultDescription);
  }
  demandCommand(min = 1, max, minMsg, maxMsg) {
    argsert('[number] [number|string] [string|null|undefined] [string|null|undefined]', [min, max, minMsg, maxMsg], arguments.length);
    if (typeof max !== 'number') {
      minMsg = max;
      max = Infinity;
    }
    this.global('_', false);
    __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedCommands._ = {
      min,
      max,
      minMsg,
      maxMsg
    };
    return this;
  }
  demand(keys, max, msg) {
    if (Array.isArray(max)) {
      max.forEach(key => {
        assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
        this.demandOption(key, msg);
      });
      max = Infinity;
    } else if (typeof max !== 'number') {
      msg = max;
      max = Infinity;
    }
    if (typeof keys === 'number') {
      assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      this.demandCommand(keys, max, msg, msg);
    } else if (Array.isArray(keys)) {
      keys.forEach(key => {
        assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
        this.demandOption(key, msg);
      });
    } else {
      if (typeof msg === 'string') {
        this.demandOption(keys, msg);
      } else if (msg === true || typeof msg === 'undefined') {
        this.demandOption(keys);
      }
    }
    return this;
  }
  demandOption(keys, msg) {
    argsert('<object|string|array> [string]', [keys, msg], arguments.length);
    this[kPopulateParserHintSingleValueDictionary](this.demandOption.bind(this), 'demandedOptions', keys, msg);
    return this;
  }
  deprecateOption(option, message) {
    argsert('<string> [string|boolean]', [option, message], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_options, "f").deprecatedOptions[option] = message;
    return this;
  }
  describe(keys, description) {
    argsert('<object|string|array> [string]', [keys, description], arguments.length);
    this[kSetKey](keys, true);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").describe(keys, description);
    return this;
  }
  detectLocale(detect) {
    argsert('<boolean>', [detect], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_detectLocale, detect, "f");
    return this;
  }
  env(prefix) {
    argsert('[string|boolean]', [prefix], arguments.length);
    if (prefix === false) delete __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix;else __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix = prefix || '';
    return this;
  }
  epilogue(msg) {
    argsert('<string>', [msg], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").epilog(msg);
    return this;
  }
  epilog(msg) {
    return this.epilogue(msg);
  }
  example(cmd, description) {
    argsert('<string|array> [string]', [cmd, description], arguments.length);
    if (Array.isArray(cmd)) {
      cmd.forEach(exampleParams => this.example(...exampleParams));
    } else {
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").example(cmd, description);
    }
    return this;
  }
  exit(code, err) {
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
    __classPrivateFieldSet(this, _YargsInstance_exitError, err, "f");
    if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f")) __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.exit(code);
  }
  exitProcess(enabled = true) {
    argsert('[boolean]', [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_exitProcess, enabled, "f");
    return this;
  }
  fail(f) {
    argsert('<function|boolean>', [f], arguments.length);
    if (typeof f === 'boolean' && f !== false) {
      throw new YError("Invalid first argument. Expected function or boolean 'false'");
    }
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").failFn(f);
    return this;
  }
  getAliases() {
    return this.parsed ? this.parsed.aliases : {};
  }
  async getCompletion(args, done) {
    argsert('<array> [function]', [args, done], arguments.length);
    if (!done) {
      return new Promise((resolve, reject) => {
        __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(args, (err, completions) => {
          if (err) reject(err);else resolve(completions);
        });
      });
    } else {
      return __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(args, done);
    }
  }
  getDemandedOptions() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedOptions;
  }
  getDemandedCommands() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedCommands;
  }
  getDeprecatedOptions() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_options, "f").deprecatedOptions;
  }
  getDetectLocale() {
    return __classPrivateFieldGet(this, _YargsInstance_detectLocale, "f");
  }
  getExitProcess() {
    return __classPrivateFieldGet(this, _YargsInstance_exitProcess, "f");
  }
  getGroups() {
    return Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_groups, "f"), __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f"));
  }
  getHelp() {
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
    if (!__classPrivateFieldGet(this, _YargsInstance_usage, "f").hasCachedHelpMessage()) {
      if (!this.parsed) {
        const parse = this[kRunYargsParserAndExecuteCommands](__classPrivateFieldGet(this, _YargsInstance_processArgs, "f"), undefined, undefined, 0, true);
        if (isPromise(parse)) {
          return parse.then(() => {
            return __classPrivateFieldGet(this, _YargsInstance_usage, "f").help();
          });
        }
      }
      const builderResponse = __classPrivateFieldGet(this, _YargsInstance_command, "f").runDefaultBuilderOn(this);
      if (isPromise(builderResponse)) {
        return builderResponse.then(() => {
          return __classPrivateFieldGet(this, _YargsInstance_usage, "f").help();
        });
      }
    }
    return Promise.resolve(__classPrivateFieldGet(this, _YargsInstance_usage, "f").help());
  }
  getOptions() {
    return __classPrivateFieldGet(this, _YargsInstance_options, "f");
  }
  getStrict() {
    return __classPrivateFieldGet(this, _YargsInstance_strict, "f");
  }
  getStrictCommands() {
    return __classPrivateFieldGet(this, _YargsInstance_strictCommands, "f");
  }
  getStrictOptions() {
    return __classPrivateFieldGet(this, _YargsInstance_strictOptions, "f");
  }
  global(globals, global) {
    argsert('<string|array> [boolean]', [globals, global], arguments.length);
    globals = [].concat(globals);
    if (global !== false) {
      __classPrivateFieldGet(this, _YargsInstance_options, "f").local = __classPrivateFieldGet(this, _YargsInstance_options, "f").local.filter(l => globals.indexOf(l) === -1);
    } else {
      globals.forEach(g => {
        if (!__classPrivateFieldGet(this, _YargsInstance_options, "f").local.includes(g)) __classPrivateFieldGet(this, _YargsInstance_options, "f").local.push(g);
      });
    }
    return this;
  }
  group(opts, groupName) {
    argsert('<string|array> <string>', [opts, groupName], arguments.length);
    const existing = __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName] || __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName];
    if (__classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName]) {
      delete __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName];
    }
    const seen = {};
    __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName] = (existing || []).concat(opts).filter(key => {
      if (seen[key]) return false;
      return seen[key] = true;
    });
    return this;
  }
  hide(key) {
    argsert('<string>', [key], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_options, "f").hiddenOptions.push(key);
    return this;
  }
  implies(key, value) {
    argsert('<string|object> [number|string|array]', [key, value], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").implies(key, value);
    return this;
  }
  locale(locale) {
    argsert('[string]', [locale], arguments.length);
    if (locale === undefined) {
      this[kGuessLocale]();
      return __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.getLocale();
    }
    __classPrivateFieldSet(this, _YargsInstance_detectLocale, false, "f");
    __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.setLocale(locale);
    return this;
  }
  middleware(callback, applyBeforeValidation, global) {
    return __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").addMiddleware(callback, !!applyBeforeValidation, global);
  }
  nargs(key, value) {
    argsert('<string|object|array> [number]', [key, value], arguments.length);
    this[kPopulateParserHintSingleValueDictionary](this.nargs.bind(this), 'narg', key, value);
    return this;
  }
  normalize(keys) {
    argsert('<array|string>', [keys], arguments.length);
    this[kPopulateParserHintArray]('normalize', keys);
    return this;
  }
  number(keys) {
    argsert('<array|string>', [keys], arguments.length);
    this[kPopulateParserHintArray]('number', keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  option(key, opt) {
    argsert('<string|object> [object]', [key, opt], arguments.length);
    if (typeof key === 'object') {
      Object.keys(key).forEach(k => {
        this.options(k, key[k]);
      });
    } else {
      if (typeof opt !== 'object') {
        opt = {};
      }
      this[kTrackManuallySetKeys](key);
      if (__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f") && (key === 'version' || (opt === null || opt === void 0 ? void 0 : opt.alias) === 'version')) {
        this[kEmitWarning](['"version" is a reserved word.', 'Please do one of the following:', '- Disable version with `yargs.version(false)` if using "version" as an option', '- Use the built-in `yargs.version` method instead (if applicable)', '- Use a different option key', 'https://yargs.js.org/docs/#api-reference-version'].join('\n'), undefined, 'versionWarning');
      }
      __classPrivateFieldGet(this, _YargsInstance_options, "f").key[key] = true;
      if (opt.alias) this.alias(key, opt.alias);
      const deprecate = opt.deprecate || opt.deprecated;
      if (deprecate) {
        this.deprecateOption(key, deprecate);
      }
      const demand = opt.demand || opt.required || opt.require;
      if (demand) {
        this.demand(key, demand);
      }
      if (opt.demandOption) {
        this.demandOption(key, typeof opt.demandOption === 'string' ? opt.demandOption : undefined);
      }
      if (opt.conflicts) {
        this.conflicts(key, opt.conflicts);
      }
      if ('default' in opt) {
        this.default(key, opt.default);
      }
      if (opt.implies !== undefined) {
        this.implies(key, opt.implies);
      }
      if (opt.nargs !== undefined) {
        this.nargs(key, opt.nargs);
      }
      if (opt.config) {
        this.config(key, opt.configParser);
      }
      if (opt.normalize) {
        this.normalize(key);
      }
      if (opt.choices) {
        this.choices(key, opt.choices);
      }
      if (opt.coerce) {
        this.coerce(key, opt.coerce);
      }
      if (opt.group) {
        this.group(key, opt.group);
      }
      if (opt.boolean || opt.type === 'boolean') {
        this.boolean(key);
        if (opt.alias) this.boolean(opt.alias);
      }
      if (opt.array || opt.type === 'array') {
        this.array(key);
        if (opt.alias) this.array(opt.alias);
      }
      if (opt.number || opt.type === 'number') {
        this.number(key);
        if (opt.alias) this.number(opt.alias);
      }
      if (opt.string || opt.type === 'string') {
        this.string(key);
        if (opt.alias) this.string(opt.alias);
      }
      if (opt.count || opt.type === 'count') {
        this.count(key);
      }
      if (typeof opt.global === 'boolean') {
        this.global(key, opt.global);
      }
      if (opt.defaultDescription) {
        __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = opt.defaultDescription;
      }
      if (opt.skipValidation) {
        this.skipValidation(key);
      }
      const desc = opt.describe || opt.description || opt.desc;
      const descriptions = __classPrivateFieldGet(this, _YargsInstance_usage, "f").getDescriptions();
      if (!Object.prototype.hasOwnProperty.call(descriptions, key) || typeof desc === 'string') {
        this.describe(key, desc);
      }
      if (opt.hidden) {
        this.hide(key);
      }
      if (opt.requiresArg) {
        this.requiresArg(key);
      }
    }
    return this;
  }
  options(key, opt) {
    return this.option(key, opt);
  }
  parse(args, shortCircuit, _parseFn) {
    argsert('[string|array] [function|boolean|object] [function]', [args, shortCircuit, _parseFn], arguments.length);
    this[kFreeze]();
    if (typeof args === 'undefined') {
      args = __classPrivateFieldGet(this, _YargsInstance_processArgs, "f");
    }
    if (typeof shortCircuit === 'object') {
      __classPrivateFieldSet(this, _YargsInstance_parseContext, shortCircuit, "f");
      shortCircuit = _parseFn;
    }
    if (typeof shortCircuit === 'function') {
      __classPrivateFieldSet(this, _YargsInstance_parseFn, shortCircuit, "f");
      shortCircuit = false;
    }
    if (!shortCircuit) __classPrivateFieldSet(this, _YargsInstance_processArgs, args, "f");
    if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f")) __classPrivateFieldSet(this, _YargsInstance_exitProcess, false, "f");
    const parsed = this[kRunYargsParserAndExecuteCommands](args, !!shortCircuit);
    const tmpParsed = this.parsed;
    __classPrivateFieldGet(this, _YargsInstance_completion, "f").setParsed(this.parsed);
    if (isPromise(parsed)) {
      return parsed.then(argv => {
        if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f")) __classPrivateFieldGet(this, _YargsInstance_parseFn, "f").call(this, __classPrivateFieldGet(this, _YargsInstance_exitError, "f"), argv, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
        return argv;
      }).catch(err => {
        if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f")) {
          __classPrivateFieldGet(this, _YargsInstance_parseFn, "f")(err, this.parsed.argv, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
        }
        throw err;
      }).finally(() => {
        this[kUnfreeze]();
        this.parsed = tmpParsed;
      });
    } else {
      if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f")) __classPrivateFieldGet(this, _YargsInstance_parseFn, "f").call(this, __classPrivateFieldGet(this, _YargsInstance_exitError, "f"), parsed, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
      this[kUnfreeze]();
      this.parsed = tmpParsed;
    }
    return parsed;
  }
  parseAsync(args, shortCircuit, _parseFn) {
    const maybePromise = this.parse(args, shortCircuit, _parseFn);
    return !isPromise(maybePromise) ? Promise.resolve(maybePromise) : maybePromise;
  }
  parseSync(args, shortCircuit, _parseFn) {
    const maybePromise = this.parse(args, shortCircuit, _parseFn);
    if (isPromise(maybePromise)) {
      throw new YError('.parseSync() must not be used with asynchronous builders, handlers, or middleware');
    }
    return maybePromise;
  }
  parserConfiguration(config) {
    argsert('<object>', [config], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_parserConfig, config, "f");
    return this;
  }
  pkgConf(key, rootPath) {
    argsert('<string> [string]', [key, rootPath], arguments.length);
    let conf = null;
    const obj = this[kPkgUp](rootPath || __classPrivateFieldGet(this, _YargsInstance_cwd, "f"));
    if (obj[key] && typeof obj[key] === 'object') {
      conf = applyExtends(obj[key], rootPath || __classPrivateFieldGet(this, _YargsInstance_cwd, "f"), this[kGetParserConfiguration]()['deep-merge-config'] || false, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = (__classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || []).concat(conf);
    }
    return this;
  }
  positional(key, opts) {
    argsert('<string> <object>', [key, opts], arguments.length);
    const supportedOpts = ['default', 'defaultDescription', 'implies', 'normalize', 'choices', 'conflicts', 'coerce', 'type', 'describe', 'desc', 'description', 'alias'];
    opts = objFilter(opts, (k, v) => {
      if (k === 'type' && !['string', 'number', 'boolean'].includes(v)) return false;
      return supportedOpts.includes(k);
    });
    const fullCommand = __classPrivateFieldGet(this, _YargsInstance_context, "f").fullCommands[__classPrivateFieldGet(this, _YargsInstance_context, "f").fullCommands.length - 1];
    const parseOptions = fullCommand ? __classPrivateFieldGet(this, _YargsInstance_command, "f").cmdToParseOptions(fullCommand) : {
      array: [],
      alias: {},
      default: {},
      demand: {}
    };
    objectKeys(parseOptions).forEach(pk => {
      const parseOption = parseOptions[pk];
      if (Array.isArray(parseOption)) {
        if (parseOption.indexOf(key) !== -1) opts[pk] = true;
      } else {
        if (parseOption[key] && !(pk in opts)) opts[pk] = parseOption[key];
      }
    });
    this.group(key, __classPrivateFieldGet(this, _YargsInstance_usage, "f").getPositionalGroupName());
    return this.option(key, opts);
  }
  recommendCommands(recommend = true) {
    argsert('[boolean]', [recommend], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_recommendCommands, recommend, "f");
    return this;
  }
  required(keys, max, msg) {
    return this.demand(keys, max, msg);
  }
  require(keys, max, msg) {
    return this.demand(keys, max, msg);
  }
  requiresArg(keys) {
    argsert('<array|string|object> [number]', [keys], arguments.length);
    if (typeof keys === 'string' && __classPrivateFieldGet(this, _YargsInstance_options, "f").narg[keys]) {
      return this;
    } else {
      this[kPopulateParserHintSingleValueDictionary](this.requiresArg.bind(this), 'narg', keys, NaN);
    }
    return this;
  }
  showCompletionScript($0, cmd) {
    argsert('[string] [string]', [$0, cmd], arguments.length);
    $0 = $0 || this.$0;
    __classPrivateFieldGet(this, _YargsInstance_logger, "f").log(__classPrivateFieldGet(this, _YargsInstance_completion, "f").generateCompletionScript($0, cmd || __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") || 'completion'));
    return this;
  }
  showHelp(level) {
    argsert('[string|function]', [level], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
    if (!__classPrivateFieldGet(this, _YargsInstance_usage, "f").hasCachedHelpMessage()) {
      if (!this.parsed) {
        const parse = this[kRunYargsParserAndExecuteCommands](__classPrivateFieldGet(this, _YargsInstance_processArgs, "f"), undefined, undefined, 0, true);
        if (isPromise(parse)) {
          parse.then(() => {
            __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
          });
          return this;
        }
      }
      const builderResponse = __classPrivateFieldGet(this, _YargsInstance_command, "f").runDefaultBuilderOn(this);
      if (isPromise(builderResponse)) {
        builderResponse.then(() => {
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
        });
        return this;
      }
    }
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
    return this;
  }
  scriptName(scriptName) {
    this.customScriptName = true;
    this.$0 = scriptName;
    return this;
  }
  showHelpOnFail(enabled, message) {
    argsert('[boolean|string] [string]', [enabled, message], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelpOnFail(enabled, message);
    return this;
  }
  showVersion(level) {
    argsert('[string|function]', [level], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showVersion(level);
    return this;
  }
  skipValidation(keys) {
    argsert('<array|string>', [keys], arguments.length);
    this[kPopulateParserHintArray]('skipValidation', keys);
    return this;
  }
  strict(enabled) {
    argsert('[boolean]', [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_strict, enabled !== false, "f");
    return this;
  }
  strictCommands(enabled) {
    argsert('[boolean]', [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_strictCommands, enabled !== false, "f");
    return this;
  }
  strictOptions(enabled) {
    argsert('[boolean]', [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_strictOptions, enabled !== false, "f");
    return this;
  }
  string(keys) {
    argsert('<array|string>', [keys], arguments.length);
    this[kPopulateParserHintArray]('string', keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  terminalWidth() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.stdColumns;
  }
  updateLocale(obj) {
    return this.updateStrings(obj);
  }
  updateStrings(obj) {
    argsert('<object>', [obj], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_detectLocale, false, "f");
    __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.updateLocale(obj);
    return this;
  }
  usage(msg, description, builder, handler) {
    argsert('<string|null|undefined> [string|boolean] [function|object] [function]', [msg, description, builder, handler], arguments.length);
    if (description !== undefined) {
      assertNotStrictEqual(msg, null, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      if ((msg || '').match(/^\$0( |$)/)) {
        return this.command(msg, description, builder, handler);
      } else {
        throw new YError('.usage() description must start with $0 if being used as alias for .command()');
      }
    } else {
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").usage(msg);
      return this;
    }
  }
  usageConfiguration(config) {
    argsert('<object>', [config], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_usageConfig, config, "f");
    return this;
  }
  version(opt, msg, ver) {
    const defaultVersionOpt = 'version';
    argsert('[boolean|string] [string] [string]', [opt, msg, ver], arguments.length);
    if (__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f")) {
      this[kDeleteFromParserHintObject](__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"));
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").version(undefined);
      __classPrivateFieldSet(this, _YargsInstance_versionOpt, null, "f");
    }
    if (arguments.length === 0) {
      ver = this[kGuessVersion]();
      opt = defaultVersionOpt;
    } else if (arguments.length === 1) {
      if (opt === false) {
        return this;
      }
      ver = opt;
      opt = defaultVersionOpt;
    } else if (arguments.length === 2) {
      ver = msg;
      msg = undefined;
    }
    __classPrivateFieldSet(this, _YargsInstance_versionOpt, typeof opt === 'string' ? opt : defaultVersionOpt, "f");
    msg = msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup('Show version number');
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").version(ver || undefined);
    this.boolean(__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"));
    this.describe(__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"), msg);
    return this;
  }
  wrap(cols) {
    argsert('<number|null|undefined>', [cols], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").wrap(cols);
    return this;
  }
  [(_YargsInstance_command = new WeakMap(), _YargsInstance_cwd = new WeakMap(), _YargsInstance_context = new WeakMap(), _YargsInstance_completion = new WeakMap(), _YargsInstance_completionCommand = new WeakMap(), _YargsInstance_defaultShowHiddenOpt = new WeakMap(), _YargsInstance_exitError = new WeakMap(), _YargsInstance_detectLocale = new WeakMap(), _YargsInstance_emittedWarnings = new WeakMap(), _YargsInstance_exitProcess = new WeakMap(), _YargsInstance_frozens = new WeakMap(), _YargsInstance_globalMiddleware = new WeakMap(), _YargsInstance_groups = new WeakMap(), _YargsInstance_hasOutput = new WeakMap(), _YargsInstance_helpOpt = new WeakMap(), _YargsInstance_isGlobalContext = new WeakMap(), _YargsInstance_logger = new WeakMap(), _YargsInstance_output = new WeakMap(), _YargsInstance_options = new WeakMap(), _YargsInstance_parentRequire = new WeakMap(), _YargsInstance_parserConfig = new WeakMap(), _YargsInstance_parseFn = new WeakMap(), _YargsInstance_parseContext = new WeakMap(), _YargsInstance_pkgs = new WeakMap(), _YargsInstance_preservedGroups = new WeakMap(), _YargsInstance_processArgs = new WeakMap(), _YargsInstance_recommendCommands = new WeakMap(), _YargsInstance_shim = new WeakMap(), _YargsInstance_strict = new WeakMap(), _YargsInstance_strictCommands = new WeakMap(), _YargsInstance_strictOptions = new WeakMap(), _YargsInstance_usage = new WeakMap(), _YargsInstance_usageConfig = new WeakMap(), _YargsInstance_versionOpt = new WeakMap(), _YargsInstance_validation = new WeakMap(), kCopyDoubleDash)](argv) {
    if (!argv._ || !argv['--']) return argv;
    argv._.push.apply(argv._, argv['--']);
    try {
      delete argv['--'];
    } catch (_err) {}
    return argv;
  }
  [kCreateLogger]() {
    return {
      log: (...args) => {
        if (!this[kHasParseCallback]()) console.log(...args);
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
        if (__classPrivateFieldGet(this, _YargsInstance_output, "f").length) __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + '\n', "f");
        __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + args.join(' '), "f");
      },
      error: (...args) => {
        if (!this[kHasParseCallback]()) console.error(...args);
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
        if (__classPrivateFieldGet(this, _YargsInstance_output, "f").length) __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + '\n', "f");
        __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + args.join(' '), "f");
      }
    };
  }
  [kDeleteFromParserHintObject](optionKey) {
    objectKeys(__classPrivateFieldGet(this, _YargsInstance_options, "f")).forEach(hintKey => {
      if ((key => key === 'configObjects')(hintKey)) return;
      const hint = __classPrivateFieldGet(this, _YargsInstance_options, "f")[hintKey];
      if (Array.isArray(hint)) {
        if (hint.includes(optionKey)) hint.splice(hint.indexOf(optionKey), 1);
      } else if (typeof hint === 'object') {
        delete hint[optionKey];
      }
    });
    delete __classPrivateFieldGet(this, _YargsInstance_usage, "f").getDescriptions()[optionKey];
  }
  [kEmitWarning](warning, type, deduplicationId) {
    if (!__classPrivateFieldGet(this, _YargsInstance_emittedWarnings, "f")[deduplicationId]) {
      __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.emitWarning(warning, type);
      __classPrivateFieldGet(this, _YargsInstance_emittedWarnings, "f")[deduplicationId] = true;
    }
  }
  [kFreeze]() {
    __classPrivateFieldGet(this, _YargsInstance_frozens, "f").push({
      options: __classPrivateFieldGet(this, _YargsInstance_options, "f"),
      configObjects: __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects.slice(0),
      exitProcess: __classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"),
      groups: __classPrivateFieldGet(this, _YargsInstance_groups, "f"),
      strict: __classPrivateFieldGet(this, _YargsInstance_strict, "f"),
      strictCommands: __classPrivateFieldGet(this, _YargsInstance_strictCommands, "f"),
      strictOptions: __classPrivateFieldGet(this, _YargsInstance_strictOptions, "f"),
      completionCommand: __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f"),
      output: __classPrivateFieldGet(this, _YargsInstance_output, "f"),
      exitError: __classPrivateFieldGet(this, _YargsInstance_exitError, "f"),
      hasOutput: __classPrivateFieldGet(this, _YargsInstance_hasOutput, "f"),
      parsed: this.parsed,
      parseFn: __classPrivateFieldGet(this, _YargsInstance_parseFn, "f"),
      parseContext: __classPrivateFieldGet(this, _YargsInstance_parseContext, "f")
    });
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").freeze();
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").freeze();
    __classPrivateFieldGet(this, _YargsInstance_command, "f").freeze();
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").freeze();
  }
  [kGetDollarZero]() {
    let $0 = '';
    let default$0;
    if (/\b(node|iojs|electron)(\.exe)?$/.test(__classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv()[0])) {
      default$0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv().slice(1, 2);
    } else {
      default$0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv().slice(0, 1);
    }
    $0 = default$0.map(x => {
      const b = this[kRebase](__classPrivateFieldGet(this, _YargsInstance_cwd, "f"), x);
      return x.match(/^(\/|([a-zA-Z]:)?\\)/) && b.length < x.length ? b : x;
    }).join(' ').trim();
    if (__classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('_') && __classPrivateFieldGet(this, _YargsInstance_shim, "f").getProcessArgvBin() === __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('_')) {
      $0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('_').replace(`${__classPrivateFieldGet(this, _YargsInstance_shim, "f").path.dirname(__classPrivateFieldGet(this, _YargsInstance_shim, "f").process.execPath())}/`, '');
    }
    return $0;
  }
  [kGetParserConfiguration]() {
    return __classPrivateFieldGet(this, _YargsInstance_parserConfig, "f");
  }
  [kGetUsageConfiguration]() {
    return __classPrivateFieldGet(this, _YargsInstance_usageConfig, "f");
  }
  [kGuessLocale]() {
    if (!__classPrivateFieldGet(this, _YargsInstance_detectLocale, "f")) return;
    const locale = __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('LC_ALL') || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('LC_MESSAGES') || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('LANG') || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv('LANGUAGE') || 'en_US';
    this.locale(locale.replace(/[.:].*/, ''));
  }
  [kGuessVersion]() {
    const obj = this[kPkgUp]();
    return obj.version || 'unknown';
  }
  [kParsePositionalNumbers](argv) {
    const args = argv['--'] ? argv['--'] : argv._;
    for (let i = 0, arg; (arg = args[i]) !== undefined; i++) {
      if (__classPrivateFieldGet(this, _YargsInstance_shim, "f").Parser.looksLikeNumber(arg) && Number.isSafeInteger(Math.floor(parseFloat(`${arg}`)))) {
        args[i] = Number(arg);
      }
    }
    return argv;
  }
  [kPkgUp](rootPath) {
    const npath = rootPath || '*';
    if (__classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath]) return __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath];
    let obj = {};
    try {
      let startDir = rootPath || __classPrivateFieldGet(this, _YargsInstance_shim, "f").mainFilename;
      if (!rootPath && __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.extname(startDir)) {
        startDir = __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.dirname(startDir);
      }
      const pkgJsonPath = __classPrivateFieldGet(this, _YargsInstance_shim, "f").findUp(startDir, (dir, names) => {
        if (names.includes('package.json')) {
          return 'package.json';
        } else {
          return undefined;
        }
      });
      assertNotStrictEqual(pkgJsonPath, undefined, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      obj = JSON.parse(__classPrivateFieldGet(this, _YargsInstance_shim, "f").readFileSync(pkgJsonPath, 'utf8'));
    } catch (_noop) {}
    __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath] = obj || {};
    return __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath];
  }
  [kPopulateParserHintArray](type, keys) {
    keys = [].concat(keys);
    keys.forEach(key => {
      key = this[kSanitizeKey](key);
      __classPrivateFieldGet(this, _YargsInstance_options, "f")[type].push(key);
    });
  }
  [kPopulateParserHintSingleValueDictionary](builder, type, key, value) {
    this[kPopulateParserHintDictionary](builder, type, key, value, (type, key, value) => {
      __classPrivateFieldGet(this, _YargsInstance_options, "f")[type][key] = value;
    });
  }
  [kPopulateParserHintArrayDictionary](builder, type, key, value) {
    this[kPopulateParserHintDictionary](builder, type, key, value, (type, key, value) => {
      __classPrivateFieldGet(this, _YargsInstance_options, "f")[type][key] = (__classPrivateFieldGet(this, _YargsInstance_options, "f")[type][key] || []).concat(value);
    });
  }
  [kPopulateParserHintDictionary](builder, type, key, value, singleKeyHandler) {
    if (Array.isArray(key)) {
      key.forEach(k => {
        builder(k, value);
      });
    } else if ((key => typeof key === 'object')(key)) {
      for (const k of objectKeys(key)) {
        builder(k, key[k]);
      }
    } else {
      singleKeyHandler(type, this[kSanitizeKey](key), value);
    }
  }
  [kSanitizeKey](key) {
    if (key === '__proto__') return '___proto___';
    return key;
  }
  [kSetKey](key, set) {
    this[kPopulateParserHintSingleValueDictionary](this[kSetKey].bind(this), 'key', key, set);
    return this;
  }
  [kUnfreeze]() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const frozen = __classPrivateFieldGet(this, _YargsInstance_frozens, "f").pop();
    assertNotStrictEqual(frozen, undefined, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
    let configObjects;
    _a = this, _b = this, _c = this, _d = this, _e = this, _f = this, _g = this, _h = this, _j = this, _k = this, _l = this, _m = this, ({
      options: {
        set value(_o) {
          __classPrivateFieldSet(_a, _YargsInstance_options, _o, "f");
        }
      }.value,
      configObjects,
      exitProcess: {
        set value(_o) {
          __classPrivateFieldSet(_b, _YargsInstance_exitProcess, _o, "f");
        }
      }.value,
      groups: {
        set value(_o) {
          __classPrivateFieldSet(_c, _YargsInstance_groups, _o, "f");
        }
      }.value,
      output: {
        set value(_o) {
          __classPrivateFieldSet(_d, _YargsInstance_output, _o, "f");
        }
      }.value,
      exitError: {
        set value(_o) {
          __classPrivateFieldSet(_e, _YargsInstance_exitError, _o, "f");
        }
      }.value,
      hasOutput: {
        set value(_o) {
          __classPrivateFieldSet(_f, _YargsInstance_hasOutput, _o, "f");
        }
      }.value,
      parsed: this.parsed,
      strict: {
        set value(_o) {
          __classPrivateFieldSet(_g, _YargsInstance_strict, _o, "f");
        }
      }.value,
      strictCommands: {
        set value(_o) {
          __classPrivateFieldSet(_h, _YargsInstance_strictCommands, _o, "f");
        }
      }.value,
      strictOptions: {
        set value(_o) {
          __classPrivateFieldSet(_j, _YargsInstance_strictOptions, _o, "f");
        }
      }.value,
      completionCommand: {
        set value(_o) {
          __classPrivateFieldSet(_k, _YargsInstance_completionCommand, _o, "f");
        }
      }.value,
      parseFn: {
        set value(_o) {
          __classPrivateFieldSet(_l, _YargsInstance_parseFn, _o, "f");
        }
      }.value,
      parseContext: {
        set value(_o) {
          __classPrivateFieldSet(_m, _YargsInstance_parseContext, _o, "f");
        }
      }.value
    } = frozen);
    __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = configObjects;
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").unfreeze();
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").unfreeze();
    __classPrivateFieldGet(this, _YargsInstance_command, "f").unfreeze();
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").unfreeze();
  }
  [kValidateAsync](validation, argv) {
    return maybeAsyncResult(argv, result => {
      validation(result);
      return result;
    });
  }
  getInternalMethods() {
    return {
      getCommandInstance: this[kGetCommandInstance].bind(this),
      getContext: this[kGetContext].bind(this),
      getHasOutput: this[kGetHasOutput].bind(this),
      getLoggerInstance: this[kGetLoggerInstance].bind(this),
      getParseContext: this[kGetParseContext].bind(this),
      getParserConfiguration: this[kGetParserConfiguration].bind(this),
      getUsageConfiguration: this[kGetUsageConfiguration].bind(this),
      getUsageInstance: this[kGetUsageInstance].bind(this),
      getValidationInstance: this[kGetValidationInstance].bind(this),
      hasParseCallback: this[kHasParseCallback].bind(this),
      isGlobalContext: this[kIsGlobalContext].bind(this),
      postProcess: this[kPostProcess].bind(this),
      reset: this[kReset].bind(this),
      runValidation: this[kRunValidation].bind(this),
      runYargsParserAndExecuteCommands: this[kRunYargsParserAndExecuteCommands].bind(this),
      setHasOutput: this[kSetHasOutput].bind(this)
    };
  }
  [kGetCommandInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_command, "f");
  }
  [kGetContext]() {
    return __classPrivateFieldGet(this, _YargsInstance_context, "f");
  }
  [kGetHasOutput]() {
    return __classPrivateFieldGet(this, _YargsInstance_hasOutput, "f");
  }
  [kGetLoggerInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_logger, "f");
  }
  [kGetParseContext]() {
    return __classPrivateFieldGet(this, _YargsInstance_parseContext, "f") || {};
  }
  [kGetUsageInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_usage, "f");
  }
  [kGetValidationInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_validation, "f");
  }
  [kHasParseCallback]() {
    return !!__classPrivateFieldGet(this, _YargsInstance_parseFn, "f");
  }
  [kIsGlobalContext]() {
    return __classPrivateFieldGet(this, _YargsInstance_isGlobalContext, "f");
  }
  [kPostProcess](argv, populateDoubleDash, calledFromCommand, runGlobalMiddleware) {
    if (calledFromCommand) return argv;
    if (isPromise(argv)) return argv;
    if (!populateDoubleDash) {
      argv = this[kCopyDoubleDash](argv);
    }
    const parsePositionalNumbers = this[kGetParserConfiguration]()['parse-positional-numbers'] || this[kGetParserConfiguration]()['parse-positional-numbers'] === undefined;
    if (parsePositionalNumbers) {
      argv = this[kParsePositionalNumbers](argv);
    }
    if (runGlobalMiddleware) {
      argv = applyMiddleware(argv, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), false);
    }
    return argv;
  }
  [kReset](aliases = {}) {
    __classPrivateFieldSet(this, _YargsInstance_options, __classPrivateFieldGet(this, _YargsInstance_options, "f") || {}, "f");
    const tmpOptions = {};
    tmpOptions.local = __classPrivateFieldGet(this, _YargsInstance_options, "f").local || [];
    tmpOptions.configObjects = __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || [];
    const localLookup = {};
    tmpOptions.local.forEach(l => {
      localLookup[l] = true;
      (aliases[l] || []).forEach(a => {
        localLookup[a] = true;
      });
    });
    Object.assign(__classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f"), Object.keys(__classPrivateFieldGet(this, _YargsInstance_groups, "f")).reduce((acc, groupName) => {
      const keys = __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName].filter(key => !(key in localLookup));
      if (keys.length > 0) {
        acc[groupName] = keys;
      }
      return acc;
    }, {}));
    __classPrivateFieldSet(this, _YargsInstance_groups, {}, "f");
    const arrayOptions = ['array', 'boolean', 'string', 'skipValidation', 'count', 'normalize', 'number', 'hiddenOptions'];
    const objectOptions = ['narg', 'key', 'alias', 'default', 'defaultDescription', 'config', 'choices', 'demandedOptions', 'demandedCommands', 'deprecatedOptions'];
    arrayOptions.forEach(k => {
      tmpOptions[k] = (__classPrivateFieldGet(this, _YargsInstance_options, "f")[k] || []).filter(k => !localLookup[k]);
    });
    objectOptions.forEach(k => {
      tmpOptions[k] = objFilter(__classPrivateFieldGet(this, _YargsInstance_options, "f")[k], k => !localLookup[k]);
    });
    tmpOptions.envPrefix = __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix;
    __classPrivateFieldSet(this, _YargsInstance_options, tmpOptions, "f");
    __classPrivateFieldSet(this, _YargsInstance_usage, __classPrivateFieldGet(this, _YargsInstance_usage, "f") ? __classPrivateFieldGet(this, _YargsInstance_usage, "f").reset(localLookup) : usage(this, __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    __classPrivateFieldSet(this, _YargsInstance_validation, __classPrivateFieldGet(this, _YargsInstance_validation, "f") ? __classPrivateFieldGet(this, _YargsInstance_validation, "f").reset(localLookup) : validation(this, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    __classPrivateFieldSet(this, _YargsInstance_command, __classPrivateFieldGet(this, _YargsInstance_command, "f") ? __classPrivateFieldGet(this, _YargsInstance_command, "f").reset() : command(__classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_validation, "f"), __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    if (!__classPrivateFieldGet(this, _YargsInstance_completion, "f")) __classPrivateFieldSet(this, _YargsInstance_completion, completion(this, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_command, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").reset();
    __classPrivateFieldSet(this, _YargsInstance_completionCommand, null, "f");
    __classPrivateFieldSet(this, _YargsInstance_output, '', "f");
    __classPrivateFieldSet(this, _YargsInstance_exitError, null, "f");
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, false, "f");
    this.parsed = false;
    return this;
  }
  [kRebase](base, dir) {
    return __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.relative(base, dir);
  }
  [kRunYargsParserAndExecuteCommands](args, shortCircuit, calledFromCommand, commandIndex = 0, helpOnly = false) {
    let skipValidation = !!calledFromCommand || helpOnly;
    args = args || __classPrivateFieldGet(this, _YargsInstance_processArgs, "f");
    __classPrivateFieldGet(this, _YargsInstance_options, "f").__ = __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.__;
    __classPrivateFieldGet(this, _YargsInstance_options, "f").configuration = this[kGetParserConfiguration]();
    const populateDoubleDash = !!__classPrivateFieldGet(this, _YargsInstance_options, "f").configuration['populate--'];
    const config = Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_options, "f").configuration, {
      'populate--': true
    });
    const parsed = __classPrivateFieldGet(this, _YargsInstance_shim, "f").Parser.detailed(args, Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_options, "f"), {
      configuration: {
        'parse-positional-numbers': false,
        ...config
      }
    }));
    const argv = Object.assign(parsed.argv, __classPrivateFieldGet(this, _YargsInstance_parseContext, "f"));
    let argvPromise = undefined;
    const aliases = parsed.aliases;
    let helpOptSet = false;
    let versionOptSet = false;
    Object.keys(argv).forEach(key => {
      if (key === __classPrivateFieldGet(this, _YargsInstance_helpOpt, "f") && argv[key]) {
        helpOptSet = true;
      } else if (key === __classPrivateFieldGet(this, _YargsInstance_versionOpt, "f") && argv[key]) {
        versionOptSet = true;
      }
    });
    argv.$0 = this.$0;
    this.parsed = parsed;
    if (commandIndex === 0) {
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").clearCachedHelpMessage();
    }
    try {
      this[kGuessLocale]();
      if (shortCircuit) {
        return this[kPostProcess](argv, populateDoubleDash, !!calledFromCommand, false);
      }
      if (__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")) {
        const helpCmds = [__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")].concat(aliases[__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")] || []).filter(k => k.length > 1);
        if (helpCmds.includes('' + argv._[argv._.length - 1])) {
          argv._.pop();
          helpOptSet = true;
        }
      }
      __classPrivateFieldSet(this, _YargsInstance_isGlobalContext, false, "f");
      const handlerKeys = __classPrivateFieldGet(this, _YargsInstance_command, "f").getCommands();
      const requestCompletions = __classPrivateFieldGet(this, _YargsInstance_completion, "f").completionKey in argv;
      const skipRecommendation = helpOptSet || requestCompletions || helpOnly;
      if (argv._.length) {
        if (handlerKeys.length) {
          let firstUnknownCommand;
          for (let i = commandIndex || 0, cmd; argv._[i] !== undefined; i++) {
            cmd = String(argv._[i]);
            if (handlerKeys.includes(cmd) && cmd !== __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) {
              const innerArgv = __classPrivateFieldGet(this, _YargsInstance_command, "f").runCommand(cmd, this, parsed, i + 1, helpOnly, helpOptSet || versionOptSet || helpOnly);
              return this[kPostProcess](innerArgv, populateDoubleDash, !!calledFromCommand, false);
            } else if (!firstUnknownCommand && cmd !== __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) {
              firstUnknownCommand = cmd;
              break;
            }
          }
          if (!__classPrivateFieldGet(this, _YargsInstance_command, "f").hasDefaultCommand() && __classPrivateFieldGet(this, _YargsInstance_recommendCommands, "f") && firstUnknownCommand && !skipRecommendation) {
            __classPrivateFieldGet(this, _YargsInstance_validation, "f").recommendCommands(firstUnknownCommand, handlerKeys);
          }
        }
        if (__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") && argv._.includes(__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) && !requestCompletions) {
          if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f")) setBlocking(true);
          this.showCompletionScript();
          this.exit(0);
        }
      }
      if (__classPrivateFieldGet(this, _YargsInstance_command, "f").hasDefaultCommand() && !skipRecommendation) {
        const innerArgv = __classPrivateFieldGet(this, _YargsInstance_command, "f").runCommand(null, this, parsed, 0, helpOnly, helpOptSet || versionOptSet || helpOnly);
        return this[kPostProcess](innerArgv, populateDoubleDash, !!calledFromCommand, false);
      }
      if (requestCompletions) {
        if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f")) setBlocking(true);
        args = [].concat(args);
        const completionArgs = args.slice(args.indexOf(`--${__classPrivateFieldGet(this, _YargsInstance_completion, "f").completionKey}`) + 1);
        __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(completionArgs, (err, completions) => {
          if (err) throw new YError(err.message);
          (completions || []).forEach(completion => {
            __classPrivateFieldGet(this, _YargsInstance_logger, "f").log(completion);
          });
          this.exit(0);
        });
        return this[kPostProcess](argv, !populateDoubleDash, !!calledFromCommand, false);
      }
      if (!__classPrivateFieldGet(this, _YargsInstance_hasOutput, "f")) {
        if (helpOptSet) {
          if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f")) setBlocking(true);
          skipValidation = true;
          this.showHelp('log');
          this.exit(0);
        } else if (versionOptSet) {
          if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f")) setBlocking(true);
          skipValidation = true;
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").showVersion('log');
          this.exit(0);
        }
      }
      if (!skipValidation && __classPrivateFieldGet(this, _YargsInstance_options, "f").skipValidation.length > 0) {
        skipValidation = Object.keys(argv).some(key => __classPrivateFieldGet(this, _YargsInstance_options, "f").skipValidation.indexOf(key) >= 0 && argv[key] === true);
      }
      if (!skipValidation) {
        if (parsed.error) throw new YError(parsed.error.message);
        if (!requestCompletions) {
          const validation = this[kRunValidation](aliases, {}, parsed.error);
          if (!calledFromCommand) {
            argvPromise = applyMiddleware(argv, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), true);
          }
          argvPromise = this[kValidateAsync](validation, argvPromise !== null && argvPromise !== void 0 ? argvPromise : argv);
          if (isPromise(argvPromise) && !calledFromCommand) {
            argvPromise = argvPromise.then(() => {
              return applyMiddleware(argv, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), false);
            });
          }
        }
      }
    } catch (err) {
      if (err instanceof YError) __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(err.message, err);else throw err;
    }
    return this[kPostProcess](argvPromise !== null && argvPromise !== void 0 ? argvPromise : argv, populateDoubleDash, !!calledFromCommand, true);
  }
  [kRunValidation](aliases, positionalMap, parseErrors, isDefaultCommand) {
    const demandedOptions = {
      ...this.getDemandedOptions()
    };
    return argv => {
      if (parseErrors) throw new YError(parseErrors.message);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").nonOptionCount(argv);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").requiredArguments(argv, demandedOptions);
      let failedStrictCommands = false;
      if (__classPrivateFieldGet(this, _YargsInstance_strictCommands, "f")) {
        failedStrictCommands = __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownCommands(argv);
      }
      if (__classPrivateFieldGet(this, _YargsInstance_strict, "f") && !failedStrictCommands) {
        __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownArguments(argv, aliases, positionalMap, !!isDefaultCommand);
      } else if (__classPrivateFieldGet(this, _YargsInstance_strictOptions, "f")) {
        __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownArguments(argv, aliases, {}, false, false);
      }
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").limitedChoices(argv);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").implications(argv);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").conflicting(argv);
    };
  }
  [kSetHasOutput]() {
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
  }
  [kTrackManuallySetKeys](keys) {
    if (typeof keys === 'string') {
      __classPrivateFieldGet(this, _YargsInstance_options, "f").key[keys] = true;
    } else {
      for (const k of keys) {
        __classPrivateFieldGet(this, _YargsInstance_options, "f").key[k] = true;
      }
    }
  }
}
function isYargsInstance(y) {
  return !!y && typeof y.getInternalMethods === 'function';
}

const Yargs = YargsFactory(shim$1);

// eslint-disable-next-line import/no-unresolved
dotenv.config();

// Method to find a service by name
const findServiceByName = name => {
  for (const key in ChatModelService) {
    if (ChatModelService[key] === name) {
      return ChatModelService[key];
    }
  }
  return null;
};
const findModelByName = name => {
  for (const key in ChatModelType) {
    if (ChatModelType[key] === name) {
      return ChatModelType[key];
    }
  }
  return null;
};
const argv = Yargs(hideBin(process.argv)).option('name', {
  alias: 'n',
  type: 'string',
  description: 'Name of the evaluation',
  default: 'Evaluation'
}).option('dataset', {
  alias: 'd',
  type: 'string',
  description: 'Path to the dataset file',
  demandOption: true
}).option('apiKey', {
  alias: 'k',
  type: 'string',
  description: 'API key for the service',
  default: process.env.OPENAI_API_KEY
}).option('temperature', {
  alias: 't',
  type: 'number',
  description: 'Temperature for the model',
  default: 0.1
}).option('maxTokens', {
  alias: 'm',
  type: 'number',
  description: 'Maximum tokens for the model',
  default: 2000
}).option('model', {
  alias: 'o',
  type: 'string',
  description: 'Model type to use',
  choices: ChatModelType.getAvailable(),
  default: ChatModelType.GPT_4O
}).option('service', {
  alias: 's',
  type: 'string',
  description: 'Service to use',
  choices: ChatModelService.getAvailable(),
  default: ChatModelService.OPENAI
}).option('agent', {
  alias: 'a',
  type: 'array',
  description: 'Paths to agent JavaScript files',
  demandOption: true
}).help().alias('help', 'h').argv;

// Load agents from provided file paths
const loadAgent = async agentPath => {
  const agent = await import(path$1.resolve(agentPath));
  return agent.default;
};
const loadedAgents = await Promise.all(argv.agent.map(loadAgent));
const dataset = await loadDataset(argv.dataset);
const evaluationName = argv.name;
const apiKey = argv.apiKey;
const temperature = argv.temperature;
const maxTokens = argv.maxTokens;
const model = findModelByName(argv.model);
const service = findServiceByName(argv.service);
const result = await runEvaluation(evaluationName, loadedAgents, dataset, model, service, apiKey, temperature, maxTokens);
console.log('result', JSON.stringify(result, null, 2));
//# sourceMappingURL=eval-agents.js.map
