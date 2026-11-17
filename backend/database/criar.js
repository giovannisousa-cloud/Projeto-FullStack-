// Cria as tabelas (schema.sql) e carrega dados de exemplo (seed).
// Uso: npm run banco      ATENÇÃO: apaga todos os dados existentes.
//
// Usuários criados (senha de ambos: senha1234):
//   ana@teste.com   (CPF 529.982.247-25)
//   bruno@teste.com (CPF 111.444.777-35)
import { readFileSync } from 'node:fs'
import bcrypt from 'bcrypt'
import { pool } from '../src/config/db.js'
import { Usuario } from '../src/models/Usuario.js'
import { Categoria } from '../src/models/Categoria.js'
import { FonteDestino } from '../src/models/FonteDestino.js'
import { Lancamento } from '../src/models/Lancamento.js'

// 'AAAA-MM-DD' de um dia do mês atual + "mesesAtras" meses.
function dia(mesesAtras, diaDoMes) {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - mesesAtras, diaDoMes)).toISOString().slice(0, 10)
}

async function criarUsuario(nome, email, cpf, salario) {
  const usuario = await Usuario.criar({ nome, email, cpf, senhaHash: await bcrypt.hash('senha1234', 10) })
  await Categoria.criarPadrao(usuario.id)
  await FonteDestino.criarPadrao(usuario.id)
  const cartao = await FonteDestino.criar(usuario.id, {
    nome: 'Cartão Nubank', tipo: 'cartao_credito', diaFechamento: 3, diaVencimento: 10, limite: 5000
  })

  const fontes = await FonteDestino.listar(usuario.id)
  const categorias = await Categoria.listar(usuario.id)
  const cat = (nome) => categorias.find((c) => c.nome === nome).id
  const fonte = (nome) => fontes.find((f) => f.nome === nome).id

  const novo = (tipo, descricao, valor, data, categoria, fonteDestino, parcelas = 1) =>
    Lancamento.criar(usuario.id, {
      tipo, descricao, valor, data, categoriaId: cat(categoria), fonteDestinoId: fonteDestino
    }, parcelas)

  // 3 meses de movimentação: há 2 meses, mês passado e mês atual.
  for (const m of [2, 1, 0]) {
    await novo('entrada', 'Salário', salario, dia(m, 5), 'Salário', fonte('Salário'))
    await novo('entrada', 'Freelance', 1800, dia(m, 10), 'Outras entradas', fonte('Conta corrente'))
    await novo('saida', 'Aluguel', 1500, dia(m, 6), 'Moradia', fonte('Conta corrente'))
    await novo('saida', 'Mercado', 650 + m * 40, dia(m, 8), 'Alimentação', cartao.id)
    await novo('saida', 'Combustível', 300 - m * 20, dia(m, 12), 'Mobilidade', cartao.id)
    await novo('saida', 'Farmácia', 90 + m * 15, dia(m, 15), 'Saúde', fonte('Conta corrente'))
    await novo('saida', 'Cinema', 80, dia(m, 20), 'Lazer', cartao.id)
  }
  // Compra parcelada: notebook em 10x no cartão, feita no mês passado.
  await novo('saida', 'Notebook', 4000, dia(1, 18), 'Educação', cartao.id, 10)
}

try {
  await pool.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))
  console.log('Tabelas criadas.')
  await criarUsuario('Ana Souza', 'ana@teste.com', '52998224725', 5800)
  await criarUsuario('Bruno Lima', 'bruno@teste.com', '11144477735', 4200)
  console.log('Dados de exemplo inseridos. Login: ana@teste.com / senha1234')
} catch (erro) {
  console.error('Erro:', erro.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
