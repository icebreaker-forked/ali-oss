import merge from 'merge-descriptors';
import processObjectSaveOps from './processObjectSave';

const proto: any = {};
export default proto;

merge(proto, processObjectSaveOps);
