import copy from 'copy-to';
import { _signatureForURL } from '../../common/signUtils';
import { isIP } from '../utils/isIP';
import { setSTSToken } from '../utils/setSTSToken';
import { isFunction } from '../utils/isFunction';

const proto: any = {};
export default proto;

/**
 * asyncSignatureUrl
 * @param {String} name object name
 * @param {Object} options options
 * @param {boolean} [strictObjectNameValidation=true] the flag of verifying object name strictly
 */
proto.asyncSignatureUrl = async function asyncSignatureUrl(name, options, strictObjectNameValidation = true) {
  if (isIP(this.options.endpoint.hostname)) {
    throw new Error('can not get the object URL when endpoint is IP');
  }

  if (strictObjectNameValidation && /^\?/.test(name)) {
    throw new Error(`Invalid object name ${name}`);
  }

  options = options || {};
  name = this._objectName(name);
  options.method = options.method || 'GET';
  const expires = Math.round(Date.now() / 1000) + (options.expires || 1800);
  const params = {
    bucket: this.options.bucket,
    object: name
  };

  const resource = this._getResource(params);

  if (this.options.stsToken && isFunction(this.options.refreshSTSToken)) {
    await setSTSToken.call(this);
  }

  if (this.options.stsToken) {
    options['security-token'] = this.options.stsToken;
  }

  const signRes = _signatureForURL(this.options.accessKeySecret, options, resource, expires);

  const url = new URL(this._getReqUrl(params));
  url.searchParams.set('OSSAccessKeyId', this.options.accessKeyId);
  url.searchParams.set('Expires', String(expires));
  url.searchParams.set('Signature', signRes.Signature);

  const subResource = {};
  copy(signRes.subResource).to(subResource);
  Object.keys(subResource).forEach(key => {
    const value = subResource[key];
    url.searchParams.set(key, value === null || value === undefined ? '' : String(value));
  });

  return url.toString();
};
