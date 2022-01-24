DROP TABLE IF EXISTS contact_list, comments, transactions, expenses, users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    description VARCHAR(50) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_balance DECIMAL(18,2) NOT NULL,
    notes VARCHAR(250)
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses (id),
    lender_id INTEGER NOT NULL,
    FOREIGN KEY (lender_id) REFERENCES users (id),
    borrower_id INTEGER  NOT NULL,
    FOREIGN KEY (borrower_id) REFERENCES users (id),
    balance DECIMAL(18,2) NOT NULL
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses (id),
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    comment VARCHAR(250) NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_list (
    id SERIAL PRIMARY KEY,
    list_owner_id INTEGER NOT NULL,
    FOREIGN KEY (list_owner_id) REFERENCES users (id),
    contact_id INTEGER NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES users (id)
);