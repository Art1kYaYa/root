const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Замените на токен вашего бота
const token = '7758731240:AAHEtPHVTX-CfWqlwVk7zTim1_SwUHqFbcc';
const bot = new TelegramBot(token, { polling: true });

const usersFile = './users.json';
const finesFile = './fines.json';

// ID работников налоговой
const taxWorkers = [1378783537, 2030128216];  // Замените числа на ID работников налоговой

// Загрузка данных из файлов
let users = loadData(usersFile) || {};
let fines = loadData(finesFile) || {};
const authorizedUsers = []; // Список авторизованных
const employees = []; // Список работников



// Функция для загрузки данных
function loadData(filename) {
  if (fs.existsSync(filename)) {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
  }
  return null;
}

// Функция для сохранения данных
function saveData(filename, data) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  let helpMessage = `
  Добро пожаловать в Налоговую Сервера Мед! Вот доступные команды:

  /start - Начать взаимодействие с ботом и пройти регистрацию.
  /register <имя> - Зарегистрировать нового пользователя (каждому пользователю нужно уникальное имя). Внимание обязательно указывайте ник через @.

  Команды для пользователей:
  /balance - Посмотреть текущий баланс.
  /check_fines - Не оплачаемые штрафы
  /pay <Суммма> - Оплатить штраф (например, /pay 32). Причина - не обязательна, если не указана, будет использована причина "Оплата штрафа".
  /archive - Архив штрафов

  Команды для работников налоговой:
  /fine <пользователь> <сумма> <причина> - Выписать штраф пользователю.
  `;

  bot.sendMessage(chatId, helpMessage);
});

// Проверка, является ли пользователь работником налоговой
function isTaxWorker(userId) {
  return taxWorkers.includes(userId);
}

// Команда /start - Приветственное сообщение и регистрация
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (users[chatId]) {
    bot.sendMessage(chatId, 'Вы уже зарегистрированы! Используйте /help, чтобы увидеть доступные команды.');
  } else {
    bot.sendMessage(chatId, 
      'Добро пожаловать в Налоговую Сервера Мед! Пожалуйста, зарегистрируйтесь, используя команду /register <имя>. Внимание, обязательно указывайте ник через @. Например: /register @ArtikYaYa.\n\n' +
      'Если вы хотите работать в налоговой, пишите @Tovslo.\n' +
      'Если проблемы с ботом, обращайтесь к @ArtikYaYa.'
    );

  }
});
bot.onText(/\/add_worker (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const newWorkerId = parseInt(match[1]);


  if (!isTaxWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только работникам налоговой.');
    return;
  }

  if (isNaN(newWorkerId) || newWorkerId <= 0) {
    bot.sendMessage(chatId, '🛑 Укажите корректный ID нового работника.');
    return;
  }

  
  if (taxWorkers.includes(newWorkerId)) {
    bot.sendMessage(chatId, '🛑 Этот пользователь уже является работником налоговой.');
    return;
  }

 
  taxWorkers.push(newWorkerId);

  bot.sendMessage(chatId, `✅ Пользователь с ID ${newWorkerId} успешно добавлен в список работников налоговой.`);
  bot.sendMessage(newWorkerId, '✅ Вас добавили в список работников налоговой. Теперь вы можете использовать соответствующие команды.');
});



// Функция для загрузки данных из файла
function loadUsers() {
  if (fs.existsSync(usersFile)) {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data);
  } else {
    return { authorizedUsers: [], employees: [] }; // Если файл не существует
  }
}




bot.onText(/\/register (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1];

  if (users[chatId]) {
    bot.sendMessage(chatId, '✅ Вы уже зарегистрированы!');
  } else {
    
    if (!username.startsWith('@')) {
      bot.sendMessage(chatId, '🛑 Никнейм должен начинаться с символа "@". Пожалуйста, выберите другой никнейм.');
      return;
    }

   
    const isUsernameTaken = Object.values(users).some(user => user.username.toLowerCase() === username.toLowerCase());
    if (isUsernameTaken) {
      bot.sendMessage(chatId, `🛑 Имя "${username}" уже занято. Пожалуйста, выберите другое имя.`);
      return;
    }

    users[chatId] = { username, balance: 0 };
    saveData(usersFile, users);
    bot.sendMessage(chatId, `✅ Регистрация успешна! Добро пожаловать, ${username}. Список доступных команд: /help`);
  }
});


bot.onText(/\/fine/, (msg) => {
  if (!isTaxWorker(msg.chat.id)) {
    bot.sendMessage(msg.chat.id, '🛑 Эта команда доступна только работникам налоговой.');
    return;
  }
  bot.sendMessage(msg.chat.id, '🛑 Правильный формат команды: /fine <пользователь> <сумма> <причина>\nПример: /fine @username 100 Нарушение правил.');
});


