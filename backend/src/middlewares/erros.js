// Último middleware: transforma qualquer erro em uma resposta no formato padrão { erro: '...' }.
// O Express 5 encaminha para cá, sozinho, os erros das rotas async.
export function tratarErros(erro, req, res, next) {
  // Erros que o próprio banco (Postgres) detecta:
  // 23505 = valor repetido (UNIQUE) | 23503 = registro ainda é usado por outro (chave estrangeira)
  if (erro.code === '23505') return res.status(409).json({ erro: 'Já existe um cadastro com este nome.' })
  if (erro.code === '23503') return res.status(409).json({ erro: 'Não é possível excluir: existem lançamentos vinculados.' })
  // Dado em formato errado: id que não é número, texto longo demais, número grande demais, CHECK...
  if (['22P02', '22001', '22003', '22007', '22008', '23514'].includes(erro.code)) {
    return res.status(400).json({ erro: 'Dados inválidos.' })
  }
  if (erro.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' })

  console.error(erro)
  res.status(500).json({ erro: 'Erro interno do servidor.' })
}
