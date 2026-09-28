// Shared target scenario engine. No DOM or storage; all weights lb, arms inches.
var TARGET_MISSION = (() => {
    'use strict';
    const STARTUP = 150;
    const DEFAULT_JETTISON = 660; // Default cabin fuel removal; no hardware allowance.
    const passengerArms = [96.69,113.71,131.59,149.72,166.27,185.18,201.73,220.64,237.19,257.28,273.83,293.53];
    const positions = Object.fromEntries(passengerArms.map((arm,i) => ['passenger'+String.fromCharCode(65+i), {label:'Passenger '+String.fromCharCode(65+i), arm, kind:'personnel'}]));
    [120,140,180,220,260].forEach((arm,i) => positions['section'+String.fromCharCode(65+i)] = {label:'Cargo section '+String.fromCharCode(65+i), arm, kind:'cargo'});
    function finite(n) { return typeof n === 'number' && Number.isFinite(n); }
    function fail(message) { throw new Error(message); }
    function conditions(hp,oat) { return finite(hp) && finite(oat) && hp >= -2000 && hp <= 25000 && oat >= -45 && oat <= 50; }
    function bracket(values, value) {
        for(let i=0;i<values.length-1;i++) if(value<=values[i] && value>=values[i+1]) return i;
        return -1;
    }
    function mix(a,b,t) { return a == null || b == null ? null : a+(b-a)*t; }
    // Existing STEP2 nomogram transformations, with explicit bounds/endpoints.
    function otherPerformance(weight,hp,oat) {
        const r={oge:null,ceiling:null,climb:null,index:null};
        if(hp<0 || hp>25000 || oat < -45 || oat > 50) return r;
        const i=bracket([50,40,30,20,10,0,-10,-20,-30,-40,-45],oat);
        const temps=[50,40,30,20,10,0,-10,-20,-30,-40,-45];
        const f=(temps[i]-oat)/(temps[i]-temps[i+1]);
        if(hp<=20000 && weight>=13200 && weight<=21500) {
            const y=37+(679-37)*(20000-hp)/20000;
            const x=mix(getXForY(y,Qat_4[i]),getXForY(y,Qat_4[i+1]),f);
            if(x!=null) r.oge=13200+(x-52)/(568-52)*(21500-13200);
            const wx=477-(21500-weight)/(21500-13200)*(477-35);
            const cy=mix(getYForXanother(wx,Qat_3[i]),getYForXanother(wx,Qat_3[i+1]),f);
            if(cy!=null) r.ceiling=20000-(cy-6)/(683-6)*20000;
        }
        r.index=WEIGHTINDEX.compute(oat,hp,weight);
        const wi=r.index;
        if(wi==null || wi<7 || wi>13) return r;
        const hi=bracket(hpftindex_7,hp);
        if(hi<0) return r;
        const tx=64+(416-64)*(oat+45)/95;
        const y=mix(getYForXanother(tx,hpft_7[hi]),getYForXanother(tx,hpft_7[hi+1]),(hpftindex_7[hi]-hp)/(hpftindex_7[hi]-hpftindex_7[hi+1]));
        if(y==null) return r;
        const j=Math.min(weightindexcomple_7.length-2,Math.floor((13-wi)/0.5));
        const x=mix(getXForYanother(y,weightindexcomple_7[j]),getXForYanother(y,weightindexcomple_7[j+1]),(13-0.5*j-wi)/0.5);
        if(x!=null) r.climb=1500-(868.5-x)/(868.5-612.5)*1500;
        return r;
    }
    function performance(weight,hp,oat) {
        const valid=conditions(hp,oat);
        const five=valid && oat<ATM.isaTemperature(hp)+40 ? HOVER5FT.maxWeight(hp,oat,21495) : {weight:null};
        const ten=valid && hp>=0 && hp<=20000 ? HOVER10FT.maxWeight(oat,hp) : null;
        const other=valid ? otherPerformance(weight,hp,oat) : {oge:null,ceiling:null,climb:null,index:null};
        return {...other, five:five.weight,ten, fiveMargin:five.weight==null?null:five.weight-weight,tenMargin:ten==null?null:ten-weight,ogeMargin:other.oge==null?null:other.oge-weight};
    }
    function chart(hp,oat) {
        // Match STEP3 chart selection. Non-matching conditions remain explicitly
        // labelled nearest-chart estimates; fuel flow does not require best-range TAS.
        const key=LEVELFLIGHT.selectKey(hp,oat), c=LEVELFLIGHT.CHARTS[key];
        if(!c) fail('Fuel estimate unavailable: en-route/target pressure altitude is outside the supported chart-selection range (-2,000 to 10,500 ft).');
        return {key,hp:c.hp,oat:c.oat,src:c.def.src,approximate:hp!==c.hp || oat!==c.oat};
    }
    function burn(weight,fuel,minutes,speed,hp,oat) {
        if(minutes===0) return {burn:0,rate:null,chart:null};
        const chosen=chart(hp,oat), curves=LEVELFLIGHT.CHARTS[chosen.key].data();
        const min=Math.min(...curves.map(c=>c.index)), max=Math.max(...curves.map(c=>c.index));
        let used=0;
        for(let t=0;t<minutes;t+=1) {
            const w=weight-used;
            if(w<min || w>max) fail('Fuel estimate unavailable: aircraft weight is outside the selected chart curves.');
            const flow=LEVELFLIGHT.fuelFlow(chosen.key,w,speed);
            if(!finite(flow.lbPerHour) || flow.lbPerHour<=0 || flow.speedLimited || flow.weightClamped) fail('Fuel estimate unavailable: speed/weight is outside the selected chart curves.');
            used+=flow.lbPerHour/60*Math.min(1,minutes-t);
            if(used>fuel+1e-7) fail('Not enough fuel for the planned outbound/on-site duration.');
        }
        if(weight-used<min) fail('End-of-phase weight falls below the selected fuel chart range.');
        return {burn:used,rate:used/minutes*60,chart:chosen};
    }
    function compute(base, input) {
        const r={enabled:!!input.enabled,scenarios:[],error:null,notes:[]};
        if(!r.enabled) return r;
        try {
            if(!base || !finite(base.weight) || !finite(base.fuel) || base.weight<=base.fuel || base.fuel<STARTUP || !conditions(base.hp,base.oat)) fail('Complete valid base weight, fuel, pressure altitude and temperature in STEP 1. At least 150 lb fuel is needed for startup/taxi.');
            const scenario=(name,weight,fuel,hp,oat,cg=null)=>({name,weight,fuel,hp,oat,cg,...performance(weight,hp,oat)});
            r.scenarios.push(scenario('Start / Base',base.weight,base.fuel,base.hp,base.oat,base.cg));
            if(!finite(input.distance) || input.distance<0 || !finite(input.speed) || input.speed<=0 || input.speed>200 || !finite(input.onSite) || input.onSite<0 || input.onSite>1440) fail('Enter a non-negative distance, speed above 0 and at most 200 kt, and on-site minutes from 0 to 1440.');
            if(input.distance/input.speed*60>1440) fail('Outbound duration must not exceed 24 hours.');
            if(!finite(input.elevation) || !finite(input.qnh) || input.qnh<850 || input.qnh>1100 || !finite(input.oat)) fail('Enter target elevation, temperature and QNH between 850 and 1100 hPa.');
            const hp=ATM.pressureAltitude(input.elevation,input.qnh);
            if(!conditions(hp,input.oat)) fail('Target conditions are outside the supported performance range.');
            const ehp=input.override?input.routeHp:base.hp, eoat=input.override?input.routeOat:base.oat;
            if(!conditions(ehp,eoat)) fail('Enter valid en-route pressure altitude and temperature.');
            let delta=0,deltaMoment=0;
            const removed={};
            for(const change of input.changes||[]) {
                if(change.kind) {
                    if(!['personnel','cargo'].includes(change.kind) || !['add','remove'].includes(change.action) || !finite(change.weight) || change.weight<=0) fail('Enter a positive total weight in lb for each personnel or cargo change.');
                    delta+=(change.action==='add'?1:-1)*change.weight;
                    continue;
                }
                const pos=positions[change.position];
                if(!pos || !['add','remove'].includes(change.action) || !finite(change.weight) || change.weight<=0 || !Number.isInteger(change.quantity) || change.quantity<1 || change.quantity>1000) fail('Each target load change needs a position, positive unit weight and whole quantity.');
                const amount=change.weight*change.quantity;
                if(change.action==='remove') {
                    removed[change.position]=(removed[change.position]||0)+amount;
                    if(removed[change.position]>(base.loads?.[change.position]||0)+0.01) fail('Cannot remove more weight than loaded at '+pos.label+'.');
                }
                const sign=change.action==='add'?1:-1;
                delta+=sign*amount;deltaMoment+=sign*amount*pos.arm;
            }
            if(!finite(delta) || !finite(deltaMoment) || base.weight+delta<=base.fuel) fail('Target load changes produce an invalid aircraft weight or moment.');
            const refuel=input.refuel==null?0:input.refuel;
            if(!finite(refuel) || refuel<0) fail('Enter a non-negative refuelling amount in lb.');
            if(finite(base.emptyWeight) && base.weight-base.fuel+delta<base.emptyWeight) fail('Load removal would reduce non-fuel weight below aircraft empty weight.');
            r.refuel=refuel;
            r.travelMinutes=input.distance/input.speed*60;
            const out=burn(base.weight-STARTUP,base.fuel-STARTUP,r.travelMinutes,input.speed,ehp,eoat);
            r.startupFuel=STARTUP;r.outbound=out;r.loadDelta=delta;r.loadMomentDelta=deltaMoment;
            const aw=base.weight-STARTUP-out.burn, af=base.fuel-STARTUP-out.burn;
            r.scenarios.push(scenario('Target Arrival',aw,af,hp,input.oat));
            // On-site is a clearly labelled cruise-equivalent estimate, not a hover-flow chart.
            const site=burn(aw+delta,af,input.onSite,input.speed,hp,input.oat);
            r.onSite=site;
            if(af-site.burn+refuel>6738.5) fail('Fuel after refuelling exceeds the 6,738.5 lb full-system capacity. Check installed tanks and available capacity.');
            for(const [phase,data] of [['Outbound',out],['On-site',site]]) {
                if(data.chart?.approximate) r.notes.push(phase+' fuel uses the nearest chart: '+data.chart.hp+' ft / '+data.chart.oat+' C. This is an estimate, not a chart at the exact entered conditions.');
            }
            r.scenarios.push(scenario('Target Departure',aw+delta+refuel-site.burn,af+refuel-site.burn,hp,input.oat));
            r.notes.push('Fuel burn is a level-flight estimate using one-minute weight updates; no separate climb/descent burn or wind correction. Target load changes are applied on arrival. Refuelling is added after on-site fuel burn, before target departure. Refuelling must fit the installed tank configuration; only the full-system total capacity is checked.');
            if(input.onSite>0) r.notes.push('On-site fuel is a cruise-equivalent estimate at the entered speed and target conditions; it is not a hover/ground-idle fuel model.');
            r.notes.push('Weight-based performance only; target balance not assessed.');
            if(input.jettison) {
                const departure=r.scenarios[2];
                const amount=input.jettisonAmount===undefined?DEFAULT_JETTISON:input.jettisonAmount;
                r.notes.push('Jettison comparison is after target departure load changes and on-site burn. Assumes the entered cabin fuel amount is available and removed, with no additional hardware weight credited. Tank allocation and jettison operating conditions are not verified.');
                if(!finite(amount) || amount<660 || amount>1723) {
                    r.jettisonError='Enter cabin fuel to jettison from 660 to 1,723 lb.';
                } else if(departure.fuel<amount) {
                    r.jettisonError='Jettison estimate unavailable: target departure fuel is below the entered '+amount+' lb removal.';
                } else {
                    r.jettisonWeight=amount;
                    r.scenarios.push({...scenario('Target After Jettison (Estimate)',departure.weight-amount,departure.fuel-amount,hp,input.oat),jettison:true});
                }
            }
        } catch(e) {r.error=e.message;}
        return r;
    }
    return {compute,performance,positions,STARTUP};
})();
