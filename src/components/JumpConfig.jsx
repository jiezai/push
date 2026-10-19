import React from 'react';
import {Field} from './UI';
import {nativePages,jumpTypes} from '../navigation';
export default function JumpConfig({prefix,form,set}){
 const label=prefix==='push'?'Push':'App 弹窗';
 const native=form[prefix+'JumpType']==='原生页面';
 return <><Field label="跳转类型" required><select aria-label={label+'跳转类型'} value={form[prefix+'JumpType']} onChange={e=>set(prefix+'JumpType',e.target.value)}>{jumpTypes.map(t=><option key={t}>{t}</option>)}</select></Field>{native?<Field label="原生页面" required><select aria-label={label+'原生页面'} value={form[prefix+'NativePage']} onChange={e=>set(prefix+'NativePage',e.target.value)}>{Object.keys(nativePages).map(p=><option key={p}>{p}</option>)}</select></Field>:<Field label="跳转地址" required><input aria-label={label+'跳转地址'} type="url" required pattern="https://.+" title="请填写完整 https:// 链接" placeholder="https://example.com/page" value={form[prefix+'Url']} onChange={e=>set(prefix+'Url',e.target.value)}/></Field>}</>;
}
