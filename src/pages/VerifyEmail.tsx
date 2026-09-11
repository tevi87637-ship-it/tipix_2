import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {ArrowRight,Mail,LockKeyhole} from 'lucide-react';
import Atmosphere from '../components/Atmosphere';
import {supabase} from '../lib/supabase';
import {authError} from './Auth';
import './Auth.css';
export default function VerifyEmail({recovery=false}:{recovery?:boolean}) {
  const location=useLocation(), navigate=useNavigate();
  const [email,setEmail]=useState(typeof location.state?.email==='string'?location.state.email:'');
  const [code,setCode]=useState(''), [password,setPassword]=useState(''), [confirmation,setConfirmation]=useState('');
  const [verified,setVerified]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
  const [cooldown,setCooldown]=useState(location.state?.requested?60:0);
  const lock=useRef(false);
  useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(n=>Math.max(n-1,0)),1000);return()=>clearTimeout(timer);},[cooldown]);
  async function resend() {
    if(lock.current||cooldown)return;
    if(!/^\S+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setStatus('Enter your email address first.');return;}
    lock.current=true;setBusy(true);setStatus('');
    try {
      const {error}=recovery?await supabase.auth.resetPasswordForEmail(email.trim()):await supabase.auth.resend({type:'signup',email:email.trim()});
      if(error){setStatus(authError(error));return;}
      setCooldown(60);setStatus('If this address is eligible, a new verification email has been requested. Check your inbox and spam folder.');
    } catch {setStatus('Unable to connect. Try again.');}
    finally {lock.current=false;setBusy(false);}
  }
  async function submit(event:FormEvent){
    event.preventDefault();if(lock.current)return;
    if(verified){if(password.length<8||password.length>128||password!==confirmation){setStatus('Use 8–128 characters and make both passwords match.');return;}}
    else if(!/^\S+@[^\s@]+\.[^\s@]+$/.test(email.trim())||!/^\d{6,10}$/.test(code)){setStatus('Enter your email and the complete numeric code from your email.');return;}
    lock.current=true;setBusy(true);setStatus('');
    try {
      if(verified){
        const {error}=await supabase.auth.updateUser({password});
        if(error){setStatus(authError(error));return;}
        setPassword('');setConfirmation('');
        const {error: signOutError} = await supabase.auth.signOut({scope:'global'});
        if(signOutError){setStatus('Password changed. Sign-out could not complete; use the workspace sign-out control before leaving this device.');return;}
        navigate('/login',{replace:true});return;
      }
      const {data,error}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:code,type:recovery?'recovery':'email'});
      if(error){setStatus(authError(error));return;}
      if(!data.session||!data.user?.email_confirmed_at){setStatus('Verification did not complete. Request a new code.');return;}
      setCode('');
      if(recovery)setVerified(true);else navigate('/app/dashboard',{replace:true});
    } catch {setStatus('Unable to connect. Try again.');}
    finally {lock.current=false;setBusy(false);}
  }
  return <div className="auth-v2 auth-cinematic"><Atmosphere/><section className="a-form-panel"><div className="a-form-container">
    <div className="a-verification-icon" aria-hidden="true">{verified?<LockKeyhole/>:<Mail/>}</div>
    <div className="a-step-enter"><h1>{verified?'Choose a new password.':recovery?'Recover your account.':'Check your email.'}</h1>
    <p className="a-subtitle">{verified?'Use a strong password you haven’t used elsewhere.':'Enter the verification code from TIPIX to continue.'}</p>
    <form onSubmit={submit}>
    {!verified ? <>
      <div className="a-field"><label htmlFor="verify-email">Email address</label><div className="a-input-wrap"><input id="verify-email" type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setCode('');}} required maxLength={254}/></div></div>
      <div className="a-field"><label htmlFor="verify-code">Email verification code</label><div className="a-input-wrap"><input className="a-otp-input" id="verify-code" inputMode="numeric" autoComplete="one-time-code" placeholder="Enter your code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,10))} minLength={6} maxLength={10} required/></div></div>
    </> : <>
      <div className="a-field"><label htmlFor="new-password">New password</label><div className="a-input-wrap"><input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></div></div>
      <div className="a-field"><label htmlFor="confirm-new">Confirm new password</label><div className="a-input-wrap"><input id="confirm-new" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></div></div>
    </>}
    <div className="a-form-actions"><button type="submit" className="a-submit" disabled={busy}>{busy?'Please wait…':verified?'Save password':recovery?'Verify recovery code':'Verify email'}<ArrowRight size={17}/></button></div>
    <p className="a-status" role="status">{status}</p>
    </form>
    {!verified&&<button className="a-resend" type="button" disabled={busy||cooldown>0} onClick={resend}>{cooldown?`Request another code in ${cooldown}s`:'Resend verification code'}</button>}
    <Link className="a-back-login" to="/login">Back to log in</Link>
    </div></div></section></div>;
}
