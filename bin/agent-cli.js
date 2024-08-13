#!/usr/bin/env node
'use strict';
import require$$0 from 'fs';
import require$$1 from 'path';
import require$$2 from 'os';
import require$$3 from 'crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
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

const fs$1 = require$$0;
const path = require$$1;
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
        if (fs$1.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`;
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`;
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), '.env.vault');
  }
  if (fs$1.existsSync(possibleVaultPath)) {
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
      const parsed = DotenvModule.parse(fs$1.readFileSync(path, {
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

function hasKey(obj, keys) {
  var o = obj;
  keys.slice(0, -1).forEach(function (key) {
    o = o[key] || {};
  });
  var key = keys[keys.length - 1];
  return key in o;
}
function isNumber(x) {
  if (typeof x === 'number') {
    return true;
  }
  if (/^0x[0-9a-f]+$/i.test(x)) {
    return true;
  }
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}
function isConstructorOrProto(obj, key) {
  return key === 'constructor' && typeof obj[key] === 'function' || key === '__proto__';
}
var minimist = function (args, opts) {
  if (!opts) {
    opts = {};
  }
  var flags = {
    bools: {},
    strings: {},
    unknownFn: null
  };
  if (typeof opts.unknown === 'function') {
    flags.unknownFn = opts.unknown;
  }
  if (typeof opts.boolean === 'boolean' && opts.boolean) {
    flags.allBools = true;
  } else {
    [].concat(opts.boolean).filter(Boolean).forEach(function (key) {
      flags.bools[key] = true;
    });
  }
  var aliases = {};
  function aliasIsBoolean(key) {
    return aliases[key].some(function (x) {
      return flags.bools[x];
    });
  }
  Object.keys(opts.alias || {}).forEach(function (key) {
    aliases[key] = [].concat(opts.alias[key]);
    aliases[key].forEach(function (x) {
      aliases[x] = [key].concat(aliases[key].filter(function (y) {
        return x !== y;
      }));
    });
  });
  [].concat(opts.string).filter(Boolean).forEach(function (key) {
    flags.strings[key] = true;
    if (aliases[key]) {
      [].concat(aliases[key]).forEach(function (k) {
        flags.strings[k] = true;
      });
    }
  });
  var defaults = opts.default || {};
  var argv = {
    _: []
  };
  function argDefined(key, arg) {
    return flags.allBools && /^--[^=]+$/.test(arg) || flags.strings[key] || flags.bools[key] || aliases[key];
  }
  function setKey(obj, keys, value) {
    var o = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      var key = keys[i];
      if (isConstructorOrProto(o, key)) {
        return;
      }
      if (o[key] === undefined) {
        o[key] = {};
      }
      if (o[key] === Object.prototype || o[key] === Number.prototype || o[key] === String.prototype) {
        o[key] = {};
      }
      if (o[key] === Array.prototype) {
        o[key] = [];
      }
      o = o[key];
    }
    var lastKey = keys[keys.length - 1];
    if (isConstructorOrProto(o, lastKey)) {
      return;
    }
    if (o === Object.prototype || o === Number.prototype || o === String.prototype) {
      o = {};
    }
    if (o === Array.prototype) {
      o = [];
    }
    if (o[lastKey] === undefined || flags.bools[lastKey] || typeof o[lastKey] === 'boolean') {
      o[lastKey] = value;
    } else if (Array.isArray(o[lastKey])) {
      o[lastKey].push(value);
    } else {
      o[lastKey] = [o[lastKey], value];
    }
  }
  function setArg(key, val, arg) {
    if (arg && flags.unknownFn && !argDefined(key, arg)) {
      if (flags.unknownFn(arg) === false) {
        return;
      }
    }
    var value = !flags.strings[key] && isNumber(val) ? Number(val) : val;
    setKey(argv, key.split('.'), value);
    (aliases[key] || []).forEach(function (x) {
      setKey(argv, x.split('.'), value);
    });
  }
  Object.keys(flags.bools).forEach(function (key) {
    setArg(key, defaults[key] === undefined ? false : defaults[key]);
  });
  var notFlags = [];
  if (args.indexOf('--') !== -1) {
    notFlags = args.slice(args.indexOf('--') + 1);
    args = args.slice(0, args.indexOf('--'));
  }
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    var key;
    var next;
    if (/^--.+=/.test(arg)) {
      // Using [\s\S] instead of . because js doesn't support the
      // 'dotall' regex modifier. See:
      // http://stackoverflow.com/a/1068308/13216
      var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
      key = m[1];
      var value = m[2];
      if (flags.bools[key]) {
        value = value !== 'false';
      }
      setArg(key, value, arg);
    } else if (/^--no-.+/.test(arg)) {
      key = arg.match(/^--no-(.+)/)[1];
      setArg(key, false, arg);
    } else if (/^--.+/.test(arg)) {
      key = arg.match(/^--(.+)/)[1];
      next = args[i + 1];
      if (next !== undefined && !/^(-|--)[^-]/.test(next) && !flags.bools[key] && !flags.allBools && (aliases[key] ? !aliasIsBoolean(key) : true)) {
        setArg(key, next, arg);
        i += 1;
      } else if (/^(true|false)$/.test(next)) {
        setArg(key, next === 'true', arg);
        i += 1;
      } else {
        setArg(key, flags.strings[key] ? '' : true, arg);
      }
    } else if (/^-[^-]+/.test(arg)) {
      var letters = arg.slice(1, -1).split('');
      var broken = false;
      for (var j = 0; j < letters.length; j++) {
        next = arg.slice(j + 2);
        if (next === '-') {
          setArg(letters[j], next, arg);
          continue;
        }
        if (/[A-Za-z]/.test(letters[j]) && next[0] === '=') {
          setArg(letters[j], next.slice(1), arg);
          broken = true;
          break;
        }
        if (/[A-Za-z]/.test(letters[j]) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
          setArg(letters[j], next, arg);
          broken = true;
          break;
        }
        if (letters[j + 1] && letters[j + 1].match(/\W/)) {
          setArg(letters[j], arg.slice(j + 2), arg);
          broken = true;
          break;
        } else {
          setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
        }
      }
      key = arg.slice(-1)[0];
      if (!broken && key !== '-') {
        if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) && !flags.bools[key] && (aliases[key] ? !aliasIsBoolean(key) : true)) {
          setArg(key, args[i + 1], arg);
          i += 1;
        } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
          setArg(key, args[i + 1] === 'true', arg);
          i += 1;
        } else {
          setArg(key, flags.strings[key] ? '' : true, arg);
        }
      }
    } else {
      if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
        argv._.push(flags.strings._ || !isNumber(arg) ? arg : Number(arg));
      }
      if (opts.stopEarly) {
        argv._.push.apply(argv._, args.slice(i + 1));
        break;
      }
    }
  }
  Object.keys(defaults).forEach(function (k) {
    if (!hasKey(argv, k.split('.'))) {
      setKey(argv, k.split('.'), defaults[k]);
      (aliases[k] || []).forEach(function (x) {
        setKey(argv, x.split('.'), defaults[k]);
      });
    }
  });
  if (opts['--']) {
    argv['--'] = notFlags.slice();
  } else {
    notFlags.forEach(function (k) {
      argv._.push(k);
    });
  }
  return argv;
};
var minimist$1 = /*@__PURE__*/getDefaultExportFromCjs(minimist);

// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues;
const rnds8 = new Uint8Array(16);
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

var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

function validate(uuid) {
  return typeof uuid === 'string' && REGEX.test(uuid);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native = {
  randomUUID
};

function v4(options, buf, offset) {
  if (native.randomUUID && !buf && !options) {
    return native.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided
  return unsafeStringify(rnds);
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

var dist$1 = {};

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

Object.defineProperty(dist$1, "__esModule", {
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
var _default = dist$1.default = PQueue;

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
  const runtimeEnv = await getRuntimeEnvironment();
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
  const samplingRateStr = getEnvironmentVariable("LANGCHAIN_TRACING_SAMPLING_RATE");
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
    const apiKey = getEnvironmentVariable("LANGCHAIN_API_KEY");
    const apiUrl = (_getEnvironmentVariab = getEnvironmentVariable("LANGCHAIN_ENDPOINT")) !== null && _getEnvironmentVariab !== void 0 ? _getEnvironmentVariab : "https://api.smith.langchain.com";
    const hideInputs = getEnvironmentVariable("LANGCHAIN_HIDE_INPUTS") === "true";
    const hideOutputs = getEnvironmentVariable("LANGCHAIN_HIDE_OUTPUTS") === "true";
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
          projectName: getEnvironmentVariable("LANGCHAIN_PROJECT") || "default"
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
      share_token: shareId || v4()
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
      id: feedbackId !== null && feedbackId !== void 0 ? feedbackId : v4(),
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

// Update using yarn bump-version
const __version__ = "0.1.39";

// Inlined from https://github.com/flexdinesh/browser-or-node
let globalEnv;
const isBrowser = () => typeof window !== "undefined" && typeof window.document !== "undefined";
const isWebWorker = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
const isJsDom = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && (navigator.userAgent.includes("Node.js") || navigator.userAgent.includes("jsdom"));
// Supabase Edge Function provides a `Deno` global object
// without `version` property
const isDeno = () => typeof Deno !== "undefined";
// Mark not-as-node if in Supabase Edge Function
const isNode = () => typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && !isDeno();
const getEnv = () => {
  if (globalEnv) {
    return globalEnv;
  }
  if (isBrowser()) {
    globalEnv = "browser";
  } else if (isNode()) {
    globalEnv = "node";
  } else if (isWebWorker()) {
    globalEnv = "webworker";
  } else if (isJsDom()) {
    globalEnv = "jsdom";
  } else if (isDeno()) {
    globalEnv = "deno";
  } else {
    globalEnv = "other";
  }
  return globalEnv;
};
let runtimeEnvironment;
async function getRuntimeEnvironment() {
  if (runtimeEnvironment === undefined) {
    const env = getEnv();
    const releaseEnv = getShas();
    runtimeEnvironment = {
      library: "langsmith",
      runtime: env,
      sdk: "langsmith-js",
      sdk_version: __version__,
      ...releaseEnv
    };
  }
  return runtimeEnvironment;
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
function getEnvironmentVariable(name) {
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
    const envVar = getEnvironmentVariable(env);
    if (envVar !== undefined) {
      shas[env] = envVar;
    }
  }
  cachedCommitSHAs = shas;
  return shas;
}

const isTracingEnabled = tracingEnabled => {
  if (tracingEnabled !== undefined) {
    return tracingEnabled;
  }
  const envVars = ["LANGSMITH_TRACING_V2", "LANGCHAIN_TRACING_V2", "LANGSMITH_TRACING", "LANGCHAIN_TRACING"];
  return !!envVars.find(envVar => getEnvironmentVariable(envVar) === "true");
};

function stripNonAlphanumeric(input) {
  return input.replace(/[-:.]/g, "");
}
function convertToDottedOrderFormat(epoch, runId, executionOrder = 1) {
  // Date only has millisecond precision, so we use the microseconds to break
  // possible ties, avoiding incorrect run order
  const paddedOrder = executionOrder.toFixed(0).slice(0, 3).padStart(3, "0");
  return stripNonAlphanumeric(`${new Date(epoch).toISOString().slice(0, -1)}${paddedOrder}Z`) + runId;
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
      const currentDottedOrder = convertToDottedOrderFormat(this.start_time, this.id, this.execution_order);
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
      id: v4(),
      run_type: "chain",
      project_name: (_ref = (_getEnvironmentVariab = getEnvironmentVariable("LANGCHAIN_PROJECT")) !== null && _getEnvironmentVariab !== void 0 ? _getEnvironmentVariab : getEnvironmentVariable("LANGCHAIN_SESSION")) !== null && _ref !== void 0 ? _ref :
      // TODO: Deprecate
      "default",
      child_runs: [],
      api_url: (_getEnvironmentVariab2 = getEnvironmentVariable("LANGCHAIN_ENDPOINT")) !== null && _getEnvironmentVariab2 !== void 0 ? _getEnvironmentVariab2 : "http://localhost:1984",
      api_key: getEnvironmentVariable("LANGCHAIN_API_KEY"),
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
    const runtimeEnv = await getRuntimeEnvironment();
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
    let tracingEnabled = isTracingEnabled();
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
const ROOT = Symbol.for("langsmith:traceable:root");

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
const isGenerator$1 = x =>
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
  if (!isTracingEnabled(runTree.tracingEnabled)) {
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
          if (isGenerator$1(wrappedFunc) && isIteratorLike(rawOutput)) {
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

var stripAnsi$2 = {exports: {}};

var ansiRegex$1 = options => {
  options = Object.assign({
    onlyFirst: false
  }, options);
  const pattern = ['[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)', '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'].join('|');
  return new RegExp(pattern, options.onlyFirst ? undefined : 'g');
};

const ansiRegex = ansiRegex$1;
const stripAnsi$1 = string => typeof string === 'string' ? string.replace(ansiRegex(), '') : string;
stripAnsi$2.exports = stripAnsi$1;
stripAnsi$2.exports.default = stripAnsi$1;
var stripAnsiExports = stripAnsi$2.exports;

var fs = require$$0;
var stripAnsi = stripAnsiExports;
var term = 13; // carriage return

/**
 * create -- sync function for reading user input from stdin
 * @param   {Object} config {
 *   sigint: {Boolean} exit on ^C
 *   autocomplete: {StringArray} function({String})
 *   history: {String} a history control object (see `prompt-sync-history`)
 * }
 * @returns {Function} prompt function
 */

// for ANSI escape codes reference see https://en.wikipedia.org/wiki/ANSI_escape_code

function create$2(config) {
  config = config || {};
  var sigint = config.sigint;
  var eot = config.eot;
  var autocomplete = config.autocomplete = config.autocomplete || function () {
    return [];
  };
  var history = config.history;
  prompt.history = history || {
    save: function () {}
  };
  prompt.hide = function (ask) {
    return prompt(ask, {
      echo: ''
    });
  };
  return prompt;

  /**
   * prompt -- sync function for reading user input from stdin
   *  @param {String} ask opening question/statement to prompt for
   *  @param {String} value initial value for the prompt
   *  @param   {Object} opts {
   *   echo: set to a character to be echoed, default is '*'. Use '' for no echo
   *   value: {String} initial value for the prompt
   *   ask: {String} opening question/statement to prompt for, does not override ask param
   *   autocomplete: {StringArray} function({String})
   * }
   *
   * @returns {string} Returns the string input or (if sigint === false)
   *                   null if user terminates with a ^C
   */

  function prompt(ask, value, opts) {
    var insert = 0,
      savedinsert = 0,
      res,
      savedstr;
    opts = opts || {};
    if (Object(ask) === ask) {
      opts = ask;
      ask = opts.ask;
    } else if (Object(value) === value) {
      opts = value;
      value = opts.value;
    }
    ask = ask || '';
    var echo = opts.echo;
    var masked = 'echo' in opts;
    autocomplete = opts.autocomplete || autocomplete;
    var fd = process.platform === 'win32' ? process.stdin.fd : fs.openSync('/dev/tty', 'rs');
    var wasRaw = process.stdin.isRaw;
    if (!wasRaw) {
      process.stdin.setRawMode && process.stdin.setRawMode(true);
    }
    var buf = Buffer.alloc(3);
    var str = '',
      character,
      read;
    savedstr = '';
    if (ask) {
      process.stdout.write(ask);
    }
    var cycle = 0;
    while (true) {
      read = fs.readSync(fd, buf, 0, 3);
      if (read > 1) {
        // received a control sequence
        switch (buf.toString()) {
          case '\u001b[A':
            //up arrow
            if (masked) break;
            if (!history) break;
            if (history.atStart()) break;
            if (history.atEnd()) {
              savedstr = str;
              savedinsert = insert;
            }
            str = history.prev();
            insert = str.length;
            process.stdout.write('\u001b[2K\u001b[0G' + ask + str);
            break;
          case '\u001b[B':
            //down arrow
            if (masked) break;
            if (!history) break;
            if (history.pastEnd()) break;
            if (history.atPenultimate()) {
              str = savedstr;
              insert = savedinsert;
              history.next();
            } else {
              str = history.next();
              insert = str.length;
            }
            process.stdout.write('\u001b[2K\u001b[0G' + ask + str + '\u001b[' + (insert + ask.length + 1) + 'G');
            break;
          case '\u001b[D':
            //left arrow
            if (masked) break;
            var before = insert;
            insert = --insert < 0 ? 0 : insert;
            if (before - insert) process.stdout.write('\u001b[1D');
            break;
          case '\u001b[C':
            //right arrow
            if (masked) break;
            insert = ++insert > str.length ? str.length : insert;
            process.stdout.write('\u001b[' + (insert + ask.length + 1) + 'G');
            break;
          default:
            if (buf.toString()) {
              str = str + buf.toString();
              str = str.replace(/\0/g, '');
              insert = str.length;
              promptPrint(masked, ask, echo, str, insert);
              process.stdout.write('\u001b[' + (insert + ask.length + 1) + 'G');
              buf = Buffer.alloc(3);
            }
        }
        continue; // any other 3 character sequence is ignored
      }

      // if it is not a control character seq, assume only one character is read
      character = buf[read - 1];

      // catch a ^C and return null
      if (character == 3) {
        process.stdout.write('^C\n');
        fs.closeSync(fd);
        if (sigint) process.exit(130);
        process.stdin.setRawMode && process.stdin.setRawMode(wasRaw);
        return null;
      }

      // catch a ^D and exit
      if (character == 4) {
        if (str.length == 0 && eot) {
          process.stdout.write('exit\n');
          process.exit(0);
        }
      }

      // catch the terminating character
      if (character == term) {
        fs.closeSync(fd);
        if (!history) break;
        if (!masked && str.length) history.push(str);
        history.reset();
        break;
      }

      // catch a TAB and implement autocomplete
      if (character == 9) {
        // TAB
        res = autocomplete(str);
        if (str == res[0]) {
          res = autocomplete('');
        } else {
          res.length;
        }
        if (res.length == 0) {
          process.stdout.write('\t');
          continue;
        }
        var item = res[cycle++] || res[(cycle = 0, cycle++)];
        if (item) {
          process.stdout.write('\r\u001b[K' + ask + item);
          str = item;
          insert = item.length;
        }
      }
      if (character == 127 || process.platform == 'win32' && character == 8) {
        //backspace
        if (!insert) continue;
        str = str.slice(0, insert - 1) + str.slice(insert);
        insert--;
        process.stdout.write('\u001b[2D');
      } else {
        if (character < 32 || character > 126) continue;
        str = str.slice(0, insert) + String.fromCharCode(character) + str.slice(insert);
        insert++;
      }
      promptPrint(masked, ask, echo, str, insert);
    }
    process.stdout.write('\n');
    process.stdin.setRawMode && process.stdin.setRawMode(wasRaw);
    return str || value || '';
  }
  function promptPrint(masked, ask, echo, str, insert) {
    if (masked) {
      process.stdout.write('\u001b[2K\u001b[0G' + ask + Array(str.length + 1).join(echo));
    } else {
      process.stdout.write('\u001b[s');
      if (insert == str.length) {
        process.stdout.write('\u001b[2K\u001b[0G' + ask + str);
      } else {
        if (ask) {
          process.stdout.write('\u001b[2K\u001b[0G' + ask + str);
        } else {
          process.stdout.write('\u001b[2K\u001b[0G' + str + '\u001b[' + (str.length - insert) + 'D');
        }
      }

      // Reposition the cursor to the right of the insertion point
      var askLength = stripAnsi(ask).length;
      process.stdout.write(`\u001b[${askLength + 1 + (echo == '' ? 0 : insert)}G`);
    }
  }
}
var promptSync = create$2;
var promptSync$1 = /*@__PURE__*/getDefaultExportFromCjs(promptSync);

/**
 * Validate a namespace string.
 *
 * @param {string} namespace The namespace to validate - should take the form
 *                           `vendor/plugin/function`.
 *
 * @return {boolean} Whether the namespace is valid.
 */
function validateNamespace(namespace) {
  if ('string' !== typeof namespace || '' === namespace) {
    // eslint-disable-next-line no-console
    console.error('The namespace must be a non-empty string.');
    return false;
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_.\-\/]*$/.test(namespace)) {
    // eslint-disable-next-line no-console
    console.error('The namespace can only contain numbers, letters, dashes, periods, underscores and slashes.');
    return false;
  }
  return true;
}

/**
 * Validate a hookName string.
 *
 * @param {string} hookName The hook name to validate. Should be a non empty string containing
 *                          only numbers, letters, dashes, periods and underscores. Also,
 *                          the hook name cannot begin with `__`.
 *
 * @return {boolean} Whether the hook name is valid.
 */
function validateHookName(hookName) {
  if ('string' !== typeof hookName || '' === hookName) {
    // eslint-disable-next-line no-console
    console.error('The hook name must be a non-empty string.');
    return false;
  }
  if (/^__/.test(hookName)) {
    // eslint-disable-next-line no-console
    console.error('The hook name cannot begin with `__`.');
    return false;
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(hookName)) {
    // eslint-disable-next-line no-console
    console.error('The hook name can only contain numbers, letters, dashes, periods and underscores.');
    return false;
  }
  return true;
}

/**
 * Internal dependencies
 */

/**
 * @callback AddHook
 *
 * Adds the hook to the appropriate hooks container.
 *
 * @param {string}               hookName      Name of hook to add
 * @param {string}               namespace     The unique namespace identifying the callback in the form `vendor/plugin/function`.
 * @param {import('.').Callback} callback      Function to call when the hook is run
 * @param {number}               [priority=10] Priority of this hook
 */

/**
 * Returns a function which, when invoked, will add a hook.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {AddHook} Function that adds a new hook.
 */
function createAddHook(hooks, storeKey) {
  return function addHook(hookName, namespace, callback, priority = 10) {
    const hooksStore = hooks[storeKey];
    if (!validateHookName(hookName)) {
      return;
    }
    if (!validateNamespace(namespace)) {
      return;
    }
    if ('function' !== typeof callback) {
      // eslint-disable-next-line no-console
      console.error('The hook callback must be a function.');
      return;
    }

    // Validate numeric priority
    if ('number' !== typeof priority) {
      // eslint-disable-next-line no-console
      console.error('If specified, the hook priority must be a number.');
      return;
    }
    const handler = {
      callback,
      priority,
      namespace
    };
    if (hooksStore[hookName]) {
      // Find the correct insert index of the new hook.
      const handlers = hooksStore[hookName].handlers;

      /** @type {number} */
      let i;
      for (i = handlers.length; i > 0; i--) {
        if (priority >= handlers[i - 1].priority) {
          break;
        }
      }
      if (i === handlers.length) {
        // If append, operate via direct assignment.
        handlers[i] = handler;
      } else {
        // Otherwise, insert before index via splice.
        handlers.splice(i, 0, handler);
      }

      // We may also be currently executing this hook.  If the callback
      // we're adding would come after the current callback, there's no
      // problem; otherwise we need to increase the execution index of
      // any other runs by 1 to account for the added element.
      hooksStore.__current.forEach(hookInfo => {
        if (hookInfo.name === hookName && hookInfo.currentIndex >= i) {
          hookInfo.currentIndex++;
        }
      });
    } else {
      // This is the first hook of its type.
      hooksStore[hookName] = {
        handlers: [handler],
        runs: 0
      };
    }
    if (hookName !== 'hookAdded') {
      hooks.doAction('hookAdded', hookName, namespace, callback, priority);
    }
  };
}

/**
 * Internal dependencies
 */

/**
 * @callback RemoveHook
 * Removes the specified callback (or all callbacks) from the hook with a given hookName
 * and namespace.
 *
 * @param {string} hookName  The name of the hook to modify.
 * @param {string} namespace The unique namespace identifying the callback in the
 *                           form `vendor/plugin/function`.
 *
 * @return {number | undefined} The number of callbacks removed.
 */

/**
 * Returns a function which, when invoked, will remove a specified hook or all
 * hooks by the given name.
 *
 * @param {import('.').Hooks}    hooks             Hooks instance.
 * @param {import('.').StoreKey} storeKey
 * @param {boolean}              [removeAll=false] Whether to remove all callbacks for a hookName,
 *                                                 without regard to namespace. Used to create
 *                                                 `removeAll*` functions.
 *
 * @return {RemoveHook} Function that removes hooks.
 */
function createRemoveHook(hooks, storeKey, removeAll = false) {
  return function removeHook(hookName, namespace) {
    const hooksStore = hooks[storeKey];
    if (!validateHookName(hookName)) {
      return;
    }
    if (!removeAll && !validateNamespace(namespace)) {
      return;
    }

    // Bail if no hooks exist by this name.
    if (!hooksStore[hookName]) {
      return 0;
    }
    let handlersRemoved = 0;
    if (removeAll) {
      handlersRemoved = hooksStore[hookName].handlers.length;
      hooksStore[hookName] = {
        runs: hooksStore[hookName].runs,
        handlers: []
      };
    } else {
      // Try to find the specified callback to remove.
      const handlers = hooksStore[hookName].handlers;
      for (let i = handlers.length - 1; i >= 0; i--) {
        if (handlers[i].namespace === namespace) {
          handlers.splice(i, 1);
          handlersRemoved++;
          // This callback may also be part of a hook that is
          // currently executing.  If the callback we're removing
          // comes after the current callback, there's no problem;
          // otherwise we need to decrease the execution index of any
          // other runs by 1 to account for the removed element.
          hooksStore.__current.forEach(hookInfo => {
            if (hookInfo.name === hookName && hookInfo.currentIndex >= i) {
              hookInfo.currentIndex--;
            }
          });
        }
      }
    }
    if (hookName !== 'hookRemoved') {
      hooks.doAction('hookRemoved', hookName, namespace);
    }
    return handlersRemoved;
  };
}

/**
 * @callback HasHook
 *
 * Returns whether any handlers are attached for the given hookName and optional namespace.
 *
 * @param {string} hookName    The name of the hook to check for.
 * @param {string} [namespace] Optional. The unique namespace identifying the callback
 *                             in the form `vendor/plugin/function`.
 *
 * @return {boolean} Whether there are handlers that are attached to the given hook.
 */
/**
 * Returns a function which, when invoked, will return whether any handlers are
 * attached to a particular hook.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {HasHook} Function that returns whether any handlers are
 *                   attached to a particular hook and optional namespace.
 */
function createHasHook(hooks, storeKey) {
  return function hasHook(hookName, namespace) {
    const hooksStore = hooks[storeKey];

    // Use the namespace if provided.
    if ('undefined' !== typeof namespace) {
      return hookName in hooksStore && hooksStore[hookName].handlers.some(hook => hook.namespace === namespace);
    }
    return hookName in hooksStore;
  };
}

/**
 * Returns a function which, when invoked, will execute all callbacks
 * registered to a hook of the specified type, optionally returning the final
 * value of the call chain.
 *
 * @param {import('.').Hooks}    hooks                  Hooks instance.
 * @param {import('.').StoreKey} storeKey
 * @param {boolean}              [returnFirstArg=false] Whether each hook callback is expected to
 *                                                      return its first argument.
 *
 * @return {(hookName:string, ...args: unknown[]) => undefined|unknown} Function that runs hook callbacks.
 */
function createRunHook(hooks, storeKey, returnFirstArg = false) {
  return function runHooks(hookName, ...args) {
    const hooksStore = hooks[storeKey];
    if (!hooksStore[hookName]) {
      hooksStore[hookName] = {
        handlers: [],
        runs: 0
      };
    }
    hooksStore[hookName].runs++;
    const handlers = hooksStore[hookName].handlers;

    // The following code is stripped from production builds.
    if ('production' !== process.env.NODE_ENV) {
      // Handle any 'all' hooks registered.
      if ('hookAdded' !== hookName && hooksStore.all) {
        handlers.push(...hooksStore.all.handlers);
      }
    }
    if (!handlers || !handlers.length) {
      return returnFirstArg ? args[0] : undefined;
    }
    const hookInfo = {
      name: hookName,
      currentIndex: 0
    };
    hooksStore.__current.push(hookInfo);
    while (hookInfo.currentIndex < handlers.length) {
      const handler = handlers[hookInfo.currentIndex];
      const result = handler.callback.apply(null, args);
      if (returnFirstArg) {
        args[0] = result;
      }
      hookInfo.currentIndex++;
    }
    hooksStore.__current.pop();
    if (returnFirstArg) {
      return args[0];
    }
    return undefined;
  };
}

/**
 * Returns a function which, when invoked, will return the name of the
 * currently running hook, or `null` if no hook of the given type is currently
 * running.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {() => string | null} Function that returns the current hook name or null.
 */
function createCurrentHook(hooks, storeKey) {
  return function currentHook() {
    var _hooksStore$__current;
    const hooksStore = hooks[storeKey];
    return (_hooksStore$__current = hooksStore.__current[hooksStore.__current.length - 1]?.name) !== null && _hooksStore$__current !== void 0 ? _hooksStore$__current : null;
  };
}

/**
 * @callback DoingHook
 * Returns whether a hook is currently being executed.
 *
 * @param {string} [hookName] The name of the hook to check for.  If
 *                            omitted, will check for any hook being executed.
 *
 * @return {boolean} Whether the hook is being executed.
 */

/**
 * Returns a function which, when invoked, will return whether a hook is
 * currently being executed.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {DoingHook} Function that returns whether a hook is currently
 *                     being executed.
 */
function createDoingHook(hooks, storeKey) {
  return function doingHook(hookName) {
    const hooksStore = hooks[storeKey];

    // If the hookName was not passed, check for any current hook.
    if ('undefined' === typeof hookName) {
      return 'undefined' !== typeof hooksStore.__current[0];
    }

    // Return the __current hook.
    return hooksStore.__current[0] ? hookName === hooksStore.__current[0].name : false;
  };
}

/**
 * Internal dependencies
 */

/**
 * @callback DidHook
 *
 * Returns the number of times an action has been fired.
 *
 * @param {string} hookName The hook name to check.
 *
 * @return {number | undefined} The number of times the hook has run.
 */

/**
 * Returns a function which, when invoked, will return the number of times a
 * hook has been called.
 *
 * @param {import('.').Hooks}    hooks    Hooks instance.
 * @param {import('.').StoreKey} storeKey
 *
 * @return {DidHook} Function that returns a hook's call count.
 */
function createDidHook(hooks, storeKey) {
  return function didHook(hookName) {
    const hooksStore = hooks[storeKey];
    if (!validateHookName(hookName)) {
      return;
    }
    return hooksStore[hookName] && hooksStore[hookName].runs ? hooksStore[hookName].runs : 0;
  };
}

/**
 * Internal dependencies
 */

/**
 * Internal class for constructing hooks. Use `createHooks()` function
 *
 * Note, it is necessary to expose this class to make its type public.
 *
 * @private
 */
class _Hooks {
  constructor() {
    /** @type {import('.').Store} actions */
    this.actions = Object.create(null);
    this.actions.__current = [];

    /** @type {import('.').Store} filters */
    this.filters = Object.create(null);
    this.filters.__current = [];
    this.addAction = createAddHook(this, 'actions');
    this.addFilter = createAddHook(this, 'filters');
    this.removeAction = createRemoveHook(this, 'actions');
    this.removeFilter = createRemoveHook(this, 'filters');
    this.hasAction = createHasHook(this, 'actions');
    this.hasFilter = createHasHook(this, 'filters');
    this.removeAllActions = createRemoveHook(this, 'actions', true);
    this.removeAllFilters = createRemoveHook(this, 'filters', true);
    this.doAction = createRunHook(this, 'actions');
    this.applyFilters = createRunHook(this, 'filters', true);
    this.currentAction = createCurrentHook(this, 'actions');
    this.currentFilter = createCurrentHook(this, 'filters');
    this.doingAction = createDoingHook(this, 'actions');
    this.doingFilter = createDoingHook(this, 'filters');
    this.didAction = createDidHook(this, 'actions');
    this.didFilter = createDidHook(this, 'filters');
  }
}

/** @typedef {_Hooks} Hooks */

/**
 * Returns an instance of the hooks object.
 *
 * @return {Hooks} A Hooks instance.
 */
function createHooks() {
  return new _Hooks();
}

/**
 * Internal dependencies
 */

/** @typedef {(...args: any[])=>any} Callback */

/**
 * @typedef Handler
 * @property {Callback} callback  The callback
 * @property {string}   namespace The namespace
 * @property {number}   priority  The namespace
 */

/**
 * @typedef Hook
 * @property {Handler[]} handlers Array of handlers
 * @property {number}    runs     Run counter
 */

/**
 * @typedef Current
 * @property {string} name         Hook name
 * @property {number} currentIndex The index
 */

/**
 * @typedef {Record<string, Hook> & {__current: Current[]}} Store
 */

/**
 * @typedef {'actions' | 'filters'} StoreKey
 */

/**
 * @typedef {import('./createHooks').Hooks} Hooks
 */

const defaultHooks = createHooks();
const {
  addAction,
  addFilter,
  removeAction,
  removeFilter,
  hasAction,
  hasFilter,
  removeAllActions,
  removeAllFilters,
  doAction,
  applyFilters,
  currentAction,
  currentFilter,
  doingAction,
  doingFilter,
  didAction,
  didFilter,
  actions: actions$9,
  filters
} = defaultHooks;

/**
 * WordPress dependencies
 */

/**
 * Object map tracking messages which have been logged, for use in ensuring a
 * message is only logged once.
 *
 * @type {Record<string, true | undefined>}
 */
const logged = Object.create(null);

/**
 * Logs a message to notify developers about a deprecated feature.
 *
 * @param {string} feature               Name of the deprecated feature.
 * @param {Object} [options]             Personalisation options
 * @param {string} [options.since]       Version in which the feature was deprecated.
 * @param {string} [options.version]     Version in which the feature will be removed.
 * @param {string} [options.alternative] Feature to use instead
 * @param {string} [options.plugin]      Plugin name if it's a plugin feature
 * @param {string} [options.link]        Link to documentation
 * @param {string} [options.hint]        Additional message to help transition away from the deprecated feature.
 *
 * @example
 * ```js
 * import deprecated from '@wordpress/deprecated';
 *
 * deprecated( 'Eating meat', {
 * 	since: '2019.01.01'
 * 	version: '2020.01.01',
 * 	alternative: 'vegetables',
 * 	plugin: 'the earth',
 * 	hint: 'You may find it beneficial to transition gradually.',
 * } );
 *
 * // Logs: 'Eating meat is deprecated since version 2019.01.01 and will be removed from the earth in version 2020.01.01. Please use vegetables instead. Note: You may find it beneficial to transition gradually.'
 * ```
 */
function deprecated(feature, options = {}) {
  const {
    since,
    version,
    alternative,
    plugin,
    link,
    hint
  } = options;
  const pluginMessage = plugin ? ` from ${plugin}` : '';
  const sinceMessage = since ? ` since version ${since}` : '';
  const versionMessage = version ? ` and will be removed${pluginMessage} in version ${version}` : '';
  const useInsteadMessage = alternative ? ` Please use ${alternative} instead.` : '';
  const linkMessage = link ? ` See: ${link}` : '';
  const hintMessage = hint ? ` Note: ${hint}` : '';
  const message = `${feature} is deprecated${sinceMessage}${versionMessage}.${useInsteadMessage}${linkMessage}${hintMessage}`;

  // Skip if already logged.
  if (message in logged) {
    return;
  }

  /**
   * Fires whenever a deprecated feature is encountered
   *
   * @param {string}  feature             Name of the deprecated feature.
   * @param {?Object} options             Personalisation options
   * @param {string}  options.since       Version in which the feature was deprecated.
   * @param {?string} options.version     Version in which the feature will be removed.
   * @param {?string} options.alternative Feature to use instead
   * @param {?string} options.plugin      Plugin name if it's a plugin feature
   * @param {?string} options.link        Link to documentation
   * @param {?string} options.hint        Additional message to help transition away from the deprecated feature.
   * @param {?string} message             Message sent to console.warn
   */
  doAction('deprecated', feature, options, message);

  // eslint-disable-next-line no-console
  console.warn(message);
  logged[message] = true;
}

/** @typedef {import('utility-types').NonUndefined<Parameters<typeof deprecated>[1]>} DeprecatedOptions */

function _typeof$3(o) {
  "@babel/helpers - typeof";

  return _typeof$3 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof$3(o);
}

function toPrimitive(t, r) {
  if ("object" != _typeof$3(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof$3(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}

function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof$3(i) ? i : i + "";
}

function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}

function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}

/**
 * Adapted from React: https://github.com/facebook/react/blob/master/packages/shared/formatProdErrorMessage.js
 *
 * Do not require this module directly! Use normal throw error calls. These messages will be replaced with error codes
 * during build.
 * @param {number} code
 */
function formatProdErrorMessage(code) {
  return "Minified Redux error #" + code + "; visit https://redux.js.org/Errors?code=" + code + " for the full message or " + 'use the non-minified dev environment for full errors. ';
}

// Inlined version of the `symbol-observable` polyfill
var $$observable = function () {
  return typeof Symbol === 'function' && Symbol.observable || '@@observable';
}();

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var randomString = function randomString() {
  return Math.random().toString(36).substring(7).split('').join('.');
};
var ActionTypes = {
  INIT: "@@redux/INIT" + randomString(),
  REPLACE: "@@redux/REPLACE" + randomString(),
  PROBE_UNKNOWN_ACTION: function PROBE_UNKNOWN_ACTION() {
    return "@@redux/PROBE_UNKNOWN_ACTION" + randomString();
  }
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
function isPlainObject$1(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
  var proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(obj) === proto;
}

// Inlined / shortened version of `kindOf` from https://github.com/jonschlinkert/kind-of
function miniKindOf(val) {
  if (val === void 0) return 'undefined';
  if (val === null) return 'null';
  var type = typeof val;
  switch (type) {
    case 'boolean':
    case 'string':
    case 'number':
    case 'symbol':
    case 'function':
      {
        return type;
      }
  }
  if (Array.isArray(val)) return 'array';
  if (isDate(val)) return 'date';
  if (isError(val)) return 'error';
  var constructorName = ctorName(val);
  switch (constructorName) {
    case 'Symbol':
    case 'Promise':
    case 'WeakMap':
    case 'WeakSet':
    case 'Map':
    case 'Set':
      return constructorName;
  } // other

  return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
}
function ctorName(val) {
  return typeof val.constructor === 'function' ? val.constructor.name : null;
}
function isError(val) {
  return val instanceof Error || typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number';
}
function isDate(val) {
  if (val instanceof Date) return true;
  return typeof val.toDateString === 'function' && typeof val.getDate === 'function' && typeof val.setDate === 'function';
}
function kindOf(val) {
  var typeOfVal = typeof val;
  if (process.env.NODE_ENV !== 'production') {
    typeOfVal = miniKindOf(val);
  }
  return typeOfVal;
}

/**
 * @deprecated
 *
 * **We recommend using the `configureStore` method
 * of the `@reduxjs/toolkit` package**, which replaces `createStore`.
 *
 * Redux Toolkit is our recommended approach for writing Redux logic today,
 * including store setup, reducers, data fetching, and more.
 *
 * **For more details, please read this Redux docs page:**
 * **https://redux.js.org/introduction/why-rtk-is-redux-today**
 *
 * `configureStore` from Redux Toolkit is an improved version of `createStore` that
 * simplifies setup and helps avoid common bugs.
 *
 * You should not be using the `redux` core package by itself today, except for learning purposes.
 * The `createStore` method from the core `redux` package will not be removed, but we encourage
 * all users to migrate to using Redux Toolkit for all Redux code.
 *
 * If you want to use `createStore` without this visual deprecation warning, use
 * the `legacy_createStore` import instead:
 *
 * `import { legacy_createStore as createStore} from 'redux'`
 *
 */

function createStore(reducer, preloadedState, enhancer) {
  var _ref2;
  if (typeof preloadedState === 'function' && typeof enhancer === 'function' || typeof enhancer === 'function' && typeof arguments[3] === 'function') {
    throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(0) : 'It looks like you are passing several store enhancers to ' + 'createStore(). This is not supported. Instead, compose them ' + 'together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.');
  }
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(1) : "Expected the enhancer to be a function. Instead, received: '" + kindOf(enhancer) + "'");
    }
    return enhancer(createStore)(reducer, preloadedState);
  }
  if (typeof reducer !== 'function') {
    throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(2) : "Expected the root reducer to be a function. Instead, received: '" + kindOf(reducer) + "'");
  }
  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;
  /**
   * This makes a shallow copy of currentListeners so we can use
   * nextListeners as a temporary list while dispatching.
   *
   * This prevents any bugs around consumers calling
   * subscribe/unsubscribe in the middle of a dispatch.
   */

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }
  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */

  function getState() {
    if (isDispatching) {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(3) : 'You may not call store.getState() while the reducer is executing. ' + 'The reducer has already received the state as an argument. ' + 'Pass it down from the top reducer instead of reading it from the store.');
    }
    return currentState;
  }
  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(4) : "Expected the listener to be a function. Instead, received: '" + kindOf(listener) + "'");
    }
    if (isDispatching) {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(5) : 'You may not call store.subscribe() while the reducer is executing. ' + 'If you would like to be notified after the store has been updated, subscribe from a ' + 'component and invoke store.getState() in the callback to access the latest state. ' + 'See https://redux.js.org/api/store#subscribelistener for more details.');
    }
    var isSubscribed = true;
    ensureCanMutateNextListeners();
    nextListeners.push(listener);
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }
      if (isDispatching) {
        throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(6) : 'You may not unsubscribe from a store listener while the reducer is executing. ' + 'See https://redux.js.org/api/store#subscribelistener for more details.');
      }
      isSubscribed = false;
      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
      currentListeners = null;
    };
  }
  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */

  function dispatch(action) {
    if (!isPlainObject$1(action)) {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(7) : "Actions must be plain objects. Instead, the actual type was: '" + kindOf(action) + "'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.");
    }
    if (typeof action.type === 'undefined') {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(8) : 'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.');
    }
    if (isDispatching) {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(9) : 'Reducers may not dispatch actions.');
    }
    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }
    var listeners = currentListeners = nextListeners;
    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i];
      listener();
    }
    return action;
  }
  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */

  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(10) : "Expected the nextReducer to be a function. Instead, received: '" + kindOf(nextReducer));
    }
    currentReducer = nextReducer; // This action has a similiar effect to ActionTypes.INIT.
    // Any reducers that existed in both the new and old rootReducer
    // will receive the previous state. This effectively populates
    // the new state tree with any relevant data from the old one.

    dispatch({
      type: ActionTypes.REPLACE
    });
  }
  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */

  function observable() {
    var _ref;
    var outerSubscribe = subscribe;
    return _ref = {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(11) : "Expected the observer to be an object. Instead, received: '" + kindOf(observer) + "'");
        }
        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }
        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return {
          unsubscribe: unsubscribe
        };
      }
    }, _ref[$$observable] = function () {
      return this;
    }, _ref;
  } // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.

  dispatch({
    type: ActionTypes.INIT
  });
  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[$$observable] = observable, _ref2;
}

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */
function compose$1() {
  for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }
  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce(function (a, b) {
    return function () {
      return a(b.apply(void 0, arguments));
    };
  });
}

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */

