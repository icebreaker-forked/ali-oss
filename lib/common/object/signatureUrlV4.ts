import dateFormat from 'dateformat';

import {
  fixAdditionalHeaders,
  getCanonicalRequest,
  getCredential,
  getProduct,
  getSignRegion,
  getSignatureV4,
  getStringToSign
} from '../../common/signUtils';
import { setSTSToken } from '../utils/setSTSToken';
import { isFunction } from '../utils/isFunction';
import { getStandardRegion } from '../utils/getStandardRegion';

const proto: any = {};
export default proto;

/**
 * signatureUrlV4
 *
 * @param {string} method
 * @param {number} expires
 * @param {Object} [request]
 * @param {Object} [request.headers]
 * @param {Object} [request.queries]
 * @param {string} [objectName]
 * @param {string[]} [additionalHeaders]
 */
proto.signatureUrlV4 = async function signatureUrlV4(method, expires, request, objectName, additionalHeaders) {
  const { cloudBoxId } = this.options;
  const product = getProduct(cloudBoxId);
  const signRegion = getSignRegion(getStandardRegion(this.options.region), cloudBoxId);
  const headers = (request && request.headers) || {};
  const queries = Object.assign({}, (request && request.queries) || {});
  const date = new Date();
  const formattedDate = dateFormat(date, "UTC:yyyymmdd'T'HHMMss'Z'");
  const onlyDate = formattedDate.split('T')[0];
  const fixedAdditionalHeaders = fixAdditionalHeaders(additionalHeaders);

  if (fixedAdditionalHeaders.length > 0) {
    queries['x-oss-additional-headers'] = fixedAdditionalHeaders.join(';');
  }
  queries['x-oss-credential'] = getCredential(onlyDate, signRegion, this.options.accessKeyId, product);
  queries['x-oss-date'] = formattedDate;
  queries['x-oss-expires'] = expires;
  queries['x-oss-signature-version'] = 'OSS4-HMAC-SHA256';

  if (this.options.stsToken && isFunction(this.options.refreshSTSToken)) {
    await setSTSToken.call(this);
  }

  if (this.options.stsToken) {
    queries['x-oss-security-token'] = this.options.stsToken;
  }

  const canonicalRequest = getCanonicalRequest(
    method,
    {
      headers,
      queries
    },
    this.options.bucket,
    objectName,
    fixedAdditionalHeaders
  );
  const stringToSign = getStringToSign(signRegion, formattedDate, canonicalRequest, product);

  queries['x-oss-signature'] = getSignatureV4(
    this.options.accessKeySecret,
    onlyDate,
    signRegion,
    stringToSign,
    product
  );

  const signedUrl = new URL(
    this._getReqUrl({
      bucket: this.options.bucket,
      object: objectName
    })
  );
  Object.keys(queries).forEach(key => {
    const value = queries[key];
    signedUrl.searchParams.set(key, value === null || value === undefined ? '' : String(value));
  });

  return signedUrl.toString();
};
