import { useEffect, useState } from 'react'
import { Building2, PenLine, Plus, Search, Stethoscope, Trash2 } from 'lucide-react'
import {
  Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Textarea, WardSelect,
} from '../components/ui'
import { newId, nowIso } from '../lib/constants'

export default function Devices({ devices, setDevices, departments }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [query, setQuery] = useState('')
  const [ward, setWard] = useState('')

  const q = query.toLowerCase()
  const filtered = devices.filter(
    (d) =>
      (!query || [d.name, d.serial, d.location].some((v) => v?.toLowerCase().includes(q))) &&
      (!ward || d.departmentId === ward)
  )

  const close = () => {
    setOpen(false)
    setEditing(null)
  }

  const save = (data) => {
    setDevices(
      editing
        ? devices.map((d) => (d.id === editing.id ? { ...editing, ...data } : d))
        : [...devices, { id: newId(), addedAt: nowIso(), ...data }]
    )
    close()
  }

  const remove = (id) => {
    if (confirm('Remove device? Past records stay intact.')) setDevices(devices.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Setup" title="Device registry">
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Add device
        </Button>
      </PageHeader>

      {devices.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search by name, serial, or location"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {departments.length > 0 && (
            <Select value={ward} onChange={(e) => setWard(e.target.value)} className="w-48">
              <option value="">All wards</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      <Card>
        {devices.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No devices registered yet"
            hint="Add all medical devices you want to track."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4" />
                Add first device
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map((device) => {
              const dep = departments.find((d) => d.id === device.departmentId)
              return (
                <div key={device.id} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-stone-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-stone-900">{device.name}</p>
                      {device.type && <Badge>{device.type}</Badge>}
                      {dep && (
                        <Badge tone="neutral">
                          <Building2 className="w-3 h-3 -ml-0.5" />
                          {dep.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      {device.serial && (
                        <span>
                          Serial: <span className="font-mono">{device.serial}</span>
                        </span>
                      )}
                      {device.serial && device.location && ' · '}
                      {device.location && <span>Location: {device.location}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(device)
                        setOpen(true)
                      }}
                      className="p-2 rounded-lg hover:bg-stone-200 text-stone-600"
                      aria-label="Edit device"
                    >
                      <PenLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(device.id)}
                      className="p-2 rounded-lg hover:bg-rose-100 text-rose-600"
                      aria-label="Remove device"
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

      <DeviceModal open={open} device={editing} departments={departments} onClose={close} onSave={save} />
    </div>
  )
}

const EMPTY_DEVICE = { name: '', type: '', serial: '', location: '', notes: '', departmentId: '' }

function DeviceModal({ open, device, departments, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_DEVICE)
  useEffect(() => setForm(device || EMPTY_DEVICE), [device, open])

  const submit = (e) => {
    e.preventDefault()
    if (form.name.trim()) onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={device ? 'Edit device' : 'Add device'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Device name" required>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Patient monitor — Bed 4"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Device type">
            <Input
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              placeholder="e.g. Infusion pump"
            />
          </Field>
          <Field label="Serial / Asset ID">
            <Input
              value={form.serial}
              onChange={(e) => setForm({ ...form, serial: e.target.value })}
              placeholder="e.g. PM-2024-007"
            />
          </Field>
        </div>
        <Field label="Physical location">
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Bay 3, Bed 7"
          />
        </Field>
        {departments.length > 0 && (
          <WardSelect
            value={form.departmentId}
            onChange={(v) => setForm({ ...form, departmentId: v })}
            departments={departments}
            hint="Assign this device to a ward for dashboard grouping"
          />
        )}
        <Field label="Notes" hint="Service history, special handling instructions.">
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{device ? 'Save changes' : 'Add device'}</Button>
        </div>
      </form>
    </Modal>
  )
}