function applyMiddleware() {
  for (var _len = arguments.length, middlewares = new Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }
  return function (createStore) {
    return function () {
      var store = createStore.apply(void 0, arguments);
      var _dispatch = function dispatch() {
        throw new Error(process.env.NODE_ENV === "production" ? formatProdErrorMessage(15) : 'Dispatching while constructing your middleware is not allowed. ' + 'Other middleware would not be applied to this dispatch.');
      };
      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch() {
          return _dispatch.apply(void 0, arguments);
        }
      };
      var chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = compose$1.apply(void 0, chain)(store.dispatch);
      return _objectSpread2(_objectSpread2({}, store), {}, {
        dispatch: _dispatch
      });
    };
  };
}

function _typeof$2(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof$2 = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof$2 = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }
  return _typeof$2(obj);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  return Constructor;
}

/**
 * Given an instance of EquivalentKeyMap, returns its internal value pair tuple
 * for a key, if one exists. The tuple members consist of the last reference
 * value for the key (used in efficient subsequent lookups) and the value
 * assigned for the key at the leaf node.
 *
 * @param {EquivalentKeyMap} instance EquivalentKeyMap instance.
 * @param {*} key                     The key for which to return value pair.
 *
 * @return {?Array} Value pair, if exists.
 */
function getValuePair(instance, key) {
  var _map = instance._map,
    _arrayTreeMap = instance._arrayTreeMap,
    _objectTreeMap = instance._objectTreeMap; // Map keeps a reference to the last object-like key used to set the
  // value, which can be used to shortcut immediately to the value.

  if (_map.has(key)) {
    return _map.get(key);
  } // Sort keys to ensure stable retrieval from tree.

  var properties = Object.keys(key).sort(); // Tree by type to avoid conflicts on numeric object keys, empty value.

  var map = Array.isArray(key) ? _arrayTreeMap : _objectTreeMap;
  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    map = map.get(property);
    if (map === undefined) {
      return;
    }
    var propertyValue = key[property];
    map = map.get(propertyValue);
    if (map === undefined) {
      return;
    }
  }
  var valuePair = map.get('_ekm_value');
  if (!valuePair) {
    return;
  } // If reached, it implies that an object-like key was set with another
  // reference, so delete the reference and replace with the current.

  _map.delete(valuePair[0]);
  valuePair[0] = key;
  map.set('_ekm_value', valuePair);
  _map.set(key, valuePair);
  return valuePair;
}
/**
 * Variant of a Map object which enables lookup by equivalent (deeply equal)
 * object and array keys.
 */

var EquivalentKeyMap = /*#__PURE__*/
function () {
  /**
   * Constructs a new instance of EquivalentKeyMap.
   *
   * @param {Iterable.<*>} iterable Initial pair of key, value for map.
   */
  function EquivalentKeyMap(iterable) {
    _classCallCheck(this, EquivalentKeyMap);
    this.clear();
    if (iterable instanceof EquivalentKeyMap) {
      // Map#forEach is only means of iterating with support for IE11.
      var iterablePairs = [];
      iterable.forEach(function (value, key) {
        iterablePairs.push([key, value]);
      });
      iterable = iterablePairs;
    }
    if (iterable != null) {
      for (var i = 0; i < iterable.length; i++) {
        this.set(iterable[i][0], iterable[i][1]);
      }
    }
  }
  /**
   * Accessor property returning the number of elements.
   *
   * @return {number} Number of elements.
   */

  _createClass(EquivalentKeyMap, [{
    key: "set",
    /**
     * Add or update an element with a specified key and value.
     *
     * @param {*} key   The key of the element to add.
     * @param {*} value The value of the element to add.
     *
     * @return {EquivalentKeyMap} Map instance.
     */
    value: function set(key, value) {
      // Shortcut non-object-like to set on internal Map.
      if (key === null || _typeof$2(key) !== 'object') {
        this._map.set(key, value);
        return this;
      } // Sort keys to ensure stable assignment into tree.

      var properties = Object.keys(key).sort();
      var valuePair = [key, value]; // Tree by type to avoid conflicts on numeric object keys, empty value.

      var map = Array.isArray(key) ? this._arrayTreeMap : this._objectTreeMap;
      for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        if (!map.has(property)) {
          map.set(property, new EquivalentKeyMap());
        }
        map = map.get(property);
        var propertyValue = key[property];
        if (!map.has(propertyValue)) {
          map.set(propertyValue, new EquivalentKeyMap());
        }
        map = map.get(propertyValue);
      } // If an _ekm_value exists, there was already an equivalent key. Before
      // overriding, ensure that the old key reference is removed from map to
      // avoid memory leak of accumulating equivalent keys. This is, in a
      // sense, a poor man's WeakMap, while still enabling iterability.

      var previousValuePair = map.get('_ekm_value');
      if (previousValuePair) {
        this._map.delete(previousValuePair[0]);
      }
      map.set('_ekm_value', valuePair);
      this._map.set(key, valuePair);
      return this;
    }
    /**
     * Returns a specified element.
     *
     * @param {*} key The key of the element to return.
     *
     * @return {?*} The element associated with the specified key or undefined
     *              if the key can't be found.
     */
  }, {
    key: "get",
    value: function get(key) {
      // Shortcut non-object-like to get from internal Map.
      if (key === null || _typeof$2(key) !== 'object') {
        return this._map.get(key);
      }
      var valuePair = getValuePair(this, key);
      if (valuePair) {
        return valuePair[1];
      }
    }
    /**
     * Returns a boolean indicating whether an element with the specified key
     * exists or not.
     *
     * @param {*} key The key of the element to test for presence.
     *
     * @return {boolean} Whether an element with the specified key exists.
     */
  }, {
    key: "has",
    value: function has(key) {
      if (key === null || _typeof$2(key) !== 'object') {
        return this._map.has(key);
      } // Test on the _presence_ of the pair, not its value, as even undefined
      // can be a valid member value for a key.

      return getValuePair(this, key) !== undefined;
    }
    /**
     * Removes the specified element.
     *
     * @param {*} key The key of the element to remove.
     *
     * @return {boolean} Returns true if an element existed and has been
     *                   removed, or false if the element does not exist.
     */
  }, {
    key: "delete",
    value: function _delete(key) {
      if (!this.has(key)) {
        return false;
      } // This naive implementation will leave orphaned child trees. A better
      // implementation should traverse and remove orphans.

      this.set(key, undefined);
      return true;
    }
    /**
     * Executes a provided function once per each key/value pair, in insertion
     * order.
     *
     * @param {Function} callback Function to execute for each element.
     * @param {*}        thisArg  Value to use as `this` when executing
     *                            `callback`.
     */
  }, {
    key: "forEach",
    value: function forEach(callback) {
      var _this = this;
      var thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this;
      this._map.forEach(function (value, key) {
        // Unwrap value from object-like value pair.
        if (key !== null && _typeof$2(key) === 'object') {
          value = value[1];
        }
        callback.call(thisArg, value, key, _this);
      });
    }
    /**
     * Removes all elements.
     */
  }, {
    key: "clear",
    value: function clear() {
      this._map = new Map();
      this._arrayTreeMap = new Map();
      this._objectTreeMap = new Map();
    }
  }, {
    key: "size",
    get: function get() {
      return this._map.size;
    }
  }]);
  return EquivalentKeyMap;
}();
var equivalentKeyMap = EquivalentKeyMap;
var EquivalentKeyMap$1 = /*@__PURE__*/getDefaultExportFromCjs(equivalentKeyMap);

/* eslint-disable jsdoc/valid-types */
/**
 * Returns true if the given object is a generator, or false otherwise.
 *
 * @see https://www.ecma-international.org/ecma-262/6.0/#sec-generator-objects
 *
 * @param {any} object Object to test.
 *
 * @return {object is Generator} Whether object is a generator.
 */
function isGenerator(object) {
  /* eslint-enable jsdoc/valid-types */
  // Check that iterator (next) and iterable (Symbol.iterator) interfaces are satisfied.
  // These checks seem to be compatible with several generator helpers as well as the native implementation.
  return !!object && typeof object[Symbol.iterator] === 'function' && typeof object.next === 'function';
}

var dist = {};

var helpers = {};

var keys$1 = {};

Object.defineProperty(keys$1, "__esModule", {
  value: true
});
var keys = {
  all: Symbol('all'),
  error: Symbol('error'),
  fork: Symbol('fork'),
  join: Symbol('join'),
  race: Symbol('race'),
  call: Symbol('call'),
  cps: Symbol('cps'),
  subscribe: Symbol('subscribe')
};
keys$1.default = keys;

Object.defineProperty(helpers, "__esModule", {
  value: true
});
helpers.createChannel = helpers.subscribe = helpers.cps = helpers.apply = helpers.call = helpers.invoke = helpers.delay = helpers.race = helpers.join = helpers.fork = helpers.error = helpers.all = undefined;
var _keys$1 = keys$1;
var _keys2$1 = _interopRequireDefault$5(_keys$1);
function _interopRequireDefault$5(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
helpers.all = function all(value) {
  return {
    type: _keys2$1.default.all,
    value: value
  };
};
helpers.error = function error(err) {
  return {
    type: _keys2$1.default.error,
    error: err
  };
};
helpers.fork = function fork(iterator) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  return {
    type: _keys2$1.default.fork,
    iterator: iterator,
    args: args
  };
};
helpers.join = function join(task) {
  return {
    type: _keys2$1.default.join,
    task: task
  };
};
helpers.race = function race(competitors) {
  return {
    type: _keys2$1.default.race,
    competitors: competitors
  };
};
helpers.delay = function delay(timeout) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      return resolve(true);
    }, timeout);
  });
};
helpers.invoke = function invoke(func) {
  for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }
  return {
    type: _keys2$1.default.call,
    func: func,
    context: null,
    args: args
  };
};
helpers.call = function call(func, context) {
  for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
    args[_key3 - 2] = arguments[_key3];
  }
  return {
    type: _keys2$1.default.call,
    func: func,
    context: context,
    args: args
  };
};
helpers.apply = function apply(func, context, args) {
  return {
    type: _keys2$1.default.call,
    func: func,
    context: context,
    args: args
  };
};
helpers.cps = function cps(func) {
  for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
    args[_key4 - 1] = arguments[_key4];
  }
  return {
    type: _keys2$1.default.cps,
    func: func,
    args: args
  };
};
helpers.subscribe = function subscribe(channel) {
  return {
    type: _keys2$1.default.subscribe,
    channel: channel
  };
};
helpers.createChannel = function createChannel(callback) {
  var listeners = [];
  var subscribe = function subscribe(l) {
    listeners.push(l);
    return function () {
      return listeners.splice(listeners.indexOf(l), 1);
    };
  };
  var next = function next(val) {
    return listeners.forEach(function (l) {
      return l(val);
    });
  };
  callback(next);
  return {
    subscribe: subscribe
  };
};

var regeneratorRuntime$1 = {exports: {}};

var _typeof$1 = {exports: {}};

(function (module) {
  function _typeof(o) {
    "@babel/helpers - typeof";

    return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(o);
  }
  module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;
})(_typeof$1);
var _typeofExports = _typeof$1.exports;

(function (module) {
  var _typeof = _typeofExports["default"];
  function _regeneratorRuntime() {

    /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */
    module.exports = _regeneratorRuntime = function _regeneratorRuntime() {
      return e;
    }, module.exports.__esModule = true, module.exports["default"] = module.exports;
    var t,
      e = {},
      r = Object.prototype,
      n = r.hasOwnProperty,
      o = Object.defineProperty || function (t, e, r) {
        t[e] = r.value;
      },
      i = "function" == typeof Symbol ? Symbol : {},
      a = i.iterator || "@@iterator",
      c = i.asyncIterator || "@@asyncIterator",
      u = i.toStringTag || "@@toStringTag";
    function define(t, e, r) {
      return Object.defineProperty(t, e, {
        value: r,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), t[e];
    }
    try {
      define({}, "");
    } catch (t) {
      define = function define(t, e, r) {
        return t[e] = r;
      };
    }
    function wrap(t, e, r, n) {
      var i = e && e.prototype instanceof Generator ? e : Generator,
        a = Object.create(i.prototype),
        c = new Context(n || []);
      return o(a, "_invoke", {
        value: makeInvokeMethod(t, r, c)
      }), a;
    }
    function tryCatch(t, e, r) {
      try {
        return {
          type: "normal",
          arg: t.call(e, r)
        };
      } catch (t) {
        return {
          type: "throw",
          arg: t
        };
      }
    }
    e.wrap = wrap;
    var h = "suspendedStart",
      l = "suspendedYield",
      f = "executing",
      s = "completed",
      y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var p = {};
    define(p, a, function () {
      return this;
    });
    var d = Object.getPrototypeOf,
      v = d && d(d(values([])));
    v && v !== r && n.call(v, a) && (p = v);
    var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
    function defineIteratorMethods(t) {
      ["next", "throw", "return"].forEach(function (e) {
        define(t, e, function (t) {
          return this._invoke(e, t);
        });
      });
    }
    function AsyncIterator(t, e) {
      function invoke(r, o, i, a) {
        var c = tryCatch(t[r], t, o);
        if ("throw" !== c.type) {
          var u = c.arg,
            h = u.value;
          return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
            invoke("next", t, i, a);
          }, function (t) {
            invoke("throw", t, i, a);
          }) : e.resolve(h).then(function (t) {
            u.value = t, i(u);
          }, function (t) {
            return invoke("throw", t, i, a);
          });
        }
        a(c.arg);
      }
      var r;
      o(this, "_invoke", {
        value: function value(t, n) {
          function callInvokeWithMethodAndArg() {
            return new e(function (e, r) {
              invoke(t, n, e, r);
            });
          }
          return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        }
      });
    }
    function makeInvokeMethod(e, r, n) {
      var o = h;
      return function (i, a) {
        if (o === f) throw Error("Generator is already running");
        if (o === s) {
          if ("throw" === i) throw a;
          return {
            value: t,
            done: !0
          };
        }
        for (n.method = i, n.arg = a;;) {
          var c = n.delegate;
          if (c) {
            var u = maybeInvokeDelegate(c, n);
            if (u) {
              if (u === y) continue;
              return u;
            }
          }
          if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
            if (o === h) throw o = s, n.arg;
            n.dispatchException(n.arg);
          } else "return" === n.method && n.abrupt("return", n.arg);
          o = f;
          var p = tryCatch(e, r, n);
          if ("normal" === p.type) {
            if (o = n.done ? s : l, p.arg === y) continue;
            return {
              value: p.arg,
              done: n.done
            };
          }
          "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
        }
      };
    }
    function maybeInvokeDelegate(e, r) {
      var n = r.method,
        o = e.iterator[n];
      if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
      var i = tryCatch(o, e.iterator, r.arg);
      if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
      var a = i.arg;
      return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
    }
    function pushTryEntry(t) {
      var e = {
        tryLoc: t[0]
      };
      1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
    }
    function resetTryEntry(t) {
      var e = t.completion || {};
      e.type = "normal", delete e.arg, t.completion = e;
    }
    function Context(t) {
      this.tryEntries = [{
        tryLoc: "root"
      }], t.forEach(pushTryEntry, this), this.reset(!0);
    }
    function values(e) {
      if (e || "" === e) {
        var r = e[a];
        if (r) return r.call(e);
        if ("function" == typeof e.next) return e;
        if (!isNaN(e.length)) {
          var o = -1,
            i = function next() {
              for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
              return next.value = t, next.done = !0, next;
            };
          return i.next = i;
        }
      }
      throw new TypeError(_typeof(e) + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
      value: GeneratorFunctionPrototype,
      configurable: !0
    }), o(GeneratorFunctionPrototype, "constructor", {
      value: GeneratorFunction,
      configurable: !0
    }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
      var e = "function" == typeof t && t.constructor;
      return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
    }, e.mark = function (t) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
    }, e.awrap = function (t) {
      return {
        __await: t
      };
    }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
      return this;
    }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
      void 0 === i && (i = Promise);
      var a = new AsyncIterator(wrap(t, r, n, o), i);
      return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
        return t.done ? t.value : a.next();
      });
    }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
      return this;
    }), define(g, "toString", function () {
      return "[object Generator]";
    }), e.keys = function (t) {
      var e = Object(t),
        r = [];
      for (var n in e) r.push(n);
      return r.reverse(), function next() {
        for (; r.length;) {
          var t = r.pop();
          if (t in e) return next.value = t, next.done = !1, next;
        }
        return next.done = !0, next;
      };
    }, e.values = values, Context.prototype = {
      constructor: Context,
      reset: function reset(e) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
      },
      stop: function stop() {
        this.done = !0;
        var t = this.tryEntries[0].completion;
        if ("throw" === t.type) throw t.arg;
        return this.rval;
      },
      dispatchException: function dispatchException(e) {
        if (this.done) throw e;
        var r = this;
        function handle(n, o) {
          return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
        }
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var i = this.tryEntries[o],
            a = i.completion;
          if ("root" === i.tryLoc) return handle("end");
          if (i.tryLoc <= this.prev) {
            var c = n.call(i, "catchLoc"),
              u = n.call(i, "finallyLoc");
            if (c && u) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            } else if (c) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            } else {
              if (!u) throw Error("try statement without catch or finally");
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            }
          }
        }
      },
      abrupt: function abrupt(t, e) {
        for (var r = this.tryEntries.length - 1; r >= 0; --r) {
          var o = this.tryEntries[r];
          if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
            var i = o;
            break;
          }
        }
        i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
        var a = i ? i.completion : {};
        return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
      },
      complete: function complete(t, e) {
        if ("throw" === t.type) throw t.arg;
        return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
      },
      finish: function finish(t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
        }
      },
      "catch": function _catch(t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.tryLoc === t) {
            var n = r.completion;
            if ("throw" === n.type) {
              var o = n.arg;
              resetTryEntry(r);
            }
            return o;
          }
        }
        throw Error("illegal catch attempt");
      },
      delegateYield: function delegateYield(e, r, n) {
        return this.delegate = {
          iterator: values(e),
          resultName: r,
          nextLoc: n
        }, "next" === this.method && (this.arg = t), y;
      }
    }, e;
  }
  module.exports = _regeneratorRuntime, module.exports.__esModule = true, module.exports["default"] = module.exports;
})(regeneratorRuntime$1);
var regeneratorRuntimeExports = regeneratorRuntime$1.exports;

