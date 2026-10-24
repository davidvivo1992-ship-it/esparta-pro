// Metabolisme Esparta · el fil de missatges dins la fitxa de l'Esparta
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;

E.filMissatges = function(cos, athleteId, nomAtleta){
  var zona = h('div','margin-top:26px');
  zona.appendChild(E.titol('Missatges', 15));
  zona.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:4px;line-height:1.5',
    'Un sol fil: hi escriviu l\'Espartà, tu i la nutricionista.'));
  var cont = h('div','margin-top:12px');
  zona.appendChild(cont);
  cos.appendChild(zona);
  carrega(cont, athleteId, nomAtleta);
};

function carrega(cont, athleteId, nomAtleta){
  E.buida(cont);
  cont.appendChild(E.carregant());
  E.sb.from('athlete_messages')
    .select('id,cos,created_at,llegit_at,autor_id,'+
            'autor:profiles!athlete_messages_autor_id_fkey(nom,cognoms,role)')
    .eq('athlete_id', athleteId).order('created_at')
    .then(function(r){
      E.buida(cont);
      if (r.error){ cont.appendChild(E.avis(r.error.message)); return; }
      pinta(cont, r.data || [], athleteId, nomAtleta);
    });
}

function qui(m, nomAtleta){
  if (m.autor_id === E.perfil.id) return 'Tu';
  var a = m.autor || {};
  if (a.role === 'coach') return 'Entrenador';
  if (a.role === 'nutritionist') return 'Nutricionista';
  return nomAtleta || E.nomComplet(a) || 'Espartà';
}

function hora(s){
  var d = new Date(s);
  var hm = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  return E.data(s) + ' \u00b7 ' + hm;
}

function pinta(cont, fil, athleteId, nomAtleta){
  var caixa = h('div','background:'+C.panell+';border:1px solid '+C.vora+';padding:15px 16px');

  if (!fil.length){
    caixa.appendChild(h('div','font-size:13px;color:'+C.apagat+';line-height:1.55;'+
      'margin-bottom:14px','Cap missatge encara. El que escriguis aquí li arribarà a l\'app.'));
  } else {
    var l = h('div','display:flex;flex-direction:column;gap:9px;max-height:420px;'+
      'overflow-y:auto;margin-bottom:14px');
    fil.forEach(function(m){
      var meu = m.autor_id === E.perfil.id;
      var esAtleta = !meu && (!m.autor || m.autor.role === 'athlete');
      var f = h('div','display:flex;'+(meu ? 'justify-content:flex-end' : ''));
      var color = meu ? E.accent() : (esAtleta ? C.or : C.verd);
      var b = h('div','max-width:78%;background:'+C.panell2+';padding:11px 13px;'+
        'border-left:3px solid '+color);
      b.appendChild(h('div','font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;'+
        'font-weight:700;color:'+color+';margin-bottom:5px', qui(m, nomAtleta)));
      b.appendChild(h('div','font-size:13.5px;color:'+C.os+';line-height:1.55;'+
        'white-space:pre-wrap;word-break:break-word', m.cos));
      var peu = h('div','display:flex;gap:9px;justify-content:flex-end;align-items:center;'+
        'margin-top:6px');
      peu.appendChild(h('div','font-size:10.5px;color:'+C.apagat, hora(m.created_at)));
      if (meu) peu.appendChild(h('div','font-size:10.5px;color:'+
        (m.llegit_at ? C.oliva : C.apagat), m.llegit_at ? 'llegit' : 'enviat'));
      b.appendChild(peu);
      f.appendChild(b);
      l.appendChild(f);
    });
    caixa.appendChild(l);
  }

  var ta = document.createElement('textarea');
  ta.rows = 2;
  ta.placeholder = 'Escriu a l\'Espartà…';
  ta.setAttribute('style','width:100%;padding:11px 13px;background:'+C.fons+';'+
    'border:1px solid rgba(194,176,106,.24);color:'+C.os+';font-size:13.5px;'+
    "font-family:'Barlow',sans-serif;resize:vertical");
  caixa.appendChild(ta);

  var miss = h('div','margin-top:9px');
  caixa.appendChild(miss);

  var fila = h('div','display:flex;gap:8px;margin-top:10px;align-items:center');
  var b = E.boto('Enviar', function(){
    E.buida(miss);
    var text = ta.value.trim();
    if (!text){ miss.appendChild(E.avis('Escriu alguna cosa abans d\'enviar.')); return; }
    b.disabled = true; b.textContent = 'Enviant…';
    E.sb.from('athlete_messages').insert({ athlete_id:athleteId, autor_id:E.perfil.id, cos:text })
      .then(function(r){
        b.disabled = false; b.textContent = 'Enviar';
        if (r.error){ miss.appendChild(E.avis(r.error.message)); return; }
        if (E.avisa) E.avisa(athleteId,
          E.perfil.role === 'nutritionist' ? 'La nutricionista t\'escriu'
                                           : 'El teu entrenador t\'escriu',
          E.resum(text), 'xat');
        carrega(cont, athleteId, nomAtleta);
      });
  });
  b.style.padding = '10px 20px'; b.style.fontSize = '12px';
  fila.appendChild(b);

  var noLlegits = fil.filter(function(m){
    return !m.llegit_at && m.autor_id !== E.perfil.id;
  }).length;
  if (noLlegits){
    var bl = E.boto('Marcar com a llegits', function(){
      E.sb.from('athlete_messages').update({ llegit_at:new Date().toISOString() })
        .eq('athlete_id', athleteId).is('llegit_at', null)
        .then(function(){ carrega(cont, athleteId, nomAtleta); });
    }, 'buit');
    bl.style.padding = '10px 16px'; bl.style.fontSize = '11.5px';
    fila.appendChild(bl);
    fila.appendChild(h('div','font-size:11.5px;color:'+C.or,
      noLlegits + (noLlegits === 1 ? ' missatge nou' : ' missatges nous')));
  }
  caixa.appendChild(fila);

  cont.appendChild(caixa);
}
})();
