import { useState } from 'react'
import { api } from '../services/api'
import { useApi } from '../services/useApi'
import Cabecalho from './Cabecalho'
import Campo from './Campo'
import Situacao from './Situacao'
import { dinheiro, nomeTipoFonte } from './formato'

const VAZIO = { id: null, nome: '', tipo: 'conta', diaFechamento: '', diaVencimento: '', limite: '' }

export default function FontesDestinos() {
  const { dados, erro, carregando, recarregar } = useApi('/fontes-destinos')
  const [form, setForm] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState(null)

  const ehCartao = form.tipo === 'cartao_credito'
  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  // Ao clicar em "Editar", copia os dados da linha para o formulário (que fica no topo).
  function editar(f) {
    setForm({
      id: f.id, nome: f.nome, tipo: f.tipo,
      diaFechamento: f.dia_fechamento ?? '', diaVencimento: f.dia_vencimento ?? '', limite: f.limite ?? ''
    })
    setErros({})
    window.scrollTo(0, 0)
  }

  async function salvar(e) {
    e.preventDefault()
    setMensagem(null)
    const encontrados = {}
    if (!form.nome.trim()) encontrados.nome = 'Informe o nome.'
    if (ehCartao) {
      if (!(form.diaFechamento >= 1 && form.diaFechamento <= 31)) encontrados.diaFechamento = 'Dia entre 1 e 31.'
      if (!(form.diaVencimento >= 1 && form.diaVencimento <= 31)) encontrados.diaVencimento = 'Dia entre 1 e 31.'
      if (!(Number(form.limite) > 0)) encontrados.limite = 'Informe o limite.'
    }
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    const corpo = { ...form, diaFechamento: Number(form.diaFechamento), diaVencimento: Number(form.diaVencimento), limite: Number(form.limite) }
    try {
      if (form.id) await api(`/fontes-destinos/${form.id}`, { method: 'PUT', body: corpo })
      else await api('/fontes-destinos', { method: 'POST', body: corpo })
      setForm(VAZIO)
      recarregar()
    } catch (falha) {
      setErros(falha.campos)
      setMensagem(falha.message)
    }
  }

  async function excluir(f) {
    if (!window.confirm(`Excluir "${f.nome}"?`)) return
    try {
      await api(`/fontes-destinos/${f.id}`, { method: 'DELETE' })
      recarregar()
    } catch (falha) {
      setMensagem(falha.message)
      window.scrollTo(0, 0)
    }
  }

  return (
    <>
      <Cabecalho titulo="Fontes e destinos" subtitulo="De onde o dinheiro vem e para onde vai: rendas, contas e cartões." />

      <form className="card border-0 shadow-sm mb-4" onSubmit={salvar} noValidate>
        <div className="card-header bg-body py-3 fw-semibold">{form.id ? 'Editar fonte/destino' : 'Nova fonte/destino'}</div>
        <div className="card-body">
          {mensagem && <div className="alert alert-danger">{mensagem}</div>}
          <div className="row g-3 align-items-end">
            <Campo label="Nome" erro={erros.nome} className="col-md-4">
              <input className="form-control" value={form.nome} onChange={mudar('nome')} />
            </Campo>
            <Campo label="Tipo" className="col-md-3">
              <select className="form-select" value={form.tipo} disabled={Boolean(form.id)} onChange={mudar('tipo')}>
                <option value="conta">Conta</option>
                <option value="renda">Renda</option>
                <option value="cartao_credito">Cartão de crédito</option>
              </select>
            </Campo>
            {/* Campos que só existem para cartão de crédito */}
            {ehCartao && (
              <>
                <Campo label="Dia do fechamento" erro={erros.diaFechamento} className="col-6 col-md-2">
                  <input type="number" min="1" max="31" className="form-control" value={form.diaFechamento} onChange={mudar('diaFechamento')} />
                </Campo>
                <Campo label="Dia do vencimento" erro={erros.diaVencimento} className="col-6 col-md-2">
                  <input type="number" min="1" max="31" className="form-control" value={form.diaVencimento} onChange={mudar('diaVencimento')} />
                </Campo>
                <Campo label="Limite" erro={erros.limite} className="col-md-3">
                  <div className="input-group">
                    <span className="input-group-text">R$</span>
                    <input type="number" min="0" step="0.01" className="form-control" value={form.limite} onChange={mudar('limite')} />
                  </div>
                </Campo>
              </>
            )}
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
              <thead className="table-light">
                <tr><th>Nome</th><th>Tipo</th><th>Fechamento</th><th>Vencimento</th><th className="text-end">Limite</th><th></th></tr>
              </thead>
              <tbody>
                {dados.map((f) => (
                  <tr key={f.id}>
                    <td className="fw-semibold">{f.nome}</td>
                    <td><span className="badge bg-secondary-subtle text-secondary-emphasis">{nomeTipoFonte[f.tipo]}</span></td>
                    <td>{f.dia_fechamento ? `Dia ${f.dia_fechamento}` : '—'}</td>
                    <td>{f.dia_vencimento ? `Dia ${f.dia_vencimento}` : '—'}</td>
                    <td className="text-end">{f.limite ? dinheiro(f.limite) : '—'}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => editar(f)}>Editar</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => excluir(f)}>Excluir</button>
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
