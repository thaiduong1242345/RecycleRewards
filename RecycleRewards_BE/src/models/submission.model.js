export const submissions = [
  { id: 'rr-2401', studentName: 'Nguyễn Minh Anh', studentId: 'HS-2024-018', wasteType: 'Chai nhựa PET', confidence: 96, status: 'approved', points: 5, submittedAt: '2025-04-18T08:40:00.000Z' },
  { id: 'rr-2402', studentName: 'Trần Gia Bảo', studentId: 'HS-2024-026', wasteType: 'Giấy báo', confidence: 91, status: 'pending', points: 5, submittedAt: '2025-04-18T09:15:00.000Z' },
  { id: 'rr-2403', studentName: 'Lê Khánh Linh', studentId: 'HS-2024-031', wasteType: 'Lon nhôm', confidence: 88, status: 'approved', points: 5, submittedAt: '2025-04-17T14:25:00.000Z' },
  { id: 'rr-2404', studentName: 'Nguyễn Minh Anh', studentId: 'HS-2024-018', wasteType: 'Hộp giấy', confidence: 93, status: 'rejected', points: 0, submittedAt: '2025-04-16T10:10:00.000Z', feedback: 'Vui lòng làm sạch hộp và chụp lại nhãn phân loại rõ hơn nhé.' },
  { id: 'rr-2405', studentName: 'Phạm Đức Long', studentId: 'HS-2024-014', wasteType: 'Chai thủy tinh', confidence: 89, status: 'pending', points: 5, submittedAt: '2025-04-18T10:02:00.000Z' },
  { id: 'rr-2406', studentName: 'Nguyễn Minh Anh', studentId: 'HS-2024-018', wasteType: 'Lon nước ngọt', confidence: 97, status: 'approved', points: 5, submittedAt: '2025-04-14T07:50:00.000Z' },
  { id: 'rr-2407', studentName: 'Vũ Hoàng Nam', studentId: 'HS-2024-039', wasteType: 'Giấy tái chế', confidence: 85, status: 'pending', points: 5, submittedAt: '2025-04-18T10:24:00.000Z' },
];

export const createSubmission = (payload) => {
  const submission = { id: `rr-${Date.now()}`, status: 'pending', points: 5, submittedAt: new Date().toISOString(), videoFrames: [], ...payload };
  submissions.unshift(submission);
  return submission;
};

export const updateSubmission = (id, update) => {
  const item = submissions.find((submission) => submission.id === id);
  if (!item) return null;
  Object.assign(item, update);
  return item;
};
