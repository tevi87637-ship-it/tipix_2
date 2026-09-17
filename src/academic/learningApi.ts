import {supabase} from '../lib/supabase';
export async function learning<T>(op:string,payload:Record<string,unknown>={}):Promise<T>{const{data,error}=await supabase.rpc('learning_api',{op,payload});if(error)throw new Error(error.message);return data as T;}
export type LearningState={concept_id:string;section:string|null;task_id:string|null;completed:string[];answers:Record<string,{selected:number;correct:boolean;answer:number;explanation:string}>;question_id:string|null;draft:unknown;filters:Record<string,string>;updated_at:string};
export type LearningTask={id:string;position:number;title:string;blocks:{type:string;text:string}[];check_prompt:string|null;check_options:string[]};
export type LessonResponse={tasks:LearningTask[];state:LearningState|null};
