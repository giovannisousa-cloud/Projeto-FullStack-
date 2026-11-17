// Mostra "carregando", erro ou "nada encontrado". Se estiver tudo certo, não mostra nada.
export default function Situacao({ carregando, erro, vazio }) {
  if (carregando) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
  if (erro) return <div className="alert alert-danger">{erro}</div>
  if (vazio) return <p className="text-center text-body-secondary py-5 mb-0">Nenhum registro encontrado.</p>
  return null
}
