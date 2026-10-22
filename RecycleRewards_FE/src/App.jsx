import { useEffect, useMemo, useRef, useState } from 'react';
import { authService } from './services/auth.service.js';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminSubmissions from './pages/AdminSubmissions.jsx';
import Profile from './pages/Profile.jsx';
import { useToast } from './components/ToastProvider.jsx';
import GoogleLoginButton from './components/common/GoogleLoginButton.jsx';
import { detectWasteFrame } from './services/ai.service.js';

const wasteTypes = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash'];
const wasteLabels = { cardboard: 'Bìa carton', glass: 'Thủy tinh', metal: 'Kim loại', paper: 'Giấy', plastic: 'Nhựa', trash: 'Rác khác' };
const wasteLabel = (label) => wasteLabels[label] || label;
const date = (value) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const statusText = (status) => status === 'approved' ? 'Đã duyệt' : status === 'rejected' ? 'Từ chối' : 'Chờ duyệt';
const confidencePercent = (value) => Math.round((Number(value) <= 1 ? Number(value) * 100 : Number(value)) || 0);
const videoTimestamp = (value) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(value);
const initials = (name) => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
function Status({ status }) { return <span className={'pill ' + status}>{status === 'approved' ? '✓' : status === 'rejected' ? '×' : '◷'} {statusText(status)}</span>; }
function Logo() { return <div className="logo"><b>♻</b><span><strong>Mầm Xanh</strong><small>TRƯỜNG HỌC XANH</small></span></div>; }
function Button({ children, variant = 'primary', className = '', ...props }) { return <button className={'btn ' + variant + ' ' + className} {...props}>{children}</button>; }

