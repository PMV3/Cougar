const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const fields={};const c={console,document:{getElementById:id=>fields[id]??={value:''}},ctx:{clearRect(){}},ctx1:{clearRect(){}},canvas:{},canvas1:{},showToast(){},drawFoundPoint(){},drawline(){},showerrornum:0,formatToTwoDecimals:n=>Number(n).toFixed(2)};vm.createContext(c);
for(const f of ['datafolder/heightloosemap.js','datafolder/weightindex.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
const s=fs.readFileSync('scripts.js','utf8');for(const n of ['count','count_1_1','count_6']){const a=s.indexOf('function '+n+'('),b=s.indexOf('\nfunction ',a+1);vm.runInContext(s.slice(a,b),c);}
function run(weight,wind,hp=4234.9,oat=30){for(const [id,v] of Object.entries({'#qat':oat,'#hp':hp,'#acweight':weight,'#wind':wind}))c.document.getElementById(id).value=v;c.count_6();fields['#heightloose']={value:'old result'};c.count(1);return fields['#heightloose'].value;}
for(const w of [20753.9,20871,20211])assert.equal(run(w,0),'Outside chart');
for(const wind of [0,0.001,10,25,50])assert.ok(Number.isFinite(Number(run(17000,wind))),`Valid wind ${wind}`);
const zero=Number(run(17000,0)),near=Number(run(17000,0.001));assert.ok(Math.abs(zero-near)<0.1);
assert.equal(run(17000,-1),'Outside chart');
// Independently read the zero-wind line for the fallback weight-index path.
fields['#wind'].value=0;fields['#Wheight_index_6'].value=9;
const expected=vm.runInContext('600-((1062-getYForX(854-(9-7)/4*(854-522),windspeedline[5]))/(1062-642))*600',c);
c.count_1_1();assert.ok(Math.abs(Number(fields['#heightloose'].value)-expected)<0.011);
console.log('PASS: three screenshot cases explicitly outside chart; valid zero/near-zero/10/25/50 kt; invalid input; zero-wind fallback equals direct chart lookup.');
