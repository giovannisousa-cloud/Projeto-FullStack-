import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Tags, Wallet, ChartNoAxesCombined, CreditCard,
  HeartPulse, LogOut, Bell, Plus, Search, Menu, X, ArrowUpRight, ArrowDownRight,
  ChevronDown, CalendarDays, MoreHorizontal, Sparkles, CircleHelp, Settings,
  TrendingUp, PiggyBank, ShoppingBag, Car, House, Coffee, BriefcaseBusiness
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import api from './services/api'
import { useAuth } from './contexts/AuthContext'

const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Substitui o aviso nativo do navegador por mensagens discretas dentro do formulário.
function validateRequired(event) {
  const form = event.currentTarget
  let valid = true
  form.querySelectorAll('[required]').forEach((field) => {
    const empty = !String(field.value || '').trim()
    const invalidEmail = field.type === 'email' && field.value && !field.validity.valid
    const invalid = empty || invalidEmail
    field.setAttribute('aria-invalid', invalid ? 'true' : 'false')
    let message = field.parentElement.querySelector('.validation-message')
    if (invalid) {
      valid = false
      if (!message) {
        message = document.createElement('span')
        message.className = 'validation-message'
        field.insertAdjacentElement('afterend', message)
      }
      message.textContent = empty ? 'Este campo é obrigatório.' : 'Digite um e-mail válido.'
    } else if (message) {
      message.remove()
    }
  })
  return valid
}
const sampleTransactions = [
  { id: 1, descricao: 'Salário', categoria: 'Renda', fonte: 'Conta principal', data: '2026-11-05', tipo: 'entrada', valor: 5800 },
  { id: 2, descricao: 'Mercado do mês', categoria: 'Alimentação', fonte: 'Nubank', data: '2026-11-07', tipo: 'saida', valor: 642.8 },
  { id: 3, descricao: 'Aluguel', categoria: 'Moradia', fonte: 'Conta principal', data: '2026-11-08', tipo: 'saida', valor: 1450 },
  { id: 4, descricao: 'Projeto freelance', categoria: 'Renda extra', fonte: 'Conta principal', data: '2026-11-10', tipo: 'entrada', valor: 950 },
  { id: 5, descricao: 'Academia', categoria: 'Saúde', fonte: 'Visa', data: '2026-11-11', tipo: 'saida', valor: 99.9 },
  { id: 6, descricao: 'Combustível', categoria: 'Transporte', fonte: 'Nubank', data: '2026-11-12', tipo: 'saida', valor: 220 },
]
const chartData = [
  { mes: 'Jun', entradas: 4800, saidas: 3200 }, { mes: 'Jul', entradas: 5200, saidas: 3500 },
  { mes: 'Ago', entradas: 4900, saidas: 3100 }, { mes: 'Set', entradas: 5600, saidas: 3900 },
  { mes: 'Out', entradas: 6100, saidas: 4200 }, { mes: 'Nov', entradas: 6750, saidas: 2413 }
]
const categoryData = [
  { name: 'Moradia', value: 1450, color: '#6C7CF7' },
  { name: 'Alimentação', value: 642.8, color: '#36B7A0' },
  { name: 'Transporte', value: 220, color: '#F2B66D' },
  { name: 'Saúde', value: 99.9, color: '#E987A8' },
]
const initialCategories = [
  { id: 1, nome: 'Salário', tipo: 'entrada', cor: '#36B7A0' },
  { id: 2, nome: 'Alimentação', tipo: 'saida', cor: '#F2B66D' },
  { id: 3, nome: 'Moradia', tipo: 'saida', cor: '#6C7CF7' },
  { id: 4, nome: 'Transporte', tipo: 'saida', cor: '#E987A8' },
  { id: 5, nome: 'Saúde', tipo: 'saida', cor: '#36B7A0' },
]
const initialAccounts = [
  { id: 1, nome: 'Conta principal', tipo: 'conta', saldo: 8240.50 },
  { id: 2, nome: 'Nubank', tipo: 'cartao_credito', limite: 5000, usado: 1840, fechamento: 20, vencimento: 27 },
  { id: 3, nome: 'Visa', tipo: 'cartao_credito', limite: 3500, usado: 920, fechamento: 12, vencimento: 19 },
]
const navItems = [
  ['Visão geral', '/', LayoutDashboard], ['Lançamentos', '/lancamentos', ArrowLeftRight],
  ['Categorias', '/categorias', Tags], ['Contas e cartões', '/contas', Wallet],
  ['Relatórios', '/relatorios', ChartNoAxesCombined], ['Faturas', '/faturas', CreditCard],
  ['Saúde financeira', '/saude', HeartPulse]
]

