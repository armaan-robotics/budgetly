"use client";
import { Theme, AppMode } from "./types";

export default function GlobalStyles({ C, dark, appMode }: { C: Theme; dark: boolean; appMode: AppMode | null }) {
  return (
    <>
      <title>{appMode ? `Budgetly · ${appMode === "household" ? "Household" : "Student"}` : "Budgetly"}</title>
      <link rel="icon" type="image/svg+xml" href={`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%237c6ee0'/><text x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='sans-serif' font-weight='700' font-size='18' fill='white'>B</text></svg>`}/>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <link rel="manifest" href="/manifest.json"/>
      <meta name="theme-color" content="#6c5ce7"/>
      <meta name="apple-mobile-web-app-capable" content="yes"/>
      <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
      <meta name="apple-mobile-web-app-title" content="Budgetly"/>
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png"/>
      <script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js');});}`}}/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{overflow-x:hidden;max-width:100vw;}
        body{background:${C.bg};font-family:'DM Sans',sans-serif;color-scheme:${dark?"dark":"light"};}
        *,*::before,*::after{transition:background-color 0.5s ease,border-color 0.5s ease,color 0.5s ease,box-shadow 0.5s ease!important;}
        input,select,textarea,button{transition:background-color 0.5s ease,border-color 0.5s ease,color 0.5s ease,opacity 0.15s ease,box-shadow 0.5s ease!important;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:${C.faint};border-radius:6px;}
        ::-webkit-scrollbar-thumb:hover{background:${C.muted};}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input:focus,select:focus{border-color:${C.accent}!important;box-shadow:0 0 0 3px ${C.accent}22;}
        input,select,option{color-scheme:${dark?"dark":"light"};}
        .mob-header{display:none;}
        @keyframes slideInFromRight{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInFromLeft{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)}}
        .mob-nav{display:none;}
        @keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(32px);opacity:0}to{transform:translateY(0);opacity:1}}
        .drawer-panel{animation:slideInRight 0.25s cubic-bezier(0.32,0.72,0,1)}
        .drawer-overlay{animation:fadeIn 0.2s ease}
        .settings-modal{animation:slideUp 0.25s cubic-bezier(0.32,0.72,0,1);overflow-y:auto;-webkit-overflow-scrolling:touch;max-height:90vh;}
        @media(max-width:768px){
          .mob-header{display:flex!important;position:fixed;top:0;left:0;right:0;z-index:100;background:${C.sidebar};border-bottom:1px solid ${C.border};padding:14px 18px;align-items:center;justify-content:space-between;}
          .desk-sidebar{display:none!important;}
          .mob-nav{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:${C.sidebar};border-top:1px solid ${C.border};z-index:50;padding:5px 0 max(8px,env(safe-area-inset-bottom));}
          .main-wrap{padding:64px 14px 80px!important;overflow-x:hidden;max-width:100vw;}
          .page-title-row{margin-bottom:10px!important;}
          .two-col-grid{grid-template-columns:1fr!important;}
          .col-hide-mobile{display:none!important;}
          .col-actions-mobile{display:none!important;}
          .col-date-mobile{display:none!important;}
          .col-mode-mobile{display:none!important;}
          .settings-modal{max-height:90dvh;overflow-y:scroll;-webkit-overflow-scrolling:touch;}
          .cat-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))!important;}
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        }
        @media(max-width:640px){
          table{table-layout:auto;width:100%;max-width:100%;}
          th,td{padding:8px 6px!important;font-size:11px!important;}
          .form-grid{grid-template-columns:1fr!important;}
          .table-scroll{overflow-x:auto;max-width:100%;}
        }
      `}</style>
    </>
  );
}
