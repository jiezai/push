import {readImportFile,downloadImportTemplate} from '../importFile';
import React,{useState,useRef} from 'react';
import {Field,Notice} from './UI';
import {parseDevices} from '../deviceTargets';
export default function DeviceTargets({onChange}){
 const sequence=useRef(0);
 const [text,setText]=useState(''),[report,setReport]=useState(null);
 const validate=(value,filename='手工设备名单')=>{sequence.current++;setText(value);const r=parseDevices(value);setReport(r);onChange(r.errors.length?[]:r.devices,filename);};
 return <div className="field full"><Field label="设备名单（仅设备 ID，每行一条）" full><textarea aria-label="设备名单" value={text} placeholder={'device_id\nregistration_demo_01\nregistration_demo_02'} onChange={e=>validate(e.target.value)}/></Field><input aria-label="上传设备名单" type="file" accept=".xlsx,.csv,.txt" onChange={async e=>{const f=e.target.files[0],request=++sequence.current;setReport(null);setText('');onChange([],'');if(!f)return;try{const value=await readImportFile(f);if(request===sequence.current)validate(value,f.name);}catch(error){if(request===sequence.current)setReport({total:0,duplicates:0,devices:[],errors:[{line:'—',raw:'',reason:error.message||'文件读取失败'}]});}}}/><a className="link" href="data:text/csv;charset=utf-8,device_id%0Aregistration_demo_01%0Aregistration_demo_02" download="设备名单模板.csv">下载 CSV 模板</a><button type="button" className="link" onClick={()=>downloadImportTemplate('device')}>下载 XLSX 模板</button>{report&&<Notice>总计 {report.total} 条，重复 {report.duplicates} 条，格式有效 {report.devices.length} 条，无效 {report.errors.length} 条。{report.errors.length>0&&'请修正无效行后提交。'}</Notice>}{report?.errors.map((e,i)=><p className="error" key={i}>第 {e.line} 行：{e.raw} — {e.reason}</p>)}<small>支持 XLSX / CSV / TXT；Excel 仅读取第一个工作表，设备 ID 按文本填写。设备 ID 为推送平台注册标识，不是任意硬件编号。当前为单 App 演示，按设备 ID 去重；实际设备平台由注册信息识别。</small></div>;
}