function Protected({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}
function App() {
  const { token } = useAuth()
  return <Routes>
    <Route path="/login" element={token ? <Navigate to="/" /> : <AuthPage />} />
    <Route path="/cadastro" element={token ? <Navigate to="/" /> : <AuthPage register />} />
    <Route path="/*" element={<Protected><Shell /></Protected>} />
  </Routes>
}

function AuthPage({ register = false }) {
  const { login, cadastrar } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', senha: '', confirmar: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const change = (e) => {
    const field = e.target
    field.removeAttribute('aria-invalid')
    field.parentElement?.querySelector('.validation-message')?.remove()
    setForm({ ...form, [field.name]: field.value })
  }
  async function submit(e) {
    e.preventDefault()
    if (!validateRequired(e)) return
    setError(''); setLoading(true)
    try {
      if (register) {
        if (form.senha !== form.confirmar) throw new Error('As senhas não coincidem.')
        if (form.senha.length < 8 || !/[A-Za-z]/.test(form.senha) || !/\d/.test(form.senha)) throw new Error('Use uma senha com pelo menos 8 caracteres, letras e números.')
        await cadastrar(form)
      } else await login(form.email, form.senha)
      nav('/')
    } catch (err) { setError(err.response?.data?.erro || err.message || 'Não foi possível entrar. Confira seus dados.') }
    finally { setLoading(false) }
  }
  return <div className="auth-page">
    <div className="auth-art">
      <div className="brand brand-light"><span className="brand-mark">o</span> orbe</div>
      <div className="auth-message">
        <span className="eyebrow">SUA VIDA FINANCEIRA, EM ÓRBITA</span>
        <h1>Clareza para<br/>decidir melhor.</h1>
        <p>Organize suas finanças, acompanhe seus objetivos e tenha o controle nas suas mãos.</p>
        <div className="auth-mini-card"><div className="mini-orbit">↗</div><div><small>Saldo disponível</small><strong>R$ 8.240,50</strong></div><span>+12,8%</span></div>
      </div>
      <div className="auth-decoration one"></div><div className="auth-decoration two"></div>
      <small className="auth-foot">ORBE FINANÇAS · CONTROLE SIMPLES, VIDA LEVE</small>
    </div>
    <div className="auth-form-wrap">
      <div className="auth-mobile-brand brand"><span className="brand-mark">o</span> orbe</div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <span className="eyebrow">{register ? 'COMECE POR AQUI' : 'BEM-VINDO DE VOLTA'}</span>
        <h2>{register ? 'Crie sua conta' : 'Acesse sua conta'}</h2>
        <p className="muted">{register ? 'É rápido. Seu futuro financeiro agradece.' : 'Entre para acompanhar sua vida financeira.'}</p>
        {register && <Field label="Nome completo"><input name="nome" value={form.nome} onChange={change} required placeholder="Como podemos te chamar?" /></Field>}
        <Field label="E-mail"><input type="email" name="email" value={form.email} onChange={change} required placeholder="voce@email.com" /></Field>
        {register && <Field label="CPF"><input name="cpf" value={form.cpf} onChange={change} required placeholder="000.000.000-00" /></Field>}
        <Field label="Senha"><input type="password" name="senha" value={form.senha} onChange={change} required placeholder="••••••••" /></Field>
        {register && <Field label="Confirmar senha"><input type="password" name="confirmar" value={form.confirmar} onChange={change} required placeholder="Repita sua senha" /></Field>}
        {error && <div className="error-box">{error}</div>}
        <button className="btn-primary auth-submit" disabled={loading}>{loading ? 'Aguarde...' : register ? 'Criar minha conta' : 'Entrar'} <ArrowUpRight size={17}/></button>
        <div className="auth-switch">{register ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'} <a href={register ? '/login' : '/cadastro'}>{register ? 'Fazer login' : 'Criar conta'}</a></div>
        <div className="auth-privacy">Seus dados são protegidos e utilizados apenas para sua experiência.</div>
      </form>
    </div>
  </div>
}
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }

