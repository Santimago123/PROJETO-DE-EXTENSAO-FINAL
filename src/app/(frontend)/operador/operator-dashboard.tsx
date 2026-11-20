'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { operatorLogout, updateRequestStatus } from './operator-actions'
import type {
  OperatorActionState,
  OperatorRequestView,
  OperatorStatus,
} from './operator-action-state'

const statusOptions: { value: OperatorStatus; label: string }[] = [
  { value: 'received', label: 'Solicitação recebida' },
  { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
]

const categoryNames: Record<string, string> = {
  computer: 'Computador / Notebook',
  network: 'Internet / Wi-Fi / Roteador',
  maintenance: 'Formatação, limpeza e vírus',
  peripherals: 'Impressoras e periféricos',
  other: 'Outro / Não identificado',
}

const statusStyles: Record<OperatorStatus, string> = {
  received: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-600/10',
}

function formatDate(value: string, withTime = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' as const } : {}),
  }).format(date)
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm leading-6 text-slate-700">
        {value || 'Não informado'}
      </dd>
    </div>
  )
}

function RequestCard({ request }: { request: OperatorRequestView }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OperatorStatus>(request.status)
  const [feedback, setFeedback] = useState<OperatorActionState | null>(null)
  const [pending, startTransition] = useTransition()
  const address = [
    `${request.address.street}, ${request.address.number}`,
    request.address.complement,
    request.address.district,
    `${request.address.city} · CEP ${request.address.postalCode}`,
  ]
    .filter(Boolean)
    .join(' — ')

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`request-${request.id}`}
        onClick={() => setExpanded((current) => !current)}
        className={`flex w-full min-w-0 items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-7 ${
          expanded ? 'border-b border-slate-100' : ''
        }`}
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="rounded-lg bg-[#4169E1]/10 px-2.5 py-1 text-xs font-bold text-[#4169E1]">
              OS {request.protocol}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Aberto em {formatDate(request.createdAt, true)}
            </span>
          </span>
          <span className="mt-3 block truncate text-base font-semibold tracking-tight sm:text-xl">
            {categoryNames[request.category] || request.category}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span
            className={`hidden rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset sm:inline-flex ${statusStyles[request.status]}`}
          >
            {statusOptions.find((option) => option.value === request.status)?.label}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {expanded && (
        <div id={`request-${request.id}`}>
          <div className="border-b border-slate-100 px-5 py-3 sm:hidden">
            <span
              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusStyles[request.status]}`}
            >
              {statusOptions.find((option) => option.value === request.status)?.label}
            </span>
          </div>

          <div className="grid min-w-0 gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div className="min-w-0 space-y-7">
              <section>
                <h3 className="text-sm font-bold text-slate-900">Problema informado</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                  {request.description}
                </p>
              </section>

              <dl className="grid min-w-0 gap-5 sm:grid-cols-2">
                <Detail label="Cliente" value={request.customer.name} />
                <Detail label="E-mail" value={request.customer.email} />
                <Detail label="WhatsApp" value={request.whatsapp || request.customer.phone} />
                <Detail label="Data solicitada" value={formatDate(request.scheduledFor)} />
                <Detail label="Equipamento" value={request.deviceModel} />
                <Detail label="Sistema operacional" value={request.operatingSystem} />
              </dl>

              <div className="min-w-0 rounded-xl bg-slate-50 p-4">
                <Detail label="Endereço do atendimento" value={address} />
              </div>
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900">Fotos anexadas</h3>
              {request.photos.length > 0 ? (
                <div className="mt-3 grid min-w-0 grid-cols-2 gap-3">
                  {request.photos.map((photo, index) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative aspect-[4/3] min-w-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200"
                      aria-label={`Abrir foto ${index + 1} do chamado ${request.protocol}`}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.alt || `Foto ${index + 1} do chamado ${request.protocol}`}
                        fill
                        sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 180px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] font-bold text-white">
                        FOTO {index + 1}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Nenhuma foto disponível.
                </p>
              )}
            </div>
          </div>

          <div className="min-w-0 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-7">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="block min-w-0 max-w-full text-sm font-semibold text-slate-700 lg:w-80">
                Atualizar status
                <select
                  value={selectedStatus}
                  onChange={(event) => {
                    setSelectedStatus(event.target.value as OperatorStatus)
                    setFeedback(null)
                  }}
                  className="mt-2 block w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none transition focus:border-[#4169E1] focus:ring-4 focus:ring-[#4169E1]/10 sm:px-4"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                {feedback?.message && (
                  <p
                    role="status"
                    className={`break-words text-sm font-medium ${
                      feedback.status === 'success' ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {feedback.message}
                  </p>
                )}
                <button
                  type="button"
                  disabled={pending || selectedStatus === request.status}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await updateRequestStatus(request.id, selectedStatus)
                      setFeedback(result)
                      if (result.status === 'success') router.refresh()
                    })
                  }
                  className="w-full rounded-xl bg-[#4169E1] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3458c7] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-36"
                >
                  {pending ? 'Salvando...' : 'Salvar status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

export function OperatorDashboard({
  operatorName,
  requests,
  loadError,
}: {
  operatorName: string
  requests: OperatorRequestView[]
  loadError?: string
}) {
  const router = useRouter()
  const [loggingOut, startLogout] = useTransition()

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#4169E1]">RESOLVER</p>
            <p className="mt-1 text-sm text-slate-500">Painel de atendimento</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-right sm:block">
              <span className="block text-sm font-semibold">{operatorName}</span>
              <span className="block text-xs text-slate-400">Operador</span>
            </p>
            <button
              type="button"
              disabled={loggingOut}
              onClick={() =>
                startLogout(async () => {
                  await operatorLogout()
                  router.refresh()
                })
              }
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-[#4169E1]/30 hover:text-[#4169E1] disabled:opacity-50"
            >
              {loggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#4169E1]">ORDENS DE SERVIÇO</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Chamados dos clientes
            </h1>
            <p className="mt-3 text-slate-500">
              Consulte os detalhes e atualize somente o andamento do atendimento.
            </p>
          </div>
          <div className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-2xl font-semibold">{requests.length}</span>
            <span className="ml-2 text-sm text-slate-500">
              {requests.length === 1 ? 'chamado' : 'chamados'}
            </span>
          </div>
        </div>

        {loadError ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <h2 className="font-semibold">Não foi possível carregar os chamados</h2>
            <p className="mt-1 text-sm">{loadError}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold">Nenhum chamado no momento</h2>
            <p className="mt-2 text-sm text-slate-500">
              Novas solicitações aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="mt-8 min-w-0 space-y-4">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
