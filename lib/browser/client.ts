import createDebug from 'debug';
import merge from 'merge-descriptors';
import platform from 'platform';
import bowser from 'bowser';
import urllib from './urllib';
import { version } from '../version';
import * as signUtils from '../common/signUtils';
import initOptions from '../common/client/initOptions';
import { createRequest } from '../common/utils/createRequest';
import { encoder } from '../common/utils/encoder';
import { getReqUrl } from '../common/client/getReqUrl';
import { setSTSToken } from '../common/utils/setSTSToken';
import { retry } from '../common/utils/retry';
import { isFunction } from '../common/utils/isFunction';
import { getStandardRegion } from '../common/utils/getStandardRegion';
import objectOps from './object';
import bucketOps from './bucket';
import getBucketWebsite from '../common/bucket/getBucketWebsite';
import putBucketWebsite from '../common/bucket/putBucketWebsite';
import deleteBucketWebsite from '../common/bucket/deleteBucketWebsite';
import getBucketLifecycle from '../common/bucket/getBucketLifecycle';
import putBucketLifecycle from '../common/bucket/putBucketLifecycle';
import deleteBucketLifecycle from '../common/bucket/deleteBucketLifecycle';
import putBucketVersioning from '../common/bucket/putBucketVersioning';
import getBucketVersioning from '../common/bucket/getBucketVersioning';
import * as getBucketInventoryOps from '../common/bucket/getBucketInventory';
import * as deleteBucketInventoryOps from '../common/bucket/deleteBucketInventory';
import * as listBucketInventoryOps from '../common/bucket/listBucketInventory';
import * as putBucketInventoryOps from '../common/bucket/putBucketInventory';
import * as abortBucketWormOps from '../common/bucket/abortBucketWorm';
import * as completeBucketWormOps from '../common/bucket/completeBucketWorm';
import * as extendBucketWormOps from '../common/bucket/extendBucketWorm';
import * as getBucketWormOps from '../common/bucket/getBucketWorm';
import * as initiateBucketWormOps from '../common/bucket/initiateBucketWorm';
import managedUploadOps from './managed-upload';
import multipartCopyOps from '../common/multipart-copy';
import multipartOps from '../common/multipart';
import parallelOps from '../common/parallel';

const debug = createDebug('ali-oss');

function _unSupportBrowserTip() {
  const { name, version } = platform;
  if (name && name.toLowerCase && name.toLowerCase() === 'ie' && version.split('.')[0] < 10) {
    // eslint-disable-next-line no-console
    console.warn('ali-oss does not support the current browser');
  }
}
// check local web protocol,if https secure default set true , if http secure default set false
function isHttpsWebProtocol() {
  // for web worker not use window.location.
  // eslint-disable-next-line no-restricted-globals
  return location && location.protocol === 'https:';
}

function Client(this: any, options: any, ctx: any) {
  _unSupportBrowserTip();
  if (!(this instanceof Client)) {
    return new (Client as any)(options, ctx);
  }
  const self: any = this;
  if (options && options.inited) {
    self.options = options;
  } else {
    self.options = (Client as any).initOptions(options);
  }

  self.options.cancelFlag = false; // cancel flag: if true need to be cancelled, default false

  // support custom agent and urllib client
  if (self.options.urllib) {
    self.urllib = self.options.urllib;
  } else {
    self.urllib = urllib;
  }
  self.ctx = ctx;
  self.userAgent = self._getUserAgent();
  self.stsTokenFreshTime = new Date();

  // record the time difference between client and server
  self.options.amendTimeSkewed = 0;
}

export default Client;

Client.initOptions = function initOptions(options) {
  if (!options.stsToken) {
    console.warn(
      'Please use STS Token for safety, see more details at https://help.aliyun.com/document_detail/32077.html'
    );
  }
  const opts = Object.assign(
    {
      secure: isHttpsWebProtocol(),
      // for browser compatibility disable fetch.
      useFetch: false
    },
    options
  );

  return initOptions(opts);
};

/**
 * prototype
 */

const proto = Client.prototype;

// mount debug on proto
proto.debug = debug;

/**
 * Object operations
 */
merge(proto, objectOps);
/**
 * Bucket operations
 */
merge(proto, bucketOps);
merge(proto, getBucketWebsite);
merge(proto, putBucketWebsite);
merge(proto, deleteBucketWebsite);

// lifecycle
merge(proto, getBucketLifecycle);
merge(proto, putBucketLifecycle);
merge(proto, deleteBucketLifecycle);

// multiversion
merge(proto, putBucketVersioning);
merge(proto, getBucketVersioning);

// inventory
merge(proto, getBucketInventoryOps);
merge(proto, deleteBucketInventoryOps);
merge(proto, listBucketInventoryOps);
merge(proto, putBucketInventoryOps);

// worm
merge(proto, abortBucketWormOps);
merge(proto, completeBucketWormOps);
merge(proto, extendBucketWormOps);
merge(proto, getBucketWormOps);
merge(proto, initiateBucketWormOps);

