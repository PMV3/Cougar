const demoInput={enabled:true,distance:55,speed:110,elevation:4500,qnh:1023,oat:30,onSite:5,override:false,refuel:300,jettison:true,jettisonAmount:1000,changes:[{kind:'cargo',action:'add',weight:150}]};
const demoBase={weight:19000,fuel:2500,hp:6000,oat:30,cg:184.6,emptyWeight:13799,loads:{}};
localStorage.clear();
localStorage.setItem('cougarTargetMission.v1',JSON.stringify({input:demoInput,base:demoBase}));
localStorage.setItem('step1SpecificData',JSON.stringify({inputs:{height:'6000',temperature:'30',wind:'0'},summaryData:{'ttl-weight':'19000'}}));
localStorage.setItem('step2SpecificData',JSON.stringify({inputs:{'#acweight':'19000','#hp':'6000','#qat':'30','#wind':'0'}}));
localStorage.setItem('step3SpecificData',JSON.stringify({inputs:{speed:'110',windEnRoute:'0'}}));
document.addEventListener('DOMContentLoaded',()=>{
 const style=document.createElement('style');style.textContent=`body{min-width:1200px} .main-content{max-width:1500px!important;margin:auto!important} .shot-heading{background:#122454;color:white;padding:20px 26px;margin:0 0 25px;font:700 24px Arial;border-radius:12px} .shot-heading small{font:14px Arial;color:#bfccea;float:right;margin-top:7px} .shot-mark{outline:3px solid #f23e59!important;outline-offset:4px;position:relative;margin-top:24px!important;margin-bottom:24px!important} .shot-tag{position:absolute;right:6px;top:-21px;background:#f23e59;color:white;font:700 14px Arial;padding:5px 12px;border-radius:5px;z-index:10}`;document.head.append(style);
 const mode=new URLSearchParams(location.search).get('shot');
 const mark=(node,text)=>{if(!node)return;node.classList.add('shot-mark');const tag=document.createElement('span');tag.className='shot-tag';tag.textContent=text;node.append(tag);};
 const timer=setInterval(async()=>{
 const target=document.getElementById(mode==='planning'?'target-planning':'target-mission-results');if(!target)return;clearInterval(timer);
 const heading=document.createElement('div');heading.className='shot-heading';heading.innerHTML=({planning:'01 — Target Planning',phases:'02 — Performance by Phase',fuel:'03 — Target Mission Fuel',chart:'04 — Max Continuous Speed & Chart Drawing'})[mode]+'<small>PMV 3 · Update preview · Example inputs</small>';document.querySelector('.main-content').prepend(heading);
 if(mode==='planning'){
  document.querySelector('.main-content').append(target);target.open=true;document.querySelectorAll('.main-content > *').forEach(n=>{if(n!==target&&n!==heading)n.style.display='none';});
  mark(target.querySelector('.target-grid'),'Distance / Speed / Target Conditions / Time on Site');
  const panels=target.querySelectorAll('.target-options .target-panel');
  target.querySelectorAll('details').forEach(n=>{if(n.textContent.includes('Personnel / cargo'))n.open=true;});
  mark(document.getElementById('target-refuel').closest('section'),'Refuelling after Time on Site');
  mark(document.getElementById('target-jettison').closest('section'),'Cabin Tank Jettison — editable fuel amount');
  const status=target.querySelector('[role=status]');if(status)status.style.display='none';
 }else if(mode==='phases'){
  target.open=true;document.querySelectorAll('.main-content > *').forEach(n=>{if(![target,heading].includes(n)&&!n.classList.contains('phase-selector')&&!n.classList.contains('performance-top-row'))n.style.display='none';});
  mark(document.querySelector('.phase-selector'),'Base / Target Arrival / Target Departure / After Jettison');
  mark(target,'Compare all 4 phases');
 }else if(mode==='fuel'){
  target.open=true;document.querySelectorAll('.main-content > *').forEach(n=>{if(![target,heading].includes(n))n.style.display='none';});
  mark(target,'Fuel burn / Refuelling / Remaining fuel for every phase');
 }else if(mode==='chart'){
  document.querySelectorAll('.main-content > *').forEach(n=>{if(n!==heading&&n.id!=='card-chart-display'&&!n.classList.contains('quick-info-bar-step3'))n.style.display='none';});
  mark(document.getElementById('maxContinuousSpeed').parentElement,'NEW — Max Continuous Speed');
  document.getElementById('speed').value='110';document.getElementById('speed').dispatchEvent(new Event('input',{bubbles:true}));
  document.getElementById('card-chart-display').classList.remove('collapsed');
 }
 },100);
});
