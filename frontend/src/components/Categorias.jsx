import { useState } from 'react'
import { api } from '../services/api'
import { useApi } from '../services/useApi'
import Cabecalho from './Cabecalho'
import Campo from './Campo'
import Situacao from './Situacao'

const VAZIO = { id: null, nome: '', tipo: 'saida' }

export default function Categorias() {
  const { dados, erro, carregando, recarregar } = useApi('/categorias')
  const [form, setForm] = useState(VAZIO)        // form.id preenchido = editando
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState(null)

  function editar(categoria) {
    setForm(categoria)
    setErros({})
    window.scrollTo(0, 0)   // o formulário fica no topo da página
  }

  async function salvar(e) {
    e.preventDefault()
    setMensagem(null)
    if (!form.nome.trim()) return setErros({ nome: 'Informe o nome.' })
    try {
      if (form.id) await api(`/categorias/${form.id}`, { method: 'PUT', body: form })
      else await api('/categorias', { method: 'POST', body: form })
      setForm(VAZIO)
      setErros({})
      recarregar()
    } catch (falha) {
      setErros(falha.campos)
      setMensagem(falha.message)   // ex.: "Já existe um cadastro com este nome."
    }
  }

  async function excluir(categoria) {
    if (!window.confirm(`Excluir a categoria "${categoria.nome}"?`)) return
    try {
      await api(`/categorias/${categoria.id}`, { method: 'DELETE' })
      recarregar()
    } catch (falha) {
      setMensagem(falha.message)   // ex.: "Não é possível excluir: existem lançamentos vinculados."
      window.scrollTo(0, 0)
    }
  }

  return (
    <>
      <Cabecalho titulo="Categorias" subtitulo="Classificam os lançamentos: alimentação, moradia, salário..." />

      <form className="card border-0 shadow-sm mb-4" onSubmit={salvar} noValidate>
        <div className="card-header bg-body py-3 fw-semibold">{form.id ? 'Editar categoria' : 'Nova categoria'}</div>
        <div className="card-body">
          {mensagem && <div className="alert alert-danger">{mensagem}</div>}
          <div className="row g-3 align-items-end">
            <Campo label="Nome" erro={erros.nome} className="col-md-5">
              <input className="form-control" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Campo>
            <Campo label="Tipo" className="col-md-3">
              {/* O tipo não pode ser trocado na edição */}
              <select className="form-select" value={form.tipo} disabled={Boolean(form.id)}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="saida">Saída</option>
                <option value="entrada">Entrada</option>
              </select>
            </Campo>
            <div className="col-md-4">
              <button className="btn btn-success me-2">{form.id ? 'Salvar alteração' : 'Adicionar'}</button>
              {form.id && <button type="button" className="btn btn-light" onClick={() => setForm(VAZIO)}>Cancelar</button>}
            </div>
          </div>
        </div>
      </form>

      <Situacao carregando={carregando} erro={erro} vazio={dados?.length === 0} />
      {dados?.length > 0 && !carregando && (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr><th>Nome</th><th>Tipo</th><th></th></tr></thead>
              <tbody>
                {dados.map((c) => (
                  <tr key={c.id}>
                    <td className="fw-semibold">{c.nome}</td>
                    <td>
                      <span className={`badge ${c.tipo === 'entrada' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                        {c.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => editar(c)}>Editar</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => excluir(c)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
