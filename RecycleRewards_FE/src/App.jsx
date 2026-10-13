import { useEffect, useMemo, useRef, useState } from 'react';
import { authService } from './services/auth.service.js';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Profile from './pages/Profile.jsx';
import { useToast } from './components/ToastProvider.jsx';

const wasteTypes = ['Chai nhựa PET', 'Lon nhôm', 'Giấy tái chế', 'Chai thủy tinh', 'Hộp giấy'];
const date = (value) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const statusText = (status) => status === 'approved' ? 'Đã duyệt' : status === 'rejected' ? 'Từ chối' : 'Chờ duyệt';
const initials = (name) => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
function Status({ status }) { return <span className={'pill ' + status}>{status === 'approved' ? '✓' : status === 'rejected' ? '×' : '◷'} {statusText(status)}</span>; }
function Logo() { return <div className="logo"><b>♻</b><span><strong>Mầm Xanh</strong><small>TRƯỜNG HỌC XANH</small></span></div>; }
function Button({ children, variant = 'primary', className = '', ...props }) { return <button className={'btn ' + variant + ' ' + className} {...props}>{children}</button>; }

function Login({ login, notify }) {
  const [role, setRole] = useState('student');
  const [studentId, setStudentId] = useState('HS-2024-018');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault(); setLoading(true);
    try { await login({ role, studentId, password }); } catch (error) { notify(error.message, 'error'); } finally { setLoading(false); }
  }
  return <main className="login-page"><section className="login-panel"><div className="login-card">
    <Logo /><div className="intro"><em>CÙNG TRƯỜNG MÌNH SỐNG XANH</em><h1>Chào mừng bạn trở lại</h1><p>Đăng nhập để tiếp tục hành trình tái chế.</p></div>
    <div className="role-switch"><Button variant={role === 'student' ? 'light active' : 'light'} onClick={() => setRole('student')}>Học sinh</Button><Button variant={role === 'admin' ? 'light active' : 'light'} onClick={() => setRole('admin')}>Quản trị viên</Button></div>
    <Button variant="outline" className="wide" onClick={() => notify('Đăng nhập Google chỉ là giao diện minh họa.', 'info')}>G &nbsp; Tiếp tục với Google</Button><div className="divider">HOẶC ĐĂNG NHẬP BẰNG TÀI KHOẢN</div>
    <form onSubmit={submit}><label>{role === 'student' ? 'Mã học sinh' : 'Mã quản trị viên'}</label><input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Ví dụ: HS-2024-018" /><label>Mật khẩu</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Nhập mật khẩu" /><Button className="wide" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập  →'}</Button></form>
    <p className="hint">Bản mock: mật khẩu không được kiểm tra hoặc lưu trữ.</p>
  </div></section><aside className="login-art"><div><em>MỖI HÀNH ĐỘNG NHỎ, MỘT TƯƠNG LAI XANH</em><h2>Biến điều tốt<br />thành <i>thói quen.</i></h2><p>Mỗi món đồ được tái chế đúng cách đều góp thêm một điểm xanh cho lớp học và hành tinh của chúng ta.</p><b className="giant-leaf">♧</b></div><footer>Một chương trình nhỏ từ THCS Nguyễn Du <span>01 / 04</span></footer></aside></main>;
}
function Nav({ session, route, go, logout }) {
  const links = session.role === 'admin' ? [['/admin/dashboard', '▦', 'Thống kê'], ['/admin', '☑', 'Duyệt bài'], ['/profile', '♙', 'Hồ sơ']] : [['/student/dashboard', '⌂', 'Tổng quan'], ['/student/scanner', '⌁', 'Quét rác tái chế'], ['/student/history', '◷', 'Lịch sử của tôi'], ['/profile', '♙', 'Hồ sơ']];
  return <><aside className="sidebar"><Logo /><p className="menu-title">MENU CHÍNH</p><nav>{links.map(([path, icon, label]) => <button key={path} className={route === path ? 'nav-active' : ''} onClick={() => go(path)}><b>{icon}</b>{label}</button>)}</nav><div className="green-tip"><b>♧ Góc xanh mỗi ngày</b><small>Tái chế đúng, vui hơn!</small></div><div className="profile"><b>{initials(session.name)}</b><span><strong>{session.name}</strong><small>{session.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}</small></span><button aria-label="Đăng xuất" onClick={logout}>⇥</button></div></aside><nav className="mobile-nav" aria-label="Điều hướng chính">{links.map(([path, icon, label]) => <button key={path} aria-label={label} className={route === path ? 'nav-active' : ''} onClick={() => go(path)}><b>{icon}</b><small>{label}</small></button>)}</nav></>;
}
function Header({ eyebrow, title, subtitle, children }) { return <header className="page-header"><div><em>{eyebrow}</em><h1>{title}</h1><p>{subtitle}</p></div>{children}</header>; }
function Metric({ icon, value, label }) { return <article className="metric"><b>{icon}</b><strong>{value}</strong><span>{label}</span></article>; }
function Empty({ title, text }) { return <div className="empty"><b>♻</b><strong>{title}</strong><span>{text}</span></div>; }
function ErrorState({ error }) { return <div className="error-state">⚠ {error}</div>; }
function Row({ item }) { return <article className="activity"><b className="waste-icon">♻</b><span><strong>{item.wasteType}</strong> <Status status={item.status} /><small>{date(item.submittedAt)}{item.feedback ? ' · ' + item.feedback : ''}</small></span><b className={item.status === 'approved' ? 'points' : 'muted'}>{item.status === 'approved' ? '+' + item.points : '—'} <small>điểm</small></b></article>; }

