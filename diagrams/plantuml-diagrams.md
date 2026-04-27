# RepairFlow — Диаграммы PlantUML

## 12 диаграмм для 6 прецедентов

Для каждого прецедента:
- **Диаграмма пригодности** (Robustness-диаграмма: актёр → boundary → control → entity)
- **Диаграмма последовательности** (Sequence diagram с компонентами системы)

---

# Прецедент 1: Создание заявки на ремонт

## Диаграмма пригодности

```plantuml
@startuml
skinparam defaultFontSize 13
skinparam defaultFontName "Segoe UI"
skinparam packageStyle rectangle
top to bottom direction

actor "Клиент" as Client

boundary "Страница создания\nзаявки" as NewRequestPage
boundary "Компонент загрузки\nфайлов" as FileUpload

control "Валидация данных\nзаявки" as ValidateRequest
control "Конвертация\nфайлов" as ConvertFiles
control "Создание записи\nзаявки" as CreateRequest
control "Сохранение\nвложений" as SaveAttachments
control "Отправка\nуведомления" as SendNotification

entity "Фасад БД" as DBFacade

Client --> NewRequestPage
NewRequestPage ..> FileUpload : содержит
NewRequestPage --> ValidateRequest
ValidateRequest --> CreateRequest
FileUpload --> ConvertFiles
ConvertFiles --> SaveAttachments
CreateRequest --> DBFacade
SaveAttachments --> DBFacade
CreateRequest --> SendNotification
SendNotification --> Client
@enduml
```

## Диаграмма последовательности

```plantuml
@startuml
skinparam defaultFontSize 12
skinparam defaultFontName "Segoe UI"
skinparam lifelinestrategy solid

actor "Клиент" as Client
participant "NewRequestPage" as Page
participant "RequestRouter" as Router
participant "Фасад БД" as DB

Client -> Page : Заполнить форму, нажать\n«Создать заявку»
Page -> Router : post_create_request(dto, files)

Router -> DB : SELECT COUNT(*) FROM requests\nWHERE client_id = ?
DB --> Router : client_request_count

Router -> DB : Проверка (machine_name,\ndescription, serial_number)
DB --> Router : ValidationResult

alt Ошибка валидации
    Router --> Page : ErrorResponse
    Page --> Client : Отображение ошибок\nв форме
else Валидация пройдена
    Router -> DB : INSERT INTO requests\n(client_id, machine_name,\nmachine_type, description,\nstatus, created_at)
    DB --> Router : request_id

    alt Есть файлы
        loop Для каждого файла
            Router -> Router : FileReader.readAsDataURL()\nконвертация в data URL
            Router -> DB : INSERT INTO attachments\n(request_id, file_name,\nfile_type, file_size, url)
            DB --> Router : attachment_id
        end
    end

    Router -> DB : CREATE notifications\n(for manager, about new request)
    DB --> Router : success

    Router --> Page : RequestObject
    Page --> Client : Редирект на\n/requests/{request_id}
end
@enduml
```

---

# Прецедент 2: Назначение техника на заявку

## Диаграмма пригодности

```plantuml
@startuml
skinparam defaultFontSize 13
skinparam defaultFontName "Segoe UI"
skinparam packageStyle rectangle
top to bottom direction

actor "Менеджер" as Manager

boundary "Страница\nзаявок" as RequestsPage
boundary "Модальное окно\nназначения" as AssignModal
boundary "Список техников" as TechList

control "Проверка статуса\nзаявки" as CheckStatus
control "Назначение\nтехника" as AssignTechnician
control "Обновление\nстатуса" as UpdateStatus
control "Рассылка\nоповещений" as SendNotifications

entity "Фасад БД" as DBFacade

Manager --> RequestsPage
RequestsPage --> AssignModal
AssignModal --> TechList
TechList --> CheckStatus
CheckStatus --> DBFacade
CheckStatus --> AssignTechnician
AssignTechnician --> DBFacade
AssignTechnician --> UpdateStatus
UpdateStatus --> DBFacade
UpdateStatus --> SendNotifications
SendNotifications --> Manager
@enduml
```

## Диаграмма последовательности

