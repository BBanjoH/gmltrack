import { useEffect, useState } from 'react'
import { Building2, PenLine, Plus, Trash2, Users } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, WardSelect } from '../components/ui'
import { newId, nowIso } from '../lib/constants'

const ROLES = ['Registered Nurse', 'Charge Nurse', 'Senior Nurse', 'Nurse Aide', 'Other']

const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export default function Nurses({ nurses, setNurses, departments }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [ward, setWard] = useState('')

  const filtered = nurses.filter((n) => !ward || n.departmentId === ward)

  const close = () => {
    setOpen(false)
    setEditing(null)
  }

  const save = (data) => {
    setNurses(
      editing
        ? nurses.map((n) => (n.id === editing.id ? { ...editing, ...data } : n))
        : [...nurses, { id: newId(), addedAt: nowIso(), ...data }]
    )
    close()
  }

  const remove = (id) => {
    if (confirm('Remove nurse? Past records stay intact.')) setNurses(nurses.filter((n) => n.id !== id))
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Setup" title="Nursing roster">
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Add nurse
        </Button>
      </PageHeader>

      {nurses.length > 0 && departments.length > 0 && (
        <Select value={ward} onChange={(e) => setWard(e.target.value)} className="w-48">
          <option value="">All wards</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      )}

      <Card>
        {nurses.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No nurses on the roster yet"
            hint="Add nursing staff who will participate in shift handovers."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4" />
                Add first nurse
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map((nurse) => {
              const dep = departments.find((d) => d.id === nurse.departmentId)
              return (
                <div key={nurse.id} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-stone-50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-stone-700">{initials(nurse.name)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-stone-900 truncate">{nurse.name}</p>
                        {dep && (
                          <Badge tone="neutral">
                            <Building2 className="w-3 h-3 -ml-0.5" />
                            {dep.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {nurse.employeeId && <span className="font-mono">{nurse.employeeId}</span>}
                        {nurse.employeeId && nurse.role && ' · '}
                        {nurse.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(nurse)
                        setOpen(true)
                      }}
                      className="p-2 rounded-lg hover:bg-stone-200 text-stone-600"
                      aria-label="Edit nurse"
                    >
                      <PenLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(nurse.id)}
                      className="p-2 rounded-lg hover:bg-rose-100 text-rose-600"
                      aria-label="Remove nurse"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <NurseModal open={open} nurse={editing} departments={departments} onClose={close} onSave={save} />
    </div>
  )
}

const EMPTY_NURSE = { name: '', employeeId: '', role: '', departmentId: '' }

function NurseModal({ open, nurse, departments, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_NURSE)
  useEffect(() => setForm(nurse || EMPTY_NURSE), [nurse, open])

  const submit = (e) => {
    e.preventDefault()
    if (form.name.trim()) onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={nurse ? 'Edit nurse' : 'Add nurse'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Adaeze Okonkwo"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Employee ID">
            <Input
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              placeholder="e.g. RN-0421"
            />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="">Select role</option>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
        </div>
        {departments.length > 0 && (
          <WardSelect
            value={form.departmentId}
            onChange={(v) => setForm({ ...form, departmentId: v })}
            departments={departments}
            hint="Home ward or primary nurse station"
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{nurse ? 'Save changes' : 'Add nurse'}</Button>
        </div>
      </form>
    </Modal>
  )
}
