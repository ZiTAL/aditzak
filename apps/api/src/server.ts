import { createApp } from './app.ts';
const app=createApp();
await app.listen({host:process.env.HOST??'127.0.0.1',port:Number(process.env.PORT??3000)});
console.log(`Aditzak API: ${app.server.address() && JSON.stringify(app.server.address())}`);
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{void app.close().then(()=>process.exit(0));});
