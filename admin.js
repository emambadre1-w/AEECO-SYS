        async function loadUsersModule() { const { data: profs, error } = await supabaseClient.from('profiles').select('*').order('full_name'); if (error) { console.error(error); return; } allProfilesCache = profs || []; renderUsersTable(); }
        async function deleteUserProfile(id, name) { if (!(await confirmStyled(`حذف مستخدم "${name}"؟\nسيُحذف من جدول الملفات الشخصية ولكن سيبقى حسابه في Supabase Auth.\nلحذفه نهائياً: Authentication → Users → احذفه يدوياً.`, {type:'danger'}))) return; const { error } = await supabaseClient.from('profiles').delete().eq('id', id); if (error) { showToast('error', 'Error', error.message); return; } showToast('success', 'تم الحذف', name); await loadUsersModule(); }
        async function changeUserRole(id, newRole) { const { error } = await supabaseClient.from('profiles').update({ role: newRole }).eq('id', id); if (error) { showToast('error', 'Error', error.message); await loadUsersModule(); return; } showToast('success', t('roleUpdated'), ''); await loadUsersModule(); if (id === currentUser.id) { currentUser.role = newRole; applyRoleVisibility(); updateUserMenu(); } }
        function generateAuPassword() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
            let pw = '';
            for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
            document.getElementById('auPassword').value = pw;
        }
        function importData(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const imported = JSON.parse(e.target.result); data = {...data, ...imported}; saveData(); location.reload(); } catch (err) { showToast('error', 'Error', 'Invalid JSON file'); } }; reader.readAsText(file); }
        
