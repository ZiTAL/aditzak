import Fastify from 'fastify';
import { openRepository } from './database.js';
export function createApp(databasePath?:string) {
  const app=Fastify({logger:false,bodyLimit:4096});
  const repository=openRepository(databasePath);
  app.addHook('onClose',async()=>repository.close());
  app.get('/health',async()=>({status:'ok',database:repository.coverage.version}));
  app.get('/api/v1/meta',async()=>repository.coverage);
  app.get('/api/v1/sources',async()=>repository.sources);
  app.get<{Params:{id:string}}>('/api/v1/sources/:id',async(request,reply)=>{
    const result=repository.sources.find(s=>s.id===request.params.id);return result??reply.code(404).send({error:'not_found'});
  });
  app.get<{Params:{id:string}}>('/api/v1/forms/:id',async(request,reply)=>{
    const result=repository.getById(request.params.id);return result??reply.code(404).send({error:'not_found'});
  });
  app.get<{Querystring:{form:string;variety?:string}}>('/api/v1/analyze',{
    schema:{querystring:{type:'object',required:['form'],additionalProperties:false,properties:{form:{type:'string',minLength:1,maxLength:160},variety:{type:'string',maxLength:32}}}},
  },async(request,reply)=>{
    try {return repository.analyze(request.query.form,request.query.variety);}
    catch(error){if(error instanceof Error&&['invalid_form','unknown_variety'].includes(error.message))return reply.code(400).send({error:error.message});throw error;}
  });
  app.setErrorHandler((error,request,reply)=>{
    if(error && typeof error==='object' && 'validation' in error) return reply.code(400).send({error:'invalid_form'});
    request.log.error(error);return reply.code(500).send({error:'server_error'});
  });
  return app;
}
