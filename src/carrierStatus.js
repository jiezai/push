export function carrierState(row){
 const reasons=Array.isArray(row.exceptionReasons)?row.exceptionReasons:[];
 const allowed=row.channel==='Push'?['Push 黑名单','Push 关闭推送开关']:['弹窗黑名单'];
 const found=allowed.filter(reason=>reasons.includes(reason));
 if(row.channel==='Push'){
  if(row.pushBlacklisted&&!found.includes('Push 黑名单'))found.push('Push 黑名单');
  if(row.pushEnabled===false&&!found.includes('Push 关闭推送开关'))found.push('Push 关闭推送开关');
 }else if(row.channel==='弹窗'&&row.popupBlacklisted&&!found.includes('弹窗黑名单'))found.push('弹窗黑名单');
 return {status:found.length?'异常':'正常',reason:found.length?found.join('、'):'不适用',reasons:found};
}
