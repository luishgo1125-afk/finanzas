import { useState, useEffect } from 'react';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:ital,wght@0,500;1,400&display=swap';

// ─── helpers ───────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
const uid = () => Math.random().toString(36).slice(2);

// ─── seed data ─────────────────────────────────────────────────────
const SEED = {
  ingresos: [
    { id: 'i1', nombre: 'Salario principal', monto: 25000, icon: '💼' },
    { id: 'i2', nombre: 'Freelance', monto: 5000, icon: '💻' },
  ],
  gastos: [
    {
      id: 'g1',
      nombre: 'Renta / Hipoteca',
      monto: 8000,
      icon: '🏠',
      pagado: true,
    },
    {
      id: 'g2',
      nombre: 'Seguro de auto',
      monto: 900,
      icon: '🚗',
      pagado: false,
    },
    { id: 'g3', nombre: 'Gimnasio', monto: 550, icon: '🏋️', pagado: true },
  ],
  servicios: [
    { id: 's1', nombre: 'Internet', monto: 450, icon: '📡', pagado: true },
    { id: 's2', nombre: 'Luz', monto: 380, icon: '💡', pagado: false },
    { id: 's3', nombre: 'Agua', monto: 150, icon: '💧', pagado: true },
    { id: 's4', nombre: 'Netflix', monto: 219, icon: '🎬', pagado: true },
    { id: 's5', nombre: 'Spotify', monto: 99, icon: '🎵', pagado: false },
    { id: 's6', nombre: 'Gas', monto: 200, icon: '🔥', pagado: false },
  ],
  tarjetas: [
    {
      id: 't1',
      nombre: 'Visa Oro',
      banco: 'BBVA',
      limite: 30000,
      saldo: 12400,
      corte: 15,
      color: '#F59E0B',
    },
    {
      id: 't2',
      nombre: 'Mastercard',
      banco: 'Banamex',
      limite: 20000,
      saldo: 5800,
      corte: 22,
      color: '#EF4444',
    },
    {
      id: 't3',
      nombre: 'Platinum',
      banco: 'HSBC',
      limite: 50000,
      saldo: 3200,
      corte: 8,
      color: '#3B82F6',
    },
  ],
};

