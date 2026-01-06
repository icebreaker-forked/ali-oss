import { checkBucketName as _checkBucketName } from '../utils/checkBucketName';
import { formatTag } from '../utils/formatTag';

const proto: any = {};
export default proto;
/**
 * getBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 * @return {Object}
 */

proto.getBucketTags = async function getBucketTags(name, options = {}) {
  _checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'tagging', options);
  params.successStatuses = [200];
  const result = await this.request(params);
  const Tagging = await this.parseXML(result.data);

  return {
    status: result.status,
    res: result.res,
    tag: formatTag(Tagging)
  };
};
