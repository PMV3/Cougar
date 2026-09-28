const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const fields={};const get=id=>fields[id]??={value:'',textContent:'',style:{},className:''};
const source=fs.readFileSync('STEP2.html','utf8');const start=source.indexOf('function updateDecisionProcess()');const end=source.indexOf('// Add input listeners',start);
const c={window:{},document:{getElementById:get},console};vm.createContext(c);vm.runInContext(source.slice(start,end),c);
for(const [input,expected] of [['Outside chart','Outside chart'],['377.23','377 ft'],['0','0 ft'],['','--'],['Outside chart','Outside chart'],['125.4','125 ft']]) {
 get('#heightloose').value=input;c.updateDecisionProcess();assert.equal(get('decision-4-status').textContent,expected);
 if(expected.endsWith(' ft'))assert.equal(get('decision-4-status').style.fontSize,'');
}
console.log('PASS: decision height-loss card preserves outside-chart status, valid numbers, zero, blank, and subsequent phase changes.');
