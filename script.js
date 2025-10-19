let balance = 35;
const productPrice = 17;
let orders = [];
let orderIdCounter = 1;

const balanceElement = document.getElementById('balance');
const productPriceElement = document.getElementById('product-price');
const quantityInput = document.getElementById('product-quantity');
const ordersList = document.getElementById('orders-list');
const noOrdersText = document.getElementById('no-orders-text');

const tabProductsBtn = document.getElementById('tab-products-btn');
const tabOrdersBtn = document.getElementById('tab-orders-btn');
const tabProducts = document.getElementById('tab-products');
const tabOrders = document.getElementById('tab-orders');

const alertPlaceholder = document.getElementById('liveAlertPlaceholder');

// LOCALSTORAGE
if (localStorage.getItem('balance')) balance = parseFloat(localStorage.getItem('balance'));
if (localStorage.getItem('orders')) {
  orders = JSON.parse(localStorage.getItem('orders'));
  if (orders.length > 0) orderIdCounter = Math.max(...orders.map(o => o.id)) + 1;
}
// доставляем значение в HTML
balanceElement.textContent = balance;
productPriceElement.textContent = productPrice;

// алерты
const appendAlert = (message, type) => {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <div>${message}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  alertPlaceholder.append(wrapper);
  setTimeout(() => wrapper.remove(), 4000);
};


// список заказов
function updateOrders() {
  ordersList.innerHTML = '';
  if (orders.length === 0) {
    noOrdersText.style.display = 'block';
  } else {
    noOrdersText.style.display = 'none';
    orders.forEach(order => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>Заказ #${order.id}:</strong> Лучший товар ${order.quantity} (ea) - $${order.total}`;
      ordersList.appendChild(li);
    });
  }
}


// навигация по вкладкам
tabProductsBtn.addEventListener('click', () => switchTab('products'));
tabOrdersBtn.addEventListener('click', () => switchTab('orders'));

function switchTab(tab) {
  if (tab === 'products') {
    tabProducts.classList.add('active', 'fade', 'show');
    tabOrders.classList.remove('active', 'fade', 'show');
    tabProductsBtn.classList.add('active');
    tabOrdersBtn.classList.remove('active');
  } else {
    tabOrders.classList.add('active', 'fade', 'show');
    tabProducts.classList.remove('active', 'fade', 'show');
    tabOrdersBtn.classList.add('active');
    tabProductsBtn.classList.remove('active');
  }
}

// перезапуск
document.getElementById('restart-btn').addEventListener('click', () => {
  balance = 35;
  orders = [];
  orderIdCounter = 1;
  balanceElement.textContent = balance;
  quantityInput.value = 1;
  updateOrders();
  localStorage.setItem('balance', balance);
  localStorage.setItem('orders', JSON.stringify(orders));
  appendAlert('Система перезапущена', 'info');
});


// модалка для оплаты
function closePaymentModal() {
  const paymentModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('paymentModal'));
  paymentModal.hide();
}


// валидация полей оплаты
function validatePaymentFields() {
  const fields = [
    document.getElementById('card-number'),
    document.getElementById('cardholder-name'),
    document.getElementById('expiry'),
    document.getElementById('cvv')
  ];

  let valid = true;
  fields.forEach(field => {
    if (!field.value.trim()) {
      field.style.border = '2px solid red';
      valid = false;
    } else {
      field.style.border = '';
    }
  });

  return valid;
}


// обработка покупки
function processPurchase(quantity) {
  const totalPrice = quantity * productPrice;

  if (balance >= totalPrice) {
    balance -= totalPrice;
    balanceElement.textContent = balance;
    const order = { id: orderIdCounter++, quantity, total: totalPrice };
    orders.push(order);
    updateOrders();
    localStorage.setItem('balance', balance);
    localStorage.setItem('orders', JSON.stringify(orders));
    appendAlert(`Покупка успешна! Баланс: $${balance}`, 'success');
  } else {
    appendAlert('Недостаточно средств.', 'warning');
  }
}


// закрывание модалки
document.getElementById('buy-btn').addEventListener('click', () => {
  const modalEl = document.getElementById('paymentModal');
  const paymentModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  paymentModal.show();
});


// отправка post запроса и обработка 
document.getElementById('confirm-payment-btn').addEventListener('click', async () => {
  if (!validatePaymentFields()) {
    appendAlert('Пожалуйста, заполните все поля платежа!', 'warning');
    return;
  }

  const quantity = parseInt(quantityInput.value);
    const body = {
    paymentType: "DEPOSIT",
    paymentMethod: "BASIC_CARD",
    referenceId: "1", // допустим 1
    amount: quantity * productPrice, 
    currency: "USD",
    parentPaymentId: "1", // допустим 1
    description: "test", 
    card: {
      cardNumber: document.getElementById('card-number').value,
      cardToken: "1", // токен
      cardholderName: document.getElementById('cardholder-name').value,
      cardSecurityCode: document.getElementById('cvv').value,
      expiryMonth: document.getElementById('expiry').value.split('/')[0],
      expiryYear: document.getElementById('expiry').value.split('/')[1],

    }
  };

  try {
    const response = await fetch('https://engine-sandbox.pay.tech/api/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer YOUR_SANDBOX_TOKEN' // вставь свой токен
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`Ошибка платежа: ${response.status}`);

    const result = await response.json();
    console.log('Payment API Response:', result);

    closePaymentModal();
    processPurchase(quantity);

    document.getElementById('payment-form').reset();
  } catch (error) {
    console.error(error);
    appendAlert(`Ошибка при оплате: ${error.message}`, 'danger');
  }
});


// иммитация успешной оплаты
document.getElementById('simulate-success-btn').addEventListener('click', () => {
  closePaymentModal();
  processPurchase(parseInt(quantityInput.value));
  document.getElementById('payment-form').reset();
});


// начальная загрузка
updateOrders();
