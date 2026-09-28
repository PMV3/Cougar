const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element {
 constructor(){this.children=[];this.childNodes=[];this.value='';this.attrs={};}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(k,v){this.attrs[k]=v;}
 replaceChildren(){this.children=[];}
 querySelectorAll(){return this.children;}
 before(n){this.beforeNode=n;}
 click(){this.onclick();}
 focus(){}
}
const inputs=Object.fromEntries(['#acweight','#hp','#qat','#wind'].map((id,i)=>[id,Object.assign(new Element(),{value:['18000','0','15','10'][i]})]));
const base=Object.values(inputs).map(e=>e.value),top=new Element(),header=new Element();header.childNodes=[{nodeType:3,textContent:'BASE'}];
const results=[new Element()];let chartCalls=[],calcCalls=[];
inputs['decision-panel']={querySelector:()=>header};
const document={createElement:()=>new Element(),getElementById:id=>inputs[id],querySelector:s=>s==='.performance-top-row'?top:s==='.calc-btn.active'?{id:'btn-twinige'}:null,querySelectorAll:()=>results};
const window={};
for(const n of ['count_6','count','count_3','count_4','count_5','calculate5ftIGE','count_7'])window[n]=()=>calcCalls.push(Object.keys(inputs).slice(0,4).map(k=>inputs[k].value));
window.runCalc=type=>chartCalls.push([type,inputs['#acweight'].value]);window.updateDecisionProcess=()=>{};
vm.runInNewContext(fs.readFileSync('planning/step2-phases.js','utf8'),{window,document,console});
const controller=window.STEP2_PHASES;
const phases=[{name:'Start / Base',weight:18000,hp:0,oat:15},{name:'Target Arrival',weight:17000,hp:3000,oat:30},{name:'Target Departure',weight:16500,hp:3000,oat:30},{name:'Target After Jettison (Estimate)',weight:15500,hp:3000,oat:30}];
controller.setScenarios(phases);
const tabs=top.beforeNode.children[0];assert.equal(tabs.children.length,4);
for(let i=1;i<4;i++) {
 tabs.children[i].click();assert.equal(controller.active,true);
 assert.deepEqual(calcCalls.at(-1),[phases[i].weight,3000,30,0]);
 assert.deepEqual(chartCalls.at(-1),['twinige',phases[i].weight]);
 assert.deepEqual(Object.keys(inputs).slice(0,4).map(k=>inputs[k].value),base);
 controller.refresh();assert.equal(tabs.children[i].attrs['aria-selected'],'true');
 assert.throws(()=>controller.withInputs(()=>{throw Error('test');}));assert.equal(controller.busy,false);
 assert.deepEqual(Object.keys(inputs).slice(0,4).map(k=>inputs[k].value),base);
}
tabs.children[0].click();assert.equal(controller.active,false);assert.deepEqual(calcCalls.at(-1),base);
controller.setScenarios(phases.slice(0,3));assert.equal(tabs.children.length,3);
controller.setScenarios([]);assert.equal(tabs.children.length,1);
console.log('PASS: all phase inputs and charts, zero-wind target assumption, refresh retention, base restoration, exception restoration, conditional tabs.');

controller.setScenarios(phases.slice(0,1),{enabled:true,jettison:true,error:'Fuel outside chart'});
assert.equal(tabs.children.length,4);assert.equal(tabs.children[1].disabled,true);assert.equal(tabs.children[3].disabled,true);
tabs.children[1].click();assert.equal(controller.active,false);
assert.equal(top.beforeNode.children[2].hidden,false);
controller.setScenarios(phases,{enabled:true,jettison:true});assert.equal(tabs.children[3].disabled,false);assert.equal(top.beforeNode.children[2].hidden,true);
console.log('PASS: failed phases remain visible and disabled with explanation; valid phases re-enable.');

// Comparison reads the same calculation outputs and restores the selected tab.
results[0].id='#heightloose';
window.count_7=()=>{results[0].value=String(inputs['#acweight'].value);};
tabs.children[2].click();
const comparison=controller.comparisonResults();
assert.deepEqual(Array.from(comparison,row=>row['#heightloose']),['18000','17000','16500','15500']);
assert.equal(results[0].value,'16500');
assert.equal(tabs.children[2].attrs['aria-selected'],'true');
assert.deepEqual(Object.keys(inputs).slice(0,4).map(k=>inputs[k].value),base);
assert.equal(controller.busy,false);
console.log('PASS: comparison uses phase calculation outputs and preserves active results, tab and base inputs.');
