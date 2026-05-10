const CITIES=[{name:"Paris",country:"France",emoji:"🇫🇷"},{name:"Tokyo",country:"Japan",emoji:"🇯🇵"},{name:"New York",country:"USA",emoji:"🇺🇸"},{name:"London",country:"UK",emoji:"🇬🇧"},{name:"Rome",country:"Italy",emoji:"🇮🇹"},{name:"Dubai",country:"UAE",emoji:"🇦🇪"},{name:"Bangkok",country:"Thailand",emoji:"🇹🇭"},{name:"Barcelona",country:"Spain",emoji:"🇪🇸"},{name:"Sydney",country:"Australia",emoji:"🇦🇺"},{name:"Istanbul",country:"Turkey",emoji:"🇹🇷"},{name:"Bali",country:"Indonesia",emoji:"🇮🇩"},{name:"Singapore",country:"Singapore",emoji:"🇸🇬"}];
const CATS=['general','clothing','documents','electronics','toiletries','medicine'];
const App={
state:{userId:localStorage.getItem('tr_uid'),userName:localStorage.getItem('tr_uname'),activeTripId:null,currentView:'auth',itinView:'list'},

init(){this.attachListeners();this.state.userId?this.navigate('home'):this.navigate('auth');this.updateAuthCorner();},

updateAuthCorner(){const c=document.getElementById('auth-corner');if(!c)return;c.innerHTML=this.state.userId?`<span style="font-size:0.85rem;color:var(--text-secondary)">Hi, ${this.state.userName||'User'}</span> <button class="btn btn-sm" style="color:var(--danger);background:none" onclick="App.logout()">Logout</button>`:`<button class="btn btn-outline btn-sm" onclick="App.navigate('auth')">Sign In</button>`;},

attachListeners(){
const af=document.getElementById('auth-form');if(af)af.onsubmit=e=>this.handleAuth(e);
const tf=document.getElementById('form-create-trip');if(tf)tf.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.user_id=this.state.userId;const r=await(await fetch('api.php?action=createTrip',{method:'POST',body:JSON.stringify(d)})).json();if(r.success){this.state.activeTripId=r.trip_id;e.target.reset();this.toast('Trip created! 🎉');this.navigate('builder')}};
},

navigate(v){this.state.currentView=v;document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));document.querySelectorAll('.nav-links button').forEach(b=>b.classList.remove('active'));const t=document.getElementById(v);if(t)t.classList.add('active');const n=document.getElementById('nav-'+v);if(n)n.classList.add('active');this.render();},

render(){
if(this.state.currentView==='home'){this.renderTripList();this.renderPopularCities();const w=document.getElementById('welcome-msg');if(w&&this.state.userName)w.innerHTML=`Welcome, ${this.state.userName}! <span>Where to next?</span> 🌍`;}
if(this.state.currentView==='my-trips')this.renderTripList();
if(this.state.currentView==='profile')this.renderProfile();
if(this.state.activeTripId){this.renderItinerary();this.renderBudget();this.renderChecklist();this.renderNotes();}
},

async handleAuth(e){e.preventDefault();const fd=new FormData(e.target);const ng=document.getElementById('name-group');const mode=(ng&&ng.style.display!=='none')?'signup':'login';const r=await(await fetch(`api.php?action=${mode}`,{method:'POST',body:JSON.stringify(Object.fromEntries(fd))})).json();if(r.success){if(mode==='login'){localStorage.setItem('tr_uid',r.user.id);localStorage.setItem('tr_uname',r.user.name);location.reload()}else{this.toast('Account created! Please login.');this.toggleAuthMode()}}else this.toast(r.message||'Auth failed');},

toggleAuthMode(){const t=document.getElementById('auth-title'),s=document.getElementById('auth-subtitle'),n=document.getElementById('name-group'),g=document.getElementById('auth-toggle-text'),l=t.innerText.includes('Welcome');t.innerText=l?'Create Account':'Welcome back';s.innerText=l?'Start planning your adventures':'Sign in to continue your journeys';if(n)n.style.display=l?'flex':'none';if(g)g.innerHTML=l?'Already have an account? <span>Sign in</span>':"Don't have an account? <span>Sign up</span>";},

logout(){localStorage.removeItem('tr_uid');localStorage.removeItem('tr_uname');location.reload();},

