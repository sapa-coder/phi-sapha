import './globals.css';
export const metadata={title:'พี่สภามีมาแจก',description:'รวมสรุปและชีทเรียน',manifest:'/manifest.json'};
export const viewport={themeColor:'#1f2937'};
export default function L({children}){return(<html lang="th"><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600&display=swap"/>
<link rel="apple-touch-icon" href="/icon-192.png"/>
<script dangerouslySetInnerHTML={{__html:"if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))"}}/>
</head><body>{children}</body></html>)}
