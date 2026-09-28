const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const context={};vm.createContext(context);
const files=['datafolder/heightloosemap.js','datafolder/weightindex.js','datafolder/newIGE.js','datafolder/ige5ft_agw.js','datafolder/newhoge.js','datafolder/serviceCeiling.js','datafolder/serviceclimbing.js','datafolder/levelflightData.js','perf/atmosphere.js','perf/hover5ft.js','perf/hover10ft.js','perf/weightindex.js','perf/levelflight.js','perf/target-mission.js'];
for(const file of files)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const engine=context.TARGET_MISSION;
const base={weight:18000,fuel:3000,hp:0,oat:15,cg:185,loads:{passengerA:400,sectionA:100}};
const input={enabled:true,distance:25,speed:120,elevation:0,qnh:1013.25,oat:15,onSite:5,changes:[]};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
// Independently known fixed-flow case to verify units and conservation.
const actualFlow=context.LEVELFLIGHT.fuelFlow;
context.LEVELFLIGHT.fuelFlow=()=>({lbPerHour:600});
let r=engine.compute(base,input);
assert.equal(r.error,null);close(r.travelMinutes,12.5);close(r.outbound.burn,125);close(r.onSite.burn,50);
close(r.scenarios[1].weight,17725);close(r.scenarios[1].fuel,2725);close(r.scenarios[2].weight,17675);
assert.equal(r.scenarios[1].cg,null);
let loadInput={...input,changes:[{position:'passengerA',action:'remove',quantity:1,weight:200},{position:'sectionB',action:'add',quantity:1,weight:100}]};
r=engine.compute(base,loadInput);close(r.scenarios[2].weight,17575);close(r.scenarios[2].fuel,2675);close(r.loadDelta,-100);close(r.loadMomentDelta,-200*96.69+100*140);
context.LEVELFLIGHT.fuelFlow=actualFlow;
// Failure states must not manufacture complete target results.
for(const patch of [{speed:0},{distance:-1},{distance:Infinity},{onSite:-1},{qnh:0},{qnh:1200},{oat:null},{override:true,routeHp:null,routeOat:15},{override:true,routeHp:11000,routeOat:15},{override:true,routeHp:0,routeOat:90},{speed:199},{changes:[{position:'passengerA',action:'remove',quantity:3,weight:200}]}]) {
    r=engine.compute(base,{...input,...patch});assert.ok(r.error,JSON.stringify(patch));assert.ok(r.scenarios.length<3);
}
r=engine.compute({...base,fuel:151},input);assert.match(r.error,/Not enough fuel/);
r=engine.compute(base,{...input,enabled:false});assert.equal(r.scenarios.length,0);
r=engine.compute(base,{...input,distance:0,onSite:0});assert.equal(r.error,null);close(r.scenarios[2].weight,base.weight-150);assert.equal(r.outbound.burn,0);
r=engine.compute(base,{...input,override:true,routeHp:1000,routeOat:20});assert.equal(r.error,null);assert.equal(r.outbound.chart.approximate,true);
r=engine.compute({...base,weight:30000},input);assert.match(r.error,/weight is outside/);
// Matrix of real charts: preserve weight/fuel and return explicit errors.
let valid=0,unavailable=0;
for(const weight of [16000,18000,21000])for(const hp of [0,3000,6000])for(const oat of [15,30])for(const speed of [100,120])for(const distance of [0,25,100])for(const onSite of [0,5]) {
    const b={...base,weight,hp,oat};const i={...input,speed,distance,onSite,elevation:hp,oat};r=engine.compute(b,i);
    if(r.error){unavailable++;continue;}
    assert.equal(r.scenarios.length,3);const a=r.scenarios[1],d=r.scenarios[2];
    close(a.weight,weight-150-r.outbound.burn);close(a.fuel,base.fuel-150-r.outbound.burn);
    close(d.weight,a.weight-r.onSite.burn);close(d.fuel,a.fuel-r.onSite.burn);
    assert.ok(d.fuel>=0);assert.ok(d.weight<=a.weight);assert.equal(a.cg,null);
    assert.ok(!JSON.stringify(r).includes('NaN'));valid++;
}
// Compare the ported OGE/ceiling/climb transforms to existing STEP2 functions.
const source=fs.readFileSync(path.join(root,'scripts.js'),'utf8');const fields={};
context.document={getElementById:id=>fields[id]??={value:''}};
context.ctx2=context.ctx3=context.ctx5={clearRect(){}};
context.canvas2=context.canvas3=context.canvas5={width:100,height:100};
context.drawFoundPoint=context.drawline=context.showToast=()=>{};context.showerrornum=0;context.formatToTwoDecimals=v=>Number(v).toFixed(2);
for(const name of ['count_3','count_4','count_7']) {const start=source.indexOf('function '+name+'(');const end=source.indexOf('\nfunction ',start+1);vm.runInContext(source.slice(start,end),context);}
let parity=0;
for(const hp of [1000,5000,10000])for(const oat of [0,15,30])for(const weight of [15000,18000,21000]) {
    const p=engine.performance(weight,hp,oat);
    for(const[id,value]of Object.entries({'#hp':hp,'#qat':oat,'#acweight':weight,'#wind':0,'#Wheight_index_6':p.index}))context.document.getElementById(id).value=String(value);
    context.count_3();context.count_4();
    // Legacy climb code can index beyond the last printed curve; our engine
    // returns unavailable there rather than propagating its exception.
    context.document.getElementById('#rc').value='';
    try { context.count_7(); } catch(e) { assert.ok(e instanceof Error || /undefined/.test(e.message)); }
    for(const [key,id]of [['oge','#enginhoge_weight'],['ceiling','#ceilinghp_3'],['climb','#rc']]) {
        const expected=Number.parseFloat(context.document.getElementById(id).value);
        if(Number.isFinite(expected)&&p[key]!=null){assert.ok(Math.abs(expected-p[key])<0.011,`${key}: ${expected}/${p[key]}`);parity++;}
    }
}
console.log(`PASS: fixed-flow accounting, load changes, invalid inputs, exhaustion, chart bounds, zero-duration and nearest-chart disclosure; ${valid} real-chart scenarios, ${unavailable} explicit unavailable scenarios; ${parity} existing STEP2 metric comparisons.`);

