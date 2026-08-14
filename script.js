
document.querySelectorAll('.song').forEach(el=>{
 el.onclick=()=>{
  player.src='https://www.youtube.com/embed/'+el.dataset.id+'?autoplay=1';
 }
});
search.oninput=e=>{
 let q=e.target.value.toLowerCase();
 document.querySelectorAll('.song').forEach(s=>{
  s.style.display=s.textContent.toLowerCase().includes(q)?'block':'none';
 });
};
