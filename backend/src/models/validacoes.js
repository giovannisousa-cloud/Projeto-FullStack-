// Funções puras de validação (não mexem no banco).

// Confere os 2 dígitos verificadores do CPF.
export function cpfValido(cpf) {
  const d = String(cpf).replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const digito = (tamanho) => {
    let soma = 0
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10])
}

export const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Mínimo 8 caracteres, com letras e números.
export const senhaValida = (senha) => senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha)