bot.onText(/\/fine (@\w+) (\d+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  
  if (!isTaxWorker(chatId)) {
    bot.sendMessage(chatId, '');
    return;
  }

  const targetUsername = match[1];
  const amount = parseInt(match[2]);
  const reason = match[3];

  if (isNaN(amount) || amount <= 0) {
    bot.sendMessage(chatId, '🛑 Пожалуйста, укажите корректную сумму штрафа.');
    return;
  }

  
  const userId = Object.keys(users).find(id => users[id].username === targetUsername);

  if (!userId) {
    bot.sendMessage(chatId, `🛑 Пользователь с именем ${targetUsername} не найден. Проверьте имя и попробуйте снова.`);
    return;
  }

 
  if (!fines[userId]) fines[userId] = [];

 
  fines[userId].push({ amount, reason, date: new Date().toISOString(), paid: false });

  saveData(finesFile, fines);
  saveData(usersFile, users);

  bot.sendMessage(chatId, `🛑 Штраф для ${targetUsername} на сумму ${amount}ар успешно добавлен. Причина: ${reason}`);
  bot.sendMessage(userId, `✅ Вам был выписан штраф на сумму ${amount}ар. Причина: ${reason}. Текущий баланс: ${users[userId].balance}`);
});


// Функция для загрузки данных из файла
function loadUsers() {
  if (fs.existsSync(usersFile)) {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data); // Возвращаем объект
  } else {
    return {}; // Если файла нет, возвращаем пустой объект
  }
}


// Функция для загрузки данных из файла
function loadUsers() {
  if (fs.existsSync(usersFile)) {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data); // Возвращаем объект
  } else {
    return {}; // Если файла нет, возвращаем пустой объект
  }
}


// Функция для обработки команды /list
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '/list') {
    let response = "📋 **Список пользователей:**\n";

    if (Object.keys(users).length > 0) {
      Object.entries(users).forEach(([userId, userData]) => {
        response += `- ${userData.username} (ID: ${userId}, Баланс: ${userData.balance})\n`;
      });
    } else {
      response += "Нет данных.";
    }

    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  }
});


bot.onText(/\/pay (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const fineIndex = parseInt(match[1]);

  if (!users[chatId]) {
    bot.sendMessage(chatId, '🛑 Вы не зарегистрированы! Используйте команду /register <имя> для регистрации.');
    return;
  }

  const userFines = fines[chatId] || [];
  if (!userFines || userFines.length <= fineIndex) {
    bot.sendMessage(chatId, '');
    return;
  }

  const fine = userFines[fineIndex];

  if (fine.paid) {
    bot.sendMessage(chatId, '🛑 Этот штраф уже был оплачен.');
    return;
  }

  // Проверка баланса для оплаты штрафа
  if (users[chatId].balance >= fine.amount) {
    // Уменьшаем баланс пользователя и помечаем штраф как оплаченный
    users[chatId].balance -= fine.amount;
    fine.paid = true;

    // Сохраняем изменения
    saveData(usersFile, users);
    saveData(finesFile, fines);

    bot.sendMessage(chatId, `✅ Штраф на сумму ${fine.amount}ар успешно оплачен. Ваш новый баланс: ${users[chatId].balance}`);
  } else {
    bot.sendMessage(chatId, `🛑 У вас недостаточно средств для оплаты штрафа. Ваш баланс: ${users[chatId].balance}`);
  }
});

// Проверка баланса
bot.onText(/\/balance/, (msg) => {
  const chatId = msg.chat.id;

  if (users[chatId]) {
    bot.sendMessage(chatId, `✅ Ваш баланс: ${users[chatId].balance}`);
  } else {
    bot.sendMessage(chatId, '🛑 Вы не зарегистрированы! Используйте команду /register <имя> для регистрации.');
  }
});



function addFine(chatId, amount, reason) {
  if (!fines[chatId]) {
    fines[chatId] = [];
  }

  const fine = {
    amount,
    reason,
    paid: false,
    cancelled: false,
    createdAt: Date.now(),
    doubled: false, // Флаг, что штраф уже удвоен
    warned: false,  // Флаг, что предупреждение о суде уже отправлено
  };

  fines[chatId].push(fine);

  bot.sendMessage(chatId, `🚨 Вам выписан штраф на сумму ${amount} ар за: ${reason}.`);

  // Таймер для удвоения штрафа через минуту
  setTimeout(() => {
    if (!fine.paid && !fine.cancelled && !fine.doubled) {
      fine.amount *= 2; // Удвоение штрафа
      fine.doubled = true;

      bot.sendMessage(
        chatId,
        `⚠️ Ваш штраф увеличился в 2 раза! Теперь он составляет ${fine.amount} ар.`
      );
    }

    // Таймер для предупреждения о суде еще через минуту
    setTimeout(() => {
      if (!fine.paid && !fine.cancelled && fine.doubled && !fine.warned) {
        fine.warned = true;

        bot.sendMessage(
          chatId,
          `⚠️ Ваш штраф не был оплачен вовремя. Мы подаем дело в суд.`
        );
      }
    }, 60 * 1000); // 1 минута
  }, 60 * 1000); // 1 минута
}

