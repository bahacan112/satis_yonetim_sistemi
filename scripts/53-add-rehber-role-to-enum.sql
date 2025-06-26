-- user_role ENUM tipine 'rehber' değerini ekler.
-- Bu, yeni rolün sistemde tanınmasını sağlar.
ALTER TYPE user_role ADD VALUE 'rehber' AFTER 'standart';
