// Pocket Option Auto Trader with Asset Switching
// انسخ الكود المضغوط من الأسفل وضعه كـ bookmark في المتصفح

javascript:(function(){
  const SUPABASE_URL='https://ujguqvyshjnrxnmsvsdf.supabase.co';
  const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ3VxdnlzaGpucnhubXN2c2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODMxNTAsImV4cCI6MjA3Nzc1OTE1MH0.utRPrAN2qr78HVvob3-1cA1mH0l4-SZveZcWWFB8Dj0';
  
  let isRunning=false;
  let intervalId=null;
  let processedSignals=new Set();
  let currentSignals=[];
  
  // ============ UI Functions ============
  function showNotification(msg,type='info'){
    const colors={success:'#10b981',error:'#ef4444',warning:'#f59e0b',info:'#3b82f6'};
    const n=document.createElement('div');
    n.style.cssText=`position:fixed;top:20px;right:20px;background:${colors[type]};color:white;padding:16px 24px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:2147483647;font-family:Arial;animation:slideIn 0.3s;max-width:420px;font-size:14px;line-height:1.4`;
    n.textContent=msg;
    document.body.appendChild(n);
    setTimeout(()=>n.remove(),6000);
  }
  
  function createSignalsPanel(){
    const panel=document.createElement('div');
    panel.id='signals-panel';
    panel.style.cssText='position:fixed;top:80px;right:20px;width:350px;max-height:500px;background:linear-gradient(135deg,#1e293b,#334155);color:white;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:2147483646;font-family:Arial;overflow:hidden';
    
    const header=document.createElement('div');
    header.style.cssText='background:linear-gradient(135deg,#667eea,#764ba2);padding:16px;font-weight:bold;font-size:16px;display:flex;justify-content:space-between;align-items:center';
    header.innerHTML='<span>📊 التوصيات المباشرة</span><span id="signal-count" style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:14px">0</span>';
    
    const content=document.createElement('div');
    content.id='signals-content';
    content.style.cssText='max-height:400px;overflow-y:auto;padding:12px';
    
    panel.appendChild(header);
    panel.appendChild(content);
    document.body.appendChild(panel);
    
    return{panel,content};
  }
  
  function updateSignalsDisplay(signals){
    const content=document.getElementById('signals-content');
    const count=document.getElementById('signal-count');
    if(!content)return;
    
    currentSignals=signals;
    count.textContent=signals.length;
    
    if(signals.length===0){
      content.innerHTML='<div style="text-align:center;padding:20px;color:#94a3b8">لا توجد توصيات حالياً</div>';
      return;
    }
    
    content.innerHTML=signals.map(s=>{
      const statusColors={pending:'#f59e0b',executed:'#10b981',failed:'#ef4444'};
      const statusText={pending:'⏳ قيد الانتظار',executed:'✅ تم التنفيذ',failed:'❌ فشل'};
      const dirColor=s.direction.toLowerCase()==='call'?'#10b981':'#ef4444';
      const dirText=s.direction.toLowerCase()==='call'?'🔼 CALL':'🔽 PUT';
      
      return`<div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:12px;margin-bottom:8px;border-left:4px solid ${dirColor}">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-weight:bold;font-size:16px">${s.asset}</span>
          <span style="background:${statusColors[s.status]};padding:4px 8px;border-radius:4px;font-size:12px">${statusText[s.status]}</span>
        </div>
        <div style="display:flex;gap:12px;font-size:13px;color:#cbd5e1">
          <span>${dirText}</span>
          <span>⏱ ${s.timeframe}</span>
          ${s.entry_time?`<span>🕐 ${s.entry_time}</span>`:''}
          <span>💵 $${s.amount}</span>
        </div>
      </div>`;
    }).join('');
  }
  
  // ============ Helper Functions ============
  function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
  
  function findByText(tag,texts){
    const els=document.querySelectorAll(tag);
    for(const el of els){
      const t=(el.innerText||'').toLowerCase();
      if(texts.some(x=>t.includes(x)))return el;
    }
    return null;
  }
  
  function findAny(cands){
    for(const s of cands){
      const el=document.querySelector(s);
      if(el)return el;
    }
    return null;
  }
  
  // ============ Asset Switching ============
  async function switchToAsset(assetName){
    console.log('🔄 محاولة التبديل إلى:',assetName);
    
    // محاولة العثور على زر اختيار الأصل
    const assetBtnSelectors=[
      '[data-test-id="asset-selector"]',
      '.asset-selector',
      '[class*="asset-select"]',
      '[class*="AssetSelect"]',
      'button[class*="asset"]',
      '[data-qa="asset-selector"]',
      '.instruments-dropdown',
      '[class*="instrument"]'
    ];
    
    let assetBtn=findAny(assetBtnSelectors);
    
    // بحث بالنص
    if(!assetBtn){
      assetBtn=findByText('button',['eur/usd','btc','asset','أصل','الأدوات']);
    }
    
    if(!assetBtn){
      console.warn('⚠️ لم يتم العثور على زر اختيار الأصل');
      return false;
    }
    
    // فتح القائمة
    assetBtn.click();
    await sleep(800);
    
    // البحث عن الأصل في القائمة
    const normalizedAsset=assetName.replace(/[\/\s-]/g,'').toLowerCase();
    
    // محاولة البحث في input
    const searchInputs=document.querySelectorAll('input[type="text"],input[type="search"],input[placeholder*="search" i],input[placeholder*="بحث"]');
    if(searchInputs.length>0){
      const searchInput=searchInputs[searchInputs.length-1];
      searchInput.focus();
      searchInput.value=assetName;
      searchInput.dispatchEvent(new Event('input',{bubbles:true}));
      await sleep(600);
    }
    
    // البحث عن العنصر
    const allItems=document.querySelectorAll('[role="option"],li,div[class*="asset"],div[class*="instrument"]');
    for(const item of allItems){
      const text=(item.innerText||'').replace(/[\/\s-]/g,'').toLowerCase();
      if(text.includes(normalizedAsset)||normalizedAsset.includes(text)){
        console.log('✅ تم العثور على الأصل:',item.innerText);
        item.scrollIntoView({behavior:'smooth',block:'center'});
        await sleep(200);
        item.click();
        await sleep(800);
        return true;
      }
    }
    
    // إغلاق القائمة إذا لم نجد الأصل
    if(assetBtn)assetBtn.click();
    
    console.warn('⚠️ لم يتم العثور على الأصل:',assetName);
    return false;
  }
  
  // ============ Trade Execution ============
  async function setTradeAmount(amount){
    const candidates=['input[type="number"]','input[aria-label*="amount" i]','input[inputmode="decimal"]','input[class*="amount" i]','.amount-input input'];
    for(const sel of candidates){
      const el=document.querySelector(sel);
      if(el){
        el.focus();
        el.value='';
        el.value=amount;
        el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
        return true;
      }
    }
    return false;
  }
  
  async function executeTradeOnPocketOption(signal){
    console.log('🚀 تنفيذ:',signal);
    showNotification(`🚀 تنفيذ ${signal.asset} ${signal.direction}`,'info');
    
    try{
      // 1. التبديل إلى الأصل
      const switched=await switchToAsset(signal.asset);
      if(!switched){
        showNotification(`⚠️ لم يتم التبديل إلى ${signal.asset}`,'warning');
      }
      
      // 2. تعيين المبلغ
      await sleep(500);
      await setTradeAmount(signal.amount);
      
      // 3. النقر على زر التداول
      await sleep(500);
      const callSels=['[data-dir="call"]','.call-btn','.up-btn','[data-direction="higher"]','.higher','.buy'];
      const putSels=['[data-dir="put"]','.put-btn','.down-btn','[data-direction="lower"]','.lower','.sell'];
      
      let btn=signal.direction.toLowerCase()==='call'?findAny(callSels):findAny(putSels);
      
      if(!btn){
        btn=signal.direction.toLowerCase()==='call'?
          findByText('button',['call','higher','up','شراء','أعلى','▲','↑']):
          findByText('button',['put','lower','down','بيع','أسفل','▼','↓']);
      }
      
      if(!btn){
        showNotification('⚠️ لم يتم العثور على زر التداول','warning');
        return false;
      }
      
      btn.scrollIntoView({behavior:'smooth',block:'center'});
      await sleep(200);
      btn.click();
      await sleep(800);
      
      showNotification(`✅ تم تنفيذ ${signal.direction} على ${signal.asset}`,'success');
      return true;
    }catch(e){
      console.error('❌ خطأ:',e);
      showNotification('❌ خطأ: '+e.message,'error');
      return false;
    }
  }
  
  // ============ API Functions ============
  async function updateSignalStatus(id,status){
    try{
      await fetch(`${SUPABASE_URL}/rest/v1/signals?id=eq.${id}`,{
        method:'PATCH',
        headers:{
          'apikey':SUPABASE_KEY,
          'Authorization':'Bearer '+SUPABASE_KEY,
          'Content-Type':'application/json',
          'Prefer':'return=minimal'
        },
        body:JSON.stringify({status})
      });
    }catch(e){
      console.warn('تحديث الحالة فشل',e);
    }
  }
  
  function shouldExecute(s){
    if(!s.entry_time)return true;
    const now=new Date();
    const[h,m]=s.entry_time.split(':').map(Number);
    const entry=new Date(now);
    entry.setHours(h,m,0,0);
    const diff=(entry-now)/60000;
    if(diff>10)return false;
    if(diff<-7)return true;
    return Math.abs(diff)<=2;
  }
  
  async function fetchAndDisplaySignals(){
    try{
      const r=await fetch(`${SUPABASE_URL}/rest/v1/signals?order=received_at.desc&limit=20`,{
        headers:{
          'apikey':SUPABASE_KEY,
          'Authorization':'Bearer '+SUPABASE_KEY
        }
      });
      const signals=await r.json();
      
      // تصفية التوصيات من آخر 12 ساعة
      const twelveHoursAgo=new Date(Date.now()-12*60*60*1000);
      const recentSignals=signals.filter(s=>new Date(s.received_at)>twelveHoursAgo);
      
      updateSignalsDisplay(recentSignals);
      return recentSignals;
    }catch(e){
      console.error('❌ خطأ في جلب التوصيات',e);
      return[];
    }
  }
  
  async function checkAndExecutePendingSignals(){
    try{
      const signals=await fetchAndDisplaySignals();
      const pending=signals.filter(s=>s.status==='pending');
      
      console.log('📊 قيد الانتظار:',pending.length);
      
      let executed=0;
      for(const s of pending){
        if(processedSignals.has(s.id))continue;
        if(!shouldExecute(s))continue;
        
        const ok=await executeTradeOnPocketOption(s);
        await updateSignalStatus(s.id,ok?'executed':'failed');
        processedSignals.add(s.id);
        executed++;
        
        await sleep(2000); // انتظار بين الصفقات
      }
      
      if(executed>0){
        showNotification(`🎉 تم تنفيذ ${executed} صفقة`,'success');
        await fetchAndDisplaySignals(); // تحديث العرض
      }
    }catch(e){
      console.error('❌ خطأ',e);
      showNotification('❌ خطأ في الفحص','error');
    }
  }
  
  // ============ Main Control ============
  function toggleAutoTrade(){
    if(isRunning){
      clearInterval(intervalId);
      intervalId=null;
      isRunning=false;
      btn.textContent='▶️ تشغيل';
      btn.style.background='linear-gradient(135deg,#667eea,#764ba2)';
      showNotification('⏸️ تم الإيقاف','info');
    }else{
      isRunning=true;
      btn.textContent='⏸️ إيقاف';
      btn.style.background='linear-gradient(135deg,#10b981,#059669)';
      processedSignals.clear();
      
      checkAndExecutePendingSignals();
      intervalId=setInterval(checkAndExecutePendingSignals,5000);
      
      showNotification('🚀 التداول التلقائي نشط','success');
    }
  }
  
  // ============ Initialize ============
  const{panel,content}=createSignalsPanel();
  
  const btn=document.createElement('button');
  btn.textContent='▶️ تشغيل';
  btn.style.cssText='position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;padding:18px 36px;border-radius:50px;font-size:18px;font-weight:bold;cursor:pointer;box-shadow:0 8px 25px rgba(102,126,234,0.5);z-index:2147483647;font-family:Arial;transition:all .3s';
  btn.onclick=toggleAutoTrade;
  document.body.appendChild(btn);
  
  const style=document.createElement('style');
  style.textContent='@keyframes slideIn{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}';
  document.head.appendChild(style);
  
  // جلب وعرض التوصيات فوراً
  fetchAndDisplaySignals();
  setInterval(fetchAndDisplaySignals,8000);
  
  showNotification('🤖 جاهز! افتح Pocket Option واضغط تشغيل','success');
})();