```plantuml
@startuml
skinparam defaultFontSize 12
skinparam defaultFontName "Segoe UI"
skinparam lifelinestrategy solid

actor "Менеджер" as Manager
participant "RequestsPage" as Page
participant "AssignModal" as Modal
participant "RequestRouter" as Router
participant "Фасад БД" as DB

Manager -> Page : Открыть «Все заявки»
Page -> Router : get_requests(status, search)
Router -> DB : SELECT * FROM requests\nORDER BY created_at DESC
DB --> Router : List[RequestDTO]
Router --> Page : List[RequestDTO]
Page --> Manager : Таблица заявок

Manager -> Page : Нажать «Назначить»\nу заявки {request_id}
Page -> Modal : open(request_id)
Modal -> Router : get_technicians()
Router -> DB : SELECT * FROM users\nWHERE role = 'technician'
DB --> Router : List[TechnicianDTO]
Router --> Modal : List[TechnicianDTO]
Modal --> Manager : Dropdown со списком техников

Manager -> Modal : Выбрать техника\n{technician_id}, нажать «Назначить»
Modal -> Router : assign_technician(request_id,\ntechnician_id)

Router -> DB : SELECT status, assigned_to\nFROM requests WHERE id = ?
DB --> Router : RequestContext(status, assigned_to)

alt Заявка уже назначена
    Router --> Modal : ErrorResponse\n«Техник уже назначен»
    Modal --> Manager : Сообщение об ошибке
else Успешное назначение
    Router -> DB : UPDATE requests SET\nassigned_to = ?,\nassigned_technician_name = ?,\nstatus = 'in_progress',\nupdated_at = NOW()\nWHERE id = ?
    DB --> Router : rows_affected

    Router -> DB : INSERT INTO audit_log\n(request_id, action,\nold_status, new_status,\nperformed_by, created_at)
    DB --> Router : audit_id

    Router -> DB : CREATE notifications\n(for technician, about new assignment)
    DB --> Router : success

    Router --> Modal : AssignmentObject
    Modal --> Page : Refresh list
    Page --> Manager : Обновлённая таблица,\ntoast «Техник назначен»
end
@enduml
```

---

# Прецедент 3: Обновление статуса ремонта

## Диаграмма пригодности

```plantuml
@startuml
skinparam defaultFontSize 13
skinparam defaultFontName "Segoe UI"
skinparam packageStyle rectangle
top to bottom direction

actor "Техник" as Technician
actor "Менеджер" as Manager

boundary "Детальная страница\nзаявки" as DetailPage
boundary "Модальное окно\nстатуса" as StatusModal

control "Загрузка данных\nзаявки" as LoadRequest
control "Валидация перехода\nстатуса" as ValidateTransition
control "Обновление\nстатуса" as UpdateStatus
control "Запись в журнал\nаудита" as LogAudit
control "Рассылка\nоповещений" as SendNotifications

entity "Фасад БД" as DBFacade

Technician --> DetailPage
Manager --> DetailPage
DetailPage --> StatusModal
StatusModal --> LoadRequest
LoadRequest --> DBFacade
LoadRequest --> ValidateTransition
ValidateTransition --> DBFacade
ValidateTransition --> UpdateStatus
UpdateStatus --> DBFacade
UpdateStatus --> LogAudit
LogAudit --> DBFacade
UpdateStatus --> SendNotifications
SendNotifications --> Technician
SendNotifications --> Manager
@enduml
```

## Диаграмма последовательности 3a: Просмотр деталей заявки

```plantuml
@startuml
skinparam defaultFontSize 12
skinparam defaultFontName "Segoe UI"
skinparam lifelinestrategy solid

actor "Техник/Менеджер" as User
participant "DetailPage" as Page
participant "RequestRouter" as Router
participant "Фасад БД" as DB

User -> Page : Открыть заявку {request_id}
Page -> Router : get_request_detail(request_id)

Router -> DB : Загрузка заявки с комментариями,\nаудитом и вложениями
DB --> Router : DetailDTO\n(request, comments, audit, attachments)

Router --> Page : DetailObject
Page --> User : Вкладки «Обзор»,\n«Комментарии», «История»
@enduml
```

## Диаграмма последовательности 3b: Обновление статуса заявки

```plantuml
@startuml
skinparam defaultFontSize 12
skinparam defaultFontName "Segoe UI"
skinparam lifelinestrategy solid

actor "Техник/Менеджер" as User
participant "DetailPage" as Page
participant "StatusModal" as Modal
participant "RequestRouter" as Router
participant "Фасад БД" as DB

User -> Page : Нажать «Обновить статус»
Page -> Modal : open(request.status)

Router -> DB : SELECT transitions[current_status]\nFROM status_config
DB --> Router : available_transitions[]
Router --> Modal : Доступные переходы
Modal --> User : Кнопки доступных статусов

User -> Modal : Выбрать статус «{new_status}»

alt new_status == 'paused'
    Modal --> User : Показать поле «Комментарий»\n(обязательно, мин. 10 символов)
    User -> Modal : Ввести комментарий
end

User -> Modal : Нажать «Подтвердить»
Modal -> Router : update_status(request_id,\nnew_status, comment)

Router -> DB : SELECT status FROM requests\nWHERE id = ?
DB --> Router : current_status

Router -> Router : Проверка: new_status IN\nSTATUS_TRANSITIONS[current_status]

alt Переход недопустим
    Router --> Modal : ErrorResponse\n«Недопустимый переход»
    Modal --> User : Сообщение об ошибке
else new_status == 'paused'\nи комментарий пустой
    Router --> Modal : ErrorResponse\n«Комментарий обязателен»
    Modal --> User : Сообщение об ошибке
else Успешная валидация
    Router -> DB : UPDATE requests SET\nstatus = ?, updated_at = NOW()\nWHERE id = ?
    DB --> Router : rows_affected

    Router -> DB : INSERT INTO audit_log\n(request_id, action = 'status_change',\nold_status, new_status,\ncomment, performed_by,\ncreated_at)
    DB --> Router : audit_id

    Router -> DB : CREATE notifications\n(for client, status changed)
    DB --> Router : success

    Router --> Modal : StatusUpdateObject
    Modal --> Page : Refresh detail
    Page --> User : Обновлённый статус,\ntoast «Статус обновлён»
end
@enduml
```

