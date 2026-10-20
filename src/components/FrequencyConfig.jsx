import React from 'react';
import {Field,Notice} from './UI';
import {frequencyOptions,normalizeFrequency,frequencyLabel} from '../frequency';
export default function FrequencyConfig({channel,form,set,survey,device=false}){
 const key=channel==='push'?'pushFrequency':'frequency',label=channel==='push'?'Push':'弹窗';
 return <><Field label="展示频次" required full><select aria-label={label+'展示频次'} value={normalizeFrequency(form[key])} onChange={e=>set(key,e.target.value)}>{frequencyOptions.map(v=><option key={v} value={v}>{frequencyLabel(v,channel,survey)}</option>)}</select></Field><div className="field full"><Notice>当前规则：{frequencyLabel(form[key],channel,survey)}。按任务＋{device?'设备 ID':'用户（跨设备）'}独立频控，补发不重置；{channel==='push'?'从实际 Push 下发时刻起计时，生成计划记录不消耗次数。':'从有效曝光时刻起计时，未曝光不消耗次数。'}任务周期内一次指整个任务仅一次。{survey&&'本任务所有产品完成（含异常和人工录入）后停止后续触达。'}</Notice></div></>;
}
