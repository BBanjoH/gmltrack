import { useEffect, useState } from 'react'
import { Building2, MapPin, PenLine, Plus, Stethoscope, Trash2, Users } from 'lucide-react'
import { Button, Card, EmptyState, Field, Input, Modal, PageHeader, Textarea } from '../components/ui'
import { newId, nowIso } from '../lib/constants'

export default function Wards({ departments, setDepartments, devices, nurses }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const close = () => {
    setOpen(false)
    setEditing(null)
  }

  const save = (data) => {
    setDepartments(
      editing
        ? departments.map((d) => (d.id === editing.id ? { ...editing, ...data } : d))
        : [...departments, { id: newId(), addedAt: nowIso(), ...data }]
    )
    close()
  }

  const remove = (id) => {
    if (confirm('Remove this ward? Devices and nurses assigned to it will become unassigned.')) {
      setDepartments(departments.filter((d) => d.id !== id))
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Setup"
        title="Wards & nurse stations"
        subtitle="Define your hospital's wards, then assign devices and nurses to them."
      >
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Add ward
        </Button>
      </PageHeader>

      <Card>
        {departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No wards set up yet"
            hint="Add your hospital wards and nurse stations. Once set up, you can assign devices and nurses to each ward for a clear at-a-glance view on the dashboard."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4" />
                Add first ward
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {departments.map((ward) => {
              const deviceCount = devices.filter((d) => d.departmentId === ward.id).length
              const nurseCount = nurses.filter((n) => n.departmentId === ward.id).length
              return (
                <div key={ward.id} className="px-5 py-4 hover:bg-stone-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-stone-900">{ward.name}</p>
                        {ward.location && (
                          <span className="text-xs text-stone-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {ward.location}
                          </span>
                        )}
                      </div>
                      {ward.description && <p className="text-sm text-stone-600 mt-0.5">{ward.description}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          {deviceCount} device{deviceCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {nurseCount} nurse{nurseCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditing(ward)
                          setOpen(true)
                        }}
                        className="p-2 rounded-lg hover:bg-stone-200 text-stone-600"
                        aria-label="Edit ward"
                      >
                        <PenLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => remove(ward.id)}
                        className="p-2 rounded-lg hover:bg-rose-100 text-rose-600"
                        aria-label="Remove ward"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <WardModal open={open} ward={editing} onClose={close} onSave={save} />
    </div>
  )
}

const EMPTY_WARD = { name: '', location: '', description: '', notes: '' }

function WardModal({ open, ward, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_WARD)
  useEffect(() => setForm(ward || EMPTY_WARD), [ward, open])

  const submit = (e) => {
    e.preventDefault()
    if (form.name.trim()) onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={ward ? 'Edit ward' : 'Add ward'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ward / Station name" required>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. ICU, Ward A, Maternity, Emergency"
            required
          />
        </Field>
        <Field label="Location" hint="Floor, block, or building">
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Floor 2, Block B"
          />
        </Field>
        <Field label="Description" hint="Brief note about this ward">
          <Textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. 12-bed intensive care unit"
          />
        </Field>
        <Field label="Notes">
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{ward ? 'Save changes' : 'Add ward'}</Button>
        </div>
      </form>
    </Modal>
  )
}
