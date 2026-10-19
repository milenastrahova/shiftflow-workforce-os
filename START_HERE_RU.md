# ShiftFlow — инструкция по запуску на Windows

## 1. Первый запуск

1. Распакуй ZIP (например, в `C:\Projects\shiftflow`). Не запускай проект прямо из архива.
2. Установи Node.js 22.12+ (LTS) с https://nodejs.org/ , если его ещё нет.
3. Открой папку проекта в VS Code.
4. Открой **Terminal → New Terminal** и введи:

```powershell
npm install
npm test
npm run dev
```

5. Открой в браузере `http://localhost:5173`.

Для остановки сервера нажми `Ctrl+C`.

> Если `npm` не распознаётся, перезапусти VS Code после установки Node.js.
>
> Если появляется ошибка PowerShell о запрете запуска `npm.ps1`, открой терминал **Command Prompt (cmd)**, а не PowerShell, и выполни те же команды.

## 2. Что показать работодателю

- Dashboard: статистика по покрытию смен, загрузке и стоимости.
- Schedule: недельное расписание, четыре свободные позиции и кнопка **Auto-fill**.
- Попытка назначить человека на пересекающуюся смену — приложение покажет причину отказа.
- Team members: добавление и редактирование сотрудника, ограничение часов, рабочие дни.
- Time off: заявки на отпуск, блокировка одобрения при существующих сменах.
- Reports: интерактивные графики и выгрузка в CSV.
- Settings: сохранение настроек и экспорт/импорт JSON.

## 3. Проверка перед публикацией

```powershell
npm test
npm run typecheck
npm run build
```

Если эти команды завершились без ошибок, можно публиковать.

## 4. GitHub

Создай новый **пустой** публичный репозиторий `shiftflow-workforce-os` на https://github.com/new (не ставь галочки «Add README», «Add .gitignore», «Choose a license»). Потом в терминале из папки проекта:

```powershell
git init
git add .
git commit -m "feat: ShiftFlow workforce operations dashboard"
git branch -M main
git remote add origin https://github.com/milenastrahova/shiftflow-workforce-os.git
git push -u origin main
```

При запросе авторизации используй вход GitHub в браузере или Git Credential Manager, **не присылай сюда свой пароль и токен**.

## 5. Бесплатный адрес приложения

Самый простой вариант: зайди на https://vercel.com/new , импортируй GitHub-репозиторий и укажи **Framework = Vite**, **Build command = npm run build**, **Output directory = dist**. GitHub-репозиторий содержит исходный код; ссылка Vercel даст работодателю рабочее демо в браузере.

**Ограничение:** это локальный браузерный прототип без сервера и регистрации. Данные каждого посетителя хранятся только в его браузере. У приложения нет настоящей серверной AI-модели — рекомендации формируются прозрачным алгоритмом.
