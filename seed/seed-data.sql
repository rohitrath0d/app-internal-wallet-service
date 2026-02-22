-- assets
INSERT INTO assets (name) VALUES
('Gold Coins'),
('Diamonds'),
('Loyalty Points');

-- users
-- =========================
INSERT INTO users (name) VALUES
('Raju'),
('Baburao');

-- dummy USER WALLETS: Raju and baburao 
-- Raju wallet
INSERT INTO wallets (user_id, asset_id, wallet_type, balance)
VALUES
(1, 1, 'USER', 1000),   -- Gold Coins
(1, 2, 'USER', 100),    -- Diamonds
(1, 3, 'USER', 500);    -- Loyalty Points

-- Baburao wallets
INSERT INTO wallets (user_id, asset_id, wallet_type, balance)
VALUES
(2, 1, 'USER', 500),    -- Gold Coins
(2, 2, 'USER', 50),     -- Diamonds
(2, 3, 'USER', 200);    -- Loyalty Points


-- SYSTEM WALLETS
-- Gold Coins system wallets
INSERT INTO wallets (user_id, asset_id, wallet_type, system_account_type, balance)
VALUES
(NULL, 1, 'SYSTEM', 'TREASURY', 1000000),
(NULL, 1, 'SYSTEM', 'REVENUE', 0),
(NULL, 1, 'SYSTEM', 'EYC', 0);

-- Diamonds system wallets
INSERT INTO wallets (user_id, asset_id, wallet_type, system_account_type, balance)
VALUES
(NULL, 2, 'SYSTEM', 'TREASURY', 500000),
(NULL, 2, 'SYSTEM', 'REVENUE', 0),
(NULL, 2, 'SYSTEM', 'EYC', 0);

-- Loyalty Points system wallets
INSERT INTO wallets (user_id, asset_id, wallet_type, system_account_type, balance)
VALUES
(NULL, 3, 'SYSTEM', 'TREASURY', 2000000),
(NULL, 3, 'SYSTEM', 'REVENUE', 0),
(NULL, 3, 'SYSTEM', 'EYC', 0);