import { checkBucketName as _checkBucketName } from '../utils/checkBucketName';

const proto: any = {};
export default proto;
/**
 * getBucketRequestPayment
 * @param {String} bucketName - bucket name
 * @param {Object} options
 */

proto.getBucketRequestPayment = async function getBucketRequestPayment(bucketName, options) {
  options = options || {};

  _checkBucketName(bucketName);
  const params = this._bucketRequestParams('GET', bucketName, 'requestPayment', options);
  params.successStatuses = [200];
  params.xmlResponse = true;

  const result = await this.request(params);

  return {
    status: result.status,
    res: result.res,
    payer: result.data.Payer
  };
};
