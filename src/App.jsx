import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Building2, CircleAlert, ClipboardCheck, FileSearch, LayoutDashboard, ShieldCheck, Stethoscope, TriangleAlert, Users, X,
} from 'lucide-react'
import { supabase } from './lib/supabase'
import {
  fromDepartment, fromDevice, fromHandover, fromIncident, fromNurse, syncTable,
  toDepartment, toDevice, toHandover, toIncident, toNurse,
} from './lib/db'
import { displayFont } from './lib/constants'
import Dashboard from './views/Dashboard'
import Wards from './views/Wards'
import Devices from './views/Devices'
import Nurses from './views/Nurses'
import Handovers from './views/Handovers'
import Incidents from './views/Incidents'
import Audit from './views/Audit'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'handover', label: 'Handovers', icon: ClipboardCheck },
  { id: 'incidents', label: 'Incidents', icon: TriangleAlert },
  { id: 'audit', label: 'Audit log', icon: FileSearch },
  { id: 'devices', label: 'Devices', icon: Stethoscope },
  { id: 'nurses', label: 'Nurses', icon: Users },
  { id: 'wards', label: 'Wards', icon: Building2 },
]

const TABLES = {
  departments: { from: fromDepartment, to: toDepartment, order: ['added_at', true] },
  devices: { from: fromDevice, to: toDevice, order: ['added_at', true] },
  nurses: { from: fromNurse, to: toNurse, order: ['added_at', true] },
  handovers: { from: fromHandover, to: toHandover, order: ['datetime', false] },
  incidents: { from: fromIncident, to: toIncident, order: ['datetime', false] },
}

// One table's state: a ref holds the latest list so concurrent setters diff against it,
// `load` refetches from Supabase, and `set` updates optimistically then syncs.
function useTable(table, onSaveError) {
  const { from, to, order } = TABLES[table]
  const [rows, setRows] = useState([])
  const ref = useRef([])

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select('*').order(order[0], { ascending: order[1] })
    if (error) throw error
    const mapped = data.map(from)
    ref.current = mapped
    setRows(mapped)
  }, [table])

  const set = useCallback(
    (next) => {
      const prev = ref.current
      const value = typeof next === 'function' ? next(prev) : next
      ref.current = value
      setRows(value)
      syncTable(table, prev, value, to).catch((err) => {
        console.error(err)
        onSaveError(`Could not save to ${table}: ${err.message}`)
        load().catch(() => {})
      })
    },
    [table, load]
  )

  return [rows, set, load]
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [live, setLive] = useState(false)

  const [departments, setDepartments, loadDepartments] = useTable('departments', setSaveError)
  const [devices, setDevices, loadDevices] = useTable('devices', setSaveError)
  const [nurses, setNurses, loadNurses] = useTable('nurses', setSaveError)
  const [handovers, setHandovers, loadHandovers] = useTable('handovers', setSaveError)
  const [incidents, setIncidents, loadIncidents] = useTable('incidents', setSaveError)

  useEffect(() => {
    const loaders = {
      departments: loadDepartments,
      devices: loadDevices,
      nurses: loadNurses,
      handovers: loadHandovers,
      incidents: loadIncidents,
    }

    Promise.all(Object.values(loaders).map((fn) => fn()))
      .then(() => setLoading(false))
      .catch((err) => {
        setLoadError(err.message)
        setLoading(false)
      })

    let channel = supabase.channel('gmltrack-rt')
    Object.entries(loaders).forEach(([table, fn]) => {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => fn().catch(() => {}))
    })
    channel.subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadDepartments, loadDevices, loadNurses, loadHandovers, loadIncidents])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full spin mx-auto mb-3" />
          <p className="text-stone-600 text-sm">Connecting to GMLTrack database…</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <div className="bg-white border border-rose-200 rounded-xl p-6 max-w-md text-center">
          <CircleAlert className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="font-semibold text-stone-900 mb-2">Database connection failed</h2>
          <p className="text-sm text-stone-600">{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-stone-900 text-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-stone-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-stone-900" />
            </div>
            <div>
              <p className="font-semibold text-base sm:text-lg" style={displayFont}>
                GMLTrack
              </p>
              <p className="text-xs text-stone-400 hidden sm:block">Medical device accountability</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {live ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-stone-400 hidden sm:inline">Live · all nurses see the same data</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 pulse" />
                <span className="text-xs text-stone-400 hidden sm:inline">Connecting…</span>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  tab === id ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {saveError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2 text-sm text-rose-900">
            <CircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="flex-1">{saveError}</p>
            <button onClick={() => setSaveError(null)} aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {tab === 'dashboard' && (
          <Dashboard
            departments={departments}
            devices={devices}
            nurses={nurses}
            handovers={handovers}
            incidents={incidents}
            onJump={setTab}
          />
        )}
        {tab === 'wards' && (
          <Wards departments={departments} setDepartments={setDepartments} devices={devices} nurses={nurses} />
        )}
        {tab === 'devices' && <Devices devices={devices} setDevices={setDevices} departments={departments} />}
        {tab === 'nurses' && <Nurses nurses={nurses} setNurses={setNurses} departments={departments} />}
        {tab === 'handover' && (
          <Handovers
            devices={devices}
            nurses={nurses}
            handovers={handovers}
            setHandovers={setHandovers}
            departments={departments}
          />
        )}
        {tab === 'incidents' && (
          <Incidents
            incidents={incidents}
            setIncidents={setIncidents}
            devices={devices}
            nurses={nurses}
            departments={departments}
          />
        )}
        {tab === 'audit' && (
          <Audit devices={devices} nurses={nurses} handovers={handovers} incidents={incidents} departments={departments} />
        )}
      </main>

      <footer className="border-t border-stone-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-xs text-stone-500 text-center">
          GMLTrack · Records are locked once submitted · Shared live database
        </div>
      </footer>
    </div>
  )
}
