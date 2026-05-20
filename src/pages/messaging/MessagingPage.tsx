import { MessageCircle } from 'lucide-react'

export default function MessagingPage() {
  const convos = [
    { id: '1', name: 'Youssef Benali', preview: 'Great seeing you at the jazz night! 🎵', time: '2m', unread: true, color: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', initials: 'YB' },
    { id: '2', name: 'Karim Senhaji', preview: 'Are you joining the morning run this Sunday?', time: '1h', unread: true, color: 'linear-gradient(135deg,#fd79a8,#e17055)', initials: 'KS' },
    { id: '3', name: 'Sara Hilali', preview: 'I found a great trail near Ain Diab!', time: '3h', unread: false, color: 'linear-gradient(135deg,#00cec9,#55efc4)', initials: 'SH' },
  ]

  const groups = [
    { id: '4', name: 'Jazz Night at Medina', preview: 'Sara: Can\'t wait for tonight! ✨', time: '30m', emoji: '🎵', color: 'linear-gradient(135deg,#6c5ce7,#00cec9)' },
    { id: '5', name: 'Morning Run Club', preview: 'Mehdi: Meet at the lighthouse entrance!', time: '3h', emoji: '🏃', color: 'linear-gradient(135deg,#00cec9,#55efc4)' },
    { id: '6', name: 'Frontend Dev Meetup', preview: 'Rania: Slides are shared in the group', time: 'Yesterday', emoji: '💻', color: 'linear-gradient(135deg,#fdcb6e,#e17055)' },
  ]

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)' }}>
      <div style={{ padding: '20px 20px 8px' }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--z-text)', letterSpacing: '-0.5px', marginBottom: 4 }}>Messages</h1>
        <p style={{ fontSize: 13, color: 'var(--z-muted)' }}>{convos.filter(c => c.unread).length} unread conversations</p>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', borderRadius: 10, padding: '9px 12px' }}>
          <MessageCircle size={15} style={{ color: 'var(--z-muted)', flexShrink: 0 }} />
          <input placeholder="Search messages…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--z-text)', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Direct messages */}
      <div style={{ padding: '4px 0 8px' }}>
        <div style={{ padding: '0 20px', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--z-muted)' }}>Direct</span>
        </div>
        {convos.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', fontFamily: '"Sora",sans-serif', flexShrink: 0 }}>
              {c.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: c.unread ? 600 : 400, color: 'var(--z-text)' }}>{c.name}</span>
                <span style={{ fontSize: 11, color: 'var(--z-muted)' }}>{c.time}</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--z-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{c.preview}</span>
            </div>
            {c.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--z-accent2)', flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--z-border)', margin: '4px 0' }} />

      {/* Group chats */}
      <div style={{ padding: '12px 0 8px' }}>
        <div style={{ padding: '0 20px', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--z-muted)' }}>Event Groups</span>
        </div>
        {groups.map((g) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {g.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--z-text)' }}>{g.name}</span>
                <span style={{ fontSize: 11, color: 'var(--z-muted)' }}>{g.time}</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--z-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{g.preview}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