---

# Прецедент 4: Добавление комментария

## Диаграмма пригодности

```plantuml
@startuml
skinparam defaultFontSize 13
skinparam defaultFontName "Segoe UI"
skinparam packageStyle rectangle
top to bottom direction

actor "Пользователь" as User

boundary "Вкладка\nкомментариев" as CommentsTab
boundary "Форма ввода\nкомментария" as CommentForm

control "Валидация\nтекста" as ValidateComment
control "Проверка прав\nдоступа" as CheckAccess
control "Создание\nкомментария" as CreateComment
control "Отправка\nуведомления" as SendNotification

entity "Фасад БД" as DBFacade

User --> CommentsTab
CommentsTab --> CommentForm
CommentForm --> ValidateComment
ValidateComment --> CheckAccess
CheckAccess --> DBFacade
CheckAccess --> CreateComment
CreateComment --> DBFacade
CreateComment --> SendNotification
SendNotification --> User
@enduml
```

## Диаграмма последовательности

```plantuml
@startuml
skinparam defaultFontSize 12
skinparam defaultFontName "Segoe UI"
skinparam lifelinestrategy solid

actor "Клиент/Менеджер/Техник" as User
participant "DetailPage" as Page
participant "CommentsTab" as Tab
participant "CommentRouter" as Router
participant "Фасад БД" as DB

User -> Page : Открыть заявку {request_id}
Page -> Router : get_comments(request_id)
Router -> DB : SELECT * FROM comments\nWHERE request_id = ?\nORDER BY created_at ASC
DB --> Router : List[CommentDTO]

alt User.role == 'client'
    Router -> Router : Фильтрация:\nWHERE is_internal = FALSE
end

Router --> Page : List[CommentDTO]
Page --> User : Список комментариев\n(аватар, роль, текст, дата)

User -> Tab : Ввести текст, нажать «Отправить»
Tab -> Router : add_comment(request_id,\nauthor_id, body, is_internal)

Router -> DB : SELECT * FROM users\nWHERE id = ?
DB --> Router : UserDTO

Router -> Router : Валидация:\nbody.length > 0

alt Текст пустой
    Router --> Tab : ErrorResponse\n«Комментарий не может быть пустым»
    Tab --> User : Сообщение об ошибке
else Валидация пройдена
    Router -> DB : INSERT INTO comments\n(request_id, author_id, body,\nis_internal, created_at)\nVALUES (?, ?, ?, FALSE, NOW())
    DB --> Router : comment_id

    Router -> DB : SELECT * FROM comments\nWHERE id = ?
    DB --> Router : CommentDTO

    alt is_internal == FALSE
        Router -> DB : CREATE notifications\n(for other participants)
        DB --> Router : success
    end

    Router --> Tab : CommentObject
    Tab -> Tab : prepend(comment)
    Tab --> User : Комментарий добавлен\nв начало списка
end
@enduml
```

---

# Прецедент 5: Загрузка и просмотр вложений

## Диаграмма пригодности

```plantuml
@startuml
skinparam defaultFontSize 13
skinparam defaultFontName "Segoe UI"
skinparam packageStyle rectangle
top to bottom direction

actor "Клиент" as Client

boundary "Страница деталей\nзаявки" as DetailPage
boundary "Секция\nфотографий" as PhotosSection

control "Загрузка списка\nвложений" as LoadAttachments
control "Предпросмотр\nфайла" as PreviewFile

entity "Фасад БД" as DBFacade

Client --> DetailPage
DetailPage --> PhotosSection
PhotosSection --> LoadAttachments
LoadAttachments --> DBFacade
LoadAttachments --> PreviewFile
PreviewFile --> Client
@enduml
```

## Диаграмма последовательности

