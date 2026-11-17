// Hook que busca dados da API ao abrir a tela (e sempre que o caminho mudar).
// Devolve os 3 estados de uma tela que consome API: dados, erro e carregando.
import { useEffect, useState } from 'react'
import { api } from './api'

export function useApi(caminho) {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [versao, setVersao] = useState(0)   // mudar a versão força buscar de novo

  useEffect(() => {
    let ativo = true   // evita atualizar o estado se a tela já foi fechada
    setCarregando(true)
    setErro(null)
    api(caminho)
      .then((resposta) => ativo && setDados(resposta))
      .catch((e) => {
        if (!ativo) return
        setErro(e.message)
        setDados(null)   // com erro, não mostra dados antigos
      })
      .finally(() => ativo && setCarregando(false))
    return () => { ativo = false }
  }, [caminho, versao])

  return { dados, erro, carregando, recarregar: () => setVersao((v) => v + 1) }
}
