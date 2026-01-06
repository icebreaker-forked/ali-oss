import { isObject } from '../utils/isObject';

const proto: any = {};
export default proto;
/**
 * getObjectTagging
 * @param {String} name - object name
 * @param {Object} options
 * @return {Object}
 */

proto.getObjectTagging = async function getObjectTagging(name, options = {}) {
  options.subres = Object.assign({ tagging: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  name = this._objectName(name);
  const params = this._objectRequestParams('GET', name, options);
  params.successStatuses = [200];
  const result = await this.request(params);
  const Tagging = await this.parseXML(result.data);
  let { Tag } = Tagging.TagSet;
  Tag = Tag && isObject(Tag) ? [Tag] : Tag || [];

  const tag = {};

  Tag.forEach(item => {
    tag[item.Key] = item.Value;
  });

  return {
    status: result.status,
    res: result.res,
    tag
  };
};
