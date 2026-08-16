const canvas=document.getElementById('pageCanvas'),ctx=canvas.getContext('2d');
const wrap=document.getElementById('canvasWrap'), thumbs=document.getElementById('thumbnails');
let W=900,H=1200, pages=[], current=0, tool='pen', drawing=false, last=null, history=[], redoStack=[], textPos=null;

function blankPage(){return {strokes:[],texts:[]}}
function init(){pages=[blankPage()]; resizeCanvas(); render(); updateThumbs()}
function resizeCanvas(){
  canvas.width=W; canvas.height=H; drawPaper();
}
function drawPaper(){
  const p=document.getElementById('paper').value; ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#d8d8d8';ctx.fillStyle='#b8b8b8';
  if(p==='ruled'||p==='four'){for(let y=70;y<H;y+=38){ctx.beginPath();ctx.moveTo(30,y);ctx.lineTo(W-30,y);ctx.stroke()}}
  if(p==='four'){ctx.strokeStyle='#b8b8b8';for(let y=70;y<H;y+=38){ctx.beginPath();ctx.moveTo(30,y-5);ctx.lineTo(W-30,y-5);ctx.stroke();ctx.beginPath();ctx.moveTo(30,y+5);ctx.lineTo(W-30,y+5);ctx.stroke()}}
  if(p==='dots'){for(let y=35;y<H;y+=28)for(let x=35;x<W;x+=28){ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);ctx.fill()}}
  if(p==='squares'){for(let x=0;x<W;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}}
}
function render(){
  drawPaper(); const page=pages[current];
  page.strokes.forEach(s=>drawStroke(s)); page.texts.forEach(t=>drawText(t));
  document.getElementById('pageLabel').textContent=`${current+1} / ${pages.length}`;
  document.getElementById('pageCount').textContent=pages.length;
}
function drawStroke(s){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=s.size;ctx.strokeStyle=s.color;
  if(s.type==='highlighter'){ctx.globalAlpha=.25}
  if(s.type==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='#000'}
  ctx.beginPath();s.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();
}
function drawText(t){ctx.save();ctx.fillStyle=t.color;ctx.font=`${t.size}px system-ui`;ctx.fillText(t.text,t.x,t.y);ctx.restore()}
function pos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
function pushHistory(){history.push(JSON.stringify(pages[current]));if(history.length>40)history.shift();redoStack=[]}
canvas.addEventListener('pointerdown',e=>{
  if(tool==='text'){textPos=pos(e);document.getElementById('textDialog').classList.remove('hidden');return}
  pushHistory();drawing=true;last=pos(e);
});
canvas.addEventListener('pointermove',e=>{
  if(!drawing)return;const q=pos(e),s={type:tool,size:+document.getElementById('size').value,color:document.getElementById('color').value,points:[last,q]};
  pages[current].strokes.push(s);drawStroke(s);last=q;updateThumbs();
});
['pointerup','pointercancel','pointerleave'].forEach(x=>canvas.addEventListener(x,()=>{drawing=false;last=null}));
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active'));b.classList.add('active');tool=b.dataset.tool});
document.getElementById('size').oninput=e=>document.getElementById('sizeVal').textContent=e.target.value;
document.getElementById('paper').onchange=()=>render();
function addPage(){pages.splice(current+1,0,blankPage());current++;render();updateThumbs()}
document.getElementById('addPage').onclick=addPage;document.getElementById('newPageSide').onclick=addPage;
document.getElementById('prev').onclick=()=>{if(current){current--;render();updateThumbs()}};
document.getElementById('next').onclick=()=>{if(current<pages.length-1){current++;render();updateThumbs()}};
document.getElementById('clearPage').onclick=()=>{pushHistory();pages[current]=blankPage();render();updateThumbs()};
document.getElementById('undo').onclick=()=>{if(!history.length)return;redoStack.push(JSON.stringify(pages[current]));pages[current]=JSON.parse(history.pop());render();updateThumbs()};
document.getElementById('redo').onclick=()=>{if(!redoStack.length)return;history.push(JSON.stringify(pages[current]));pages[current]=JSON.parse(redoStack.pop());render();updateThumbs()};
function updateThumbs(){thumbs.innerHTML='';pages.forEach((p,i)=>{let d=document.createElement('div');d.className='thumb '+(i===current?'active':'');let c=document.createElement('canvas');c.width=180;c.height=240;let x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,180,240);x.strokeStyle='#ddd';for(let y=14;y<240;y+=8){x.beginPath();x.moveTo(5,y);x.lineTo(175,y);x.stroke()}let sx=W/180,sy=H/240;p.strokes.forEach(s=>{x.save();x.scale(1/sx,1/sy);drawStrokeOn(x,s);x.restore()});p.texts.forEach(t=>{x.fillStyle=t.color;x.font=`${Math.max(4,t.size/sx)}px system-ui`;x.fillText(t.text,t.x/sx,t.y/sy)});d.appendChild(c);let n=document.createElement('span');n.className='num';n.textContent=i+1;d.appendChild(n);d.onclick=()=>{current=i;render();updateThumbs()};thumbs.appendChild(d)})}
function drawStrokeOn(x,s){x.lineCap='round';x.lineJoin='round';x.lineWidth=s.size;x.strokeStyle=s.color;if(s.type==='highlighter')x.globalAlpha=.25;if(s.type==='eraser')return;x.beginPath();s.points.forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y));x.stroke()}
document.getElementById('cancelText').onclick=()=>document.getElementById('textDialog').classList.add('hidden');
document.getElementById('insertText').onclick=()=>{let v=document.getElementById('textInput').value.trim();if(v){pushHistory();pages[current].texts.push({text:v,x:textPos.x,y:textPos.y,color:document.getElementById('color').value,size:Math.max(14,+document.getElementById('size').value*5)});render();updateThumbs()}document.getElementById('textInput').value='';document.getElementById('textDialog').classList.add('hidden')};
function makePageImage(i,scale=1){let old=current;current=i;render();let out=document.createElement('canvas');out.width=W*scale;out.height=H*scale;let o=out.getContext('2d');o.drawImage(canvas,0,0,out.width,out.height);current=old;render();return out}
document.getElementById('exportJpg').onclick=()=>{const a=document.createElement('a');a.download=(document.getElementById('noteTitle').value||'notes')+'-page-'+(current+1)+'.jpg';a.href=makePageImage(current,1.5).toDataURL('image/jpeg',.92);a.click()};
document.getElementById('exportPdf').onclick=async()=>{if(!window.jspdf){alert('PDF library is still loading. Try again.');return}const {jsPDF}=window.jspdf;let pdf=new jsPDF({orientation:'portrait',unit:'px',format:[W,H]});pages.forEach((_,i)=>{let img=makePageImage(i,1);if(i)pdf.addPage([W,H],'p');pdf.addImage(img.toDataURL('image/jpeg',.92),'JPEG',0,0,W,H)});pdf.save((document.getElementById('noteTitle').value||'notes')+'.pdf')};
init();
