// Phase selection is a view: base input values and storage stay unchanged.
window.STEP2_PHASES = (() => {
    let phases=[], selected=0, busy=false, bar, tabs, context, notice;
    const ids=['#acweight','#hp','#qat','#wind'];
    const get=id=>document.getElementById(id);
    function withInputs(fn) {
        if(busy)return fn();
        const saved=ids.map(id=>get(id).value), s=phases[selected];
        busy=true;
        try {
            if(selected && s) {
                get('#acweight').value=s.weight;get('#hp').value=s.hp;get('#qat').value=s.oat;
                // No target wind input exists. Disclose a zero-wind target assumption.
                get('#wind').value=0;
            }
            return fn();
        } finally {ids.forEach((id,i)=>get(id).value=saved[i]);busy=false;}
    }
    function calculateResults() {
            document.querySelectorAll('#card-results input').forEach(n=>n.value='');
            for(const fn of [window.count_6,()=>window.count(1),window.count_3,window.count_4,window.count_5,window.calculate5ftIGE,window.count_7]) {
                try {if(fn)fn();} catch(e) {console.warn('Phase chart unavailable:',e.message);}
            }
    }
    function comparisonResults() {
        const previous=selected;
        try {
            return phases.map((s,i)=>{
                selected=i;
                return withInputs(()=>{
                    calculateResults();
                    return Object.fromEntries(Array.from(document.querySelectorAll('#card-results input'), n=>[n.id,n.value || '--']));
                });
            });
        } finally {selected=previous;refresh();}
    }
    function refresh() {
        withInputs(()=>{
            calculateResults();
            window.hideChartError?.();
            window.updateDecisionProcess?.();
            const active=document.querySelector('.calc-btn.active');
            if(active)window.runCalc(active.id.replace('btn-',''));
            else window.showchart?.(0);
        });
        describe();
    }
    function describe() {
        if(!context)return;
        const s=phases[selected];
        const name=selected?s.name:'Start / Base';
        const weight=selected?s.weight:Number(get('#acweight').value);
        const hp=selected?s.hp:Number(get('#hp').value);
        const oat=selected?s.oat:Number(get('#qat').value);
        const fmt=n=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:1}):'--';
        context.textContent=name+' | Weight '+fmt(weight)+' lb | Pressure altitude '+fmt(hp)+' ft | OAT '+fmt(oat)+' °C'+(selected?' | Wind: 0 kt assumed | Target balance not assessed':'');
        const title=get('decision-panel').querySelector('.decision-panel-header');
        for(const node of title.childNodes)if(node.nodeType===3 && node.textContent.trim())node.textContent=' '+name.toUpperCase()+' - COUGAR DECISION MATRIX ';
        tabs.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===selected));b.tabIndex=i===selected?0:-1;});
    }
    function setScenarios(scenarios, options={}) {
        phases=scenarios;
        if(selected>=Math.max(1,phases.length))selected=0;
        if(!bar) {
            bar=document.createElement('section');bar.className='phase-selector';bar.setAttribute('aria-label','Performance phase');
            tabs=document.createElement('div');tabs.className='phase-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Performance phase');
            context=document.createElement('p');context.className='phase-context';context.setAttribute('aria-live','polite');
            notice=document.createElement('p');notice.className='phase-notice';notice.setAttribute('role','status');
            bar.append(tabs,context,notice);document.querySelector('.performance-top-row').before(bar);
        }
        tabs.replaceChildren();
        const labels=['Base','Target Arrival','Target Departure','After Jettison'];
        const count=options.enabled?(options.jettison?4:3):Math.max(1,phases.length);
        for(let i=0;i<count;i++) {
            const b=document.createElement('button');b.type='button';b.textContent=labels[i];b.setAttribute('role','tab');
            b.setAttribute('aria-controls','phase-performance-content');
            b.disabled=i>0&&!phases[i];
            if(b.disabled)b.title=options.error||'Complete the target plan in STEP 1.';
            b.onclick=()=>{if(b.disabled)return;selected=i;refresh();};
            b.onkeydown=e=>{let next=i;if(e.key==='ArrowRight')next=(i+1)%tabs.children.length;else if(e.key==='ArrowLeft')next=(i+tabs.children.length-1)%tabs.children.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.children.length-1;else return;e.preventDefault();const direction=e.key==='ArrowLeft'||e.key==='End'?-1:1;while(tabs.children[next].disabled)next=(next+direction+tabs.children.length)%tabs.children.length;tabs.children[next].click();tabs.children[next].focus();};
            tabs.append(b);
        }
        notice.replaceChildren();
        if(options.error || options.enabled===false) {
            notice.append(options.error||'Target planning is off.');
            const edit=document.createElement('a');edit.href='STEP1.html#target-planning';edit.textContent=' Edit target plan in STEP 1';notice.append(edit);notice.hidden=false;
        } else notice.hidden=true;
        document.querySelector('.performance-top-row').id='phase-performance-content';
        refresh();
    }
    return {get active(){return selected>0;},get busy(){return busy;},withInputs,refresh,setScenarios,comparisonResults};
})();
