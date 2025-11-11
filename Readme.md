# Вступительное задание

# Запуск приложения

## Разворачивание с помощью Docker

Для запуска приложения с использованием Docker выполните следующие шаги:

1. Клонируйте репозиторий:
   git clone <https://github.com/Mikhas3009/introduction-Qtim-.git>
2. Соберите и запустите контейнеры
   docker-compose up --build
3. Сервер доступен по адресу: http://localhost:3000

Документация (Swagger) доступна по адресу
http://localhost:3000/docs


# Стуктура проекта

```bash
src/
 ├── application/                         # Доменные модули (Nest)
 │   ├── auth/
 │   │   ├── controllers/                 # Контроллеры авторизации
 │   │   ├── services/                    # Бизнес-логика (AuthService)
 │   │   ├── dto/                         # DTO регистрации/логина
 │   │   ├── entities/                    # UserEntity
 │   │   ├── guards/                      # JwtGuard и пр.
 │   │   └── exceptions/                  # Исключения домена auth
 │   │
 │   └── articles/
 │       ├── controllers/                 # ArticlesController
 │       ├── services/                    # ArticlesService
 │       ├── dto/                         # DTO (list/show/store/update/delete)
 │       ├── entities/                    # ArticleEntity
 │       ├── helpers/                     # applyArticleFilters/sort/pagination
 │       ├── guards/                      # OwnsArticleGuard
 │       └── exceptions/                  # ArticleNotFoundException и др.
 │
 ├── core/                                # Общие компоненты
 │   ├── cache/                           # RedisCacheModule, декораторы @Cache()
 │   ├── enums/
 │   ├── interfaces/
 │
 ├── database/
 │   ├── database.module.ts               
 │   └── migrations/                      # Миграции
 │   └── data-source.ts                    
 │
 ├── main.ts                              # Точка входа (bootstrap Nest)
```
