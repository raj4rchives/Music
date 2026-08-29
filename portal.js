(function(){
const plans={starter:{name:'Starter',price:99},pro:{name:'Pro',price:199},elite:{name:'Elite',price:299}};
const params=new URLSearchParams(location.search); const selected=plans[params.get('plan')]||plans.starter;
function set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
const signup=document.getElementById('signupForm');
if(signup){signup.addEventListener('submit',e=>{e.preventDefault(); const user={name:document.getElementById('name').value,email:document.getElementById('email').value,exam:document.getElementById('exam').value};set('examyUser',user); location.href='login.html?plan='+encodeURIComponent(params.get('plan')||'starter')})}
const login=document.getElementById('loginForm');
if(login){login.addEventListener('submit',e=>{e.preventDefault();const email=document.getElementById('email').value;const user=get('examyUser')||{name:email.split('@')[0],email};user.email=email;set('examyUser',user);location.href='checkout.html?plan='+encodeURIComponent(params.get('plan')||'starter')})}
const planName=document.getElementById('planName'); if(planName){planName.textContent=selected.name;document.getElementById('planPrice').innerHTML='₹'+selected.price+'<span>/month</span>';document.getElementById('sumPlan').textContent=selected.name;document.getElementById('sumPrice').textContent='₹'+selected.price;}
const upi=document.getElementById('upiId'); const intent=document.getElementById('upiIntent'); if(upi&&intent){const uri='upi://pay?pa=6900365026@superyes&pn=EXAMYWEB&am='+selected.price+'&cu=INR&tn='+encodeURIComponent('EXAMYWEB '+selected.name+' subscription');intent.href=uri;}
const copy=document.getElementById('copyUpi'); if(copy){copy.onclick=async()=>{try{await navigator.clipboard.writeText('6900365026@superyes');copy.textContent='Copied ✓';setTimeout(()=>copy.textContent='Copy',1500)}catch(e){alert('UPI ID: 6900365026@superyes')}}}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.pay-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.tab).classList.add('active')}));
const submit=document.getElementById('submitPayment'); if(submit){submit.onclick=()=>{const utr=document.getElementById('utr').value.trim();const msg=document.getElementById('paymentMsg');if(utr.length<6){msg.textContent='Please enter a valid UTR / transaction ID.';msg.style.color='#ff9d9d';return} const user=get('examyUser')||{};set('examyPayment',{plan:selected.name,amount:selected.price,utr,status:'PENDING',submittedAt:new Date().toISOString(),email:user.email||''});msg.textContent='Payment submitted for verification. Tracker access should be granted only after server-side verification.';msg.style.color='#8bdab1';}};
})();
