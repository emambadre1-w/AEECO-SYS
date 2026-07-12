        // ===================== Secretary: Correspondence =====================
        async function loadSecretaryModule() {
            await loadSecretaryCorrespondence();
            await loadSecretaryAppointments();
        }
        async function loadSecretaryCorrespondence() {
            const { data: rows, error } = await supabaseClient.from('secretary_correspondence').select('*').order('corr_date', { ascending: false });
            if (error) { console.warn('secretary_correspondence:', error.message); return; }
            secretaryData.correspondence = rows || [];
            renderSecretaryCorrespondence();
        }
        function renderSecretaryCorrespondence() {
            const tbody = document.getElementById('correspondenceBody');
            if (!tbody) return;
            const dirAr = { incoming: 'وارد', outgoing: 'صادر' };
            const dirBadge = { incoming: 'badge-info', outgoing: 'badge-primary' };
            const statAr = { pending: 'تحت الإجراء', replied: 'تم الرد', closed: 'مغلق', info: 'للعلم' };
            const statBadge = { pending: 'badge-warning', replied: 'badge-success', closed: 'badge-gray', info: 'badge-info' };
            if (!secretaryData.correspondence.length) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px">${t('noData')}</td></tr>`; return; }
            tbody.innerHTML = secretaryData.correspondence.map(c => `<tr><td>${esc(c.corr_date || '-')}</td><td style="font-family:var(--font-mono)">${esc(c.ref_number || '-')}</td><td><span class="badge ${dirBadge[c.direction] || 'badge-info'}">${dirAr[c.direction] || esc(c.direction)}</span></td><td>${esc(c.party)}</td><td>${esc(c.subject)}</td><td><span class="badge ${statBadge[c.status] || 'badge-info'}">${statAr[c.status] || esc(c.status)}</span></td><td>${c.image_path ? `<button class="btn btn-sm btn-secondary" onclick="viewSecretaryImage('${c.image_path}')"><i class="fas fa-image"></i></button>` : '<span style="color:var(--text-muted)">لا يوجد</span>'} <button class="btn btn-sm btn-secondary" onclick="printCorrespondence('${c.id}')" title="طباعة"><i class="fas fa-print"></i></button> <button class="btn btn-sm btn-secondary" onclick="editCorrespondence('${c.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deleteCorrespondence('${c.id}')"><i class="fas fa-trash"></i></button></td></tr>`).join('');
        }
        function openCorrespondenceModal() {
            document.getElementById('correspondenceForm').reset();
            document.getElementById('corrId').value = '';
            document.getElementById('corrUploadStatus').textContent = '';
            document.getElementById('corrDate').value = new Date().toISOString().slice(0, 10);
            openModal('correspondenceModal');
        }
        function editCorrespondence(id) {
            const c = secretaryData.correspondence.find(x => String(x.id) === String(id));
            if (!c) return;
            document.getElementById('corrId').value = c.id;
            document.getElementById('corrRef').value = c.ref_number || '';
            document.getElementById('corrDirection').value = c.direction || 'incoming';
            document.getElementById('corrParty').value = c.party || '';
            document.getElementById('corrDate').value = c.corr_date || '';
            document.getElementById('corrSubject').value = c.subject || '';
            document.getElementById('corrStatus').value = c.status || 'pending';
            document.getElementById('corrNotes').value = c.notes || '';
            document.getElementById('corrUploadStatus').textContent = c.image_path ? 'يوجد مرفق محفوظ (ارفع صورة جديدة لاستبداله)' : '';
            openModal('correspondenceModal');
        }
        async function saveCorrespondence() {
            const btn = document.getElementById('corrSaveBtn');
            btn.disabled = true;
            let imagePath = null;
            const editId = document.getElementById('corrId').value;
            const file = document.getElementById('corrImage').files[0];
            if (file) {
                try { document.getElementById('corrUploadStatus').textContent = 'جاري رفع الصورة...'; imagePath = await uploadSecretaryImage(file, 'correspondence'); document.getElementById('corrUploadStatus').textContent = '✅ تم الرفع'; }
                catch (e) { showToast('error', 'فشل رفع الصورة', e.message); btn.disabled = false; return; }
            }
            if (!file && editId) { const ex = secretaryData.correspondence.find(x => String(x.id) === String(editId)); imagePath = ex ? (ex.image_path || null) : null; }
            const payload = {
                ref_number: document.getElementById('corrRef').value.trim() || null,
                direction: document.getElementById('corrDirection').value,
                party: document.getElementById('corrParty').value.trim(),
                subject: document.getElementById('corrSubject').value.trim(),
                corr_date: document.getElementById('corrDate').value || null,
                status: document.getElementById('corrStatus').value,
                notes: document.getElementById('corrNotes').value.trim() || null,
                image_path: imagePath,
                created_by: currentUser.id
            };
            if (!payload.party || !payload.subject || !payload.corr_date) { showToast('warning', t('fillRequired'), ''); btn.disabled = false; return; }
            let error;
            if (editId) { ({ error } = await supabaseClient.from('secretary_correspondence').update(payload).eq('id', editId)); }
            else { ({ error } = await supabaseClient.from('secretary_correspondence').insert(payload)); }
            btn.disabled = false;
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Secretary', editId ? 'update' : 'create', payload.subject);
            closeModal('correspondenceModal');
            showToast('success', 'تم حفظ الخطاب', '');
            await loadSecretaryCorrespondence();
        }
        async function deleteCorrespondence(id) {
            if (!(await confirmStyled('هل أنت متأكد من حذف هذا الخطاب؟ لا يمكن التراجع.', {type:'danger'}))) return;
            const _corrItem = secretaryData.correspondence.find(x => String(x.id) === String(id));
            const { error } = await supabaseClient.from('secretary_correspondence').delete().eq('id', id);
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Secretary', 'delete', _corrItem ? _corrItem.subject : id);
            showToast('success', 'تم الحذف', '');
            await loadSecretaryCorrespondence();
        }
        async function printCorrespondence(id) {
            const c = secretaryData.correspondence.find(x => String(x.id) === String(id));
            if (!c) return;
            const company = 'شركة الوطنية للطاقة والهندسة المحدودة';
            const now = new Date().toLocaleDateString('ar-SA');
            const logo = AEECO_INVOICE_LOGO;
            const dirAr = { incoming: 'وارد', outgoing: 'صادر' };
            const statAr = { pending: 'تحت الإجراء', replied: 'تم الرد', closed: 'مغلق', info: 'للعلم' };
            const imgHtml = await _sSignedImg(c.image_path);
            const rows = `<tr><th>رقم الخطاب</th><td>${esc(c.ref_number || '-')}</td></tr><tr><th>النوع</th><td>${dirAr[c.direction] || esc(c.direction)}</td></tr><tr><th>الجهة</th><td>${esc(c.party)}</td></tr><tr><th>الموضوع</th><td>${esc(c.subject)}</td></tr><tr><th>التاريخ</th><td>${esc(c.corr_date)}</td></tr><tr><th>الحالة</th><td>${statAr[c.status] || esc(c.status)}</td></tr><tr><th>ملاحظات</th><td>${esc(c.notes || '-')}</td></tr>`;
            const win = window.open('', '_blank');
            win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>خطاب ${esc(c.ref_number || '')}</title><style>${_prPrintCSS()}</style></head><body><div class="head">${logo ? `<img src="${logo}">` : ''}<div class="doc">سجل مراسلة</div></div><table>${rows}</table>${imgHtml}<div class="footer">طُبع من نظام ${esc(company)} — ${now}</div><br><button onclick="window.print()" style="padding:10px 20px;font-size:14px;cursor:pointer">🖨️ طباعة / حفظ PDF</button></body></html>`);
            win.document.close();
        }
        // ===================== Secretary: Appointments =====================
        async function loadSecretaryAppointments() {
            const { data: rows, error } = await supabaseClient.from('secretary_appointments').select('*').order('appt_date', { ascending: true }).order('appt_time', { ascending: true });
            if (error) { console.warn('secretary_appointments:', error.message); return; }
            secretaryData.appointments = rows || [];
            renderSecretaryAppointments();
        }
        function renderSecretaryAppointments() {
            const tbody = document.getElementById('appointmentsBody');
            if (!tbody) return;
            const statAr = { upcoming: 'قادم', done: 'تم', postponed: 'مؤجّل', cancelled: 'ملغى' };
            const statBadge = { upcoming: 'badge-info', done: 'badge-success', postponed: 'badge-warning', cancelled: 'badge-danger' };
            if (!secretaryData.appointments.length) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px">${t('noData')}</td></tr>`; return; }
            const _today = _todayStr(); tbody.innerHTML = secretaryData.appointments.map(a => { const _isToday = a.appt_date === _today; const _isOver = a.appt_date && a.appt_date < _today && a.status === 'upcoming'; const _tag = _isToday ? ' <span class="badge badge-success" style="font-size:10px">اليوم</span>' : (_isOver ? ' <span class="badge badge-danger" style="font-size:10px">فات</span>' : ''); return `<tr><td>${esc(a.appt_date || '-')}${_tag}</td><td style="font-family:var(--font-mono)">${esc(a.appt_time || '-')}</td><td>${esc(a.title)}</td><td>${esc(a.with_party || '-')}</td><td>${esc(a.location || '-')}</td><td><span class="badge ${statBadge[a.status] || 'badge-info'}">${statAr[a.status] || esc(a.status)}</span></td><td><button class="btn btn-sm btn-secondary" onclick="editAppointment('${a.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deleteAppointment('${a.id}')"><i class="fas fa-trash"></i></button></td></tr>`; }).join('');
        }
        function openAppointmentModal() {
            document.getElementById('appointmentForm').reset();
            document.getElementById('apptId').value = '';
            document.getElementById('apptDate').value = new Date().toISOString().slice(0, 10);
            openModal('appointmentModal');
        }
        function editAppointment(id) {
            const a = secretaryData.appointments.find(x => String(x.id) === String(id));
            if (!a) return;
            document.getElementById('apptId').value = a.id;
            document.getElementById('apptTitle').value = a.title || '';
            document.getElementById('apptWith').value = a.with_party || '';
            document.getElementById('apptDate').value = a.appt_date || '';
            document.getElementById('apptTime').value = a.appt_time || '';
            document.getElementById('apptLocation').value = a.location || '';
            document.getElementById('apptStatus').value = a.status || 'upcoming';
            document.getElementById('apptNotes').value = a.notes || '';
            openModal('appointmentModal');
        }
        async function saveAppointment() {
            const title = document.getElementById('apptTitle').value.trim();
            const date = document.getElementById('apptDate').value;
            if (!title || !date) { showToast('warning', t('fillRequired'), ''); return; }
            const payload = {
                title: title,
                with_party: document.getElementById('apptWith').value.trim() || null,
                appt_date: date,
                appt_time: document.getElementById('apptTime').value || null,
                location: document.getElementById('apptLocation').value.trim() || null,
                status: document.getElementById('apptStatus').value,
                notes: document.getElementById('apptNotes').value.trim() || null,
                created_by: currentUser.id
            };
            const editId = document.getElementById('apptId').value;
            let error;
            if (editId) { ({ error } = await supabaseClient.from('secretary_appointments').update(payload).eq('id', editId)); }
            else { ({ error } = await supabaseClient.from('secretary_appointments').insert(payload)); }
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Secretary', editId ? 'update' : 'create', title);
            closeModal('appointmentModal');
            showToast('success', 'تم حفظ الموعد', '');
            await loadSecretaryAppointments();
        }
        async function deleteAppointment(id) {
            if (!(await confirmStyled('هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع.', {type:'danger'}))) return;
            const _apptItem = secretaryData.appointments.find(x => String(x.id) === String(id));
            const { error } = await supabaseClient.from('secretary_appointments').delete().eq('id', id);
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Secretary', 'delete', _apptItem ? _apptItem.title : id);
            showToast('success', 'تم الحذف', '');
            await loadSecretaryAppointments();
        }
