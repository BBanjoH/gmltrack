import { Fragment, useState } from 'react'
import {
  ArrowRight, BadgeCheck, Building2, Check, ChevronRight, CircleAlert, ClipboardCheck, ClipboardList, Eye, Settings,
} from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Textarea } from '../components/ui'
import { CONDITIONS, SHIFTS, TONES, formatDate, localDatetimeInput, newId, nowIso } from '../lib/constants'

export default function Handovers({ devices, nurses, handovers, setHandovers, departments }) {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [viewing, setViewing] = useState(null)

  const sorted = [...handovers].sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
  const ready = devices.length > 0 && nurses.length >= 2

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Daily workflow" title="Shift handovers">
        {ready && (
          <Button onClick={() => setWizardOpen(true)} variant="success">
            <ClipboardList className="w-4 h-4" />
            Start new handover
          </Button>
        )}
      </PageHeader>

      {!ready && (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-stone-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-stone-900">Setup required before first handover</p>
              <p className="text-sm text-stone-600 mt-1">You need at least one device and two nurses first.</p>
              <ul className="text-sm text-stone-700 mt-2 space-y-1">
                <li>
                  • Devices: <span className="font-mono font-semibold">{devices.length}</span>
                </li>
                <li>
                  • Nurses: <span className="font-mono font-semibold">{nurses.length}</span> (need at least 2)
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {sorted.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No handovers recorded yet"
            hint="Both nurses inspect each device together and sign off. The record is locked and timestamped."
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {sorted.map((h) => {
              const out = nurses.find((n) => n.id === h.outgoingNurseId)
              const inc = nurses.find((n) => n.id === h.incomingNurseId)
              const flagged = h.checks.filter((c) => c.condition !== 'working').length
              const dep = departments.find((d) => d.id === out?.departmentId)
              return (
                <div key={h.id} className="px-5 py-4 hover:bg-stone-50">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-stone-900">
                          {out?.name || 'Unknown'}
                          <ArrowRight className="inline w-4 h-4 mx-1.5 text-stone-400" />
                          {inc?.name || 'Unknown'}
                        </p>
                        <Badge>{SHIFTS.find((s) => s.id === h.shift)?.label || h.shift}</Badge>
                        {dep && (
                          <Badge tone="neutral">
                            <Building2 className="w-3 h-3 -ml-0.5" />
                            {dep.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {formatDate(h.datetime)} · {h.checks.length} devices
                        {flagged > 0 && <span className="text-amber-700 font-medium"> · {flagged} flagged</span>}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setViewing(h)}>
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {wizardOpen && (
        <HandoverWizard
          devices={devices}
          nurses={nurses}
          departments={departments}
          onClose={() => setWizardOpen(false)}
          onSave={(data) => {
            setHandovers([...handovers, { id: newId(), ...data }])
            setWizardOpen(false)
          }}
        />
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Handover record" size="lg">
        {viewing && <HandoverDetail handover={viewing} devices={devices} nurses={nurses} departments={departments} />}
      </Modal>
    </div>
  )
}

function HandoverDetail({ handover, devices, nurses, departments }) {
  const out = nurses.find((n) => n.id === handover.outgoingNurseId)
  const inc = nurses.find((n) => n.id === handover.incomingNurseId)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Outgoing nurse', nurse: out, sig: handover.outgoingSignature },
          { label: 'Incoming nurse', nurse: inc, sig: handover.incomingSignature },
        ].map(({ label, nurse, sig }) => {
          const dep = departments.find((d) => d.id === nurse?.departmentId)
          return (
            <div key={label} className="bg-stone-100 rounded-lg p-3">
              <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">{label}</p>
              <p className="font-semibold text-stone-900 mt-1">{nurse?.name || 'Unknown'}</p>
              <p className="text-xs text-stone-500">
                {nurse?.employeeId}
                {dep && ` · ${dep.name}`}
              </p>
              {sig && <p className="text-xs text-stone-600 mt-2 italic">Signed: {sig}</p>}
            </div>
          )
        })}
      </div>
      <p className="text-sm text-stone-600">
        {formatDate(handover.datetime)} · {SHIFTS.find((s) => s.id === handover.shift)?.label}
      </p>
      <div className="border-t border-stone-200 pt-4">
        <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-3">Device inspection</p>
        <ul className="space-y-2">
          {handover.checks.map((c, idx) => {
            const device = devices.find((d) => d.id === c.deviceId)
            const cond = CONDITIONS.find((x) => x.id === c.condition)
            const dep = departments.find((d) => d.id === device?.departmentId)
            return (
              <li key={idx} className="bg-white border border-stone-200 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-stone-900">{device?.name || 'Removed'}</p>
                    <p className="text-xs text-stone-500">
                      {device?.serial && <span className="font-mono mr-2">{device.serial}</span>}
                      {dep && dep.name}
                    </p>
                  </div>
                  <Badge tone={cond?.tone || 'neutral'}>{cond?.label}</Badge>
                </div>
                {c.notes && <p className="text-sm text-stone-700 mt-2 pl-3 border-l-2 border-stone-200">{c.notes}</p>}
              </li>
            )
          })}
        </ul>
      </div>
      {handover.generalNotes && (
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-1">General notes</p>
          <p className="text-sm text-stone-700 bg-stone-50 rounded-lg p-3">{handover.generalNotes}</p>
        </div>
      )}
    </div>
  )
}

const STEP_LABELS = { 1: 'Shift details', 2: 'Inspect devices', 3: 'Sign off' }

function NurseOptions({ nurses, departments }) {
  return nurses.map((n) => {
    const dep = departments.find((d) => d.id === n.departmentId)
    return (
      <option key={n.id} value={n.id}>
        {n.name}
        {dep ? ` (${dep.name})` : ''}
        {n.employeeId ? ` — ${n.employeeId}` : ''}
      </option>
    )
  })
}

function HandoverWizard({ devices, nurses, departments, onClose, onSave }) {
  const [step, setStep] = useState(1)
  const [shift, setShift] = useState('morning')
  const [outgoingId, setOutgoingId] = useState('')
  const [incomingId, setIncomingId] = useState('')
  const [datetime, setDatetime] = useState(localDatetimeInput())
  const [checks, setChecks] = useState(devices.map((d) => ({ deviceId: d.id, condition: 'working', notes: '' })))
  const [generalNotes, setGeneralNotes] = useState('')
  const [outgoingSig, setOutgoingSig] = useState('')
  const [incomingSig, setIncomingSig] = useState('')

  const updateCheck = (idx, patch) => setChecks(checks.map((c, i) => (i === idx ? { ...c, ...patch } : c)))

  const step1Valid = outgoingId && incomingId && outgoingId !== incomingId
  const step2Valid = checks.every((c) => c.condition === 'working' || c.notes.trim().length > 0)
  const step3Valid = outgoingSig.trim() && incomingSig.trim()

  const submit = () =>
    onSave({
      datetime: new Date(datetime).toISOString(),
      shift,
      outgoingNurseId: outgoingId,
      incomingNurseId: incomingId,
      checks,
      generalNotes,
      outgoingSignature: outgoingSig,
      incomingSignature: incomingSig,
      completedAt: nowIso(),
    })

  const working = checks.filter((c) => c.condition === 'working').length

  return (
    <Modal open onClose={onClose} title="New shift handover" size="xl">
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <Fragment key={n}>
            <div className={`flex items-center gap-2 ${step >= n ? 'text-stone-900' : 'text-stone-400'}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step > n ? 'bg-emerald-600 text-white' : step === n ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'
                }`}
              >
                {step > n ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{STEP_LABELS[n]}</span>
            </div>
            {n < 3 && <div className={`flex-1 h-px ${step > n ? 'bg-emerald-500' : 'bg-stone-200'}`} />}
          </Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date and time" required>
              <Input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
            </Field>
            <Field label="Shift" required>
              <Select value={shift} onChange={(e) => setShift(e.target.value)}>
                {SHIFTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.hours})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Outgoing nurse" required hint="Handing over">
              <Select value={outgoingId} onChange={(e) => setOutgoingId(e.target.value)}>
                <option value="">Select…</option>
                <NurseOptions nurses={nurses} departments={departments} />
              </Select>
            </Field>
            <Field label="Incoming nurse" required hint="Taking over">
              <Select value={incomingId} onChange={(e) => setIncomingId(e.target.value)}>
                <option value="">Select…</option>
                <NurseOptions nurses={nurses.filter((n) => n.id !== outgoingId)} departments={departments} />
              </Select>
            </Field>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm">
            <CircleAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-amber-900">
              Both nurses must be physically present. Signing confirms joint, in-person inspection.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button disabled={!step1Valid} onClick={() => setStep(2)}>
              Continue to inspection
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Inspect each device together. Any condition other than "Working" requires a description note.
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {checks.map((check, idx) => {
              const device = devices.find((d) => d.id === check.deviceId)
              const dep = departments.find((d) => d.id === device?.departmentId)
              return (
                <div key={check.deviceId} className="bg-white border border-stone-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="font-semibold text-stone-900">{device.name}</p>
                    {device.serial && <span className="text-xs text-stone-500 font-mono">{device.serial}</span>}
                    {dep && (
                      <Badge tone="neutral">
                        <Building2 className="w-3 h-3 -ml-0.5" />
                        {dep.name}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                    {CONDITIONS.map((c) => {
                      const t = TONES[c.tone]
                      const active = check.condition === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateCheck(idx, { condition: c.id })}
                          className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition ${
                            active
                              ? `${t.bg} ${t.text} ${t.border}`
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {c.short}
                        </button>
                      )
                    })}
                  </div>
                  {check.condition !== 'working' && (
                    <Textarea
                      rows={2}
                      placeholder="Describe the issue (required)"
                      value={check.notes}
                      onChange={(e) => updateCheck(idx, { notes: e.target.value })}
                      className={check.notes.trim() ? '' : 'border-amber-400 ring-1 ring-amber-200'}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <Field label="General handover notes (optional)">
            <Textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Any context for the next shift"
            />
          </Field>
          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button disabled={!step2Valid} onClick={() => setStep(3)}>
              Continue to sign-off
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-stone-100 rounded-lg p-4 text-sm">
            <p className="font-semibold text-stone-900 mb-1">Summary</p>
            <p className="text-stone-700">
              {checks.length} devices · {working} working · {checks.length - working} flagged
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            <p className="font-semibold mb-1">By signing, both nurses confirm:</p>
            <ul className="list-disc list-inside text-amber-800 space-y-0.5">
              <li>Inspection was performed jointly and in person</li>
              <li>Recorded conditions accurately reflect each device's state</li>
              <li>This record cannot be edited once submitted</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Outgoing nurse — type full name to sign" required>
              <Input
                value={outgoingSig}
                onChange={(e) => setOutgoingSig(e.target.value)}
                placeholder={nurses.find((n) => n.id === outgoingId)?.name}
              />
            </Field>
            <Field label="Incoming nurse — type full name to sign" required>
              <Input
                value={incomingSig}
                onChange={(e) => setIncomingSig(e.target.value)}
                placeholder={nurses.find((n) => n.id === incomingId)?.name}
              />
            </Field>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="success" disabled={!step3Valid} onClick={submit}>
              <BadgeCheck className="w-4 h-4" />
              Lock and submit record
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
