(function(){
  const themes={
    classic:{name:'Classic White • Navy • Purple',bg:'#f7f8fc',surface:'#ffffff',surface2:'#f1f3f9',text:'#18233a',muted:'#68738a',border:'#dfe4ef',primary:'#4f46e5',primary2:'#263b80'},
    ocean:{name:'Ocean Blue',bg:'#f4fbff',surface:'#fff',surface2:'#e8f6ff',text:'#10304a',muted:'#61778a',border:'#d5e8f3',primary:'#087ea4',primary2:'#0b4f71'},
    violet:{name:'Royal Violet',bg:'#faf7ff',surface:'#fff',surface2:'#f1eaff',text:'#28143f',muted:'#76658a',border:'#e6d9f5',primary:'#7c3aed',primary2:'#4c1d95'},
    indigo:{name:'Indigo Pro',bg:'#f7f8ff',surface:'#fff',surface2:'#ecefff',text:'#17204a',muted:'#687092',border:'#dce1f3',primary:'#4f46e5',primary2:'#3730a3'},
    mint:{name:'Mint Focus',bg:'#f4fbf8',surface:'#fff',surface2:'#e8f7f1',text:'#12382e',muted:'#658279',border:'#d5ebe3',primary:'#059669',primary2:'#065f46'},
    rose:{name:'Rose Premium',bg:'#fff7fa',surface:'#fff',surface2:'#fdebf2',text:'#421c2a',muted:'#866774',border:'#f0d9e2',primary:'#db2777',primary2:'#9d174d'},
    amber:{name:'Amber Study',bg:'#fffaf0',surface:'#fff',surface2:'#fff2d6',text:'#402d0b',muted:'#88754e',border:'#f1dfb5',primary:'#d97706',primary2:'#92400e'},
    graphite:{name:'Graphite',bg:'#f4f5f6',surface:'#fff',surface2:'#e9ebee',text:'#20252b',muted:'#69717b',border:'#d9dde2',primary:'#374151',primary2:'#111827'},
    sky:{name:'Sky Scholar',bg:'#f3f9ff',surface:'#fff',surface2:'#e7f2ff',text:'#15304b',muted:'#637b93',border:'#d5e5f4',primary:'#2563eb',primary2:'#1e40af'},
    teal:{name:'Teal Academy',bg:'#f2fbfb',surface:'#fff',surface2:'#e4f5f5',text:'#123b3c',muted:'#648081',border:'#d3e8e8',primary:'#0f766e',primary2:'#115e59'},
    lavender:{name:'Soft Lavender',bg:'#faf9ff',surface:'#fff',surface2:'#f0effb',text:'#272344',muted:'#777392',border:'#e2e0f0',primary:'#6366f1',primary2:'#4338ca'}
  };
  const key=localStorage.getItem('examyTheme')||'classic';
  const t=themes[key]||themes.classic;
  document.documentElement.dataset.theme=key;
  document.documentElement.style.setProperty('--theme-bg',t.bg);
  document.documentElement.style.setProperty('--theme-surface',t.surface);
  document.documentElement.style.setProperty('--theme-surface2',t.surface2);
  document.documentElement.style.setProperty('--theme-text',t.text);
  document.documentElement.style.setProperty('--theme-muted',t.muted);
  document.documentElement.style.setProperty('--theme-border',t.border);
  document.documentElement.style.setProperty('--theme-primary',t.primary);
  document.documentElement.style.setProperty('--theme-primary2',t.primary2);
  window.EXAMY_THEMES=themes;
})();
