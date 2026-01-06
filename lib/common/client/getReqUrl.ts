import merge from 'merge-descriptors';
import is from 'is-type-of';
import { isIP } from '../utils/isIP';
import { checkConfigValid } from '../utils/checkConfigValid';

export function getReqUrl(this: any, params) {
  const isCname = this.options.cname;
  checkConfigValid(this.options.endpoint, 'endpoint');
  const endpointUrl = new URL((this.options.endpoint && this.options.endpoint.href) || String(this.options.endpoint));

  if (params.bucket && !isCname && !isIP(endpointUrl.hostname) && !this.options.sldEnable) {
    endpointUrl.host = `${params.bucket}.${endpointUrl.host}`;
  }

  let resourcePath = '/';
  if (params.bucket && this.options.sldEnable) {
    resourcePath += `${params.bucket}/`;
  }

  if (params.object) {
    // Preserve '/' in result url
    resourcePath += this._escape(params.object).replace(/\+/g, '%2B');
  }
  endpointUrl.pathname = resourcePath;

  const query = {};
  if (params.query) {
    merge(query, params.query);
  }

  if (params.subres) {
    let subresAsQuery = {};
    if ((is as any).string(params.subres)) {
      subresAsQuery[params.subres] = '';
    } else if (is.array(params.subres)) {
      params.subres.forEach(k => {
        subresAsQuery[k] = '';
      });
    } else {
      subresAsQuery = params.subres;
    }
    merge(query, subresAsQuery);
  }

  const searchParams = new URLSearchParams();
  Object.keys(query).forEach(key => {
    const value = (query as any)[key];
    if (value === null || value === undefined) {
      searchParams.set(key, '');
    } else {
      searchParams.set(key, String(value));
    }
  });
  endpointUrl.search = searchParams.toString();

  return endpointUrl.toString();
}
