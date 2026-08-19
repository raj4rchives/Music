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
  tbody.querySelectorAll("input").forEach(x=>x.addEventListener("input",updateStats));
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
  (data||[]).slice(0,15).forEach((o,i)=>{
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
  localStorage.setItem(KEY,JSON.stringify({startDate:document.querySelector("#startDate").value,rows:rowsData()}));
  alert("Progress saved on this device.");
}

function load(){
  const x=migrateData();
  if(!x){alert("No saved tracker found.");return}
  document.querySelector("#startDate").value=x.startDate||"";
  setData(x.rows);
  localStorage.setItem(KEY,JSON.stringify(x));
}

function clearAll(){
  if(!confirm("Clear all 15 days?"))return;
  localStorage.removeItem(KEY);
  document.querySelector("#startDate").value="";
  setData([]);
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
  const target=Math.min(100,Math.round(overall/(15*70)*100));

  put("daysDone",done+"/15");
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
document.querySelector("#pdfBtn").onclick=makePDF;

makeRows();
const saved=migrateData();
if(saved){
  document.querySelector("#startDate").value=saved.startDate||"";
  setData(saved.rows);
}
updateStats();
