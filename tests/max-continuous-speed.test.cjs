const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={};vm.createContext(context);
for(const file of ['datafolder/levelflightData.js','perf/levelflight.js'])
    vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'..',file),'utf8'),context);
const lookup=context.LEVELFLIGHT.maxContinuousSpeed;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
let count=0;
for(const [key,def] of Object.entries(vm.runInContext('LEVELFLIGHT_DATA',context))) {
    const curves=def.curves.filter(c=>Number.isFinite(c.index)).sort((a,b)=>a.index-b.index);
    for(let i=0;i<curves.length;i++) {
        const c=curves[i],last=c.data.at(-1),prev=c.data.at(-2);
        if(last[1]===def.maxContLbh && prev[1]<last[1]) {
            close(lookup(key,c.index),last[0]);count++;
            const next=curves[i+1];
            if(next && next.data.at(-1)[1]===def.maxContLbh && next.data.at(-2)[1]<def.maxContLbh)
                close(lookup(key,(c.index+next.index)/2),(last[0]+next.data.at(-1)[0])/2);
        }
    }
    assert.equal(lookup(key,curves[0].index-1),null);
    assert.equal(lookup(key,curves.at(-1).index+1),null);
}
for(const weight of [NaN,Infinity,null,undefined]) assert.equal(lookup('6000ft_30C',weight),null);
assert.equal(lookup('missing',19500),null);
close(lookup('6000ft_30C',19500),(132.69+141.52)/2);
// Test rising-side crossing, rather than a low-speed crossing or arbitrary endpoint.
context.LEVELFLIGHT.CHARTS.synthetic={def:{maxContLbh:100,curves:[
    {index:1000,data:[[0,120],[10,60],[20,80],[30,120]]},
    {index:2000,data:[[0,130],[10,70],[20,90]]}
]}};
close(lookup('synthetic',1000),25);
assert.equal(lookup('synthetic',2000),null);
assert.equal(lookup('synthetic',1500),null);
console.log(`PASS: ${count} chart endpoints, intermediate weights, invalid inputs, chart bounds and incomplete curves.`);