renderPopularCities(){const c=document.getElementById('popular-cities');if(!c)return;c.innerHTML=CITIES.slice(0,6).map(ci=>`<div class="city-card card" onclick="App.addCityFromSearch('${ci.name}')"><span style="font-size:1.5rem">${ci.emoji}</span><h3 style="font-size:1rem;margin:0.3rem 0 0">${ci.name}</h3><span class="text-muted" style="font-size:0.8rem">${ci.country}</span></div>`).join('');},

async renderTripList(){const r=await(await fetch(`api.php?action=getTrips&user_id=${this.state.userId}`)).json();const dl=document.getElementById('dashboard-recent-list');if(dl){dl.innerHTML=r.length===0?'<div class="empty-state"><div class="emoji">🌎</div><p>No trips yet — start planning!</p></div>':r.slice(0,3).map(t=>`<div class="trip-card card" onclick="App.openTrip(${t.id})"><h3>${t.name}</h3><div class="trip-dates">📅 ${t.start_date||''} → ${t.end_date||''}</div>${t.description?`<div class="trip-desc">${t.description}</div>`:''}<div class="trip-badge">${t.stop_count||0} cities · View Trip →</div></div>`).join('');}
const tg=document.getElementById('trip-list-grid');if(tg){tg.innerHTML=r.length===0?'<div class="empty-state" style="grid-column:1/-1"><div class="emoji">✈️</div><p>No trips yet. Create your first adventure!</p></div>':r.map(t=>`<div class="trip-card card"><div onclick="App.openTrip(${t.id})"><h3>${t.name}</h3><div class="trip-dates">📅 ${t.start_date||''} → ${t.end_date||''}</div>${t.description?`<div class="trip-desc">${t.description}</div>`:''}<div class="trip-badge">${t.stop_count||0} cities</div></div><div class="card-actions"><button class="btn btn-outline btn-sm" onclick="App.shareTrip(${t.id})">🔗 Share</button><button class="btn btn-danger btn-sm" onclick="event.stopPropagation();App.deleteTrip(${t.id})">🗑 Delete</button></div></div>`).join('');}},

openTrip(id){this.state.activeTripId=id;this.navigate('builder');},

async deleteTrip(id){if(!confirm('Delete this trip and all its data?'))return;await fetch('api.php?action=deleteTrip',{method:'POST',body:JSON.stringify({trip_id:id,user_id:this.state.userId})});if(this.state.activeTripId==id)this.state.activeTripId=null;this.toast('Trip deleted');this.render();},

async shareTrip(id){const r=await(await fetch('api.php?action=toggleShareTrip',{method:'POST',body:JSON.stringify({trip_id:id})})).json();if(r.is_public){const url=location.origin+location.pathname+'?shared='+r.share_code;navigator.clipboard.writeText(url).then(()=>this.toast('Link copied! 🔗')).catch(()=>this.toast('Sharing enabled'));}else this.toast('Sharing disabled');},

setItinView(v){this.state.itinView=v;document.querySelectorAll('.view-toggle').forEach(b=>{b.classList.toggle('active',b.dataset.view===v);});this.renderItinerary();},

async renderItinerary(){const r=await(await fetch(`api.php?action=getItinerary&trip_id=${this.state.activeTripId}`)).json();const c=document.getElementById('itinerary-timeline');if(!c)return;
if(r.length===0){c.innerHTML='<div class="empty-state"><div class="emoji">🗺️</div><p>No stops added. Add your first city!</p></div>';return;}
if(this.state.itinView==='day'){let html='';r.forEach(s=>{html+=`<div class="day-group"><div class="day-header"><h3>📍 ${s.city_name}</h3><span class="text-muted">${s.arrival_date||'No date set'}</span></div>`;s.activities.forEach(a=>{html+=`<div class="activity-item"><span>${a.time_slot||''} ${this.catIcon(a.category)} ${a.title}</span><span class="flex gap-2 align-center"><span class="activity-cost">$${Number(a.cost||0).toFixed(2)}</span><button class="btn-x" onclick="App.deleteActivity(${a.id})">×</button></span></div>`;});html+=`<button class="btn btn-ghost btn-sm" style="margin-top:0.5rem" onclick="App.showAddActivity(${s.id})">+ Add activity</button></div>`;});c.innerHTML=html;
}else{c.innerHTML=`<div class="timeline">${r.map((s,i)=>`<div class="timeline-stop"><div class="dot"></div><div class="stop-card"><div class="flex justify-between align-center"><h3>📍 ${s.city_name} ${s.arrival_date?'<span class="text-muted" style="font-size:0.8rem;font-weight:400;margin-left:0.5rem">'+s.arrival_date+'</span>':''}</h3><div class="flex gap-2"><button class="btn btn-outline btn-sm" onclick="App.showAddActivity(${s.id})">+ Activity</button><button class="btn-x" onclick="App.deleteStop(${s.id})" title="Remove stop">×</button></div></div><div style="margin-top:0.75rem">${s.activities.length>0?s.activities.map(a=>`<div class="activity-item"><span>${a.time_slot?a.time_slot+' ':''} ${this.catIcon(a.category)} ${a.title}</span><span class="flex gap-2 align-center"><span class="activity-cost">$${Number(a.cost||0).toFixed(2)}</span><button class="btn-x" onclick="App.deleteActivity(${a.id})">×</button></span></div>`).join(''):'<p style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem 0">No activities yet</p>'}</div></div></div>`).join('')}</div>`;}},

