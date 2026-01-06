import { Buffer } from 'buffer';
import is from 'is-type-of';
import CryptoJS from 'crypto-js';
import qs from 'qs';
import { lowercaseKeyHeader } from './utils/lowercaseKeyHeader';
import { encodeString } from './utils/encodeString';

/**
 *
 * @param {string} [cloudBoxId]
 * @return {string}
 */
export function getProduct(cloudBoxId?: string) {
  if (cloudBoxId === undefined) return 'oss';
  return 'oss-cloudbox';
}
/**
 *
 * @param {string} region
 * @param {string} [cloudBoxId]
 * @return {string}
 */
export function getSignRegion(region: string, cloudBoxId?: string) {
  if (cloudBoxId === undefined) return region;
  return cloudBoxId;
}

/**
 *
 * @param {String} resourcePath
 * @param {Object} parameters
 * @return
 */
export function buildCanonicalizedResource(resourcePath: string, parameters: any) {
  let canonicalizedResource = `${resourcePath}`;
  let separatorString = '?';

  if (is.string(parameters) && parameters.trim() !== '') {
    canonicalizedResource += separatorString + parameters;
  } else if (is.array(parameters)) {
    parameters.sort();
    canonicalizedResource += separatorString + parameters.join('&');
  } else if (parameters) {
    const processFunc = key => {
      canonicalizedResource += separatorString + key;
      if (parameters[key] || parameters[key] === 0) {
        canonicalizedResource += `=${parameters[key]}`;
      }
      separatorString = '&';
    };
    Object.keys(parameters).sort().forEach(processFunc);
  }

  return canonicalizedResource;
}

/**
 * @param {String} method
 * @param {String} resourcePath
 * @param {Object} request
 * @param {String} expires
 * @return {String} canonicalString
 */
export function buildCanonicalString(method: string, resourcePath: string, request: any, expires?: string) {
  request = request || {};
  const headers = lowercaseKeyHeader(request.headers);
  const OSS_PREFIX = 'x-oss-';
  const ossHeaders = [];
  const headersToSign = {};

  let signContent = [
    method.toUpperCase(),
    headers['content-md5'] || '',
    headers['content-type'],
    expires || headers['x-oss-date']
  ];

  Object.keys(headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.indexOf(OSS_PREFIX) === 0) {
      headersToSign[lowerKey] = String(headers[key]).trim();
    }
  });

  Object.keys(headersToSign)
    .sort()
    .forEach(key => {
      ossHeaders.push(`${key}:${headersToSign[key]}`);
    });

  signContent = signContent.concat(ossHeaders);

  signContent.push(buildCanonicalizedResource(resourcePath, request.parameters));

  return signContent.join('\n');
}

/**
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
export function computeSignature(
  accessKeySecret: string,
  canonicalString: string,
  headerEncoding: BufferEncoding = 'utf-8'
) {
  const message =
    headerEncoding === 'latin1'
      ? CryptoJS.enc.Latin1.parse(canonicalString)
      : CryptoJS.enc.Utf8.parse(canonicalString);
  const signature = CryptoJS.HmacSHA1(message, accessKeySecret);
  return CryptoJS.enc.Base64.stringify(signature);
}

/**
 * @param {String} accessKeyId
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
export function authorization(
  accessKeyId: string,
  accessKeySecret: string,
  canonicalString: string,
  headerEncoding: BufferEncoding
) {
  return `OSS ${accessKeyId}:${computeSignature(accessKeySecret, canonicalString, headerEncoding)}`;
}

/**
 * @param {string[]} [additionalHeaders]
 * @returns {string[]}
 */
export const fixAdditionalHeaders = (additionalHeaders?: string[]) => {
  if (!additionalHeaders) {
    return [];
  }

  const OSS_PREFIX = 'x-oss-';

  return [...new Set(additionalHeaders.map(v => v.toLowerCase()))]
    .filter(v => {
      return v !== 'content-type' && v !== 'content-md5' && !v.startsWith(OSS_PREFIX);
    })
    .sort();
};

/**
 * @param {string} method
 * @param {Object} request
 * @param {Object} request.headers
 * @param {Object} [request.queries]
 * @param {string} [bucketName]
 * @param {string} [objectName]
 * @param {string[]} [additionalHeaders] additional headers after deduplication, lowercase and sorting
 * @returns {string}
 */
