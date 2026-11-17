// Validações do corpo das requisições, feitas no SERVIDOR.
// Com erro -> 400 no formato padrão: { erro: 'Dados inválidos.', campos: { campo: 'mensagem' } }
// Sem erro -> deixa os dados limpos em req.body e segue para a rota (next).
import { dataValida } from '../models/datas.js'
import { cpfValido, emailValido, senhaValida } from '../models/validacoes.js'

const texto = (v) => String(v ?? '').trim()
const inteiroEntre = (v, min, max) => Number.isInteger(Number(v)) && v >= min && v <= max
const temErro = (campos) => Object.keys(campos).length > 0
const erro400 = (res, campos) => res.status(400).json({ erro: 'Dados inválidos.', campos })

export function validarCadastro(req, res, next) {
  const { nome, email, cpf, senha } = req.body ?? {}
  const campos = {}
  if (!texto(nome)) campos.nome = 'Informe o nome.'
  if (!emailValido(texto(email))) campos.email = 'Informe um e-mail válido.'
  if (!cpfValido(texto(cpf))) campos.cpf = 'Informe um CPF válido.'
  if (!senhaValida(String(senha ?? ''))) campos.senha = 'A senha precisa de 8 caracteres, com letras e números.'
  if (temErro(campos)) return erro400(res, campos)

  // Normaliza para a unicidade funcionar de verdade:
  // "Ana@X.com" e "ana@x.com" são o mesmo e-mail; "529.982.247-25" e "52998224725" são o mesmo CPF.
  req.body = {
    nome: texto(nome),
    email: texto(email).toLowerCase(),
    cpf: texto(cpf).replace(/\D/g, ''),
    senha: String(senha)
  }
  next()
}

export function validarCategoria(req, res, next) {
  const { nome, tipo } = req.body ?? {}
  const campos = {}
  if (!texto(nome)) campos.nome = 'Informe o nome.'
  if (tipo !== 'entrada' && tipo !== 'saida') campos.tipo = 'Escolha entrada ou saída.'
  if (temErro(campos)) return erro400(res, campos)

  req.body = { nome: texto(nome), tipo }
  next()
}

export function validarFonteDestino(req, res, next) {
  const { nome, tipo, diaFechamento, diaVencimento, limite } = req.body ?? {}
  const cartao = tipo === 'cartao_credito'
  const campos = {}
  if (!texto(nome)) campos.nome = 'Informe o nome.'
  if (!['renda', 'conta', 'cartao_credito'].includes(tipo)) campos.tipo = 'Escolha renda, conta ou cartão de crédito.'
  if (cartao && !inteiroEntre(diaFechamento, 1, 31)) campos.diaFechamento = 'Informe um dia entre 1 e 31.'
  if (cartao && !inteiroEntre(diaVencimento, 1, 31)) campos.diaVencimento = 'Informe um dia entre 1 e 31.'
  if (cartao && !(Number(limite) > 0)) campos.limite = 'Informe um limite maior que zero.'
  if (temErro(campos)) return erro400(res, campos)

  // Só cartão de crédito tem fechamento, vencimento e limite.
  req.body = {
    nome: texto(nome),
    tipo,
    diaFechamento: cartao ? Number(diaFechamento) : null,
    diaVencimento: cartao ? Number(diaVencimento) : null,
    limite: cartao ? Number(limite) : null
  }
  next()
}

export function validarLancamento(req, res, next) {
  const { tipo, descricao, valor, data, categoriaId, fonteDestinoId, parcelas = 1 } = req.body ?? {}
  const campos = {}
  if (tipo !== 'entrada' && tipo !== 'saida') campos.tipo = 'Escolha entrada ou saída.'
  if (!texto(descricao)) campos.descricao = 'Informe a descrição.'
  if (!(Number(valor) > 0)) campos.valor = 'O valor deve ser maior que zero.'
  if (!dataValida(data)) campos.data = 'Informe uma data válida.'
  if (!inteiroEntre(categoriaId, 1, Infinity)) campos.categoriaId = 'Escolha uma categoria.'
  if (!inteiroEntre(fonteDestinoId, 1, Infinity)) campos.fonteDestinoId = 'Escolha uma fonte/destino.'
  if (!inteiroEntre(parcelas, 1, 48)) campos.parcelas = 'As parcelas devem ser de 1 a 48.'
  if (temErro(campos)) return erro400(res, campos)

  req.body = {
    tipo,
    descricao: texto(descricao),
    valor: Number(valor),
    data,
    categoriaId: Number(categoriaId),
    fonteDestinoId: Number(fonteDestinoId),
    parcelas: Number(parcelas)
  }
  next()
}