// TODO(Babel 8): Remove this file.

var runtime = regeneratorRuntimeExports();
var regenerator = runtime;

// Copied from https://github.com/facebook/regenerator/blob/main/packages/runtime/runtime.js#L736=
try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}
var _regeneratorRuntime = /*@__PURE__*/getDefaultExportFromCjs(regenerator);

var create$1 = {};

var builtin = {};

var is$1 = {};

Object.defineProperty(is$1, "__esModule", {
  value: true
});
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};
var _keys = keys$1;
var _keys2 = _interopRequireDefault$4(_keys);
function _interopRequireDefault$4(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
var is = {
  obj: function obj(value) {
    return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && !!value;
  },
  all: function all(value) {
    return is.obj(value) && value.type === _keys2.default.all;
  },
  error: function error(value) {
    return is.obj(value) && value.type === _keys2.default.error;
  },
  array: Array.isArray,
  func: function func(value) {
    return typeof value === 'function';
  },
  promise: function promise(value) {
    return value && is.func(value.then);
  },
  iterator: function iterator(value) {
    return value && is.func(value.next) && is.func(value.throw);
  },
  fork: function fork(value) {
    return is.obj(value) && value.type === _keys2.default.fork;
  },
  join: function join(value) {
    return is.obj(value) && value.type === _keys2.default.join;
  },
  race: function race(value) {
    return is.obj(value) && value.type === _keys2.default.race;
  },
  call: function call(value) {
    return is.obj(value) && value.type === _keys2.default.call;
  },
  cps: function cps(value) {
    return is.obj(value) && value.type === _keys2.default.cps;
  },
  subscribe: function subscribe(value) {
    return is.obj(value) && value.type === _keys2.default.subscribe;
  },
  channel: function channel(value) {
    return is.obj(value) && is.func(value.subscribe);
  }
};
is$1.default = is;

Object.defineProperty(builtin, "__esModule", {
  value: true
});
builtin.iterator = builtin.array = builtin.object = builtin.error = builtin.any = undefined;
var _is$3 = is$1;
var _is2$3 = _interopRequireDefault$3(_is$3);
function _interopRequireDefault$3(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
var any = builtin.any = function any(value, next, rungen, yieldNext) {
  yieldNext(value);
  return true;
};
var error = builtin.error = function error(value, next, rungen, yieldNext, raiseNext) {
  if (!_is2$3.default.error(value)) return false;
  raiseNext(value.error);
  return true;
};
var object = builtin.object = function object(value, next, rungen, yieldNext, raiseNext) {
  if (!_is2$3.default.all(value) || !_is2$3.default.obj(value.value)) return false;
  var result = {};
  var keys = Object.keys(value.value);
  var count = 0;
  var hasError = false;
  var gotResultSuccess = function gotResultSuccess(key, ret) {
    if (hasError) return;
    result[key] = ret;
    count++;
    if (count === keys.length) {
      yieldNext(result);
    }
  };
  var gotResultError = function gotResultError(key, error) {
    if (hasError) return;
    hasError = true;
    raiseNext(error);
  };
  keys.map(function (key) {
    rungen(value.value[key], function (ret) {
      return gotResultSuccess(key, ret);
    }, function (err) {
      return gotResultError(key, err);
    });
  });
  return true;
};
var array = builtin.array = function array(value, next, rungen, yieldNext, raiseNext) {
  if (!_is2$3.default.all(value) || !_is2$3.default.array(value.value)) return false;
  var result = [];
  var count = 0;
  var hasError = false;
  var gotResultSuccess = function gotResultSuccess(key, ret) {
    if (hasError) return;
    result[key] = ret;
    count++;
    if (count === value.value.length) {
      yieldNext(result);
    }
  };
  var gotResultError = function gotResultError(key, error) {
    if (hasError) return;
    hasError = true;
    raiseNext(error);
  };
  value.value.map(function (v, key) {
    rungen(v, function (ret) {
      return gotResultSuccess(key, ret);
    }, function (err) {
      return gotResultError(key, err);
    });
  });
  return true;
};
var iterator = builtin.iterator = function iterator(value, next, rungen, yieldNext, raiseNext) {
  if (!_is2$3.default.iterator(value)) return false;
  rungen(value, next, raiseNext);
  return true;
};
builtin.default = [error, iterator, array, object, any];

Object.defineProperty(create$1, "__esModule", {
  value: true
});
var _builtin = builtin;
var _builtin2 = _interopRequireDefault$2(_builtin);
var _is$2 = is$1;
var _is2$2 = _interopRequireDefault$2(_is$2);
function _interopRequireDefault$2(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
function _toConsumableArray$1(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  } else {
    return Array.from(arr);
  }
}
var create = function create() {
  var userControls = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
  var controls = [].concat(_toConsumableArray$1(userControls), _toConsumableArray$1(_builtin2.default));
  var runtime = function runtime(input) {
    var success = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];
    var error = arguments.length <= 2 || arguments[2] === undefined ? function () {} : arguments[2];
    var iterate = function iterate(gen) {
      var yieldValue = function yieldValue(isError) {
        return function (ret) {
          try {
            var _ref = isError ? gen.throw(ret) : gen.next(ret);
            var value = _ref.value;
            var done = _ref.done;
            if (done) return success(value);
            next(value);
          } catch (e) {
            return error(e);
          }
        };
      };
      var next = function next(ret) {
        controls.some(function (control) {
          return control(ret, next, runtime, yieldValue(false), yieldValue(true));
        });
      };
      yieldValue(false)();
    };
    var iterator = _is2$2.default.iterator(input) ? input : _regeneratorRuntime.mark(function _callee() {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return input;
            case 2:
              return _context.abrupt('return', _context.sent);
            case 3:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    })();
    iterate(iterator);
  };
  return runtime;
};
create$1.default = create;

var async = {};

var dispatcher = {};

Object.defineProperty(dispatcher, "__esModule", {
  value: true
});
var createDispatcher = function createDispatcher() {
  var listeners = [];
  return {
    subscribe: function subscribe(listener) {
      listeners.push(listener);
      return function () {
        listeners = listeners.filter(function (l) {
          return l !== listener;
        });
      };
    },
    dispatch: function dispatch(action) {
      listeners.slice().forEach(function (listener) {
        return listener(action);
      });
    }
  };
};
dispatcher.default = createDispatcher;

Object.defineProperty(async, "__esModule", {
  value: true
});
async.race = async.join = async.fork = async.promise = undefined;
var _is$1 = is$1;
var _is2$1 = _interopRequireDefault$1(_is$1);
var _helpers = helpers;
var _dispatcher = dispatcher;
var _dispatcher2 = _interopRequireDefault$1(_dispatcher);
function _interopRequireDefault$1(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
var promise = async.promise = function promise(value, next, rungen, yieldNext, raiseNext) {
  if (!_is2$1.default.promise(value)) return false;
  value.then(next, raiseNext);
  return true;
};
var forkedTasks = new Map();
var fork = async.fork = function fork(value, next, rungen) {
  if (!_is2$1.default.fork(value)) return false;
  var task = Symbol('fork');
  var dispatcher = (0, _dispatcher2.default)();
  forkedTasks.set(task, dispatcher);
  rungen(value.iterator.apply(null, value.args), function (result) {
    return dispatcher.dispatch(result);
  }, function (err) {
    return dispatcher.dispatch((0, _helpers.error)(err));
  });
  var unsubscribe = dispatcher.subscribe(function () {
    unsubscribe();
    forkedTasks.delete(task);
  });
  next(task);
  return true;
};
var join = async.join = function join(value, next, rungen, yieldNext, raiseNext) {
  if (!_is2$1.default.join(value)) return false;
  var dispatcher = forkedTasks.get(value.task);
  if (!dispatcher) {
    raiseNext('join error : task not found');
  } else {
    (function () {
      var unsubscribe = dispatcher.subscribe(function (result) {
        unsubscribe();
        next(result);
      });
    })();
  }
  return true;
};
var race = async.race = function race(value, next, rungen, yieldNext, raiseNext) {
  if (!_is2$1.default.race(value)) return false;
  var finished = false;
  var success = function success(result, k, v) {
    if (finished) return;
    finished = true;
    result[k] = v;
    next(result);
  };
  var fail = function fail(err) {
    if (finished) return;
    raiseNext(err);
  };
  if (_is2$1.default.array(value.competitors)) {
    (function () {
      var result = value.competitors.map(function () {
        return false;
      });
      value.competitors.forEach(function (competitor, index) {
        rungen(competitor, function (output) {
          return success(result, index, output);
        }, fail);
      });
    })();
  } else {
    (function () {
      var result = Object.keys(value.competitors).reduce(function (p, c) {
        p[c] = false;
        return p;
      }, {});
      Object.keys(value.competitors).forEach(function (index) {
        rungen(value.competitors[index], function (output) {
          return success(result, index, output);
        }, fail);
      });
    })();
  }
  return true;
};
var subscribe = function subscribe(value, next) {
  if (!_is2$1.default.subscribe(value)) return false;
  if (!_is2$1.default.channel(value.channel)) {
    throw new Error('the first argument of "subscribe" must be a valid channel');
  }
  var unsubscribe = value.channel.subscribe(function (ret) {
    unsubscribe && unsubscribe();
    next(ret);
  });
  return true;
};
async.default = [promise, fork, join, race, subscribe];

var wrap = {};

Object.defineProperty(wrap, "__esModule", {
  value: true
});
wrap.cps = wrap.call = undefined;
var _is = is$1;
var _is2 = _interopRequireDefault(_is);
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}
function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  } else {
    return Array.from(arr);
  }
}
var call = wrap.call = function call(value, next, rungen, yieldNext, raiseNext) {
  if (!_is2.default.call(value)) return false;
  try {
    next(value.func.apply(value.context, value.args));
  } catch (err) {
    raiseNext(err);
  }
  return true;
};
var cps = wrap.cps = function cps(value, next, rungen, yieldNext, raiseNext) {
  var _value$func;
  if (!_is2.default.cps(value)) return false;
  (_value$func = value.func).call.apply(_value$func, [null].concat(_toConsumableArray(value.args), [function (err, result) {
    if (err) raiseNext(err);else next(result);
  }]));
  return true;
};
wrap.default = [call, cps];

(function (exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.wrapControls = exports.asyncControls = exports.create = undefined;
  var _helpers = helpers;
  Object.keys(_helpers).forEach(function (key) {
    if (key === "default") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function get() {
        return _helpers[key];
      }
    });
  });
  var _create = create$1;
  var _create2 = _interopRequireDefault(_create);
  var _async = async;
  var _async2 = _interopRequireDefault(_async);
  var _wrap = wrap;
  var _wrap2 = _interopRequireDefault(_wrap);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }
  exports.create = _create2.default;
  exports.asyncControls = _async2.default;
  exports.wrapControls = _wrap2.default;
})(dist);

