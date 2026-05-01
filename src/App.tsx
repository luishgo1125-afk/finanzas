import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── FONTS ────────────────────────────────────────────────────────────────────
const FONTS = `https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap`;
// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = n => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n);
const uid = () => Math.random().toString(36).slice(2)+Date.now().toString(36);
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const hoyMes = () => { const d=new Date(); return `${MESES[d.getMonth()]} ${d.getFullYear()}`; };
const hoyStr = () => new Date().toISOString().slice(0,10);
const CATS = ["🍔 Comida","⛽ Gasolina","👕 Ropa","🎬 Entretenimiento","🏥 Salud","✈ Viajes","🛒 Super","🏠 Hogar","📱 Tecnología","🎓 Educación","💊 Farmacia","🐾 Mascotas"];
const METODOS = ["💵 Efectivo","💳 Tarjeta","🔄 Transferencia"];
const SEED_DATA = () => ({ ingresos:[], gastos:[], servicios:[], tarjetas:[], variables:[], historial:[], saldoArrastre:0, ahorro:0, metaAhorro:0 });

// Colores por categoría para la gráfica
const CAT_COLORS = {
  "🍔 Comida":"#FF6B6B","⛽ Gasolina":"#FFB547","👕 Ropa":"#A78BFA",
  "🎬 Entretenimiento":"#60A5FA","🏥 Salud":"#34D399","✈ Viajes":"#F472B6",
  "🛒 Super":"#FB923C","🏠 Hogar":"#A3E635","📱 Tecnología":"#22D3EE",
  "🎓 Educación":"#818CF8","💊 Farmacia":"#E879F9","🐾 Mascotas":"#86EFAC",
  "💳 Tarjeta":"#94A3B8",
};
const getCatColor = (cat) => {
  const key = Object.keys(CAT_COLORS).find(k => cat?.startsWith(k.split(" ")[0])||cat===k);
  return CAT_COLORS[key||"💳 Tarjeta"] || "#94A3B8";
};

// ─── THEME ────────────────────────────────────────────────────────────────────
const makeTheme = (dark) => ({
  bg: dark ? "#0F1011" : "#F0F0EE",
  surface: dark ? "#17191B" : "#FFFFFF",
  card: dark ? "#1E2022" : "#F7F7F5",
  border: dark ? "#2C2E30" : "#E2E2DF",
  border2: dark ? "#383B3E" : "#C8C8C5",
  text: dark ? "#ECEAE6" : "#1C1C1A",
  textSub: dark ? "#6B6965" : "#7A7874",
  textMid: dark ? "#A09C94" : "#555250",
  accent: dark ? "#9CA3AF" : "#52525B",
  accentBr: dark ? "#6B7280" : "#3F3F46",
  accentDim: dark ? "#2C2E35" : "#E4E4E7",
  green: dark ? "#6B9E76" : "#3D7A4A",
  greenDim: dark ? "#1E3524" : "#D1EDD8",
  red: dark ? "#A0635A" : "#B84040",
  redDim: dark ? "#3D1E1A" : "#FAE0E0",
  amber: dark ? "#B89060" : "#8A6030",
  amberDim: dark ? "#3D2E14" : "#FBF0DF",
  blue: dark ? "#6B8FA3" : "#3A6880",
  blueDim: dark ? "#1A2E3D" : "#DFF0FA",
  gold: dark ? "#9CA3AF" : "#52525B",
  goldDim: dark ? "#4B5563" : "#E4E4E7",
});

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SB_URL = "https://hchkkmknrfssxshbwtmi.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjaGtrbWtucmZzc3hzaGJ3dG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NzI1NzksImV4cCI6MjA5MzE0ODU3OX0.8wbQlYHUmAT57F1AfgivcVsDw-iQE-tJ4bmrOIoAQRg";

// Cliente Supabase inicializado con el paquete oficial
const sb = createClient(SB_URL, SB_ANON);

const loadCloudData = async (id) => {
  try {
    const {data, error} = await sb.from("user_data").select("data").eq("id", id).single();
    if(error) { console.warn("loadCloudData:", error.message); return null; }
    return data?.data || null;
  } catch(e){ console.warn("loadCloudData error:", e); return null; }
};

const checkEmailExists = async (email) => {
  try {
    const {data, error} = await sb.from("user_data").select("id").eq("email", email);
    if(error) return false;
    return (data?.length||0) > 0;
  } catch(e){ return false; }
};

// ─── SUPABASE AUTH HELPERS ───────────────────────────────────────────────────
// Registro con Supabase Auth (envía email de confirmación)
const sbSignUp = async (email, pass, name) => {
  const {data, error} = await sb.auth.signUp({
    email, password: pass,
    options: {
      data: {name},
      emailRedirectTo: "https://finanzas-seven-theta.vercel.app",
    }
  });
  return {data, error};
};

// Login con Supabase Auth
const sbSignIn = async (email, pass) => {
  const {data, error} = await sb.auth.signInWithPassword({email, password: pass});
  return {data, error};
};

// Recuperar contraseña
const sbResetPassword = async (email) => {
  const {error} = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: "https://finanzas-seven-theta.vercel.app",
  });
  return {error};
};

// Buscar usuario por email en Supabase (tabla user_data)
const findCloudUser = async (email) => {
  try {
    const {data, error} = await sb.from("user_data").select("id, email, pass, name").eq("email", email).single();
    if(error) return null;
    return data;
  } catch(e){ return null; }
};

// Guardar usuario con nombre y contraseña en Supabase
const saveCloudUser = async (id, email, name, pass, appData) => {
  localStorage.setItem(`fin_data_${id}`, JSON.stringify(appData));
  try {
    const {error} = await sb.from("user_data").upsert(
      {id, email, name, pass, data: appData, updated_at: new Date().toISOString()},
      {onConflict: "id"}
    );
    if(error) console.warn("saveCloudUser:", error.message);
  } catch(e){ console.warn("saveCloudUser error:", e); }
};

const saveCloudData = async (id, email, appData, userName, userPass) => {
  localStorage.setItem(`fin_data_${id}`, JSON.stringify(appData));
  try {
    // Intentar obtener pass y name del localStorage
    const users = getUsers();
    const localUser = Object.values(users).find(u=>u.id===id);
    const name = userName || localUser?.name;
    const pass = userPass || localUser?.pass;
    const payload = {id, email, data: appData, updated_at: new Date().toISOString()};
    if(name) payload.name = name;
    if(pass) payload.pass = pass;
    const {error} = await sb.from("user_data").upsert(payload, {onConflict: "id"});
    if(error) console.warn("saveCloudData:", error.message);
    else console.log("✓ Supabase sync OK");
  } catch(e){ console.warn("saveCloudData error:", e); }
};

// ─── AUTH STORAGE ─────────────────────────────────────────────────────────────
const getUsers    = () => { try{ return JSON.parse(localStorage.getItem("fin_users")||"{}"); }catch{return {};} };
const saveUsers   = u => localStorage.setItem("fin_users", JSON.stringify(u));
const getUserData = id => { try{ return JSON.parse(localStorage.getItem(`fin_data_${id}`)||"null"); }catch{return null;} };
const saveUserData= (id,d) => localStorage.setItem(`fin_data_${id}`, JSON.stringify(d));
const getSession  = () => { try{ return JSON.parse(localStorage.getItem("fin_session")||"null"); }catch{return null;} };
const saveSession = s => s ? localStorage.setItem("fin_session",JSON.stringify(s)) : localStorage.removeItem("fin_session");
const getDarkMode = () => { try{ return JSON.parse(localStorage.getItem("fin_dark")??"true"); }catch{return true;} };
const saveDarkMode= v => localStorage.setItem("fin_dark", JSON.stringify(v));
const getPin     = id => { try{ return localStorage.getItem(`fin_pin_${id}`)||""; }catch{return "";} };
const savePin    = (id,p) => p ? localStorage.setItem(`fin_pin_${id}`,p) : localStorage.removeItem(`fin_pin_${id}`);
const getPinLock = () => { try{ return JSON.parse(localStorage.getItem("fin_pin_lock")||"null"); }catch{return null;} };
const savePinLock= v => v ? localStorage.setItem("fin_pin_lock",JSON.stringify(v)) : localStorage.removeItem("fin_pin_lock");

// ─── CSS ──────────────────────────────────────────────────────────────────────
const makeCSS = (T) => `
  @import url('${FONTS}');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { -webkit-text-size-adjust:100%; }
  body { background:${T.bg}; font-family:'DM Sans',sans-serif; color:${T.text}; }
  ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:${T.border2}; border-radius:99px; }
  input, select, textarea { font-size:16px!important; font-family:'DM Sans',sans-serif; -webkit-appearance:none; }
  input:focus, select:focus { outline:none; }
  button { font-family:'DM Sans',sans-serif; cursor:pointer; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .fade-up { animation: fadeUp .28s cubic-bezier(.16,1,.3,1) both; }
  .fade-in { animation: fadeIn .2s ease both; }
  details summary { list-style:none; cursor:pointer; }
  details summary::-webkit-details-marker { display:none; }
  .tab-pill:hover { background:${T.card}!important; -webkit-transform:translateZ(0); transform:translateZ(0); }
  .summary-card:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,.08); }
  .summary-card { transition:transform .2s, box-shadow .2s, border-color .2s; }
`;

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
const Badge = ({children, color, bg="transparent", border, T: th}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:500,
    letterSpacing:.4,padding:"2px 7px",borderRadius:99,background:bg||`${th.border}44`,
    border:`1px solid ${border||th.border}`,color:color||th.textSub}}>
    {children}
  </span>
);
const StatusDot = ({active, T}) => (
  <span style={{width:6,height:6,borderRadius:"50%",background:active?T.green:T.red,display:"inline-block"}}/>
);
const Overlay = ({onClick}) => (
  <div onClick={onClick} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:40}}/>
);

// ─── GRÁFICA SEMANAL ─────────────────────────────────────────────────────────
function CategoryChart({T, gastos}) {
  if(gastos.length===0) return null;

  // Agrupar por categoría y sumar montos
  const catMap = {};
  gastos.forEach(g => {
    const c = g.categoria || "Otro";
    if(!catMap[c]) catMap[c] = {total:0, items:[]};
    catMap[c].total += g.monto;
    catMap[c].items.push(g);
  });

  const totalGasto = gastos.reduce((s,g)=>s+g.monto, 0);
  const cats = Object.entries(catMap).sort((a,b)=>b[1].total-a[1].total);

  return (
    <div>
      {/* Barra de progreso horizontal apilada */}
      <div style={{height:10,borderRadius:99,overflow:"hidden",display:"flex",marginBottom:14}}>
        {cats.map(([cat,{total}],i)=>(
          <div key={cat}
            style={{width:`${(total/totalGasto)*100}%`,height:"100%",
              background:getCatColor(cat),
              borderRadius: i===0?"99px 0 0 99px": i===cats.length-1?"0 99px 99px 0":"0",
              transition:"width .5s ease"}}/>
        ))}
      </div>

      {/* Lista de categorías con barra individual */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {cats.map(([cat,{total,items}])=>{
          const pct = Math.round((total/totalGasto)*100);
          return (
            <div key={cat}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:10,height:10,borderRadius:3,background:getCatColor(cat),flexShrink:0}}/>
                  <span style={{fontSize:12,color:T.textMid}}>{cat}</span>
                  <span style={{fontSize:10,color:T.textSub}}>{items.length} gasto{items.length!==1?"s":""}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:10,color:T.textSub}}>{pct}%</span>
                  <span style={{fontFamily:"'DM Serif Display',serif",fontSize:13,color:T.text,fontWeight:500}}>
                    {fmt(total)}
                  </span>
                </div>
              </div>
              {/* Barra individual */}
              <div style={{height:3,borderRadius:99,background:T.border,overflow:"hidden"}}>
                <div style={{width:`${pct}%`,height:"100%",borderRadius:99,
                  background:getCatColor(cat),transition:"width .5s ease"}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        marginTop:12,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
        <span style={{fontSize:11,color:T.textSub}}>{gastos.length} transacciones</span>
        <span style={{fontFamily:"'DM Serif Display',serif",fontSize:14,color:T.red,fontWeight:500}}>
          {fmt(totalGasto)}
        </span>
      </div>
    </div>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function Confirm({T, icon="⚠",title,body,ok="Confirmar",okColor,onOk,onCancel}) {
  return (
    <>
      <Overlay onClick={onCancel}/>
      <div className="fade-up" style={{position:"fixed",left:0,right:0,top:0,bottom:0,
        display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,pointerEvents:"none"}}>
      <div style={{background:T.surface,border:`1px solid ${T.border2}`,borderRadius:16,padding:28,
        width:"min(340px,92vw)",pointerEvents:"all",boxShadow:"0 8px 32px rgba(0,0,0,.3)"}}>
        <div style={{fontSize:32,marginBottom:12,textAlign:"center"}}>{icon}</div>
        <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:T.text,marginBottom:8,textAlign:"center"}}>{title}</h3>
        <p style={{fontSize:13,color:T.textSub,lineHeight:1.7,marginBottom:24,textAlign:"center"}}>{body}</p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onCancel} style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,
            borderRadius:10,padding:"11px 0",fontSize:13,color:T.textMid}}>Cancelar</button>
          <button onClick={onOk} style={{flex:1,background:okColor||T.red,border:"none",borderRadius:10,
            padding:"11px 0",fontSize:13,fontWeight:600,color:"#fff"}}>{ok}</button>
        </div>
      </div>
      </div>
    </>
  );
}

