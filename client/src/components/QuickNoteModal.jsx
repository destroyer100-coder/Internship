import { useState, useEffect } from 'react'
import { X, Check, Clock, Calendar } from 'lucide-react'

const COLOR_OPTIONS = [
  { id: 'yellow', name: 'Warm Amber', bg: 'bg-[#FAF2E6] dark:bg-[#251D14]', border: 'border-[#EADCC8] dark:border-[#543E19]', quote: 'text-[#B78332]', tagText: 'text-[#B78332]' },
  { id: 'green',  name: 'Sage Green', bg: 'bg-[#EBF3EF] dark:bg-[#13241C]', border: 'border-[#C8DDD2] dark:border-[#1E4D30]', quote: 'text-[#4F8068]', tagText: 'text-[#4F8068]' },
  { id: 'blue',   name: 'Slate Info',  bg: 'bg-[#EEF3F8] dark:bg-[#121E2C]', border: 'border-[#CAD8E6] dark:border-[#1A3A54]', quote: 'text-[#61758A]', tagText: 'text-[#61758A]' },
  { id: 'purple', name: 'Muted Plum', bg: 'bg-[#F3EDF4] dark:bg-[#231A26]', border: 'border-[#D9CDDC] dark:border-[#4B3450]', quote: 'text-[#765C78]', tagText: 'text-[#765C78]' },
  { id: 'peach',  name: 'Muted Coral', bg: 'bg-[#F8EBEA] dark:bg-[#2A1918]', border: 'border-[#E8D0CE] dark:border-[#5E2B27]', quote: 'text-[#B65D52]', tagText: 'text-[#B65D52]' },
]

const TIME_PRESETS = [
  'Today, 09:00 AM',
  'Today, 02:00 PM',
  'Today, 04:00 PM',
  'Today, 07:00 PM',
  'Tomorrow, 10:00 AM',
  'Tomorrow, 06:00 PM'
]

export default function QuickNoteModal({ isOpen, onClose, onSave, editingNote }) {
  const [text, setText] = useState('')
  const [timeLabel, setTimeLabel] = useState('Today, 04:00 PM')
  const [color, setColor] = useState('yellow')

  useEffect(() => {
    if (editingNote) {
      setText(editingNote.text || '')
      setTimeLabel(editingNote.timeLabel || 'Today, 04:00 PM')
      setColor(editingNote.color || 'yellow')
    } else {
      setText('')
      setTimeLabel('Today, 04:00 PM')
      setColor('yellow')
    }
  }, [editingNote, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSave({
      id: editingNote?.id || Date.now().toString(),
      text: text.trim(),
      timeLabel: timeLabel.trim() || 'Today, 04:00 PM',
      color,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#101C2B]/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-[#101C2B] rounded-[24px] border border-[#DEDCD5] dark:border-[#1E2D40] shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
          <h3 className="text-xl font-bold font-serif text-[#17202A] dark:text-white">
            {editingNote ? 'Edit Quick Note' : 'Add Quick Note'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#89919A] hover:text-[#17202A] hover:bg-[#F1EFE9] dark:hover:bg-[#1E2D40] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Note content */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6872] dark:text-[#89919A] uppercase tracking-wider mb-2">
              Note Text
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Call Rahul at 4 PM or Bring documents for meeting..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-sm text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A] resize-none"
            />
          </div>

          {/* Time / Date label with direct text input + quick presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#5F6872] dark:text-[#89919A] uppercase tracking-wider">
                Time & Date Label
              </label>
              <span className="text-[10px] text-[#89919A]">Click preset or type custom</span>
            </div>

            <div className="relative mb-2">
              <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6872]" />
              <input
                type="text"
                placeholder="e.g. Today, 04:00 PM or 28 Aug, 10:30 AM"
                value={timeLabel}
                onChange={(e) => setTimeLabel(e.target.value)}
                className="input-field pl-9 text-xs font-bold"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {TIME_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setTimeLabel(p)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    timeLabel === p
                      ? 'bg-[#145A4A] text-white border-[#0F4639] font-bold shadow-sm'
                      : 'bg-[#F7F5F0] dark:bg-[#172638] border-[#DEDCD5] dark:border-[#1E2D40] text-[#5F6872] hover:text-[#17202A]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Color theme picker */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6872] dark:text-[#89919A] uppercase tracking-wider mb-2">
              Sticky Note Color
            </label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-transform ${c.bg} ${c.border} ${color === c.id ? 'scale-110 ring-2 ring-[#145A4A]' : 'opacity-80 hover:opacity-100'}`}
                >
                  {color === c.id && <Check size={14} className={c.quote} />}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#5F6872] hover:text-[#17202A] dark:text-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2 text-sm"
            >
              {editingNote ? 'Save Changes' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
