import { useState, useEffect } from "react";

const FONTS = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:ital,wght@0,500;1,400&display=swap";
const fmt = n => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
const uid = () => Math.random().toString(36).slice(2);
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const hoyMes = () => { const d = new Date(); return `${MESES[d.getMonth()]} ${d.getFullYear()}`; };
const hoyStr = () => new Date().toISOString().slice(0,10);

const CATEGORIAS = ["🍔 Comida","⛽ Gasolina","🛍 Ropa","🎉 Entretenimiento","💊 Salud","✈️ Viajes","🐾 Mascotas","📦 Otros"];
const METODOS = ["💵 Efectivo","💳 Tarjeta","📲 Transferencia"];
const CARD_COLORS = ["#6366F1","#EF4444","#F59E0B","#10B981","#3B82F6","#EC4899","#8B5CF6"];

const SEED = {
  ingresos: [
    { id:"i1", nombre:"Salario principal", monto:25000, icon:"💼" },
    { id:"i2", nombre:"Freelance", monto:5000, icon:"💻" },
  ],
  gastos: [
    { id:"g1", nombre:"Renta / Hipoteca", monto:8000, icon:"🏠", pagado:false },
    { id:"g2", nombre:"Seguro de auto", monto:900, icon:"🚗", pagado:false },
    { id:"g3", nombre:"Gimnasio", monto:550, icon:"🏋️", pagado:false },
    { id:"g4", nombre:"Préstamo personal", monto:2000, icon:"🏦", pagado:false },
  ],
  servicios: [
    { id:"s1", nombre:"Internet", monto:450, icon:"📡", pagado:false },
    { id:"s2", nombre:"Luz", monto:380, icon:"💡", pagado:false },
    { id:"s3", nombre:"Agua", monto:150, icon:"💧", pagado:false },
    { id:"s4", nombre:"Netflix", monto:219, icon:"🎬", pagado:false },
    { id:"s5", nombre:"Spotify", monto:99, icon:"🎵", pagado:false },
    { id:"s6", nombre:"Gas", monto:200, icon:"🔥", pagado:false },
  ],
  tarjetas: [
    { id:"t1", nombre:"Visa Oro", banco:"BBVA", limite:30000, saldo:12400, saldoCorte:9800, corte:15, color:"#F59E0B", pagado:false },
    { id:"t2", nombre:"Mastercard", banco:"Banamex", limite:20000, saldo:5800, saldoCorte:4200, corte:22, color:"#EF4444", pagado:false },
    { id:"t3", nombre:"Platinum", banco:"HSBC", limite:50000, saldo:3200, saldoCorte:3200, corte:8, color:"#3B82F6", pagado:false },
  ],
  variables: [],   // { id, nombre, monto, categoria, metodo, fecha, nota }
  historial: [],   // snapshot por mes
};

