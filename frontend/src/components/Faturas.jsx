import { useApi } from '../services/useApi'
import Cabecalho from './Cabecalho'
import Situacao from './Situacao'
import { dinheiro, dataBR } from './formato'

// RF9: para cada cartão, a fatura aberta + as próximas 3, com as parcelas futuras.
export default function Faturas() {
  const { dados, erro, carregando } = useApi('/relatorios/faturas?meses=3')

  return (
    <>
      <Cabecalho titulo="Faturas" subtitulo="Fatura aberta de cada cartão e a previsão das próximas." />
      <Situacao carregando={carregando} erro={erro} vazio={dados?.length === 0} />

      {!carregando && dados?.map((cartao) => {
        const usado = Math.min(100, (cartao.limiteUtilizado / cartao.limite) * 100)   // % do limite usado
        return (
          <div className="card border-0 shadow-sm mb-4" key={cartao.id}>
            <div className="card-header bg-body py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h2 className="h5 mb-0">{cartao.nome}</h2>
              <span className="small text-body-secondary">Limite de {dinheiro(cartao.limite)}</span>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between small mb-1">
                <span>Utilizado: <strong>{dinheiro(cartao.limiteUtilizado)}</strong></span>
                <span>Disponível: <strong>{dinheiro(cartao.limiteDisponivel)}</strong></span>
              </div>
              <div className="progress mb-4" role="progressbar" aria-label="Limite utilizado">
                <div className={`progress-bar ${usado > 80 ? 'bg-danger' : ''}`} style={{ width: `${usado}%` }} />
              </div>

              <div className="row g-3">
                {cartao.faturas.map((f, i) => (
                  <div className="col-md-6 col-xl-3" key={f.referencia}>
                    <div className={`border rounded-3 p-3 h-100 ${i === 0 ? 'border-primary' : ''}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">Fatura {f.referencia.split('-').reverse().join('/')}</span>
                        {i === 0 && <span className="badge text-bg-primary">Aberta</span>}
                      </div>
                      <div className="small text-body-secondary">Fecha em {dataBR(f.fechamento)}</div>
                      <div className="small text-body-secondary">Vence em {dataBR(f.vencimento)}</div>
                      <div className="fs-4 fw-bold my-2">{dinheiro(f.total)}</div>
                      <ul className="list-unstyled small mb-0">
                        {f.lancamentos.map((l) => (
                          <li key={l.id} className="d-flex justify-content-between gap-2 border-top py-1">
                            <span>{l.descricao}{l.total_parcelas > 1 && ` — ${l.parcela_atual}/${l.total_parcelas}`}</span>
                            <span className="text-nowrap">{dinheiro(l.valor)}</span>
                          </li>
                        ))}
                        {f.lancamentos.length === 0 && <li className="text-body-secondary border-top py-1">Sem lançamentos</li>}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
