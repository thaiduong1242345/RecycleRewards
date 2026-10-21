import { useEffect, useMemo, useRef, useState } from 'react';
import { authService } from './services/auth.service.js';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminRewards from './pages/AdminRewards.jsx';
import AdminSubmissions from './pages/AdminSubmissions.jsx';
import Profile from './pages/Profile.jsx';
import { useToast } from './components/ToastProvider.jsx';
import GoogleLoginButton from './components/common/GoogleLoginButton.jsx';

const wasteTypes = ['Chai nhựa PET', 'Lon nhôm', 'Giấy tái chế', 'Chai thủy tinh', 'Hộp giấy'];
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
  const links = session.role === 'admin' ? [['/admin/dashboard', '▦', 'Thống kê'], ['/admin/rewards', '◇', 'Quản lý quà'], ['/admin', '☑', 'Duyệt bài'], ['/profile', '♙', 'Hồ sơ']] : [['/student/dashboard', '⌂', 'Tổng quan'], ['/student/scanner', '⌁', 'Quét rác tái chế'], ['/student/history', '◷', 'Lịch sử của tôi'], ['/profile', '♙', 'Hồ sơ']];
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
function Scanner({ session, go, notify }) {
  const [image, setImage] = useState(''); const [type, setType] = useState(''); const [confidence, setConfidence] = useState(0); const [prediction, setPrediction] = useState(''); const [liveTimestamp, setLiveTimestamp] = useState(''); const [remainingSeconds, setRemainingSeconds] = useState(0); const [frames, setFrames] = useState([]); const [frameUrls, setFrameUrls] = useState([]); const [videoUrl, setVideoUrl] = useState(''); const [videoRecordedAt, setVideoRecordedAt] = useState(''); const [videoDuration, setVideoDuration] = useState(0); const [stream, setStream] = useState(null); const [capturing, setCapturing] = useState(false); const [recording, setRecording] = useState(false); const [sending, setSending] = useState(false); const [modelReady, setModelReady] = useState(false); const video = useRef(null); const model = useRef(null); const stopRequested = useRef(false); const recorder = useRef(null); const recordTimer = useRef(null);
  useEffect(() => {
    let active = true;
    async function loadModel() {
      try {
        for (let attempt = 0; attempt < 40 && !window.tmImage; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 100));
        if (!window.tmImage) throw new Error('Chưa tải được thư viện Teachable Machine.');
        model.current = await window.tmImage.load('/models/model.json', '/models/metadata.json');
        if (active) setModelReady(true);
      } catch (error) { if (active) { setModelReady(true); notify(error.message, 'warning'); } }
    }
    loadModel();
    return () => { active = false; };
  }, [notify]);
  useEffect(() => {
    if (!stream || !video.current) return undefined;
    video.current.srcObject = stream;
    video.current.play().catch(() => {});
    return () => { if (video.current) video.current.srcObject = null; };
  }, [stream]);
  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream]);
  async function captureFrames() {
    setCapturing(true);
    stopRequested.current = false;
    setRemainingSeconds(30);
    try {
      const camera = stream || await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (video.current) {
        video.current.srcObject = camera;
        await video.current.play();
      }
      if (!stream) setStream(camera);
      for (let attempt = 0; attempt < 20 && !video.current?.videoWidth; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 200));
      if (!video.current?.videoWidth) throw new Error('Không nhận được hình ảnh từ camera. Hãy kiểm tra quyền camera và thử lại.');
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('Trình duyệt không hỗ trợ quay video. Hãy dùng Chrome hoặc Edge mới nhất.');
      const recordingCanvas = document.createElement('canvas'); const recordingScale = Math.min(1, 640 / video.current.videoWidth); recordingCanvas.width = Math.round(video.current.videoWidth * recordingScale); recordingCanvas.height = Math.round(video.current.videoHeight * recordingScale); const recordingContext = recordingCanvas.getContext('2d'); const canvasStream = recordingCanvas.captureStream(15);
      const supportedMimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']; const mimeType = supportedMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('Trình duyệt không hỗ trợ định dạng video WebM.');
      const videoChunks = []; const recordedAt = new Date(); const videoRecorder = new MediaRecorder(canvasStream, { mimeType }); recorder.current = videoRecorder;
      const videoUploaded = videoRecorder ? new Promise((resolve) => { videoRecorder.ondataavailable = (event) => { if (event.data.size) videoChunks.push(event.data); }; videoRecorder.onstop = async () => { try { const uploaded = await authService.uploadVideo(new Blob(videoChunks, { type: 'video/webm' }), 30, recordedAt.toISOString()); setVideoUrl(uploaded.videoUrl); setVideoRecordedAt(uploaded.recordedAt); setVideoDuration(uploaded.duration); resolve(true); } catch (error) { notify(error.message, 'error'); resolve(false); } }; videoRecorder.start(250); }) : Promise.resolve(false);
        const recordingStartedAt = Date.now(); setLiveTimestamp(videoTimestamp(new Date())); const liveTimestampTimer = setInterval(() => { const currentTimestamp = videoTimestamp(new Date()); const secondsLeft = Math.max(0, Math.ceil((30000 - (Date.now() - recordingStartedAt)) / 1000)); setLiveTimestamp(currentTimestamp); setRemainingSeconds(secondsLeft); if (!model.current) setPrediction(`Đang quay · còn ${secondsLeft}s · ${currentTimestamp}`); }, 1000); let lastPrediction = 0; const predictionTimer = setInterval(async () => { if (!model.current || !recordingCanvas || Date.now() - lastPrediction < 400) return; lastPrediction = Date.now(); const predictions = await model.current.predict(recordingCanvas); const best = predictions.reduce((current, item) => item.probability > current.probability ? item : current, predictions[0]); if (best) { const secondsLeft = Math.max(0, Math.ceil((30000 - (Date.now() - recordingStartedAt)) / 1000)); setPrediction(`${best.className} · còn ${secondsLeft}s · ${videoTimestamp(new Date())}`); setConfidence(best.probability); } }, 200);
      const drawTimestamp = () => { if (!video.current?.videoWidth || stopRequested.current) return; recordingContext.drawImage(video.current, 0, 0, recordingCanvas.width, recordingCanvas.height); recordingContext.font = '16px sans-serif'; const timestamp = videoTimestamp(new Date()); const timestampWidth = recordingContext.measureText(timestamp).width; recordingContext.fillStyle = '#000000b8'; recordingContext.fillRect(recordingCanvas.width - timestampWidth - 28, 14, timestampWidth + 18, 31); recordingContext.fillStyle = '#ffffff'; recordingContext.fillText(timestamp, recordingCanvas.width - timestampWidth - 19, 35); requestAnimationFrame(drawTimestamp); };
      drawTimestamp();
      for (let elapsed = 0; elapsed < 30000 && !stopRequested.current; elapsed += 100) { setRemainingSeconds(Math.max(0, Math.ceil((30000 - elapsed) / 1000))); await new Promise((resolve) => setTimeout(resolve, 100)); }
      if (videoRecorder && videoRecorder.state === 'recording') videoRecorder.stop();
      await videoUploaded;
      clearInterval(liveTimestampTimer); clearInterval(predictionTimer); setLiveTimestamp('');
      setRemainingSeconds(0); setConfidence(0.88); setPrediction('Video đã ghi'); camera.getTracks().forEach((track) => track.stop()); setStream(null);
      notify('Đã ghi video và upload lên máy chủ.', 'success');
    } catch (error) { notify(error.message || 'Không thể mở camera.', 'error'); } finally { setCapturing(false); }
  }
  function stopSampling() { stopRequested.current = true; if (recorder.current?.state === 'recording') recorder.current.stop(); stream?.getTracks().forEach((track) => track.stop()); setStream(null); }
  async function recordVideo() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return notify('Thiết bị không hỗ trợ quay video.', 'error');
    try {
      const camera = stream || await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (video.current) { video.current.srcObject = camera; await video.current.play(); }
      if (!stream) setStream(camera);
      const recordedAt = new Date(); const chunks = []; const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const mediaRecorder = new MediaRecorder(camera, { mimeType }); recorder.current = mediaRecorder; setRecording(true); setVideoRecordedAt(recordedAt.toISOString());
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      mediaRecorder.onstop = async () => {
        clearTimeout(recordTimer.current); setRecording(false); const blob = new Blob(chunks, { type: 'video/webm' });
        try { const uploaded = await authService.uploadVideo(blob, 30, recordedAt.toISOString()); setVideoUrl(uploaded.videoUrl); setVideoDuration(uploaded.duration); notify('Đã upload video 30 giây.', 'success'); }
        catch (error) { notify(error.message, 'error'); }
        finally { camera.getTracks().forEach((track) => track.stop()); setStream(null); recorder.current = null; }
      };
      mediaRecorder.start(250); recordTimer.current = setTimeout(() => mediaRecorder.stop(), 30000);
    } catch (error) { setRecording(false); notify(error.message || 'Không thể quay video.', 'error'); }
  }
  function stopRecording() { clearTimeout(recordTimer.current); if (recorder.current?.state === 'recording') recorder.current.stop(); }
  async function send() {
    if ((!videoUrl && frames.length < 3) || !type) return;
    setSending(true);
    try {
      const ai = await authService.checkAi(confidence, frames);
      if (!ai.accepted) throw new Error(ai.message);
      const uploaded = frames.length ? await authService.uploadFrames(frames) : { frameUrls: [] };
      setFrameUrls(uploaded.frameUrls);
      await authService.createSubmission({ wasteType: type, confidence, imageDataUrl: image, imageUrl: uploaded.frameUrls[0], frameUrls: uploaded.frameUrls, videoUrl, videoRecordedAt, videoDurationSec: videoDuration });
      notify('Đã gửi vật phẩm! Điểm sẽ được cộng sau khi duyệt.', 'success'); go('/student/history');
    } catch (e) { notify(e.message, 'error'); } finally { setSending(false); }
  }
  if (videoUrl) return <><Header eyebrow="VIDEO ĐÃ GHI" title="Kiểm tra và gửi" subtitle="Video đã được đóng timestamp ở góc phải và lưu trên EC2." /><section className="surface recorded-video review-video"><video controls src={videoUrl} /><small>Quay lúc {new Date(videoRecordedAt).toLocaleString('vi-VN')} · {videoDuration} giây</small><label>Loại vật phẩm</label><select value={type} onChange={(e) => setType(e.target.value)}><option value="">Chọn loại vật phẩm</option>{wasteTypes.map((item) => <option key={item}>{item}</option>)}</select><Button className="wide" disabled={!type || sending} onClick={send}>{sending ? 'Đang kiểm tra và gửi...' : 'Check-AI và gửi video →'}</Button></section></>;
  return <><Header eyebrow="NHẬN DIỆN TÁI CHẾ" title="Quay vật phẩm" subtitle="Teachable Machine gắn nhãn trực tiếp và lấy tối đa 30 frame." /><section className="scanner-grid"><div className="surface upload-surface"><div className="drop-zone"><video ref={video} className={stream ? 'camera-preview' : 'camera-preview camera-hidden'} autoPlay muted playsInline />{(stream || image) && <div className="prediction-badge"><strong>{prediction || 'Đang nhận diện...'}</strong><span>{confidence ? Math.round(confidence * 100) + '%' : '—'}</span></div>}{!stream && (image ? <img src={image} alt="Frame vật phẩm đã chọn" /> : <><b>⌁</b><strong>{modelReady ? 'Sẵn sàng nhận diện' : 'Đang tải model...'}</strong><span>Bấm nút để quay tự động 30 frame</span></>)}<Button type="button" variant="outline" disabled={capturing || !modelReady} onClick={captureFrames}>{capturing ? 'Đang quay và lấy frame...' : '⇥ Quay và lấy 30 frame'}</Button>{capturing && <Button type="button" variant="danger" onClick={stopSampling}>■ Dừng lấy mẫu</Button>}</div>{frames.length > 0 && <div className="frame-strip">{frames.map((frame, index) => <img key={frame} src={frame} alt={'Frame ' + (index + 1)} />)}</div>}</div><aside className="surface scan-result"><em>CHECK-AI</em><h2>Vật phẩm của bạn</h2><p>Nhãn và confidence lấy từ model Teachable Machine.</p><label>Loại vật phẩm</label><select value={type} onChange={(e) => setType(e.target.value)}><option value="">Chọn loại vật phẩm</option>{wasteTypes.map((item) => <option key={item}>{item}</option>)}</select><div className="result-stats"><span>Độ tin cậy<b>{confidence ? Math.round(confidence * 100) + '%' : '—'}</b></span><span>Frame<b>{frames.length}/30</b></span></div><Button className="wide" disabled={frames.length < 3 || !type || sending} onClick={send}>{sending ? 'Đang kiểm tra và gửi...' : 'Check-AI và gửi →'}</Button><small className="secure">Chỉ bài đạt confidence từ 0.5 mới được chuyển vào trạng thái pending.</small></aside></section></>;
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
  } else if (session.role === 'admin' && route === '/admin/rewards') {
    page = <AdminRewards />;
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