function Shell() {
  const { user, logout } = useAuth()
  const [sidebar, setSidebar] = useState(false)
  const location = useLocation()
  const title = navItems.find(n => n[1] === location.pathname)?.[0] || 'Visão geral'
  return <div className="app-shell">
    {sidebar && <div className="mobile-scrim" onClick={() => setSidebar(false)} />}
    <aside className={`sidebar ${sidebar ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><div className="brand"><span className="brand-mark">o</span> orbe</div><button className="icon-btn close-sidebar" onClick={() => setSidebar(false)}><X/></button></div>
      <div className="workspace-label">ESPAÇO PESSOAL</div>
      <nav className="side-nav">{navItems.map(([label, path, Icon]) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setSidebar(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18}/><span>{label}</span>{label === 'Faturas' && <i className="nav-dot"/>}</NavLink>)}</nav>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Precisa de ajuda?</strong><span>Estamos aqui para você.</span><a href="mailto:suporte@orbe.app">Fale com a gente ↗</a></div>
        <button className="nav-link logout-link" onClick={logout}><LogOut size={18}/> Sair da conta</button>
        <div className="profile-row"><div className="avatar">{(user?.nome || 'J').slice(0,1).toUpperCase()}</div><div className="profile-text"><strong>{user?.nome || 'Jedson'}</strong><span>Conta pessoal</span></div><MoreHorizontal size={18}/></div>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-btn menu-btn" onClick={() => setSidebar(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{title}</strong></div><div className="top-actions"><span className="today-label"><CalendarDays size={15}/> Novembro, 2026</span><button className="icon-btn notification"><Bell size={18}/><i/></button><div className="top-avatar">{(user?.nome || 'J').slice(0,1).toUpperCase()}</div></div></header>
      <div className="page-content"><Routes>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/lancamentos" element={<Transactions/>}/>
        <Route path="/categorias" element={<Categories/>}/>
        <Route path="/contas" element={<Accounts/>}/>
        <Route path="/relatorios" element={<Reports/>}/>
        <Route path="/faturas" element={<Invoices/>}/>
        <Route path="/saude" element={<Health/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes></div>
    </main>
  </div>
}

function PageHeading({ eyebrow = 'SEU RESUMO FINANCEIRO', title, description, action, onAction }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <button className="btn-primary" onClick={onAction}><Plus size={17}/>{action}</button>}</div>
}
function StatCard({ label, value, trend, positive = true, icon: Icon, tone = 'blue', note }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon ${tone}`}><Icon size={18}/></div></div><strong className="stat-value">{value}</strong><div className="stat-foot"><span className={`trend ${positive ? 'up' : 'down'}`}>{positive ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {trend}</span><span>{note || 'vs. mês anterior'}</span></div></div>
}
function Dashboard() {
  const [transactions, setTransactions] = useState(sampleTransactions)
  const [modal, setModal] = useState(false)
  const income = transactions.filter(t => t.tipo === 'entrada').reduce((a,t)=>a+Number(t.valor),0)
  const expense = transactions.filter(t => t.tipo === 'saida').reduce((a,t)=>a+Number(t.valor),0)
  return <>
    <PageHeading title="Visão geral" description="Aqui está o panorama das suas finanças neste mês." action="Novo lançamento" onAction={() => setModal(true)}/>
    <div className="welcome-strip"><div className="welcome-icon"><Sparkles size={19}/></div><div><strong>Bom dia, vamos colocar suas finanças em órbita?</strong><span>Você está no caminho certo. Continue acompanhando seus movimentos.</span></div><button onClick={() => location.href='/saude'}>Ver minha saúde financeira <ArrowUpRight size={15}/></button></div>
    <div className="stats-grid">
      <StatCard label="Saldo total" value={money(8240.50 + income - 6750)} trend="+8,4%" icon={Wallet} tone="blue" />
      <StatCard label="Entradas do mês" value={money(income)} trend="+12,8%" icon={ArrowDownRight} tone="green"/>
      <StatCard label="Saídas do mês" value={money(expense)} trend="-4,2%" positive={true} icon={ArrowUpRight} tone="orange"/>
      <StatCard label="Economia no mês" value={money(income-expense)} trend="18,6%" icon={PiggyBank} tone="purple" note="da sua renda"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-heading"><div><h3>Fluxo financeiro</h3><p>Acompanhe entradas e saídas ao longo do tempo.</p></div><button className="select-like">Últimos 6 meses <ChevronDown size={15}/></button></div><div className="chart-legend"><span><i className="legend-dot income-dot"/> Entradas</span><span><i className="legend-dot expense-dot"/> Saídas</span></div><div className="main-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:10,right:8,left:-20,bottom:0}}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#36B7A0" stopOpacity={.2}/><stop offset="100%" stopColor="#36B7A0" stopOpacity={0}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7180F5" stopOpacity={.17}/><stop offset="100%" stopColor="#7180F5" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#edf0f5"/><XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill:'#9aa3b5',fontSize:12}}/><Tooltip formatter={(v)=>money(v)} contentStyle={{border:'1px solid #edf0f5',borderRadius:12,boxShadow:'0 8px 24px #17213a12'}}/><Area type="monotone" dataKey="entradas" stroke="#36B7A0" strokeWidth={2.5} fill="url(#incomeFill)"/><Area type="monotone" dataKey="saidas" stroke="#7180F5" strokeWidth={2.5} fill="url(#expenseFill)"/></AreaChart></ResponsiveContainer></div></section>
      <section className="panel category-panel"><div className="panel-heading"><div><h3>Despesas por categoria</h3><p>Onde seu dinheiro está indo.</p></div><button className="more-btn"><MoreHorizontal/></button></div><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={67} outerRadius={91} paddingAngle={4} stroke="none">{categoryData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={(v)=>money(v)}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(categoryData.reduce((a,c)=>a+c.value,0))}</strong><span>Total gasto</span></div></div><div className="category-legend">{categoryData.map(c=><div key={c.name}><span><i style={{background:c.color}}/>{c.name}</span><strong>{Math.round(c.value/categoryData.reduce((a,x)=>a+x.value,0)*100)}%</strong></div>)}</div></section>
    </div>
    <section className="panel transactions-panel"><div className="panel-heading"><div><h3>Últimos lançamentos</h3><p>Suas movimentações mais recentes.</p></div><NavLink to="/lancamentos" className="text-link">Ver todos <ArrowUpRight size={15}/></NavLink></div><TransactionTable transactions={transactions.slice(0,5)}/></section>
    {modal && <TransactionModal onClose={()=>setModal(false)} onSave={(t)=>{setTransactions([t,...transactions]);setModal(false)}}/>}
  </>
}

