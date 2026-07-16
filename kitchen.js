        async function onAuthSuccess() {
            const { data: sessionData } = await supabaseClient.auth.getSession();
            const user = sessionData.session?.user;
            if (!user) return;
            let { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
            if (!profile) { await new Promise(r => setTimeout(r, 700)); ({ data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single()); }
            currentUser = profile || { id: user.id, full_name: user.email, role: 'employee' };
            document.getElementById('authScreen').classList.add('app-hidden');
            document.getElementById('appContainer').classList.remove('app-hidden');
            applyRoleVisibility();
            updateUserMenu();
            initApp();
            updateUserMenu();
            updateHeaderDate(); showWelcomeGreeting();
            await loadTickets(); if (['gm','admin'].includes(currentUser.role)) { await loadEquipment(); }
            if (['electrical_engineer','gm','admin'].includes(currentUser.role)) { await loadProducts(); await loadSuppliers(); await loadStockMovements(); }
            if (['kitchen','gm','admin'].includes(currentUser.role)) { await loadKitchenModule(); }
            if (['secretary','gm','admin'].includes(currentUser.role)) { await loadSecretaryModule(); }
            if (['accountant','financial_manager','internal_auditor','gm','admin'].includes(currentUser.role)) { await loadTransactions(); await loadInvoices(); await loadAccounts(); }
            if (['hr','gm','admin'].includes(currentUser.role)) { await loadEmployees(); await loadAttendance(); await loadLeaves(); await loadPayroll(); renderAttendanceSummary(); renderHRSummary(); }
            if (['gm','admin'].includes(currentUser.role)) await loadActivityLog();
            await loadRequestsModule();
            if (USERS_PAGE_ROLES.includes(currentUser.role)) await loadUsersModule();
            await loadNotifications();
            initRealtime(); applyWatermark();
            await renderRoleDashboard();
            await renderQuickGlance();
            // التوجيه للصفحة الافتراضية حسب الدور
            let _target = ROLE_DEFAULT_PAGE[currentUser.role] || 'requests';
            try { const _saved = localStorage.getItem('aeeco_last_page'); if (_saved && (ROLE_PAGES[currentUser.role] || []).includes(_saved)) _target = _saved; } catch (e) {}
            checkBackupReminder(); checkMeetingReminder(); navigateTo(_target);
        }
        function renderUsersTable() { const tbody = document.getElementById('usersTableBody'); if (allProfilesCache.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;">${t('noData')}</td></tr>`; return; } const roles = ['employee','hr','accountant','financial_manager','internal_auditor','electrical_engineer','kitchen','secretary','it_support','gm','pr','pm','admin','disabled']; tbody.innerHTML = allProfilesCache.map(p => { const isSelfRow = p.id === currentUser.id; const roleCell = (currentUser.role === 'admin' && !isSelfRow) ? `<select class="form-select" style="padding:6px 10px;font-size:13px;" onchange="changeUserRole('${p.id}', this.value)">${roles.map(r => `<option value="${r}" ${r === p.role ? 'selected' : ''}>${t('role' + r.charAt(0).toUpperCase() + r.slice(1))}</option>`).join('')}</select>` : `<span class="badge badge-info">${t('role' + p.role.charAt(0).toUpperCase() + p.role.slice(1))}</span>${(currentUser.role === 'admin' && isSelfRow) ? ` <i class="fas fa-lock" title="لا يمكنك تغيير دورك بنفسك — استخدم Supabase عند الحاجة" style="font-size:10px;opacity:0.55;margin-inline-start:4px;"></i>` : ''}`; const editNameBtn = currentUser.role === 'admin' ? `<button class="btn btn-sm btn-secondary" onclick="openEditUserName('${p.id}')" title="تعديل البيانات"><i class="fas fa-pen"></i></button>` : ''; const deleteBtn = currentUser.role === 'admin' && p.id !== currentUser.id ? `<button class="btn btn-sm btn-danger" onclick="deleteUserProfile('${p.id}','${p.full_name}')"><i class="fas fa-trash"></i></button>` : ''; const actionsCell = (editNameBtn || deleteBtn) ? (editNameBtn + ' ' + deleteBtn) : '-'; return `<tr><td>${esc(p.full_name)}</td><td>${p.employee_code || '-'}</td><td>${p.department || '-'}</td><td>${roleCell}</td><td>${actionsCell}</td></tr>`; }).join(''); }
        async function renderRoleDashboard() {
            const role = currentUser.role;
            const section = document.getElementById('roleDashboardSection');
            const adminGrid = document.getElementById('adminStatsGrid');
            const adminGrid2 = document.getElementById('adminGrid2');
            if (role === 'admin') { if (adminGrid) adminGrid.style.display = ''; if (adminGrid2) adminGrid2.style.display = ''; section.innerHTML = ''; return; }
            if (adminGrid) adminGrid.style.display = 'none';
            if (adminGrid2) adminGrid2.style.display = 'none';
            if (allRequestsCache.length === 0) { const { data: reqs } = await supabaseClient.from('employee_requests').select('*'); allRequestsCache = reqs || []; }
            if (Object.keys(profilesCache).length === 0) { const { data: profs } = await supabaseClient.from('profiles').select('*'); (profs||[]).forEach(p => profilesCache[p.id] = p); }
            let html = '';
            const income = (data.transactions||[]).filter(tx => tx.type==='income').reduce((s,tx) => s+tx.amount, 0);
            const expenses = (data.transactions||[]).filter(tx => tx.type==='expense').reduce((s,tx) => s+tx.amount, 0);
            if (role === 'employee') {
                const my = allRequestsCache.filter(r => r.requester_id === currentUser.id);
                html = `<div class="role-stats">${roleStatCard(my.length,'إجمالي طلباتي','fa-file-alt','primary')}${roleStatCard(my.filter(r=>r.status==='pending').length,'قيد الانتظار','fa-clock','warning')}${roleStatCard(my.filter(r=>r.status==='approved').length,'معتمدة','fa-check-circle','success')}${roleStatCard(my.filter(r=>r.status==='rejected').length,'مرفوضة','fa-times-circle','danger')}</div><div class="card"><div class="card-header"><h3 class="card-title">آخر طلباتي</h3><button class="btn btn-sm btn-secondary" onclick="navigateTo('requests')">عرض الكل</button></div><div class="card-body"><div class="table-container"><table><thead><tr><th>العنوان</th><th>النوع</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>${my.slice(0,5).map(r=>`<tr><td>${r.title}</td><td><span class="badge badge-info">${t('reqType'+r.type.charAt(0).toUpperCase()+r.type.slice(1))}</span></td><td><span class="badge ${{pending:'badge-warning',approved:'badge-success',rejected:'badge-danger'}[r.status]}">${t('status'+r.status.charAt(0).toUpperCase()+r.status.slice(1))}</span></td><td>${formatDateTime(r.created_at)}</td></tr>`).join('')||`<tr><td colspan="4" style="text-align:center;padding:24px;">${t('noRequests')}</td></tr>`}</tbody></table></div></div></div>`;
            } else if (role === 'hr') {
                const pendingHR = allRequestsCache.filter(r => r.status==='pending' && r.current_stage==='hr');
                html = `<div class="role-stats">${roleStatCard(pendingHR.length,'بانتظار موافقتي','fa-inbox','warning')}${roleStatCard((data.employees||[]).length,'إجمالي الموظفين','fa-users','primary')}${roleStatCard(allRequestsCache.filter(r=>r.type==='leave').length,'طلبات الإجازات','fa-calendar-alt','info')}${roleStatCard((data.tickets||[]).filter(tk=>tk.status==='open').length,'تذاكر IT مفتوحة','fa-ticket-alt','danger')}</div>${rolePendingTable(pendingHR,'طلبات بانتظار موافقة HR')}`;
            } else if (role === 'accountant') {
                const pendingAcc = allRequestsCache.filter(r => r.status==='pending' && r.current_stage==='accountant');
                html = `<div class="role-stats">${roleStatCard(pendingAcc.length,'بانتظار موافقتي','fa-inbox','warning')}${roleStatCard(formatCurrency(income),'إجمالي الإيرادات','fa-arrow-down','success')}${roleStatCard(formatCurrency(expenses),'إجمالي المصروفات','fa-arrow-up','danger')}${roleStatCard(formatCurrency(income-expenses),'الرصيد الصافي','fa-wallet','primary')}</div>${rolePendingTable(pendingAcc,'طلبات بانتظار موافقة المحاسب')}`;
            } else if (role === 'gm') {
                const pendingGM = allRequestsCache.filter(r => r.status==='pending' && r.current_stage==='gm');
                html = `<div class="role-stats">${roleStatCard(pendingGM.length,'بانتظار قراري','fa-inbox','warning')}${roleStatCard(allRequestsCache.filter(r=>r.status==='pending').length,'إجمالي المعلقة','fa-clock','danger')}${roleStatCard(formatCurrency(income),'إجمالي الإيرادات','fa-dollar-sign','success')}${roleStatCard((data.employees||[]).length,'إجمالي الموظفين','fa-users','primary')}</div>${rolePendingTable(pendingGM,'طلبات بانتظار موافقة المدير العام')}`;
            } else if (role === 'pm') {
                if (pmProjects.length === 0) await loadPMModule();
                html = pmRoleDashboard(income, expenses);
            } else if (role === 'pr') {
                if (prData.tasks.length === 0) { const {data:tasks} = await supabaseClient.from('pr_tasks').select('*').order('created_at',{ascending:false}).limit(20); prData.tasks = tasks||[]; }
                if (prData.meetings.length === 0) { const {data:meets} = await supabaseClient.from('pr_meetings').select('*'); prData.meetings = meets||[]; }
                if (prData.invoices.length === 0) { const {data:invs} = await supabaseClient.from('pr_invoices').select('*'); prData.invoices = invs||[]; }
                const today = new Date().toISOString().split('T')[0];
                const wkEnd = new Date(Date.now()+7*24*60*60*1000).toISOString().split('T')[0];
                const openT = prData.tasks.filter(t=>t.status!=='done').length;
                const overdueT = prData.tasks.filter(t=>t.status!=='done'&&t.due_date&&t.due_date<today).length;
                const upMeets = prData.meetings.filter(m=>m.date>=today&&m.date<=wkEnd).length;
                const pendInv = prData.invoices.filter(i=>i.status==='pending').length;
                html = `<div class="role-stats">${roleStatCard(openT,'مهام مفتوحة','fa-tasks','primary')}${roleStatCard(overdueT,'مهام متأخرة','fa-exclamation-circle','danger')}${roleStatCard(upMeets,'اجتماعات هذا الأسبوع','fa-calendar','info')}${roleStatCard(pendInv,'فواتير معلقة','fa-file-invoice','warning')}</div><div class="card"><div class="card-header"><h3 class="card-title">المهام المفتوحة</h3><button class="btn btn-sm btn-secondary" onclick="navigateTo('pr')">عرض الكل</button></div><div class="card-body"><div class="table-container"><table><thead><tr><th>المهمة</th><th>الأولوية</th><th>الحالة</th><th>الاستحقاق</th></tr></thead><tbody>${prData.tasks.filter(t=>t.status!=='done').slice(0,6).map(task=>{const pb={low:'badge-info',medium:'badge-warning',high:'badge-danger'}[task.priority];const pa={low:'منخفضة',medium:'متوسطة',high:'عالية'}[task.priority];const sb={pending:'badge-warning',in_progress:'badge-primary',done:'badge-success'}[task.status];const sa={pending:'انتظار',in_progress:'جاري',done:'مكتمل'}[task.status];const od=task.due_date&&task.due_date<today&&task.status!=='done';return`<tr><td>${task.title}${od?' <span class="badge badge-danger">متأخرة</span>':''}</td><td><span class="badge ${pb}">${pa}</span></td><td><span class="badge ${sb}">${sa}</span></td><td>${task.due_date||'-'}</td></tr>`;}).join('')||`<tr><td colspan="4" style="text-align:center;padding:24px;">${t('noData')}</td></tr>`}</tbody></table></div></div></div>`;
            }
 else if (role === 'kitchen') {
                if (!kitchenData.items.length && !kitchenData.invoices.length) { try { await loadKitchenModule(); } catch(e){} }
                const lowStock = (kitchenData.items||[]).filter(it => it.reorder_level != null && parseFloat(it.quantity||0) <= parseFloat(it.reorder_level));
                const pendingInv = (kitchenData.invoices||[]).filter(i => i.status === 'pending');
                const paidInv = (kitchenData.invoices||[]).filter(i => i.status === 'paid').length;
                html = `<div class="role-stats">${roleStatCard(lowStock.length,'مؤن قاربت تنفد','fa-triangle-exclamation','danger')}${roleStatCard(pendingInv.length,'فواتير معلّقة','fa-file-invoice','warning')}${roleStatCard((kitchenData.items||[]).length,'إجمالي المؤن','fa-box','primary')}${roleStatCard(paidInv,'فواتير مدفوعة','fa-check-circle','success')}</div><div class="card"><div class="card-header"><h3 class="card-title">مؤن قاربت تنفد</h3><button class="btn btn-sm btn-secondary" onclick="navigateTo('kitchen')">عرض الكل</button></div><div class="card-body"><div class="table-container"><table><thead><tr><th>الصنف</th><th>الكمية</th><th>حد الطلب</th></tr></thead><tbody>${lowStock.slice(0,6).map(it=>`<tr><td>${esc(it.name)}</td><td><span class="badge badge-danger">${it.quantity||0}</span></td><td>${it.reorder_level}</td></tr>`).join('')||`<tr><td colspan="3" style="text-align:center;padding:24px;">لا توجد مؤن قاربت تنفد ✓</td></tr>`}</tbody></table></div></div></div>`;
            } else if (role === 'secretary') {
                if (!secretaryData.appointments.length && !secretaryData.correspondence.length) { try { await loadSecretaryModule(); } catch(e){} }
                const today = new Date().toISOString().split('T')[0];
                const appts = secretaryData.appointments||[];
                const corr = secretaryData.correspondence||[];
                const todayAppts = appts.filter(a => a.appt_date === today);
                const upcoming = appts.filter(a => a.appt_date >= today && a.status === 'upcoming');
                const pendingCorr = corr.filter(c => c.status === 'pending');
                html = `<div class="role-stats">${roleStatCard(todayAppts.length,'مواعيد اليوم','fa-calendar-day','primary')}${roleStatCard(upcoming.length,'مواعيد قادمة','fa-calendar','success')}${roleStatCard(pendingCorr.length,'مراسلات تنتظر رد','fa-envelope-open-text','warning')}${roleStatCard(corr.length,'إجمالي المراسلات','fa-folder','primary')}</div><div class="card"><div class="card-header"><h3 class="card-title">المواعيد القادمة</h3><button class="btn btn-sm btn-secondary" onclick="navigateTo('secretary')">عرض الكل</button></div><div class="card-body"><div class="table-container"><table><thead><tr><th>الموعد</th><th>مع</th><th>التاريخ</th><th>الوقت</th></tr></thead><tbody>${upcoming.slice(0,6).map(a=>`<tr><td>${esc(a.title)}${a.appt_date===today?' <span class="badge badge-primary">اليوم</span>':''}</td><td>${esc(a.with_party||'')}</td><td>${a.appt_date||''}</td><td>${a.appt_time||''}</td></tr>`).join('')||`<tr><td colspan="4" style="text-align:center;padding:24px;">لا توجد مواعيد قادمة</td></tr>`}</tbody></table></div></div></div>`;
            } else if (role === 'electrical_engineer') {
                const lowStock = (data.products||[]).filter(it => it.reorder_level != null && parseFloat(it.quantity||0) <= parseFloat(it.reorder_level));
                const openTickets = (data.tickets||[]).filter(t => t.status==='open'||t.status==='in_progress').length;
                html = `<div class="role-stats">${roleStatCard(lowStock.length,'منتجات قاربت تنفد','fa-triangle-exclamation','danger')}${roleStatCard((data.products||[]).length,'إجمالي المنتجات','fa-boxes-stacked','primary')}${roleStatCard((data.stockMovements||[]).length,'حركات المخزون','fa-exchange-alt','success')}${roleStatCard(openTickets,'تذاكر مفتوحة','fa-ticket-alt','warning')}</div><div class="card"><div class="card-header"><h3 class="card-title">منتجات قاربت تنفد</h3><button class="btn btn-sm btn-secondary" onclick="navigateTo('inventory')">عرض الكل</button></div><div class="card-body"><div class="table-container"><table><thead><tr><th>المنتج</th><th>الكمية</th><th>حد الطلب</th></tr></thead><tbody>${lowStock.slice(0,6).map(it=>`<tr><td>${esc(it.name)}</td><td><span class="badge badge-danger">${it.quantity||0}</span></td><td>${it.reorder_level}</td></tr>`).join('')||`<tr><td colspan="3" style="text-align:center;padding:24px;">لا توجد منتجات قاربت تنفد ✓</td></tr>`}</tbody></table></div></div></div>`;
            }
 else if (role === 'it_support') {
                const tks = data.tickets||[];
                const openT = tks.filter(t=>t.status==='open').length;
                const inProg = tks.filter(t=>t.status==='in_progress').length;
                const resolved = tks.filter(t=>t.status==='resolved'||t.status==='closed').length;
                html = `<div class="role-stats">${roleStatCard(openT,'تذاكر مفتوحة','fa-folder-open','danger')}${roleStatCard(inProg,'قيد المعالجة','fa-spinner','warning')}${roleStatCard(resolved,'تم حلّها','fa-check-circle','success')}${roleStatCard(tks.length,'إجمالي التذاكر','fa-ticket-alt','primary')}</div><div class="card"><div class="card-header"><h3 class="card-title">تذاكر تحتاج إجراء</h3><button class="btn btn-sm btn-secondary" onclick="navigateTo('support')">عرض الكل</button></div><div class="card-body"><div class="table-container"><table><thead><tr><th>التذكرة</th><th>الأولوية</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>${tks.filter(t=>t.status==='open'||t.status==='in_progress').slice(0,6).map(tk=>{const pb={low:'badge-gray',medium:'badge-info',high:'badge-warning',critical:'badge-danger'}[tk.priority];const sb={open:'badge-danger',in_progress:'badge-warning',resolved:'badge-success',closed:'badge-gray'}[tk.status];return `<tr><td>${esc(tk.title)}</td><td><span class="badge ${pb}">${t(tk.priority)}</span></td><td><span class="badge ${sb}">${t(tk.status)}</span></td><td>${formatDateTime(tk.createdAt)}</td></tr>`;}).join('')||`<tr><td colspan="4" style="text-align:center;padding:24px;">لا توجد تذاكر مفتوحة ✓</td></tr>`}</tbody></table></div></div></div>`;
            }
            section.innerHTML = html;
        }
        document.querySelector('.nav-item[data-page="kitchen"]').addEventListener('click', () => { if (currentUser) loadKitchenModule(); });
        async function runFullBackup(){
            if (!currentUser || !['gm','admin'].includes(currentUser.role)) { showToast('error', t('accessDenied'), t('accessDeniedMsg')); return; }
            if (typeof XLSX === 'undefined') { showToast('error', 'خطأ', 'مكتبة Excel غير محمّلة، انتظر ثانية وأعد المحاولة'); return; }
            if (typeof supabaseClient === 'undefined' || !supabaseClient) { showToast('error', 'خطأ', 'لا يوجد اتصال بقاعدة البيانات'); return; }
            var btn = document.getElementById('fullBackupBtn');
            var origHtml = btn ? btn.innerHTML : '';
            if (btn) btn.disabled = true;
            var TABLES = ['accounts','activity_log','attendance','employee_documents','employee_requests','employees','equipment','invoices','item_price_catalog','kitchen_bank_notifications','kitchen_expenses','kitchen_invoices','kitchen_items','kitchen_stock_movements','leaves','notifications','payroll','pm_milestones','pm_notes','pm_projects','pm_risks','pm_tasks','pr_bank_notifications','pr_communications','pr_contacts','pr_invoices','pr_meetings','price_catalog_settings','pr_tasks','products','profiles','secretary_appointments','secretary_correspondence','stock_movements','suppliers','tickets','transactions'];
            var wb = XLSX.utils.book_new();
            var okCount = 0, emptyCount = 0, failCount = 0, failedTables = [];
            for (var i=0; i<TABLES.length; i++){
                var tbl = TABLES[i];
                if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري السحب... ('+(i+1)+'/'+TABLES.length+') '+tbl;
                try{
                    var res = await supabaseClient.from(tbl).select('*');
                    if (res.error) {
                        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['تعذّر الوصول لهذا الجدول'],[String((res.error && res.error.message) || res.error)]]), tbl.slice(0,31));
                        failCount++; failedTables.push(tbl);
                    } else if (!res.data || res.data.length===0) {
                        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['لا توجد بيانات']]), tbl.slice(0,31));
                        emptyCount++;
                    } else {
                        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(res.data), tbl.slice(0,31));
                        okCount++;
                    }
                }catch(e){
                    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['خطأ غير متوقع'],[String((e && e.message) || e)]]), tbl.slice(0,31));
                    failCount++; failedTables.push(tbl);
                }
            }
            var now = new Date().toLocaleDateString('ar-EG').replace(/\//g,'-');
            var fn = 'نسخة_احتياطية_AEECO_'+now+'.xlsx';
            XLSX.writeFile(wb, fn);
            if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
            if (failCount>0){
                showToast('error', 'تم الحفظ مع ملاحظات', okCount+' جدول محفوظ، '+emptyCount+' فارغ، ⚠️ '+failCount+' تعذّر الوصول له: '+failedTables.join('، '));
            } else {
                showToast('success', 'تم إنشاء النسخة الاحتياطية', okCount+' جدول به بيانات، '+emptyCount+' جدول فارغ. الملف: '+fn);
            }
        }
        async function refreshData() {
            if (!currentUser) return;
            const r = currentUser.role;
            const btn = document.getElementById('refreshBtn');
            if (btn) btn.classList.add('spinning');
            try {
                await loadTickets(); if (['gm','admin'].includes(r)) { await loadEquipment(); }
                if (['electrical_engineer','gm','admin'].includes(r)) { await loadProducts(); await loadSuppliers(); await loadStockMovements(); }
                if (['accountant','financial_manager','internal_auditor','gm','admin'].includes(r)) { await loadTransactions(); await loadInvoices(); await loadAccounts(); }
                if (['hr','gm','admin'].includes(r)) { await loadEmployees(); await loadAttendance(); await loadLeaves(); await loadPayroll(); renderAttendanceSummary(); renderHRSummary(); }
                if (['gm','admin'].includes(r)) await loadActivityLog();
                if (typeof loadRequestsModule === 'function') await loadRequestsModule();
                if (typeof loadNotifications === 'function') await loadNotifications();
                if (typeof loadPRModule === 'function' && document.getElementById('page-pr')?.classList.contains('active')) await loadPRModule();
                if (typeof loadPMModule === 'function' && document.getElementById('page-pm')?.classList.contains('active')) await loadPMModule();
                if (typeof loadKitchenModule === 'function' && document.getElementById('page-kitchen')?.classList.contains('active')) await loadKitchenModule();
                if (typeof loadSecretaryModule === 'function' && document.getElementById('page-secretary')?.classList.contains('active')) await loadSecretaryModule();
                showToast('success', 'تم التحديث', '');
            } catch (e) { console.warn('refresh:', e); showToast('error', 'خطأ', 'تعذّر التحديث'); }
            if (btn) btn.classList.remove('spinning');
        }
        // ===================== Kitchen tab switching =====================
        document.querySelectorAll('.tab[data-ktab]').forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.stopImmediatePropagation();
                document.querySelectorAll('.tab[data-ktab]').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                activeKitchenTab = this.dataset.ktab;
                document.querySelectorAll('.kitchen-tab-content').forEach(c => c.style.display = 'none');
                document.getElementById(`ktab-${activeKitchenTab}`).style.display = 'block';
            });
        });
        // ===================== Kitchen: Provisions & Stock =====================
        async function loadKitchenItems() {
            const { data: rows, error } = await supabaseClient.from('kitchen_items').select('*').order('name');
            if (error) { console.warn('kitchen_items:', error.message); return; }
            kitchenData.items = rows || [];
            renderKitchenItems();
        }
        async function loadKitchenMovements() {
            const { data: rows, error } = await supabaseClient.from('kitchen_stock_movements').select('*').order('created_at', { ascending: false });
            if (error) { console.warn('kitchen_stock_movements:', error.message); return; }
            kitchenData.movements = rows || [];
            renderKitchenMovements();
        }
        function openKitchenItemModal() {
            document.getElementById('kitchenItemForm').reset();
            document.getElementById('kItemId').value = '';
            document.getElementById('kItemQty').value = '0';
            openModal('kitchenItemModal');
        }
        function editKitchenItem(id) {
            const it = kitchenData.items.find(x => String(x.id) === String(id));
            if (!it) return;
            document.getElementById('kItemId').value = it.id;
            document.getElementById('kItemName').value = it.name || '';
            document.getElementById('kItemUnit').value = it.unit || '';
            document.getElementById('kItemQty').value = it.quantity != null ? it.quantity : 0;
            document.getElementById('kItemReorder').value = it.reorder_level != null ? it.reorder_level : '';
            openModal('kitchenItemModal');
        }
        async function saveKitchenItem() {
            const name = document.getElementById('kItemName').value.trim();
            if (!name) { showToast('warning', t('fillRequired'), ''); return; }
            const rl = document.getElementById('kItemReorder').value;
            const payload = {
                name: name,
                unit: document.getElementById('kItemUnit').value.trim() || null,
                quantity: parseFloat(document.getElementById('kItemQty').value) || 0,
                reorder_level: rl !== '' ? parseFloat(rl) : null,
                created_by: currentUser.id
            };
            const editId = document.getElementById('kItemId').value;
            let error;
            if (editId) { ({ error } = await supabaseClient.from('kitchen_items').update(payload).eq('id', editId)); }
            else { ({ error } = await supabaseClient.from('kitchen_items').insert(payload)); }
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Kitchen', editId ? 'update' : 'create', name);
            showToast('success', 'تم الحفظ', '');
            closeModal('kitchenItemModal');
            await loadKitchenItems();
        }
        async function deleteKitchenItem(id) {
            if (!(await confirmStyled('هل أنت متأكد من حذف هذا الصنف؟ (لن تتأثر سجلات الحركة السابقة) — لا يمكن التراجع.', {type:'danger'}))) return;
            const _kiItem = kitchenData.items.find(x => String(x.id) === String(id));
            const { error } = await supabaseClient.from('kitchen_items').delete().eq('id', id);
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Kitchen', 'delete', _kiItem ? _kiItem.name : id);
            showToast('success', 'تم الحذف', '');
            await loadKitchenItems();
        }
        function openKitchenMovementModal() {
            if (!kitchenData.items.length) { showToast('warning', 'أضف صنفًا أولًا', ''); return; }
            document.getElementById('kitchenMovementForm').reset();
            document.getElementById('kMovItem').innerHTML = kitchenData.items.map(i => `<option value="${i.id}">${esc(i.name)}</option>`).join('');
            document.getElementById('kMovDate').value = new Date().toISOString().slice(0, 10);
            openModal('kitchenMovementModal');
        }
        async function saveKitchenMovement() {
            const itemId = document.getElementById('kMovItem').value;
            const type = document.getElementById('kMovType').value;
            const qty = parseFloat(document.getElementById('kMovQty').value);
            if (!itemId || !(qty > 0)) { showToast('warning', t('fillRequired'), ''); return; }
            const payload = {
                item_id: itemId,
                movement_type: type,
                quantity: qty,
                note: document.getElementById('kMovNote').value.trim() || null,
                movement_date: document.getElementById('kMovDate').value || new Date().toISOString().slice(0, 10),
                created_by: currentUser.id
            };
            const { error } = await supabaseClient.from('kitchen_stock_movements').insert(payload);
            if (error) { showToast('error', 'Error', error.message); return; }
            const it = kitchenData.items.find(x => String(x.id) === String(itemId));
            logActivity('Kitchen', 'create', (it ? it.name : '') + ' — ' + (type === 'in' ? 'إدخال' : 'إخراج'));
            if (it) {
                const newQty = (parseFloat(it.quantity) || 0) + (type === 'in' ? qty : -qty);
                await supabaseClient.from('kitchen_items').update({ quantity: newQty }).eq('id', itemId);
            }
            showToast('success', 'تم الحفظ', '');
            closeModal('kitchenMovementModal');
            await loadKitchenItems();
            await loadKitchenMovements();
        }
        // ===================== Kitchen: Daily Expenses =====================
        async function loadKitchenExpenses() {
            const { data: rows, error } = await supabaseClient.from('kitchen_expenses').select('*').order('expense_date', { ascending: false });
            if (error) { console.warn('kitchen_expenses:', error.message); return; }
            kitchenData.expenses = rows || [];
            renderKitchenExpenses();
        }
        function renderKitchenExpenses() {
            const tbody = document.getElementById('kitchenExpensesBody');
            if (!tbody) return;
            const totalEl = document.getElementById('kExpTotal');
            if (!kitchenData.expenses || !kitchenData.expenses.length) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px">${t('noData')}</td></tr>`;
                if (totalEl) totalEl.textContent = '';
                return;
            }
            const total = kitchenData.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
            const cur = (data.settings && data.settings.currency) || 'SDG';
            if (totalEl) totalEl.textContent = `الإجمالي: ${total.toLocaleString()} ${cur}`;
            tbody.innerHTML = kitchenData.expenses.map(e => `<tr><td>${esc(e.expense_date || '-')}</td><td>${esc(e.description)}${e.note ? ` <span style="color:var(--text-muted);font-size:12px">(${esc(e.note)})</span>` : ''}</td><td><span class="badge badge-info">${K_EXP_CAT[e.category] || esc(e.category || '-')}</span></td><td style="font-family:var(--font-mono)">${(parseFloat(e.amount) || 0).toLocaleString()} ${esc(e.currency || cur)}</td><td><button class="btn btn-sm btn-secondary" onclick="editKitchenExpense('${e.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deleteKitchenExpense('${e.id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        }
        function openKitchenExpenseModal() {
            document.getElementById('kitchenExpenseForm').reset();
            document.getElementById('kExpId').value = '';
            document.getElementById('kExpDate').value = new Date().toISOString().slice(0, 10);
            openModal('kitchenExpenseModal');
        }
        function editKitchenExpense(id) {
            const e = kitchenData.expenses.find(x => String(x.id) === String(id));
            if (!e) return;
            document.getElementById('kExpId').value = e.id;
            document.getElementById('kExpDesc').value = e.description || '';
            document.getElementById('kExpAmount').value = e.amount != null ? e.amount : '';
            document.getElementById('kExpCategory').value = e.category || 'other';
            document.getElementById('kExpDate').value = e.expense_date || new Date().toISOString().slice(0, 10);
            document.getElementById('kExpNote').value = e.note || '';
            openModal('kitchenExpenseModal');
        }
        async function saveKitchenExpense() {
            const desc = document.getElementById('kExpDesc').value.trim();
            const amount = parseFloat(document.getElementById('kExpAmount').value);
            if (!desc || !(amount > 0)) { showToast('warning', t('fillRequired'), ''); return; }
            const payload = {
                description: desc,
                amount: amount,
                currency: (data.settings && data.settings.currency) || 'SDG',
                category: document.getElementById('kExpCategory').value,
                expense_date: document.getElementById('kExpDate').value || new Date().toISOString().slice(0, 10),
                note: document.getElementById('kExpNote').value.trim() || null,
                created_by: currentUser.id
            };
            const editId = document.getElementById('kExpId').value;
            let error;
            if (editId) { ({ error } = await supabaseClient.from('kitchen_expenses').update(payload).eq('id', editId)); }
            else { ({ error } = await supabaseClient.from('kitchen_expenses').insert(payload)); }
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Kitchen', editId ? 'update' : 'create', desc);
            showToast('success', 'تم الحفظ', '');
            closeModal('kitchenExpenseModal');
            await loadKitchenExpenses();
        }
        async function deleteKitchenExpense(id) {
            if (!(await confirmStyled('هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع.', {type:'danger'}))) return;
            const _keItem = kitchenData.expenses.find(x => String(x.id) === String(id));
            const { error } = await supabaseClient.from('kitchen_expenses').delete().eq('id', id);
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Kitchen', 'delete', _keItem ? _keItem.description : id);
            showToast('success', 'تم الحذف', '');
            await loadKitchenExpenses();
        }
        // ===================== Kitchen: Invoices + Bank Notifications =====================
        async function uploadKitchenImage(file, folder) {
            const ext = file.name.split('.').pop();
            const path = `${folder}/${Date.now()}.${ext}`;
            const { data, error } = await supabaseClient.storage.from('kitchen-images').upload(path, file);
            if (error) throw error;
            return data.path;
        }
        async function _kSignedImg(path) {
            if (!path) return '';
            const isImg = /\.(jpg|jpeg|png|webp)$/i.test(path);
            try {
                const { data: u } = await supabaseClient.storage.from('kitchen-images').createSignedUrl(path, 3600);
                if (u && u.signedUrl) {
                    return isImg
                        ? `<div class="imgcap">المستند المرفق:</div><div class="imgwrap"><img src="${u.signedUrl}"></div>`
                        : `<p class="imgcap">المرفق ملف PDF: <a href="${u.signedUrl}" target="_blank">فتح الملف</a></p>`;
                }
            } catch (e) { console.warn('signed url:', e); }
            return '';
        }
        async function viewKitchenImage(path) {
            const el = document.getElementById('prImageViewContent');
            el.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:32px;color:var(--text-muted)"></i>';
            openModal('prImageViewModal');
            const { data } = await supabaseClient.storage.from('kitchen-images').createSignedUrl(path, 3600);
            if (data && data.signedUrl) {
                const isImg = /\.(jpg|jpeg|png|webp)$/i.test(path);
                el.innerHTML = isImg ? `<img src="${data.signedUrl}" style="max-width:100%;max-height:70vh;border-radius:var(--radius-lg);">` : `<a href="${data.signedUrl}" target="_blank" class="btn btn-primary"><i class="fas fa-file-pdf"></i> فتح الملف</a>`;
            } else { el.innerHTML = '<p style="color:var(--text-muted)">تعذّر تحميل المرفق</p>'; }
        }

        async function loadKitchenInvoices() {
            const { data: rows, error } = await supabaseClient.from('kitchen_invoices').select('*').order('date', { ascending: false });
            if (error) { console.warn('kitchen_invoices:', error.message); return; }
            kitchenData.invoices = rows || [];
            renderKitchenInvoices();
        }
        function openKitchenInvoiceModal() {
            document.getElementById('kitchenInvoiceForm').reset();
            document.getElementById('kInvId').value = '';
            document.getElementById('kInvUploadStatus').textContent = '';
            document.getElementById('kInvDate').value = new Date().toISOString().slice(0, 10);
            openModal('kitchenInvoiceModal');
        }
        function editKitchenInvoice(id) {
            const inv = kitchenData.invoices.find(x => String(x.id) === String(id));
            if (!inv) return;
            document.getElementById('kInvId').value = inv.id;
            document.getElementById('kInvNumber').value = inv.number || '';
            document.getElementById('kInvClient').value = inv.client || '';
            document.getElementById('kInvAmount').value = inv.amount != null ? inv.amount : '';
            document.getElementById('kInvStatus').value = inv.status || 'pending';
            document.getElementById('kInvDate').value = inv.date || '';
            document.getElementById('kInvDue').value = inv.due_date || '';
            document.getElementById('kInvDesc').value = inv.description || '';
            document.getElementById('kInvUploadStatus').textContent = inv.image_path ? 'يوجد مرفق محفوظ (ارفع صورة جديدة لاستبداله)' : '';
            openModal('kitchenInvoiceModal');
        }
        async function saveKitchenInvoice() {
            const btn = document.getElementById('kInvSaveBtn');
            btn.disabled = true;
            let imagePath = null;
            const editId = document.getElementById('kInvId').value;
            const file = document.getElementById('kInvImage').files[0];
            if (file) {
                try { document.getElementById('kInvUploadStatus').textContent = 'جاري رفع الصورة...'; imagePath = await uploadKitchenImage(file, 'invoices'); document.getElementById('kInvUploadStatus').textContent = '✅ تم الرفع'; }
                catch (e) { showToast('error', 'فشل رفع الصورة', e.message); btn.disabled = false; return; }
            }
            if (!file && editId) { const ex = kitchenData.invoices.find(x => String(x.id) === String(editId)); imagePath = ex ? (ex.image_path || null) : null; }
            const payload = {
                number: document.getElementById('kInvNumber').value.trim(),
                client: document.getElementById('kInvClient').value.trim(),
                amount: parseFloat(document.getElementById('kInvAmount').value) || 0,
                currency: (data.settings && data.settings.currency) || 'SDG',
                status: document.getElementById('kInvStatus').value,
                date: document.getElementById('kInvDate').value || null,
                due_date: document.getElementById('kInvDue').value || null,
                description: document.getElementById('kInvDesc').value.trim() || null,
                image_path: imagePath,
                created_by: currentUser.id
            };
            if (!payload.number || !payload.client || !payload.date) { showToast('warning', t('fillRequired'), ''); btn.disabled = false; return; }
            let error;
            if (editId) { ({ error } = await supabaseClient.from('kitchen_invoices').update(payload).eq('id', editId)); }
            else { ({ error } = await supabaseClient.from('kitchen_invoices').insert(payload)); }
            btn.disabled = false;
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Kitchen', editId ? 'update' : 'create', payload.number);
            closeModal('kitchenInvoiceModal');
            showToast('success', 'تم حفظ الفاتورة', payload.number);
            await loadKitchenInvoices();
        }
        async function deleteKitchenInvoice(id) {
            if (!(await confirmStyled('هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع.', {type:'danger'}))) return;
            const _kinvItem = kitchenData.invoices.find(x => String(x.id) === String(id));
            const { error } = await supabaseClient.from('kitchen_invoices').delete().eq('id', id);
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Kitchen', 'delete', _kinvItem ? _kinvItem.number : id);
            showToast('success', 'تم الحذف', '');
            await loadKitchenInvoices();
        }
        async function loadKitchenBank() {
            const { data: rows, error } = await supabaseClient.from('kitchen_bank_notifications').select('*').order('date', { ascending: false });
            if (error) { console.warn('kitchen_bank_notifications:', error.message); return; }
            kitchenData.bank = rows || [];
            renderKitchenBank();
        }
        function openKitchenBankModal() {
            document.getElementById('kitchenBankForm').reset();
            document.getElementById('kBankId').value = '';
            document.getElementById('kBankUploadStatus').textContent = '';
            document.getElementById('kBankDate').value = new Date().toISOString().slice(0, 10);
            openModal('kitchenBankModal');
        }
        function editKitchenBank(id) {
            const b = kitchenData.bank.find(x => String(x.id) === String(id));
            if (!b) return;
            document.getElementById('kBankId').value = b.id;
            document.getElementById('kBankName').value = b.bank_name || '';
            document.getElementById('kBankType').value = b.notification_type || 'credit';
            document.getElementById('kBankAmount').value = b.amount != null ? b.amount : '';
            document.getElementById('kBankRef').value = b.reference || '';
            document.getElementById('kBankDate').value = b.date || '';
            document.getElementById('kBankDesc').value = b.description || '';
            document.getElementById('kBankUploadStatus').textContent = b.image_path ? 'يوجد مرفق محفوظ (ارفع صورة جديدة لاستبداله)' : '';
            openModal('kitchenBankModal');
        }
        async function saveKitchenBank() {
            const btn = document.getElementById('kBankSaveBtn');
            btn.disabled = true;
            let imagePath = null;
            const editId = document.getElementById('kBankId').value;
            const file = document.getElementById('kBankImage').files[0];
            if (file) {
                try { document.getElementById('kBankUploadStatus').textContent = 'جاري رفع الصورة...'; imagePath = await uploadKitchenImage(file, 'bank'); document.getElementById('kBankUploadStatus').textContent = '✅ تم الرفع'; }
                catch (e) { showToast('error', 'فشل رفع الصورة', e.message); btn.disabled = false; return; }
            }
            if (!file && editId) { const ex = kitchenData.bank.find(x => String(x.id) === String(editId)); imagePath = ex ? (ex.image_path || null) : null; }
            const payload = {
                bank_name: document.getElementById('kBankName').value.trim(),
                notification_type: document.getElementById('kBankType').value,
                amount: parseFloat(document.getElementById('kBankAmount').value) || null,
                currency: (data.settings && data.settings.currency) || 'SDG',
                reference: document.getElementById('kBankRef').value.trim() || null,
                date: document.getElementById('kBankDate').value || null,
                description: document.getElementById('kBankDesc').value.trim() || null,
                image_path: imagePath,
                created_by: currentUser.id
            };
            if (!payload.bank_name || !payload.date) { showToast('warning', t('fillRequired'), ''); btn.disabled = false; return; }
            let error;
            if (editId) { ({ error } = await supabaseClient.from('kitchen_bank_notifications').update(payload).eq('id', editId)); }
            else { ({ error } = await supabaseClient.from('kitchen_bank_notifications').insert(payload)); }
            btn.disabled = false;
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Kitchen', editId ? 'update' : 'create', payload.bank_name);
            closeModal('kitchenBankModal');
            showToast('success', 'تم حفظ الإشعار', '');
            await loadKitchenBank();
        }
        async function deleteKitchenBank(id) {
            if (!(await confirmStyled('هل أنت متأكد من حذف هذا الإشعار؟ لا يمكن التراجع.', {type:'danger'}))) return;
            const _kbItem = kitchenData.bank.find(x => String(x.id) === String(id));
            const { error } = await supabaseClient.from('kitchen_bank_notifications').delete().eq('id', id);
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Kitchen', 'delete', _kbItem ? _kbItem.bank_name : id);
            showToast('success', 'تم الحذف', '');
            await loadKitchenBank();
        }
        function openAddUserModal() {
            document.getElementById('addUserForm').reset();
            const roles = ['employee','hr','accountant','financial_manager','internal_auditor','electrical_engineer','kitchen','secretary','it_support','gm','pr','pm','admin'];
            document.getElementById('auRole').innerHTML = roles.map(r => `<option value="${r}">${t('role' + r.charAt(0).toUpperCase() + r.slice(1))}</option>`).join('');
            generateAuPassword();
            document.getElementById('auStatus').textContent = '';
            const btn = document.getElementById('auSubmitBtn'); btn.disabled = false; btn.textContent = t('save');
            openModal('addUserModal');
        }
