// Demo route mapping. Replace these paths with the native App route registry when integrating.
export const nativePages = {'资产详情页':'/assets/detail','订单详情页':'/orders/detail','风险测评':'/risk-assessment','适当性回访列表':'/suitability/return-visits'};
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
