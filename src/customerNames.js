// Fictional names for the built-in demo fixtures; real masked names cannot be restored.
export const demoCustomerNames=['陈明远','王晓宁','李文博','张嘉怡','赵思远'];
export function demoCustomerDetails(uid){
 const suffix=uid.replace(/[^0-9]/g,'').padStart(8,'0');
 return {phone:'000'+suffix.slice(-8),cert:'DEMO-'+uid,email:uid.toLowerCase()+'@example.com',certType:'演示证件（非真实证件）'};
}
export function migrateCustomerNames(data){
 return {...data,messages:data.messages.map(row=>{
  const builtin=/^T20261000[1-8]$/.test(row.taskId)&&/^U[1-8]\d{4}$/.test(row.uid);
  const aliases={'陈**':demoCustomerNames[0],'王**':demoCustomerNames[1],'李**':demoCustomerNames[2],'张**':demoCustomerNames[3],'赵**':demoCustomerNames[4]};
  const normalize=name=>builtin&&aliases[name]?aliases[name]:name==='客户**'?'客户姓名未提供':name;
  const details=demoCustomerDetails(row.uid);
  const unmask=value=>{
   if(!builtin||!value)return value;
   const next={...value};
   for(const key of ['phone','cert','email'])if(typeof next[key]==='string'&&next[key].includes('*'))next[key]=details[key];
   if(next.cert===details.cert)next.certType=details.certType;
   return next;
  };
  return {...unmask(row),name:normalize(row.name),snapshot:row.snapshot?{...unmask(row.snapshot),name:normalize(row.snapshot.name)}:row.snapshot};
 })};
}
