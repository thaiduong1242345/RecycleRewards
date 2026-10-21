import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../components/ToastProvider.jsx';
import { createReward, deleteReward, listRewards, updateReward } from '../services/adminRewards.service.js';

const emptyReward = { name: '', description: '', points: '', stock: '', status: 'active', imageUrl: '' };
const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const numberFormat = new Intl.NumberFormat('vi-VN');
const pageSize = 5;

function PageHeader({ onCreate }) {
  return <header className="page-header rewards-header">
    <div><em>KHU VỰC QUẢN TRỊ</em><h1>Quản lý quà</h1><p>Quản lý quà và điểm đổi. Dữ liệu demo được lưu trên trình duyệt này.</p></div>
    <button className="btn primary" type="button" onClick={onCreate}>＋ Thêm quà mới</button>
  </header>;
}

function RewardImage({ reward }) {
  return <div className="reward-image">
    {reward.imageUrl && <img src={reward.imageUrl} alt={reward.name} onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false; }} />}
    <span hidden={Boolean(reward.imageUrl)}>♻</span>
  </div>;
}

function RewardDialog({ mode, reward, onClose, onSave, onDelete, saving }) {
  const isView = mode === 'view';
  const isDelete = mode === 'delete';
  const [form, setForm] = useState(() => reward ? { ...reward, points: String(reward.points), stock: String(reward.stock) } : emptyReward);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, saving]);

  function updateField(event) {
    const { name, value } = event.target;
    if (name === 'name') event.target.setCustomValidity('');
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      event.currentTarget.elements.name.setCustomValidity('Vui lòng nhập tên quà.');
      event.currentTarget.elements.name.reportValidity();
      return;
    }
    onSave({ ...form, name, description: form.description.trim(), points: Number(form.points), stock: Number(form.stock), imageUrl: form.imageUrl.trim() });
  }

  return <div className="modal-backdrop rewards-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <section className="modal rewards-dialog" role={isDelete ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="reward-dialog-title">
      <button className="close" type="button" aria-label="Đóng" onClick={onClose} disabled={saving}>×</button>
      <em>{isDelete ? 'XÁC NHẬN THAO TÁC' : isView ? 'CHI TIẾT QUÀ' : mode === 'edit' ? 'CẬP NHẬT DANH SÁCH' : 'DANH SÁCH QUÀ'}</em>
      <h2 id="reward-dialog-title">{isDelete ? 'Xóa quà này?' : isView ? reward.name : mode === 'edit' ? 'Sửa thông tin quà' : 'Thêm quà mới'}</h2>
      {isDelete ? <>
        <p>Bạn có chắc muốn xóa “{reward.name}”? Thao tác này sẽ xóa quà khỏi danh sách trên thiết bị hiện tại.</p>
        <div className="modal-actions"><button className="btn outline" type="button" onClick={onClose} disabled={saving}>Hủy</button><button className="btn danger" type="button" onClick={onDelete} disabled={saving}>{saving ? 'Đang xóa...' : 'Xóa quà'}</button></div>
      </> : isView ? <>
        <div className="reward-detail"><RewardImage reward={reward} /><dl>
          <div><dt>Mô tả</dt><dd>{reward.description || 'Chưa có mô tả'}</dd></div>
          <div><dt>Điểm đổi</dt><dd>{numberFormat.format(reward.points)} điểm</dd></div>
          <div><dt>Tồn kho</dt><dd>{numberFormat.format(reward.stock)}</dd></div>
          <div><dt>Trạng thái</dt><dd>{reward.status === 'active' ? 'Đang mở' : 'Tạm ẩn'}</dd></div>
          <div><dt>Ngày tạo</dt><dd>{dateFormat.format(new Date(reward.createdAt))}</dd></div>
        </dl></div>
        <div className="modal-actions"><button className="btn outline" type="button" onClick={onClose}>Đóng</button></div>
      </> : <form onSubmit={submit}>
        <div className="reward-form-grid">
          <label className="reward-field-full">Tên quà <span aria-hidden="true">*</span><input autoFocus name="name" value={form.name} onChange={updateField} required maxLength={80} placeholder="Ví dụ: Bình nước inox" /></label>
          <label className="reward-field-full">Mô tả<textarea name="description" value={form.description} onChange={updateField} maxLength={240} rows="3" placeholder="Thông tin ngắn về món quà" /></label>
          <label>Điểm đổi <span aria-hidden="true">*</span><input name="points" type="number" min="1" step="1" value={form.points} onChange={updateField} required /></label>
          <label>Số lượng tồn <span aria-hidden="true">*</span><input name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateField} required /></label>
          <label>Trạng thái<select name="status" value={form.status} onChange={updateField}><option value="active">Đang mở</option><option value="inactive">Tạm ẩn</option></select></label>
          <label>Đường dẫn ảnh<input name="imageUrl" type="url" value={form.imageUrl} onChange={updateField} placeholder="https://..." /></label>
        </div>
        <p className="reward-form-note">Thông tin hiện chỉ được lưu trong trình duyệt này.</p>
        <div className="modal-actions"><button className="btn outline" type="button" onClick={onClose} disabled={saving}>Hủy</button><button className="btn primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu quà'}</button></div>
      </form>}
    </section>
  </div>;
}