// Optional jettison uses a fixed total removal after all target changes/burn.
const plain=engine.compute(base,loadInput);
const jet=engine.compute(base,{...loadInput,jettison:true});
assert.equal(jet.error,null);assert.equal(jet.scenarios.length,4);
assert.deepEqual(jet.scenarios.slice(0,3),plain.scenarios);
close(jet.scenarios[3].weight,plain.scenarios[2].weight-660);
close(jet.scenarios[3].fuel,plain.scenarios[2].fuel-660);
assert.equal(jet.scenarios[3].cg,null);assert.equal(jet.jettisonWeight,660);
close(jet.scenarios[3].fiveMargin,plain.scenarios[2].fiveMargin+660);
for(const fuel of [809,810,811]) {
 const result=engine.compute({...base,fuel},{...input,distance:0,onSite:0,jettison:true});
 assert.equal(result.error,null);
 if(fuel<810){assert.equal(result.scenarios.length,3);assert.match(result.jettisonError,/below/);}
 else {assert.equal(result.scenarios.length,4);close(result.scenarios[3].fuel,fuel-810);}
}
assert.deepEqual(engine.compute(base,{...loadInput,jettison:true}),jet);
console.log('PASS: jettison conservation, unchanged base/target scenarios, load changes, CG unavailable, fuel boundaries, repeatability.');

context.LEVELFLIGHT.fuelFlow=()=>({lbPerHour:600});
const manual={...input,refuel:500,jettison:true,changes:[{kind:'personnel',action:'remove',weight:200},{kind:'cargo',action:'add',weight:350}]};
r=engine.compute({...base,emptyWeight:13799},manual);
assert.equal(r.error,null);close(r.loadDelta,150);close(r.scenarios[1].fuel,2725);
close(r.scenarios[2].weight,18325);close(r.scenarios[2].fuel,3175);
close(r.scenarios[3].weight,17665);close(r.scenarios[3].fuel,2515);
for(const refuel of [-1,Infinity,7000]) assert.ok(engine.compute(base,{...manual,refuel}).error);
assert.ok(engine.compute(base,{...manual,changes:[{kind:'cargo',action:'add',weight:null}]}).error);
assert.ok(engine.compute({...base,emptyWeight:13799},{...manual,changes:[{kind:'cargo',action:'remove',weight:2000}]}).error);
context.LEVELFLIGHT.fuelFlow=actualFlow;
console.log('PASS: manual personnel/cargo totals, refuelling conservation, jettison after refuelling, invalid amounts and capacity.');

