const KEY_MEALS = 'nutripulse_meals'
const KEY_WATER = 'nutripulse_water'
const KEY_SLEEP = 'nutripulse_sleep'
const KEY_ACTIVITY = 'nutripulse_activity'

function load(key){return JSON.parse(localStorage.getItem(key)||'[]')}
function save(key,arr){localStorage.setItem(key,JSON.stringify(arr))}

function renderEntries(){
  const container=document.getElementById('entries')
  container.innerHTML=''
  const meals=load(KEY_MEALS)
  const water=load(KEY_WATER)
  const sleep=load(KEY_SLEEP)
  const activity=load(KEY_ACTIVITY)
  const make=(label,items)=>{
    if(!items.length) return
    const h=document.createElement('div');h.className='entry';h.innerHTML=`<div><strong>${label}</strong> (${items.length})</div>`
    container.appendChild(h)
  }
  make('Meals',meals)
  make('Water',water)
  make('Sleep',sleep)
  make('Activity',activity)
}

function computeDashboard(){
  const meals=load(KEY_MEALS)
  const water=load(KEY_WATER)
  const sleep=load(KEY_SLEEP)
  const activity=load(KEY_ACTIVITY)

  // Nutrition score (0-100) simplistic heuristic
  let totalCalories=meals.reduce((s,m)=>s+(m.calories||0),0)
  let totalFiber=meals.reduce((s,m)=>s+(m.fiber||0),0)
  let probioticCount=meals.filter(m=>m.probiotic).length
  let fruitCount=meals.filter(m=>m.fruit).length

  // macros percent
  let proteinCalories=meals.reduce((s,m)=>s+((m.protein||0)*4),0)
  let carbCalories=meals.reduce((s,m)=>s+((m.carbs||0)*4),0)
  let fatCalories=meals.reduce((s,m)=>s+((m.fat||0)*9),0)
  let macroTotal=proteinCalories+carbCalories+fatCalories||1
  let proteinPct=Math.round(proteinCalories/macroTotal*100)
  let carbPct=Math.round(carbCalories/macroTotal*100)

  let score=50
  if(totalCalories>0){
    if(totalCalories>=1600 && totalCalories<=2400) score+=10
    else score-=10
  }
  if(totalFiber>=25) score+=15
  else if(totalFiber>=15) score+=5
  if(fruitCount>0) score+=5
  if(probioticCount>0) score+=5
  if(proteinPct>=10 && proteinPct<=30) score+=10
  score=Math.max(0,Math.min(100,score))

  // Gut health
  let gut='—'
  if(totalFiber>=25 || probioticCount>=2) gut='Good'
  else if(totalFiber>=12 || probioticCount===1) gut='Fair'
  else gut='Poor'

  // Obesity risk
  let totalActivity=activity.reduce((s,a)=>s+(a.minutes||0),0)
  let obesity='Low'
  if(totalCalories>2600 && totalActivity<30) obesity='High'
  else if(totalCalories>2200 && totalActivity<60) obesity='Medium'

  // Diabetes risk (simple heuristic)
  let diabetes='Low'
  if(carbPct>60 || (sleep.length && sleep.reduce((s,x)=>s+x.hours,0)/sleep.length<6)) diabetes='Medium'
  if(carbPct>70) diabetes='High'

  document.getElementById('nutrition-score').textContent=score
  document.getElementById('gut-health').textContent=gut
  document.getElementById('obesity-risk').textContent=obesity
  document.getElementById('diabetes-risk').textContent=diabetes
}

// forms
document.getElementById('meal-form').addEventListener('submit',e=>{
  e.preventDefault()
  const f=e.target; const data={
    name:f.name.value, calories:Number(f.calories.value)||0,
    protein:Number(f.protein.value)||0, carbs:Number(f.carbs.value)||0,
    fat:Number(f.fat.value)||0, fiber:Number(f.fiber.value)||0,
    fruit:!!f.fruit.checked, probiotic:!!f.probiotic.checked,
    created:Date.now()
  }
  const meals=load(KEY_MEALS);meals.unshift(data);save(KEY_MEALS,meals)
  f.reset();renderEntries();computeDashboard()
})

document.getElementById('water-form').addEventListener('submit',e=>{
  e.preventDefault();const ml=Number(e.target.ml.value)||0;const arr=load(KEY_WATER);arr.unshift({ml,created:Date.now()});save(KEY_WATER,arr);e.target.reset();renderEntries();computeDashboard()
})

document.getElementById('sleep-form').addEventListener('submit',e=>{
  e.preventDefault();const hours=Number(e.target.hours.value)||0;const arr=load(KEY_SLEEP);arr.unshift({hours,created:Date.now()});save(KEY_SLEEP,arr);e.target.reset();renderEntries();computeDashboard()
})

document.getElementById('activity-form').addEventListener('submit',e=>{
  e.preventDefault();const data={type:e.target.type.value,minutes:Number(e.target.minutes.value)||0,intensity:e.target.intensity.value,created:Date.now()};const arr=load(KEY_ACTIVITY);arr.unshift(data);save(KEY_ACTIVITY,arr);e.target.reset();renderEntries();computeDashboard()
})

document.getElementById('clear-data').addEventListener('click',()=>{
  if(!confirm('Clear all stored entries?')) return
  localStorage.removeItem(KEY_MEALS);localStorage.removeItem(KEY_WATER);localStorage.removeItem(KEY_SLEEP);localStorage.removeItem(KEY_ACTIVITY);renderEntries();computeDashboard()
})

// simple chatbot
const chatLog=document.getElementById('chat-log')
function pushMsg(text,who='bot'){
  const d=document.createElement('div');d.className='msg '+(who==='user'?'user':'bot');d.textContent=text;chatLog.appendChild(d);chatLog.scrollTop=chatLog.scrollHeight
}
document.getElementById('chat-form').addEventListener('submit',e=>{
  e.preventDefault();const q=document.getElementById('chat-input');const text=q.value.trim();if(!text) return;pushMsg(text,'user');q.value=''
  // simple rule-based replies
  const t=text.toLowerCase()
  if(t.includes('water')) pushMsg('Aim for ~2000–3000ml depending on activity. Sip regularly.')
  else if(t.includes('sleep')) pushMsg('7–9 hours is ideal. Keep consistent bed/wake times.')
  else if(t.includes('fiber')) pushMsg('Include whole grains, legumes, fruits and veg—aim 25g+/day.')
  else if(t.includes('protein')) pushMsg('Include lean protein (eggs, fish, legumes) each meal.')
  else if(t.includes('exercise')||t.includes('activity')) pushMsg('Try 150 minutes of moderate activity weekly, plus strength twice weekly.')
  else if(t.includes('gut')) pushMsg('Fermented foods, fiber, and diverse plants support gut health.')
  else pushMsg('Try asking about water, sleep, fiber, protein, exercise, or gut health.')
})

// initialization
renderEntries();computeDashboard()