// multipart upload
merge(proto, managedUploadOps);
/**
 * common multipart-copy support node and browser
 */
merge(proto, multipartCopyOps);
/**
 * Multipart operations
 */
merge(proto, multipartOps);

/**
 * Common module parallel
 */
merge(proto, parallelOps);

/**
 * get OSS signature
 * @param {String} stringToSign
 * @return {String} the signature
 */
proto.signature = function signature(stringToSign) {
  this.debug('authorization stringToSign: %s', stringToSign, 'info');

  return signUtils.computeSignature(this.options.accessKeySecret, stringToSign, this.options.headerEncoding);
};

proto._getReqUrl = getReqUrl;

/**
 * get author header
 *
 * "Authorization: OSS " + Access Key Id + ":" + Signature
 *
 * Signature = base64(hmac-sha1(Access Key Secret + "\n"
 *  + VERB + "\n"
 *  + CONTENT-MD5 + "\n"
 *  + CONTENT-TYPE + "\n"
 *  + DATE + "\n"
 *  + CanonicalizedOSSHeaders
 *  + CanonicalizedResource))
 *
 * @param {String} method
 * @param {String} resource
 * @param {Object} header
 * @return {String}
 *
 * @api private
 */

proto.authorization = function authorization(method, resource, subres, headers) {
  const stringToSign = signUtils.buildCanonicalString(method.toUpperCase(), resource, {
    headers,
    parameters: subres
  });

  return signUtils.authorization(
    this.options.accessKeyId,
    this.options.accessKeySecret,
    stringToSign,
    this.options.headerEncoding
  );
};

/**
 * get authorization header v4
 *
 * @param {string} method
 * @param {Object} requestParams
 * @param {Object} requestParams.headers
 * @param {(string|string[]|Object)} [requestParams.queries]
 * @param {string} [bucketName]
 * @param {string} [objectName]
 * @param {string[]} [additionalHeaders]
 * @return {string}
 *
 * @api private
 */
proto.authorizationV4 = function authorizationV4(method, requestParams, bucketName, objectName, additionalHeaders) {
  return signUtils.authorizationV4(
    this.options.accessKeyId,
    this.options.accessKeySecret,
    getStandardRegion(this.options.region),
    method,
    requestParams,
    bucketName,
    objectName,
    additionalHeaders,
    this.options.headerEncoding,
    undefined
  );
};

/**
 * request oss server
 * @param {Object} params
 *   - {String} object
 *   - {String} bucket
 *   - {Object} [headers]
 *   - {Object} [query]
 *   - {Buffer} [content]
 *   - {Stream} [stream]
 *   - {Stream} [writeStream]
 *   - {String} [mime]
 *   - {Boolean} [xmlResponse]
 *   - {Boolean} [customResponse]
 *   - {Number} [timeout]
 *   - {Object} [ctx] request context, default is `this.ctx`
 *
 * @api private
 */

proto.request = async function (params) {
  if (this.options.retryMax) {
    return await retry(request.bind(this), this.options.retryMax, {
      errorHandler: err => {
        const _errHandle = _err => {
          if (params.stream) return false;
          const statusErr = [-1, -2].includes(_err.status);
          const requestErrorRetryHandle = this.options.requestErrorRetryHandle || (() => true);
          return statusErr && requestErrorRetryHandle(_err);
        };
        if (_errHandle(err)) return true;
        return false;
      }
    })(params);
  } else {
    return request.call(this, params);
  }
};

async function request(params) {
  if (this.options.stsToken && isFunction(this.options.refreshSTSToken)) {
    await setSTSToken.call(this);
  }
  const reqParams = createRequest.call(this, params);
  if (!this.options.useFetch) {
    reqParams.params.mode = 'disable-fetch';
  }
  let result;
  let reqErr;
  const useStream = !!params.stream;
  try {
    result = await this.urllib.request(reqParams.url, reqParams.params);
    this.debug(
      'response %s %s, got %s, headers: %j',
      params.method,
      reqParams.url,
      result.status,
      result.headers,
      'info'
    );
  } catch (err) {
    reqErr = err;
  }
  let err;
  if (result && params.successStatuses && params.successStatuses.indexOf(result.status) === -1) {
    err = await this.requestError(result);
    // not use stream
    if (err.code === 'RequestTimeTooSkewed' && !useStream) {
      this.options.amendTimeSkewed = +new Date(String(err.serverTime)) - +new Date();
      return await this.request(params);
    }
    err.params = params;
  } else if (reqErr) {
    err = await this.requestError(reqErr);
  }

  if (err) {
    throw err;
  }

  if (params.xmlResponse) {
    const parseData = await this.parseXML(result.data);
    result.data = parseData;
  }
  return result;
}

proto._getResource = function _getResource(params) {
  let resource = '/';
  if (params.bucket) resource += `${params.bucket}/`;
  if (params.object) resource += encoder(params.object, this.options.headerEncoding);

  return resource;
};

