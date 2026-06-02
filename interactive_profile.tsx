import { useState, useMemo } from "react";

const SIGS = [
  { id:"hydration", name:"Hydration consistency", w:1.0 },
  { id:"energy", name:"Energy stability", w:1.0 },
  { id:"sleep", name:"Sleep quality", w:1.5 },
  { id:"recovery", name:"Recovery between shifts", w:1.5 },
  { id:"stress", name:"Stress load", w:1.5 },
  { id:"physical", name:"Physical baseline", w:1.0 },
  { id:"awareness", name:"Readiness awareness", w:1.0 },
  { id:"support", name:"Support & connection", w:1.0 },
];

const QS = [
  {s:"hydration",t:"I drink water steadily throughout my shift — not just when I'm thirsty.",r:false},
  {s:"hydration",t:"I go long stretches during a shift without drinking any water.",r:true},
  {s:"hydration",t:"I start my shift already hydrated rather than catching up later.",r:false},
  {s:"energy",t:"My energy stays relatively steady across a full shift.",r:false},
  {s:"energy",t:"I rely on energy drinks or caffeine to get through the day.",r:true},
  {s:"energy",t:"I can sustain focus late in a shift without a major energy crash.",r:false},
  {s:"sleep",t:"I get enough sleep to feel rested before driving.",r:false},
  {s:"sleep",t:"I have trouble falling asleep or staying asleep.",r:true},
  {s:"sleep",t:"The sleep I get actually feels restorative.",r:false},
  {s:"recovery",t:"I feel recovered and ready by the time my next shift starts.",r:false},
  {s:"recovery",t:"I start shifts still carrying fatigue from the last one.",r:true},
  {s:"recovery",t:"I have enough downtime between shifts to actually rest.",r:false},
  {s:"stress",t:"I can manage the day-to-day pressures of the job without feeling overwhelmed.",r:false},
  {s:"stress",t:"I feel tense or on edge most of the time.",r:true},
  {s:"stress",t:"I have ways to release stress that work for me.",r:false},
  {s:"stress",t:"Work stress follows me into my off-hours and personal life.",r:true},
  {s:"physical",t:"I feel physically capable of the demands of driving.",r:false},
  {s:"physical",t:"I notice physical complaints — aches, headaches, discomfort — more than I used to.",r:true},
  {s:"physical",t:"I move or stretch enough to avoid stiffness and strain.",r:false},
  {s:"awareness",t:"I notice early when my energy, focus, or mood start slipping.",r:false},
  {s:"awareness",t:"I tend to push through warning signs rather than respond to them.",r:true},
  {s:"awareness",t:"When something feels off, I take action before it becomes a bigger problem.",r:false},
  {s:"support",t:"I have people I can talk to about the realities of this job.",r:false},
  {s:"support",t:"I feel isolated or disconnected on the road.",r:true},
  {s:"support",t:"I know where to turn for support if I need it.",r:false},
];

const OPTS = [{l:"Almost always",v:4},{l:"Often",v:3},{l:"Sometimes",v:2},{l:"Rarely",v:1},{l:"Almost never",v:0}];

const sigName = id => SIGS.find(s=>s.id===id)?.name||id;
const band = s => s>=80?"#3a9d78":s>=60?"#caa23a":s>=40?"#e08a2b":"#c0492f";

const ZONES = {
  green:{emoji:"🟢",label:"Stable Readiness",sub:"Full margin — steady and absorbing the demands well",bg:"#eef8f1",border:"#d6ecdd",labelC:"#2f7a57",scoreC:"#3a9d78",stL:"✅ Strengths",waL:"◇ Keep An Eye On",stepC:"#3a9d78",pathL:"Maintenance check-ins · Stay aware"},
  yellow:{emoji:"🟡",label:"Yellow Zone™",sub:"Early strain — functional, but margin is narrowing",bg:"#fffbe9",border:"#f0ead0",labelC:"#8a7a3a",scoreC:"#caa23a",stL:"✅ Strengths",waL:"⚠️ Needs Attention",stepC:"#15324f",pathL:"Driver Readiness Coach + Awareness"},
  orange:{emoji:"🟠",label:"Significant Strain",sub:"Margin is shrinking — strain is real and compounding",bg:"#fef3e8",border:"#f5dfc0",labelC:"#a0591a",scoreC:"#e08a2b",stL:"✅ Still Working",waL:"⚠️ Compounding Now",stepC:"#e08a2b",pathL:"12-Week Driver Readiness Program + Coaching"},
  red:{emoji:"🔴",label:"Visible Strain",sub:"Low margin — you're carrying a lot right now",bg:"#fbeeec",border:"#f0d6d0",labelC:"#a8442f",scoreC:"#c0492f",stL:"✅ Still Holding",waL:"⚠️ Carrying The Most",stepC:"#c0492f",pathL:"Driver Readiness Coach — Human support first"},
};

