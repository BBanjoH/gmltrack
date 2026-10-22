import { useMemo } from 'react'
import {
  ArrowRight, Building2, ChevronRight, CircleAlert, ClipboardCheck, MapPin, Stethoscope, TriangleAlert, Users,
} from 'lucide-react'
import { Badge, Button, Card, PageHeader, StatCard } from '../components/ui'
import { SEVERITIES, displayFont, formatDate } from '../lib/constants'

const isFlagged = (c) => c === 'damaged' || c === 'missing'

export default function Dashboard({ departments, devices, nurses, handovers, incidents, onJump }) {
  const recentHandovers = [...handovers].sort((a, b) => new Date(b.datetime) - new Date(a.datetime)).slice(0, 5)
  const openIncidents = incidents.filter((i) => !i.resolved)

  // Latest recorded condition per device, replaying handovers oldest -> newest.
  const latestCondition = useMemo(() => {
    const map = {}
    ;[...handovers]
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      .forEach((h) => h.checks.forEach((c) => (map[c.deviceId] = c.condition)))
    return map
  }, [handovers])

  const flaggedCount = Object.values(latestCondition).filter(isFlagged).length

  const wardStats = useMemo(
    () =>
      departments.map((dep) => {
        const wardDevices = devices.filter((d) => d.departmentId === dep.id)
        return {
          dep,
          deviceCount: wardDevices.length,
          nurseCount: nurses.filter((n) => n.departmentId === dep.id).length,
          openIncCount: openIncidents.filter(
            (i) => devices.find((d) => d.id === i.deviceId)?.departmentId === dep.id
          ).length,
          damagedCount: wardDevices.filter((d) => isFlagged(latestCondition[d.id])).length,
        }
      }),
    [departments, devices, nurses, openIncidents, latestCondition]
  )

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Overview" title="Department dashboard" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Devices tracked" value={devices.length} icon={Stethoscope} />
        <StatCard label="Nurses on roster" value={nurses.length} icon={Users} />
        <StatCard label="Handovers logged" value={handovers.length} icon={ClipboardCheck} tone="good" />
        <StatCard
          label="Open incidents"
          value={openIncidents.length}
          icon={TriangleAlert}
          tone={openIncidents.length ? 'bad' : 'neutral'}
        />
      </div>

      {flaggedCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <CircleAlert className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">
              {flaggedCount} device{flaggedCount > 1 ? 's' : ''} currently flagged as damaged or missing
            </p>
            <p className="text-sm text-rose-800 mt-0.5">
              Review the audit log to identify which shift first recorded the issue.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onJump('audit')}>
            Review
          </Button>
        </div>
      )}

      {departments.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-stone-500" />
              <h2 className="font-semibold text-stone-900">Wards & nurse stations</h2>
            </div>
            <button
              onClick={() => onJump('wards')}
              className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              Manage
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {wardStats.map(({ dep, deviceCount, nurseCount, openIncCount, damagedCount }) => {
              const alerts = damagedCount + openIncCount
              return (
                <Card key={dep.id} className={`p-5 ${alerts ? 'border-amber-200' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 truncate">{dep.name}</p>
                      {dep.location && (
                        <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {dep.location}
                        </p>
                      )}
                    </div>
                    {alerts ? (
                      <Badge tone="warn">
                        {alerts} alert{alerts > 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <Badge tone="good">Clear</Badge>
                    )}
                  </div>
                  {dep.description && <p className="text-xs text-stone-600 mb-3 line-clamp-2">{dep.description}</p>}
                  <div className="border-t border-stone-100 pt-3 grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-stone-900" style={displayFont}>
                        {deviceCount}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">Devices</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-stone-900" style={displayFont}>
                        {nurseCount}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">Nurses</p>
                    </div>
                  </div>
                  {alerts > 0 && (
                    <div className="mt-3 space-y-1">
                      {damagedCount > 0 && (
                        <p className="text-xs text-amber-800 bg-amber-50 rounded-md px-2 py-1">
                          ⚠ {damagedCount} device{damagedCount > 1 ? 's' : ''} damaged / missing
                        </p>
                      )}
                      {openIncCount > 0 && (
                        <p className="text-xs text-rose-800 bg-rose-50 rounded-md px-2 py-1">
                          ⚠ {openIncCount} open incident{openIncCount > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-stone-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-stone-900">No wards set up yet</p>
              <p className="text-sm text-stone-600 mt-0.5">
                Add your hospital wards and nurse stations to see a live breakdown of devices and staff per ward on
                this dashboard.
              </p>
              <button
                onClick={() => onJump('wards')}
                className="mt-2 text-sm font-medium text-stone-900 hover:underline flex items-center gap-1"
              >
                Set up wards
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Recent handovers</h2>
            <button
              onClick={() => onJump('handover')}
              className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {recentHandovers.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone-500">No handovers yet</div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentHandovers.map((h) => {
                const flagged = h.checks.filter((c) => c.condition !== 'working').length
                const out = nurses.find((n) => n.id === h.outgoingNurseId)?.name || 'Unknown'
                const inc = nurses.find((n) => n.id === h.incomingNurseId)?.name || 'Unknown'
                return (
                  <li key={h.id} className="px-5 py-3.5 hover:bg-stone-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {out}
                          <ArrowRight className="inline w-3.5 h-3.5 mx-1 text-stone-400" />
                          {inc}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {formatDate(h.datetime)} · {h.checks.length} devices
                        </p>
                      </div>
                      {flagged > 0 ? <Badge tone="warn">{flagged} flagged</Badge> : <Badge tone="good">All clear</Badge>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Open incidents</h2>
            <button
              onClick={() => onJump('incidents')}
              className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {openIncidents.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone-500">No open incidents</div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {openIncidents.slice(0, 5).map((i) => {
                const device = devices.find((d) => d.id === i.deviceId)
                const ward = departments.find((d) => d.id === device?.departmentId)
                const sev = SEVERITIES.find((s) => s.id === i.severity)
                return (
                  <li key={i.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">{device?.name || 'Device removed'}</p>
                        <p className="text-xs text-stone-500 mt-0.5 truncate">
                          {ward && `${ward.name} · `}
                          {formatDate(i.datetime)}
                        </p>
                      </div>
                      <Badge tone={sev?.tone}>{i.severity}</Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-stone-200">
          <h2 className="font-semibold text-stone-900">How accountability works</h2>
        </div>
        <div className="p-5 grid md:grid-cols-3 gap-5 text-sm">
          {[
            { n: 1, t: 'Inspect at handover', b: 'Both nurses jointly inspect every device at each shift change.' },
            { n: 2, t: 'Sign jointly', b: 'Both nurses confirm the condition. The record is locked immediately.' },
            {
              n: 3,
              t: 'Audit when needed',
              b: 'Find the shift where a device went from working to damaged. The signers are accountable.',
            },
          ].map((s) => (
            <div key={s.n}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center text-xs font-semibold">
                  {s.n}
                </div>
                <p className="font-semibold text-stone-900">{s.t}</p>
              </div>
              <p className="text-stone-600">{s.b}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