// Departure refuelling must not change on-site consumption or fund earlier burn.
const withoutRefuel=engine.compute(base,input);
const withRefuel=engine.compute(base,{...input,refuel:500});
assert.equal(withRefuel.error,null);
close(withRefuel.onSite.burn,withoutRefuel.onSite.burn);
close(withRefuel.scenarios[2].fuel,withoutRefuel.scenarios[2].fuel+500);
close(withRefuel.scenarios[2].weight,withoutRefuel.scenarios[2].weight+500);
context.LEVELFLIGHT.fuelFlow=()=>({lbPerHour:600});
assert.ok(engine.compute({...base,fuel:180},{...input,distance:0,refuel:500}).error);
const capacityAfterBurn=engine.compute({...base,fuel:6738.5},{...input,distance:0,refuel:200});
assert.equal(capacityAfterBurn.error,null);
close(capacityAfterBurn.scenarios[2].fuel,6738.5);
assert.ok(engine.compute({...base,fuel:6738.5},{...input,distance:0,refuel:201}).error);
context.LEVELFLIGHT.fuelFlow=actualFlow;
console.log('PASS: refuelling after on-site burn, pre-refuelling exhaustion and departure capacity.');

// STEP3 parity: nearest temperature selection must not be blocked by target planning.
// A missing best-range inset must never prevent fuel at an entered TAS.
const savedBest=context.LEVELFLIGHT.bestRangeSpeed;
context.LEVELFLIGHT.bestRangeSpeed=()=>{throw new Error('Target fuel must not request best-range speed');};
for(const hp of [-1000,0,3000,6000,9000,10000]) for(const oat of [-5,15,35]) {
 const b={...base,hp,oat};
 const i={...input,distance:1,speed:100,onSite:0.5,elevation:hp,oat};
 const result=engine.compute(b,i);
 assert.equal(result.error,null,`hp=${hp}, oat=${oat}: ${result.error}`);
 const key=context.LEVELFLIGHT.selectKey(hp,oat);
 const expected=context.LEVELFLIGHT.fuelFlow(key,b.weight-150,100).lbPerHour;
 close(result.outbound.rate,expected);
 const arrival=result.scenarios[1];
 const siteKey=context.LEVELFLIGHT.selectKey(arrival.hp,oat);
 close(result.onSite.rate,context.LEVELFLIGHT.fuelFlow(siteKey,arrival.weight,100).lbPerHour);
 assert.equal(result.outbound.chart.key,key);
 if(result.outbound.chart.approximate) assert.ok(result.notes.some(n=>n.includes('nearest chart:')));
}
context.LEVELFLIGHT.bestRangeSpeed=savedBest;
console.log('PASS: 18 STEP3 fuel lookup comparisons for outbound and on-site, nearest-chart disclosure, and independence from best-range speed.');

for(const amount of [660,1000,1723]) {
 const result=engine.compute(base,{...input,jettison:true,jettisonAmount:amount});
 assert.equal(result.error,null);assert.equal(result.jettisonError,undefined);
 close(result.scenarios[2].weight-result.scenarios[3].weight,amount);
 close(result.scenarios[2].fuel-result.scenarios[3].fuel,amount);
 assert.equal(result.jettisonWeight,amount);
}
for(const amount of [null,0,659,1724,Infinity,NaN]) {
 const result=engine.compute(base,{...input,jettison:true,jettisonAmount:amount});
 assert.ok(result.jettisonError);assert.equal(result.scenarios.length,3);
}
r=engine.compute({...base,fuel:1100},{...input,distance:0,onSite:0,jettison:true,jettisonAmount:1000});
assert.match(r.jettisonError,/below/);assert.equal(r.scenarios.length,3);
console.log('PASS: editable jettison 660/1000/1723 lb, invalid/empty amounts and insufficient remaining fuel.');

// Regression: 20,403 lb lies inside the WI chart even when 21,000 lb does not cross Y.
const edge=context.WEIGHTINDEX.trace(30,7435,20403);
assert.ok(edge && edge.index>12 && edge.index<13);
const i=4,t=(20403-20000)/1000;
const check=vm.runInContext(`(()=>{const x=${edge.X};return getYForX(x,forActualweightlb_6[5].slice().reverse())*(1-${t})+getYForX(x,forActualweightlb_6[4].slice().reverse())*${t};})()`,context);
close(check,edge.Y);
assert.equal(context.WEIGHTINDEX.compute(30,7435,21000),null);
const ep=engine.performance(20403,7435,30);
for(const[id,value]of Object.entries({'#hp':7435,'#qat':30,'#acweight':20403,'#wind':0,'#Wheight_index_6':ep.index.toFixed(2)}))context.document.getElementById(id).value=String(value);
context.count_7();
console.log('PASS: boundary weight index '+edge.index.toFixed(2)+'; OEI climb '+context.document.getElementById('#rc').value+' ft/min; intermediate curve stays inside printed bounds.');
