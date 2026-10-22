import { X } from 'lucide-react'
import { TONES, displayFont } from '../lib/constants'

export const Badge = ({ tone = 'neutral', children, className = '' }) => {
  const t = TONES[tone] || TONES.neutral
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${t.bg} ${t.text} ${t.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {children}
    </span>
  )
}

const BUTTON_VARIANTS = {
  primary: 'bg-stone-900 text-stone-50 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed',
  secondary: 'bg-white text-stone-900 border border-stone-300 hover:bg-stone-50',
  ghost: 'text-stone-700 hover:bg-stone-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed',
  success: 'bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-300 disabled:cursor-not-allowed',
}
const BUTTON_SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-base' }

export const Button = ({ variant = 'primary', size = 'md', children, className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
    {...props}
  >
    {children}
  </button>
)

export const Field = ({ label, children, hint, required, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
      {label}
      {required && <span className="text-rose-600 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-stone-500">{hint}</p>}
  </div>
)

const INPUT_CLASS =
  'w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900'

export const Input = (props) => <input {...props} className={`${INPUT_CLASS} ${props.className || ''}`} />

export const Textarea = (props) => <textarea {...props} className={`${INPUT_CLASS} ${props.className || ''}`} />

export const Select = ({ children, ...props }) => (
  <select {...props} className={`${INPUT_CLASS} ${props.className || ''}`}>
    {children}
  </select>
)

const MODAL_SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <div className={`bg-stone-50 rounded-2xl shadow-2xl w-full ${MODAL_SIZES[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-200" aria-label="Close">
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export const EmptyState = ({ icon: Icon, title, hint, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-stone-500" />
    </div>
    <h3 className="text-base font-semibold text-stone-900 mb-1">{title}</h3>
    <p className="text-sm text-stone-600 max-w-sm mb-5">{hint}</p>
    {action}
  </div>
)

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-stone-200 rounded-xl ${className}`}>{children}</div>
)

export const StatCard = ({ label, value, icon: Icon, tone = 'neutral' }) => {
  const t = TONES[tone]
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
          <p className="text-3xl font-semibold text-stone-900 mt-1.5" style={displayFont}>
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${t.bg} ${t.border} border flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${t.text}`} />
        </div>
      </div>
    </Card>
  )
}

export const WardSelect = ({ value, onChange, departments, label = 'Ward / Station', hint }) => (
  <Field label={label} hint={hint}>
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Unassigned</option>
      {departments.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
          {d.location && ` — ${d.location}`}
        </option>
      ))}
    </Select>
  </Field>
)

export const PageHeader = ({ eyebrow, title, subtitle, children }) => (
  <div className="flex items-end justify-between gap-4 flex-wrap">
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{eyebrow}</p>
      <h1 className="text-3xl font-semibold text-stone-900 mt-1" style={displayFont}>
        {title}
      </h1>
      {subtitle && <p className="text-sm text-stone-600 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
)