proto._escape = function _escape(name) {
  return encodeURIComponent(name).replace(/%2F/g, '/');
};

/*
 * Get User-Agent for browser & node.js
 * @example
 *   aliyun-sdk-nodejs/4.1.2 Node.js 5.3.0 on Darwin 64-bit
 *   aliyun-sdk-js/4.1.2 Safari 9.0 on Apple iPhone(iOS 9.2.1)
 *   aliyun-sdk-js/4.1.2 Chrome 43.0.2357.134 32-bit on Windows Server 2008 R2 / 7 64-bit
 */

proto._getUserAgent = function _getUserAgent() {
  const agent = typeof process !== 'undefined' && (process as any) && (process as any).browser ? 'js' : 'nodejs';
  const sdk = `aliyun-sdk-${agent}/${version}`;
  let plat = platform.description;
  if (!plat && process) {
    plat = `Node.js ${process.version.slice(1)} on ${process.platform} ${process.arch}`;
  }

  return this._checkUserAgent(`${sdk} ${plat}`);
};

proto._checkUserAgent = function _checkUserAgent(ua) {
  const userAgent = ua.replace(/\u03b1/, 'alpha').replace(/\u03b2/, 'beta');
  return userAgent;
};

/*
 * Check Browser And Version
 * @param {String} [name] browser name: like IE, Chrome, Firefox
 * @param {String} [version] browser major version: like 10(IE 10.x), 55(Chrome 55.x), 50(Firefox 50.x)
 * @return {Bool} true or false
 * @api private
 */

proto.checkBrowserAndVersion = function checkBrowserAndVersion(name, version) {
  return bowser.name === name && String(bowser.version).split('.')[0] === version;
};

/**
 * thunkify xml.parseString
 * @param {String|Buffer} str
 *
 * @api private
 */

proto.parseXML = function parseXMLThunk(str) {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(str)) {
      str = str.toString();
    }
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(String(str), 'application/xml');
      const parseError = doc.getElementsByTagName('parsererror')[0];
      if (parseError) {
        reject(new Error(parseError.textContent || 'XML parse error'));
        return;
      }

      const elementToValue = el => {
      const nodes = Array.from((el as any).childNodes || []) as any[];
      const childElements = nodes.filter(n => n && n.nodeType === 1);
      const text = nodes
        .filter(n => n && (n.nodeType === 3 || n.nodeType === 4))
        .map(n => n.nodeValue || '')
        .join('')
        .trim();

        if (childElements.length === 0) return text;

        const obj = {};
        childElements.forEach((child: any) => {
          const key = child.nodeName;
          const value = elementToValue(child);
          if (obj[key] === undefined) obj[key] = value;
          else if (Array.isArray(obj[key])) obj[key].push(value);
          else obj[key] = [obj[key], value];
        });
        return obj;
      };

      resolve(elementToValue(doc.documentElement));
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * generater a request error with request response
 * @param {Object} result
 *
 * @api private
 */

proto.requestError = async function requestError(result) {
  let err = null;
  const setError = async message => {
    let info;
    try {
      info = (await this.parseXML(message)) || {};
    } catch (error) {
      this.debug(message, 'error');
      error.message += `\nraw xml: ${message}`;
      error.status = result.status;
      error.requestId = result.headers && result.headers['x-oss-request-id'];
      return error;
    }

    let msg = info.Message || `unknow request error, status: ${result.status}`;
    if (info.Condition) {
      msg += ` (condition: ${info.Condition})`;
    }
    err = new Error(msg);
    err.name = info.Code ? `${info.Code}Error` : 'UnknownError';
    err.status = result.status;
    err.code = info.Code;
    err.ecCode = info.EC;
    err.requestId = info.RequestId;
    err.hostId = info.HostId;
    err.serverTime = info.ServerTime;
    return err;
  };

  if (!result.data || !result.data.length) {
    if (result.status === -1 || result.status === -2) {
      // -1 is net error , -2 is timeout
      err = new Error(result.message);
      err.name = result.name;
      err.status = result.status;
      err.code = result.name;
    } else {
      // HEAD not exists resource
      if (result.status === 404) {
        err = new Error('Object not exists');
        err.name = 'NoSuchKeyError';
        err.status = 404;
        err.code = 'NoSuchKey';
      } else if (result.status === 412) {
        err = new Error('Pre condition failed');
        err.name = 'PreconditionFailedError';
        err.status = 412;
        err.code = 'PreconditionFailed';
      } else {
        err = new Error(`Unknow error, status: ${result.status}`);
        err.name = 'UnknownError';
        err.status = result.status;
        err.res = result;
        const ossErr = result.headers && result.headers['x-oss-err'];
        if (ossErr) {
          const message = atob(ossErr);
          err = await setError(message);
        }
      }
      err.requestId = result.headers && result.headers['x-oss-request-id'];
      err.host = '';
    }
  } else {
    const message = String(result.data);
    this.debug('request response error data: %s', message, 'error');

    err = await setError(message);
  }

  this.debug('generate error %j', err, 'error');
  return err;
};