// ─── COLOR PICKER ─────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  {hex:"#6B7280",name:"Gris"},{hex:"#9CA3AF",name:"Gris claro"},{hex:"#4B5563",name:"Gris oscuro"},
  {hex:"#8B5CF6",name:"Morado"},{hex:"#3B82F6",name:"Azul"},{hex:"#10B981",name:"Verde"},
  {hex:"#F59E0B",name:"Ámbar"},{hex:"#EF4444",name:"Rojo"},{hex:"#EC4899",name:"Rosa"},
  {hex:"#F97316",name:"Naranja"},{hex:"#06B6D4",name:"Cian"},{hex:"#84CC16",name:"Lima"},
];
function ColorPicker({T, value, onChange}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,padding:"4px 0"}}>
      {COLOR_OPTIONS.map(c=>{
        const selected = value===c.hex;
        return (
          <button key={c.hex} onClick={()=>onChange(c.hex)}
            style={{background:"transparent",border:"none",padding:0,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:c.hex,
              border:selected?`3px solid ${T.text}`:`3px solid transparent`,
              boxShadow:selected?`0 0 0 2px ${T.bg}, 0 0 0 4px ${c.hex}`:"none",
              transition:"all .15s"}}/>
            <span style={{fontSize:9,color:selected?T.text:T.textSub,fontWeight:selected?600:400}}>{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── SHEET MODAL ─────────────────────────────────────────────────────────────
function Sheet({T, title, fields, initial={}, onSave, onClose}) {
  const [form, setForm] = useState({...initial});
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const valid = fields.filter(f=>f.req).every(f=>form[f.key]!==undefined&&form[f.key]!=="");
  const inputStyle = {width:"100%",background:T.card,border:`1px solid ${T.border2}`,borderRadius:10,
    padding:"11px 14px",fontSize:15,color:T.text,boxSizing:"border-box"};
  return (
    <>
      <Overlay onClick={onClose}/>
      <div className="fade-up" style={{position:"fixed",bottom:0,left:0,right:0,
        background:T.surface,borderRadius:"18px 18px 0 0",border:`1px solid ${T.border}`,
        padding:"20px 16px 36px",zIndex:50,maxHeight:"88vh",overflowY:"auto",maxWidth:520,margin:"0 auto"}}>
        <div style={{width:36,height:3,borderRadius:2,background:T.border2,margin:"0 auto 18px"}}/>
        <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:T.text,marginBottom:20}}>{title}</h3>
        {fields.map(f=>(
          <div key={f.key} style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:500,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>{f.label}</label>
            {f.type==="colorpicker"
              ? <ColorPicker T={T} value={form[f.key]||""} onChange={v=>set(f.key,v)}/>
              : f.type==="select"
              ? <select value={form[f.key]||""} onChange={e=>set(f.key,e.target.value)}
                  style={{...inputStyle,backgroundImage:"none",width:"100%"}}>
                  <option value="">Seleccionar...</option>
                  {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              : <input type={f.type||"text"} placeholder={f.ph||""}
                  value={form[f.key]!==undefined?form[f.key]:""}
                  onChange={e=>set(f.key,f.type==="number"?Number(e.target.value):e.target.value)}
                  style={inputStyle}/>
            }
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:22}}>
          <button onClick={onClose} style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,
            borderRadius:10,padding:"13px 0",fontSize:14,color:T.textMid}}>Cancelar</button>
          <button onClick={()=>valid&&onSave(form)} style={{flex:2,background:valid?T.accent:T.border,
            border:"none",borderRadius:10,padding:"13px 0",fontSize:14,fontWeight:600,
            color:valid?"#fff":T.textSub,transition:"background .2s"}}>Guardar</button>
        </div>
      </div>
    </>
  );
}


// ─── PIN SCREEN ───────────────────────────────────────────────────────────────
function PinScreen({T, userId, userName, onUnlock, onLogout}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [segundos, setSegundos] = useState(0);

  useEffect(()=>{
    const lock = getPinLock();
    if(lock && lock.until > Date.now()){
      setBloqueado(true);
      setSegundos(Math.ceil((lock.until-Date.now())/1000));
    }
  },[]);

  useEffect(()=>{
    if(!bloqueado) return;
    if(segundos<=0){ setBloqueado(false); savePinLock(null); setIntentos(0); return; }
    const t = setTimeout(()=>setSegundos(s=>s-1),1000);
    return ()=>clearTimeout(t);
  },[bloqueado,segundos]);

  const handleDigit = (d) => {
    if(bloqueado) return;
    const next = input+d;
    setInput(next);
    if(next.length===4){
      const stored = getPin(userId);
      if(next===stored){
        setError(""); setIntentos(0); savePinLock(null);
        onUnlock();
      } else {
        const ni = intentos+1;
        setIntentos(ni);
        if(ni>=3){
          const until = Date.now()+30000;
          savePinLock({until});
          setBloqueado(true); setSegundos(30);
        } else {
          setError(`PIN incorrecto · ${3-ni} intento${3-ni!==1?"s":""} restante${3-ni!==1?"s":""}`);
        }
        setTimeout(()=>setInput(""),300);
      }
    }
  };

  const del = () => setInput(p=>p.slice(0,-1));

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{makeCSS(T)}</style>
      <link href={FONTS} rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:10,letterSpacing:5,color:T.textSub,textTransform:"uppercase",marginBottom:8}}>Mi Capital</div>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:T.text}}>
          Hola, <em style={{color:T.accent}}>{userName.split(" ")[0]}</em>
        </div>
        <div style={{fontSize:13,color:T.textSub,marginTop:4}}>Ingresa tu PIN</div>
      </div>

      {/* Puntos del PIN */}
      <div style={{display:"flex",gap:16,marginBottom:32}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:16,height:16,borderRadius:"50%",
            background:input.length>i?(bloqueado?T.red:T.accent):T.border,
            transition:"background .15s"}}/>
        ))}
      </div>

      {error&&!bloqueado&&(
        <div style={{fontSize:12,color:T.red,marginBottom:16,textAlign:"center"}}>{error}</div>
      )}
      {bloqueado&&(
        <div style={{fontSize:12,color:T.red,marginBottom:16,textAlign:"center",
          background:T.redDim,borderRadius:8,padding:"8px 16px"}}>
          Demasiados intentos · Espera {segundos}s
        </div>
      )}

      {/* Teclado numérico */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,72px)",gap:12,marginBottom:24}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
          <button key={i} onClick={()=>d==="⌫"?del():d!==""&&handleDigit(String(d))}
            disabled={bloqueado}
            style={{width:72,height:72,borderRadius:"50%",
              background:d===""?"transparent":T.surface,
              border:d===""?"none":`1px solid ${T.border}`,
              fontSize:d==="⌫"?20:22,fontWeight:500,
              color:bloqueado?T.textSub:T.text,
              cursor:d===""?"default":bloqueado?"not-allowed":"pointer",
              transition:"background .1s",
              fontFamily:"'DM Serif Display',serif"}}>
            {d}
          </button>
        ))}
      </div>

      <button onClick={onLogout}
        style={{background:"transparent",border:"none",fontSize:12,color:T.textSub,cursor:"pointer"}}>
        Usar otra cuenta
      </button>
    </div>
  );
}

