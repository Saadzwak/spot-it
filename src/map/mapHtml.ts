// mapHtml.ts — HTML auto-suffisant Mapbox GL JS v3, style "Standard" en 3D.
// Bâtiments 3D + lumière (dusk), caméra inclinée cinématique, bulles de marque
// avec halo, cercle de proximité ~400 m, point "spot" pulsant. Pont postMessage.
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
  lightPreset?: 'dawn' | 'day' | 'dusk' | 'night';
}): string {
  const { token, style, center, markers } = opts;
  const light = opts.lightPreset ?? 'dusk';
  const MGL = 'https://api.mapbox.com/mapbox-gl-js/v3.24.1/mapbox-gl';
  const TURF = 'https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js';
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link href="${MGL}.css" rel="stylesheet"/>
<script src="${MGL}.js"></script>
<script src="${TURF}"></script>
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:#1a1612;font-family:-apple-system,system-ui,sans-serif}
  .mapboxgl-ctrl-logo,.mapboxgl-ctrl-attrib{display:none!important}
  .bubble{position:relative;width:44px;height:44px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);
    display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;cursor:pointer;
    box-shadow:0 8px 20px rgba(0,0,0,.45);transition:transform .15s cubic-bezier(.34,1.4,.5,1)}
  .bubble span{transform:rotate(45deg);color:#fff;font-weight:800;font-size:14px;letter-spacing:.02em;text-shadow:0 1px 4px rgba(0,0,0,.4)}
  .bubble:active{transform:rotate(-45deg) scale(.9)}
  .bubble.sp::after{content:'';position:absolute;inset:-6px;border-radius:inherit;border:2px solid rgba(249,83,46,.7);animation:halo 1.8s ease-out infinite}
  @keyframes halo{0%{opacity:.8;transform:scale(.85)}100%{opacity:0;transform:scale(1.4)}}
  .userdot{width:20px;height:20px;border-radius:50%;background:#F9532E;border:3px solid #fff;
    box-shadow:0 0 0 6px rgba(249,83,46,.22),0 4px 12px rgba(0,0,0,.4);animation:pulse 2.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 6px rgba(249,83,46,.22),0 4px 12px rgba(0,0,0,.4)}50%{box-shadow:0 0 0 15px rgba(249,83,46,.05),0 4px 12px rgba(0,0,0,.4)}}
</style></head><body><div id="map"></div><script>
  mapboxgl.accessToken = ${JSON.stringify(token)};
  var OFFERS = ${JSON.stringify(markers)};
  var CENTER = ${JSON.stringify([center.lng, center.lat])};
  function post(o){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(o)); } }
  var map = new mapboxgl.Map({
    container:'map', style:${JSON.stringify(style)}, center:CENTER,
    zoom:15.2, pitch:58, bearing:-18, antialias:true, attributionControl:false
  });
  map.on('style.load', function(){
    try { map.setConfigProperty('basemap','lightPreset',${JSON.stringify(light)}); } catch(e){}
    try { map.setConfigProperty('basemap','showPointOfInterestLabels', false); } catch(e){}
  });
  map.on('load', function(){
    // cercle de proximité ~400 m
    try {
      var circle = turf.circle(CENTER, 0.4, { units:'kilometers', steps:80 });
      map.addSource('prox', { type:'geojson', data:circle });
      map.addLayer({ id:'prox-fill', type:'fill', source:'prox', paint:{ 'fill-color':'#F9532E','fill-opacity':0.10 }});
      map.addLayer({ id:'prox-line', type:'line', source:'prox', paint:{ 'line-color':'#F9532E','line-width':2,'line-opacity':0.7 }});
    } catch(e){}
    // point "spot" (user)
    var u = document.createElement('div'); u.className='userdot';
    new mapboxgl.Marker({ element:u }).setLngLat(CENTER).addTo(map);
    // bulles de marque
    OFFERS.forEach(function(o){
      if(o.lat==null||o.lng==null) return;
      var el = document.createElement('div'); el.className='bubble'+(o.sponsored?' sp':'');
      el.style.background = o.color || '#C75B43';
      var s = document.createElement('span'); s.textContent = o.initials || ''; el.appendChild(s);
      el.addEventListener('click', function(){ post({ type:'select', offerId:o.id }); });
      new mapboxgl.Marker({ element:el, anchor:'bottom' }).setLngLat([o.lng,o.lat]).addTo(map);
    });
    // intro cinématique
    map.easeTo({ pitch:58, bearing:18, duration:5000, easing:function(t){return t;} });
    post({ type:'ready' });
  });
  map.on('error', function(e){ post({ type:'error', message:(e&&e.error&&e.error.message)||'map error' }); });
  function onRN(e){ try { var d=JSON.parse(e.data); if(d.type==='flyTo'){ map.flyTo({ center:[d.lng,d.lat], zoom:16, pitch:60 }); } } catch(_){} }
  document.addEventListener('message', onRN); window.addEventListener('message', onRN);
</script></body></html>`;
}
