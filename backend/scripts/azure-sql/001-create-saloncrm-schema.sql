set nocount on;

if object_id(N'dbo.tenants', N'U') is null
begin
  create table dbo.tenants (
    id uniqueidentifier not null constraint df_tenants_id default newid(),
    name nvarchar(255) not null,
    slug nvarchar(255) null,
    status nvarchar(32) not null constraint df_tenants_status default N'active',
    owner_user_id uniqueidentifier null,
    created_at datetimeoffset not null constraint df_tenants_created_at default sysdatetimeoffset(),
    updated_at datetimeoffset not null constraint df_tenants_updated_at default sysdatetimeoffset(),
    deleted_at datetimeoffset null,
    [__v] int not null constraint df_tenants_version default 0,
    created_by uniqueidentifier null,
    updated_by uniqueidentifier null,
    deleted_by uniqueidentifier null,
    [plan] nvarchar(64) not null constraint df_tenants_plan default N'trial',
    is_active bit not null constraint df_tenants_is_active default 1,
    constraint pk_tenants primary key (id),
    constraint ck_tenants_status check (status in (N'active', N'suspended', N'cancelled')),
    constraint ck_tenants_deleted_at_after_created_at check (deleted_at is null or deleted_at >= created_at),
    constraint ck_tenants_deleted_by_requires_deleted_at check (deleted_by is null or deleted_at is not null),
    constraint ck_tenants_name_not_blank check (len(ltrim(rtrim(name))) > 0)
  );
end;

if object_id(N'dbo.users', N'U') is null
begin
  create table dbo.users (
    id uniqueidentifier not null constraint df_users_id default newid(),
    email nvarchar(320) not null,
    name nvarchar(255) not null,
    password_hash nvarchar(255) not null,
    role nvarchar(32) not null,
    created_at datetimeoffset not null constraint df_users_created_at default sysdatetimeoffset(),
    updated_at datetimeoffset not null constraint df_users_updated_at default sysdatetimeoffset(),
    [__v] int not null constraint df_users_version default 0,
    deleted_at datetimeoffset null,
    created_by uniqueidentifier null,
    updated_by uniqueidentifier null,
    deleted_by uniqueidentifier null,
    account_status nvarchar(32) not null constraint df_users_account_status default N'active',
    email_verified_at datetimeoffset null,
    password_changed_at datetimeoffset null,
    last_login_at datetimeoffset null,
    failed_login_attempts int not null constraint df_users_failed_login_attempts default 0,
    locked_until datetimeoffset null,
    platform_role nvarchar(32) not null constraint df_users_platform_role default N'user',
    tenant_id uniqueidentifier null,
    must_change_password bit not null constraint df_users_must_change_password default 0,
    constraint pk_users primary key (id),
    constraint ck_users_role check (role in (N'owner', N'staff', N'admin', N'dev')),
    constraint ck_users_account_status check (account_status in (N'active', N'inactive', N'locked')),
    constraint ck_users_deleted_at_after_created_at check (deleted_at is null or deleted_at >= created_at),
    constraint ck_users_deleted_by_requires_deleted_at check (deleted_by is null or deleted_at is not null),
    constraint fk_users_tenant_id_tenants_id foreign key (tenant_id) references dbo.tenants(id) on delete set null,
    constraint fk_users_created_by_users_id foreign key (created_by) references dbo.users(id),
    constraint fk_users_updated_by_users_id foreign key (updated_by) references dbo.users(id),
    constraint fk_users_deleted_by_users_id foreign key (deleted_by) references dbo.users(id)
  );
end;

