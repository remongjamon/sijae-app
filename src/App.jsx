import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove, child } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDCKnaQgm40GjaAR0gPEXu9Gkf2TZyTHA0",
  authDomain: "emart24lotto.firebaseapp.com",
  databaseURL: "https://emart24lotto-default-rtdb.firebaseio.com",
  projectId: "emart24lotto",
  storageBucket: "emart24lotto.firebasestorage.app",
  messagingSenderId: "321847097822",
  appId: "1:321847097822:web:6685d7e295d8b0e9a1854f"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

window._storage = {
  async get(key) {
    try {
      const snap = await get(child(ref(db), 'data/' + key.replace(/[.#$[\]]/g, '_')));
      if (snap.exists()) return { value: snap.val() };
      return null;
    } catch(e) { return null; }
  },
  async set(key, value) {
    try {
      await set(ref(db, 'data/' + key.replace(/[.#$[\]]/g, '_')), value);
      return { key, value };
    } catch(e) { return null; }
  },
  async delete(key) {
    try {
      await remove(ref(db, 'data/' + key.replace(/[.#$[\]]/g, '_')));
      return { key, deleted: true };
    } catch(e) { return null; }
  },
  async list(prefix) {
    try {
      const snap = await get(ref(db, 'data'));
      if (!snap.exists()) return { keys: [] };
      const keys = Object.keys(snap.val())
        .filter(k => k.startsWith(prefix.replace(/[.#$[\]]/g, '_')))
        .map(k => k);
      return { keys };
    } catch(e) { return { keys: [] }; }
  }
};
import {
  Calendar, ClipboardList, BarChart3, Package,
  ChevronLeft, ChevronRight, Save, AlertCircle, CheckCircle2,
  Trash2, Lock, Copy, MessageSquare, Shield, Settings as Gear
} from 'lucide-react';

/* ── constants ── */
const DEF_SIJAE = 240000;
const R1 = 200;
const R2 = 100;
const SHIFTS = ['오전', '오후', '야간'];
const SC = {
  '오전': 'bg-amber-100 text-amber-700',
  '오후': 'bg-indigo-100 text-indigo-700',
  '야간': 'bg-violet-100 text-violet-700',
};
const DENOM = [
  { v: 50000, l: '5만원', k: 'b50k' },
  { v: 10000, l: '1만원', k: 'b10k' },
  { v: 5000, l: '5천원', k: 'b5k' },
  { v: 1000, l: '1천원', k: 'b1k' },
];

/* ── helpers ── */
function won(n) {
  if (n == null || isNaN(n)) return '0';
  return new Intl.NumberFormat('ko-KR').format(Math.round(n));
}
function toN(v) {
  if (v === '' || v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayStr() { return ymd(new Date()); }
function addD(s, n) {
  const d = new Date(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}
function nextNum(end, roll) {
  if (end === '' || end == null) return '';
  const n = Number(end);
  if (isNaN(n) || n <= 0) return '';
  return String((n % roll) + 1);
}
function t1Cnt(s, e) {
  if (s === '' || e === '' || s == null || e == null) return 0;
  const a = Number(s), b = Number(e);
  if (isNaN(a) || isNaN(b)) return 0;
  return b < a ? b - a + R1 + 1 : b - a + 1;
}
function t2Cnt(s, e) {
  if (s === '' || e === '' || s == null || e == null) return 0;
  const a = Number(s), b = Number(e);
  if (isNaN(a) || isNaN(b)) return 0;
  return b < a ? b - a + R2 + 1 : b - a + 1;
}
function prevKey(d, sh) {
  if (sh === '오전') return addD(d, -1) + ':야간';
  if (sh === '오후') return d + ':오전';
  return d + ':오후';
}
function lottoRefKey(d, sh) {
  if (sh === '오전') return null;
  if (sh === '오후') return d + ':오전';
  return d + ':오후';
}
function emptyRec() {
  return {
    t1s: '', t1e: '', t2s: '', t2e: '',
    pension: '', lotto: '', lottoPay: '', paperPay: '', transfer: '',
    b50k: '', b10k: '', b5k: '', b1k: '', bEtc: '',
    note: '', handover: '',
  };
}
function getCash(r) {
  return toN(r.b50k) * 50000 + toN(r.b10k) * 10000 + toN(r.b5k) * 5000 + toN(r.b1k) * 1000 + toN(r.bEtc);
}
function calcDerived(rec, shift, refRec, sijae) {
  const t1 = t1Cnt(rec.t1s, rec.t1e);
  const t2 = t2Cnt(rec.t2s, rec.t2e);
  const pension = toN(rec.pension);
  const lotto = toN(rec.lotto);
  const lottoPay = toN(rec.lottoPay);
  const paperPay = toN(rec.paperPay);
  const transfer = toN(rec.transfer);
  const cash = getCash(rec);
  let pureSales = lotto;
  let purePay = lottoPay;
  if (shift !== '오전' && refRec) {
    pureSales = lotto - toN(refRec.lotto);
    purePay = lottoPay - toN(refRec.lottoPay);
  }
  const totalSales = t1 * 1000 + t2 * 2000 + pension + pureSales;
  const totalPay = paperPay + purePay;
  const hasCash = rec.b50k !== '' || rec.b10k !== '' || rec.b5k !== '' || rec.b1k !== '' || rec.bEtc !== '';
  const variance = hasCash ? cash - (totalSales - totalPay - transfer) - sijae : null;
  const deposit = hasCash ? cash - sijae : null;
  return { t1, t2, pureSales, purePay, totalSales, totalPay, variance, deposit, cash };
}

/* ── small shared components ── */
function Sec({ t, sub, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1 px-0.5">
        <h3 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">{t}</h3>
        {sub && <span className="text-[10px] text-stone-400">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function NavBtn({ active, onClick, icon, label, locked }) {
  return (
    <button
      onClick={onClick}
      className={
        'flex flex-col items-center gap-0.5 py-2 transition ' +
        (active ? 'text-stone-900' : 'text-stone-400')
      }
    >
      {icon}
      <span className="text-[10px] font-medium flex items-center gap-0.5">
        {label}
        {locked && <Lock size={8} />}
      </span>
    </button>
  );
}

function PinModal({ pin, onOk, onCancel, onBad }) {
  const [v, setV] = useState('');
  const go = () => {
    if (v === pin) { onOk(); }
    else { onBad(); setV(''); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-xs">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-stone-700" />
          <h3 className="font-semibold text-sm">관리자 비밀번호</h3>
        </div>
        <input
          type="password" inputMode="numeric" autoFocus
          value={v}
          onChange={(e) => setV(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
          placeholder="비밀번호 입력"
          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-center text-lg tracking-widest tabular-nums focus:outline-none focus:border-stone-400 mb-3"
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium">취소</button>
          <button onClick={go} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium">확인</button>
        </div>
      </div>
    </div>
  );
}

/* ══════ APP ══════ */
export default function App() {
  const [tab, setTab] = useState('input');
  const [recs, setRecs] = useState({});
  const [incoming, setIncoming] = useState({});
  const [initStock, setInitStock] = useState({ t1: 0, t2: 0, pen: 0, date: todayStr() });
  const [sett, setSett] = useState({ sijae: DEF_SIJAE, pin: '' });
  const [role, setRole] = useState('staff');
  const [pinCb, setPinCb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window._storage.list('r:', true);
        const all = {};
        if (res && res.keys) {
          await Promise.all(res.keys.map(async (k) => {
            try {
              const r = await window._storage.get(k, true);
              if (r && r.value) all[k.replace('r:', '')] = JSON.parse(r.value);
            } catch (e) { /* skip */ }
          }));
        }
        setRecs(all);
      } catch (e) { /* skip */ }
      try {
        const s = await window._storage.get('sett', true);
        if (s && s.value) {
          const p = JSON.parse(s.value);
          setSett({ sijae: p.sijae || DEF_SIJAE, pin: p.pin || '' });
          if (!p.pin) setRole('admin');
        } else {
          setRole('admin');
        }
      } catch (e) { setRole('admin'); }
      setRole('admin');
      try {
        const i = await window._storage.get('incoming', true);
        if (i && i.value) setIncoming(JSON.parse(i.value));
      } catch (e) { /* skip */ }
      try {
        const i = await window._storage.get('initStock', true);
        if (i && i.value) setInitStock(JSON.parse(i.value));
      } catch (e) { /* skip */ }
      setLoading(false);
    })();
  }, []);

  const flash = (m, k) => { setToast({ m, k: k || 'ok' }); setTimeout(() => setToast(null), 2000); };

  const needAdmin = (fn) => {
    if (role === 'admin') { fn(); return; }
    if (!sett.pin) { setRole('admin'); fn(); return; }
    setPinCb(() => fn);
  };

  const saveRec = async (d, sh, data) => {
    const k = d + ':' + sh;
    const r = { ...data, at: new Date().toISOString() };
    try {
      await window._storage.set('r:' + k, JSON.stringify(r), true);
      setRecs((p) => ({ ...p, [k]: r }));
      flash('저장 완료');
      return true;
    } catch (e) { flash('저장 실패', 'err'); return false; }
  };

  const delRec = async (d, sh) => {
    const k = d + ':' + sh;
    try {
      await window._storage.delete('r:' + k, true);
      setRecs((p) => { const n = { ...p }; delete n[k]; return n; });
      flash('삭제 완료');
    } catch (e) { flash('삭제 실패', 'err'); }
  };

  const saveSett = async (ns) => {
    try {
      await window._storage.set('sett', JSON.stringify(ns), true);
      setSett(ns);
      flash('설정 저장');
    } catch (e) { flash('실패', 'err'); }
  };

  const saveIncoming = async (ni) => {
    try {
      await window._storage.set('incoming', JSON.stringify(ni), true);
      setIncoming(ni);
    } catch (e) { flash('실패', 'err'); }
  };

  const saveInitStock = async (ni) => {
    try {
      await window._storage.set('initStock', JSON.stringify(ni), true);
      setInitStock(ni);
    } catch (e) { flash('실패', 'err'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm">불러오는 중...</div>
      </div>
    );
  }

  const isA = role === 'admin';
  const goTab = (t, admin) => {
    if (admin && !isA) { needAdmin(() => setTab(t)); }
    else { setTab(t); }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-20" style={{ fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
      {/* header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-stone-900 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">₩</span>
            </div>
            <h1 className="text-sm font-semibold tracking-tight">시재 관리</h1>
            {isA && sett.pin && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-900 text-white font-medium flex items-center gap-0.5">
                <Shield size={8} />관리자
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {isA && sett.pin && (
              <button onClick={() => { setRole('staff'); flash('근무자 모드'); if (tab !== 'input') setTab('input'); }}
                className="p-2 rounded-lg text-stone-500 hover:bg-stone-100">
                <Lock size={15} />
              </button>
            )}
            {!isA && (
              <button onClick={() => needAdmin(() => {})}
                className="p-2 rounded-lg text-stone-500 hover:bg-stone-100">
                <Lock size={15} />
              </button>
            )}
            <button onClick={() => needAdmin(() => setTab('settings'))}
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100">
              <Gear size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* main */}
      <main className="max-w-lg mx-auto">
        {tab === 'input' && <InputView recs={recs} sett={sett} onSave={saveRec} />}
        {tab === 'history' && (
          <HistoryView recs={recs} sett={sett} isA={isA}
            onDel={(d, s) => needAdmin(() => delRec(d, s))} />
        )}
        {tab === 'report' && <ReportView recs={recs} sett={sett} />}
        {tab === 'inventory' && (
          <InventoryView recs={recs} incoming={incoming} initStock={initStock}
            onSaveIncoming={saveIncoming} onSaveInitStock={saveInitStock} />
        )}
        {tab === 'settings' && (
          <SettingsView sett={sett} onSave={saveSett} onBack={() => setTab('input')} />
        )}
      </main>

      {/* bottom nav */}
      {tab !== 'settings' && (
        <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 z-20">
          <div className="max-w-lg mx-auto grid grid-cols-4">
            <NavBtn active={tab === 'input'} onClick={() => setTab('input')} icon={<Calendar size={18} />} label="입력" />
            <NavBtn active={tab === 'history'} onClick={() => goTab('history', true)} icon={<ClipboardList size={18} />} label="내역" locked={!isA} />
            <NavBtn active={tab === 'report'} onClick={() => goTab('report', true)} icon={<BarChart3 size={18} />} label="리포트" locked={!isA} />
            <NavBtn active={tab === 'inventory'} onClick={() => goTab('inventory', true)} icon={<Package size={18} />} label="재고" locked={!isA} />
          </div>
        </nav>
      )}

      {/* pin modal */}
      {pinCb !== null && (
        <PinModal
          pin={sett.pin}
          onOk={() => { setRole('admin'); const fn = pinCb; setPinCb(null); fn(); flash('관리자 모드'); }}
          onCancel={() => setPinCb(null)}
          onBad={() => flash('비밀번호 오류', 'err')}
        />
      )}

      {/* toast */}
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50">
          <div className={'px-4 py-2 rounded-full text-xs font-medium shadow-lg flex items-center gap-1.5 ' + (toast.k === 'ok' ? 'bg-stone-900 text-white' : 'bg-red-600 text-white')}>
            {toast.k === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {toast.m}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════ INPUT VIEW ══════ */
function InputView({ recs, sett, onSave }) {
  const [dateStr, setDate] = useState(todayStr());
  const [shift, setShift] = useState('오전');
  const [form, setForm] = useState(emptyRec());
  const [dirty, setDirty] = useState(false);

  const key = dateStr + ':' + shift;
  const existing = recs[key];
  const prev = recs[prevKey(dateStr, shift)];
  const lrk = lottoRefKey(dateStr, shift);
  const lRef = lrk ? recs[lrk] : null;

  const prevLabel = shift === '오전'
    ? addD(dateStr, -1).slice(5).replace('-', '/') + ' 야간'
    : shift === '오후'
      ? dateStr.slice(5).replace('-', '/') + ' 오전'
      : dateStr.slice(5).replace('-', '/') + ' 오후';

  useEffect(() => {
    if (existing) {
      const f = emptyRec();
      Object.keys(f).forEach((k) => { if (existing[k] != null) f[k] = existing[k]; });
      setForm(f);
    } else {
      const a = emptyRec();
      if (prev) {
        a.t1s = nextNum(prev.t1e, R1);
        a.t2s = nextNum(prev.t2e, R2);
      }
      setForm(a);
    }
    setDirty(false);
  }, [key]);

  const d = useMemo(() => calcDerived(form, shift, lRef, sett.sijae), [form, shift, lRef, sett.sijae]);
  const cash = useMemo(() => getCash(form), [form]);
  const up = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setDirty(true); };
  const handleSave = async () => { await onSave(dateStr, shift, form); setDirty(false); };

  return (
    <div className="p-4 space-y-3">
      {/* date + shift */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setDate(addD(dateStr, -1))} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
            <ChevronLeft size={18} />
          </button>
          <input type="date" value={dateStr} onChange={(e) => setDate(e.target.value)}
            className="text-center text-sm font-semibold bg-transparent focus:outline-none" />
          <button onClick={() => setDate(addD(dateStr, 1))} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SHIFTS.map((s) => (
            <button key={s} onClick={() => setShift(s)}
              className={'py-2 rounded-xl text-xs font-semibold transition ' + (shift === s ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500')}>
              {s}
              {recs[dateStr + ':' + s] && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* handover from prev */}
      {prev && prev.handover && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare size={12} className="text-amber-700" />
            <span className="text-[11px] font-semibold text-amber-900">{prevLabel} 인수인계</span>
          </div>
          <div className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">{prev.handover}</div>
        </div>
      )}

      {/* lotto ref info for 오후/야간 */}
      {shift !== '오전' && !existing && (
        <div className={'rounded-xl p-2.5 text-[11px] ' + (lRef ? 'bg-blue-50 text-blue-900' : 'bg-amber-50 text-amber-900')}>
          {lRef ? (
            <div className="flex justify-between">
              <span>{shift === '오후' ? '오전' : '오후'} 로또: <b>{won(toN(lRef.lotto))}원</b></span>
              <span className="opacity-60">자동 차감</span>
            </div>
          ) : (
            <span>{shift === '오후' ? '오전' : '오후'} 기록이 없어 순수판매액 계산이 부정확할 수 있습니다</span>
          )}
        </div>
      )}

      {/* ticket numbers */}
      <Sec t="지류 복권 번호" sub={t1Cnt(form.t1s, form.t1e) + 't1 · ' + t2Cnt(form.t2s, form.t2e) + 't2 매'}>
        <div className="space-y-1.5">
          <TicketRange label="1000원" sv={form.t1s} ev={form.t1e} os={(v) => up('t1s', v)} oe={(v) => up('t1e', v)} cnt={d.t1} />
          <TicketRange label="2000원" sv={form.t2s} ev={form.t2e} os={(v) => up('t2s', v)} oe={(v) => up('t2e', v)} cnt={d.t2} />
        </div>
      </Sec>

      {/* 판매 */}
      <Sec t="판매">
        <div className="space-y-1.5">
          <MoneyIn label="연금복권" value={form.pension} onChange={(v) => up('pension', v)} />
          <MoneyIn label="로또" value={form.lotto} onChange={(v) => up('lotto', v)} />
        </div>
      </Sec>

      {/* 지급 */}
      <Sec t="지급">
        <div className="space-y-1.5">
          <MoneyIn label="로또지급" value={form.lottoPay} onChange={(v) => up('lottoPay', v)} />
          <MoneyIn label="지류지급" value={form.paperPay} onChange={(v) => up('paperPay', v)} />
        </div>
      </Sec>

      {/* 정산 */}
      <Sec t="정산">
        <MoneyIn label="계좌이체" value={form.transfer} onChange={(v) => up('transfer', v)} />
      </Sec>

      {/* 현금 세기 */}
      <Sec t="현금 계산" sub={'합계: ' + won(cash) + '원'}>
        <div className="bg-white border border-stone-900 rounded-xl p-3 space-y-2">
          {DENOM.map(({ v: dv, l: dl, k: fk }) => {
            const cnt = toN(form[fk]);
            return (
              <div key={dv} className="flex items-center gap-2">
                <span className="text-xs font-medium w-12 text-stone-600">{dl}</span>
                <span className="text-stone-400 text-xs">x</span>
                <input type="text" inputMode="numeric" value={form[fk]}
                  onChange={(e) => up(fk, e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-16 bg-stone-50 rounded-lg px-2 py-1.5 text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400" />
                <span className="text-stone-400 text-xs">=</span>
                <span className="text-xs font-medium tabular-nums flex-1 text-right">{won(cnt * dv)}원</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
            <span className="text-xs font-medium w-12 text-stone-600">기타</span>
            <span className="text-stone-400 text-xs invisible">x</span>
            <input type="text" inputMode="numeric" value={form.bEtc}
              onChange={(e) => up('bEtc', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="w-16 bg-stone-50 rounded-lg px-2 py-1.5 text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400" />
            <span className="text-stone-400 text-xs invisible">=</span>
            <span className="text-xs font-medium tabular-nums flex-1 text-right">{won(toN(form.bEtc))}원</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-stone-200">
            <span className="text-sm font-bold">현금 총액</span>
            <span className="text-sm font-bold tabular-nums">{won(cash)}원</span>
          </div>
        </div>
      </Sec>

      {/* 비고 */}
      <Sec t="비고">
        <textarea value={form.note} onChange={(e) => up('note', e.target.value)}
          placeholder="특이사항" rows={2}
          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:border-stone-400" />
      </Sec>

      {/* 인수인계 */}
      <Sec t="인수인계" sub="다음 근무 시작 시 표시">
        <textarea value={form.handover} onChange={(e) => up('handover', e.target.value)}
          placeholder="예) 당첨금 25만원 오후 지급 예정" rows={2}
          className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:border-amber-400" />
      </Sec>

      {/* 요약 */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 space-y-1.5">
        <SumRow label="총 판매액" value={won(d.totalSales)} />
        <SumRow label="총 지급액" value={won(d.totalPay)} />
        <SumRow label="계좌이체" value={won(toN(form.transfer))} />
        <SumRow label="현금 총액" value={won(cash)} />
        <div className="border-t border-white/20 my-1.5" />
        <SumRow label="시재 기준" value={won(sett.sijae)} muted />
        {d.deposit != null && <SumRow label="입금액" value={won(d.deposit)} />}
        {d.variance != null && (
          <div className={'flex items-center justify-between pt-1.5 ' + (d.variance === 0 ? 'text-emerald-300' : 'text-red-300')}>
            <span className="text-xs font-semibold flex items-center gap-1">
              {d.variance === 0 ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}차액
            </span>
            <span className="text-base font-bold tabular-nums">
              {d.variance > 0 ? '+' : ''}{won(d.variance)}원
            </span>
          </div>
        )}
      </div>

      {/* save */}
      <button onClick={handleSave} disabled={!dirty && !!existing}
        className="w-full bg-stone-900 text-white py-3 rounded-2xl font-semibold text-sm disabled:bg-stone-300 disabled:text-stone-500 flex items-center justify-center gap-2">
        <Save size={15} />
        {existing ? (dirty ? '수정 저장' : '저장됨') : '저장'}
      </button>
    </div>
  );
}

function TicketRange({ label, sv, ev, os, oe, cnt }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-[10px] text-stone-500 tabular-nums">{cnt}매</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <input type="text" inputMode="decimal" value={sv} onChange={(e) => os(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="시작" className="w-full bg-stone-50 rounded-lg px-2.5 py-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400" />
        <input type="text" inputMode="decimal" value={ev} onChange={(e) => oe(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="끝" className="w-full bg-stone-50 rounded-lg px-2.5 py-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400" />
      </div>
    </div>
  );
}

function MoneyIn({ label, value, onChange }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl px-3 py-2 flex items-center gap-2">
      <div className="flex-1 text-xs font-medium">{label}</div>
      <input type="text" inputMode="decimal" value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.-]/g, ''))}
        placeholder="0" className="w-24 bg-stone-50 rounded-lg px-2 py-1.5 text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400" />
      <span className="text-[10px] text-stone-400">원</span>
    </div>
  );
}

function SumRow({ label, value, muted }) {
  return (
    <div className="flex justify-between text-xs">
      <span className={muted ? 'text-white/50' : 'text-white/70'}>{label}</span>
      <span className={'tabular-nums ' + (muted ? 'text-white/70' : 'font-medium')}>{value}원</span>
    </div>
  );
}

/* ══════ HISTORY ══════ */
function HistoryView({ recs, sett, isA, onDel }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  });
  const [exp, setExp] = useState(null);

  const shM = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  };

  const entries = useMemo(() => {
    const arr = [];
    Object.entries(recs).forEach(([k, rec]) => {
      const parts = k.split(':');
      const ds = parts[0];
      const sh = parts[1];
      if (!ds.startsWith(month)) return;
      const lrk = lottoRefKey(ds, sh);
      const lr = lrk ? recs[lrk] : null;
      const d = calcDerived(rec, sh, lr, sett.sijae);
      arr.push({ k, ds, sh, rec, d });
    });
    arr.sort((a, b) => {
      if (a.ds !== b.ds) return b.ds.localeCompare(a.ds);
      return SHIFTS.indexOf(a.sh) - SHIFTS.indexOf(b.sh);
    });
    return arr;
  }, [recs, month, sett.sijae]);

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between py-2">
        <button onClick={() => shM(-1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><ChevronLeft size={18} /></button>
        <h2 className="text-sm font-semibold tabular-nums">{month.replace('-', '년 ')}월</h2>
        <button onClick={() => shM(1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><ChevronRight size={18} /></button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-xs">기록 없음</div>
      ) : entries.map(({ k, ds, sh, rec, d }) => (
        <div key={k} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <button onClick={() => setExp(exp === k ? null : k)} className="w-full p-3 flex items-center justify-between text-left">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold">{ds.slice(5).replace('-', '/')}</span>
                <span className={'text-[10px] px-1.5 py-0.5 rounded ' + SC[sh]}>{sh}</span>
                {rec.handover && <MessageSquare size={10} className="text-amber-500" />}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                판매 {won(d.totalSales)} · 입금 {won(d.deposit || 0)}
              </div>
            </div>
            <div className={'text-xs font-bold tabular-nums ' + (d.variance == null || d.variance === 0 ? 'text-stone-400' : d.variance > 0 ? 'text-emerald-600' : 'text-red-600')}>
              {d.variance != null && d.variance !== 0 && ((d.variance > 0 ? '+' : '') + won(d.variance))}
            </div>
          </button>
          {exp === k && (
            <div className="border-t border-stone-100 p-3 bg-stone-50 text-[11px] space-y-1">
              <DetailRow l="1000원" v={d.t1 + '매 · ' + won(d.t1 * 1000) + '원'} />
              <DetailRow l="2000원" v={d.t2 + '매 · ' + won(d.t2 * 2000) + '원'} />
              <DetailRow l="연금복권" v={won(toN(rec.pension)) + '원'} />
              <DetailRow l="로또 판매" v={won(d.pureSales) + '원'} />
              <DetailRow l="로또 지급" v={won(d.purePay) + '원'} />
              <DetailRow l="지류지급" v={won(toN(rec.paperPay)) + '원'} />
              <DetailRow l="계좌이체" v={won(toN(rec.transfer)) + '원'} />
              <DetailRow l="현금총액" v={won(d.cash) + '원'} />
              {rec.note && <DetailRow l="비고" v={rec.note} />}
              {rec.handover && <DetailRow l="인수인계" v={rec.handover} />}
              {isA && (
                <div className="pt-1.5">
                  <button onClick={() => { if (confirm(ds + ' ' + sh + ' 삭제?')) { onDel(ds, sh); setExp(null); } }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-red-200 text-red-600 text-[10px] font-medium">
                    <Trash2 size={10} /> 삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DetailRow({ l, v }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-stone-500 shrink-0">{l}</span>
      <span className="tabular-nums text-stone-800 text-right whitespace-pre-wrap">{v}</span>
    </div>
  );
}

/* ══════ REPORT ══════ */
function ReportView({ recs, sett }) {
  const [mode, setMode] = useState('daily');
  const [anchor, setAnchor] = useState(todayStr());
  const [copied, setCopied] = useState(false);

  const range = useMemo(() => {
    if (mode === 'daily') return { f: anchor, t: anchor, l: anchor };
    if (mode === 'weekly') {
      const d = new Date(anchor);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const s = new Date(d); s.setDate(d.getDate() + diff);
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return { f: ymd(s), t: ymd(e), l: ymd(s).slice(5) + ' ~ ' + ymd(e).slice(5) };
    }
    const [y, m] = anchor.split('-').map(Number);
    return { f: ymd(new Date(y, m - 1, 1)), t: ymd(new Date(y, m, 0)), l: y + '년 ' + m + '월' };
  }, [mode, anchor]);

  const data = useMemo(() => {
    let sales = 0, pay = 0, dep = 0, va = 0, tk1 = 0, tk2 = 0, pen = 0, lottoSales = 0, lottoPay = 0, n = 0;
    const vbd = {};
    Object.entries(recs).forEach(([k, rec]) => {
      const parts = k.split(':');
      const ds = parts[0], sh = parts[1];
      if (ds < range.f || ds > range.t) return;
      const lrk = lottoRefKey(ds, sh);
      const lr = lrk ? recs[lrk] : null;
      const d = calcDerived(rec, sh, lr, sett.sijae);
      sales += d.totalSales; pay += d.totalPay;
      dep += d.deposit || 0; va += d.variance || 0;
      tk1 += d.t1; tk2 += d.t2; pen += toN(rec.pension); lottoSales += d.pureSales; lottoPay += d.purePay;
      n++;
      if (d.variance != null && d.variance !== 0) vbd[ds] = (vbd[ds] || 0) + d.variance;
    });
    return { n, sales, pay, dep, va, tk1, tk2, pen, lottoSales, lottoPay, vbd };
  }, [recs, range, sett.sijae]);

  const txt = useMemo(() => {
    const title = mode === 'daily' ? '📋 ' + range.l + ' 마감' : mode === 'weekly' ? '📋 주간 (' + range.l + ')' : '📋 월간 (' + range.l + ')';
    const ln = [
      title, '━━━━━━━━━━━━━━',
      '총 판매: ' + won(data.sales) + '원',
      '총 지급: ' + won(data.pay) + '원',
      '총 입금: ' + won(data.dep) + '원',
      '차액 합계: ' + (data.va > 0 ? '+' : '') + won(data.va) + '원',
      '',
      '스피또1000: ' + data.tk1 + '매 (' + won(data.tk1 * 1000) + '원)',
      '스피또2000: ' + data.tk2 + '매 (' + won(data.tk2 * 2000) + '원)',
      '연금복권: ' + won(data.pen) + '원',
    ];
    const vk = Object.entries(data.vbd);
    if (vk.length > 0) {
      ln.push('', '⚠️ 차액 발생');
      vk.forEach(([d, v]) => ln.push('  · ' + d.slice(5) + ': ' + (v > 0 ? '+' : '') + won(v) + '원'));
    }
    ln.push('', data.n + '건 기록');
    return ln.join('\n');
  }, [mode, range, data]);

  const cp = async () => {
    try { await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) { /* skip */ }
  };

  const sh = (delta) => {
    if (mode === 'daily') setAnchor(addD(anchor, delta));
    else if (mode === 'weekly') setAnchor(addD(anchor, delta * 7));
    else {
      const [y, m] = anchor.split('-').map(Number);
      setAnchor(ymd(new Date(y, m - 1 + delta, 1)));
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="bg-white rounded-2xl border border-stone-200 p-1 grid grid-cols-3 gap-1">
        {[['daily', '일일'], ['weekly', '주간'], ['monthly', '월간']].map(([m, l]) => (
          <button key={m} onClick={() => setMode(m)}
            className={'py-2 rounded-xl text-xs font-semibold transition ' + (mode === m ? 'bg-stone-900 text-white' : 'text-stone-500')}>
            {l}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between py-1">
        <button onClick={() => sh(-1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><ChevronLeft size={18} /></button>
        <div className="text-sm font-semibold tabular-nums">{range.l}</div>
        <button onClick={() => sh(1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><ChevronRight size={18} /></button>
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 p-4">
       <div className="space-y-2.5">
        <StatRow label="총 판매액" value={won(data.sales) + '원'} big />
        <StatRow label="총 지급액" value={won(data.pay) + '원'} />
        <StatRow label="총 입금액" value={won(data.dep) + '원'} />
        <div className="border-t border-stone-100 pt-2.5">
         <StatRow label="차액 합계" value={(data.va > 0 ? '+' : '') + won(data.va) + '원'} tone={data.va === 0 ? 'ok' : 'warn'} big />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-stone-100 space-y-2.5">
       <StatRow label="로또 판매액" value={won(data.lottoSales) + '원'} />
       <StatRow label="로또 지급액" value={won(data.lottoPay) + '원'} />
      </div>
      <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
       <div><span className="text-stone-500">1000원 </span><b>{data.tk1}매</b></div>
       <div><span className="text-stone-500">2000원 </span><b>{data.tk2}매</b></div>
       <div><span className="text-stone-500">연금 </span><b>{won(data.pen)}원</b></div>
       <div><span className="text-stone-500">기록 </span><b>{data.n}건</b></div>
      </div>
    </div>  
      <Sec t="공유용 텍스트" sub="복사 후 단톡방에 붙여넣기">
        <div className="bg-stone-900 text-stone-100 rounded-2xl p-3 text-[10px] whitespace-pre-wrap font-mono leading-relaxed">{txt}</div>
        <button onClick={cp}
          className="mt-1.5 w-full bg-white border border-stone-200 py-2.5 rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5">
          {copied ? (<><CheckCircle2 size={14} className="text-emerald-600" /> 복사됨</>) : (<><Copy size={14} /> 클립보드 복사</>)}
        </button>
      </Sec>
    </div>
  );
}

function StatRow({ label, value, tone, big }) {
  const tc = tone === 'warn' ? 'text-red-600' : tone === 'ok' ? 'text-emerald-600' : 'text-stone-900';
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-stone-500">{label}</span>
      <span className={'tabular-nums ' + (big ? 'text-base font-bold ' : 'text-xs font-medium ') + tc}>{value}</span>
    </div>
  );
}

/* ══════ INVENTORY ══════ */
function InventoryView({ recs, incoming, initStock, onSaveIncoming, onSaveInitStock }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  });
  const [editInit, setEditInit] = useState(false);
  const [initF, setInitF] = useState(initStock);
  const [editDay, setEditDay] = useState(null);
  const [incF, setIncF] = useState({ t1: '', t2: '', pen: '' });

  const shM = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  };

  const days = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    const arr = [];
    for (let i = 1; i <= last; i++) {
      const ds = month + '-' + String(i).padStart(2, '0');
      let s1 = 0, s2 = 0, sp = 0;
      SHIFTS.forEach((sh) => {
        const rec = recs[ds + ':' + sh];
        if (!rec) return;
        s1 += t1Cnt(rec.t1s, rec.t1e);
        s2 += t2Cnt(rec.t2s, rec.t2e);
        sp += Math.round(toN(rec.pension) / 1000);
      });
      const inc = incoming[ds] || { t1: 0, t2: 0, pen: 0 };
      arr.push({ ds, sold: { t1: s1, t2: s2, pen: sp }, inc });
    }
    return arr;
  }, [month, recs, incoming]);

  const withStock = useMemo(() => {
    const initDate = initStock.date || todayStr();
    const monthStart = month + '-01';
    let preT1 = 0, preT2 = 0, prePen = 0;
    let preIn1 = 0, preIn2 = 0, preInP = 0;

    Object.entries(recs).forEach(([k, rec]) => {
      const ds = k.split(':')[0];
      if (ds >= initDate && ds < monthStart) {
        preT1 += t1Cnt(rec.t1s, rec.t1e);
        preT2 += t2Cnt(rec.t2s, rec.t2e);
        prePen += Math.round(toN(rec.pension) / 1000);
      }
    });
    Object.entries(incoming).forEach(([ds, inc]) => {
      if (ds >= initDate && ds < monthStart) {
        preIn1 += inc.t1 || 0;
        preIn2 += inc.t2 || 0;
        preInP += inc.pen || 0;
      }
    });

    let run = {
      t1: (initStock.t1 || 0) + preIn1 - preT1,
      t2: (initStock.t2 || 0) + preIn2 - preT2,
      pen: (initStock.pen || 0) + preInP - prePen,
    };

    return days.map((d) => {
      if (d.ds >= initDate) {
        run = {
          t1: run.t1 + d.inc.t1 - d.sold.t1,
          t2: run.t2 + d.inc.t2 - d.sold.t2,
          pen: run.pen + d.inc.pen - d.sold.pen,
        };
      }
      return { ...d, stock: { ...run } };
    });
  }, [days, initStock, incoming, recs]);

  const openEdit = (ds) => {
    const inc = incoming[ds] || { t1: 0, t2: 0, pen: 0, r1: 0, r2: 0, rpen: 0 };
    setIncF({ 
      t1: inc.t1 ? String(inc.t1) : '', 
      t2: inc.t2 ? String(inc.t2) : '', 
      pen: inc.pen ? String(inc.pen) : '',
      r1: inc.r1 ? String(inc.r1) : '',
      r2: inc.r2 ? String(inc.r2) : '',
      rpen: inc.rpen ? String(inc.rpen) : ''
    });
    setEditDay(ds);
  };

  const saveEdit = () => {
    const ni = { ...incoming, [editDay]: { 
      t1: toN(incF.t1), t2: toN(incF.t2), pen: toN(incF.pen),
      r1: toN(incF.r1), r2: toN(incF.r2), rpen: toN(incF.rpen)
    }};
    onSaveIncoming(ni);
    setEditDay(null);
  };

  const td = todayStr();

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between py-1">
        <button onClick={() => shM(-1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><ChevronLeft size={18} /></button>
        <h2 className="text-sm font-semibold tabular-nums">{month.replace('-', '년 ')}월 재고</h2>
        <button onClick={() => shM(1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><ChevronRight size={18} /></button>
      </div>

      {/* init stock */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-stone-500">초기 재고 ({initStock.date})</span>
          <button onClick={() => { setEditInit(!editInit); setInitF(initStock); }} className="text-[10px] text-blue-600 font-medium">
            {editInit ? '취소' : '수정'}
          </button>
        </div>
        {editInit ? (
          <div className="space-y-1.5">
            <div className="flex gap-2 items-center">
              <span className="text-xs w-10">날짜</span>
              <input type="date" value={initF.date} onChange={(e) => setInitF((p) => ({ ...p, date: e.target.value }))}
                className="flex-1 bg-stone-50 rounded-lg px-2 py-1 text-xs focus:outline-none" />
            </div>
            {[['t1', '스피또1000'], ['t2', '스피또2000'], ['pen', '연금복권']].map(([k, l]) => (
              <div key={k} className="flex gap-2 items-center">
                <span className="text-xs w-20">{l}</span>
                <input type="text" inputMode="numeric" value={initF[k]}
                  onChange={(e) => setInitF((p) => ({ ...p, [k]: e.target.value.replace(/[^0-9]/g, '') }))}
                  placeholder="0" className="w-20 bg-stone-50 rounded-lg px-2 py-1 text-xs text-right tabular-nums focus:outline-none" />
                <span className="text-[10px] text-stone-400">매</span>
              </div>
            ))}
            <button onClick={() => {
              onSaveInitStock({ ...initF, t1: toN(initF.t1), t2: toN(initF.t2), pen: toN(initF.pen) });
              setEditInit(false);
            }} className="w-full py-2 mt-1 rounded-lg bg-stone-900 text-white text-xs font-medium">
              저장
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['스피또1000', initStock.t1], ['스피또2000', initStock.t2], ['연금복권', initStock.pen]].map(([l, v]) => (
              <div key={l} className="bg-stone-50 rounded-lg p-2">
                <div className="text-[10px] text-stone-500">{l}</div>
                <div className="text-sm font-bold tabular-nums">{v || 0}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* daily table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-0 px-3 py-2 bg-stone-100 text-[9px] font-semibold text-stone-500 uppercase">
          <div className="col-span-2">날짜</div>
          <div className="col-span-1 text-center">구분</div>
          <div className="col-span-3 text-center">1000</div>
          <div className="col-span-3 text-center">2000</div>
          <div className="col-span-3 text-center">연금</div>
        </div>
        {withStock
          .filter((d) => d.ds <= td || d.inc.t1 || d.inc.t2 || d.inc.pen || d.sold.t1 || d.sold.t2 || d.sold.pen)
          .reverse()
          .map((d) => (
            <div key={d.ds} className="border-t border-stone-100">
              <button onClick={() => openEdit(d.ds)} className="w-full grid grid-cols-12 gap-0 px-3 py-1.5 text-[10px] hover:bg-blue-50 text-left">
                <div className="col-span-2 font-medium">{d.ds.slice(5)}</div>
                <div className="col-span-1 text-center text-blue-600 font-medium">입고</div>
                <div className="col-span-3 text-center tabular-nums text-blue-600">{d.inc.t1 || '-'}</div>
                <div className="col-span-3 text-center tabular-nums text-blue-600">{d.inc.t2 || '-'}</div>
                <div className="col-span-3 text-center tabular-nums text-blue-600">{d.inc.pen || '-'}</div>
              </button>
              <div className="grid grid-cols-12 gap-0 px-3 py-1.5 text-[10px]">
                <div className="col-span-2" />
                <div className="col-span-1 text-center text-red-500 font-medium">판매</div>
                <div className="col-span-3 text-center tabular-nums text-red-500">{d.sold.t1 || '-'}</div>
                <div className="col-span-3 text-center tabular-nums text-red-500">{d.sold.t2 || '-'}</div>
                <div className="col-span-3 text-center tabular-nums text-red-500">{d.sold.pen || '-'}</div>
              </div>
              <div className="grid grid-cols-12 gap-0 px-3 py-1.5 text-[10px] bg-stone-50">
                <div className="col-span-2" />
                <div className="col-span-1 text-center text-stone-600 font-semibold">재고</div>
                <div className={'col-span-3 text-center tabular-nums font-bold ' + (d.stock.t1 < 10 ? 'text-red-600' : 'text-stone-800')}>{d.stock.t1}</div>
                <div className={'col-span-3 text-center tabular-nums font-bold ' + (d.stock.t2 < 10 ? 'text-red-600' : 'text-stone-800')}>{d.stock.t2}</div>
                <div className={'col-span-3 text-center tabular-nums font-bold ' + (d.stock.pen < 10 ? 'text-red-600' : 'text-stone-800')}>{d.stock.pen}</div>
              </div>
            </div>
          ))}
      </div>

      {/* edit incoming modal */}
      {editDay && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4 pb-8">
          <div className="bg-white rounded-2xl p-4 w-full max-w-lg">
          <h3 className="text-sm font-semibold mb-3">{editDay} 재고 조정</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-blue-600 mb-2">📦 입고</div>
                <div className="space-y-2">
                  {[['t1', '스피또1000'], ['t2', '스피또2000'], ['pen', '연금복권']].map(([k, l]) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="text-xs w-20">{l}</span>
                    <input type="text" inputMode="numeric" value={incF[k]}
                      onChange={(e) => setIncF((p) => ({ ...p, [k]: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="0" className="flex-1 bg-stone-50 rounded-lg px-3 py-2 text-sm text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400" />
                    <span className="text-xs text-stone-400">매</span>
                  </div>))}
                </div>
              </div>
              <div className="border-t border-stone-100 pt-3">
                <div className="text-xs font-semibold text-red-500 mb-2">↩️ 반납</div>
                <div className="space-y-2">
                  {[['r1', '스피또1000'], ['r2', '스피또2000'], ['rpen', '연금복권']].map(([k, l]) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="text-xs w-20">{l}</span>
                    <input type="text" inputMode="numeric" value={incF[k]}
                      onChange={(e) => setIncF((p) => ({ ...p, [k]: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="0" className="flex-1 bg-stone-50 rounded-lg px-3 py-2 text-sm text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400" />
                    <span className="text-xs text-stone-400">매</span>
                  </div>))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditDay(null)} className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium">취소</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════ SETTINGS ══════ */
function SettingsView({ sett, onSave, onBack }) {
  const [sijae, setSijae] = useState(String(sett.sijae));
  const [pin, setPin] = useState(sett.pin || '');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-stone-100 text-stone-600"><ChevronLeft size={20} /></button>
        <h2 className="text-base font-semibold">설정</h2>
      </div>

      <Sec t="시재 기준액">
        <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 flex items-center gap-3">
          <div className="flex-1 text-xs font-medium">기준 금액</div>
          <input type="text" inputMode="decimal" value={sijae}
            onChange={(e) => setSijae(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-28 bg-stone-50 rounded-lg px-2 py-1.5 text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400" />
          <span className="text-[10px] text-stone-400">원</span>
        </div>
        <div className="text-[10px] text-stone-500 px-1 mt-1">차액 = 현금총액 - (총판매 - 총지급 - 계좌이체) - 시재</div>
      </Sec>

      <Sec t="관리자 비밀번호" sub="비워두면 모두 관리자">
        <div className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 flex items-center gap-3">
          <Shield size={14} className="text-stone-400" />
          <div className="flex-1 text-xs font-medium">PIN</div>
          <input type="text" inputMode="numeric" value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
            placeholder="숫자만" className="w-28 bg-stone-50 rounded-lg px-2 py-1.5 text-xs text-right tabular-nums tracking-widest focus:outline-none focus:ring-1 focus:ring-stone-400" />
        </div>
        <div className="text-[10px] text-stone-500 px-1 mt-1 leading-relaxed">
          관리자: 내역 · 리포트 · 재고 · 삭제 · 설정<br />근무자: 입력만 가능
        </div>
      </Sec>

      <div className="bg-blue-50 rounded-xl p-3 text-[10px] text-blue-900 leading-relaxed">
        <b>공유 모드</b> — 같은 링크로 접속한 사람 모두 같은 데이터를 공유합니다.
      </div>

      <button onClick={() => { onSave({ sijae: toN(sijae) || DEF_SIJAE, pin: pin.trim() }); onBack(); }}
        className="w-full bg-stone-900 text-white py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2">
        <Save size={15} /> 저장
      </button>
    </div>
  );
}