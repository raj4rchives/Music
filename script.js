const KEY="jee370rTrackerV3";
const LEGACY_V2="jee370rTrackerV2";
const LEGACY_V1="jee370rTrackerV1";

// HW + Class Illustration are intentionally ONE field per subject.
const fields=[
  "date","lec",
  "phyWork","chemWork","mathWork",
  "chemDpp","mathDpp",
  "phyPyq","chemPyq","mathPyq"
];
const tbody=document.querySelector("#tracker tbody");

function makeRows(){
  tbody.innerHTML="";
  for(let i=0;i<15;i++){
    const tr=document.createElement("tr");
    tr.dataset.i=i;
    tr.innerHTML=fields.map((f,j)=>`<td><input data-f="${f}" ${j===0?'type="date"':''} inputmode="numeric"></td>`).join("");
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll("input").forEach(x=>x.addEventListener("input",()=>{
    updateStats();
    autoExtendRows();
  }));
}

function rowsData(){
  return [...tbody.querySelectorAll("tr")].map(tr=>{
    const o={};
    tr.querySelectorAll("input").forEach(i=>o[i.dataset.f]=i.value);
    return o;
  });
}

function setData(data){
  makeRows();
  (data||[]).forEach((o,i)=>{
    while(i>=tbody.children.length) addRows(15);
    const tr=tbody.children[i];
    fields.forEach(f=>{if(o[f]!=null)tr.querySelector(`[data-f="${f}"]`).value=o[f]});
  });
  updateStats();
}

function migrateData(){
  const v3=JSON.parse(localStorage.getItem(KEY)||"null");
  if(v3 && Array.isArray(v3.rows)) return v3;

  // Convert the previous V2 format where HW and ILLU were separate.
  const v2=JSON.parse(localStorage.getItem(LEGACY_V2)||"null");
  if(v2 && Array.isArray(v2.rows)){
    return {
      startDate:v2.startDate||"",
      rows:v2.rows.map(r=>({
        date:r.date||"", lec:r.lec||"",
        phyWork:combine(r.phyHw,r.phyIllu),
        chemWork:combine(r.chemHw,r.chemIllu),
        mathWork:combine(r.mathHw,r.mathIllu),
        chemDpp:r.chemDpp||"", mathDpp:r.mathDpp||"",
        phyPyq:r.phyPyq||"", chemPyq:r.chemPyq||"", mathPyq:r.mathPyq||""
      }))
    };
  }

  // Convert the original V1 format. Its single PYQ total is kept as Physics PYQ
  // because the old file had no subject-wise PYQ information.
  const v1=JSON.parse(localStorage.getItem(LEGACY_V1)||"null");
  if(v1 && Array.isArray(v1.rows)){
    return {
      startDate:v1.startDate||"",
      rows:v1.rows.map(r=>({
        date:r.date||"", lec:r.lec||"",
        phyWork:r.phy||"", chemWork:r.chem||"", mathWork:r.math||"",
        chemDpp:r.chemDpp||"", mathDpp:r.mathDpp||"",
        phyPyq:r.pyq||"", chemPyq:"", mathPyq:""
      }))
    };
  }
  return null;
}

function combine(a,b){
  const x=String(a||"").trim(), y=String(b||"").trim();
  if(x && y) return `${x} + ${y}`;
  return x||y;
}

function save(){
  localStorage.setItem(KEY,JSON.stringify({startDate:document.querySelector("#startDate").value,examDate:document.querySelector("#examDate").value,rows:rowsData()}));
  alert("Progress saved on this device.");
}

function load(){
  const x=migrateData();
  if(!x){alert("No saved tracker found.");return}
  document.querySelector("#startDate").value=x.startDate||"";
  document.querySelector("#examDate").value=x.examDate||document.querySelector("#examDate").value;
  setData(x.rows);
  localStorage.setItem(KEY,JSON.stringify(x));
}

function clearAll(){
  if(!confirm("Clear all study data?"))return;
  localStorage.removeItem(KEY);
  document.querySelector("#startDate").value="";
  setData([]);
}

function addRows(count=15){
  const start=tbody.children.length;
  for(let i=0;i<count;i++){
    const tr=document.createElement("tr");
    tr.dataset.i=start+i;
    tr.innerHTML=fields.map((f,j)=>`<td><input data-f="${f}" ${j===0?'type="date"':''} inputmode="numeric"></td>`).join("");
    tbody.appendChild(tr);
    tr.querySelectorAll("input").forEach(x=>x.addEventListener("input",()=>{updateStats();autoExtendRows();}));
  }
}

function autoExtendRows(){
  const rows=[...tbody.children];
  const last=rows.slice(-3);
  if(last.some(tr=>[...tr.querySelectorAll("input")].some(i=>i.value.trim()!==""))){
    addRows(15);
  }
}

function fillDates(){
  const s=document.querySelector("#startDate").value;
  if(!s){alert("Select a start date first.");return}
  const d=new Date(s+"T00:00:00");
  [...tbody.children].forEach((tr,i)=>{
    const x=new Date(d);x.setDate(d.getDate()+i);
    tr.querySelector('[data-f="date"]').value=x.toISOString().slice(0,10);
  });
  updateStats();
}

function num(v){
  const m=String(v||"").match(/\d+/);
  return m?Number(m[0]):0;
}

function sumField(data,field){
  return data.reduce((s,r)=>s+num(r[field]),0);
}

function put(id,value){
  const el=document.getElementById(id);
  if(el) el.textContent=value;
}

function updateStats(){
  const data=rowsData();
  const done=data.filter(r=>Object.values(r).some(v=>String(v||"").trim()!=="")).length;
  const lec=sumField(data,"lec");

  const phyWork=sumField(data,"phyWork");
  const chemWork=sumField(data,"chemWork");
  const mathWork=sumField(data,"mathWork");
  const chemDpp=sumField(data,"chemDpp");
  const mathDpp=sumField(data,"mathDpp");
  const phyPyq=sumField(data,"phyPyq");
  const chemPyq=sumField(data,"chemPyq");
  const mathPyq=sumField(data,"mathPyq");

  const phy=phyWork+phyPyq;
  const chem=chemWork+chemDpp+chemPyq;
  const math=mathWork+mathDpp+mathPyq;
  const overall=phy+chem+math;
  const pyq=phyPyq+chemPyq+mathPyq;
  const dpp=chemDpp+mathDpp;
  const avg=done?Math.round(overall/done):0;
  const target=done?Math.min(100,Math.round(overall/(done*70)*100)):0;

  put("daysDone",done);
  put("lecSum",lec);
  put("questionSum",overall);
  put("pyqSum",pyq);
  put("avgQ",avg);
  put("qTarget",target+"%");

  put("phyWorkSum",phyWork); put("chemWorkSum",chemWork); put("mathWorkSum",mathWork); put("workSum",phyWork+chemWork+mathWork);
  put("phyDppSum",0); put("chemDppSum",chemDpp); put("mathDppSum",mathDpp); put("dppSum",dpp);
  put("phyPyqSum",phyPyq); put("chemPyqSum",chemPyq); put("mathPyqSum",mathPyq); put("pyqDetailSum",pyq);
  put("phyTotal",phy); put("chemTotal",chem); put("mathTotal",math); put("overallTotal",overall);
}

function monthKey(date){ return String(date||'').slice(0,7); }
function getMonths(){
  const keys=[...new Set(rowsData().map(r=>monthKey(r.date)).filter(Boolean))].sort();
  return keys;
}
function phaseNumber(key){ const keys=getMonths(); const i=keys.indexOf(key); return i<0?'—':i+1; }
function monthRows(key){ return rowsData().filter(r=>monthKey(r.date)===key); }
function monthSummary(key){
  const d=monthRows(key), done=d.filter(r=>Object.values(r).some(v=>String(v||'').trim()!=='' )).length;
  const sum=f=>d.reduce((a,r)=>a+num(r[f]),0);
  const phyWork=sum('phyWork'), chemWork=sum('chemWork'), mathWork=sum('mathWork');
  const chemDpp=sum('chemDpp'), mathDpp=sum('mathDpp');
  const phyPyq=sum('phyPyq'), chemPyq=sum('chemPyq'), mathPyq=sum('mathPyq');
  const phy=phyWork+phyPyq, chem=chemWork+chemDpp+chemPyq, math=mathWork+mathDpp+mathPyq;
  return {days:done,lec:sum('lec'),phyWork,chemWork,mathWork,chemDpp,mathDpp,phyPyq,chemPyq,mathPyq,phy,chem,math,total:phy+chem+math,pyq:phyPyq+chemPyq+mathPyq};
}
function updateCountdown(){
  const input=document.querySelector('#examDate'); const out=document.querySelector('#countdown'); const label=document.querySelector('#examDateLabel');
  if(!input||!out)return; const v=input.value; if(!v){out.textContent='—';label.textContent='Set your target exam date above';return;}
  const target=new Date(v+'T00:00:00'); const now=new Date(); target.setHours(0,0,0,0); now.setHours(0,0,0,0);
  const days=Math.ceil((target-now)/86400000);
  out.textContent=days>0?`${days} DAYS LEFT`:days===0?'EXAM DAY':'DATE PASSED';
  label.textContent=target.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
}
function exportJSON(){
  const payload={version:5,exportedAt:new Date().toISOString(),startDate:document.querySelector('#startDate').value,examDate:document.querySelector('#examDate').value,rows:rowsData()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='jee-tracker-backup.json'; a.click(); URL.revokeObjectURL(a.href);
}
function importJSON(file){
  const r=new FileReader(); r.onload=()=>{ try{const x=JSON.parse(r.result); if(!Array.isArray(x.rows)) throw new Error('Invalid backup'); document.querySelector('#startDate').value=x.startDate||''; if(x.examDate)document.querySelector('#examDate').value=x.examDate; setData(x.rows); save(); alert('JSON imported successfully.');}catch(e){alert('Invalid JSON backup.');} }; r.readAsText(file); }
async function makeMonthlyPDF(){
  const key=document.querySelector('#reportMonth').value; if(!key){alert('Select a report month first.');return;}
  const rows=monthRows(key); if(!rows.length){alert('No study data found for this month.');return;}
  const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); const m=monthSummary(key);
  const [y,mo]=key.split('-'); const name=new Date(Number(y),Number(mo)-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  pdf.setFont('helvetica','bold'); pdf.setFontSize(18); pdf.text(`370R JEE Tracker — Phase ${phaseNumber(key)} — ${name}`,14,16);
  pdf.setFontSize(10); pdf.text(`Study days: ${m.days}   Lectures: ${m.lec}   Total Questions: ${m.total}   PYQs: ${m.pyq}   Avg Q/day: ${m.days?Math.round(m.total/m.days):0}`,14,24);
  pdf.setFontSize(11); pdf.text('Subject summary',14,34);
  const rowsSummary=[['HW / CLASS ILLU',m.phyWork,m.chemWork,m.mathWork,m.phyWork+m.chemWork+m.mathWork],['DPP',0,m.chemDpp,m.mathDpp,m.chemDpp+m.mathDpp],['PYQ',m.phyPyq,m.chemPyq,m.mathPyq,m.pyq],['TOTAL',m.phy,m.chem,m.math,m.total]];
  pdf.autoTable ? pdf.autoTable({startY:38,head:[['TYPE','PHYSICS','CHEMISTRY','MATHEMATICS','TOTAL']],body:rowsSummary,theme:'grid'}) : null;
  let yy=pdf.lastAutoTable?pdf.lastAutoTable.finalY+10:45;
  pdf.setFontSize(10); pdf.text('Daily log',14,yy); yy+=5;
  const body=rows.map(r=>[r.date,r.lec,r.phyWork,r.chemWork,r.mathWork,r.chemDpp,r.mathDpp,sumText(r.phyPyq)+sumText(r.chemPyq)+sumText(r.mathPyq)]);
  if(pdf.autoTable) pdf.autoTable({startY:yy,head:[['DATE','LEC','PHY HW/ILLU','CHEM HW/ILLU','MATH HW/ILLU','CHEM DPP','MATH DPP','PYQ TOTAL']],body,theme:'grid',styles:{fontSize:7}});
  pdf.save(`JEE-Tracker-Phase-${phaseNumber(key)}-${key}.pdf`);
}

async function makePDF(){
  const {jsPDF}=window.jspdf;
  const img=new Image();
  img.src="tracker-template.png";
  await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
  const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  pdf.addImage(img,"PNG",0,0,210,297);

  // The supplied template keeps HW/Class Illustration together and has one PYQ total column.
  // For the PDF, the three subject PYQs are combined into the template's PYQS TOTAL cell.
  const sx=210/1086, sy=297/1536;
  const cols=[20,148,250,370,481,585,679,790,1003];
  const centers=cols.slice(0,-1).map((x,i)=>((x+cols[i+1])/2)*sx);
  const tableTop=264, rowH=(1398-264)/15;
  const data=rowsData();

  pdf.setFont("helvetica","bold");
  pdf.setTextColor(20,20,20);
  pdf.setFontSize(7);

  data.forEach((r,i)=>{
    const y=(tableTop+(i+.5)*rowH)*sy+1.7;
    const pyq= sumText(r.phyPyq)+sumText(r.chemPyq)+sumText(r.mathPyq);
    const vals=[r.date,r.lec,r.phyWork,r.chemWork,r.mathWork,r.chemDpp,r.mathDpp,pyq];
    vals.forEach((v,j)=>{
      if(v==="" || v==null)return;
      let text=String(v);
      if(j===0 && /^\d{4}-\d{2}-\d{2}$/.test(text)){
        const [yy,mm,dd]=text.split("-"); text=`${dd}/${mm}`;
      }
      const maxChars=j===0?10:(j===1?7:12);
      if(text.length>maxChars)text=text.slice(0,maxChars-1)+"…";
      pdf.text(text,centers[j],y,{align:"center",maxWidth:(cols[j+1]-cols[j])*sx-2});
    });
  });

  pdf.save("370R-JEE-Advanced-Tracker-Filled.pdf");
}

function sumText(v){ return num(v); }

document.querySelector("#saveBtn").onclick=save;
document.querySelector("#loadBtn").onclick=load;
document.querySelector("#clearBtn").onclick=clearAll;
document.querySelector("#datesBtn").onclick=fillDates;
document.querySelector("#addBtn").onclick=()=>addRows(15);
document.querySelector("#pdfBtn").onclick=makePDF;
document.querySelector("#monthPdfBtn").onclick=makeMonthlyPDF;
document.querySelector("#jsonExportBtn").onclick=exportJSON;
document.querySelector("#jsonImport").addEventListener("change",e=>{if(e.target.files[0])importJSON(e.target.files[0]);});
document.querySelector("#examDate").addEventListener("change",()=>{updateCountdown();save();});
setInterval(updateCountdown,60000);
updateCountdown();

makeRows();
const saved=migrateData();
if(saved){
  document.querySelector("#startDate").value=saved.startDate||"";
  document.querySelector("#examDate").value=saved.examDate||document.querySelector("#examDate").value;
  setData(saved.rows);
}
updateStats();


const EXAM_KEY="jeeExamTargetV1";
const defaultExamDates={mains:"2027-01-24",advanced:"2027-05-23"};

function initExamTarget(){
  const saved=JSON.parse(localStorage.getItem(EXAM_KEY)||"null");
  const target=saved?.target||"mains";
  const date=saved?.date||defaultExamDates[target];
  document.querySelector("#examTarget").value=target;
  document.querySelector("#examDate").value=date;
  updateExamCountdown();
}
function saveExamTarget(){
  const target=document.querySelector("#examTarget").value;
  const date=document.querySelector("#examDate").value;
  localStorage.setItem(EXAM_KEY,JSON.stringify({target,date}));
  updateExamCountdown();
}
function updateExamCountdown(){
  const target=document.querySelector("#examTarget").value;
  const date=document.querySelector("#examDate").value;
  const label=target==="mains"?"JEE Main":"JEE Advanced";
  document.querySelector("#examLabel").textContent=label+" countdown";
  if(!date){document.querySelector("#examCountdown").textContent="Set date";return}
  const exam=new Date(date+"T00:00:00");
  const today=new Date();
  today.setHours(0,0,0,0);
  const days=Math.ceil((exam-today)/86400000);
  document.querySelector("#examCountdown").textContent =
    days>0 ? `${days} days left` : days===0 ? "Exam day!" : `${Math.abs(days)} days ago`;
}
document.querySelector("#examTarget").addEventListener("change",()=>{
  const target=document.querySelector("#examTarget").value;
  const saved=JSON.parse(localStorage.getItem(EXAM_KEY)||"null");
  const date=saved?.target===target && saved?.date ? saved.date : defaultExamDates[target];
  document.querySelector("#examDate").value=date;
  saveExamTarget();
});
document.querySelector("#examDate").addEventListener("change",saveExamTarget);
initExamTarget();
setInterval(updateExamCountdown,60000);
