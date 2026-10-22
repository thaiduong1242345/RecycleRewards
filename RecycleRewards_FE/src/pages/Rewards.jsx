import { useEffect, useState } from 'react';
import { rewardsService } from '../services/rewards.service.js';
import { profileService } from '../services/profile.service.js';
import { useToast } from '../components/ToastProvider.jsx';

const number = new Intl.NumberFormat('vi-VN');

export default function Rewards({ session, setSession }) {
  const [rewards, setRewards] = useState([]);
  const [balance, setBalance] = useState(Number(session.pointsBalance || 0));
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState('');
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
      notify('Đã đổi quà. Yêu cầu của bạn đang chờ được trao.', 'success');
    } catch (redeemError) {
      notify(redeemError.message || 'Không thể đổi quà.', 'error');
    } finally {
      setRedeeming('');
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
  </>;
}
