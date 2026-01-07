import getBucketRequestPayment from './getBucketRequestPayment';
import putBucketRequestPayment from './putBucketRequestPayment';
import putBucketEncryption from './putBucketEncryption';
import getBucketEncryption from './getBucketEncryption';
import deleteBucketEncryption from './deleteBucketEncryption';
import getBucketTags from './getBucketTags';
import putBucketTags from './putBucketTags';
import deleteBucketTags from './deleteBucketTags';
import putBucket from './putBucket';
import getBucketWebsite from './getBucketWebsite';
import putBucketWebsite from './putBucketWebsite';
import deleteBucketWebsite from './deleteBucketWebsite';
import getBucketLifecycle from './getBucketLifecycle';
import putBucketLifecycle from './putBucketLifecycle';
import deleteBucketLifecycle from './deleteBucketLifecycle';
import getBucketPolicy from './getBucketPolicy';
import putBucketPolicy from './putBucketPolicy';
import deleteBucketPolicy from './deleteBucketPolicy';
import getBucketVersioning from './getBucketVersioning';
import putBucketVersioning from './putBucketVersioning';
import * as getBucketInventoryOps from './getBucketInventory';
import * as deleteBucketInventoryOps from './deleteBucketInventory';
import * as listBucketInventoryOps from './listBucketInventory';
import * as putBucketInventoryOps from './putBucketInventory';
import * as abortBucketWormOps from './abortBucketWorm';
import * as completeBucketWormOps from './completeBucketWorm';
import * as extendBucketWormOps from './extendBucketWorm';
import * as getBucketWormOps from './getBucketWorm';
import * as initiateBucketWormOps from './initiateBucketWorm';
import * as getBucketStatOps from './getBucketStat';
import { applyOps } from '../utils/applyOps';

const proto: any = {};
applyOps(
  proto,
  getBucketRequestPayment,
  putBucketRequestPayment,
  putBucketEncryption,
  getBucketEncryption,
  deleteBucketEncryption,
  getBucketTags,
  putBucketTags,
  deleteBucketTags,
  putBucket,
  getBucketWebsite,
  putBucketWebsite,
  deleteBucketWebsite,
  getBucketLifecycle,
  putBucketLifecycle,
  deleteBucketLifecycle,
  getBucketPolicy,
  putBucketPolicy,
  deleteBucketPolicy,
  getBucketVersioning,
  putBucketVersioning,
  getBucketInventoryOps,
  deleteBucketInventoryOps,
  listBucketInventoryOps,
  putBucketInventoryOps,
  abortBucketWormOps,
  completeBucketWormOps,
  extendBucketWormOps,
  getBucketWormOps,
  initiateBucketWormOps,
  getBucketStatOps
);

export default proto;
