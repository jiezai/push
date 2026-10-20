import test from 'node:test';
import assert from 'node:assert/strict';
import {seedData,revise,eligible,stats,makeBatch,makeCarriers,pct} from './model.js';
test('复核更新指标且保留首次完成时间和原始快照',()=>{const d=seedData(),r=d.messages.find(r=>r.result==='异常'&&r.answer),before=stats(d.messages),updated=revise(r,'正常','已核实');const after=stats(d.messages.map(m=>m.id===r.id?updated:m));assert.equal(after.done,before.done);assert.equal(after.normal,before.normal+1);assert.equal(after.abnormal,before.abnormal-1);assert.equal(updated.completeTime,r.completeTime);assert.deepEqual(updated.snapshot,r.snapshot);assert.deepEqual(updated.answer,r.answer);assert.equal(updated.logs.at(-1).type,'回访复核')});
test('重复问卷被拒绝；线下结果不依赖答卷也计完成',()=>{const r=seedData().messages.find(r=>!r.result);const done=revise(r,'正常','线下处理');assert.equal(stats([done]).done,1);assert.equal(done.answer,null);assert.throws(()=>revise(done,'正常','',[],['是','是','是','是']),/不可重复提交/)});
test('补发只针对未提交个人，同用户每批次每载体仅一条',()=>{const d=seedData(),t=d.tasks[0],rows=d.messages.filter(r=>r.taskId===t.id),b=makeBatch(t,rows,2),carriers=makeCarriers(t,b,rows);assert.deepEqual(b.members,eligible(rows).map(r=>r.id));assert.ok(eligible(rows).every(r=>r.type==='个人'&&!r.result));assert.equal(carriers.length,new Set(eligible(rows).map(r=>r.uid)).size*t.channels.length);assert.equal(new Set(carriers.map(c=>c.id)).size,carriers.length);assert.ok(carriers.every(c=>c.members.every(id=>b.members.includes(id))))});
test('零基线不计算比例，种子数据联合键唯一，机构不生成载体',()=>{const d=seedData();assert.equal(pct(0,0),'—');assert.equal(new Set(d.messages.map(r=>r.uid+r.taskId+r.productId)).size,d.messages.length);const institution=d.tasks[3];assert.equal(d.carriers.filter(c=>c.taskId===institution.id).length,0)});

import {migrate,createTask,resendTask,targetUsers,carrierStats,advanceTasks} from './taskService.js';
const empty=()=>({tasks:[],targets:[],messages:[],batches:[],carriers:[]});
const notice=()=>({id:'N1',scene:'普通消息通知',name:'运营通知',status:'执行中',start:'2020-01-01T00:00',end:'2099-01-01T00:00',channels:['Push','弹窗']});
test('普通通知不创建业务消息，用户去重并独立生成载体',()=>{const d=createTask(empty(),notice(),['U1','U1','U2']);assert.equal(d.messages.length,0);assert.equal(d.targets.length,2);assert.equal(d.carriers.length,4);assert.ok(d.carriers.every(c=>!c.members.length));const next=resendTask(d,'N1','',[],'原始目标人群');assert.equal(next.messages.length,0);assert.equal(next.carriers.length,8);assert.equal(next.targets.length,2)});
test('通知补发按任务跨批次点击筛选，已终止不可补发',()=>{let d=createTask(empty(),notice(),['U1','U2']);d.carriers[0].clicked=true;assert.deepEqual(targetUsers(d,d.tasks[0],'任务内未点击用户').map(r=>r.uid),['U2']);const next=resendTask(d,'N1','',[],'任务内未点击用户');assert.deepEqual(next.batches[1].uids,['U2']);d.tasks[0].status='已终止';assert.throws(()=>resendTask(d,'N1','',[]),/仅生效期/)});
test('载体统计去重实例，点击UV跨批次不累加',()=>{const a={id:'a',uid:'u',channel:'Push',clicked:true},b={...a,id:'b'};const s=carrierStats([a,a,b]);assert.equal(s.push,2);assert.equal(s.pushClicks,2);assert.equal(s.uv,1)});
test('历史任务迁移保留快照，新问卷必选版本',()=>{const old=seedData(),d=migrate(old);assert.ok(d.tasks.every(t=>t.scene==='回访问卷'));assert.deepEqual(d.messages,old.messages);assert.throws(()=>createTask(empty(),{...notice(),scene:'回访问卷'},['U1']),/问卷版本/)});
test('待执行任务在生效时仅生成一次批次，到期按时间完成',()=>{let d=createTask(empty(),{...notice(),status:'待执行'},['U1']);assert.equal(d.batches.length,0);d=advanceTasks(d);assert.equal(d.batches.length,1);assert.equal(advanceTasks(d).batches.length,1);d.tasks[0].end='2021-01-01T00:00';assert.equal(advanceTasks(d).tasks[0].status,'已完成')});

