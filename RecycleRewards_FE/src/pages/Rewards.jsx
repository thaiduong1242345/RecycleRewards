import { useEffect, useState } from 'react';
import { rewardsService } from '../services/rewards.service.js';
import { profileService } from '../services/profile.service.js';
import { useToast } from '../components/ToastProvider.jsx';

const number = new Intl.NumberFormat('vi-VN');
const transactionAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createTransactionCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => transactionAlphabet[byte % transactionAlphabet.length]).join('');
}

export default function Rewards({ session, setSession }) {
  const [rewards, setRewards] = useState([]);
  const [balance, setBalance] = useState(Number(session.pointsBalance || 0));
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState('');
  const [redemption, setRedemption] = useState(null);
  const [error, setError] = useState('');
  const { notify } = useToast();

  useEffect(() => {
    let active = true;
    Promise.all([rewardsService.list(), profileService.getCurrent('student')]).then(([items, profile]) => {
      if (!active) return;
      const pointsBalance = Number(profile.pointsBalance || 0);
      setRewards(items);
      setBalance(pointsBalance);
      setSession((current) => ({ ...current, pointsBalance }));
    }).catch((loadError) => active && setError(loadError.message || 'Không thể tải danh sách quà.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [setSession]);

  async function redeem(reward) {
    if (!window.confirm(`Đổi “${reward.name}” với ${number.format(reward.points)} điểm?`)) return;
    setRedeeming(reward.id);
    try {
      const result = await rewardsService.redeem(reward.id);
      setBalance(result.pointsBalance);
      setSession((current) => ({ ...current, pointsBalance: result.pointsBalance }));
      setRewards((current) => current.map((item) => item.id === reward.id ? { ...item, stock: item.stock - 1 } : item).filter((item) => item.stock > 0));
      setRedemption({ reward, code: createTransactionCode() });
      notify('Đã đổi quà thành công. Hãy gửi mã giao dịch qua Zalo để nhận quà.', 'success');
    } catch (redeemError) {
      notify(redeemError.message || 'Không thể đổi quà.', 'error');
    } finally {
      setRedeeming('');
    }
  }

  async function copyTransactionCode() {
    if (!redemption) return;
    try {
      await navigator.clipboard.writeText(redemption.code);
      notify('Đã sao chép mã giao dịch.', 'success');
    } catch {
      notify(`Mã giao dịch: ${redemption.code}`, 'info');
    }
  }

  return <>
    <header className="page-header"><div><em>ĐỔI ĐIỂM XANH</em><h1>Quà của bạn</h1><p>Dùng điểm tái chế để đổi những phần quà thiết thực.</p></div><div className="points-balance">{number.format(balance)} <small>điểm</small></div></header>
    {loading ? <div className="surface dashboard-state">Đang tải quà...</div> : error ? <div className="error-state">⚠ {error}</div> : <section className="reward-shop">
      {rewards.length ? rewards.map((reward) => <article className="surface reward-card" key={reward.id}>
        <div className="reward-card-image">{reward.imageUrl ? <img src={reward.imageUrl} alt={reward.name} /> : '♻'}</div>
        <h2>{reward.name}</h2><p>{reward.description || 'Phần quà xanh dành cho học sinh.'}</p>
        <div><strong>{number.format(reward.points)} điểm</strong><small>Còn {reward.stock}</small></div>
        <button className="btn primary wide" type="button" disabled={Boolean(redeeming) || balance < reward.points} onClick={() => redeem(reward)}>{redeeming === reward.id ? 'Đang đổi...' : balance < reward.points ? 'Chưa đủ điểm' : 'Đổi quà'}</button>
      </article>) : <div className="surface empty"><b>♻</b><strong>Chưa có quà khả dụng</strong><span>Hãy quay lại sau nhé.</span></div>}
    </section>}
    {redemption && <div className="modal-backdrop redemption-backdrop" role="dialog" aria-modal="true" aria-labelledby="redemption-title">
      <div className="modal redemption-modal">
        <button className="close" type="button" aria-label="Đóng" onClick={() => setRedemption(null)}>×</button>
        <em>ĐỔI QUÀ THÀNH CÔNG</em><h2 id="redemption-title">Gửi mã để nhận quà</h2>
        <p>Bạn đã đổi <strong>{redemption.reward.name}</strong>. Quét QR Zalo và gửi mã giao dịch dưới đây cho người phụ trách.</p>
        <img className="redemption-qr" src="/images/reward-redemption-zalo-qr.png" alt="Mã QR Zalo để xác nhận đổi quà" />
        <div className="transaction-code"><span>Mã giao dịch</span><strong>{redemption.code}</strong><button type="button" className="btn outline" onClick={copyTransactionCode}>Sao chép mã</button></div>
        <p className="redemption-note">Chỉ gửi mã này qua Zalo. Không chia sẻ mã cho người không phụ trách trao quà.</p>
        <div className="modal-actions"><button className="btn primary" type="button" onClick={() => setRedemption(null)}>Tôi đã lưu mã</button></div>
      </div>
    </div>}
  </>;
}
