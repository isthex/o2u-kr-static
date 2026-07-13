// 청년혜택 찾기 — 나이·상황 → 해당 혜택 매칭 (2026-07 기준)
// 공식 판정 아님 · 각 혜택 조건 요약과 함께 표시

const BENEFITS = [
  {
    id: 'mirae',
    badge: '🆕 자산형성',
    name: '청년미래적금',
    ageMin: 19, ageMax: 34,
    flags: [],                     // 나이만 맞으면 표시
    boost: ['work'],               // 이 플래그 있으면 우선 정렬
    cond: '개인소득 6,000만원 이하 · 가구 중위소득 200% 이하 (병역기간 최대 6년 나이에서 제외)',
    give: '정부기여금 6~12% 매칭 + 비과세, 3년 만기 최대 약 2,200만원',
    link: 'https://youthsave.winevisionshop.kr/',
    linkLabel: '가입자격·만기수령액 계산기 →',
    official: false,
  },
  {
    id: 'rent',
    badge: '🏠 주거',
    name: '청년월세지원',
    ageMin: 19, ageMax: 34,
    flags: ['rent'],
    boost: ['lowincome'],
    cond: '무주택 독립거주 · 청년가구 중위소득 60% 이하 · 원가구 100% 이하',
    give: '월 최대 20만원 × 최대 24개월 (총 480만원) · 상시 신청',
    link: 'https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00004661',
    linkLabel: '복지로에서 신청 →',
    official: true,
  },
  {
    id: 'naeil',
    badge: '💰 자산형성',
    name: '청년내일저축계좌',
    ageMin: 15, ageMax: 39,
    flags: ['work', 'lowincome'],
    required: true,               // 근로소득이 필수 조건 — work/lowincome 선택 시에만 노출
    boost: [],
    cond: '근로·사업소득 월 10만원 이상 · 저소득 가구 (소득구간별 상이)',
    give: '본인 10만원 저축 시 정부 10~30만원 추가 적립 (3년 유지 + 교육 이수)',
    link: 'https://www.bokjiro.go.kr/',
    linkLabel: '복지로에서 확인 →',
    official: true,
  },
  {
    id: 'kpass',
    badge: '🚌 교통',
    name: 'K-패스 청년 환급',
    ageMin: 19, ageMax: 39,
    ageNote: '기본 만 34세 · 경기/인천 거주자는 만 39세까지',
    flags: ['transit'],
    boost: [],
    cond: '월 15회 이상 대중교통 이용 · K-패스 전용 카드',
    give: '교통비 30% 환급 (일반 20%보다 높음) · 61회부터 100% 환급',
    link: 'https://korea-pass.kr/',
    linkLabel: 'K-패스 공식 안내 →',
    official: false,
  },
  {
    id: 'gicho',
    badge: '🛡 복지',
    name: '기초생활보장 급여',
    ageMin: 15, ageMax: 39,
    flags: ['lowincome'],
    required: true,               // 플래그 필수 (lowincome 없으면 미표시)
    boost: [],
    cond: '소득인정액이 기준 중위소득 32~50% 이하 (급여별 상이)',
    give: '생계·의료·주거·교육급여 — 1인 가구 생계 기준 월 82만원 이하',
    link: 'https://gicho.8949ok.kr/',
    linkLabel: '수급 자격 확인 →',
    official: false,
  },
];

const fmtChips = { rent: '자취 중', work: '일하는 중', lowincome: '소득 적음', transit: '대중교통' };
let selAge = 0;
const selFlags = new Set();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initSidebar === 'function') initSidebar({ relatedTools: ['youth-future-savings', 'gicho', 'eitc-grant'] });
  document.getElementById('find-form').addEventListener('submit', find);
  document.getElementById('btn-share').addEventListener('click', handleShare);

  document.querySelectorAll('#age-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selAge = Number(chip.dataset.age);
      document.querySelectorAll('#age-chips .chip').forEach(c => c.classList.toggle('active', c === chip));
    });
  });
  // 상황 칩은 멀티 선택 토글
  document.querySelectorAll('#flag-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const f = chip.dataset.flag;
      if (selFlags.has(f)) { selFlags.delete(f); chip.classList.remove('active'); }
      else { selFlags.add(f); chip.classList.add('active'); }
    });
  });
});

function find(e) {
  e.preventDefault();
  const result = document.getElementById('find-result');
  if (!selAge) {
    result.className = 'check-result warn';
    result.innerHTML = '<h3>만 나이를 먼저 선택해 주세요</h3><p>나이대만 골라도 받을 수 있는 혜택을 보여드려요.</p>';
    result.hidden = false;
    return;
  }

  const matched = [];
  for (const b of BENEFITS) {
    if (selAge < b.ageMin || selAge > b.ageMax) continue;
    if (b.required && !b.flags.some(f => selFlags.has(f))) continue;
    // 점수: 선택 플래그와 겹칠수록 위로
    let score = 0;
    for (const f of b.flags) if (selFlags.has(f)) score += 2;
    for (const f of (b.boost || [])) if (selFlags.has(f)) score += 1;
    matched.push({ ...b, score });
  }
  matched.sort((a, b2) => b2.score - a.score);

  if (!matched.length) {
    result.className = 'check-result warn';
    result.innerHTML = '<h3>선택한 나이대에 맞는 혜택을 찾지 못했어요</h3><p>정부24 청년정책 모음에서 지역별 혜택을 추가로 확인해 보세요.</p><a class="result-link" href="https://www.gov.kr/portal/youthPolicy" target="_blank" rel="noopener">정부24 청년정책 보기 →</a>';
    result.hidden = false;
    return;
  }

  const picked = [...selFlags].map(f => fmtChips[f]).join(' · ') || '선택 없음';
  const cards = matched.map(b => `
    <div class="benefit-card">
      <div class="benefit-head"><span class="benefit-badge">${b.badge}</span><strong>${b.name}</strong></div>
      ${b.ageNote ? `<p class="benefit-age">${b.ageNote}</p>` : ''}
      <p class="benefit-cond">조건 — ${b.cond}</p>
      <p class="benefit-give">지원 — ${b.give}</p>
      <a class="result-link" href="${b.link}" ${b.official ? 'target="_blank" rel="noopener"' : 'target="_blank"'}>${b.linkLabel}</a>
    </div>`).join('');

  result.className = 'check-result';
  result.innerHTML = `<h3>해당 가능성이 있는 혜택 ${matched.length}개</h3>
    <p class="benefit-picked">선택: 만 ${selAge}세 구간 · ${picked}</p>
    ${cards}
    <p class="calc-note">나이만으로 추린 참고용 목록이에요. 소득·재산 조건은 각 링크에서 확인하세요.</p>`;
  result.hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function handleShare() {
  const data = {
    title: '2026 청년혜택 총정리 · 내 혜택 찾기',
    text: '나이·상황만 고르면 받을 수 있는 청년 지원금을 바로 찾아드려요.',
    url: 'https://youth.o2u.kr/',
  };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(data.url); showToast('링크가 복사되었습니다.'); }
  } catch (e) { if (e.name !== 'AbortError') showToast('주소창의 링크를 복사해 주세요.'); }
}

function showToast(msg) {
  const old = document.querySelector('.share-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'share-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 2200);
}
