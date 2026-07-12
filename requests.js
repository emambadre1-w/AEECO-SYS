        function getOfficialSignature(role){ var m={financial_manager:OFFICIAL_SIG_FINANCIAL_MANAGER, internal_auditor:OFFICIAL_SIG_INTERNAL_AUDITOR, gm:OFFICIAL_SIG_GM}; return m[role]||null; }
        function renderStagePreview(type) { const stages = REQUEST_ROUTES[type] || []; document.getElementById('reqStagePreview').innerHTML = stages.map(s => `<span class="stage-pill">${t('role' + s.charAt(0).toUpperCase() + s.slice(1))}</span>`).join('<i class="fas fa-angle-left" style="font-size:10px;color:var(--text-muted);"></i>'); }
        function openNewRequestModal() { _editReqId = null; document.getElementById('newRequestForm').reset(); var _rt=document.getElementById('reqType'); if(_rt) _rt.disabled=false; var _mt=document.querySelector('#newRequestModal .modal-title'); if(_mt) _mt.textContent='طلب جديد'; var _bt=document.getElementById('reqSubmitBtn'); if(_bt) _bt.textContent='إرسال الطلب'; toggleAmountField(); openModal('newRequestModal'); }
        function editRequest(id){ const r = allRequestsCache.find(x => String(x.id) === String(id)); if(!r){ return; } if(r.requester_id !== currentUser.id){ showToast('error','غير مسموح','يمكنك تعديل طلباتك فقط'); return; } if(r.status !== 'pending' || (r.stage_history && r.stage_history.length > 0)){ showToast('warning','لا يمكن التعديل','الطلب دخل مرحلة الموافقة'); return; } _editReqId = id; document.getElementById('newRequestForm').reset(); document.getElementById('reqType').value = r.type; document.getElementById('reqTitle').value = r.title || ''; document.getElementById('reqDescription').value = r.description || ''; document.getElementById('reqAmount').value = r.amount || ''; document.getElementById('reqLeaveType').value = r.leave_type || 'annual'; document.getElementById('reqLeaveFrom').value = r.from_date || ''; document.getElementById('reqLeaveTo').value = r.to_date || ''; var _rt=document.getElementById('reqType'); if(_rt) _rt.disabled=true; var _mt=document.querySelector('#newRequestModal .modal-title'); if(_mt) _mt.textContent='تعديل الطلب'; var _bt=document.getElementById('reqSubmitBtn'); if(_bt) _bt.textContent='حفظ التعديل'; toggleAmountField(); openModal('newRequestModal'); }
        async function notifyApproverEmail(stage, title, type, requesterName) {
            try {
                await supabaseClient.functions.invoke('notify-approver', {
                    body: { requestTitle: title, requestType: type, requesterName: requesterName, stage: stage }
                });
            } catch (e) { console.error('notifyApproverEmail', e); }
        }
        function printFinancialCertification(id){
            var r = (allRequestsCache||[]).find(function(x){ return x.id===id; });
            if(!r) return;
            var company = 'شركة الوطنية للطاقة والهندسة المحدودة';
            var now = new Date().toLocaleDateString('ar-EG');
            var logo = AEECO_INVOICE_LOGO;
            var requesterName = (profilesCache[r.requester_id] && profilesCache[r.requester_id].full_name) || '-';
            var requesterDept = (profilesCache[r.requester_id] && profilesCache[r.requester_id].department) || '-';
            var reqNo = 'FC-' + String(r.id).replace(/-/g,'').slice(-6).toUpperCase();
            var reqDate = r.created_at ? formatDate(r.created_at) : '-';

            var checkedDocs = String(r.attached_docs||'').split('،').map(function(x){ return x.trim(); });
            var docTypes = ['خطاب تصديق','خطاب استلام عهدة','فاتورة','أخرى'];
            var docsHtml = docTypes.map(function(d){
                var on = checkedDocs.indexOf(d) >= 0;
                return '<span style="display:inline-block;margin-inline-end:22px;font-size:14px">'+(on?'☑':'☐')+' '+d+'</span>';
            }).join('');

            var stages = ['financial_manager','internal_auditor','gm'];
            var stageLabels = { financial_manager: 'المدير المالي', internal_auditor: 'المراجع الداخلي', gm: 'المدير العام' };
            var hist = r.stage_history || [];
            var stageRows = stages.map(function(st){
                var entry = hist.find(function(h){ return h.stage===st; });
                var sigCell = (entry && entry.decision==='approved')
                    ? '<img src="'+(entry.signature_url || getOfficialSignature(st))+'" style="max-height:60px;max-width:160px;display:block;margin:0 auto">'
                    : (entry ? '<span style="font-size:12px;color:#999">(مرفوض)</span>' : '<div style="height:60px;border-bottom:1px dotted #999;margin:0 20px"></div>');
                var nameCell = entry ? esc(entry.approver_name) + (entry.decision!=='approved' ? ' (مرفوض)' : '') : '..........................';
                var dt = entry ? formatDate(entry.at) : '............';
                return '<tr><td style="width:18%">'+stageLabels[st]+'</td><td style="text-align:center;width:32%">'+sigCell+'</td><td style="width:30%">'+nameCell+'</td><td style="width:20%">'+dt+'</td></tr>';
            }).join('');

            var win = window.open('', '_blank');
            win.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>تصديق مالي</title><style>'+_prPrintCSS()+' .fc-box{border:1px solid #ccc;border-radius:6px;padding:12px 16px;margin-bottom:14px}.fc-row{display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px}.fc-row>div{flex:1;min-width:180px}.fc-lbl{font-size:12px;color:#777;margin-bottom:3px}.fc-val{font-size:14px;font-weight:bold}</style></head><body>'
                +'<div class="head"><img src="'+logo+'"><div class="doc">تصديق مالي — '+reqNo+'</div></div>'

                +'<div class="fc-box"><div class="fc-row">'
                +'<div><div class="fc-lbl">إلى السيد / المدير العام</div><div class="fc-val">للتصديق</div></div>'
                +'<div><div class="fc-lbl">مبلغ التصديق (بالأرقام)</div><div class="fc-val">'+(r.amount!=null?formatCurrency(r.amount):'-')+'</div></div>'
                +'<div><div class="fc-lbl">رقم الطلب</div><div class="fc-val">'+reqNo+'</div></div>'
                +'</div></div>'

                +'<div class="fc-box"><div class="fc-row">'
                +'<div style="flex:2"><div class="fc-lbl">مبلغ التصديق كتابة</div><div class="fc-val">'+esc(r.amount_words||'-')+'</div></div>'
                +'<div><div class="fc-lbl">بغرض</div><div class="fc-val">'+esc(r.title||'-')+'</div></div>'
                +'</div></div>'

                +'<div class="fc-box"><div class="fc-lbl" style="margin-bottom:8px">المستندات المرفقة</div>'+docsHtml+'</div>'

                +(r.description ? '<div class="fc-box"><div class="fc-lbl">التفاصيل</div><div style="font-size:13px">'+esc(r.description)+'</div></div>' : '')

                +'<div class="fc-box"><div class="fc-lbl" style="margin-bottom:6px">الجهة الطالبة</div><table style="margin:0"><tr><th>التاريخ</th><th>التوقيع</th><th>الاسم</th><th>الإدارة</th></tr>'
                +'<tr><td>'+esc(reqDate)+'</td><td>&nbsp;</td><td>'+esc(requesterName)+'</td><td>'+esc(requesterDept)+'</td></tr></table></div>'

                +'<div class="fc-box"><div class="fc-lbl" style="margin-bottom:8px;color:#0B6E4F;font-weight:bold">الشؤون المالية والإدارية</div><div class="fc-row">'
                +'<div><div class="fc-lbl">مركز التكلفة</div><div class="fc-val">'+esc(r.cost_center||'-')+'</div></div>'
                +'<div><div class="fc-lbl">المستفيد</div><div class="fc-val">'+esc(r.beneficiary||'-')+'</div></div>'
                +'</div></div>'

                +'<h3 style="margin-top:22px;color:#0B6E4F">التصديقات</h3>'
                +'<table><tr><th>الوظيفة</th><th>التوقيع</th><th>الاسم</th><th>التاريخ</th></tr>'+stageRows+'</table>'
                +'<div class="footer">طُبع من نظام '+esc(company)+' — '+now+'</div>'
                +'<br><button onclick="window.print()" style="padding:10px 20px;font-size:14px;cursor:pointer">🖨️ طباعة / حفظ PDF</button>'
                +'</body></html>');
            win.document.close();
        }
        function renderStageTrack(req) { const stages = REQUEST_ROUTES[req.type] || []; if (req.status === 'rejected') return `<span class="stage-pill rejected">${t('statusRejected')}</span>`; return stages.map(s => { let cls = 'stage-pill'; if (req.status === 'approved') cls += ' done'; else if (s === req.current_stage) cls += ' current'; else if (stages.indexOf(s) < stages.indexOf(req.current_stage)) cls += ' done'; return `<span class="${cls}">${t('role' + s.charAt(0).toUpperCase() + s.slice(1))}</span>`; }).join(''); }
        function renderRequestsTable() { const tbody = document.getElementById('requestsTableBody'); let rows = allRequestsCache; if (activeReqTab === 'mine') rows = rows.filter(r => r.requester_id === currentUser.id); else if (activeReqTab === 'pending') rows = rows.filter(r => r.status === 'pending' && canActOnRequest(r)); if (rows.length === 0) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;">${t('noRequests')}</td></tr>`; return; } tbody.innerHTML = rows.map(r => { const requester = profilesCache[r.requester_id]; const statusBadge = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' }[r.status]; const canAct = canActOnRequest(r); const actions = `<button class="btn btn-sm btn-secondary" onclick="showRequestDetails('${r.id}')" title="تتبع الطلب"><i class="fas fa-eye"></i></button>${r.type === 'financial_certification' ? ` <button class="btn btn-sm btn-secondary" onclick="printFinancialCertification('${r.id}')" title="طباعة"><i class="fas fa-print"></i></button>` : ''}${(r.requester_id === currentUser.id && r.status === 'pending' && (!r.stage_history || r.stage_history.length === 0)) ? ` <button class="btn btn-sm btn-secondary" onclick="editRequest('${r.id}')" title="تعديل الطلب"><i class="fas fa-edit"></i></button>` : ''}${(currentUser.role === 'admin' || currentUser.role === 'gm' || (r.requester_id === currentUser.id && r.status === 'pending')) ? ` <button class="btn btn-sm btn-danger" onclick="deleteRequest('${r.id}')" title="حذف"><i class="fas fa-trash"></i></button>` : ''}${canAct ? ` <button class="btn btn-sm btn-success" onclick="decideRequest('${r.id}','approved')"><i class="fas fa-check"></i></button> <button class="btn btn-sm btn-danger" onclick="decideRequest('${r.id}','rejected')"><i class="fas fa-times"></i></button>` : ''}`; return `<tr><td><span class="badge badge-info">${t('reqType' + r.type.charAt(0).toUpperCase() + r.type.slice(1))}</span></td><td>${r.title}</td><td>${requester?.full_name || '-'}</td><td style="font-family:var(--font-mono);">${r.amount ? formatCurrency(r.amount) : '-'}</td><td><div class="stage-track">${renderStageTrack(r)}</div></td><td><span class="badge ${statusBadge}">${t('status' + r.status.charAt(0).toUpperCase() + r.status.slice(1))}</span></td><td>${formatDateTime(r.created_at)}</td><td>${actions}</td></tr>`; }).join(''); }
        // ===================== Request Detail Tracker =====================
        function stageHasNoEligibleApprover(stage, requesterId) { return !Object.values(profilesCache).some(p => p && p.role === stage && p.id !== requesterId); }
        function canActOnRequest(req) { if (req.status !== 'pending') return false; if (currentUser.role === 'admin') return true; if (currentUser.role === 'gm') { if (req.current_stage === 'gm') return true; if (stageHasNoEligibleApprover(req.current_stage, req.requester_id)) return true; return false; } return currentUser.role === req.current_stage && req.requester_id !== currentUser.id; }
        function rolePendingTable(rows, title) { return `<div class="card"><div class="card-header"><h3 class="card-title">${title}</h3><button class="btn btn-sm btn-secondary" onclick="navigateTo('requests')" data-i18n="viewAll">عرض الكل</button></div><div class="card-body"><div class="table-container"><table><thead><tr><th>العنوان</th><th>النوع</th><th>مقدّم الطلب</th><th>التاريخ</th><th>الإجراء</th></tr></thead><tbody>${rows.slice(0,8).map(r => { const req = profilesCache[r.requester_id]; return `<tr><td><button class="btn btn-sm btn-secondary" onclick="showRequestDetails('${r.id}')" style="margin-inline-end:6px;" title="تتبع الطلب"><i class="fas fa-eye"></i></button>${r.title}</td><td><span class="badge badge-info">${t('reqType'+r.type.charAt(0).toUpperCase()+r.type.slice(1))}</span></td><td>${req?.full_name||'-'}</td><td>${formatDateTime(r.created_at)}</td><td><button class="btn btn-sm btn-success" onclick="decideRequest('${r.id}','approved')"><i class="fas fa-check"></i></button> <button class="btn btn-sm btn-danger" onclick="decideRequest('${r.id}','rejected')"><i class="fas fa-times"></i></button></td></tr>`; }).join('')||`<tr><td colspan="5" style="text-align:center;padding:24px;">${t('noRequests')}</td></tr>`}</tbody></table></div></div></div>`; }