catIcon(c){return{transport:'🚗',stay:'🏨',food:'🍽️',activity:'🎯'}[c]||'🎯';},

showCitySearch(){let list=CITIES;this.showModal('Add City Stop',`<div class="form-group"><label>Search City</label><input type="text" id="city-search-input" placeholder="Search cities..." oninput="App.filterCities()"></div><div class="form-group"><label>Or enter custom city</label><input type="text" id="custom-city" placeholder="Type any city name"></div><div class="form-group"><label>Arrival Date (optional)</label><input type="date" id="city-date"></div><div id="city-results" class="city-results">${this.renderCityList(CITIES)}</div>`,async()=>{const custom=document.getElementById('custom-city').value.trim();const city=custom||document.querySelector('.city-result.selected')?.dataset.city;if(!city||!this.state.activeTripId)return;const date=document.getElementById('city-date').value||null;await fetch('api.php?action=addStop',{method:'POST',body:JSON.stringify({trip_id:this.state.activeTripId,city,arrival_date:date})});this.closeModal();this.toast('City added! 📍');this.render();});},

renderCityList(cities){return cities.map(c=>`<div class="city-result" data-city="${c.name}" onclick="this.classList.toggle('selected');document.querySelectorAll('.city-result').forEach(x=>{if(x!==this)x.classList.remove('selected')})">${c.emoji} <strong>${c.name}</strong> <span class="text-muted">· ${c.country}</span></div>`).join('');},

filterCities(){const q=document.getElementById('city-search-input').value.toLowerCase();const f=CITIES.filter(c=>c.name.toLowerCase().includes(q)||c.country.toLowerCase().includes(q));document.getElementById('city-results').innerHTML=this.renderCityList(f);},

addCityFromSearch(name){if(!this.state.activeTripId){this.toast('Create or open a trip first');this.navigate('create-trip');return;}this.showModal('Add '+name+' to Trip',`<p>Add <strong>${name}</strong> as a stop?</p><div class="form-group" style="margin-top:1rem"><label>Arrival Date (optional)</label><input type="date" id="city-date"></div>`,async()=>{await fetch('api.php?action=addStop',{method:'POST',body:JSON.stringify({trip_id:this.state.activeTripId,city:name,arrival_date:document.getElementById('city-date').value||null})});this.closeModal();this.toast(name+' added! 📍');this.navigate('builder');});},

showAddActivity(stopId){this.showModal('Add Activity',`<div class="form-group"><label>Activity Name</label><input type="text" id="m-act-title" placeholder="e.g. Eiffel Tower visit" autofocus></div><div class="form-group"><label>Category</label><select id="m-act-cat" style="background:var(--sand);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:0.7rem;font-family:inherit;font-size:0.95rem"><option value="activity">🎯 Activity</option><option value="transport">🚗 Transport</option><option value="stay">🏨 Accommodation</option><option value="food">🍽️ Food & Dining</option></select></div><div class="flex gap-4"><div class="form-group" style="flex:1"><label>Cost ($)</label><input type="number" id="m-act-cost" placeholder="0.00" step="0.01" min="0"></div><div class="form-group" style="flex:1"><label>Time</label><input type="time" id="m-act-time"></div></div>`,async()=>{const title=document.getElementById('m-act-title').value.trim();if(!title)return;await fetch('api.php?action=addActivity',{method:'POST',body:JSON.stringify({stop_id:stopId,title,cost:Number(document.getElementById('m-act-cost').value)||0,category:document.getElementById('m-act-cat').value,time_slot:document.getElementById('m-act-time').value||null})});this.closeModal();this.toast('Activity added! 🎯');this.render();});},

async deleteStop(id){if(!confirm('Remove this stop?'))return;await fetch('api.php?action=deleteStop',{method:'POST',body:JSON.stringify({stop_id:id})});this.toast('Stop removed');this.render();},

