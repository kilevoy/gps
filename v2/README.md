# Калькулятор профилей — v2

Полностью переработанная UI-версия. v1 живёт в `../gps/` и не затрагивается.

## Что изменилось по сравнению с v1

- Интерактивные SVG-схемы профилей ПП, ПГС, Z с подсветкой текущего размера.
- Новая дизайн-система: токены цвета, тёмная тема, аккуратная типографика.
- Раздельные поля для полок `a` и `B` Z-профиля (могут быть разными).
- Страница **«Методика»** с формулами, обозначениями, диапазонами и справочной таблицей.
- Расчёт `calculator.ts` переписан: единый источник толщин, явный признак `fitsInRoll`,
  локализованные ошибки, расширенные тесты (ПП, ПГС, симметричный и асимметричный Z).
- Объединены конфиги Vite/Vitest, `jsdom` для тестов компонентов.

## Запуск

```bash
npm install
npm run dev
```

## Проверка

```bash
npm test
npm run build
npm run lint
```

## Структура

```
src/
  App.tsx                   # шапка + табы (Калькулятор / Методика)
  main.tsx
  index.css                 # дизайн-система, тема, компонентные классы
  pages/
    CalculatorPage.tsx
    MethodologyPage.tsx
  components/
    ProfileSchemaSvg.tsx    # SVG-схемы с подсветкой размеров
    ParamsForm.tsx
    ResultPanel.tsx
    MetricCard.tsx
    WasteMap.tsx
    ThemeToggle.tsx
  lib/
    calculator.ts           # бизнес-логика
    calculator.test.ts
    constants.ts            # MATERIALS, RANGES, метки
    schema.ts               # zod-схема + дефолты
    formatters.ts
    wasteColors.ts
```