// ─── SET PIN SCREEN (al registrarse o cambiar PIN) ────────────────────────────
function SetPinScreen({T, userId, onDone}) {
  const [step, setStep] = useState("set"); // "set" | "confirm"
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const current = step==="set" ? pin1 : pin2;
  const setFn   = step==="set" ? setPin1 : setPin2;

  const handleDigit = (d) => {
    const next = current+d;
    setFn(next);
    if(next.length===4){
      if(step==="set"){ setStep("confirm"); }
      else {
        if(next===pin1){ savePin(userId,next); onDone(); }
        else { setError("Los PINs no coinciden. Intenta de nuevo."); setPin1(""); setPin2(""); setStep("set"); }
      }
    }
  };
  const del = () => setFn(p=>p.slice(0,-1));

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{makeCSS(T)}</style>
      <link href={FONTS} rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:10,letterSpacing:5,color:T.textSub,textTransform:"uppercase",marginBottom:8}}>Seguridad</div>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:T.text}}>
          {step==="set"?"Define tu PIN":"Confirma tu PIN"}
        </div>
        <div style={{fontSize:13,color:T.textSub,marginTop:4}}>
          {step==="set"?"Elige 4 dígitos que recuerdes":"Vuelve a ingresar el mismo PIN"}
        </div>
      </div>

      <div style={{display:"flex",gap:16,marginBottom:32}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:16,height:16,borderRadius:"50%",
            background:current.length>i?T.accent:T.border,transition:"background .15s"}}/>
        ))}
      </div>

      {error&&<div style={{fontSize:12,color:T.red,marginBottom:16,textAlign:"center",
        background:T.redDim,borderRadius:8,padding:"8px 16px"}}>{error}</div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,72px)",gap:12,marginBottom:24}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
          <button key={i} onClick={()=>d==="⌫"?del():d!==""&&handleDigit(String(d))}
            style={{width:72,height:72,borderRadius:"50%",
              background:d===""?"transparent":T.surface,
              border:d===""?"none":`1px solid ${T.border}`,
              fontSize:d==="⌫"?20:22,fontWeight:500,color:T.text,
              cursor:d===""?"default":"pointer",fontFamily:"'DM Serif Display',serif"}}>
            {d}
          </button>
        ))}
      </div>

      <button onClick={onDone}
        style={{background:"transparent",border:"none",fontSize:12,color:T.textSub,cursor:"pointer"}}>
        Saltar (no usar PIN)
      </button>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({T, onLogin}) {
  // modo: "options" | "email" | "pin_login" | "register"
  const [modo, setModo] = useState("options");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [err, setErr] = useState("");
  const inp = {width:"100%",background:T.card,border:`1px solid ${T.border2}`,borderRadius:12,
    padding:"13px 16px",fontSize:15,color:T.text,fontFamily:"'DM Sans',sans-serif"};
  const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const handleEmail = async () => {
    setErr("");
    if(!email.trim()||!pass.trim()){setErr("Completa todos los campos.");return;}
    if(!emailValido(email)){setErr("Correo inválido. Ej: nombre@gmail.com");return;}
    const key = email.toLowerCase().trim();
    setErr("Verificando...");

    // Login con Supabase Auth
    const {data:authData, error:authError} = await sbSignIn(key, pass);
    if(authError){
      // Fallback para usuarios legacy (antes de Supabase Auth)
      const cloudUser = await findCloudUser(key);
      if(cloudUser && cloudUser.pass===pass){
        const users = getUsers();
        users[key]={id:cloudUser.id,name:cloudUser.name||key,email:key,pass};
        saveUsers(users);
        const data = await loadCloudData(cloudUser.id)||getUserData(cloudUser.id)||SEED_DATA();
        const s={id:cloudUser.id,name:cloudUser.name||key,email:key};
        saveSession(s); onLogin(s,data); return;
      }
      setErr("Correo o contraseña incorrectos.");return;
    }
    const authUser = authData.user;
    if(!authUser.email_confirmed_at){
      setErr("Debes confirmar tu correo antes de entrar. Revisa tu bandeja de entrada.");return;
    }
    // Cargar o crear datos de la app
    const userName = authUser.user_metadata?.name || key;
    const data = await loadCloudData(authUser.id) || SEED_DATA();
    const s={id:authUser.id, name:userName, email:key};
    // Sincronizar con sistema legacy
    const users = getUsers();
    users[key]={id:authUser.id,name:userName,email:key,pass};
    saveUsers(users);
    saveSession(s); onLogin(s,data);
  };

  const handleForgot = async () => {
    setForgotMsg("");
    if(!emailValido(forgotEmail)){setForgotMsg("Correo inválido.");return;}
    const {error} = await sbResetPassword(forgotEmail.toLowerCase().trim());
    if(error) setForgotMsg("Error al enviar. Verifica el correo.");
    else setForgotMsg("✓ Revisa tu correo para restablecer tu contraseña.");
  };

  const handleRegister = async () => {
    setErr("");
    if(!name.trim()||!email.trim()||!pass.trim()){setErr("Completa todos los campos.");return;}
    if(!emailValido(email)){setErr("Correo inválido. Ej: nombre@gmail.com");return;}
    if(pass.length<8){setErr("La contraseña debe tener al menos 8 caracteres.");return;}
    const key=email.toLowerCase().trim();
    setErr("Creando cuenta...");
    // Registrar con Supabase Auth
    const {data:authData, error:authError} = await sbSignUp(key, pass, name.trim());
    if(authError){
      if(authError.message.includes("already registered")) setErr("Ya existe una cuenta con ese correo.");
      else setErr(authError.message||"Error al crear la cuenta.");
      return;
    }
    setErr("");
    // Guardar datos iniciales en nuestra tabla user_data
    const authUser = authData.user;
    const seedData = SEED_DATA();
    await saveCloudUser(authUser.id, key, name.trim(), pass, seedData);
    // Guardar localmente también
    const users = getUsers();
    users[key]={id:authUser.id,name:name.trim(),email:key,pass};
    saveUsers(users); saveUserData(authUser.id, seedData);
    // Mostrar mensaje de confirmación en lugar de entrar directo
    setModo("confirm_email");
  };

  // Login por PIN: busca usuario con ese PIN
  const handlePinDigit = async (d) => {
    const next = pinInput+d;
    setPinInput(next);
    if(next.length===4){
      const users = getUsers();
      const found = Object.values(users).find(u=>getPin(u.id)===next);
      if(found){
        const sbData = await loadCloudData(found.id);
        const data = sbData || getUserData(found.id) || SEED_DATA(); if(sbData) saveUserData(found.id,sbData);
        const s={id:found.id,name:found.name,email:found.email};
        saveSession(s); onLogin(s,data);
      } else {
        setErr("PIN incorrecto");
        setTimeout(()=>{setPinInput("");setErr("");},1000);
      }
    }
  };

  // Face ID / biométrico
  const handleFaceId = async () => {
    setErr("");
    if(!window.PublicKeyCredential){setErr("Face ID no disponible en este dispositivo");return;}
    try {
      const users = getUsers();
      const allUsers = Object.values(users);
      // Buscar credencial guardada
      const credId = localStorage.getItem("fin_faceid_cred");
      if(!credId){setErr("No hay Face ID registrado. Inicia sesión con correo primero.");return;}
      const assertion = await navigator.credentials.get({
        publicKey:{
          challenge:new Uint8Array(32),
          allowCredentials:[{type:"public-key",id:Uint8Array.from(atob(credId),c=>c.charCodeAt(0))}],
          userVerification:"required",timeout:30000,
        }
      });
      const userId = localStorage.getItem("fin_faceid_user");
      const user = allUsers.find(u=>u.id===userId);
      if(user){
        const s={id:user.id,name:user.name,email:user.email};
        saveSession(s);
        const cloud = await loadCloudData(user.id);
        const data = cloud || getUserData(user.id) || SEED_DATA();
        if(cloud) saveUserData(user.id,cloud);
        onLogin(s,data);
      }
    } catch(e){
      if(e.name!=="NotAllowedError") setErr("Error al autenticar con Face ID");
    }
  };

  const back = ()=>{setModo("options");setErr("");setPinInput("");};

  const wrap = (children) => (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:24}}>
      <link href={FONTS} rel="stylesheet"/>
      <style>{makeCSS(T)}</style>
      <div className="fade-up" style={{marginBottom:32,textAlign:"center"}}>
        <div style={{fontSize:10,letterSpacing:5,color:T.textSub,textTransform:"uppercase",marginBottom:10}}>Finanzas personales</div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:34,color:T.text,fontWeight:400}}>
          Mi <em style={{color:T.accent}}>Capital</em>
        </h1>
      </div>
      {children}
      <p style={{fontSize:11,color:T.textSub,marginTop:20,textAlign:"center",lineHeight:1.6}}>
        Datos sincronizados con la nube · Cifrado y seguro
      </p>
    </div>
  );

  // ── Pantalla de opciones ──
  if(modo==="options") return wrap(
    <div className="fade-up" style={{width:"100%",maxWidth:340}}>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {/* Correo + contraseña */}
        <button onClick={()=>setModo("email")}
          style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,
            padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left"}}>
          <div style={{width:36,height:36,borderRadius:10,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke={T.textMid} strokeWidth="1.2"/><path d="M1.5 5.5L8 9.5L14.5 5.5" stroke={T.textMid} strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:500,color:T.text,fontFamily:"'DM Sans',sans-serif"}}>Correo y contraseña</div>
            <div style={{fontSize:11,color:T.textSub,marginTop:2}}>Inicia sesión con tu cuenta</div>
          </div>
          <svg style={{marginLeft:"auto"}} width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1L6 6L1 11" stroke={T.border2} strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>

        {/* PIN */}
        <button onClick={()=>setModo("pin_login")}
          style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,
            padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left"}}>
          <div style={{width:36,height:36,borderRadius:10,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke={T.textMid} strokeWidth="1.2"/><path d="M5 7V5a3 3 0 016 0v2" stroke={T.textMid} strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="10.5" r="1" fill={T.textMid}/></svg>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:500,color:T.text,fontFamily:"'DM Sans',sans-serif"}}>PIN</div>
            <div style={{fontSize:11,color:T.textSub,marginTop:2}}>Ingresa tus 4 dígitos</div>
          </div>
          <svg style={{marginLeft:"auto"}} width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1L6 6L1 11" stroke={T.border2} strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>

        {/* Face ID */}
        <button onClick={handleFaceId}
          style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,
            padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left"}}>
          <div style={{width:36,height:36,borderRadius:10,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 6V3.5A1.5 1.5 0 013.5 2H6" stroke={T.textMid} strokeWidth="1.2" strokeLinecap="round"/><path d="M16 6V3.5A1.5 1.5 0 0014.5 2H12" stroke={T.textMid} strokeWidth="1.2" strokeLinecap="round"/><path d="M2 12v2.5A1.5 1.5 0 003.5 16H6" stroke={T.textMid} strokeWidth="1.2" strokeLinecap="round"/><path d="M16 12v2.5A1.5 1.5 0 0114.5 16H12" stroke={T.textMid} strokeWidth="1.2" strokeLinecap="round"/><circle cx="6.5" cy="7.5" r="1" fill={T.textMid}/><circle cx="11.5" cy="7.5" r="1" fill={T.textMid}/><path d="M6.5 11.5c.5 1 4.5 1 5 0" stroke={T.textMid} strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:500,color:T.text,fontFamily:"'DM Sans',sans-serif"}}>Face ID</div>
            <div style={{fontSize:11,color:T.textSub,marginTop:2}}>Autenticación biométrica</div>
          </div>
          <svg style={{marginLeft:"auto"}} width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1L6 6L1 11" stroke={T.border2} strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      {err&&<div style={{fontSize:12,color:T.red,marginTop:12,textAlign:"center",background:T.redDim,borderRadius:8,padding:"8px 12px"}}>{err}</div>}

      <button onClick={()=>setModo("register")}
        style={{width:"100%",background:"transparent",border:"none",marginTop:20,
          fontSize:12,color:T.textSub,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
        ¿No tienes cuenta? <span style={{color:T.accent,fontWeight:600}}>Crear cuenta</span>
      </button>
    </div>
  );

  // ── Pantalla: olvidé contraseña ──
  if(showForgot) return wrap(
    <div className="fade-up" style={{width:"100%",maxWidth:380,background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,padding:24}}>
      <button onClick={()=>{setShowForgot(false);setForgotMsg("");}}
        style={{background:"transparent",border:"none",color:T.textSub,fontSize:12,
          cursor:"pointer",marginBottom:16,display:"flex",alignItems:"center",gap:5,padding:0}}>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Volver
      </button>
      <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:T.text,marginBottom:6}}>Recuperar contraseña</h3>
      <p style={{fontSize:13,color:T.textSub,marginBottom:18,lineHeight:1.6}}>
        Te enviaremos un link para restablecer tu contraseña.
      </p>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>CORREO</label>
        <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          onKeyDown={e=>e.key==="Enter"&&handleForgot()}
          style={{width:"100%",background:T.card,border:`1px solid ${T.border2}`,borderRadius:12,
            padding:"13px 16px",fontSize:15,color:T.text}}/>
      </div>
      {forgotMsg&&<div style={{fontSize:12,marginBottom:14,borderRadius:8,padding:"10px 12px",
        background:forgotMsg.startsWith("✓")?T.greenDim:T.redDim,
        color:forgotMsg.startsWith("✓")?T.green:T.red}}>{forgotMsg}</div>}
      <button onClick={handleForgot}
        style={{width:"100%",background:T.accent,border:"none",borderRadius:12,
          padding:"13px 0",fontSize:14,fontWeight:600,color:"#fff"}}>
        Enviar link de recuperación
      </button>
    </div>
  );

  // ── Login con correo ──
  if(modo==="email") return wrap(
    <div className="fade-up" style={{width:"100%",maxWidth:380,background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,padding:24}}>
      <button onClick={back} style={{background:"transparent",border:"none",color:T.textSub,
        fontSize:12,cursor:"pointer",marginBottom:16,display:"flex",alignItems:"center",gap:6,padding:0}}>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Volver
      </button>
      <div style={{fontSize:15,fontWeight:600,color:T.text,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>Correo y contraseña</div>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>CORREO</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com" style={inp}/>
      </div>
      <div style={{marginBottom:20}}>
        <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>CONTRASEÑA</label>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••"
          onKeyDown={e=>e.key==="Enter"&&handleEmail()} style={inp}/>
      </div>
      {err&&<div style={{fontSize:12,color:T.red,marginBottom:14,background:T.redDim,borderRadius:8,padding:"10px 12px"}}>{err}</div>}
      <button onClick={handleEmail} style={{width:"100%",background:T.accent,border:"none",borderRadius:12,
        padding:"14px 0",fontSize:14,fontWeight:600,color:"#fff",fontFamily:"'DM Sans',sans-serif"}}>
        Entrar
      </button>
      <button onClick={()=>{setShowForgot(true);setForgotEmail(email);}}
        style={{width:"100%",background:"transparent",border:"none",marginTop:12,
          fontSize:12,color:T.textSub,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
        ¿Olvidaste tu contraseña?
      </button>
    </div>
  );

  // ── Pantalla: confirmar email ──
  if(modo==="confirm_email") return wrap(
    <div className="fade-up" style={{width:"100%",maxWidth:380,background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,padding:28,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>📧</div>
      <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:T.text,marginBottom:10}}>Confirma tu correo</h3>
      <p style={{fontSize:13,color:T.textSub,lineHeight:1.7,marginBottom:20}}>
        Te enviamos un email a <strong>{email}</strong>.<br/>
        Haz clic en el link para activar tu cuenta.
      </p>
      <div style={{fontSize:12,color:T.textSub,background:T.card,borderRadius:10,padding:"10px 14px",marginBottom:20}}>
        ¿No lo ves? Revisa tu carpeta de spam.
      </div>
      <button onClick={()=>setModo("email")}
        style={{width:"100%",background:T.accent,border:"none",borderRadius:12,
          padding:"13px 0",fontSize:14,fontWeight:600,color:"#fff"}}>
        Ya confirmé, iniciar sesión
      </button>
    </div>
  );

  // ── Login con PIN ──
  if(modo==="pin_login") return wrap(
    <div className="fade-up" style={{width:"100%",maxWidth:300,textAlign:"center"}}>
      <button onClick={back} style={{background:"transparent",border:"none",color:T.textSub,
        fontSize:12,cursor:"pointer",marginBottom:20,display:"flex",alignItems:"center",gap:6,padding:0}}>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Volver
      </button>
      <div style={{fontSize:13,color:T.textSub,marginBottom:24,fontFamily:"'DM Sans',sans-serif"}}>Ingresa tu PIN de 4 dígitos</div>
      {/* Puntos */}
      <div style={{display:"flex",gap:16,justifyContent:"center",marginBottom:32}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:14,height:14,borderRadius:"50%",
            background:pinInput.length>i?T.accent:T.border,transition:"background .15s"}}/>
        ))}
      </div>
      {err&&<div style={{fontSize:12,color:T.red,marginBottom:16}}>{err}</div>}
      {/* Teclado */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:240,margin:"0 auto"}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
          <button key={i}
            onClick={()=>d==="⌫"?setPinInput(p=>p.slice(0,-1)):d!==""&&pinInput.length<4&&handlePinDigit(String(d))}
            style={{height:64,borderRadius:14,background:d===""?"transparent":T.surface,
              border:d===""?"none":`1px solid ${T.border}`,fontSize:d==="⌫"?16:22,
              color:T.text,cursor:d===""?"default":"pointer",fontFamily:"'DM Serif Display',serif"}}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Registro ──
  return wrap(
    <div className="fade-up" style={{width:"100%",maxWidth:380,background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,padding:24}}>
      <button onClick={back} style={{background:"transparent",border:"none",color:T.textSub,
        fontSize:12,cursor:"pointer",marginBottom:16,display:"flex",alignItems:"center",gap:6,padding:0}}>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Volver
      </button>
      <div style={{fontSize:15,fontWeight:600,color:T.text,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>Crear cuenta</div>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>NOMBRE</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={inp}/>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>CORREO</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com" style={inp}/>
      </div>
      <div style={{marginBottom:20}}>
        <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>CONTRASEÑA</label>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••"
          onKeyDown={e=>e.key==="Enter"&&handleRegister()} style={inp}/>
      </div>
      {err&&<div style={{fontSize:12,color:T.red,marginBottom:14,background:T.redDim,borderRadius:8,padding:"10px 12px"}}>{err}</div>}
      <button onClick={handleRegister} style={{width:"100%",background:T.accent,border:"none",borderRadius:12,
        padding:"14px 0",fontSize:14,fontWeight:600,color:"#fff",fontFamily:"'DM Sans',sans-serif"}}>
        Crear cuenta
      </button>
    </div>
  );
}

// ─── ITEM ROW ─────────────────────────────────────────────────────────────────
function ItemRow({T, item, valueColor, showPaid=false, onEdit, onDelete, onToggle}) {
  const vc = valueColor || T.gold;
  return (
    <div className="fade-up" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
      padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:19,flexShrink:0,width:28,textAlign:"center"}}>{item.icon||"·"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.nombre}</div>
        {showPaid&&<div style={{marginTop:3,display:"flex",alignItems:"center",gap:5}}>
          <StatusDot active={item.pagado} T={T}/>
          <span style={{fontSize:10,color:T.textSub}}>{item.pagado?"Pagado":"Pendiente"}</span>
        </div>}
      </div>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:15,color:vc,flexShrink:0}}>{fmt(item.monto)}</div>
      {showPaid&&<button onClick={onToggle} style={{background:"transparent",border:`1px solid ${T.border}`,
        borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}>
          {item.pagado
            ? <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M3 5H8M3 5L5 3M3 5L5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><polyline points="2,6 4.5,8.5 9,3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          }
        </button>}
      <button onClick={onEdit} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 1.5L9.5 3.5L3.5 9.5H1.5V7.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      <button onClick={onDelete} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="2" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="9" y1="2" x2="2" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
    </div>
  );
}

// ─── SERVICE TILE ─────────────────────────────────────────────────────────────
function ServiceTile({T, item, onEdit, onDelete, onToggle}) {
  return (
    <div className="fade-up" style={{background:T.card,border:`1px solid ${item.pagado?T.green:T.border}`,borderRadius:12,padding:14,position:"relative",overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <span style={{fontSize:22}}>{item.icon||"·"}</span>
        <div style={{display:"flex",gap:4}}>
          <button onClick={onEdit} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"4px 8px",fontSize:11,color:T.textSub}}><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 1.5L9.5 3.5L3.5 9.5H1.5V7.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button onClick={onDelete} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"4px 8px",fontSize:11,color:T.textSub}}><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="2" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="9" y1="2" x2="2" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
        </div>
      </div>
      <div style={{fontSize:12,fontWeight:500,color:T.textMid,marginBottom:3}}>{item.nombre}</div>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:T.accent,marginBottom:10}}>{fmt(item.monto)}</div>
      <button onClick={onToggle} style={{width:"100%",background:item.pagado?T.greenDim:"transparent",
        border:`1px solid ${item.pagado?T.green:T.border2}`,borderRadius:8,padding:"8px 0",
        fontSize:12,fontWeight:500,color:item.pagado?T.green:T.textSub}}>
        {item.pagado?"↩ Revertir":"✓ Marcar pagado"}
      </button>
    </div>
  );
}

