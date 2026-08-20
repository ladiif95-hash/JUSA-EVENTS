import './config/env';
import { app } from './app';
import { connectDatabase } from './config/database';

const port = Number(process.env.PORT ?? 5000);
connectDatabase().then(() => app.listen(port, () => console.log(`JUSA API listening on port ${port}`))).catch((error) => { console.error('Database connection failed', error); process.exit(1); });
