import Client from './browser/client';

export let client: any;

export const setConfig = (options: any, ctx: any) => {
  client = new (Client as any)(options, ctx);
};