function score(answers){
  const items = answers.map((v,i)=> QS[i].r ? 4-v : v);
  const sigScores = {};
  SIGS.forEach(sig=>{
    const idx = QS.map((q,i)=>({q,i})).filter(x=>x.q.s===sig.id).map(x=>x.i);
    const sum = idx.reduce((a,i)=>a+items[i],0);
    sigScores[sig.id] = Math.round((sum/(idx.length*4))*100);
  });
  const wSum = SIGS.reduce((a,sig)=>a+sigScores[sig.id]*sig.w,0);
  const wTotal = SIGS.reduce((a,sig)=>a+sig.w,0);
  let total = Math.round(wSum/wTotal);
  let zone = total>=80?"green":total>=60?"yellow":total>=40?"orange":"red";
  const minSig = Math.min(...Object.values(sigScores));
  let override = false;
  if(minSig<25){
    override=true;
    if(zone==="green") zone="yellow";
    if(total<60 && zone==="yellow") zone="orange";
  }
  const sorted = [...SIGS].sort((a,b)=>sigScores[b.id]-sigScores[a.id]);
  const strengths = sorted.slice(0,3).map(s=>s.name);
  const watch = sorted.slice(-3).reverse().map(s=>s.name);
  const pri = sorted.slice(-2).map(s=>s.id);
  return {sigScores,total,zone,override,strengths,watch,pri,minSig};
}

function narrative(z,pri,total){
  const p1=sigName(pri[0]),p2=sigName(pri[1]);
  if(z==="green") return `You're in Stable Readiness — full margin, steady enough to absorb the normal demands of the road. Nothing here needs fixing. The goal now is simply to protect what's working and stay aware as conditions shift.`;
  if(z==="yellow") return `You're in the Yellow Zone™ — still functional, but your margin is starting to narrow. The clearest signals right now are ${p1.toLowerCase()} and ${p2.toLowerCase()}. This is an early, common, and reversible pattern — and the most useful place to focus first.`;
  if(z==="orange") return `You're in Significant Strain — and if it's felt that way for a while, that's not in your head. ${p1} and ${p2.toLowerCase()} have been running thin long enough that they're compounding each other. The good news is real: you're still in the window where a structured approach can turn this around — but light adjustments alone won't be enough at this point.`;
  return `Right now you're carrying a lot, and your margin is low — ${p1.toLowerCase()} and ${p2.toLowerCase()} have been running thin for a while. That's hard, and it's worth saying plainly: this isn't a failing on your part. It's a signal that the load has outpaced the support. The most useful next step here isn't to do more on your own — it's to bring another person into this with you.`;
}

function recs(z,pri){
  const p1=sigName(pri[0]),p2=sigName(pri[1]);
  if(z==="green") return ["Keep the routines that are working — consistency is the win here, not adding more.",`Notice ${p1.toLowerCase()} if it dips — it's your lowest signal, and the first place strain would show.`,"Maintain your regular check-in cadence so any change shows up early."];
  if(z==="yellow") return [`Anchor one small habit to protect ${p1.toLowerCase()} — even an imperfect one.`,`Pay attention to ${p2.toLowerCase()} this week — that's where strain is building next.`,"Check in with your Driver Readiness Coach on these two areas."];
  if(z==="orange") return ["Start the 12-Week Driver Readiness Program — it's designed for exactly this stage.",`Focus on ${p1.toLowerCase()} first — one consistent step each shift starts rebuilding the foundation.`,"Connect with your Driver Readiness Coach — at this level, coaching support moves faster than self-directed effort alone."];
  return ["Connect with a person this week — your Driver Readiness Coach or another trusted support. This is the step that matters most right now.",`Protect ${p1.toLowerCase()} as the first priority — even a small, consistent gain eases everything else.`,"Lean on what's still strong — you don't have to carry this alone."];
}

