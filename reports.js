        document.querySelector('.nav-item[data-page="dashboard"]').addEventListener('click', () => { if (currentUser) renderRoleDashboard(); });
        function exdMoney(n){
            const lang=(data.settings && data.settings.language)||'ar';
            const cs= lang==='en' ? {'SDG':'SDG','SAR':'SAR','USD':'$','EUR':'€','AED':'AED','EGP':'EGP'} : {'SDG':'ج.س','SAR':'ر.س','USD':'$','EUR':'€','AED':'د.إ','EGP':'ج.م'};
            const sym=cs[data.settings.currency]||data.settings.currency;
            n=Number(n)||0; const a=Math.abs(n); let v;
            if(a>=1e9) v=(n/1e9).toFixed(2)+(lang==='en'?'B':' مليار');
            else if(a>=1e6) v=(n/1e6).toFixed(1)+(lang==='en'?'M':' مليون');
            else v=Math.round(n).toLocaleString();
            return v+' '+sym;
        }
                function _exdPeriodRange(key){
            var now = new Date();
            var start;
            if(key==='month'){ start = new Date(now.getFullYear(), now.getMonth(), 1); }
            else if(key==='q3'){ start = new Date(now.getFullYear(), now.getMonth()-2, 1); }
            else if(key==='q6'){ start = new Date(now.getFullYear(), now.getMonth()-5, 1); }
            else if(key==='year'){ start = new Date(now.getFullYear(), 0, 1); }
            else { start = null; }
            return { start: start, end: now };
        }
        function _exdInRange(dateStr, range){
            if(!range || !range.start) return true;
            if(!dateStr) return false;
            var d = new Date(dateStr);
            if(isNaN(d.getTime())) return false;
            return d >= range.start && d <= range.end;
        }
        function _exdPeriodLabel(key){
            if(key==='month') return t('exdMonthOpt');
            if(key==='q3') return t('exdQ3Opt');
            if(key==='q6') return t('exdQ6Opt');
            if(key==='year') return t('exdYearOpt');
            return t('exdAllOpt');
        }
        async function _exdInitFilters(){
            await _exdEnsureProfiles();
            var sel = document.getElementById('exdFilterDept');
            if(!sel) return;
            var prev = sel.value;
            var depts = {};
            try{
                Object.keys(profilesCache).forEach(function(id){
                    var d = profilesCache[id] && profilesCache[id].department;
                    if(d && String(d).trim()) depts[String(d).trim()] = true;
                });
            }catch(e){}
            var list = Object.keys(depts).sort(function(a,b){ return a.localeCompare(b,'ar'); });
            var html = '<option value="">'+t('exdAllDeptsOpt')+'</option>' + list.map(function(d){ return '<option value="'+esc(d)+'">'+esc(d)+'</option>'; }).join('');
            sel.innerHTML = html;
            if(list.indexOf(prev)>=0) sel.value = prev;
        }
        
        function renderExecLists(){
            try{
                var periodKey = (document.getElementById('exdFilterPeriod')||{}).value || 'q6';
                var deptKey = (document.getElementById('exdFilterDept')||{}).value || '';
                var range = _exdPeriodRange(periodKey);
                // ===== آخر الأنشطة =====
                var actEl = document.getElementById('exdActivityList');
                if(actEl){
                    var allActs = (data.activityLog||[]);
                    var acts = allActs.filter(function(a){ return _exdInRange(a.timestamp, range); }).slice().sort(function(a,b){ return String(b.timestamp||'').localeCompare(String(a.timestamp||'')); }).slice(0,6);
                    if(acts.length===0){
                        actEl.innerHTML = '<div class="exd-li-empty">'+(allActs.length>0?'لا يوجد نشاط في هذه الفترة':'لا توجد أنشطة بعد')+'</div>';
                    } else {
                        actEl.innerHTML = acts.map(function(a){
                            var cls = a.action==='create'?'create':a.action==='delete'?'delete':'update';
                            var ic  = a.action==='create'?'fa-plus':a.action==='delete'?'fa-trash':'fa-pen';
                            var when = a.timestamp?formatDateTime(a.timestamp):'';
                            return '<div class="exd-li"><div class="exd-li-ic act-'+cls+'"><i class="fas '+ic+'"></i></div>'+
                                '<div class="exd-li-main"><div class="exd-li-t">'+esc(a.itemName||'—')+'</div>'+
                                '<div class="exd-li-s">'+esc(a.actor||'')+'</div></div>'+
                                '<div class="exd-li-time">'+when+'</div></div>';
                        }).join('');
                    }
                }
                // ===== الموافقات المعلّقة =====
                var penEl = document.getElementById('exdPendingList');
                if(penEl){
                    var _rq = (typeof allRequestsCache!=='undefined'&&allRequestsCache)?allRequestsCache:[];
                    var allPend = _rq.filter(function(r){ return r.status==='pending'; });
                    var pend = allPend.filter(function(r){
                        if(!_exdInRange(r.created_at, range)) return false;
                        if(deptKey){ var p=profilesCache[r.requester_id]; if(!p||p.department!==deptKey) return false; }
                        return true;
                    }).slice().sort(function(a,b){ return String(b.created_at||'').localeCompare(String(a.created_at||'')); }).slice(0,6);
                    if(pend.length===0){
                        penEl.innerHTML = '<div class="exd-li-empty">'+(allPend.length>0?'لا توجد موافقات ضمن هذا الفلتر':'لا توجد موافقات معلّقة 🎉')+'</div>';
                    } else {
                        penEl.innerHTML = pend.map(function(r){
                            var nm = _exdReqName(r.requester_id);
                            var tp = ''; try{ tp = t('reqType'+r.type.charAt(0).toUpperCase()+r.type.slice(1)); }catch(e){ tp = r.type||''; }
                            var amt = r.amount?exdMoney(r.amount):'';
                            var when = r.created_at?formatDate(r.created_at):'';
                            return '<div class="exd-li exd-li-click" onclick="navigateTo(\'requests\')"><div class="exd-li-ic pend"><i class="fas fa-hourglass-half"></i></div>'+
                                '<div class="exd-li-main"><div class="exd-li-t">'+esc(r.title||tp||'طلب')+'</div>'+
                                '<div class="exd-li-s">'+esc(nm)+(tp?' · '+esc(tp):'')+'</div></div>'+
                                '<div class="exd-li-right">'+(amt?'<div class="exd-li-amt">'+amt+'</div>':'')+'<div class="exd-li-time">'+when+'</div></div></div>';
                        }).join('');
                    }
                }
            }catch(e){ console.error('renderExecLists', e); }
        }
        
        async function renderExecCharts(){
            if (typeof Chart === 'undefined') { console.warn('Chart.js not loaded'); return; }
            var periodKey = (document.getElementById('exdFilterPeriod')||{}).value || 'q6';
            var range = _exdPeriodRange(periodKey);
            var pLabel = _exdPeriodLabel(periodKey);
            var h1 = document.getElementById('exdChTitle1'); if(h1) h1.textContent = t('exdRevExpChartTitle')+' ('+pLabel+')';
            var h2 = document.getElementById('exdChTitle2'); if(h2) h2.textContent = t('exdCategoryChartTitle')+' ('+pLabel+')';
            var txns = [];
            try {
                var _r = await supabaseClient.from('transactions').select('type,amount,date,category');
                txns = (_r && _r.data) || [];
            } catch(e){ console.error('exd chart txns', e); return; }

            // ===== الرسم ١: الإيرادات مقابل المصروفات =====
            var arMonths = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
            var now = new Date();
            var nMonths = _exdMonthsForPeriod(periodKey);
            var mKeys = [], mLabels = [], incMap = {}, expMap = {};
            for (var i=nMonths-1; i>=0; i--){
                var d = new Date(now.getFullYear(), now.getMonth()-i, 1);
                var key = d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);
                mKeys.push(key); mLabels.push(arMonths[d.getMonth()]); incMap[key]=0; expMap[key]=0;
            }
            txns.forEach(function(t){
                if(!t.date) return;
                var k = String(t.date).slice(0,7);
                if(!(k in incMap)) return;
                var a = Number(t.amount)||0;
                if(t.type==='income') incMap[k]+=a; else if(t.type==='expense') expMap[k]+=a;
            });
            var incArr = mKeys.map(function(k){return incMap[k];});
            var expArr = mKeys.map(function(k){return expMap[k];});
            var has1 = incArr.concat(expArr).some(function(v){return v>0;});
            var cv1 = document.getElementById('exdChartRevExp');
            var em1 = document.getElementById('exdEmpty1');
            if (_exdC1){ try{_exdC1.destroy();}catch(e){} _exdC1=null; }
            if (has1 && cv1){
                if(em1) em1.style.display='none';
                cv1.style.display='block';
                _exdC1 = new Chart(cv1, {
                    type:'bar',
                    data:{ labels:mLabels, datasets:[
                        { label:'الإيرادات', data:incArr, backgroundColor:'#22C55E', borderRadius:5, maxBarThickness:26 },
                        { label:'المصروفات', data:expArr, backgroundColor:'#EF4444', borderRadius:5, maxBarThickness:26 }
                    ]},
                    options:{ responsive:true, maintainAspectRatio:false,
                        plugins:{ legend:{ labels:{ color:'#1E293B', font:{family:'Cairo',size:12}, usePointStyle:true, pointStyle:'circle' } },
                                  tooltip:{ callbacks:{ label:function(c){ return c.dataset.label+': '+exdMoney(c.parsed.y); } } } },
                        scales:{ x:{ ticks:{ color:'#64748B', font:{family:'Cairo'} }, grid:{ display:false } },
                                 y:{ ticks:{ color:'#64748B', font:{family:'Cairo'}, callback:function(v){ return exdMoney(v); } }, grid:{ color:'#E2E8F0' } } } }
                });
            } else if (cv1) {
                cv1.style.display='none'; if(em1) em1.style.display='flex';
            }

            // ===== الرسم ٢: توزيع الإيرادات حسب الفئة =====
            var catMap = {};
            txns.forEach(function(t){
                if(t.type!=='income') return;
                if(!_exdInRange(t.date, range)) return;
                var c = (t.category && String(t.category).trim()) || 'غير مصنّف';
                catMap[c] = (catMap[c]||0) + (Number(t.amount)||0);
            });
            var cats = Object.keys(catMap).filter(function(c){return catMap[c]>0;});
            var has2 = cats.length>0;
            var cv2 = document.getElementById('exdChartCategory');
            var em2 = document.getElementById('exdEmpty2');
            if (_exdC2){ try{_exdC2.destroy();}catch(e){} _exdC2=null; }
            if (has2 && cv2){
                if(em2) em2.style.display='none';
                cv2.style.display='block';
                var pal = ['#1D39FF','#0B6E4F','#FA4B0E','#22C55E','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#64748B'];
                _exdC2 = new Chart(cv2, {
                    type:'doughnut',
                    data:{ labels:cats, datasets:[{ data:cats.map(function(c){return catMap[c];}),
                            backgroundColor:cats.map(function(c,i){return pal[i%pal.length];}), borderWidth:2, borderColor:'#FFFFFF' }]},
                    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
                        plugins:{ legend:{ position:'bottom', labels:{ color:'#1E293B', font:{family:'Cairo',size:12}, padding:14, usePointStyle:true, pointStyle:'circle' } },
                                  tooltip:{ callbacks:{ label:function(c){ return c.label+': '+exdMoney(c.parsed); } } } } }
                });
            } else if (cv2) {
                cv2.style.display='none'; if(em2) em2.style.display='flex';
            }
        }
        
