import { useEffect, useState } from 'react'
import { Building2, Eye, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Textarea } from '../components/ui'
import { SEVERITIES, formatDate, localDatetimeInput, newId, nowIso } from '../lib/constants'

export default function Incidents({ incidents, setIncidents, devices, nurses, departments }) {
  const [reportOpen, setReportOpen] = useState(false)
  const [viewing, setViewing] = useState(null)

  const sorted = [...incidents].sort((a, b) => new Date(b.datetime) - new Date(a.datetime))

  const add = (data) => {
    setIncidents([...incidents, { id: newId(), resolved: false, ...data }])
    setReportOpen(false)
  }

  const toggleResolved = (id) =>
    setIncidents(
      incidents.map((i) => (i.id === id ? { ...i, resolved: !i.resolved, resolvedAt: i.resolved ? null : nowIso() } : i))
    )

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Mid-shift reporting" title="Incident reports">
        {devices.length > 0 && nurses.length > 0 && (
          <Button onClick={() => setReportOpen(true)} variant="danger">
            <TriangleAlert className="w-4 h-4" />
            Report incident
          </Button>
        )}
      </PageHeader>

      <Card>
        {sorted.length === 0 ? (
          <EmptyState
            icon={TriangleAlert}
            title="No incidents reported"
            hint="Use this when a device fails during a shift, between handovers. Creates an immediate timestamped record."
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {sorted.map((inc) => {
              const device = devices.find((d) => d.id === inc.deviceId)
              const reporter = nurses.find((n) => n.id === inc.reportingNurseId)
              const dep = departments.find((d) => d.id === device?.departmentId)
              const sev = SEVERITIES.find((s) => s.id === inc.severity)
              return (
                <div key={inc.id} className={`px-5 py-4 hover:bg-stone-50 ${inc.resolved ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-stone-900">{device?.name || 'Removed'}</p>
                        <Badge tone={sev?.tone}>{sev?.label}</Badge>
                        {dep && (
                          <Badge tone="neutral">
                            <Building2 className="w-3 h-3 -ml-0.5" />
                            {dep.name}
                          </Badge>
                        )}
                        {inc.resolved && <Badge tone="good">Resolved</Badge>}
                      </div>
                      <p className="text-sm text-stone-700 mt-1">{inc.description}</p>
                      <p className="text-xs text-stone-500 mt-1">
                        By {reporter?.name || 'Unknown'} · {formatDate(inc.datetime)}
                        {inc.witnesses && ` · Witnesses: ${inc.witnesses}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setViewing(inc)} aria-label="View incident">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <button
                        onClick={() => toggleResolved(inc.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          inc.resolved
                            ? 'border-stone-300 text-stone-600 hover:bg-stone-100'
                            : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {inc.resolved ? 'Reopen' : 'Mark resolved'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <IncidentForm
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSave={add}
        devices={devices}
        nurses={nurses}
        departments={departments}
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Incident details" size="lg">
        {viewing && <IncidentDetail incident={viewing} devices={devices} nurses={nurses} departments={departments} />}
      </Modal>
    </div>
  )
}

const Label = ({ children }) => (
  <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">{children}</p>
)

function IncidentDetail({ incident, devices, nurses, departments }) {
  const device = devices.find((d) => d.id === incident.deviceId)
  const reporter = nurses.find((n) => n.id === incident.reportingNurseId)
  const dep = departments.find((d) => d.id === device?.departmentId)
  const sev = SEVERITIES.find((s) => s.id === incident.severity)

  return (
    <div className="space-y-4 text-sm">
      <div className="flex gap-2 flex-wrap">
        <Badge tone={sev?.tone}>{sev?.label} severity</Badge>
        {dep && (
          <Badge tone="neutral">
            <Building2 className="w-3 h-3 -ml-0.5" />
            {dep.name}
          </Badge>
        )}
        {incident.resolved && <Badge tone="good">Resolved</Badge>}
      </div>
      <div>
        <Label>Device</Label>
        <p className="font-semibold mt-0.5">{device?.name || 'Removed'}</p>
        {device?.serial && <p className="text-xs text-stone-500 font-mono">{device.serial}</p>}
      </div>
      <div>
        <Label>When</Label>
        <p className="mt-0.5">{formatDate(incident.datetime)}</p>
      </div>
      <div>
        <Label>Reported by</Label>
        <p className="font-semibold mt-0.5">{reporter?.name}</p>
        <p className="text-xs text-stone-500">
          {reporter?.employeeId} · {reporter?.role}
        </p>
      </div>
      {incident.witnesses && (
        <div>
          <Label>Witnesses</Label>
          <p className="mt-0.5">{incident.witnesses}</p>
        </div>
      )}
      <div>
        <Label>Description</Label>
        <p className="mt-0.5 bg-stone-50 rounded-lg p-3">{incident.description}</p>
      </div>
      {incident.signature && (
        <div className="pt-3 border-t border-stone-200">
          <Label>Signed</Label>
          <p className="italic text-stone-700 mt-0.5">{incident.signature}</p>
        </div>
      )}
    </div>
  )
}

const emptyIncident = () => ({
  datetime: localDatetimeInput(),
  deviceId: '',
  reportingNurseId: '',
  severity: 'minor',
  description: '',
  witnesses: '',
  signature: '',
})

function IncidentForm({ open, onClose, onSave, devices, nurses, departments }) {
  const [form, setForm] = useState(emptyIncident)
  useEffect(() => {
    if (open) setForm(emptyIncident())
  }, [open])

  const valid = form.deviceId && form.reportingNurseId && form.description.trim() && form.signature.trim()

  const submit = (e) => {
    e.preventDefault()
    if (valid) onSave({ ...form, datetime: new Date(form.datetime).toISOString() })
  }

  const deviceOption = (d) => (
    <option key={d.id} value={d.id}>
      {d.name} {d.serial && `(${d.serial})`}
    </option>
  )

  return (
    <Modal open={open} onClose={onClose} title="Report incident" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-900">
          Use this to log a device fault during <strong>your shift</strong> (between handovers).
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="When" required>
            <Input
              type="datetime-local"
              value={form.datetime}
              onChange={(e) => setForm({ ...form, datetime: e.target.value })}
              required
            />
          </Field>
          <Field label="Severity" required>
            <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              {SEVERITIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Device involved" required>
          <Select value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} required>
            <option value="">Select device…</option>
            {departments.length > 0 ? (
              <>
                {departments.map((dep) => {
                  const wardDevices = devices.filter((d) => d.departmentId === dep.id)
                  if (wardDevices.length === 0) return null
                  return (
                    <optgroup key={dep.id} label={dep.name}>
                      {wardDevices.map(deviceOption)}
                    </optgroup>
                  )
                })}
                {devices.some((d) => !departments.find((dep) => dep.id === d.departmentId)) && (
                  <optgroup label="Unassigned">
                    {devices.filter((d) => !departments.find((dep) => dep.id === d.departmentId)).map(deviceOption)}
                  </optgroup>
                )}
              </>
            ) : (
              devices.map(deviceOption)
            )}
          </Select>
        </Field>
        <Field label="Reporting nurse" required>
          <Select
            value={form.reportingNurseId}
            onChange={(e) => setForm({ ...form, reportingNurseId: e.target.value })}
            required
          >
            <option value="">Select…</option>
            {nurses.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} {n.employeeId && `(${n.employeeId})`}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="What happened" required hint="Be specific: what was the device doing, when did the issue appear?">
          <Textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </Field>
        <Field label="Witnesses" hint="Names of other staff who saw the incident">
          <Input
            value={form.witnesses}
            onChange={(e) => setForm({ ...form, witnesses: e.target.value })}
            placeholder="e.g. Dr. Adegoke, Nurse Bello"
          />
        </Field>
        <Field label="Type your full name to sign" required>
          <Input value={form.signature} onChange={(e) => setForm({ ...form, signature: e.target.value })} required />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={!valid}>
            Submit incident report
          </Button>
        </div>
      </form>
    </Modal>
  )
}
