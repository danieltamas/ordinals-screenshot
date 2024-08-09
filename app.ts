import express, { Express, Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import cors from 'cors'
import routes from './routes'

dotenv.config()

const app: Express = express()

// Parse incoming requests data
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Enable CORS
app.use(
  cors({
    origin: process.env.ORDINALS_ALLOWED_ORIGINS?.split(',').map(o => o.trim()),
    methods: ['GET']
  })
)
// Register routes
app.use('/', routes);

app.use(<ErrorRequestHandler>(err: any, req: Request, res: Response, next: NextFunction):void => {
  process.env.PRINT_ERRORS && console.error(`[ ERROR ]`, err.code, err.message)
  res.header('Content-Type', 'application/json');
  res.status(err.code).json({
      error: true,
      status: err.code,
      message: err.message,
  });
})

// Initialize the server
app.listen(process.env.ORDINALS_PORT, async () => {
  console.log(`Screenshot Server running at http://localhost:${process.env.ORDINALS_PORT}`)
})

// Gracefully shutdown the server
process.on('SIGTERM', async () => {
  process.exit(0)
})
