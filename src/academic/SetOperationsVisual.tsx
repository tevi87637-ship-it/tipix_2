import {useId,useState} from 'react';

export default function SetOperationsVisual(){
  const [operation,setOperation]=useState<'union'|'intersection'>('union');
  const clip=useId();
  return <figure className="set-visual">
    <div className="lp-task-actions" role="group" aria-label="Set operation">
      <button className={`w-button ${operation==='union'?'':'secondary'}`} aria-pressed={operation==='union'} onClick={()=>setOperation('union')}>Union · A ∪ B</button>
      <button className={`w-button ${operation==='intersection'?'':'secondary'}`} aria-pressed={operation==='intersection'} onClick={()=>setOperation('intersection')}>Intersection · A ∩ B</button>
    </div>
    <svg viewBox="0 0 480 250" role="img" aria-label={operation==='union'?'Union: 1, 2, 3, 4, 5':'Intersection: 3'}>
      <defs><clipPath id={clip}><circle cx="190" cy="125" r="94"/></clipPath></defs>
      <circle cx="190" cy="125" r="94" className={operation==='union'?'set-region selected':'set-region'}/>
      <circle cx="290" cy="125" r="94" className={operation==='union'?'set-region selected':'set-region'}/>
      {operation==='intersection'&&<circle cx="290" cy="125" r="94" clipPath={`url(#${clip})`} className="set-region selected"/>}
      <g fill="currentColor" textAnchor="middle" fontSize="20"><text x="145" y="74">A</text><text x="335" y="74">B</text><text x="151" y="123">1</text><text x="165" y="167">2</text><text x="240" y="137">3</text><text x="324" y="123">4</text><text x="311" y="167">5</text></g>
    </svg>
    <figcaption aria-live="polite">{operation==='union'?'A ∪ B = {1, 2, 3, 4, 5} — include either circle and the overlap.':'A ∩ B = {3} — include only the overlap.'}</figcaption>
  </figure>;
}