import {questionnaireBlockReason} from './taskService.js';
test('问卷结束时间同时限制作答，提交时刻到期立即拦截',()=>{const t={status:'执行中',start:'2026-10-16T09:00',end:'2026-10-16T18:00'};assert.equal(questionnaireBlockReason(t,'2026-10-16 17:59:59'),'');assert.match(questionnaireBlockReason(t,'2026-10-16 18:00:00'),/到期/);assert.match(questionnaireBlockReason(t,'2026-10-16 08:59:59'),/尚未开始/);assert.match(questionnaireBlockReason({...t,status:'已终止'},'2026-10-16 17:00:00'),/终止/)});

import {parseDevices} from './deviceTargets.js';
test('设备名单只填ID，去重并拒绝多列',()=>{const r=parseDevices('device_id\nx\nx\ny\nbad,ios');assert.equal(r.total,4);assert.equal(r.duplicates,1);assert.equal(r.devices.length,2);assert.equal(r.errors[0].line,5)});
test('设备推送无UID业务消息，补发及点击统计按设备隔离',()=>{const t={...notice(),targetMode:'device',channels:['Push']};let d=createTask(empty(),t,[{deviceId:'a',platform:'Android'},{deviceId:'b',platform:'iOS'}]);assert.equal(d.messages.length,0);assert.equal(d.carriers.length,2);assert.ok(d.carriers.every(c=>!c.uid));d.carriers[0].clicked=true;const n=resendTask(d,t.id,'',[],'任务内未点击设备');assert.equal(n.carriers.length,3);assert.equal(n.carriers.at(-1).deviceId,'b');const stats=carrierStats(n.carriers);assert.equal(stats.uv,0);assert.equal(stats.devices,1);assert.equal(stats.deviceTotal,2);assert.throws(()=>createTask(empty(),{...t,scene:'回访问卷',version:'V2.1'},[{deviceId:'a',platform:'iOS'}]),/仅支持/);assert.equal(createTask(empty(),{...t,channels:['Push','弹窗']},[{deviceId:'a',platform:'iOS'}]).carriers.length,2)});

import {frequencyLabel,normalizeFrequency} from './frequency.js';
import {resolveJump} from './navigation.js';
test('频次说明区分下发和曝光，并兼容历史选项',()=>{assert.equal(normalizeFrequency('未全部完成用户每3天一次'),'每3天一次');assert.match(frequencyLabel('每日一次','push'),/Push 下发起间隔24小时/);assert.match(frequencyLabel('每7天一次','popup'),/有效曝光起间隔168小时/);assert.equal(resolveJump({pushJumpType:'原生页面',pushNativePage:'适当性回访列表'},'push'),'/suitability/return-visits')});
test('设备任务按所选推送平台创建及补发载体',()=>{const t={...notice(),targetMode:'device',channels:['Push'],pushPlatform:'ios'};const d=createTask(empty(),t,[{deviceId:'a',platform:'Android'},{deviceId:'b',platform:'iOS'}]);assert.equal(d.targets.length,2);assert.equal(d.carriers.length,1);assert.equal(d.carriers[0].platform,'iOS');assert.equal(resendTask(d,t.id,'',[]).carriers.length,2)});