// Функция для добавления штрафа

// Регистрация команды /archive
bot.onText(/\/archive/, (msg) => {
  const chatId = msg.chat.id;

  if (!users[chatId]) {
    bot.sendMessage(chatId, 'Вы не зарегистрированы! Используйте команду /register <имя> для регистрации.');
    return;
  }

  const userFines = fines[chatId] || [];
  const archiveList = userFines
    .filter((fine) => fine.paid || fine.cancelled)
    .map((fine, index) => {
      const status = fine.paid
        ? 'Оплачен'
        : fine.cancelled
        ? 'Аннулирован'
        : 'Неизвестно';

      return `Штраф ${index + 1}:\n` +
             `- Сумма: ${fine.amount} ар\n` +
             `- Причина: ${fine.reason || 'Не указана'}\n` +
             `- Статус: ${status}\n` +
             `- Дата: ${
               fine.paidAt ? new Date(fine.paidAt).toLocaleString() : 'Не указана'
             }\n\n`;
    });

  const response = archiveList.length > 0
    ? '📂 Архив штрафов:\n\n' + archiveList.join('')
    : '📂 У вас нет архивных штрафов.';

  bot.sendMessage(chatId, response);
});

// Регистрация команды /check_fines
bot.onText(/\/check_fines/, (msg) => {
  const chatId = msg.chat.id;

  // Проверка, зарегистрирован ли пользователь
  if (!users[chatId]) {
    bot.sendMessage(chatId, ' 🛑 Вы не зарегистрированы в системе.');
    return;
  }

  const userFines = fines[chatId];

  // Проверка, есть ли у пользователя штрафы
  if (!userFines || userFines.length === 0) {
    bot.sendMessage(chatId, '✅ У вас нет штрафов.');
    return;
  }

  let finesList = '✅ Ваши текущие штрафы:\n\n';

  // Отображаем только неоплаченные и активные штрафы
  userFines.forEach((fine, index) => {
    if (!fine.paid && !fine.cancelled) {
      // Проверяем, может ли штраф быть оплачен
      if (users[chatId].balance >= fine.amount) {
        // Достаточно средств для оплаты штрафа
        users[chatId].balance -= fine.amount; // Вычитаем сумму
        fine.paid = true; // Обновляем статус на "Оплачен"
        fine.paidAt = Date.now(); // Фиксируем время оплаты
      }

      // Добавляем информацию о штрафе в список
      finesList += `Штраф ${index + 1}:\n` +
                   `- Сумма: ${fine.amount} ар\n` +
                   `- Причина: ${fine.reason || 'Не указана'}\n` +
                   `- Статус: ${
                     fine.paid ? 'Оплачен' : 'Ожидает оплаты (недостаточно средств)'
                   }\n\n`;
    }
  });

  if (finesList === '✅ Ваши текущие штрафы:\n\n') {
    finesList = '✅ У вас нет неоплаченных штрафов.';
  }

  // Сохраняем изменения в данных
  saveData(finesFile, fines);


  // Функция для обработки пополнения баланса
  function handleBalanceUpdate(chatId, addedAmount) {
    users[chatId].balance += addedAmount; // Пополняем баланс

    userFines.forEach((fine) => {
      if (!fine.paid && !fine.cancelled && users[chatId].balance >= fine.amount) {
        // Списываем штраф из пополненного баланса
        users[chatId].balance -= fine.amount;
        fine.paid = true;
        fine.paidAt = Date.now(); // Фиксируем время оплаты
      }
    });

    bot.sendMessage(chatId, `Ваш баланс: ${users[chatId].balance} ар.`);
  }

  // Функция для обработки пополнения баланса
  function handleBalanceUpdate(chatId, addedAmount) {
    users[chatId].balance += addedAmount; // Пополняем баланс

    userFines.forEach((fine) => {
      if (!fine.paid && !fine.cancelled && users[chatId].balance >= fine.amount) {
        // Списываем штраф из пополненного баланса
        users[chatId].balance -= fine.amount;
        fine.paid = true;
        fine.paidAt = Date.now(); // Фиксируем время оплаты
      }
    });

    bot.sendMessage(chatId, `✅ Ваш баланс: ${users[chatId].balance} ар.`);
  }

  // Вывод баланса и штрафов
  finesList += `✅ Ваш текущий баланс: ${users[chatId].balance} ар.`;
  bot.sendMessage(chatId, finesList);
});

// Файл для хранения заявок на оплату
const paymentsFile = './payments.json';
let payments = loadData(paymentsFile) || [];

