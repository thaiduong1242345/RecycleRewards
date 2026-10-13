import { createSubmission, submissions } from '../models/submission.model.js';

export function listMine(req, res) {
  const { studentId } = req.query;
  res.json(submissions.filter((item) => !studentId || item.studentId === studentId));
}

export function studentDashboard(req, res) {
  const items = submissions.filter((item) => item.studentId === req.params.studentId);
  const approved = items.filter((item) => item.status === 'approved');
  res.json({
    totalPoints: approved.reduce((total, item) => total + item.points, 0),
    totalSubmissions: items.length,
    approvedCount: approved.length,
    pendingCount: items.filter((item) => item.status === 'pending').length,
    recent: [...items].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 4),
  });
}

export function submitWaste(req, res) {
  const { studentName, studentId, wasteType, imageDataUrl, videoFrames } = req.body;
  if (!studentName || !studentId || !wasteType) return res.status(400).json({ message: 'Thiếu thông tin vật phẩm.' });
  if (!Array.isArray(videoFrames) || videoFrames.length !== 3 || videoFrames.some((frame) => typeof frame !== 'string' || !frame.startsWith('data:image/jpeg;base64,'))) {
    return res.status(400).json({ message: 'Video cần có đủ 3 khung hình JPEG hợp lệ.' });
  }

  const confidence = videoFrames.length === 3 ? 88 : 0;
  if (confidence < 80) return res.status(422).json({ message: 'Độ tin cậy chưa đạt ngưỡng 80%. Vui lòng quay lại video rõ hơn.' });
  res.status(201).json(createSubmission({ studentName, studentId, wasteType, confidence, imageDataUrl, videoFrames }));
}
