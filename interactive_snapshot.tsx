import { useState, useEffect, useMemo } from "react";

const DOMAINS = [
  {id:"hydration",label:"Water intake this week",name:"Hydration"},
  {id:"energy",label:"Energy through your shifts",name:"Energy"},
  {id:"sleep",label:"Sleep quality lately",name:"Sleep"},
  {id:"recovery",label:"Recovery between shifts",name:"Recovery"},
  {id:"stress",label:"Stress level this week",name:"Stress"},
  {id:"routine",label:"Daily routines holding",name:"Routines"},
  {id:"focus",label:"Focus and mental clarity",name:"Focus"},
  {id:"physical",label:"Physical comfort",name:"Physical"},
  {id:"confidence",label:"Confidence in your readiness",name:"Confidence"},
  {id:"margin",label:"Your overall margin right now",name:"Overall margin"},
];

const OPTS = [
  {l:"Strong",v:3,c:"#3a9d78",bg:"#eef8f1",border:"#d6ecdd"},
  {l:"Steady",v:2,c:"#caa23a",bg:"#fffbe9",border:"#f0ead0"},
  {l:"Slipping",v:1,c:"#e08a2b",bg:"#fef3e8",border:"#f5dfc0"},
  {l:"Low",v:0,c:"#c0492f",bg:"#fbeeec",border:"#f0d6d0"},
];

const STORE_KEY = "haulwell-snapshot-history";

const band = s => s>=24?"#3a9d78":s>=15?"#caa23a":"#e08a2b";
const zoneLabel = s => s>=24?"Steady":s>=15?"Watch":"Closer Look";
const zoneEmoji = s => s>=24?"🟢":s>=15?"🟡":"🟠";
const zoneBg = s => s>=24?"#eef8f1":s>=15?"#fffbe9":"#fef3e8";
const zoneBorder = s => s>=24?"#d6ecdd":s>=15?"#f0ead0":"#f5dfc0";
const zoneLabelC = s => s>=24?"#2f7a57":s>=15?"#8a7a3a":"#a0591a";

const marginBand = s => {
  if(s>=27) return "Strong Green";
  if(s>=24) return "Green";
  if(s>=21) return "Strong Yellow";
  if(s>=18) return "Yellow";
  if(s>=15) return "Low Yellow";
  if(s>=12) return "Amber";
  if(s>=9) return "Low Amber";
  if(s>=6) return "Orange";
  return "Red";
};

const movementArrow = diff => {
  if(diff>=5) return {arrow:"↗↗",label:"Strong improvement",c:"#3a9d78"};
  if(diff>=2) return {arrow:"↗",label:"Improving",c:"#3a9d78"};
  if(diff>=-1) return {arrow:"→",label:"Holding",c:"#caa23a"};
  if(diff>=-4) return {arrow:"↘",label:"Declining",c:"#e08a2b"};
  return {arrow:"↘↘",label:"Significant decline",c:"#c0492f"};
};