// ─── CREDIT CARD ─────────────────────────────────────────────────────────────
function CreditCard({T, t, onEdit, onDelete, onToggle, onAddCharge, onSetCorte}) {
  const pct = Math.min(100,Math.round((t.saldo/(t.limite||1))*100));
  const barC = pct>80?T.red:pct>50?T.amber:T.green;
  const hoy = new Date();
  let cd = new Date(hoy.getFullYear(),hoy.getMonth(),t.corte);
  if(cd<=hoy) cd=new Date(hoy.getFullYear(),hoy.getMonth()+1,t.corte);
  const dias = Math.ceil((cd-hoy)/(1000*60*60*24));
  const cortePendiente = t.saldoCorte===null||t.saldoCorte===undefined;
  return (
    <div className="fade-up" style={{background:T.card,border:`1px solid ${t.pagado?T.green:cortePendiente?T.amber:T.border}`,borderRadius:14,
      padding:"16px 16px 14px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:t.color||T.accent}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontSize:14,fontWeight:500,color:T.text}}>{t.nombre}</div>
          <div style={{fontSize:11,color:T.textSub,marginTop:3,display:"flex",gap:8,alignItems:"center"}}>
            <span>{t.banco}</span>
            <Badge T={T} color={dias<=5?T.red:T.blue} border={dias<=5?T.red:T.border2}>✂ Corte en {dias}d</Badge>
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          <button onClick={onEdit} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 1.5L9.5 3.5L3.5 9.5H1.5V7.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button onClick={onDelete} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="2" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="9" y1="2" x2="2" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
        </div>
      </div>
      {cortePendiente&&(
        <div style={{background:T.amberDim,border:`1px solid ${T.amber}44`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:11,color:T.amber,fontWeight:600,marginBottom:6}}>⚠️ Introduce el saldo a corte de este mes</div>
          <div style={{fontSize:11,color:T.amber,marginBottom:10,opacity:.8}}>Al iniciar el nuevo mes necesitas registrar cuánto debes pagar en este corte.</div>
          <button onClick={onSetCorte} style={{width:"100%",background:T.amber,border:"none",borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:600,color:"#fff"}}>
            Registrar saldo al corte
          </button>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:9,color:T.textSub,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Crédito usado</div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:t.color||T.accent}}>{fmt(t.saldo)}</div>
          <div style={{fontSize:10,color:T.textSub,marginTop:2}}>{pct}% del límite</div>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:9,color:T.textSub,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Pago de corte</div>
          {cortePendiente
            ? <div style={{fontSize:12,color:T.amber,fontStyle:"italic",marginTop:4}}>Por definir</div>
            : <>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:t.pagado?T.green:T.textMid}}>
                  {t.pagado?"✓ Pagado":fmt(t.saldoCorte)}
                </div>
                {t.pagado&&<div style={{fontSize:10,color:T.textSub,marginTop:2}}>Saldo corte descontado</div>}
              </>
          }
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{height:3,borderRadius:99,background:T.border,overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:barC,transition:"width .6s ease"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={onAddCharge} style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,
          borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:500,color:T.textMid}}>+ Cargo</button>
        {!cortePendiente&&(
          <button onClick={onToggle} style={{flex:2,background:t.pagado?T.greenDim:"transparent",
            border:`1px solid ${t.pagado?T.green:T.border2}`,borderRadius:8,padding:"9px 0",
            fontSize:12,fontWeight:600,color:t.pagado?T.green:T.textSub}}>
            {t.pagado?"✓ Pagado":"Pagar corte"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── VAR ROW ─────────────────────────────────────────────────────────────────
function VarRow({T, item, onDelete, onEdit}) {
  return (
    <div className="fade-up" style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
      padding:"11px 14px",display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:18,flexShrink:0,width:26,textAlign:"center"}}>{item.categoria?.split(" ")[0]||"·"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.nombre}</div>
        <div style={{fontSize:10,color:T.textSub,marginTop:2,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <span>{item.categoria?.split(" ").slice(1).join(" ")||"—"}</span>
          <span style={{color:T.border2}}>·</span>
          <span>{item.fecha||"—"}</span>
          {item.tarjetaNombre&&(
            <span style={{background:T.accentDim,color:T.accent,borderRadius:4,padding:"1px 5px",fontSize:9,fontWeight:500}}>
              💳 {item.tarjetaNombre}
            </span>
          )}
        </div>
        {item.nota&&<div style={{fontSize:10,color:T.textSub,marginTop:2,fontStyle:"italic"}}>{item.nota}</div>}
      </div>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:14,color:T.red,flexShrink:0}}>{fmt(item.monto)}</div>
      <button onClick={onEdit} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 1.5L9.5 3.5L3.5 9.5H1.5V7.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      <button onClick={onDelete} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="2" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="9" y1="2" x2="2" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SecHead({T, title, total, color, count, onAdd, addLabel, sub}) {
  const c = color || T.gold;
  return (
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:16}}>
      <div>
        <div style={{fontSize:10,color:T.textSub,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>
          {title}{count!==undefined?` · ${count}`:""}
        </div>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:c}}>{sub||fmt(total||0)}</div>
      </div>
      {onAdd&&<button onClick={onAdd} style={{background:"transparent",border:`1px solid ${T.border2}`,
        borderRadius:9,padding:"8px 14px",fontSize:12,fontWeight:500,color:T.textMid}}>
        + {addLabel||"Agregar"}
      </button>}
    </div>
  );
}

// ─── BALANCE CARD ─────────────────────────────────────────────────────────────
function BalanceCard({T, totalIngresos, balanceReal, balanceProyectado, pendienteTotal, egresosReales, egresosProyectados, saldoArrastre}) {
  const [v, setV] = useState("real");
  const isReal = v==="real";
  const bal = isReal ? balanceReal : balanceProyectado;
  const eg  = isReal ? egresosReales : egresosProyectados;
  const pos = bal>=0;
  const pct = Math.min(100,Math.max(0,totalIngresos>0?(eg/totalIngresos)*100:0));
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border2}`,borderRadius:18,padding:"22px 20px 20px",marginBottom:4}}>
      {/* Toggle */}
      <div style={{display:"flex",background:T.bg,borderRadius:10,padding:3,marginBottom:24,gap:2}}>
        {[["real","Balance actual"],["proj","Si pago todo"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setV(id)} style={{flex:1,background:v===id?T.surface:"transparent",
            border:v===id?`1px solid ${T.border}`:"1px solid transparent",borderRadius:8,padding:"9px 0",
            fontSize:13,fontWeight:v===id?600:400,color:v===id?T.text:T.textSub,transition:"all .2s",
            fontFamily:"'DM Sans',sans-serif"}}>
            {lbl}
          </button>
        ))}
      </div>
      {/* Label */}
      <div style={{fontSize:10,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:8,textAlign:"center"}}>
        {isReal?"Disponible ahora":"Si pagas todo"}
      </div>
      {/* Balance — centrado y grande */}
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:62,lineHeight:1,
        color:pos?T.green:T.red,letterSpacing:"-2px",marginBottom:20,
        textAlign:"center",fontWeight:400}}>
        {fmt(bal)}
      </div>
      {/* Pendiente */}
      {isReal&&pendienteTotal>0&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:T.amberDim,
          borderRadius:8,padding:"8px 14px",marginBottom:16}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.5" stroke={T.amber} strokeWidth="1"/>
            <line x1="6" y1="3" x2="6" y2="6.5" stroke={T.amber} strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="6" cy="8.5" r="0.75" fill={T.amber}/>
          </svg>
          <span style={{fontSize:12,color:T.amber,fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>
            Pendiente por pagar: <strong>{fmt(pendienteTotal)}</strong>
          </span>
        </div>
      )}
      {/* Barra progreso */}
      <div style={{height:2,borderRadius:99,background:T.border,overflow:"hidden",marginBottom:12}}>
        <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:pos?T.accent:T.red,transition:"width .6s ease"}}/>
      </div>
      {/* Footer stats — misma tipografía, mismo tamaño */}
      <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.textSub,marginBottom:saldoArrastre!==0?0:0}}>
        <span>Ingresos <span style={{color:T.green,fontWeight:600}}>{fmt(totalIngresos)}</span></span>
        <span>Egresos <span style={{color:T.red,fontWeight:600}}>{fmt(eg)}</span></span>
      </div>
      {isReal&&saldoArrastre!==0&&(
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`,
          fontFamily:"'DM Sans',sans-serif",fontSize:12}}>
          <span style={{color:T.textSub}}>
            {saldoArrastre>0?"Saldo anterior":"Déficit anterior"}
          </span>
          <span style={{fontWeight:600,color:saldoArrastre>0?T.green:T.red}}>
            {saldoArrastre>0?"+":""}{fmt(saldoArrastre)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── SUMMARY CARD ─────────────────────────────────────────────────────────────
function SummaryCard({T, icon, label, value, color, sub, onClick}) {
  return (
    <button className="summary-card" onClick={onClick}
      style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,
        padding:"16px 14px",textAlign:"left",cursor:"pointer",width:"100%"}}>
      <div style={{fontSize:26,marginBottom:10,lineHeight:1}}>{icon}</div>
      <div style={{fontSize:9,color:T.textSub,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{label}</div>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:19,color:color,marginBottom:4}}>{fmt(value)}</div>
      <div style={{fontSize:10,color:T.textSub}}>{sub}</div>
    </button>
  );
}

