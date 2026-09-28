// Optional target planning, shared across STEP1/2/3. Independent of legacy storage.
(() => {
    'use strict';
    const KEY='cougarTargetMission.v1';
    const step=/STEP([123])\.html/i.exec(location.pathname)?.[1];
    if(!step) return;
    const num=v=>String(v??'').trim()===''?null:Number(v);
    const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
    const fmt=(v,unit='')=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('en-US',{maximumFractionDigits:1})+unit:'Unavailable';
    let record={input:{enabled:false,override:false,onSite:0,changes:[]},base:null}, root, controls={}, changes, status, timer, reset=false;
    function read() {try {const r=JSON.parse(localStorage.getItem(KEY));return r?.input?r:null;}catch{return null;}}
    function save() {try {localStorage.setItem(KEY,JSON.stringify(record));}catch {status.textContent='Target plan could not be saved. Browser storage is unavailable.';}}
    function field(parent,key,label,value,type='number') {
        const wrap=el('label',label);const input=document.createElement('input');input.type=type;input.id='target-'+key;
        wrap.htmlFor=input.id;input.dataset.targetField=key;
        if(type==='checkbox') {input.checked=!!value;wrap.classList.add('target-check');}else {input.value=value??'';input.step='any';}
        if(type==='checkbox')wrap.prepend(input);else wrap.append(input);parent.append(wrap);controls[key]=input;return input;
    }
    function captureBase() {
        const value=id=>num(document.getElementById(id)?.value);
        const fuel=value('totalFuelWeight');
        const loads={};Object.keys(TARGET_MISSION.positions).forEach(k=>loads[k]=value(k+'Weight')||0);
        return {emptyWeight:value('emptyWeight'),weight:value('ttl-weight'),fuel,hp:value('height'),oat:value('temperature'),cg:value('cg-summary'),moment:value('ttl-mmnt'),loads};
    }
    function gather() {
        const input={...record.input,changes:[]};
        for(const [k,node] of Object.entries(controls)) input[k]=node.type==='checkbox'?node.checked:num(node.value);
        changes.querySelectorAll('.target-change').forEach(row=>{const c={};row.querySelectorAll('[data-change]').forEach(n=>c[n.dataset.change]=['quantity','weight'].includes(n.dataset.change)?num(n.value):n.value);input.changes.push(c);});
        return input;
    }
    function update() {
        if(reset)return;
        record.input=gather();record.base=captureBase();
        document.getElementById('target-fields').disabled=!record.input.enabled;
        document.getElementById('target-route').hidden=!record.input.override;
        document.getElementById('target-jettison-amount').hidden=!record.input.jettison;
        const i=record.input;
        const hp=i.elevation==null||i.qnh==null?null:ATM.pressureAltitude(i.elevation,i.qnh);
        document.getElementById('target-hp').textContent=fmt(hp,' ft');
        const result=TARGET_MISSION.compute(record.base,record.input);
        status.className=result.error?'target-error':'target-success';
        status.textContent=!i.enabled?'Target planning is off. Base calculations are unchanged.':result.error||'Target estimates ready. Open STEP 2 for performance or STEP 3 for fuel details.';
        save();
    }
    function addChange(data={kind:'personnel',action:'add',weight:null}) {
        // Convert saved position/quantity rows to total pounds without losing their load.
        data={...data,kind:data.kind||(data.position?.startsWith('section')?'cargo':'personnel'),weight:data.position?data.weight*data.quantity:data.weight};
        const row=el('div',null,'target-change');
        for(const [key,label] of [['kind','Load type'],['action','Add / Remove'],['weight','Total weight (lb)']]) {
            const wrap=el('label',label);const n=document.createElement(key==='weight'?'input':'select');n.dataset.change=key;
            if(key==='kind') ['personnel','cargo'].forEach(v=>{const o=el('option',v==='cargo'?'Cargo':'Personnel');o.value=v;n.append(o);});
            else if(key==='action') ['add','remove'].forEach(v=>{const o=el('option',v==='add'?'Add':'Remove');o.value=v;n.append(o);});
            else {n.type='number';n.min='0';n.step='any';n.placeholder='Enter total lb';}
            n.value=data[key]??'';wrap.append(n);row.append(wrap);
        }
        const remove=el('button','Remove row');remove.type='button';remove.onclick=()=>{row.remove();update();};row.append(remove);changes.append(row);
    }
    function inputPage() {
        root=el('details',null,'target-mission');root.id='target-planning';root.open=!!record.input.enabled;
        root.append(el('summary','Target Planning'));
        const body=el('div',null,'target-body');root.append(body);
        field(body,'enabled','Enable base / target comparison',record.input.enabled,'checkbox').parentElement.classList.add('target-jettison-option');
        const fields=el('fieldset');fields.id='target-fields';body.append(fields);
        const trip=el('section',null,'target-panel');trip.append(el('h3','Trip & target conditions'));fields.append(trip);
        const grid=el('div',null,'target-grid');trip.append(grid);
        for(const [k,label] of [['distance','One-way distance (NM)'],['speed','Speed (TAS, kt)'],['elevation','Target field elevation (ft)'],['qnh','Target QNH (hPa)'],['oat','Target OAT (°C)'],['onSite','Time on site (min)']]) field(grid,k,label,record.input[k]);
        controls.distance.min='0';controls.speed.min='1';controls.qnh.min='850';controls.qnh.max='1100';controls.onSite.min='0';
        const hp=el('p','Target pressure altitude: ', 'target-note');const output=el('strong');output.id='target-hp';hp.append(output);trip.append(hp);
        const route=el('details',null,'target-disclosure');route.append(el('summary','En-route conditions'));fields.append(route);
        field(route,'override','Override base pressure altitude / temperature',record.input.override,'checkbox');
        const rg=el('div',null,'target-grid');rg.id='target-route';route.append(rg);
        field(rg,'routeHp','En-route pressure altitude (ft)',record.input.routeHp);field(rg,'routeOat','En-route OAT (°C)',record.input.routeOat);
        const load=el('details',null,'target-disclosure');load.append(el('summary','Personnel / cargo changes at target'));fields.append(load);changes=el('div');load.append(changes);
        (record.input.changes||[]).forEach(addChange);
        const add=el('button','+ Add load change');add.type='button';add.onclick=()=>{addChange();update();};load.append(add);
        load.append(el('p','Enter total pounds of personnel or cargo added or removed. Changes apply after arrival, before time on site.','target-note'));
        const options=el('div',null,'target-options');fields.append(options);
        const fuelPanel=el('section',null,'target-panel');fuelPanel.append(el('h3','Refuelling at target'));options.append(fuelPanel);
        const refuel=el('div',null,'target-grid target-compact');fuelPanel.append(refuel);
        field(refuel,'refuel','Fuel added (lb)',record.input.refuel).placeholder='0 if none';controls.refuel.min='0';
        fuelPanel.append(el('p','Refuelling adds to aircraft weight and fuel after time on site, before departure.','target-note'));
        const jetPanel=el('section',null,'target-panel');options.append(jetPanel);
        field(jetPanel,'jettison','Compare after cabin tank jettison',record.input.jettison,'checkbox').parentElement.classList.add('target-jettison-option');
        const jettisonAmount=el('div',null,'target-grid');jettisonAmount.id='target-jettison-amount';jetPanel.append(jettisonAmount);
        jetPanel.append(el('p','Optional comparison using the cabin fuel amount you enter.','target-note'));
        field(jettisonAmount,'jettisonAmount','Cabin fuel to jettison (lb)',record.input.jettisonAmount===undefined?660:record.input.jettisonAmount);
        controls.jettisonAmount.min='660';controls.jettisonAmount.max='1723';controls.jettisonAmount.placeholder='660 to 1723 lb';
        status=el('p',null,'target-success');status.setAttribute('role','status');body.append(status);
        const summary=document.querySelector('.summary-panel');summary.before(root);summary.querySelector('.summary-title').textContent='Start / Base Summary';
        root.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(update,250);});root.addEventListener('change',update);
        document.addEventListener('input',event=>{if(!root.contains(event.target)){clearTimeout(timer);timer=setTimeout(update,350);}});
        document.addEventListener('change',event=>{if(!root.contains(event.target)){clearTimeout(timer);timer=setTimeout(update,350);}});
        document.getElementById('newCalculationBtn')?.addEventListener('click',()=>{reset=true;clearTimeout(timer);localStorage.removeItem(KEY);},true);
        window.addEventListener('pagehide',()=>{if(!reset)update();});
        window.addEventListener('pageshow',()=>setTimeout(update,0));
        update();
        if(location.hash==='#target-planning'){root.open=true;root.scrollIntoView({block:'start'});}
    }
    function metric(dl,label,value,negative=false) {const row=el('div');row.append(el('dt',label),el('dd',value,negative?'target-negative':''));dl.append(row);}
    function charts(card,s) {
        const details=el('details');details.append(el('summary','View hover charts'));card.append(details);
        details.addEventListener('toggle',()=>{
            if(!details.open||details.dataset.drawn)return;details.dataset.drawn='yes';
            for(const [key,label,limit] of [['hover10ft','10 ft IGE',s.ten],['ige5ftAgw','5 ft IGE · normal-weight cap',s.five]]) {
                details.append(el('p',label,'target-note'));
                if(limit==null){details.append(el('p','Unavailable for these conditions.','target-note'));continue;}
                const canvas=el('canvas');canvas.setAttribute('aria-label',label+' for '+s.name);details.append(canvas);
                CHARTS.draw(canvas,CHARTS.defs[key],(ctx,d)=>{
                    const x=d.x(limit),y=d.y(s.hp);
                    CHARTS.line(ctx,d.axisX,y,x,y,'#2563eb',2);
                    CHARTS.line(ctx,x,y,x,d.axisY,'#2563eb',2);
                    CHARTS.dot(ctx,x,y,'#2563eb');
                });
            }
        });
    }
    function resultsPage() {
        root=el('details',null,'target-mission');root.id='target-mission-results';
        root.append(el('summary',step==='2'?'Compare All Phases':'Target Mission Fuel'));
        const body=el('div',null,'target-body');root.append(body);
        document.getElementById(step==='2'?'card-chart':'card-chart-display').before(root);
        function render() {
            record=read()||{input:{enabled:false}};body.replaceChildren();
            const edit=el('a','Edit target plan in STEP 1','target-link');edit.href='STEP1.html#target-planning';body.append(edit);
            if(!record.input.enabled){if(step==='2')window.STEP2_PHASES?.setScenarios([],{enabled:false});body.append(el('p','Enable Target Planning in STEP 1 to compare scenarios.','target-note'));return;}
            const r=TARGET_MISSION.compute(record.base,record.input);
            if(step==='2')window.STEP2_PHASES?.setScenarios(r.scenarios,{enabled:true,jettison:record.input.jettison,error:r.error||r.jettisonError});
            if(r.error)body.append(el('p',r.error,'target-error'));
            if(r.jettisonError)body.append(el('p',r.jettisonError,'target-error'));
            if(step==='2') {
                const cards=el('div',null,'target-cards');body.append(cards);
                if(r.scenarios.length===4)cards.classList.add('target-cards-four');
                const results=window.STEP2_PHASES.comparisonResults();
                const metrics=[['#heightloose','Height loss (ft)'],['#Wheight_index_6','Weight index'],['#ceilinghp_3','Service ceiling (ft)'],['#ceilingweight_3','Service ceiling (lb)'],['#rc','OEI V/S (ft/min)'],['#enginhoge','Twin OGE (ft)'],['#enginhoge_weight','Twin OGE (lb)'],['#enginIGE','Twin IGE 10ft (ft)'],['#enginIGE_weight','Twin IGE 10ft (lb)'],['#enginIGE5ft','Twin IGE 5ft (ft)'],['#enginIGE5ft_weight','Twin IGE 5ft (lb)']];
                r.scenarios.forEach((s,i)=>{
                    const card=el('article',null,'target-scenario');card.append(el('h3',s.name));const dl=el('dl');card.append(dl);cards.append(card);
                    metric(dl,'Aircraft weight',fmt(s.weight,' lb'));metric(dl,'Fuel remaining',fmt(s.fuel,' lb'));
                    metric(dl,'Pressure altitude / OAT',fmt(s.hp,' ft')+' / '+fmt(s.oat,' °C'));
                    for(const [id,label] of metrics) metric(dl,label,results[i]?.[id] || '--',Number(results[i]?.[id])<0);
                });
            } else {
                const table=el('table'),scroll=el('div',null,'target-scroll');scroll.append(table);body.append(scroll);
                const row=(a,b)=>{const tr=el('tr');tr.append(el('th',a),el('td',b));table.append(tr);};
                row('Outbound travel time',fmt(r.travelMinutes,' min'));row('Startup / taxi',fmt(r.startupFuel,' lb'));
                row('Average outbound consumption',fmt(r.outbound?.rate,' lb/h'));row('Outbound fuel burned',fmt(r.outbound?.burn,' lb'));
                row('Personnel / cargo weight change',fmt(r.loadDelta,' lb'));
                row('Target arrival fuel',fmt(r.scenarios[1]?.fuel,' lb'));row('On-site fuel estimate',fmt(r.onSite?.burn,' lb'));row('Fuel added before departure',fmt(r.refuel,' lb'));row('Target departure fuel',fmt(r.scenarios[2]?.fuel,' lb'));
                if(r.jettisonWeight){row('Assumed jettison removal',fmt(r.jettisonWeight,' lb'));row('Fuel after assumed jettison',fmt(r.scenarios[3]?.fuel,' lb'));}
                for(const [phase,data] of [['Outbound',r.outbound],['On-site',r.onSite]]) if(data?.chart) {
                    const a=el('button',phase+' source chart','target-link');a.type='button';
                    a.onclick=()=>window.showTargetFuelChart({phase,key:data.chart.key,speed:record.input.speed,
                        rate:data.rate,burn:data.burn,weight:phase==='Outbound'?record.base.weight-r.startupFuel:r.scenarios[1].weight+r.loadDelta});
                    body.append(a);
                }
            }
        }
        render();window.addEventListener('pageshow',render);window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)render();});
    }
    async function init() {
        const dependencies=['datafolder/heightloosemap.js','datafolder/weightindex.js','datafolder/newIGE.js','datafolder/ige5ft_agw.js','datafolder/newhoge.js','datafolder/serviceCeiling.js','datafolder/serviceclimbing.js','datafolder/levelflightData.js','perf/atmosphere.js','perf/hover5ft.js','perf/hover10ft.js','perf/weightindex.js','perf/levelflight.js','perf/charts.js','perf/target-mission.js'];
        for(const src of dependencies) {
            if([...document.scripts].some(s=>s.src&&new URL(s.src).pathname.endsWith('/'+src)))continue;
            await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Cannot load '+src));document.body.append(s);});
        }
        record=read()||record;
        if(step==='1')inputPage();else resultsPage();
    }
    document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>init().catch(e=>{const p=el('p','Target planning unavailable: '+e.message,'target-error');document.querySelector('.main-content')?.append(p);}),0));
})();
