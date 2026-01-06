import { checkBucketName as _checkBucketName } from '../utils/checkBucketName';

const proto: any = {};
export default proto;

proto.deleteBucketWebsite = async function deleteBucketWebsite(name, options) {
  _checkBucketName(name);
  const params = this._bucketRequestParams('DELETE', name, 'website', options);
  params.successStatuses = [204];
  const result = await this.request(params);
  return {
    res: result.res
  };
};