async deleteActivity(id){await fetch('api.php?action=deleteActivity',{method:'POST',body:JSON.stringify({id})});this.toast('Removed');this.render();},

async renderBudget(){const r=await(await fetch(`api.php?action=getItinerary&trip_id=${this.state.activeTripId}`)).json();const c=document.getElementById('budget-content');if(!c)return;
let total=0,byCat={transport:0,stay:0,food:0,activity:0},byCity=[];
r.forEach(s=>{let ct=0;s.activities.forEach(a=>{const cost=Number(a.cost||0);total+=cost;ct+=cost;byCat[a.category||'activity']+=cost;});byCity.push({name:s.city_name,total:ct});});
if(total===0&&r.length===0){c.innerHTML='<div class="empty-state"><div class="emoji">💰</div><p>Add stops & activities to see budget.</p></div>';return;}
const days=byCity.length||1;
c.innerHTML=`<div class="budget-total"><div class="amount">$${total.toFixed(2)}</div><div class="label">Estimated Total · ~$${(total/days).toFixed(0)}/city avg</div></div>
<h3 style="margin:1.5rem 0 1rem;font-size:1rem">By Category</h3>
<div class="budget-cats">${Object.entries(byCat).filter(([,v])=>v>0).map(([k,v])=>`<div class="cat-chip">${this.catIcon(k)} ${k} <strong>$${v.toFixed(0)}</strong><div class="cat-bar"><div style="width:${total?v/total*100:0}%;background:${({transport:'#5ea0d0',stay:'#e07a4f',food:'#57a773',activity:'#9b7fd4'})[k]}"></div></div></div>`).join('')}</div>
<h3 style="margin:1.5rem 0 1rem;font-size:1rem">By City</h3>
${byCity.map(ci=>`<div class="budget-bar-container"><div class="budget-bar-label"><span>📍 ${ci.name}</span><span>$${ci.total.toFixed(2)}</span></div><div class="budget-bar"><div class="budget-bar-fill" style="width:${total?ci.total/total*100:0}%"></div></div></div>`).join('')}`;},