function TransactionTable({ transactions, onDelete }) {
  const icons = { 'Alimentação': ShoppingBag, 'Moradia': House, 'Transporte': Car, 'Saúde': HeartPulse, 'Renda': BriefcaseBusiness, 'Renda extra': BriefcaseBusiness }
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>DESCRIÇÃO</th><th>CATEGORIA</th><th>DATA</th><th>CONTA</th><th>VALOR</th><th></th></tr></thead><tbody>{transactions.map(t=>{const Icon=icons[t.categoria]||Coffee;return <tr key={t.id}><td><div className="transaction-name"><span className={`transaction-icon ${t.tipo}`}><Icon size={16}/></span><strong>{t.descricao}</strong></div></td><td><span className="category-pill">{t.categoria}</span></td><td>{new Date(t.data+'T12:00:00').toLocaleDateString('pt-BR')}</td><td>{t.fonte || 'Conta principal'}</td><td className={t.tipo==='entrada'?'amount-in':'amount-out'}>{t.tipo==='entrada'?'+':'−'} {money(t.valor)}</td><td>{onDelete && <button className="table-action" onClick={()=>onDelete(t.id)}><MoreHorizontal size={18}/></button>}</td></tr>})}</tbody></table>{!transactions.length && <div className="empty-state">Nenhum lançamento encontrado neste período.</div>}</div>
}
function TransactionModal({ onClose, onSave }) {
  const [form,setForm]=useState({descricao:'',tipo:'saida',valor:'',data:new Date().toISOString().slice(0,10),categoria:'Alimentação',fonte:'Conta principal'})
  const change=e=>setForm({...form,[e.target.name]:e.target.value})
  const submit=e=>{e.preventDefault();if(!validateRequired(e))return;onSave({...form,id:Date.now(),valor:Number(form.valor)})}
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><form className="modal" onSubmit={submit} noValidate><div className="modal-head"><div><span className="eyebrow">MOVIMENTAÇÃO</span><h2>Novo lançamento</h2></div><button type="button" className="icon-btn" onClick={onClose}><X/></button></div><div className="type-switch"><button type="button" className={form.tipo==='saida'?'selected expense-selected':''} onClick={()=>setForm({...form,tipo:'saida',categoria:'Alimentação'})}>Saída</button><button type="button" className={form.tipo==='entrada'?'selected income-selected':''} onClick={()=>setForm({...form,tipo:'entrada',categoria:'Salário'})}>Entrada</button></div><Field label="Descrição"><input name="descricao" value={form.descricao} onChange={change} required placeholder="Ex.: Compras do mercado"/></Field><Field label="Valor (R$)"><input name="valor" type="number" min="0.01" step="0.01" value={form.valor} onChange={change} required placeholder="0,00"/></Field><div className="form-two"><Field label="Data"><input type="date" name="data" value={form.data} onChange={change} required/></Field><Field label="Categoria"><select name="categoria" value={form.categoria} onChange={change}>{(form.tipo==='entrada'?['Salário','Renda extra']:['Alimentação','Moradia','Transporte','Saúde','Lazer','Educação']).map(x=><option>{x}</option>)}</select></Field></div><Field label="Conta ou cartão"><select name="fonte" value={form.fonte} onChange={change}><option>Conta principal</option><option>Nubank</option><option>Visa</option></select></Field><div className="modal-actions"><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button className="btn-primary">Salvar lançamento</button></div></form></div>
}
function Transactions() {
  const [items,setItems]=useState(sampleTransactions),[modal,setModal]=useState(false),[query,setQuery]=useState(''),[filter,setFilter]=useState('todos')
  const filtered=items.filter(t=>t.descricao.toLowerCase().includes(query.toLowerCase())&&(filter==='todos'||t.tipo===filter))
  return <><PageHeading eyebrow="ACOMPANHE SEU DINHEIRO" title="Lançamentos" description="Todas as suas entradas e saídas em um só lugar." action="Novo lançamento" onAction={()=>setModal(true)}/><div className="stats-grid compact-stats"><StatCard label="Entradas" value={money(items.filter(t=>t.tipo==='entrada').reduce((a,t)=>a+t.valor,0))} trend="Neste mês" icon={ArrowDownRight} tone="green"/><StatCard label="Saídas" value={money(items.filter(t=>t.tipo==='saida').reduce((a,t)=>a+t.valor,0))} trend="Neste mês" icon={ArrowUpRight} tone="orange"/><StatCard label="Movimentações" value={items.length} trend="Registros" icon={ArrowLeftRight} tone="blue"/></div><section className="panel"><div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar lançamento..."/></div><select className="filter-select" value={filter} onChange={e=>setFilter(e.target.value)}><option value="todos">Todos os tipos</option><option value="entrada">Entradas</option><option value="saida">Saídas</option></select><button className="filter-select"><CalendarDays size={15}/> Novembro 2026</button></div><TransactionTable transactions={filtered} onDelete={id=>setItems(items.filter(t=>t.id!==id))}/></section>{modal&&<TransactionModal onClose={()=>setModal(false)} onSave={t=>{setItems([t,...items]);setModal(false)}}/>}</>
}
function Categories() {
  const [items,setItems]=useState(initialCategories),[name,setName]=useState(''),[type,setType]=useState('saida')
  function add(e){e.preventDefault();if(!validateRequired(e))return;if(name.trim())setItems([...items,{id:Date.now(),nome:name.trim(),tipo:type,cor:'#7180F5'}]);setName('')}
  return <><PageHeading eyebrow="ORGANIZE SUAS MOVIMENTAÇÕES" title="Categorias" description="Personalize como você classifica suas entradas e despesas."/><div className="two-col-layout"><section className="panel"><div className="panel-heading"><div><h3>Suas categorias</h3><p>{items.length} categorias cadastradas</p></div></div><div className="category-list">{items.map(c=><div className="category-row" key={c.id}><span className="category-color" style={{background:c.cor}}><Tags size={17}/></span><div className="category-row-text"><strong>{c.nome}</strong><small>{c.tipo==='entrada'?'Entrada':'Saída'}</small></div><span className={`type-badge ${c.tipo}`}>{c.tipo==='entrada'?'Receita':'Despesa'}</span><button className="table-action" onClick={()=>setItems(items.filter(x=>x.id!==c.id))}><X size={16}/></button></div>)}</div></section><section className="panel form-panel"><h3>Adicionar categoria</h3><p>Crie uma categoria para manter tudo organizado.</p><form onSubmit={add} noValidate><Field label="Nome da categoria"><input value={name} onChange={e=>setName(e.target.value)} required placeholder="Ex.: Pets, Viagens..."/></Field><Field label="Tipo de movimentação"><select value={type} onChange={e=>setType(e.target.value)}><option value="saida">Despesa</option><option value="entrada">Receita</option></select></Field><button className="btn-primary full-btn"><Plus size={16}/> Adicionar categoria</button></form></section></div></>
}
function Accounts() {
  const [items,setItems]=useState(initialAccounts)
  return <><PageHeading eyebrow="SUAS FONTES E DESTINOS" title="Contas e cartões" description="Tenha uma visão clara de onde seu dinheiro está."/><div className="account-grid">{items.map((a,i)=><div className={`account-card ${a.tipo==='cartao_credito'?'credit-card':''}`} key={a.id}><div className="account-card-top"><span className="account-chip">{a.tipo==='conta'?'CONTA':'CARTÃO DE CRÉDITO'}</span><MoreHorizontal size={19}/></div><div className="account-name">{a.nome}</div>{a.tipo==='conta'?<><small>Saldo disponível</small><strong className="account-balance">{money(a.saldo)}</strong></>:<><small>Fatura atual</small><strong className="account-balance">{money(a.usado)}</strong><div className="limit-track"><i style={{width:`${a.usado/a.limite*100}%`}}/></div><div className="limit-info"><span>Limite utilizado</span><b>{money(a.usado)} / {money(a.limite)}</b></div><div className="card-dates"><span>Fecha dia <b>{a.fechamento}</b></span><span>Vence dia <b>{a.vencimento}</b></span></div></>}</div>)}</div><div className="info-note"><Sparkles size={18}/><span><strong>Dica:</strong> cadastre todas as suas contas e cartões para acompanhar seus limites e prever suas próximas faturas.</span></div></>
}
function Reports() {
  return <><PageHeading eyebrow="ENTENDA SEUS HÁBITOS" title="Relatórios" description="Transforme seus dados em decisões mais conscientes."/><div className="report-filters"><button className="select-like"><CalendarDays size={15}/> 01 nov — 30 nov, 2026 <ChevronDown size={15}/></button><span className="muted">Comparativo com outubro de 2026</span></div><div className="stats-grid"><StatCard label="Total de entradas" value={money(6750)} trend="+10,2%" icon={ArrowDownRight} tone="green"/><StatCard label="Total de saídas" value={money(2412.7)} trend="-6,4%" icon={ArrowUpRight} tone="orange"/><StatCard label="Saldo do período" value={money(4337.3)} trend="+18,6%" icon={TrendingUp} tone="blue"/></div><div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h3>Entradas x saídas</h3><p>Comparativo dos últimos seis meses.</p></div></div><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 5"/><XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill:'#9aa3b5',fontSize:12}}/><Tooltip formatter={v=>money(v)}/><Bar dataKey="entradas" fill="#36B7A0" radius={[5,5,0,0]}/><Bar dataKey="saidas" fill="#7180F5" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section><section className="panel"><div className="panel-heading"><div><h3>Gastos por categoria</h3><p>Distribuição das despesas.</p></div></div><div className="report-categories">{categoryData.map(c=><div className="report-cat" key={c.name}><div><span><i style={{background:c.color}}/>{c.name}</span><b>{money(c.value)}</b></div><div className="progress-track"><i style={{width:`${c.value/2412.7*100}%`,background:c.color}}/></div></div>)}</div></section></div><section className="panel report-table"><div className="panel-heading"><div><h3>Resumo por categoria</h3><p>Valores do período selecionado.</p></div></div><table className="data-table"><thead><tr><th>CATEGORIA</th><th>TOTAL</th><th>% DAS SAÍDAS</th><th>VARIAÇÃO</th></tr></thead><tbody>{categoryData.map((c,i)=><tr key={c.name}><td><strong>{c.name}</strong></td><td>{money(c.value)}</td><td>{(c.value/2412.7*100).toFixed(1).replace('.',',')}%</td><td className={i===1?'amount-out':'amount-in'}>{i===1?'+8,2%':'−3,4%'}</td></tr>)}</tbody></table></section></>
}
function Invoices() {
  const [month,setMonth]=useState(0)
  const months=['Novembro 2026','Dezembro 2026','Janeiro 2027','Fevereiro 2027']
  return <><PageHeading eyebrow="PLANEJE SEUS PRÓXIMOS MESES" title="Faturas" description="Visualize suas faturas abertas e antecipe os próximos compromissos."/><div className="invoice-summary"><div><span>Comprometimento total</span><strong>{money(2760)}</strong><small>Somando os cartões cadastrados</small></div><div><span>Limite disponível</span><strong className="amount-in">{money(5740)}</strong><small>Em todos os cartões</small></div><div><span>Próximo vencimento</span><strong>27 nov</strong><small>Nubank · daqui a 11 dias</small></div></div><div className="invoice-tabs">{months.map((m,i)=><button className={month===i?'active':''} onClick={()=>setMonth(i)}>{m}</button>)}</div><div className="two-col-layout">{['Nubank','Visa'].map((name,i)=><section className="panel invoice-card" key={name}><div className="invoice-top"><div className={`bank-mark bank-${i}`}>{i===0?'nu':'V'}</div><div><strong>{name}</strong><small>Cartão de crédito</small></div><span className="status-open">Em aberto</span></div><div className="invoice-amount">{money((i===0?1840:920)+(month*280))}</div><span className="muted">Valor previsto da fatura</span><div className="invoice-dates"><span>Fechamento<strong>{i===0?'20':'12'}/{month===0?'11':month===1?'12':'01'}</strong></span><span>Vencimento<strong>{i===0?'27':'19'}/{month===0?'11':month===1?'12':'01'}</strong></span></div><div className="invoice-divider"/><div className="invoice-purchase"><span>Mercado e compras</span><strong>{money(i===0?642.8:420)}</strong></div><div className="invoice-purchase"><span>Assinaturas e serviços</span><strong>{money(i===0?89.9:99.9)}</strong></div><div className="invoice-purchase"><span>Parcelas futuras</span><strong>{money(i===0?1107.3:400)}</strong></div><button className="btn-secondary full-btn">Ver detalhes <ArrowUpRight size={15}/></button></section>)}</div><p className="disclaimer">Valores demonstrativos. A previsão real depende dos lançamentos registrados e das regras de fechamento de cada cartão.</p></>
}
function Health() {
  return <><PageHeading eyebrow="UM OLHAR PARA O SEU FUTURO" title="Saúde financeira" description="Pequenos hábitos hoje podem fazer uma grande diferença amanhã."/><div className="health-banner"><div className="health-spark"><Sparkles size={24}/></div><div><span className="eyebrow">SEU MOMENTO FINANCEIRO</span><h2>Você está construindo um bom caminho.</h2><p>Sua taxa de economia está acima da média dos últimos meses. Continue assim!</p></div><div className="health-score"><strong>78</strong><span>de 100</span></div></div><div className="stats-grid"><StatCard label="Taxa de economia" value="18,6%" trend="+3,2 p.p." icon={PiggyBank} tone="green"/><StatCard label="Comprometimento da renda" value="35,7%" trend="Saudável" icon={CreditCard} tone="blue"/><StatCard label="Reserva de emergência" value="2,4 meses" trend="Meta: 6 meses" positive={false} icon={Wallet} tone="purple"/></div><div className="two-col-layout"><section className="panel"><div className="panel-heading"><div><h3>Regra 50 · 30 · 20</h3><p>Uma referência para distribuir sua renda.</p></div></div>{[['Necessidades',50,42,'#7180F5'],['Desejos',30,24,'#F2B66D'],['Economia',20,18.6,'#36B7A0']].map(([n,target,actual,color])=><div className="health-rule"><div className="rule-head"><strong>{n}</strong><span>{actual}% <small>/ {target}%</small></span></div><div className="progress-track"><i style={{width:`${actual/target*100}%`,background:color}}/></div></div>)}</section><section className="panel tips-panel"><div className="panel-heading"><div><h3>Insights para você</h3><p>Algumas ideias baseadas nos seus números.</p></div><Sparkles size={18} color="#8A7CF6"/></div><div className="tip"><span className="tip-icon green"><PiggyBank size={17}/></span><div><strong>Continue poupando</strong><p>Você economizou 18,6% da sua renda neste mês. Ótimo trabalho!</p></div></div><div className="tip"><span className="tip-icon orange"><CreditCard size={17}/></span><div><strong>Fique de olho nas faturas</strong><p>Você tem R$ 2.760,00 previstos nos próximos vencimentos.</p></div></div><div className="tip"><span className="tip-icon purple"><TrendingUp size={17}/></span><div><strong>Construa sua reserva</strong><p>Uma boa meta é chegar a 3–6 meses de despesas guardadas.</p></div></div></section></div><p className="disclaimer">As informações desta página são educativas e não constituem recomendação financeira profissional.</p></>
}

export default App
