// ====================================================
// script.js – Клиентская логика формы записи на СТО
// ====================================================

// !!! ВАЖНО: Замените на URL вашего Google Apps Script (скопированный при развертывании) !!!
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxFmcPEUYs_DwY2DHJ_WMvOFKzRjv3-Y0HrT-Ah-V8IDLdZ5MklnwDO3XLTjhh_guj3Fg/exec';

// ====================================================
// Управление уведомлениями
// ====================================================

function showMessage(type, text = '') {
    hideMessage();
    if (type === 'success') {
        const successMsg = document.getElementById('successMessage');
        successMsg.style.display = 'flex';
    } else if (type === 'error') {
        const errorMsg = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        errorText.textContent = text || 'Произошла ошибка.';
        errorMsg.style.display = 'flex';
    }
}

function hideMessage() {
    document.querySelectorAll('.message').forEach(msg => {
        msg.style.display = 'none';
    });
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'block' : 'none';
}

function resetForm() {
    document.getElementById('dataForm').reset();
    hideMessage();
}

// ====================================================
// Форматирование и валидация телефона (российский формат)
// ====================================================

function formatPhone(event) {
    let input = event.target;
    let value = input.value.replace(/\D/g, '');

    if (value.length === 0) {
        input.value = '';
        return;
    }

    // Приводим первую цифру к 8
    if (value[0] !== '7' && value[0] !== '8') {
        value = '8' + value;
    } else if (value[0] === '7') {
        value = '8' + value.substring(1);
    }

    // Форматирование: 8 (XXX) XXX-XX-XX
    let formatted = '8';
    if (value.length > 1) {
        formatted += ' (' + value.substring(1, 4);
    }
    if (value.length >= 4) {
        formatted += ') ' + value.substring(4, 7);
    }
    if (value.length >= 7) {
        formatted += '-' + value.substring(7, 9);
    }
    if (value.length >= 9) {
        formatted += '-' + value.substring(9, 11);
    }

    input.value = formatted;
}

function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 11 && digits[0] === '8';
}

// ====================================================
// Отправка данных
// ====================================================

async function submitForm(event) {
    event.preventDefault();

    // Сбор данных
    const formData = {
        sto: document.getElementById('sto').value,
        client_name: document.getElementById('client_name').value,
        client_phone: document.getElementById('client_phone').value,
        friend_name: document.getElementById('friend_name').value,
        friend_phone: document.getElementById('friend_phone').value
    };

    // Клиентская валидация
    if (!formData.sto) {
        showMessage('error', 'Пожалуйста, выберите СТО.');
        return;
    }
    if (!formData.client_name || !formData.friend_name) {
        showMessage('error', 'Пожалуйста, заполните все поля ФИО.');
        return;
    }
    if (!validatePhone(formData.client_phone) || !validatePhone(formData.friend_phone)) {
        showMessage('error', 'Проверьте номера телефонов. Формат: 8 (XXX) XXX-XX-XX');
        return;
    }
    if (formData.client_phone === formData.friend_phone) {
        showMessage('error', 'Номера клиента и подруги не могут совпадать!');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.result === 'success') {
            showMessage('success');
            setTimeout(resetForm, 2000);
        } else {
            let errorText = 'Ошибка сервера';
            if (result.error === 'duplicate_client') {
                errorText = 'Этот номер телефона уже используется (как клиент или подруга).';
            } else if (result.error === 'duplicate_friend') {
                errorText = 'Этот номер телефона уже используется (как клиент или подруга).';
            } else if (result.error === 'phones_match') {
                errorText = 'Номера клиента и подруги не могут совпадать!';
            } else if (result.error) {
                errorText = result.error;
            }
            showMessage('error', errorText);
        }
    } catch (error) {
        showMessage('error', 'Ошибка сети: ' + error.message);
        console.error('Ошибка:', error);
    } finally {
        showLoading(false);
    }
}

// ====================================================
// Инициализация
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dataForm').addEventListener('submit', submitForm);
    document.getElementById('resetBtn').addEventListener('click', resetForm);

    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', formatPhone);
    });

    if (SCRIPT_URL.includes('ВАШ_ИДЕНТИФИКАТОР')) {
        showMessage('error', 'ВНИМАНИЕ: Замените SCRIPT_URL в файле script.js на реальный адрес вашего Google Apps Script!');
    }

    phoneInputs.forEach(input => {
        if (input.value) formatPhone({ target: input });
    });
});

window.hideMessage = hideMessage;