export default function App(){
  const [screen,setScreen] = useState("pulse");
  const [answers,setAnswers] = useState({});
  const [history,setHistory] = useState([]);
  const [copied,setCopied] = useState(false);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    async function load(){
      try {
        const r = await window.storage.get(STORE_KEY);
        if(r?.value) setHistory(JSON.parse(r.value));
      } catch(e){}
      setLoading(false);
    }
    load();
  },[]);

  const allAnswered = Object.keys(answers).length === 10;
  const total = useMemo(()=> allAnswered ? DOMAINS.reduce((a,d)=>a+(answers[d.id]??0),0) : null, [answers,allAnswered]);

  const prev = history.length > 0 ? history[history.length-1] : null;
  const diff = total !== null && prev ? total - prev.total : null;
  const movement = diff !== null ? movementArrow(diff) : null;

  const domainBand = v => v===3?"#3a9d78":v===2?"#caa23a":v===1?"#e08a2b":"#c0492f";

  const strengths = allAnswered ? DOMAINS.filter(d=>(answers[d.id]??0)>=2).map(d=>d.name) : [];
  const watchAreas = allAnswered ? DOMAINS.filter(d=>(answers[d.id]??0)<=1).map(d=>d.name) : [];

  const saveAndView = async ()=>{
    const entry = {
      date: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),
      total,
      domains: {...answers},
      ts: Date.now(),
    };
    const newHist = [...history, entry].slice(-12);
    setHistory(newHist);
    try { await window.storage.set(STORE_KEY, JSON.stringify(newHist)); } catch(e){}
    setScreen("results");
  };

  const reset = ()=>{setScreen("pulse");setAnswers({});};

  const clearHistory = async ()=>{
    setHistory([]);
    try { await window.storage.delete(STORE_KEY); } catch(e){}
  };

  const copyResults = ()=>{
    if(total===null) return;
    let txt = `DRIVER READINESS SNAPSHOT™\n${zoneEmoji(total)} ${zoneLabel(total)} — Score: ${total}/30\n`;
    if(prev) txt += `Previous: ${prev.total}/30 · Change: ${diff>=0?"+":""}${diff}\n`;
    txt += `Margin Band: ${marginBand(total)}\n\nDOMAIN SCORES:\n`;
    DOMAINS.forEach(d=>{txt+=`${d.name}: ${OPTS.find(o=>o.v===answers[d.id])?.l||"—"}\n`;});
    if(strengths.length) txt+=`\nSTRONG: ${strengths.join(", ")}`;
    if(watchAreas.length) txt+=`\nWATCH: ${watchAreas.join(", ")}`;
    txt+=`\n\nDriver Readiness is built daily — not just tested.\npowered by HaulWell™`;
    navigator.clipboard.writeText(txt).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  };

  const S = {
    wrap:{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",maxWidth:560,margin:"0 auto",color:"#1f2933",lineHeight:1.5},
    hdr:{background:"#15324f",padding:"20px 26px",color:"#fff"},
    label:{fontSize:12,letterSpacing:1,textTransform:"uppercase",color:"#6b7280",marginBottom:8},
    btn:{background:"#15324f",color:"#fff",border:"none",borderRadius:10,padding:"16px 0",width:"100%",fontSize:16,fontWeight:700,cursor:"pointer"},
    btnGhost:{background:"transparent",color:"#15324f",border:"2px solid #15324f",borderRadius:10,padding:"14px 0",width:"100%",fontSize:15,fontWeight:600,cursor:"pointer",marginTop:10},
  };

  if(loading) return <div style={{...S.wrap,textAlign:"center",padding:40,color:"#6b7280"}}>Loading...</div>;

  // PULSE SCREEN
  if(screen==="pulse") return(
    <div style={S.wrap}>
      <div style={{...S.hdr,borderRadius:"14px 14px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:12,letterSpacing:1.5,textTransform:"uppercase",opacity:.7}}>HaulWell™</div>
          <div style={{fontSize:20,fontWeight:700,marginTop:2}}>Readiness Snapshot™</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:12,opacity:.6}}>Weekly pulse</div>
          <div style={{fontSize:12,opacity:.6}}>~2 minutes</div>
        </div>
      </div>
      <div style={{background:"#fff",border:"1px solid #e4e7eb",borderTop:"none",padding:"6px 0"}}>
        <div style={{padding:"14px 26px 8px",fontSize:14,color:"#6b7280"}}>Tap how each area has felt this week:</div>

        {DOMAINS.map((d,i)=>{
          const sel = answers[d.id];
          return(
            <div key={d.id} style={{padding:"12px 26px",borderBottom:i<9?"1px solid #f3f4f6":"none"}}>
              <div style={{fontSize:14,fontWeight:600,color:"#15324f",marginBottom:8}}>{d.label}</div>
              <div style={{display:"flex",gap:6}}>
                {OPTS.map(o=>{
                  const active = sel===o.v;
                  return(
                    <button key={o.v} onClick={()=>setAnswers({...answers,[d.id]:o.v})} style={{
                      flex:1,padding:"9px 4px",fontSize:13,fontWeight:active?700:500,
                      border:active?`2px solid ${o.c}`:`1px solid #e4e7eb`,
                      borderRadius:8,cursor:"pointer",transition:"all 0.15s",
                      background:active?o.bg:"#fff",color:active?o.c:"#6b7280",
                    }}>{o.l}</button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={{padding:"16px 26px"}}>
          <button style={{...S.btn,opacity:allAnswered?1:.4,pointerEvents:allAnswered?"auto":"none"}} onClick={saveAndView}>
            VIEW MY SNAPSHOT →
          </button>
        </div>
      </div>
      <div style={{background:"#15324f",borderRadius:"0 0 14px 14px",padding:"14px 26px",textAlign:"center"}}>
        <span style={{fontSize:13,color:"#cdb86a",fontStyle:"italic"}}>Driver Readiness is built daily — not just tested.</span>
      </div>
    </div>
  );

  // RESULTS SCREEN
  if(screen==="results" && total!==null){
    const meterPos = Math.max(3,Math.min(97,(total/30)*100));
    const allHist = history;

    return(
    <div style={S.wrap}>
      <div style={{...S.hdr,borderRadius:"14px 14px 0 0"}}>
        <div style={{fontSize:12,letterSpacing:1.5,textTransform:"uppercase",opacity:.7}}>HaulWell™</div>
        <div style={{fontSize:20,fontWeight:700,marginTop:2}}>Your Readiness Snapshot™</div>
      </div>
      <div style={{background:"#fff",border:"1px solid #e4e7eb",borderTop:"none"}}>

        {/* Score Banner */}
        <div style={{display:"flex",alignItems:"center",gap:18,padding:"22px 26px",background:zoneBg(total),borderBottom:`1px solid ${zoneBorder(total)}`}}>
          <div style={{fontSize:42,lineHeight:1}}>{zoneEmoji(total)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,letterSpacing:1,textTransform:"uppercase",color:zoneLabelC(total)}}>This Week</div>
            <div style={{fontSize:28,fontWeight:800,color:band(total)}}>{total}<span style={{fontSize:16,fontWeight:400,color:"#6b7280"}}> / 30</span></div>
            <div style={{fontSize:15,fontWeight:600,color:"#15324f"}}>{zoneLabel(total)}</div>
          </div>
          {prev && (
            <div style={{textAlign:"center",background:"#fff",border:`1px solid ${zoneBorder(total)}`,borderRadius:10,padding:"10px 16px"}}>
              <div style={{fontSize:11,letterSpacing:.5,textTransform:"uppercase",color:"#6b7280"}}>Change</div>
              <div style={{fontSize:22,fontWeight:800,color:movement.c}}>{diff>=0?"+":""}{diff}</div>
              <div style={{fontSize:13,fontWeight:600,color:movement.c}}>{movement.arrow} {movement.label}</div>
            </div>
          )}
        </div>

        {/* Margin Movement */}
        {prev && (
          <div style={{padding:"16px 26px",background:"#f7f9fb",borderBottom:"1px solid #e4e7eb"}}>
            <div style={{fontSize:13,color:"#374151"}}>
              Margin Movement: <strong style={{color:band(prev.total)}}>{marginBand(prev.total)}</strong>
              <span style={{margin:"0 8px",color:"#9aa5b1"}}>→</span>
              <strong style={{color:band(total)}}>{marginBand(total)}</strong>
            </div>
          </div>
        )}

        {/* Margin Meter */}
        <div style={{padding:"20px 26px",borderBottom:"1px solid #e4e7eb"}}>
          <div style={S.label}>Margin Meter™</div>
          <div style={{position:"relative",height:18,borderRadius:9,background:"linear-gradient(to right, #c0492f 0%, #e08a2b 33%, #caa23a 50%, #3a9d78 80%, #3a9d78 100%)",marginTop:4}}>
            <div style={{position:"absolute",left:`${meterPos}%`,top:-3,width:24,height:24,borderRadius:"50%",background:"#15324f",border:"3px solid #fff",boxShadow:"0 1px 4px rgba(0,0,0,.3)",transform:"translateX(-50%)",transition:"left 0.5s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7280",marginTop:6}}>
            <span>Low</span><span>Watch</span><span>Steady</span><span>Strong</span>
          </div>
        </div>

        {/* Domain Breakdown */}
        <div style={{padding:"22px 26px",borderBottom:"1px solid #e4e7eb"}}>
          <div style={S.label}>Domain Breakdown</div>
          {DOMAINS.map(d=>{
            const v = answers[d.id];
            const pv = prev?.domains?.[d.id];
            const c = domainBand(v);
            const domDiff = pv!==undefined ? v-pv : null;
            return(
              <div key={d.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:110,fontSize:13,color:"#374151",flexShrink:0}}>{d.name}</div>
                <div style={{flex:1,background:"#edf0f3",borderRadius:6,height:14,overflow:"hidden"}}>
                  <div style={{width:`${(v/3)*100}%`,background:c,height:"100%",borderRadius:6,transition:"width 0.4s ease"}}/>
                </div>
                <div style={{width:55,fontSize:12,fontWeight:600,color:c,textAlign:"right"}}>{OPTS.find(o=>o.v===v)?.l}</div>
                {domDiff!==null && domDiff!==0 && (
                  <div style={{width:24,fontSize:12,fontWeight:700,color:domDiff>0?"#3a9d78":"#c0492f",textAlign:"center"}}>{domDiff>0?"↗":"↘"}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Strengths / Watch */}
        <div style={{display:"flex",borderBottom:"1px solid #e4e7eb"}}>
          <div style={{flex:1,padding:"16px 26px",borderRight:"1px solid #e4e7eb"}}>
            <div style={{fontSize:12,letterSpacing:.5,textTransform:"uppercase",color:"#2f8a6f",marginBottom:8}}>✅ Strong</div>
            {strengths.length?strengths.map(s=><div key={s} style={{fontSize:14,color:"#374151",marginBottom:4}}>{s}</div>)
            :<div style={{fontSize:13,color:"#9aa5b1",fontStyle:"italic"}}>None this week</div>}
          </div>
          <div style={{flex:1,padding:"16px 26px"}}>
            <div style={{fontSize:12,letterSpacing:.5,textTransform:"uppercase",color:"#a0591a",marginBottom:8}}>⚠️ Watch</div>
            {watchAreas.length?watchAreas.map(s=><div key={s} style={{fontSize:14,color:"#374151",marginBottom:4}}>{s}</div>)
            :<div style={{fontSize:13,color:"#9aa5b1",fontStyle:"italic"}}>Nothing flagged</div>}
          </div>
        </div>

        {/* History Chart */}
        {allHist.length>1 && (
          <div style={{padding:"20px 26px",borderBottom:"1px solid #e4e7eb"}}>
            <div style={S.label}>Snapshot™ History</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80,marginTop:8}}>
              {allHist.map((h,i)=>{
                const pct = (h.total/30)*100;
                const c = band(h.total);
                const isLast = i===allHist.length-1;
                return(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{fontSize:11,fontWeight:isLast?700:400,color:isLast?"#15324f":"#9aa5b1"}}>{h.total}</div>
                    <div style={{width:"100%",background:isLast?c:"#dde1e6",borderRadius:4,height:`${Math.max(8,pct*0.7)}%`,transition:"height 0.3s"}}/>
                    <div style={{fontSize:9,color:"#9aa5b1",whiteSpace:"nowrap"}}>{h.date.replace(/,\s*\d{4}/,"")}</div>
                  </div>
                );
              })}
            </div>
            {allHist.length>=3 && (()=>{
              const first = allHist[0].total, last = allHist[allHist.length-1].total;
              const totalChange = last-first;
              return(
                <div style={{marginTop:12,padding:"10px 14px",background:"#f7f9fb",borderRadius:8,fontSize:13,color:"#374151"}}>
                  📈 Since your first Snapshot™: <strong style={{color:totalChange>=0?"#3a9d78":"#c0492f"}}>{totalChange>=0?"+":""}{totalChange} points</strong> over {allHist.length} check-ins.
                </div>
              );
            })()}
          </div>
        )}

        {/* Next Step */}
        <div style={{padding:"20px 26px",borderBottom:"1px solid #e4e7eb"}}>
          <div style={S.label}>Recommended Next Step</div>
          <div style={{fontSize:14,color:"#374151",lineHeight:1.6}}>
            {total>=24 && "Readiness looks steady. Keep protecting what's working and take your next Snapshot™ in 1–2 weeks."}
            {total>=15 && total<24 && "Some patterns are building. A full Driver Readiness Profile™ will show you exactly which signals are shifting and what a practical response looks like."}
            {total<15 && "Several areas are running thin right now. A full Driver Readiness Profile™ is strongly recommended — it will give you and your Coach a much clearer picture."}
          </div>
        </div>

        {/* Buttons */}
        <div style={{padding:"20px 26px"}}>
          {total<24 && (
            <button style={{...S.btn,marginBottom:10}} onClick={()=>{}}>
              Take the Driver Readiness Profile™ →
            </button>
          )}
          <button style={{...S.btnGhost,marginTop:0}} onClick={copyResults}>
            {copied?"✓ Copied":"Copy My Results"}
          </button>
          <button style={{...S.btnGhost,color:"#6b7280",borderColor:"#e4e7eb"}} onClick={reset}>
            Take Another Snapshot™
          </button>
          {allHist.length>1 && (
            <button style={{...S.btnGhost,color:"#9aa5b1",borderColor:"#e4e7eb",fontSize:13}} onClick={clearHistory}>
              Clear History
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{background:"#15324f",borderRadius:"0 0 14px 14px",padding:"16px 26px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:13,color:"#9fb3c8"}}>Take your next Snapshot™ in 1–2 weeks</div>
          <div style={{fontSize:13,color:"#cdb86a",fontWeight:600,fontStyle:"italic"}}>Prepared beyond the CDL.</div>
        </div>
      </div>
    </div>
    );
  }

  return null;
}
