import { useState } from 'react'
import { api } from '../services/api'
import { useApi } from '../services/useApi'
import Cabecalho from './Cabecalho'
import Campo from './Campo'
import LancamentoForm from './LancamentoForm'
import Totais from './Totais'
import Situacao from './Situacao'
import { dinheiro, dataBR, mesAtual } from './formato'

export default function Lancamentos() {
  const [filtros, setFiltros] = useState({ ...mesAtual(), tipo: '', categoriaId: '', fonteDestinoId: '' })
  const [pagina, setPagina] = useState(1)
  const [formulario, setFormulario] = useState(null)   // null = fechado; {} = novo; {lancamento} = editar

  // Todos os filtros vão na URL. Ex.: /lancamentos?inicio=2026-11-01&fim=2026-11-30&tipo=saida&...&pagina=1
  // Filtro vazio = "não filtrar" (o servidor ignora). Mudou um filtro -> o useApi busca de novo.
  const lista = useApi(`/lancamentos?${new URLSearchParams({ ...filtros, pagina })}`)
  const categorias = useApi('/categorias')
  const fontes = useApi('/fontes-destinos')

  const mudarFiltro = (campo) => (e) => {
    setFiltros({ ...filtros, [campo]: e.target.value })
    setPagina(1)
  }

  function editar(lancamento) {
    setFormulario({ lancamento })
    window.scrollTo(0, 0)   // o formulário fica no topo da página
  }

  async function excluir(l) {
    if (!window.confirm(`Excluir "${l.descricao}"?`)) return
    let todas = false
    if (l.total_parcelas > 1) {
      todas = window.confirm(`Esta compra tem ${l.total_parcelas} parcelas.\nOK = excluir TODAS as parcelas\nCancelar = excluir só esta`)
    }
    try {
      await api(`/lancamentos/${l.id}?todasParcelas=${todas}`, { method: 'DELETE' })
      lista.recarregar()
    } catch (falha) {
      alert(falha.message)
    }
  }

  function salvo() {
    setFormulario(null)
    lista.recarregar()
  }

  return (
    <>
      <Cabecalho titulo="Lançamentos" subtitulo="Entradas e saídas do período escolhido.">
        <button className="btn btn-primary" onClick={() => setFormulario({})}>+ Novo lançamento</button>
      </Cabecalho>
      <Situacao erro={categorias.erro || fontes.erro} />

      {formulario && categorias.dados && fontes.dados && (
        <LancamentoForm
          key={formulario.lancamento?.id ?? 'novo'}
          lancamento={formulario.lancamento}
          categorias={categorias.dados}
          fontes={fontes.dados}
          onSalvo={salvo}
          onCancelar={() => setFormulario(null)}
        />
      )}

      {/* Filtros */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <Campo label="De" className="col-6 col-md-2">
              <input type="date" className="form-control" value={filtros.inicio} onChange={mudarFiltro('inicio')} />
            </Campo>
            <Campo label="Até" className="col-6 col-md-2">
              <input type="date" className="form-control" value={filtros.fim} onChange={mudarFiltro('fim')} />
            </Campo>
            <Campo label="Tipo" className="col-md-2">
              <select className="form-select" value={filtros.tipo} onChange={mudarFiltro('tipo')}>
                <option value="">Todos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
            </Campo>
            <Campo label="Categoria" className="col-md-3">
              <select className="form-select" value={filtros.categoriaId} onChange={mudarFiltro('categoriaId')}>
                <option value="">Todas</option>
                {categorias.dados?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
            <Campo label="Fonte/destino" className="col-md-3">
              <select className="form-select" value={filtros.fonteDestinoId} onChange={mudarFiltro('fonteDestinoId')}>
                <option value="">Todas</option>
                {fontes.dados?.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </Campo>
          </div>
        </div>
      </div>

      <Situacao carregando={lista.carregando} erro={lista.erro} />

      {lista.dados && !lista.carregando && (
        <>
          <Totais totais={lista.dados.totais} />
          <div className="card border-0 shadow-sm">
            {lista.dados.itens.length === 0 ? <Situacao vazio /> : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Fonte/Destino</th><th className="text-end">Valor</th><th></th></tr>
                  </thead>
                  <tbody>
                    {lista.dados.itens.map((l) => (
                      <tr key={l.id}>
                        <td className="text-nowrap">{dataBR(l.data)}</td>
                        <td>
                          {l.descricao}
                          {l.total_parcelas > 1 && <span className="badge text-bg-light border ms-2">{l.parcela_atual}/{l.total_parcelas}</span>}
                        </td>
                        <td>{l.categoria}</td>
                        <td>{l.fonte_destino}</td>
                        <td className={`text-end text-nowrap fw-semibold ${l.tipo === 'entrada' ? 'text-success' : 'text-danger'}`}>
                          {l.tipo === 'entrada' ? '+' : '-'} {dinheiro(l.valor)}
                        </td>
                        <td className="text-end text-nowrap">
                          <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => editar(l)}>Editar</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => excluir(l)}>Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Paginação */}
            <div className="card-footer bg-body d-flex justify-content-between align-items-center">
              <span className="small text-body-secondary">Página {pagina} de {lista.dados.totalPaginas}</span>
              <div className="btn-group">
                <button className="btn btn-sm btn-outline-secondary" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
                <button className="btn btn-sm btn-outline-secondary" disabled={pagina >= lista.dados.totalPaginas} onClick={() => setPagina(pagina + 1)}>Próxima</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
