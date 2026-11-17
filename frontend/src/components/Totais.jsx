import { dinheiro } from './formato'

// Três cartões: entradas, saídas e saldo. A cor fica na faixa à esquerda de cada cartão.
export default function Totais({ totais }) {
  const cartoes = [
    { nome: 'Entradas', valor: totais.entradas, cor: 'success' },
    { nome: 'Saídas', valor: totais.saidas, cor: 'danger' },
    { nome: 'Saldo', valor: totais.saldo, cor: totais.saldo >= 0 ? 'primary' : 'danger' }
  ]
  return (
    <div className="row g-3 mb-4">
      {cartoes.map((c) => (
        <div className="col-md-4" key={c.nome}>
          <div className={`card border-0 border-start border-4 border-${c.cor} shadow-sm h-100`}>
            <div className="card-body">
              <div className="small text-uppercase fw-semibold text-body-secondary">{c.nome}</div>
              <div className="fs-3 fw-bold">{dinheiro(c.valor)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
