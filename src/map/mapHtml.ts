// mapHtml.ts — Mapbox GL JS v3 en 2D (fluide). Marqueurs photo ronds, cercle de
// proximité ~400 m, point "spot", ITINÉRAIRE à pied (Directions API) + ETA.
// Pont postMessage : RN -> {type:'route',lng,lat,offerId} | {type:'clearRoute'} ;
//                     page -> {type:'select',offerId} | {type:'eta',...} | {type:'ready'}.
export interface MapMarker {
  id: string; lat: number; lng: number;
  image?: string; initials: string; color: string; sponsored?: boolean;
}

export function buildMapHtml(opts: {
  token: string;
  style: string;
  center: { lat: number; lng: number };
  markers: MapMarker[];
}): string {
  const { token, center, markers } = opts;
  const style = 'mapbox://styles/mapbox/light-v11'; // 2D épuré + rapide
  const MGL = 'https://api.mapbox.com/mapbox-gl-js/v3.24.1/mapbox-gl';
  const TURF = 'https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js';
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link href="${MGL}.css" rel="stylesheet"/>
<script src="${MGL}.js"></script>
<script src="${TURF}"></script>
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:#F7F5F1;font-family:-apple-system,system-ui,sans-serif}
  .mapboxgl-ctrl-logo,.mapboxgl-ctrl-attrib{display:none!important}
  .pin{width:46px;height:46px;border-radius:50%;border:3px solid #fff;overflow:hidden;cursor:pointer;
    background:#C75B43;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;
    box-shadow:0 4px 12px rgba(23,19,15,.28);transition:transform .15s cubic-bezier(.34,1.4,.5,1)}
  .pin img{width:100%;height:100%;object-fit:cover;display:block}
  .pin:active{transform:scale(.9)}
  .pin.sel{transform:scale(1.18);border-color:#F9532E}
  .pin.sp{box-shadow:0 0 0 3px rgba(249,83,46,.7),0 4px 12px rgba(23,19,15,.28)}
  .userdot{width:18px;height:18px;border-radius:50%;background:#F9532E;border:3px solid #fff;
    box-shadow:0 0 0 6px rgba(249,83,46,.2);animation:pulse 2.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 6px rgba(249,83,46,.2)}50%{box-shadow:0 0 0 13px rgba(249,83,46,.05)}}
</style></head><body><div id="map"></div><script>
  mapboxgl.accessToken = ${JSON.stringify(token)};
  var OFFERS = ${JSON.stringify(markers)};
  var CENTER = ${JSON.stringify([center.lng, center.lat])};
  var pins = {};
  function post(o){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(o)); } }
  var map = new mapboxgl.Map({ container:'map', style:${JSON.stringify(style)}, center:CENTER, zoom:14.4, pitch:0, bearing:0, attributionControl:false });

  map.on('load', function(){
    try {
      var circle = turf.circle(CENTER, 0.4, { units:'kilometers', steps:80 });
      map.addSource('prox', { type:'geojson', data:circle });
      map.addLayer({ id:'prox-fill', type:'fill', source:'prox', paint:{ 'fill-color':'#F9532E','fill-opacity':0.06 }});
      map.addLayer({ id:'prox-line', type:'line', source:'prox', paint:{ 'line-color':'#F9532E','line-width':1.5,'line-opacity':0.5 }});
    } catch(e){}
    var u = document.createElement('div'); u.className='userdot';
    new mapboxgl.Marker({ element:u }).setLngLat(CENTER).addTo(map);
    OFFERS.forEach(function(o){
      if(o.lat==null||o.lng==null) return;
      var el = document.createElement('div'); el.className='pin'+(o.sponsored?' sp':'');
      el.style.background = o.color || '#C75B43';
      if(o.image){ var im=document.createElement('img'); im.src=o.image; im.referrerPolicy='no-referrer'; el.appendChild(im); }
      else { el.textContent = o.initials || ''; }
      el.addEventListener('click', function(){ post({ type:'select', offerId:o.id }); });
      pins[o.id]=el;
      new mapboxgl.Marker({ element:el, anchor:'center' }).setLngLat([o.lng,o.lat]).addTo(map);
    });
    post({ type:'ready' });
  });
  map.on('error', function(e){ post({ type:'error', message:(e&&e.error&&e.error.message)||'map error' }); });

  function highlight(id){ for(var k in pins){ pins[k].classList.toggle('sel', k===id); } }

  function drawRoute(lng, lat, offerId){
    highlight(offerId);
    var url = 'https://api.mapbox.com/directions/v5/mapbox/walking/'+CENTER[0]+','+CENTER[1]+';'+lng+','+lat+
      '?geometries=geojson&overview=full&access_token='+mapboxgl.accessToken;
    fetch(url).then(function(r){return r.json();}).then(function(d){
      if(!d.routes||!d.routes[0]){ post({type:'eta', offerId:offerId, error:'no_route'}); return; }
      var route = d.routes[0];
      var gj = { type:'Feature', geometry: route.geometry };
      if(map.getSource('route')){ map.getSource('route').setData(gj); }
      else {
        map.addSource('route', { type:'geojson', data: gj });
        map.addLayer({ id:'route-casing', type:'line', source:'route', layout:{'line-cap':'round','line-join':'round'}, paint:{ 'line-color':'#fff','line-width':9 }});
        map.addLayer({ id:'route-line', type:'line', source:'route', layout:{'line-cap':'round','line-join':'round'}, paint:{ 'line-color':'#F9532E','line-width':5 }});
      }
      // zoome SUR l'offre sélectionnée (et non dézoomer pour tout englober)
      map.flyTo({ center:[lng,lat], zoom: 16, duration: 800, padding:{ top:40, bottom:240, left:40, right:40 } });
      post({ type:'eta', offerId:offerId, durationMin: Math.max(1, Math.round(route.duration/60)), distanceM: Math.round(route.distance) });
    }).catch(function(){ post({type:'eta', offerId:offerId, error:'fetch'}); });
  }
  function clearRoute(){ highlight(null); if(map.getLayer('route-line')){ map.removeLayer('route-line'); } if(map.getLayer('route-casing')){ map.removeLayer('route-casing'); } if(map.getSource('route')){ map.removeSource('route'); } }

  function onRN(e){ try { var d=JSON.parse(e.data);
    if(d.type==='route'){ drawRoute(d.lng, d.lat, d.offerId); }
    else if(d.type==='clearRoute'){ clearRoute(); }
    else if(d.type==='flyTo'){ map.flyTo({ center:[d.lng,d.lat], zoom:15 }); }
  } catch(_){} }
  document.addEventListener('message', onRN); window.addEventListener('message', onRN);
</script></body></html>`;
}