// ── CSS ──────────────────────────────────────────────────────────────
const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  html{-webkit-text-size-adjust:100%;}
  body{background:#F0F4FF;}
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px;}
  @keyframes pop{0%{opacity:0;transform:scale(.92) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  .card{animation:pop .2s cubic-bezier(.22,.68,0,1.2);}
  .btn-icon:hover{background:#E2E8F0!important;}
  input,select,textarea{font-size:16px!important;-webkit-appearance:none;border-radius:12px;}
  input:focus,select:focus{outline:none;border-color:#6366F1!important;box-shadow:0 0 0 3px rgba(99,102,241,.15)!important;}
`;

// ── Confirm dialog ───────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel="Sí, eliminar", confirmColor="#EF4444", icon="🗑️", onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)",animation:"fadeIn .15s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:24,padding:"32px 28px",width:"90%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,.18)",animation:"pop .2s cubic-bezier(.22,.68,0,1.2)",fontFamily:"'Plus Jakarta Sans',sans-serif",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:14}}>{icon}</div>
        <h3 style={{fontSize:18,fontWeight:700,color:"#0F172A",marginBottom:8}}>{title}</h3>
        <p style={{fontSize:14,color:"#64748B",lineHeight:1.6,marginBottom:24}}>{message}</p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,background:"#F1F5F9",border:"none",borderRadius:12,padding:"12px 0",color:"#475569",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancelar</button>
          <button onClick={onConfirm} style={{flex:1,background:`linear-gradient(135deg,${confirmColor},${confirmColor}cc)`,border:"none",borderRadius:12,padding:"12px 0",color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal bottom sheet ───────────────────────────────────────────────
function ItemModal({ title, initial, fields, onSave, onClose }) {
  const [form, setForm] = useState(initial || {});
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const valid = fields.filter(f=>f.required).every(f=>form[f.key]!==undefined&&form[f.key]!=="");
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:520,boxShadow:"0 -8px 40px rgba(0,0,0,.14)",animation:"slideUp .25s ease",fontFamily:"'Plus Jakarta Sans',sans-serif",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"#E2E8F0",margin:"0 auto 18px"}}/>
        <h3 style={{fontSize:18,fontWeight:700,color:"#0F172A",marginBottom:18}}>{title}</h3>
        {fields.map(f=>(
          <div key={f.key} style={{marginBottom:13}}>
            <label style={{fontSize:11,fontWeight:700,color:"#64748B",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:.8}}>{f.label}</label>
            {f.type==="select"?(
              <select value={form[f.key]||""} onChange={e=>set(f.key,e.target.value)} style={{width:"100%",background:"#F8FAFC",border:"1.5px solid #E2E8F0",padding:"11px 14px",color:"#0F172A",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                <option value="">Selecciona...</option>
                {f.options.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            ):(
              <input type={f.type||"text"} placeholder={f.placeholder||""} value={form[f.key]!==undefined?form[f.key]:""} onChange={e=>set(f.key,f.type==="number"?Number(e.target.value):e.target.value)}
                style={{width:"100%",background:"#F8FAFC",border:"1.5px solid #E2E8F0",padding:"11px 14px",color:"#0F172A",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
            )}
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={onClose} style={{flex:1,background:"#F1F5F9",border:"none",borderRadius:12,padding:"13px 0",color:"#475569",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Cancelar</button>
          <button onClick={()=>valid&&onSave(form)} style={{flex:2,background:valid?"linear-gradient(135deg,#6366F1,#818CF8)":"#E2E8F0",border:"none",borderRadius:12,padding:"13px 0",color:valid?"#fff":"#94A3B8",fontSize:15,fontWeight:700,cursor:valid?"pointer":"default",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all .2s"}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

const Pill = ({paid}) => (
  <span style={{display:"inline-block",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:99,background:paid?"#DCFCE7":"#FEF2F2",color:paid?"#16A34A":"#DC2626"}}>{paid?"✓ Pagado":"Pendiente"}</span>
);

function ItemRow({item,valueColor="#6366F1",showPaid=false,onEdit,onDelete,onToggle}) {
  return (
    <div className="card" style={{background:"#fff",borderRadius:16,padding:"13px 15px",display:"flex",alignItems:"center",gap:11,boxShadow:"0 1px 4px rgba(0,0,0,.06)",opacity:showPaid&&item.pagado?.7:1,transition:"opacity .2s"}}>
      <span style={{fontSize:21,flexShrink:0}}>{item.icon||"📌"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:600,color:"#1E293B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.nombre}</div>
        {showPaid&&<div style={{marginTop:3}}><Pill paid={item.pagado}/></div>}
      </div>
      <div style={{fontFamily:"'Lora',serif",fontSize:16,color:valueColor,fontWeight:500,flexShrink:0}}>{fmt(item.monto)}</div>
      {showPaid&&<button onClick={onToggle} style={{background:item.pagado?"#F0FDF4":"#FFF7ED",border:`1.5px solid ${item.pagado?"#86EFAC":"#FCA5A5"}`,borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:15,flexShrink:0}}>{item.pagado?"↩":"✓"}</button>}
      <button onClick={onEdit} className="btn-icon" style={{background:"#F8FAFC",border:"1.5px solid #E2E8F0",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:13,flexShrink:0}}>✏️</button>
      <button onClick={onDelete} className="btn-icon" style={{background:"#FFF1F2",border:"1.5px solid #FECDD3",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:13,flexShrink:0}}>🗑</button>
    </div>
  );
}

function ServiceCard({item,onEdit,onDelete,onToggle}) {
  return (
    <div className="card" style={{background:"#fff",borderRadius:18,padding:15,boxShadow:"0 1px 4px rgba(0,0,0,.06)",border:`2px solid ${item.pagado?"#BBF7D0":"#F1F5F9"}`,opacity:item.pagado?.75:1,transition:"all .2s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
        <span style={{fontSize:24}}>{item.icon||"⚡"}</span>
        <Pill paid={item.pagado}/>
      </div>
      <div style={{fontSize:13,fontWeight:600,color:"#334155",marginBottom:3}}>{item.nombre}</div>
      <div style={{fontFamily:"'Lora',serif",fontSize:19,color:"#6366F1",marginBottom:11}}>{fmt(item.monto)}</div>
      <div style={{display:"flex",gap:5}}>
        <button onClick={onToggle} style={{flex:1,background:item.pagado?"#F0FDF4":"#EFF6FF",border:`1.5px solid ${item.pagado?"#86EFAC":"#BFDBFE"}`,borderRadius:8,padding:"7px 0",cursor:"pointer",fontSize:11,fontWeight:700,color:item.pagado?"#16A34A":"#2563EB",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{item.pagado?"↩ Revertir":"✓ Pagar"}</button>
        <button onClick={onEdit} className="btn-icon" style={{background:"#F8FAFC",border:"1.5px solid #E2E8F0",borderRadius:8,width:34,cursor:"pointer",fontSize:12}}>✏️</button>
        <button onClick={onDelete} className="btn-icon" style={{background:"#FFF1F2",border:"1.5px solid #FECDD3",borderRadius:8,width:34,cursor:"pointer",fontSize:12}}>🗑</button>
      </div>
    </div>
  );
}

function CreditCardVis({t,onEdit,onDelete,onToggle}) {
  const pct = Math.min(100,Math.round((t.saldo/t.limite)*100));
  const barColor = pct>80?"#EF4444":pct>50?"#F59E0B":"#10B981";
  const disponible = t.limite-t.saldo;
  const nuevosCargos = t.saldo-(t.saldoCorte||0);
  const hoy = new Date();
  let corteDate = new Date(hoy.getFullYear(),hoy.getMonth(),t.corte);
  if(corteDate<=hoy) corteDate=new Date(hoy.getFullYear(),hoy.getMonth()+1,t.corte);
  const diasCorte = Math.ceil((corteDate-hoy)/(1000*60*60*24));
  return (
    <div className="card" style={{background:"#fff",border:`2px solid ${t.color}33`,borderRadius:20,padding:20,marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.07)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:`linear-gradient(90deg,${t.color},${t.color}88)`,borderRadius:"20px 20px 0 0"}}/>
      <div style={{position:"absolute",top:14,right:14,display:"flex",gap:6}}>
        <button onClick={onEdit} className="btn-icon" style={{background:"#F8FAFC",border:"1.5px solid #E2E8F0",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:12}}>✏️</button>
        <button onClick={onDelete} className="btn-icon" style={{background:"#FFF1F2",border:"1.5px solid #FECDD3",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:12}}>🗑</button>
      </div>
      <div style={{marginBottom:14,paddingTop:4}}>
        <div style={{fontSize:16,fontWeight:700,color:"#1E293B"}}>{t.nombre}</div>
        <div style={{fontSize:12,color:"#94A3B8",marginTop:2,display:"flex",alignItems:"center",gap:8}}>
          <span>{t.banco}</span>
          <span style={{background:diasCorte<=5?"#FEF2F2":"#F0F9FF",color:diasCorte<=5?"#EF4444":"#0EA5E9",padding:"2px 7px",borderRadius:99,fontSize:11,fontWeight:600}}>✂️ Corte en {diasCorte} días</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div style={{background:`${t.color}10`,border:`1.5px solid ${t.color}33`,borderRadius:14,padding:"12px 14px"}}>
          <div style={{fontSize:10,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:600}}>💳 Crédito usado</div>
          <div style={{fontFamily:"'Lora',serif",fontSize:21,color:t.color}}>{fmt(t.saldo)}</div>
          <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{pct}% del límite</div>
        </div>
        <div style={{background:"#F8FAFC",border:"1.5px solid #E2E8F0",borderRadius:14,padding:"12px 14px"}}>
          <div style={{fontSize:10,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontWeight:600}}>📅 Saldo a corte</div>
          <div style={{fontFamily:"'Lora',serif",fontSize:21,color:"#475569"}}>{fmt(t.saldoCorte||0)}</div>
          <div style={{fontSize:11,color:nuevosCargos>0?"#F59E0B":"#94A3B8",marginTop:2}}>{nuevosCargos>0?`+${fmt(nuevosCargos)} nuevos`:"Sin nuevos cargos"}</div>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
          <span style={{fontSize:11,color:"#94A3B8",fontWeight:600}}>Uso del crédito</span>
          <span style={{fontSize:11,color:barColor,fontWeight:700}}>{pct}%</span>
        </div>
        <div style={{height:7,borderRadius:99,background:"#F1F5F9",overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:`linear-gradient(90deg,${barColor}88,${barColor})`,transition:"width .5s ease"}}/>
        </div>
      </div>
      {/* Pago tarjeta */}
      <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid #F1F5F9",alignItems:"center"}}>
        <div style={{display:"flex",gap:16}}>
          {[{label:"Disponible",val:fmt(disponible),c:"#10B981"},{label:"Límite",val:fmt(t.limite),c:"#94A3B8"},{label:"Día corte",val:`Día ${t.corte}`,c:"#6366F1"}].map(s=>(
            <div key={s.label}>
              <div style={{fontSize:10,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.8,marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:12,fontWeight:700,color:s.c}}>{s.val}</div>
            </div>
          ))}
        </div>
        <button onClick={onToggle} style={{background:t.pagado?"#F0FDF4":"#EFF6FF",border:`1.5px solid ${t.pagado?"#86EFAC":"#BFDBFE"}`,borderRadius:10,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:700,color:t.pagado?"#16A34A":"#2563EB",fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap"}}>{t.pagado?"✓ Pagado":"Pagar"}</button>
      </div>
    </div>
  );
}

// ── Variable expense row ─────────────────────────────────────────────
function VarRow({item,onDelete}) {
  return (
    <div className="card" style={{background:"#fff",borderRadius:14,padding:"12px 15px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
      <span style={{fontSize:20,flexShrink:0}}>{item.categoria?.split(" ")[0]||"💸"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:600,color:"#1E293B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.nombre}</div>
        <div style={{fontSize:11,color:"#94A3B8",marginTop:2,display:"flex",gap:8}}>
          <span>{item.categoria?.split(" ").slice(1).join(" ")||"—"}</span>
          <span>·</span>
          <span>{item.metodo?.split(" ").slice(1).join(" ")||"—"}</span>
          <span>·</span>
          <span>{item.fecha||"—"}</span>
        </div>
        {item.nota&&<div style={{fontSize:11,color:"#94A3B8",marginTop:1,fontStyle:"italic"}}>"{item.nota}"</div>}
      </div>
      <div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#EF4444",fontWeight:500,flexShrink:0}}>{fmt(item.monto)}</div>
      <button onClick={onDelete} className="btn-icon" style={{background:"#FFF1F2",border:"1.5px solid #FECDD3",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:12,flexShrink:0}}>🗑</button>
    </div>
  );
}

function SectionHeader({emoji,title,total,color,count,onAdd,addLabel,totalLabel}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontSize:26}}>{emoji}</div>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:"#94A3B8"}}>{title}{count!==undefined?` · ${count} elementos`:""}</div>
          <div style={{fontFamily:"'Lora',serif",fontSize:22,color,fontWeight:500}}>{totalLabel||fmt(total)}</div>
        </div>
      </div>
      {onAdd&&<button onClick={onAdd} style={{background:"linear-gradient(135deg,#6366F1,#818CF8)",border:"none",borderRadius:12,padding:"10px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",boxShadow:"0 4px 12px rgba(99,102,241,.3)"}}>{addLabel}</button>}
    </div>
  );
}

function Empty({msg}) {
  return <div style={{textAlign:"center",padding:"36px 20px",color:"#94A3B8",fontSize:14}}><div style={{fontSize:34,marginBottom:8}}>🗂</div>{msg}</div>;
}

// ── MODAL CONFIGS ────────────────────────────────────────────────────
function modalConfig(section) {
  const base = [{key:"icon",label:"Emoji",placeholder:"💰"},{key:"nombre",label:"Nombre",required:true,placeholder:"Descripción"},{key:"monto",label:"Monto ($)",type:"number",required:true,placeholder:"0"}];
  if(section==="ingresos") return {fields:base,addTitle:"Nuevo ingreso",itemLabel:"ingreso"};
  if(section==="gastos") return {fields:base,addTitle:"Nuevo gasto fijo",itemLabel:"gasto"};
  if(section==="servicios") return {fields:base,addTitle:"Nuevo servicio",itemLabel:"servicio"};
  if(section==="variables") return {fields:[
    {key:"nombre",label:"Descripción",required:true,placeholder:"Ej. Almuerzo"},
    {key:"monto",label:"Monto ($)",type:"number",required:true,placeholder:"0"},
    {key:"categoria",label:"Categoría",type:"select",options:CATEGORIAS},
    {key:"metodo",label:"Método de pago",type:"select",options:METODOS},
    {key:"fecha",label:"Fecha",type:"date",placeholder:hoyStr()},
    {key:"nota",label:"Nota (opcional)",placeholder:"Ej. con la familia"},
  ],addTitle:"Nuevo gasto variable",itemLabel:"gasto variable"};
  if(section==="tarjetas") return {fields:[
    {key:"nombre",label:"Nombre",required:true,placeholder:"Visa Oro"},
    {key:"banco",label:"Banco",placeholder:"BBVA"},
    {key:"limite",label:"Límite de crédito ($)",type:"number",required:true,placeholder:"0"},
    {key:"saldo",label:"Crédito usado ($)",type:"number",placeholder:"0"},
    {key:"saldoCorte",label:"Saldo al último corte ($)",type:"number",placeholder:"0"},
    {key:"corte",label:"Día de corte",type:"number",placeholder:"1"},
    {key:"color",label:"Color",type:"select",options:CARD_COLORS},
  ],addTitle:"Nueva tarjeta",itemLabel:"tarjeta"};
}

// ── APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(()=>{
    try{ const s=localStorage.getItem("finanzas"); return s?JSON.parse(s):SEED; }catch{return SEED;}
  });
  useEffect(()=>{ localStorage.setItem("finanzas",JSON.stringify(data)); },[data]);

  const [tab, setTab] = useState("resumen");
  const [confirm, setConfirm] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [closingMonth, setClosingMonth] = useState(false);

  // ── totals — balance uses ONLY current month spending ──
  const totalIngresos = data.ingresos.reduce((s,x)=>s+x.monto,0);
  const totalGastosFijos = data.gastos.reduce((s,x)=>s+x.monto,0);
  const totalServicios = data.servicios.reduce((s,x)=>s+x.monto,0);
  const totalVariables = data.variables.reduce((s,x)=>s+x.monto,0);
  const totalTarjetasPago = data.tarjetas.reduce((s,x)=>s+(x.saldoCorte||0),0);
  // Balance = ingresos - gastos fijos - servicios - variables - pagos tarjeta corte
  const totalEgresos = totalGastosFijos + totalServicios + totalVariables + totalTarjetasPago;
  const libre = totalIngresos - totalEgresos;
  const totalDeudaTarjetas = data.tarjetas.reduce((s,x)=>s+x.saldo,0);

  const askDelete = (section,id,label) => setConfirm({type:"delete",section,id,label});
  const confirmDelete = () => {
    setData(d=>({...d,[confirm.section]:d[confirm.section].filter(x=>x.id!==confirm.id)}));
    setConfirm(null);
  };

  const toggle = (section,id) =>
    setData(d=>({...d,[section]:d[section].map(x=>x.id===id?{...x,pagado:!x.pagado}:x)}));

  const saveItem = (form) => {
    const {mode,section,item} = editModal;
    if(mode==="add") setData(d=>({...d,[section]:[...d[section],{...form,id:uid(),pagado:false}]}));
    else setData(d=>({...d,[section]:d[section].map(x=>x.id===item.id?{...x,...form}:x)}));
    setEditModal(null);
  };

  const openAdd = s => { const c=modalConfig(s); setEditModal({mode:"add",section:s,item:null,fields:c.fields,title:c.addTitle}); };
  const openEdit = (s,item) => { const c=modalConfig(s); setEditModal({mode:"edit",section:s,item,fields:c.fields,title:"Editar "+c.itemLabel,initial:item}); };

  // ── CERRAR MES ───────────────────────────────────────────────────
  const cerrarMes = () => {
    const mes = hoyMes();
    const snapshot = {
      mes,
      ingresos: totalIngresos,
      gastosFijos: totalGastosFijos,
      servicios: totalServicios,
      variables: totalVariables,
      tarjetas: totalTarjetasPago,
      egresos: totalEgresos,
      libre,
      numVariables: data.variables.length,
      detalleVariables: [...data.variables],
    };
    setData(d=>({
      ...d,
      historial:[snapshot,...d.historial],
      // reset pagados
      gastos: d.gastos.map(x=>({...x,pagado:false})),
      servicios: d.servicios.map(x=>({...x,pagado:false})),
      tarjetas: d.tarjetas.map(x=>({...x,pagado:false,saldoCorte:x.saldo})),
      // limpiar variables del mes
      variables:[],
    }));
    setClosingMonth(false);
    setTab("resumen");
  };

  const TABS = [
    {id:"resumen",label:"Resumen",emoji:"🏠"},
    {id:"ingresos",label:"Ingresos",emoji:"💵"},
    {id:"gastos",label:"Gastos",emoji:"📌"},
    {id:"servicios",label:"Servicios",emoji:"⚡"},
    {id:"variables",label:"Variables",emoji:"🛒"},
    {id:"tarjetas",label:"Tarjetas",emoji:"💳"},
    {id:"historial",label:"Historial",emoji:"📊"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#F0F4FF",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <link href={FONTS} rel="stylesheet"/>
      <style>{CSS}</style>

      {/* TOP BAR */}
      <div style={{background:"linear-gradient(135deg,#6366F1 0%,#818CF8 100%)",padding:"20px 16px 0",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px rgba(99,102,241,.35)"}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.6)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Panel financiero · {hoyMes()}</div>
              <h1 style={{fontFamily:"'Lora',serif",fontSize:24,color:"#fff",fontWeight:500,fontStyle:"italic"}}>Mis Finanzas</h1>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
              <div style={{background:"rgba(255,255,255,.15)",borderRadius:12,padding:"8px 14px",textAlign:"right",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.2)"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,.7)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:1}}>Saldo libre</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:18,color:libre>=0?"#A7F3D0":"#FCA5A5"}}>{fmt(libre)}</div>
              </div>
              <button onClick={()=>setClosingMonth(true)} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.35)",borderRadius:10,padding:"6px 12px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                🔒 Cerrar mes
              </button>
            </div>
          </div>
          <div style={{display:"flex",gap:1,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:tab===t.id?"3px solid #fff":"3px solid transparent",color:tab===t.id?"#fff":"rgba(255,255,255,.5)",padding:"8px 10px 10px",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all .15s"}}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:640,margin:"0 auto",padding:"18px 13px 80px"}}>

        {/* ═══ RESUMEN ═══ */}
        {tab==="resumen"&&(
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            {/* balance card */}
            <div style={{background:"linear-gradient(135deg,#6366F1,#818CF8)",borderRadius:20,padding:"20px 20px",boxShadow:"0 6px 24px rgba(99,102,241,.3)",color:"#fff"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,.7)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Balance del mes</div>
              <div style={{fontFamily:"'Lora',serif",fontSize:34,fontStyle:"italic",marginBottom:4}}>{fmt(libre)}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginBottom:12}}>Ingresos − (Gastos fijos + Servicios + Variables + Pago tarjetas)</div>
              <div style={{height:6,borderRadius:99,background:"rgba(255,255,255,.2)",overflow:"hidden",marginBottom:8}}>
                <div style={{width:`${Math.min(100,Math.max(0,(totalEgresos/totalIngresos)*100))}%`,height:"100%",borderRadius:99,background:"rgba(255,255,255,.6)",transition:"width .5s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"rgba(255,255,255,.75)"}}>
                <span>↑ {fmt(totalIngresos)}</span>
                <span>↓ {fmt(totalEgresos)}</span>
              </div>
            </div>

            {/* stat grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
              {[
                {emoji:"💵",label:"Ingresos",val:totalIngresos,sub:`${data.ingresos.length} fuentes`,c:"#10B981",bg:"#F0FDF4",tab:"ingresos"},
                {emoji:"📌",label:"Gastos fijos",val:totalGastosFijos,sub:`${data.gastos.filter(x=>x.pagado).length}/${data.gastos.length} pagados`,c:"#F59E0B",bg:"#FFFBEB",tab:"gastos"},
                {emoji:"⚡",label:"Servicios",val:totalServicios,sub:`${data.servicios.filter(x=>x.pagado).length}/${data.servicios.length} pagados`,c:"#6366F1",bg:"#EEF2FF",tab:"servicios"},
                {emoji:"🛒",label:"Variables",val:totalVariables,sub:`${data.variables.length} gastos`,c:"#EC4899",bg:"#FDF2F8",tab:"variables"},
                {emoji:"💳",label:"Pago tarjetas",val:totalTarjetasPago,sub:"Saldo a corte",c:"#EF4444",bg:"#FFF1F2",tab:"tarjetas"},
                {emoji:"📊",label:"Deuda total",val:totalDeudaTarjetas,sub:`${data.tarjetas.length} tarjetas`,c:"#94A3B8",bg:"#F8FAFC",tab:"historial"},
              ].map(s=>(
                <button key={s.label} onClick={()=>setTab(s.tab)} style={{background:s.bg,border:`2px solid ${s.c}22`,borderRadius:16,padding:"14px 13px",textAlign:"left",cursor:"pointer",transition:"transform .15s",fontFamily:"'Plus Jakarta Sans',sans-serif"}}
                  onMouseOver={e=>e.currentTarget.style.transform="scale(1.02)"}
                  onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}>
                  <div style={{fontSize:20,marginBottom:6}}>{s.emoji}</div>
                  <div style={{fontSize:10,color:"#94A3B8",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:3}}>{s.label}</div>
                  <div style={{fontFamily:"'Lora',serif",fontSize:19,color:s.c}}>{fmt(s.val)}</div>
                  <div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>{s.sub}</div>
                </button>
              ))}
            </div>

            {/* pendientes */}
            {([...data.gastos,...data.servicios,...data.tarjetas].some(x=>!x.pagado))&&(
              <div style={{background:"#fff",borderRadius:16,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#EF4444",marginBottom:10}}>⚠️ Pendientes de pago</div>
                {[...data.gastos.filter(x=>!x.pagado),...data.servicios.filter(x=>!x.pagado),...data.tarjetas.filter(x=>!x.pagado)].map(item=>(
                  <div key={item.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F1F5F9"}}>
                    <span style={{fontSize:13,color:"#475569"}}>{item.icon||"💳"} {item.nombre}</span>
                    <span style={{fontSize:13,fontWeight:600,color:"#EF4444"}}>{fmt(item.monto||item.saldoCorte||0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ INGRESOS ═══ */}
        {tab==="ingresos"&&(
          <div>
            <SectionHeader emoji="💵" title="Ingresos mensuales" total={totalIngresos} color="#10B981" count={data.ingresos.length} onAdd={()=>openAdd("ingresos")} addLabel="+ Ingreso"/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {data.ingresos.map(item=><ItemRow key={item.id} item={item} valueColor="#10B981" onEdit={()=>openEdit("ingresos",item)} onDelete={()=>askDelete("ingresos",item.id,item.nombre)}/>)}
              {data.ingresos.length===0&&<Empty msg="Sin ingresos registrados"/>}
            </div>
          </div>
        )}

        {/* ═══ GASTOS FIJOS ═══ */}
        {tab==="gastos"&&(
          <div>
            <SectionHeader emoji="📌" title="Gastos fijos" total={totalGastosFijos} color="#F59E0B" count={data.gastos.length} onAdd={()=>openAdd("gastos")} addLabel="+ Gasto"/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {data.gastos.map(item=><ItemRow key={item.id} item={item} valueColor="#F59E0B" showPaid onEdit={()=>openEdit("gastos",item)} onDelete={()=>askDelete("gastos",item.id,item.nombre)} onToggle={()=>toggle("gastos",item.id)}/>)}
              {data.gastos.length===0&&<Empty msg="Sin gastos fijos"/>}
            </div>
          </div>
        )}

        {/* ═══ SERVICIOS ═══ */}
        {tab==="servicios"&&(
          <div>
            <SectionHeader emoji="⚡" title="Servicios" total={totalServicios} color="#6366F1" count={data.servicios.length} onAdd={()=>openAdd("servicios")} addLabel="+ Servicio"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {data.servicios.map(item=><ServiceCard key={item.id} item={item} onEdit={()=>openEdit("servicios",item)} onDelete={()=>askDelete("servicios",item.id,item.nombre)} onToggle={()=>toggle("servicios",item.id)}/>)}
            </div>
            {data.servicios.length===0&&<Empty msg="Sin servicios"/>}
          </div>
        )}

        {/* ═══ VARIABLES ═══ */}
        {tab==="variables"&&(
          <div>
            <SectionHeader emoji="🛒" title="Gastos variables del mes" total={totalVariables} color="#EC4899" count={data.variables.length} onAdd={()=>openAdd("variables")} addLabel="+ Gasto"/>
            {/* por categoría */}
            {CATEGORIAS.map(cat=>{
              const items = data.variables.filter(x=>x.categoria===cat);
              if(items.length===0) return null;
              const subtotal = items.reduce((s,x)=>s+x.monto,0);
              return (
                <div key={cat} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7,padding:"0 2px"}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#475569"}}>{cat}</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#EC4899"}}>{fmt(subtotal)}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {items.map(item=><VarRow key={item.id} item={item} onDelete={()=>askDelete("variables",item.id,item.nombre)}/>)}
                  </div>
                </div>
              );
            })}
            {/* sin categoría */}
            {data.variables.filter(x=>!x.categoria||!CATEGORIAS.includes(x.categoria)).map(item=><VarRow key={item.id} item={item} onDelete={()=>askDelete("variables",item.id,item.nombre)}/>)}
            {data.variables.length===0&&<Empty msg="Sin gastos variables este mes"/>}
          </div>
        )}

        {/* ═══ TARJETAS ═══ */}
        {tab==="tarjetas"&&(
          <div>
            <SectionHeader emoji="💳" title="Mis tarjetas" total={totalDeudaTarjetas} color="#EF4444" count={data.tarjetas.length} onAdd={()=>openAdd("tarjetas")} addLabel="+ Tarjeta"/>
            <div style={{background:"#FFF7ED",border:"1.5px solid #FDE68A",borderRadius:14,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#92400E"}}>
              💡 El <strong>saldo a corte</strong> es lo que se suma al balance del mes. Márcalas como pagadas cuando realices el pago.
            </div>
            {data.tarjetas.map(t=><CreditCardVis key={t.id} t={t} onEdit={()=>openEdit("tarjetas",t)} onDelete={()=>askDelete("tarjetas",t.id,t.nombre)} onToggle={()=>toggle("tarjetas",t.id)}/>)}
            {data.tarjetas.length===0&&<Empty msg="Sin tarjetas registradas"/>}
          </div>
        )}

        {/* ═══ HISTORIAL ═══ */}
        {tab==="historial"&&(
          <div>
            <SectionHeader emoji="📊" title="Historial mensual" total={0} totalLabel={`${data.historial.length} meses`} color="#6366F1"/>
            {data.historial.length===0&&<Empty msg="Aún no has cerrado ningún mes. Cuando cierres el mes actual aparecerá aquí."/>}
            {data.historial.map((h,i)=>(
              <div key={i} className="card" style={{background:"#fff",borderRadius:18,padding:18,marginBottom:12,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:15,fontWeight:700,color:"#1E293B"}}>{h.mes}</div>
                  <div style={{fontFamily:"'Lora',serif",fontSize:18,color:h.libre>=0?"#10B981":"#EF4444"}}>{fmt(h.libre)}</div>
                </div>
                {/* mini bar */}
                <div style={{height:5,borderRadius:99,background:"#F1F5F9",overflow:"hidden",marginBottom:10}}>
                  <div style={{width:`${Math.min(100,(h.egresos/h.ingresos)*100)}%`,height:"100%",borderRadius:99,background:h.libre>=0?"#10B981":"#EF4444"}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {[
                    {label:"Ingresos",val:h.ingresos,c:"#10B981"},
                    {label:"Gastos fijos",val:h.gastosFijos,c:"#F59E0B"},
                    {label:"Servicios",val:h.servicios,c:"#6366F1"},
                    {label:"Variables",val:h.variables,c:"#EC4899"},
                    {label:"Tarjetas",val:h.tarjetas,c:"#EF4444"},
                    {label:"Total egresos",val:h.egresos,c:"#94A3B8"},
                  ].map(s=>(
                    <div key={s.label} style={{background:"#F8FAFC",borderRadius:10,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.8,marginBottom:3}}>{s.label}</div>
                      <div style={{fontSize:13,fontWeight:700,color:s.c,fontFamily:"'Lora',serif"}}>{fmt(s.val)}</div>
                    </div>
                  ))}
                </div>
                {h.detalleVariables?.length>0&&(
                  <details style={{marginTop:10}}>
                    <summary style={{fontSize:12,color:"#6366F1",cursor:"pointer",fontWeight:600}}>Ver {h.detalleVariables.length} gastos variables</summary>
                    <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
                      {h.detalleVariables.map((v,j)=>(
                        <div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#475569",padding:"4px 0",borderBottom:"1px solid #F1F5F9"}}>
                          <span>{v.categoria?.split(" ")[0]} {v.nombre}</span>
                          <span style={{fontWeight:600,color:"#EC4899"}}>{fmt(v.monto)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRM DELETE */}
      {confirm?.type==="delete"&&(
        <ConfirmDialog title="¿Eliminar este elemento?" message={<>Vas a eliminar <strong>"{confirm.label}"</strong>. Esta acción no se puede deshacer.</>} onConfirm={confirmDelete} onCancel={()=>setConfirm(null)}/>
      )}

      {/* CERRAR MES CONFIRM */}
      {closingMonth&&(
        <ConfirmDialog
          icon="🔒"
          title={`¿Cerrar ${hoyMes()}?`}
          message="Se guardará un resumen del mes en el historial. Los pagos se resetearán a 'pendiente' y los gastos variables se limpiarán para el mes nuevo."
          confirmLabel="Sí, cerrar mes"
          confirmColor="#6366F1"
          onConfirm={cerrarMes}
          onCancel={()=>setClosingMonth(false)}
        />
      )}

      {/* EDIT/ADD MODAL */}
      {editModal&&(
        <ItemModal title={editModal.title} fields={editModal.fields} initial={editModal.mode==="edit"?editModal.item:undefined} onSave={saveItem} onClose={()=>setEditModal(null)}/>
      )}
    </div>
  );
}
