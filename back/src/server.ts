import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`[后端启动] NailPilot API 已启动：http://localhost:${env.PORT}`);
});
