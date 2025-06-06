// Статусы для проекта и портфеля
export enum ETrackerProjectPortfolioStatus {
  DRAFT = 'draft', // Новый
  DRAFT2 = 'draft2', // Черновик
  IN_PROGRESS = 'in_progress', // В работе
  ACCORDING_TO_PLAN = 'according_to_plan', // По плану
  POSTPONED = 'postponed', // Отложен
  AT_RISK = 'at_risk', // Есть риски
  BLOCKED = 'blocked', // Заблокирован
  LAUNCHED = 'launched', // Завершен
  CANCELLED = 'cancelled', // Отменен
}

// Статусы только для цели
export enum ETrackerGoalStatus {
  DRAFT = 'draft', // Новая
  ACCORDING_TO_PLAN = 'according_to_plan', // По плану
  AT_RISK = 'at_risk', // Есть риски
  BLOCKED = 'blocked', // Заблокирована
  ACHIEVED = 'achieved', // Достигнута
  PARTIALLY_ACHIEVED = 'partially_achieved', // Частично достигнута
  NOT_ACHIEVED = 'not_achieved', // Не достигнута
  EXCEEDED = 'exceeded', // Превышена
  CANCELLED = 'cancelled', // Отменена
}

export enum ETrackerEntityType {
  PROJECT = 'project',
  GOAL = 'goal',
  PORTFOLIO = 'portfolio',
}
