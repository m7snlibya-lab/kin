import {calendars,encode} from './core.js';
import {yearBounds,eventsBetween} from './domain.js';
import {t,number,date,months,calendarName} from './i18n.js';
import QRCode from './vendor/qr.js';

let fontsReady;
export function loadExportFonts(){
 if(!fontsReady)fontsReady=Promise.all([['KinLatin','./fonts/NotoSans.ttf'],['KinArabic','./fonts/NotoSansArabic.ttf']].map(async([name,path])=>{
  const font=new FontFace(name,'url('+new URL(path,import.meta.url).href+')',{weight:'100 900'});await font.load();document.fonts.add(font);
 })).catch(error=>{fontsReady=null;throw error});
 return fontsReady;
}
export const pageSize=(size='A4',orientation='landscape')=>{
 const dims=size==='A3'?[841.89,1190.55]:[595.28,841.89];
 return orientation==='landscape'?dims.reverse():dims;
};
const font=(size,bold=false)=>`${bold?650:400} ${size}px KinLatin, KinArabic, sans-serif`;
const isolate=s=>'\u2068'+s+'\u2069';
function wrap(text,width,size,measure){
 const lines=[];let line='';
 const push=()=>{lines.push(line.trimEnd());line=''};
 // Prefer whole words; only split a token when it cannot fit on an empty line.
 for(const token of text.split(/(\s+)/u)){
  if(token.includes('\n')){if(line)push();continue}
  if(!token.trim()){if(line)line+=' ';continue}
  if(line&&measure(line+token,size)>width)push();
  const segments=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(token)].map(s=>s.segment):Array.from(token);
  for(const part of segments){if(line&&measure(line+part,size)>width)push();line+=part}
 }
 if(line||!lines.length)push();
 // Each canvas line is a new bidi paragraph; don't leave an isolation open across lines.
 return lines.map(s=>s.replace(/[\u2066-\u2069]/g,''));
}
export function createCalendarDocument(records,options,measure=(text,size)=>Array.from(text).length*size*.56){
 const {layoutCalendar='g',year,birthdayCalendar='g',layout='annual',size='A4',orientation='landscape',locale='en',showAges=false,ink=false,qr=false}=options;
 const bounds=yearBounds(layoutCalendar,year),events=eventsBetween(records,bounds.start,bounds.end,birthdayCalendar);
 const [width,height]=pageSize(size,orientation),margin=30,pages=[],overflow=[];
 const tr=(k,v)=>t(k,v,locale),num=n=>number(n,locale);
 const makePage=title=>{const p={width,height,title,locale,ink,ops:[],events:[]};p.ops.push({type:'text',text:title,x:margin,y:margin+20,size:21,bold:true});p.ops.push({type:'text',text:calendarName(layoutCalendar,locale)+' · '+num(year).replace(/[٬,]/g,'')+' · '+tr('{count} birthdays',{count:num(events.length)}),x:margin,y:margin+42,size:10});pages.push(p);return p};
 const eventLabel=e=>date(e.day,layoutCalendar,true,locale)+' · '+isolate(e.person.name)+' · '+calendarName(e.calendar,locale)+(showAges?' · '+tr('Turning {age}',{age:num(e.turns)}):'');
 function entry(page,e,x,y,w,fontSize){
  const lines=wrap(eventLabel(e),w,fontSize,measure);
  for(const [i,text] of lines.entries())page.ops.push({type:'text',text,x,y:y+i*fontSize*1.55,size:fontSize,width:w});
  page.events.push(e);return lines.length*fontSize*1.55+5;
 }
 if(layout==='annual'){
  const page=makePage(tr('Our family birthdays')),cols=orientation==='landscape'?4:3,rows=12/cols,gap=12;
  const cw=(width-2*margin-(cols-1)*gap)/cols,ch=(height-2*margin-88-(rows-1)*gap)/rows;
  for(let month=1;month<=12;month++){
   const col=(month-1)%cols,row=Math.floor((month-1)/cols),x=margin+(locale==='ar'?cols-1-col:col)*(cw+gap),y=margin+70+row*(ch+gap);
   page.ops.push({type:'rect',x,y,width:cw,height:ch});
   page.ops.push({type:'text',text:months(layoutCalendar,locale)[month-1],x:x+9,y:y+19,size:11,bold:true,width:cw-18});
   let cursor=y+38;
   for(const e of events.filter(e=>calendars[layoutCalendar].parts(e.day)[1]===month)){
    const needed=wrap(eventLabel(e),cw-18,8.5,measure).length*8.5*1.55+5;
    if(cursor+needed>y+ch-19){overflow.push(e);continue}
    cursor+=entry(page,e,x+9,cursor,cw-18,8.5);
   }
   if(overflow.some(e=>calendars[layoutCalendar].parts(e.day)[1]===month))page.ops.push({type:'text',text:tr('More on continuation pages'),x:x+9,y:y+ch-8,size:7.5,width:cw-18});
  }
 }else{
  for(let month=1;month<=12;month++){
   let page=makePage(months(layoutCalendar,locale)[month-1]+' · '+tr('Our family birthdays')),cursor=margin+80;
   const entries=events.filter(e=>calendars[layoutCalendar].parts(e.day)[1]===month);
   if(!entries.length)page.ops.push({type:'text',text:tr('No birthdays this month'),x:margin,y:cursor,size:12});
   for(const e of entries){
    const needed=wrap(eventLabel(e),width-2*margin-20,11,measure).length*17.05+5;
    if(cursor+needed>height-margin-40){page=makePage(months(layoutCalendar,locale)[month-1]+' · '+tr('Continued'));cursor=margin+80}
    cursor+=entry(page,e,margin+10,cursor,width-2*margin-20,11)+8;
   }
  }
 }
 let appendix,cursor=0;
 for(const e of overflow){
  const needed=wrap(eventLabel(e),width-2*margin-20,11,measure).length*17.05+5;
  if(!appendix||cursor+needed>height-margin-40){appendix=makePage(tr('Birthday calendar — continued'));cursor=margin+80}
  cursor+=entry(appendix,e,margin+10,cursor,width-2*margin-20,11)+8;
 }
 // QR is on a dedicated page: it never crowds or silently obscures birthday text.
 if(qr){
  const p=makePage(tr('Open this family in Kin'));
  p.ops.push({type:'qr',x:(width-180)/2,y:120,size:180,url:location.origin+location.pathname+encode(records)});
  p.ops.push({type:'text',text:tr('Anyone with this QR can read the selected names and birth dates.'),x:margin,y:330,size:10});
 }
 for(const [i,p] of pages.entries())p.ops.push({type:'text',text:'kin. · '+tr('Page {page} of {total}',{page:num(i+1),total:num(pages.length)}),x:margin,y:height-17,size:8});
 return {kind:'calendar',locale,events,pages,options:{...options},name:'kin-'+layoutCalendar+'-'+year};
}
export function createCardDocument(event,{locale='en',showAges=false,theme='celebratory',shape='square'}={},measure=(s,z)=>s.length*z*.56){
 const width=540,height=shape==='portrait'?675:540,page={width,height,locale,ink:theme==='minimal',card:true,title:event.person.name,events:[event],ops:[]};
 const tr=(k,v)=>t(k,v,locale),nameLines=wrap(event.person.name,width-100,36,measure);
 // Grow the content area rather than dropping long names.
 let y=140;
 page.ops.push({type:'text',text:tr('Happy birthday!'),x:50,y:90,size:25,bold:true});
 for(const text of nameLines){page.ops.push({type:'text',text,x:50,y,size:36,bold:true,width:width-100});y+=54}
 if(showAges){page.ops.push({type:'text',text:tr('Turning {age}',{age:number(event.turns,locale)}),x:50,y:y+20,size:24});y+=65}
 const dateLines=wrap(date(event.day,event.calendar,false,locale)+' · '+calendarName(event.calendar,locale),width-100,16,measure);
 for(const text of dateLines){page.ops.push({type:'text',text,x:50,y:y+20,size:16,width:width-100});y+=25}
 if(y>height-60)throw Error('This name needs more space. Use the portrait card.');
 page.ops.push({type:'text',text:'kin. · '+tr('A little closer, every day.'),x:50,y:height-35,size:10});
 return {kind:'card',locale,events:[event],pages:[page],name:'kin-birthday-'+event.day,options:{shape,theme,showAges}};
}
export function createMeasure(){
 const ctx=document.createElement('canvas').getContext('2d');
 return (text,size)=>{ctx.font=font(size);return ctx.measureText(text).width};
}
export async function renderDocumentPage(page,{scale=300/72,signal}={}){
 if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
 await loadExportFonts();
 const canvas=document.createElement('canvas');canvas.width=Math.round(page.width*scale);canvas.height=Math.round(page.height*scale);
 const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle=page.ink?'#ffffff':'#fcfbff';ctx.fillRect(0,0,page.width,page.height);
 if(page.card&&!page.ink){
  const decorations=[[24,30,9,'#d7c9f1'],[page.width-24,50,12,'#dbe8b5'],[22,page.height-90,13,'#f0d9bd'],[page.width-25,page.height-100,8,'#d7c9f1']];
  for(const [x,y,r,color] of decorations){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#e3dcf1';ctx.fillRect(50,108,page.width-100,2);
 }
 ctx.direction=page.locale==='ar'?'rtl':'ltr';ctx.textBaseline='alphabetic';
 for(const op of page.ops){
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  if(op.type==='rect'){ctx.strokeStyle=page.ink?'#777777':'#ddd6eb';ctx.lineWidth=.6;ctx.strokeRect(op.x,op.y,op.width,op.height);continue}
  if(op.type==='qr'){
   const q=new QRCode(-1,1);q.addData(op.url);q.make();const n=q.getModuleCount(),cell=op.size/(n+8);
   ctx.fillStyle='white';ctx.fillRect(op.x,op.y,op.size,op.size);ctx.fillStyle='#000000';
   for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))ctx.fillRect(op.x+(c+4)*cell,op.y+(r+4)*cell,cell+.05,cell+.05);
   continue;
  }
  ctx.font=font(op.size,op.bold);ctx.fillStyle=page.ink?'#171717':op.bold?'#302e59':'#4e4764';
  ctx.textAlign=page.locale==='ar'?'right':'left';
  // x is always the left edge of the allocated block.
  const maxX=op.x+(op.width??(page.width-op.x-30));
  const anchor=page.locale==='ar'?maxX:op.x;
  ctx.fillText(op.text,anchor,op.y);
 }
 return canvas;
}
export function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Image export failed.')),'image/png'))}
export async function documentPDF(model,{signal,onProgress=()=>{}}={}){
 await import('./vendor/pdf-lib.min.js');
 const pdf=await globalThis.PDFLib.PDFDocument.create();
 pdf.setTitle(model.kind==='calendar'?'Kin birthday calendar':'Kin birthday card');pdf.setCreator('Kin');pdf.setLanguage(model.locale);
 for(const [i,page] of model.pages.entries()){
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  onProgress(i+1,model.pages.length);
  const canvas=await renderDocumentPage(page,{signal}),blob=await canvasBlob(canvas),png=await pdf.embedPng(await blob.arrayBuffer());
  pdf.addPage([page.width,page.height]).drawImage(png,{x:0,y:0,width:page.width,height:page.height});
  canvas.width=canvas.height=1;
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
 return new Blob([await pdf.save()],{type:'application/pdf'});
}