if object_id(N'dbo.clients', N'U') is null
begin
  create table dbo.clients (
    id uniqueidentifier not null constraint df_clients_id default newid(),
    name nvarchar(255) not null,
    phone nvarchar(64) null,
    notes nvarchar(max) not null constraint df_clients_notes default N'',
    is_active bit not null constraint df_clients_is_active default 1,
    created_at datetimeoffset not null constraint df_clients_created_at default sysdatetimeoffset(),
    updated_at datetimeoffset not null constraint df_clients_updated_at default sysdatetimeoffset(),
    [__v] int not null constraint df_clients_version default 0,
    tenant_id uniqueidentifier not null,
    deleted_at datetimeoffset null,
    created_by uniqueidentifier null,
    updated_by uniqueidentifier null,
    deleted_by uniqueidentifier null,
    constraint pk_clients primary key (id),
    constraint ck_clients_deleted_at_after_created_at check (deleted_at is null or deleted_at >= created_at),
    constraint ck_clients_deleted_by_requires_deleted_at check (deleted_by is null or deleted_at is not null),
    constraint fk_clients_tenant_id_tenants_id foreign key (tenant_id) references dbo.tenants(id)
  );
end;

if object_id(N'dbo.services', N'U') is null
begin
  create table dbo.services (
    id uniqueidentifier not null constraint df_services_id default newid(),
    name nvarchar(255) not null,
    category nvarchar(255) not null,
    price float not null,
    is_active bit not null constraint df_services_is_active default 1,
    created_at datetimeoffset not null constraint df_services_created_at default sysdatetimeoffset(),
    updated_at datetimeoffset not null constraint df_services_updated_at default sysdatetimeoffset(),
    [__v] int not null constraint df_services_version default 0,
    tenant_id uniqueidentifier not null,
    deleted_at datetimeoffset null,
    created_by uniqueidentifier null,
    updated_by uniqueidentifier null,
    deleted_by uniqueidentifier null,
    constraint pk_services primary key (id),
    constraint ck_services_price_non_negative check (price >= 0),
    constraint ck_services_deleted_at_after_created_at check (deleted_at is null or deleted_at >= created_at),
    constraint ck_services_deleted_by_requires_deleted_at check (deleted_by is null or deleted_at is not null),
    constraint fk_services_tenant_id_tenants_id foreign key (tenant_id) references dbo.tenants(id)
  );
end;

if object_id(N'dbo.expenses', N'U') is null
begin
  create table dbo.expenses (
    id uniqueidentifier not null constraint df_expenses_id default newid(),
    [date] datetimeoffset not null,
    category nvarchar(255) not null,
    amount float not null,
    notes nvarchar(max) not null constraint df_expenses_notes default N'',
    created_at datetimeoffset not null constraint df_expenses_created_at default sysdatetimeoffset(),
    updated_at datetimeoffset not null constraint df_expenses_updated_at default sysdatetimeoffset(),
    [__v] int not null constraint df_expenses_version default 0,
    tenant_id uniqueidentifier not null,
    deleted_at datetimeoffset null,
    created_by uniqueidentifier null,
    updated_by uniqueidentifier null,
    deleted_by uniqueidentifier null,
    constraint pk_expenses primary key (id),
    constraint ck_expenses_amount_non_negative check (amount >= 0),
    constraint ck_expenses_deleted_at_after_created_at check (deleted_at is null or deleted_at >= created_at),
    constraint ck_expenses_deleted_by_requires_deleted_at check (deleted_by is null or deleted_at is not null),
    constraint fk_expenses_tenant_id_tenants_id foreign key (tenant_id) references dbo.tenants(id)
  );
end;

if object_id(N'dbo.app_settings', N'U') is null
begin
  create table dbo.app_settings (
    id uniqueidentifier not null constraint df_app_settings_id default newid(),
    [key] nvarchar(255) not null,
    value nvarchar(max) not null,
    created_at datetimeoffset not null constraint df_app_settings_created_at default sysdatetimeoffset(),
    updated_at datetimeoffset not null constraint df_app_settings_updated_at default sysdatetimeoffset(),
    [__v] int not null constraint df_app_settings_version default 0,
    tenant_id uniqueidentifier not null,
    deleted_at datetimeoffset null,
    created_by uniqueidentifier null,
    updated_by uniqueidentifier null,
    deleted_by uniqueidentifier null,
    constraint pk_app_settings primary key (id),
    constraint ck_app_settings_deleted_at_after_created_at check (deleted_at is null or deleted_at >= created_at),
    constraint ck_app_settings_deleted_by_requires_deleted_at check (deleted_by is null or deleted_at is not null),
    constraint fk_app_settings_tenant_id_tenants_id foreign key (tenant_id) references dbo.tenants(id)
  );
