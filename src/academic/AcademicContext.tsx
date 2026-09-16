import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from 'react';
import {useStudentProfile} from '../auth/AuthProvider';
import {academic,type Overview,type Concept,type Source} from './api';
const Context=createContext<{overview:Overview|null;concepts:Concept[];sources:Source[];error:string;loading:boolean;refresh:()=>Promise<void>}|null>(null);
export function AcademicProvider({children}:{children:ReactNode}){
 const profile=useStudentProfile();const [overview,setOverview]=useState<Overview|null>(null),[concepts,setConcepts]=useState<Concept[]>([]),[sources,setSources]=useState<Source[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{setError('');try{const [o,c,s]=await Promise.all([academic<Overview>('overview'),academic<Concept[]>('catalog'),academic<Source[]>('sources')]);setOverview(o);setConcepts(c);setSources(s);}catch(e){setError(e instanceof Error?e.message:'Unable to load academic records');}finally{setLoading(false);}},[profile.id]);
 useEffect(()=>{void refresh();},[refresh]);
 return <Context.Provider value={{overview,concepts,sources,error,loading,refresh}}>{children}</Context.Provider>;
}
export function useAcademic(){const c=useContext(Context);if(!c)throw new Error('Academic provider missing');return c;}
