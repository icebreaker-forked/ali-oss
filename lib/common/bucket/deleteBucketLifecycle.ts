import { checkBucketName as _checkBucketName } from '../utils/checkBucketName';

const proto: any = {};
export default proto;

proto.deleteBucketLifecycle = async function deleteBucketLifecycle(name, options) {
  _checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'lifecycle', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res
  };
};