// ─── PENDING ALERT ────────────────────────────────────────────────────────────
function PendingAlert({T, items}) {
  return (
    <div style={{background:T.surface,border:`1.5px solid ${T.amber}44`,borderRadius:14,overflow:"hidden"}}>
      <div style={{background:`linear-gradient(135deg,${T.amberDim},${T.amberDim}88)`,padding:"12px 16px",
        display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${T.amber}33`}}>
        <span style={{fontSize:18}}>⚠️</span>
        <div>
          <div style={{fontSize:10,fontWeight:600,color:T.amber,letterSpacing:1,textTransform:"uppercase"}}>Pagos pendientes</div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:T.amber}}>
            {fmt(items.reduce((s,x)=>s+(x.monto||0),0))}
          </div>
        </div>
      </div>
      <div style={{padding:"4px 0"}}>
        {items.map((item,i)=>(
          <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"10px 16px",borderBottom:i<items.length-1?`1px solid ${T.border}`:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:16}}>{item.icon||"▣"}</span>
              <span style={{fontSize:13,color:T.textMid,fontWeight:400}}>{item.nombre}</span>
            </div>
            <span style={{fontSize:13,fontWeight:600,color:T.amber,fontFamily:"'DM Serif Display',serif"}}>
              {fmt(item.monto||0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MODAL CONFIGS ────────────────────────────────────────────────────────────
function mCfg(s) {
  const base = [{key:"icon",label:"Emoji",ph:"💰"},{key:"nombre",label:"Nombre",req:true,ph:"Ej. Netflix"},{key:"monto",label:"Monto ($)",type:"number",req:true,ph:"0"}];
  if(s==="ingresos") return {fields:base,title:"Nuevo ingreso",editTitle:"Editar ingreso"};
  if(s==="gastos")   return {fields:base,title:"Nuevo gasto fijo",editTitle:"Editar gasto"};
  if(s==="servicios")return {fields:base,title:"Nuevo servicio",editTitle:"Editar servicio"};
  if(s==="variables")return {fields:[
    {key:"nombre",label:"Descripción",req:true,ph:"Ej. Almuerzo"},
    {key:"monto",label:"Monto ($)",type:"number",req:true,ph:"0"},
    {key:"categoria",label:"Categoría",type:"select",opts:CATS},
    {key:"metodo",label:"Método",type:"select",opts:METODOS},
    {key:"fecha",label:"Fecha",type:"date",ph:hoyStr()},
    {key:"nota",label:"Nota",ph:"Opcional"},
  ],title:"Gasto variable",editTitle:"Editar gasto"};
  if(s==="tarjetas") return {fields:[
    {key:"nombre",label:"Nombre",req:true,ph:"Visa Oro"},
    {key:"banco",label:"Banco",ph:"BBVA"},
    {key:"limite",label:"Límite ($)",type:"number",req:true,ph:"0"},
    {key:"saldo",label:"Crédito usado ($)",type:"number",ph:"0"},
    {key:"saldoCorte",label:"Saldo a corte ($)",type:"number",ph:"0"},
    {key:"corte",label:"Día de corte",type:"number",ph:"1"},
    {key:"color",label:"Color de la tarjeta",type:"colorpicker"},
  ],title:"Nueva tarjeta",editTitle:"Editar tarjeta"};
  if(s==="cargo") return {fields:[
    {key:"descripcion",label:"Descripción",req:true,ph:"Ej. Cena restaurante"},
    {key:"monto",label:"Monto ($)",type:"number",req:true,ph:"0"},
    {key:"categoria",label:"Categoría",type:"select",opts:CATS},
    {key:"fecha",label:"Fecha",type:"date",ph:hoyStr()},
    {key:"nota",label:"Nota",ph:"Opcional"},
  ],title:"Agregar cargo a tarjeta"};
}


// ─── EXPORT HELPERS ──────────────────────────────────────────────────────────
const exportCSV = (data) => {
  const q = v => '"'+String(v===null||v===undefined?"":v).replace(/"/g,'""')+'"';
  const rows = [];
  rows.push(["#SECCION","Ingresos"]);
  rows.push(["Tipo","Icono","Nombre","Monto","Pagado","Banco","Limite","SaldoCorte","Categoria","Fecha","Nota"]);
  (data.ingresos||[]).forEach(x=>rows.push(["Ingreso",x.icon||"",x.nombre,x.monto,x.pagado?"Si":"No","","","",x.categoria||"",x.fecha||"",x.nota||""]));
  rows.push(["#SECCION","Gastos Fijos"]);
  rows.push(["Tipo","Icono","Nombre","Monto","Pagado","Banco","Limite","SaldoCorte","Categoria","Fecha","Nota"]);
  (data.gastos||[]).forEach(x=>rows.push(["Gasto fijo",x.icon||"",x.nombre,x.monto,x.pagado?"Si":"No","","","",x.categoria||"",x.fecha||"",x.nota||""]));
  rows.push(["#SECCION","Servicios"]);
  rows.push(["Tipo","Icono","Nombre","Monto","Pagado","Banco","Limite","SaldoCorte","Categoria","Fecha","Nota"]);
  (data.servicios||[]).forEach(x=>rows.push(["Servicio",x.icon||"",x.nombre,x.monto,x.pagado?"Si":"No","","","",x.categoria||"",x.fecha||"",x.nota||""]));
  rows.push(["#SECCION","Variables"]);
  rows.push(["Tipo","Icono","Nombre","Monto","Pagado","Banco","Limite","SaldoCorte","Categoria","Fecha","Nota"]);
  (data.variables||[]).forEach(x=>rows.push(["Variable",x.icon||"",x.nombre,x.monto,"","","","",x.categoria||"",x.fecha||"",x.nota||""]));
  rows.push(["#SECCION","Tarjetas"]);
  rows.push(["Tipo","Icono","Nombre","Monto","Pagado","Banco","Limite","SaldoCorte","Categoria","Fecha","Nota"]);
  (data.tarjetas||[]).forEach(x=>rows.push(["Tarjeta",x.icon||"",x.nombre,x.saldo,x.pagado?"Si":"No",x.banco||"",x.limite||0,x.saldoCorte||0,"",x.corte||"",""]));
  rows.push(["#SECCION","Historial"]);
  rows.push(["Mes","Ingresos","GastosFijos","Servicios","Variables","Tarjetas","EgresosReales","BalanceReal","BalanceProyectado","SaldoArrastre"]);
  (data.historial||[]).forEach(h=>rows.push([h.mes,h.ingresos,h.gastosFijos,h.servicios,h.variables,h.tarjetas,h.egresosReales,h.balanceReal,h.balanceProyectado,h.saldoArrastre||0]));
  rows.push(["#SECCION","Ahorro"]);
  rows.push(["Ahorro","MetaAhorro","SaldoArrastre"]);
  rows.push([data.ahorro||0,data.metaAhorro||0,data.saldoArrastre||0]);
  const csv = rows.map(r=>r.map(q).join(",")).join("\n");
  const blob = new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mi-capital-"+new Date().toISOString().slice(0,10)+".csv";
  a.click();
}
const exportJSON = (data) => {
  const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mi-capital-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
};

// ─── IMPORT HELPERS ──────────────────────────────────────────────────────────
const parseCsvLine = (line) => {
  const cols=[]; let cur="", inQ=false;
  line = line.replace(/\r$/,"");
  for(let i=0;i<line.length;i++){
    if(line[i]==='"'&&!inQ){ inQ=true; }
    else if(line[i]==='"'&&inQ&&line[i+1]==='"'){ cur+='"'; i++; }
    else if(line[i]==='"'&&inQ){ inQ=false; }
    else if(line[i]===','&&!inQ){ cols.push(cur); cur=""; }
    else { cur+=line[i]; }
  }
  cols.push(cur);
  return cols;
};
const parseImportFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = e => {
    let text = e.target.result.replace(/^\uFEFF/,"");
    const ext = file.name.split(".").pop().toLowerCase();
    if(ext==="json") {
      try {
        const parsed = JSON.parse(text);
        if(parsed && typeof parsed==="object" && ("ingresos" in parsed || "gastos" in parsed)){
          resolve({type:"json", data:parsed});
        } else { reject("El archivo JSON no tiene el formato correcto de Mi Capital."); }
      } catch(e){ reject("El archivo JSON esta danado o no es valido."); }
    } else if(ext==="csv") {
      try {
        const lines = text.split("\n").filter(l=>l.trim());
        const sections=[]; let currentHeader=null, currentRows=[], currentLabel="";
        for(const line of lines){
          const cols = parseCsvLine(line);
          const first = cols[0]||"";
          if(first==="#SECCION"){ currentLabel=cols[1]||""; continue; }
          const isHeader = ["Tipo","Mes","Ahorro"].includes(first);
          if(isHeader){
            if(currentHeader&&currentRows.length>0) sections.push({label:currentLabel,header:currentHeader,rows:currentRows});
            currentHeader=cols; currentRows=[];
          } else if(currentHeader&&first){
            const obj={};
            currentHeader.forEach((h,i)=>{ obj[h]=cols[i]||""; });
            currentRows.push(obj);
          }
        }
        if(currentHeader&&currentRows.length>0) sections.push({label:currentLabel,header:currentHeader,rows:currentRows});
        const allRows = sections.flatMap(s=>s.rows);
        resolve({type:"csv", rows:allRows, sections});
      } catch(e){ reject("El archivo CSV esta danado o no es valido."); }
    } else { reject("Formato no soportado. Usa .json o .csv"); }
  };
  reader.onerror = () => reject("Error al leer el archivo.");
  reader.readAsText(file,"UTF-8");
});
// ─── IMPORT MODAL ─────────────────────────────────────────────────────────────
function ImportModal({T, importing, onConfirm, onCancel}) {
  const {type, data, rows} = importing;
  const isJson = type==='json';

  // Preview de lo que se va a importar
  const preview = isJson ? [
    {label:"Ingresos",         count: data.ingresos?.length||0},
    {label:"Gastos fijos",     count: data.gastos?.length||0},
    {label:"Servicios",        count: data.servicios?.length||0},
    {label:"Variables",        count: data.variables?.length||0},
    {label:"Tarjetas",         count: data.tarjetas?.length||0},
    {label:"Meses historial",  count: data.historial?.length||0},
    {label:"Ahorro",           count: data.ahorro>0?1:0},
  ] : [
    {label:"Ingresos",     count: rows?.filter(r=>r.Tipo==="Ingreso").length||0},
    {label:"Gastos fijos", count: rows?.filter(r=>r.Tipo==="Gasto fijo").length||0},
    {label:"Servicios",    count: rows?.filter(r=>r.Tipo==="Servicio").length||0},
    {label:"Variables",    count: rows?.filter(r=>r.Tipo==="Variable").length||0},
    {label:"Tarjetas",     count: rows?.filter(r=>r.Tipo==="Tarjeta").length||0},
    {label:"Meses historial", count: rows?.filter(r=>r.Mes).length||0},
  ];

  return (
    <>
      <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:40}}/>
      <div className="fade-up" style={{
        position:"fixed",left:0,right:0,bottom:0,zIndex:50,
        background:T.surface,borderRadius:"18px 18px 0 0",
        border:`1px solid ${T.border}`,padding:"20px 18px 36px",
        maxWidth:520,margin:"0 auto",maxHeight:"80vh",overflowY:"auto",
        boxShadow:"0 -8px 32px rgba(0,0,0,.2)"}}>
        <div style={{width:36,height:3,borderRadius:2,background:T.border2,margin:"0 auto 18px"}}/>
        <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:T.text,marginBottom:6}}>
          {isJson ? "Restaurar datos" : "Importar CSV"}
        </h3>
        <p style={{fontSize:12,color:T.textSub,marginBottom:18,lineHeight:1.6}}>
          {isJson
            ? "⚠️ Esto reemplazará TODOS tus datos actuales con los del archivo. Esta acción no se puede deshacer."
            : "Se agregarán las transacciones del CSV a tus datos actuales sin borrar nada."}
        </p>

        {/* Preview */}
        <div style={{background:T.card,borderRadius:12,padding:"12px 14px",marginBottom:18}}>
          {preview.filter(p=>p.count>0).map((p,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",
              padding:"6px 0",borderBottom:i<preview.length-1?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:13,color:T.textMid}}>{p.label}</span>
              <span style={{fontSize:13,fontWeight:600,color:T.text}}>{p.count}</span>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:8}}>
          <button onClick={onCancel}
            style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,
              borderRadius:10,padding:"12px 0",fontSize:13,color:T.textMid}}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            style={{flex:2,background:isJson?T.red:T.accent,border:"none",
              borderRadius:10,padding:"12px 0",fontSize:13,fontWeight:600,color:"#fff"}}>
            {isJson?"Sí, restaurar todo":"Importar transacciones"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── VARS TAB (con búsqueda, orden y editar) ──────────────────────────────────
function VarsTab({T, data, V, onAdd, onEdit, onDelete}) {
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("cat"); // "cat" | "monto" | "fecha"

  const CATS_LOCAL = ["🍔 Comida","⛽ Gasolina","👕 Ropa","🎬 Entretenimiento","🏥 Salud","✈ Viajes","🛒 Super","🏠 Hogar","📱 Tecnología","🎓 Educación","💊 Farmacia","🐾 Mascotas"];

  const filtrados = data.variables.filter(x=>
    !busqueda.trim() ||
    x.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    x.categoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
    x.nota?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const ordenados = [...filtrados].sort((a,b)=>{
    if(orden==="monto") return b.monto-a.monto;
    if(orden==="fecha") return (b.fecha||"").localeCompare(a.fecha||"");
    return (a.categoria||"").localeCompare(b.categoria||"");
  });

  return (
    <div className="fade-in">
      <SecHead T={T} title="Gastos variables" total={V} color={T.red} count={data.variables.length} onAdd={onAdd} addLabel="Gasto"/>

      {/* Búsqueda */}
      <div style={{position:"relative",marginBottom:10}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:T.textSub}}>🔍</span>
        <input placeholder="Buscar gasto..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}
          style={{width:"100%",background:T.card,border:`1px solid ${T.border2}`,borderRadius:10,
            padding:"10px 12px 10px 36px",fontSize:14,color:T.text,boxSizing:"border-box"}}/>
        {busqueda&&<button onClick={()=>setBusqueda("")}
          style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
            background:"transparent",border:"none",fontSize:14,color:T.textSub,cursor:"pointer"}}><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="2" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="9" y1="2" x2="2" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>}
      </div>

      {/* Orden */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["cat","Categoría"],["monto","Mayor monto"],["fecha","Más reciente"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setOrden(id)}
            style={{background:orden===id?T.accent:T.card,border:`1px solid ${orden===id?T.accent:T.border}`,
              borderRadius:99,padding:"5px 12px",fontSize:11,fontWeight:orden===id?600:400,
              color:orden===id?"#fff":T.textSub,transition:"all .18s"}}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Lista */}
      {orden==="cat"&&!busqueda ? (
        <>
          {CATS_LOCAL.map(cat=>{
            const items=ordenados.filter(x=>x.categoria===cat);
            if(!items.length) return null;
            return (
              <div key={cat} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",padding:"0 2px",marginBottom:7}}>
                  <span style={{fontSize:11,color:T.textSub,letterSpacing:.5}}>{cat}</span>
                  <span style={{fontSize:11,color:T.red,fontWeight:500}}>{fmt(items.reduce((s,x)=>s+x.monto,0))}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {items.map(item=><VarRow key={item.id} T={T} item={item}
                    onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item.id,item.nombre)}/>)}
                </div>
              </div>
            );
          })}
          {ordenados.filter(x=>!CATS_LOCAL.includes(x.categoria)).map(item=>(
            <VarRow key={item.id} T={T} item={item}
              onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item.id,item.nombre)}/>
          ))}
        </>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {ordenados.map(item=><VarRow key={item.id} T={T} item={item}
            onEdit={()=>onEdit(item)} onDelete={()=>onDelete(item.id,item.nombre)}/>)}
        </div>
      )}

      {!data.variables.length&&<div style={{textAlign:"center",padding:"32px 0",color:T.textSub,fontSize:13}}>Sin gastos variables este mes</div>}
      {data.variables.length>0&&busqueda&&!filtrados.length&&(
        <div style={{textAlign:"center",padding:"24px 0",color:T.textSub,fontSize:13}}>Sin resultados para "{busqueda}"</div>
      )}
    </div>
  );
}

// ─── TENDENCIA MENSUAL (Historial) ───────────────────────────────────────────
function TendenciaChart({T, historial}) {
  if(historial.length<2) return null;
  const meses = [...historial].reverse().slice(-6); // últimos 6 meses
  const maxAbs = Math.max(...meses.map(h=>Math.abs(h.balanceReal)),1);
  const W=100/meses.length;
  return (
    <div style={{marginTop:14}}>
      <div style={{fontSize:9,color:T.textSub,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>
        Tendencia balance real
      </div>
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height:60}}>
        {meses.map((h,i)=>{
          const pct=Math.abs(h.balanceReal)/maxAbs;
          const pos=h.balanceReal>=0;
          return (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{width:"100%",height:Math.max(4,pct*50),borderRadius:"3px 3px 0 0",
                background:pos?T.green:T.red,opacity:.85}}/>
              <div style={{fontSize:8,color:T.textSub,textAlign:"center",lineHeight:1}}>
                {h.mes.slice(0,3)}
              </div>
            </div>
          );
        })}
      </div>
      {/* Mejor y peor mes */}
      {(()=>{
        const mejor=historial.reduce((a,b)=>a.balanceReal>b.balanceReal?a:b);
        const peor=historial.reduce((a,b)=>a.balanceReal<b.balanceReal?a:b);
        return (
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <div style={{flex:1,background:T.greenDim,borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:T.green,fontWeight:600,marginBottom:2}}>🏆 Mejor mes</div>
              <div style={{fontSize:11,color:T.text,fontWeight:500}}>{mejor.mes}</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:13,color:T.green}}>{fmt(mejor.balanceReal)}</div>
            </div>
            <div style={{flex:1,background:T.redDim,borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:T.red,fontWeight:600,marginBottom:2}}>📉 Peor mes</div>
              <div style={{fontSize:11,color:T.text,fontWeight:500}}>{peor.mes}</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:13,color:T.red}}>{fmt(peor.balanceReal)}</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── AHORRO SECTION ──────────────────────────────────────────────────────────
function AhorroSection({T, ahorro, disponible, meta, onMover, onRetirar, onSetMeta}) {
  const [monto, setMonto] = useState("");
  const [modo, setModo] = useState("mover");
  const [editMeta, setEditMeta] = useState(false);
  const [metaInput, setMetaInput] = useState(String(meta||""));
  const val = Number(monto)||0;
  const maxMover = Math.max(0, disponible);
  const maxRetirar = ahorro;
  const canSubmit = modo==="mover" ? val>0&&val<=maxMover : val>0&&val<=maxRetirar;
  const pctMeta = meta>0 ? Math.min(100,(ahorro/meta)*100) : 0;

  const handle = () => {
    if(!canSubmit) return;
    if(modo==="mover") onMover(val);
    else onRetirar(val);
    setMonto("");
  };

  return (
    <div style={{background:T.surface,border:`1px solid ${T.border2}`,borderRadius:18,padding:"20px 20px 18px"}}>
      {/* Número grande */}
      <div style={{fontSize:9,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>
        Total ahorrado
      </div>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:52,lineHeight:1,
        color:ahorro>0?T.green:T.textSub,letterSpacing:"-1px",marginBottom:14}}>
        {fmt(ahorro)}
      </div>

      {/* Meta de ahorro */}
      {!editMeta ? (
        <div style={{marginBottom:14}}>
          {meta>0 ? (
            <>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textSub,marginBottom:6}}>
                <span>Meta: <span style={{color:T.green,fontWeight:500}}>{fmt(meta)}</span></span>
                <span style={{color:T.green,fontWeight:600}}>{Math.round(pctMeta)}%</span>
              </div>
              <div style={{height:6,borderRadius:99,background:T.border,overflow:"hidden",marginBottom:4}}>
                <div style={{width:`${pctMeta}%`,height:"100%",borderRadius:99,
                  background:pctMeta>=100?T.amber:T.green,transition:"width .6s ease"}}/>
              </div>
              {pctMeta>=100&&<div style={{fontSize:11,color:T.amber,fontWeight:600,marginTop:4}}>🎉 ¡Meta alcanzada!</div>}
            </>
          ) : (
            <div style={{fontSize:11,color:T.textSub}}>Sin meta definida</div>
          )}
          <button onClick={()=>{setEditMeta(true);setMetaInput(String(meta||""));}}
            style={{background:"transparent",border:"none",fontSize:11,color:T.accent,marginTop:4,cursor:"pointer",padding:0}}>
            {meta>0?"✎ Cambiar meta":"+ Definir meta de ahorro"}
          </button>
        </div>
      ) : (
        <div style={{marginBottom:14,display:"flex",gap:8}}>
          <input type="number" placeholder="Meta ($)" value={metaInput}
            onChange={e=>setMetaInput(e.target.value)} autoFocus
            style={{flex:1,background:T.card,border:`1px solid ${T.border2}`,borderRadius:8,
              padding:"9px 12px",fontSize:14,color:T.text}}/>
          <button onClick={()=>{onSetMeta(Number(metaInput)||0);setEditMeta(false);}}
            style={{background:T.green,border:"none",borderRadius:8,padding:"9px 14px",
              fontSize:13,fontWeight:600,color:"#fff"}}>Guardar</button>
          <button onClick={()=>setEditMeta(false)}
            style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,
              padding:"9px 12px",fontSize:13,color:T.textSub}}><svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="2" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="9" y1="2" x2="2" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
        </div>
      )}

      {/* Barra disponible vs ahorrado */}
      {!meta&&<div style={{height:3,borderRadius:99,background:T.border,overflow:"hidden",marginBottom:8}}>
        <div style={{width:`${disponible+ahorro>0?Math.min(100,(ahorro/(disponible+ahorro))*100):0}%`,
          height:"100%",borderRadius:99,background:T.green,transition:"width .6s ease"}}/>
      </div>}
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textSub,marginBottom:22}}>
        <span>Disponible: <span style={{color:T.green,fontWeight:500}}>{fmt(disponible)}</span></span>
        <span>Ahorrado: <span style={{color:T.green,fontWeight:500}}>{fmt(ahorro)}</span></span>
      </div>

      <div style={{height:1,background:T.border,marginBottom:18}}/>

      {/* Toggle mover/retirar */}
      <div style={{display:"flex",background:T.bg,borderRadius:10,padding:3,marginBottom:14,gap:2}}>
        {[["mover","Mover a ahorro"],["retirar","Retirar"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>{setModo(id);setMonto("");}}
            style={{flex:1,background:modo===id?T.surface:"transparent",
              border:modo===id?`1px solid ${T.border}`:"1px solid transparent",
              borderRadius:8,padding:"8px 0",fontSize:12,fontWeight:modo===id?600:400,
              color:modo===id?T.text:T.textSub,transition:"all .2s"}}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{fontSize:11,color:T.textSub,marginBottom:8}}>
        {modo==="mover" ? `Máximo: ${fmt(maxMover)}` : `Máximo: ${fmt(maxRetirar)}`}
      </div>

      <input type="number" placeholder="0" value={monto}
        onChange={e=>setMonto(e.target.value)}
        style={{width:"100%",background:T.card,border:`1px solid ${T.border2}`,
          borderRadius:10,padding:"12px 14px",fontSize:18,color:T.text,
          fontFamily:"'DM Serif Display',serif",marginBottom:10,boxSizing:"border-box"}}/>

      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[10,20,25,50].map(pct=>{
          const base = modo==="mover" ? maxMover : maxRetirar;
          const v = Math.round(base*(pct/100));
          return (
            <button key={pct} onClick={()=>setMonto(String(v))}
              style={{flex:1,background:T.card,border:`1px solid ${T.border}`,
                borderRadius:8,padding:"7px 0",fontSize:11,color:T.textMid,fontWeight:500}}>
              {pct}%
            </button>
          );
        })}
      </div>

      <button onClick={handle}
        style={{width:"100%",background:canSubmit?(modo==="mover"?T.green:T.amber):T.border,
          border:"none",borderRadius:10,padding:"13px 0",fontSize:14,fontWeight:600,
          color:canSubmit?"#fff":T.textSub,transition:"background .2s"}}>
        {modo==="mover"?"Mover a ahorro →":"← Retirar al disponible"}
      </button>

      {val>0&&!canSubmit&&(
        <div style={{fontSize:11,color:T.red,marginTop:8,textAlign:"center"}}>
          {modo==="mover"?"El monto supera el disponible":"El monto supera lo ahorrado"}
        </div>
      )}
    </div>
  );
}


// ─── CONFIG SCREEN ────────────────────────────────────────────────────────────
function ConfigScreen({T, session, data, onClose, onChangePwd, onChangePin, onImport, onExportCSV, onExportJSON}) {
  const [section, setSection] = useState(null); // null | "password"
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const inp = {width:"100%",background:T.card,border:`1px solid ${T.border2}`,borderRadius:10,
    padding:"12px 14px",fontSize:15,color:T.text,boxSizing:"border-box"};

  const handleChangePwd = () => {
    setErr(""); setOk("");
    const users = getUsers();
    const user = users[session.email];
    if(!user){ setErr("Error: usuario no encontrado."); return; }
    if(user.pass !== oldPass){ setErr("La contraseña actual es incorrecta."); return; }
    if(newPass.length<6){ setErr("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    if(newPass !== newPass2){ setErr("Las contraseñas nuevas no coinciden."); return; }
    users[session.email].pass = newPass;
    saveUsers(users);
    setOk("Contraseña actualizada correctamente.");
    setOldPass(""); setNewPass(""); setNewPass2("");
    setTimeout(()=>setSection(null),1500);
  };

  const menuBtn = (label, icon, onClick, color) => (
    <button onClick={onClick}
      style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:12,
        padding:"14px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:8,cursor:"pointer"}}>
      <span style={{fontSize:18,width:24,textAlign:"center"}}>{icon}</span>
      <span style={{fontSize:13,fontWeight:500,color:color||T.text,flex:1,textAlign:"left"}}>{label}</span>
      <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1L6 6L1 11" stroke={T.border2} strokeWidth="1.5" strokeLinecap="round"/></svg>
    </button>
  );

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:40}}/>
      <div className="fade-up" style={{position:"fixed",left:0,right:0,bottom:0,zIndex:50,
        background:T.surface,borderRadius:"18px 18px 0 0",border:`1px solid ${T.border}`,
        padding:"20px 18px 40px",maxWidth:520,margin:"0 auto",maxHeight:"85vh",overflowY:"auto",
        boxShadow:"0 -8px 32px rgba(0,0,0,.25)"}}>
        <div style={{width:36,height:3,borderRadius:2,background:T.border2,margin:"0 auto 6px"}}/>

        {section===null ? (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:T.text}}>Configuración</h3>
              <button onClick={onClose} style={{background:"transparent",border:"none",color:T.textSub,fontSize:18,cursor:"pointer"}}>✕</button>
            </div>

            {/* Cuenta */}
            <div style={{fontSize:9,fontWeight:700,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Cuenta</div>
            {menuBtn("Cambiar contraseña","🔑",()=>setSection("password"))}
            {menuBtn("Cambiar PIN","🔐",()=>{onClose();onChangePin();})}

            {/* Datos */}
            <div style={{fontSize:9,fontWeight:700,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:8,marginTop:16}}>Datos</div>
            {menuBtn("Exportar CSV","📥",()=>{onClose();onExportCSV();})}
            {menuBtn("Exportar JSON","📦",()=>{onClose();onExportJSON();})}
            {menuBtn("Importar CSV / JSON","📂",()=>{onClose();onImport();})}
          </>
        ) : section==="password" ? (
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <button onClick={()=>{setSection(null);setErr("");setOk("");}}
                style={{background:"transparent",border:"none",color:T.textSub,cursor:"pointer",padding:0,fontSize:13,display:"flex",alignItems:"center",gap:5}}>
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Volver
              </button>
              <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:T.text}}>Cambiar contraseña</h3>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>CONTRASEÑA ACTUAL</label>
              <input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} placeholder="••••••" style={inp}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>NUEVA CONTRASEÑA</label>
              <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres" style={inp}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>CONFIRMAR NUEVA CONTRASEÑA</label>
              <input type="password" value={newPass2} onChange={e=>setNewPass2(e.target.value)} placeholder="Repite la contraseña"
                onKeyDown={e=>e.key==="Enter"&&handleChangePwd()} style={inp}/>
            </div>
            {err&&<div style={{fontSize:12,color:T.red,marginBottom:12,background:T.redDim,borderRadius:8,padding:"10px 12px"}}>{err}</div>}
            {ok&&<div style={{fontSize:12,color:T.green,marginBottom:12,background:T.greenDim,borderRadius:8,padding:"10px 12px"}}>{ok}</div>}
            <button onClick={handleChangePwd}
              style={{width:"100%",background:T.accent,border:"none",borderRadius:10,
                padding:"13px 0",fontSize:14,fontWeight:600,color:"#fff"}}>
              Actualizar contraseña
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark]             = useState(getDarkMode);
  const T                           = makeTheme(dark);
  const [session, setSession]       = useState(null);
  const [data, setData]             = useState(null);
  const [tab, setTab]               = useState("resumen");
  const [confirm, setConfirm]       = useState(null);
  const [sheet, setSheet]           = useState(null);
  const [closingMonth, setClosingMonth] = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [importing, setImporting]   = useState(null); // null | {type,preview,raw}
  const [pinLocked, setPinLocked]   = useState(false);  // muestra PinScreen
  const [settingPin, setSettingPin] = useState(false);  // muestra SetPinScreen

  useEffect(()=>{
    (async()=>{
      // Manejar callback de confirmación de email (hash en la URL)
      const hash = window.location.hash;
      if(hash && hash.includes("access_token")) {
        const {data:{session:sbSession}} = await sb.auth.getSession();
        if(sbSession){
          const u = sbSession.user;
          const userName = u.user_metadata?.name || u.email;
          let d = await loadCloudData(u.id) || SEED_DATA();
          const s={id:u.id, name:userName, email:u.email};
          saveSession(s); setSession(s); setData(d);
          window.history.replaceState(null,"",window.location.pathname);
          return;
        }
      }
      // Carga normal de sesión
      const s=getSession();
      if(!s) return;
      setSession(s);
      let d = await loadCloudData(s.id);
      if(!d){ d = getUserData(s.id); if(d) saveCloudData(s.id,s.email,d); }
      if(!d) d = getUserData(s.id);
      if(d){ setData(d); if(getPin(s.id)) setPinLocked(true); }
      else saveSession(null);
    })();
  },[]);

  // Guardar en Supabase + localStorage (doble respaldo) cuando cambian los datos
  useEffect(()=>{
    if(!session||!data) return;
    saveUserData(session.id, data);
    const users = getUsers();
    const localUser = users[session.email];
    saveCloudData(session.id, session.email, data, localUser?.name, localUser?.pass);
  },[data,session]);

  // ── Cierre automático al cambiar de mes ──
  useEffect(()=>{
    if(!session||!data) return;
    const mesActual = hoyMes();
    const ultimoMes = data.historial?.[0]?.mes;
    // Si hay historial y el último mes guardado es diferente al mes actual, cerrar automático
    if(ultimoMes && ultimoMes !== mesActual) return; // ya está en el mes correcto
    // Si no hay historial no hay nada que cerrar
    // Detectar si el mes actual en data difiere del mes real del sistema
    const ahora = new Date();
    const mesData = data._mesActivo;
    if(mesData && mesData !== mesActual) {
      // El mes cambió — ejecutar cierre automático silencioso
      const I_snap   = data.ingresos.reduce((s,x)=>s+x.monto,0);
      const V_snap   = data.variables.reduce((s,x)=>s+x.monto,0);
      const GFtot_s  = data.gastos.reduce((s,x)=>s+x.monto,0);
      const SVtot_s  = data.servicios.reduce((s,x)=>s+x.monto,0);
      const TKtot_s  = data.tarjetas.reduce((s,x)=>s+(x.pagado?(x._saldoCortePrev||0):(x.saldoCorte||0)),0);
      const GFpag_s  = data.gastos.filter(x=>x.pagado).reduce((s,x)=>s+x.monto,0);
      const SVpag_s  = data.servicios.filter(x=>x.pagado).reduce((s,x)=>s+x.monto,0);
      const TKpag_s  = data.tarjetas.filter(x=>x.pagado).reduce((s,x)=>s+(x._saldoCortePrev||0),0);
      const arr_s    = data.saldoArrastre||0;
      const egReal_s = GFpag_s+SVpag_s+TKpag_s+V_snap;
      const egProj_s = GFtot_s+SVtot_s+TKtot_s+V_snap;
      const balR_s   = I_snap-egReal_s+arr_s;
      const balP_s   = arr_s+I_snap-egProj_s;
      const snap = {mes:mesData,ingresos:I_snap,gastosFijos:GFtot_s,servicios:SVtot_s,
        variables:V_snap,tarjetas:TKtot_s,egresosReales:egReal_s,balanceReal:balR_s,
        balanceProyectado:balP_s,saldoArrastre:arr_s,detVar:[...data.variables]};
      upd(d=>({...d,historial:[snap,...d.historial],
        gastos:d.gastos.map(x=>({...x,pagado:false})),
        servicios:d.servicios.map(x=>({...x,pagado:false})),
        tarjetas:d.tarjetas.map(x=>({...x,pagado:false,saldoCorte:null,_saldoCortePrev:undefined})),
        variables:[],saldoArrastre:balR_s,_mesActivo:mesActual,
      }));
    } else if(!mesData) {
      // Primera vez: registrar el mes actual como activo
      upd(d=>({...d, _mesActivo:mesActual}));
    }
  },[session,data?.historial?.length]);

  const toggleDark = () => {const v=!dark;setDark(v);saveDarkMode(v);};
  const login = (s,d) => {
    setSession(s); setData(d);
    // Si no tiene PIN aún, pedirle que lo defina
    if(!getPin(s.id)) setSettingPin(true);
  };
  const logout = () => {saveSession(null);setSession(null);setData(null);setTab("resumen");setPinLocked(false);setSettingPin(false);};
  const upd = useCallback(fn=>setData(d=>fn(d)),[]);

  if(!session||!data) return <AuthScreen T={T} onLogin={login}/>;
  if(settingPin) return <SetPinScreen T={T} userId={session.id} onDone={()=>setSettingPin(false)}/>;
  if(pinLocked)  return <PinScreen T={T} userId={session.id} userName={session.name}
    onUnlock={()=>setPinLocked(false)} onLogout={logout}/>;

  // ─ TOTALS ─
  const I       = data.ingresos.reduce((s,x)=>s+x.monto,0);
  const V       = data.variables.reduce((s,x)=>s+x.monto,0);
  const GFtot   = data.gastos.reduce((s,x)=>s+x.monto,0);
  const SVtot   = data.servicios.reduce((s,x)=>s+x.monto,0);
  const TKtot   = data.tarjetas.reduce((s,x)=>s+(x.pagado?(x._saldoCortePrev||0):(x.saldoCorte||0)),0);
  const TKdeuda = data.tarjetas.reduce((s,x)=>s+x.saldo,0);
  const GFpag   = data.gastos.filter(x=>x.pagado).reduce((s,x)=>s+x.monto,0);
  const SVpag   = data.servicios.filter(x=>x.pagado).reduce((s,x)=>s+x.monto,0);
  const TKpag   = data.tarjetas.filter(x=>x.pagado).reduce((s,x)=>s+(x._saldoCortePrev||0),0);
  const pendiente = (GFtot-GFpag)+(SVtot-SVpag)+(TKtot-TKpag);
  const egReal  = GFpag+SVpag+TKpag+V;
  const egProj  = GFtot+SVtot+TKtot+V;
  // Si saldoArrastre es 0 (meses cerrados antes de esta función),
  // toma el balanceReal del mes más reciente del historial como arrastre inicial
  const arrastre = data.saldoArrastre !== undefined && data.saldoArrastre !== 0
    ? data.saldoArrastre
    : (data.historial && data.historial.length > 0 ? (data.historial[0].balanceReal || 0) : 0);
  const balReal = I-egReal+arrastre;
  const balProj = arrastre+I-egProj;

  // ─ ACTIONS ─
  const askDel = (section,id,label) => setConfirm({section,id,label});
  const doDel  = () => {upd(d=>({...d,[confirm.section]:d[confirm.section].filter(x=>x.id!==confirm.id)}));setConfirm(null);};

  const toggle = (section,id) => {
    if(section==="tarjetas"){
      upd(d=>({...d,tarjetas:d.tarjetas.map(x=>{
        if(x.id!==id) return x;
        const paying=!x.pagado;
        const corteAmt=x.saldoCorte||0;
        const newSaldo=paying?Math.max(0,x.saldo-corteAmt):x.saldo+(x._saldoCortePrev||corteAmt);
        if(paying) return {...x,pagado:true,saldo:newSaldo,_saldoCortePrev:corteAmt,saldoCorte:0};
        return {...x,pagado:false,saldo:newSaldo,saldoCorte:x._saldoCortePrev||corteAmt,_saldoCortePrev:undefined};
      })}));
    } else {
      upd(d=>({...d,[section]:d[section].map(x=>x.id===id?{...x,pagado:!x.pagado}:x)}));
    }
  };

  // ── BUG 1 CORREGIDO: usa enriched al guardar ──
  const save = form => {
    const {mode,section,item}=sheet;
    const enriched = section==="tarjetas"
      ? {...form, _saldoCortePrev: Number(form.saldoCorte)||0}
      : form;
    if(mode==="add") upd(d=>({...d,[section]:[...d[section],{...enriched,id:uid(),pagado:false}]}));
    else upd(d=>({...d,[section]:d[section].map(x=>x.id===item.id?{...x,...enriched}:x)}));
    setSheet(null);
  };

  const saveCharge = form => {
    const tid=sheet.tarjetaId;
    const tarjeta=data.tarjetas.find(x=>x.id===tid);
    const monto=Number(form.monto);
    const varGasto={id:uid(),nombre:form.descripcion,monto,categoria:form.categoria||"💳 Tarjeta",
      metodo:"💳 Tarjeta",fecha:form.fecha||hoyStr(),nota:form.nota||"",
      tarjetaId:tid,tarjetaNombre:tarjeta?.nombre||""};
    upd(d=>({...d,
      tarjetas:d.tarjetas.map(x=>x.id!==tid?x:{...x,saldo:x.saldo+monto}),
      variables:[...d.variables,varGasto],
    }));
    setSheet(null);
  };

  const openAdd       = s => {const c=mCfg(s);setSheet({mode:"add",section:s,fields:c.fields,title:c.title});};
  const openEdit      = (s,item) => {const c=mCfg(s);setSheet({mode:"edit",section:s,item,fields:c.fields,title:c.editTitle,initial:item});};
  const openAddCharge = tarjetaId => {const c=mCfg("cargo");setSheet({mode:"cargo",tarjetaId,fields:c.fields,title:c.title});};
  const openSetCorte  = tarjetaId => {
    const t=data.tarjetas.find(x=>x.id===tarjetaId);
    setSheet({mode:"setCorte",tarjetaId,
      title:`Saldo al corte — ${t?.nombre||""}`,
      fields:[{key:"saldoCorte",label:"Saldo a pagar en este corte ($)",type:"number",req:true,ph:"0"}],
      initial:{}});
  };

  // ── BUG 2 CORREGIDO: tid definido + guarda _saldoCortePrev ──
  const saveSetCorte = form => {
    const tid=sheet.tarjetaId;
    const amt=Number(form.saldoCorte)||0;
    upd(d=>({...d,tarjetas:d.tarjetas.map(x=>x.id!==tid?x:{...x,saldoCorte:amt,_saldoCortePrev:amt})}));
    setSheet(null);
  };

  const cerrarMes = () => {
    const snap={mes:hoyMes(),ingresos:I,gastosFijos:GFtot,servicios:SVtot,variables:V,tarjetas:TKtot,
      egresosReales:egReal,balanceReal:balReal,balanceProyectado:balProj,
      saldoArrastre:data.saldoArrastre||0,detVar:[...data.variables]};
    upd(d=>({...d,historial:[snap,...d.historial],
      gastos:d.gastos.map(x=>({...x,pagado:false})),
      servicios:d.servicios.map(x=>({...x,pagado:false})),
      tarjetas:d.tarjetas.map(x=>({...x,pagado:false,saldoCorte:null,_saldoCortePrev:undefined})),
      variables:[],
      saldoArrastre:balReal,
      _mesActivo:hoyMes(),
    }));
    setClosingMonth(false);setTab("tarjetas");
  };

  const sheetSave = sheet?.mode==="cargo" ? saveCharge : sheet?.mode==="setCorte" ? saveSetCorte : save;

  const TABS = [
    {id:"resumen",  l:"Resumen"},
    {id:"ingresos", l:"Ingresos"},
    {id:"gastos",   l:"Gastos"},
    {id:"servicios",l:"Servicios"},
    {id:"variables",l:"Variables"},
    {id:"tarjetas", l:"Tarjetas"},
    {id:"ahorro",   l:"Ahorro"},
    {id:"historial",l:"Historial"},
  ];

  // ── BUG 3 CORREGIDO: filtro estricto ──
  const pendingItems = [
    ...data.gastos.filter(x=>!x.pagado),
    ...data.servicios.filter(x=>!x.pagado),
    ...data.tarjetas.filter(x=>!x.pagado&&x.saldoCorte!==null&&x.saldoCorte!==undefined&&x.saldoCorte>0)
      .map(x=>({...x,monto:x.saldoCorte})),
  ];

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif",color:T.text}}>
      <link href={FONTS} rel="stylesheet"/>
      <style>{makeCSS(T)}</style>

      <header style={{background:T.surface,borderBottom:`1px solid ${T.border}`,position:"sticky",WebkitPosition:"sticky",top:0,zIndex:30}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px 10px"}}>
            <div>
              <div style={{fontSize:9,letterSpacing:3,color:T.textSub,textTransform:"uppercase",marginBottom:1}}>{hoyMes()}</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:T.text,fontWeight:400}}>
                Hola, <em style={{color:T.accent}}>{session.name.split(" ")[0]}</em>
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button onClick={toggleDark} style={{background:T.card,border:`1px solid ${T.border}`,
                borderRadius:8,padding:"7px 10px",fontSize:14,color:T.textSub,lineHeight:1}}>
                {dark?"☀️":"🌙"}
              </button>
              <div style={{position:"relative"}}>
                <button onClick={()=>setShowMenu(!showMenu)} style={{background:T.card,border:`1px solid ${T.border}`,
                  borderRadius:8,padding:"7px 12px",fontSize:15,color:T.textSub,lineHeight:1}}>⋯</button>
                {showMenu&&(
                  <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:T.surface,
                    border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",minWidth:190,zIndex:60,
                    boxShadow:"0 8px 24px rgba(0,0,0,.15)"}}>
                    <div style={{padding:"10px 14px",fontSize:11,color:T.textSub,borderBottom:`1px solid ${T.border}`}}>{session.email}</div>
                    <button onClick={()=>{setShowMenu(false);setShowConfig(true);}}
                      style={{width:"100%",background:"transparent",border:"none",padding:"11px 14px",
                        fontSize:13,color:T.textMid,textAlign:"left",borderBottom:`1px solid ${T.border}`}}>
                      ⚙️ Configuración
                    </button>
                    <button onClick={()=>{setShowMenu(false);setClosingMonth(true);}}
                      style={{width:"100%",background:"transparent",border:"none",padding:"11px 14px",
                        fontSize:13,color:T.textMid,textAlign:"left",borderBottom:`1px solid ${T.border}`}}>
                      📅 Cerrar mes
                    </button>
                    <button onClick={logout} style={{width:"100%",background:"transparent",border:"none",
                      padding:"11px 14px",fontSize:13,color:T.red,textAlign:"left"}}>Cerrar sesión</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:4,overflowX:"auto",padding:"0 12px 10px",scrollbarWidth:"none"}}>
            {TABS.map(t=>(
              <button key={t.id} className="tab-pill" onClick={()=>{setTab(t.id);setShowMenu(false);}}
                style={{
                  background:tab===t.id?T.text:"transparent",
                  border:tab===t.id?`1px solid ${T.text}`:`1px solid ${T.border}`,
                  borderRadius:99,padding:"6px 14px",fontSize:11,fontWeight:tab===t.id?600:400,
                  color:tab===t.id?T.bg:T.textSub,whiteSpace:"nowrap",
                  flexShrink:0,fontFamily:"'DM Sans',sans-serif",letterSpacing:.2,
                  WebkitTransform:"translateZ(0)",transform:"translateZ(0)",
                  willChange:"background,color,border",
                  transition:"none",
                }}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{maxWidth:640,margin:"0 auto",padding:"18px 14px 80px"}}>

        {tab==="resumen"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}} className="fade-in">
            <BalanceCard T={T} totalIngresos={I} balanceReal={balReal} balanceProyectado={balProj}
              pendienteTotal={pendiente} egresosReales={egReal} egresosProyectados={egProj}
              saldoArrastre={arrastre}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <SummaryCard T={T} icon="💰" label="Ingresos" value={I} color={T.green} sub={`${data.ingresos.length} fuentes`} onClick={()=>setTab("ingresos")}/>
              <SummaryCard T={T} icon="📋" label="Gastos fijos" value={GFtot} color={T.amber} sub={`${data.gastos.filter(x=>x.pagado).length}/${data.gastos.length} pagados`} onClick={()=>setTab("gastos")}/>
              <SummaryCard T={T} icon="⚡" label="Servicios" value={SVtot} color={T.blue} sub={`${data.servicios.filter(x=>x.pagado).length}/${data.servicios.length} pagados`} onClick={()=>setTab("servicios")}/>
              <SummaryCard T={T} icon="🛍️" label="Variables" value={V} color={T.red} sub={`${data.variables.length} gastos`} onClick={()=>setTab("variables")}/>
              <SummaryCard T={T} icon="💳" label="Pago tarjetas" value={TKtot} color={T.accent} sub={`${data.tarjetas.filter(x=>x.pagado).length}/${data.tarjetas.length} pagadas`} onClick={()=>setTab("tarjetas")}/>
              <SummaryCard T={T} icon="📊" label="Deuda tarjetas" value={TKdeuda} color={T.textMid} sub={`${data.tarjetas.length} tarjetas`} onClick={()=>setTab("tarjetas")}/>
            </div>
            {pendiente>0&&pendingItems.length>0&&<PendingAlert T={T} items={pendingItems}/>}
            {/* Alerta tarjetas con corte próximo */}
            {(()=>{
              const hoy=new Date();
              const proximas=data.tarjetas.filter(t=>{
                if(t.pagado||t.saldoCorte===null||t.saldoCorte===undefined) return false;
                let cd=new Date(hoy.getFullYear(),hoy.getMonth(),t.corte);
                if(cd<=hoy) cd=new Date(hoy.getFullYear(),hoy.getMonth()+1,t.corte);
                return Math.ceil((cd-hoy)/(1000*60*60*24))<=5;
              });
              if(!proximas.length) return null;
              return (
                <div style={{background:T.surface,border:`1.5px solid ${T.red}44`,borderRadius:14,overflow:"hidden"}}>
                  <div style={{background:`linear-gradient(135deg,${T.redDim},${T.redDim}88)`,padding:"10px 14px",
                    display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${T.red}22`}}>
                    <span style={{fontSize:16}}>✂️</span>
                    <span style={{fontSize:11,fontWeight:600,color:T.red}}>Corte próximo en menos de 5 días</span>
                  </div>
                  {proximas.map((t,i)=>{
                    let cd=new Date(hoy.getFullYear(),hoy.getMonth(),t.corte);
                    if(cd<=hoy) cd=new Date(hoy.getFullYear(),hoy.getMonth()+1,t.corte);
                    const dias=Math.ceil((cd-hoy)/(1000*60*60*24));
                    return (
                      <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                        padding:"10px 14px",borderBottom:i<proximas.length-1?`1px solid ${T.border}`:"none"}}>
                        <div>
                          <div style={{fontSize:13,color:T.text,fontWeight:500}}>{t.nombre}</div>
                          <div style={{fontSize:10,color:T.textSub}}>Corte en {dias} día{dias!==1?"s":""}</div>
                        </div>
                        <span style={{fontFamily:"'DM Serif Display',serif",fontSize:14,color:T.red,fontWeight:500}}>
                          {fmt(t.saldoCorte)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {/* Comparar con mes anterior */}
            {data.historial.length>0&&(()=>{
              const prev=data.historial[0];
              const diffV=V-prev.variables;
              const diffI=I-prev.ingresos;
              if(diffV===0&&diffI===0) return null;
              return (
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontSize:9,color:T.textSub,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>vs {prev.mes}</div>
                  <div style={{display:"flex",gap:8}}>
                    {diffV!==0&&<div style={{flex:1,background:T.card,borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:T.textSub,marginBottom:3}}>Variables</div>
                      <div style={{fontSize:13,fontWeight:600,color:diffV>0?T.red:T.green}}>
                        {diffV>0?"↑":"↓"} {fmt(Math.abs(diffV))}
                      </div>
                    </div>}
                    {diffI!==0&&<div style={{flex:1,background:T.card,borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:T.textSub,marginBottom:3}}>Ingresos</div>
                      <div style={{fontSize:13,fontWeight:600,color:diffI>0?T.green:T.red}}>
                        {diffI>0?"↑":"↓"} {fmt(Math.abs(diffI))}
                      </div>
                    </div>}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {tab==="ingresos"&&(
          <div className="fade-in">
            <SecHead T={T} title="Ingresos mensuales" total={I} color={T.green} count={data.ingresos.length} onAdd={()=>openAdd("ingresos")} addLabel="Ingreso"/>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {data.ingresos.map(item=><ItemRow key={item.id} T={T} item={item} valueColor={T.green} onEdit={()=>openEdit("ingresos",item)} onDelete={()=>askDel("ingresos",item.id,item.nombre)}/>)}
              {!data.ingresos.length&&<div style={{textAlign:"center",padding:"32px 0",color:T.textSub,fontSize:13}}>Sin ingresos registrados</div>}
            </div>
          </div>
        )}

        {tab==="gastos"&&(
          <div className="fade-in">
            <SecHead T={T} title="Gastos fijos" total={GFtot} color={T.amber} count={data.gastos.length} onAdd={()=>openAdd("gastos")} addLabel="Gasto"/>
            <div style={{fontSize:11,color:T.textSub,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:12}}>
              Marca como pagado para descontarlo del balance actual
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {data.gastos.map(item=><ItemRow key={item.id} T={T} item={item} valueColor={T.amber} showPaid
                onToggle={()=>toggle("gastos",item.id)} onEdit={()=>openEdit("gastos",item)} onDelete={()=>askDel("gastos",item.id,item.nombre)}/>)}
              {!data.gastos.length&&<div style={{textAlign:"center",padding:"32px 0",color:T.textSub,fontSize:13}}>Sin gastos registrados</div>}
            </div>
          </div>
        )}

        {tab==="servicios"&&(
          <div className="fade-in">
            <SecHead T={T} title="Servicios" total={SVtot} color={T.blue} count={data.servicios.length} onAdd={()=>openAdd("servicios")} addLabel="Servicio"/>
            <div style={{fontSize:11,color:T.textSub,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:12}}>
              Suscripciones y servicios recurrentes
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {data.servicios.map(item=><ServiceTile key={item.id} T={T} item={item}
                onEdit={()=>openEdit("servicios",item)} onDelete={()=>askDel("servicios",item.id,item.nombre)}
                onToggle={()=>toggle("servicios",item.id)}/>)}
            </div>
            {!data.servicios.length&&<div style={{textAlign:"center",padding:"32px 0",color:T.textSub,fontSize:13}}>Sin servicios registrados</div>}
          </div>
        )}

        {tab==="variables"&&(
          <VarsTab T={T} data={data} V={V} onAdd={()=>openAdd("variables")}
            onEdit={item=>openEdit("variables",item)}
            onDelete={(id,nombre)=>askDel("variables",id,nombre)}/>
        )}

        {tab==="tarjetas"&&(
          <div className="fade-in">
            <SecHead T={T} title="Tarjetas de crédito" total={TKdeuda} color={T.accent} count={data.tarjetas.length} onAdd={()=>openAdd("tarjetas")} addLabel="Tarjeta"/>
            <div style={{fontSize:11,color:T.textSub,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:14}}>
              Al pagar el corte, el saldo a corte se descuenta automáticamente del crédito usado.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {data.tarjetas.map(t=><CreditCard key={t.id} T={T} t={t}
                onEdit={()=>openEdit("tarjetas",t)} onDelete={()=>askDel("tarjetas",t.id,t.nombre)}
                onToggle={()=>toggle("tarjetas",t.id)}
                onAddCharge={()=>openAddCharge(t.id)} onSetCorte={()=>openSetCorte(t.id)}/>)}
            </div>
            {!data.tarjetas.length&&<div style={{textAlign:"center",padding:"32px 0",color:T.textSub,fontSize:13}}>Sin tarjetas registradas</div>}
          </div>
        )}

        {tab==="ahorro"&&(
          <div className="fade-in">
            <AhorroSection T={T} ahorro={data.ahorro||0} disponible={balReal} meta={data.metaAhorro||0}
              onMover={monto=>upd(d=>({...d,ahorro:(d.ahorro||0)+monto,saldoArrastre:(d.saldoArrastre||0)-monto}))}
              onRetirar={monto=>upd(d=>({...d,ahorro:Math.max(0,(d.ahorro||0)-monto),saldoArrastre:(d.saldoArrastre||0)+monto}))}
              onSetMeta={m=>upd(d=>({...d,metaAhorro:m}))}
              onSetMeta={m=>upd(d=>({...d,metaAhorro:m}))}
            />
          </div>
        )}

        {tab==="historial"&&(
          <div className="fade-in">
            <SecHead T={T} title="Historial mensual" sub={`${data.historial.length} meses`} color={T.accent}/>
            <TendenciaChart T={T} historial={data.historial}/>
            {!data.historial.length&&<div style={{textAlign:"center",padding:"32px 0",color:T.textSub,fontSize:13}}>Sin historial todavía</div>}
            {data.historial.map((h,i)=>(
              <div key={i} className="fade-up" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:10}}>
                {/* Cabecera del mes */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                  <div style={{fontSize:13,fontWeight:500,color:T.text}}>{h.mes}</div>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:h.balanceReal>=0?T.green:T.red}}>{fmt(h.balanceReal)}</div>
                </div>
                <div style={{fontSize:11,color:T.textSub,marginBottom:10}}>
                  Proyectado: <span style={{color:T.textMid}}>{fmt(h.balanceProyectado)}</span>
                </div>
                {/* Barra de progreso */}
                <div style={{height:2,borderRadius:99,background:T.border,overflow:"hidden",marginBottom:12}}>
                  <div style={{width:`${Math.min(100,(h.egresosReales/h.ingresos)*100)}%`,height:"100%",
                    borderRadius:99,background:h.balanceReal>=0?T.accent:T.red}}/>
                </div>
                {/* Mini cards de totales */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:14}}>
                  {[["Ingresos",h.ingresos,T.green],["Gastos fijos",h.gastosFijos,T.amber],["Servicios",h.servicios,T.blue],
                    ["Variables",h.variables,T.red],["Tarjetas",h.tarjetas,T.accent]].map(([l,v,c])=>(
                    <div key={l} style={{background:T.card,borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:T.textSub,letterSpacing:.8,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:13,color:c}}>{fmt(v)}</div>
                    </div>
                  ))}
                </div>

                {/* ── DETALLE DE GASTOS VARIABLES ── */}
                {h.detVar?.length>0&&(
                  <details style={{marginTop:10}}>
                    <summary style={{fontSize:11,color:T.accent,fontWeight:600,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span>📊 Ver desglose · {h.detVar.length} gastos</span>
                      <span style={{fontSize:10,color:T.textSub}}>›</span>
                    </summary>
                    <div style={{marginTop:12}}>
                      {/* Gráfica de categorías */}
                      <div style={{background:T.card,borderRadius:10,padding:"14px",marginBottom:10}}>
                        <div style={{fontSize:9,color:T.textSub,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>
                          Por categoría
                        </div>
                        <CategoryChart T={T} gastos={h.detVar}/>
                      </div>
                      {/* Lista de transacciones */}
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        {h.detVar.sort((a,b)=>b.monto-a.monto).map((v,j)=>(
                          <div key={j} style={{display:"flex",justifyContent:"space-between",
                            alignItems:"center",fontSize:12,padding:"7px 10px",
                            background:T.card,borderRadius:8}}>
                            <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                              <div style={{width:8,height:8,borderRadius:2,flexShrink:0,
                                background:getCatColor(v.categoria)}}/>
                              <span style={{color:T.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                {v.nombre}
                              </span>
                              {v.fecha&&<span style={{fontSize:10,color:T.textSub,flexShrink:0}}>
                                {v.fecha.slice(5)}
                              </span>}
                            </div>
                            <span style={{color:T.red,fontWeight:500,flexShrink:0,marginLeft:8}}>{fmt(v.monto)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {confirm&&<Confirm T={T} title="¿Eliminar elemento?" body={`Vas a eliminar "${confirm.label}". Esta acción no se puede deshacer.`}
        onOk={doDel} onCancel={()=>setConfirm(null)}/>}
      {closingMonth&&<Confirm T={T} icon="📅" title={`Cerrar ${hoyMes()}`}
        body="Se guardará el resumen del mes en el historial y se reiniciarán los pagos y gastos variables."
        ok="Cerrar mes" okColor={T.accent} onOk={cerrarMes} onCancel={()=>setClosingMonth(false)}/>}
      {sheet&&<Sheet T={T} title={sheet.title} fields={sheet.fields} initial={sheet.initial||{}}
        onSave={sheetSave} onClose={()=>setSheet(null)}/>}
      {showConfig&&(
        <ConfigScreen T={T} session={session} data={data}
          onClose={()=>setShowConfig(false)}
          onChangePin={()=>setSettingPin(true)}
          onExportCSV={()=>exportCSV(data)}
          onExportJSON={()=>exportJSON(data)}
          onImport={()=>document.getElementById('import-file-input').click()}
        />
      )}
      {showMenu&&<div onClick={()=>setShowMenu(false)} style={{position:"fixed",inset:0,zIndex:29}}/>}}

      {/* Hidden file input for import */}
      <input id="import-file-input" type="file" accept=".json,.csv" style={{display:"none"}}
        onChange={async e=>{
          const file = e.target.files?.[0];
          if(!file) return;
          e.target.value = ""; // reset so same file can be picked again
          try {
            const result = await parseImportFile(file);
            setImporting(result);
          } catch(err) {
            alert(typeof err==='string' ? err : 'Error al leer el archivo.');
          }
        }}/>

      {/* Import confirmation modal */}
      {importing&&(
        <ImportModal T={T} importing={importing}
          onCancel={()=>setImporting(null)}
          onConfirm={()=>{
            if(importing.type==="json"){
              // Restaurar TODOS los datos desde JSON
              const newData = {...SEED_DATA(), ...importing.data};
              upd(()=>newData);
              saveCloudData(session.id, session.email, newData);
            } else {
              // Importar CSV completo — reconstruir todas las secciones
              const TIPO_MAP = {
                "Ingreso":"ingresos","Gasto fijo":"gastos",
                "Servicio":"servicios","Variable":"variables","Tarjeta":"tarjetas"
              };
              const newData = {...SEED_DATA()};
              (importing.sections||[]).forEach(sec=>{
                sec.rows.forEach(row=>{
                  // Sección de items (ingresos, gastos, etc.)
                  if(row.Tipo!==undefined){
                    const section = TIPO_MAP[row.Tipo];
                    if(!section) return;
                    if(section==="tarjetas"){
                      newData.tarjetas.push({
                        id:uid(), nombre:row.Nombre||"", banco:row.Banco||"",
                        saldo:Number(row.Monto||0), limite:Number(row.Limite||0),
                        saldoCorte:Number(row.SaldoCorte||0)||null,
                        _saldoCortePrev:Number(row.SaldoCorte||0)||0,
                        corte:Number(row.Fecha||1), pagado:row.Pagado==="Si",
                        icon:row.Icono||"", color:"",
                      });
                    } else {
                      newData[section].push({
                        id:uid(), nombre:row.Nombre||"", monto:Number(row.Monto||0),
                        icono:row.Icono||"", icon:row.Icono||"",
                        categoria:row.Categoria||row["Categoría"]||"",
                        fecha:row.Fecha||"", nota:row.Nota||"",
                        pagado:row.Pagado==="Si",
                      });
                    }
                  }
                  // Sección de historial
                  if(row.Mes!==undefined){
                    newData.historial.push({
                      mes:row.Mes, ingresos:Number(row.Ingresos||0),
                      gastosFijos:Number(row.GastosFijos||0), servicios:Number(row.Servicios||0),
                      variables:Number(row.Variables||0), tarjetas:Number(row.Tarjetas||0),
                      egresosReales:Number(row.EgresosReales||0),
                      balanceReal:Number(row.BalanceReal||0),
                      balanceProyectado:Number(row.BalanceProyectado||0),
                      saldoArrastre:Number(row.SaldoArrastre||0),
                    });
                  }
                  // Sección de ahorro
                  if(row.Ahorro!==undefined){
                    newData.ahorro = Number(row.Ahorro||0);
                    newData.metaAhorro = Number(row.MetaAhorro||0);
                    newData.saldoArrastre = Number(row.SaldoArrastre||0);
                  }
                });
              });
              // Si no había secciones (CSV simple de otras apps), intentar importar filas planas
              if(!importing.sections?.length){
                importing.rows.forEach(row=>{
                  const section = TIPO_MAP[row.Tipo||row.tipo||""];
                  if(!section) return;
                  newData[section].push({
                    id:uid(), nombre:row.Nombre||row.nombre||"",
                    monto:Number(row.Monto||row.monto||0),
                    categoria:row.Categoria||row.categoria||row["Categoría"]||"",
                    fecha:row.Fecha||row.fecha||"", nota:row.Nota||row.nota||"",
                    pagado:false,
                  });
                });
              }
              upd(()=>newData);
              saveCloudData(session.id, session.email, newData);
            }
            setImporting(null);
          }}/>
      )}
    </div>
  );
}
