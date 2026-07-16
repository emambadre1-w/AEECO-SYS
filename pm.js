        function resetSessionCaches(){
            data.tickets=[]; data.equipment=[]; data.transactions=[]; data.invoices=[]; data.products=[]; data.suppliers=[]; data.employees=[]; data.attendance=[]; data.leaves=[]; data.payroll=[]; data.accounts=[]; data.activityLog=[]; data.stockMovements=[];
            profilesCache={}; allRequestsCache=[]; notificationsCache=[];
            prData={contacts:[],communications:[],meetings:[],tasks:[],invoices:[],bank:[]};
            pmProjects=[]; pmTasks=[]; pmMilestones=[]; pmRisks=[]; pmNotes=[]; currentProjectId=null;
        }
        async function loadPMModule() { const [p,ta,m,r,n]=await Promise.all(['pm_projects','pm_tasks','pm_milestones','pm_risks','pm_notes'].map(tbl=>supabaseClient.from(tbl).select('*').order('created_at',{ascending:false}))); pmProjects=p.data||[]; pmTasks=ta.data||[]; pmMilestones=m.data||[]; pmRisks=r.data||[]; pmNotes=n.data||[]; if(currentProjectId) renderProjectDetail(currentProjectId); else renderProjectsList(); }
        function renderProjectsList() { currentProjectId=null; document.getElementById('pmListHeader').style.display=''; const today=new Date().toISOString().split('T')[0]; const _pActive=pmProjects.filter(p=>p.status==='active').length; const _pDone=pmProjects.filter(p=>p.status==='completed').length; const _pTotal=pmProjects.length; const _hdr='<div style="margin-bottom:16px;"><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;"><div style="display:inline-flex;align-items:center;gap:6px;background:var(--surface-2);border:0.5px solid var(--border);border-radius:8px;padding:6px 12px;font-size:13px;"><span style="color:var(--text-muted);">نشط</span><strong style="color:var(--primary);">'+_pActive+'</strong></div><div style="display:inline-flex;align-items:center;gap:6px;background:var(--surface-2);border:0.5px solid var(--border);border-radius:8px;padding:6px 12px;font-size:13px;"><span style="color:var(--text-muted);">مكتمل</span><strong style="color:#1D9E75;">'+_pDone+'</strong></div><div style="display:inline-flex;align-items:center;gap:6px;background:var(--surface-2);border:0.5px solid var(--border);border-radius:8px;padding:6px 12px;font-size:13px;"><span style="color:var(--text-muted);">الإجمالي</span><strong>'+_pTotal+'</strong></div></div><input type="text" class="form-input" placeholder="ابحث عن مشروع بالاسم..." oninput="filterProjectCards(this.value)" style="max-width:320px;"></div>';  const html=pmProjects.length?_hdr+`<div class="pm-projects-grid">${pmProjects.map(p=>{const tasks=pmTasks.filter(t=>t.project_id===p.id);const done=tasks.filter(t=>t.status==='done').length;const overdue=pmMilestones.filter(m=>m.project_id===p.id&&!m.completed&&m.due_date<today).length;const fc=p.progress>=80?'success':p.progress>=40?'':'warning';const budget=p.budget?`${formatCurrency(p.spent||0)} / ${formatCurrency(p.budget)}`:'-';return`<div class="pm-project-card" data-pname="${esc((p.name||'').toLowerCase())}" onclick="renderProjectDetail('${p.id}')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;"><span class="badge ${pmStatusBadges[p.status]}">${pmStatusLabels[p.status]}</span><span class="badge ${pmPriorityBadges[p.priority]}">${pmPriorityLabels[p.priority]}</span></div><div style="font-size:16px;font-weight:700;margin-bottom:6px;">${esc(p.name)}</div>${p.client?`<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;"><i class="fas fa-building" style="margin-inline-end:4px;"></i>${esc(p.client)}</div>`:''}<div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:6px;"><span><i class="fas fa-tasks" style="margin-inline-end:4px;"></i>${done}/${tasks.length} مهمة</span><span><i class="fas fa-wallet" style="margin-inline-end:4px;"></i>${budget}</span>${p.end_date?`<span><i class="fas fa-calendar" style="margin-inline-end:4px;"></i>${p.end_date}</span>`:''} ${overdue?`<span style="color:var(--danger);"><i class="fas fa-exclamation-circle" style="margin-inline-end:4px;"></i>${overdue} معلم متأخر</span>`:''}</div><div style="font-size:12px;font-weight:600;margin-bottom:4px;display:flex;justify-content:space-between;"><span>الإنجاز</span><span style="color:var(--primary);">${p.progress}%</span></div><div class="pm-progress-bar"><div class="pm-progress-fill ${fc}" style="width:${p.progress}%"></div></div></div>`;}).join('')}</div>`:`<div style="text-align:center;padding:60px;color:var(--text-muted);"><i class="fas fa-project-diagram" style="font-size:40px;display:block;margin-bottom:16px;"></i>لا توجد مشاريع — ابدأ بإضافة مشروع جديد</div>`; document.getElementById('pmContent').innerHTML=html; }
        function renderProjectDetail(id) { currentProjectId=id; const p=pmProjects.find(x=>x.id===id); if(!p)return; const tasks=pmTasks.filter(t=>t.project_id===id); const milestones=pmMilestones.filter(m=>m.project_id===id); const risks=pmRisks.filter(r=>r.project_id===id); const notes=pmNotes.filter(n=>n.project_id===id); const today=new Date().toISOString().split('T')[0]; document.getElementById('pmListHeader').style.display='none'; document.getElementById('pmContent').innerHTML=`<div style="margin-bottom:20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;"><button class="pm-back-btn" onclick="renderProjectsList()"><i class="fas fa-arrow-right"></i></button><div><h2 style="font-size:20px;font-weight:700;">${esc(p.name)}</h2>${p.client?`<div style="font-size:13px;color:var(--text-muted);">${esc(p.client)}</div>`:''}</div><span class="badge ${pmStatusBadges[p.status]}" style="margin-inline-start:auto;">${pmStatusLabels[p.status]}</span><button class="btn btn-sm btn-secondary" onclick="editPMProgress('${p.id}',${p.progress})"><i class="fas fa-edit"></i> تحديث الإنجاز</button><button class="btn btn-sm btn-secondary" onclick="editPMProject('${p.id}')"><i class="fas fa-pen-to-square"></i> تعديل المشروع</button><button class="btn btn-sm btn-secondary" onclick="printProject('${p.id}')"><i class="fas fa-print"></i> طباعة</button><button class="btn btn-sm btn-secondary" onclick="exportProjectTasks('${p.id}')"><i class="fas fa-file-excel"></i> تصدير المهام</button>${(currentUser && (currentUser.role==='gm'||currentUser.role==='admin')) ? `<button class="btn btn-sm btn-danger" onclick="deletePMProject('${p.id}')"><i class="fas fa-trash"></i> حذف المشروع</button>` : ''}</div><div class="stats-grid" style="margin-bottom:24px;"><div class="stat-card"><div class="stat-icon primary"><i class="fas fa-tasks"></i></div><div class="stat-value">${tasks.filter(t=>t.status==='done').length}/${tasks.length}</div><div class="stat-label">المهام المنجزة</div></div><div class="stat-card"><div class="stat-icon success"><i class="fas fa-flag"></i></div><div class="stat-value">${milestones.filter(m=>m.completed).length}/${milestones.length}</div><div class="stat-label">المعالم المكتملة</div></div><div class="stat-card"><div class="stat-icon warning"><i class="fas fa-exclamation-triangle"></i></div><div class="stat-value">${risks.filter(r=>(r.status||'open')==='open').length}</div><div class="stat-label">مخاطر مفتوحة</div></div><div class="stat-card"><div class="stat-icon info"><i class="fas fa-percentage"></i></div><div class="stat-value">${p.progress}%</div><div class="stat-label">نسبة الإنجاز</div></div></div><div class="pm-progress-bar" style="height:14px;margin-bottom:24px;"><div class="pm-progress-fill ${p.progress>=80?'success':p.progress>=40?'':'warning'}" style="width:${p.progress}%"></div></div><div class="tabs" style="margin-bottom:16px;"><button class="tab active" data-pmtab="tasks">المهام (${tasks.length})</button><button class="tab" data-pmtab="gantt">الجدول الزمني</button><button class="tab" data-pmtab="milestones">المعالم (${milestones.length})</button><button class="tab" data-pmtab="risks">المخاطر (${risks.length})</button><button class="tab" data-pmtab="notes">الملاحظات (${notes.length})</button></div><div id="pmTabContent"></div>`; renderPMTab('tasks',id,tasks,milestones,risks,notes,today); document.querySelectorAll('.tab[data-pmtab]').forEach(tab=>{tab.addEventListener('click',function(){document.querySelectorAll('.tab[data-pmtab]').forEach(t=>t.classList.remove('active'));this.classList.add('active');renderPMTab(this.dataset.pmtab,id,tasks,milestones,risks,notes,today);});}); }
        function renderPMTab(tab,projId,tasks,milestones,risks,notes,today) { const addBtnMap={tasks:'pmTaskModal',milestones:'pmMilestoneModal',risks:'pmRiskModal',notes:'pmNoteModal'}; const addLabelMap={tasks:'إضافة مهمة',milestones:'إضافة معلم',risks:'إضافة خطر',notes:'إضافة ملاحظة'}; let content=''; if(tab==='tasks'){const cols={todo:[],in_progress:[],review:[],done:[]};tasks.forEach(t=>(cols[t.status]||cols.todo).push(t));content=`<div class="pm-kanban">${Object.entries(cols).map(([st,ts])=>`<div class="pm-kanban-col"><div class="pm-kanban-header"><span>${pmTaskLabels[st]}</span><span class="badge badge-info">${ts.length}</span></div>${ts.map(task=>`<div class="pm-kanban-card"><div class="pm-kanban-card-title">${esc(task.title)}</div>${(task.due_date&&task.due_date<today&&task.status!=='done')?'<div style="display:inline-block;margin-top:4px;background:#FDE8E8;color:#C0392B;border:0.5px solid #F5B7B1;border-radius:4px;padding:1px 7px;font-size:10px;font-weight:600;">⚠ متأخرة</div>':''}<div class="pm-kanban-card-meta" style="display:flex;justify-content:space-between;align-items:center;"><span class="badge ${pmPriorityBadges[task.priority]}" style="font-size:10px;">${pmPriorityLabels[task.priority]}</span>${task.due_date?`<span style="font-size:11px;color:${task.due_date<today&&task.status!=='done'?'var(--danger)':'var(--text-muted)'};">${task.due_date}</span>`:''}</div>${task.assigned_to?`<div class="pm-kanban-card-meta" style="margin-top:4px;"><i class="fas fa-user" style="margin-inline-end:4px;"></i>${esc(task.assigned_to)}</div>`:''}<button class="btn btn-sm btn-secondary" style="margin-top:6px;padding:3px 8px;font-size:11px;" onclick="editPMTask('${task.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" style="margin-top:6px;padding:3px 8px;font-size:11px;" onclick="deletePMRecord('pm_tasks','${task.id}')"><i class="fas fa-trash"></i></button></div>`).join('')}</div>`).join('')}</div>`;}
        else if(tab==='milestones'){content=`<div class="req-tracker">${milestones.map(m=>{const od=!m.completed&&m.due_date<today;return`<div class="req-tracker-step ${m.completed?'done':od?'rejected':'current'}"><div class="req-step-circle ${m.completed?'done':od?'rejected':'current'}"><i class="fas ${m.completed?'fa-check':od?'fa-exclamation':'fa-flag'}"></i></div><div class="req-step-body"><div class="req-step-name">${esc(m.title)}</div><div class="req-step-detail">${m.due_date}${od?' — <span style="color:var(--danger)">متأخر</span>':''}</div>${m.description?`<div class="req-step-detail" style="margin-top:4px;">${esc(m.description)}</div>`:''}</div><div style="margin-inline-start:auto;display:flex;gap:6px;">${!m.completed?`<button class="btn btn-sm btn-success" onclick="completeMilestone('${m.id}')"><i class="fas fa-check"></i></button>`:''}<button class="btn btn-sm btn-secondary" onclick="editPMMilestone('${m.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deletePMRecord('pm_milestones','${m.id}')"><i class="fas fa-trash"></i></button></div></div>`;}).join('')||`<div style="padding:32px;text-align:center;color:var(--text-muted);">لا توجد معالم</div>`}</div>`;}
        else if(tab==='risks'){const rs={low:1,medium:2,high:3};content=`<div class="table-container"><table><thead><tr><th>الخطر</th><th>الاحتمالية</th><th>التأثير</th><th>الدرجة</th><th>الحالة</th><th>التخفيف</th><th>الإجراء</th></tr></thead><tbody>${risks.map(r=>{const score=rs[r.probability]*rs[r.impact];const sc=score>=6?'badge-danger':score>=3?'badge-warning':'badge-success';const sb={open:'badge-danger',mitigated:'badge-warning',closed:'badge-success'}[r.status||'open'];const sa={open:'مفتوح',mitigated:'مخفّف',closed:'مغلق'}[r.status||'open'];return`<tr><td>${esc(r.title)}</td><td>${pmRiskLabels[r.probability]}</td><td>${pmRiskLabels[r.impact]}</td><td><span class="badge ${sc}" style="font-family:var(--font-mono)">${score}/9</span></td><td><span class="badge ${sb}">${sa}</span></td><td style="font-size:12px;">${esc(r.mitigation||'-')}</td><td><button class="btn btn-sm btn-secondary" onclick="editPMRisk('${r.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deletePMRecord('pm_risks','${r.id}')"><i class="fas fa-trash"></i></button></td></tr>`;}).join('')||`<tr><td colspan="7" style="text-align:center;padding:24px;">لا توجد مخاطر</td></tr>`}</tbody></table></div>`;}
        else if(tab==='notes'){const typeAr={note:'ملاحظة',report:'تقرير',meeting:'اجتماع',issue:'مشكلة'};const typeBadge={note:'badge-info',report:'badge-primary',meeting:'badge-success',issue:'badge-danger'};content=`<div style="display:flex;flex-direction:column;gap:12px;">${notes.map(n=>`<div class="card" style="border-inline-start:3px solid var(--primary);"><div class="card-body" style="padding:14px;"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span class="badge ${typeBadge[n.type]}">${typeAr[n.type]}</span><span style="font-size:11px;color:var(--text-muted);">${formatDateTime(n.created_at)}</span></div><div style="font-size:13px;line-height:1.7;white-space:pre-wrap;">${esc(n.content)}</div><button class="btn btn-sm btn-secondary" style="margin-top:8px;" onclick="editPMNote('${n.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" style="margin-top:8px;" onclick="deletePMRecord('pm_notes','${n.id}')"><i class="fas fa-trash"></i></button></div></div>`).join('')||`<div style="padding:32px;text-align:center;color:var(--text-muted);">لا توجد ملاحظات</div>`}</div>`;}
        if(tab==='gantt'){content=renderGanttChart(tasks);} var _addBtn=addBtnMap[tab]?`<div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><button class="btn btn-primary btn-sm" onclick="openPMModal('${addBtnMap[tab]}')"><i class="fas fa-plus"></i> ${addLabelMap[tab]}</button></div>`:''; document.getElementById('pmTabContent').innerHTML=_addBtn+content; }
        async function savePMProject() { const btn=document.getElementById('pmProjSaveBtn'); btn.disabled=true; const editId=document.getElementById('pmProjId').value; const payload={name:document.getElementById('pmProjName').value.trim(),description:document.getElementById('pmProjDesc').value.trim()||null,status:document.getElementById('pmProjStatus').value,priority:document.getElementById('pmProjPriority').value,project_type:document.getElementById('pmProjType').value||null,capacity_mw:parseFloat(document.getElementById('pmProjCapacity').value)||null,location:document.getElementById('pmProjLocation').value.trim()||null,start_date:document.getElementById('pmProjStart').value||null,end_date:document.getElementById('pmProjEnd').value||null,budget:parseFloat(document.getElementById('pmProjBudget').value)||null,client:document.getElementById('pmProjClient').value.trim()||null,progress:parseInt(document.getElementById('pmProjProgress').value)||0,created_by:currentUser.id}; if(!payload.name){showToast('warning',t('fillRequired'),'');btn.disabled=false;return;} let error; if(editId){({error}=await supabaseClient.from('pm_projects').update(payload).eq('id',editId));}else{({error}=await supabaseClient.from('pm_projects').insert(payload));} btn.disabled=false; if(error){showToast('error','Error',error.message);return;} closeModal('pmProjectModal'); showToast('success','تم إنشاء المشروع',payload.name); await loadPMModule(); }
        async function savePMTask() { if(!currentProjectId)return; const editId=document.getElementById('pmTaskId').value; const payload={project_id:currentProjectId,title:document.getElementById('pmTaskTitle').value.trim(),description:document.getElementById('pmTaskDesc').value.trim()||null,status:document.getElementById('pmTaskStatus').value,priority:document.getElementById('pmTaskPriority').value,assigned_to:document.getElementById('pmTaskAssigned').value.trim()||null,due_date:document.getElementById('pmTaskDue').value||null,start_date:document.getElementById('pmTaskStart').value||null,progress:Math.max(0,Math.min(100,parseInt(document.getElementById('pmTaskProgress').value,10)||0)),estimated_hours:parseFloat(document.getElementById('pmTaskEstHours').value)||null,actual_hours:parseFloat(document.getElementById('pmTaskActHours').value)||null,created_by:currentUser.id}; if(!payload.title){showToast('warning',t('fillRequired'),'');return;} let error; if(editId){({error}=await supabaseClient.from('pm_tasks').update(payload).eq('id',editId));}else{({error}=await supabaseClient.from('pm_tasks').insert(payload));} if(error){showToast('error','Error',error.message);return;} closeModal('pmTaskModal'); showToast('success','تم إضافة المهمة',payload.title); await loadPMModule(); }
        async function savePMMilestone() { if(!currentProjectId)return; const editId=document.getElementById('pmMsId').value; const payload={project_id:currentProjectId,title:document.getElementById('pmMsTitle').value.trim(),description:document.getElementById('pmMsDesc').value.trim()||null,due_date:document.getElementById('pmMsDue').value,created_by:currentUser.id}; if(!payload.title||!payload.due_date){showToast('warning',t('fillRequired'),'');return;} let error; if(editId){({error}=await supabaseClient.from('pm_milestones').update(payload).eq('id',editId));}else{({error}=await supabaseClient.from('pm_milestones').insert(payload));} if(error){showToast('error','Error',error.message);return;} closeModal('pmMilestoneModal'); showToast('success','تم إضافة المعلم',payload.title); await loadPMModule(); }
        async function savePMRisk() { if(!currentProjectId)return; const editId=document.getElementById('pmRiskId').value; const payload={project_id:currentProjectId,title:document.getElementById('pmRiskTitle').value.trim(),probability:document.getElementById('pmRiskProb').value,impact:document.getElementById('pmRiskImpact').value,mitigation:document.getElementById('pmRiskMitigation').value.trim()||null,created_by:currentUser.id}; if(!payload.title){showToast('warning',t('fillRequired'),'');return;} let error; if(editId){({error}=await supabaseClient.from('pm_risks').update(payload).eq('id',editId));}else{({error}=await supabaseClient.from('pm_risks').insert(payload));} if(error){showToast('error','Error',error.message);return;} closeModal('pmRiskModal'); showToast('success','تم إضافة الخطر',payload.title); await loadPMModule(); }
        async function savePMNote() { if(!currentProjectId)return; const editId=document.getElementById('pmNoteId').value; const payload={project_id:currentProjectId,content:document.getElementById('pmNoteContent').value.trim(),type:document.getElementById('pmNoteType').value,created_by:currentUser.id}; if(!payload.content){showToast('warning',t('fillRequired'),'');return;} let error; if(editId){({error}=await supabaseClient.from('pm_notes').update(payload).eq('id',editId));}else{({error}=await supabaseClient.from('pm_notes').insert(payload));} if(error){showToast('error','Error',error.message);return;} closeModal('pmNoteModal'); showToast('success','تم الحفظ',''); await loadPMModule(); }
        function editPMProject(id) { const r=pmProjects.find(x=>x.id===id); if(!r)return; openPMModal('pmProjectModal'); document.getElementById('pmProjId').value=r.id; document.getElementById('pmProjName').value=r.name||''; document.getElementById('pmProjDesc').value=r.description||''; document.getElementById('pmProjStatus').value=r.status||''; document.getElementById('pmProjPriority').value=r.priority||''; document.getElementById('pmProjType').value=r.project_type||''; document.getElementById('pmProjCapacity').value=(r.capacity_mw!=null?r.capacity_mw:''); document.getElementById('pmProjLocation').value=r.location||''; document.getElementById('pmProjStart').value=r.start_date||''; document.getElementById('pmProjEnd').value=r.end_date||''; document.getElementById('pmProjBudget').value=(r.budget!=null?r.budget:''); document.getElementById('pmProjClient').value=r.client||''; document.getElementById('pmProjProgress').value=(r.progress!=null?r.progress:0); }
        function editPMTask(id) { const r=pmTasks.find(x=>x.id===id); if(!r)return; openPMModal('pmTaskModal'); document.getElementById('pmTaskId').value=r.id; document.getElementById('pmTaskTitle').value=r.title||''; document.getElementById('pmTaskDesc').value=r.description||''; document.getElementById('pmTaskStatus').value=r.status||''; document.getElementById('pmTaskPriority').value=r.priority||''; document.getElementById('pmTaskAssigned').value=r.assigned_to||''; document.getElementById('pmTaskDue').value=r.due_date||'';document.getElementById('pmTaskStart').value=r.start_date||'';document.getElementById('pmTaskProgress').value=(r.progress!=null?r.progress:0); document.getElementById('pmTaskEstHours').value=(r.estimated_hours!=null?r.estimated_hours:''); document.getElementById('pmTaskActHours').value=(r.actual_hours!=null?r.actual_hours:''); }
        function editPMMilestone(id) { const r=pmMilestones.find(x=>x.id===id); if(!r)return; openPMModal('pmMilestoneModal'); document.getElementById('pmMsId').value=r.id; document.getElementById('pmMsTitle').value=r.title||''; document.getElementById('pmMsDesc').value=r.description||''; document.getElementById('pmMsDue').value=r.due_date||''; }
        function editPMRisk(id) { const r=pmRisks.find(x=>x.id===id); if(!r)return; openPMModal('pmRiskModal'); document.getElementById('pmRiskId').value=r.id; document.getElementById('pmRiskTitle').value=r.title||''; document.getElementById('pmRiskProb').value=r.probability||''; document.getElementById('pmRiskImpact').value=r.impact||''; document.getElementById('pmRiskMitigation').value=r.mitigation||''; }
        function editPMNote(id) { const r=pmNotes.find(x=>x.id===id); if(!r)return; openPMModal('pmNoteModal'); document.getElementById('pmNoteId').value=r.id; document.getElementById('pmNoteContent').value=r.content||''; document.getElementById('pmNoteType').value=r.type||''; }
        async function completeMilestone(id) { const{error}=await supabaseClient.from('pm_milestones').update({completed:true,completed_at:new Date().toISOString()}).eq('id',id); if(error){showToast('error','Error',error.message);return;} showToast('success','تم إكمال المعلم',''); await loadPMModule(); }
        async function editPMProgress(id,current) { const val=prompt('نسبة الإنجاز الجديدة (0-100):',current); if(val===null)return; const n=Math.max(0,Math.min(100,parseInt(val)||0)); const{error}=await supabaseClient.from('pm_projects').update({progress:n}).eq('id',id); if(error){showToast('error','Error',error.message);return;} showToast('success','تم تحديث الإنجاز',n+'%'); await loadPMModule(); }
        function pmRoleDashboard(income,expenses) { const active=pmProjects.filter(p=>p.status==='active').length; const today=new Date().toISOString().split('T')[0]; const overdueTasks=pmTasks.filter(t=>t.status!=='done'&&t.due_date&&t.due_date<today).length; const openRisks=pmRisks.filter(r=>r.status==='open').length; return `<div class="role-stats">${roleStatCard(pmProjects.length,'إجمالي المشاريع','fa-project-diagram','primary')}${roleStatCard(active,'مشاريع نشطة','fa-play-circle','success')}${roleStatCard(overdueTasks,'مهام متأخرة','fa-exclamation-circle','danger')}${roleStatCard(openRisks,'مخاطر مفتوحة','fa-shield-alt','warning')}</div><div class="card"><div class="card-header"><h3 class="card-title">المشاريع الحالية</h3><button class="btn btn-sm btn-secondary" onclick="navigateTo('pm')">عرض الكل</button></div><div class="card-body"><div class="table-container"><table><thead><tr><th>المشروع</th><th>الحالة</th><th>الإنجاز</th><th>تاريخ الانتهاء</th></tr></thead><tbody>${pmProjects.slice(0,6).map(p=>`<tr><td><strong>${esc(p.name)}</strong>${p.client?`<div style="font-size:11px;color:var(--text-muted);">${esc(p.client)}</div>`:''}</td><td><span class="badge ${pmStatusBadges[p.status]}">${pmStatusLabels[p.status]}</span></td><td><div style="display:flex;align-items:center;gap:8px;"><div class="pm-progress-bar" style="width:80px;"><div class="pm-progress-fill" style="width:${p.progress}%"></div></div><span style="font-size:12px;font-weight:600;">${p.progress}%</span></div></td><td>${p.end_date||'-'}</td></tr>`).join('')||`<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted);">لا توجد مشاريع</td></tr>`}</tbody></table></div></div></div>`; }
        function exportExcel(type) {
            if (type === 'all' && (!currentUser || !['gm','admin'].includes(currentUser.role))) { showToast('error', t('accessDenied'), t('accessDeniedMsg')); return; }
            if (typeof XLSX === 'undefined') { showToast('error', 'خطأ', 'مكتبة Excel غير محمّلة، انتظر ثانية وأعد المحاولة'); return; }
            const wb = XLSX.utils.book_new();
            const addSheet = (name, rows) => { if (!rows || !rows.length) { XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['لا توجد بيانات']]), name); return; } XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name); };
            const empName = id => (data.employees || []).find(e => e.id === id)?.name || '';
            const all = type === 'all';
            const now = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');
            if (all || type === 'tickets') addSheet('تذاكر الدعم', (data.tickets || []).map(t => ({ 'الرقم': (t.id || '').slice(-6).toUpperCase(), 'العنوان': t.title, 'الأولوية': t.priority, 'الفئة': t.category, 'الحالة': t.status, 'التاريخ': t.createdAt })));
            if (all || type === 'transactions') addSheet('المعاملات', (data.transactions || []).map(t => ({ 'النوع': t.type === 'income' ? 'إيراد' : 'مصروف', 'المبلغ': t.amount, 'الوصف': t.description, 'الفئة': t.category, 'التاريخ': t.date })));
            if (all || type === 'invoices') addSheet('الفواتير', (data.invoices || []).map(i => ({ 'الرقم': i.number, 'العميل': i.client, 'المبلغ': i.amount, 'الحالة': i.status, 'التاريخ': i.date })));
            if (all || type === 'accounts') addSheet('الحسابات', (data.accounts || []).map(a => ({ 'الرقم': a.number, 'الاسم': a.name, 'النوع': a.type, 'الرصيد': a.balance })));
            if (all || type === 'products') addSheet('المنتجات', (data.products || []).map(p => ({ 'الكود': p.sku, 'الاسم': p.name, 'الفئة': p.category, 'المخزون': p.stock, 'سعر التكلفة': p.costPrice, 'سعر البيع': p.sellingPrice })));
            if (all || type === 'suppliers') addSheet('الموردين', (data.suppliers || []).map(s => ({ 'الاسم': s.name, 'جهة الاتصال': s.contact, 'الهاتف': s.phone, 'البريد': s.email, 'العنوان': s.address })));
            if (all || type === 'stock') addSheet('حركة المخزون', (data.stockMovements || []).map(m => ({ 'المنتج': (data.products || []).find(p => p.id === m.productId)?.name || '', 'النوع': m.type, 'الكمية': m.quantity, 'ملاحظات': m.notes, 'التاريخ': m.date })));
            if (all || type === 'employees') addSheet('الموظفين', (data.employees || []).map(e => ({ 'الرقم': e.empId, 'الاسم': e.name, 'المسمى': e.position, 'القسم': e.department, 'الهاتف': e.phone, 'البريد': e.email, 'الراتب': e.salary, 'تاريخ التعيين': e.hireDate })));
            if (all || type === 'attendance') addSheet('الحضور', (data.attendance || []).map(a => ({ 'الموظف': empName(a.employeeId), 'الدخول': a.checkIn, 'الخروج': a.checkOut, 'التاريخ': a.date })));
            if (all || type === 'leaves') addSheet('الإجازات', (data.leaves || []).map(l => ({ 'الموظف': empName(l.employeeId), 'النوع': l.type, 'من': l.fromDate, 'إلى': l.toDate, 'الحالة': l.status, 'السبب': l.reason })));
            if (all || type === 'payroll') addSheet('الرواتب', (data.payroll || []).map(p => ({ 'الموظف': empName(p.employeeId), 'الشهر': p.month, 'الأساسي': p.basic, 'الاستقطاع': p.deductions, 'الصافي': p.net })));
            if (all || type === 'requests') addSheet('طلبات الموظفين', (allRequestsCache || []).map(r => ({ 'العنوان': r.title, 'النوع': r.type, 'المبلغ': r.amount || '', 'الحالة': r.status, 'المرحلة': r.current_stage || 'مكتمل', 'التاريخ': r.created_at })));
            if (all || type === 'pr') addSheet('جهات العلاقات العامة', ((typeof prData !== 'undefined' && prData.contacts) || []).map(c => ({ 'الاسم': c.name, 'المؤسسة': c.organization || '', 'الهاتف': c.phone || '', 'البريد': c.email || '' })));
            if (all || type === 'pm') addSheet('المشاريع', ((typeof pmProjects !== 'undefined' && pmProjects) || []).map(p => ({ 'المشروع': p.name, 'العميل': p.client, 'الحالة': p.status, 'الإنجاز': p.progress, 'تاريخ الانتهاء': p.end_date })));
            if ((all || type === 'activity') && currentUser && ['gm','admin'].includes(currentUser.role)) addSheet('سجل النشاط', (data.activityLog || []).map(a => ({ 'القسم': a.module, 'الإجراء': a.action, 'العنصر': a.itemName, 'المستخدم': a.actor, 'التاريخ': a.timestamp })));
            if (all) {
                addSheet('المعدات', (data.equipment || []).map(e => ({ 'رقم الأصل': e.assetId, 'الاسم': e.name, 'الفئة': e.category, 'مخصصة لـ': e.assignedTo || '', 'الموقع': e.location || '', 'الحالة': e.status })));
                const kd = (typeof kitchenData !== 'undefined' && kitchenData) || {};
                addSheet('المطبخ-الأصناف', (kd.items || []).map(i => ({ 'الصنف': i.name, 'الوحدة': i.unit || '', 'الكمية': i.quantity, 'حد التنبيه': i.min_quantity || '' })));
                addSheet('المطبخ-الحركة', (kd.movements || []).map(m => ({ 'الصنف': ((kd.items||[]).find(x => x.id === m.item_id) || {}).name || '', 'النوع': m.movement_type, 'الكمية': m.quantity, 'التاريخ': m.movement_date })));
                addSheet('المطبخ-المصروفات', (kd.expenses || []).map(x => ({ 'الوصف': x.description, 'المبلغ': x.amount, 'التاريخ': x.expense_date })));
                addSheet('المطبخ-الفواتير', (kd.invoices || []).map(v => ({ 'الرقم': v.invoice_number || '', 'المورد': v.supplier_name || '', 'المبلغ': v.amount, 'الحالة': v.status || '', 'التاريخ': v.date })));
                addSheet('المطبخ-إشعارات بنكية', (kd.bank || []).map(b => ({ 'الوصف': b.description || '', 'المبلغ': b.amount, 'التاريخ': b.date })));
                const sd = (typeof secretaryData !== 'undefined' && secretaryData) || {};
                addSheet('السكرتارية-الخطابات', (sd.correspondence || []).map(c => ({ 'الرقم': c.ref_number || '', 'الاتجاه': c.direction === 'incoming' ? 'وارد' : 'صادر', 'الجهة': c.party || '', 'الموضوع': c.subject || '', 'التاريخ': c.corr_date })));
                addSheet('السكرتارية-المواعيد', (sd.appointments || []).map(a => ({ 'العنوان': a.title, 'مع': a.with_party || '', 'التاريخ': a.appt_date, 'الوقت': a.appt_time || '', 'الحالة': a.status || '' })));
                const pd = (typeof prData !== 'undefined' && prData) || {};
                addSheet('ع.عامة-التواصل', (pd.communications || []).map(c => ({ 'الجهة': ((pd.contacts||[]).find(x => x.id === c.contact_id) || {}).name || c.party || '', 'النوع': c.type || '', 'الموضوع': c.subject || '', 'التاريخ': c.date })));
                addSheet('ع.عامة-الاجتماعات', (pd.meetings || []).map(m => ({ 'العنوان': m.title, 'مع': m.with_party || '', 'التاريخ': m.date, 'الحالة': m.status || '' })));
                addSheet('ع.عامة-المهام', (pd.tasks || []).map(k => ({ 'المهمة': k.title, 'الحالة': k.status || '', 'الاستحقاق': k.due_date || '' })));
                addSheet('ع.عامة-الفواتير', (pd.invoices || []).map(v => ({ 'الرقم': v.invoice_number || '', 'الجهة': v.party || '', 'المبلغ': v.amount, 'الحالة': v.status || '', 'التاريخ': v.date })));
                addSheet('ع.عامة-إشعارات بنكية', (pd.bank || []).map(b => ({ 'الوصف': b.description || '', 'المبلغ': b.amount, 'التاريخ': b.date })));
                addSheet('المشاريع-المهام', ((typeof pmTasks !== 'undefined' && pmTasks) || []).map(k => ({ 'المشروع': (((typeof pmProjects !== 'undefined' && pmProjects) || []).find(p => p.id === k.project_id) || {}).name || '', 'المهمة': k.title, 'الحالة': k.status, 'البداية': k.start_date || '', 'الاستحقاق': k.due_date || '' })));
                addSheet('المشاريع-المعالم', ((typeof pmMilestones !== 'undefined' && pmMilestones) || []).map(m => ({ 'المشروع': (((typeof pmProjects !== 'undefined' && pmProjects) || []).find(p => p.id === m.project_id) || {}).name || '', 'المعلم': m.title, 'الاستحقاق': m.due_date || '', 'مكتمل': m.completed ? 'نعم' : 'لا' })));
                addSheet('المشاريع-المخاطر', ((typeof pmRisks !== 'undefined' && pmRisks) || []).map(r => ({ 'المشروع': (((typeof pmProjects !== 'undefined' && pmProjects) || []).find(p => p.id === r.project_id) || {}).name || '', 'الخطر': r.title, 'الاحتمال': r.likelihood || '', 'الأثر': r.impact || '' })));
                addSheet('كتالوج الأسعار', ((typeof priceCatalogItems !== 'undefined' && priceCatalogItems) || []).map(i => ({ 'الصنف': i.item_name, 'الكود': i.item_code || '', 'الوضع': i.pricing_mode === 'import' ? 'استيراد' : 'بسيط' })));
            }
            const fn = all ? `تقرير_شامل_${now}.xlsx` : `${type}_${now}.xlsx`;
            XLSX.writeFile(wb, fn);
            showToast('success', 'تم التصدير', fn);
        }
        function printReport(type) { const company=data.settings?.companyName||'شركتي'; const now=new Date().toLocaleDateString('ar-SA'); let title='',tableHTML=''; if(type==='financial'){const inc=(data.transactions||[]).filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);const exp=(data.transactions||[]).filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);title='التقرير المالي';tableHTML=`<table border="1" cellpadding="8" width="100%"><thead><tr style="background:#f0f0f0"><th>النوع</th><th>الوصف</th><th>الفئة</th><th>المبلغ</th><th>التاريخ</th></tr></thead><tbody>${(data.transactions||[]).map(t=>`<tr><td>${t.type==='income'?'إيراد':'مصروف'}</td><td>${esc(t.description)}</td><td>${esc(t.category)}</td><td>${t.amount.toLocaleString()}</td><td>${t.date}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="3"><b>إجمالي الإيرادات</b></td><td colspan="2"><b>${inc.toLocaleString()}</b></td></tr><tr><td colspan="3"><b>إجمالي المصروفات</b></td><td colspan="2"><b>${exp.toLocaleString()}</b></td></tr><tr><td colspan="3"><b>الرصيد الصافي</b></td><td colspan="2" style="color:${inc-exp>=0?'green':'red'}"><b>${(inc-exp).toLocaleString()}</b></td></tr></tfoot></table>`;}
        else if(type==='tickets'){title='تقرير الدعم الفني';tableHTML=`<table border="1" cellpadding="8" width="100%"><thead><tr style="background:#f0f0f0"><th>العنوان</th><th>الأولوية</th><th>الفئة</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>${(data.tickets||[]).map(t=>`<tr><td>${esc(t.title)}</td><td>${esc(t.priority)}</td><td>${esc(t.category)}</td><td>${esc(t.status)}</td><td>${new Date(t.createdAt).toLocaleDateString('ar-SA')}</td></tr>`).join('')}</tbody></table>`;}
        else if(type==='employees'){title='تقرير الموظفين';tableHTML=`<table border="1" cellpadding="8" width="100%"><thead><tr style="background:#f0f0f0"><th>الاسم</th><th>المسمى</th><th>القسم</th><th>الهاتف</th><th>الراتب</th></tr></thead><tbody>${(data.employees||[]).map(e=>`<tr><td>${esc(e.name)}</td><td>${esc(e.position)}</td><td>${esc(e.department)}</td><td>${esc(e.phone)}</td><td>${e.salary?.toLocaleString()||'-'}</td></tr>`).join('')}</tbody></table>`;}
        else if(type==='inventory'){title='تقرير المخزون';tableHTML=`<table border="1" cellpadding="8" width="100%"><thead><tr style="background:#f0f0f0"><th>الكود</th><th>المنتج</th><th>الفئة</th><th>المخزون</th><th>سعر البيع</th></tr></thead><tbody>${(data.products||[]).map(p=>`<tr style="${p.stock<=5?'color:red':''}"><td>${esc(p.sku)}</td><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${p.stock}</td><td>${p.sellingPrice?.toLocaleString()||'-'}</td></tr>`).join('')}</tbody></table>`;}
        else if(type==='requests'){title='تقرير طلبات الموظفين';tableHTML=`<table border="1" cellpadding="8" width="100%"><thead><tr style="background:#f0f0f0"><th>العنوان</th><th>النوع</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>${allRequestsCache.map(r=>`<tr><td>${esc(r.title)}</td><td>${esc(r.type)}</td><td>${r.amount||'-'}</td><td>${esc(r.status)}</td><td>${new Date(r.created_at).toLocaleDateString('ar-SA')}</td></tr>`).join('')}</tbody></table>`;}
        else if(type==='projects'){title='تقرير المشاريع';tableHTML=`<table border="1" cellpadding="8" width="100%"><thead><tr style="background:#f0f0f0"><th>المشروع</th><th>العميل</th><th>الحالة</th><th>الإنجاز</th><th>تاريخ الانتهاء</th><th>الميزانية</th></tr></thead><tbody>${pmProjects.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.client||'-')}</td><td>${esc(pmStatusLabels[p.status])}</td><td>${p.progress}%</td><td>${p.end_date||'-'}</td><td>${p.budget?.toLocaleString()||'-'}</td></tr>`).join('')}</tbody></table>`;}
        const win=window.open('','_blank'); win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:30px;direction:rtl;}table{border-collapse:collapse;width:100%;}th,td{padding:8px 12px;font-size:13px;border:1px solid #ccc;text-align:right;}th{background:#f0f0f0;}tr:nth-child(even){background:#fafafa;}.footer{margin-top:30px;font-size:11px;color:#999;text-align:center;}@media print{button{display:none!important;}}</style></head><body><h2>${title}</h2><p style="color:#666;">${esc(company)} — ${now}</p>${tableHTML}<div class="footer">تم الإنشاء بواسطة نظام ${esc(company)}</div><br><button onclick="window.print()" style="padding:10px 20px;font-size:14px;cursor:pointer;">🖨️ طباعة / حفظ PDF</button></body></html>`); win.document.close(); }
        function renderGanttChart(tasks){
            var dated = tasks.filter(function(t){ return t.start_date && t.due_date; });
            var undated = tasks.filter(function(t){ return !(t.start_date && t.due_date); });
            if(dated.length===0){
                return '<div style="padding:32px;text-align:center;color:var(--text-muted);line-height:1.8;">لا توجد مهام لها تاريخ بداية ونهاية بعد.<br>أضف «تاريخ البداية» و«تاريخ الاستحقاق» لأي مهمة لتظهر في الجدول الزمني.</div>';
            }
            var parse = function(d){ return new Date(d + 'T00:00:00').getTime(); };
            var minT = Math.min.apply(null, dated.map(function(t){ return parse(t.start_date); }));
            var maxT = Math.max.apply(null, dated.map(function(t){ return parse(t.due_date); }));
            if(maxT <= minT){ maxT = minT + 86400000; }
            var span = maxT - minT;
            var todayT = parse(new Date().toISOString().split('T')[0]);
            var todayPct = (todayT >= minT && todayT <= maxT) ? ((todayT - minT) / span * 100) : null;
            var COLORS = {
                done:        {bar:'#1D9E75', tint:'#E1F5EE'},
                in_progress: {bar:'#378ADD', tint:'#E6F1FB'},
                review:      {bar:'#EF9F27', tint:'#FAEEDA'},
                todo:        {bar:'#B4B2A9', tint:'#F1EFE8'}
            };
            var STATUS_AR = {done:'مكتمل', in_progress:'جاري', review:'مراجعة', todo:'للتنفيذ'};
            var fmt = function(t){ var d = new Date(t); return d.getDate() + '/' + (d.getMonth()+1); };
            var marks = '';
            for(var k=0; k<=4; k++){
                var pct = k*25;
                var mt = minT + span*(k/4);
                marks += '<div style="position:absolute;left:'+pct+'%;transform:translateX(-50%);font-size:11px;color:var(--text-muted);white-space:nowrap;">'+fmt(mt)+'</div>';
            }
            var legend = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:var(--text-secondary);">'
                + Object.keys(COLORS).map(function(st){ return '<span style="display:flex;align-items:center;gap:5px;"><span style="width:11px;height:11px;border-radius:2px;background:'+COLORS[st].bar+';"></span>'+STATUS_AR[st]+'</span>'; }).join('')
                + '</div>';
            dated.sort(function(a,b){ return parse(a.start_date) - parse(b.start_date); });
            var grid = '<div style="position:absolute;top:0;bottom:0;left:25%;width:0;border-left:0.5px dashed var(--border);"></div><div style="position:absolute;top:0;bottom:0;left:50%;width:0;border-left:0.5px dashed var(--border);"></div><div style="position:absolute;top:0;bottom:0;left:75%;width:0;border-left:0.5px dashed var(--border);"></div>';
            var rows = dated.map(function(t){
                var st = COLORS[t.status] || COLORS.todo;
                var s = parse(t.start_date);
                var e = parse(t.due_date);
                if(e < s){ e = s; }
                var left = (s - minT) / span * 100;
                var width = Math.max(1.5, (e - s) / span * 100);
                var prog = Math.max(0, Math.min(100, (t.progress != null ? t.progress : 0)));
                var fill = prog > 0 ? '<div style="position:absolute;top:0;bottom:0;right:0;width:'+prog+'%;background:'+st.bar+';border-radius:5px;"></div>' : '';
                var lbl = '<span style="position:absolute;top:50%;left:6px;transform:translateY(-50%);font-size:10px;font-weight:500;color:'+(prog>0?'#fff':'#5F5E5A')+';z-index:2;">'+prog+'%</span>';
                var todayLine = todayPct != null ? '<div style="position:absolute;top:0;bottom:0;left:'+todayPct+'%;width:0;border-left:1.5px solid #E24B4A;z-index:3;"></div>' : '';
                return '<div style="display:flex;align-items:center;border-bottom:0.5px solid var(--border);min-height:40px;">'
                    + '<div style="width:170px;flex-shrink:0;padding:6px 10px;font-size:12px;color:var(--text-primary);border-left:0.5px solid var(--border);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+esc(t.title)+'">'+esc(t.title)+'</div>'
                    + '<div style="flex:1;position:relative;height:40px;">'+grid+todayLine
                    + '<div style="position:absolute;top:50%;transform:translateY(-50%);left:'+left+'%;width:'+width+'%;height:20px;background:'+st.tint+';border:0.5px solid '+st.bar+';border-radius:6px;">'+fill+lbl+'</div>'
                    + '</div></div>';
            }).join('');
            var undatedNote = undated.length > 0 ? '<div style="margin-top:12px;padding:10px 12px;font-size:12px;color:var(--text-secondary);background:var(--surface-1);border-radius:8px;">'+undated.length+' مهمة بدون تواريخ كاملة (لا تظهر في الجدول الزمني). أضف لها تاريخ بداية ونهاية.</div>' : '';
            return legend
                + '<div style="overflow-x:auto;"><div style="min-width:520px;border:0.5px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface-2);">'
                + '<div style="display:flex;border-bottom:0.5px solid var(--border);background:var(--surface-1);"><div style="width:170px;flex-shrink:0;padding:8px 10px;font-size:12px;color:var(--text-secondary);border-left:0.5px solid var(--border);">المهمة</div><div style="flex:1;position:relative;height:32px;">'+marks+'</div></div>'
                + rows
                + '</div></div>'
                + '<div style="font-size:11px;color:var(--text-muted);margin-top:8px;text-align:center;">الخط الأحمر = اليوم · النسبة داخل الشريط = نسبة الإنجاز</div>'
                + undatedNote;
        }
        async function deletePMProject(id){
            if(!(await confirmStyled('هل أنت متأكد من حذف هذا المشروع وكل ما يتبعه (المهام والمعالم والمخاطر والملاحظات)؟ لا يمكن التراجع عن هذا الإجراء.', {type:'danger'})))return;
            try{
                await supabaseClient.from('pm_tasks').delete().eq('project_id',id);
                await supabaseClient.from('pm_milestones').delete().eq('project_id',id);
                await supabaseClient.from('pm_risks').delete().eq('project_id',id);
                await supabaseClient.from('pm_notes').delete().eq('project_id',id);
            }catch(e){}
            const{error}=await supabaseClient.from('pm_projects').delete().eq('id',id);
            if(error){showToast('error','Error',error.message);return;}
            showToast('success','تم حذف المشروع','');
            currentProjectId=null;
            await loadPMModule();
        }
        function printProject(id){
            const p = pmProjects.find(x=>String(x.id)===String(id));
            if(!p) return;
            const company = 'شركة الوطنية للطاقة والهندسة المحدودة';
            const now = new Date().toLocaleDateString('ar-SA');
            const logo = AEECO_INVOICE_LOGO;
            const tasks = pmTasks.filter(t=>t.project_id===id);
            const taskRows = tasks.length ? tasks.map(t=>`<tr><td>${esc(t.title)}</td><td>${pmTaskLabels[t.status]||t.status}</td><td>${pmPriorityLabels[t.priority]||t.priority||''}</td><td>${esc(t.assigned_to||'')}</td><td>${t.start_date||''}</td><td>${t.due_date||''}</td><td>${(t.progress!=null?t.progress:0)}%</td></tr>`).join('') : '<tr><td colspan="7">لا توجد مهام</td></tr>';
            const win = window.open('', '_blank');
            if(!win){ showToast('error','تعذّر فتح نافذة الطباعة','اسمح بالنوافذ المنبثقة لهذا الموقع'); return; }
            win.document.write(`<html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(p.name)}</title><style>${_prPrintCSS()}</style></head><body><div class="head">${logo?`<img src="${logo}">`:''}<div class="doc">تقرير مشروع</div></div><table><tr><th>المشروع</th><td>${esc(p.name)}</td></tr><tr><th>العميل</th><td>${esc(p.client||'-')}</td></tr><tr><th>الحالة</th><td>${pmStatusLabels[p.status]||p.status}</td></tr><tr><th>الأولوية</th><td>${pmPriorityLabels[p.priority]||p.priority||''}</td></tr><tr><th>تاريخ البداية</th><td>${p.start_date||'-'}</td></tr><tr><th>تاريخ النهاية</th><td>${p.end_date||'-'}</td></tr><tr><th>نسبة الإنجاز</th><td>${p.progress}%</td></tr></table><h3 style="margin-top:18px;">المهام (${tasks.length})</h3><table><tr><th>المهمة</th><th>الحالة</th><th>الأولوية</th><th>المكلّف</th><th>البداية</th><th>النهاية</th><th>الإنجاز</th></tr>${taskRows}</table><div class="footer">طُبع من نظام ${esc(company)} — ${now}</div><br><button onclick="window.print()" style="padding:10px 20px;font-size:14px;cursor:pointer">🖨️ طباعة / حفظ PDF</button></body></html>`);
            win.document.close();
        }
        function exportProjectTasks(id){
            if(typeof XLSX==='undefined'){ showToast('error','خطأ','مكتبة Excel غير محمّلة، انتظر ثانية وأعد المحاولة'); return; }
            const p = pmProjects.find(x=>String(x.id)===String(id));
            if(!p) return;
            const tasks = pmTasks.filter(t=>t.project_id===id);
            const rows = tasks.map(t=>({ 'المهمة':t.title, 'الحالة':pmTaskLabels[t.status]||t.status, 'الأولوية':pmPriorityLabels[t.priority]||t.priority||'', 'المكلّف':t.assigned_to||'', 'تاريخ البداية':t.start_date||'', 'تاريخ النهاية':t.due_date||'', 'نسبة الإنجاز %':(t.progress!=null?t.progress:0) }));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length?rows:[{'المهمة':'لا توجد مهام'}]), 'المهام');
            const now = new Date().toISOString().split('T')[0];
            const safe = (p.name||'مشروع').replace(/[\/\\:*?"<>|]/g,'').trim() || 'مشروع';
            const fn = `مهام_${safe}_${now}.xlsx`;
            XLSX.writeFile(wb, fn);
            showToast('success','تم التصدير',fn);
        }
        function populateProductDropdown() { const select = document.getElementById('stockProduct'); if (select) select.innerHTML = data.products.map(prod => `<option value="${prod.id}">${prod.name}</option>`).join(''); }
async function renderProjectPortfolio(){
            try{
                const { data: projs, error } = await supabaseClient.from('pm_projects').select('id,name,status,project_type,capacity_mw,location').neq('status','cancelled').order('capacity_mw',{ascending:false,nullsFirst:false});
                if(error){ console.error('renderProjectPortfolio', error); return; }
                const list = projs || [];
                const totalCap = list.reduce(function(sum,p){ return sum + (Number(p.capacity_mw)||0); }, 0);
                const locSet = {};
                list.forEach(function(p){ if(p.location && p.location.trim()) locSet[p.location.trim()]=1; });
                const elCap = document.getElementById('ppfCapacity');
                const elCount = document.getElementById('ppfCount');
                const elLoc = document.getElementById('ppfLocations');
                if(elCap) elCap.textContent = totalCap>0 ? (totalCap>=1000 ? (totalCap/1000).toFixed(2)+' جيجاواط' : totalCap.toFixed(1)+' م.و') : '—';
                if(elCount) elCount.textContent = String(list.length);
                if(elLoc) elLoc.textContent = String(Object.keys(locSet).length);

                const TYPE_META = {
                    solar:{label:'شمسي', icon:'fa-solar-panel', color:'#F59E0B'},
                    thermal:{label:'حراري', icon:'fa-fire', color:'#EF4444'},
                    wind:{label:'رياح', icon:'fa-wind', color:'#1D39FF'},
                    hydrogen:{label:'هيدروجين', icon:'fa-atom', color:'#14B8A6'},
                    transmission:{label:'نقل وتوزيع', icon:'fa-bolt', color:'#0B6E4F'},
                    other:{label:'أخرى', icon:'fa-folder', color:'#64748B'}
                };
                const STATUS_META = {
                    planning:{label:'تخطيط', cls:'badge-info'},
                    active:{label:'نشط', cls:'badge-success'},
                    on_hold:{label:'متوقف', cls:'badge-warning'},
                    completed:{label:'مكتمل', cls:'badge-gray'}
                };
                const grid = document.getElementById('ppfGrid');
                if(!grid) return;
                if(list.length===0){
                    grid.innerHTML = '<div class="ppf-empty">لا توجد مشاريع مسجّلة بعد. أضف مشروعك الأول من صفحة إدارة المشاريع.</div>';
                    return;
                }
                grid.innerHTML = list.map(function(p){
                    const tm = TYPE_META[p.project_type] || {label:'-', icon:'fa-question-circle', color:'#64748B'};
                    const sm = STATUS_META[p.status] || {label: p.status||'-', cls:'badge-gray'};
                    const cap = p.capacity_mw!=null ? Number(p.capacity_mw).toLocaleString()+' م.و' : '-';
                    return '<div class="ppf-card">'
                        +'<div class="ic" style="background:'+tm.color+'22;color:'+tm.color+'"><i class="fas '+tm.icon+'"></i></div>'
                        +'<div class="nm">'+esc(p.name||'-')+'</div>'
                        +'<div class="meta">'+esc(tm.label)+(p.location?' · '+esc(p.location):'')+'</div>'
                        +'<div class="cap">'+cap+'</div>'
                        +'<span class="badge '+sm.cls+'">'+esc(sm.label)+'</span>'
                        +'</div>';
                }).join('');
            }catch(e){ console.error('renderProjectPortfolio', e); }
        }
        function navigateTo(page) {
            const allowed = ROLE_PAGES[currentUser?.role] || ['requests'];
            if (page !== 'myhr' && !allowed.includes(page)) {
                showToast('warning', t('accessDenied'), t('accessDeniedMsg'));
                return;
            }
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const pageEl = document.getElementById(`page-${page}`);
            const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
            if (pageEl) pageEl.classList.add('active');
            if (navEl) navEl.classList.add('active'); if (page === 'reports') renderReportsDashboard(); if (page === 'execdash') { _exdInitFilters().then(renderExecDashboard); } if (page === 'projectportfolio') renderProjectPortfolio(); if (page === 'pricecatalog') loadPriceCatalogModule(); if (page === 'settings') renderMySignaturePreview(); if (page === 'myhr') loadMyHRInfo(); if (page === 'hr') { renderHRSummary(); renderAttendanceSummary(); }
            remindSectionGuide(page);
            try { localStorage.setItem('aeeco_last_page', page); } catch (e) {}
            document.getElementById('sidebar').classList.remove('open');
        }
                // ===== اللوحة التنفيذية — المرحلة 2: المؤشرات من البيانات الحقيقية =====
        async function renderExecDashboard(){
            try{
                var periodKey = (document.getElementById('exdFilterPeriod')||{}).value || 'q6';
                var deptKey = (document.getElementById('exdFilterDept')||{}).value || '';
                var range = _exdPeriodRange(periodKey);
                let income=0, expense=0, activeProjects=0, pendingApprovals=0;
                try{
                    const { data: txns } = await supabaseClient.from('transactions').select('type,amount,date');
                    (txns||[]).forEach(function(t){ if(!_exdInRange(t.date, range)) return; const a=Number(t.amount)||0; if(t.type==='income') income+=a; else if(t.type==='expense') expense+=a; });
                }catch(e){ console.error('exd txns', e); }
                try{
                    const { data: projs } = await supabaseClient.from('pm_projects').select('status');
                    activeProjects=(projs||[]).filter(function(p){ return p.status==='active'; }).length;
                }catch(e){ console.error('exd projects', e); }
                try{
                    const { data: reqs } = await supabaseClient.from('employee_requests').select('status,requester_id,created_at');
                    pendingApprovals=(reqs||[]).filter(function(r){
                        if(r.status!=='pending') return false;
                        if(!_exdInRange(r.created_at, range)) return false;
                        if(deptKey){ var p=profilesCache[r.requester_id]; if(!p||p.department!==deptKey) return false; }
                        return true;
                    }).length;
                }catch(e){ console.error('exd requests', e); }
                const profit=income-expense;
                function setVal(id,val){ const el=document.getElementById(id); if(el){ el.textContent=val; el.classList.remove('ph'); } }
                setVal('exdRevenue', exdMoney(income));
                setVal('exdProfit', exdMoney(profit));
                setVal('exdProjects', String(activeProjects));
                setVal('exdPending', String(pendingApprovals));
                try{ await renderExecCharts(); }catch(e){ console.error('exd charts', e); }
                try{ renderExecLists(); }catch(e){ console.error('exd lists', e); }
            }catch(e){ console.error('renderExecDashboard error', e); }
        }
        
