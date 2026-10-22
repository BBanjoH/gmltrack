import { supabase } from './supabase'

// Row (snake_case) -> app (camelCase), and back.
export const fromDepartment = (r) => ({
  id: r.id, name: r.name, location: r.location || '', description: r.description || '',
  notes: r.notes || '', addedAt: r.added_at, createdAt: r.created_at,
})
export const toDepartment = (d) => ({
  id: d.id, name: d.name, location: d.location || '', description: d.description || '', notes: d.notes || '',
})

export const fromDevice = (r) => ({
  id: r.id, name: r.name, type: r.type || '', serial: r.serial || '', location: r.location || '',
  notes: r.notes || '', addedAt: r.added_at, departmentId: r.department_id || '',
})
export const toDevice = (d) => ({
  id: d.id, name: d.name, type: d.type || '', serial: d.serial || '', location: d.location || '',
  notes: d.notes || '', department_id: d.departmentId || null,
})

export const fromNurse = (r) => ({
  id: r.id, name: r.name, employeeId: r.employee_id || '', role: r.role || '',
  addedAt: r.added_at, departmentId: r.department_id || '',
})
export const toNurse = (n) => ({
  id: n.id, name: n.name, employee_id: n.employeeId || '', role: n.role || '',
  department_id: n.departmentId || null,
})

export const fromHandover = (r) => ({
  id: r.id, datetime: r.datetime, shift: r.shift,
  outgoingNurseId: r.outgoing_nurse_id, incomingNurseId: r.incoming_nurse_id,
  checks: r.checks || [], generalNotes: r.general_notes || '',
  outgoingSignature: r.outgoing_signature || '', incomingSignature: r.incoming_signature || '',
  completedAt: r.completed_at,
})
export const toHandover = (h) => ({
  id: h.id, datetime: h.datetime, shift: h.shift,
  outgoing_nurse_id: h.outgoingNurseId, incoming_nurse_id: h.incomingNurseId,
  checks: h.checks, general_notes: h.generalNotes || '',
  outgoing_signature: h.outgoingSignature, incoming_signature: h.incomingSignature,
  completed_at: h.completedAt,
})

export const fromIncident = (r) => ({
  id: r.id, datetime: r.datetime, deviceId: r.device_id, reportingNurseId: r.reporting_nurse_id,
  severity: r.severity, description: r.description, witnesses: r.witnesses || '',
  signature: r.signature || '', resolved: r.resolved || false, resolvedAt: r.resolved_at,
})
export const toIncident = (i) => ({
  id: i.id, datetime: i.datetime, device_id: i.deviceId, reporting_nurse_id: i.reportingNurseId,
  severity: i.severity, description: i.description, witnesses: i.witnesses || '',
  signature: i.signature || '', resolved: i.resolved || false, resolved_at: i.resolvedAt || null,
})

// Diff the previous and next lists and push inserts / deletes / updates to Supabase.
export async function syncTable(table, prev, next, toRow) {
  const prevIds = new Set(prev.map((x) => x.id))
  const nextIds = new Set(next.map((x) => x.id))
  const ops = [
    ...next.filter((x) => !prevIds.has(x.id)).map((x) => supabase.from(table).insert(toRow(x))),
    ...prev.filter((x) => !nextIds.has(x.id)).map((x) => supabase.from(table).delete().eq('id', x.id)),
    ...next
      .filter((x) => prevIds.has(x.id) && JSON.stringify(prev.find((p) => p.id === x.id)) !== JSON.stringify(x))
      .map((x) => supabase.from(table).update(toRow(x)).eq('id', x.id)),
  ]
  if (!ops.length) return
  const results = await Promise.all(ops)
  const failed = results.find((r) => r.error)
  if (failed) throw failed.error
}
