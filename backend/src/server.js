import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import categoriasRoutes from './routes/categorias.routes.js'
import fontesDestinosRoutes from './routes/fontesDestinos.routes.js'
import lancamentosRoutes from './routes/lancamentos.routes.js'
import relatoriosRoutes from './routes/relatorios.routes.js'
import { tratarErros } from './middlewares/erros.js'

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL }))   // só o front-end pode chamar a API
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/categorias', categoriasRoutes)
app.use('/api/fontes-destinos', fontesDestinosRoutes)
app.use('/api/lancamentos', lancamentosRoutes)
app.use('/api/relatorios', relatoriosRoutes)

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }))
app.use(tratarErros)   // sempre por último

const porta = process.env.PORT || 3000
app.listen(porta, () => console.log(`API rodando na porta ${porta}`))
