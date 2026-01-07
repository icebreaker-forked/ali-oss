import processObjectSaveOps from './processObjectSave';
import { applyOps } from '../utils/applyOps';

const proto: any = {};
applyOps(proto, processObjectSaveOps);
export default proto;
