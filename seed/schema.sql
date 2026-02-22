-- users
CREATE TABLE
  users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW ()
  );

-- assets
CREATE TABLE
  assets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW ()
  );

-- wallets
CREATE TABLE
  wallets (
    id BIGSERIAL PRIMARY KEY,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    user_id BIGINT NULL, -- NULL allowed because: SYSTEM wallets may not belong to a user
    asset_id BIGINT NOT NULL,
    wallet_type VARCHAR(20) NOT NULL CHECK (wallet_type IN ('USER', 'SYSTEM')),
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW (),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES assets (id),
    -- prevents duplicate wallet per user per asset
    -- CONSTRAINT unique_user_asset UNIQUE (user_id, asset_id)
    CONSTRAINT wallet_type_user_check CHECK (
      (
        wallet_type = 'USER'
        AND user_id IS NOT NULL
      )
      OR (
        wallet_type = 'SYSTEM'
        AND user_id IS NULL
      )
    )
  );

-- ledger entries
CREATE TABLE
  ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    -- transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('TOPUP', 'BONUS', 'SPEND')),
    -- transaction_type VARCHAR(30) NOT NULL CHECK ((transaction_type IN ('TOPUP','BONUS') AND amount > 0) OR (transaction_type = 'SPEND' AND amount < 0)),
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('TOPUP', 'BONUS', 'SPEND')),
    amount BIGINT NOT NULL,
    CONSTRAINT ledger_amount_sign_check CHECK (
      (
        transaction_type IN ('TOPUP', 'BONUS')
        AND amount > 0
      )
      OR (
        transaction_type = 'SPEND'
        AND amount < 0
      )
    ),
    reference_id VARCHAR(100) NOT NULL UNIQUE,    --- reference_id : idempotency key. for checking of duplicate requests
    created_at TIMESTAMP NOT NULL DEFAULT NOW (),
    CONSTRAINT fk_wallet FOREIGN KEY (wallet_id) REFERENCES wallets (id)
  );

-- indexes
-- CREATE INDEX idx_wallet_user_asset ON wallets (user_id, asset_id);
CREATE INDEX idx_ledger_Wallet_id ON ledger_entries (wallet_id);

-- CREATE INDEX idx_ledger_reference_id ON ledger_entries (reference_id);
-- unique user wallet per asset
CREATE UNIQUE INDEX unique_user_asset_wallet ON wallets (user_id, asset_id)
WHERE
  wallet_type = 'USER';

CREATE UNIQUE INDEX unique_system_asset_wallet ON wallets (asset_id)
WHERE
  wallet_type = 'SYSTEM'