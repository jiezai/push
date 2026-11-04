// Only enrich the built-in demo task; never replace user-created records.
export function addDemoCarrierExamples(data){
 const taskId='T202610001';
 const specifications=[['Push','Push 关闭推送开关'],['弹窗','弹窗黑名单']];
 let carriers=[...data.carriers];
 for(const [channel,reason] of specifications){
  const existing=carriers.find(c=>c.demoExceptionExample===reason);
  if(existing)continue;
  const row=carriers.find(c=>c.taskId===taskId&&c.channel===channel&&!c.clicked&&!c.shown&&!c.exceptionReasons?.length);
  if(!row)continue;
  const example={...row,carrierStatus:'异常',exceptionReasons:[reason],demoExceptionExample:reason,shown:false,clicked:false};
  carriers=carriers.map(c=>c.id===row.id?example:c);
 }
 const examples=carriers.filter(c=>c.demoExceptionExample);
 return {...data,carriers:[...examples,...carriers.filter(c=>!c.demoExceptionExample)]};
}