export default function AdminRewards() {
  const { notify } = useToast();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadRewards() {
    setLoading(true);
    setError('');
    try {
      setRewards(await listRewards());
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải danh sách quà.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRewards(); }, []);

  const filteredRewards = useMemo(() => rewards.filter((reward) => {
    const matchesName = reward.name.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'));
    return matchesName && (statusFilter === 'all' || reward.status === statusFilter);
  }), [rewards, query, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredRewards.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRewards = filteredRewards.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function saveReward(payload) {
    setSaving(true);
    try {
      if (dialog.mode === 'edit') {
        const updated = await updateReward(dialog.reward.id, payload);
        setRewards((current) => current.map((item) => item.id === updated.id ? updated : item));
        notify('Đã cập nhật thông tin quà.', 'success');
      } else {
        const created = await createReward(payload);
        setRewards((current) => [created, ...current]);
        setPage(1);
        notify('Đã thêm quà mới.', 'success');
      }
      setDialog(null);
    } catch (saveError) {
      notify(saveError.message || 'Không thể lưu thông tin quà.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      await deleteReward(dialog.reward.id);
      setRewards((current) => current.filter((item) => item.id !== dialog.reward.id));
      setDialog(null);
      notify('Đã xóa quà khỏi danh sách.', 'success');
    } catch (deleteError) {
      notify(deleteError.message || 'Không thể xóa quà.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return <>
    <PageHeader onCreate={() => setDialog({ mode: 'create' })} />
    <section className="surface rewards-surface" aria-label="Danh sách quà">
      <div className="rewards-toolbar">
        <div><h2>Danh sách quà</h2><p>{filteredRewards.length} món quà</p></div>
        <div className="rewards-filters">
          <label className="visually-hidden" htmlFor="reward-search">Tìm quà theo tên</label>
          <input id="reward-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="⌕ Tìm theo tên quà..." />
          <label className="visually-hidden" htmlFor="reward-status">Lọc trạng thái</label>
          <select id="reward-status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="all">Tất cả trạng thái</option><option value="active">Đang mở</option><option value="inactive">Tạm ẩn</option></select>
        </div>
      </div>
      {loading ? <div className="rewards-state" role="status">Đang tải danh sách quà...</div>
        : error ? <div className="rewards-state"><div className="error-state" role="alert">⚠ {error}</div><button className="btn outline" type="button" onClick={loadRewards}>Thử tải lại</button></div>
          : visibleRewards.length ? <>
            <div className="rewards-table-wrap"><table className="rewards-table"><thead><tr><th scope="col">STT</th><th scope="col">Quà tặng</th><th scope="col">Mô tả</th><th scope="col">Điểm đổi</th><th scope="col">Tồn kho</th><th scope="col">Trạng thái</th><th scope="col">Ngày tạo</th><th scope="col"><span className="visually-hidden">Thao tác</span></th></tr></thead>
              <tbody>{visibleRewards.map((reward, index) => <tr key={reward.id}>
                <td className="reward-index">{(currentPage - 1) * pageSize + index + 1}</td>
                <td><div className="reward-name-cell"><RewardImage reward={reward} /><strong>{reward.name}</strong></div></td>
                <td className="reward-description">{reward.description || '—'}</td>
                <td className="reward-points">{numberFormat.format(reward.points)} <small>điểm</small></td>
                <td>{numberFormat.format(reward.stock)}</td>
                <td><span className={'reward-status ' + reward.status}><i />{reward.status === 'active' ? 'Đang mở' : 'Tạm ẩn'}</span></td>
                <td className="reward-date">{dateFormat.format(new Date(reward.createdAt))}</td>
                <td><div className="reward-actions"><button type="button" onClick={() => setDialog({ mode: 'view', reward })}>Xem</button><button type="button" onClick={() => setDialog({ mode: 'edit', reward })}>Sửa</button><button className="delete-action" type="button" onClick={() => setDialog({ mode: 'delete', reward })}>Xóa</button></div></td>
              </tr>)}</tbody>
            </table></div>
            <footer className="rewards-pagination"><span>Hiển thị {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredRewards.length)} / {filteredRewards.length}</span><div><button type="button" aria-label="Trang trước" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>←</button><span>Trang {currentPage} / {pageCount}</span><button type="button" aria-label="Trang sau" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>→</button></div></footer>
          </> : <div className="rewards-state"><strong>{rewards.length ? 'Không tìm thấy quà phù hợp' : 'Chưa có quà nào'}</strong><span>{rewards.length ? 'Thử từ khóa hoặc trạng thái khác.' : 'Thêm món quà đầu tiên để bắt đầu danh sách.'}</span></div>}
    </section>
    {dialog && <RewardDialog key={`${dialog.mode}-${dialog.reward?.id || 'new'}`} mode={dialog.mode} reward={dialog.reward} onClose={() => setDialog(null)} onSave={saveReward} onDelete={confirmDelete} saving={saving} />}
  </>;
}