```plantuml
@startuml
skinparam defaultFontSize 12
skinparam defaultFontName "Segoe UI"
skinparam lifelinestrategy solid

actor "Пользователь" as User
participant "RequestDetailPage" as Page
participant "AttachmentRouter" as Router
participant "Фасад БД" as DB

User -> Page : Открыть заявку {request_id}
Page -> Router : get_attachments(request_id)
Router -> DB : SELECT * FROM attachments\nWHERE request_id = ?\nORDER BY created_at ASC
DB --> Router : List[AttachmentDTO]
Router --> Page : List[AttachmentDTO]
Page --> User : Секция «Фотографии»\n(сетка превью 2-3 колонки)

alt Нет вложений
    Page --> User : Текст «Фото не прикреплены»
end

User -> Page : Кликнуть по превью
Page --> User : Открыть data URL\nв новой вкладке (<a target="_blank">)
@enduml
```

---

# Прецедент 6: Просмотр заявок с фильтрацией

## Диаграмма пригодности

```plantuml
@startuml
skinparam defaultFontSize 13
skinparam defaultFontName "Segoe UI"
skinparam packageStyle rectangle
top to bottom direction

actor "Клиент" as Client
actor "Менеджер" as Manager
actor "Техник" as Technician

boundary "Дашборд\nклиента" as ClientDashboard
boundary "Дашборд\nменеджера" as ManagerDashboard
boundary "Дашборд\nтехника" as TechDashboard
boundary "Страница\nзаявок" as RequestsPage
boundary "Панель фильтров\nи поиска" as FilterPanel

control "Загрузка\nстатистики" as LoadStats
control "Фильтрация\nи поиск\nзаявок" as FilterRequests
control "Пагинация" as Paginate

entity "Фасад БД" as DBFacade

Client --> ClientDashboard
Manager --> ManagerDashboard
Technician --> TechDashboard

ClientDashboard --> RequestsPage
ManagerDashboard --> RequestsPage
TechDashboard --> RequestsPage

RequestsPage --> FilterPanel
FilterPanel --> LoadStats
LoadStats --> DBFacade
FilterPanel --> FilterRequests
FilterRequests --> DBFacade
FilterRequests --> Paginate
@enduml
```

## Диаграмма последовательности

```plantuml
@startuml
skinparam defaultFontSize 12
skinparam defaultFontName "Segoe UI"
skinparam lifelinestrategy solid

actor "Пользователь" as User
participant "RequestsPage" as Page
participant "RequestRouter" as Router
participant "Фасад БД" as DB

== Загрузка списка заявок ==

User -> Page : Открыть «Все заявки»
activate Page
Page -> Router : get_requests(page, limit, role, user_id)

alt Клиент
    Router -> DB : SELECT * FROM requests\nWHERE client_id = ?\nORDER BY created_at DESC\nLIMIT ? OFFSET ?
else Менеджер
    Router -> DB : SELECT * FROM requests\nORDER BY created_at DESC\nLIMIT ? OFFSET ?
else Техник
    Router -> DB : SELECT * FROM requests\nWHERE assigned_to = ?\nORDER BY created_at DESC\nLIMIT ? OFFSET ?
end

DB --> Router : List[RequestDTO]
Router --> Page : PaginatedResponse
Page --> User : Таблица заявок\n(пагинация, статус, дата)
deactivate Page

== Поиск по заявкам ==

User -> Page : Ввести текст в поиск\n(debounce 400ms)
Page -> Router : get_requests({...query, search: text})
Router -> DB : WHERE machine_name ILIKE ?\nOR description ILIKE ?\nOR serial_number ILIKE ?
DB --> Router : PaginatedResult
Router --> Page : Отфильтрованные заявки
Page --> User : Обновлённая таблица

== Фильтрация по статусу ==

User -> Page : Выбрать фильтр по статусу
Page -> Router : get_requests({...query, status})
Router -> DB : WHERE status = ?
DB --> Router : PaginatedResult
Router --> Page : Отфильтрованные заявки
Page --> User : Таблица с фильтром

== Просмотр деталей ==

User -> Page : Нажать «Подробнее»\nу заявки {request_id}
Page --> User : Переход на\n/requests/{request_id}
@enduml
```

---

## Сводная таблица

| № | Прецедент | Диаграмма пригодности | Диаграмма последовательности |
|---|-----------|----------------------|------------------------------|
| 1 | Создание заявки на ремонт | `@startuml` (Robustness) | `@startuml` (Sequence) |
| 2 | Назначение техника | `@startuml` (Robustness) | `@startuml` (Sequence) |
| 3a | Просмотр деталей заявки | `@startuml` (Robustness) | `@startuml` (Sequence) |
| 3b | Обновление статуса ремонта | `@startuml` (Robustness) | `@startuml` (Sequence) |
| 4 | Добавление комментария | `@startuml` (Robustness) | `@startuml` (Sequence) |
| 5 | Загрузка вложений | `@startuml` (Robustness) | `@startuml` (Sequence) |
| 6 | Просмотр заявок с фильтрацией | `@startuml` (Robustness) | `@startuml` (Sequence) |
