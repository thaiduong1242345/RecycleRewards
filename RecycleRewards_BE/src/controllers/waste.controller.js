import { Submission } from '../models/submission.model.js';
import { saveSubmissionFrames, saveSubmissionVideo } from '../services/localStorage.service.js';

const AI_CONFIDENCE_THRESHOLD = 0.5;

export async function listMine(req, res) {
  const studentId = req.user.role === 'student' ? req.user.studentId : req.query.studentId;
  const items = await Submission.find(studentId ? { studentId } : {}).sort({ submittedAt: -1 });
  res.json(items.map((item) => item.toJSON()));
}

export async function studentDashboard(req, res) {
  if (req.user.role === 'student' && req.params.studentId !== req.user.studentId) {
    return res.status(403).json({ message: 'Bạn không thể xem dashboard của người dùng khác.' });
  }
  const items = await Submission.find({ studentId: req.params.studentId }).sort({ submittedAt: -1 });
  const approved = items.filter((item) => item.status === 'approved');
  res.json({
    totalPoints: approved.reduce((total, item) => total + item.points, 0),
    totalSubmissions: items.length,
    approvedCount: approved.length,
    pendingCount: items.filter((item) => item.status === 'pending').length,
    recent: items.slice(0, 4).map((item) => item.toJSON()),
  });
}

export async function submitWaste(req, res) {
  const { wasteType, confidence, weightKg, imageDataUrl, imageUrl, frameUrls, videoUrl, videoRecordedAt, videoDurationSec } = req.body;
  if (!wasteType) return res.status(400).json({ message: 'Thiếu thông tin vật phẩm.' });
  const parsedWeightKg = Number(weightKg || 0);
  if (!Number.isFinite(parsedWeightKg) || parsedWeightKg < 0) {
    return res.status(400).json({ message: 'Khối lượng phải là số không âm.' });
  }
  const submission = await Submission.create({
    userId: req.user._id,
    studentName: req.user.name,
    studentId: req.user.studentId,
    wasteType,
    confidence: Number(confidence) || 88,
    weightKg: parsedWeightKg,
    imageDataUrl: imageDataUrl || '',
    imageUrl: imageUrl || '',
      frameUrls: Array.isArray(frameUrls) ? frameUrls.slice(0, 30) : [],
    videoUrl: videoUrl || '',
    videoRecordedAt: videoRecordedAt ? new Date(videoRecordedAt) : undefined,
    videoDurationSec: Number(videoDurationSec) || 0,
    points: 0,
  });
  res.status(201).json(submission.toJSON());
}

export async function uploadFrames(req, res) {
  const frames = Array.isArray(req.body?.frames) ? req.body.frames : [];
    if (frames.length < 3 || frames.length > 30) return res.status(400).json({ message: 'Cần tải lên từ 3 đến 30 frame.' });
  const requestBaseUrl = `${req.protocol}://${req.get('host')}`;
  const frameUrls = await saveSubmissionFrames(frames, requestBaseUrl);
  res.status(201).json({ frameUrls });
}

export async function uploadVideo(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Thiếu file video.' });
  const duration = Number(req.body?.duration || 0);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 30.5) return res.status(400).json({ message: 'Video phải có thời lượng tối đa 30 giây.' });
  const recordedAt = new Date(req.body?.recordedAt || Date.now());
  if (Number.isNaN(recordedAt.getTime())) return res.status(400).json({ message: 'Timestamp video không hợp lệ.' });
  const requestBaseUrl = `${req.protocol}://${req.get('host')}`;
  const videoUrl = await saveSubmissionVideo(req.file, requestBaseUrl);
  res.status(201).json({ videoUrl, recordedAt: recordedAt.toISOString(), duration: Math.min(duration, 30) });
}

export function checkAi(req, res) {
  const rawConfidence = Number(req.body?.confidence);
  const confidence = rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    return res.status(400).json({ message: 'Confidence phải là số trong khoảng từ 0 đến 1.' });
  }

  if (confidence < AI_CONFIDENCE_THRESHOLD) {
    return res.status(422).json({
      accepted: false,
      confidence,
      threshold: AI_CONFIDENCE_THRESHOLD,
      message: 'Kết quả AI không đạt độ chính xác tối thiểu 50%.',
    });
  }

  return res.json({
    accepted: true,
    confidence,
    threshold: AI_CONFIDENCE_THRESHOLD,
    message: 'Kết quả AI hợp lệ, bài nộp được phép chuyển sang chờ duyệt.',
  });
}
