const detail=document.getElementById('loading-detail');
const fail=error=>{console.error(error);document.getElementById('loading').hidden=false;document.querySelector('.loader').hidden=true;document.querySelector('.loading-card h2').textContent='Не удалось открыть город';detail.textContent='Проверьте соединение и поддержку WebGL 2 в браузере. Для локального запуска используйте npm start.';document.getElementById('retry').hidden=false;};
document.getElementById('retry').onclick=()=>location.reload();
try { await import('./main.js'); } catch(error) { fail(error); }
