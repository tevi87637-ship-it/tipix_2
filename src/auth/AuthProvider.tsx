import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isGrade, isStream } from '../lib/studentProfile';
export type StudentProfile = { id: string; full_name: string; school_name: string; school_city: string; grade: number; stream: string | null; role: 'student' };
const fields = 'id,full_name,school_name,school_city,grade,stream,role';
export async function studentProfile(user: User): Promise<StudentProfile> {
  if (!user.email_confirmed_at) throw new Error('Verify your email before continuing.');
  const result = await supabase.from('tipix_student_profiles').select(fields).eq('id',user.id).maybeSingle();
  if (result.error) throw new Error('Your student profile could not be loaded. Please try again.');
  if (result.data) return result.data as StudentProfile;
  // Metadata is only self-reported registration input. Never use it as a role or school-access claim.
  const m = user.user_metadata;
  const grade = String(m.grade ?? '');
  if (!isGrade(grade) || (Number(grade) >= 11 && !isStream(m.stream)) || !['full_name','school_name','school_city'].every(k=> typeof m[k] === 'string' && m[k].trim().length >= 2))
    throw new Error('Student details are missing. Contact TIPIX to complete your profile.');
  const record = {id:user.id,full_name:m.full_name.trim(),school_name:m.school_name.trim(),school_city:m.school_city.trim(),grade:Number(grade),stream:Number(grade)>=11?m.stream:null};
  const inserted = await supabase.from('tipix_student_profiles').insert(record).select(fields).single();
  if (inserted.error?.code === '23505') {
    const retry = await supabase.from('tipix_student_profiles').select(fields).eq('id',user.id).single();
    if (!retry.error) return retry.data as StudentProfile;
  }
  if (inserted.error) throw new Error('Your account is verified, but your student profile could not be saved. Please retry.');
  return inserted.data as StudentProfile;
}
type AuthState = { user: User | null; loading: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser] = useState<User|null>(null);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    let active = true, revision = 0;
    const refresh = async () => {
      const current = ++revision;
      try {
        const {data,error} = await supabase.auth.getUser();
        if(active && current===revision) setUser(error?null:data.user);
      } catch { if(active && current===revision) setUser(null); }
      finally { if(active && current===revision) setLoading(false); }
    };
    void refresh();
    const {data:{subscription}} = supabase.auth.onAuthStateChange((event,session)=>{
      // Do not await another auth method inside Supabase's auth callback.
      if (event==='SIGNED_OUT') {revision++;setUser(null);setLoading(false);}
      else if(session) {revision++;setUser(session.user);setLoading(false);}
    });
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);
  async function signOut() {
    const {error} = await supabase.auth.signOut({scope:'local'});
    if(error) throw new Error('Could not sign out. Check your connection and try again.');
    setUser(null);
  }
  return <AuthContext.Provider value={{user,loading,signOut}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('Auth provider missing');return value;}
export function RequireAuth({children}:{children:ReactNode}) {
  const {user,loading}=useAuth(); const location=useLocation();
  if(loading)return <div className="simple-page" role="status">Checking your session…</div>;
  if(!user)return <Navigate to="/login" replace state={{from:location.pathname}}/>;
  if(!user.email_confirmed_at)return <Navigate to="/verify-email" replace/>;
  return <ProfileGate key={user.id} user={user}>{children}</ProfileGate>;
}

const ProfileContext = createContext<StudentProfile|null>(null);
export function useStudentProfile(){const profile=useContext(ProfileContext);if(!profile)throw new Error('Student profile missing');return profile;}
function ProfileGate({user,children}:{user:User;children:ReactNode}) {
  const [profile,setProfile]=useState<StudentProfile|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const {signOut}=useAuth();
  useEffect(()=>{let active=true;setError('');setProfile(null);studentProfile(user).then(p=>{if(active)setProfile(p);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[user.id,attempt]);
  if(error)return <div className="simple-page"><h1>Let’s finish your account.</h1><p role="alert">{error}</p><button className="button" onClick={()=>setAttempt(n=>n+1)}>Retry</button> <button className="button" onClick={()=>void signOut().catch(e=>setError(e.message))}>Sign out</button></div>;
  if(!profile)return <div className="simple-page" role="status">Loading your student profile…</div>;
  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}
