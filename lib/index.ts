import { Buffer } from 'buffer';
import Client from './browser/client';
import urllib from './browser/urllib';
import { version } from './version';

const g = globalThis as any;
if (typeof g.Buffer === 'undefined') g.Buffer = Buffer;
if (typeof g.process === 'undefined') g.process = { browser: true };
else if (typeof g.process.browser === 'undefined') g.process.browser = true;

const OSS: any = Client;
OSS.Buffer = Buffer;
OSS.urllib = urllib;
OSS.version = version;

export default OSS;
export { OSS, Client, urllib, version };
