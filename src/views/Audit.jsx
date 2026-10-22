import { useMemo, useState } from 'react'
import { ArrowRight, Building2, ClipboardCheck, FileSearch, Search, TriangleAlert } from 'lucide-react'
import { Badge, Card, EmptyState, Input, PageHeader, Select } from '../components/ui'
import { CONDITIONS, SEVERITIES, formatDate } from '../lib/constants'

export default function Audit({ devices, nurses, handovers, incidents, departments }) {
  const [query, setQuery] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [nurseId, setNurseId] = useState('')
  const [wardId, setWardId] = useState('')

  const nurseName = (id) => nurses.find((n) => n.id === id)?.name

  const events = useMemo(() => {
    const inWard = (devId) => !wardId || devices.find((d) => d.id === devId)?.departmentId === wardId
    let list = []

    handovers.forEach((h) =>
      h.checks.forEach((c) => {
        if (deviceId && c.deviceId !== deviceId) return
        if (nurseId && h.outgoingNurseId !== nurseId && h.incomingNurseId !== nurseId) return
        if (!inWard(c.deviceId)) return
        list.push({
          type: 'handover',
          datetime: h.datetime,
          deviceId: c.deviceId,
          condition: c.condition,
          notes: c.notes,
          outgoing: h.outgoingNurseId,
          incoming: h.incomingNurseId,
        })
      })
    )

    incidents.forEach((i) => {
      if (deviceId && i.deviceId !== deviceId) return
      if (nurseId && i.reportingNurseId !== nurseId) return
      if (!inWard(i.deviceId)) return
      list.push({
        type: 'incident',
        datetime: i.datetime,
        deviceId: i.deviceId,
        severity: i.severity,
        description: i.description,
        reporting: i.reportingNurseId,
      })
    })

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((ev) => {
        const d = devices.find((x) => x.id === ev.deviceId)
        return [d?.name, d?.serial, ev.notes, ev.description, nurseName(ev.outgoing), nurseName(ev.incoming), nurseName(ev.reporting)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
    }

    return list.sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handovers, incidents, query, deviceId, nurseId, wardId, devices, nurses])

  // For a single device: the points where it went from "working" to anything else.
  const transitions = useMemo(() => {
    if (!deviceId) return null
    const chrono = events
      .filter((e) => e.deviceId === deviceId)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    const found = []
    let prev = null
    chrono.forEach((ev) => {
      const state = ev.type === 'handover' ? ev.condition : 'damaged'
      if (prev === 'working' && state !== 'working') found.push(ev)
      prev = state
    })
    return found
  }, [deviceId, events])

  const hasFilters = query || deviceId || nurseId || wardId

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Investigation"
        title="Audit log"
        subtitle="Trace any device's history to find the exact shift where damage first appeared."
      />

      <Card className="p-4 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search all records"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {departments.length > 0 && (
            <Select value={wardId} onChange={(e) => setWardId(e.target.value)}>
              <option value="">All wards</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
          <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            <option value="">All devices</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select value={nurseId} onChange={(e) => setNurseId(e.target.value)}>
            <option value="">All nurses</option>
            {nurses.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setQuery('')
              setDeviceId('')
              setNurseId('')
              setWardId('')
            }}
            className="text-xs text-stone-600 hover:text-stone-900"
          >
            Clear filters
          </button>
        )}
      </Card>

      {transitions && transitions.length > 0 && (
        <Card className="border-rose-200 bg-rose-50">
          <div className="px-5 py-4 border-b border-rose-200">
            <h2 className="font-semibold text-rose-900 flex items-center gap-2">
              <TriangleAlert className="w-5 h-5" />
              Accountability transitions detected
            </h2>
            <p className="text-sm text-rose-800 mt-1">Shifts where this device changed from working to flagged:</p>
          </div>
          <div className="divide-y divide-rose-200">
            {transitions.map((ev, idx) => (
              <div key={idx} className="px-5 py-3 text-sm">
                <p className="font-medium text-rose-900">
                  {formatDate(ev.datetime)} — {ev.type === 'handover' ? 'Discovered at handover' : 'Reported as incident'}
                </p>
                {ev.type === 'handover' && (
                  <p className="text-rose-800 mt-1">
                    Outgoing: <strong>{nurseName(ev.outgoing)}</strong> · Incoming: <strong>{nurseName(ev.incoming)}</strong>
                  </p>
                )}
                {ev.type === 'incident' && (
                  <p className="text-rose-800 mt-1">
                    Reported by: <strong>{nurseName(ev.reporting)}</strong>
                  </p>
                )}
                {(ev.notes || ev.description) && (
                  <p className="text-rose-700 mt-1 italic">"{ev.notes || ev.description}"</p>
                )}
              </div>
            ))}
          </div>
          <div className="px-5 py-3 text-xs text-rose-800 bg-rose-100 border-t border-rose-200">
            The signing nurses on the last "working" record before this transition bear primary accountability.
          </div>
        </Card>
      )}

      <Card>
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">Timeline</h2>
          <span className="text-xs text-stone-500">{events.length} events</span>
        </div>
        {events.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No events match"
            hint="Try clearing filters, or start recording handovers and incidents."
          />
        ) : (
          <ul className="divide-y divide-stone-100">
            {events.map((ev, idx) => {
              const device = devices.find((d) => d.id === ev.deviceId)
              const dep = departments.find((d) => d.id === device?.departmentId)
              const cond = ev.type === 'handover' ? CONDITIONS.find((c) => c.id === ev.condition) : null
              const sev = ev.type === 'incident' ? SEVERITIES.find((s) => s.id === ev.severity) : null
              return (
                <li key={idx} className="px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        ev.type === 'handover' ? 'bg-stone-100' : 'bg-rose-100'
                      }`}
                    >
                      {ev.type === 'handover' ? (
                        <ClipboardCheck className="w-4 h-4 text-stone-700" />
                      ) : (
                        <TriangleAlert className="w-4 h-4 text-rose-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-stone-900">{device?.name || 'Removed'}</p>
                        {cond && <Badge tone={cond.tone}>{cond.label}</Badge>}
                        {sev && <Badge tone={sev.tone}>{sev.label}</Badge>}
                        {dep && (
                          <Badge tone="neutral">
                            <Building2 className="w-3 h-3 -ml-0.5" />
                            {dep.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{formatDate(ev.datetime)}</p>
                      {ev.type === 'handover' && (
                        <p className="text-xs text-stone-600 mt-1">
                          {nurseName(ev.outgoing) || '—'}
                          <ArrowRight className="inline w-3 h-3 mx-1" />
                          {nurseName(ev.incoming) || '—'}
                        </p>
                      )}
                      {ev.type === 'incident' && (
                        <p className="text-xs text-stone-600 mt-1">Reported by {nurseName(ev.reporting) || '—'}</p>
                      )}
                      {(ev.notes || ev.description) && (
                        <p className="text-sm text-stone-700 mt-1 italic">"{ev.notes || ev.description}"</p>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
