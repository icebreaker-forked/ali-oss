import getSymlinkOps from './getSymlink';
import putSymlinkOps from './putSymlink';
import getObjectMetaOps from './getObjectMeta';
import copyObjectOps from './copyObject';
import calculatePostSignatureOps from './calculatePostSignature';
import getObjectTaggingOps from './getObjectTagging';
import putObjectTaggingOps from './putObjectTagging';
import deleteObjectTaggingOps from './deleteObjectTagging';
import getBucketVersionsOps from './getBucketVersions';
import deleteMultiOps from './deleteMulti';
import getACLOps from './getACL';
import putACLOps from './putACL';
import headOps from './head';
import deleteOps from './delete';
import getOps from './get';
import * as postAsyncFetchOps from './postAsyncFetch';
import * as getAsyncFetchOps from './getAsyncFetch';
import generateObjectUrlOps from './generateObjectUrl';
import getObjectUrlOps from './getObjectUrl';
import signatureUrlOps from './signatureUrl';
import asyncSignatureUrlOps from './asyncSignatureUrl';
import signatureUrlV4Ops from './signatureUrlV4';
import * as signPostObjectPolicyV4Ops from './signPostObjectPolicyV4';
import { applyOps } from '../utils/applyOps';

const proto: any = {};
applyOps(
  proto,
  getSymlinkOps,
  putSymlinkOps,
  getObjectMetaOps,
  copyObjectOps,
  calculatePostSignatureOps,
  getObjectTaggingOps,
  putObjectTaggingOps,
  deleteObjectTaggingOps,
  getBucketVersionsOps,
  deleteMultiOps,
  getACLOps,
  putACLOps,
  headOps,
  deleteOps,
  getOps,
  postAsyncFetchOps,
  getAsyncFetchOps,
  generateObjectUrlOps,
  getObjectUrlOps,
  signatureUrlOps,
  asyncSignatureUrlOps,
  signatureUrlV4Ops,
  signPostObjectPolicyV4Ops
);

export default proto;
