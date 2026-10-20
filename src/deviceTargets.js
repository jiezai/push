export const isDevice = task => task.targetMode === 'device';
export const targetKey = row => row.deviceId ? row.deviceId : row.uid;
export function parseDevices(text){
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).map((raw,i)=>({raw:raw.trim(),line:i+1})).filter(x=>x.raw);
 const devices=[],errors=[],seen=new Set();let duplicates=0,total=0;
 for(const {raw,line} of lines){
  if(line===lines[0]?.line&&/^device_id$/i.test(raw))continue;
  total++;const deviceId=raw;
  if(!/^[A-Za-z0-9_:\-.]{1,256}$/.test(deviceId)){errors.push({line,raw,reason:'每行仅填写一个设备 ID；仅支持字母、数字、_ : - .，最长256字符'});continue;}
  if(seen.has(deviceId)){duplicates++;continue;}seen.add(deviceId);devices.push({deviceId});
 }
 if(devices.length>500)errors.push({line:'—',raw:'',reason:'去重后最多支持500个设备'});
 return {devices,errors,duplicates,total};
}