function Login({ login, emailLogin, register, notify }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await (mode === 'login' ? emailLogin(email, password) : register(name, email, password));
    } catch (error) {
      notify(authService.authErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }
  return <main className="login-page"><section className="login-panel"><div className="login-card">
    <Logo /><div className="intro"><em>CÙNG TRƯỜNG MÌNH SỐNG XANH</em><h1>Chào mừng bạn trở lại</h1><p>Đăng nhập để tiếp tục hành trình tái chế.</p></div>
    <GoogleLoginButton className="wide" signIn={login} onError={(error) => notify(error.message, 'error')} />
    <div className="divider">HOẶC DÙNG EMAIL</div>
    <div className="role-switch"><Button variant={mode === 'login' ? 'light active' : 'light'} onClick={() => setMode('login')}>Đăng nhập</Button><Button variant={mode === 'register' ? 'light active' : 'light'} onClick={() => setMode('register')}>Đăng ký</Button></div>
    <form onSubmit={submit}>{mode === 'register' && <><label htmlFor="register-name">Họ và tên</label><input id="register-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></>}<label htmlFor="auth-email">Email</label><input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /><label htmlFor="auth-password">Mật khẩu</label><input id="auth-password" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /><Button className="wide" disabled={loading}>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập →' : 'Tạo tài khoản →'}</Button></form>
    {mode === 'login' && <button className="text-button auth-reset" type="button" onClick={async () => { if (!email) return notify('Nhập email để nhận liên kết đặt lại mật khẩu.', 'warning'); try { await authService.resetPassword(email); notify('Đã gửi liên kết đặt lại mật khẩu.', 'success'); } catch (error) { notify(error.message, 'error'); } }}>Quên mật khẩu?</button>}
    <p className="hint">Tài khoản email được xác thực bởi Firebase và lưu profile trong hệ thống.</p>
  </div></section><aside className="login-art"><div><em>MỖI HÀNH ĐỘNG NHỎ, MỘT TƯƠNG LAI XANH</em><h2>Biến điều tốt<br />thành <i>thói quen.</i></h2><p>Mỗi món đồ được tái chế đúng cách đều góp thêm một điểm xanh cho lớp học và hành tinh của chúng ta.</p><b className="giant-leaf">♧</b></div><footer>Một chương trình nhỏ từ THCS Nguyễn Du <span>01 / 04</span></footer></aside></main>;
}
function Nav({ session, route, go, logout }) {
  const links = session.role === 'admin' ? [['/admin/dashboard', '▦', 'Thống kê'], ['/admin', '☑', 'Duyệt bài'], ['/profile', '♙', 'Hồ sơ']] : [['/student/dashboard', '⌂', 'Tổng quan'], ['/student/scanner', '⌁', 'Quét rác tái chế'], ['/student/history', '◷', 'Lịch sử của tôi'], ['/profile', '♙', 'Hồ sơ']];
  return <><aside className="sidebar"><Logo /><p className="menu-title">MENU CHÍNH</p><nav>{links.map(([path, icon, label]) => <button key={path} className={route === path ? 'nav-active' : ''} onClick={() => go(path)}><b>{icon}</b>{label}</button>)}</nav><div className="green-tip"><b>♧ Góc xanh mỗi ngày</b><small>Tái chế đúng, vui hơn!</small></div><div className="profile"><b>{initials(session.name)}</b><span><strong>{session.name}</strong><small>{session.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}</small></span><button className="logout-button" type="button" onClick={logout}><b>⇥</b><span>Đăng xuất</span></button></div></aside><nav className="mobile-nav" aria-label="Điều hướng chính">{links.map(([path, icon, label]) => <button key={path} aria-label={label} className={route === path ? 'nav-active' : ''} onClick={() => go(path)}><b>{icon}</b><small>{label}</small></button>)}<button className="logout-button" type="button" aria-label="Đăng xuất" onClick={logout}><b>⇥</b><small>Đăng xuất</small></button></nav></>;
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
function Scanner({ go, notify }) {
  const [stream, setStream] = useState(null);
  const [detections, setDetections] = useState([]);
  const [type, setType] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [frames, setFrames] = useState([]);
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('Camera chưa được bật.');
  const [cameraError, setCameraError] = useState('');
  const [sending, setSending] = useState(false);
  const [previewRatio, setPreviewRatio] = useState('16 / 9');
  const video = useRef(null);
  const overlay = useRef(null);
  const capture = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const requestRef = useRef(null);
  const inFlight = useRef(false);
  const detectionsRef = useRef([]);

  const stopCamera = () => {
    clearInterval(intervalRef.current);
    clearInterval(frameIntervalRef.current);
    requestRef.current?.abort();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    inFlight.current = false;
    setStream(null);
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    const canvas = overlay.current;
    const source = capture.current;
    if (!canvas || !source || !source.width || !source.height) return;
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = Math.max(3, canvas.width / 220);
    context.font = `bold ${Math.max(16, canvas.width / 30)}px sans-serif`;
    detections.forEach((item) => {
      const [x1, y1, x2, y2] = item.box;
      const name = `${wasteLabel(item.label)} ${(item.confidence * 100).toFixed(0)}%`;
      const textWidth = context.measureText(name).width;
      const textHeight = Math.max(24, canvas.width / 23);
      const labelY = Math.max(textHeight, y1);
      context.strokeStyle = '#32d583';
      context.fillStyle = '#32d583';
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);
      context.fillRect(x1, labelY - textHeight, textWidth + 14, textHeight);
      context.fillStyle = '#092c20';
      context.fillText(name, x1 + 7, labelY - 7);
    });
  }, [detections]);

  const detectFrame = async () => {
    if (inFlight.current || !video.current?.videoWidth || !capture.current) return;
    const source = video.current;
    const target = capture.current;
    const scale = Math.min(1, 640 / source.videoWidth);
    target.width = Math.round(source.videoWidth * scale);
    target.height = Math.round(source.videoHeight * scale);
    target.getContext('2d', { alpha: false }).drawImage(source, 0, 0, target.width, target.height);
    inFlight.current = true;
    requestRef.current = new AbortController();
    try {
      const blob = await new Promise((resolve) => target.toBlob(resolve, 'image/jpeg', 0.8));
      if (!blob) throw new Error('Không thể tạo ảnh từ camera.');
      const result = await detectWasteFrame(blob, requestRef.current.signal);
      const best = result.detections?.[0];
      const nextDetections = result.detections || [];
      detectionsRef.current = nextDetections;
      setDetections(nextDetections);
      setStatus(best ? `YOLOv8 · ${result.latency_ms} ms` : `Không tìm thấy vật thể · ${result.latency_ms} ms`);
      if (best) {
        setConfidence(best.confidence);
        setType((current) => current || best.label);
      } else {
        setConfidence(0);
      }
      setCameraError('');
    } catch (error) {
      if (error.name !== 'AbortError') {
        setCameraError(error.message || 'Không thể nhận diện frame.');
        setStatus('Đang chờ kết nối lại dịch vụ AI...');
      }
    } finally {
      inFlight.current = false;
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Trình duyệt không hỗ trợ webcam. Hãy dùng Chrome hoặc Edge qua HTTPS.');
      return;
    }
    try {
      setCameraError('');
      setStatus('Đang mở camera...');
      const camera = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = camera;
      setStream(camera);
      if (!video.current) return;
      video.current.srcObject = camera;
      await video.current.play();
      const ratio = video.current.videoWidth / video.current.videoHeight;
      setPreviewRatio(`${ratio} / 1`);
      intervalRef.current = window.setInterval(detectFrame, 100);
      frameIntervalRef.current = window.setInterval(() => {
        if (!capture.current?.width || !detectionsRef.current.length) return;
        const dataUrl = capture.current.toDataURL('image/jpeg', 0.8);
        setImage(dataUrl);
        setFrames((current) => current.length < 30 ? [...current, dataUrl] : current);
      }, 1000);
      setStatus('Đang nhận diện thời gian thực...');
    } catch (error) {
      const message = error.name === 'NotAllowedError'
        ? 'Bạn đã từ chối quyền camera. Hãy cấp quyền rồi thử lại.'
        : 'Không thể mở camera. Kiểm tra thiết bị hoặc ứng dụng đang dùng camera.';
      setCameraError(message);
      setStatus('Camera không khả dụng.');
    }
  };

  const resetScan = () => {
    setDetections([]);
    setFrames([]);
    setImage('');
    setType('');
    setConfidence(0);
    setStatus('Sẵn sàng quét lại.');
  };

  async function send() {
    if (frames.length < 3 || !type) return;
    setSending(true);
    try {
      const ai = await authService.checkAi(confidence, frames);
      if (!ai.accepted) throw new Error(ai.message);
      const uploaded = await authService.uploadFrames(frames);
      await authService.createSubmission({
        wasteType: type,
        confidence,
        imageDataUrl: image,
        imageUrl: uploaded.frameUrls[0],
        frameUrls: uploaded.frameUrls,
      });
      notify('Đã gửi vật phẩm! Điểm sẽ được cộng sau khi duyệt.', 'success');
      stopCamera();
      go('/student/history');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSending(false);
    }
  }

  return <><Header eyebrow="NHẬN DIỆN YOLOV8" title="Quét vật phẩm tái chế" subtitle="Camera gửi một frame mỗi 100 ms đến FastAPI và vẽ bounding box trực tiếp." />
    <section className="scanner-grid">
      <div className="surface upload-surface">
        <div className="drop-zone yolo-drop-zone">
          <div className="camera-stage" style={{ aspectRatio: previewRatio }}>
            <video ref={video} className={stream ? 'camera-preview' : 'camera-preview camera-hidden'} autoPlay muted playsInline />
            <canvas ref={overlay} className={stream ? 'detection-overlay' : 'detection-overlay camera-hidden'} aria-label="Khung nhận diện YOLOv8" />
            {!stream && <div className="camera-placeholder"><b>⌁</b><strong>Camera sẵn sàng</strong><span>Bật camera để bắt đầu nhận diện rác.</span></div>}
          </div>
          <div className="prediction-badge"><strong>{status}</strong><span>{confidence ? Math.round(confidence * 100) + '%' : '—'}</span></div>
          {cameraError && <div className="error-state">{cameraError}</div>}
          {!stream
            ? <Button type="button" variant="outline" onClick={startCamera}>⇥ Bật camera</Button>
            : <><Button type="button" variant="danger" onClick={stopCamera}>■ Dừng camera</Button><Button type="button" variant="outline" onClick={resetScan}>↻ Quét lại</Button></>}
        </div>
        <canvas ref={capture} className="capture-canvas" />
        {frames.length > 0 && <div className="frame-strip">{frames.map((frame, index) => <img key={`${index}-${frame.slice(-12)}`} src={frame} alt={`Frame xác nhận ${index + 1}`} />)}</div>}
      </div>
      <aside className="surface scan-result">
        <em>YOLOV8 · FASTAPI</em><h2>Vật phẩm của bạn</h2>
        <p>{detections.length ? `${detections.length} vật thể được phát hiện trong frame mới nhất.` : 'Đưa một vật thể vào giữa khung hình.'}</p>
        <label>Loại vật phẩm</label>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">Chọn loại vật phẩm</option>
          {wasteTypes.map((item) => <option key={item} value={item}>{wasteLabel(item)}</option>)}
        </select>
        <div className="result-stats"><span>Độ tin cậy<b>{confidence ? Math.round(confidence * 100) + '%' : '—'}</b></span><span>Frame<b>{frames.length}/30</b></span></div>
        <Button className="wide" disabled={frames.length < 3 || !type || sending} onClick={send}>{sending ? 'Đang kiểm tra và gửi...' : 'Check-AI và gửi →'}</Button>
        <small className="secure">Chỉ bài đạt confidence từ 0.5 mới được chuyển vào trạng thái pending.</small>
      </aside>
    </section></>;
}
function History({ session }) {
  const [items, setItems] = useState([]); const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all'); const [error, setError] = useState('');
  useEffect(() => { authService.mySubmissions(session.studentId).then(setItems).catch((e) => setError(e.message)); }, [session.studentId]);
  const result = useMemo(() => items.filter((item) => (filter === 'all' || item.status === filter) && (item.wasteType + ' ' + (item.feedback || '')).toLowerCase().includes(query.toLowerCase())), [items, filter, query]);
  return <><Header eyebrow="HỒ SƠ XANH CỦA BẠN" title="Lịch sử tái chế" subtitle="Mọi vật phẩm bạn đã gửi, được duyệt hoặc cần gửi lại." /><section className="surface"><div className="filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="⌕ Tìm theo loại vật phẩm..." /><div>{[['all', 'Tất cả'], ['approved', 'Đã duyệt'], ['pending', 'Chờ duyệt'], ['rejected', 'Từ chối']].map(([key, label]) => <Button key={key} variant={filter === key ? 'filter active' : 'filter'} onClick={() => setFilter(key)}>{label}</Button>)}</div></div><p className="count">Hiển thị {result.length} vật phẩm</p>{error ? <ErrorState error={error} /> : result.length ? result.map((item) => <Row key={item.id} item={item} />) : <Empty title="Không tìm thấy vật phẩm" text="Thử thay đổi từ khóa hoặc bộ lọc nhé." />}</section></>;
}
function Admin({ notify }) {
  const [items, setItems] = useState([]); const [filter, setFilter] = useState('pending'); const [reject, setReject] = useState(null); const [feedback, setFeedback] = useState(''); const [points, setPoints] = useState('5'); const [error, setError] = useState('');
  const load = () => authService.adminSubmissions().then(setItems).catch((e) => setError(e.message)); useEffect(() => { load(); }, []);
  const pending = items.filter((item) => item.status === 'pending').length; const visible = items.filter((item) => filter === 'all' || item.status === 'pending');
  async function review(id, status) { try { await authService.reviewSubmission(id, { status, feedback, points: Number(points) }); setReject(null); setFeedback(''); notify(status === 'approved' ? `Đã duyệt và cộng ${points} điểm.` : 'Đã lưu lý do từ chối.', 'success'); load(); } catch (e) { notify(e.message, 'error'); } }
  async function revoke(id) { if (!window.confirm('Thu hồi lượt duyệt và toàn bộ điểm đã cấp cho bài này?')) return; try { await authService.revokeSubmission(id); notify('Đã thu hồi lượt duyệt và điểm thưởng.', 'success'); load(); } catch (e) { notify(e.message, 'error'); } }
  return <><Header eyebrow="KHU VỰC QUẢN TRỊ" title="Hàng chờ kiểm tra" subtitle="Kiểm tra vật phẩm và ghi nhận điểm xanh cho học sinh."><span className="pending-number">◷ {pending} bài chờ duyệt</span></Header><section className="metric-grid"><Metric icon="◷" value={pending} label="Đang chờ duyệt" /><Metric icon="✓" value={items.filter((item) => item.status === 'approved').length} label="Đã xác nhận" /><Metric icon="♙" value={items.length} label="Tổng lượt gửi" /></section><section className="surface"><div className="section-heading"><div><h2>Vật phẩm cần kiểm tra</h2><p>Xem ảnh và xác nhận loại vật liệu trước khi cộng điểm.</p></div><div><Button variant={filter === 'pending' ? 'filter active' : 'filter'} onClick={() => setFilter('pending')}>Chờ duyệt ({pending})</Button><Button variant={filter === 'all' ? 'filter active' : 'filter'} onClick={() => setFilter('all')}>Tất cả</Button></div></div>{error ? <ErrorState error={error} /> : visible.length ? <div className="approval-list">{visible.map((item) => { const imageUrl = item.imageUrl || item.frameUrls?.[0] || item.imageDataUrl; return <article className="approval-card" key={item.id}><div className="submission-image">{imageUrl ? <img src={imageUrl} alt={item.wasteType} /> : item.videoUrl ? <video controls preload="metadata" src={item.videoUrl}>Trình duyệt không hỗ trợ phát video.</video> : <><b>♻</b><small>Chưa có ảnh</small></>} {item.videoUrl && imageUrl && <video className="approval-video" controls preload="metadata" src={item.videoUrl}>Trình duyệt không hỗ trợ phát video.</video>} {imageUrl && <em>ẢNH GỬI</em>} {!imageUrl && item.videoUrl && <em>VIDEO GỬI</em>}</div><div><strong>{item.wasteType}</strong> <Status status={item.status} /><p>{item.studentName} · {item.studentId}</p><small>{date(item.submittedAt)} · AI demo {confidencePercent(item.confidence)}% · {item.points || 0} điểm</small>{item.feedback && <p className="rejection">Lý do: {item.feedback}</p>}</div>{item.status === 'pending' ? <div className="approval-actions"><label>Điểm thưởng<input type="number" min="0" step="1" value={points} onChange={(e) => setPoints(e.target.value)} /></label><Button onClick={() => review(item.id, 'approved')}>✓ Duyệt</Button><Button variant="danger" onClick={() => { setReject(item); setFeedback(''); }}>× Từ chối</Button></div> : item.status === 'approved' ? <div className="approval-actions"><b className="points">+{item.points} điểm</b><Button variant="danger" onClick={() => revoke(item.id)}>↶ Thu hồi</Button></div> : <b className="rejected">Đã từ chối</b>}</article>; })}</div> : <Empty title="Tuyệt vời, đã xử lý hết!" text="Các vật phẩm mới gửi sẽ xuất hiện ở đây." />}</section>{reject && <div className="modal-backdrop"><div className="modal"><button className="close" onClick={() => setReject(null)}>×</button><em>PHẢN HỒI CHO HỌC SINH</em><h2>Từ chối vật phẩm?</h2><p>{reject.studentName} · {reject.wasteType}</p><label>Lý do từ chối *</label><textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Ví dụ: Vui lòng làm sạch vật phẩm và chụp ảnh rõ hơn..." /><div className="modal-actions"><Button variant="outline" onClick={() => setReject(null)}>Hủy</Button><Button variant="danger" disabled={!feedback.trim()} onClick={() => review(reject.id, 'rejected')}>Xác nhận từ chối</Button></div></div></div>}</>;
}
export default function App() {
  const { notify } = useToast();
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem('rr-session')) || null; } catch { return null; } }); const [route, setRoute] = useState(() => location.hash.slice(1) || '/');
  useEffect(() => { const sync = () => setRoute(location.hash.slice(1) || '/'); addEventListener('hashchange', sync); return () => removeEventListener('hashchange', sync); }, []);
  useEffect(() => { if (session) localStorage.setItem('rr-session', JSON.stringify(session)); else localStorage.removeItem('rr-session'); }, [session]);
  useEffect(() => authService.onAuthStateChanged(async (firebaseUser) => {
    if (!firebaseUser) {
      setSession(null);
      setAuthReady(true);
      return;
    }
    try {
      const response = await authService.syncUser(firebaseUser);
      setSession(response.user);
    } catch (error) {
      if (error.status === 401) authService.logout().catch(() => {});
      setSession(null);
      notify(error.message, 'error');
    } finally {
      setAuthReady(true);
    }
  }), [notify]);
  function go(path) { location.hash = path; }
  function completeLogin(response) { setSession(response.user); go(response.user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'); }
  async function login() { completeLogin(await authService.googleLogin()); }
  async function emailLogin(email, password) { completeLogin(await authService.emailLogin(email, password)); }
  async function register(name, email, password) { completeLogin(await authService.emailRegister(name, email, password)); }
  function logout() { authService.logout().catch((error) => notify(error.message, 'error')); setSession(null); go('/login'); }
  if (!authReady) return <main className="login-page"><section className="login-panel"><div className="login-card"><Logo /><p className="hint">Đang kiểm tra phiên đăng nhập...</p></div></section></main>;
  if (!session) return <Login login={login} emailLogin={emailLogin} register={register} notify={notify} />;
  const isProfileRoute = route === '/profile' || route === '/student/settings';
  const isAdminSubmissionsRoute = route === '/admin/submissions';
  const isAdminQueueRoute = route === '/admin';

  let page;
  if (isProfileRoute) {
    page = <Profile session={session} setSession={setSession} />;
  } else if (session.role === 'admin' && isAdminSubmissionsRoute) {
    page = <AdminSubmissions />;
  } else if (session.role === 'admin' && isAdminQueueRoute) {
    page = <Admin notify={notify} />;
  } else if (session.role === 'admin') {
    page = <AdminDashboard />;
  } else {
    page = route === '/student/scanner'
      ? <Scanner session={session} go={go} notify={notify} />
      : route === '/student/history'
        ? <History session={session} />
        : <Dashboard session={session} go={go} />;
  }
  return <div className="shell"><Nav session={session} route={route} go={go} logout={logout} /><main className="content">{page}</main></div>;
}
