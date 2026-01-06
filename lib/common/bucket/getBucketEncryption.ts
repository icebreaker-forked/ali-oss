import { checkBucketName as _checkBucketName } from '../utils/checkBucketName';

const proto: any = {};
export default proto;
/**
 * getBucketEncryption
 * @param {String} bucketName - bucket name
 */

proto.getBucketEncryption = async function getBucketEncryption(bucketName) {
  _checkBucketName(bucketName);
  const params = this._bucketRequestParams('GET', bucketName, 'encryption');
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);
  const encryption = result.data.ApplyServerSideEncryptionByDefault;
  return {
    encryption,
    status: result.status,
    res: result.res
  };
};
