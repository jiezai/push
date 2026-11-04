export function snapshotPdfScope(rows){
 if(!rows.length)throw Error('没有可导出的快照');
 const missing=rows.find(r=>!r.snapshot?.version);
 if(missing)throw Error('存在未绑定问卷版本的记录，请先筛选或选择有版本的消息');
 return [...new Map(rows.map(r=>[JSON.stringify([r.taskId,r.uid,r.snapshot.version]),r])).values()];
}