test('设备弹窗独立于Push平台筛选，支持单独发送和未曝光补发',()=>{
 const devices=[{deviceId:'a',platform:'Android'},{deviceId:'b',platform:'iOS'}];
 const task={...notice(),targetMode:'device',channels:['Push','弹窗'],pushPlatform:'ios'};
 const d=createTask(empty(),task,devices);
 assert.equal(d.carriers.filter(c=>c.channel==='Push').length,1);
 assert.equal(d.carriers.filter(c=>c.channel==='弹窗').length,2);
 d.carriers.find(c=>c.channel==='弹窗'&&c.deviceId==='a').shown=true;
 const next=resendTask(d,task.id,'',[],'弹窗未曝光设备');
 assert.equal(next.carriers.length,5);
 assert.ok(next.carriers.slice(3).every(c=>c.deviceId==='b'));
 const only=createTask(empty(),{...task,channels:['弹窗'],pushPlatform:'android'},[devices[1]]);
 assert.equal(only.carriers.length,1);assert.equal(only.carriers[0].channel,'弹窗');
 assert.equal(only.messages.length,0);assert.equal(carrierStats(d.carriers).shows,1);
});

test('仅设备ID可创建，Push平台不伪装成设备实际平台',()=>{const t={...notice(),targetMode:'device',channels:['Push','弹窗'],pushPlatform:'ios'};const d=createTask(empty(),t,parseDevices('a\na\nb').devices);assert.equal(d.targets.length,2);assert.equal(d.carriers.length,4);assert.ok(d.carriers.every(c=>!c.platform));assert.equal(d.tasks[0].pushPlatform,'ios');});

import {validatePopup,needsAppFallback,popupEnvironments} from './navigation.js';
test('跨端弹窗限定设备环境并校验唤起兜底',()=>{
 const t={channels:['弹窗'],targetMode:'uid',popupEnvironments:['web'],popupWebPages:'https://example.com/activity',popupJumpType:'原生页面'};
 assert.throws(()=>validatePopup(t),/下载引导/);
 assert.doesNotThrow(()=>validatePopup({...t,popupFallbackUrl:'https://example.com/download'}));
 assert.throws(()=>validatePopup({...t,popupFallbackUrl:'http://example.com/download'}),/HTTPS/);
 assert.throws(()=>validatePopup({...t,targetMode:'device'}),/仅支持/);
 assert.throws(()=>validatePopup({...t,popupEnvironments:[]}),/展示环境/);
 assert.throws(()=>validatePopup({...t,popupWebPages:''}),/展示页面/);
 assert.equal(needsAppFallback({...t,popupJumpType:'H5 页面',popupOpenMode:'app_webview'}),false);
 assert.doesNotThrow(()=>validatePopup({...t,popupJumpType:'H5 页面',popupOpenMode:'follow_environment'}));
 assert.deepEqual(popupEnvironments({}),['app']);
});

import {validateUidImport} from './uidImport.js';
test('UID导入按类型解析保留前导零，跨标识去重，错误阻断',()=>{
 const ok=validateUidImport('UID类型,ID/客户号\nhxid,demo_hxid_001\n客户号,000001');
 assert.deepEqual(ok.uids,['DEMO0001']);assert.equal(ok.duplicates,1);assert.equal(ok.entries[1].value,'000001');
 for(const row of ['hxid,unknown','客户号,000002','other,000001','hxid,']){const r=validateUidImport('UID类型,ID/客户号\nhxid,demo_hxid_001\n'+row);assert.equal(r.errors.length,1);assert.equal(r.errors[0].line,3);assert.deepEqual(r.uids,[]);}
 assert.equal(validateUidImport('').errors.length,1);
});

import {baselineRows,filterSnapshots,baselineFields} from './snapshotExport.js';
test('快照导出使用不可变基线，字段与弹窗一致，筛选按基线执行',()=>{
 const rows=[{name:'当前姓名',risk:'R5',snapshot:{id:'s1',name:'原始姓名',uid:'001',risk:'R1',type:'个人',cert:'31***',version:'V2.1'}},{snapshot:{id:'s2',name:'另一人',risk:'R2',type:'机构'}}];
 const result=filterSnapshots(rows,{name:'原始',risk:'R1'});
 assert.equal(result.length,1);const exported=baselineRows(result)[0];
 assert.deepEqual(Object.keys(exported),baselineFields.map(([label])=>label));
 assert.equal(exported['客户姓名'],'原始姓名');assert.equal(exported['用户 UID'],'001');assert.equal(exported['证件号码'],'31***');assert.equal(exported['产品风险等级'],'R1');
 assert.equal(filterSnapshots(rows,{risk:'R5'}).length,0);
});
