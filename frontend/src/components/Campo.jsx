// Um campo de formulário: rótulo + o input (children) + mensagem de erro embaixo.
export default function Campo({ label, erro, children, className = 'mb-3' }) {
  return (
    <div className={className}>
      <label className="form-label small fw-semibold">{label}</label>
      {children}
      {erro && <div className="invalid-feedback d-block">{erro}</div>}
    </div>
  )
}
