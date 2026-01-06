import { isObject } from '../utils/isObject';

const proto: any = {};
export default proto;
/**
 * get
 * @param {String} name - object name
 * @param {String | Stream | Object} file - file path or file stream or options
 * @param {Object} options
 * @param {{res}}
 */
proto.get = async function get(name, file, options = {}) {
  if (isObject(file)) {
    // get(name, options)
    options = file;
    file = null;
  } else if (file != null) {
    throw new Error('Browser-only build: get(name, file, ...) is not supported. Use get(name, options) instead.');
  }

  options = options || {};
  const isBrowserEnv = typeof process !== 'undefined' && process && process.browser;
  const responseCacheControl = options.responseCacheControl === null ? '' : 'no-cache';
  const defaultSubresOptions =
    isBrowserEnv && responseCacheControl ? { 'response-cache-control': responseCacheControl } : {};
  options.subres = Object.assign(defaultSubresOptions, options.subres);

  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  if (options.process) {
    options.subres['x-oss-process'] = options.process;
  }

  let result;
  const params = this._objectRequestParams('GET', name, options);
  params.successStatuses = [200, 206, 304];
  result = await this.request(params);

  return {
    res: result.res,
    content: result.data
  };
};
