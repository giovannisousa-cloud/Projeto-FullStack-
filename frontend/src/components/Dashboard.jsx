import { Link } from 'react-router-dom'
import { useApi } from '../services/useApi'
import { useAuth } from '../contexts/AuthContext'
import Cabecalho from './Cabecalho'
import Totais from './Totais'
import Situacao from './Situacao'
import { dinheiro, dataBR } from './formato'

// Resumo do mês atual: totais + últimos lançamentos.
export default function Dashboard() {
  const { user } = useAuth()
  const { dados, erro, carregando } = useApi('/lancamentos')   // sem filtros = mês atual
  const primeiroNome = user?.nome.split(' ')[0]

  return (
    <>
      <Cabecalho titulo={`Olá, ${primeiroNome}!`} subtitulo="Este é o resumo do seu mês." />
      <Situacao carregando={carregando} erro={erro} />
      {dados && !carregando && (
        <>
          <Totais totais={dados.totais} />
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-body py-3 d-flex justify-content-between align-items-center">
              <h2 className="h6 mb-0">Últimos lançamentos</h2>
              <Link to="/lancamentos" className="btn btn-sm btn-outline-primary">Ver todos</Link>
            </div>
            <Situacao vazio={dados.itens.length === 0} />
            <ul className="list-group list-group-flush">
              {dados.itens.slice(0, 5).map((l) => (
                <li key={l.id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                  <div>
                    <div className="fw-semibold">{l.descricao}</div>
                    <div className="small text-body-secondary">{dataBR(l.data)} · {l.categoria}</div>
                  </div>
                  <span className={`fw-semibold text-nowrap ${l.tipo === 'entrada' ? 'text-success' : 'text-danger'}`}>
                    {l.tipo === 'entrada' ? '+' : '-'} {dinheiro(l.valor)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  )
}