// ─── CSS ────────────────────────────────────────────────────────────
const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#F0F4FF;}
  ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px;}
  @keyframes pop{0%{opacity:0;transform:scale(.92) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
  .card{animation:pop .22s cubic-bezier(.22,.68,0,1.2);}
  .btn-icon:hover{background:#E2E8F0!important;}
  input:focus{outline:none;border-color:#6366F1!important;box-shadow:0 0 0 3px rgba(99,102,241,.15)!important;}
  select:focus{outline:none;border-color:#6366F1!important;}
`;

// ─── Confirm Dialog ────────────────────────────────────────────────
function ConfirmDialog({ item, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.55)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn .15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: '32px 28px',
          width: '90%',
          maxWidth: 360,
          boxShadow: '0 20px 60px rgba(0,0,0,.18)',
          animation: 'pop .2s cubic-bezier(.22,.68,0,1.2)',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 14 }}>🗑️</div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: 8,
          }}
        >
          ¿Eliminar este elemento?
        </h3>
        <p
          style={{
            fontSize: 14,
            color: '#64748B',
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Vas a eliminar <strong style={{ color: '#0F172A' }}>"{item}"</strong>.
          <br />
          Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: '#F1F5F9',
              border: 'none',
              borderRadius: 12,
              padding: '12px 0',
              color: '#475569',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg,#EF4444,#DC2626)',
              border: 'none',
              borderRadius: 12,
              padding: '12px 0',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit / Add Modal ──────────────────────────────────────────────
function ItemModal({ title, initial, fields, onSave, onClose }) {
  const [form, setForm] = useState(initial || {});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const valid = fields
    .filter((f) => f.required)
    .every((f) => form[f.key] !== undefined && form[f.key] !== '');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '28px 20px 36px',
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 -8px 40px rgba(0,0,0,.14)',
          animation: 'slideDown .22s ease',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: '#E2E8F0',
            margin: '0 auto 20px',
          }}
        />
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: 20,
          }}
        >
          {title}
        </h3>
        {fields.map((f) => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#64748B',
                display: 'block',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              {f.label}
            </label>
            {f.type === 'select' ? (
              <select
                value={form[f.key] || ''}
                onChange={(e) => set(f.key, e.target.value)}
                style={{
                  width: '100%',
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '11px 14px',
                  color: '#0F172A',
                  fontSize: 14,
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || 'text'}
                placeholder={f.placeholder || ''}
                value={form[f.key] !== undefined ? form[f.key] : ''}
                onChange={(e) =>
                  set(
                    f.key,
                    f.type === 'number'
                      ? Number(e.target.value)
                      : e.target.value
                  )
                }
                style={{
                  width: '100%',
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '11px 14px',
                  color: '#0F172A',
                  fontSize: 14,
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              />
            )}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: '#F1F5F9',
              border: 'none',
              borderRadius: 12,
              padding: '13px 0',
              color: '#475569',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => valid && onSave(form)}
            style={{
              flex: 2,
              background: valid
                ? 'linear-gradient(135deg,#6366F1,#818CF8)'
                : '#E2E8F0',
              border: 'none',
              borderRadius: 12,
              padding: '13px 0',
              color: valid ? '#fff' : '#94A3B8',
              fontSize: 14,
              fontWeight: 700,
              cursor: valid ? 'pointer' : 'default',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              transition: 'all .2s',
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pill badge ────────────────────────────────────────────────────
const Pill = ({ paid }) => (
  <span
    style={{
      display: 'inline-block',
      fontSize: 10,
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: 99,
      letterSpacing: 0.5,
      background: paid ? '#DCFCE7' : '#FEF2F2',
      color: paid ? '#16A34A' : '#DC2626',
    }}
  >
    {paid ? '✓ Pagado' : 'Pendiente'}
  </span>
);

// ─── Generic item row ──────────────────────────────────────────────
function ItemRow({
  item,
  valueColor = '#6366F1',
  showPaid = false,
  onEdit,
  onDelete,
  onToggle,
}) {
  return (
    <div
      className="card"
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        opacity: showPaid && item.pagado ? 0.7 : 1,
        transition: 'opacity .2s',
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon || '📌'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1E293B',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.nombre}
        </div>
        {showPaid && (
          <div style={{ marginTop: 3 }}>
            <Pill paid={item.pagado} />
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: "'Lora',serif",
          fontSize: 17,
          color: valueColor,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {fmt(item.monto)}
      </div>
      {showPaid && (
        <button
          onClick={onToggle}
          title="Cambiar estado"
          style={{
            background: item.pagado ? '#F0FDF4' : '#FFF7ED',
            border: `1.5px solid ${item.pagado ? '#86EFAC' : '#FCA5A5'}`,
            borderRadius: 8,
            width: 32,
            height: 32,
            cursor: 'pointer',
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          {item.pagado ? '↩' : '✓'}
        </button>
      )}
      <button
        onClick={onEdit}
        className="btn-icon"
        title="Editar"
        style={{
          background: '#F8FAFC',
          border: '1.5px solid #E2E8F0',
          borderRadius: 8,
          width: 32,
          height: 32,
          cursor: 'pointer',
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        ✏️
      </button>
      <button
        onClick={onDelete}
        className="btn-icon"
        title="Eliminar"
        style={{
          background: '#FFF1F2',
          border: '1.5px solid #FECDD3',
          borderRadius: 8,
          width: 32,
          height: 32,
          cursor: 'pointer',
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        🗑
      </button>
    </div>
  );
}

// ─── Service card (grid) ───────────────────────────────────────────
function ServiceCard({ item, onEdit, onDelete, onToggle }) {
  return (
    <div
      className="card"
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        border: `2px solid ${item.pagado ? '#BBF7D0' : '#F1F5F9'}`,
        opacity: item.pagado ? 0.75 : 1,
        transition: 'all .2s',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 26 }}>{item.icon || '⚡'}</span>
        <Pill paid={item.pagado} />
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#334155',
          marginBottom: 4,
        }}
      >
        {item.nombre}
      </div>
      <div
        style={{
          fontFamily: "'Lora',serif",
          fontSize: 20,
          color: '#6366F1',
          marginBottom: 12,
        }}
      >
        {fmt(item.monto)}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onToggle}
          style={{
            flex: 1,
            background: item.pagado ? '#F0FDF4' : '#EFF6FF',
            border: `1.5px solid ${item.pagado ? '#86EFAC' : '#BFDBFE'}`,
            borderRadius: 8,
            padding: '6px 0',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            color: item.pagado ? '#16A34A' : '#2563EB',
            fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}
        >
          {item.pagado ? '↩ Revertir' : '✓ Pagar'}
        </button>
        <button
          onClick={onEdit}
          className="btn-icon"
          style={{
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: 8,
            width: 32,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          className="btn-icon"
          style={{
            background: '#FFF1F2',
            border: '1.5px solid #FECDD3',
            borderRadius: 8,
            width: 32,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ─── Credit card visual ────────────────────────────────────────────
function CreditCardVis({ t, onEdit, onDelete }) {
  const pct = Math.min(100, Math.round((t.saldo / t.limite) * 100));
  const barColor = pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#10B981';
  const disponible = t.limite - t.saldo;
  return (
    <div
      className="card"
      style={{
        background: `linear-gradient(135deg, ${t.color}22 0%, #fff 60%)`,
        border: `2px solid ${t.color}44`,
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,.07)',
        position: 'relative',
      }}
    >
      {/* actions */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          display: 'flex',
          gap: 6,
        }}
      >
        <button
          onClick={onEdit}
          className="btn-icon"
          title="Editar"
          style={{
            background: 'rgba(255,255,255,.8)',
            border: '1.5px solid #E2E8F0',
            borderRadius: 8,
            width: 30,
            height: 30,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          className="btn-icon"
          title="Eliminar"
          style={{
            background: '#FFF1F2',
            border: '1.5px solid #FECDD3',
            borderRadius: 8,
            width: 30,
            height: 30,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          🗑
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
          {t.nombre}
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
          {t.banco} · Corte día {t.corte}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          Saldo actual
        </div>
        <div
          style={{
            fontFamily: "'Lora',serif",
            fontSize: 28,
            color: t.color,
            fontWeight: 500,
          }}
        >
          {fmt(t.saldo)}
        </div>
      </div>

      {/* bar */}
      <div
        style={{
          height: 7,
          borderRadius: 99,
          background: '#F1F5F9',
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 99,
            background: barColor,
            transition: 'width .5s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {[
          { label: 'Disponible', val: fmt(disponible), c: '#10B981' },
          { label: 'Usado', val: `${pct}%`, c: barColor },
          { label: 'Límite', val: fmt(t.limite), c: '#94A3B8' },
        ].map((s) => (
          <div key={s.label}>
            <div
              style={{
                fontSize: 10,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: s.c,
                marginTop: 2,
              }}
            >
              {s.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────
function SectionHeader({ emoji, title, total, color, count, onAdd, addLabel }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 28 }}>{emoji}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>
            {title} · {count} {count === 1 ? 'elemento' : 'elementos'}
          </div>
          <div
            style={{
              fontFamily: "'Lora',serif",
              fontSize: 22,
              color,
              fontWeight: 500,
            }}
          >
            {fmt(total)}
          </div>
        </div>
      </div>
      <button
        onClick={onAdd}
        style={{
          background: 'linear-gradient(135deg,#6366F1,#818CF8)',
          border: 'none',
          borderRadius: 12,
          padding: '10px 16px',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          boxShadow: '0 4px 12px rgba(99,102,241,.3)',
        }}
      >
        {addLabel}
      </button>
    </div>
  );
}

// ─── APP ────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(SEED);
  const [tab, setTab] = useState('resumen');
  const [confirm, setConfirm] = useState(null); // {section, id, label}
  const [editModal, setEditModal] = useState(null); // {mode:"add"|"edit", section, item, fields, title}

  // totals
  const T = {
    ingresos: data.ingresos.reduce((s, x) => s + x.monto, 0),
    gastos: data.gastos.reduce((s, x) => s + x.monto, 0),
    servicios: data.servicios.reduce((s, x) => s + x.monto, 0),
    tarjetas: data.tarjetas.reduce((s, x) => s + x.saldo, 0),
  };
  T.egresos = T.gastos + T.servicios;
  T.libre = T.ingresos - T.egresos;

  // delete
  const askDelete = (section, id, label) => setConfirm({ section, id, label });
  const confirmDelete = () => {
    if (!confirm) return;
    setData((d) => ({
      ...d,
      [confirm.section]: d[confirm.section].filter((x) => x.id !== confirm.id),
    }));
    setConfirm(null);
  };

  // toggle pagado
  const toggle = (section, id) =>
    setData((d) => ({
      ...d,
      [section]: d[section].map((x) =>
        x.id === id ? { ...x, pagado: !x.pagado } : x
      ),
    }));

  // save (add or edit)
  const saveItem = (form) => {
    const { mode, section, item } = editModal;
    if (mode === 'add') {
      setData((d) => ({
        ...d,
        [section]: [...d[section], { ...form, id: uid() }],
      }));
    } else {
      setData((d) => ({
        ...d,
        [section]: d[section].map((x) =>
          x.id === item.id ? { ...x, ...form } : x
        ),
      }));
    }
    setEditModal(null);
  };

  // open modals helpers
  const openAdd = (section) => {
    const cfg = modalConfig(section);
    setEditModal({
      mode: 'add',
      section,
      item: null,
      fields: cfg.fields,
      title: cfg.addTitle,
    });
  };
  const openEdit = (section, item) => {
    const cfg = modalConfig(section);
    setEditModal({
      mode: 'edit',
      section,
      item,
      fields: cfg.fields,
      title: 'Editar ' + cfg.itemLabel,
      initial: item,
    });
  };

  const TABS = [
    { id: 'resumen', label: 'Resumen', emoji: '🏠' },
    { id: 'ingresos', label: 'Ingresos', emoji: '💵' },
    { id: 'gastos', label: 'Gastos', emoji: '📌' },
    { id: 'servicios', label: 'Servicios', emoji: '⚡' },
    { id: 'tarjetas', label: 'Tarjetas', emoji: '💳' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F0F4FF',
        fontFamily: "'Plus Jakarta Sans',sans-serif",
      }}
    >
      <link href={FONTS} rel="stylesheet" />
      <style>{CSS}</style>

      {/* ── TOP BAR ── */}
      <div
        style={{
          background: 'linear-gradient(135deg,#6366F1 0%,#818CF8 100%)',
          padding: '22px 20px 0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 20px rgba(99,102,241,.35)',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,.6)',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  marginBottom: 3,
                }}
              >
                Panel financiero
              </div>
              <h1
                style={{
                  fontFamily: "'Lora',serif",
                  fontSize: 26,
                  color: '#fff',
                  fontWeight: 500,
                  fontStyle: 'italic',
                }}
              >
                Mis Finanzas
              </h1>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,.15)',
                borderRadius: 14,
                padding: '10px 16px',
                textAlign: 'right',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,.2)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,.7)',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  marginBottom: 2,
                }}
              >
                Saldo libre
              </div>
              <div
                style={{
                  fontFamily: "'Lora',serif",
                  fontSize: 20,
                  color: T.libre >= 0 ? '#A7F3D0' : '#FCA5A5',
                  fontWeight: 500,
                }}
              >
                {fmt(T.libre)}
              </div>
            </div>
          </div>

          {/* tabs */}
          <div
            style={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              paddingBottom: 0,
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom:
                    tab === t.id ? '3px solid #fff' : '3px solid transparent',
                  color: tab === t.id ? '#fff' : 'rgba(255,255,255,.55)',
                  padding: '8px 12px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  transition: 'all .15s',
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div
        style={{ maxWidth: 640, margin: '0 auto', padding: '20px 14px 80px' }}
      >
        {/* ═══ RESUMEN ═══ */}
        {tab === 'resumen' && <Resumen T={T} data={data} setTab={setTab} />}

        {/* ═══ INGRESOS ═══ */}
        {tab === 'ingresos' && (
          <div>
            <SectionHeader
              emoji="💵"
              title="Ingresos mensuales"
              total={T.ingresos}
              color="#10B981"
              count={data.ingresos.length}
              onAdd={() => openAdd('ingresos')}
              addLabel="+ Ingreso"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.ingresos.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  valueColor="#10B981"
                  onEdit={() => openEdit('ingresos', item)}
                  onDelete={() => askDelete('ingresos', item.id, item.nombre)}
                />
              ))}
              {data.ingresos.length === 0 && (
                <Empty msg="Sin ingresos registrados" />
              )}
            </div>
          </div>
        )}

        {/* ═══ GASTOS ═══ */}
        {tab === 'gastos' && (
          <div>
            <SectionHeader
              emoji="📌"
              title="Gastos fijos"
              total={T.gastos}
              color="#F59E0B"
              count={data.gastos.length}
              onAdd={() => openAdd('gastos')}
              addLabel="+ Gasto"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.gastos.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  valueColor="#F59E0B"
                  showPaid
                  onEdit={() => openEdit('gastos', item)}
                  onDelete={() => askDelete('gastos', item.id, item.nombre)}
                  onToggle={() => toggle('gastos', item.id)}
                />
              ))}
              {data.gastos.length === 0 && <Empty msg="Sin gastos fijos" />}
            </div>
          </div>
        )}

        {/* ═══ SERVICIOS ═══ */}
        {tab === 'servicios' && (
          <div>
            <SectionHeader
              emoji="⚡"
              title="Servicios"
              total={T.servicios}
              color="#6366F1"
              count={data.servicios.length}
              onAdd={() => openAdd('servicios')}
              addLabel="+ Servicio"
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              {data.servicios.map((item) => (
                <ServiceCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEdit('servicios', item)}
                  onDelete={() => askDelete('servicios', item.id, item.nombre)}
                  onToggle={() => toggle('servicios', item.id)}
                />
              ))}
            </div>
            {data.servicios.length === 0 && (
              <Empty msg="Sin servicios registrados" />
            )}
          </div>
        )}

        {/* ═══ TARJETAS ═══ */}
        {tab === 'tarjetas' && (
          <div>
            <SectionHeader
              emoji="💳"
              title="Mis tarjetas"
              total={T.tarjetas}
              color="#EF4444"
              count={data.tarjetas.length}
              onAdd={() => openAdd('tarjetas')}
              addLabel="+ Tarjeta"
            />
            {data.tarjetas.map((t) => (
              <CreditCardVis
                key={t.id}
                t={t}
                onEdit={() => openEdit('tarjetas', t)}
                onDelete={() => askDelete('tarjetas', t.id, t.nombre)}
              />
            ))}
            {data.tarjetas.length === 0 && (
              <Empty msg="Sin tarjetas registradas" />
            )}
          </div>
        )}
      </div>

      {/* ── CONFIRM DIALOG ── */}
      {confirm && (
        <ConfirmDialog
          item={confirm.label}
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── EDIT / ADD MODAL ── */}
      {editModal && (
        <ItemModal
          title={editModal.title}
          fields={editModal.fields}
          initial={editModal.mode === 'edit' ? editModal.item : undefined}
          onSave={saveItem}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}

// ─── Resumen tab ────────────────────────────────────────────────────
function Resumen({ T, data, setTab }) {
  const pagadosG = data.gastos.filter((x) => x.pagado).length;
  const pagadosS = data.servicios.filter((x) => x.pagado).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* big balance card */}
      <div
        style={{
          background: 'linear-gradient(135deg,#6366F1,#818CF8)',
          borderRadius: 20,
          padding: '22px 20px',
          boxShadow: '0 6px 24px rgba(99,102,241,.3)',
          color: '#fff',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,.7)',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 6,
          }}
        >
          Balance del mes
        </div>
        <div
          style={{
            fontFamily: "'Lora',serif",
            fontSize: 36,
            fontStyle: 'italic',
            marginBottom: 16,
          }}
        >
          {fmt(T.libre)}
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 99,
            background: 'rgba(255,255,255,.2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(
                100,
                Math.max(0, (T.egresos / T.ingresos) * 100)
              )}%`,
              height: '100%',
              borderRadius: 99,
              background: 'rgba(255,255,255,.6)',
              transition: 'width .5s',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: 12,
            color: 'rgba(255,255,255,.75)',
          }}
        >
          <span>Ingresos: {fmt(T.ingresos)}</span>
          <span>Egresos: {fmt(T.egresos)}</span>
        </div>
      </div>

      {/* 4 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          {
            emoji: '💵',
            label: 'Ingresos',
            val: T.ingresos,
            sub: `${data.ingresos.length} fuentes`,
            c: '#10B981',
            bg: '#F0FDF4',
            tab: 'ingresos',
          },
          {
            emoji: '📌',
            label: 'Gastos fijos',
            val: T.gastos,
            sub: `${pagadosG}/${data.gastos.length} pagados`,
            c: '#F59E0B',
            bg: '#FFFBEB',
            tab: 'gastos',
          },
          {
            emoji: '⚡',
            label: 'Servicios',
            val: T.servicios,
            sub: `${pagadosS}/${data.servicios.length} pagados`,
            c: '#6366F1',
            bg: '#EEF2FF',
            tab: 'servicios',
          },
          {
            emoji: '💳',
            label: 'Deuda tarjetas',
            val: T.tarjetas,
            sub: `${data.tarjetas.length} tarjetas`,
            c: '#EF4444',
            bg: '#FFF1F2',
            tab: 'tarjetas',
          },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setTab(s.tab)}
            style={{
              background: s.bg,
              border: `2px solid ${s.c}22`,
              borderRadius: 18,
              padding: '16px 14px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform .15s',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = 'scale(1.02)')
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.emoji}</div>
            <div
              style={{
                fontSize: 11,
                color: '#94A3B8',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 4,
              }}
            >
              {s.label}
            </div>
            <div
              style={{ fontFamily: "'Lora',serif", fontSize: 20, color: s.c }}
            >
              {fmt(s.val)}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
              {s.sub}
            </div>
          </button>
        ))}
      </div>

      {/* pending items */}
      {(data.gastos.some((x) => !x.pagado) ||
        data.servicios.some((x) => !x.pagado)) && (
        <div
          style={{
            background: '#fff',
            borderRadius: 18,
            padding: '16px 18px',
            boxShadow: '0 1px 6px rgba(0,0,0,.06)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#EF4444',
              marginBottom: 12,
            }}
          >
            ⚠️ Pendientes de pago
          </div>
          {[
            ...data.gastos.filter((x) => !x.pagado),
            ...data.servicios.filter((x) => !x.pagado),
          ].map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '7px 0',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <span style={{ fontSize: 13, color: '#475569' }}>
                {item.icon} {item.nombre}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#EF4444' }}>
                {fmt(item.monto)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────
function Empty({ msg }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: '#94A3B8',
        fontSize: 14,
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 10 }}>🗂</div>
      {msg}
    </div>
  );
}

// ─── modal field configs ────────────────────────────────────────────
function modalConfig(section) {
  const base = [
    { key: 'icon', label: 'Emoji / Ícono', placeholder: '💰' },
    {
      key: 'nombre',
      label: 'Nombre',
      required: true,
      placeholder: 'Descripción',
    },
    {
      key: 'monto',
      label: 'Monto mensual ($)',
      type: 'number',
      required: true,
      placeholder: '0',
    },
  ];
  if (section === 'ingresos')
    return { fields: base, addTitle: 'Nuevo ingreso', itemLabel: 'ingreso' };
  if (section === 'gastos')
    return { fields: base, addTitle: 'Nuevo gasto fijo', itemLabel: 'gasto' };
  if (section === 'servicios')
    return { fields: base, addTitle: 'Nuevo servicio', itemLabel: 'servicio' };
  if (section === 'tarjetas')
    return {
      fields: [
        {
          key: 'nombre',
          label: 'Nombre (ej. Visa Oro)',
          required: true,
          placeholder: 'Visa Oro',
        },
        { key: 'banco', label: 'Banco', placeholder: 'BBVA' },
        {
          key: 'limite',
          label: 'Límite de crédito ($)',
          type: 'number',
          required: true,
          placeholder: '0',
        },
        {
          key: 'saldo',
          label: 'Saldo actual usado ($)',
          type: 'number',
          placeholder: '0',
        },
        {
          key: 'corte',
          label: 'Día de corte',
          type: 'number',
          placeholder: '1',
        },
        {
          key: 'color',
          label: 'Color de acento',
          type: 'select',
          options: [
            '#6366F1',
            '#EF4444',
            '#F59E0B',
            '#10B981',
            '#3B82F6',
            '#EC4899',
            '#8B5CF6',
          ],
        },
      ],
      addTitle: 'Nueva tarjeta',
      itemLabel: 'tarjeta',
    };
}
