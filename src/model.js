export const now = () => new Date().toLocaleString('sv-SE', {timeZone:'Asia/Shanghai'});
export const pct = (n,d) => d ? (100*n/d).toFixed(2)+'%' : '—';
export const fmt = n => n.toLocaleString('en-US');
export const questions = ['您是否已充分了解所持产品的投资范围及投资策略？','您是否知悉该产品的风险等级及可能发生的本金损失？','您是否确认当前风险承受能力与所持产品相匹配？','您是否确认购买产品为本人真实意愿，且不存在保本保收益承诺？'];
export function stats(rows) {const normal=rows.filter(r=>r.result==='正常').length; const abnormal=rows.filter(r=>r.result==='异常').length;return {total:rows.length,normal,abnormal,done:normal+abnormal,users:new Set(rows.map(r=>r.uid)).size};}
export function eligible(rows) {return rows.filter(r=>r.type==='个人'&&!r.result);}
export function revise(row,result,remark='',attachments=[],answers=null) {
 if(!['正常','异常'].includes(result)) throw Error('请选择业务处置结果');
 if(answers && (row.answer||row.result)) throw Error('该产品问卷已提交，不可重复提交');
 const time=now(); return {...row,result,completeTime:row.completeTime||time,operator:answers?'客户本人':'运营管理员',operateTime:answers?'':time,attachments:answers?attachments:[...row.attachments,...attachments],answer:answers?{id:'A'+row.id,answers,time}:row.answer,logs:[...row.logs,{type:row.result?'回访复核':'首次提交',before:row.result||'—',after:result,remark,operator:answers?'客户本人':'运营管理员',time,attachments}]};
}
export function makeBatch(task,rows,index,remark='',attachments=[]) {
 const targets=index===1?rows:eligible(rows);
 return {id:`${task.id}-B${index}`,type:index===1?'首次下发':'补发',time:now(),operator:'运营管理员',members:targets.map(r=>r.id),remark,attachments};
}
export function makeCarriers(task,batch,rows,seed=false) {
 const users=[...new Set(rows.filter(r=>batch.members.includes(r.id)&&r.type==='个人').map(r=>r.uid))];
 return users.flatMap((uid,i)=>task.channels.map(channel=>({id:`${batch.id}-${channel}-${uid}`,taskId:task.id,batchId:batch.id,uid,channel,time:batch.time,shown:seed&&channel==='弹窗'&&(i%5!==0||i%3===0),clicked:seed&&i%3===0,members:rows.filter(r=>batch.members.includes(r.id)&&r.uid===uid).map(r=>r.id)})));
}
export function seedData() {
 const names=['10月私募投资者适当性回访','高龄客户专项回访','私募产品风险匹配回访','机构客户适当性回访','新增持仓客户回访','9月私募投资者回访','产品户信息核实','历史持仓专项回访'];
 const statuses=['执行中','执行中','执行中','已完成','待执行','已完成','待执行','已终止'];
 const tasks=names.map((name,i)=>({id:`T202610${String(i+1).padStart(3,'0')}`,name,status:statuses[i],created:`2026-10-${String(12-i).padStart(2,'0')} 09:30:00`,operator:i%2?'李晓':'张敏',start:statuses[i]==='待执行'?'2026-10-20T09:00':'2026-10-01T09:00',end:statuses[i]==='已完成'?'2026-10-13T18:00':'2026-10-31T18:00',version:'V2.1',types:i===3?['机构']:i===6?['产品']:['全部'],channels:i===3||i===6?[]:['Push','弹窗'],audience:'全部私募持仓客户',pushTitle:'投资者适当性回访提醒',pushBody:'您持有的产品有一份回访问卷待完成，请及时填写。',pushUrl:'https://example.com/questionnaire',channelId:'my_reminders',taskType:'我的提醒',popupTitle:'投资者适当性回访',popupBody:'为持续了解您的投资需求，请完成本次问卷。',buttonText:'立即填写',popupUrl:'https://example.com/questionnaire',pages:['理财首页','私募首页'],frequency:'任务周期内一次',closable:true}));
 const messages=tasks.flatMap((t,i)=>Array.from({length:[120,86,164,48,64,92,32,54][i]},(_,j)=>{
 const pending=t.status==='待执行'||j%(5+i%3)===0;const result=pending?'':j%13===0?'异常':'正常';const type=t.types[0]==='全部'?(Math.floor(j/2)%17===0?'机构':Math.floor(j/2)%23===0?'产品':'个人'):t.types[0];
 const row={id:`M${i+1}${String(j+1).padStart(4,'0')}`,taskId:t.id,uid:`U${i+1}${String(Math.floor(j/2)+1).padStart(4,'0')}`,name:['陈**','王**','李**','张**','赵**'][Math.floor(j/2)%5],phone:'138****'+String(2100+Math.floor(j/2)),cert:'310***********'+String(1000+Math.floor(j/2)),email:'c***@example.com',type,productId:`P${1001+j%6}`,product:['稳健增长私募证券基金','远见成长一期','景行价值精选','长青稳进三号','卓越量化精选','远航多策略基金'][j%6],risk:`R${j%5+1}`,customerRisk:`C${Math.floor(j/2)%5+1}`,result,completeTime:result?'2026-10-13 14:20:00':'',operator:result&&type!=='个人'?'张敏':'',operateTime:result&&type!=='个人'?'2026-10-13 14:20:00':'',attachments:[],logs:[],answer:null};
 if(result){row.logs=[{type:'首次提交',before:'—',after:result,operator:type==='个人'?'客户本人':'张敏',time:row.completeTime,remark:'首次问卷回访',attachments:[]}];if(type==='个人')row.answer={id:'A'+row.id,time:row.completeTime,answers:questions.map((_,k)=>result==='异常'&&k===1?'否':'是')};}
 row.snapshot={id:'S'+row.id,taskId:t.id,uid:row.uid,name:row.name,phone:row.phone,cert:row.cert,email:row.email,type,productId:row.productId,product:row.product,risk:row.risk,customerRisk:row.customerRisk,version:t.version,time:t.created};return row;
 }));
 const batches=tasks.filter(t=>t.status!=='待执行').map(t=>({...makeBatch(t,messages.filter(r=>r.taskId===t.id),1),time:t.created}));
 return {tasks,messages,batches,carriers:batches.flatMap(b=>makeCarriers(tasks.find(t=>t.id===b.id.split('-B')[0]),b,messages,true))};
}
export function newRows(task,uids) {
 return uids.map((uid,i)=>{const type=task.types.includes('全部')?['个人','个人','机构','产品'][i%4]:task.types[i%task.types.length];const row={id:`M${task.id}-${i}`,taskId:task.id,uid,name:'客户**',phone:'138****0000',cert:'310***********0000',email:'u***@example.com',type,productId:'P'+(1001+i%6),product:'私募持仓产品 '+(i%6+1),risk:'R'+(i%5+1),customerRisk:'C'+(i%5+1),result:'',completeTime:'',operator:'',operateTime:'',attachments:[],logs:[],answer:null};return {...row,snapshot:{...row,id:'S'+row.id,version:task.version,time:task.created,logs:undefined,answer:undefined,attachments:undefined}};});
}
