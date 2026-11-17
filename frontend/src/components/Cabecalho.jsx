// Título da página, com subtítulo e espaço para um botão à direita (children).
export default function Cabecalho({ titulo, subtitulo, children }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
      <div>
        <h1 className="h3 mb-1">{titulo}</h1>
        {subtitulo && <p className="text-body-secondary mb-0">{subtitulo}</p>}
      </div>
      {children}
    </div>
  )
}
