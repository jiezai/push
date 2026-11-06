import React,{useState} from 'react';
import {Button} from './UI';
import template from '../questionnaireTemplate.json';
import templateMeta from '../questionnaireTemplateMeta.json';
import questionnaireSeal from '../assets/questionnaire-seal.png';
import {snapshotProducts,fileSnapshotName} from '../fileSnapshot';
export default function QuestionnaireFileSnapshot({row,rows=[],exportMode=false,canDownload=false}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const download=async()=>{if(!canDownload||busy)return;setBusy(true);setMessage('');try{const {exportSnapshotPdf}=await import('../snapshotPdf');await exportSnapshotPdf([row],rows.length?rows:[row]);setMessage('PDF 已生成并开始下载');}catch(error){setMessage('下载失败：'+error.message);}finally{setBusy(false)}};
 const s=row.snapshot,products=snapshotProducts(row,rows.length?rows:[row]);
 if(!s?.version)return <div className="empty">本次任务未绑定问卷版本，暂无问卷预览。</div>;
 const values={'客户姓名/名称':fileSnapshotName(row),'证件类型':s.certType||'未提供','证件号码':s.cert||'—','联系电话':s.phone||'—','联系邮箱':s.email||'—','产品名称及代码':products.map((p,i)=>`${i+1}. ${p.product}（${p.productId}）`).join('\n')||'暂无持仓产品','产品风险等级':products.map((p,i)=>`${i+1}. ${p.risk}`).join('\n')||'未提供','产品名称':products.map((p,i)=>`${i+1}. ${p.product}`).join('\n')||'暂无持仓产品','产品编码':products.map((p,i)=>`${i+1}. ${p.productId}`).join('\n')||'—'};
 return <div className="file-snapshot">{!exportMode&&<><div className="file-snapshot-toolbar"><h3>本次问卷版本 · {s.version}</h3>{canDownload&&<Button primary disabled={busy} onClick={download}>{busy?'正在生成…':'下载 PDF'}</Button>}</div>{message&&<p role="status">{message}</p>}</>}<p className="muted small">按生产线上版本问卷格式预览；持仓范围为本任务创建时该客户的全部私募产品，共 {products.length} 只。支持下载当前快照 PDF，非服务端归档文件；内置样例姓名、电话、证件及邮箱均为虚构数据；未填写的答案和签章保持空白。</p><article className="questionnaire-document"><h2>投资者适当性回访问卷</h2>{exportMode&&<p className="snapshot-pdf-meta">任务：{row.taskId}　客户 UID：{row.uid}　问卷版本：{s.version}</p>}<table><colgroup>{templateMeta.columnWidths.map((width,i)=><col key={i} style={{width:`${width/templateMeta.columnWidths.reduce((sum,n)=>sum+n,0)*100}%`}}/>)}</colgroup><tbody>{template.map((cells,i)=><tr key={i}>{cells.map((cell,j)=>{
 const label=cells[j-1]?.paragraphs.join('').trim(),value=values[label];
 return <td key={j} colSpan={cell.span} rowSpan={cell.rowSpan||1}>{value!==undefined?<div className="snapshot-value">{value}</div>:cell.paragraphs.map((p,k)=><p key={k}>{p||'\u00a0'}</p>)}</td>;
 })}</tr>)}</tbody></table><div className="questionnaire-signoff"><img src={questionnaireSeal} alt="原问卷所附公司印章"/><div><p>和讯信息科技有限公司</p><p>年　月　日</p></div></div></article></div>;
}
