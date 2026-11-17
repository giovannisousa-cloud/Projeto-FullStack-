import { useState } from 'react'
import { useApi } from '../services/useApi'
import Cabecalho from './Cabecalho'
import Campo from './Campo'
import Grafico from './Grafico'
import Situacao from './Situacao'
import { dinheiro, dataBR, mesAtual, nomeTipoFonte, porcento } from './formato'

// Variação em relação ao período anterior, ex.: "▲ 12,7%"
function variacao(atual, anterior) {
  if (!anterior) return <span className="text-body-secondary">novo</span>
  const pct = ((atual - anterior) / anterior) * 100
  if (Math.abs(pct) < 0.05) return <span className="text-body-secondary">igual</span>
  return pct > 0
    ? <span className="text-danger">▲ {porcento(pct)}</span>
    : <span className="text-success">▼ {porcento(Math.abs(pct))}</span>
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState(mesAtual())
  const consulta = `inicio=${periodo.inicio}&fim=${periodo.fim}`
  const categorias = useApi(`/relatorios/categorias?${consulta}`)
  const fontes = useApi(`/relatorios/fontes-destinos?${consulta}`)

  const mudar = (campo) => (e) => setPeriodo({ ...periodo, [campo]: e.target.value })
  // Enquanto carrega, não mostra os dados antigos (null = nada para mostrar).
  const rel = categorias.carregando ? null : categorias.dados      // relatório por categoria (RF7)
  const porFonte = fontes.carregando ? null : fontes.dados         // relatório por fonte/destino (RF8)

  return (
    <>
      <Cabecalho titulo="Relatórios" subtitulo="Para onde vai e de onde vem o seu dinheiro." />

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <Campo label="De" className="col-6 col-md-3">
              <input type="date" className="form-control" value={periodo.inicio} onChange={mudar('inicio')} />
            </Campo>
            <Campo label="Até" className="col-6 col-md-3">
              <input type="date" className="form-control" value={periodo.fim} onChange={mudar('fim')} />
            </Campo>
          </div>
        </div>
      </div>

      {/* RF7 — saídas por categoria, comparando com o período anterior */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-body py-3">
          <h2 className="h6 mb-0">Saídas por categoria</h2>
          {rel && (
            <div className="small text-body-secondary">
              Comparado com {dataBR(rel.periodoAnterior.inicio)} a {dataBR(rel.periodoAnterior.fim)}
            </div>
          )}
        </div>
        <div className="card-body">
          <Situacao carregando={categorias.carregando} erro={categorias.erro} vazio={rel?.saidas.categorias.length === 0} />
          {rel && rel.saidas.categorias.length > 0 && (
            <div className="row g-4 align-items-center">
              <div className="col-lg-6">
                <Grafico dados={rel.saidas.categorias}
                  series={[{ campo: 'total', nome: 'Período atual' }, { campo: 'periodoAnterior', nome: 'Período anterior' }]} />
              </div>
              <div className="col-lg-6 table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>Categoria</th><th className="text-end">Total</th><th className="text-end">%</th><th className="text-end">Anterior</th><th className="text-end">Variação</th></tr>
                  </thead>
                  <tbody>
                    {rel.saidas.categorias.map((c) => (
                      <tr key={c.id}>
                        <td>{c.nome}</td>
                        <td className="text-end">{dinheiro(c.total)}</td>
                        <td className="text-end">{porcento(c.percentual)}</td>
                        <td className="text-end">{dinheiro(c.periodoAnterior)}</td>
                        <td className="text-end text-nowrap">{variacao(c.total, c.periodoAnterior)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="fw-bold"><td>Total</td><td className="text-end">{dinheiro(rel.saidas.total)}</td><td colSpan="3"></td></tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RF7 — entradas por categoria */}
      {rel && rel.entradas.categorias.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-body py-3"><h2 className="h6 mb-0">Entradas por categoria</h2></div>
          <div className="card-body table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light"><tr><th>Categoria</th><th className="text-end">Total</th><th className="text-end">%</th></tr></thead>
              <tbody>
                {rel.entradas.categorias.map((c) => (
                  <tr key={c.id}><td>{c.nome}</td><td className="text-end">{dinheiro(c.total)}</td><td className="text-end">{porcento(c.percentual)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RF8 — por fonte/destino */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-body py-3"><h2 className="h6 mb-0">Por fonte/destino</h2></div>
        <div className="card-body">
          <Situacao carregando={fontes.carregando} erro={fontes.erro} vazio={porFonte?.fontesDestinos.length === 0} />
          {porFonte && porFonte.fontesDestinos.length > 0 && (
            <div className="row g-4 align-items-center">
              <div className="col-lg-6">
                <Grafico dados={porFonte.fontesDestinos}
                  series={[{ campo: 'entradas', nome: 'Entradas' }, { campo: 'saidas', nome: 'Saídas' }]} />
              </div>
              <div className="col-lg-6 table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>Nome</th><th>Tipo</th><th className="text-end">Entradas</th><th className="text-end">Saídas</th><th className="text-end">Saldo</th></tr>
                  </thead>
                  <tbody>
                    {porFonte.fontesDestinos.map((f) => (
                      <tr key={f.id}>
                        <td>{f.nome}</td>
                        <td><span className="badge bg-secondary-subtle text-secondary-emphasis">{nomeTipoFonte[f.tipo]}</span></td>
                        <td className="text-end">{dinheiro(f.entradas)}</td>
                        <td className="text-end">{dinheiro(f.saidas)}</td>
                        <td className="text-end">{f.saldo === null ? '—' : dinheiro(f.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
