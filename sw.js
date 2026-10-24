// Metabolisme Esparta · service worker de la consola
//
// NOMES avisos. La consola no es cacheja: sempre ha de servir l'ultima
// versio des del servidor.
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function(e){
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch(err){ d = { titol:'Metabolisme Espartà' }; }
  e.waitUntil(self.registration.showNotification(d.titol || 'Metabolisme Espartà', {
    body: d.cos || '',
    tag: d.ruta || 'esparta',
    data: { ruta: d.ruta || 'espartans' }
  }));
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var ruta = (e.notification.data && e.notification.data.ruta) || 'espartans';
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true })
    .then(function(finestres){
      for (var i = 0; i < finestres.length; i++){
        var f = finestres[i];
        if (f.url.indexOf(self.registration.scope) === 0){
          f.navigate(self.registration.scope + '#' + ruta).catch(function(){});
          return f.focus();
        }
      }
      return self.clients.openWindow('./#' + ruta);
    }));
});
