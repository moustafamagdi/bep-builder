export const TURNSTILE_SITE_KEY='0x4AAAAAAEp8c1SLjK-7NgDh';

const surfaces={
  signin:{selector:'#turnstile-signin',action:'sign_in'},
  signup:{selector:'#turnstile-signup',action:'sign_up'},
  forgot:{selector:'#turnstile-forgot',action:'password_reset'}
};
const state=new Map();
let apiPromise;

function loadApi(){
  if(window.turnstile)return Promise.resolve(window.turnstile);
  if(apiPromise)return apiPromise;
  apiPromise=new Promise((resolve,reject)=>{
    const started=Date.now();
    const poll=()=>{
      if(window.turnstile)return resolve(window.turnstile);
      if(Date.now()-started>12000)return reject(new Error('Security verification could not load. Check your connection or content blocker and try again.'));
      setTimeout(poll,80);
    };
    poll();
  });
  return apiPromise;
}

export async function renderTurnstile(surface){
  const config=surfaces[surface];
  if(!config)return;
  const element=document.querySelector(config.selector);
  if(!element||state.has(surface))return;
  const turnstile=await loadApi();
  const entry={id:null,token:''};
  entry.id=turnstile.render(element,{
    sitekey:TURNSTILE_SITE_KEY,
    action:config.action,
    theme:'light',
    size:'flexible',
    callback:token=>{entry.token=token;},
    'expired-callback':()=>{entry.token='';},
    'timeout-callback':()=>{entry.token='';},
    'error-callback':()=>{entry.token='';return true;}
  });
  state.set(surface,entry);
}

export function captchaToken(surface){return state.get(surface)?.token||'';}

export function resetTurnstile(surface){
  const entry=state.get(surface);
  if(!entry||!window.turnstile)return;
  entry.token='';window.turnstile.reset(entry.id);
}
