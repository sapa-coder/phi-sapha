'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
const LEVELS=['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'];
const CATS=['ภาษาไทย','คณิตศาสตร์','สังคมศึกษา','วิทยาศาสตร์ทั่วไป','ชีววิทยา','ฟิสิกส์','เคมี'];
async function makeThumb(file){
  const pdfjs=await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc=`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
  const page=await pdf.getPage(1);const v=page.getViewport({scale:400/page.getViewport({scale:1}).width});
  const c=document.createElement('canvas');c.width=v.width;c.height=v.height;
  await page.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
  return new Promise(r=>c.toBlob(r,'image/jpeg',0.8));}
export default function Home(){
  const r=useRouter();const [me,setMe]=useState(null);const [tab,setTab]=useState('home');
  const [level,setLevel]=useState('ม.1');const [cat,setCat]=useState(CATS[0]);
  const [items,setItems]=useState([]);const [favs,setFavs]=useState(new Set());const [folio,setFolio]=useState([]);
  const [form,setForm]=useState(false);const [busy,setBusy]=useState(false);const [msg,setMsg]=useState('');
  useEffect(()=>{(async()=>{const {data:{session}}=await supabase.auth.getSession();if(!session)return r.replace('/');
    const {data:p}=await supabase.from('profiles').select('*').eq('id',session.user.id).single();setMe({...p,uid:session.user.id});
    const {data:f}=await supabase.from('favorites').select('summary_id').eq('user_id',session.user.id);setFavs(new Set((f||[]).map(x=>x.summary_id)));})()},[]);
  const load=useCallback(async()=>{
    if(tab==='home'){const {data}=await supabase.from('summaries').select('*').eq('level',level).eq('category',cat).order('created_at',{ascending:false});setItems(data||[]);}
    if(tab==='fav'&&me){const {data}=await supabase.from('favorites').select('summaries(*)').eq('user_id',me.uid);setItems((data||[]).map(x=>x.summaries).filter(Boolean));}
    if(tab==='folio'){const {data}=await supabase.from('portfolios').select('*').order('created_at',{ascending:false});setFolio(data||[]);}
  },[tab,level,cat,me]);
  useEffect(()=>{load()},[load]);
  async function toggleFav(id){const on=favs.has(id);const n=new Set(favs);
    if(on){n.delete(id);await supabase.from('favorites').delete().match({user_id:me.uid,summary_id:id});}
    else{n.add(id);await supabase.from('favorites').insert({user_id:me.uid,summary_id:id});}
    setFavs(n);if(tab==='fav')load();}
  async function upload(e){e.preventDefault();const fd=new FormData(e.target);const file=fd.get('file');
    if(!file||file.type!=='application/pdf')return setMsg('กรุณาเลือกไฟล์ PDF');
    if(file.size>20*1024*1024)return setMsg('ไฟล์ใหญ่เกิน 20MB');
    setBusy(true);setMsg('');
    try{const key=`${me.uid}/${Date.now()}`;
      const thumb=await makeThumb(file);
      const a=await supabase.storage.from('files').upload(`${key}.pdf`,file,{contentType:'application/pdf'});if(a.error)throw a.error;
      const b=await supabase.storage.from('files').upload(`${key}.jpg`,thumb,{contentType:'image/jpeg'});if(b.error)throw b.error;
      const room=fd.get('room');
      const {error}=await supabase.from('summaries').insert({
        file_url:supabase.storage.from('files').getPublicUrl(`${key}.pdf`).data.publicUrl,
        thumb_url:supabase.storage.from('files').getPublicUrl(`${key}.jpg`).data.publicUrl,
        author_name:fd.get('name'),classroom:room,level:'ม.'+(room.match(/ม\.?(\d)/)||[])[1],
        category:fd.get('category'),description:fd.get('description'),user_id:me.uid});
      if(error)throw error;setForm(false);setTab('home');load();
    }catch(x){setMsg('ผิดพลาด: '+x.message)}setBusy(false);}
  async function del(id){if(confirm('ลบสรุปนี้?')){await supabase.from('summaries').delete().eq('id',id);load();}}
  const logout=async()=>{await supabase.auth.signOut();r.replace('/')};
  const Cards=()=>items.length?<div className="grid">{items.map(s=>(<div className="card" key={s.id} style={{padding:10}}>
    <a href={s.file_url} target="_blank"><img src={s.thumb_url} alt=""/></a>
    <p style={{margin:'8px 0 2px'}}><b>{s.category}</b> · {s.level}</p><small>{s.author_name} ({s.classroom})</small>
    <p style={{fontSize:14}}>{s.description}</p>
    <div className="row"><button className="ghost" onClick={()=>toggleFav(s.id)}>{favs.has(s.id)?'★ โปรด':'☆ โปรด'}</button>
    <a href={s.file_url} target="_blank"><button>เปิด PDF</button></a>
    {(me?.is_admin||s.user_id===me?.uid)&&<button className="ghost" onClick={()=>del(s.id)}>ลบ</button>}</div></div>))}</div>:<p><small>ยังไม่มีสรุปในหมวดนี้</small></p>;
  if(!me)return <div className="wrap">กำลังโหลด...</div>;
  return(<div className="wrap">
    <div className="top"><div><h1>พี่สภามีมาแจก</h1><small>สวัสดี {me.full_name} ({me.classroom})</small></div><button className="ghost" onClick={logout}>ออกจากระบบ</button></div>
    <div className="row" style={{marginBottom:12}}>
      {[['home','สรุปทั้งหมด'],['fav','รายการโปรด'],['folio','Portfolio พี่ puffet']].map(([k,l])=><button key={k} className={tab===k?'on':'ghost'} onClick={()=>setTab(k)}>{l}</button>)}
      <button style={{marginLeft:'auto'}} onClick={()=>setForm(!form)}>＋ เพิ่มสรุป</button></div>
    {form&&<form className="card" onSubmit={upload} style={{marginBottom:12}}><h3>เพิ่มชีท/สรุป</h3>
      <label>ไฟล์ PDF</label><input name="file" type="file" accept="application/pdf" required/>
      <label>ชื่อ - นามสกุล</label><input name="name" defaultValue={me.full_name} required/>
      <label>ห้อง</label><input name="room" defaultValue={me.classroom} required pattern="ม\.[1-6]/[0-9]+"/>
      <label>หมวดหมู่</label><select name="category">{CATS.map(c=><option key={c}>{c}</option>)}</select>
      <label>รายละเอียดเนื้อหา</label><textarea name="description" rows={3} required/>
      {msg&&<p className="err">{msg}</p>}<button disabled={busy}>{busy?'กำลังอัปโหลด...':'บันทึก'}</button></form>}
    {tab==='home'&&<><div className="row">{LEVELS.map(l=><button key={l} className={l===level?'on':'ghost'} onClick={()=>setLevel(l)}>{l}</button>)}</div>
      <div className="row" style={{marginTop:8}}>{CATS.map(c=><button key={c} className={c===cat?'on':'ghost'} onClick={()=>setCat(c)}>{c}</button>)}</div><Cards/></>}
    {tab==='fav'&&<Cards/>}
    {tab==='folio'&&(folio.length?<div className="grid">{folio.map(p=><div className="card" key={p.id} style={{padding:10}}>
      {p.image_url&&<img src={p.image_url} alt=""/>}<h3 style={{margin:'8px 0'}}>{p.title}</h3><p style={{fontSize:14}}>{p.description}</p>
      {p.link&&<a href={p.link} target="_blank">ดูเพิ่มเติม →</a>}</div>)}</div>:<p><small>ยังไม่มี Portfolio</small></p>)}
  </div>)}