export function getCanonicalRequest(
  method: string,
  request: any,
  bucketName?: string,
  objectName?: string,
  additionalHeaders?: string[]
) {
  const headers = lowercaseKeyHeader(request.headers);
  const queries = request.queries || {};
  const OSS_PREFIX = 'x-oss-';

  if (objectName && !bucketName) {
    throw Error('Please ensure that bucketName is passed into getCanonicalRequest.');
  }

  const signContent = [
    method.toUpperCase(), // HTTP Verb
    encodeString(`/${bucketName ? `${bucketName}/` : ''}${objectName || ''}`).replace(/%2F/g, '/') // Canonical URI
  ];

  // Canonical Query String
  signContent.push(
    qs.stringify(queries, {
      encoder: encodeString,
      sort: (a, b) => a.localeCompare(b),
      strictNullHandling: true
    })
  );

  // Canonical Headers
  if (additionalHeaders) {
    additionalHeaders.forEach(v => {
      if (!Object.prototype.hasOwnProperty.call(headers, v)) {
        throw Error(`Can't find additional header ${v} in request headers.`);
      }
    });
  }

  const tempHeaders = new Set(additionalHeaders);

  Object.keys(headers).forEach(v => {
    if (v === 'content-type' || v === 'content-md5' || v.startsWith(OSS_PREFIX)) {
      tempHeaders.add(v);
    }
  });

  const canonicalHeaders = `${[...tempHeaders]
    .sort()
    .map(v => `${v}:${is.string(headers[v]) ? headers[v].trim() : headers[v]}\n`)
    .join('')}`;

  signContent.push(canonicalHeaders);

  // Additional Headers
  if (additionalHeaders && additionalHeaders.length > 0) {
    signContent.push(additionalHeaders.join(';'));
  } else {
    signContent.push('');
  }

  // Hashed Payload
  signContent.push(headers['x-oss-content-sha256'] || 'UNSIGNED-PAYLOAD');

  return signContent.join('\n');
}

/**
 * @param {string} date yyyymmdd
 * @param {string} region Standard region, e.g. cn-hangzhou
 * @param {string} [accessKeyId] Access Key ID
 * @param {string} [product] Product name, default is oss
 * @returns {string}
 */
export function getCredential(date: string, region: string, accessKeyId?: string, product = 'oss') {
  const tempCredential = `${date}/${region}/${product}/aliyun_v4_request`;

  if (accessKeyId) {
    return `${accessKeyId}/${tempCredential}`;
  }

  return tempCredential;
}

/**
 * @param {string} region Standard region, e.g. cn-hangzhou
 * @param {string} date ISO8601 UTC:yyyymmdd'T'HHMMss'Z'
 * @param {string} canonicalRequest
 * @param {string} [product]
 * @returns {string}
 */
export function getStringToSign(region: string, date: string, canonicalRequest: string, product = 'oss') {
  const stringToSign = [
    'OSS4-HMAC-SHA256',
    date, // TimeStamp
    getCredential(date.split('T')[0], region, undefined, product), // Scope
    CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex) // Hashed Canonical Request
  ];

  return stringToSign.join('\n');
}

/**
 * @param {String} accessKeySecret
 * @param {string} date yyyymmdd
 * @param {string} region Standard region, e.g. cn-hangzhou
 * @param {string} stringToSign
 * @param {string} [product]
 * @returns {string}
 */
export function getSignatureV4(accessKeySecret: string, date: string, region: string, stringToSign: string, product = 'oss') {
  const signingDate = CryptoJS.HmacSHA256(date, `aliyun_v4${accessKeySecret}`);
  const signingRegion = CryptoJS.HmacSHA256(region, signingDate);
  const signingOss = CryptoJS.HmacSHA256(product, signingRegion);
  const signingKey = CryptoJS.HmacSHA256('aliyun_v4_request', signingOss);
  return CryptoJS.HmacSHA256(stringToSign, signingKey).toString(CryptoJS.enc.Hex);
}

/**
 * @param {String} accessKeyId
 * @param {String} accessKeySecret
 * @param {string} region Standard region, e.g. cn-hangzhou
 * @param {string} method
 * @param {Object} request
 * @param {Object} request.headers
 * @param {Object} [request.queries]
 * @param {string} [bucketName]
 * @param {string} [objectName]
 * @param {string[]} [additionalHeaders]
 * @param {string} [headerEncoding='utf-8']
 * @param {string} [cloudBoxId]
 * @returns {string}
 */
