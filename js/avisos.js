// Metabolisme Esparta · avisos de la consola
//
// Dues direccions: la consola AVISA l'Esparta, i tambe pot REBRE avis
// quan l'Esparta escriu. Per rebre'n cal un service worker propi, que
// nomes serveix per aixo (la consola no es cacheja mai).
(function(){
var E = window.ESPARTA;

// Clau publica VAPID. Es publica per disseny: la privada viu al servidor.
E.VAPID = 'BPewH7GsQX_kAP6sPuBKmZgObQWIXuledmJhTMrjyD-Z5CnR_94stEdXdMyhz-kaai65XJ4qzmeKB8DzjfBAEm4';

// ── Enviar ─────────────────────────────────────────────────────────
// Mai atura el que estava fent l'usuari: si l'avis falla, es calla.
E.avisa = function(athleteId, titol, cos, ruta){
  if (!athleteId || !E.sb) return Promise.resolve();
  return E.sb.functions.invoke('avisa', {
    body: { athlete_id:athleteId, mena:'a_atleta', titol:titol, cos:cos || '',
            ruta:ruta || 'avui' }
  }).catch(function(){});
};

E.resum = function(text, max){
  text = (text || '').replace(/\s+/g,' ').trim();
  max = max || 90;
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
};

// ── Rebre ──────────────────────────────────────────────────────────
function aBytes(base64){
  var s = (base64 + '='.repeat((4 - base64.length % 4) % 4))
    .replace(/-/g,'+').replace(/_/g,'/');
  var cru = atob(s);
  var b = new Uint8Array(cru.length);
  for (var i = 0; i < cru.length; i++) b[i] = cru.charCodeAt(i);
  return b;
}
function b64(buf){
  var b = new Uint8Array(buf), s = '';
  for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

function possibles(){
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

function activa(){
  return Notification.requestPermission().then(function(p){
    if (p !== 'granted') throw new Error('No has donat permís per als avisos.');
    return navigator.serviceWorker.register('./sw.js');
  }).then(function(){
    return navigator.serviceWorker.ready;
  }).then(function(reg){
    return reg.pushManager.getSubscription().then(function(ja){
      if (ja) return ja;
      return reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: aBytes(E.VAPID)
      });
    });
  }).then(function(sub){
    var s = sub.toJSON();
    return E.sb.from('push_subscriptions').upsert({
      user_id: E.perfil.id,
      endpoint: sub.endpoint,
      p256dh: s.keys ? s.keys.p256dh : b64(sub.getKey('p256dh')),
      auth: s.keys ? s.keys.auth : b64(sub.getKey('auth')),
      plataforma: 'Consola · ' + navigator.userAgent.slice(0, 100)
    }, { onConflict:'endpoint' }).then(function(r){
      if (r.error) throw new Error(r.error.message);
      return true;
    });
  });
}

function desactiva(){
  return navigator.serviceWorker.ready.then(function(reg){
    return reg.pushManager.getSubscription();
  }).then(function(sub){
    if (!sub) return true;
    var punt = sub.endpoint;
    return sub.unsubscribe().then(function(){
      return E.sb.from('push_subscriptions').delete().eq('endpoint', punt);
    }).then(function(){ return true; });
  });
}

// Interruptor per al peu de la barra lateral
E.botoAvisos = function(){
  var w = E.h('div','margin-bottom:9px');
  pinta();
  return w;

  function pinta(){
    E.buida(w);
    if (!possibles()) return;
    var estat = Notification.permission;
    if (estat === 'denied'){
      w.appendChild(E.h('div','font-size:10.5px;color:'+E.C.apagat+';line-height:1.45',
        'Avisos blocats en aquest navegador.'));
      return;
    }
    var b = E.boto(estat === 'granted' ? 'Avisos actius' : 'Rebre avisos', function(){
      b.disabled = true;
      b.textContent = '…';
      (estat === 'granted' ? desactiva() : activa()).then(pinta, function(err){
        E.buida(w);
        w.appendChild(E.h('div','font-size:10.5px;color:'+E.C.accio+';line-height:1.45',
          err.message));
      });
    }, 'buit');
    b.style.width = '100%';
    b.style.padding = '8px 12px';
    b.style.fontSize = '11.5px';
    if (estat === 'granted'){
      b.style.borderColor = E.C.oliva + '77';
      b.style.color = E.C.oliva;
    }
    w.appendChild(b);
  }
};
})();
