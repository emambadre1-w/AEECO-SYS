        async function loadEmployees() { try { const { data: rows, error } = await supabaseClient.from('employees').select('*').order('createdAt', { ascending: false }); if (error) console.warn('employees:', error.message); else data.employees = rows || []; } catch (e) { console.warn('employees:', e); } renderEmployees(); const el = document.getElementById('statEmployees'); if (el) el.textContent = data.employees.length; renderLeaveBalances(); renderHRSummary(); }
        async function loadAttendance() { try { const { data: rows, error } = await supabaseClient.from('attendance').select('*').order('date', { ascending: false }); if (error) console.warn('attendance:', error.message); else data.attendance = rows || []; } catch (e) { console.warn('attendance:', e); } renderAttendance(); renderAttendanceSummary(); renderTodayAttendanceCard(); }
        async function loadLeaves() { try { const { data: rows, error } = await supabaseClient.from('leaves').select('*').order('createdAt', { ascending: false }); if (error) console.warn('leaves:', error.message); else data.leaves = rows || []; } catch (e) { console.warn('leaves:', e); } renderLeaves(); renderLeaveBalances(); renderHRSummary(); }
        async function loadPayroll() { try { const { data: rows, error } = await supabaseClient.from('payroll').select('*').order('createdAt', { ascending: false }); if (error) console.warn('payroll:', error.message); else data.payroll = rows || []; } catch (e) { console.warn('payroll:', e); } renderPayroll(); }
        document.getElementById('signupForm').addEventListener('submit', async function(e) { e.preventDefault(); showAuthError(''); if (!isSupabaseConfigured()) { showAuthError(t('configMissing')); return; } const fullName = document.getElementById('signupName').value; const empCode = document.getElementById('signupCode').value; const email = document.getElementById('signupEmail').value; const password = document.getElementById('signupPassword').value; const btn = document.getElementById('signupSubmitBtn'); btn.disabled = true; const { data: authData, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { full_name: fullName } } }); btn.disabled = false; if (error) { showAuthError(error.message); return; } if (empCode && authData.user) { await supabaseClient.from('profiles').update({ employee_code: empCode }).eq('id', authData.user.id); } if (authData.session) { await onAuthSuccess(); } else { showToast('success', t('accountCreated'), ''); document.getElementById('switchToLogin').click(); } });
        function applyRoleVisibility() {
            const allowed = ROLE_PAGES[currentUser.role] || ['requests'];
            // إظهار كل الأقسام، وقفل المحجوب منها بدل إخفائها
            document.querySelectorAll('.nav-item[data-page]').forEach(item => {
                const page = item.dataset.page;
                if (page === 'myhr' || allowed.includes(page)) {
                    item.classList.remove('locked', 'app-hidden');
                } else {
                    item.classList.remove('app-hidden');
                    item.classList.add('locked');
                }
            });
            // تبويبات طلبات الموظفين (هنا نخفيها لأنها تبويبات مو صفحات)
            document.getElementById('tabPendingApproval').classList.toggle('app-hidden', currentUser.role === 'employee');
            document.getElementById('tabAllRequests').classList.toggle('app-hidden', !PRIVILEGED_ROLES.includes(currentUser.role));
            // Quick actions: admin only
            const qa = document.getElementById('quickActionsCard');
            if (qa) qa.style.display = currentUser.role === 'admin' ? 'block' : 'none';
            const _canMgrTickets = ['gm','admin','it_support'].includes(currentUser.role);
            const _eqTab = document.querySelector('.tab[data-tab="equipment"]'); if (_eqTab) _eqTab.classList.toggle('app-hidden', !_canMgrTickets);
            const _stSel = document.getElementById('ticketStatus'); if (_stSel && _stSel.closest('.form-group')) _stSel.closest('.form-group').style.display = _canMgrTickets ? '' : 'none';
            // المراجع الداخلي: اطّلاع وموافقة فقط في المحاسبة — بدون إضافة/تعديل/حذف
            const _acctEdit = canEditAccounting();
            ['btnNewTransaction','btnNewInvoice','btnAddAccount'].forEach(function(_id){ var _b = document.getElementById(_id); if (_b) _b.classList.toggle('app-hidden', !_acctEdit); });
            // النسخة الاحتياطية الشاملة (٣٤ جدول من قاعدة البيانات مباشرة) وتصدير كل البيانات في ملف واحد: للمدير العام و admin فقط
            const _isTopRole = ['gm','admin'].includes(currentUser.role);
            const _fbCard = document.getElementById('fullBackupCard'); if (_fbCard) _fbCard.classList.toggle('app-hidden', !_isTopRole);
            const _exAllBtn = document.getElementById('btnExportAllExcel'); if (_exAllBtn) _exAllBtn.classList.toggle('app-hidden', !_isTopRole);
        }
        // ===================== Employee Requests Module =====================
        function toggleAmountField() { const type = document.getElementById('reqType').value; const showAmount = type === 'expense' || type === 'purchase' || type === 'financial_certification'; document.getElementById('reqAmountGroup').classList.toggle('app-hidden', !showAmount); const lg = document.getElementById('reqLeaveGroup'); if(lg) lg.classList.toggle('app-hidden', type !== 'leave'); const fc = document.getElementById('reqFinCertGroup'); if(fc) fc.classList.toggle('app-hidden', type !== 'financial_certification'); const dcb = document.getElementById('reqDirectCertBtn'); if(dcb) dcb.classList.toggle('app-hidden', !(type === 'financial_certification' && currentUser && ['admin','secretary'].includes(currentUser.role))); renderStagePreview(type); }
        async function submitAndCertifyNow(){
            if (!currentUser || !['admin','secretary'].includes(currentUser.role)) { showToast('error', t('accessDenied'), t('accessDeniedMsg')); return; }
            const title = document.getElementById('reqTitle').value.trim();
            const description = document.getElementById('reqDescription').value.trim();
            const amount = document.getElementById('reqAmount').value;
            if (!title || !description) { showToast('warning', t('fillRequired'), ''); return; }
            if (!(parseFloat(amount) > 0)) { showToast('warning', t('amountRequired'), ''); return; }
            var _docs = [];
            if (document.getElementById('docCert').checked) _docs.push(t('docCertLetter'));
            if (document.getElementById('docCustody').checked) _docs.push(t('docCustodyLetter'));
            if (document.getElementById('docInvoice').checked) _docs.push(t('docInvoiceLbl'));
            if (document.getElementById('docOther').checked) _docs.push(t('docOtherLbl'));
            const _fcExtra = {
                amount_words: document.getElementById('reqAmountWords').value.trim() || null,
                cost_center: document.getElementById('reqCostCenter').value.trim() || null,
                beneficiary: document.getElementById('reqBeneficiary').value.trim() || null,
                attached_docs: _docs.join('، ') || null
            };
            const _now = new Date().toISOString();
            const _stageHistory = ['financial_manager','internal_auditor','gm'].map(function(st){
                return { stage: st, approver_id: currentUser.id, approver_name: currentUser.full_name, decision: 'approved', comment: '', at: _now, signature_url: getOfficialSignature(st) };
            });
            const payload = Object.assign({
                requester_id: currentUser.id, type: 'financial_certification', title, description,
                amount: parseFloat(amount), current_stage: null, status: 'approved', stage_history: _stageHistory
            }, _fcExtra);
            try{
                const { data: inserted, error } = await supabaseClient.from('employee_requests').insert(payload).select().single();
                if (error) throw error;
                closeModal('newRequestModal');
                showToast('success', t('requestSubmitted'), title);
                await loadRequestsModule();
                await renderRoleDashboard();
                printFinancialCertification(inserted.id);
            }catch(e){
                console.error('submitAndCertifyNow', e);
                showToast('error', 'تعذّر الحفظ', String((e&&e.message)||e));
            }
        }
        async function submitNewRequest() { const type = document.getElementById('reqType').value; const title = document.getElementById('reqTitle').value.trim(); const description = document.getElementById('reqDescription').value.trim(); const amount = document.getElementById('reqAmount').value; if (!title || !description) { showToast('warning', t('fillRequired'), ''); return; } if ((type === 'expense' || type === 'purchase' || type === 'financial_certification') && !(parseFloat(amount) > 0)) { showToast('warning', t('amountRequired'), ''); return; }
        var _leaveExtra = {};
        if (type === 'leave') {
            var _lFrom = document.getElementById('reqLeaveFrom').value;
            var _lTo = document.getElementById('reqLeaveTo').value;
            if (!_lFrom || !_lTo) { showToast('warning', t('fillRequired'), ''); return; }
            if (_lTo < _lFrom) { showToast('warning', t('fillRequired'), 'تاريخ النهاية قبل تاريخ البداية'); return; }
            _leaveExtra = { leave_type: document.getElementById('reqLeaveType').value, from_date: _lFrom, to_date: _lTo };
        }
        var _fcExtra = {};
        if (type === 'financial_certification') {
            var _docs = [];
            if (document.getElementById('docCert').checked) _docs.push(t('docCertLetter'));
            if (document.getElementById('docCustody').checked) _docs.push(t('docCustodyLetter'));
            if (document.getElementById('docInvoice').checked) _docs.push(t('docInvoiceLbl'));
            if (document.getElementById('docOther').checked) _docs.push(t('docOtherLbl'));
            _fcExtra = {
                amount_words: document.getElementById('reqAmountWords').value.trim() || null,
                cost_center: document.getElementById('reqCostCenter').value.trim() || null,
                beneficiary: document.getElementById('reqBeneficiary').value.trim() || null,
                attached_docs: _docs.join('، ') || null
            };
        } if (_editReqId) { const _upd = Object.assign({ title, description, amount: amount ? parseFloat(amount) : null }, _leaveExtra); const { error: _ee } = await supabaseClient.from('employee_requests').update(_upd).eq('id', _editReqId).eq('requester_id', currentUser.id); _editReqId = null; if (_ee) { showToast('error', 'Error', _ee.message); return; } closeModal('newRequestModal'); showToast('success', 'تم تعديل الطلب', title); var _rt2=document.getElementById('reqType'); if(_rt2) _rt2.disabled=false; await loadRequestsModule(); await renderRoleDashboard(); return; }
        const _allStages = REQUEST_ROUTES[type] || []; const stages = _allStages.filter(st => st !== currentUser.role); const _autoApprove = stages.length === 0; const payload = Object.assign({ requester_id: currentUser.id, type, title, description, amount: amount ? parseFloat(amount) : null, current_stage: _autoApprove ? null : stages[0], status: _autoApprove ? 'approved' : 'pending', stage_history: [] }, _fcExtra, _leaveExtra); const { error } = await supabaseClient.from('employee_requests').insert(payload); if (error) { showToast('error', 'Error', error.message); return; } closeModal('newRequestModal'); showToast('success', t('requestSubmitted'), title); if (!_autoApprove) { await notifyRole(stages[0], `📋 طلب جديد: ${title}`, `من ${currentUser.full_name} — ${t('reqType'+type.charAt(0).toUpperCase()+type.slice(1))}`, 'info', 'requests'); notifyApproverEmail(stages[0], title, type, currentUser.full_name); } await loadRequestsModule(); await renderRoleDashboard(); }
        async function loadRequestsModule() { const { data: reqs, error } = await supabaseClient.from('employee_requests').select('*').order('created_at', { ascending: false }); if (error) { console.error(error); return; } allRequestsCache = reqs || []; const { data: profs } = await supabaseClient.from('profiles').select('*'); profilesCache = {}; (profs || []).forEach(p => profilesCache[p.id] = p); if (!profilesCache[currentUser.id]) profilesCache[currentUser.id] = currentUser; const pendingForMe = allRequestsCache.filter(r => r.status === 'pending' && canActOnRequest(r)).length; const badge = document.getElementById('pendingApprovalsCount'); if (pendingForMe > 0) { badge.textContent = pendingForMe; badge.classList.remove('app-hidden'); } else { badge.classList.add('app-hidden'); } renderRequestsTable(); }
        async function deleteRequest(id){
            if(!(await confirmStyled('متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.', {type:'danger'}))) return;
            const _idx = allRequestsCache.findIndex(function(r){ return r.id===id; });
            const _backup = _idx>=0 ? allRequestsCache[_idx] : null;
            if(_idx>=0){ allRequestsCache.splice(_idx,1); renderRequestsTable(); }
            try{
                const { data: _delRows, error } = await supabaseClient.from('employee_requests').delete().eq('id', id).select();
                if(error) throw error;
                if(!_delRows || _delRows.length===0){
                    throw new Error('لم يُحذف الطلب فعلياً — الصلاحيات (RLS) في قاعدة البيانات لا تسمح بالحذف لهذا الحساب.');
                }
                showToast('success', t('dataDeleted'), '');
                await renderRoleDashboard();
            }catch(e){
                console.error('deleteRequest', e);
                showToast('error', 'تعذّر الحذف', String((e&&e.message)||e));
                if(_backup){ allRequestsCache.push(_backup); renderRequestsTable(); }
            }
        }
        function showRequestDetails(id) {
            const req = allRequestsCache.find(r => r.id === id);
            if (!req) return;
            const requester = profilesCache[req.requester_id];
            const stages = REQUEST_ROUTES[req.type] || [];
            const history = req.stage_history || [];
            const stageNames = { hr: 'الموارد البشرية (HR)', accountant: 'المحاسبة', gm: 'المدير العام', financial_manager: 'المدير المالي', internal_auditor: 'المراجع الداخلي' };
            const typeLabel = t('reqType' + req.type.charAt(0).toUpperCase() + req.type.slice(1));
            const statusBadge = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' }[req.status];
            const statusAr = { pending: 'قيد الانتظار', approved: 'معتمد', rejected: 'مرفوض' }[req.status];
            document.getElementById('reqDetailTitle').textContent = req.title;
            document.getElementById('reqDetailInfo').innerHTML = `
                <div class="req-info-item"><label>مقدّم الطلب</label><span>${requester?.full_name || '-'}</span></div>
                <div class="req-info-item"><label>نوع الطلب</label><span class="badge badge-info">${typeLabel}</span></div>
                <div class="req-info-item"><label>الحالة</label><span class="badge ${statusBadge}">${statusAr}</span></div>
                <div class="req-info-item"><label>تاريخ الطلب</label><span>${formatDateTime(req.created_at)}</span></div>
                ${req.amount ? `<div class="req-info-item"><label>المبلغ</label><span style="font-family:var(--font-mono);font-weight:700;">${formatCurrency(req.amount)}</span></div>` : ''}
                ${req.description ? `<div class="req-info-item full"><label>التفاصيل</label><span style="font-size:13px;line-height:1.6;">${req.description}</span></div>` : ''}
                ${req.type === 'financial_certification' ? `
                ${req.amount_words ? `<div class="req-info-item full"><label>المبلغ كتابة</label><span>${req.amount_words}</span></div>` : ''}
                ${req.cost_center ? `<div class="req-info-item"><label>مركز التكلفة</label><span>${req.cost_center}</span></div>` : ''}
                ${req.beneficiary ? `<div class="req-info-item"><label>المستفيد</label><span>${req.beneficiary}</span></div>` : ''}
                ${req.attached_docs ? `<div class="req-info-item full"><label>المستندات المرفقة</label><span>${req.attached_docs}</span></div>` : ''}
                ` : ''}
            `;
            // Build visual stepper
            let html = '';
            // Step 0: Employee submitted
            html += `<div class="req-tracker-step done">
                <div class="req-step-circle done"><i class="fas fa-paper-plane"></i></div>
                <div class="req-step-body"><div class="req-step-name">تقديم الطلب</div><div class="req-step-detail">${requester?.full_name || 'الموظف'}</div><div class="req-step-time">${formatDateTime(req.created_at)}</div></div>
            </div>`;
            // Approval stages
            stages.forEach(stage => {
                const hist = history.find(h => h.stage === stage);
                let cls = '', icon = 'fa-clock', detail = `<div class="req-step-detail" style="color:var(--text-muted);">بانتظار الموافقة</div>`;
                if (hist) {
                    if (hist.decision === 'approved') {
                        cls = 'done'; icon = 'fa-check';
                        var _sigThumb = (req.type==='financial_certification') ? `<img src="${hist.signature_url || getOfficialSignature(stage)}" style="max-height:34px;vertical-align:middle;margin-inline-end:6px">` : '';
                        detail = `<div class="req-step-detail">${_sigThumb}وافق عليه: <strong>${hist.approver_name || '-'}</strong></div><div class="req-step-time">${formatDateTime(hist.at)}</div>`;
                    } else {
                        cls = 'rejected'; icon = 'fa-times';
                        detail = `<div class="req-step-detail">رفضه: <strong>${hist.approver_name || '-'}</strong></div>${hist.comment ? `<div class="req-step-comment"><i class="fas fa-comment-alt" style="margin-inline-end:4px;"></i>${hist.comment}</div>` : ''}<div class="req-step-time">${formatDateTime(hist.at)}</div>`;
                    }
                } else if (req.status === 'pending' && req.current_stage === stage) {
                    cls = 'current'; icon = 'fa-hourglass-half';
                    detail = `<div class="req-step-detail" style="color:var(--warning);font-weight:600;"><i class="fas fa-circle-notch fa-spin" style="margin-inline-end:4px;"></i>جاري المراجعة الآن</div>`;
                }
                html += `<div class="req-tracker-step ${cls}">
                    <div class="req-step-circle ${cls}"><i class="fas ${icon}"></i></div>
                    <div class="req-step-body"><div class="req-step-name">${stageNames[stage] || stage}</div>${detail}</div>
                </div>`;
            });
            // Final outcome
            if (req.status === 'approved') {
                html += `<div class="req-tracker-step done">
                    <div class="req-step-circle done"><i class="fas fa-flag-checkered"></i></div>
                    <div class="req-step-body"><div class="req-step-name" style="color:var(--success);">✅ تم الاعتماد النهائي</div><div class="req-step-detail">اكتمل مسار الموافقة بنجاح</div></div>
                </div>`;
            } else if (req.status === 'rejected') {
                html += `<div class="req-tracker-step rejected">
                    <div class="req-step-circle rejected"><i class="fas fa-ban"></i></div>
                    <div class="req-step-body"><div class="req-step-name" style="color:var(--danger);">❌ تم الرفض</div><div class="req-step-detail">لم يكتمل مسار الموافقة</div></div>
                </div>`;
            }
            document.getElementById('reqDetailTracker').innerHTML = html;
            // Action buttons for approvers
            const canAct = canActOnRequest(req);
            const canDeleteReq = currentUser.role === 'admin' || currentUser.role === 'gm' || (req.requester_id === currentUser.id && req.status === 'pending');
            document.getElementById('reqDetailActions').innerHTML =
                (canAct ? `<button class="btn btn-success" onclick="decideRequest('${req.id}','approved');closeModal('requestDetailModal')"><i class="fas fa-check"></i> موافقة</button><button class="btn btn-danger" onclick="decideRequest('${req.id}','rejected');closeModal('requestDetailModal')"><i class="fas fa-times"></i> رفض</button>` : '')
                + (canDeleteReq ? `<button class="btn btn-secondary" onclick="deleteRequest('${req.id}');closeModal('requestDetailModal')"><i class="fas fa-trash"></i> حذف</button>` : '');
            openModal('requestDetailModal');
        }
        async function decideRequest(id, decision) { const req = allRequestsCache.find(r => r.id === id); if (!req) return; if (!profilesCache[req.requester_id]) { const { data: _profs } = await supabaseClient.from('profiles').select('*'); (_profs||[]).forEach(p => profilesCache[p.id] = p); } if (decision === 'approved' && req.requester_id === currentUser.id && currentUser.role !== 'gm' && currentUser.role !== 'admin') { showToast('warning', t('cannotSelfApprove'), ''); return; } let comment = ''; if (decision === 'rejected') comment = prompt(t('rejectReasonPrompt')) || ''; const _reqRole = (profilesCache[req.requester_id] && profilesCache[req.requester_id].role) || null; const stages = (REQUEST_ROUTES[req.type] || []).filter(st => st !== _reqRole); if (!Array.isArray(stages) || !stages.length) { showToast('error', 'نوع طلب غير معروف', 'تعذّر تحديد مسار الموافقة لهذا الطلب'); return; } const idx = stages.indexOf(req.current_stage); const historyEntry = { stage: req.current_stage, approver_id: currentUser.id, approver_name: currentUser.full_name, decision, comment, at: new Date().toISOString(), signature_url: currentUser.signature_url || null }; const newHistory = [...(req.stage_history || []), historyEntry]; let update = { stage_history: newHistory }; if (decision === 'rejected') { update.status = 'rejected'; update.current_stage = null; } else if (idx === stages.length - 1) { update.status = 'approved'; update.current_stage = null; } else { update.current_stage = stages[idx + 1]; } const { error } = await supabaseClient.from('employee_requests').update(update).eq('id', id); if (error) { showToast('error', 'تعذّر حفظ القرار', error.message); return; } showToast('success', t('decisionRecorded'), req.title);
        if (req.type === 'leave' && update.status === 'approved' && req.from_date && req.to_date) {
            try {
                const { data: linkedEmp } = await supabaseClient.from('employees').select('id').eq('profileId', req.requester_id).limit(1);
                if (linkedEmp && linkedEmp.length) {
                    await supabaseClient.from('leaves').insert({ id: generateId(), employeeId: linkedEmp[0].id, type: req.leave_type || 'annual', fromDate: req.from_date, toDate: req.to_date, reason: req.title, status: 'approved', createdAt: new Date().toISOString() });
                    if (['hr','gm','admin'].includes(currentUser.role)) await loadLeaves();
                }
            } catch (e) { console.warn('leave sync:', e); }
        }
        if (decision === 'rejected') { await notifyUser(req.requester_id, `❌ تم رفض طلبك: ${req.title}`, comment || `رفضه ${currentUser.full_name}`, 'danger', 'requests'); } else if (update.status === 'approved') { await notifyUser(req.requester_id, `✅ تم اعتماد طلبك: ${req.title}`, 'مبروك! الطلب مكتمل وتم اعتماده', 'success', 'requests'); } else { await notifyRole(update.current_stage, `📋 طلب بانتظار موافقتك: ${req.title}`, `وافق عليه ${currentUser.full_name} — من ${profilesCache[req.requester_id]?.full_name||'موظف'}`, 'info', 'requests'); notifyApproverEmail(update.current_stage, req.title, req.type, profilesCache[req.requester_id]?.full_name||'موظف'); } await loadRequestsModule(); await renderRoleDashboard(); }
        function initRealtime() { supabaseClient.channel('notifs-' + currentUser.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, (payload) => { notificationsCache.unshift(payload.new); updateNotifBadge(); renderNotifications(); showToast('info', payload.new.title, payload.new.message || ''); }).subscribe(); supabaseClient.channel('rt-tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, function(){ _rtReload('tickets'); }).subscribe(); supabaseClient.channel('rt-requests').on('postgres_changes', { event: '*', schema: 'public', table: 'employee_requests' }, function(){ _rtReload('requests'); }).subscribe(); }
        async function _prSignedImg(path) {
            if (!path) return '';
            const isImg = /\.(jpg|jpeg|png|webp)$/i.test(path);
            try {
                const { data: u } = await supabaseClient.storage.from('pr-images').createSignedUrl(path, 3600);
                if (u && u.signedUrl) {
                    return isImg
                        ? `<div class="imgcap">المستند المرفق:</div><div class="imgwrap"><img src="${u.signedUrl}"></div>`
                        : `<p class="imgcap">المرفق ملف PDF: <a href="${u.signedUrl}" target="_blank">فتح الملف</a></p>`;
                }
            } catch (e) { console.warn('signed url:', e); }
            return '';
        }
        async function renderQuickGlance() {
            const host = document.getElementById('quickGlance');
            if (!host) return;
            if (!['gm', 'admin'].includes(currentUser.role)) { host.style.display = 'none'; host.innerHTML = ''; return; }
            if (allRequestsCache.length === 0) { try { const { data: reqs } = await supabaseClient.from('employee_requests').select('*'); allRequestsCache = reqs || []; } catch (e) {} }
            const pendingReqs = allRequestsCache.filter(r => r.current_stage === currentUser.role).length;
            const openTickets = (data.tickets || []).filter(t => t.status === 'open' || t.status === 'in_progress').length;
            const lang = (data.settings && data.settings.language) || 'ar';
            host.style.display = '';
            if (pendingReqs === 0 && openTickets === 0) {
                const ok = lang === 'en' ? 'All caught up — nothing urgent right now' : 'كل شيء تحت السيطرة — لا مهام عاجلة الآن';
                host.innerHTML = `<div class="quick-glance-card calm"><i class="fas fa-check-circle"></i><span>${ok}</span></div>`;
                return;
            }
            let parts = [];
            if (lang === 'en') {
                if (pendingReqs > 0) parts.push(`<strong>${pendingReqs}</strong> ${pendingReqs === 1 ? 'request awaits' : 'requests await'} your approval`);
                if (openTickets > 0) parts.push(`<strong>${openTickets}</strong> open ${openTickets === 1 ? 'ticket' : 'tickets'}`);
            } else {
                if (pendingReqs > 0) parts.push(`<strong>${pendingReqs}</strong> ${pendingReqs === 1 ? 'طلب ينتظر' : 'طلبات تنتظر'} موافقتك`);
                if (openTickets > 0) parts.push(`<strong>${openTickets}</strong> ${openTickets === 1 ? 'تذكرة مفتوحة' : 'تذاكر مفتوحة'}`);
            }
            host.innerHTML = `<div class="quick-glance-card"><i class="fas fa-bolt"></i><span>${parts.join(' &nbsp;&middot;&nbsp; ')}</span></div>`;
        }
        async function _sSignedImg(path) {
            if (!path) return '';
            const isImg = /\.(jpg|jpeg|png|webp)$/i.test(path);
            try {
                const { data: u } = await supabaseClient.storage.from('secretary-images').createSignedUrl(path, 3600);
                if (u && u.signedUrl) {
                    return isImg
                        ? `<div class="imgcap">المستند المرفق:</div><div class="imgwrap"><img src="${u.signedUrl}"></div>`
                        : `<p class="imgcap">المرفق ملف PDF: <a href="${u.signedUrl}" target="_blank">فتح الملف</a></p>`;
                }
            } catch (e) { console.warn('signed url:', e); }
            return '';
        }
        async function viewSecretaryImage(path) {
            const el = document.getElementById('prImageViewContent');
            el.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--text-muted)"></i>';
            openModal('prImageViewModal');
            const { data } = await supabaseClient.storage.from('secretary-images').createSignedUrl(path, 3600);
            if (data && data.signedUrl) {
                const isImg = /\.(jpg|jpeg|png|webp)$/i.test(path);
                el.innerHTML = isImg ? `<img src="${data.signedUrl}" style="max-width:100%;max-height:70vh;border-radius:var(--radius-lg);">` : `<a href="${data.signedUrl}" target="_blank" class="btn btn-primary"><i class="fas fa-file-pdf"></i> فتح الملف</a>`;
            } else { el.innerHTML = '<p style="color:var(--text-muted)">تعذّر تحميل المرفق</p>'; }
        }
        function openEditUserName(id){
            const p = allProfilesCache.find(x=>x.id===id);
            if(!p) return;
            document.getElementById('editUserNameId').value = id;
            document.getElementById('editUserNameInput').value = p.full_name || '';
            var _ec=document.getElementById('editUserCodeInput'); if(_ec) _ec.value = p.employee_code || '';
            var _ed=document.getElementById('editUserDeptInput'); if(_ed) _ed.value = p.department || '';
            openModal('editUserNameModal');
        }
        async function saveUserName(){
            const id = document.getElementById('editUserNameId').value;
            const name = document.getElementById('editUserNameInput').value.trim();
            if(!name){ showToast('warning', t('fillRequired'), ''); return; }
            const _ec=document.getElementById('editUserCodeInput'); const _ed=document.getElementById('editUserDeptInput'); const _code=_ec?_ec.value.trim():''; const _dept=_ed?_ed.value.trim():''; const { error } = await supabaseClient.from('profiles').update({ full_name: name, employee_code: _code || null, department: _dept || null }).eq('id', id);
            if(error){ showToast('error', 'Error', error.message); return; }
            closeModal('editUserNameModal');
            showToast('success','تم تحديث البيانات','');
            await loadUsersModule();
            if(id === currentUser.id){ currentUser.full_name = name; if(typeof updateUserMenu==='function') updateUserMenu(); }
        }
                async function _resolveDept(uid){
            try{
                if (typeof profilesCache !== 'undefined' && profilesCache && profilesCache[uid] && profilesCache[uid].department) return profilesCache[uid].department;
                const { data: p } = await supabaseClient.from('profiles').select('department').eq('id', uid).single();
                return (p && p.department) || '-';
            }catch(e){ return '-'; }
        }
        async function viewTicket(id){
            const tk = data.tickets.find(x=>String(x.id)===String(id));
            if(!tk) return;
            const _dept = tk.created_by ? await _resolveDept(tk.created_by) : '-';
            const rows = [
                ['رقم التذكرة', '#'+String(tk.id).slice(-6).toUpperCase()],
                ['العنوان', esc(tk.title||'-')],
                ['الوصف', esc(tk.description||'-')],
                ['الأولوية', t(tk.priority)],
                ['الحالة', t(tk.status)],
                ['الفئة', tk.category ? t(tk.category) : '-'],
                ['مقدّم الطلب', esc(tk.submittedBy||'-')],
                ['القسم', esc(_dept)],
                ['التاريخ', formatDateTime(tk.createdAt)]
            ];
            if(tk.resolution_note){ rows.push(['🔧 ملاحظة الحل', esc(tk.resolution_note)]); }
            let body = rows.map(r=>`<div style="display:flex;gap:12px;padding:9px 0;border-bottom:0.5px solid var(--border);"><div style="width:110px;color:var(--text-muted);font-size:13px;flex-shrink:0;">${r[0]}</div><div style="flex:1;font-size:14px;line-height:1.6;word-break:break-word;">${r[1]}</div></div>`).join('');
            document.getElementById('ticketViewBody').innerHTML = body + (tk.image_path ? '<div style="margin-top:14px;color:var(--text-muted);font-size:13px;">جارٍ تحميل الصورة المرفقة...</div>' : '');
            openModal('ticketViewModal');
            if(tk.image_path){
                try {
                    const { data: u } = await supabaseClient.storage.from('ticket-images').createSignedUrl(tk.image_path, 3600);
                    if(u && u.signedUrl){
                        document.getElementById('ticketViewBody').innerHTML = body + `<div style="margin-top:14px;"><div style="color:var(--text-muted);font-size:13px;margin-bottom:6px;">الصورة المرفقة</div><a href="${u.signedUrl}" target="_blank"><img src="${u.signedUrl}" style="max-width:100%;border-radius:8px;border:0.5px solid var(--border);"></a></div>`;
                    }
                } catch(e){ console.warn('ticket img:', e); }
            }
        }
        async function viewEquipment(id){
            const item = data.equipment.find(x=>String(x.id)===String(id));
            if(!item) return;
            const rows = [
                ['رقم الأصل', esc(item.assetId||'-')],
                ['اسم المعدة', esc(item.name||'-')],
                ['الفئة', t(item.category)],
                ['الحالة', t(item.status)],
                ['المكلّف', esc(item.assignedTo||'-')],
                ['الموقع', esc(item.location||'-')],
                ['ملاحظات', esc(item.notes||'-')]
            ];
            let body = rows.map(r=>`<div style="display:flex;gap:12px;padding:9px 0;border-bottom:0.5px solid var(--border);"><div style="width:110px;color:var(--text-muted);font-size:13px;flex-shrink:0;">${r[0]}</div><div style="flex:1;font-size:14px;line-height:1.6;word-break:break-word;">${r[1]}</div></div>`).join('');
            document.getElementById('equipmentViewBody').innerHTML = body + (item.image_path ? '<div style="margin-top:14px;color:var(--text-muted);font-size:13px;">جارٍ تحميل الصورة المرفقة...</div>' : '');
            openModal('equipmentViewModal');
            if(item.image_path){
                try {
                    const { data: u } = await supabaseClient.storage.from('equipment-images').createSignedUrl(item.image_path, 3600);
                    if(u && u.signedUrl){
                        document.getElementById('equipmentViewBody').innerHTML = body + `<div style="margin-top:14px;"><div style="color:var(--text-muted);font-size:13px;margin-bottom:6px;">صورة الجهاز</div><a href="${u.signedUrl}" target="_blank"><img src="${u.signedUrl}" style="max-width:100%;border-radius:8px;border:0.5px solid var(--border);"></a></div>`;
                    }
                } catch(e){ console.warn('equipment img:', e); }
            }
        }
                function resolveTicket(id){
            const tk = data.tickets.find(x=>String(x.id)===String(id));
            if(!tk) return;
            document.getElementById('resolveTicketId').value = id;
            document.getElementById('resolveNote').value = '';
            openModal('resolveTicketModal');
        }
        function openModal(modalId) { document.getElementById(modalId).classList.add('active'); document.body.style.overflow = 'hidden'; if (modalId === 'attendanceModal' || modalId === 'leaveModal' || modalId === 'payrollModal') populateEmployeeDropdowns(); if (modalId === 'stockModal') populateProductDropdown(); if (['transactionModal', 'invoiceModal', 'attendanceModal'].includes(modalId)) document.querySelector(`#${modalId} input[type="date"]`).valueAsDate = new Date(); }
        async function submitAddUser() {
            const full_name = document.getElementById('auFullName').value.trim();
            const email = document.getElementById('auEmail').value.trim();
            const password = document.getElementById('auPassword').value;
            const employee_code = document.getElementById('auEmployeeCode').value.trim();
            const role = document.getElementById('auRole').value;
            if (!full_name || !email || !password || !role) { showToast('warning', t('fillRequired'), ''); return; }
            const btn = document.getElementById('auSubmitBtn');
            const status = document.getElementById('auStatus');
            btn.disabled = true; btn.textContent = t('loading');
            status.textContent = ''; status.style.color = '';
            try {
                const { data, error } = await supabaseClient.functions.invoke('create-user', {
                    body: { email, password, full_name, role, employee_code: employee_code || null }
                });
                if (error) throw error;
                if (data && data.error) throw new Error(data.error);
                logActivity('Users', 'create', full_name);
                showToast('success', t('accountCreated'), full_name);
                closeModal('addUserModal');
                await loadUsersModule();
            } catch (e) {
                status.style.color = 'var(--danger)';
                status.textContent = (e.message || 'تعذّر إنشاء المستخدم') + ' — تأكد إن دالة create-user منشورة على Supabase.';
                btn.disabled = false; btn.textContent = t('save');
            }
        }
        function populateEmployeeDropdowns() { ['attendanceEmployee', 'leaveEmployee', 'payrollEmployee'].forEach(id => { const select = document.getElementById(id); if (select) select.innerHTML = data.employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join(''); }); if (document.getElementById('payrollBasic')) fillBasicFromEmployee(); }
        function renderReportsDashboard() {
            const host = document.getElementById('reportsDashboard');
            if (!host) return;
            const txns = data.transactions || [];
            const income = txns.filter(x => x.type === 'income').reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
            const expense = txns.filter(x => x.type === 'expense').reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
            const net = income - expense;
            const activeEmp = (data.employees || []).filter(e => (e.status || 'active') === 'active').length;
            const prods = (data.products || []).length;
            const openT = (data.tickets || []).filter(x => x.status && x.status !== 'closed' && x.status !== 'resolved').length;
            const card = (label, value, color) => `<div style="flex:1;min-width:150px;background:var(--bg-tertiary);border-radius:12px;padding:16px"><div style="font-size:13px;color:var(--text-secondary);margin-bottom:6px">${label}</div><div style="font-size:21px;font-weight:700;font-family:var(--font-mono);color:${color}">${value}</div></div>`;
            let html = `<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:26px">`
                + card(t('totalIncome'), formatCurrency(income), 'var(--success)')
                + card(t('totalExpenses'), formatCurrency(expense), 'var(--danger)')
                + card(t('netBalance'), formatCurrency(net), net >= 0 ? 'var(--success)' : 'var(--danger)')
                + card(t('activeEmployees'), activeEmp, 'var(--primary)')
                + card(t('products'), prods, 'var(--info)')
                + card(t('openTickets'), openT, 'var(--warning)')
                + `</div>`;
            const barChart = (title, obj, color) => {
                const entries = Object.entries(obj).filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]);
                if (entries.length === 0) return `<div style="flex:1;min-width:300px;margin-bottom:20px"><h4 style="margin:0 0 14px;color:var(--text-primary)">${title}</h4><p style="color:var(--text-muted);font-size:13px">${t('noData')}</p></div>`;
                const max = Math.max.apply(null, entries.map(e => e[1]));
                const rows = entries.map(e => `<div style="margin-bottom:11px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span>${esc(String(e[0]))}</span><span style="font-family:var(--font-mono);font-weight:600">${e[1]}</span></div><div style="background:var(--bg-secondary);border-radius:6px;height:11px;overflow:hidden"><div style="width:${(e[1] / max * 100).toFixed(1)}%;height:100%;background:${color};border-radius:6px"></div></div></div>`).join('');
                return `<div style="flex:1;min-width:300px;margin-bottom:20px"><h4 style="margin:0 0 14px;color:var(--text-primary)">${title}</h4>${rows}</div>`;
            };
            const incExp = {}; incExp[t('totalIncome')] = income; incExp[t('totalExpenses')] = expense;
            const byDept = {}; (data.employees || []).forEach(e => { if ((e.status || 'active') === 'active') { const d = e.department || '—'; byDept[d] = (byDept[d] || 0) + 1; } });
            const byInvStatus = {}; (data.invoices || []).forEach(inv => { const k = t(inv.status) || inv.status || '—'; byInvStatus[k] = (byInvStatus[k] || 0) + 1; });
            html += `<div style="display:flex;flex-wrap:wrap;gap:30px">`
                + barChart(t('incomeVsExpense'), incExp, 'var(--primary)')
                + barChart(t('employeesByDept'), byDept, 'var(--info)')
                + barChart(t('invoicesByStatus'), byInvStatus, 'var(--accent)')
                + `</div>`;
            host.innerHTML = html;
        }
        function exportAllData() { const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `it-system-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); try { localStorage.setItem('aeeco_last_backup', String(Date.now())); } catch(e){} var _br = document.getElementById('backupReminder'); if (_br) _br.classList.add('app-hidden'); showToast('success', t('dataExported'), ''); }
        function exportActivityLog() { const blob = new Blob([JSON.stringify(data.activityLog, null, 2)], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `activity-log-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); showToast('success', t('dataExported'), ''); }
        async function openAddEmployeeModal() { document.getElementById('employeeForm').reset(); document.getElementById('employeeId').value = ''; await populateEmployeeLinkDropdowns(null); toggleContractEndField(); document.getElementById('empDocLabel').value = ''; const df = document.getElementById('empDocFile'); if (df) df.value = ''; document.getElementById('empDocUploadStatus').textContent = ''; document.getElementById('empDocumentsList').innerHTML = '<div style="font-size:12px;color:var(--text-muted);">احفظ الموظف أولاً قبل إضافة مستندات</div>'; openModal('employeeModal'); }
        function computeAttendanceSummary(employeeId, monthStr){
            var STANDARD_HOURS=8, STANDARD_START_MIN=480;
            var recs = (data.attendance||[]).filter(function(a){ return a.employeeId===employeeId && String(a.date||'').slice(0,7)===monthStr && a.checkIn && a.checkOut; });
            var totalHours=0, overtimeHours=0, lateDays=0;
            recs.forEach(function(a){
                var inMin=_hrTimeToMin(a.checkIn), outMin=_hrTimeToMin(a.checkOut);
                if(inMin==null||outMin==null) return;
                var hrs=(outMin-inMin)/60; if(hrs<0) hrs+=24;
                totalHours+=hrs;
                if(hrs>STANDARD_HOURS) overtimeHours += (hrs-STANDARD_HOURS);
                if(inMin>STANDARD_START_MIN) lateDays++;
            });
            return { daysPresent: recs.length, totalHours: totalHours, overtimeHours: overtimeHours, lateDays: lateDays };
        }
        function renderAttendanceSummary(){
            var monthInput = document.getElementById('attSummaryMonth');
            if(!monthInput) return;
            if(!monthInput.value){ var d=new Date(); monthInput.value = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
            var monthStr = monthInput.value;
            var tbody = document.getElementById('attSummaryBody');
            if(!tbody) return;
            var emps = (data.employees||[]).filter(function(e){ return (e.status||'active')==='active'; });
            if(emps.length===0){ tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px">'+t('noData')+'</td></tr>'; return; }
            tbody.innerHTML = emps.map(function(e){
                var sm = computeAttendanceSummary(e.id, monthStr);
                var lateBadge = sm.lateDays>0 ? '<span class="badge badge-warning">'+sm.lateDays+'</span>' : '0';
                return '<tr><td>'+esc(e.name||'-')+'</td><td>'+sm.daysPresent+'</td><td>'+sm.totalHours.toFixed(1)+'</td><td>'+sm.overtimeHours.toFixed(1)+'</td><td>'+lateBadge+'</td></tr>';
            }).join('');
        }
        function renderTodayAttendanceCard(){
            var body = document.getElementById('todayAttendanceBody');
            if(!body) return;
            var dateEl = document.getElementById('todayCardDate');
            var todayStr = new Date().toISOString().slice(0,10);
            if(dateEl) dateEl.textContent = '— ' + formatDate(todayStr);
            var activeEmps = (data.employees||[]).filter(function(e){ return (e.status||'active')==='active'; });
            if(activeEmps.length===0){ body.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">'+t('noData')+'</div>'; return; }
            var STANDARD_START_MIN = 480;
            var todayAtt = (data.attendance||[]).filter(function(a){ return a.date === todayStr; });
            var presentIds = {}; var lateList = [];
            todayAtt.forEach(function(a){
                presentIds[a.employeeId] = true;
                if(a.checkIn){ var p = a.checkIn.split(':'); var inMin = parseInt(p[0],10)*60 + parseInt(p[1]||0,10); if(inMin > STANDARD_START_MIN){ var e = activeEmps.find(function(x){ return x.id===a.employeeId; }); if(e) lateList.push(e); } }
            });
            var onLeaveList = activeEmps.filter(function(e){ return (data.leaves||[]).some(function(l){ return l.employeeId===e.id && l.status==='approved' && l.fromDate && l.toDate && l.fromDate<=todayStr && l.toDate>=todayStr; }); });
            var onLeaveIds = {}; onLeaveList.forEach(function(e){ onLeaveIds[e.id]=true; });
            var absentList = activeEmps.filter(function(e){ return !presentIds[e.id] && !onLeaveIds[e.id]; });
            function chips(list, color){ return list.map(function(e){ return '<span onclick="viewEmployee(\''+e.id+'\')" style="display:inline-block;cursor:pointer;padding:4px 12px;border-radius:20px;font-size:13px;margin:0 0 6px 6px;background:'+color.bg+';color:'+color.fg+';border:1px solid '+color.bd+';">'+esc(e.name)+'</span>'; }).join(''); }
            function group(icon, label, list, color, emptyMsg){
                var inner = list.length ? chips(list, color) : '<span style="font-size:12px;color:var(--text-muted);">'+emptyMsg+'</span>';
                return '<div style="margin-bottom:10px;"><div style="font-size:13px;font-weight:700;margin-bottom:6px;color:'+color.fg+';"><i class="fas '+icon+'"></i> '+label+' ('+list.length+')</div><div>'+inner+'</div></div>';
            }
            body.innerHTML =
                group('fa-user-xmark','الغائبون اليوم', absentList, {bg:'rgba(239,68,68,.10)', fg:'#EF4444', bd:'rgba(239,68,68,.25)'}, 'لا غياب — الكل تمام ✔')
                + group('fa-clock','المتأخرون', lateList, {bg:'rgba(245,158,11,.12)', fg:'#B45309', bd:'rgba(245,158,11,.3)'}, 'لا تأخير اليوم')
                + group('fa-plane-departure','في إجازة معتمدة', onLeaveList, {bg:'rgba(59,130,246,.10)', fg:'#3B82F6', bd:'rgba(59,130,246,.25)'}, 'لا أحد في إجازة اليوم');
        }
        function renderHRSummary(){
            var totalEl = document.getElementById('hrSumTotal');
            var pendingEl = document.getElementById('hrSumPending');
            var onLeaveEl = document.getElementById('hrSumOnLeave');
            if(!totalEl) return;
            var activeEmps = (data.employees||[]).filter(function(e){ return (e.status||'active')==='active'; });
            totalEl.textContent = String(activeEmps.length);
            var _rq = (typeof allRequestsCache!=='undefined' && allRequestsCache) ? allRequestsCache : [];
            var pendingLeaves = _rq.filter(function(r){ return r.type==='leave' && r.status==='pending'; }).length;
            if(pendingEl) pendingEl.textContent = String(pendingLeaves);
            var todayStr = new Date().toISOString().slice(0,10);
            var onLeave = (data.leaves||[]).filter(function(l){ return l.status==='approved' && l.fromDate && l.toDate && l.fromDate<=todayStr && l.toDate>=todayStr; }).length;
            if(onLeaveEl) onLeaveEl.textContent = String(onLeave);
            var expiringEl = document.getElementById('hrSumExpiring');
            if(expiringEl) expiringEl.textContent = String(activeEmps.filter(isContractExpiringSoon).length);
            renderTodayAttendanceCard();
        }
        async function generateMonthlyPayroll(){
            var monthInput = document.getElementById('payrollGenMonth');
            if(!monthInput || !monthInput.value){ showToast('warning','اختر الشهر أولاً',''); return; }
            var monthStr = monthInput.value;
            var emps = (data.employees||[]).filter(function(e){ return (e.status||'active')==='active'; });
            var existing = {};
            (data.payroll||[]).forEach(function(p){ if(p.month===monthStr) existing[p.employeeId]=true; });
            var toCreate = emps.filter(function(e){ return !existing[e.id]; });
            if(toCreate.length===0){ showToast('info','لا يوجد موظفون جدد','كل الموظفين النشطين عندهم راتب مسجّل بالفعل لهذا الشهر'); return; }
            if(!(await confirmStyled('هيتم توليد '+toCreate.length+' كشف راتب لشهر '+monthStr+'. تقدر تراجع وتعدّل كل واحد بعدها. متابعة؟', {type:'warning', okLabel:'توليد الرواتب'}))) return;
            var created=0;
            for(var i=0;i<toCreate.length;i++){
                var e = toCreate[i];
                var sm = computeAttendanceSummary(e.id, monthStr);
                var basic = parseFloat(e.salary)||0;
                var hourlyRate = basic>0 ? basic/176 : 0;
                var overtimePay = Math.round(sm.overtimeHours * hourlyRate * 1.5);
                var gross = basic + overtimePay;
                var payload = { id: generateId(), employeeId: e.id, month: monthStr, basic: basic, allowances: 0, overtime: overtimePay, insurance: 0, tax: 0, deductions: 0, net: gross, createdAt: new Date().toISOString() };
                try{
                    var res = await supabaseClient.from('payroll').insert(payload);
                    if(!res.error) created++;
                }catch(err){ console.error('generateMonthlyPayroll', err); }
            }
            showToast('success', 'تم توليد '+created+' كشف راتب', 'راجع كل كشف وعدّل البدلات أو الخصومات لو محتاج قبل الاعتماد النهائي');
            await loadPayroll();
        }
        
        async function loadEmployeeDocuments(employeeId) {
            const container = document.getElementById('empDocumentsList');
            if (!container) return;
            if (!employeeId) { container.innerHTML = ''; return; }
            container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);">جارٍ التحميل...</div>';
            const { data: docs, error } = await supabaseClient.from('employee_documents').select('*').eq('employee_id', employeeId).order('uploaded_at', {ascending:false});
            if (error) { container.innerHTML = '<div style="font-size:12px;color:var(--danger);">تعذّر تحميل المستندات</div>'; return; }
            renderEmployeeDocumentsList(docs || []);
        }
        function renderEmployeeDocumentsList(docs) {
            const container = document.getElementById('empDocumentsList');
            if (!container) return;
            if (!docs.length) { container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);">لا توجد مستندات مرفوعة بعد</div>'; return; }
            container.innerHTML = docs.map(d => {
                const urlData = supabaseClient.storage.from('employee-documents').getPublicUrl(d.file_path).data;
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg-secondary);border-radius:6px;margin-bottom:6px;"><a href="${urlData.publicUrl}" target="_blank" rel="noopener" style="font-size:13px;color:var(--text-primary);text-decoration:none;"><i class="fas fa-file-lines"></i> ${esc(d.name)}</a><button type="button" class="btn btn-sm btn-danger" onclick="deleteEmployeeDocument('${d.id}','${d.employee_id}')"><i class="fas fa-trash"></i></button></div>`;
            }).join('');
        }
        async function uploadEmployeeDocument() {
            const empId = document.getElementById('employeeId').value;
            if (!empId) { showToast('warning', 'احفظ الموظف أولاً', 'ثم عاود فتح التعديل لإضافة مستندات'); return; }
            const label = document.getElementById('empDocLabel').value.trim();
            const fileInput = document.getElementById('empDocFile');
            const file = fileInput && fileInput.files[0];
            if (!file) { showToast('warning', 'اختر ملف أولاً', ''); return; }
            if (!label) { showToast('warning', 'اكتب اسم المستند', 'مثال: نسخة العقد'); return; }
            const status = document.getElementById('empDocUploadStatus');
            status.textContent = 'جارٍ الرفع...';
            try {
                const ext = file.name.split('.').pop();
                const path = empId + '/' + Date.now() + '.' + ext;
                const up = await supabaseClient.storage.from('employee-documents').upload(path, file);
                if (up.error) throw up.error;
                const ins = await supabaseClient.from('employee_documents').insert({ id: generateId(), employee_id: empId, name: label, file_path: path, uploaded_at: new Date().toISOString(), uploaded_by: currentUser.id });
                if (ins.error) throw ins.error;
                logActivity('HR', 'create', 'مستند: ' + label);
                document.getElementById('empDocLabel').value = '';
                fileInput.value = '';
                status.textContent = '';
                await loadEmployeeDocuments(empId);
                showToast('success', t('dataSaved'), label);
            } catch (e) {
                status.textContent = '';
                showToast('error', 'تعذّر رفع المستند', e.message || '');
            }
        }
        async function deleteEmployeeDocument(id, employeeId) {
            if (!(await confirmStyled('هل أنت متأكد من حذف هذا المستند؟', {type:'danger'}))) return;
            const { error } = await supabaseClient.from('employee_documents').delete().eq('id', id);
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('HR', 'delete', 'مستند موظف');
            await loadEmployeeDocuments(employeeId);
            showToast('success', t('dataDeleted'), '');
        }
        function toggleContractEndField() {
            const type = document.getElementById('empContractType').value;
            const grp = document.getElementById('empContractEndGroup');
            if (grp) grp.style.display = (type === 'permanent') ? 'none' : '';
        }
        async function saveEmployee() { const id = document.getElementById('employeeId').value || generateId(); const isNew = !document.getElementById('employeeId').value; const employee = {id: id, empId: document.getElementById('empId').value, name: document.getElementById('empName').value, position: document.getElementById('empPosition').value, department: document.getElementById('empDepartment').value, phone: document.getElementById('empPhone').value, email: document.getElementById('empEmail').value, hireDate: document.getElementById('empHireDate').value || null, salary: parseFloat(document.getElementById('empSalary').value) || 0, annualLeave: parseFloat(document.getElementById('empAnnualLeave').value) || 21, status: document.getElementById('empStatus').value, nationalId: document.getElementById('empNationalId').value || null, bankAccount: document.getElementById('empBankAccount').value || null, emergencyContactName: document.getElementById('empEmergencyName').value || null, emergencyContactPhone: document.getElementById('empEmergencyPhone').value || null, managerId: document.getElementById('empManagerId').value || null, profileId: document.getElementById('empProfileId').value || null, contractType: document.getElementById('empContractType').value || 'permanent', contractEndDate: (document.getElementById('empContractType').value === 'permanent') ? null : (document.getElementById('empContractEndDate').value || null), createdAt: isNew ? new Date().toISOString() : (data.employees.find(e => e.id === id)?.createdAt || new Date().toISOString())};
            const _prevEmp = isNew ? null : data.employees.find(e => e.id === id);
            if (!isNew && _prevEmp && (_prevEmp.status || 'active') !== 'terminated' && employee.status === 'terminated') {
                openOffboardModal(employee);
                return;
            }
            await persistEmployee(employee, isNew);
        }
        async function persistEmployee(employee, isNew) {
            const { error } = await supabaseClient.from('employees').upsert(employee); if (error) { showToast('error', 'Error', error.message); return; } logActivity('HR', isNew ? 'create' : 'update', employee.name); await loadEmployees(); closeModal('employeeModal'); showToast('success', t('dataSaved'), employee.name);
        }
        function openOffboardModal(employee) {
            _pendingOffboardEmployee = employee;
            document.getElementById('offboardIntro').textContent = `على وشك تغيير حالة "${employee.name}" إلى منتهية خدمته. راجع النقاط دي قبل التأكيد:`;
            const acctSection = document.getElementById('offboardAccountSection');
            if (employee.profileId) {
                acctSection.innerHTML = `<label style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:400;"><input type="checkbox" id="offboardLockAccount" checked style="width:auto;"><span data-i18n="offboardLockAccount">قفل وصوله للنظام فورًا (حسابه مرتبط بدور حاليًا)</span></label>`;
            } else {
                acctSection.innerHTML = `<div style="font-size:13px;color:var(--text-muted);"><i class="fas fa-circle-info"></i> <span data-i18n="offboardNoAccount">حسابه غير مرتبط بحساب دخول — لا شيء لقفله.</span></div>`;
            }
            const eqSection = document.getElementById('offboardEquipmentSection');
            const assigned = (data.equipment || []).filter(eq => (eq.assignedTo || '').trim().toLowerCase() === (employee.name || '').trim().toLowerCase());
            if (assigned.length) {
                eqSection.innerHTML = `<div style="font-size:13px;font-weight:600;margin-bottom:6px;" data-i18n="offboardEquipmentTitle">معدات مسجّلة عليه — راجعها بعد الحفظ:</div><ul style="margin:0;padding-inline-start:20px;font-size:13px;line-height:1.9;">` + assigned.map(eq => `<li>${esc(eq.name)} (${esc(eq.assetId||'-')})</li>`).join('') + `</ul>`;
            } else {
                eqSection.innerHTML = `<div style="font-size:13px;color:var(--text-muted);"><i class="fas fa-circle-info"></i> <span data-i18n="offboardNoEquipment">لا توجد معدات مسجّلة باسمه.</span></div>`;
            }
            openModal('offboardModal');
        }
        function cancelOffboard() {
            _pendingOffboardEmployee = null;
            closeModal('offboardModal');
            document.getElementById('empStatus').value = 'active';
        }
        async function confirmOffboard() {
            const employee = _pendingOffboardEmployee;
            if (!employee) { closeModal('offboardModal'); return; }
            const lockChk = document.getElementById('offboardLockAccount');
            if (lockChk && lockChk.checked && employee.profileId) {
                const { error: roleErr } = await supabaseClient.from('profiles').update({ role: 'disabled' }).eq('id', employee.profileId);
                if (roleErr) { showToast('error', 'تعذّر قفل الحساب', roleErr.message); }
                else { logActivity('Users', 'update', employee.name + ' — قفل الوصول'); }
            }
            closeModal('offboardModal');
            _pendingOffboardEmployee = null;
            await persistEmployee(employee, false);
        }
        function viewEmployee(id){
            var emp = data.employees.find(function(e){ return e.id === id; });
            if(!emp) return;
            var st = emp.status || 'active';
            var stBadge = { active: 'badge-success', onLeave: 'badge-warning', terminated: 'badge-gray' };
            var ctType = emp.contractType || 'permanent';
            var parts = (emp.name||'').trim().split(/\s+/);
            var initials = ((parts[0]||'').charAt(0) + (parts.length>1 ? (parts[parts.length-1]||'').charAt(0) : '')) || '؟';
            var mgrName = emp.managerId ? ((data.employees.find(function(e){ return e.id===emp.managerId; })||{}).name || null) : null;
            var warnHtml = '';
            if (ctType !== 'permanent' && emp.contractEndDate && st === 'active') {
                var days = Math.ceil((new Date(emp.contractEndDate) - new Date()) / 86400000);
                if (days < 0) warnHtml = '<div style="background:rgba(239,68,68,.12);border-inline-start:3px solid #EF4444;color:#EF4444;padding:10px 14px;border-radius:8px;margin:0 0 14px;font-size:13px;font-weight:600;"><i class="fas fa-triangle-exclamation"></i> العقد منتهي منذ '+Math.abs(days)+' يوم — يحتاج قرار تجديد أو إنهاء خدمة</div>';
                else if (days <= 30) warnHtml = '<div style="background:rgba(245,158,11,.14);border-inline-start:3px solid #F59E0B;color:#B45309;padding:10px 14px;border-radius:8px;margin:0 0 14px;font-size:13px;font-weight:600;"><i class="fas fa-clock"></i> العقد ينتهي خلال '+days+' يوم — '+formatDate(emp.contractEndDate)+'</div>';
            }
            function secTitle(icon, txt){ return '<div style="margin:16px 0 4px;font-size:12px;font-weight:700;color:var(--text-muted);letter-spacing:.4px;"><i class="fas '+icon+'" style="margin-inline-end:6px;color:#0B6E4F;"></i>'+txt+'</div>'; }
            function row(icon, label, valueHtml){ return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:.5px solid var(--border-color);"><i class="fas '+icon+'" style="width:18px;color:var(--text-muted);text-align:center;flex-shrink:0;"></i><div style="width:120px;color:var(--text-muted);font-size:13px;flex-shrink:0;">'+label+'</div><div style="flex:1;font-size:14px;word-break:break-word;">'+(valueHtml||'-')+'</div></div>'; }
            var ctLabels = { permanent: t('contractPermanent'), probation: t('contractProbation'), fixedTerm: t('contractFixedTerm') };
            var phoneHtml = emp.phone ? '<a href="tel:'+esc(emp.phone)+'" style="color:#0B6E4F;text-decoration:none;font-weight:600;">'+esc(emp.phone)+' <i class="fas fa-phone" style="font-size:11px;"></i></a>' : '-';
            var emailHtml = emp.email ? '<a href="mailto:'+esc(emp.email)+'" style="color:#0B6E4F;text-decoration:none;font-weight:600;">'+esc(emp.email)+' <i class="fas fa-envelope" style="font-size:11px;"></i></a>' : '-';
            var emergHtml = (emp.emergencyContactName || emp.emergencyContactPhone) ? (esc(emp.emergencyContactName||'') + (emp.emergencyContactPhone ? ' — <a href="tel:'+esc(emp.emergencyContactPhone)+'" style="color:#0B6E4F;text-decoration:none;">'+esc(emp.emergencyContactPhone)+'</a>' : '')) : '-';
            var html =
                '<div style="display:flex;align-items:center;gap:14px;padding:2px 0 14px;">'
                + '<div style="width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#0B6E4F,#16A37A);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;flex-shrink:0;">'+esc(initials)+'</div>'
                + '<div style="min-width:0;">'
                +   '<div style="font-size:18px;font-weight:700;">'+esc(emp.name||'-')+'</div>'
                +   '<div style="font-size:13px;color:var(--text-muted);">'+esc(emp.position||'-')+' — '+esc(emp.department||'-')+' <span style="opacity:.7;">| #'+esc(emp.empId||'-')+'</span></div>'
                +   '<div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap;"><span class="badge '+(stBadge[st]||'badge-gray')+'">'+t('status'+st.charAt(0).toUpperCase()+st.slice(1))+'</span>'+contractBadgeHtml(emp)+'</div>'
                + '</div></div>'
                + warnHtml
                + secTitle('fa-address-book','الاتصال')
                + row('fa-phone','الهاتف', phoneHtml)
                + row('fa-envelope','البريد', emailHtml)
                + secTitle('fa-briefcase','البيانات الوظيفية')
                + row('fa-calendar','تاريخ التعيين', emp.hireDate ? formatDate(emp.hireDate) : '-')
                + row('fa-money-bill-wave','الراتب', emp.salary != null ? formatCurrency(emp.salary) : '-')
                + row('fa-plane-departure','الإجازة السنوية', (emp.annualLeave != null ? emp.annualLeave : 21) + ' يوم')
                + row('fa-user-tie','المدير المباشر', mgrName ? esc(mgrName) : '-')
                + row('fa-file-signature','نوع العقد', esc(ctLabels[ctType]) + ((ctType !== 'permanent' && emp.contractEndDate) ? ' — حتى '+formatDate(emp.contractEndDate) : ''))
                + secTitle('fa-id-card','بيانات إضافية')
                + row('fa-id-badge','الرقم الوطني', emp.nationalId ? esc(emp.nationalId) : '-')
                + row('fa-building-columns','الحساب البنكي', emp.bankAccount ? esc(emp.bankAccount) : '-')
                + row('fa-truck-medical','جهة اتصال الطوارئ', emergHtml)
                + secTitle('fa-folder-open','المستندات')
                + '<div id="empViewDocs" style="padding:6px 0;font-size:12px;color:var(--text-muted);">جارٍ التحميل...</div>'
                + '<div style="display:flex;gap:10px;margin-top:16px;"><button class="btn btn-primary" onclick="closeModal(\'detailsViewModal\');editEmployee(\''+emp.id+'\')"><i class="fas fa-edit"></i> تعديل البيانات</button></div>';
            document.getElementById('detailsViewTitle').textContent = 'بيانات الموظف';
            document.getElementById('detailsViewBody').innerHTML = html;
            openModal('detailsViewModal');
            (async function(){
                var box = document.getElementById('empViewDocs');
                if(!box) return;
                try {
                    var res = await supabaseClient.from('employee_documents').select('*').eq('employee_id', emp.id).order('uploaded_at', {ascending:false});
                    var docs = res.data || [];
                    if(!docs.length){ box.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">لا توجد مستندات مرفوعة</span>'; return; }
                    box.innerHTML = docs.map(function(d){
                        var url = supabaseClient.storage.from('employee-documents').getPublicUrl(d.file_path).data.publicUrl;
                        return '<a href="'+url+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;font-size:13px;text-decoration:none;color:var(--text-primary);margin:0 0 6px 6px;"><i class="fas fa-file-lines" style="color:#0B6E4F;"></i>'+esc(d.name)+'</a>';
                    }).join('');
                } catch(e){ box.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">تعذّر تحميل المستندات</span>'; }
            })();
        }
        function viewLeave(id){ var r=(data.leaves||[]).find(function(x){return x.id===id;}); if(!r) return; var emp=(data.employees||[]).find(function(x){return x.id===r.employeeId;}); showDetailsModal('تفاصيل الإجازة', [['الموظف',esc(emp?emp.name:(r.employeeId||'-'))],['النوع',esc(r.type||'-')],['من',r.fromDate?formatDate(r.fromDate):'-'],['إلى',r.toDate?formatDate(r.toDate):'-'],['الحالة',esc(r.status||'-')]]); }
        function contractBadgeHtml(emp) {
            const ct = emp.contractType || 'permanent';
            const typeLabels = { permanent: t('contractPermanent'), probation: t('contractProbation'), fixedTerm: t('contractFixedTerm') };
            if (ct === 'permanent' || !emp.contractEndDate) return `<span class="badge badge-gray">${typeLabels[ct]}</span>`;
            const days = Math.ceil((new Date(emp.contractEndDate) - new Date()) / 86400000);
            let cls = 'badge-gray', extra = formatDate(emp.contractEndDate);
            if (days < 0) { cls = 'badge-danger'; extra = t('contractExpired'); }
            else if (days <= 30) { cls = 'badge-warning'; extra = t('contractDaysLeft').replace('{days}', days); }
            return `<span class="badge ${cls}" title="${typeLabels[ct]}">${typeLabels[ct]} — ${extra}</span>`;
        }
        function isContractExpiringSoon(emp) {
            if (!emp.contractEndDate || (emp.status||'active') !== 'active') return false;
            const days = Math.ceil((new Date(emp.contractEndDate) - new Date()) / 86400000);
            return days <= 30;
        }
        function renderEmployees() { const tbody = document.getElementById('employeesTableBody'); const filterEl = document.getElementById('empStatusFilter'); const filter = filterEl ? filterEl.value : 'all'; const searchEl = document.getElementById('empNameSearch'); const q = searchEl ? searchEl.value.trim().toLowerCase() : ''; let list = data.employees; if (filter === 'expiringSoon') list = list.filter(isContractExpiringSoon); else if (filter && filter !== 'all') list = list.filter(e => (e.status || 'active') === filter); if (q) list = list.filter(e => ((e.name || '').toLowerCase().includes(q)) || ((e.empId || '').toLowerCase().includes(q))); if (list.length === 0) { tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px;">${t('noData')}</td></tr>`; return; } const badge = { active: 'badge-success', onLeave: 'badge-warning', terminated: 'badge-gray' }; tbody.innerHTML = list.map(emp => { const st = emp.status || 'active'; return `<tr><td style="font-family: var(--font-mono);">${esc(emp.empId)}</td><td>${esc(emp.name)}</td><td>${esc(emp.position || '-')}</td><td>${esc(emp.department || '-')}</td><td>${esc(emp.phone || '-')}</td><td><span class="badge ${badge[st] || 'badge-gray'}">${t('status' + st.charAt(0).toUpperCase() + st.slice(1))}</span></td><td>${contractBadgeHtml(emp)}</td><td><button class="btn btn-sm btn-secondary" onclick="viewEmployee('${emp.id}')" title="عرض"><i class="fas fa-eye"></i></button> <button class="btn btn-sm btn-secondary" onclick="editEmployee('${emp.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${emp.id}')"><i class="fas fa-trash"></i></button></td></tr>`; }).join(''); }
        async function populateEmployeeLinkDropdowns(currentEmpId) {
            const mgrSel = document.getElementById('empManagerId');
            const others = (data.employees||[]).filter(e => e.id !== currentEmpId);
            mgrSel.innerHTML = '<option value="">بدون</option>' + others.map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join('');
            if (!allProfilesCache || allProfilesCache.length === 0) { const { data: profs } = await supabaseClient.from('profiles').select('*').order('full_name'); allProfilesCache = profs || []; }
            const profSel = document.getElementById('empProfileId');
            const linkedElsewhere = new Set((data.employees||[]).filter(e => e.id !== currentEmpId && e.profileId).map(e => e.profileId));
            const avail = (allProfilesCache||[]).filter(p => !linkedElsewhere.has(p.id));
            profSel.innerHTML = '<option value="">بدون (لا يستخدم النظام)</option>' + avail.map(p => `<option value="${p.id}">${esc(p.full_name)} — ${esc(p.employee_code||p.id.slice(0,8))}</option>`).join('');
        }
        async function editEmployee(id) { const emp = data.employees.find(e => e.id === id); if (emp) { document.getElementById('employeeId').value = emp.id; document.getElementById('empId').value = emp.empId; document.getElementById('empName').value = emp.name; document.getElementById('empPosition').value = emp.position; document.getElementById('empDepartment').value = emp.department; document.getElementById('empPhone').value = emp.phone; document.getElementById('empEmail').value = emp.email; document.getElementById('empHireDate').value = emp.hireDate; document.getElementById('empSalary').value = emp.salary; document.getElementById('empAnnualLeave').value = (emp.annualLeave != null ? emp.annualLeave : 21); document.getElementById('empStatus').value = emp.status || 'active'; document.getElementById('empNationalId').value = emp.nationalId || ''; document.getElementById('empBankAccount').value = emp.bankAccount || ''; document.getElementById('empEmergencyName').value = emp.emergencyContactName || ''; document.getElementById('empEmergencyPhone').value = emp.emergencyContactPhone || ''; await populateEmployeeLinkDropdowns(emp.id); document.getElementById('empManagerId').value = emp.managerId || ''; document.getElementById('empProfileId').value = emp.profileId || ''; document.getElementById('empContractType').value = emp.contractType || 'permanent'; document.getElementById('empContractEndDate').value = emp.contractEndDate || ''; toggleContractEndField(); document.getElementById('empDocLabel').value = ''; const df = document.getElementById('empDocFile'); if (df) df.value = ''; document.getElementById('empDocUploadStatus').textContent = ''; loadEmployeeDocuments(emp.id); openModal('employeeModal'); } }
        async function deleteEmployee(id) { if (!(await confirmStyled(t('confirmDelete'), {type:'danger'}))) return; const emp = data.employees.find(e => e.id === id); const { error } = await supabaseClient.from('employees').delete().eq('id', id); if (error) { showToast('error', 'Error', error.message); return; } logActivity('HR', 'delete', emp?.name || id); await loadEmployees(); showToast('success', t('dataDeleted'), ''); }
        async function saveAttendance() { const attendance = {id: generateId(), employeeId: document.getElementById('attendanceEmployee').value, checkIn: document.getElementById('attendanceCheckIn').value, checkOut: document.getElementById('attendanceCheckOut').value, date: document.getElementById('attendanceDate').value || null}; const employee = data.employees.find(e => e.id === attendance.employeeId); const { error } = await supabaseClient.from('attendance').insert(attendance); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Attendance', 'create', employee?.name || 'Unknown'); await loadAttendance(); closeModal('attendanceModal'); showToast('success', t('dataSaved'), ''); }
        function renderAttendance() { const tbody = document.getElementById('attendanceTableBody'); if (data.attendance.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px;">${t('noData')}</td></tr>`; return; } tbody.innerHTML = data.attendance.map(a => { const employee = data.employees.find(e => e.id === a.employeeId); const present = a.checkIn && a.checkOut; return `<tr><td>${formatDate(a.date)}</td><td>${esc(employee?.name || 'Unknown')}</td><td>${esc(a.checkIn || '-')}</td><td>${esc(a.checkOut || '-')}</td><td><span class="badge ${present ? 'badge-success' : 'badge-warning'}">${present ? t('attPresent') : t('attOpen')}</span></td></tr>`; }).join(''); }
        async function saveLeave() { const leave = {id: generateId(), employeeId: document.getElementById('leaveEmployee').value, type: document.getElementById('leaveType').value, fromDate: document.getElementById('leaveFromDate').value || null, toDate: document.getElementById('leaveToDate').value || null, reason: document.getElementById('leaveReason').value, status: 'pending', createdAt: new Date().toISOString()}; const employee = data.employees.find(e => e.id === leave.employeeId); const { error } = await supabaseClient.from('leaves').insert(leave); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Leave', 'create', `${employee?.name || 'Unknown'} - ${t(leave.type)}`); await loadLeaves(); closeModal('leaveModal'); showToast('success', t('dataSaved'), ''); }
        function renderLeaves() { const tbody = document.getElementById('leavesTableBody'); if (data.leaves.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">${t('noData')}</td></tr>`; return; } tbody.innerHTML = data.leaves.map(l => { const employee = data.employees.find(e => e.id === l.employeeId); const statusBadge = {pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger'}[l.status]; const decide = l.status === 'pending' ? `<button class="btn btn-sm btn-secondary" onclick="viewLeave('${l.id}')" title="عرض"><i class="fas fa-eye"></i></button> <button class="btn btn-sm btn-success" onclick="approveLeave('${l.id}','approved')" title="${t('approveAction')}"><i class="fas fa-check"></i></button> <button class="btn btn-sm btn-secondary" onclick="approveLeave('${l.id}','rejected')" title="${t('rejectAction')}"><i class="fas fa-times"></i></button> ` : ''; return `<tr><td>${esc(employee?.name || 'Unknown')}</td><td><span class="badge badge-info">${t(l.type)}</span></td><td>${formatDate(l.fromDate)}</td><td>${formatDate(l.toDate)}</td><td><span class="badge ${statusBadge}">${t('status' + l.status.charAt(0).toUpperCase() + l.status.slice(1))}</span></td><td>${decide}<button class="btn btn-sm btn-danger" onclick="deleteLeave('${l.id}')"><i class="fas fa-trash"></i></button></td></tr>`; }).join(''); }
        function usedAnnualLeave(empId) { return (data.leaves || []).filter(l => l.employeeId === empId && l.type === 'annual' && l.status === 'approved').reduce((s, l) => s + leaveDays(l), 0); }
        function leaveBalance(emp) { const ent = (emp.annualLeave != null && emp.annualLeave !== '') ? (parseFloat(emp.annualLeave) || 0) : 21; const used = usedAnnualLeave(emp.id); return { entitlement: ent, used: used, remaining: ent - used }; }
        function renderLeaveBalances() { const tbody = document.getElementById('leaveBalancesBody'); if (!tbody) return; if (!data.employees || data.employees.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-muted)">${t('noData')}</td></tr>`; return; } tbody.innerHTML = data.employees.map(emp => { const b = leaveBalance(emp); const remColor = b.remaining <= 0 ? 'var(--danger)' : (b.remaining <= 5 ? 'var(--warning)' : 'var(--success)'); return `<tr><td>${esc(emp.name)}</td><td>${b.entitlement} ${t('day')}</td><td>${b.used} ${t('day')}</td><td style="font-weight:600;color:${remColor}">${b.remaining} ${t('day')}</td></tr>`; }).join(''); }
        async function deleteLeave(id) { if (!(await confirmStyled(t('confirmDelete'), {type:'danger'}))) return; const { error } = await supabaseClient.from('leaves').delete().eq('id', id); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Leave', 'delete', id); await loadLeaves(); showToast('success', t('dataDeleted'), ''); }
        async function approveLeave(id, decision) { const leave = data.leaves.find(l => l.id === id); if (decision === 'approved' && leave && leave.type === 'annual') { const emp = data.employees.find(e => e.id === leave.employeeId); if (emp && leaveDays(leave) > leaveBalance(emp).remaining) { if (!(await confirmStyled(t('exceedsBalance'), {type:'warning', okLabel:'موافقة رغم ذلك'}))) return; } } const { error } = await supabaseClient.from('leaves').update({ status: decision }).eq('id', id); if (error) { showToast('error', 'Error', error.message); return; } const employee = data.employees.find(e => e.id === leave?.employeeId); logActivity('Leave', 'update', `${employee?.name || ''} - ${t('status' + decision.charAt(0).toUpperCase() + decision.slice(1))}`); await loadLeaves(); showToast('success', t('decisionRecorded'), ''); }
        async function savePayroll() { const num = id => parseFloat(document.getElementById(id).value) || 0; const basic = num('payrollBasic'), allowances = num('payrollAllowances'), overtime = num('payrollOvertime'), insurance = num('payrollInsurance'), tax = num('payrollTax'), ded = num('payrollDeductions'); const gross = basic + allowances + overtime; const net = gross - insurance - tax - ded; const payroll = {id: generateId(), employeeId: document.getElementById('payrollEmployee').value, month: document.getElementById('payrollMonth').value, basic: basic, allowances: allowances, overtime: overtime, insurance: insurance, tax: tax, deductions: ded, net: net, createdAt: new Date().toISOString()}; const employee = data.employees.find(e => e.id === payroll.employeeId); const { error } = await supabaseClient.from('payroll').insert(payroll); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Payroll', 'create', `${employee?.name || 'Unknown'} - ${payroll.month}`); await loadPayroll(); closeModal('payrollModal'); showToast('success', t('dataSaved'), ''); }
        function fillBasicFromEmployee() {
            const emp = data.employees.find(e => e.id === document.getElementById('payrollEmployee').value);
            const basicInput = document.getElementById('payrollBasic');
            if (emp && basicInput && emp.salary != null && emp.salary !== '') basicInput.value = emp.salary;
        }
        async function loadMyHRInfo() {
            const notLinked = document.getElementById('myHrNotLinked');
            const content = document.getElementById('myHrContent');
            const { data: emps, error } = await supabaseClient.from('employees').select('*').eq('profileId', currentUser.id).limit(1);
            if (error || !emps || !emps.length) { notLinked.style.display = ''; content.style.display = 'none'; return; }
            myHRData.employee = emps[0];
            notLinked.style.display = 'none';
            content.style.display = '';
            const empId = myHRData.employee.id;
            const [payRes, lvRes] = await Promise.all([
                supabaseClient.from('payroll').select('*').eq('employeeId', empId).order('month', { ascending: false }),
                supabaseClient.from('leaves').select('*').eq('employeeId', empId).order('fromDate', { ascending: false })
            ]);
            myHRData.payroll = payRes.data || [];
            myHRData.leaves = lvRes.data || [];
            renderMyHRPage();
        }
        function renderMyHRPage() {
            const emp = myHRData.employee;
            if (!emp) return;
            document.getElementById('myHrInfoBody').innerHTML = `<div style="line-height:2.1;font-size:14px;"><div><strong>${esc(emp.name)}</strong></div><div style="color:var(--text-muted);font-size:13px;">${esc(emp.position||'-')} — ${esc(emp.department||'-')}</div><div style="margin-top:10px;"><i class="fas fa-phone" style="width:18px;color:var(--text-muted);"></i> ${esc(emp.phone||'-')}</div><div><i class="fas fa-envelope" style="width:18px;color:var(--text-muted);"></i> ${esc(emp.email||'-')}</div><div><i class="fas fa-calendar" style="width:18px;color:var(--text-muted);"></i> ${emp.hireDate ? formatDate(emp.hireDate) : '-'}</div></div>`;
            const used = usedAnnualLeave(emp.id);
            const total = emp.annualLeave != null ? emp.annualLeave : 21;
            const remaining = Math.max(0, total - used);
            document.getElementById('myHrLeaveBalanceBody').innerHTML = `<div style="display:flex;justify-content:space-around;text-align:center;"><div><div style="font-size:24px;font-weight:700;color:var(--success);">${remaining}</div><div style="font-size:12px;color:var(--text-muted);">${t('remainingDays')}</div></div><div><div style="font-size:24px;font-weight:700;">${used}</div><div style="font-size:12px;color:var(--text-muted);">${t('usedDays')}</div></div><div><div style="font-size:24px;font-weight:700;">${total}</div><div style="font-size:12px;color:var(--text-muted);">${t('entitlement')}</div></div></div><button class="btn btn-sm btn-primary" style="width:100%;margin-top:14px;" onclick="navigateTo('requests')"><i class="fas fa-plus"></i> ${t('newLeave')}</button>`;
            const payBody = document.getElementById('myHrPayrollBody');
            payBody.innerHTML = myHRData.payroll.length ? myHRData.payroll.map(p => `<tr><td>${esc(p.month)}</td><td style="font-family:var(--font-mono);">${formatCurrency(p.net)}</td><td><button class="btn btn-sm btn-secondary" onclick="showPayslip('${p.id}')"><i class="fas fa-file-invoice"></i> ${t('payslip')}</button></td></tr>`).join('') : `<tr><td colspan="3" style="text-align:center;padding:24px;">${t('noData')}</td></tr>`;
            const lvBody = document.getElementById('myHrLeavesBody');
            const statusBadge = {pending:'badge-warning',approved:'badge-success',rejected:'badge-danger'};
            lvBody.innerHTML = myHRData.leaves.length ? myHRData.leaves.map(l => `<tr><td><span class="badge badge-info">${t(l.type)}</span></td><td>${formatDate(l.fromDate)}</td><td>${formatDate(l.toDate)}</td><td><span class="badge ${statusBadge[l.status]||'badge-gray'}">${t('status'+l.status.charAt(0).toUpperCase()+l.status.slice(1))}</span></td></tr>`).join('') : `<tr><td colspan="4" style="text-align:center;padding:24px;">${t('noData')}</td></tr>`;
        }
        function showPayslip(id) {
            const p = data.payroll.find(x => x.id === id) || myHRData.payroll.find(x => x.id === id);
            if (!p) return;
            const emp = data.employees.find(e => e.id === p.employeeId) || (myHRData.employee && myHRData.employee.id === p.employeeId ? myHRData.employee : {});
            const f = v => formatCurrency(parseFloat(v) || 0);
            const basic = parseFloat(p.basic) || 0, allow = parseFloat(p.allowances) || 0, ot = parseFloat(p.overtime) || 0;
            const ins = parseFloat(p.insurance) || 0, tax = parseFloat(p.tax) || 0, other = parseFloat(p.deductions) || 0;
            const gross = basic + allow + ot, totalDed = ins + tax + other;
            const net = (p.net != null) ? (parseFloat(p.net) || 0) : (gross - totalDed);
            const win = window.open('', '_blank', 'width=820,height=950');
            if (!win) { showToast('error', 'Error', 'Popup blocked'); return; }
            const html = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>كشف راتب</title>'
                + '<style>body{font-family:"Segoe UI",Tahoma,Arial,sans-serif;color:#1F2937;padding:34px;max-width:720px;margin:auto}'
                + '.head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #0B6E4F;padding-bottom:14px;margin-bottom:22px}'
                + 'h1{color:#0B6E4F;margin:0 0 2px;font-size:26px}.sub{color:#6B7280;margin:0}.brand{color:#0B6E4F;font-size:22px;font-weight:bold}.muted{color:#6B7280;font-size:13px}'
                + '.box{border:1px solid #E5E7EB;border-radius:12px;padding:8px 18px;margin-bottom:16px}'
                + 'table{width:100%;border-collapse:collapse}td{padding:9px 4px;border-bottom:1px solid #F1F1F1}tr:last-child td{border-bottom:none}'
                + '.r{text-align:left;font-family:monospace;direction:ltr}.tot td{font-weight:bold;border-top:2px solid #E5E7EB}'
                + '.net{background:#0B6E4F;color:#fff;padding:15px 20px;border-radius:10px;display:flex;justify-content:space-between;font-size:21px;font-weight:bold;align-items:center}'
                + '.noprint{text-align:center;margin-top:22px}button{background:#0B6E4F;color:#fff;border:none;padding:11px 26px;border-radius:8px;font-size:15px;cursor:pointer}'
                + '@media print{.noprint{display:none}}</style></head><body>'
                + '<div class="head"><div><h1>كشف راتب</h1><p class="sub">عن شهر: ' + esc(p.month || '') + '</p></div>'
                + '<div style="text-align:left"><div class="brand">AEECO</div><div class="muted">الوطنية للطاقة والأعمال الهندسية</div></div></div>'
                + '<div class="box"><table>'
                + '<tr><td>اسم الموظف</td><td class="r">' + esc(emp.name || '-') + '</td></tr>'
                + '<tr><td>الوظيفة</td><td class="r">' + esc(emp.position || '-') + '</td></tr>'
                + '<tr><td>القسم</td><td class="r">' + esc(emp.department || '-') + '</td></tr>'
                + '</table></div>'
                + '<div class="box"><table>'
                + '<tr><td>الراتب الأساسي</td><td class="r">' + f(basic) + '</td></tr>'
                + '<tr><td>البدلات</td><td class="r">' + f(allow) + '</td></tr>'
                + '<tr><td>العمل الإضافي</td><td class="r">' + f(ot) + '</td></tr>'
                + '<tr class="tot"><td>الإجمالي</td><td class="r">' + f(gross) + '</td></tr>'
                + '</table></div>'
                + '<div class="box"><table>'
                + '<tr><td>التأمينات</td><td class="r">- ' + f(ins) + '</td></tr>'
                + '<tr><td>الضريبة</td><td class="r">- ' + f(tax) + '</td></tr>'
                + '<tr><td>خصومات أخرى</td><td class="r">- ' + f(other) + '</td></tr>'
                + '<tr class="tot"><td>إجمالي الخصومات</td><td class="r">- ' + f(totalDed) + '</td></tr>'
                + '</table></div>'
                + '<div class="net"><span>صافي الراتب</span><span style="direction:ltr">' + f(net) + '</span></div>'
                + '<p class="muted" style="text-align:center;margin-top:26px">هذا الكشف صادر إلكترونيًا من نظام AEECO ولا يحتاج إلى توقيع.</p>'
                + '<div class="noprint"><button onclick="window.print()">طباعة الكشف</button></div>'
                + '</body></html>';
            win.document.write(html);
            win.document.close();
        }
        function renderPayroll() { const tbody = document.getElementById('payrollTableBody'); if (data.payroll.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">${t('noData')}</td></tr>`; return; } tbody.innerHTML = data.payroll.map(p => { const employee = data.employees.find(e => e.id === p.employeeId); const gross = (parseFloat(p.basic)||0) + (parseFloat(p.allowances)||0) + (parseFloat(p.overtime)||0); const totalDed = (parseFloat(p.insurance)||0) + (parseFloat(p.tax)||0) + (parseFloat(p.deductions)||0); return `<tr><td>${esc(p.month)}</td><td>${esc(employee?.name || 'Unknown')}</td><td style="font-family: var(--font-mono);">${formatCurrency(gross)}</td><td style="font-family: var(--font-mono);">${formatCurrency(totalDed)}</td><td style="font-family: var(--font-mono);">${formatCurrency(p.net)}</td><td><button class="btn btn-sm btn-secondary" onclick="showPayslip('${p.id}')" title="${t('payslip')}"><i class="fas fa-file-invoice"></i></button> <button class="btn btn-sm btn-danger" onclick="deletePayroll('${p.id}')"><i class="fas fa-trash"></i></button></td></tr>`; }).join(''); }
        async function deletePayroll(id) { if (!(await confirmStyled(t('confirmDelete'), {type:'danger'}))) return; const { error } = await supabaseClient.from('payroll').delete().eq('id', id); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Payroll', 'delete', id); await loadPayroll(); showToast('success', t('dataDeleted'), ''); }
        function initApp() { loadData(); data.settings.currency = 'SDG'; data.settings.language = data.settings.language || 'ar'; data.settings.theme = data.settings.theme || 'light'; document.documentElement.setAttribute('data-theme', data.settings.theme); document.documentElement.lang = data.settings.language; document.documentElement.dir = data.settings.language === 'ar' ? 'rtl' : 'ltr'; document.getElementById('themeToggle').innerHTML = data.settings.theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>'; document.querySelectorAll('.lang-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.lang === data.settings.language); }); document.getElementById('themeSelect').value = data.settings.theme; document.getElementById('languageSelect').value = data.settings.language; document.getElementById('currencySelect').value = data.settings.currency; document.getElementById('dateFormatSelect').value = data.settings.dateFormat; document.getElementById('companyName').value = data.settings.companyName; saveData(); translatePage(); renderTickets(); renderEquipment(); renderTransactions(); renderInvoices(); renderAccounts(); renderProducts(); renderSuppliers(); renderStockMovements(); renderEmployees(); renderAttendance(); renderLeaves(); renderPayroll(); renderActivityLog(); updateAccountingStats(); updateInventoryStats(); document.getElementById('statEmployees').textContent = data.employees.length; }
