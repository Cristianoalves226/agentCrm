import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, Building2, CalendarClock, CheckCircle2, ChevronDown, CircleDollarSign, LayoutDashboard, LogOut, Menu, Plus, Search, Settings2, Target, Users, X, LoaderCircle, Mail, MapPin, ExternalLink } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Lead = {
  id: string
  name: string
  segment: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  website: string | null
  source: string | null
  status: string
  service: string | null
  estimated_value: number | null
  notes: string | null
  created_at: string
}
const stages = [
  { value: 'new', label: 'Novo lead' },
  { value: 'qualified', label: 'Analisado' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'replied', label: 'Respondeu' },
  { value: 'proposal', label: 'Proposta enviada' },
  { value: 'won', label: 'Fechado' },
  { value: 'lost', label: 'Perdido' },
]
const services = ['Site / landing page', 'Sistema web', 'Loja virtual', 'Manutenção', 'Automação / IA']
const emptyForm = { name: '', segment: '', city: '', state: 'MT', phone: '', email: '', website: '', source: 'Google Maps', service: services[0], estimated_value: '', notes: '' }
const demoLeads: Lead[] = []

function App() {
  const [session, setSession] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [leads, setLeads] = useState<Lead[]>(demoLeads)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [activeNav, setActiveNav] = useState('Visão geral')
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user || !supabase) { setLeads([]); return }
    let cancelled = false
    async function loadLeads() {
      setLoading(true); setError('')
      const { data, error: fetchError } = await supabase!.from('leads').select('*').order('created_at', { ascending: false })
      if (cancelled) return
      if (fetchError) setError(fetchError.message)
      else setLeads((data ?? []) as Lead[])
      setLoading(false)
    }
    void loadLeads()
    return () => { cancelled = true }
  }, [session?.user?.id])

  const filteredLeads = useMemo(() => leads.filter(lead => {
    const text = [lead.name, lead.segment, lead.city, lead.phone, lead.email, lead.website].filter(Boolean).join(' ').toLowerCase()
    return text.includes(query.toLowerCase()) && (stageFilter === 'all' || lead.status === stageFilter)
  }), [leads, query, stageFilter])
  const count = (status: string) => leads.filter(lead => lead.status === status).length
  const totalPipeline = leads.filter(lead => !['won', 'lost'].includes(lead.status)).reduce((sum, lead) => sum + (Number(lead.estimated_value) || 0), 0)
  const wonValue = leads.filter(lead => lead.status === 'won').reduce((sum, lead) => sum + (Number(lead.estimated_value) || 0), 0)
  const fmtMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  async function handleAuth(event: FormEvent) {
    event.preventDefault(); if (!supabase) return
    setAuthBusy(true); setAuthError('')
    const result = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      : await supabase.auth.signUp({ email: authEmail, password: authPassword })
    if (result.error) setAuthError(result.error.message)
    else if (authMode === 'signup' && !result.data.session) setAuthError('Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.')
    setAuthBusy(false)
  }
  async function logout() { if (supabase) await supabase.auth.signOut(); setSession(null); setLeads([]) }
  function openNewLead() { setEditingLead(null); setForm(emptyForm); setShowLeadForm(true) }
  function openEditLead(lead: Lead) {
    setEditingLead(lead)
    setForm({ name: lead.name, segment: lead.segment ?? '', city: lead.city ?? '', state: lead.state ?? 'MT', phone: lead.phone ?? '', email: lead.email ?? '', website: lead.website ?? '', source: lead.source ?? 'Outro', service: lead.service ?? services[0], estimated_value: lead.estimated_value?.toString() ?? '', notes: lead.notes ?? '' })
    setShowLeadForm(true)
  }
  async function saveLead(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !session?.user) return
    setSaving(true); setError('')
    const payload = { ...form, estimated_value: form.estimated_value ? Number(form.estimated_value) : null, user_id: session.user.id, status: editingLead?.status ?? 'new' }
    const result = editingLead
      ? await supabase.from('leads').update(payload).eq('id', editingLead.id).select().single()
      : await supabase.from('leads').insert(payload).select().single()
    if (result.error) setError(result.error.message)
    else {
      const row = result.data as Lead
      setLeads(current => editingLead ? current.map(item => item.id === row.id ? row : item) : [row, ...current])
      setShowLeadForm(false); setForm(emptyForm); setEditingLead(null)
    }
    setSaving(false)
  }
  async function changeStatus(lead: Lead, status: string) {
    if (!supabase) return
    const { data, error: updateError } = await supabase.from('leads').update({ status }).eq('id', lead.id).select().single()
    if (updateError) setError(updateError.message)
    else setLeads(current => current.map(item => item.id === lead.id ? data as Lead : item))
  }

  if (!authReady) return <div className="loading-screen"><LoaderCircle className="spin" size={28} /><span>Carregando painel...</span></div>
  if (!isSupabaseConfigured) return <div className="setup-screen"><div className="setup-card"><div className="brand-mark"><Target size={24}/></div><p className="eyebrow">AGENT CRM · CONFIGURAÇÃO</p><h1>Seu próximo cliente começa aqui.</h1><p>O projeto inicial já está preparado. Para ativar o login e salvar os dados com segurança, configure as variáveis do Supabase.</p><div className="setup-code"><code>VITE_SUPABASE_URL=...</code><code>VITE_SUPABASE_ANON_KEY=...</code></div><p className="muted">Copie o arquivo <strong>.env.example</strong> para <strong>.env.local</strong>, preencha os dados do seu projeto e execute o SQL de <strong>supabase/schema.sql</strong>.</p><a className="text-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Abrir Supabase <ExternalLink size={14}/></a></div></div>
  if (!session) return <div className="auth-screen"><div className="auth-art"><div className="brand"><div className="brand-mark"><Target size={23}/></div><span>agent<span className="brand-light">crm</span></span></div><div className="auth-pitch"><span className="pill"><span className="live-dot"/> PROSPECÇÃO MAIS ORGANIZADA</span><h1>Transforme boas pesquisas em <em>novos clientes.</em></h1><p>Um espaço só seu para encontrar oportunidades, organizar contatos e acompanhar cada negociação.</p><div className="auth-stats"><div><strong>01</strong><span>Encontre</span></div><div><strong>02</strong><span>Converse</span></div><div><strong>03</strong><span>Conquiste</span></div></div></div><div className="auth-foot">Feito para organizar seu próximo passo profissional.</div></div><div className="auth-panel"><form className="auth-form" onSubmit={handleAuth}><span className="eyebrow">{authMode === 'login' ? 'BEM-VINDO DE VOLTA' : 'COMECE POR AQUI'}</span><h2>{authMode === 'login' ? 'Entrar no painel' : 'Criar sua conta'}</h2><p>{authMode === 'login' ? 'Acesse seu espaço de prospecção.' : 'Crie seu acesso pessoal ao Agent CRM.'}</p><label>E-mail<input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="voce@exemplo.com" required autoComplete="email"/></label><label>Senha<input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" required minLength={6} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}/></label>{authError && <div className="inline-error">{authError}</div>}<button className="primary-btn full-btn" disabled={authBusy}>{authBusy && <LoaderCircle className="spin" size={16} />}{authMode === 'login' ? 'Entrar' : 'Criar conta'}</button><p className="auth-switch">{authMode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'} <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError('') }}>{authMode === 'login' ? 'Criar acesso' : 'Entrar'}</button></p></form><div className="secure-note"><CheckCircle2 size={15}/> Acesso privado com autenticação Supabase</div></div></div>

  const navItems = [{ label: 'Visão geral', icon: LayoutDashboard }, { label: 'Empresas e leads', icon: Building2 }, { label: 'Atividades', icon: Activity }, { label: 'Oportunidades', icon: CircleDollarSign }]
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}><div className="brand"><div className="brand-mark"><Target size={22}/></div><span>agent<span className="brand-light">crm</span></span></div><div className="workspace-label">ESPAÇO PESSOAL</div><nav>{navItems.map(item => <button key={item.label} className={activeNav === item.label ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav(item.label); setMobileNav(false) }}><item.icon size={18}/><span>{item.label}</span>{item.label === 'Empresas e leads' && <span className="nav-count">{leads.length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="region-card"><MapPin size={17}/><div><strong>Região de foco</strong><span>Mato Grosso, Brasil</span></div><ChevronDown size={14}/></div><button className="nav-item" onClick={() => setActiveNav('Configurações')}><Settings2 size={18}/><span>Configurações</span></button><div className="profile"><div className="avatar">{session.user.email?.slice(0,1).toUpperCase()}</div><div className="profile-info"><strong>{session.user.email?.split('@')[0]}</strong><span>{session.user.email}</span></div><button className="icon-btn" title="Sair" onClick={logout}><LogOut size={17}/></button></div></div></aside>
    {mobileNav && <button aria-label="Fechar menu" className="mobile-scrim" onClick={() => setMobileNav(false)} />}
    <main className="main-content"><header className="topbar"><button className="mobile-menu icon-btn" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button><div className="breadcrumbs">Painel <span>/</span> <strong>{activeNav}</strong></div><div className="topbar-right"><span className="date-label"><CalendarClock size={16}/> Sua central de prospecção</span><button className="primary-btn" onClick={openNewLead}><Plus size={17}/> Novo lead</button></div></header>
    <div className="page-content"><div className="welcome-row"><div><p className="eyebrow">SEU PRÓXIMO NEGÓCIO COMEÇA AQUI</p><h1>{activeNav === 'Visão geral' ? 'Visão geral' : activeNav}</h1><p className="subheading">Organize oportunidades e transforme contatos em clientes.</p></div><button className="secondary-btn" onClick={() => { setActiveNav('Empresas e leads'); document.getElementById('lead-list')?.scrollIntoView({ behavior: 'smooth' }) }}><Search size={16}/> Explorar leads</button></div>
    {error && <div className="error-banner">{error}<button className="icon-btn" onClick={() => setError('')}><X size={16}/></button></div>}
    <section className="stats-grid"><article className="stat-card"><div className="stat-top"><span>Total de leads</span><span className="stat-icon blue"><Users size={18}/></span></div><div className="stat-number">{leads.length}</div><div className="stat-foot"><span className="stat-neutral">Sua base de prospecção</span></div></article><article className="stat-card"><div className="stat-top"><span>Em negociação</span><span className="stat-icon violet"><Target size={18}/></span></div><div className="stat-number">{count('contacted') + count('replied') + count('proposal')}</div><div className="stat-foot"><ArrowUpRight size={14}/><span>Contatos em andamento</span></div></article><article className="stat-card"><div className="stat-top"><span>Pipeline estimado</span><span className="stat-icon amber"><CircleDollarSign size={18}/></span></div><div className="stat-number">{fmtMoney(totalPipeline)}</div><div className="stat-foot"><span className="stat-neutral">Oportunidades abertas</span></div></article><article className="stat-card"><div className="stat-top"><span>Vendas fechadas</span><span className="stat-icon green"><CheckCircle2 size={18}/></span></div><div className="stat-number">{fmtMoney(wonValue)}</div><div className="stat-foot"><ArrowDownRight size={14}/><span>{count('won')} negócio(s) ganho(s)</span></div></article></section>
    <section className="content-grid"><article className="panel pipeline-panel"><div className="panel-heading"><div><h2>Funil de prospecção</h2><p>Acompanhe cada oportunidade por etapa.</p></div><button className="text-button" onClick={() => { setStageFilter('all'); setActiveNav('Empresas e leads') }}>Ver leads <ArrowUpRight size={14}/></button></div><div className="pipeline-list">{stages.slice(0,6).map(stage => <button className="pipeline-row" key={stage.value} onClick={() => { setStageFilter(stage.value); setActiveNav('Empresas e leads') }}><span className={`stage-dot stage-${stage.value}`}/><span className="pipeline-label">{stage.label}</span><div className="pipeline-track"><span style={{ width: leads.length ? `${Math.max(count(stage.value) / leads.length * 100, count(stage.value) ? 5 : 0)}%` : '0%' }}/></div><strong>{count(stage.value)}</strong></button>)}</div></article><article className="panel quick-panel"><div className="panel-heading"><div><h2>Ações rápidas</h2><p>Ganhe tempo na rotina comercial.</p></div></div><button className="quick-action" onClick={openNewLead}><span className="quick-icon"><Plus size={18}/></span><span><strong>Cadastrar empresa</strong><small>Adicione um novo potencial cliente</small></span><ChevronDown className="quick-arrow" size={16}/></button><button className="quick-action" onClick={() => { setActiveNav('Empresas e leads'); setStageFilter('new') }}><span className="quick-icon"><Search size={18}/></span><span><strong>Revisar novos leads</strong><small>Qualifique empresas encontradas</small></span><ChevronDown className="quick-arrow" size={16}/></button><button className="quick-action" onClick={() => { setActiveNav('Empresas e leads'); setStageFilter('proposal') }}><span className="quick-icon"><Mail size={18}/></span><span><strong>Acompanhar propostas</strong><small>Veja quem está perto de fechar</small></span><ChevronDown className="quick-arrow" size={16}/></button><div className="tip-card"><div className="tip-heading"><Target size={16}/> Dica de prospecção</div><p>Personalize sua abordagem mostrando uma oportunidade concreta que você identificou no site ou na presença digital da empresa.</p></div></article></section>
    <section className="panel leads-panel" id="lead-list"><div className="panel-heading leads-heading"><div><h2>Empresas e leads</h2><p>Seu espaço para organizar potenciais clientes.</p></div><button className="secondary-btn" onClick={openNewLead}><Plus size={16}/> Adicionar lead</button></div><div className="table-controls"><div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por empresa, cidade, contato..."/></div><select value={stageFilter} onChange={e => setStageFilter(e.target.value)} aria-label="Filtrar por etapa"><option value="all">Todas as etapas</option>{stages.map(stage => <option value={stage.value} key={stage.value}>{stage.label}</option>)}</select></div>{loading ? <div className="empty-state"><LoaderCircle className="spin" size={24}/><p>Carregando leads...</p></div> : filteredLeads.length === 0 ? <div className="empty-state"><div className="empty-icon"><Building2 size={25}/></div><h3>{query || stageFilter !== 'all' ? 'Nenhum resultado encontrado' : 'Sua próxima oportunidade começa aqui'}</h3><p>{query || stageFilter !== 'all' ? 'Tente alterar os filtros de busca.' : 'Cadastre a primeira empresa que você encontrou para começar a organizar sua prospecção.'}</p>{!query && stageFilter === 'all' && <button className="primary-btn" onClick={openNewLead}><Plus size={16}/> Cadastrar primeiro lead</button>}</div> : <div className="table-wrap"><table><thead><tr><th>Empresa</th><th>Localização</th><th>Serviço</th><th>Etapa</th><th>Valor estimado</th><th></th></tr></thead><tbody>{filteredLeads.map(lead => <tr key={lead.id}><td><button className="company-cell" onClick={() => openEditLead(lead)}><span className="company-avatar">{lead.name.slice(0,1).toUpperCase()}</span><span><strong>{lead.name}</strong><small>{lead.segment || 'Segmento não informado'}</small></span></button></td><td><span className="location-cell">{[lead.city, lead.state].filter(Boolean).join(', ') || '—'}</span></td><td><span className="service-cell">{lead.service || '—'}</span></td><td><select className={`status-select status-${lead.status}`} value={lead.status} onChange={e => void changeStatus(lead, e.target.value)} aria-label={`Etapa de ${lead.name}`}>{stages.map(stage => <option key={stage.value} value={stage.value}>{stage.label}</option>)}</select></td><td className="money-cell">{lead.estimated_value ? fmtMoney(Number(lead.estimated_value)) : '—'}</td><td><button className="icon-btn" onClick={() => openEditLead(lead)} aria-label={`Editar ${lead.name}`}>•••</button></td></tr>)}</tbody></table></div>}</section>
    <footer className="page-footer"><span>Agent CRM <span className="footer-separator">·</span> Seu assistente pessoal de prospecção</span><span>Dados privados · Mato Grosso, Brasil</span></footer></div></main>
    {showLeadForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowLeadForm(false) }}><form className="lead-modal" onSubmit={saveLead}><div className="modal-heading"><div><span className="eyebrow">BASE DE PROSPECÇÃO</span><h2>{editingLead ? 'Editar empresa' : 'Novo lead'}</h2><p>Registre as informações que vão ajudar na sua próxima abordagem.</p></div><button type="button" className="icon-btn" onClick={() => setShowLeadForm(false)}><X size={20}/></button></div><div className="form-grid"><label className="field-wide">Nome da empresa *<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ex.: Academia Movimento"/></label><label>Segmento<input value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })} placeholder="Ex.: Academia"/></label><label>Serviço potencial<select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}>{services.map(s => <option key={s}>{s}</option>)}</select></label><label>Cidade<input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Ex.: Cuiabá"/></label><label>Estado<select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}><option>MT</option><option>MS</option><option>GO</option><option>RO</option><option>SP</option><option>PR</option><option>Outro</option></select></label><label>Telefone / WhatsApp<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(65) 99999-9999"/></label><label>E-mail<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com.br"/></label><label className="field-wide">Site<input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://empresa.com.br"/></label><label>Origem do lead<select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>{['Google Maps','Pesquisa web','Instagram','Facebook','Indicação','Planilha','Outro'].map(s => <option key={s}>{s}</option>)}</select></label><label>Valor estimado (R$)<input type="number" min="0" step="0.01" value={form.estimated_value} onChange={e => setForm({ ...form, estimated_value: e.target.value })} placeholder="1500"/></label><label className="field-wide">Observações<textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Oportunidades identificadas, data do contato, pontos para abordar..."/></label></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowLeadForm(false)}>Cancelar</button><button className="primary-btn" disabled={saving}>{saving && <LoaderCircle className="spin" size={16} />}{editingLead ? 'Salvar alterações' : 'Salvar lead'}</button></div></form></div>}
  </div>
}
export default App
