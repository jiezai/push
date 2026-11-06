export function snapshotProducts(row,rows){
 const snapshots=Array.isArray(row.snapshot?.holdings)?row.snapshot.holdings:rows.filter(r=>r.taskId===row.taskId&&r.uid===row.uid).map(r=>r.snapshot).filter(Boolean);
 return [...new Map(snapshots.filter(s=>s.productId).map(s=>[s.productId,{product:s.product||'—',productId:s.productId,risk:s.risk||'未提供'}])).values()];
}

export function fileSnapshotName(row){return row.snapshot?.name||'未提供';}
