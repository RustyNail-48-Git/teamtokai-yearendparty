/* ===================================
   web3tokai 大忘年会フォーム - JavaScript
   =================================== */

// ========== ゴミ拾いの開催設定 ==========
// ゴミ拾いが中止になった場合は false に変更してください。
// 当日の流れ・注意事項・参加タイミングの選択肢がまとめて非表示になります。
const GOMI_ENABLED = true;

// ========== Google Apps Script URL ==========
// セットアップガイドに従って作成したURLをここに貼り付けてください
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyRnsuVGvVqXMibLDJmtf4jW_PEMWgIw-JVSi8s5oYNpGrF_l8eEhcUl5Q9nD3ao8j4/exec';

const ADULT_FEE = 4000;
const TIMING_PARTY_ONLY = '忘年会から参加（12:00〜）';

document.addEventListener('DOMContentLoaded', () => {
    // ========== 要素取得 ==========
    const form = document.getElementById('rsvpForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const successMessage = document.getElementById('successMessage');
    const formCard = document.querySelector('.form-card');
    const resetBtn = document.getElementById('resetBtn');
    const adultCount = document.getElementById('adultCount');
    const childCount = document.getElementById('childCount');
    const childNotice = document.getElementById('childNotice');
    const feeTotal = document.getElementById('feeTotal');
    const allergyDetail = document.getElementById('allergyDetail');
    const exhibitDetail = document.getElementById('exhibitDetail');
    const helpNone = document.getElementById('help-none');

    // ========== ゴミ拾い表示切り替え ==========
    if (!GOMI_ENABLED) {
        document.querySelectorAll('[data-gomi]').forEach(el => el.remove());
    }

    // ========== 参加人数・参加費表示 ==========
    function formatFee(count) {
        return (count * ADULT_FEE).toLocaleString('ja-JP') + '円';
    }

    function updateCount() {
        feeTotal.textContent = formatFee(Number(adultCount.value));
        childNotice.classList.toggle('hidden', childCount.value === '0');
    }

    adultCount.addEventListener('change', updateCount);
    childCount.addEventListener('change', updateCount);

    // ========== 条件付き入力欄の切り替え ==========
    function bindDetailToggle(name, showValue, detailEl) {
        document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            radio.addEventListener('change', () => {
                const show = document.querySelector(`input[name="${name}"]:checked`)?.value === showValue;
                detailEl.classList.toggle('hidden', !show);
                if (!show) detailEl.querySelector('input').value = '';
            });
        });
    }

    bindDetailToggle('allergy', 'あり', allergyDetail);
    bindDetailToggle('exhibit', '希望する', exhibitDetail);

    // ========== 「当日は参加のみ」排他処理 ==========
    document.querySelectorAll('input[name="help"]').forEach(cb => {
        cb.addEventListener('change', function () {
            if (!this.checked) return;
            if (this === helpNone) {
                document.querySelectorAll('input[name="help"]').forEach(other => {
                    if (other !== helpNone) other.checked = false;
                });
            } else {
                helpNone.checked = false;
            }
        });
    });

    // ========== バリデーション関数 ==========
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setError(el, hasError) {
        el.closest('.form-group').classList.toggle('error', hasError);
        return !hasError;
    }

    function radioChecked(name) {
        return document.querySelector(`input[name="${name}"]:checked`);
    }

    function validateForm() {
        let isValid = true;

        const nameInput = document.getElementById('name');
        isValid = setError(nameInput, !nameInput.value.trim()) && isValid;

        const emailInput = document.getElementById('email');
        isValid = setError(emailInput, !emailPattern.test(emailInput.value.trim())) && isValid;

        const radioNames = GOMI_ENABLED ? ['timing', 'drinking', 'allergy'] : ['drinking', 'allergy'];
        radioNames.forEach(name => {
            const first = document.querySelector(`input[name="${name}"]`);
            isValid = setError(first, !radioChecked(name)) && isValid;
        });

        const agree1 = document.getElementById('agree1');
        const agree2 = document.getElementById('agree2');
        isValid = setError(agree1, !agree1.checked || !agree2.checked) && isValid;

        return isValid;
    }

    // ========== リアルタイムバリデーション解除 ==========
    document.getElementById('name').addEventListener('input', function () {
        if (this.value.trim()) this.closest('.form-group').classList.remove('error');
    });

    document.getElementById('email').addEventListener('input', function () {
        if (emailPattern.test(this.value.trim())) this.closest('.form-group').classList.remove('error');
    });

    ['timing', 'drinking', 'allergy'].forEach(name => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            radio.addEventListener('change', function () {
                this.closest('.form-group').classList.remove('error');
            });
        });
    });

    ['agree1', 'agree2'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            const agree1 = document.getElementById('agree1');
            const agree2 = document.getElementById('agree2');
            if (agree1.checked && agree2.checked) agree1.closest('.form-group').classList.remove('error');
        });
    });

    // ========== フォーム送信処理 ==========
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            const firstError = document.querySelector('.form-group.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const helpValues = Array.from(document.querySelectorAll('input[name="help"]:checked')).map(cb => cb.value);
        const adults = Number(adultCount.value);
        const children = Number(childCount.value);

        // 送信データの準備
        const formData = {
            timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            adultCount: adults,
            childCount: children,
            totalCount: adults + children,
            timing: GOMI_ENABLED ? radioChecked('timing').value : TIMING_PARTY_ONLY,
            exhibit: radioChecked('exhibit')?.value || '未回答',
            exhibitText: document.getElementById('exhibitText').value.trim(),
            drinking: radioChecked('drinking').value,
            allergy: radioChecked('allergy').value,
            allergyText: document.getElementById('allergyText').value.trim(),
            help: helpValues.join('、') || '未回答',
            comments: document.getElementById('comments').value.trim() || '特になし'
        };

        // ボタンをローディング状態に
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');

        try {
            if (SCRIPT_URL) {
                // GASにPOST送信（CORS制約回避のため no-cors モード）
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // デバッグ用（URL未設定時はコンソールに出力して擬似送信）
                console.log('📋 フォーム送信データ (デバッグモード):', formData);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            showSuccess(adults);
        } catch (error) {
            console.error('送信中にエラーが発生しました:', error);
            // no-cors の場合エラーをキャッチできないことがありますが、念のため
            showSuccess(adults);
        }
    });

    // ========== 送信成功画面表示 ==========
    function showSuccess(adults) {
        document.getElementById('successFee').textContent = formatFee(adults);
        formCard.classList.add('hidden');
        successMessage.classList.remove('hidden');
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ========== フォームリセット（もう一度登録） ==========
    resetBtn.addEventListener('click', () => {
        form.reset();
        updateCount();
        allergyDetail.classList.add('hidden');
        exhibitDetail.classList.add('hidden');
        document.querySelectorAll('.form-group').forEach(group => group.classList.remove('error'));

        successMessage.classList.add('hidden');
        formCard.classList.remove('hidden');
        document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    });
});
