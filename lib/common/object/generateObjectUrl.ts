import { isIP } from '../utils/isIP';

const proto: any = {};
export default proto;

/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`, will use `baseUrl` instead the default `endpoint and bucket`.
 * @return {String} object url include bucket
 */
proto.generateObjectUrl = function generateObjectUrl(name, baseUrl) {
  if (isIP(this.options.endpoint.hostname)) {
    throw new Error('can not get the object URL when endpoint is IP');
  }
  if (!baseUrl) {
    baseUrl = this.options.endpoint.href || String(this.options.endpoint);
    const copyUrl = new URL(baseUrl);
    const { bucket } = this.options;

    copyUrl.hostname = `${bucket}.${copyUrl.hostname}`;
    baseUrl = copyUrl.toString();
  } else if (baseUrl[baseUrl.length - 1] !== '/') {
    baseUrl += '/';
  }
  return baseUrl + this._escape(this._objectName(name));
};
