import { useState, useEffect, useCallback } from "react";
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
const SEED_DATA = () => ({
  ingresos:[],
  gastos:[],
  servicios:[],
  tarjetas:[],
  variables:[],
  historial:[],
});
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
// ─── AUTH STORAGE ─────────────────────────────────────────────────────────────
const getUsers = () => { try{ return JSON.parse(localStorage.getItem("fin_users")||"{}"); }catch{return {};} };
const saveUsers = u => localStorage.setItem("fin_users", JSON.stringify(u));
const getUserData = id => { try{ return JSON.parse(localStorage.getItem(`fin_data_${id}`)||"null"); }catch{return null;} };
const saveUserData = (id,d) => localStorage.setItem(`fin_data_${id}`, JSON.stringify(d));
const getSession = () => { try{ return JSON.parse(localStorage.getItem("fin_session")||"null"); }catch{return null;} };
const saveSession = s => s ? localStorage.setItem("fin_session",JSON.stringify(s)) : localStorage.removeItem("fin_session");
const getDarkMode = () => { try{ return JSON.parse(localStorage.getItem("fin_dark")??"true"); }catch{return true;} };
const saveDarkMode = v => localStorage.setItem("fin_dark", JSON.stringify(v));
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
  @keyframes shimmer { from { opacity:.6; } to { opacity:1; } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
  .fade-up { animation: fadeUp .28s cubic-bezier(.16,1,.3,1) both; }
  .fade-in { animation: fadeIn .2s ease both; }
  details summary { list-style:none; cursor:pointer; }
  details summary::-webkit-details-marker { display:none; }
  .tab-pill:hover { background:${T.card}!important; }
  .summary-card:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,.08); }
  .summary-card { transition:transform .2s, box-shadow .2s, border-color .2s; }