// Команда для создания заявки на оплату с возможной причиной
bot.onText(/\/pay (\d+)(?: (.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const amount = parseInt(match[1]);
  const comment = match[2] || 'Оплата штрафа'; // Если причина не указана, ставим "Оплата штрафа"

  if (isNaN(amount) || amount <= 0) {
    bot.sendMessage(chatId, '🛑 Пожалуйста, укажите корректную сумму для оплаты.');
    return;
  }

  if (!users[chatId]) {
    bot.sendMessage(chatId, '🛑 Вы не зарегистрированы! Используйте команду /register <имя> для регистрации.');
    return;
  }

  // Создание заявки на оплату
  const paymentRequest = {
    userId: chatId,
    username: users[chatId].username,
    amount,
    comment,
    date: new Date().toISOString(),
    status: 'pending' // статус "ожидание подтверждения"
  };

  payments.push(paymentRequest);
  saveData(paymentsFile, payments);

  bot.sendMessage(chatId, `✅ Заявка на оплату на сумму ${amount} создана. Ожидайте подтверждения.`);
  notifyTaxWorkers(paymentRequest);  // Уведомление для налоговых работников
});
// Команда /cancel_fine для аннулирования штрафа (только для работников налоговой)
bot.onText(/\/cancel_fine (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const fineIndex = parseInt(match[1]);

  // Проверка, является ли пользователь работником налоговой
  if (!isTaxWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только работникам налоговой.');
    return;
  }

  // Находим ID пользователя по индексу штрафа
  let targetUserId;
  for (const userId in fines) {
    if (fines[userId][fineIndex]) {
      targetUserId = userId;
      break;
    }
  }

  if (!targetUserId || !fines[targetUserId] || !fines[targetUserId][fineIndex]) {
    bot.sendMessage(chatId, '🛑 Штраф с таким индексом не найден.');
    return;
  }

  const fine = fines[targetUserId][fineIndex];

  // Проверка, не был ли уже отменён штраф
  if (fine.cancelled) {
    bot.sendMessage(chatId, `🛑 Этот штраф уже был отменён.`);
    return;
  }

  // Аннулирование штрафа
  fine.cancelled = true;

  // Возвращаем сумму штрафа на баланс пользователя
  users[targetUserId].balance += fine.amount;

  // Сохраняем изменения в файлах
  saveData(finesFile, fines);
  saveData(usersFile, users);

  // Уведомление работников налоговой и пользователя
  bot.sendMessage(chatId, `🛑 Штраф для ${users[targetUserId].username} на сумму ${fine.amount} был успешно аннулирован.`);
  bot.sendMessage(targetUserId, `✅ Ваш штраф на сумму ${fine.amount} был аннулирован. Ваш новый баланс: ${users[targetUserId].balance}`);
});
// Подсказка для использования /cancel_fine (если команда была написана неверно)
bot.onText(/\/cancel_fine/, (msg) => {
  const chatId = msg.chat.id;

  if (!isTaxWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только работникам налоговой.');
    return;
  }

  bot.sendMessage(chatId, '🛑 Используйте команду в следующем формате: /cancel_fine <индекс штрафа>\nПример: /cancel_fine 2\nКоманда отменит штраф с указанным индексом.');
});
// Функция для уведомления работников налоговой о новой заявке
function notifyTaxWorkers(paymentRequest) {
  taxWorkers.forEach(workerId => {
    bot.sendMessage(workerId, `🛑 Новая заявка на оплату:\n\nПользователь: ${paymentRequest.username}\nСумма: ${paymentRequest.amount}ар\nКомментарий: ${paymentRequest.comment}\nДата: ${paymentRequest.date}\n\nПодтвердите её командой /approve ${payments.length - 1}`);
  });
}

// Подтверждение оплаты заявки (только для работников налоговой)
bot.onText(/\/approve (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const paymentIndex = parseInt(match[1]);

  if (!isTaxWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только работникам налоговой.');
    return;
  }

  if (isNaN(paymentIndex) || !payments[paymentIndex]) {
    bot.sendMessage(chatId, '🛑 Некорректный номер заявки.');
    return;
  }

  const payment = payments[paymentIndex];

  if (payment.status !== 'pending') {
    bot.sendMessage(chatId, '🛑 Эта заявка уже обработана.');
    return;
  }

  // Подтверждение оплаты и обновление баланса
  users[payment.userId].balance += payment.amount;
  payment.status = 'approved'; // Обновляем статус заявки

  saveData(paymentsFile, payments);
  saveData(usersFile, users);

  bot.sendMessage(chatId, `🛑 Оплата на сумму ${payment.amount} для пользователя ${payment.username} подтверждена.`);
  bot.sendMessage(payment.userId, `✅ Ваша заявка на оплату на сумму ${payment.amount} была подтверждена!`);
});
