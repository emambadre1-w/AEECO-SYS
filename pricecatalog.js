        async function loadPriceCatalogModule(){
            try{
                const { data: rateRow } = await supabaseClient.from('price_catalog_settings').select('*').eq('id',1).maybeSingle();
                if(rateRow){
                    if(rateRow.usd_to_sdg_rate) priceCatalogRate = Number(rateRow.usd_to_sdg_rate);
                    if(rateRow.marketing_pct!=null) priceCatalogMarketingPct = Number(rateRow.marketing_pct);
                    if(rateRow.profit_pct!=null) priceCatalogProfitPct = Number(rateRow.profit_pct);
                }
            }catch(e){ console.error('loadPriceCatalogModule rate', e); }
            var rd = document.getElementById('pcRateDisplay'); if(rd) rd.textContent = priceCatalogRate.toLocaleString()+' جنيه';
            var md = document.getElementById('pcMarketingDisplay'); if(md) md.textContent = priceCatalogMarketingPct+'٪';
            var pd = document.getElementById('pcProfitDisplay'); if(pd) pd.textContent = priceCatalogProfitPct+'٪';
            try{
                const { data: items, error } = await supabaseClient.from('item_price_catalog').select('*').order('created_at',{ascending:false});
                if(error) throw error;
                priceCatalogItems = items || [];
            }catch(e){ console.error('loadPriceCatalogModule items', e); priceCatalogItems = []; }
            renderPriceCatalogTable();
        }
        function pcCalcItem(item){
            if(item.pricing_mode==='import'){
                var qty = Number(item.quantity)||0;
                var unitCost = Number(item.unit_price)||0;
                var itemsCost = qty*unitCost;
                var landed = itemsCost + (Number(item.customs_usd)||0) + (Number(item.port_fees_usd)||0) + (Number(item.transport_usd)||0);
                var marketing = landed * priceCatalogMarketingPct/100;
                var totalCost = landed + marketing;
                var profit = totalCost * priceCatalogProfitPct/100;
                var sellingUsd = totalCost + profit;
                var sellingSdg = sellingUsd * priceCatalogRate;
                var unitUsd = qty>0 ? sellingUsd/qty : 0;
                var unitSdg = qty>0 ? sellingSdg/qty : 0;
                return { qty: qty, totalCost: totalCost, sellingUsd: sellingUsd, sellingSdg: sellingSdg, unitUsd: unitUsd, unitSdg: unitSdg };
            }
            var usd, sdg;
            if(item.price_currency==='USD'){ usd = Number(item.unit_price)||0; sdg = usd*priceCatalogRate; }
            else { sdg = Number(item.unit_price)||0; usd = priceCatalogRate>0 ? sdg/priceCatalogRate : 0; }
            return { qty:1, totalCost: usd, sellingUsd: usd, sellingSdg: sdg, unitUsd: usd, unitSdg: sdg };
        }
        function pcToggleModeFields(){
            var mode = document.getElementById('pcItemMode').value;
            document.getElementById('pcSimpleFields').style.display = mode==='simple' ? 'block' : 'none';
            document.getElementById('pcImportFields').style.display = mode==='import' ? 'block' : 'none';
        }
        function renderPriceCatalogTable(){
            var tbody = document.getElementById('pcItemsBody');
            if(!tbody) return;
            var totalUsd = 0, totalSdg = 0;
            priceCatalogItems.forEach(function(it){ var c = pcCalcItem(it); totalUsd += c.sellingUsd; totalSdg += c.sellingSdg; });
            var elU = document.getElementById('pcTotalUsd'); if(elU) elU.textContent = '$'+totalUsd.toLocaleString(undefined,{maximumFractionDigits:2});
            var elS = document.getElementById('pcTotalSdg'); if(elS) elS.textContent = totalSdg.toLocaleString(undefined,{maximumFractionDigits:0})+' ج.س';
            if(priceCatalogItems.length===0){
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">لا توجد أصناف مسجّلة بعد</td></tr>';
                return;
            }
            tbody.innerHTML = priceCatalogItems.map(function(it){
                var c = pcCalcItem(it);
                var modeLabel = it.pricing_mode==='import' ? '<span class="badge badge-info">استيراد</span>' : '<span class="badge badge-gray">بسيط</span>';
                return '<tr>'
                    +'<td>'+esc(it.item_name||'-')+'</td>'
                    +'<td>'+modeLabel+'</td>'
                    +'<td>'+(it.pricing_mode==='import' ? c.qty : '-')+'</td>'
                    +'<td>'+(it.pricing_mode==='import' ? '$'+c.totalCost.toLocaleString(undefined,{maximumFractionDigits:2}) : '-')+'</td>'
                    +'<td>$'+c.sellingUsd.toLocaleString(undefined,{maximumFractionDigits:2})+' / '+c.sellingSdg.toLocaleString(undefined,{maximumFractionDigits:0})+' ج.س</td>'
                    +'<td>$'+c.unitUsd.toLocaleString(undefined,{maximumFractionDigits:2})+' / '+c.unitSdg.toLocaleString(undefined,{maximumFractionDigits:0})+' ج.س</td>'
                    +'<td><button class="btn btn-sm btn-secondary" onclick="openPriceCatalogItemModal(\''+it.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="deletePriceCatalogItem(\''+it.id+'\')"><i class="fas fa-trash"></i></button></td>'
                    +'</tr>';
            }).join('');
        }
        function openPriceCatalogItemModal(id){
            document.getElementById('pcItemId').value = id || '';
            if(id){
                var it = priceCatalogItems.find(function(x){ return x.id===id; });
                if(!it) return;
                document.getElementById('pcItemModalTitle').textContent = 'تعديل صنف';
                document.getElementById('pcItemName').value = it.item_name||'';
                document.getElementById('pcItemCode').value = it.item_code||'';
                document.getElementById('pcItemUnit').value = it.unit||'';
                document.getElementById('pcItemMode').value = it.pricing_mode||'simple';
                document.getElementById('pcItemCurrency').value = it.price_currency||'USD';
                document.getElementById('pcItemPrice').value = it.unit_price!=null ? it.unit_price : '';
                document.getElementById('pcItemQty').value = it.quantity!=null ? it.quantity : 1;
                document.getElementById('pcItemUnitCost').value = it.unit_price!=null ? it.unit_price : '';
                document.getElementById('pcItemCustoms').value = it.customs_usd!=null ? it.customs_usd : 0;
                document.getElementById('pcItemPort').value = it.port_fees_usd!=null ? it.port_fees_usd : 0;
                document.getElementById('pcItemTransport').value = it.transport_usd!=null ? it.transport_usd : 0;
                document.getElementById('pcItemShipmentRef').value = it.shipment_ref||'';
                document.getElementById('pcItemNotes').value = it.notes||'';
            } else {
                document.getElementById('pcItemModalTitle').textContent = 'إضافة صنف';
                document.getElementById('pcItemName').value = '';
                document.getElementById('pcItemCode').value = '';
                document.getElementById('pcItemUnit').value = '';
                document.getElementById('pcItemMode').value = 'simple';
                document.getElementById('pcItemCurrency').value = 'USD';
                document.getElementById('pcItemPrice').value = '';
                document.getElementById('pcItemQty').value = 1;
                document.getElementById('pcItemUnitCost').value = '';
                document.getElementById('pcItemCustoms').value = 0;
                document.getElementById('pcItemPort').value = 0;
                document.getElementById('pcItemTransport').value = 0;
                document.getElementById('pcItemShipmentRef').value = '';
                document.getElementById('pcItemNotes').value = '';
            }
            pcToggleModeFields();
            openModal('priceCatalogItemModal');
        }
        async function savePriceCatalogItem(){
            var id = document.getElementById('pcItemId').value;
            var name = document.getElementById('pcItemName').value.trim();
            if(!name){ showToast('warning','اسم الصنف مطلوب',''); return; }
            var mode = document.getElementById('pcItemMode').value;
            var payload = {
                item_name: name,
                item_code: document.getElementById('pcItemCode').value.trim() || null,
                unit: document.getElementById('pcItemUnit').value.trim() || null,
                pricing_mode: mode,
                notes: document.getElementById('pcItemNotes').value.trim() || null
            };
            if(mode==='import'){
                payload.price_currency = 'USD';
                payload.unit_price = parseFloat(document.getElementById('pcItemUnitCost').value) || 0;
                payload.quantity = parseFloat(document.getElementById('pcItemQty').value) || 1;
                payload.customs_usd = parseFloat(document.getElementById('pcItemCustoms').value) || 0;
                payload.port_fees_usd = parseFloat(document.getElementById('pcItemPort').value) || 0;
                payload.transport_usd = parseFloat(document.getElementById('pcItemTransport').value) || 0;
                payload.shipment_ref = document.getElementById('pcItemShipmentRef').value.trim() || null;
            } else {
                payload.price_currency = document.getElementById('pcItemCurrency').value;
                payload.unit_price = parseFloat(document.getElementById('pcItemPrice').value) || 0;
                payload.quantity = 1;
                payload.customs_usd = 0;
                payload.port_fees_usd = 0;
                payload.transport_usd = 0;
                payload.shipment_ref = null;
            }
            try{
                if(id){
                    const { error } = await supabaseClient.from('item_price_catalog').update(payload).eq('id', id);
                    if(error) throw error;
                    showToast('success','تم التحديث','');
                } else {
                    payload.exchange_rate_used = priceCatalogRate;
                    payload.created_by = currentUser.id;
                    const { error } = await supabaseClient.from('item_price_catalog').insert(payload);
                    if(error) throw error;
                    showToast('success','تمت الإضافة','');
                }
                closeModal('priceCatalogItemModal');
                await loadPriceCatalogModule();
            }catch(e){
                console.error('savePriceCatalogItem', e);
                showToast('error','تعذّر الحفظ', String((e&&e.message)||e));
            }
        }
        async function deletePriceCatalogItem(id){
            if(!(await confirmStyled('متأكد من حذف هذا الصنف؟', {type:'danger'}))) return;
            try{
                const { error } = await supabaseClient.from('item_price_catalog').delete().eq('id', id);
                if(error) throw error;
                showToast('success','تم الحذف','');
                await loadPriceCatalogModule();
            }catch(e){
                console.error('deletePriceCatalogItem', e);
                showToast('error','تعذّر الحذف', String((e&&e.message)||e));
            }
        }
        function openExchangeRateModal(){
            document.getElementById('exchangeRateInput').value = priceCatalogRate;
            document.getElementById('pcMarketingPctInput').value = priceCatalogMarketingPct;
            document.getElementById('pcProfitPctInput').value = priceCatalogProfitPct;
            openModal('exchangeRateModal');
        }
        async function saveExchangeRate(){
            var rate = parseFloat(document.getElementById('exchangeRateInput').value);
            var mkt = parseFloat(document.getElementById('pcMarketingPctInput').value);
            var prof = parseFloat(document.getElementById('pcProfitPctInput').value);
            if(!rate || rate<=0){ showToast('warning','أدخل سعر صرف صحيح',''); return; }
            if(isNaN(mkt) || mkt<0 || isNaN(prof) || prof<0){ showToast('warning','أدخل نسب صحيحة',''); return; }
            try{
                const { error } = await supabaseClient.from('price_catalog_settings').update({usd_to_sdg_rate: rate, marketing_pct: mkt, profit_pct: prof, updated_by: currentUser.id}).eq('id',1);
                if(error) throw error;
                priceCatalogRate = rate;
                priceCatalogMarketingPct = mkt;
                priceCatalogProfitPct = prof;
                closeModal('exchangeRateModal');
                showToast('success','تم تحديث الإعدادات','كل الأصناف تحدّثت فوراً بالإعدادات الجديدة');
                var rd = document.getElementById('pcRateDisplay'); if(rd) rd.textContent = priceCatalogRate.toLocaleString()+' جنيه';
                var md = document.getElementById('pcMarketingDisplay'); if(md) md.textContent = priceCatalogMarketingPct+'٪';
                var pd = document.getElementById('pcProfitDisplay'); if(pd) pd.textContent = priceCatalogProfitPct+'٪';
                renderPriceCatalogTable();
            }catch(e){
                console.error('saveExchangeRate', e);
                showToast('error','تعذّر الحفظ', String((e&&e.message)||e));
            }
        }
        
        function printPriceCatalog(){
            const company = 'شركة الوطنية للطاقة والهندسة المحدودة';
            const now = new Date().toLocaleDateString('ar-EG');
            const logo = AEECO_INVOICE_LOGO;
            const rowsHtml = priceCatalogItems.map(function(it){
                var c = pcCalcItem(it);
                var modeLabel = it.pricing_mode==='import' ? 'استيراد' : 'بسيط';
                return '<tr><td>'+esc(it.item_name||'-')+'</td><td>'+esc(it.item_code||'-')+'</td><td>'+modeLabel+'</td><td>'+(it.pricing_mode==='import'?c.qty:'-')+'</td><td>$'+c.sellingUsd.toLocaleString(undefined,{maximumFractionDigits:2})+'</td><td>'+c.sellingSdg.toLocaleString(undefined,{maximumFractionDigits:0})+' ج.س</td><td>'+c.unitSdg.toLocaleString(undefined,{maximumFractionDigits:0})+' ج.س</td></tr>';
            }).join('');
            const totalUsd = priceCatalogItems.reduce(function(sum,it){ return sum + pcCalcItem(it).sellingUsd; }, 0);
            const totalSdg = priceCatalogItems.reduce(function(sum,it){ return sum + pcCalcItem(it).sellingSdg; }, 0);
            const totalRow = '<tr style="font-weight:bold;background:#f2f2f2"><td colspan="4">الإجمالي</td><td>$'+totalUsd.toLocaleString(undefined,{maximumFractionDigits:2})+'</td><td>'+totalSdg.toLocaleString(undefined,{maximumFractionDigits:0})+' ج.س</td><td></td></tr>';
            const win = window.open('', '_blank');
            win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>كتالوج الأسعار</title><style>${_prPrintCSS()} th{width:auto;text-align:center}td{text-align:center}</style></head><body><div class="head"><img src="${logo}"></div><p style="font-size:12px;color:#666;margin:0 0 10px">سعر الصرف: 1$ = ${priceCatalogRate.toLocaleString()} جنيه | تسويق: ${priceCatalogMarketingPct}٪ | ربح: ${priceCatalogProfitPct}٪</p><table><thead><tr><th>الصنف</th><th>الكود</th><th>الوضع</th><th>الكمية</th><th>سعر البيع (دولار)</th><th>سعر البيع (جنيه)</th><th>سعر الوحدة (جنيه)</th></tr></thead><tbody>${rowsHtml}${totalRow}</tbody></table><div class="footer">طُبع من نظام ${esc(company)} — ${now}</div><br><button onclick="window.print()" style="padding:10px 20px;font-size:14px;cursor:pointer">🖨️ طباعة / حفظ PDF</button></body></html>`);
            win.document.close();
        }
        
        