`;
// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
const Divider = ({T}) => <div style={{height:1,background:T.border,margin:"4px 0"}}/>;
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
// ─── OVERLAY ──────────────────────────────────────────────────────────────────
const Overlay = ({onClick}) => (
  <div onClick={onClick} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:40}}/>
);
// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function Confirm({T, icon="⚠",title,body,ok="Confirmar",okColor,onOk,onCancel}) {
  const oc = okColor || T.red;
  return (
    <>
      <Overlay onClick={onCancel}/>
      <div className="fade-up" style={{position:"fixed",left:"50%",top:"50%",transform:"translate(-50%,-50%)",
        background:T.surface,border:`1px solid ${T.border2}`,borderRadius:16,padding:28,width:"min(340px,92vw)",zIndex:50}}>
        <div style={{fontSize:32,marginBottom:12,textAlign:"center"}}>{icon}</div>
        <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:T.text,marginBottom:8,textAlign:"center"}}>{title}</h3>
        <p style={{fontSize:13,color:T.textSub,lineHeight:1.7,marginBottom:24,textAlign:"center"}}>{body}</p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onCancel} style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,
            borderRadius:10,padding:"11px 0",fontSize:13,color:T.textMid}}>Cancelar</button>
          <button onClick={onOk} style={{flex:1,background:oc,border:"none",borderRadius:10,
            padding:"11px 0",fontSize:13,fontWeight:600,color:"#fff"}}>{ok}</button>
        </div>
      </div>
    </>
  );
}
// ─── COLOR PICKER ─────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  {hex:"#6B7280", name:"Gris"},
  {hex:"#9CA3AF", name:"Gris claro"},
  {hex:"#4B5563", name:"Gris oscuro"},
  {hex:"#8B5CF6", name:"Morado"},
  {hex:"#3B82F6", name:"Azul"},
  {hex:"#10B981", name:"Verde"},
  {hex:"#F59E0B", name:"Ámbar"},
  {hex:"#EF4444", name:"Rojo"},
  {hex:"#EC4899", name:"Rosa"},
  {hex:"#F97316", name:"Naranja"},
  {hex:"#06B6D4", name:"Cian"},
  {hex:"#84CC16", name:"Lima"},
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
// ─── BOTTOM SHEET MODAL ───────────────────────────────────────────────────────
function Sheet({T, title, fields, initial={}, onSave, onClose}) {
  const [form, setForm] = useState({...initial});
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const valid = fields.filter(f=>f.req).every(f=>form[f.key]!==undefined&&form[f.key]!=="");
  const inputStyle = {
    width:"100%",background:T.card,border:`1px solid ${T.border2}`,borderRadius:10,
    padding:"11px 14px",fontSize:15,color:T.text,boxSizing:"border-box",
  };
  return (
    <>
      <Overlay onClick={onClose}/>
      <div className="fade-up" style={{
        position:"fixed",bottom:0,left:0,right:0,
        background:T.surface,borderRadius:"18px 18px 0 0",border:`1px solid ${T.border}`,
        padding:"20px 16px 36px",zIndex:50,maxHeight:"88vh",overflowY:"auto",
        maxWidth:520,margin:"0 auto",
      }}>
        <div style={{width:36,height:3,borderRadius:2,background:T.border2,margin:"0 auto 18px"}}/>
        <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:T.text,marginBottom:20}}>{title}</h3>
        {fields.map(f=>(
          <div key={f.key} style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:500,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>
              {f.label}
            </label>
            {f.type==="colorpicker" ? (
              <ColorPicker T={T} value={form[f.key]||""} onChange={v=>set(f.key,v)}/>
            ) : f.type==="select" ? (
              <select value={form[f.key]||""} onChange={e=>set(f.key,e.target.value)}
                style={{...inputStyle,backgroundImage:"none",width:"100%"}}>
                <option value="">Seleccionar...</option>
                {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type||"text"} placeholder={f.ph||""}
                value={form[f.key]!==undefined?form[f.key]:""}
                onChange={e=>set(f.key,f.type==="number"?Number(e.target.value):e.target.value)}
                style={inputStyle}/>
            )}
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:22}}>
          <button onClick={onClose} style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,
            borderRadius:10,padding:"13px 0",fontSize:14,color:T.textMid}}>Cancelar</button>
          <button onClick={()=>valid&&onSave(form)} style={{flex:2,background:valid?T.accent:T.border,
            border:"none",borderRadius:10,padding:"13px 0",fontSize:14,fontWeight:600,
            color:valid?"#fff":T.textSub,transition:"background .2s"}}>
            Guardar
          </button>
        </div>
      </div>
    </>
  );
}
// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({T, onLogin}) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const inputStyle = {width:"100%",background:T.card,border:`1px solid ${T.border2}`,borderRadius:10,
    padding:"12px 14px",fontSize:15,color:T.text,marginTop:0};
  const handle = () => {
    setErr("");
    const users = getUsers();
    if(mode==="register") {
      if(!name.trim()||!email.trim()||!pass.trim()){ setErr("Completa todos los campos."); return; }
      if(pass.length<6){ setErr("La contraseña debe tener al menos 6 caracteres."); return; }
      const key = email.toLowerCase().trim();
      if(users[key]){ setErr("Ya existe una cuenta con ese correo."); return; }
      const id = uid();
      users[key] = { id, name:name.trim(), email:key, pass };
      saveUsers(users);
      saveUserData(id, SEED_DATA());
      const session = {id, name:users[key].name, email:key};
      saveSession(session);
      onLogin(session, SEED_DATA());
    } else {
      if(!email.trim()||!pass.trim()){ setErr("Ingresa tu correo y contraseña."); return; }
      const key = email.toLowerCase().trim();
      const user = users[key];
      if(!user||user.pass!==pass){ setErr("Correo o contraseña incorrectos."); return; }
      const data = getUserData(user.id)||SEED_DATA();
      const session = {id:user.id, name:user.name, email:key};
      saveSession(session);
      onLogin(session, data);
    }
  };
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <link href={FONTS} rel="stylesheet"/>
      <style>{makeCSS(T)}</style>
      <div className="fade-up" style={{marginBottom:36,textAlign:"center"}}>
        <div style={{fontSize:10,letterSpacing:5,color:T.textSub,textTransform:"uppercase",marginBottom:10}}>Finanzas personales</div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:34,color:T.text,fontWeight:400}}>
          Mi <em style={{color:T.accent}}>Capital</em>
        </h1>
        <div style={{width:40,height:1,background:T.accentBr,margin:"14px auto 0",opacity:.6}}/>
      </div>
      <div className="fade-up" style={{width:"100%",maxWidth:380,background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:24}}>
        <div style={{display:"flex",background:T.card,borderRadius:10,padding:3,marginBottom:22,gap:3}}>
          {[["login","Iniciar sesión"],["register","Crear cuenta"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>{setMode(id);setErr("");}}
              style={{flex:1,background:mode===id?T.surface:"transparent",border:mode===id?`1px solid ${T.border}`:"1px solid transparent",
                borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:500,color:mode===id?T.text:T.textSub,transition:"all .2s"}}>
              {lbl}
            </button>
          ))}
        </div>
        {mode==="register"&&(
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>NOMBRE</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={inputStyle}/>
          </div>
        )}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>CORREO</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com" style={inputStyle}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,color:T.textSub,display:"block",marginBottom:6,letterSpacing:.5}}>CONTRASEÑA</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••"
            onKeyDown={e=>e.key==="Enter"&&handle()} style={inputStyle}/>
        </div>
        {err&&<div style={{fontSize:12,color:T.red,marginBottom:14,background:T.redDim,borderRadius:8,padding:"10px 12px"}}>{err}</div>}
        <button onClick={handle} style={{width:"100%",background:T.accent,border:"none",borderRadius:10,
          padding:"14px 0",fontSize:14,fontWeight:600,color:"#fff"}}>
          {mode==="login"?"Entrar a mi cuenta":"Crear cuenta"}
        </button>
      </div>
      <p style={{fontSize:11,color:T.textSub,marginTop:20,textAlign:"center",lineHeight:1.6}}>
        Tus datos se guardan localmente en este dispositivo.<br/>No se comparten con ningún servidor.
      </p>
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
        {item.pagado?"↩":"✓"}
      </button>}
      <button onClick={onEdit} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}>✎</button>
      <button onClick={onDelete} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}>✕</button>
    </div>
  );
}
// ─── SERVICE TILE ─────────────────────────────────────────────────────────────
function ServiceTile({T, item, onEdit, onDelete, onToggle}) {
  return (
    <div className="fade-up" style={{background:T.card,border:`1px solid ${item.pagado?T.green:T.border}`,borderRadius:12,
      padding:14,position:"relative",overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <span style={{fontSize:22}}>{item.icon||"·"}</span>
        <div style={{display:"flex",gap:4}}>
          <button onClick={onEdit} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"4px 8px",fontSize:11,color:T.textSub}}>✎</button>
          <button onClick={onDelete} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"4px 8px",fontSize:11,color:T.textSub}}>✕</button>
        </div>
      </div>
      <div style={{fontSize:12,fontWeight:500,color:T.textMid,marginBottom:3}}>{item.nombre}</div>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:T.accent,marginBottom:10}}>{fmt(item.monto)}</div>
      <button onClick={onToggle} style={{width:"100%",background:item.pagado?`${T.greenDim}`:"transparent",
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
  // saldoCorte===null significa que el mes fue cerrado y hay que introducirlo
  const cortePendiente = t.saldoCorte===null || t.saldoCorte===undefined;
  return (
    <div className="fade-up" style={{background:T.card,border:`1px solid ${t.pagado?T.green:cortePendiente?T.amber:T.border}`,borderRadius:14,
      padding:"16px 16px 14px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:t.color||T.accent}}/>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontSize:14,fontWeight:500,color:T.text}}>{t.nombre}</div>
          <div style={{fontSize:11,color:T.textSub,marginTop:3,display:"flex",gap:8,alignItems:"center"}}>
            <span>{t.banco}</span>
            <Badge T={T} color={dias<=5?T.red:T.blue} border={dias<=5?T.red:T.border2}>✂ Corte en {dias}d</Badge>
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          <button onClick={onEdit} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}>✎</button>
          <button onClick={onDelete} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}>✕</button>
        </div>
      </div>

      {/* Aviso: introducir saldo al corte del nuevo mes */}
      {cortePendiente && (
        <div style={{background:T.amberDim,border:`1px solid ${T.amber}44`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:11,color:T.amber,fontWeight:600,marginBottom:6}}>⚠️ Introduce el saldo a corte de este mes</div>
          <div style={{fontSize:11,color:T.amber,marginBottom:10,opacity:.8}}>
            Al iniciar el nuevo mes necesitas registrar cuánto debes pagar en este corte.
          </div>
          <button onClick={onSetCorte}
            style={{width:"100%",background:T.amber,border:"none",borderRadius:8,padding:"9px 0",
              fontSize:12,fontWeight:600,color:"#fff"}}>
            Registrar saldo al corte
          </button>
        </div>
      )}

      {/* Datos principales */}
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
                  {t.pagado ? "✓ Pagado" : fmt(t.saldoCorte)}
                </div>
                {t.pagado && <div style={{fontSize:10,color:T.textSub,marginTop:2}}>Saldo corte descontado</div>}
              </>
          }
        </div>
      </div>

      {/* Barra de uso */}
      <div style={{marginBottom:14}}>
        <div style={{height:3,borderRadius:99,background:T.border,overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:barC,transition:"width .6s ease"}}/>
        </div>
      </div>

      {/* Acciones */}
      <div style={{display:"flex",gap:6}}>
        <button onClick={onAddCharge} style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,
          borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:500,color:T.textMid}}>
          + Cargo
        </button>
        {!cortePendiente && (
          <button onClick={onToggle} style={{flex:2,
            background:t.pagado?T.greenDim:"transparent",
            border:`1px solid ${t.pagado?T.green:T.border2}`,borderRadius:8,padding:"9px 0",
            fontSize:12,fontWeight:600,color:t.pagado?T.green:T.textSub}}>
            {t.pagado?"✓ Pagado":"Pagar corte"}
          </button>
        )}
      </div>
    </div>
  );
}
// ─── VAR ROW ──────────────────────────────────────────────────────────────────
function VarRow({T, item, onDelete}) {
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
      <button onClick={onDelete} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:T.textSub}}>✕</button>
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
// ─── BALANCE CARD (redesigned) ────────────────────────────────────────────────
function BalanceCard({T, totalIngresos, balanceReal, balanceProyectado, pendienteTotal, egresosReales, egresosProyectados}) {
  const [v, setV] = useState("real");
  const isReal = v==="real";
  const bal = isReal ? balanceReal : balanceProyectado;
  const eg = isReal ? egresosReales : egresosProyectados;
  const pos = bal>=0;
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border2}`,borderRadius:18,padding:"20px 20px 18px",marginBottom:4}}>
      {/* Toggle pills */}
      <div style={{display:"flex",background:T.bg,borderRadius:10,padding:3,marginBottom:22,gap:2}}>
        {[["real","Balance actual"],["proj","Si pago todo"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setV(id)} style={{flex:1,background:v===id?T.surface:"transparent",
            border:v===id?`1px solid ${T.border}`:"1px solid transparent",borderRadius:8,padding:"8px 0",
            fontSize:12,fontWeight:v===id?600:400,color:v===id?T.text:T.textSub,transition:"all .2s"}}>
            {lbl}
          </button>
        ))}
      </div>
      {/* Label */}
      <div style={{fontSize:9,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>
        {isReal?"Disponible después de pagos realizados":"Lo que quedaría pagando todo"}
      </div>
      {/* Big balance number — the hero */}
      <div style={{
        fontFamily:"'DM Serif Display',serif",
        fontSize:52,
        lineHeight:1,
        color:pos?T.green:T.red,
        letterSpacing:"-1px",
        marginBottom:16,
      }}>
        {fmt(bal)}
      </div>
      {/* Pending alert */}
      {isReal&&pendienteTotal>0&&(
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:T.amberDim,
          borderRadius:8,padding:"7px 12px",marginBottom:14}}>
          <span style={{fontSize:13}}>⏳</span>
          <span style={{fontSize:11,color:T.amber,fontWeight:500}}>Pendiente por pagar: {fmt(pendienteTotal)}</span>
        </div>
      )}
      {/* Progress bar */}
      <div style={{height:3,borderRadius:99,background:T.border,overflow:"hidden",marginBottom:10}}>
        <div style={{width:`${Math.min(100,Math.max(0,(eg/totalIngresos)*100))}%`,height:"100%",
          borderRadius:99,background:pos?T.accent:T.red,transition:"width .6s ease"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textSub}}>
        <span>Ingresos: <span style={{color:T.green,fontWeight:500}}>{fmt(totalIngresos)}</span></span>
        <span>Egresos: <span style={{color:T.red,fontWeight:500}}>{fmt(eg)}</span></span>
      </div>
    </div>
  );
}
// ─── SUMMARY CARD ─────────────────────────────────────────────────────────────
// Cards con acento de color sólo en el número, iconos grandes
function SummaryCard({T, icon, label, value, color, sub, onClick}) {
  return (
    <button className="summary-card" onClick={onClick}
      style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,
        padding:"16px 14px",textAlign:"left",cursor:"pointer",width:"100%"}}>
      {/* Big expressive icon */}
      <div style={{fontSize:26,marginBottom:10,lineHeight:1}}>{icon}</div>
      <div style={{fontSize:9,color:T.textSub,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{label}</div>
      {/* Value with color accent ONLY on the number */}
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:19,color:color,marginBottom:4}}>
        {fmt(value)}
      </div>
      <div style={{fontSize:10,color:T.textSub}}>{sub}</div>
    </button>
  );
}
// ─── PENDING ALERT SECTION ────────────────────────────────────────────────────
function PendingAlert({T, items}) {
  return (
    <div style={{
      background:T.surface,
      border:`1.5px solid ${T.amber}44`,
      borderRadius:14,
      overflow:"hidden",
    }}>
      {/* Alert header strip */}
      <div style={{
        background:`linear-gradient(135deg, ${T.amberDim}, ${T.amberDim}88)`,
        padding:"12px 16px",
        display:"flex",
        alignItems:"center",
        gap:10,
        borderBottom:`1px solid ${T.amber}33`,
      }}>
        <span style={{fontSize:18}}>⚠️</span>
        <div>
          <div style={{fontSize:10,fontWeight:600,color:T.amber,letterSpacing:1,textTransform:"uppercase"}}>
            Pagos pendientes
          </div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:T.amber}}>
            {fmt(items.reduce((s,x)=>s+(x.monto||0),0))}
          </div>
        </div>
      </div>
      {/* Items list */}
      <div style={{padding:"4px 0"}}>
        {items.map((item,i)=>(
          <div key={item.id} style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            padding:"10px 16px",
            borderBottom: i<items.length-1 ? `1px solid ${T.border}` : "none",
          }}>
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
  const base = [
    {key:"icon",label:"Emoji",ph:"💰"},
    {key:"nombre",label:"Nombre",req:true,ph:"Ej. Netflix"},
    {key:"monto",label:"Monto ($)",type:"number",req:true,ph:"0"},
  ];
  if(s==="ingresos") return {fields:base,title:"Nuevo ingreso",editTitle:"Editar ingreso"};
  if(s==="gastos") return {fields:base,title:"Nuevo gasto fijo",editTitle:"Editar gasto"};
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
// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(getDarkMode);
  const T = makeTheme(dark);
  const [session, setSession] = useState(null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("resumen");
  const [confirm, setConfirm] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [closingMonth, setClosingMonth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(()=>{
    const s = getSession();
    if(s){ const d=getUserData(s.id); if(d){ setSession(s); setData(d); } else saveSession(null); }
  },[]);
  useEffect(()=>{ if(session&&data) saveUserData(session.id, data); },[data, session]);

  const toggleDark = () => { const v=!dark; setDark(v); saveDarkMode(v); };
  const login = (s,d) => { setSession(s); setData(d); };
  const logout = () => { saveSession(null); setSession(null); setData(null); setTab("resumen"); };
  const upd = useCallback(fn => setData(d=>fn(d)),[]);

  if(!session||!data) return <AuthScreen T={T} onLogin={login}/>;

  // ─ TOTALS ─
  const I = data.ingresos.reduce((s,x)=>s+x.monto,0);
  const V = data.variables.reduce((s,x)=>s+x.monto,0);
  const GFtot = data.gastos.reduce((s,x)=>s+x.monto,0);
  const SVtot = data.servicios.reduce((s,x)=>s+x.monto,0);
  const TKtot = data.tarjetas.reduce((s,x)=>s+(x.saldoCorte||0),0);
  const TKdeuda = data.tarjetas.reduce((s,x)=>s+x.saldo,0);
  const GFpag = data.gastos.filter(x=>x.pagado).reduce((s,x)=>s+x.monto,0);
  const SVpag = data.servicios.filter(x=>x.pagado).reduce((s,x)=>s+x.monto,0);
  const TKpag = data.tarjetas.filter(x=>x.pagado).reduce((s,x)=>s+(x.saldoCorte||0),0);
  const pendiente = (GFtot-GFpag)+(SVtot-SVpag)+(TKtot-TKpag);
  const egReal = GFpag+SVpag+TKpag+V;
  const egProj = GFtot+SVtot+TKtot+V;
  const balReal = I-egReal;
  const balProj = I-egProj;

  // ─ ACTIONS ─
  const askDel = (section,id,label)=>setConfirm({section,id,label});
  const doDel = ()=>{ upd(d=>({...d,[confirm.section]:d[confirm.section].filter(x=>x.id!==confirm.id)})); setConfirm(null); };
  const toggle = (section,id)=>{
    if(section==="tarjetas"){
      upd(d=>({...d, tarjetas: d.tarjetas.map(x=>{
        if(x.id!==id) return x;
        const paying = !x.pagado;
        const corteAmt = x.saldoCorte||0;
        const newSaldo = paying ? Math.max(0, x.saldo - corteAmt) : x.saldo + (x._saldoCortePrev||corteAmt);
        // Al pagar: guarda el saldoCorte anterior para poder revertir, luego lo pone en 0
        // Al revertir: restaura el saldoCorte guardado
        if(paying) return {...x, pagado:true, saldo:newSaldo, _saldoCortePrev:corteAmt, saldoCorte:0};
        return {...x, pagado:false, saldo:newSaldo, saldoCorte:x._saldoCortePrev||corteAmt, _saldoCortePrev:undefined};
      })}));
    } else {
      upd(d=>({...d,[section]:d[section].map(x=>x.id===id?{...x,pagado:!x.pagado}:x)}));
    }
  };
  const save = form => {
    const {mode,section,item} = sheet;
    if(mode==="add") upd(d=>({...d,[section]:[...d[section],{...form,id:uid(),pagado:false}]}));
    else upd(d=>({...d,[section]:d[section].map(x=>x.id===item.id?{...x,...form}:x)}));
    setSheet(null);
  };
  const saveCharge = (form) => {
    const tid = sheet.tarjetaId;
    const tarjeta = data.tarjetas.find(x=>x.id===tid);
    const monto = Number(form.monto);
    // El cargo se convierte en gasto variable ligado a la tarjeta
    const varGasto = {
      id: uid(),
      nombre: form.descripcion,
      monto,
      categoria: form.categoria||"💳 Tarjeta",
      metodo: "💳 Tarjeta",
      fecha: form.fecha||hoyStr(),
      nota: form.nota||"",
      tarjetaId: tid,
      tarjetaNombre: tarjeta?.nombre||"",
    };
    upd(d=>({
      ...d,
      tarjetas: d.tarjetas.map(x=> x.id!==tid ? x : {...x, saldo: x.saldo+monto}),
      variables: [...d.variables, varGasto],
    }));
    setSheet(null);
  };
  const openAdd = s => { const c=mCfg(s); setSheet({mode:"add",section:s,fields:c.fields,title:c.title}); };
  const openEdit = (s,item) => { const c=mCfg(s); setSheet({mode:"edit",section:s,item,fields:c.fields,title:c.editTitle,initial:item}); };
  const openAddCharge = (tarjetaId) => {
    const c=mCfg("cargo");
    setSheet({mode:"cargo",tarjetaId,fields:c.fields,title:c.title});
  };
  const openSetCorte = (tarjetaId) => {
    const tarjeta = data.tarjetas.find(x=>x.id===tarjetaId);
    setSheet({mode:"setCorte",tarjetaId,title:`Saldo al corte u2014 ${tarjeta?.nombre||""}`,
      fields:[{key:"saldoCorte",label:"Saldo a pagar en este corte ($)",type:"number",req:true,ph:"0"}],initial:{}});
  };
  const saveSetCorte = (form) => {
    const tid = sheet.tarjetaId;
    upd(d=>({...d, tarjetas: d.tarjetas.map(x=> x.id!==tid ? x : {...x, saldoCorte: Number(form.saldoCorte)})}));
    setSheet(null);
  };
  // Al cerrar mes: tarjetas quedan con saldoCorte=null para que el usuario lo introduzca manualmente
  const cerrarMes = () => {
    const snap = {mes:hoyMes(),ingresos:I,gastosFijos:GFtot,servicios:SVtot,variables:V,tarjetas:TKtot,
      egresosReales:egReal,balanceReal:balReal,balanceProyectado:balProj,detVar:[...data.variables]};
    upd(d=>({...d, historial:[snap,...d.historial],
      gastos:d.gastos.map(x=>({...x,pagado:false})),
      servicios:d.servicios.map(x=>({...x,pagado:false})),
      tarjetas:d.tarjetas.map(x=>({...x,pagado:false,saldoCorte:null,_saldoCortePrev:undefined})),
      variables:[],
    }));
    setClosingMonth(false); setTab("tarjetas");
  };

  const TABS = [
    {id:"resumen", e:"◎", l:"Resumen"},
    {id:"ingresos", e:"↑", l:"Ingresos"},
    {id:"gastos", e:"↓", l:"Gastos"},
    {id:"servicios",e:"⚡",l:"Servicios"},
    {id:"variables",e:"·", l:"Variables"},
    {id:"tarjetas", e:"▣", l:"Tarjetas"},
    {id:"historial",e:"≡", l:"Historial"},
  ];

  const sheetSave = sheet?.mode==="cargo" ? saveCharge : sheet?.mode==="setCorte" ? saveSetCorte : save;

  // pending items list
  const pendingItems = [
    ...data.gastos.filter(x=>!x.pagado),
    ...data.servicios.filter(x=>!x.pagado),
    ...data.tarjetas.filter(x=>!x.pagado && x.saldoCorte!=null).map(x=>({...x,monto:x.saldoCorte||0})),
  ];

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif",color:T.text}}>
      <link href={FONTS} rel="stylesheet"/>
      <style>{makeCSS(T)}</style>

      {/* ══ HEADER — cleaner, minimal ══ */}
      <header style={{background:T.surface,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:30}}>
        <div style={{maxWidth:840,margin:"0 auto"}}>

          {/* Top bar: name + actions */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px 12px"}}>
            <div>
              <div style={{fontSize:11,letterSpacing:3,color:T.textSub,textTransform:"uppercase",marginBottom:1}}>
                {hoyMes()}
              </div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:19,color:T.text,fontWeight:400}}>
                Hola, <em style={{color:T.accent}}>{session.name.split(" ")[0]}</em>
              </div>
            </div>

            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {/* Dark/Light toggle */}
              <button onClick={toggleDark} style={{background:T.card,border:`1px solid ${T.border}`,
                borderRadius:8,padding:"7px 10px",fontSize:14,color:T.textSub,lineHeight:1}}>
                {dark?"☀️":"🌙"}
              </button>

              {/* Menu ⋯ — now includes "Cerrar mes" */}
              <div style={{position:"relative"}}>
                <button onClick={()=>setShowMenu(!showMenu)} style={{background:T.card,border:`1px solid ${T.border}`,
                  borderRadius:8,padding:"7px 12px",fontSize:15,color:T.textSub,lineHeight:1}}>
                  ⋯
                </button>
                {showMenu&&(
                  <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:T.surface,
                    border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",minWidth:180,zIndex:60,
                    boxShadow:"0 8px 24px rgba(0,0,0,.15)"}}>
                    <div style={{padding:"10px 14px",fontSize:11,color:T.textSub,borderBottom:`1px solid ${T.border}`}}>
                      {session.email}
                    </div>
                    {/* Cerrar mes now lives here */}
                    <button onClick={()=>{setShowMenu(false);setClosingMonth(true);}}
                      style={{width:"100%",background:"transparent",border:"none",
                        padding:"11px 14px",fontSize:13,color:T.textMid,textAlign:"left",
                        borderBottom:`1px solid ${T.border}`}}>
                      📅 Cerrar mes
                    </button>
                    <button onClick={logout} style={{width:"100%",background:"transparent",border:"none",
                      padding:"11px 14px",fontSize:13,color:T.red,textAlign:"left"}}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Pill tabs ── */}
          <div style={{display:"flex",gap:4,overflowX:"auto",padding:"0 12px 10px",
            scrollbarWidth:"none",msOverflowStyle:"none"}}>
            {TABS.map(t=>(
              <button key={t.id} className="tab-pill"
                onClick={()=>{setTab(t.id);setShowMenu(false);}}
                style={{
                  background: tab===t.id ? T.text : "transparent",
                  border: tab===t.id ? `1px solid ${T.text}` : `1px solid ${T.border}`,
                  borderRadius:99,
                  padding:"6px 13px",
                  fontSize:11,
                  fontWeight: tab===t.id ? 600 : 400,
                  color: tab===t.id ? T.bg : T.textSub,
                  whiteSpace:"nowrap",
                  transition:"all .18s",
                  flexShrink:0,
                }}>
                {t.e} {t.l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{maxWidth:640,margin:"0 auto",padding:"18px 14px 80px"}}>

        {/* ══ RESUMEN ══ */}
        {tab==="resumen"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}} className="fade-in">
            <BalanceCard T={T} totalIngresos={I} balanceReal={balReal} balanceProyectado={balProj}
              pendienteTotal={pendiente} egresosReales={egReal} egresosProyectados={egProj}/>

            {/* Summary cards grid — color only on the number */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <SummaryCard T={T} icon="💰" label="Ingresos" value={I} color={T.green}
                sub={`${data.ingresos.length} fuentes`} onClick={()=>setTab("ingresos")}/>
              <SummaryCard T={T} icon="📋" label="Gastos fijos" value={GFtot} color={T.amber}
                sub={`${data.gastos.filter(x=>x.pagado).length}/${data.gastos.length} pagados`} onClick={()=>setTab("gastos")}/>
              <SummaryCard T={T} icon="⚡" label="Servicios" value={SVtot} color={T.blue}
                sub={`${data.servicios.filter(x=>x.pagado).length}/${data.servicios.length} pagados`} onClick={()=>setTab("servicios")}/>
              <SummaryCard T={T} icon="🛍️" label="Variables" value={V} color={T.red}
                sub={`${data.variables.length} gastos`} onClick={()=>setTab("variables")}/>
              <SummaryCard T={T} icon="💳" label="Pago tarjetas" value={TKtot} color={T.accent}
                sub={`${data.tarjetas.filter(x=>x.pagado).length}/${data.tarjetas.length} pagadas`} onClick={()=>setTab("tarjetas")}/>
              <SummaryCard T={T} icon="📊" label="Deuda tarjetas" value={TKdeuda} color={T.textMid}
                sub={`${data.tarjetas.length} tarjetas`} onClick={()=>setTab("tarjetas")}/>
            </div>

            {/* Pending alert — visual "alerta" design */}
            {pendiente>0&&pendingItems.length>0&&(
              <PendingAlert T={T} items={pendingItems}/>
            )}
          </div>
        )}

        {/* ══ INGRESOS ══ */}
        {tab==="ingresos"&&(
          <div className="fade-in">
            <SecHead T={T} title="Ingresos mensuales" total={I} color={T.green} count={data.ingresos.length}
              onAdd={()=>openAdd("ingresos")} addLabel="Ingreso"/>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {data.ingresos.map(item=><ItemRow key={item.id} T={T} item={item} valueColor={T.green}
                onEdit={()=>openEdit("ingresos",item)} onDelete={()=>askDel("ingresos",item.id,item.nombre)}/>)}
              {!data.ingresos.length&&<div style={{textAlign:"center",padding:"32px 0",color:T.textSub,fontSize:13}}>Sin ingresos registrados</div>}
            </div>
          </div>
        )}

        {/* ══ GASTOS ══ */}
        {tab==="gastos"&&(
          <div className="fade-in">
            <SecHead T={T} title="Gastos fijos" total={GFtot} color={T.amber} count={data.gastos.length}
              onAdd={()=>openAdd("gastos")} addLabel="Gasto"/>
            <div style={{fontSize:11,color:T.textSub,background:T.surface,border:`1px solid ${T.border}`,
              borderRadius:10,padding:"10px 12px",marginBottom:12}}>
              Marca como pagado para descontarlo del balance actual
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {data.gastos.map(item=><ItemRow key={item.id} T={T} item={item} valueColor={T.amber} showPaid
                onToggle={()=>toggle("gastos",item.id)}
                onEdit={()=>openEdit("gastos",item)} onDelete={()=>askDel("gastos",item.id,item.nombre)}/>)}
              {!data.gastos.length&&<div style={{textAlign:"center",padding:"32px 0",color:T.textSub,fontSize:13}}>Sin gastos registrados</div>}
            </div>
          </div>
        )}

        {/* ══ SERVICIOS ══ */}
        {tab==="servicios"&&(
          <div className="fade-in">
            <SecHead T={T} title="Servicios" total={SVtot} color={T.blue} count={data.servicios.length}
              onAdd={()=>openAdd("servicios")} addLabel="Servicio"/>
            <div style={{fontSize:11,color:T.textSub,background:T.surface,border:`1px solid ${T.border}`,
              borderRadius:10,padding:"10px 12px",marginBottom:12}}>
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

        {/* ══ VARIABLES ══ */}
        {tab==="variables"&&(
          <div className="fade-in">
            <SecHead T={T} title="Gastos variables" total={V} color={T.red} count={data.variables.length}
              onAdd={()=>openAdd("variables")} addLabel="Gasto"/>
            {CATS.map(cat=>{
              const items=data.variables.filter(x=>x.categoria===cat);
              if(!items.length) return null;
              return (
                <div key={cat} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"0 2px",marginBottom:7}}>
                    <span style={{fontSize:11,color:T.textSub,letterSpacing:.5}}>{cat}</span>
                    <span style={{fontSize:11,color:T.red,fontWeight:500}}>{fmt(items.reduce((s,x)=>s+x.monto,0))}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {items.map(item=><VarRow key={item.id} T={T} item={item} onDelete={()=>askDel("variables",item.id,item.nombre)}/>)}
                  </div>
                </div>
              );
            })}
            {data.variables.filter(x=>!CATS.includes(x.categoria)).map(item=>(
              <VarRow key={item.id} T={T} item={item} onDelete={()=>askDel("variables",item.id,item.nombre)}/>
            ))}
            {!data.variables.length&&<div style={{textAlign:"center",padding:"32px 0",color:T.textSub,fontSize:13}}>Sin gastos variables este mes</div>}
          </div>
        )}

        {/* ══ TARJETAS ══ */}
        {tab==="tarjetas"&&(
          <div className="fade-in">
            <SecHead T={T} title="Tarjetas de crédito" total={TKdeuda} color={T.accent} count={data.tarjetas.length}
              onAdd={()=>openAdd("tarjetas")} addLabel="Tarjeta"/>
            <div style={{fontSize:11,color:T.textSub,background:T.surface,border:`1px solid ${T.border}`,
              borderRadius:10,padding:"10px 12px",marginBottom:14}}>
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

        {/* ══ HISTORIAL ══ */}
        {tab==="historial"&&(
          <div className="fade-in">
            <SecHead T={T} title="Historial mensual" sub={`${data.historial.length} meses`} color={T.accent}/>
            {!data.historial.length&&<div style={{textAlign:"center",padding:"32px 0",color:T.textSub,fontSize:13}}>Sin historial todavía</div>}
            {data.historial.map((h,i)=>(
              <div key={i} className="fade-up" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:16,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                  <div style={{fontSize:13,fontWeight:500,color:T.text}}>{h.mes}</div>
                  <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:h.balanceReal>=0?T.green:T.red}}>{fmt(h.balanceReal)}</div>
                </div>
                <div style={{fontSize:11,color:T.textSub,marginBottom:10}}>Proyectado: <span style={{color:T.textMid}}>{fmt(h.balanceProyectado)}</span></div>
                <div style={{height:2,borderRadius:99,background:T.border,overflow:"hidden",marginBottom:12}}>
                  <div style={{width:`${Math.min(100,(h.egresosReales/h.ingresos)*100)}%`,height:"100%",
                    borderRadius:99,background:h.balanceReal>=0?T.accent:T.red}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                  {[["Ingresos",h.ingresos,T.green],["Gastos fijos",h.gastosFijos,T.amber],["Servicios",h.servicios,T.blue],
                    ["Variables",h.variables,T.red],["Tarjetas",h.tarjetas,T.accent]].map(([l,v,c])=>(
                    <div key={l} style={{background:T.card,borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:T.textSub,letterSpacing:.8,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:13,color:c}}>{fmt(v)}</div>
                    </div>
                  ))}
                </div>
                {h.detVar?.length>0&&(
                  <details style={{marginTop:10}}>
                    <summary style={{fontSize:11,color:T.accent,fontWeight:500}}>Ver {h.detVar.length} gastos variables ›</summary>
                    <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
                      {h.detVar.map((v,j)=>(
                        <div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:`1px solid ${T.border}`}}>
                          <span style={{color:T.textMid}}>{v.categoria?.split(" ")[0]} {v.nombre}</span>
                          <span style={{color:T.red,fontWeight:500}}>{fmt(v.monto)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DIALOGS */}
      {confirm&&<Confirm T={T} title="¿Eliminar elemento?" body={`Vas a eliminar "${confirm.label}". Esta acción no se puede deshacer.`}
        onOk={doDel} onCancel={()=>setConfirm(null)}/>}
      {closingMonth&&<Confirm T={T} icon="📅" title={`Cerrar ${hoyMes()}`}
        body="Se guardará el resumen del mes en el historial y se reiniciarán los pagos y gastos variables."
        ok="Cerrar mes" okColor={T.accent} onOk={cerrarMes} onCancel={()=>setClosingMonth(false)}/>}
      {sheet&&<Sheet T={T} title={sheet.title} fields={sheet.fields} initial={sheet.initial||{}}
        onSave={sheetSave} onClose={()=>setSheet(null)}/>}
      {showMenu&&<div onClick={()=>setShowMenu(false)} style={{position:"fixed",inset:0,zIndex:29}}/>}
    </div>
  );
}
