import {newRows,makeBatch,makeCarriers,now,eligible} from './model.js';
export const isSurvey=t=>t.scene!=='普通消息通知';
export function migrate(data){return {...data,tasks:data.tasks.map(t=>({...t,scene:t.scene||'回访问卷'})),targets:data.targets||data.tasks.flatMap(t=>[...new Map(data.messages.filter(r=>r.taskId===t.id).map(r=>[r.uid,{taskId:t.id,uid:r.uid,type:r.type}])).values()])};}
export function carrierStats(rows){const unique=[...new Map(rows.map(c=>[c.id,c])).values()];const push=unique.filter(c=>c.channel==='Push'),pop=unique.filter(c=>c.channel==='弹窗');return {push:push.length,pushClicks:push.filter(c=>c.clicked).length,uv:new Set(push.filter(c=>c.clicked).map(c=>c.uid)).size,pop:pop.length,shows:pop.filter(c=>c.shown||c.clicked).length,clicks:pop.filter(c=>c.clicked).length};}
export function targetUsers(data,task,scope='原始目标人群'){
 const targets=data.targets.filter(r=>r.taskId===task.id&&r.type==='个人'&&!r.disabled&&!r.blacklisted);
 if(isSurvey(task)){const pending=new Set(eligible(data.messages.filter(r=>r.taskId===task.id)).map(r=>r.uid));return targets.filter(r=>pending.has(r.uid));}
 const carriers=data.carriers.filter(c=>c.taskId===task.id);
 if(scope==='任务内未点击用户')return targets.filter(r=>!carriers.some(c=>c.uid===r.uid&&c.clicked));
 if(scope==='弹窗未曝光用户')return targets.filter(r=>!carriers.some(c=>c.uid===r.uid&&c.channel==='弹窗'&&(c.shown||c.clicked)));
 return targets;
}
function notificationBatch(task,targets,index,remark='',attachments=[],scope='原始目标人群') {const batch={id:`${task.id}-B${index}`,taskId:task.id,type:index===1?'首次下发':'补发',time:now(),operator:'运营管理员',members:[],uids:targets.map(r=>r.uid),remark,attachments,scope};const carriers=targets.flatMap(r=>task.channels.map(channel=>({id:`${batch.id}-${channel}-${r.uid}`,taskId:task.id,batchId:batch.id,uid:r.uid,channel,time:batch.time,shown:false,clicked:false,members:[]})));return {batch,carriers};}
export function createTask(data,task,uids){
 if(isSurvey(task)&&!task.version)throw Error('回访问卷请选择问卷版本');
 if(!isSurvey(task)&&!task.channels.length)throw Error('普通消息通知请至少选择一种触达载体');
 const users=[...new Set(uids)];const rows=isSurvey(task)?newRows(task,users):[];
 const targets=isSurvey(task)?[...new Map(rows.map(r=>[r.uid,{taskId:task.id,uid:r.uid,type:r.type}])).values()]:users.map(uid=>({taskId:task.id,uid,type:'个人'}));
 let next={...data,tasks:[task,...data.tasks],messages:[...data.messages,...rows],targets:[...data.targets,...targets]};
 if(task.status==='执行中')next=dispatch(next,task,true);
 return next;
}
function dispatch(data,task,first=false,remark='',files=[],scope='原始目标人群'){
 const rows=data.messages.filter(r=>r.taskId===task.id),index=data.batches.filter(b=>b.id.startsWith(task.id+'-B')).length+1;
 let batch,carriers;
 if(isSurvey(task)){batch=makeBatch(task,rows,index,remark,files);carriers=makeCarriers(task,batch,rows);}else{({batch,carriers}=notificationBatch(task,targetUsers(data,task,scope),index,remark,files,scope));}
 if(!first&&!carriers.length)throw Error('当前筛选范围没有可补发的个人客户');
 return {...data,batches:[...data.batches,batch],carriers:[...data.carriers,...carriers]};
}
export function resendTask(data,id,remark,files,scope){const task=data.tasks.find(t=>t.id===id);if(!task||task.status!=='执行中'||task.end.replace('T',' ')<=now())throw Error('仅生效期内执行中的任务可补发');return dispatch(data,task,false,remark,files,scope);}
export function advanceTasks(data){let next=data;for(const original of data.tasks){if(['已完成','已终止'].includes(original.status))continue;const current=now(),end=original.end.replace('T',' '),start=original.start.replace('T',' ');const status=end<=current?'已完成':start<=current?'执行中':'待执行';if(status!==original.status){const task={...original,status};next={...next,tasks:next.tasks.map(t=>t.id===task.id?task:t)};if(status==='执行中'&&!next.batches.some(b=>b.id.startsWith(task.id+'-B')))next=dispatch(next,task,true);}}return next;}

// Shanghai wall-clock values in this prototype are compared in the same format.
export function questionnaireBlockReason(task,at=now()){
 if(!task)return '任务不存在，暂不可提交';
 if(task.status==='已终止')return '任务已终止，不可继续作答';
 if(task.status==='已完成'||task.end.replace('T',' ')<=at)return '任务已到期，已停止作答';
 if(task.start.replace('T',' ')>at)return '任务尚未开始，暂不可作答';
 return '';
}