end;

if object_id(N'dbo.appointments', N'U') is null
begin
  create table dbo.appointments (
    id uniqueidentifier not null constraint df_appointments_id default newid(),
    client_id uniqueidentifier not null,
    title nvarchar(255) not null,
    appointment_start datetimeoffset not null,
    appointment_end datetimeoffset not null,
    status nvarchar(32) not null,
    notes nvarchar(max) not null constraint df_appointments_notes default N'',
    created_at datetimeoffset not null constraint df_appointments_created_at default sysdatetimeoffset(),
    updated_at datetimeoffset not null constraint df_appointments_updated_at default sysdatetimeoffset(),
    [__v] int not null constraint df_appointments_version default 0,
    category nvarchar(255) not null constraint df_appointments_category default N'general',
    tenant_id uniqueidentifier not null,
    deleted_at datetimeoffset null,
    created_by uniqueidentifier null,
    updated_by uniqueidentifier null,
    deleted_by uniqueidentifier null,
    constraint pk_appointments primary key (id),
    constraint ck_appointments_status_valid check (status in (N'scheduled', N'completed', N'cancelled')),
    constraint ck_appointments_time_order check (appointment_end > appointment_start),
    constraint ck_appointments_deleted_at_after_created_at check (deleted_at is null or deleted_at >= created_at),
    constraint ck_appointments_deleted_by_requires_deleted_at check (deleted_by is null or deleted_at is not null),
    constraint fk_appointments_client_id_clients_id foreign key (client_id) references dbo.clients(id) on delete cascade,
    constraint fk_appointments_tenant_id_tenants_id foreign key (tenant_id) references dbo.tenants(id)
  );
end;

if object_id(N'dbo.visits', N'U') is null
begin
  create table dbo.visits (
    id uniqueidentifier not null constraint df_visits_id default newid(),
    client_id uniqueidentifier not null,
    visit_date datetimeoffset not null,
    total_amount float not null,
    notes nvarchar(max) not null constraint df_visits_notes default N'',
    is_deleted bit not null constraint df_visits_is_deleted default 0,
    created_at datetimeoffset not null constraint df_visits_created_at default sysdatetimeoffset(),
    updated_at datetimeoffset not null constraint df_visits_updated_at default sysdatetimeoffset(),
    [__v] int not null constraint df_visits_version default 0,
    tenant_id uniqueidentifier not null,
    deleted_at datetimeoffset null,
    created_by uniqueidentifier null,
    updated_by uniqueidentifier null,
    deleted_by uniqueidentifier null,
    constraint pk_visits primary key (id),
    constraint ck_visits_total_amount_non_negative check (total_amount >= 0),
    constraint ck_visits_deleted_at_after_created_at check (deleted_at is null or deleted_at >= created_at),
    constraint ck_visits_deleted_by_requires_deleted_at check (deleted_by is null or deleted_at is not null),
    constraint fk_visits_client_id_clients_id foreign key (client_id) references dbo.clients(id) on delete cascade,
    constraint fk_visits_tenant_id_tenants_id foreign key (tenant_id) references dbo.tenants(id)
  );
end;

