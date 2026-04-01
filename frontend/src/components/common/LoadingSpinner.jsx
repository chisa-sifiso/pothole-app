export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '64px 24px' }}>
      <div style={{ position: 'relative', width: 38, height: 38 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid rgba(59,130,246,0.12)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#3b82f6',
          borderRightColor: 'rgba(139,92,246,0.5)',
          animation: 'scr-spin 0.75s linear infinite',
          boxShadow: '0 0 10px rgba(59,130,246,0.35)',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 8, height: 8, borderRadius: '50%',
          background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
          opacity: 0.8,
        }} />
      </div>
      <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{text}</span>
      <style>{`@keyframes scr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
