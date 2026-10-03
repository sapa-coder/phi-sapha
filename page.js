'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, toEmail } from '@/lib/supabase';
export default function Login(){
  const r=useRouter();const [reg,setReg]=useState(false);const [f,setF]=useState({});const [err,setErr]=useState('');const [busy,setBusy]=useState(false);
  useEffect(()=>{supabase.auth.getSession().then(({data})=>data.session&&r.replace('/home'))},[]);
  const set=k=>e=>setF({...f,[k]:e.target.value});
  async function submit(e){e.preventDefault();setErr('');
    if(reg&&f.password!==f.confirm)return setErr('รหัสผ่านไม่ตรงกัน');
    if(!/^[0-9]+$/.test(f.sid||''))return setErr('เลขประจำตัวต้องเป็นตัวเลข');
    if((f.password||'').length<6)return setErr('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    setBusy(true);
    const email=toEmail(f.sid);
    const {error}=reg?await supabase.auth.signUp({email,password:f.password,options:{data:{full_name:f.name,student_id:f.sid.trim(),classroom:f.room}}})
      :await supabase.auth.signInWithPassword({email,password:f.password});
    setBusy(false);
    if(error)return setErr(error.message.includes('already')?'เลขประจำตัวนี้สมัครแล้ว':error.message.includes('Invalid')?'เลขประจำตัวหรือรหัสผ่านไม่ถูกต้อง':error.message);
    r.replace('/home');}
  return(<div className="wrap" style={{maxWidth:420,paddingTop:60}}><div className="card">
    <h1 style={{textAlign:'center'}}>พี่สภามีมาแจก</h1><p style={{textAlign:'center'}}><small>{reg?'สมัครสมาชิก':'เข้าสู่ระบบ'}</small></p>
    <form onSubmit={submit}>
      {reg&&<><label>ชื่อ - นามสกุล</label><input required onChange={set('name')}/></>}
      <label>เลขประจำตัว</label><input required inputMode="numeric" onChange={set('sid')}/>
      {reg&&<><label>ห้องเรียน (เช่น ม.1/15)</label><input required placeholder="ม.1/15" pattern="ม\.[1-6]/[0-9]+" title="รูปแบบ ม.1/15" onChange={set('room')}/></>}
      <label>รหัสผ่าน</label><input type="password" required onChange={set('password')}/>
      {reg&&<><label>ยืนยันรหัสผ่าน</label><input type="password" required onChange={set('confirm')}/></>}
      {err&&<p className="err">{err}</p>}
      <button disabled={busy} style={{width:'100%'}}>{busy?'กำลังดำเนินการ...':reg?'สมัครสมาชิก':'เข้าสู่ระบบ'}</button>
    </form>
    <p style={{textAlign:'center'}}><small>{reg?'มีบัญชีแล้ว? ':'ยังไม่มีบัญชี? '}</small>
      <a href="#" onClick={e=>{e.preventDefault();setReg(!reg);setErr('')}}>{reg?'เข้าสู่ระบบ':'สมัครสมาชิก'}</a></p>
  </div></div>)}
