export const frequencyOptions=['任务周期内一次','每日一次','每3天一次','每7天一次'];
export function normalizeFrequency(value){return (value||'任务周期内一次').replace('未全部完成用户','');}
export function frequencyLabel(value,channel,survey=false){const v=normalizeFrequency(value),hours={'每日一次':24,'每3天一次':72,'每7天一次':168}[v];const prefix=survey?'未全部完成用户：':'';return prefix+(hours?`从${channel==='push'?'Push 下发':'有效曝光'}起间隔${hours}小时`: '任务周期内一次');}
