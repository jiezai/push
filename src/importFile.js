import * as XLSX from 'xlsx';
export async function readImportFile(file){
 if(!/\.(xlsx|csv|txt)$/i.test(file.name))throw Error('仅支持 XLSX、CSV 或 TXT 文件');
 if(!/\.xlsx$/i.test(file.name))return file.text();
 const book=XLSX.read(await file.arrayBuffer(),{type:'array'});
 const sheet=book.Sheets[book.SheetNames[0]];
 if(!sheet)throw Error('Excel 中没有可读取的工作表');
 const rows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:'',blankrows:true});
 if(!rows.some(row=>row.some(value=>String(value).trim())))throw Error('Excel 工作表为空');
 return rows.map((row,i)=>row.map(value=>{
  const text=String(value);
  if(/[\r\n,\t]/.test(text))throw Error(`第 ${i+1} 行包含不支持的分隔符或换行，请检查单元格`);
  return text;
 }).join(',')).join('\n');
}
export function downloadImportTemplate(kind){
 const rows=kind==='uid'?[['UID类型','ID/客户号'],['hxid','demo_hxid_001'],['客户号','000001']]:[['device_id'],['registration_demo_01'],['registration_demo_02']];
 const sheet=XLSX.utils.aoa_to_sheet(rows);
 for(const key of Object.keys(sheet)){if(!key.startsWith('!'))sheet[key].z='@';}
 sheet['!cols']=rows[0].map(()=>({wch:30}));
 const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,sheet,'导入名单');
 XLSX.writeFile(book,(kind==='uid'?'UID名单模板':'设备名单模板')+'.xlsx');
}
