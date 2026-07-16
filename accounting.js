        async function loadTransactions() { try { const { data: rows, error } = await supabaseClient.from('transactions').select('*').order('date', { ascending: false }); if (error) console.warn('transactions:', error.message); else data.transactions = rows || []; } catch (e) { console.warn('transactions:', e); } renderTransactions(); updateAccountingStats(); if (document.getElementById('accountsTableBody')) renderAccounts(); renderAccountingReports(); }
        async function loadInvoices() { try { const { data: rows, error } = await supabaseClient.from('invoices').select('*').order('date', { ascending: false }); if (error) console.warn('invoices:', error.message); else data.invoices = rows || []; } catch (e) { console.warn('invoices:', e); } renderInvoices(); renderAccountingReports(); }
        async function loadAccounts() { try { const { data: rows, error } = await supabaseClient.from('accounts').select('*').order('createdAt', { ascending: false }); if (error) console.warn('accounts:', error.message); else data.accounts = rows || []; } catch (e) { console.warn('accounts:', e); } renderAccounts(); refreshAccountDropdown(); }
        function computeAccountBalance(acc) { const opening = parseFloat(acc.balance) || 0; const txns = (data.transactions || []).filter(t => t.accountId === acc.id); const inc = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0); const exp = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0); return opening + inc - exp; }
        function refreshAccountDropdown() { const sel = document.getElementById('transactionAccount'); if (!sel) return; const cur = sel.value; sel.innerHTML = `<option value="">${t('noAccount')}</option>` + (data.accounts || []).map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join(''); sel.value = cur; }

        function canEditAccounting() { return !(currentUser && currentUser.role === 'internal_auditor'); }
        function printInvoice(id) {
            const inv = (data.invoices||[]).find(x => String(x.id) === String(id));
            if (!inv) return;
            const company = 'شركة الوطنية للطاقة والهندسة المحدودة';
            const now = new Date().toLocaleDateString('ar-EG');
            const logo = AEECO_INVOICE_LOGO;
            const statAr = {pending:'قيد الانتظار',paid:'مدفوعة',overdue:'متأخرة',cancelled:'ملغاة',unpaid:'غير مدفوعة'};
            const amount = (parseFloat(inv.amount) || 0).toLocaleString();
            const rows = `<tr><th>رقم الفاتورة</th><td>${esc(inv.number||'-')}</td></tr><tr><th>العميل</th><td>${esc(inv.client||'-')}</td></tr><tr><th>المبلغ</th><td>${amount}</td></tr><tr><th>الحالة</th><td>${statAr[inv.status] || esc(inv.status||'-')}</td></tr><tr><th>التاريخ</th><td>${esc(inv.date||'-')}</td></tr><tr><th>تاريخ الاستحقاق</th><td>${esc(inv.dueDate||'-')}</td></tr><tr><th>ملاحظات</th><td>${esc(inv.notes||'-')}</td></tr>`;
            const win = window.open('', '_blank');
            win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة ${esc(inv.number||'')}</title><style>${_prPrintCSS()}</style></head><body><div class="head"><img src="${logo}"><div class="doc">فاتورة</div></div><table>${rows}</table><div class="footer">طُبع من نظام ${esc(company)} — ${now}</div><br><button onclick="window.print()" style="padding:10px 20px;font-size:14px;cursor:pointer">🖨️ طباعة / حفظ PDF</button></body></html>`);
            win.document.close();
        }
        async function loadKitchenModule() {
            await loadKitchenItems();
            await loadKitchenMovements();
            await loadKitchenExpenses();
            await loadKitchenInvoices();
            await loadKitchenBank();
        }
        // ---------- Invoices ----------
        function renderKitchenInvoices() {
            const tbody = document.getElementById('kitchenInvoicesBody');
            if (!tbody) return;
            const statL = { pending: 'badge-warning', paid: 'badge-success', overdue: 'badge-danger', cancelled: 'badge-info' };
            const statAr = { pending: 'انتظار', paid: 'مدفوعة', overdue: 'متأخرة', cancelled: 'ملغاة' };
            if (!kitchenData.invoices || !kitchenData.invoices.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px">${t('noData')}</td></tr>`; return; }
            const _today = _todayStr(); tbody.innerHTML = kitchenData.invoices.map(inv => { const _isOver = inv.due_date && inv.due_date < _today && inv.status !== 'paid' && inv.status !== 'cancelled'; const _od = _isOver ? ' <span class="badge badge-danger" style="font-size:10px">⚠ متأخرة</span>' : ''; return `<tr><td style="font-family:var(--font-mono)">${esc(inv.number)}</td><td>${esc(inv.client)}</td><td style="font-family:var(--font-mono)">${(parseFloat(inv.amount) || 0).toLocaleString()} ${esc(inv.currency)}</td><td><span class="badge ${statL[inv.status] || 'badge-info'}">${statAr[inv.status] || esc(inv.status)}</span>${_od}</td><td>${esc(inv.date)}</td><td>${inv.image_path ? `<button class="btn btn-sm btn-secondary" onclick="viewKitchenImage('${inv.image_path}')"><i class="fas fa-image"></i></button>` : '<span style="color:var(--text-muted)">لا يوجد</span>'} <button class="btn btn-sm btn-secondary" onclick="printKitchenInvoice('${inv.id}')" title="طباعة"><i class="fas fa-print"></i></button> <button class="btn btn-sm btn-secondary" onclick="editKitchenInvoice('${inv.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deleteKitchenInvoice('${inv.id}')"><i class="fas fa-trash"></i></button></td></tr>`; }).join('');
        }
        async function printKitchenInvoice(id) {
            const inv = kitchenData.invoices.find(x => String(x.id) === String(id));
            if (!inv) return;
            const company = 'شركة الوطنية للطاقة والهندسة المحدودة';
            const now = new Date().toLocaleDateString('ar-SA');
            const logo = AEECO_INVOICE_LOGO;
            const statAr = { pending: 'انتظار', paid: 'مدفوعة', overdue: 'متأخرة', cancelled: 'ملغاة' };
            const imgHtml = await _kSignedImg(inv.image_path);
            const amount = (parseFloat(inv.amount) || 0).toLocaleString();
            const rows = `<tr><th>رقم الفاتورة</th><td>${esc(inv.number)}</td></tr><tr><th>العميل</th><td>${esc(inv.client)}</td></tr><tr><th>المبلغ</th><td>${amount} ${esc(inv.currency)}</td></tr><tr><th>الحالة</th><td>${statAr[inv.status] || esc(inv.status)}</td></tr><tr><th>التاريخ</th><td>${esc(inv.date)}</td></tr><tr><th>تاريخ الاستحقاق</th><td>${esc(inv.due_date || '-')}</td></tr><tr><th>الوصف</th><td>${esc(inv.description || '-')}</td></tr>`;
            const win = window.open('', '_blank');
            win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة ${esc(inv.number)}</title><style>${_prPrintCSS()}</style></head><body><div class="head">${logo ? `<img src="${logo}">` : ''}<div class="doc">فاتورة مطبخ</div></div><table>${rows}</table>${imgHtml}<div class="footer">طُبع من نظام ${esc(company)} — ${now}</div><br><button onclick="window.print()" style="padding:10px 20px;font-size:14px;cursor:pointer">🖨️ طباعة / حفظ PDF</button></body></html>`);
            win.document.close();
        }

        function openAddTransactionModal() { document.getElementById('transactionForm').reset(); document.getElementById('transactionId').value = ''; openModal('transactionModal'); }
        async function saveTransaction() { const id = document.getElementById('transactionId').value || generateId(); const isNew = !document.getElementById('transactionId').value; const transaction = {id: id, type: document.getElementById('transactionType').value, amount: parseFloat(document.getElementById('transactionAmount').value), description: document.getElementById('transactionDescription').value, category: document.getElementById('transactionCategory').value, accountId: document.getElementById('transactionAccount').value || null, date: document.getElementById('transactionDate').value || null, createdAt: isNew ? new Date().toISOString() : (data.transactions.find(t => t.id === id)?.createdAt || new Date().toISOString())}; const { error } = await supabaseClient.from('transactions').upsert(transaction); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Accounting', isNew ? 'create' : 'update', transaction.description); await loadTransactions(); closeModal('transactionModal'); showToast('success', t('dataSaved'), formatCurrency(transaction.amount)); }
        function renderTransactions() { const tbody = document.getElementById('transactionsTableBody'); if (data.transactions.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">${t('noData')}</td></tr>`; return; } tbody.innerHTML = data.transactions.map(trans => `<tr><td>${formatDate(trans.date)}</td><td>${esc(trans.description)}</td><td>${t(trans.category)}</td><td><span class="badge ${trans.type === 'income' ? 'badge-success' : 'badge-danger'}">${t(trans.type)}</span></td><td style="font-family: var(--font-mono); ${trans.type === 'income' ? 'color: var(--success)' : 'color: var(--danger)'}">${trans.type === 'income' ? '+' : '-'}${formatCurrency(trans.amount)}</td><td><button class="btn btn-sm btn-secondary" onclick="viewTransaction('${trans.id}')" title="عرض"><i class="fas fa-eye"></i></button> ${canEditAccounting() ? `<button class="btn btn-sm btn-danger" onclick="deleteTransaction('${trans.id}')"><i class="fas fa-trash"></i></button>` : ''}</td></tr>`).join(''); }
        async function deleteTransaction(id) { if (!(await confirmStyled(t('confirmDelete'), {type:'danger'}))) return; const trans = data.transactions.find(t => t.id === id); const { error } = await supabaseClient.from('transactions').delete().eq('id', id); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Accounting', 'delete', trans?.description || id); await loadTransactions(); showToast('success', t('dataDeleted'), ''); }
        function updateAccountingStats() { const income = data.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); const expenses = data.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); const balance = income - expenses; document.getElementById('statIncome').textContent = formatCurrency(income); document.getElementById('statExpenses').textContent = formatCurrency(expenses); document.getElementById('statBalance').textContent = formatCurrency(balance); document.getElementById('statRevenue').textContent = formatCurrency(income); }
        function computeTrialBalance(fromStr, toStr) {
            var txDate = function(t){ return t.date || (t.createdAt||'').slice(0,10); };
            var inRange = function(t){ var d = txDate(t); if(!d) return false; if(fromStr && d < fromStr) return false; if(toStr && d > toStr) return false; return true; };
            var beforeFrom = function(t){ var d = txDate(t); return fromStr && d && d < fromStr; };
            var rows = [];
            (data.accounts||[]).forEach(function(acc){
                var txns = (data.transactions||[]).filter(function(t){ return t.accountId === acc.id; });
                var openAdj = txns.filter(beforeFrom).reduce(function(s,t){ return s + (t.type==='income'?1:-1)*(parseFloat(t.amount)||0); }, 0);
                var opening = (parseFloat(acc.balance)||0) + openAdj;
                var periodTx = txns.filter(inRange);
                var inc = periodTx.filter(function(t){ return t.type==='income'; }).reduce(function(s,t){ return s+(parseFloat(t.amount)||0); }, 0);
                var exp = periodTx.filter(function(t){ return t.type==='expense'; }).reduce(function(s,t){ return s+(parseFloat(t.amount)||0); }, 0);
                rows.push({ name: acc.name, number: acc.number || '-', opening: opening, inc: inc, exp: exp, closing: opening + inc - exp });
            });
            var unlinked = (data.transactions||[]).filter(function(t){ return !t.accountId; });
            if (unlinked.length) {
                var uOpen = unlinked.filter(beforeFrom).reduce(function(s,t){ return s + (t.type==='income'?1:-1)*(parseFloat(t.amount)||0); }, 0);
                var uPeriod = unlinked.filter(inRange);
                var uInc = uPeriod.filter(function(t){ return t.type==='income'; }).reduce(function(s,t){ return s+(parseFloat(t.amount)||0); }, 0);
                var uExp = uPeriod.filter(function(t){ return t.type==='expense'; }).reduce(function(s,t){ return s+(parseFloat(t.amount)||0); }, 0);
                rows.push({ name: 'معاملات غير مربوطة بحساب', number: '—', opening: uOpen, inc: uInc, exp: uExp, closing: uOpen + uInc - uExp, unlinked: true });
            }
            var totals = rows.reduce(function(a,r){ a.opening+=r.opening; a.inc+=r.inc; a.exp+=r.exp; a.closing+=r.closing; return a; }, {opening:0,inc:0,exp:0,closing:0});
            return { rows: rows, totals: totals };
        }
        function trialBalanceTableHtml(tb, forPrint) {
            var money = function(v){ return formatCurrency(v); };
            var rowsHtml = tb.rows.map(function(r){
                var style = r.unlinked ? ' style="color:#B45309"' : '';
                return '<tr'+style+'><td>'+esc(r.name)+'</td><td style="font-family:var(--font-mono,monospace)">'+esc(String(r.number))+'</td><td>'+money(r.opening)+'</td><td style="color:'+(forPrint?'#0B6E4F':'var(--success)')+'">'+money(r.inc)+'</td><td style="color:'+(forPrint?'#B00020':'var(--danger)')+'">'+money(r.exp)+'</td><td style="font-weight:700">'+money(r.closing)+'</td></tr>';
            }).join('');
            var totalRow = '<tr style="font-weight:bold;background:'+(forPrint?'#f2f2f2':'var(--bg-secondary)')+'"><td colspan="2">الإجمالي</td><td>'+money(tb.totals.opening)+'</td><td>'+money(tb.totals.inc)+'</td><td>'+money(tb.totals.exp)+'</td><td>'+money(tb.totals.closing)+'</td></tr>';
            var net = tb.totals.inc - tb.totals.exp;
            var netLine = '<p style="margin:12px 0 0;font-size:14px;font-weight:700;color:'+(net>=0?(forPrint?'#0B6E4F':'var(--success)'):(forPrint?'#B00020':'var(--danger)'))+'">صافي حركة الفترة (وارد − صادر): '+money(net)+'</p>';
            return '<div class="table-container"><table><thead><tr><th>الحساب</th><th>رقم الحساب</th><th>رصيد أول الفترة</th><th>وارد (مدين)</th><th>صادر (دائن)</th><th>رصيد آخر الفترة</th></tr></thead><tbody>'+rowsHtml+totalRow+'</tbody></table></div>'+netLine;
        }
        function renderTrialBalance() {
            var el = document.getElementById('tbContent');
            if (!el) return;
            var fromStr = document.getElementById('tbFrom').value || null;
            var toStr = document.getElementById('tbTo').value || null;
            if ((data.accounts||[]).length === 0 && (data.transactions||[]).length === 0) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">'+t('noData')+'</p>'; return; }
            var tb = computeTrialBalance(fromStr, toStr);
            var periodLabel = (fromStr||toStr) ? '<p style="font-size:12px;color:var(--text-muted);margin:0 0 10px">الفترة: '+(fromStr?formatDate(fromStr):'البداية')+' ← '+(toStr?formatDate(toStr):'اليوم')+'</p>' : '';
            el.innerHTML = periodLabel + trialBalanceTableHtml(tb, false);
        }
        function printTrialBalance() {
            var fromStr = document.getElementById('tbFrom') ? (document.getElementById('tbFrom').value || null) : null;
            var toStr = document.getElementById('tbTo') ? (document.getElementById('tbTo').value || null) : null;
            var tb = computeTrialBalance(fromStr, toStr);
            var company = 'شركة الوطنية للطاقة والهندسة المحدودة';
            var now = new Date().toLocaleDateString('ar-EG');
            var logo = AEECO_INVOICE_LOGO;
            var periodLabel = '<p style="font-size:12px;color:#666;margin:0 0 10px">الفترة: '+(fromStr?formatDate(fromStr):'البداية')+' ← '+(toStr?formatDate(toStr):'اليوم')+'</p>';
            var win = window.open('', '_blank');
            win.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>ميزان المراجعة</title><style>'+_prPrintCSS()+' th{width:auto;text-align:center}td{text-align:center}</style></head><body><div class="head"><img src="'+logo+'"><div class="doc">ميزان المراجعة</div></div>'+periodLabel+trialBalanceTableHtml(tb, true)+'<div class="footer">طُبع من نظام '+esc(company)+' — '+now+'</div><br><button onclick="window.print()" style="padding:10px 20px;font-size:14px;cursor:pointer">🖨️ طباعة / حفظ PDF</button></body></html>');
            win.document.close();
        }
        function renderAccountingReports() {
            if (!document.getElementById('plContent')) return;
            const from = document.getElementById('plFrom').value;
            const to = document.getElementById('plTo').value;
            const inRange = (d) => (!from || d >= from) && (!to || d <= to);
            const txns = (data.transactions || []).filter(t => t.date && inRange(t.date));
            const incomeByCat = {}, expenseByCat = {};
            let totalIncome = 0, totalExpense = 0;
            txns.forEach(t => { const amt = parseFloat(t.amount) || 0; if (t.type === 'income') { totalIncome += amt; incomeByCat[t.category] = (incomeByCat[t.category] || 0) + amt; } else if (t.type === 'expense') { totalExpense += amt; expenseByCat[t.category] = (expenseByCat[t.category] || 0) + amt; } });
            const net = totalIncome - totalExpense;
            const catRows = (obj) => Object.keys(obj).length ? Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<tr><td>${t(c) || esc(c)}</td><td style="text-align:left;font-family:var(--font-mono)">${formatCurrency(v)}</td></tr>`).join('') : `<tr><td colspan="2" style="color:var(--text-muted)">${t('noData')}</td></tr>`;
            document.getElementById('plContent').innerHTML = `<div class="table-container"><table><thead><tr><th>${t('income')}</th><th style="text-align:left">${formatCurrency(totalIncome)}</th></tr></thead><tbody>${catRows(incomeByCat)}</tbody></table></div><div class="table-container" style="margin-top:12px"><table><thead><tr><th>${t('expense')}</th><th style="text-align:left">${formatCurrency(totalExpense)}</th></tr></thead><tbody>${catRows(expenseByCat)}</tbody></table></div><div style="margin-top:16px;padding:14px;border-radius:10px;background:var(--bg-tertiary);display:flex;justify-content:space-between;align-items:center"><strong>${t('netProfit')}</strong><strong style="font-family:var(--font-mono);font-size:18px;color:${net >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatCurrency(net)}</strong></div>`;
            const today = new Date().toISOString().split('T')[0];
            const dayMs = 86400000;
            const withAge = (data.invoices || []).filter(i => i.status !== 'paid' && i.status !== 'draft').map(i => { let daysLate = 0; if (i.dueDate && i.dueDate < today) daysLate = Math.floor((new Date(today) - new Date(i.dueDate)) / dayMs); return Object.assign({}, i, { daysLate }); }).sort((a, b) => b.daysLate - a.daysLate);
            const totalOutstanding = withAge.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
            document.getElementById('agingContent').innerHTML = withAge.length ? `<div class="table-container"><table><thead><tr><th>${t('invoiceNumber')}</th><th>${t('client')}</th><th>${t('amount')}</th><th>${t('dueDate')}</th><th>${t('daysOverdue')}</th></tr></thead><tbody>${withAge.map(i => `<tr><td style="font-family:var(--font-mono)">#${esc(i.number)}</td><td>${esc(i.client)}</td><td style="font-family:var(--font-mono)">${formatCurrency(i.amount)}</td><td>${i.dueDate ? formatDate(i.dueDate) : '—'}</td><td>${i.daysLate > 0 ? `<span class="badge badge-danger">${i.daysLate} ${t('day')}</span>` : `<span class="badge badge-gray">—</span>`}</td></tr>`).join('')}</tbody></table></div><div style="margin-top:16px;padding:14px;border-radius:10px;background:var(--bg-tertiary);display:flex;justify-content:space-between;align-items:center"><strong>${t('totalOutstanding')}</strong><strong style="font-family:var(--font-mono);font-size:18px">${formatCurrency(totalOutstanding)}</strong></div>` : `<p style="color:var(--text-muted);text-align:center;padding:20px">${t('noOutstanding')}</p>`;
        }
        async function saveInvoice() { const id = document.getElementById('invoiceId').value || generateId(); const isNew = !document.getElementById('invoiceId').value; const invoice = {id: id, number: document.getElementById('invoiceNumber').value, client: document.getElementById('invoiceClient').value, amount: parseFloat(document.getElementById('invoiceAmount').value), status: document.getElementById('invoiceStatus').value, date: document.getElementById('invoiceDate').value || null, dueDate: document.getElementById('invoiceDueDate').value || null, notes: document.getElementById('invoiceNotes').value, createdAt: isNew ? new Date().toISOString() : (data.invoices.find(i => i.id === id)?.createdAt || new Date().toISOString())}; const { error } = await supabaseClient.from('invoices').upsert(invoice); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Invoices', isNew ? 'create' : 'update', `Invoice #${invoice.number}`); await syncInvoiceIncome(invoice); await loadInvoices(); closeModal('invoiceModal'); showToast('success', t('dataSaved'), `Invoice #${invoice.number}`); }
        async function syncInvoiceIncome(invoice) {
            try {
                const existing = (data.transactions || []).find(t => t.invoiceId === invoice.id);
                if (invoice.status === 'paid' && !existing) {
                    await supabaseClient.from('transactions').insert({ id: generateId(), type: 'income', amount: invoice.amount, description: `تحصيل فاتورة #${invoice.number} - ${invoice.client}`, category: 'sales', date: invoice.date || new Date().toISOString().split('T')[0], accountId: null, invoiceId: invoice.id, createdAt: new Date().toISOString() });
                } else if (invoice.status !== 'paid' && existing) {
                    await supabaseClient.from('transactions').delete().eq('id', existing.id);
                }
                await loadTransactions();
            } catch (e) { console.warn('syncInvoiceIncome:', e); }
        }
        function renderInvoices() { const tbody = document.getElementById('invoicesTableBody'); if (data.invoices.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">${t('noData')}</td></tr>`; return; } tbody.innerHTML = data.invoices.map(inv => { const today = new Date().toISOString().split('T')[0]; const isLate = inv.status !== 'paid' && inv.status !== 'draft' && inv.dueDate && inv.dueDate < today; const effStatus = isLate ? 'overdue' : inv.status; const statusBadge = {draft: 'badge-gray', sent: 'badge-info', paid: 'badge-success', overdue: 'badge-danger'}[effStatus]; return `<tr><td style="font-family: var(--font-mono);">#${esc(inv.number)}</td><td>${esc(inv.client)}</td><td style="font-family: var(--font-mono);">${formatCurrency(inv.amount)}</td><td><span class="badge ${statusBadge}">${t(effStatus)}</span></td><td>${formatDate(inv.date)}${inv.dueDate ? `<br><span style="font-size:11px;color:${isLate ? 'var(--danger)' : 'var(--text-muted)'}">${t('dueDate')}: ${formatDate(inv.dueDate)}</span>` : ''}</td><td><button class="btn btn-sm btn-secondary" onclick="viewInvoice('${inv.id}')" title="عرض"><i class="fas fa-eye"></i></button> <button class="btn btn-sm btn-secondary" onclick="printInvoice('${inv.id}')" title="طباعة"><i class="fas fa-print"></i></button> ${canEditAccounting() ? `<button class="btn btn-sm btn-secondary" onclick="editInvoice('${inv.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deleteInvoice('${inv.id}')"><i class="fas fa-trash"></i></button>` : ''}</td></tr>`; }).join(''); }
        function editInvoice(id) { const inv = data.invoices.find(i => i.id === id); if (inv) { document.getElementById('invoiceId').value = inv.id; document.getElementById('invoiceNumber').value = inv.number; document.getElementById('invoiceClient').value = inv.client; document.getElementById('invoiceAmount').value = inv.amount; document.getElementById('invoiceStatus').value = inv.status; document.getElementById('invoiceDate').value = inv.date; document.getElementById('invoiceDueDate').value = inv.dueDate || ''; document.getElementById('invoiceNotes').value = inv.notes; openModal('invoiceModal'); } }
        async function deleteInvoice(id) { if (!(await confirmStyled(t('confirmDelete'), {type:'danger'}))) return; const inv = data.invoices.find(i => i.id === id); const { error } = await supabaseClient.from('invoices').delete().eq('id', id); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Invoices', 'delete', inv?.number || id); const linked = (data.transactions || []).find(t => t.invoiceId === id); if (linked) { await supabaseClient.from('transactions').delete().eq('id', linked.id); await loadTransactions(); } await loadInvoices(); showToast('success', t('dataDeleted'), ''); }
        async function saveAccount() { const id = document.getElementById('accountId').value || generateId(); const isNew = !document.getElementById('accountId').value; const account = {id: id, number: document.getElementById('accountNumber').value, name: document.getElementById('accountName').value, type: document.getElementById('accountType').value, balance: parseFloat(document.getElementById('accountOpeningBalance').value) || 0, createdAt: isNew ? new Date().toISOString() : (data.accounts.find(a => a.id === id)?.createdAt || new Date().toISOString())}; const { error } = await supabaseClient.from('accounts').upsert(account); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Accounts', isNew ? 'create' : 'update', account.name); await loadAccounts(); closeModal('accountModal'); showToast('success', t('dataSaved'), account.name); }
        function renderAccounts() { const tbody = document.getElementById('accountsTableBody'); if (data.accounts.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px;">${t('noData')}</td></tr>`; return; } tbody.innerHTML = data.accounts.map(acc => `<tr><td style="font-family: var(--font-mono);">${esc(acc.number)}</td><td>${esc(acc.name)}</td><td><span class="badge badge-info">${t(acc.type)}</span></td><td style="font-family: var(--font-mono);">${formatCurrency(computeAccountBalance(acc))}</td><td><button class="btn btn-sm btn-secondary" onclick="viewAccount('${acc.id}')" title="عرض"><i class="fas fa-eye"></i></button> ${canEditAccounting() ? `<button class="btn btn-sm btn-secondary" onclick="editAccount('${acc.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deleteAccount('${acc.id}')"><i class="fas fa-trash"></i></button>` : ''}</td></tr>`).join(''); }
        function editAccount(id) { const acc = data.accounts.find(a => a.id === id); if (acc) { document.getElementById('accountId').value = acc.id; document.getElementById('accountNumber').value = acc.number; document.getElementById('accountName').value = acc.name; document.getElementById('accountType').value = acc.type; document.getElementById('accountOpeningBalance').value = acc.balance || 0; openModal('accountModal'); } }
        async function deleteAccount(id) { if (!(await confirmStyled(t('confirmDelete'), {type:'danger'}))) return; const acc = data.accounts.find(a => a.id === id); const { error } = await supabaseClient.from('accounts').delete().eq('id', id); if (error) { showToast('error', 'Error', error.message); return; } logActivity('Accounts', 'delete', acc?.name || id); await loadAccounts(); showToast('success', t('dataDeleted'), ''); }
        function viewInvoice(id){ var r=(data.invoices||[]).find(function(x){return x.id===id;}); if(!r) return; showDetailsModal('تفاصيل الفاتورة', [['رقم الفاتورة',esc(r.number||'-')],['العميل',esc(r.client||'-')],['المبلغ',r.amount!=null?formatCurrency(r.amount):'-'],['الحالة',esc(r.status||'-')],['التاريخ',r.date?formatDate(r.date):'-'],['تاريخ الاستحقاق',r.dueDate?formatDate(r.dueDate):'-'],['ملاحظات',esc(r.notes||'-')]]); }
        function viewAccount(id){ var r=(data.accounts||[]).find(function(x){return x.id===id;}); if(!r) return; showDetailsModal('تفاصيل الحساب', [['رقم الحساب',esc(r.number||'-')],['الاسم',esc(r.name||'-')],['النوع',esc(r.type||'-')],['الرصيد',r.balance!=null?formatCurrency(r.balance):'-']]); }
        function viewTransaction(id){ var r=(data.transactions||[]).find(function(x){return x.id===id;}); if(!r) return; showDetailsModal('تفاصيل المعاملة', [['النوع',esc(r.type||'-')],['الفئة',esc(r.category||'-')],['الوصف',esc(r.description||'-')],['المبلغ',r.amount!=null?formatCurrency(r.amount):'-'],['التاريخ',r.date?formatDate(r.date):'-']]); }
