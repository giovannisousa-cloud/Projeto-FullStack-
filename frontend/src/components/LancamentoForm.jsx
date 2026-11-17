import { useState } from 'react'
import { api } from '../services/api'
import Campo from './Campo'

const hoje = () => new Date().toISOString().slice(0, 10)

// Formulário de novo lançamento ou de edição (quando recebe "lancamento").
export default function LancamentoForm({ lancamento, categorias, fontes, onSalvo, onCancelar }) {
  const editando = Boolean(lancamento)
  const [dados, setDados] = useState({
    tipo: lancamento?.tipo ?? 'saida',
    descricao: lancamento?.descricao ?? '',
    valor: lancamento?.valor ?? '',
    data: lancamento?.data ?? hoje(),
    categoriaId: lancamento?.categoria_id ?? '',
    fonteDestinoId: lancamento?.fonte_destino_id ?? '',
    parcelas: 1
  })
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)

  const mudar = (campo) => (e) => setDados({ ...dados, [campo]: e.target.value })

  // Só aparecem as categorias do mesmo tipo do lançamento.
  const categoriasDoTipo = categorias.filter((c) => c.tipo === dados.tipo)
  const fonteEscolhida = fontes.find((f) => f.id === Number(dados.fonteDestinoId))
  const podeParcelar = !editando && dados.tipo === 'saida' && fonteEscolhida?.tipo === 'cartao_credito'

  async function salvar(e) {
    e.preventDefault()
    const encontrados = {}
    if (!dados.descricao.trim()) encontrados.descricao = 'Informe a descrição.'
    if (!(Number(dados.valor) > 0)) encontrados.valor = 'O valor deve ser maior que zero.'
    if (!dados.data) encontrados.data = 'Informe a data.'
    if (!dados.categoriaId) encontrados.categoriaId = 'Escolha uma categoria.'
    if (!dados.fonteDestinoId) encontrados.fonteDestinoId = 'Escolha uma fonte/destino.'
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    const corpo = { ...dados, valor: Number(dados.valor), parcelas: podeParcelar ? Number(dados.parcelas) : 1 }
    try {
      if (editando) await api(`/lancamentos/${lancamento.id}`, { method: 'PUT', body: corpo })
      else await api('/lancamentos', { method: 'POST', body: corpo })
      onSalvo()
    } catch (falha) {
      setErros(falha.campos)
      setErroGeral(falha.message)
    }
  }

  return (
    <form className="card border-0 shadow-sm mb-4" onSubmit={salvar} noValidate>
      <div className="card-header bg-body py-3 fw-semibold">{editando ? 'Editar lançamento' : 'Novo lançamento'}</div>
      <div className="card-body">
        {erroGeral && <div className="alert alert-danger">{erroGeral}</div>}
        <div className="row g-3">
          <Campo label="Tipo" className="col-md-2">
            <select className="form-select" value={dados.tipo}
              onChange={(e) => setDados({ ...dados, tipo: e.target.value, categoriaId: '' })}>
              <option value="saida">Saída</option>
              <option value="entrada">Entrada</option>
            </select>
          </Campo>
          <Campo label="Descrição" erro={erros.descricao} className="col-md-4">
            <input className="form-control" value={dados.descricao} onChange={mudar('descricao')} />
          </Campo>
          <Campo label="Valor" erro={erros.valor} className="col-md-3">
            <div className="input-group">
              <span className="input-group-text">R$</span>
              <input type="number" step="0.01" min="0" className="form-control" value={dados.valor} onChange={mudar('valor')} />
            </div>
          </Campo>
          <Campo label="Data" erro={erros.data} className="col-md-3">
            <input type="date" className="form-control" value={dados.data} onChange={mudar('data')} />
          </Campo>
          <Campo label="Categoria" erro={erros.categoriaId} className="col-md-4">
            <select className="form-select" value={dados.categoriaId} onChange={mudar('categoriaId')}>
              <option value="">Selecione...</option>
              {categoriasDoTipo.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Campo>
          <Campo label={dados.tipo === 'entrada' ? 'Fonte' : 'Destino'} erro={erros.fonteDestinoId} className="col-md-4">
            <select className="form-select" value={dados.fonteDestinoId} onChange={mudar('fonteDestinoId')}>
              <option value="">Selecione...</option>
              {fontes.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </Campo>
          {podeParcelar && (
            <Campo label="Parcelas" erro={erros.parcelas} className="col-md-2">
              <input type="number" min="1" max="48" className="form-control" value={dados.parcelas} onChange={mudar('parcelas')} />
            </Campo>
          )}
        </div>
      </div>
      <div className="card-footer bg-body text-end">
        <button type="button" className="btn btn-light me-2" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-success">Salvar</button>
      </div>
    </form>
  )
}
