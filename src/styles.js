export const CSS = `
    @keyframes flicker{0%,100%{opacity:1;transform:scaleY(1)}50%{opacity:.85;transform:scaleY(.95)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes twinkle{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes firefly{0%{opacity:0;transform:translate(0,0) scale(0.5)}15%{opacity:1;transform:translate(8px,-12px) scale(1)}50%{opacity:0.6;transform:translate(-6px,-28px) scale(0.8)}85%{opacity:1;transform:translate(10px,-16px) scale(1.1)}100%{opacity:0;transform:translate(2px,-40px) scale(0.4)}}
    @keyframes doorGlow{0%,100%{box-shadow:0 0 20px rgba(201,169,110,0.3),0 0 60px rgba(201,169,110,0.1)}50%{box-shadow:0 0 30px rgba(201,169,110,0.5),0 0 80px rgba(201,169,110,0.2)}}
    @keyframes gentlePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
    @keyframes sceneZoomIn{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.08)}}
    @keyframes sceneFadeIn{from{opacity:0}to{opacity:1}}
    @keyframes smokeDrift{0%{opacity:0;transform:translate(0,0) scale(0.3)}20%{opacity:0.4}60%{opacity:0.2;transform:translate(-12px,-40px) scale(0.7)}100%{opacity:0;transform:translate(-20px,-70px) scale(1)}}
    @keyframes windowGlow{0%,100%{opacity:0.4;box-shadow:0 0 15px rgba(255,200,80,0.3)}50%{opacity:0.7;box-shadow:0 0 30px rgba(255,200,80,0.5)}}
    @keyframes waterShimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
    @keyframes textFloat{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .scene-text{animation:textFloat .35s .08s ease both}
    .scene-text2{animation:textFloat .35s .16s ease both}
    .scene-text3{animation:textFloat .35s .24s ease both}
    @keyframes lightRayShift{0%{opacity:0.5;transform:rotate(-3deg)}100%{opacity:0.8;transform:rotate(3deg)}}
    @keyframes dustFloat{0%{opacity:0;transform:translate(0,0)}25%{opacity:0.6;transform:translate(5px,-8px)}50%{opacity:0.3;transform:translate(-3px,-16px)}75%{opacity:0.5;transform:translate(7px,-10px)}100%{opacity:0;transform:translate(2px,-20px)}}
    @keyframes bookSlideUp{from{transform:translateY(100%);opacity:0.5}to{transform:translateY(0);opacity:1}}
    @keyframes spaceFadeIn{from{opacity:0}to{opacity:1}}
    @keyframes spaceFadeOut{from{opacity:1}to{opacity:0}}
    button{touch-action:manipulation}
    .fu{animation:fadeUp .3s ease both}
    .fu2{animation:fadeUp .3s .06s ease both}
    .fu3{animation:fadeUp .3s .12s ease both}
    .fu4{animation:fadeUp .3s .18s ease both}
    .room-c:hover{transform:translateY(-3px)!important;box-shadow:0 12px 36px rgba(0,0,0,0.12)!important;}
    textarea::placeholder{font-style:italic;opacity:0.45}
    textarea:focus,input:focus{outline:none}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:rgba(150,130,110,0.25);border-radius:2px}
    .door-btn{transition:all 0.4s ease;animation:doorGlow 3s ease-in-out infinite}
    .door-btn:hover{transform:scale(1.06);box-shadow:0 0 40px rgba(201,169,110,0.6),0 0 100px rgba(201,169,110,0.3)!important}
    .door-btn:active{transform:scale(0.97)}
    @keyframes pageRevealFwd{0%{transform:perspective(1200px) rotateY(45deg);opacity:0;transform-origin:left center}100%{transform:perspective(1200px) rotateY(0deg);opacity:1;transform-origin:left center}}
    @keyframes pageRevealBwd{0%{transform:perspective(1200px) rotateY(-45deg);opacity:0;transform-origin:right center}100%{transform:perspective(1200px) rotateY(0deg);opacity:1;transform-origin:right center}}
    @keyframes bookOpenAnim{0%{transform:translate(-50%,-50%) scale(0.88);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
    @keyframes pageInitial{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes sparkle{0%{opacity:0;transform:translate(0,0) scale(0.3)}30%{opacity:1;transform:translate(4px,-10px) scale(1)}70%{opacity:0.3;transform:translate(-3px,-20px) scale(0.5)}100%{opacity:0;transform:translate(6px,-30px) scale(0.2)}}
    @keyframes pageContentReveal{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
    .book-nav{transition:all .2s}
    .book-nav:hover{background:rgba(101,83,55,0.15)!important;border-color:rgba(101,83,55,0.3)!important}
    .book-nav:active{transform:translateY(-50%) scale(0.9)!important}
    @keyframes streakFloat{0%{opacity:0;transform:translate(-50%,-20px) scale(0.8)}15%{opacity:1;transform:translate(-50%,0) scale(1)}85%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-12px) scale(0.9)}}
    @keyframes candleFloat{0%{opacity:0;transform:translate(-50%,10px) scale(0.8)}12%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-18px) scale(0.85)}}
    @keyframes insightsSlideUp{from{opacity:0;transform:translate(-50%,-50%) scale(0.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
    @keyframes candlePulse{0%,100%{filter:drop-shadow(0 0 8px rgba(255,200,80,0.3))}50%{filter:drop-shadow(0 0 18px rgba(255,200,80,0.6))}}
    @keyframes shelfDust{0%{opacity:0;transform:translate(0,0) scale(0.3)}20%{opacity:0.7;transform:translate(3px,-6px) scale(0.8)}50%{opacity:0.3;transform:translate(-2px,-14px) scale(0.6)}80%{opacity:0.5;transform:translate(4px,-8px) scale(0.9)}100%{opacity:0;transform:translate(1px,-18px) scale(0.3)}}
    @keyframes shelfGlow{0%,100%{box-shadow:0 0 8px rgba(255,200,80,0.08),0 0 20px rgba(255,200,80,0.03)}50%{box-shadow:0 0 16px rgba(255,200,80,0.18),0 0 35px rgba(255,200,80,0.06)}}
    @keyframes shelfBookLift{0%{transform:translate(0,0) scale(1);opacity:1}30%{transform:translate(-3px,-12px) scale(1.08);opacity:1}100%{transform:translate(-3px,-12px) scale(1.08);opacity:1}}
    @keyframes bookArcToDesk{0%{opacity:1;transform:translate(0,0) scale(1.1)}25%{opacity:1;transform:translate(-80px,-30px) scale(1.25)}55%{opacity:0.9;transform:translate(-180px,40px) scale(1.1)}85%{opacity:0.7;transform:translate(-220px,100px) scale(0.85)}100%{opacity:0;transform:translate(-240px,140px) scale(0.7)}}
    @keyframes bookArcToDeskBottom{0%{opacity:1;transform:translate(0,0) scale(1.1)}25%{opacity:1;transform:translate(-70px,-50px) scale(1.25)}55%{opacity:0.9;transform:translate(-160px,20px) scale(1.1)}85%{opacity:0.7;transform:translate(-200px,80px) scale(0.85)}100%{opacity:0;transform:translate(-230px,120px) scale(0.7)}}
    @keyframes deskBookFadeOut{0%{opacity:1;transform:translateX(0) scale(1)}100%{opacity:0;transform:translateX(-20px) scale(0.92)}}
    @keyframes deskBookFadeIn{0%{opacity:0;transform:translateY(8px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
    .shelf-hotspot{transition:all .4s cubic-bezier(.25,.8,.25,1);cursor:pointer;position:relative}
    .shelf-hotspot:hover{transform:translate(-2px,-6px) scale(1.06)!important}
    .shelf-hotspot:active{transform:translate(-1px,-3px) scale(0.98)!important}
    .window-hotspot{transition:all .3s}
    .window-hotspot:hover{background:rgba(255,200,80,0.12)!important}
    @keyframes cabinFirelight{0%,100%{opacity:0.5}25%{opacity:0.85}50%{opacity:0.4}75%{opacity:0.7}}
    @keyframes fireMotion{0%,100%{opacity:0.5;transform:scaleY(1) scaleX(1)}20%{opacity:0.85;transform:scaleY(1.06) scaleX(0.96)}45%{opacity:0.4;transform:scaleY(0.94) scaleX(1.03)}65%{opacity:0.75;transform:scaleY(1.03) scaleX(0.98)}85%{opacity:0.55;transform:scaleY(0.97) scaleX(1.01)}}
    @keyframes fireFlicker{0%,100%{opacity:0.4;transform:scaleY(1)}30%{opacity:0.9;transform:scaleY(1.08)}60%{opacity:0.3;transform:scaleY(0.92)}80%{opacity:0.7;transform:scaleY(1.04)}}
    @keyframes candleGlowPulse{0%,100%{opacity:0.5;transform:scale(1)}40%{opacity:0.9;transform:scale(1.1)}70%{opacity:0.4;transform:scale(0.95)}}
    @keyframes stringLightTwinkle{0%,100%{opacity:0.4}25%{opacity:0.7}50%{opacity:0.35}75%{opacity:0.65}}
    .cabin-fire-motion{animation:fireMotion 2.5s ease-in-out infinite}
    .cabin-fire-flicker{animation:fireFlicker 1.8s ease-in-out infinite}
    .cabin-string-lights{animation:stringLightTwinkle 6s ease-in-out infinite}
    .cabin-candle-glow{animation:candleGlowPulse 3.5s ease-in-out infinite}
    .cabin-candle-glow2{animation:candleGlowPulse 4.2s ease-in-out infinite 0.8s}
    .cabin-firelight{animation:cabinFirelight 4s ease-in-out infinite}
    .wp-option{transition:all .2s;cursor:pointer}
    .wp-option:hover{background:rgba(255,255,255,0.08)!important;transform:translateY(-2px)}
    .book-room:hover{border-color:rgba(101,83,55,0.4)!important;background:linear-gradient(135deg,rgba(101,83,55,0.08),rgba(101,83,55,0.03))!important}
    @keyframes bookFlyToDesk{0%{opacity:1;transform:translate(0,0) scale(1)}40%{opacity:1;transform:translate(-120px,-40px) scale(1.3)}100%{opacity:0;transform:translate(-200px,120px) scale(0.7)}}
    @keyframes bookArcFromBottom{0%{opacity:1;transform:translate(0,0) scale(1)}30%{opacity:1;transform:translate(0,-60px) scale(1.25)}60%{opacity:0.9;transform:translate(-20px,-120px) scale(1.1)}100%{opacity:0;transform:translate(-30px,-160px) scale(0.75)}}
    @keyframes hotspotPulse{0%,100%{box-shadow:0 0 15px rgba(255,200,80,0.15),0 0 40px rgba(255,200,80,0.05)}50%{box-shadow:0 0 25px rgba(255,200,80,0.3),0 0 60px rgba(255,200,80,0.1)}}
    @keyframes doorLabelFade{0%,100%{opacity:0.5}50%{opacity:1}}
    @keyframes magicGlow{0%,100%{box-shadow:0 0 12px rgba(255,210,120,0.12),0 0 30px rgba(255,200,100,0.06),inset 0 0 8px rgba(255,210,120,0.04)}50%{box-shadow:0 0 22px rgba(255,210,120,0.28),0 0 50px rgba(255,200,100,0.12),inset 0 0 14px rgba(255,210,120,0.08)}}
    @keyframes magicGlowOuter{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:0.7;transform:scale(1.04)}}
    @keyframes hotspotPulse{0%,100%{opacity:0.25;transform:scale(0.92)}50%{opacity:1;transform:scale(1.3)}}
    .magic-hotspot{cursor:pointer;transition:all .3s ease}
    .magic-hotspot:hover{box-shadow:0 0 30px rgba(255,210,120,0.35),0 0 60px rgba(255,200,100,0.15)!important}
    .magic-hotspot:active{transform:scale(0.97)!important;box-shadow:0 0 15px rgba(255,210,120,0.2)!important}
    @keyframes cottage-flicker-a{0%,100%{opacity:0.85;transform:translate(-50%,-50%) scale(1)}22%{opacity:0.74;transform:translate(-50%,-50%) scale(0.98)}42%{opacity:0.92;transform:translate(-50%,-50%) scale(1.03)}63%{opacity:0.78;transform:translate(-50%,-50%) scale(0.99)}84%{opacity:0.88;transform:translate(-50%,-50%) scale(1.02)}}
    @keyframes cottage-flicker-b{0%,100%{opacity:0.78;transform:translate(-50%,-50%) scale(1)}19%{opacity:0.92;transform:translate(-50%,-50%) scale(1.04)}38%{opacity:0.68;transform:translate(-50%,-50%) scale(0.97)}57%{opacity:0.86;transform:translate(-50%,-50%) scale(1.02)}78%{opacity:0.72;transform:translate(-50%,-50%) scale(0.99)}}
    @keyframes nookSteamRise{0%{opacity:0;transform:translateY(0) translateX(0) scale(0.7)}18%{opacity:0.5}55%{opacity:0.3;transform:translateY(-26px) translateX(4px) scale(1.25)}100%{opacity:0;transform:translateY(-52px) translateX(-3px) scale(1.7)}}
    @keyframes kitchenFireGlow{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
    @keyframes stoveFireGlow{0%,100%{opacity:0.7;transform:scale(1)}35%{opacity:1;transform:scale(1.06)}65%{opacity:0.85;transform:scale(1.02)}100%{opacity:0.7;transform:scale(1)}}
    @keyframes kitchenSteam{0%,100%{opacity:0.3;transform:translateY(0) scale(1)}50%{opacity:0.7;transform:translateY(-6px) scale(1.08)}}
    @keyframes stoveGlowPulse{0%,100%{box-shadow:0 0 20px rgba(255,120,30,0.15),0 0 50px rgba(255,100,10,0.08),inset 0 0 10px rgba(255,140,40,0.05)}50%{box-shadow:0 0 35px rgba(255,120,30,0.35),0 0 80px rgba(255,100,10,0.18),inset 0 0 18px rgba(255,140,40,0.10)}}
    @keyframes stoveGlowOuter{0%,100%{opacity:0.25;transform:scale(1)}50%{opacity:0.6;transform:scale(1.06)}}
    @keyframes walkToStoveZoom{0%{transform:scale(1);filter:brightness(1)}40%{transform:scale(1.8);filter:brightness(1.1)}75%{transform:scale(3);filter:brightness(0.5)}100%{transform:scale(4.5);filter:brightness(0)}}
    @keyframes walkToStoveVignette{0%{opacity:0}60%{opacity:0}100%{opacity:1}}
    @keyframes walkToWindowZoom{0%{transform:scale(1);filter:brightness(1)}40%{transform:scale(1.6);filter:brightness(1.15)}75%{transform:scale(2.8);filter:brightness(0.45)}100%{transform:scale(4);filter:brightness(0)}}
    @keyframes walkToWindowVignette{0%{opacity:0}60%{opacity:0}100%{opacity:1}}
    @keyframes walkToJournalZoom{0%{transform:scale(1);filter:brightness(1)}35%{transform:scale(1.6);filter:brightness(1.15)}70%{transform:scale(3.2);filter:brightness(0.4)}100%{transform:scale(5);filter:brightness(0)}}
    @keyframes walkToJournalVignette{0%{opacity:0}55%{opacity:0}100%{opacity:1}}
    @keyframes journalDeskReveal{0%{opacity:0;transform:scale(1.08)}40%{opacity:1;transform:scale(1.02)}100%{opacity:1;transform:scale(1)}}
    @keyframes waterShimmer{0%,100%{opacity:0.12;transform:scaleY(1)}50%{opacity:0.25;transform:scaleY(1.02)}}
    @keyframes mistDrift{0%{transform:translateX(-5%) translateY(2%);opacity:0.15}50%{transform:translateX(3%) translateY(-1%);opacity:0.25}100%{transform:translateX(-5%) translateY(2%);opacity:0.15}}
    @keyframes lanternFlicker{0%{opacity:0.7;transform:scale(1)}12%{opacity:1;transform:scale(1.08)}28%{opacity:0.75;transform:scale(0.97)}42%{opacity:1;transform:scale(1.10)}58%{opacity:0.65;transform:scale(0.96)}70%{opacity:1;transform:scale(1.06)}85%{opacity:0.7;transform:scale(1.01)}100%{opacity:0.7;transform:scale(1)}}
    @keyframes windowGlow{0%,100%{opacity:0.55;transform:scale(1)}30%{opacity:0.9;transform:scale(1.03)}60%{opacity:0.6;transform:scale(0.98)}80%{opacity:0.95;transform:scale(1.02)}}
    @keyframes chimneySmoke{0%{transform:translateY(0) translateX(0) scale(1);opacity:0.30}25%{transform:translateY(-18px) translateX(4px) scale(1.15);opacity:0.22}50%{transform:translateY(-38px) translateX(-3px) scale(1.35);opacity:0.14}75%{transform:translateY(-58px) translateX(6px) scale(1.55);opacity:0.07}100%{transform:translateY(-80px) translateX(2px) scale(1.8);opacity:0}}
    @keyframes chimneySmokeB{0%{transform:translateY(0) translateX(2px) scale(1);opacity:0.25}25%{transform:translateY(-22px) translateX(-5px) scale(1.2);opacity:0.18}50%{transform:translateY(-42px) translateX(4px) scale(1.4);opacity:0.10}75%{transform:translateY(-65px) translateX(-2px) scale(1.6);opacity:0.05}100%{transform:translateY(-85px) translateX(-4px) scale(1.85);opacity:0}}
    @keyframes shelfBookHover{0%,100%{transform:translateX(0)}50%{transform:translateX(-4px)}}
    @keyframes windowPanelSlide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes windowPanelSlideLeft{from{transform:translateX(-100%);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes doorLightBurst{0%{transform:translate(-50%,-50%) scale(0.05);opacity:0}40%{opacity:0.85}100%{transform:translate(-50%,-50%) scale(4);opacity:1}}
    @keyframes doorFadeWarm{0%{opacity:0}55%{opacity:0}100%{opacity:1}}
    @keyframes doorZoomBg{0%{transform:scale(1);filter:brightness(1)}100%{transform:scale(1.12);filter:brightness(1.3)}}
    @keyframes walkToDoor{0%{transform:scale(1);filter:brightness(1.25)}35%{transform:scale(1.6);filter:brightness(1.15)}65%{transform:scale(3);filter:brightness(0.6)}100%{transform:scale(5.5);filter:brightness(0)}}
    @keyframes doorReveal{0%{opacity:0;transform:scale(1.12)}25%{opacity:1;transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
    @keyframes doorHoldZoom{0%{transform:scale(1)}100%{transform:scale(1.03)}}
    @keyframes doorEnterZoom{0%{transform:scale(1.03);filter:brightness(1)}60%{transform:scale(1.6);filter:brightness(1.8)}100%{transform:scale(2.2);filter:brightness(2.5)}}
    @keyframes doorEnterFade{0%{opacity:0}100%{opacity:1}}
    @keyframes walkVignette{0%{opacity:0}60%{opacity:0.3}100%{opacity:1}}
    @keyframes gardenSway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
    @keyframes gardenGrow{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes harvestGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(255,220,80,0.4)) brightness(1.1)}50%{filter:drop-shadow(0 0 18px rgba(255,200,60,0.7)) brightness(1.2)}}
    @keyframes harvestBounce{0%{transform:scale(1)}25%{transform:scale(1.15)}50%{transform:scale(0.95)}75%{transform:scale(1.05)}100%{transform:scale(1)}}
    @keyframes gardenPlotFadeIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.8)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
    @keyframes doorChoiceFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes bloomPulse{0%,100%{filter:drop-shadow(0 0 6px rgba(180,140,255,0.3))}50%{filter:drop-shadow(0 0 16px rgba(180,140,255,0.6))}}
    @keyframes emptyPlotPulse{0%,100%{opacity:0.35;transform:scale(1)}50%{opacity:0.7;transform:scale(1.12)}}
    @keyframes gardenPlotHover{0%,100%{box-shadow:0 0 8px rgba(255,200,80,0.08)}50%{box-shadow:0 0 18px rgba(255,200,80,0.2)}}
    @keyframes gardenDoorGlow{0%,100%{box-shadow:0 0 20px rgba(255,200,80,0.15),0 0 50px rgba(255,200,80,0.05)}50%{box-shadow:0 0 35px rgba(255,200,80,0.3),0 0 80px rgba(255,200,80,0.1)}}
    .garden-lantern-glow{animation:candleGlowPulse 4s ease-in-out infinite}
    .garden-lantern-glow2{animation:candleGlowPulse 4.8s ease-in-out infinite 1s}
    .garden-door-glow{animation:candleGlowPulse 3.5s ease-in-out infinite 0.5s}
    .garden-string-lights{animation:stringLightTwinkle 7s ease-in-out infinite}
    @keyframes animalBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    @keyframes produceFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-6px) scale(1.1)}}
    .animal-slot{transition:transform .15s ease;cursor:pointer}
    .animal-slot:active{transform:translate(-50%,-50%) scale(0.9)!important}
    .garden-plot-hotspot{transition:all .25s ease;cursor:pointer}
    .garden-plot-hotspot:hover{transform:translate(-50%,-50%) scale(1.12)!important}
    .garden-plot-hotspot:active{transform:translate(-50%,-50%) scale(0.92)!important}
    .garden-plot{transition:all .2s ease;cursor:pointer}
    .garden-plot:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.15)!important}
    .garden-plot:active{transform:scale(0.96)}
    .craft-btn{transition:all .2s}
    .craft-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.15)!important}
    @keyframes panelSlideUp{from{transform:translateY(100%);opacity:0.5}to{transform:translateY(0);opacity:1}}
    @keyframes mapHotspotFadeIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.7)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
    @keyframes mapLabelFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    .map-hotspot{cursor:pointer}
    .map-hotspot:hover{box-shadow:0 0 35px rgba(255,210,120,0.45),0 0 70px rgba(255,210,120,0.15)!important;transform:translate(-50%,-50%) scale(1.08)!important}
    .map-hotspot:active{transform:translate(-50%,-50%) scale(0.94)!important}
    @keyframes verseReveal{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes actionBarSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
    @keyframes overlayFadeIn{from{opacity:0}to{opacity:1}}
    @keyframes mapBtnGlow{0%,100%{box-shadow:0 0 8px rgba(255,210,120,0.15),0 2px 12px rgba(0,0,0,0.3)}50%{box-shadow:0 0 18px rgba(255,210,120,0.35),0 2px 12px rgba(0,0,0,0.3)}}
    @keyframes soundBar{0%{height:20%}100%{height:100%}}
    @keyframes menuDrawerUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes panelSlideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
    .verse-tap:active{transform:scale(0.98);}
    .bible-book{transition:all .2s ease;cursor:pointer}.bible-book:hover{background:rgba(180,160,210,0.12)!important;transform:translateX(4px)}.bible-book:active{transform:translateX(2px) scale(0.98)}
    .bible-chap{transition:all .2s ease;cursor:pointer}.bible-chap:hover{background:rgba(180,160,210,0.18)!important;transform:scale(1.08)}.bible-chap:active{transform:scale(0.94)}
  `;
