import { checkBucketName as _checkBucketName } from '../utils/checkBucketName';
import { policy2Str } from '../utils/policy2Str';
import { isObject } from '../utils/isObject';

const proto: any = {};
export default proto;
/**
 * putBucketPolicy
 * @param {String} bucketName - bucket name
 * @param {Object} policy - bucket policy
 * @param {Object} options
 */

proto.putBucketPolicy = async function putBucketPolicy(bucketName, policy, options = {}) {
  _checkBucketName(bucketName);

  if (!isObject(policy)) {
    throw new Error('policy is not Object');
  }
  const params = this._bucketRequestParams('PUT', bucketName, 'policy', options);
  params.content = policy2Str(policy);
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res
  };
};
