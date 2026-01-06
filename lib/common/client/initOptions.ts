import ms from 'humanize-ms';
import { checkBucketName as _checkBucketName } from '../utils/checkBucketName';
import { setRegion } from '../utils/setRegion';
import { checkConfigValid } from '../utils/checkConfigValid';

function setEndpoint(endpoint, secure) {
  checkConfigValid(endpoint, 'endpoint');
  const withProtocol = String(endpoint).includes('://') ? String(endpoint) : `http${secure ? 's' : ''}://${endpoint}`;
  const url = new URL(withProtocol);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Endpoint protocol must be http or https.');
  }

  return url;
}

export default function initOptions(options: any) {
  if (!options || !options.accessKeyId || !options.accessKeySecret) {
    throw new Error('require accessKeyId, accessKeySecret');
  }
  if (options.stsToken && !options.refreshSTSToken && !options.refreshSTSTokenInterval) {
    console.warn(
      "It's recommended to set 'refreshSTSToken' and 'refreshSTSTokenInterval' to refresh" +
        ' stsToken、accessKeyId、accessKeySecret automatically when sts token has expired'
    );
  }
  if (options.bucket) {
    _checkBucketName(options.bucket);
  }
  const opts = Object.assign(
    {
      region: 'oss-cn-hangzhou',
      internal: false,
      secure: false,
      timeout: 60000,
      bucket: null,
      endpoint: null,
      cname: false,
      isRequestPay: false,
      sldEnable: false,
      headerEncoding: 'utf-8',
      refreshSTSToken: null,
      refreshSTSTokenInterval: 60000 * 5,
      retryMax: 0,
      authorizationV4: false // 启用v4签名，默认关闭
    },
    options
  );

  opts.accessKeyId = opts.accessKeyId.trim();
  opts.accessKeySecret = opts.accessKeySecret.trim();

  if (opts.timeout) {
    opts.timeout = ms(opts.timeout);
  }

  if (opts.endpoint) {
    opts.endpoint = setEndpoint(opts.endpoint, opts.secure);
  } else if (opts.region) {
    opts.endpoint = setRegion(opts.region, opts.internal, opts.secure);
  } else {
    throw new Error('require options.endpoint or options.region');
  }

  opts.inited = true;
  return opts;
}
