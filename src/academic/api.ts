import {supabase} from '../lib/supabase';
export async function academic<T>(op:string,payload:Record<string,unknown>={}):Promise<T>{
 const {data,error}=await supabase.rpc('academic_api',{op,payload});
 if(error) throw new Error(error.message);
 return data as T;
}
export type Concept={id:string;class_level:number;curriculum_id:string;position:number;subtopic?:string;chapter_title:string;concept_title:string;subject:string;academic_year:string;official_source:string;question_count:number;lesson:string|null;lesson_rights_reference:string|null};
export type Source={id:string;source_name:string;source_type:string;rights_status:string;active:boolean;base_url:string};
export type Question={id:string;difficulty:number;source_name?:string;concept_id:string;question_text:string;question_type:string;options:string[];marks:number;negative_marks:number;source_id:string;source_exam:string|null;source_year:number|null;source_session:string|null;source_shift:string|null;source_paper:string|null;source_question_number:string|null;source_page:string|null;source_url:string;rights_reference:string};
export type Attempt={id:string;question_id:string;selected_answer:unknown;correct:boolean;marks_earned:number;marks_available:number;points:number;attempt_number:number;created_at:string;concept_title:string;question_text:string;source_name:string};
export type Feedback={attempt:Attempt;answer:unknown;explanation:string|null};
export type Overview={staff_role:string|null;totals:{attempted:number;correct:number;points:number;marks:number;available:number};goal:{exam:string;target_score:number|null;target_rank:number|null;target_percentile:number|null}|null;concepts:{concept_id:string;concept_title:string;chapter_title:string;subject:string;distinct_questions:number;mastery:number|null;correct:number}[];attempts:Attempt[];mistakes:{question_id:string;concept_id:string;concept_title:string;question_text:string;repeated_count:number;resolved_at:string|null;mistake_type:string}[];progress:{concept_id:string;source_filter:string|null}[];rank:number|null;leaderboard:{rank:number;learner:string;points:number}[];interventions:{id:string;message:string;due_at:string|null;completed_at:string|null}[]};
