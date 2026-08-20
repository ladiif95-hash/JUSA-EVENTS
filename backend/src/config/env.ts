import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
// Keep developer-specific settings out of source control while allowing them
// to override shared defaults such as an Atlas connection string.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env.local'), override: true });
