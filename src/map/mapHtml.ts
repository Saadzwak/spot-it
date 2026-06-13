// mapHtml.ts — HTML auto-suffisant pour Mapbox GL JS v3 dans une WebView.
// Bulles de marque + halo, cercle de proximité ~400 m (turf), point "spot" pulsant,
// pont postMessage (tap bulle → RN ; flyTo RN → carte).
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  initials: string;
  color: string;
  sponsored?: boolean;
}

export function buildMapHtml(opts: {
  token: string;
  style: string;
  center: { lat: number; lng: number };
  markers: MapMarker[];
}): string {
  const { token, style, center, markers } = opts;
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
  .bubble{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    color:#fff;font-weight:700;font-size:15px;letter-spacing:.02em;border:3px solid #fff;cursor:pointer;
    box-shadow:0 6px 16px rgba(23,19,15,.28);transition:transform .15s cubic-bezier(.34,1.4,.5,1)}
  .bubble:active{transform:scale(.92)}
  .bubble.sponsored{box-shadow:0 0 0 4px rgba(249,83,46,.35),0 6px 16px rgba(23,19,15,.28)}
  .userdot{width:18px;height:18px;border-radius:50%;background:#F9532E;border:3px solid #fff;
    box-shadow:0 0 0 6px rgba(249,83,46,.18);animation:pulse 2.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 6px rgba(249,83,46,.18)}50%{box-shadow:0 0 0 13px rgba(249,83,46,.05)}}
</style></head><body><div id="map"></div><script>
  mapboxgl.accessToken = ${JSON.stringify(token)};
  var OFFERS = ${JSON.stringify(markers)};
  var CENTER = ${JSON.stringify([center.lng, center.lat])};
  function post(o){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(o)); } }
  var map = new mapboxgl.Map({ container:'map', style:${JSON.stringify(style)}, center:CENTER, zoom:14, attributionControl:false });
  map.on('load', function(){
    try {
      var circle = turf.circle(CENTER, 0.4, { units:'kilometers', steps:72 });
      map.addSource('prox', { type:'geojson', data:circle });
      map.addLayer({ id:'prox-fill', type:'fill', source:'prox', paint:{ 'fill-color':'#F9532E','fill-opacity':0.07 }});
      map.addLayer({ id:'prox-line', type:'line', source:'prox', paint:{ 'line-color':'#F9532E','line-width':1.5,'line-dasharray':[2,2],'line-opacity':0.55 }});
    } catch(e){}
    var u = document.createElement('div'); u.className='userdot';
    new mapboxgl.Marker({ element:u }).setLngLat(CENTER).addTo(map);
    OFFERS.forEach(function(o){
      if(o.lat==null||o.lng==null) return;
      var el = document.createElement('div'); el.className='bubble'+(o.sponsored?' sponsored':'');
      el.style.background = o.color || '#C75B43'; el.textContent = o.initials || '';
      el.addEventListener('click', function(){ post({ type:'select', offerId:o.id }); });
      new mapboxgl.Marker({ element:el }).setLngLat([o.lng,o.lat]).addTo(map);
    });
    post({ type:'ready' });
  });
  map.on('error', function(e){ post({ type:'error', message:(e && e.error && e.error.message) || 'map error' }); });
  function onRN(e){ try { var d=JSON.parse(e.data); if(d.type==='flyTo'){ map.flyTo({ center:[d.lng,d.lat], zoom:15 }); } } catch(_){} }
  document.addEventListener('message', onRN); window.addEventListener('message', onRN);
</script></body></html>`;
}