function coachPrompt(res){
  const z=ZONES[res.zone],p1=sigName(res.pri[0]),p2=sigName(res.pri[1]);
  return `I just completed my Driver Readiness Profile™. My overall score is ${res.total}/100, placing me in ${z.label}. My two lowest signals are ${p1.toLowerCase()} (${res.sigScores[res.pri[0]]}/100) and ${p2.toLowerCase()} (${res.sigScores[res.pri[1]]}/100). Can you help me think about one small, practical step I can take this week to start protecting my margin in those areas?`;
}

export default function App(){
  const [screen,setScreen]=useState("landing");
  const [qi,setQi]=useState(0);
  const [ans,setAns]=useState(Array(25).fill(null));
  const [sel,setSel]=useState(null);
  const [copied,setCopied]=useState(false);

  const results = useMemo(()=>{
    if(ans.includes(null)) return null;
    return score(ans);
  },[ans]);

  const curSig = QS[qi]?.s;

  const pick = v=>{setSel(v);};
  const next = ()=>{
    const a=[...ans];a[qi]=sel;setAns(a);setSel(null);
    if(qi<24) setQi(qi+1); else {setScreen("complete");/* compute */}
  };

  const copyResults = ()=>{
    if(!results) return;
    const z=ZONES[results.zone];
    let txt=`DRIVER READINESS PROFILE™ RESULTS\n${z.emoji} ${z.label} — Score: ${results.total}/100\n\nSIGNAL BREAKDOWN:\n`;
    SIGS.forEach(s=>{txt+=`${s.name}: ${results.sigScores[s.id]}/100\n`;});
    txt+=`\nSTRENGTHS: ${results.strengths.join(", ")}\nWATCH AREAS: ${results.watch.join(", ")}\n\nNARRATIVE:\n${narrative(results.zone,results.pri,results.total)}\n\nRECOMMENDED NEXT STEPS:\n`;
    recs(results.zone,results.pri).forEach((r,i)=>{txt+=`${i+1}. ${r}\n`;});
    txt+=`\nPathway: ${z.pathL}\n\nDriver Readiness is built daily — not just tested.\npowered by HaulWell™`;
    navigator.clipboard.writeText(txt).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
  };

  const S={
    wrap:{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",maxWidth:560,margin:"0 auto",color:"#1f2933",lineHeight:1.5},
    hdr:{background:"#15324f",padding:"22px 26px",color:"#fff",borderRadius:screen==="landing"?"14px 14px 0 0":"0"},
    hdrSm:{fontSize:12,letterSpacing:1.5,textTransform:"uppercase",opacity:.7},
    hdrLg:{fontSize:22,fontWeight:700,marginTop:2},
    body:{background:"#fff",border:"1px solid #e4e7eb",borderTop:"none",padding:"28px 26px"},
    btn:{background:"#15324f",color:"#fff",border:"none",borderRadius:10,padding:"16px 0",width:"100%",fontSize:16,fontWeight:700,cursor:"pointer",marginTop:16},
    btnGhost:{background:"transparent",color:"#15324f",border:"2px solid #15324f",borderRadius:10,padding:"14px 0",width:"100%",fontSize:15,fontWeight:600,cursor:"pointer",marginTop:10},
    label:{fontSize:12,letterSpacing:1,textTransform:"uppercase",color:"#6b7280",marginBottom:8},
    foot:{background:"#15324f",borderRadius:"0 0 14px 14px",padding:"18px 26px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10},
  };

  // LANDING
  if(screen==="landing") return(
    <div style={S.wrap}>
      <div style={{...S.hdr,borderRadius:"14px 14px 0 0",textAlign:"center",padding:"36px 26px"}}>
        <div style={S.hdrSm}>HaulWell™</div>
        <div style={{fontSize:24,fontWeight:700,marginTop:6}}>Driver Readiness Profile™</div>
      </div>
      <div style={{...S.body,textAlign:"center",borderRadius:"0 0 14px 14px"}}>
        <p style={{fontSize:17,color:"#374151",marginBottom:24}}>Find out where your readiness stands today — and what it means for the road.</p>
        <div style={{display:"flex",justifyContent:"center",gap:24,marginBottom:28,flexWrap:"wrap"}}>
          {["25 questions","About 5 minutes","Instant results"].map(t=>(
            <div key={t} style={{fontSize:14,color:"#6b7280"}}>· {t}</div>
          ))}
        </div>
        <button style={S.btn} onClick={()=>setScreen("welcome")}>BEGIN MY PROFILE →</button>
        <p style={{fontSize:13,color:"#9aa5b1",marginTop:20,lineHeight:1.6}}>Not a medical test. Not a screening.<br/>A readiness check-in built for the realities of the road.</p>
        <p style={{fontSize:13,color:"#9aa5b1",marginTop:8}}>Your results belong to you.</p>
      </div>
    </div>
  );

  // WELCOME
  if(screen==="welcome") return(
    <div style={S.wrap}>
      <div style={{...S.hdr,borderRadius:"14px 14px 0 0"}}>
        <div style={S.hdrSm}>HaulWell™</div>
        <div style={S.hdrLg}>Before you begin</div>
      </div>
      <div style={{...S.body,borderRadius:"0 0 14px 14px"}}>
        <p style={{fontSize:15,color:"#374151",marginBottom:16}}>This is a readiness check-in — not a medical test, a screening, or an evaluation. There is no passing or failing here.</p>
        <p style={{fontSize:15,color:"#374151",marginBottom:16}}>You'll answer 25 short questions about how you've been feeling on the road lately. At the end, you'll get a personal Readiness Profile™ that shows where your margin stands and what, if anything, is worth paying attention to.</p>
        <p style={{fontSize:15,color:"#374151",fontWeight:600}}>One request: answer for how things actually are — not how you think they should be. The more honest your answers, the more useful your Profile will be.</p>
        <button style={S.btn} onClick={()=>setScreen("question")}>CONTINUE →</button>
      </div>
    </div>
  );

  // QUESTION
  if(screen==="question") return(
    <div style={S.wrap}>
      <div style={{...S.hdr,borderRadius:"14px 14px 0 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={S.hdrSm}>HaulWell™</div>
          <div style={{fontSize:13,opacity:.8}}>Question {qi+1} / 25</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.15)",borderRadius:6,height:8,marginTop:12,overflow:"hidden"}}>
          <div style={{width:`${((qi+1)/25)*100}%`,background:"#cdb86a",height:"100%",borderRadius:6,transition:"width 0.3s ease"}}/>
        </div>
        <div style={{fontSize:12,color:"#9fb3c8",marginTop:8,letterSpacing:.5}}>Signal: {sigName(curSig)}</div>
      </div>
      <div style={{...S.body,borderRadius:"0 0 14px 14px"}}>
        <p style={{fontSize:18,fontWeight:700,color:"#15324f",marginBottom:28,lineHeight:1.4}}>{QS[qi].t}</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {OPTS.map(o=>(
            <button key={o.v} onClick={()=>pick(o.v)} style={{
              display:"flex",alignItems:"center",gap:12,padding:"14px 16px",
              border:sel===o.v?"2px solid #15324f":"1px solid #e4e7eb",
              borderRadius:10,background:sel===o.v?"#f0f4f8":"#fff",
              cursor:"pointer",fontSize:15,color:"#374151",fontWeight:sel===o.v?600:400,
              transition:"all 0.15s ease"
            }}>
              <div style={{width:20,height:20,borderRadius:"50%",border:sel===o.v?"6px solid #15324f":"2px solid #c8cfd8",boxSizing:"border-box",flexShrink:0}}/>
              {o.l}
            </button>
          ))}
        </div>
        <button style={{...S.btn,opacity:sel===null?.4:1,pointerEvents:sel===null?"none":"auto"}} onClick={next}>
          {qi<24?"NEXT →":"VIEW MY PROFILE →"}
        </button>
      </div>
    </div>
  );

  // COMPLETE
  if(screen==="complete") return(
    <div style={S.wrap}>
      <div style={{background:"#15324f",borderRadius:14,padding:"48px 26px",textAlign:"center",color:"#fff"}}>
        <div style={S.hdrSm}>HaulWell™</div>
        <div style={{fontSize:22,fontWeight:700,marginTop:12}}>You've completed your<br/>Driver Readiness Profile™.</div>
        <p style={{fontSize:15,color:"#9fb3c8",marginTop:16}}>Your responses have been scored across 8 readiness signals. Your personal Profile is ready.</p>
        <button style={{...S.btn,background:"#cdb86a",color:"#15324f",marginTop:28,maxWidth:320,marginLeft:"auto",marginRight:"auto"}} onClick={()=>setScreen("results")}>VIEW MY PROFILE →</button>
        <p style={{fontSize:14,color:"#9fb3c8",marginTop:24,fontStyle:"italic"}}>Driver Readiness is built daily — not just tested.</p>
      </div>
    </div>
  );

  // RESULTS
  if(screen==="results"&&results){
    const z=ZONES[results.zone];
    const rc=recs(results.zone,results.pri);
    const nar=narrative(results.zone,results.pri,results.total);
    const prompt=coachPrompt(results);
    const meterPos=Math.max(2,Math.min(98,results.total));

    return(
    <div style={S.wrap}>
      <div style={{...S.hdr,borderRadius:"14px 14px 0 0"}}>
        <div style={S.hdrSm}>HaulWell™</div>
        <div style={S.hdrLg}>Driver Readiness Profile™</div>
      </div>
      <div style={{background:"#fff",border:"1px solid #e4e7eb",borderTop:"none"}}>
        {/* Zone Banner */}
        <div style={{display:"flex",alignItems:"center",gap:18,padding:"22px 26px",background:z.bg,borderBottom:`1px solid ${z.border}`}}>
          <div style={{fontSize:42,lineHeight:1}}>{z.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,letterSpacing:1,textTransform:"uppercase",color:z.labelC}}>Overall Readiness Status</div>
            <div style={{fontSize:24,fontWeight:700,color:"#15324f"}}>{z.label}</div>
            <div style={{fontSize:14,color:"#6b7280",marginTop:2}}>{z.sub}</div>
          </div>
          <div style={{textAlign:"center",background:"#fff",border:`1px solid ${z.border}`,borderRadius:10,padding:"10px 14px"}}>
            <div style={{fontSize:28,fontWeight:800,color:z.scoreC}}>{results.total}</div>
            <div style={{fontSize:10,letterSpacing:.5,color:z.labelC,textTransform:"uppercase"}}>Total / 100</div>
          </div>
        </div>

        {/* Margin Meter */}
        <div style={{padding:"20px 26px",borderBottom:"1px solid #e4e7eb"}}>
          <div style={S.label}>Margin Meter™</div>
          <div style={{position:"relative",height:18,borderRadius:9,background:"linear-gradient(to right, #c0492f 0%, #c0492f 20%, #e08a2b 21%, #e08a2b 40%, #caa23a 41%, #caa23a 60%, #3a9d78 61%, #3a9d78 100%)",overflow:"visible",marginTop:4}}>
            <div style={{position:"absolute",left:`${meterPos}%`,top:-3,width:24,height:24,borderRadius:"50%",background:"#15324f",border:"3px solid #fff",boxShadow:"0 1px 4px rgba(0,0,0,.3)",transform:"translateX(-50%)",transition:"left 0.5s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7280",marginTop:6}}>
            <span>Visible Strain</span><span>Significant</span><span>Yellow Zone™</span><span>Stable</span>
          </div>
        </div>

        {/* Signal Breakdown */}
        <div style={{padding:"22px 26px",borderBottom:"1px solid #e4e7eb"}}>
          <div style={S.label}>Signal Breakdown</div>
          {SIGS.map(sig=>{
            const sc=results.sigScores[sig.id];
            const c=band(sc);
            return(
              <div key={sig.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:11}}>
                <div style={{width:150,fontSize:13,color:"#374151",flexShrink:0}}>{sig.name}</div>
                <div style={{flex:1,background:"#edf0f3",borderRadius:6,height:14,overflow:"hidden"}}>
                  <div style={{width:`${sc}%`,background:c,height:"100%",borderRadius:6,transition:"width 0.5s ease"}}/>
                </div>
                <div style={{width:30,textAlign:"right",fontSize:13,fontWeight:700,color:c}}>{sc}</div>
              </div>
            );
          })}
        </div>

        {/* Strengths / Watch */}
        <div style={{display:"flex",borderBottom:"1px solid #e4e7eb"}}>
          <div style={{flex:1,padding:"18px 26px",borderRight:"1px solid #e4e7eb"}}>
            <div style={{fontSize:12,letterSpacing:.5,textTransform:"uppercase",color:"#2f8a6f",marginBottom:10}}>{z.stL}</div>
            {results.strengths.map(s=><div key={s} style={{fontSize:14,color:"#374151",marginBottom:6}}>{s}</div>)}
          </div>
          <div style={{flex:1,padding:"18px 26px"}}>
            <div style={{fontSize:12,letterSpacing:.5,textTransform:"uppercase",color:z.labelC,marginBottom:10}}>{z.waL}</div>
            {results.watch.map(s=><div key={s} style={{fontSize:14,color:"#374151",marginBottom:6}}>{s}</div>)}
          </div>
        </div>

        {/* Narrative */}
        <div style={{padding:"20px 26px",background:"#f7f9fb",borderBottom:"1px solid #e4e7eb"}}>
          <div style={S.label}>Your Profile</div>
          <p style={{fontSize:15,color:"#374151",lineHeight:1.6,margin:0}}>{nar}</p>
        </div>

        {/* Recommendations */}
        <div style={{padding:"20px 26px",borderBottom:"1px solid #e4e7eb"}}>
          <div style={S.label}>Recommended Next Steps</div>
          {rc.map((r,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
              <div style={{background:z.stepC,color:"#fff",fontSize:12,fontWeight:700,borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
              <div style={{fontSize:14,color:"#374151"}}>{r}</div>
            </div>
          ))}
        </div>

        {/* Red zone support note */}
        {results.zone==="red"&&(
          <div style={{margin:"0 26px 20px",padding:"16px 18px",background:"#fbeeec",border:"1px solid #f0d6d0",borderRadius:10}}>
            <div style={{fontSize:13,color:"#7a3527",lineHeight:1.55}}>💬 <strong>A note:</strong> If things feel heavier than the road itself — beyond fatigue and stress — please reach out to someone you trust or a support line. You matter beyond the job.</div>
          </div>
        )}

        {/* Override note */}
        {results.override&&(
          <div style={{margin:"0 26px 20px",padding:"16px 18px",background:"#fffbe9",border:"1px solid #f0ead0",borderRadius:10}}>
            <div style={{fontSize:13,color:"#8a7a3a",lineHeight:1.55}}>📋 <strong>Note:</strong> One of your signals scored critically low, which adjusted your zone placement. A single collapsed signal can narrow your overall margin even when other areas are strong.</div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{padding:"20px 26px",borderBottom:"1px solid #e4e7eb"}}>
          <button style={{...S.btn,marginTop:0,display:"flex",alignItems:"center",justifyContent:"center",gap:8}} onClick={()=>{navigator.clipboard.writeText(prompt);window.open&&window.open("https://claude.ai","_blank");}}>
            Open AI Driver Readiness Coach →
          </button>
          <button style={S.btnGhost} onClick={copyResults}>
            {copied?"✓ Copied to Clipboard":"Copy My Results"}
          </button>
          <button style={{...S.btnGhost,color:"#6b7280",borderColor:"#e4e7eb"}} onClick={()=>{setScreen("landing");setQi(0);setAns(Array(25).fill(null));setSel(null);}}>
            Start Over
          </button>
        </div>

        {/* Footer */}
        <div style={S.foot}>
          <div>
            <div style={{fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"#9fb3c8"}}>Recommended Pathway</div>
            <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>{z.pathL}</div>
          </div>
          <div style={{fontSize:13,color:"#cdb86a",fontWeight:600,fontStyle:"italic"}}>Prepared beyond the CDL.</div>
        </div>
      </div>
    </div>
    );
  }

  return null;
}