async renderChecklist(){const r=await(await fetch(`api.php?action=getChecklist&trip_id=${this.state.activeTripId}`)).json();const c=document.getElementById('checklist-items');if(!c)return;
const packed=r.filter(i=>i.is_packed==1).length;
c.innerHTML=`<div class="checklist-add"><input type="text" id="chk-input" placeholder="Add item..." onkeydown="if(event.key==='Enter')App.addChecklistItem()"><select id="chk-cat" style="background:var(--sand);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:0.5rem;font-size:0.85rem;min-width:120px">${CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select><button class="btn btn-primary btn-sm" onclick="App.addChecklistItem()">Add</button></div>
${r.length>0?`<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem">${packed}/${r.length} packed</p>`:''}
${r.length===0?'<div class="empty-state"><div class="emoji">🎒</div><p>Packing list is empty.</p></div>':this.groupByCategory(r)}`;},

groupByCategory(items){const groups={};items.forEach(i=>{const c=i.category||'general';if(!groups[c])groups[c]=[];groups[c].push(i);});return Object.entries(groups).map(([cat,items])=>`<div class="cat-group"><div class="cat-label">${cat.toUpperCase()}</div>${items.map(i=>`<div class="checklist-item ${i.is_packed==1?'checked':''}" onclick="App.toggleCheck(${i.id})"><div class="custom-check ${i.is_packed==1?'done':''}"></div><span class="item-text">${i.item_text}</span><button class="btn-x" onclick="event.stopPropagation();App.deleteChecklistItem(${i.id})">×</button></div>`).join('')}</div>`).join('');},

async addChecklistItem(){const i=document.getElementById('chk-input'),cat=document.getElementById('chk-cat');if(!i.value.trim())return;await fetch('api.php?action=addChecklistItem',{method:'POST',body:JSON.stringify({trip_id:this.state.activeTripId,text:i.value.trim(),category:cat.value})});this.toast('Added ✓');this.render();},
async toggleCheck(id){await fetch('api.php?action=toggleChecklist',{method:'POST',body:JSON.stringify({id})});this.render();},
async deleteChecklistItem(id){await fetch('api.php?action=deleteChecklistItem',{method:'POST',body:JSON.stringify({id})});this.render();},
async resetChecklist(){if(!this.state.activeTripId)return;if(!confirm('Unpack all items?'))return;await fetch('api.php?action=resetChecklist',{method:'POST',body:JSON.stringify({trip_id:this.state.activeTripId})});this.toast('Checklist reset');this.render();},

async renderNotes(){const r=await(await fetch(`api.php?action=getNotes&trip_id=${this.state.activeTripId}`)).json();const c=document.getElementById('notes-list');if(!c)return;c.innerHTML=r.map(n=>`<div class="note-card"><div class="flex justify-between align-center"><p>${n.note_text}</p><button class="btn-x" onclick="App.deleteNote(${n.id})">×</button></div><div class="note-date">🕐 ${new Date(n.created_at).toLocaleString()}</div></div>`).join('')||'<div class="empty-state"><div class="emoji">📝</div><p>No notes yet.</p></div>';},

async addNote(){const i=document.getElementById('note-input');if(!i.value.trim()||!this.state.activeTripId)return;await fetch('api.php?action=addNote',{method:'POST',body:JSON.stringify({trip_id:this.state.activeTripId,text:i.value.trim()})});i.value='';this.toast('Note saved! 📝');this.render();},
async deleteNote(id){await fetch('api.php?action=deleteNote',{method:'POST',body:JSON.stringify({id})});this.toast('Note deleted');this.render();},

async renderProfile(){const c=document.getElementById('profile-content');if(!c)return;
const r=await(await fetch(`api.php?action=getProfile&user_id=${this.state.userId}`)).json();
c.innerHTML=`<div class="profile-avatar">${(r.name||'U')[0].toUpperCase()}</div>
<div class="form-group"><label>Name</label><input type="text" id="prof-name" value="${r.name||''}"></div>
<div class="form-group"><label>Email</label><input type="email" value="${r.email||''}" disabled style="opacity:0.6"></div>
<button class="btn btn-primary" onclick="App.saveProfile()" style="width:100%;margin-top:0.5rem">Save Changes</button>
<hr style="margin:2rem 0;border:none;border-top:1px solid var(--border)">
<button class="btn btn-danger" onclick="App.logout()" style="width:100%">🚪 Logout</button>`;},

async saveProfile(){const name=document.getElementById('prof-name').value.trim();if(!name)return;await fetch('api.php?action=updateProfile',{method:'POST',body:JSON.stringify({user_id:this.state.userId,name})});localStorage.setItem('tr_uname',name);this.state.userName=name;this.toast('Profile updated!');this.updateAuthCorner();},

showModal(title,body,onConfirm){this.closeModal();const o=document.createElement('div');o.className='modal-overlay';o.id='app-modal';o.innerHTML=`<div class="modal"><h3>${title}</h3><div>${body}</div><div class="modal-actions"><button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="modal-confirm">Confirm</button></div></div>`;document.body.appendChild(o);o.addEventListener('click',e=>{if(e.target===o)this.closeModal()});document.getElementById('modal-confirm').addEventListener('click',onConfirm);setTimeout(()=>{const i=o.querySelector('input');if(i)i.focus()},100);},
closeModal(){const m=document.getElementById('app-modal');if(m)m.remove();},

toast(msg){const old=document.querySelector('.toast');if(old)old.remove();const e=document.createElement('div');e.className='toast';e.textContent=msg;document.body.appendChild(e);setTimeout(()=>e.remove(),3000);},
};

// Check for shared trip URL
(function(){const p=new URLSearchParams(location.search);const code=p.get('shared');if(code){fetch('api.php?action=getSharedTrip&code='+code).then(r=>r.json()).then(t=>{if(t.error)return;const c=document.getElementById('shared-content');if(c){c.innerHTML=`<div class="card card-glow" style="padding:2rem"><h2>${t.name}</h2><p class="text-muted">📅 ${t.start_date} → ${t.end_date}</p>${t.description?'<p style="margin-top:1rem">'+t.description+'</p>':''}<hr style="margin:1.5rem 0;border:none;border-top:1px solid var(--border)">${t.itinerary.map(s=>`<div style="margin-bottom:1.5rem"><h3>📍 ${s.city_name}</h3>${s.activities.map(a=>`<div class="activity-item"><span>${a.title}</span><span class="activity-cost">$${Number(a.cost||0).toFixed(2)}</span></div>`).join('')}</div>`).join('')}<div style="text-align:center;margin-top:2rem"><button class="btn btn-primary" onclick="location.href=location.pathname">← Back to Traveloop</button></div></div>`;document.querySelectorAll('.view-section').forEach(s=>s.classList.remove('active'));document.getElementById('shared').classList.add('active');}});}})();

document.addEventListener('DOMContentLoaded',()=>App.init());
