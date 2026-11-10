'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getEarliestScheduleDate, isBusinessDate } from '@/lib/scheduling'
import { authenticate, createServiceRequest, logout, resolveMunicipalityCode } from './actions'

type User = { id: string; name: string; email: string }
type Props = { initialUser: User | null; initialRequests: Record<string, unknown>[] }

const categories = [
  ['computer', 'Computador / Notebook', 'Não liga, travando ou tela azul', '⌘'],
  ['network', 'Internet / Wi-Fi / Roteador', 'Sem sinal, lentidão ou cabo partido', '⌁'],
  ['maintenance', 'Formatação, limpeza e vírus', 'Desempenho, segurança e manutenção', '✦'],
  ['peripherals', 'Impressoras e periféricos', 'Falhas de conexão ou funcionamento', '▣'],
  ['other', 'Outro / Não sei identificar', 'Conte para nós e ajudamos a descobrir', '?'],
] as const

const categoryNames = Object.fromEntries(categories.map(([value, label]) => [value, label]))
const statusNames: Record<string, string> = {
  received: 'Solicitação recebida',
  scheduled: 'Visita agendada',
  in_progress: 'Em atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const MAX_PHOTO_SIZE = 5 * 1024 * 1024

export function SupportApp({ initialUser, initialRequests }: Props) {
  const router = useRouter()
  const [user, setUser] = useState(initialUser)
  const [requests, setRequests] = useState(initialRequests)
  const [screen, setScreen] = useState<'new' | 'history'>('new')
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [category, setCategory] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})
  const [horarioSelecionado, setHorarioSelecionado] = useState('09:00')
  const [photos, setPhotos] = useState<File[]>([])
  const [message, setMessage] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [cityResolving, setCityResolving] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setRequests(initialRequests)
  }, [initialRequests])

  const chosenCategory = categoryNames[category] || ''
  const setField = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const scheduleLabel = useMemo(() => form.scheduledFor
    ? new Date(`${form.scheduledFor}T12:00:00`).toLocaleDateString('pt-BR')
    : 'Não informado', [form.scheduledFor])
  const earliestSchedule = useMemo(() => getEarliestScheduleDate(), [])
  const earliestScheduleLabel = useMemo(
    () => new Date(`${earliestSchedule}T12:00:00`).toLocaleDateString('pt-BR'),
    [earliestSchedule],
  )
  const addPhotos = (selected: File[]) => {
    const accepted = selected.filter((file) => file.size <= MAX_PHOTO_SIZE)
    const rejectedCount = selected.length - accepted.length
    setPhotos((current) => {
      const unique = new Map(
        [...current, ...accepted].map((file) => [
          `${file.name}-${file.size}-${file.lastModified}`,
          file,
        ]),
      )
      const nextPhotos = Array.from(unique.values()).slice(0, 5)
      setMessage(
        rejectedCount > 0
          ? `${rejectedCount} foto(s) excederam o limite de 5 MB e não foram adicionadas.`
          : nextPhotos.length === 5
            ? ''
            : `Você selecionou ${nextPhotos.length} de 5 fotos.`,
      )
      return nextPhotos
    })
  }
  const reset = () => { setStep(1); setCategory(''); setForm({}); setPhotos([]); setMessage(''); setScreen('new') }
  const resetSession = () => {
    reset()
    setRequests([])
    setMode('login')
    setUser(null)
  }
  const restartApp = () => {
    window.location.assign('/')
  }
  const resolveCity = async () => {
    const currentCity = (form.city || '').trim()
    if (!/^\d{7}$/.test(currentCity)) return

    setCityResolving(true)
    const result = await resolveMunicipalityCode(currentCity)
    if (result.ok && result.name) {
      setField('city', result.name)
      setMessage('')
    } else {
      setMessage(result.error || 'Digite o nome do município.')
    }
    setCityResolving(false)
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] p-4 text-slate-950 sm:p-8">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_rgba(15,23,42,.12)] lg:grid-cols-[1.08fr_.92fr]">
          <section className="relative hidden overflow-hidden bg-[#4169E1] p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/20 bg-white/10" />
            <button type="button" onClick={restartApp} className="relative flex items-center gap-3 font-semibold"><Image src="/resolver-logo.png" alt="Símbolo da Resolver" width={40} height={40} className="h-10 w-10 object-contain" priority unoptimized /> Resolver</button>
            <div className="relative max-w-md">
              <p className="mb-5 text-xs font-bold uppercase tracking-[.24em] text-white">Suporte sem complicação</p>
              <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">Seu problema técnico, resolvido.</h1>
              <p className="mt-6 text-lg leading-8 text-blue-100/80">Agende uma visita, acompanhe o atendimento e tenha seu equipamento funcionando novamente.</p>
            </div>
            <p className="relative text-sm text-blue-100/60">Atendimento seguro, rápido e transparente.</p>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-md">
              <button type="button" onClick={restartApp} className="mb-10 lg:hidden"><Image src="/resolver-logo.png" alt="Símbolo da Resolver" width={44} height={44} className="h-11 w-11 object-contain" priority unoptimized /></button>
              <p className="text-sm font-semibold text-[#4169E1]">BEM-VINDO</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight">{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</h2>
              <p className="mt-3 text-slate-500">{mode === 'login' ? 'Acesse seus chamados e agendamentos.' : 'Leva menos de um minuto para começar.'}</p>
              <form className="mt-8 space-y-4" action={(data) => startTransition(async () => {
                data.set('mode', mode)
                const result = await authenticate(data)
                if (result.ok && result.user) {
                  setMessage('')
                  setAuthPassword('')
                  setUser(result.user)
                  router.refresh()
                } else {
                  setAuthPassword('')
                  setMessage(result.error || 'Algo deu errado.')
                }
              })}>
                {mode === 'signup' && <>
                  <Field label="Nome completo" name="name" placeholder="Como podemos chamar você?" />
                  <Field label="Telefone" name="phone" placeholder="(00) 00000-0000" />
                </>}
                <Field label="E-mail" name="email" type="email" placeholder="voce@email.com" value={authEmail} onChange={setAuthEmail} />
                <Field label="Senha" name="password" type="password" placeholder="Mínimo de 6 caracteres" value={authPassword} onChange={setAuthPassword} />
                {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
                <button disabled={pending} className="w-full rounded-xl bg-[#4169E1] px-5 py-3.5 font-semibold text-white transition hover:bg-[#4169E1]/90 disabled:opacity-60">
                  {pending ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar minha conta'}
                </button>
              </form>
              <p className="mt-7 text-center text-sm text-slate-500">
                {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
                <button className="font-semibold text-[#4169E1] hover:underline" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setAuthPassword(''); setMessage('') }}>
                  {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
                </button>
              </p>
            </div>
          </section>
        </div>
      </main>
    )
  }

  const next = () => {
    setMessage('')
    if (step === 1 && !category) return setMessage('Escolha uma categoria para continuar.')
    const whatsappDigits = (form.whatsapp || '').replace(/\D/g, '')
    if (step === 2 && (!form.description || whatsappDigits.length < 10 || whatsappDigits.length > 13 || photos.length !== 5)) {
      return setMessage('Preencha a descrição, informe um WhatsApp válido com DDD e adicione exatamente 5 fotos.')
    }
    if (step === 3 && (!form.street || !form.number || !form.district || !form.city || !form.postalCode || !form.scheduledFor)) {
      return setMessage('Complete o endereço e escolha uma data.')
    }
    if (step === 3) {
      const currentMinimum = getEarliestScheduleDate()
      if (form.scheduledFor < currentMinimum || !isBusinessDate(form.scheduledFor)) {
        setField('scheduledFor', '')
        return setMessage(`A primeira data disponível é ${new Date(`${currentMinimum}T12:00:00`).toLocaleDateString('pt-BR')}.`)
      }
    }
    setStep((value) => Math.min(4, value + 1))
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <button type="button" onClick={restartApp} className="flex items-center gap-3 font-bold text-[#4169E1]" aria-label="Reiniciar solicitação e voltar ao início"><Image src="/resolver-logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" priority unoptimized /> Resolver</button>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">Olá, {user.name.split(' ')[0]}</span>
            <button className="rounded-lg border border-[#4169E1]/20 px-3 py-2 text-sm font-medium text-[#4169E1] hover:bg-[#4169E1]/5" onClick={() => startTransition(async () => { await logout(); resetSession() })}>Sair</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <nav className="mb-8 flex gap-2">
          <button onClick={() => { setScreen('new'); setMessage('') }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${screen === 'new' ? 'bg-[#4169E1] text-white' : 'bg-white text-slate-600'}`}>Novo chamado</button>
          <button onClick={() => { setScreen('history'); setMessage('') }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${screen === 'history' ? 'bg-[#4169E1] text-white' : 'bg-white text-slate-600'}`}>Meus pedidos <span className="ml-1 opacity-60">{requests.length}</span></button>
        </nav>

        {screen === 'history' ? (
          <section>
            <p className="text-sm font-semibold text-[#4169E1]">HISTÓRICO</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Seus pedidos</h1>
            <div className="mt-7 space-y-4">
              {requests.length === 0 && <EmptyState onNew={reset} />}
              {requests.map((request) => (
                <article key={String(request.id)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-[#4169E1]/10 px-2.5 py-1 text-xs font-bold text-[#4169E1]">{String(request.protocol)}</span>
                      <span className="text-sm text-slate-400">{new Date(String(request.createdAt)).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <h2 className="mt-3 font-semibold">{categoryNames[String(request.category)] || String(request.category)}</h2>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">{String(request.description)}</p>
                  </div>
                  <span className="mt-4 inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 sm:mt-0">{statusNames[String(request.status)] || String(request.status)}</span>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-4xl">
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Etapa {step} de 4</span>
                <span>{step * 25}% concluído</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-[#4169E1] transition-all" style={{ width: `${step * 25}%` }} />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
              {step === 1 && <>
                <p className="text-sm font-semibold text-[#4169E1]">VAMOS COMEÇAR</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Com o que você precisa de ajuda?</h1>
                <p className="mt-2 text-slate-500">Selecione a categoria que melhor descreve o problema.</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {categories.map(([value, label, description, icon]) => (
                    <button key={value} onClick={() => { setCategory(value); setMessage('') }} className={`flex min-h-28 items-center gap-4 rounded-2xl border p-4 text-left transition ${category === value ? 'border-[#4169E1] bg-[#4169E1]/5 ring-2 ring-[#4169E1]/10' : 'border-slate-200 hover:border-[#4169E1]/40 hover:bg-[#4169E1]/5'}`}>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#4169E1]/10 text-xl font-bold text-[#4169E1]">{icon}</span>
                      <span><strong className="block text-sm">{label}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span>
                    </button>
                  ))}
                </div>
              </>}

              {step === 2 && <>
                <p className="text-sm font-semibold text-[#4169E1]">DETALHES DO PROBLEMA</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Conte o que está acontecendo</h1>
                <div className="mt-7 space-y-5">
                  <label className="block text-sm font-semibold">Descrição do problema *<textarea value={form.description || ''} onChange={(e) => { setField('description', e.target.value); setMessage('') }} className="mt-2 min-h-36 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 font-normal outline-none transition focus:border-[#4169E1] focus:bg-white" placeholder="Quando começou? O que aparece na tela? O que você já tentou?" /></label>
                  <ClientField label="WhatsApp para combinar o horário *" value={form.whatsapp || ''} onChange={(value) => setField('whatsapp', value)} type="tel" placeholder="(00) 00000-0000" />
                  <p className="-mt-3 text-xs leading-5 text-slate-500">O empreendedor entrará em contato por este número para definir o melhor horário.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ClientField label="Sistema operacional" value={form.operatingSystem || ''} onChange={(value) => setField('operatingSystem', value)} placeholder="Ex: Windows 11" />
                    <ClientField label="Marca e modelo" value={form.deviceModel || ''} onChange={(value) => setField('deviceModel', value)} placeholder="Ex: Dell Inspiron 15" />
                  </div>
                  <label className="block min-w-0 max-w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition hover:border-[#4169E1]/40 sm:p-7">
                    <span className="block font-semibold">Adicione fotos do problema *</span>
                    <span className="mt-1 block text-sm text-slate-500">Selecione exatamente 5 imagens em JPG, PNG ou WEBP, com até 5 MB cada</span>
                    <input className="mt-4 block w-full max-w-full overflow-hidden text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#4169E1] file:px-4 file:py-2 file:font-semibold file:text-white" type="file" accept="image/*" multiple onChange={(e) => {
                      addPhotos(Array.from(e.target.files || []))
                      e.currentTarget.value = ''
                    }} />
                    {photos.length > 0 && <span className={`mt-3 block text-sm font-medium ${photos.length === 5 ? 'text-emerald-700' : 'text-red-700'}`}>{photos.length} de 5 fotos selecionadas</span>}
                    {photos.length > 0 && (
                      <span className="mt-4 grid w-full min-w-0 max-w-full gap-2 overflow-hidden text-left">
                        {photos.map((photo, index) => (
                          <span key={`${photo.name}-${photo.size}-${photo.lastModified}`} className="grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                            <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" title={photo.name}>{index + 1}. {photo.name}</span>
                            <button type="button" className="shrink-0 font-semibold text-[#4169E1] hover:underline" onClick={(event) => {
                              event.preventDefault()
                              setPhotos((current) => current.filter((item) => item !== photo))
                              setMessage('Complete novamente as 5 fotos para continuar.')
                            }}>Remover</button>
                          </span>
                        ))}
                      </span>
                    )}
                  </label>
                </div>
              </>}

              {step === 3 && <>
                <p className="text-sm font-semibold text-[#4169E1]">VISITA TÉCNICA</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Onde e quando podemos ajudar?</h1>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <ClientField label="CEP *" value={form.postalCode || ''} onChange={(value) => setField('postalCode', value)} placeholder="00000-000" autoComplete="postal-code" />
                  <ClientField label="Cidade *" value={form.city || ''} onChange={(value) => setField('city', value)} onBlur={resolveCity} placeholder="Sua cidade" autoComplete="address-level2" />
                  {cityResolving && <p className="-mt-2 text-xs text-[#4169E1] sm:col-start-2">Consultando município no IBGE...</p>}
                  <div className="sm:col-span-2"><ClientField label="Rua *" value={form.street || ''} onChange={(value) => setField('street', value)} placeholder="Nome da rua ou avenida" autoComplete="street-address" /></div>
                  <ClientField label="Número *" value={form.number || ''} onChange={(value) => setField('number', value)} placeholder="123" />
                  <ClientField label="Bairro *" value={form.district || ''} onChange={(value) => setField('district', value)} placeholder="Seu bairro" />
                  <ClientField label="Complemento" value={form.complement || ''} onChange={(value) => setField('complement', value)} placeholder="Apto, bloco, referência" />
                  <ClientField label="Data preferida *" value={form.scheduledFor || ''} onChange={(value) => {
                    const currentMinimum = getEarliestScheduleDate()
                    if (value && (value < currentMinimum || !isBusinessDate(value))) {
                      setField('scheduledFor', '')
                      setMessage(`A primeira data disponível é ${new Date(`${currentMinimum}T12:00:00`).toLocaleDateString('pt-BR')}.`)
                      return
                    }
                    setField('scheduledFor', value)
                    setMessage('')
                  }} type="date" min={earliestSchedule} />
                  <p className="text-xs leading-5 text-slate-500 sm:col-span-2"><strong className="text-[#4169E1]">Primeira data disponível: {earliestScheduleLabel}.</strong> Prazo mínimo de 2 dias úteis; após as 15h, o próximo dia útil não entra na contagem.</p>
                </div>
              </>}

              {step === 4 && <>
                <p className="text-sm font-semibold text-[#4169E1]">CONFIRMAÇÃO</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Revise seu chamado</h1>
                <p className="mt-2 text-slate-500">Confira os dados antes de enviar.</p>
                <div className="mt-7 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  <Summary label="Categoria" value={chosenCategory} />
                  <Summary label="Problema" value={form.description} />
                  <Summary label="WhatsApp" value={form.whatsapp} />
                  <Summary label="Equipamento" value={[form.deviceModel, form.operatingSystem].filter(Boolean).join(' • ') || 'Não informado'} />
                  <Summary label="Fotos" value={`${photos.length} arquivo(s)`} />
                  <Summary label="Endereço" value={`${form.street}, ${form.number} — ${form.district}, ${form.city}`} />
                  <Summary label="Data preferida" value={scheduleLabel} />
                </div>
              </>}

              {message && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
              <div className="mt-8 flex items-center justify-between gap-3">
                <button disabled={step === 1 || pending} onClick={() => setStep((value) => Math.max(1, value - 1))} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 disabled:invisible">Voltar</button>
                {step < 4 ? <button onClick={next} className="rounded-xl bg-[#4169E1] px-6 py-3 font-semibold text-white hover:bg-[#4169E1]/90">Continuar</button> :
                  <button disabled={pending} onClick={() => startTransition(async () => {
                    const data = new FormData()
                    Object.entries({ ...form, category }).forEach(([key, value]) => data.set(key, value))
                    photos.forEach((photo) => data.append('photos', photo))
                    try {
                      const result = await createServiceRequest(data)
                      if (result.ok && result.request) {
                        setRequests((current) => [result.request!, ...current])
                        setScreen('history')
                        setStep(1)
                        setCategory('')
                        setForm({})
                        setPhotos([])
                        setMessage('')
                        router.refresh()
                      } else if (result.reset === 'session') {
                        resetSession()
                      } else if (result.reset === 'request') {
                        reset()
                      } else {
                        setMessage(result.error || 'Não foi possível enviar.')
                      }
                    } catch {
                      setMessage('As fotos excederam o limite do envio. Use imagens de até 5 MB cada.')
                    }
                  })} className="rounded-xl bg-[#4169E1] px-6 py-3 font-semibold text-white hover:bg-[#4169E1]/90 disabled:opacity-60">{pending ? 'Enviando...' : 'Confirmar chamado'}</button>}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function Field({ label, name, type = 'text', placeholder = '', value, onChange }: { label: string; name: string; type?: string; placeholder?: string; value?: string; onChange?: (value: string) => void }) {
  return <label className="block text-sm font-semibold">{label}<input required name={name} type={type} placeholder={placeholder} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition focus:border-[#4169E1] focus:bg-white" /></label>
}

function ClientField({ label, value, onChange, onBlur, placeholder = '', type = 'text', min, autoComplete }: { label: string; value: string; onChange: (value: string) => void; onBlur?: () => void; placeholder?: string; type?: string; min?: string; autoComplete?: string }) {
  return <label className="block text-sm font-semibold">{label}<input value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} type={type} min={min} autoComplete={autoComplete} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none transition focus:border-[#4169E1] focus:bg-white" /></label>
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 p-4 sm:grid-cols-[9rem_1fr]"><span className="text-sm font-medium text-slate-400">{label}</span><span className="text-sm font-semibold">{value}</span></div>
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="text-xl font-semibold">Nenhum chamado ainda</h2><p className="mt-2 text-slate-500">Quando você solicitar um atendimento, ele aparecerá aqui.</p><button onClick={onNew} className="mt-5 rounded-xl bg-[#4169E1] px-5 py-3 font-semibold text-white">Criar primeiro chamado</button></div>
}