// Local fixtures only. Production must resolve identifiers through the account service.
export const demoAccounts=[
 {uid:'DEMO0001',hxid:'demo_hxid_001',customerNo:'000001',status:'正常'},
 {uid:'DEMO0002',hxid:'demo_hxid_002',customerNo:'000002',status:'冻结'},
];
export function validateUidImport(text,accounts=demoAccounts){
 const errors=[],uids=[],entries=[],seen=new Set();let total=0,duplicates=0;
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/);
 for(let i=0;i<lines.length;i++){
  const raw=lines[i].trim();if(!raw)continue;
  if(!total&&/^UID类型\s*[,\t]\s*ID\/客户号$/i.test(raw))continue;
  total++;const parts=raw.split(/[,\t]/).map(s=>s.trim().replace(/^"(.*)"$/,'$1'));const [type,value]=parts;
  const fail=reason=>errors.push({line:i+1,type:type||'—',value:value||'—',reason});
  if(parts.length!==2||!['hxid','客户号'].includes(type?.toLowerCase())){fail('UID类型仅支持 hxid、客户号，须填写两列');continue;}
  if(!value||!/^[\w-]{1,64}$/.test(value)){fail('ID/客户号格式错误，请按文本填写并保留前导零');continue;}
  const matches=accounts.filter(a=>(type.toLowerCase()==='hxid'?a.hxid:a.customerNo)===value);
  if(!matches.length){fail('演示账户库中不存在；真实账号需接入账户服务核验');continue;}
  if(matches.length!==1){fail('账号映射不唯一，请核实');continue;}
  const account=matches[0];if(account.status!=='正常'){fail(`账号状态异常：${account.status||'未知'}`);continue;}
  entries.push({type:type.toLowerCase(),value,uid:account.uid});
  if(seen.has(account.uid)){duplicates++;continue;}seen.add(account.uid);uids.push(account.uid);
 }
 if(total>500)errors.push({line:'—',type:'—',value:'—',reason:'最多导入500条记录'});
 if(!total)errors.push({line:'—',type:'—',value:'—',reason:'名单为空'});
 return {uids:errors.length?[]:uids,entries,total,duplicates,errors,valid:seen.size};
}
