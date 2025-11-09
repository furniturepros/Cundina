'use client';
import { useEffect, useState } from 'react';
export default function OrganizerDashboard() {
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  async function load() {
    if (!groupId) return;
    setLoading(true);
    const res = await fetch(`/api/dashboard/organizer?group_id=${groupId}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }
  useEffect(()=>{
    const url = new URL(window.location.href);
    const gid = url.searchParams.get('group_id'); if (gid) setGroupId(gid);
  },[]);
  return (
    <main>
      <h2>Organizer Dashboard</h2>
      <div style={{ display:'flex', gap:8, margin:'12px 0' }}>
        <input placeholder="Enter Group ID" value={groupId} onChange={e=>setGroupId(e.target.value)}
          style={{ padding:10, flex:1, border:'1px solid #ddd', borderRadius:10 }}/>
        <button onClick={load} disabled={!groupId || loading} style={{ padding:'10px 16px' }}>
          {loading ? 'Loading…' : 'Load'}
        </button>
      </div>
      {data ? <pre style={{background:'#f8f8f8', padding:12, borderRadius:8}}>{JSON.stringify(data, null, 2)}</pre> : <p>Enter a Group ID and click Load.</p>}
    </main>
  );
}