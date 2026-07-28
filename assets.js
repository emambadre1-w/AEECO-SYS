        // ===================== الأصول الثابتة =====================
        let assetsCache = [];

        // حساب الإهلاك بطريقة القسط الثابت
        // الإهلاك السنوي = (التكلفة − القيمة التخريدية) ÷ العمر الإنتاجي
        function computeAssetDepreciation(a, asOf) {
            const cost = parseFloat(a.cost) || 0;
            const salvage = parseFloat(a.salvage_value) || 0;
            const life = parseInt(a.useful_life_years, 10) || 0;
            const base = Math.max(0, cost - salvage);
            const out = { annual: 0, accumulated: 0, nbv: cost, monthsElapsed: 0, fullyDepreciated: false };
            if (life <= 0 || base <= 0 || !a.purchase_date) return out;
            const start = new Date(a.purchase_date);
            const now = asOf ? new Date(asOf) : new Date();
            if (isNaN(start.getTime()) || now < start) return out;
            let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
            if (now.getDate() < start.getDate()) months -= 1;
            months = Math.max(0, months);
            const annual = base / life;
            let accumulated = annual * (months / 12);
            if (accumulated >= base) { accumulated = base; out.fullyDepreciated = true; }
            out.annual = annual;
            out.accumulated = accumulated;
            out.nbv = cost - accumulated;
            out.monthsElapsed = months;
            return out;
        }

        function assetCategoryLabel(k) {
            const m = { vehicle:'assetVehicle', machinery:'assetMachinery', device:'assetDevice', furniture:'assetFurniture', building:'assetBuilding', land:'assetLand', other:'other' };
            return t(m[k] || 'other');
        }
        function assetStatusBadge(s) {
            const m = { active:'badge-success', maintenance:'badge-warning', sold:'badge-info', written_off:'badge-gray' };
            const lbl = { active:'statusActive', maintenance:'maintenance', sold:'assetSold', written_off:'assetWrittenOff' };
            return '<span class="badge ' + (m[s] || 'badge-gray') + '">' + t(lbl[s] || 'statusActive') + '</span>';
        }
        // الأصول المستبعدة من الإجماليات (خرجت من ملكية الشركة)
        function assetIsOnBooks(a) { return (a.status || 'active') !== 'sold' && (a.status || 'active') !== 'written_off'; }

        async function loadAssets() {
            try {
                const { data: rows, error } = await supabaseClient.from('fixed_assets').select('*').order('purchase_date', { ascending: false });
                if (error) console.warn('fixed_assets:', error.message);
                else assetsCache = rows || [];
            } catch (e) { console.warn('fixed_assets:', e); }
            renderAssets();
            renderAssetsSummary();
        }

        function renderAssetsSummary() {
            const onBooks = assetsCache.filter(assetIsOnBooks);
            let cost = 0, dep = 0;
            onBooks.forEach(a => { const d = computeAssetDepreciation(a); cost += parseFloat(a.cost) || 0; dep += d.accumulated; });
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
            set('asSumCount', String(onBooks.length));
            set('asSumCost', formatCurrency(cost));
            set('asSumDep', formatCurrency(dep));
            set('asSumNBV', formatCurrency(cost - dep));
        }

        function renderAssets() {
            const tbody = document.getElementById('assetsTableBody');
            if (!tbody) return;
            const q = (document.getElementById('assetSearch') || {}).value || '';
            const cat = (document.getElementById('assetCategoryFilter') || {}).value || 'all';
            const st = (document.getElementById('assetStatusFilter') || {}).value || 'all';
            let list = assetsCache.slice();
            if (cat !== 'all') list = list.filter(a => a.category === cat);
            if (st !== 'all') list = list.filter(a => (a.status || 'active') === st);
            const ql = q.trim().toLowerCase();
            if (ql) list = list.filter(a => ((a.name || '').toLowerCase().includes(ql)) || ((a.code || '').toLowerCase().includes(ql)));
            if (!list.length) { tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px">${t('noData')}</td></tr>`; return; }
            const canEdit = canEditAccounting();
            tbody.innerHTML = list.map(a => {
                const d = computeAssetDepreciation(a);
                const dim = assetIsOnBooks(a) ? '' : ' style="opacity:.6"';
                const fullTag = d.fullyDepreciated ? ' <span class="badge badge-gray" style="font-size:10px">مُهلك بالكامل</span>' : '';
                return `<tr${dim}><td style="font-family:var(--font-mono)">${esc(a.code || '-')}</td><td>${esc(a.name)}${fullTag}</td><td>${assetCategoryLabel(a.category)}</td><td>${a.purchase_date ? formatDate(a.purchase_date) : '-'}</td><td style="font-family:var(--font-mono)">${formatCurrency(a.cost)}</td><td style="font-family:var(--font-mono);color:var(--danger)">${formatCurrency(d.accumulated)}</td><td style="font-family:var(--font-mono);font-weight:700;color:var(--success)">${formatCurrency(d.nbv)}</td><td>${assetStatusBadge(a.status || 'active')}</td><td><button class="btn btn-sm btn-secondary" onclick="viewAsset('${a.id}')" title="عرض"><i class="fas fa-eye"></i></button>${canEdit ? ` <button class="btn btn-sm btn-secondary" onclick="editAsset('${a.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deleteAsset('${a.id}')"><i class="fas fa-trash"></i></button>` : ''}</td></tr>`;
            }).join('');
        }

        function onAssetCategoryChange() {
            const cat = document.getElementById('asCategory').value;
            if (cat === 'land') document.getElementById('asLife').value = 0;
            renderAssetDepPreview();
        }

        function renderAssetDepPreview() {
            const box = document.getElementById('asDepPreview');
            if (!box) return;
            const draft = {
                cost: document.getElementById('asCost').value,
                salvage_value: document.getElementById('asSalvage').value,
                useful_life_years: document.getElementById('asLife').value,
                purchase_date: document.getElementById('asPurchaseDate').value
            };
            const life = parseInt(draft.useful_life_years, 10) || 0;
            if (life <= 0) { box.innerHTML = '<i class="fas fa-circle-info"></i> لا يُحتسب إهلاك لهذا الأصل (العمر الإنتاجي = 0).'; return; }
            const d = computeAssetDepreciation(draft);
            box.innerHTML = '<b>الإهلاك المحتسب تلقائيًا:</b> ' + formatCurrency(d.annual) + ' سنويًا · مجمع الإهلاك حتى اليوم ' + formatCurrency(d.accumulated) + ' · القيمة الدفترية ' + formatCurrency(d.nbv) + (d.fullyDepreciated ? ' <b>(مُهلك بالكامل)</b>' : '');
        }

        async function populateAssetEmployeeDropdown() {
            const sel = document.getElementById('asEmployeeId');
            if (!sel) return;
            let emps = (data.employees || []);
            if (!emps.length) {
                try { const { data: rows } = await supabaseClient.from('employees').select('id,name,status').order('name'); emps = rows || []; } catch (e) { emps = []; }
            }
            const active = emps.filter(e => (e.status || 'active') !== 'terminated');
            sel.innerHTML = '<option value="">بدون</option>' + active.map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join('');
        }

        async function openAddAssetModal() {
            document.getElementById('assetForm').reset();
            document.getElementById('assetId').value = '';
            document.getElementById('asSalvage').value = 0;
            await populateAssetEmployeeDropdown();
            document.getElementById('asDocLabel').value = '';
            const df = document.getElementById('asDocFile'); if (df) df.value = '';
            document.getElementById('asDocStatus').textContent = '';
            document.getElementById('asDocsList').innerHTML = '<div style="font-size:12px;color:var(--text-muted)">احفظ الأصل أولاً قبل إضافة مستندات</div>';
            renderAssetDepPreview();
            openModal('assetModal');
        }

        async function editAsset(id) {
            const a = assetsCache.find(x => String(x.id) === String(id));
            if (!a) return;
            document.getElementById('assetId').value = a.id;
            document.getElementById('asCode').value = a.code || '';
            document.getElementById('asName').value = a.name || '';
            document.getElementById('asCategory').value = a.category || 'other';
            document.getElementById('asStatus').value = a.status || 'active';
            document.getElementById('asPurchaseDate').value = a.purchase_date || '';
            document.getElementById('asCost').value = a.cost != null ? a.cost : '';
            document.getElementById('asLife').value = a.useful_life_years != null ? a.useful_life_years : '';
            document.getElementById('asSalvage').value = a.salvage_value != null ? a.salvage_value : 0;
            document.getElementById('asLocation').value = a.location || '';
            document.getElementById('asNotes').value = a.notes || '';
            await populateAssetEmployeeDropdown();
            document.getElementById('asEmployeeId').value = a.employee_id || '';
            document.getElementById('asDocLabel').value = '';
            const df = document.getElementById('asDocFile'); if (df) df.value = '';
            document.getElementById('asDocStatus').textContent = '';
            renderAssetDepPreview();
            loadAssetDocuments(a.id);
            openModal('assetModal');
        }

        async function saveAsset() {
            const id = document.getElementById('assetId').value || generateId();
            const isNew = !document.getElementById('assetId').value;
            const name = document.getElementById('asName').value.trim();
            const code = document.getElementById('asCode').value.trim();
            const cost = parseFloat(document.getElementById('asCost').value);
            const purchase = document.getElementById('asPurchaseDate').value || null;
            if (!name || !code || !purchase || !(cost >= 0)) { showToast('warning', t('fillRequired'), ''); return; }
            const salvage = parseFloat(document.getElementById('asSalvage').value) || 0;
            if (salvage > cost) { showToast('warning', 'قيمة غير منطقية', 'القيمة التخريدية أكبر من تكلفة الشراء'); return; }
            const asset = {
                id: id,
                code: code,
                name: name,
                category: document.getElementById('asCategory').value,
                status: document.getElementById('asStatus').value,
                purchase_date: purchase,
                cost: cost,
                useful_life_years: parseInt(document.getElementById('asLife').value, 10) || 0,
                salvage_value: salvage,
                location: document.getElementById('asLocation').value.trim() || null,
                employee_id: document.getElementById('asEmployeeId').value || null,
                notes: document.getElementById('asNotes').value.trim() || null,
                created_at: isNew ? new Date().toISOString() : ((assetsCache.find(x => x.id === id) || {}).created_at || new Date().toISOString())
            };
            const { error } = await supabaseClient.from('fixed_assets').upsert(asset);
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Assets', isNew ? 'create' : 'update', asset.name);
            await loadAssets();
            closeModal('assetModal');
            showToast('success', t('dataSaved'), asset.name);
        }

        async function deleteAsset(id) {
            const a = assetsCache.find(x => String(x.id) === String(id));
            if (!a) return;
            if (!(await confirmStyled('حذف الأصل "' + (a.name || '') + '" نهائيًا؟\nإن كان الأصل قد بيع أو شُطب، الأفضل تغيير حالته بدل حذفه للحفاظ على السجل.', {type:'danger'}))) return;
            const { error } = await supabaseClient.from('fixed_assets').delete().eq('id', id);
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Assets', 'delete', a.name || id);
            await loadAssets();
            showToast('success', t('dataDeleted'), '');
        }

        function viewAsset(id) {
            const a = assetsCache.find(x => String(x.id) === String(id));
            if (!a) return;
            const d = computeAssetDepreciation(a);
            const emp = (data.employees || []).find(e => e.id === a.employee_id);
            const rows = [
                ['الكود', esc(a.code || '-')],
                ['اسم الأصل', esc(a.name || '-')],
                ['الفئة', assetCategoryLabel(a.category)],
                ['الحالة', assetStatusBadge(a.status || 'active')],
                ['تاريخ الشراء', a.purchase_date ? formatDate(a.purchase_date) : '-'],
                ['تكلفة الشراء', formatCurrency(a.cost)],
                ['العمر الإنتاجي', (a.useful_life_years || 0) > 0 ? (a.useful_life_years + ' سنة') : 'لا يُهلك'],
                ['القيمة التخريدية', formatCurrency(a.salvage_value || 0)],
                ['الإهلاك السنوي', formatCurrency(d.annual)],
                ['مجمع الإهلاك حتى اليوم', formatCurrency(d.accumulated) + (d.fullyDepreciated ? ' (مُهلك بالكامل)' : '')],
                ['صافي القيمة الدفترية', '<b>' + formatCurrency(d.nbv) + '</b>'],
                ['الموقع', esc(a.location || '-')],
                ['المسؤول عنه', emp ? esc(emp.name) : '-'],
                ['ملاحظات', esc(a.notes || '-')]
            ];
            showDetailsModal('بيانات الأصل', rows);
        }

        // ---------- مستندات الأصل ----------
        async function loadAssetDocuments(assetId) {
            const box = document.getElementById('asDocsList');
            if (!box) return;
            if (!assetId) { box.innerHTML = ''; return; }
            box.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">جارٍ التحميل...</div>';
            const { data: docs, error } = await supabaseClient.from('asset_documents').select('*').eq('asset_id', assetId).order('uploaded_at', { ascending: false });
            if (error) { box.innerHTML = '<div style="font-size:12px;color:var(--danger)">تعذّر تحميل المستندات</div>'; return; }
            if (!docs || !docs.length) { box.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">لا توجد مستندات مرفوعة</div>'; return; }
            box.innerHTML = docs.map(dd => {
                const url = supabaseClient.storage.from('asset-documents').getPublicUrl(dd.file_path).data.publicUrl;
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg-secondary);border-radius:6px;margin-bottom:6px"><a href="${url}" target="_blank" rel="noopener" style="font-size:13px;color:var(--text-primary);text-decoration:none"><i class="fas fa-file-lines" style="color:#0B6E4F"></i> ${esc(dd.name)}</a><button type="button" class="btn btn-sm btn-danger" onclick="deleteAssetDocument('${dd.id}','${dd.asset_id}')"><i class="fas fa-trash"></i></button></div>`;
            }).join('');
        }

        async function uploadAssetDocument() {
            const assetId = document.getElementById('assetId').value;
            if (!assetId) { showToast('warning', 'احفظ الأصل أولاً', 'ثم عاود فتح التعديل لإضافة مستندات'); return; }
            const label = document.getElementById('asDocLabel').value.trim();
            const fileInput = document.getElementById('asDocFile');
            const file = fileInput && fileInput.files[0];
            if (!file) { showToast('warning', 'اختر ملف أولاً', ''); return; }
            if (!label) { showToast('warning', 'اكتب اسم المستند', 'مثال: فاتورة الشراء'); return; }
            const status = document.getElementById('asDocStatus');
            status.textContent = 'جارٍ الرفع...';
            try {
                const ext = file.name.split('.').pop();
                const path = assetId + '/' + Date.now() + '.' + ext;
                const up = await supabaseClient.storage.from('asset-documents').upload(path, file);
                if (up.error) throw up.error;
                const ins = await supabaseClient.from('asset_documents').insert({ id: generateId(), asset_id: assetId, name: label, file_path: path, uploaded_at: new Date().toISOString(), uploaded_by: currentUser.id });
                if (ins.error) throw ins.error;
                logActivity('Assets', 'create', 'مستند: ' + label);
                document.getElementById('asDocLabel').value = '';
                fileInput.value = '';
                status.textContent = '';
                await loadAssetDocuments(assetId);
                showToast('success', t('dataSaved'), label);
            } catch (e) {
                status.textContent = '';
                showToast('error', 'تعذّر رفع المستند', e.message || '');
            }
        }

        async function deleteAssetDocument(id, assetId) {
            if (!(await confirmStyled('هل أنت متأكد من حذف هذا المستند؟', {type:'danger'}))) return;
            const { error } = await supabaseClient.from('asset_documents').delete().eq('id', id);
            if (error) { showToast('error', 'Error', error.message); return; }
            logActivity('Assets', 'delete', 'مستند أصل');
            await loadAssetDocuments(assetId);
            showToast('success', t('dataDeleted'), '');
        }

        // ---------- تقرير الأصول للمراجع ----------
        function printAssetsReport() {
            const onBooks = assetsCache.filter(assetIsOnBooks);
            const company = 'شركة الوطنية للطاقة والهندسة المحدودة';
            const now = new Date().toLocaleDateString('ar-EG');
            const logo = AEECO_INVOICE_LOGO;
            let tCost = 0, tDep = 0;
            const rows = onBooks.map(a => {
                const d = computeAssetDepreciation(a);
                tCost += parseFloat(a.cost) || 0;
                tDep += d.accumulated;
                return '<tr><td>' + esc(a.code || '-') + '</td><td>' + esc(a.name) + '</td><td>' + assetCategoryLabel(a.category) + '</td><td>' + (a.purchase_date ? formatDate(a.purchase_date) : '-') + '</td><td>' + formatCurrency(a.cost) + '</td><td>' + ((a.useful_life_years || 0) > 0 ? a.useful_life_years : '—') + '</td><td>' + formatCurrency(d.annual) + '</td><td>' + formatCurrency(d.accumulated) + '</td><td><b>' + formatCurrency(d.nbv) + '</b></td></tr>';
            }).join('');
            const totalRow = '<tr style="font-weight:bold;background:#f2f2f2"><td colspan="4">الإجمالي</td><td>' + formatCurrency(tCost) + '</td><td>—</td><td>—</td><td>' + formatCurrency(tDep) + '</td><td>' + formatCurrency(tCost - tDep) + '</td></tr>';
            const win = window.open('', '_blank');
            win.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>سجل الأصول الثابتة</title><style>' + _prPrintCSS() + ' th{width:auto;text-align:center}td{text-align:center}</style></head><body><div class="head"><img src="' + logo + '"><div class="doc">سجل الأصول الثابتة</div></div><p style="font-size:12px;color:#666;margin:0 0 10px">طريقة الإهلاك: القسط الثابت · كما في ' + now + ' · الأصول المباعة والمشطوبة غير مدرجة</p><table><thead><tr><th>الكود</th><th>اسم الأصل</th><th>الفئة</th><th>تاريخ الشراء</th><th>التكلفة</th><th>العمر (سنة)</th><th>الإهلاك السنوي</th><th>مجمع الإهلاك</th><th>القيمة الدفترية</th></tr></thead><tbody>' + rows + totalRow + '</tbody></table><div class="footer">طُبع من نظام ' + esc(company) + ' — ' + now + '</div><br><button onclick="window.print()" style="padding:10px 20px;font-size:14px;cursor:pointer">🖨️ طباعة / حفظ PDF</button></body></html>');
            win.document.close();
        }