function Dashboard({ session, go }) {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { authService.studentDashboard(session.studentId).then(setData).catch((e) => setError(e.message)); }, [session.studentId]);
  const dashboard = data || { totalPoints: '—', totalSubmissions: '—', approvedCount: '—', pendingCount: '—', recent: [] };
  const total = Number(dashboard.totalSubmissions) || 0;
  const approved = Math.min(total, Number(dashboard.approvedCount) || 0);
  const pending = Math.min(total - approved, Number(dashboard.pendingCount) || 0);
  const rejected = Math.max(0, total - approved - pending);
  const approvalRate = total ? Math.round((approved / total) * 100) : 0;
  const firstName = session.name.trim().split(/\s+/).at(-1);
  return <><Header eyebrow="HÀNH TRÌNH XANH CỦA BẠN" title={'Xin chào, ' + firstName + '!'} subtitle="Mỗi món đồ tái chế là một bước nhỏ cho môi trường." /><section className="score-banner"><div><em>ĐIỂM XANH CỦA BẠN</em><strong>{dashboard.totalPoints} <small>điểm</small></strong><p>Cứ tiếp tục nhé, bạn đang làm rất tốt!</p></div><Button variant="white" onClick={() => go('/student/scanner')}>⌁ Quét vật phẩm →</Button></section><section className="metric-grid"><Metric icon="♻" value={dashboard.totalSubmissions} label="Vật phẩm đã gửi" /><Metric icon="✓" value={dashboard.approvedCount} label="Được xác nhận" /><Metric icon="◷" value={dashboard.pendingCount} label="Đang chờ duyệt" /></section>{data && <section className="surface dashboard-stats"><div className="section-heading"><div><h2>Thống kê tái chế</h2><p>Tổng quan trạng thái các vật phẩm bạn đã gửi</p></div><span className="approval-rate">{approvalRate}% <small>được duyệt</small></span></div><div className="status-bar" role="img" aria-label={'Đã duyệt ' + approved + ', chờ duyệt ' + pending + ', từ chối ' + rejected}>{total > 0 && <><span className="approved-segment" style={{ width: (approved / total * 100) + '%' }} /><span className="pending-segment" style={{ width: (pending / total * 100) + '%' }} /><span className="rejected-segment" style={{ width: (rejected / total * 100) + '%' }} /></>}</div><div className="status-legend"><span><i className="approved-dot" />Đã duyệt <b>{approved}</b></span><span><i className="pending-dot" />Chờ duyệt <b>{pending}</b></span><span><i className="rejected-dot" />Từ chối <b>{rejected}</b></span></div></section>}<section className="surface"><div className="section-heading"><div><h2>Hoạt động gần đây</h2><p>Theo dõi hành trình xanh của bạn</p></div><button className="text-button" onClick={() => go('/student/history')}>Xem tất cả →</button></div>{error ? <ErrorState error={error} /> : dashboard.recent.length ? dashboard.recent.map((item) => <Row key={item.id} item={item} />) : <Empty title="Chưa có hoạt động nào" text="Hãy gửi vật phẩm tái chế đầu tiên." />}</section></>;
}
function Scanner({ session, go, notify }) {
  const [frames, setFrames] = useState([]); const [fileName, setFileName] = useState(''); const [type, setType] = useState(''); const [sending, setSending] = useState(false); const [recording, setRecording] = useState(false); const [cameraOn, setCameraOn] = useState(false); const [processing, setProcessing] = useState(false);
  const videoInput = useRef(null); const videoRef = useRef(null); const streamRef = useRef(null); const recorderRef = useRef(null); const recordTimerRef = useRef(null);
  function stopCamera() {
    clearTimeout(recordTimerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null; setCameraOn(false); setRecording(false);
  }
  useEffect(() => () => {
    clearTimeout(recordTimerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
  }, []);
  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) return notify('Trình duyệt không hỗ trợ camera. Hãy chọn video có sẵn.', 'error');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream; videoRef.current.srcObject = stream; await videoRef.current.play(); setCameraOn(true);
    } catch { notify('Không thể mở camera. Hãy cấp quyền truy cập hoặc chọn video có sẵn.', 'error'); }
  }
  function startRecording() {
    if (!streamRef.current || !window.MediaRecorder) return notify('Trình duyệt không hỗ trợ quay video trực tiếp.', 'error');
    const mimeType = ['video/webm;codecs=vp9', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type));
    const chunks = []; const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => {
      const file = new File(chunks, 'camera-video.webm', { type: recorder.mimeType || 'video/webm' });
      stopCamera(); processVideo(file);
    };
    recorder.start(); setRecording(true); recordTimerRef.current = setTimeout(() => recorder.state === 'recording' && recorder.stop(), 4000);
  }
  async function processVideo(file) {
    if (!file || !file.type.startsWith('video/')) return notify('Vui lòng chọn tệp video.', 'error');
    if (file.size > 25 * 1024 * 1024) return notify('Video cần nhỏ hơn 25 MB.', 'error');
    setProcessing(true); setFrames([]); setFileName(file.name);
    const videoUrl = URL.createObjectURL(file); const video = document.createElement('video'); video.muted = true; video.preload = 'metadata'; video.src = videoUrl;
    try {
      await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = () => reject(new Error('Không thể đọc video này.')); });
      if (!Number.isFinite(video.duration) || video.duration < 1 || video.duration > 30) throw new Error('Video cần dài từ 1 đến 30 giây.');
      const times = [0.2, 0.5, 0.8].map((position) => Math.max(0.05, Math.min(video.duration - 0.05, video.duration * position)));
      const captured = [];
      for (const time of times) {
        await new Promise((resolve) => { video.onseeked = resolve; video.currentTime = time; });
        const scale = Math.min(1, 640 / video.videoWidth); const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        captured.push(canvas.toDataURL('image/jpeg', 0.68));
      }
      setFrames(captured);
      const name = file.name.toLowerCase();
      setType(name.includes('giay') || name.includes('paper') ? 'Giấy tái chế' : name.includes('lon') || name.includes('can') ? 'Lon nhôm' : name.includes('thuy') || name.includes('glass') ? 'Chai thủy tinh' : '');
    } catch (error) { setFrames([]); notify(error.message || 'Không thể tách khung hình từ video.', 'error'); }
    finally { URL.revokeObjectURL(videoUrl); setProcessing(false); }
  }
  async function send() {
    setSending(true);
    try {
      const submission = await authService.createSubmission({ studentName: session.name, studentId: session.studentId, wasteType: type, imageDataUrl: frames[0], videoFrames: frames });
      notify(`Đã gửi vật phẩm! Độ tin cậy demo ${submission.confidence}%. Điểm sẽ được cộng sau khi duyệt.`, 'success'); go('/student/history');
    } catch (error) { notify(error.message, 'error'); }
    finally { setSending(false); }
  }
  return <><Header eyebrow="NHẬN DIỆN TÁI CHẾ" title="Quay video rác" subtitle="Quay 4 giây hoặc tải video lên để trích xuất khung hình." /><section className="scanner-grid"><div className="surface upload-surface"><video ref={videoRef} className={cameraOn ? 'camera-preview' : 'camera-preview hidden'} autoPlay muted playsInline /><div className="capture-actions"><Button variant="outline" onClick={cameraOn ? stopCamera : startCamera}>{cameraOn ? 'Tắt camera' : 'Mở camera'}</Button><Button disabled={!cameraOn || recording || processing} onClick={startRecording}>{recording ? 'Đang quay 4 giây...' : '● Quay video 4 giây'}</Button><Button variant="outline" disabled={processing} onClick={() => videoInput.current.click()}>Chọn video</Button><input ref={videoInput} className="visually-hidden" type="file" accept="video/*" onChange={(event) => { processVideo(event.target.files?.[0]); event.target.value = ''; }} /></div>{processing ? <div className="frame-status">Đang tách khung hình trên thiết bị...</div> : frames.length ? <><div className="frame-strip">{frames.map((frame, index) => <figure key={index}><img src={frame} alt={`Khung hình ${index + 1}`} /><figcaption>Frame {index + 1}</figcaption></figure>)}</div><div className="uploaded-file"><span>{fileName} · {frames.length} khung hình</span><button aria-label="Xóa video đã chọn" onClick={() => { setFrames([]); setFileName(''); setType(''); }}>×</button></div></> : <div className="drop-zone"><b>▣</b><strong>Khung hình video sẽ xuất hiện ở đây</strong><span>3 frame JPEG được tạo bằng Canvas, không tải video gốc lên máy chủ.</span></div>}</div><aside className="surface scan-result"><em>KIỂM TRA DEMO</em><h2>Vật phẩm của bạn</h2><p>AI hiện là mô phỏng; backend chỉ đưa bài hợp lệ vào hàng chờ từ 80%.</p><label>Loại vật phẩm</label><select value={type} onChange={(event) => setType(event.target.value)}><option value="">Chọn loại vật phẩm</option>{wasteTypes.map((item) => <option key={item}>{item}</option>)}</select><div className="result-stats"><span>Số khung hình<b>{frames.length || '—'}</b></span><span>Ngưỡng demo<b>80%</b></span></div><Button className="wide" disabled={frames.length !== 3 || !type || sending || processing} onClick={send}>{sending ? 'Đang gửi...' : 'Gửi AI kiểm tra →'}</Button><small className="secure">♙ Điểm xanh chỉ được cộng sau khi giáo viên xác nhận vật phẩm.</small></aside></section></>;
}
function History({ session }) {
  const [items, setItems] = useState([]); const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all'); const [error, setError] = useState('');
  useEffect(() => { authService.mySubmissions(session.studentId).then(setItems).catch((e) => setError(e.message)); }, [session.studentId]);
  const result = useMemo(() => items.filter((item) => (filter === 'all' || item.status === filter) && (item.wasteType + ' ' + (item.feedback || '')).toLowerCase().includes(query.toLowerCase())), [items, filter, query]);
  return <><Header eyebrow="HỒ SƠ XANH CỦA BẠN" title="Lịch sử tái chế" subtitle="Mọi vật phẩm bạn đã gửi, được duyệt hoặc cần gửi lại." /><section className="surface"><div className="filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="⌕ Tìm theo loại vật phẩm..." /><div>{[['all', 'Tất cả'], ['approved', 'Đã duyệt'], ['pending', 'Chờ duyệt'], ['rejected', 'Từ chối']].map(([key, label]) => <Button key={key} variant={filter === key ? 'filter active' : 'filter'} onClick={() => setFilter(key)}>{label}</Button>)}</div></div><p className="count">Hiển thị {result.length} vật phẩm</p>{error ? <ErrorState error={error} /> : result.length ? result.map((item) => <Row key={item.id} item={item} />) : <Empty title="Không tìm thấy vật phẩm" text="Thử thay đổi từ khóa hoặc bộ lọc nhé." />}</section></>;
}
function Admin({ notify }) {
  const [items, setItems] = useState([]); const [filter, setFilter] = useState('pending'); const [reject, setReject] = useState(null); const [feedback, setFeedback] = useState(''); const [error, setError] = useState('');
  const load = () => authService.adminSubmissions().then(setItems).catch((e) => setError(e.message)); useEffect(() => { load(); }, []);
  const pending = items.filter((item) => item.status === 'pending').length; const visible = items.filter((item) => filter === 'all' || item.status === 'pending');
  async function review(id, status) { try { await authService.reviewSubmission(id, { status, feedback }); setReject(null); setFeedback(''); notify(status === 'approved' ? 'Đã duyệt và cộng 5 điểm.' : 'Đã lưu lý do từ chối.', 'success'); load(); } catch (e) { notify(e.message, 'error'); } }
  return <><Header eyebrow="KHU VỰC QUẢN TRỊ" title="Hàng chờ kiểm tra" subtitle="Kiểm tra vật phẩm và ghi nhận điểm xanh cho học sinh."><span className="pending-number">◷ {pending} bài chờ duyệt</span></Header><section className="metric-grid"><Metric icon="◷" value={pending} label="Đang chờ duyệt" /><Metric icon="✓" value={items.filter((item) => item.status === 'approved').length} label="Đã xác nhận" /><Metric icon="♙" value={items.length} label="Tổng lượt gửi" /></section><section className="surface"><div className="section-heading"><div><h2>Vật phẩm cần kiểm tra</h2><p>Xem ảnh và xác nhận loại vật liệu trước khi cộng điểm.</p></div><div><Button variant={filter === 'pending' ? 'filter active' : 'filter'} onClick={() => setFilter('pending')}>Chờ duyệt ({pending})</Button><Button variant={filter === 'all' ? 'filter active' : 'filter'} onClick={() => setFilter('all')}>Tất cả</Button></div></div>{error ? <ErrorState error={error} /> : visible.length ? <div className="approval-list">{visible.map((item) => <article className="approval-card" key={item.id}><div className="submission-image">{item.imageDataUrl ? <img src={item.imageDataUrl} alt={item.wasteType} /> : <><b>♻</b><small>Ảnh demo</small></>}<em>DEMO AI</em></div><div><strong>{item.wasteType}</strong> <Status status={item.status} /><p>{item.studentName} · {item.studentId}</p><small>{date(item.submittedAt)} · AI demo {item.confidence}% · +{item.points} điểm</small>{item.feedback && <p className="rejection">Lý do: {item.feedback}</p>}</div>{item.status === 'pending' ? <div className="approval-actions"><Button onClick={() => review(item.id, 'approved')}>✓ Duyệt +5</Button><Button variant="danger" onClick={() => { setReject(item); setFeedback(''); }}>× Từ chối</Button></div> : <b className={item.status === 'approved' ? 'points' : 'rejected'}>{item.status === 'approved' ? '+' + item.points + ' điểm' : 'Đã từ chối'}</b>}</article>)}</div> : <Empty title="Tuyệt vời, đã xử lý hết!" text="Các vật phẩm mới gửi sẽ xuất hiện ở đây." />}</section>{reject && <div className="modal-backdrop"><div className="modal"><button className="close" onClick={() => setReject(null)}>×</button><em>PHẢN HỒI CHO HỌC SINH</em><h2>Từ chối vật phẩm?</h2><p>{reject.studentName} · {reject.wasteType}</p><label>Lý do từ chối *</label><textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Ví dụ: Vui lòng làm sạch vật phẩm và chụp ảnh rõ hơn..." /><div className="modal-actions"><Button variant="outline" onClick={() => setReject(null)}>Hủy</Button><Button variant="danger" disabled={!feedback.trim()} onClick={() => review(reject.id, 'rejected')}>Xác nhận từ chối</Button></div></div></div>}</>;
}
export default function App() {
  const { notify } = useToast();
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem('rr-session')) || null; } catch { return null; } }); const [route, setRoute] = useState(() => location.hash.slice(1) || '/');
  useEffect(() => { const sync = () => setRoute(location.hash.slice(1) || '/'); addEventListener('hashchange', sync); return () => removeEventListener('hashchange', sync); }, []);
  useEffect(() => { if (session) localStorage.setItem('rr-session', JSON.stringify(session)); else localStorage.removeItem('rr-session'); }, [session]);
  function go(path) { location.hash = path; }
  async function login(payload) { const response = await authService.login(payload); setSession(response.user); go(response.user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'); } function logout() { setSession(null); go('/login'); }
  if (!session) return <Login login={login} notify={notify} />;
  const isProfileRoute = route === '/profile' || route === '/student/settings';
  const isAdminQueueRoute = route === '/admin' || route === '/admin/submissions';
  let page;
  if (isProfileRoute) page = <Profile session={session} setSession={setSession} />;
  else if (session.role === 'admin') page = isAdminQueueRoute ? <Admin notify={notify} /> : <AdminDashboard />;
  else page = route === '/student/scanner' ? <Scanner session={session} go={go} notify={notify} /> : route === '/student/history' ? <History session={session} /> : <Dashboard session={session} go={go} />;
  return <div className="shell"><Nav session={session} route={route} go={go} logout={logout} /><main className="content">{page}</main></div>;
}
