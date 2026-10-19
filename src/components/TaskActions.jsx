import React,{useRef,useLayoutEffect,useState,useId} from 'react';
import {createPortal} from 'react-dom';
import {MoreHorizontal,BarChart3,Square} from 'lucide-react';

export default function TaskActions({task,open,onToggle,onClose,onEffect,onTerminate}){
 const trigger=useRef(null),popup=useRef(null),id=useId();
 const [position,setPosition]=useState({top:0,left:0});
 useLayoutEffect(()=>{
  if(!open)return;
  const positionMenu=()=>{const anchor=trigger.current.getBoundingClientRect(),height=popup.current.offsetHeight,width=popup.current.offsetWidth;
  setPosition({left:Math.max(8,Math.min(anchor.right-width,window.innerWidth-width-8)),top:anchor.bottom+6+height<=window.innerHeight-8?anchor.bottom+6:Math.max(8,anchor.top-height-6)});};
  positionMenu();
  const outside=e=>{if(!popup.current?.contains(e.target)&&!trigger.current?.contains(e.target))onClose()};
  const key=e=>{if(e.key==='Escape'){onClose();trigger.current?.focus()}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...popup.current.querySelectorAll('[role=menuitem]')],index=items.indexOf(document.activeElement);const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus()}if(e.key==='Tab')onClose()};
  const closeOnMove=()=>positionMenu();
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);window.addEventListener('resize',closeOnMove);window.addEventListener('scroll',closeOnMove,true);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);window.removeEventListener('resize',closeOnMove);window.removeEventListener('scroll',closeOnMove,true)};
 },[open,onClose]);
 const action=fn=>{onClose();trigger.current?.focus();fn(task)};
 return <><button ref={trigger} className={`icon-btn task-more-button ${open?'is-open':''}`} aria-label={task.name+'更多操作'} aria-haspopup="menu" aria-expanded={open} aria-controls={open?id:undefined} onClick={onToggle}><MoreHorizontal size={18}/></button>{open&&createPortal(<div ref={popup} id={id} role="menu" aria-label={task.name+'操作菜单'} className="task-actions-menu" style={position}>{task.status!=='待执行'&&<button role="menuitem" onClick={()=>action(onEffect)}><BarChart3 size={15}/>运营效果</button>}{['执行中','待执行'].includes(task.status)&&<button role="menuitem" className="terminate-action" onClick={()=>action(onTerminate)}><Square size={14}/>终止任务</button>}</div>,document.body)}</>
}
