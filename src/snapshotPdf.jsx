import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import QuestionnaireFileSnapshot from './components/QuestionnaireFileSnapshot';
import {snapshotPdfScope} from './snapshotPdfScope';
export async function exportSnapshotPdf(rows,allRows,onProgress=()=>{}){
 const unique=snapshotPdfScope(rows);
 const [{jsPDF},{default:html2canvas}]=await Promise.all([import('jspdf'),import('html2canvas')]);
 const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 let first=true;
 for(let index=0;index<unique.length;index++){
  const row=unique[index];
  onProgress(index+1,unique.length);
  const host=document.createElement('div');
  host.style.cssText='position:absolute;left:-10000px;top:0;width:794px;background:white;pointer-events:none';
  document.body.appendChild(host);const root=createRoot(host);
  try{
   flushSync(()=>root.render(<QuestionnaireFileSnapshot row={row} rows={allRows} exportMode/>));
   await document.fonts.ready;
   const article=host.querySelector('.questionnaire-document');
   await Promise.all([...article.querySelectorAll('img')].map(img=>img.decode()));
   const canvas=await html2canvas(article,{scale:2,backgroundColor:'#ffffff',logging:false,windowWidth:1100});
   const width=190,limit=Math.floor(canvas.width*267/width);
   const signoff=article.querySelector('.questionnaire-signoff');
   const signoffTop=signoff?Math.floor((signoff.getBoundingClientRect().top-article.getBoundingClientRect().top)*2):canvas.height;
   let offset=0;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   while(offset<canvas.height){
    let end=Math.min(offset+limit,canvas.height);
    if(offset<signoffTop&&end>signoffTop&&end<canvas.height)end=signoffTop;
    // Prefer whitespace between text lines; ignore the thin vertical table borders.
    if(end<canvas.height){
     const start=Math.max(offset+Math.floor(limit*.75),end-180);
     const pixels=ctx.getImageData(0,start,canvas.width,end-start).data;
     for(let y=end-start-1;y>=0;y--){
      let dark=0;for(let x=10;x<canvas.width-10;x++){const p=(y*canvas.width+x)*4;if(pixels[p]<180&&pixels[p+1]<180&&pixels[p+2]<180)dark++;}
      if(dark<20){end=start+y+1;break;}
     }
    }
    const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=end-offset;
    slice.getContext('2d').drawImage(canvas,0,offset,canvas.width,end-offset,0,0,canvas.width,end-offset);
    if(!first)pdf.addPage();first=false;
    pdf.addImage(slice.toDataURL('image/png'),'PNG',10,10,width,slice.height*width/slice.width);
    pdf.setFontSize(8);pdf.setTextColor(90);
    pdf.text(String(pdf.getNumberOfPages()),200,290,{align:'right'});
    offset=end;slice.width=0;slice.height=0;
   }
   canvas.width=0;canvas.height=0;
  }finally{root.unmount();host.remove();}
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 const name=unique.length===1?`文件快照-${unique[0].taskId}-${unique[0].uid}`:`文件快照-${unique.length}位客户`;
 pdf.save(name.replace(/[\\/:*?"<>|]/g,'_')+'.pdf');
 return unique.length;
}
