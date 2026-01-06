import { checkBucketName as _checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';
import { isArray } from '../utils/isArray';

const proto: any = {};
export default proto;
proto.putBucketWebsite = async function putBucketWebsite(name, config = {}, options) {
  _checkBucketName(name);
  const params = this._bucketRequestParams('PUT', name, 'website', options);
  const IndexDocument = {
    Suffix: config.index || 'index.html'
  };
  const WebsiteConfiguration = {
    IndexDocument
  };
  let website = {
    WebsiteConfiguration
  };

  if (config.supportSubDir) {
    IndexDocument.SupportSubDir = config.supportSubDir;
  }

  if (config.type) {
    IndexDocument.Type = config.type;
  }

  if (config.error) {
    WebsiteConfiguration.ErrorDocument = {
      Key: config.error
    };
  }

  if (config.routingRules !== undefined) {
    if (!isArray(config.routingRules)) {
      throw new Error('RoutingRules must be Array');
    }
    WebsiteConfiguration.RoutingRules = {
      RoutingRule: config.routingRules
    };
  }

  website = obj2xml(website);
  params.content = website;
  params.mime = 'xml';
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res
  };
};