if object_id(N'dbo.visit_services', N'U') is null
begin
  create table dbo.visit_services (
    id uniqueidentifier not null constraint df_visit_services_id default newid(),
    legacy_id int null,
    visit_id uniqueidentifier not null,
    service_id uniqueidentifier null,
    position int not null,
    name nvarchar(255) not null,
    base_price float not null,
    charged_price float not null,
    line_total float not null,
    tenant_id uniqueidentifier not null,
    created_at datetimeoffset not null constraint df_visit_services_created_at default sysdatetimeoffset(),
    updated_at datetimeoffset not null constraint df_visit_services_updated_at default sysdatetimeoffset(),
    deleted_at datetimeoffset null,
    [__v] int not null constraint df_visit_services_version default 0,
    created_by uniqueidentifier null,
    updated_by uniqueidentifier null,
    deleted_by uniqueidentifier null,
    constraint pk_visit_services primary key (id),
    constraint ck_visit_services_base_price_non_negative check (base_price >= 0),
    constraint ck_visit_services_charged_price_non_negative check (charged_price >= 0),
    constraint ck_visit_services_line_total_non_negative check (line_total >= 0),
    constraint ck_visit_services_deleted_at_after_created_at check (deleted_at is null or deleted_at >= created_at),
    constraint ck_visit_services_deleted_by_requires_deleted_at check (deleted_by is null or deleted_at is not null),
    constraint fk_visit_services_visit_id_visits_id foreign key (visit_id) references dbo.visits(id) on delete cascade,
    constraint fk_visit_services_service_id_services_id foreign key (service_id) references dbo.services(id) on delete set null,
    constraint fk_visit_services_tenant_id_tenants_id foreign key (tenant_id) references dbo.tenants(id)
  );
end;

if not exists (select 1 from sys.indexes where name = N'users_email_unique' and object_id = object_id(N'dbo.users'))
  create unique index users_email_unique on dbo.users(email);

if not exists (select 1 from sys.indexes where name = N'tenants_slug_unique' and object_id = object_id(N'dbo.tenants'))
  create unique index tenants_slug_unique on dbo.tenants(slug) where slug is not null;

if not exists (select 1 from sys.indexes where name = N'app_settings_tenant_key_unique' and object_id = object_id(N'dbo.app_settings'))
  create unique index app_settings_tenant_key_unique on dbo.app_settings(tenant_id, [key]);

if not exists (select 1 from sys.indexes where name = N'visit_services_visit_position_unique' and object_id = object_id(N'dbo.visit_services'))
  create unique index visit_services_visit_position_unique on dbo.visit_services(visit_id, position);

if not exists (select 1 from sys.indexes where name = N'users_tenant_idx' and object_id = object_id(N'dbo.users'))
  create index users_tenant_idx on dbo.users(tenant_id);

if not exists (select 1 from sys.indexes where name = N'clients_tenant_idx' and object_id = object_id(N'dbo.clients'))
  create index clients_tenant_idx on dbo.clients(tenant_id);

if not exists (select 1 from sys.indexes where name = N'services_tenant_idx' and object_id = object_id(N'dbo.services'))
  create index services_tenant_idx on dbo.services(tenant_id);

if not exists (select 1 from sys.indexes where name = N'expenses_tenant_idx' and object_id = object_id(N'dbo.expenses'))
  create index expenses_tenant_idx on dbo.expenses(tenant_id);

if not exists (select 1 from sys.indexes where name = N'app_settings_tenant_idx' and object_id = object_id(N'dbo.app_settings'))
  create index app_settings_tenant_idx on dbo.app_settings(tenant_id);

if not exists (select 1 from sys.indexes where name = N'appointments_tenant_idx' and object_id = object_id(N'dbo.appointments'))
  create index appointments_tenant_idx on dbo.appointments(tenant_id);

if not exists (select 1 from sys.indexes where name = N'visits_tenant_idx' and object_id = object_id(N'dbo.visits'))
  create index visits_tenant_idx on dbo.visits(tenant_id);

if not exists (select 1 from sys.indexes where name = N'visit_services_tenant_idx' and object_id = object_id(N'dbo.visit_services'))
  create index visit_services_tenant_idx on dbo.visit_services(tenant_id);

if not exists (select 1 from sys.foreign_keys where name = N'fk_tenants_owner_user_id_users_id')
  alter table dbo.tenants add constraint fk_tenants_owner_user_id_users_id foreign key (owner_user_id) references dbo.users(id) on delete set null;