export function authorizationV4(
  accessKeyId: string,
  accessKeySecret: string,
  region: string,
  method: string,
  request: any,
  bucketName?: string,
  objectName?: string,
  additionalHeaders?: string[],
  headerEncoding: BufferEncoding = 'utf-8',
  cloudBoxId?: string
) {
  const product = getProduct(cloudBoxId);
  const fixedAdditionalHeaders = fixAdditionalHeaders(additionalHeaders);
  const fixedHeaders: any = {};
  Object.entries((request && request.headers) || {}).forEach(([k, v]: any) => {
    fixedHeaders[k] = is.string(v) ? Buffer.from(String(v), headerEncoding).toString() : v;
  });
  const date: string = fixedHeaders['x-oss-date'] || (request.queries && request.queries['x-oss-date']);
  const canonicalRequest = getCanonicalRequest(
    method,
    {
      headers: fixedHeaders,
      queries: request.queries
    },
    bucketName,
    objectName,
    fixedAdditionalHeaders
  );
  const stringToSign = getStringToSign(region, date, canonicalRequest, product);
  const onlyDate = date.split('T')[0];
  const signatureValue = getSignatureV4(accessKeySecret, onlyDate, region, stringToSign, product);
  const additionalHeadersValue =
    fixedAdditionalHeaders.length > 0 ? `AdditionalHeaders=${fixedAdditionalHeaders.join(';')},` : '';

  return `OSS4-HMAC-SHA256 Credential=${getCredential(
    onlyDate,
    region,
    accessKeyId,
    product
  )},${additionalHeadersValue}Signature=${signatureValue}`;
}

/**
 *
 * @param {String} accessKeySecret
 * @param {Object} options
 * @param {String} resource
 * @param {Number} expires
 */
export function _signatureForURL(
  accessKeySecret: string,
  options: any = {},
  resource: string,
  expires: number,
  headerEncoding?: BufferEncoding
) {
  const headers: any = {};
  const subResource: any = (options as any).subResource || {};

  if ((options as any).process) {
    const processKeyword = 'x-oss-process';
    subResource[processKeyword] = (options as any).process;
  }

  if ((options as any).trafficLimit) {
    const trafficLimitKey = 'x-oss-traffic-limit';
    subResource[trafficLimitKey] = (options as any).trafficLimit;
  }

  if ((options as any).response) {
    Object.keys((options as any).response).forEach(k => {
      const key = `response-${k.toLowerCase()}`;
      subResource[key] = (options as any).response[k];
    });
  }

  Object.keys(options as any).forEach(key => {
    const lowerKey = key.toLowerCase();
    const value = (options as any)[key];
    if (lowerKey.indexOf('x-oss-') === 0) {
      headers[lowerKey] = value;
    } else if (lowerKey.indexOf('content-md5') === 0) {
      headers[key] = value;
    } else if (lowerKey.indexOf('content-type') === 0) {
      headers[key] = value;
    }
  });

  if (Object.prototype.hasOwnProperty.call(options as any, 'security-token')) {
    subResource['security-token'] = (options as any)['security-token'];
  }

  if (Object.prototype.hasOwnProperty.call(options as any, 'callback')) {
    const json = {
      callbackUrl: encodeURI((options as any).callback.url),
      callbackBody: (options as any).callback.body
    };
    if ((options as any).callback.host) {
      (json as any).callbackHost = (options as any).callback.host;
    }
    if ((options as any).callback.contentType) {
      (json as any).callbackBodyType = (options as any).callback.contentType;
    }
    if ((options as any).callback.callbackSNI) {
      (json as any).callbackSNI = (options as any).callback.callbackSNI;
    }
    subResource.callback = Buffer.from(JSON.stringify(json)).toString('base64');

    if ((options as any).callback.customValue) {
      const callbackVar = {};
      Object.keys((options as any).callback.customValue).forEach(key => {
        callbackVar[`x:${key}`] = (options as any).callback.customValue[key];
      });
      subResource['callback-var'] = Buffer.from(JSON.stringify(callbackVar)).toString('base64');
    }
  }

  const canonicalString = buildCanonicalString(
    (options as any).method,
    resource,
    {
      headers,
      parameters: subResource
    },
    expires.toString()
  );

  return {
    Signature: computeSignature(accessKeySecret, canonicalString, headerEncoding),
    subResource
  };
}