function isPromise(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

function isPlainObject(o) {
  var ctor,prot;

  if (isObject(o) === false) return false;

  // If has modified constructor
  ctor = o.constructor;
  if (ctor === undefined) return true;

  // If has modified prototype
  prot = ctor.prototype;
  if (isObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
}

/**
 * External dependencies
 */

/* eslint-disable jsdoc/valid-types */
/**
 * Returns true if the given object quacks like an action.
 *
 * @param {any} object Object to test
 *
 * @return {object is import('redux').AnyAction}  Whether object is an action.
 */
function isAction(object) {
  return isPlainObject(object) && typeof object.type === 'string';
}

/**
 * Returns true if the given object quacks like an action and has a specific
 * action type
 *
 * @param {unknown} object       Object to test
 * @param {string}  expectedType The expected type for the action.
 *
 * @return {object is import('redux').AnyAction} Whether object is an action and is of specific type.
 */
function isActionOfType(object, expectedType) {
  /* eslint-enable jsdoc/valid-types */
  return isAction(object) && object.type === expectedType;
}

/**
 * External dependencies
 */


/**
 * Create a co-routine runtime.
 *
 * @param controls Object of control handlers.
 * @param dispatch Unhandled action dispatch.
 */
function createRuntime(controls = {}, dispatch) {
  const rungenControls = Object.entries(controls).map(([actionType, control]) => (value, next, iterate, yieldNext, yieldError) => {
    if (!isActionOfType(value, actionType)) {
      return false;
    }
    const routine = control(value);
    if (isPromise(routine)) {
      // Async control routine awaits resolution.
      routine.then(yieldNext, yieldError);
    } else {
      yieldNext(routine);
    }
    return true;
  });
  const unhandledActionControl = (value, next) => {
    if (!isAction(value)) {
      return false;
    }
    dispatch(value);
    next();
    return true;
  };
  rungenControls.push(unhandledActionControl);
  const rungenRuntime = dist.create(rungenControls);
  return action => new Promise((resolve, reject) => rungenRuntime(action, result => {
    if (isAction(result)) {
      dispatch(result);
    }
    resolve(result);
  }, reject));
}

/**
 * Internal dependencies
 */

/**
 * Creates a Redux middleware, given an object of controls where each key is an
 * action type for which to act upon, the value a function which returns either
 * a promise which is to resolve when evaluation of the action should continue,
 * or a value. The value or resolved promise value is assigned on the return
 * value of the yield assignment. If the control handler returns undefined, the
 * execution is not continued.
 *
 * @param {Record<string, (value: import('redux').AnyAction) => Promise<boolean> | boolean>} controls Object of control handlers.
 *
 * @return {import('redux').Middleware} Co-routine runtime
 */
function createMiddleware(controls = {}) {
  return store => {
    const runtime = createRuntime(controls, store.dispatch);
    return next => action => {
      if (!isGenerator(action)) {
        return next(action);
      }
      return runtime(action);
    };
  };
}

/**
 * Parts of this source were derived and modified from lodash,
 * released under the MIT license.
 *
 * https://github.com/lodash/lodash
 *
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 *
 * Based on Underscore.js, copyright Jeremy Ashkenas,
 * DocumentCloud and Investigative Reporters & Editors <http://underscorejs.org/>
 *
 * This software consists of voluntary contributions made by many
 * individuals. For exact contribution history, see the revision history
 * available at https://github.com/lodash/lodash
 *
 * The following license applies to all parts of this software except as
 * documented below:
 *
 * ====
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Creates a pipe function.
 *
 * Allows to choose whether to perform left-to-right or right-to-left composition.
 *
 * @see https://lodash.com/docs/4#flow
 *
 * @param {boolean} reverse True if right-to-left, false for left-to-right composition.
 */
const basePipe = (reverse = false) => (...funcs) => (...args) => {
  const functions = funcs.flat();
  if (reverse) {
    functions.reverse();
  }
  return functions.reduce((prev, func) => [func(...prev)], args)[0];
};

/**
 * Internal dependencies
 */

/**
 * Composes multiple higher-order components into a single higher-order component. Performs right-to-left function
 * composition, where each successive invocation is supplied the return value of the previous.
 *
 * This is inspired by `lodash`'s `flowRight` function.
 *
 * @see https://lodash.com/docs/4#flow-right
 */
const compose = basePipe(true);

function combineReducers$1(reducers) {
  const keys = Object.keys(reducers);
  return function combinedReducer(state = {}, action) {
    const nextState = {};
    let hasChanged = false;
    for (const key of keys) {
      const reducer = reducers[key];
      const prevStateForKey = state[key];
      const nextStateForKey = reducer(prevStateForKey, action);
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== prevStateForKey;
    }
    return hasChanged ? nextState : state;
  };
}

/**
 * Creates a selector function that takes additional curried argument with the
 * registry `select` function. While a regular selector has signature
 * ```js
 * ( state, ...selectorArgs ) => ( result )
 * ```
 * that allows to select data from the store's `state`, a registry selector
 * has signature:
 * ```js
 * ( select ) => ( state, ...selectorArgs ) => ( result )
 * ```
 * that supports also selecting from other registered stores.
 *
 * @example
 * ```js
 * import { store as coreStore } from '@wordpress/core-data';
 * import { store as editorStore } from '@wordpress/editor';
 *
 * const getCurrentPostId = createRegistrySelector( ( select ) => ( state ) => {
 *   return select( editorStore ).getCurrentPostId();
 * } );
 *
 * const getPostEdits = createRegistrySelector( ( select ) => ( state ) => {
 *   // calling another registry selector just like any other function
 *   const postType = getCurrentPostType( state );
 *   const postId = getCurrentPostId( state );
 *	 return select( coreStore ).getEntityRecordEdits( 'postType', postType, postId );
 * } );
 * ```
 *
 * Note how the `getCurrentPostId` selector can be called just like any other function,
 * (it works even inside a regular non-registry selector) and we don't need to pass the
 * registry as argument. The registry binding happens automatically when registering the selector
 * with a store.
 *
 * @param {Function} registrySelector Function receiving a registry `select`
 *                                    function and returning a state selector.
 *
 * @return {Function} Registry selector that can be registered with a store.
 */

/**
 * Creates a control function that takes additional curried argument with the `registry` object.
 * While a regular control has signature
 * ```js
 * ( action ) => ( iteratorOrPromise )
 * ```
 * where the control works with the `action` that it's bound to, a registry control has signature:
 * ```js
 * ( registry ) => ( action ) => ( iteratorOrPromise )
 * ```
 * A registry control is typically used to select data or dispatch an action to a registered
 * store.
 *
 * When registering a control created with `createRegistryControl` with a store, the store
 * knows which calling convention to use when executing the control.
 *
 * @param {Function} registryControl Function receiving a registry object and returning a control.
 *
 * @return {Function} Registry control that can be registered with a store.
 */
function createRegistryControl(registryControl) {
  registryControl.isRegistryControl = true;
  return registryControl;
}

/**
 * Internal dependencies
 */

/** @typedef {import('./types').StoreDescriptor} StoreDescriptor */

const SELECT = '@@data/SELECT';
const RESOLVE_SELECT = '@@data/RESOLVE_SELECT';
const DISPATCH = '@@data/DISPATCH';
const builtinControls = {
  [SELECT]: createRegistryControl(registry => ({
    storeKey,
    selectorName,
    args
  }) => registry.select(storeKey)[selectorName](...args)),
  [RESOLVE_SELECT]: createRegistryControl(registry => ({
    storeKey,
    selectorName,
    args
  }) => {
    const method = registry.select(storeKey)[selectorName].hasResolver ? 'resolveSelect' : 'select';
    return registry[method](storeKey)[selectorName](...args);
  }),
  [DISPATCH]: createRegistryControl(registry => ({
    storeKey,
    actionName,
    args
  }) => registry.dispatch(storeKey)[actionName](...args))
};

/**
 * wordpress/private-apis – the utilities to enable private cross-package
 * exports of private APIs.
 *
 * This "implementation.js" file is needed for the sake of the unit tests. It
 * exports more than the public API of the package to aid in testing.
 */

/**
 * The list of core modules allowed to opt-in to the private APIs.
 */
const CORE_MODULES_USING_PRIVATE_APIS = ['@wordpress/block-directory', '@wordpress/block-editor', '@wordpress/block-library', '@wordpress/blocks', '@wordpress/commands', '@wordpress/components', '@wordpress/core-commands', '@wordpress/core-data', '@wordpress/customize-widgets', '@wordpress/data', '@wordpress/edit-post', '@wordpress/edit-site', '@wordpress/edit-widgets', '@wordpress/editor', '@wordpress/format-library', '@wordpress/interface', '@wordpress/patterns', '@wordpress/preferences', '@wordpress/reusable-blocks', '@wordpress/router', '@wordpress/dataviews'];

/**
 * A list of core modules that already opted-in to
 * the privateApis package.
 *
 * @type {string[]}
 */
const registeredPrivateApis = [];

/** @type {boolean} */
let allowReRegistration;
// The safety measure is meant for WordPress core where IS_WORDPRESS_CORE
// is set to true.
// For the general use-case, the re-registration should be allowed by default
// Let's default to true, then. Try/catch will fall back to "true" even if the
// environment variable is not explicitly defined.
try {
  allowReRegistration = globalThis.IS_WORDPRESS_CORE ? false : true;
} catch (error) {
  allowReRegistration = true;
}

/**
 * Called by a @wordpress package wishing to opt-in to accessing or exposing
 * private private APIs.
 *
 * @param {string} consent    The consent string.
 * @param {string} moduleName The name of the module that is opting in.
 * @return {{lock: typeof lock, unlock: typeof unlock}} An object containing the lock and unlock functions.
 */
const __dangerousOptInToUnstableAPIsOnlyForCoreModules = (consent, moduleName) => {
  if (!CORE_MODULES_USING_PRIVATE_APIS.includes(moduleName)) {
    throw new Error(`You tried to opt-in to unstable APIs as module "${moduleName}". ` + 'This feature is only for JavaScript modules shipped with WordPress core. ' + 'Please do not use it in plugins and themes as the unstable APIs will be removed ' + 'without a warning. If you ignore this error and depend on unstable features, ' + 'your product will inevitably break on one of the next WordPress releases.');
  }
  if (!allowReRegistration && registeredPrivateApis.includes(moduleName)) {
    // This check doesn't play well with Story Books / Hot Module Reloading
    // and isn't included in the Gutenberg plugin. It only matters in the
    // WordPress core release.
    throw new Error(`You tried to opt-in to unstable APIs as module "${moduleName}" which is already registered. ` + 'This feature is only for JavaScript modules shipped with WordPress core. ' + 'Please do not use it in plugins and themes as the unstable APIs will be removed ' + 'without a warning. If you ignore this error and depend on unstable features, ' + 'your product will inevitably break on one of the next WordPress releases.');
  }
  registeredPrivateApis.push(moduleName);
  return {
    lock: lock$1,
    unlock: unlock$1
  };
};

/**
 * Binds private data to an object.
 * It does not alter the passed object in any way, only
 * registers it in an internal map of private data.
 *
 * The private data can't be accessed by any other means
 * than the `unlock` function.
 *
 * @example
 * ```js
 * const object = {};
 * const privateData = { a: 1 };
 * lock( object, privateData );
 *
 * object
 * // {}
 *
 * unlock( object );
 * // { a: 1 }
 * ```
 *
 * @param {any} object      The object to bind the private data to.
 * @param {any} privateData The private data to bind to the object.
 */
function lock$1(object, privateData) {
  if (!object) {
    throw new Error('Cannot lock an undefined object.');
  }
  if (!(__private in object)) {
    object[__private] = {};
  }
  lockedData.set(object[__private], privateData);
}

/**
 * Unlocks the private data bound to an object.
 *
 * It does not alter the passed object in any way, only
 * returns the private data paired with it using the `lock()`
 * function.
 *
 * @example
 * ```js
 * const object = {};
 * const privateData = { a: 1 };
 * lock( object, privateData );
 *
 * object
 * // {}
 *
 * unlock( object );
 * // { a: 1 }
 * ```
 *
 * @param {any} object The object to unlock the private data from.
 * @return {any} The private data bound to the object.
 */
function unlock$1(object) {
  if (!object) {
    throw new Error('Cannot unlock an undefined object.');
  }
  if (!(__private in object)) {
    throw new Error('Cannot unlock an object that was not locked before. ');
  }
  return lockedData.get(object[__private]);
}
const lockedData = new WeakMap();

/**
 * Used by lock() and unlock() to uniquely identify the private data
 * related to a containing object.
 */
const __private = Symbol('Private API ID');

/**
 * WordPress dependencies
 */
const {
  lock,
  unlock
} = __dangerousOptInToUnstableAPIsOnlyForCoreModules('I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.', '@wordpress/data');

/**
 * External dependencies
 */

/**
 * Simplest possible promise redux middleware.
 *
 * @type {import('redux').Middleware}
 */
const promiseMiddleware = () => next => action => {
  if (isPromise(action)) {
    return action.then(resolvedAction => {
      if (resolvedAction) {
        return next(resolvedAction);
      }
    });
  }
  return next(action);
};

/** @typedef {import('./registry').WPDataRegistry} WPDataRegistry */

/**
 * Creates a middleware handling resolvers cache invalidation.
 *
 * @param {WPDataRegistry} registry  Registry for which to create the middleware.
 * @param {string}         storeName Name of the store for which to create the middleware.
 *
 * @return {Function} Middleware function.
 */
const createResolversCacheMiddleware = (registry, storeName) => () => next => action => {
  const resolvers = registry.select(storeName).getCachedResolvers();
  const resolverEntries = Object.entries(resolvers);
  resolverEntries.forEach(([selectorName, resolversByArgs]) => {
    const resolver = registry.stores[storeName]?.resolvers?.[selectorName];
    if (!resolver || !resolver.shouldInvalidate) {
      return;
    }
    resolversByArgs.forEach((value, args) => {
      // Works around a bug in `EquivalentKeyMap` where `map.delete` merely sets an entry value
      // to `undefined` and `map.forEach` then iterates also over these orphaned entries.
      if (value === undefined) {
        return;
      }

      // resolversByArgs is the map Map([ args ] => boolean) storing the cache resolution status for a given selector.
      // If the value is "finished" or "error" it means this resolver has finished its resolution which means we need
      // to invalidate it, if it's true it means it's inflight and the invalidation is not necessary.
      if (value.status !== 'finished' && value.status !== 'error') {
        return;
      }
      if (!resolver.shouldInvalidate(action, ...args)) {
        return;
      }

      // Trigger cache invalidation
      registry.dispatch(storeName).invalidateResolution(selectorName, args);
    });
  });
  return next(action);
};

function createThunkMiddleware(args) {
  return () => next => action => {
    if (typeof action === 'function') {
      return action(args);
    }
    return next(action);
  };
}

/**
 * External dependencies
 */

/**
 * Higher-order reducer creator which creates a combined reducer object, keyed
 * by a property on the action object.
 *
 * @param actionProperty Action property by which to key object.
 * @return Higher-order reducer.
 */
const onSubKey = actionProperty => reducer => (state = {}, action) => {
  // Retrieve subkey from action. Do not track if undefined; useful for cases
  // where reducer is scoped by action shape.
  const key = action[actionProperty];
  if (key === undefined) {
    return state;
  }

  // Avoid updating state if unchanged. Note that this also accounts for a
  // reducer which returns undefined on a key which is not yet tracked.
  const nextKeyState = reducer(state[key], action);
  if (nextKeyState === state[key]) {
    return state;
  }
  return {
    ...state,
    [key]: nextKeyState
  };
};

/**
 * Normalize selector argument array by defaulting `undefined` value to an empty array
 * and removing trailing `undefined` values.
 *
 * @param args Selector argument array
 * @return Normalized state key array
 */
function selectorArgsToStateKey(args) {
  if (args === undefined || args === null) {
    return [];
  }
  const len = args.length;
  let idx = len;
  while (idx > 0 && args[idx - 1] === undefined) {
    idx--;
  }
  return idx === len ? args : args.slice(0, idx);
}

/**
 * External dependencies
 */
/**
 * Reducer function returning next state for selector resolution of
 * subkeys, object form:
 *
 *  selectorName -> EquivalentKeyMap<Array,boolean>
 */
const subKeysIsResolved = onSubKey('selectorName')((state = new EquivalentKeyMap$1(), action) => {
  switch (action.type) {
    case 'START_RESOLUTION':
      {
        const nextState = new EquivalentKeyMap$1(state);
        nextState.set(selectorArgsToStateKey(action.args), {
          status: 'resolving'
        });
        return nextState;
      }
    case 'FINISH_RESOLUTION':
      {
        const nextState = new EquivalentKeyMap$1(state);
        nextState.set(selectorArgsToStateKey(action.args), {
          status: 'finished'
        });
        return nextState;
      }
    case 'FAIL_RESOLUTION':
      {
        const nextState = new EquivalentKeyMap$1(state);
        nextState.set(selectorArgsToStateKey(action.args), {
          status: 'error',
          error: action.error
        });
        return nextState;
      }
    case 'START_RESOLUTIONS':
      {
        const nextState = new EquivalentKeyMap$1(state);
        for (const resolutionArgs of action.args) {
          nextState.set(selectorArgsToStateKey(resolutionArgs), {
            status: 'resolving'
          });
        }
        return nextState;
      }
    case 'FINISH_RESOLUTIONS':
      {
        const nextState = new EquivalentKeyMap$1(state);
        for (const resolutionArgs of action.args) {
          nextState.set(selectorArgsToStateKey(resolutionArgs), {
            status: 'finished'
          });
        }
        return nextState;
      }
    case 'FAIL_RESOLUTIONS':
      {
        const nextState = new EquivalentKeyMap$1(state);
        action.args.forEach((resolutionArgs, idx) => {
          const resolutionState = {
            status: 'error',
            error: undefined
          };
          const error = action.errors[idx];
          if (error) {
            resolutionState.error = error;
          }
          nextState.set(selectorArgsToStateKey(resolutionArgs), resolutionState);
        });
        return nextState;
      }
    case 'INVALIDATE_RESOLUTION':
      {
        const nextState = new EquivalentKeyMap$1(state);
        nextState.delete(selectorArgsToStateKey(action.args));
        return nextState;
      }
  }
  return state;
});

/**
 * Reducer function returning next state for selector resolution, object form:
 *
 *   selectorName -> EquivalentKeyMap<Array, boolean>
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Next state.
 */
const isResolved = (state = {}, action) => {
  switch (action.type) {
    case 'INVALIDATE_RESOLUTION_FOR_STORE':
      return {};
    case 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR':
      {
        if (action.selectorName in state) {
          const {
            [action.selectorName]: removedSelector,
            ...restState
          } = state;
          return restState;
        }
        return state;
      }
    case 'START_RESOLUTION':
    case 'FINISH_RESOLUTION':
    case 'FAIL_RESOLUTION':
    case 'START_RESOLUTIONS':
    case 'FINISH_RESOLUTIONS':
    case 'FAIL_RESOLUTIONS':
    case 'INVALIDATE_RESOLUTION':
      return subKeysIsResolved(state, action);
  }
  return state;
};

/** @typedef {(...args: any[]) => *[]} GetDependants */

/** @typedef {() => void} Clear */

/**
 * @typedef {{
 *   getDependants: GetDependants,
 *   clear: Clear
 * }} EnhancedSelector
 */

/**
 * Internal cache entry.
 *
 * @typedef CacheNode
 *
 * @property {?CacheNode|undefined} [prev] Previous node.
 * @property {?CacheNode|undefined} [next] Next node.
 * @property {*[]} args Function arguments for cache entry.
 * @property {*} val Function result.
 */

/**
 * @typedef Cache
 *
 * @property {Clear} clear Function to clear cache.
 * @property {boolean} [isUniqueByDependants] Whether dependants are valid in
 * considering cache uniqueness. A cache is unique if dependents are all arrays
 * or objects.
 * @property {CacheNode?} [head] Cache head.
 * @property {*[]} [lastDependants] Dependants from previous invocation.
 */

/**
 * Arbitrary value used as key for referencing cache object in WeakMap tree.
 *
 * @type {{}}
 */
var LEAF_KEY = {};

/**
 * Returns the first argument as the sole entry in an array.
 *
 * @template T
 *
 * @param {T} value Value to return.
 *
 * @return {[T]} Value returned as entry in array.
 */
function arrayOf(value) {
  return [value];
}

/**
 * Returns true if the value passed is object-like, or false otherwise. A value
 * is object-like if it can support property assignment, e.g. object or array.
 *
 * @param {*} value Value to test.
 *
 * @return {boolean} Whether value is object-like.
 */
function isObjectLike(value) {
  return !!value && 'object' === typeof value;
}

/**
 * Creates and returns a new cache object.
 *
 * @return {Cache} Cache object.
 */
function createCache() {
  /** @type {Cache} */
  var cache = {
    clear: function () {
      cache.head = null;
    }
  };
  return cache;
}

/**
 * Returns true if entries within the two arrays are strictly equal by
 * reference from a starting index.
 *
 * @param {*[]} a First array.
 * @param {*[]} b Second array.
 * @param {number} fromIndex Index from which to start comparison.
 *
 * @return {boolean} Whether arrays are shallowly equal.
 */
function isShallowEqual(a, b, fromIndex) {
  var i;
  if (a.length !== b.length) {
    return false;
  }
  for (i = fromIndex; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Returns a memoized selector function. The getDependants function argument is
 * called before the memoized selector and is expected to return an immutable
 * reference or array of references on which the selector depends for computing
 * its own return value. The memoize cache is preserved only as long as those
 * dependant references remain the same. If getDependants returns a different
 * reference(s), the cache is cleared and the selector value regenerated.
 *
 * @template {(...args: *[]) => *} S
 *
 * @param {S} selector Selector function.
 * @param {GetDependants=} getDependants Dependant getter returning an array of
 * references used in cache bust consideration.
 */
function createSelector (selector, getDependants) {
  /** @type {WeakMap<*,*>} */
  var rootCache;

  /** @type {GetDependants} */
  var normalizedGetDependants = getDependants ? getDependants : arrayOf;

  /**
   * Returns the cache for a given dependants array. When possible, a WeakMap
   * will be used to create a unique cache for each set of dependants. This
   * is feasible due to the nature of WeakMap in allowing garbage collection
   * to occur on entries where the key object is no longer referenced. Since
   * WeakMap requires the key to be an object, this is only possible when the
   * dependant is object-like. The root cache is created as a hierarchy where
   * each top-level key is the first entry in a dependants set, the value a
   * WeakMap where each key is the next dependant, and so on. This continues
   * so long as the dependants are object-like. If no dependants are object-
   * like, then the cache is shared across all invocations.
   *
   * @see isObjectLike
   *
   * @param {*[]} dependants Selector dependants.
   *
   * @return {Cache} Cache object.
   */
  function getCache(dependants) {
    var caches = rootCache,
      isUniqueByDependants = true,
      i,
      dependant,
      map,
      cache;
    for (i = 0; i < dependants.length; i++) {
      dependant = dependants[i];

      // Can only compose WeakMap from object-like key.
      if (!isObjectLike(dependant)) {
        isUniqueByDependants = false;
        break;
      }

      // Does current segment of cache already have a WeakMap?
      if (caches.has(dependant)) {
        // Traverse into nested WeakMap.
        caches = caches.get(dependant);
      } else {
        // Create, set, and traverse into a new one.
        map = new WeakMap();
        caches.set(dependant, map);
        caches = map;
      }
    }

    // We use an arbitrary (but consistent) object as key for the last item
    // in the WeakMap to serve as our running cache.
    if (!caches.has(LEAF_KEY)) {
      cache = createCache();
      cache.isUniqueByDependants = isUniqueByDependants;
      caches.set(LEAF_KEY, cache);
    }
    return caches.get(LEAF_KEY);
  }

  /**
   * Resets root memoization cache.
   */
  function clear() {
    rootCache = new WeakMap();
  }

  /* eslint-disable jsdoc/check-param-names */
  /**
   * The augmented selector call, considering first whether dependants have
   * changed before passing it to underlying memoize function.
   *
   * @param {*}    source    Source object for derivation.
   * @param {...*} extraArgs Additional arguments to pass to selector.
   *
   * @return {*} Selector result.
   */
  /* eslint-enable jsdoc/check-param-names */
  function callSelector( /* source, ...extraArgs */
  ) {
    var len = arguments.length,
      cache,
      node,
      i,
      args,
      dependants;

    // Create copy of arguments (avoid leaking deoptimization).
    args = new Array(len);
    for (i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    dependants = normalizedGetDependants.apply(null, args);
    cache = getCache(dependants);

    // If not guaranteed uniqueness by dependants (primitive type), shallow
    // compare against last dependants and, if references have changed,
    // destroy cache to recalculate result.
    if (!cache.isUniqueByDependants) {
      if (cache.lastDependants && !isShallowEqual(dependants, cache.lastDependants, 0)) {
        cache.clear();
      }
      cache.lastDependants = dependants;
    }
    node = cache.head;
    while (node) {
      // Check whether node arguments match arguments
      if (!isShallowEqual(node.args, args, 1)) {
        node = node.next;
        continue;
      }

      // At this point we can assume we've found a match

      // Surface matched node to head if not already
      if (node !== cache.head) {
        // Adjust siblings to point to each other.
        /** @type {CacheNode} */
        node.prev.next = node.next;
        if (node.next) {
          node.next.prev = node.prev;
        }
        node.next = cache.head;
        node.prev = null;
        /** @type {CacheNode} */
        cache.head.prev = node;
        cache.head = node;
      }

      // Return immediately
      return node.val;
    }

    // No cached value found. Continue to insertion phase:

    node = /** @type {CacheNode} */{
      // Generate the result from original function
      val: selector.apply(null, args)
    };

    // Avoid including the source object in the cache.
    args[0] = null;
    node.args = args;

    // Don't need to check whether node is already head, since it would
    // have been returned above already if it was

    // Shift existing head down list
    if (cache.head) {
      cache.head.prev = node;
      node.next = cache.head;
    }
    cache.head = node;
    return node.val;
  }
  callSelector.getDependants = normalizedGetDependants;
  callSelector.clear = clear;
  clear();
  return /** @type {S & EnhancedSelector} */callSelector;
}

/**
 * WordPress dependencies
 */

/** @typedef {Record<string, import('./reducer').State>} State */
/** @typedef {import('./reducer').StateValue} StateValue */
/** @typedef {import('./reducer').Status} Status */

/**
 * Returns the raw resolution state value for a given selector name,
 * and arguments set. May be undefined if the selector has never been resolved
 * or not resolved for the given set of arguments, otherwise true or false for
 * resolution started and completed respectively.
 *
 * @param {State}      state        Data state.
 * @param {string}     selectorName Selector name.
 * @param {unknown[]?} args         Arguments passed to selector.
 *
 * @return {StateValue|undefined} isResolving value.
 */
function getResolutionState(state, selectorName, args) {
  const map = state[selectorName];
  if (!map) {
    return;
  }
  return map.get(selectorArgsToStateKey(args));
}

/**
 * Returns an `isResolving`-like value for a given selector name and arguments set.
 * Its value is either `undefined` if the selector has never been resolved or has been
 * invalidated, or a `true`/`false` boolean value if the resolution is in progress or
 * has finished, respectively.
 *
 * This is a legacy selector that was implemented when the "raw" internal data had
 * this `undefined | boolean` format. Nowadays the internal value is an object that
 * can be retrieved with `getResolutionState`.
 *
 * @deprecated
 *
 * @param {State}      state        Data state.
 * @param {string}     selectorName Selector name.
 * @param {unknown[]?} args         Arguments passed to selector.
 *
 * @return {boolean | undefined} isResolving value.
 */
function getIsResolving(state, selectorName, args) {
  deprecated('wp.data.select( store ).getIsResolving', {
    since: '6.6',
    version: '6.8',
    alternative: 'wp.data.select( store ).getResolutionState'
  });
  const resolutionState = getResolutionState(state, selectorName, args);
  return resolutionState && resolutionState.status === 'resolving';
}

/**
 * Returns true if resolution has already been triggered for a given
 * selector name, and arguments set.
 *
 * @param {State}      state        Data state.
 * @param {string}     selectorName Selector name.
 * @param {unknown[]?} args         Arguments passed to selector.
 *
 * @return {boolean} Whether resolution has been triggered.
 */
function hasStartedResolution(state, selectorName, args) {
  return getResolutionState(state, selectorName, args) !== undefined;
}

/**
 * Returns true if resolution has completed for a given selector
 * name, and arguments set.
 *
 * @param {State}      state        Data state.
 * @param {string}     selectorName Selector name.
 * @param {unknown[]?} args         Arguments passed to selector.
 *
 * @return {boolean} Whether resolution has completed.
 */
function hasFinishedResolution(state, selectorName, args) {
  const status = getResolutionState(state, selectorName, args)?.status;
  return status === 'finished' || status === 'error';
}

/**
 * Returns true if resolution has failed for a given selector
 * name, and arguments set.
 *
 * @param {State}      state        Data state.
 * @param {string}     selectorName Selector name.
 * @param {unknown[]?} args         Arguments passed to selector.
 *
 * @return {boolean} Has resolution failed
 */
function hasResolutionFailed(state, selectorName, args) {
  return getResolutionState(state, selectorName, args)?.status === 'error';
}

/**
 * Returns the resolution error for a given selector name, and arguments set.
 * Note it may be of an Error type, but may also be null, undefined, or anything else
 * that can be `throw`-n.
 *
 * @param {State}      state        Data state.
 * @param {string}     selectorName Selector name.
 * @param {unknown[]?} args         Arguments passed to selector.
 *
 * @return {Error|unknown} Last resolution error
 */
function getResolutionError(state, selectorName, args) {
  const resolutionState = getResolutionState(state, selectorName, args);
  return resolutionState?.status === 'error' ? resolutionState.error : null;
}

/**
 * Returns true if resolution has been triggered but has not yet completed for
 * a given selector name, and arguments set.
 *
 * @param {State}      state        Data state.
 * @param {string}     selectorName Selector name.
 * @param {unknown[]?} args         Arguments passed to selector.
 *
 * @return {boolean} Whether resolution is in progress.
 */
function isResolving(state, selectorName, args) {
  return getResolutionState(state, selectorName, args)?.status === 'resolving';
}

/**
 * Returns the list of the cached resolvers.
 *
 * @param {State} state Data state.
 *
 * @return {State} Resolvers mapped by args and selectorName.
 */
function getCachedResolvers(state) {
  return state;
}

/**
 * Whether the store has any currently resolving selectors.
 *
 * @param {State} state Data state.
 *
 * @return {boolean} True if one or more selectors are resolving, false otherwise.
 */
function hasResolvingSelectors(state) {
  return Object.values(state).some(selectorState =>
  /**
   * This uses the internal `_map` property of `EquivalentKeyMap` for
   * optimization purposes, since the `EquivalentKeyMap` implementation
   * does not support a `.values()` implementation.
   *
   * @see https://github.com/aduth/equivalent-key-map
   */
  Array.from(selectorState._map.values()).some(resolution => resolution[1]?.status === 'resolving'));
}

/**
 * Retrieves the total number of selectors, grouped per status.
 *
 * @param {State} state Data state.
 *
 * @return {Object} Object, containing selector totals by status.
 */
const countSelectorsByStatus = createSelector(state => {
  const selectorsByStatus = {};
  Object.values(state).forEach(selectorState =>
  /**
   * This uses the internal `_map` property of `EquivalentKeyMap` for
   * optimization purposes, since the `EquivalentKeyMap` implementation
   * does not support a `.values()` implementation.
   *
   * @see https://github.com/aduth/equivalent-key-map
   */
  Array.from(selectorState._map.values()).forEach(resolution => {
    var _resolution$1$status;
    const currentStatus = (_resolution$1$status = resolution[1]?.status) !== null && _resolution$1$status !== void 0 ? _resolution$1$status : 'error';
    if (!selectorsByStatus[currentStatus]) {
      selectorsByStatus[currentStatus] = 0;
    }
    selectorsByStatus[currentStatus]++;
  }));
  return selectorsByStatus;
}, state => [state]);

var metadataSelectors = /*#__PURE__*/Object.freeze({
	__proto__: null,
	countSelectorsByStatus: countSelectorsByStatus,
	getCachedResolvers: getCachedResolvers,
	getIsResolving: getIsResolving,
	getResolutionError: getResolutionError,
	getResolutionState: getResolutionState,
	hasFinishedResolution: hasFinishedResolution,
	hasResolutionFailed: hasResolutionFailed,
	hasResolvingSelectors: hasResolvingSelectors,
	hasStartedResolution: hasStartedResolution,
	isResolving: isResolving
});

/**
 * Returns an action object used in signalling that selector resolution has
 * started.
 *
 * @param {string}    selectorName Name of selector for which resolver triggered.
 * @param {unknown[]} args         Arguments to associate for uniqueness.
 *
 * @return {{ type: 'START_RESOLUTION', selectorName: string, args: unknown[] }} Action object.
 */
function startResolution(selectorName, args) {
  return {
    type: 'START_RESOLUTION',
    selectorName,
    args
  };
}

/**
 * Returns an action object used in signalling that selector resolution has
 * completed.
 *
 * @param {string}    selectorName Name of selector for which resolver triggered.
 * @param {unknown[]} args         Arguments to associate for uniqueness.
 *
 * @return {{ type: 'FINISH_RESOLUTION', selectorName: string, args: unknown[] }} Action object.
 */
function finishResolution(selectorName, args) {
  return {
    type: 'FINISH_RESOLUTION',
    selectorName,
    args
  };
}

/**
 * Returns an action object used in signalling that selector resolution has
 * failed.
 *
 * @param {string}        selectorName Name of selector for which resolver triggered.
 * @param {unknown[]}     args         Arguments to associate for uniqueness.
 * @param {Error|unknown} error        The error that caused the failure.
 *
 * @return {{ type: 'FAIL_RESOLUTION', selectorName: string, args: unknown[], error: Error|unknown }} Action object.
 */
function failResolution(selectorName, args, error) {
  return {
    type: 'FAIL_RESOLUTION',
    selectorName,
    args,
    error
  };
}

/**
 * Returns an action object used in signalling that a batch of selector resolutions has
 * started.
 *
 * @param {string}      selectorName Name of selector for which resolver triggered.
 * @param {unknown[][]} args         Array of arguments to associate for uniqueness, each item
 *                                   is associated to a resolution.
 *
 * @return {{ type: 'START_RESOLUTIONS', selectorName: string, args: unknown[][] }} Action object.
 */
function startResolutions(selectorName, args) {
  return {
    type: 'START_RESOLUTIONS',
    selectorName,
    args
  };
}

/**
 * Returns an action object used in signalling that a batch of selector resolutions has
 * completed.
 *
 * @param {string}      selectorName Name of selector for which resolver triggered.
 * @param {unknown[][]} args         Array of arguments to associate for uniqueness, each item
 *                                   is associated to a resolution.
 *
 * @return {{ type: 'FINISH_RESOLUTIONS', selectorName: string, args: unknown[][] }} Action object.
 */
function finishResolutions(selectorName, args) {
  return {
    type: 'FINISH_RESOLUTIONS',
    selectorName,
    args
  };
}

/**
 * Returns an action object used in signalling that a batch of selector resolutions has
 * completed and at least one of them has failed.
 *
 * @param {string}            selectorName Name of selector for which resolver triggered.
 * @param {unknown[]}         args         Array of arguments to associate for uniqueness, each item
 *                                         is associated to a resolution.
 * @param {(Error|unknown)[]} errors       Array of errors to associate for uniqueness, each item
 *                                         is associated to a resolution.
 * @return {{ type: 'FAIL_RESOLUTIONS', selectorName: string, args: unknown[], errors: Array<Error|unknown> }} Action object.
 */
function failResolutions(selectorName, args, errors) {
  return {
    type: 'FAIL_RESOLUTIONS',
    selectorName,
    args,
    errors
  };
}

/**
 * Returns an action object used in signalling that we should invalidate the resolution cache.
 *
 * @param {string}    selectorName Name of selector for which resolver should be invalidated.
 * @param {unknown[]} args         Arguments to associate for uniqueness.
 *
 * @return {{ type: 'INVALIDATE_RESOLUTION', selectorName: string, args: any[] }} Action object.
 */
function invalidateResolution(selectorName, args) {
  return {
    type: 'INVALIDATE_RESOLUTION',
    selectorName,
    args
  };
}

/**
 * Returns an action object used in signalling that the resolution
 * should be invalidated.
 *
 * @return {{ type: 'INVALIDATE_RESOLUTION_FOR_STORE' }} Action object.
 */
function invalidateResolutionForStore() {
  return {
    type: 'INVALIDATE_RESOLUTION_FOR_STORE'
  };
}

/**
 * Returns an action object used in signalling that the resolution cache for a
 * given selectorName should be invalidated.
 *
 * @param {string} selectorName Name of selector for which all resolvers should
 *                              be invalidated.
 *
 * @return  {{ type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR', selectorName: string }} Action object.
 */
function invalidateResolutionForStoreSelector(selectorName) {
  return {
    type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR',
    selectorName
  };
}

var metadataActions = /*#__PURE__*/Object.freeze({
	__proto__: null,
	failResolution: failResolution,
	failResolutions: failResolutions,
	finishResolution: finishResolution,
	finishResolutions: finishResolutions,
	invalidateResolution: invalidateResolution,
	invalidateResolutionForStore: invalidateResolutionForStore,
	invalidateResolutionForStoreSelector: invalidateResolutionForStoreSelector,
	startResolution: startResolution,
	startResolutions: startResolutions
});

/**
 * External dependencies
 */

/** @typedef {import('../types').DataRegistry} DataRegistry */
/** @typedef {import('../types').ListenerFunction} ListenerFunction */
/**
 * @typedef {import('../types').StoreDescriptor<C>} StoreDescriptor
 * @template {import('../types').AnyConfig} C
 */
/**
 * @typedef {import('../types').ReduxStoreConfig<State,Actions,Selectors>} ReduxStoreConfig
 * @template State
 * @template {Record<string,import('../types').ActionCreator>} Actions
 * @template Selectors
 */

const trimUndefinedValues = array => {
  const result = [...array];
  for (let i = result.length - 1; i >= 0; i--) {
    if (result[i] === undefined) {
      result.splice(i, 1);
    }
  }
  return result;
};

/**
 * Creates a new object with the same keys, but with `callback()` called as
 * a transformer function on each of the values.
 *
 * @param {Object}   obj      The object to transform.
 * @param {Function} callback The function to transform each object value.
 * @return {Array} Transformed object.
 */
const mapValues = (obj, callback) => Object.fromEntries(Object.entries(obj !== null && obj !== void 0 ? obj : {}).map(([key, value]) => [key, callback(value, key)]));

// Convert  non serializable types to plain objects
const devToolsReplacer = (key, state) => {
  if (state instanceof Map) {
    return Object.fromEntries(state);
  }
  if (state instanceof window.HTMLElement) {
    return null;
  }
  return state;
};

/**
 * Create a cache to track whether resolvers started running or not.
 *
 * @return {Object} Resolvers Cache.
 */
function createResolversCache() {
  const cache = {};
  return {
    isRunning(selectorName, args) {
      return cache[selectorName] && cache[selectorName].get(trimUndefinedValues(args));
    },
    clear(selectorName, args) {
      if (cache[selectorName]) {
        cache[selectorName].delete(trimUndefinedValues(args));
      }
    },
    markAsRunning(selectorName, args) {
      if (!cache[selectorName]) {
        cache[selectorName] = new EquivalentKeyMap$1();
      }
      cache[selectorName].set(trimUndefinedValues(args), true);
    }
  };
}
function createBindingCache(bind) {
  const cache = new WeakMap();
  return {
    get(item, itemName) {
      let boundItem = cache.get(item);
      if (!boundItem) {
        boundItem = bind(item, itemName);
        cache.set(item, boundItem);
      }
      return boundItem;
    }
  };
}

/**
 * Creates a data store descriptor for the provided Redux store configuration containing
 * properties describing reducer, actions, selectors, controls and resolvers.
 *
 * @example
 * ```js
 * import { createReduxStore } from '@wordpress/data';
 *
 * const store = createReduxStore( 'demo', {
 *     reducer: ( state = 'OK' ) => state,
 *     selectors: {
 *         getValue: ( state ) => state,
 *     },
 * } );
 * ```
 *
 * @template State
 * @template {Record<string,import('../types').ActionCreator>} Actions
 * @template Selectors
 * @param {string}                                    key     Unique namespace identifier.
 * @param {ReduxStoreConfig<State,Actions,Selectors>} options Registered store options, with properties
 *                                                            describing reducer, actions, selectors,
 *                                                            and resolvers.
 *
 * @return   {StoreDescriptor<ReduxStoreConfig<State,Actions,Selectors>>} Store Object.
 */
function createReduxStore(key, options) {
  const privateActions = {};
  const privateSelectors = {};
  const privateRegistrationFunctions = {
    privateActions,
    registerPrivateActions: actions => {
      Object.assign(privateActions, actions);
    },
    privateSelectors,
    registerPrivateSelectors: selectors => {
      Object.assign(privateSelectors, selectors);
    }
  };
  const storeDescriptor = {
    name: key,
    instantiate: registry => {
      /**
       * Stores listener functions registered with `subscribe()`.
       *
       * When functions register to listen to store changes with
       * `subscribe()` they get added here. Although Redux offers
       * its own `subscribe()` function directly, by wrapping the
       * subscription in this store instance it's possible to
       * optimize checking if the state has changed before calling
       * each listener.
       *
       * @type {Set<ListenerFunction>}
       */
      const listeners = new Set();
      const reducer = options.reducer;
      const thunkArgs = {
        registry,
        get dispatch() {
          return thunkActions;
        },
        get select() {
          return thunkSelectors;
        },
        get resolveSelect() {
          return getResolveSelectors();
        }
      };
      const store = instantiateReduxStore(key, options, registry, thunkArgs);
      // Expose the private registration functions on the store
      // so they can be copied to a sub registry in registry.js.
      lock(store, privateRegistrationFunctions);
      const resolversCache = createResolversCache();
      function bindAction(action) {
        return (...args) => Promise.resolve(store.dispatch(action(...args)));
      }
      const actions = {
        ...mapValues(metadataActions, bindAction),
        ...mapValues(options.actions, bindAction)
      };
      const boundPrivateActions = createBindingCache(bindAction);
      const allActions = new Proxy(() => {}, {
        get: (target, prop) => {
          const privateAction = privateActions[prop];
          return privateAction ? boundPrivateActions.get(privateAction, prop) : actions[prop];
        }
      });
      const thunkActions = new Proxy(allActions, {
        apply: (target, thisArg, [action]) => store.dispatch(action)
      });
      lock(actions, allActions);
      const resolvers = options.resolvers ? mapResolvers(options.resolvers) : {};
      function bindSelector(selector, selectorName) {
        if (selector.isRegistrySelector) {
          selector.registry = registry;
        }
        const boundSelector = (...args) => {
          args = normalize(selector, args);
          const state = store.__unstableOriginalGetState();
          // Before calling the selector, switch to the correct
          // registry.
          if (selector.isRegistrySelector) {
            selector.registry = registry;
          }
          return selector(state.root, ...args);
        };

        // Expose normalization method on the bound selector
        // in order that it can be called when fullfilling
        // the resolver.
        boundSelector.__unstableNormalizeArgs = selector.__unstableNormalizeArgs;
        const resolver = resolvers[selectorName];
        if (!resolver) {
          boundSelector.hasResolver = false;
          return boundSelector;
        }
        return mapSelectorWithResolver(boundSelector, selectorName, resolver, store, resolversCache);
      }
      function bindMetadataSelector(metaDataSelector) {
        const boundSelector = (...args) => {
          const state = store.__unstableOriginalGetState();
          const originalSelectorName = args && args[0];
          const originalSelectorArgs = args && args[1];
          const targetSelector = options?.selectors?.[originalSelectorName];

          // Normalize the arguments passed to the target selector.
          if (originalSelectorName && targetSelector) {
            args[1] = normalize(targetSelector, originalSelectorArgs);
          }
          return metaDataSelector(state.metadata, ...args);
        };
        boundSelector.hasResolver = false;
        return boundSelector;
      }
      const selectors = {
        ...mapValues(metadataSelectors, bindMetadataSelector),
        ...mapValues(options.selectors, bindSelector)
      };
      const boundPrivateSelectors = createBindingCache(bindSelector);

      // Pre-bind the private selectors that have been registered by the time of
      // instantiation, so that registry selectors are bound to the registry.
      for (const [selectorName, selector] of Object.entries(privateSelectors)) {
        boundPrivateSelectors.get(selector, selectorName);
      }
      const allSelectors = new Proxy(() => {}, {
        get: (target, prop) => {
          const privateSelector = privateSelectors[prop];
          return privateSelector ? boundPrivateSelectors.get(privateSelector, prop) : selectors[prop];
        }
      });
      const thunkSelectors = new Proxy(allSelectors, {
        apply: (target, thisArg, [selector]) => selector(store.__unstableOriginalGetState())
      });
      lock(selectors, allSelectors);
      const resolveSelectors = mapResolveSelectors(selectors, store);
      const suspendSelectors = mapSuspendSelectors(selectors, store);
      const getSelectors = () => selectors;
      const getActions = () => actions;
      const getResolveSelectors = () => resolveSelectors;
      const getSuspendSelectors = () => suspendSelectors;

      // We have some modules monkey-patching the store object
      // It's wrong to do so but until we refactor all of our effects to controls
      // We need to keep the same "store" instance here.
      store.__unstableOriginalGetState = store.getState;
      store.getState = () => store.__unstableOriginalGetState().root;

      // Customize subscribe behavior to call listeners only on effective change,
      // not on every dispatch.
      const subscribe = store && (listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      });
      let lastState = store.__unstableOriginalGetState();
      store.subscribe(() => {
        const state = store.__unstableOriginalGetState();
        const hasChanged = state !== lastState;
        lastState = state;
        if (hasChanged) {
          for (const listener of listeners) {
            listener();
          }
        }
      });

      // This can be simplified to just { subscribe, getSelectors, getActions }
      // Once we remove the use function.
      return {
        reducer,
        store,
        actions,
        selectors,
        resolvers,
        getSelectors,
        getResolveSelectors,
        getSuspendSelectors,
        getActions,
        subscribe
      };
    }
  };

  // Expose the private registration functions on the store
  // descriptor. That's a natural choice since that's where the
  // public actions and selectors are stored .
  lock(storeDescriptor, privateRegistrationFunctions);
  return storeDescriptor;
}

/**
 * Creates a redux store for a namespace.
 *
 * @param {string}       key       Unique namespace identifier.
 * @param {Object}       options   Registered store options, with properties
 *                                 describing reducer, actions, selectors,
 *                                 and resolvers.
 * @param {DataRegistry} registry  Registry reference.
 * @param {Object}       thunkArgs Argument object for the thunk middleware.
 * @return {Object} Newly created redux store.
 */
function instantiateReduxStore(key, options, registry, thunkArgs) {
  const controls = {
    ...options.controls,
    ...builtinControls
  };
  const normalizedControls = mapValues(controls, control => control.isRegistryControl ? control(registry) : control);
  const middlewares = [createResolversCacheMiddleware(registry, key), promiseMiddleware, createMiddleware(normalizedControls), createThunkMiddleware(thunkArgs)];
  const enhancers = [applyMiddleware(...middlewares)];
  if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
    enhancers.push(window.__REDUX_DEVTOOLS_EXTENSION__({
      name: key,
      instanceId: key,
      serialize: {
        replacer: devToolsReplacer
      }
    }));
  }
  const {
    reducer,
    initialState
  } = options;
  const enhancedReducer = combineReducers$1({
    metadata: isResolved,
    root: reducer
  });
  return createStore(enhancedReducer, {
    root: initialState
  }, compose(enhancers));
}

/**
 * Maps selectors to functions that return a resolution promise for them
 *
 * @param {Object} selectors Selectors to map.
 * @param {Object} store     The redux store the selectors select from.
 *
 * @return {Object} Selectors mapped to their resolution functions.
 */
function mapResolveSelectors(selectors, store) {
  const {
    getIsResolving,
    hasStartedResolution,
    hasFinishedResolution,
    hasResolutionFailed,
    isResolving,
    getCachedResolvers,
    getResolutionState,
    getResolutionError,
    hasResolvingSelectors,
    countSelectorsByStatus,
    ...storeSelectors
  } = selectors;
  return mapValues(storeSelectors, (selector, selectorName) => {
    // If the selector doesn't have a resolver, just convert the return value
    // (including exceptions) to a Promise, no additional extra behavior is needed.
    if (!selector.hasResolver) {
      return async (...args) => selector.apply(null, args);
    }
    return (...args) => {
      return new Promise((resolve, reject) => {
        const hasFinished = () => selectors.hasFinishedResolution(selectorName, args);
        const finalize = result => {
          const hasFailed = selectors.hasResolutionFailed(selectorName, args);
          if (hasFailed) {
            const error = selectors.getResolutionError(selectorName, args);
            reject(error);
          } else {
            resolve(result);
          }
        };
        const getResult = () => selector.apply(null, args);
        // Trigger the selector (to trigger the resolver)
        const result = getResult();
        if (hasFinished()) {
          return finalize(result);
        }
        const unsubscribe = store.subscribe(() => {
          if (hasFinished()) {
            unsubscribe();
            finalize(getResult());
          }
        });
      });
    };
  });
}

/**
 * Maps selectors to functions that throw a suspense promise if not yet resolved.
 *
 * @param {Object} selectors Selectors to map.
 * @param {Object} store     The redux store the selectors select from.
 *
 * @return {Object} Selectors mapped to their suspense functions.
 */
function mapSuspendSelectors(selectors, store) {
  return mapValues(selectors, (selector, selectorName) => {
    // Selector without a resolver doesn't have any extra suspense behavior.
    if (!selector.hasResolver) {
      return selector;
    }
    return (...args) => {
      const result = selector.apply(null, args);
      if (selectors.hasFinishedResolution(selectorName, args)) {
        if (selectors.hasResolutionFailed(selectorName, args)) {
          throw selectors.getResolutionError(selectorName, args);
        }
        return result;
      }
      throw new Promise(resolve => {
        const unsubscribe = store.subscribe(() => {
          if (selectors.hasFinishedResolution(selectorName, args)) {
            resolve();
            unsubscribe();
          }
        });
      });
    };
  });
}

/**
 * Convert resolvers to a normalized form, an object with `fulfill` method and
 * optional methods like `isFulfilled`.
 *
 * @param {Object} resolvers Resolver to convert
 */
function mapResolvers(resolvers) {
  return mapValues(resolvers, resolver => {
    if (resolver.fulfill) {
      return resolver;
    }
    return {
      ...resolver,
      // Copy the enumerable properties of the resolver function.
      fulfill: resolver // Add the fulfill method.
    };
  });
}

/**
 * Returns a selector with a matched resolver.
 * Resolvers are side effects invoked once per argument set of a given selector call,
 * used in ensuring that the data needs for the selector are satisfied.
 *
 * @param {Object} selector       The selector function to be bound.
 * @param {string} selectorName   The selector name.
 * @param {Object} resolver       Resolver to call.
 * @param {Object} store          The redux store to which the resolvers should be mapped.
 * @param {Object} resolversCache Resolvers Cache.
 */
function mapSelectorWithResolver(selector, selectorName, resolver, store, resolversCache) {
  function fulfillSelector(args) {
    const state = store.getState();
    if (resolversCache.isRunning(selectorName, args) || typeof resolver.isFulfilled === 'function' && resolver.isFulfilled(state, ...args)) {
      return;
    }
    const {
      metadata
    } = store.__unstableOriginalGetState();
    if (hasStartedResolution(metadata, selectorName, args)) {
      return;
    }
    resolversCache.markAsRunning(selectorName, args);
    setTimeout(async () => {
      resolversCache.clear(selectorName, args);
      store.dispatch(startResolution(selectorName, args));
      try {
        const action = resolver.fulfill(...args);
        if (action) {
          await store.dispatch(action);
        }
        store.dispatch(finishResolution(selectorName, args));
      } catch (error) {
        store.dispatch(failResolution(selectorName, args, error));
      }
    }, 0);
  }
  const selectorResolver = (...args) => {
    args = normalize(selector, args);
    fulfillSelector(args);
    return selector(...args);
  };
  selectorResolver.hasResolver = true;
  return selectorResolver;
}

/**
 * Applies selector's normalization function to the given arguments
 * if it exists.
 *
 * @param {Object} selector The selector potentially with a normalization method property.
 * @param {Array}  args     selector arguments to normalize.
 * @return {Array} Potentially normalized arguments.
 */
function normalize(selector, args) {
  if (selector.__unstableNormalizeArgs && typeof selector.__unstableNormalizeArgs === 'function' && args?.length) {
    return selector.__unstableNormalizeArgs(args);
  }
  return args;
}

const coreDataStore = {
  name: 'core/data',
  instantiate(registry) {
    const getCoreDataSelector = selectorName => (key, ...args) => {
      return registry.select(key)[selectorName](...args);
    };
    const getCoreDataAction = actionName => (key, ...args) => {
      return registry.dispatch(key)[actionName](...args);
    };
    return {
      getSelectors() {
        return Object.fromEntries(['getIsResolving', 'hasStartedResolution', 'hasFinishedResolution', 'isResolving', 'getCachedResolvers'].map(selectorName => [selectorName, getCoreDataSelector(selectorName)]));
      },
      getActions() {
        return Object.fromEntries(['startResolution', 'finishResolution', 'invalidateResolution', 'invalidateResolutionForStore', 'invalidateResolutionForStoreSelector'].map(actionName => [actionName, getCoreDataAction(actionName)]));
      },
      subscribe() {
        // There's no reasons to trigger any listener when we subscribe to this store
        // because there's no state stored in this store that need to retrigger selectors
        // if a change happens, the corresponding store where the tracking stated live
        // would have already triggered a "subscribe" call.
        return () => () => {};
      }
    };
  }
};

/**
 * Create an event emitter.
 *
 * @return {import("../types").DataEmitter} Emitter.
 */
function createEmitter() {
  let isPaused = false;
  let isPending = false;
  const listeners = new Set();
  const notifyListeners = () =>
  // We use Array.from to clone the listeners Set
  // This ensures that we don't run a listener
  // that was added as a response to another listener.
  Array.from(listeners).forEach(listener => listener());
  return {
    get isPaused() {
      return isPaused;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    pause() {
      isPaused = true;
    },
    resume() {
      isPaused = false;
      if (isPending) {
        isPending = false;
        notifyListeners();
      }
    },
    emit() {
      if (isPaused) {
        isPending = true;
        return;
      }
      notifyListeners();
    }
  };
}

/**
 * WordPress dependencies
 */

/** @typedef {import('./types').StoreDescriptor} StoreDescriptor */

/**
 * @typedef {Object} WPDataRegistry An isolated orchestrator of store registrations.
 *
 * @property {Function} registerGenericStore Given a namespace key and settings
 *                                           object, registers a new generic
 *                                           store.
 * @property {Function} registerStore        Given a namespace key and settings
 *                                           object, registers a new namespace
 *                                           store.
 * @property {Function} subscribe            Given a function callback, invokes
 *                                           the callback on any change to state
 *                                           within any registered store.
 * @property {Function} select               Given a namespace key, returns an
 *                                           object of the  store's registered
 *                                           selectors.
 * @property {Function} dispatch             Given a namespace key, returns an
 *                                           object of the store's registered
 *                                           action dispatchers.
 */

/**
 * @typedef {Object} WPDataPlugin An object of registry function overrides.
 *
 * @property {Function} registerStore registers store.
 */

function getStoreName(storeNameOrDescriptor) {
  return typeof storeNameOrDescriptor === 'string' ? storeNameOrDescriptor : storeNameOrDescriptor.name;
}
/**
 * Creates a new store registry, given an optional object of initial store
 * configurations.
 *
 * @param {Object}  storeConfigs Initial store configurations.
 * @param {Object?} parent       Parent registry.
 *
 * @return {WPDataRegistry} Data registry.
 */
function createRegistry(storeConfigs = {}, parent = null) {
  const stores = {};
  const emitter = createEmitter();
  let listeningStores = null;

  /**
   * Global listener called for each store's update.
   */
  function globalListener() {
    emitter.emit();
  }

  /**
   * Subscribe to changes to any data, either in all stores in registry, or
   * in one specific store.
   *
   * @param {Function}                listener              Listener function.
   * @param {string|StoreDescriptor?} storeNameOrDescriptor Optional store name.
   *
   * @return {Function} Unsubscribe function.
   */
  const subscribe = (listener, storeNameOrDescriptor) => {
    // subscribe to all stores
    if (!storeNameOrDescriptor) {
      return emitter.subscribe(listener);
    }

    // subscribe to one store
    const storeName = getStoreName(storeNameOrDescriptor);
    const store = stores[storeName];
    if (store) {
      return store.subscribe(listener);
    }

    // Trying to access a store that hasn't been registered,
    // this is a pattern rarely used but seen in some places.
    // We fallback to global `subscribe` here for backward-compatibility for now.
    // See https://github.com/WordPress/gutenberg/pull/27466 for more info.
    if (!parent) {
      return emitter.subscribe(listener);
    }
    return parent.subscribe(listener, storeNameOrDescriptor);
  };

  /**
   * Calls a selector given the current state and extra arguments.
   *
   * @param {string|StoreDescriptor} storeNameOrDescriptor Unique namespace identifier for the store
   *                                                       or the store descriptor.
   *
   * @return {*} The selector's returned value.
   */
  function select(storeNameOrDescriptor) {
    const storeName = getStoreName(storeNameOrDescriptor);
    listeningStores?.add(storeName);
    const store = stores[storeName];
    if (store) {
      return store.getSelectors();
    }
    return parent?.select(storeName);
  }
  function __unstableMarkListeningStores(callback, ref) {
    listeningStores = new Set();
    try {
      return callback.call(this);
    } finally {
      ref.current = Array.from(listeningStores);
      listeningStores = null;
    }
  }

  /**
   * Given a store descriptor, returns an object containing the store's selectors pre-bound to
   * state so that you only need to supply additional arguments, and modified so that they return
   * promises that resolve to their eventual values, after any resolvers have ran.
   *
   * @param {StoreDescriptor|string} storeNameOrDescriptor The store descriptor. The legacy calling
   *                                                       convention of passing the store name is
   *                                                       also supported.
   *
   * @return {Object} Each key of the object matches the name of a selector.
   */
  function resolveSelect(storeNameOrDescriptor) {
    const storeName = getStoreName(storeNameOrDescriptor);
    listeningStores?.add(storeName);
    const store = stores[storeName];
    if (store) {
      return store.getResolveSelectors();
    }
    return parent && parent.resolveSelect(storeName);
  }

  /**
   * Given a store descriptor, returns an object containing the store's selectors pre-bound to
   * state so that you only need to supply additional arguments, and modified so that they throw
   * promises in case the selector is not resolved yet.
   *
   * @param {StoreDescriptor|string} storeNameOrDescriptor The store descriptor. The legacy calling
   *                                                       convention of passing the store name is
   *                                                       also supported.
   *
   * @return {Object} Object containing the store's suspense-wrapped selectors.
   */
  function suspendSelect(storeNameOrDescriptor) {
    const storeName = getStoreName(storeNameOrDescriptor);
    listeningStores?.add(storeName);
    const store = stores[storeName];
    if (store) {
      return store.getSuspendSelectors();
    }
    return parent && parent.suspendSelect(storeName);
  }

  /**
   * Returns the available actions for a part of the state.
   *
   * @param {string|StoreDescriptor} storeNameOrDescriptor Unique namespace identifier for the store
   *                                                       or the store descriptor.
   *
   * @return {*} The action's returned value.
   */
  function dispatch(storeNameOrDescriptor) {
    const storeName = getStoreName(storeNameOrDescriptor);
    const store = stores[storeName];
    if (store) {
      return store.getActions();
    }
    return parent && parent.dispatch(storeName);
  }

  //
  // Deprecated
  // TODO: Remove this after `use()` is removed.
  function withPlugins(attributes) {
    return Object.fromEntries(Object.entries(attributes).map(([key, attribute]) => {
      if (typeof attribute !== 'function') {
        return [key, attribute];
      }
      return [key, function () {
        return registry[key].apply(null, arguments);
      }];
    }));
  }

  /**
   * Registers a store instance.
   *
   * @param {string}   name        Store registry name.
   * @param {Function} createStore Function that creates a store object (getSelectors, getActions, subscribe).
   */
  function registerStoreInstance(name, createStore) {
    if (stores[name]) {
      // eslint-disable-next-line no-console
      console.error('Store "' + name + '" is already registered.');
      return stores[name];
    }
    const store = createStore();
    if (typeof store.getSelectors !== 'function') {
      throw new TypeError('store.getSelectors must be a function');
    }
    if (typeof store.getActions !== 'function') {
      throw new TypeError('store.getActions must be a function');
    }
    if (typeof store.subscribe !== 'function') {
      throw new TypeError('store.subscribe must be a function');
    }
    // The emitter is used to keep track of active listeners when the registry
    // get paused, that way, when resumed we should be able to call all these
    // pending listeners.
    store.emitter = createEmitter();
    const currentSubscribe = store.subscribe;
    store.subscribe = listener => {
      const unsubscribeFromEmitter = store.emitter.subscribe(listener);
      const unsubscribeFromStore = currentSubscribe(() => {
        if (store.emitter.isPaused) {
          store.emitter.emit();
          return;
        }
        listener();
      });
      return () => {
        unsubscribeFromStore?.();
        unsubscribeFromEmitter?.();
      };
    };
    stores[name] = store;
    store.subscribe(globalListener);

    // Copy private actions and selectors from the parent store.
    if (parent) {
      try {
        unlock(store.store).registerPrivateActions(unlock(parent).privateActionsOf(name));
        unlock(store.store).registerPrivateSelectors(unlock(parent).privateSelectorsOf(name));
      } catch (e) {
        // unlock() throws if store.store was not locked.
        // The error indicates there's nothing to do here so let's
        // ignore it.
      }
    }
    return store;
  }

  /**
   * Registers a new store given a store descriptor.
   *
   * @param {StoreDescriptor} store Store descriptor.
   */
  function register(store) {
    registerStoreInstance(store.name, () => store.instantiate(registry));
  }
  function registerGenericStore(name, store) {
    deprecated('wp.data.registerGenericStore', {
      since: '5.9',
      alternative: 'wp.data.register( storeDescriptor )'
    });
    registerStoreInstance(name, () => store);
  }

  /**
   * Registers a standard `@wordpress/data` store.
   *
   * @param {string} storeName Unique namespace identifier.
   * @param {Object} options   Store description (reducer, actions, selectors, resolvers).
   *
   * @return {Object} Registered store object.
   */
  function registerStore(storeName, options) {
    if (!options.reducer) {
      throw new TypeError('Must specify store reducer');
    }
    const store = registerStoreInstance(storeName, () => createReduxStore(storeName, options).instantiate(registry));
    return store.store;
  }
  function batch(callback) {
    // If we're already batching, just call the callback.
    if (emitter.isPaused) {
      callback();
      return;
    }
    emitter.pause();
    Object.values(stores).forEach(store => store.emitter.pause());
    try {
      callback();
    } finally {
      emitter.resume();
      Object.values(stores).forEach(store => store.emitter.resume());
    }
  }
  let registry = {
    batch,
    stores,
    namespaces: stores,
    // TODO: Deprecate/remove this.
    subscribe,
    select,
    resolveSelect,
    suspendSelect,
    dispatch,
    use,
    register,
    registerGenericStore,
    registerStore,
    __unstableMarkListeningStores
  };

  //
  // TODO:
  // This function will be deprecated as soon as it is no longer internally referenced.
  function use(plugin, options) {
    if (!plugin) {
      return;
    }
    registry = {
      ...registry,
      ...plugin(registry, options)
    };
    return registry;
  }
  registry.register(coreDataStore);
  for (const [name, config] of Object.entries(storeConfigs)) {
    registry.register(createReduxStore(name, config));
  }
  if (parent) {
    parent.subscribe(globalListener);
  }
  const registryWithPlugins = withPlugins(registry);
  lock(registryWithPlugins, {
    privateActionsOf: name => {
      try {
        return unlock(stores[name].store).privateActions;
      } catch (e) {
        // unlock() throws an error the store was not locked – this means
        // there no private actions are available
        return {};
      }
    },
    privateSelectorsOf: name => {
      try {
        return unlock(stores[name].store).privateSelectors;
      } catch (e) {
        return {};
      }
    }
  });
  return registryWithPlugins;
}

/**
 * Internal dependencies
 */
var defaultRegistry = createRegistry();

/**
 * Internal dependencies
 */


/**
 * Given a store descriptor, returns an object of the store's action creators.
 * Calling an action creator will cause it to be dispatched, updating the state value accordingly.
 *
 * Note: Action creators returned by the dispatch will return a promise when
 * they are called.
 *
 * @param storeNameOrDescriptor The store descriptor. The legacy calling convention of passing
 *                              the store name is also supported.
 *
 * @example
 * ```js
 * import { dispatch } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * dispatch( myCustomStore ).setPrice( 'hammer', 9.75 );
 * ```
 * @return Object containing the action creators.
 */
function dispatch(storeNameOrDescriptor) {
  return defaultRegistry.dispatch(storeNameOrDescriptor);
}

/**
 * Internal dependencies
 */


/**
 * Given a store descriptor, returns an object of the store's selectors.
 * The selector functions are been pre-bound to pass the current state automatically.
 * As a consumer, you need only pass arguments of the selector, if applicable.
 *
 *
 * @param storeNameOrDescriptor The store descriptor. The legacy calling convention
 *                              of passing the store name is also supported.
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * select( myCustomStore ).getPrice( 'hammer' );
 * ```
 *
 * @return Object containing the store's selectors.
 */
function select(storeNameOrDescriptor) {
  return defaultRegistry.select(storeNameOrDescriptor);
}

/**
 * Internal dependencies
 */

/**
 * The combineReducers helper function turns an object whose values are different
 * reducing functions into a single reducing function you can pass to registerReducer.
 *
 * @type  {import('./types').combineReducers}
 * @param {Object} reducers An object whose values correspond to different reducing
 *                          functions that need to be combined into one.
 *
 * @example
 * ```js
 * import { combineReducers, createReduxStore, register } from '@wordpress/data';
 *
 * const prices = ( state = {}, action ) => {
 * 	return action.type === 'SET_PRICE' ?
 * 		{
 * 			...state,
 * 			[ action.item ]: action.price,
 * 		} :
 * 		state;
 * };
 *
 * const discountPercent = ( state = 0, action ) => {
 * 	return action.type === 'START_SALE' ?
 * 		action.discountPercent :
 * 		state;
 * };
 *
 * const store = createReduxStore( 'my-shop', {
 * 	reducer: combineReducers( {
 * 		prices,
 * 		discountPercent,
 * 	} ),
 * } );
 * register( store );
 * ```
 *
 * @return {Function} A reducer that invokes every reducer inside the reducers
 *                    object, and constructs a state object with the same shape.
 */
const combineReducers = combineReducers$1;

/**
 * Given a store descriptor, returns an object containing the store's selectors pre-bound to state
 * so that you only need to supply additional arguments, and modified so that they return promises
 * that resolve to their eventual values, after any resolvers have ran.
 *
 * @param {StoreDescriptor|string} storeNameOrDescriptor The store descriptor. The legacy calling
 *                                                       convention of passing the store name is
 *                                                       also supported.
 *
 * @example
 * ```js
 * import { resolveSelect } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * resolveSelect( myCustomStore ).getPrice( 'hammer' ).then(console.log)
 * ```
 *
 * @return {Object} Object containing the store's promise-wrapped selectors.
 */
defaultRegistry.resolveSelect;

/**
 * Given a store descriptor, returns an object containing the store's selectors pre-bound to state
 * so that you only need to supply additional arguments, and modified so that they throw promises
 * in case the selector is not resolved yet.
 *
 * @param {StoreDescriptor|string} storeNameOrDescriptor The store descriptor. The legacy calling
 *                                                       convention of passing the store name is
 *                                                       also supported.
 *
 * @return {Object} Object containing the store's suspense-wrapped selectors.
 */
defaultRegistry.suspendSelect;

/**
 * Given a listener function, the function will be called any time the state value
 * of one of the registered stores has changed. If you specify the optional
 * `storeNameOrDescriptor` parameter, the listener function will be called only
 * on updates on that one specific registered store.
 *
 * This function returns an `unsubscribe` function used to stop the subscription.
 *
 * @param {Function}                listener              Callback function.
 * @param {string|StoreDescriptor?} storeNameOrDescriptor Optional store name.
 *
 * @example
 * ```js
 * import { subscribe } from '@wordpress/data';
 *
 * const unsubscribe = subscribe( () => {
 * 	// You could use this opportunity to test whether the derived result of a
 * 	// selector has subsequently changed as the result of a state update.
 * } );
 *
 * // Later, if necessary...
 * unsubscribe();
 * ```
 */
defaultRegistry.subscribe;

/**
 * Registers a generic store instance.
 *
 * @deprecated Use `register( storeDescriptor )` instead.
 *
 * @param {string} name  Store registry name.
 * @param {Object} store Store instance (`{ getSelectors, getActions, subscribe }`).
 */
defaultRegistry.registerGenericStore;

/**
 * Registers a standard `@wordpress/data` store.
 *
 * @deprecated Use `register` instead.
 *
 * @param {string} storeName Unique namespace identifier for the store.
 * @param {Object} options   Store description (reducer, actions, selectors, resolvers).
 *
 * @return {Object} Registered store object.
 */
defaultRegistry.registerStore;

/**
 * Extends a registry to inherit functionality provided by a given plugin. A
 * plugin is an object with properties aligning to that of a registry, merged
 * to extend the default registry behavior.
 *
 * @param {Object} plugin Plugin object.
 */
defaultRegistry.use;

/**
 * Registers a standard `@wordpress/data` store descriptor.
 *
 * @example
 * ```js
 * import { createReduxStore, register } from '@wordpress/data';
 *
 * const store = createReduxStore( 'demo', {
 *     reducer: ( state = 'OK' ) => state,
 *     selectors: {
 *         getValue: ( state ) => state,
 *     },
 * } );
 * register( store );
 * ```
 *
 * @param {StoreDescriptor} store Store descriptor.
 */
const register = defaultRegistry.register;

// Utility functions for namespacing
const createNamespacedSelectors = (namespace, selectors) => {
  const namespacedSelectors = {};
  for (const key in selectors) {
    if (Object.prototype.hasOwnProperty.call(selectors, key)) {
      namespacedSelectors[key] = (state, ...args) => selectors[key](state[namespace], ...args);
    }
  }
  return namespacedSelectors;
};

// this function creates namespaced actions by ensuring that thunks are called with the correct namespace
const createNamespacedActions = (namespace, actions) => {
  const namespacedActions = {};
  for (const key in actions) {
    if (Object.prototype.hasOwnProperty.call(actions, key)) {
      namespacedActions[key] = (...args) => {
        const action = actions[key](...args);
        if (typeof action === 'function') {
          return ({
            select,
            ...thunkArgs
          }) => {
            return action({
              select: callback => {
                return select(state => {
                  return callback({
                    root: state.root[namespace],
                    metadata: state.metadata
                  });
                });
              },
              ...thunkArgs
            });
          };
        }
        return action;
      };
    }
  }
  return namespacedActions;
};

const initialState$8 = {
  agents: [],
  activeAgentId: null,
  started: false
};
const actions$8 = {
  setAgentStarted: started => {
    return {
      type: 'SET_AGENT_STARTED',
      started
    };
  },
  setActiveAgent: agentId => {
    return {
      type: 'SET_ACTIVE_AGENT',
      agentId
    };
  },
  registerAgent: agent => {
    return {
      type: 'REGISTER_AGENT',
      agent
    };
  }
};
const reducer$8 = (state = initialState$8, action) => {
  switch (action.type) {
    case 'REGISTER_AGENT':
      const {
        agent
      } = action;
      const existingAgentIndex = state.agents.findIndex(a => a.id === agent.id);
      if (existingAgentIndex !== -1) {
        const updatedAgents = [...state.agents];
        updatedAgents[existingAgentIndex] = agent;
        return {
          ...state,
          agents: updatedAgents
        };
      }
      return {
        ...state,
        agents: [...state.agents, agent]
      };
    case 'SET_ACTIVE_AGENT':
      return {
        ...state,
        activeAgentId: action.agentId
      };
    case 'SET_AGENT_STARTED':
      return {
        ...state,
        started: action.started
      };
    default:
      return state;
  }
};
const selectors$8 = {
  getActiveAgentId: state => state.activeAgentId,
  getAgents: state => state.agents,
  isAgentStarted: state => state.started,
  getActiveAgent: createSelector(state => state.agents.find(agent => agent.id === state.activeAgentId), state => [state.agents, state.activeAgentId]),
  getActiveAgentName: createSelector(state => selectors$8.getActiveAgent(state)?.name, state => [state.agents, state.activeAgentId])
};

const DEFAULT_GOAL = "Find out the user's goal";
const initialState$7 = {
  goal: DEFAULT_GOAL
};
const actions$7 = {
  setGoal: goal => {
    return {
      type: 'SET_AGENT_GOAL',
      goal
    };
  }
};
const reducer$7 = (state = initialState$7, action) => {
  switch (action.type) {
    case 'SET_AGENT_GOAL':
      return {
        ...state,
        goal: action.goal
      };
    default:
      return state;
  }
};
const selectors$7 = {
  getGoal: state => state.goal
};

const initialState$6 = {
  thought: null
};
const actions$6 = {
  setThought: thought => {
    return {
      type: 'SET_AGENT_THOUGHT',
      thought
    };
  }
};
const reducer$6 = (state = initialState$6, action) => {
  switch (action.type) {
    case 'SET_AGENT_THOUGHT':
      return {
        ...state,
        thought: action.thought
      };
    default:
      return state;
  }
};
const selectors$6 = {
  getThought: state => state.thought
};

const initialState$5 = {
  toolkits: [],
  contexts: {},
  callbacks: {},
  tools: {}
};
const actions$5 = {
  registerToolkit: toolkit => {
    return {
      type: 'REGISTER_TOOLKIT',
      toolkit
    };
  },
  setCallbacks: (name, callbacks) => {
    return {
      type: 'REGISTER_TOOLKIT_CALLBACKS',
      name,
      callbacks
    };
  },
  setContext: (name, context) => {
    return {
      type: 'REGISTER_TOOLKIT_CONTEXT',
      name,
      context
    };
  }
};
const registerToolkit = (state, action) => {
  const {
    toolkit
  } = action;

  // if the toolkit includes callbacks, register the callbacks
  if (toolkit.callbacks) {
    state = setCallbacks(state, {
      name: toolkit.name,
      callbacks: toolkit.callbacks
    });
  }

  // if the toolkit includes context, register the context
  if (toolkit.context) {
    state = setContext(state, {
      name: toolkit.name,
      context: toolkit.context
    });
  }

  // if the toolkit includes tools, register the tools
  if (toolkit.tools) {
    state = setTools(state, {
      name: toolkit.name,
      tools: toolkit.tools
    });
  }

  // if there's an existing toolkit with the same name, replace it
  const existingToolkitIndex = state.toolkits.findIndex(t => t.name === toolkit.name);
  if (existingToolkitIndex !== -1) {
    return {
      ...state,
      toolkits: [...state.toolkits.slice(0, existingToolkitIndex), toolkit, ...state.toolkits.slice(existingToolkitIndex + 1)]
    };
  }

  // otherwise, add the new toolkit
  return {
    ...state,
    toolkits: [...state.toolkits, toolkit]
  };
};
const setCallbacks = (state, action) => {
  const {
    name,
    callbacks
  } = action;
  return {
    ...state,
    callbacks: {
      ...state.callbacks,
      [name]: callbacks
    }
  };
};
const setContext = (state, action) => {
  const {
    name,
    context
  } = action;
  return {
    ...state,
    contexts: {
      ...state.contexts,
      [name]: context
    }
  };
};
const setTools = (state, action) => {
  const {
    name,
    tools
  } = action;
  return {
    ...state,
    tools: {
      ...state.tools,
      [name]: tools
    }
  };
};
const reducer$5 = (state = initialState$5, action) => {
  switch (action.type) {
    case 'REGISTER_TOOLKIT':
      return registerToolkit(state, action);
    case 'REGISTER_TOOLKIT_CALLBACKS':
      return setCallbacks(state, action);
    case 'REGISTER_TOOLKIT_CONTEXT':
      return setContext(state, action);
    case 'REGISTER_TOOLKIT_TOOLS':
      return setTools(state, action);
    default:
      return state;
  }
};
const selectors$5 = {
  getToolkits: state => {
    return state.toolkits;
  },
  getToolkit: (state, name) => {
    return state.toolkits[name];
  },
  getContexts: state => {
    return state.contexts;
  },
  getCallbacks: state => {
    return state.callbacks;
  },
  getTools: state => {
    return state.tools;
  }
};

// From https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
// ignore no-bitwise error

/* eslint-disable no-bitwise */
function uuidv4() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}
/* eslint-enable no-bitwise */

// TODO: extract all this to a JSON configuration file
const AssistantModelService = {
  WPCOM_OPENAI: 'wpcom-openai',
  // the wpcom OpenAI proxy
  WPCOM: 'wpcom',
  // WPCOM native
  OPENAI: 'openai',
  getAvailable: () => {
    const services = [AssistantModelService.WPCOM_OPENAI, AssistantModelService.WPCOM, AssistantModelService.OPENAI];
    return services;
  },
  getDefault: () => {
    return AssistantModelService.OPENAI;
  },
  getDefaultApiKey: service => {
    if (service === AssistantModelService.OPENAI && typeof process !== 'undefined') {
      return process.env.OPENAI_API_KEY;
    }
    return null;
  }
};
const AssistantModelType = {
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  isMultimodal: model => model === AssistantModelType.GPT_4O,
  supportsToolMessages: model => [AssistantModelType.GPT_4O, AssistantModelType.GPT_4_TURBO].includes(model),
  getAvailable: ( /* service */
  ) => {
    return [AssistantModelType.GPT_4O_MINI, AssistantModelType.GPT_4_TURBO, AssistantModelType.GPT_4O];
  },
  getDefault( /* service = null */
  ) {
    return AssistantModelType.GPT_4O;
  }
};
class AssistantModel {
  constructor({
    apiKey,
    assistantId,
    openAiOrganization,
    feature,
    sessionId
  }) {
    this.apiKey = apiKey;
    this.assistantId = assistantId;
    this.openAiOrganization = openAiOrganization;
    this.feature = feature;
    this.sessionId = sessionId;
  }
  getApiKey() {
    return this.apiKey;
  }

  /**
   * Create a thread
   * see: https://platform.openai.com/docs/api-reference/threads/createThread
   */
  async createThread() {
    const params = {};
    const headers = this.getHeaders();
    const createThreadRequest = await fetch(`${this.getServiceUrl()}/threads`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    return await this.getResponse(createThreadRequest, 'thread');
  }

  /**
   * Delete a thread
   * see: https://platform.openai.com/docs/api-reference/threads/deleteThread
   * @param {string} threadId
   * @return {Promise<Object>} The response object
   */
  async deleteThread(threadId) {
    const headers = this.getHeaders();
    const deleteThreadRequest = await fetch(`${this.getServiceUrl()}/threads/${threadId}`, {
      method: 'DELETE',
      headers
    });
    return await this.getResponse(deleteThreadRequest);
  }

  /**
   * This is not currently used anywhere but kept here for reference.
   *
   * @param {*}      request
   * @param {string} request.name
   * @param {string} request.description
   * @param {string} request.instructions
   * @param {Array}  request.tools
   * @param {Object} request.tool_resources
   * @param {Object} request.metadata
   * @param {Object} request.temperature
   * @param {Object} request.response_format
   * @return {Promise<Object>} The response object
   */
  async createAssistant(request) {
    const headers = this.getHeaders(request);
    const createAssistantRequest = await fetch(`${this.getServiceUrl()}/assistants`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });
    return await this.getResponse(createAssistantRequest, 'assistant');
  }

  /**
   *
   * @param {*}      request
   * @param {string} request.threadId
   * @param {string} request.assistantId
   * @param {string} request.model
   * @param {string} request.instructions
   * @param {string} request.additionalInstructions
   * @param {Array}  request.additionalMessages
   * @param {Array}  request.tools
   * @param {Array}  request.metadata
   * @param {number} request.temperature
   * @param {number} request.maxPromptTokens
   * @param {number} request.maxCompletionTokens
   * @param {Object} request.truncationStrategy
   * @param {Object} request.responseFormat
   * @return {Promise<Object>} The response object
   */
  async createThreadRun(request) {
    var _request$model, _request$temperature, _request$maxCompletio;
    const params = {
      assistant_id: request.assistantId,
      instructions: request.instructions,
      additional_instructions: request.additionalInstructions,
      additional_messages: request.additionalMessages,
      tools: request.tools,
      model: (_request$model = request.model) !== null && _request$model !== void 0 ? _request$model : this.getDefaultModel(),
      temperature: (_request$temperature = request.temperature) !== null && _request$temperature !== void 0 ? _request$temperature : this.getDefaultTemperature(),
      max_completion_tokens: (_request$maxCompletio = request.maxCompletionTokens) !== null && _request$maxCompletio !== void 0 ? _request$maxCompletio : this.getDefaultMaxTokens(),
      truncation_strategy: request.truncationStrategy,
      response_format: request.responseFormat
    };
    // console.warn( 'createThreadRun', params );
    const headers = this.getHeaders();
    const createRunRequest = await fetch(`${this.getServiceUrl()}/threads/${request.threadId}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    return await this.getResponse(createRunRequest, 'thread.run');
  }
  async createThreadMessage(threadId, message) {
    const params = message;
    const headers = this.getHeaders();
    const createMessageRequest = await fetch(`${this.getServiceUrl()}/threads/${threadId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    return await this.getResponse(createMessageRequest, 'thread.message');
  }
  async getThreadRuns(threadId) {
    const headers = this.getHeaders();
    const getRunsRequest = await fetch(`${this.getServiceUrl()}/threads/${threadId}/runs`, {
      method: 'GET',
      headers
    });
    return await this.getResponse(getRunsRequest, 'list');
  }
  async getThreadRun(threadId, runId) {
    const headers = this.getHeaders();
    const getRunRequest = await fetch(`${this.getServiceUrl()}/threads/${threadId}/runs/${runId}`, {
      method: 'GET',
      headers
    });
    return await this.getResponse(getRunRequest, 'thread.run');
  }
  async getThreadMessages(threadId) {
    const headers = this.getHeaders();
    const getMessagesRequest = await fetch(`${this.getServiceUrl()}/threads/${threadId}/messages`, {
      method: 'GET',
      headers
    });
    return await this.getResponse(getMessagesRequest, 'list');
  }
  async submitToolOutputs(threadId, runId, toolOutputs) {
    const headers = this.getHeaders();
    const submitToolOutputsRequest = await fetch(`${this.getServiceUrl()}/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool_outputs: toolOutputs
      })
    });
    return await this.getResponse(submitToolOutputsRequest, 'thread.run');
  }
  async getResponse(request, expectedObject = null) {
    if (request.status === 400) {
      const response = await request.json();
      if (response.error) {
        throw new Error(`${response.error.type}: ${response.error.message}`);
      }
      throw new Error('Bad request');
    } else if (request.status === 401) {
      throw new Error('Unauthorized');
    } else if (request.status === 429) {
      throw new Error('Rate limit exceeded');
    } else if (request.status === 500) {
      const response = await request.json();
      throw new Error(`Internal server error: ${response}`);
    }
    const response = await request.json();
    if (response.code && !response.id) {
      var _response$message;
      throw new Error(`${response.code} ${(_response$message = response.message) !== null && _response$message !== void 0 ? _response$message : ''}`);
    }
    if (expectedObject && response.object !== expectedObject) {
      console.error(`Invalid response from server, not a ${expectedObject}`, response);
      throw new Error('Invalid response from server');
    }
    return response;
  }
  getHeaders() {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    };
    if (this.openAiOrganization) {
      headers['OpenAI-Organization'] = this.openAiOrganization;
    }
    return headers;
  }
  getDefaultMaxTokens() {
    return 4096;
  }
  getDefaultTemperature() {
    return 0.2;
  }
  getDefaultModel() {
    throw new Error('Not implemented');
  }
  getServiceUrl() {
    throw new Error('Not implemented');
  }
  static getInstance(service, apiKey, feature, sessionId, opts = {}) {
    switch (service) {
      case AssistantModelService.OPENAI:
        return new OpenAIAssistantModel({
          apiKey,
          feature,
          sessionId,
          ...opts
        });
      case AssistantModelService.WPCOM:
        return new WPCOMOpenAIAssistantModel({
          apiKey,
          feature,
          sessionId,
          ...opts
        });
      case AssistantModelService.WPCOM_OPENAI:
        return new WPCOMOpenAIProxyAssistantModel({
          apiKey,
          feature,
          sessionId,
          ...opts
        });
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }
}
class WPCOMOpenAIAssistantModel extends AssistantModel {
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
    return AssistantModelType.GPT_4O;
  }
  getServiceUrl() {
    return 'https://public-api.wordpress.com/wpcom/v2/big-sky/assistant';
  }
}
class WPCOMOpenAIProxyAssistantModel extends AssistantModel {
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
    return AssistantModelType.GPT_4O;
  }
  getServiceUrl() {
    return 'https://public-api.wordpress.com/wpcom/v2/openai-proxy/v1';
  }
}
class OpenAIAssistantModel extends AssistantModel {
  getDefaultModel() {
    return AssistantModelType.GPT_4O;
  }
  getServiceUrl() {
    return 'https://api.openai.com/v1';
  }
}

const THREAD_RUN_ACTIVE_STATUSES = ['queued', 'in_progress', 'requires_action', 'cancelling', 'completed'];

// export const THREAD_RUN_CURRENT_STATUSES = [
// 	'queued',
// 	'in_progress',
// 	'requires_action',
// 	'cancelling',
// 	'cancelled',
// ];

const isLocalStorageAvailable = typeof localStorage !== 'undefined';
const THREAD_RUN_COMPLETED_STATUSES = [
// 'cancelled',
// 'failed',
'completed'];
const initialState$4 = {
  // Global
  error: null,
  enabled: true,
  assistantEnabled: false,
  feature: 'unknown',
  // LLM related
  model: null,
  service: null,
  temperature: 0.1,
  apiKey: null,
  // Chat-API-related
  messages: [],
  tool_calls: [],
  isToolRunning: false,
  isFetchingChatCompletion: false,
  // Assistants-API-related
  assistantId: null,
  // The assistant ID
  defaultAssistantId: null,
  // The default assistant ID
  openAiOrganization: null,
  threadId: isLocalStorageAvailable ? localStorage.getItem('threadId') : null,
  // The assistant thread ID
  threadRuns: [],
  // The Assistant thread runs
  threadRunsUpdated: null,
  // The last time the thread runs were updated
  threadMessagesUpdated: null,
  // The last time Assistant messages were updated
  syncedThreadMessagesAt: null,
  // The last time synced messages were updated
  isCreatingThread: false,
  isDeletingThread: false,
  isCreatingThreadRun: false,
  isFetchingThreadRun: false,
  isFetchingThreadRuns: false,
  isCreatingThreadMessage: false,
  isFetchingThreadMessages: false,
  isSubmittingToolOutputs: false
};

/**
 * Converts an Chat Completions-formatted message to an Assistants-API-formatted message
 * @param {*} message The message to transform
 * @return {*} The transformed message
 */
const chatMessageToThreadMessage = message => {
  let filteredContent = message.content;

  // the message.content is sometimes an array like this:
  // [{ type: 'text', text: { annotations: [], value: 'foo' }}]
  // it needs to be transformed to this:
  // [{ type: 'text', text: 'foo' }]
  // TODO: do the same thing when syncing back to the assistant API
  if (Array.isArray(filteredContent)) {
    filteredContent = filteredContent.map(content => {
      if (content.type === 'text' && typeof content.text?.value === 'string') {
        return {
          ...content,
          text: content.text.value
        };
      }
      return content;
    });
    // sometimes it's just a string. These, too, need to be converted to the correct format. The API appears to be inconsistent in this regard.
  } else if (typeof filteredContent === 'string') {
    filteredContent = [{
      type: 'text',
      text: filteredContent
    }];
    // an assistant tool call message usually has no content, but this is invalid in the assistant API
  } else if (!filteredContent.length && message.tool_calls) {
    filteredContent = [{
      type: 'text',
      text: 'Invoked tool calls: ' + message.tool_calls.map(toolCall => `${toolCall.function.name}(${JSON.stringify(toolCall.function.arguments)})`).join(', ')
    }];
  }
  return {
    role: message.role,
    content: filteredContent
    // These aren't supported in Big Sky Agents yet
    // attachments: message.attachments,
    // metadata: message.metadata,
  };
};

/**
 * Ensure that a message is massaged into the correct internal format, even if it was created by the Assistant API
 *
 * @param {Object} message
 * @return {Object} The filtered message
 */
function filterChatMessage(message) {
  let filteredContent = message.content;
  let filteredToolCalls = message.tool_calls;
  if (typeof filteredContent === 'undefined' || filteredContent === null) {
    filteredContent = '';
  }
  // the message.content is sometimes an array like this:
  // [{ type: 'text', text: { annotations: [], value: 'foo' }}]
  // it needs to be transformed to this:
  // [{ type: 'text', text: 'foo' }]
  // TODO: do the same thing when syncing back to the assistant API
  if (Array.isArray(filteredContent)) {
    filteredContent = filteredContent.map(content => {
      if (content.type === 'text' && typeof content.text?.value === 'string') {
        return {
          ...content,
          text: content.text.value
        };
      }
      return content;
    });
  }
  if (message.role === 'assistant' && filteredToolCalls) {
    // replace with message.map rather than modifying in-place
    filteredToolCalls = message.tool_calls.map(toolCall => ({
      ...toolCall,
      function: {
        ...toolCall.function,
        arguments: typeof toolCall.function?.arguments === 'string' ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments
      }
    }));
  }
  return {
    ...message,
    tool_calls: filteredToolCalls,
    content: filteredContent
  };
}

/**
 * Reset the state of the chat.
 */
const reset = () => async ({
  dispatch,
  select
}) => {
  const {
    threadId,
    isAssistantAvailable
  } = select(state => ({
    threadId: state.root.threadId,
    isAssistantAvailable: selectors$4.isAssistantAvailable(state.root)
  }));
  dispatch(clearMessages());
  dispatch(clearError());
  if (threadId && isAssistantAvailable) {
    dispatch(deleteThread);
  }
};
const getChatModel = select => {
  const {
    service,
    apiKey,
    feature
  } = select(state => ({
    service: state.root.service,
    apiKey: state.root.apiKey,
    feature: state.root.feature
  }));
  if (!service || !apiKey) {
    throw new Error('Service and API key are required');
  }
  return ChatModel.getInstance(service, apiKey, feature);
};

/**
 * Make a Chat Completion call
 *
 * @param {Object}        request
 * @param {string}        request.model
 * @param {number}        request.temperature
 * @param {number}        request.maxTokens
 * @param {Array<Object>} request.messages
 * @param {Array<Object>} request.tools
 * @param {Object}        request.instructions
 * @param {Object}        request.additionalInstructions
 */
const runChatCompletion = request => async ({
  select,
  dispatch
}) => {
  const {
    model,
    temperature,
    messages,
    feature
  } = select(state => {
    return {
      model: state.root.model,
      temperature: state.root.temperature,
      messages: state.root.messages,
      feature: state.root.feature
    };
  });

  // dispatch an error if service or apiKey are missing
  if (!model || !temperature) {
    console.error('Model and temperature are required', {
      model,
      temperature,
      messages,
      feature
    });
    dispatch({
      type: 'CHAT_ERROR',
      error: 'Model and temperature are required'
    });
    return;
  }
  dispatch({
    type: 'CHAT_BEGIN_REQUEST'
  });
  try {
    const assistantMessage = await getChatModel(select).run({
      ...request,
      messages,
      model,
      temperature,
      feature
    });
    dispatch(actions$4.addMessage(assistantMessage));
    dispatch({
      type: 'CHAT_END_REQUEST'
    });
  } catch (error) {
    console.error('Chat error', error);
    dispatch({
      type: 'CHAT_ERROR',
      error: error.message
    });
  }
};

/**
 * Get the thread runs for a given thread.
 */
const updateThreadRuns = () => async ({
  select,
  dispatch
}) => {
  const threadId = select(state => state.root.threadId);
  dispatch({
    type: 'GET_THREAD_RUNS_BEGIN_REQUEST'
  });
  try {
    const threadRunsResponse = await getAssistantModel(select).getThreadRuns(threadId);
    dispatch({
      type: 'GET_THREAD_RUNS_END_REQUEST',
      ts: Date.now(),
      threadRuns: threadRunsResponse.data
    });
  } catch (error) {
    console.error('Get Thread Runs Error', error);
    dispatch({
      type: 'GET_THREAD_RUNS_ERROR',
      error: error.message
    });
  }
};

/**
 * Get a thread run for a given thread.
 */
const updateThreadRun = () => async ({
  select,
  dispatch
}) => {
  const {
    threadId,
    threadRun
  } = select(state => ({
    threadId: state.root.threadId,
    threadRun: getActiveThreadRun(state.root)
  }));
  dispatch({
    type: 'GET_THREAD_RUN_BEGIN_REQUEST'
  });
  try {
    const updatedThreadRun = await getAssistantModel(select).getThreadRun(threadId, threadRun?.id);
    dispatch({
      type: 'GET_THREAD_RUN_END_REQUEST',
      ts: Date.now(),
      threadRun: updatedThreadRun
    });
  } catch (error) {
    console.error('Thread error', error);
    dispatch({
      type: 'GET_THREAD_RUN_ERROR',
      error: error.message
    });
  }
};

/**
 * Get the thread messages for a given thread.
 */
const updateThreadMessages = () => async ({
  select,
  dispatch
}) => {
  const threadId = select(state => state.root.threadId);
  dispatch({
    type: 'GET_THREAD_MESSAGES_BEGIN_REQUEST'
  });
  try {
    const threadMessagesResponse = await getAssistantModel(select).getThreadMessages(threadId);
    // if there are messages, then set started to true
    if (threadMessagesResponse.data.length) {
      dispatch(actions$8.setAgentStarted(true));
    }
    dispatch({
      type: 'GET_THREAD_MESSAGES_END_REQUEST',
      ts: Date.now(),
      threadMessages: threadMessagesResponse.data
    });
  } catch (error) {
    console.error('Get Thread Messages Error', error);
    dispatch({
      type: 'GET_THREAD_MESSAGES_ERROR',
      error: error.message
    });
  }
};
const getAssistantModel = select => {
  const {
    service,
    apiKey,
    assistantId,
    feature,
    openAiOrganization
  } = select(state => {
    return {
      service: state.root.service,
      apiKey: state.root.apiKey,
      assistantId: selectors$4.getAssistantId(state.root),
      feature: state.root.feature,
      openAiOrganization: state.root.openAiOrganization
    };
  });
  if (!service || !apiKey || !assistantId) {
    console.warn('Service, API key and assistant ID are required', {
      service,
      apiKey,
      assistantId
    });
    throw new Error('Service, API key and assistant ID are required');
  }
  return AssistantModel.getInstance(service, apiKey, feature, null, {
    openAiOrganization
  });
};

/**
 * Create a new thread.
 */
const createThread = () => async ({
  select,
  dispatch
}) => {
  dispatch({
    type: 'CREATE_THREAD_BEGIN_REQUEST'
  });
  try {
    const threadResponse = await getAssistantModel(select).createThread();
    dispatch({
      type: 'CREATE_THREAD_END_REQUEST',
      threadId: threadResponse.id
    });
  } catch (error) {
    console.error('Thread error', error);
    dispatch({
      type: 'CREATE_THREAD_ERROR',
      error: error.message
    });
  }
};

/**
 * Delete a thread.
 */
const deleteThread = () => async ({
  select,
  dispatch
}) => {
  const threadId = select(state => state.root.threadId);
  dispatch({
    type: 'DELETE_THREAD_BEGIN_REQUEST'
  });
  try {
    await getAssistantModel(select).deleteThread(threadId);
    dispatch({
      type: 'DELETE_THREAD_END_REQUEST'
    });
    dispatch(actions$8.setAgentStarted(false));
  } catch (error) {
    console.error('Thread error', error);
    dispatch({
      type: 'DELETE_THREAD_ERROR',
      error: error.message
    });
  }
};

/**
 * Create a new thread run.
 *
 * @param {Object} request
 * @param {string} request.model
 * @param {string} request.instructions
 * @param {string} request.additionalInstructions
 * @param {Array}  request.additionalMessages
 * @param {Array}  request.tools
 * @param {Array}  request.metadata
 * @param {number} request.temperature
 * @param {number} request.maxPromptTokens
 * @param {number} request.maxCompletionTokens
 * @param {Object} request.truncationStrategy
 * @param {Object} request.responseFormat
 * @return {Object} Yields the resulting actions
 */
const createThreadRun = request => async ({
  select,
  dispatch
}) => {
  const {
    threadId,
    assistantId,
    model,
    temperature
  } = select(state => ({
    threadId: state.root.threadId,
    assistantId: selectors$4.getAssistantId(state.root),
    model: state.root.model,
    temperature: state.root.temperature
  }));
  dispatch({
    type: 'RUN_THREAD_BEGIN_REQUEST'
  });
  try {
    const createThreadRunResponse = await getAssistantModel(select).createThreadRun({
      ...request,
      additionalMessages: request.additionalMessages?.map(chatMessageToThreadMessage),
      threadId,
      assistantId,
      model,
      temperature
    });
    dispatch({
      type: 'RUN_THREAD_END_REQUEST',
      ts: Date.now(),
      additionalMessages: request.additionalMessages,
      threadRun: createThreadRunResponse
    });
  } catch (error) {
    console.error('Run Thread Error', error);
    return dispatch({
      type: 'RUN_THREAD_ERROR',
      error: error.message
    });
  }
};

/**
 * Submit tool outputs for a given thread run.
 *
 * @param {Object} options
 * @param {Array}  options.toolOutputs
 * @return {Object} Yields the resulting actions
 */
const submitToolOutputs = ({
  toolOutputs
}) => async ({
  select,
  dispatch
}) => {
  const {
    threadId,
    threadRun
  } = select(state => ({
    threadId: state.root.threadId,
    threadRun: getActiveThreadRun(state.root)
  }));
  try {
    dispatch({
      type: 'SUBMIT_TOOL_OUTPUTS_BEGIN_REQUEST'
    });
    const updatedRun = await getAssistantModel(select).submitToolOutputs(threadId, threadRun?.id, toolOutputs);
    dispatch({
      type: 'SUBMIT_TOOL_OUTPUTS_END_REQUEST',
      threadRun: updatedRun
    });
  } catch (error) {
    console.error('Submit Tool Outputs Error', error);
    return {
      type: 'SUBMIT_TOOL_OUTPUTS_ERROR',
      error: error.message
    };
  }
};

/**
 * Set the result of a tool call, and if it's a promise then resolve it first.
 *
 * @param {number} toolCallId
 * @param {*}      promise
 * @return {Object} The resulting action
 */
const setToolResult$1 = (toolCallId, promise) => async ({
  dispatch
}) => {
  dispatch({
    type: 'TOOL_BEGIN_REQUEST',
    ts: Date.now(),
    tool_call_id: toolCallId
  });
  try {
    const result = await promise;
    dispatch({
      type: 'TOOL_END_REQUEST',
      id: `tc:${toolCallId}`,
      ts: Date.now(),
      tool_call_id: toolCallId,
      result
    });
  } catch (error) {
    dispatch({
      type: 'TOOL_ERROR',
      id: toolCallId,
      error: error.message || 'There was an error'
    });
  }
};
const addMessageToThread = ({
  message
}) => async ({
  select,
  dispatch
}) => {
  // add the message to the active thread
  if (!message.id) {
    throw new Error('Message must have an ID');
  }
  const threadId = select(state => state.root.threadId);
  dispatch({
    type: 'CREATE_THREAD_MESSAGE_BEGIN_REQUEST'
  });
  try {
    const newMessage = await getAssistantModel(select).createThreadMessage(threadId, chatMessageToThreadMessage(message));
    dispatch({
      type: 'CREATE_THREAD_MESSAGE_END_REQUEST',
      ts: Date.now(),
      originalMessageId: message.id,
      message: newMessage
    });
  } catch (error) {
    console.error('Create thread error', error);
    return {
      type: 'CREATE_THREAD_MESSAGE_ERROR',
      error: error.message
    };
  }
};

/**
 * REDUCERS
 */

const addMessageReducer = (state, message) => {
  message = filterChatMessage(message);

  // if the message has the same ID as an existing message, update it
  const existingMessageIndex = state.messages.findIndex(existingMessage => existingMessage.id === message.id);
  if (existingMessageIndex !== -1) {
    // update thread_id if present
    return {
      ...state,
      messages: [...state.messages.slice(0, existingMessageIndex), {
        ...state.messages[existingMessageIndex],
        thread_id: message.thread_id
      }, ...state.messages.slice(existingMessageIndex + 1)]
    };
  }

  // special processing for tools - add the tool call messages
  if (message.role === 'tool' && message.tool_call_id) {
    // if there's an existing tool call result for this tool call ID, don't add it
    const existingToolCallResultMessage = state.messages.find(existingMessage => existingMessage.role === 'tool' && existingMessage.tool_call_id === message.tool_call_id);
    if (existingToolCallResultMessage) {
      console.warn('tool call result already exists', message);
      return state;
    }

    // find the tool call message and insert the result after it
    const existingToolCallMessage = state.messages.find(callMessage => {
      return callMessage.role === 'assistant' && callMessage.tool_calls?.some(toolCall => toolCall.id === message.tool_call_id);
    });
    if (existingToolCallMessage) {
      const index = state.messages.indexOf(existingToolCallMessage);
      // add this message to the messages list, and remove the existing tool call
      return {
        ...state,
        messages: [...state.messages.slice(0, index + 1), message, ...state.messages.slice(index + 1)]
      };
    }
    console.error('could not find call message for tool result', message, existingToolCallMessage);
    throw new Error(`Could not find tool call message for tool call ID ${message.tool_call_id}`);
  }
  return {
    ...state,
    messages: [...state.messages, message]
  };
};
const setThreadIdReducer = (state, threadId) => {
  // if the threadId hasn't changed, just return unaltered state
  if (state.threadId === threadId) {
    return state;
  }
  if (threadId) {
    localStorage.setItem('threadId', threadId);
  } else {
    localStorage.removeItem('threadId');
  }
  return {
    ...state,
    threadId,
    messages: [],
    threadRuns: [],
    threadRunsUpdated: null,
    threadMessagesUpdated: null,
    syncedThreadMessagesAt: null
  };
};
const reducer$4 = (state = initialState$4, action) => {
  var _action$additionalMes;
  switch (action.type) {
    // LLM-related
    case 'SET_ENABLED':
      return {
        ...state,
        enabled: action.enabled
      };
    case 'SET_ASSISTANT_ENABLED':
      return {
        ...state,
        assistantEnabled: action.enabled
      };
    case 'SET_SERVICE':
      return {
        ...state,
        service: action.service
      };
    case 'SET_API_KEY':
      return {
        ...state,
        apiKey: action.apiKey
      };
    case 'SET_FEATURE':
      return {
        ...state,
        feature: action.feature
      };
    case 'SET_MODEL':
      return {
        ...state,
        model: action.model
      };
    case 'SET_TEMPERATURE':
      return {
        ...state,
        temperature: action.temperature
      };

    // Chat Completion
    case 'CHAT_BEGIN_REQUEST':
      return {
        ...state,
        isFetchingChatCompletion: true
      };
    case 'CHAT_END_REQUEST':
      return {
        ...state,
        isFetchingChatCompletion: false
      };
    case 'CHAT_ERROR':
      return {
        ...state,
        isFetchingChatCompletion: false,
        error: action.error
      };

    // Begin Tool Processing
    case 'TOOL_BEGIN_REQUEST':
      return {
        ...state,
        tool_calls: [...state.tool_calls, {
          id: action.tool_call_id,
          created_at: action.ts
        }],
        isToolRunning: true
      };
    case 'TOOL_END_REQUEST':
      return {
        ...addMessageReducer(state, {
          role: 'tool',
          id: action.id,
          created_at: action.ts,
          tool_call_id: action.tool_call_id,
          content: action.result
        }),
        error: null,
        isToolRunning: false,
        tool_calls: state.tool_calls.filter(tc => tc.id !== action.tool_call_id)
      };
    case 'TOOL_ERROR':
      return {
        ...addMessageReducer(state, {
          role: 'tool',
          id: action.id,
          tool_call_id: action.tool_call_id,
          content: 'Error'
        }),
        error: action.error,
        isToolRunning: false,
        tool_calls: state.tool_calls.map(tc => {
          if (tc.id === action.tool_call_id) {
            return {
              ...tc,
              error: action.error
            };
          }
          return tc;
        })
      };

    // Add and Clear Messages
    case 'ADD_MESSAGE':
      return addMessageReducer(state, action.message);
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.messages
      };

    /**
     * Assistant-related reducers
     */

    // Set Assistant ID
    case 'SET_ASSISTANT_ID':
      return {
        ...state,
        assistantId: action.assistantId
      };
    case 'SET_DEFAULT_ASSISTANT_ID':
      return {
        ...state,
        defaultAssistantId: action.assistantId
      };

    // Set Thread
    case 'SET_THREAD_ID':
      return setThreadIdReducer(state, action.threadId);

    // Create Thread
    case 'CREATE_THREAD_BEGIN_REQUEST':
      return {
        ...state,
        isCreatingThread: true
      };
    case 'CREATE_THREAD_END_REQUEST':
      return {
        ...setThreadIdReducer(state, action.threadId),
        isCreatingThread: false
      };
    case 'CREATE_THREAD_ERROR':
      return {
        ...state,
        isCreatingThread: false,
        error: action.error
      };

    // Delete Thread
    case 'DELETE_THREAD_BEGIN_REQUEST':
      return {
        ...state,
        isDeletingThread: true
      };
    case 'DELETE_THREAD_END_REQUEST':
      return {
        ...setThreadIdReducer(state, null),
        isDeletingThread: false
      };
    case 'DELETE_THREAD_ERROR':
      return {
        ...state,
        isDeletingThread: false,
        error: action.error
      };

    // Create Thread Message
    case 'CREATE_THREAD_MESSAGE_BEGIN_REQUEST':
      return {
        ...state,
        isCreatingThreadMessage: true
      };
    case 'CREATE_THREAD_MESSAGE_END_REQUEST':
      // set synced to true on the message with the matching id
      return {
        ...state,
        messages: [...state.messages.map(message => {
          if (message.id === action.originalMessageId) {
            return filterChatMessage(action.message);
          }
          return message;
        })],
        syncedThreadMessagesAt: action.ts,
        isCreatingThreadMessage: false
      };
    case 'CREATE_THREAD_MESSAGE_ERROR':
      return {
        ...state,
        isCreatingThreadMessage: false,
        error: action.error
      };

    // Create Thread Run
    case 'RUN_THREAD_BEGIN_REQUEST':
      return {
        ...state,
        isCreatingThreadRun: true
      };
    case 'RUN_THREAD_END_REQUEST':
      const additionalMessageIds = (_action$additionalMes = action.additionalMessages?.map(message => message.id)) !== null && _action$additionalMes !== void 0 ? _action$additionalMes : [];
      return {
        ...state,
        // for each message in action.additionalMessages, find them by id and set message.thread_id to action.threadRun.id
        messages: state.messages.map(message => {
          if (additionalMessageIds.includes(message.id)) {
            return {
              ...message,
              thread_id: state.threadId
            };
          }
          return message;
        }),
        isCreatingThreadRun: false,
        threadRunsUpdated: action.ts,
        threadMessagesUpdated: null,
        // force reloading of chat history
        threadRuns: [action.threadRun, ...state.threadRuns]
      };
    case 'RUN_THREAD_ERROR':
      return {
        ...state,
        isCreatingThreadRun: false,
        error: action.error
      };

    // Submit Tool Outputs
    case 'SUBMIT_TOOL_OUTPUTS_BEGIN_REQUEST':
      return {
        ...state,
        isSubmittingToolOutputs: true
      };
    case 'SUBMIT_TOOL_OUTPUTS_END_REQUEST':
      return {
        ...state,
        isSubmittingToolOutputs: false,
        threadRuns: [action.threadRun, ...state.threadRuns.filter(tr => tr.id !== action.threadRun.id)]
      };
    case 'SUBMIT_TOOL_OUTPUTS_ERROR':
      return {
        ...state,
        isSubmittingToolOutputs: false,
        error: action.error
      };

    // Get Thread Run
    case 'GET_THREAD_RUN_BEGIN_REQUEST':
      return {
        ...state,
        isFetchingThreadRun: true
      };
    case 'GET_THREAD_RUN_END_REQUEST':
      // check if action.threadRun has pending tool calls
      const {
        threadRun
      } = action;

      // now optionally update with tool call messages
      // this simulates an assistant request with tool calls coming from the Chat Completion API
      // conversely, when we get a tool call response via TOOL_END_REQUEST, we need to send that to the threads/$threadId/runs/$runId/submit_tool_outputs endpoint
      if (threadRun.status === 'requires_action' && threadRun.required_action.type === 'submit_tool_outputs') {
        const tool_calls = threadRun.required_action.submit_tool_outputs.tool_calls;

        // add an assistant message with the tool calls
        state = addMessageReducer(state, {
          role: 'assistant',
          created_at: action.ts,
          tool_calls
        });
      }
      const existingThreadRunIndex = state.threadRuns.findIndex(tr => tr.id === action.threadRun.id);
      if (existingThreadRunIndex !== -1) {
        state = {
          ...state,
          threadRuns: [...state.threadRuns.slice(0, existingThreadRunIndex), action.threadRun, ...state.threadRuns.slice(existingThreadRunIndex + 1)]
        };
      } else {
        state = {
          ...state,
          threadRuns: [action.threadRun, ...state.threadRuns]
        };
      }
      return {
        ...state,
        isFetchingThreadRun: false
      };
    case 'GET_THREAD_RUN_ERROR':
      return {
        ...state,
        isFetchingThreadRun: false,
        error: action.error
      };

    // Get All Thread Runs
    case 'GET_THREAD_RUNS_BEGIN_REQUEST':
      return {
        ...state,
        isFetchingThreadRuns: true
      };
    case 'GET_THREAD_RUNS_END_REQUEST':
      const threadsRequiringAction = action.threadRuns.filter(tr => tr.status === 'requires_action' && tr.required_action.type === 'submit_tool_outputs');
      const tool_calls = threadsRequiringAction.flatMap(tr => tr.required_action.submit_tool_outputs.tool_calls);
      if (tool_calls.length) {
        const assistantMessage = {
          role: 'assistant',
          tool_calls
        };
        state = addMessageReducer(state, assistantMessage);
      }
      return {
        ...state,
        isFetchingThreadRuns: false,
        threadRunsUpdated: action.ts,
        threadRuns: action.threadRuns
      };
    case 'GET_THREAD_RUNS_ERROR':
      return {
        ...state,
        isFetchingThreadRuns: false,
        error: action.error
      };

    // Get Thread Messages
    case 'GET_THREAD_MESSAGES_BEGIN_REQUEST':
      return {
        ...state,
        isFetchingThreadMessages: true
      };
    case 'GET_THREAD_MESSAGES_END_REQUEST':
      // use addMessageReducer( state, message ) to add each message to the history
      // and update the tool_calls
      action.threadMessages.reverse().forEach(message => {
        // if the message is already in the history, update it
        state = addMessageReducer(state, message);
      });
      return {
        ...state,
        isFetchingThreadMessages: false,
        threadMessagesUpdated: action.ts
      };
    case 'GET_THREAD_MESSAGES_ERROR':
      return {
        ...state,
        isFetchingThreadMessages: false,
        error: action.error
      };
    default:
      return state;
  }
};

/**
 * Extract Tool Calls from state.
 *
 * @param {*}      state         The state
 * @param {string} function_name If provided, only return tool calls for this function
 * @return {Array} 	 An array of tool calls
 */
const getToolCalls = (state, function_name = null) => {
  const messagesWithToolCalls = state.messages.filter(message => message.role === 'assistant' && message.tool_calls?.some(toolCall => !function_name || toolCall.function.name === function_name)).map(message => message.tool_calls);
  const toolCalls = messagesWithToolCalls.reduce((acc, val) => acc.concat(val), []);
  return toolCalls;
};

/**
 * Extract Tool Outputs from state.
 *
 * @param {*} state The state
 * @return {Array} An array of tool outputs
 */
const getToolOutputs = createSelector(state => state.messages.filter(message => message.role === 'tool').map(message => ({
  tool_call_id: message.tool_call_id,
  output: message.content
})), state => [state.messages]);
const getActiveThreadRun = createSelector(state => state.threadRuns.find(threadRun => THREAD_RUN_ACTIVE_STATUSES.includes(threadRun.status)), state => [state.threadRuns]);
const selectors$4 = {
  isEnabled: state => {
    return state.enabled;
  },
  isAssistantEnabled: state => {
    return state.assistantEnabled;
  },
  isLoading: state => state.assistantEnabled && !selectors$4.isThreadDataLoaded(state),
  isRunning: state => state.isToolRunning || state.isFetchingChatCompletion || state.isCreatingThread || state.isDeletingThread || state.isCreatingThreadRun || state.isFetchingThreadRun || state.isFetchingThreadRuns || state.isCreatingThreadMessage || state.isFetchingThreadMessages || state.isSubmittingToolOutputs,
  isServiceAvailable: state => state.enabled && !state.error && state.service && state.apiKey,
  isChatAvailable: state => selectors$4.isServiceAvailable(state) && !state.assistantEnabled,
  isAssistantAvailable: state => selectors$4.isServiceAvailable(state) && state.assistantEnabled && selectors$4.getAssistantId(state),
  isAvailable: state => selectors$4.isChatAvailable(state) || selectors$4.isAssistantAvailable(state),
  isThreadDataLoaded: state => !state.assistantEnabled || state.threadId && state.threadRunsUpdated && state.threadMessagesUpdated,
  isThreadRunInProgress: state => {
    return state.threadId && ['queued', 'in_progress'].includes(selectors$4.getActiveThreadRunStatus(state));
  },
  isThreadRunComplete: state => {
    const threadRunStatus = selectors$4.getActiveThreadRunStatus(state);
    return !selectors$4.isRunning(state) && selectors$4.isThreadDataLoaded(state) && (!threadRunStatus || THREAD_RUN_COMPLETED_STATUSES.includes(threadRunStatus));
  },
  isAwaitingUserInput: state => selectors$4.getPendingToolCalls(state).length > 0 || selectors$4.getRunningToolCallIds(state).length > 0 || selectors$4.getAssistantMessage(state),
  isThreadRunAwaitingToolOutputs: state => {
    const threadRun = getActiveThreadRun(state);
    const requiredToolOutputs = selectors$4.getRequiredToolOutputs(state);
    return selectors$4.isThreadDataLoaded(state) && !selectors$4.isRunning(state) && threadRun && threadRun.status === 'requires_action' && threadRun.required_action.type === 'submit_tool_outputs' && requiredToolOutputs.length > 0;
  },
  getService: state => state.service,
  getModel: state => state.model,
  getTemperature: state => state.temperature,
  getFeature: state => state.feature,
  getApiKey: state => state.apiKey,
  getError: state => state.error,
  getMessages: state => state.messages,
  getAssistantMessage: state => {
    // return the last message only if it's an assistant message with content
    const lastMessage = state.messages[state.messages.length - 1];
    return lastMessage?.role === 'assistant' && lastMessage.content ? lastMessage.content : null;
  },
  getToolOutputs,
  getPendingToolCalls: createSelector((state, function_name = null) => {
    const toolCalls = getToolCalls(state, function_name);
    const runningToolCalls = selectors$4.getRunningToolCallIds(state);
    const toolOutputs = getToolOutputs(state);
    const result = toolCalls.filter(toolCall => !runningToolCalls.includes(toolCall.id) && !toolOutputs.some(toolOutput => toolOutput.tool_call_id === toolCall.id));
    return result;
  }, state => [state.messages]),
  getRunningToolCallIds: state => {
    return state.tool_calls.map(tc => tc.id);
  },
  getAdditionalMessages: createSelector(state => {
    // user/assistant messages without a threadId are considered not to have been synced
    return state.messages.filter(message => ['assistant', 'user'].includes(message.role) && message.content && !message.thread_id);
  }, state => [state.messages]),
  getRequiredToolOutputs: createSelector(state => {
    const currentThreadRun = state.threadRuns[0];
    if (currentThreadRun && currentThreadRun.status === 'requires_action' && currentThreadRun.required_action.type === 'submit_tool_outputs') {
      return currentThreadRun.required_action.submit_tool_outputs.tool_calls;
    }
    return [];
  }, state => [state.threadRuns]),
  getThreadId: state => state.threadId,
  getAssistantId: state => {
    var _state$assistantId;
    return (_state$assistantId = state.assistantId) !== null && _state$assistantId !== void 0 ? _state$assistantId : state.defaultAssistantId;
  },
  updateThreadRuns: state => state.threadRun,
  getThreadRunsUpdated: state => state.threadRunsUpdated,
  getThreadMessagesUpdated: state => state.threadMessagesUpdated,
  getActiveThreadRun: createSelector(state => state.threadRuns.find(threadRun => THREAD_RUN_ACTIVE_STATUSES.includes(threadRun.status)), state => [state.threadRuns]),
  getActiveThreadRunStatus: createSelector(state => getActiveThreadRun(state)?.status, state => [state.threadRuns]),
  getCompletedThreadRuns: createSelector(state => state.threadRuns.find(threadRun => THREAD_RUN_COMPLETED_STATUSES.includes(threadRun.status)), state => [state.threadRuns]),
  hasNewMessagesToProcess: state => {
    const activeThreadRun = getActiveThreadRun(state);
    return activeThreadRun && activeThreadRun.created_at > state.syncedThreadMessagesAt / 1000;
  }
};

/*
 * ACTIONS
 */

const addMessage = message => {
  return {
    type: 'ADD_MESSAGE',
    message: {
      ...message,
      id: message.id || uuidv4(),
      created_at: message.created_at || Date.now()
    }
  };
};
const agentSay = content => {
  return addMessage({
    role: 'assistant',
    content: [{
      type: 'text',
      text: content
    }]
  });
};
const clearMessages = () => ({
  type: 'SET_MESSAGES',
  messages: []
});
const clearError = () => ({
  type: 'CHAT_ERROR',
  error: null
});
const actions$4 = {
  setEnabled: enabled => {
    return {
      type: 'SET_ENABLED',
      enabled
    };
  },
  setAssistantEnabled: enabled => {
    return {
      type: 'SET_ASSISTANT_ENABLED',
      enabled
    };
  },
  setThreadId: threadId => ({
    type: 'SET_THREAD_ID',
    threadId
  }),
  setAssistantId: assistantId => ({
    type: 'SET_ASSISTANT_ID',
    assistantId
  }),
  setDefaultAssistantId: assistantId => ({
    type: 'SET_DEFAULT_ASSISTANT_ID',
    assistantId
  }),
  setService: service => ({
    type: 'SET_SERVICE',
    service
  }),
  setApiKey: apiKey => ({
    type: 'SET_API_KEY',
    apiKey
  }),
  setFeature: feature => ({
    type: 'SET_FEATURE',
    feature
  }),
  setTemperature: temperature => ({
    type: 'SET_TEMPERATURE',
    temperature
  }),
  setModel: model => ({
    type: 'SET_MODEL',
    model
  }),
  clearError,
  setToolResult: setToolResult$1,
  submitToolOutputs,
  runChatCompletion,
  createThread,
  deleteThread,
  createThreadRun,
  updateThreadRun,
  updateThreadRuns,
  addMessageToThread,
  updateThreadMessages,
  addMessage,
  agentSay,
  reset,
  clearMessages,
  userSay: (content, image_urls = []) => addMessage({
    role: 'user',
    content: [{
      type: 'text',
      text: content
    }, ...image_urls?.map(image_url => ({
      type: 'image_url',
      image_url //: 'data:image/jpeg;base64,$base64'
    }))]
  }),
  call: (name, args, id) => ({
    type: 'ADD_MESSAGE',
    message: {
      id: uuidv4(),
      created_at: Date.now(),
      role: 'assistant',
      tool_calls: [{
        id: id !== null && id !== void 0 ? id : uuidv4(),
        type: 'function',
        function: {
          name,
          arguments: args
        }
      }]
    }
  })
};

const initialState$3 = {
  title: '',
  description: '',
  topic: '',
  location: '',
  type: ''
};
const actions$3 = {
  setSiteType: siteType => {
    return {
      type: 'SET_SITE_TYPE',
      siteType
    };
  },
  setSiteTitle: title => {
    return {
      type: 'SET_SITE_TITLE',
      title
    };
  },
  setSiteDescription: description => {
    return {
      type: 'SET_SITE_DESCRIPTION',
      description
    };
  },
  setSiteTopic: topic => {
    return {
      type: 'SET_SITE_TOPIC',
      topic
    };
  },
  setSiteLocation: location => {
    return {
      type: 'SET_SITE_LOCATION',
      location
    };
  }
};
const reducer$3 = (state = initialState$3, action) => {
  switch (action.type) {
    case 'SET_SITE_TYPE':
      return {
        ...state,
        type: action.siteType
      };
    case 'SET_SITE_TITLE':
      return {
        ...state,
        title: action.title
      };
    case 'SET_SITE_DESCRIPTION':
      return {
        ...state,
        description: action.description
      };
    case 'SET_SITE_TOPIC':
      return {
        ...state,
        topic: action.topic
      };
    case 'SET_SITE_LOCATION':
      return {
        ...state,
        location: action.location
      };
    default:
      return state;
  }
};
const selectors$3 = {
  getSiteType: state => state.type,
  getSiteTitle: state => state.title,
  getSiteDescription: state => state.description,
  getSiteTopic: state => state.topic,
  getSiteLocation: state => state.location
};

const initialState$2 = {
  textColor: '#000000',
  backgroundColor: '#ffffff',
  accentColor: '#0073aa'
};
const actions$2 = {
  setTextColor: value => {
    return {
      type: 'SET_TEXT_COLOR',
      value
    };
  },
  setBackgroundColor: value => {
    return {
      type: 'SET_BACKGROUND_COLOR',
      value
    };
  },
  setAccentColor: value => {
    return {
      type: 'SET_ACCENT_COLOR',
      value
    };
  }
};
const reducer$2 = (state = initialState$2, action) => {
  switch (action.type) {
    case 'SET_TEXT_COLOR':
      return {
        ...state,
        textColor: action.value
      };
    case 'SET_BACKGROUND_COLOR':
      return {
        ...state,
        backgroundColor: action.value
      };
    case 'SET_ACCENT_COLOR':
      return {
        ...state,
        accentColor: action.value
      };
    default:
      return state;
  }
};
const selectors$2 = {
  getTextColor: state => state.textColor,
  getBackgroundColor: state => state.backgroundColor,
  getAccentColor: state => state.accentColor
};

const initialState$1 = {
  pages: []
};
function filterPage(page) {
  var _page$id;
  return {
    ...page,
    id: (_page$id = page.id) !== null && _page$id !== void 0 ? _page$id : uuidv4()
  };
}
const getPage = (state, pageId) => state.pages.find(page => page.id === pageId);
const updatePageProperty = (state, pageId, property, value) => {
  return {
    ...state,
    pages: state.pages.map(page => page.id === pageId ? {
      ...page,
      [property]: value
    } : page)
  };
};
const actions$1 = {
  addPage: page => {
    return {
      type: 'ADD_SITE_PAGE',
      page: filterPage(page)
    };
  },
  setPages: pages => {
    return {
      type: 'SET_SITE_PAGES',
      pages: pages.map(filterPage)
    };
  },
  setPageTitle: (pageId, title) => {
    return {
      type: 'SET_PAGE_TITLE',
      pageId,
      title
    };
  },
  setPageDescription: (pageId, description) => {
    return {
      type: 'SET_PAGE_DESCRIPTION',
      pageId,
      description
    };
  },
  setPageCategory: (pageId, category) => {
    return {
      type: 'SET_PAGE_CATEGORY',
      pageId,
      category
    };
  }
};
const reducer$1 = (state = initialState$1, action) => {
  switch (action.type) {
    case 'SET_SITE_PAGES':
      return {
        ...state,
        pages: action.pages
      };
    case 'ADD_SITE_PAGE':
      return {
        ...state,
        pages: [...state.pages, action.page]
      };
    case 'SET_PAGE_TITLE':
      return updatePageProperty(state, action.pageId, 'title', action.title);
    case 'SET_PAGE_DESCRIPTION':
      return updatePageProperty(state, action.pageId, 'description', action.description);
    case 'SET_PAGE_CATEGORY':
      return updatePageProperty(state, action.pageId, 'category', action.category);
    default:
      return state;
  }
};
const selectors$1 = {
  getPage,
  getPages: state => state.pages,
  getPageTitle: (state, pageId) => {
    return getPage(state, pageId)?.title;
  },
  getPageDescription: (state, pageId) => {
    return getPage(state, pageId)?.description;
  },
  getPageCategory: (state, pageId) => {
    return getPage(state, pageId)?.category;
  }
};

const initialState = {
  sections: []
};
function filterSection(pageId, section) {
  var _section$id;
  return {
    ...section,
    pageId,
    id: (_section$id = section.id) !== null && _section$id !== void 0 ? _section$id : uuidv4()
  };
}
function getSection(state, pageId, sectionId) {
  return state.sections.find(section => section.pageId === pageId && section.id === sectionId);
}
const updateSectionProperty = (state, pageId, sectionId, property, value) => {
  return {
    ...state,
    sections: state.sections.map(section => {
      if (section.pageId === pageId && section.id === sectionId) {
        return {
          ...section,
          [property]: value
        };
      }
      return section;
    })
  };
};
const actions = {
  addPageSection: (pageId, section) => {
    return {
      type: 'ADD_PAGE_SECTION',
      section: filterSection(pageId, section)
    };
  },
  setPageSections: (pageId, {
    sections
  }) => {
    return {
      type: 'SET_PAGE_SECTIONS',
      pageId,
      sections: sections.map(filterSection.bind(null, pageId))
    };
  },
  setSectionDescription: (pageId, sectionId, description) => {
    return {
      type: 'SET_SECTION_DESCRIPTION',
      pageId,
      sectionId,
      description
    };
  },
  setSectionCategory: (pageId, sectionId, category) => {
    return {
      type: 'SET_SECTION_CATEGORY',
      pageId,
      sectionId,
      category
    };
  }
};
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_PAGE_SECTION':
      return {
        ...state,
        sections: [...state.sections, action.section]
      };
    case 'SET_PAGE_SECTIONS':
      return {
        ...state,
        sections: state.sections.filter(section => section.pageId !== action.pageId).concat(action.sections)
      };
    case 'SET_SECTION_DESCRIPTION':
      return updateSectionProperty(state, action.pageId, action.sectionId, 'description', action.description);
    case 'SET_SECTION_CATEGORY':
      return updateSectionProperty(state, action.pageId, action.sectionId, 'category', action.category);
    default:
      return state;
  }
};
const selectors = {
  getSection,
  getPageSections: (state, pageId) => {
    return state.sections.filter(section => section.pageId === pageId);
  },
  getSectionDescription: (state, pageId, sectionId) => {
    return getSection(state, pageId, sectionId)?.description;
  },
  getSectionCategory: (state, pageId, sectionId) => {
    return getSection(state, pageId, sectionId)?.category;
  }
};

const store = createReduxStore('big-sky-agents', {
  reducer: combineReducers({
    agents: reducer$8,
    goals: reducer$7,
    thought: reducer$6,
    toolkits: reducer$5,
    chat: reducer$4,
    site: reducer$3,
    design: reducer$2,
    pages: reducer$1,
    pageSections: reducer
  }),
  actions: {
    ...createNamespacedActions('agents', actions$8),
    ...createNamespacedActions('goals', actions$7),
    ...createNamespacedActions('thought', actions$6),
    ...createNamespacedActions('toolkits', actions$5),
    ...createNamespacedActions('chat', actions$4),
    ...createNamespacedActions('site', actions$3),
    ...createNamespacedActions('design', actions$2),
    ...createNamespacedActions('pages', actions$1),
    ...createNamespacedActions('pageSections', actions)
  },
  selectors: {
    ...createNamespacedSelectors('agents', selectors$8),
    ...createNamespacedSelectors('goals', selectors$7),
    ...createNamespacedSelectors('thought', selectors$6),
    ...createNamespacedSelectors('toolkits', selectors$5),
    ...createNamespacedSelectors('chat', selectors$4),
    ...createNamespacedSelectors('site', selectors$3),
    ...createNamespacedSelectors('design', selectors$2),
    ...createNamespacedSelectors('pages', selectors$1),
    ...createNamespacedSelectors('pageSections', selectors)
  }
});
register(store);

const ASK_USER_TOOL_NAME = 'askUser';
var AskUserTool = {
  name: ASK_USER_TOOL_NAME,
  description: 'Ask the user a question. Always provide a list of choices if possible, to help the user decide.',
  parameters: {
    type: 'object',
    properties: {
      question: {
        description: 'A question in markdown format',
        type: 'string'
      },
      placeholder: {
        description: 'Placeholder text, e.g. "A location" or "A name"',
        type: 'string'
      },
      choices: {
        description: 'Suggested answers or choices for the user',
        type: 'array',
        items: {
          type: 'string'
        }
      },
      multiChoice: {
        description: 'Allow user to select multiple choices',
        type: 'boolean',
        default: false
      }
    },
    required: ['question']
  }
};

// Adapted from doT.js, 2011-2014, Laura Doktorova, https://github.com/olado/doT
// Licensed under the MIT license.

/**
 * {{ }}	for evaluation
 * {{= }}	for interpolation
 * {{! }}	for interpolation with encoding
 * {{# }}	for compile-time evaluation/includes and partials
 * {{## #}}	for compile-time defines
 * {{? }}	for conditionals
 * For array iteration:
 * {{~ arrayname :varname}}
 *   {{= varname.title}}
 *   {{= varname.description}}
 * {{~}}
 */

const templateSettings = {
  argName: 'it',
  encoders: {},
  selfContained: false,
  strip: true,
  internalPrefix: '_val',
  encodersPrefix: '_enc',
  delimiters: {
    start: '{{',
    end: '}}'
  }
};

// depends on selfContained mode
const encoderType = {
  false: 'function',
  true: 'string'
};
const defaultSyntax = {
  evaluate: /\{\{([\s\S]+?(\}?)+)\}\}/g,
  interpolate: /\{\{=([\s\S]+?)\}\}/g,
  typeInterpolate: /\{\{%([nsb])=([\s\S]+?)\}\}/g,
  encode: /\{\{([a-z_$]+[\w$]*)?!([\s\S]+?)\}\}/g,
  use: /\{\{#([\s\S]+?)\}\}/g,
  useParams: /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$]+(?:\.[\w$]+|\[[^\]]+\])*|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\}|\[[^\]]*\])/g,
  define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
  defineParams: /^\s*([\w$]+):([\s\S]+)/,
  conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
  iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g
};
const currentSyntax = {
  ...defaultSyntax
};
const TYPES = {
  n: 'number',
  s: 'string',
  b: 'boolean'
};
function resolveDefs(c, syn, block, def) {
  return (typeof block === 'string' ? block : block.toString()).replace(syn.define, (_1, code, assign, value) => {
    if (code.indexOf('def.') === 0) {
      code = code.substring(4);
    }
    if (!(code in def)) {
      if (assign === ':') {
        value.replace(syn.defineParams, (_2, param, v) => {
          def[code] = {
            arg: param,
            text: v
          };
        });
        if (!(code in def)) {
          def[code] = value;
        }
      } else {
        new Function('def', `def['${code}']=${value}`)(def);
      }
    }
    return '';
  }).replace(syn.use, (_1, code) => {
    code = code.replace(syn.useParams, (_2, s, d, param) => {
      if (def[d] && def[d].arg && param) {
        const rw = unescape((d + ':' + param).replace(/'|\\/g, '_'));
        def.__exp = def.__exp || {};
        def.__exp[rw] = def[d].text.replace(new RegExp(`(^|[^\\w$])${def[d].arg}([^\\w$])`, 'g'), `$1${param}$2`);
        return s + `def.__exp['${rw}']`;
      }
    });
    const v = new Function('def', 'return ' + code)(def);
    return v ? resolveDefs(c, syn, v, def) : v;
  });
}
function unescape(code) {
  return code.replace(/\\('|\\)/g, '$1').replace(/[\r\t\n]/g, ' ');
}
function compile(tmpl, def) {
  let sid = 0;
  let str = resolveDefs(templateSettings, currentSyntax, tmpl, {});
  const needEncoders = {};
  str = ("let out='" + (str.trim().replace(/[\t ]+(\r|\n)/g, '\n') // remove trailing spaces
  .replace(/(\r|\n)[\t ]+/g, ' ') // leading spaces reduced to " "
  .replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g, '') // remove breaks, tabs and JS comments
  ).replace(/'|\\/g, '\\$&').replace(currentSyntax.interpolate, (_, code) => `'+(${unescape(code)})+'`).replace(currentSyntax.typeInterpolate, (_, typ, code) => {
    sid++;
    const val = templateSettings.internalPrefix + sid;
    const error = `throw new Error("expected ${TYPES[typ]}, got "+ (typeof ${val}))`;
    return `';const ${val}=(${unescape(code)});if(typeof ${val}!=="${TYPES[typ]}") ${error};out+=${val}+'`;
  }).replace(currentSyntax.encode, (_, enc = '', code) => {
    needEncoders[enc] = true;
    code = unescape(code);
    // eslint-disable-next-line no-nested-ternary
    const e = templateSettings.selfContained ? enc : enc ? '.' + enc : '[""]';
    return `'+${templateSettings.encodersPrefix}${e}(${code})+'`;
  }).replace(currentSyntax.conditional, (_, elseCase, code) => {
    if (code) {
      code = unescape(code);
      return elseCase ? `';}else if(${code}){out+='` : `';if(${code}){out+='`;
    }
    return elseCase ? "';}else{out+='" : "';}out+='";
  }).replace(currentSyntax.iterate, (_, arr, vName, iName) => {
    if (!arr) {
      return "';} } out+='";
    }
    sid++;
    const defI = iName ? `let ${iName}=-1;` : '';
    const incI = iName ? `${iName}++;` : '';
    const val = templateSettings.internalPrefix + sid;
    return `';const ${val}=${unescape(arr)};if(${val}){${defI}for (const ${vName} of ${val}){${incI}out+='`;
  }).replace(currentSyntax.evaluate, (_, code) => `';${unescape(code)}out+='`) + "';return out;").replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, '');
  const args = Array.isArray(templateSettings.argName) ? properties(templateSettings.argName) : templateSettings.argName;
  if (Object.keys(needEncoders).length === 0) {
    return try_(() => new Function(args, str));
  }
  checkEncoders(templateSettings, needEncoders);
  str = `return function(${args}){${str}};`;
  return try_(() => templateSettings.selfContained ? new Function(str = addEncoders(templateSettings, needEncoders) + str)() : new Function(templateSettings.encodersPrefix, str)(templateSettings.encoders));
  function try_(f) {
    try {
      return f();
    } catch (e) {
      log.error('Could not create a template function: ' + str);
      throw e;
    }
  }
}
function properties(args) {
  return args.reduce((s, a, i) => s + (i ? ',' : '') + a, '{') + '}';
}
function checkEncoders(c, encoders) {
  const typ = encoderType[c.selfContained];
  for (const enc in encoders) {
    const e = c.encoders[enc];
    if (!e) {
      throw new Error(`unknown encoder "${enc}"`);
    }
    if (typeof e !== typ) {
      throw new Error(`selfContained ${c.selfContained}: encoder type must be "${typ}"`);
    }
  }
}
function addEncoders(c, encoders) {
  let s = '';
  for (const enc in encoders) {
    s += `const ${c.encodersPrefix}${enc}=${c.encoders[enc]};`;
  }
  return s;
}

class Formatter {
  format( /* values */
  ) {
    throw new Error('Not implemented');
  }
}
class StringPromptTemplate extends Formatter {
  constructor({
    inputVariables,
    template,
    // string version of the template, for easy comparison
    engine,
    formatters = {},
    ...options
  }) {
    super();
    this.validate(engine, inputVariables);
    this.inputVariables = inputVariables;
    this.engine = engine;
    this.template = template;
    this.formatters = formatters;
    Object.assign(this, options);
  }
  validate(engine, inputVariables) {
    try {
      const dummyInputs = inputVariables.reduce((acc, v) => {
        acc[v] = 'foo';
        return acc;
      }, {});
      engine(dummyInputs);
    } catch (e) {
      throw new Error(`Invalid inputs: ${e.message}, inputs: ${inputVariables.join(', ')}`);
    }
  }
  format(values) {
    // apply formatters
    const formattedValues = this.inputVariables.reduce((acc, v) => {
      if (v in this.formatters) {
        acc[v] = this.formatters[v].format(values);
      } else {
        acc[v] = values[v];
      }
      return acc;
    }, {});
    return this.engine(formattedValues);
  }
}
class DotPromptTemplate extends StringPromptTemplate {
  constructor({
    template,
    inputVariables,
    ...options
  }) {
    const engine = compile(template);
    super({
      engine,
      template,
      inputVariables,
      ...options
    });
  }
  static fromString(template, inputVariables = [], options = {}) {
    return new DotPromptTemplate({
      template,
      inputVariables,
      ...options
    });
  }
}

const INFORM_TOOL_NAME = 'informUser';
var InformTool = {
  name: INFORM_TOOL_NAME,
  description: "Tell the user what you're doing.",
  parameters: {
    type: 'object',
    properties: {
      message: {
        description: 'A message to for the user, in markdown format.',
        type: 'string'
      }
    },
    required: ['message']
  }
};

const SET_AGENT_GOAL_TOOL_NAME = 'setGoal';
var SetGoalTool = {
  name: SET_AGENT_GOAL_TOOL_NAME,
  description: `Use this to set the current goal of the session. Call this tool when you think the goal has changed.`,
  parameters: {
    type: 'object',
    properties: {
      goal: {
        description: 'The goal of the current conversation.',
        type: 'string'
      }
    },
    required: ['goal']
  }
};

const SET_AGENT_TOOL_NAME = 'setAgent';
const createSetAgentTool = agents => {
  var _agents$map$join, _agents$map$join2;
  const agentDescriptionsMarkdown = (_agents$map$join = agents?.map(agent => ` * ${agent.id}: "${agent.name}", ${agent.description}`).join('\n')) !== null && _agents$map$join !== void 0 ? _agents$map$join : 'No registered agents';
  const validAgentIds = (_agents$map$join2 = agents?.map(agent => agent.id).join(', ')) !== null && _agents$map$join2 !== void 0 ? _agents$map$join2 : '';
  return {
    name: SET_AGENT_TOOL_NAME,
    description: `Use this to select the agent best suited to accomplish the user's goal.
		**Available agents**:
		${agentDescriptionsMarkdown}.`,
    parameters: {
      type: 'object',
      properties: {
        agentId: {
          description: `The ID of the agent to help with the goal. One of: ${validAgentIds}`,
          type: 'string'
        }
      },
      required: ['agentId']
    }
  };
};

var AgentsToolkit = {
  name: 'agents',
  tools: context => [createSetAgentTool(context.agents)]
};

var AskUserToolkit = {
  name: 'askUser',
  tools: [AskUserTool]
};

var InformUserToolkit = {
  name: 'inform',
  tools: [InformTool]
};

var GoalToolkit = {
  name: 'goal',
  tools: [SetGoalTool]
};

/**
 * Internal dependencies
 */
const instructions$4 = DotPromptTemplate.fromString(`You are a helpful assistant.`);
class Agent {
  get toolkits() {
    return [];
  }
  get id() {
    throw new Error(`Agent ${this.id} must implement id`);
  }
  get name() {
    throw new Error(`Agent ${this.id} must implement name`);
  }
  get description() {
    throw new Error(`Agent ${this.id} must implement description`);
  }
  onToolResult(toolName, value, callbacks, context) {
    // do nothing by default
    log.info('onToolResult', {
      toolName,
      value,
      callbacks,
      context
    });
  }
  instructions(context) {
    return instructions$4.format(context);
  }
  additionalInstructions() {
    return null;
  }

  /**
   * Tools
   */

  tools() {
    return [];
  }

  /**
   * Lifecycle methods
   */

  onStart({
    askUser
  }) {
    askUser({
      question: 'What can I help you with?'
    });
  }
}

const instructions$3 = DotPromptTemplate.fromString(`You are a helpful assistant.`);
const additionalInstructions$1 = DotPromptTemplate.fromString(`Please attempt to complete the goal: {{= it.agent.goal }}.`, ['agent']);
class BasicAgent extends Agent {
  get toolkits() {
    return [...super.toolkits, AgentsToolkit.name, AskUserToolkit.name, InformUserToolkit.name, GoalToolkit.name];
  }
  onToolResult(toolName, value, callbacks, context) {
    switch (toolName) {
      case AskUserTool.name:
        this.onAskUser(value, callbacks, context);
        break;
      case InformTool.name:
        this.onInformUser(value, callbacks, context);
        break;
      case SetGoalTool.name:
        this.onGoalChange(value, callbacks, context);
        break;
      case SET_AGENT_TOOL_NAME:
        this.onAgentChange(value, callbacks, context);
        break;
      default:
        super.onToolResult(toolName, value, callbacks, context);
    }
  }
  onGoalChange(goal) {
    console.log('onGoalChange', goal);
  }
  onAskUser(value, callbacks, context) {
    console.log('onAskUser', value, callbacks, context);
  }
  onInformUser(value, callbacks, context) {
    console.log('onInformUser', value, callbacks, context);
  }
  onAgentChange(agentId) {
    console.log('onAgentChange', agentId);
  }
  instructions(context) {
    return instructions$3.format(context);
  }
  additionalInstructions(context) {
    return additionalInstructions$1.format(context);
  }

  /**
   * Tools
   */

  tools( /* context */
  ) {
    return [AskUserTool.name, InformTool.name, SetGoalTool.name, SET_AGENT_TOOL_NAME];
  }

  /**
   * Lifecycle methods
   */

  onStart({
    askUser
  }) {
    askUser({
      question: 'What can I help you with?'
    });
  }
}

const WAPUU_AGENT_ID = 'Wapuu';
const defaultQuestion$1 = 'What can I help you with?';
const defaultChoices$1 = [
// these more-or-less correspond to specific agents
'I want to change my site title or settings'];
const instructions$2 = DotPromptTemplate.fromString(`You are a helpful AI assistant. Your mission is to find out what the user needs, clearly set goal and choose an appropriate agent to help them.`);
class WapuuCLIAgent extends BasicAgent {
  id = WAPUU_AGENT_ID;
  name = 'Wapuu';
  description = 'Here to understand your goal and choose the best agent to help you.';
  get toolkits() {
    return super.toolkits;
  }
  instructions(context) {
    return instructions$2.format(context);
  }
  tools(context) {
    return [...super.tools(context)];
  }
  getDefaultQuestion() {
    return defaultQuestion$1;
  }
  getDefaultChoices() {
    return defaultChoices$1;
  }
  onStart(invoke) {
    invoke.askUser({
      question: defaultQuestion$1,
      choices: defaultChoices$1
    });
  }
}

/**
 * An agent which helps the user clarify their site goals
 */
const CONFIRM_TOOL_NAME = 'finish';
var ConfirmTool = {
  name: CONFIRM_TOOL_NAME,
  description: `Call this tool when you have accomplished the goal. This allows the user to approve or reject the changes you have made.`,
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'A helpful messaging informing the user of how you accomplished the goal'
      }
    },
    required: ['message']
  }
};

var ConfirmToolkit = {
  name: 'confirm',
  tools: [ConfirmTool]
};

const instructions$1 = DotPromptTemplate.fromString(`You are a helpful assistant. Your mission is to help the user design the perfect site.`);
class BuilderAgent extends BasicAgent {
  get toolkits() {
    return [...super.toolkits, ConfirmToolkit.name];
  }
  instructions(context) {
    return instructions$1.format(context);
  }
  tools(context) {
    return [...super.tools(context), ConfirmTool];
  }
  onStart({
    askUser
  }) {
    askUser({
      question: 'What would you like to do?'
    });
  }

  // by overriding this method you can handle almost any kind of lifecycle callback
  onToolResult(toolName, value, invoke, context) {
    switch (toolName) {
      case ConfirmTool.name:
        this.onConfirm(value, invoke, context);
        break;
      default:
        super.onToolResult(toolName, value, invoke, context);
    }
  }
  onConfirm(confirmed, {
    setGoal,
    informUser,
    askUser,
    userSay
  }) {
    if (confirmed) {
      setGoal({
        goal: 'Find out what the user wants to do next'
      });
      informUser({
        message: 'Got it!'
      });
      askUser({
        question: 'What would you like to do next?'
      });
    } else {
      informUser({
        message: 'Looks like you requested some changes'
      });
      userSay('I would like to make some changes');
      askUser({
        question: 'What would you like to change?'
      });
    }
  }
}

/**
 * Create a tool with one or more parameters
 *
 * @param {Object} options             The options for the tool
 * @param {string} options.name        The name of the tool
 * @param {string} options.description The description of the tool
 * @param {Object} options.parameters  The parameters of the tool in JSON schema format
 * @return {Object} The tool object
 */
const createTool = ({
  name,
  description,
  parameters
}) => {
  if (!name) {
    throw new Error('Missing tool name');
  }
  if (!description) {
    throw new Error('Missing tool description');
  }
  if (typeof parameters === 'undefined') {
    // single input schema
    parameters = {
      type: 'object',
      properties: {
        input: {
          type: 'string'
        }
      },
      required: ['input']
    };
  }
  return {
    name,
    description,
    parameters
  };
};

/**
 * Create a tool with a single parameter
 *
 * @param {string} name        The name of the tool
 * @param {string} description The description of the tool
 * @return {Object} The tool object
 */
const createSimpleTool = (name, description) => {
  return createTool({
    name,
    description,
    parameters: {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        }
      },
      required: ['value']
    }
  });
};

var pageCategories = [
	{
		title: "About",
		description: "About page",
		slug: "about"
	},
	{
		title: "Contact",
		description: "Contact page",
		slug: "contact"
	},
	{
		title: "Home",
		description: "Home page",
		slug: "home"
	},
	{
		title: "Services",
		description: "Services page",
		slug: "services"
	},
	{
		title: "Work",
		description: "Work page",
		slug: "work"
	},
	{
		title: "Blog",
		description: "Blog page",
		slug: "blog"
	},
	{
		title: "Portfolio",
		description: "Portfolio page",
		slug: "portfolio"
	},
	{
		title: "Testimonials",
		description: "Testimonials page",
		slug: "testimonials"
	},
	{
		title: "Team",
		description: "Team page",
		slug: "team"
	},
	{
		title: "FAQ",
		description: "FAQ page",
		slug: "faq"
	},
	{
		title: "Pricing",
		description: "Pricing page",
		slug: "pricing"
	},
	{
		title: "Terms",
		description: "Terms page",
		slug: "terms"
	},
	{
		title: "Privacy",
		description: "Privacy page",
		slug: "privacy"
	}
];

var patternCategories = [
	{
		title: "Headers",
		description: "The header section of a website.",
		slug: "header"
	},
	{
		title: "Introduction",
		description: "Prominent area at the top of a website.",
		slug: "intro"
	},
	{
		title: "About",
		description: "Section providing details about a company, product, or service.",
		slug: "about"
	},
	{
		title: "Testimonials",
		description: "Statements from satisfied customers, clients, or users.",
		slug: "testimonials"
	},
	{
		title: "Pricing Tiers",
		description: "Display various pricing plans or options for products or services.",
		slug: "pricing"
	},
	{
		title: "Services Offered",
		description: "List of services provided by a business.",
		slug: "services"
	},
	{
		title: "Contact Forms",
		description: "Interactive elements for submitting questions or feedback.",
		slug: "contact"
	},
	{
		title: "Subscription Forms",
		description: "Forms for recurring payments, memberships, or services.",
		slug: "subscribe"
	},
	{
		title: "Image Galleries",
		description: "Showcase collections of images.",
		slug: "gallery"
	},
	{
		title: "Menu",
		description: "Showcase food offerings at a restaurant, cafe, or eatery.",
		slug: "menu"
	},
	{
		title: "Event Listings",
		description: "Promote and provide details about upcoming events.",
		slug: "events"
	},
	{
		title: "Blog Posts",
		description: "Articles or entries published on a website's blog.",
		slug: "posts"
	},
	{
		title: "Footers",
		description: "Sections located at the bottom of a website.",
		slug: "footer"
	}
];

const SET_SITE_TITLE_TOOL_NAME = 'setSiteTitle';
const SET_SITE_DESCRIPTION_TOOL_NAME = 'setSiteDescription';
const SET_SITE_TOPIC_TOOL_NAME = 'setSiteTopic';
const SET_SITE_LOCATION_TOOL_NAME = 'setSiteLocation';
const SET_SITE_TYPE_TOOL_NAME = 'setSiteType';
const SET_SITE_PAGES_TOOL_NAME = 'setSitePages';
const SET_PAGE_TITLE_TOOL_NAME = 'setPageTitle';
const SET_PAGE_DESCRIPTION_TOOL_NAME = 'setPageDescription';
const SET_PAGE_CATEGORY_TOOL_NAME = 'setPageCategory';
const availablePageTypesPrompt = pageCategories.map(category => category.slug).join(', ');
patternCategories.map(category => `- ${category.slug}`).join('\n');
const SetSiteTitleTool = createSimpleTool(SET_SITE_TITLE_TOOL_NAME, 'Set the Site Title');
const SetSiteDescriptionTool = createSimpleTool(SET_SITE_DESCRIPTION_TOOL_NAME, 'Set the Site Description');
const SetSiteTopicTool = createSimpleTool(SET_SITE_TOPIC_TOOL_NAME, 'Set the Site Topic');
const SetSiteLocationTool = createSimpleTool(SET_SITE_LOCATION_TOOL_NAME, 'Set the Site Location');
const SetSiteTypeTool = createSimpleTool(SET_SITE_TYPE_TOOL_NAME, 'Set the Site Type');
const SetSitePagesTool = {
  name: SET_SITE_PAGES_TOOL_NAME,
  description: `Set the pages to be used for the site, each with a category, title, and a high-level description of its contents.
Be economical and logical in your site layout, using only the pages you need, with a clear purpose for each.`,
  parameters: {
    type: 'object',
    properties: {
      pages: {
        description: 'A list of pages for the site',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: {
              description: `One of: ${availablePageTypesPrompt}`,
              type: 'string'
            },
            title: {
              type: 'string'
            },
            description: {
              description: 'A high-level description of the page contents',
              type: 'string'
            }
          },
          required: ['title', 'category', 'description']
        }
      }
    },
    required: ['pages']
  }
};
createSimpleTool(SET_PAGE_TITLE_TOOL_NAME, 'Set Page Title');
createSimpleTool(SET_PAGE_DESCRIPTION_TOOL_NAME, 'Set Page Description');
createSimpleTool(SET_PAGE_CATEGORY_TOOL_NAME, 'Set Page Category');

const defaultQuestion = 'What would you like to do with your site settings?';
const defaultChoices = ['Update the site title', 'Update the site description', 'Update the site topic', 'Update the site location', 'Update the site type', 'Add a page'];
const instructions = new DotPromptTemplate({
  template: `You are an expert at gathering requirements from the user to update a site.
 Your current goal is: {{= it.agent.goal }}.
 You are excited to help the user and are encouraging about their progress. You write content that is lively, fun and engaging.
 Complete the task with minimal input using the available tools.`,
  inputVariables: ['agent']
});
const additionalInstructions = new DotPromptTemplate({
  template: `Please attempt to complete the goal: {{= it.agent.goal }}.
 Only ask the user if you absolutely have to.
 Use the inform user tool to inform the user of your decisions.
 Use the ask user tool to ask the user for information.
 Use the "finish" tool when you think you are done.
 Format all content in Markdown. The current state of the Site Spec is:
 siteTitle: {{= it.site.title }},
 siteDescription: {{= it.site.description }},
 siteType: {{= it.site.type }},
 siteTopic: {{= it.site.topic }},
 siteLocation: {{= it.site.location }},
 Pages:
{{~ it.site.pages :page }}
  * {{= page.title }} {{= page.category }}
{{~}}`,
  inputVariables: ['agent', 'site']
});
const getChoicesForSite = site => {
  const choices = [];
  if (!site.title) {
    choices.push('Set the title');
  }
  if (!site.description) {
    choices.push('Set the description');
  }
  if (!site.category) {
    choices.push('Set the category');
  }
  if (!site.topic) {
    choices.push('Set the topic');
  }
  if (!site.location) {
    choices.push('Set the location');
  }
  return choices;
};
class SiteSpecAgent extends BuilderAgent {
  id = 'WPSiteSpec';
  name = 'WPSiteSpec';
  description = 'Here to help you update your site settings.';
  get toolkits() {
    return [...super.toolkits];
  }
  instructions(context) {
    return instructions.format(context);
  }
  additionalInstructions(context) {
    return additionalInstructions.format(context);
  }
  tools(context) {
    return [...super.tools(context), SetSiteTitleTool, SetSiteDescriptionTool, SetSiteTopicTool, SetSiteLocationTool, SetSiteTypeTool, SetSitePagesTool];
  }
  getDefaultQuestion() {
    return defaultQuestion;
  }
  getDefaultChoices() {
    return defaultChoices;
  }
  onStart({
    askUser
  }) {
    askUser({
      question: defaultQuestion,
      choices: defaultChoices
    });
  }
  onConfirm(confirmed, {
    setGoal,
    informUser,
    askUser,
    userSay
  }, {
    site
  }) {
    if (confirmed) {
      setGoal({
        goal: 'Find out what the user wants to do next'
      });
      informUser({
        message: 'Got it!'
      });
      askUser({
        question: 'What would you like to do next?',
        choices: getChoicesForSite(site)
      });
    } else {
      userSay('I would like to make some changes');
      informUser({
        message: 'Looks like you requested some changes'
      });
      askUser({
        question: 'What would you like to change?'
      });
    }
  }
}

const wapuuAgent = new WapuuCLIAgent();
const siteSpecAgent = new SiteSpecAgent();
const agents = [wapuuAgent, siteSpecAgent];
dotenv.config();
const defaultModel = ChatModelService.OPENAI;
const args = minimist$1(process.argv.slice(2));
if (args.help) {
  console.log(`
Usage: node ./agent-cli.js [options]

Options:
  --help              Show this help message and exit
  --agent             The agent to use (default: ${wapuuAgent.id}).
                      Options: ${agents.map(agent => agent.id).join(', ')}
  --model-service     The model to use (default: ${defaultModel}).
                      Options: ${ChatModelService.getAvailable().join(', ')}
  --verbose           Enable verbose logging mode
  `);
  process.exit(0);
}
let assistantMessage = '';
let assistantChoices = null;
const messages = [];
const prompt = promptSync$1();
const modelService = args['model-service'] || defaultModel;
const apiKey = ChatModelService.getDefaultApiKey(modelService);
if (apiKey === undefined) {
  console.error(`No API key found for model service "${modelService}". Add the appropriate key to the .env file.`);
  process.exit(1);
}
const model = ChatModel.getInstance(modelService, ChatModelService.getDefaultApiKey(modelService));
function logVerbose(...stuffToLog) {
  if (args.verbose) {
    console.log(...stuffToLog);
  }
}
function buildMessage() {
  let message = assistantMessage;
  if (assistantChoices) {
    message += '\n\nHere are some choices available to you:\n';
    message += assistantChoices.map((choice, index) => `${index + 1}. ${choice}`).join('\n');
    assistantChoices = null;
  }
  return message;
}
function setActiveAgent(agentId) {
  dispatch(store).setActiveAgent(agentId);
  const agent = select(store).getActiveAgent();
  agent.onStart({
    askUser: ({
      question,
      choices
    }) => {
      assistantMessage = question;
      assistantChoices = choices;
    }
  });
}
function setToolResult(toolId, result) {
  messages.push({
    role: 'tool',
    tool_call_id: toolId,
    content: result
  });
}
async function runCompletion() {
  const agent = select(store).getActiveAgent();
  const toolkits = select(store).getToolkits();

  // Build context
  const context = {
    agents: select(store).getAgents(),
    agent: {
      id: select(store).getActiveAgent()?.id,
      name: select(store).getActiveAgent()?.name,
      assistantId: select(store).getActiveAgent()?.assistantId,
      goal: select(store).getGoal(),
      thought: select(store).getThought()
    },
    site: {
      title: select(store).getSiteTitle(),
      description: select(store).getSiteDescription(),
      type: select(store).getSiteType(),
      topic: select(store).getSiteTopic(),
      location: select(store).getSiteLocation(),
      pages: select(store).getPages()
    }
  };

  // Get callbacks from toolkits
  const callbacks = toolkits.reduce((acc, toolkit) => {
    const toolkitCallbacks = typeof toolkit.callbacks === 'function' ? toolkit.callbacks() : toolkit.callbacks;
    return {
      ...acc,
      ...toolkitCallbacks
    };
  }, {});

  // Get tools from toolkits
  const allTools = toolkits.reduce((acc, toolkit) => {
    const toolkitTools = typeof toolkit.tools === 'function' ? toolkit.tools(context) : toolkit.tools;
    return [...acc, ...toolkitTools.filter(tool => !acc.some(t => t.name === tool.name))];
  }, []);
  // Get agent tools
  let tools = typeof agent.tools === 'function' ? agent.tools(context) : agent.tools;
  // Map string tools to globally registered tool definitions
  tools = tools.map(tool => {
    if (typeof tool === 'string') {
      const registeredTool = allTools.find(t => t.name === tool);
      if (!registeredTool) {
        console.warn('🧠 Tool not found', tool);
      }
      return registeredTool;
    }
    return tool;
  }).filter(Boolean)
  // Remap to an OpenAI tool
  .map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
  const request = {
    model: model.getDefaultModel(),
    messages,
    tools,
    instructions: agent.instructions(context),
    additionalInstructions: agent.additionalInstructions(context),
    temperature: 0.2
  };
  logVerbose('📡 Request:', request);
  const result = await model.run(request);
  logVerbose('🧠 Result:', result, result.tool_calls?.[0].function);
  if (result.tool_calls) {
    // use the first tool call for now
    messages.push(result);
    const tool_call = result.tool_calls[0];

    // parse arguments if they're a string
    const resultArgs = typeof tool_call.function.arguments === 'string' ? JSON.parse(tool_call.function.arguments) : tool_call.function.arguments;

    // see: https://community.openai.com/t/model-tries-to-call-unknown-function-multi-tool-use-parallel/490653/7
    if (tool_call.function.name === 'multi_tool_use.parallel') {
      /**
       * Looks like this:
       * multi_tool_use.parallel({"tool_uses":[{"recipient_name":"WPSiteSpec","parameters":{"title":"Lorem Ipsum","description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.","type":"Blog","topic":"Lorem Ipsum","location":"Lorem Ipsum"}}]})
       *
       * I assume the result is supposed to be an array...
       */
      // create an array of promises for the tool uses
      const promises = resultArgs.tool_uses.map(tool_use => {
        const callback = callbacks[tool_use.recipient_name];
        if (typeof callback === 'function') {
          logVerbose('🔧 Parallel tool callback', tool_use.recipient_name);
          return callback(tool_use.parameters);
        }
        return `Unknown tool ${tool_use.recipient_name}`;
      });
      setToolResult(tool_call.id, await Promise.all(promises));
    }
    const callback = callbacks[tool_call.function.name];
    if (typeof callback === 'function') {
      logVerbose('🔧 Tool callback', tool_call.function.name, resultArgs);
      setToolResult(tool_call.id, await callback(resultArgs));
      const newAgentId = resultArgs.agentId;
      if (newAgentId && newAgentId !== agent.id) {
        logVerbose(`🔄 Switching to new agent ${newAgentId}`);
        setActiveAgent(newAgentId);
      } else {
        await runCompletion();
      }
    } else {
      switch (tool_call.function.name) {
        case AskUserTool.name:
          assistantMessage = resultArgs.question;
          setToolResult(tool_call.id, resultArgs.question);
          break;
        case ConfirmTool.name:
          assistantMessage = resultArgs.message;
          setToolResult(tool_call.id, resultArgs.message);
          break;
        default:
          console.error('Unknown tool callback', tool_call.function.name, resultArgs);
          setToolResult(tool_call.id, '');
      }
    }
  } else {
    assistantMessage = result.content;
  }
}

// register agents
for (const agent of agents) {
  dispatch(store).registerAgent(agent);
}
// set default agent
const argsAgent = args.agent && agents.find(agent => agent.id === args.agent);
if (!argsAgent && args.agent) {
  console.warn(`⚠️  Agent "${args.agent}" not found, defaulting to ${wapuuAgent.id}`);
}
setActiveAgent(argsAgent ? argsAgent.id : wapuuAgent.id);

// register toolkits
dispatch(store).registerToolkit({
  name: 'agents',
  tools: [AskUserTool, ConfirmTool, SetGoalTool, InformTool, createSetAgentTool(select(store).getAgents())],
  callbacks: {
    [InformTool.name]: ({
      message
    }) => {
      dispatch(store).setThought(message);
      return message ? `Agent thinks: "${message}"` : 'Thought cleared';
    },
    [SetGoalTool.name]: ({
      goal: newGoal
    }) => {
      dispatch(store).setGoal(newGoal);
      return `Goal set to "${newGoal}"`;
    },
    [SET_AGENT_TOOL_NAME]: ({
      agentId
    }) => {
      dispatch(store).setActiveAgent(agentId);
      return `Agent set to ${agentId}`;
    }
  }
});
dispatch(store).registerToolkit({
  name: 'site',
  tools: [SetSiteTitleTool, SetSiteDescriptionTool, SetSiteTypeTool, SetSiteTopicTool, SetSiteLocationTool, SetSitePagesTool],
  callbacks: {
    [SetSiteTitleTool.name]: ({
      value
    }) => {
      dispatch(store).setSiteTitle(value);
      return `Site title set to "${value}"`;
    },
    [SetSiteTypeTool.name]: ({
      value
    }) => {
      dispatch(store).setSiteType(value);
      return `Site type set to "${value}"`;
    },
    [SetSiteTopicTool.name]: ({
      value
    }) => {
      dispatch(store).setSiteTopic(value);
      return `Site topic set to "${value}"`;
    },
    [SetSiteLocationTool.name]: ({
      value
    }) => {
      dispatch(store).setSiteLocation(value);
      return `Site location set to "${value}"`;
    },
    [SetSiteDescriptionTool.name]: ({
      value
    }) => {
      dispatch(store).setSiteDescription(value);
      return `Site description set to "${value}"`;
    },
    [SetSitePagesTool.name]: ({
      pages
    }) => {
      dispatch(store).setPages(pages);
      return 'Site pages set';
    }
  }
});
while (true) {
  const message = buildMessage();
  messages.push({
    role: 'assistant',
    content: message
  });
  console.log('===========================================================================================================');
  console.log(`❓ ${message}`);
  console.log('===========================================================================================================');
  const userMessage = prompt('> ');
  if (!userMessage || userMessage.toLowerCase() === 'exit') {
    console.log('Goodbye!');
    process.exit(0);
  }
  messages.push({
    role: 'user',
    content: userMessage
  });
  await runCompletion();
}
//# sourceMappingURL=agent-cli.js.map
