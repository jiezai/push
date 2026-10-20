import React,{useRef,useState} from 'react';
import {Field,Notice} from './UI';
import {validateUidImport} from '../uidImport';
const template='\uFEFFUID类型,ID/客户号\nhxid,demo_hxid_001\n客户号,000001\n';
export default function UidTargets({onChange}){
 const [report,setReport]=useState(null);const sequence=useRef(0);
 return <Field label="UID 名单（CSV / TXT，最多 500 条）" full>
 <input aria-label="上传 UID 名单" type="file" accept=".csv,.txt" onChange={async e=>{const file=e.target.files[0],request=++sequence.current;setReport(null);onChange([], '',[]);if(!file)return;try{const text=await file.text();if(request!==sequence.current)return;const result=validateUidImport(text);setReport(result);onChange(result.uids,file.name,result.errors.length?[]:result.entries);}catch{if(request===sequence.current)setReport({total:0,valid:0,duplicates:0,errors:[{line:'—',type:'—',value:'—',reason:'文件读取失败，请重新上传'}]});}}}/>
 <a className="link" href={'data:text/csv;charset=utf-8,'+encodeURIComponent(template)} download="UID名单模板.csv">下载导入模板</a>
 <small>两列：UID类型（hxid／客户号）、ID/客户号。请按文本格式填写，保留客户号前导零。</small>
 <Notice>逐行检查账号是否存在、状态是否正常；任一错误须修正后重新导入。同一客户的 hxid 与客户号按统一 UID 去重。当前仅使用演示账户库验证，真实账号校验需接入账户服务。模板含正常演示账号；demo_hxid_002／000002 为冻结账号，可用于验证错误提示。</Notice>
 {report&&<><p>共 {report.total} 条，正常客户 {report.valid} 个，重复 {report.duplicates} 条，错误 {report.errors.length} 条。</p>{report.errors.map((r,i)=><p className="error" role="alert" key={i}>第 {r.line} 行 · {r.type} · {r.value}：{r.reason}</p>)}</>}
 </Field>;
}
