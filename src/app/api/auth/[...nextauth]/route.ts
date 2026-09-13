import { handlers } from '@/lib/auth';

// Auth.js expone aqui todos sus endpoints: callbacks de OAuth, inicio y
// cierre de sesion. La ruta debe llamarse exactamente asi.
export const { GET, POST } = handlers;
