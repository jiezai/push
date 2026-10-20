// Demo route mapping. Replace these paths with the native App route registry when integrating.
export const nativePages = {'资产详情页':'/assets/detail','订单详情页':'/orders/detail','风险测评':'/risk-assessment','适当性回访列表':'/suitability/return-visits','路演列表':'/roadshows'};
export const jumpTypes = ['原生页面','H5 页面','普通外部 H5'];
export function resolveJump(form,prefix){
 const type=normalizeJumpType(form[prefix+'JumpType']);
 if(type==='原生页面'){
  const path=nativePages[form[prefix+'NativePage']];
  if(!path)throw Error('请选择原生页面');
  return path;
 }
 if(!jumpTypes.includes(type))throw Error('请选择跳转类型');
 const value=(form[prefix+'Url']||'').trim();
 try{const url=new URL(value);if(!/^https:\/\//i.test(value)||url.protocol!=='https:'||!url.hostname)throw Error();}catch{throw Error('跳转地址必须为完整 HTTPS 链接');}
 return value;
}

export const h5OpeningModeLabel='跟随当前环境——App 内嵌打开，App 外浏览器打开';
export function normalizeJumpType(type){return !type||type==='App 内嵌 H5'?'H5 页面':type;}
export const openingModes={follow_environment:h5OpeningModeLabel};
export const popupEnvironments=form=>form.targetMode==='device'?['app']:(form.popupEnvironments||['app']);
export const needsAppFallback=form=>popupEnvironments(form).includes('web')&&normalizeJumpType(form.popupJumpType)==='原生页面';
export function validatePopup(form){
 if(!form.channels.includes('弹窗'))return;
 const env=popupEnvironments(form);
 if(!env.length||env.some(v=>!['app','web'].includes(v)))throw Error('请选择弹窗展示环境');
 if(form.targetMode==='device'&&form.popupEnvironments?.includes('web'))throw Error('设备定向弹窗仅支持 App 内展示');
 if(env.includes('app')&&!form.pages?.length)throw Error('请选择 App 展示页面');
 const https=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!!u.hostname}catch{return false}};
 if(env.includes('web')&&(!form.popupWebPages?.trim()||form.popupWebPages.trim().split(/\s+/).some(v=>!https(v))))throw Error('请填写完整 HTTPS 的 App 外展示页面，每行一个');
 if(needsAppFallback(form)&&!https(form.popupFallbackUrl))throw Error('请填写完整 HTTPS 的 App 下载引导页地址');
 if(normalizeJumpType(form.popupJumpType)==='H5 页面'&&!openingModes[form.popupOpenMode||'follow_environment'])throw Error('请选择有效的打开方式');
}
