// Metabolisme Esparta · Panell
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;

function xifra(valor, etiqueta, color, nota){
  var c = h('div','background:'+C.panell+';border:1px solid '+C.vora+';'+
    'border-top:2px solid '+color+';padding:16px 18px');
  c.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:30px;"+
    'line-height:1;color:'+C.os, String(valor)));
  c.appendChild(h('div','font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;'+
    'font-weight:700;color:'+color+';margin-top:7px', etiqueta));
  if (nota) c.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:4px;'+
    'line-height:1.4', nota));
  return c;
}

E.seccions.push({
  id:'panell', etiqueta:'Panell', icona:'\u25C8', rols:['coach','nutritionist'],
  pinta: function(cont){
    cont.appendChild(E.capcalera('Panell',
      E.perfil.role === 'coach' ? 'Estat de la teva tropa' : 'Els teus Espartans'));
    var cos = E.cos();
    cos.appendChild(E.carregant());
    cont.appendChild(cos);

    var fa7 = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);

    Promise.all([
      E.sb.from('athletes').select('id,estat'),
      E.sb.from('workout_sessions').select('id,estat,data').gte('data', fa7),
      E.sb.from('measurements').select('id,data').gte('data', fa7),
      E.sb.from('leads').select('id,estat').neq('estat','convertit').neq('estat','descartat')
    ]).then(function(r){
      E.buida(cos);
      var atl = r[0].data || [], ses = r[1].data || [],
          mes = r[2].data || [], lea = r[3].data || [];
      if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }

      var actius = atl.filter(function(a){ return a.estat === 'actiu'; }).length;
      var pausa  = atl.filter(function(a){ return a.estat === 'pausa'; }).length;
      var fetes  = ses.filter(function(s){ return s.estat === 'completada'; }).length;
      var saltades = ses.filter(function(s){ return s.estat === 'saltada'; }).length;
      var adher = (fetes + saltades) ? Math.round(fetes / (fetes + saltades) * 100) : null;

      var graella = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));'+
        'gap:14px;margin-bottom:26px');
      graella.appendChild(xifra(actius, 'Espartans actius', C.oliva,
        pausa ? pausa + ' en pausa' : null));
      graella.appendChild(xifra(fetes, 'Sessions · 7 dies', E.accent(),
        saltades ? saltades + ' saltades' : 'cap saltada'));
      graella.appendChild(xifra(adher == null ? '\u2014' : adher + '%', 'Adherència · 7 dies',
        adher == null ? C.apagat : adher >= 80 ? C.oliva : adher >= 60 ? C.ambre : C.accio,
        adher == null ? 'sense sessions programades' : null));
      graella.appendChild(xifra(mes.length, 'Pesatges · 7 dies', C.or));
      if (E.perfil.role === 'coach' && !r[3].error)
        graella.appendChild(xifra(lea.length, 'Candidats oberts', C.bronze,
          lea.length ? 'pendents de convertir' : 'cap pendent'));
      cos.appendChild(graella);

      if (!atl.length){
        cos.appendChild(E.buit(E.perfil.role === 'coach'
          ? "Encara no hi ha cap Espartà. Comença per donar-ne d'alta a «Espartans»."
          : "Encara no t'han assignat cap Espartà."));
        return;
      }

      cos.appendChild(E.titol('Accions ràpides', 15));
      var acc = h('div','display:flex;gap:10px;flex-wrap:wrap;margin-top:12px');
      acc.appendChild(E.boto('Veure Espartans', function(){ E.vesA('espartans'); }));
      if (E.perfil.role === 'coach')
        acc.appendChild(E.boto("Alta d'Espartà", function(){
          E.novaAlta = true; location.hash = 'espartans';
        }, 'buit'));
      cos.appendChild(acc);
    });
  }
});
})();
